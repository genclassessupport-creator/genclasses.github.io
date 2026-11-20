/* GenClasses मुखपृष्ठ — शीर्ष मेन्यू के ड्रॉपडाउन और निःशुल्क मार्गदर्शन फ़ॉर्म */
(function () {
  var menu = document.getElementById('navLinks');
  var burger = document.getElementById('menuBtn');
  if (menu) {
    var items = [].slice.call(menu.querySelectorAll('.gx-item'));
    function close(except) {
      items.forEach(function (it) {
        if (it === except) return;
        it.classList.remove('open');
        it.querySelector('.gx-top').setAttribute('aria-expanded', 'false');
      });
    }
    items.forEach(function (it) {
      var btn = it.querySelector('.gx-top');
      btn.addEventListener('click', function () {
        var open = !it.classList.contains('open');
        close(it);
        it.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
      /* माउस हटते ही क्लिक से खुला पैनल भी बंद हो, ताकि दो पैनल साथ न दिखें */
      it.addEventListener('mouseleave', function () {
        if (window.matchMedia('(min-width:1101px)').matches) { it.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.blur(); }
      });
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.gx-item')) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var open = menu.querySelector('.gx-item.open');
      if (open) { close(); open.querySelector('.gx-top').focus(); }
      else if (document.activeElement && document.activeElement.closest && document.activeElement.closest('.gx-drop')) document.activeElement.blur();
    });
    if (burger) burger.addEventListener('click', function () { if (!menu.classList.contains('open')) close(); });
  }

  var form = document.getElementById('gdForm');
  if (!form) return;
  var nameEl = document.getElementById('gdName'), phoneEl = document.getElementById('gdPhone'), err = document.getElementById('gdErr');
  function en() { return document.documentElement.getAttribute('lang') === 'en'; }
  phoneEl.addEventListener('input', function () { phoneEl.value = phoneEl.value.replace(/\D/g, '').slice(0, 10); });
  [nameEl, phoneEl].forEach(function (el) { el.addEventListener('input', function () { el.classList.remove('bad'); err.hidden = true; }); });
  function fail(el, hi, eng) { el.classList.add('bad'); err.textContent = en() ? eng : hi; err.hidden = false; el.focus(); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = nameEl.value.replace(/\s+/g, ' ').trim(), phone = phoneEl.value.trim();
    if (name.length < 2) return fail(nameEl, 'कृपया अपना नाम लिखें।', 'Please enter your name.');
    if (!/^[6-9]\d{9}$/.test(phone)) return fail(phoneEl, 'कृपया 10 अंकों का सही मोबाइल नंबर लिखें।', 'Please enter a valid 10-digit mobile number.');
    var exam = (form.querySelector('input[name="exam"]:checked') || {}).value || '';
    var msg = 'नमस्ते GenClasses टीम, मुझे निःशुल्क मार्गदर्शन चाहिए।\nनाम: ' + name + '\nमोबाइल: ' + phone + '\nपरीक्षा: ' + exam;
    window.open('https://wa.me/919506321415?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });
})();

/* "अपनी परीक्षा चुनिए": टैब और UPPCS की उलटी गिनती */
(function () {
  var tabs = [].slice.call(document.querySelectorAll('.ex-tab'));
  if (!tabs.length) return;
  function pick(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    try { localStorage.setItem('gen_exam', tab.getAttribute('data-ex')); } catch (e) {}
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { pick(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); pick(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
  try {
    var saved = localStorage.getItem('gen_exam');
    var st = saved && document.querySelector('.ex-tab[data-ex="' + saved.replace(/[^a-z]/g, '') + '"]');
    if (st) pick(st);
  } catch (e) {}

  var cd = document.getElementById('exCd');
  if (!cd) return;
  var target = new Date('2026-12-06T09:30:00+05:30').getTime();
  function tick() {
    var left = target - Date.now(), E = document.documentElement.getAttribute('lang') === 'en';
    if (left <= 0) { cd.hidden = true; return; }
    var days = Math.floor(left / 864e5), hrs = Math.floor(left % 864e5 / 36e5);
    cd.innerHTML = E
      ? 'UPPCS Prelims 2026 · 6 December · <b>' + days + ' days ' + hrs + ' hours</b> to go'
      : 'UPPCS प्रारंभिक 2026 · 6 दिसंबर · <b>' + days + ' दिन ' + hrs + ' घंटे</b> बाकी';
  }
  tick(); setInterval(tick, 60000); document.addEventListener('gen-lang', tick);
})();
