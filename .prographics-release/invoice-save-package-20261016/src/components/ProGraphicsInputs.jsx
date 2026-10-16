import {useId,useMemo} from 'react';
import {N} from '../design/neon';
import {customerDirectory,orderCustomerDefaults} from '../lib/prographicsRehab';
import {catalogItemSelection} from '../lib/prographicsInteractions';

export function WorkspaceSearch({label,value,onChange,placeholder}){
 return <label style={{display:'block',padding:12,margin:'12px 0',border:'1px solid '+N.blue,borderRadius:8,background:'#f7fafd'}}><b style={{display:'block',fontSize:13,color:N.blueDark,marginBottom:6}}>{label}</b><input aria-label={label} placeholder={placeholder||label+'…'} value={value} onChange={e=>onChange(e.target.value)} style={{width:'100%',boxSizing:'border-box',padding:10,border:'1px solid '+N.rule,borderRadius:6,font:'inherit'}}/></label>;
}
export function CustomerFields({draft,setDraft,contacts,documents,inputStyle,onEdit}){
 const id=useId(),c=orderCustomerDefaults(draft.customer||'',contacts||[]);
 const directory=useMemo(()=>customerDirectory(contacts||[],documents||[]).filter(c=>!c.archived),[contacts,documents]);
 const selected=(contacts||[]).find(x=>(x.name||'').trim().toLowerCase()===(draft.customer||'').trim().toLowerCase());
 return <section aria-label="Customer details"><b style={{display:'block',marginBottom:8,color:N.blueDark}}>CUSTOMER / BILL TO</b>
 <input aria-label="Customer" list={id} value={draft.customer||''} placeholder="Search customers" onChange={e=>setDraft(d=>({...d,...orderCustomerDefaults(e.target.value,contacts||[])}))} style={inputStyle}/>
 <datalist id={id}>{directory.map(c=><option key={c.id} value={c.name}/>)}</datalist>
 {draft.customer&&<><div style={{whiteSpace:'pre-line',fontSize:13,padding:'8px 0'}}>{c.customerAddress||'Address needed'}<br/>{c.customerPhone}</div><button type="button" onClick={()=>onEdit(selected||{id:'history-name:'+draft.customer,name:draft.customer,historicalOnly:true,email:draft.email||''})} style={{background:'white',border:'1px solid '+N.rule,borderRadius:6,padding:6,color:N.blueDark}}>{selected?'Edit customer':'Complete customer profile'}</button></>}
 <label style={{display:'block',marginTop:8}}>Email<input aria-label="Customer email" value={draft.email||''} onChange={e=>setDraft(d=>({...d,email:e.target.value}))} style={inputStyle}/></label>
 </section>;
}
export function ShipToField({draft,setDraft,inputStyle,vendor=false}){
 return <section aria-label="Delivery destination"><b style={{display:'block',marginBottom:8,color:N.blueDark}}>SHIP TO</b><textarea aria-label="Ship To" placeholder="Recipient, delivery address and instructions" value={draft.ship||''} onChange={e=>setDraft(d=>({...d,ship:e.target.value}))} rows={5} style={{...inputStyle,resize:'vertical'}}/><p style={{fontSize:12,color:N.muted}}>Separate from billing details. {vendor?'Shown to the vendor; leave blank to deliver to ProGraphics.':'Changing the customer does not change this destination.'}</p></section>;
}
export function ItemFields({line,onChange,products,suggestions,inputStyle,index=0,inline=false}){
 const id=useId(),key=(line.item||'').trim().toLowerCase();
 const archived=new Set((products||[]).filter(p=>p.archived).map(p=>p.name.trim().toLowerCase()));
 const descriptions=[...(suggestions?.descriptions.get(key)||[])];
 const fieldStyle=inline?{...inputStyle,margin:0,minWidth:0,width:'100%',boxSizing:'border-box'}:inputStyle;
 return <div style={{display:inline?'contents':'grid',gap:6}}><input aria-label={`Item or service ${index+1}`} placeholder="Search Items & Services" list={id} value={line.item||''} onChange={e=>onChange(catalogItemSelection(line,e.target.value,products))} style={fieldStyle}/><datalist id={id}>{(suggestions?.names||[]).filter(name=>!archived.has(name.toLowerCase())).map(name=><option key={name} value={name}/>)}</datalist><input aria-label={`Description ${index+1}`} placeholder="Description / job-specific details" list={id+'-descriptions'} value={line.desc||''} onChange={e=>onChange({desc:e.target.value})} style={fieldStyle}/><datalist id={id+'-descriptions'}>{descriptions.map(d=><option key={d} value={d}/>)}</datalist></div>;
}
