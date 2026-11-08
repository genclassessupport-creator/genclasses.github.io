// Run from the repository root: node tools/pyq-content-audit.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const dir='tests/uppcs-prelims-pyq',excluded=require('../content/uppcs-prelims-pyq-exclusions.json');
const manifest=JSON.parse(fs.readFileSync(dir+'/manifest.json','utf8'));
let total=0,reviewed=0,matching=0,scripts=0;const years={},sections={};
const parse=html=>JSON.parse(html.split(/\r?\n/).find(l=>l.startsWith('const TEST = ')).slice(13,-1));
for(const meta of manifest.tests){
 const html=fs.readFileSync(meta.path,'utf8'),t=parse(html),file=meta.path.split('/').pop(),ca=file.includes('current-affairs');
 for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/\bsrc\s*=|application\/ld\+json/.test(match[1]))continue;new vm.Script(match[2],{filename:meta.path});scripts++;}
 assert.equal(t.questions.length,meta.count,meta.path+' count');
 assert.equal(t.questions.filter(q=>!Number.isInteger(q.answer)||q.answer<0||q.answer>=4).length,meta.missing_answers);
 const context={GEN_LANG:'hi'};vm.createContext(context);vm.runInContext(html.slice(html.indexOf('function genEsc'),html.indexOf('const QUESTIONS')),context);
 const ids=new Set();let unscored=0;
 for(const q of t.questions){
  total++;if(!ca)reviewed++;assert(!ids.has(q.id));ids.add(q.id);assert(!excluded[file+':'+q.id]);assert.equal(q.options.length,4);
  for(const lang of ['hi','en']){
   assert(q['question_'+lang]?.trim(),file+':'+q.id+' missing question '+lang);
   assert(q['explanation_'+lang]?.trim(),file+':'+q.id+' missing explanation '+lang);
   const opts=q.options.map(o=>o[lang]?.trim());assert(opts.every(Boolean),file+':'+q.id+' empty option '+lang);
   if(!ca){const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/[\s–—−]+/g,' ').trim();assert.equal(new Set(opts.map(normalize)).size,4,file+':'+q.id+' duplicate options '+lang);assert(!/कूट\s*[:：]?\s*(?:a|ए|A)[\s.,–—-]*(?:b|बी|B)/i.test(opts.join(' ')),file+':'+q.id+' leaked code header');}
   if(q.matching){const m=q.matching[lang];assert.equal(m.left.length,4);assert.equal(m.right.length,4);assert([...m.left,...m.right].every(v=>typeof v==='string'&&v.trim()));context.GEN_LANG=lang;const output=context.genFmt(q['question_'+lang],m);assert.equal((output.match(/class="mi"/g)||[]).length,8,file+':'+q.id+' matching cells');assert(output.includes('match-pair'));}
  }
  if(q.matching)matching++;
  if(!Number.isInteger(q.answer)||q.answer<0||q.answer>=4)unscored++;
  if(!ca)assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,file+':'+q.id+' doubtful question retained');
  if(q.year)years[q.year]=(years[q.year]||0)+1;
 }
 sections[meta.section]=(sections[meta.section]||0)+t.questions.length;
 if(ca){const head=cp.execFileSync('git',['show',(process.env.PYQ_AUDIT_BASE||'52b4357')+':'+meta.path],{encoding:'utf8',maxBuffer:8e6});assert.deepEqual(t,parse(head),'Current Affairs content must remain unchanged');}
 assert(html.includes('genFmt(_en, q.matching && q.matching.en)'),'Bilingual matching missing');
}
assert.equal(total,manifest.total);assert.equal(total+Object.keys(excluded).length,1200);assert.equal(total-reviewed,146);assert.deepEqual(years,manifest.years);for(const section of manifest.sections)assert.equal(sections[section.id],section.count);
assert.equal(fs.readFileSync(dir+'/manifest.json','utf8'),fs.readFileSync('uppcs-prelims-pyq/tests.json','utf8'));
// Exercise the real result function, including previously mishandled excluded questions.
const template=fs.readFileSync('assets/test-template.html','utf8');const calc=template.slice(template.indexOf('function calculateResult(auto){'),template.indexOf('function renderReview(){'));
for(const fixture of [
 {questions:[{answer:0,options:[1,2,3,4]},{answer:null,options:[1,2,3,4]}],answers:[0,0],expected:{score:2,maxMarks:2,percent:100,skipped:0,excluded:1}},
 {questions:[{answer:0,options:[1,2,3,4]},{answer:null,options:[1,2,3,4]}],answers:[1,null],expected:{score:-0.66,maxMarks:2,percent:0,wrong:1,skipped:0}},
 {questions:[{answer:0,options:[1,2,3,4]}],answers:[null],expected:{score:0,maxMarks:2,skipped:1,accuracy:0}},
 {questions:[{answer:null,options:[1,2,3,4]}],answers:[null],expected:{score:0,maxMarks:0,percent:0,skipped:0}}
]){const nodes={};const c={QUESTIONS:fixture.questions,answers:fixture.answers,MARKS:2,NEG:.66,timerId:null,testActive:true,PROG_KEY:'x',startedAt:0,TOTAL_TIME_SECONDS:60,remaining:40,TEST:{},studentName:'Check',storeDel(){},hasAnswerKey(q){return Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length},el(id){return nodes[id]||=( {style:{setProperty(){}}})},escapeHTML:s=>s,formatTime:String,numClean:String,renderReview(){},saveAttemptAndLoadRank(){},window:{scrollTo(){}}};vm.createContext(c);vm.runInContext(calc+'\ncalculateResult(false);',c);for(const [key,value] of Object.entries(fixture.expected))assert.equal(c.lastResult[key],value,'scoring '+key);}
const result={total,nonCurrent:reviewed,currentAffairs:146,removed:Object.keys(excluded).length,matchingQuestions:matching,compiledScripts:scripts,scoringFixtures:4};console.log(JSON.stringify(result,null,2));
