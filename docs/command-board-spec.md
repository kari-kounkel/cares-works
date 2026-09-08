# Command Board — build spec (hand-off from Cowork, Sept 8 2026)

## The one-sentence mission
Kari logs into tools.caresmn.com, and under her own logged-in home there is a card
called **Command Board** that opens **https://tools.caresmn.com/board** — a live page
showing her week, her unread Gmail, who owes money, and countdown milestones,
refreshing itself. No obscure URLs. She finds it the way she finds everything else.

## Definition of done (all four, no partial credit)
1. `tools.caresmn.com/board` renders the four panels with Kari's real data.
2. A visible **Command Board card/link on the page Kari lands on after login**
   (the /kari cockpit hub — same login gate as Standing Orders), so she never
   has to remember the URL.
3. Panels refresh on a timer (calendar/mail ~5 min, A/R ~15 min) and fail
   independently — one dead feed never blanks the page.
4. STATUS.md updated with what shipped, what's pending, and where secrets live.

## Origin
This is the "Mustard Board" — a live dashboard built as a Claude artifact in a
Cowork chat (calendar + unread inbox + milestones). It works but lives inside
claude.ai and borrows Claude's connectors, so it cannot be hosted here as-is.
This build recreates it natively with our own OAuth. Kari-first; the data model
must already support multi-client later (one row per user per provider).

## The four panels
| Panel | Source | Notes |
|---|---|---|
| Week Ahead | Google Calendar API, scope `calendar.readonly` | 7 days, all-day + timed events, "now" marker, links to the event in Google Calendar. Times in viewer's local zone. |
| Still Unread | Gmail API, scope `gmail.readonly` | Unread INBOX threads: sender, subject, snippet, relative date, "over a week" flag, deep link `https://mail.google.com/mail/u/0/#inbox/<threadId>`. Tiles: unread count / over-a-week count / arrived today. |
| Who Owes You | QuickBooks Online, A/R Aging Summary report | Tiles: open A/R, current, past due. Aging buckets bar (Current/1-30/31-60/61-90/91+), top overdue customers, flag negative buckets as unapplied credits. NOTE: Kari's QBO OAuth will land on whichever company she picks at consent — she has access to PRO GRAPHICS ENTERPRISES; ask her which company this panel should show before wiring. |
| Milestones | our DB | Editable label + date rows, whole-day countdowns. Seed with: Minuteman Press exit Oct 15 2026, Chasing Chickens launch Oct 28 2026. Whole-calendar-day math (see the floridagirl countdown lesson in STATUS.md — no ms rounding). |

## Architecture (all decided — don't relitigate, do flag real blockers)
- **Where:** this repo. Route `/board` in `src/App.jsx` manual routing; page lives as a
  cockpit (`src/cockpits/` pattern) or `src/pages/CommandBoard.jsx` — builder's choice.
  Behind the same login/gate as `/kari`.
- **Design:** `src/design/neon.jsx` (palette `N`) — white cards, neon outlines,
  blue #0080ff / green #22c55e washes. NO dark backgrounds, no slate/orange/cream.
- **Supabase:** existing project `qcikhcnclduakriextsz`. New tables via a migration
  file FIRST (repo `sql/` convention), RLS on:
  - `board_connections` (id, user_id, provider 'google'|'qbo', refresh_token
    encrypted or in Vault, access_token+expiry cache, scopes, realm_id for QBO,
    created/updated). One row per user per provider. Browser NEVER sees tokens.
  - `board_milestones` (id, user_id, label, due_date, sort, created).
- **API routes** (Vercel `api/` pattern, like `api/floridagirl-deposit.js`):
  - `api/board/google-auth.js` + callback — OAuth code flow, offline access, store refresh token
  - `api/board/qbo-auth.js` + callback — Intuit OAuth2, store refresh token + realmId
  - `api/board/calendar.js`, `api/board/mail.js`, `api/board/ar.js` — refresh the
    token, call the provider, return ONLY what the panel renders (trim hard)
  - Auth on every route: same session check the /kari gate uses.
- **Client:** page fetches those routes on timers; each panel has loading /
  error / "reconnect Google|QuickBooks" states with a connect button; a small
  "as of h:mm" stamp per panel.
- **Env vars (Vercel + local .env):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, `QBO_ENV`, `BOARD_TOKEN_KEY` (encryption),
  service-role key already available to api/ per existing pattern.

## Third-party setup (walk Kari through the minimal clicks; do everything else)
- **Google Cloud:** one project, OAuth consent screen **Testing** mode (publishing
  can wait — Testing works day one), Kari (kari@karikounkel.com) as test user,
  scopes calendar.readonly + gmail.readonly, redirect URI
  `https://tools.caresmn.com/api/board/google-callback` (+ localhost for dev).
  App name on the consent screen: **Command Board** unless Kari renames it.
  Known cost of Testing mode: refresh tokens expire after ~7 days — acceptable
  for v1; page shows its "reconnect Google" state when that happens. Publishing
  to production (calendar-only verification is light; Gmail triggers the heavy
  restricted-scope review) is a LATER decision, for the client edition.
- **Intuit developer:** one app, OAuth2, same-style redirect
  `https://tools.caresmn.com/api/board/qbo-callback`. Production keys work for
  Kari's own use once the app exists; org approval questionnaire only matters
  for the client edition.

## Later (out of scope now, but the data model must not fight it)
Client edition = same page, each client connects their own Google/QBO.
Ships Calendar + QBO + Milestones only (Gmail's restricted-scope CASA
assessment is not worth it until a paying client). Pricing undecided.

## House rules that apply (CLAUDE.md governs)
Branch first — the worktree had uncommitted edits + was 8 behind origin on 9/8;
settle that before building. Migration before code. Claude runs git/SQL itself.
Ships-on-everything checklist: ASK widget + CARES IP footer on the page;
analytics/SMS provider names — confirm exact names with Kari before wiring.
Update STATUS.md at the end. Report state to Kari; no instructions at her.

## Consolidation (added 9/8 — this is part of the job, not optional)
One home for everything: tools.caresmn.com. claude.ai artifacts are drafting
tables only; nothing lives there permanently.
1. ALSO in this build: rewire Standing Orders' two live sections (asset ledger,
   "caught in the wild") from claude.use(db) to our Supabase (qcikhcnclduakriextsz,
   new tables, RLS) so the /kari copy is the ONE live copy.
2. When /board is live: Kari's "Mustard Board" claude.ai artifact is retired.
3. The spec artifacts on claude.ai are already superseded by THIS file.
End state: everything Kari uses is behind /kari on her own site. Zero live
pages left on claude.ai.
