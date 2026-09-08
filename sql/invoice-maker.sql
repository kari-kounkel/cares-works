-- invoice-maker.sql — the brand-driven invoice maker behind /invoices.
--
-- Two tables. A brand is a LOOK plus a way to get paid: colors, logo, header
-- image, remit address, bank details, whether Stripe is on. A doc is one
-- invoice wearing one brand. Nothing about any specific business is compiled
-- in — the brands seeded alongside this file are rows, editable in the app.
--
-- Numbering is handed out by next_invoice_doc_number() under a row lock, and a
-- unique index backs it up. That is the 8730 collision, not repeated.

create table if not exists public.invoice_brands (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  slug              text not null,
  name              text not null,
  tagline           text,
  from_block        text,                       -- address block under the logo
  reply_to_email    text,
  logo_url          text,
  header_image_url  text,                       -- band across the top of the invoice
  accent_color      text not null default '#0080ff',
  flare_color       text default '#22c55e',     -- the second/accent flare
  flare2_color      text,                       -- optional third
  ink_color         text not null default '#0a0a14',
  paper_color       text not null default '#ffffff',
  page_color        text not null default '#f4f7fb',
  heading_font      text not null default 'DM Serif Display',
  body_font         text not null default 'Figtree',
  doc_label         text not null default 'INVOICE',
  presets           jsonb not null default '[]'::jsonb,  -- what it is FOR: [{key,label,header_image_url,accent_color,note,lines:[{desc,qty,price}]}]
  -- how they can pay
  stripe_enabled    boolean not null default true,
  stripe_account_ref text,                      -- reserved: per-brand key, unused while one account serves all
  ach_enabled       boolean not null default true,
  ach_bank          text,
  ach_routing       text,
  ach_account       text,
  ach_notify        text,
  check_enabled     boolean not null default true,
  check_payable_to  text,
  remit_address     text,
  terms             text,
  footer_note       text,
  number_prefix     text,
  next_number       integer not null default 1001,
  sort              integer not null default 0,
  archived          boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, slug)
);

create table if not exists public.invoice_docs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  brand_id          uuid not null references public.invoice_brands(id) on delete restrict,
  public_token      uuid not null default gen_random_uuid(),
  number            text,
  preset_key        text,
  purpose           text,                       -- what it is for, in her words
  issue_date        date not null default current_date,
  due_date          date,
  terms_label       text default 'Due on receipt',
  bill_to_name      text,
  bill_to_email     text,
  bill_to_address   text,
  bill_to_phone     text,
  line_items        jsonb not null default '[]'::jsonb,   -- [{desc,qty,price}]
  images            jsonb not null default '[]'::jsonb,   -- extra pictures on this invoice
  header_image_url  text,                       -- overrides the brand band for this one
  discount_cents    bigint not null default 0,
  tax_rate          numeric(6,4) not null default 0,
  subtotal_cents    bigint not null default 0,
  tax_cents         bigint not null default 0,
  total_cents       bigint not null default 0,
  amount_paid_cents bigint not null default 0,
  status            text not null default 'draft',  -- draft | sent | viewed | paid
  pay_card          boolean not null default true,
  pay_ach           boolean not null default true,
  pay_check         boolean not null default true,
  note              text,
  internal_note     text,
  paid_method       text,
  paid_reference    text,
  stripe_session_id text,
  sent_at           timestamptz,
  viewed_at         timestamptz,
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists invoice_docs_token_key on public.invoice_docs (public_token);
create unique index if not exists invoice_docs_number_key on public.invoice_docs (brand_id, number) where number is not null;
create index if not exists invoice_docs_brand_idx on public.invoice_docs (user_id, brand_id, issue_date desc);

alter table public.invoice_brands enable row level security;
alter table public.invoice_docs   enable row level security;

drop policy if exists invoice_brands_select on public.invoice_brands;
drop policy if exists invoice_brands_insert on public.invoice_brands;
drop policy if exists invoice_brands_update on public.invoice_brands;
drop policy if exists invoice_brands_delete on public.invoice_brands;
create policy invoice_brands_select on public.invoice_brands for select using (auth.uid() = user_id);
create policy invoice_brands_insert on public.invoice_brands for insert with check (auth.uid() = user_id);
create policy invoice_brands_update on public.invoice_brands for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy invoice_brands_delete on public.invoice_brands for delete using (auth.uid() = user_id);

drop policy if exists invoice_docs_select on public.invoice_docs;
drop policy if exists invoice_docs_insert on public.invoice_docs;
drop policy if exists invoice_docs_update on public.invoice_docs;
drop policy if exists invoice_docs_delete on public.invoice_docs;
create policy invoice_docs_select on public.invoice_docs for select using (auth.uid() = user_id);
create policy invoice_docs_insert on public.invoice_docs for insert with check (auth.uid() = user_id);
create policy invoice_docs_update on public.invoice_docs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy invoice_docs_delete on public.invoice_docs for delete using (auth.uid() = user_id);

-- Next number for a brand, under a row lock. Prefix included if the brand has one.
create or replace function public.next_invoice_doc_number(p_brand uuid)
returns text language plpgsql security definer set search_path to 'public' as $fn$
declare b public.invoice_brands; n integer;
begin
  select * into b from public.invoice_brands where id = p_brand and user_id = auth.uid() for update;
  if not found then raise exception 'brand not found'; end if;
  n := coalesce(b.next_number, 1001);
  update public.invoice_brands set next_number = n + 1, updated_at = now() where id = p_brand;
  return coalesce(b.number_prefix, '') || n::text;
end; $fn$;

-- The customer-facing read at /inv/<token>. No login. Marks it viewed the
-- first time it is opened for real; preview from the maker never does.
create or replace function public.get_invoice_doc(p_token uuid, p_preview boolean default false)
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare d public.invoice_docs; b public.invoice_brands;
begin
  select * into d from public.invoice_docs where public_token = p_token;
  if not found then return null; end if;
  if d.status = 'draft' and not p_preview then return null; end if;  -- a draft is not a link anyone can open
  if not p_preview and d.status = 'sent' then
    update public.invoice_docs set status = 'viewed', viewed_at = now() where id = d.id;
    d.status := 'viewed'; d.viewed_at := now();
  end if;
  select * into b from public.invoice_brands where id = d.brand_id;
  return jsonb_build_object(
    'token', d.public_token, 'number', d.number, 'purpose', d.purpose,
    'issue_date', d.issue_date, 'due_date', d.due_date, 'terms_label', d.terms_label,
    'bill_to_name', d.bill_to_name, 'bill_to_email', d.bill_to_email,
    'bill_to_address', d.bill_to_address, 'bill_to_phone', d.bill_to_phone,
    'line_items', d.line_items, 'images', d.images,
    'header_image_url', coalesce(d.header_image_url, b.header_image_url),
    'discount_cents', d.discount_cents, 'tax_rate', d.tax_rate,
    'subtotal_cents', d.subtotal_cents, 'tax_cents', d.tax_cents, 'total_cents', d.total_cents,
    'amount_paid_cents', d.amount_paid_cents, 'status', d.status, 'note', d.note,
    'paid_method', d.paid_method,
    'pay_card',  d.pay_card  and b.stripe_enabled,
    'pay_ach',   d.pay_ach   and b.ach_enabled,
    'pay_check', d.pay_check and b.check_enabled,
    'brand', jsonb_build_object(
      'name', b.name, 'slug', b.slug, 'tagline', b.tagline, 'from_block', b.from_block,
      'reply_to_email', b.reply_to_email, 'logo_url', b.logo_url,
      'accent_color', b.accent_color, 'flare_color', b.flare_color,
      'flare2_color', b.flare2_color, 'flare3_color', b.flare3_color,
      'ink_color', b.ink_color, 'paper_color', b.paper_color, 'page_color', b.page_color,
      'heading_font', b.heading_font, 'body_font', b.body_font, 'doc_label', b.doc_label,
      'ach_bank', b.ach_bank, 'ach_routing', b.ach_routing, 'ach_account', b.ach_account,
      'ach_notify', b.ach_notify, 'check_payable_to', b.check_payable_to,
      'remit_address', b.remit_address, 'terms', b.terms, 'footer_note', b.footer_note
    )
  );
end; $fn$;

grant execute on function public.get_invoice_doc(uuid, boolean) to anon, authenticated;
grant execute on function public.next_invoice_doc_number(uuid) to authenticated;

-- Applied after the first pass, kept here so this file matches the database:
alter table public.invoice_brands add column if not exists flare3_color text;
-- numeric(6,4) rounded 9.025% to 9.03% and charged nine cents too much.
alter table public.invoice_docs alter column tax_rate type numeric(9,6);
