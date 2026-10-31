import {runtimeBase} from './runtime-base.mjs';
import {CompanionAudio,SOUND_KEY,soundPreferences,soundForCommand} from './audio-core.mjs';
import {bindPageLifecycle} from './page-lifecycle.mjs';
const words={
 en:{title:'A little sound, a little company',enable:'Enable sound',mute:'Mute all',resume:'Resume sound',cancel:'Cancel loading',retry:'Retry missing sounds',effects:'Interaction sounds',music:'Background music',effectsVolume:'Sound effects volume',musicVolume:'Music volume',settings:'Volumes & sound',track:'Seedlight · a soft music-box loop',
  off:'Start quietly. Tap Enable sound when you’re ready.',playing:'Sound is on. You can adjust music and effects separately.',loading:'Preparing our little sounds…',hidden:'Paused while this page is hidden.',other:'Paused because another companion tab is playing.',blocked:'Your browser paused audio. Tap Resume sound.',partial:'Some sounds could not load. Tap Resume sound to retry.',unsupported:'Audio is unavailable in this browser. Care and play still work.',unsaved:'Sound settings could not be saved; they still apply in this tab.',foot:'Music softens during naps and AI replies. Switching tabs pauses sound. Original synthesized audio; no microphone.'},
 'zh-Hant':{title:'一點聲音，一點陪伴',enable:'開啟聲音',mute:'全部靜音',resume:'恢復聲音',cancel:'取消載入',retry:'重試未載入的聲音',effects:'互動音效',music:'背景音樂',effectsVolume:'音效音量',musicVolume:'音樂音量',settings:'調整音量',track:'葵花籽小夜曲 · 輕柔音樂盒',
  off:'先安靜陪你，準備好再按「開啟聲音」。',playing:'聲音已開啟，音效與音樂可以分別調整。',loading:'正在準備小小的聲音…',hidden:'離開此分頁時，聲音暫停。',other:'另一個倉鼠分頁正在播放，這裡先暫停。',blocked:'瀏覽器暫停了音訊，按「恢復聲音」繼續。',partial:'部分聲音未能載入，按「恢復聲音」重試。',unsupported:'這個瀏覽器暫時無法播放聲音，仍可照顧和玩耍。',unsaved:'音量設定未能保存，仍會套用在這個分頁。',foot:'睡覺或 AI 回覆時，配樂會變輕；切換分頁會暫停。使用原創合成音樂與音效，不使用麥克風。'}
};
export function initSound({getLanguage,getState,isThinking=()=>false}){
 const panel=document.createElement('section');panel.className='sound-panel';
 panel.innerHTML='<div class="sound-heading"><div><strong class="sound-title"></strong><small class="sound-track"></small></div><button type="button" class="sound-master" aria-pressed="false"></button></div><p class="sound-status" role="status"></p><button type="button" class="sound-retry quiet" hidden></button><div class="sound-toggles"><label><input type="checkbox" class="sound-effects"><span></span></label><label><input type="checkbox" class="sound-music"><span></span></label></div><details class="sound-settings"><summary></summary><div class="sound-volumes"><label for="effects-volume"><span></span><output for="effects-volume"></output><input id="effects-volume" type="range" min="0" max="100" step="1"></label><label for="music-volume"><span></span><output for="music-volume"></output><input id="music-volume" type="range" min="0" max="100" step="1"></label></div><p class="sound-foot"></p></details>';
 const dock=document.createElement('div');dock.className='sound-dock';
 const settings=document.createElement('button');settings.type='button';settings.className='sound-menu-button';settings.textContent='⌄';settings.setAttribute('aria-expanded','false');settings.setAttribute('aria-controls','sound-popup');
 const toggle=panel.querySelector('.sound-master');dock.append(toggle,settings,panel);panel.id='sound-popup';panel.hidden=true;document.querySelector('.topbar nav').append(dock);
 const expand=open=>{panel.hidden=!open;settings.setAttribute('aria-expanded',String(open));};
 settings.onclick=()=>expand(panel.hidden);
 const outside=e=>{if(!dock.contains(e.target))expand(false);};
 const escape=e=>{if(e.key==='Escape'&&!panel.hidden){expand(false);settings.focus();}};
 document.addEventListener('pointerdown',outside);dock.addEventListener('keydown',escape);
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./audio.css',runtimeBase).href;document.head.insertBefore(css,document.querySelector('link[href$="upgrade.css"]'));
 const q=s=>panel.querySelector(s),master=toggle,status=q('.sound-status'),effects=q('.sound-effects'),music=q('.sound-music'),effectRange=q('#effects-volume'),musicRange=q('#music-volume');
 let preferences,unsaved=false,channel=null;
 try{preferences=JSON.parse(localStorage.getItem(SOUND_KEY));}catch{}
 const audio=new CompanionAudio({preferences:soundPreferences(preferences),onChange:()=>render()});
 const id=globalThis.crypto?.randomUUID?.()||String(Math.random());
 function connect(){if(channel)return;try{channel=new BroadcastChannel('squeek-sound-focus-v1');channel.onmessage=e=>{if(e.data?.type==='claim'&&e.data.id!==id)audio.yieldToOtherTab();};}catch{channel=null;}}
 const claim=()=>{connect();channel?.postMessage({type:'claim',id});};
 const text=(el,value)=>{if(el.textContent!==value)el.textContent=value;};
 function render(){
  const w=words[getLanguage()]||words.en,s=audio.status();
  panel.setAttribute('aria-label',w.title);panel.dataset.soundState=s;
  text(q('.sound-title'),w.title);text(q('.sound-track'),w.track);
  const action=s==='loading'?w.cancel:audio.active()?w.mute:['partial','blocked','other'].includes(s)?w.resume:w.enable;
  text(master,s==='loading'?'◌':audio.active()?'♫':'♪');
  master.setAttribute('aria-label',action);master.title=action;dock.dataset.soundState=s;
  settings.setAttribute('aria-label',w.settings);settings.title=w.settings;
  master.disabled=s==='unsupported';master.setAttribute('aria-pressed',String(audio.enabled));
  text(status,(w[s]||w.off)+(unsaved?' '+w.unsaved:''));q('.sound-retry').hidden=s!=='partial';text(q('.sound-retry'),w.retry);
  effects.checked=audio.prefs.effects;music.checked=audio.prefs.music;
  text(effects.nextElementSibling,w.effects);text(music.nextElementSibling,w.music);text(q('summary'),w.settings);text(q('.sound-foot'),w.foot);
  for(const [input,key,label]of [[effectRange,'effectsVolume',w.effectsVolume],[musicRange,'musicVolume',w.musicVolume]]){
   const v=Math.round(audio.prefs[key]*100);input.value=String(v);input.setAttribute('aria-label',label);input.setAttribute('aria-valuetext',`${v}%`);text(input.parentElement.querySelector('span'),label);text(input.parentElement.querySelector('output'),`${v}%`);
  }
 }
 function save(change){audio.setPreferences(change);try{localStorage.setItem(SOUND_KEY,JSON.stringify(audio.prefs));unsaved=false;}catch{unsaved=true;}render();}
 master.onclick=()=>{const s=audio.status();if(audio.active()||s==='loading'){audio.mute();return;}claim();void audio.enable();};
 q('.sound-retry').onclick=()=>{claim();void audio.enable();};
 effects.onchange=()=>save({effects:effects.checked});music.onchange=()=>save({music:music.checked});
 effectRange.oninput=()=>save({effectsVolume:Number(effectRange.value)/100});musicRange.oninput=()=>save({musicVolume:Number(musicRange.value)/100});
 const visibility=()=>audio.setVisible(!document.hidden);
 document.addEventListener('visibilitychange',visibility);connect();audio.setVisible(!document.hidden);
 bindPageLifecycle({pause(){audio.setVisible(false);channel?.close();channel=null;},resume(){connect();visibility();},destroy(){document.removeEventListener('visibilitychange',visibility);document.removeEventListener('pointerdown',outside);dock.removeEventListener('keydown',escape);channel?.close();audio.dispose();dock.remove();}});
 render();return {render(){audio.setQuiet(!!getState()?.pet?.life?.sleeping||isThinking());render();},command(action,before,after){const effect=soundForCommand(action,before,after);if(effect)void audio.play(effect);}};
}
