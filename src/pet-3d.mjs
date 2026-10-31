import {chainCompanion} from './chain-ui.mjs';
import {bindPageLifecycle} from './page-lifecycle.mjs';
import {blendRotation} from './pose-blend.mjs';
import {visualState,presenceText} from './visual-state.mjs';
import {morphOffsets,deformPoint} from './deformation.mjs';
import {Presence,PetGesture,damp,ballPath,gestureKey} from './presence.mjs';
import {MOUTH_HEIGHT,setMouthTarget,eatingPose} from './feeding.mjs';
import {IdleDirector,idlePose,IDLE_ACTIONS} from './idle-behavior.mjs';
import {touchZone,touchPose} from './touch-reactions.mjs';
import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {growthModel} from './growth-models.mjs';

// Five owner-created meshes. No 2D substitute and no remote model dependencies.
export async function initPet3D({getState,getNow,getLanguage,send,overlay,onLoading=()=>{}}){
 const host=document.getElementById('companion'),holder=host.querySelector('.model-mount');
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 const cleanupStack=[()=>renderer.dispose()];
 let rollback=()=>{for(const f of cleanupStack.reverse())try{f();}catch{}};
 try {
 const mouthMarker=document.createElement('span');mouthMarker.className='mouth-target';mouthMarker.setAttribute('aria-hidden','true');mouthMarker.hidden=true;holder.append(mouthMarker);
 cleanupStack.push(()=>{mouthMarker.remove();renderer.domElement.remove();holder.parentElement.querySelectorAll('.idle-caption,.presence-controls').forEach(el=>el.remove());});
 const idle=new IdleDirector(),presence=new Presence(),gestures=new PetGesture();
 let turnMode=false;
 const idleLabel=document.createElement('small');idleLabel.className='idle-caption';idleLabel.setAttribute('aria-hidden','true');idleLabel.hidden=true;holder.after(idleLabel);
 const hideIdle=()=>{host.dataset.idle='';idleLabel.hidden=true;};
 const interruptIdle=()=>{idle.pause(performance.now());hideIdle();};
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,50);cleanupStack.push(()=>disposeTree(scene));
 camera.position.set(0,1.55,5.05);camera.lookAt(0,1.15,0);
 scene.add(new THREE.HemisphereLight(0xfff9f0,0x9d8cae,2.2));
 const key=new THREE.DirectionalLight(0xfff4e5,2.5);key.position.set(-3,5,4);scene.add(key);
 const fill=new THREE.DirectionalLight(0xe3dbff,1.3);fill.position.set(3,2,-2);scene.add(fill);
 const motion=new THREE.Group(),body=new THREE.Group();scene.add(motion);motion.add(body);
 const manager=new THREE.LoadingManager();manager.setURLModifier(url=>{if(url.startsWith('blob:')||url.startsWith('data:')||new URL(url,location.href).origin===location.origin)return url;throw Error('External model dependency blocked');});
 const loader=new GLTFLoader(manager);
 let model=null,morphMeshes=[],loadedStage=null,loadingStage=null,failedStage=null,generation=0,dead=false;
 let modelHeight=1.6,modelWidth=1,modelDepth=1;
 function disposeTree(tree){if(!tree)return;const textures=new Set(),materials=new Set(),geometries=new Set();tree.traverse(o=>{if(!o.isMesh)return;geometries.add(o.geometry);for(const m of [].concat(o.material)){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});textures.forEach(t=>{t.dispose();t.source?.data?.close?.();});materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());}
 async function loadStage(stage){
  const ticket=++generation;loadingStage=stage;failedStage=null;onLoading(true);
  let next=null;
  try{
   const spec=growthModel(stage),gltf=await loader.loadAsync(spec.url);next=gltf.scene;
   if(dead||ticket!==generation||getState()?.pet?.stage!==stage){disposeTree(next);if(ticket===generation)onLoading(false);return;}
   next.updateMatrixWorld(true);
   const box=new THREE.Box3().setFromObject(next),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),factor=spec.height/size.y;
   // Bake node transforms into geometry so gentle head poses work with every GLB.
   const mouthY=MOUTH_HEIGHT[stage]||.59;
   const deformation={width:size.x*factor,height:spec.height,depth:size.z*factor,mouth:mouthY,stage};
   const poses=[];
   next.traverse(mesh=>{if(!mesh.isMesh||mesh.isSkinnedMesh)return;
    const originalGeometry=mesh.geometry;mesh.geometry=originalGeometry.clone();originalGeometry.dispose();
    const pos=mesh.geometry.attributes.position,world=mesh.matrixWorld.clone(),inverse=world.clone().invert();
    const targets=Array.from({length:10},()=>new Float32Array(pos.count*3));
    const v=new THREE.Vector3(),original=new THREE.Vector3(),origin=new THREE.Vector3(center.x,box.min.y,center.z),offsets=new Float64Array(30);
    for(let i=0;i<pos.count;i++){
     original.fromBufferAttribute(pos,i).applyMatrix4(world);
     const x=(original.x-center.x)*factor,y=(original.y-box.min.y)*factor,z=(original.z-center.z)*factor;
     morphOffsets(x,y,z,deformation,offsets);
     for(let k=0;k<10;k++)v.set(x+offsets[k*3],y+offsets[k*3+1],z+offsets[k*3+2]).divideScalar(factor).add(origin).applyMatrix4(inverse).toArray(targets[k],i*3);
    }
    mesh.geometry.morphAttributes.position=targets.map(a=>new THREE.Float32BufferAttribute(a,3));
    // Recompute target normals once, not every frame: deformed fur keeps coherent lighting.
    mesh.geometry.morphAttributes.normal=mesh.geometry.morphAttributes.position.map(position=>{const g=new THREE.BufferGeometry();g.setAttribute('position',position);g.setIndex(mesh.geometry.index);g.computeVertexNormals();const normal=g.attributes.normal;g.dispose();return normal;});
    mesh.updateMorphTargets();poses.push(mesh);
   });
   next.scale.setScalar(factor);next.position.set(-center.x*factor,-box.min.y*factor,-center.z*factor);
   if(model){body.remove(model);disposeTree(model);}model=next;body.add(model);morphMeshes=poses;
   modelHeight=spec.height;modelWidth=size.x*factor;modelDepth=size.z*factor;
   decor.scale.setScalar(modelHeight/2.15);snack.position.set(0,modelHeight*.48,modelDepth*.52);
   loadedStage=stage;failedStage=null;host.dataset.modelStage=stage;host.dataset.modelStatus='ready';canvas.dataset.stage=stage;
   onLoading(false);
  }catch(error){if(next)disposeTree(next);if(!dead&&ticket===generation){failedStage=stage;host.dataset.modelStatus='error';onLoading(false,true);}}
  finally{if(ticket===generation)loadingStage=null;}
 }
 const mat=color=>new THREE.MeshStandardMaterial({color,roughness:.7});
 const decor=new THREE.Group();body.add(decor);
 const ball=(radius,color,x,y,z,sx=1,sy=1,sz=1)=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(radius,20,12),mat(color));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);return mesh;};
 const bow=new THREE.Group(),bowShape=new THREE.Shape();bowShape.moveTo(0,0);bowShape.bezierCurveTo(-.09,.15,-.30,.18,-.25,0);bowShape.bezierCurveTo(-.30,-.18,-.09,-.15,0,0);bowShape.bezierCurveTo(.09,-.15,.30,-.18,.25,0);bowShape.bezierCurveTo(.30,.18,.09,.15,0,0);const ribbon=new THREE.Mesh(new THREE.ExtrudeGeometry(bowShape,{depth:.035,bevelEnabled:true,bevelSize:.01,bevelThickness:.01,bevelSegments:2,steps:1}),mat(0xa95282));bow.add(ribbon,ball(.055,0xeeb4ca,0,0,.05));bow.position.set(-.33,1.98,.39);bow.rotation.z=.25;decor.add(bow);
 const flower=new THREE.Group();for(let i=0;i<5;i++){const a=i*Math.PI*2/5;flower.add(ball(.09,0xf2aac6,.15*Math.cos(a),2.04+.15*Math.sin(a),.16));}flower.add(ball(.08,0xf2cb5f,0,2.04,.24));decor.add(flower);
 const crown=new THREE.Group(),band=new THREE.Mesh(new THREE.CylinderGeometry(.23,.24,.12,24,1,true),mat(0xe8b94e));band.position.y=2.07;crown.add(band);for(let i=0;i<5;i++){const a=i*Math.PI*2/5,tip=new THREE.Mesh(new THREE.ConeGeometry(.065,.18,6),mat(0xf4cf6b));tip.position.set(.2*Math.cos(a),2.19,.2*Math.sin(a));crown.add(tip);}decor.add(crown);
 const snack=new THREE.Group();body.add(snack);snack.position.set(0,.95,.63);
 const carrot=new THREE.Mesh(new THREE.ConeGeometry(.1,.38,12),mat(0xf3983d));carrot.rotation.z=.5;const berry=ball(.12,0x6f659f,0,0,0);const seed=ball(.11,0xb98c50,0,0,0,.65,1,.5);snack.add(carrot,berry,seed);
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const shadowContext=shadowCanvas.getContext('2d'),gradient=shadowContext.createRadialGradient(64,64,8,64,64,64);gradient.addColorStop(0,'rgba(78,55,88,.8)');gradient.addColorStop(.45,'rgba(78,55,88,.35)');gradient.addColorStop(1,'rgba(78,55,88,0)');shadowContext.fillStyle=gradient;shadowContext.fillRect(0,0,128,128);const ground=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,opacity:.22,depthWrite:false}));ground.rotation.x=-Math.PI/2;ground.position.y=.002;scene.add(ground);
 const playBall=new THREE.Group();scene.add(playBall);playBall.add(ball(.16,0xc4a2ce,0,.16,0));
 const stripe=new THREE.Mesh(new THREE.TorusGeometry(.161,.014,8,32),mat(0xf7deb0));stripe.position.y=.16;playBall.add(stripe);playBall.visible=false;
 const brush3d=new THREE.Group();body.add(brush3d);const brushBack=new THREE.Mesh(new THREE.BoxGeometry(.20,.055,.13),mat(0xc49b76));brush3d.add(brushBack);
 for(let i=0;i<5;i++)for(let j=0;j<3;j++){const bristle=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.055,5),mat(0xead8bc));bristle.position.set((i-2)*.035,-.04,(j-1)*.035);brush3d.add(bristle);}brush3d.visible=false;
 const canvas=renderer.domElement;canvas.className='pet-canvas';canvas.tabIndex=overlay?-1:0;canvas.setAttribute('role',overlay?'img':'button');holder.append(canvas);host.dataset.renderer='3d';
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let yaw=0,look=0;
 let start=null;let controls=null,modeButton=null,faceButton=null,statusLabel=null,modeHint=null;
 const text=(el,value)=>{if(el.textContent!==value)el.textContent=value;};
 const attr=(el,key,value)=>{if(el.getAttribute(key)!==value)el.setAttribute(key,value);};
 const blocked=()=>{const s=getState();return !!(loadingStage||!model||s?.cue?.type==='eat'&&getNow()-s.cue.at<4000||['watch','playing'].includes(s?.pet?.game?.phase)||['watch','choose'].includes(s?.pet?.hunt?.phase));};
 function pickZone(e){
  if(!model||loadingStage)return null;
  const b=canvas.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObject(model,true)[0];if(!hit)return null;
  const point=body.worldToLocal(hit.point.clone());return touchZone(point.x,point.y,point.z,modelWidth,modelHeight,modelDepth,MOUTH_HEIGHT[loadedStage]);
 }
 const cancelTouch=()=>{const id=start?.id;start=null;gestures.cancel();canvas.classList.remove('holding','stroking');host.dataset.contact='';if(id!==undefined&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);};
 if(!overlay){
  controls=document.createElement('div');controls.className='presence-controls';
  controls.innerHTML='<button type="button" class="turn-mode" aria-pressed="false"></button><button type="button" class="face-me">↺</button><span class="presence-status" role="status"></span><small class="mode-hint"></small>';
  holder.parentElement.append(controls);
  modeHint=controls.querySelector('.mode-hint');modeButton=controls.querySelector('.turn-mode');faceButton=controls.querySelector('.face-me');statusLabel=controls.querySelector('.presence-status');
  const selectMode=turn=>{chainCompanion?.cancel();cancelTouch();turnMode=turn;presence.leave();interruptIdle();host.dataset.interactionMode=turn?'turn':'pet';updateControls();};modeButton.onclick=()=>selectMode(!turnMode);selectMode(false);
  faceButton.onclick=()=>{cancelTouch();yaw=0;presence.leave();interruptIdle();updateControls();};
  canvas.setAttribute('aria-keyshortcuts','Enter Space 1 2 3 4 5 6 H ArrowLeft ArrowRight');
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary||start||blocked())return;const zone=pickZone(e);if(!turnMode&&zone&&chainCompanion?.respond(zone)){e.preventDefault();interruptIdle();return;}if(!gestures.begin({id:e.pointerId,x:e.clientX,y:e.clientY,yaw,zone,at:performance.now(),turn:turnMode}))return;interruptIdle();start=gestures.current;canvas.classList.toggle('holding',!!zone&&!start.turn);canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!e.isPrimary)return;const b=canvas.getBoundingClientRect();if(!turnMode)presence.observe((e.clientX-b.left)/b.width*2-1,1-(e.clientY-b.top)/b.height*2,performance.now());
   if(start){const p=gestures.move({id:e.pointerId,x:e.clientX,y:e.clientY});if(!p)return;if(p.turn){yaw=p.yaw+(e.clientX-p.x)*.008;}else{const over=pickZone(e);canvas.classList.toggle('stroking',!!over&&p.distance>12);canvas.classList.toggle('holding',!!over);host.dataset.contact=over?'stroking':'';}}
   else{const zone=pickZone(e);canvas.dataset.hitZone=zone||'';canvas.style.cursor=turnMode?'grab':zone?'pointer':'default';}
  });
  canvas.addEventListener('pointerleave',()=>{presence.leave();});
  canvas.addEventListener('pointerup',e=>{if(!start||e.pointerId!==start.id)return;const onBody=!!pickZone(e),result=gestures.end({id:e.pointerId,x:e.clientX,y:e.clientY,at:performance.now()});cancelTouch();if(result&&onBody&&!blocked()){if(chainCompanion?.respond(result.zone))return;chainCompanion?.cancel();void send('touch',result);}});
  canvas.addEventListener('pointercancel',e=>{if(e.pointerId===start?.id)cancelTouch();});canvas.addEventListener('lostpointercapture',e=>{if(e.pointerId===start?.id)cancelTouch();});
  addEventListener('blur',cancelTouch);cleanupStack.push(()=>removeEventListener('blur',cancelTouch));
  canvas.addEventListener('keydown',e=>{const action=gestureKey(e.key,turnMode);if(!action)return;e.preventDefault();if(e.repeat||blocked())return;interruptIdle();if(action.yawDelta)yaw+=action.yawDelta;else {if(chainCompanion?.respond(action.zone||'head'))return;chainCompanion?.cancel();void send('touch',action);}});
 }
 const resize=()=>{const {width,height}=holder.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();};
 const resizer=new ResizeObserver(resize);cleanupStack.push(()=>resizer.disconnect());resizer.observe(holder);resize();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),frameMs=matchMedia('(pointer: coarse)').matches?33:16;let previous=0,active=true,raf=0,contextLost=false,paused=false;
 const observer=new IntersectionObserver(entries=>{active=entries[0].isIntersecting;if(!active)interruptIdle();});cleanupStack.push(()=>observer.disconnect());observer.observe(canvas);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;interruptIdle();onLoading(false,true);});
 canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;onLoading(false);});
 const visibility=()=>{interruptIdle();cancelTouch();presence.leave();previous=0;};document.addEventListener('visibilitychange',visibility);cleanupStack.push(()=>document.removeEventListener('visibilitychange',visibility));
 let renderedPose=null;
 const targetRotation=new THREE.Quaternion();
 const socket=new Float64Array(3),socketScratch=new Float64Array(30),mouthWorld=new THREE.Vector3(),mouthNdc=new THREE.Vector3(),edgeNdc=new THREE.Vector3(),front=new THREE.Vector3(),towardCamera=new THREE.Vector3();
 function frame(time){if(dead||paused)return;raf=requestAnimationFrame(frame);if(document.hidden||!active||contextLost){setMouthTarget(null);mouthMarker.hidden=true;return;}if(time-previous<(reduced.matches?100:frameMs))return;const dt=previous?Math.min(.1,(time-previous)/1000):1/60;previous=time;
  const s=getState();if(!s?.pet)return;const p=s.pet;
  const eatingNow=s.cue?.type==='eat'&&getNow()-s.cue.at<4000;
  if(p.stage!==loadedStage&&p.stage!==loadingStage&&p.stage!==failedStage&&!(model&&eatingNow))void loadStage(p.stage);
  const draggingFood=host.classList.contains('feeding-drag');if(draggingFood){yaw=damp(yaw,Math.round(yaw/(2*Math.PI))*2*Math.PI,9,dt);look=0;}
  const attention=!turnMode&&time-presence.lastSeen<2400;
  const visual=visualState(s,getNow(),{turning:turnMode,contact:!!start&&!start.turn&&canvas.classList.contains('holding'),food:draggingFood,attention,loading:!model||!!loadingStage,thinking:host.classList.contains('chat-thinking'),reduced:reduced.matches});
  const {age,reaction}=visual,t=time/1000,wave=Math.sin(t*12),move=!reduced.matches;
  body.scale.set(1,1,1);motion.position.set(0,0,0);motion.rotation.set(0,yaw+(move?look:0),0);
  const embodiment=presence.tick(time,dt,{sleeping:p.life?.sleeping,reduced:!move,busy:!['attention','contact','idle','food'].includes(visual.mode),contact:visual.contact,food:visual.food,energy:p.life?.energy});
  const headPose=move&&['nuzzle','pet','stroke','brush','cuddle'].includes(reaction)?Math.sin(age*4):move&&reaction==='eat'?.18*Math.sin(t*10):0;
  const pawPose=move&&['highfive','wave','dance'].includes(reaction)?.5+.5*Math.sin(age*9):0;
  for(const mesh of morphMeshes){mesh.morphTargetInfluences[0]=headPose;mesh.morphTargetInfluences[1]=pawPose;mesh.morphTargetInfluences[2]=0;mesh.morphTargetInfluences[3]=0;mesh.morphTargetInfluences[4]=0;mesh.morphTargetInfluences[5]=embodiment.headYaw;mesh.morphTargetInfluences[6]=embodiment.headPitch;mesh.morphTargetInfluences[7]=embodiment.ear;mesh.morphTargetInfluences[8]=embodiment.sniff;mesh.morphTargetInfluences[9]=embodiment.breath;}
  if(move&&reaction==='nuzzle')motion.rotation.x=-.04;
  if(move&&reaction==='tickle'){motion.rotation.z=.045*wave;body.scale.x=1+.035*wave;body.scale.y=1-.025*wave;}
  if(move&&['highfive','confetti','cheer','wave'].includes(reaction)){motion.position.y=.09*Math.abs(Math.sin(age*6));motion.rotation.z=.06*Math.sin(age*6);}
  if(reaction==='eat'){const chew=eatingPose(age,reduced.matches);motion.rotation.x=move?.025*Math.sin(age*15):0;
   for(const mesh of morphMeshes){mesh.morphTargetInfluences[0]=chew.head;mesh.morphTargetInfluences[2]=chew.cheek;mesh.morphTargetInfluences[4]=chew.jaw;mesh.morphTargetInfluences[3]=chew.paw;}
   snack.position.set(0,modelHeight*(MOUTH_HEIGHT[loadedStage]||.59)-.07+chew.nibble,modelDepth*.50+.07);snack.scale.setScalar(chew.food);snack.rotation.z=move?.08*Math.sin(age*12):0;
  }
  playBall.visible=reaction==='ball';
  if(playBall.visible){const bp=ballPath(age,!move);playBall.position.set(bp.x,0,bp.z);playBall.rotation.z=0;playBall.children.forEach(o=>o.rotation.x=bp.turn);if(move){motion.rotation.y+=.13*Math.sin(Math.PI*age/4);for(const mesh of morphMeshes)mesh.morphTargetInfluences[1]=bp.paw;}}
  brush3d.visible=reaction==='brush';if(brush3d.visible){brush3d.position.set(modelWidth*.21,modelHeight*(.83+(move?.035*Math.sin(age*6):0)),modelDepth*.24);brush3d.rotation.z=-.3;}

  if(move&&reaction==='dance'){motion.rotation.z=.12*Math.sin(age*8);motion.position.y=.08*Math.abs(Math.sin(age*8));}
  if(move&&reaction==='cuddle'){body.scale.x=1.04;body.scale.y=.96;motion.rotation.z=.04*Math.sin(age*3);}
  if(move&&reaction==='wake'){body.scale.y=1+.06*Math.max(0,Math.sin(age*2));body.scale.x=1-.025*Math.max(0,Math.sin(age*2));}
  if(s.cue?.touch&&reaction){const pose=touchPose(reaction,age,reduced.matches);
   body.scale.set(pose.sx,pose.sy,pose.sz);motion.position.set(pose.x,pose.y,pose.z);motion.rotation.set(pose.rx,yaw+pose.ry,pose.rz);
   for(const mesh of morphMeshes){mesh.morphTargetInfluences[0]=pose.head;mesh.morphTargetInfluences[1]=pose.paw;mesh.morphTargetInfluences[2]=pose.cheek;}
  }
  const idleAction=idle.tick(time,{blocked:visual.idleBlocked,energy:p.life?.energy,fullness:p.fullness,bond:p.life?.bond});
  if(idleAction){const pose=idlePose(idleAction.type,idleAction.age,p.stage);
   body.scale.set(pose.sx,pose.sy,pose.sz);motion.position.set(pose.x,pose.y,pose.z);motion.rotation.set(pose.rx,yaw+pose.ry,pose.rz);
   for(const mesh of morphMeshes){mesh.morphTargetInfluences[0]=pose.head;mesh.morphTargetInfluences[1]=pose.paw;mesh.morphTargetInfluences[2]=pose.cheek;mesh.morphTargetInfluences[3]=pose.groom;}
   host.dataset.idle=idleAction.type;text(idleLabel,IDLE_ACTIONS[idleAction.type][getLanguage()==='zh-Hant'?'zh':'en']);idleLabel.hidden=false;
  }else hideIdle();
  if(move&&embodiment.lean>0&&!reaction&&!p.life?.sleeping){motion.rotation.z-=.045*embodiment.lean;motion.position.z+=.09*embodiment.lean;for(const mesh of morphMeshes)mesh.morphTargetInfluences[0]+=.75*embodiment.lean;}
  if(move&&visual.food){motion.rotation.x=-.035;for(const mesh of morphMeshes){mesh.morphTargetInfluences[8]=.75*(.5+.5*Math.sin(t*16));mesh.morphTargetInfluences[3]=.25;}}
  if(p.life?.sleeping){motion.position.y=-.03;motion.rotation.x=.10;body.scale.y=move?.95+.01*Math.sin(t*2):.95;}
  const chainPose=chainCompanion?.frame(time,{sleeping:!!p.life?.sleeping,eating:eatingNow,touching:!!start||!!reaction,turning:turnMode,thinking:host.classList.contains('chat-thinking')||!!document.activeElement?.closest('.chat-form'),playing:['watch','playing'].includes(p.game?.phase)||['watch','choose'].includes(p.hunt?.phase),dragging:draggingFood},p.stage);
  if(chainPose){hideIdle();idle.pause(time);body.scale.set(chainPose.sx,chainPose.sy,1);motion.position.set(chainPose.x,chainPose.y,chainPose.z);motion.rotation.set(chainPose.rx,yaw+chainPose.ry,chainPose.rz);for(const mesh of morphMeshes){mesh.morphTargetInfluences[0]=chainPose.head;mesh.morphTargetInfluences[1]=chainPose.paw;mesh.morphTargetInfluences[2]=chainPose.cheek;mesh.morphTargetInfluences[3]=chainPose.hands;mesh.morphTargetInfluences[5]=chainPose.headYaw;mesh.morphTargetInfluences[6]=chainPose.headPitch;mesh.morphTargetInfluences[7]=chainPose.ear;mesh.morphTargetInfluences[8]=chainPose.sniff;}}
  // Blend from the last rendered pose instead of snapping when a new action interrupts.
  const blend=move?1-Math.exp(-12*dt):1;
  if(renderedPose){motion.position.lerpVectors(renderedPose.position,motion.position,blend);blendRotation(motion.quaternion,renderedPose.rotation,blend,targetRotation);body.scale.lerpVectors(renderedPose.scale,body.scale,blend);}
  if(!renderedPose)renderedPose={position:new THREE.Vector3(),rotation:new THREE.Quaternion(),scale:new THREE.Vector3()};renderedPose.position.copy(motion.position);renderedPose.rotation.copy(motion.quaternion);renderedPose.scale.copy(body.scale);
  for(const mesh of morphMeshes){const prev=mesh.userData.lastMorph??=new Float32Array(10);mesh.morphTargetInfluences.forEach((v,i)=>{mesh.morphTargetInfluences[i]=move?damp(prev[i],v,14,dt):v;prev[i]=mesh.morphTargetInfluences[i];});}
  ground.scale.setScalar(1-Math.min(.25,Math.max(0,motion.position.y)*.8));ground.material.opacity=.22-Math.min(.10,Math.max(0,motion.position.y)*.2);
  updateControls(visual.mode);if(chainCompanion?.caption()&&statusLabel)text(statusLabel,chainCompanion.caption());

  snack.visible=reaction==='eat';carrot.visible=p.lastFood==='carrot';berry.visible=p.lastFood==='berry';seed.visible=p.lastFood==='seed';
  const influences=morphMeshes[0]?.morphTargetInfluences;
  const deformation={width:modelWidth,height:modelHeight,depth:modelDepth,mouth:MOUTH_HEIGHT[loadedStage]||.59,stage:loadedStage};
  deformPoint(0,modelHeight*.85,0,deformation,influences,socket,socketScratch);decor.position.set(socket[0],socket[1]-modelHeight*.85,socket[2]);decor.rotation.set((influences?.[6]||0)*.09,(influences?.[5]||0)*.13,(influences?.[0]||0)*.075);
  bow.visible=p.accessory==='bow';flower.visible=p.accessory==='flower';crown.visible=p.accessory==='crown';
  attr(canvas,'aria-label',modeHint?.textContent||'3D hamster');
  // The mouth uses the SAME morph offsets and smoothed pose as the mesh.
  deformPoint(0,modelHeight*deformation.mouth,modelDepth*.50,deformation,influences,socket,socketScratch);
  if(snack.visible){const chew=eatingPose(age,!move);snack.position.set(socket[0],socket[1]-.07+chew.nibble,socket[2]+.07);}
  body.updateWorldMatrix(true,false);
  mouthWorld.set(...socket);body.localToWorld(mouthWorld);
  front.set(0,0,1).applyQuaternion(motion.quaternion);towardCamera.copy(camera.position).sub(mouthWorld).normalize();
  if(model&&!loadingStage&&!p.life?.sleeping&&!['eating','game'].includes(visual.mode)&&front.dot(towardCamera)>.45){
   const b=canvas.getBoundingClientRect(),mouth=mouthNdc.copy(mouthWorld).project(camera);
   edgeNdc.set(socket[0]+modelHeight*.10,socket[1],socket[2]);body.localToWorld(edgeNdc).project(camera);
   const x=b.left+(mouth.x+1)*b.width/2,y=b.top+(1-mouth.y)*b.height/2,radius=THREE.MathUtils.clamp(Math.abs(edgeNdc.x-mouth.x)*b.width/2,18,36);
   const visible=mouth.z>-1&&mouth.z<1&&x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom&&y>0&&y<innerHeight;
   setMouthTarget({x,y,radius,visible});mouthMarker.hidden=!draggingFood||!visible;
   mouthMarker.style.left=(x-b.left)+'px';mouthMarker.style.top=(y-b.top)+'px';
   text(mouthMarker,getLanguage()==='zh-Hant'?(host.classList.contains('snack-near')?'放開，啊姆！':'餵這裡'):(host.classList.contains('snack-near')?'Let go · nom!':'Feed here'));
  }else{setMouthTarget(null);mouthMarker.hidden=true;}
  renderer.render(scene,camera);
 }
 function updateControls(mode='idle'){
  if(!controls)return;const zh=getLanguage()==='zh-Hant';
  text(modeButton,turnMode?(zh?'↻ 轉身模式 ⇄':'↻ Turn mode ⇄'):(zh?'♡ 撫摸模式 ⇄':'♡ Pet mode ⇄'));
  attr(modeButton,'aria-pressed',String(turnMode));
  attr(modeButton,'aria-label',turnMode?(zh?'目前為轉身模式，按下切換為撫摸模式':'Turn mode. Press to switch to Pet mode'):(zh?'目前為撫摸模式，按下切換為轉身模式':'Pet mode. Press to switch to Turn mode'));
  attr(faceButton,'aria-label',zh?'回正':'Face me');attr(faceButton,'title',zh?'回正':'Face me');
  text(statusLabel,turnMode?'':presenceText(mode,zh));
  text(modeHint,turnMode?(zh?'左右拖曳轉身 · 按模式鍵切換撫摸':'Drag left/right to turn · Switch modes to pet'):(zh?'輕撫身體／長按貼貼 · 按模式鍵切換轉身':'Stroke or hold to snuggle · Switch modes to turn'));
 }
 raf=requestAnimationFrame(frame);cleanupStack.push(()=>cancelAnimationFrame(raf));
 const cleanup=()=>{if(dead)return;setMouthTarget(null);dead=true;generation++;document.removeEventListener('visibilitychange',visibility);removeEventListener('blur',cancelTouch);cancelTouch();controls?.remove();mouthMarker.remove();idleLabel.remove();canvas.remove();cancelAnimationFrame(raf);resizer.disconnect();observer.disconnect();disposeTree(scene);renderer.dispose();};
 rollback=cleanup;
 const dispose=bindPageLifecycle({pause(){paused=true;cancelAnimationFrame(raf);visibility();setMouthTarget(null);mouthMarker.hidden=true;},resume(){paused=false;previous=0;resize();raf=requestAnimationFrame(frame);},destroy:cleanup});
 await loadStage(getState()?.pet?.stage||'baby');
 return {retry(){if(contextLost){location.reload();return;}if(!loadingStage)void loadStage(getState()?.pet?.stage||'baby');},dispose};
 }catch(error){rollback();throw error;}
}
