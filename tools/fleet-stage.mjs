// Prepare only the FLEET showcase over the exact current shared production source.
// Publication belongs exclusively to npm run deploy:production.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {vercel,PROJECT} from './mmp-runtime.mjs';
const repo=process.cwd(), root=path.join(repo,'.prographics-release/fleet-showcase-20261006');
const project=await vercel('/v9/projects/'+PROJECT),base=project.targets.production;
const tree=await vercel('/v6/deployments/'+base.id+'/files'),refs=[];
function walk(nodes,prefix=''){for(const n of nodes){const file=prefix+n.name;if(n.type==='directory')walk(n.children,file+'/');else refs.push({file,sha:n.uid});}}
walk(tree.find(n=>n.name==='src').children);
const sha=b=>createHash('sha1').update(b).digest('hex');
const caches=[path.join(repo,'.prographics-release/guarded-fabcdcab-4ee3-423f-b576-29c2b3f8792b'),repo];
let next=0,fetched=0;
await Promise.all(Array.from({length:5},async()=>{while(next<refs.length){const ref=refs[next++];const target=path.resolve(root,ref.file);if(!target.startsWith(root+path.sep))throw Error('Unsafe source path');let bytes;for(const cache of caches){const f=path.join(cache,ref.file);if(fs.existsSync(f)&&fs.statSync(f).isFile()){const b=fs.readFileSync(f);if(sha(b)===ref.sha){bytes=b;break;}}}if(!bytes){bytes=Buffer.from((await vercel(`/v8/deployments/${base.id}/files/${ref.sha}`)).data,'base64');fetched++;}if(sha(bytes)!==ref.sha)throw Error('Source hash mismatch: '+ref.file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}}));
for(const f of ['index.html','fleet.css','fleet.js']){const rel='public/flowsuite/fleet/'+f;fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true});fs.copyFileSync(path.join(repo,rel),path.join(root,rel));}
const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json')));
if(!config.rewrites.some(r=>r.source==='/flowsuite/fleet'))config.rewrites.unshift({source:'/flowsuite/fleet',destination:'/flowsuite/fleet/index.html'});
fs.writeFileSync(path.join(root,'vercel.json'),JSON.stringify(config,null,2)+'\n');
const changes=refs.filter(r=>sha(fs.readFileSync(path.join(root,r.file)))!==r.sha).map(r=>r.file);
if(changes.some(f=>f!=='vercel.json'))throw Error('Unexpected existing-file change '+changes.join(','));
fs.mkdirSync('docs/flowsuite-fleet',{recursive:true});
fs.writeFileSync('docs/flowsuite-fleet/source-preservation.json',JSON.stringify({base:base.id,root,files:refs.length,preserved:refs.length-changes.length,changes,added:['public/flowsuite/fleet/index.html','public/flowsuite/fleet/fleet.css','public/flowsuite/fleet/fleet.js'],refs},null,2));
console.log(JSON.stringify({base:base.id,root,existing:refs.length,changes,fetched,configuredSmokeEnvironmentNames:project.env.filter(e=>e.key.startsWith('CARES_SMOKE')||e.key==='CARES_VERCEL_BYPASS').map(e=>e.key)}));
