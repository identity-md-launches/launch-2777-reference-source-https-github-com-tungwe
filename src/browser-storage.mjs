export const PET_KEY='squeek-public-pet-v1';
let memory=new Map();
export function readFileSync(key){const data=localStorage.getItem(key);if(data===null){const e=new Error('Missing');e.code='ENOENT';throw e;}return data;}
export function writeFileSync(key,data){memory.set(key,data);}
export function renameSync(from,to){const data=memory.get(from);localStorage.setItem(to,data);memory.delete(from);}
export function mkdirSync(){}
export function dirname(){return '';}
export function randomInt(max){const n=new Uint32Array(1);crypto.getRandomValues(n);return n[0]%max;}
