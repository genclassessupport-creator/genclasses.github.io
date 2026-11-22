// Equal-size energy blocks make successive tenfold changes directly countable.
const energyMotion = matchMedia('(prefers-reduced-motion: reduce)');
function trophicEnergyScene() {
  const c = ctx;
  const ink = '#e8f1dc', gold = '#ffe2a1';
  const phaseTime = energyMotion.matches ? (time < 10 ? 6 : time < 23 ? 19 : time < 37 ? 34 : 45) : time;
  c.save();
  c.setTransform(canvas.width / 900, 0, 0, canvas.height / 530, 0, 0);
  atmosphere(c, false);

  function face(points, colour) {
    c.beginPath(); c.moveTo(...points[0]);
    for (const point of points.slice(1)) c.lineTo(...point);
    c.closePath(); c.fillStyle = colour; c.fill();
  }
  function block(x,y,palette) {
    face([[x,y-6],[x+10,y],[x,y+6],[x-10,y]],palette[0]);
    face([[x-10,y],[x,y+6],[x,y+15],[x-10,y+9]],palette[1]);
    face([[x,y+6],[x+10,y],[x+10,y+9],[x,y+15]],palette[2]);
  }
  function label(x,y,value,colour=ink,size=24) {
    c.textAlign='center';c.font='600 '+size+'px "Nirmala UI",system-ui,sans-serif';
    c.fillStyle=colour;c.fillText(value,x,y);
  }
  const colours=[['#a9d687','#709c65','#456f4e'],['#ffe2a1','#d5a757','#956e43'],['#ffa97b','#d98259','#9e5945']];
  const centers=[163,450,735];
  const names=hi?['घास','शाकाहारी','मांसाहारी']:['Grass','Herbivores','Carnivores'];
  const start=[0,10,23],end=[6,19,31],capacity=[100,10,1];
  const counts=capacity.map((count,i)=>Math.round(count*Math.max(0,Math.min(1,(phaseTime-start[i])/(end[i]-start[i])))));
  for(let i=0;i<3;i++){
    const x=centers[i];
    // The recessed plinths stay the same size for all three trophic levels.
    face([[x-121,263],[x,188],[x+121,263],[x,337]],'#3b5555');
    face([[x-121,263],[x,337],[x,350],[x-121,276]],'#273f43');
    face([[x,337],[x+121,263],[x+121,276],[x,350]],'#1e383d');
    const cols=i===0?10:i===1?5:1, rows=capacity[i]/cols;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      if(row*cols+col>=counts[i])continue;
      const a=col-(cols-1)/2,b=row-(rows-1)/2;
      block(x+(a-b)*11,252+(a+b)*6.6,colours[i]);
    }
    label(x,135,names[i],ink,27);
    label(x,392,counts[i]*10+' kJ',colours[i][0],31);
    if(i>0 && phaseTime>=start[i]){
      const ax=x-145;
      c.strokeStyle=gold;c.lineWidth=2;c.beginPath();
      c.moveTo(ax-20,196);c.lineTo(ax+16,196);c.lineTo(ax+9,190);c.moveTo(ax+16,196);c.lineTo(ax+9,202);c.stroke();
      label(ax,176,'10%',gold,19);
    }
  }
  if(time>=37)label(450,465,'10 kJ / 1,000 kJ = 1%',gold,25);
  else label(450,465,hi?'1 खंड = 10 kJ':'1 block = 10 kJ',ink,22);
  c.restore();
}
