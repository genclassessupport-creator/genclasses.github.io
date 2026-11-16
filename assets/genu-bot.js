/* ═══════════════════════════════════════════════════════════════
   जेनू — GenClasses का नन्हा रोबोट-गाइड
   स्क्रीन के नीचे चलता-फिरता है, हाथ हिलाता है, आँखें माउस का पीछा
   करती हैं, और जिस हिस्से पर आप पहुँचें, वहाँ बताता है कि क्या है।
   जेनू पर टैप करें तो "कहाँ चलें?" मेन्यू खुलता है।
   किसी भी पेज पर जोड़ने के लिए: <script src="/assets/genu-bot.js" defer></script>
   ═══════════════════════════════════════════════════════════════ */
(function(){
"use strict";
if(window.__genu) return; window.__genu=1;
try{ if(sessionStorage.getItem("genu_hide")==="1") return; }catch(e){}

var REDUCED=false, FINE=false;
try{ REDUCED=matchMedia("(prefers-reduced-motion: reduce)").matches; FINE=matchMedia("(pointer: fine)").matches; }catch(e){}
function isEn(){ return (document.documentElement.getAttribute("lang")||"hi")==="en"; }
function L(hi,en){ return isEn()?en:hi; }
function sleep(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }
function rnd(a,b){ return a+Math.random()*(b-a); }

/* ───────── रूप-सज्जा ───────── */
var css=
".genu{--gs:94px;position:fixed;left:0;bottom:64px;z-index:95;width:var(--gs);height:calc(var(--gs)*1.25);pointer-events:none;will-change:transform;font-family:Mukta,'Noto Sans Devanagari',system-ui,sans-serif}"+
".genu-btn{all:unset;position:absolute;inset:0;cursor:pointer;pointer-events:auto;-webkit-tap-highlight-color:transparent}"+
".genu-btn:focus-visible{outline:2.5px solid #3b82f6;outline-offset:4px;border-radius:18px}"+
".genu-flip{width:100%;height:100%;transition:transform .25s}"+
".genu-flip.left{transform:scaleX(-1)}"+
".genu svg{width:100%;height:100%;overflow:visible;display:block}"+
".genu-shadow{position:absolute;left:18%;right:18%;bottom:-4px;height:8px;border-radius:50%;background:rgba(15,23,42,.22);filter:blur(2px);transition:transform .3s,opacity .3s}"+
/* अंग */
".genu .g-all{transform-origin:60px 140px}"+
".genu .g-bulb{animation:gBulb 1.8s ease-in-out infinite}"+
"@keyframes gBulb{0%,100%{fill:#fbbf24;filter:drop-shadow(0 0 2px #fbbf24)}50%{fill:#fde68a;filter:drop-shadow(0 0 8px #fbbf24)}}"+
".genu .g-ant{transform-origin:60px 22px;animation:gAnt 3.2s ease-in-out infinite}"+
"@keyframes gAnt{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}"+
".genu .g-eyes{transition:transform .18s ease-out}"+
".genu .g-eye{transform-box:fill-box;transform-origin:center;animation:gBlink 4.6s infinite}"+
"@keyframes gBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}"+
".genu .g-happy{display:none}"+
".genu.happy .g-happy{display:inline}.genu.happy .g-eye{display:none}"+
".genu .g-mouth-o{display:none}"+
".genu.talk .g-mouth{animation:gTalkA .32s steps(1) infinite}.genu.talk .g-mouth-o{display:inline;animation:gTalkB .32s steps(1) infinite}"+
"@keyframes gTalkA{0%{opacity:1}50%{opacity:0}}@keyframes gTalkB{0%{opacity:0}50%{opacity:1}}"+
".genu .g-core{animation:gCore 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}"+
"@keyframes gCore{0%,100%{opacity:.75;transform:scale(1)}50%{opacity:1;transform:scale(1.18)}}"+
".genu .g-arm.l{transform-origin:25px 92px;transition:transform .35s}"+
".genu .g-arm.r{transform-origin:95px 92px;transition:transform .35s}"+
".genu .g-leg.l{transform-origin:48px 120px}.genu .g-leg.r{transform-origin:72px 120px}"+
".genu.walk .g-all{animation:gBob .42s ease-in-out infinite}"+
"@keyframes gBob{50%{transform:translateY(-4px)}}"+
".genu.walk .g-leg.l{animation:gStep .42s ease-in-out infinite}"+
".genu.walk .g-leg.r{animation:gStep .42s ease-in-out infinite reverse}"+
"@keyframes gStep{0%,100%{transform:rotate(16deg)}50%{transform:rotate(-16deg)}}"+
".genu.walk .g-arm.l{animation:gSwing .42s ease-in-out infinite reverse}"+
".genu.walk .g-arm.r{animation:gSwing .42s ease-in-out infinite}"+
"@keyframes gSwing{0%,100%{transform:rotate(14deg)}50%{transform:rotate(-14deg)}}"+
".genu.wave .g-arm.r{animation:gWave .5s ease-in-out infinite alternate}"+
"@keyframes gWave{from{transform:rotate(-120deg)}to{transform:rotate(-160deg)}}"+
".genu.point .g-arm.r{transform:rotate(-165deg)}"+
".genu.point .g-arm.l{transform:rotate(20deg)}"+
".genu.jump .g-all{animation:gJump .7s cubic-bezier(.3,1.4,.5,1)}"+
"@keyframes gJump{0%{transform:translateY(0) scaleY(1)}15%{transform:translateY(0) scaleY(.88)}45%{transform:translateY(-30px) scaleY(1.05)}75%{transform:translateY(0) scaleY(.94)}100%{transform:none}}"+
".genu.jump .genu-shadow{transform:scale(.6);opacity:.5}"+
".genu .g-jet{opacity:0;transform-origin:60px 146px}"+
".genu.fly .g-jet{opacity:1;animation:gJet .12s linear infinite alternate}"+
"@keyframes gJet{from{transform:scaleY(.8)}to{transform:scaleY(1.25)}}"+
".genu.fly .g-all{animation:gFly 1.4s cubic-bezier(.4,0,.3,1)}"+
"@keyframes gFly{0%{transform:none}40%{transform:translateY(-70px) rotate(-6deg)}70%{transform:translateY(-60px) rotate(5deg)}100%{transform:none}}"+
".genu.fly .genu-shadow{transform:scale(.4);opacity:.3}"+
".genu.enter .g-all{animation:gHi .6s ease-out}"+
"@keyframes gHi{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}"+
/* बोल-बुलबुला */
".genu-bub{position:fixed;z-index:96;bottom:calc(64px + var(--gs,94px)*1.25 + 14px);left:0;width:max-content;max-width:min(270px,calc(100vw - 20px));"+
"padding:11px 14px 12px;border-radius:18px;background:#fff;color:#172E5C;border:1.5px solid rgba(30,58,138,.18);"+
"box-shadow:0 16px 40px rgba(23,46,92,.22);font-size:14.5px;line-height:1.45;font-weight:600;"+
"opacity:0;transform:translateY(10px) scale(.85);transform-origin:var(--tx,40px) 100%;pointer-events:none;"+
"transition:opacity .25s,transform .35s cubic-bezier(.3,1.5,.5,1);font-family:Mukta,'Noto Sans Devanagari',system-ui,sans-serif}"+
".genu-bub.show{opacity:1;transform:none;pointer-events:auto}"+
".genu-bub::after{content:'';position:absolute;bottom:-8px;left:calc(var(--tx,40px) - 8px);width:15px;height:15px;background:inherit;border-right:1.5px solid rgba(30,58,138,.18);border-bottom:1.5px solid rgba(30,58,138,.18);transform:rotate(45deg);border-bottom-right-radius:4px}"+
"html:not([data-theme='light']) .genu-bub{background:#13213F;color:#EAF0FA;border-color:rgba(127,180,255,.28);box-shadow:0 16px 40px rgba(0,0,0,.45)}"+
"html:not([data-theme='light']) .genu-bub::after{border-color:rgba(127,180,255,.28)}"+
".genu-bub .gb-name{display:block;font-size:11px;letter-spacing:1.5px;font-weight:800;color:#2563eb;margin-bottom:2px}"+
"html:not([data-theme='light']) .genu-bub .gb-name{color:#7FB4FF}"+
".genu-bub .gb-txt .ch{opacity:0;animation:gbCh .01s forwards}"+
"@keyframes gbCh{to{opacity:1}}"+
".genu-bub .gb-go{display:inline-flex;margin-top:8px;padding:6px 13px;border-radius:999px;background:linear-gradient(135deg,#1E3A8A,#2563eb);color:#fff;font-size:13px;font-weight:700;text-decoration:none;box-shadow:0 6px 16px rgba(37,99,235,.35)}"+
".genu-bub .gb-go:hover{filter:brightness(1.12)}"+
".genu-bub .gb-x{position:absolute;top:6px;right:8px;border:0;background:none;color:inherit;opacity:.45;font-size:15px;cursor:pointer;line-height:1;padding:2px}"+
".genu-bub .gb-x:hover{opacity:1}"+
".genu-bub .gb-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}"+
".genu-bub .gb-grid a{display:flex;align-items:center;gap:6px;padding:7px 9px;border-radius:12px;font-size:13px;font-weight:700;text-decoration:none;color:inherit;background:rgba(30,58,138,.07);transition:background .2s,transform .2s}"+
".genu-bub .gb-grid a:hover{background:rgba(37,99,235,.16);transform:translateY(-2px)}"+
"html:not([data-theme='light']) .genu-bub .gb-grid a{background:rgba(255,255,255,.07)}"+
".genu-bub .gb-hide{display:block;margin-top:9px;border:0;background:none;color:inherit;opacity:.55;font:inherit;font-size:12px;cursor:pointer;text-decoration:underline;padding:0}"+
".genu-zz{position:absolute;right:-4px;top:-6px;font-size:14px;font-weight:800;color:#2563eb;opacity:0}"+
"@media(max-width:600px){.genu{--gs:62px;bottom:62px}.genu-bub{bottom:calc(62px + var(--gs,62px)*1.25 + 12px);font-size:13.5px}}"+
"@media print{.genu,.genu-bub{display:none!important}}";

var st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

/* ───────── रोबोट का चित्र ───────── */
var SVG='<svg viewBox="0 0 120 150" aria-hidden="true"><defs>'+
'<linearGradient id="gnH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9e4f5"/></linearGradient>'+
'<linearGradient id="gnS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f1d3d"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient>'+
'<linearGradient id="gnJ" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset=".5" stop-color="#f97316"/><stop offset="1" stop-color="#ef4444" stop-opacity="0"/></linearGradient>'+
'</defs><g class="g-all">'+
'<g class="g-jet"><path d="M44 140 L48 160 L52 140Z M68 140 L72 160 L76 140Z" fill="url(#gnJ)"/></g>'+
'<g class="g-leg l"><rect x="42" y="118" width="12" height="18" rx="6" fill="#1E3A8A"/><rect x="37" y="132" width="21" height="10" rx="5" fill="#3b82f6" stroke="#1E3A8A" stroke-width="2"/></g>'+
'<g class="g-leg r"><rect x="66" y="118" width="12" height="18" rx="6" fill="#1E3A8A"/><rect x="62" y="132" width="21" height="10" rx="5" fill="#3b82f6" stroke="#1E3A8A" stroke-width="2"/></g>'+
'<g class="g-arm l"><rect x="19" y="89" width="12" height="27" rx="6" fill="#3b82f6" stroke="#1E3A8A" stroke-width="2"/><circle cx="25" cy="118" r="6.5" fill="#fff" stroke="#1E3A8A" stroke-width="2"/></g>'+
'<g class="g-arm r"><rect x="89" y="89" width="12" height="27" rx="6" fill="#3b82f6" stroke="#1E3A8A" stroke-width="2"/><circle cx="95" cy="118" r="6.5" fill="#fff" stroke="#1E3A8A" stroke-width="2"/></g>'+
'<rect x="31" y="84" width="58" height="40" rx="15" fill="url(#gnH)" stroke="#1E3A8A" stroke-width="2.5"/>'+
'<rect x="40" y="92" width="40" height="22" rx="8" fill="#e8eefb" stroke="#c7d4ee" stroke-width="1.5"/>'+
'<circle class="g-core" cx="60" cy="103" r="6" fill="#22d3ee"/>'+
'<rect x="52" y="78" width="16" height="9" rx="3" fill="#94a3b8"/>'+
'<g class="g-ant"><line x1="60" y1="24" x2="60" y2="9" stroke="#1E3A8A" stroke-width="3" stroke-linecap="round"/><circle class="g-bulb" cx="60" cy="7" r="5.5" fill="#fbbf24"/></g>'+
'<rect x="10" y="40" width="11" height="24" rx="5.5" fill="#3b82f6" stroke="#1E3A8A" stroke-width="2"/>'+
'<rect x="99" y="40" width="11" height="24" rx="5.5" fill="#3b82f6" stroke="#1E3A8A" stroke-width="2"/>'+
'<rect x="17" y="20" width="86" height="62" rx="25" fill="url(#gnH)" stroke="#1E3A8A" stroke-width="2.5"/>'+
'<rect x="27" y="30" width="66" height="42" rx="17" fill="url(#gnS)"/>'+
'<path d="M33 36 q10 -4 22 -3" stroke="#fff" stroke-opacity=".25" stroke-width="3" stroke-linecap="round" fill="none"/>'+
'<g class="g-eyes">'+
'<rect class="g-eye" x="40" y="42" width="11" height="15" rx="5.5" fill="#7dd3fc"/>'+
'<rect class="g-eye" x="69" y="42" width="11" height="15" rx="5.5" fill="#7dd3fc"/>'+
'<circle class="g-eye" cx="48" cy="45.5" r="2" fill="#fff"/><circle class="g-eye" cx="77" cy="45.5" r="2" fill="#fff"/>'+
'<path class="g-happy" d="M39 52 q6.5 -9 13 0 M68 52 q6.5 -9 13 0" stroke="#7dd3fc" stroke-width="3.2" stroke-linecap="round" fill="none"/>'+
'</g>'+
'<path class="g-mouth" d="M53 62 q7 6 14 0" stroke="#7dd3fc" stroke-width="2.6" stroke-linecap="round" fill="none"/>'+
'<ellipse class="g-mouth-o" cx="60" cy="63" rx="4.5" ry="3.6" fill="#7dd3fc"/>'+
'<circle cx="35" cy="63" r="4" fill="#f472b6" fill-opacity=".6"/><circle cx="85" cy="63" r="4" fill="#f472b6" fill-opacity=".6"/>'+
'</g></svg>';

var bot=document.createElement("div");
bot.className="genu";
bot.innerHTML='<button type="button" class="genu-btn" aria-label="जेनू — साइट गाइड"><div class="genu-flip">'+SVG+'</div></button><span class="genu-shadow"></span>';
var bub=document.createElement("div");
bub.className="genu-bub"; bub.setAttribute("role","status"); bub.setAttribute("aria-live","polite");
document.body.appendChild(bot); document.body.appendChild(bub);
var flip=bot.querySelector(".genu-flip"), eyes=bot.querySelector(".g-eyes"), btn=bot.querySelector(".genu-btn");

/* ───────── स्थिति ───────── */
var x=-120, target=null, walkRaf=0, facing=1, busy=false, menuOpen=false, lastSay=0, hideT=0, hidden=false;
function W(){ return bot.offsetWidth||94; }
function minX(){ return 10; }
function maxX(){ var vw=innerWidth; return Math.max(minX()+10, vw-W()-(vw<600?78:104)); }
function place(){ bot.style.transform="translateX("+x.toFixed(1)+"px)"; if(bub.classList.contains("show")) aimBubble(); }
function face(d){ if(d===facing) return; facing=d; flip.classList.toggle("left",d<0); }
function setCls(c,on){ bot.classList.toggle(c,!!on); }
function pulse(c,ms){ bot.classList.remove(c); void bot.offsetWidth; bot.classList.add(c); return sleep(ms).then(function(){ bot.classList.remove(c); }); }

function walkTo(tx){
  tx=Math.max(minX(),Math.min(maxX(),tx));
  return new Promise(function(res){
    if(REDUCED){ x=tx; place(); res(); return; }
    cancelAnimationFrame(walkRaf);
    face(tx>=x?1:-1); setCls("walk",1);
    var last=0, speed=innerWidth<600?60:85;
    function step(ts){
      var dt=last?Math.min(ts-last,50):16; last=ts;
      var d=tx-x, mv=speed*dt/1000;
      if(Math.abs(d)<=mv){ x=tx; place(); setCls("walk",0); res(); return; }
      x+=Math.sign(d)*mv; place();
      walkRaf=requestAnimationFrame(step);
    }
    walkRaf=requestAnimationFrame(step);
  });
}

/* ───────── बोलना ───────── */
function aimBubble(){
  var bw=bub.offsetWidth, vw=innerWidth, cx=x+W()/2;
  var left=Math.max(10,Math.min(vw-bw-10,cx-bw/2));
  bub.style.left=left+"px";
  bub.style.setProperty("--tx",Math.max(18,Math.min(bw-18,cx-left))+"px");
  bub.style.setProperty("--gs",W()+"px");
}
function typeIn(el,text){
  if(REDUCED){ el.textContent=text; return; }
  var chars=Array.from(text), html="";
  for(var i=0;i<chars.length;i++) html+='<span class="ch" style="animation-delay:'+(i*22)+'ms">'+chars[i].replace(/&/g,"&amp;").replace(/</g,"&lt;")+'</span>';
  el.innerHTML=html;
}
function say(text,opt){
  opt=opt||{};
  clearTimeout(hideT); menuOpen=false; lastSay=Date.now();
  bub.innerHTML='<button type="button" class="gb-x" aria-label="'+L("बंद करें","Close")+'">✕</button><span class="gb-name">'+L("जेनू 🤖","GENU 🤖")+'</span><span class="gb-txt"></span>'+
    (opt.href?'<br><a class="gb-go" href="'+opt.href+'">'+opt.go+'</a>':'');
  typeIn(bub.querySelector(".gb-txt"),text);
  aimBubble(); bub.classList.add("show");
  setCls("talk",1);
  setTimeout(function(){ setCls("talk",0); }, REDUCED?0:Math.min(2600,Array.from(text).length*24+300));
  hideT=setTimeout(shut,opt.ms||6000);
  bub.querySelector(".gb-x").onclick=shut;
  var go=bub.querySelector(".gb-go"); if(go) go.onclick=function(e){ travel(e,opt.href); };
}
function shut(){ clearTimeout(hideT); bub.classList.remove("show"); menuOpen=false; setCls("talk",0); setCls("point",0); setCls("happy",0); }

/* ───────── मेन्यू ───────── */
var MENU=[
  ["#tests","🎯","टेस्ट सीरीज़","Test series"],
  ["/downloads/","📄","मुफ़्त PDF","Free PDFs"],
  ["/uppcs-prelims-pyq/","📜","PYQ","PYQ"],
  ["/daily/","⚡","डेली क्विज़","Daily quiz"],
  ["/flashcards/","🃏","फ्लैशकार्ड","Flashcards"],
  ["/up-ca/","📰","करेंट अफेयर्स","Current affairs"],
  ["/syllabus/","🗺️","सिलेबस","Syllabus"],
  ["/csat/","🧮","CSAT","CSAT"]
];
function openMenu(){
  clearTimeout(hideT); menuOpen=true;
  var links=MENU.filter(function(m){ return m[0].charAt(0)!=="#"||document.querySelector(m[0]); }).map(function(m){
    return '<a href="'+m[0]+'"><span aria-hidden="true">'+m[1]+'</span>'+L(m[2],m[3])+'</a>'; }).join("");
  bub.innerHTML='<button type="button" class="gb-x" aria-label="'+L("बंद करें","Close")+'">✕</button><span class="gb-name">'+L("जेनू 🤖","GENU 🤖")+'</span>'+
    '<span class="gb-txt">'+L("कहाँ चलें? बस टैप करो, मैं ले चलूँगा! 🚀","Where to? Just tap, I'll take you! 🚀")+'</span>'+
    '<div class="gb-grid">'+links+'</div><button type="button" class="gb-hide">'+L("अभी जेनू को छुपाएँ","Hide Genu for now")+'</button>';
  aimBubble(); bub.classList.add("show");
  setCls("happy",1); pulse("jump",700);
  bub.querySelector(".gb-x").onclick=shut;
  bub.querySelector(".gb-hide").onclick=bye;
  [].forEach.call(bub.querySelectorAll(".gb-grid a"),function(a){ a.onclick=function(e){ travel(e,a.getAttribute("href")); }; });
  hideT=setTimeout(shut,14000);
}
function travel(e,href){
  shut();
  if(href.charAt(0)==="#"){
    var t=document.querySelector(href); if(!t) return;
    e.preventDefault();
    setCls("fly",1); setTimeout(function(){ setCls("fly",0); },1400);
    t.scrollIntoView({behavior:REDUCED?"auto":"smooth",block:"start"});
  }else{
    setCls("fly",1);
  }
}
function bye(){
  shut(); try{ sessionStorage.setItem("genu_hide","1"); }catch(e){}
  hidden=true; setCls("wave",1);
  say(L("ठीक है, बाय-बाय! 👋 फिर मिलेंगे।","Okay, bye-bye! 👋 See you soon."),{ms:1800});
  setTimeout(function(){ shut(); walkTo(-140).then(function(){ bot.remove(); bub.remove(); }); },1900);
}
btn.addEventListener("click",function(){ if(hidden) return; if(menuOpen) shut(); else openMenu(); });
document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&bub.classList.contains("show")) shut(); });

/* ───────── आँखें माउस का पीछा करें ───────── */
if(FINE&&!REDUCED){
  var er=0;
  addEventListener("mousemove",function(e){
    if(er) return;
    er=requestAnimationFrame(function(){
      er=0;
      var r=bot.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height*.33;
      var dx=e.clientX-cx, dy=e.clientY-cy, d=Math.hypot(dx,dy)||1, k=Math.min(1,d/260);
      var ex=dx/d*4*k*facing, ey=dy/d*3*k;
      eyes.style.transform="translate("+ex.toFixed(2)+"px,"+ey.toFixed(2)+"px)";
    });
  },{passive:true});
}

/* ───────── हिस्से पहचानकर बताना ───────── */
var SPOTS=[
  ["daily-ca","📰 आज का करंट यहाँ है — रोज़ नया अपडेट, रोज़ नई बढ़त!","📰 Today's current affairs are right here — fresh every day!",null],
  ["pyq-showcase","📜 वाह! यहाँ 2160+ PYQ हैं — पूरा पेपर कवर!","📜 Wow! 2160+ PYQs here — full paper coverage!",["/uppcs-prelims-pyq/","PYQ खोलो →","Open PYQs →"]],
  ["whats-on","🗺️ यहाँ सब कुछ है — सिलेबस से डेली क्विज़ तक। कोई भी टाइल दबाओ!","🗺️ Everything's here — syllabus to daily quiz. Tap any tile!",null],
  ["downloads","📄 मुफ़्त PDF! एक टैप में डाउनलोड, हिंदी और English दोनों।","📄 Free PDFs! One-tap download, Hindi and English.",["/downloads/","सभी PDF →","All PDFs →"]],
  ["special-notes","✍️ विशेष नोट्स — अपनी ज़रूरत बताओ, नोट्स तैयार!","✍️ Special notes — tell us what you need!",null],
  ["tests","🎯 यहाँ हैं टेस्ट! एक आज़माओ — टाइमर भी, व्याख्या भी।","🎯 Tests are here! Try one — timer and explanations included.",null],
  ["join","💬 Telegram पर जुड़ो — हर अपडेट सबसे पहले!","💬 Join on Telegram — get every update first!",null],
  ["subjects","📚 विषय चुनो और पढ़ाई शुरू करो!","📚 Pick a subject and start studying!",null]
];
var said={};
function current(){
  var y=innerHeight*.45;
  for(var i=0;i<SPOTS.length;i++){
    var el=document.getElementById(SPOTS[i][0]); if(!el) continue;
    var r=el.getBoundingClientRect();
    if(r.top<=y&&r.bottom>=y) return SPOTS[i];
  }
  return null;
}
function sectionHit(){ if(!hidden) setTimeout(drain,700); }
function drain(){
  if(busy||menuOpen||hidden) return;
  var s=current();
  if(!s||said[s[0]]) return;
  if(Date.now()-lastSay<4500){ setTimeout(drain,1200); return; }
  said[s[0]]=1; busy=true;
  var el=document.getElementById(s[0]), r=el.getBoundingClientRect();
  var tx=Math.max(minX(),Math.min(maxX(),r.left+r.width*.12));
  (Math.abs(tx-x)>40?walkTo(tx):Promise.resolve()).then(function(){
    face(1); setCls("point",1); pulse("jump",700);
    say(L(s[1],s[2]),s[3]?{href:s[3][0],go:L(s[3][1],s[3][2]),ms:7000}:{ms:5500});
    return sleep(2600);
  }).then(function(){ setCls("point",0); busy=false; setTimeout(drain,600); });
}
if("IntersectionObserver" in window){
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting) sectionHit(e.target.id); });
  },{rootMargin:"-30% 0px -35% 0px"});
  SPOTS.forEach(function(s){ var el=document.getElementById(s[0]); if(el) io.observe(el); });
}

/* ───────── अपने-आप टहलना ───────── */
var IDLE=[
  ["मुझ पर टैप करो, मैं साइट घुमा दूँगा! 🚀","Tap me and I'll show you around! 🚀"],
  ["आज एक टेस्ट तो बनता है! 🎯","One test today? You got this! 🎯"],
  ["थोड़ा-थोड़ा रोज़ — यही है असली जादू ✨","A little every day — that's the real magic ✨"],
  ["PYQ से शुरुआत करो, पैटर्न ख़ुद समझ आएगा 📜","Start with PYQs — the pattern reveals itself 📜"]
];
var idleI=0;
async function wander(){
  while(!hidden){
    await sleep(rnd(5500,9500));
    if(hidden) return;
    if(busy||menuOpen||document.hidden) continue;
    busy=true;
    var roll=Math.random();
    if(roll<.55){ await walkTo(rnd(minX(),maxX())); }
    else if(roll<.72){ await pulse("jump",700); }
    else if(roll<.85){ setCls("happy",1); setCls("wave",1); await sleep(1300); setCls("wave",0); setCls("happy",0); }
    else if(Date.now()-lastSay>15000){ var m=IDLE[idleI++%IDLE.length]; say(L(m[0],m[1]),{ms:4500}); await sleep(1200); }
    busy=false; drain();
  }
}

addEventListener("resize",function(){ x=Math.max(minX(),Math.min(maxX(),x)); place(); });
new MutationObserver(function(){ if(bub.classList.contains("show")&&!menuOpen) shut(); else if(menuOpen) openMenu(); })
  .observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});

/* ───────── प्रवेश ───────── */
place();
setTimeout(async function(){
  busy=true;
  setCls("enter",1);
  await walkTo(innerWidth<600?14:Math.min(120,maxX()));
  setCls("enter",0);
  setCls("happy",1); setCls("wave",1);
  say(L("नमस्ते! मैं जेनू हूँ 🤖 मुझ पर टैप करो, मैं बताऊँगा कहाँ क्या है!","Hi! I'm Genu 🤖 Tap me and I'll show you what's where!"),{ms:5500});
  await sleep(2200);
  setCls("wave",0); setCls("happy",0);
  busy=false;
  drain();
  if(!REDUCED) wander();
},1600);
})();
