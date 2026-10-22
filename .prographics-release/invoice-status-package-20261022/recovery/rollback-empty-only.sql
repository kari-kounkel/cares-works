do $$begin if exists(select 1 from prographics_accounting.invoice_delivery_results) or exists(select 1 from prographics_accounting.invoice_view_events) or exists(select 1 from prographics_accounting.audit where action='invoice_revision') then raise exception 'Rollback refuses to discard invoice evidence; use application rollback and retain the additive schema';end if;end$$;
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
  perform prographics_accounting.permit('invoices',doc.id);update public.invoices set status='paid',paid_at=now() where id=doc.id;
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
 if doc.status is distinct from 'draft' or coalesce(doc.doc_type,'invoice')<>'invoice' then raise exception 'Only a draft invoice can be finalized'; end if;
 if md5(to_jsonb(doc)::text) is distinct from p->>'expected_fingerprint' then raise exception 'Draft changed since review; reload before finalizing'; end if;
 -- Issued does not claim delivery. No email, provider call, or bank sync occurs here.
 update public.invoices set status='issued' where id=doc.id;
 jid:=prographics_accounting.accept_event(b,jsonb_build_object('type','invoice_issued','source_id',doc.id,'key','invoice_issued:'||doc.id::text,'date',doc.issue_date,'memo','Invoice finalized (delivery separate)'));
 result:=jsonb_build_object('invoice_id',doc.id,'journal_id',jid,'status','issued','delivery','not_sent');
 insert into prographics_accounting.commands(book_id,request_key,request,result,actor) values(b,(p->>'request_key')::uuid,p,result,auth.uid());
 return result;
end $function$
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
  update public.invoices set status='paid',paid_at=now() where id=doc.id and org_id=bk.org_id;
 end if;
 perform prographics_accounting.clear_permits();
 result:=jsonb_build_object('payment_id',pid,'entry_id',eid,'credit_id',cid,'journal_id',jid,'remaining_cents',greatest(remaining-amount,0),'excess_cents',excess);
 insert into prographics_accounting.commands(book_id,request_key,request,result,actor) values(b,request_id,p,result,auth.uid());
 return result;
end $function$
;
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
CREATE OR REPLACE FUNCTION public.prographics_preserve_work_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if old.org_id='51c83c73-b406-4cfa-9626-b600b3c30236'::uuid
 and old.status='in_progress' and new.status in ('sent','viewed') then
  new.status:=old.status;
 end if;
 return new;
end $function$
;
drop trigger prographics_invoice_sent_event_compat on public.ledger_doc_events;
drop function public.prographics_invoice_workflow(text,uuid,jsonb);
drop function public.prographics_invoice_delivery_result(uuid,uuid,jsonb);
drop function public.prographics_confirm_invoice_view(uuid,uuid);
drop function public.prographics_invoice_public(uuid,boolean);
drop function prographics_accounting.suppress_legacy_invoice_send_event();
drop function prographics_accounting.invoice_price_complete(public.invoices);
drop function prographics_accounting.invoice_lines_priced(public.invoices);
drop function prographics_accounting.invoice_work_status(public.invoices);
drop table prographics_accounting.invoice_view_challenges;
drop table prographics_accounting.invoice_view_events;
drop table prographics_accounting.invoice_delivery_results;
