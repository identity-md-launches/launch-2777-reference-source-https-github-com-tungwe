import {Pet} from './pet-engine.mjs';
import {PET_KEY} from './browser-storage.mjs';

// All public writers use the same origin-scoped lock. A stale tab reloads INSIDE
// the lock, before applying cooldowns or rewards. No read/merge/write races.
export function refreshPet(engine) {
 if (!engine.pet.file) return;
 const previous=engine.pet, fresh=new Pet({clock:engine.clock,file:previous.file});
 fresh.game=previous.game; fresh.hunt=previous.hunt; engine.pet=fresh;
}
export async function savedCommand(engine,action,args,{locks=globalThis.navigator?.locks}={}) {
 const apply=()=>{refreshPet(engine); return engine.command(action,args);};
 if (!engine.pet.file) return apply();
 if (!locks?.request) throw Error('Safe browser saving unavailable');
 return locks.request(PET_KEY+'-write',{mode:'exclusive'},apply);
}
