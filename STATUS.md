# cares-works — STATUS
_Rebuilt from chat transcripts on 2026-08-25. Update this file at the end of every work session ("update STATUS.md")._

## What this folder is
`C:\dev\cares-works` is the Vite + React 18 app behind CARES Works (`tools.caresmn.com`), Kari's multi-tenant SaaS of bookkeeping/admin tools, plus everything static served out of its `public/` folder. It holds four client sub-projects: the ProGraphics ledger (QuickBooks replacement for Dave & Betty Erickson), the Minuteman Press Uptown website + union-shop site + proposals, the CARES Works product itself (design system, pricing, org workspaces, River of Life facility rentals, COA Library, proposals), and the New Life in Christ (Pastor David) sample site + org workspace. All data lives in one Supabase project; routing is manual `window.location.pathname` in `src/App.jsx`.

## Where it lives
- Live site: `https://tools.caresmn.com` (CARES Works). Tenant routes seen in chat: `/prographics`, `/emerson`, `/org/river-of-life`, `/rent/river-of-life`, `/proposals`, `/proposals/prographics`, `/tools/coa-library`, `/steward`.
- Static Minuteman pages served from `public/` on the same Vercel deploy: `/mmpuptown/…`, `/mmpunionshop/`, `/proposals/minuteman`, `/proposals/minuteman-website`, `/store-options/…`, `/demo/mmp.html`. Final custom domains for the Minuteman sites: not stated (verify). Existing live site is `mmpuptown.com` (not ours).
- Vercel: deploys on push, ~1 min build. Vercel project name: (verify).
- Supabase (cares-works): project ref `qcikhcnclduakriextsz`. ProGraphics org id `51c83c73-b406-4cfa-9626-b600b3c30236`.
- Supabase (kcocares notification hub, used for email/SMS): ref `rhbmuxvbmmlbkjegwtgr`, edge function `hub` v10 (SendGrid + Twilio, `x-hub-secret` auth, supports `bcc`).
- Edge functions on `qcikhcnclduakriextsz`: `send-invoice-email` v7, `send-po-email` v2, `send-receipt-email` v2, `plaid-link-token`, `plaid-exchange`, `plaid-sync`.
- GitHub remote: not stated in excerpts (verify). Known pushed commits: `477fbb9`, `61bf64c`.
- QBO MCP connection confirmed to "PRO GRAPHICS ENTERPRISES, INC." (as of the ProGraphics chat).

## Chats that built it
| Chat name | Last active | Resume command |
|---|---|---|
| ProGraphics dashboard tool | 2026-08-24 | `cd /c/dev/cares-works && claude --resume "ProGraphics dashboard tool"` |
| Minuteman Press website editability | 2026-08-23 | `cd /c/dev/cares-works && claude --resume "Minuteman Press website editability"` |
| Build e-commerce site mockups for Minuteman Press | 2026-07-31 | `cd /c/dev/keepstead && claude --resume "Build e-commerce site mockups for Minuteman Press"` |
| CARES Works | 2026-08-24 | `cd /c/dev/keepstead && claude --resume "CARES Works"` |
| New Life in Christ website and bookkeeping system | 2026-08-07 | `cd /c/dev/keepstead && claude --resume "New Life in Christ website and bookkeeping system"` |

Note: the CARES Works chat also wrote scratch scripts into a keepstead worktree (`C:\dev\keepstead\.claude\worktrees\peaceful-newton-f639c8\`) and into `C:\dev\caresmn\`.

---

### Chasing Chickens — chickens.karikounkel.com
**Built 2026-09-04 in a CLOUD session.** Nothing from this session is in `C:\dev`
yet. Everything below is committed and pushed to GitHub; a desk session must
clone/pull it down.

**Where it lives**
- Repo: `github.com/kari-kounkel/chickens` (NEW tonight, branch `main`) — **no
  local clone exists**; needs `C:\dev\chickens`
- Live: `https://chickens.karikounkel.com` (verified HTTP 200, Vercel project
  `chickens`, auto-deploys on push to main)
- Also: `chickens-two.vercel.app`
- Supabase: table `chickens_signups` in the **kkstore** project
  (`lheytkgixafdhluuvrbg`) — same project ladybug uses, deliberately not a new one
- A duplicate copy also sits in `cares-works` on branch
  `claude/chasing-chickens-countdown-uwaj4z` (PR #9, draft) under `chickens/`.
  Redundant now that the standalone repo exists — close the PR or delete the folder.

**Built so far**
- ✅ Static landing page, no build step, mirrors `kari-kounkel/ladybug` exactly
  (plain HTML, Fraunces + Mulish, countdown in hero)
- ✅ Live countdown to 10/28/2026, plus a "Two Octobers" section counting both
  10/1 (five years sober) and 10/28 (launch)
- ✅ Both parts of the book: Part One's three acts, Part Two = *The Book of Kari*
  set as scripture (Kari 0:1–5 and Kari 2:1–6 verbatim)
- ✅ Launch signup form → `chickens_signups`, insert-only under RLS
- ✅ `marbles.js` in the `karikounkel` repo updated: Chickens marble now
  `live:true` pointing at the site (was `live:false` with a dead `"#"`)

**Decisions**
- Launch 10/28/2026 is deliberate: five years to the day from Teen Challenge
  graduation (10/28/2021). Sobriety 10/1/2021 is the other October date.
- Signup table lives in kkstore, NOT a new Supabase project — Kari is already
  paying ~$120/mo across nine projects and does not want a tenth.
- Insert-only RLS means the publishable key in `index.html` can add a row and
  can never read the list. Verified: insert as `anon` works, select returns 0 rows.
- Page content is drawn from Kari's own archive, not invented; `README.md` in the
  repo lists what each claim traces to.
- Do not put specifics about Aunt Gwen on the page without asking. An invented
  "lipstick on straight" detail was published and had to be removed. The true
  memory is that Gwen was simply amazing in a little girl's mind — no inventory.

**Where it stopped**
9/4 very late. Site is live and correct. Kari produced a NEW cover — torn paper,
black/red/kraft, a charging Polish hen, "faith. freedom. and a flock that will
not behave." It is far better than what is on the site. It could not be
installed because a cloud session cannot read her files.

**Next steps**
1. Put the new cover into `chickens/images/` (replaces the May 2024 collage comp,
   which Kari does not like) and repaint the site's palette to match it — current
   colors were pulled off the OLD cover.
2. Clone the repo to `C:\dev\chickens`; add it to `C:\dev\DEV-INDEX.md`.
3. Close PR #9 / remove the duplicate `chickens/` folder from cares-works.
4. Test the live signup form once — never verified end to end (the build sandbox
   blocks outbound supabase.co).
5. Pre-order link, analytics property, real chapter excerpts.

**Pending / frozen items**
- **CARES logo typo — cards already printed.** The logo Kari ordered business
  cards with reads **"SUPRORT"** instead of SUPPORT. Cards are printed; too late.
  She has since produced a corrected logo. It is NOT yet on caresmn.com — needs
  to land at `caresmn/public/cares-consulting-logo.png` (same filename = no code
  change). Do not ship the misspelled one anywhere.
- **Headshot for caresmn.com** — `kari hoglund kounkel business.png` in OneDrive
  `Desktop/Marbles/Logos and Photos`. Plan: its own band before the CTA strip,
  with name, "Founder + Consultant", and "Clear today. Stronger tomorrow." NOT in
  the hero — the hero is already a two-part lockup.
- At hero size (~260px) the new CARES logo's five icon labels and tagline may be
  unreadable. Check on the live page; may need a cropped mark for small uses.
- **Supabase ~$120/mo across nine projects**, most nearly empty. Consolidating to
  two or three would plausibly take it near $30. Kari says a larger system-redesign
  document is coming first — do not start this unprompted.

**Key files**
- `C:\dev\chickens\index.html` (whole site), `README.md` (sourcing + deploy notes)
- `karikounkel` repo → `marbles.js` (front-door source of truth)
- `caresmn` repo → `src/components/ChaosHero.jsx` (logo at line ~86)

---

### ProGraphics
Client: ProGraphics Enterprises Inc. — Dave Erickson (`prographicsinc@aol.com`) and Betty Erickson (`races61@aol.com`), ages 83/85. Free ledger deal because of their age. Fiscal year 4/1–3/31. Bloomington MN 55431.

**Built so far**
- ✅ The ledger itself: one big React file `src/pages/LedgerWorkspace.jsx` ("the notebook" / steno pad), tenant at `/prographics`
- ✅ Statement CSV upload for reconciliation; all accounts reconciled to statements (Kari 8/23: "all the reconciliations are done")
- ✅ Credit-card reconcile in "owed" (positive) terms; card payments show in notebook as bank-out + card-in; CorTrust default payment account
- ✅ Reconciliation upgrade: "last reconciled" header, statement-date filter, saved reconciliation record, printable history, attach statement PDF/CSV; "Bank reconciliations" page in Admin; never locks out-of-balance — offers to post difference to Suspense
- ✅ Invoice/PO/receipt emails BCC the logged-in user (edge functions v7/v2/v2 via kcocares hub)
- ✅ Dave↔Betty message board under balances (reply, attach screenshot, pulse on new, archive; reply reopens Done)
- ✅ Display names (races61 → Betty Erickson, prographics → Dave Erickson); balances sorted by name with reconciled badge (✓/⚠/○); top balance = today's live balance (excludes "noted" lines)
- ✅ Payoff plan with PAY NOW column, 0%-promo end date, credit line + utilization, APR saves
- ✅ Vendors page: last payment shown, click for history, merge duplicates; forced clean vendor names (title case, no punctuation); "Advertising Spec" save fixed
- ✅ Invoice payment consolidated to one "💵 Payment" button (full/partial/overpay); Bills page has "Paid bills" section; Red Pine $200 overpayment surfaced as refund-due
- ✅ Documents page as category dashboard; "Upload transactions" (CSV) vs "Upload statement" (PDF) buttons; remove/replace attached statement
- ✅ Browser tab title reflects tenant (`/prographics`, `/emerson`) instead of "cares-works"
- ✅ Opening balances from the 3/31/2026 tax return started: loan + cards inserted; CorTrust set as the one and only business card
- ✅ Sales tax REBUILT to match QBO (8/24 pm): rate corrected 8.025% → **9.025%** (Bloomington combined); invoices re-derived per QBO — only the **11 retail invoices** are taxable, everything else exempt (resale/gov/nonprofit/out-of-state). QBO files **cash basis**: owed per QBO = Q1 **$151.18** / Q2 **$198.10** / Q3-so-far **$27.08** (NOT confirmed filed — verify at MN DOR). Sales-tax screen adds the 6 MN e-Services jurisdiction lines + a per-period filing tracker (ledger_statements kind='sales_tax') + questions panel. Shipping = pass-through, not taxed.
- ✅ Exemption certificates on the customer file (ledger_customers exempt_reason/cert_number/cert_on_file/cert_date) with ST3 sub-panel + green/amber list badges; 34 exempt customers pre-marked (13 gov, 6 nonprofit, 15 resale)
- ✅ Contact import from QBO Contact List exports: customers 0→145 addresses, 1→66 phones; vendors 1→14 addresses
- ✅ Customer/vendor "past orders" history (ledger_history table, fetched on demand) — imported from QBO Sales-by-Customer + Check Detail + Open PO; ONE plain list per party (no QuickBooks label, no lifetime summary)
- ✅ Plaid edge functions deployed (not usable yet — see pending)

**Decisions**
- App is a categorized single-entry checkbook (one account + one category per line; two-sided posting only for transfers/card payments). It is NOT a double-entry GL, so a balance sheet needs opening balances for every balance-sheet account — hence build openings from the 3/31/2026 tax return and have the CPA approve them.
- Rest of QBO history is "bad data": keep the good parts (customers/vendors/invoices/POs), archive the rest; don't try to reconcile all of QBO.
- Amounts stored as integer cents; cards store owed as a negative balance. `match_status`: null = in notebook & counts; `reconciled` = locked & counts; `noted` = hidden & excluded from balance; `bill` = documented.
- Interest on a card is not a transfer — cards are payees so interest posts to the card; bank fees go to "Banking costs".
- Sales tax (CORRECTED 8/24): NOT everything is taxable — that earlier read was wrong (it read line-item taxable flags, not actual tax charged). QBO taxes only RETAIL customers; resale/government/nonprofit/out-of-state are exempt. Rate is 9.025%. QBO files CASH basis. "What QBO says owed" ≠ "what was filed" — verify against the real MN DOR account on-site.
- Other credit cards on the return may be personal: put them on the balance sheet with questions for Dave/Betty, but keep them off the credit-card listing.
- Inventory: leave at zero and flag. AR on the tax return: enter and flag for more info.
- History import rules (Kari 8/23): attach old POs to the VENDOR and CUSTOMER, invoices to the CUSTOMER; do NOT import bills (they never used that right); everything imported is marked paid and done unless she says otherwise.
- "We don't need that whole emailing thing anymore" — messaging is inside the system now (8/23). Scope of removal not confirmed (verify).

**Where it stopped**
8/24 night (Kari going to bed, flying to Florida next day). Resolved the PO scare: PO #2133 was never deleted — its `doc_type` had flipped to `invoice`; restored it and shipped the fix so convert-to-invoice keeps the PO (stamps it INVOICED). Rebuilt sales tax to match QBO. Imported contacts + built the customer/vendor "past orders" history from the QBO exports. Then Kari found the history is INCOMPLETE and that's the live problem: (1) descriptions got trimmed + capped when hand-loaded, so old invoices can't be fully copied; (2) past purchase orders never came over (the export was "Open PO Detail" = open only); (3) customer payments/checks received don't show (history is invoices-only; app has 0 payment records). She wants ONE simple list of real old orders they can copy/reuse — not summaries, not "QuickBooks vs now."

**Next steps** (also on Everything Board card `pgledg01`)
1. Build an **in-app uploader** (client-side xlsx/CSV parse) so Kari drops the QuickBooks exports and full invoice history loads UNTRIMMED into `ledger_history`.
2. Load **past purchase orders** from a full PO export (not just open) onto BOTH the vendor and the customer.
3. Show **customer payments/checks received** on history (needs a payments source + payment tracking; app currently records none).
4. Cash-basis **sales-tax display** + verify Q1 $151.18 / Q2 $198.10 / Q3 $27.08 against the real MN DOR account on-site; wire doc-upload for the filed ST1s.
5. Fiscal-year live **P&L + Balance Sheet** reports; finish prior-year P&L screen; resolve trial-balance CPA flags (loan balance, inventory $0, AR cash/accrual, Cap One/Sam's business-or-personal).

**Pending / frozen items**
- History is invoice-only + trimmed; past POs and customer payments missing (see Next steps 1–3) — the current live thread.
- Vendor lifetime totals in history are unreliable (Check Detail +/- offset pairs net to $0) — the transaction list is fine, the total isn't.
- Punctuation strip caught domains: "Amazon.com"→"Amazoncom", "Stamps.com"→"Stampscom" — special-case if wanted.
- Plaid: functions deployed but `PLAID_CLIENT_ID` / `PLAID_SECRET` / `PLAID_ENV` secrets never set — bank feeds don't work.
- Flagged for Dave/Betty + CPA: inventory (zero), AR cash-vs-accrual, whether Capital One ••1197 / Sam's Club cards are personal, real business-loan lender+balance.
- `ledger_history` load was done by hand-generated SQL batches (no service key / no bulk import) — if reloading, build the uploader instead.
- New tables added this session on `qcikhcnclduakriextsz`: `ledger_history`; `ledger_statements` now also holds kind='sales_tax' filing records; `ledger_customers` gained exempt_* columns.

**Key files**
- `C:\dev\cares-works\src\pages\LedgerWorkspace.jsx` (the whole ledger)
- `C:\dev\cares-works\src\pages\Ledger.jsx`, `src\pages\InvoicePublic.jsx`, `src\App.jsx`
- `C:\dev\cares-works\src\design\neon.jsx` (palette `N`)
- Memory: `C:\Users\karik\.claude\projects\C--dev-cares-works\memory\prographics-ledger.md`, `prographics-migration-findings.md`, `cares-works-workspace-shell.md`; `C:\Users\kari\.claude\projects\C--dev-cares-works\memory\prographics-history-import.md` (note: two user profiles, `kari` and `karik`, both have memory dirs — verify which is current)
- Source docs: `…\Desktop\Marbles\Wandering Orphans - To Be Filed\ProGraphics_Proposal (1).pdf`, `ProGraphics - Dave and Betty Erickson.pdf`; tax-return scans `…\Pictures\Scans\Scan_20260823 (3).pdf`, `(4).pdf`

---

### Minuteman Press
Client: Frank Brown, I A Z Corporation dba Minuteman Press Uptown, 4024 Washington Ave N, Minneapolis MN 55412, phone 612.870.0777, hours 8–6 (no Sat). Marketing person: Christine (replaced Kim). Brand: green `#1d7a44` + orange `#ec7621`, Open Sans. Union shop brand: navy `#0d1b3d` + red `#b71c1c` + gold `#f4c430`.

**Built so far**
- ✅ Full proposal page for Frank at `/proposals/minuteman` (two agreements; $4k Phase 1 + $2k Phase 2; issued July 7, valid through July 15, 2026; Lora font; Saint Paul CARES address; print-and-sign, no DocuSign)
- ✅ Website-only proposal at `/proposals/minuteman-website` for Christine (bookkeeping stripped out)
- ✅ Bookkeeping Services Agreement: editable `.docx` master + locked PDF Frank downloads. Tier 2 elected, $5,000/month, effective June 1; 4 liability clauses added to Section 14; scrolling banner noting website section removed (available on request), slowed to half speed
- ✅ Six store-design mockups under `/store-options/` (option-1 category-first … option-6 reorder-b2b) + `/demo/mmp.html`
- ✅ Draft e-commerce schema `public/demo/mmp-schema-draft.sql` (catalog, orders, Stripe, uploads, branded client storefronts) — **draft only, not applied**
- ✅ `mmpuptown` site: 7 pages from Christine's sitemap (home, about, mission, products, print-store, news, contact) with shared `assets/style.css`, yellow "📝 CHRISTINE:" notes and grey "📷 IMAGE SLOT" boxes
- ✅ `mmpunionshop` single-page union site (own CSS, union bug SVG hero, 9 union product categories)
- ✅ Inline editor `assets/editor.js`: `?edit=christine` enables edit mode, contenteditable blocks, floating "Save & Publish" bar, upsert to Supabase `mmp_content` table, image + logo upload to Storage, live-preview toggle, token auto-propagates to internal links
- ✅ 7/29 fix (commit `477fbb9`): all 8 pages editable (~330 blocks), buttons editable, links don't steal edit clicks, logo upload up to 400×110
- ✅ 7/31 fix (commit `61bf64c`): 409 on second save fixed with `?on_conflict=page_slug,block_id`; PostgREST errors surface in the toast
- ✅ 8/5: re-found Christine's build, pushed edit fixes; 8/21: `docs/minuteman-plan-of-attack.md` written, project state saved to memory

**Decisions**
- Build in the cares-works repo/Supabase now; move to Frank's own Supabase later.
- Union shop is its own domain/site (union workers must buy from union shops).
- Placeholder-phase auth is just the URL token `?edit=christine` — no server-side auth.
- Christine's `mmpuptown` build is the chosen design direction (she's been editing it); the `/store-options` picker is kept only for color variants.
- Frank took the $5k/month bookkeeping but not the website (May 18); website proposal resurrected July 7 and preserved as a "resurrectable" asset.
- Ordering model (Kari 8/21): the website captures a quote/order and produces a file to upload into Minuteman's **FLEX** software. Recommended **Option A** (intake → FLEX; fast, no online payment/tax) over **Option B** (full store with Stripe, real prices, photos). Bar is "very perfected."
- Online ordering + payment, portal login, Printful, ASI catalog are Phase 3 — gated on Frank signing the website proposal.
- `hello@mmpuptown.com` stays as the placeholder email until Kari picks the real one.

**Where it stopped**
8/23 (MinutemanEdit): Kari asked "what's next… figure out the ordering and get the products over." Claude confirmed the live database has **no Minuteman product catalog at all** (`ledger_products` / `ledger_customers` belong to the bookkeeping tool) — the catalog must be created from scratch, and how much data is needed depends on the A/B decision. The print-store hub still links to 7 unbuilt pages (order, quote, send-files, print-on-demand, promotional, portal, union-political) and the products page to 7 unbuilt category pages.

**Next steps**
1. Kari makes the Option A (intake → FLEX) vs Option B (full store) call.
2. Find out what FLEX's import file needs to contain (not in repo — Kari's/Frank's knowledge).
3. Get the real product list from Christine/Frank (names + categories + specs for A; add prices, tiers, options, photos for B) and load it.
4. Build the 7 print-store flow pages and 7 product-category pages to match the existing style.
5. Swap the placeholder email; scan Christine's paper materials.

**Pending / frozen items**
- A vs B ordering decision — waiting on Kari.
- FLEX import format — unknown; blocks where order data goes.
- Product catalog — does not exist anywhere (only 6 sample products in the draft schema).
- Christine's paper info still needs scanning (Kari, 8/21).
- Frank's signature on the website proposal — status not stated (verify); Phase 3 pieces frozen until then.
- `mmp-schema-draft.sql` not applied.
- Real domains for `mmpuptown` / `mmpunionshop` — not stated (verify).
- "the unionshop one isn't working for edits" (8/5) — resolution not shown in excerpt (verify union-home saves).
- Swap the full `chat.karikounkel.com/widget.js` Ask Kari widget for the shorter/lite button — was mid-flight in the mockups chat (verify done).

**Key files**
- `C:\dev\cares-works\public\mmpuptown\` — `index.html`, `about/`, `mission/`, `products/`, `print-store/`, `news/`, `contact/`, `assets\style.css`, `assets\editor.js`
- `C:\dev\cares-works\public\mmpunionshop\index.html`
- `C:\dev\cares-works\public\proposals\minuteman\index.html`, `…\minuteman\Bookkeeping_Services_Agreement_Minuteman.pdf`, `public\proposals\minuteman-website\index.html`
- `C:\dev\cares-works\proposal-archive\Bookkeeping_Services_Agreement_Minuteman.docx`, `proposal-archive\minuteman-full-proposal.html` (plus `_bk*` / `_ws*` unpacked docx scratch dirs — safe to delete)
- `C:\dev\cares-works\public\store-options\…`, `public\demo\mmp.html`, `public\demo\mmp-schema-draft.sql`
- `C:\dev\cares-works\docs\minuteman-plan-of-attack.md`, `C:\dev\cares-works\.claude\launch.json`
- Memory: `…\C--dev-cares-works\memory\minuteman-website.md`; `…\C--dev-keepstead\memory\project_mmp_marketing_christine.md`
- Source: Christine's sitemap `C:\Users\karik\Downloads\website-tree2.pdf`

---

### CARES Works bookkeeping
The product itself at `tools.caresmn.com` — design system, pricing, org workspaces (Pastor David / NLC, Laurie / River of Life), proposals, COA Library, and the tool pages. River of Life (Laurie Geisse, Business Manager, `lauriegeisse@rolmn.org`) work from both the CARES Works and New Life chats is tracked here.

**Built so far**
- ✅ Neon design system `src/design/neon.jsx`: white cards with neon outlines, blue `#0080ff` + green `#22c55e` washes, gradient hero text, `NeonBox/NeonBtn/NeonNav/PageShell/SignatureFooter`, IP footer ("proprietary software of Kari Hoglund Kounkel LLC & CARES Consulting, Inc. © 2026")
- ✅ 5-tier Pricing page (Community / Nonprofit $13 / Owner $27 / Firm $97 / White-Label); Nonprofit Series landing page
- ✅ Org Workspace `src/pages/OrgHome.jsx` (sidebar: Home / Financials / Facilities / Meetings / Newsletter / Fundraisers / Documents; hash deep-links); compose modals (FlowSuite Pro pattern) for meetings, newsletters, fundraisers; financial snapshots frozen to meeting date; shareable board link `/share/:type/:id`
- ✅ Supabase migrations: `org_link_ledger_and_invites`, `create_organizations_v2` (organizations, members, meetings, newsletters, fundraisers, documents, `is_org_member()`), `bundle_includes_raw_entries_for_snapshots`, `public_share_org_content`, `org_spaces_and_rentals` (4 tables + `get_public_rental_bundle`), `org_spaces_tier_rates_and_rules`
- ✅ River of Life facilities: interactive SVG map `src/components/FacilitiesMap.jsx` with time slider and day-view timeline (rows = spaces, x = hours; dashed block boundary + inner pill for actual event time, `released_at` per rental); click-a-room upcoming rentals; mobile CSS
- ✅ Public rental page `src/pages/PublicRent.jsx` at `/rent/river-of-life`: tier picker (Personal / Ministry Outside / Non-Ministry Outside), live invoice (blocks × rate + MN 8.13% tax), rules with required agreement checkbox, PushPay payment info, anonymous submit to `org_rental_requests`, hash deep-link `#CMP,CR07,…` pre-selects rooms
- ✅ `src/components/RentalModal.jsx` — Laurie adds/edits rentals herself (WHO/WHEN/WHERE/DETAILS, weekday recurrence, space multi-select, deposit/insurance/status)
- ✅ ROL data loaded server-side under `/org/river-of-life`: F27 budget (15 teams, $1,997,817), FY26 + YTD FY27 P&L, 2 balance-sheet snapshots, Divvy account `2016000`, 10 bill.com bills (9 awaiting approval, $13,472.95 open), 22 rooms (17 rentable), rates/rules extracted from Laurie's 154-page PDF, 2 upcoming rentals (Beth Snyder Aug 9; McMillen funeral Aug 29)
- ✅ Laurie white-screen on her page fixed 8/10–11
- ✅ Proposals: `/proposals` index, `/proposals/prographics` (PDF viewer + editable sidebar, invoices + checks list), client link `/p/504e65a4cdfb42b79ed856fa04bc4c5b` (no login). ProGraphics proposal total $940 ($395 / $395 / $150)
- ✅ COA Library `/tools/coa-library` (8/24): 13 industry charts of accounts seeded, `?coa=<slug>` deep links (manufactured-homes, restaurant, retail-ecommerce, nonprofit, church, construction, auto-repair, salon-barber, real-estate-property-mgmt, professional-services, freelancer-solo, trucking, +1)
- ✅ Tool pages present in `src/pages/`: VendorDecoder, PayrollCalculator, PayrollChecklist, ChecklistBuilder, ClientVisitSummary, CommunicationTemplates, CourtChapter, ExemptionTracker, ExemptSubmit, EmailAttachmentTutorial/Advanced, QBODiscovery, Dashboard, Landing, Login, Workspace, OrgView, SharedOrgContent, PalettePreview(Dark)

**Decisions**
- Palette: stay white (no black backgrounds), blue + green only for washes; pizzazz via subtle gradients, not dark mode.
- One tool, not more work: orgs compose meetings/newsletters/fundraisers inside the workspace — no "upload your minutes" workflow. Pastor David emails a token link to the board each time (pattern from FlowSuite Pro).
- Financials embedded in minutes freeze as of the meeting date (filter `ledger_entries.entry_date`), so a shared link always shows correct-as-of numbers.
- Public rental URL is separate from Laurie's admin page (emailable / linkable from the church site). No per-room pages. Day-view timeline replaced the picker because "you can't see a whole day."
- Laurie decides when a space is released back (`released_at`) rather than a fixed rule.
- Laurie's data is server-side under her login — never browser storage (the `/steward` tool saves to browser and is NOT what she uses).
- ROL workspace is a reference/guide for Laurie's Divvy-card approval role (she never touches QBO; BeMissional posts to QBO; bill.com pays monthly).
- COA Library: free tier = pick industry, get CSV; paid = QBO/IIF export, editable + saved copy, one-click into CARES Ledger.
- Tools ARE the cares-works site; PDFs of tools go to Etsy etc. to drive traffic to the CARES landing page (5/19 idea — status verify).

**Where it stopped**
8/29: The barcode printed in *Court of Accounts* points at `accounts.karikounkel.com/tools`, and it 404s. Two causes, only one fixed. (a) There was never a `/tools` index page — all 30 tools are routed individually as `/tools/<slug>`, and bare `/tools` fell through to the landing page. Built `src/pages/ToolsIndex.jsx`: public, no login, reads the `tools` table, grouped by category, with a band at the top for readers arriving from the book. PR #7 (draft), branch `claude/book-barcode-url-broken-vtacdw`. (b) `accounts.karikounkel.com` is not attached to any Vercel project — checked all 16. That is a domain + DNS job, not code, and the printed barcode cannot change, so the domain has to be made to work.

8/24: COA Library shipped with all 13 industries and Facebook-ready deep links ("ok love it… go baby bo"). Before that (8/11) check printing was reviewed: checks look right on screen but don't print aligned — drop the word "Date", move the dollar amount right under the date, spelled-out dollars is too low, everything needs to shift up ~2 lines. AR email was never tested. Claude "stood down" that day without changing anything.

**Next steps**
1. Fix check-print alignment on the pre-printed check stock, then test AR (invoice) email.
2. Upload the ProGraphics proposal PDF at `/proposals/prographics` so the client link works.
3. Give Laurie the remaining pieces she can't do yet: P&L upload inside the workspace, coding cheat sheet + Getting Started doc, past rentals view.
4. Build the admin side Kari asked for (5/19) and the inventory of every tool on the site (verify whether done).
5. Decide the COA Library paid tier (QBO/IIF export, saved copies, Ledger import).

**Pending / frozen items**
- `accounts.karikounkel.com` is dark — not attached to any Vercel project, so the barcode URL printed in the book still fails. Needs the domain added to the `cares-works` project + a DNS record at the registrar. The `/tools` page it should land on is built (PR #7) and live at `tools.caresmn.com/tools` in the meantime.
- Check printing misaligned — not fixed.
- AR email test — never run.
- ProGraphics proposal PDF not uploaded ("No PDF uploaded").
- ROL: YA Ministry budget lines skipped (workbook uses "TBD" instead of account numbers — Laurie to fix and re-upload); "Safety and security" tab missing from her 14-tab import (verify); import numbers didn't match her spreadsheet (why not confirmed).
- ROL: past rentals list — Kari asked, "there aren't any in here"; 13 upcoming rentals from her info were not all loaded at one point ("you still only have three of them listed") — verify count.
- ROL: 9 missions bills ($9,250) were awaiting Laurie's approval on 8/7 — hers to do, not ours.
- Brand-kit tool "we may need to fix up" (8/10) — no scope yet.
- QBO + bill.com live link for Laurie: Kari has the QBO developer account; nothing wired — currently manual exports only.
- Laurie's phone photos of the facility map / mock invoices / policies — status not shown (verify received).
- The "Emerson" tenant (`/emerson`) exists but no details in these excerpts (verify).

**Key files**
- `C:\dev\cares-works\src\App.jsx` (routes), `src\design\neon.jsx`
- `C:\dev\cares-works\src\pages\OrgHome.jsx`, `PublicRent.jsx`, `Pricing.jsx`, `NonprofitSeries.jsx`, `ProposalsIndex.jsx`, `ProposalView.jsx`, `ProposalPublic.jsx`, `COALibrary.jsx`, `Workspace.jsx`, `Dashboard.jsx`, `Landing.jsx`, `Login.jsx`
- `C:\dev\cares-works\src\components\FacilitiesMap.jsx`, `src\components\RentalModal.jsx`
- `C:\dev\cares-works\public\steward\index.html`
- Memory: `…\C--dev-keepstead\memory\project_rol_laurie_role.md`, `project_cares_ledger.md`
- Source: `C:\Users\karik\Downloads\Laurie's Facilities.pdf`, `F27 Budget for Acccounting -1-LYNN-to-BeMissional-20260708-LIGHT SHADING.xlsx`, `yourrequest.zip` (QBO exports), bill.com AllBillsPage export

---

### New Life in Christ
Client: New Life in Christ Reentry Ministry (NLC), Pastor David. Current site believed to be `newlifeinchrist-reentry.org` (verify). Also the home of the "Ledger Lovers by CARES Works" brand thinking and the CARES Ledger for nonprofits.

**Built so far**
- ✅ Sample website HTML: `C:\Users\karik\OneDrive - CARES Consulting Inc\Desktop\nlc-sample-260527.html` (5/27)
- ✅ CARES Ledger `src/pages/Ledger.jsx` — replaces spreadsheets; dedicated funds, fundraising, donors; routed in `src/App.jsx`
- ✅ Steward tool `public/steward/index.html` (browser-storage version)
- ✅ NLC org workspace (Pastor David) with Financials / Meetings / Newsletter / Fundraisers / Documents — built in the CARES Works chat (see that section); his financials updated from Kari's 7/30 attachment
- ✅ June meeting docs zip (`junemeetingdocsquestionfeedback.zip`) received 7/30

**Decisions**
- Ledger Lovers positioning: umbrella brand CARES Works reassures; sub-brand Ledger Lovers gets a warmer visual world; it's "operational translation," not bookkeeping education.
- Pricing: anyone can have the ledger for a monthly fee; only ProGraphics gets it free (they're over 80).
- Pastor David wants his "dumb pictures" — screenshots get a place in the site/workspace.
- Pastor David composes minutes/newsletters in the tool and sends a token link to the board; financials in minutes freeze at the meeting date.
- Claude must confirm before executing and do all items on a list (memory files `feedback_confirm_before_executing.md`, `feedback_do_all_of_the_list.md` were written after 7/31 blow-ups).

**Where it stopped**
7/31: two sessions were working NLC at once and stepped on each other. Kari asked whether the data from the June zip, including the minutes, was put somewhere, and said the newsletter and minutes still showed placeholder content unrelated to the uploaded files ("get it all in there.. all of it"). Whether the real June minutes/newsletter/financials landed in the workspace is not confirmed in the excerpts. On 8/7 this chat pivoted to River of Life / Laurie (tracked under CARES Works bookkeeping).

**Next steps**
1. Verify the June meeting docs (minutes, newsletter, financials, Q&A feedback) are actually in the NLC workspace — if not, load them.
2. Confirm the NLC workspace URL/slug and that Pastor David can log in and compose (he was to be onboarded 7/30).
3. Answer Kari's 6/24 questions: do monthly balances match his (e.g., April looks like his April), how does he enter — is there a bank-statement uploader, and can he print from there.
4. Place his screenshots/pictures in the sample site.
5. Decide whether the sample site goes live and where.

**Pending / frozen items**
- June minutes/newsletter/financials import — unconfirmed (verify in the workspace).
- Bank-statement uploader and print for Pastor David — asked 6/24, no answer shown.
- NLC workspace slug/URL — not stated in excerpts (verify; ROL's is `/org/river-of-life`).
- Sample site is a loose HTML on Kari's Desktop, not in the repo (verify whether a copy lives under `public/`).
- Kari's 7/30 financials attachment — applied (verify current).

**Key files**
- `C:\Users\karik\OneDrive - CARES Consulting Inc\Desktop\nlc-sample-260527.html`
- `C:\dev\cares-works\src\pages\Ledger.jsx`, `src\App.jsx`, `public\steward\index.html`, `src\pages\OrgHome.jsx`
- Memory: `…\C--dev-keepstead\memory\project_nlc_reentry.md`, `project_ledger_lovers.md`, `project_cares_ledger.md`, `project_prographics_erickson.md`, `feedback_confirm_before_executing.md`, `feedback_do_all_of_the_list.md`
- Source: `C:\Users\karik\Downloads\junemeetingdocsquestionfeedback.zip`
