import {runtimeBase} from './runtime-base.mjs';
export const GROWTH_MODELS=Object.freeze({
 baby:{url:'/assets/growth-web/01-tiny-bean.1d931e5de814.glb',height:1.60},
 young:{url:'/assets/growth-web/02-milk-mochi.417230eb551f.glb',height:1.78},
 junior:{url:'/assets/growth-web/03-curious-baby.d8d9a3731957.glb',height:1.96},
 grown:{url:'/assets/growth-web/04-lively-youngster.de8a09e64f26.glb',height:2.08},
 star:{url:'/assets/growth-web/05-little-guardian.5db5f1b0eb2f.glb',height:2.18}
});
export const growthModel=stage=>{const spec=GROWTH_MODELS[stage]||GROWTH_MODELS.baby;return {...spec,url:new URL('.'+spec.url,runtimeBase).href};};
