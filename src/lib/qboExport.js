// Turn this register back into QuickBooks journal entries.
//
// The importer converts QBO's double-entry into single-entry lines; this does the
// reverse, so the work done here isn't stranded if Matt decides to stay on QBO. Each
// register line becomes one balanced two-line journal entry:
//
//   money in   →  DEBIT the bank account, CREDIT the income category
//   money out  →  DEBIT the expense category, CREDIT the bank account
//
// Uncoded money is NOT quietly dropped or lumped into a real account — it goes to
// QBO's own Uncategorized Income / Uncategorized Expense, which is where a bookkeeper
// would expect to find it and clear it. Transfers between the org's own accounts each
// export against their category, which nets to zero across the pair.

const CSV_HEADER = [
  "*JournalNo", "*JournalDate", "*AccountName", "*Debits", "*Credits",
  "Description", "Name", "Currency",
];

// A field is quoted only when it has to be — QBO accepts either, and unquoted is far
// easier to eyeball in a spreadsheet before importing.
function cell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function amount(cents) {
  return (Math.abs(cents) / 100).toFixed(2);
}

export function journalNo(entry, i) {
  const d = (entry.entry_date || "").replace(/-/g, "");
  return `CW-${d}-${String(i + 1).padStart(4, "0")}`;
}

export function toQboJournal(entries, accounts, opts) {
  const o = opts || {};
  const start = o.start, end = o.end;
  const byId = {};
  (accounts || []).forEach(a => { byId[a.id] = a; });

  const rows = (entries || [])
    .filter(e => !start || !end || (e.entry_date >= start && e.entry_date <= end))
    .filter(e => (e.amount_cents || 0) !== 0)
    .slice()
    .sort((a, b) => (a.entry_date || "").localeCompare(b.entry_date || "")
                 || String(a.id).localeCompare(String(b.id)));

  const lines = [CSV_HEADER.join(",")];
  const warnings = [];
  let exported = 0;

  rows.forEach((e, i) => {
    const acct = byId[e.account_id];
    if (!acct) { warnings.push({ level: "skip", msg: `Line dated ${e.entry_date} has no account — not exported.` }); return; }
    const bank = acct.name;
    const isIn = e.direction === "in";
    const category = (e.category && String(e.category).trim())
      || (isIn ? "Uncategorized Income" : "Uncategorized Expense");
    if (!e.category) warnings.push({ level: "review", msg: `${e.entry_date} ${amount(e.amount_cents)} had no category — sent to ${category}.` });

    const no = journalNo(e, i);
    const date = usDate(e.entry_date);
    const amt = amount(e.amount_cents);
    const desc = (e.description || "").replace(/\s+/g, " ").trim();
    // Debit line first, then credit — QBO reads the pair as one entry sharing a number.
    const debitAccount = isIn ? bank : category;
    const creditAccount = isIn ? category : bank;
    lines.push([no, date, debitAccount, amt, "", desc, "", "USD"].map(cell).join(","));
    lines.push([no, "", creditAccount, "", amt, desc, "", "USD"].map(cell).join(","));
    exported++;
  });

  return { csv: lines.join("\n") + "\n", count: exported, warnings };
}

export function usDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "";
  const [y, m, d] = iso.split("-");
  return `${+m}/${+d}/${y}`;
}
