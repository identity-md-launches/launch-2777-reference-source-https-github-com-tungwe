export const FAST_MODEL='Qwen3-0.6B-q4f16_1-MLC';
export const FAST_MODEL_URL='https://huggingface.co/mlc-ai/Qwen3-0.6B-q4f16_1-MLC/resolve/8c14ce481d4c692769976ad52afea453a102df19/';
export const FAST_DOWNLOAD_MB=360;
export function visibleReply(text){
 let result=String(text).replace(/<think>[\s\S]*?<\/think>/g,'').replace(/<think>[\s\S]*$/,'');
 for(const tag of ['<think>','</think>'])for(let n=1;n<tag.length;n++)if(result.endsWith(tag.slice(0,n)))result=result.slice(0,-n);
 return result.trimStart();
}
export function chooseBackend({forceCompatibility=false,cachedCPU=false,cachedGPU=false,adapter=null}={}){
 if(forceCompatibility)return 'wasm';
 const capable=adapter?.features?.has('shader-f16')&&adapter.limits?.maxStorageBufferBindingSize>=134217728;
 if(capable&&cachedGPU)return 'webgpu';
 if(cachedCPU)return 'wasm';
 return capable?'webgpu':'wasm';
}
export function fitFastMessages(messages){
 const copy=messages.map(m=>({...m}));
 // Preserve persona/few-shot examples and the latest message within the 4K GPU context.
 while(copy.length>6&&copy.reduce((sum,m)=>sum+m.content.length,0)>2600)copy.splice(5,Math.min(2,copy.length-6));
 return copy;
}
