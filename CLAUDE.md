# CLAUDE.md — cares-works

**Read STATUS.md first.** It is this project's memory. Chats are disposable; STATUS.md is not.

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
