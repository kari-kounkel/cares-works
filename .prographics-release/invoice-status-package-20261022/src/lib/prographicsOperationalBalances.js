import {isImportedHistory} from './prographicsRehab';
export const operationalInvoiceBalance=v=>Math.max(0,v.workflow?.legacyPaid?0:v.balanceCents!=null?Number(v.balanceCents):Math.round(Number(v.amount||0)*100));
export const currentOpenInvoices=rows=>rows.filter(v=>v.docType!=='order'&&!isImportedHistory(v)&&!['Paid','Void','Draft','In progress'].includes(v.status)&&operationalInvoiceBalance(v)>0);
export function paidCheckGroups(checks,bills){
 const byId=new Map(bills.map(b=>[b.id,b])),linked=new Set();
 const groups=checks.map(c=>{const seen=new Set();let duplicateAllocations=false;const allocations=[];for(const a of c.allocations||[]){if(!byId.has(a.bill_id))continue;if(seen.has(a.bill_id)){duplicateAllocations=true;continue;}seen.add(a.bill_id);linked.add(a.bill_id);allocations.push({...byId.get(a.bill_id),applied_cents:Number(a.amount_cents)});}return {...c,bills:allocations,duplicateAllocations,allocated_cents:allocations.reduce((s,b)=>s+b.applied_cents,0)};});
 return {groups,unlinked:bills.filter(b=>!linked.has(b.id))};
}
