// ProGraphics presentation/read adapters. No writes, source-record mutations or tax policy.
export const PROGRAPHICS_ORG_ID = "51c83c73-b406-4cfa-9626-b600b3c30236";
export const QBO_RECONCILIATION_SOURCE = "qbo-reconciliation:2026-09-18:v1";
export const formatRecordedRate = value => value == null || value === "" ? "—" : new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:6}).format(Number(value));

// Preserve explicit zero values when a saved document is reopened for editing.
// Missing prices stay blank and must be supplied; reopening never changes amounts.
export function editableDocumentLines(lines) {
  return (lines?.length ? lines : [{}]).map(l => ({
    item:l.item || '', desc:l.desc || '', qty:String(l.qty ?? 1),
    cost:l.cost == null ? '' : String(l.cost), price:l.price == null ? '' : String(l.price),
  }));
}

export function prepareDraftLines(draft) {
  const lines=(draft.lines||[]).filter(l=>(l.desc||l.item||'').trim());
  if(!lines.length) throw new Error('Add at least one description.');
  for (const [index,line] of (draft.lines||[]).entries()) {
    if (!(line.desc||line.item||'').trim()) continue;
    if (!Number.isFinite(Number(line.qty)) || Number(line.qty)<=0) throw new Error(`Line ${index+1}: enter a quantity greater than zero. Your draft is retained.`);
    if (!String(line.price??'').trim() || !Number.isFinite(Number(line.price))) throw new Error(`Line ${index+1}: enter a valid price. Use 0 for a no-charge line. Your draft is retained.`);
    if (line.cost!==undefined && !Number.isFinite(Number(line.cost))) throw new Error(`Line ${index+1}: enter a valid vendor cost or leave it blank. Your draft is retained.`);
  }
  return {lines,subtotal:lines.reduce((sum,l)=>sum+Math.round(Number(l.price)*Number(l.qty)*100),0)};
}

export async function verifiedNextNumber(client,orgId,kind) {
  const {data,error}=await client.rpc("ledger_next_number",{p_org:orgId,p_kind:kind==="po"?"po":"invoice"});
  if(error || !Number.isSafeInteger(Number(data)) || Number(data)<=0) throw new Error("Could not obtain a document number. Draft retained; no capped fallback was used.");
  return Number(data);
}

export function canSendLiveInvoice(v,live) {
  return !!(live && v && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(v.id||"") && v.token && !isImportedHistory(v) && v.status!=="Void");
}

// Read-only overlay. Never writes, renumbers, merges or changes original objects.
export function historicalEnrichment(rows, batches) {
  const result = rows.slice(), sourceIds = new Set();
  for (const batch of batches || []) {
    if (batch.org_id !== PROGRAPHICS_ORG_ID || batch.source !== QBO_RECONCILIATION_SOURCE || batch.party_type !== "qbo_reconciliation") throw new Error("Unexpected historical supplement scope.");
    for (const entry of batch.txns || []) {
      const source = entry.source;
      if (source?.company !== "PRO GRAPHICS ENTERPRISES, INC." || !/^\d+$/.test(source.transaction_id) || sourceIds.has(source.transaction_id)) throw new Error("Invalid or duplicate historical source identity.");
      sourceIds.add(source.transaction_id);
      const provenance = {...source,batch_id:batch.id,historical:true};
      if (entry.operation === "add_invoice") {
        const v = entry.invoice;
        if (!v || !["paid","void"].includes(v.status) || !Array.isArray(v.line_items) || !Number.isSafeInteger(v.total_cents) || v.total_cents !== v.subtotal_cents+v.tax_cents || (v.status==="void" && v.total_cents!==0)) throw new Error("Invalid historical invoice payload.");
        if (rows.some(r=>r.org_id===PROGRAPHICS_ORG_ID && r.doc_type==="invoice" && r.invoice_number===v.invoice_number && r.issue_date===v.issue_date && r.customer_name===v.customer_name && r.total_cents===v.total_cents)) throw new Error("Historical supplement now overlaps a stored invoice. Review before using duplicate history.");
        result.push({...v,id:"qbo-history:"+source.transaction_id,org_id:PROGRAPHICS_ORG_ID,doc_type:"invoice",created_at:batch.created_at,public_token:null,customer_email:null,artwork_urls:[],_qboSource:provenance});
      } else if (entry.operation === "enrich_empty_lines") {
        const target=entry.target, index=result.findIndex(r=>r.id===target?.id);
        const v=result[index];
        if (!v || v.org_id!==PROGRAPHICS_ORG_ID || v.doc_type!=="invoice" || !String(v.created_at).startsWith("2026-09-09") || !/^\d+$/.test(v.invoice_number) || Number(v.invoice_number)>=8662 || ["invoice_number","issue_date","customer_name","total_cents"].some(k=>v[k]!==target[k]) || (v.line_items||[]).length || !Array.isArray(entry.line_items)) throw new Error("Historical detail target changed; original data preserved. Review the supplement.");
        result[index]={...v,line_items:entry.line_items.map(l=>({...l})),_qboSource:provenance};
      } else throw new Error("Unknown historical enrichment operation.");
    }
  }
  return result;
}

// Presentation only: documented September 9 historical invoice batch below #8662.
// Do not classify by invoice age alone or rewrite persisted payment status.
export function isImportedHistory(v) {
  if (v.qboSource?.historical) return true;
  if (v.docType === "order") return v.status === "Historical";
  return /^\d+$/.test(String(v.number || "")) && Number(v.number) < 8662 &&
    String(v.createdAt || "").startsWith("2026-09-09");
}

export function availableLineText(line) {
  return [line.desc, line.description, line.item].find(s => typeof s === "string" && s.trim())?.trim() || "";
}

export function reusableLines(products, documents) {
  const options = [], seen = new Set();
  const add = option => {
    if (!option.desc) return;
    // Dedupe equivalent suggestions only; never merge persisted business records.
    const key = JSON.stringify([option.item.toLowerCase(),option.desc.toLowerCase(),option.price,option.cost,option.source]);
    if (seen.has(key)) return;
    seen.add(key); options.push({...option,key});
  };
  for (const p of products || []) if (!p.archived) add({item:p.name||"",desc:p.description||p.name||"",qty:"1",price:String((p.price_cents||0)/100),cost:"",source:"Item catalog",customer:""});
  for (const v of documents || []) for (const l of v.lines || []) add({item:l.item||"",desc:availableLineText(l),qty:String(l.qty??1),price:l.price==null?"":String(l.price),cost:l.cost==null?"":String(l.cost),source:`${v.docType==="order"?"PO":"Invoice"} #${v.poNumber||v.number||"—"} · ${v.issueDate||""}`,customer:v.customer||v.vendor||""});
  return options;
}

export function reuseLineDraft(option) {
  return {item:option.item,desc:option.desc,qty:option.qty,price:option.price,cost:option.cost};
}

export async function readAllRows(makeQuery, {pageSize=500, maxRows=100000, concurrency=1, onProgress=()=>{}}={}) {
  if(concurrency>1) {
    // Learn the actual service cap before scheduling non-overlapping ranges.
    const first=await makeQuery().range(0,pageSize-1);
    if(first.error)throw new Error(first.error.message||"Read failed");
    if(!Array.isArray(first.data)||!Number.isInteger(first.count))throw new Error("Complete row count unavailable; reload before relying on this view.");
    const expected=first.count,step=first.data.length,rows=[],ids=new Set();
    if(expected>maxRows)throw new Error("History exceeds the safe loading limit; no partial totals were accepted.");
    const accept=(page,size)=>{
      if(page.error)throw new Error(page.error.message||"Read failed");
      if(page.count!==expected)throw new Error("Records changed during loading. Reload for a complete view.");
      if(!Array.isArray(page.data)||page.data.length!==size)throw new Error("Incomplete read; no totals were accepted.");
      for(const row of page.data){if(!row.id||ids.has(row.id))throw new Error("Unstable page results. Reload for a complete view.");ids.add(row.id);rows.push(row);}
      onProgress(rows.length,expected);
    };
    if(step>expected||(!step&&expected))throw new Error("Incomplete read; no totals were accepted.");
    accept(first,step);
    const workers=Math.min(4,Math.max(1,Math.floor(concurrency)));
    for(let offset=step;offset<expected;){
      const ranges=[];
      for(let i=0;i<workers&&offset<expected;i++,offset+=step)ranges.push([offset,Math.min(expected-1,offset+step-1)]);
      const pages=await Promise.all(ranges.map(([start,end])=>makeQuery().range(start,end)));
      pages.forEach((page,i)=>accept(page,ranges[i][1]-ranges[i][0]+1));
    }
    return {data:rows,error:null,count:expected};
  }
  const rows=[]; const ids=new Set(); let expected;
  for(let offset=0; offset<maxRows;) {
    const {data,error,count}=await makeQuery().range(offset,offset+pageSize-1);
    if(error) throw new Error(error.message || "Read failed");
    if(!Array.isArray(data) || !Number.isInteger(count)) throw new Error("Complete row count unavailable; reload before relying on this view.");
    if(expected!==undefined && expected!==count) throw new Error("Records changed during loading. Reload for a complete view.");
    expected=count;
    for(const row of data) {
      if(!row.id || ids.has(row.id)) throw new Error("Unstable page results. Reload for a complete view.");
      ids.add(row.id); rows.push(row);
    }
    onProgress(rows.length,expected);
    if(rows.length===expected) return {data:rows,error:null,count:expected};
    if(!data.length || rows.length>expected) throw new Error("Incomplete read; no totals were accepted.");
    offset+=data.length; // also works when the service cap is smaller than pageSize
  }
  throw new Error("History exceeds the safe loading limit; no partial totals were accepted.");
}

export function filterDocuments(records, {query="",status="",from="",to="",min="",max="",customerFirst=false}={}) {
  const tokens=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const customerMatches=customerFirst&&tokens.length&&records.some(v=>v.status!=="Void"&&tokens.every(t=>(v.customer||"").toLowerCase().includes(t)));
  return records.filter(v=> {
    if(customerMatches&&!tokens.every(t=>(v.customer||"").toLowerCase().includes(t)))return false;
    const hay=[v.number,v.poNumber,v.customer,v.vendor,v.item,v.issueDate,v.status,v.notes,v.amount,...(v.lines||[]).flatMap(l=>[l.item,l.desc])].join(" ").toLowerCase();
    return tokens.every(t=>(v.status==="Void"?[v.number,v.poNumber,"void"].join(" ").toLowerCase():hay).includes(t)) && (!status || v.status===status) &&
      (!from || v.issueDate>=from) && (!to || (!!v.issueDate && v.issueDate<=to)) &&
      (min==="" || v.amount>=Number(min)) && (max==="" || v.amount<=Number(max));
  });
}

export function customerDefaults(customer) {
  return {customer:customer.name||"",email:customer.email||"",ship:customer.billing_address||"",taxStatus:customer.tax_status||"Taxable"};
}

// Order customer identity and delivery destination are independent.
export function orderCustomerDefaults(name, contacts) {
  const key=String(name||'').trim().toLowerCase();
  const c=contacts.find(c=>String(c.name||'').trim().toLowerCase()===key);
  return {customer:c?.name||name,email:c?.email||'',taxStatus:c?.tax_status||'Taxable',customerAddress:c?.billing_address||'',customerPhone:c?.phone||''};
}

export async function saveConfirmedContact(client,{table,orgId,userId,id,row}) {
  if(!['ledger_customers','ledger_vendors'].includes(table)||!orgId||!userId)throw new Error('Contact save context is missing. Nothing saved.');
  if(String(id||'').startsWith('history-name:')){
    if(table!=='ledger_customers'||row.name.trim().toLowerCase()!==id.slice('history-name:'.length).trim().toLowerCase())throw new Error('Keep this customer name unchanged so its existing history stays connected.');
    const existing=await client.from(table).select('id').eq('org_id',orgId).eq('name',row.name).maybeSingle();
    if(existing.error)throw new Error(existing.error.message);
    if(existing.data)throw new Error('This customer now has a saved contact. Reload and edit that contact instead.');
    id=null; // Create contact details for the existing history name, never write to its invoices.
  }
  const query=id?client.from(table).update(row).eq('id',id).eq('org_id',orgId):client.from(table).insert({...row,org_id:orgId,user_id:userId});
  const {data,error}=await query.select('id,name,email,billing_address').single();
  if(error||!data?.id)throw new Error(error?.message||'The database did not confirm the contact save.');
  return data;
}

// Historical names are navigation projections, never inserted/merged into the contact master.
export function customerDirectory(contacts, documents) {
  const known=new Set(contacts.map(c=>(c.name||"").toLowerCase()));
  const names=new Set(documents.map(v=>v.customer).filter(n=>n && n!=="—" && !known.has(n.toLowerCase())));
  return [...contacts,...[...names].map(name=>({id:"history-name:"+name,name,historicalOnly:true,email:"",phone:"",billing_address:""}))];
}
export function copyDocumentDraft(v, today=new Date().toISOString().slice(0,10)) {
  return {mode:v.docType==="order"?"po":"invoice",date:today,customer:v.customer==="—"?"":v.customer||"",vendor:v.vendor||"",email:v.email||"",ship:v.shipAddress||"",taxStatus:v.tax||"Taxable",terms:"receipt",dueDate:"",artwork:[],lines:(v.lines||[]).map(l=>({item:l.item||"",desc:l.desc||"",qty:String(l.qty??1),cost:l.cost==null?"":String(l.cost),price:l.price==null?"":String(l.price)}))};
}

// Invoice-date support only. NOT a cash-basis liability calculation or jurisdiction allocation.
export function invoiceTaxSupport(records, from, to) {
  const period=records.filter(v=>v.docType!=="order" && v.issueDate>=from && v.issueDate<=to);
  const excluded=period.filter(v=>["Void","Draft","In progress"].includes(v.status));
  const billed=period.filter(v=>!["Void","Draft","In progress"].includes(v.status)).sort((a,b)=>a.issueDate.localeCompare(b.issueDate)||a.id.localeCompare(b.id));
  const cents=n=>Math.round(Number(n||0)*100);
  const sum=fn=>billed.reduce((s,v)=>s+fn(v),0)/100;
  return {from,to,billed,excluded,taxableSales:sum(v=>v.tax==="Taxable"?cents(v.amount)-cents(v.taxAmt):0),exemptSales:sum(v=>["Exempt","Shipped"].includes(v.tax)?cents(v.amount)-cents(v.taxAmt):0),unclassifiedSales:sum(v=>!["Taxable","Exempt","Shipped"].includes(v.tax)?cents(v.amount)-cents(v.taxAmt):0),collected:sum(v=>cents(v.taxAmt)),gross:sum(v=>cents(v.amount)-cents(v.taxAmt)),warnings:billed.filter(v=>!(v.lines||[]).length || !["Taxable","Exempt","Shipped"].includes(v.tax) || (v.tax!=="Taxable" && cents(v.taxAmt)!==0))};
}
