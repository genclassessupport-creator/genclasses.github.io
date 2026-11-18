/* UPPCS 2026 free mock tests + Highlight Book — compact promo card (runs till 30 Nov 2026).
   Appears right after the page opens on every new visit; "✕" hides it for the rest of that visit. */
(function () {
  var END = new Date("2026-11-30T23:59:59+05:30").getTime();
  var HUB = "/uppcs-2026-mock/";
  if (Date.now() > END) return;
  if (location.pathname.indexOf(HUB) === 0 || location.pathname.indexOf("/tests/") === 0) return;
  // shows on every new visit; ✕ or opening the tests hides it only for the rest of that visit
  var KEY = "gen_pcsmock_promo2";
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}
  function put() { try { sessionStorage.setItem(KEY, "1"); } catch (e) {} }

  function isEn() {
    var d = document.documentElement;
    var v = d.getAttribute("data-lang") || d.getAttribute("lang") || "";
    return v === "en";
  }
  var BOOK = "/downloads/#pdf-hl";
  var T = isEn()
    ? { tag: "FREE · UPPCS 2026", t1: "5 full-length mock tests", s1: "150 Qs each · with explanations", t2: "Highlight Book — read before exam", s2: "Current Affairs year compilation (PDF)", x: "Close" }
    : { tag: "निःशुल्क · UPPCS 2026", t1: "PCS के 5 फुल लेंथ मॉक टेस्ट", s1: "हर टेस्ट 150 प्रश्न · व्याख्या सहित", t2: "हाइलाइट बुक — परीक्षा से पहले", s2: "करेंट अफेयर्स वार्षिक संग्रह (PDF)", x: "बंद करें" };

  var css =
    ".gc-pm{position:fixed;left:50%;bottom:14px;z-index:9990;width:min(320px,calc(100vw - 24px));transform:translate(-50%,140%);opacity:0;transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .4s;font-family:Mukta,'Noto Sans Devanagari',system-ui,sans-serif}" +
    ".gc-pm.on{transform:translate(-50%,0);opacity:1}" +
    ".gc-pm .bx{position:relative;padding:8px 8px 8px 10px;border-radius:14px;background:#fff;color:#14213d;border:1px solid rgba(29,78,216,.22);border-left:4px solid #1d4ed8;box-shadow:0 10px 28px rgba(15,30,70,.16)}" +
    "html[data-theme='dark'] .gc-pm .bx{background:#13203a;color:#eef2ff;border-color:rgba(147,197,253,.25);border-left-color:#60a5fa;box-shadow:0 10px 28px rgba(0,0,0,.45)}" +
    ".gc-pm .tg{display:block;font-size:9.5px;font-weight:800;letter-spacing:.6px;color:#1d4ed8;margin:0 30px 3px 2px}" +
    "html[data-theme='dark'] .gc-pm .tg{color:#93c5fd}" +
    ".gc-pm a.r{display:flex;gap:9px;align-items:center;text-decoration:none;color:inherit;padding:5px 6px;border-radius:10px}" +
    ".gc-pm a.r:hover{background:rgba(29,78,216,.07)}" +
    ".gc-pm a.r+a.r{border-top:1px dashed rgba(100,116,139,.3);border-radius:0 0 10px 10px}" +
    ".gc-pm .ic{flex:none;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-size:16px;background:linear-gradient(145deg,#3b82f6,#1e3a8a);color:#fff}" +
    ".gc-pm .ic.bk{background:linear-gradient(145deg,#f59e0b,#e8590c)}" +
    ".gc-pm b{display:block;font-size:13.5px;line-height:1.25;font-weight:800}" +
    ".gc-pm small{display:block;font-size:11.5px;line-height:1.3;opacity:.75}" +
    ".gc-pm .ar{margin-left:auto;font-weight:800;color:#1d4ed8;font-size:14px}" +
    "html[data-theme='dark'] .gc-pm .ar{color:#93c5fd}" +
    ".gc-pm button{position:absolute;top:5px;right:5px;width:24px;height:24px;border:0;border-radius:999px;background:rgba(100,116,139,.12);color:inherit;font-size:12px;line-height:24px;cursor:pointer}" +
    "html[data-theme='dark'] .gc-pm button{color:#e2e8f0;background:rgba(255,255,255,.1)}" +
    "@media (max-width:600px){.gc-pm{left:10px;bottom:10px;width:calc(100vw - 92px);transform:translateY(140%)}.gc-pm.on{transform:none}.gc-pm b{font-size:12.8px}.gc-pm small{font-size:11px}}" +
    "@media (prefers-reduced-motion:reduce){.gc-pm{transition:none}}";

  function show() {
    var s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
    var w = document.createElement("div");
    w.className = "gc-pm";
    w.setAttribute("role", "complementary");
    w.setAttribute("aria-label", T.t1);
    w.innerHTML =
      '<div class="bx"><span class="tg">' + T.tag + '</span>' +
      '<a class="r" href="' + HUB + '"><span class="ic" aria-hidden="true">🎯</span><span><b>' + T.t1 + '</b><small>' + T.s1 + '</small></span><span class="ar">→</span></a>' +
      '<a class="r" href="' + BOOK + '"><span class="ic bk" aria-hidden="true">📕</span><span><b>' + T.t2 + '</b><small>' + T.s2 + '</small></span><span class="ar">→</span></a>' +
      '<button type="button" aria-label="' + T.x + '" title="' + T.x + '">✕</button></div>';
    document.body.appendChild(w);
    requestAnimationFrame(function () { requestAnimationFrame(function () { w.classList.add("on"); }); });
    function hide() { w.classList.remove("on"); setTimeout(function () { w.remove(); }, 600); }
    w.querySelector("button").addEventListener("click", function () {
      put();
      hide();
    });
    Array.prototype.forEach.call(w.querySelectorAll("a"), function (a) { a.addEventListener("click", function () { put(); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && w.isConnected) hide(); });
  }

  function later() { setTimeout(show, 700); }
  if (document.readyState !== "loading") later();
  else document.addEventListener("DOMContentLoaded", later);
})();
