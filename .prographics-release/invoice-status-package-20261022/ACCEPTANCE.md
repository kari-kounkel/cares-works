# ProGraphics invoice release acceptance — October 22, 2026

Live: https://tools.caresmn.com/prographics  
Deployment: `dpl_FjduJ44oQjydBx5XqPM33RyYXKs1`  
Application source: `.prographics-release/guarded-6383746e-cb23-4bb3-861c-39772d14c6c0`  
Email function: `send-invoice-email` version 13, JWT verification retained.  
Installed migrations: `20261022134458_prographics_invoice_workflow_events`, `20261022140444_prographics_legacy_paid_evidence_guard`.

## Release decision

Invoice functionality is live and passed protected-candidate and independent live acceptance. **A release-audit exception remains:** the basic smoke wrapper initially omitted its read-only flag, allowing the existing automatic bank sync to run. It added seven genuine feed rows and three provider-removal notices. All seven new rows remain unposted, unreconciled and unlinked to payments/invoices. They were preserved for controller review. No existing bank rows were deleted or changed. Subsequent complete live verification used mandatory bank-sync blocking; counts remained 844 bank rows and 10 provider events.

The basic smoke function now forces read-only mode by default; an isolated boundary regression proves bank sync and financial posting are blocked while report reads remain allowed. The application’s ordinary bank-feed functionality is preserved. This incident is not represented as authorized live bank-feed acceptance.

## 1. Complete legacy mapping

Raw stored records: 5,841 invoices and 756 orders (6,597 total), plus four unchanged historical read overlays. No legacy database status was bulk rewritten. Full counts and conditional mappings are in STATUS-MAPPING.json.

| Original invoice status | Count | Evidence-based display |
|---|---:|---|
| draft | 2 | IN PROGRESS |
| in_progress | 5 | 1 IN PROGRESS, 3 SENT, 1 VIEWED; existing delivery timestamps take precedence |
| sent | 11 | 10 SENT; 1 PAID from existing full payment records |
| viewed | 5 | VIEWED; original tracking evidence retained and flagged |
| paid | 5,761 | PAID; unsupported original assertions explicitly flagged |
| void | 57 | Preserved archival disposition, outside the four active statuses |

Code-only `issued` maps to IN PROGRESS unless stronger payment/delivery evidence exists. Derived `Partial` is no longer a separate status: remaining balance is shown with SENT/VIEWED from actual delivery evidence. Missing delivery evidence requires review. `Draft` is IN PROGRESS. Order-only Historical (753), Invoiced (2), Order (1), PO sent and deleted-order guards remain separate and unchanged. Historical supplements retain their source identifiers and lookup/copy behavior.

## 2. Exceptions and historical protection

- 5,746 original PAID invoices lack recorded allocations; original PAID assertions and amounts remain, with unknown bookkeeping balances and review flags. This includes 54 outside the archive-date heuristic; they were not guessed back into unfinished work.
- Ten SENT records lack original sent dates; no dates were invented.
- Twelve original view timestamps, including five raw VIEWED invoices, came from the prior page-open tracker and do not prove customer identity. Original dates/events are retained. New verified click events are recorded separately.
- Supplemental historical records without an editable source invoice row remain searchable/copyable; unsupported monetary changes require source/controller review.
- Applied/refunded credits and payments lacking verified posting relationships require controlled reallocation review.
- Historical invoices do not generate journals, revenue or current bookkeeping AR. Existing source accounting journals and relationships remain authoritative. The 756 orders remain separate.

## 3. Save failure and correction

Confirmed failure paths included zero-value hydration becoming blank, validation errors away from Save, status-dependent update restrictions, and best-effort email updates whose database errors were ignored. The October 16 inline item/description/price correction and zero-price preservation remain. The exact cause of Dave’s never-saved original Key Guys draft cannot be proven from a missing record; no claim is made that he omitted prices.

The scoped save operation now supports unfinished work, preserves input on failure, returns explicit success/actionable errors, checks the opened revision fingerprint, and verifies persisted values. Existing customer, description, quantity, price, tax, PO reference, shipping, artwork, notes and payment-term behavior is retained. Save never resends email. Actual Dave-role new invoices with both prices filled in saved successfully, survived reopen/edit/refresh, and did not duplicate on double click.

## 4. Transitions and paid revisions

IN PROGRESS follows an unsent save. Successful server-acknowledged email or attributed external delivery records SENT. Anonymous links record VIEWED only on the explicit View Invoice button; signed-in organization staff are excluded. Initial page loads and previews do not count. Existing first dates are retained; repeats do not overwrite them. PAID derives from recorded full allocations and takes precedence over delivery/view events; unsupported legacy PAID remains a flagged source assertion.

Supported paid corrections retain original invoices in immutable revision snapshots, retain original payment allocations/journals, and use separate adjustments through the existing cash-book posting engine. Price decreases create supported customer credit; increases reopen the supported remaining balance using actual delivery evidence. Taxes, credit provenance and closed periods are verified. No new accounting engine, database migration to another system or Lite activation occurred.

## 5–6. Acceptance matrix

| Check | Result / scope |
|---|---|
| All four statuses editable/saveable | PASS — hosted browser with current isolated database, Dave’s actual verified role |
| Partial/final payment, paid amount correction, credit/tax adjustment | PASS — original engine in isolated clone; no production financial test transactions |
| Closed-period protection, duplicate payments/saves | PASS — isolated original-role SQL tests |
| Actual Dave unfinished and filled-price create/save/reopen/edit/refresh | PASS — protected candidate and live, marked nonfinancial invoices only |
| SENT/VIEWED edits, payment terms, cancellation, input retention | PASS — hosted SQL/browser and live nonfinancial checks |
| Actual provider email, stable replay, explicit customer view | PASS — one authorized real send to kari@karikounkel.com; BCC also Kari; replay returned the original receipt without another send |
| Failed/ambiguous provider outcomes do not falsely mark SENT or permit blind retry | PASS — isolated provider-boundary and SQL tests; not represented as live provider rejection |
| Kari/Betty/Dave permissions, nine destinations, Notebook/Register, reconciliation access | PASS — complete protected and fresh live role suites; no administrator grants |
| Reports/CSV, invoices and packing-slip PDF/printing paths | PASS — all three actual roles; physical printer not exercised |
| Shared CARES/Minuteman routes and assets | PASS — canonical build and fresh live full smoke; unrelated runtime files byte-identical |
| Legacy exception display | PASS — actual Dave read-only browser verification; original records unchanged |
| Original integrity and fixture cleanup | PASS — all 6,597 stored documents, 16 payments, 271 journals/546 GL lines and existing roles unchanged; no marked test invoices remain; immutable audit retained |
| Original bank population | PASS — all 837 original entries, 246 original inbox rows and 7 original provider events retain exact content hashes |
| Release process bank-import restriction | EXCEPTION — seven real unposted arrivals and three provider-removal notices ingested by automatic sync before harness hardening; retained for review |

Original save/contact tests, helper status/retry tests, isolated SQL lifecycle/tax/period/isolation checks, provider-boundary tests, guarded migration/empty rollback/reapply, legacy evidence projection, and mandatory-read-only regression all pass. Financial tests use the isolated 45-table recovery clone with original grants/RLS and authenticated role verification. No real charges, refunds, check issuance or tax submissions were performed.

## 7. Publication and verification

Canonical `tools/mmp-release.mjs` built isolated source, validated Production configuration and preserved shared-product files, tested the protected candidate, and promoted that exact candidate. Initial post-publication harness interruptions were retained in the receipt; complete independent live suites subsequently passed on the same deployment. A final full suite passed with mandatory read-only base smoke enabled. No blind republishing or old-preview link is used as acceptance.

`SCOPE-PROOF.json` verifies the four intended invoice runtime files and byte-identical remaining app runtime files. `SOURCE-HASHES.json` ties packaged source to the published modules. Private session/export files are not included; test sessions were revoked locally without signing out real staff.

## 8. Remaining issues / recovery

Controller review remains for the seven newly ingested bank rows, three provider-removal notices, legacy allocation/delivery exceptions, and preexisting source-accounting discrepancies (including invoice discrepancies, bank overlaps, CorTrust differences, cleared entries lacking legacy reconciliation IDs and unsupported opening balances). None were silently corrected, posted or reconciled. Signed-out staff deliberately clicking an anonymous link cannot be distinguished from a customer; this follows Kari’s chosen policy. Live bank/card hardware and physical-printer acceptance remain separate, not claimed passed.

Application rollback baseline is `dpl_CMLTYb519vhFEmbnP8GCwrJBnBam`, exact source `.prographics-release/guarded-1feeef53-2c3a-4eb9-a7c9-c747e77b1430`, through the canonical guarded process with current unrelated files preserved. Keep additive backend evidence and all later business records. Empty-only SQL rollback was tested against all 45 original table hashes and refuses populated invoice evidence; it is not a safe automatic production reversal after use. Financial revisions require explicit compensating corrections, never journal deletion or a stale database restore. Private recovery evidence lives in `.prographics-release/invoice-status-20261022/current-clone` and related audit files.

Command Board remains unchanged because automatic review previously rejected that separate write; no indirect retry occurred.
