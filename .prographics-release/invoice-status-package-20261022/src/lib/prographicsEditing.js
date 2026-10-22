export const isClearedEntry = row => !!(row?.cleared_confirmed || row?.reconciliation_id || row?.match_status === 'reconciled');
export function transactionHistory(rows, accounts, query='', scope='all') {
  const names=new Map(accounts.map(a=>[a.id,a.name]));
  const tokens=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return rows.filter(r=> (scope==='all'||(scope==='cleared')===isClearedEntry(r)) && tokens.every(t=>[r.description,r.entry_date,r.category,r.reference,names.get(r.account_id),(Number(r.amount_cents)/100).toFixed(2)].join(' ').toLowerCase().includes(t))).slice().sort((a,b)=>(b.entry_date||'').localeCompare(a.entry_date||'')||a.id.localeCompare(b.id));
}
export function itemSuggestions(products,documents,draftLines=[]) {
  const names=new Set(), descriptions=new Map();
  const add=(item,desc)=>{item=(item||'').trim();desc=(desc||'').trim();if(!item)return;names.add(item);const key=item.toLowerCase();if(!descriptions.has(key))descriptions.set(key,new Set());if(desc)descriptions.get(key).add(desc);};
  for(const p of products||[])if(!p.archived)add(p.name,p.description);
  for(const d of documents||[])for(const l of d.lines||[])add(l.item,l.desc||l.description);
  for(const l of draftLines)add(l.item,l.desc);
  return {names:[...names].sort((a,b)=>a.localeCompare(b)),descriptions};
}
export function itemSelection(line,item) {
  return {item,...(!line.desc||line.desc===line.item||/^shipping(?:\s|$)/i.test(item)?{desc:item}:{})};
}
