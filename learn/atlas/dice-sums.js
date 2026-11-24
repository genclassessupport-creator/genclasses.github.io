const diceMotion = matchMedia('(prefers-reduced-motion: reduce)');
function diceSumsScene() {
  const c=ctx, teal='#8ce2d5', amber='#ffce94', paper='#f8f6e8';
  const still=diceMotion.matches;
  const t=still?(time<10?5:time<23?18:time<37?35:45):time;
  const comparing=t>=37, diagonal=t>=23;
  const revealed=diagonal?Math.min(6,1+Math.floor((t-23)/1.6)):0;
  let a=2,b=5;
  if(comparing){a=6;b=6}
  else if(diagonal){a=revealed;b=7-a}
  else if(t>=15){a=5;b=2}
  else if(t<10){a=1+Math.floor(t/2)%6;b=3}
  c.save();
  c.setTransform(canvas.width/900,0,0,canvas.height/530,0,0);atmosphere(c,false);
  function label(x,y,value,colour,size) {
    c.fillStyle=colour;c.textAlign='center';c.font='600 '+size+'px "Nirmala UI",system-ui,sans-serif';c.fillText(value,x,y);
  }
  function die(x,y,v,colour) {
    // The bevel sits below the numbered face so pips stay easy to count.
    c.fillStyle='#101d28';c.beginPath();c.roundRect(x-45,y-40,90,95,15);c.fill();
    const shade=c.createLinearGradient(x-45,y-45,x+45,y+45);
    shade.addColorStop(0,paper);shade.addColorStop(.45,colour);shade.addColorStop(1,colour);
    c.fillStyle=shade;c.beginPath();c.roundRect(x-45,y-45,90,90,15);c.fill();
    const dots=[];
    if(v%2)dots.push([0,0]);
    if(v>=2)dots.push([-1,-1],[1,1]);
    if(v>=4)dots.push([1,-1],[-1,1]);
    if(v===6)dots.push([-1,0],[1,0]);
    for(const [dx,dy] of dots){c.fillStyle='#17343c';c.beginPath();c.arc(x+dx*23,y+dy*23,6.2,0,Math.PI*2);c.fill()}
  }
  const bounce=still?0:Math.max(0,1-(t%2)*4)*4;
  die(140,227-bounce,a,teal);die(268,227-bounce,b,amber);
  label(140,150,hi?'पहला पासा':'First die',teal,23);
  label(268,150,hi?'दूसरा पासा':'Second die',amber,23);
  label(201,341,a+' + '+b+' = '+(a+b),paper,35);
  label(201,396,comparing?'P(12) = 1/36':diagonal&&revealed===6?'P(7) = 6/36':hi?'पंक्ति, फिर कॉलम':'Row, then column',paper,23);
  const cell=49,left=496,top=120;
  label(left+cell*3,66,hi?'दूसरा पासा →':'Second die →',amber,22);
  for(let i=1;i<=6;i++){
    label(left+(i-.5)*cell,top-12,i,amber,22);label(left-24,top+(i-.5)*cell+8,i,teal,22);
  }
  for(let row=1;row<=6;row++)for(let col=1;col<=6;col++){
    const chosen=row===a&&col===b,seven=diagonal&&row+col===7&&row<=revealed;
    const accent=comparing&&chosen?amber:teal,x=left+(col-1)*cell,y=top+(row-1)*cell;
    c.fillStyle=chosen?accent:seven?'#396e68':'#243e47';c.fillRect(x+1,y+1,cell-3,cell-3);
    if(chosen||seven){c.strokeStyle=accent;c.lineWidth=2;c.strokeRect(x+2,y+2,cell-5,cell-5)}
    label(x+cell/2,y+cell*.66,row+col,chosen?'#132c33':paper,22);
  }
  label(640,458,diagonal?'Σ 7   ·   '+revealed+' / 36':(hi?'हर खाने में दोनों अंकों का योग':'Each square shows the sum'),teal,21);
  c.restore();
}
