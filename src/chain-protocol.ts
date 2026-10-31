import {decodeEventLog,parseAbiItem,toEventSelector,keccak256,encodeFunctionData,decodeFunctionResult,parseAbi} from 'viem';
import intake from '../docs/chain/Intake.json';
import core from '../docs/chain/SqueekCore.json';
export type RawLog={address:string;blockNumber:string;blockHash:`0x${string}`;transactionHash:`0x${string}`;transactionIndex:string;logIndex:string;topics:[`0x${string}`,...`0x${string}`[]];data:`0x${string}`;removed?:boolean};
export type SourceConfig={key:string;chainId:number;address:string;startBlock:number;confirmations:number};
export const events={imd:intake.find(a=>a.type==='event'&&a.name==='Requested')!,squeek:core.find(a=>a.type==='event'&&a.name==='BatchSettled')!};
export const topics={imd:toEventSelector(events.imd as any),squeek:toEventSelector(events.squeek as any)};
export const stateABI=parseAbi(['function state() view returns ((uint64 settledThroughRound,uint64 cumulativeWork,uint96 cumulativeBlockUnits,uint64 blockHeight,uint96 blockProgress,uint32 workPerThousandBlocks,uint256 authorizationNonce,bool paused))']);
export const stateCall=encodeFunctionData({abi:stateABI,functionName:'state'});
export function decodeState(data:`0x${string}`){return decodeFunctionResult({abi:stateABI,functionName:'state',data});}
export const codeHash=(code:`0x${string}`)=>keccak256(code);
export function decodeLog(config:SourceConfig,chainId:number,log:RawLog){
 if(chainId!==config.chainId||log.address.toLowerCase()!==config.address.toLowerCase())throw Error('Wrong chain or emitter');
 if(!/^0x[\da-f]{64}$/i.test(log.blockHash)||!/^0x[\da-f]{64}$/i.test(log.transactionHash))throw Error('Invalid provenance');
 const event=events[config.key as keyof typeof events];if(!event)throw Error('Unknown source');
 const decoded=decodeEventLog({abi:[event] as any,topics:log.topics,data:log.data,strict:true}) as unknown as {eventName:string;args:Record<string,unknown>};
 const args=decoded.args;
 const n=(v:unknown)=>{if(typeof v!=='bigint'&&typeof v!=='number')throw Error('Invalid integer');return BigInt(v).toString();};
 const base={chainId,source:config.key,blockNumber:Number(BigInt(log.blockNumber)),blockHash:log.blockHash.toLowerCase(),transactionHash:log.transactionHash.toLowerCase(),transactionIndex:Number(BigInt(log.transactionIndex)),logIndex:Number(BigInt(log.logIndex)),removed:!!log.removed};
 if(config.key==='imd')return {...base,type:'request',identifier:String(args.requestId),action:String(args.action),units:undefined,round:undefined,previousRound:undefined,activeRounds:undefined};
 return {...base,type:'settlement',identifier:n(args.settledThroughRound),round:n(args.settledThroughRound),previousRound:n(args.previousSettledThroughRound),units:n(args.cumulativeBlockUnits),activeRounds:n(args.activeRoundCount)};
}
