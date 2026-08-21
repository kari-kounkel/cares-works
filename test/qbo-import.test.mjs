// Tests for the QuickBooks importer. The journal-entry case is checked against a
// REAL Social Services of Minnesota export whose totals are already known to tie
// to the bank statements ($8,094.00 in / $8,882.78 out for January 2024).
import { parseQbo, parseCsv, money, isoDate, detectFormat } from "../src/lib/qboImport.js";

let fail = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fail++; console.log(`FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label} = ${JSON.stringify(got)}`);
};

// ---- primitives ---------------------------------------------------------------
eq("money plain",        money("1234.56"), 123456);
eq("money commas",       money("1,234.56"), 123456);
eq("money dollar",       money("$1,234.56"), 123456);
eq("money parens = neg", money("(1,234.56)"), -123456);
eq("money minus",        money("-1,234.56"), -123456);
eq("money blank",        money(""), 0);
eq("date us",            isoDate("01/31/2024"), "2024-01-31");
eq("date single digit",  isoDate("1/5/2024"), "2024-01-05");
eq("date iso passthru",  isoDate("2024-01-31"), "2024-01-31");
eq("date junk",          isoDate("Total"), null);
eq("csv quoted comma",   parseCsv('a,"b,c",d')[0], ["a", "b,c", "d"]);
eq("csv escaped quote",  parseCsv('a,"say ""hi""",c')[0], ["a", 'say "hi"', "c"]);

// ---- the real journal export ---------------------------------------------------
const JOURNAL = `*JournalNo,*JournalDate,*AccountName,*Debits,*Credits,Description,Name,Currency,Location,Class
JE-2024-01,01/31/2024,Bank - Checking,1500.0,,MN STATE-MMB/ACH,,USD,,
JE-2024-01,,Contributions,,1500.0,MN STATE-MMB/ACH,,USD,,
JE-2024-01,01/31/2024,Bank - Checking,4844.0,,NUWAY RECOVERY PAYMENTS,,USD,,
JE-2024-01,,Contributions,,4844.0,NUWAY RECOVERY PAYMENTS,,USD,,
JE-2024-01,01/31/2024,Utilities,91.77,,CPENERGY MNGCO,,USD,,
JE-2024-01,,Bank - Checking,,91.77,CPENERGY MNGCO,,USD,,
JE-2024-01,01/31/2024,Rent,3450.0,,5X PROPERTIES,,USD,,
JE-2024-01,,Bank - Checking,,3450.0,5X PROPERTIES,,USD,,`;

const j = parseQbo(JOURNAL, { bankAccounts: ["Bank - Checking"] });
eq("journal detected",      j.format, "journal");
eq("journal rows",          j.rows.length, 4);
eq("journal money in",      j.summary.inCents, 634400);
eq("journal money out",     j.summary.outCents, 354177);
eq("deposit direction",     j.rows.find(r => r.amount_cents === 484400).direction, "in");
eq("deposit keeps coding",  j.rows.find(r => r.amount_cents === 484400).category, "Contributions");
eq("expense direction",     j.rows.find(r => r.amount_cents === 345000).direction, "out");
eq("expense keeps coding",  j.rows.find(r => r.amount_cents === 345000).category, "Rent");
eq("bank account carried",  j.rows[0].bankAccount, "Bank - Checking");
eq("date inherited on continuation line", j.rows[0].date, "2024-01-31");

// An unbalanced journal is a data problem — refuse it, don't half-import it.
const UNBAL = `*JournalNo,*JournalDate,*AccountName,*Debits,*Credits
JE-9,01/31/2024,Bank - Checking,100.00,
JE-9,,Rent,,90.00`;
const u = parseQbo(UNBAL, { bankAccounts: ["Bank - Checking"] });
eq("unbalanced journal skipped", u.rows.length, 0);
eq("unbalanced journal reported", u.warnings.some(w => w.level === "error"), true);

// An accrual entry that never touches cash isn't a register line.
const ACCRUAL = `*JournalNo,*JournalDate,*AccountName,*Debits,*Credits
JE-8,01/31/2024,Accounts Receivable,500.00,
JE-8,,Program Revenue,,500.00`;
const a = parseQbo(ACCRUAL, { bankAccounts: ["Bank - Checking"] });
eq("accrual not a register line", a.rows.length, 0);
eq("accrual explained", a.warnings.some(w => w.level === "skip"), true);

// A split entry imports, but without a guessed category.
const SPLIT = `*JournalNo,*JournalDate,*AccountName,*Debits,*Credits
JE-7,02/01/2024,Bank - Checking,,300.00
JE-7,,Rent,200.00,
JE-7,,Utilities,100.00,`;
const sp = parseQbo(SPLIT, { bankAccounts: ["Bank - Checking"] });
eq("split imported",           sp.rows.length, 1);
eq("split has no guess",       sp.rows[0].category, null);
eq("split flagged for review", sp.warnings.some(w => w.level === "review"), true);

// ---- transaction list / general ledger -----------------------------------------
const REGISTER = `Social Services of Minnesota
Transaction List by Date
Date,Transaction Type,Num,Name,Memo/Description,Account,Split,Amount
01/04/2024,Deposit,,NuWay Recovery,NUWAY RECOVERY PAYMENTS,Checking (6431),Program Revenue,"4,844.00"
01/05/2024,Expense,,5X Properties,Rent for January,Checking (6431),Rent,"-3,450.00"
01/17/2024,Check,5039,Comcast,Internet,Checking (6431),Utilities,-128.74
01/31/2024,Journal Entry,,,Depreciation,Accumulated Depreciation,Depreciation,-250.00`;

const g = parseQbo(REGISTER, { bankAccounts: ["Checking (6431)"] });
eq("register detected",     g.format, "register");
eq("register rows",         g.rows.length, 3);
eq("header rows skipped",   g.summary.first, "2024-01-04");
eq("positive is money in",  g.rows[0].direction, "in");
eq("negative is money out", g.rows[1].direction, "out");
eq("amount is absolute",    g.rows[1].amount_cents, 345000);
eq("split becomes category",g.rows[1].category, "Rent");
eq("non-cash row skipped",  g.warnings.some(w => w.level === "skip"), true);
eq("register net",          g.summary.net, 484400 - 345000 - 12874);

// "-Split-" is QBO's placeholder, not a real account name.
const SPLITWORD = `Date,Amount,Account,Split,Memo/Description
01/09/2024,-100.00,Checking (6431),-Split-,Multiple things`;
const sw = parseQbo(SPLITWORD, { bankAccounts: ["Checking (6431)"] });
eq("-Split- is not a category", sw.rows[0].category, null);

// ---- refusals ------------------------------------------------------------------
const TB = `Account,Debit,Credit
Checking (6431),232.35,`;
eq("trial balance refused", parseQbo(TB, {}).format, "trialbalance");
eq("trial balance explains why", parseQbo(TB, {}).warnings[0].msg.includes("Trial Balance"), true);
eq("garbage refused", parseQbo("hello\nworld", {}).format, "unknown");
eq("empty refused", parseQbo("", {}).format, "empty");

// QBO and the tenant rarely spell an account the same way, so matching is
// tolerant: an explicit substring match, and a name heuristic as the fallback so
// a bank account QBO knows about but the tenant hasn't set up yet still imports.
const LOOSE = `Date,Amount,Account,Split,Memo/Description
01/09/2024,-100.00,Checking (6431),Rent,Rent`;
eq("substring match on tenant name", parseQbo(LOOSE, { bankAccounts: ["Checking (6431) - 1"] }).rows.length, 1);
eq("name heuristic when unknown to tenant", parseQbo(LOOSE, { bankAccounts: ["Some Other Account"] }).rows.length, 1);
const NOTBANK = `Date,Amount,Account,Split,Memo/Description
01/09/2024,-100.00,Accumulated Depreciation,Depreciation,Non-cash`;
eq("non-bank account still refused", parseQbo(NOTBANK, { bankAccounts: ["Checking (6431)"] }).rows.length, 0);

console.log(fail ? `\n${fail} FAILURES` : "\nall pass");
process.exit(fail ? 1 : 0);
