# The FlowSuite Decision — 2026-09-06

Read-only comparison of the two FlowSuite databases, measured against
*The Sovereign Creator Blueprint v3.0*, sections 1 and 3.

Every figure below is a real `count(*)` executed against the live databases.
Postgres row estimates were not used and disagree materially — they are what
led an earlier pass to call ScanFlow and DAC empty shells. They are not.

**The full write-up is a private artifact, not a file in this repo.** It names
specific tables that currently have row-level security disabled, and this
repository is public; a Supabase project ref plus an anon key plus a published
list of unprotected tables is a working roadmap. This document carries
everything except that list. Section 5 below is deliberately generalised.

---

## Verdict

Pro is the product. Legacy is an archive with a domain attached.

Legacy is not a clean delete: two bodies of data never made the crossing, and
one of them is 108 contract sections.

## 1 · Head to head

| | FlowSuite Pro | FlowSuite Legacy |
|---|---|---|
| Project ref | `mqnvaiijuwqmkonnhlnw` | `keegxjuckohhtxllqxak` |
| Tables | 220 | 75 |
| Populated | 140 | 46 |
| Rows | 12,733 | 3,981 |
| Organisations | 3 | 1 |
| People | 51 profiles | 19 employees |
| Newest write | Aug 3 | Jul 21 |
| Last prod deploy | Aug 25 | Jul 18 |
| Custom domain | none | `flowsuite.caresmn.com` |

Legacy's activity is not evenly stale. Content tables stopped in February and
March, people tables in April, and exactly one table (`moneyflow_tasks`) was
touched on July 21. That is a database somebody visited once, not one still in
service.

## 2 · The three sellable modules

**FlowSuite Ledger — $199/mo — scattered across three homes.**
In Pro: `chart_of_accounts` 239, `iif_je_history` 640, `budget_cells` 1,452,
`ap_aging_lines` 217, `cc_purchases` 148, `je_entries` 1, `je_entry_lines` **0**.
The double-entry engine is scaffolded and has never posted a line. The working
ledger — 3,433 posted entries, reconciled to statements — is
`src/pages/LedgerWorkspace.jsx` in this repo, built for ProGraphics. Plaid is in
neither database: its edge functions are deployed on cares-works and its secrets
were never set.

**FlowSuite Compliance — $99/mo — documents real, mechanism unused.**
In Pro: `employee_documents` 116, `employee_union_memberships` 15,
`union_cba_documents` 1, `org_unions` 2, `ice_packet_tokens` **0**.
The token handed to an ICE or DOL auditor is the entire pitch, and none has ever
been issued. The demo is a story rather than a click-through.

**FlowSuite Accountability — $149/mo — the one that is actually built.**
In Pro: `discipline_records` 29, `discipline_signatures` 96,
`discipline_reviews` 18, `discipline_status_history` 27,
`discipline_ladder_steps` 12, `separation_records` 8, `separation_tasks` 59.
Real records, real signatures, a configured ladder, a working separation flow.
Its blocker is not code — the blueprint pairs it with *Culture Under
Construction* and requires a workbook purchase. That book is unwritten.

## 3 · Correction: QuickBooks OAuth exists

The written record states there is no live QuickBooks connection anywhere and
that no page may imply one. That holds for cares-works. It does not hold for
FlowSuite Pro, which carries `org_qbo_connections` (1 row),
`qbo_app_secrets` (1) and `qbo_oauth_states` (13). The connection row has the
full shape of a real integration: `realm_id`, `access_token`, `refresh_token`,
`expires_at`, `scopes`, `last_synced_at`, `last_sync_status`.

Thirteen OAuth states means the handshake ran at least thirteen times. Whether
the surviving connection is live, expired or a sandbox artefact was not checked,
and no token was read.

## 4 · What crossed, and what did not

Pro carries a set of `legacy_*` tables whose counts match Legacy's originals
exactly. That is a deliberate, completed export.

| Data | Legacy | In Pro | Status |
|---|---|---|---|
| cashflow_ap | 104 | 104 | migrated exactly |
| cashflow_snapshots | 31 | 31 | migrated exactly |
| cashflow_pl | 29 | 29 | migrated exactly |
| cashflow_ar | 16 | 16 | migrated exactly |
| iif_account_map | 21 | 21 | migrated exactly |
| payroll_payment_orders | 3 | 3 | migrated exactly |
| iif_je_history | 646 | 640 + 529 | migrated, superset |
| coa_accounts | 326 | 239 + 325 | migrated, restructured |
| employees | 19 | 51 profiles | superseded |
| mileage_logs | 77 | 69 submissions | reshaped — verify |
| standing_deductions | 50 | 25 + 45 | reshaped — verify |
| **contract_sections** | **108** | 1 CBA doc | **did not cross** |
| **job_sleeves** | **1,067** | 305 | **history left behind** |
| **stations** | **1,000** | 48 | **history left behind** |
| products / categories | 13 / 7 | none | no equivalent |

The financial core crossed cleanly and the people moved to a better model. What
stayed behind is 108 contract sections — the union contract broken into clauses,
which is the raw material the Compliance module is sold on — and roughly two
thousand rows of print-shop scan history.

## 5 · The security item (generalised)

Legacy has row-level security disabled on 43 tables, 26 of which hold rows.

The characterisation in earlier notes — nineteen people's payroll wide open —
overstates it. The most sensitive personnel tables are protected: `employees`,
`disciplines`, `onboarding`, `standing_deductions` and `employee_requests` all
have RLS on. What is unprotected and populated is a smaller, more specific set
of seven tables holding fewer than ninety rows of personal data, alongside about
3,400 rows of operational and financial data with no personal content.

Small in volume, not small in kind: two of those seven concern separations and
payroll notes about named people.

Pro's own exposure is four `_bak_*` snapshot tables holding 530 rows, left over
from a July 20–21 migration. Same fix, much lower stakes.

The reason this has not been patched is real: enabling RLS without policies
locks the application out. On a live database that is an outage. On a dormant
one it is not.

**The specific table names are in the private artifact, not here.**

## 6 · What this adds up to

Not a recommendation to act — a statement of what is coupled to what.

1. **Export `contract_sections` and the scan history out of Legacy.** 108 clauses
   and ~2,000 scan rows. The clauses matter most; they exist nowhere else.
2. **Retire Legacy.** Closes the RLS exposure without an outage, because there is
   no live app to lock out. Drops one Supabase project.
3. **Move `flowsuite.caresmn.com` onto Pro.** The platform licensed at
   $199–$499/mo demos on a `.vercel.app` subdomain while the dormant copy holds
   the real name. Blocked only by step 2.
4. **Settle where the Ledger lives.** Either the ProGraphics ledger moves into
   Pro, or FlowSuite is redefined as the umbrella and the ledger is licensed from
   cares-works. Both are defensible. A sales sheet naming one and a codebase
   being the other is not.
5. **Issue one I-9 token.** The Compliance module's entire pitch, currently at
   zero.

## 7 · Open questions

| Question | Why it is open |
|---|---|
| Is the QBO connection live? | Tokens deliberately not read; `last_sync_status` unchecked. |
| Who are the two paying clients? | Pro holds 3 orgs; the blueprint says two pay. Not matched up. |
| Is the DAC tenant a client or a build? | 15 clients, 796 incidents, 73 goals — real usage, unknown commercial status. |
| Did mileage and deductions cross correctly? | Counts are close but reshaped. Needs a row-level check, not a count. |
| What does Legacy's app still serve? | Its Vercel project deployed Jul 18. Nobody has confirmed no human still opens it. |

---

**Method** — all counts are `count(*)` against the live databases on 2026-09-06.
**Not read** — no access token, refresh token, employee record, payroll figure or
document body was opened. Table names and row counts only.
