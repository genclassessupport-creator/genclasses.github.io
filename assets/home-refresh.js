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
