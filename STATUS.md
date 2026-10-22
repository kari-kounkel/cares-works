## ProGraphics invoice workflow — October 22, 2026 — LIVE ACCEPTED; AUDIT EXCEPTION

**What / where:** https://tools.caresmn.com/prographics, deployment `dpl_FjduJ44oQjydBx5XqPM33RyYXKs1`, exact source `.prographics-release/guarded-6383746e-cb23-4bb3-861c-39772d14c6c0`. Source/tests/report/recovery package `.prographics-release/invoice-status-package-20261022`. Previous app rollback `dpl_CMLTYb519vhFEmbnP8GCwrJBnBam`, source `.prographics-release/guarded-1feeef53-2c3a-4eb9-a7c9-c747e77b1430`.

**Built:** Four invoice states IN PROGRESS / SENT / VIEWED / PAID; unfinished and repeated save, explicit success/actionable errors, current-revision checks, retained zero/positive prices and inline item/description/pricing, editable permitted fields and payment terms in all states. Actual delivery or external-send evidence drives SENT; explicit anonymous View Invoice click drives VIEWED, signed-in staff excluded. First dates retained, PAID precedence, idempotent sends/payments, no save-triggered resend. Supported paid corrections use original cash-book engine with attributed before/after snapshots and separate tax/revenue/customer-credit adjustments; original payments/journals retained. Original old draft failure cannot be proved without its unsaved record; actual Dave filled-price Key Guys create/edit/reopen/refresh now verified.

**Legacy / protection:** No bulk legacy rewrites or historical-invoice posting. Raw 5841 invoices + 756 separate orders; four history overlays retained. All 5761 original raw PAID retained; 5746 lack allocations and stay explicitly unverified with unknown balances, including 54 outside archive-date heuristic. Five raw in_progress records display from actual evidence (1 IN PROGRESS, 3 SENT, 1 VIEWED); 11 SENT map 10 SENT/1 PAID from actual full receipts. Original 12 view timestamps and ten missing sent dates remain review items. VOID archive and synthetic-history lookup/copy preserved. No new app, branding, database, Lite activation or accounting engine. Four invoice runtime files changed; remaining runtime files, including other apps, byte-identical.

**Installed:** Supabase `20261022134458_prographics_invoice_workflow_events` and `20261022140444_prographics_legacy_paid_evidence_guard`; send-invoice-email v13, JWT verification retained. Package migration filenames use installed MCP versions; frozen candidate source retains the earlier CLI-generated timestamps. Anonymous invoice edits and forged staff provider receipts denied; existing roles unchanged.

**Verified / stopped:** Canonical fresh source build, protected candidate full shared/three-role/invoice gates, exact-candidate promotion, independent complete live suites all passed on the same deployment. Initial harness interruptions preserved, not hidden; no blind republish. Actual Kari/Betty/Dave navigation, Notebook/Register/reconciliation access, reports/CSV, invoice and packing-slip PDF preserved. Hosted financial lifecycle/tax/period/credit/isolation tests used the current 45-table local recovery clone and actual verified roles. Live tests used marked nonfinancial invoices, all removed, plus exactly one authorized real provider send to kari@karikounkel.com (BCC same). Same send replay returned original receipt, no extra send. Test-only sessions revoked locally. Original 6597 documents, 16 payments, 271 journals/546 GL and roles unchanged; no live charges/refunds/check/tax transactions for testing.

**Release-audit exception — preserve and disclose:** The base smoke wrapper omitted CARES_SMOKE_READONLY initially, so the unchanged application auto-sync ran during acceptance. Seven genuine bank-feed rows and three provider-removal notices arrived at approximately 13:49 UTC. All original 837 entries, 246 inbox rows and seven preexisting provider events retain exact content hashes. The seven new rows are unposted/unreconciled and unlinked to payments/invoices; no original bank row was deleted. They remain real evidence for controller review, not test data to erase. Basic smoke now forces read-only mode; wrapper sets it too. Isolated regression proves default sync/financial-write blocking, and the final complete live suite left bank/provider counts at 844/10. Private row-level incident evidence `.prographics-release/invoice-status-20261022/bank-sync-incident.private.json`. Do not claim this as authorized bank-feed acceptance.

**Decisions / pending:** Anonymous explicit click is Kari's chosen policy; signed-out staff cannot be distinguished from a customer. Remaining controller review: seven new arrivals/three removal notices, unsupported legacy allocations/delivery dates, applied/refunded-credit reallocations and inherited invoice/bank/opening/reconciliation discrepancies. No automatic deletion, posting, reconciliation or historical correction. Physical printer/bank/card live acceptance remains separate. No application blocker remains. Command Board write remains blocked by the earlier automatic-review rejection; no workaround/retry.

**Recovery / next:** Application rollback only through canonical guarded source with current unrelated files preserved. Keep additive immutable backend evidence and later business data. Empty-only SQL rollback/reapply verified all 45 original table hashes; populated evidence cannot be discarded. Financial revisions need explicit compensating entries, never stale DB restore or journal deletion. Full consolidated mapping, root-cause limits, test matrix, source proof and audit exception are in the package ACCEPTANCE.md / ACCEPTANCE.json. No unrelated work begun.

---

## ProGraphics invoice Save and inline invoice rows — October 16, 2026 — LIVE ACCEPTED

**Where:** https://tools.caresmn.com/prographics, deployment dpl_CMLTYb519vhFEmbnP8GCwrJBnBam. Exact canonical source .prographics-release/guarded-1feeef53-2c3a-4eb9-a7c9-c747e77b1430; scoped source/tests/recovery receipt .prographics-release/invoice-save-package-20261016. Previous accepted app dpl_7eJk4pxYz54i4vNMaD5xLEERxp9F. Separate FlowSuite Pro, FlowSuite Nonprofit and MARCO were not modified; all other deployed source retained by hash.

**Correction:** ProGraphics-only saved-line hydration preserves explicit zero prices/costs/quantities, rather than turning zero prices blank or silently changing zero quantities to one. Missing/invalid values remain visible and receive specific row validation. Save errors sit beside Save and entered values survive API failures. New and edited invoices show Item | Description | Qty | Price | Amount on one row. Invoice edits omit the vendor-PO question/cost controls; Orders retains its existing PO workflow. Dave no longer sees Finalize/post accounting; controller control and all original backend permissions preserved. Existing Notebook, inline category/Notes, toolbar, grouped checks, receivables/AP, history, reporting, invoice status, artwork, printing and recovery remain.

**Evidence:** 47 regression cases passed; 14 final scoped cases rechecked. Isolated original database/role tests passed for Kari/Betty/Dave filled-price create/read/edit and In Progress retention, with 268 journals/538 GL unchanged. Full protected and fresh live shared-route/original-three-role gates passed. Dave actual-role live Key Guys test: both prices positive, one saved draft on double-click, direct database readback, reopen/edit/save/refresh, optional notes, visible validation/API failures, retained input, aligned desktop/mobile rows and no PO/posting controls all passed. Marked test drafts removed using unchanged-value guards and Dave's existing permissions; private test/audit evidence retained, runner sessions revoked locally. No payment, email, refund, bank import or financial posting was performed for testing. The exact yesterday Key Guys unsaved browser payload was unavailable: do not claim the confirmed zero-price reopening bug was necessarily its cause.

**Preservation:** All 6,595 original invoice/order rows individually compared with the private recovery export: zero missing/changed. Original 825 bank entries hash unchanged; 268 journals/538 GL, roles, all 68 scoped function definitions/ACLs and 21 policies unchanged. Concurrent Kari activity added a non-test Key Guys draft #8751 and one bank entry; both preserved (now 6,596 raw invoice/order rows and 826 entries). Zero marked test invoices remain. Historical invoices were not posted. No production SQL, new database, migration or Lite activation.

**Release caveat:** Initial publication module MIME failure retained in receipt; fresh HTML/JS MIME check and complete fresh live acceptance passed on this same deployment, without republishing. Existing deployment-switch propagation risk remains separately documented; no claim of a platform-level caching fix. No current invoice-release blocker. Original physical printer/provider acceptance and accounting exceptions remain as previously recorded. Command Board not written under the prior automatic-review rejection; in-app BUILD PROGRESS and this STATUS updated.

---

## ProGraphics Register Notes label — October 15, 2026 — LIVE ACCEPTED

Live https://tools.caresmn.com/prographics, dpl_7eJk4pxYz54i4vNMaD5xLEERxp9F; exact source .prographics-release/guarded-77b58c86-f9b5-4829-95c4-47b258cd5b95. Register detail button now visibly says Notes (accessible name Notes), retaining optional note/Money Received fields and inline category workflow. Label/title only; no SQL, role, accounting or business-data changes. Canonical build/staged original-three-role/read-only shared-product gates passed. Immediate live module MIME failure retained; fresh complete live shared-route/Kari/Betty/Dave verification passed on same deployment, including Notes text and field opening. Exact source/read-only evidence/recovery in .prographics-release/notes-label-package-20261015. Previous app rollback dpl_8xbcmrRQ9h9nFUPL2DcMvD85HMbE; all prior completed functionality and outstanding accounting/external acceptance items preserved. No Command Board write attempted under prior auto-review rejection.

---

## ProGraphics Betty Add category / inline Register / customer buttons / checks 12211-12212 — October 15, 2026 — LIVE ACCEPTED

**What / where:** https://tools.caresmn.com/prographics, dpl_8xbcmrRQ9h9nFUPL2DcMvD85HMbE; exact source .prographics-release/guarded-f863fe0c-decc-4339-a9d7-9bd361a8229f. Source/tests/recovery package .prographics-release/inline-category-package-20261015. Existing production app/database; no Lite activation or new architecture.

**Built:** Betty can select + Add category... from Notebook/Register, enter only a name and Add, then Save category. Uses her established org-editor category INSERT policy and authenticated user identity; no administrator permission grant, GL mapping or accounting interrogation. Duplicate existing active names reused without modifying historical catalog records; stable request UUID/readback supports retries. Existing catalog kind default remains; detailed accounting fields/native mapping unset. Register category dropdown always stays on the same transaction line; Save shown after editing/requested detail, optional note and Money Received in a small popover. No expanded edit row. Yellow remembered suggestions and non-posting classification persistence retained. Customer-adjacent New order shortcut removed; New invoice solid blue. Original Orders page/new-order workflow preserved.

**Confirmed checks:** Kari explicitly identified City Of Bloomington as check 12211, $250.44, and Tax & Business Solutions as 12212, $215.00. Matched existing cleared manual book payments and existing paid bills by exact vendor/amount plus user confirmation, not ambiguous feed evidence. Added only two immutable existing-audit relationship/reference confirmations with full snapshots; original blank source reference, posting dates, amounts, cleared flags, bills and journals unchanged. Read-only paid_checks projection returns these supplied check numbers; existing 12215 $940/three-bill group preserved. Current report definition hash 71ab30d88c7857033dd735e3c85f8a2b, original ACL/role checks retained. No new table or finance action.

**Verification:** Isolated original-editor create/assign-new-unmapped-category and wrong-author RLS tests passed with 268/538 accounting counts unchanged. Two-check idempotent relationship/reference reads passed under Kari/Betty/Dave, original source values preserved. Canonical staged and live shared-product/original-role reports/navigation/PDF/AR/AP/grouped-check/Notebook/Register tests passed. Actual Betty added a temporary category through the inline dropdown, read it back under her role, reloaded and selected it; no new register row or height expansion. Actual four controlled classification saves/readbacks/refresh/accounts/fresh login/retry tests passed. Test annotations restored and generated test category removed; original 53 catalog records remain, zero CONTROLLED test names. Original source/financial/role hashes unchanged, all 268 journals and 538 GL retained. Historical invoices not posted.

**Release evidence / recovery:** Early staged excess disabled Save buttons and subsequently identified garbled new labels corrected. Final source labels verified visually and by browser assertion. Immediate final post-switch module MIME failure preserved as published-not-accepted; fresh HTML/JS/CSS and COMPLETE live shared-route/role/save/create gates reran successfully on exact same deployment before acceptance. No blind republish or skipped gate. App-only rollback preserves staff classifications/new categories and immutable audit; separate guarded read-function rollback recorded. Existing toolbar, brand green, owner-only source audit, all-uncleared queue (coding does not clear), compact running-balance protections and check 12215 retained. Prior Command Board auto-review rejection still applies; no tracker-write workaround. Original external bank/card/physical-printer and source-accounting exceptions remain separate, not claimed passed.

---

## ProGraphics all-uncleared Notebook / Kari-only source audit / check 12215 — October 15, 2026 — LIVE ACCEPTED

**What / where:** https://tools.caresmn.com/prographics. Accepted dpl_B1sb9qj9nADtR9jWtM7xtZPs5EPq; exact source .prographics-release/guarded-b0945eb0-902e-47fc-b1d4-aa253759274f. Recovery/source/tests in .prographics-release/uncleared-and-check12215-package-20261015. Earlier same-turn Notebook/source-audit deployment dpl_FEBW4KrfFiou7HknzpTMAR2mRTxP also passed staged/live acceptance and is app rollback baseline.

**Corrected rule / supersedes prior queue:** Kari explicitly corrected Notebook membership: ALL not-cleared bank activity, not this month's unclassified activity. New default Not cleared equals all source rows lacking cleared_confirmed/reconciliation_id/match_status=reconciled, regardless of category, note, transaction age, posting/payment/invoice association or potential overlap. 248 eligible source IDs browser-compared exactly under all three authorized roles; includes 210 older records and already coded transactions. Saving a category never clears/removes a transaction. Original 575 cleared records remain outside default Notebook and in Register/cleared history; all 823 retained. Older not cleared / Potential overlaps are subsets, not mutually exclusive accounting statuses. Previous 21/134/610/58 partition and removal-after-coding behavior are superseded, not accepted intended daily workflow. No false bank-delivery notice. Compact Register, FlowSuite colors, contextual loading, toolbar and saved coding retained.

**Source audit / permissions:** Controller Audit: source history is restricted to Kari's authenticated identity AND original controller authorization; button, panel and fetch handler guarded for customer/vendor source evidence. Betty and Dave retain ordinary Invoice/order history and authorized financial reports. Existing roles and server permission grants unchanged; no claim that hiding a control revokes original database access.

**Check correction:** Kari clarified check 12215 (not 12214). Existing CARES Consulting Inc check, August 12, CorTrust, $940 matches existing three paid bills $395/$395/$150. Recorded user-confirmed relationship as one idempotent immutable existing audit event 6073a1b4-599d-4534-8ee0-fd4dd0136b6a with full check/bill snapshots and authorization provenance. No new table or financial transaction. Extended ONLY existing paid_checks read branch to include explicit confirmed relationships, original poster/controller checks and ACL retained. Tested live function hash 3db520d7e1f877b4a0d58423c5ce580b. Original report before hash 862502f0ecc3c66064c23668a5685232 saved for guarded rollback. Paid-bills screen now shows one check header/total with the three bill IDs exactly once; no irrelevant historical-link warning. Non-bill checks remain in register/check history rather than paid-bill groups. Other two paid bills remain accessible without fabricated payment links.

**Verification / integrity:** Focused cleared-status tests, exact-source isolated report migration/link idempotence, original three-role reads, anonymous denial, function rollback/reapply and append-only link revocation passed. Canonical fresh build/protected staged/live shared-product smoke and Kari/Betty/Dave operational/report/printing acceptance passed. All three live browsers verified exact uncleared-ID set, owner-only source audit and operational customer history, correct check 12215 grouping, compact Register and retained prior workflows. Actual Betty persisted classifications incl refund from Register, Card payment, Accounting/ordinary expenses, optional notes, refresh/accounts/local logout/fresh login and error/retry passed; test-only annotations restored. Original six bills, 823 entries, 6595 invoice/order table records, 13 payments, 268 journals/538 GL lines and original role hashes unchanged. Historical invoices not posted; no live bank imports/charges/refunds/check issuance/tax payments/emails for testing. Only legitimate relationship audit evidence appended.

**Recovery / remaining:** App-only rollback preserves coding/audit data; separate guarded read-function restore and append-only relationship revocation tested, never restore stale financial data/delete audit. Original 30 reconciliations/575 missing legacy IDs and preexisting source/accounting exceptions preserved. Broader controller reconciliation/overlap evidence review and external physical/bank/card checks remain distinct. Source BUILD PROGRESS Notebook rule updated; prior Command Board automatic-review rejection remains, no tracker-write workaround.

---

## ProGraphics compact Register / operational coding / interface cleanup — October 15, 2026 — LIVE ACCEPTED

**What / where:** https://tools.caresmn.com/prographics; accepted deployment dpl_2WwXxt3adUGfJDUWYK9NuFBLy2Y2, exact source .prographics-release/guarded-ad9969f1-3f72-46e2-9f7c-faeba70760e5. Package .prographics-release/register-correction-package-20261015. Prior accepted app rollback dpl_DX6YzojJLo8ZVrVbMYmWCnxi2H5J. No new database, Lite activation or financial migration.

**Built:** Restored compact single-line bank register: date/check/description/account/category/payment/deposit/balance/status. No repeated expanded forms. Category editor opens only on request; notes expand on request. Same persisted non-posting operational annotation RPC. Complete-account register projection calculated before filtering/pagination; excluded bank evidence and unsupported openings get no running balance. Saved opening/register projection explicitly distinguished from native GL and verified statement balances; original CorTrust/native discrepancy remains. Original cleared/reconciled flags retained. Familiar Notebook, five-action/two-row toolbar, grouped checks, matching current invoice/AR lists and AP preserved. Removed unsupported new-bank-delivery notification. Full-screen complete-records loading already removed and live verified; contextual loading with accurate financial-total gate retained. Notebook paper/pale highlights derive from approved #22c55e theme; yellow suggestions retained. Reports/Accounting under Admin with original direct routes and original Betty report access; no role expansion.

**Audit / outstanding:** Reproduced 823 total / 21 current / 134 historical / 610 handled / 58 potential-overlap records. All 134 older rows are imported evidence, with no own cleared flag/reconciliation ID/native posting. 125 possible book counterparts by account/direction/amount within seven days; 133 predate a saved statement end. Neither establishes membership. Relabeled Historical review, not confirmed unreconciled. The 58 flagged rows occupy 57 same-field overlap groups, usually with already handled counterparts; no repeated identical source identifier. 56 possible nearby book counterparts; two unresolved bank overlaps. No automatic dismissal/merge/reconciliation. Full population has 64 such groups/130 rows; queue excludes handled records. No added-provider event confirms the 21 as new deliveries; current-work date is no longer presented as feed-arrival proof. Full per-record private evidence and CSV/account-month report in .prographics-release/register-audit-20261015. Original 575 cleared entries lacking legacy IDs and 30 saved reconciliations preserved. Controller/source-statement adjudication remains open; no fabricated IDs or cleared dates.

**Verification:** Canonical isolated fresh build, protected staged shared routes and Kari/Betty/Dave operational/report/PDF checks passed. Compact-row heights/columns, status/filter/search, request-only edit/optional note, original permissions and green tint verified. Initial immediate live login module MIME mismatch was retained as published-not-accepted; fresh live HTML/assets and COMPLETE shared-route/three-role gates subsequently passed on same deployment. Actual authorized Betty saves: both Intuit Accounting targets, $280 vendor refund from compact register, Card payment, ordinary expense/optional note; DB readback, refresh/accounts/local logout/fresh login, retained input after injected network error and retry all passed. Exact test-only changes restored conditionally; immutable audit retained. Source/business hashes for all 823 entries, 6595 invoice/order table records, six bills, 13 payments, original roles, all 268 journals/538 GL lines and 30 reconciliations unchanged. Historical invoices never posted. No real bank imports, card charges/refunds/check/tax payments or emails performed.

**Recovery / trackers:** App-only rollback; retain operational category/audit tables and staff work. Prior classification migration additive and empty-only SQL rollback tested; rollback refuses populated data/audit. Source BUILD PROGRESS corrections retained. Command Board remains unchanged because automatic review previously rejected its separate tracker write; no workaround. Physical bank/card/printer/statement-PDF acceptance and original accounting exceptions remain separate, not represented as passed. Latest live domain metadata confirms corrected deployment and autoAssignCustomDomains=false.

---

## Minuteman ordering navigation — October 15, 2026

Live existing website: https://tools.caresmn.com/mmpuptown/order/ (also quote/ and customer-portal/). Accepted deployment dpl_3o5Sh9AaZyodSdfjMTex4yRXnLE6; exact source .prographics-release/guarded-13e878d5-0ed4-488c-b6a9-505cec050033. New landing pages and shared customer navigation retain original order/quote/artwork forms, customer portal/login/request, Custom Shop and product destinations. 25 original destinations returned HTTP200. No real orders or payments submitted; Phase2 workflow, payment/tax and FLEX/QBO remain explicitly pending.

Canonical guarded Minuteman release preserved accepted non-Minuteman production baseline. Ten staged/live safety routes passed with business writes blocked using an explicitly authorized fresh normal Kari test session. Deployment guards 15/15 passed using installed Edge. Fresh session input avoids the rejected old browser-state file, which was not read. Original native forms.js bytes unchanged. Transfer source has 52 manifested files plus manifest; 36 live public bytes matched. Private payment-history narratives remain exclusively in FlowSuite owner review. No client activation, financial changes or DNS cutover. Prior unrelated dirty work preserved; exact accepted snapshot and hashes identify this deployment rather than the old repository HEAD.

## ProGraphics operational corrections — October 15, 2026 — ALL REQUESTED CONTROLS LIVE / STAFF ACCEPTANCE PASSED

**What / where:** Live https://tools.caresmn.com/prographics, deployment dpl_G9DiVtZ1hguvNK7duMWQ5ZKZPvXn. Latest source .prographics-release/guarded-e9771ac6-2a18-42e1-ac20-35774d5d766a. Exact source, migrations/guarded rollback and acceptance in .prographics-release/operational-finish-package-20261015. Existing toolbar layout and Pay a card retained. No new architecture, Lite activation, data migration or redesign.

**Built:** Grouped paid-check headers show actual number, date, bank, payee and check total, with original explicitly allocated bills beneath. Written check view uses actual saved metadata. Five old paid bills lack recorded check links and remain separately accessible, not guessed into a check. Operational receivables and explicit Open invoices scope use the same current document IDs and balances, excluding paid/history/void/draft/in-progress/orders. AP matches unpaid bill records, currently $0. No operational list creates journals or reconstructs bookkeeping AR from invoice history. Card payment is offered for both directions and opens matching to existing recorded transfers; Pay a card is retained for an explicitly new transfer.

**Refund authorization / verification:** Automatic review initially rejected the combined posting migration; no SQL was applied by that rejected attempt. Independent read-only check-history branch was installed safely. Kari then explicitly answered Authorize this tested refund-function change. Applied prographics_explicit_vendor_refunds_20261015 only after that approval. Bank review lists vendor_refunds=true, permitting explicit incoming vendor-refund treatment against a verified expense mapping; expense credited, financial account debited. Existing invoker wrapper, private SECURITY DEFINER/search_path, poster/controller checks, fingerprint/cleared/source/payment guards, audit and idempotence retained. Production hash 710c0a37767133e46097dac9049d62bf equals the isolated tested function; existing ACL unchanged. Read-only report hash 862502f0ecc3c66064c23668a5685232 matches isolated definition. No automatic posting of the actual $280; no live financial transactions for acceptance.

**Acceptance:** Eight isolated bank/refund cases plus pure receivables/check grouping, original-three-role read checks, anonymous denial, exact production-definition migration/rollback/reapply checks passed. Canonical fresh build, protected staged and live shared-product/original Kari-Betty-Dave checks passed. After approved refund installation, full live read-only gates reran successfully: refund save controls enabled only after explicit treatment/mapping, confirmation required; card matching save cannot add a category entry; exact invoice-ID/list totals, AP zero and saved check totals verified. Existing financial exports, Notebook/register/statements, order cancellation, invoice/packing PDFs retained. Captured before/after hashes for invoices/entries/payments/bills/native journals/GL/original memberships are identical. Original 268 journals/538 GL lines retained with no duplicates; no historical invoice postings. Browser writes/imports blocked during acceptance. Physical card/printer and new-feed delivery acceptance remains separate as previously agreed.

**Trackers / remaining:** Existing in-app paid-bill/check-view/transfer/current-invoice completion flags retained; Command Board pgledg01 remains unchanged: automatic review rejected the separate tracker write as outside this release authorization. No workaround attempted; project status and release evidence record the completed corrections without marking broader accounting work complete. This STATUS section records final outcome. Unlinked historical bill/check relationships and unverified category posting mappings remain identified; no historical balances/classifications were invented. Original financial exceptions, period/opening evidence and unrelated accounting work remain open.

---

## ProGraphics grouped checks, open receivables and card matching — October 15, 2026 — LIVE ACCEPTED / REFUND POSTING BLOCKED

**What / where:** Kari authorized finishing these corrections live, expressly preserving historical invoice/customer history without posting. Live dpl_G9DiVtZ1hguvNK7duMWQ5ZKZPvXn, source C:/dev/cares-works/.prographics-release/guarded-e9771ac6-2a18-42e1-ac20-35774d5d766a, previous accepted rollback dpl_3Gd5CfUWi6z5aZASvSoKHwdTCCyK. Preserved the requested two-row Notebook toolbar including Pay a card. Only the read-only paid_checks branch was installed in the existing restricted financial-report function; no new RPC or role grant. Group headers show actual check number/date/bank/payee/total; native saved allocation IDs identify bills underneath. Five historical paid bills lack saved check links and remain separately accessible; matching amounts/vendors were not treated as evidence. View check uses actual saved metadata and allocation total rather than guessing from an individual bill amount.

**Receivables / card:** One shared currentOpenInvoices rule powers explicit Open invoices scope, current header and operational receivables. Paid, void, draft/in-progress, orders and imported history excluded consistently; exact invoice IDs compared in hosted tests. No operational balance was converted into bookkeeping AR, no historical repost. AP uses original unpaid bill records, current zero. Card payment is an explicit choice for both directions and opens matching to existing recorded transfer activity, not sales/expense posting; Pay a card remains available to record a genuinely new transfer.

**Verified:** Isolated selection/grouping and source preservation checks; original Kari/Betty/Dave permissions and anonymous denial; eight isolated refund/card-match cases (incoming refund credits original expense, debits financial account; idempotence, stale/cleared/unknown/unmapped rejection; both transfer directions match without duplicate journal). Guarded function install and exact-body rollback/reapply tested. Canonical source build, protected staged and live original-three-role/shared-product checks passed including exact receivable/invoice IDs, AP zero, actual check totals, refund fail-closed UI and card matching controls, existing reports/exports/Notebook/register/statements/order cancellation/invoice and packing PDFs. Post-release hashes match fresh baseline for journals, GL, invoices, entries, payments, bills and original memberships. Original 268 journals and 538 GL lines remain untouched. No live test payments, refunds, imports, emails or financial actions.

**Blocked / exact remaining step:** Automatic review rejected the combined production migration because the vendor-refund financial-posting function change goes beyond the prior five-function authorization. Specific authorization question is pending. No bank_review production change occurred; original body hash ab994bd6ce6c754588baa0eb4b0473c3 remains. User asked explicitly for live refund functionality, but automatic review requires exact approval. Safe independent read-only migration was approved and installed. Refund control deliberately fails closed unless bank-review list reports vendor_refunds=true. Exact tested pending bank-only migration and guarded rollback are in the package; approval would permit installing the function, verifying unchanged data/ACL/roles and hosted controls, without automatically posting the actual $280. Production posting itself requires later explicit staff confirmation; no live financial transaction solely for acceptance.

**Key files / trackers:** .prographics-release/operational-finish-package-20261015/live-result.json; PENDING-vendor-refund-migration.sql; vendor-refund-rollback.sql; exact source copies and local tests. Private before/after recovery definitions/hashes excluded. Existing BUILD PROGRESS/Command Board accounting completion state retained; this assignment is not marked fully done while refund approval remains pending. Broader financial mapping/source exceptions and external bank/card/printer acceptance remain unchanged.

---

## ProGraphics Notebook toolbar — October 15, 2026 — PUBLISHED / ACCEPTED

**What / where:** Kari requested account and sort selectors on one desktop row; next row Add a line (blue), Sync accounts, Reconcile (gray), Pay a card, Credit card repayment plan. Pay a card explicitly retained after Kari's clarification. Corrected inherited full-width select sizing with responsive flex sizing. No accounting, API or SQL change. Source: C:/dev/cares-works/.prographics-release/guarded-8b35c79f-cd9e-407d-9628-e5fcef209f22. Live deployment: dpl_3Gd5CfUWi6z5aZASvSoKHwdTCCyK. Previous accepted rollback deployment dpl_9523JsWqzBK2MjRiZHrTz3EzWFN4.

**Verified:** Canonical fresh source build, staged and live shared-product smoke and original Kari/Betty/Dave access. Browser asserts both selectors share their desktop top position, exact five-action order including Pay a card, and gray Reconcile background. Existing all-category, paid-bill expansion/opening, financial exports, register/statements, order cancellation and invoice/packing PDF checks retained. Acceptance blocks bank imports and business mutations. Initial unaliased attempt caught test-label encoding; never published. Corrected source/test passed before switch.

**Pending:** Check grouping and current operational receivables consistency remain requested and unpublished. Vendor refund/card matching candidate .prographics-release/bank-workflow-fix-20261015 remains unpublished. Six isolated bank-refund cases passed against in-memory clone only; no production SQL or actual refund/posting. Existing permitted SQL authorization was for the original five-function release, not the new vendor-refund posting change. Original category mapping limitations and historical financial exceptions preserved. Browser inventory initially showed old in-app preview tabs, but Kari's actual Chrome screenshot proved she was on the live application; acknowledged that correction. No further attribution to wrong URL for the still-unpublished toolbar.

**Key files:** work/notebook-toolbar-role-gate.mjs; work/execute-notebook-toolbar.mjs; isolated release-report.json and staged/live evidence. No new architecture or redesign; existing product design retained. No financial tracker item marked complete.

---

## ProGraphics complete category selector — October 15, 2026 — PUBLISHED / ACCEPTED

**What / where:** Kari requested all Betty's categories, not the truncated imported-bank selector. Read-only audit found 53 active existing category records, 52 distinct names, only 12 with supported native posting mappings. Both Promotion records retained; selector shows its shared name once. Existing complete category catalog now supplies imported Notebook controls and their matching category selector. No source categories renamed, deleted, merged or reclassified. Source: C:/dev/cares-works/.prographics-release/guarded-1dbe6941-83ec-4953-830d-37737e8571ca. Deployment: dpl_9523JsWqzBK2MjRiZHrTz3EzWFN4; previous accepted rollback deployment dpl_7zS4sGYeJxZ37CDW4VXxRh9oKgcW.

**Verified:** Canonical fresh source build/shared-product staged and production smoke passed. Kari/Betty/Dave browser checks compare all 52 current active names read through each original authorized role against selector options. Selecting unmapped Printed Banners displays a precise no-posting message and exposes no posting save action. Paid-bills regression, reports/exports, Notebook/register/statements, order cancellation, invoice/packing PDF checks retained. No business writes, SQL changes, imports or financial tests.

**Pending / decisions:** Full listing is corrected; 40 names still lack verified posting mappings and cannot be posted through Add New. Existing direction/payment/transfer/refund restrictions remain enforced; no guessed accounting treatment. Selecting a name alone is not saved accounting classification. These mappings and actual transfer/refund workflow limitations remain open, along with the previously reported Notebook handling concern and preserved financial exceptions. No claim of full accounting acceptance. Existing BUILD PROGRESS broader unfinished scope retained.

**Key files:** src/components/ProGraphicsBankMatching.jsx, src/pages/LedgerWorkspace.jsx in isolated source; work/category-list-role-gate.mjs; work/execute-category-list-fix.mjs; release-report.json and staged/live smoke artifacts.

---

## ProGraphics paid-bills crash correction — October 15, 2026 — PUBLISHED / ACCEPTED

**What / where:** Corrected the paid-bills expansion crash reported by Kari. Existing list referenced undefined `entries`; now reads the existing `entity.rawEntries` collection. One product-source reference changed, no redesign or database changes. Latest source: C:/dev/cares-works/.prographics-release/guarded-a98346db-594c-4ce8-989e-fd570ac3b00a. Live deployment: dpl_7zS4sGYeJxZ37CDW4VXxRh9oKgcW. Rollback source remains previous accepted deployment dpl_CQxYhRD4mYKdAxK15fNvF5vLHLLa.

**Verified:** Canonical isolated fresh build, staged and live shared-product smoke, actual Kari/Betty/Dave role checks. Added explicit paid-bills expansion, existing bill open/close and collapse regression to each role gate. Existing reports/exports, Notebook/register/statements, order cancellation and invoice/packing PDF checks retained. Browser exceptions and attempted business writes fail the gate. All passed. No SQL, business writes, bank imports, payment processing or permission changes.

**Pending:** Notebook cleared/category question remains under investigation; no transaction status altered by this fix. Existing financial exceptions, real bank-delivery/card/physical-printer/statement-PDF acceptance remain unchanged. No broader accounting completion is claimed.

**Key files:** work/paid-bills-role-gate.mjs; work/execute-paid-bills-hotfix.mjs; release-report.json and preview-smoke/production-smoke in the isolated release directory. Prior approved product identity and all nine destinations preserved. Existing BUILD PROGRESS scope unchanged; this repairs an already delivered Bills screen, not a new completed accounting feature.

---

## ProGraphics controlled operational release — October 15, 2026 — PUBLISHED / SOFTWARE ACCEPTED

**What / where:** Kari expressly authorized the tested five-function migration and guarded release, prohibited financial transactions solely for testing and Lite activation, and explicitly accepted browser/PDF printing as the release gate with physical printing deferred. Corrected FlowSuite appearance and operational candidate revision 91bdff72c765bd300c5d088274a1fb1c0bfce84b is LIVE at tools.caresmn.com/prographics; deployment dpl_CQxYhRD4mYKdAxK15fNvF5vLHLLa. Original production/recovery deployment dpl_AE9rS6w1BpToNT9CzL1GMZEhogbz; exact 339-file rollback source preserved in .prographics-release/controlled-release-20261014/rollback-source.

**Recovery / migration:** Captured a fresh private logical checkpoint across all 42 affected tables plus schema/permissions/source. Detected REST/JavaScript numeric-format loss, preserved raw JSON instead, restored every table in isolation and verified all hashes against one production snapshot and unchanged before/after export hashes. No snapshot data restored to production. Applied only prographics_operational_release_20261014 using the exact tested migration; verified all five bodies, search paths and authenticated-only EXECUTE ACLs. Every original table/schema/function/RLS/membership remained unchanged. Additive functions installed; no admin promotion or new accounting engine/database.

**Hosted / production verification:** Canonical fresh source build/output/config digest/shared-product preservation/function-budget gates passed. The initial unaliased attempt stopped safely on test-harness blocks (analytics beacon, then the SELECT-only Minuteman catalog); the read-only harness was corrected without product changes. Print-only PDF visibility was checked under print media. Final canonical staged AND immediate live smoke passed all seven shared routes and actual Kari/Betty/Dave role hooks: all nine operational destinations, report-only restrictions/controller denial, TB/P&L/BS/GL with four CSV exports per role, Notebook/full register/statements, clean New order/cancel and invoice/packing browser/PDF output. Every bank-sync/business-write attempt was blocked by the test harness; analytics beacons suppressed. Final source phase production-accepted; temporary test sessions signed out locally and saved session files cleared. Existing 80 isolated checks and 14 migration/rollback checks retained.

**Preserved:** Final comparison: ALL 42 table contents/hash-identical to the fresh pre-migration checkpoint, including every original invoice/order/customer/payment/category/audit/exception/reconciliation record. Original 268 journals/538 GL lines fully unchanged. Roles, RLS, original 66 functions, 103 policies, 175 constraints and 27 triggers unchanged. No history repost, opening-balance fabrication, duplicate accounting, real test charge/refund/import/check/tax submission, migration to another database or FlowSuite Lite activation. Minuteman/shared source preserved.

**Real provider / remaining:** Reviewed exact deployed plaid-sync v8 hash, then used Betty's real role and inspect_only=true/recover_history=false: all FOUR production bank connections returned no authentication errors. This is live metadata/auth acceptance only, NOT transaction delivery; no cursor/import/provider product initialization. Actual new-feed delivery/import and real card-terminal authorization/refund/settlement still need separate approval. No dedicated terminal integration was found; Card receipt recording does not prove processor capability. Physical printer/driver/check-stock verification deferred explicitly. Statement-PDF automation and provisional financial opening/source coverage, ten invoice discrepancies, 173 possible overlaps, CorTrust disagreement and 575 cleared rows without IDs remain preserved investigation items. Broader financial reconstruction is not declared complete. No extra Command Board/business SQL was performed beyond the authorized migration; existing in-app progress source retained to keep the verified candidate exact.

**Rollback / key files:** Prefer canonical application-only rollback using the exact recovered source, preserving additive functions and all post-release records. Optional guarded rollback.sql only after old-client acceptance/pending-save resolution and dependency/body checks; never erase conversions, audits or reconciliations. Package .prographics-release/controlled-release-20261014; final execution source C:/dev/cares-works/.prographics-release/guarded-fc9ed1b9-1b00-4634-b24f-21889e5d18b1; release-report.json, preview-smoke/, production-smoke/; private execution-checkpoint/ and execution-release/ excluded from Git/deployment. User-facing release result: C:/Users/kari/Documents/Codex/2026-10-12/rhi/outputs/prographics-controlled-release/Released.json.

---

## ProGraphics controlled production release — October 14, 2026 — PREPARATION COMPLETE / PUBLICATION BLOCKED

**What / where:** Kari established no dedicated hosted staging database exists and explicitly prohibited provisioning one. Continued corrected source .prographics-release/acceptance-candidate-20261014, revision 91bdff72c765bd300c5d088274a1fb1c0bfce84b. No application redesign, Lite activation, hosted database, production SQL or publication. Prepared .prographics-release/controlled-release-20261014 with migration.sql, guarded rollback.sql, manifest, exact current production rollback-source, release procedure and specific supervised live checks.

**Verified:** Fresh read-only production inspection matches the tested clone across 42 tables, 66 existing function definitions, 103 policies, 175 constraints and 27 triggers; all five proposed functions absent. Original Betty/Dave editor/poster memberships match. Original 268 journals/538 GL lines remain complete/hash-identical. Existing 80 checks and staff browser acceptance retained without source changes. Fourteen new isolated migration/rollback tests pass: original data/catalogs/RLS/grants untouched; idempotent install/removal; controller/anonymous denial; injected mid-install rollback; schema drift/collision/overload refusal; altered-body and unknown-dependency/no-CASCADE rollback refusal; completed conversion/reconciliation records preserved; reapply/retry avoids duplicates. Candidate AND recovered original source pass canonical CHECK ONLY fresh-source build/shared-product preflights; no deployment created.

**Recovery / decision:** Existing production remains dpl_AE9rS6w1BpToNT9CzL1GMZEhogbz. All 339 rollback source files verified against its deployment tree; differing local bytes recovered from the actual deployment. No assumed older local snapshot. Preferred rollback is application-only through canonical gates, preserving additive functions and every business record. Optional SQL rollback removes only unchanged, unused reviewed functions after old-app acceptance and pending-save resolution; it refuses changed definitions/overloads/dependencies. Already committed invoice conversions and reconciliations are not erased/reversed by code rollback; any business correction needs separate authorization and audit. Original financial history is never restored from a stale baseline.

**Stopped / exact next steps / pending:** Preparation complete; publication BLOCKED. Kari must explicitly authorize SQL and interface release/rollback contingency. Before SQL: refresh production/schema/deployment/roles and capture a transaction-consistent private recovery checkpoint; verify backup/PITR availability. Apply only the reviewed transaction and verify hashes/ACLs/preservation. Canonical protected unaliased source-built candidate must pass actual authenticated readonly corrected-report/staff and shared-product smoke, then same-candidate publication and live smoke under authorization. Separate supervised live checks are specified: bank connection metadata/auth can be checked pre-switch; real sync imports require explicit production-write approval; terminal sandbox and physical VOID/plain-paper output can happen pre-switch; real card sale/refund requires Dave/Kari and an approved amount/provider. No dedicated terminal integration was found; Card receipt entry is not proof of processing. Mocked feed tests are not live acceptance. Statement-PDF automation and provisional accounting discrepancies remain separate/unresolved. No tracker marked shipped and no Command Board SQL.

**Key files:** .prographics-release/controlled-release-20261014/CONTROLLED-RELEASE.txt; SUPERVISED-LIVE-ACCEPTANCE.txt; migration.sql; rollback.sql; manifest.json; migration-rollback-acceptance.json; rollback-source/. Private production schema checkpoint remains excluded from Git/deployment. User-facing copies: C:/Users/kari/Documents/Codex/2026-10-12/rhi/outputs/prographics-controlled-release/. No preview URL is supplied or represented as corrected operational acceptance.

---

## ProGraphics release-candidate corrections — October 14, 2026 — UNPUBLISHED / EXTERNAL ACCEPTANCE PENDING

**What / where:** Continued the existing approved FlowSuite visual candidate at .prographics-release/acceptance-candidate-20261014. Kari authorized narrow staff report access and isolated bank-feed/POS/conversion acceptance, expressly withholding publication until critical workflows pass and she authorizes release. Earlier truncated-prompt hold is superseded by this current instruction. No redesign or new accounting engine.

**Built:** Reused ProGraphicsAccounting on the existing Reports destination in report-only mode. New read-only RPC checks the original native poster/controller membership, exposes only whitelisted report/GL/journal/source reads and sanitized snapshot, denies every controller mutation and private evidence/audit. Betty remains operational editor/native poster; no admin grant. Atomic one-time current-order conversion retains the order, creates one linked draft via existing document events, validates source fingerprint, protects historical/accounting-linked orders, retains independent Copy to New Invoice, and safely returns the existing invoice after lost responses. Conversion writes use original invoker/RLS; a narrowly checked read-only helper verifies private book eligibility. Previous atomic reconciliation/date/category/unsaved-warning fixes retained. Only LedgerWorkspace.jsx and ProGraphicsAccounting.jsx differ from approved application source; original shell/assets/other products byte-identical.

**Verified:** 54 workflow/source-preservation tests, 15 operational SQL tests, six correction/bank-ingestion SQL tests and five atomic reconciliation tests pass. Complete final Chrome run passed as actual Betty and Dave with copied original roles/RLS/grants and all nine destinations, zero uncaught browser exceptions. Betty TB/P&L/BS/GL and all four CSV exports pass; controller controls absent and RPC mutations denied. Notebook suggestions/classification/register/statements/date/category/atomic close/lost-response recovery pass. Dave new/save/reopen/edit/cancel, Avallo/Jim contact reset, In Progress status, invoice/packing print rendering, independent copy, atomic linked conversion/lost-response retry, cash partial-payment entry/refresh/double-submit prevention pass. Bills/check batches/credit/refund/void audit/tax confirmation checks pass locally. Exact deployed plaid-sync v8 pgSync source exercised with mocked provider: arrivals/dedupe/provider-change evidence/failure/cursor/paginated replay pass. Latest canonical --check built-and-validated, no deployment created.

**Preserved:** Live deployment dpl_AE9rS6w1BpToNT9CzL1GMZEhogbz unchanged. Fresh production read: all 268 original journals and 538 lines remain completely hash-identical to clone baseline (journals a30cccc20a984962cc6705762ac49ccc; lines a51653db70591700192c41dee7463d78). No production data/DDL/membership writes, history reposts, Lite activation, emails, charges, taxes submitted or real checks issued. Three reviewed SQL files remain candidate-only; none installed in production. Browser test sessions revoked locally and isolated server stopped after testing.

**Stopped / next / pending:** Release HELD. Live bank/card authentication/new-feed receipt not tested because polling may write production imports. Dedicated POS/terminal processing route not found; cash/recorded-payment workflow passed, but actual card authorization/refund and physical receipt/check printing remain unverified. Reviewed SQL target installation plus canonical staged HTTPS/shared-product smoke remain prerequisites; publication requires Kari's explicit authorization after critical acceptance. Statement-PDF automation remains separate/unaccepted and does not block mocked ordinary feed ingestion. Reports retain provisional opening/source-coverage notices; existing financial discrepancies/openings/duplicate candidates/cleared history are not corrected by workflow tests. No trackers marked shipped or Command Board writes; no production release attempted.

**Key files:** candidate reviewed-sql/prographics-financial-reports.sql, prographics-convert-order.sql, prographics-finish-reconciliation.sql; private acceptance baseline/schema/tools and Final-acceptance.json. Sanitized final matrix: C:/Users/kari/Documents/Codex/2026-10-12/rhi/outputs/prographics-operational-acceptance/Final-acceptance.json. Existing readonly HTTPS preview is unchanged and does not represent these unpublished functional corrections.

---

## Ladybug post-ROOTED cleanup — October 13, 2026, PUBLISHED

Separate project C:/dev/ladybug; https://ladybug.karikounkel.com; dpl_JBeGZhRaDM4XV4wobzMS8Moam3MM. Permanent book/story/gatherings home, Chapter 13 story CTA/navigation, one illustrated Garden Kit (removed later Show us your garden block and duplicate packet button), removed event promotion/countdown/expired shipping language, future paid programming with formats/pricing pending, hosting copy cleanup and mobile wrapping fix, old registration URLs redirect to gatherings. Existing event-HQ tests and staged/live desktop/mobile browser smoke passed; no real submissions/payments/database writes. Private event operations/history retained; final formats/pricing and historical operational issues remain open. No shared CARES/Minuteman release or accounting changes. Ladybug STATUS.md holds full release record.

---
## ProGraphics current system assessment — October 12, 2026, READ-ONLY COMPLETE

**What / where:** Kari requested an assessment of the system as it stands. Assessed live dpl_AE9rS6w1BpToNT9CzL1GMZEhogbz; unchanged at completion. Full report/evidence: docs/prographics-assessment-2026-10-12/ASSESSMENT.txt.

**Verified:** Nine screens, history pagination and refresh passed as actual Dave/Betty/Kari with business writes blocked. 6,598 invoice/order records loaded. Fresh SQL: 268 journals, zero checked invalid balances/line counts; 814 entries; 349 bank-source entries; 173 same-account/date/amount/direction candidate groups (not proven duplicates), 147 feed/manual overlap groups, 224 undecided/undismissed inbox rows. Notebook/native balances disagree materially (CorTrust +$12,314.19 versus native -$21,971.78). Ten paid invoices outside the identified historical batch have line/subtotal discrepancies, one one-cent and nine larger. 30 operational reconciliations, 22 document-linked; 575 cleared rows lack reconciliation_id; zero native reconciliations.

**Assessment / decisions:** Application is accessible but financial/operational acceptance remains incomplete. Similar category controls have different financial effects on manual versus imported rows. No blanket duplicate deletion or reposting is justified by the read-only counts. Recommend establishing authoritative balances/openings, evidence-based duplicate review, source-document invoice corrections, agreed Betty workflow and atomic reconciliation/reversal recovery before full acceptance. Existing source guards remain valuable but do not prove completeness.

**Preserved / stopped:** No app changes, deployments, SQL mutations, business writes, role changes or messages. Temporary verification sessions revoked. Assessment documents only; no in-app BUILD_PROGRESS change/deployment or Command Board SQL under user restriction. All tenants and Minuteman preserved. Finn instructions, full acceptance and prior pending/frozen work remain open.

**Key files:** ASSESSMENT.txt, assessment-evidence.json and live-role-inspection.json in the assessment directory; current isolated source work/pg-betty-memory-20261012.

---

## ProGraphics remembered categories / misleading bill labels — October 12, 2026, PUBLISHED

**What / where:** Follow-up to Kari's report that the original yellow remembered-category question mark was gone, matching cluttered Betty's screen, and Nova/Cost Plus incorrectly appeared as bills. PG-20261012-MEMORY; dpl_AE9rS6w1BpToNT9CzL1GMZEhogbz; source d3476af5260f669abc84e16a8e45d1c21ad4472c; docs/prographics-betty-memory-2026-10-12.

**Built / verified:** Restored saved category suggestions from normalized exact payee/direction history, with yellow question mark and explicit selection; no automatic posting. Kept matching only in reconciliation, excluded legacy bill/noted handled rows from daily Notebook while retaining full register/history, mapped raw bill status to Receipt attached. Read-only inspection found no actual Nova/Cost Plus ledger_bills records; legacy status meant receipt attached. Five helper tests and synthetic UI checks passed; canonical seven preview/live routes, four exports each environment and Betty-role Phone? / yellow / no daily matching / retained register/statements checks passed.

**Decisions / preserved:** No production SQL/business writes or value/role changes. Existing posting/matching/reconciliation functions and other application/Minuteman files preserved. Authoritative source is isolated latest-production snapshot, not older dirty repo files. Command Board SQL remains omitted under Kari's restriction.

**Where stopped / pending:** User-reported UI regressions corrected; latest Finn handoff updated. Bank downloads coexist with older same-date/amount entries; preserve originals and require source-based duplicate review, no automatic deletion. Different merchant labels are not guessed aliases. Broader financial/operational acceptance, opening balances/source coverage, reconciliation recovery, invoice 8719 and Minuteman separation remain open.

**Key files:** deployed src/lib/prographicsCategoryMemory.js, src/components/ProGraphicsBankMatching.jsx, src/pages/LedgerWorkspace.jsx; tools/shared-production-smoke.mjs; docs/prographics-betty-memory-2026-10-12/FINN-HANDOFF.txt and release-manifest.json.

---

## ProGraphics Betty classification — October 12, 2026, PUBLISHED

**What / where:** Kari requested removal of the oversized classification dialog while preserving bank reconciliation, plus a factual Finn handoff. PG-20261012-BETTY; dpl_5D38K8yxQ3krurmJBw2iYJW9GLgq; source 97000082ea72ddb5bc341e91cf0b4ccb9e9de894; docs/prographics-betty-2026-10-12/FINN-HANDOFF.txt.

**Built / verified:** Started from latest live dpl_CLQuu5iPe7FPLxuW2t3qoX7PoGbm, preserving later onsite work. Replaced imported-row classification modal with compact inline Category controls in Notebook/Register/reconciliation imports; note and duplicate confirmation appear after choosing a category. Matching remains explicit and separate. Existing financial/reconciliation command bodies unchanged. 20 targeted tests and eight synthetic browser checks passed. Canonical guarded source build, seven staged/live routes, bank Notebook/full register/statements checks, four native exports each environment, and additional read-only Betty-account verification passed.

**Decisions / preserved:** No production SQL or business-record writes, role/config changes, or messages sent. All other application source preserved, including Minuteman. No rollback. Command Board SQL omitted under Kari's restriction. The isolated latest-source snapshot and recovery bundle are authoritative; do not replace them with older dirty local LedgerWorkspace/component files. Optional read-only compact-control acceptance was added to the existing shared smoke script.

**Where stopped / next / pending:** Requested UI repair and Finn handoff complete. Full accounting acceptance remains open; October 11 findings (opening/source coverage, non-atomic operational reconciliation, general reversals/recovery, invoice 8719 discrepancy and untested workflows) are documented as dated observations rather than a fresh database audit. Finn's official workflow/accounting acceptance directions are pending. Minuteman separation and unrelated frozen items remain unchanged.

**Key files:** docs/prographics-betty-2026-10-12/release-manifest.json, FINN-HANDOFF.txt, betty-live.json, PG-20261012-BETTY.bundle; deployed src/components/ProGraphicsBankMatching.jsx and src/pages/LedgerWorkspace.jsx; tools/shared-production-smoke.mjs.

---

## Writer wording correction — October 12, 2026

Kari confirmed Writer. Blogger. Creator. and likes the Substack connection. Updated cover, bio, and welcome draft accordingly; The 13th Room stays the primary read/subscribe destination. Nothing published.

## Writer visual revision — October 12, 2026

Kari supplied K CO LLC.png (K Co Creative, pink/gold/glass-marble logo). Replaced provisional warm-plum cover with white/pink/gold layout using original logo intact; saved source copy and regenerated cover in docs/writer-refresh-2026-10-12. Review packet updated. No Facebook changes; approval and upload crop verification still pending.

## Writer Facebook refresh — October 12, 2026, LOCAL REVIEW DRAFT

Audited Kari: Writer Blogger Creator at facebook.com/kariwriterbloggercreator/ (230 followers), header/About and latest surfaced August 12 post. Existing bio Writer. Blogger. Wordist.; book collage cover and signature avatar. Listed /writer-blogger-creator destination returns 404; verified karikounkel.com main marble hub and The 13th Room at karikounkel.substack.com (essays through October 1). Prepared docs/writer-refresh-2026-10-12/review.html, editable cover-concept.svg and inspected PNG export, revised bio/About, links/button recommendation, pinned welcome and three follow-up drafts. Warm cream/plum/orange author direction based on existing personal palette/marbles. No Facebook writes, uploads, subscriptions or publishing. CARES approval does not cover this separate page. Author street address/763 phone visibility unconfirmed; keep avatar pending portrait/simplification choice. Final Facebook cover crop not verified. Opened review file through Codex; direct file navigation blocked by browser URL policy, no workaround attempted. No app/deployment/board changes.

---
## CARES Consulting Facebook refresh — October 12, 2026, APPROVED AND APPLIED

**Published / verified:** Kari approved after requesting logo-only avatar. Uploaded/saved neon-only profile image (photo 1610913154168276) and approved cover (1610913430834915). Bio, confirmed phone 651-334-1300, HTTPS main site / CARES Works / build links, and four current service descriptions saved. Introduction published and pinned to Featured, confirmed by Facebook success message and pinned-item list: https://www.facebook.com/caresbykari/posts/pfbid0wusbhe6HoyMqK3cnFwribDZM1kpV8eupjY4M2Td4ZaAePLtV4RdLtvT8F4nFaGoDl. Evidence: docs/facebook-refresh-2026-10-11/published-page.jpg; profile-neon-only.png; cover-final.png. Avatar edited with built-in imagegen from existing logo, prompt: isolate existing neon infinity on white, remove all words/icons/lines, preserve form/colors/orientation and leave circular-crop margins. Cover exported from existing SVG concept.

**Pending / preserved:** Four follow-ups remain local drafts, including Resolve video caption. No video, paid ad, schedule, booking link or inbox automation added. Long About copy remains in packet because inspected Facebook Intro only provides 255-character bio; service descriptions adapted to 150-character fields. Hours unchanged, actual hours unconfirmed. Live desktop and upload previews inspected; separate mobile crop check open. No application/deployment/accounting/board changes. Earlier draft notes below are historical and superseded.

**Latest update:** Kari confirmed public phone 651-334-1300 and supplied CARES Resolve VSL/ad copy for planned October 12 recording. Resolve is CARES Consulting’s evidence-based financial reconstruction product for business brokers: $20,000, up to three prior fiscal years plus current-year closed months, subject to agreed scope/available records. Seven-business-day target starts after required documentation/access and qualification of scope/records. Packet updated with product description, deliverables, conditions and fourth post/video caption. No Facebook changes. Booking link, final image exports/crops, actual hours and publishing approval remain open. Earlier missing-product/phone notes below are superseded.

**What / where:** Audited facebook.com/caresbykari live header, bio, About/contact, photos and sampled August 9–11 posts. Draft packet: docs/facebook-refresh-2026-10-11/review.html; editable cover concept: cover-concept.svg. Local marketing files only.

**Built so far / decisions:** Prepared bio, About, consulting/Works/AI descriptions, provisional Resolve product mention, pinned introduction, three follow-up posts, visual direction and page organization. CARES Consulting remains umbrella business; CARES Resolve is its product, per Kari. Existing neon logo and shared white/blue/green theme retained. Existing posts/reviews preserved.

**Where stopped / next / pending:** No Facebook writes or publishing. Resolve function/destination unknown; phone mismatch 507-400-0250 on Facebook versus 651-334-1300 website awaits Kari. Cover/avatar upload exports and actual mobile/desktop crop verification pending. Full historical inventory and Insights/inbox/settings audit not completed. Review HTML opened through Codex; local browser preview unavailable. No source/application changes, deployment, accounting edits, or board writes. Prior production/frozen items below unchanged.

---

## ProGraphics operational audit — October 11, 2026, AUDIT1 repair PUBLISHED; full acceptance OPEN

**What / where:** PG-20261011-AUDIT1; deployment dpl_6srhVUWWXyDFNVhcZXWNAy9i7hC2; isolated source 639f3254c15a42bb2fb06966920025e940646f29. Reports/registers/40-SOP guide: docs/prographics-operational-audit-2026-10-11/AUDIT-REPORT.html.

**Built / verified:** Two application files changed: checked/paginated CSV imports, confirmed bank row saves, denied reconciliation updates blocked before history, explicit partial-history failure, durable manual-entry request IDs and confirmed saves, five unavailable year-end package controls. 216 passed / 0 failed / 1 real-Postgres-only skip. Synthetic invoice/contact/check typing, save/reload, lost-response retry and financial staff flows passed. Seven staged/live routes and four native CSV exports passed canonical guards. Dave/Betty/Kari read-only role/history/refresh inspection recorded.

**Decisions / preserved:** No production SQL/business writes, role changes or email sends. 332 deployed baseline files preserved in prepared source, including all 32 checked Minuteman files; no rollback. Source recovery bundle and checksummed manifest retained. Comparison layout unchanged. Command Board SQL omitted under user restriction.

**Where stopped / next / pending:** Audit remains incomplete: 610 source control definitions inventoried, 40 SOPs drafted, individual variants tracked without blanket passes. Opening/source coverage, atomic operational reconciliation recovery, general operational reversals, physical/provider acceptance and remaining control execution remain open. Read-only paid invoice 8719 discrepancy confirmed: header subtotal $1,950; stored lines $2,161. Original record preserved; source evidence/controller correction required. New Life, MARCO, Bambooty and ProResources not changed. Minuteman separation remains separately pending.

**Key files:** src/pages/LedgerWorkspace.jsx; src/lib/prographicsBankImport.js; test/prographics-bank-import.test.mjs; test/prographics-operational.browser.mjs; test/prographics-manual-entry.browser.mjs; docs/prographics-operational-audit-2026-10-11.

---

## ProGraphics acceptance candidate — October 11, 2026, RC2 PUBLISHED

**What / where:** Applied the supplied brief to ProGraphics only, per Kari. PG-20261011-RC2, isolated source revision 7815e9c5de24fa528f37262d9f8a417f9f52ddc2; deployment dpl_Eu3i8zGBg18yVCZTnMBd3JKKdT3S. Full review and evidence: docs/prographics-acceptance-2026-10-11/RELEASE-REVIEW.html. Existing cash-basis production is active; prior local-only/accrual status entries below are historical.

**Built / verified:** Added exact-cent TB/P&L/BS/complete-GL CSV exports; basis comes from full snapshot and missing metadata fails closed. Twenty-area editable onsite checklist at https://tools.caresmn.com/prographics-acceptance/index.html. 205/206 selected tests passed, zero failures; skipped real-Postgres concurrency check separately passed among 39 core + one production-shaped PostgreSQL tests, plus restart durability. Fictional accounting/staff browser flows passed. Canonical build/output validation, seven staged and seven live routes, and all four native export downloads passed with CARES_SMOKE_ACCOUNTING_EXPORTS=1.

**Decisions / preserved:** Latest deployed-source base, existing configuration unchanged, no production SQL/business writes. Minuteman files and prior check/invoice fixes preserved. RC1 export basis omission caught during additional live verification and corrected in RC2; no monetary calculation changed. Verified source Git bundle and live-schema fingerprint saved; not a production database backup. Command Board SQL update omitted under Kari's explicit restriction.

**Where stopped / pending:** Scoped software release accepted; financial acceptance BLOCKED. 268 journals / zero unbalanced / zero opening journals read-only at 18:14 UTC. Opening evidence, historical source coverage/classifications, general payment/reconciliation correction procedures, cash-basis onsite/physical printer acceptance and independently verified production recovery remain open. Synthetic lab is localhost:5182 with isolated in-memory API at localhost:5193, no login; existing accrual lab clearly labeled, production cash lifecycle separately database-tested. Future-client fiscal/cutover/UI configuration and Minuteman separation remain future work. No Bambooty/ProResources/other tenant work.

---

## Invoice Edit selection — October 8, 2026, PUBLISHED AND VERIFIED

Root cause: editOrder resumed any existing browser recovery draft before considering the clicked invoice, so Edit on an older invoice reopened the previous/newest edited invoice. Fixed explicit selection priority, separate preserved working copies per document, and Other unsaved documents recovery controls. Same-document unsaved edits resume; switching does not discard other work. Storage failure leaves prior work intact. Existing optimistic version checks, historical/settled-record restrictions and accounting safeguards remain unchanged.

Published dpl_KJ1mC6WDkUTYDWyQzcjHBhTtBeaY over exact latest baseline dpl_35ji6RwryTMaKaQqf8YnTsrFDN8a through the canonical production deployment path. Only two application files changed: src/pages/LedgerWorkspace.jsx and src/lib/prographicsDraftRecovery.js. 329 baseline files unchanged, including all 31 Minuteman files checked. No business records, configuration values or accounting schema modified.

Verification: 23 targeted Node tests passed. Fictional browser save proved older selected invoice UUID alone updated, newest business record unchanged, and both working copies survived switching/reload. All seven preview and production routes passed authenticated shared smoke. Additional isolated authenticated browser checks passed invoice switching and draft preservation on both deployment URL and production, with invoice writes blocked and zero attempted business writes/runtime errors. Temporary sessions revoked and session file removed. Previously open browser tabs require a reload to load the new bundle.

Evidence: .prographics-release/guarded-0b7a2869-df00-437d-845b-935dff47a73b/release-report.json. Tests: test/invoice-edit-selection.test.mjs, test/invoice-edit.browser.mjs, test/invoice-edit.jsx, test/invoice-edit.html. Existing historical roadmap items stay unchanged; focused invoice-edit repair is complete. Minuteman separation remains pending, not performed.

## Firespring migration reconciliation — October 8, 2026

230 discovered | 230 products harvested | 230 products Owner-Hidden | 201 distinct original files stored | 610 asset references | 0 failed/unavailable assets | 29 Kari Review items | 0 storefront assignments

All 16 root / 33 total catalogs inventoried. All originals independently preserved in private Minuteman-managed mmp-catalog-assets, byte checksums verified. Tables: mmp_products, mmp_product_sources, mmp_product_assets. No source modification, publication, unhiding, or storefront assignments. Duplicate candidates preserved as separate IDs and flagged; 29 records need Kari review for source blanks or possible duplicate matches. No unresolved migration exceptions. Non-owner RLS returns zero hidden details/files. Report: work/minuteman-firespring-harvest/reports/RECONCILIATION.md. Harvest completed in the morning, not overnight. Staged source fidelity is complete; operational portal presentation/ordering was not acceptance-tested by this migration. Older status entries below are historical.

## Firespring harvest proof — October 7, counts and samples extracted; no import

**Current result:** Kari supplied authenticated source https://my.firespring.com/website/1204/libraries/catalogs/item/1671104/edit and clarified Kevin is this primary agent. Separate agent stopped; primary directly accessed the existing authenticated Firespring session. Read-only mpup Store inventory: Accessories 21, Apparel 32, Drinkware 13, Hats 6, Stickers & Magnets 6, Yard Signs 50; 128 occurrences / 128 distinct source item IDs. Each branch has one page at 200 rows/page; no nested branch rows found. Evidence work/minuteman-firespring-harvest/inventory.json.

**Sample proof / review:** AC02 item1671104: 1+ at $35/unit, required Checkboxes Select iPhone Model, 27 ordered options, Per Unit scope, with blank modifier fields faithfully preserved. AP11 item1670596: 1+ at $23.50/unit, required Radio buttons Size and Base Color; 3X has +$0.49/unit, several size modifier tiers blank. YS11 item1670522: 1+ at $24/unit, optional Checkbox Add Stakes, +$1.95/unit from quantity1. All three default quantities blank; inventory/settings/shipping/tax/layout and source image/download URLs preserved. Three single-base-tier samples; no multi-row base discount example verified. Attribute/option internal IDs not exposed by inspected UI; absent rather than invented. Asset binaries not yet downloaded. Evidence work/minuteman-firespring-harvest/samples.json; JSON count/ID/option/modifier integrity checks passed.

**Classification / stopped:** No imported rows. AP20/AP21 same-title distinct IDs/SKUs flagged probable duplicate for Kari, never merged. SM16 SM17 title flagged dual-reference review. No obsolete determinations. Sample blank/ambiguous values require review and existing target schema still needs faithful checkbox/scope/source-field mapping before full import. Nothing saved, deleted or changed in Firespring; no storefront publication or infrastructure changes. Future rows must owner_hidden=true, portal_visible=false,no storefront assignments. First-phase report ready; full import not committed. Earlier access-block notes below superseded.

**What / decisions:** Kari explicitly authorized Kevin to harvest mpup Store starting Accessories, Apparel, Drinkware, Hats, Stickers & Magnets, Yard Signs. First phase is read-only branch inventory/count and parsed samples before committing full import. No source alterations/deletions or automatic publication. Source catalogs are provenance, not target hierarchy. Preserve ordered typed attributes and option modifiers with per-unit/all-units scope, full pricing tiers, source IDs/paths, descriptions/SKU/quantity, assets, inventory, shipping/tax/order/layout metadata; absent values remain absent. Flag likely duplicates and uncertain/obsolete material rather than destructive merges.

**Where stopped / pending:** Kevin delegated through collaboration. Workspace search has no source export; available browser inventory exposes no authenticated Firespring session. Public www.mpuptown.com is not sufficient for full private catalog fields. Exact Firespring admin URL/session or export requested. Branch counts and parsed sample extraction not yet verified. Current target options schema lacks faithful checkbox type/multi-select/modifier-scope and some source metadata fields; no target conversion or schema changes in this phase. Source preservation must precede mapping.

**Safety / next:** Eventual imported rows require owner_hidden=true, portal_visible=false and no storefront assignments. Owner-only details and counts-only nonowner access enforced by existing hold; selected portals need both explicit owner assignment and permission. No products imported, no source content changed, no new publication by harvest task.

## Minuteman Owner-only catalog hold — October 7, LIVE AND VERIFIED

**What / decisions:** Kari authorized product-level Hide from everyone except me, other staff seeing product counts, and explicitly selected portal exceptions before her $2,000 payment. Existing fixed owner accounts now display Owner; no new role, identity or privilege was granted. Owner-only hold is manual until Kari confirms payment and unchecks Hide. Existing catalog products keep their prior visibility; no Firespring import yet. Four-approval gate unchanged (two real approvals at verification).

**Built / where:** Products editor has Owner-only Hide and a separate Allow this hidden product in assigned customer portals checkbox. Main/Union never expose held products. Customer portals require both explicit portal permission and assignment. Other staff cannot retrieve held products, assignments or associated private assets, edit/release them, or create a hold. Protected aggregate RPC gives total/hidden counts only. Requests enforce the same storefront visibility. Live catalog remains 16 products / 0 hidden.

**Verified / release:** Six Node regressions, mocked Owner/nonowner browser controls, real SQL rollback fixtures for RLS/aggregate count/save RPC/portal exception/forged request/release, and live read-only owner UI passed. Canonical guarded release dpl_35ji6RwryTMaKaQqf8YnTsrFDN8a over dpl_Avrf3CCaghydG42S7rZsVim8D1Wk passed staged and production shared smoke. Evidence .prographics-release/guarded-e8f93b7e-d632-48a6-ae84-22079f7d391c/release-report.json; tmp/mmp-owner-hidden-live-result.json. Verification sessions revoked; SQL fixtures rolled back. Advisor flags protected count RPC as authenticated SECURITY DEFINER intentionally: active effective staff role check, fixed search_path, no anonymous execute. Existing unrelated shared advisor findings unchanged.

**Stopped / pending / key files:** Feature published. Firespring export/account source still needed before import; future imports must start owner_hidden=true, portal_visible=false, no public assignments. Public preview files already published cannot be made secret by hiding a catalog row; newly imported production assets must remain private. No migration, payment integration, infrastructure transfer or ProGraphics feature change. Files sql/mmp-owner-hidden.sql; supabase/migrations/20261007225842_mmp_owner_hidden.sql; public/mmpuptown/assets/admin.js; test/mmp-owner-hidden.sql; test/mmp-owner-hidden.browser.mjs; tools/mmp-owner-hidden-live.mjs.

## Minuteman already-sent activation link continuation — October 7, LIVE AND VERIFIED

**What / built:** Used-link errors now clear the activation hash and show Sign in & set password. Successful existing-password authentication opens password setup identifying that same account. Same-tab activation is handled. Single-use token expiry and the all-four approval gate remain enforced. Kari has already sent recipient links; no blanket resend or replacement of other recipients' links occurred. Accounting's previously requested password remains usable; no real-user password or acceptance changed by this release.

**Release / verification:** dpl_Avrf3CCaghydG42S7rZsVim8D1Wk, canonical isolated source deployment over dpl_2dnXx4jHAniPxhFPthYnee5LYhAd. Staged and production shared smoke passed. Mocked flow and real local/live synthetic activation → password save → sign-out → consumed link → password sign-in → named-account password setup → expired-session refresh passed. Synthetic sessions revoked and account disabled. Evidence .prographics-release/guarded-1bcb8aa0-c4c6-40f2-86fc-49e72e4f947f/release-report.json; tmp/mmp-password-live-result.json. Key file public/mmpuptown/assets/admin.js; handoff docs/minuteman-access-gate.md.

**Stopped / limitations:** An invalid token still requires actual authentication. Password-enabled users can continue from their existing links; an expired link for an account without a working password needs fresh private activation. One new accounting link was generated before Kari clarified no resending; it was not opened or emailed. Other links untouched; no migration or infrastructure separation.

## Minuteman password/session reliability — October 7, LIVE AND VERIFIED

**What / where:** Kari reported Invalid login credentials with kari@karikounkel.com and requested her usual password plus Administrator access, separate from accounting@mpuptown.com. Backend verifies her original fixed user ID is active Administrator/owner and accounting is a separate invited account. Neither had recorded agreement acceptance. No identity, role or legal acceptance was moved.

**Built / tested:** Fixed concurrent refresh race in public/mmpuptown/assets/catalog-api.js: concurrent protected requests share one refresh promise; a late refresh cannot revive a signed-out session or replace a newer login. Six Node tests passed. Real approved synthetic-account browser test saved a password through activation, signed out, successfully signed back in with that password, and refreshed an expired session, both locally and on production. Temporary test sessions revoked and account disabled; no real-user password changed by agent.

**Release:** dpl_21U4iQ68s7emfzAsYLUDibUp3MQQ, canonical guarded source release over dpl_GtNc1z6Sbu2gJt9Apq1nvKhfgptQ. Build, staged and production smoke passed. Application source hash comparison confirms only catalog-api.js changed; src/ProGraphics, server/API and other hosted Minuteman files unchanged. Evidence .prographics-release/guarded-67474f08-297a-4836-bd15-3a602eb3c186/release-report.json; tmp/mmp-password-local-result.json; tmp/mmp-password-live-result.json; test/mmp-session.test.mjs.

**Where stopped / pending:** Generated and opened a private recovery form specifically for existing kari@karikounkel.com; single-use token was consumed and removed from address bar. User must enter and submit their desired password themselves; agent cannot know or reconstruct the usual password. Form was still awaiting entry at last UI check. No recovery email sent, no real password automatically changed. The user's existing signed-in Admin tab was left intact. Four-account prerequisite and owner exemption preserved; no recipient invitations created by this task.

## Minuteman ALL FOUR approval correction — October 7, LIVE AND VERIFIED

**What / where:** Corrected Kari's requirement: all four designated Minuteman accounts must accept before any obtains protected access. Review ends at “among entities,” with no subsequent invited-staff directions. Exact typed acknowledgment remains on the actual recipients' acceptance form. Kari's two fixed owner Administrator accounts are exempt and can prepare invitations without accepting a client agreement.

**Built / verified:** Version 2026-10-07-v2; database and user-management server enforce own acceptance plus four active designated account approvals. First three approvals remain locked; fourth unlocks assigned roles, never elevating role. Waiting screen shows count and Check approval status. SQL transaction tests prove 0–4 behavior, role/RLS enforcement and inactive-required-account denial, with complete rollback. Five Node tests and revised mocked UI test passed. Live browser/data/API tests confirm owner access without acceptance, trimmed text, accepted nonowner remains group-locked and cannot bypass by hash/reload. All temporary sessions revoked, synthetic staff/acceptance removed and test account disabled. No real user's acceptance fabricated.

**Release:** dpl_GtNc1z6Sbu2gJt9Apq1nvKhfgptQ via npm run deploy:production -- --scope minuteman, preserving current baseline dpl_4nPwsXKerih7St9qmNU6DxqXi1qQ. Guarded build, staged and full production smoke all passed. No ProGraphics app/ledger changes. Evidence .prographics-release/guarded-ff706812-92d6-44c8-a5de-890f8eff3f89/release-report.json; tmp/mmp-four-approval-live-result.json. SQL sql/mmp-four-approvals.sql supersedes prior individual-only behavior.

**Pending:** Recipient roles and private activation links prepared through Admin → Users. No intended-recipient invitations sent or activated. Kari only reviews wording; her own acceptance is not required. Prior ownership conflicts remain flagged and unchanged. Current handoff docs/minuteman-access-gate.md. Earlier v1 notes below are historical and superseded.

## Minuteman access agreement v1 — October 7, historical; superseded by ALL FOUR gate above

**What / where:** Per-user agreement gate in Minuteman Admin, with review-only page at public/mmpuptown/agreement/index.html. CARES Consulting Inc. owns technology; client retains business data/materials. No ownership transfer, consolidation or migration.

**Built / verified:** Exact typed acknowledgment plus checkbox; versioned agreement and user/time evidence; database staff-role enforcement plus independent user-management API guard. Each staff member, including Administrators, accepts individually. Public storefronts unaffected. Six Node tests and mocked browser flow passed. Actual database transaction tests passed for denied-before/unlocked-after, wrong text/checkbox/version, individual isolation, immutable initial timestamp, anonymous/nonstaff/direct-write denial, and public store preservation. All database changes and test acceptance rolled back.

**Release / acceptance:** Vercel sign-in restored; helper selects refreshed CLI credential. Canonical npm run deploy:production -- --scope minuteman published dpl_4nPwsXKerih7St9qmNU6DxqXi1qQ over production dpl_5rhgCm2yabAhEmS2sCHCfbG53qzZ. Staged smoke passed. Initial live ProGraphics smoke reported records changing during loading; complete live suite passed on fresh-session recheck, initial failure retained. Agreement database setup and role-enforcement migrations applied. Actual live synthetic Administrator and Catalog Editor activation → individual agreement → permitted access passed, including direct database/API denial, hash bypass denial, independent acceptance and unchanged role restrictions. Synthetic sessions revoked, membership/acceptance removed and accounts disabled. No intended recipients invited; no real person marked accepted. No ProGraphics application/ledger changes. Review https://tools.caresmn.com/mmpuptown/agreement/; Admin https://tools.caresmn.com/mmpuptown/admin/.

**Pending:** Kari's own individual acceptance at staff sign-in; creation/private sharing of each intended recipient's activation link with selected role in Users. No automatic email. Previously reported ownership conflicts remain flagged and unchanged. Evidence: .prographics-release/guarded-25d197e2-1b85-4996-8f3a-c1fc446d643c/release-report.json and tmp/mmp-gate-live-result.json.

**Key files:** sql/mmp-access-agreement.sql; public/mmpuptown/assets/agreement.js; public/mmpuptown/assets/admin.js; server/mmpAdmin.js; test/mmp-access-agreement.sql; test/mmp-agreement.browser.mjs; test/mmp-agreement-api.test.mjs. Review screenshot: tmp/mmp-agreement-preview.png.

## Minuteman check registers / loan addendum — October 7, SEALED

Read-only addendum from the preserved QBO archive: work/minuteman-qbo-archive/2026-10-07-registers-loans and separate ZIP/SHA-256. Includes 5,791 check-type payments (all match corresponding bank GL amounts), 12,517 posting rows across six bank registers, 43 loan-related liability accounts with 1,788 postings and zero balance-rollforward differences, 483 linked bill payments, 48 copied potential loan documents, and separately labelled cached FlowSuite payment schedules. No live API requests; original archive ZIP hash unchanged. Cleared check status and lender rates/maturity/payoff are not established by the preserved ledger. Kari acceptance still pending; no disconnect, shutdown, release or accounting changes.
## Minuteman final QBO archive — October 7, EXTRACTED / acceptance pending

**What / where:** Read-only preservation for September 30, 2026 close and eventual shutdown review. Full live capture: work/minuteman-qbo-archive/2026-10-07-live, accompanying ZIP and SHA-256; initial cached capture preserved separately and inside live ZIP. Live CompanyInfo confirms I A Z Corporation dba Minuteman Press Uptown, realm 9130357496482776, org 1c854b80-c523-4a81-8344-c3edb033063b in FlowSuite Pro mqnvaiijuwqmkonnhlnw. No release or accounting/configuration changes.

**Built / verified:** 54,096 current entity records count-verified, raw API JSON and normalized CSV, complete financial object lines, 1,261 attachments downloaded with matching sizes plus two invoice PDFs, manifest/file inventory/hashes. Complete historical GL: 97,942 posting rows, June 27, 2005–September 30, 2026, exactly matching independent journal exports by transaction/account/signed cents including multiplicities; every source balances. All supported raw financial objects and GL source IDs match both directions. Broad historical reports silently clipped despite HTTP success; retained as evidence but replaced by nonoverlapping annual 2005–2026 partitions. All accounting entity metadata checks show zero modifications during capture; Preferences final payload has identical SHA-256.

**Reconciled:** October-start fiscal year confirmed in Preferences. GL account balances match both required TB dates; TB balances and BS assets/liabilities/equity plus fiscal income tie; matching fiscal P&Ls and requested calendar P&Ls reconcile through calendar GL movements. September 30 AP detail/summary/GL all $142,194.99. Native QBO AR aging and native AR GL both zero, but separate FLEX CRM receivables account 1126 is negative $6,014.36: external customer subledger unavailable, overall receivable substantiation remains open. Calendar 2025 net income negative $38,327.87; January–September 2026 $416,747.21. These are preserved QBO arithmetic controls, not a certification of accounting correctness.

**Authorization / preservation:** Kari signed in and expressly approved existing automatic renewal, then narrow temporary access-token read after automatic review blocked it. Existing reader performed normal renewal; all direct Intuit requests afterward GET-only. Token stayed out of archive/logs and temporary credential removed. QuickBooks transactions/settings/scopes/identity untouched. Current connection remains connected; FlowSuite remains running. Local capture/ZIP sealed read-only with SHA-256; private archive path ignored by Git. No remote upload/sharing or deployment.

**Pending / limits:** Kari acceptance before any disconnect/shutdown. FLEX customer aging at September 30; TaxSummary permission denial; TaxPayment region unsupported; TaxAdjustment invalid API context; payroll raw domain payload/timestamps unavailable for 1,351 report-only accounting sources. Recent CDC preserves 28 financial deletion markers; TimeActivity CDC hit 1,000-object cap although all 13,840 current time records through cutoff were separately preserved. Original deleted versions/full audit log/older deletions unavailable; no WORM or independent off-device backup claimed. Exact details in ARCHIVE-MANIFEST.md, manifest.json and reconciliation/. Prior frozen/pending work unchanged.

## Not Random personal-site presentation — October 7, PUBLISHED

Exact supplied HTML published independently on DreamHost at https://karikounkel.com/not-random (standard redirect to trailing slash). One new directory/index.html only; 30,239 published bytes match original SHA-256. Existing homepage/root HTML pages, robots and sitemap responses unchanged. No navigation/promotional additions. All 17 Drive resources resolve for connected owner; permissions returned owner-only, public playback unverified. No sharing changes. No shared-project Vercel release or app edits. Evidence and full publication record: work/not-random/PUBLICATION.md, baseline.json, live.png.

# cares-works — STATUS
## Confirmed test check cleanup — October 6, APPLIED AND VERIFIED

Final read-only follow-up: staff successfully entered the actual Networks MN $297.85 replacement as Check #12214 at 2026-10-06 23:45:19.856113 UTC. This is a NEW operational entry and sealed payment journal, not the deleted test. Exactly one unreversed payment remains; net bill expense is $297.85. Bill is now correctly paid. DO NOT undo this new real payment. Staff RLS visibility verified with both authenticated subject and email claims; earlier sub-only read lacked the email required by existing organization membership policies. Updated accounting source regression suite: 38 pass, one independent-connection test skipped. Security advisor has no warnings for the two changed functions; existing private no-policy tables remain intentional and browser audit/permit access remains denied.

Kari confirmed Networks MN $297.85 check #12214 was a test and explicitly approved the narrow permanent guard/repayment changes after automatic approval review required that additional scope. Applied atomically: original sealed journal preserved, one balancing reversal posted, complete original entry/bill captured in immutable correction audit, test operational entry removed from notebook/register, original bill reopened unpaid with paid_at null. No real replacement payment was committed by the agent. Saved numbering suggestion advanced from already-used #12215 to unused #12216; physical stock remains editable. Staff may enter the actual payment now; already-open pages need fresh data to show the cleanup.

Guard exception requires a transaction-local private permit, controller-authored immutable audit matching the entire original entry, and sealed original/reversal journals. Browser roles cannot insert that audit or call permit. Cash repayment only accepts the exact reviewed check/bill reversal after its operational test source is archived; other corrected bills remain blocked. No privileges or RLS widened; no original journal/line deleted or rewritten.

Hosted rollback test passed cleanup, exact staff authenticated-poster replacement payment, retry idempotency, duplicate check rejection, unreviewed deletion rejection, unreviewed repayment rejection and deferred commit checks before rollback. Live commit verified zero test register entries, bill unpaid $297.85, one reversal, original sealed journal and one immutable audit snapshot. App check-print/address BUILD_PROGRESS items remain done; no frontend change/deployment required. Minuteman unchanged. Key files: accounting/reviewed-test-check-correction.sql, accounting/confirmed-test-check-12214-cleanup.sql, test/confirmed-test-check-12214.rollback.sql. Incident-specific cleanup/test scripts are historical evidence and must not be rerun after the live cleanup.

## Check commit permission follow-up — October 6, FIXED LIVE

User screenshot exposed `permission denied for table journals` after the check-number repair. Exact failure reproduced under authenticated with SET CONSTRAINTS ALL IMMEDIATE: deferred require_sealed ran after SECURITY DEFINER posting returned, so it tried reading journals as the restricted caller. Earlier rollback-only tests reset role/rolled back before deferred constraints ran; that test gap is now fixed.

Applied fix_deferred_journal_validation_role: only the internal invariant trigger require_sealed now runs as its existing owner, with fixed empty search_path. No journal SELECT/INSERT grants added; verified authenticated still has neither. This trigger returns no journal data and cannot run as an ordinary RPC. Retested the hosted fictional accounting/check flow with deferred constraints flushed under authenticated: pass, all rows rolled back, balanced journals and tenant isolation retained. Check #12214 has zero recorded entries; failed attempt rolled back. Current app deployment remains dpl_5rhgCm2yabAhEmS2sCHCfbG53qzZ; database repair is effective immediately without frontend redeployment.

Updated accounting/native-core.sql, accounting/deferred-journal-role-repair.sql, hosted-cash-smoke.sql and test/prographics-check-number.rollback.sql to preserve the repair and commit-role regression. No real check issued by the agent.

## ProGraphics check printing — October 6, PUBLISHED AND VERIFIED

Production dpl_5rhgCm2yabAhEmS2sCHCfbG53qzZ at https://tools.caresmn.com/prographics. Exact October 5 production source baseline; only check UI repair plus existing release tooling. All 30 Minuteman source files preserved by hash. Preview and settled production passed all seven required routes including authenticated ProGraphics data loading. Live bundle bytes equal the tested build. Initial live /login console failure during promotion retained in report; fresh diagnostic and complete repeat suite passed.

Address root cause: CheckSheet was declared inside render and used as a React component, so each keystroke remounted the textarea. It now renders with a stable DOM identity. Native check submission validates the full number, locks double clicks, reports errors inline, keeps the confirmed sheet mounted for asynchronous print dialogs, and allows copy printing without another payment.

Number root cause: database check_batch treated the editable physical-stock number as a strict assertion of the suggested next number. Applied migration fix_check_stock_number_validation: honor requested stock number, retain serialized book/org locks and idempotency, reject existing check numbers in that bank/range, preserve monotonic next-number suggestion. Existing function permissions and empty search_path retained; anonymous execution denied. No existing business-record corrections or real payments performed.

Tests: 38 accounting regressions passed (one independent-connection concurrency test skipped); browser fictional check test passed multiline continuous typing/focus, custom #54321, one print invocation, retained printable sheet and copy with unchanged journal count. Hosted fictional transaction with repaired function passed custom number, idempotent retry, duplicate rejection and balanced statements; every test row rolled back. Security advisor reported unrelated existing project findings; no check_batch privilege regression. Earlier build-progress items for printed checks and recipient address remain marked done.

Evidence: .prographics-release/guarded-f2b5d140-4e7e-4b8a-8f4c-d329e818fa1c/release-report.json. Key files: src/pages/LedgerWorkspace.jsx; accounting/native-commands.sql; accounting/check-number-stock-repair.sql; test/prographics-check-print.browser.mjs; test/prographics-check-number.rollback.sql. Minuteman separation remains pending. Saved CLI token refresh is handled by running the supported Vercel CLI before direct API tools when expired.


## FlowSuite FLEET showcase — October 6, LOCAL / publication blocked

**What / where:** New interactive marketing/showcase page at public/flowsuite/fleet/; local preview http://127.0.0.1:5266/flowsuite/fleet/. Intended public route https://tools.caresmn.com/flowsuite/fleet/ is NOT published. Kari authorized the attached FLEET brief excluding its closing banter. This is a fictional product-vision showcase, not a production fleet system.

**Built:** Shared FlowSuite/CARES colors, fonts and identity. Interactive chronological driver check-in with animated Dispatch / Payroll preparation / Route billing consequences; vehicle hold remains visible after Amanda checks in; reset. Fleet readiness, driver training, student training, routes/trips/contracts, safety/documents, origin story since approximately 2014 and configurable-system philosophy. Cash Horizon month selection, 30-day/90-day/12-month/3-year/all ranges, chart selection, five category drill-downs and monthly obligation ledger plus loan-only future schedule through May 2031. April 2028 uses $523,800 inflow / $487,230 required / +$36,570 net. All booking CTAs use https://cal.com/kkounkel/flowsuite-demo.

**Verified:** JS syntax; real browser desktop and 390px/360px phone layouts with no horizontal page overflow; driver arrival propagates to three panels, exception remains, reset clears state; April totals and category/ledger reconciliation; range counts and final $0 loan balance; no captured browser console errors. Fictional data only, local interactions, no product backends or business-record changes. Local screenshot evidence under docs/flowsuite-fleet/.

**Where stopped / pending:** Vercel saved CLI credential was rejected with HTTP 403 invalidToken during current-production baseline read. No candidate created or publication attempted. Required CARES smoke authentication and protection-bypass environment are also absent in this process; no attempt to bypass or manufacture them. The current production source could not be refreshed, so no older October 1 snapshot was staged. October 5 recovered ProGraphics and hosted Minuteman remain untouched. Public release requires restored Vercel access and valid guarded test configuration, then exact-current source staging and npm run deploy:production -- --scope shared --source <prepared-directory>, with all required preview and production acceptance gates.

**Key files / next:** public/flowsuite/fleet/index.html, fleet.css, fleet.js; tools/fleet-stage.mjs prepares latest production source plus only these assets and a FLEET route, checks hashes, and never publishes. Release instructions remain docs/PRODUCTION-DEPLOYMENT.md. Actual FLEET database, integrations, authentication, payroll, forecasting and production product development are explicitly outside this task.


## October 5 outage repair — PUBLISHED AND VERIFIED

Production: dpl_Gct8kZPCgbmcw9scJYQhv99GWptG, https://tools.caresmn.com/prographics. Fresh source-built candidate passed build configuration/output validation and all seven preview browser checks before promotion. All seven production browser checks passed, including authenticated ProGraphics data loading (6,592 invoice/order records). The first immediate post-promotion check failed during the domain transition; the settled domain was inspected and the complete authenticated suite rerun successfully. Evidence retains that initial failure.

Restored exactly 19 established September 28 ProGraphics files. All 30 hosted Minuteman source files preserved by hash; catalog counts remain Main 16 / Union 4 / Demo Company 2, with computed Demo business-card price $39/250. Browser bundle initializer uses unchanged Production URL/anon configuration; checked server credentials absent. No business data/schema edits. Temporary verification sessions revoked and local session file removed. Vercel automatic domain assignment remains disabled.

Canonical release source uploads now use the documented per-file API and immutable existing hashes, with bounded idempotent upload retries; API helper accepts empty successful responses. Nine release unit checks rerun passed; prior six browser guard tests passed; actual preview and production browser suites passed. Deployment acceptance report: .prographics-release/guarded-fabcdcab-4ee3-423f-b576-29c2b3f8792b/release-report.json. Minuteman project separation remains recorded, not performed. Historical pending statements below are superseded by this release.

## Shared deployment guards — October 5, implemented; outage publication pending

**What / where:** Canonical production path is `npm run deploy:production`, using existing `tools/mmp-release.mjs`. All releases rebuild shared React from source with unchanged Production browser configuration; no dist uploads. Minuteman and CARES/ProGraphics each require the other hosted routes to pass.

**Built / tested:** Required-env preflight, actual Supabase initializer binding, compiled-output receipt/source/config/hash validation, staged candidate authenticated browser smoke, concurrent-production check, promotion and mandatory live smoke. 15 automated tests passed, including HTTP 200 crashes/blank pages, missing/privileged configuration, stale/tampered bundles and publication gate ordering. Fresh source build passed. Canonical check-only build passed; no candidate created by guard testing.

**Platform decisions:** Live Vercel buildCommand is `npm run build`; automatic custom-domain assignment is disabled. Verified production remains `dpl_6wRnEp3vEF8oqo8y2GHtiaG3hLKe`. Repository vercel.json disables automatic Git deployment. Administrator API bypass remains possible and prohibited by deployment instructions. No environment values, app data/schema or business functionality changed by this guard task.

**Where stopped / next:** Outage repair has NOT been published. Correct recovered September 28 ProGraphics preview is `https://cares-works-c1ebryzlx-kari-kounkels-projects.vercel.app/prographics`; authenticated user acceptance is pending. Later inspected deployments reverted the modern workflow; no newer modern ProGraphics release was found in inspected history. Do not publish unaccepted local application edits. Future recovery publication must use the canonical guarded source path with authorized smoke authentication and protection bypass.

**Pending separation:** This week move Minuteman website/catalog/Admin/Customer Stores/Union into its own Vercel project and Minuteman-owned tools/domain configuration, with independent guards. Recorded only; no separation performed.

**Key files:** docs/PRODUCTION-DEPLOYMENT.md, AGENTS.md, tools/mmp-release.mjs, tools/deployment-guards.mjs, tools/vite-production-guard.mjs, tools/build-production.mjs, tools/shared-production-smoke.mjs, test/deployment-guards.test.mjs, test/deployment-browser-guards.test.mjs. Historical status follows.

## FlowSuite round two — October 1, DAC board page LIVE

**What / where:** Public board page https://tools.caresmn.com/flowsuite/dac/ for October 2 presentation. Uses existing CARES architecture, shared FlowSuite tokens, four sanitized actual-code screenshots. Approved Founding Pricing $299 implementation + $59/month through December 31, 2026. No future prices, MN-ITS-complete claim, payroll-processing claim or private pilot/client data. Northome waiver recorded only in internal report.

**Evidence:** DAC deployed source `dpl_8FW6Aud9rao6nP8xKH36H1pxetxD` inspected by hash; 75/75 operations tests pass. People/staff, scheduling, interval staffing/temporary ratios and briefing views verified with entirely fictional records in a read-only local copy. No live business records queried for screenshots. Financial/export areas explicitly partial/planned. Browser verified public page, image loading, pricing, CTA and responsive fit.

**Other delivery:** Credit-card payoff planner now listed in existing public.tools catalog (id `3f7629b9-2326-4e9f-bea2-0e0631cb7902`), with live catalog-to-tool navigation verified. Shared UX doctrine recorded in `flowsuite-round-two/ux-contract.json`; application-wide UX migration remains open. Read-only shared-platform audit and Lite tenant/capability assessment completed and documented, not backend activation.

**Release:** CARES `dpl_6eQ6FqvtAFE4xGJ8pJux6pbpyU5i`. Preserved latest 637-file baseline: 635 unchanged, only `vercel.json` DAC route and `src/App.jsx` exact payoff static-navigation exception modified; new public DAC assets/tokens added. No ProGraphics ledger code/data/workflows, DAC production application, auth/schema, MARCO or MN-ITS changes. No new infrastructure. Staging `.prographics-release/dac-board-20261001`.

**Open decisions / next:** Dedicated Cal.com link; founding-rate duration and accounting scope; standard Lite modules and customer configuration; validated year-end accounting cutover. Live module entitlements exist but cover only four module keys and default missing rows enabled. Pro, DAC and ProGraphics use different organization models; two-customer access tests and mapping remain required. Existing notification hub confirmed active; analytics, error/audit consistency and payment-failure handling need further verification. No duplicate services built.

**Key files:** `flowsuite-round-two/README.md` (Finnegan report and full audit); `dac-source-manifest.json`; `release-scope.json`; `board-live.png`; `public/flowsuite/dac/`; `public/flowsuite/shared.css`. Earlier notes below are historical.

## FlowSuite Lite demo refinement + standalone payoff — October 1, LIVE

**What / where:** Landing https://tools.caresmn.com/flowsuite/lite/; demo `/flowsuite/lite/demo/`; independent tool `/credit-card-payoff/`. Old FlowSuite marketing Lite URLs redirect to CARES. Existing projects only; no new infrastructure. Detailed Finnegan handoff leads `flowsuite-lite/README.md`.

**Built:** Demo-only overview with charts and linked financial summaries; narrower full-width workspace; populated register (four checking entries plus a card purchase), two unpaid bills and one paid bill; six actual demo screenshots and refreshed hero. Independent browser-only monthly card-payment allocator supports APR/balance ordering, statement minimums and budget shortfall handling. Betty's original connected tool and all production application source/data preserved.

**Verification / release:** Seven payoff arithmetic checks pass, demo/Astro/CARES builds pass, live redirect and working demo checked, landing images load, public payoff example allocates $300 correctly. CARES `dpl_31pEyxU4eeZmxorJe2vgb51v3Qbr`; marketing redirect `dpl_53GkYLEiumfVY7fQsig12kLibQKb`. Exact previous production baseline retained: 372 source files unchanged, only existing routing configuration modified plus new static public files. Release staging `.prographics-release/lite-20261001`.

**Open:** Lite backend capability enforcement, tenant isolation tests, ProGraphics integration mapping, accounting release discrepancy and repeatable customer activation remain incomplete. Overview is demo-only, no live accounting claim. Payoff standalone version does not yet include promotional expiry/credit-limit fields or a payoff-date forecast. Main product remains one FlowSuite family; customer-specific workflows are not rewritten in this pass.

**Key files:** `public/flowsuite/lite/`, `public/credit-card-payoff/`, `flowsuite-lite/demo/src/Overview.jsx`, `fixture.js`, `shell.css`, `tools/test-payoff.mjs`, source manifest and final screenshots. Earlier deployment/status notes below are historical.

## FlowSuite architecture clarification — October 1

Kari clarified: CARES Works owns public discovery/sales; existing FlowSuite owns the product. Lite/Pro/DAC should be capability/configuration sets; ProGraphics ultimately a Lite customer. No new Lite project/domain/database/infrastructure. The already published page reused the existing `flowsuite-pro-site` project, but final CARES Works placement remains pending. This direction supersedes any implication below of a separate Lite product or ledger-only activation path.

Initial FlowSuite Pro source audit found org roles, module entitlements and restrictive database/storage policies, but only property/planning/year-end/financial-snapshot modules are configurable; accounting/employees/production/payroll are not, and absent entitlement rows default enabled. Verify deployed enforcement and two-customer isolation before activation; no new infrastructure is justified by current evidence. Details in `flowsuite-lite/README.md`.

Blank-page check: actual user's in-app tab rendered landing and fictional demo successfully, with no captured browser errors. Returned to landing. Blank state not reproduced; no deployment changes made for this report.

## FlowSuite Lite launch — October 1, public landing page and demo LIVE

**What / where:** Additive product work is in `flowsuite-lite/`. Actual deployed ProGraphics workspace adapted into a fictional, offline demo with FlowSuite | Lite identity. Five real 1440×960 screenshots. Landing page built inside a verified snapshot of the existing FlowSuite public site, with $49/month + $199 setup and no history-import price. Existing ProGraphics, Pro, DAC and MARCO code/data unchanged by this task.

**Built / verification:** Demo and Astro builds pass. Five screenshots, no business-service requests, no browser errors; landing page passes 1440px/390px checks with all images loaded and no horizontal overflow. Latest deployment `dpl_6pAGkYArNM7tmbhFmd8LoTifGsQB` is READY. Public page: `https://flowsuite-pro-site.vercel.app/lite/`; fictional demo: `/lite/demo/`. Added requested stat cards, collection ring chart and invoice-balance bars, derived from the same fictional records: 4 invoices, $3,400 billed, $1,100 paid, $2,300 outstanding. The page labels charts as illustrations, not existing dashboard screenshots. ProGraphics production remains `dpl_EWMynneaRqvAFsTm6hkPibCQqc2K`.

**Where stopped / pending:** Kari explicitly approved making the production marketing site public after the initial auto-review rejection. Standard Protection is now applied to this marketing project only; previews/generated deployment URLs retain protection. Public page, demo and all screenshots were verified without redirects, including browser rendering. Business app security unchanged. `flowsuitepro.caresmn.com` does not currently resolve; use the verified Vercel production URL. Customer #2 activation and the accounting release discrepancy below remain open.

**Decisions / next:** ProGraphics contains broadly reusable business functionality. Existing organization RLS is a foundation, but hard-coded tax/staff/fiscal-year assumptions, fuzzy company matching, shared browser preferences and non-company-scoped import hashes prevent claiming Customer #2 activation-ready. Current live workspace lacks newer local native accounting/workflow code. Kari was asked whether to include investigation of that discrepancy; no production restoration attempted. This phase is not fully complete.

**Key files:** `flowsuite-lite/README.md` (audit, configuration/provisioning procedure, import limits and estimate, risks); `shared/flowsuite.css` inside that folder (family token baseline); `site/src/pages/lite.astro`; `demo/src/`; `source-provenance.json`; `site-source-manifest.json`; `demo-verification.json`; `site-verification.json`. Command Board has a dedicated FlowSuite Lite row with remaining items. Site source is staged here; the untouched external FlowSuite site checkout must not overwrite this release.

## IAZ actual loan payments — September 21, LIVE / VERIFIED

**What / where:** Populated the existing 15 editable loan schedules at `public/year-end/iaz-fy2025-k7m3q9/index.html`, shared `yearend_cockpits.state.loans`, with QBO cash payments for October 1, 2024–December 31, 2025. 186 monthly inputs, 96 allocated source transactions, $285,421.91 allocated. Each schedule retains actual cash dates, gross payments, amounts used and source/allocation notes in a collapsible payment detail. No 2026 actuals added.

**Decisions / limits:** Cash settlement date controls the month, not AP bill date; no double-counting bills and payments. Mixed Konica, Canon, Loffler and Brown payments are visible as Held pending allocation, not guessed. The one shared Loffler $3,795.60 reference is excluded from both possible schedules. AIS uses the bill-supported financing portion. Monthly interest remains an estimate. Automatic schedule true-up and misleading aggregate posting amount removed; model differences are not entries to post. Existing QBO balances, workpaper notes/adjustments and model formulas unchanged. No QuickBooks transactions changed.

**Verification / where stopped:** Saved loan data exactly matches prepared payload; non-loan shared state identical; source/monthly totals tie; no duplicate cash allocations or 2026 overrides. Live Highland detail visibly shows October 15, 2025 $12,100. Production dpl_F6mNTQ7tgzeL7Gs4GPD2ZXyMdjeh READY on tools.caresmn.com; retained latest concurrent color/layout changes and all 330 other deployed source files. Payment capture complete; flagged allocation and lender support exceptions remain visible. 2026 capture deferred by Kari.

**Key files / evidence:** Page above; current bookkeeping task folder `work/loan-payments-20260921/COMPLETION.md`, payment-detail.csv, loans-payload.json, before/after shared-state backups, validation.json and release-verified.json. No sensitive payment dataset added to public source files.

## IAZ loan schedule layout — September 21, LIVE / VERIFIED

**What / where:** Each editable amortization schedule now sits immediately beneath its matching loan balance row in the combined Loan balances and amortization schedules panel. All three NEON020 schedules group under account2970.22. The separate bottom schedule section is removed.

**Scope / verification:** Layout only; loan data, calculations, shared-state persistence and notes unchanged. Browser preview verified expanded schedule beneath the matching balance; script syntax and financial-code preservation checks pass. Isolated release compared against live deployment dpl_5hnHNH7NzTd2gNpvgySN55NVYY2Q: all329 other source files match by SHA1. Release page preserves the live Konica explanatory text; local source retains its own existing text.

**Where stopped / next:** Complete. Deployment dpl_5u52TJVmceboTyPtABf64PK45rDG is READY and assigned to tools.caresmn.com. Live page matches the prepared layout exactly; all329 other deployed source files are unchanged. No QuickBooks transactions changed. Key file: public/year-end/iaz-fy2025-k7m3q9/index.html. Only this page and this status note changed locally; unrelated work retained.

## IAZ Year-End Cockpit on CARES Works — September 21, committed / NOT DEPLOYED

**What / where:** the IAZ Year-End Cockpit (built 9/21 as a shared claude.ai page, https://claude.ai/artifact/9qgPAFqfboDpdy3iWkdcQK, still the live one) ported to `public/year-end/iaz-fy2025-k7m3q9/` — `index.html` + `logo.png` + `docs/` (40 PDFs/CSVs). Target URL once deployed: `https://tools.caresmn.com/year-end/iaz-fy2025-k7m3q9`. Token is fixed; the page reads it from its own path. Page palette mapped onto `/theme/cares.css` tokens (neon blue/green, ink, white ground) per the theme rule; `<base href>` set so `docs/` and `logo.png` resolve on any host.

**Shared state:** artifact-capability saving replaced by Supabase. `public.yearend_cockpits` (token, title, client_name, state jsonb, updated_at/by, active, owner_id) with owner-only RLS, plus `get_yearend_cockpit(p_token)` / `save_yearend_cockpit(p_token, p_state, p_updated_by)` SECURITY DEFINER RPCs granted to anon — same lockdown as the workpaper links. Applied to `qcikhcnclduakriextsz` as migration `yearend_cockpits`; SQL of record in `sql/yearend-cockpits.sql`. Row seeded with all 40 rows of the 9/21 state.json. Verified as anon in SQL: real token returns 40 rows, bogus token returns nothing, direct table read sees 0 rows. Optimistic "last saved by" name is a local prompt (`✎ your name`), stored per browser. Comments (a claude.ai feature) are gone; the per-row Basis/notes box is the shared note.

**Commit:** `aae21e3` on local `main` (public/year-end/*, sql/yearend-cockpits.sql, vercel.json rewrite now excludes `year-end/`). **Not pushed** — the linked-computer shell has no GitHub credential. **Not deployed** — no Vercel credential in that shell, and the cares-works production tree is an isolated curated release (live SHAs match neither HEAD nor the working tree; 8 ProGraphics src files live are untracked), so a full deploy from either would regress live ProGraphics. Deploying from HEAD/working tree was judged unsafe and not attempted. The isolated tree `.prographics-release/source` was spot-checked against live (9 files, all SHAs identical), so the cockpit was staged INTO that tree (`public/year-end/` + its vercel.json exclusion); `vercel --prod` from that folder is the deploy. Theme link is absolute (`https://tools.caresmn.com/theme/cares.css`).

**Open:** (1) push `e24eb7b` and deploy cares-works the usual way (Windows Git Bash / Vercel CLI, isolated-release tree + `public/year-end/` + the vercel.json exclusion); (2) alternative that never touches cares-works production: a separate static Vercel project holding only `public/year-end/` at `cockpit.caresmn.com` — needs a Vercel token in chat plus a CNAME at DreamHost (caresmn.com DNS is DreamHost, not Vercel); (3) Omega tab still hidden (`HIDDEN_TABS=['omega']`); P&L lines 6295/6245/6210/6270 and 4000 stub still carry June figures; KM-1/ROLLEM 7MB lease PDFs still not on the page; books items from the 9/21 breadcrumb (1012 2813, 1190 vs Omega 21000 off 10,217.76, NEON020 terms vs signed note, Presta/Loffler reclasses) unchanged.

## ProGraphics opening-source access — September 21, read-only evidence update

Safe access established through authenticated Supabase Storage, without opening ProGraphics or triggering Plaid. March 31 CorTrust PDF downloaded and all four pages reviewed: bank ending balance $5,543.29; this is not yet reconciled opening book cash. Existing local tax-return PDF pages 1/6 confirm the saved income figures but Schedule L/M-1/M-2 are blank; storage/local byte identity and filing acceptance are not yet established. No opening balances accepted or posted. Details/checksums: `docs/prographics-accounting-2026-09-20/OPENING-WORKPAPER.md`. Accounting remains local/incomplete, no production migration/deployment/activation; no operational records changed. Next: complete local validation/readiness package and resolve opening evidence separately. Command Board and in-app progress record this evidence checkpoint, not a shipped accounting release.

## MARCO lifecycle work — September 21, local frontend / incomplete release

Actual source is `C:\dev\marco-review`. Kari authorized the attached role/lifecycle/Academy clarification and today's role logins. Six role experiences and eight fictional accounts are implemented and browser-tested; live private Supabase lifecycle schema added. Preview: `http://127.0.0.1:5186/marco/`. Source handoff: `C:\dev\marco-review\docs\LIFECYCLE-IMPLEMENTATION.md`. All 37 legacy MARCO table counts/digests remain unchanged. No changes to published `public/marco` assets, ProGraphics, FlowSuite or CARES discovery.

Main earlier directive is missing; Kari said she will paste it. Legacy MARCO public-access migration was rejected by automatic approval review for potential disruption of old unauthenticated forms/links; **not applied**, and no approval inferred from Kari's clarification question. Existing staff passwords unchanged. New-workspace permission checks pass, but legacy exposure remains open. Release/integration acceptance pending; Command Board row `b663de26-ebd9-4bfa-9100-5f3bacd48ba9` tracks this as in progress.

## Native accounting integration — September 21, LOCAL / PRODUCTION NO-GO

**Directive / boundary:** Local accounting implementation authorized; no production migration, deployment or activation. April 1 fiscal year/cutover, accrual/USD. Operational history preserved, never reimported.

**Built:** Private `prographics_accounting` schema; balanced immutable journal/COA/mappings; explicit native finalization, receipt/deposit-match, credit/refund, bill/grouped-check and new/existing transfer paths. DEV-only staff integration, persistent retry identity, no fallback to legacy on failure. Draft work-state and manual-delivery evidence paths do not post. Invoice Accounting effect and report-to-source drill-down, AR/AP aging/coverage, reconstruction evidence, GL/TB/P&L/BS, period/reversal/reconciliation controls. Existing design retained.

**Verified:** 205 repository tests: 204 pass, one multi-connection test skipped there and passed separately. Actual PostgreSQL17.6: 38 core + one captured-production-shape test pass; 33 journals persist across restart. Both actual-component browser workflows pass including draft transitions, issue/multiple payments/overpayment/refund/two bills-one check/source effect and report/evidence/adjustment/reversal/bank pair review. Build passes,171 modules, existing bundle warning. Final 24-table/global fingerprints and 35 storage objects unchanged. #8719 preserved.

**Where stopped / pending:** Production NO-GO; full financial acceptance is not complete. Hosted Supabase Auth/PostgREST/full-RLS/restore rehearsal missing. Opening TB/AR/AP/asset/liability/equity and mappings remain unaccepted; original bank balance $5,543.29 is not reconciled book cash. Tax-return Schedule L/M-1/M-2 blank. April-forward external monthly comparison not completed. Material advance/return/receipt/operational correction and close policies require accountant/Kari decisions. Native correction preserves source status rather than silently rewriting it; check recovery/reconciliation amendment acceptance remains a release hold. No guessed balances or automatic history replay.

**Files / next gate:** `docs/prographics-accounting-2026-09-20/IMPLEMENTATION-REVIEW.md` now replaces the stale foundation checkpoint and contains architecture, tested lifecycle, mapping/opening decisions, precise risks, isolated migration, activation and rollback plan. `OPENING-WORKPAPER.md`, `integration-final.json`, `integration-storage-final.json`, tests and screenshots are evidence. Local fictional review at `http://127.0.0.1:5182/test/accounting-review.html` requires in-memory API5193. Command Board/in-app progress aligned. No Sales Tax/MARCO/FlowSuite implementation changes in this accounting work; concurrent unrelated work retained.

## Mandatory accounting preservation boundary — September 20

Existing ProGraphics operational history is **preserved data, not migration input**. No re-import, overwrite, merge, deduplication, renumbering, reclassification, recreation or parallel historical customer/invoice/vendor universe as part of accounting-core work. Opening balances, historical financial statements and reconstruction are a separate accounting layer built around existing identities. Missing accounting facts become evidence-backed reconstruction gaps, never invented values or automatic additional QBO imports.

Before separately authorized accounting-core implementation, capture fresh counts/identities/checksums across all actual business-record families and historical overlays; afterward prove preservation, identifying legitimate concurrent changes separately. Access improvements require unchanged-record tests and unchanged business meaning. Prior five-table release checks are not a sufficient future baseline. Governing detail: `docs/prographics-workflow-2026-09-19/ACCOUNTING-PRESERVATION-BOUNDARY.md`. This turn records the constraint only; no accounting-core work or deployment begun.

## ProGraphics operational workflow — September 20, deployed / stopped

**Live / where:** https://tools.caresmn.com/prographics — READY `dpl_2mTgyc3mNijdt8v1pQYnUpbKmu5L`, hosted asset `index-DSXEK0Ds.js`. Isolated PG release only: LedgerWorkspace plus new prographicsWorkflow helper; unfinished CARES discovery, MARCO and FlowSuite excluded. Rollback: `dpl_9d8ji1cojQe5j8UvpXgU6mm5wByA`.

**Built / verified:** one-click source-safe Copy; collapsed context (32.67px live); retained PO guidance/carry-forward/payment/history/output improvements and manual-email fallback. 77 tests, synthetic actual-React staff journey, dedicated print regression, root/isolated/hosted builds passed; both fixture PDFs one page. Signed-in production checks passed for access, current/history, #7225, unsaved copy, PO choice, customer history, invoice/packing display and $20 payment preview/$66 remaining on #8732. Refund preparation exercised only in explicit no-save Test mode ($14 excess), then cancelled and reloaded. No actual email/payment/refund/document save. Native print preview unavailable in embedded browser; physical acceptance remains open.

**Preservation exception:** invoices (6,581), payments (10), credits (1), document events (36), and all 566 pre-existing ledger entries retain exact digests. Existing auto-sync-on-open added one bank entry during smoke ($576.96; id bbbf06c2-3a69-4c00-8fe6-59501bdab6d3). No Sync button clicked; new row left intact. Do not claim zero DB activity. Command Board progress metadata separately updated; in-app checklist aligned.

**Stop / pending:** requested operational release complete. Automated sender/delivery and durable/concurrent financial-write acceptance remain separate follow-ups. Existing non-atomic payment/refund limitations retained. No Sales Tax or Accounting Core work begun. Key evidence: `docs/prographics-workflow-2026-09-19/RELEASE-2026-09-20.md`, `release-preservation-20260920.json`. September 19 comparison is pre-refinement history, not the current release state.

## ProGraphics staff before/after review — September 19, not deployed

**Review delivered:** `docs/prographics-workflow-2026-09-19/staff-review/index.html` and `STAFF-BEFORE-AFTER.md` compare all ten workflow stages with focused paired screenshots. Actual saved production-release React code and proposed code use identical fictional data; public live asset `index-qt1ypMfG.js` confirmed read-only. Report render verified: 26 images loaded, no horizontal overflow. Review fixtures added; no application implementation changes, production business writes, sends or deployment during comparison.

**Review decisions:** useful customer-first entry, PO wording, context carry-forward and payment/refund controls; automated email blocking, extra Copy click, taller context and still-busy footers need explicit review. Customer history shortcut is not customer-filtered. Durable financial acceptance remains open. Await Kari + Finnegan review; prior print hotfix remains live.

## ProGraphics order-to-payment cleanup — September 19, local review only

**Built / where:** `LedgerWorkspace.jsx` plus `src/lib/prographicsWorkflow.js`: explicit vendor-PO decision (customer PO kept separate), job notes/contact, corrected plain-job document label, context carry-forward, explicit new conversion links, customer-first new job, reusable history, payment result checks/incremental excess, refund using existing credit, truthful manual-email fallback and updated staff help. Existing visual identity retained. No Sales Tax History / Verification or accounting-core work.

**Verified:** 77 tests pass; synthetic real-React browser workflow passed customer → PO → edit/art → packing/PDF → linked invoice → safe send → partial payments → overpayment/refund → historical copy/source unchanged. Both generated PDFs are one page. No external write requests, no real customer sends, no production business mutations. Live schema and sender configuration inspected read-only. The shared SendGrid hub is used; ProGraphics From is null and Reply-To is AOL. Provider sender authentication/delivery unverified; DNS/shared infrastructure untouched.

**Decisions / stop / next:** local review package for Kari + Finnegan, **NOT deployed**. Full handoff and screenshots: `docs/prographics-workflow-2026-09-19/HANDOFF.md`. Safe synthetic preview `http://127.0.0.1:5182/test/prographics-workflow.html`. Production business-write atomicity/concurrency/persistence, legacy refund/check reliability and verified email provider identity remain open; no accounting entry architecture introduced. Separate deployment approval required. Previous production print hotfix remains the last deployment made by this task. Command Board progress metadata updated alongside in-app tracker; no other production writes.

## ProGraphics duplicate print-page hotfix — September 18

**Live:** READY deployment `dpl_9d8ji1cojQe5j8UvpXgU6mm5wByA`; existing tools.caresmn.com alias successfully switched to the tested isolated PG release. This supersedes the preparation note below. Command Board and in-app progress updated; physical printer acceptance remains open. Release details: `docs/prographics-rehab-2026-09-18/PRINT-HOTFIX.md`.

**Cause / fix:** fixed-position invoice/packing modal repeats across paginated print layout. Reproduced two identical pages in Chromium PDF output. New `src/lib/prographicsPrint.js` prints one cloned document in normal flow directly under body, hides all other body children only in print media, removes action controls, and cleans up on `afterprint` (including asynchronous preview), leaving the original UI untouched.

**Verified:** synthetic invoice and packing-slip regression PDFs each changed from 2 pages / 2 document copies to 1 page / 1 copy. Browser checks cover one print invocation, snapshot retained until afterprint, cleanup, and original document retained. 72 automated tests and root build pass. Test harness: `test/prographics-print.browser.mjs`; evidence under `docs/prographics-rehab-2026-09-18/print-regression/`. Physical printer acceptance remains open. No business records changed. PG-only isolated release being prepared; prior live deployment remains rollback target `dpl_H8zvGz6M8j2uaNwXsKvWmuPQRfwB`.

## ProGraphics usability follow-up — deployed, remaining acceptance noted

**Release outcome:** READY `dpl_H8zvGz6M8j2uaNwXsKvWmuPQRfwB`, live at https://tools.caresmn.com/prographics. Hosted/isolated build passes (158 modules), 72 tests pass. Normal promote polling stalled; verified project/domain ownership and empty failing-check list, then explicitly assigned the existing tools.caresmn.com alias to the READY release. CLI live-domain inspection and separate signed-in production tab confirm the new version. No DNS/auth changes. Prior release `dpl_KZCkAWcMjNB8uRdMXo1yTUYMKLYT` remains rollback target.

**Production smoke:** full load 6,585 records; current71/history5,759/all5,830 views intact; National General8 matches (6 cleared/2 uncleared); Card payment transfer/not-linked option visible; new invoice customer PO, Item and Description fields visible. No browser errors captured. No real invoice/payment save, send, sync, deletion or reclassification. Original working tab not reloaded. Local Close/Recover test restores Shipping and3.75; temporary-fixture tests passed for both database delete guards. #8719 original-column digest unchanged. Remaining durable-save/conflict, physical-print and imported-pair-link limitations below still apply. Detailed handoff: USABILITY-FOLLOWUP.md. Earlier local-only statements in this section are superseded by this release outcome.

**Scope / location:** Kari authorized invoice/packing print, customer PO, item/description reuse, shipping/price/save safeguards, full Notebook payment search, and cleared-delete restriction. Local changes in LedgerWorkspace, InvoicePublic, prographicsEditing and ProGraphicsTransactionHistory. Previous production release remains live; unrelated CARES/MARCO/FlowSuite work excluded.

**Built / verified:** Local Notebook National General search returns 8 records (6 cleared, 2 uncleared). Typed 3.75 remains 3.75 and Shipping populates description in browser Test mode; simulated save retains the line. 72 tests pass; root build passes (166 modules, preexisting bundle warning). Customer PO is separate from vendor PO. Suggestions include catalog and saved history; newly saved names become reusable. Order/edit draft backup is session-tab-local, not live autosave. Conditional update compares original field values to prevent stale edits overwriting newer data.

**Production schema only:** additive customer_po_number column; ProGraphics-scoped BEFORE DELETE guards on ledger_entries and linked ledger_payments. No business-row update/delete/backfill. Cleared guard tested on temporary synthetic row; both triggers verified enabled. Existing public invoice functions expose customer PO and item-display flag for PG only; read-only preview response verified. SQL evidence: docs/prographics-rehab-2026-09-18/usability-safety-schema.sql and customer-po-public.sql. No UI deployment in this follow-up.

**Open / next:** persist/reload customer PO and stale-edit acceptance without real business mutations; draft recovery browser acceptance; invoice/packing physical print acceptance; isolate/build/release PG-only files. Print now isolates the existing open document and calls print once; browser/printer Copies setting cannot be forced. The attempted separate popup preview was not observable and was removed. Credit-card imported-entry linking is NOT built: current Pay a card creates two NEW entries, not a durable pair of existing feed transactions. No automatic matching, recategorization or double-entry implementation. Original 3.75→3.70 cause and Northstar missing-line cause not reproduced; user unsure whether Update was clicked. Existing partial-payment-reversal atomicity, security/accounting, historical completeness and tax authority gaps remain open.

_Current checkpoint: ProGraphics rehabilitation deployed 2026-09-18; authenticated production smoke tests passed, with transient source-fetch and concurrent-data caveats documented. CARES Phase 2 paused. Earlier product histories below are retained, not reverified or superseded as development instructions._

## What this folder is
`C:\dev\cares-works` is the Vite + React 18 application behind CARES Works (`tools.caresmn.com`): **a library and evolving marketplace of business solutions**. It currently contains substantial products and client-specific sites, but physical repository location is not permanent product ownership. ProGraphics and MARCO have undecided long-term homes and are protected from changes under the current CARES directive. FlowSuite Pro remains outside scope. Existing domain ownership models stay separate.

## ProGraphics final local checkpoint — 2026-09-18

**Final production acceptance:** signed-in history/current separation, #7225 search/detail, customer history, unsaved copy, tax source drill-down and verification save/full-reload passed. Saved separate unverified smoke evidence `4ef75fea-1c8c-470f-8ce7-9e20c1113fb6`; authoritative amounts remain blank. Initial source read failed transiently; refresh and subsequent save/reload succeeded. Sales Tax left open live. No business edits or sends/syncs performed by smoke tests. 31/33 preservation digests match; separate #8737 revised event during the window means invoices/events are not blanket unchanged (no rollback attempted). Details in `PRODUCTION-RELEASE.md` and `production-smoke-preservation.json`. Q3 remains uncertified; #8719 discrepancy unchanged by this work. Existing in-app authenticated-read/unsaved-draft and sales-tax saved-revision items remain correctly done; authority evidence and actual delivery remain open. Deployment authorization item is true; this acceptance evidence supersedes older pending-login notes below.

**Production update (supersedes local-only/pending-deploy statements below):** Vercel authorization succeeded. Isolated five-file ProGraphics release built on Vercel (156 modules) and was promoted to `tools.caresmn.com`, deployment `dpl_KZCkAWcMjNB8uRdMXo1yTUYMKLYT`, READY. Existing production baseline matched `823a061`; rollback `dpl_14mhwMBzsPrPNKjkM8AqkjQguTrH`. 68 regression tests previously passed. No business records changed during deployment. Live CARES sign-in is still required before authenticated production smoke checks/save-reload can be completed; those checks are not claimed passed. Quarter coverage remains uncertified and #8719 untouched. See `PRODUCTION-RELEASE.md` for build recovery, deployment details, and remaining acceptance boundary.

**Production release directive (latest):** Kari authorized deployment and bounded production smoke testing. Release staged separately at `.prographics-release/source`, baseline `823a061` plus only five ProGraphics files; unfinished CARES discovery excluded, MARCO content unchanged, FlowSuite untouched. 68 tests pass; isolated release build passes (156 modules). **Not deployed yet:** connected Vercel app lacks owning-team access; local CLI device authorization is pending. Live ProGraphics tab is at normal sign-in. `docs/prographics-rehab-2026-09-18/PRODUCTION-RELEASE.md` records the release boundary and next steps. No business records changed during preparation; coverage limits and #8719 remain flagged.

**Sales-tax verification sprint addendum (latest):** local Sales Tax History / Verification implemented in `src/components/ProGraphicsTaxVerification.jsx` and `src/lib/prographicsTaxVerification.js`. Separate calculated support, authoritative amounts, and verified match/difference; closed-period coverage/evidence gates; signed-in actor + server timestamp; append-only UI revisions with immutable saved snapshots and SHA-256 change detection. Fresh complete source reads on load/refresh and immediately before save. Existing RLS retained; no schema change. Changes flagged on reload, not a continuous monitor or tamper-proof audit ledger.

**Live acceptance / data:** two genuine Q3 recorded-unverified evidence revisions saved and read back in `ledger_statements` (first baseline, second adds confirmed #8719 discrepancy and version-2 checks). No authoritative amounts invented. Existing rows across 33 scoped tables match baseline excluding only these two new statement IDs. QBO quarter search read-only: all 11 invoices #8719–8729 represented with matching totals; seven additional local PG invoices remain. #8719 QBO lines $1,950 versus PG lines $2,161 includes $35 shipping + $176 Luther Decals; stored subtotal/tax/status/dates preserved. Quarter is still open; source completeness and filing/payment basis not certified. Prior 162 detail gaps remain; no new historical import justified by current-quarter header check.

**Next evidence needed:** Kari's authoritative filed/paid amounts, payment/filing dates, filing basis and source reference for her actual filing period. Workflow accepts evidence now but does not mark an open/undocumented period verified. See `docs/prographics-rehab-2026-09-18/SALES-TAX-VERIFICATION.md`. Local only, no deploy; business data preservation unchanged.

**Verification results / trackers:** 68 tests pass; build passes (164 modules, existing bundle warning); whitespace check passes. In-app manual tracker and Command Board `pgledg01` now include local sales-tax verification completion and a separate open authoritative-evidence item. No accounting roadmap item was marked complete by this work.

**What / where:** bounded rehabilitation at http://127.0.0.1:5173/prographics; final record `docs/prographics-rehab-2026-09-18/ENRICHMENT-HANDOFF.md`. No redesign or deployment. Earlier checkpoint below is historical and its no-import assertions are superseded only by the explicit enrichment approval.

**Built so far:** four verified QBO historical invoices added through one provenance-scoped `ledger_history` supplement; #7225 Pop Sockets detail enriched through a read-only overlay. Both #8245 identities preserved, three voids accurately represented. Counts: unified invoices 5,826→5,830; history 5,755→5,759; current 71→71. All 6,581 original invoice/order rows and original rows across 33 scoped tables match before/after digests. No original business rows changed.

**Decisions:** supplement rather than replacement import avoids invoice-number uniqueness collision without renumbering or merging. No payment/ledger posting, customer master creation, schema/RLS change or QBO write. Exact plan/manifest/baseline and guarded rollback saved before insert; rollback not executed. MARCO/FlowSuite untouched.

**Where it stopped:** ready for Kari's local use/testing. Safe in-memory save/send simulation verified (no database draft or real email). Sub-cent rates retained; latest recorded activity derives from stored timestamps; complete message loading/error state; tax support includes supplements, unclassified sales, source detail and verified explicit custom-period application. 59 tests pass; build passes with existing bundle warning.

**Pending / next steps:** durable live save/delivery and full print-output acceptance remain untested; deployment requires separate approval. 162 visible invoice representations still lack lines; 471 raw line mismatches, mixed Northstar #8245 detail and #8719 date discrepancy preserved. Contact/payment/GL coverage remains uncertified. Tax support is not certified tax liability. Legacy undo/audit/write-error/reconciliation-list issues and accounting/security work remain open; no broad remediation under this task.

**Key files / trackers:** `src/lib/prographicsRehab.js`, `src/pages/LedgerWorkspace.jsx`, `test/prographics-enrichment.test.mjs`; `ENRICHMENT-HANDOFF.md`, manifest, before/after/final verification and guarded SQL in the rehabilitation evidence directory. Manual in-app checklist and existing Command Board PG row updated for the same verified scope, with live delivery/deployment left open. Production writes: one authorized historical supplement and scoped Command Board metadata only.

## Earlier read-only rehabilitation checkpoint — superseded by final checkpoint above

**Authority / decisions:** Kari separately authorized focused ProGraphics rehabilitation, superseding the ProGraphics freeze only for this bounded task. No redesign, accounting-core completion, blind historical import or deployment. MARCO and FlowSuite remain untouched. CARES-wide work is paused; existing Phase 1/2 edits preserved.

**Where it lives:** local `/prographics`, `src/pages/LedgerWorkspace.jsx`, `src/lib/prographicsRehab.js`, `src/components/ProGraphicsReusePicker.jsx`; complete handoff: `docs/prographics-rehab-2026-09-18/REPORT.md`.

**Built so far (local, NOT shipped):** complete paginated primary data loads with explicit errors; 71 current / 5,755 QBO-history / 5,826 all-invoice views; full-scope search and 50-row pages; historical reference-only actions; one Customers/history destination (Admin forwards); historical-name projection without master inserts/merges; source-line search/reuse and unsaved copy; confirmed invoice/order save handling; recorded invoice-tax support with source links and limitations; truthful Data loaded / manual release-note / manual development-checklist labels. Notebook payment picker excludes historical imports, with existing links preserved.

**QBO verified read-only:** correct browser company PRO GRAPHICS ENTERPRISES, INC.; all 233 invoice-search pages, 5,823 headers. 1997–2025 header dates/numbers/totals match except missing second #8245 ($207, April 19, 2023). Three 2026 voids absent (8677/8701/8705); #8719 date differs; seven newer PG-only invoices preserved. Exact aggregate comparison: `qbo-header-comparison.json`. QBO API connector currently points to Minuteman Press, NOT ProGraphics; historical statements below about its company connection are stale.

**Important correction:** “163 QBO left blank” in earlier history was not established. ProGraphics has 163 invoices without lines; actual QBO #7225 contains Pop Sockets detail absent from ProGraphics. No backfill performed. Customer contacts, payments, archive excerpts and full accounting history are not complete QBO copies. QBO shows 1,479 customers in the default visible list, 6,979 payments, 1,119 POs, 1,760 journals, 3,309 bills. These source counts are not full-row reconciliations. Older history excerpts store only 1,697 of 14,393 declared details.

**Where it stopped:** local preview ready for Kari's review/testing, NOT certified QBO replacement or production release. Real signed-in checks verified full record count, #7225 search/open, ABC customer links, canonical Admin route, reuse into an unsaved draft, and Q3 tax supporting rows. 50 test-runner results pass and build passes; existing bundle warning. Live screenshot and aggregate evidence are in the handoff directory.

**Next steps / pending items:** persisted save/send and print-output acceptance; separate deployment approval; source-line/backfill decision using stable QBO IDs; customer/payment coverage decisions; tax filing-basis reconciliation. Q3 $237.54 is recorded invoice-tax support, NOT verified tax due. No production business record was created or changed. No migrations/import/sync/QBO write/commit/push/deploy. Local preview uses production data, not a disposable test database. Deeper accounting, security and prior frozen items remain open at their original severity.

**Trackers:** in-app manual rehab checklist reflects local completion and pending save/send/deployment. Existing Command Board PG row `pgledg01` updated only for assessment/rehab metadata and the incorrect blank-description assertion; accounting-roadmap statuses preserved. This narrowly scoped tracker update is the only production database write in this rehabilitation. Earlier “no database writes” statements below refer to their own CARES phases.

## CARES rebuild — Phase 2 checkpoint, 2026-09-17

**Visual refinement:** latest correction governs: white/deep navy, blue/cyan electricity and small green sparks only; no multicolor consulting palette. Existing wordmark preserved. Discovery-only CSS adds selective logo/hero/search/active-state glow using existing theme tokens, with no shared-theme or protected-product changes. 22 discovery tests and build pass; focused desktop browser capture shows the glow, no console warnings/errors. Evidence: `docs/phase-2-discovery/discover-controlled-glow.png`. Local only, not deployed. Earlier screenshots remain historical.

**Outcome:** local problem-led discovery built using canonical registry projections. Discover, Browse, Saved / Continue, Get Help, Account and truthful New; deterministic intent-weighted search; nine problem collections; explicit browser-local public favorites. Landing, ToolsIndex and Dashboard tools discovery now use the shared foundation. No product rebuild.

**Review package:** `docs/phase-2-discovery/PHASE-2-HANDOFF.md`, screenshots and `ACCEPTANCE-RESULTS.json`. Implementation: `src/pages/Discovery.jsx`, `Discovery.css`, `src/solutions/discovery.js`, `savedWork.js`; tests: `test/discovery.test.mjs`.

**Verified:** 22 discovery tests, 13 registry tests, all three existing pure regression scripts and production build pass. Desktop/mobile browser checks, representative problem queries, static/SPA navigation, favorites reload, logged-out Saved, dated New and human-help links verified. Existing large JS bundle warning remains.

**Limits:** authenticated Saved/Continue retrieval still needs authorized live acceptance testing. Private/contextual metadata remains excluded without trusted grant/context mapping; no guessed My Business access. Unpublished/unlisted/unavailable products remain excluded. Existing security findings remain open, unchanged in severity.

**Protected boundary:** no ProGraphics/MARCO internal changes, FlowSuite Pro inspection or changes, database writes, migrations, production configuration changes, commits, pushes or deployment. Existing Phase 1/user changes retained. No Command Board production write or protected tracker update.

**STOP:** returned to Kari + Finnegan for review. No automatic Phase 3, protected-product completion/security work, migration or deployment. Earlier Phase 1 checkpoint below is historical; its pending discovery work is superseded only by this approved Phase 2 implementation.

## CARES rebuild — Phase 1 checkpoint, 2026-09-17

**What this is:** canonical solution registry/product contract and limited CARES routing foundation only. No new landing/discovery UI.

**Where it lives:** `registry/`, `src/solutions/`, `docs/phase-1-registry/`, `test/solution-registry.test.mjs`.

**Built so far:** 84 canonical identities plus three documented exclusions cover all 87 assessment records; explicit scope/readiness/publication/access/context; deterministic problem search; typed safe entry resolution; public/restricted metadata partitions; static-versus-SPA library navigation; honest unmatched-route fallback. No new pricing, authorization implementation or persistence.

**Decisions:** substantial products remain destination-owned and relocatable by stable identity. Do not merge organization, ledger, MARCO, Steward or Invoice Maker ownership. Registry metadata is not access enforcement. Legacy landing/dashboard/catalog display sources remain pending the separate discovery phase; the current tool library uses the canonical route bridge only.

**Where it stopped:** local Phase 1 implementation and review package, not committed/pushed/deployed. Registry tests, existing pure tests and production build pass. No database operations or production writes. Protected product files, APIs, SQL and deployment configuration unchanged.

**Next steps:** Kari + Finnegan Phase 1 review; further discovery implementation, protected-product changes and deployment require a separate directive.

**Pending items:** product/publication owners and Premium/capability policies; missing Brand Kit entry; broken board-share entry; dormant Founders intake ownership; private discovery grant mapping; future ProGraphics/MARCO architecture. Security findings remain open at their original severity; seven-part boundary notes are in `docs/phase-1-registry/PROTECTED-SECURITY-BOUNDARY.md`. All historical pending/frozen items below remain outside this phase. No Command Board row was added or altered: Phase 1 intentionally made no production database writes. No ProGraphics trackers were changed because no ledger work was performed.

**Key files:** `registry/README.md`, `registry/index.mjs`, `src/solutions/public-registry.json`, `registry/restricted-solutions.json`, `registry/inventory-exclusions.json`, `src/solutions/contract.js`, `src/solutions/catalog.js`, `docs/phase-1-registry/PHASE-1-HANDOFF.md`.

## Where it lives
- Live site: `https://tools.caresmn.com` (CARES Works). Tenant routes seen in chat: `/prographics`, `/emerson`, `/org/river-of-life`, `/rent/river-of-life`, `/proposals`, `/proposals/prographics`, `/tools/coa-library`, `/steward`, `/board` (Kari's Command Board), `/chickens` (The Coop — her memoir workroom).
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
- History now imported: 753 vendor POs + 5,755 customer invoices (1,309 customers), see Phase 4 item 10. Invoice **line-item detail loaded 9/15** (5,663 invoices, from the Sales-by-Customer export). Deferred: customer payments as discrete records (invoices imported paid+done), and a customers/vendors master list for autocomplete. The vendor-PO↔customer link is confirmed unrecoverable from the QBO exports.
- Vendor lifetime totals in history are unreliable (Check Detail +/- offset pairs net to $0) — the transaction list is fine, the total isn't.
- Punctuation strip caught domains: "Amazon.com"→"Amazoncom", "Stamps.com"→"Stampscom" — special-case if wanted.
- Plaid: fully built; blocked ONLY on Kari setting `PLAID_CLIENT_ID` / `PLAID_SECRET` / `PLAID_ENV` secrets in Supabase (gotcha: the secret must match the env — production secret if `PLAID_ENV=production`). No redeploy needed after setting.
- ProGraphics domain: DNS records + GoDaddy access in hand (Kari), not yet pointed. Parked 9/1.
- Two both-reconciled duplicates left ALONE on purpose (don't delete reconciled without care): Stouse $355.54 and 4 Over $39.89. Riteline (4→1) and the other unreconciled dups were already cleaned.
- "Mark paid (no check)" on a bill posts NOTHING to the register — a known hole feeding the trust problem; fold into the posting-engine work, don't spot-patch.
- **Invoice #8730 collision RESOLVED (9/1):** the number had been reused across Northstar Canoe ($582), the Cedar Valley conversion, and Floe ($1,733.25), and Northstar's row was lost in the churn. Recovered the real Northstar invoice from the kcocares hub `notifications` log (it had been emailed 8/20 + 8/23, BCC races61@aol.com) — rebuilt #8730 Northstar $582 exempt/paid dated 8/20 with its ORIGINAL public_token `bb693a1b-...` so the copy the customer holds still resolves. Floe (never emailed) moved to #8731. NOTE: `invoices.invoice_number` has NO unique index — nothing prevents another collision; add one as part of the posting-engine/audit work.
- **DONE 9/15: invoice line-item detail loaded in bulk** — 5,663 invoices now carry real item/qty/price from the QBO Sales-by-Customer export (14,332 lines); the 163 QBO itself left blank stay blank. Fill was guarded to empty invoices only, so nothing with real detail got clobbered. **CAVEAT:** the Sales-by-Customer export was pulled 8/24, so any invoice created *after* that isn't covered — e.g. **Northstar #8730** (made 9/4) still shows only the placeholder "Vinyl Decals $582," because it already had a line (guard skipped it) AND it postdates the export. Restoring #8730-and-later detail that was lost to the old dup-number bug needs a **fresh** Sales-by-Customer export.
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

### Client workpaper links (built 9/13/2026)
- `tools.caresmn.com/emerson/<32-hex token>` — no-login page (`src/pages/WorkpaperPublic.jsx`, route in `App.jsx` above the auth gates). First link: **Emerson Services – 2025 Workpapers**, all 706 bank transactions for Premier 4161/0449/1398/2259 classified from the statements and compared with QuickBooks (which stops July 2025); 12 open items.
- Data: `public.workpaper_links` (payload jsonb, token, `notify_email` = kari@caresmn.com, owner = Kari) and `public.workpaper_answers`. Anon cannot read either table; access is only through `get_workpaper_by_token(slug, token)` and `submit_workpaper_answer(slug, token, item_key, answer, name)` (SQL in `sql/workpapers.sql`).
- Each saved answer triggers edge function `workpaper-answer-notify`, which emails `notify_email` through the hub. Verified 9/13: save, bad-token rejection, email sent (`emailed: true`), direct table read blocked; the test answer was deleted.
- The payload is built outside the app (bank statements parsed and checked against printed daily balances). There is no in-app screen yet for Kari to list answers; they arrive by email and show on the page itself.
- 9/13 later (Kari): **no emails** — answers save to `workpaper_answers` only (`notify_email` null, page no longer calls `workpaper-answer-notify`). P&L grouped by Emerson's chart of accounts, rent-only income, asterisks on lines with questions (`payload.pl.question_accts`), 9 questions incl. 1398 checks, bank tie-out with month-by-month toggle.
- 9/13 revision (Kari): page is only the full-year P&L, 8 one-line questions with one-line answers, and the transaction list — no QuickBooks comparison, no names, no answer boxes per check. For Matt and Cassandra. 0449 deposits classified as rent income; ATM/counter cash as program services (food & client/renter support); transfers paired across all six Premier accounts (Emerson accounts net to $0; $5,475 net from Social MN 6431/8365).

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
- **One list: the Command Board (`board_work`). The Everything Board is retired as a to-do list** (Kari, 9/13). Sessions had kept writing to the Everything Board after 9/8 because a CLAUDE.md rule pointed them at card `70fd14b5`; a session added an entry there that Kari said was wrong. The rule now points at `board_work` and forbids writes to the Everything Board. The Everything Board site itself still exists and technically still accepts writes — nothing blocks them except the rule.
- **Monet's audit-week steps live as checklists on per-product cards**, not as ~150 separate rows, so each product reads as one card with progress (e.g. 0/30 for ProGraphics) and the steps tick in place. `source='monet'` gives them their own tab.
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
9/13: **the Command Board is the one to-do list — decided by Kari.** "We want the command board." The CLAUDE.md rule that told sessions to tick an Everything Board card (`70fd14b5`) as the ProGraphics tracker was a mistake and is corrected: tracker 3 is now the `board_work` row `pgledg01`, and CLAUDE.md says never to write to the Everything Board. Memory updated to match. The two cards that had drifted there since 9/8 were pulled in — `pgledg01` (retitled, 22-step double-entry finish plan, 3 done) and `kcopos01` "Finish K Co Register setup at /pos" (new 9/9). Monet's two lists are on the board as **9 cards carrying 134 checklist steps**: a Codex audit card for each of ProGraphics, FlowSuite, FlowSuite Pro, Keepstead, Keepstead Pro and Credit Comeback Kit (16 shared steps each, plus product extras and the financial trace for ProGraphics and Credit Comeback Kit), Emerson, the ACCOUNTING SPINE AUDIT umbrella, and the portfolio shared-infrastructure pass. Dated 9/18 except the portfolio pass, which follows the audits. `board_work`: 205 rows.

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
- **The work is under kari@karikounkel.com.** Every `board_work` row belongs to that login. Signed in as kari@caresmn.com, The Work panel shows "Nothing here yet" — the board looks empty rather than wrong.
- **ProGraphics feature work is frozen** (Kari + Monet, 9/13) pending a read-only Codex audit — written into CLAUDE.md. FlowSuite, FlowSuite Pro, Keepstead, Keepstead Pro and Credit Comeback Kit are frozen for the audit too; those repos are outside cares-works and their own instructions were not edited.
- The Everything Board still holds its 109 cards and still accepts writes. Only the CLAUDE.md rule keeps sessions off it.
- The Rollout Tracker cockpit still holds its own copy of its 36 items; nothing writes to it any more.
- Google and Intuit keys are still not set (checked 9/13) — Week Ahead, Still Unread and Who Owes You still show their connect state.
- `www.karikounkel.shop` still has no DNS record (checked 9/13).
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


---

### The Coop (Chasing Chickens)
Kari's private working draft of the memoir *Chasing Chickens*. Route `/chickens` on `tools.caresmn.com`. Built by Nate (Cowork) 9/9 to replace the claude.ai artifact "The Coop" so the book lives on her own stack; finished and shipped from Claude Code the same day. Nothing on it is public.

**Built so far**
- ✅ `src/pages/Coop.jsx` — the whole page. 66 chapters in six movements (Mustard 9, The Pile-On 8, The Chickens 10, The Breaking 13, The Rebuild 13, The Porch 13) — 283 questions and 190 verbatim passages: her passages with dates and source chats, alternate tellings behind a disclosure, editable questions with an answer box under each, a draft box, notes, and a per-chapter status (open / answering / drafted / done). Plus a Timeline tab (editable table) and a plan tab. Sidebar pips show what's answered; the header shows the running answered/total count.
- ✅ Autosave, 800 ms debounce, with "saving… / saved 4:12 AM / not saved — <reason>" in the header. A failed save re-queues the chapter instead of losing it.
- ✅ `public/chickens/coop-data.json` (552 KB) — all static content. **Generated from `C:\CLAUDE\archive\projects\Chasing-Chickens\`; regenerate there, never hand-edit.**
- ✅ `sql/coop.sql` — applied to `qcikhcnclduakriextsz` as migration `coop_chasing_chickens_workroom`. Tables `coop_chapters(user_id, id, data jsonb)` and `coop_docs(user_id, id ∈ {timeline, plan}, data jsonb)`, composite PK `(user_id, id)`, RLS `user_id = auth.uid()`, `to authenticated` only — verified on the live database: RLS on, one policy each.
- ✅ `/chickens` route in `src/App.jsx`, session-gated like `/board`; signed out it redirects to `/login`.
- ✅ Shipped as commit `f368218` on 9/9.

**Decisions**
- **Content is a file, edits are rows.** The passages ship as static JSON on the deploy; only what Kari types goes to Supabase. Regenerating the archive never touches her answers.
- **No anon access to either table, by design.** The publishable key in the browser can't read or write them without a session, so an unfinished memoir isn't one guessed URL away.
- **A chapter row is one jsonb blob** (`{title, questions:[{q,a}], draft, notes, status}`), not normalized columns — the questions are hers to reword, add, and delete, so the shape has to bend without a migration.
- Questions are editable and removable; removing one that has an answer asks first.

**Where it stopped**
9/9. Committed, pushed, deployed. The route, the JSON asset and the tables were each checked; the page **has not been watched saving** — that needs Kari's own login, the same wall the `/invoices` maker screen sits behind.

**Pending / frozen items**
- Nothing from the claude.ai artifact was carried over: Kari had made no edits there as of 9/9. If she writes on the artifact before switching, those answers exist only there — Nate can read the artifact db and the rows can be inserted.
- Autosave is the only save. There is no explicit save button, no version history, and no export — what's in the boxes is what exists.
- The draft boxes are plain textarea. No formatting, no word count, no print/PDF view of a finished chapter.
- The timeline seeds from the JSON the first time and is a saved copy after that — regenerating `coop-data.json` won't update a timeline she has already edited.
- `/chickens` is reachable by any signed-in user, who would see the passages (they ship in the static JSON) with empty answer boxes of their own. Same shape as `/invoices` and `/board`.

**Key files**
- `C:\dev\cares-works\src\pages\Coop.jsx` (the page)
- `C:\dev\cares-works\public\chickens\coop-data.json` (generated content — never hand-edit)
- `C:\dev\cares-works\sql\coop.sql` (applied)
- `C:\dev\cares-works\docs\HANDOFF-COOP-2026-09-09.md` (Nate's handoff)
- Source archive: `C:\CLAUDE\archive\projects\Chasing-Chickens\`

### 2026-10-01 — DAC presentation copy revision (live)
- Reframed only `public/flowsuite/dac/index.html` around working people/staff, scheduling/coverage, daily briefings, sanitized product screenshots, reduced coordination work, done-for-you implementation, and Request a Demo.
- Founding pricing remains $299 implementation + $59/month through December 31, 2026. Removed the prominent partial/planned/status presentation; one restrained Growing with you section at the bottom covers expanding billing/accounting, MN-ITS evaluation (not available), and separate Patriot Payroll.
- Published to existing CARES project: dpl_BMNgMCG3j9VGUsCXZK26cqPsbfcu at https://tools.caresmn.com/flowsuite/dac/. Isolated source comparison confirmed only the DAC HTML changed; all 652 other deployed source files preserved. Production build passed; live browser confirmed revised headings, no roadmap section, and no horizontal overflow. Proof: flowsuite-round-two/dac-copy-live.png.

### 2026-10-01 — Canonical FlowSuite demo CTA (live)
- Updated all 3 DAC demo CTAs and all 5 Lite demo/walkthrough booking links to https://cal.com/kkounkel/flowsuite-demo. Corrected only the associated Lite email caption; product exploration links remain intact.
- Existing CARES production deployment: dpl_Eq4eMsR82V5uMMutLzWHREosErVa. Only public/flowsuite/dac/index.html and public/flowsuite/lite/index.html changed; all 651 other production source files preserved.
- Build passed. Both live sales pages returned HTTP 200 and all 8 booking links matched the canonical URL. Cal.com returned HTTP 200 with title FlowSuite Demo | Kari Hoglund Kounkel | Cal.com. No booking submitted. No other product changes.

FLEET showcase Command Board checkpoint (2026-10-06): row 18f634a7-c766-430a-b14a-b4759e1763ee records local implementation/verification complete and release access/publication pending. No production business data changed; only this planning row was added.


October 7 preview correction: review HTML now contains static agreement text and requires no JavaScript. Direct file:// browser rendering verified; production publication remains blocked by Vercel authorization. No invitation links created.

October 7 requested credential correction: Kari explicitly supplied exact passwords for existing kari@karikounkel.com and accounting@mpuptown.com. Both set using Auth Admin API without credential files. Kari password sign-in verified. Accounting's email_not_confirmed blocker was resolved by confirming the existing account; role and individual legal acceptance unchanged. Passwords are not recorded in repository documentation. Test sign-in sessions revoked locally.

### 2026-10-11 — ProGraphics stability and Notebook correction (production accepted)
- Live: https://tools.caresmn.com/prographics. Deployment dpl_7FQpsGepTdMXADw1J52pdiYrAhg2; canonical source build, protected preview smoke, same-candidate promotion and live seven-route/native-export/three-cycle Sales Tax smoke passed. Prepared source: .prographics-release/sales-tax-20261011; accepted receipt: .prographics-release/guarded-d2a50138-0cd5-43e8-8179-232d355c1fcc/release-report.json.
- CPU profile identified per-invoice Intl date formatter construction while mapping 6,594 invoice/order rows. This hot path was also present in predecessor dpl_6srhVUWWXyDFNVhcZXWNAy9i7hC2. Reused formatters; retained complete tax-source reads across period changes and navigation; save verification still re-reads source. Local real-data Edge tests at CPU 4x: longest task 850 ms versus baseline up to 8.5 s; three cycles passed; cleaned heap about 24 MB. Independent live performance audit is recorded in the task report; do not infer all browser hangs are eliminated.
- Restored one traditional Notebook displaying all 812 source entries, including 349 distinct imported source IDs. Removed separate bank-review panel from Betty's UI; matching/dismissal code and server functionality preserved. Source visibility does not repost imports or change reconciliations. Automatic sync ran once in measured sessions.
- Sales Tax worksheet fully opens before explicit Print / Save PDF. Original PDF uploads and immutable paid confirmations are enabled via scoped migration prographics_tax_payment_confirmation_and_original_returns. Duplicate confirmation references/requests and duplicate PDF content are protected. Confirmations explicitly await bank/accounting review and do not reduce liability. No $332 payment or real return was entered by the agent.
- Void list/detail/print display only reserved number and VOID. Underlying private audit remains. Unissued/unpaid draft void guard remains; issued/paid documents are not destructively erased. Editor explains existing saved status, edited records no longer pin as new, and Cancel/Void are visible. Navigation clears stale document/send panels. Orders records preserved.
- Remaining acceptance limitation: editing/reversing an existing native payment is not implemented. Existing controller journal reversals do not correct operational invoice/payment status. Do not imply Betty can safely unmark a native payment via invoice Edit/Delete. Aspen Ridge Honey Farm was not changed by the agent.
- Preservation check: 0 records missing; journal count 268, reconciliations 29, recovered imports 349 unchanged. One invoice #8739 due_date changed during the onsite session (revised events 21:44/21:45 UTC, before this release); source comparison retained this difference and did not undo it. No bank records, amounts, payment rows or reconciliations were removed.


### 2026-10-11 — Final ProGraphics stability, invoice editor and card-date handoff

**What / where**
Live https://tools.caresmn.com/prographics; accepted deployment dpl_2di9Cq4WLP8cTnZfddBSweXpzxru; receipt C:\dev\cares-works\.prographics-release\guarded-87e1b001-49af-4dd9-bc40-96192d48d714\release-report.json; exact source C:\dev\cares-works\.prographics-release\guarded-87e1b001-49af-4dd9-bc40-96192d48d714. Bambooty outputs untouched.

**Built / decisions**
Second measured freeze correction reuses currency formatters and lazily pages tax support. Notebook uses bounded 50-row pages. Invoice editing remains in Invoices, hides unrelated Orders, preserves saved status and list order. Card next payment due date is additive nullable account metadata; APR > 0 hides promo end date without erasing saved values. All releases use canonical isolated source/build/protected preview/live/native export/stability/Minuteman preservation gates.

**Where it stopped / verification**
Production accepted. Independent 3-cycle real-data Edge CPU4x: max long task 548ms, timer lag 556ms, 0 page errors, sync once, retained heap about 24–25MB. Card due date save/reload and APR conditions passed with intercepted writes. Physical printer not tested. Baseline comparison 0 missing/0 unexplained changes; known onsite #8739 due_date revision preserved. 349 distinct imported source rows; 268 journals unchanged.

**Next / pending**
Native existing payment edit/reverse remains unimplemented; Aspen Ridge Honey Farm unchanged by agent. No actual $332 confirmation or real tax-return PDFs entered. Tax confirmation awaits bank/accounting linkage and does not post/reduce liability. Plaid Statements not activated; provider eligibility/pricing confirmation pending. No data rollback.

**Key files**
Accepted source above; accounting/card-payment-due-date.sql; work evidence in C:/Users/kari/Documents/Codex/2026-10-11/focu/work; complete user-forwardable handoff in that chat's outputs/Finnegan-ProGraphics-handoff.txt.


### 2026-10-11 — Final ProGraphics stability, invoice editor and card-date handoff

**What / where**
Live https://tools.caresmn.com/prographics; accepted deployment dpl_3S6Ufy6c4sPw44G3o1E2nXCsBFWT; receipt C:\dev\cares-works\.prographics-release\guarded-84cef50d-32c4-42fe-b528-602ce0c6d6f9\release-report.json; exact source C:\dev\cares-works\.prographics-release\guarded-84cef50d-32c4-42fe-b528-602ce0c6d6f9. Bambooty outputs untouched.

**Built / decisions**
Second measured freeze correction reuses currency formatters and lazily pages tax support. Notebook shows 271 unreconciled items with classification controls restored via existing scoped category/match commands. Its bottom full-register shortcut exposes all 812 source records across 6 accounts, including 541 locked reconciled entries, with bounded 50-row pages and posted-only running balances. Invoice editing remains in Invoices, hides unrelated Orders, preserves saved status and list order. Card next payment due date is additive nullable account metadata; APR > 0 hides promo end date without erasing saved values. All releases use canonical isolated source/build/protected preview/live/native export/stability/Minuteman preservation gates.

**Where it stopped / verification**
Production accepted. Independent 3-cycle real-data Edge CPU4x: max long task 323ms, timer lag 693ms, 0 page errors, sync once, retained heap about 24–25MB. Card due date save/reload and APR conditions passed with intercepted writes. Physical printer not tested. Baseline comparison 0 missing/0 unexplained changes; staff voids #8739/#8744 verified against private original snapshots and staff actor; originals retained. 349 distinct imported source rows; 268 journals unchanged.

**Next / pending**
Native existing payment edit/reverse remains unimplemented; Aspen Ridge Honey Farm unchanged by agent. No actual $332 confirmation or real tax-return PDFs entered. Tax confirmation awaits bank/accounting linkage and does not post/reduce liability. Plaid Statements not activated; provider eligibility/pricing confirmation pending. No data rollback.

**Key files**
Accepted source above; accounting/card-payment-due-date.sql; work evidence in C:/Users/kari/Documents/Codex/2026-10-11/focu/work; complete user-forwardable handoff in that chat's outputs/Finnegan-ProGraphics-handoff.txt.


## October 11 onsite corrections accepted

PROGRAPHICS ONSITE CORRECTIONS — OCTOBER 11, 2026
Live: https://tools.caresmn.com/prographics
Accepted deployment: dpl_CLQuu5iPe7FPLxuW2t3qoX7PoGbm
Receipt: C:\dev\cares-works\.prographics-release\guarded-8c5b9e1c-bd82-4e39-a147-0269e85f7fb2\release-report.json
Exact accepted source: C:\dev\cares-works\.prographics-release\guarded-8c5b9e1c-bd82-4e39-a147-0269e85f7fb2
Prepared source: C:/dev/cares-works/.prographics-release/sales-tax-20261011

CORRECTIONS AND CAUSES
1. Voids: secondary views and public invoice links could expose original details. Ordinary invoice/order/search/recent/customer views now show number + VOID only and exclude voids from active totals. Public void RPC returns no customer or money. Private original audit evidence remains. Posted/paid records retain controller correction guards; no automatic tax/payment reversal was introduced.
2. Reconciliation re-entry: the modal only showed posted entries, hiding pending imports already visible in Notebook. It now exposes original imported transactions with Classify existing import and Dismiss Duplicate. Existing classification/match commands retain original IDs/dates. Dismiss requires reason, fingerprint, confirmation; restore remains available. Server protections reject posted/linked/reconciled dismissal.
3. Manual reconciliation date: the old add handler silently used the statement cutoff. Visible transaction date now persists the selected date, validates dates and positive cent amounts, rejects exact duplicate entries and retains a stable retry ID with read-after-write confirmation.
4. Confirmed incident: Kari confirmed Spyhouse coffee $84.30 (import Sept 25) and Google $1.99 (import Sept 28), CorTrust Checking, were re-entered Sept 30. Both originals are matched to the existing reconciled manual entries. Original dates, amounts, reconciliations and source evidence remain. No journal was added and no transaction deleted.
5. New invoice Cancel: explicit Cancel, dirty confirmation and recovery cleanup; cancelling creates no invoice or allocated number.
6. False unsaved copies: Edit automatically persisted pristine copies, while Save/convert/void left recovery copies behind. Recovery now compares saved state, archives stale/void/missing/converted copies and preserves genuinely changed work. #8724 and PO2135 are legitimate saved records; #8748 is saved In Progress; #8744 is VOID. No saved document was deleted to clean recovery UI.
7. Work status: the native draft-state command blocked viewed/sent unposted invoices; sending/viewing could replace work status. Scoped server validation now allows verified unposted/unpaid work-state corrections and preserves In Progress on send/view. Invoice amounts were untouched.
8. New Order no longer forces Resume of an existing draft. New and recovery actions are independent and preserve other work; Return to list remains available.
9. Avallo: Jim McMullen matched a legitimate hidden line, 'Outside Logo Design, Avallo'. Customer-name matches now take priority when available; Jim and historical details remain unchanged.

FINAL VERIFIED RECORD STATES
#8740, #8741, #8745, #8746, #8748: In Progress.
#8724: Viewed, preserved. #8744: VOID, preserved.
PO2135: saved Order, preserved. Historical invoice2135 is a separate Paid record, preserved.
Aspen Ridge Honey Farm #8749/payment unchanged by agent.

VERIFICATION
26 targeted existing regression tests passed, 0 skipped. Draft lifecycle helper tests, native work-state guards, public void minimization and tenant-isolation tests passed.
Real Edge candidate browser flow passed new invoice Cancel/no orphan; new order with existing draft/save request; stale draft cleanup; edit/save/reload preserving In Progress; Avallo search; imported originals inside reconciliation; dismiss/restore request guards; date save/display; invalid zero/future-date rejection; actual public VOID link.
Financial write tests were intercepted in memory; actual authorized mutations were the five status corrections and two native bank matches above.
Full register: 814 entries across 6 populated accounts, including 575 reconciled locked entries; classification controls, 50-row paging and running balances passed against production reads.
Repeated tax/report/PDF/navigation checks passed at CPU4x; no page errors or repeating sync. Credit-card due date save/reload and APR/promo conditions passed with intercepted writes. Real PDF rendered; physical printer remains untested.
Canonical isolated build, protected candidate browser checks, live shared-route/native-export/stability checks and Minuteman preservation are required for acceptance; see release receipt.
Record comparison: 0 missing, 0 unexplained differences. All 814 entries, 30 reconciliations, 6594 invoice/order rows and 13 payments preserved. Only requested five invoice statuses changed. Native journals remain 268.
Failed preliminary test attempts were harness issues: obsolete Draft filter after status correction, hidden customer selector, fixture pagination/CORS count metadata, status casing, reload waits and script quoting. Corrected tests passed before release; no failed candidate was promoted.

OPEN ITEMS / LIMITS
Existing native payment edit/date/reversal UI is still pending. Tax confirmation does not itself post or reduce liability; safe bank/payment linkage remains pending. No actual $332 tax confirmation or emailed tax PDFs entered. Automatic bank Statements eligibility/activation remains pending; existing private PDF upload retained. No physical-printer acceptance. Actual email delivery not tested. No data rollback. Bambooty/Persephone, POS and unrelated projects unchanged.

FINAL LIVE ACCEPTANCE
Independent deployed Edge CPU4x, three repeated Sales Tax/PDF/navigation cycles: PASS; max main-thread task 481 ms, max timer lag 574 ms, retained JS heap about 24–25 MB, 0 page errors, sync once. Actual live five In Progress statuses, Avallo customer results, new-invoice Cancel and reconciliation original-import/dismiss/date controls: PASS. Deployed URL https://tools.caresmn.com/prographics, deployment dpl_CLQuu5iPe7FPLxuW2t3qoX7PoGbm. Source and financial preservation comparison passed after release.


FlowSuite Lite accounting foundation — October 12, 2026, LOCAL IMPLEMENTATION
What / where: flowsuite-lite/foundation in this repository. Local browser preview http://127.0.0.1:5198. Independent PostgreSQL/PGlite runtime; no production connection.
Built so far: seven accounting components, tenant setup and RLS, viewer/poster/controller roles, immutable balanced journal, AR/AP applications and credits, bank evidence/matching/reconciliation, reports, controlled imports, fiscal period locks and audit.
Decisions: reuse native journal/report engine in a distinct Lite schema; configurable cutover/fiscal year; posted journal is authoritative. No Notebook balances, no client data import, no shared production deployment.
Verification: 13 automated tests and 14 browser checks pass; synthetic-only isolated tests. Persistent database restart verified. Protected existing source hashes unchanged.
Where stopped: tested local implementation committed as 16ca4440ec0a2f3e3481eea0f7b251e9159d7f7e in an isolated detached checkout, not pushed. Original branch and prior working changes preserved. Source also added here under flowsuite-lite/foundation.
Next / pending: approved isolated hosted runtime/database with HTTPS, backups and hosted acceptance; legacy reconciliation-history imports and completed-statement recovery remain unsupported/blocked. Local password reset delivery is not implemented. No existing pending/frozen production items were changed.
Key files: foundation/README.txt, IMPORT-SPECIFICATIONS.txt, migrations/, service.mjs, server.mjs, public/, test/.

ProGraphics — TEST controlled import — October 12, 2026, LOCAL TEST ENVIRONMENT
What / where: existing FlowSuite Lite foundation/prographics-test test harness; http://127.0.0.1:5200. Clean original foundation at 5198 preserved. Separate local database; no production connection or write capability in running app.
Built so far: 9,624 copied source records across 31 tables, exact 268 posted native journals/538 lines, immutable source evidence and searchable source screens in all seven components, cash-basis source-linked test draft/payment workflow, tenant-scoped offline baseline reset.
Decisions: preserve native cash basis and all original financial evidence. No extra journal from ambiguous bank rows, no invented openings, no correction of discrepant invoices, no native certification of legacy reconciliations. Source invoice tokens, ACH credentials, Plaid identifiers excluded.
Verification: all source counts/checksums unchanged across extraction; exact records/counts/totals compared. 13 regression tests, 5 actual-source import tests and 16 browser checks passed. Tenant isolation and reset preserving another tenant verified.
Known discrepancies retained: 10 paid invoice mismatches including 8719, 173 potential overlapping bank groups, CorTrust Notebook 12,314.19/native -21,971.78, 575 cleared rows without reconciliation IDs, unsupported/incomplete openings. All remain unresolved.
Where stopped: delivery test tenant restored to imported baseline. Test-only login is supplied in the chat output access file. Code local revision 0153313a04a95390ecf96e3ce607b52a1c87056c in isolated checkout, not pushed/deployed. Real client data/credentials excluded from Git.
Next / pending: Kari hands-on testing; source discrepancies remain investigation items. No customer email, charges, real check issuance, tax submission or production writes available. Source statement/document references retained; file bytes not fetched. Hosted production and legacy reconciliation recovery still open.
Key files: foundation/prographics-test/README.txt, prographics-import.mjs, prographics-test-server.mjs, public/source.js, test/prographics-import.test.mjs, test/prographics.browser.mjs. Private recovery baseline, counts and access file are in this chat outputs.

FlowSuite Lite identity integration — October 12, 2026, LOCAL PREVIEWS UPDATED
What / where: existing Lite foundation at http://127.0.0.1:5198 and ProGraphics — TEST at http://127.0.0.1:5200.
Built so far: approved emblem, family design tokens, existing application shell/sidebar styles and icon paths, local Figtree/DM Serif Display/DM Mono, FlowSuite Lite/by CARES Works branding, sidebar, tenant controls, breadcrumbs, compact tables and responsive Menu.
Decisions: presentation-only adaptation of the existing app. No new app, brand or accounting engine. No displayed trademark/Pro subtitle. Settings separated below the seven primary accounting components.
Verification: 20 actual-data shell/workflow browser checks and 14 synthetic workflow checks passed. Fonts/logo loaded, tenant switch clears/restores data, mobile branding/menu/viewport verified, all seven screens and entry/save/cancel/reversal/reconciliation/report/import/reset flows preserved. No JavaScript errors.
Preserved: accounting/service/import/report/migration hashes unchanged; server API code unchanged after static asset routing. Existing databases, credentials, source records and user test changes preserved; no reset or production writes/deployment.
Where stopped: previews updated and live ProGraphics test shell verified while signed in. Local source revision b3e11a2be481348928964781c7594c80ad055fa2 committed in isolated checkout, not pushed. Desktop/mobile screenshots, test results and asset provenance saved in chat outputs.
Next / pending: Kari acceptance; hosted production and prior source-accounting discrepancies/legacy reconciliation recovery remain open. No new presentation blocker found.
Key files: public/lite-shell.css, public/lite-shell.js, public/assets/, FlowSuite-Identity-Provenance.json, prographics-test/test/prographics.browser.mjs.

FlowSuite Lite local ProGraphics commercial conversion: 5,838 original invoices, six paid bills and 810 unposted bank movements connected to existing accounting screens. Paid 8749 protected against duplicate collection; original source evidence retained in Settings. Existing 268 journals/538 lines unchanged; zero new conversion postings. Four zero movements held; known accounting discrepancies and unsupported opening/reconciliation evidence remain unresolved. Recovery copy preserves pre-conversion test database. 18 automated + seven actual-data screen checks + 14 browser workflows passed. Production untouched; local-only preview port 5200.

## FlowSuite Lite — seven accounting screens corrected (local TEST, October 13)
What this is / where: existing isolated ProGraphics TEST harness, flowsuite-lite/foundation/prographics-test; preview http://127.0.0.1:5200/. No production release.
Built so far: conventional invoice/bill/COA/journal registers; readable dates/references; filters and paging; journal drafts and posting; controlled edits/deactivation/voids; posted GL running balances; bank/card statement workbench and atomic reconciliation; grouped financial reports, CSV/Print/PDF; separate Reconciliation Exceptions. Original FlowSuite emblem/shell/fonts preserved; internal LITE identity and PEOPLE. PROCESS. PROGRESS. tagline restored.
Decisions: original imported statuses and source records remain unchanged; no invented bill/account numbers or opening balances. Historical records remain protected; financial corrections use existing immutable journal/reversal controls. TEST check output is nonnegotiable and cannot issue payment.
Where stopped: actual preview verified across all seven screens, desktop/mobile, exports/print; 21 automated tests, 18 imported-data workflow checks, 11 actual-preview checks passed. Source revision 4708b7bea459c2844d4922e54310c07727a21e7d saved in isolated checkout; not pushed. Existing test data preserved with pre-seven-screen-recovery-db backup and verified baseline reset.
Next / pending: Kari acceptance. Financial evidence remains provisional: ten invoice discrepancies, 173 overlaps, 575 cleared/no reconciliation IDs, 30 unverified legacy reconciliations, incomplete opening/payment history, CorTrust discrepancy and four zero movements. Production untouched; no new postings in actual TEST database. 9,624 source records / 5,838 invoices / six bills / 25 accounts / 810 evidence rows / 268 journals / 538 lines retained.
Key files: public/accounting-ui.js, public/source.js, public/lite-shell.css, service.mjs, migrations/008-accounting-workflows.sql, test/seven-screens.browser.mjs; chat outputs/seven-corrected-screens and Seven-Accounting-Screens-Delivery.json.

## 2026-10-13 — FlowSuite Lite / ProGraphics isolated TEST integrity correction

Local preview: http://127.0.0.1:5200/ . No production deployment, source extraction rerun, or production data writes.

Preserved and independently compared all 268 original accounting journal IDs and 538 original GL line IDs, account mappings, and debit/credit amounts. Original invoice 8749 receipt is source journal c3ef53e4-c119-47c0-8158-06ae742a9110, payment source 2224df50-c498-4014-9dde-76b1112cf858, posted 2026-10-11T15:32:35.551876Z, check 5197, $729. It predates Lite import. No extra accounting journals or lines exist in the installed TEST baseline.

5,838 historical invoices remain original customer-service evidence, separated from 756 historical orders and excluded from bookkeeping AR. Financial actions on original historical invoices are blocked server-side. Explicit copying requires a new number/date and creates only an unposted draft. Supported bookkeeping AR remains unresolved without a supported control balance and verified openings; historical invoice statuses are not evidence of current AR.

Retained numbered COA, account-level Journal/GL reconciliation, existing AP evidence, original-source bank transaction recognition, explicit dated coding, audited duplicate dismissal/restoration, closing leftover review, and GL-derived report cross-checks. Reset restores the offline imported baseline and preserves other tenants. Known historical discrepancies remain unresolved. Mathematical GL/report agreement does not establish complete source coverage or verified opening balances.

Evidence is in the task outputs/accounting-integrity directory: original source trace, exact identity comparison, source-count checks, tenant/history write guards, and actual seven-screen desktop/mobile browser checks. No final financial acceptance claim is made for unsupported source balances.

## 2026-10-13 — ProGraphics FlowSuite visual refresh, REVIEW CANDIDATE / NOT PUBLISHED

What / where: Kari's authoritative visual-only directive applied to the actual daily ProGraphics application. Candidate source C:/dev/cares-works/.prographics-release/visual-20261013, revision 2f45e9f571d4665d3f0c112e67af75a0b65d82ee. Preview http://127.0.0.1:5202/prographics; unchanged comparison http://127.0.0.1:5203/prographics. Both use current production records/services; preview-only business-write guards verified. Existing ProGraphics sign-in applies, not Lite TEST credentials.

Built: Original FlowSuite emblem/fonts, exact family tokens and established shell CSS reused. Preserved ProGraphics business logo and all nine actual sidebar destinations/order: Orders, Invoices, Customers / Vendors, Sales tax, Notebook, Bills, Reports, Documents, Admin. Existing controller Accounting access remains separate. Added responsive menu, active navigation and orientation without replacing daily workflows. All financial/operational code preceding final shell rendering is unchanged; 329 other original application files preserved. No new dashboards, accounting activation, historical reposting, schema changes or production database copies.

Verified: 55 automated checks pass. Actual Dave/Betty roles match baseline essential controls and permissions across nine screens each, with history/register/statements/category suggestions retained; 18 mobile screens have no page overflow. Synthetic Save/Edit targets only selected invoice; In Progress survives save/reload; Cancel makes no business write. Invoice and packing-slip print isolation, single invocation and cleanup pass. Canonical --check build passes; no candidate deployment or publication created. Production is unchanged at dpl_AE9rS6w1BpToNT9CzL1GMZEhogbz. Verification browser contexts closed and only their refresh sessions signed out; existing user sessions preserved.

Recovery / evidence: Exact-byte source archive and checksum, baseline source tag PG-VISUAL-20261013-BASELINE / revision 47dc80cae37c6e0cc192795ad9a1d3988f7a47d3. Review HTML, screenshot comparisons, role parity, test logs, rollback metadata and build receipt in C:/Users/kari/Documents/Codex/2026-10-12/rhi/outputs/prographics-visual-refresh. Rollback changes UI source only, never business data.

Pending: Kari publication approval, then canonical authenticated staged/live release gates. Five existing unavailable report actions and broader financial acceptance remain open. No separate POS/Home destination is exposed in the audited current sidebar; no replacement process was invented. An obsolete September browser fixture expects a retired New job for customer button; it is not claimed as passing. Current navigation, save/status/cancel and printing fixtures passed. Physical printer/onsite acceptance, openings/source coverage, historical accounting exceptions and Minuteman separation remain separate. Lite accounting TEST remains separate and untouched. No board SQL or messages sent.
## FlowSuite KARI — October 13, 2026 — working LOCAL version; hosted database gate open

**What this is:** Kari’s private Empire Command Center, separate application using existing FlowSuite identity and shell. Existing Command Board remains the task board; KARI holds project/assignment/evidence/decision records, with a read-only board adapter prepared.

**Where it lives:** C:/dev/cares-works/flowsuite-kari. Working private loopback preview http://127.0.0.1:5210; isolated API 5211 and PostgreSQL/PGlite under ignored private/database. Local credentials are in ignored private/local-access.json, separate from existing CARES credentials. Start-KARI.ps1 supports restarting only on free ports.

**Built so far:** Today; 12 project baselines and four urgent projects; project creation/editing; six work statuses plus Reported/Verified/Accepted assessment; AI roster/assignments; decisions and audit history; searchable existing Kounkel resources; intake parsing/matching/confirmation/deduplication; persistent optimistic saves; in-app deadlines/reminders; responsive sidebar. Initial work statuses are explicitly unconfirmed. Ladybug follow-up recorded sent. Actual Colleen DOCX/PDF/review notes folder verified, but final master/production acceptance unconfirmed. MARCO dated source is labeled and production remains unchanged.

**Decisions:** No existing client app, shared source route, client database, account password, domain, production deployment or financial record changed. No paid infrastructure. Reuse original FlowSuite emblem/fonts/tokens/shell. Files are linked, not moved, renamed or copied. No full AI conversation synchronization claim. Approvals never initiate external actions. Completion requires Kari acceptance, criteria and evidence; intake only appends Reported activity. Local source watcher polls four urgent source metadata/fingerprints and local Git revisions each minute; read-only Vercel metadata successfully polled using existing authorized CLI connection, repeats every five minutes while local server runs. Neither source changes nor READY imply acceptance.

**Where it stopped:** Working local app verified. Automatic approval review rejected the proposed additive KARI-only schema on shared Supabase qcikhcnclduakriextsz, requiring explicit user approval for this production database addition. No schema was applied. A concrete approval question is open in chat. Private HTTPS preview not deployed or claimed. Source snapshot revision/receipt in flowsuite-kari/DELIVERY.json.

**Verification:** 10 isolated PostgreSQL/security/core tests pass; 10 actual Edge desktop/mobile checks pass with zero runtime errors; Vite build passes. Actual save/reload and server restart persistence verified. Anonymous API and local credential/env/source HTTP denial checked. Another authenticated identity sees no KARI records/history and cannot write; history cannot be changed/deleted; stale saves fail; AI completion claims cannot update project status; create/assignment/decision/resource persistence and linked audit tested. Source/Vercel metadata connection receipt recorded. Browser test changes restored; explicitly labeled synthetic local intake history retained.

**Next steps:** If explicitly approved, apply reviewed schema.sql, seed only authenticated Kari metadata, verify actual hosted isolation, create separate source-built flowsuite-kari PREVIEW deployment and pass authenticated desktop/mobile hosted acceptance. Existing production release requirements remain intact; this does not authorize a shared release.

**Pending items:** Hosted schema approval/private HTTPS delivery; hosted acceptance; remote GitHub issue/PR sync (local gh unauthenticated); cloud Drive/OneDrive change feed; Calendar integration; supported AI conversation integrations. Local tracking requires the local server/computer to run. Existing ProGraphics financial/source/acceptance discrepancies, Minuteman separation, MARCO acceptance and all earlier pending/frozen work remain unchanged. No Command Board or Everything Board SQL write performed.

**Key files:** flowsuite-kari/src/main.jsx, src/api.js, src/core.mjs, schema.sql, tools/local-server.mjs, tools/db.mjs, tools/collector.mjs, tools/vercel-collector.mjs, tools/seed.mjs, test/, README.md, DELIVERY.json. Private verification receipts/screenshots and local access file excluded from Git and deployment uploads.

## FlowSuite KARI — October 14, 2026 — local preview access restored
What / where: http://127.0.0.1:5210; isolated local API 5211.
Built / decision: previous turn-bound local servers had stopped and connection was refused. Restarted both using existing Start-KARI.ps1 as hidden background processes; no existing applications stopped or changed.
Verification: all 10 actual Edge browser checks passed again, zero runtime errors, including login, four urgent projects, save/reload, search, intake, decisions/resources, mobile and logout. Local credential file and browser opening requested through Codex panels (queued by app).
Where stopped / pending: local access restored. Private HTTPS and shared Supabase schema remain pending explicit approval; no database migration, hosted deployment or production changes performed.
Key files: flowsuite-kari/Start-KARI.ps1; private/api.log; private/ui.log; private/local-access.json; private/verification/browser-results.json.

## ProGraphics preview access — October 14, 2026 — owner session connected; personal confirmation pending
What / where: existing separate read-only HTTPS visual preview, deployment dpl_5cPWeFZvtqb9QAtvAmKDXbY7uUzh. Source .prographics-release/hosted-visual-20261014, built from completed visual refresh. No replacement deployment or production switch required.
Built / decisions: stopped KARI work. Connected Kari's existing authorized CARES/ProGraphics identity to the actual in-app browser via a temporary authentication session, without changing or disclosing any password. Authentication material handled in memory only; no credential file created. Existing hosted provider email redirects resolve to localhost:3000, so no broken password-reset/email flow was presented or production auth configuration changed.
Verified: actual Kari browser loaded 6,599 current invoice/order records and navigated Orders, Invoices, Customers / Vendors, Sales tax, Notebook, Bills, Reports, Documents and Admin. Existing server gateway rejected five invoice/entry/accounting/bank/sync mutation routes with 403 and zero upstream calls. Production remains dpl_AE9rS6w1BpToNT9CzL1GMZEhogbz. No Betty/Dave access, interface or business-data changes; Lite engine not activated.
Where stopped: browser refresh encountered transient ERR_NETWORK_CHANGED; fresh HTTPS tab reopened existing signed-in session and complete-data load is being verified. Personal confirmation remains required before reporting access complete or resuming operational acceptance. Existing source financial/physical acceptance and Minuteman separation remain open.
Key files: work/pg-preview-access-20261014/verify-preservation.mjs; hosted-visual-20261014/api/pg-preview.js; earlier Hosted.json release receipt in visual-refresh task outputs. Credential-opening helper removed after use.
Access follow-up: fresh protected HTTPS tab retained Kari's sign-in and completed its load of 6,599 current invoice/order records. Actual visible account label is kari. Working tab marked deliverable; owner-preview.png saved as private local evidence. Personal-access confirmation question is open; operational acceptance remains paused pending Kari's answer. No passwords or authentication tokens saved to source, reports or chat.

## FlowSuite KARI — October 14, 2026 — private HTTPS preview DELIVERED

**What / where:** Existing KARI application hosted on separate Vercel project flowsuite-kari (prj_nYvB0otIeyWqWvRFeP0Ue7VmKu15), preview deployment dpl_FZP2bgv2hUnyeZvGEbmDC8PhdxvE. Protected preview URL and expiration in flowsuite-kari/DELIVERY.json. Source a28b053a73573bb6d1507ea17fcad00ad926fc90 on codex/flowsuite-kari; shared checkout and Git index preserved. Supplied 264092d was identified as MARCO and preserved; KARI continued from its existing 21ca2c5 source.

**Built so far:** Dedicated Supabase PostgreSQL/Auth project flowsuite-kari, iavbdjouaqgpsyorkjdv, in K Co LLC | CARES Consulting Inc. (imsfnxsuietnsepzjcpc), us-east-1. Exactly one Micro project provisioned under explicit user approval at $0.01344/hour (~$10/full 31-day month). Existing Pro plan retained; no higher compute, HA, PITR, paid custom database domain, paid SMTP, extra subscription or hosting upgrade added. No client production database or application modified.

**Authentication / decisions:** Exactly Kari's isolated authorized account remains. Public signup and anonymous sign-in disabled. Email provider enabled; eight-digit code template, ten-minute expiry, one-minute resend interval, confirmed email, minimum 12-character password, secure password changes and TOTP support retained. Actual auth email delivered to kari@karikounkel.com, narrowly verified in mailbox, and its real code successfully authenticated Kari. No code or password printed or saved to source/public files. Login page offers Email me a sign-in code; Kari may set her own private KARI password in Preferences. Existing client credentials remain separate and unchanged. KARI HTTPS tab is open and retained as a deliverable; direct authenticated-session opening also requested in Codex panel. No personal hands-on acceptance is inferred.

**Projects / tracking:** Twelve authoritative metadata records, four urgent priorities, verified existing index/resource locations, assignments, decisions, append-only activity, structured update intake and ambiguity confirmation retained. Ladybug follow-up remains sent. October 14 Frank owner-portal and ProGraphics read-only preview evidence incorporated; Colleen final master/delivery and MARCO acceptance remain unverified. Source watcher runs hidden in background and writes deduplicated reported local file/folder fingerprints and Git observations into only KARI; Vercel metadata checked every five minutes. It never marks a project complete or copies client records/document bytes. Existing Command Board remains linked only, not copied or written.

**Verification:** 10 actual hosted database/security/persistence checks and 12 real hosted Edge browser checks passed; zero browser runtime errors. Tested anonymous denial, another authenticated identity denied reads/writes, owner creation/editing, stale-save rejection, completion gates, immutable history, assignment/decision/resource persistence, four urgent source views, refresh persistence, search/filter, intake without status overwrite, actual tracking timestamps, private password-setting UI and mobile branding/navigation. Temporary synthetic record rows/test identity removed; verification history retained append-only. Colleen's original record body restored. Source upload digest exactly matches saved deployed application source. Only one authorized user and twelve project records verified at final check. No privileged key or client database endpoint in browser bundle. Shared CARES/ProGraphics production remains dpl_AE9rS6w1BpToNT9CzL1GMZEhogbz.

**Where it stopped / limitations:** Private HTTPS application and reusable owner login delivered. Tracking requires this computer and hosted-watcher process to run; hosted app/data remain accessible independently. Remote GitHub issue/PR, cloud Drive/OneDrive, Calendar and full AI-conversation synchronization are not connected. Local resource paths are labeled and cannot be opened by hosted browsers. Built-in email is low-volume/rate-limited. Outer preview protection link expires after seven days; receipt records the exact expiry. Supabase table/RLS advisors found no exposure warning; default leaked-password-protection warning remains, with remediation linked in README. Kari's hands-on acceptance and all earlier client accounting, publication and transition decisions remain open.

**Preliminary failures resolved:** Missing Vercel Preview build variables blocked the first build; fixed before hosted acceptance. Generated CLI configuration initially disabled the email provider along with signup; corrected while preserving global signup ban and strengthening defaults, then real email delivery verified. Cost helper connector tools were unavailable; explicit user approval, official pricing and supported authenticated CLI with --size micro were used. No duplicate project was created.

**Key files:** flowsuite-kari/DELIVERY.json, README.md, src/, schema.sql, supabase/config.toml and private email template, tools/hosted-config.mjs, tools/hosted-watcher.mjs, Start-KARI-Tracking.ps1, test/hosted-database.mjs, test/hosted-browser.mjs. Ignored private/hosted contains build/deployment/auth metadata (no passwords), test receipts, screenshots and watcher logs. No Everything Board, Command Board, production financial write, existing domain promotion or client password change.

ProGraphics acceptance candidate checkpoint: ad821f435dfab10cf379111208e29af7bee38dab (local source only; no push/publication).

## FlowSuite KARI automatic tracking and offline recovery — October 14, 2026

**What / where:** Continued the existing isolated KARI build from a28b053; verified source revision **064e67b0f7a9ae34f4398606511b1e2a7ab380f1**, branch codex/flowsuite-kari. Private source-built preview **dpl_7HMHYvAYR75WobXheu4oFYteb2h6**, host flowsuite-kari-f0u7qtthf-kari-kounkels-projects.vercel.app. Dedicated existing Micro database iavbdjouaqgpsyorkjdv only. Protected preview receipt/link remains in ignored flowsuite-kari/DELIVERY.json; normal owner email-code login remains available.

**Built:** Owner-only synchronization health table; Connected/Disconnected/Requires attention derived from check/success age and credential expiry; separate last successful sync, last checked, errors, execution location and recovery limits for every requested source. Local metadata/Git checkpoints are durable in hosted KARI. Reconnection catches available file state and retained commits, preserves original modification/commit timestamps, deduplicates activity and reports rewritten/deleted/intermediate-history gaps. Source observations no longer reset project staleness or change project status. Per-user Windows sign-in task FlowSuite KARI local recovery restarts the monitor after startup/network initialization failure; it was resumed after offline testing.

**Cloud connection / approval:** Kari explicitly approved encrypted hosted storage of the existing Vercel access token after automatic review initially blocked that credential export. Fixed read-only deployment-history GET requests for CARES Works, MARCO and KARI now run through pg_cron/pg_net inside the existing isolated KARI database, with durable pagination/checkpoints, 48-hour overlap and unique deployment/state event keys. Token is encrypted in Vault; no refresh token exported, no credential written into source or browser bundle, no provider writes. Server-only installer and owner-checked secure renewal RPC verified. Account webhooks require Vercel Pro; current team remains Hobby and no upgrade or extra paid service was introduced.

**Verified:** 11 actual hosted synchronization/security checks; 4 final hosted offline checks; 6 actual hosted cloud/credential-isolation checks; explicit BEGIN/ROLLBACK server-expiry test; 12 final hosted browser checks with zero runtime errors; 10 existing local workflow/security tests. With the KARI watcher stopped and localhost blocked, owner dashboard opened/refreshed without local requests, local sources became Disconnected, and the automatic hosted scheduler recorded the new deployment created after local tracking stopped. All three cloud checkpoints succeeded. Synthetic file/Git fixtures recovered two offline commits, retained source times and checkpoints on failure, avoided duplicates, reported rewritten history and left actual project states unchanged by synchronization. Physical laptop power-off was not performed. No client production data/interface/access change, extra database, accounting activation, production alias or promotion. Shared CARES/ProGraphics production remains dpl_AE9rS6w1BpToNT9CzL1GMZEhogbz.

**Actual integration coverage:** ChatGPT/Work, Codex and Claude/Cowork/Code are pasted Update Intake only; no native conversation feeds. GitHub remote issues/PRs are disconnected; retained local Git is separate. Google Drive and Calendar have no runtime cloud connection. OneDrive is selected local Frank/Colleen path metadata, with no Microsoft Graph feed. Vercel is genuinely hosted automatic polling, tested. Dashboard/auth/persistence are already hosted. Connected assistant plugins are not represented as app background integrations.

**Where stopped / pending:** Durable travel coverage is not fully accepted until the dedicated-token handoff is complete. The approved initial CLI access token expires **October 14, 5:58 p.m. Central**; expiry and authentication failure visibly require attention. Official Vercel token form is prepared with name FlowSuite KARI hosted monitor, Kari's existing team scope and 30-day expiry; no new token created by the agent. Browser credential policy requires Kari to complete Create and enter the token directly into the deployed Connections secure form. Question remains pending; no token belongs in chat. Existing outer preview share-link expiry remains recorded in the private receipt. Client operational/accounting/manuscript acceptance remains separate and unconfirmed.

**Key files:** flowsuite-kari/SYNC-VERIFICATION.md, README.md, src/sync-health.mjs, src/api.js, src/main.jsx, tools/local-sync.mjs, tools/hosted-watcher.mjs, tools/vercel-sync.mjs, Run-KARI-Tracking.ps1, supabase/migrations/*synchronization*/*monitor*, test/synchronization.mjs, test/hosted-offline.mjs, test/hosted-cloud.mjs, test/credential-expiry.sql. Ignored private/hosted holds receipts and screenshots without passwords or tokens. Shared Git index and checkout preserved.

**Credential handoff verification, 5:15 p.m. Central:** Kari reported saving the dedicated token. Hosted KARI still has no credentialConfiguredAt and retains the initial October 14 5:58 p.m. expiry; both final-preview in-app browser tabs show the sign-in screen. No renewal success claimed. Verified owner EXECUTE grant and positively exercised the real renewal function under Kari's authenticated role using a synthetic value inside explicit BEGIN/ROLLBACK; it passed without changing the real secret or configuration. Clarification pending whether Kari saw Stored securely, created the token in Vercel only, or saw an error/sign-in screen. No secret read, copied into chat, or submitted by the agent. Test: flowsuite-kari/test/renewal-rollback.sql; private renewal-verification.json.

