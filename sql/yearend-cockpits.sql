-- Year-end cockpit links: a tokenized page (tools.caresmn.com/year-end/<token>) whose
-- statuses / notes / adjustments / schedule edits are shared by everyone with the link.
-- Same shape as workpapers.sql: public-by-token, table never readable by anon directly,
-- reads and saves go through SECURITY DEFINER functions that take the token.
-- Applied to cares-works Supabase (qcikhcnclduakriextsz) 2026-09-21 as migration yearend_cockpits.
-- Static page + docs live under public/year-end/<token>/ (excluded from the SPA rewrite in vercel.json).

create table if not exists public.yearend_cockpits (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique,
  title       text not null,
  client_name text,
  state       jsonb not null default '{"rows":{}}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  text,
  active      boolean not null default true,
  owner_id    uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

alter table public.yearend_cockpits enable row level security;

drop policy if exists yearend_cockpits_owner on public.yearend_cockpits;
create policy yearend_cockpits_owner on public.yearend_cockpits
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Read shared state by token (anon). Nothing for an unknown or inactive token.
create or replace function public.get_yearend_cockpit(p_token text)
returns table (title text, client_name text, state jsonb, updated_at timestamptz, updated_by text)
language sql security definer set search_path = public stable as $$
  select c.title, c.client_name, c.state, c.updated_at, c.updated_by
  from public.yearend_cockpits c
  where c.token = p_token and c.active
$$;

-- Save shared state by token (anon). Whole-document replace; returns the new updated_at.
create or replace function public.save_yearend_cockpit(p_token text, p_state jsonb, p_updated_by text)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare v_ts timestamptz;
begin
  if p_state is null or jsonb_typeof(p_state) <> 'object' then raise exception 'Bad state'; end if;
  if pg_column_size(p_state) > 2000000 then raise exception 'State too large'; end if;
  update public.yearend_cockpits
     set state = p_state, updated_at = now(), updated_by = nullif(left(trim(coalesce(p_updated_by,'')),120),'')
   where token = p_token and active
   returning updated_at into v_ts;
  if v_ts is null then raise exception 'Link not found'; end if;
  return v_ts;
end $$;

revoke all on function public.get_yearend_cockpit(text) from public;
revoke all on function public.save_yearend_cockpit(text, jsonb, text) from public;
grant execute on function public.get_yearend_cockpit(text) to anon, authenticated;
grant execute on function public.save_yearend_cockpit(text, jsonb, text) to anon, authenticated;

-- Links in use:
--   iaz-fy2025-k7m3q9  IAZ Year-End Cockpit (I A Z Corporation dba Minuteman Press Uptown), owner Kari
--   To retire a link: update public.yearend_cockpits set active = false where token = '<token>';
