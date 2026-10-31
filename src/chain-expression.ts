export const GALLERY=[
 {family:'curious',name:'Ear perk & head tilt',zh:'豎耳歪頭'},
 {family:'curious',name:'Peek & sniff',zh:'探頭嗅嗅'},
 {family:'curious',name:'Stand & wave',zh:'挺身揮爪'},
 {family:'pleased',name:'Paw claps & shoulders',zh:'拍爪扭肩'},
 {family:'pleased',name:'Bounce & soft landing',zh:'輕跳落地'},
 {family:'pleased',name:'Cheek paws & sway',zh:'捧頰搖擺'},
 {family:'celebrate',name:'Quarter twirl & return',zh:'轉身回望'},
 {family:'celebrate',name:'Victory & happy paws',zh:'勝利動爪'},
 {family:'celebrate',name:'Two-step dance & bow',zh:'兩步舞鞠躬'},
 {family:'join',name:'Tiny high-five',zh:'小爪擊掌'},
 {family:'join',name:'Cheek nuzzle',zh:'靠近蹭蹭'},
 {family:'join',name:'Shy dip & wave',zh:'害羞低頭揮爪'}
] as const;
export const CAPTIONS=[['A new request! Pip perks up and tilts its head.','有新請求！Pip 豎耳歪頭打招呼。'],['Something new? Pip peeks and sniffs.','有新動靜？Pip 探頭聞聞。'],['A new request! Pip stands tall and waves.','有新請求！Pip 挺起身子揮爪。'],['Batch settled. Time for tiny paw claps.','批次已結算，小爪爪拍一拍。'],['Batch settled. A little bounce, a soft landing.','批次已結算，輕輕跳起再落地。'],['Batch settled. Happy paws and a gentle sway.','批次已結算，捧著臉頰搖一搖。'],['Completed blocks! A tiny twirl and back to you.','完整區塊完成！轉個小圈再看向你。'],['Completed blocks! Pip raises a victory paw.','完整區塊完成！Pip 舉爪慶祝。'],['Completed blocks! Two little steps and a bow.','完整區塊完成！小跳兩步再鞠躬。'],['Paw to palm. A tiny high-five!','爪爪碰手心，小小擊掌！'],['A little closer for a cheek nuzzle.','靠近一點，輕輕蹭蹭臉頰。'],['A shy little dip, then a returning wave.','害羞低下頭，再輕輕揮爪回應。']] as const;
export type Family=typeof GALLERY[number]['family'];
export type Pose={x:number;y:number;z:number;rx:number;ry:number;rz:number;sx:number;sy:number;head:number;paw:number;hands:number;cheek:number;ear:number;sniff:number;headYaw:number;headPitch:number};
const smooth=(n:number)=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
export function expressionPose(index:number,age:number,stage='baby',lively=false,reduced=false,energy=100):Pose{
 const o:Pose={x:0,y:0,z:0,rx:0,ry:0,rz:0,sx:1,sy:1,head:0,paw:0,hands:0,cheek:0,ear:0,sniff:0,headYaw:0,headPitch:0};
 if(age<0||age>=3.6)return o;
 if(reduced){o.ear=.25;o.paw=.2;return o;}
 const a=(stage==='baby'?.56:stage==='young'?.72:1)*(lively?1:.72)*(energy<30?.6:1),t=Math.max(0,age-.35),e=smooth(age/.4)*(1-smooth((age-2.75)/.85)),s=Math.sin(t*6),pulse=Math.max(0,Math.sin(t*5));
 o.headPitch=-.12*e;
 switch(index){
  case 0:o.ear=.85*e;o.head=.9*e*Math.sin(t*2);o.headPitch=.3*e;break;
  case 1:o.headYaw=.9*e*Math.sin(t*3);o.sniff=e*(.4+.4*Math.sin(t*17));o.z=.04*e;break;
  case 2:o.sy=1+.025*e;o.paw=e*(.5+.4*Math.sin(t*10));o.ear=.35*e;break;
  case 3:o.hands=.85*e*Math.max(0,Math.sin(t*7));o.rz=.035*e*s;o.sx=1+.015*e*s;break;
  case 4:o.y=.09*e*Math.max(0,Math.sin(Math.min(Math.PI,t*2.4)));o.sy=1-.035*e*Math.max(0,-Math.cos(t*4));o.ear=.4*e;break;
  case 5:o.hands=.75*e;o.cheek=.45*e;o.rz=.07*e*Math.sin(t*2.7);break;
  case 6:o.ry=Math.PI/2*e*Math.sin(Math.min(Math.PI,t*1.3));o.paw=.3*e;o.ear=.65*e;break;
  case 7:o.paw=.85*e;o.head=-.5*e;o.rz=.035*e;o.hands=.3*e*pulse;break;
  case 8:o.x=.045*e*Math.sin(t*4);o.rz=.08*e*Math.sin(t*4);o.headPitch=.8*e*smooth((t-1.3)/.5);o.hands=.35*e;break;
  case 9:o.paw=e*(.8+.15*Math.sin(t*5));o.head=-.45*e;o.z=.045*e;break;
  case 10:o.z=.09*e;o.head=.8*e;o.cheek=.55*e;o.headPitch=.3*e;break;
  case 11:o.headPitch=.8*e*Math.sin(t*1.5);o.paw=.65*e*smooth((t-.7)/.6);o.ear=.35*e;break;
 }
 if(lively){o.ear+=.12*e*Math.sin(t*9);o.sniff+=.12*e*(.5+.5*Math.sin(t*15));}
 for(const k of Object.keys(o) as (keyof Pose)[])if(k==='sx'||k==='sy')o[k]=1+(o[k]-1)*a;else o[k]*=a;
 return o;
}
export class ExpressionDirector{
 active:{index:number;start:number;group:any}|null=null;
 invitation:{kind:number;until:number}|null=null;
 previous:Partial<Record<Family,number>>={};seed:number;joinUntil=0;lastJoinKind=9;
 constructor(seed=20261031){this.seed=seed>>>0;}
 choose(family:Family){const start={curious:0,pleased:3,celebrate:6,join:9}[family];this.seed=(1664525*this.seed+1013904223)>>>0;let n=start+this.seed%3;if(this.previous[family]===n)n=start+(n-start+1)%3;this.previous[family]=n;return n;}
 start(group:any,now:number,index?:number){if(group.family!=='join')this.joinUntil=0;this.invitation=null;this.active={index:index??this.choose(group.family),start:now,group};return this.active;}
 tick(now:number){if(this.invitation&&now>this.invitation.until)this.invitation=null;if(this.active&&now-this.active.start>=3600){const old=this.active;this.active=null;if(old.index<9)this.invitation={kind:this.choose('join'),until:now+8000};}return this.active;}
 cancel(){this.active=null;this.invitation=null;this.joinUntil=0;}
 respond(now:number,zone:string|null){const invitation=this.invitation||(this.joinUntil>now?{kind:this.lastJoinKind,until:this.joinUntil}:null);if(!zone||!invitation||now>invitation.until)return false;const kind=invitation.kind;this.joinUntil=invitation.until;this.lastJoinKind=kind;if(kind===9&&zone!=='paw'||kind!==9&&!['head','cheek','nose','ear'].includes(zone))return false;this.start({family:'join',events:[],simulated:false},now,kind);return true;}
}
