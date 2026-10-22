do $release_guard$ begin
if (select md5(pg_get_functiondef(x.oid)) from pg_proc x join pg_namespace n on n.oid=x.pronamespace where n.nspname='prographics_accounting' and x.proname='apply_credit' and pg_get_function_identity_arguments(x.oid)='b uuid, p jsonb') is distinct from '36e014b295587364d15747e253dc0ec0' then raise exception 'Invoice release stopped: source function drift (apply_credit)';end if;
if (select md5(pg_get_functiondef(x.oid)) from pg_proc x join pg_namespace n on n.oid=x.pronamespace where n.nspname='prographics_accounting' and x.proname='finalize_invoice' and pg_get_function_identity_arguments(x.oid)='b uuid, p jsonb') is distinct from 'b0db76805babbc776b39b9bbc2c4cc1b' then raise exception 'Invoice release stopped: source function drift (finalize_invoice)';end if;
if (select md5(pg_get_functiondef(x.oid)) from pg_proc x join pg_namespace n on n.oid=x.pronamespace where n.nspname='prographics_accounting' and x.proname='receive_payment' and pg_get_function_identity_arguments(x.oid)='b uuid, p jsonb') is distinct from '3a752c6e120d6808308f8a73438ae24e' then raise exception 'Invoice release stopped: source function drift (receive_payment)';end if;
if (select md5(pg_get_functiondef(x.oid)) from pg_proc x join pg_namespace n on n.oid=x.pronamespace where n.nspname='public' and x.proname='get_invoice_public' and pg_get_function_identity_arguments(x.oid)='p_token uuid') is distinct from '45284b8320e820997dc106baace1ddce' then raise exception 'Invoice release stopped: source function drift (get_invoice_public)';end if;
if (select md5(pg_get_functiondef(x.oid)) from pg_proc x join pg_namespace n on n.oid=x.pronamespace where n.nspname='public' and x.proname='get_invoice_public' and pg_get_function_identity_arguments(x.oid)='p_token uuid, p_preview boolean') is distinct from '4152e0ace7d2490119ca63789b595af8' then raise exception 'Invoice release stopped: source function drift (get_invoice_public)';end if;
if (select md5(pg_get_functiondef(x.oid)) from pg_proc x join pg_namespace n on n.oid=x.pronamespace where n.nspname='public' and x.proname='prographics_preserve_work_status' and pg_get_function_identity_arguments(x.oid)='') is distinct from 'e97b2c8b6c80039a28adb6473416c826' then raise exception 'Invoice release stopped: source function drift (prographics_preserve_work_status)';end if;
if not exists(select 1 from prographics_accounting.books where id='5aa43665-08da-4ee3-ae01-5bf298caa66e' and org_id='51c83c73-b406-4cfa-9626-b600b3c30236' and basis='cash' and state='active') then raise exception 'Invoice release stopped: original cash book identity/state changed';end if;
end $release_guard$;
create table if not exists prographics_accounting.invoice_delivery_results(
 request_key uuid primary key,invoice_id uuid not null,actor uuid not null,outcome jsonb not null,created_at timestamptz not null default now());
alter table prographics_accounting.invoice_delivery_results enable row level security;
revoke all on prographics_accounting.invoice_delivery_results from public,anon,authenticated;
create trigger invoice_delivery_result_immutable before update or delete on prographics_accounting.invoice_delivery_results for each row execute function prographics_accounting.immutable();
create table if not exists prographics_accounting.invoice_view_events(
 invoice_id uuid primary key,confirmed_at timestamptz not null default now(),method text not null,recorded_invoice jsonb not null,prior_viewed_at timestamptz);
alter table prographics_accounting.invoice_view_events enable row level security;
revoke all on prographics_accounting.invoice_view_events from public,anon,authenticated;
create trigger invoice_view_event_immutable before update or delete on prographics_accounting.invoice_view_events for each row execute function prographics_accounting.immutable();

-- ProGraphics only. No legacy row/status/payment/journal is bulk rewritten.
create or replace function prographics_accounting.invoice_work_status(d public.invoices)
returns text language sql stable security definer set search_path='' as $$
 select case when exists(select 1 from public.ledger_payments p where p.invoice_id=d.id and p.org_id=d.org_id)
                  and (select coalesce(sum(p.amount_cents),0) from public.ledger_payments p where p.invoice_id=d.id and p.org_id=d.org_id)>=d.total_cents then 'paid'
 when d.status='paid' and d.created_at::date='2026-09-09' and case when d.invoice_number~'^\d+$' then d.invoice_number::numeric<8662 else false end then 'paid'
 when d.viewed_at is not null or d.status='viewed' then 'viewed'
 when d.sent_at is not null or d.status='sent' then 'sent' else 'in_progress' end;
$$;
revoke all on function prographics_accounting.invoice_work_status(public.invoices) from public,anon,authenticated,service_role;

create or replace function prographics_accounting.invoice_lines_priced(d public.invoices)
returns boolean language plpgsql immutable set search_path='' as $$
declare l jsonb;
begin
 if jsonb_typeof(d.line_items) is distinct from 'array' then return false;end if;
 if jsonb_array_length(d.line_items)=0 then return false;end if;
 for l in select value from jsonb_array_elements(d.line_items) loop
  if nullif(trim(coalesce(nullif(l->>'desc',''),l->>'item')),'') is null or jsonb_typeof(l->'qty') is distinct from 'number' or jsonb_typeof(l->'price') is distinct from 'number' then return false;end if;
  if (l->>'qty')::numeric<=0 then return false;end if;
 end loop;
 return true;
end;
$$;
revoke all on function prographics_accounting.invoice_lines_priced(public.invoices) from public,anon,authenticated,service_role;
create or replace function prographics_accounting.invoice_price_complete(d public.invoices)
returns boolean language plpgsql immutable set search_path='' as $$
begin
 if not prographics_accounting.invoice_lines_priced(d) or nullif(trim(d.customer_name),'') is null then return false;end if;
 return d.subtotal_cents=(select coalesce(sum(round((l->>'qty')::numeric*(l->>'price')::numeric*100)),0) from jsonb_array_elements(d.line_items) l) and d.total_cents=d.subtotal_cents+d.tax_cents;
end;
$$;
revoke all on function prographics_accounting.invoice_price_complete(public.invoices) from public,anon,authenticated,service_role;

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
 if operation='state' then return jsonb_build_object('record',to_jsonb(d),'payments',(select coalesce(jsonb_agg(to_jsonb(p) order by p.id),'[]') from public.ledger_payments p where p.org_id=org_ref and p.invoice_id=d.id),'fingerprint',fingerprint,'status',prographics_accounting.invoice_work_status(d),'paid_cents',paid,'balance_cents',case when hist and d.status='paid' and paid=0 then null else greatest(d.total_cents-paid,0) end,'historical',hist,'pricing_complete',prographics_accounting.invoice_price_complete(d),'legacy_payment_review',d.status='paid' and paid=0);end if;
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
  result:=jsonb_build_object('id',revised.id,'status',prographics_accounting.invoice_work_status(revised),'fingerprint',md5(to_jsonb(revised)::text),'paid_cents',paid,'balance_cents',case when hist and d.status='paid' and paid=0 then null else greatest(revised.total_cents-paid,0)end,'credit_cents',greatest(paid-revised.total_cents,0),'journal_id',jid,'saved',true);
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
revoke all on function public.prographics_invoice_workflow(text,uuid,jsonb) from public,anon;
grant execute on function public.prographics_invoice_workflow(text,uuid,jsonb) to authenticated;

-- Only the existing email Edge Function's server credential can acknowledge provider results.
create or replace function public.prographics_invoice_delivery_result(request_key uuid,invoice_id uuid,outcome jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c prographics_accounting.commands;bk prographics_accounting.books;d public.invoices;result jsonb;new_state text:=outcome->>'state';
begin
 select * into strict bk from prographics_accounting.books where org_id='51c83c73-b406-4cfa-9626-b600b3c30236' for update;
 select * into strict c from prographics_accounting.commands where book_id=bk.id and prographics_accounting.commands.request_key=prographics_invoice_delivery_result.request_key for update;
 if c.request->>'invoice_workflow'<>'send_claim' or c.request->>'invoice_id' is distinct from invoice_id::text then raise exception 'Invoice delivery claim mismatch';end if;
 if exists(select 1 from prographics_accounting.invoice_delivery_results r where r.request_key=prographics_invoice_delivery_result.request_key) then return (select outcome from prographics_accounting.invoice_delivery_results r where r.request_key=prographics_invoice_delivery_result.request_key);end if;
 if c.result->>'state'<>'sending' then return c.result;end if;
 if new_state not in ('sent','failed','unknown') then raise exception 'Unsupported delivery result';end if;
 if new_state='sent' and nullif(outcome->>'provider_id','') is null then raise exception 'A provider receipt is required before SENT';end if;
 select * into strict d from public.invoices where id=invoice_id and org_id=bk.org_id for update;
 if new_state='sent' then
  d.sent_at:=coalesce(d.sent_at,now());d.status:=prographics_accounting.invoice_work_status(d);
  perform prographics_accounting.permit('invoices',d.id);
  update public.invoices set sent_at=d.sent_at,status=d.status where id=d.id;
  insert into public.ledger_doc_events(org_id,invoice_id,event_type,detail)values(bk.org_id,d.id,'sent','Provider accepted invoice email; reference '||(outcome->>'provider_id'));
  perform prographics_accounting.clear_permits();
 end if;
 result:=(c.result-'invoice')||jsonb_build_object('state',new_state,'completed_at',now(),'provider_id',outcome->>'provider_id','message',left(outcome->>'message',1000));
 insert into prographics_accounting.invoice_delivery_results(request_key,invoice_id,actor,outcome)values(prographics_invoice_delivery_result.request_key,d.id,c.actor,result);
 insert into prographics_accounting.audit(book_id,action,actor,detail)values(bk.id,'invoice_email_'||new_state,c.actor,jsonb_build_object('invoice_id',d.id,'request_key',request_key,'outcome',outcome,'original_fingerprint',c.result->>'fingerprint'));
 return result;
end;
$$;
revoke all on function public.prographics_invoice_delivery_result(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.prographics_invoice_delivery_result(uuid,uuid,jsonb) to service_role;

-- Temporary anonymous-link challenges never alter invoice status on a GET/page load.
create table if not exists prographics_accounting.invoice_view_challenges(
 nonce uuid primary key default gen_random_uuid(),invoice_id uuid not null references public.invoices(id) on delete cascade,
 created_at timestamptz not null default now(),used_at timestamptz,expires_at timestamptz not null default now()+interval '30 minutes');
alter table prographics_accounting.invoice_view_challenges enable row level security;
revoke all on prographics_accounting.invoice_view_challenges from public,anon,authenticated;

create or replace function public.prographics_invoice_public(p_token uuid,p_preview boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare d public.invoices;o public.ledger_orgs;c public.ledger_customers;paid bigint;balance bigint;nonce_ref uuid;staff boolean;hist boolean;
begin
 select * into d from public.invoices where public_token=p_token and org_id='51c83c73-b406-4cfa-9626-b600b3c30236' and doc_type='invoice';if not found then return null;end if;
 if d.status='void' then return jsonb_build_object('invoice_number',d.invoice_number,'status','void','prographics_void',true);end if;
 staff:=auth.uid() is not null and public.user_can_access_org(d.org_id);
 hist:=d.created_at::date='2026-09-09' and case when d.invoice_number~'^\d+$' then d.invoice_number::numeric<8662 else false end;
 select coalesce(sum(amount_cents),0) into paid from public.ledger_payments where org_id=d.org_id and invoice_id=d.id;
 balance:=case when hist and d.status='paid' and paid=0 then null else greatest(d.total_cents-paid,0)end;
 if not p_preview and not staff then
  select nonce into nonce_ref from prographics_accounting.invoice_view_challenges where invoice_id=d.id and used_at is null and expires_at>now() order by created_at desc limit 1;
  if nonce_ref is null then insert into prographics_accounting.invoice_view_challenges(invoice_id)values(d.id)returning nonce into nonce_ref;end if;
 end if;
 select * into o from public.ledger_orgs where id=d.org_id;
 select * into c from public.ledger_customers where org_id=d.org_id and lower(name)=lower(d.customer_name) limit 1;
 return jsonb_build_object('customer_name',d.customer_name,'customer_email',d.customer_email,'issue_date',d.issue_date,'invoice_number',d.invoice_number,'status',prographics_accounting.invoice_work_status(d),'customer_po_number',d.customer_po_number,'show_item_names',true,'line_items',d.line_items,'subtotal_cents',d.subtotal_cents,'tax_cents',d.tax_cents,'total_cents',d.total_cents,'tax_status',d.tax_status,'ship_address',d.ship_address,'org_name',o.name,'remit_address',o.remit_address,'customer_note',o.customer_note,'ach_bank',o.ach_bank_name,'ach_routing',o.ach_routing,'ach_account',o.ach_account,'ach_notify',o.ach_notify,'bill_address',c.billing_address,'bill_phone',c.phone,'logo_url',o.logo_url,'brand_color',o.brand_color,'paid_cents',paid,'balance_cents',balance,'overpayment_cents',greatest(paid-d.total_cents,0),'view_nonce',nonce_ref,'staff_preview',staff or p_preview,'first_sent_at',d.sent_at,'first_viewed_at',d.viewed_at,'historical_payment_review',hist and d.status='paid' and paid=0,'revised',exists(select 1 from public.ledger_doc_events e where e.invoice_id=d.id and e.event_type='revised' and e.created_at>coalesce(d.sent_at,'epoch')));
end;
$$;
revoke all on function public.prographics_invoice_public(uuid,boolean) from public;
grant execute on function public.prographics_invoice_public(uuid,boolean) to anon,authenticated;

create or replace function public.prographics_confirm_invoice_view(p_token uuid,p_nonce uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare d public.invoices;bk prographics_accounting.books;challenge prographics_accounting.invoice_view_challenges;first_view boolean;
begin
 select * into strict d from public.invoices where public_token=p_token and org_id='51c83c73-b406-4cfa-9626-b600b3c30236' and doc_type='invoice' for update;
 if auth.uid() is not null and public.user_can_access_org(d.org_id) then return jsonb_build_object('recorded',false,'staff_preview',true);end if;
 if d.status='void' then return jsonb_build_object('recorded',false);end if;
 select * into strict challenge from prographics_accounting.invoice_view_challenges where nonce=p_nonce and invoice_id=d.id for update;
 if challenge.expires_at<=now() then raise exception 'This view confirmation expired; reload the invoice';end if;
 if challenge.used_at is not null then return jsonb_build_object('recorded',true,'duplicate_prevented',true);end if;
 update prographics_accounting.invoice_view_challenges set used_at=now() where nonce=p_nonce;
 select * into strict bk from prographics_accounting.books where org_id=d.org_id;
 select not exists(select 1 from prographics_accounting.invoice_view_events where invoice_id=d.id) into first_view;
 if first_view then
  insert into prographics_accounting.invoice_view_events(invoice_id,method,recorded_invoice,prior_viewed_at)values(d.id,'explicit_anonymous_invoice_button',to_jsonb(d),d.viewed_at);
  perform prographics_accounting.permit('invoices',d.id);
  update public.invoices set viewed_at=coalesce(viewed_at,now()),status=case when prographics_accounting.invoice_work_status(d)='paid' then 'paid' else 'viewed' end where id=d.id;
  insert into public.ledger_doc_events(org_id,invoice_id,event_type,detail)values(d.org_id,d.id,'viewed','Explicit anonymous customer-link View Invoice action; signed-in staff excluded');
  perform prographics_accounting.clear_permits();
 end if;
 return jsonb_build_object('recorded',true,'first_view',first_view);
end;
$$;
revoke all on function public.prographics_confirm_invoice_view(uuid,uuid) from public;
grant execute on function public.prographics_confirm_invoice_view(uuid,uuid) to anon,authenticated;

create or replace function public.prographics_preserve_work_status()
returns trigger language plpgsql set search_path='' as $$
begin
 if old.org_id='51c83c73-b406-4cfa-9626-b600b3c30236' and old.doc_type='invoice' then
  if new.status='paid' and old.status is distinct from 'paid' and not exists(select 1 from public.ledger_payments p where p.invoice_id=new.id and p.org_id=new.org_id having sum(p.amount_cents)>=new.total_cents) then raise exception 'PAID requires actual recorded payment allocations';end if;
  if old.status='paid' and new.status in ('sent','viewed') and exists(select 1 from public.ledger_payments p where p.invoice_id=new.id and p.org_id=new.org_id having sum(p.amount_cents)>=new.total_cents) then new.status:='paid';end if;
 end if;
 return new;
end;
$$;

-- Compatibility for already-open older clients: the server owns successful email events.
create or replace function prographics_accounting.suppress_legacy_invoice_send_event()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.org_id='51c83c73-b406-4cfa-9626-b600b3c30236' and new.event_type='sent' and new.detail like 'Emailed to %'
 and exists(select 1 from prographics_accounting.invoice_delivery_results r where r.invoice_id=new.invoice_id and r.outcome->>'state'='sent' and r.created_at>now()-interval '60 seconds') then return null;end if;
 return new;
end;
$$;
revoke all on function prographics_accounting.suppress_legacy_invoice_send_event() from public,anon,authenticated,service_role;
create trigger prographics_invoice_sent_event_compat before insert on public.ledger_doc_events for each row execute function prographics_accounting.suppress_legacy_invoice_send_event();

CREATE OR REPLACE FUNCTION public.get_invoice_public(p_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare inv public.invoices; o public.ledger_orgs; cust public.ledger_customers; v_revised boolean;
begin
  select * into inv from public.invoices where public_token = p_token;
  if not found then return null; end if;
  if inv.org_id='51c83c73-b406-4cfa-9626-b600b3c30236'::uuid and inv.doc_type='invoice' then return public.prographics_invoice_public(p_token,false);end if;
  if inv.org_id='51c83c73-b406-4cfa-9626-b600b3c30236'::uuid and inv.status='void' then return jsonb_build_object('invoice_number',inv.invoice_number,'status','void','prographics_void',true);end if;
  if inv.status = 'sent' then
    update public.invoices set status='viewed', viewed_at=now() where id=inv.id;
    inv.status := 'viewed';
    -- log each view cycle (a resend flips status back to 'sent', so re-opens log again)
    insert into public.ledger_doc_events(org_id, invoice_id, event_type, detail)
    values (inv.org_id, inv.id, 'viewed', 'Opened the link');
  end if;
  -- revised = an edit was logged after the most recent send
  select exists (
    select 1 from public.ledger_doc_events e
    where e.invoice_id = inv.id and e.event_type = 'revised'
      and e.created_at > coalesce(
        (select max(created_at) from public.ledger_doc_events e2 where e2.invoice_id = inv.id and e2.event_type = 'sent'),
        inv.sent_at, 'epoch'::timestamptz)
  ) into v_revised;
  select * into o from public.ledger_orgs where id = inv.org_id;
  select * into cust from public.ledger_customers where org_id=inv.org_id and lower(name)=lower(inv.customer_name) limit 1;
  return jsonb_build_object(
    'customer_name', inv.customer_name, 'customer_email', inv.customer_email,
    'issue_date', inv.issue_date, 'invoice_number', inv.invoice_number, 'status', inv.status,
    'revised', v_revised,
    'customer_po_number', case when inv.org_id='51c83c73-b406-4cfa-9626-b600b3c30236'::uuid then inv.customer_po_number else null end,
    'show_item_names', inv.org_id='51c83c73-b406-4cfa-9626-b600b3c30236'::uuid,
    'line_items', inv.line_items, 'subtotal_cents', inv.subtotal_cents,
    'tax_cents', inv.tax_cents, 'total_cents', inv.total_cents, 'tax_status', inv.tax_status,
    'org_name', o.name, 'remit_address', o.remit_address, 'customer_note', o.customer_note,
    'ach_bank', o.ach_bank_name, 'ach_routing', o.ach_routing, 'ach_account', o.ach_account,
    'ach_notify', o.ach_notify, 'bill_address', cust.billing_address, 'bill_phone', cust.phone,
    'logo_url', o.logo_url, 'brand_color', o.brand_color
  );
end; $function$
;
CREATE OR REPLACE FUNCTION public.get_invoice_public(p_token uuid, p_preview boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare inv public.invoices; o public.ledger_orgs; cust public.ledger_customers; v_revised boolean;
begin
  select * into inv from public.invoices where public_token = p_token;
  if not found then return null; end if;
  if inv.org_id='51c83c73-b406-4cfa-9626-b600b3c30236'::uuid and inv.doc_type='invoice' then return public.prographics_invoice_public(p_token,p_preview);end if;
  if inv.org_id='51c83c73-b406-4cfa-9626-b600b3c30236'::uuid and inv.status='void' then return jsonb_build_object('invoice_number',inv.invoice_number,'status','void','prographics_void',true);end if;
  -- preview (from the workspace) never marks it viewed or logs a view
  if not p_preview and inv.status = 'sent' then
    update public.invoices set status='viewed', viewed_at=now() where id=inv.id;
    inv.status := 'viewed';
    insert into public.ledger_doc_events(org_id, invoice_id, event_type, detail)
    values (inv.org_id, inv.id, 'viewed', 'Opened the link');
  end if;
  select exists (
    select 1 from public.ledger_doc_events e
    where e.invoice_id = inv.id and e.event_type = 'revised'
      and e.created_at > coalesce(
        (select max(created_at) from public.ledger_doc_events e2 where e2.invoice_id = inv.id and e2.event_type = 'sent'),
        inv.sent_at, 'epoch'::timestamptz)
  ) into v_revised;
  select * into o from public.ledger_orgs where id = inv.org_id;
  select * into cust from public.ledger_customers where org_id=inv.org_id and lower(name)=lower(inv.customer_name) limit 1;
  return jsonb_build_object(
    'customer_name', inv.customer_name, 'customer_email', inv.customer_email,
    'issue_date', inv.issue_date, 'invoice_number', inv.invoice_number, 'status', inv.status,
    'revised', v_revised, 'ship_address', inv.ship_address,
    'customer_po_number', case when inv.org_id='51c83c73-b406-4cfa-9626-b600b3c30236'::uuid then inv.customer_po_number else null end,
    'show_item_names', inv.org_id='51c83c73-b406-4cfa-9626-b600b3c30236'::uuid,
    'line_items', inv.line_items, 'subtotal_cents', inv.subtotal_cents,
    'tax_cents', inv.tax_cents, 'total_cents', inv.total_cents, 'tax_status', inv.tax_status,
    'org_name', o.name, 'remit_address', o.remit_address, 'customer_note', o.customer_note,
    'ach_bank', o.ach_bank_name, 'ach_routing', o.ach_routing, 'ach_account', o.ach_account,
    'ach_notify', o.ach_notify, 'bill_address', cust.billing_address, 'bill_phone', cust.phone,
    'logo_url', o.logo_url, 'brand_color', o.brand_color
  );
end; $function$
;
CREATE OR REPLACE FUNCTION prographics_accounting.receive_payment(b uuid, p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare bk prographics_accounting.books; doc public.invoices; prior prographics_accounting.commands; result jsonb;
 pid uuid:=gen_random_uuid(); eid uuid:=gen_random_uuid(); jid uuid; cid uuid;
 request_id uuid:=(p->>'request_key')::uuid; amount bigint:=(p->>'amount_cents')::bigint;
 remaining bigint; excess bigint; destination uuid:=(p->>'account_id')::uuid; receipt_mapping uuid;
 existing_entry public.ledger_entries; matched boolean:=nullif(p->>'existing_entry_id','') is not null;
begin
 perform prographics_accounting.require_role(b,array['poster','controller']);
 select * into strict bk from prographics_accounting.books where id=b for update;
 if bk.state='disabled' then raise exception 'Native accounting is not enabled'; end if;
 if request_id is null or amount is null or amount<=0 then raise exception 'Stable request key and positive amount required'; end if;
 select * into prior from prographics_accounting.commands where book_id=b and request_key=request_id;
 if found then
  if prior.request<>p then raise exception 'Payment request key reused with different input'; end if;
  return prior.result;
 end if;
 select * into strict doc from public.invoices where id=(p->>'invoice_id')::uuid and org_id=bk.org_id for update;
 if coalesce(doc.doc_type,'invoice')<>'invoice' or coalesce(doc.status,'') not in ('issued','sent','viewed','paid') then raise exception 'Finalized invoice required'; end if;
 if bk.basis='accrual' and not exists(select 1 from prographics_accounting.journals where book_id=b and source_key='invoice_issued:'||doc.id::text) then raise exception 'Invoice accounting must be established before native receipt'; end if;
 if bk.basis='cash' and (doc.issue_date<bk.cutover or exists(select 1 from prographics_accounting.journals r join prographics_accounting.lines l on l.journal_id=r.reverses_id where l.book_id=b and l.document_id=doc.id)) then raise exception 'Historical or corrected invoice requires explicit receipt review'; end if;
 if exists(select 1 from prographics_accounting.journals r join prographics_accounting.journals original on original.id=r.reverses_id where original.book_id=b and original.source_key='invoice_issued:'||doc.id::text) then raise exception 'Invoice was reversed; corrected obligation must be resolved first'; end if;
 if (p->>'date')::date<doc.issue_date then raise exception 'Pre-invoice deposits require a separate accepted policy'; end if;
 perform 1 from public.ledger_accounts where id=destination and org_id=bk.org_id for share;
 if not found then raise exception 'Financial account not in organization'; end if;
 receipt_mapping:=prographics_accounting.account_for(b,'financial_account:'||destination::text);
 if bk.basis='accrual' and receipt_mapping<>prographics_accounting.account_for(b,'receipts') then raise exception 'Receipt destination differs from accepted receipts mapping'; end if;
 if matched then
  select * into strict existing_entry from public.ledger_entries where id=(p->>'existing_entry_id')::uuid and org_id=bk.org_id for update;
  if existing_entry.direction<>'in' or existing_entry.amount_cents<>amount or existing_entry.entry_date is distinct from (p->>'date')::date or existing_entry.account_id is distinct from destination then raise exception 'Existing deposit amount, date or account differs from payment'; end if;
  if existing_entry.payment_id is not null or existing_entry.invoice_id is not null or exists(select 1 from prographics_accounting.source_links where book_id=b and source_table='ledger_entries' and source_id=existing_entry.id) or exists(select 1 from public.ledger_payments where entry_id=existing_entry.id) then raise exception 'Existing deposit is already linked; do not create a second payment'; end if;
  eid:=existing_entry.id;
 end if;
 if bk.basis='cash' then
  select greatest(doc.total_cents-coalesce(sum(amount_cents),0),0) into remaining from public.ledger_payments where org_id=bk.org_id and invoice_id=doc.id;
 else
  select coalesce(sum(debit_cents-credit_cents),0) into remaining from prographics_accounting.lines where book_id=b and document_id=doc.id and account_id=prographics_accounting.account_for(b,'ar');
 end if;
 if remaining<0 then raise exception 'AR control requires review'; end if;
 excess:=greatest(amount-remaining,0);
 insert into public.ledger_payments(id,org_id,user_id,invoice_id,amount_cents,method,check_number,paid_on,memo)
 values(pid,bk.org_id,auth.uid(),doc.id,amount,p->>'method',nullif(p->>'check_number',''),(p->>'date')::date,p->>'memo');
 if not matched then
 insert into public.ledger_entries(id,org_id,user_id,entry_date,direction,amount_cents,description,payment_method,reference,account_id,invoice_id,payment_id)
 values(eid,bk.org_id,auth.uid(),(p->>'date')::date,'in',amount,'Payment on invoice '||coalesce(doc.invoice_number::text,doc.id::text),p->>'method',p->>'check_number',destination,doc.id,pid);
 end if;
 update public.ledger_payments set entry_id=eid where id=pid;
 if excess>0 then
  insert into public.ledger_credits(org_id,user_id,customer_name,amount_cents,memo,source_invoice_id,status)
  values(bk.org_id,auth.uid(),doc.customer_name,excess,'Native receipt excess',doc.id,'open') returning id into cid;
 end if;
 perform prographics_accounting.permit('ledger_payments',pid);
 jid:=prographics_accounting.accept_event(b,jsonb_build_object('type','payment_received','source_id',pid,'key','payment_received:'||pid::text,'date',p->>'date','memo',coalesce(nullif(p->>'memo',''),'Customer receipt')));
 insert into prographics_accounting.source_links values(b,jid,'ledger_entries',eid,(select md5(to_jsonb(e)::text) from public.ledger_entries e where id=eid));
 if cid is not null then insert into prographics_accounting.source_links values(b,jid,'ledger_credits',cid,(select md5(to_jsonb(c)::text) from public.ledger_credits c where id=cid)); end if;
 if amount>=remaining then
  perform prographics_accounting.permit('invoices',doc.id);
  update public.invoices set status='paid',paid_at=coalesce(paid_at,now()) where id=doc.id and org_id=bk.org_id;
 end if;
 perform prographics_accounting.clear_permits();
 result:=jsonb_build_object('payment_id',pid,'entry_id',eid,'credit_id',cid,'journal_id',jid,'remaining_cents',greatest(remaining-amount,0),'excess_cents',excess);
 insert into prographics_accounting.commands(book_id,request_key,request,result,actor) values(b,request_id,p,result,auth.uid());
 return result;
end $function$
;
CREATE OR REPLACE FUNCTION prographics_accounting.apply_credit(b uuid, p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare bk prographics_accounting.books; prior prographics_accounting.commands; cr public.ledger_credits; doc public.invoices; origin public.invoices;
 amount bigint:=(p->>'amount_cents')::bigint; remaining bigint; liability bigint; pid uuid:=gen_random_uuid(); jid uuid; result jsonb; rows jsonb;
begin
 perform prographics_accounting.require_role(b,array['poster','controller']);
 select * into strict bk from prographics_accounting.books where id=b for update;
 if bk.basis='cash' then raise exception 'Applying customer credit requires accepted cash-basis advance treatment; no records changed'; end if;
 if bk.state='disabled' then raise exception 'Native accounting is not enabled'; end if;
 if nullif(p->>'request_key','') is null or amount is null or amount<=0 then raise exception 'Valid credit application required'; end if;
 select * into prior from prographics_accounting.commands where book_id=b and request_key=(p->>'request_key')::uuid;
 if found then
  if prior.request<>p then raise exception 'Request key reused with different input'; end if;
  return prior.result;
 end if;
 select * into strict cr from public.ledger_credits where id=(p->>'credit_id')::uuid and org_id=bk.org_id for update;
 select * into strict doc from public.invoices where id=(p->>'invoice_id')::uuid and org_id=bk.org_id for update;
 select * into strict origin from public.invoices where id=cr.source_invoice_id and org_id=bk.org_id for share;
 if cr.status<>'open' or amount>cr.amount_cents or doc.customer_name is distinct from origin.customer_name or doc.customer_name is null then raise exception 'Credit/customer context requires review'; end if;
 if not exists(select 1 from prographics_accounting.commands c where c.book_id=b and c.result->>'credit_id'=cr.id::text) then raise exception 'Historical credit cannot be rewritten by native application'; end if;
 select coalesce(sum(debit_cents-credit_cents),0) into remaining from prographics_accounting.lines where book_id=b and document_id=doc.id and account_id=prographics_accounting.account_for(b,'ar');
 select coalesce(sum(credit_cents-debit_cents),0) into liability from prographics_accounting.lines where book_id=b and document_id=origin.id and account_id=prographics_accounting.account_for(b,'customer_credit');
 if amount>remaining or amount>liability then raise exception 'Credit exceeds supported AR or liability'; end if;
 if (p->>'date')::date<greatest(doc.issue_date,origin.issue_date) then raise exception 'Credit application predates source'; end if;
 insert into public.ledger_payments(id,org_id,user_id,invoice_id,amount_cents,method,paid_on,memo)
 values(pid,bk.org_id,auth.uid(),doc.id,amount,'credit',(p->>'date')::date,'Native customer credit application');
 rows:=jsonb_build_array(prographics_accounting.entry(prographics_accounting.account_for(b,'customer_credit'),amount,0,origin.id),prographics_accounting.entry(prographics_accounting.account_for(b,'ar'),0,amount,doc.id));
 jid:=prographics_accounting.post(b,jsonb_build_object('type','credit_applied','source_id',pid,'key','credit_applied:'||pid::text,'date',p->>'date','memo','Customer credit applied','credit_id',cr.id,'target_invoice_id',doc.id),rows);
 insert into prographics_accounting.source_links values(b,jid,'ledger_payments',pid,(select md5(to_jsonb(x)::text) from public.ledger_payments x where id=pid));
 perform prographics_accounting.permit('ledger_credits',cr.id);
 if amount=cr.amount_cents then update public.ledger_credits set status='applied',applied_invoice_id=doc.id where id=cr.id;
 else update public.ledger_credits set amount_cents=amount_cents-amount where id=cr.id; end if;
 if amount=remaining then
  perform prographics_accounting.permit('invoices',doc.id);update public.invoices set status='paid',paid_at=coalesce(paid_at,now()) where id=doc.id;
 end if;
 perform prographics_accounting.clear_permits();
 result:=jsonb_build_object('payment_id',pid,'journal_id',jid,'remaining_cents',remaining-amount);
 insert into prographics_accounting.commands(book_id,request_key,request,result,actor) values(b,(p->>'request_key')::uuid,p,result,auth.uid());
 return result;
end $function$
;

CREATE OR REPLACE FUNCTION prographics_accounting.finalize_invoice(b uuid, p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare bk prographics_accounting.books; doc public.invoices; prior prographics_accounting.commands; jid uuid; result jsonb;
begin
 perform prographics_accounting.require_role(b,array['poster','controller']);
 select * into strict bk from prographics_accounting.books where id=b for update;
 if bk.state='disabled' then raise exception 'Native accounting is not enabled'; end if;
 if nullif(p->>'request_key','') is null then raise exception 'Request identity required'; end if;
 select * into prior from prographics_accounting.commands where book_id=b and request_key=(p->>'request_key')::uuid;
 if found then
  if prior.request<>p then raise exception 'Request key reused with different input'; end if;
  return prior.result;
 end if;
 select * into strict doc from public.invoices where id=(p->>'invoice_id')::uuid and org_id=bk.org_id for update;
 if (doc.status is null or doc.status not in ('draft','in_progress')) or coalesce(doc.doc_type,'invoice')<>'invoice' then raise exception 'Only a draft invoice can be finalized'; end if;
 if md5(to_jsonb(doc)::text) is distinct from p->>'expected_fingerprint' then raise exception 'Draft changed since review; reload before finalizing'; end if;
 -- Issued does not claim delivery. No email, provider call, or bank sync occurs here.
 update public.invoices set status='issued' where id=doc.id;
 jid:=prographics_accounting.accept_event(b,jsonb_build_object('type','invoice_issued','source_id',doc.id,'key','invoice_issued:'||doc.id::text,'date',doc.issue_date,'memo','Invoice finalized (delivery separate)'));
 result:=jsonb_build_object('invoice_id',doc.id,'journal_id',jid,'status','issued','delivery','not_sent');
 insert into prographics_accounting.commands(book_id,request_key,request,result,actor) values(b,(p->>'request_key')::uuid,p,result,auth.uid());
 return result;
end $function$
;
