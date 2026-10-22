import {copyDocumentDraft} from './prographicsRehab.js';

export function catalogItemSelection(line,name,products){
 const item=(products||[]).find(p=>!p.archived&&(p.name||'').trim().toLowerCase()===name.trim().toLowerCase());
 if(!item)return {item:name,...(!line.desc||line.desc===line.item||/^shipping(?:\s|$)/i.test(name)?{desc:name}:{})};
 return {item:item.name,desc:item.description||item.name,
  ...(item.price_cents!=null?{price:String(Number(item.price_cents)/100)}:{}),
  ...(item.cost_cents!=null?{cost:String(Number(item.cost_cents)/100)}:{})};
}
export function independentDocumentDraft(source,kind){
 const draft=copyDocumentDraft(source);
 return {...draft,mode:kind==='order'&&source.poNumber?'po':'invoice',customerPo:'',notes:source.notes||''};
}
export function contactState(contact){return contact.archived?'Archived':contact.historicalOnly?'Historical':'Current';}
