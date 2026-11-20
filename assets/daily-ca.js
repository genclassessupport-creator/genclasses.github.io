/* GenClasses — आज का करंट (daily current-affairs points)
   Data: /ca/daily.json  →  { updated, days:[{date, points:[{hi,en,tag_hi,tag_en,src}]}] }
   Use: <div data-daily-ca="cards"></div> (card row with topic filters), "home" (slim rotating strip)
        or "full" (all points + past days) */
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
      /* मुखपृष्ठ की पतली पट्टी */
      '.dca-slim{display:flex;align-items:center;gap:14px;padding:8px 10px 9px 14px;border-radius:14px;box-shadow:0 6px 18px rgba(0,0,0,.08)}',
      '.dca-slim .dca-lbl{flex:none;display:flex;align-items:center;gap:8px;padding-right:14px;border-right:1px solid var(--line-2);color:var(--cream);font-weight:800;font-size:14.5px;line-height:1.15;white-space:nowrap}',
      '.dca-slim .dca-lbl small{display:block;font-size:11.5px;font-weight:700;color:var(--gold-hi)}',
      '.dca-slim .dca-stage{flex:1;min-width:0;min-height:0}',
      '.dca-slim .dca-slide{transform:translateY(5px);color:inherit}',
      '.dca-slim .dca-slide.on{transform:none}',
      '.dca-slim .dca-text{font-size:15px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.dca-slim .dca-tag{display:inline-block;font-size:11.5px;font-weight:800;line-height:1.5;padding:0 8px;margin-right:7px;vertical-align:1px}',
      '.dca-slim .dca-ctrl{flex:none;display:flex;align-items:center;gap:4px}',
      '.dca-slim .dca-btn{width:28px;height:28px;font-size:15px}',
      '.dca-slim .dca-count{font-size:12px;min-width:34px}',
      '.dca-slim .dca-all{font-size:13px;margin-left:6px}',
      '.dca-slim .dca-bar{position:absolute;left:0;right:0;bottom:0;height:2px;border-radius:0;background:transparent}',
      '.dca-slim .dca-bar i{border-radius:0;opacity:.7}',
      '@media (max-width:640px){.dca-slim{flex-wrap:wrap;gap:6px 10px;padding:8px 10px 10px 12px}.dca-slim .dca-lbl{flex:1;border-right:0;padding-right:0}.dca-slim .dca-lbl small{display:inline;margin-left:6px}.dca-slim .dca-stage{order:3;flex-basis:100%}.dca-slim .dca-text{font-size:14.5px;-webkit-line-clamp:3}.dca-slim .dca-all{display:none}}',
      /* मुखपृष्ठ के कार्ड (data-daily-ca="cards") */
      '.dcc-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px 28px;flex-wrap:wrap;margin-bottom:20px}',
      '.dcc-kick{display:inline-flex;align-items:center;gap:9px;font-size:13.5px;font-weight:800;letter-spacing:.06em;color:var(--gold-hi)}',
      '.dcc-head h2{margin-top:4px;font-size:clamp(28px,3.4vw,42px);line-height:1.2;color:var(--cream)}',
            '.dcc-chips{display:flex;flex-wrap:wrap;gap:8px}',
      '.dcc-chip{font:700 15.5px/1 "Mukta",sans-serif;height:40px;padding:0 17px;border-radius:999px;border:1.5px solid var(--line-2);background:var(--glass);color:var(--cream);cursor:pointer;white-space:nowrap;transition:background .16s,border-color .16s,color .16s}',
      '.dcc-chip:hover{border-color:var(--gold)}',
      '.dcc-chip.on{background:#12264D;border-color:#12264D;color:#F7DCA3;box-shadow:0 6px 16px rgba(18,38,77,.28)}',
      'html:not([data-theme="light"]) .dcc-chip.on{background:linear-gradient(135deg,#FFE3B8,#D9AE5F);border-color:#D9AE5F;color:#0A1426}',
      '.dcc-chip:focus-visible,.dcc-arrow:focus-visible,.dcc-card a:focus-visible{outline:2px solid var(--gold);outline-offset:2px}',
      '.dcc-track{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(272px,calc((100% - 54px)/4));gap:18px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;padding:4px 2px 26px;margin:0 -2px -14px}',
      '.dcc-track::-webkit-scrollbar{display:none}',
      '.dcc-card{--acc:#D9AE5F;scroll-snap-align:start;position:relative;display:flex;flex-direction:column;gap:12px;padding:20px 20px 16px;border-radius:18px;border:1px solid var(--line-2);background:linear-gradient(160deg,var(--glass),transparent 60%),var(--ink1);box-shadow:0 10px 26px rgba(8,18,38,.1);overflow:hidden;transition:transform .2s,box-shadow .2s,border-color .2s}',
      '.dcc-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--acc)}',
      '.dcc-card:hover{transform:translateY(-4px);border-color:var(--acc);box-shadow:0 18px 36px rgba(8,18,38,.18)}',
      '.dcc-top{display:flex;align-items:center;justify-content:space-between;gap:10px}',
      '.dcc-tag{font-size:13.5px;font-weight:800;line-height:1;padding:6px 11px;border-radius:8px;color:var(--acc);background:color-mix(in srgb,var(--acc) 14%,transparent)}',
      'html[data-theme="light"] .dcc-tag{color:color-mix(in srgb,var(--acc) 62%,#0A1426)}',
      '.dcc-no{font-family:"Rozha One",serif;font-size:26px;line-height:1;color:var(--mist);opacity:.38}',
      '.dcc-text{margin:0;font-size:16.5px;line-height:1.62;color:var(--cream);display:-webkit-box;-webkit-line-clamp:7;-webkit-box-orient:vertical;overflow:hidden}',
      '.dcc-foot{margin-top:auto;padding-top:11px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:14px;font-weight:700;color:var(--mist)}',
      '.dcc-foot a{color:var(--gold-hi);white-space:nowrap}',
      '.dcc-foot a:hover{text-decoration:underline}',
      '.dcc-bottom{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-top:12px}',
      '.dcc-more{display:flex;gap:10px 22px;flex-wrap:wrap;font-size:16px;font-weight:800;color:var(--gold-hi)}',
      '.dcc-more a:hover{text-decoration:underline}',
      '.dcc-arrows{display:flex;gap:8px}',
      '.dcc-arrow{width:44px;height:44px;border-radius:50%;border:1.5px solid var(--line-2);background:var(--glass);color:var(--cream);font-size:22px;line-height:1;cursor:pointer;transition:border-color .16s,opacity .16s}',
      '.dcc-arrow:hover{border-color:var(--gold)}',
      '.dcc-arrow:disabled{opacity:.35;cursor:default}',
      '.dcc-range{display:inline-flex;padding:5px;gap:4px;border-radius:999px;background:var(--glass);border:1px solid var(--line-2)}',
      '.dcc-rng{font:800 16px/1 "Mukta",sans-serif;height:42px;padding:0 22px;border:0;border-radius:999px;background:none;color:var(--mist);cursor:pointer;white-space:nowrap;transition:background .16s,color .16s}',
      '.dcc-rng:hover{color:var(--cream)}',
      '.dcc-rng.on{background:linear-gradient(135deg,var(--gold-hi),var(--gold));color:#0A1020;box-shadow:0 6px 18px rgba(255,170,60,.3)}',
      'html[data-theme="light"] .dcc-rng.on{background:#1B3BB3;color:#FFE3B8;box-shadow:0 6px 16px rgba(27,59,179,.25)}',
      '.dcc-rng:focus-visible{outline:2px solid var(--gold);outline-offset:2px}',
      '.dcc-chips{margin-bottom:16px;align-items:center}',
      '.dcc-total{margin-left:auto;font-size:14.5px;font-weight:700;color:var(--mist);white-space:nowrap}',
      /* ऊपर की चलती करंट-पंक्ति */
      '.cat{position:relative;z-index:4;display:flex;align-items:center;gap:14px;height:46px;margin-top:76px;padding:0 clamp(12px,2.2vw,34px);background:var(--ink1);border-bottom:1px solid var(--line);color:var(--cream);overflow:hidden}',
      '.cat[hidden]{display:block;visibility:hidden}',
      '.cat-lbl{flex:none;display:inline-flex;align-items:center;gap:9px;font-size:15px;font-weight:800;color:var(--gold-hi);white-space:nowrap}',
      '.cat-lbl small{font-size:13px;font-weight:600;color:var(--mist)}',
      '.cat-view{flex:1;min-width:0;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)}',
      '.cat-track{display:inline-flex;white-space:nowrap;animation:catRun 120s linear infinite;will-change:transform}',
      '.cat-dup{display:inline-flex}',
      '.cat:hover .cat-track,.cat:focus-visible .cat-track{animation-play-state:paused}',
      '@keyframes catRun{from{transform:translateX(0)}to{transform:translateX(-50%)}}',
      '.cat-it{display:inline-flex;align-items:center;gap:10px;padding-right:44px;font-size:16px;font-weight:500}',
      '.cat-it b{font-size:12.5px;font-weight:800;padding:2px 9px;border-radius:999px;color:var(--gold-hi);border:1px solid var(--line-2)}',
      '.cat-all{flex:none;font-size:14.5px;font-weight:800;color:var(--gold-hi);white-space:nowrap}',
      '.cat:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}',
      '@media (max-width:600px){.cat{margin-top:64px;height:42px;gap:10px}.cat-lbl small,.cat-all{display:none}.cat-it{font-size:15px}}',
      '@media (prefers-reduced-motion:reduce){.cat-track{animation:none}.cat-dup{display:none}.cat-view{-webkit-mask-image:none;mask-image:none}.cat-it:not(:first-child){display:none}.cat-it{overflow:hidden;text-overflow:ellipsis}}',
      '@media (max-width:1000px){.dcc-track{grid-auto-columns:minmax(264px,calc((100% - 18px)/2))}}',
      '@media (max-width:640px){.dcc-track{grid-auto-columns:84%;gap:12px}.dcc-head{margin-bottom:14px}.dcc-head p{font-size:15.5px}.dcc-chips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin:0 -14px;padding:0 14px 2px;max-width:100vw}.dcc-chip{height:38px;font-size:15px}.dcc-arrows{display:none}}',
      '@media (prefers-reduced-motion:reduce){.dcc-card,.dcc-chip{transition:none}.dcc-card:hover{transform:none}}',
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
      /* पतली पट्टी: बायाँ लेबल · बीच में बिंदु (2 पंक्ति तक) · दायाँ ‹ n/10 › सभी */
      root.innerHTML =
        '<div class="dca dca-slim" aria-live="polite">' +
          '<a class="dca-lbl" href="/up-ca/#aaj"><span class="dca-live" aria-hidden="true"></span>' +
            '<span>' + (en() ? 'Current Affairs' : 'आज का करंट') + '<small>' + esc(fmtDate(day.date)) + '</small></span></a>' +
          '<div class="dca-stage">' + pts.map(function (p, k) {
            return '<a class="dca-slide' + (k === i ? ' on' : '') + '" href="/up-ca/#aaj" tabindex="' + (k === i ? '0' : '-1') + '" aria-hidden="' + (k === i ? 'false' : 'true') + '">' +
              '<p class="dca-text">' + (tag(p) ? '<span class="dca-tag">' + esc(tag(p)) + '</span>' : '') + esc(txt(p)) + '</p></a>';
          }).join('') + '</div>' +
          '<div class="dca-ctrl">' +
            '<button type="button" class="dca-btn" data-d="-1" aria-label="' + (en() ? 'Previous' : 'पिछला') + '">‹</button>' +
            '<span class="dca-count">' + (i + 1) + '/' + pts.length + '</span>' +
            '<button type="button" class="dca-btn" data-d="1" aria-label="' + (en() ? 'Next' : 'अगला') + '">›</button>' +
            '<a class="dca-all" href="/up-ca/#aaj">' + (en() ? 'All →' : 'सभी →') + '</a>' +
          '</div>' +
          '<div class="dca-bar" aria-hidden="true"><i></i></div>' +
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
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); s.setAttribute('tabindex', k === i ? '0' : '-1'); });
      var c = root.querySelector('.dca-count'); if (c) c.textContent = (i + 1) + '/' + pts.length;
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

  /* ---------- one-line running strip of the latest day's points (top of the home page) ---------- */
  function ticker(root, data) {
    var days = latestDay(data);
    if (!days.length) return;
    var day = days[0];
    function paint() {
      var items = day.points.map(function (p) {
        return '<span class="cat-it">' + (tag(p) ? '<b>' + esc(tag(p)) + '</b>' : '') + esc(txt(p)) + '</span>';
      }).join('');
      root.innerHTML =
        '<span class="cat-lbl"><span class="dca-live" aria-hidden="true"></span>' + (en() ? 'Today' : 'आज का करंट') + '<small>' + esc(fmtDate(day.date)) + '</small></span>' +
        '<span class="cat-view"><span class="cat-track">' + items + '<span aria-hidden="true" class="cat-dup">' + items + '</span></span></span>' +
        '<span class="cat-all">' + (en() ? 'All →' : 'सभी →') + '</span>';
      root.hidden = false;
      var track = root.querySelector('.cat-track');
      /* गति चौड़ाई के हिसाब से: लगभग 55px प्रति सेकंड, ताकि पंक्ति आराम से पढ़ी जाए */
      requestAnimationFrame(function () { track.style.animationDuration = Math.max(40, Math.round(track.scrollWidth / 2 / 55)) + 's'; });
    }
    paint();
    document.addEventListener('gen-lang', paint);
  }

  /* ---------- card row with topic filters (home page) ---------- */
  var ACCENTS = ['#D9A441', '#4F8FF7', '#2FB380', '#E5604D', '#9B7BF0', '#22A6B8'];
  function cards(root, data) {
    var days = latestDay(data);
    if (!days.length) { root.style.display = 'none'; return; }
    /* ताज़ा = सबसे नए दिन के सभी बिंदु; विषय चुनने पर पिछले 7 दिनों में से उस विषय के बिंदु */
    var recent = [], RANGE = { day: 0, week: 6, month: 29 }, range = 'day', sel = '', MAXC = 40;
    days.forEach(function (d) { d.points.forEach(function (p, k) { recent.push({ p: p, date: d.date, n: k + 1 }); }); });
    var order = [], hue = {};
    recent.forEach(function (r) { var t = r.p.tag_hi || r.p.tag_en; if (t && order.indexOf(t) < 0) order.push(t); });
    order.forEach(function (t, k) { hue[t] = ACCENTS[k % ACCENTS.length]; });
    /* आज = सबसे नया दिन; हफ़्ता = उससे पिछले 7 दिन; महीना = पिछले 30 दिन */
    function since() { var d = new Date(days[0].date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - RANGE[range]); return d.toISOString().slice(0, 10); }
    function inRange() { var from = since(); return recent.filter(function (r) { return r.date >= from; }); }
    function topTags() {
      var count = {}, seen = [];
      inRange().forEach(function (r) { var t = r.p.tag_hi || r.p.tag_en; if (!t) return; if (!count[t]) { count[t] = 0; seen.push(t); } count[t]++; });
      return seen.sort(function (a, b) { return count[b] - count[a]; }).slice(0, 5);
    }
    function list() {
      var all = inRange();
      if (sel) all = all.filter(function (r) { return (r.p.tag_hi || r.p.tag_en) === sel; });
      return all;
    }
    function tagLabel(t) {
      for (var k = 0; k < recent.length; k++) if ((recent[k].p.tag_hi || recent[k].p.tag_en) === t) return tag(recent[k].p);
      return t;
    }
    function cardsHtml() {
      return list().slice(0, MAXC).map(function (r, k) {
        var t = r.p.tag_hi || r.p.tag_en, h = host(r.p.src);
        return '<article class="dcc-card" style="--acc:' + (hue[t] || ACCENTS[0]) + '">' +
          '<div class="dcc-top">' + (tag(r.p) ? '<span class="dcc-tag">' + esc(tag(r.p)) + '</span>' : '<span></span>') +
            '<span class="dcc-no" aria-hidden="true">' + (k < 9 ? '0' : '') + (k + 1) + '</span></div>' +
          '<p class="dcc-text">' + esc(txt(r.p)) + '</p>' +
          '<div class="dcc-foot"><span>' + esc(fmtDate(r.date)) + '</span>' +
            (h ? '<a href="' + esc(r.p.src) + '" target="_blank" rel="noopener">' + (en() ? 'Source ↗' : 'स्रोत ↗') + '</a>' : '') +
          '</div></article>';
      }).join('');
    }
    function paint() {
      var E = en(), tags = topTags(), total = list().length;
      if (sel && tags.indexOf(sel) < 0) tags.push(sel);
      var R = [['day', 'आज', 'Today'], ['week', 'इस हफ़्ते', 'This week'], ['month', 'इस महीने', 'This month']];
      root.innerHTML =
        '<div class="dcc">' +
          '<div class="dcc-head"><div>' +
            '<span class="dcc-kick"><span class="dca-live" aria-hidden="true"></span>' + (E ? 'Updated ' : 'अद्यतन · ') + esc(fmtDate(days[0].date)) + '</span>' +
            '<h2>' + (E ? 'Current affairs updates' : 'करंट अफेयर्स अपडेट') + '</h2>' +
          '</div>' +
          '<div class="dcc-range" role="group" aria-label="' + (E ? 'Period' : 'अवधि') + '">' +
            R.map(function (r) { return '<button type="button" class="dcc-rng' + (range === r[0] ? ' on' : '') + '" data-r="' + r[0] + '" aria-pressed="' + (range === r[0]) + '">' + (E ? r[2] : r[1]) + '</button>'; }).join('') +
          '</div></div>' +
          '<div class="dcc-chips" role="group" aria-label="' + (E ? 'Filter by topic' : 'विषय से छाँटें') + '">' +
            '<button type="button" class="dcc-chip' + (sel ? '' : ' on') + '" data-t="" aria-pressed="' + (sel ? 'false' : 'true') + '">' + (E ? 'All topics' : 'सभी विषय') + '</button>' +
            tags.map(function (t) { return '<button type="button" class="dcc-chip' + (sel === t ? ' on' : '') + '" data-t="' + esc(t) + '" aria-pressed="' + (sel === t ? 'true' : 'false') + '">' + esc(tagLabel(t)) + '</button>'; }).join('') +
            '<span class="dcc-total">' + total + (E ? ' points' : ' बिंदु') + '</span>' +
          '</div>' +
          '<div class="dcc-track" tabindex="0" aria-label="' + (en() ? 'Current affairs points' : 'करंट अफेयर्स के बिंदु') + '">' + cardsHtml() + '</div>' +
          '<div class="dcc-bottom"><div class="dcc-more">' +
            '<a href="/up-ca/#aaj">' + (en() ? 'See all points →' : 'सभी बिंदु देखें →') + '</a>' +
            '<a href="/daily/">' + (en() ? 'Daily 5 quiz →' : 'डेली 5 क्विज़ →') + '</a>' +
          '</div><div class="dcc-arrows">' +
            '<button type="button" class="dcc-arrow" data-d="-1" aria-label="' + (en() ? 'Previous' : 'पिछला') + '">‹</button>' +
            '<button type="button" class="dcc-arrow" data-d="1" aria-label="' + (en() ? 'Next' : 'अगला') + '">›</button>' +
          '</div></div>' +
        '</div>';
      var track = root.querySelector('.dcc-track'), arrows = root.querySelectorAll('.dcc-arrow');
      function sync() {
        var max = track.scrollWidth - track.clientWidth - 2;
        arrows[0].disabled = track.scrollLeft <= 2;
        arrows[1].disabled = track.scrollLeft >= max;
      }
      arrows.forEach(function (b) {
        b.onclick = function () {
          var card = track.querySelector('.dcc-card'), step = card ? card.getBoundingClientRect().width + 18 : 300;
          var n = Math.max(1, Math.floor(track.clientWidth / step));
          track.scrollBy({ left: Number(b.getAttribute('data-d')) * step * n, behavior: 'smooth' });
        };
      });
      track.addEventListener('scroll', sync, { passive: true });
      sync();
      root.querySelectorAll('.dcc-chip').forEach(function (c) {
        c.onclick = function () { sel = c.getAttribute('data-t'); paint(); var on = root.querySelector('.dcc-chip.on'); if (on) on.focus(); };
      });
      root.querySelectorAll('.dcc-rng').forEach(function (c) {
        c.onclick = function () { range = c.getAttribute('data-r'); sel = ''; paint(); var on = root.querySelector('.dcc-rng.on'); if (on) on.focus(); };
      });
    }
    paint();
    window.addEventListener('resize', function () { var a = root.querySelectorAll('.dcc-arrow'), t = root.querySelector('.dcc-track'); if (t && a.length) { a[0].disabled = t.scrollLeft <= 2; a[1].disabled = t.scrollLeft >= t.scrollWidth - t.clientWidth - 2; } });
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
        roots.forEach(function (r) { var m = r.getAttribute('data-daily-ca'); (m === 'full' ? full : m === 'cards' ? cards : m === 'ticker' ? ticker : home)(r, data); });
      })
      .catch(function () { roots.forEach(function (r) { if (r.getAttribute('data-daily-ca') !== 'full') r.style.display = 'none'; }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
