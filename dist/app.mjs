import {API,ENDPOINTS,Source,integer,fixed,ratio,uint,txUrl,measurementFresh,isOld} from './data.mjs';
import {examples} from './demo.mjs';
import {getLanguage,setLanguage,t,captureStatic,translateStatic,translateDynamic} from './i18n.mjs';
const $=id=>document.getElementById(id), set=(id,value)=>$(id).textContent=t(value);
const sources=Object.fromEntries(Object.keys(ENDPOINTS).map(k=>[k,new Source(k)]));
let demo=false,paused=false,busy=false,days=7,demoData=null;
const time=v=>{const d=new Date(v);return v&&Number.isFinite(d.getTime())?new Intl.DateTimeFormat(getLanguage()==='en'?'en-GB':'zh-TW',{timeZone:'Asia/Taipei',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(d):'—';};
const stateNames={accepted:'已接受',stale:'資料過期',blocked:'受阻',unavailable:'暫不可用',empty:'佇列為空',ready:'等待結算',preparing:'準備中',submitted:'已送出',retrying:'重試中',disabled:'已停用'};
const showState=x=>stateNames[x]??(x?'未知狀態':'—');
const known=x=>x?.status!=='unavailable'?x:null;
function render(){
 const data=demo?demoData:Object.fromEntries(Object.entries(sources).map(([k,s])=>[k,s.data]));
 const st=data.status,stats=data.stats,s=data.settlements,m=st?.measurement,b=known(st?.builder),mining=known(s?.mining),q=known(st?.settlementQueue);
 const fresh=measurementFresh(st)&&!sources.status.error&&!paused;
 set('distance',fixed(m?.distanceMm,6,2));set('rpm',fixed(m?.rpmMilli,3,1));set('speed',uint(m?.speedMmPerSecond)===null?'—':fixed(uint(m.speedMmPerSecond)*36n/10n+'',3,2));
 set('wheelState',!m?'等待資料':demo?'示範資料':!fresh?'非即時資料':(m.rpmMilli>0?'跑輪轉動中':'跑輪暫歇'));
 document.querySelector('.wheel-card').classList.toggle('running',!!m&&(demo||fresh)&&m.rpmMilli>0);
 set('observed','感測時間 '+time(m?.observedAt));
 const provenance={hardware:'硬體感測',simulated:'模擬資料',replay:'重播資料',derived:'推導資料'};
 set('provenance',provenance[m?.provenance]??'資料來源待確認');
 const progress=ratio(b?.projected?.blockProgress,'1000000000');set('progress',progress===null?'—':progress.toFixed(1)+'%');$('ring').style.setProperty('--p',(progress??0)+'%');
 set('projected',integer(b?.projected?.blockHeight));set('blocks',integer(b?.anchor?.blockHeight));set('dayBlocks',integer(s?.summary?.completedBlockCount));set('settlementCount',integer(s?.summary?.settlementCount)+' 個結算批次');
 set('minted',fixed(mining?.rangeMintedBaseUnits,18,0));set('lifetime',fixed(stats?.lifetime?.observedDistanceMm,6,2));
 // Current API calls this miningMintedBaseUnits. Legacy response used totalMintedBaseUnits.
 const total=mining?.miningMintedBaseUnits??mining?.totalMintedBaseUnits;
 set('totalMinted',fixed(total,18,2));const percent=ratio(total,mining?.supplyCap);set('supplyPercent',percent===null?'—':percent.toFixed(2)+'%');$('supplyFill').style.width=(percent??0)+'%';set('supplyCap','上限 '+fixed(mining?.supplyCap,18,0)+' SQK');
 set('oracle',showState(st?.oracle?.state));set('queue',showState(q?.state));set('rounds',integer(q?.buffered?.roundCount));
 set('coverage','資料覆蓋率 '+(stats?.activity?.coverage?.coverageBps==null?'—':(stats.activity.coverage.coverageBps/100).toFixed(1)+'%'));
 const dayData=stats?.activity?.days?.slice(-days);const chart=$('chart');chart.replaceChildren();
 if(!dayData?.length){const p=document.createElement('p');p.className='empty';p.textContent=stats?'此期間沒有觀測紀錄':'尚無活動資料，等待公開 API 回應。';chart.append(p);}else{
 const max=dayData.reduce((max,d)=>{const n=uint(d.distanceMm);return n!==null&&n>max?n:max;},1n);
 for(const d of dayData){const col=document.createElement('div');col.className='chart-col';const v=uint(d.distanceMm);col.title=`${d.date} · ${fixed(d.distanceMm,6,2)} km · 覆蓋率 ${(d.coverage?.coverageBps??0)/100}%`;const label=document.createElement('span');label.className='value';label.textContent=fixed(d.distanceMm,6,2);col.append(label);if(v!==null){const bar=document.createElement('div');bar.className='bar'+(d.coverage?.coverageBps<10000?' partial':'');bar.style.height=(Number(v*125n/max))+'px';col.append(bar);}const date=document.createElement('span');date.className='date';date.textContent=d.date.slice(5).replace('-','/');col.append(date);chart.append(col);}}
 const rows=$('rows');rows.replaceChildren();const list=s?.recentSettlements?.slice(0,8);
 if(!list?.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=6;td.textContent=s?'此期間沒有結算紀錄':'尚無結算資料，等待公開 API 回應。';tr.append(td);rows.append(tr);}else for(const r of list){const tr=document.createElement('tr');for(const val of ['#'+integer(r.settledThroughRound),integer(r.completedBlockCount),integer(r.workAdded),time(r.blockTimestamp)]){const td=document.createElement('td');td.textContent=val;tr.append(td);}const status=document.createElement('td');const badge=document.createElement('span');badge.className='confirmed';badge.textContent=demo?'示範':r.confirmationStatus==='safe'?'安全確認':'待確認';status.append(badge);tr.append(status);const td=document.createElement('td');const url=txUrl(r.transactionHash);if(url&&!demo){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=r.transactionHash.slice(0,6)+'…'+r.transactionHash.slice(-4)+' ↗';a.setAttribute('aria-label',`查看輪次 ${r.settledThroughRound} 的交易`);td.append(a);}else td.textContent='—';tr.append(td);rows.append(tr);}
 set('safeBlock','安全確認至 Ethereum 區塊 '+integer(s?.chain?.safeThroughBlock)+' · 索引可能落後即時鏈頭。');
 const problems=Object.values(sources).filter(x=>x.error||!x.data||isOld(x.data?.generatedAt,180)||x.cacheSource==='durable-cache').length;
 const notice=$('notice');notice.className='notice'+(demo?' demo':problems||!fresh?' warning':'');
 notice.textContent=demo?'示範模式：以下全部為虛構範例，僅供檢視介面；不代表目前鏈上狀態。':paused?'已暫停自動更新。畫面保留最後讀取的資料。':problems?`${problems} 個資料來源尚未就緒、連線失敗或資料過期。已有資料會保留；請查看下方來源狀態。`:!fresh?'公開資料已取得，但感測讀數過期或暫不可用。':'公開 API 已連線 · 感測資料新鮮 · 狀態每 15 秒、統計每 60 秒更新。';
 const names={status:'跑輪與驗證',stats:'每日觀測統計',settlements:'結算與發行'};const box=$('sourceRows');box.replaceChildren();
 for(const [key,source]of Object.entries(sources)){const row=document.createElement('div');row.className='source-row';const title=document.createElement('b');title.textContent=names[key];const link=document.createElement('a');link.href=API+ENDPOINTS[key];link.target='_blank';link.rel='noopener noreferrer';link.textContent=ENDPOINTS[key]+' ↗';const state=document.createElement('div');const dataTime=data[key]?.generatedAt;state.textContent=demo?'示範資料':source.error?'連線失敗／舊資料':!source.data?'等待資料':source.cacheSource==='durable-cache'?'官方快取資料':isOld(dataTime,180)?'資料已過期':'已連線';if(source.error)state.className='source-error';const detail=document.createElement('small');detail.textContent=demo?'範例數字不代表目前狀態':`資料產生：${time(dataTime)} · 本機讀取：${time(source.checkedAt)}`;state.append(detail);if(source.error&&!demo){const e=document.createElement('small');e.textContent=source.error;state.append(e);}row.append(title,link,state);box.append(row);}
 for(const id of ['notice','chart','rows','sourceRows'])translateDynamic($(id));
 $('pause').textContent=t(paused?'繼續更新':'暫停更新');
}
async function update(){if(busy||demo||paused||document.hidden)return;busy=true;$('refresh').disabled=true;try{await Promise.all(Object.values(sources).map(s=>s.refresh()));}finally{busy=false;$('refresh').disabled=false;render();}}
$('refresh').addEventListener('click',()=>{if(demo){demoData=examples();render();return;}paused=false;$('pause').textContent='暫停更新';$('pause').setAttribute('aria-pressed','false');for(const s of Object.values(sources))if(!s.error)s.nextAt=0;update();});
$('pause').addEventListener('click',()=>{paused=!paused;$('pause').textContent=paused?'繼續更新':'暫停更新';$('pause').setAttribute('aria-pressed',String(paused));render();if(!paused)update();});
$('demo').addEventListener('change',()=>{demo=$('demo').checked;demoData=demo?examples():null;$('pause').disabled=demo;render();if(!demo)update();});
document.querySelectorAll('[data-days]').forEach(button=>button.addEventListener('click',()=>{days=Number(button.dataset.days);document.querySelectorAll('[data-days]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
captureStatic();translateStatic();$('language').value=getLanguage();
$('language').addEventListener('change',()=>{setLanguage($('language').value);translateStatic();render();});
render();update();setInterval(()=>{if(!document.hidden){render();update();}},5000);
