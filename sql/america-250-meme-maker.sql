-- ============================================================
-- America 250 Meme Maker — DB setup for tools.caresmn.com
-- Run this in the cares-works Supabase project (qcikhcnclduakriextsz)
-- before relying on MEMBER cloud-save. Until it's run, the tool
-- still works in free/browser-save mode (the code feature-detects).
-- ============================================================

-- 1) Per-user saved meme sets (mirrors user_checklists / steward_boards)
create table if not exists public.meme_projects (
  id          text primary key,
  user_email  text not null,
  name        text,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.meme_projects enable row level security;

-- Owner-scoped policies (email comes from the signed-in JWT)
drop policy if exists meme_projects_select on public.meme_projects;
create policy meme_projects_select on public.meme_projects
  for select using ((auth.jwt() ->> 'email') = user_email);

drop policy if exists meme_projects_insert on public.meme_projects;
create policy meme_projects_insert on public.meme_projects
  for insert with check ((auth.jwt() ->> 'email') = user_email);

drop policy if exists meme_projects_update on public.meme_projects;
create policy meme_projects_update on public.meme_projects
  for update using ((auth.jwt() ->> 'email') = user_email)
  with check ((auth.jwt() ->> 'email') = user_email);

drop policy if exists meme_projects_delete on public.meme_projects;
create policy meme_projects_delete on public.meme_projects
  for delete using ((auth.jwt() ->> 'email') = user_email);

create index if not exists meme_projects_user_idx on public.meme_projects (user_email, updated_at desc);

-- 2) Register the tool in the library catalog (public.tools)
--    tier 'free' = free to USE (email/sign-in still required to enter),
--    cloud-save is the member perk.
insert into public.tools (title, category, slug, description, why_use, icon, tier, is_free, tag, href, sort_order, is_published)
values (
  'America 250 Meme Maker',
  'Marketing',
  'america-250-meme-maker',
  'Make branded, vintage-Americana social posts for the Semiquincentennial. Drop in your image, type your message, brand it with your logo and colors, download a 1080×1080 post. Members get 13 reusable card slots saved to the cloud.',
  'Ride the 250th with posts that look intentional, not slapped together — and grow a list while you do it.',
  '🇺🇸',
  'free',
  true,
  'NEW',
  '/tools/america-250-meme-maker',
  5,
  true
)
on conflict do nothing;
