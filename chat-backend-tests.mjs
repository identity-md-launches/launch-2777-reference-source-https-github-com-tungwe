import test from 'node:test';import assert from 'node:assert/strict';
import {chooseBackend,fitFastMessages,visibleReply} from './dist/chat-backend.mjs';
import {ChatSession,makeMessages} from './dist/chat-core.mjs';
const adapter={features:new Set(['shader-f16']),limits:{maxStorageBufferBindingSize:134217728}};
test('streamed reasoning markers and partial blocks never become a chat bubble',()=>{
 const reply='<think>PRIVATE INTERNAL TEXT</think>\n\nHello, friend!';
 for(let n=0;n<=reply.length;n++){const visible=visibleReply(reply.slice(0,n));assert.doesNotMatch(visible,/PRIVATE|INTERNAL|TEXT|<|>/);if(n<=reply.indexOf('Hello'))assert.equal(visible,'');}
 assert.equal(visibleReply(reply),'Hello, friend!');assert.equal(visibleReply('你好！'),'你好！');
});
test('fast chat needs a compatible GPU; cached or explicitly chosen CPU avoids another model download',()=>{
 assert.equal(chooseBackend({adapter}),'webgpu');assert.equal(chooseBackend(), 'wasm');
 assert.equal(chooseBackend({adapter,cachedCPU:true}),'wasm');assert.equal(chooseBackend({adapter,forceCompatibility:true}),'wasm');
 assert.equal(chooseBackend({adapter,cachedCPU:true,cachedGPU:true}),'webgpu');assert.equal(chooseBackend({adapter,cachedGPU:true,forceCompatibility:true}),'wasm');
 assert.equal(chooseBackend({adapter:{...adapter,features:new Set()}}),'wasm');
 assert.equal(chooseBackend({adapter:{...adapter,limits:{maxStorageBufferBindingSize:33554432}}}),'wasm');
});
test('GPU context trimming preserves persona, examples and latest user message',()=>{
 const messages=makeMessages(Array.from({length:6},(_,i)=>({role:i%2?'user':'assistant',content:'我'.repeat(800)})),'zh-Hant');
 const fitted=fitFastMessages(messages);assert.deepEqual(fitted.slice(0,5),messages.slice(0,5));assert.deepEqual(fitted.at(-1),messages.at(-1));assert.ok(fitted.reduce((s,m)=>s+m.content.length,0)<=2600);assert.equal(messages.length,11);
});
test('compatibility retry is explicit and late progress from a stopped worker is ignored',()=>{
 const workers=[],events=[];const session=new ChatSession({createWorker(){const w={postMessage(m){this.last=m;},terminate(){}};workers.push(w);return w;},onEvent:e=>events.push(e)});
 session.send({history:[],forceCompatibility:true});assert.equal(workers[0].last.forceCompatibility,true);const old=workers[0],id=session.id;session.stop();session.send({history:[]});const count=events.length;old.onmessage({data:{type:'stage-progress',id,fraction:.8}});assert.equal(events.length,count);assert.equal(workers[1].last.forceCompatibility,false);session.reset();
});
