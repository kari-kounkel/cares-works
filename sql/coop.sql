-- The Coop — Chasing Chickens working draft (tools.caresmn.com/chickens)
-- Two tables, both private to the logged-in user via RLS. Additive only; nothing else touched.

create table if not exists public.coop_chapters (
  id          text        not null,               -- chapter id from coop-data.json, e.g. 'rebuild-2'
  user_id     uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  data        jsonb       not null,               -- {title, questions:[{q,a}], draft, notes, status}
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.coop_docs (
  id          text        not null,               -- 'timeline' | 'plan'
  user_id     uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  data        jsonb       not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.coop_chapters enable row level security;
alter table public.coop_docs     enable row level security;

drop policy if exists coop_chapters_own on public.coop_chapters;
create policy coop_chapters_own on public.coop_chapters
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists coop_docs_own on public.coop_docs;
create policy coop_docs_own on public.coop_docs
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- No anon access at all. Nothing on this table is ever public.
