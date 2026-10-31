import test from 'node:test';import assert from 'node:assert/strict';
import {IdleDirector,IDLE_ACTIONS,idlePose} from './dist/idle-behavior.mjs';
test('idle waits, rests between actions and never repeats the immediately completed action',()=>{
 const idle=new IdleDirector(()=>0);assert.equal(idle.tick(0),null);assert.equal(idle.tick(4499),null);assert.equal(idle.tick(4500).type,'groom');assert.equal(idle.tick(9699).type,'groom');assert.equal(idle.tick(9700),null);assert.equal(idle.tick(16199),null);assert.equal(idle.tick(16200).type,'look');
});
test('interaction interrupts immediately and resuming never catches up hidden or sleeping time',()=>{
 const idle=new IdleDirector(()=>0);idle.tick(0);idle.tick(4500);assert.equal(idle.tick(5000,{blocked:true}),null);assert.equal(idle.active,null);assert.equal(idle.tick(9e6,{blocked:true}),null);assert.equal(idle.tick(9e6+1),null);assert.equal(idle.tick(9e6+6500),null);assert.ok(idle.tick(9e6+6501));idle.pause(1e7);assert.equal(idle.tick(1e7+1),null);
});
test('low energy selects calmer actions and all poses ease to neutral without invalid geometry scale',()=>{
 const idle=new IdleDirector(()=>.999);idle.tick(0,{energy:10});assert.equal(idle.tick(6500,{energy:10}).type,'stretch');
 for(const type of Object.keys(IDLE_ACTIONS)){const duration=IDLE_ACTIONS[type].duration;assert.deepEqual(idlePose(type,0),idlePose(type,duration));for(const stage of ['baby','young','junior','grown','star'])for(let t=0;t<=duration;t+=50){const p=idlePose(type,t,stage);assert.ok(Object.values(p).every(Number.isFinite));assert.ok(p.sx>.9&&p.sy<1.11&&p.sy>=1);assert.ok(Math.abs(p.ry)<.6);}}
});
