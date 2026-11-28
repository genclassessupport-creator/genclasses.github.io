const opportunityMotion = matchMedia('(prefers-reduced-motion: reduce)');

function opportunityCostScene() {
  const c=ctx, paper='#f2f3df', teal='#86dfd2', amber='#ffcb84';
  const t=opportunityMotion.matches ? (time<10?8:time<23?21:time<37?35:44) : time;
  const clothX=m=>96+100*m, grainY=kg=>393-25*kg;
  const grain=[10,9,7,4,0];
  const progress=(a,b)=>Math.max(0,Math.min(1,(t-a)/(b-a)));
  c.save();
  c.setTransform(canvas.width/900,0,0,canvas.height/530,0,0);
  atmosphere(c,false);
  function line(x1,y1,x2,y2,ink,width=2){
    c.strokeStyle=ink;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
  }
  function label(x,y,s,ink=paper,size=23,align='center'){
    c.textAlign=align;c.fillStyle=ink;c.font='600 '+size+'px "Nirmala UI",system-ui,sans-serif';c.fillText(s,x,y);
  }
  label(75,104,hi?'अनाज (किग्रा)':'Grain (kg)',paper,22,'left');
  for(let kg=0;kg<=10;kg++){
    const y=grainY(kg);
    line(96,y,501,y,'#34565a',1);
    if([0,4,7,9,10].includes(kg))label(77,y+6,kg,paper,18,'right');
  }
  for(let m=0;m<=4;m++){
    const x=clothX(m);line(x,142,x,393,'#34565a',1);label(x,421,m,paper,19);
  }
  line(96,135,96,393,paper);line(96,393,510,393,paper);
  label(301,468,hi?'कपड़ा (मीटर)':'Cloth (metres)',paper);
  for(let j=0;j<4;j++)line(clothX(j),grainY(grain[j]),clothX(j+1),grainY(grain[j+1]),'#a9bbb3',3);
  const stages=[progress(10,18),progress(23,31)];
  stages.forEach((f,i)=>{
    if(!f)return;
    const x=clothX(i+1),y=grainY(grain[i+1]),x2=x+100,y2=grainY(grain[i+2]),ink=i?amber:teal;
    c.setLineDash([5,5]);line(x,y,x+100*f,y,ink);line(x+100*f,y,x+100*f,y+(y2-y)*f,ink);c.setLineDash([]);
    line(x,y,x+100*f,y+(y2-y)*f,ink,4);
    c.beginPath();c.arc(x+100*f,y+(y2-y)*f,6,0,2*Math.PI);c.fillStyle=ink;c.fill();
  });
  ['A','B','C'].forEach((v,i)=>{
    const x=clothX(i+1),y=grainY(grain[i+1]);
    c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.fillStyle=paper;c.fill();label(x-13,y+26,v,paper,20);
  });
  label(700,127,hi?'अगला 1 मीटर कपड़ा':'One more metre of cloth',paper,22);
  label(700,163,hi?'छोड़ा गया अनाज':'Grain forgone','#a9c3b7',19);
  stages.forEach((f,i)=>{
    const x=635+i*123,ink=i?amber:teal,drop=grain[i+1]-grain[i+2];
    for(let k=0;k<drop;k++){
      c.fillStyle=f>=(k+1)/drop?ink:'#314c50';c.fillRect(x-33,328-36*k,66,29);
    }
    label(x,391,i?'B → C':'A → B',ink,20);
    if(f===1)label(x,430,drop+' kg',paper,27);
  });
  if(t>=37)label(700,476,'2 kg < 3 kg',paper,22);
  c.restore();
}
