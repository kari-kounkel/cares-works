// Comparing the migrated books against the frozen QuickBooks baseline. The numbers
// here are Social Services of Minnesota's real FY2024 as QBO reported it.
// Pull the pure functions out of the JSX source without a React runtime. compareToQbo
// calls summarizeActivities, so the slice has to carry both.
import fs from "fs";
const src = fs.readFileSync("src/pages/LedgerWorkspace.jsx", "utf8");
const start = src.indexOf("export function compareToQbo");
const end = src.indexOf("// Map an invoices row into the shape");
const code = src.slice(start, end).replaceAll("export function", "function");
const compareToQbo = new Function(code + "; return compareToQbo;")();

let fail = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fail++; console.log(`FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label} = ${JSON.stringify(got)}`);
};

const mo = (start, end, rev, cogs, exp) =>
  ({ period_start: start, period_end: end, revenue_cents: rev, cogs_cents: cogs, expense_cents: exp });

// Two months of QBO, and a book that matches them exactly.
const BASE = [
  mo("2024-01-01", "2024-01-31", 809400, 736400, 151878),
  mo("2024-02-01", "2024-02-29", 1801200, 741400, 56585),
];
const CATS = [
  { name: "Program Revenue", kind: "income", func_class: "earned" },
  { name: "Program Costs",   kind: "expense", func_class: "program" },
];
const entries = (rows) => rows.map(([d, dir, cents, cat]) =>
  ({ entry_date: d, direction: dir, amount_cents: cents, category: cat }));

const MATCH = entries([
  ["2024-01-15", "in",  809400,  "Program Revenue"],
  ["2024-01-20", "out", 888278,  "Program Costs"],    // 736400 + 151878
  ["2024-02-15", "in",  1801200, "Program Revenue"],
  ["2024-02-20", "out", 797985,  "Program Costs"],    // 741400 + 56585
]);

const m = compareToQbo(BASE, MATCH, CATS, "2024-01-01", "2024-12-31");
eq("qbo revenue summed",        m.qbo.revenue, 809400 + 1801200);
eq("cogs folded into expense",  m.qbo.expense, 736400 + 151878 + 741400 + 56585);
eq("qbo net derived",           m.qbo.net, m.qbo.revenue - m.qbo.expense);
eq("book matches",              m.tie, true);
eq("no revenue difference",     m.diff.revenue, 0);
eq("no expense difference",     m.diff.expense, 0);
eq("no net difference",         m.diff.net, 0);
eq("month count",               m.months, 2);
// The baseline stops in February but the window runs to December — say so.
eq("partial window flagged",    m.partial, true);
eq("coverage start",            m.covStart, "2024-01-01");
eq("coverage end",              m.covEnd, "2024-02-29");

// A missing transaction must show as a difference, not be smoothed over.
const SHORT = MATCH.slice(0, 3);
const s = compareToQbo(BASE, SHORT, CATS, "2024-01-01", "2024-12-31");
eq("missing expense shows",     s.diff.expense, -797985);
eq("missing expense breaks tie", s.tie, false);
eq("net difference reported",   s.diff.net, 797985);

// Uncoded money is excluded from the book totals by design, so the comparison has
// to surface it — otherwise the gap looks unexplainable when it is fully explained.
const UNCODED = entries([
  ["2024-01-15", "in",  809400,  "Program Revenue"],
  ["2024-01-20", "out", 888278,  "Program Costs"],
  ["2024-02-15", "in",  1801200, "Program Revenue"],
  ["2024-02-20", "out", 797985,  ""],
]);
const u = compareToQbo(BASE, UNCODED, CATS, "2024-01-01", "2024-12-31");
eq("uncoded surfaced",          u.uncoded, 797985);
eq("uncoded leaves a gap",      u.diff.expense, -797985);

// A window with no QBO months at all returns null rather than a row of zeros —
// "we have nothing to compare" and "everything is zero" must not look alike.
eq("no baseline in window", compareToQbo(BASE, MATCH, CATS, "2027-01-01", "2027-12-31"), null);
eq("empty baseline",        compareToQbo([], MATCH, CATS, "2024-01-01", "2024-12-31"), null);
eq("null baseline",         compareToQbo(null, MATCH, CATS, "2024-01-01", "2024-12-31"), null);

// A full fiscal year of baseline is not partial.
const FULL = [mo("2024-01-01", "2024-12-31", 16704285, 12154633, 4637821)];
const f = compareToQbo(FULL, [], CATS, "2024-01-01", "2024-12-31");
eq("full year not partial",  f.partial, false);
eq("SSMN FY2024 qbo net",    f.qbo.net, -88169);

console.log(fail ? `\n${fail} FAILURES` : "\nall pass");
process.exit(fail ? 1 : 0);
