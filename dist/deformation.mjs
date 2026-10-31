import {ease,organicOffsets} from './presence.mjs';

// The same normalized-space deformation drives the mesh and attachment points.
// Existing GLBs stay untouched. This is procedural motion, not an anatomical rig.
export function morphOffsets(x,y,z,{width,height,depth,mouth,stage},out=new Float64Array(30)){
 const h=y/height,head=ease(mouth-.12,mouth+.18,h),a=.075*head,pivot=height*(mouth-.12),dy=y-pivot;
 out[0]=x*Math.cos(a)-dy*Math.sin(a)-x;out[1]=pivot+x*Math.sin(a)+dy*Math.cos(a)-y;out[2]=0;
 const paw=ease(.20,.36,x/width)*ease(.16,.27,h)*(1-ease(.46,.58,h));
 out[3]=0;out[4]=.11*paw;out[5]=.035*paw;
 const cheek=Math.exp(-(((h-mouth-.035)*10)**2))*ease(.14,.32,Math.abs(x)/width)*ease(0,.3,z/depth);
 out[6]=Math.sign(x)*.045*cheek;out[7]=0;out[8]=.025*cheek;
 const band=stage==='baby'?[.03,.09,.16,.23]:[.12,.22,.34,.43];
 const hand=ease(.19,.32,Math.abs(x)/width)*ease(band[0],band[1],h)*(1-ease(band[2],band[3],h))*ease(-.05,.2,z/depth);
 out[9]=-Math.sign(x)*height*.02*hand;out[10]=height*.08*hand;out[11]=height*.025*hand;
 const jaw=Math.exp(-(((h-mouth+.045)*22)**2)-(x/(height*.16))**2)*ease(.1,.4,z/depth);
 out[12]=0;out[13]=-height*.025*jaw;out[14]=height*.006*jaw;
 const organic=organicOffsets(x,y,z,width,height,depth,mouth);
 for(let i=0;i<5;i++)for(let k=0;k<3;k++)out[(i+5)*3+k]=organic[i][k];
 return out;
}
export function deformPoint(x,y,z,spec,influences,out=new Float64Array(3),scratch=new Float64Array(30)){
 morphOffsets(x,y,z,spec,scratch);out[0]=x;out[1]=y;out[2]=z;
 for(let i=0;i<10;i++)for(let k=0;k<3;k++)out[k]+=scratch[i*3+k]*(influences?.[i]||0);
 return out;
}
