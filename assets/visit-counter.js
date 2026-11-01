/* GenClasses visitor counter — Cloudflare Worker + Durable Object (count.genclasses.com) */
(function () {
  if (window.__gcVisitCounter) return;
  window.__gcVisitCounter = true;

  var API = 'https://count.genclasses.com';
  var DAY_KEY = 'gc_visit_day';
  var SID_KEY = 'gc_sid';
  var COLLAPSE_KEY = 'gc_vc_collapsed';

  function istDay() {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
    } catch (e) {
      var d = new Date(Date.now() + 5.5 * 3600 * 1000);
      return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
    }
  }

  function sid() {
    try {
      var s = sessionStorage.getItem(SID_KEY);
      if (s && /^[a-zA-Z0-9_-]{8,64}$/.test(s)) return s;
      s = 's' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(SID_KEY, s);
      return s;
    } catch (e) {
      return 's' + Math.random().toString(36).slice(2, 12);
    }
  }

  function isUniqueToday() {
    var today = istDay();
    try {
      if (localStorage.getItem(DAY_KEY) === today) return false;
      localStorage.setItem(DAY_KEY, today);
      return true;
    } catch (e) {
      return true;
    }
  }

  function isHi() {
    return document.documentElement.getAttribute('lang') !== 'en';
  }

  function fmt(n) {
    n = Number(n) || 0;
    try {
      return n.toLocaleString(isHi() ? 'hi-IN' : 'en-IN');
    } catch (e) {
      return String(n);
    }
  }

  function labels() {
    if (isHi()) {
      return { title: 'आगंतुक', online: 'अभी ऑनलाइन', today: 'आज के आगंतुक', total: 'कुल विज़िट', tip: 'अनुमानित · बिना निजी डेटा' };
    }
    return { title: 'Visitors', online: 'Online now', today: 'Today', total: 'Total visits', tip: 'Approx · no personal data' };
  }

  function ensureStyles() {
    if (document.getElementById('gcVcCss')) return;
    var css = document.createElement('style');
    css.id = 'gcVcCss';
    css.textContent = [
      '#gcVisitCounter{position:fixed;z-index:85;left:14px;bottom:14px;font-family:inherit;pointer-events:auto}',
      '#gcVisitCounter *{box-sizing:border-box}',
      '#gcVisitCounter .gc-vc-card{',
      '  min-width:148px;max-width:200px;padding:10px 12px 9px;',
      '  border-radius:14px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);',
      '  border:1px solid rgba(255,255,255,.14);',
      '  background:linear-gradient(145deg,rgba(18,28,48,.92),rgba(12,20,36,.88));',
      '  color:#e8eef8;box-shadow:0 10px 28px rgba(0,0,0,.28);',
      '  transition:transform .2s ease,opacity .2s ease}',
      'html[data-theme="light"] #gcVisitCounter .gc-vc-card{',
      '  background:linear-gradient(145deg,rgba(255,255,255,.96),rgba(236,245,240,.94));',
      '  color:#14302a;border-color:rgba(20,80,60,.12);box-shadow:0 10px 24px rgba(20,60,40,.14)}',
      '#gcVisitCounter .gc-vc-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}',
      '#gcVisitCounter .gc-vc-title{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;opacity:.78}',
      '#gcVisitCounter .gc-vc-toggle{appearance:none;border:0;background:transparent;color:inherit;cursor:pointer;padding:2px 4px;font-size:14px;line-height:1;opacity:.7}',
      '#gcVisitCounter .gc-vc-toggle:hover{opacity:1}',
      '#gcVisitCounter .gc-vc-row{display:flex;align-items:baseline;justify-content:space-between;gap:10px;font-size:12px;line-height:1.35;padding:2px 0}',
      '#gcVisitCounter .gc-vc-label{opacity:.78;display:flex;align-items:center;gap:6px}',
      '#gcVisitCounter .gc-vc-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.22);flex:0 0 auto}',
      '#gcVisitCounter .gc-vc-val{font-weight:750;font-variant-numeric:tabular-nums;font-size:13px}',
      '#gcVisitCounter .gc-vc-tip{margin-top:5px;font-size:10px;opacity:.55;line-height:1.3}',
      '#gcVisitCounter.collapsed .gc-vc-body{display:none}',
      '#gcVisitCounter.collapsed .gc-vc-card{min-width:0;padding:8px 10px}',
      '#gcVisitCounter .gc-vc-mini{display:none;align-items:center;gap:6px;font-size:12px;font-weight:700}',
      '#gcVisitCounter.collapsed .gc-vc-mini{display:flex}',
      '#gcVisitCounter.collapsed .gc-vc-title{display:none}',
      '@media(max-width:760px){',
      '  #gcVisitCounter{left:10px;bottom:10px}',
      '  #gcVisitCounter .gc-vc-card{min-width:0;padding:8px 10px;border-radius:12px}',
      '  #gcVisitCounter:not(.collapsed) .gc-vc-card{min-width:132px}',
      '  #gcVisitCounter .gc-vc-tip{display:none}',
      '}',
      /* Keep clear of test-page WA FAB (bottom-left) when watermark sets left FAB */
      'body.gc-test-page #gcVisitCounter{left:auto;right:12px;bottom:72px}'
    ].join('');
    document.head.appendChild(css);
  }

  function render(el, data) {
    var L = labels();
    var online = data && data.online != null ? data.online : '—';
    var today = data && data.today != null ? data.today : '—';
    var total = data && data.total != null ? data.total : '—';
    el.querySelector('[data-k=title]').textContent = L.title;
    el.querySelector('[data-k=online-l]').lastChild.textContent = L.online;
    el.querySelector('[data-k=today-l]').textContent = L.today;
    el.querySelector('[data-k=total-l]').textContent = L.total;
    el.querySelector('[data-k=tip]').textContent = L.tip;
    el.querySelector('[data-k=online]').textContent = typeof online === 'number' ? fmt(online) : online;
    el.querySelector('[data-k=today]').textContent = typeof today === 'number' ? fmt(today) : today;
    el.querySelector('[data-k=total]').textContent = typeof total === 'number' ? fmt(total) : total;
    el.querySelector('[data-k=mini]').textContent = (typeof online === 'number' ? fmt(online) : '·') + ' online';
  }

  function build() {
    ensureStyles();
    var wrap = document.createElement('aside');
    wrap.id = 'gcVisitCounter';
    wrap.setAttribute('aria-label', 'Visitor stats');
    try {
      if (localStorage.getItem(COLLAPSE_KEY) === '1' || (window.matchMedia && window.matchMedia('(max-width:760px)').matches && localStorage.getItem(COLLAPSE_KEY) !== '0')) {
        wrap.classList.add('collapsed');
      }
    } catch (e) {}
    wrap.innerHTML =
      '<div class="gc-vc-card">' +
      '<div class="gc-vc-head">' +
      '<span class="gc-vc-title" data-k="title">Visitors</span>' +
      '<span class="gc-vc-mini" data-k="mini">·</span>' +
      '<button type="button" class="gc-vc-toggle" aria-label="Toggle visitor stats" title="Toggle">▴</button>' +
      '</div>' +
      '<div class="gc-vc-body">' +
      '<div class="gc-vc-row"><span class="gc-vc-label" data-k="online-l"><span class="gc-vc-dot" aria-hidden="true"></span>Online now</span><span class="gc-vc-val" data-k="online">—</span></div>' +
      '<div class="gc-vc-row"><span class="gc-vc-label" data-k="today-l">Today</span><span class="gc-vc-val" data-k="today">—</span></div>' +
      '<div class="gc-vc-row"><span class="gc-vc-label" data-k="total-l">Total visits</span><span class="gc-vc-val" data-k="total">—</span></div>' +
      '<div class="gc-vc-tip" data-k="tip">Approx · no personal data</div>' +
      '</div></div>';
    document.body.appendChild(wrap);
    setTimeout(function(){
      try{
        var fab=document.getElementById('waFab');
        if(!fab) return;
        var cs=getComputedStyle(fab);
        if(cs.left!=='auto' && parseFloat(cs.left)<80 && (cs.right==='auto'||cs.right===''||parseFloat(cs.right)>200)){
          wrap.style.left='auto';
          wrap.style.right='12px';
        }
      }catch(e){}
    },0);
    var btn = wrap.querySelector('.gc-vc-toggle');
    function syncToggle() {
      btn.textContent = wrap.classList.contains('collapsed') ? '▾' : '▴';
    }
    syncToggle();
    btn.addEventListener('click', function () {
      wrap.classList.toggle('collapsed');
      try {
        localStorage.setItem(COLLAPSE_KEY, wrap.classList.contains('collapsed') ? '1' : '0');
      } catch (e) {}
      syncToggle();
    });
    return wrap;
  }

  var state = { online: null, today: null, total: null };

  function apply(data) {
    if (!data) return;
    state = data;
    var el = document.getElementById('gcVisitCounter');
    if (el) render(el, state);
  }

  async function hit() {
    var unique = isUniqueToday();
    try {
      var res = await fetch(API + '/hit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sid: sid(), unique: unique }),
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store'
      });
      if (res.ok) apply(await res.json());
    } catch (e) {
      try {
        var r2 = await fetch(API + '/stats', { mode: 'cors', credentials: 'omit', cache: 'no-store' });
        if (r2.ok) apply(await r2.json());
      } catch (e2) {}
    }
  }

  async function heartbeat() {
    try {
      var res = await fetch(API + '/hit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sid: sid(), unique: false }),
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store'
      });
      if (res.ok) apply(await res.json());
    } catch (e) {}
  }

  function start() {
    if (document.getElementById('gcVisitCounter')) return;
    var el = build();
    render(el, state);
    hit();
    setInterval(heartbeat, 90 * 1000);
    document.addEventListener('gen-lang', function () {
      render(el, state);
    });
    // Detect lang toggles that may not fire gen-lang on homepage
    var obs = new MutationObserver(function () {
      render(el, state);
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
