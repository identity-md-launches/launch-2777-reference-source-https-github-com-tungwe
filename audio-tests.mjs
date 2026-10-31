import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CompanionAudio,DEFAULT_SOUND,soundPreferences,soundForCommand,EFFECTS} from './dist/audio-core.mjs';
import {Companion} from './dist/companion-engine.mjs';

function fixture({fetcher}={}){
 let creates=0,calls=0,nextTimer=0;const timers=new Map(),nodes=[];
 const param=()=>({value:0,cancelScheduledValues(){},setTargetAtTime(v){this.value=v;}});
 const node=()=>({connect(){},disconnect(){this.disconnected=true;},gain:param()});
 const context={currentTime:0,state:'suspended',destination:{},createGain:node,createDynamicsCompressor:()=>({...node(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()}),
  resume(){this.state='running';this.onstatechange?.();return Promise.resolve();},suspend(){this.state='suspended';return Promise.resolve();},close(){this.state='closed';return Promise.resolve();},decodeAudioData:async()=>({duration:2}),
  createBufferSource(){const n={...node(),starts:0,stops:0,start(...args){this.starts++;this.args=args;},stop(){this.stops++;this.onended?.();}};nodes.push(n);return n;}
 };
 const audio=new CompanionAudio({createContext:()=>{creates++;return context;},fetcher:fetcher||(async()=>{calls++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(2)};}),later:(fn,delay)=>{timers.set(++nextTimer,{fn,delay});return nextTimer;},cancel:id=>timers.delete(id)});
 return {audio,context,nodes,timers,get creates(){return creates;},get calls(){return calls;}};
}

test('audio preferences are bounded and independent; no autoplay/context/network on load',()=>{
 assert.deepEqual(soundPreferences(null),DEFAULT_SOUND);assert.deepEqual(soundPreferences({version:7,music:false}),DEFAULT_SOUND);
 const p=soundPreferences({version:1,effects:false,music:true,effectsVolume:NaN,musicVolume:7});assert.equal(p.effects,false);assert.equal(p.effectsVolume,.6);assert.equal(p.musicVolume,1);
 const f=fixture();assert.equal(f.creates,0);assert.equal(f.calls,0);assert.equal(f.audio.status(),'off');f.audio.setPreferences({music:false});assert.equal(f.creates,0);
});
test('one context, one native music loop, independent gains, quiet mode and effect ducking',async()=>{
 const f=fixture(),a=f.audio;await a.enable();assert.equal(f.creates,1);assert.equal(a.status(),'playing');await a.warmup;assert.equal(f.calls,11);assert.equal(f.nodes.length,1);assert.equal(f.nodes[0].loop,true);
 a.setPreferences({musicVolume:.5,effectsVolume:.8});assert.equal(a.musicGain.gain.value,.5);assert.equal(a.effectsGain.gain.value,.8);
 a.setQuiet(true);assert.equal(a.musicGain.gain.value,.225);assert.equal(await a.play('pet'),true);assert.ok(a.musicGain.gain.value<.1);assert.equal(await a.play('pet'),false);
 a.setPreferences({effects:false});assert.equal(a.voices.size,0);assert.equal(a.effectsGain.gain.value,0);assert.equal(a.musicSource,f.nodes[0]);
 a.setPreferences({music:false});assert.equal(a.musicSource,null);a.setPreferences({music:true});assert.equal(f.nodes.filter(n=>n.loop&&n.stops===0).length,1);assert.equal(f.creates,1);a.dispose();
});
test('mute and hidden state stop effects; repeated resume never duplicates loops or replays old cues',async()=>{
 const f=fixture(),a=f.audio;await a.enable();await a.play('feed');a.setVisible(false);assert.equal(a.status(),'hidden');assert.equal(a.voices.size,0);assert.equal(a.musicSource,null);assert.equal(await a.play('wake'),false);
 a.setVisible(true);await Promise.resolve();assert.equal(a.status(),'playing');assert.equal(a.voices.size,0);assert.equal(f.nodes.filter(n=>n.loop&&!n.stops).length,1);
 a.setVisible(true);await Promise.resolve();assert.equal(f.nodes.filter(n=>n.loop&&!n.stops).length,1);
 a.mute();assert.equal(a.status(),'off');a.setVisible(false);a.setVisible(true);assert.equal(a.status(),'off');assert.equal(a.musicSource,null);a.dispose();assert.equal(f.timers.size,0);assert.equal(f.context.state,'closed');
});
test('another tab can pause audio but cannot auto-enable it or override an intentional mute',async()=>{
 const f=fixture(),a=f.audio;a.yieldToOtherTab();assert.equal(a.status(),'off');assert.equal(f.creates,0);await a.enable();a.yieldToOtherTab();assert.equal(a.status(),'other');assert.equal(a.musicSource,null);a.setVisible(false);a.setVisible(true);assert.equal(a.status(),'other');await a.enable();assert.equal(a.status(),'playing');a.dispose();
});
test('late decode after muting never starts a track; returning during a load can start the ready track',async()=>{
 let release;const gate=new Promise(r=>release=r);const f=fixture();f.context.decodeAudioData=async()=>{await gate;return {duration:2};};
 const pending=f.audio.enable();await Promise.resolve();f.audio.mute();release();await pending;assert.equal(f.audio.musicSource,null);assert.equal(f.audio.status(),'off');f.audio.dispose();
 let resolve;const ready=new Promise(r=>resolve=r),g=fixture();g.context.decodeAudioData=async()=>{await ready;return {duration:2};};
 const enabling=g.audio.enable();await Promise.resolve();g.audio.setVisible(false);g.audio.setVisible(true);await Promise.resolve();resolve();await enabling;await Promise.resolve();assert.ok(g.audio.musicSource);assert.equal(g.nodes.filter(n=>n.loop&&!n.stops).length,1);g.audio.dispose();
});
test('missing assets can retry without poisoning cache; unsupported audio cannot break care',async()=>{
 let failed=true;const f=fixture({fetcher:async url=>({ok:!(failed&&String(url).includes('seedlight')),arrayBuffer:async()=>new ArrayBuffer(2)})});
 await f.audio.enable();assert.equal(f.audio.status(),'partial');assert.equal(f.audio.musicSource,null);assert.equal(await f.audio.play('pet'),true);failed=false;await f.audio.enable();assert.ok(f.audio.musicSource);assert.equal(f.audio.status(),'playing');f.audio.dispose();
 const bad=new CompanionAudio({createContext:()=>{throw Error('unavailable');}});assert.equal(await bad.enable(),false);assert.equal(bad.status(),'unsupported');const c=new Companion(()=>100000);assert.equal(c.command('feed',{food:'seed'}).pet.meals,1);bad.dispose();
});
test('only committed actions produce cues; ignored eating touches and reload snapshots stay quiet',()=>{
 let now=100000;const c=new Companion(()=>now),before=c.snapshot(),after=c.command('feed',{food:'seed'});assert.equal(soundForCommand('feed',before,after),'feed');assert.equal(soundForCommand('feed',after,after),null);
 now+=500;assert.equal(soundForCommand('touch',after,c.command('touch',{zone:'head'})),null);assert.equal(soundForCommand('settings',after,after),null);
 now+=5000;let b=c.snapshot(),a=c.command('nap');assert.equal(soundForCommand('nap',b,a),'sleep');b=a;a=c.command('touch',{zone:'head'});assert.equal(soundForCommand('touch',b,a),'wake');
 now+=1000;b=c.snapshot();a=c.command('brush');assert.equal(soundForCommand('brush',b,a),'brush');
});
test('audio sources have bounded PCM, no clipping, matching hashes and a smooth native loop seam',async()=>{
 const {createHash}=await import('node:crypto');const m=JSON.parse(readFileSync('dist/assets/audio/manifest.json'));assert.equal(m.assets.length,11);assert.equal(m.bars,16);
 for(const asset of m.assets){const b=readFileSync('dist/assets/audio/'+asset.file);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');assert.equal(b.readUInt16LE(22),1);assert.equal(b.readUInt32LE(24),24000);assert.equal(b.readUInt16LE(34),16);assert.equal(createHash('sha256').update(b).digest('hex'),asset.sha256);
  let max=0,power=0;for(let i=44;i<b.length;i+=2){const n=b.readInt16LE(i)/32768;max=Math.max(max,Math.abs(n));power+=n*n;}assert.ok(max>.1&&max<.4);assert.ok(power>0);if(asset.file==='seedlight.wav'){assert.ok(asset.seconds>50);assert.ok(Math.abs(b.readInt16LE(44)-b.readInt16LE(b.length-2))/32768<.001);}
 }
});

test('browser-native fetch and timer wrappers retain the global receiver',async()=>{
 const saved=Object.fromEntries(['fetch','setTimeout','clearTimeout'].map(k=>[k,globalThis[k]]));let id=0;
 try{
  globalThis.fetch=async function(){assert.equal(this,globalThis);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(2)};};
  globalThis.setTimeout=function(){assert.equal(this,globalThis);return ++id;};globalThis.clearTimeout=function(){assert.equal(this,globalThis);};
  const f=fixture(),a=new CompanionAudio({createContext:()=>f.context});assert.equal(await a.enable(),true);a.mute();a.dispose();
 }finally{Object.assign(globalThis,saved);}
});
test('rapid inputs cannot exceed three sound-effect voices and unknown cues are ignored',async()=>{
 const f=fixture(),a=f.audio;await a.enable();for(let i=0;i<3;i++){f.context.currentTime+=.3;assert.equal(await a.play('pet'),true);}f.context.currentTime+=.3;assert.equal(await a.play('pet'),false);assert.equal(a.voices.size,3);assert.equal(await a.play('../anything'),false);a.mute();assert.equal(a.voices.size,0);a.dispose();
});

test('music becomes ready without waiting for effects; warmup uses at most two downloads',async()=>{
 const waiting=[],urls=[];let inFlight=0,peak=0;
 const f=fixture({fetcher:async(url,{signal})=>{
  urls.push(url);if(!url.includes('seedlight')){inFlight++;peak=Math.max(peak,inFlight);await new Promise((resolve,reject)=>{waiting.push(resolve);signal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true});});inFlight--;}
  return {ok:true,arrayBuffer:async()=>new ArrayBuffer(2)};
 }});
 await f.audio.enable();assert.equal(f.audio.status(),'playing');assert.ok(f.audio.musicSource);assert.equal(urls.length,3);assert.equal(peak,2);assert.ok(urls.every(u=>u.endsWith('.flac')));
 f.audio.mute();await f.audio.warmup;assert.equal(urls.length,3);assert.equal(f.audio.pending.size,0);assert.equal(f.audio.status(),'off');f.audio.dispose();
});

test('unsupported lossless decoding falls back to WAV once and caches the result',async()=>{
 const urls=[];const f=fixture({fetcher:async url=>{urls.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(url.endsWith('.flac')?1:2)};}});
 f.audio.setPreferences({effects:false});f.context.decodeAudioData=async b=>{if(b.byteLength===1)throw Error('decoder unavailable');return {duration:2};};
 await f.audio.enable();assert.equal(f.audio.status(),'playing');assert.equal(urls.length,2);assert.ok(urls[0].endsWith('.flac'));assert.equal(urls[1],'/assets/audio/seedlight.wav');
 await f.audio.enable();assert.equal(urls.length,2);f.audio.dispose();
});

test('cancel aborts the download; an immediate retry never reuses the cancelled promise',async()=>{
 let first=true,aborted=false;
 const f=fixture({fetcher:async(url,{signal})=>{
  if(first){first=false;await new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(Error('cancelled'));},{once:true}));}
  return {ok:true,arrayBuffer:async()=>new ArrayBuffer(2)};
 }});
 f.audio.setPreferences({effects:false});const old=f.audio.enable();await Promise.resolve();f.audio.mute();assert.ok(aborted);
 assert.equal(await f.audio.enable(),true);await old;assert.equal(f.audio.status(),'playing');assert.ok(f.audio.musicSource);assert.equal(f.audio.pending.size,0);f.audio.dispose();
});
