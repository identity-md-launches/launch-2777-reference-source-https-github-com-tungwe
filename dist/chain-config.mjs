// Verified 2026-10-31. Details and ABI provenance: docs/chain/manifest.json.
export const IMPLEMENTATION_SLOT='0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
export const CHAINS=Object.freeze({
 imd:{key:'imd',chainId:1,address:'0xa43e6f75ee006411f79ac1c84120606c2330de82',startBlock:26164897,confirmations:3,explorer:'https://etherscan.io',name:'IMD / Ethereum mainnet',rpc:['https://ethereum-rpc.publicnode.com','https://eth.llamarpc.com'],proxy:false,runtimeHash:'0xdf76139e1b7dfe05bdf55e48e65076e4763a40d470fcf5da58034a488e30bdaf'},
 squeek:{key:'squeek',chainId:11155111,address:'0x74665daeca35a2303e767e76a2ff1fb6f93e119f',startBlock:11902282,confirmations:12,explorer:'https://sepolia.etherscan.io',name:'Squeekchain / Sepolia testnet',rpc:['https://ethereum-sepolia-rpc.publicnode.com','https://0xrpc.io/sep'],proxy:true,implementation:'0x0a71c86ab63a77675002a389fdf4d096a07b11e2',runtimeHash:'0xe8a5a5aa913141ddd8951cf9fcc1375044b541773e5b0bf8ee04a5c7ac2d194d'}
});
export const POLICY=Object.freeze({range:96,overlap:32,maxCatchup:512,history:12,seen:256,queue:3,cooldown:15000,poll:20000,maxBackoff:300000});
export function explorerURL(chainId,hash){const c=Object.values(CHAINS).find(c=>c.chainId===chainId);return c&&/^0x[\da-f]{64}$/i.test(hash||'')?c.explorer+'/tx/'+hash:null;}
