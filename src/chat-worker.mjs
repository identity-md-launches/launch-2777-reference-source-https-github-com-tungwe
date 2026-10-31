import {FAST_MODEL,FAST_MODEL_URL,chooseBackend,fitFastMessages,visibleReply} from './chat-backend.mjs';
let pipeline,env,TextStreamer;
import {MODEL,REVISION,makeMessages} from './chat-core.mjs';
import {Converter} from 'https://cdn.jsdelivr.net/npm/opencc-js@1.4.2/dist/esm/full.js';
const traditional=Converter({from:'cn',to:'tw'});
let generator=null,engine=null,working=false,device='wasm';
async function loadModel(m){
 let cachedCPU=false,cachedGPU=false,adapter=null;
 try{cachedCPU=!!(await caches.match(`https://huggingface.co/${MODEL}/resolve/${REVISION}/onnx/model_quantized.onnx`));}catch{}
 if(!m.forceCompatibility){try{adapter=await navigator.gpu?.requestAdapter();}catch{}}
 if(adapter){try{cachedGPU=(await Promise.all(Array.from({length:9},(_,i)=>caches.match(FAST_MODEL_URL+`params_shard_${i}.bin`)))).every(Boolean);}catch{}}
 device=chooseBackend({forceCompatibility:m.forceCompatibility,cachedCPU,cachedGPU,adapter});
 self.postMessage({type:'plan',id:m.id,device,megabytes:device==='webgpu'?360:650,cached:device==='webgpu'?cachedGPU:cachedCPU});
 if(device==='webgpu'){
  const {CreateMLCEngine}=await import('https://esm.sh/@mlc-ai/web-llm@0.2.87?bundle');
  engine=await CreateMLCEngine(FAST_MODEL,{appConfig:{model_list:[{model_id:FAST_MODEL,model:FAST_MODEL_URL,model_lib:'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/146ed9cd4b4062e967b017fd2291f7106b50599f/web-llm-models/v0_2_87/base/Qwen3-0.6B-q4f16_1_cs1k-webgpu.wasm',required_features:['shader-f16'],overrides:{context_window_size:4096,prefill_chunk_size:1024}}]},logLevel:'WARN',initProgressCallback:p=>self.postMessage({type:'stage-progress',id:m.id,fraction:p.progress})});
 }else{
  ({pipeline,env,TextStreamer}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js'));
  env.allowLocalModels=false;env.useBrowserCache=true;
  env.backends.onnx.wasm.wasmPaths='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0-dev.20250409-89f8206ba4/dist/';
  env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
  generator=await pipeline('text-generation',MODEL,{revision:REVISION,dtype:'q8',device,
   progress_callback:p=>{if(['progress','initiate','done'].includes(p.status))self.postMessage({type:'progress',id:m.id,file:p.file||'',loaded:p.loaded||0,total:p.total||0,status:p.status});}});
 }
}
self.onmessage=async({data:m})=>{
 if(working)return;working=true;
 try{
  if(m.type==='load'){
   await loadModel(m);
   self.postMessage({type:'ready',id:m.id,device});
  }else if(m.type==='generate'&&(generator||engine)){
   const zh=m.language==='zh-Hant'||/[\u3400-\u9fff]/u.test(m.history.at(-1)?.content||'');
   const display=s=>zh?traditional(visibleReply(s)):visibleReply(s);
   if(engine){
    let text='';const chunks=await engine.chat.completions.create({messages:fitFastMessages(makeMessages(m.history,m.language,m.context)),max_tokens:160,temperature:.7,top_p:.8,stream:true,extra_body:{enable_thinking:false}});
    for await(const chunk of chunks){text+=chunk.choices[0]?.delta?.content||'';const shown=display(text);if(shown)self.postMessage({type:'token',id:m.id,text:shown});}
    const shown=display(text).trim();if(!shown)throw Error('empty');self.postMessage({type:'done',id:m.id,text:shown});return;
   }
   let text='';const streamer=new TextStreamer(generator.tokenizer,{skip_prompt:true,skip_special_tokens:true,callback_function:token=>{text+=token;self.postMessage({type:'token',id:m.id,text:display(text)});}});
   const prompt=generator.tokenizer.apply_chat_template(makeMessages(m.history,m.language,m.context),{tokenize:false,add_generation_prompt:true,enable_thinking:false});
   const out=await generator(prompt,{max_new_tokens:160,do_sample:true,temperature:0.7,top_p:0.8,top_k:20,repetition_penalty:1.1,return_full_text:false,add_special_tokens:false,streamer});
   const result=out?.[0]?.generated_text;const answer=(Array.isArray(result)?result.at(-1)?.content:text)?.trim();
   const shown=display(answer||'').trim();if(!shown)throw Error('empty');self.postMessage({type:'done',id:m.id,text:shown});
  }else throw Error('state');
 }catch{self.postMessage({type:'error',id:m.id,code:(generator||engine)?'generation':device==='webgpu'?'gpu-load':'download'});}
 finally{working=false;}
};
