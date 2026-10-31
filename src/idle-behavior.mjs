export const IDLE_ACTIONS={
 groom:{duration:5200,en:'Tidying my tiny fluff',zh:'把小毛毛整理好'},
 look:{duration:4800,en:'A curious little look around',zh:'左看看、右看看'},
 stretch:{duration:4600,en:'A biiig little stretch',zh:'伸一個大大的小懶腰'},
 sniff:{duration:4000,en:'Something smells interesting',zh:'聞聞，有什麼香香的？'},
 sway:{duration:4200,en:'Happy in my little world',zh:'晃晃身體，陪你待著'}
};
// Pure local visual scheduling: never changes pet state, rewards, meals or sleep.
export class IdleDirector{
 constructor(random=Math.random){this.random=random;this.active=null;this.previous=null;this.nextAt=null;this.blocked=false;}
 delay(){return 6500+this.random()*6500;}
 pause(now){this.active=null;this.nextAt=now+this.delay();this.blocked=true;}
 tick(now,{blocked=false,energy=75,fullness=50,bond=0}={}){
  if(blocked){if(!this.blocked)this.pause(now);return null;}
  if(this.blocked){this.blocked=false;this.nextAt=now+this.delay();}
  if(this.nextAt===null)this.nextAt=now+4500+this.random()*2000;
  if(this.active){if(now-this.active.at<this.active.duration)return {...this.active,age:now-this.active.at};this.previous=this.active.type;this.active=null;this.nextAt=now+this.delay();return null;}
  if(now<this.nextAt)return null;
  const pool=(energy<25?['groom','look','stretch']:Object.keys(IDLE_ACTIONS)).filter(x=>x!==this.previous);
  const weights=pool.map(type=>type==='sniff'&&fullness<30?3:type==='groom'&&energy<25?2:type==='sway'&&bond>50?2:1);
  let pick=this.random()*weights.reduce((a,b)=>a+b,0),type=pool.at(-1);for(let i=0;i<pool.length;i++){pick-=weights[i];if(pick<0){type=pool[i];break;}}
  this.active={type,at:now,duration:IDLE_ACTIONS[type].duration};return {...this.active,age:0};
 }
}
export function idlePose(type,age,stage='grown'){
 const out={x:0,y:0,z:0,rx:0,ry:0,rz:0,sx:1,sy:1,sz:1,head:0,paw:0,cheek:0,groom:0};
 const duration=IDLE_ACTIONS[type]?.duration;if(!duration||age<=0||age>=duration)return out;
 const p=age/duration,e=Math.pow(Math.sin(Math.PI*p),2),t=age/1000,small=['baby','young'].includes(stage)? .8:1;
 if(type==='groom'){out.rx=.12*e;out.head=.8*e*Math.sin(t*3);out.groom=e*(.65+.35*Math.sin(t*8));out.rz=.045*e*Math.sin(t*4);}
 if(type==='look'){out.ry=.52*e*Math.sin(p*Math.PI*2);out.head=1.5*e*Math.sin(p*Math.PI*2+.4);out.rx=-.045*e;}
 if(type==='stretch'){out.sy=1+.045*e;out.sx=1-.02*e;out.rx=-.12*e;out.paw=.85*e;out.head=-.5*e;}
 if(type==='sniff'){out.z=.15*e*small;out.rx=-.07*e;out.cheek=.25*e*(.5+.5*Math.sin(t*12));out.head=.5*e*Math.sin(t*4);}
 if(type==='sway'){out.rz=.035*e*Math.sin(t*3);out.x=.055*e*Math.sin(t*3)*small;out.head=.65*e*Math.sin(t*3);out.y=.02*e*Math.abs(Math.sin(t*3));}
 return out;
}
