// Run after extracting the pinned archive to a temporary directory. No rig or art is substituted.
import {createRequire} from 'node:module';
import {readdir,readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const input=process.argv[2]||'dist/assets/growth';
const require=createRequire(process.env.SQUEEK_TOOLS_PACKAGE||new URL('../package.json',import.meta.url));
const {NodeIO}=await import(require.resolve('@gltf-transform/core'));
const {ALL_EXTENSIONS}=await import(require.resolve('@gltf-transform/extensions'));
const {weld,simplify,textureCompress,prune}=await import(require.resolve('@gltf-transform/functions'));
const {MeshoptSimplifier}=await import(require.resolve('meshoptimizer'));
const sharp=(await import(require.resolve('sharp'))).default;
await MeshoptSimplifier.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),report=[];
for(const file of (await readdir(input)).filter(f=>f.endsWith('.glb')).sort()){
 const document=await io.read(input+'/'+file);
 await document.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.14,error:.005}),textureCompress({encoder:sharp,targetFormat:'webp',resize:[512,512],quality:84}),prune());
 const bytes=await io.writeBinary(document);
 const target=file.replace('.glb','.'+createHash('sha256').update(bytes).digest('hex').slice(0,12)+'.glb');
 for(const old of (await readdir('dist/assets/growth-web')).filter(f=>f.startsWith(file.slice(0,2))&&f!==target))await rm('dist/assets/growth-web/'+old);
 await writeFile('dist/assets/growth-web/'+target,bytes);const sourceFile='src/growth-models.mjs';const sourceText=await readFile(sourceFile,'utf8');await writeFile(sourceFile,sourceText.replace(new RegExp('/assets/growth-web/'+file.slice(0,-4)+'\\.[a-f0-9]+\\.glb','g'),'/assets/growth-web/'+target));report.push({file:target,bytes:bytes.length,vertices:document.getRoot().listAccessors().filter(a=>a.getType()==='VEC3').map(a=>a.getCount())});
}
await writeFile('docs/model-optimization.json',JSON.stringify(report,null,2)+'\n');console.log(report);
