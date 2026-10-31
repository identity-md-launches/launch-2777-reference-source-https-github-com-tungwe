import test from 'node:test';
import assert from 'node:assert/strict';
import {Quaternion,Euler,Vector3} from './dist/vendor/three.module.js';
import {blendRotation} from './dist/pose-blend.mjs';
const rotation=(x=0,y=0,z=0)=>new Quaternion().setFromEuler(new Euler(x,y,z));
function settle(previous,target,frames=60,dt=1/60){
 const current=new Quaternion(),scratch=new Quaternion(),blend=1-Math.exp(-12*dt);
 for(let i=0;i<frames;i++){current.copy(target);blendRotation(current,previous,blend,scratch);previous.copy(current);}
 return previous;
}
test('actual bundled Three quaternion blend preserves the requested target instead of freezing it',()=>{
 const previous=new Quaternion(),current=rotation(0,1),scratch=new Quaternion();
 blendRotation(current,previous,.2,scratch);
 assert.ok(Math.abs(new Euler().setFromQuaternion(current).y-.2)<1e-12);
 assert.equal(previous.angleTo(new Quaternion()),0);assert.ok(scratch.angleTo(rotation(0,1))<1e-7);
});
test('positive/negative turns, drag direction changes and Face me move the rendered orientation',()=>{
 const previous=new Quaternion();
 for(const yaw of [-Math.PI/4,Math.PI/4,2.2,-2.2,Math.PI*2+.3,0]){
  const target=rotation(0,yaw);settle(previous,target);
  assert.ok(previous.angleTo(target)<.0001,`reached yaw ${yaw}`);
  const facing=new Vector3(0,0,1).applyQuaternion(previous);
  assert.ok(Math.abs(facing.x-Math.sin(yaw))<.0001);
  assert.ok(Math.abs(facing.z-Math.cos(yaw))<.0001);
 }
});
test('sleeping, leaning and turning rotations blend across every axis and remain frame-rate independent',()=>{
 const target=rotation(.1,1.4,-.2),at60=settle(new Quaternion(),target,60,1/60),at30=settle(new Quaternion(),target,30,1/30);
 assert.ok(at60.angleTo(target)<.0001);assert.ok(at60.angleTo(at30)<1e-7);
 for(const q of [at60,at30]){assert.ok(q.toArray().every(Number.isFinite));assert.ok(Math.abs(q.length()-1)<1e-12);}
});
test('zero blend holds the old pose and reduced-motion full blend applies the new pose immediately',()=>{
 const previous=rotation(0,.4),target=rotation(0,-1.1),scratch=new Quaternion(),current=target.clone();
 blendRotation(current,previous,0,scratch);assert.ok(current.angleTo(previous)<1e-7);
 current.copy(target);blendRotation(current,previous,1,scratch);assert.ok(current.angleTo(target)<1e-7);
});
