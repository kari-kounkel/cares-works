# cares-works — STATUS
_Rebuilt from chat transcripts on 2026-08-25. Update this file at the end of every work session ("update STATUS.md")._

## What this folder is
`C:\dev\cares-works` is the Vite + React 18 app behind CARES Works (`tools.caresmn.com`), Kari's multi-tenant SaaS of bookkeeping/admin tools, plus everything static served out of its `public/` folder. It holds four client sub-projects: the ProGraphics ledger (QuickBooks replacement for Dave & Betty Erickson), the Minuteman Press Uptown website + union-shop site + proposals, the CARES Works product itself (design system, pricing, org workspaces, River of Life facility rentals, COA Library, proposals), and the New Life in Christ (Pastor David) sample site + org workspace. All data lives in one Supabase project; routing is manual `window.location.pathname` in `src/App.jsx`.

## Where it lives
- Live site: `https://tools.caresmn.com` (CARES Works). Tenant routes seen in chat: `/prographics`, `/emerson`, `/org/river-of-life`, `/rent/river-of-life`, `/proposals`, `/proposals/prographics`, `/tools/coa-library`, `/steward`, `/board` (Kari's Command Board).
- Static Minuteman pages served from `public/` on the same Vercel deploy: `/mmpuptown/…`, `/mmpunionshop/`, `/proposals/minuteman`, `/proposals/minuteman-website`, `/store-options/…`, `/demo/mmp.html`. Final custom domains for the Minuteman sites: not stated (verify). Existing live site is `mmpuptown.com` (not ours).
- Vercel: deploys on push, ~1 min build. Vercel project `cares-works` (`prj_LXPWJjKXEA3TLXsqrnE95EKxHFdr`, team `team_MzJfjdVk8hjUhRXEzk8iyMbt`).
- Supabase (cares-works): project ref `qcikhcnclduakriextsz`. ProGraphics org id `51c83c73-b406-4cfa-9626-b600b3c30236`.
- Supabase (kcocares notification hub, used for email/SMS): ref `rhbmuxvbmmlbkjegwtgr`, edge function `hub` v10 (SendGrid + Twilio, `x-hub-secret` auth, supports `bcc`).
- Edge functions on `qcikhcnclduakriextsz`: `send-invoice-email` v7, `send-po-email` v2, `send-receipt-email` v2, `plaid-link-token`, `plaid-exchange`, `plaid-sync`.
- GitHub remote: `https://github.com/kari-kounkel/cares-works` (public). Known pushed commits: `477fbb9`, `61bf64c`.
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
- ✅ Plaid FULLY WIRED end to end: all three edge functions live (`plaid-link-token`, `plaid-exchange`, `plaid-sync`), client flow built (`connectPlaid`/`syncPlaid`, green "🔗 Connect a bank / card" + "Sync now" buttons). The ONLY thing left is Kari setting the three secrets in Supabase — see pending.
- ✅ (9/1, 2am) Read-only **"View check"** on paid bills — opens an already-written check with its real number and date, recipient name + address, prints a copy, and touches NOTHING (never un-pays, deletes, or re-posts). The old destructive path relabeled **"Redo / void"** and now confirms first. This fixed the night's worst trust bug: looking at a check used to delete it.
- ✅ (9/1) Refreshed the "what's new" changelog (was frozen on Aug 4) to Aug 31 with recent work + a hard-refresh reminder; "Customer refunds" category fixed (cat_type was null → 'income').

**Decisions**
- **CORRECTED STANDARD (Kari, emphatic, 8/31):** this is a **REAL bookkeeping system**, NOT a "categorized single-entry checkbook." That earlier framing is wrong as a target. The *interface* stays dead-simple for Dave & Betty (the notebook, one action per screen) — that is the only place simplicity applies. The *engine* must be real double-entry: one `postEntry()` every path flows through, nothing hides silently, everything balances, a CPA can trust it. See memory `prographics-real-bookkeeping-standard`. (Openings from the 3/31/2026 tax return, CPA-approved, still stand.)
- **The real risk is Dave & Betty's TRUST, not lost data (Kari, 9/1, 2am).** Nothing has actually been lost — every "disappearance" was a display/status bug or the reprint delete, all restored. But for two clients aged 83/85 nervous about leaving QuickBooks, *how it feels IS whether it's trustworthy*: one "where did my check go?" moment and the client is gone. Every bug this era is the SAME bug in different clothes — a transaction that can appear to vanish, or two screens that disagree (bill status vs register). The job is NOT one bug report at a time; it is to MAP every "can appear to vanish / screens can disagree" path in the ledger, lay the whole set out before changing code, then close them all so it just feels solid every time she touches it.
- Rest of QBO history is "bad data": keep the good parts (customers/vendors/invoices/POs), archive the rest; don't try to reconcile all of QBO.
- Amounts stored as integer cents; cards store owed as a negative balance. `match_status`: null = in notebook & counts; `reconciled` = locked & counts; `noted` = hidden & excluded from balance; `bill` = documented.
- Interest on a card is not a transfer — cards are payees so interest posts to the card; bank fees go to "Banking costs".
- Sales tax (CORRECTED 8/24): NOT everything is taxable — that earlier read was wrong (it read line-item taxable flags, not actual tax charged). QBO taxes only RETAIL customers; resale/government/nonprofit/out-of-state are exempt. Rate is 9.025%. QBO files CASH basis. "What QBO says owed" ≠ "what was filed" — verify against the real MN DOR account on-site.
- Other credit cards on the return may be personal: put them on the balance sheet with questions for Dave/Betty, but keep them off the credit-card listing.
- Inventory: leave at zero and flag. AR on the tax return: enter and flag for more info.
- History import rules (Kari 8/23): attach old POs to the VENDOR and CUSTOMER, invoices to the CUSTOMER; do NOT import bills (they never used that right); everything imported is marked paid and done unless she says otherwise.
- "We don't need that whole emailing thing anymore" — messaging is inside the system now (8/23). Scope of removal not confirmed (verify).

**Where it stopped**
9/1, ~2am (Kari stopping for the night; has DNS records for ProGraphics + GoDaddy access ready but parked the domain job). This session started as Betty's bug list and turned into the trust conversation above. Fixed/restored tonight: (a) reprint "un-check" disaster — the "Reprint / edit check" button deleted a check's register line + un-paid the bill; three checks got left marked-paid with NO register line (CARES $150, City of Bloomington $250.44, Tax & Business $215) — **restored all three** as money-out lines on CorTrust, dated when written; then added the read-only "View check" so looking can't destroy, and a confirm on "Redo / void." (b) **Floe invoice #8730** ($1,733.25) — I'd wrongly marked it paid 8/31; the check actually arrived 9/1, so it's **reopened (status 'sent', unpaid)** for Betty to mark paid — recordPayment posts the deposit to the register, confirmed. (c) refund category + changelog fixes. **Parked for next session:** point the ProGraphics domain (Kari has the DNS records + GoDaddy login) — likely at the Vercel `cares-works` project; confirm which hostname → which target before touching DNS. Earlier (8/24) work still stands: PO #2133 restored, sales tax rebuilt to QBO, contacts + history imported.

**Still open from 8/24 (history is INCOMPLETE — was the prior live thread):** (1) descriptions trimmed/capped when hand-loaded, so old invoices can't be fully copied; (2) past purchase orders never came over (export was "Open PO Detail" = open only); (3) customer payments/checks received don't show (history is invoices-only). Kari wants ONE simple list of real old orders they can copy/reuse — not summaries.

**THE PLAN TO FINISH — a real non-payroll QBO replacement, double-entry (Kari, 9/8, the definitive scope).** This is the agreed roadmap; work it in phases, in daylight, not 1am patches. Mirrored on the in-app BUILD PROGRESS sidebar.

_Phase 1 — Nothing can vanish (safety, earns back trust, stops the bleeding):_
1. **Soft-delete / void everywhere** — recoverable; replaces the hard-delete which was REMOVED 9/8 from orders, the PO/order detail, and invoices (invoices keep the existing Void). Interim state: those things can't be hard-deleted at all until soft-delete lands.
2. **Audit trail** — log WHO did what, WHEN, on every create/convert/pay/void/delete. `ledger_doc_events` has no user_id today, so "who converted/deleted this" is currently UNANSWERABLE — that was a live pain point (Cedar Valley PO #2133 got converted + hard-deleted 9/8 ~4pm and we couldn't say who).
3. **Converting a PO keeps it** visible as the vendor record (convert already keeps the row, but the post-convert PO reads as a stray → someone deletes it; make it clearly kept).

_Phase 2 — Truly double-entry (the core Kari asked for from the start):_
4. **One `postEntry()`** every path flows through — each action posts a balanced debit/credit journal.
5. **Real chart of accounts** (asset/liability/equity/income/expense) under the simple category UI.
6. **A/R and A/P as real balances** (invoice→A/R, bill→A/P, payment draws down).
7. **Opening balances from the 3/31/26 return posted as equity**, CPA-approved.
8. **Trial balance that always balances.**

_Phase 3 — Reports that prove it (QBO parity, non-payroll):_
9. P&L fiscal-year (from 4/1); Balance Sheet fiscal-year; General Ledger/account detail; A/R aging + A/P aging; Expense detail by category; sales-tax liability (built — verify vs MN DOR: Q1 $151.18 / Q2 $198.10 / Q3 $27.08).

_Phase 4 — Edges:_
10. Order/PO **history browser** — copy-paste, group by vendor/customer/number/date, OUT of Admin (Kari 9/8). Also the untrimmed in-app xlsx/CSV uploader into `ledger_history`; past POs onto vendor+customer; customer payments on history.
    - **DONE 9/8: 753 historical POs imported** from the QBO "Open Purchase Order Detail" export (1,175 line items, PO #1001–2132, vendors only — that report carries no end-customer, so `customer_name=''`). Stored as `invoices` rows `doc_type='order'`, `status='historical'`; they render in **Orders → Closed** exactly like closed POs, with a HISTORICAL badge, openable/editable (so line items are copy-pasteable). One collision: historical Anico #2133 was NOT imported — the live Cedar Valley #2133 already holds that number (ON CONFLICT kept the live one); decide whether Anico needs a fresh number.
    - DONE 9/8 (later): **Orders search** — one box on the Orders page filters both current and closed/historical POs by number, vendor, customer, item, and every line's spec (AND-ed terms, so "koozie 2024" narrows); searching auto-opens the Closed section and shows a match count, so nothing gets lost among the 754 closed rows. Pairs with the Newest/Vendor/Customer sort the parallel session added.
    - **DONE 9/8 (later): 5,755 historical invoices imported** from the QBO "Invoice List by Date" export (everything below #8662; the 68 live invoices 8662–8734 skip via the unique index). Each carries customer, issue+due date, subtotal/tax/total, and the customer's own PO/ref in `notes`. Status: **paid** (paid_at = issue date) per the history rule, except **54 void** and **9 with a real open balance → sent** (not false-marked paid). Brings the org to **5,823 invoices, 1,309 distinct customers, 1997–2026**. Headers only — line-item detail (in the Sales-by-Customer export) is deferred as reference-only; layer on later if wanted.
    - **The customer↔vendor-PO link is NOT recoverable and won't be** (tested 9/8): QBO never stored a customer on a vendor PO, the PO text names the customer only ~3% of the time and noisily, and the product codes are shared SKUs so code-matching is mostly wrong. The invoice "P.O. Number" is the *customer's* reference, not ProGraphics' vendor PO. So invoice history (customer side) and vendor-PO history live as parallel records, the way QBO kept them. To see who a PO was for, look at invoices around its date/product — a human read, or a future manual "set customer" picker on a historical PO.
    - STILL TODO: the frictionless "copy an old line item into a NEW PO / new customer" reuse workflow; grouping; its own page; line-item detail on old invoices; and (open question) whether to backfill a customers/vendors master list so the 1,309 imported customer names autocomplete in the order form.
11. Customer & vendor **statements**; **1099** vendor tracking; year-end/fiscal close.
12. **Point the ProGraphics domain** (DNS + GoDaddy in hand); wire `admin@prographicsvinyl.com` sender once prographicsvinyl.com is verified in the hub's SendGrid account (see pending).

**Pending / frozen items**
- History now imported: 753 vendor POs + 5,755 customer invoices (1,309 customers), see Phase 4 item 10. Deferred: invoice line-item detail (headers only), customer payments as discrete records (invoices imported paid+done), and a customers/vendors master list for autocomplete. The vendor-PO↔customer link is confirmed unrecoverable from the QBO exports.
- Vendor lifetime totals in history are unreliable (Check Detail +/- offset pairs net to $0) — the transaction list is fine, the total isn't.
- Punctuation strip caught domains: "Amazon.com"→"Amazoncom", "Stamps.com"→"Stampscom" — special-case if wanted.
- Plaid: fully built; blocked ONLY on Kari setting `PLAID_CLIENT_ID` / `PLAID_SECRET` / `PLAID_ENV` secrets in Supabase (gotcha: the secret must match the env — production secret if `PLAID_ENV=production`). No redeploy needed after setting.
- ProGraphics domain: DNS records + GoDaddy access in hand (Kari), not yet pointed. Parked 9/1.
- Two both-reconciled duplicates left ALONE on purpose (don't delete reconciled without care): Stouse $355.54 and 4 Over $39.89. Riteline (4→1) and the other unreconciled dups were already cleaned.
- "Mark paid (no check)" on a bill posts NOTHING to the register — a known hole feeding the trust problem; fold into the posting-engine work, don't spot-patch.
- **Invoice #8730 collision RESOLVED (9/1):** the number had been reused across Northstar Canoe ($582), the Cedar Valley conversion, and Floe ($1,733.25), and Northstar's row was lost in the churn. Recovered the real Northstar invoice from the kcocares hub `notifications` log (it had been emailed 8/20 + 8/23, BCC races61@aol.com) — rebuilt #8730 Northstar $582 exempt/paid dated 8/20 with its ORIGINAL public_token `bb693a1b-...` so the copy the customer holds still resolves. Floe (never emailed) moved to #8731. NOTE: `invoices.invoice_number` has NO unique index — nothing prevents another collision; add one as part of the posting-engine/audit work.
- **ALL invoice line-item detail is wrong/thin, not just Northstar's** (Kari, 9/1): imported invoices lack correct line breakdowns. DO NOT hand-fix one at a time — fix them ALL in one pass by loading real line items from the full QuickBooks invoice export (the in-app uploader, Next-steps #4). Northstar #8730 currently carries a single placeholder "Vinyl Decals $582" line pending that batch.
- Recovery lever discovered: the kcocares hub (`rhbmuxvbmmlbkjegwtgr`) `notifications` table logs every sent invoice/PO/receipt email (to/bcc/subject/body/link) — a real audit source for anything emailed, until the proper audit-trail exists.
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

---

### CARES Consulting client proposals
Standalone, hand-built proposal pages served straight out of `public/` — separate from the database-driven `/proposals` hub in the React app (`ProposalsIndex` / `ProposalView` / `ProposalPublic`). These had never been listed in STATUS.md before 9/4; they are live pages and every session should know they exist.

**Built so far**
- ✅ `/floridagirl` — **Andrea Meythaler** (9/4). Admin + fractional-CFO proposal. Carries a **13-question live diagnostic** Kari runs in the room: yes/sorta/no across three bands (A · is it getting done, B · is anyone checking it, C · is anyone steering it), scored 1 / 0.5 / 0. Lowest band = starting rung, ties break downward. Renders one of four reads — administrative, controller, CFO, or light-touch. Read copies to clipboard as plain text and prints to PDF. Also carries the four-rung ladder (administrative → bookkeeping → controller → fractional CFO) and the CFO does / doesn't-do split lifted from `src/pages/FractionalCFOScope.jsx`.
- ✅ `/proposals/marco` — MARCO certification: index, agreement, invoice, sign, timeline, workspace, rco-tools, demo. Stripe deposit via `api/marco-deposit.js`.
- ✅ `/proposals/maddie` — tax recovery plan. $150/hr, $300 retainer; Stripe via `api/maddie-deposit.js`; post-payment secure uploader to the private `client-uploads` Supabase bucket.
- ✅ `/proposals/amy` — Amy's Cherished Events & You're Not Alone (index, ledger, site, workspace).
- ✅ `/proposals/itabelkoo` — index, agreement, curriculum, invoice; `api/itabelkoo-sign.js`, `-progress.js`, `-training.js`.
- ✅ `/proposals/minuteman`, `/proposals/minuteman-website` — see the Minuteman section above.

**Decisions**
- **No monthly figure on Andrea's page.** Kari's call, 9/4: she is walking in without a discovery call and will not quote a retainer before seeing the books. Only the Phase 1 "Look" is priced, as a flat fee agreed in writing; Phases 2 (Catch-Up) and 3 (Ongoing) get quoted inside the written Findings & Plan. The page says so out loud and explains why — that honesty is the sales argument, not a gap to be filled in later.
- Three phases, and Andrea can stop after any of them: **The Look** (fixed-fee diagnostic, findings hers to keep either way) → **The Catch-Up** (only if a backlog turns up; a project with an end date, not a subscription) → **Ongoing** (month to month, admin/CFO mix set by the read, reviewed at 90 days).
- Andrea's page uses the **CARES Consulting** brand — slate-navy `#2f3e59`/`#46587a` + orange `#e8772e` on cream `#f4f1ea`, the Maddie palette — not the CARES Works neon blue/green. Consulting engagements wear the consulting brand.
- Kari's Sidebar Notes are part of the house voice on these pages, not decoration.
- **The Look is $750 flat, with $375 credited** against the first month if Andrea engages within 30 days of the Findings & Plan being delivered; she keeps the written plan either way. The number lives in ONE place — `var LOOK_FEE` / `LOOK_HALF` at the top of the page script — and populates every mention, including the Stripe button label. Setting `LOOK_FEE = ""` reverts the page to "a flat fee, agreed in writing" with no figure anywhere. Change it there, never by hand-editing the prose. **The cents amount in `api/floridagirl-deposit.js` (75000) must be changed to match** — the page and the endpoint do not share a source.
- **Offer dates are PINNED constants, never computed from "today".** `ISSUED = 2026-09-05` and `EXPIRES = 2026-09-12` in the page script. A deadline measured from the moment a client opens the page never arrives — it would still read "7 days left" in November, which is a treadmill, not an offer. Re-issuing means editing those two dates by hand. The dynamic "Prepared: today" line was removed for this reason.
- **The countdown counts whole calendar days, not milliseconds.** Measuring ms against an end-of-day timestamp and rounding up reports "8 days left" on a 7-day offer. On expiry the page does not dead-end: the button disables and it invites a text for a re-issue, and `allow_promotion_codes` is on so Kari can honour the old price without a code change.
- **`GET /api/floridagirl-deposit` is a health check**, added because the button could not otherwise be proved without spending $750 and Vercel does not expose env vars via API. It returns booleans plus the charge amount — never the key or any part of it — and reports `mode` from the key's public prefix, because a test key completes checkout without moving real money and looks identical to success. Reuse this pattern on the other proposal endpoints.
- **Two clocks, deliberately kept apart on the page:** the $750 price holds until the expiry date; the half-back credit runs 30 days from delivery of the Findings & Plan. They were about to blur into one another.
- **There is no live QuickBooks connection in this repo and no page may imply one.** Plaid's functions are deployed but its secrets were never set, and no QBO OAuth exists. The real method offered to clients is the standard **QBO accountant invitation** (gear → Manage users → Accountants → invite `kari@caresmn.com`): it costs the client no paid seat, does not alter their subscription, and is revocable by them in two clicks. The fallback is exporting six named reports, of which **Transaction List by Date over All Dates** is the one that matters — it is what `src/lib/qboImport.js` actually reads, and a Trial Balance cannot substitute (balances, not transactions).
- **Deploying means merging to `main`.** Production is `main`; a pushed branch or a draft PR only builds a Vercel *preview*. A push is not a deploy, and "pushed" must never be reported as "live." Confirm with the Vercel API (project `prj_LXPWJjKXEA3TLXsqrnE95EKxHFdr`, team `team_MzJfjdVk8hjUhRXEzk8iyMbt`) that a deployment shows `target: production` AND `state: READY`.
- Tool pages under `/tools/*` are safe to link to prospects: their `if (!session)` checks gate member-only features, not the page, so an anonymous visitor gets the free tier rather than a login wall.
- `vercel.json` rewrites everything to the SPA **except** an explicit allowlist. Any new static page under `public/` needs its path added to the negative lookaheads or it will silently render the React landing page instead. Currently excluded: `proposals/`, `marco/`, `floridagirl`.

**Where it stopped**
9/4 (this session): Andrea's proposal written, extended, merged and **deployed to production** — Vercel `dpl_oXmmQo6BQqDKiVJPMjt6auNrgbzj`, state READY, commit `25bbb72`. Live at `tools.caresmn.com/floridagirl`. Kari presents to Andrea the morning of 9/5.

Shipped in three rounds. Round one: the page and the 13-question read. Round two: the Look fee, the QuickBooks access routes, the secure uploader with its thirteen-document list, and the `tools.caresmn.com` workbench section. Round three: Stripe checkout for the $750 and the pinned seven-day offer window.

Three real bugs caught and fixed, each by a different method — worth noting because the functional test alone would have missed two of them:
1. **Score bars rendered empty.** Found in a screenshot pass, invisible to the DOM test. `.fill` was an inline `<span>`, so `width:%` never applied; both `.track` and `.fill` are now `display:block`.
2. **The page was never deployed.** Kari reported the URL wouldn't open. Pushing the branch and opening a draft PR deploys to a Vercel *preview*, not production — see the deploy decision below.
3. **The upload bucket rejected spreadsheets.** `client-uploads.allowed_mime_types` had no CSV, Excel or OpenDocument entries, i.e. precisely what QuickBooks exports. Widened by SQL; this silently affected the Maddie page too.

**Next steps**
1. **Archive the 100%-off Stripe coupon Kari used to test the button on 9/4.** `allow_promotion_codes` is on, so the promo-code field is visible to the client too — a live free-money code is a $750 hole. Archiving one coupon does not remove the field or stop Kari making a fresh code later.
2. Write Andrea's Findings & Plan once the Look is done; it's the document that prices Phases 2 and 3.
3. Decide whether the 13-question read is worth generalizing into a CARES Works tool at `/tools/where-are-you-at` — it is the sharpest intake instrument in the repo and it is currently trapped in one client's page.
4. Add a secure uploader to `/floridagirl` if Andrea starts sending documents (reuse the Maddie `client-uploads` bucket pattern).

**Pending / frozen items**
- ~~`STRIPE_SECRET_KEY` unverified~~ — **VERIFIED 9/4** via `GET /api/floridagirl-deposit`: `stripe_configured: true`, `key_valid: true`, `charges_enabled: true`, `mode: live`, `charge_usd: 750`. Kari also completed a real checkout using a 100%-off coupon, which leaves a $0 completed session in the Stripe dashboard — not a payment from Andrea.
- A 100%-off coupon is live in Stripe from that test, and the promo-code field is shown to clients (Next step 1).
- Nothing writes a record when Andrea pays — no webhook handling, no row, no notification. Payment shows up in the Stripe dashboard only. `api/webhook.js` exists but was not touched or reviewed this session.
- The offer expires 2026-09-12. After that the page disables its own pay button until someone edits `EXPIRES`.
- Nothing on `/floridagirl` is saved server-side except uploaded files. The 13-question read and any answers are lost on refresh.
- Uploads land in `client-uploads` under the `andrea/` prefix. The bucket is private and upload-only (anon INSERT, no anon SELECT), so **nothing in the app can list or retrieve them** — retrieve via the Supabase dashboard or an authenticated client. Nobody is notified when a file arrives.
- The upload box is not gated behind payment or a token, unlike Maddie's. Anyone with the URL can upload. Acceptable for an unlisted client page; revisit if the URL spreads.
- Andrea's business name, industry, size, and entity type are all unknown. The page is deliberately written to work without them; fill them in only from what the Look actually turns up.
- The read-out is client-side only — nothing is saved, and answers are lost on refresh. Fine for a live meeting; would need a Supabase write if Kari ever wants the answers back.
- The other proposal pages (Marco, Maddie, Amy, ITA-BEL-KOO) have never been status-tracked — their live state, signature status, and payment status are unverified.

**Key files**
- `C:\dev\cares-works\public\floridagirl\index.html` (the whole proposal — page, read-out logic, and copy in one file), `cares-logo.png`, `kari-signature.png`
- `C:\dev\cares-works\vercel.json` (the rewrite allowlist — read before adding any static page)
- Note for cloud sessions: the sandbox's egress proxy blocks outbound HTTPS entirely, so a live URL **cannot** be curled to check a deploy (even `example.com` fails). Verify through the Vercel MCP tools instead, and test pages against a local static server with Playwright.
- `C:\dev\cares-works\src\pages\FractionalCFOScope.jsx` (the does / doesn't-do source of truth), `src\pages\BookkeeperScope.jsx`
- `C:\dev\cares-works\api\floridagirl-deposit.js` ($750 Look checkout — keep the cents amount in step with the page)
- `C:\dev\cares-works\public\proposals\maddie\index.html` (the pattern for Stripe + secure upload), `public\proposals\marco\`, `public\proposals\amy\`, `public\proposals\itabelkoo\`
- `C:\dev\cares-works\api\maddie-deposit.js`, `api\marco-deposit.js`, `api\webhook.js`

---

### Command Board
Kari's private live dashboard at `tools.caresmn.com/board` — her week, her unread inbox, who owes money, and milestone countdowns on one self-refreshing page. Recreates the "Mustard Board" Claude artifact natively, with our own OAuth, so it no longer depends on claude.ai or Claude's connectors. Built 9/7–9/8 from `docs/command-board-spec.md`.

**Built so far**
- ✅ Route `/board` in `src/App.jsx`, behind the same `if (!session)` gate as `/kari`.
- ✅ Four panels in `src/pages/CommandBoard.jsx`, on the neon system (`src/design/neon.jsx`, palette `N`) — white cards, neon outlines, blue/green:
  - **Week Ahead** — 7 days of Google Calendar, across every calendar ticked in her Google sidebar (not just `primary`), all-day + timed, a NOW marker, each event linking back to Google Calendar.
  - **Still Unread** — unread INBOX threads: sender, subject, snippet, relative age, an over-a-week flag, deep-linking to `mail.google.com/…/#inbox/<threadId>`. Tiles: unread / over a week / today.
  - **Who Owes You** — QBO A/R Aging Summary. Tiles for open A/R, current, past due; a proportional aging-bucket bar; top overdue customers; negative buckets flagged as unapplied credits rather than summed as debt.
  - **Milestones** — editable label + date rows from `board_milestones`. Seeded with Minuteman Press exit 2026-10-15 and Chasing Chickens launch 2026-10-28, under both of Kari's sign-ins.
- ✅ **The Kingdom** panel (added 9/8) — **23 hostnames**, derived from Vercel, against the house baseline. Latest scan: **22 of 23 up** (`www.karikounkel.shop` does not answer), ASK widget on 16, a working analytics tag on 9, a favicon on 8.
- ✅ **Minuteman Press exit checklist** — 49 tasks across 15 sections from the Desk Checklist PDF, all due 2026-10-15, in `board_work` as `source='minuteman'`. The section rides in `projects`, so the existing filter slices by it. `board_work` now holds **193 items, 149 open**.
- ✅ **The Work** panel (added 9/8, full width, first on the page) — the Everything Board's 108 cards and the Monday 7AM Rollout's 36 items, moved into `public.board_work`. 144 rows: 100 open, 44 done, 465 checklist sub-items. Buckets in priority order, filters by source and by project, checklists expand and tick in place, and work can be added, refiled and removed on the board itself.
- ✅ **The One List** panel (added 9/8, full width, first on the page) — the actual work. 65 items in 7 groups: 100 already built, 2 ticked, **45 left to do**, 18 parked. Ticking on the board writes the same `kari_tool_data` row the cockpit writes.
- ✅ Two entry points, so the board is never a remembered URL: an owner-only card at the top of `/dashboard` (gated to `kari@karikounkel.com` + `kari@caresmn.com`) and a `kari_cockpits` tile on `/kari`.
- ✅ Migration `sql/command-board.sql`, applied to `qcikhcnclduakriextsz`: `board_connections` + `board_milestones`, both RLS-on.
- ✅ Three Vercel functions under `api/board/`, deployed and probed on production: unknown panel → 400, missing or invalid session → 401, GET on a POST route → 405, forged OAuth state → 302 to `/board?board_error=bad_state`.
- ✅ Live on production: `dpl_BQC54k45H7SoXK5R2YbWB1KjSf7A`, `target: production`, `state: READY`, commit `23b059b`, aliased to `tools.caresmn.com`.

**Decisions**
- **The property list is DERIVED, never typed. This was got wrong once and it matters.** The first version was copied out of the asset ledger in `docs/standing-orders.html` — 14 rows — and `karikounkel.com` was not among them. Kari's own name, live, titled "Kari Kounkel", missing from the panel that claims to summarise the world. Her question was the right one: if the first list in the document is incomplete, why trust any other line of it. The list is now built from the systems that know, by one explainable rule: **every production hostname across every Vercel project, plus every registered domain no project claims.** 18 projects and 5 domains produce 23 rows. Re-running the sync preserves her declared `checks` by host and removes rows that no longer exist upstream.
- **What the typed list had missed**, all of it live: `karikounkel.com` (registered, and claimed by no Vercel project — it is served from somewhere outside this account), the `www.` variants of caresmn.com / keepstead.pro / scotthoglundart.com / karikounkel.shop, and four projects running with no custom domain at all — `flowsuite-pro`, `flowsuite-dac`, `marbleverse`, `marco-review`.
- **The Kingdom panel only knows about websites.** Services (the `hub` edge function, nine Supabase projects, Twilio, SendGrid, Stripe) and businesses without a site (The Hub Mpls) cannot appear in it, by construction. Anything that is not a hostname is outside the scoreboard's reach today.
- **Measured and declared are two different greens and are never added together.** `board_properties.probe` is written only by the scanner (`?panel=kingdom&scan=1`, which fetches every host and reports: does it answer, is there a real analytics tag, is the ASK widget on it, does it declare a favicon). `board_properties.checks` is written only by Kari (sign-in, password reset, transactional mail, payments) — no fetch can answer those. The panel scores them separately and labels the two halves. A single number blending "we looked" with "she said so" would be worse than no number.
- **A placeholder tag scores red, not green.** `scotthoglundart.com` ships `G-XXXXXXXXXX` — analytics that looks installed and records nothing. The probe reads measurement ids and rejects placeholders, putting the reason in the cell's tooltip. This is the whole point of a scoreboard: a false green is worse than a red.
- **Not applicable is a third state, and it leaves the denominator.** Declared cells cycle ? → ✓ → ✕ → n/a. Marking a static brochure site "n/a" for payments drops it from the total rather than counting it as a failure, so the score means something.
- **Scanning is opt-in.** Fourteen live fetches take seconds, so the panel serves the last recorded scan on load and only re-scans on the button. Costs no new Serverless Function — `data.js` already routes on `?panel=`, which matters at 10 of 12.
- **The baseline is four measured items and four declared ones**, not a wishlist. Anything that cannot be either measured or answered yes/no by Kari does not belong in the grid.

- **The work moved; the sources were not emptied.** Kari asked for the lists "moved into this new place". The Everything Board's Supabase and the Rollout Tracker's cockpit HTML are untouched — this is a copy until she says to retire them, because a one-way move of 144 items on the strength of one sentence is not reversible. `board_work` is unique on `(user_id, source, source_id)`, so re-running the import updates in place rather than doubling.
- **The import ran over the REST API, not through the chat.** The everything-board project's service key is not available locally, so the 108 cards were read via the Supabase MCP (which writes oversized results to a file) and pushed to cares-works with a service key pulled from Vercel, used, and deleted. The card text never passed through the conversation, and no second service key had to be stored anywhere.
- **Her user id differs between the two projects** — `d6831f92-…` on everything-board, `7ee067cc-…` here. Separate Supabase projects mean separate `auth.users`. Rows were remapped on import; anything else pulled from that project needs the same remap.
- **The Rollout Tracker's items had never been rows anywhere.** They were a JavaScript array (`const ITEMS`) inside the cockpit HTML in `kari_cockpit_html`, with a second object (`PREFILLED_TICKS`) marking 18 of the 36 done. Parsed out on import. Editing that cockpit's HTML no longer changes what the board shows.
- **`source = 'board'` exists so the board is not a read-only mirror.** Work added on the Command Board has no upstream list; without widening the check constraint, nothing new could be filed here at all.
- **Group columns are packed by hand, not by CSS.** `column-count: 2` refuses to break a group across columns, so a one-item Urgent group sat beside a twenty-item Focus group and left half a screen blank. Groups are now dealt into two columns by running item count.
- **Panels are presentational and take their rows as props.** `src/components/WorkPanel.jsx` owns no fetching, which is what allowed it to be rendered against a fixture of the real 144 rows and actually looked at in a browser before shipping — the login gate otherwise makes `/board` unviewable during development. `src/components/boardChrome.jsx` holds the shared Panel/Tiles/Quiet/ConnectState.
- **The One List has one source of truth, and it is the cockpit's own HTML.** `src/lib/oneList.js` parses `src/cockpits/the_one_list.html` — the very file `/kari/the-one-list` runs — into groups and items. Copying the 65 items into a table or a JS array would have created a second copy that drifts the first time Kari edits either one. Tick state reads and writes `public.kari_tool_data`, `tool_key = "the_one_list"`, shaped `{"<id>": 1}` — byte-identical to what the cockpit writes, so a box ticked in either place is ticked in both.
- **Done items stay on the board.** Kari's call, 9/8: "don't get rid of the stuff that's done either. i want to see some progress." Completed items render in place, struck through, and count toward the bar. Only *parked* collapses, behind a toggle, and it stays out of the "left to do" count.
- **Progress counts the work that never appears as a row.** The One List itemises only what is *left*; the 100 features already standing exist in the file solely as header stats. The bar therefore reads authored-built + her ticks over the authored total — 102 of 164, 62% — rather than 2 of 65, which would have shown a person with nothing to show for a year.
- **"Build backlog" was the wrong label for The One List.** It was described that way on 9/8 and Kari corrected it: 65 items with 2 ticked is 63 things to do, whatever they build. It is the largest concrete work list in the estate and it belongs on the board.
- **The browser never sees a provider token.** `board_connections` is RLS-enabled with **no policies at all** — which denies anon and authenticated outright, leaving only the service-role key used by `api/board/*` able to read it. Adding any policy to that table hands tokens to the browser.
- **Refresh tokens are encrypted at rest**, AES-256-GCM keyed off `BOARD_TOKEN_KEY`, stored as `v1:<iv>:<tag>:<ciphertext>`. The same key HMACs the OAuth `state`.
- **No token ever rides in a URL.** The connect button POSTs (authenticated) to `/api/board/auth`, which returns a consent URL carrying an HMAC-signed, 10-minute `state` holding the user id and provider. The callback trusts that signature, not the query string, so a forged state cannot attach someone else's Google account to Kari's row.
- **Ten functions is the ceiling, and we are at it.** The Hobby plan allows **12 Serverless Functions per deployment**; the repo already ran seven, and the first Command Board deploy failed with `exceeded_serverless_functions_per_deployment` at fourteen. The seven board routes were collapsed to three (`auth.js` takes `?provider=`, `data.js` takes `?panel=`, one `callback.js` serves both providers, with the feeds as plain functions in `_panels.js`). `lambdaRuntimeStats` on the live deployment reads `{"nodejs":10}`. **Any new `api/*.js` file spends one of the two remaining slots.** Files under `api/` whose names start with `_` are libraries, not functions, and cost nothing.
- **One redirect URI covers both providers** — `https://tools.caresmn.com/api/board/callback` — because the signed state already says which provider is answering. It is registered separately inside each provider's own console.
- **Token refresh uses UPDATE, never UPSERT.** A refresh payload carries no `refresh_token_enc`, and Postgres checks that column's NOT NULL while forming the proposed row — *before* `ON CONFLICT` is ever reached. An upsert would therefore have failed every refresh, roughly hourly. `saveConnection` (upsert) is for the initial connect only; `updateConnection` is for refreshes.
- **Countdowns count whole calendar days**, `Math.round` between two local midnights — the floridagirl lesson, applied. Milestone dates are stored as `date`, not `timestamptz`; a timestamp is what produces "8 days left" on a 7-day window. `Math.round` also survives the two DST days that are not 24 hours long.
- **Panels fail alone.** Every feed returns a body the page draws as a *state* — loading, error, or a connect/reconnect button — so a dead Google never blanks the receivables, and nothing throws up into the page. Each panel carries its own "as of h:mm" stamp and its own manual refresh.
- **Day-grouping happens in the browser, not the server.** Only the browser knows the viewer's zone. All-day events stay bare `YYYY-MM-DD` over the wire; converting them to timestamps server-side is what slides an all-day event onto the wrong day.
- **Gmail counts come from count-only queries**, not from pulling messages: the exact unread number from `labels/INBOX.threadsUnread`, plus two `maxResults=1` searches. Only 12 messages are fetched as metadata, and no message body is ever requested.
- **Multi-client from day one.** Everything is keyed `(user_id, provider)`, so a second client connecting their own Google/QBO is a new row, not a new table. The client edition ships Calendar + QBO + Milestones only — Gmail's restricted-scope CASA assessment is not worth it until a paying client.
- Google consent runs in **Testing** mode, which expires refresh tokens after ~7 days. That surfaces as `invalid_grant`, is recorded on `board_connections.last_error`, and renders as the panel's "Reconnect Google" state. Publishing to production is a later decision (Calendar verification is light; Gmail triggers the heavy restricted-scope review).

**Where secrets live**
- Vercel project env, all three environments, never in the repo: `BOARD_TOKEN_KEY` (generated 9/8 — encrypts refresh tokens and signs OAuth state), `QBO_ENV` (= `production`), plus the pre-existing `SUPABASE_URL` / `SUPABASE_SERVICE_KEY`.
- **Not yet set:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`. Those come out of a Google Cloud project and an Intuit developer app that do not exist yet.
- Encrypted refresh tokens live in `public.board_connections`, readable only by the service-role key.

**Where it stopped**
9/8, morning: three things Kari called out, all done and live on `c2da2be`.
(1) The property list is derived from Vercel instead of typed from a doc — 14 rows to 23, `karikounkel.com` included. (2) The Minuteman exit checklist is in: 49 tasks, 15 sections, due 10/15, with the "NAME the designated person(s)" blocker filed urgent. (3) Panel order restored — the four live feeds sit at the top again, with Work, One List and Kingdom beneath them.

9/8, overnight (later): The Kingdom panel shipped — fourteen properties, four measured columns and four declared ones, on commit `eda091f`. The first scan is already stored, so the grid is populated on first open rather than making Kari wait on fourteen fetches. Verified in a browser against the real rows: 37/56 measured green, the declared cells cycle, and n/a leaves the denominator.

9/8, overnight: the work lists moved in. `public.board_work` holds 144 items — 108 Everything Board cards (82 open) and 36 Rollout items (18 open) — and The Work panel shipped with add / refile / remove and tickable checklists. Live at `dpl_7UiZCnQ54kvpRjk3bWJu2J1o9wiL` on commit `ddc22db`, still 10 functions. Verified in a browser against the real rows before shipping: counts, checklist expansion, the source and project filters, adding an item, and the mobile layout.

9/8, later: The One List panel shipped — `dpl_8gv2QS9d6bnR8DBtg7AqMGDZ4BSD`, `target: production`, `READY`, commit `ee6dcc4`, still 10 functions. The board now opens on 45 things to do and a 62% progress bar instead of an empty desk.

9/8: everything that does not require Kari's Google and Intuit accounts is built, merged to `main`, and live on production. `/board` renders, the Milestones panel works on real data, and the three OAuth-backed panels render their "Connect Google" / "Connect QuickBooks" state because no client credentials exist yet.

The session also got ahead of itself once: Kari was asked to pick a QuickBooks company and a secret-handover method before she had been told what was built or what state anything was in. Build status first, decisions second.

**Pending / frozen items**
- **`www.karikounkel.shop` does not answer.** The apex serves fine; the `www.` does not. Anyone typing the www form of the store reaches nothing.
- `karikounkel.com` is the least-instrumented property in the estate: no analytics, no ASK widget, no favicon — and no Vercel project claims it, so it is served from somewhere this inventory cannot see.
- `kounkel.com` responds but is not among the five registered domains on the Vercel account. Ownership unverified; not added to the list.
- `marco-review.vercel.app` reports into `G-LQZGMT7X4Y`, the same stream as `founders.caresmn.com`. Standing Orders already raises whether that separation is deliberate.
- The Hub Mpls has five open cards and no web property anywhere in the Vercel account. Whether it should have one is undecided.
- **The declared half of the Kingdom grid is entirely unanswered** — 0 of 56 cells. Sign-in, password reset, transactional mail and payments are unknown for all fourteen properties until Kari ticks them. The measured half is filled in.
- What the first scan turned up, unresolved: `scotthoglundart.com` has a placeholder analytics id; `keepstead.pro` and `chickens.karikounkel.com` carry neither analytics nor the ASK widget; eight of fourteen properties declare no favicon; `karikounkel.shop` and `accounts.karikounkel.com` both report `G-WHKMKCD1SD`, i.e. the shop's traffic lands in the CARES Works stream rather than its own. Standing Orders already flags the same question about MARCO's `G-LQZGMT7X4Y`.
- The scan is manual. Nothing runs it on a schedule, so the grid is as fresh as the last time someone pressed the button.
- The baseline is not yet written down anywhere as prose — it exists only as the eight columns in `src/components/KingdomPanel.jsx`. Standing Orders is where a conventions page would belong.
- Nothing turns a red cell into a `board_work` row yet; the scoreboard and the work list do not talk to each other.
- The Everything Board (`everything.karikounkel.com`, Supabase `iwrrkhzjfjlgpqmzlxqb`) and the Rollout Tracker cockpit **still hold their own copies**. Nothing decides which is canonical yet, so edits made in either of those places will not reach the board, and vice versa. Retiring them — or turning `everything.karikounkel.com` into a second front end over `board_work` — is undecided. Card `s7dex1vr`, "Keepstead — Phase 2 Migrate Everything Board", is the card this was.
- Re-running the import would overwrite board-side edits to imported rows with whatever the old sources still say, because the upsert takes the source as truth. It is safe to re-run only while the sources are considered canonical.
- The Work panel has no search, no due-date editing, and no way to add a checklist item to a card — only to tick the 465 that came across. Titles cannot be edited after they are added.
- `board_work.links` came across (0 rows carry any) and is not rendered anywhere.
- Week Ahead and Still Unread show their connect state until a Google Cloud project exists (OAuth consent screen in Testing, Kari as a test user, scopes `calendar.readonly` + `gmail.readonly`, redirect `https://tools.caresmn.com/api/board/callback`) and its two credentials are set on Vercel. The consent-screen app name in the spec is **Command Board**.
- Who Owes You shows its connect state until an Intuit developer app exists with that same redirect URI and its two credentials are set on Vercel.
- Which QBO company the A/R panel reads is decided at Intuit's consent screen; whichever is picked gets stored as `realm_id`. Kari noted on 9/8 that she already has to reconnect QuickBooks whenever she switches customers — so one stored company may be the wrong shape for how she actually works. Unresolved.
- Google Testing mode expires the refresh token about weekly; the panel will ask to reconnect roughly that often until the consent screen is published.
- Nothing notifies anyone when a connection expires. It is visible only by opening `/board`.
- The A/R parser is written against QBO's `AgedReceivables` report shape but has never run against a real response, because no QBO app exists yet. Column detection (`Current` matched by name, total taken as the last column) is the part most likely to need adjusting on first contact.
- Milestones are per-user rows; the two seeded ones exist separately under each of Kari's two sign-ins, so editing one account's copy does not change the other's.
- The email allowlist (`OWNER_EMAILS` in `src/pages/Dashboard.jsx`) gates the *card*, not the page. `/board` itself is reachable by any signed-in user, who would see their own empty milestones and unconnected panels. Tightening that is a decision, not a bug.
- `/board` carries the ASK widget (`chat.karikounkel.com/widget.js`) and the CARES IP footer. Analytics and SMS provider names were never confirmed, so nothing analytics-related was wired.

**Key files**
- `C:\dev\cares-works\docs\command-board-spec.md` (the build spec this was written from)
- `C:\dev\cares-works\sql\command-board.sql` (applied — `board_connections`, `board_milestones`)
- `C:\dev\cares-works\src\pages\CommandBoard.jsx` (all five panels)
- `C:\dev\cares-works\sql\board-properties.sql` (applied — `board_properties`, seeded from the Standing Orders asset ledger)
- `C:\dev\cares-works\src\components\KingdomPanel.jsx` (the scoreboard — the eight baseline columns are defined at the top of this file)
- `C:\dev\cares-works\api\board\_panels.js` (`kingdomPanel` — the scanner, including the placeholder-id rule)
- `C:\dev\cares-works\sql\board-work.sql` (applied — `board_work`, plus the widened source constraint)
- `C:\dev\cares-works\src\components\WorkPanel.jsx` (The Work — presentational, takes rows + callbacks), `src\components\boardChrome.jsx` (Panel/Tiles/Quiet/ConnectState)
- `C:\dev\cares-works\src\lib\oneList.js` (parses the cockpit HTML into items + progress stats), `src\cockpits\the_one_list.html` (the list itself — edit the items HERE, nowhere else)
- `C:\dev\cares-works\api\board\_lib.js` (session check, AES-256-GCM, signed state, token refresh), `_panels.js` (the three feeds), `auth.js`, `callback.js`, `data.js`
- `C:\dev\cares-works\src\App.jsx` (the `/board` route), `src\pages\Dashboard.jsx` (`OWNER_EMAILS` + the Command Board card)

---

### Invoices (the invoice maker)
`tools.caresmn.com/invoices` — one place to invoice from any of Kari's businesses. Pick who it's from, click what it's for, and the invoice puts on that brand's face: logo, colors, the picture across the top, the remit address, the bank details. Built 9/8. Separate from the ProGraphics ledger, which keeps its own invoices, numbering and register.

**Built so far**
- ✅ Migration `sql/invoice-maker.sql`, applied to `qcikhcnclduakriextsz`: `invoice_brands` + `invoice_docs`, both owner-scoped RLS (`auth.uid() = user_id`).
- ✅ Brands, all editable in the app: **CARES Works** (neon blue `#0080ff`, `CW-`), **CARES Consulting** (its own neon mark, `/cares-consulting-neon-logo.png` at 250px, blue `#0b63d6`, `CC-`), **K Co LLC** (the parent entity — K Co Creative mark at 250px, pink `#e0186a`, `KC-`; renamed from "Kari Kounkel" on her instruction 9/8), **Ladybug, Ladybug** (its own cover leading at 260px, crimson `#a00000`, ivory paper, Playfair, `LB-`). **Court of Accounts was seeded and then removed** — Kari 9/8: "that's a book of fiction .. not an entity in my domain." Checks are payable to **CARES Consulting Inc** on every brand but K Co LLC, because that is the name on the bank account.
- ✅ `/invoices` (`src/pages/InvoiceMaker.jsx`) behind the same `if (!session)` gate as `/board`: brand tiles, purpose presets, bill-to, lines, discount, tax, note, pictures, payment-lane switches, live preview, copy-link, mailto draft, "check came in" / "ACH landed", duplicate, delete. Also the brand editor — colors, fonts, logo and header uploads, ACH and remit details, terms, numbering, and the preset list.
- ✅ `/inv/<token>` (`src/pages/InvoiceDocPublic.jsx`) — no login, reachable above the auth gate, same as `/i/<token>`. Prints to PDF.
- ✅ `api/invoice-checkout.js` — Stripe Checkout with `card` + `us_bank_account`. `GET` is the floridagirl-style health check. **Verified live 9/8**: `key_valid: true`, `charges_enabled: true`, `mode: live`, and a real `cs_live_…` session created from a test invoice, showing both Card and US bank account under "K Co LLC | CARES Consulting Inc".
- ✅ `api/webhook.js` handles `metadata.kind = "invoice-doc"` and marks the row paid. The Stripe endpoint `we_1TMdnTEOQJdY217b68GFt1Dw` had `checkout.session.async_payment_succeeded` **added on 9/8 with Kari's say-so** — without it, bank debits would have settled days later with nothing listening.
- ✅ Live on production: `dpl_BSEeHztBNUcmxLkHUuQWLAN7YbNA`, `state: READY`, commit `d9c698f`.

**Decisions**
- **A brand is a row, not a case in a switch.** Colors, logo, header image, fonts, remit address, bank details, which lanes are on, and the presets all live in `invoice_brands`. A new business is a new row. Nothing about any business is compiled into the code.
- **One component renders both the preview and the customer's page** (`src/components/InvoiceSheet.jsx`). If they were two components they would drift, and then the preview would be lying about what the customer sees.
- **Numbers come from `next_invoice_doc_number()` under a `for update` row lock**, with a unique index on `(brand_id, number)` behind it. This is the 8730 collision — invoice numbers reused across three customers — deliberately not repeated.
- **A draft has no page.** `get_invoice_doc` returns null for a draft, so a link pasted early resolves to nothing rather than to a half-written invoice. Numbering happens at "make the link", not at save.
- **The browser never names the price.** `api/invoice-checkout` reads the amount off the row with the service key; the page sends only a token.
- **`tax_rate` is `numeric(9,6)`.** At `(6,4)` it stored 9.025% as 9.03% and overcharged the test invoice nine cents. Found in a browser, not in review.
- **A completed Checkout session is not payment.** Bank debits arrive `unpaid`/`processing`; only `payment_status = 'paid'` marks the invoice paid.
- **One Stripe account for now** (Kari 9/8: "I use one bank account"). `invoice_brands.stripe_account_ref` exists unused so per-brand keys can be added later without a migration.

**Where it stopped**
9/8. Everything customer-facing was checked on production: the page renders, stamps viewed, prints, and the three payment lanes appear. The maker screen at `/invoices` has **not been seen rendered** — it is behind Kari's login, her Chrome extension is not connected, and building a way around the auth gate was correctly blocked. It compiles and deploys; it has not been watched working.

**Next steps**
1. Pull this year's invoices in. Kari, 9/8: "we're going to have to pull in some invoices for this year… i've had a very unofficial system." Where they live has not been established — that is the first question, then a bulk insert into `invoice_docs` (the shape is one row per invoice, `line_items` as `[{desc,qty,price}]` in dollars).
2. Remit addresses and bank details are blank on all four brands, so the check and ACH cards do not print yet.
3. Sending is copy-link or a `mailto:` draft. There is no send-and-log path like the ledger's `send-invoice-email`.

**Pending / frozen items**
- No invoice is emailed from the app, so nothing logs a send; `sent_at` is set by the "make the link" button, not by an actual send.
- Nothing tells Kari when an invoice is opened or paid — it is visible only by opening `/invoices`.
- Partial payments can only be recorded as paid-in-full from the UI; `amount_paid_cents` supports part-payment but nothing writes a partial except Stripe.
- `/invoices` is reachable by any signed-in user, who would see their own empty list — the same shape as `/board`.
- These invoices are not in the ProGraphics ledger and not in any books. Nothing posts them to a register, and no sales tax is filed off them.
- Presets seeded with `price: 0` except The Look ($750), because no other prices were established.

**Key files**
- `C:\dev\cares-works\sql\invoice-maker.sql` (applied — `invoice_brands`, `invoice_docs`, `get_invoice_doc`, `next_invoice_doc_number`)
- `C:\dev\cares-works\src\components\InvoiceSheet.jsx` (the invoice itself — the look lives here, driven entirely by the brand row)
- `C:\dev\cares-works\src\pages\InvoiceMaker.jsx` (the maker and the brand editor)
- `C:\dev\cares-works\src\pages\InvoiceDocPublic.jsx` (`/inv/<token>`)
- `C:\dev\cares-works\api\invoice-checkout.js` (Stripe session + health check), `api\webhook.js` (marks it paid)
- `C:\dev\cares-works\src\App.jsx` (the `/invoices` and `/inv/` routes)
