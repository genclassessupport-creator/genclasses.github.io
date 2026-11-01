(function(){
  try{
    var t=localStorage.getItem('gen_theme');
    if(t==='dark'){document.documentElement.removeAttribute('data-theme');}
    else{document.documentElement.setAttribute('data-theme','light');}
  }catch(e){document.documentElement.setAttribute('data-theme','light');}
  try{
    var L=localStorage.getItem('gen_lang');
    if(L==='en'||L==='hi'){document.documentElement.setAttribute('lang',L);}
    else{document.documentElement.setAttribute('lang','en');}
  }catch(e){document.documentElement.setAttribute('lang','en');}
  window.genToggleTheme=function(){
    var dark=!document.documentElement.getAttribute('data-theme');
    if(dark){document.documentElement.removeAttribute('data-theme');try{localStorage.setItem('gen_theme','dark');}catch(e){}}
    else{document.documentElement.setAttribute('data-theme','light');try{localStorage.setItem('gen_theme','light');}catch(e){}}
    var b=document.getElementById('themeBtn'); if(b) b.textContent=dark?'☀️':'🌙';
  };
  window.genToggleLang=function(){
    var cur=document.documentElement.getAttribute('lang')||'en';
    var next=cur==='en'?'hi':'en';
    document.documentElement.setAttribute('lang',next);
    try{localStorage.setItem('gen_lang',next);}catch(e){}
    var b=document.getElementById('langBtn');
    if(b) b.textContent=next==='en'?'हिं':'EN';
    document.dispatchEvent(new CustomEvent('gen-lang',{detail:next}));
  };
  window.genLangLabel=function(hi,en){
    return (document.documentElement.getAttribute('lang')==='en'?en:hi);
  };

  function $(sel,root){return (root||document).querySelector(sel);}
  function $all(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));}

  /* —— countdown to UPPCS Prelims 2026-12-06 (official calendar) —— */
  function initCountdown(){
    var el=document.getElementById('prelimsCountdown');
    if(!el) return;
    var target=new Date('2026-12-06T09:30:00+05:30').getTime();
    function tick(){
      var now=Date.now(), d=Math.max(0,target-now);
      var days=Math.floor(d/86400000), hrs=Math.floor((d%86400000)/3600000), mins=Math.floor((d%3600000)/60000);
      var box=el.querySelector('.cd-nums');
      if(box) box.innerHTML=
        '<div class="cd-box"><b>'+days+'</b><small>दिन</small></div>'+
        '<div class="cd-box"><b>'+hrs+'</b><small>घंटे</small></div>'+
        '<div class="cd-box"><b>'+mins+'</b><small>मिनट</small></div>';
    }
    tick(); setInterval(tick,30000);
  }

  /* —— syllabus progress —— */
  function initProgress(){
    var wrap=document.getElementById('syllabusProgress');
    if(!wrap) return;
    var key=wrap.getAttribute('data-key')||location.pathname;
    var items=$all('input[type=checkbox]',wrap);
    var store={};
    try{store=JSON.parse(localStorage.getItem('gen_syll_prog')||'{}')||{};}catch(e){}
    if(!store[key]) store[key]={};
    function render(){
      var done=0;
      items.forEach(function(cb){
        var id=cb.getAttribute('data-id');
        cb.checked=!!store[key][id];
        cb.parentElement.classList.toggle('done',cb.checked);
        if(cb.checked) done++;
      });
      var pct=items.length?Math.round(100*done/items.length):0;
      var bar=wrap.querySelector('.prog-bar>i');
      var lab=wrap.querySelector('[data-pct]');
      if(bar) bar.style.width=pct+'%';
      if(lab) lab.textContent=pct+'% · '+done+'/'+items.length;
    }
    items.forEach(function(cb){
      cb.addEventListener('change',function(){
        store[key][cb.getAttribute('data-id')]=cb.checked;
        try{localStorage.setItem('gen_syll_prog',JSON.stringify(store));}catch(e){}
        render();
      });
    });
    var reset=wrap.querySelector('[data-reset]');
    if(reset) reset.addEventListener('click',function(){
      store[key]={};
      try{localStorage.setItem('gen_syll_prog',JSON.stringify(store));}catch(e){}
      render();
    });
    render();
  }

  /* —— daily quiz —— */
  function daySeed(d){
    // YYYYMMDD integer seed
    return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
  }
  function mulberry32(a){return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  function pickDaily(bank,n,seed){
    var rng=mulberry32(seed), arr=bank.slice(), i,j,t;
    for(i=arr.length-1;i>0;i--){j=Math.floor(rng()*(i+1));t=arr[i];arr[i]=arr[j];arr[j]=t;}
    return arr.slice(0,n);
  }
  function initDaily(){
    var root=document.getElementById('dailyQuiz');
    if(!root) return;
    var dateLab=document.getElementById('dailyDate');
    var now=new Date();
    var label=now.toLocaleDateString('hi-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    if(dateLab) dateLab.textContent=label;
    function paint(qs){
      root.innerHTML=qs.map(function(q,i){
        var opts=q.opts.map(function(o,j){
          return '<label><input type="radio" name="dq'+i+'"> '+o+'</label>';
        }).join('');
        var wrongs=(q.whyWrong||[]).map(function(w){return '<li>'+w+'</li>';}).join('');
        var topic=q.topicUrl?('<p style="margin-top:8px"><a class="btn btn-ghost" href="'+q.topicUrl+'">संबंधित विषय / Related →</a></p>'):'';
        var qtext=(document.documentElement.getAttribute('lang')==='en'&&q.q_en)?q.q_en:q.q;
        var why=(document.documentElement.getAttribute('lang')==='en'&&q.why_en)?q.why_en:(q.why||'');
        return '<div class="daily-q mcq"><div class="meta">'+(q.tag||'CSAT/GS')+' · Q'+(i+1)+'</div><div class="q">'+qtext+'</div>'+opts+
          '<button type="button" class="btn btn-ghost" data-reveal style="margin-top:8px">उत्तर देखें / Answer</button>'+
          '<div class="reveal"><strong>उत्तर / Answer: '+q.ans+'</strong><br>'+why+
          (wrongs?'<ul class="wrong-why">'+wrongs+'</ul>':'')+topic+'</div></div>';
      }).join('');
      $all('.mcq [data-reveal]',root).forEach(function(btn){
        btn.addEventListener('click',function(){btn.closest('.mcq').classList.toggle('open');});
      });
    }
    fetch('/daily/bank.json').then(function(r){return r.json();}).then(function(bank){
      var qs=pickDaily(bank,5,daySeed(now));
      paint(qs);
      document.addEventListener('gen-lang',function(){paint(qs);});
      var share=document.getElementById('tgShare');
      if(share){
        share.href='https://t.me/share/url?url='+encodeURIComponent('https://genclasses.com/daily/')+'&text='+encodeURIComponent('GenClasses Daily 5 — '+label);
      }
    }).catch(function(){root.innerHTML='<p>प्रश्न बैंक लोड नहीं हो सका। / Could not load question bank.</p>';});
  }

  /* —— flashcards —— */
  function initFlash(){
    var stage=document.getElementById('flashStage');
    if(!stage) return;
    var deckSel=document.getElementById('flashDeck');
    var cardEl=document.getElementById('flashCard');
    var stats=document.getElementById('flashStats');
    var store={};
    try{store=JSON.parse(localStorage.getItem('gen_flash')||'{}')||{};}catch(e){}
    var deck=[], idx=0, known=store.known||{}, unknown=store.unknown||{};
    function save(){try{localStorage.setItem('gen_flash',JSON.stringify({known:known,unknown:unknown}));}catch(e){}}
    function showStats(){
      if(!stats) return;
      var k=Object.keys(known).length, u=Object.keys(unknown).length;
      stats.textContent='ज्ञात: '+k+' · अज्ञात: '+u+' · कार्ड: '+(idx+1)+'/'+(deck.length||0);
    }
    function render(){
      if(!deck.length){cardEl.innerHTML='<div class="front">इस डेक में कार्ड नहीं</div>';return;}
      if(idx>=deck.length) idx=0;
      var c=deck[idx];
      cardEl.className='flash-card';
      var en=(document.documentElement.getAttribute('lang')==='en');
      var fr=en&&c.front_en?c.front_en:c.front;
      var bk=en&&c.back_en?c.back_en:c.back;
      cardEl.innerHTML='<div class="deck">'+(c.deck||'')+'</div><div class="front">'+fr+'</div><div class="back">'+bk+'</div>';
      showStats();
    }
    function loadDeck(name){
      fetch('/flashcards/decks.json').then(function(r){return r.json();}).then(function(all){
        deck=(all||[]).filter(function(c){return !name||name==='all'||c.deck===name;});
        idx=0; render();
      });
    }
    cardEl.addEventListener('click',function(){cardEl.classList.toggle('show-back');});
    var startX=0;
    cardEl.addEventListener('touchstart',function(e){startX=e.changedTouches[0].screenX;},{passive:true});
    cardEl.addEventListener('touchend',function(e){
      var dx=e.changedTouches[0].screenX-startX;
      if(Math.abs(dx)<60) return;
      if(dx<0) mark('unknown'); else mark('known');
    },{passive:true});
    function mark(kind){
      if(!deck[idx]) return;
      var id=deck[idx].id;
      if(kind==='known'){known[id]=1; delete unknown[id]; cardEl.classList.add('swipe-right');}
      else{unknown[id]=1; delete known[id]; cardEl.classList.add('swipe-left');}
      save();
      setTimeout(function(){idx=(idx+1)%deck.length; render();},280);
    }
    var btnK=document.getElementById('flashKnown');
    var btnU=document.getElementById('flashUnknown');
    var btnN=document.getElementById('flashNext');
    var btnP=document.getElementById('flashPrev');
    if(btnK) btnK.onclick=function(){mark('known');};
    if(btnU) btnU.onclick=function(){mark('unknown');};
    if(btnN) btnN.onclick=function(){idx=(idx+1)%deck.length; render();};
    if(btnP) btnP.onclick=function(){idx=(idx-1+deck.length)%deck.length; render();};
    if(deckSel) deckSel.addEventListener('change',function(){loadDeck(deckSel.value);});
    var reset=document.getElementById('flashReset');
    if(reset) reset.onclick=function(){known={};unknown={};save();showStats();};
    document.addEventListener('gen-lang',function(){render();});
    loadDeck(deckSel?deckSel.value:'all');
  }

  document.addEventListener('DOMContentLoaded',function(){
    var b=document.getElementById('themeBtn');
    if(b){b.textContent=document.documentElement.getAttribute('data-theme')==='light'?'🌙':'☀️'; b.onclick=genToggleTheme;}
    var lb=document.getElementById('langBtn');
    if(lb){lb.textContent=(document.documentElement.getAttribute('lang')==='en')?'हिं':'EN'; lb.onclick=genToggleLang;}
    $all('.mcq').forEach(function(box){
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
    initCountdown();
    initProgress();
    initDaily();
    initFlash();
  });
})();
