// Lists, detail card, quiz, controls and the animation loop for the globe built in engine.js.
const el = (id) => document.getElementById(id);
const dict = () => TEXT[state.lang];
const itemById = (id) => GEO_ITEMS.find((i) => i.id === id);
const REGIONS = ['North America', 'South America', 'Europe', 'Africa', 'Asia', 'Oceania', 'Atlantic Ocean', 'Pacific Ocean', 'Indian Ocean', 'Southern Ocean'];
const cssColor = (item) => '#' + getFlowColor(item).toString(16).padStart(6, '0');

function getFilteredItems() {
  const q = state.search.trim().toLowerCase();
  return GEO_ITEMS.filter((item) => {
    if (state.layer === 'winds' && item.category !== 'wind') return false;
    if (state.layer === 'currents' && item.category !== 'current') return false;
    if (state.tempFilter !== 'all' && item.temp !== state.tempFilter) return false;
    if (state.regionFilter !== 'all' && item.region !== state.regionFilter) return false;
    if (!q) return true;
    const hindi = HI[item.id] || {};
    return [item.name, item.nickname, item.subRegion, item.region, hindi.n, hindi.k, hindi.s].join(' ').toLowerCase().includes(q);
  });
}

function update3DVisibility() {
  const filtered = new Set(getFilteredItems().map((i) => i.id));
  const activeId = state.quizMode && state.quiz.currentItem ? state.quiz.currentItem.id : state.selectedId;
  flowVisuals.forEach((vis, id) => {
    const visible = state.quizMode ? id === activeId : filtered.has(id);
    vis.group.visible = visible;
    if (!visible) return;
    const selected = id === activeId;
    vis.tubeMat.opacity = selected ? 0.96 : (activeId ? 0.24 : (vis.item.category === 'wind' ? 0.62 : 0.68));
    vis.markerMesh.scale.setScalar(selected ? 1.55 : 1);
    vis.ringMesh.material.opacity = selected ? 0.95 : 0;
  });
  hotspotVisuals.forEach((h) => { h.mesh.visible = !state.quizMode && state.layer !== 'winds'; });
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderSidebarList() {
  const list = el('items-list'), items = getFilteredItems(), t = dict();
  el('item-count').textContent = items.length;
  list.replaceChildren();
  if (!items.length) { list.append(make('div', 'empty', t.noMatch)); return; }
  for (const item of items) {
    const button = make('button', 'item' + (item.id === state.selectedId ? ' selected' : ''));
    button.type = 'button';
    const dot = make('span', 'dot'); dot.style.setProperty('--c', cssColor(item));
    const text = make('span', 'txt'), row = make('span', 'row');
    row.append(make('b', '', tx(item, 'name')), make('span', 'tag', (item.category === 'wind' ? t.wind : t.current) + ' · ' + t[item.temp]));
    text.append(row, make('span', 'nick', tx(item, 'nickname')), make('span', 'where', tx(item, 'subRegion')));
    button.append(dot, text);
    button.onclick = () => {
      selectItem(item.id, true);
      if (window.innerWidth < 820) { state.sidebarOpen = false; syncSidebar(); }
    };
    list.append(button);
  }
}

function renderHotspots() {
  const box = el('hotspots-list');
  box.replaceChildren();
  for (const hs of HOTSPOTS) {
    const hindi = state.lang === 'hi' && HI_HOTSPOTS[hs.id];
    const button = make('button', '', '🐟 ' + (hindi ? hindi.n : hs.name));
    button.type = 'button';
    button.onclick = () => {
      if (state.layer === 'winds') { state.layer = 'all'; syncLayerButtons(); }
      selectItem(hs.focusId, false);
      flyToLatLon(hs.lat, hs.lon, 2.25);
      showToast('🐟 ' + (hindi ? hindi.n + ': ' + hindi.d : hs.name + ': ' + hs.desc));
      if (window.innerWidth < 820) { state.sidebarOpen = false; syncSidebar(); }
    };
    box.append(button);
  }
}

function selectItem(id, fly) {
  const item = itemById(id);
  if (!item) return;
  state.selectedId = id;
  renderInspector(item);
  renderSidebarList();
  update3DVisibility();
  if (fly) {
    const mid = getMidLatLon(item.coords);
    flyToLatLon(mid.lat, mid.lon, item.id === 'curr-acc' ? 3.2 : 2.3);
  }
}

function renderInspector(item) {
  const card = el('inspector-card'), t = dict();
  card.hidden = !item || state.quizMode;
  fitCamera();
  if (card.hidden) return;
  const cat = el('insp-category-badge'), temp = el('insp-temp-badge');
  cat.textContent = item.category === 'wind' ? t.localWind : t.oceanCurrent;
  cat.className = 'badge ' + item.category;
  temp.textContent = item.temp === 'seasonal' ? (state.season === 'summer' ? t.summerBadge : t.winterBadge) : t[item.temp];
  temp.className = 'badge ' + item.temp;
  el('insp-title').textContent = tx(item, 'name');
  el('insp-nickname').textContent = tx(item, 'nickname');
  el('insp-region').textContent = tx(item, 'subRegion');
  el('insp-direction').textContent = item.id === 'curr-somali' ? (state.season === 'summer' ? t.summerDir : t.winterDir) : tx(item, 'direction');
  el('insp-mechanism').textContent = tx(item, 'mechanism');
  el('insp-impact').textContent = tx(item, 'impact');
  el('insp-exam').textContent = tx(item, 'examTip');
}

// Quiz: one flow is lit on the globe, the learner names it.
function startQuiz() {
  state.quizMode = true;
  Object.assign(state.quiz, { score: 0, total: 0, streak: 0 });
  el('inspector-card').hidden = true;
  el("quiz-card").hidden = false;
  fitCamera();
  if (window.innerWidth < 820) { state.sidebarOpen = false; syncSidebar(); }
  nextQuizQuestion();
}

function closeQuiz() {
  state.quizMode = false;
  el("quiz-card").hidden = true;
  fitCamera();
  update3DVisibility();
  if (state.selectedId) renderInspector(itemById(state.selectedId));
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function nextQuizQuestion() {
  const previous = state.quiz.currentItem;
  let target;
  do target = GEO_ITEMS[Math.floor(Math.random() * GEO_ITEMS.length)]; while (target === previous);
  // Wrong choices come from the same family, so a wind is never offered against a current.
  const others = shuffle(GEO_ITEMS.filter((i) => i.category === target.category && i.id !== target.id)).slice(0, 3);
  state.quiz.currentItem = target;
  state.quiz.options = shuffle([target, ...others]);
  state.quiz.answered = false;
  el('quiz-feedback').hidden = true;
  el('btn-quiz-next').hidden = true;
  renderQuiz();
  update3DVisibility();
  const mid = getMidLatLon(target.coords);
  flyToLatLon(mid.lat, mid.lon, target.id === 'curr-acc' ? 3.2 : 2.35);
}

function renderQuiz(chosenId) {
  const t = dict(), quiz = state.quiz, target = quiz.currentItem;
  if (!target) return;
  const kind = target.category === 'wind' ? t.localWind : t.oceanCurrent;
  el('quiz-badge').textContent = kind + ' · ' + regionName(target.region);
  el('quiz-question').textContent = t.quizAsk(t[target.temp].toLowerCase(), kind.toLowerCase(), tx(target, 'subRegion'), tx(target, 'impact'));
  const box = el('quiz-options');
  if (chosenId === undefined) chosenId = box.dataset.chosen || '';
  box.dataset.chosen = quiz.answered ? chosenId : '';
  box.replaceChildren();
  for (const option of quiz.options) {
    const button = make('button', '', tx(option, 'name'));
    button.type = 'button';
    if (quiz.answered) {
      button.disabled = true;
      if (option.id === target.id) button.className = 'right';
      else if (option.id === chosenId) button.className = 'wrong';
    } else button.onclick = () => handleQuizAnswer(option.id);
    box.append(button);
  }
  if (quiz.answered) {
    const ok = chosenId === target.id, feedback = el('quiz-feedback');
    feedback.hidden = false;
    feedback.className = ok ? 'right' : 'wrong';
    feedback.replaceChildren(make('strong', '', ok ? '✅ ' + t.correct : '❌ ' + t.answerIs + tx(target, 'name')), document.createElement('br'), tx(target, 'examTip'));
  }
  el('quiz-score').textContent = quiz.score;
  el('quiz-total').textContent = quiz.total;
  el('quiz-streak').textContent = quiz.streak;
}

function handleQuizAnswer(chosenId) {
  const quiz = state.quiz;
  if (quiz.answered) return;
  quiz.answered = true;
  quiz.total += 1;
  if (chosenId === quiz.currentItem.id) { quiz.score += 1; quiz.streak += 1; } else quiz.streak = 0;
  el('btn-quiz-next').hidden = false;
  renderQuiz(chosenId);
}

let toastTimer = 0;
function showToast(message) {
  const toast = el('toast');
  toast.textContent = message;
  toast.style.opacity = 1;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.style.opacity = 0; }, 4200);
}

function syncSidebar() { el('sidebar').classList.toggle('closed', !state.sidebarOpen); }
function syncLayerButtons() { document.querySelectorAll('.layer-btn').forEach((b) => b.classList.toggle('on', b.dataset.layer === state.layer)); }
function syncTempButtons() { document.querySelectorAll('.temp-btn').forEach((b) => b.classList.toggle('on', b.dataset.temp === state.tempFilter)); }
function syncControlButtons() {
  el('btn-play-pause').textContent = state.playing ? '⏸' : '▶';
  el('btn-autorotate').classList.toggle('on', state.autoRotate);
  el('btn-labels').classList.toggle('on', state.showLabels);
  el('btn-grid').classList.toggle('on', state.showGrid);
  graticuleGroup.visible = state.showGrid;
}

function applyLanguage() {
  const t = dict();
  document.documentElement.lang = state.lang;
  document.title = '3D ' + t.title + ' · ' + t.subtitle + ' · Gen Classes';
  document.querySelectorAll('[data-t]').forEach((node) => { node.textContent = t[node.dataset.t]; });
  el('back-link').textContent = t.back;
  el('btn-lang').textContent = t.langBtn;
  el('search-input').placeholder = t.search;
  el('season-label').textContent = state.season === 'summer' ? t.summerLabel : t.winterLabel;
  const select = el('region-select');
  select.replaceChildren(new Option(t.allRegions, 'all'), ...REGIONS.map((r) => new Option(regionName(r), r)));
  select.value = state.regionFilter;
  labelElements.forEach((label, id) => { label.textContent = tx(itemById(id), 'name'); });
  renderSidebarList();
  renderHotspots();
  if (state.selectedId && !state.quizMode) renderInspector(itemById(state.selectedId));
  if (state.quizMode) renderQuiz();
}

function refilter() { renderSidebarList(); update3DVisibility(); }

el('btn-toggle-sidebar').onclick = () => { state.sidebarOpen = !state.sidebarOpen; syncSidebar(); };
document.querySelectorAll('.layer-btn').forEach((b) => { b.onclick = () => { state.layer = b.dataset.layer; syncLayerButtons(); refilter(); }; });
document.querySelectorAll('.temp-btn').forEach((b) => { b.onclick = () => { state.tempFilter = b.dataset.temp; syncTempButtons(); refilter(); }; });
el('region-select').onchange = (e) => { state.regionFilter = e.target.value; refilter(); };
el('search-input').oninput = (e) => { state.search = e.target.value; el('btn-clear-search').hidden = !state.search; refilter(); };
el('btn-clear-search').onclick = () => { state.search = el('search-input').value = ''; el('btn-clear-search').hidden = true; refilter(); };

el('btn-season').onclick = () => {
  state.season = state.season === 'summer' ? 'winter' : 'summer';
  el('season-icon').textContent = state.season === 'summer' ? '☀️' : '❄️';
  el('season-label').textContent = state.season === 'summer' ? dict().summerLabel : dict().winterLabel;
  if (state.quizMode) closeQuiz();
  if (state.layer === 'winds') { state.layer = 'all'; syncLayerButtons(); }
  selectItem('curr-somali', false);
  flyToLatLon(9, 58, 2.25);
  showToast(state.season === 'summer' ? dict().summerToast : dict().winterToast);
};

el('btn-lang').onclick = () => {
  state.lang = state.lang === 'en' ? 'hi' : 'en';
  try { localStorage.setItem('gen_lang', state.lang); } catch {}
  applyLanguage();
};

el('btn-quiz').onclick = () => (state.quizMode ? closeQuiz() : startQuiz());
el('btn-close-quiz').onclick = closeQuiz;
el('btn-quiz-next').onclick = nextQuizQuestion;
el('btn-quiz-hint').onclick = () => {
  if (!state.quiz.currentItem) return;
  const mid = getMidLatLon(state.quiz.currentItem.coords);
  flyToLatLon(mid.lat, mid.lon, 2.3);
};

function clearSelection() {
  state.selectedId = null;
  el('inspector-card').hidden = true;
  fitCamera();
  refilter();
}
el('btn-close-inspector').onclick = clearSelection;
el('btn-refocus').onclick = () => {
  const item = itemById(state.selectedId);
  if (!item) return;
  const mid = getMidLatLon(item.coords);
  flyToLatLon(mid.lat, mid.lon, 2.2);
};
function step(by) {
  const list = getFilteredItems();
  if (!list.length) return;
  const at = list.findIndex((i) => i.id === state.selectedId);
  selectItem(list[(at + by + list.length) % list.length].id, true);
}
el('btn-prev-item').onclick = () => step(-1);
el('btn-next-item').onclick = () => step(1);

el('btn-play-pause').onclick = () => { state.playing = !state.playing; syncControlButtons(); };
el('btn-autorotate').onclick = () => { state.autoRotate = !state.autoRotate; syncControlButtons(); };
el('btn-labels').onclick = () => { state.showLabels = !state.showLabels; syncControlButtons(); };
el('btn-grid').onclick = () => { state.showGrid = !state.showGrid; syncControlButtons(); };
el('btn-zoom-in').onclick = () => { camState.targetDist = Math.max(1.55, camState.targetDist - 0.35); };
el('btn-zoom-out').onclick = () => { camState.targetDist = Math.min(4.6, camState.targetDist + 0.35); };
el('btn-reset-view').onclick = () => {
  Object.assign(camState, { targetLat: 20, targetLon: 72, targetDist: 2.95 });
  state.autoRotate = true;
  syncControlButtons();
  clearSelection();
};
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (state.quizMode) closeQuiz(); else if (state.selectedId) clearSelection();
});

// Keep the whole globe inside tall, narrow screens by widening the vertical field of view.
function fitCamera() {
  const w = window.innerWidth, h = window.innerHeight, aspect = w / h;
  const half = Math.tan(21 * Math.PI / 180);
  camera.fov = aspect >= 1 ? 42 : Math.min(75, 2 * Math.atan(half / aspect) * 180 / Math.PI);
  camera.aspect = aspect;
  // On phones an open card covers the lower half, so the globe is drawn higher up.
  const cardOpen = !el("inspector-card").hidden || !el("quiz-card").hidden;
  if (w < 820 && cardOpen && !MINI) camera.setViewOffset(w, h, 0, Math.round(h * 0.2), w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
addEventListener('resize', fitCamera);

let animTime = 0, lastFrameTime = performance.now(), onScreen = true;
const tmpVec = new THREE.Vector3(), camDir = new THREE.Vector3(), midDir = new THREE.Vector3();
new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; }).observe(container);

function updateLabelsProjection() {
  const w = window.innerWidth, h = window.innerHeight;
  camDir.copy(camera.position).normalize();
  const showAny = state.showLabels && !state.quizMode;
  flowVisuals.forEach((vis, id) => {
    const label = labelElements.get(id);
    const facing = showAny && vis.group.visible ? midDir.copy(vis.midVec).normalize().dot(camDir) : 0;
    if (facing < 0.22) { label.style.display = 'none'; return; }
    tmpVec.copy(vis.midVec).project(camera);
    const x = (tmpVec.x * 0.5 + 0.5) * w, y = (-tmpVec.y * 0.5 + 0.5) * h;
    if (x < -40 || x > w + 40 || y < -20 || y > h + 20) { label.style.display = 'none'; return; }
    const selected = id === state.selectedId;
    label.style.display = 'block';
    label.style.left = x.toFixed(1) + 'px';
    label.style.top = y.toFixed(1) + 'px';
    label.style.opacity = selected ? 1 : Math.min(1, (facing - 0.18) * 1.6);
    label.classList.toggle('selected', selected);
  });
}

function animate(now) {
  requestAnimationFrame(animate);
  // Nothing is drawn while the globe is off screen; the small preview runs at half rate.
  if (!onScreen || document.hidden || (MINI && now - lastFrameTime < 30)) return;
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;
  if (state.playing) {
    animTime += dt * state.speed;
    cloudMesh.rotation.y += dt * 0.015 * state.speed;
  }
  if (state.autoRotate && !camState.isDragging && !camState.flying) camState.targetLon += dt * 6.5;
  updateCameraFromSpherical();

  const quizId = state.quizMode && state.quiz.currentItem ? state.quiz.currentItem.id : null;
  flowVisuals.forEach((vis) => {
    if (!vis.group.visible) return;
    const reverse = vis.item.id === 'curr-somali' && state.season === 'winter';
    const speed = vis.item.category === 'wind' ? 0.26 : (vis.item.id === 'curr-acc' ? 0.06 : 0.16);
    vis.particles.forEach((p) => {
      let t = (p.offset + animTime * speed) % 1;
      if (reverse) t = 1 - t;
      p.mesh.position.copy(vis.curve.getPointAt(Math.max(0.001, Math.min(0.999, t))));
      p.mesh.lookAt(vis.curve.getPointAt(reverse ? Math.max(0, t - 0.02) : Math.min(1, t + 0.02)));
      p.mesh.scale.setScalar(0.6 + 0.55 * Math.min(t * 7, (1 - t) * 7, 1));
    });
    if (vis.item.id === state.selectedId || vis.item.id === quizId) vis.ringMesh.scale.setScalar(1 + 0.35 * Math.sin(now * 0.006));
  });
  const pulse = 1 + 0.28 * Math.sin(now * 0.0045);
  hotspotVisuals.forEach((h) => { if (h.mesh.visible) h.mesh.scale.setScalar(pulse); });

  renderer.render(scene, camera);
  updateLabelsProjection();
}

if (MINI) {
  camState.dist = camState.targetDist = 2.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  container.style.pointerEvents = 'none';
}
fitCamera();
syncSidebar();
requestAnimationFrame(() => document.documentElement.classList.add("ready"));
syncLayerButtons();
syncTempButtons();
syncControlButtons();
applyLanguage();
update3DVisibility();
requestAnimationFrame(animate);
