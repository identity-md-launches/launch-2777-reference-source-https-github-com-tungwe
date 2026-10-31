"""Read a requester-selected public receipt for a test fixture; never send a transaction.
Usage: python3 tools/record-public-receipt.py RPC_URL CHAIN_ID TRANSACTION_HASH OUTPUT.json
This optional recorder needs a free provider that serves the selected historical block.
"""
import datetime,json,sys,urllib.request
rpc_url,chain_id,transaction_hash,output=sys.argv[1:]
if not transaction_hash.startswith('0x') or len(transaction_hash)!=66:raise ValueError('Use an existing transaction hash')
def read(method,params):
    if method not in ['eth_chainId','eth_blockNumber','eth_getTransactionReceipt','eth_getBlockByNumber']:raise ValueError('Read-only recorder')
    request=urllib.request.Request(rpc_url,data=json.dumps({'jsonrpc':'2.0','id':1,'method':method,'params':params}).encode(),headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(request,timeout=15) as response:data=json.load(response)
    if data.get('error') or data.get('result') is None:raise RuntimeError(data.get('error','Historical read unavailable'))
    return data['result']
actual_chain=int(read('eth_chainId',[]),16)
if actual_chain!=int(chain_id):raise ValueError('Chain mismatch')
receipt=read('eth_getTransactionReceipt',[transaction_hash]);block=read('eth_getBlockByNumber',[receipt['blockNumber'],False])
if receipt['blockHash'].lower()!=block['hash'].lower():raise ValueError('Receipt no longer canonical')
result={'kind':'recorded-public-receipt','retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'rpc':rpc_url,'chainId':actual_chain,'observedHead':int(read('eth_blockNumber',[]),16),'receipt':receipt,'block':{key:block[key] for key in ['number','hash','parentHash','timestamp']}}
with open(output,'w') as file:json.dump(result,file,indent=2);file.write('\n')
print('Recorded canonical public receipt',transaction_hash)
