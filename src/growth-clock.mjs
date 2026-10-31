// One minute of real elapsed time = one growth minute. Interaction count is irrelevant.
export const MINUTE=60_000, MAX_AWAY_MS=7*24*60*MINUTE;
export const GROWTH_STAGES=Object.freeze([
 {id:'baby',xp:0},{id:'young',xp:1440},{id:'junior',xp:4320},
 {id:'grown',xp:10080},{id:'star',xp:30240}
]);
export const stageIndex=xp=>GROWTH_STAGES.findLastIndex(s=>xp>=s.xp);
export function migrateGrowth(data,now){
 if(data.growth!=null&&data.growth.version!==2)throw Error('Unsupported growth clock; original save preserved');
 if(data.growth?.version===2){
  const g=data.growth;
  if(!Number.isFinite(g.settledAt)||!Number.isFinite(g.remainderMs)||g.remainderMs<0||g.remainderMs>=MINUTE)throw Error('Invalid growth clock; original save preserved');
  return data;
 }
 // Preserve the old stage AND within-stage progress; never infer age from old last-fed timestamps.
 const old=[0,30,60,100,250],i=old.findLastIndex(n=>data.xp>=n);
 const xp=i===4?GROWTH_STAGES[4].xp:Math.floor(GROWTH_STAGES[i].xp+(data.xp-old[i])/(old[i+1]-old[i])*(GROWTH_STAGES[i+1].xp-GROWTH_STAGES[i].xp));
 return {...data,xp,growth:{version:2,settledAt:now,remainderMs:0,legacyXp:data.xp}};
}
export function advanceGrowth(data,now){
 const d=migrateGrowth(data,now),g=d.growth;
 // A rollback cannot move the watermark backwards or mint the same time twice.
 if(!Number.isFinite(now)||now<=g.settledAt)return d;
 const elapsed=Math.min(MAX_AWAY_MS,now-g.settledAt)+g.remainderMs;
 return {...d,xp:Math.min(Number.MAX_SAFE_INTEGER,d.xp+Math.floor(elapsed/MINUTE)),
  growth:{...g,settledAt:now,remainderMs:elapsed%MINUTE}};
}
export function growthDuration(minutes,zh=false){
 const m=Math.max(0,Math.ceil(minutes)),d=Math.floor(m/1440),h=Math.floor(m%1440/60),rest=m%60;
 return [d?(zh?`${d} 天`:`${d}d`):'',h?(zh?`${h} 小時`:`${h}h`):'',!d&&rest?(zh?`${rest} 分鐘`:`${rest}m`):''].filter(Boolean).join(' ')||(zh?'0 分鐘':'0m');
}
