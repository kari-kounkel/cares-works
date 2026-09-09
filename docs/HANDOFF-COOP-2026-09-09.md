# HANDOFF — The Coop (tools.caresmn.com/chickens)
_From Nate (Cowork), 2026-09-09. For Ernie (Claude Code) in `C:\dev\cares-works`._

## What this is
Kari's private working draft of the memoir *Chasing Chickens*: 66 chapters in six movements, her verbatim passages, editable questions with answer boxes, a draft box and notes per chapter, an editable timeline, and a plan tab. It replaces the claude.ai artifact "The Coop" so it lives on her own stack. She writes on it from anywhere; nothing on it is public.

## Already done (Nate)
- `src/pages/Coop.jsx` — the page (React, uses `supabaseClient`; autosaves with 800 ms debounce; loads `/chickens/coop-data.json`).
- `public/chickens/coop-data.json` — static content (544 KB): movements → chapters → passages/questions, plus seed timeline. Generated from `C:\CLAUDE\archive\projects\Chasing-Chickens\` — regenerate there, never hand-edit.
- `sql/coop.sql` — tables `coop_chapters(user_id, id, data jsonb)` and `coop_docs(user_id, id∈{timeline,plan}, data jsonb)`, RLS `user_id = auth.uid()`, authenticated only. **Already applied** to cares-works Supabase `qcikhcnclduakriextsz` as migration `coop_chasing_chickens_workroom`.
- `src/App.jsx` — import + route `/chickens` (session-gated, same pattern as `/board`), inserted just above the Command Board block.
- `npx vite build` passes (built from the Linux mount, 1m30s).

## Left for Ernie (from Git Bash on Windows — the Linux mount shows every file as modified because of CRLF, so do NOT commit from there)
1. `cd /c/dev/cares-works && git status` — expect exactly four changes: `src/App.jsx` (M), `src/pages/Coop.jsx` (new), `sql/coop.sql` (new), `public/chickens/coop-data.json` (new), plus this file.
2. Commit + push. Vercel deploys on push.
3. Open `https://tools.caresmn.com/chickens` logged in as Kari; type one answer; confirm the header says "saved <time>" and the row appears in `coop_chapters`.
4. STATUS.md: add The Coop under "Built so far" with the table names and this file's path. DEV-INDEX: no new folder, it lives in cares-works.

## Notes
- The `vercel.json` rewrite already sends `/chickens` to `index.html`; `/chickens/coop-data.json` is a real file in `public/` and is served as-is.
- Migration from the artifact: Kari had made no edits on the artifact version as of 2026-09-09, so there is nothing to carry over. If that changes, Nate can read the artifact db and Ernie can insert rows.
- No anon access to either table by design. The publishable key in the client cannot read or write them without a session.
