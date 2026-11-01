/* GenClasses — टाइल्ड वॉटरमार्क (पढ़ने/स्क्रॉल पर स्क्रीन पर टिका रहता है)
   नियम:
   • गहरे पन्नों (टेस्ट) पर — छोटा और बहुत हल्का, दोहराव भी कम, ताकि पढ़ने में बाधा न हो।
   • हल्के/क्रीम पन्नों (जैसे CSAT की comprehension सामग्री) पर — साफ़ दिखने लायक गाढ़ा,
     ताकि कोई सामग्री उठाकर अपने नाम से इस्तेमाल न कर सके।
   पृष्ठभूमि हल्की है या गहरी — यह अपने-आप पहचानकर रंग व गाढ़ापन चुन लेता है। */
(function(){
  try{
    var mk = function(){
      if (document.getElementById('gen-wm')) return;

      /* --- पृष्ठभूमि हल्की है या गहरी? --- */
      var lum = function(el){
        try{
          var c = getComputedStyle(el).backgroundColor || '';
          var m = c.match(/rgba?\(([^)]+)\)/);
          if(!m) return null;
          var p = m[1].split(',').map(function(x){ return parseFloat(x); });
          if(p.length > 3 && p[3] === 0) return null;            /* पारदर्शी */
          return (0.2126*p[0] + 0.7152*p[1] + 0.0722*p[2]) / 255;
        }catch(e){ return null; }
      };
      var L = lum(document.body);
      if (L === null) L = lum(document.documentElement);
      if (L === null) L = 0.05;                                   /* पता न चले तो गहरा मानो */
      var light = L > 0.5;

      /* हल्का पन्ना → गहरा सुनहरा व साफ़ दिखता; गहरा पन्ना → हल्का सुनहरा, मद्धिम */
      var fill    = light ? '#1E3A8A' : '#D9AE5F';
      var opacity = light ? '0.20'    : '0.085';

      /* टाइल जितनी बड़ी, निशान उतने कम — पहले 360×220 था, अब लगभग आधे निशान */
      var tw = light ? 520 : 560,  th = light ? 320 : 340;
      var fs = light ? 30  : 27;

      var raw = '<svg xmlns="http://www.w3.org/2000/svg" width="' + tw + '" height="' + th + '">'
        + '<text x="18" y="' + Math.round(th*0.62) + '" '
        + 'transform="rotate(-30 ' + Math.round(tw/2) + ' ' + Math.round(th/2) + ')" '
        + 'font-family="Mukta, Segoe UI, Arial, sans-serif" font-size="' + fs + '" '
        + 'font-weight="700" letter-spacing="2" fill="' + fill + '" fill-opacity="' + opacity + '">'
        + 'GenClasses</text></svg>';
      var uri = 'data:image/svg+xml,' + encodeURIComponent(raw);

      var d = document.createElement('div');
      d.id = 'gen-wm';
      d.setAttribute('aria-hidden','true');
      d.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;'
        + 'z-index:2147483000;pointer-events:none;'
        + 'background-image:url("'+uri+'");background-repeat:repeat;background-position:0 0;';
      document.body.appendChild(d);
    };

    var addFab = function(){
      try{
        if (document.getElementById('waFab')) return;
        var css = document.createElement('style');
        css.textContent = '.wa-fab{position:fixed;z-index:90;left:16px;bottom:16px;right:auto;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;text-decoration:none;background:#25D366;color:#fff;box-shadow:0 10px 28px rgba(18,140,126,.45);border:2px solid rgba(255,255,255,.55)}.wa-fab:hover{transform:translateY(-2px) scale(1.04)}.wa-fab svg{width:26px;height:26px;fill:currentColor}html[data-theme="light"] .wa-fab{background:#128C7E}@media(max-width:760px){.wa-fab{left:12px;bottom:12px;width:48px;height:48px}}';
        document.head.appendChild(css);
        var a = document.createElement('a');
        a.id = 'waFab';
        a.className = 'wa-fab';
        a.href = 'https://wa.me/919506321415';
        a.target = '_blank';
        a.rel = 'noopener';
        a.setAttribute('aria-label', 'WhatsApp Support 9506321415');
        a.title = 'WhatsApp Support';
        a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.6 5.95L0 24l6.3-1.65a11.86 11.86 0 0 0 5.76 1.47h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.44-8.44zM12.06 21.75h-.01a9.84 9.84 0 0 1-5.01-1.37l-.36-.21-3.74.98 1-3.64-.24-.37a9.83 9.83 0 0 1-1.51-5.25c0-5.43 4.42-9.85 9.86-9.85 2.63 0 5.1 1.03 6.96 2.89a9.8 9.8 0 0 1 2.89 6.96c0 5.43-4.42 9.86-9.84 9.86zm5.4-7.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z"/></svg>';
        document.body.appendChild(a);
      }catch(e){}
    };
    var boot = function(){ mk(); addFab(); };
    if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
  }catch(e){}
})();

