/* GenClasses मुखपृष्ठ — पहली स्क्रीन: खोज-पट्टी और घूमता हुआ 3D विषय-गोला।
   कोई बाहरी लाइब्रेरी नहीं: गोले का जाल canvas पर, विषय असली कड़ियाँ (DOM) हैं ताकि
   कीबोर्ड और स्क्रीन-रीडर से भी खुलें। */
(function () {
  function en() { return document.documentElement.getAttribute('lang') === 'en'; }

  /* ───────── 3D विषय-गोला ───────── */
  var orb = document.getElementById('hxOrb');
  if (orb) (function () {
    var cv = orb.querySelector('canvas'), ctx = cv.getContext('2d');
    var tags = [].slice.call(orb.querySelectorAll('.hx-tag'));
    var REDUCED = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    var n = tags.length, pts = [], GA = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < n; i++) {           /* गोले पर बराबर दूरी के बिंदु */
      var y = 1 - (i + .5) * 2 / n, r = Math.sqrt(1 - y * y), a = i * GA;
      pts.push([Math.cos(a) * r, y * .82, Math.sin(a) * r]);
    }
    var ry = .6, rx = -.22, vy = 0, vx = 0, AUTO = .0032, hold = false, drag = null, moved = 0;
    var W = 0, H = 0, R = 0, dpr = 1, visible = true, raf = 0, t = 0, col = {};

    function colours() {
      var light = document.documentElement.getAttribute('data-theme') === 'light';
      col = light
        ? { wire: '27,58,122', ring: '183,121,31', glow: 'rgba(183,121,31,.16)', dot: '#B7791F' }
        : { wire: '242,205,136', ring: '242,205,136', glow: 'rgba(127,180,255,.16)', dot: '#F2CD88' };
    }
    function size() {
      var b = orb.getBoundingClientRect();
      W = b.width; H = b.height; dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      R = Math.min(W, H) * .36;
    }
    function rot(p) {                        /* पहले Y-अक्ष, फिर X-अक्ष पर घुमाव */
      var cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
      var x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy;
      var y = p[1] * cx - z * sx; z = p[1] * sx + z * cx;
      return [x, y, z];
    }
    function proj(q) { var s = 2.9 / (2.9 - q[2]); return [W / 2 + q[0] * R * s, H / 2 + q[1] * R * s, s]; }

    function wire() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var g = ctx.createRadialGradient(W / 2, H / 2, R * .1, W / 2, H / 2, R * 1.35);
      g.addColorStop(0, col.glow); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      var back = new Path2D(), front = new Path2D(), STEP = Math.PI / 24, k, a, p, q, prev;
      function seg(p3a, p3b) {
        var A = proj(p3a), B = proj(p3b), path = (p3a[2] + p3b[2] < 0) ? back : front;
        path.moveTo(A[0], A[1]); path.lineTo(B[0], B[1]);
      }
      for (k = -60; k <= 60; k += 30) {       /* अक्षांश रेखाएँ */
        var lat = k * Math.PI / 180, cr = Math.cos(lat), sy0 = Math.sin(lat); prev = null;
        for (a = 0; a <= Math.PI * 2 + .001; a += STEP) { q = rot([Math.cos(a) * cr, sy0, Math.sin(a) * cr]); if (prev) seg(prev, q); prev = q; }
      }
      for (k = 0; k < 180; k += 30) {         /* देशांतर रेखाएँ */
        var lon = k * Math.PI / 180; prev = null;
        for (a = 0; a <= Math.PI * 2 + .001; a += STEP) { q = rot([Math.cos(a) * Math.cos(lon), Math.sin(a), Math.cos(a) * Math.sin(lon)]); if (prev) seg(prev, q); prev = q; }
      }
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(' + col.wire + ',.13)'; ctx.stroke(back);
      ctx.strokeStyle = 'rgba(' + col.wire + ',.42)'; ctx.stroke(front);
      /* झुकी हुई परिक्रमा-रेखा और उस पर चलता बिंदु */
      var ring = new Path2D(), first = true, sat = null, sa = t * .012;
      for (a = 0; a <= Math.PI * 2 + .001; a += STEP) {
        q = rot([Math.cos(a) * 1.3, Math.sin(a) * .36, Math.sin(a) * 1.3]); p = proj(q);
        if (first) { ring.moveTo(p[0], p[1]); first = false; } else ring.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = 'rgba(' + col.ring + ',.5)'; ctx.lineWidth = 1.2; ctx.stroke(ring);
      sat = proj(rot([Math.cos(sa) * 1.3, Math.sin(sa) * .36, Math.sin(sa) * 1.3]));
      ctx.beginPath(); ctx.arc(sat[0], sat[1], 4.5 * sat[2], 0, Math.PI * 2);
      ctx.fillStyle = col.dot; ctx.shadowColor = col.dot; ctx.shadowBlur = 14; ctx.fill(); ctx.shadowBlur = 0;
    }
    function place() {
      for (var i = 0; i < n; i++) {
        var q = rot(pts[i]), p = proj([q[0] * 1.06, q[1] * 1.06, q[2] * 1.06]), depth = (q[2] + 1) / 2, el = tags[i];
        el.style.transform = 'translate(-50%,-50%) translate(' + p[0].toFixed(1) + 'px,' + p[1].toFixed(1) + 'px) scale(' + (.62 + depth * .5).toFixed(3) + ')';
        el.style.opacity = (.26 + depth * .74).toFixed(2);
        el.style.zIndex = String(10 + Math.round(depth * 100));
        el.classList.toggle('back', depth < .34);
      }
    }
    function frame() {
      raf = 0; t++;
      if (!drag) {
        ry += vy + (hold || REDUCED ? 0 : AUTO); rx += vx; vy *= .94; vx *= .94;
        rx += (-.22 - rx) * .012;             /* झुकाव धीरे-धीरे मूल जगह लौटे */
      }
      rx = Math.max(-1, Math.min(1, rx));
      wire(); place();
      if (visible && !(REDUCED && !drag && Math.abs(vy) < .0004 && Math.abs(vx) < .0004)) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }

    orb.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      drag = { x: e.clientX, y: e.clientY }; moved = 0; vy = vx = 0; kick();
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 6) orb.classList.add('dragging');
      ry += dx * .008; rx += dy * .006; vy = dx * .008; vx = dy * .006;
      drag.x = e.clientX; drag.y = e.clientY;
    });
    function up() { if (!drag) return; drag = null; setTimeout(function () { orb.classList.remove('dragging'); }, 0); kick(); }
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    /* घुमाते समय छूटी उँगली को क्लिक न माना जाए */
    orb.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
    orb.addEventListener('dragstart', function (e) { e.preventDefault(); });
    tags.forEach(function (el) {
      el.addEventListener('mouseenter', function () { hold = true; });
      el.addEventListener('mouseleave', function () { hold = false; });
      el.addEventListener('focus', function () { hold = true; });
      el.addEventListener('blur', function () { hold = false; });
    });
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }).observe(orb);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && visible) kick(); });
    new MutationObserver(function () { colours(); kick(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('resize', function () { size(); kick(); });
    colours(); size(); orb.classList.add('ready'); kick();
  })();

  /* ───────── खोज ───────── */
  var q = document.getElementById('hxQ'), list = document.getElementById('hxList');
  if (!q || !list) return;
  var box = q.closest('.hx-search');
  /* [हिंदी, English, अतिरिक्त खोज-शब्द, कड़ी, प्रकार] */
  var T = { n: ['नोट्स', 'Notes'], t: ['टेस्ट', 'Tests'], p: ['PDF', 'PDF'], c: ['करंट', 'Current'], s: ['सिलेबस', 'Syllabus'], v: ['दृश्य', 'Visual'], h: ['संपर्क', 'Contact'] };
  var IDX = [
    ['UPPCS प्रारंभिक PYQ (2018–2025)', 'UPPCS Prelims PYQ (2018–2025)', 'pyq पिछले वर्ष प्रश्न previous year pichle', '/uppcs-prelims-pyq/', 't'],
    ['UPPCS 2026 मॉक टेस्ट', 'UPPCS 2026 mock tests', 'mock मॉक full test pcs', '/uppcs-2026-mock/', 't'],
    ['आज का करंट', "Today's current affairs", 'current affairs करेंट अफेयर्स daily news samachar', '#daily-ca', 'c'],
    ['बुकलेट और निःशुल्क PDF', 'Booklets and free PDFs', 'pdf download डाउनलोड booklet notes', '/downloads/', 'p'],
    ['राजव्यवस्था PYQ · 960 प्रश्न', 'Polity PYQ · 960 questions', 'polity संविधान constitution rajvyavastha', '/polity/', 't'],
    ['डेली 5 क्विज़', 'Daily 5 quiz', 'daily quiz रोज़ प्रश्न', '/daily/', 't'],
    ['टेस्ट सीरीज़ (सभी टेस्ट)', 'Test series (all tests)', 'test series सभी', '#tests', 't'],
    ['UP TGT/PGT और GIC मॉक', 'UP TGT/PGT & GIC mocks', 'tgt pgt gic teacher शिक्षक', '/up-tgt-pgt-gic-mock/', 't'],
    ['CSAT हब', 'CSAT hub', 'csat maths reasoning गणित तर्कशक्ति hindi english', '/csat/', 't'],
    ['UP करेंट अफेयर्स', 'UP current affairs', 'uttar pradesh उत्तर प्रदेश करंट', '/up-ca/', 'c'],
    ['हाइलाइट बुक · वार्षिक करेंट अफेयर्स', 'Highlight Book · yearly current affairs', 'highlight book वार्षिक संग्रह', '/downloads/#pdf-hl', 'p'],
    ['सिलेबस हब', 'Syllabus hub', 'syllabus पाठ्यक्रम upsc uppcs ro aro', '/syllabus/', 's'],
    ['UP TGT/PGT सिलेबस', 'UP TGT/PGT syllabus', 'tgt pgt syllabus पाठ्यक्रम', '/syllabus/up-tgt-pgt/', 's'],
    ['RO/ARO आलेखन', 'RO/ARO drafting', 'ro aro आलेखन drafting पत्र letter', '/ro-aro/drafting/', 's'],
    ['NCERT किताबें और अभ्यास', 'NCERT books and practice', 'ncert किताब book class कक्षा', '/ncert/', 'p'],
    ['फ्लैशकार्ड', 'Flashcards', 'flashcard दोहराव revision पर्याय मुहावरे', '/flashcards/', 'v'],
    ['दृश्य एटलस · चलते मॉडल', 'Visual Atlas · animated models', 'atlas visual animation ज्वालामुखी नदी volcano river', '#visual-atlas', 'v'],
    ['3D ग्लोब · पवनें और धाराएँ', '3D globe · winds and currents', 'globe 3d ग्लोब पवन धारा ocean wind', '/learn/atlas/globe/', 'v'],
    ['बिग बैंग से पृथ्वी तक · 3D यात्रा', 'Big Bang to Earth · 3D journey', 'origins universe ब्रह्मांड big bang', '/learn/origins/', 'v'],
    ['विज़ुअल नोट्स', 'Visual notes', 'visual notes चित्र learn', '/learn/', 'v'],
    ['राजव्यवस्था नोट्स', 'Polity notes', 'polity संविधान rajvyavastha', '/notes/polity.html', 'n'],
    ['इतिहास नोट्स', 'History notes', 'history itihas', '/notes/history.html', 'n'],
    ['भूगोल नोट्स', 'Geography notes', 'geography bhugol', '/notes/geography.html', 'n'],
    ['अर्थव्यवस्था नोट्स', 'Economy notes', 'economy arthvyavastha', '/notes/economy.html', 'n'],
    ['पर्यावरण नोट्स', 'Environment notes', 'environment ecology paryavaran पारिस्थितिकी', '/notes/environment.html', 'n'],
    ['कला एवं संस्कृति नोट्स', 'Art & culture notes', 'art culture kala sanskriti', '/notes/culture.html', 'n'],
    ['विज्ञान नोट्स', 'Science notes', 'science vigyan प्रौद्योगिकी', '/notes/science.html', 'n'],
    ['नीतिशास्त्र नोट्स', 'Ethics notes', 'ethics nitishastra', '/notes/ethics.html', 'n'],
    ['UP विशेष नोट्स', 'UP special notes', 'uttar pradesh उत्तर प्रदेश', '/notes/up-special.html', 'n'],
    ['करंट अफेयर्स नोट्स', 'Current affairs notes', 'current करेंट', '/notes/current-affairs.html', 'n'],
    ['अंतरराष्ट्रीय संबंध नोट्स', 'International relations notes', 'international ir antarrashtriya', '/notes/international-relations.html', 'n'],
    ['CSAT नोट्स', 'CSAT notes', 'csat', '/notes/csat.html', 'n'],
    ['निःशुल्क मार्गदर्शन', 'Free guidance', 'guidance मार्गदर्शन help सहायता', '#guidance', 'h'],
    ['WhatsApp / Telegram पर जुड़ें', 'Join on WhatsApp / Telegram', 'whatsapp telegram contact संपर्क join', '#join', 'h']
  ].map(function (r) { return { hi: r[0], en: r[1], hay: (r[0] + ' ' + r[1] + ' ' + r[2]).toLowerCase(), href: r[3], type: r[4] }; });
  var POPULAR = 6, testsLoaded = false, cur = -1, shown = [];

  function loadTests() {
    if (testsLoaded) return; testsLoaded = true;
    fetch('/files.json').then(function (r) { return r.ok ? r.json() : []; }).then(function (files) {
      (files || []).forEach(function (f) {
        if (typeof f !== 'string' || f.indexOf('tests/') !== 0) return;
        var name = f.split('/').pop().replace(/\.html$/, '').replace(/[-_]+/g, ' ');
        IDX.push({ hi: name, en: name, hay: name.toLowerCase(), href: '/' + f.split('/').map(encodeURIComponent).join('/'), type: 't' });
      });
      if (document.activeElement === q) render();
    }).catch(function () {});
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function find(text) {
    var words = text.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return IDX.slice(0, POPULAR);
    return IDX.filter(function (it) { return words.every(function (w) { return it.hay.indexOf(w) > -1; }); }).slice(0, 8);
  }
  function render() {
    shown = find(q.value.trim()); cur = -1;
    var E = en();
    list.innerHTML = (q.value.trim() ? '' : '<li class="hx-cap" role="presentation">' + (E ? 'Most used' : 'सबसे ज़्यादा काम के') + '</li>') +
      (shown.length ? shown.map(function (it, k) {
        return '<li role="option" id="hxOpt' + k + '" aria-selected="false"><a href="' + esc(it.href) + '" tabindex="-1"><span>' + esc(E ? it.en : it.hi) + '</span><i>' + T[it.type][E ? 1 : 0] + '</i></a></li>';
      }).join('') : '<li class="hx-none" role="presentation">' + (E ? 'Nothing found. Try another word, or ask us on WhatsApp.' : 'कुछ नहीं मिला। दूसरा शब्द लिखकर देखें, या WhatsApp पर पूछ लें।') + '</li>');
    list.hidden = false; q.setAttribute('aria-expanded', 'true'); q.removeAttribute('aria-activedescendant');
  }
  function close() { list.hidden = true; q.setAttribute('aria-expanded', 'false'); q.removeAttribute('aria-activedescendant'); cur = -1; }
  function mark(k) {
    var opts = list.querySelectorAll('[role="option"]'); if (!opts.length) return;
    cur = (k + opts.length) % opts.length;
    [].forEach.call(opts, function (o, j) { o.setAttribute('aria-selected', j === cur ? 'true' : 'false'); });
    q.setAttribute('aria-activedescendant', 'hxOpt' + cur); opts[cur].scrollIntoView({ block: 'nearest' });
  }
  q.addEventListener('focus', function () { loadTests(); render(); });
  q.addEventListener('input', render);
  q.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) render(); mark(cur + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); mark(cur - 1); }
    else if (e.key === 'Enter') { var it = shown[cur < 0 ? 0 : cur]; if (it && (cur >= 0 || q.value.trim())) { e.preventDefault(); close(); q.blur(); location.href = it.href; } }
    else if (e.key === 'Escape') { if (!list.hidden) { e.preventDefault(); close(); } }
  });
  list.addEventListener('click', function (e) { if (e.target.closest('a')) { close(); q.value = ''; } });
  document.addEventListener('pointerdown', function (e) { if (!box.contains(e.target)) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    var a = document.activeElement, tag = a && a.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (a && a.isContentEditable)) return;
    e.preventDefault(); q.focus();
  });
  document.addEventListener('gen-lang', function () {
    q.placeholder = en() ? q.getAttribute('data-ph-en') : q.getAttribute('data-ph-hi');
    if (!list.hidden) render();
  });
  q.placeholder = en() ? q.getAttribute('data-ph-en') : q.getAttribute('data-ph-hi');
})();
