import {CHAINS,POLICY,IMPLEMENTATION_SLOT} from './chain-config.mjs';
import {decodeLog,topics,stateCall,decodeState,codeHash} from './chain-protocol.mjs';
const hex=n=>'0x'+n.toString(16),same=(a,b)=>String(a).toLowerCase()===String(b).toLowerCase();
export const occurrence=e=>`${e.chainId}:${e.blockHash}:${e.transactionHash}:${e.logIndex}`;
export const identity=e=>`${e.chainId}:${e.transactionHash}:${e.transactionLogIndex??e.logIndex}`;
export const completedDelta=(before,after)=>{const a=BigInt(before),b=BigInt(after);if(b<a)throw Error('Cumulative units decreased');return (b/1000000000n-a/1000000000n).toString();};
export class PublicRPC{
 constructor(config,fetcher=(...args)=>globalThis.fetch(...args)){this.config=config;this.fetcher=fetcher;this.endpoint=0;this.controller=null;}
 abort(){this.controller?.abort();}
 async call(method,params=[]){
  if(!['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_getLogs','eth_getTransactionReceipt','eth_getCode','eth_getStorageAt','eth_call'].includes(method))throw Error('Read-only RPC method required');
  const controller=new AbortController();this.controller=controller;
  const timeout=setTimeout(()=>controller.abort(),10000);
  try{const r=await this.fetcher(this.config.rpc[this.endpoint],{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:controller.signal});
   if(!r.ok){const error=new Error(`Public RPC ${r.status}`);const retry=r.headers.get('Retry-After');error.retryAfter=Math.min(POLICY.maxBackoff,Math.max(0,Number(retry)*1000||Date.parse(retry)-Date.now()||0));throw error;}
   const data=await r.json();if(data.error||data.result===undefined||data.result===null)throw Error('Public RPC could not serve this read');return data.result;
  }catch(e){this.endpoint=(this.endpoint+1)%this.config.rpc.length;throw e;}finally{clearTimeout(timeout);if(this.controller===controller)this.controller=null;}
 }
}
export class ChainMonitor{
 constructor(config,{rpc=new PublicRPC(config),storage,onChange=()=>{},clock=Date.now,hidden=()=>!!globalThis.document?.hidden}={}){
  this.config=config;this.rpc=rpc;this.storage=storage;if(storage===undefined)try{this.storage=globalThis.localStorage;}catch{this.storage=null;this.saveWarning=true;}this.onChange=onChange;this.clock=clock;this.hidden=hidden;this.key='pip-chain-v1-'+config.key;this.busy=false;this.failures=0;this.nextAt=0;this.status='connecting';this.error='';this.head=null;
  this.data={version:1,cursor:null,checkpoints:[],history:[],seen:[]};
  const validPoint=p=>p&&Number.isSafeInteger(p.number)&&p.number>=config.startBlock&&/^0x[\da-f]{64}$/i.test(p.hash||'')&&/^\d+$/.test(p.units||'')&&/^\d+$/.test(p.round||'');
  const validEvent=e=>e&&e.source===config.key&&e.chainId===config.chainId&&Number.isSafeInteger(e.blockNumber)&&e.blockNumber>=config.startBlock&&Number.isSafeInteger(e.logIndex)&&e.logIndex>=0&&/^0x[\da-f]{64}$/i.test(e.blockHash||'')&&/^0x[\da-f]{64}$/i.test(e.transactionHash||'')&&typeof e.identifier==='string'&&e.identifier.length<=100&&typeof e.confirmedAt==='string'&&Number.isFinite(Date.parse(e.confirmedAt))&&['request','settlement'].includes(e.type)&&['confirmed','removed','unconfirmed'].includes(e.status)&&/^\d+$/.test(e.completedBlocks||'');
  try{const d=JSON.parse(this.storage?.getItem(this.key)||'null');if(d?.version===1&&Array.isArray(d.history)&&Array.isArray(d.seen)&&Array.isArray(d.checkpoints)&&validPoint(d.cursor)){this.data={version:1,cursor:d.cursor,history:d.history.filter(validEvent).slice(0,POLICY.history),seen:d.seen.filter(x=>typeof x==='string'&&x.length<=128&&x.startsWith(config.chainId+':')).slice(-POLICY.seen),checkpoints:d.checkpoints.filter(validPoint).slice(-16)};}}catch{}
 }
 emit(events=[],removed=[]){try{this.storage?.setItem(this.key,JSON.stringify(this.data));}catch{this.saveWarning=true;}this.onChange({source:this.config.key,status:this.status,error:this.error,head:this.head,cursor:this.data.cursor,history:this.data.history,events,removed,saveWarning:this.saveWarning});}
 pause(){this.rpc.abort?.();this.status='paused';this.emit();}
 async block(n){const b=await this.rpc.call('eth_getBlockByNumber',[hex(n),false]);if(Number(BigInt(b.number))!==n||!/^0x[\da-f]{64}$/i.test(b.hash))throw Error('Invalid canonical block');return b;}
 async verify(n){
  const c=this.config;if(Number(BigInt(await this.rpc.call('eth_chainId')))!==c.chainId)throw Error('RPC chain mismatch');
  const code=await this.rpc.call('eth_getCode',[c.address,hex(n)]);if(code==='0x')throw Error('Contract is unavailable');
  if(c.proxy){const slot=await this.rpc.call('eth_getStorageAt',[c.address,IMPLEMENTATION_SLOT,hex(n)]);if(!same('0x'+slot.slice(-40),c.implementation))throw Error('Contract upgraded: re-verification required');const implementationCode=await this.rpc.call('eth_getCode',[c.implementation,hex(n)]);if(!same(codeHash(implementationCode),c.runtimeHash))throw Error('Implementation code mismatch');}
  else if(c.runtimeHash&&!same(codeHash(code),c.runtimeHash))throw Error('Intake code mismatch');
 }
 async checkpoint(n){const b=await this.block(n);let units='0',round='0';if(this.config.key==='squeek'){const state=decodeState(await this.rpc.call('eth_call',[{to:this.config.address,data:stateCall},hex(n)]));units=state.cumulativeBlockUnits.toString();round=state.settledThroughRound.toString();}return {number:n,hash:b.hash,units,round};}
 async baseline(n,reason){await this.verify(n);const cursor=await this.checkpoint(n);this.data.cursor=cursor;this.data.checkpoints=[cursor];this.status=reason||'watching';}
 async reconcile(){
  const cursor=this.data.cursor,block=await this.block(cursor.number);if(same(block.hash,cursor.hash))return [];
  let match=null;for(const point of [...this.data.checkpoints].reverse()){if(point.number>=cursor.number)continue;if(same((await this.block(point.number)).hash,point.hash)){match=point;break;}}
  const removed=this.data.history.filter(e=>e.status!=='removed'&&(!match||e.blockNumber>match.number));
  for(const event of removed){event.status=match?'removed':'unconfirmed';event.played=false;event.completedBlocks='0';}
  if(match){this.data.cursor=match;this.data.checkpoints=this.data.checkpoints.filter(p=>p.number<=match.number);}
  else{this.data.cursor=null;this.data.checkpoints=[];}
  // Keep transaction identities in seen: a re-included log is corrected, never re-celebrated.
  this.emit([],removed.map(identity));return removed;
 }
 async poll({force=false}={}){
  if(this.busy||this.hidden()||!force&&this.clock()<this.nextAt)return;
  this.busy=true;
  try{
   this.head=Number(BigInt(await this.rpc.call('eth_blockNumber')));const safe=this.head-this.config.confirmations;
   if(safe<this.config.startBlock)throw Error('Deployment is not confirmed');
   await this.verify(safe);
   if(this.data.cursor)await this.reconcile();
   if(!this.data.cursor){await this.baseline(safe);this.failures=0;this.nextAt=this.clock()+POLICY.poll;this.emit();return;}
   if(safe<this.data.cursor.number)throw Error('Provider head moved behind cursor');
   if(safe-this.data.cursor.number>POLICY.maxCatchup){await this.baseline(safe,'resynced');this.nextAt=this.clock()+POLICY.poll;this.emit();return;}
   const from=this.data.cursor.number+1,to=Math.min(safe,from+POLICY.range-1);
   await this.verify(safe);
   const fresh=[];
   if(from<=to){
    const logs=await this.rpc.call('eth_getLogs',[{address:this.config.address,topics:[topics[this.config.key]],fromBlock:hex(from),toBlock:hex(to)}]);
    if(!Array.isArray(logs)||logs.length>64)throw Error('Log burst exceeds safe read budget');
    let units=this.data.cursor.units,round=this.data.cursor.round;const blocks=new Map(),batchSeen=new Set(),validated=[];
    for(const log of logs.sort((a,b)=>Number(BigInt(a.blockNumber)-BigInt(b.blockNumber))||Number(BigInt(a.transactionIndex)-BigInt(b.transactionIndex))||Number(BigInt(a.logIndex)-BigInt(b.logIndex)))){
     const e=decodeLog(this.config,this.config.chainId,log);if(batchSeen.has(occurrence(e)))continue;batchSeen.add(occurrence(e));if(e.blockNumber<from||e.blockNumber>to||e.removed)throw Error('Log outside canonical range');
     let block=blocks.get(e.blockNumber);if(!block){block=await this.block(e.blockNumber);blocks.set(e.blockNumber,block);}if(!same(block.hash,e.blockHash))throw Error('Canonical hash changed');
     const receipt=await this.rpc.call('eth_getTransactionReceipt',[e.transactionHash]);
     const transactionLogIndex=receipt.logs.findIndex(l=>same(l.transactionHash,e.transactionHash)&&same(l.address,this.config.address)&&Number(BigInt(l.logIndex))===e.logIndex&&same(l.blockHash,e.blockHash)&&l.data===log.data&&JSON.stringify(l.topics)===JSON.stringify(log.topics));
     if(receipt.status!=='0x1'||!same(receipt.blockHash,e.blockHash)||transactionLogIndex<0)throw Error('Receipt did not verify log');
     e.transactionLogIndex=transactionLogIndex;
     e.completedBlocks='0';if(e.type==='settlement'){if(e.previousRound!==round)throw Error('Settlement frontier gap');e.completedBlocks=completedDelta(units,e.units);units=e.units;round=e.round;}
     e.confirmedAt=new Date(this.clock()).toISOString();e.observedAt=e.confirmedAt;e.blockTime=new Date(Number(BigInt(block.timestamp))*1000).toISOString();e.status='confirmed';e.played=false;
     validated.push(e);const id=identity(e);
     if(this.data.seen.includes(id))e.played=true;
     if(!this.data.seen.includes(id)){fresh.push(e);}
    }
    const checkpoint=await this.block(to);if(this.hidden())return;
    if(this.config.key==='squeek'){const expected=decodeState(await this.rpc.call('eth_call',[{to:this.config.address,data:stateCall},hex(to)]));if(expected.cumulativeBlockUnits.toString()!==units||expected.settledThroughRound.toString()!==round)throw Error('Settlement state reconciliation failed');}
    // Recheck the range's first event block after receipt reads to avoid committing a mixed fork.
    for(const [n,b] of blocks)if(!same((await this.block(n)).hash,b.hash))throw Error('Reorg during read');
    this.data.cursor={number:to,hash:checkpoint.hash,units,round};this.data.checkpoints.push({...this.data.cursor});this.data.checkpoints=this.data.checkpoints.slice(-16);
    const corrected=this.data.history.map(old=>{const found=validated.find(e=>identity(e)===identity(old));return ['removed','unconfirmed'].includes(old.status)&&found?{...found,played:true}:old;});
    this.data.history=[...fresh.slice().reverse(),...corrected].slice(0,POLICY.history);this.data.seen=[...new Set([...this.data.seen,...fresh.map(identity)])].slice(-POLICY.seen);
   }
   this.status='watching';this.error='';this.failures=0;this.nextAt=this.clock()+(to<safe?2000:POLICY.poll);this.emit(fresh);
  }catch(e){if(this.hidden()){this.status='paused';return;}this.failures++;this.status='unavailable';this.error=e.message;this.nextAt=this.clock()+Math.max(e.retryAfter||0,Math.min(POLICY.maxBackoff,POLICY.poll*2**Math.min(this.failures-1,4)));this.emit();}
  finally{this.busy=false;}
 }
 markPlayed(event,variant){const item=this.data.history.find(e=>identity(e)===identity(event));if(item){item.played=true;if(Number.isInteger(variant)&&variant>=0&&variant<9)item.variant=variant;}this.emit();}
}
export class ReactionQueue{
 constructor({clock=Date.now,cooldown=POLICY.cooldown}={}){this.clock=clock;this.cooldown=Math.max(15000,cooldown);this.items=[];this.last=-Infinity;}
 push(event){if(event.status!=='confirmed')return;const family=event.type==='request'?'curious':BigInt(event.completedBlocks||0)>0n?'celebrate':'pleased';
  const group=this.items.find(g=>g.family===family&&g.source===event.source);if(group){group.events.push(event);group.events=group.events.slice(-12);group.blocks=group.events.reduce((n,e)=>n+BigInt(e.completedBlocks||0),0n).toString();return;}
  this.items.push({family,source:event.source,events:[event],blocks:event.completedBlocks||'0',queuedAt:this.clock()});this.items=this.items.slice(-POLICY.queue);
 }
 remove(ids){this.items=this.items.map(g=>({...g,events:g.events.filter(e=>!ids.includes(identity(e)))})).filter(g=>g.events.length);for(const g of this.items)g.blocks=g.events.reduce((n,e)=>n+BigInt(e.completedBlocks||0),0n).toString();}
 next({sleeping=false,eating=false,touching=false,turning=false,thinking=false,playing=false,dragging=false}={}){this.items=this.items.filter(g=>this.clock()-g.queuedAt<90000);if(sleeping||eating||touching||turning||thinking||playing||dragging||this.clock()-this.last<this.cooldown)return null;const g=this.items.shift();if(g)this.last=this.clock();return g||null;}
}
