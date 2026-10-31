import {runtimeBase} from './runtime-base.mjs';
import {mouthContains} from './feeding.mjs';
import {MEMORIES} from './life-engine.mjs';
const words={
 en:{title:'A little closer, every day',bond:'Bond',energy:'Energy',bondNames:['Getting to know you','Little friends','Best buddies','Inseparable paws'],cuddle:'Cuddle',brush:'Brush fur',ball:'Roll a ball',dance:'Dance together',nap:'Tuck in',wake:'Wake gently',hunt:'Find the seed',close:'Close game',wishTitle:'Three little wishes',wishKinds:['A snack','A gentle touch','Play together'],wishNote:'Complete three little rituals to keep a happy memory. No streaks, no pressure.',wishDone:'Today’s wishes came true! A happy memory saved.',album:'Our little memories',locked:'A memory still to make',memories:['First shared snack','First cuddle','Freshly brushed','Our first ball game','Our little dance','A cozy nap','Seed detective','A lovely day'],hint:'Choose Pet to stroke or hold; choose Turn to rotate.',wantSnack:'My cheeks have room for a little snack.',wantRest:'A little sleepy… tuck me in?',wantLove:'Could I have a little cuddle?',wantPlay:'Shall we find a seed together?',sleeping:'Shhh… a tiny dream is growing. Tap me to wake.',watch:'Watch where I hide the seed…',choose:'Which cup has my seed? Take your time.',won:'Found it! Tiny detective, big celebration.',miss:'There it is! We’ll find it together next time.',cup:'Cup',huntWait:'New round in',seconds:'s',notSaved:'That didn’t save. Please try again.',restFirst:'A cozy nap first? I need a little energy.',finishFirst:'Finish or close our little game first.',dropped:'Bring the snack to my mouth, then let go.',cooldown:'Still happy to play! Take a little moment between care rituals.',
 speech:{stroke:'Mmm… I’m leaning into your hand. ♡',cuddle:'Your hands feel like a tiny warm blanket.',brush:'Fluff, fluff… am I looking extra soft?',ball:'Boop! Sending the ball right back to you.',dance:'One tiny step… two tiny steps… your turn!',nap:'Keep me company while I dream of seeds?',wake:'Big stretch! Did you save a cuddle for me?','hunt-start':'I’m hiding a seed. Keep your eyes on the cups!','hunt-win':'You found my secret snack! We make a great team.','hunt-miss':'A little surprise under the other cup. Try again with me?'}},
 'zh-Hant':{title:'每天，再靠近一點點',bond:'親密度',energy:'精神',bondNames:['慢慢認識你','小小好朋友','最好的夥伴','黏人的小爪爪'],cuddle:'抱抱',brush:'梳梳毛',ball:'一起滾球',dance:'一起跳舞',nap:'蓋被睡覺',wake:'輕輕叫醒',hunt:'找找葵花籽',close:'關閉遊戲',wishTitle:'今天的三個小心願',wishKinds:['吃個點心','溫柔摸摸','一起玩耍'],wishNote:'完成三項會留下幸福回憶，不必連續打卡，也不影響成長速度。',wishDone:'今天的心願都實現了！留下幸福回憶。',album:'我們的小小回憶',locked:'還沒一起留下的回憶',memories:['第一次分享點心','第一次抱抱','毛毛梳好了','第一次一起滾球','我們的小小舞蹈','舒服的小午睡','找到秘密點心','幸福的一天'],hint:'選「撫摸」輕撫或長按；選「轉身」左右拖曳旋轉。',wantSnack:'臉頰裡，還有一點點心的位置。',wantRest:'有一點睏…幫我蓋被被好嗎？',wantLove:'可以再給我一個小小的抱抱嗎？',wantPlay:'陪我找找藏起來的葵花籽吧！',sleeping:'噓…正在做小小的夢，點我就會醒來。',watch:'看好，我把葵花籽藏在這裡…',choose:'哪個杯子裡有葵花籽？慢慢想，不限時。',won:'找到了！我們的小小偵探！',miss:'原來在這裡！下次再一起找，不扣成長。',cup:'杯子',huntWait:'下一局還要',seconds:'秒',notSaved:'這次沒有存成功，請再試一次。',restFirst:'先睡個小覺好嗎？我需要一點精神。',finishFirst:'先完成或關閉現在的小遊戲吧。',dropped:'把點心拖到嘴邊，再放開餵我。',cooldown:'還想繼續陪你玩！照顧回饋稍等一下就恢復。',
 speech:{stroke:'嗯…把頭靠在你的手心裡。♡',cuddle:'你的手，好像一條暖暖的小毯子。',brush:'梳梳、蓬蓬…現在是不是更軟了？',ball:'啵！小球滾回去，換你啦！',dance:'小腳一步、兩步…你也一起跳！',nap:'陪我做一個裝滿葵花籽的夢吧。',wake:'伸個大懶腰！有沒有幫我留一個抱抱？','hunt-start':'我要藏點心囉，看好小杯子！','hunt-win':'秘密點心找到了！我們真有默契。','hunt-miss':'在另一個杯子裡耶，再陪我找一次好嗎？'}}
};
const icons={cuddle:'♡',brush:'🪮',ball:'🧶',dance:'♫',nap:'☾',wake:'☀',hunt:'🌻'};
export function initLife({overlay,getLanguage,getState,getNow,send}){
 const host=document.getElementById('companion'),scene=host.querySelector('.pet-scene');
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./life.css',runtimeBase).href;document.head.insertBefore(css,document.querySelector('link[href$="upgrade.css"]'));
 const fx=document.createElement('div');fx.className='life-fx';fx.setAttribute('aria-hidden','true');fx.innerHTML='<span class="life-hearts">♡<i>♡</i>♡</span><span class="life-brush">🪮</span><span class="life-ball">🧶</span><span class="life-notes">♫<i>♪</i>♫</span><span class="life-dream">z<span>z</span>Z</span><span class="life-blanket"></span>';scene.append(fx);
 let box=null,feedback='',feedbackAt=0,drag=null,skipClickUntil=0,pending=false;
 const t=()=>words[getLanguage()]||words.en;
 const speak=(message)=>{feedback=message;feedbackAt=getNow();};
 async function act(action,args){
  const p=getState()?.pet;if(!p||pending)return false;
  const cue=getState()?.cue;if(cue?.type==='eat'&&getNow()-cue.at<4000){speak(getLanguage()==='zh-Hant'?'等我把這一口吃完…':'Let me finish this little bite…');render();return false;}
  if(p.life.sleeping&&action!=='wake'&&action!=='hunt-close'){speak(t().sleeping);render();return false;}
  if(['ball','dance','hunt-start'].includes(action)&&p.life.energy<10){speak(t().restFirst);render();return false;}
  if(!['hunt-pick','hunt-close'].includes(action)&&(p.game?.phase==='watch'||p.game?.phase==='playing'||['watch','choose'].includes(p.hunt?.phase))){speak(t().finishFirst);render();return false;}
  pending=true;render();try{const ok=await send(action,args);if(!ok)speak(t().notSaved);else feedback='';return ok;}finally{pending=false;render();}
 }
 if(!overlay){
  const tabs=document.createElement('nav');tabs.className='pet-tabs';tabs.innerHTML='<a href="#companion" class="care-jump"></a><a href="#chat-title" class="chat-jump"></a>';document.querySelector('.intro').append(tabs);
  box=document.createElement('section');box.className='life-care';box.setAttribute('aria-label','Care & play');
  box.innerHTML=`<div class="life-title"><h2></h2><span class="bond-name"></span></div><div class="life-meters"><label><span class="bond-label"></span><progress class="bond-meter" max="100"></progress></label><label><span class="energy-label"></span><progress class="energy-meter" max="100"></progress></label></div><p class="life-request"></p><div class="life-tools">${['cuddle','brush','ball','dance','nap','hunt'].map(a=>`<button type="button" data-care="${a}"><span aria-hidden="true">${icons[a]}</span><b></b></button>`).join('')}</div><p class="life-feedback" role="status"></p><section class="seed-hunt" hidden><p role="status"></p><div class="seed-cups">${[0,1,2].map(n=>`<button type="button" data-cup="${n}"><span class="cup-art" aria-hidden="true">▰</span><span class="hidden-seed" aria-hidden="true">🌻</span><b>${n+1}</b></button>`).join('')}</div><button type="button" class="quiet hunt-close"></button></section><div class="life-wishes"><strong></strong><div>${['snack','love','play'].map(k=>`<span data-wish="${k}"></span>`).join('')}</div><small></small></div><details class="life-album"><summary></summary><ol>${MEMORIES.map(k=>`<li data-memory="${k}"></li>`).join('')}</ol></details>`;
  document.querySelector('.care-feedback').after(box);
  box.querySelectorAll('[data-care]').forEach(b=>b.onclick=()=>{const action=b.dataset.care==='nap'&&getState()?.pet.life.sleeping?'wake':b.dataset.care==='hunt'?'hunt-start':b.dataset.care;void act(action);});
  box.querySelectorAll('[data-cup]').forEach(b=>b.onclick=()=>void act('hunt-pick',{cup:Number(b.dataset.cup)}));box.querySelector('.hunt-close').onclick=()=>void act('hunt-close');
  // Pointer capture keeps mouse and touch drags attached to the original food.
  const finishDrag=()=>{const d=drag;drag=null;d?.el?.remove();host.classList.remove('snack-near','feeding-drag');if(d?.el)skipClickUntil=Date.now()+600;if(d?.button.hasPointerCapture(d.id))d.button.releasePointerCapture(d.id);return d;};
  document.querySelectorAll('[data-food]').forEach(b=>{
   b.addEventListener('click',e=>{if(Date.now()<skipClickUntil){e.stopImmediatePropagation();e.preventDefault();}},true);
   b.addEventListener('dragstart',e=>e.preventDefault());
   b.addEventListener('pointerdown',e=>{if(b.disabled||e.button!==0||!e.isPrimary||drag)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,food:b.dataset.food,button:b,el:null};b.setPointerCapture(e.pointerId);});
   b.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;
    if(!drag.el&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){drag.el=document.createElement('span');drag.el.className='drag-snack';drag.el.setAttribute('aria-hidden','true');drag.el.textContent={seed:'🌻',carrot:'🥕',berry:'🫐'}[drag.food];document.body.append(drag.el);host.classList.add('feeding-drag');}
    if(drag.el){drag.el.style.left=e.clientX+'px';drag.el.style.top=e.clientY+'px';const near=mouthContains(e.clientX,e.clientY);host.classList.toggle('snack-near',near);drag.el.classList.toggle('ready-to-feed',near);}
   });
   b.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const accepted=mouthContains(e.clientX,e.clientY),d=finishDrag();if(!d.el)return;if(accepted)void act('feed',{food:d.food});else{speak(t().dropped);render();}});
   b.addEventListener('pointercancel',e=>{if(drag?.id===e.pointerId)finishDrag();});
   b.addEventListener('lostpointercapture',e=>{if(drag?.id===e.pointerId)finishDrag();});
  });
  addEventListener('blur',finishDrag);document.addEventListener('visibilitychange',()=>{if(document.hidden)finishDrag();});

 }
 function render(){const s=getState(),p=s?.pet;if(!p?.life)return;const l=p.life,now=getNow(),w=t();
  const cue=s.cue&&now-s.cue.at<4500?s.cue.type:'';host.dataset.life=cue;host.dataset.sleeping=String(l.sleeping);
  if(!box)return;const zh=getLanguage()==='zh-Hant';box.setAttribute('aria-label',zh?'照顧與玩耍':'Care & play');document.querySelector('.care-jump').textContent=zh?'♡ 照顧與玩耍':'♡ Care & play';document.querySelector('.chat-jump').textContent=zh?'和 Pip 聊天 →':'Chat with Pip →';const q=sel=>box.querySelector(sel);
  q('h2').textContent=w.title;q('.bond-name').textContent=w.bondNames[Math.min(3,Math.floor(l.bond/25))];q('.bond-label').textContent=`${w.bond} · ${Math.round(l.bond)}%`;q('.bond-meter').value=l.bond;q('.energy-label').textContent=`${w.energy} · ${Math.round(l.energy)}%`;q('.energy-meter').value=l.energy;
  q('.life-request').textContent=l.sleeping?w.sleeping:l.energy<25?w.wantRest:p.fullness<25?w.wantSnack:!l.wishes.includes('love')?w.wantLove:w.wantPlay;
  q('.life-feedback').textContent=now-feedbackAt<5500?feedback:'';
  box.querySelectorAll('[data-care]').forEach(b=>{const k=b.dataset.care,a=k==='nap'&&l.sleeping?'wake':k;b.querySelector('b').textContent=w[a];b.querySelector('span').textContent=icons[a];b.disabled=pending||(l.sleeping&&a!=='wake')||cue==='eat'||['watch','playing'].includes(p.game?.phase)||['watch','choose'].includes(p.hunt?.phase);
   if(k==='hunt'){const delay=Math.max(0,Math.ceil(((l.rewards.hunt??-Infinity)+20000-now)/1000));b.disabled||=delay>0||['watch','choose'].includes(p.hunt?.phase);if(delay)b.querySelector('b').textContent=`${w.hunt} · ${delay}${w.seconds}`;}
  });
  const g=p.hunt;q('.seed-hunt').hidden=!g;
  if(g){q('.seed-hunt p').textContent=w[g.phase];q('.hunt-close').textContent=w.close;box.querySelectorAll('[data-cup]').forEach(b=>{const n=Number(b.dataset.cup);b.disabled=pending||g.phase!=='choose';b.classList.toggle('revealed',(g.phase==='watch'||['won','miss'].includes(g.phase))&&n===g.answer);b.classList.toggle('picked',g.picked===n);b.setAttribute('aria-label',`${w.cup} ${n+1}${g.phase==='watch'&&n===g.answer?' · 🌻':''}`);});}
  q('.life-wishes strong').textContent=`${w.wishTitle} · ${l.wishes.length}/3`;box.querySelectorAll('[data-wish]').forEach((el,i)=>{const done=l.wishes.includes(el.dataset.wish);el.textContent=`${done?'✓':'○'} ${w.wishKinds[i]}`;el.classList.toggle('done',done);});q('.life-wishes small').textContent=l.claimed?w.wishDone:w.wishNote;
  q('summary').textContent=`${w.album} · ${l.memories.length}/${MEMORIES.length}`;box.querySelectorAll('[data-memory]').forEach((el,i)=>{const done=l.memories.includes(el.dataset.memory);el.classList.toggle('earned',done);el.textContent=done?'✦ '+w.memories[i]:'○ '+w.memories[i];el.title=done?w.memories[i]:w.locked;});
  document.querySelector('.touch-hint').textContent=w.hint;
 }
 return {render,speech(){const s=getState();if(!s?.pet.life)return null;const now=getNow();if(s.cue&&now-s.cue.at<4500&&t().speech[s.cue.type])return t().speech[s.cue.type];if(s.pet.life.sleeping)return t().sleeping;return null;}};
}
