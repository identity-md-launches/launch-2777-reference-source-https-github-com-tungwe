import {touchWords} from './touch-reactions.mjs';
export function initTouchUI({overlay,getLanguage,getState,getNow,send}){
 const host=document.querySelector('#companion'),fx=document.createElement('div');fx.className='touch-fx';fx.setAttribute('aria-hidden','true');
 fx.innerHTML='<i></i><i></i><i></i><span></span>';host.querySelector('.pet-scene').append(fx);
 let lastCue='';
 function render(){const zh=getLanguage()==='zh-Hant',s=getState(),cue=s?.cue,active=cue?.touch&&getNow()-cue.at<2800,words=active?touchWords(cue.type,getLanguage()):null;
  fx.hidden=!words;host.dataset.touchReaction=words?cue.type:'';
  if(words){fx.querySelector('span').textContent=words.name;fx.querySelectorAll('i').forEach(e=>e.textContent=words.icon);const key=cue.at+cue.type;if(lastCue!==key){lastCue=key;fx.getAnimations({subtree:true}).forEach(a=>a.cancel());if(!matchMedia('(prefers-reduced-motion: reduce)').matches)for(const el of fx.querySelectorAll('i'))el.animate([{opacity:0,transform:'translateY(15px) scale(.6)'},{opacity:1,offset:.25},{opacity:0,transform:'translateY(-40px) scale(1.15)'}],{duration:1800,easing:'ease-out'});}}

 }
 return {render};
}
