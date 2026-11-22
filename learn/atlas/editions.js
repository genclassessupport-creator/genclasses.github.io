// Release dates are shared by every visitor and include the editorial time zone.
const atlasEditions = [
 {id:'anticline', date:'2026-11-18T00:00:00+05:30',title:['अपनति','Anticline'],lesson:['संपीड़न से चट्टानी परतें ऊपर की ओर मेहराब बनाती हैं।','Compression bends rock layers into an upward arch.'],observe:['बीच की गहरे रंग की परत को दोनों ओर देखें। उसके दोनों हिस्से अक्ष से दूर झुकते हैं।','Follow the dark middle bed. Its limbs dip away from the fold axis.']},
 {id:'syncline', date:'2026-11-18T00:00:00+05:30',title:['अभिनति','Syncline'],lesson:['संपीड़न से परतें मुड़ सकती हैं। इस मॉडल में परतों का मध्य भाग कटोरे की तरह नीचे झुकता है।','Compression can fold strata. Here the beds bend into a trough in the middle.'],observe:['किसी एक परत का रंग चुनें और उसे किनारे से बीच तक देखें। दोनों ओर परत अक्ष की तरफ झुकती है।','Trace one colour from either edge towards the centre. Both limbs dip towards the fold axis.']},
 {id:'normal-fault', date:'2026-11-20T09:00:00+05:30',title:['सामान्य भ्रंश','Normal fault'],lesson:['तनाव से पर्पटी फैलती है। झुके हुए भ्रंश तल के ऊपर का चट्टानी खंड दूसरे खंड की तुलना में नीचे सरकता है।','Extension stretches the crust. The hanging wall moves down relative to the footwall along an inclined fault.'],observe:['सुनहरी परत को दरार के आर-पार मिलाएँ। दाईं ओर वही परत नीचे मिलेगी।','Match the gold bed across the fault. The same bed sits lower on the right.']},
 {id:'reverse-fault', date:'2026-11-22T09:00:00+05:30',title:['उत्क्रम भ्रंश','Reverse fault'],lesson:['संपीड़न से पर्पटी छोटी होती है। भ्रंश तल के ऊपर वाला खंड दूसरे खंड की तुलना में ऊपर सरकता है।','Compression shortens the crust. The hanging wall moves up the inclined fault relative to the footwall.'],observe:['दरार पर सुनहरी परत का विस्थापन देखें। ऊपर चढ़ता हुआ खंड बाईं तरफ भी बढ़ता है।','Watch the offset in the gold marker bed. The rising block also travels left.']},
 {
   id:'total-internal-reflection', date:'2026-11-24T09:00:00+05:30',
   title:['पूर्ण आंतरिक परावर्तन','Total internal reflection'],
   lesson:['काँच के भीतर से एक किरण हवा की ओर भेजें। आपतन कोण अभिलंब से मापा जाता है।','Follow a ray travelling from glass into air. Measure the angle of incidence from the normal.'],
   shots:['आपतन कोण बढ़ने पर हवा में किरण अभिलंब से और दूर मुड़ती है।','As the incident angle increases, the ray in air bends farther away from the normal.',
          'क्रांतिक कोण पर अपवर्तन कोण 90° है। इसके बाद प्रकाश काँच के भीतर ही परावर्तित होता है।','At the critical angle the refracted angle reaches 90°. Above it, the light reflects back inside the glass.'],
   observe:['55° पर नारंगी किरण काँच में लौटती है। अभिलंब के दोनों ओर आपतन और परावर्तन कोण बराबर हैं।','At 55°, the orange ray returns through the glass. Compare the equal incident and reflected angles on either side of the normal.']
 },
 {
   id:'trophic-energy-transfer', date:'2026-11-26T09:00:00+05:30',
   title:['पोषी स्तरों में ऊर्जा का प्रवाह','Energy transfer between trophic levels'],
   lesson:['एक समान क्षेत्र और अवधि में घास की नई जैवमात्रा में 1,000 kJ ऊर्जा संचित हुई। हर खंड 10 kJ दिखाता है।','Over a fixed area and time, new grass biomass stores 1,000 kJ. Each block represents 10 kJ.'],
   shots:['इस उदाहरण में 10% ऊर्जा शाकाहारियों की नई जैवमात्रा बनती है। घास के 100 खंडों के सामने 10 खंड गिनें।','In this example, 10% becomes new herbivore biomass. Count 10 blocks against the 100 blocks of grass production.',
          'अगले स्तर पर फिर 10% मिलने से केवल 1 खंड बचता है। कुछ जैवमात्रा खाई नहीं जाती, कुछ ऊर्जा अपशिष्ट में जाती है और श्वसन से ऊष्मा निकलती है।','A second 10% transfer yields one block. Some biomass goes uneaten, some energy leaves as waste, and respiration releases heat.'],
   observe:['दो चरणों के बाद मांसाहारियों में 10 kJ है। यह शुरुआती 1,000 kJ का 1% है। वास्तविक स्थानांतरण दक्षता अलग हो सकती है।','After two transfers, carnivores gain 10 kJ, or 1% of the original 1,000 kJ. Actual transfer efficiencies vary.']
 }
];
function geologyScene(id){
 const c=ctx;
 c.setTransform(canvas.width/900,0,0,canvas.height/530,0,0);atmosphere(c,true);
 oval(c,462,406,310,29,'rgba(6,25,28,.3)');
 const fold=id==='anticline'||id==='syncline', sign=id==='normal-fault'?1:-1;
 const p=.12+.88*(1-Math.cos(Math.min(1,time/36)*Math.PI))/2;
 const view=(x,y,z)=>[432+252*x+95*y,351-144*z-64*y+15*x];
 const inks=['#784f46','#ca9365','#e7bb69','#835d53','#b77c55','#d6af89','#607b60'];
 function face(points,ink){c.fillStyle=ink;c.strokeStyle=ink;c.lineWidth=1;c.beginPath();points.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.stroke()}
 function vertex(x,y,z,side){
   let h=z+.014*Math.sin(x*13+y*4)+.009*Math.cos(y*12-x*7);
   if(fold){h+=(id==='anticline'?1:-1)*.48*p*Math.cos(x*2.1);x*=1-.14*p}
   else if(side){x+=sign*.22*p;h-=sign*.3*p}
   return view(x,y,h);
 }
 for(const side of [0,1]){
   const at=(u,y,z)=>{const seam=fold?0:.19-.72*z;return vertex(side?seam+u*(1-seam):-1+u*(1+seam),y,z,side)};
   for(let j=0;j<7;j++){
     const low=j*.115,high=(j+1)*.115;
     face([at(1,0,low),at(1,1,low),at(1,1,high),at(1,0,high)],inks[j]);
     for(let k=0;k<48;k++){
       const a=k/48,b=(k+1)/48;
       face([at(a,0,low),at(b,0,low),at(b,0,high),at(a,0,high)],inks[j]);
       for(let m=1;m<4;m++){
         const h=low+(high-low)*m/4+.004*Math.sin(k*.7+j);
         c.strokeStyle='rgba(63,38,32,.23)';c.lineWidth=.8;c.beginPath();c.moveTo(...at(a,0,h));c.lineTo(...at(b,0,h));c.stroke();
       }
     }
   }
   for(let k=0;k<48;k++)for(let d=13;d>=0;d--){
     const u=k/48,y=d/14,h=.805, v=at(u,y,h), right=at((k+1)/48,y,h);
     const lum=37+6*Math.sin(k*.36+d*.55)+2*(right[1]-v[1]);
     face([v,right,at((k+1)/48,(d+1)/14,h),at(u,(d+1)/14,h)],'hsl(93,21%,'+lum+'%)');
   }
 }
 c.fillStyle='#fff1cc';c.font='600 23px "Nirmala UI", sans-serif';c.textAlign='center';
 const stretch=id==='normal-fault';
 c.fillText(stretch?'←':'→',105,293);c.fillText(stretch?'→':'←',811,293);
 c.fillText(stretch?(hi?'तनाव':'Extension'):(hi?'संपीड़न':'Compression'),450,464);
}
let publishedEditions=0;
function refreshEditions(){
 const now=Date.now();
 let added=false;
 while(publishedEditions<atlasEditions.length&&Date.parse(atlasEditions[publishedEditions].date)<=now){
   const e=atlasEditions[publishedEditions++];
   topics.push([e.id,...e.title,...e.lesson]);observations.push(e.observe);if(e.shots)lessonShots[topics.length-1]=e.shots;added=true;
 }
 const next=atlasEditions[publishedEditions],latest=atlasEditions[publishedEditions-1];
 const panel=document.querySelector('#edition');panel.hidden=!latest;
 if(latest){
   const btn=panel.querySelector('button');btn.textContent=(hi?'नया दृश्य · ':'Latest scene · ')+latest.title[hi?0:1]+' ↗';
   btn.onclick=()=>{auto=false;select(topics.findIndex(t=>t[0]===latest.id))};
 }
 const output=panel.querySelector('small');
 if(next){
   const mins=Math.ceil((Date.parse(next.date)-now)/60000),days=Math.floor(mins/1440),hrs=Math.floor(mins%1440/60);
   output.textContent=(hi?'अगला दृश्य · ':'Up next · ')+next.title[hi?0:1]+' · '+(hi?days+' दिन '+hrs+' घंटे '+mins%60+' मिनट':days+'d '+hrs+'h '+mins%60+'m');
 }else output.textContent='';
 return added;
}
