const reflectionMotion = matchMedia('(prefers-reduced-motion: reduce)');
const glassIndex = 1.5;
const criticalDegrees = Math.asin(1 / glassIndex) * 180 / Math.PI;

function incidentDegrees(seconds, reduced) {
  if (reduced) return seconds < 23 ? 30 : seconds < 37 ? criticalDegrees : 55;
  function ease(start, end) {
    const u = Math.max(0, Math.min(1, (seconds - start) / (end - start)));
    return u * u * (3 - 2 * u);
  }
  return 30 + (criticalDegrees - 30) * ease(10, 23) + (55 - criticalDegrees) * ease(28, 37);
}

function reflectionScene() {
  const c = ctx, cx = 420, cy = 234, radius = 215;
  const reduced = reflectionMotion.matches;
  const degrees = incidentDegrees(time, reduced);
  const theta = degrees * Math.PI / 180;
  const dx = Math.sin(theta), dy = Math.cos(theta);
  const transmitted = degrees <= criticalDegrees + 1e-8;
  const refracted = Math.asin(Math.min(1, glassIndex * dx));
  c.save();
  c.setTransform(canvas.width/900, 0, 0, canvas.height/530, 0, 0);
  atmosphere(c, false);

  // A semicircular block keeps the incoming ray normal to the curved entrance.
  const glass = c.createLinearGradient(0, cy, 0, cy + radius);
  glass.addColorStop(0, '#396c7a'); glass.addColorStop(.72, '#244955'); glass.addColorStop(1, '#659297');
  c.beginPath(); c.arc(cx, cy, radius, 0, Math.PI); c.closePath();
  c.fillStyle = glass; c.fill(); c.strokeStyle = '#a7d1cf'; c.lineWidth = 2; c.stroke();
  c.beginPath(); c.moveTo(85, cy); c.lineTo(810, cy); c.strokeStyle = '#91b5b6'; c.stroke();
  c.setLineDash([6,7]); c.beginPath(); c.moveTo(cx, 66); c.lineTo(cx, 471); c.stroke(); c.setLineDash([]);

  function beam(x0, y0, x1, y1, colour, width, alpha) {
    c.globalAlpha = alpha; c.strokeStyle = colour; c.lineWidth = width;
    c.beginPath(); c.moveTo(x0,y0); c.lineTo(x1,y1); c.stroke();
    const f = reduced ? .62 : .27 + .49 * ((time*.36)%1);
    const x = x0 + (x1-x0)*f, y = y0 + (y1-y0)*f;
    c.save(); c.translate(x,y); c.rotate(Math.atan2(y1-y0,x1-x0));
    c.fillStyle = colour; c.beginPath(); c.moveTo(8,0); c.lineTo(-6,-5); c.lineTo(-6,5); c.closePath(); c.fill(); c.restore();
    c.globalAlpha = 1;
  }
  beam(cx-265*dx,cy+265*dy,cx,cy,'#ffde9a',5,1);
  beam(cx,cy,cx+radius*dx,cy+radius*dy,'#ffa669',transmitted?2:5,transmitted?.6:1);
  if (transmitted) {
    const length=Math.min(350,152/Math.max(.001,Math.cos(refracted)));
    beam(cx,cy,cx+length*Math.sin(refracted),cy-length*Math.cos(refracted),'#a7eee6',4,1);
  }
  c.lineWidth=2;c.strokeStyle='#ffde9a';c.beginPath();c.arc(cx,cy,51,Math.PI/2,Math.PI/2+theta);c.stroke();
  c.fillStyle='#fff3d5';c.beginPath();c.arc(cx,cy,5,0,2*Math.PI);c.fill();
  function label(x,y,h,e,colour='#e9f0df') {
    c.font='600 23px "Nirmala UI",system-ui,sans-serif';c.textAlign='left';c.fillStyle=colour;c.fillText(hi?h:e,x,y);
  }
  label(85,115,'हवा · n = 1.00','Air · n = 1.00');
  label(75,478,'काँच · n = 1.50','Glass · n = 1.50');
  label(635,330,'आपतन कोण','Incidence','#f4ca82');
  label(635,366,degrees.toFixed(1)+'°',degrees.toFixed(1)+'°');
  label(635,420,'क्रांतिक कोण','Critical angle','#adcfca');
  label(635,454,'41.8°','41.8°');
  c.restore();
}
