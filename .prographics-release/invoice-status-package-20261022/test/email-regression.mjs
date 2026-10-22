import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';import {createRequire} from 'node:module';
const require=createRequire('C:/dev/cares-works/package.json'),{transform}=require('esbuild'),dir='C:/dev/cares-works/.prographics-release/invoice-status-package-20261022';
const original=fs.readFileSync(dir+'/supabase/functions/send-invoice-email/index.ts','utf8').replace(/^\uFEFF?import[^\n]*\n/,'');const code=(await transform(original,{loader:'ts',format:'cjs',target:'es2022'})).code;
const PG='51c83c73-b406-4cfa-9626-b600b3c30236';
async function runCase({claim={state:'sending',invoice:{org_id:PG,customer_name:'Controlled test',invoice_number:'TEST',total_cents:100,public_token:'TOKEN'}},provider={id:'ISOLATED-PROVIDER'},status=200,reject=false,org=PG}={}){let handler,calls=0,acks=[];const inv={org_id:org,doc_type:'invoice',customer_name:'Controlled test',invoice_number:'TEST',total_cents:100,public_token:'TOKEN',customer_email:'kari@karikounkel.com'};const client={
 auth:{getUser:async()=>({data:{user:{email:'kari@karikounkel.com'}}})},
 rpc:async(name,args)=>{if(name==='prographics_invoice_workflow')return {data:claim};acks.push(args.outcome);return {data:args.outcome};},
 from:table=>({
  select:()=>({eq:()=>({single:async()=>({data:table==='invoices'?inv:{name:'ProGraphics',from_email:'',reply_to_email:''}})})}),
  update:()=>({eq:async()=>({})})
 })
};const context={Response,Request,crypto:globalThis.crypto,console,createClient:()=>client,Deno:{env:{get:key=>key==='HUB_URL'?'https://provider.invalid':key==='APP_URL'?'https://tools.caresmn.com':'TEST-ONLY'},serve:f=>handler=f},fetch:async()=>{calls++;if(reject)throw Error('Disconnected');return new Response(JSON.stringify(provider),{status});}};vm.runInNewContext(code,context);const response=await handler(new Request('https://edge.invalid',{method:'POST',headers:{Authorization:'Bearer ISOLATED'},body:JSON.stringify({invoice_id:'TEST',to:'kari@karikounkel.com',request_key:'STABLE'})}));return {calls,acks,body:await response.json(),status:response.status};}
let r=await runCase();assert.equal(r.body.state,'sent');assert.equal(r.calls,1);assert.equal(r.acks[0].provider_id,'ISOLATED-PROVIDER');console.log('PASS accepted provider receipt recorded once');
r=await runCase({claim:{state:'sent',provider_id:'ALREADY'}});assert.equal(r.calls,0);assert.equal(r.body.ok,true);console.log('PASS successful retry does not resend');
r=await runCase({claim:{state:'sending'}});assert.equal(r.calls,0);assert.equal(r.body.state,'unknown');console.log('PASS in-flight retry does not resend');
r=await runCase({provider:{status:'failed'},status:400});assert.equal(r.acks[0].state,'failed');assert.equal(r.body.state,'failed');console.log('PASS explicit provider rejection records failed');
r=await runCase({provider:{error:'Server failure'},status:500});assert.equal(r.acks[0].state,'unknown');console.log('PASS ambiguous provider failure blocks retry');
r=await runCase({reject:true});assert.equal(r.acks[0].state,'unknown');console.log('PASS disconnected provider does not claim failed or sent');
r=await runCase({provider:{ok:true}});assert.equal(r.acks[0].state,'unknown');console.log('PASS missing provider receipt cannot record SENT');
r=await runCase({org:'OTHER'});assert.equal(r.calls,1);assert.equal(r.acks.length,0);assert.equal(r.body.ok,true);console.log('PASS non-ProGraphics original notification path retained');
for(const file of ['LedgerWorkspace.jsx','InvoicePublic.jsx'])await transform(fs.readFileSync('C:/dev/cares-works/.prographics-release/invoice-status-package-20261022/src/pages/'+file,'utf8'),{loader:'jsx',format:'esm'});console.log('PASS both edited JSX screens compile');
