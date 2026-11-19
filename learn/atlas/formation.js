// A time-compressed landscape cross-section. The mesh and river path evolve together.
const terrainFilm=document.createElement('canvas');
terrainFilm.width=1000;terrainFilm.height=588;
const land=terrainFilm.getContext('2d');
let terrainFrame='';
function ramp(t,a,b){let v=Math.max(0,Math.min(1,(t-a)/(b-a)));return v*v*(3-2*v)}
function course(y,t){return .09*Math.sin(y*4)+(.045+.35*ramp(t,13,39))*Math.sin(y*5.1)}
function ground(x,y,t,mountain){
 const noise=rockNoise(x*1.3,y*1.4);
 if(mountain){
   const lift=ramp(t,4,36),axis=x+.17*Math.sin(3*y);
   return .12+.035*noise+lift*Math.exp(-4.5*axis*axis)*(.76+.22*Math.cos(6*y)+.2*noise);
 }
 const d=Math.abs(x-course(y,t));
 const high=(1-y)*.5;
 return .10+.24*high+.55*high*high*Math.min(1,d*2.5)+.075*noise*Math.min(1,d*3)
   -.075*ramp(t,3,25)*Math.exp(-160*d*d);
}
function projectLand(x,y,z){return [450+x*276+y*116,330+y*99-x*48-z*186]}
function landColour(rgb,brightness){return 'rgb('+rgb.map(v=>Math.min(255,Math.max(0,Math.round(v*brightness)))).join(',')+')'}
function facet(points,colour){
 land.beginPath();land.moveTo(...points[0]);for(let i=1;i<points.length;i++)land.lineTo(...points[i]);
 land.closePath();land.fillStyle=colour;land.fill();land.lineWidth=.65;land.strokeStyle=colour;land.stroke();
}
function landscape(t,mountain){
 const key=Number(mountain)+':'+Math.floor(t*5);
 if(key===terrainFrame)return;terrainFrame=key;
 land.setTransform(1000/900,0,0,588/530,0,0);
 const sky=land.createLinearGradient(0,0,0,530);sky.addColorStop(0,'#96b9c3');sky.addColorStop(.54,'#e7d7b4');sky.addColorStop(1,'#7d897b');land.fillStyle=sky;land.fillRect(0,0,900,530);
 // Distant ridgelines give a scale reference behind the exposed rock section.
 for(let band=0;band<3;band++){
   const edge=[[0,530]];for(let x=0;x<=910;x+=7)edge.push([x,129+band*31+15*Math.sin(x/92+band)+10*Math.cos(x/52+band)+8*rockNoise(x/140,band)]);
   edge.push([910,530]);facet(edge,['#a5b4ac','#95a79c','#83988b'][band]);
 }
 const cols=72,rows=54, grid=[];
 for(let j=0;j<=rows;j++){
   const row=[];grid.push(row);
   for(let i=0;i<=cols;i++){
     const x=2*i/cols-1,y=2*j/rows-1,z=ground(x,y,t,mountain);
     row.push({x,y,z,p:projectLand(x,y,z)});
   }
 }
 for(let j=0;j<rows;j++)for(let i=cols-1;i>=0;i--){
   const a=grid[j][i],b=grid[j][i+1],d=grid[j+1][i],c=grid[j+1][i+1];
   const dx=(b.z-a.z)*cols/2,dy=(d.z-a.z)*rows/2,grain=rockNoise(a.x*4,a.y*4);
   const light=Math.min(1.27,Math.max(.57,.96+.24*dx-.2*dy+.09*grain));
   const dist=Math.abs(a.x-course(a.y,t)), water=!mountain&&dist<.047&&a.y<(-1+2.1*ramp(t,0,12));
   let rgb=mountain?(a.z>.87?[225,226,210]:a.z>.46?[151,139,114]:[132,145,99]):water?[49,146,157]:dist<.11?[199,176,122]:[127,153,99];
   facet([a.p,b.p,c.p,d.p],landColour(rgb,light));
   if(i===0||j===rows-1){
     const [u,v]=j===rows-1?[d,c]:[a,d];
     let U=u.p,V=v.p;
     const colours=['#9a805d','#c8a36d','#845f50','#bb9069','#6b5650'];
     for(let k=0;k<5;k++){
       const bottom=o=>{let z=o.z-(k+1)*.064;
         if(mountain)z-=.075*(k+1)*ramp(t,5,36)*Math.exp(-3*o.x*o.x);
         return projectLand(o.x,o.y,z)};
       const uu=bottom(u),vv=bottom(v);
       facet([U,V,vv,uu],colours[k]);U=uu;V=vv;
     }
   }
 }
}
function sceneTag(x,y,h,e){
 const s=hi?h:e;ctx.font='600 20px "Nirmala UI",sans-serif';const w=ctx.measureText(s).width+22;
 ctx.fillStyle='rgba(22,45,44,.91)';ctx.fillRect(x-w/2,y-21,w,32);ctx.fillStyle='#fff6db';ctx.textAlign='center';ctx.fillText(s,x,y+2);
}
function formation(mountain){
 const t=time;ctx.setTransform(canvas.width/900,0,0,canvas.height/530,0,0);if(!mountain&&t>=24){bendCloseup(t);return}landscape(t,mountain);ctx.drawImage(terrainFilm,0,0,900,530);
 if(mountain){
   const shift=12*Math.sin(t*1.4);
   for(const side of [-1,1]){
     const x=450+side*(296+shift),y=327-side*46;ctx.fillStyle='#ffe69f';ctx.beginPath();ctx.moveTo(x-side*26,y);ctx.lineTo(x+side*1,y-13);ctx.lineTo(x+side*1,y-5);ctx.lineTo(x+side*45,y-5);ctx.lineTo(x+side*45,y+5);ctx.lineTo(x+side*1,y+5);ctx.lineTo(x+side*1,y+13);ctx.fill();
   }
   sceneTag(450,472,t<10?'आरंभिक परतें':t<26?'संपीड़न और वलन':t<37?'पर्वत का उत्थान':'वलित पर्वत श्रेणी',t<10?'Original strata':t<26?'Shortening and folding':t<37?'Mountain uplift':'Fold mountain range');
 }else{
   tributaries(t);const end=-1+2*ramp(t,0,12);
   for(let k=0;k<105;k++){const y=-1+2*((k*.618+t*.105)%1);if(y>end)continue;
     const x=course(y,t)+.019*Math.sin(k*17);const [px,py]=projectLand(x,y,ground(x,y,t,false)+.012);
     oval(ctx,px,py,2.8,1.2,'#c4f5ec');
   }
   if(t<11){for(let k=0;k<38;k++){const x=.56*Math.sin(k*37),y=-.86+.14*Math.cos(k*9),z=ground(x,y,t,false)+.5*(1-(t*.7+k*.31)%1);const [px,py]=projectLand(x,y,z);ctx.fillStyle='#cdf4f7';ctx.fillRect(px,py,1.5,7)}}
   if(t>22){
     const y=.31,x=course(y,t),z=ground(x,y,t,false);
     for(const [dx,ink] of [[.07,'#e07749'],[-.07,'#f3cf6f']]){const [px,py]=projectLand(x+dx,y,z+.04);oval(ctx,px,py,7,5,ink)}
     sceneTag(290,463,'सुनहरा · जमाव','Gold · deposition');sceneTag(624,463,'नारंगी · कटाव','Orange · erosion');
   }else sceneTag(450,463,t<10?'वर्षा और ऊपरी जलग्रहण':'ढाल के साथ नदी का बहाव',t<10?'Rain in the headwaters':'Flow follows the slope');
 }
}
// Switch to a plan view to show opposite banks moving through the floodplain.
function bendCloseup(t){
 const sky=ctx.createLinearGradient(0,0,900,530);
 sky.addColorStop(0,'#b4bd89');sky.addColorStop(.5,'#8caa78');sky.addColorStop(1,'#617e5d');
 ctx.fillStyle=sky;ctx.fillRect(0,0,900,530);
 for(let i=0;i<280;i++){
   const x=(i*197.3)%901,y=(i*103.91)%533;
   oval(ctx,x,y,4+i%11,1.3+i%4,i%2?'#8da477':'#91aa79');
 }
 const age=ramp(t,24,46),shift=82+113*age;
 function center(y,amplitude){return 435+amplitude*Math.sin(y/91-.56)}
 function trace(offset,width,color,amp){
   ctx.beginPath();for(let y=-12;y<550;y+=3){const x=center(y,amp)+offset(y);if(y===-12)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
   ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();
 }
 const fixed=()=>0;
 trace(fixed,44,'#b8b587',82);
 for(let k=0;k<6;k++)trace(fixed,38,'rgba(210,191,135,.46)',82+(shift-82)*k/6);
 trace(fixed,52,'#bd9569',shift);trace(fixed,45,'#468c92',shift);trace(fixed,31,'#35828d',shift);
 for(let i=0;i<90;i++){
   const y=(i*83+t*31)%550-10,x=center(y,shift)+12*Math.sin(i*71);
   ctx.strokeStyle='#a9ddcf';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(center(y+5,shift)+12*Math.sin(i*71),y+5);ctx.stroke()
 }
 const y=(Math.PI/2+.56)*91,x=center(y,shift);
 function pointer(px,dx,h,e){
   ctx.lineWidth=2;ctx.strokeStyle='#fff3cb';ctx.beginPath();ctx.moveTo(px,y);ctx.lineTo(px+dx,y-50);ctx.stroke();
   oval(ctx,px,y,5,5,'#fff3cb');sceneTag(px+dx,y-56,h,e)
 }
 pointer(x+26,80,'बाहरी किनारा · कटाव','Outer bank · erosion');
 pointer(x-27,-115,'भीतरी किनारा · जमाव','Inner bank · deposition');
 sceneTag(450,464,'ऊपर से दृश्य · समय संक्षिप्त','Plan view · time compressed');
}
function tributaries(t){
 for(let branch=0;branch<4;branch++){
   const side=branch%2?1:-1,join=-.64+branch*.16;
   function stream(u){
     const y=join-.38*(1-u),x=course(y,t)+side*(1-u)*(.42+.09*Math.sin(4*u+branch));
     return projectLand(x,y,ground(x,y,t,false)+.014)
   }
   const limit=ramp(t,branch*.65,4+branch*.65);ctx.beginPath();
   for(let j=0;j<=24;j++){const pt=stream(j/24*limit);if(j)ctx.lineTo(...pt);else ctx.moveTo(...pt)}
   ctx.lineWidth=2;ctx.strokeStyle='#75bdc2';ctx.stroke();
   for(let i=0;i<5;i++){const pt=stream(((i/5+t*.22)%1)*limit);oval(ctx,...pt,2.3,1.1,'#def7ed')}
 }
}
