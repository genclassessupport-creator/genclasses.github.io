(function(){var el=document.getElementById('pdfStrip');if(!el)return;
fetch('/downloads/pdfs.json?v='+Math.floor(Date.now()/36e5)).then(function(r){return r.json()}).then(function(L){
 function item(p){return '<a class="ps-item" href="/downloads/#pdf-'+p.id+'"><img src="/downloads/covers/'+p.file+'.webp" alt="'+p.en+'" loading="lazy"><span class="ps-chip"><span data-en>'+p.en+'</span><span data-hi>'+p.hi+'</span></span></a>';}
 var h=L.map(item).join(''),tr=el.querySelector('.ps-track');
 if(L.length>=5){tr.innerHTML=h+h;tr.classList.add('ps-anim');}else tr.innerHTML=h;
}).catch(function(){el.style.display='none'});})();
