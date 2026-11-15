/* UPPCS 2026 free mock tests — gentle promo card (runs till 30 Nov 2026).
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
  var T = isEn()
    ? { tag: "FREE · UPPCS 2026", h: "5 full-length mock tests are live", p: "150 questions each, 2 hours, exam-like mix of current affairs and GS — with explanations.", go: "Start a free test →", x: "Close" }
    : { tag: "निःशुल्क · UPPCS 2026", h: "PCS के 5 फुल लेंथ मॉक टेस्ट आ गए", p: "हर टेस्ट में 150 प्रश्न, 2 घंटे, परीक्षा जैसा करेंट अफेयर्स + GS मिश्रण — व्याख्या सहित।", go: "निःशुल्क टेस्ट दें →", x: "बंद करें" };

  var css =
    ".gc-pm{position:fixed;left:50%;bottom:18px;z-index:9990;width:min(380px,calc(100vw - 24px));transform:translate(-50%,140%);opacity:0;transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .4s;font-family:Mukta,'Noto Sans Devanagari',system-ui,sans-serif}" +
    ".gc-pm.on{transform:translate(-50%,0);opacity:1}" +
    ".gc-pm a.gc-pm-card{display:flex;gap:12px;align-items:flex-start;text-decoration:none;padding:14px 40px 14px 14px;border-radius:16px;background:#fff;color:#14213d;border:1px solid rgba(29,78,216,.22);border-left:4px solid #1d4ed8;box-shadow:0 14px 38px rgba(15,30,70,.18)}" +
    "html[data-theme='dark'] .gc-pm a.gc-pm-card{background:#13203a;color:#eef2ff;border-color:rgba(147,197,253,.25);border-left-color:#60a5fa;box-shadow:0 14px 38px rgba(0,0,0,.45)}" +
    ".gc-pm .ic{flex:none;width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:linear-gradient(145deg,#3b82f6,#1e3a8a);color:#fff}" +
    ".gc-pm .tg{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.6px;color:#1d4ed8;margin-bottom:2px}" +
    "html[data-theme='dark'] .gc-pm .tg{color:#93c5fd}" +
    ".gc-pm b{display:block;font-size:15.5px;line-height:1.3;font-weight:800}" +
    ".gc-pm p{margin:3px 0 7px;font-size:12.8px;line-height:1.45;opacity:.82}" +
    ".gc-pm .go{font-size:13px;font-weight:800;color:#1d4ed8}" +
    "html[data-theme='dark'] .gc-pm .go{color:#93c5fd}" +
    ".gc-pm button{position:absolute;top:8px;right:8px;width:28px;height:28px;border:0;border-radius:999px;background:rgba(100,116,139,.12);color:inherit;font-size:15px;line-height:28px;cursor:pointer}" +
    "html[data-theme='dark'] .gc-pm button{color:#e2e8f0;background:rgba(255,255,255,.1)}" +
    "@media (max-width:600px){.gc-pm{bottom:12px}.gc-pm p{font-size:12.3px}}" +
    "@media (prefers-reduced-motion:reduce){.gc-pm{transition:none}}";

  function show() {
    var s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
    var w = document.createElement("div");
    w.className = "gc-pm";
    w.setAttribute("role", "complementary");
    w.setAttribute("aria-label", T.h);
    w.innerHTML =
      '<a class="gc-pm-card" href="' + HUB + '"><span class="ic" aria-hidden="true">🎯</span><span>' +
      '<span class="tg">' + T.tag + "</span><b>" + T.h + "</b><p>" + T.p + '</p><span class="go">' + T.go + "</span></span></a>" +
      '<button type="button" aria-label="' + T.x + '" title="' + T.x + '">✕</button>';
    document.body.appendChild(w);
    requestAnimationFrame(function () { requestAnimationFrame(function () { w.classList.add("on"); }); });
    function hide() { w.classList.remove("on"); setTimeout(function () { w.remove(); }, 600); }
    w.querySelector("button").addEventListener("click", function () {
      put();
      hide();
    });
    w.querySelector("a").addEventListener("click", function () { put(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && w.isConnected) hide(); });
  }

  function later() { setTimeout(show, 700); }
  if (document.readyState !== "loading") later();
  else document.addEventListener("DOMContentLoaded", later);
})();
