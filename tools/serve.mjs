import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
export async function serve({port=0,prefix='/preview/'}={}){
 const root=resolve('dist'),headerText=await readFile(resolve(root,'_headers'),'utf8');const headers=Object.fromEntries(headerText.split('\n').filter(s=>s.startsWith('  ')&&s.includes(':')).map(s=>{const i=s.indexOf(':');return[s.slice(0,i).trim(),s.slice(i+1).trim()];}));
 const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!pathname.startsWith(prefix))throw Error();let file=resolve(root,pathname.slice(prefix.length));if(file!==root&&!file.startsWith(root+sep))throw Error();if(pathname.endsWith('/'))file=resolve(file,'index.html');const bytes=await readFile(file);const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.wasm':'application/wasm','.glb':'model/gltf-binary','.wav':'audio/wav','.flac':'audio/flac'};res.writeHead(200,{...headers,'Content-Type':types[extname(file)]||'text/plain','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404);res.end('Not found');}});
 await new Promise(r=>server.listen(port,'127.0.0.1',r));const address=server.address();return {server,url:`http://127.0.0.1:${address.port}${prefix}`};
}
