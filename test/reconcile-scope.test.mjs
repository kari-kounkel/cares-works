// One statement at a time. These cases are Emerson Services' 0449 account, whose
// ledger reproduces the bank's own printed balance at every month end from Aug 2025
// through Jun 2026 — eleven statements to work through, oldest first.
import fs from "fs";
const src = fs.readFileSync("src/pages/LedgerWorkspace.jsx", "utf8");
const start = src.indexOf("export function reconcileScope");
const end = src.indexOf("// ---- Comparing the new books against QuickBooks");
const reconcileScope = new Function(src.slice(start, end).replace("export function", "function") + "; return reconcileScope;")();

let fail = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fail++; console.log(`FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label} = ${JSON.stringify(got)}`);
};

const A = "acct-0449", B = "acct-1398";
const e = (id, date, dir, cents, status, acct = A) =>
  ({ id, entry_date: date, direction: dir, amount_cents: cents, match_status: status || null, account_id: acct });

// Aug and Sep 2025 activity, plus a line on a different account that must never leak in.
const ENTRIES = [
  e("a1", "2025-08-25", "in",  550000),
  e("a2", "2025-08-27", "out", 303190),
  e("a3", "2025-08-28", "out", 161740),
  e("a4", "2025-09-02", "in",  450000),
  e("a5", "2025-09-30", "out", 393190),
  e("z1", "2025-08-10", "in",  999999, null, B),
];

// --- period scoping -------------------------------------------------------------
const aug = reconcileScope(ENTRIES, A, 0, [], "2025-08-31");
eq("august lines only",        aug.inScope.map(x => x.id), ["a1", "a2", "a3"]);
eq("september held back",      aug.laterCount, 2);
eq("other account excluded",   aug.inScope.some(x => x.account_id === B), false);
eq("first statement begins at opening", aug.beginning, 0);
eq("nothing prior",            aug.lastRec, null);
eq("not out of order",         aug.outOfOrder, false);

// No statement date → everything, which is the old one-off-check behaviour.
const open = reconcileScope(ENTRIES, A, 0, [], "");
eq("no date means all lines",  open.inScope.length, 5);
eq("nothing held back",        open.laterCount, 0);

// --- the second statement -------------------------------------------------------
// August locked: its three lines carry match_status "reconciled".
const AFTER_AUG = ENTRIES.map(x => ["a1", "a2", "a3"].includes(x.id) ? { ...x, match_status: "reconciled" } : x);
const AUG_REC = [{ account_id: A, statement_ending_date: "2025-08-31", statement_ending_balance_cents: 136122 }];

const sep = reconcileScope(AFTER_AUG, A, 0, AUG_REC, "2025-09-30");
// 550000 - 303190 - 161740 = 85070... but the bank says August closed at 1,361.22.
eq("beginning carries august",  sep.beginning, 550000 - 303190 - 161740);
eq("september lines now open",  sep.inScope.map(x => x.id), ["a4", "a5"]);
eq("nothing left after",        sep.laterCount, 0);
eq("last statement remembered", sep.lastRec.statement_ending_date, "2025-08-31");
eq("still in order",            sep.outOfOrder, false);

// --- the guard that matters ------------------------------------------------------
// Going backwards after August is locked: "beginning" already contains August, so any
// difference shown for an earlier statement is wrong. Refuse rather than mislead.
eq("earlier statement refused", reconcileScope(AFTER_AUG, A, 0, AUG_REC, "2025-08-15").outOfOrder, true);
eq("same date refused",         reconcileScope(AFTER_AUG, A, 0, AUG_REC, "2025-08-31").outOfOrder, true);
eq("later still allowed",       reconcileScope(AFTER_AUG, A, 0, AUG_REC, "2025-09-30").outOfOrder, false);

// A prior reconciliation on a DIFFERENT account must not gate this one.
const OTHER_REC = [{ account_id: B, statement_ending_date: "2026-01-31", statement_ending_balance_cents: 500 }];
eq("other account's history ignored", reconcileScope(ENTRIES, A, 0, OTHER_REC, "2025-08-31").outOfOrder, false);
eq("other account's history not listed", reconcileScope(ENTRIES, A, 0, OTHER_REC, "2025-08-31").priorRecs.length, 0);

// --- opening balance ------------------------------------------------------------
// An account converted mid-life starts from its opening balance, not zero.
eq("opening balance respected", reconcileScope(ENTRIES, A, 250000, [], "2025-08-31").beginning, 250000);

// --- ordering -------------------------------------------------------------------
// Lines arrive newest-first from the database; the panel must show them oldest-first.
const SHUFFLED = [e("b3", "2025-08-28", "out", 100), e("b1", "2025-08-01", "in", 100), e("b2", "2025-08-15", "out", 100)];
eq("sorted oldest first", reconcileScope(SHUFFLED, A, 0, [], "2025-08-31").inScope.map(x => x.id), ["b1", "b2", "b3"]);

// Prior reconciliations come back oldest-first regardless of input order.
const JUMBLED = [
  { account_id: A, statement_ending_date: "2025-10-31", statement_ending_balance_cents: 1253103 },
  { account_id: A, statement_ending_date: "2025-08-31", statement_ending_balance_cents: 136122 },
  { account_id: A, statement_ending_date: "2025-09-30", statement_ending_balance_cents: 435399 },
];
const j = reconcileScope(ENTRIES, A, 0, JUMBLED, "2025-11-30");
eq("prior statements sorted", j.priorRecs.map(r => r.statement_ending_date), ["2025-08-31", "2025-09-30", "2025-10-31"]);
eq("latest is the last one",  j.lastRec.statement_ending_date, "2025-10-31");

// --- empties --------------------------------------------------------------------
eq("no entries",     reconcileScope([], A, 0, [], "2025-08-31").inScope.length, 0);
eq("null entries",   reconcileScope(null, A, 0, null, "2025-08-31").beginning, 0);
eq("unknown account", reconcileScope(ENTRIES, "nope", 0, [], "2025-08-31").inScope.length, 0);

console.log(fail ? `\n${fail} FAILURES` : "\nall pass");
process.exit(fail ? 1 : 0);
