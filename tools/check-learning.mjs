import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
import {lessons} from '../content/foundations.mjs';import {tests} from '../content/practice.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root);
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name).replaceAll('\\','/')]);
const files=[...walk('tests'),...walk('notes')].filter(p=>/^tests\/.+\.html?$/.test(p)||/^notes\/.+\.(html?|pdf)$/.test(p)).sort();
fs.writeFileSync('files.json',JSON.stringify(files)+'\n');
assert.equal(lessons.length,12);assert.equal(tests.length,6);
for(const t of tests){assert.equal(t.questions.length,10,t.id);assert.ok(files.includes(t.path));}
for(const [i,q] of [...lessons.flatMap(x=>x.practice),...tests.flatMap(x=>x.questions)].entries()){assert.equal(q.options.length,4,`Question ${i}`);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);for(const pair of [q.prompt,q.explanation,...q.options])assert.ok(pair.length===2&&pair.every(s=>typeof s==='string'&&s.trim()),`Missing translation ${i}`);}
const cards=JSON.parse(fs.readFileSync('flashcards/decks.json'));assert.equal(cards.length,new Set(cards.map(c=>c.id)).size);assert.ok(cards.every(c=>c.front&&c.front_en&&c.back&&c.back_en));assert.ok(!cards.find(c=>c.id==='c010').back.includes('?'));
const paths=['index.html','learn/index.html','flashcards/index.html',...walk('syllabus').filter(p=>p.endsWith('.html')),...lessons.map(d=>`notes/${d.id}.html`),...tests.map(t=>t.path)];
let links=0,scripts=0;
for(const p of paths){const html=fs.readFileSync(p,'utf8');assert.ok(!html.includes('undefined'),p+' undefined');const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,p+' duplicate id');for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(!m[1].includes('src=')&&!/ld\+json|application\/json/.test(m[1])){new vm.Script(m[2],{filename:p});scripts++;}}
 for(const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){let url=m[1];if(/^(https?:|mailto:|tel:|data:|#)/.test(url))continue;url=decodeURIComponent(url.split(/[?#]/)[0]);let f=path.resolve(url.startsWith('/')?'.':path.dirname(p),'.'+(url.startsWith('/')?url:'/'+url));assert.ok(fs.existsSync(f),`${p}: missing ${url}`);links++;}}
for(const p of ['assets/learning.js','assets/hub.js','assets/syllabus-studio.js','assets/flashcard-studio.js'])new vm.Script(fs.readFileSync(p,'utf8'),{filename:p});
const roadmap=JSON.parse(fs.readFileSync('syllabus/roadmap.json'));for(const e of roadmap){assert.equal(e.topics.length,new Set(e.topics.map(t=>t.id)).size);for(const t of e.topics)for(const u of [t.learn,t.practice].filter(Boolean))assert.ok(fs.existsSync('.'+u.split('#')[0]),u);}
console.log(`PASS: ${paths.length} pages; ${links} internal links; ${scripts+4} script blocks; 12 lessons; 6 × 10-question sets; ${cards.length} flashcards; ${files.length} manifest entries.`);
