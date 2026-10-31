import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';
import {PetGesture,Presence,organicOffsets,damp,ballPath} from './dist/presence.mjs';
import {MOUTH_HEIGHT} from './dist/feeding.mjs';import {GROWTH_MODELS} from './dist/growth-models.mjs';
import {Companion} from './dist/companion-engine.mjs';import {touchZone} from './dist/touch-reactions.mjs';
test('body strokes, stationary holds and background turns are distinct; release awards once',()=>{
 const g=new PetGesture();const down={id:1,x:100,y:100,zone:'head',at:0};g.begin(down);g.move({id:1,x:120,y:100});g.move({id:1,x:98,y:100});assert.deepEqual(g.end({id:1,x:101,y:100,at:400}),{zone:'head',gesture:'stroke'});assert.equal(g.end({id:1,x:101,y:100,at:410}),null);
 g.begin(down);assert.equal(g.end({id:1,x:102,y:100,at:700}).gesture,'hold');g.begin(down);assert.equal(g.end({id:1,x:100,y:100,at:100}).gesture,'tap');
 for(const extra of [{zone:null},{turn:true}]){g.begin({...down,...extra});g.move({id:1,x:180,y:100});assert.equal(g.end({id:1,x:180,y:100,at:700}),null);}
});
test('multi-pointer, cancelled contact and accidental quick swipe never become pet rewards',()=>{const g=new PetGesture();g.begin({id:1,x:0,y:0,zone:'head',at:0});assert.equal(g.begin({id:2}),false);assert.equal(g.move({id:2,x:100,y:0}),null);assert.equal(g.end({id:2,x:100,y:0,at:700}),null);g.cancel();assert.equal(g.end({id:1,x:0,y:0,at:700}),null);g.begin({id:1,x:0,y:0,zone:'head',at:0});assert.equal(g.end({id:1,x:80,y:0,at:70}),null);});
test('attention expires; sleep and reduced motion suppress active reflexes; blending is frame-rate independent',()=>{const p=new Presence(()=>.5);p.observe(4,-4,0);let v=p.tick(200,.016,{contact:true});assert.equal(v.headYaw,.72);assert.ok(v.lean>0);v=p.tick(3000,.016);assert.equal(v.headYaw,0);p.observe(1,1,4000);v=p.tick(4100,.016,{sleeping:true});assert.equal(v.headYaw,0);assert.equal(v.sniff,0);v=p.tick(4200,.016,{reduced:true,contact:true,food:true});for(const k of ['headYaw','headPitch','ear','breath','sniff','lean'])assert.equal(v[k],0);let a=0,b=0;for(let i=0;i<60;i++)a=damp(a,1,9,1/60);for(let i=0;i<30;i++)b=damp(b,1,9,1/30);assert.ok(Math.abs(a-b)<1e-9);});
test('real five GLB vertex sets remain finite, subtly deformed, and grounded',()=>{
 for(const [stage,spec] of Object.entries(GROWTH_MODELS)){
 const bytes=readFileSync('dist'+spec.url),len=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+len)),bin=20+len+8;
 for(const mesh of g.meshes)for(const primitive of mesh.primitives){const a=g.accessors[primitive.attributes.POSITION],view=g.bufferViews[a.bufferView],stride=view.byteStride||12,offset=bin+(view.byteOffset||0)+(a.byteOffset||0);const xyz=[];let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<a.count;i++){const p=[0,1,2].map(k=>bytes.readFloatLE(offset+i*stride+k*4));xyz.push(p);p.forEach((n,k)=>{min[k]=Math.min(min[k],n);max[k]=Math.max(max[k],n);});}
 const f=spec.height/(max[1]-min[1]),w=(max[0]-min[0])*f,d=(max[2]-min[2])*f;let maxOffset=0;
 for(const p of xyz){const x=(p[0]-(max[0]+min[0])/2)*f,y=(p[1]-min[1])*f,z=(p[2]-(max[2]+min[2])/2)*f;const offsets=organicOffsets(x,y,z,w,spec.height,d,MOUTH_HEIGHT[stage]);for(const v of offsets){assert.ok(v.every(Number.isFinite));maxOffset=Math.max(maxOffset,Math.hypot(...v));if(y/spec.height<.05)assert.ok(Math.hypot(...v)<1e-6,`${stage}: grounded feet`);}}
 assert.ok(maxOffset>0&&maxOffset<spec.height*.15,stage);
 assert.equal(touchZone(0,spec.height*(MOUTH_HEIGHT[stage]+.02),d*.4,w,spec.height,d,MOUTH_HEIGHT[stage]),'nose');
 }
 }
});
test('stroke care remains rate-limited and cannot interrupt a committed meal',()=>{let now=100000;const c=new Companion(()=>now);c.command('touch',{zone:'head',gesture:'stroke'});const xp=c.pet.snapshot().xp;now+=500;c.command('touch',{zone:'head',gesture:'stroke'});assert.equal(c.pet.snapshot().xp,xp);c.command('feed',{food:'seed'});const meal=c.pet.snapshot();now+=500;c.command('touch',{zone:'head',gesture:'stroke'});assert.equal(c.cue.type,'eat');assert.equal(c.pet.snapshot().xp,meal.xp);for(const a of ['nap','cuddle','ball','cheer'])assert.throws(()=>c.command(a),/Eating/);now+=4000;c.command('touch',{zone:'head',gesture:'stroke'});assert.equal(c.cue.type,'nuzzle');});
test('3D ball approaches, receives a paw push, then rolls back without invalid positions',()=>{let min=2;for(let a=0;a<=4;a+=.02){const p=ballPath(a);assert.ok(Object.values(p).every(Number.isFinite));assert.ok(p.x>=.34&&p.x<=1.21);min=Math.min(min,p.x);}assert.ok(min<.36);assert.equal(ballPath(2,true).turn,0);});
