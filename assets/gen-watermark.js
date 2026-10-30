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
      var fill    = light ? '#8F6B26' : '#D9AE5F';
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
    if (document.body) mk(); else document.addEventListener('DOMContentLoaded', mk);
  }catch(e){}
})();
