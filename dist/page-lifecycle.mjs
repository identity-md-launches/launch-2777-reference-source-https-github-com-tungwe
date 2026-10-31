// BFCache pauses resources; a real unload destroys them. Idempotent transitions
// also make repeated restores safe. Browser eligibility is a separate concern.
export function bindPageLifecycle({pause=()=>{},resume=()=>{},destroy=()=>{}},target=globalThis) {
 let paused=false,dead=false;
 const hide=e=>{
  if(dead)return;
  if(e.persisted){if(!paused){paused=true;pause();}}
  else dispose();
 };
 const show=e=>{if(!dead&&paused&&e.persisted){paused=false;resume();}};
 function dispose(){if(dead)return;dead=true;target.removeEventListener('pagehide',hide);target.removeEventListener('pageshow',show);destroy();}
 target.addEventListener('pagehide',hide);target.addEventListener('pageshow',show);
 return dispose;
}
