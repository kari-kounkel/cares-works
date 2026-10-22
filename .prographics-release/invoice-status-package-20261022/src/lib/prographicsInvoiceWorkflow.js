import {isImportedHistory,editableDocumentLines,prepareDraftLines} from './prographicsRehab.js';
export const INVOICE_STATUSES=['IN PROGRESS','SENT','VIEWED','PAID'];
const PG='51c83c73-b406-4cfa-9626-b600b3c30236';
export function invoiceWorkflow(invoice,payments=invoice.payments||[]) {
 const raw=invoice.rawStatus||invoice.status||'draft',status=String(raw).toLowerCase().replaceAll(' ','_'),total=invoice.total_cents??Math.round((invoice.amount||0)*100);
 const paid=payments.reduce((sum,p)=>sum+Number(p.amount_cents||0),0),historical=isImportedHistory(invoice),legacyPaid=status==='paid'&&!payments.length;
 const viewed=invoice.viewedAt||invoice.viewed_at||status==='viewed',sent=invoice.sentAt||invoice.sent_at||['sent','viewed'].includes(status);
 const disposition=status==='void'?'void':null;
 let result=payments.length&&paid>=total?'PAID':viewed?'VIEWED':sent?'SENT':'IN PROGRESS';
 if(legacyPaid)result='PAID';
 const exceptions=[];
 if(status==='paid'&&payments.length&&paid<total)exceptions.push('Legacy PAID has a supported remaining balance; payment and delivery review is required.');
 if(legacyPaid)exceptions.push('Legacy PAID has no recorded payment allocation; original status preserved for review.');
 if(['sent','viewed'].includes(status)&&!invoice.sentAt&&!invoice.sent_at)exceptions.push('Legacy delivery date is unavailable; no date was invented.');
 if(status==='viewed'&&!invoice.viewedAt&&!invoice.viewed_at)exceptions.push('Legacy view is not verified customer access.');
 return {status:result,paidCents:paid,balanceCents:legacyPaid?null:Math.max(0,total-paid),overpaymentCents:Math.max(0,paid-total),historical,legacyPaid,disposition,exceptions};
}
const monetary=lines=>(lines||[]).map(l=>({qty:l.qty==null?null:Number(l.qty),price:l.price==null||l.price===''?null:Number(l.price)}));
export function prepareInvoiceEdit(draft,editing,taxRate) {
 const original=editing?.editBaseline;
 if(original&&JSON.stringify(monetary(draft.lines))===JSON.stringify(monetary(editableDocumentLines(original.line_items)))&&draft.taxStatus===original.tax_status) {
  return {lines:(original.line_items||[]).map((l,i)=>({...l,item:(draft.lines[i]?.item||'').trim(),desc:(draft.lines[i]?.desc||'').trim()})),subtotal:original.subtotal_cents,tax:original.tax_cents,total:original.total_cents,amountChanged:false};
 }
 if(original&&['draft','in_progress'].includes(original.status)&&!editing.sentAt&&!editing.viewedAt&&!editing.payments?.length)return {...prepareUnfinishedInvoice(draft,taxRate),amountChanged:true};
 const prepared=prepareDraftLines(draft),tax=draft.taxStatus==='Taxable'?Math.round(prepared.subtotal*taxRate):0;
 return {...prepared,lines:prepared.lines.map(l=>({...l,item:(l.item||'').trim(),desc:(l.desc||'').trim(),qty:Number(l.qty),price:Number(l.price),cost:Number(l.cost||0)})),tax,total:prepared.subtotal+tax,amountChanged:!!original&&(prepared.subtotal!==original.subtotal_cents||tax!==original.tax_cents||JSON.stringify(monetary(prepared.lines))!==JSON.stringify(monetary(original.line_items)))};
}
export async function invoiceWorkflowRequest(client,operation,invoiceId,payload={}) {
 const {data,error}=await client.rpc('prographics_invoice_workflow',{operation,invoice_id:invoiceId,payload});
 if(error||!data)throw new Error(error?.message||'The server did not confirm this invoice operation. Your entered details are retained.');
 return data;
}
export function createInvoiceWorkflowCommands({client,orgId,userId,storage,locks,uuid=()=>crypto.randomUUID()}) {
 if(orgId!==PG||!userId||!storage||!locks?.request)throw new Error('Authorized ProGraphics invoice context required');
 const prefix=`pg-invoice-workflow:v1:${orgId}:${userId}:`;
 const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
 return {async run(operation,id,fields){const key=prefix+operation+':'+id;return locks.request(key,async()=>{const body=canonical(fields);let prior=JSON.parse(storage.getItem(key)||'null');if(prior&&prior.input!==body){if(!prior.confirmed)throw new Error('An earlier invoice operation has an unknown result. Resolve its original request before changing these values.');prior=null;}if(!prior){prior={request_key:uuid(),input:body};storage.setItem(key,JSON.stringify(prior));if(storage.getItem(key)!==JSON.stringify(prior))throw new Error('Unable to retain a safe invoice retry key. Nothing was submitted.');}const result=await invoiceWorkflowRequest(client,operation,id,{...fields,request_key:prior.request_key});storage.setItem(key,JSON.stringify({...prior,confirmed:true}));return result;});}};
}

export function prepareUnfinishedInvoice(draft,taxRate) {
 const lines=(draft.lines||[]).filter(l=>(l.desc||l.item||'').trim()).map((l,i)=>{
  const qty=String(l.qty??'').trim()===''?null:Number(l.qty),price=String(l.price??'').trim()===''?null:Number(l.price);
  if(qty!==null&&(!Number.isFinite(qty)||qty<=0))throw new Error(`Line ${i+1}: enter a positive quantity or leave the unfinished value blank.`);
  if(price!==null&&!Number.isFinite(price))throw new Error(`Line ${i+1}: enter a valid price or leave the unfinished value blank.`);
  return {item:(l.item||'').trim(),desc:(l.desc||'').trim(),qty,price,cost:Number(l.cost||0)};
 });
 const complete=lines.length>0&&lines.every(l=>l.qty!==null&&l.price!==null),subtotal=complete?lines.reduce((n,l)=>n+Math.round(l.qty*l.price*100),0):0,tax=draft.taxStatus==='Taxable'?Math.round(subtotal*taxRate):0;
 return {lines,subtotal,tax,total:subtotal+tax,complete};
}
export const invoiceStatusLabel=value=>({draft:'IN PROGRESS',issued:'IN PROGRESS',in_progress:'IN PROGRESS',sent:'SENT',viewed:'VIEWED',paid:'PAID'}[String(value).toLowerCase().replaceAll(' ','_')]||value);
