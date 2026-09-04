// The CPA pack from single-entry books. The point of these tests is the trial balance
// actually footing — including the awkward cases (uncategorised money, transfers
// between the org's own accounts, a window that cuts a transfer in half).
import fs from "fs";
const src = fs.readFileSync("src/pages/LedgerWorkspace.jsx", "utf8");
const start = src.indexOf("// ---- The CPA pack");
const end = src.indexOf("// ---- Financials for one set of books");
const cashReports = new Function(src.slice(start, end).replace("export function", "function") + "; return cashReports;")();

let fail = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fail++; console.log(`FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label} = ${JSON.stringify(got)}`);
};

const A = { id: "a1", name: "6431 Premier", last_four: "6431", opening_balance_cents: 10000 };
const B = { id: "a2", name: "8365 Premier", last_four: "8365", opening_balance_cents: 5000 };
const CATS = [
  { name: "Medicaid — peer support", kind: "income",  func_class: "earned" },
  { name: "Donations",               kind: "income",  func_class: "contributed" },
  { name: "Rent",                    kind: "expense", func_class: "program" },
  { name: "Transfer between our accounts", kind: "expense", func_class: "transfer" },
];
const e = (id, acct, date, dir, cents, cat) =>
  ({ id, account_id: acct, entry_date: date, direction: dir, amount_cents: cents, category: cat });

// --- the plain case --------------------------------------------------------------
const E = [
  e("1", "a1", "2025-03-01", "in",  500000, "Medicaid — peer support"),
  e("2", "a1", "2025-03-05", "out", 200000, "Rent"),
  e("3", "a2", "2025-04-01", "in",   50000, "Donations"),
];
const r = cashReports(E, CATS, [A, B], "2025-01-01", "2025-12-31");
eq("opening cash",   r.openingCash, 15000);
eq("income total",   r.incomeTotal, 550000);
eq("expense total",  r.expenseTotal, 200000);
eq("net",            r.net, 350000);
eq("closing cash",   r.closingCash, 15000 + 550000 - 200000);
eq("TRIAL BALANCE FOOTS", r.balances, true);
eq("debits = credits",    [r.totalDebit, r.totalCredit], [365000 + 200000, 550000 + 15000]);
eq("balance sheet ties",  r.balanceSheet.totalAssets, r.balanceSheet.netAssets);
eq("no liabilities tracked", r.balanceSheet.liabilities, []);
// running balance per account is the general ledger
eq("GL running balance", r.ledger[0].lines.map(l => l.balanceCents), [510000, 310000]);
eq("GL second account",  r.ledger[1].lines.map(l => l.balanceCents), [55000]);

// --- uncategorised money must not break the footing ------------------------------
const U = [...E, e("4", "a1", "2025-05-01", "in", 7700, ""), e("5", "a1", "2025-05-02", "out", 300, null)];
const u = cashReports(U, CATS, [A, B], "2025-01-01", "2025-12-31");
eq("uncoded in tracked",  u.uncodedIn, 7700);
eq("uncoded out tracked", u.uncodedOut, 300);
eq("uncoded still foots", u.balances, true);
eq("uncoded in income total", u.incomeTotal, 557700);

// --- transfers are not income or expense, but they do move cash ------------------
const T = [...E,
  e("6", "a1", "2025-06-01", "out", 100000, "Transfer between our accounts"),
  e("7", "a2", "2025-06-01", "in",  100000, "Transfer between our accounts")];
const t = cashReports(T, CATS, [A, B], "2025-01-01", "2025-12-31");
eq("transfer not income",  t.incomeTotal, 550000);
eq("transfer not expense", t.expenseTotal, 200000);
eq("transfer recorded",    [t.transferIn, t.transferOut], [100000, 100000]);
eq("net cash unchanged",   t.closingCash, r.closingCash);
eq("transfers still foot", t.balances, true);

// A window that cuts a transfer in half moves cash without touching income or expense.
// That residue has to surface, not silently unbalance the statement.
const half = cashReports(T, CATS, [A, B], "2025-06-01", "2025-06-30");
eq("half transfer foots", half.balances, true);
eq("half transfer has no P&L effect", [half.incomeTotal, half.expenseTotal], [0, 0]);

// --- period windowing and opening balances ---------------------------------------
const w = cashReports(E, CATS, [A, B], "2025-04-01", "2025-12-31");
eq("opening rolls prior activity in", w.openingCash, 15000 + 500000 - 200000);
eq("windowed income", w.incomeTotal, 50000);
eq("windowed foots",  w.balances, true);

// --- empties ----------------------------------------------------------------------
const z = cashReports([], CATS, [A, B], "2025-01-01", "2025-12-31");
eq("empty foots",       z.balances, true);
eq("empty closing",     z.closingCash, 15000);
eq("empty net",         z.net, 0);
eq("no accounts",       cashReports(E, CATS, [], "2025-01-01", "2025-12-31").closingCash, 0);
eq("null entries",      cashReports(null, CATS, [A], "2025-01-01", "2025-12-31").balances, true);

console.log(fail ? `\n${fail} FAILURES` : "\nall pass");
process.exit(fail ? 1 : 0);
