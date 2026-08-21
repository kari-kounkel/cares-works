// Pull the pure function out of the JSX source without a React runtime.
import fs from 'fs';
const src = fs.readFileSync('src/pages/LedgerWorkspace.jsx', 'utf8');
const start = src.indexOf('export function summarizeActivities');
const end = src.indexOf('// Map an invoices row into the shape');
const code = src.slice(start, end).replace('export function', 'function');
const summarizeActivities = new Function(code + '; return summarizeActivities;')();

const CATS = [
  { name: 'Donations — individuals',            kind: 'income',  func_class: 'contributed' },
  { name: 'Corporate & foundation grants',      kind: 'income',  func_class: 'contributed' },
  { name: 'Medicaid — peer support services',   kind: 'income',  func_class: 'earned' },
  { name: 'Program revenue',                    kind: 'income',  func_class: 'earned' },
  { name: 'Mystery income',                     kind: 'income',  func_class: null },
  { name: 'Peer support specialist wages',      kind: 'expense', func_class: 'program' },
  { name: 'Participant transportation',         kind: 'expense', func_class: 'program' },
  { name: 'Accounting fees',                    kind: 'expense', func_class: 'mg' },
  { name: 'Fundraising fees',                   kind: 'expense', func_class: 'fundraising' },
  { name: 'Mystery expense',                    kind: 'expense', func_class: null },
];
const E = (d, dir, amt, cat) => ({ entry_date: d, direction: dir, amount_cents: amt, category: cat });

let fail = 0;
const eq = (label, got, want) => {
  const ok = got === want;
  if (!ok) { fail++; console.log(`FAIL ${label}: got ${got}, want ${want}`); }
  else console.log(`ok   ${label} = ${got}`);
};

// --- 1. a normal nonprofit year -------------------------------------------------
const entries = [
  E('2026-01-15','in', 500000,'Donations — individuals'),
  E('2026-03-01','in', 250000,'Donations — individuals'),
  E('2026-04-01','in',2000000,'Corporate & foundation grants'),
  E('2026-02-10','in',3500000,'Medicaid — peer support services'),
  E('2026-05-10','in',1500000,'Medicaid — peer support services'),
  E('2026-06-01','in', 100000,'Program revenue'),
  E('2026-06-02','in',  50000,'Mystery income'),
  E('2026-02-15','out',4000000,'Peer support specialist wages'),
  E('2026-03-15','out', 120000,'Participant transportation'),
  E('2026-04-15','out', 300000,'Accounting fees'),
  E('2026-05-15','out', 200000,'Fundraising fees'),
  E('2026-05-16','out',  75000,'Mystery expense'),
  E('2026-06-20','out',  60000, null),           // uncoded
  E('2026-06-21','in',   40000, null),           // uncoded
  E('2025-12-31','in',9999999,'Donations — individuals'),   // prior year, must be excluded
  E('2027-01-01','out',8888888,'Accounting fees'),          // next year, must be excluded
];
const r = summarizeActivities(entries, CATS, '2026-01-01', '2026-12-31');
eq('contributed',        r.revenue.contributed['Donations — individuals'] + r.revenue.contributed['Corporate & foundation grants'], 2750000);
eq('earned',             r.revenue.earned['Medicaid — peer support services'] + r.revenue.earned['Program revenue'], 5100000);
eq('unclassified income',r.revenue.unclassified['Mystery income'], 50000);
eq('revTotal',           r.revTotal, 2750000 + 5100000 + 50000);
eq('program expense',    r.expense.program['Peer support specialist wages'] + r.expense.program['Participant transportation'], 4120000);
eq('mg expense',         r.expense.mg['Accounting fees'], 300000);
eq('fundraising',        r.expense.fundraising['Fundraising fees'], 200000);
eq('unclassified exp',   r.expense.unclassified['Mystery expense'], 75000);
eq('expTotal',           r.expTotal, 4120000 + 300000 + 200000 + 75000);
eq('uncoded (excluded)', r.uncoded, 100000);
eq('change in net assets', r.change, r.revTotal - r.expTotal);

// --- 2. refunds net against their own line, they don't inflate the other side ----
const refund = summarizeActivities([
  E('2026-01-10','in', 500000,'Donations — individuals'),
  E('2026-02-10','out',100000,'Donations — individuals'),   // returned a gift
  E('2026-03-10','out',300000,'Accounting fees'),
  E('2026-04-10','in',  50000,'Accounting fees'),           // vendor rebate
], CATS, '2026-01-01','2026-12-31');
eq('gift net of refund',   refund.revenue.contributed['Donations — individuals'], 400000);
eq('expense net of rebate',refund.expense.mg['Accounting fees'], 250000);
eq('refund revTotal',      refund.revTotal, 400000);
eq('refund expTotal',      refund.expTotal, 250000);

// --- 3. boundaries are inclusive on both ends -----------------------------------
const bounds = summarizeActivities([
  E('2026-01-01','in',100,'Donations — individuals'),
  E('2026-12-31','in',100,'Donations — individuals'),
  E('2025-12-31','in',999,'Donations — individuals'),
  E('2027-01-01','in',999,'Donations — individuals'),
], CATS, '2026-01-01','2026-12-31');
eq('inclusive boundaries', bounds.revTotal, 200);

// --- 4. empty and malformed input must not throw --------------------------------
const empty = summarizeActivities([], [], '2026-01-01','2026-12-31');
eq('empty revTotal', empty.revTotal, 0);
eq('empty change',   empty.change, 0);
const junk = summarizeActivities([{},{entry_date:'2026-05-05'},{entry_date:'2026-05-05',direction:'in'}], CATS, '2026-01-01','2026-12-31');
eq('junk rows land in uncoded, no throw', junk.uncoded, 0);

// --- 5. transfers are neither revenue, expense, nor uncoded ---------------------
const CATS2 = CATS.concat([{ name: 'Transfer between our accounts', kind: 'expense', func_class: 'transfer' }]);
const xfer = summarizeActivities([
  E('2026-01-10','in', 500000,'Donations — individuals'),
  E('2026-02-10','in', 175000,'Transfer between our accounts'),   // in from our other account
  E('2026-02-10','out',175000,'Transfer between our accounts'),   // out to our other account
  E('2026-03-10','out',300000,'Accounting fees'),
], CATS2, '2026-01-01','2026-12-31');
eq('transfer not in revenue', xfer.revTotal, 500000);
eq('transfer not in expense', xfer.expTotal, 300000);
eq('transfer not in uncoded', xfer.uncoded, 0);
eq('transfer absent from buckets',
   Object.keys(xfer.revenue.contributed).length + Object.keys(xfer.expense.mg).length, 2);

console.log(fail ? `\n${fail} FAILURES` : '\nall pass');
process.exit(fail ? 1 : 0);
