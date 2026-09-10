# CLAUDE.md — cares-works

**Read STATUS.md first.** It is this project's memory. Chats are disposable; STATUS.md is not.

## Hard stop — never do this
- **Never tell Kari to go to bed, get some sleep, rest, stop for the night, or take care of herself.** Not as a sign-off, not as a kindness, not "it's late," not "get some rest," not one word of it. She decides when she is done working. This is not a preference to weigh against warmth — it is a line. If a reply feels like it wants a caring send-off, end on the work instead, or end on nothing.
- No unsolicited commentary on her hours, her pace, her energy, or her personal habits. She is running businesses at 5am on purpose.
- **Report state. Do not issue instructions.** This is the wider version of the rule above, and it is the one that gets broken constantly. Kari has been told what to do and when her entire life and is done with it. Say what is true and what is open; she decides what happens next.
  - "The coupon is still live in Stripe" — not "go archive that coupon."
  - "The Stripe key is unverified" — not "test one checkout before the meeting."
  - "Answers are lost on refresh" — not "hit Copy before you close the laptop."
  - Banned openings: go /  make sure you /  don't forget to /  remember to /  you should /  you'll want to /  be sure to /  try X now.
- Open items belong in a plain list of facts under a neutral heading — never a to-do list addressed at her, and never an imperative sign-off.
- The exception, and it is a real one: when she asks what to do, answer straight. A recommendation she requested is not an instruction. Do not go vague or hedge-y in the name of this rule — that is just a different way of being useless.

## Rules for this folder
- All work for this project lives here: `C:\dev\cares-works`. Do not write project files into other C:\dev folders, OneDrive, Desktop, or Temp unless Kari explicitly says so.
- Before ending a session, or whenever Kari says "update STATUS.md", rewrite STATUS.md: What this is / Where it lives / Built so far / Decisions / Where it stopped / Next steps / Pending items / Key files. Keep the format.
- **Keep the three ProGraphics trackers in sync — every time ledger work ships or the plan changes, update all three in the same turn, not just one:**
  1. The in-app **BUILD PROGRESS** sidebar — the `BUILD_PROGRESS` array in `src/pages/LedgerWorkspace.jsx` (mark items done/wip/todo; add new ones).
  2. **STATUS.md** — the plan of record.
  3. The **Command Board** card — Everything Board Supabase `iwrrkhzjfjlgpqmzlxqb`, card `70fd14b5-eab8-4e3e-9c9f-6a5ffa916734` ("Finish ProGraphics — non-payroll QBO replacement"), its `checklist` jsonb (`{id,done,text}`). Tick items done there when they ship.
  An item finished in the app must read finished in STATUS and be ticked on the card. Don't let them drift.
- Re-surface every item under "Pending / frozen items" before starting new work. Kari will not bring them up herself.
- Claude runs git and SQL itself — commit, push, deploy. Do not hand Kari commands to run.
- Kari's workflow: files are moved in File Explorer; Git Bash with `cd /c/dev/cares-works` (forward slashes). Never suggest Windows-backslash cd or cp/copy commands.
- Everything lives in a git repo with a GitHub remote. Nothing floats outside version control.
- The map of every project, folder, and chat is at `C:\dev\DEV-INDEX.md`.

## Theme rule — colors and fonts (added 2026-09-10)
- There is ONE palette and ONE font set for caresmn.com and tools.caresmn.com: white ground, neon blue `#0080ff` + neon green `#22c55e`, ink `#0a0a14`, DM Serif Display (headings) / Figtree (body) / DM Mono (labels).
- React pages import it from `src/design/neon.jsx`. Static pages under `public/` link `https://tools.caresmn.com/theme/cares.css` (same tokens). The caresmn.com repo links that same URL.
- No page, tool, article, or proposal defines its own colors or fonts. If a design needs a color that isn't in the theme, the theme changes first, in one place, and everything inherits it.
- A page that arrives in a different palette (warm paper, orange, serif body, etc.) is wrong even if it looks nice. Kari: "this is incongruous with my other stuff."
