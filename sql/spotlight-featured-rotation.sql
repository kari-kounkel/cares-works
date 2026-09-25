-- spotlight_current.is_pinned
--
-- The dashboard hero used to read this single row verbatim and call it a
-- "NEW DROP". Nobody edited it, so the new drop stopped being new (it sat on
-- The Vendor Decoder from 2026-07-09 until 2026-09-04). The hero now rotates
-- itself: one published tool per week, deterministic, turning over on Mondays.
--
-- Set is_pinned = true to take the wheel and feature something by hand.
-- Set it back to false to hand the wheel back to the rotation.

alter table public.spotlight_current
  add column if not exists is_pinned boolean not null default false;

comment on column public.spotlight_current.is_pinned is
  'When true, this row overrides the automatic weekly featured-tool rotation on the dashboard hero. When false (default), the hero rotates through published tools one per week.';

-- Pin a hand-picked feature:
--   update public.spotlight_current
--      set is_pinned = true,
--          eyebrow   = 'FEATURED TOOL',
--          item_name = 'The Vendor Decoder',
--          item_pitch= '…',
--          cta_label = 'Open the Vendor Decoder',
--          cta_href  = '/tools/vendor-decoder'
--    where id = 1;
