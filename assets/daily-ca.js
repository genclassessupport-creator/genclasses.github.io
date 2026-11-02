/* GenClasses — आज का करंट (daily current-affairs points)
   Data: /ca/daily.json  →  { updated, days:[{date, points:[{hi,en,tag_hi,tag_en,src}]}] }
   Use: <div data-daily-ca="home"></div>  (rotating card)  or  data-daily-ca="full" (all points + past days) */
(function () {
  if (window.__gcDailyCa) return;
  window.__gcDailyCa = true;

  var MONTH_HI = ['जनवरी','फ़रवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];
  var MONTH_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function en() { return document.documentElement.getAttribute('lang') === 'en'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function istToday() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    catch (e) { var d = new Date(Date.now() + 5.5 * 36e5); return d.toISOString().slice(0, 10); }
  }
  function fmtDate(iso) {
    var p = String(iso).split('-'), d = +p[2], m = +p[1] - 1, y = p[0];
    return en() ? d + ' ' + MONTH_EN[m] + ' ' + y : d + ' ' + MONTH_HI[m] + ' ' + y;
  }
  function txt(pt) { return en() ? (pt.en || pt.hi) : (pt.hi || pt.en); }
  function tag(pt) { return en() ? (pt.tag_en || pt.tag_hi || '') : (pt.tag_hi || pt.tag_en || ''); }
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }

  function css() {
    if (document.getElementById('gcDcaCss')) return;
    var s = document.createElement('style');
    s.id = 'gcDcaCss';
    s.textContent = [
      '.dca{border:1px solid var(--line-2);border-radius:20px;background:linear-gradient(145deg,var(--glass),transparent),var(--ink1);box-shadow:var(--shadow,0 14px 36px rgba(0,0,0,.25));padding:18px 20px;position:relative;overflow:hidden}',
      '.dca-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:space-between;margin-bottom:12px}',
      '.dca-title{display:flex;align-items:center;gap:10px;min-width:0}',
      '.dca-live{width:9px;height:9px;border-radius:50%;background:#E5484D;box-shadow:0 0 0 0 rgba(229,72,77,.5);animation:dcaPulse 1.8s infinite;flex:none}',
      '@keyframes dcaPulse{0%{box-shadow:0 0 0 0 rgba(229,72,77,.5)}70%{box-shadow:0 0 0 9px rgba(229,72,77,0)}100%{box-shadow:0 0 0 0 rgba(229,72,77,0)}}',
      '.dca-title b{font-family:"Rozha One",serif;font-weight:400;font-size:20px;color:var(--cream);line-height:1.2}',
      '.dca-date{font-size:13px;font-weight:700;color:var(--gold-hi);background:var(--glass);border:1px solid var(--line-2);border-radius:999px;padding:3px 10px;white-space:nowrap}',
      '.dca-all{font-size:14px;font-weight:700;color:var(--gold-hi);white-space:nowrap}',
      '.dca-all:hover{text-decoration:underline}',
      '.dca-stage{min-height:118px;display:grid}',
      '.dca-slide{grid-area:1/1;opacity:0;transform:translateY(8px);transition:opacity .45s ease,transform .45s ease;pointer-events:none}',
      '.dca-slide.on{opacity:1;transform:none;pointer-events:auto}',
      '.dca-meta{display:flex;gap:8px;align-items:center;margin-bottom:6px;font-size:12.5px;font-weight:700}',
      '.dca-num{color:var(--mist)}',
      '.dca-tag{color:var(--gold-hi);border:1px solid var(--line-2);border-radius:999px;padding:1px 9px}',
      '.dca-text{font-size:17px;line-height:1.65;color:var(--cream);margin:0}',
      '.dca-foot{display:flex;align-items:center;gap:12px;margin-top:12px}',
      '.dca-bar{flex:1;height:4px;border-radius:4px;background:var(--line);overflow:hidden}',
      '.dca-bar i{display:block;height:100%;width:0;background:var(--gold-hi);border-radius:4px}',
      '.dca-btn{width:34px;height:34px;border-radius:50%;border:1px solid var(--line-2);background:var(--glass);color:var(--cream);font-size:17px;cursor:pointer;line-height:1;flex:none}',
      '.dca-btn:hover{border-color:var(--gold-hi)}',
      '.dca-count{font-size:13px;color:var(--mist);font-weight:700;min-width:44px;text-align:center}',
      '.dca-src{font-size:12px;color:var(--mist);margin-top:6px}',
      '.dca-src a{color:var(--mist);text-decoration:underline}',
      '.dca-days{display:flex;gap:8px;flex-wrap:wrap;margin:4px 0 14px}',
      '.dca-day{font:inherit;font-size:13px;font-weight:700;padding:5px 12px;border-radius:999px;border:1px solid var(--line-2);background:var(--glass);color:var(--cream);cursor:pointer}',
      '.dca-day.on{background:var(--gold-hi);color:var(--ink1);border-color:var(--gold-hi)}',
      '.dca-list{list-style:none;margin:0;padding:0;display:grid;gap:10px;counter-reset:dca}',
      '.dca-list li{counter-increment:dca;display:grid;grid-template-columns:34px 1fr;gap:10px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:var(--glass)}',
      '.dca-list li::before{content:counter(dca);width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:14px;color:var(--ink1);background:var(--gold-hi)}',
      '.dca-list .dca-text{font-size:16px}',
      '.dca-empty{color:var(--mist);margin:0}',
      '@media (max-width:560px){.dca{padding:16px 14px}.dca-title b{font-size:18px}.dca-text{font-size:16px}.dca-stage{min-height:150px}}',
      '@media (prefers-reduced-motion:reduce){.dca-slide{transition:none}.dca-live{animation:none}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function latestDay(data) {
    var days = (data && data.days) || [];
    days = days.filter(function (d) { return d && d.points && d.points.length; });
    days.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return days;
  }

  function dayLabel(day) {
    var today = istToday();
    if (day.date === today) return en() ? 'Today · ' + fmtDate(day.date) : 'आज · ' + fmtDate(day.date);
    return fmtDate(day.date);
  }

  /* ---------- rotating card for the home page ---------- */
  function home(root, data) {
    var days = latestDay(data);
    if (!days.length) { root.style.display = 'none'; return; }
    var day = days[0], pts = day.points, i = 0, timer = null, paused = false, DUR = 6500, t0 = 0, raf = 0;

    function paint() {
      root.innerHTML =
        '<div class="dca" aria-live="polite">' +
          '<div class="dca-head">' +
            '<div class="dca-title"><span class="dca-live" aria-hidden="true"></span><b>' + (en() ? "Today's Current Affairs" : 'आज का करंट') + '</b>' +
            '<span class="dca-date">' + esc(dayLabel(day)) + '</span></div>' +
            '<a class="dca-all" href="/up-ca/#aaj">' + (en() ? 'All ' + pts.length + ' points →' : 'सभी ' + pts.length + ' बिंदु →') + '</a>' +
          '</div>' +
          '<div class="dca-stage">' + pts.map(function (p, k) {
            return '<div class="dca-slide' + (k === i ? ' on' : '') + '" aria-hidden="' + (k === i ? 'false' : 'true') + '">' +
              '<div class="dca-meta"><span class="dca-num">' + (k + 1) + '/' + pts.length + '</span>' + (tag(p) ? '<span class="dca-tag">' + esc(tag(p)) + '</span>' : '') + '</div>' +
              '<p class="dca-text">' + esc(txt(p)) + '</p></div>';
          }).join('') + '</div>' +
          '<div class="dca-foot">' +
            '<button type="button" class="dca-btn" data-d="-1" aria-label="' + (en() ? 'Previous' : 'पिछला') + '">‹</button>' +
            '<div class="dca-bar"><i></i></div>' +
            '<span class="dca-count">' + (i + 1) + ' / ' + pts.length + '</span>' +
            '<button type="button" class="dca-btn" data-d="1" aria-label="' + (en() ? 'Next' : 'अगला') + '">›</button>' +
          '</div>' +
        '</div>';
      root.querySelectorAll('.dca-btn').forEach(function (b) {
        b.onclick = function () { go(i + Number(b.getAttribute('data-d'))); };
      });
      var card = root.querySelector('.dca');
      card.addEventListener('mouseenter', function () { paused = true; });
      card.addEventListener('mouseleave', function () { paused = false; t0 = performance.now() - elapsed; });
      card.addEventListener('focusin', function () { paused = true; });
      card.addEventListener('focusout', function () { paused = false; t0 = performance.now() - elapsed; });
      start();
    }

    var elapsed = 0;
    function go(n) {
      i = (n + pts.length) % pts.length;
      var slides = root.querySelectorAll('.dca-slide');
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      var c = root.querySelector('.dca-count'); if (c) c.textContent = (i + 1) + ' / ' + pts.length;
      start();
    }
    function start() {
      cancelAnimationFrame(raf); t0 = performance.now(); elapsed = 0;
      var bar = root.querySelector('.dca-bar i');
      (function step(now) {
        if (!paused && document.visibilityState !== 'hidden') elapsed = now - t0; else t0 = now - elapsed;
        if (bar) bar.style.width = Math.min(100, elapsed / DUR * 100) + '%';
        if (elapsed >= DUR) { go(i + 1); return; }
        raf = requestAnimationFrame(step);
      })(t0);
    }
    paint();
    document.addEventListener('gen-lang', paint);
  }

  /* ---------- full list (current-affairs page) ---------- */
  function full(root, data) {
    var days = latestDay(data);
    if (!days.length) { root.innerHTML = '<p class="dca-empty">' + (en() ? 'Points will appear here soon.' : 'बिंदु जल्द यहाँ दिखेंगे।') + '</p>'; return; }
    var sel = 0;
    function paint() {
      var day = days[sel];
      root.innerHTML =
        (days.length > 1 ? '<div class="dca-days">' + days.slice(0, 14).map(function (d, k) {
          return '<button type="button" class="dca-day' + (k === sel ? ' on' : '') + '" data-k="' + k + '">' + esc(k === 0 ? dayLabel(d) : fmtDate(d.date)) + '</button>';
        }).join('') + '</div>' : '<div class="dca-days"><span class="dca-date">' + esc(dayLabel(day)) + '</span></div>') +
        '<ol class="dca-list">' + day.points.map(function (p) {
          var h = host(p.src);
          return '<li><div><div class="dca-meta">' + (tag(p) ? '<span class="dca-tag">' + esc(tag(p)) + '</span>' : '') + '</div>' +
            '<p class="dca-text">' + esc(txt(p)) + '</p>' +
            (h ? '<div class="dca-src">' + (en() ? 'Source: ' : 'स्रोत: ') + '<a href="' + esc(p.src) + '" target="_blank" rel="noopener">' + esc(h) + '</a></div>' : '') +
            '</div></li>';
        }).join('') + '</ol>';
      root.querySelectorAll('.dca-day').forEach(function (b) {
        b.onclick = function () { sel = Number(b.getAttribute('data-k')); paint(); };
      });
    }
    paint();
    document.addEventListener('gen-lang', paint);
  }

  function boot() {
    var roots = document.querySelectorAll('[data-daily-ca]');
    if (!roots.length) return;
    css();
    /* दिन बदलते ही नया डेटा मिले — तारीख़ से cache तोड़ो */
    fetch('/ca/daily.json?d=' + istToday(), { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (data) {
        roots.forEach(function (r) { (r.getAttribute('data-daily-ca') === 'full' ? full : home)(r, data); });
      })
      .catch(function () { roots.forEach(function (r) { if (r.getAttribute('data-daily-ca') !== 'full') r.style.display = 'none'; }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
