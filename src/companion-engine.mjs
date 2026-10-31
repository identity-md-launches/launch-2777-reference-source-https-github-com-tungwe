import {nextTouch,TOUCH_ZONES} from './touch-reactions.mjs';
import {measurementFresh, uint} from './data.mjs';
import {Pet} from './pet-engine.mjs';
import {GROWTH_STAGES,stageIndex} from './growth-clock.mjs';

// Single authoritative session shared by the studio and all local overlays.
export class Companion {
 constructor(clock=Date.now){this.clock=clock;this.mode='live';this.name='Pip';this.scene='hangout';this.message='';this.cheers=0;this.lastCheer=0;this.events=[];this.serial=0;this.sample=null;this.baseline=null;this.goal=null;this.guess=null;this.score={wins:0,played:0};this.cue=null;this.connection='waiting';}
 get pet(){return this._pet??=new Pet({clock:this.clock});}
 set pet(value){this._pet=value;const p=value.data.profile;if(p?.version===1&&typeof p.name==='string'&&typeof p.message==='string'&&['hangout','focus','break'].includes(p.scene)){this.name=p.name.slice(0,24)||'Pip';this.message=p.message.slice(0,100);this.scene=p.scene;}}
 event(type,detail={}){const e={id:++this.serial,at:this.clock(),type,...detail};this.events.unshift(e);this.events=this.events.slice(0,30);return e;}
 changeMode(mode){if(!['live','rehearsal'].includes(mode))throw Error('Invalid mode');if(mode===this.mode)return;this.mode=mode;this.sample=null;this.baseline=null;this.goal=null;this.guess=null;this.cue=null;this.cheers=0;this.score={wins:0,played:0};this.events=[];this.connection='waiting';this.event('mode',{mode});}
 ingest(data,error=null){
  const now=this.clock(),m=data?.measurement;
  const valid=!error&&measurementFresh(data,now)&&Date.parse(m?.receivedAt)<=now+30000&&uint(m?.rpmMilli)!==null&&uint(m?.distanceMm)!==null;
  if(!valid){this.connection=error?'offline':'stale';this.baseline=null;return;}
  const sample={at:Date.parse(m.receivedAt),rpm:Number(m.rpmMilli)/1000,distance:String(m.distanceMm),height:uint(data?.builder?.anchor?.blockHeight)?.toString()??null,observedAt:m.observedAt,expiresAt:Date.parse(m.receivedAt)+Math.min(120,Number(m.staleAfterSeconds)||120)*1000};
  // Out-of-order and duplicate samples cannot trigger celebrations or score points.
  if(this.sample&&sample.at<=this.sample.at){this.connection=this.sample.expiresAt<now?'stale':'connected';return;}
  const prev=this.baseline;
  this.sample=sample;this.connection='connected';this.baseline=sample;
  if(prev&&sample.at-prev.at<=120000){
   if((sample.rpm>0)!==(prev.rpm>0))this.event(sample.rpm>0?'running':'resting');
   if(sample.height!==null&&prev.height!==null&&BigInt(sample.height)>BigInt(prev.height))this.event('block',{count:String(BigInt(sample.height)-BigInt(prev.height))});
   const delta=BigInt(sample.distance)-BigInt(prev.distance);
   if(this.goal?.state==='active'&&delta>=0n){this.goal.progress=Math.min(this.goal.target,this.goal.progress+Number(delta)/1000);if(this.goal.progress>=this.goal.target){this.goal.state='complete';this.event('goal');}}
  }
  this.tick();
 }
 tick(){const now=this.clock();if(this.sample&&this.sample.expiresAt<now){this.connection='stale';this.baseline=null;}
  if(this.guess?.state==='pending'&&now>=this.guess.endsAt){
   if(this.connection==='connected'&&this.sample?.at>=this.guess.endsAt&&this.sample.at<=this.guess.endsAt+45000){const actual=this.sample.rpm>0?'running':'resting';this.guess.state=actual===this.guess.choice?'won':'lost';this.guess.actual=actual;this.score.played++;if(this.guess.state==='won')this.score.wins++;this.event('guess',{result:this.guess.state});}
   else if(now>this.guess.endsAt+45000){this.guess.state='void';this.event('guess',{result:'void'});}
  }
 }
 command(action,args={}){const now=this.clock(),state=this.pet.snapshot();
  if(state.life.sleeping&&['cheer','cue'].includes(action))throw Error('Sleeping');
  const gameActive=['watch','playing'].includes(state.game?.phase)||['watch','choose'].includes(state.hunt?.phase);
  if(gameActive&&['feed','touch','pet','stroke','cuddle','brush','ball','dance','nap','cheer','cue'].includes(action))throw Error('Finish game first');
  if(((this.cue?.type==='eat'&&now-this.cue.at<4000)||(state.lastFed!==null&&now-state.lastFed>=0&&now-state.lastFed<4000))&&['pet','stroke','cuddle','brush','ball','dance','nap','wake','cheer','cue','hunt-start','play-start'].includes(action))throw Error('Eating');
  switch(action){
  case 'grow':{const prior=GROWTH_STAGES[stageIndex(this.pet.data.xp)].id;this.pet.save(this.pet.data);const after=this.pet.snapshot();if(prior!==after.stage)this.event('evolved',{stage:after.stage});break;}
  case 'settings':if(typeof args.name!=='string'||typeof args.message!=='string'||!['hangout','focus','break'].includes(args.scene))throw Error('Invalid settings');{const profile={version:1,name:args.name.trim().slice(0,24)||'Pip',message:args.message.trim().slice(0,100),scene:args.scene};this.pet.save({...this.pet.data,profile});this.name=profile.name;this.message=profile.message;this.scene=profile.scene;}break;
  case 'cheer':if(now-this.lastCheer<1500)throw Error('Cheer cooldown');this.lastCheer=now;this.cheers++;this.cue={type:'cheer',at:now};this.event('cheer');break;
  case 'cue':if(!['wave','heart','confetti'].includes(args.type))throw Error('Invalid cue');this.cue={type:args.type,at:now};this.event('cue',{cue:args.type});break;
  case 'goal':if(![100,250,500].includes(args.target))throw Error('Invalid target');this.goal={state:'active',target:args.target,progress:0};this.baseline=this.connection==='connected'?this.sample:null;this.event('goal-start',{target:args.target});break;
  case 'cancel-goal':this.goal=null;break;
  case 'guess':if(!['running','resting'].includes(args.choice)||this.guess?.state==='pending')throw Error('Guess unavailable');if(this.connection!=='connected')throw Error('Fresh data required');this.guess={state:'pending',choice:args.choice,endsAt:now+60000};break;
  case 'mode':this.changeMode(args.mode);break;
  case 'feed':{const result=this.pet.feed(args.food);this.cue={type:'eat',at:now};this.event('fed',{food:args.food});if(result.evolved)this.event('evolved',{stage:result.pet.stage});break;}
  case 'touch':{
   if((this.cue?.type==='eat'&&now-this.cue.at<4000)||(state.lastFed!==null&&now-state.lastFed>=0&&now-state.lastFed<4000))return this.snapshot();
   const gesture=args.gesture??'tap';if(!TOUCH_ZONES.includes(args.zone)||!['tap','hold','stroke'].includes(gesture))throw Error('Invalid touch');
   if(this.lastTouch!==undefined&&now-this.lastTouch<80)break;
   if(this.pet.snapshot().life.sleeping){this.pet.interact('wake');this.lastTouch=now;this.touchHistory=null;this.cue={type:'wake',at:now};break;}
   const result=this.pet.interact('stroke');this.lastTouch=now;if(result.evolved)this.event('evolved',{stage:result.pet.stage});
   const chosen=nextTouch(this.touchHistory,args.zone,now,gesture);this.touchHistory=chosen.history;
   this.cue={type:chosen.type,at:now,touch:true,zone:args.zone};break;
  }
  case 'stroke':case 'cuddle':case 'brush':case 'ball':case 'dance':case 'nap':case 'wake':case 'hunt-start':case 'hunt-pick':case 'hunt-close':{const result=this.pet.interact(action,args);this.cue={type:action==='hunt-pick'?(result.pet.hunt.phase==='won'?'hunt-win':'hunt-miss'):action,at:now};if(result.evolved)this.event('evolved',{stage:result.pet.stage});break;}
  case 'pet':case 'accessory':case 'play-start':case 'play-tap':case 'play-cancel':{const result=this.pet.interact(action,args);if(action==='pet')this.cue={type:'pet',at:now};if(action==='play-tap'&&result.pet.game?.phase==='won')this.cue={type:'confetti',at:now};if(result.evolved)this.event('evolved',{stage:result.pet.stage});break;}
  default:throw Error('Unknown action');
 }if(['feed','touch','pet','stroke','cuddle','brush','ball','dance','nap','wake','hunt-pick','play-tap'].includes(action))this.lastInteraction={type:action==='feed'?'snack':action==='touch'||action==='pet'?'stroke':action,at:now};return this.snapshot();}
 snapshot(){this.tick();const pet=this.pet.snapshot();const feeding=pet.lastFed!==null&&this.clock()-pet.lastFed>=0&&this.clock()-pet.lastFed<4000;return {version:1,at:this.clock(),mode:this.mode,name:this.name,scene:this.scene,message:this.message,cheers:this.cheers,events:this.events,sample:this.sample,connection:this.connection,goal:this.goal,guess:this.guess,score:this.score,cue:feeding?{type:'eat',at:pet.lastFed}:this.cue,lastInteraction:this.lastInteraction??null,pet};}
}
