import {Companion} from './companion-engine.mjs';
import {Pet} from './pet-engine.mjs';
import {Source} from './data.mjs';
import {PET_KEY} from './browser-storage.mjs';
import {refreshPet,savedCommand} from './session-store.mjs';
import {bindPageLifecycle} from './page-lifecycle.mjs';
export function startPublicSession({overlay,onState}){
 const engine=new Companion(),source=new Source('status');
 let busy=false,simulation=0,lastStudio=0,remote=null,storageOK=true,paused=false,dead=false,timer=null,channel=null;
 function warning(message){let box=document.querySelector('.storage-warning');if(!box){box=document.createElement('p');box.className='storage-warning';document.querySelector('main')?.prepend(box);}box.textContent=message;}
 try{
  engine.pet=new Pet({file:PET_KEY});
  if(!overlay&&!globalThis.navigator?.locks?.request){engine.pet.file=null;storageOK=false;warning('Safe saving is unavailable in this browser. This tab is temporary; your existing save is preserved. Use an up-to-date browser over HTTPS to save.\n此瀏覽器不支援安全儲存，本分頁的進度不會儲存；原有存檔保留。請使用新版瀏覽器及 HTTPS。');}
 }catch{storageOK=false;engine.pet=new Pet();warning('Browser save unavailable or damaged. Playing without saving; existing data was preserved.\n瀏覽器存檔無法讀取，暫以不儲存模式遊玩，原始資料未覆蓋。');}
 const publish=()=>{if(paused||dead)return;const snapshot=overlay&&remote&&Date.now()-lastStudio<5000?remote:engine.snapshot();snapshot.saving=storageOK;onState(snapshot);if(!overlay)channel?.postMessage({kind:'studio-state',state:snapshot});};
 function connect(){if(channel)return;try{channel=new BroadcastChannel('squeek-public-session-v1');if(overlay)channel.onmessage=event=>{if(event.data?.kind==='studio-state'&&event.data.state?.version===1){remote=event.data.state;lastStudio=Date.now();publish();}};}catch{channel=null;}}
 async function poll(){if(globalThis.document?.hidden||paused||dead||busy||engine.mode!=='live'||(overlay&&remote&&Date.now()-lastStudio<5000))return;busy=true;try{await source.refresh();if(!globalThis.document?.hidden&&!paused&&!dead&&engine.mode==='live')engine.ingest(source.data,source.error);}finally{busy=false;publish();}}
 function refresh(){if(!storageOK)return;try{refreshPet(engine);}catch{warning('The latest browser save could not be read. Please reload before saving again.\n最新存檔無法讀取，請重新整理後再儲存。');}}
 let settling=false,lastSettlement=-Infinity;
 async function settle(){if(overlay||paused||dead||settling||Date.now()-lastSettlement<30000)return;settling=true;try{await savedCommand(engine,'grow');lastSettlement=Date.now();publish();}catch{lastSettlement=Date.now();warning('Growth could not be saved. Your existing save is preserved.\n成長暫時未能儲存，原有存檔已保留。');}finally{settling=false;}}
 const storageChanged=event=>{if(event.key!==PET_KEY||!storageOK||paused||dead)return;refresh();publish();};
 addEventListener('storage',storageChanged);
 const tick=()=>{if(globalThis.document?.hidden||paused||dead)return;if(engine.mode==='rehearsal'){simulation++;const at=new Date().toISOString();engine.ingest({measurement:{freshness:'online',receivedAt:at,observedAt:at,staleAfterSeconds:10,rpmMilli:simulation%12<9?65000:0,distanceMm:String(simulation*10000)},builder:{anchor:{blockHeight:String(100+Math.floor(simulation/10))}}});}else void poll();publish();};
 function start(){paused=false;connect();if(timer===null)timer=setInterval(()=>{tick();void settle();},2000);void settle();}
 function pause(){paused=true;if(timer!==null){clearInterval(timer);timer=null;}channel?.close();channel=null;remote=null;lastStudio=0;}
 const dispose=bindPageLifecycle({pause,resume(){refresh();source.nextAt=0;start();publish();void poll();},destroy(){dead=true;pause();removeEventListener('storage',storageChanged);globalThis.document?.removeEventListener('visibilitychange',visibilityChanged);}});
 function visibilityChanged(){if(!globalThis.document?.hidden&&!paused&&!dead){source.nextAt=0;void poll();publish();}}
 globalThis.document?.addEventListener('visibilitychange',visibilityChanged);
 start();queueMicrotask(()=>{publish();void poll();});
 return {async command(action,args){
  if(overlay)throw Error('Read-only overlay');if(dead||paused)throw Error('Session paused');
  const state=await savedCommand(engine,action,args);
  if(action==='mode'){source.nextAt=0;source.data=null;source.error=null;simulation=0;void poll();}
  publish();return state;
 },dispose};
}
