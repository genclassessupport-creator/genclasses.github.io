/* GenClasses — ज्ञान-कक्षा (हीरो) व लाइव झलक (showreel) */
(function(){
"use strict";
var REDUCED=false;
try{REDUCED=window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){}
function isEn(){return (document.documentElement.getAttribute("lang")||"hi")==="en";}
function L(hi,en){return isEn()?en:hi;}
function onVisible(el,cb){
  if(!("IntersectionObserver" in window)){cb(true);return;}
  new IntersectionObserver(function(es){cb(es[0].isIntersecting);},{threshold:.15}).observe(el);
}

/* ═════════ 1) ज्ञान-कक्षा ═════════ */
(function(){
  var orbit=document.getElementById("orbit");
  if(!orbit) return;
  var chips=[].slice.call(orbit.querySelectorAll(".orb-chip"));
  var cap=document.getElementById("orbitCap");
  var svg=orbit.querySelector(".orbit-path");
  var ells=[].slice.call(svg.querySelectorAll("ellipse"));
  var n=chips.length, W=0,H=0,rx=0,ry=0,cx=0,cy=0;
  var TILT=-9*Math.PI/180, cosT=Math.cos(TILT), sinT=Math.sin(TILT);
  var base=Math.PI/2, speed=0, target=REDUCED?0:(2*Math.PI/46000);
  var active=-1, forced=-1, inView=true, hovering=false, last=0, raf=0;

  function measure(){
    W=orbit.clientWidth;H=orbit.clientHeight;cx=W/2;cy=H/2;
    var maxHalf=0;chips.forEach(function(c){maxHalf=Math.max(maxHalf,c.offsetWidth/2);});
    rx=Math.max(90,Math.min(W/2-maxHalf*.82,215));
    ry=rx*(W<500?.34:.4);
    svg.setAttribute("viewBox","0 0 "+W+" "+H);
    ells.forEach(function(e){
      e.setAttribute("cx",cx);e.setAttribute("cy",cy);e.setAttribute("rx",rx);e.setAttribute("ry",ry);
      e.setAttribute("transform","rotate("+(TILT*180/Math.PI)+" "+cx+" "+cy+")");
    });
  }
  function say(i){
    if(!cap||i<0) return;
    var c=chips[i];
    cap.innerHTML='<span class="oc-say">'+(c.querySelector(".oc-ico").textContent)+' '+
      c.getAttribute(isEn()?"data-say-en":"data-say-hi")+' <i aria-hidden="true">→</i></span>';
  }
  function place(){
    var best=-2,bi=0;
    for(var i=0;i<n;i++){
      var t=base+i*2*Math.PI/n, ex=rx*Math.cos(t), ey=ry*Math.sin(t);
      var x=ex*cosT-ey*sinT, y=ex*sinT+ey*cosT, d=Math.sin(t), k=(d+1)/2;
      var c=chips[i];
      c.style.transform="translate(-50%,-50%) translate3d("+x.toFixed(1)+"px,"+y.toFixed(1)+"px,0) scale("+(.72+.28*k).toFixed(3)+")";
      c.style.opacity=(.42+.58*k).toFixed(2);
      c.style.zIndex=d>0?3:1;
      if(d>best){best=d;bi=i;}
    }
    var a=forced>=0?forced:bi;
    if(a!==active){
      if(active>=0) chips[active].classList.remove("on");
      active=a;chips[a].classList.add("on");say(a);
    }
  }
  function frame(ts){
    raf=0;
    var dt=last?Math.min(ts-last,64):16;last=ts;
    var goal=hovering?0:target;
    speed+=(goal-speed)*Math.min(1,dt/260);
    base+=speed*dt;
    place();
    if(inView&&!document.hidden&&(speed>1e-7||goal>0)) raf=requestAnimationFrame(frame);
    else last=0;
  }
  function kick(){if(!raf&&!REDUCED&&inView&&!document.hidden){last=0;raf=requestAnimationFrame(frame);}}

  orbit.addEventListener("mouseenter",function(){hovering=true;});
  orbit.addEventListener("mouseleave",function(){hovering=false;forced=-1;kick();});
  chips.forEach(function(c,i){
    function f(){forced=i;place();}
    c.addEventListener("mouseenter",f);c.addEventListener("focus",f);
    c.addEventListener("blur",function(){forced=-1;place();});
  });
  orbit.addEventListener("touchstart",function(){hovering=true;setTimeout(function(){hovering=false;kick();},2600);},{passive:true});
  onVisible(orbit,function(v){inView=v;kick();});
  document.addEventListener("visibilitychange",kick);
  window.addEventListener("resize",function(){measure();place();});
  new MutationObserver(function(){if(active>=0)say(active);}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(function(){measure();place();});
  measure();place();kick();
})();

/* ═════════ 2) लाइव झलक ═════════ */
(function(){
  var wrap=document.getElementById("srWrap");
  if(!wrap) return;
  var screen=document.getElementById("srScreen");
  var scenes=[].slice.call(screen.querySelectorAll(".sr-scene"));
  var steps=[].slice.call(wrap.querySelectorAll(".sr-step"));
  var cursor=document.getElementById("srCursor");
  var b1=document.getElementById("srB1"), b2=document.getElementById("srB2");
  var ctas=[document.getElementById("srCta"),document.getElementById("srCtaM")];
  var DUR=[7000,6800,6800,6400];
  var STATES="ans exp fan pick dl done flip stamp swipe quiz tapq";
  var FINAL=["ans exp","fan pick dl done","flip","quiz"];
  var CTA=[
    ["#tests","टेस्ट शुरू करें →","Start a test →"],
    ["/downloads/","सभी मुफ़्त PDF →","All free PDFs →"],
    ["/flashcards/","फ्लैशकार्ड खोलें →","Open flashcards →"],
    ["/daily/","आज का क्विज़ →","Today's quiz →"]
  ];
  var BADGE=[
    [["तुरंत परिणाम","Instant result"],["हर प्रश्न की व्याख्या","Explanation for every Q"]],
    [["16 मुफ़्त PDF","16 free PDFs"],["हिंदी + English","Hindi + English"]],
    [["एक टैप में उत्तर","Answer in one tap"],["प्रगति सहेजी जाती है","Progress is saved"]],
    [["रोज़ नया अपडेट","Fresh every day"],["हर दिन 5 प्रश्न","5 Qs every day"]]
  ];
  var BICO=[["✅","⚡"],["📄","🌐"],["🔄","💾"],["📰","🎯"]];
  var cur=-1, timers=[], tick=0, inView=false, started=false;

  /* तारीख़ व घड़ी */
  (function(){
    var d=new Date(), hm=("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2);
    var MH=["जन","फ़र","मार्च","अप्रै","मई","जून","जुला","अग","सितं","अक्टू","नवं","दिसं"];
    var ME=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    var c=document.getElementById("srClock");if(c)c.textContent=hm;
    var dd=document.getElementById("srDay");if(dd)dd.textContent=d.getDate();
    var mm=document.getElementById("srMon");
    function mon(){if(mm)mm.textContent=isEn()?ME[d.getMonth()]:MH[d.getMonth()];}
    mon();
    new MutationObserver(mon).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  })();

  function later(ms,fn){timers.push(setTimeout(fn,ms));}
  function clear(){timers.forEach(clearTimeout);timers=[];clearInterval(tick);tick=0;}
  function pos(el){
    var x=0,y=0,e=el;
    while(e&&e!==screen){x+=e.offsetLeft;y+=e.offsetTop;e=e.offsetParent;}
    return {x:x,y:y,w:el.offsetWidth,h:el.offsetHeight};
  }
  function moveTo(el,fx,fy){
    var p=pos(el);
    var x=p.x+p.w*(fx==null?.5:fx)-12, y=p.y+p.h*(fy==null?.5:fy)-4;
    cursor.style.transform="translate("+x+"px,"+y+"px)";
  }
  function rest(){cursor.style.transform="translate("+(screen.clientWidth-60)+"px,"+(screen.clientHeight-40)+"px)";}
  function tap(){cursor.classList.remove("press");void cursor.offsetWidth;cursor.classList.add("press");later(380,function(){cursor.classList.remove("press");});}
  function badge(b,i,k){
    var t=BADGE[i][k];
    b.querySelector(".bt").textContent=L(t[0],t[1]);
    b.querySelector(".bi").textContent=BICO[i][k];
    b.classList.add("show");
  }
  function sc(i){return scenes[i];}
  function add(i,c){sc(i).classList.add(c);}
  function reset(i){STATES.split(" ").forEach(function(c){sc(i).classList.remove(c);});
    if(i===2){var n=sc(2).querySelector(".f-n");if(n)n.textContent="23";}
  }

  var PLAY=[
    function(){ /* टेस्ट */
      var s=sc(0), tt=s.querySelector(".tt"), left=6500;
      tick=setInterval(function(){left--;var h=Math.floor(left/3600),m=Math.floor(left%3600/60),z=left%60;
        tt.textContent="0"+h+":"+("0"+m).slice(-2)+":"+("0"+z).slice(-2);},1000);
      later(700,function(){moveTo(s.querySelector(".t-opt.ok"),.62,.55);});
      later(1750,function(){tap();add(0,"ans");badge(b1,0,0);});
      later(2900,function(){add(0,"exp");badge(b2,0,1);});
      later(3500,rest);
    },
    function(){ /* PDF */
      var s=sc(1);
      later(250,function(){add(1,"fan");badge(b1,1,0);});
      later(1300,function(){moveTo(s.querySelectorAll(".p-cv")[1],.55,.6);});
      later(2250,function(){tap();add(1,"pick");});
      later(2900,function(){moveTo(s.querySelector(".p-ring"));});
      later(3800,function(){tap();add(1,"dl");});
      later(5450,function(){add(1,"done");s.querySelector(".p-ico").textContent="✅";badge(b2,1,1);rest();});
    },
    function(){ /* फ्लैशकार्ड */
      var s=sc(2);
      later(700,function(){moveTo(s.querySelector(".f-zone"),.6,.55);});
      later(1650,function(){tap();add(2,"flip");badge(b1,2,0);});
      later(3400,function(){add(2,"stamp");});
      later(3900,function(){moveTo(s.querySelector(".f-zone"),.12,.55);add(2,"swipe");});
      later(4500,function(){s.querySelector(".f-n").textContent="24";badge(b2,2,1);});
      later(5000,rest);
    },
    function(){ /* डेली */
      var s=sc(3);
      later(300,function(){badge(b1,3,0);});
      later(1900,function(){add(3,"quiz");});
      later(2700,function(){moveTo(s.querySelector(".d-quiz"),.5,.5);});
      later(3600,function(){tap();add(3,"tapq");badge(b2,3,1);});
      later(4300,rest);
    }
  ];

  function setCta(i){
    ctas.forEach(function(a){
      if(!a) return;
      a.setAttribute("href",CTA[i][0]);
      a.innerHTML='<span class="sr-cta-t"><span data-hi>'+CTA[i][1]+'</span><span data-en>'+CTA[i][2]+'</span></span>';
    });
  }
  function show(i,auto){
    clear();
    var prev=cur;cur=i;
    scenes.forEach(function(s,k){
      if(k===i){s.classList.remove("out");s.classList.add("on");}
      else if(s.classList.contains("on")){s.classList.remove("on");s.classList.add("out");
        (function(kk){later(650,function(){scenes[kk].classList.remove("out");reset(kk);});})(k);}
    });
    if(prev!==i) reset(i);
    else{sc(i).classList.remove("on");void sc(i).offsetWidth;reset(i);sc(i).classList.add("on");}
    steps.forEach(function(b,k){
      b.classList.remove("on");b.setAttribute("aria-current",k===i?"step":"false");
    });
    void steps[i].offsetWidth;
    steps[i].style.setProperty("--dur",DUR[i]+"ms");
    steps[i].classList.add("on");
    b1.classList.remove("show");b2.classList.remove("show");
    setCta(i);
    if(REDUCED){
      FINAL[i].split(" ").forEach(function(c){add(i,c);});
      if(i===1) sc(1).querySelector(".p-ico").textContent="✅";
      badge(b1,i,0);badge(b2,i,1);
      return;
    }
    rest();
    PLAY[i]();
    later(DUR[i],function(){if(inView&&!document.hidden) show((i+1)%scenes.length,true);});
  }
  steps.forEach(function(b,i){b.addEventListener("click",function(){show(i,false);});});
  onVisible(wrap,function(v){
    inView=v;
    wrap.classList.toggle("paused",!v);
    if(v){ if(!started){started=true;show(0,true);} else if(!REDUCED&&!timers.length) show(cur,true); }
    else if(!REDUCED){clear();}
  });
  document.addEventListener("visibilitychange",function(){
    if(REDUCED) return;
    if(document.hidden){clear();wrap.classList.add("paused");}
    else if(inView&&started){wrap.classList.remove("paused");show(cur,true);}
  });
})();
})();
