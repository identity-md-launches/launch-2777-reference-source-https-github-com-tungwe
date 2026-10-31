import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Pet} from './dist/pet-engine.mjs';
import {GROWTH_MODELS} from './dist/growth-models.mjs';
import {petText} from './dist/pet-ui.mjs';
test('five elapsed-time growth boundaries and accessory milestones',()=>{
 for(const [xp,stage,next] of [[0,'baby',1440],[1439,'baby',1440],[1440,'young',4320],[4319,'young',4320],[4320,'junior',10080],[10079,'junior',10080],[10080,'grown',30240],[30239,'grown',30240],[30240,'star',null],[90000,'star',null]]){
  const p=new Pet();p.data.xp=xp;const s=p.snapshot();assert.equal(s.xp,xp);assert.equal(s.stage,stage);assert.equal(s.nextXp,next);assert.ok(GROWTH_MODELS[stage]);
  assert.equal(s.unlocked.includes('bow'),xp>=1440);assert.equal(s.unlocked.includes('flower'),xp>=10080);assert.equal(s.unlocked.includes('crown'),xp>=30240);
  assert.notEqual(petText('en',stage),stage);assert.notEqual(petText('zh-Hant',stage),stage);
 }
});
test('five distinct self-contained GLBs have valid geometry buffers and no external URIs',()=>{
 assert.equal(new Set(Object.values(GROWTH_MODELS).map(x=>x.url)).size,5);
 for(const spec of Object.values(GROWTH_MODELS)){
  const b=readFileSync(new URL('./dist'+spec.url,import.meta.url));assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(8),b.length);
  const n=b.readUInt32LE(12),d=JSON.parse(b.subarray(20,20+n).toString());assert.ok(d.meshes.length);assert.ok(d.images.length);
  assert.ok(d.buffers.every(x=>!x.uri));assert.ok(d.images.every(x=>!x.uri&&Number.isInteger(x.bufferView)));
  for(const v of d.bufferViews)assert.ok((v.byteOffset||0)+v.byteLength<=d.buffers[0].byteLength);
  assert.ok(b.length<4_000_000);
 }
});
test('web character has no 2D geometry or view toggle',()=>{
 const read=f=>readFileSync(new URL('./dist/'+f,import.meta.url),'utf8');
 assert.doesNotMatch(read('studio.mjs'),/<svg|querySelector\('\.pet'\)/);
 assert.doesNotMatch(read('pet-ui.mjs'),/createElementNS|svg\./);
 assert.doesNotMatch(read('character-view.mjs'),/character-toggle|Use original 2D|setVisible/);
});
