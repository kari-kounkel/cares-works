import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {catalogItemSelection,independentDocumentDraft,contactState} from '../src/lib/prographicsInteractions.js';
import {draftKey,writeDraft,readDraft} from '../src/lib/prographicsDraftRecovery.js';
import {itemSuggestions} from '../src/lib/prographicsEditing.js';

test('canonical item defaults and historical descriptions preserve source and master records',()=>{
 const products=[{id:'p',name:'Signs',description:'Standard signs',price_cents:375,cost_cents:200}];
 const history=[{lines:[{item:'Signs',desc:'Historical customer lettering'},{item:'Custom work',desc:'Repeat this specification'}]}];
 const before=JSON.stringify({products,history});
 const line={...catalogItemSelection({},'Signs',products),desc:'This job only'};
 assert.equal(line.price,'3.75');assert.equal(line.cost,'2');
 const choices=itemSuggestions(products,history,[line,{item:'Newly typed',desc:'New details'}]);
 assert(choices.names.includes('Newly typed'));assert(choices.names.includes('Custom work'));
 assert(choices.descriptions.get('signs').has('Historical customer lettering'));
 assert.deepEqual(catalogItemSelection({desc:'Old details'},'Shipping',products),{item:'Shipping',desc:'Shipping'});
 assert.equal(JSON.stringify({products,history}),before);
});
test('order copies to independent unsaved invoice and recovers after relogin without identity/posting',()=>{
 const source={id:'old-order',docType:'order',poNumber:'123',number:'999',customer:'Customer',shipAddress:'Drop ship',status:'Paid',paidCents:100,sourceJobId:'old-link',lines:[{item:'Signs',desc:'Details',qty:2,price:3.75}],artwork:[{url:'private'}]};
 const before=JSON.stringify(source),draft=independentDocumentDraft(source,'invoice');
 assert.equal(draft.customer,'Customer');assert.equal(draft.ship,'Drop ship');assert.equal(draft.lines[0].price,'3.75');
 for(const key of ['id','number','poNumber','status','paidCents','sourceJobId','sourceInvoiceId'])assert(!Object.hasOwn(draft,key));
 assert.deepEqual(draft.artwork,[]);
 const disk=new Map(),storage={getItem:k=>disk.get(k)||null,setItem:(k,v)=>disk.set(k,v)};
 writeDraft(storage,draftKey('staff','org','invoice'),draft);
 assert.deepEqual(readDraft(storage,draftKey('staff','org','invoice')).draft,draft);
 assert.equal(readDraft(storage,draftKey('other','org','invoice')),null);
 assert.equal(JSON.stringify(source),before);
 writeDraft(storage,draftKey('staff','org','order'),{ship:'Delivery only',lines:[]});
 assert.equal(readDraft(storage,draftKey('staff','org','order')).draft.ship,'Delivery only');
});
test('canonical workspaces keep archive states, controller access and draft collision safeguards',()=>{
 assert.equal(contactState({}), 'Current');assert.equal(contactState({historicalOnly:true}),'Historical');assert.equal(contactState({archived:true}),'Archived');
 const source=readFileSync(new URL('../src/pages/LedgerWorkspace.jsx',import.meta.url),'utf8');
 assert(!source.includes('ProGraphicsReusePicker'));
 assert.match(source,/ItemFields(?: inline(?:=\{invoiceEditorOnly\})?)? line=\{l\}/);
 assert.match(source,/invoiceRecovery:draftRecovery/);
 assert.match(source,/accountingController\?\[\{key:'accounting'/);
 assert.match(source,/update\(\{archived:!c.archived\}\).eq\('org_id',liveOrgId\).eq\('id',c.id\).select\('id'\).single\(\)/);
 assert(!source.includes('Private controller trial</summary>'));
});
