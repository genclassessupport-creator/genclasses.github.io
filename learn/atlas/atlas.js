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
// Each animated path represents the direction of motion or transfer in the model.
const experiments=[
 ['wave','अनुप्रस्थ तरंग','Transverse wave','तरंग दाईं तरफ जाती है। पीला कण अपनी जगह पर ऊपर-नीचे होता है।','The wave travels right while the gold particle oscillates vertically.'],
 ['pendulum','सरल लोलक','Simple pendulum','गोला बीच से सबसे तेज गुजरता है और दोनों सिरों पर क्षण भर के लिए रुकता है।','The bob moves fastest through the centre and briefly stops at either end.'],
 ['lens','उत्तल लेंस','Convex lens','मुख्य अक्ष के समानांतर आने वाली किरणें पतले उत्तल लेंस से गुजरकर फोकस पर मिलती हैं।','Parallel rays passing through a thin converging lens meet at its focal point.'],
 ['projectile','प्रक्षेप्य गति','Projectile motion','वायु प्रतिरोध नगण्य हो तो क्षैतिज वेग स्थिर रहता है। गुरुत्व नीचे की ओर त्वरण देता है और पथ परवलय बनता है।','With negligible air resistance, horizontal velocity stays constant. Downward acceleration bends the path into a parabola.'],
 ['diffusion','विसरण','Diffusion','कण अनियमित गति करते हैं। बहुत से कणों की संयुक्त गति से वे पूरे पात्र में फैलते हैं।','Particles move randomly. The combined effect of many such movements spreads them throughout the container.'],
 ['food','खाद्य श्रृंखला','Food chain','तीर ऊर्जा के प्रवाह को दिखाते हैं। घास से ऊर्जा खरगोश और फिर लोमड़ी तक पहुँचती है।','Arrows show energy transfer from grass to a rabbit and then to a fox.'],
 ['market','बाज़ार संतुलन','Market equilibrium','भाव बढ़ने पर सामान्यतः माँग घटती है और आपूर्ति बढ़ती है। प्रतिच्छेद पर माँगी और बेची जाने वाली मात्रा बराबर है।','Demand usually falls and supply rises as price rises. At the intersection, quantities demanded and supplied are equal.'],
 ['interest','चक्रवृद्धि ब्याज','Compound interest','समान शुरुआती रकम और धनात्मक स्थिर दर पर चक्रवृद्धि में पहले का ब्याज भी आगे ब्याज कमाता है।','With equal principal and a fixed positive rate, accumulated interest also earns interest under compounding.'],
 ['fraction','इकाई वृत्त','Unit circle','इकाई त्रिज्या वाले वृत्त पर बिंदु की ऊँचाई कोण की ज्या और क्षैतिज निर्देशांक उसकी कोज्या है।','On a circle of radius one, the vertical coordinate is the sine of the angle and the horizontal coordinate is its cosine.'],
 ['echo','ध्वनि की प्रतिध्वनि','Sound echo','ध्वनि दीवार तक जाकर लौटती है। प्रतिध्वनि का समय आने और जाने दोनों की दूरी पर निर्भर है।','Sound travels to the wall and back. Echo delay depends on the total round-trip distance.']
];
topics.push(...experiments);
function diagram(){
 const c=ctx,t=time, gold='#ffd584', aqua='#7ae1d2', pale='#e3ede3';
 c.setTransform(canvas.width/900,0,0,canvas.height/530,0,0);atmosphere(c,false);
 function line(path,color=aqua,width=4){c.beginPath();path.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke()}
 function dot(x,y,r,color=gold){c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fillStyle=color;c.fill()}
 function label(x,y,h,e,color=pale){c.fillStyle=color;c.font='600 25px "Nirmala UI",sans-serif';c.textAlign='center';c.fillText(hi?h:e,x,y)}
 function curve(fn,color){line(Array.from({length:101},(_,i)=>fn(i/100)),color)}
 for(let x=50;x<900;x+=50)line([[x,80],[x,470]],'#20404a',1);
 for(let y=100;y<480;y+=50)line([[45,y],[850,y]],'#20404a',1);
 const phase=(t*.24)%1;let x,y;
 const id=topics[n][0];
 if(id==='food')fieldFood(c);
 if(id==='pendulum'||id==='projectile'||id==='lens'){
   const shadow=c.createLinearGradient(0,350,0,490);shadow.addColorStop(0,'#293f43');shadow.addColorStop(1,'#12272b');
   c.fillStyle=shadow;c.fillRect(0,405,900,125);
 }
 if(id==='diffusion')glass(c,90,135,720,250);
 if(id==='echo'){
   for(let j=0;j<8;j++)for(let k=0;k<3;k++){c.fillStyle=(j+k)%2?'#836b5d':'#937c69';c.fillRect(747+k*24,115+j*35,22,32)}
   glass(c,102,199,45,102);
 }
 switch(topics[n][0]){
 case 'wave':{const f=x=>276+76*sin(x/72-t*2.3);line([[80,276],[820,276]],'#678183',2);curve(u=>[80+740*u,f(80+740*u)],aqua);for(let sx=84;sx<820;sx+=18)shadedBall(c,sx,f(sx),4,aqua);shadedBall(c,450,f(450),12,gold);label(660,125,'तरंग की दिशा →','Wave direction →');break}
 case 'pendulum':{const a=.65*cos(t*1.6);x=450+250*sin(a);y=115+250*cos(a);curve(u=>[450+250*sin(1.3*u-.65),115+250*cos(1.3*u-.65)],'#557479');line([[340,100],[560,100]],pale,9);line([[450,109],[x,y]],aqua);oval(c,450+(x-450)*.8,407,25,5,"#172a2d");shadedBall(c,x,y,25,gold);shadedBall(c,450,106,8,pale);label(450,440,'संतुलन स्थिति','Equilibrium position');break}
 case 'lens':{line([[80,270],[830,270]],'#678183',2);c.beginPath();c.ellipse(430,270,26,115,0,0,Math.PI*2);const glassLight=c.createLinearGradient(404,0,456,0);glassLight.addColorStop(0,'#c4eded');glassLight.addColorStop(.4,'#417889');glassLight.addColorStop(1,'#9bdae1');c.fillStyle=glassLight;c.fill();line([[430,386],[430,405],[392,405],[467,405]],pale,4);for(const y of [190,230,310,350]){const path=[[90,y],[430,y],[650,270],[810,270+(270-y)*160/220]];line(path,gold,2);x=90+720*phase;dot(x,x<430?y:y+(270-y)*(x-430)/220,5)}label(650,335,'फोकस','Focus');break}
 case 'projectile':{const f=u=>[110+670*u,405-1050*u*(1-u)];line([[80,408],[820,408]],pale);curve(f,aqua);const [bx,by]=f(phase);oval(c,bx,411,12+phase*2,3,"#172b30");shadedBall(c,bx,by,14,gold);break}
 case 'diffusion':{c.strokeStyle=aqua;c.lineWidth=3;c.strokeRect(90,135,720,250);const spread=Math.min(1,t/8);for(let i=0;i<210;i++){const u=(i*.6180339)%1,v=(i*.4142135)%1;dot(102+(u*(.24+.76*spread))*686+7*sin(t*3+i),150+215*v+7*cos(t*2+i),4,i%3?gold:aqua)}break}
 case 'food':{for(let i=0;i<2;i++){const a=190+i*260;line([[a+45,250],[a+215,250]],aqua);line([[a+198,240],[a+215,250],[a+198,260]],aqua);dot(a+46+165*phase,250,7)}animals(c);label(450,385,'ऊर्जा का प्रवाह →','Energy flow →');break}
 case 'market':case 'interest':{line([[145,115],[145,405],[795,405]],pale,3);const market=topics[n][0]==='market';const f=u=>[165+580*u,market?150+210*u:365-150*u];const h=u=>[165+580*u,market?360-210*u:365-120*(Math.exp(1.25*u)-1)];curve(f,gold);curve(h,aqua);dot(...f(phase),7,gold);dot(...h(phase),7,aqua);if(market){c.setLineDash([5,6]);line([[145,255],[455,255],[455,405]],pale,1.5);c.setLineDash([]);shadedBall(c,455,255,9,pale)}label(295,96,market?'माँग':'साधारण ब्याज',market?'Demand':'Simple interest',gold);label(620,96,market?'आपूर्ति':'चक्रवृद्धि',market?'Supply':'Compound',aqua);label(450,455,market?'मात्रा →':'समय →',market?'Quantity →':'Time →');label(87,240,market?'भाव':'रकम',market?'Price':'Value');break}
 case 'fraction':{const a=t*.7;curve(u=>[450+144*cos(6.283*u),268-144*sin(6.283*u)],aqua);line([[240,268],[670,268]],pale,2);line([[450,90],[450,445]],pale,2);x=450+144*cos(a);y=268-144*sin(a);line([[450,268],[x,y],[x,268]],gold);c.fillStyle="rgba(244,194,101,.18)";c.beginPath();c.moveTo(450,268);c.lineTo(x,268);c.lineTo(x,y);c.fill();shadedBall(c,x,y,9,gold);label(706,160,'ऊँचाई = sin θ','Height = sin θ');break}
 default:{line([[745,115],[745,390]],pale,10);dot(145,250,22);const out=phase<.5;x=out?145+1200*phase:745-1200*(phase-.5);for(let i=0;i<3;i++){c.beginPath();c.arc(x,250,20+i*16,out?-.7:2.44,out?.7:3.84);c.strokeStyle=out?aqua:gold;c.stroke()}label(745,430,'दीवार','Wall');label(170,430,'ध्वनि स्रोत','Sound source')}
 }}

const $=s=>document.querySelector(s), canvas=$('canvas'), ctx=canvas.getContext('2d'), terrain=document.createElement('canvas');
const g=terrain.getContext('2d'), sin=Math.sin, cos=Math.cos, abs=Math.abs, exp=Math.exp;
let n=0, hi=true, time=0, auto=true, running=!matchMedia('(prefers-reduced-motion: reduce)').matches;
try{hi=localStorage.getItem('gen_lang')!=='en'}catch{}
const channel=y=>.43*sin(4*y), ridge=y=>.12*sin(y*4);
function baseSurface(x,y){
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
 terrainBackdrop();
 const cells=112, step=2/cells;
 for(let j=0;j<cells;j++)for(let i=cells-1;i>=0;i--){
 const x=-1+i*step,y=-1+j*step, [z,c]=sample(x,y), zx=sample(x+step,y)[0], zy=sample(x,y+step)[0];
 const A=point(x,y,z),B=point(x+step,y,zx),C=point(x+step,y+step),D=point(x,y+step,zy);
 const grain=sin(i*73+j*41)*.035, light=Math.max(.49,Math.min(1.35,.93+.34*(zx-z)/step-.18*(zy-z)/step+grain+.08*rockNoise(x*3,y*3)));
 const rgb=[1,3,5].map(k=>Math.min(255,Math.round(parseInt(c.slice(k,k+2),16)*light)));
 polygon([A,B,C,D],'rgb('+rgb.join(',')+')');
 surfaceMarks(i,j,A,c,grain);
 if(i===0||j===cells-1){const [u,v]=j===cells-1?[D,C]:[A,D];polygon([u,v,[v[0],v[1]+19],[u[0],u[1]+19]],j===cells-1?'#786b58':'#504f48');for(let k=1;k<=3;k++){const d=4*k+2*sin(x*9+y*7+k);g.strokeStyle=k%2?'#978267':'#645849';g.lineWidth=1.4;g.beginPath();g.moveTo(u[0],u[1]+d);g.lineTo(v[0],v[1]+d);g.stroke()}}
 }}
const anchors=[[[-.43,-.2],[.63,.18]],[[.54,.39],[.32,.39]],[[0,0],[.07,.67]],[[.39,.38],[.64,.9]],[[0,-.77],[0,.74]],[[-.39,0],[.5,0]],[[-.14,.15],[.61,.55]],[[0,0],[.68,.42]]];
function draw(){if(n>=8){diagram();return}
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
 ctx.globalAlpha=1;anchors[n].forEach(([x,y],i)=>{const [px,py]=point(x,y),tx=i?668:190,ty=i?355:100;const label=topics[n][(hi?5:6)+2*i];ctx.font='600 25px "Nirmala UI",sans-serif';const w=ctx.measureText(label).width+24;ctx.lineWidth=1.8;ctx.strokeStyle='#fff0ce';ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(tx,ty);ctx.stroke();ctx.fillStyle='#fff0ce';ctx.fillRect(px-3,py-3,6,6);ctx.fillStyle='#132e35';ctx.fillRect(tx-w/2,ty-21,w,39);ctx.textAlign='center';ctx.fillStyle='#fff5d8';ctx.fillText(label,tx,ty+7)});
}
function select(i){n=i;time=0;if(n<8)build();render()}
function render(){const row=topics[n];$("#observe-label").textContent=hi?"दृश्य में ध्यान दें":"Look closely";$("#observation").textContent=observations[n][hi?0:1];document.documentElement.lang=hi?'hi':'en';$('h1').textContent=row[hi?1:2];$('#lesson').textContent=row[hi?3:4];$('#category').textContent=(n<8?(hi?'भूगोल':'GEOGRAPHY'):n===13?(hi?'पर्यावरण':'ECOLOGY'):n===14||n===15?(hi?'अर्थशास्त्र':'ECONOMICS'):n===16?(hi?'गणित':'MATHS'):(hi?'विज्ञान':'SCIENCE'))+' / '+String(n+1).padStart(2,'0');$('#choose').textContent=hi?'दूसरा दृश्य देखें':'Explore the scenes';$('#lang').textContent=hi?'English':'हिन्दी';$('#play').textContent=running?(hi?'रोकें Ⅱ':'Pause Ⅱ'):(hi?'चलाएँ ▷':'Play ▷');topics.forEach((r,i)=>{let b=$('#topics').children[i];if(!b){b=document.createElement('button');$('#topics').append(b);b.onclick=()=>{auto=false;select(i)}}b.textContent=r[hi?1:2];b.setAttribute('aria-pressed',n===i)});draw()}
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
