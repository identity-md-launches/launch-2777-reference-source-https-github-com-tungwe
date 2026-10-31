import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {Pet} from './dist/pet-engine.mjs';
import {PET_KEY} from './dist/browser-storage.mjs';
const data=new Map();
globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};
test('browser pet persists, reloads, rejects cooldown and awards memory game once',()=>{
 let now=100000;data.clear();let p=new Pet({clock:()=>now,file:PET_KEY});p.feed('carrot');assert.throws(()=>p.feed('seed'));
 p=new Pet({clock:()=>now,file:PET_KEY});assert.equal(p.snapshot().xp,0);p.interact('play-start');const sequence=p.snapshot().game.sequence;now+=4200;for(const pad of sequence)p.interact('play-tap',{pad});assert.equal(p.snapshot().xp,0);assert.throws(()=>p.interact('play-tap',{pad:0}));
});
test('failed browser writes do not award progress; visitors use separate storage',()=>{
 data.clear();let p=new Pet({file:PET_KEY});const old=localStorage.setItem;localStorage.setItem=()=>{throw Error('quota')};assert.throws(()=>p.feed('seed'));assert.equal(p.snapshot().xp,0);localStorage.setItem=old;
 p.feed('seed');data.clear();assert.equal(new Pet({file:PET_KEY}).snapshot().xp,0);
});
test('public code has no local chat API or owner paths and does not silently fake live data',()=>{
 const studio=readFileSync(new URL('./dist/studio.mjs',import.meta.url),'utf8');assert.doesNotMatch(studio,/\/api\/chat|\/api\/control|EventSource/);
 const runtime=readFileSync(new URL('./dist/public-runtime.mjs',import.meta.url),'utf8');assert.match(runtime,/engine.mode==='rehearsal'/);assert.match(runtime,/storage-warning/);
 const files=readdirSync(new URL('./dist/',import.meta.url),{recursive:true}).map(String);assert.ok(!files.some(f=>/\.local-state|TRIPO_SESSION|hosting\.json|local-chat\.mjs/.test(f)));
});
