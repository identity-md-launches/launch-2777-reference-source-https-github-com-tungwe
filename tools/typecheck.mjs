import {createRequire} from 'node:module';
const require=createRequire(process.env.SQUEEK_TOOLS_PACKAGE||new URL('../package.json',import.meta.url));
const ts=require('typescript');
// Resolve dependencies from the install used for this build without creating repository node_modules.
const config=ts.readConfigFile('tsconfig.json',ts.sys.readFile);if(config.error)throw Error(ts.flattenDiagnosticMessageText(config.error.messageText,'\n'));
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,'.');const host=ts.createCompilerHost(parsed.options);
host.resolveModuleNames=(names,file)=>names.map(name=>{const found=ts.resolveModuleName(name,file,parsed.options,host).resolvedModule;if(found)return found;if(name==='viem')return {resolvedFileName:require.resolve('viem').replace('/_cjs/index.js','/_types/index.d.ts'),extension:ts.Extension.Dts,isExternalLibraryImport:true};return undefined;});
const program=ts.createProgram(parsed.fileNames,parsed.options,host);const diagnostics=ts.getPreEmitDiagnostics(program);for(const d of diagnostics)console.error(ts.formatDiagnosticsWithColorAndContext([d],{getCanonicalFileName:f=>f,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n'}));if(diagnostics.length)process.exit(1);console.log('Typecheck passed:',parsed.fileNames.length,'TypeScript modules');
