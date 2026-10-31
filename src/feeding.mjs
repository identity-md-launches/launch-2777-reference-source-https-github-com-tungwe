// Mouth coordinates are published by the local 3D renderer, never a remote service.
export const MOUTH_HEIGHT={baby:.32,young:.48,junior:.54,grown:.56,star:.52};
let target=null;
export function setMouthTarget(value){target=value;}
export function getMouthTarget(){return target;}
export function mouthContains(x,y,m=target){return !!(m&&m.visible&&Number.isFinite(x)&&Number.isFinite(y)&&Math.hypot(x-m.x,y-m.y)<=m.radius);}
export function eatingPose(age,reduced=false){
 const rest={jaw:0,cheek:0,head:0,food:0,nibble:0,paw:0};if(age<0||age>=4)return rest;
 const envelope=Math.sin(Math.PI*age/4),bite=.5+.5*Math.sin(age*15);
 return {jaw:reduced?0:bite*envelope,cheek:reduced?.35:envelope*(1.2+.18* Math.sin(age*7)),head:reduced?0:.15*Math.sin(age*8)*envelope,food:reduced?1:Math.max(0,1-age/3.5),nibble:reduced?0:.025*bite,paw:reduced?0:.65*envelope};
}
