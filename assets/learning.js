(()=>{'use strict';
 const en=()=>document.documentElement.lang==='en';
 const L=(hi,english)=>en()?english:hi;
 const read=key=>{try{const v=JSON.parse(localStorage.getItem(key)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}};
 const save=(key,v)=>{try{localStorage.setItem(key,JSON.stringify(v));return true;}catch{return false;}};
 document.querySelectorAll('[data-quiz]').forEach(form=>{
  let checked=false;const result=form.querySelector('[data-result]');
  function grade(focus=false){let correct=0,answered=0;const fields=[...form.querySelectorAll('[data-answer]')];
   fields.forEach(field=>{const selected=field.querySelector('input:checked');const ok=selected&&selected.value===field.dataset.answer;answered+=!!selected;correct+=!!ok;
    const feedback=field.querySelector('.v-feedback');feedback.hidden=false;feedback.classList.toggle('wrong',!ok);
    field.querySelector('[data-verdict]').textContent=ok?L('✓ सही उत्तर','✓ Correct'):selected?L('↻ फिर समझें','↻ Review this idea'):L('○ उत्तर नहीं दिया','○ Not answered');
   });result.hidden=false;result.textContent=L(`परिणाम: ${correct}/${fields.length} सही · ${answered} उत्तर दिए। नीचे हर प्रश्न की व्याख्या पढ़ें।`,`Result: ${correct}/${fields.length} correct · ${answered} answered. Read the explanation beneath each question.`);if(focus)result.focus();
  }
  form.addEventListener('submit',e=>{e.preventDefault();checked=true;grade(true);});
  form.addEventListener('change',()=>{if(checked)grade();});
  form.addEventListener('reset',()=>{checked=false;result.hidden=true;form.querySelectorAll('.v-feedback').forEach(x=>x.hidden=true);});
  document.addEventListener('gen-lang',()=>{if(checked)grade();});
 });
 const done=read('gen_visual_lessons');
 document.querySelectorAll('[data-lesson-done]').forEach(cb=>{cb.checked=!!done[cb.dataset.lessonDone];cb.addEventListener('change',()=>{done[cb.dataset.lessonDone]=cb.checked;save('gen_visual_lessons',done);});});
 const search=document.getElementById('lessonSearch');const cards=[...document.querySelectorAll('[data-lesson-card]')];
 function library(){let count=0;const query=(search?.value||'').trim().toLocaleLowerCase();cards.forEach(card=>{card.hidden=!card.dataset.search.includes(query);if(!card.hidden)count++;});const empty=document.getElementById('lessonEmpty');if(empty)empty.hidden=count>0;const p=document.getElementById('lessonProgress');if(p){const n=cards.filter(x=>done[x.dataset.lessonCard]).length;p.textContent=L(`${cards.length} पाठ · ${n} पढ़े गए · प्रगति इसी ब्राउज़र में`,`${cards.length} lessons · ${n} marked read · saved in this browser`);}}
 if(search)search.addEventListener('input',library);document.addEventListener('gen-lang',library);library();
})();
