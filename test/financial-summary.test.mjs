// Financials for one or both sets of books. Uses Emerson's two entities: a for-profit
// whose categories carry no functional class, and a nonprofit whose categories do.
import fs from "fs";
const src = fs.readFileSync("src/pages/LedgerWorkspace.jsx", "utf8");
// financialSummary calls summarizeActivities, and both live in one block ending at
// the invoice mapper — take the whole block so the dependency comes with it.
const start = src.indexOf("// ---- Financials for one set of books");
const end = src.indexOf("// Map an invoices row into the shape");
const code = src.slice(start, end).replaceAll("export function", "function");
const financialSummary = new Function(code + "; return financialSummary;")();

let fail = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fail++; console.log(`FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label} = ${JSON.stringify(got)}`);
};

const e = (date, dir, cents, category) => ({ entry_date: date, direction: dir, amount_cents: cents, category });

// --- the nonprofit: categories carry a functional class -------------------------
const NP_CATS = [
  { name: "Donations — individuals",          kind: "income",  func_class: "contributed" },
  { name: "Medicaid — peer support services", kind: "income",  func_class: "earned" },
  { name: "Peer support specialist wages",    kind: "expense", func_class: "program" },
  { name: "Accounting fees",                  kind: "expense", func_class: "mg" },
  { name: "Fundraising fees",                 kind: "expense", func_class: "fundraising" },
  { name: "Transfer between our accounts",    kind: "expense", func_class: "transfer" },
];
const NP = [
  e("2025-03-01", "in",  500000, "Donations — individuals"),
  e("2025-04-01", "in", 2000000, "Medicaid — peer support services"),
  e("2025-05-01", "out", 1200000, "Peer support specialist wages"),
  e("2025-06-01", "out",  300000, "Accounting fees"),
  e("2025-07-01", "out",  100000, "Fundraising fees"),
  e("2025-08-01", "out",  250000, "Transfer between our accounts"), // must not be an expense
  e("2025-09-01", "in",   75000, ""),                                // uncoded, must not be revenue
];
const np = financialSummary(NP, NP_CATS, "2025-01-01", "2025-12-31");
eq("revenue total",        np.revTotal, 2500000);
eq("expense total",        np.expTotal, 1600000);
eq("net",                  np.net, 900000);
eq("transfer not expensed", np.expense["Transfer between our accounts"], undefined);
eq("uncoded reported",     np.uncoded, 75000);
eq("uncoded not in revenue", np.revTotal, 500000 + 2000000);
eq("contributed split",    np.contributed, 500000);
eq("earned split",         np.earned, 2000000);
eq("program expense",      np.byFunction.program, 1200000);
eq("m&g expense",          np.byFunction.mg, 300000);
eq("fundraising expense",  np.byFunction.fundraising, 100000);
eq("categories flattened", Object.keys(np.revenue).sort(), ["Donations — individuals", "Medicaid — peer support services"]);

// --- the for-profit: no functional class anywhere -------------------------------
// The same function has to produce a usable income statement, with everything
// landing in the unclassified bucket rather than vanishing.
const FP_CATS = [
  { name: "Program revenue", kind: "income",  func_class: null },
  { name: "Rent",            kind: "expense", func_class: null },
];
const FP = [e("2025-02-01", "in", 800000, "Program revenue"), e("2025-02-05", "out", 345000, "Rent")];
const fp = financialSummary(FP, FP_CATS, "2025-01-01", "2025-12-31");
eq("business revenue",     fp.revTotal, 800000);
eq("business expense",     fp.expTotal, 345000);
eq("business net",         fp.net, 455000);
eq("unclassified holds it", fp.byFunction.unclassified, 345000);
eq("business categories",  Object.keys(fp.expense), ["Rent"]);

// --- both books added together --------------------------------------------------
// "Both" is the sum of two independent runs, never one query across two orgs.
const combined = {
  revTotal: np.revTotal + fp.revTotal,
  expTotal: np.expTotal + fp.expTotal,
  net: np.net + fp.net,
};
eq("combined revenue", combined.revTotal, 3300000);
eq("combined expense", combined.expTotal, 1945000);
eq("combined net ties", combined.net, combined.revTotal - combined.expTotal);

// --- period windowing -----------------------------------------------------------
eq("outside window excluded", financialSummary(NP, NP_CATS, "2025-01-01", "2025-03-31").revTotal, 500000);
eq("empty period is zero",    financialSummary(NP, NP_CATS, "2024-01-01", "2024-12-31").net, 0);
eq("no entries",              financialSummary([], NP_CATS, "2025-01-01", "2025-12-31").revTotal, 0);

console.log(fail ? `\n${fail} FAILURES` : "\nall pass");
process.exit(fail ? 1 : 0);
