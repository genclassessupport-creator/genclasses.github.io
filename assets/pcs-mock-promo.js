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
    ? { tag: "FREE · UPPCS 2026", t1: "5 mock tests", s1: "150 questions each with explanations", t2: "Highlight Book", s2: "Current Affairs year compilation (PDF)", x: "Close" }
    : { tag: "निःशुल्क · UPPCS 2026", t1: "5 मॉक टेस्ट", s1: "हर टेस्ट में 150 प्रश्न और व्याख्या", t2: "हाइलाइट बुक", s2: "करेंट अफेयर्स वार्षिक संग्रह (PDF)", x: "बंद करें" };

  var css = [
    ".gc-pm{position:fixed;left:50%;bottom:12px;z-index:9990;width:min(256px,calc(100vw - 24px));transform:translate(-50%,140%);opacity:0;transition:transform .4s,opacity .3s;font-family:Mukta,system-ui,sans-serif}",
    ".gc-pm.on{transform:translate(-50%,0);opacity:1}",
    ".gc-pm .bx{position:relative;padding:6px 8px;border-radius:10px;background:#fff;color:#14213d;border:1px solid #bacbe5;border-left:3px solid #1d4ed8;box-shadow:0 5px 16px #192f531f}",
    ".gc-pm .tg{display:block;color:#1d4ed8;font-size:10px;font-weight:800;line-height:1.35;letter-spacing:.04em;padding-right:26px}",
    ".gc-pm .links{display:flex;align-items:center;margin-top:4px;gap:6px}",
    ".gc-pm a.r{flex:1;text-align:center;text-decoration:none;color:inherit;font:700 13px/1.3 Mukta,system-ui,sans-serif;border:1px solid #b9c8db;border-radius:6px;padding:4px 2px;white-space:nowrap}",
    ".gc-pm a.r:hover,.gc-pm a.r:focus-visible{background:#e7eff8;color:#152e53}",
    ".gc-pm button{position:absolute;top:1px;right:4px;width:25px;height:24px;border:0;background:transparent;color:inherit;cursor:pointer}",
    "html[data-theme='dark'] .gc-pm .bx{background:#13203a;color:#eef2ff;border-color:#456188;border-left-color:#60a5fa}",
    "html[data-theme='dark'] .gc-pm .tg{color:#93c5fd}",
    "@media(max-width:600px){.gc-pm{left:10px;bottom:10px;width:min(235px,calc(100vw - 85px));transform:translateY(140%)}.gc-pm.on{transform:none}}",
    "@media(prefers-reduced-motion:reduce){.gc-pm{transition:none}}"
  ].join("");
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
      '<div class="links"><a class="r" href="' + HUB + '" title="' + T.s1 + '" aria-label="' + T.t1 + ' · ' + T.s1 + '">' + T.t1 + '</a>' +
      '<a class="r" href="' + BOOK + '" title="' + T.s2 + '" aria-label="' + T.t2 + ' · ' + T.s2 + '">' + T.t2 + '</a></div>' +
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
