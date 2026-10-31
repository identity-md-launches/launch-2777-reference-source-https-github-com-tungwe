import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Companion} from './dist/companion-engine.mjs';
import {Pet} from './dist/pet-engine.mjs';
import {PET_KEY} from './dist/browser-storage.mjs';
import {savedCommand,refreshPet} from './dist/session-store.mjs';
import {bindPageLifecycle} from './dist/page-lifecycle.mjs';
import {visualState,presenceText} from './dist/visual-state.mjs';
import {morphOffsets,deformPoint} from './dist/deformation.mjs';
import {eatingPose,MOUTH_HEIGHT} from './dist/feeding.mjs';
import {GROWTH_MODELS} from './dist/growth-models.mjs';
const data=new Map();
globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};
function lockQueue(){let tail=Promise.resolve();return {request(name,opts,fn){assert.equal(name,PET_KEY+'-write');assert.equal(opts.mode,'exclusive');const p=tail.then(fn);tail=p.catch(()=>{});return p;}};}
function companion(clock){const c=new Companion(clock);c.pet=new Pet({clock,file:PET_KEY});return c;}

test('stale tabs serialize refresh+write; rewards and daily bonus are never lost or doubled',async()=>{
 data.clear();let now=100000;const a=companion(()=>now),b=companion(()=>now),locks=lockQueue();
 await savedCommand(a,'feed',{food:'carrot'},{locks});now+=4100;
 await Promise.all([savedCommand(b,'cuddle',{}, {locks}),savedCommand(a,'ball',{}, {locks}),savedCommand(b,'ball',{}, {locks})]);
 const p=new Pet({clock:()=>now,file:PET_KEY}).snapshot();assert.equal(p.xp,0);assert.equal(p.meals,1);assert.equal(p.life.claimed,true);assert.equal(p.revision,3);
});
test('lock failure and unavailable locks do not create pretend saved progress',async()=>{
 data.clear();const c=companion(()=>100000);await assert.rejects(savedCommand(c,'feed',{food:'seed'},{locks:null}),/unavailable/);assert.equal(c.pet.data.xp,0);assert.equal(data.size,0);
 await assert.rejects(savedCommand(c,'feed',{food:'seed'},{locks:{request(){return Promise.reject(Error('lock denied'));}}}),/denied/);assert.equal(data.size,0);
});
test('corrupted reload and quota failures preserve prior save and reject the command',async()=>{
 data.clear();const c=companion(()=>100000),locks=lockQueue();await savedCommand(c,'cuddle',{}, {locks});const before=data.get(PET_KEY);
 const write=localStorage.setItem;localStorage.setItem=()=>{throw Error('quota');};try{await assert.rejects(savedCommand(c,'settings',{name:'Mochi',scene:'focus',message:'Hello'}, {locks}),/quota/);assert.equal(c.name,'Pip');assert.equal(c.pet.data.xp,0);}finally{localStorage.setItem=write;}
 assert.equal(data.get(PET_KEY),before);data.set(PET_KEY,'{broken');await assert.rejects(savedCommand(c,'brush',{}, {locks}));assert.equal(data.get(PET_KEY),'{broken');
});
test('profile persists with old v1 saves; unrelated care in another tab preserves it',async()=>{
 data.clear();const locks=lockQueue(),a=companion(()=>100000),b=companion(()=>100000);
 await savedCommand(a,'settings',{name:' Mochi ',scene:'focus',message:'Seeds please'}, {locks});await savedCommand(b,'cuddle',{}, {locks});const fresh=companion(()=>100000);
 assert.equal(fresh.name,'Mochi');assert.equal(fresh.scene,'focus');assert.equal(fresh.message,'Seeds please');assert.equal(fresh.pet.data.xp,0);assert.equal(fresh.pet.data.version,1);
});
test('sleep and games block unrelated cues and food; meal state is shared across tabs',async()=>{
 data.clear();let now=100000;const a=companion(()=>now),b=companion(()=>now),locks=lockQueue();
 await savedCommand(a,'nap',{}, {locks});for(const action of ['cheer','cue'])await assert.rejects(savedCommand(b,action,{type:'wave'}, {locks}),/Sleeping/);
 await savedCommand(a,'wake',{}, {locks});await savedCommand(a,'feed',{food:'seed'},{locks});refreshPet(b);assert.equal(b.snapshot().cue.type,'eat');await assert.rejects(savedCommand(b,'cuddle',{}, {locks}),/Eating/);
 now+=5000;await savedCommand(a,'hunt-start',{}, {locks});assert.throws(()=>a.command('feed',{food:'carrot'}),/Finish game/);assert.throws(()=>a.command('cue',{type:'wave'}),/Finish game/);
});
test('repeated rewarded-cooldown contact still refreshes session chat context without a save',()=>{
 let now=100000;const c=new Companion(()=>now);c.command('cuddle');const rev=c.pet.data.revision,xp=c.pet.data.xp;now+=1000;c.command('cuddle');assert.equal(c.pet.data.revision,rev);assert.equal(c.pet.data.xp,xp);assert.deepEqual(c.snapshot().lastInteraction,{type:'cuddle',at:now});
 c.command('feed',{food:'seed'});const previous=c.lastInteraction;now+=500;c.command('touch',{zone:'head'});assert.equal(c.lastInteraction,previous);
});
test('one visual priority determines animation and status, including an off-body drag',()=>{
 const state={pet:{life:{sleeping:false}},cue:{type:'wave',at:1000}};
 assert.equal(visualState(state,1500,{contact:true}).mode,'contact');
 assert.equal(visualState(state,6000,{contact:false,attention:true}).mode,'attention');assert.equal(visualState(state,6000,{attention:true}).idleBlocked,true);
 const asleep={...state,pet:{life:{sleeping:true}}};assert.equal(visualState(asleep,1500,{contact:true,food:true,attention:true}).reaction,null);assert.equal(visualState(asleep,1500).mode,'sleeping');
 assert.equal(presenceText('attention',true),'好奇地看著你');assert.notEqual(presenceText('attention'),presenceText('contact'));
 assert.equal(visualState(state,6000,{reduced:true}).idleBlocked,true);
});
test('reduced eating pose stays completely static throughout the bite',()=>{
 const pose=eatingPose(.1,true);for(let a=.1;a<4;a+=.07)assert.deepEqual(eatingPose(a,true),pose);
 for(const key of ['head','jaw','paw','nibble'])assert.equal(pose[key],0);assert.equal(eatingPose(4,true).food,0);
});
test('BFCache cycles pause/resume once, final disposal is once and never resurrects',()=>{
 const target=new EventTarget(),calls=[];const dispose=bindPageLifecycle({pause:()=>calls.push('pause'),resume:()=>calls.push('resume'),destroy:()=>calls.push('destroy')},target);
 function event(type,persisted){const e=new Event(type);Object.defineProperty(e,'persisted',{value:persisted});target.dispatchEvent(e);}
 event('pageshow',false);for(let i=0;i<3;i++){event('pagehide',true);event('pagehide',true);event('pageshow',true);event('pageshow',true);}
 event('pagehide',false);event('pageshow',true);dispose();assert.deepEqual(calls,['pause','resume','pause','resume','pause','resume','destroy']);
});
test('all five actual GLBs: combined offsets are finite and grounded; socket follows the same morphs',()=>{
 for(const [stage,spec] of Object.entries(GROWTH_MODELS)){
  const b=readFileSync('dist'+spec.url),len=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+len)),bin=20+len+8;
  for(const mesh of g.meshes)for(const primitive of mesh.primitives){const a=g.accessors[primitive.attributes.POSITION],view=g.bufferViews[a.bufferView],stride=view.byteStride||12,offset=bin+(view.byteOffset||0)+(a.byteOffset||0),xyz=[];let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   for(let i=0;i<a.count;i++){const p=[0,1,2].map(k=>b.readFloatLE(offset+i*stride+k*4));xyz.push(p);p.forEach((n,k)=>{min[k]=Math.min(min[k],n);max[k]=Math.max(max[k],n);});}
   const f=spec.height/(max[1]-min[1]),d={width:(max[0]-min[0])*f,height:spec.height,depth:(max[2]-min[2])*f,mouth:MOUTH_HEIGHT[stage],stage};
   const weights=[.5,.6,1.2,.6,.8,.72,.5,.65,.8,1],out=new Float64Array(3),scratch=new Float64Array(30);
   for(const p of xyz){const x=(p[0]-(max[0]+min[0])/2)*f,y=(p[1]-min[1])*f,z=(p[2]-(max[2]+min[2])/2)*f;deformPoint(x,y,z,d,weights,out,scratch);assert.ok([...out].every(Number.isFinite));assert.ok(Math.hypot(out[0]-x,out[1]-y,out[2]-z)<spec.height*.25);if(y/spec.height<.02)assert.ok(Math.hypot(out[0]-x,out[1]-y,out[2]-z)<.005);}
   const base=[0,d.height*d.mouth,d.depth*.5],point=deformPoint(...base,d,weights),offsets=morphOffsets(...base,d);assert.ok(Math.hypot(...point.map((v,k)=>v-base[k]))>.0001);for(let k=0;k<3;k++)assert.ok(Math.abs(point[k]-base[k]-weights.reduce((n,w,i)=>n+w*offsets[i*3+k],0))<1e-9);
  }
 }
});

test('starting memory play reserves its cooldown across tabs before the first tap',async()=>{
 data.clear();const locks=lockQueue(),a=companion(()=>100000),b=companion(()=>100000);
 await savedCommand(a,'play-start',{}, {locks});await assert.rejects(savedCommand(b,'play-start',{}, {locks}),/unavailable/);assert.equal(a.pet.game.phase,'playing');assert.equal(b.pet.game,null);
});
