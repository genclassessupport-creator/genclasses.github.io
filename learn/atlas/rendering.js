// Deterministic relief keeps surface features stationary as the process animates.
function rockNoise(x,y){
  return .48*Math.sin(7*x+2*Math.sin(5*y)) * Math.cos(8*y-x)
    +.27*Math.sin(17*x-13*y)*Math.cos(8*x+16*y)
    +.15*Math.cos(36*x+19*y)+.10*Math.sin(66*x-41*y);
}
const water=new Set(['#3a9dac','#3d9da8','#4babb0']);
function sample(x,y){
  const [height,material]=baseSurface(x,y);
  const roughness=[.14,.026,.11,.018,.13,.019,.08,.13][n];
  const ice=material==='#c6e6ec', liquid=water.has(material);
  const ridgeDetail=rockNoise(x,y)*roughness*(liquid?.025:ice?.22:1);
  return [height+ridgeDetail,material];
}
function atmosphere(c,field){
  const gradient=c.createRadialGradient(215,72,10,465,280,650);
  gradient.addColorStop(0,field?'#69877d':'#315159');
  gradient.addColorStop(.49,field?'#324e4f':'#1c363e');
  gradient.addColorStop(1,'#101f2a');
  c.fillStyle=gradient;c.fillRect(0,0,900,530);
}
function oval(c,x,y,rx,ry,color){
  c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();
}
function terrainBackdrop(){
  atmosphere(g,true);
  g.save();g.translate(452,343);g.scale(1,.28);
  const shade=g.createRadialGradient(0,0,20,0,0,410);
  shade.addColorStop(0,'rgba(3,12,16,.88)');shade.addColorStop(1,'rgba(3,12,16,0)');
  g.fillStyle=shade;g.fillRect(-420,-420,840,840);g.restore();
}
function surfaceMarks(i,j,A,material,grain){
  const [x,y]=A;
  if(water.has(material)||material==='#c6e6ec'||n===5){
    if((i*7+j*3)%13!==0)return;
    g.strokeStyle=water.has(material)?'rgba(190,241,229,.48)':n===5?'rgba(123,80,45,.32)':'rgba(44,109,143,.55)';
    g.lineWidth=.85;g.beginPath();g.moveTo(x-3,y+1);g.quadraticCurveTo(x,y-1,x+5+grain*10,y);g.stroke();
  }else if((material==='#548878'||material==='#77975c'||material==='#689373')&&(i*17+j*29)%31===0){
    const h=3+Math.abs(grain)*64;
    oval(g,x+2,y,4,1,'rgba(12,34,21,.4)');
    polygon([[x-2,y],[x+.3,y-h],[x+2.3,y]],'#345540');
    polygon([[x-2,y],[x+.3,y-h],[x-.2,y]],'#688653');
  }
}
function shadedBall(c,x,y,r,color){
  const shine=c.createRadialGradient(x-r*.38,y-r*.46,0,x,y,r);
  shine.addColorStop(0,'#fff5db');shine.addColorStop(.32,color);shine.addColorStop(1,'#455153');
  oval(c,x,y,r,r,shine);
}
function glass(c,x,y,w,h){
  const grad=c.createLinearGradient(x,y,x+w,y+h);
  grad.addColorStop(0,'rgba(208,255,255,.21)');grad.addColorStop(.3,'rgba(83,149,166,.05)');grad.addColorStop(1,'rgba(152,215,222,.19)');
  c.fillStyle=grad;c.fillRect(x,y,w,h);
  c.strokeStyle='#8bbdc3';c.lineWidth=2;c.strokeRect(x,y,w,h);
}
function fieldFood(c){
  const sky=c.createLinearGradient(0,80,0,460);
  sky.addColorStop(0,'#273f47');sky.addColorStop(.6,'#749481');sky.addColorStop(1,'#253f35');
  c.fillStyle=sky;c.fillRect(0,0,900,530);
  for(let k=0;k<3;k++){
    c.beginPath();c.moveTo(0,530);
    for(let x=0;x<=905;x+=5)c.lineTo(x,180+k*66+22*Math.sin(x/130+k)+13*Math.cos(x/72-k));
    c.lineTo(905,530);c.closePath();c.fillStyle=['#68877c','#4e7063','#355647'][k];c.fill();
  }
  for(let i=0;i<130;i++){
    const x=i*7,y=312+82*(.5+.5*Math.sin(i*91));
    c.strokeStyle=i%2?'#708458':'#496d50';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-1,y-7,x-4,y-11);c.stroke();
  }
}
function animals(c){
  function shape(path,color){c.fillStyle=color;c.fill(new Path2D(path))}
  c.save();c.translate(182,270);
  for(let k=0;k<16;k++){c.save();c.rotate((k-8)*.095);shape('M0 0 Q-13 -30 0 -68 Q4 -33 0 0',k%2?'#c5c16e':'#799e59');c.restore()}c.restore();
  c.save();c.translate(450,265);
  oval(c,0,8,41,6,'#30483d');oval(c,-11,-9,32,23,'#bda99a');oval(c,9,-29,17,15,'#cbb9a5');
  c.save();c.translate(8,-40);c.rotate(-.22);oval(c,0,-14,5,22,'#d7c6ae');oval(c,0,-16,2,15,'#a77f76');c.rotate(.55);oval(c,6,-10,5,20,'#b5a192');c.restore();
  oval(c,-39,-10,8,8,'#e8decc');oval(c,16,-31,2.6,2.6,'#202b27');oval(c,-12,6,20,5,'#b5a18c');c.restore();
  c.save();c.translate(705,263);
  oval(c,-1,12,53,6,'#30483d');
  shape('M-25 -13 Q-58 -4 -69 -40 Q-63 9 -23 2Z','#cb7544');shape('M-69 -40 Q-67 -19 -57 -12 L-56 -23Z','#ede3ca');
  shape('M-35 -17 Q-15 -35 15 -23 L30 -43 L47 -34 L61 -27 L43 -18 L30 -16 L18 8 L12 8 L13 -10 L-15 -7 L-28 11 L-34 11 L-27 -7Z','#cc7945');
  shape('M28 -35 L27 -57 L39 -42 L48 -52 L48 -33Z','#dd8850');
  shape('M29 -21 L60 -27 L45 -17 L34 -10Z','#f3dfbc');oval(c,44,-32,2,2,'#262927');c.restore();
}
// Prompts direct attention to a visible detail in the current scene.
const observations=[
 ['एक ही पर्वत की दोनों ढालें देखें। हवा ऊपर उठते समय ठंडी होती है और नीचे उतरते समय गर्म होती है।','Compare the two slopes. Rising air cools on the way up and warms as it descends on the far side.'],
 ['नदी का एक ही मोड़ देखें। बाहरी किनारे से मिट्टी हटती है और भीतरी किनारे की रेतीली पट्टी चौड़ी हो सकती है।','Follow a single bend. Loss of material at the outer bank and deposition at the inner bank can shift the bend sideways.'],
 ['चमकीली धारा को मुख से नीचे तक देखें। बहाव का रास्ता स्थानीय ढाल तय करती है।','Trace the bright stream from the vent. Local relief determines which way lava travels downhill.'],
 ['ऊपर की एक धारा को मुहाने तक देखें। यहाँ धाराएँ अलग होती हैं, जबकि सहायक नदियाँ मुख्य नदी में मिलती हैं।','Trace the upstream channel to the coast. Distributaries split off, while tributaries join a main river.'],
 ['हल्की नीली पट्टी घाटी की ढाल पर नीचे चलती है। बर्फ का बहाव जारी रहते हुए भी पिघलाव से हिमनद का सिरा पीछे हट सकता है।','Follow the blue ice downslope. The terminus can retreat through melting even while ice continues flowing downhill.'],
 ['एक शिखर के दोनों ओर की ढालों की तुलना करें। रेत बार-बार शिखर पार करे तो पूरा टीला आगे खिसक सकता है।','Compare the two sides of a crest. Repeated grain transport over the crest can move the whole dune downwind.'],
 ['लहर और चट्टान जहाँ मिलते हैं वहाँ देखें। समय के साथ आधार कटने से चट्टान का ऊपरी भाग अस्थिर होता है।','Watch where waves meet rock. Repeated erosion at the foot gradually leaves the upper part unsupported.'],
 ['कटक के दोनों तरफ गति देखें। नई पर्पटी अक्ष पर बनती है, इसलिए उससे दूर समुद्री तल सामान्यतः पुराना होता है।','Watch motion on both sides. Crust forms at the axis, so the seafloor generally gets older away from it.'],
 ['पीले कण की ऊँचाई और किसी एक शिखर की जगह देखें। इनके बदलने की दिशाएँ अलग हैं।','Track the gold bead and a crest separately. Their directions of motion are perpendicular.'],
 ['छोर पर गोला पलटता है। वहाँ उसकी ऊँचाई और गुरुत्वीय स्थितिज ऊर्जा अधिकतम होती है।','At a turning point the bob reverses direction. Its height and gravitational potential energy are greatest there.'],
 ['फोकस के आगे भी किरणों को देखें। एक बिंदु पर मिलने के बाद वे फिर अलग होती हैं।','Follow the rays past the focus. They spread apart again after crossing at one point.'],
 ['सबसे ऊँचे बिंदु पर भी गोला आगे जाता है। वहाँ ऊर्ध्वाधर वेग शून्य है, लेकिन त्वरण नीचे की ओर है।','At the apex the ball keeps moving forward. Its vertical velocity is zero, but its acceleration still points down.'],
 ['शुरू में बाईं ओर अधिक कण हैं। फैलने के बाद भी अलग-अलग कण चलते रहते हैं।','Initially most particles are on the left. Individual motion continues even after the distribution spreads out.'],
 ['तीर की पूँछ से सिरा पढ़ें। खरगोश घास से ऊर्जा लेता है और लोमड़ी खरगोश से।','Read each arrow from tail to tip. Grass supplies energy to the rabbit, which in turn supplies energy to the fox.'],
 ['प्रतिच्छेद से बाईं ओर की बिंदीदार रेखा संतुलन भाव और नीचे वाली रेखा संतुलन मात्रा बताती है।','Follow the dotted guides from the intersection to read equilibrium price on the left and quantity below.'],
 ['दोनों रेखाएँ एक ही रकम से शुरू होती हैं। समय बढ़ने पर उनके बीच का ऊर्ध्वाधर अंतर बढ़ता है।','Both traces start at the same principal. Their growing vertical separation shows the effect of interest earning interest.'],
 ['बिंदु जब क्षैतिज अक्ष के नीचे जाता है तो उसकी ऊँचाई ऋणात्मक होती है। वहाँ sin θ भी ऋणात्मक है।','When the point passes below the horizontal axis its height is negative, so the sine is negative too.'],
 ['जाने और लौटने की दूरी जोड़ें। दीवार की दूरी d और ध्वनि की चाल v हो तो लौटने का समय 2d/v है।','Count the outward and return paths. For wall distance d and sound speed v, the return time is 2d/v.']
];
