import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const files=readdirSync('.').filter(x=>x.endsWith('-tests.mjs'));
const r=spawnSync(process.execPath,['--test',...files],{stdio:'inherit'});process.exit(r.status??1);
