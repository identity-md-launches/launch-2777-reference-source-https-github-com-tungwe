import {createRequire} from 'node:module';
import {cp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const require=createRequire(process.env.SQUEEK_TOOLS_PACKAGE||new URL('../package.json',import.meta.url));
const {build,transform}=require('esbuild');
const sha=b=>createHash('sha256').update(b).digest('hex');
await mkdir('dist/assets/code',{recursive:true});
await rm('dist/assets/code',{recursive:true,force:true});await mkdir('dist/assets/code',{recursive:true});
await cp('src','dist',{recursive:true,filter:p=>!p.endsWith('.ts')});
const threeRoot=path.dirname(path.dirname(require.resolve('three')));
for(const [source,target]of [['build/three.core.js','three.core.js'],['build/three.module.js','three.module.js'],['examples/jsm/loaders/GLTFLoader.js','GLTFLoader.js'],['examples/jsm/utils/BufferGeometryUtils.js','BufferGeometryUtils.js']]){const sourceText=(await readFile(path.join(threeRoot,source),'utf8')).replaceAll("from 'three'","from './three.module.js'").replaceAll("'../utils/BufferGeometryUtils.js'","'./BufferGeometryUtils.js'");await writeFile('dist/vendor/'+target,(await transform(sourceText,{minify:true,format:'esm',legalComments:'inline'})).code);}

for(const name of ['chain-protocol','chain-expression'])await build({entryPoints:[`src/${name}.ts`],outfile:`dist/${name}.mjs`,bundle:true,format:'esm',platform:'browser',target:'es2022',minify:false,nodePaths:[path.dirname(path.dirname(require.resolve('viem/package.json')))]});
// Keep Three local and shared with readable modules; prevent a second copy in the bundle.
const result=await build({entryPoints:['dist/studio.mjs'],outdir:'dist/assets/code',entryNames:'studio-[hash]',chunkNames:'part-[hash]',bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',minify:true,metafile:true,plugins:[{name:'shared-vendor',setup(b){b.onResolve({filter:/runtime-base\.mjs$/},()=>({path:'../../runtime-base.mjs',external:true}));b.onResolve({filter:/vendor\//},args=>({path:'../../vendor/'+args.path.split('vendor/')[1],external:true}));}}]});
const entry=Object.entries(result.metafile.outputs).find(([,v])=>v.entryPoint==='dist/studio.mjs')[0].replace(/^dist\//,'');
for(const file of ['index.html','overlay.html','overlay/index.html']){let h=await readFile('dist/'+file,'utf8');h=h.replace(/<link rel="modulepreload"[^>]+>/g,'').replace(/<script type="module" src="[^"]+"><\/script>/,`<script type="module" src="${file.includes('/')?'../':'./'}${entry}"></script>`);await writeFile('dist/'+file,h);}
await cp('docs/licenses','dist/vendor/chain-licenses',{recursive:true,filter:p=>!p.endsWith('Better-Interface-LICENSE')});
const inventory=[];async function walk(dir){for(const d of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,d.name);if(d.isDirectory())await walk(p);else if(!p.endsWith('build-manifest.json')){const bytes=await readFile(p);inventory.push({path:p,bytes:bytes.length,sha256:sha(bytes)});}}}await walk('dist');
await writeFile('dist/build-manifest.json',JSON.stringify({reference:'b3f4b1ffee5121984de2ea349fce3a36919ede3c',entry,files:inventory},null,2)+'\n');
console.log('Built production export:',entry,'files:',inventory.length,'bytes:',inventory.reduce((n,f)=>n+f.bytes,0));
