(function(){
  try{
    var t=localStorage.getItem('gen_theme');
    if(t==='dark'){document.documentElement.removeAttribute('data-theme');}
    else{document.documentElement.setAttribute('data-theme','light');}
  }catch(e){document.documentElement.setAttribute('data-theme','light');}
  window.genToggleTheme=function(){
    var dark=!document.documentElement.getAttribute('data-theme');
    if(dark){document.documentElement.removeAttribute('data-theme');try{localStorage.setItem('gen_theme','dark');}catch(e){}}
    else{document.documentElement.setAttribute('data-theme','light');try{localStorage.setItem('gen_theme','light');}catch(e){}}
    var b=document.getElementById('themeBtn'); if(b) b.textContent=dark?'☀️':'🌙';
  };
  document.addEventListener('DOMContentLoaded',function(){
    var b=document.getElementById('themeBtn');
    if(b){b.textContent=document.documentElement.getAttribute('data-theme')==='light'?'🌙':'☀️'; b.onclick=genToggleTheme;}
    document.querySelectorAll('.mcq').forEach(function(box){
      var btn=box.querySelector('[data-reveal]');
      if(btn) btn.addEventListener('click',function(){box.classList.toggle('open');});
    });
    var inp=document.getElementById('syllabusSearch');
    var out=document.getElementById('searchResults');
    if(inp&&out){
      var idx=[];
      fetch('/syllabus/search-index.json').then(function(r){return r.json()}).then(function(d){idx=d||[];}).catch(function(){});
      function render(q){
        q=(q||'').trim().toLowerCase();
        if(!q){out.classList.remove('open');out.innerHTML='';return;}
        var hits=idx.filter(function(it){
          return (it.title||'').toLowerCase().indexOf(q)>=0 || (it.keywords||'').toLowerCase().indexOf(q)>=0 || (it.exam||'').toLowerCase().indexOf(q)>=0;
        }).slice(0,24);
        if(!hits.length){out.classList.add('open');out.innerHTML='<div style="padding:14px;color:var(--mist)">कोई परिणाम नहीं मिला।</div>';return;}
        out.classList.add('open');
        out.innerHTML=hits.map(function(h){
          return '<a href="'+h.url+'"><strong>'+h.title+'</strong><span>'+h.exam+(h.section?(' · '+h.section):'')+'</span></a>';
        }).join('');
      }
      inp.addEventListener('input',function(){render(inp.value);});
    }
  });
})();