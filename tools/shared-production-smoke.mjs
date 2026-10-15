import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
export const criticalRoutes=['/','/login','/prographics','/mmpuptown/','/mmpuptown/admin/','/mmpunionshop/','/store/demo-company/'];
export async function smoke(base,{authenticated=true,output,launch={},storageState=process.env.CARES_SMOKE_STORAGE_STATE,credentials=process.env.CARES_SMOKE_EMAIL&&process.env.CARES_SMOKE_PASSWORD?{email:process.env.CARES_SMOKE_EMAIL,password:process.env.CARES_SMOKE_PASSWORD}:null,headers={},playwright}={}) {
  if(authenticated&&!storageState&&!credentials)throw Error('Smoke blocked: authenticated ProGraphics test session/credentials are required');
  const {chromium}=playwright||await import('playwright');
  let state;if(storageState){const saved=JSON.parse(fs.readFileSync(storageState));const entry=saved.origins.flatMap(o=>o.localStorage).find(e=>e.name==='sb-qcikhcnclduakriextsz-auth-token');if(!entry)throw Error('Smoke blocked: CARES test session is absent from the private storage-state file');state={cookies:[],origins:[{origin:new URL(base).origin,localStorage:[entry]}]};}
  const browser=await chromium.launch({headless:true,...launch});const context=await browser.newContext({storageState:state});const results=[];
  // Vercel protection headers belong only to this deployment, never its external services.
  if(Object.keys(headers).length||process.env.CARES_SMOKE_READONLY==='1')await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url()),method=request.method(),h={...request.headers(),...(url.origin===new URL(base).origin?headers:{})};
    if(process.env.CARES_SMOKE_READONLY==='1'&&url.hostname.endsWith('.google-analytics.com')&&url.pathname==='/g/collect')return route.fulfill({status:204,body:''});
    if(process.env.CARES_SMOKE_READONLY==='1'&&!['GET','HEAD','OPTIONS'].includes(method)){
      let body;try{body=request.postDataJSON();}catch{}
      if(url.pathname==='/functions/v1/plaid-sync')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:false,skipped:true,error:'Read-only release verification: no bank import performed.'})});
      const auth=url.pathname.startsWith('/auth/v1/')&&['token','verify','logout'].includes(url.pathname.split('/').at(-1));
      const readRpc=url.pathname.includes('/rest/v1/rpc/')&&(['prographics_accounting','prographics_financial_reports'].includes(url.pathname.split('/').at(-1))&&['books','trial_access','snapshot','report','gl','journal','subledger','source','source_effects','inspect_invoice'].includes(body?.action)||['prographics_bank_review','prographics_bank_visibility'].includes(url.pathname.split('/').at(-1))&&body?.operation==='list'||['ledger_next_number','mmp_public_catalog'].includes(url.pathname.split('/').at(-1)));
      const signedRead=url.pathname.startsWith('/storage/v1/object/sign/');
      if(!auth&&!readRpc&&!signedRead){console.log('READONLY BLOCK '+method+' '+url.pathname);return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({message:'Release verification blocked business write',code:'READONLY_RELEASE_GATE'})});}
    }
    return route.continue({headers:h});
  });
  try {
    for(const route of criticalRoutes){const page=await context.newPage();const fatal=[];page.on('response',r=>{if(r.status()>=400)fatal.push('HTTP '+r.status()+' '+new URL(r.url()).pathname);});page.on('pageerror',()=>fatal.push('uncaught browser exception'));page.on('console',m=>{if(m.type()==='error')fatal.push('browser console error: '+m.text().slice(0,500));});
      try {
      const response=await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded',timeout:45000});if(response?.status()!==200)throw Error('HTTP '+response?.status());
      if(['/','/login','/prographics'].includes(route)){
        await page.waitForFunction(()=>{const r=document.querySelector('#root');return r&&r.innerText.trim()&&!/^Loading[.\s]*$/.test(r.innerText.trim());},{},{timeout:20000});
        if(route==='/prographics'&&authenticated){
          if(new URL(page.url()).pathname==='/login'&&credentials){await page.locator('input[type="email"]').fill(credentials.email);await page.locator('input[type="password"]').fill(credentials.password);await page.getByRole('button',{name:'Log In →',exact:true}).click();await page.waitForURL('**/dashboard',{timeout:20000});await page.goto(new URL('/prographics',base).href);}
          await page.getByRole('status').filter({hasText:/Data loaded .* invoice\/order records/}).waitFor({timeout:60000});
          if((await page.locator('body').innerText()).includes('BUILD PROGRESS'))throw Error('Smoke failed: regressed ProGraphics checklist/version');
          // Read-only feature acceptance before promotion and again on production.
          if(process.env.CARES_SMOKE_COMPACT_CATEGORY==='1'){
            await page.getByTitle('Notebook',{exact:true}).click();
            const category=page.getByRole('region',{name:'Transaction category',exact:true}).first();
            await category.waitFor({timeout:30000});
            if(await page.getByRole('dialog',{name:'Classify transaction',exact:true}).count())throw Error('Oversized classification dialog remains');
            const select=category.getByRole('combobox',{name:'Transaction category',exact:true});
            await select.selectOption({index:1});
            const save=category.getByRole('button',{name:'Save category',exact:true});
            if(!await save.isDisabled())throw Error('Category save lacks explicit review');
            await category.getByRole('textbox',{name:'Category review note',exact:true}).fill('Read-only interface check — not saved');
            await category.getByRole('button',{name:'Cancel',exact:true}).click();
            if(await page.getByRole('button',{name:'Match existing payment…',exact:true}).count())throw Error('Payment matching leaked into daily classification');
            await page.getByLabel('Search transaction history').fill('Nova');
            const remembered=page.getByRole('combobox',{name:'Transaction category',exact:true}).first();
            await remembered.waitFor();
            if(await remembered.getAttribute('title')!=='Remembered — confirm or change'||await remembered.locator('option').first().innerText()!=='Phone?')throw Error('Saved Nova category suggestion missing');
            if(await remembered.evaluate(e=>getComputedStyle(e).backgroundColor)!=='rgb(253, 245, 227)')throw Error('Suggestion yellow state missing');
            if(await page.locator('[data-notebook-entry="9b9a154d-1670-4aca-be49-6c30f83bb717"]').count())throw Error('Previously handled Nova row leaked into daily Notebook');
            await page.getByLabel('Search transaction history').fill('');
            if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,'compact-notebook.png')});}
          }
          if(process.env.CARES_SMOKE_BANK_NOTEBOOK==='1'){
            await page.getByTitle('Notebook',{exact:true}).click();
            if(await page.getByRole('region',{name:'Notebook bank feed'}).count())throw Error('Separate bank panel remains visible');
            await page.getByText(/unreconciled items in the notebook$/).waitFor();
            await page.getByRole('button',{name:'View full register — including reconciled items',exact:true}).click();
            await page.getByText('Full register',{exact:true}).waitFor();
            if(!await page.locator('[data-register-entry]').count())throw Error('Full register source history missing');
            await page.getByRole('button',{name:'Back to unreconciled Notebook',exact:true}).click();
            await page.getByRole('button',{name:'Statements & reconciliations',exact:true}).click();
            await page.getByRole('heading',{name:'Official bank statements',exact:true}).waitFor();
            await page.getByText('Automatic collection is awaiting',{exact:false}).waitFor();
            if(!await page.getByText('Missing statement',{exact:true}).count())throw Error('Missing-statement status absent');
            await page.getByRole('main').getByRole('button',{name:'Notebook',exact:true}).click();
          }
          if(process.env.CARES_SMOKE_STABILITY==='1'){
            const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
            await context.addInitScript(()=>{window.__prints=0;window.print=()=>{window.__prints++;window.dispatchEvent(new Event('afterprint'));};});
            for(let i=0;i<3;i++){
              await page.getByTitle('Sales tax',{exact:true}).click();const tax=page.getByRole('region',{name:'Sales Tax History / Verification'});await tax.getByRole('heading',{name:'1. ProGraphics calculated / supporting data'}).waitFor({timeout:60000});
              await page.getByRole('button',{name:'Q3 Jul–Sep',exact:true}).click();await tax.getByRole('heading',{name:'1. ProGraphics calculated / supporting data'}).waitFor({timeout:30000});
              await page.getByRole('region',{name:'Sales tax paid'}).getByRole('button',{name:'Record sales tax paid',exact:true}).waitFor();await page.getByLabel('Upload filed return PDFs',{exact:true}).waitFor();
              const event=page.waitForEvent('popup');await page.getByRole('button',{name:/Print \/ Save PDF · support/}).click();const report=await event;await report.waitForLoadState('load');const button=report.getByRole('button',{name:'Print / Save PDF',exact:true});await button.waitFor();if(await report.evaluate(()=>window.__prints)!==0)throw Error('Worksheet automatically printed');if(!await report.locator('tbody tr').count())throw Error('Worksheet rows missing');await button.click();if(await report.evaluate(()=>window.__prints)!==1)throw Error('Explicit print control failed');if(i===0&&output)await report.pdf({path:path.join(output,'sales-tax-support.pdf'),format:'Letter'});await report.close();
              await page.getByTitle('Notebook',{exact:true}).click();await page.getByLabel('Search transaction history').fill('Holiday');await page.getByLabel('Search transaction history').fill('');await page.getByTitle('Invoices',{exact:true}).click();
            }
            await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await cdp.detach();
          }
          // Optional feature acceptance for native reporting releases. Reads/downloads only.
          if(process.env.CARES_SMOKE_ACCOUNTING_EXPORTS==='1'){
            await page.getByRole('button',{name:'Accounting',exact:true}).click();await page.getByText(/posted journals ·/).waitFor({timeout:30000});
            for(const kind of ['Trial Balance','Profit & Loss','Balance Sheet','General Ledger']){
              await page.getByLabel('Accounting view').selectOption(kind);
              if(kind==='General Ledger'){const value=await page.getByLabel('Account',{exact:true}).locator('option').nth(1).getAttribute('value');await page.getByLabel('Account',{exact:true}).selectOption(value);}
              const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export CSV',exact:true}).click();const download=await event;
              const csv=fs.readFileSync(await download.path(),'utf8');await download.delete();
              if(!csv.includes('PROVISIONAL')||!csv.includes('"Basis","cash"')||!csv.includes('"Book ID","5aa43665-08da-4ee3-ae01-5bf298caa66e"')||(kind==='General Ledger'&&!csv.includes('Complete line count')))throw Error('Native report export acceptance failed: '+kind);
            }
          }

        }
      }else if(route.includes('/admin/'))await page.getByRole('heading',{name:'Staff sign in'}).waitFor({timeout:20000});
      else if(route.startsWith('/store/'))await page.locator('#catalog-grid a').first().waitFor({timeout:30000});
      else await page.locator('main h1').waitFor({timeout:20000});
      // Let React effects and deferred module failures settle; record no sensitive page text.
      await page.waitForTimeout(750);if(fatal.length)throw Error('Smoke failed: '+route+' '+[...new Set(fatal)].join(', '));
      results.push({route,status:'passed',authenticated:route==='/prographics'&&authenticated});
      if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,route==='/prographics'?'prographics.png':route.replaceAll('/','_')+'.png')});}
      await page.close();
      } catch(error){if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,'failed-'+route.replaceAll('/','_')+'.png')}).catch(()=>{});}throw Error('Smoke failed: '+route+' '+(fatal.length?[...new Set(fatal)].join(', '):error.message));}
    }
    if(process.env.CARES_SMOKE_ROLE_HOOK){const hook=await import(pathToFileURL(process.env.CARES_SMOKE_ROLE_HOOK));await hook.run(base,{headers,launch,output});}
    if(output)fs.writeFileSync(path.join(output,'smoke.json'),JSON.stringify({base,routes:results},null,2));return results;
  } finally {await context.close();await browser.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{const routes=await smoke(process.argv[2],{output:process.argv[3],authenticated:!process.argv.includes('--anonymous'),launch:process.env.CARES_SMOKE_BROWSER_PATH?{executablePath:process.env.CARES_SMOKE_BROWSER_PATH}: {}});console.log(JSON.stringify(routes));}catch(error){console.error(error.message);process.exitCode=1;}}

