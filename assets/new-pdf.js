/* GenClasses — नई PDF हमेशा सबसे ऊपर + 2 दिन तक बगल में छोटा पॉपअप
   स्रोत: /downloads/pdfs.json (हर entry में "added": "YYYY-MM-DD")।
   नई PDF जोड़ते समय बस pdfs.json में added तारीख़ के साथ entry और पन्नों पर उसका कार्ड जोड़ें —
   क्रम और पॉपअप यह फ़ाइल अपने-आप सँभालती है। */
(function () {
  var POPUP_DAYS = 2;            // जोड़ने के दिन से कितने दिन तक पॉपअप दिखे
  var SEEN_KEY = 'gen_newpdf_closed';

  function dayNum(s) { var p = (s || '').split('-'); return p.length === 3 ? Date.UTC(+p[0], p[1] - 1, +p[2]) / 864e5 : 0; }
  function todayIST() { return Math.floor((Date.now() + 5.5 * 36e5) / 864e5); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  fetch('/downloads/pdfs.json?v=' + Math.floor(Date.now() / 36e5)).then(function (r) { return r.json(); }).then(function (L) {
    var added = {}, latest = 0;
    L.forEach(function (p) { added['pdf-' + p.id] = dayNum(p.added); latest = Math.max(latest, dayNum(p.added)); });
    var key = function (el) { var a = el.id ? el : el.querySelector('.dl-card'); return a ? (added[a.id] || 0) : 0; };
    function sortKids(box) {
      var kids = Array.prototype.slice.call(box.children), idx = new Map();
      kids.forEach(function (k, i) { idx.set(k, i); });
      kids.sort(function (a, b) { return (key(b) - key(a)) || (idx.get(a) - idx.get(b)); });
      kids.forEach(function (k) { box.appendChild(k); });
    }

    // 1) PDF पन्ना: सबसे नई खेप "नई PDF" खंड में, बाक़ी अपने खंड में; हर खंड नई से पुरानी
    var newGrid = document.getElementById('newGrid');
    if (newGrid) {
      var home = {}; L.forEach(function (p) { home['pdf-' + p.id] = p.id === 'hl' ? 'highlight' : p.section; });
      var gridOf = function (sec) { var h = document.getElementById(sec); var g = h && h.nextElementSibling; return g && g.classList.contains('dl-grid') ? g : null; };
      document.querySelectorAll('.dl-grid .dl-card[id^="pdf-"]').forEach(function (c) {
        var target = added[c.id] === latest ? newGrid : (c.parentElement === newGrid ? gridOf(home[c.id]) : null);
        if (target && c.parentElement !== target) target.appendChild(c);
      });
      document.querySelectorAll('.dl-grid').forEach(function (g) {
        sortKids(g);
        var h = g.previousElementSibling, empty = !g.children.length;
        g.style.display = empty ? 'none' : ''; if (h && h.tagName === 'H2') h.style.display = empty ? 'none' : '';
      });
    }

    // 2) मुखपृष्ठ स्लाइडर: नई से पुरानी
    var tr = document.querySelector('#dlCar .dc-track');
    if (tr) sortKids(tr);

    // 3) बगल में छोटा पॉपअप — नई PDF जुड़ने के बाद POPUP_DAYS दिन तक
    var fresh = L.filter(function (p) { return dayNum(p.added) === latest; });
    var age = todayIST() - latest;
    var tag = fresh.map(function (p) { return p.id; }).join(',') + '@' + latest;
    var closed = ''; try { closed = localStorage.getItem(SEEN_KEY) || ''; } catch (e) {}
    if (!fresh.length || age < 0 || age > POPUP_DAYS || closed === tag) return;

    var p = fresh[0];
    var many = fresh.length > 1;
    var href = '/downloads/#pdf-' + p.id;
    var css = document.createElement('style');
    css.textContent =
      '.np-toast{position:fixed;right:16px;bottom:150px;z-index:9998;width:290px;max-width:calc(100vw - 32px);display:flex;gap:10px;align-items:center;' +
      'background:#fff;color:#13235b;border:1.5px solid #e8590c;border-left:6px solid #e8590c;border-radius:14px;padding:10px 30px 10px 10px;' +
      'box-shadow:0 12px 30px rgba(0,0,0,.25);font-family:Mukta,sans-serif;transform:translateX(130%);transition:transform .45s ease}' +
      '.np-toast.on{transform:none}.np-toast img{width:54px;height:76px;object-fit:cover;border-radius:6px;border:1px solid #d8dfec;flex:none}' +
      '.np-toast b.np-k{display:inline-block;font-size:11px;letter-spacing:.06em;color:#fff;background:#c2410c;border-radius:20px;padding:0 8px;margin-bottom:2px}' +
      '.np-toast .np-t{display:block;font-weight:700;font-size:14px;line-height:1.3;color:#13235b}' +
      '.np-toast .np-s{display:block;font-size:12.5px;color:#475569;line-height:1.3;margin-top:2px}' +
      '.np-toast .np-go{display:inline-block;margin-top:5px;font-weight:700;font-size:13px;color:#a53c05;text-decoration:underline}' +
      '.np-toast .np-x{position:absolute;top:4px;right:6px;border:0;background:none;font-size:20px;line-height:1;color:#64748b;cursor:pointer;padding:2px 4px}' +
      '@media(max-width:560px){.np-toast{bottom:140px;right:10px;width:240px;padding:8px 26px 8px 8px}.np-toast img{width:42px;height:60px}.np-toast .np-t{font-size:13px}}' +
      '@media(prefers-reduced-motion:reduce){.np-toast{transition:none}}';
    document.head.appendChild(css);
    var t = document.createElement('div');
    t.className = 'np-toast'; t.setAttribute('role', 'status');
    t.innerHTML =
      '<button class="np-x" type="button" aria-label="बंद करें">×</button>' +
      '<a href="' + href + '"><img src="/downloads/covers/' + esc(p.file) + '.webp" alt=""></a>' +
      '<div><b class="np-k"><span data-hi>नई PDF</span><span data-en>NEW PDF</span></b>' +
      '<a class="np-t" href="' + href + '"><span data-hi>' + esc(p.hi) + '</span><span data-en>' + esc(p.en) + '</span></a>' +
      (many ? '<span class="np-s"><span data-hi>+ ' + (fresh.length - 1) + ' और नई PDF</span><span data-en>+ ' + (fresh.length - 1) + ' more new</span></span>' : '') +
      '<a class="np-go" href="' + href + '"><span data-hi>अभी देखें →</span><span data-en>View now →</span></a></div>';
    function close() { t.classList.remove('on'); try { localStorage.setItem(SEEN_KEY, tag); } catch (e) {} setTimeout(function () { t.remove(); }, 500); }
    t.querySelector('.np-x').addEventListener('click', close);
    t.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { try { localStorage.setItem(SEEN_KEY, tag); } catch (e) {} }); });
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('on'); }, 1500);
    setTimeout(function () { if (t.isConnected) { t.classList.remove('on'); setTimeout(function () { t.remove(); }, 500); } }, 16500); // 15 सेकंड बाद अपने-आप छिपे
  }).catch(function () {});
})();
