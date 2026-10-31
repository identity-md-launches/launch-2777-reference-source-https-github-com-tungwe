import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(readFileSync('dist/build-manifest.json'));
for(const f of manifest.files){if(!existsSync(f.path))throw Error('Missing '+f.path);const data=readFileSync(f.path);if(createHash('sha256').update(data).digest('hex')!==f.sha256)throw Error('Stale bundle '+f.path);}
const html=readFileSync('dist/index.html','utf8');for(const required of ['<title>','name="description"','property="og:title"','property="og:image"','rel="icon"'])if(!html.includes(required))throw Error('Missing metadata '+required);
for(const file of ['index.html','source/index.html','overlay/index.html','observatory/index.html']){const text=readFileSync('dist/'+file,'utf8');if(/(?:src|href)=["']\/(?!\/)/.test(text))throw Error('Root-relative URL in '+file);}
const models=readdirSync('dist/assets/growth-web').filter(f=>f.endsWith('.glb'));if(models.length!==5)throw Error('Five models required');
console.log('Export integrity passed:',manifest.files.length,'files, five GLBs, relative page URLs and share metadata.');
