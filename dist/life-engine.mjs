// Browser-local care, compatible with existing version 1 pet saves.
export const CARE={stroke:{bond:2,energy:0,kind:'love'},cuddle:{bond:4,energy:2,kind:'love'},brush:{bond:3,energy:2,kind:'love'},ball:{bond:3,energy:-8,kind:'play'},dance:{bond:3,energy:-6,kind:'play'}};
export const MEMORIES=['snack','cuddle','brush','ball','dance','nap','hunt','wish'];
const clamp=(n,def)=>Number.isFinite(n)?Math.max(0,Math.min(100,n)):def;
export function dayKey(now){const d=new Date(now);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
export function lifeSnapshot(data,now){
 const d=data.life||{},day=dayKey(now),sleepAt=Number.isFinite(d.sleepAt)?d.sleepAt:null;
 const wishes=d.day===day&&Array.isArray(d.wishes)?[...new Set(d.wishes.filter(v=>['snack','love','play'].includes(v)))]:[];
 const energy=clamp(clamp(d.energy,75)+(sleepAt===null?0:Math.max(0,now-sleepAt)/1000),75);
 return {bond:clamp(d.bond,0),energy,sleepAt,sleeping:sleepAt!==null,day,wishes,claimed:d.day===day&&d.claimed===true,
 memories:Array.isArray(d.memories)?[...new Set(d.memories.filter(v=>MEMORIES.includes(v)))]:[],
 rewards:d.rewards&&typeof d.rewards==='object'?{...d.rewards}:{},lastActivity:typeof d.lastActivity==='string'?d.lastActivity:'',
 lastAt:Number.isFinite(d.lastAt)?d.lastAt:0};
}
export function recordCare(data,now,{kind,memory,bond=0,energy=0,activity=memory}){
 const life=lifeSnapshot(data,now);life.bond=clamp(life.bond+bond,0);life.energy=clamp(life.energy+energy,75);
 if(kind&&!life.wishes.includes(kind))life.wishes.push(kind);
 if(memory&&MEMORIES.includes(memory)&&!life.memories.includes(memory))life.memories.push(memory);
 if(life.wishes.length===3&&!life.claimed){life.claimed=true;if(!life.memories.includes('wish'))life.memories.push('wish');}
 life.lastActivity=activity||'';life.lastAt=now;
 return {...data,life};
}
export function careAction(data,action,now){
 const life=lifeSnapshot(data,now);
 if(action==='nap'){
  if(life.sleeping)return data;
  return {...data,life:{...life,sleepAt:now,lastActivity:'nap',lastAt:now}};
 }
 if(action==='wake'){
  if(!life.sleeping)return data;
  const rested=now-life.sleepAt>=8000;
  const next={...data,life:{...life,sleepAt:null}};
  return recordCare(next,now,{memory:rested?'nap':null,activity:'wake'});
 }
 if(!Object.hasOwn(CARE,action))throw Error('Unknown care');
 if(life.sleeping)throw Error('Sleeping');
 const care=CARE[action];if(care.energy<0&&life.energy<10)throw Error('Needs rest');
 // Repeat interactions still animate; rewards and need changes are rate-limited.
 if(Number.isFinite(life.rewards[action])&&now-life.rewards[action]<25000)return data;
 const next=recordCare(data,now,{...care,memory:action,activity:action});next.life.rewards[action]=now;return next;
}
