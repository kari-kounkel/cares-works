// Journal entries back out to QuickBooks. The strongest check available is a round
// trip: export these books as journal entries, feed the result to the importer that
// reads real QBO exports, and require the same lines back.
import { toQboJournal, usDate, journalNo } from "../src/lib/qboExport.js";
import { parseQbo, parseCsv } from "../src/lib/qboImport.js";

let fail = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fail++; console.log(`FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label} = ${JSON.stringify(got)}`);
};

const ACCTS = [{ id: "a1", name: "Checking (6431)" }];
const E = [
  { id: "1", account_id: "a1", entry_date: "2025-01-04", direction: "in",  amount_cents: 484400, category: "Program Revenue", description: "NUWAY RECOVERY PAYMENTS" },
  { id: "2", account_id: "a1", entry_date: "2025-01-05", direction: "out", amount_cents: 345000, category: "Rent", description: "5X PROPERTIES" },
];

eq("date to US format", usDate("2025-01-04"), "1/4/2025");
eq("journal numbers are stable", journalNo(E[0], 0), "CW-20250104-0001");

const x = toQboJournal(E, ACCTS, { start: "2025-01-01", end: "2025-12-31" });
eq("entries exported", x.count, 2);
const parsed = parseCsv(x.csv);
eq("header matches QBO's import shape", parsed[0].slice(0, 5),
   ["*JournalNo", "*JournalDate", "*AccountName", "*Debits", "*Credits"]);
eq("two lines per entry", parsed.length - 1, 4);
// money in debits the bank; money out debits the expense
eq("deposit debits the bank",   [parsed[1][2], parsed[1][3]], ["Checking (6431)", "4844.00"]);
eq("deposit credits income",    [parsed[2][2], parsed[2][4]], ["Program Revenue", "4844.00"]);
eq("payment debits the expense",[parsed[3][2], parsed[3][3]], ["Rent", "3450.00"]);
eq("payment credits the bank",  [parsed[4][2], parsed[4][4]], ["Checking (6431)", "3450.00"]);
eq("every entry balances", parsed.slice(1).reduce((s, r) => s + (+r[3] || 0) - (+r[4] || 0), 0), 0);

// --- THE ROUND TRIP --------------------------------------------------------------
const back = parseQbo(x.csv, { bankAccounts: ["Checking (6431)"] });
eq("round trip detected as journal", back.format, "journal");
eq("round trip line count",  back.rows.length, 2);
eq("round trip money in",    back.summary.inCents, 484400);
eq("round trip money out",   back.summary.outCents, 345000);
eq("round trip keeps coding", back.rows.map(r => r.category).sort(), ["Program Revenue", "Rent"]);
eq("round trip keeps dates",  back.rows.map(r => r.date).sort(), ["2025-01-04", "2025-01-05"]);

// --- uncoded money goes somewhere a bookkeeper will find it ----------------------
const U = toQboJournal(
  [{ id: "3", account_id: "a1", entry_date: "2025-02-01", direction: "in", amount_cents: 5000, category: "", description: "DEPOSIT" },
   { id: "4", account_id: "a1", entry_date: "2025-02-02", direction: "out", amount_cents: 900, category: null, description: "FEE" }],
  ACCTS, {});
const up = parseCsv(U.csv);
eq("uncoded income named",  up[2][2], "Uncategorized Income");
eq("uncoded expense named", up[3][2], "Uncategorized Expense");
eq("uncoded is flagged",    U.warnings.filter(w => w.level === "review").length, 2);

// --- refusals and edges ----------------------------------------------------------
eq("line with no account skipped",
   toQboJournal([{ id: "5", account_id: "nope", entry_date: "2025-01-01", direction: "in", amount_cents: 100 }], ACCTS, {}).count, 0);
eq("zero-amount line skipped",
   toQboJournal([{ id: "6", account_id: "a1", entry_date: "2025-01-01", direction: "in", amount_cents: 0 }], ACCTS, {}).count, 0);
eq("period filter applies",
   toQboJournal(E, ACCTS, { start: "2025-01-05", end: "2025-01-31" }).count, 1);
eq("no entries", toQboJournal([], ACCTS, {}).count, 0);
eq("null entries", toQboJournal(null, ACCTS, {}).count, 0);
// a comma in a payee must not shift the columns
const C = toQboJournal([{ id: "7", account_id: "a1", entry_date: "2025-03-01", direction: "out", amount_cents: 100, category: "Rent", description: "5X PROPERTIES, LLC" }], ACCTS, {});
eq("comma in description survives", parseCsv(C.csv)[1][5], "5X PROPERTIES, LLC");

console.log(fail ? `\n${fail} FAILURES` : "\nall pass");
process.exit(fail ? 1 : 0);
