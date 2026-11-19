const subjectCatalog=[
 {title:['भूगोल','Geography'],ids:['river','mountain-building','monsoon','volcano','delta','glacier','dunes','coast','ridge','anticline','syncline','normal-fault','reverse-fault']},
 {title:['विज्ञान','Science'],ids:['wave','pendulum','lens','projectile','diffusion','echo']},
 {title:['पर्यावरण','Environment'],ids:['food']},
 {title:['अर्थशास्त्र','Economics'],ids:['market','interest']},
 {title:['गणित','Mathematics'],ids:['fraction']}
];
function subjectOf(id){return subjectCatalog.find(s=>s.ids.includes(id))||{title:['अन्य विषय','Other topics']}}
function topicMenu(){
 const menu=$('#topics'),lang=hi?0:1;
 const groups=new Map();
 topics.forEach((row,i)=>{const key=subjectOf(row[0]).title[lang];if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i)});
  const picker=$('#subject-picker');picker.replaceChildren();
 const all=document.createElement('option');all.value='';all.textContent=hi?'विषय चुनें':'Choose a subject';picker.append(all);
 for(const name of groups.keys()){const o=document.createElement('option');o.value=name;o.textContent=name;picker.append(o)}
 picker.onchange=()=>{for(const group of menu.children){group.open=group.dataset.subject===picker.value;if(group.open)menu.scrollTop=group.offsetTop-menu.offsetTop}};
 let previous=menu.scrollTop;menu.replaceChildren();
 for(const [label,indices] of groups){
   const group=document.createElement('details');group.dataset.subject=label;group.open=indices.includes(n);
   const heading=document.createElement('summary');heading.textContent=label+' · '+indices.length;group.append(heading);
   for(const i of indices){const button=document.createElement('button');button.textContent=topics[i][1+lang];button.setAttribute('aria-pressed',i===n);
     button.onclick=()=>{running=true;select(i)};group.append(button)}
   menu.append(group);
 }
 menu.scrollTop=previous;
}
