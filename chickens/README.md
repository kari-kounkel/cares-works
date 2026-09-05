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

`images/cover-front.jpg` is the May 2024 torn-paper collage from Drive
(`BOOK COVER chasing chickens.png`, 1410x2250), resized to 900px wide and
saved as progressive JPEG.

**It is a stand-in, not the cover.** Kari cleared it for use on the page
and does not like it. Expect it to be replaced before launch.

Because of that, the page does not depend on it:

- The palette (barn blue, kraft, rooster rust, straw) is defined as CSS
  variables at the top of `index.html` and reads as a farmyard on its own.
  It was drawn from this art but is not married to it.
- It is the Open Graph share image, so whatever replaces it is what shows
  up when the link is pasted anywhere.

To swap: drop a new file at the same path, keep it around 900px wide, and
update `width`/`height` on the hero `<img>` if the aspect ratio changes.
Nothing else has to move.

## Still to wire

- Pre-order / buy link — the "When It Hatches" section currently points at
  Substack because no retail link exists yet
- Google Analytics — ladybug carries `G-T1PLCXES2Y`; add a property for this
  domain if you want it tracked separately
- Chapter excerpts, once Act One is drafted far enough to show
- **Final cover art** — the current image is a stand-in Kari doesn't like

## The signup list

The "Be in the yard" form writes to **`public.chickens_signups`** in the
**kkstore** Supabase project (`lheytkgixafdhluuvrbg`) — the same project
ladybug uses, not a new one.

| Column | Notes |
|---|---|
| `email` | required, unique case-insensitively |
| `name`, `chasing` | optional; `chasing` is the "what are you chasing?" box |
| `consent` | set true by the form's checkbox |
| `source` | defaults to `chickens.karikounkel.com` |
| `status` | defaults to `new` |
| `created_at`, `user_agent`, `ip_hash` | `ip_hash` is unused so far |

**Security shape.** RLS is on with exactly one policy: insert, for `anon`
and `authenticated`, with length and format checks on the input. There is
no select, update, or delete policy, so the publishable key shipped in
`index.html` can add a row and can never read the list back. That is why
it is safe in a public file. Read the list from the Supabase dashboard or
with the service role.

Verified server-side: an insert as the `anon` role succeeds, a select as
`anon` returns 0 rows, and a duplicate email raises `unique_violation`
(which the form turns into "you're already on the list"). The database
linter reports no advisories against this table.

**Not verified from the build sandbox:** the browser-to-Supabase request
itself — outbound `supabase.co` is blocked here. Submit the form once
after the first deploy. If it errors, the likely cause is the newer
`sb_publishable_...` key format; swapping `SUPABASE_KEY` in `index.html`
for the project's legacy `anon` JWT is the one-line fix.

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
| Part Two is *The Book of Kari: Truth from a Wanderer Who Finally Sat Down* — Luke-styled, 13 parables, "Chicken Scratchings" | Gospel-of-Kari summary chat, 2025-07-13 |
| Kari 0:1-5 and Kari 2 verbatim, and "She did not chase the chickens. She became one." | Same chat, the master gospel document |

Names of other private individuals from the outline are deliberately kept
off the public page.

Two edits made on Kari's say-so, not from the source material:

- The Aunt Gwen excerpt originally listed things Gwen did all day and said she
  "still had lipstick on straight." Kari says her aunt didn't wear lipstick,
  and that the real memory is not an inventory at all: "Gwen was just amazing
  in my little girl mind." The paragraph now says that instead of manufacturing
  detail. Don't reintroduce specifics about Gwen without asking.
- **Kari 2:2** ("Blessed are the relapse repeaters, for their forgiveness shall
  run thirteen layers deep") was briefly held off the page. Kari put it back:
  if it isn't in the gospel yet, it should be. The full run `Kari 2:1-6` is
  on the page.

There is no separate website for Part Two, and the page does not imply one.
