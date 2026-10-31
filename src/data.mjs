export const API='https://api.squeekchain.com';
export const ENDPOINTS={status:'/v1/status',stats:'/v1/measurement/stats?range=7d',settlements:'/v1/settlements?range=24h'};
export function uint(v){return typeof v==='string'&&/^\d+$/.test(v)?BigInt(v):typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?BigInt(v):null;}
export function integer(v){const n=uint(v);return n===null?'—':n.toLocaleString('en-US');}
export function fixed(v,decimals=18,places=2){const n=uint(v);if(n===null)return '—';const base=10n**BigInt(decimals);const fraction=(n%base).toString().padStart(decimals,'0').slice(0,places);return (n/base).toLocaleString('en-US')+(places?'.'+fraction.padEnd(places,'0'):'');}
export function ratio(a,b){a=uint(a);b=uint(b);return a===null||b===null||b===0n?null:Math.min(100,Number(a*10000n/b)/100);}
export function validate(kind,data){
 const versions=kind==='settlements'?[1,3]:[1];
 if(!data||typeof data!=='object'||!versions.includes(data.schemaVersion))throw Error('資料格式或版本不相容');
 if(data.status==='unavailable')throw Error('官方資料暫不可用'+(data.reason?` (${data.reason})`:''));
 if(data.chain&&String(data.chain.chainId)!=='11155111')throw Error('資料並非 Sepolia 測試網');
 if(kind==='status'&&(!('measurement' in data)||!data.builder))throw Error('缺少跑輪狀態欄位');
 if(kind==='stats'&&!Array.isArray(data.activity?.days))throw Error('缺少每日統計欄位');
 if(kind==='settlements'&&(!Array.isArray(data.recentSettlements)||!data.summary))throw Error('缺少結算欄位');
 return data;
}
export function isOld(timestamp,seconds=120,now=Date.now()){const t=Date.parse(timestamp);return !Number.isFinite(t)||now-t>seconds*1000;}
export function measurementFresh(data,now=Date.now()){const m=data?.measurement;return !!m&&m.freshness==='online'&&!isOld(m.receivedAt,m.staleAfterSeconds??120,now);}
export function txUrl(hash){return /^0x[\da-f]{64}$/i.test(hash??'')?`https://sepolia.etherscan.io/tx/${hash}`:null;}
export class Source {
 constructor(kind,fetcher=(...args)=>fetch(...args)){this.kind=kind;this.fetcher=fetcher;this.data=null;this.error=null;this.checkedAt=null;this.nextAt=0;this.failures=0;this.cacheSource=null;}
 async refresh(now=Date.now()){
  if(now<this.nextAt)return;
  try{
   const r=await this.fetcher(API+ENDPOINTS[this.kind],{credentials:'omit',cache:'no-cache',signal:AbortSignal.timeout(12000)});
   if(!r.ok){const retry=r.headers.get('Retry-After');const wait=retry?(Number.isFinite(Number(retry))?Number(retry)*1000:Date.parse(retry)-now):0;this.nextAt=now+Math.max(0,wait||0);throw Error(`API 回應 ${r.status}`);}
   this.data=validate(this.kind,await r.json());this.cacheSource=r.headers.get('X-Squeek-Settlement-Source');this.checkedAt=Date.now();this.error=null;this.failures=0;
   this.nextAt=now+(this.kind==='status'?15000:60000);
  }catch(e){this.error=e.name==='TimeoutError'?'連線逾時':e.message;this.failures++;this.nextAt=Math.max(this.nextAt,now+Math.min(300000,15000*2**Math.min(this.failures-1,5)));}
 }
}
