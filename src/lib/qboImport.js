// qboImport.js — read a QuickBooks Online export into register lines.
//
// QBO is the book of record a client is migrating OFF. The bank only ever knows
// cash; QBO holds the coded history, the accruals, and the years a return was
// filed on. So this has to bring the coding across, not just the amounts.
//
// Two export shapes cover almost everything QBO produces:
//
//   JOURNAL   *JournalNo,*JournalDate,*AccountName,*Debits,*Credits,Description,...
//             Double-entry. Each journal groups by number; one leg hits a bank
//             account, the other names the category.
//
//   REGISTER  Date, Transaction Type, Num, Name, Memo/Description, Account,
//             Split, Amount  — one row per transaction, already single-entry.
//             This is what "Transaction List by Date" and most General Ledger
//             exports produce.
//
// Everything here is pure: text in, rows and warnings out. Nothing is written
// anywhere. A caller decides what to do with what comes back.

// ---- csv ---------------------------------------------------------------------
// QBO quotes any field containing a comma and doubles embedded quotes.
export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", q = false;
  const src = String(text).replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(f => String(f).trim() !== ""));
}

const norm = s => String(s || "").replace(/^﻿/, "").replace(/\s+/g, " ").trim();
const key = s => norm(s).toLowerCase().replace(/^\*/, "");

// QBO writes negatives as -1,234.56 or (1,234.56); blank means zero.
export function money(v) {
  const s = norm(v).replace(/[$,]/g, "");
  if (!s) return 0;
  const neg = /^\(.*\)$/.test(s);
  const n = parseFloat(neg ? s.slice(1, -1) : s);
  if (!isFinite(n)) return NaN;
  return Math.round((neg ? -n : n) * 100);
}

// QBO dates come out as MM/DD/YYYY, and occasionally already ISO.
export function isoDate(v) {
  const s = norm(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  let [, mo, d, y] = m;
  if (y.length === 2) y = (+y > 70 ? "19" : "20") + y;
  return `${y}-${String(+mo).padStart(2, "0")}-${String(+d).padStart(2, "0")}`;
}

// ---- which shape is this? ------------------------------------------------------
export function detectFormat(header) {
  const h = header.map(key);
  const has = n => h.includes(n);
  if (has("journalno") && has("accountname") && (has("debits") || has("credits"))) return "journal";
  if (has("amount") && (has("account") || has("split"))) return "register";
  if (has("debit") && has("credit") && has("account")) return "trialbalance";
  return "unknown";
}

// An account is a bank account if the tenant says so; the name test is only a
// fallback for names we weren't given.
function bankMatcher(bankNames) {
  const set = new Set((bankNames || []).map(key));
  return name => {
    const k = key(name);
    if (set.has(k)) return true;
    if (set.size) {
      // tolerate "Checking (0449)" vs "Checking 0449" and last-four suffixes
      for (const b of set) {
        if (!b) continue;
        if (k.includes(b) || b.includes(k)) return true;
      }
    }
    return /\b(bank|checking|savings|cash on hand|undeposited)\b/.test(k);
  };
}

// ---- journal entries -----------------------------------------------------------
function parseJournal(rows, isBank) {
  const head = rows[0].map(key);
  const idx = n => head.indexOf(n);
  const cJe = idx("journalno"), cDate = idx("journaldate"), cAcct = idx("accountname");
  const cDr = idx("debits"), cCr = idx("credits"), cDesc = idx("description"), cName = idx("name");

  const groups = new Map();
  let lastJe = "", lastDate = null;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const je = norm(r[cJe]) || lastJe;
    lastJe = je;
    const d = isoDate(r[cDate]) || lastDate;
    if (isoDate(r[cDate])) lastDate = isoDate(r[cDate]);
    const g = groups.get(je) || { je, date: d, lines: [] };
    if (!g.date && d) g.date = d;
    g.lines.push({
      account: norm(r[cAcct]),
      dr: money(r[cDr]), cr: money(r[cCr]),
      desc: cDesc >= 0 ? norm(r[cDesc]) : "",
      name: cName >= 0 ? norm(r[cName]) : "",
    });
    groups.set(je, g);
  }

  const out = [], warnings = [];
  for (const g of groups.values()) {
    const dr = g.lines.reduce((s, l) => s + l.dr, 0);
    const cr = g.lines.reduce((s, l) => s + l.cr, 0);
    if (dr !== cr) {
      warnings.push({ level: "error", je: g.je, msg: `Journal ${g.je} does not balance: debits ${dr / 100} vs credits ${cr / 100}. Skipped.` });
      continue;
    }
    if (!g.lines.some(l => isBank(l.account))) {
      warnings.push({ level: "skip", je: g.je, msg: `Journal ${g.je} touches no bank account — an accrual or reclass entry. Not a register line.` });
      continue;
    }
    // A real QBO export puts a whole month under one journal number, written as
    // consecutive debit/credit pairs. So pair adjacent lines of equal, opposite
    // amount first; whatever will not pair is a genuine split.
    const lines = g.lines.slice();
    const used = new Array(lines.length).fill(false);
    const leftovers = [];
    for (let i = 0; i < lines.length; i++) {
      if (used[i]) continue;
      const a = lines[i];
      const amtA = a.dr || a.cr;
      let j = -1;
      for (let k = i + 1; k < lines.length; k++) {
        if (used[k]) continue;
        const b = lines[k];
        const amtB = b.dr || b.cr;
        // opposite sides, same amount, and exactly one of them is the bank leg
        if (amtA === amtB && !!a.dr !== !!b.dr && isBank(a.account) !== isBank(b.account)) { j = k; break; }
        // an intervening line of a different amount means this is a split, not a pair
        if (amtA !== amtB) continue;
      }
      if (j < 0) { leftovers.push(i); continue; }
      used[i] = used[j] = true;
      const b = isBank(a.account) ? a : lines[j];
      const o = isBank(a.account) ? lines[j] : a;
      out.push({
        date: g.date, direction: b.dr ? "in" : "out", amount_cents: b.dr || b.cr,
        description: b.desc || o.desc || o.account, category: o.account,
        bankAccount: b.account, ref: g.je, payee: b.name || o.name || "",
      });
    }
    // Anything that did not pair: import the bank legs, leave the category blank.
    const stray = leftovers.map(i => lines[i]).filter(l => isBank(l.account) && (l.dr || l.cr));
    stray.forEach(b => {
      out.push({
        date: g.date, direction: b.dr ? "in" : "out", amount_cents: b.dr || b.cr,
        description: b.desc || `Journal ${g.je}`, category: null,
        bankAccount: b.account, ref: g.je, payee: b.name || "", split: true,
      });
    });
    if (stray.length) {
      warnings.push({ level: "review", je: g.je, msg: `Journal ${g.je}: ${stray.length} line(s) split across several accounts — imported without a category so you can assign it.` });
    }
  }
  return { rows: out, warnings };
}

// ---- transaction list / general ledger ----------------------------------------
function parseRegister(rows, isBank) {
  const head = rows[0].map(key);
  const idx = (...names) => { for (const n of names) { const i = head.indexOf(n); if (i >= 0) return i; } return -1; };
  const cDate = idx("date", "transaction date");
  const cAmt = idx("amount");
  const cAcct = idx("account", "account name", "account full name");
  const cSplit = idx("split", "category", "account");
  const cName = idx("name", "payee", "customer", "vendor");
  const cMemo = idx("memo/description", "memo", "description");
  const cNum = idx("num", "no.", "ref no.", "number");
  const cType = idx("transaction type", "type");

  const out = [], warnings = [];
  // QBO general-ledger exports print the account once as a section header and
  // leave the column blank on the rows beneath it.
  let section = null;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const d = isoDate(r[cDate]);
    const rawAcct = cAcct >= 0 ? norm(r[cAcct]) : "";
    if (!d) {
      // a lone non-date row naming an account is a section header
      const label = r.map(norm).filter(Boolean);
      if (label.length === 1 && !money(label[0])) section = label[0];
      continue;
    }
    const amt = money(r[cAmt]);
    if (!isFinite(amt) || amt === 0) continue;
    const acct = rawAcct || section || "";
    const split = cSplit >= 0 && cSplit !== cAcct ? norm(r[cSplit]) : "";
    // Whichever side names a bank account is the register's account; the other is the category.
    let bankAccount = null, category = null;
    if (isBank(acct)) { bankAccount = acct; category = split || null; }
    else if (isBank(split)) { bankAccount = split; category = acct || null; }
    else {
      warnings.push({ level: "skip", msg: `${d} ${norm(r[cMemo]) || norm(r[cName]) || ""} — neither "${acct}" nor "${split}" is a bank account. Skipped.` });
      continue;
    }
    if (category && /^-?split-?$/i.test(category)) category = null;
    out.push({
      date: d,
      direction: amt > 0 ? "in" : "out",
      amount_cents: Math.abs(amt),
      description: norm(r[cMemo]) || norm(r[cName]) || (cType >= 0 ? norm(r[cType]) : "") || "TRANSACTION",
      category, bankAccount,
      ref: cNum >= 0 ? norm(r[cNum]) : "",
      payee: cName >= 0 ? norm(r[cName]) : "",
    });
  }
  return { rows: out, warnings };
}

// ---- entry point ---------------------------------------------------------------
export function parseQbo(text, opts = {}) {
  const grid = parseCsv(text);
  if (!grid.length) return { format: "empty", rows: [], warnings: [{ level: "error", msg: "Nothing in that file." }], summary: null };

  // QBO puts a company name and report title above the header row.
  let hi = 0;
  for (let i = 0; i < Math.min(grid.length, 12); i++) {
    if (detectFormat(grid[i]) !== "unknown") { hi = i; break; }
  }
  const grid2 = grid.slice(hi);
  const format = detectFormat(grid2[0]);
  if (format === "unknown") {
    return {
      format, rows: [], summary: null,
      warnings: [{ level: "error", msg: "Couldn't tell what this export is. Works with a Journal Entries export, or a Transaction List / General Ledger with Date, Amount and Account columns." }],
    };
  }
  if (format === "trialbalance") {
    return {
      format, rows: [], summary: null,
      warnings: [{ level: "error", msg: "That's a Trial Balance — balances, not transactions. It can set opening balances but has no register lines. Export a General Ledger or Transaction List for history." }],
    };
  }

  const isBank = bankMatcher(opts.bankAccounts);
  const { rows, warnings } = format === "journal" ? parseJournal(grid2, isBank) : parseRegister(grid2, isBank);

  const bad = rows.filter(r => !r.date || !isFinite(r.amount_cents) || r.amount_cents <= 0);
  const good = rows.filter(r => r.date && isFinite(r.amount_cents) && r.amount_cents > 0);
  if (bad.length) warnings.push({ level: "error", msg: `${bad.length} row(s) had no usable date or amount and were dropped.` });

  const dates = good.map(r => r.date).sort();
  const inCents = good.filter(r => r.direction === "in").reduce((s, r) => s + r.amount_cents, 0);
  const outCents = good.filter(r => r.direction === "out").reduce((s, r) => s + r.amount_cents, 0);
  const byAccount = {};
  good.forEach(r => { byAccount[r.bankAccount] = (byAccount[r.bankAccount] || 0) + 1; });
  const categories = [...new Set(good.map(r => r.category).filter(Boolean))].sort();

  return {
    format, rows: good, warnings,
    summary: {
      count: good.length,
      first: dates[0] || null,
      last: dates[dates.length - 1] || null,
      inCents, outCents, net: inCents - outCents,
      byAccount, categories,
      uncategorized: good.filter(r => !r.category).length,
    },
  };
}

// A stable identity for a row so re-importing the same export doesn't double it.
export function sourceKey(prefix, r, occurrence) {
  return `${prefix}:${r.date}:${r.direction}:${r.amount_cents}:${(r.description || "").slice(0, 60)}:${occurrence}`;
}
