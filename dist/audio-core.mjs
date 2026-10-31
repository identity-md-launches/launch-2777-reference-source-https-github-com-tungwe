import {runtimeBase} from './runtime-base.mjs';
import {AUDIO_ASSETS} from './audio-assets.mjs';
export const SOUND_KEY='squeek-sound-v1';
export const DEFAULT_SOUND={version:1,effects:true,music:true,effectsVolume:.60,musicVolume:.25};
export const EFFECTS=['feed','pet','cuddle','brush','ball','dance','sleep','wake','sniff','success'];
export function soundPreferences(value){
 const v=value?.version===1?value:{};
 const volume=(key)=>typeof v[key]==='number'&&Number.isFinite(v[key])?Math.min(1,Math.max(0,v[key])):DEFAULT_SOUND[key];
 return {version:1,effects:typeof v.effects==='boolean'?v.effects:true,music:typeof v.music==='boolean'?v.music:true,effectsVolume:volume('effectsVolume'),musicVolume:volume('musicVolume')};
}
export function soundForCommand(action,before,after){
 if(!after||action==='settings'||action==='mode')return null;
 const pet=after.pet;
 if(before?.pet&&pet&&(pet.stage!==before.pet.stage||(!before.pet.life?.claimed&&pet.life?.claimed)))return 'success';
 if(action==='feed')return pet?.meals>(before?.pet?.meals??0)?'feed':null;
 if(action==='hunt-pick')return pet?.hunt?.phase==='won'?'success':'pet';
 if(action==='play-tap')return pet?.game?.phase==='won'?'success':pet?.game?.phase==='retry'?'pet':null;
 if(action==='touch'){
  // A no-op touch while eating or throttled must not play a false reaction.
  if(after.cue?.at===before?.cue?.at&&after.cue?.type===before?.cue?.type)return null;
  if(after.cue?.type==='eat')return null;
  if(after.cue?.type==='wake')return 'wake';
  if(after.cue?.type==='snuggle')return 'cuddle';
  if(['sniff','sneeze'].includes(after.cue?.type))return 'sniff';
  return 'pet';
 }
 return {pet:'pet',stroke:'pet',cuddle:'cuddle',brush:'brush',ball:'ball',dance:'dance',nap:'sleep',wake:'wake',cheer:'success',cue:'pet','hunt-start':'sniff','play-start':'pet'}[action]||null;
}

// One lazily created context. Nothing loads or plays before Enable sound.
// Original PCM files loop natively; no timer-based musical clock or remote audio.
export class CompanionAudio{
 constructor({preferences=DEFAULT_SOUND,createContext=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)({latencyHint:'interactive'}),fetcher=(url,options)=>globalThis.fetch(new URL(url.startsWith('/')?'.'+url:url,runtimeBase),options),onChange=()=>{},later=(...args)=>globalThis.setTimeout(...args),cancel=id=>globalThis.clearTimeout(id)}={}){
  Object.assign(this,{createContext,fetcher,onChange,later,cancel});this.prefs=soundPreferences(preferences);
  this.context=null;this.enabled=false;this.visible=true;this.otherTab=false;this.closed=false;this.loading=false;this.error='';
  this.epoch=0;this.buffers=new Map();this.pending=new Map();this.requests=new Set();this.voices=new Set();this.lastEffect=-Infinity;
  this.musicSource=null;this.musicOffset=0;this.musicBegan=0;this.duckUntil=0;this.quiet=false;this.pauseTimer=null;this.duckTimer=null;
 }
 status(){if(this.closed)return 'off';if(this.error==='unsupported')return 'unsupported';if(!this.enabled)return 'off';if(!this.visible)return 'hidden';if(this.otherTab)return 'other';if(this.loading)return 'loading';if(this.context?.state!=='running')return 'blocked';if(this.error)return 'partial';return 'playing';}
 notify(){this.onChange(this.status());}
 active(){return this.enabled&&this.visible&&!this.otherTab&&!this.closed&&this.context?.state==='running';}
 create(){
  if(this.context)return;
  const c=this.createContext();this.context=c;
  this.master=c.createGain();this.musicGain=c.createGain();this.effectsGain=c.createGain();this.limiter=c.createDynamicsCompressor();
  this.master.gain.value=0;this.musicGain.gain.value=0;this.effectsGain.gain.value=this.prefs.effectsVolume;
  this.limiter.threshold.value=-12;this.limiter.knee.value=12;this.limiter.ratio.value=4;this.limiter.attack.value=.004;this.limiter.release.value=.18;
  this.musicGain.connect(this.master);this.effectsGain.connect(this.master);this.master.connect(this.limiter);this.limiter.connect(c.destination);
  c.onstatechange=()=>{if(!this.closed)this.notify();};
 }
 ramp(param,value,time=.06){const t=this.context.currentTime;param.cancelScheduledValues(t);param.setTargetAtTime(value,t,time);}
 gains(){if(!this.context||this.closed)return;
  this.ramp(this.master.gain,this.active()?1:0,.018);
  this.ramp(this.effectsGain.gain,this.prefs.effects?this.prefs.effectsVolume:0,.02);
  const duck=this.context.currentTime<this.duckUntil?.42:1,quiet=this.quiet?.45:1;
  this.ramp(this.musicGain.gain,this.prefs.music?this.prefs.musicVolume*duck*quiet:0,.25);
 }
 async load(name){
  if(this.buffers.has(name))return this.buffers.get(name);if(this.pending.has(name))return this.pending.get(name);
  if(name!=='seedlight'&&!EFFECTS.includes(name))throw Error('Unknown sound');
  const controller=new AbortController();this.requests.add(controller);
  const timeout=this.later(()=>controller.abort(),12000);
  const task=(async()=>{try{
   let buffer;
   // FLAC preserves every PCM sample and the loop seam. WAV supports older decoders.
   for(const url of [AUDIO_ASSETS[name],`/assets/audio/${name}.wav`]){
    try{
     const response=await this.fetcher(url,{credentials:'same-origin',signal:controller.signal});
     if(!response.ok)throw Error('Audio asset unavailable');
     const data=await response.arrayBuffer();if(this.closed||controller.signal.aborted)throw Error('Audio cancelled');
     buffer=await this.context.decodeAudioData(data);
     if(this.closed||controller.signal.aborted)throw Error('Audio cancelled');
     break;
    }catch(error){if(this.closed||controller.signal.aborted||url.endsWith('.wav'))throw error;}
   }
   this.buffers.set(name,buffer);if(name==='seedlight'){this.startMusic();this.gains();}return buffer;
  }finally{this.cancel(timeout);this.requests.delete(controller);if(this.pending.get(name)===task)this.pending.delete(name);}})();
  this.pending.set(name,task);return task;
 }
 async enable(){
  if(this.closed)return false;const ticket=++this.epoch;this.enabled=true;this.otherTab=false;this.error='';this.loading=true;this.cancel(this.pauseTimer);this.pauseTimer=null;
  try{this.create();}catch{this.enabled=false;this.loading=false;this.error='unsupported';if(this.context){void this.context.close().catch(()=>{});this.context=null;}this.notify();return false;}
  // Called directly from the button handler, before awaiting network work.
  let resumed;try{resumed=this.context.resume();}catch{this.loading=false;this.notify();return false;}
  this.notify();
  try{
   await resumed;if(ticket!==this.epoch||this.closed)return false;
   this.gains();
   const names=this.prefs.music?['seedlight']:this.prefs.effects?['pet']:[];
   const loaded=await Promise.allSettled(names.map(n=>this.load(n)));
   if(ticket!==this.epoch||this.closed)return false;
   this.error=loaded.some(r=>r.status==='rejected')?'load':'';this.loading=false;
   this.startMusic();this.gains();this.notify();this.warmup=this.warmEffects(ticket);return this.active();
  }catch{if(ticket===this.epoch&&!this.closed){this.loading=false;this.error='load';this.notify();}return false;}
 }
 async warmEffects(ticket){
  // Two small downloads at a time, only after the foreground track is ready.
  const queue=['pet','feed',...EFFECTS.filter(n=>!['pet','feed'].includes(n))];
  const worker=async()=>{while(queue.length&&ticket===this.epoch&&this.active()&&this.prefs.effects){
   const name=queue.shift();try{await this.load(name);}catch{if(ticket===this.epoch&&this.active()){this.error='load';this.notify();}}
  }};
  await Promise.all([worker(),worker()]);
 }
 cancelLoads(){for(const request of this.requests)request.abort();this.requests.clear();this.pending.clear();}
 startMusic(){
  if(!this.active()||!this.prefs.music||this.musicSource)return;
  const buffer=this.buffers.get('seedlight');if(!buffer)return;
  const source=this.context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(this.musicGain);
  this.musicOffset%=buffer.duration;this.musicBegan=this.context.currentTime;this.musicSource=source;
  source.onended=()=>source.disconnect();source.start(0,this.musicOffset);
 }
 stopMusic(fade=0){if(!this.musicSource)return;const source=this.musicSource;this.musicSource=null;
  this.musicOffset=(this.musicOffset+this.context.currentTime-this.musicBegan)%source.buffer.duration;
  try{source.stop(this.context.currentTime+fade);}catch{}if(!fade)source.disconnect();
 }
 stopEffects(){for(const voice of this.voices){try{voice.stop();}catch{}voice.disconnect();}this.voices.clear();}
 async play(effect){
  if(!EFFECTS.includes(effect)||!this.active()||!this.prefs.effects||this.prefs.effectsVolume===0||this.voices.size>=3)return false;
  const t=this.context.currentTime;if(t-this.lastEffect<.22)return false;this.lastEffect=t;const ticket=this.epoch;
  let buffer;try{buffer=await this.load(effect);}catch{if(ticket===this.epoch&&this.active()){this.error='load';this.notify();}return false;}
  if(!this.active()||ticket!==this.epoch||!this.prefs.effects||this.voices.size>=3||this.context.currentTime-t>.45)return false;
  const voice=this.context.createBufferSource();voice.buffer=buffer;voice.connect(this.effectsGain);this.voices.add(voice);
  voice.onended=()=>{this.voices.delete(voice);voice.disconnect();};voice.start();
  this.duckUntil=Math.max(this.duckUntil,this.context.currentTime+buffer.duration+.12);this.gains();
  this.cancel(this.duckTimer);this.duckTimer=this.later(()=>{if(!this.closed){this.duckUntil=0;this.gains();}},Math.max(1,(this.duckUntil-this.context.currentTime)*1000));
  return true;
 }
 setPreferences(value){this.prefs=soundPreferences({...this.prefs,...value});if(!this.prefs.effects)this.stopEffects();if(!this.prefs.music)this.stopMusic();this.gains();this.notify();
  if(this.prefs.music&&this.enabled&&this.context&&!this.buffers.has('seedlight')){
   void this.load('seedlight').then(()=>{this.startMusic();this.gains();}).catch(()=>{if(!this.closed){this.error='load';this.notify();}});
  }else this.startMusic();
 }
 setQuiet(value){if(this.quiet===!!value)return;this.quiet=!!value;this.gains();}
 pause(){
  this.epoch++;this.loading=false;this.cancel(this.duckTimer);this.duckUntil=0;
  if(!this.context)return;this.gains();this.stopEffects();this.stopMusic(.07);this.cancel(this.pauseTimer);
  this.pauseTimer=this.later(()=>{this.pauseTimer=null;if(!this.active())void this.context?.suspend().catch(()=>{});},90);this.notify();
 }
 mute(){this.enabled=false;this.cancelLoads();this.pause();this.notify();}
 yieldToOtherTab(){if(!this.enabled)return;this.otherTab=true;this.pause();}
 setVisible(visible){this.visible=!!visible;if(!visible){this.pause();return;}
  if(!this.enabled||this.otherTab||!this.context||this.closed){this.notify();return;}
  const ticket=++this.epoch;this.cancel(this.pauseTimer);this.pauseTimer=null;
  void this.context.resume().then(()=>{if(ticket!==this.epoch||!this.active())return;this.startMusic();this.gains();this.notify();this.warmup=this.warmEffects(ticket);}).catch(()=>this.notify());
 }
 dispose(){if(this.closed)return;this.enabled=false;this.epoch++;this.closed=true;this.cancel(this.pauseTimer);this.cancel(this.duckTimer);this.stopEffects();this.stopMusic();
  for(const request of this.requests)request.abort();this.requests.clear();this.buffers.clear();this.pending.clear();
  if(this.context){this.context.onstatechange=null;void this.context.close().catch(()=>{});this.master.disconnect();this.musicGain.disconnect();this.effectsGain.disconnect();this.limiter.disconnect();}this.notify();
 }
}
