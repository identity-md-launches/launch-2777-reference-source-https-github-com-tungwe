import {growthDuration} from './growth-clock.mjs';
import {touchWords} from './touch-reactions.mjs';
const copy={
 en:{title:'Little rituals, bigger adventures',baby:'Little bean',young:'Milk mochi',junior:'Curious youngster',grown:'Lively youngster',star:'Little guardian',fullness:'Fullness',growth:'Growth',seed:'Seeds',carrot:'Carrot',berry:'Berry',pet:'Head scratches',play:'Paw-pattern game',none:'No accessory',bow:'Bow',flower:'Flower',crown:'Crown',wardrobe:'Dress up',next:'Next',complete:'All growth gifts unlocked!',snacky:'A little snack sounds nice.',content:'Comfy and content.',loved:'That head scratch was lovely.',playful:'In a playful mood!',digest:'Let me finish this bite',full:'Nice and full — let’s play instead.',ready:'Drag a snack to my mouth · or tap to feed.',watch:'Watch my three paw taps…',turn:'Your turn! Repeat the pattern.',won:'You remembered! Another happy moment.',retry:'Almost! We can try again. No points lost.',cancel:'Close game',hint:'Watch three glowing paws, then tap them in the same order. Keyboard: Tab + Enter.',note:'Grows with time, even offline (up to 7 days per absence). Interactions never speed up growth. Saved in this browser; no lost levels.',eat:'Nom nom… tiny snack, happy paws!',petSpeech:'Yes, right behind the ears!',evolved:'I grew! Look at my new little shape.',failed:'Couldn’t save that. Please try again.',wait:'Ready in',seconds:'s',locked:'Locked',pads:['Leaf','Moon','Star'],fed:'Shared a snack',evolveEvent:'Reached a new growth stage'},
 'zh-Hant':{title:'每天的小互動，慢慢一起長大',baby:'小豆豆',young:'奶糰子',junior:'好奇幼鼠',grown:'活力少年',star:'暖心守護者',fullness:'飽足度',growth:'成長',seed:'葵花籽',carrot:'紅蘿蔔',berry:'莓果',pet:'摸摸頭',play:'爪爪記憶遊戲',none:'不戴配件',bow:'蝴蝶結',flower:'小花',crown:'小皇冠',wardrobe:'換裝',next:'下一階段',complete:'成長禮物全部解鎖！',snacky:'來點小點心，好像不錯。',content:'現在很舒服，陪你待一下。',loved:'剛剛摸摸頭，好舒服。',playful:'有點想玩耍！',digest:'等我吃完這一口',full:'吃飽了，我們玩一下吧。',ready:'把點心拖到嘴邊餵我，也可以輕點餵食。',watch:'看好我的三下爪爪…',turn:'換你了！照順序按一次。',won:'記住了！又多了一個開心時刻。',retry:'差一點！可以再試，不扣成長。',cancel:'關閉遊戲',hint:'看三次亮起的爪爪，再依照順序點選。也可用 Tab 和 Enter 操作。',note:'隨時間慢慢長大，離線每次最多累積 7 天；互動不加速成長。進度存在此瀏覽器，離開不會退級。',eat:'嚼嚼…把小點心收進肚肚！',petSpeech:'對，就是耳朵後面那裡！',evolved:'我長大了！看看我的新模樣！',failed:'這次沒能存下來，請再試一次。',wait:'再等',seconds:'秒',locked:'尚未解鎖',pads:['葉子','月亮','星星'],fed:'一起吃了點心',evolveEvent:'成長到新階段'}
};
export function petText(lang,key){return (copy[lang]||copy.en)[key]||key;}
Object.assign(copy.en,{touchHint:'Choose Pet to stroke or hold; choose Turn to rotate.',nuzzle:['A little closer… that’s the spot.','Ear scratches? Excellent choice.','Tiny lean into your hand.'],tickle:['Eep! Ticklish tummy!','Hey! I nearly dropped my snack.','Hehe. My cheeks are wobbling.'],highfive:['High five! Tiny paw edition.','Paw to palm. We make a good team.','One more? ✋']});
Object.assign(copy['zh-Hant'],{touchHint:'選「撫摸」輕撫或長按；選「轉身」左右拖曳旋轉。',nuzzle:['再靠過去一點…嗯，就是那裡。','耳朵後面也要摸一下！','把小腦袋靠在你的手上。'],tickle:['吱！肚肚怕癢啦！','欸！差點把點心抖出來了。','嘿嘿，臉頰都跟著晃了。'],highfive:['擊掌！小小爪版本。','爪爪碰手心，我們很有默契。','再來一下？✋']});
export function initPet({overlay,getLanguage,getState,getNow,send}){
 const host=document.getElementById('companion');
 let pending=false,error=false,box=null,lastGameReady=0;
 const t=key=>petText(getLanguage(),key);
 if(!overlay){
  const hint=document.createElement('small');hint.className='touch-hint';host.after(hint);
 }
 if(!overlay){
  box=document.createElement('section');box.className='pet-care';
  box.innerHTML='<div class="care-heading"><h2></h2><strong id="growth-stage"></strong></div><p class="pet-mood"></p><div class="care-meters"><label><span id="full-label"></span><progress id="full-meter" max="100"></progress></label><label><span id="xp-label"></span><progress id="xp-meter" max="100"></progress></label></div><p class="next-growth"></p><p class="growth-pace"></p><div class="food-tray"><button data-food="seed">🌻 <span></span><small>+18</small></button><button data-food="carrot">🥕 <span></span><small>+24</small></button><button data-food="berry">🫐 <span></span><small>+12</small></button></div><p class="care-feedback" role="status"></p><div class="care-actions"><button id="pet-touch"></button><button id="pet-play"></button></div><section class="paw-game" hidden><p role="status"></p><div class="paw-pads"><button data-pad="0">❧</button><button data-pad="1">☾</button><button data-pad="2">★</button></div><small></small><button id="pet-cancel" class="quiet"></button></section><label class="wardrobe"><span></span><select id="pet-accessory"><option value="none"></option><option value="bow"></option><option value="flower"></option><option value="crown"></option></select></label><small class="pet-note"></small>';
  document.querySelector('.stage-foot').after(box);
  const act=async(action,args)=>{if(pending)return;pending=true;error=false;render();try{error=!(await send(action,args));}finally{pending=false;render();}};
  box.querySelectorAll('[data-food]').forEach(b=>b.onclick=()=>act('feed',{food:b.dataset.food}));
  box.querySelector('#pet-touch').onclick=()=>act('pet');
  box.querySelector('#pet-play').onclick=()=>act('play-start');
  box.querySelector('#pet-cancel').onclick=()=>act('play-cancel');
  box.querySelectorAll('[data-pad]').forEach(b=>b.onclick=()=>act('play-tap',{pad:Number(b.dataset.pad)}));
  box.querySelector('select').onchange=e=>act('accessory',{item:e.target.value});
 }
 function render(){
  const s=getState(),p=s?.pet;if(!p)return;const now=getNow(),gameActive=['watch','playing'].includes(p.game?.phase)||['watch','choose'].includes(p.hunt?.phase),eating=s.cue?.type==='eat'&&now-s.cue.at<4500;
  host.dataset.growth=p.stage;host.dataset.accessory=p.accessory;host.classList.toggle('eating',eating);
  const touch=s.cue&&now-s.cue.at<2200&&['nuzzle','tickle','highfive'].includes(s.cue.type)?s.cue.type:'';
  host.dataset.touch=touch;host.style.setProperty('--touch-flip',s.cue?.variant===1?'-1':'1');
  if(!overlay)document.querySelector('.touch-hint').textContent=t('touchHint');

  if(!box)return;const q=selector=>box.querySelector(selector),cool=Math.max(0,Math.ceil((p.cooldownUntil-now)/1000)),touchCool=Math.max(0,Math.ceil((p.petCooldownUntil-now)/1000)),playCool=Math.max(0,Math.ceil((p.playCooldownUntil-now)/1000));
  q('h2').textContent=t('title');q('#growth-stage').textContent=t(p.stage);q('.pet-mood').textContent=t(p.mood);
  q('#full-label').textContent=t('fullness')+' · '+Math.round(p.fullness)+'%';q('#full-meter').value=p.fullness;
  const zh=getLanguage()==='zh-Hant';q('#xp-label').textContent=(zh?'陪伴成長':'Time together')+' · '+growthDuration(p.xp,zh);q('#xp-meter').value=p.nextXp?100*(p.xp-p.stageStart)/(p.nextXp-p.stageStart):100;
  q('.next-growth').textContent=p.nextStage?t('next')+': '+t(p.nextStage)+({young:'bow',grown:'flower',star:'crown'}[p.nextStage]?' · '+t({young:'bow',grown:'flower',star:'crown'}[p.nextStage]):''):t('complete');
  q('.growth-pace').textContent=(zh?'成長里程碑：累計 1／3／7／21 天。':'Growth milestones: 1 / 3 / 7 / 21 cumulative days.')+(p.growth?.legacyXp>0?(zh?' 已保留原有成長進度。':' Previous growth progress retained.'):'');
  if(p.nextStage)q('.next-growth').textContent+=' · '+(zh?'再陪伴約 ':'About ')+growthDuration(p.nextXp-p.xp,zh)+(zh?'':' to go');
  q('.care-feedback').textContent=error?t('failed'):cool?t('digest')+' · '+cool+' '+t('seconds'):p.fullness>80?t('full'):t('ready');
  box.querySelectorAll('[data-food]').forEach(b=>{b.querySelector('span').textContent=t(b.dataset.food);b.disabled=pending||cool>0||p.fullness>80||p.life?.sleeping||gameActive;b.title=t('fullness')+' +'+({seed:18,carrot:24,berry:12}[b.dataset.food]);b.querySelector('small').textContent=t('fullness')+' +'+({seed:18,carrot:24,berry:12}[b.dataset.food]);});
  q('#pet-touch').textContent='♡ '+t('pet')+(touchCool?' · '+touchCool+' '+t('seconds'):'');q('#pet-touch').disabled=pending||touchCool>0||p.life?.sleeping||gameActive||eating;
  q('#pet-play').textContent='✦ '+t('play')+(playCool?' · '+playCool+' '+t('seconds'):'');q('#pet-play').disabled=pending||playCool>0||p.life?.sleeping||eating||['watch','choose'].includes(p.hunt?.phase)||['watch','playing'].includes(p.game?.phase);
  q('.paw-game').hidden=!p.game;
  if(p.game?.phase==='watch'&&p.game.readyAt!==lastGameReady){lastGameReady=p.game.readyAt;q('.paw-game').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  if(p.game){const g=p.game,watch=g.phase==='watch'&&now<g.readyAt,index=Math.floor((now-(g.readyAt-4200))/1400),lit=watch&&((now-(g.readyAt-4200))%1400)<1050?g.sequence?.[index]:null;
   q('.paw-game p').textContent=t(watch?'watch':g.phase==='won'?'won':g.phase==='retry'?'retry':'turn')+(!watch&&g.phase==='playing'?' '+g.step+'/3':'');
   box.querySelectorAll('[data-pad]').forEach(b=>{b.classList.toggle('lit',Number(b.dataset.pad)===lit);b.setAttribute('aria-label',t('pads')[Number(b.dataset.pad)]);b.disabled=pending||watch||g.phase!=='playing';});
  }
  q('.paw-game small').textContent=t('hint');q('#pet-cancel').textContent=t('cancel');
  q('.wardrobe span').textContent=t('wardrobe');q('select').value=p.accessory;q('select').disabled=pending;
  q('select').querySelectorAll('option').forEach(o=>{o.disabled=!p.unlocked.includes(o.value);o.textContent=t(o.value)+(o.disabled?' · '+t('locked'):'');});
  q('.pet-note').textContent=s.saving===false?(getLanguage()==='zh-Hant'?'目前是暫存遊玩模式，進度只留在本分頁。':'Temporary play: progress stays only in this tab.'):t('note');
 }
 setInterval(render,1000);
 if(!overlay)setInterval(()=>{const g=getState()?.pet?.game;if(!g||!box)return;const now=getNow(),elapsed=now-(g.readyAt-4200),lit=g.phase==='watch'&&now<g.readyAt&&elapsed%1400<1050?g.sequence?.[Math.floor(elapsed/1400)]:null;box.querySelectorAll('[data-pad]').forEach(b=>b.classList.toggle('lit',Number(b.dataset.pad)===lit));},100);
 return {render,speech(){const s=getState(),now=getNow();if(!s)return null;if(s.cue&&now-s.cue.at<4500){if(s.cue.touch)return touchWords(s.cue.type,getLanguage())?.speech;if(['nuzzle','tickle','highfive'].includes(s.cue.type))return t(s.cue.type)[s.cue.variant||0];if(s.cue.type==='eat')return t('eat');if(s.cue.type==='pet')return t('petSpeech');}const evolution=s.events.find(e=>e.type==='evolved'&&now-e.at<6500);if(evolution)return t('evolved');return null;}};
}
