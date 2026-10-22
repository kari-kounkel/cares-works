// Browser-only working copies, never business records or accounting events.
export function draftKey(userId, orgId, kind) {
  return userId && orgId ? `pg-draft-v2:${userId}:${orgId}:${kind}` : null;
}
export function readDraft(storage, key) {
  if (!key) return null;
  const value = JSON.parse(storage.getItem(key) || 'null');
  return value?.version === 2 ? value : null;
}
export function writeDraft(storage, key, draft, editing = null) {
  if (!key || !draft) return null;
  if(!editing&&!hasDraftContent(draft)){const current=readDraft(storage,key);if(current&&hasDraftContent(current.draft))return current;storage.removeItem(key);return null;}
  if(editing&&sameDocumentDraft(draft,savedDocumentDraft(editing))){const current=readDraft(storage,key);if(current&&hasDraftContent(current.draft)&&!sameDocumentDraft(current.draft,draft))return current;if(!current?.editing||current.editing.id===editing.id)storage.removeItem(key);return null;}
  if (!editing && !draft.customer && !draft.vendor && !draft.notes && !draft.ship && !draft.email && !draft.customerPo && !draft.artwork?.length &&
      !draft.lines?.some(l => l.item || l.desc || l.price)) return readDraft(storage, key);
  const value = {version: 2, draft, editing, savedAt: new Date().toISOString()};
  storage.setItem(key, JSON.stringify(value));
  return value;
}

const identity = value => value?.editing?.id || value?.draft?.workingId || 'new-document';
export function readOtherDrafts(storage, key) {
  if (!key) return [];
  const values = JSON.parse(storage.getItem(key + ':other-documents') || '[]');
  return Array.isArray(values) ? values.filter(v => v?.version === 2 && v.draft) : [];
}

// An explicit Edit selection owns the editor. Preserve other work separately.
export function selectDocumentDraft(storage, key, draft, editing = null) {
  const current = readDraft(storage, key);
  const requested = {version: 2, draft, editing, savedAt: new Date().toISOString()};
  if (current && identity(current) === identity(requested)) return current;
  let others = readOtherDrafts(storage, key);
  const selected = others.find(v => identity(v) === identity(requested)) || requested;
  if (current) others = [...others.filter(v => identity(v) !== identity(current)), current];
  // Save the previous copy first; storage failure must never silently discard it.
  storage.setItem(key + ':other-documents', JSON.stringify(others));
  storage.setItem(key, JSON.stringify(selected));
  // A failed final cleanup leaves a harmless recoverable duplicate.
  try { storage.setItem(key + ':other-documents', JSON.stringify(others.filter(v => identity(v) !== identity(selected)))); } catch {}
  return selected;
}

export function savedDocumentDraft(v){return {mode:v.poNumber?'po':'invoice',customerPo:v.customerPo||'',notes:v.notes||'',date:v.issueDate||'',customer:v.customer==='—'?'':v.customer||'',vendor:v.vendor||'',email:v.email||'',ship:v.shipAddress||'',taxStatus:v.tax||'Exempt',lines:(v.lines?.length?v.lines:[{}]).map(l=>({item:l.item||'',desc:l.desc||'',qty:String(l.qty||1),cost:l.cost?String(l.cost):'',price:l.price?String(l.price):''})),artwork:v.artwork||[],terms:v.dueDate&&v.issueDate&&v.dueDate>v.issueDate?'custom':'receipt',dueDate:v.dueDate&&v.issueDate&&v.dueDate>v.issueDate?v.dueDate:''};}
export function sameDocumentDraft(a,b){const norm=v=>({mode:v?.mode||'invoice',customer:(v?.customer||'').trim(),vendor:(v?.vendor||'').trim(),email:(v?.email||'').trim(),ship:(v?.ship||'').trim(),notes:(v?.notes||'').trim(),customerPo:(v?.customerPo||'').trim(),date:v?.date||'',tax:v?.taxStatus||'Exempt',terms:v?.terms||'receipt',due:v?.dueDate||'',artwork:v?.artwork||[],lines:(v?.lines||[]).filter(l=>l.item||l.desc||Number(l.price)||Number(l.cost)).map(l=>({item:l.item||'',desc:l.desc||'',qty:Number(l.qty||1),cost:Number(l.cost||0),price:Number(l.price||0)}))});return JSON.stringify(norm(a))===JSON.stringify(norm(b));}
export function hasDraftContent(v){return !!(v?.customer||v?.vendor||v?.email||v?.ship||v?.notes||v?.customerPo||v?.artwork?.length||v?.lines?.some(l=>l.item||l.desc||Number(l.price)||Number(l.cost)));}
export function closeDocumentDraft(storage,key,id,reason='Saved document'){if(!key)return;const current=readDraft(storage,key),others=readOtherDrafts(storage,key),closing=[...(current?.editing?.id===id?[current]:[]),...others.filter(v=>v.editing?.id===id)];if(closing.length){const archive=JSON.parse(storage.getItem(key+':closed-documents')||'[]');storage.setItem(key+':closed-documents',JSON.stringify([...archive,...closing.map(v=>({...v,closedAt:new Date().toISOString(),reason}))]));if(current?.editing?.id===id)storage.removeItem(key);storage.setItem(key+':other-documents',JSON.stringify(others.filter(v=>v.editing?.id!==id)));}}
export function reconcileDraftCopies(storage,key,records){if(!key)return;const rows=new Map(records.map(v=>[v.id,v]));for(const saved of [readDraft(storage,key),...readOtherDrafts(storage,key)].filter(Boolean)){const id=saved.editing?.id;if(!id)continue;const live=rows.get(id);const reason=!live?'Source no longer exists':live.status==='Void'?'Document voided':live.status==='Invoiced'||saved.editing.docType==='order'&&live.docType==='invoice'?'Converted document':sameDocumentDraft(saved.draft,savedDocumentDraft(live))||sameDocumentDraft(saved.draft,savedDocumentDraft(saved.editing))?'No unsaved changes':null;if(reason)closeDocumentDraft(storage,key,id,reason);}}
