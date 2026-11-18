// Coordinates run from -1 to 1 across an oblique terrain model.
const topics = [
 ['monsoon','पर्वतीय वर्षा','Mountain rainfall','नम हवा ढाल पर चढ़कर ठंडी होती है। पवनमुखी ढाल पर वर्षा होती है और पीछे की ढाल वर्षाछाया में रहती है।','Moist air cools as it climbs. Rain falls on the windward slope, leaving a rain shadow beyond the ridge.','वर्षा','Rainfall','वर्षाछाया','Rain shadow'],
 ['river','नदी का विसर्प','River meander','मोड़ के बाहरी किनारे पर तेज धारा कटाव करती है। भीतरी किनारे पर धीमा पानी रेत जमा करता है।','Faster flow erodes the outer bank of a bend. Slower water deposits sand on the inner bank.','बाहरी किनारा','Outer bank','भीतरी किनारा','Inner bank'],
 ['volcano','ज्वालामुखी','Volcano','सतह पर पहुँचा मैग्मा लावा कहलाता है। ढाल पर बहता लावा ठंडा होकर ठोस चट्टान बनता है।','Magma becomes lava when it reaches the surface. Lava travels downslope and cools into solid rock.','मुख','Crater','लावा प्रवाह','Lava flow'],
 ['delta','नदी का डेल्टा','River delta','मुहाने पर धारा धीमी होने से तलछट जमती है। नदी कई वितरिकाओं में बँटकर समुद्र तक पहुँचती है।','Flow slows at the river mouth and sediment settles. Distributaries carry water across the delta into the sea.','वितरिका','Distributary','समुद्र','Sea'],
 ['glacier','हिमनद','Valley glacier','ऊँचाई पर जमा बर्फ दबकर हिमनद बनाती है। गुरुत्व से बर्फ घाटी में धीरे खिसकती है और चट्टान घिसती है।','Snow compacts into ice high in the valley. Gravity draws the glacier downhill, scraping the valley floor.','हिम संचय','Snow accumulation','हिमनद का सिरा','Glacier terminus'],
 ['dunes','बालू के टीले','Sand dunes','हवा रेत को टीले की हल्की ढाल पर ऊपर ले जाती है। शिखर पार करते ही रेत तीखी ढाल पर फिसलती है।','Wind pushes grains up the gentle windward slope. Beyond the crest, sand slips down the steeper face.','पवनमुखी ढाल','Windward slope','शिखर','Crest'],
 ['coast','तटीय अपरदन','Coastal erosion','लहरें चट्टानी तट के आधार पर बार-बार चोट करती हैं। नीचे से कटने पर ऊपरी चट्टान गिर सकती है और तट पीछे हटता है।','Waves repeatedly strike the foot of the cliff. Undercutting can cause the overhang to collapse and the cliff to retreat.','समुद्री भृगु','Sea cliff','लहरें','Waves'],
 ['ridge','महासागरीय कटक','Ocean ridge','जहाँ समुद्री प्लेटें अलग होती हैं, वहाँ मैग्मा ऊपर उठता है। ठंडा होने पर नई महासागरीय पर्पटी बनती है।','Where ocean plates diverge, magma rises at the ridge. Cooling magma forms new oceanic crust.','कटक अक्ष','Ridge axis','महासागरीय पर्पटी','Oceanic crust']
];
const $=s=>document.querySelector(s), canvas=$('canvas'), ctx=canvas.getContext('2d'), terrain=document.createElement('canvas');
const g=terrain.getContext('2d'), sin=Math.sin, cos=Math.cos, abs=Math.abs, exp=Math.exp;
let n=0, hi=true, time=0, auto=true, running=!matchMedia('(prefers-reduced-motion: reduce)').matches;
try{hi=localStorage.getItem('gen_lang')!=='en'}catch{}
const channel=y=>.43*sin(4*y), ridge=y=>.12*sin(y*4);
function sample(x,y){
 const r=Math.hypot(x,y), d=abs(x-channel(y)), a=x-ridge(y);
 switch(n){
 case 0:return [.06+.88*exp(-6*a*a)*(.85+.15*cos(y*4)),a<0?'#548878':'#b99a6f'];
 case 1:return [d<.11?.07:.13+.05*d,d<.11?'#3a9dac':d<.18?'#c8b887':'#77975c'];
 case 2:return [.08+Math.max(0,1-r)*1.05-.28*exp(-110*r*r),r<.14|| (y>0&&abs(x-.075*sin(8*y))<.05*(1.2-y))?'#ec723a':'#8e6654'];
 case 3:{const w=Math.max(0,y+.5),branch=Math.min(abs(x),abs(abs(x)-w*.45),abs(abs(x)-w*.78));const sea=y>.62+.14*cos(x*5);return [sea?.055:.1,sea||branch<.045?'#3d9da8':abs(x)<.8*w?'#bcc382':'#689373']}
 case 4:return [.13+.47*(1-y)/2+.50*Math.min(1,abs(x)**1.5*2),abs(x)<(.30-.09*y)&&y<.78?'#c6e6ec':'#7c8a88'];
 case 5:{const phase=((x*1.5+.23*sin(y*3)+3)%1);return [.08+.33*(phase<.75?phase/.75:(1-phase)/.25),'#d8ad73']}
 case 6:return [x<-.12+.08*sin(y*4)?.55+.06*cos(y*5):.08,x<-.12+.08*sin(y*4)?'#ae9b78':'#4babb0'];
 default:return [.10+.54*exp(-3*abs(a))-.16*exp(-60*a*a),abs(a)<.055?'#d88655':'#688790'];
 }}
function point(x,y,h=sample(x,y)[0]){return [450+x*260+y*125,300+y*103-x*56-h*169]}
function polygon(points,color){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=color;g.fill();g.strokeStyle=color;g.lineWidth=.7;g.stroke()}
function build(){
 terrain.width=900;terrain.height=530;
 const sky=g.createLinearGradient(0,0,0,530);sky.addColorStop(0,'#122e37');sky.addColorStop(1,'#42605d');g.fillStyle=sky;g.fillRect(0,0,900,530);
 const step=2/64;
 for(let j=0;j<64;j++)for(let i=63;i>=0;i--){
 const x=-1+i*step,y=-1+j*step, [z,c]=sample(x,y), zx=sample(x+step,y)[0], zy=sample(x,y+step)[0];
 const A=point(x,y,z),B=point(x+step,y,zx),C=point(x+step,y+step),D=point(x,y+step,zy);
 const grain=sin(i*73+j*41)*.035, light=Math.max(.52,Math.min(1.24,.96+8*(zx-z)-4*(zy-z)+grain));
 const rgb=[1,3,5].map(k=>Math.min(255,Math.round(parseInt(c.slice(k,k+2),16)*light)));
 polygon([A,B,C,D],'rgb('+rgb.join(',')+')');
 if(i===0||j===63){const [u,v]=j===63?[D,C]:[A,D];polygon([u,v,[v[0],v[1]+19],[u[0],u[1]+19]],j===63?'#786b58':'#504f48')}
 }}
const anchors=[[[-.43,-.2],[.63,.18]],[[.54,.39],[.32,.39]],[[0,0],[.07,.67]],[[.39,.38],[.64,.9]],[[0,-.77],[0,.74]],[[-.39,0],[.5,0]],[[-.14,.15],[.61,.55]],[[0,0],[.68,.42]]];
function draw(){
 ctx.setTransform(canvas.width/900,0,0,canvas.height/530,0,0);ctx.drawImage(terrain,0,0);
 if(n===0){
   for(let i=0;i<28;i++){
     const x=-.62+.16*sin(i*7),y=.56*cos(i*9);
     const [cx,cy]=point(x,y,.94+.12*sin(i*3));
     const mist=ctx.createRadialGradient(cx,cy,1,cx,cy,36);
     mist.addColorStop(0,'rgba(226,236,229,.58)');mist.addColorStop(1,'rgba(225,235,229,0)');
     ctx.fillStyle=mist;ctx.fillRect(cx-36,cy-36,72,72);
   }
 }
 for(let i=0;i<52;i++){const t=(time*.16+i*.173)%1, lane=sin(i*71), y=-.9+t*1.8;let x,Y,h,color='#e0f8fb';
 switch(n){
 case 0:x=-.78+(i%7)*.085;Y=lane*.65;h=sample(x,Y)[0]+.55*(1-t);break;
 case 1:x=channel(y)+lane*.05;Y=y;break;
 case 2:Y=.12+t*.78;x=.075*sin(8*Y)+lane*.018;color='#ffcc69';break;
 case 3:Y=y;x=(i%3-1)*Math.max(0,y+.5)*.45;break;
 case 4:Y=-.87+t*1.60;x=lane*.18;break;
 case 5:x=-1+t*2;Y=lane*.85;color='#ffdfa0';break;
 case 6:Y=lane*.9;x=1-t*(1.12-.08*sin(Y*4));break;
 default:x=(i%2?1:-1)*(.03+t*.88)+ridge(lane*.8);Y=lane*.8;
 }
 const [px,py]=point(x,Y,h);ctx.fillStyle=color;ctx.globalAlpha=.76;ctx.beginPath();ctx.ellipse(px,py,n===0?1.3:3,n===0?5:1.7,0,0,Math.PI*2);ctx.fill()}
 ctx.globalAlpha=1;anchors[n].forEach(([x,y],i)=>{const [px,py]=point(x,y),tx=i?668:190,ty=i?355:100;const label=topics[n][(hi?5:6)+2*i];ctx.font='600 25px "Nirmala UI",sans-serif';const w=ctx.measureText(label).width+24;ctx.strokeStyle='#fff0ce';ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(tx,ty);ctx.stroke();ctx.fillStyle='#fff0ce';ctx.fillRect(px-3,py-3,6,6);ctx.fillStyle='#132e35';ctx.fillRect(tx-w/2,ty-21,w,39);ctx.textAlign='center';ctx.fillStyle='#fff5d8';ctx.fillText(label,tx,ty+7)});
}
function select(i){n=i;time=0;build();render()}
function render(){const row=topics[n];document.documentElement.lang=hi?'hi':'en';$('h1').textContent=row[hi?1:2];$('#lesson').textContent=row[hi?3:4];$('#category').textContent=(hi?'भूगोल':'GEOGRAPHY')+' / '+String(n+1).padStart(2,'0');$('#choose').textContent=hi?'दूसरा दृश्य देखें':'Explore the scenes';$('#lang').textContent=hi?'English':'हिन्दी';$('#play').textContent=running?(hi?'रोकें Ⅱ':'Pause Ⅱ'):(hi?'चलाएँ ▷':'Play ▷');topics.forEach((r,i)=>{let b=$('#topics').children[i];if(!b){b=document.createElement('button');$('#topics').append(b);b.onclick=()=>{auto=false;select(i)}}b.textContent=r[hi?1:2];b.setAttribute('aria-pressed',n===i)});draw()}
$('#play').onclick=()=>{running=!running;render()};$('#lang').onclick=()=>{hi=!hi;try{localStorage.setItem('gen_lang',hi?'hi':'en')}catch{}render()};
canvas.width=900;canvas.height=530;select(0);
let last=0,visible=true;new IntersectionObserver(([entry])=>visible=entry.isIntersecting).observe(canvas);
function frame(now){if(running&&visible&&!document.hidden&&now-last>=32){time+=Math.min((now-last)/1000,.08);last=now;if(auto&&time>=16)select((n+1)%topics.length);else draw()}requestAnimationFrame(frame)}requestAnimationFrame(frame);
if(window.parent!==window){
  new ResizeObserver(()=>parent.postMessage({atlasHeight:document.body.getBoundingClientRect().height},location.origin)).observe(document.body);
  window.addEventListener('message',event=>{
    if(event.origin===location.origin&&event.source===parent&&['hi','en'].includes(event.data?.atlasLang)){
      hi=event.data.atlasLang==='hi';render();
    }
  });
}
