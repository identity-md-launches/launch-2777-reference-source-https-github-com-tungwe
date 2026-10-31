import {readFileSync,writeFileSync,mkdirSync,renameSync,dirname,randomInt} from './browser-storage.mjs';
import {CARE,lifeSnapshot,recordCare,careAction} from './life-engine.mjs';
import {GROWTH_STAGES as stages,migrateGrowth,advanceGrowth} from './growth-clock.mjs';
export const FOODS={seed:{fullness:18},carrot:{fullness:24},berry:{fullness:12}};
export class Pet {
 constructor({clock=Date.now,file=null}={}){
  this.clock=clock;this.file=file;
  this.game=null;this.data={version:1,xp:0,fullness:35,updatedAt:clock(),lastFed:null,lastFood:null,meals:0,lastPet:null,lastPlay:null,accessory:'none'};
  if(file)try{const d=JSON.parse(readFileSync(file,'utf8'));if(d.version!==1||!Number.isSafeInteger(d.xp)||d.xp<0||!Number.isFinite(d.fullness)||d.fullness<0||d.fullness>100||!Number.isFinite(d.updatedAt)||!(d.lastFed===null||Number.isFinite(d.lastFed))||!(d.lastFood===null||Object.hasOwn(FOODS,d.lastFood))||!Number.isSafeInteger(d.meals)||d.meals<0)throw Error('Invalid pet save; original file preserved');this.data=d;}catch(error){if(error.code!=='ENOENT')throw error;}
  this.data={lastPet:null,lastPlay:null,accessory:'none',...this.data};
  this.data=migrateGrowth(this.data,clock());
  this.hunt=null;
 }
 save(next){
  next=advanceGrowth(next,this.clock());
  next={...next,revision:(Number.isSafeInteger(this.data.revision)?this.data.revision:0)+1};
  if(this.file){mkdirSync(dirname(this.file),{recursive:true});const temp=this.file+'.tmp';writeFileSync(temp,JSON.stringify(next)+'\n','utf8');renameSync(temp,this.file);}
  this.data=next;
 }
 snapshot(){
  const now=this.clock(),d=advanceGrowth(this.data,now),index=stages.findLastIndex(s=>d.xp>=s.xp),stage=stages[index],next=stages[index+1];
  const fullness=Math.max(0,d.fullness-Math.max(0,now-d.updatedAt)/3600000*4);
  const game=this.game?{phase:this.game.phase==='playing'&&now<this.game.readyAt?'watch':this.game.phase,sequence:now<this.game.readyAt?this.game.sequence:null,step:this.game.step,readyAt:this.game.readyAt}:null;
  const life=lifeSnapshot(d,now),hunt=this.hunt?{phase:this.hunt.phase==='watch'&&now>=this.hunt.readyAt?'choose':this.hunt.phase,readyAt:this.hunt.readyAt,answer:this.hunt.phase!=='watch'||now<this.hunt.readyAt?this.hunt.answer:null,picked:this.hunt.picked??null}:null;
  return {...d,life,hunt,fullness,stage:stage.id,stageStart:stage.xp,nextStage:next?.id??null,nextXp:next?.xp??null,cooldownUntil:d.lastFed===null?0:d.lastFed+20000,petCooldownUntil:d.lastPet===null?0:d.lastPet+20000,playCooldownUntil:d.lastPlay===null?0:d.lastPlay+20000,unlocked:['none',...(d.xp>=1440?['bow']:[]),...(d.xp>=10080?['flower']:[]),...(d.xp>=30240?['crown']:[])],mood:now-(d.lastPet??-Infinity)<60000?'loved':now-(d.lastPlay??-Infinity)<60000?'playful':fullness<25?'snacky':'content',game};
 }
 feed(food){
  if(!Object.hasOwn(FOODS,food))throw Error('Invalid food');
  const before=this.snapshot(),now=this.clock();
  if(before.life.sleeping)throw Error('Sleeping');
  if(now<before.cooldownUntil)throw Error('Digesting');
  if(before.fullness>80)throw Error('Full');
  const meal=FOODS[food],next={version:1,xp:this.data.xp,fullness:Math.min(100,before.fullness+meal.fullness),updatedAt:now,lastFed:now,lastFood:food,meals:this.data.meals+1};
  this.save(recordCare({...this.data,...next},now,{kind:'snack',memory:'snack',bond:2,activity:'snack'}));const after=this.snapshot();return {pet:after,evolved:before.stage!==after.stage};
 }
 interact(action,args={}){
  const before=this.snapshot(),now=this.clock();
  if(before.life.sleeping&&!['wake','nap','accessory','play-cancel','hunt-close'].includes(action))throw Error('Sleeping');
  if(Object.hasOwn(CARE,action)||action==='nap'||action==='wake'){if(action==='nap'&&(this.game?.phase==='playing'||this.hunt?.phase==='watch'))throw Error('Finish game first');const next=careAction(this.data,action,now);if(next!==this.data)this.save(next);}
  else if(action==='hunt-start'){
   if(this.game?.phase==='playing'||this.hunt?.phase==='watch'||before.life.energy<10)throw Error('Game unavailable');
   if(Number.isFinite(before.life.rewards.hunt)&&now-before.life.rewards.hunt<20000)throw Error('Hunt cooldown');
   this.save({...this.data,life:{...before.life,rewards:{...before.life.rewards,hunt:now}}});this.hunt={phase:'watch',readyAt:now+3500,answer:randomInt(3)};
  }else if(action==='hunt-pick'){
   if(this.hunt?.phase!=='watch'||now<this.hunt.readyAt||!Number.isInteger(args.cup)||args.cup<0||args.cup>2)throw Error('Wait for your turn');
   const won=args.cup===this.hunt.answer;
   this.save(recordCare(this.data,now,{kind:'play',memory:won?'hunt':null,activity:won?'hunt':'hunt-miss',bond:won?4:1,energy:-4}));
   this.hunt={...this.hunt,phase:won?'won':'miss',picked:args.cup};
  }else if(action==='hunt-close'){this.hunt=null;}
  else if(action==='pet'){if(now<before.petCooldownUntil)throw Error('Pet cooldown');this.save(recordCare({...this.data,lastPet:now},now,{kind:'love',bond:2,activity:'stroke'}));}
  else if(action==='accessory'){if(!before.unlocked.includes(args.item))throw Error('Accessory locked');this.save({...this.data,accessory:args.item});}
  else if(action==='play-start'){
   if(now<before.playCooldownUntil||this.game?.phase==='playing'||this.hunt?.phase==='watch')throw Error('Play unavailable');
   this.save({...this.data,lastPlay:now});this.game={phase:'playing',sequence:Array.from({length:3},()=>randomInt(3)),step:0,readyAt:now+4200};
  }else if(action==='play-tap'){
   if(!Number.isInteger(args.pad)||args.pad<0||args.pad>2||this.game?.phase!=='playing'||now<this.game.readyAt)throw Error('Wait for your turn');
   const g=this.game;
   if(args.pad!==g.sequence[g.step]){this.save({...this.data,lastPlay:now});g.phase='retry';}
   else if(g.step===2){this.save(recordCare({...this.data,lastPlay:now},now,{kind:'play',bond:3,activity:'memory'}));g.step++;g.phase='won';}
   else g.step++;
  }else if(action==='play-cancel'){this.game=null;}
  else throw Error('Unknown interaction');
  const after=this.snapshot();return {pet:after,evolved:before.stage!==after.stage};
 }
}
