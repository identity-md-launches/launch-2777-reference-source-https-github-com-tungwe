import test from 'node:test';
import assert from 'node:assert/strict';
import {startPublicSession} from './dist/public-runtime.mjs';
import {PET_KEY} from './dist/browser-storage.mjs';

test('public session restores timers/channel/save after repeated page-cache cycles without duplication',async()=>{
 const target=new EventTarget(),store=new Map(),timers=new Map(),channels=new Set();let serial=0,last;
 const saved=Object.fromEntries(['addEventListener','removeEventListener','setInterval','clearInterval','BroadcastChannel','fetch','localStorage','navigator'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const replace=(k,v)=>Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});
 try{
  replace('addEventListener',target.addEventListener.bind(target));replace('removeEventListener',target.removeEventListener.bind(target));
  replace('setInterval',fn=>{timers.set(++serial,fn);return serial;});replace('clearInterval',id=>timers.delete(id));
  replace('BroadcastChannel',class{constructor(){channels.add(this);}postMessage(){}close(){channels.delete(this);}});
  replace('fetch',async()=>({ok:true,headers:new Headers(),json:async()=>({schemaVersion:1,measurement:null,builder:{}})}));
  replace('localStorage',{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)});
  let queue=Promise.resolve();replace('navigator',{locks:{request(name,mode,fn){const p=queue.then(fn);queue=p.catch(()=>{});return p;}}});
  const session=startPublicSession({overlay:false,onState:s=>last=s});await new Promise(resolve=>setImmediate(resolve));
  assert.equal(timers.size,1);assert.equal(channels.size,1);assert.equal(last.saving,true);
  await session.command('settings',{name:'Mochi',scene:'hangout',message:''});assert.equal(last.name,'Mochi');
  const event=(type,persisted)=>{const e=new Event(type);Object.defineProperty(e,'persisted',{value:persisted});target.dispatchEvent(e);};
  for(let i=0;i<3;i++){
   event('pagehide',true);assert.equal(timers.size,0);assert.equal(channels.size,0);await assert.rejects(session.command('cuddle'),/paused/);
   const changed=JSON.parse(store.get(PET_KEY));changed.xp+=10;store.set(PET_KEY,JSON.stringify(changed));
   event('pageshow',true);event('pageshow',true);assert.equal(timers.size,1);assert.equal(channels.size,1);assert.equal(last.pet.xp,(i+1)*10);
  }
  event('pagehide',false);session.dispose();assert.equal(timers.size,0);assert.equal(channels.size,0);event('pageshow',true);assert.equal(timers.size,0);await assert.rejects(session.command('cuddle'),/paused/);
 }finally{for(const [k,d]of Object.entries(saved)){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
