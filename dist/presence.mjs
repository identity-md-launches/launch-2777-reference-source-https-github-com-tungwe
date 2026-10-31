// Visual-only embodiment. This module never writes saves or awards growth.
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const ease=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
export const damp=(from,to,rate,dt)=>from+(to-from)*(1-Math.exp(-rate*clamp(dt,0,.1)));
export function gestureKey(key,turn){
 if(turn)return key==='ArrowLeft'?{yawDelta:-.2}:key==='ArrowRight'?{yawDelta:.2}:null;
 const zones=['head','cheek','nose','belly','paw','feet'],zone=zones[Number(key)-1],hold=key.toLowerCase()==='h';
 return zone||hold||key==='Enter'||key===' '?{zone:zone||'head',gesture:hold?'hold':'tap'}:null;
}
export class PetGesture {
 constructor(){this.current=null;}
 begin({id,x,y,zone,at,yaw=0,turn=false}){if(this.current||(!turn&&!zone))return false;this.current={id,x,y,lastX:x,lastY:y,zone,at,yaw,turn,distance:0,maxMove:0};return true;}
 move({id,x,y}){const p=this.current;if(!p||id!==p.id)return null;const step=Math.hypot(x-p.lastX,y-p.lastY);p.distance+=Math.min(step,40);p.maxMove=Math.max(p.maxMove,Math.hypot(x-p.x,y-p.y));p.lastX=x;p.lastY=y;return p;}
 end({id,x,y,at}){const p=this.current;if(!p||id!==p.id)return null;this.move({id,x,y});this.current=null;if(p.turn||!p.zone)return null;const elapsed=at-p.at;if(p.maxMove<7)return {zone:p.zone,gesture:elapsed>=650?'hold':'tap'};if(p.distance>=24&&elapsed>=180)return {zone:p.zone,gesture:'stroke'};return null;}
 cancel(){this.current=null;}
}
export class Presence {
 constructor(random=Math.random){this.random=random;this.x=0;this.y=0;this.lastSeen=-Infinity;this.nextEar=0;this.earAt=-Infinity;this.touch=0;}
 observe(x,y,now){this.x=clamp(x,-1,1);this.y=clamp(y,-1,1);this.lastSeen=now;}
 leave(){this.lastSeen=-Infinity;}
 tick(now,dt,{sleeping=false,reduced=false,busy=false,contact=false,food=false,energy=75}={}){
  const attentive=!sleeping&&!busy&&now-this.lastSeen<2400;
  this.touch=damp(this.touch,contact&&!sleeping&&!busy?1:0,contact?9:5,dt);
  if(now>this.nextEar){this.earAt=now;this.nextEar=now+3500+this.random()*6500;}
  const t=now/1000,earAge=(now-this.earAt)/1000;
  const ear=earAge<.45?Math.sin(earAge/.45*Math.PI)**2:0;
  return {headYaw:reduced?0:attentive?this.x*.72:0,headPitch:reduced?0:attentive?-this.y*.5:0,
   ear:reduced||sleeping||busy?0:ear*.65,
   breath:reduced?0:(.5+.5*Math.sin(t*(sleeping?1.8:energy<25?2.1:2.8))),
   sniff:reduced||sleeping||busy?0:(food?.8:attentive?.3:.08)*(.5+.5*Math.sin(t*17)),
   lean:reduced?0:this.touch,attention:attentive};
 }
}
// Offsets in normalized world units. Head/ears/nose masks leave feet anchored.
export function organicOffsets(x,y,z,width,height,depth,mouth){
 const h=y/height,front=ease(-.05,.32,z/depth),head=ease(mouth-.12,mouth+.18,h),pivot=height*(mouth-.12);
 const yaw=.13*head,pitch=.09*head,dy=y-pivot;
 const ear=ease(.76,.94,h)*ease(.12,.30,Math.abs(x)/width);
 const nose=Math.exp(-(((h-mouth-.035)*23)**2)-((x/(width*.12))**2))*front;
 const chest=Math.exp(-(((h-.38)*4)**2))*ease(.06,.2,h)*(1-ease(.75,.95,h));
 return [
  [x*Math.cos(yaw)+z*Math.sin(yaw)-x,0,z*Math.cos(yaw)-x*Math.sin(yaw)-z],
  [0,dy*Math.cos(pitch)-z*Math.sin(pitch)-dy,dy*Math.sin(pitch)+z*Math.cos(pitch)-z],
  [Math.sign(x)*height*.012*ear,-height*.01*ear,-height*.012*ear],
  [0,height*.003*nose,height*.006*nose],
  [x*.009*chest,height*.002*chest,z*.012*chest]
 ];
}
export function ballPath(age,reduced=false){
 const p=clamp(age/4,0,1),arrive=ease(0,.38,p),push=ease(.48,1,p);
 return {x:reduced?.55:1.05-.70*arrive+.85*push,z:.55+.22*push,turn:reduced?0:-arrive*5+push*8,paw:reduced?0:Math.sin(Math.PI*ease(.34,.65,p))*.75};
}
