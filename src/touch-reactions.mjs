export const TOUCH_ZONES=['head','cheek','nose','belly','paw','feet'];
export const TOUCH_CHOICES={head:['nuzzle','nod','peek'],cheek:['puff','shy'],nose:['sniff','sneeze'],belly:['tickle','wobble'],paw:['highfive','pawwave'],feet:['hop','tiptoe']};
export function nextTouch(history,zone,now,gesture='tap'){
 if(!TOUCH_ZONES.includes(zone)||!['tap','hold','stroke'].includes(gesture))throw Error('Invalid touch');
 const previous=history||{counts:{},lastAt:null,streak:0,combos:0};
 const streak=gesture==='tap'&&previous.lastAt!==null&&now-previous.lastAt<1100?previous.streak+1:1;
 const count=previous.counts[zone]||0,combo=gesture==='tap'&&streak>=3;
 const type=gesture==='stroke'?'nuzzle':gesture==='hold'?'snuggle':combo?(previous.combos%2?'happyhop':'twirl'):TOUCH_CHOICES[zone][count%TOUCH_CHOICES[zone].length];
 return {type,history:{counts:{...previous.counts,[zone]:count+1},lastAt:now,streak:combo?0:streak,combos:previous.combos+(combo?1:0)}};
}
export function touchZone(x,y,z,width,height,depth,mouth=.60){
 const h=y/height,side=Math.abs(x)/width,front=z>depth*.12;
 if(h<.16)return 'feet';
 if(front&&h>mouth-.06&&h<mouth+.10&&side<.12)return 'nose';
 if(front&&h>mouth-.10&&h<mouth+.16&&side>.16)return 'cheek';
 if(h>mouth-.06)return 'head';
 return side>.26?'paw':'belly';
}
export const TOUCH_REACTIONS={
 nuzzle:['♡','Head nuzzle','蹭蹭頭','A little closer… right behind my ears.','把小腦袋靠過來…耳朵後面也要摸！'],
 nod:['✦','Happy nod','開心點頭','Yes, yes! I vote for more head pats.','點頭、點頭！我投繼續摸摸一票。'],
 peek:['?','Curious peek','歪頭偷看','Did you call me? I’m all little ears.','你在叫我嗎？歪個頭偷偷看你。'],
 puff:['○','Puffy cheeks','鼓鼓臉頰','These cheeks are reserved for secret snacks.','臉頰鼓鼓的，裡面藏著秘密點心喔。'],
 shy:['♡','Shy wiggle','害羞扭扭','Eep… you found my extra-soft cheeks.','哎呀…被你找到最軟的臉頰了。'],
 sniff:['✧','Tiny sniff','小鼻子聞聞','Sniff sniff… is that a snack or your hand?','聞聞…是點心，還是你的手指呀？'],
 sneeze:['✦','Tiny sneeze','小小噴嚏','Ah… ah… choo! My whiskers got tickled.','哈…哈…啾！鬍鬚被你弄癢了啦。'],
 tickle:['♫','Tummy giggle','肚肚咯咯笑','Hehe! My tummy has a giggle button.','嘿嘿嘿！你按到肚肚的笑笑開關了。'],
 wobble:['◌','Jelly wobble','布丁搖搖','Wibble wobble! I’m a tiny pudding.','晃呀晃！我變成一顆小布丁了。'],
 highfive:['✋','Tiny high five','小爪擊掌','Paw to palm! That one was perfect.','爪爪碰手心！這一下超有默契。'],
 pawwave:['✋','Paw hello','爪爪招手','Hello from my very small corner of the world.','從我的小小世界，揮爪爪跟你打招呼！'],
 hop:['✦','Bunny hops','蹦蹦小跳','Boing! Two little hops just for you.','蹦、蹦！這兩下小跳是送給你的。'],
 tiptoe:['♫','Tiny tap dance','踮腳小舞步','Left paw, right paw… did you see my dance?','左腳、右腳…有看到我的小舞步嗎？'],
 twirl:['★','Surprise twirl','驚喜轉圈','Three taps! You found my secret twirl.','三連點！被你找到秘密轉圈圈了。'],
 happyhop:['★','Happy bounce','開心蹦蹦舞','Again, again! My paws are doing a happy dance.','再來、再來！小爪爪開心得跳起舞了。'],
 snuggle:['♡','Warm snuggle','黏人貼貼','Stay a little… your hand is my cozy place.','再停一下下…你的手心是我的安心小窩。']
};
export function touchWords(type,lang){const r=TOUCH_REACTIONS[type];return r?{icon:r[0],name:r[lang==='zh-Hant'?2:1],speech:r[lang==='zh-Hant'?4:3]}:null;}
export function touchPose(type,age,reduced=false){
 const out={x:0,y:0,z:0,rx:0,ry:0,rz:0,sx:1,sy:1,sz:1,head:0,paw:0,cheek:0};
 if(reduced||age<0||age>=2.8||!TOUCH_REACTIONS[type])return out;
 const p=age/2.8,e=Math.sin(Math.PI*p),s=Math.sin(age*9),beat=Math.abs(Math.sin(p*Math.PI*3));
 switch(type){
 case 'nuzzle':out.head=e*Math.sin(age*4)*1.5;out.rz=-.09*e;out.z=.12*e;break;
 case 'nod':out.rx=.16*e*Math.sin(age*7);out.y=.025*e;break;
 case 'peek':out.head=1.6*e;out.ry=.38*e;out.rz=-.10*e;break;
 case 'puff':out.cheek=e;out.sx=1+.045*e;out.rx=-.06*e;break;
 case 'shy':out.ry=.32*e*Math.sin(age*4);out.rz=.08*e;out.head=-e;out.paw=.6*e;break;
 case 'sniff':out.z=.20*e;out.rx=-.08*e;out.sy=1+.02*e*Math.sin(age*16);break;
 case 'sneeze':{const a=Math.exp(-Math.pow((p-.45)*12,2));out.rx=-.10*e+.4*a;out.sy=1-.09*a;out.z=-.08*a;break;}
 case 'tickle':out.rz=.10*e*s;out.sx=1+.025*e*s;out.sy=1-.015*e*s;out.head=.6*e*s;break;
 case 'wobble':out.rz=.16*e*Math.sin(age*6);out.sx=1+.045*e*Math.sin(age*6);out.sy=1-.03*e*Math.sin(age*6);break;
 case 'highfive':out.paw=e;out.rz=-.1*e;out.z=.14*e;out.y=.05*e;break;
 case 'pawwave':out.paw=e*(.65+.35*s);out.ry=-.18*e;out.head=.6*e;break;
 case 'hop':out.y=.25*beat*e;out.sx=1-.035*beat;out.sy=1+.045*beat;break;
 case 'tiptoe':out.x=.10*e*Math.sin(age*6);out.rz=.13*e*Math.sin(age*6);out.y=.05*beat*e;break;
 case 'twirl':out.ry=2*Math.PI*(p*p*(3-2*p));out.y=.12*e;out.paw=e;break;
 case 'happyhop':out.y=.27*beat*e;out.ry=.5*e*Math.sin(age*5);out.rz=.13*e*Math.sin(age*8);out.paw=e;break;
 case 'snuggle':out.z=.22*e;out.rz=-.12*e;out.head=1.3*e;out.sx=1+.05*e;out.sy=1-.04*e;break;
 }
 return out;
}
