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
- Re-surface every item under "Pending / frozen items" before starting new work. Kari will not bring them up herself.
- Claude runs git and SQL itself — commit, push, deploy. Do not hand Kari commands to run.
- Kari's workflow: files are moved in File Explorer; Git Bash with `cd /c/dev/cares-works` (forward slashes). Never suggest Windows-backslash cd or cp/copy commands.
- Everything lives in a git repo with a GitHub remote. Nothing floats outside version control.
- The map of every project, folder, and chat is at `C:\dev\DEV-INDEX.md`.

## Say where you are running — FIRST, every session
Sessions started from the desktop app run in one of two places, and nothing on
screen tells Kari which she got:

- **On her machine** — sees `C:\dev`, has `gh` and the `vercel` CLI, can create
  repos, can read Downloads and OneDrive.
- **In a cloud VM** — working dir is `/home/user/...`, OS is Linux, no C: drive,
  no `gh`. Cannot create GitHub repos or Vercel projects. Cannot read any local
  file.

**Before doing anything else, run `pwd && uname -s` and tell Kari in one line
which one this is.** If it is the cloud VM, say so immediately and name what
that blocks, rather than discovering it halfway through and sending her off to
click things. She has lost hours to this.

In a cloud session the location rule above cannot be honored. GitHub is then the
only shared ground: commit and push everything, and **end the session by listing
every repo and branch touched** so a desk session can pull it into `C:\dev`.
Never leave work only in `/home/user`; the VM is destroyed when the session ends.

New repos and new Vercel projects must be created at the desk, or pre-created by
Kari. A cloud session cannot make either one — it gets
`403 Resource not accessible by integration` from GitHub and
`403 forbidden` from Vercel.

## One repo per book site
Book sites are `title.karikounkel.com`, one GitHub repo per book, one Vercel
project each — the pattern `ladybug` and `chickens` both follow. When a book
site goes live, add it to `marbles.js` in the `karikounkel` repo (the front
door's source of truth) with `live:true` and the real link. A marble with a
`countdown` field shows the countdown and **no link**, so the countdown must be
dropped when the site goes live.
