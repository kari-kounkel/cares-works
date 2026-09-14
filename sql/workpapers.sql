-- Client workpaper links: a private, tokenized page (tools.caresmn.com/emerson/<token>)
-- that shows a set of tax workpapers and lets the client answer each open item.
-- The page is public-by-token; the tables are never readable by anon directly.
-- Reads and answers go through SECURITY DEFINER functions that take the token.

create table if not exists public.workpaper_links (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique default encode(gen_random_bytes(16), 'hex'),
  slug        text not null,                 -- route prefix, e.g. 'emerson'
  title       text not null,
  client_name text,
  payload     jsonb not null,                -- the workpapers (summary, P&L, cash, proof, loans, checks, open items, transactions)
  notify_email text,                          -- where answers are emailed
  active      boolean not null default true,
  owner_id    uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

create table if not exists public.workpaper_answers (
  id          uuid primary key default gen_random_uuid(),
  link_id     uuid not null references public.workpaper_links(id) on delete cascade,
  item_key    text not null,
  answer      text not null check (length(answer) between 1 and 5000),
  answered_by text,
  created_at  timestamptz not null default now()
);
create index if not exists workpaper_answers_link_idx on public.workpaper_answers(link_id, created_at);

alter table public.workpaper_links   enable row level security;
alter table public.workpaper_answers enable row level security;

drop policy if exists workpaper_links_owner on public.workpaper_links;
create policy workpaper_links_owner on public.workpaper_links
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists workpaper_answers_owner on public.workpaper_answers;
create policy workpaper_answers_owner on public.workpaper_answers
  for select to authenticated using (exists (select 1 from public.workpaper_links l where l.id = link_id and l.owner_id = auth.uid()));

-- Read a workpaper by token (anon). Returns nothing for an unknown or inactive token.
create or replace function public.get_workpaper_by_token(p_slug text, p_token text)
returns table (title text, client_name text, payload jsonb, answers jsonb, created_at timestamptz)
language sql security definer set search_path = public stable as $$
  select l.title, l.client_name, l.payload,
         coalesce((select jsonb_agg(jsonb_build_object('item_key', a.item_key, 'answer', a.answer, 'answered_by', a.answered_by, 'created_at', a.created_at) order by a.created_at)
                   from public.workpaper_answers a where a.link_id = l.id), '[]'::jsonb),
         l.created_at
  from public.workpaper_links l
  where l.token = p_token and l.slug = p_slug and l.active
$$;

-- Save an answer by token (anon). Rejects unknown tokens and item keys not in the payload.
create or replace function public.submit_workpaper_answer(p_slug text, p_token text, p_item_key text, p_answer text, p_answered_by text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_link public.workpaper_links; v_id uuid;
begin
  select * into v_link from public.workpaper_links where token = p_token and slug = p_slug and active;
  if not found then raise exception 'Link not found'; end if;
  if not exists (select 1 from jsonb_array_elements(v_link.payload->'open_items') i where i->>'key' = p_item_key) then
    raise exception 'Unknown item';
  end if;
  if coalesce(length(trim(p_answer)), 0) = 0 then raise exception 'Answer is empty'; end if;
  insert into public.workpaper_answers (link_id, item_key, answer, answered_by)
  values (v_link.id, p_item_key, left(trim(p_answer), 5000), nullif(left(trim(coalesce(p_answered_by, '')), 120), ''))
  returning id into v_id;
  return v_id;
end $$;

revoke all on function public.get_workpaper_by_token(text, text) from public;
revoke all on function public.submit_workpaper_answer(text, text, text, text, text) from public;
grant execute on function public.get_workpaper_by_token(text, text) to anon, authenticated;
grant execute on function public.submit_workpaper_answer(text, text, text, text, text) to anon, authenticated;
