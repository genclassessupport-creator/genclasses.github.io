/* GenClasses — tiled watermark (subtle logo + text), fixed on scroll.
   Dark pages: very light. Light/cream pages: a bit stronger for content protection. */
(function(){
  try{
    var mk = function(){
      if (document.getElementById('gen-wm')) return;

      var lum = function(el){
        try{
          var c = getComputedStyle(el).backgroundColor || '';
          var m = c.match(/rgba?\(([^)]+)\)/);
          if(!m) return null;
          var p = m[1].split(',').map(function(x){ return parseFloat(x); });
          if(p.length > 3 && p[3] === 0) return null;
          return (0.2126*p[0] + 0.7152*p[1] + 0.0722*p[2]) / 255;
        }catch(e){ return null; }
      };
      var L = lum(document.body);
      if (L === null) L = lum(document.documentElement);
      if (L === null) L = 0.05;
      var light = L > 0.5;

      /* Logo tile: external ~1KB webp, cached across pages */
      var opacity = light ? '0.10' : '0.055';
      var tw = light ? 420 : 460, th = light ? 280 : 300;
      var logoSize = light ? 56 : 48;

      var d = document.createElement('div');
      d.id = 'gen-wm';
      d.setAttribute('aria-hidden','true');
      d.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;'
        + 'z-index:2147483000;pointer-events:none;'
        + 'background-image:url("/assets/gen-logo-wm.webp");'
        + 'background-repeat:repeat;'
        + 'background-size:' + logoSize + 'px ' + logoSize + 'px;'
        + 'background-position:24px 40px;'
        + 'opacity:' + opacity + ';'
        + 'transform:rotate(-18deg) scale(1.25);'
        + 'transform-origin:center center;';
      /* Extra text layer for denser protection without heavy images */
      var fill = light ? '#8F6B26' : '#D9AE5F';
      var top = light ? '0.12' : '0.05';
      var raw = '<svg xmlns="http://www.w3.org/2000/svg" width="' + tw + '" height="' + th + '">'
        + '<text x="18" y="' + Math.round(th*0.72) + '" '
        + 'transform="rotate(-30 ' + Math.round(tw/2) + ' ' + Math.round(th/2) + ')" '
        + 'font-family="Mukta, Segoe UI, Arial, sans-serif" font-size="' + (light?26:24) + '" '
        + 'font-weight="700" letter-spacing="2" fill="' + fill + '" fill-opacity="' + top + '">'
        + 'GenClasses</text></svg>';
      var textLayer = document.createElement('div');
      textLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;'
        + 'background-image:url("data:image/svg+xml,' + encodeURIComponent(raw) + '");'
        + 'background-repeat:repeat;';
      d.appendChild(textLayer);
      document.body.appendChild(d);
    };
    if (document.body) mk(); else document.addEventListener('DOMContentLoaded', mk);
  }catch(e){}
})();
