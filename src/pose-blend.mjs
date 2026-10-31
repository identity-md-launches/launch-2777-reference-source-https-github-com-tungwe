// Three's slerpQuaternions begins by copying the first argument into `this`.
// Keep the requested target separate or that copy erases it before interpolation.
export function blendRotation(rotation,previous,amount,targetScratch){
 targetScratch.copy(rotation);
 rotation.slerpQuaternions(previous,targetScratch,amount);
}
