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

  function fmt(n) {
    n = Number(n) || 0;
    try {
      return n.toLocaleString('en-IN');
    } catch (e) {
      return String(n);
    }
  }

  /* हिंदी मोड में भी काउंटर English में ही रहता है */
  function labels() {
    return { title: 'Visitors', online: 'Online now', today: 'Today', total: 'Total visits', tip: 'Approx · no personal data' };
  }

  function ensureStyles() {
    if (document.getElementById('gcVcCss')) return;
    var css = document.createElement('style');
    css.id = 'gcVcCss';
    css.textContent = [
      '#gcVisitCounter{position:fixed;z-index:85;left:16px;bottom:16px;font-family:inherit;pointer-events:auto}',
      '#gcVisitCounter *{box-sizing:border-box}',
      '#gcVisitCounter .gc-vc-card{',
      '  min-width:188px;max-width:240px;padding:14px 16px 12px;',
      '  border-radius:18px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);',
      '  border:1px solid rgba(255,255,255,.16);',
      '  background:linear-gradient(145deg,rgba(18,28,48,.94),rgba(12,20,36,.9));',
      '  color:#e8eef8;box-shadow:0 14px 34px rgba(0,0,0,.32);',
      '  transition:transform .2s ease,opacity .2s ease}',
      'html[data-theme="light"] #gcVisitCounter .gc-vc-card{',
      '  background:linear-gradient(145deg,rgba(255,255,255,.98),rgba(236,245,240,.96));',
      '  color:#14302a;border-color:rgba(20,80,60,.14);box-shadow:0 14px 30px rgba(20,60,40,.16)}',
      '#gcVisitCounter .gc-vc-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}',
      '#gcVisitCounter .gc-vc-title{font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;opacity:.82;display:flex;align-items:center;gap:8px}',
      '#gcVisitCounter .gc-vc-title-ico{width:22px;height:22px;display:inline-grid;place-items:center;border-radius:8px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:12px;line-height:1;box-shadow:0 4px 10px rgba(34,197,94,.35);flex:0 0 auto}',
      '#gcVisitCounter .gc-vc-toggle{appearance:none;border:0;background:transparent;color:inherit;cursor:pointer;padding:4px 6px;font-size:16px;line-height:1;opacity:.75}',
      '#gcVisitCounter .gc-vc-toggle:hover{opacity:1}',
      '#gcVisitCounter .gc-vc-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13.5px;line-height:1.4;padding:4px 0}',
      '#gcVisitCounter .gc-vc-label{opacity:.82;display:flex;align-items:center;gap:8px;font-weight:600}',
      '#gcVisitCounter .gc-vc-ico{width:22px;height:22px;border-radius:8px;display:inline-grid;place-items:center;font-size:12px;line-height:1;flex:0 0 auto}',
      '#gcVisitCounter .gc-vc-ico.td{background:rgba(59,130,246,.18);color:#60a5fa}',
      '#gcVisitCounter .gc-vc-ico.tot{background:rgba(217,174,95,.2);color:#e8c27a}',
      'html[data-theme="light"] #gcVisitCounter .gc-vc-ico.td{background:rgba(30,58,138,.12);color:#1E3A8A}',
      'html[data-theme="light"] #gcVisitCounter .gc-vc-ico.tot{background:rgba(30,58,138,.14);color:#172E5C}',
      '#gcVisitCounter .gc-vc-dot{width:10px;height:10px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.22);flex:0 0 auto;animation:gcVcPulse 1.8s ease-in-out infinite}',
      '@keyframes gcVcPulse{0%,100%{box-shadow:0 0 0 3px rgba(34,197,94,.2)}50%{box-shadow:0 0 0 6px rgba(34,197,94,.08)}}',
      '@media(prefers-reduced-motion:reduce){#gcVisitCounter .gc-vc-dot{animation:none}}',
      '#gcVisitCounter .gc-vc-val{font-weight:800;font-variant-numeric:tabular-nums;font-size:17px}',
      '#gcVisitCounter .gc-vc-tip{margin-top:7px;font-size:11px;opacity:.55;line-height:1.3}',
      '#gcVisitCounter.collapsed .gc-vc-body{display:none}',
      '#gcVisitCounter.collapsed .gc-vc-card{min-width:0;padding:7px 11px;border-radius:999px;cursor:pointer}',
      '#gcVisitCounter.collapsed .gc-vc-head{margin:0;gap:6px}',
      '#gcVisitCounter.collapsed .gc-vc-toggle{display:none}',
      '#gcVisitCounter .gc-vc-mini{display:none;align-items:center;gap:7px;font-size:13px;font-weight:800}',
      '#gcVisitCounter.collapsed .gc-vc-mini{display:flex}',
      '#gcVisitCounter.collapsed .gc-vc-title{display:none}',
      '@media(max-width:760px){',
      '  #gcVisitCounter{left:10px;bottom:10px}',
      '  #gcVisitCounter .gc-vc-card{min-width:0;padding:10px 12px;border-radius:14px}',
      '  #gcVisitCounter:not(.collapsed) .gc-vc-card{min-width:156px;max-width:188px;padding:11px 12px}',
      '  #gcVisitCounter .gc-vc-title{font-size:12px}',
      '  #gcVisitCounter .gc-vc-val{font-size:15px}',
      '  #gcVisitCounter .gc-vc-row{font-size:12.5px;padding:3px 0}',
      '  #gcVisitCounter .gc-vc-tip{display:none}',
      '}',
      'body.gc-test-page #gcVisitCounter{left:auto;right:12px;bottom:72px}'
    ].join('');
    document.head.appendChild(css);
  }

  function render(el, data) {
    var L = labels();
    var online = data && data.online != null ? data.online : '—';
    var today = data && data.today != null ? data.today : '—';
    var total = data && data.total != null ? data.total : '—';
    var titleTxt = el.querySelector('[data-k=title-text]');
    if (titleTxt) titleTxt.textContent = L.title;
    else {
      var t = el.querySelector('[data-k=title]');
      if (t) t.textContent = L.title;
    }
    var onTxt = el.querySelector('[data-k=online-text]');
    if (onTxt) onTxt.textContent = L.online;
    else {
      var ol = el.querySelector('[data-k=online-l]');
      if (ol && ol.lastChild) ol.lastChild.textContent = L.online;
    }
    el.querySelector('[data-k=today-l]').textContent = L.today;
    el.querySelector('[data-k=total-l]').textContent = L.total;
    el.querySelector('[data-k=tip]').textContent = L.tip;
    el.querySelector('[data-k=online]').textContent = typeof online === 'number' ? fmt(online) : online;
    el.querySelector('[data-k=today]').textContent = typeof today === 'number' ? fmt(today) : today;
    el.querySelector('[data-k=total]').textContent = typeof total === 'number' ? fmt(total) : total;
    el.querySelector('[data-k=mini]').textContent = '👁 ' + (typeof online === 'number' ? fmt(online) + ' online' : 'Visitors');
  }

  function build() {
    ensureStyles();
    var wrap = document.createElement('aside');
    wrap.id = 'gcVisitCounter';
    wrap.setAttribute('aria-label', 'Visitor stats');
    /* हमेशा छोटा (बंद) खुलता है; click करने पर ही पूरा विवरण दिखता है */
    wrap.classList.add('collapsed');
    wrap.innerHTML =
      '<div class="gc-vc-card">' +
      '<div class="gc-vc-head">' +
      '<span class="gc-vc-title" data-k="title"><span class="gc-vc-title-ico" aria-hidden="true">👁</span><span data-k="title-text">Visitors</span></span>' +
      '<span class="gc-vc-mini" data-k="mini">👁 Visitors</span>' +
      '<button type="button" class="gc-vc-toggle" aria-label="Toggle visitor stats" title="Toggle">▴</button>' +
      '</div>' +
      '<div class="gc-vc-body">' +
      '<div class="gc-vc-row"><span class="gc-vc-label" data-k="online-l"><span class="gc-vc-dot" aria-hidden="true"></span><span data-k="online-text">Online now</span></span><span class="gc-vc-val" data-k="online">—</span></div>' +
      '<div class="gc-vc-row"><span class="gc-vc-label"><span class="gc-vc-ico td" aria-hidden="true">📅</span><span data-k="today-l">Today</span></span><span class="gc-vc-val" data-k="today">—</span></div>' +
      '<div class="gc-vc-row"><span class="gc-vc-label"><span class="gc-vc-ico tot" aria-hidden="true">∑</span><span data-k="total-l">Total visits</span></span><span class="gc-vc-val" data-k="total">—</span></div>' +
      '<div class="gc-vc-tip" data-k="tip">Approx · no personal data</div>' +
      '</div></div>';
    document.body.appendChild(wrap);
    setTimeout(function(){
      try{
        var fab=document.getElementById('gcFabs')||document.getElementById('waFab');
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
    btn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      wrap.classList.toggle('collapsed');
      syncToggle();
    });
    /* छोटी गोली पर कहीं भी click करने से खुल जाए */
    wrap.querySelector('.gc-vc-card').addEventListener('click', function () {
      if (!wrap.classList.contains('collapsed')) return;
      wrap.classList.remove('collapsed');
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
