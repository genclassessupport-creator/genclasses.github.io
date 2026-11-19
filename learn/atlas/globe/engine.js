// Globe scene: earth texture, flow tubes, camera and picking. UI wiring is in ui.js.
const container = document.getElementById('globe-container');
const labelsLayer = document.getElementById('labels-layer');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x020611, 1);
container.appendChild(renderer.domElement);

// Lighting (Sun + Ambient + Rim)
const ambientLight = new THREE.AmbientLight(0x88a8d8, 0.72);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff6e5, 1.35);
sunLight.position.set(5, 3, 5);
scene.add(sunLight);

const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
rimLight.position.set(-5, -2, -4);
scene.add(rimLight);

// Spherical coordinate helper matching Three.js SphereGeometry UV mapping
function latLonToVec3(lat, lon, r) {
  const radius = r === undefined ? 1.0 : r;
  const phi = (lon + 180) * (Math.PI / 180);
  const theta = (90 - lat) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Starfield Background
function createStarfield() {
  const starCount = 1800;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 18 + Math.random() * 28;
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const tint = Math.random();
    colors[i * 3] = tint > 0.7 ? 0.85 : 0.95;
    colors[i * 3 + 1] = tint > 0.7 ? 0.92 : 0.95;
    colors[i * 3 + 2] = tint < 0.3 ? 0.85 : 1.0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0.85 });
  scene.add(new THREE.Points(geo, mat));
}
createStarfield();

// Earth Group
const earthGroup = new THREE.Group();
scene.add(earthGroup);

// Base Earth Sphere (initially styled ocean + grid, upgraded as soon as TopoJSON loads)
const earthGeo = new THREE.SphereGeometry(1.0, 72, 48);
const earthCanvas = document.createElement('canvas');
earthCanvas.width = 2048;
earthCanvas.height = 1024;
const specCanvas = document.createElement('canvas');
specCanvas.width = 1024;
specCanvas.height = 512;

const earthTexture = new THREE.CanvasTexture(earthCanvas);
const specTexture = new THREE.CanvasTexture(specCanvas);

const earthMat = new THREE.MeshPhongMaterial({
  map: earthTexture,
  specularMap: specTexture,
  specular: new THREE.Color(0x285c8a),
  shininess: 22
});
const earthMesh = new THREE.Mesh(earthGeo, earthMat);
earthGroup.add(earthMesh);

// Subtle Drifting Clouds Sphere
function createCloudLayer() {
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 1024;
  cCanvas.height = 512;
  const cctx = cCanvas.getContext('2d');
  cctx.clearRect(0, 0, 1024, 512);
  for (let i = 0; i < 240; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const rx = 18 + Math.random() * 65;
    const ry = 5 + Math.random() * 16;
    const grad = cctx.createRadialGradient(x, y, 2, x, y, rx);
    grad.addColorStop(0, 'rgba(255,255,255,0.22)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    cctx.fillStyle = grad;
    cctx.beginPath();
    cctx.ellipse(x, y, rx, ry, (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
    cctx.fill();
  }
  const tex = new THREE.CanvasTexture(cCanvas);
  const geo = new THREE.SphereGeometry(1.006, 48, 32);
  const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, opacity: 0.32, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  earthGroup.add(mesh);
  return mesh;
}
const cloudMesh = createCloudLayer();

// Atmospheric Fresnel Glow Halo Shader
function createAtmosphere() {
  const atmoGeo = new THREE.SphereGeometry(1.09, 64, 48);
  const atmoMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
        gl_FragColor = vec4(0.22, 0.62, 1.0, 1.0) * intensity * 1.15;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(atmoGeo, atmoMat);
  earthGroup.add(mesh);
}
createAtmosphere();

// Graticule (Equator, Tropics, Polar Circles, Meridians)
const graticuleGroup = new THREE.Group();
earthGroup.add(graticuleGroup);

function buildGraticule() {
  const addLatLine = (lat, color, opacity) => {
    const pts = [];
    for (let lon = -180; lon <= 180; lon += 3) {
      pts.push(latLonToVec3(lat, lon, 1.004));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    graticuleGroup.add(new THREE.Line(geo, mat));
  };
  const addLonLine = (lon, color, opacity) => {
    const pts = [];
    for (let lat = -85; lat <= 85; lat += 3) {
      pts.push(latLonToVec3(lat, lon, 1.004));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    graticuleGroup.add(new THREE.Line(geo, mat));
  };

  // Equator
  addLatLine(0, 0xfbbf24, 0.42);
  // Tropics of Cancer & Capricorn
  addLatLine(23.5, 0xf97316, 0.28);
  addLatLine(-23.5, 0xf97316, 0.28);
  // Arctic & Antarctic Circles
  addLatLine(66.5, 0x38bdf8, 0.25);
  addLatLine(-66.5, 0x38bdf8, 0.25);
  // Subtle 30-deg meridians
  for (let lon = -150; lon <= 180; lon += 30) {
    addLonLine(lon, 0x64748b, lon === 0 ? 0.28 : 0.12);
  }
}
buildGraticule();

// =========================================================================
// 5. PROCEDURAL SATELLITE EARTH TEXTURE FROM REAL WORLD-ATLAS TOPOJSON
// =========================================================================
function drawOceanBase(ctx, w, h) {
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0.0, '#0a1f3d');
  oceanGrad.addColorStop(0.18, '#082347');
  oceanGrad.addColorStop(0.5, '#0b3563');
  oceanGrad.addColorStop(0.82, '#082347');
  oceanGrad.addColorStop(1.0, '#0a1f3d');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle bathymetric ocean texture
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 40 + Math.random() * 140;
    const g = ctx.createRadialGradient(x, y, 5, x, y, r);
    g.addColorStop(0, 'rgba(20, 95, 145, 0.14)');
    g.addColorStop(1, 'rgba(6, 20, 44, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderEarthFromGeoJSON(landGeo) {
  const w = earthCanvas.width;
  const h = earthCanvas.height;
  const ctx = earthCanvas.getContext('2d');
  const sctx = specCanvas.getContext('2d');

  // 1. Ocean Base
  drawOceanBase(ctx, w, h);

  // Specular map: white = reflective ocean, dark = matte land
  sctx.fillStyle = '#c8c8c8';
  sctx.fillRect(0, 0, specCanvas.width, specCanvas.height);

  const projectX = (lon) => ((lon + 180) / 360) * w;
  const projectY = (lat) => ((90 - lat) / 180) * h;

  const traceRings = (targetCtx, geom, scaleX, scaleY) => {
    const drawPoly = (coords) => {
      coords.forEach((ring) => {
        if (!ring || ring.length < 2) return;
        targetCtx.moveTo(((ring[0][0] + 180) / 360) * scaleX, ((90 - ring[0][1]) / 180) * scaleY);
        for (let i = 1; i < ring.length; i++) {
          const prevLon = ring[i - 1][0];
          const curLon = ring[i][0];
          const x = ((curLon + 180) / 360) * scaleX;
          const y = ((90 - ring[i][1]) / 180) * scaleY;
          // Avoid antimeridian horizontal streak
          if (Math.abs(curLon - prevLon) > 180) {
            targetCtx.moveTo(x, y);
          } else {
            targetCtx.lineTo(x, y);
          }
        }
        targetCtx.closePath();
      });
    };
    if (geom.type === 'Polygon') drawPoly(geom.coordinates);
    else if (geom.type === 'MultiPolygon') geom.coordinates.forEach(drawPoly);
  };

  // 2. Continental Shelf Glow + Land Fill
  ctx.save();
  ctx.beginPath();
  landGeo.features.forEach((f) => traceRings(ctx, f.geometry, w, h));

  // Coastal shallow water glow
  ctx.shadowColor = 'rgba(34, 184, 215, 0.55)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#25523b';
  ctx.fill();
  ctx.shadowBlur = 0;

  // Clip to exact continents for realistic biome painting
  ctx.clip();

  // Latitude biome base
  const landGrad = ctx.createLinearGradient(0, 0, 0, h);
  landGrad.addColorStop(0.0, '#dce8f2');  // Arctic Ice
  landGrad.addColorStop(0.14, '#8aa399'); // Tundra
  landGrad.addColorStop(0.26, '#2f5d40'); // Boreal/Temperate
  landGrad.addColorStop(0.39, '#556b3d'); // Subtropical
  landGrad.addColorStop(0.50, '#1f5e36'); // Equatorial Rainforest
  landGrad.addColorStop(0.62, '#5a6e3e'); // Southern Subtropical
  landGrad.addColorStop(0.76, '#3b5c42'); // Southern Temperate
  landGrad.addColorStop(0.86, '#cfdce8'); // Antarctic Edge
  landGrad.addColorStop(1.0, '#eaf2f8');  // Antarctica Ice
  ctx.fillStyle = landGrad;
  ctx.fillRect(0, 0, w, h);

  // Major Desert & Highland Regional Biomes
  const paintBiome = (lat, lon, rxDeg, ryDeg, color) => {
    const cx = projectX(lon);
    const cy = projectY(lat);
    const rx = (rxDeg / 360) * w;
    const ry = (ryDeg / 180) * h;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    const grad = ctx.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Deserts (Sahara, Arabia, Thar, Gobi, Outback, Kalahari, Atacama, SW USA)
  paintBiome(23, 12, 28, 10, 'rgba(198, 162, 104, 0.88)');   // Sahara
  paintBiome(23, 45, 14, 8, 'rgba(196, 158, 100, 0.85)');    // Arabian
  paintBiome(27, 71, 6, 5, 'rgba(186, 152, 96, 0.72)');      // Thar
  paintBiome(42, 100, 16, 6, 'rgba(176, 148, 104, 0.72)');   // Gobi / Tarim
  paintBiome(-25, 132, 18, 9, 'rgba(188, 124, 78, 0.85)');   // Australian Outback
  paintBiome(-24, 20, 8, 6, 'rgba(186, 148, 96, 0.78)');     // Kalahari / Namib
  paintBiome(-23, -69, 4, 8, 'rgba(182, 144, 94, 0.78)');    // Atacama
  paintBiome(34, -112, 9, 6, 'rgba(178, 140, 92, 0.72)');    // SW USA / Sonoran

  // Major Mountain Reliefs (Himalayas, Rockies, Andes, Alps)
  paintBiome(31, 86, 14, 5, 'rgba(218, 226, 235, 0.65)');    // Himalayas / Tibet
  paintBiome(46, -112, 8, 12, 'rgba(170, 162, 150, 0.52)');  // Rockies
  paintBiome(-22, -68, 4, 20, 'rgba(176, 166, 155, 0.55)');  // Andes
  paintBiome(46.5, 10, 5, 2.5, 'rgba(220, 228, 236, 0.65)'); // Alps


  ctx.restore();

  // Crisp glowing coastline stroke
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  landGeo.features.forEach((f) => traceRings(ctx, f.geometry, w, h));
  ctx.stroke();

  // Update specular map (matte land)
  sctx.beginPath();
  landGeo.features.forEach((f) => traceRings(sctx, f.geometry, specCanvas.width, specCanvas.height));
  sctx.fillStyle = '#181818';
  sctx.fill();

  earthTexture.needsUpdate = true;
  specTexture.needsUpdate = true;

  // 3. Also add subtle 3D coastline LineSegments on the sphere for razor-sharp zoom
  const linePositions = [];
  const addRing3D = (ring) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      if (Math.abs(p1[0] - p2[0]) > 180) continue;
      const v1 = latLonToVec3(p1[1], p1[0], 1.002);
      const v2 = latLonToVec3(p2[1], p2[0], 1.002);
      linePositions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    }
  };
  landGeo.features.forEach((f) => {
    const g = f.geometry;
    if (g.type === 'Polygon') g.coordinates.forEach(addRing3D);
    else if (g.type === 'MultiPolygon') g.coordinates.forEach((p) => p.forEach(addRing3D));
  });
  const coastGeo = new THREE.BufferGeometry();
  coastGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  const coastMat = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.34 });
  earthGroup.add(new THREE.LineSegments(coastGeo, coastMat));
}

// Draw initial ocean immediately so globe is never blank
drawOceanBase(earthCanvas.getContext('2d'), earthCanvas.width, earthCanvas.height);
earthTexture.needsUpdate = true;

// Load real world-atlas TopoJSON from jsDelivr
fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json')
  .then((res) => {
    if (!res.ok) throw new Error('Atlas fetch failed');
    return res.json();
  })
  .then((world) => {
    const land = topojson.feature(world, world.objects.land);
    renderEarthFromGeoJSON(land);
    const badge = document.getElementById('loading-badge');
    if (badge) {
      badge.style.opacity = '0';
      setTimeout(() => { badge.style.display = 'none'; }, 500);
    }
  })
  .catch(() => {
    const lt = document.getElementById('loading-text');
    if (lt) lt.textContent = 'नक्शा लोड नहीं हुआ · Map did not load';
    setTimeout(() => {
      const badge = document.getElementById('loading-badge');
      if (badge) badge.style.display = 'none';
    }, 2500);
  });

// =========================================================================
// 6. BUILD 3D ANIMATED FLOWS (WINDS, OCEAN CURRENTS & HOTSPOTS)
// =========================================================================
const flowsGroup = new THREE.Group();
earthGroup.add(flowsGroup);

const flowVisuals = new Map(); // id -> { item, group, tubeMesh, tubeMat, curve, particles, markerMesh, ringMesh, midVec }
const pickableMeshes = [];

function getFlowColor(item) {
  if (item.category === 'wind') {
    return item.temp === 'warm' ? 0xff8c1a : 0x38bdf8;
  }
  if (item.temp === 'seasonal') return 0xc084fc;
  return item.temp === 'warm' ? 0xff4238 : 0x00e5ff;
}

// Build spherical surface-hugging curve
function buildSphericalCurve(coords, baseRadius, liftArc) {
  const rawPts = coords.map(([lat, lon]) => latLonToVec3(lat, lon, baseRadius));
  const rawCurve = new THREE.CatmullRomCurve3(rawPts, false, 'centripetal', 0.45);
  const samples = Math.max(24, coords.length * 10);
  const surfacePts = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pt = rawCurve.getPoint(t);
    // Slight altitude arch for local winds so they clearly float in the atmosphere above ocean currents
    const arch = liftArc ? Math.sin(t * Math.PI) * liftArc : 0;
    pt.normalize().multiplyScalar(baseRadius + arch);
    surfacePts.push(pt);
  }
  return new THREE.CatmullRomCurve3(surfacePts);
}

const arrowConeGeo = new THREE.ConeGeometry(0.014, 0.042, 8);
arrowConeGeo.rotateX(Math.PI / 2); // Align cone tip along +Z for lookAt()

const windDartGeo = new THREE.ConeGeometry(0.012, 0.046, 6);
windDartGeo.rotateX(Math.PI / 2);

const markerGeo = new THREE.SphereGeometry(0.02, 16, 16);
const ringGeo = new THREE.RingGeometry(0.026, 0.036, 24);

GEO_ITEMS.forEach((item) => {
  const group = new THREE.Group();
  const colorHex = getFlowColor(item);
  const isWind = item.category === 'wind';
  const baseRadius = isWind ? 1.032 : 1.013;
  const liftArc = isWind ? 0.024 : 0.002;
  const curve = buildSphericalCurve(item.coords, baseRadius, liftArc);

  // Glowing 3D Stream Tube
  const tubeRadius = isWind ? 0.0055 : 0.0075;
  const tubeGeo = new THREE.TubeGeometry(curve, Math.max(36, item.coords.length * 14), tubeRadius, 8, false);
  const tubeMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: isWind ? 0.62 : 0.68
  });
  const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
  tubeMesh.userData = { itemId: item.id };
  group.add(tubeMesh);
  pickableMeshes.push(tubeMesh);

  // Animated Flowing 3D Arrowheads / Wind Darts
  const particleCount = item.id === 'curr-acc' ? 14 : (isWind ? 4 : 6);
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95
    });
    const pColor = new THREE.Color(colorHex).lerp(new THREE.Color(0xffffff), 0.35);
    pMat.color.copy(pColor);
    const mesh = new THREE.Mesh(isWind ? windDartGeo : arrowConeGeo, pMat);
    group.add(mesh);
    particles.push({ mesh, offset: i / particleCount });
  }

  // Midpoint Clickable Pin & Selection Ring
  const midVec = curve.getPoint(0.5);
  const markerMat = new THREE.MeshBasicMaterial({ color: colorHex });
  const markerMesh = new THREE.Mesh(markerGeo, markerMat);
  markerMesh.position.copy(midVec);
  markerMesh.userData = { itemId: item.id };
  group.add(markerMesh);
  pickableMeshes.push(markerMesh);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.0
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.copy(midVec).multiplyScalar(1.003);
  ringMesh.lookAt(midVec.clone().multiplyScalar(2));
  group.add(ringMesh);

  flowsGroup.add(group);
  flowVisuals.set(item.id, {
    item,
    group,
    tubeMesh,
    tubeMat,
    curve,
    particles,
    markerMesh,
    ringMesh,
    midVec
  });
});

// Convergence Fishing/Fog Hotspots
const hotspotVisuals = [];
HOTSPOTS.forEach((hs) => {
  const pos = latLonToVec3(hs.lat, hs.lon, 1.018);
  const hRingGeo = new THREE.RingGeometry(0.024, 0.036, 24);
  const hRingMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85
  });
  const hMesh = new THREE.Mesh(hRingGeo, hRingMat);
  hMesh.position.copy(pos);
  hMesh.lookAt(pos.clone().multiplyScalar(2));
  hMesh.userData = { itemId: hs.focusId };
  flowsGroup.add(hMesh);
  pickableMeshes.push(hMesh);
  hotspotVisuals.push({ hs, mesh: hMesh, pos });
});

// Create Floating HTML Labels for Items
const labelElements = new Map();
GEO_ITEMS.forEach((item) => {
  const el = document.createElement('button');
  el.type = 'button';
  let cls = 'globe-label ';
  if (item.category === 'wind') cls += item.temp === 'warm' ? 'label-wind-warm' : 'label-wind-cold';
  else if (item.temp === 'seasonal') cls += 'label-curr-seasonal';
  else cls += item.temp === 'warm' ? 'label-curr-warm' : 'label-curr-cold';
  el.className = cls;
  el.textContent = item.name;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!state.quizMode) selectItem(item.id, true);
  });
  labelsLayer.appendChild(el);
  labelElements.set(item.id, el);
});

// =========================================================================
// 7. CAMERA ORBIT, SMOOTH FLY-TO & RAYCAST PICKING
// =========================================================================
const camState = {
  lat: 22,
  lon: 72,
  dist: 2.95,
  targetLat: 22,
  targetLon: 72,
  targetDist: 2.95,
  isDragging: false,
  dragMoved: false,
  lastX: 0,
  lastY: 0,
  flying: false
};

function updateCameraFromSpherical() {
  camState.lat += (camState.targetLat - camState.lat) * 0.1;
  // Shortest angular path for longitude
  let dLon = camState.targetLon - camState.lon;
  while (dLon > 180) dLon -= 360;
  while (dLon < -180) dLon += 360;
  camState.lon += dLon * 0.1;
  camState.dist += (camState.targetDist - camState.dist) * 0.1;

  if (Math.abs(camState.targetLat - camState.lat) < 0.15 && Math.abs(dLon) < 0.15) {
    camState.flying = false;
  }
  camera.position.copy(latLonToVec3(camState.lat, camState.lon, camState.dist));
  camera.lookAt(0, 0, 0);
}

function flyToLatLon(lat, lon, dist) {
  camState.targetLat = Math.max(-75, Math.min(75, lat));
  camState.targetLon = lon;
  if (dist !== undefined) camState.targetDist = dist;
  camState.flying = true;
  if (state.autoRotate) {
    state.autoRotate = false;
    syncControlButtons();
  }
}

function getMidLatLon(coords) {
  const mid = coords[Math.floor(coords.length / 2)];
  return { lat: mid[0], lon: mid[1] };
}

// Pointer / Touch Orbit Controls
const domEl = renderer.domElement;
domEl.addEventListener('pointerdown', (e) => {
  camState.isDragging = true;
  camState.dragMoved = false;
  camState.lastX = e.clientX;
  camState.lastY = e.clientY;
  camState.flying = false;
});

window.addEventListener('pointermove', (e) => {
  if (!camState.isDragging) return;
  const dx = e.clientX - camState.lastX;
  const dy = e.clientY - camState.lastY;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
    camState.dragMoved = true;
    if (state.autoRotate) {
      state.autoRotate = false;
      syncControlButtons();
    }
  }
  camState.lastX = e.clientX;
  camState.lastY = e.clientY;

  const sens = 0.22 * (camState.dist / 2.8);
  camState.targetLon -= dx * sens;
  camState.targetLat = Math.max(-80, Math.min(80, camState.targetLat + dy * sens));
});

window.addEventListener('pointerup', (e) => {
  if (!camState.isDragging) return;
  const wasClick = !camState.dragMoved;
  camState.isDragging = false;
  if (wasClick && !state.quizMode) {
    handleGlobeClick(e.clientX, e.clientY);
  }
});

domEl.addEventListener('wheel', (e) => {
  e.preventDefault();
  camState.targetDist = Math.max(1.55, Math.min(4.6, camState.targetDist + e.deltaY * 0.0018));
}, { passive: false });

const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();

function handleGlobeClick(clientX, clientY) {
  const rect = domEl.getBoundingClientRect();
  pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, camera);
  const visiblePickables = pickableMeshes.filter((m) => m.parent && m.parent.visible);
  const hits = raycaster.intersectObjects(visiblePickables, false);
  if (hits.length > 0 && hits[0].object.userData.itemId) {
    selectItem(hits[0].object.userData.itemId, true);
  }
}
