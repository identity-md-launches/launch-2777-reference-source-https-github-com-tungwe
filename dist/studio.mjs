import {runtimeBase} from './runtime-base.mjs';
import {initChainUI} from './chain-ui.mjs';
import {initSound} from './audio-ui.mjs';
import {initTouchUI} from './touch-ui.mjs';
import {translate} from './companion-i18n.mjs';
import {initChat} from './browser-chat.mjs';
import {startPublicSession} from './public-runtime.mjs';
import {initPet} from './pet-ui.mjs';
import {initLife} from './life-ui.mjs';
import {initCharacterView} from './character-view.mjs';
let petUI=null,lifeUI=null,touchUI=null,soundUI=null;
const $=id=>document.getElementById(id),overlay=document.body.classList.contains('overlay-only');
let chainUI=null;let chat=null;let lang='en';try{lang=localStorage.getItem('squeek-companion-language')==='zh-Hant'?'zh-Hant':'en';}catch{}
if(overlay)lang=new URLSearchParams(location.search).get('lang')==='zh-Hant'?'zh-Hant':'en';
const t=k=>translate(lang,k);let state=null,lastFrame=0,streamOnline=false,initialized=false,lastFeed='',feedbackKey='';
// Five owner-created Tripo models; the character is exclusively 3D.
$('companion').innerHTML=`<div class="speech" id="speech" role="status"></div><div class="pet-scene"><div class="sparkles" aria-hidden="true">✦ <span>♥</span> ✦</div><div class="model-mount"></div><div class="pet-name" id="pet-name">Pip</div></div>`;
const caption=document.createElement('div');caption.className='lower-third';caption.hidden=true;$('companion').append(caption);
function localize(){document.documentElement.lang=lang;document.title=t(overlay?'overlayTitle':'title');document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));if(!overlay){$('language').value=lang;const url=new URL('./overlay/',runtimeBase);url.searchParams.set('lang',lang);if($('companion').dataset.renderer==='3d')url.searchParams.set('character','3d');$('overlay-url').value=url.href;$('overlay-link').href=url.href;$('feedback').textContent=t(feedbackKey);lastFeed='';}render();chat?.localize();chainUI?.localize();}
function estimatedNow(){return state?state.at+Math.max(0,Date.now()-lastFrame):Date.now();}
function render(){
 const online=streamOnline&&Date.now()-lastFrame<8000,s=state,ready=online&&s?.connection==='connected',now=estimatedNow();
 const status=!online?'disconnected':s?.mode==='rehearsal'?'rehearsal':s?.connection??'waiting';
 $('connection').textContent=t(status);$('connection').className='status '+status;
 if(!s){$('speech').textContent=t('overlayWaiting');return;}
 const recent=s.cue&&now-s.cue.at<4500?s.cue.type:null;
 const event=s.events[0],auto=event&&now-event.at<6500&&['goal','block'].includes(event.type)?event.type:null;
 const moving=ready&&s.sample?.rpm>0&&s.scene!=='break';
 const classes=$('companion').classList;classes.add('companion');classes.toggle('moving',!!moving);classes.toggle('resting',!moving);classes.toggle('reaction',!!(recent||auto));classes.toggle('taking-break',s.scene==='break');classes.toggle('chat-thinking',!!chat?.isThinking());
 let speech=!ready?'unknown':s.scene==='break'?'break':s.scene==='focus'?'focus':moving?'running':'resting';
 if(recent)speech=recent+'Speech';else if(auto&&ready)speech=auto+'Speech';
 $('speech').textContent=lifeUI?.speech()||petUI?.speech()||chat?.speech()||t(speech);$('pet-name').textContent=s.name;caption.textContent=s.message;caption.hidden=!s.message;

 petUI?.render();
 lifeUI?.render();
 touchUI?.render();
 soundUI?.render();
 const goal=s.goal,goalText=goal?`${Math.floor(goal.progress)} / ${goal.target} ${t('metres')}`:t('noGoal');
 if(overlay){$('overlay-goal').textContent=goal?`${t(goal.state==='complete'?'goalComplete':'goalActive')} · ${goalText}`:'';return;}
 $('cheers').textContent=s.cheers;$('cheer').textContent=t('cheer').replace('Pip',s.name);
 $('reading').textContent=ready?`${s.sample.rpm.toFixed(1)} ${t('rpm')} · ${new Date(s.sample.observedAt||s.sample.at).toLocaleTimeString(lang==='en'?'en-GB':'zh-TW',{hour12:false})}`:t('unknown');
 $('goal-number').textContent=goal?goalText:'—';$('goal-label').textContent=t(!goal?'noGoal':goal.state==='complete'?'goalComplete':'goalActive');$('goal-progress').value=goal?Math.min(100,100*goal.progress/goal.target):0;
 $('start-goal').textContent=t(goal?'restart':'start');$('cancel-goal').disabled=!goal||!online;
 const guess=s.guess;
 $('guess-status').textContent=!guess?t('noGuess'):guess.state==='pending'?`${t('prediction')}: ${t(guess.choice==='running'?'chooseRun':'chooseRest')} · ${now<guess.endsAt?Math.ceil((guess.endsAt-now)/1000)+' '+t('remaining'):t('gamePending')}`:t(guess.state);
 document.querySelectorAll('[data-guess]').forEach(el=>el.disabled=!ready||guess?.state==='pending');$('score').textContent=`${s.score.wins} / ${s.score.played}`;
 if(!initialized){$('name').value=s.name;$('scene').value=s.scene;$('message').value=s.message;initialized=true;}
 $('mode').value=s.mode;
 for(const el of [$('cheer'),$('start-goal'),$('settings').querySelector('button'),$('mode'),...document.querySelectorAll('[data-cue]')])el.disabled=!online||((el===$('cheer')||el.dataset.cue)&&!!(s.pet?.life?.sleeping||recent==='eat'||['watch','playing'].includes(s.pet?.game?.phase)||['watch','choose'].includes(s.pet?.hunt?.phase)));
 const signature=JSON.stringify(s.events)+lang;
 if(signature!==lastFeed){lastFeed=signature;$('events').replaceChildren();const names={fed:'eventFed',evolved:'eventEvolved',running:'eventRunning',resting:'eventResting',block:'eventBlock',cheer:'eventCheer',cue:'eventCue',goal:'eventGoal','goal-start':'eventStart',guess:'eventGuess',mode:'eventMode'};
  for(const event of s.events.slice(0,8)){const li=document.createElement('li'),stamp=document.createElement('time'),label=document.createElement('span');stamp.dateTime=new Date(event.at).toISOString();stamp.textContent=new Date(event.at).toLocaleTimeString(lang==='en'?'en-GB':'zh-TW',{hour12:false});label.textContent=t(names[event.type])+ (event.count?' +'+event.count:'')+(event.target?' · '+event.target+' '+t('metres'):'')+(event.result?' · '+t(event.result):'')+(event.cue?' · '+t(event.cue):'')+(event.mode?' · '+t(event.mode==='live'?'live':'rehearsal'):'');li.append(stamp,label);$('events').append(li);}
  if(!s.events.length){const li=document.createElement('li');li.textContent=t('noEvents');$('events').append(li);}
 }
}
function feedback(key){feedbackKey=key;if(!overlay)$('feedback').textContent=t(key);}
async function command(action,args){try{const before=state,after=await session.command(action,args);soundUI?.command(action,before,after);feedback(action==='settings'?'saved':'');return true;}catch{feedback('failed');return false;}}
if(!overlay){
 $('language').addEventListener('change',()=>{lang=$('language').value;try{localStorage.setItem('squeek-companion-language',lang);}catch{}localize();});
 $('settings').addEventListener('submit',event=>{event.preventDefault();void command('settings',{name:$('name').value,message:$('message').value,scene:$('scene').value});});
 $('cheer').addEventListener('click',()=>command('cheer'));
 document.querySelectorAll('[data-cue]').forEach(el=>el.addEventListener('click',()=>command('cue',{type:el.dataset.cue})));
 document.querySelectorAll('[data-guess]').forEach(el=>el.addEventListener('click',()=>command('guess',{choice:el.dataset.guess})));
 $('start-goal').addEventListener('click',()=>command('goal',{target:Number($('target').value)}));$('cancel-goal').addEventListener('click',()=>command('cancel-goal'));
 $('mode').addEventListener('change',()=>command('mode',{mode:$('mode').value}));
 $('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('overlay-url').value);feedback('copied');}catch{feedback('copyFail');$('overlay-url').select();}});
 $('export').addEventListener('click',()=>{if(!state)return;const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString(),scope:'Local host session; not viewer analytics, onchain activity or official eligibility proof.'},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`squeek-companion-${state.mode}-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
}
const session=startPublicSession({overlay,onState:value=>{state=value;lastFrame=Date.now();streamOnline=true;render();}});
if(!overlay)chat=initChat({getLanguage:()=>lang,getState:()=>state});
petUI=initPet({overlay,getLanguage:()=>lang,getState:()=>state,getNow:estimatedNow,send:command});
lifeUI=initLife({overlay,getLanguage:()=>lang,getState:()=>state,getNow:estimatedNow,send:command});
if(!overlay)chainUI=initChainUI({getLanguage:()=>lang,getState:()=>state,getNow:estimatedNow,isThinking:()=>!!(chat?.isThinking()||chat?.speech())});
touchUI=initTouchUI({overlay,getLanguage:()=>lang,getState:()=>state,getNow:estimatedNow,send:command});
if(!overlay)soundUI=initSound({getLanguage:()=>lang,getState:()=>state,isThinking:()=>!!chat?.isThinking()});
void initCharacterView({overlay,getLanguage:()=>lang,getState:()=>state,getNow:estimatedNow,send:command}).catch(()=>{});
localize();setInterval(render,1000);

