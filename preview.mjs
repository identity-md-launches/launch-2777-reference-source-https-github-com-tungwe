import {serve} from './tools/serve.mjs';
const {url}=await serve({port:4321,prefix:'/'});console.log(url);
