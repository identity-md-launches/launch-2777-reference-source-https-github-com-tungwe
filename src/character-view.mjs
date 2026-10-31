import {growthModel} from './growth-models.mjs';
import {bindPageLifecycle} from './page-lifecycle.mjs';
export async function initCharacterView(options){
 const mount=document.querySelector('.model-mount');
 const status=document.createElement('div');status.className='model-status';status.setAttribute('role','status');
 const label=document.createElement('span'),retry=document.createElement('button');retry.type='button';retry.className='quiet';status.append(label,retry);mount.after(status);
 let busy=false,failed=false,view=null;
 function localize(){const zh=options.getLanguage()==='zh-Hant';status.hidden=!busy&&!failed;label.textContent=failed?(zh?'3D 暫時無法載入，請重試或使用支援 WebGL 的瀏覽器。':'3D could not load. Retry or use a WebGL-capable browser.'):(zh?'Pip 正在換上新模樣…':'Pip is getting ready…');retry.textContent=zh?'重試 3D':'Retry 3D';retry.hidden=!failed;}
 const onLoading=(loading,error=false)=>{busy=loading;failed=error;localize();};
 async function start(){if(busy)return;onLoading(true);try{const url=growthModel(options.getState()?.pet?.stage).url;if(!document.querySelector(`link[data-pip-model]`)){const hint=document.createElement('link');hint.rel='preload';hint.as='fetch';hint.crossOrigin='anonymous';hint.href=url;hint.dataset.pipModel='';document.head.append(hint);}const {initPet3D}=await import('./pet-3d.mjs');view=await initPet3D({...options,onLoading});}catch{onLoading(false,true);}}
 retry.onclick=()=>view?view.retry():void start();
 let timer=setInterval(localize,1000);bindPageLifecycle({pause(){clearInterval(timer);timer=null;},resume(){localize();if(timer===null)timer=setInterval(localize,1000);},destroy(){clearInterval(timer);view?.dispose();status.remove();}});
 await start();
}
