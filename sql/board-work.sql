-- ============================================================
-- Command Board — board_work
-- Project: cares-works Supabase (qcikhcnclduakriextsz)
--
-- One table for work items pulled in from the other places Kari's work was
-- living, so the Command Board stops being a page that shows a calendar and
-- no to-do list:
--
--   source='everything' — the Everything Board (everything.karikounkel.com,
--                         its own Supabase iwrrkhzjfjlgpqmzlxqb). 108 cards.
--   source='rollout'    — the Monday 7AM Rollout Tracker, whose items were a
--                         JS array inside cockpit HTML, not rows anywhere.
--
-- The One List deliberately does NOT live here. It is still read straight from
-- src/cockpits/the_one_list.html with ticks in kari_tool_data — copying it in
-- would make a second copy of 65 items that drifts the moment either is edited.
--
-- (user_id, source, source_id) is unique, so re-running an import updates in
-- place rather than duplicating.
-- ============================================================

create table if not exists public.board_work (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,

  source             text not null check (source in ('everything', 'rollout')),
  source_id          text not null,          -- card_id, or the rollout item's id

  title              text not null,
  detail             text,

  -- Everything Board: bucket = list (focus/inprogress/urgent/brainstorm/complete),
  --                   tab = its tab (projects/business/writing/…).
  -- Rollout:          bucket = day (Thu/Fri/…), tab = track (A/B/D).
  bucket             text,
  tab                text,
  owner              text,                   -- rollout only: kari/ernie/frank/cowork
  effort             text,                   -- rollout only: "30 min", "2 hr"

  tags               jsonb not null default '[]'::jsonb,   -- labels: onice, inprog, needsinput
  projects           jsonb not null default '[]'::jsonb,   -- universe NAMES, resolved on import
  due_date           date,
  checklist          jsonb not null default '[]'::jsonb,
  links              jsonb not null default '[]'::jsonb,

  done               boolean not null default false,
  done_at            timestamptz,

  source_created_at  timestamptz,
  source_moved_at    timestamptz,
  imported_at        timestamptz not null default now(),

  unique (user_id, source, source_id)
);

alter table public.board_work enable row level security;

drop policy if exists board_work_select on public.board_work;
create policy board_work_select on public.board_work
  for select using (auth.uid() = user_id);

drop policy if exists board_work_insert on public.board_work;
create policy board_work_insert on public.board_work
  for insert with check (auth.uid() = user_id);

drop policy if exists board_work_update on public.board_work;
create policy board_work_update on public.board_work
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists board_work_delete on public.board_work;
create policy board_work_delete on public.board_work
  for delete using (auth.uid() = user_id);

create index if not exists board_work_user_idx
  on public.board_work (user_id, done, source, bucket);

-- ------------------------------------------------------------------
-- Items created on the Command Board itself have no upstream source.
-- Without this the check constraint rejects anything Kari adds here,
-- which would make the board a read-only mirror of two places she has
-- stopped using.
-- ------------------------------------------------------------------
alter table public.board_work drop constraint if exists board_work_source_check;
alter table public.board_work add constraint board_work_source_check
  check (source in ('everything', 'rollout', 'board'));
