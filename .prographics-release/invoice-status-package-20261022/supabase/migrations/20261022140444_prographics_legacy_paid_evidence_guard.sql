do $legacy_guard$ begin
if md5(pg_get_functiondef('prographics_accounting.invoice_work_status(public.invoices)'::regprocedure)) is distinct from 'e01f456f6c3f1e560e8ce557748bc8cf' then raise exception 'Legacy evidence correction stopped: function drift';end if;
if md5(pg_get_functiondef('public.prographics_invoice_public(uuid,boolean)'::regprocedure)) is distinct from '3e05e4d249dfec331572085f6fafd296' then raise exception 'Legacy evidence correction stopped: function drift';end if;
if md5(pg_get_functiondef('public.prographics_invoice_workflow(text,uuid,jsonb)'::regprocedure)) is distinct from 'bf5438f42ce81d0e3171922cd6a7513a' then raise exception 'Legacy evidence correction stopped: function drift';end if;
end $legacy_guard$;
create or replace function prographics_accounting.invoice_work_status(d public.invoices)
returns text language sql stable security definer set search_path='' as $$
 select case when exists(select 1 from public.ledger_payments p where p.invoice_id=d.id and p.org_id=d.org_id)
                  and (select coalesce(sum(p.amount_cents),0) from public.ledger_payments p where p.invoice_id=d.id and p.org_id=d.org_id)>=d.total_cents then 'paid'
 when d.status='paid' and not exists(select 1 from public.ledger_payments p where p.invoice_id=d.id and p.org_id=d.org_id) then 'paid'
 when d.viewed_at is not null or d.status='viewed' then 'viewed'
 when d.sent_at is not null or d.status='sent' then 'sent' else 'in_progress' end;
$$;

create or replace function public.prographics_invoice_workflow(operation text,invoice_id uuid,payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare org_ref uuid:='51c83c73-b406-4cfa-9626-b600b3c30236'; bk prographics_accounting.books;
 d public.invoices; revised public.invoices; prior prographics_accounting.commands; req uuid; result jsonb; fields jsonb;
 before_payments jsonb; before_credits jsonb; money_changed boolean; original_money jsonb; revised_money jsonb;
 paid bigint; credit_total bigint; needed_credit bigint; target_tax bigint; target_revenue bigint; target_ar bigint;
 rev_account uuid; tax_account uuid; credit_account uuid; ar_account uuid; x record; delta bigint; rows jsonb:='[]'; jid uuid; correction_date date;
 new_credit_id uuid; hist boolean; source_posted boolean; reason text; fingerprint text; existing_send prographics_accounting.commands;
begin
 if auth.uid() is null or not public.user_can_edit_org(org_ref) then raise exception 'Authorized ProGraphics editor required' using errcode='42501';end if;
 select * into strict bk from prographics_accounting.books where org_id=org_ref;
 perform prographics_accounting.require_role(bk.id,array['poster','controller']);
 if operation not in ('state','create','save','manual_sent','send_claim') then raise exception 'Unsupported invoice operation';end if;
 if operation<>'state' then select * into strict bk from prographics_accounting.books where id=bk.id for update;end if;
 if operation<>'state' then
  req:=nullif(payload->>'request_key','')::uuid;if req is null then raise exception 'Stable invoice request identity required';end if;
  select * into prior from prographics_accounting.commands where book_id=bk.id and request_key=req;
  if found then
   if prior.actor is distinct from auth.uid() or prior.request<>jsonb_build_object('invoice_workflow',operation,'invoice_id',invoice_id,'payload',payload) then raise exception 'Invoice request key reused with different input';end if;
   if operation='send_claim' then return (prior.result-'invoice')||coalesce((select outcome from prographics_accounting.invoice_delivery_results where request_key=req),'{}');end if;
   return prior.result;
  end if;
 end if;
 if operation='create' then
  invoice_id:=coalesce(nullif(payload->>'working_id','')::uuid,gen_random_uuid());
  if exists(select 1 from public.invoices where id=invoice_id) then raise exception 'A document already exists with this draft identity; reopen it before saving';end if;
  d.id:=invoice_id;d.org_id:=org_ref;d.user_id:=auth.uid();d.doc_type:='invoice';d.status:='in_progress';
  d.issue_date:=current_date;d.line_items:='[]';d.tax_status:='Exempt';d.subtotal_cents:=0;d.tax_cents:=0;d.total_cents:=0;
 else
  select * into strict d from public.invoices where id=invoice_id and org_id=org_ref;
  if d.doc_type is distinct from 'invoice' then raise exception 'This operation is for invoices, not orders';end if;
  if operation<>'state' then select * into strict d from public.invoices where id=invoice_id and org_id=org_ref for update;end if;
 end if;
 fingerprint:=md5(to_jsonb(d)::text);
 select coalesce(sum(amount_cents),0) into paid from public.ledger_payments where org_id=org_ref and ledger_payments.invoice_id=d.id;
 hist:=d.created_at::date='2026-09-09' and case when d.invoice_number~'^\d+$' then d.invoice_number::numeric<8662 else false end;
 if operation='state' then return jsonb_build_object('record',to_jsonb(d),'payments',(select coalesce(jsonb_agg(to_jsonb(p) order by p.id),'[]') from public.ledger_payments p where p.org_id=org_ref and p.invoice_id=d.id),'fingerprint',fingerprint,'status',prographics_accounting.invoice_work_status(d),'paid_cents',paid,'balance_cents',case when d.status='paid' and paid=0 then null else greatest(d.total_cents-paid,0) end,'historical',hist,'pricing_complete',prographics_accounting.invoice_price_complete(d),'legacy_payment_review',d.status='paid' and paid=0);end if;
 if d.status='void' then raise exception 'This invoice is voided and preserved in the archive; it cannot enter the active invoice workflow';end if;
 if operation='save' and fingerprint is distinct from payload->>'expected_fingerprint' then raise exception 'Invoice changed since you opened it. Your entered changes remain available; reopen the current revision before saving';end if;
 if exists(select 1 from prographics_accounting.commands c where c.book_id=bk.id and c.request->>'invoice_workflow'='send_claim' and c.request->>'invoice_id'=d.id::text and c.result->>'state'='sending' and coalesce((select r.outcome->>'state' from prographics_accounting.invoice_delivery_results r where r.request_key=c.request_key),'sending') in ('sending','unknown')) then raise exception 'An email delivery outcome is still being verified. Your changes are retained; resolve that send before changing this invoice';end if;
 if operation in ('create','save') then
  fields:=payload->'fields';
  if jsonb_typeof(fields)<>'object' or exists(select 1 from jsonb_object_keys(fields) k where k not in ('customer_name','customer_email','ship_address','customer_po_number','issue_date','due_date','notes','line_items','subtotal_cents','tax_cents','total_cents','tax_status','artwork_urls')) then raise exception 'Unsupported invoice field; identifiers, payments and delivery dates cannot be edited';end if;
  revised:=jsonb_populate_record(d,fields);revised.customer_name:=coalesce(revised.customer_name,'');
  if jsonb_typeof(revised.line_items)<>'array' then raise exception 'Invoice lines must be an array';end if;
  if revised.total_cents is null or revised.subtotal_cents is null or revised.tax_cents is null or revised.total_cents<>revised.subtotal_cents+revised.tax_cents or revised.total_cents<0 or revised.tax_cents<0 then raise exception 'Invoice amounts must be nonnegative and the total must equal subtotal plus tax';end if;
  if nullif(trim(revised.customer_name),'') is null and not exists(select 1 from jsonb_array_elements(revised.line_items) l where nullif(trim(coalesce(l->>'desc',l->>'item')),'') is not null) and nullif(trim(revised.notes),'') is null then raise exception 'Enter a customer or a line description to start this invoice';end if;
  select coalesce(jsonb_agg(jsonb_build_object('qty',l->'qty','price',l->'price')order by ord),'[]') into original_money from jsonb_array_elements(coalesce(d.line_items,'[]'))with ordinality a(l,ord);
  select coalesce(jsonb_agg(jsonb_build_object('qty',l->'qty','price',l->'price')order by ord),'[]') into revised_money from jsonb_array_elements(revised.line_items)with ordinality a(l,ord);
  money_changed:=operation='save' and (original_money is distinct from revised_money or revised.total_cents<>d.total_cents or revised.subtotal_cents<>d.subtotal_cents or revised.tax_cents<>d.tax_cents or revised.tax_status is distinct from d.tax_status);
  if (operation='create' or money_changed) and prographics_accounting.invoice_lines_priced(revised) and revised.subtotal_cents<>(select coalesce(sum(round((l->>'qty')::numeric*(l->>'price')::numeric*100)),0) from jsonb_array_elements(revised.line_items) l) then raise exception 'Invoice subtotal does not match the priced lines; entered details are retained';end if;
  if operation='save' and paid>0 and revised.customer_name is distinct from d.customer_name then raise exception 'Changing the customer of an invoice with allocated payments requires controller reallocation review';end if;
  if money_changed and hist then raise exception 'Historical invoice amounts require verified source/payment review. Descriptions, customer details and notes remain editable without changing historical amounts';end if;
  if money_changed and d.status='paid' and paid=0 then raise exception 'This legacy PAID invoice has no recorded payment allocation. Monetary correction needs verified payment records; descriptive edits are still allowed';end if;
  source_posted:=exists(select 1 from prographics_accounting.source_links where book_id=bk.id and source_table='invoices' and source_id=d.id);
  reason:=nullif(trim(payload->>'reason'),'');correction_date:=coalesce(nullif(payload->>'correction_date','')::date,current_date);
  if money_changed and (paid>0 or source_posted) and reason is null then raise exception 'Enter a reason for changing the amount of this paid or financially recorded invoice';end if;
  if money_changed and (paid>0 or source_posted or d.sent_at is not null or d.viewed_at is not null or d.status in ('sent','viewed')) and not prographics_accounting.invoice_price_complete(revised) then raise exception 'Complete the customer, quantities and prices before changing a recorded invoice amount';end if;
  if operation='create' then
   perform 1 from public.ledger_orgs where id=org_ref for update;
   insert into public.invoices(id,org_id,user_id,doc_type,invoice_number,status,customer_name,customer_email,ship_address,customer_po_number,issue_date,due_date,notes,line_items,subtotal_cents,tax_cents,total_cents,tax_status,artwork_urls)
   values(d.id,org_ref,auth.uid(),'invoice',public.ledger_next_number(org_ref,'invoice')::text,'in_progress',revised.customer_name,revised.customer_email,revised.ship_address,revised.customer_po_number,revised.issue_date,revised.due_date,revised.notes,revised.line_items,revised.subtotal_cents,revised.tax_cents,revised.total_cents,revised.tax_status,coalesce(revised.artwork_urls,'[]')) returning * into revised;
  else
   select coalesce(jsonb_agg(to_jsonb(p)order by p.id),'[]') into before_payments from public.ledger_payments p where p.org_id=org_ref and p.invoice_id=d.id;
   select coalesce(jsonb_agg(to_jsonb(c)order by c.id),'[]'),coalesce(sum(c.amount_cents)filter(where c.status='open'),0) into before_credits,credit_total from public.ledger_credits c where c.org_id=org_ref and c.source_invoice_id=d.id;
   if money_changed and (paid>0 or source_posted) then
    if exists(select 1 from public.ledger_credits c where c.org_id=org_ref and c.source_invoice_id=d.id and (c.status not in ('open','invoice_revised') or c.applied_invoice_id is not null)) then raise exception 'An applied or refunded credit needs controller reallocation review before changing this amount';end if;
    if exists(select 1 from public.ledger_payments p where p.org_id=org_ref and p.invoice_id=d.id and not exists(select 1 from prographics_accounting.source_links s where s.book_id=bk.id and s.source_table='ledger_payments' and s.source_id=p.id)) then raise exception 'A payment has no verified posting relationship; preserve it and obtain controller review before monetary correction';end if;
    rev_account:=prographics_accounting.account_for(bk.id,'revenue');tax_account:=prographics_accounting.account_for(bk.id,'sales_tax');credit_account:=prographics_accounting.account_for(bk.id,'customer_credit');
    needed_credit:=greatest(paid-revised.total_cents,0);
    if bk.basis='cash' then
     target_tax:=case when revised.total_cents=0 then 0 else round(least(paid,revised.total_cents)::numeric*revised.tax_cents/revised.total_cents) end;
     target_revenue:=least(paid,revised.total_cents)-target_tax;
    else target_tax:=revised.tax_cents;target_revenue:=revised.subtotal_cents;end if;
    for x in select * from (values(rev_account,target_revenue),(tax_account,target_tax),(credit_account,needed_credit)) t(account_id,target) loop
     select x.target-coalesce(sum(l.credit_cents-l.debit_cents),0) into delta from prographics_accounting.lines l join prographics_accounting.journals j on j.id=l.journal_id where l.book_id=bk.id and j.sealed and l.document_id=d.id and l.account_id=x.account_id;
     if delta<>0 then rows:=rows||jsonb_build_array(prographics_accounting.entry(x.account_id,greatest(-delta,0),greatest(delta,0),d.id));end if;
    end loop;
    if bk.basis='accrual' then
     ar_account:=prographics_accounting.account_for(bk.id,'ar');target_ar:=greatest(revised.total_cents-paid,0);
     select target_ar-coalesce(sum(l.debit_cents-l.credit_cents),0) into delta from prographics_accounting.lines l join prographics_accounting.journals j on j.id=l.journal_id where l.book_id=bk.id and j.sealed and l.document_id=d.id and l.account_id=ar_account;
     if delta<>0 then rows:=rows||jsonb_build_array(prographics_accounting.entry(ar_account,greatest(delta,0),greatest(-delta,0),d.id));end if;
    end if;
    if jsonb_array_length(rows)>0 then jid:=prographics_accounting.post(bk.id,jsonb_build_object('type','invoice_correction','source_id',d.id,'key','invoice_correction:'||req::text,'date',correction_date,'memo',reason),rows);end if;
    if needed_credit<>credit_total then
     if jid is null then raise exception 'Existing customer credit inventory does not match supported journal evidence; controller review is required';end if;
     for x in select id from public.ledger_credits where org_id=org_ref and source_invoice_id=d.id and status='open' loop perform prographics_accounting.permit('ledger_credits',x.id);update public.ledger_credits set status='invoice_revised' where id=x.id;end loop;
     if needed_credit>0 then insert into public.ledger_credits(org_id,user_id,customer_name,amount_cents,memo,source_invoice_id,status)values(org_ref,auth.uid(),revised.customer_name,needed_credit,'Invoice amount correction: '||reason,d.id,'open') returning id into new_credit_id;insert into prographics_accounting.source_links values(bk.id,jid,'ledger_credits',new_credit_id,(select md5(to_jsonb(c)::text) from public.ledger_credits c where c.id=new_credit_id));end if;
    end if;
   end if;
   revised.status:=case when hist then d.status else prographics_accounting.invoice_work_status(revised) end;
   perform prographics_accounting.permit('invoices',d.id);
   update public.invoices set customer_name=revised.customer_name,customer_email=revised.customer_email,ship_address=revised.ship_address,customer_po_number=revised.customer_po_number,issue_date=revised.issue_date,due_date=revised.due_date,notes=revised.notes,line_items=revised.line_items,subtotal_cents=revised.subtotal_cents,tax_cents=revised.tax_cents,total_cents=revised.total_cents,tax_status=revised.tax_status,artwork_urls=revised.artwork_urls,status=revised.status where id=d.id returning * into revised;
   insert into prographics_accounting.audit(book_id,action,actor,detail)values(bk.id,'invoice_revision',auth.uid(),jsonb_build_object('invoice_id',d.id,'request_key',req,'before',to_jsonb(d),'after',to_jsonb(revised),'payments_before',before_payments,'credits_before',before_credits,'money_changed',money_changed,'reason',reason,'correction_journal_id',jid));
  end if;
  insert into public.ledger_doc_events(org_id,invoice_id,event_type,detail)values(org_ref,revised.id,case when operation='create' then 'created' else 'revised' end,case when operation='create' then 'Saved IN PROGRESS' else 'Attributed invoice revision'||coalesce(': '||reason,'') end);
  perform prographics_accounting.clear_permits();
  result:=jsonb_build_object('id',revised.id,'status',prographics_accounting.invoice_work_status(revised),'fingerprint',md5(to_jsonb(revised)::text),'paid_cents',paid,'balance_cents',case when d.status='paid' and paid=0 then null else greatest(revised.total_cents-paid,0)end,'credit_cents',greatest(paid-revised.total_cents,0),'journal_id',jid,'saved',true);
 end if;
 if operation in ('manual_sent','send_claim') then
  if hist then raise exception 'Historical invoices retain their original delivery/payment evidence. Copy to new work to send a new invoice';end if;
  if not prographics_accounting.invoice_price_complete(d) then raise exception 'Complete the customer, descriptions, quantities and prices, and resolve any line/subtotal discrepancy before sending this invoice';end if;
  if operation='manual_sent' then
   if nullif(trim(payload->>'evidence'),'') is null then raise exception 'Record how this invoice was sent externally';end if;
   revised:=d;revised.sent_at:=coalesce(d.sent_at,now());revised.status:=prographics_accounting.invoice_work_status(revised);
   perform prographics_accounting.permit('invoices',d.id);
   update public.invoices set sent_at=revised.sent_at,status=revised.status where id=d.id returning * into revised;
   if d.sent_at is null then insert into public.ledger_doc_events(org_id,invoice_id,event_type,detail)values(org_ref,d.id,'sent','External send recorded: '||left(payload->>'evidence',1000));end if;
   insert into prographics_accounting.audit(book_id,action,actor,detail)values(bk.id,'invoice_external_send',auth.uid(),jsonb_build_object('invoice_id',d.id,'request_key',req,'evidence',payload->>'evidence','first_sent_at',revised.sent_at,'recorded_at',now()));
   perform prographics_accounting.clear_permits();result:=jsonb_build_object('id',d.id,'status',revised.status,'sent_at',revised.sent_at,'email_sent',false);
  else
   select * into existing_send from prographics_accounting.commands c where c.book_id=bk.id and c.request->>'invoice_workflow'='send_claim' and c.request->>'invoice_id'=d.id::text and exists(select 1 from prographics_accounting.invoice_delivery_results r where r.request_key=c.request_key and r.outcome->>'state'='sent' and r.created_at>now()-interval '60 seconds') order by c.created_at desc limit 1;
   if found then result:=(existing_send.result-'invoice')||(select outcome from prographics_accounting.invoice_delivery_results where request_key=existing_send.request_key)||jsonb_build_object('duplicate_prevented',true);
   else result:=jsonb_build_object('id',d.id,'state','sending','invoice',to_jsonb(d),'claimed_at',now(),'actor',auth.uid(),'fingerprint',fingerprint);end if;
  end if;
 end if;
 insert into prographics_accounting.commands(book_id,request_key,request,result,actor)values(bk.id,req,jsonb_build_object('invoice_workflow',operation,'invoice_id',case when operation='create' then null else invoice_id end,'payload',payload),result,auth.uid());
 return result;
end;
$$;

create or replace function public.prographics_invoice_public(p_token uuid,p_preview boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare d public.invoices;o public.ledger_orgs;c public.ledger_customers;paid bigint;balance bigint;nonce_ref uuid;staff boolean;hist boolean;
begin
 select * into d from public.invoices where public_token=p_token and org_id='51c83c73-b406-4cfa-9626-b600b3c30236' and doc_type='invoice';if not found then return null;end if;
 if d.status='void' then return jsonb_build_object('invoice_number',d.invoice_number,'status','void','prographics_void',true);end if;
 staff:=auth.uid() is not null and public.user_can_access_org(d.org_id);
 hist:=d.created_at::date='2026-09-09' and case when d.invoice_number~'^\d+$' then d.invoice_number::numeric<8662 else false end;
 select coalesce(sum(amount_cents),0) into paid from public.ledger_payments where org_id=d.org_id and invoice_id=d.id;
 balance:=case when d.status='paid' and paid=0 then null else greatest(d.total_cents-paid,0)end;
 if not p_preview and not staff then
  select nonce into nonce_ref from prographics_accounting.invoice_view_challenges where invoice_id=d.id and used_at is null and expires_at>now() order by created_at desc limit 1;
  if nonce_ref is null then insert into prographics_accounting.invoice_view_challenges(invoice_id)values(d.id)returning nonce into nonce_ref;end if;
 end if;
 select * into o from public.ledger_orgs where id=d.org_id;
 select * into c from public.ledger_customers where org_id=d.org_id and lower(name)=lower(d.customer_name) limit 1;
 return jsonb_build_object('customer_name',d.customer_name,'customer_email',d.customer_email,'issue_date',d.issue_date,'invoice_number',d.invoice_number,'status',prographics_accounting.invoice_work_status(d),'customer_po_number',d.customer_po_number,'show_item_names',true,'line_items',d.line_items,'subtotal_cents',d.subtotal_cents,'tax_cents',d.tax_cents,'total_cents',d.total_cents,'tax_status',d.tax_status,'ship_address',d.ship_address,'org_name',o.name,'remit_address',o.remit_address,'customer_note',o.customer_note,'ach_bank',o.ach_bank_name,'ach_routing',o.ach_routing,'ach_account',o.ach_account,'ach_notify',o.ach_notify,'bill_address',c.billing_address,'bill_phone',c.phone,'logo_url',o.logo_url,'brand_color',o.brand_color,'paid_cents',paid,'balance_cents',balance,'overpayment_cents',greatest(paid-d.total_cents,0),'view_nonce',nonce_ref,'staff_preview',staff or p_preview,'first_sent_at',d.sent_at,'first_viewed_at',d.viewed_at,'historical_payment_review',d.status='paid' and paid=0,'revised',exists(select 1 from public.ledger_doc_events e where e.invoice_id=d.id and e.event_type='revised' and e.created_at>coalesce(d.sent_at,'epoch')));
end;
$$;
