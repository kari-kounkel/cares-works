-- ============================================================
-- Command Board — DB setup for tools.caresmn.com/board
-- Project: cares-works Supabase (qcikhcnclduakriextsz)
--
-- Two tables:
--   board_connections — OAuth refresh/access tokens per user per provider.
--                       The browser NEVER reads this. RLS is on with NO
--                       policies, so anon/authenticated get nothing; only the
--                       service-role key (api/board/*) can touch it.
--   board_milestones  — editable countdown rows. Owner-scoped RLS, edited
--                       straight from the page via supabase-js, same as
--                       kari_cockpits.
--
-- Multi-client from day one: everything is keyed (user_id, provider), so a
-- second user connecting their own Google/QBO is a new row, not a new table.
-- ============================================================

-- 1) OAuth connections -------------------------------------------------------
create table if not exists public.board_connections (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  provider           text not null check (provider in ('google', 'qbo')),

  -- Both token columns hold AES-256-GCM ciphertext produced by api/board/_lib.js
  -- using BOARD_TOKEN_KEY. Format: v1:<iv_b64>:<tag_b64>:<ciphertext_b64>.
  -- Nothing here is ever readable as plaintext at rest or over the wire.
  refresh_token_enc  text not null,
  access_token_enc   text,
  access_expires_at  timestamptz,

  scopes             text,
  realm_id           text,          -- QBO company id; null for google
  last_error         text,          -- last refresh failure, drives "reconnect" state
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  unique (user_id, provider)
);

alter table public.board_connections enable row level security;

-- Deliberately NO policies. RLS-on + no-policy = deny for anon and
-- authenticated. api/board/* uses the service-role key, which bypasses RLS.
-- If you ever add a policy here, you have handed tokens to the browser.
drop policy if exists board_connections_no_client_access on public.board_connections;

-- 2) Milestones --------------------------------------------------------------
create table if not exists public.board_milestones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null,
  -- A date, not a timestamp: the countdown is whole calendar days. Storing a
  -- timestamp is what produces "8 days left" on a 7-day window.
  due_date    date not null,
  sort        integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.board_milestones enable row level security;

drop policy if exists board_milestones_select on public.board_milestones;
create policy board_milestones_select on public.board_milestones
  for select using (auth.uid() = user_id);

drop policy if exists board_milestones_insert on public.board_milestones;
create policy board_milestones_insert on public.board_milestones
  for insert with check (auth.uid() = user_id);

drop policy if exists board_milestones_update on public.board_milestones;
create policy board_milestones_update on public.board_milestones
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists board_milestones_delete on public.board_milestones;
create policy board_milestones_delete on public.board_milestones
  for delete using (auth.uid() = user_id);

create index if not exists board_milestones_user_idx
  on public.board_milestones (user_id, sort, due_date);
