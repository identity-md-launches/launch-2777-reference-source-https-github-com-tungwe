import test from 'node:test';
import assert from 'node:assert/strict';
import {Pet} from './dist/pet-engine.mjs';
import {Companion} from './dist/companion-engine.mjs';
import {PET_KEY} from './dist/browser-storage.mjs';
import {savedCommand} from './dist/session-store.mjs';
import {advanceGrowth,MAX_AWAY_MS,GROWTH_STAGES} from './dist/growth-clock.mjs';
import {PetGesture,gestureKey} from './dist/presence.mjs';
import {visualState} from './dist/visual-state.mjs';
const HOUR=3600000,DAY=24*HOUR;
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
test('idle time, repeated snapshots and split settlements give exactly the same growth',()=>{
 let now=100000;const idle=new Pet({clock:()=>now}),active=new Pet({clock:()=>now});
 for(let i=0;i<123;i++){now+=1789;active.save(active.data);idle.snapshot();idle.snapshot();}
 assert.equal(idle.snapshot().xp,3);assert.equal(active.snapshot().xp,3);assert.equal(idle.data.xp,0);
 assert.equal(advanceGrowth(idle.data,now).growth.remainderMs,active.data.growth.remainderMs);
 now+=DAY;assert.equal(idle.snapshot().stage,'young');
});
test('no interaction or completed wish can accelerate the growth clock',()=>{
 let now=100000;const c=new Companion(()=>now);c.command('grow');
 for(let i=0;i<20;i++){c.command('cuddle');c.command('brush');c.command('touch',{zone:'head'});now+=1000;}
 assert.equal(c.pet.snapshot().xp,0);c.command('feed',{food:'seed'});now+=5000;c.command('ball');
 assert.equal(c.pet.snapshot().life.claimed,true);assert.equal(c.pet.snapshot().xp,0);
 c.command('hunt-start');const cup=c.pet.snapshot().hunt.answer;now+=3500;c.command('hunt-pick',{cup});c.command('hunt-close');
 c.command('play-start');const seq=c.pet.snapshot().game.sequence;now+=4200;seq.forEach(pad=>c.command('play-tap',{pad}));
 assert.equal(c.pet.snapshot().xp,0);now=160000;assert.equal(c.pet.snapshot().xp,1);
});
test('each absence caps at seven days, and capped time cannot be repeatedly claimed',()=>{
 store.clear();let now=100000;const p=new Pet({clock:()=>now,file:PET_KEY});p.save(p.data);now+=90*DAY;
 assert.equal(p.snapshot().xp,7*1440);p.save(p.data);const q=new Pet({clock:()=>now,file:PET_KEY});
 assert.equal(q.snapshot().xp,7*1440);q.save(q.data);assert.equal(q.snapshot().xp,7*1440);
 now+=60000;assert.equal(q.snapshot().xp,7*1440+1);assert.equal(MAX_AWAY_MS,7*DAY);
});
test('sleep, background time and hunger do not stop growth; hunger takes hours',()=>{
 let now=100000;const p=new Pet({clock:()=>now});p.interact('nap');now+=6*HOUR;
 assert.equal(p.snapshot().xp,360);assert.equal(p.snapshot().fullness,11);assert.equal(p.snapshot().life.sleeping,true);
 now+=DAY;assert.equal(p.snapshot().stage,'young');assert.equal(p.snapshot().fullness,0);
});
test('legacy migration preserves every stage, within-stage fraction, accessories and memories',()=>{
 for(const [old,expected] of [[0,0],[15,720],[29,1392],[30,1440],[45,2880],[60,4320],[80,7200],[100,10080],[120,12768],[249,30105],[250,30240],[999,30240]]){
  store.clear();const base=new Pet({clock:()=>100000}).data;delete base.growth;
  store.set(PET_KEY,JSON.stringify({...base,xp:old,updatedAt:1,accessory:old>=100?'flower':'none',life:{memories:['snack'],bond:17}}));
  const p=new Pet({clock:()=>999999999,file:PET_KEY});assert.equal(p.snapshot().xp,expected);p.save(p.data);
  const q=new Pet({clock:()=>999999999,file:PET_KEY});assert.equal(q.snapshot().xp,expected);assert.equal(q.snapshot().life.bond,17);assert.deepEqual(q.snapshot().life.memories,['snack']);assert.equal(q.snapshot().accessory,old>=100?'flower':'none');
 }
});
test('clock rollback never duplicates time and invalid growth saves are preserved',()=>{
 let now=100000;const p=new Pet({clock:()=>now});now+=HOUR;p.save(p.data);const watermark=p.data.growth.settledAt;
 now-=HOUR;p.save(p.data);assert.equal(p.snapshot().xp,60);assert.equal(p.data.growth.settledAt,watermark);
 now=watermark+60000;assert.equal(p.snapshot().xp,61);
 store.clear();const corrupt=JSON.stringify({...p.data,growth:{version:2,settledAt:0,remainderMs:-1}});store.set(PET_KEY,corrupt);
 assert.throws(()=>new Pet({clock:()=>now,file:PET_KEY}),/Invalid growth/);assert.equal(store.get(PET_KEY),corrupt);
});
test('two stale tabs settle the same elapsed time once inside the existing save lock',async()=>{
 store.clear();let now=100000;const make=()=>{const c=new Companion(()=>now);c.pet=new Pet({clock:()=>now,file:PET_KEY});return c;};
 let queue=Promise.resolve();const locks={request(name,opts,fn){const job=queue.then(fn);queue=job.catch(()=>{});return job;}};
 const a=make(),b=make();await Promise.all([savedCommand(a,'grow',{}, {locks}),savedCommand(b,'grow',{}, {locks})]);now+=3*HOUR;
 await Promise.all([savedCommand(a,'grow',{}, {locks}),savedCommand(b,'cuddle',{}, {locks})]);
 const final=new Pet({clock:()=>now,file:PET_KEY});assert.equal(final.snapshot().xp,180);assert.equal(final.snapshot().life.bond,4);
});
test('failed idle settlement is retryable without overwriting or double counting',()=>{
 store.clear();let now=100000;const p=new Pet({clock:()=>now,file:PET_KEY});p.save(p.data);const before=store.get(PET_KEY);now+=HOUR;
 const write=localStorage.setItem;localStorage.setItem=()=>{throw Error('Quota');};try{assert.throws(()=>p.save(p.data));assert.equal(store.get(PET_KEY),before);assert.equal(p.data.xp,0);}finally{localStorage.setItem=write;}
 p.save(p.data);assert.equal(p.data.xp,60);p.save(p.data);assert.equal(p.data.xp,60);
});
test('new pets reach milestones at one, three, seven and twenty-one cumulative days',()=>{
 let now=100000;const c=new Companion(()=>now);c.command('grow');for(let d=1;d<=21;d++){now+=DAY;c.command('grow');const target=GROWTH_STAGES.findLast(s=>d*1440>=s.xp);assert.equal(c.pet.snapshot().stage,target.id);}
 assert.equal(c.events.filter(e=>e.type==='evolved').length,4);assert.equal(c.pet.snapshot().xp,30240);
});
test('pet mode ignores background and shift; turn mode never releases a touch or hold',()=>{
 const g=new PetGesture(),start={id:1,x:10,y:10,at:0};assert.equal(g.begin({...start,zone:null,turn:false}),false);
 g.begin({...start,zone:'head',turn:false});assert.equal(g.move({id:1,x:50,y:10}).turn,false);assert.equal(g.end({id:1,x:50,y:10,at:500}).gesture,'stroke');
 for(const zone of ['head',null]){assert.equal(g.begin({...start,zone,turn:true}),true);assert.equal(g.move({id:1,x:50,y:10}).turn,true);assert.equal(g.end({id:1,x:50,y:10,at:900}),null);}
});
test('keyboard and animation mode use the same strict separation',()=>{
 assert.equal(gestureKey('ArrowRight',false),null);assert.equal(gestureKey('Enter',true),null);assert.equal(gestureKey('H',true),null);
 assert.deepEqual(gestureKey('ArrowLeft',true),{yawDelta:-.2});assert.deepEqual(gestureKey('6',false),{zone:'feet',gesture:'tap'});
 const state={pet:{life:{}},cue:{type:'nuzzle',at:100000}};const v=visualState(state,100100,{turning:true,contact:true,attention:true});assert.equal(v.mode,'turning');assert.equal(v.reaction,null);assert.equal(v.contact,false);assert.equal(v.idleBlocked,true);
 state.cue={type:'eat',at:100000};assert.equal(visualState(state,100100,{turning:true}).mode,'eating');
});
