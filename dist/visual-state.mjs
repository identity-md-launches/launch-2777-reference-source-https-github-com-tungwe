export function visualState({pet,cue},now,{contact=false,food=false,attention=false,loading=false,thinking=false,reduced=false,turning=false}={}) {
 const age=(now-(cue?.at??0))/1000,active=age>=0&&age<4;
 const sleeping=!!pet?.life?.sleeping;
 const game=['watch','playing'].includes(pet?.game?.phase)||['watch','choose'].includes(pet?.hunt?.phase);
 // One priority policy for animation, idle and status copy.
 const mode=loading?'loading':sleeping?'sleeping':active&&cue.type==='eat'?'eating':game?'game':food?'food':turning?'turning':contact?'contact':active?'reaction':thinking?'thinking':attention?'attention':'idle';
 return {mode,age,contact:mode==='contact',attention:mode==='attention',food:mode==='food',
  reaction:['reaction','eating'].includes(mode)?cue.type:null,
  idleBlocked:mode!=='idle'||reduced};
}
export function presenceText(mode,zh=false){
 const words={sleeping:['Resting peacefully','安心睡著了'],eating:['Enjoying a little bite','慢慢吃這一口'],game:['Playing together','專心陪你玩'],food:['A snack? Sniff…','聞到點心了'],contact:['Leaning into your hand','靠著你的手心'],attention:['You have my attention','好奇地看著你'],thinking:['Listening to you','正在聽你說']};
 return words[mode]?.[zh?1:0]||'';
}
