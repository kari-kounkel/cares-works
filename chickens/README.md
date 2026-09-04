# Chasing Chickens

Landing page for *Chasing Chickens: Through the Clucking Chaos* (Fast Camel Press).

Static site. Built to mirror `kari-kounkel/ladybug` — plain HTML, no build step,
Fraunces + Mulish, one countdown in the hero. Deploys to
https://chickens.karikounkel.com.

## Deploying

This folder is self-contained. Two ways to ship it:

**A. New Vercel project off this subdirectory** (nothing else moves)
1. Vercel → New Project → import `kari-kounkel/cares-works`
2. Root Directory: `chickens`
3. Framework Preset: Other (no build command, no output directory)
4. Domains → add `chickens.karikounkel.com`

**B. Its own repo, exactly like ladybug** (cleaner long-term)
1. Create `kari-kounkel/chickens`
2. Copy the contents of this folder to its root
3. Point a Vercel project at it and add the domain

## Edit the launch date

`index.html`, in the script block near the bottom:

```js
const LAUNCH_DATE  = "2026-10-28T09:00:00";
```

The two October cards read their own targets from markup instead —
`data-target` on each `.oct` in the "Two Octobers" section.

## The cover

`images/cover-front.jpg` is the **May 2024 collage comp** pulled from Drive
(`BOOK COVER chasing chickens.png`), resized to 900px wide. It is not a
finished cover. Drop the real art in at the same path and delete the
`.cover-note` line in the hero when it's final.

## Still to wire

- Pre-order / buy link — the "When It Hatches" section currently points at
  Substack because no retail link exists yet
- Notify-me email capture (ladybug uses a Supabase table + `/api` route;
  same pattern would work here)
- Google Analytics — ladybug carries `G-T1PLCXES2Y`; add a property for this
  domain if you want it tracked separately
- Chapter excerpts, once Act One is drafted far enough to show

## Facts the page asserts

Everything on the page traces to your own material, not invention:

| Claim | Source |
|---|---|
| Launch 10/28/2026 | `_MANIFEST.md`, Chasing-Chickens Arkive |
| Sobriety 10/1/2021 | Standing personal marker |
| Teen Challenge intake 10/26/2020, 366 days, graduation 10/28/2021 | Chapter-outline chat, 2026-01-14 |
| Three-act structure | Same chat — you rejected the five-act version |
| 1997 Monticello bus crash; 35 years in transportation | Same chat |
| Exodus 14:14 as life verse | Same chat |
| "The First Chicken" excerpt | Origin-story chat, 2025-05-31, your draft text |

Names of other private individuals from the outline are deliberately kept
off the public page.
