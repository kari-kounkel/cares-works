-- ============================================================
-- Command Board — board_properties  ("where am I at?")
-- Project: cares-works Supabase (qcikhcnclduakriextsz)
--
-- One row per web property Kari owns, and one column's worth of truth about
-- whether it meets the house baseline. The fourteen rows are seeded from the
-- asset ledger already written into docs/standing-orders.html.
--
-- Two kinds of check, kept apart on purpose:
--
--   probe  — measured. api/board/data.js?panel=kingdom fetches each host and
--            records what it can actually see: does it answer, is there an
--            analytics tag, is the ASK widget on it, does it have a title and
--            a favicon. Overwritten by every scan; never hand-edited.
--   checks — declared. The things no fetch can tell you (does sign-in work,
--            does password reset work, is transactional email wired to the
--            hub, can it take money). Kari ticks these; a scan never touches
--            them.
--
-- Mixing the two would be the whole point missed: a green square has to mean
-- either "we looked" or "she said so", never an unmarked blend of both.
-- ============================================================

create table if not exists public.board_properties (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,

  host        text not null,          -- tools.caresmn.com
  label       text,                   -- the repo/project it comes from
  backend     text,                   -- which Supabase, if any
  status      text,                   -- live / dormant / stale / can't take money
  sort        integer not null default 0,

  checks      jsonb not null default '{}'::jsonb,   -- declared, Kari's
  probe       jsonb not null default '{}'::jsonb,   -- measured, the scanner's
  probed_at   timestamptz,
  notes       text,

  created_at  timestamptz not null default now(),
  unique (user_id, host)
);

alter table public.board_properties enable row level security;

drop policy if exists board_properties_select on public.board_properties;
create policy board_properties_select on public.board_properties
  for select using (auth.uid() = user_id);

drop policy if exists board_properties_insert on public.board_properties;
create policy board_properties_insert on public.board_properties
  for insert with check (auth.uid() = user_id);

drop policy if exists board_properties_update on public.board_properties;
create policy board_properties_update on public.board_properties
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists board_properties_delete on public.board_properties;
create policy board_properties_delete on public.board_properties
  for delete using (auth.uid() = user_id);

create index if not exists board_properties_user_idx
  on public.board_properties (user_id, sort);
