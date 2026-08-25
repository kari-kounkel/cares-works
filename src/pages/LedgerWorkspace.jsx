// LedgerWorkspace.jsx — the entity-driven bookkeeping workspace.
// NOTHING about the entity is hardcoded: name, users, accounts, and data all
// come from the `entity` object (in production, the entity's data record).
// ProGraphics is just the first tenant — SAMPLE_ENTITY seeds a clickable preview.
//
// Layout mirrors the NLIC org shell: left nav + big work area, blue-dominant neon.
// Betty lands on her stenographer Notebook; Dave lands on Invoices.

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";
import QboImport from "../components/QboImport";
import { N } from "../design/neon";

const FONTS = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&family=Caveat:wght@500;600&display=swap";

// ---- Sample entity (replaced by real data per tenant) -----------------------
export const SAMPLE_ENTITY = {
  name: "ProGraphics Enterprises Inc.",
  short: "ProGraphics",
  fiscalYearEnd: "March 31",
  today: "Wednesday, April 22, 2026",
  currentUser: "Betty",
  users: [
    { name: "Dave", initials: "D", role: "Invoicing", lands: "invoices" },
    { name: "Betty", initials: "B", role: "Books & notebook", lands: "notebook" },
  ],
  accounts: {
    banks: [
      { name: "US Bank checking", balance: 14208.0 },
      { name: "CorTrust checking", balance: 3940.0 },
    ],
    cards: [
      { name: "Citi card", balance: -2180.0 },
      { name: "US Bank card", balance: -1472.0 },
      { name: "CorTrust card", balance: -540.0 },
      { name: "Capital One card", balance: -905.0 },
    ],
    loans: [{ name: "Equipment loan", balance: -18400.0 }],
  },
  notebook: [
    { id: "t1", date: "4/22", payee: "Vinyl supplier — material restock", amount: 847.2, source: "US Bank card", cleared: null, category: "Materials & supplies" },
    { id: "t2", date: "4/22", payee: "Holiday Station #214 — fuel", amount: 68.4, source: "US Bank card", cleared: null, category: "Vehicle & fuel" },
    { id: "t3", date: "4/21", payee: "Amazon — packing tape", amount: 34.19, source: "CorTrust card", cleared: { bank: "CorTrust", date: "Apr 21" } },
    { id: "t4", date: "4/21", payee: "Constant Contact — monthly", amount: 45.0, source: "Citi card", cleared: null },
    { id: "t5", date: "4/21", payee: "Stouse — banner blanks", amount: 312.66, source: "Citi card", cleared: null },
    { id: "t6", date: "4/20", payee: "USPS — priority shipping", amount: 18.55, source: "CorTrust checking", cleared: null },
    { id: "t7", date: "4/20", payee: "SignWarehouse — laminate roll", amount: 129.0, source: "US Bank card", cleared: { bank: "US Bank", date: "Apr 21" } },
    { id: "t8", date: "4/19", payee: "Menards — shop supplies", amount: 42.96, source: "Capital One card", cleared: null },
  ],
  invoices: [
    { id: "i1", customer: "Anderson Lutheran", item: "Vinyl decals", amount: 485.0, tax: "Exempt", taxAmt: 0, status: "Paid", date: "Apr 22" },
    { id: "i2", customer: "Thompson Family Reunion", item: "Event shirts", amount: 214.3, tax: "Taxable", taxAmt: 14.3, status: "Viewed", date: "Apr 21" },
    { id: "i3", customer: "St. Paul Print Co", item: "Promo magnets", amount: 1200.0, tax: "Exempt", taxAmt: 0, status: "Sent", date: "Apr 19" },
    { id: "i4", customer: "City of Richfield", item: "Park banner", amount: 895.0, tax: "Exempt", taxAmt: 0, status: "Draft", date: "Apr 18" },
  ],
  salesTax: { quarter: "Q1 · Apr – Jun", taxable: 2140.0, exempt: 8530.0, collected: 147.13 },
  // Plain-language buckets the humans see. Each maps to the chart of accounts behind the scenes —
  // they pick "Materials & supplies," never "Account 5010 · COGS."
  categories: ["Materials & supplies", "Shipping & postage", "Software & subscriptions", "Vehicle & fuel", "Equipment", "Office supplies", "Bank & card fees", "Advertising", "Meals", "Owner draw"],
  reports: [
    { name: "Profit & Loss", sub: "Gross income and net profit" },
    { name: "Expense detail by category", sub: "Matched to your chart of accounts" },
    { name: "Sales tax summary", sub: "Taxable, exempt, and tax collected" },
    { name: "Income by source", sub: "Card, check, cash — reconciled" },
    { name: "AR & AP snapshot", sub: "Who owes you, who you owe" },
  ],
  changelog: [
    { date: "Aug 2, 2026", items: ["First look — your notebook, invoices, and sales tax are live on sample data.", "Balances now show at the top of every screen."] },
    { date: "Aug 1, 2026", items: ["Set up your ProGraphics workspace."] },
  ],
};

// Empty-but-named entity — proves the tool is data-driven before any data is loaded.
function connectStub(name, short, user, initials) {
  return {
    name, short, currentUser: user, fiscalYearEnd: "", today: "",
    users: [{ name: user, initials, role: "Owner", lands: "notebook" }],
    accounts: { banks: [], cards: [], loans: [] },
    notebook: [], invoices: [], reports: [],
    salesTax: { quarter: "", taxable: 0, exempt: 0, collected: 0 },
    changelog: [{ date: "Aug 2, 2026", items: [`Workspace created — connect ${short}'s accounts to fill it.`] }],
    needsConnect: true,
  };
}

// The tenant registry. Same machine, different data. Add a row, get a workspace.
export const ENTITIES = {
  prographics: SAMPLE_ENTITY,
  amy: connectStub("Amy's Cherished Events", "Amy's Cherished Events", "Amy", "A"),
  matt: connectStub("Social Services of Minnesota", "Social Services of MN", "Matt", "M"),
};

const SECTIONS = [
  { key: "orders", label: "New Orders" },
  { key: "invoices", label: "Invoices" },
  { key: "purchaseorders", label: "Purchase Orders" },
  { key: "salestax", label: "Sales tax" },
  { key: "notebook", label: "Notebook" },
  { key: "giving", label: "Donations" },
  { key: "bills", label: "Bills" },
  { key: "reports", label: "Reports" },
  { key: "documents", label: "Documents" },
  { key: "admin", label: "Admin" },
];

const BUILD_PROGRESS = [
  { label: "Purchase Orders", items: [
    ["Take an order — customer + items", "done"],
    ["Optional PO to a vendor", "done"],
    ["Email the PO to the vendor", "done"],
    ["Packing slip — items only, no prices", "done"],
    ["Convert PO → invoice", "done"],
  ] },
  { label: "Invoicing", items: [
    ["Branded invoice — logo, remit, ACH, tax", "done"],
    ["Send link + Viewed tracking", "done"],
    ["Email invoice / paid receipt (BCC sender)", "done"],
    ["Partial / down payments + record checks", "done"],
    ["Packing slip + roomier card layout", "done"],
  ] },
  { label: "Bank & card setup", items: [
    ["Bank + credit-card accounts", "done"],
    ["Real transactions imported (CSV)", "done"],
    ["Upload transactions per account", "done"],
    ["Plaid — connect a bank / card", "done"],
    ["Today's live balances at the top", "done"],
  ] },
  { label: "Notebook", items: [
    ["Bank / card lines to reconcile", "done"],
    ["Chart-of-accounts + payee memory", "done"],
    ["Customer payments link to invoices", "done"],
    ["Pay a card — transfer, not expense", "done"],
    ["Hand-enter a check / cash / deposit", "done"],
    ["Cleared-items history", "done"],
  ] },
  { label: "Reconciliation", items: [
    ["Reconcile to a statement (date + balance)", "done"],
    ["Off-balance → Suspense, never silent", "done"],
    ["Attach the statement PDF / CSV", "done"],
    ["Reconciliation history + printable report", "done"],
    ["All cards + CorTrust reconciled", "done"],
  ] },
  { label: "Bills", items: [
    ["Record a vendor bill", "done"],
    ["Pay a bill by printed check", "done"],
    ["Check lands in the register", "done"],
  ] },
  { label: "Card payoff plan", items: [
    ["Payoff order — avalanche / snowball", "done"],
    ["Pay-now amounts (waterfall the budget)", "done"],
    ["Credit line + utilization", "done"],
    ["0% promo end date", "done"],
  ] },
  { label: "Lists — customers, vendors, items", items: [
    ["Customers — add / edit full info", "done"],
    ["Vendors — payment history + merge dupes", "done"],
    ["Items & services", "done"],
  ] },
  { label: "Team messages", items: [
    ["Message board (Dave ↔ Betty)", "done"],
    ["Replies + pulsing new-message banner", "done"],
    ["Archive of handled notes", "done"],
  ] },
  { label: "Documents", items: [
    ["Store statements & certificates", "done"],
    ["Category dashboard", "done"],
  ] },
  { label: "Sales tax", items: [
    ["Auto-tally taxable / exempt / collected", "done"],
    ["Period picker (month / quarter / year)", "done"],
    ["Printable MN filing worksheet", "done"],
  ] },
  { label: "Reports", items: [
    ["Prior-year P&L (from filed return)", "done"],
    ["Profit & Loss — from April 1", "todo"],
    ["Opening balances / trial balance", "done"],
    ["Balance sheet — fiscal year", "todo"],
    ["Expense detail by category", "todo"],
  ] },
  { label: "Admin panel", items: [
    ["Bank reconciliations page", "done"],
    ["Branding / logo", "done"],
    ["Users & roles", "wip"],
  ] },
];

// Roll a group's sub-items up to one status: done (all), todo (none), else wip.
function progStatus(items) {
  const d = items.filter(i => i[1] === "done").length;
  if (d === items.length) return "done";
  if (d === 0 && !items.some(i => i[1] === "wip")) return "todo";
  return "wip";
}

const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank / working capital" },
  { value: "credit_card", label: "Credit card" },
  { value: "loan", label: "Loan / mortgage" },
  { value: "liability", label: "Other liability / payable" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other asset" },
];

const STATUS_COLOR = {
  Paid: N.green, Partial: "#eab308", Viewed: N.blue, Sent: N.blueHot, Draft: N.muted, Void: N.mutedLite,
  "In progress": "#eab308",
};

// "Still being polished" accent — Kari wants checkboxes/checks amber, not green,
// while the tool is being finished ("nothing is working perfectly yet").
const AMBER = "#eab308";

function money(n) {
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? "−$" : "$") + s;
}

// Dollar amount → words for the check line ("One thousand two hundred and 34/100").
function amountToWords(dollars) {
  const whole = Math.floor(Math.abs(dollars));
  const cents = Math.round((Math.abs(dollars) - whole) * 100);
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const three = num => {
    let s = "";
    if (num >= 100) { s += ones[Math.floor(num / 100)] + " hundred"; num %= 100; if (num) s += " "; }
    if (num >= 20) { s += tens[Math.floor(num / 10)]; num %= 10; if (num) s += "-" + ones[num]; }
    else if (num > 0) s += ones[num];
    return s;
  };
  let w = "", rem = whole;
  for (const [name, val] of [["million", 1e6], ["thousand", 1e3]]) {
    if (rem >= val) { w += three(Math.floor(rem / val)) + " " + name + " "; rem %= val; }
  }
  if (rem > 0) w += three(rem);
  w = (w.trim() || "zero");
  return w.charAt(0).toUpperCase() + w.slice(1) + " and " + String(cents).padStart(2, "0") + "/100";
}

// Tiny inline-SVG icon set (outline, inherits color via stroke=currentColor).
function Ico({ name, size = 18 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "giving": return <svg {...p}><path d="M20 12v9H4v-9" /><path d="M2 7h20v5H2z" /><path d="M12 21V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z" /></svg>;
    case "notebook": return <svg {...p}><path d="M6 4h11a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2V4Z" /><path d="M6 4a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2" /><path d="M10 8h6M10 12h6" /></svg>;
    case "invoices": return <svg {...p}><path d="M6 3h9l3 3v15H6Z" /><path d="M15 3v3h3" /><path d="M9 12h6M9 16h4" /></svg>;
    case "bills": return <svg {...p}><path d="M5 3l1.5 1.5L8 3l1.5 1.5L11 3l1.5 1.5L14 3v18l-1.5-1.5L11 21l-1.5-1.5L8 21l-1.5-1.5L5 21Z" /><path d="M8 8h4M8 12h3" /></svg>;
    case "salestax": return <svg {...p}><circle cx="8" cy="8" r="1.6" /><circle cx="16" cy="16" r="1.6" /><path d="M6 18 18 6" /></svg>;
    case "reports": return <svg {...p}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></svg>;
    case "documents": return <svg {...p}><path d="M4 5a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /></svg>;
    case "orders": return <svg {...p}><path d="M6 3h9l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>;
    case "purchaseorders": return <svg {...p}><path d="M4 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h7.4a1.5 1.5 0 0 0 1.5-1.2L21.5 8H7" /><circle cx="10" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /></svg>;
    case "admin": return <svg {...p}><path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7Z" /><path d="M9 12l2 2 4-4" /></svg>;
    case "items": return <svg {...p}><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 3 12V4h8a2 2 0 0 1 1.4.6l8.2 8.2a2 2 0 0 1 0 2.6Z" /><circle cx="7.5" cy="7.5" r="1.2" /></svg>;
    case "chart": return <svg {...p}><path d="M4 5h16M4 12h16M4 19h16" /><path d="M8 3v4M14 10v4M10 17v4" /></svg>;
    case "lists": return <svg {...p}><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></svg>;
    case "accounts": return <svg {...p}><path d="M3 10 12 4l9 6" /><path d="M5 10v8M19 10v8M9 10v8M15 10v8M3 20h18" /></svg>;
    case "customers": return <svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3 3 0 0 1 0 5.6M17.5 20a5.5 5.5 0 0 0-3-4.9" /></svg>;
    case "vendors": return <svg {...p}><path d="M3 7h11v9H3Z" /><path d="M14 10h4l3 3v3h-7Z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>;
    case "clip": return <svg {...p}><path d="M21 10 11.5 19.5a4 4 0 0 1-6-6L14 5a2.5 2.5 0 0 1 4 4l-8 8a1 1 0 0 1-1.5-1.5L16 8" /></svg>;
    case "check": return <svg {...p}><path d="M5 12l5 5L20 6" /></svg>;
    case "search": return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
    case "bank": return <svg {...p}><path d="M3 10 12 4l9 6" /><path d="M5 10v8M19 10v8M9 10v8M15 10v8M3 20h18" /></svg>;
    case "history": return <svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4M12 8v4l3 2" /></svg>;
    case "sparkle": return <svg {...p}><path d="M12 3v6M12 15v6M3 12h6M15 12h6" /></svg>;
    default: return null;
  }
}

const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Map live Supabase rows (ledger_orgs / ledger_accounts / ledger_categories / ledger_entries)
// into the same entity shape the workspace renders. No new data model — just a view.
function buildLiveEntity(org, accounts, categories, entries, session) {
  const email = session?.user?.email || "";
  const emailLc = email.toLowerCase();
  const userName = session?.user?.user_metadata?.name
    || (emailLc.includes("races61") ? "Betty Erickson"
      : emailLc.includes("prographics") ? "Dave Erickson"
      : (email ? email.split("@")[0] : "You"));

  const bal = {};
  accounts.forEach(a => { bal[a.id] = a.opening_balance_cents || 0; });
  entries.forEach(e => {
    if (e.match_status === "noted") return; // hidden / set-aside lines are not part of the live balance
    if (e.account_id && e.account_id in bal) bal[e.account_id] += (e.direction === "in" ? 1 : -1) * (e.amount_cents || 0);
  });
  const acctName = {};
  accounts.forEach(a => { acctName[a.id] = a.name; });
  const mk = a => ({ name: a.name, balance: (bal[a.id] || 0) / 100 });

  const norm = s => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
  const memory = {};
  entries.forEach(e => { if (e.category) memory[norm(e.description)] = e.category; });

  const shortDate = d => { const p = (d || "").split("-"); return p.length === 3 ? `${+p[1]}/${+p[2]}` : d; };
  const notebook = entries
    .filter(e => !e.match_status)
    .map(e => ({
      id: e.id,
      accountId: e.account_id || null,
      direction: e.direction || "out",
      date: shortDate(e.entry_date),
      dateISO: e.entry_date,
      payee: e.description,
      amount: (e.amount_cents || 0) / 100,
      source: e.account_id ? acctName[e.account_id] : "—",
      cleared: null,
      category: e.category || null,
      suggested: !e.category && memory[norm(e.description)] ? memory[norm(e.description)] : null,
      invoiceId: e.invoice_id || null,
      paymentId: e.payment_id || null,
    }));

  const short = org.name.length > 16 ? org.name.split(" ")[0] : org.name;
  return {
    name: org.name,
    short,
    remitAddress: org.remit_address || "",
    customerNote: org.customer_note || "",
    ach: { bank: org.ach_bank_name || "", routing: org.ach_routing || "", account: org.ach_account || "", notify: org.ach_notify || "" },
    nextCheckNumber: org.next_check_number || 1001,
    nextPoNumber: org.next_po_number || 2133,
    nextInvoiceNumber: org.next_invoice_number || 1001,
    logoUrl: org.logo_url || "",
    brandColor: org.brand_color || "#0080ff",
    currentUser: userName,
    fiscalYearEnd: org.fiscal_year_end_month ? `${MONTHS[org.fiscal_year_end_month]} ${org.fiscal_year_end_day || ""}`.trim() : "",
    fyEndMonth: org.fiscal_year_end_month || 12,
    fyEndDay: org.fiscal_year_end_day || 31,
    today: new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    users: [{ name: userName, initials: (userName[0] || "?").toUpperCase(), role: "", lands: "notebook" }],
    accounts: {
      banks: accounts.filter(a => a.account_type === "bank").map(mk),
      cards: accounts.filter(a => a.account_type === "credit_card").map(mk),
      loans: accounts.filter(a => a.account_type === "loan").map(mk),
    },
    notebook,
    invoices: [],
    reports: SAMPLE_ENTITY.reports,
    salesTax: { quarter: "", taxable: 0, exempt: 0, collected: 0 },
    accountList: accounts.map(a => ({ id: a.id, name: a.name, type: a.account_type })),
    categories: categories.map(c => c.name),
    changelog: [
      { date: "Aug 4, 2026", items: ["You can now write a line straight into the notebook — a check, cash, or a deposit the bank feed won't catch. Look for “+ Add a line.”", "The notebook now shows money in as well as money out."] },
      { date: "Aug 2, 2026", items: ["Your ProGraphics workspace is live on your real ledger data.", "Balances, notebook, and categories all load from your account."] },
    ],
  };
}


// Summarise a window of entries into the buckets a Statement of Activities needs.
// Pure and exported so the arithmetic can be tested without rendering anything:
// given entries + the chart of accounts, it returns what goes on each line.
//   revenue.contributed / .earned / .unclassified — { categoryName: cents }
//   expense.program / .mg / .fundraising / .unclassified — { categoryName: cents }
//   uncoded — money in the window with no usable category; deliberately NOT in any
//   total, because silently folding it in is how a statement stops tying to the books.
// Categories classed "transfer" are excluded outright: money moved between the
// org's own accounts is neither revenue nor expense. Booking those as contributions
// is exactly the error that inflates a nonprofit's public support.
export function summarizeActivities(entries, categories, start, end) {
  const meta = {};
  (categories || []).forEach(c => { meta[c.name] = { kind: c.kind, fc: c.func_class || null }; });

  const revenue = { contributed: {}, earned: {}, unclassified: {} };
  const expense = { program: {}, mg: {}, fundraising: {}, unclassified: {} };
  let uncoded = 0;

  (entries || []).forEach(e => {
    if (!e.entry_date || e.entry_date < start || e.entry_date > end) return;
    const amt = e.amount_cents || 0;
    const m = e.category ? meta[e.category] : null;
    if (!e.category || !m) { uncoded += amt; return; }
    // Moving money between the org's own accounts is not revenue and not expense.
    // It nets to zero across the two accounts, so it belongs in neither total — and
    // not in `uncoded` either, because it IS coded; it just doesn't hit this statement.
    if (m.fc === "transfer") return;
    if (e.direction === "in" && m.kind === "income") {
      const b = m.fc === "contributed" ? "contributed" : m.fc === "earned" ? "earned" : "unclassified";
      revenue[b][e.category] = (revenue[b][e.category] || 0) + amt;
    } else if (e.direction === "out" && m.kind !== "income") {
      const b = ["program", "mg", "fundraising"].includes(m.fc) ? m.fc : "unclassified";
      expense[b][e.category] = (expense[b][e.category] || 0) + amt;
    } else {
      // Income account paid OUT (a refunded gift) or expense account received IN (a
      // vendor rebate). Real, and it belongs against its own line, not in a total it
      // would inflate — so it nets against that category.
      if (m.kind === "income") {
        const b = m.fc === "contributed" ? "contributed" : m.fc === "earned" ? "earned" : "unclassified";
        revenue[b][e.category] = (revenue[b][e.category] || 0) - amt;
      } else {
        const b = ["program", "mg", "fundraising"].includes(m.fc) ? m.fc : "unclassified";
        expense[b][e.category] = (expense[b][e.category] || 0) - amt;
      }
    }
  });

  const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
  const revTotal = sum(revenue.contributed) + sum(revenue.earned) + sum(revenue.unclassified);
  const expTotal = sum(expense.program) + sum(expense.mg) + sum(expense.fundraising) + sum(expense.unclassified);
  return { revenue, expense, uncoded, revTotal, expTotal, change: revTotal - expTotal };
}

// House rule (Kari): customer/vendor names carry no commas or periods — keep apostrophes & hyphens.
function cleanName(s) { return (s || "").replace(/[.,]/g, "").replace(/\s{2,}/g, " ").trim(); }

// Map an invoices row into the shape the Invoices tab renders.
function mapInvoice(v) {
  const items = Array.isArray(v.line_items) ? v.line_items : [];
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "Draft");
  const d = v.issue_date ? new Date(v.issue_date + "T00:00:00") : null;
  const numMatch = (items.map(l => l.desc).join(" ").match(/#(\d+)/) || [])[1];
  return {
    id: v.id,
    token: v.public_token,
    docType: v.doc_type || "invoice",
    vendor: v.vendor_name || "",
    poNumber: v.po_number || "",
    number: v.invoice_number || numMatch || "",
    customer: v.customer_name || "—",
    email: v.customer_email || "",
    item: items.map(l => l.desc).filter(Boolean).join(", ") || "—",
    lines: items,
    amount: (v.total_cents || 0) / 100,
    subtotal: (v.subtotal_cents || 0) / 100,
    tax: v.tax_status || "Exempt",
    taxAmt: (v.tax_cents || 0) / 100,
    status: v.status === "in_progress" ? "In progress" : v.status === "po_sent" ? "PO sent" : v.status === "invoiced" ? "Invoiced" : cap(v.status),
    date: d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
    issueDate: v.issue_date || "",
    shipAddress: v.ship_address || "",
    createdAt: v.created_at || "", sentAt: v.sent_at || "", viewedAt: v.viewed_at || "", paidAt: v.paid_at || "",
  };
}

// Fold an invoice's payment records into its display shape: how much has been
// paid, what's left, and a Partial/Paid status derived from the money in.
function attachPayments(m, payments) {
  const totalCents = Math.round((m.amount || 0) * 100);
  const summed = payments.reduce((s, p) => s + (p.amount_cents || 0), 0);
  // A quick "Mark paid" (status Paid, no check recorded) still counts as paid in full.
  const paidCents = payments.length ? summed : (m.status === "Paid" ? totalCents : 0);
  const balanceCents = Math.max(0, totalCents - paidCents);
  let status = m.status;
  // "In progress" is Dave's own flag and wins over payment-derived status — a down
  // payment on an in-progress job still reads "In progress" (the balance shows the deposit).
  if (m.status !== "Void" && m.docType !== "order" && m.status !== "In progress") {
    if (totalCents > 0 && paidCents >= totalCents) status = "Paid";
    else if (paidCents > 0) status = "Partial";
  }
  return { ...m, payments, paidCents, balanceCents, paid: paidCents / 100, balance: balanceCents / 100, status };
}

// Minimal RFC-4180-ish CSV parser (handles quotes, commas, escaped quotes, CRLF).
function parseCSV(text) {
  const rows = []; let field = "", row = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(x => (x || "").trim() !== ""));
}
// Parse a money string ("$1,234.56", "(45.00)" = negative) → number or null.
function parseMoney(s) {
  s = String(s == null ? "" : s).trim();
  if (!s) return null;
  const neg = /^\(.*\)$/.test(s) || /-\s*$/.test(s) || /^\s*-/.test(s);
  const n = parseFloat(s.replace(/[()]/g, "").replace(/[^0-9.\-]/g, ""));
  if (isNaN(n)) return null;
  return neg && n > 0 ? -n : n;
}
// Parse a date cell in common bank formats → "YYYY-MM-DD" or null.
function parseStmtDate(s) {
  s = String(s == null ? "" : s).trim();
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) { let [, mm, dd, yy] = m; if (yy.length === 2) yy = "20" + yy; return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`; }
  m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) { let [, y, mm, dd] = m; return `${y}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`; }
  return null;
}

function fmtPay(p) {
  const label = p.method === "check" ? (p.check_number ? `Check #${p.check_number}` : "Check")
    : p.method === "ach" ? "ACH" : p.method === "cash" ? "Cash" : p.method === "card" ? "Card" : p.method === "credit" ? "Account credit" : "Payment";
  const d = p.paid_on ? String(p.paid_on).split("-") : null;
  const date = d && d.length === 3 ? `${+d[1]}/${+d[2]}/${d[0].slice(2)}` : "";
  return `${label}${date ? " · " + date : ""}`;
}

export default function LedgerWorkspace({ entity: propEntity, entityKey, orgId, session, config }) {
  const [dbEntity, setDbEntity] = useState(null);
  const [testMode, setTestMode] = useState(false); // sandbox: show real data but block every save
  const baseEntity = dbEntity || propEntity || ENTITIES[entityKey] || SAMPLE_ENTITY;
  // `config` is the tenant's PROFILE — which sections they get, what those sections are
  // called, whether their ledger reads as a notebook or a register, their own punch list.
  // It layers on top of whatever the data source produced, so nothing here is per-tenant code.
  // Memoised because a fresh object every render would retrigger the [entity] effects forever.
  const entity = useMemo(() => (config ? { ...baseEntity, ...config } : baseEntity), [baseEntity, config]);
  const live = !!dbEntity && !testMode; // test mode makes every write a no-op
  // Accounts available for the "Pymt by" picker and card payments. Live has real ids; sample uses names.
  // Always ordered: banks first, then cards, then loans/etc — and alphabetical within each type.
  const ACCT_TYPE_ORDER = { bank: 0, credit_card: 1, loan: 2, cash: 3, other: 4 };
  const accountList = (entity.accountList || [
    ...(entity.accounts?.banks || []).map(a => ({ id: a.name, name: a.name, type: "bank" })),
    ...(entity.accounts?.cards || []).map(a => ({ id: a.name, name: a.name, type: "credit_card" })),
    ...(entity.accounts?.loans || []).map(a => ({ id: a.name, name: a.name, type: "loan" })),
  ]).slice().sort((a, b) =>
    (ACCT_TYPE_ORDER[a.type] ?? 9) - (ACCT_TYPE_ORDER[b.type] ?? 9) || (a.name || "").localeCompare(b.name || "")
  );
  // Card payments come out of the operating checking account by default (CorTrust for ProGraphics).
  const bankAccts = accountList.filter(a => a.type === "bank");
  const defaultBankId = (bankAccts.find(a => /check/i.test(a.name)) || bankAccts[0] || {}).id || "";

  const invUser = (session?.user?.email || "").toLowerCase().includes("prographicsinc");
  const [section, setSection] = useState(invUser ? "orders" : (entity.users?.find(u => u.name === entity.currentUser)?.lands || "notebook"));
  const [items, setItems] = useState(entity.notebook);
  const [cleared, setCleared] = useState([]);
  const [showCleared, setShowCleared] = useState(false);
  const [whatsNew, setWhatsNew] = useState(false);
  const [query, setQuery] = useState("");
  const [catOpen, setCatOpen] = useState(null);
  const [acctOpen, setAcctOpen] = useState(null);
  const [showPayCard, setShowPayCard] = useState(false);
  const blankPay = { amount: "", fromId: "", toId: "", date: new Date().toISOString().slice(0, 10) };
  const [payDraft, setPayDraft] = useState(blankPay);
  const [showAddLine, setShowAddLine] = useState(false);
  const [lastAcctId, setLastAcctId] = useState(() => { try { return localStorage.getItem("cw_lastAcct") || ""; } catch (e) { return ""; } });
  const [bankSeenAt, setBankSeenAt] = useState(() => { try { return localStorage.getItem("cw_bankSeen") || ""; } catch (e) { return ""; } });
  const markBankSeen = () => { const now = new Date().toISOString(); setBankSeenAt(now); try { localStorage.setItem("cw_bankSeen", now); } catch (e) { /* storage may be blocked */ } };
  const blankLine = { date: new Date().toISOString().slice(0, 10), payee: "", amount: "", direction: "out", accountId: lastAcctId, category: "" };
  const [lineDraft, setLineDraft] = useState(blankLine);
  const [editLineId, setEditLineId] = useState(null);
  const [editDraft, setEditDraft] = useState({ date: "", payee: "", amount: "", direction: "out" });
  const [addedCount, setAddedCount] = useState(0);
  const [sortBy, setSortBy] = useState("account");
  const [acctFilter, setAcctFilter] = useState("");
  const [regAcct, setRegAcct] = useState("");   // Register view: which account's book we're reading
  const [soaYear, setSoaYear] = useState(null); // fiscal year shown on the nonprofit reports
  const [showDonorForm, setShowDonorForm] = useState(false);
  const blankDonor = { name: "", email: "", address: "" };
  const [donorDraft, setDonorDraft] = useState(blankDonor);
  const [reconTarget, setReconTarget] = useState("");
  const [reconDate, setReconDate] = useState(""); // statement ending date for this reconciliation
  const [reconHist, setReconHist] = useState([]); // saved reconciliations, for "last reconciled" + report
  const [reconStmtDoc, setReconStmtDoc] = useState(null); // {id, name} PDF/CSV statement attached to this rec
  const [reconStmtBusy, setReconStmtBusy] = useState(false);
  const [reconSeeCleared, setReconSeeCleared] = useState(false); // show already-reconciled lines in the recon window
  const [reconOpen, setReconOpen] = useState(false);
  const [reconChecked, setReconChecked] = useState({});
  const blankReconAdd = { amount: "", dir: "out", category: "", memo: "" };
  const [reconAdd, setReconAdd] = useState(blankReconAdd);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpWho, setHelpWho] = useState("dave"); // which guide: dave | betty
  const isBetty = (session?.user?.email || "").toLowerCase().includes("races61");
  const meName = isBetty ? "Betty" : invUser ? "Dave" : (entity.currentUser || (session?.user?.email || "").split("@")[0] || "You");
  // Little message board between Dave & Betty — "hey, could you…" notes at the top of every screen.
  const [messages, setMessages] = useState([]);
  const [msgDraft, setMsgDraft] = useState("");
  const [msgOpen, setMsgOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // message id being replied to
  const [replyDraft, setReplyDraft] = useState("");
  const [msgArchive, setMsgArchive] = useState(false); // show resolved (done) messages
  const [msgCollapsed, setMsgCollapsed] = useState(false); // hide the message board without resolving anything
  const [msgImagePath, setMsgImagePath] = useState(null); // screenshot attached to the message being composed
  const [msgImgBusy, setMsgImgBusy] = useState(false);
  const [msgImgUrls, setMsgImgUrls] = useState({}); // path -> signed URL, for showing message images
  const [recentIds, setRecentIds] = useState([]); // just-entered rows, pinned to the top until cleared
  const markRecent = id => { if (id) setRecentIds(p => [id, ...p.filter(x => x !== id)].slice(0, 12)); };
  const [invSort, setInvSort] = useState("status"); // Invoices list sort
  const [poSort, setPoSort] = useState("vendor");    // Purchase Orders list sort
  const [logoBusy, setLogoBusy] = useState(false);
  const [docBusy, setDocBusy] = useState(false);
  const [taxDocBusy, setTaxDocBusy] = useState("");
  const [docCategory, setDocCategory] = useState("QuickBooks close-out");
  const [docFilter, setDocFilter] = useState(null); // Documents dashboard: which category is open
  const [importAcctId, setImportAcctId] = useState(null);  // statement CSV import target account
  const [importData, setImportData] = useState(null);      // { fileName, headers, rows, map }
  const [importBusy, setImportBusy] = useState(false);
  const payeeRef = useRef(null);
  const amountRef = useRef(null);
  const blankAcct = { name: "", account_type: "bank", last_four: "", opening: "", needs_info: false, info_note: "" };
  const [acctEditId, setAcctEditId] = useState(null);
  const [acctDraft, setAcctDraft] = useState(blankAcct);
  const [showAddAcct, setShowAddAcct] = useState(false);
  const [plaidBusy, setPlaidBusy] = useState(null);
  const [cardPlan, setCardPlan] = useState({}); // { cardName: { apr, min } }
  const [payoffBudget, setPayoffBudget] = useState("");
  const blankCampaign = { subject: "", body: "" };
  const [campaign, setCampaign] = useState(blankCampaign);
  const [campaignBusy, setCampaignBusy] = useState(false);
  const [campaignResult, setCampaignResult] = useState(null);
  const [newAcct, setNewAcct] = useState(blankAcct);
  const blankItem = { name: "", description: "", price: "", taxable: true, income_account: "" };
  const [itemEditId, setItemEditId] = useState(null);
  const [itemDraft, setItemDraft] = useState(blankItem);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState(blankItem);
  const blankCat = { name: "", kind: "expense", cat_type: "expense", func_class: "" };
  const [catEditId, setCatEditId] = useState(null);
  const [catDraft, setCatDraft] = useState(blankCat);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState(blankCat);
  const [listsTab, setListsTab] = useState("");
  const [stFrom, setStFrom] = useState("");
  const [stTo, setStTo] = useState("");
  const blankContact = { name: "", company: "", email: "", phone: "", billing_address: "", tax_status: "Taxable", notes: "", exempt_reason: "", exempt_cert_number: "", exempt_cert_on_file: false, exempt_cert_date: "" };
  const [contactEditId, setContactEditId] = useState(null);
  const [contactDraft, setContactDraft] = useState(blankContact);
  const [vendorTxOpen, setVendorTxOpen] = useState(null); // vendor id whose payment history is expanded
  const [histOpen, setHistOpen] = useState(null); // contact id whose QuickBooks history is expanded
  const [histData, setHistData] = useState({}); // contact id -> ledger_history row (fetched on demand)
  const [histBusy, setHistBusy] = useState(false);
  const [custHistOpen, setCustHistOpen] = useState(null); // customer id whose invoice history is expanded
  const [mergeVendorId, setMergeVendorId] = useState(null); // vendor being merged away
  const [mergeInto, setMergeInto] = useState(""); // target vendor name for the merge
  // Merge a duplicate vendor into another: move its bills + rename its check lines, then remove it.
  async function mergeVendor(fromId, fromName, toName) {
    if (!liveOrgId || !fromName || !toName || fromName === toName) return;
    if (!window.confirm(`Merge "${fromName}" into "${toName}"? Its bills and check lines move to "${toName}", and "${fromName}" is removed.`)) return;
    await supabase.from("ledger_bills").update({ vendor_name: toName }).eq("org_id", liveOrgId).eq("vendor_name", fromName);
    await supabase.from("ledger_entries").update({ description: toName }).eq("org_id", liveOrgId).eq("description", fromName);
    await supabase.from("ledger_vendors").delete().eq("id", fromId);
    setMergeVendorId(null); setMergeInto(""); setReloadTick(t => t + 1);
  }
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState(blankContact);
  const [contactErr, setContactErr] = useState("");
  const [invoices, setInvoices] = useState(entity.invoices || []);
  const [liveOrgIdState, setLiveOrgId] = useState(null);
  const liveOrgId = testMode ? null : liveOrgIdState; // null in test mode → all writes bail out
  const [reloadTick, setReloadTick] = useState(0);
  const [showInvForm, setShowInvForm] = useState(false);
  const [openInv, setOpenInv] = useState(null);
  const [packMode, setPackMode] = useState(false); // render the open doc as a packing slip (items + qty, no prices)
  const [docMoreOpen, setDocMoreOpen] = useState(false); // reveal the secondary actions on the doc modal
  const [sentLink, setSentLink] = useState(null);
  const [emailState, setEmailState] = useState(null);
  const [poEmailTo, setPoEmailTo] = useState("");   // vendor email for the PO send box
  const [poEmailMsg, setPoEmailMsg] = useState(null); // {sending} | {ok} | {err}
  const [poSend, setPoSend] = useState(null);       // the PO being emailed from a list row (one-click send popup)
  const [receiptMsg, setReceiptMsg] = useState(null); // paid-receipt email status
  const [progOpen, setProgOpen] = useState({});
  const blankInvPay = { amount: "", method: "check", check_number: "", paid_on: "", memo: "", accountId: "" };
  const [payFor, setPayFor] = useState(null);
  const [invPay, setInvPay] = useState(blankInvPay);
  const [overpayFor, setOverpayFor] = useState(null); // invoice being resolved for an overpayment
  const [overpayAmt, setOverpayAmt] = useState("");
  const [showOrderForm, setShowOrderForm] = useState(false);
  const blankOrder = { mode: "invoice", date: "", customer: "", vendor: "", email: "", ship: "", taxStatus: "Taxable", lines: [{ item: "", desc: "", qty: "1", cost: "", price: "" }] };
  const [orderDraft, setOrderDraft] = useState(blankOrder);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showBillForm, setShowBillForm] = useState(false);
  const blankBill = { vendor: "", amount: "", due: "", category: "", memo: "" };
  const [billDraft, setBillDraft] = useState(blankBill);
  const [openBill, setOpenBill] = useState(null);
  const [billEdit, setBillEdit] = useState(null);
  const [checkFor, setCheckFor] = useState(null);
  const [checkAcctId, setCheckAcctId] = useState("");
  const [checkStartNum, setCheckStartNum] = useState(""); // editable first check number for the batch
  const [selectedBills, setSelectedBills] = useState({}); // { billId: true }
  const [showPaidBills, setShowPaidBills] = useState(false); // collapse the paid bills out of the main list
  const [checkOffX, setCheckOffX] = useState(() => { try { return parseFloat(localStorage.getItem("cw_checkAlignX")) || 0; } catch (e) { return 0; } }); // inches, printer alignment nudge (remembered)
  const [checkOffY, setCheckOffY] = useState(() => { try { return parseFloat(localStorage.getItem("cw_checkAlignY")) || 0; } catch (e) { return 0; } });
  useEffect(() => { try { localStorage.setItem("cw_checkAlignX", String(checkOffX)); localStorage.setItem("cw_checkAlignY", String(checkOffY)); } catch (e) { /* storage may be blocked */ } }, [checkOffX, checkOffY]);
  const blankInvoice = { customer: "", email: "", ship: "", taxStatus: "Taxable", lines: [{ desc: "", qty: "1", price: "" }] };
  const [invDraft, setInvDraft] = useState(blankInvoice);

  const latestUpdate = entity.changelog?.[0]?.date || "";
  const MN_TAX_RATE = 0.09025; // Bloomington, MN combined 9.025%: 6.875 state + 0.5 city + 0.15 Hennepin + 0.5 Henn transit + 0.75 metro transit + 0.25 metro housing. Confirmed vs QBO Sales Tax Liability Report.
  // The MN e-Services filing breaks the combined rate into these jurisdiction lines — Betty enters each.
  const MN_TAX_LINES = [
    ["Minnesota state", 0.06875],
    ["Hennepin County", 0.0015],
    ["Hennepin County transit", 0.005],
    ["Metro-area transit", 0.0075],
    ["Metro-area housing", 0.0025],
    ["Bloomington city", 0.005],
  ];

  // ---- Tenant profile: which sections they get, and what those sections are called ----
  // A tenant that lists `sections` gets exactly those, in that order; everyone else gets
  // the full set. `labels` renames a section without renaming its key — a client who wants
  // a Register instead of a Notebook gets one from data, not from a fork of this file.
  const sections = (entity.sections && entity.sections.length
    ? entity.sections.map(k => SECTIONS.find(x => x.key === k)).filter(Boolean)
    : SECTIONS
  ).filter(x => x.key !== "giving" || entity.orgType === "nonprofit" || (entity.features && entity.features.donations === true))
   .map(x => ({ ...x, label: (entity.labels && entity.labels[x.key]) || x.label }));
  // Never strand someone on a section their profile doesn't include.
  const activeSection = sections.some(x => x.key === section) ? section : (sections[0] ? sections[0].key : "notebook");
  const buildProgress = entity.buildProgress || BUILD_PROGRESS;
  // Feature switch. Absent profile, or absent key, means the feature is on — so adding a
  // new feature never silently vanishes for the tenants who already had it.
  const featureOn = k => !(entity.features && entity.features[k] === false);

  // Go live when someone's logged in: load their ProGraphics ledger org from Supabase.
  useEffect(() => {
    if (testMode) return; // freeze the loaded data while sandboxing — no refetch to wipe their play
    const uid = session?.user?.id;
    if (!uid) { setDbEntity(null); return; }
    let cancelled = false;
    (async () => {
      const { data: orgs } = await supabase.from("ledger_orgs").select("*").order("created_at", { ascending: true });
      // Match the org to the entity this route asked for (by first word of its name).
      // No match → stay on the sample/connect stub; never fall back to an arbitrary org.
      const wantFirst = ((propEntity || ENTITIES[entityKey] || SAMPLE_ENTITY).name || "").toLowerCase().split(" ")[0];
      const org = orgId
        ? (orgs || []).find(o => o.id === orgId)
        : (wantFirst ? (orgs || []).find(o => (o.name || "").toLowerCase().includes(wantFirst)) : null);
      if (!org || cancelled) return;
      const [a, c, e, inv, ven, cust, prod, bil, pay, cred, evts, docs, dons, stmts] = await Promise.all([
        supabase.from("ledger_accounts").select("*").eq("org_id", org.id).eq("archived", false).order("created_at", { ascending: true }),
        supabase.from("ledger_categories").select("*").eq("org_id", org.id).eq("archived", false).order("sort_order", { ascending: true }),
        supabase.from("ledger_entries").select("*").eq("org_id", org.id).order("entry_date", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").eq("org_id", org.id).order("issue_date", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("ledger_vendors").select("*").eq("org_id", org.id).eq("archived", false).order("name", { ascending: true }),
        supabase.from("ledger_customers").select("*").eq("org_id", org.id).eq("archived", false).order("name", { ascending: true }),
        supabase.from("ledger_products").select("*").eq("org_id", org.id).order("name", { ascending: true }),
        supabase.from("ledger_bills").select("*").eq("org_id", org.id).order("due_date", { ascending: true }).order("created_at", { ascending: false }),
        supabase.from("ledger_payments").select("*").eq("org_id", org.id).order("paid_on", { ascending: true }),
        supabase.from("ledger_credits").select("*").eq("org_id", org.id).eq("status", "open").order("created_at", { ascending: true }),
        supabase.from("ledger_doc_events").select("*").eq("org_id", org.id).order("created_at", { ascending: true }),
        supabase.from("ledger_documents").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
        supabase.from("ledger_donors").select("*").eq("org_id", org.id).order("name", { ascending: true }),
        supabase.from("ledger_statements").select("*").eq("org_id", org.id).order("period_end", { ascending: false }),
      ]);
      if (cancelled) return;
      setLiveOrgId(org.id);
      const built = buildLiveEntity(org, a.data || [], c.data || [], e.data || [], session);
      const payByInv = {};
      (pay.data || []).forEach(p => { (payByInv[p.invoice_id] = payByInv[p.invoice_id] || []).push(p); });
      built.invoices = (inv.data || []).map(v => attachPayments(mapInvoice(v), payByInv[v.id] || []));
      built.vendors = (ven.data || []).map(v => v.name);
      built.vendorList = ven.data || [];
      built.rawAccounts = a.data || [];
      built.customers = cust.data || [];
      built.products = prod.data || [];
      built.bills = bil.data || [];
      built.rawCategories = c.data || [];
      built.rawEntries = e.data || [];
      built.credits = cred.data || [];
      const evByInv = {};
      (evts.data || []).forEach(ev => { (evByInv[ev.invoice_id] = evByInv[ev.invoice_id] || []).push(ev); });
      built.docEvents = evByInv;
      built.documents = docs.data || [];
      built.donors = dons.data || [];
      built.statements = stmts.data || [];
      built.orgType = org.org_type || "business";
      setDbEntity(built);
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id, entityKey, orgId, reloadTick, testMode]);

  // Keep the notebook + invoices in sync when the data source changes (sample → live, or after a write).
  useEffect(() => { setItems(entity.notebook); setCleared([]); setInvoices(entity.invoices || []); }, [entity]);
  // Name the browser tab after the tenant, so a wall of tabs is distinguishable.
  useEffect(() => { document.title = (entity.short || entity.name || "CARES Works") + " — Books"; }, [entity.short, entity.name]);
  // Load the team message board for this org (+ signed URLs for any attached screenshots).
  useEffect(() => {
    if (!liveOrgId || testMode) { setMessages([]); return; }
    let cancel = false;
    supabase.from("ledger_messages").select("*").eq("org_id", liveOrgId).order("created_at", { ascending: false }).limit(50)
      .then(async ({ data }) => {
        if (cancel) return;
        setMessages(data || []);
        const paths = (data || []).map(m => m.image_path).filter(Boolean);
        if (paths.length) {
          const { data: signed } = await supabase.storage.from("org-docs").createSignedUrls(paths, 3600);
          if (!cancel && signed) { const map = {}; signed.forEach(s => { if (s.path && s.signedUrl) map[s.path] = s.signedUrl; }); setMsgImgUrls(map); }
        }
      });
    return () => { cancel = true; };
  }, [liveOrgId, testMode, reloadTick]);
  // Attach a screenshot/image to the message being composed.
  async function attachMsgImage(file) {
    if (!file || !liveOrgId) return;
    if (!/^image\//.test(file.type || "")) { window.alert("Please pick an image (screenshot)."); return; }
    if (file.size > 10 * 1024 * 1024) { window.alert("Keep the image under 10 MB."); return; }
    setMsgImgBusy(true);
    try {
      const safe = (file.name || "screenshot.png").replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${liveOrgId}/messages/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from("org-docs").upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (error) throw error;
      setMsgImagePath(path);
    } catch (e) { window.alert("Couldn't attach that image: " + (e.message || e)); }
    setMsgImgBusy(false);
  }
  // Load saved reconciliations (for "last reconciled" and the history report).
  useEffect(() => {
    if (!liveOrgId || testMode) { setReconHist([]); return; }
    let cancel = false;
    supabase.from("ledger_reconciliations").select("*").eq("org_id", liveOrgId).order("statement_ending_date", { ascending: false }).limit(200)
      .then(({ data }) => { if (!cancel) setReconHist(data || []); });
    return () => { cancel = true; };
  }, [liveOrgId, testMode, reloadTick]);
  async function postNote(body, replyToId, imagePath) {
    const b = (body || "").trim();
    if ((!b && !imagePath) || !liveOrgId || testMode) return;
    await supabase.from("ledger_messages").insert({ org_id: liveOrgId, user_id: session.user.id, author: meName, body: b || "(screenshot)", reply_to: replyToId || null, image_path: imagePath || null });
    // A reply brings its thread back to the active list, so an answer never gets buried in Archive.
    if (replyToId) await supabase.from("ledger_messages").update({ done: false }).eq("id", replyToId);
    setReloadTick(t => t + 1);
  }
  async function sendNote() { const b = msgDraft, img = msgImagePath; setMsgDraft(""); setMsgImagePath(null); await postNote(b, null, img); }
  async function sendReply(id) { const b = replyDraft; setReplyDraft(""); setReplyTo(null); await postNote(b, id); }
  async function resolveNote(id) {
    if (!liveOrgId || testMode) return;
    await supabase.from("ledger_messages").update({ done: true }).eq("id", id);
    setReloadTick(t => t + 1);
  }
  async function reopenNote(id) {
    if (!liveOrgId || testMode) return;
    await supabase.from("ledger_messages").update({ done: false }).eq("id", id);
    setReloadTick(t => t + 1);
  }
  function noteTime(ts) {
    if (!ts) return "";
    try { return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; }
  }
  function fmtStmtDate(d) {
    if (!d) return "—";
    const p = String(d).split("-");
    return p.length === 3 ? `${+p[1]}/${+p[2]}/${p[0]}` : d;
  }
  function printReconHistory(acctName, recs, isLiab) {
    const rows = (recs || []).map(r => {
      const bal = money((isLiab ? -(r.statement_ending_balance_cents || 0) : (r.statement_ending_balance_cents || 0)) / 100) + (isLiab ? " owed" : "");
      const on = (r.reconciled_at || r.created_at) ? new Date(r.reconciled_at || r.created_at).toLocaleDateString("en-US") : "";
      return `<tr><td>${fmtStmtDate(r.statement_ending_date)}</td><td class=r>${bal}</td><td class=r>${r.item_count || 0}</td><td class=r>${on}</td></tr>`;
    }).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Reconciliation history — ${acctName}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:32px;max-width:720px;margin:0 auto}
      h1{font-size:20px;margin:0 0 2px}h2{font-size:14px;color:#64748b;font-weight:600;margin:0 0 18px}
      table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:7px 10px;border-bottom:1px solid #e2e8f0;text-align:left}
      th{font-size:10px;letter-spacing:.08em;color:#64748b;text-transform:uppercase}.r{text-align:right}
      .foot{margin-top:16px;font-size:11px;color:#94a3b8}</style></head>
      <body><h1>${entity.name || ""}</h1><h2>Reconciliation history — ${acctName}</h2>
      <table><thead><tr><th>Statement date</th><th class=r>Ending balance</th><th class=r>Items</th><th class=r>Reconciled on</th></tr></thead>
      <tbody>${rows || '<tr><td colspan=4>No reconciliations yet.</td></tr>'}</tbody></table>
      <div class="foot">Printed ${new Date().toLocaleDateString("en-US")} · CARES Works</div></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { window.alert("Allow pop-ups to print the report."); return; }
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => { try { w.print(); } catch (e) { /* user can print manually */ } }, 350);
  }
  // Slim message board under the balances — Dave & Betty leave each other "could you…" notes.
  function messageBar() {
    if (!liveOrgId || testMode) return null;
    const open = messages.filter(m => !m.done && !m.reply_to);
    const doneMsgs = messages.filter(m => m.done && !m.reply_to).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    const repliesOf = id => messages.filter(r => r.reply_to === id).sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
    const other = meName === "Betty" ? "Dave" : "Betty";
    if (msgCollapsed) {
      return (
        <div className="no-print" style={{ padding: "0 22px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: open.length ? "#fff7ed" : "#f7fafd", border: "1px solid " + (open.length ? "#fed7aa" : N.rule), borderRadius: 12, padding: "7px 14px" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: open.length ? "#9a3412" : N.muted }}>{open.length ? `🔔 ${open.length} message${open.length === 1 ? "" : "s"} waiting` : "✉ Messages"}</span>
            <button onClick={() => setMsgCollapsed(false)} style={{ ...btnPaper(N.blue), padding: "4px 12px", marginLeft: "auto" }}>Show ▾</button>
          </div>
        </div>
      );
    }
    return (
      <div className="no-print" style={{ padding: "0 22px 12px" }}>
        <div style={{ background: open.length ? "#fff7ed" : "#f7fafd", border: "1px solid " + (open.length ? "#fed7aa" : N.rule), borderRadius: 12, padding: "10px 14px", animation: open.length ? "msgPulse 1.3s ease-in-out infinite" : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: open.length ? "#9a3412" : N.muted }}>
              {open.length ? `🔔 ${open.length} NEW MESSAGE${open.length === 1 ? "" : "S"} — please read` : "✉ Messages"}
            </span>
            <button onClick={() => setMsgOpen(o => !o)} style={{ ...btnPaper(N.blue), padding: "5px 12px" }}>{msgOpen ? "Close" : "＋ New message"}</button>
            {doneMsgs.length > 0 && <button onClick={() => setMsgArchive(a => !a)} style={{ ...btnPaper(N.muted), padding: "5px 12px" }}>{msgArchive ? "Hide archive" : `📁 Archive (${doneMsgs.length})`}</button>}
            <button onClick={() => setMsgCollapsed(true)} title="Hide the message board — nothing gets marked done" style={{ ...btnPaper(N.muted), padding: "5px 12px", marginLeft: "auto" }}>▲ Hide board</button>
          </div>
          {msgArchive && doneMsgs.length > 0 && (
            <div style={{ marginTop: 10, borderTop: "1px solid " + N.rule, paddingTop: 10, display: "grid", gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: N.muted }}>Handled messages</div>
              {doneMsgs.map(m => {
                const replies = repliesOf(m.id);
                return (
                  <div key={m.id} style={{ background: "#fafbfc", border: "1px solid " + N.rule, borderRadius: 8, padding: "7px 12px", opacity: 0.9 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: N.muted }}>{m.author}</span>
                        <span style={{ fontSize: 10.5, color: N.mutedLite, marginLeft: 6 }}>{noteTime(m.created_at)}</span>
                        <div style={{ fontSize: 13, color: N.text, marginTop: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.body}</div>
                        {replies.map(r => <div key={r.id} style={{ fontSize: 12, color: N.muted, marginTop: 3, marginLeft: 10, borderLeft: "2px solid " + N.rule, paddingLeft: 8 }}><b style={{ color: N.blueDark }}>{r.author}:</b> {r.body}</div>)}
                      </div>
                      <button onClick={() => reopenNote(m.id)} title="Bring this back to the active list" style={{ ...btnPaper(N.blue), padding: "4px 9px", whiteSpace: "nowrap", fontSize: 11 }}>↩ Reopen</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {open.length > 0 && (
            <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
              {open.map(m => {
                const replies = repliesOf(m.id);
                return (
                <div key={m.id} style={{ background: N.white, border: "1px solid #fde3c6", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: N.ink }}>{m.author}</span>
                      <span style={{ fontSize: 11, color: N.mutedLite, marginLeft: 8 }}>{noteTime(m.created_at)}</span>
                      <div style={{ fontSize: 13.5, color: N.text, marginTop: 2, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.body}</div>
                      {m.image_path && msgImgUrls[m.image_path] && <a href={msgImgUrls[m.image_path]} target="_blank" rel="noopener"><img src={msgImgUrls[m.image_path]} alt="screenshot" style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 8, border: "1px solid " + N.rule, marginTop: 6, display: "block" }} /></a>}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setReplyTo(replyTo === m.id ? null : m.id); setReplyDraft(""); }} style={{ ...btnPaper(N.blue), padding: "5px 10px", whiteSpace: "nowrap" }}>↩ Reply</button>
                      <button onClick={() => resolveNote(m.id)} title="Mark this handled — clears it for both of you" style={{ ...btnPaper(N.pinkDark), padding: "5px 10px", whiteSpace: "nowrap" }}>✓ Done</button>
                    </div>
                  </div>
                  {replies.length > 0 && (
                    <div style={{ marginTop: 8, marginLeft: 12, paddingLeft: 12, borderLeft: "2px solid #fde3c6", display: "grid", gap: 6 }}>
                      {replies.map(r => (
                        <div key={r.id}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: N.blueDark }}>{r.author}</span>
                          <span style={{ fontSize: 10.5, color: N.mutedLite, marginLeft: 6 }}>{noteTime(r.created_at)}</span>
                          <div style={{ fontSize: 13, color: N.text, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{r.body}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {replyTo === m.id && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <input value={replyDraft} onChange={e => setReplyDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); sendReply(m.id); } }} autoFocus placeholder={`Reply to ${m.author}…`} style={{ ...inputSt, flex: 1, minWidth: 200 }} />
                      <button onClick={() => sendReply(m.id)} disabled={!replyDraft.trim()} style={{ ...btnBlue, background: replyDraft.trim() ? N.blue : N.mutedLite }}>Reply</button>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
          {msgOpen && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input value={msgDraft} onChange={e => setMsgDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); sendNote(); } }} autoFocus placeholder={`Hey ${other}, could you…`} style={{ ...inputSt, flex: 1, minWidth: 220 }} />
                <label style={{ ...btnPaper(N.blueDark), cursor: msgImgBusy ? "default" : "pointer", opacity: msgImgBusy ? 0.6 : 1 }}>{msgImgBusy ? "…" : "📷 Screenshot"}<input type="file" accept="image/*" disabled={msgImgBusy} onChange={e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; attachMsgImage(f); }} style={{ display: "none" }} /></label>
                <button onClick={sendNote} disabled={!msgDraft.trim() && !msgImagePath} style={{ ...btnBlue, background: (msgDraft.trim() || msgImagePath) ? N.blue : N.mutedLite }}>Send</button>
              </div>
              {msgImagePath && <div style={{ fontSize: 12, color: N.pinkDark, fontWeight: 600, marginTop: 6 }}>📷 Screenshot attached <button onClick={() => setMsgImagePath(null)} style={{ border: "none", background: "none", color: N.muted, cursor: "pointer", fontWeight: 700 }}>×</button></div>}
            </div>
          )}
        </div>
      </div>
    );
  }
  // Seed the card-payoff APR / minimums from the saved account rows so they persist.
  useEffect(() => {
    const seed = {};
    (entity.rawAccounts || []).forEach(a => {
      if (a.apr != null || a.min_payment_cents != null || a.promo_end || a.credit_limit_cents != null) seed[a.name] = { apr: a.apr != null ? String(a.apr) : "", min: a.min_payment_cents != null ? String(a.min_payment_cents / 100) : "", promo: a.promo_end || "", limit: a.credit_limit_cents != null ? String(a.credit_limit_cents / 100) : "" };
    });
    setCardPlan(seed);
  }, [entity]);

  function clearOne(id, how) {
    setItems(prev => {
      const hit = prev.find(x => x.id === id);
      if (hit) setCleared(c => [{ ...hit, how }, ...c]);
      return prev.filter(x => x.id !== id);
    });
    if (live) {
      const patch = how === "confirmed cleared"
        ? { cleared_confirmed: true, match_status: "noted" }
        : { match_status: how === "bill attached" ? "bill" : "noted" };
      supabase.from("ledger_entries").update(patch).eq("id", id).then(() => {});
    }
  }

  // A donor record is what turns a deposit into an acknowledgable gift — without one
  // there is nobody to address the year-end letter to.
  async function saveDonor() {
    const name = donorDraft.name.trim();
    if (!name || !liveOrgId) return;
    await supabase.from("ledger_donors").insert({
      org_id: liveOrgId, user_id: session.user.id, name,
      email: donorDraft.email.trim() || null, address: donorDraft.address.trim() || null,
    });
    setDonorDraft(blankDonor); setShowDonorForm(false); setReloadTick(t => t + 1);
  }

  // Attach (or detach) a donor on a money-in line.
  async function setDonor(entryId, donorId) {
    if (!live) return;
    await supabase.from("ledger_entries").update({ donor_id: donorId || null }).eq("id", entryId);
    setReloadTick(t => t + 1);
  }

  function setCategory(id, cat) {
    setItems(prev => prev.map(x => (x.id === id ? { ...x, category: cat, suggested: null } : x)));
    setCatOpen(null);
    if (live) supabase.from("ledger_entries").update({ category: cat }).eq("id", id).then(() => {});
  }

  // Bulk "I've got the invoice/receipt" for everything currently showing — pair it
  // with the account filter to clear a whole card's statement lines at once.
  async function clearAllVisible() {
    const ids = visibleItems.map(x => x.id).filter(id => typeof id === "string" && id.length > 20);
    if (ids.length === 0) return;
    if (!window.confirm(`Mark all ${ids.length} showing here as "I've got the invoice/receipt"? They move to Cleared.`)) return;
    const idset = new Set(ids);
    setItems(prev => {
      const moving = prev.filter(x => idset.has(x.id));
      setCleared(c => [...moving.map(m => ({ ...m, how: "has it" })), ...c]);
      return prev.filter(x => !idset.has(x.id));
    });
    if (live) { await supabase.from("ledger_entries").update({ match_status: "noted" }).in("id", ids); setReloadTick(t => t + 1); }
  }

  // Reconcile: mark the checked transactions reconciled (locks them with an R) and
  // drops them out of the "to match" notebook.
  async function finishReconcile(ids, rec) {
    if (!ids || ids.length === 0) { setReconOpen(false); return; }
    setReconOpen(false); setReconChecked({}); setReconAdd(blankReconAdd);
    const idset = new Set(ids);
    setItems(prev => prev.filter(x => !idset.has(x.id)));
    if (live) {
      await supabase.from("ledger_entries").update({ match_status: "reconciled", cleared_confirmed: true }).in("id", ids);
      // Save the reconciliation record (statement date + balances) so there's a history/report.
      if (rec && rec.acctId && liveOrgId) {
        await supabase.from("ledger_reconciliations").insert({
          org_id: liveOrgId, account_id: rec.acctId, user_id: session.user.id,
          statement_ending_date: rec.statementDate || null,
          statement_ending_balance_cents: rec.endingCents,
          beginning_balance_cents: rec.beginningCents,
          item_count: ids.length,
          document_id: reconStmtDoc ? reconStmtDoc.id : null,
        });
      }
      setReconDate(""); setReconTarget(""); setReconStmtDoc(null);
      setReloadTick(t => t + 1);
    }
  }
  // Lock a reconciliation. If it balances, lock it. If it's off, offer to post the
  // difference to a Suspense account (flagged) — never silently reconcile an out-of-balance.
  async function attemptReconcile(ids, ctx, diffCents, targetSignedCents) {
    if (!ids || ids.length === 0 || targetSignedCents == null) return;
    if (Math.abs(diffCents) < 1) { finishReconcile(ids, { ...ctx, endingCents: targetSignedCents }); return; }
    const amt = money(Math.abs(diffCents) / 100);
    if (!window.confirm(`This statement is off by ${amt}.\n\nPost the difference to a Suspense account and lock it? It'll sit in Suspense — flagged — until you track it down.\n\nCancel to keep working and find it now.`)) return;
    let ids2 = ids;
    if (live && liveOrgId) {
      const { data } = await supabase.from("ledger_entries").insert({
        org_id: liveOrgId, user_id: session.user.id, entry_date: ctx.statementDate || new Date().toISOString().slice(0, 10),
        direction: diffCents > 0 ? "in" : "out", amount_cents: Math.abs(diffCents),
        description: "Reconciliation difference — posted to Suspense", category: "Suspense",
        account_id: ctx.acctId, match_status: null,
      }).select("id").single();
      if (data) ids2 = [...ids, data.id];
    }
    finishReconcile(ids2, { ...ctx, endingCents: targetSignedCents });
  }
  // Delete leftover strays from the reconcile screen — unchecked lines that aren't on the
  // statement (duplicates, mistakes). Only unreconciled lines; never touches locked ones.
  async function deleteStrays(ids) {
    if (!ids || !ids.length || !liveOrgId) return;
    if (!window.confirm(`Delete ${ids.length} leftover line${ids.length === 1 ? "" : "s"}?\n\nOnly do this for strays or duplicates that are NOT on the statement. This can't be undone.`)) return;
    setItems(prev => prev.filter(x => !ids.includes(x.id)));
    setReconChecked(p => { const n = { ...p }; ids.forEach(id => delete n[id]); return n; });
    await supabase.from("ledger_entries").delete().in("id", ids);
    setReloadTick(t => t + 1);
  }
  // Add a line (deposit / check / bank fee / interest) that's on the statement but not yet in
  // the books, right from the reconcile screen. It becomes a notebook line on that account and
  // is auto-checked into this reconciliation.
  async function addReconLine(acctId) {
    const cents = Math.round((parseFloat(reconAdd.amount) || 0) * 100);
    if (!cents || !acctId || !liveOrgId) return;
    const { data } = await supabase.from("ledger_entries").insert({
      org_id: liveOrgId, user_id: session.user.id, entry_date: reconDate || new Date().toISOString().slice(0, 10),
      direction: reconAdd.dir === "in" ? "in" : "out", amount_cents: cents,
      description: reconAdd.memo.trim() || (reconAdd.dir === "in" ? "Deposit" : "Payment"),
      category: reconAdd.category || null, account_id: acctId, match_status: null,
    }).select("id").single();
    if (data) setReconChecked(p => ({ ...p, [data.id]: true })); // pre-checked — it's on the statement
    setReconAdd(blankReconAdd);
    setReloadTick(t => t + 1);
  }

  // Add a brand-new account to the chart on the fly (from the "which account?"
  // dropdown) and, if a line was open, drop the transaction straight into it.
  async function addCategory(name, forLineId) {
    const nm = (name || "").trim();
    if (!nm) return;
    if (forLineId) setCategory(forLineId, nm);
    if (live && liveOrgId) {
      await supabase.from("ledger_categories").insert({ org_id: liveOrgId, user_id: session.user.id, name: nm, kind: "expense", sort_order: 999, archived: false });
      setReloadTick(t => t + 1);
    }
  }

  // Chart-of-accounts management (income / COGS / expense accounts = ledger_categories).
  // cat_type is the detailed type shown on the chart; kind (income/expense) stays in sync.
  const kindOf = t => (t === "income" ? "income" : "expense");
  async function addChartCat() {
    if (!newCat.name.trim() || !liveOrgId) return;
    const ct = newCat.cat_type || "expense";
    await supabase.from("ledger_categories").insert({ org_id: liveOrgId, user_id: session.user.id, name: newCat.name.trim(), cat_type: ct, kind: kindOf(ct), func_class: newCat.func_class || null, sort_order: 999, archived: false });
    setShowAddCat(false); setNewCat(blankCat); setReloadTick(t => t + 1);
  }
  async function saveChartCat() {
    if (!catEditId || !catDraft.name.trim()) return;
    const ct = catDraft.cat_type || "expense";
    await supabase.from("ledger_categories").update({ name: catDraft.name.trim(), cat_type: ct, kind: kindOf(ct), func_class: catDraft.func_class || null }).eq("id", catEditId);
    setCatEditId(null); setReloadTick(t => t + 1);
  }
  async function archiveChartCat(id) {
    if (!window.confirm("Remove this account from the chart? Past entries keep the name; it just won't show in the pickers.")) return;
    await supabase.from("ledger_categories").update({ archived: true }).eq("id", id);
    setReloadTick(t => t + 1);
  }

  // "Paid with which card?" — set which account a transaction hit.
  function setAccount(id, acctId, acctName) {
    setItems(prev => prev.map(x => (x.id === id ? { ...x, accountId: acctId, source: acctName } : x)));
    setAcctOpen(null);
    if (acctId) { setLastAcctId(acctId); try { localStorage.setItem("cw_lastAcct", acctId); } catch (e) { /* storage may be blocked */ } }
    if (live) supabase.from("ledger_entries").update({ account_id: acctId }).eq("id", id).then(() => {});
  }

  // Notebook → invoice: apply an incoming-money line to an open invoice. Creates the
  // payment record (so the invoice balance drops / it goes Paid) and links the two.
  async function applyEntryToInvoice(x, invId) {
    const inv = invoices.find(v => v.id === invId);
    if (!inv || !live || !liveOrgId) return;
    // Already settled? Just tag the deposit with the invoice — don't add a second
    // payment (that would over-pay it). Lets you attach the number for the record.
    if (inv.status === "Paid" || (inv.balanceCents != null && inv.balanceCents <= 0)) {
      await supabase.from("ledger_entries").update({ invoice_id: inv.id, category: "Customer payment" }).eq("id", x.id);
      setReloadTick(t => t + 1);
      return;
    }
    const cents = Math.round((x.amount || 0) * 100);
    const { data: payRow } = await supabase.from("ledger_payments").insert({
      org_id: liveOrgId, user_id: session.user.id, invoice_id: inv.id, amount_cents: cents,
      method: "other", paid_on: x.dateISO || new Date().toISOString().slice(0, 10),
      memo: "Matched from the notebook", entry_id: x.id,
    }).select("id").single();
    await supabase.from("ledger_entries").update({ invoice_id: inv.id, payment_id: payRow ? payRow.id : null, category: "Customer payment" }).eq("id", x.id);
    const newPaid = (inv.paidCents || 0) + cents;
    const totalCents = Math.round((inv.amount || 0) * 100);
    if (totalCents > 0 && newPaid >= totalCents) {
      await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", inv.id);
    }
    setReloadTick(t => t + 1);
  }
  // Reopen an invoice after a payment is pulled off it (drops it back out of "Paid").
  async function reopenInvoice(invoiceId, removedCents) {
    if (!invoiceId) return;
    const inv = invoices.find(v => v.id === invoiceId);
    if (!inv) return;
    const totalCents = Math.round((inv.amount || 0) * 100);
    const remaining = (inv.paidCents || 0) - (removedCents || 0);
    if (inv.status === "Paid" || (inv.status === "Partial" && remaining <= 0) || remaining < totalCents) {
      await supabase.from("invoices").update({ status: "sent", paid_at: null }).eq("id", invoiceId);
    }
  }
  async function unlinkEntryInvoice(x) {
    if (!live) return;
    if (!window.confirm("Unlink this deposit from its invoice? The invoice payment is removed and it goes back to unpaid.")) return;
    if (x.paymentId) await supabase.from("ledger_payments").delete().eq("id", x.paymentId);
    await reopenInvoice(x.invoiceId, Math.round((x.amount || 0) * 100));
    await supabase.from("ledger_entries").update({ invoice_id: null, payment_id: null }).eq("id", x.id);
    setReloadTick(t => t + 1);
  }
  // Full reverse of a customer-payment deposit: drop the payment, unmark the invoice
  // Paid, and remove the line from the notebook — all in one click.
  async function reverseDeposit(x) {
    if (!window.confirm("Reverse this payment? It comes off the invoice (unmarks Paid) and out of the notebook.")) return;
    setItems(prev => prev.filter(it => it.id !== x.id));
    if (live) {
      if (x.paymentId) await supabase.from("ledger_payments").delete().eq("id", x.paymentId);
      await reopenInvoice(x.invoiceId, Math.round((x.amount || 0) * 100));
      await supabase.from("ledger_entries").delete().eq("id", x.id);
      setReloadTick(t => t + 1);
    }
  }

  // Card payment = a TRANSFER (checking down, card down), NOT an expense.
  // Records two entries tagged "Card payment" so reports exclude them from income/expense.
  async function recordCardPayment() {
    const cents = Math.round((parseFloat(payDraft.amount) || 0) * 100);
    const fromId = payDraft.fromId || defaultBankId;
    if (!cents || !fromId || !payDraft.toId) return;
    const fromName = accountList.find(a => a.id === fromId)?.name || "checking";
    const toName = accountList.find(a => a.id === payDraft.toId)?.name || "card";
    const date = payDraft.date;
    setShowPayCard(false);
    setPayDraft(blankPay);
    if (live && liveOrgId) {
      // match_status null so both sides show up in the notebook (they were hidden as "noted").
      const base = { org_id: liveOrgId, user_id: session.user.id, entry_date: date, amount_cents: cents, category: "Card payment", match_status: null };
      const { data: pair } = await supabase.from("ledger_entries").insert([
        { ...base, direction: "out", account_id: fromId, description: `Payment to ${toName}` },
        { ...base, direction: "in", account_id: payDraft.toId, description: `Payment from ${fromName}` },
      ]).select("id");
      (pair || []).forEach(r => markRecent(r.id)); // pin them to the top so she sees them
      setReloadTick(t => t + 1);
    }
  }

  // Manually write a line into Betty's notebook — for when there's no bank feed yet,
  // or a cash/check transaction the feed will never see. Lands unmatched in the notebook.
  async function createLine() {
    const cents = Math.round((parseFloat(lineDraft.amount) || 0) * 100);
    if (!cents || !lineDraft.payee.trim()) return;
    const draft = lineDraft;
    // Continuous entry: keep the form open, keep date / in-out / account for the next
    // line, clear only payee + amount, bump the counter, and jump focus back to payee
    // so Betty can rip through a stack without touching the mouse.
    setLineDraft(d => ({ ...d, payee: "", amount: "" }));
    setAddedCount(c => c + 1);
    if (payeeRef.current) payeeRef.current.focus();
    if (live && liveOrgId) {
      const { data: newLine } = await supabase.from("ledger_entries").insert({
        org_id: liveOrgId, user_id: session.user.id,
        entry_date: draft.date, amount_cents: cents, direction: draft.direction,
        description: draft.payee.trim(), account_id: draft.accountId || defaultBankId || null,
        category: draft.category || null,
        match_status: null,
      }).select("id").single();
      if (newLine) markRecent(newLine.id);
      // Grow the vendor dropdown from what she actually types — a new payee
      // becomes a vendor automatically. Duplicates are rejected by the unique
      // index and the error is intentionally ignored.
      const vname = draft.payee.trim();
      if (vname && !(entity.vendors || []).some(v => v.toLowerCase() === vname.toLowerCase())) {
        await supabase.from("ledger_vendors").insert({ org_id: liveOrgId, user_id: session.user.id, name: vname });
      }
      setReloadTick(t => t + 1);
      setTimeout(() => payeeRef.current && payeeRef.current.focus(), 60);
    }
  }

  // Edit an existing notebook line in place — fix a typo, wrong amount, wrong date, in/out.
  async function saveLine() {
    const id = editLineId;
    const cents = Math.round((parseFloat(editDraft.amount) || 0) * 100);
    if (!id || !cents || !editDraft.payee.trim()) return;
    const p = (editDraft.date || "").split("-");
    const shortD = p.length === 3 ? `${+p[1]}/${+p[2]}` : editDraft.date;
    setItems(prev => prev.map(it => it.id === id
      ? { ...it, date: shortD, dateISO: editDraft.date, payee: editDraft.payee.trim(), amount: cents / 100, direction: editDraft.direction }
      : it));
    setEditLineId(null);
    if (live) {
      await supabase.from("ledger_entries").update({
        entry_date: editDraft.date, description: editDraft.payee.trim(),
        amount_cents: cents, direction: editDraft.direction,
      }).eq("id", id);
      setReloadTick(t => t + 1);
    }
  }

  // Delete a notebook line for good — a mistake, a duplicate, something that shouldn't be here.
  async function deleteLine(id) {
    const it = items.find(x => x.id === id);
    if (it && it.invoiceId) { // it's a customer payment — reverse it properly, not a bare delete
      return reverseDeposit(it);
    }
    if (!window.confirm("Delete this line? It's removed from the notebook for good.")) return;
    setItems(prev => prev.filter(x => x.id !== id));
    if (editLineId === id) setEditLineId(null);
    if (live) {
      await supabase.from("ledger_entries").delete().eq("id", id);
      setReloadTick(t => t + 1);
    }
  }

  // ---- Accounts the user manages themselves (nothing hardcoded) --------------
  async function logout() {
    setUserMenuOpen(false);
    await supabase.auth.signOut();
    navigate("/login");
  }

  async function addAccount() {
    if (!newAcct.name.trim() || !liveOrgId) return;
    await supabase.from("ledger_accounts").insert({
      org_id: liveOrgId, user_id: session.user.id,
      name: newAcct.name.trim(), account_type: newAcct.account_type,
      last_four: newAcct.last_four.trim() || null,
      opening_balance_cents: Math.round((parseFloat(newAcct.opening) || 0) * 100),
      needs_info: !!newAcct.needs_info, info_note: (newAcct.info_note || "").trim() || null,
    });
    setShowAddAcct(false); setNewAcct(blankAcct); setReloadTick(t => t + 1);
  }

  // --- Plaid: connect a bank/card and pull transactions into the notebook -------
  function loadPlaidScript() {
    return new Promise((resolve, reject) => {
      if (window.Plaid) return resolve();
      const s = document.createElement("script");
      s.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Couldn't load Plaid."));
      document.body.appendChild(s);
    });
  }
  async function connectPlaid() {
    if (!liveOrgId) return;
    setPlaidBusy("connecting");
    try {
      const { data, error } = await supabase.functions.invoke("plaid-link-token", { body: { org_id: liveOrgId } });
      if (error || !data || data.error || !data.link_token) { setPlaidBusy(null); window.alert((data && data.error) || "Couldn't start Plaid — is it configured in Supabase yet?"); return; }
      await loadPlaidScript();
      const handler = window.Plaid.create({
        token: data.link_token,
        onSuccess: async (public_token) => {
          setPlaidBusy("linking");
          await supabase.functions.invoke("plaid-exchange", { body: { public_token, org_id: liveOrgId } });
          setPlaidBusy("syncing");
          await supabase.functions.invoke("plaid-sync", { body: { org_id: liveOrgId } });
          setPlaidBusy(null); setReloadTick(t => t + 1);
        },
        onExit: () => setPlaidBusy(null),
      });
      handler.open();
    } catch (e) { setPlaidBusy(null); window.alert(String(e)); }
  }
  async function syncPlaid() {
    if (!liveOrgId) return;
    setPlaidBusy("syncing");
    const { data, error } = await supabase.functions.invoke("plaid-sync", { body: { org_id: liveOrgId } });
    setPlaidBusy(null);
    if (error || (data && data.error)) { window.alert((data && data.error) || "Sync failed."); return; }
    window.alert(`Pulled ${data && data.added != null ? data.added : 0} new transaction${data && data.added === 1 ? "" : "s"} into the notebook.`);
    setReloadTick(t => t + 1);
  }

  async function saveAccount() {
    const id = acctEditId;
    if (!id || !acctDraft.name.trim()) return;
    await supabase.from("ledger_accounts").update({
      name: acctDraft.name.trim(), account_type: acctDraft.account_type,
      last_four: acctDraft.last_four.trim() || null,
      opening_balance_cents: Math.round((parseFloat(acctDraft.opening) || 0) * 100),
      needs_info: !!acctDraft.needs_info, info_note: (acctDraft.info_note || "").trim() || null,
    }).eq("id", id);
    setAcctEditId(null); setReloadTick(t => t + 1);
  }
  async function archiveAccount(id) {
    if (!window.confirm("Archive this account? Past entries keep it, but it won't show in the pickers.")) return;
    await supabase.from("ledger_accounts").update({ archived: true }).eq("id", id);
    setReloadTick(t => t + 1);
  }

  async function addItem() {
    if (!newItem.name.trim() || !liveOrgId) return;
    await supabase.from("ledger_products").insert({
      org_id: liveOrgId, user_id: session.user.id,
      name: newItem.name.trim(), description: newItem.description.trim() || null,
      price_cents: Math.round((parseFloat(newItem.price) || 0) * 100),
      taxable: !!newItem.taxable, kind: "non-inventory",
      income_account: newItem.income_account.trim() || null,
    });
    setShowAddItem(false); setNewItem(blankItem); setReloadTick(t => t + 1);
  }
  async function saveItem() {
    const id = itemEditId;
    if (!id || !itemDraft.name.trim()) return;
    await supabase.from("ledger_products").update({
      name: itemDraft.name.trim(), description: itemDraft.description.trim() || null,
      price_cents: Math.round((parseFloat(itemDraft.price) || 0) * 100),
      taxable: !!itemDraft.taxable,
      income_account: itemDraft.income_account.trim() || null,
    }).eq("id", id);
    setItemEditId(null); setReloadTick(t => t + 1);
  }
  async function archiveItem(id, val) {
    await supabase.from("ledger_products").update({ archived: val }).eq("id", id);
    setReloadTick(t => t + 1);
  }
  async function deleteItem(id) {
    if (!window.confirm("Delete this item for good? Only do this if it's never been used. If it's been on an invoice, make it inactive instead so history stays intact.")) return;
    await supabase.from("ledger_products").delete().eq("id", id);
    setReloadTick(t => t + 1);
  }

  async function saveContact(table, isNew) {
    const src = isNew ? newContact : contactDraft;
    if (!liveOrgId) return;
    if (!src.name.trim()) { setContactErr("Name is required."); return; }
    // Customers get invoiced, so they need an email + phone. Vendors often have neither —
    // don't block saving one just to fix a name.
    if (table === "ledger_customers") {
      if (!(src.email || "").trim() || !/.+@.+\..+/.test((src.email || "").trim())) { setContactErr("A valid email is required — we can't send invoices without one."); return; }
      if (!(src.phone || "").trim()) { setContactErr("A phone number is required."); return; }
    } else if ((src.email || "").trim() && !/.+@.+\..+/.test((src.email || "").trim())) {
      setContactErr("That email doesn't look valid — fix it or leave it blank."); return;
    }
    setContactErr("");
    // Clean vendor names to a single consistent form so re-entries don't create
    // "Spec." vs "spec" vs "SPEC" duplicates: title case, no periods/commas, single spaces.
    const cleanVendorName = s => (s || "").trim().replace(/\s+/g, " ").replace(/[.,]/g, "").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    const row = table === "ledger_customers"
      ? { name: cleanName(src.name), company: (src.company || "").trim() || null, email: (src.email || "").trim() || null, phone: (src.phone || "").trim() || null, billing_address: (src.billing_address || "").trim() || null, tax_status: src.tax_status || null, notes: (src.notes || "").trim() || null, exempt_reason: src.tax_status === "Exempt" ? ((src.exempt_reason || "").trim() || null) : null, exempt_cert_number: src.tax_status === "Exempt" ? ((src.exempt_cert_number || "").trim() || null) : null, exempt_cert_on_file: src.tax_status === "Exempt" ? !!src.exempt_cert_on_file : false, exempt_cert_date: src.tax_status === "Exempt" ? (src.exempt_cert_date || null) : null }
      : { name: cleanVendorName(src.name), email: (src.email || "").trim() || null, phone: (src.phone || "").trim() || null, billing_address: (src.billing_address || "").trim() || null };
    if (isNew) {
      await supabase.from(table).insert({ org_id: liveOrgId, user_id: session.user.id, ...row });
      setShowAddContact(false); setNewContact(blankContact);
    } else {
      await supabase.from(table).update(row).eq("id", contactEditId);
      setContactEditId(null);
    }
    setReloadTick(t => t + 1);
  }
  async function deleteContact(table, id, name) {
    if (!window.confirm(`Remove ${name || "this"} from the list? Past invoices and orders keep the name.`)) return;
    await supabase.from(table).delete().eq("id", id);
    setReloadTick(t => t + 1);
  }

  async function createInvoice() {
    const lines = invDraft.lines.filter(l => l.desc.trim());
    if (!invDraft.customer.trim() || lines.length === 0) return;
    const subtotal = lines.reduce((s, l) => s + Math.round((parseFloat(l.price) || 0) * 100) * (parseInt(l.qty) || 1), 0);
    const tax = invDraft.taxStatus === "Taxable" ? Math.round(subtotal * MN_TAX_RATE) : 0;
    const total = subtotal + tax;
    const draft = invDraft;
    const num = entity.nextInvoiceNumber || 1001;
    setShowInvForm(false);
    setInvDraft(blankInvoice);
    if (live && liveOrgId) {
      const { data: newInv } = await supabase.from("invoices").insert({
        org_id: liveOrgId, user_id: session.user.id, invoice_number: String(num),
        customer_name: cleanName(draft.customer), customer_email: draft.email.trim() || null,
        ship_address: (draft.ship || "").trim() || null,
        line_items: lines.map(l => ({ desc: l.desc.trim(), qty: parseInt(l.qty) || 1, price: parseFloat(l.price) || 0 })),
        tax_status: draft.taxStatus, subtotal_cents: subtotal, tax_cents: tax, total_cents: total, status: "draft",
      }).select("id").single();
      if (newInv) { markRecent(newInv.id); await logDocEvent(newInv.id, "created", "Invoice created"); }
      await supabase.from("ledger_orgs").update({ next_invoice_number: num + 1 }).eq("id", liveOrgId);
      setReloadTick(t => t + 1);
    } else {
      setInvoices(prev => [{ id: "inv-" + prev.length, customer: draft.customer, item: lines.map(l => l.desc).join(", "), amount: total / 100, tax: draft.taxStatus, taxAmt: tax / 100, status: "Draft", date: "today" }, ...prev]);
    }
  }

  async function invoiceStatus(id, status) {
    const disp = status === "in_progress" ? "In progress" : status.charAt(0).toUpperCase() + status.slice(1);
    setInvoices(prev => prev.map(v => (v.id === id ? { ...v, status: disp } : v)));
    if (live) {
      const patch = { status };
      patch.paid_at = status === "paid" ? new Date().toISOString() : null;
      if (status === "sent") patch.sent_at = new Date().toISOString();
      if (status === "draft") patch.sent_at = null;
      await supabase.from("invoices").update(patch).eq("id", id);
      setReloadTick(t => t + 1);
    }
  }

  function openPayment(v) {
    const bank = accountList.find(a => a.type === "bank");
    setInvPay({ ...blankInvPay, amount: v.balance != null ? String(v.balance) : String(v.amount || ""), paid_on: new Date().toISOString().slice(0, 10), accountId: bank ? bank.id : "" });
    setPayFor(v);
  }
  async function recordPayment() {
    const inv = payFor;
    const cents = Math.round((parseFloat(invPay.amount) || 0) * 100);
    if (!inv || cents <= 0 || !liveOrgId) return;
    const paidOn = invPay.paid_on || new Date().toISOString().slice(0, 10);
    const acctId = invPay.accountId || null;
    const method = invPay.method;
    const checkNo = method === "check" ? (invPay.check_number.trim() || null) : null;
    setPayFor(null); setInvPay(blankInvPay); setOpenInv(null);
    // The payment record (against the invoice) and a matching money-in line in the
    // notebook (the deposit) are the SAME event — insert both and link them.
    const { data: payRow } = await supabase.from("ledger_payments").insert({
      org_id: liveOrgId, user_id: session.user.id, invoice_id: inv.id,
      amount_cents: cents, method, check_number: checkNo,
      paid_on: paidOn, memo: invPay.memo.trim() || null,
    }).select("id").single();
    const desc = `Payment — ${inv.customer}${inv.number ? ` (Inv #${inv.number})` : ""}${checkNo ? ` · check #${checkNo}` : ""}`;
    const { data: entRow } = await supabase.from("ledger_entries").insert({
      org_id: liveOrgId, user_id: session.user.id, entry_date: paidOn, direction: "in",
      amount_cents: cents, description: desc, category: "Customer payment", account_id: acctId,
      payment_method: method, reference: checkNo, match_status: null,
      invoice_id: inv.id, payment_id: payRow ? payRow.id : null,
    }).select("id").single();
    if (payRow && entRow) await supabase.from("ledger_payments").update({ entry_id: entRow.id }).eq("id", payRow.id);
    if (entRow) markRecent(entRow.id);
    const newPaid = (inv.paidCents || 0) + cents;
    const totalCents = Math.round((inv.amount || 0) * 100);
    const settled = totalCents > 0 && newPaid >= totalCents;
    if (settled) {
      await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", inv.id);
    }
    // Overpayment → drop the excess onto the customer as an open credit (refund or apply later).
    const excess = newPaid - totalCents;
    if (excess > 0 && totalCents > 0) {
      await supabase.from("ledger_credits").insert({
        org_id: liveOrgId, user_id: session.user.id, customer_name: inv.customer,
        amount_cents: excess, memo: `Overpayment on invoice ${inv.number ? "#" + inv.number : ""}`.trim(),
        source_invoice_id: inv.id, status: "open",
      });
    }
    await logDocEvent(inv.id, settled ? "paid" : "payment", (settled ? "Paid in full · " : "Payment · ") + money(cents / 100) + (excess > 0 ? ` (${money(excess / 100)} credit)` : "") + (checkNo ? " · check #" + checkNo : ""));
    setReloadTick(t => t + 1);
  }
  async function deletePaymentRec(p, inv) {
    if (!window.confirm(`Remove this ${money((p.amount_cents || 0) / 100)} payment? Its matching deposit in the notebook is removed too.`)) return;
    setOpenInv(null);
    // Remove the linked notebook deposit as well (same event).
    if (p.entry_id) await supabase.from("ledger_entries").delete().eq("id", p.entry_id);
    await supabase.from("ledger_entries").delete().eq("payment_id", p.id);
    await supabase.from("ledger_payments").delete().eq("id", p.id);
    // If the invoice was marked paid and this drops it below the total, reopen it.
    const remaining = (inv.paidCents || 0) - (p.amount_cents || 0);
    const totalCents = Math.round((inv.amount || 0) * 100);
    if (inv.status === "Paid" && remaining < totalCents) {
      await supabase.from("invoices").update({ status: "sent", paid_at: null }).eq("id", inv.id);
    }
    setReloadTick(t => t + 1);
  }

  // ---- Overpayments / customer credits ----------------------------------------
  // Open the "customer overpaid" resolver. Defaults the amount to any recorded excess.
  function openOverpay(v) {
    const over = v.paidCents != null ? Math.max(0, v.paidCents - Math.round((v.amount || 0) * 100)) : 0;
    setOverpayAmt(over > 0 ? String(over / 100) : "");
    setOverpayFor(v);
  }
  // "Keep as account credit" — a credit on the customer they can put toward a future invoice.
  async function keepAsCredit() {
    const v = overpayFor;
    const cents = Math.round((parseFloat(overpayAmt) || 0) * 100);
    if (!v || cents <= 0 || !liveOrgId) return;
    setOverpayFor(null); setOpenInv(null);
    await supabase.from("ledger_credits").insert({
      org_id: liveOrgId, user_id: session.user.id, customer_name: v.customer,
      amount_cents: cents, memo: `Overpayment on invoice ${v.number ? "#" + v.number : ""}`.trim(),
      source_invoice_id: v.id, status: "open",
    });
    setReloadTick(t => t + 1);
  }
  // "Refund by check" — record the credit as refunded and open the check modal to the customer.
  async function refundOverpay() {
    const v = overpayFor;
    const cents = Math.round((parseFloat(overpayAmt) || 0) * 100);
    if (!v || cents <= 0 || !liveOrgId) return;
    setOverpayFor(null); setOpenInv(null);
    await supabase.from("ledger_credits").insert({
      org_id: liveOrgId, user_id: session.user.id, customer_name: v.customer,
      amount_cents: cents, memo: `Refund of overpayment on invoice ${v.number ? "#" + v.number : ""}`.trim(),
      source_invoice_id: v.id, status: "refunded",
    });
    const banks = accountList.filter(a => a.type === "bank");
    setCheckAcctId(banks[0] ? banks[0].id : "");
    setCheckStartNum(String(entity.nextCheckNumber || 1001));
    setSection("bills"); // the check modal is rendered on the Bills screen
    setCheckFor({ checks: [{ vendor_name: v.customer, amount_cents: cents, category: "Refund", memo: `Refund overpayment${v.number ? " · inv #" + v.number : ""}` }] });
  }
  // Apply an open credit toward an invoice with a balance (no new cash — the money already came in).
  async function applyCredit(credit, inv) {
    if (!credit || !inv || !liveOrgId) return;
    const bal = inv.balanceCents != null ? inv.balanceCents : Math.round((inv.amount || 0) * 100);
    const use = Math.min(credit.amount_cents, bal);
    if (use <= 0) return;
    setOpenInv(null);
    const { data: payRow } = await supabase.from("ledger_payments").insert({
      org_id: liveOrgId, user_id: session.user.id, invoice_id: inv.id,
      amount_cents: use, method: "credit", paid_on: new Date().toISOString().slice(0, 10),
      memo: `Applied credit${credit.source_invoice_id ? "" : ""}`,
    }).select("id").single();
    if ((inv.paidCents || 0) + use >= Math.round((inv.amount || 0) * 100)) {
      await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", inv.id);
    }
    const left = credit.amount_cents - use;
    if (left > 0) await supabase.from("ledger_credits").update({ amount_cents: left }).eq("id", credit.id);
    else await supabase.from("ledger_credits").update({ status: "applied", applied_invoice_id: inv.id }).eq("id", credit.id);
    setReloadTick(t => t + 1);
  }
  // Refund a credit that's sitting on a customer's account (not on any invoice) by check.
  // The credit is marked refunded only when the check is confirmed (cancel keeps it open).
  function refundCredit(credit) {
    if (!credit) return;
    const banks = accountList.filter(a => a.type === "bank");
    setCheckAcctId(banks[0] ? banks[0].id : "");
    setCheckStartNum(String(entity.nextCheckNumber || 1001));
    setSection("bills"); // the check modal lives on the Bills screen
    setCheckFor({ checks: [{ vendor_name: credit.customer_name, amount_cents: credit.amount_cents, category: "Refund", memo: "Refund of account credit (overpayment)" }], _creditId: credit.id });
  }

  // Quick "Mark paid" — records the full payment AND drops a CorTrust deposit in the
  // notebook (she deposits on her phone when she marks it). Skips if already recorded.
  async function quickMarkPaid(v) {
    if (!live || !liveOrgId) { invoiceStatus(v.id, "paid"); setOpenInv(null); return; }
    if ((v.payments || []).length > 0) { await invoiceStatus(v.id, "paid"); setOpenInv(null); return; }
    const cents = (v.balanceCents != null && v.balanceCents > 0) ? v.balanceCents : Math.round((v.amount || 0) * 100);
    const bank = accountList.find(a => a.type === "bank");
    const paidOn = new Date().toISOString().slice(0, 10);
    setOpenInv(null);
    const { data: payRow } = await supabase.from("ledger_payments").insert({
      org_id: liveOrgId, user_id: session.user.id, invoice_id: v.id, amount_cents: cents,
      method: "deposit", paid_on: paidOn, memo: "Marked paid",
    }).select("id").single();
    const { data: entRow } = await supabase.from("ledger_entries").insert({
      org_id: liveOrgId, user_id: session.user.id, entry_date: paidOn, direction: "in",
      amount_cents: cents, description: `Payment — ${v.customer}${v.number ? ` (Inv #${v.number})` : ""}`,
      category: "Customer payment", account_id: bank ? bank.id : null, match_status: null,
      invoice_id: v.id, payment_id: payRow ? payRow.id : null,
    }).select("id").single();
    if (payRow && entRow) await supabase.from("ledger_payments").update({ entry_id: entRow.id }).eq("id", payRow.id);
    await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", v.id);
    setReloadTick(t => t + 1);
  }

  function sendInvoice(v) {
    const url = window.location.origin + "/i/" + v.token;
    const emailText = `Hi ${v.customer},\n\nHere's your invoice from ${entity.name}${v.number ? " (No. " + v.number + ")" : ""} for ${money(v.amount)}.\n\nView it here: ${url}\n\n${entity.customerNote || "Thank you for your business."}`;
    if (v.status === "Draft") invoiceStatus(v.id, "sent");
    try { navigator.clipboard && navigator.clipboard.writeText(url); } catch (e) { /* clipboard may be blocked */ }
    setEmailState(null);
    setSentLink({ url, emailText, customer: v.customer, invoiceId: v.id, email: v.email });
    setOpenInv(null);
  }

  // Print just the open document. The app (header + body) is hidden during the print so
  // the tall page behind the modal doesn't spill out as blank/extra pages.
  function printDoc() {
    const els = Array.from(document.querySelectorAll(".app-print-hide"));
    const prev = els.map(el => el.style.display);
    els.forEach(el => { el.style.display = "none"; });
    try { window.print(); } finally { els.forEach((el, i) => { el.style.display = prev[i]; }); }
  }
  // Open the invoice's online page directly (preview mode — doesn't mark it viewed),
  // so nobody has to copy a link just to look at it.
  function openOnline(v) {
    if (!v || !v.token) { window.alert("This invoice doesn't have a share link yet — it'll get one when it's first sent."); return; }
    window.open(window.location.origin + "/i/" + v.token + "?preview=1", "_blank", "noopener");
  }

  // One-click send via the send-invoice-email Edge Function (Resend behind it).
  async function emailInvoiceNow() {
    if (!sentLink || !sentLink.invoiceId) return;
    if (testMode) { setEmailState({ ok: "nobody — test mode, not really sent" }); return; }
    setEmailState("sending");
    try {
      const { data, error } = await supabase.functions.invoke("send-invoice-email", {
        body: { invoice_id: sentLink.invoiceId, origin: window.location.origin },
      });
      if (error || (data && data.error)) {
        let msg = (data && data.error) || (error && error.message) || "Send failed.";
        try { if (error && error.context && typeof error.context.json === "function") { const b = await error.context.json(); if (b && b.error) msg = b.error; } } catch (e) { /* keep msg */ }
        setEmailState({ err: msg });
      } else {
        const to = data && data.to ? data.to : sentLink.email;
        setEmailState({ ok: to });
        await logDocEvent(sentLink.invoiceId, "sent", "Emailed to " + (to || "customer"));
        setReloadTick(t => t + 1);
      }
    } catch (e) {
      setEmailState({ err: String(e) });
    }
  }

  // Email a PO to the vendor. QBO didn't bring most vendor emails, so Dave can type it
  // here — we save it to the vendor record (so it's remembered) and send via the hub.
  async function sendPO(orderArg, toArg) {
    const order = orderArg || openInv;
    if (!order) return;
    const to = ((toArg != null ? toArg : poEmailTo) || "").trim();
    if (!to || !/.+@.+\..+/.test(to)) { setPoEmailMsg({ err: "Type the vendor's email address first." }); return; }
    if (testMode) { setPoEmailMsg({ ok: "nobody — test mode, not really sent" }); return; }
    setPoEmailMsg({ sending: true });
    try {
      if (live && liveOrgId && order.vendor) {
        await supabase.from("ledger_vendors").update({ email: to }).eq("org_id", liveOrgId).ilike("name", order.vendor);
      }
      const { data, error } = await supabase.functions.invoke("send-po-email", {
        body: { order_id: order.id, to, origin: window.location.origin },
      });
      if (error || (data && data.error)) {
        let msg = (data && data.error) || (error && error.message) || "Send failed.";
        try { if (error && error.context && typeof error.context.json === "function") { const b = await error.context.json(); if (b && b.error) msg = b.error; } } catch (e) { /* keep msg */ }
        setPoEmailMsg({ err: msg });
      } else {
        setPoEmailMsg({ ok: data && data.to ? data.to : to });
        // Emailing a PO counts as sending it → it moves to the Purchase Orders screen.
        if (order.docType === "order") await supabase.from("invoices").update({ status: "po_sent" }).eq("id", order.id);
        await logDocEvent(order.id, "sent", "PO emailed to " + to);
        setReloadTick(t => t + 1);
      }
    } catch (e) { setPoEmailMsg({ err: String(e) }); }
  }

  // Open the one-click "Email this PO" popup from a list row, prefilling the vendor's email.
  function openPoSend(v) {
    const vd = (entity.vendorList || []).find(x => (x.name || "").toLowerCase() === (v.vendor || "").toLowerCase()) || {};
    setPoEmailTo(vd.email || "");
    setPoEmailMsg(null);
    setPoSend(v);
  }

  function poSendModal() {
    if (!poSend) return null;
    const v = poSend;
    const costTot = (v.lines || []).reduce((s, l) => s + (l.cost || 0) * (l.qty || 1), 0);
    return (
      <div onClick={() => setPoSend(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 16px", zIndex: 240 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: N.white, borderRadius: 12, width: "100%", maxWidth: 520, boxShadow: "0 24px 70px rgba(10,10,20,0.35)", padding: 22 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 4 }}>Email PO #{v.poNumber || "—"} to {v.vendor || "vendor"}</div>
          <div style={{ fontSize: 13, color: N.muted, marginBottom: 14 }}>{v.item ? v.item + " · " : ""}cost {money(costTot)}. Once it sends, this PO moves to <b style={{ color: N.blueDark }}>Purchase Orders</b> and is marked sent.</div>
          {poEmailMsg && poEmailMsg.ok ? (
            <div style={{ background: "#eafaf0", border: "1px solid #bff0d3", borderRadius: 10, padding: 14, fontSize: 14, color: N.pinkDark, fontWeight: 600 }}>✓ PO sent to {poEmailMsg.ok}</div>
          ) : (
            <>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, marginBottom: 4 }}>VENDOR EMAIL</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input value={poEmailTo} onChange={e => setPoEmailTo(e.target.value)} placeholder="vendor@email.com" inputMode="email" autoFocus style={{ ...inputSt, flex: 1 }} />
                <button onClick={() => sendPO(v, poEmailTo)} disabled={!!(poEmailMsg && poEmailMsg.sending)} style={{ ...btnBlue, background: (poEmailMsg && poEmailMsg.sending) ? N.mutedLite : N.blue }}>{poEmailMsg && poEmailMsg.sending ? "Sending…" : "Send PO"}</button>
              </div>
              <div style={{ fontSize: 12, color: N.muted }}>We'll save this to the vendor's record so it's remembered next time.</div>
              {poEmailMsg && poEmailMsg.err && <div style={{ fontSize: 12, color: N.red, marginTop: 8 }}>{poEmailMsg.err}</div>}
            </>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={() => setPoSend(null)} style={btnPaper(N.muted)}>{poEmailMsg && poEmailMsg.ok ? "Done" : "Cancel"}</button>
          </div>
        </div>
      </div>
    );
  }

  // Email the customer a "paid in full" receipt (they don't get one automatically).
  async function emailReceipt(inv) {
    if (!inv) return;
    if (testMode) { setReceiptMsg({ ok: "nobody — test mode, not really sent" }); return; }
    setReceiptMsg({ sending: true });
    try {
      const { data, error } = await supabase.functions.invoke("send-receipt-email", { body: { invoice_id: inv.id } });
      if (error || (data && data.error)) {
        let msg = (data && data.error) || (error && error.message) || "Send failed.";
        try { if (error && error.context && typeof error.context.json === "function") { const b = await error.context.json(); if (b && b.error) msg = b.error; } } catch (e) { /* keep msg */ }
        setReceiptMsg({ err: msg });
      } else {
        const to = data && data.to ? data.to : "the customer";
        setReceiptMsg({ ok: to });
        await logDocEvent(inv.id, "receipt", "Paid receipt emailed to " + to);
        setReloadTick(t => t + 1);
      }
    } catch (e) { setReceiptMsg({ err: String(e) }); }
  }

  // Prefill the PO email box from the vendor record whenever a PO opens.
  useEffect(() => {
    setPoEmailMsg(null); setReceiptMsg(null); setPackMode(false); setDocMoreOpen(false);
    if (openInv && openInv.docType === "order") {
      const vd = (entity.vendorList || []).find(v => (v.name || "").toLowerCase() === (openInv.vendor || "").toLowerCase()) || {};
      setPoEmailTo(vd.email || "");
    }
  }, [openInv]);

  // The invoice / PO document — rendered once at the top level so it opens from any
  // screen (Invoices AND New Orders). Print lets you Save as PDF from the dialog.
  function docModal() {
    if (!openInv) return null;
    const invLines = openInv.lines && openInv.lines.length ? openInv.lines : [{ desc: openInv.item, qty: 1, price: openInv.subtotal || openInv.amount }];
    const cleanDesc = d => (/^QuickBooks invoice #/.test(d || "") ? "Signs & graphics" : d);
    const bc = (entity.customers || []).find(c => (c.name || "").toLowerCase() === (openInv.customer || "").toLowerCase()) || {};
    const brand = entity.brandColor || N.blue;
    const logo = entity.logoUrl;
    const isPo = openInv.docType === "order";
    const rateOf = l => (isPo ? (l.cost || 0) : (l.price || 0));
    const docSub = invLines.reduce((s, l) => s + rateOf(l) * (l.qty || 1), 0);
    // Open credits on this customer's account (from a past overpayment) and this invoice's balance.
    const custCredits = (entity.credits || []).filter(cr => cr.status === "open" && (cr.customer_name || "").toLowerCase() === (openInv.customer || "").toLowerCase());
    const creditCents = custCredits.reduce((s, cr) => s + (cr.amount_cents || 0), 0);
    const invBalCents = openInv.balanceCents != null ? openInv.balanceCents : Math.round((openInv.amount || 0) * 100);
    // Activity history: logged events + baseline entries synthesized from the invoice's own
    // timestamps, so even imported/old docs show how they got here. Plus a "revised since
    // last sent" flag (he keeps a whole job on one invoice).
    const logged = (entity.docEvents || {})[openInv.id] || [];
    const has = t => logged.some(ev => ev.event_type === t);
    const synth = [];
    if (!has("created") && openInv.createdAt) synth.push({ id: "s-c", event_type: "created", detail: openInv.number ? "On file (from QuickBooks)" : "Job started", created_at: openInv.createdAt });
    if (!has("sent") && openInv.sentAt) synth.push({ id: "s-s", event_type: "sent", detail: "Sent to customer", created_at: openInv.sentAt });
    if (!has("viewed") && openInv.viewedAt) synth.push({ id: "s-v", event_type: "viewed", detail: "Opened the link", created_at: openInv.viewedAt });
    if (!has("paid") && !has("payment") && openInv.paidAt) synth.push({ id: "s-p", event_type: "paid", detail: "Marked paid", created_at: openInv.paidAt });
    const events = [...synth, ...logged].sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
    const lastOf = t => events.filter(ev => ev.event_type === t).reduce((m, ev) => (ev.created_at > m ? ev.created_at : m), "");
    const lastSent = lastOf("sent");
    const revised = !!(lastSent && lastOf("revised") > lastSent);
    return (
          <div onClick={() => setOpenInv(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "44px 16px", zIndex: 200, overflowY: "auto" }}>
            <div onClick={e => e.stopPropagation()} className="print-doc" style={{ background: N.white, borderRadius: 12, width: "100%", maxWidth: 640, boxShadow: "0 24px 70px rgba(10,10,20,0.35)", overflow: "hidden" }}>
              {/* The invoice document */}
              <div style={{ padding: "34px 40px 26px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 28 }}>
                  <div>
                    {logo ? <img src={logo} alt={entity.name} style={{ maxHeight: 56, maxWidth: 280, display: "block", marginBottom: 4 }} /> : <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{entity.name}</div>}
                    <div style={{ fontSize: 12, color: N.muted, marginTop: 3 }}>Minnesota{entity.fiscalYearEnd ? ` · fiscal year ends ${entity.fiscalYearEnd}` : ""}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, letterSpacing: "0.16em", color: brand, fontWeight: 500 }}>{packMode ? "PACKING SLIP" : (isPo ? "PURCHASE ORDER" : "INVOICE")}</div>
                    {isPo ? (openInv.poNumber && <div style={{ fontSize: 13, color: N.ink, marginTop: 5 }}>PO #{openInv.poNumber}</div>) : (openInv.number && <div style={{ fontSize: 13, color: N.ink, marginTop: 5 }}>No. {openInv.number}{revised && <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#8a5a00", background: "#fdf5e3", border: "1px solid #f0d89a", borderRadius: 6, padding: "1px 7px", marginLeft: 8 }}>REVISED</span>}</div>)}
                    <div style={{ fontSize: 12, color: N.muted, marginTop: 2 }}>Date: {openInv.date}</div>
                  </div>
                </div>

                {isPo ? (() => {
                  const vd = (entity.vendorList || []).find(v => (v.name || "").toLowerCase() === (openInv.vendor || "").toLowerCase()) || {};
                  return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                    <div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.muted, marginBottom: 4 }}>VENDOR</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: N.ink }}>{openInv.vendor || "—"}</div>
                      {vd.billing_address ? <div style={{ fontSize: 13, color: N.muted, whiteSpace: "pre-line" }}>{vd.billing_address}</div> : null}
                      {vd.email ? <div style={{ fontSize: 13, color: N.muted }}>{vd.email}</div> : null}
                      {vd.phone ? <div style={{ fontSize: 13, color: N.muted }}>{vd.phone}</div> : null}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.muted, marginBottom: 4 }}>SHIP TO</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: N.ink }}>{entity.name}</div>
                      {entity.remitAddress ? <div style={{ fontSize: 13, color: N.muted, whiteSpace: "pre-line" }}>{entity.remitAddress}</div> : null}
                      {openInv.customer && openInv.customer !== "—" ? <div style={{ fontSize: 12, color: N.mutedLite, marginTop: 4 }}>For customer: {openInv.customer}</div> : null}
                    </div>
                  </div>
                  );
                })() : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.muted, marginBottom: 4 }}>BILL TO</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: N.ink }}>{openInv.customer}</div>
                    {bc.billing_address ? <div style={{ fontSize: 13, color: N.muted, whiteSpace: "pre-line" }}>{bc.billing_address}</div> : null}
                    {(openInv.email || bc.email) ? <div style={{ fontSize: 13, color: N.muted }}>{openInv.email || bc.email}</div> : null}
                    {bc.phone ? <div style={{ fontSize: 13, color: N.muted }}>{bc.phone}</div> : null}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.muted, marginBottom: 4 }}>SHIP TO</div>
                    {openInv.shipAddress ? (
                      <div style={{ fontSize: 13, color: N.ink, whiteSpace: "pre-line" }}>{openInv.shipAddress}</div>
                    ) : (<>
                      <div style={{ fontSize: 15, fontWeight: 600, color: N.ink }}>{openInv.customer}</div>
                      {bc.billing_address ? <div style={{ fontSize: 13, color: N.muted, whiteSpace: "pre-line" }}>{bc.billing_address}</div> : <div style={{ fontSize: 12, color: N.mutedLite, fontStyle: "italic" }}>Same as billing</div>}
                    </>)}
                  </div>
                </div>
                )}

                {!isPo && creditCents > 0 && (
                  <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#eafaf0", border: "1px solid #bff0d3", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                    <span style={{ fontSize: 13, color: N.pinkDark, fontWeight: 600 }}>{openInv.customer} has a {money(creditCents / 100)} credit on file.</span>
                    {invBalCents > 0 && <button onClick={() => applyCredit(custCredits[0], openInv)} style={{ ...btnBlue, background: N.pinkDark }}>Apply {money(Math.min(creditCents, invBalCents) / 100)} to this invoice</button>}
                  </div>
                )}
                <div style={{ border: "1px solid " + N.rule, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: packMode ? "1fr 60px" : "1fr 46px 86px 92px", gap: 8, padding: "10px 14px", background: "#f7fafd", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted }}>
                    <span>DESCRIPTION</span><span style={{ textAlign: "center" }}>QTY</span>{!packMode && <><span style={{ textAlign: "right" }}>RATE</span><span style={{ textAlign: "right" }}>AMOUNT</span></>}
                  </div>
                  {invLines.map((l, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: packMode ? "1fr 60px" : "1fr 46px 86px 92px", gap: 8, padding: "11px 14px", borderTop: "1px solid " + N.rule, fontSize: 14, color: N.text }}>
                      <span>{cleanDesc(l.desc)}{(isPo || packMode) && l.item ? <span style={{ color: N.mutedLite }}> · {l.item}</span> : null}</span>
                      <span style={{ textAlign: "center", color: packMode ? N.ink : N.muted, fontWeight: packMode ? 700 : 400 }}>{l.qty || 1}</span>
                      {!packMode && <><span style={{ textAlign: "right", color: N.muted }}>{money(rateOf(l))}</span>
                      <span style={{ textAlign: "right", fontWeight: 500, color: N.ink }}>{money(rateOf(l) * (l.qty || 1))}</span></>}
                    </div>
                  ))}
                </div>

                {!packMode && <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  {isPo ? (
                  <div style={{ width: 250 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, color: N.ink, padding: "9px 0 0", borderTop: "2px solid " + N.ink }}><span>PO total</span><span>{money(docSub)}</span></div>
                    <div style={{ fontSize: 12, color: N.mutedLite, marginTop: 4 }}>What you pay the vendor for this job.</div>
                  </div>
                  ) : (
                  <div style={{ width: 260 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: N.muted, padding: "3px 0" }}><span>Subtotal</span><span>{money(openInv.subtotal || openInv.amount)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: N.muted, padding: "3px 0" }}><span>MN sales tax{openInv.tax === "Taxable" ? " (9.25%)" : ""}</span><span>{money(openInv.taxAmt)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, color: N.ink, padding: "9px 0 0", marginTop: 5, borderTop: "2px solid " + N.ink }}><span>Total</span><span>{money(openInv.amount)}</span></div>
                    {(openInv.payments || []).map((p, pi) => (
                      <div key={p.id || pi} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#a16207", padding: "2px 0" }}>
                        <span>{fmtPay(p)}</span>
                        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>−{money((p.amount_cents || 0) / 100)}<button className="no-print" onClick={() => deletePaymentRec(p, openInv)} title="Remove payment" style={{ border: "none", background: "none", color: N.mutedLite, cursor: "pointer", fontSize: 15, lineHeight: 1, padding: 0 }}>×</button></span>
                      </div>
                    ))}
                    {(() => {
                      const bal = openInv.balanceCents != null ? openInv.balanceCents / 100 : (openInv.status === "Paid" ? 0 : openInv.amount);
                      const paidInFull = bal <= 0 && openInv.amount > 0;
                      return (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginTop: 7, paddingTop: 6, borderTop: "1px solid " + N.rule, fontWeight: 700, color: paidInFull ? N.green : N.red }}>
                          <span>{paidInFull ? "Paid in full — thank you" : "Balance due"}</span><span>{money(bal)}</span>
                        </div>
                      );
                    })()}
                  </div>
                  )}
                </div>}

                {!packMode ? (isPo ? (
                <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid " + N.rule, fontSize: 12, color: N.muted, lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, color: N.text, marginBottom: 2 }}>Ship to</div>
                  <div style={{ whiteSpace: "pre-line", color: N.text }}>{entity.remitAddress || entity.name}</div>
                  <div style={{ marginTop: 6 }}>Please produce the items above and ship to us. Reference PO #{openInv.poNumber} on your invoice.</div>
                </div>
                ) : (
                <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid " + N.rule, fontSize: 12, color: N.muted, lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, color: N.text, marginBottom: 2 }}>Payment instructions</div>
                  <div>Please send checks to:</div>
                  <div style={{ whiteSpace: "pre-line", color: N.text }}>{entity.remitAddress || entity.name}</div>
                  {entity.ach && (entity.ach.routing || entity.ach.bank) ? (
                    <div style={{ marginTop: 6 }}>Prefer to pay by bank? ACH to {entity.ach.bank || "our bank"}{entity.ach.routing ? ` · routing ${entity.ach.routing}` : ""}{entity.ach.account ? ` · account ${entity.ach.account}` : ""}. (Please cover any bank fee.){entity.ach.notify ? ` If you pay by ACH, please email ${entity.ach.notify} so we can record it.` : ""}</div>
                  ) : null}
                  {entity.customerNote ? <div style={{ marginTop: 10, fontStyle: "italic", color: N.text }}>{entity.customerNote}</div> : null}
                </div>
                )) : (
                <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid " + N.rule, fontSize: 12, color: N.text, lineHeight: 1.6 }}><b>Packing slip</b> — prices omitted. Please check off every item above as you pack, and verify on receipt.</div>
                )}
              </div>

              {events.length > 0 && (
                <div className="no-print" style={{ padding: "12px 26px", borderTop: "1px solid " + N.rule, background: "#fbfdff" }}>
                  <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", color: N.muted, marginBottom: 8 }}>HISTORY</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {events.slice().reverse().map(ev => {
                      const L = { created: "Created", revised: "Revised", sent: "Sent", viewed: "Viewed by customer", billed: "Billed", payment: "Payment", paid: "Paid in full", receipt: "Receipt emailed" }[ev.event_type] || ev.event_type;
                      const col = ev.event_type === "viewed" ? N.blue : ev.event_type === "paid" ? N.green : ev.event_type === "revised" ? "#8a5a00" : N.muted;
                      const d = ev.created_at ? new Date(ev.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
                      return (
                        <div key={ev.id} style={{ display: "flex", alignItems: "baseline", gap: 10, fontSize: 12.5 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 100, background: col, flexShrink: 0, alignSelf: "center" }} />
                          <span style={{ fontWeight: 600, color: N.ink, minWidth: 116 }}>{L}</span>
                          <span style={{ flex: 1, color: N.muted, minWidth: 0 }}>{ev.detail || ""}</span>
                          <span style={{ color: N.mutedLite, whiteSpace: "nowrap" }}>{d}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isPo && (
                <div className="no-print" style={{ padding: "12px 22px", borderTop: "1px solid " + N.rule, background: N.white, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: N.muted }}>Email this PO to the vendor:</span>
                  <input value={poEmailTo} onChange={e => setPoEmailTo(e.target.value)} placeholder="vendor@email.com" inputMode="email" style={{ ...inputSt, width: 220 }} />
                  <button onClick={() => sendPO()} disabled={!!(poEmailMsg && poEmailMsg.sending)} style={{ ...btnBlue, background: (poEmailMsg && poEmailMsg.sending) ? N.mutedLite : N.blue }}>{poEmailMsg && poEmailMsg.sending ? "Sending…" : "Email PO"}</button>
                  {poEmailMsg && poEmailMsg.ok && <span style={{ fontSize: 12, color: N.green, fontWeight: 600 }}>✓ Sent to {poEmailMsg.ok}</span>}
                  {poEmailMsg && poEmailMsg.err && <span style={{ fontSize: 12, color: N.red }}>{poEmailMsg.err}</span>}
                </div>
              )}

              {!isPo && openInv.status === "Paid" && (
                <div className="no-print" style={{ padding: "12px 22px", borderTop: "1px solid " + N.rule, background: N.white, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: N.muted }}>Send the customer a paid-in-full receipt:</span>
                  <button onClick={() => emailReceipt(openInv)} disabled={!!(receiptMsg && receiptMsg.sending)} style={{ ...btnBlue, background: (receiptMsg && receiptMsg.sending) ? N.mutedLite : N.green }}>{receiptMsg && receiptMsg.sending ? "Sending…" : "Email paid receipt"}</button>
                  {receiptMsg && receiptMsg.ok && <span style={{ fontSize: 12, color: N.green, fontWeight: 600 }}>✓ Sent to {receiptMsg.ok}</span>}
                  {receiptMsg && receiptMsg.err && <span style={{ fontSize: 12, color: N.red }}>{receiptMsg.err}</span>}
                </div>
              )}

              <div className="no-print" style={{ padding: "14px 22px", borderTop: "1px solid " + N.rule, background: "#f7fafd", display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ marginRight: "auto", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: STATUS_COLOR[openInv.status] || N.muted }}>{openInv.status}</span>
                <button onClick={printDoc} style={{ ...btnBlue, background: N.blue }}>Print / Save PDF</button>
                <button onClick={() => setPackMode(m => !m)} title="Show a packing slip — items & quantities, no prices" style={{ ...btnBlue, background: N.blue }}>{packMode ? `← Back to ${isPo ? "PO" : "invoice"}` : "📦 Packing slip"}</button>
                {!packMode && (isPo ? (
                  <>
                    <button onClick={() => { const v = openInv; setOpenInv(null); editOrder(v); }} style={btnPaper(N.muted)}>Edit</button>
                    {openInv.customer && openInv.customer !== "—" && openInv.status !== "Invoiced" && <button onClick={() => { const v = openInv; setOpenInv(null); convertToInvoice(v); }} style={{ ...btnBlue, background: N.blue }}>Convert to invoice →</button>}
                    {openInv.status === "Invoiced" && <span style={{ fontSize: 12, fontWeight: 700, color: "#5a7a63", background: "#eef7f0", border: "1px solid #cfe9d6", borderRadius: 100, padding: "6px 12px", alignSelf: "center" }}>✓ Invoiced</span>}
                    <button onClick={() => { const id = openInv.id; setOpenInv(null); deleteOrder(id); }} style={btnPaper(N.pinkDark)}>Delete</button>
                  </>
                ) : (
                  <>
                    {/* Primary — the everyday actions */}
                    {openInv.status !== "Paid" && openInv.status !== "Void" && <button onClick={() => sendInvoice(openInv)} style={{ ...btnBlue, background: N.blue }}>{openInv.status === "Draft" ? "Send · get link" : "Copy / resend link"}</button>}
                    {openInv.status !== "Void" && <button onClick={() => openPayment(openInv)} title="Full, partial, or over — type the amount received" style={{ ...btnBlue, background: N.pinkDark }}>💵 Payment</button>}
                    {openInv.status !== "Void" && <button onClick={() => { const v = openInv; setOpenInv(null); editOrder(v); }} style={btnPaper(N.muted)}>Edit</button>}
                    <button onClick={() => setDocMoreOpen(o => !o)} style={btnPaper(N.blueDark)}>⋯ More</button>
                    {docMoreOpen && (
                      <>
                        <button onClick={() => openOnline(openInv)} style={btnPaper(N.blueDark)}>👁 Open online</button>
                        {openInv.status !== "In progress" && openInv.status !== "Paid" && openInv.status !== "Void" && <button onClick={() => { invoiceStatus(openInv.id, "in_progress"); setOpenInv(null); }} style={btnPaper("#8a5a00")}>Mark in progress</button>}
                        {openInv.status === "In progress" && <button onClick={() => { invoiceStatus(openInv.id, "draft"); setOpenInv(null); }} style={btnPaper(N.blue)}>Done building</button>}
                        {openInv.status === "Paid" && (openInv.payments || []).length === 0 && <button onClick={() => { invoiceStatus(openInv.id, "sent"); setOpenInv(null); }} style={btnPaper(N.muted)}>Unmark paid</button>}
                        {(openInv.status === "Sent" || openInv.status === "Viewed") && <button onClick={() => { invoiceStatus(openInv.id, "draft"); setOpenInv(null); }} style={btnPaper(N.muted)}>← Back to draft</button>}
                        {openInv.status !== "Void" && <button onClick={() => voidInvoice(openInv)} style={btnPaper(N.muted)}>Void</button>}
                        <button onClick={() => deleteInvoice(openInv)} style={btnPaper(N.pinkDark)}>Delete</button>
                      </>
                    )}
                  </>
                ))}
                <button onClick={() => setOpenInv(null)} style={btnPaper(N.muted)}>Close</button>
              </div>
            </div>
          </div>
    );
  }

  function overpayModal() {
    if (!overpayFor) return null;
    const v = overpayFor;
    const cents = Math.round((parseFloat(overpayAmt) || 0) * 100);
    return (
      <div onClick={() => setOverpayFor(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "70px 16px", zIndex: 230 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: N.white, borderRadius: 12, width: "100%", maxWidth: 460, boxShadow: "0 24px 70px rgba(10,10,20,0.35)", padding: 22 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 4 }}>Customer overpaid</div>
          <div style={{ fontSize: 13, color: N.muted, marginBottom: 16 }}>{v.customer}{v.number ? ` · invoice #${v.number}` : ""}. Enter how much they overpaid, then keep it as a credit or cut a refund check.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: N.muted }}>Overpaid by $</span>
            <input inputMode="decimal" value={overpayAmt} onChange={e => setOverpayAmt(e.target.value)} placeholder="0.00" style={{ ...inputSt, width: 120, textAlign: "right", fontWeight: 700 }} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={keepAsCredit} disabled={cents <= 0} style={{ ...btnBlue, background: cents > 0 ? N.blue : N.mutedLite }}>Keep as account credit</button>
            <button onClick={refundOverpay} disabled={cents <= 0} style={{ ...btnBlue, background: cents > 0 ? N.pinkDark : N.mutedLite }}>Refund by check →</button>
            <button onClick={() => setOverpayFor(null)} style={btnPaper(N.muted)}>Cancel</button>
          </div>
          <div style={{ fontSize: 12, color: N.mutedLite, marginTop: 12 }}>A credit sits on their account until you apply it to a future invoice. Refund opens a check to print.</div>
        </div>
      </div>
    );
  }

  function helpModal() {
    if (!helpOpen) return null;
    const Chip = ({ children, c }) => <span style={{ display: "inline-block", fontSize: 12, fontWeight: 600, color: "#fff", background: c || N.blue, borderRadius: 7, padding: "3px 9px", margin: "0 3px", whiteSpace: "nowrap" }}>{children}</span>;
    const daveSteps = [
      { n: 1, t: "Start a job", tab: "New Orders", body: (<>Go to <Chip c={N.blueDark}>New Orders</Chip>, click <Chip>+ New order</Chip>. Pick the customer, add each item and its price. If a vendor makes it, turn on <Chip c="#334155">Add a PO to a vendor</Chip> and enter the vendor + your cost. Then <Chip>Save job →</Chip>. It waits in New Orders while you build it.</>) },
      { n: 2, t: "Send the PO to your vendor", tab: "New Orders", body: (<>Open the job, hit <Chip c="#334155">View / print / email</Chip>, type the vendor's email and press <Chip>Email PO</Chip>. Once it sends, the PO moves over to <Chip c={N.blueDark}>Purchase Orders</Chip>.</>) },
      { n: 3, t: "Bill the customer when it's done", tab: "New Orders", body: (<>Open the job and click <Chip>Convert to invoice →</Chip>. Now it's a real invoice with a number.</>) },
      { n: 4, t: "Send the invoice", tab: "Invoices", body: (<>Go to <Chip c={N.blueDark}>Invoices</Chip>, click <Chip>Send</Chip>. It emails the customer and gives you a link — you'll see <b style={{ color: N.blue }}>Viewed</b> when they open it.</>) },
      { n: 5, t: "Get paid", tab: "Invoices", body: (<>When the money's in, open the invoice → <Chip c={N.pinkDark}>Mark paid</Chip>. Taking a deposit up front? <Chip c={N.pinkDark}>Down payment / partial…</Chip>. Customer overpaid? <Chip c="#64748b">Overpaid…</Chip> → refund a check or keep it as their credit.</>) },
      { n: 6, t: "Pay a vendor by check", tab: "Bills", body: (<>Go to <Chip c={N.blueDark}>Bills</Chip>, check the ones you're paying, hit <Chip c={N.pinkDark}>Pay by check</Chip>. Set the check number to match your stock, nudge it to line up, and <Chip>Print</Chip>. You can print 3–4 at once.</>) },
    ];
    const bettySteps = [
      { n: 1, t: "Check off your bank & card lines", tab: "Notebook", body: (<>Your bank and card activity lands in the <Chip c={N.blueDark}>Notebook</Chip> — each line is money <b style={{ color: N.green }}>in</b> or money <b style={{ color: N.red }}>out</b>. When you've got the receipt or it's fine as-is, click <Chip c="#64748b">Got it</Chip>. New ones sit at the top under <b>Recently entered</b> so you can eyeball them first.</>) },
      { n: 2, t: "Record a payment a customer sent", tab: "Invoices", body: (<>Open their invoice → <Chip c={N.pinkDark}>Mark paid</Chip> (or <Chip c={N.pinkDark}>Down payment / partial…</Chip> for a deposit). It automatically drops the matching deposit in your Notebook — you don't enter it twice.</>) },
      { n: 3, t: "Tie a deposit to the right invoice", tab: "Notebook", body: (<>On a money-<b style={{ color: N.green }}>in</b> line, use the <Chip c="#8a5a00">What is this?</Chip> dropdown → pick the invoice it pays (or <b>Refund</b> / <b>Other income</b>). It marks that invoice paid for you.</>) },
      { n: 4, t: "Pay a bill by check", tab: "Bills", body: (<>Go to <Chip c={N.blueDark}>Bills</Chip>, tick the ones you're paying, hit <Chip c={N.pinkDark}>Pay by check</Chip>. Set the check number to match your stock, nudge it to line up, and <Chip>Print</Chip>.</>) },
      { n: 5, t: "Reconcile to your statement", tab: "Notebook", body: (<>In the Notebook, pick the account up top, then <Chip c={N.pink}>Reconcile</Chip>. Tick each line that's on your paper statement (it gets an <b>R</b>) until the difference reads <b>$0.00</b> — then lock it.</>) },
      { n: 6, t: "See who still owes you", tab: "Reports", body: (<>Open <Chip c={N.blueDark}>Reports</Chip> — it starts with <b>Who owes you (A/R)</b>: every unpaid invoice and any customer credits from overpayments.</>) },
    ];
    const who = helpWho === "betty" ? "betty" : "dave";
    const steps = who === "betty" ? bettySteps : daveSteps;
    return (
      <div onClick={() => setHelpOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", zIndex: 240, overflowY: "auto" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: N.white, borderRadius: 16, width: "100%", maxWidth: 620, boxShadow: "0 24px 70px rgba(10,10,20,0.4)", overflow: "hidden" }}>
          <div style={{ padding: "22px 26px", background: "linear-gradient(120deg,#0080ff,#0057b8)", color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24 }}>{who === "betty" ? "Betty's quick guide" : "Dave's quick guide"}</div>
              <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.18)", borderRadius: 100, padding: 3 }}>
                {[["dave", "Dave"], ["betty", "Betty"]].map(([k, lbl]) => (
                  <button key={k} onClick={() => setHelpWho(k)} style={{ border: "none", cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 100, background: who === k ? "#fff" : "transparent", color: who === k ? N.blueDark : "#fff" }}>{lbl}</button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>{who === "betty" ? "Money in, money out, and getting it all to match. Nothing here can break anything." : "Six steps, start to paid. Nothing here can break anything — click around."}</div>
          </div>
          <div style={{ padding: "18px 26px 8px", maxHeight: "62vh", overflowY: "auto" }}>
            {steps.map(s => (
              <div key={s.n} style={{ display: "flex", gap: 14, marginBottom: 18 }}>
                <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 100, background: "#eef6ff", color: N.blueDark, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, fontFamily: "'DM Serif Display', serif" }}>{s.n}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: N.ink }}>{s.t}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: N.muted, background: "#f1f5f9", borderRadius: 100, padding: "2px 8px" }}>{s.tab.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 14, color: N.text, lineHeight: 1.7 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 26px", borderTop: "1px solid " + N.rule, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 12, color: N.muted }}>Stuck? Betty or Kari can jump in. Open this anytime with the <b style={{ color: N.blueDark }}>?</b> up top.</span>
            <button onClick={() => setHelpOpen(false)} style={{ ...btnBlue, background: N.blue, fontSize: 14, padding: "9px 18px" }}>Got it</button>
          </div>
        </div>
      </div>
    );
  }

  function importModal() {
    if (!importAcctId) return null;
    const acct = accountList.find(a => a.id === importAcctId);
    const d = importData;
    const setMap = (k, v) => setImportData(p => ({ ...p, map: { ...p.map, [k]: v } }));
    const prev = d ? importRowsPreview() : { entries: [], skipped: 0 };
    const colSel = (val, on, allowNone) => (
      <select value={val} onChange={e => on(parseInt(e.target.value, 10))} style={{ ...inputSt, width: 170 }}>
        {allowNone && <option value={-1}>— none —</option>}
        {d.headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
      </select>
    );
    return (
      <div onClick={() => setImportAcctId(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", zIndex: 240, overflowY: "auto" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: N.white, borderRadius: 14, width: "100%", maxWidth: 720, boxShadow: "0 24px 70px rgba(10,10,20,0.4)", padding: 22 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 21, color: N.ink, marginBottom: 2 }}>Upload a statement — {acct ? acct.name : ""}</div>
          <div style={{ fontSize: 13, color: N.muted, marginBottom: 16 }}>Export your transactions from the bank as a <b>CSV</b>, then drop it here. I match up the columns and load the lines onto this account. Re-uploading the same statement won't double anything.</div>
          {!d ? (
            <label style={{ ...btnBlue, background: N.blue, cursor: "pointer", display: "inline-flex" }}>
              ⬆ Choose a CSV file
              <input type="file" accept=".csv,text/csv" onChange={e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; onImportFile(f); }} style={{ display: "none" }} />
            </label>
          ) : (<>
            <div style={{ fontSize: 12, color: N.muted, marginBottom: 12 }}>{d.fileName} · {d.rows.length} rows</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginBottom: 12 }}>
              <div><div style={{ fontSize: 11, fontWeight: 700, color: N.muted, marginBottom: 4 }}>DATE COLUMN</div>{colSel(d.map.date, v => setMap("date", v))}</div>
              <div><div style={{ fontSize: 11, fontWeight: 700, color: N.muted, marginBottom: 4 }}>DESCRIPTION COLUMN</div>{colSel(d.map.desc, v => setMap("desc", v))}</div>
              <div><div style={{ fontSize: 11, fontWeight: 700, color: N.muted, marginBottom: 4 }}>AMOUNT COLUMN</div>{colSel(d.map.amount, v => setMap("amount", v), true)}</div>
            </div>
            {d.map.amount >= 0 ? (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: N.text, marginBottom: 12 }}>
                <input type="checkbox" checked={!!d.map.posIsOut} onChange={e => setMap("posIsOut", e.target.checked)} />
                A <b>positive</b> number means money <b>OUT</b> (typical for credit-card exports). Leave unchecked for bank exports where withdrawals are negative.
              </label>
            ) : (
              <div style={{ display: "flex", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
                <div><div style={{ fontSize: 11, fontWeight: 700, color: N.muted, marginBottom: 4 }}>WITHDRAWAL / DEBIT COL</div>{colSel(d.map.debit, v => setMap("debit", v), true)}</div>
                <div><div style={{ fontSize: 11, fontWeight: 700, color: N.muted, marginBottom: 4 }}>DEPOSIT / CREDIT COL</div>{colSel(d.map.credit, v => setMap("credit", v), true)}</div>
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 700, color: N.muted, marginBottom: 4 }}>PREVIEW — first few lines as they'll load</div>
            <div style={{ border: "1px solid " + N.rule, borderRadius: 10, overflow: "hidden", marginBottom: 6 }}>
              {prev.entries.slice(0, 6).map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "7px 12px", borderTop: i === 0 ? "none" : "1px solid " + N.rule, fontSize: 13 }}>
                  <span style={{ width: 78, color: N.muted }}>{e.entry_date}</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.description}</span>
                  <span style={{ fontWeight: 600, color: e.direction === "in" ? N.green : N.red }}>{e.direction === "in" ? "+" : "−"}{money(e.amount_cents / 100)}</span>
                </div>
              ))}
              {prev.entries.length === 0 && <div style={{ padding: 14, color: N.red, fontSize: 13 }}>No transactions read yet — pick the right Date and Amount columns above.</div>}
            </div>
            <div style={{ fontSize: 12, color: N.muted, marginBottom: 14 }}>{prev.entries.length} transactions ready{prev.skipped > 0 ? ` · ${prev.skipped} non-transaction rows skipped` : ""}.</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button onClick={() => setImportData(null)} style={btnPaper(N.muted)}>← Choose another file</button>
              <button onClick={runImport} disabled={importBusy || prev.entries.length === 0} style={{ ...btnBlue, background: (importBusy || !prev.entries.length) ? N.mutedLite : N.blue }}>{importBusy ? "Loading…" : `Import ${prev.entries.length} into ${acct ? acct.name : ""}`}</button>
            </div>
          </>)}
          <div style={{ marginTop: 14, textAlign: "right" }}><button onClick={() => setImportAcctId(null)} style={btnPaper(N.muted)}>Close</button></div>
        </div>
      </div>
    );
  }

  async function sendCampaign() {
    if (testMode) { setCampaignResult({ err: "Test mode — nothing was sent." }); return; }
    if (!liveOrgId || !campaign.subject.trim() || !campaign.body.trim()) return;
    if (!window.confirm("Send this to every customer with an email on file? It goes out for real.")) return;
    setCampaignBusy(true); setCampaignResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("send-campaign", { body: { org_id: liveOrgId, subject: campaign.subject, body: campaign.body } });
      if (error || (data && data.error)) {
        let msg = (data && data.error) || (error && error.message) || "Send failed.";
        try { if (error && error.context && typeof error.context.json === "function") { const b = await error.context.json(); if (b && b.error) msg = b.error; } } catch (e) { /* keep msg */ }
        setCampaignResult({ err: msg });
      } else {
        setCampaignResult({ ok: data.sent, failed: data.failed });
        setCampaign(blankCampaign);
      }
    } catch (e) { setCampaignResult({ err: String(e) }); }
    setCampaignBusy(false);
  }

  // Append one entry to a document's history (created / revised / sent / billed / payment).
  async function logDocEvent(invoiceId, type, detail) {
    if (!live || !liveOrgId || !invoiceId) return;
    try { await supabase.from("ledger_doc_events").insert({ org_id: liveOrgId, invoice_id: invoiceId, event_type: type, detail: detail || null }); } catch (e) { /* history is best-effort */ }
  }

  async function createOrder() {
    const lines = orderDraft.lines.filter(l => (l.desc || "").trim() || (l.item || "").trim());
    // A PO can be for Dave himself — customer optional. An invoice still needs someone to bill.
    if (lines.length === 0) return;
    if (orderDraft.mode !== "po" && !orderDraft.customer.trim()) return;
    const subtotal = lines.reduce((s, l) => s + Math.round((parseFloat(l.price) || 0) * 100) * (parseInt(l.qty) || 1), 0);
    const tax = orderDraft.taxStatus === "Taxable" ? Math.round(subtotal * MN_TAX_RATE) : 0;
    const total = subtotal + tax;
    const draft = orderDraft;
    const asPo = draft.mode === "po";
    const editing = editingOrder;
    const po = editing ? (editing.poNumber || entity.nextPoNumber || 2133) : (entity.nextPoNumber || 2133);
    setShowOrderForm(false);
    setOrderDraft(blankOrder);
    setEditingOrder(null);
    if (live && liveOrgId) {
      const known = (entity.customers || []).some(c => (c.name || "").toLowerCase() === cleanName(draft.customer).toLowerCase());
      if (!known && draft.customer.trim()) {
        await supabase.from("ledger_customers").insert({ org_id: liveOrgId, user_id: session.user.id, name: cleanName(draft.customer), email: draft.email.trim() || null });
      }
      // Editable content only. On edit we keep status / doc_type / invoice_number as-is
      // (so an in-progress or paid invoice isn't reset), just updating what Dave changed.
      const fields = {
        customer_name: cleanName(draft.customer) || null, customer_email: draft.email.trim() || null,
        line_items: lines.map(l => ({ item: (l.item || "").trim(), desc: (l.desc || "").trim(), qty: parseInt(l.qty) || 1, cost: parseFloat(l.cost) || 0, price: parseFloat(l.price) || 0 })),
        tax_status: draft.taxStatus, subtotal_cents: subtotal, tax_cents: tax, total_cents: total,
      };
      if (draft.date) fields.issue_date = draft.date;
      fields.ship_address = (draft.ship || "").trim() || null;
      if (asPo) fields.vendor_name = draft.vendor.trim() || null;
      if (editing) {
        await supabase.from("invoices").update(fields).eq("id", editing.id);
        await logDocEvent(editing.id, "revised", "Edited" + (editing.docType === "order" ? " order" : " invoice"));
      } else {
        // Every new job starts as an in-progress ORDER in New Orders (the pending customer
        // bill) — nothing becomes an invoice or gets a number until it's billed (Convert).
        const insertRow = {
          org_id: liveOrgId, user_id: session.user.id,
          doc_type: "order", status: "order",
          po_number: asPo ? String(po) : null, ...fields,
        };
        const { data: newRow } = await supabase.from("invoices").insert(insertRow).select("id").single();
        if (newRow) { markRecent(newRow.id); await logDocEvent(newRow.id, "created", asPo ? "Job started with a PO" : "Job started"); }
        if (asPo) await supabase.from("ledger_orgs").update({ next_po_number: po + 1 }).eq("id", liveOrgId);
      }
      setReloadTick(t => t + 1);
    } else {
      // Test / sample mode: reflect it locally so they can build multi-line docs and see it.
      const itemStr = lines.map(l => (l.desc || l.item || "").trim()).filter(Boolean).join(", ") || "—";
      if (editing) {
        setInvoices(prev => prev.map(v => v.id === editing.id ? { ...v,
          customer: draft.customer.trim() || v.customer, vendor: asPo ? (draft.vendor.trim() || v.vendor) : v.vendor,
          email: draft.email.trim() || v.email, lines: fields.line_items, item: itemStr,
          amount: total / 100, subtotal: subtotal / 100, tax: draft.taxStatus, taxAmt: tax / 100,
          balanceCents: total, balance: total / 100, issueDate: draft.date || v.issueDate,
        } : v));
      } else {
        setInvoices(prev => [{
          id: "local-" + Date.now(), docType: "order", vendor: asPo ? (draft.vendor.trim() || "") : "",
          poNumber: asPo ? String(entity.nextPoNumber || 2133) : "", number: "",
          customer: draft.customer.trim() || "—", email: draft.email.trim() || "", item: itemStr, lines: fields.line_items,
          amount: total / 100, subtotal: subtotal / 100, tax: draft.taxStatus, taxAmt: tax / 100,
          status: "Order", date: "today", issueDate: draft.date || "", paidCents: 0, balanceCents: total, paid: 0, balance: total / 100, payments: [],
        }, ...prev]);
      }
    }
    // After an edit, return to where it lives; new jobs stay on New Orders.
    setSection(editing ? (editing.docType === "order" ? "orders" : "invoices") : "orders");
  }

  function editOrder(v) {
    setEditingOrder(v);
    setOrderDraft({
      mode: v.poNumber ? "po" : "invoice",
      date: v.issueDate || "",
      customer: v.customer === "—" ? "" : v.customer, vendor: v.vendor || "", email: v.email || "", ship: v.shipAddress || "",
      taxStatus: v.tax || "Exempt",
      lines: (v.lines && v.lines.length ? v.lines : [{}]).map(l => ({
        item: l.item || "", desc: l.desc || "", qty: String(l.qty || 1),
        cost: l.cost ? String(l.cost) : "", price: l.price ? String(l.price) : "",
      })),
    });
    setSection("orders");
    setShowOrderForm(true);
  }

  async function deleteOrder(id) {
    if (!window.confirm("Delete this order? This can't be undone.")) return;
    if (live) { await supabase.from("invoices").delete().eq("id", id); setReloadTick(t => t + 1); }
  }

  async function voidInvoice(v) {
    if (!window.confirm(`Void invoice ${v.number ? "#" + v.number : ""}? It stays on record marked VOID but no longer counts toward what's owed or sales tax.`)) return;
    setOpenInv(null);
    await invoiceStatus(v.id, "void");
  }

  async function deleteInvoice(v) {
    if (!window.confirm(`Delete invoice ${v.number ? "#" + v.number : ""} for good? This can't be undone — use Void if you just want to cancel it but keep the record.`)) return;
    setOpenInv(null);
    if (live) { await supabase.from("invoices").delete().eq("id", v.id); setReloadTick(t => t + 1); }
  }

  async function convertToInvoice(v) {
    if (live && liveOrgId) {
      let num = v.number;
      if (!v.number) {
        num = entity.nextInvoiceNumber || 1001;
        await supabase.from("ledger_orgs").update({ next_invoice_number: num + 1 }).eq("id", liveOrgId);
      }
      // A PO must never disappear when it's billed — we keep the purchase order (and its vendor
      // history) intact on the PO screen and just stamp it "Invoiced," then spawn a SEPARATE
      // invoice row that bills the customer. A plain order (no PO) has no vendor history to
      // preserve, so it just becomes the invoice in place.
      if (v.poNumber) {
        const items = Array.isArray(v.lines) ? v.lines : [];
        const subtotal = items.reduce((s, l) => s + Math.round((parseFloat(l.price) || 0) * 100) * (parseInt(l.qty) || 1), 0);
        const tax = v.tax === "Taxable" ? Math.round(subtotal * MN_TAX_RATE) : 0;
        const { data: invRow } = await supabase.from("invoices").insert({
          org_id: liveOrgId, user_id: session.user.id,
          doc_type: "invoice", status: "draft", invoice_number: String(num),
          customer_name: v.customer && v.customer !== "—" ? v.customer : null, customer_email: v.email || null,
          line_items: items, tax_status: v.tax || "Taxable",
          subtotal_cents: subtotal, tax_cents: tax, total_cents: subtotal + tax,
          issue_date: v.issueDate || null, ship_address: v.shipAddress || null,
        }).select("id").single();
        await supabase.from("invoices").update({ status: "invoiced" }).eq("id", v.id);
        await logDocEvent(v.id, "billed", "Invoiced as #" + num + " — PO kept for vendor history");
        if (invRow) await logDocEvent(invRow.id, "created", "Billed from PO #" + v.poNumber);
      } else {
        const patch = { doc_type: "invoice", status: "draft" };
        if (!v.number) patch.invoice_number = String(num);
        await supabase.from("invoices").update(patch).eq("id", v.id);
        await logDocEvent(v.id, "billed", "Converted to invoice" + (num ? " #" + num : ""));
      }
      setReloadTick(t => t + 1);
    }
    setSection("invoices");
  }

  async function recordBill() {
    const cents = Math.round((parseFloat(billDraft.amount) || 0) * 100);
    if (!cents || !billDraft.vendor.trim()) return;
    const draft = billDraft;
    setShowBillForm(false);
    setBillDraft(blankBill);
    if (live && liveOrgId) {
      // Auto-create the vendor if it's new, so it shows on the Vendors list where
      // you can add its address/phone/email — which is what prints on the check.
      const known = (entity.vendors || []).some(v => (v || "").toLowerCase() === draft.vendor.trim().toLowerCase());
      if (!known && draft.vendor.trim()) {
        await supabase.from("ledger_vendors").insert({ org_id: liveOrgId, user_id: session.user.id, name: draft.vendor.trim() });
      }
      await supabase.from("ledger_bills").insert({
        org_id: liveOrgId, user_id: session.user.id, vendor_name: draft.vendor.trim(),
        amount_cents: cents, due_date: draft.due || null, category: draft.category || null,
        memo: draft.memo.trim() || null, status: "unpaid",
      });
      setReloadTick(t => t + 1);
    }
  }

  async function markBillPaid(id, paid) {
    if (live) {
      await supabase.from("ledger_bills").update({ status: paid ? "paid" : "unpaid", paid_at: paid ? new Date().toISOString() : null }).eq("id", id);
      setReloadTick(t => t + 1);
    }
  }

  async function updateBill() {
    const b = billEdit;
    if (!b || !b.vendor.trim()) return;
    const cents = Math.round((parseFloat(b.amount) || 0) * 100);
    if (live) {
      await supabase.from("ledger_bills").update({
        vendor_name: b.vendor.trim(), amount_cents: cents, due_date: b.due || null,
        category: b.category || null, memo: (b.memo || "").trim() || null,
      }).eq("id", b.id);
      setReloadTick(t => t + 1);
    }
    setBillEdit(null); setOpenBill(null);
  }
  async function deleteBill(id) {
    if (!window.confirm("Delete this bill? This can't be undone.")) return;
    setOpenBill(null);
    if (live) { await supabase.from("ledger_bills").delete().eq("id", id); setReloadTick(t => t + 1); }
  }
  function payBillByCheck(bill) { payBillsByCheck([bill]); }
  // Reprint / edit a check already written for a bill: pull the notebook line it created
  // (so we don't double it), set the bill back to unpaid, and reopen the check to redo.
  async function reprintCheck(bill) {
    if (live && liveOrgId) {
      const { data } = await supabase.from("ledger_entries")
        .select("id")
        .eq("org_id", liveOrgId).eq("direction", "out")
        .eq("amount_cents", bill.amount_cents)
        .eq("description", bill.vendor_name)
        .ilike("reference", "Check #%")
        .order("created_at", { ascending: false }).limit(1);
      if (data && data[0]) await supabase.from("ledger_entries").delete().eq("id", data[0].id);
      await supabase.from("ledger_bills").update({ status: "unpaid", paid_at: null }).eq("id", bill.id);
      setReloadTick(t => t + 1);
    }
    payBillsByCheck([bill]);
  }
  // Bills for the SAME vendor collapse onto one check (stubs itemize them); bills for
  // different vendors each get their own check, so she can print 3–4 at once.
  function payBillsByCheck(bills) {
    if (!bills || bills.length === 0) return;
    const banks = accountList.filter(a => a.type === "bank");
    setCheckAcctId(banks[0] ? banks[0].id : "");
    setOpenBill(null);
    const groups = new Map();
    for (const b of bills) {
      const key = (b.vendor_name || "").trim().toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(b);
    }
    const checks = [...groups.values()].map(gb => ({
      vendor_name: gb[0].vendor_name,
      amount_cents: gb.reduce((s, b) => s + (b.amount_cents || 0), 0),
      category: gb.length === 1 ? gb[0].category : null,
      memo: gb.length === 1 ? gb[0].memo : `${gb.length} bills`,
      due_date: gb.length === 1 ? gb[0].due_date : null,
      _bills: gb,
    }));
    setCheckStartNum(String(entity.nextCheckNumber || 1001));
    setCheckFor({ checks });
  }
  // Print the check, mark every covered bill paid, book one outflow on the chosen bank,
  // stamp the check number in the reference, and advance the next check number.
  async function confirmCheck(doPrint = true) {
    const cf = checkFor;
    if (!cf) return;
    const checks = cf.checks || [cf._bills ? { ...cf } : cf];
    const start = parseInt(checkStartNum, 10) || entity.nextCheckNumber || 1001;
    const acct = accountList.find(a => a.id === checkAcctId);
    if (doPrint) window.print(); // sometimes they just mark paid (someone hand-wrote a check)
    if (live && liveOrgId) {
      const today = new Date().toISOString().slice(0, 10);
      for (let i = 0; i < checks.length; i++) {
        const ck = checks[i];
        const num = start + i;
        const bills = ck._bills || [ck];
        for (const b of bills) {
          if (b.id) await supabase.from("ledger_bills").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", b.id);
        }
        await supabase.from("ledger_entries").insert({
          org_id: liveOrgId, user_id: session.user.id, entry_date: today,
          direction: "out", amount_cents: ck.amount_cents, description: ck.vendor_name || "Check",
          category: bills.length === 1 ? (bills[0].category || null) : null,
          account_id: (acct && acct.id && String(acct.id).length > 20) ? acct.id : null,
          reference: "Check #" + num, match_status: null,
        });
      }
      await supabase.from("ledger_orgs").update({ next_check_number: start + checks.length }).eq("id", liveOrgId);
      if (cf._creditId) await supabase.from("ledger_credits").update({ status: "refunded" }).eq("id", cf._creditId);
      setSelectedBills({});
      setReloadTick(t => t + 1);
    }
    setCheckFor(null);
  }

  const q = query.trim().toLowerCase();
  const filteredItems = items.filter(x =>
    (!q || (x.payee + " " + x.amount + " " + x.date).toLowerCase().includes(q)) &&
    (!acctFilter || x.source === acctFilter)
  );
  const recentRank = id => { const i = recentIds.indexOf(id); return i < 0 ? Infinity : i; };
  const visibleItems = [...filteredItems].sort((a, b) => {
    const ra = recentRank(a.id), rb = recentRank(b.id); // just-entered float to the top
    if (ra !== rb) return ra - rb;
    if (sortBy === "date-asc") return (a.dateISO || "").localeCompare(b.dateISO || "");
    if (sortBy === "vendor") return (a.payee || "").localeCompare(b.payee || "");
    if (sortBy === "account") return (a.source || "~").localeCompare(b.source || "~") || (b.dateISO || "").localeCompare(a.dateISO || "");
    return (b.dateISO || "").localeCompare(a.dateISO || ""); // date-desc (default)
  });
  const recentInNotebook = filteredItems.filter(x => recentIds.includes(x.id)).length;

  // Everything typed anywhere becomes a payee suggestion — vendors, customers, and
  // every payee already in the notebook — de-duped and alphabetized.
  const payeeOptions = [...new Set([
    ...(entity.vendors || []),
    ...(entity.customers || []).map(c => c.name),
    ...items.map(x => x.payee),
    ...cleared.map(x => x.payee),
  ].filter(Boolean))].sort((a, b) => a.localeCompare(b));

  const accentRail = N.blue;

  // ---- section renderers ----------------------------------------------------
  function Notebook() {
    return (
      <div>
        <div style={{ marginBottom: 12 }}>
          {/* Row 1 — title + search */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{entity.currentUser ? `${entity.currentUser.split(" ")[0]}'s notebook` : "Notebook"}</div>
              <div style={{ fontSize: 13, color: N.muted }}>Today — {entity.today}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: N.white, border: "1px solid " + N.rule, borderRadius: 100, padding: "7px 12px" }}>
              <span style={{ color: N.muted, display: "flex" }}><Ico name="search" size={15} /></span>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Look up any day, payee, amount"
                style={{ border: "none", outline: "none", fontSize: 13, fontFamily: "'Figtree', sans-serif", width: 200, color: N.text }} />
            </div>
          </div>
          {(() => {
            const newBank = (entity.rawEntries || []).filter(e => e.source_hash && (e.created_at || "") > bankSeenAt).length;
            if (!newBank) return null;
            return (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", background: "#eef6ff", border: "1px solid #cfe4ff", borderRadius: 10, padding: "9px 14px", marginTop: 12 }}>
                <span style={{ fontSize: 13, color: N.blueDark, fontWeight: 600 }}>🔔 {newBank} new transaction{newBank === 1 ? "" : "s"} came in from your bank — they're in the list below to match.</span>
                <button onClick={markBankSeen} style={{ ...btnPaper(N.blueDark), padding: "5px 12px" }}>Got it</button>
              </div>
            );
          })()}
          {/* Row 2 — controls */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
            <button onClick={() => { setShowAddLine(s => !s); setShowPayCard(false); setAddedCount(0); setTimeout(() => payeeRef.current && payeeRef.current.focus(), 40); }} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>{showAddLine ? "Close" : "+ Add a line"}</button>
            <button onClick={() => { setShowPayCard(s => !s); setShowAddLine(false); }} style={btnPaper(N.blue)}>{showPayCard ? "Close" : "Pay a card"}</button>
            <select value={acctFilter} onChange={e => setAcctFilter(e.target.value)} title="Show only one account" style={{ ...inputSt, padding: "8px 10px", fontSize: 12, fontWeight: acctFilter ? 700 : 400, color: acctFilter ? N.blueDark : N.text, borderColor: acctFilter ? N.blue : N.rule }}>
              <option value="">All accounts</option>
              {accountList.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
            <button onClick={() => { if (!acctFilter) { window.alert("Pick one account in the dropdown to the left, then Reconcile."); return; } setReconChecked({}); setReconTarget(""); setReconDate(""); setReconStmtDoc(null); setReconOpen(true); }} title="Reconcile the selected account against its statement" style={{ ...btnBlue, background: acctFilter ? N.green : N.mutedLite, fontSize: 13, padding: "9px 16px", cursor: acctFilter ? "pointer" : "not-allowed" }}>Reconcile{acctFilter ? " " + acctFilter : "…"}</button>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} title="Sort the notebook" style={{ ...inputSt, padding: "8px 10px", fontSize: 12 }}>
              <option value="date-desc">Sort: Date (newest)</option>
              <option value="date-asc">Sort: Date (oldest)</option>
              <option value="vendor">Sort: Vendor (A–Z)</option>
              <option value="account">Sort: Pymt by</option>
            </select>
            <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: N.pinkDark, background: "#eafaf0", border: "1px solid #bff0d3", padding: "7px 12px", borderRadius: 100, whiteSpace: "nowrap" }}>
              {items.length} in the notebook
            </div>
          </div>
        </div>

        {acctFilter && (() => {
          const allA = [...(entity.accounts?.banks || []), ...(entity.accounts?.cards || []), ...(entity.accounts?.loans || [])];
          const acct = allA.find(a => a.name === acctFilter);
          if (!acct) return null;
          const book = acct.balance;
          const tgt = reconTarget === "" ? null : (parseFloat(reconTarget) || 0);
          const diff = tgt == null ? null : (tgt - book);
          const ok = diff != null && Math.abs(diff) < 0.005;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: ok ? "#eafaf0" : "#eef6ff", border: "1px solid " + (ok ? "#bff0d3" : "#cfe4ff"), borderRadius: 12, padding: "12px 16px", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: N.ink }}>Reconcile {acctFilter}</span>
              <span style={{ fontSize: 13, color: N.muted }}>Books show <b style={{ color: book < 0 ? N.red : N.ink }}>{money(book)}</b></span>
              <span style={{ fontSize: 13, color: N.muted }}>· Statement ending balance:</span>
              <input value={reconTarget} onChange={e => setReconTarget(e.target.value)} placeholder="$ from statement" inputMode="decimal" style={{ ...inputSt, width: 160 }} />
              {diff != null && (ok
                ? <span style={{ fontSize: 13, fontWeight: 700, color: N.pinkDark }}>✓ Reconciled — matches to the penny</span>
                : <span style={{ fontSize: 13, color: "#8a5a00" }}>Off by <b>{money(Math.abs(diff))}</b> — {diff > 0 ? "bank shows more (charges not booked yet)" : "books show more (deposits in transit / not cleared)"}</span>)}
            </div>
          );
        })()}

        {showAddLine && (
          <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: N.ink, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span>Write lines in the notebook — a check, a cash payment, a deposit the bank feed won't catch.</span>
              {addedCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#a16207", background: "#fef9c3", border: "1px solid #fde68a", padding: "3px 10px", borderRadius: 100 }}>✓ {addedCount} added</span>}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: N.muted, fontWeight: 600 }}>Quick fill:</span>
              <button onClick={() => { setLineDraft(d => ({ ...d, direction: "out", payee: "Interest charged", category: "CC Interest" })); setTimeout(() => amountRef.current && amountRef.current.focus(), 30); }} style={{ ...btnPaper(lineDraft.category === "CC Interest" ? N.blue : N.muted), padding: "5px 12px" }}>Interest on a card</button>
              <button onClick={() => { setLineDraft(d => ({ ...d, direction: "out", payee: "Bank service charge", category: "Banking costs" })); setTimeout(() => amountRef.current && amountRef.current.focus(), 30); }} style={{ ...btnPaper(lineDraft.category === "Banking costs" ? N.blue : N.muted), padding: "5px 12px" }}>Bank fee</button>
              {lineDraft.category && <span style={{ fontSize: 12, fontWeight: 700, color: N.blueDark, background: "#eef6ff", border: "1px solid #cfe4ff", borderRadius: 100, padding: "4px 10px" }}>→ {lineDraft.category} <button onClick={() => setLineDraft(d => ({ ...d, category: "" }))} title="Clear" style={{ border: "none", background: "none", cursor: "pointer", color: N.muted, fontWeight: 700, fontSize: 13, padding: "0 0 0 4px" }}>×</button></span>}
              {lineDraft.category === "CC Interest" && <span style={{ fontSize: 11, color: N.muted }}>Now just pick the card in <b>Pymt by</b> and enter the amount.</span>}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", border: "1px solid " + N.rule, borderRadius: 100, overflow: "hidden" }}>
                <button onClick={() => setLineDraft(d => ({ ...d, direction: "out" }))} style={{ border: "none", cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 13, fontWeight: 600, padding: "8px 14px", background: lineDraft.direction === "out" ? N.pinkDark : N.white, color: lineDraft.direction === "out" ? N.white : N.muted }}>Money out</button>
                <button onClick={() => setLineDraft(d => ({ ...d, direction: "in" }))} style={{ border: "none", cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 13, fontWeight: 600, padding: "8px 14px", background: lineDraft.direction === "in" ? N.green : N.white, color: lineDraft.direction === "in" ? N.white : N.muted }}>Money in</button>
              </div>
              <input type="date" value={lineDraft.date} onChange={e => setLineDraft(d => ({ ...d, date: e.target.value }))} style={{ ...inputSt, width: 150 }} />
              <input ref={payeeRef} list="pg-vendor-list" placeholder={lineDraft.direction === "in" ? "From whom? (deposit, payment…)" : "Payee / vendor — start typing"} value={lineDraft.payee} onChange={e => setLineDraft(d => ({ ...d, payee: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); amountRef.current && amountRef.current.focus(); } }} style={{ ...inputSt, flex: 1, minWidth: 200 }} />
              <datalist id="pg-vendor-list">
                {payeeOptions.map(v => <option key={v} value={v} />)}
              </datalist>
              <input ref={amountRef} placeholder="$ amount" value={lineDraft.amount} onChange={e => setLineDraft(d => ({ ...d, amount: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); createLine(); } }} style={{ ...inputSt, width: 120 }} />
              <select value={lineDraft.accountId || defaultBankId} onChange={e => setLineDraft(d => ({ ...d, accountId: e.target.value }))} style={{ ...inputSt, width: 168 }}>
                <option value="">Pymt by (bank/card)…</option>
                {accountList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button onClick={createLine} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>Add &amp; next ↵</button>
              <button onClick={() => setShowAddLine(false)} style={btnPaper(N.muted)}>Done</button>
            </div>
            <div style={{ fontSize: 11, color: N.muted, marginTop: 8 }}>Type payee → <b>Enter</b> → amount → <b>Enter</b> saves and jumps to the next line. Date, in/out, and account carry over. Hit <b>Done</b> when you're finished.</div>
          </div>
        )}

        {showPayCard && (
          <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: N.ink, fontWeight: 600 }}>Record a card payment — this is a transfer, not an expense.</div>
              <button onClick={() => { setSection("admin"); setListsTab("recons"); }} style={{ ...btnPaper(N.blueDark), fontSize: 12, padding: "5px 10px" }}>📄 Statements & reconciliations →</button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input placeholder="$ amount" value={payDraft.amount} onChange={e => setPayDraft(d => ({ ...d, amount: e.target.value }))} style={{ ...inputSt, width: 110 }} />
              <span style={{ fontSize: 13, color: N.muted }}>from</span>
              <select value={payDraft.fromId || defaultBankId} onChange={e => setPayDraft(d => ({ ...d, fromId: e.target.value }))} style={{ ...inputSt, width: 168 }}>
                <option value="">Which account…</option>
                {accountList.filter(a => a.type === "bank").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <span style={{ fontSize: 13, color: N.muted }}>to</span>
              <select value={payDraft.toId} onChange={e => setPayDraft(d => ({ ...d, toId: e.target.value }))} style={{ ...inputSt, width: 168 }}>
                <option value="">Which card…</option>
                {accountList.filter(a => a.type === "credit_card").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input type="date" value={payDraft.date} onChange={e => setPayDraft(d => ({ ...d, date: e.target.value }))} style={{ ...inputSt, width: 150 }} />
              <button onClick={recordCardPayment} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>Record payment</button>
            </div>
            <div style={{ fontSize: 11, color: N.muted, marginTop: 8 }}>Checking goes down and the card balance goes down — no double-counting, because the charges were already the expenses.</div>
          </div>
        )}

        {/* Steno pad */}
        <div style={{ position: "relative", background: "#e9f0e2", border: "1px solid #cdd8c2", borderRadius: 12, padding: "12px 16px 16px 52px", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 40, width: 1, background: "#d98b8b" }} />
          <div style={{ position: "absolute", top: 10, left: 15, display: "flex", flexDirection: "column", gap: 5 }}>
            {[0, 1, 2, 3].map(i => <span key={i} style={{ width: 11, height: 11, border: "1.5px solid #b9c6ab", borderRadius: "50%" }} />)}
          </div>

          {recentInNotebook > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", background: "#fff7e0", border: "1px solid #f0d89a", borderRadius: 8, padding: "7px 12px", margin: "0 0 8px" }}>
              <span style={{ fontSize: 12.5, color: "#8a5a00", fontWeight: 600 }}>⬆ {recentInNotebook} just-entered {recentInNotebook === 1 ? "line is" : "lines are"} pinned up top — check them, then clear.</span>
              <button onClick={() => setRecentIds([])} style={{ ...btnPaper("#8a5a00"), padding: "5px 12px" }}>Clear — let them sort</button>
            </div>
          )}

          {visibleItems.length === 0 && (
            <div style={{ padding: "26px 0", textAlign: "center", fontFamily: "'Figtree', sans-serif", fontSize: 22, color: "#5a6b52" }}>
              {q ? "Nothing matches that." : "All caught up — every line matched. 🎉"}
            </div>
          )}

          {visibleItems.map((x, i) => {
            const proposed = !!x.cleared;
            const isRecent = recentIds.includes(x.id);
            const last = i === visibleItems.length - 1;
            const prevSrc = i > 0 ? visibleItems[i - 1].source : null;
            const showHead = sortBy === "account" && x.source !== prevSrc;
            return [
              showHead && <div key={x.id + "-hdr"} style={{ margin: "18px 0 2px", padding: "5px 2px", borderBottom: "2px solid #b8c7ab", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em", color: "#4a6a9a", fontWeight: 700 }}>{(x.source && x.source !== "—" ? x.source : "— not assigned to an account —").toUpperCase()}</div>,
              <div key={x.id} style={{ borderBottom: last ? "none" : "1px solid #cfdcc4", background: proposed ? "#e2edf7" : (isRecent ? "#fff7e0" : "transparent"), marginLeft: (proposed || isRecent) ? -8 : 0, paddingLeft: (proposed || isRecent) ? 8 : 0, borderLeft: isRecent && !proposed ? "3px solid #eab308" : "none", borderRadius: (proposed || isRecent) ? 6 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
                  {/* LEFT — date + which bank/card */}
                  <div style={{ width: 104, marginLeft: -44, flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 13, color: "#8a8f9a", textAlign: "right", paddingRight: 6 }}>{x.date}</div>
                    {!proposed && (() => {
                      const hasAcct = x.source && x.source !== "—";
                      return (
                        <select value={x.accountId || ""} title="Which bank or card?"
                          onChange={e => { const id = e.target.value; const nm = accountList.find(a => a.id === id)?.name || "—"; setAccount(x.id, id || null, nm); }}
                          style={{ width: "100%", marginTop: 3, fontSize: 10, fontWeight: 600, padding: "3px 6px", borderRadius: 6, cursor: "pointer", fontFamily: "'Figtree', sans-serif",
                            border: "1px solid " + (hasAcct ? "#cdd8c2" : "#f0d89a"), background: hasAcct ? "#f0f7f1" : "#fdf5e3", color: hasAcct ? "#5a7a63" : "#8a5a00" }}>
                          <option value="">Pymt by?</option>
                          {accountList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      );
                    })()}
                  </div>
                  {/* MIDDLE — payee (one line) + coding */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 15, color: "#26303f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.payee}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                      {proposed ? (
                        <span style={{ fontSize: 11, color: N.blue, display: "flex", alignItems: "center", gap: 4 }}><Ico name="bank" size={12} />Bank says cleared · {x.cleared.bank} · {x.cleared.date}</span>
                      ) : x.category === "Card payment" ? (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100, border: "1px solid #cfe4ff", background: "#eef6ff", color: N.blueDark }}>↔ Card payment · transfer, not income</span>
                      ) : (
                        <>
                          {!x.invoiceId && (() => {
                            const hasCat = !!x.category; const isSug = !hasCat && !!x.suggested;
                            const bd = hasCat ? "#bff0d3" : isSug ? "#f0d89a" : "#cfe4ff";
                            const bg = hasCat ? "#eafaf0" : isSug ? "#fdf5e3" : "#eef6ff";
                            const fg = hasCat ? N.pinkDark : isSug ? "#8a5a00" : N.blueDark;
                            return (
                              <select value={x.category || ""} onChange={e => { if (e.target.value === "__new__") { const nm = window.prompt("New account name:"); if (nm && nm.trim()) addCategory(nm, x.id); } else setCategory(x.id, e.target.value); }}
                                title={isSug ? "Remembered — confirm or change" : "Which account does this code to?"}
                                style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", maxWidth: 190, borderRadius: 100, cursor: "pointer", fontFamily: "'Figtree', sans-serif", border: "1px solid " + bd, background: bg, color: fg }}>
                                <option value="">{isSug ? `${x.suggested}?` : (x.direction === "in" ? "Return / other income?" : "Which account?")}</option>
                                {(entity.categories || []).slice().sort((a, b) => a.localeCompare(b)).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                <option value="__new__">＋ Add a new account…</option>
                              </select>
                            );
                          })()}
                          {x.direction === "in" && (() => {
                            const linked = !!x.invoiceId;
                            const linkedInv = linked ? invoices.find(v => v.id === x.invoiceId) : null;
                            const list = invoices.filter(v => v.docType !== "order" && v.status !== "Void").slice().sort((a, b) => (a.customer || "").localeCompare(b.customer || ""));
                            if (linked) return (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100, border: "1px solid #bff0d3", background: "#eafaf0", color: N.pinkDark }}>
                                  ✓ {linkedInv ? `Inv #${linkedInv.number || "?"} · ${linkedInv.customer}` : "Applied"}
                                </span>
                                <button onClick={() => reverseDeposit(x)} title="Undo this payment — takes it off the invoice (unmarks Paid) and out of the notebook" style={{ border: "1px solid " + N.rule, background: N.white, cursor: "pointer", color: N.pinkDark, fontFamily: "'Figtree', sans-serif", fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "3px 8px" }}>↩ Reverse</button>
                              </span>
                            );
                            return (
                              <select value="" onChange={e => { const v = e.target.value; if (v === "__refund") setCategory(x.id, "Refund"); else if (v === "__other") setCategory(x.id, "Other income"); else if (v) applyEntryToInvoice(x, v); }} title="Refund, other income, or a payment on an invoice?"
                                style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", maxWidth: 220, borderRadius: 100, cursor: "pointer", fontFamily: "'Figtree', sans-serif", border: "1px solid #f0d89a", background: "#fdf5e3", color: "#8a5a00" }}>
                                <option value="">What is this?</option>
                                <option value="__refund">↩ Refund</option>
                                <option value="__other">＋ Other income</option>
                                <optgroup label="Payment on an invoice">
                                  {list.map(v => <option key={v.id} value={v.id}>#{v.number || "—"} · {v.customer} · {money(v.amount)}{v.balanceCents != null && v.balanceCents > 0 && v.balanceCents !== Math.round((v.amount || 0) * 100) ? ` (bal ${money(v.balance)})` : ""} · {v.status}</option>)}
                                </optgroup>
                              </select>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                  {/* AMOUNT */}
                  <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 17, fontWeight: 600, color: x.direction === "in" ? N.green : "#26303f", whiteSpace: "nowrap" }}>{x.direction === "in" ? "+" + money(x.amount) : money(-x.amount)}</div>
                  {/* ACTIONS — edit/delete stacked (lines clear when you reconcile the account) */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <button onClick={() => { setEditLineId(x.id); setEditDraft({ date: x.dateISO || "", payee: x.payee, amount: String(x.amount), direction: x.direction || "out" }); setCatOpen(null); setAcctOpen(null); }} title="Edit" style={{ background: "none", border: "1px solid " + N.rule, borderRadius: 6, cursor: "pointer", color: N.muted, fontFamily: "'Figtree', sans-serif", fontSize: 10, fontWeight: 600, padding: "2px 9px", lineHeight: 1.3 }}>Edit</button>
                      <button onClick={() => deleteLine(x.id)} title="Delete" style={{ background: "none", border: "1px solid " + N.rule, borderRadius: 6, cursor: "pointer", color: N.pinkDark, fontFamily: "'Figtree', sans-serif", fontSize: 10, fontWeight: 600, padding: "2px 9px", lineHeight: 1.3 }}>Delete</button>
                    </div>
                  </div>
                </div>
                {editLineId === x.id && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "4px 0 14px" }}>
                    <div style={{ display: "flex", border: "1px solid " + N.rule, borderRadius: 100, overflow: "hidden" }}>
                      <button onClick={() => setEditDraft(d => ({ ...d, direction: "out" }))} style={{ border: "none", cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, padding: "7px 12px", background: editDraft.direction === "out" ? N.pinkDark : N.white, color: editDraft.direction === "out" ? N.white : N.muted }}>Out</button>
                      <button onClick={() => setEditDraft(d => ({ ...d, direction: "in" }))} style={{ border: "none", cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, padding: "7px 12px", background: editDraft.direction === "in" ? N.green : N.white, color: editDraft.direction === "in" ? N.white : N.muted }}>In</button>
                    </div>
                    <input type="date" value={editDraft.date} onChange={e => setEditDraft(d => ({ ...d, date: e.target.value }))} style={{ ...inputSt, width: 150 }} />
                    <input list="pg-vendor-list" value={editDraft.payee} onChange={e => setEditDraft(d => ({ ...d, payee: e.target.value }))} placeholder="Payee" style={{ ...inputSt, flex: 1, minWidth: 180 }} />
                    <input value={editDraft.amount} onChange={e => setEditDraft(d => ({ ...d, amount: e.target.value }))} placeholder="$ amount" style={{ ...inputSt, width: 120 }} />
                    <button onClick={saveLine} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>Save</button>
                    <button onClick={() => setEditLineId(null)} style={btnPaper(N.muted)}>Cancel</button>
                  </div>
                )}
              </div>
            ];
          })}
        </div>

        {(() => {
          const acctById = {}; (entity.rawAccounts || []).forEach(a => { acctById[a.id] = a.name; });
          const filterId = acctFilter ? (entity.rawAccounts || []).find(a => a.name === acctFilter)?.id : null;
          const clearedEntries = (entity.rawEntries || [])
            .filter(e => e.match_status === "reconciled" && (!acctFilter || e.account_id === filterId))
            .sort((a, b) => (b.entry_date || "").localeCompare(a.entry_date || ""));
          const shortD = d => { const p = (d || "").split("-"); return p.length === 3 ? `${+p[1]}/${+p[2]}` : d; };
          return (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                <div style={{ fontSize: 12, color: N.muted }}>Reconciled lines move to Cleared — locked, never lost.</div>
                <button onClick={() => setShowCleared(s => !s)} style={{ background: "none", border: "none", color: N.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
                  {showCleared ? "Hide" : "See"} cleared items ({clearedEntries.length}){acctFilter ? " · " + acctFilter : ""} →
                </button>
              </div>
              {showCleared && (
                <div style={{ marginTop: 10, background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: "8px 14px", maxHeight: "50vh", overflowY: "auto" }}>
                  {clearedEntries.length === 0 && <div style={{ fontSize: 13, color: N.muted, padding: "10px 0" }}>Nothing reconciled yet{acctFilter ? " on " + acctFilter : ""} — reconcile an account and its lines land here, locked.</div>}
                  {clearedEntries.map(e => (
                    <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid " + N.rule }}>
                      <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: N.pinkDark, color: "#fff", fontSize: 10, fontWeight: 700 }}>R</span>
                      <span style={{ width: 42, fontSize: 12, color: N.muted }}>{shortD(e.entry_date)}</span>
                      <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: N.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.description}</div>
                      {!acctFilter && <span style={{ fontSize: 11, color: N.mutedLite, whiteSpace: "nowrap" }}>{acctById[e.account_id] || ""}</span>}
                      <div style={{ fontSize: 14, color: e.direction === "in" ? N.green : N.text, fontWeight: 600, whiteSpace: "nowrap" }}>{e.direction === "in" ? "+" + money((e.amount_cents || 0) / 100) : money(-(e.amount_cents || 0) / 100)}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {reconOpen && acctFilter && (() => {
          const acct = accountList.find(a => a.name === acctFilter);
          const acctId = acct ? acct.id : null;
          const rawA = (entity.rawAccounts || []).find(a => a.id === acctId);
          const opening = rawA ? (rawA.opening_balance_cents || 0) : 0;
          const all = (entity.rawEntries || []).filter(e => e.account_id === acctId);
          const reconciledSum = all.filter(e => e.match_status === "reconciled").reduce((s, e) => s + (e.direction === "in" ? e.amount_cents : -e.amount_cents), 0);
          const beginning = opening + reconciledSum;
          // The statement end date filters out anything dated after it, so only lines on/before the
          // statement close are eligible to check.
          const unrec = all.filter(e => e.match_status !== "reconciled" && (!reconDate || (e.entry_date || "") <= reconDate)).sort((a, b) => (a.entry_date || "").localeCompare(b.entry_date || ""));
          const hiddenAfter = reconDate ? all.filter(e => e.match_status !== "reconciled" && (e.entry_date || "") > reconDate).length : 0;
          const acctRecs = reconHist.filter(r => r.account_id === acctId);
          const lastRec = acctRecs[0] || null;
          const moneyIn = unrec.filter(e => e.direction === "in");
          const moneyOut = unrec.filter(e => e.direction !== "in");
          const checkedSum = unrec.filter(e => reconChecked[e.id]).reduce((s, e) => s + (e.direction === "in" ? e.amount_cents : -e.amount_cents), 0);
          const clearedBal = beginning + checkedSum;
          const isLiab = rawA && (rawA.account_type === "credit_card" || rawA.account_type === "loan");
          const stmt = reconTarget === "" ? null : Math.round((parseFloat(reconTarget) || 0) * 100);
          const targetSigned = stmt == null ? null : (isLiab ? -stmt : stmt);
          const diff = targetSigned == null ? null : (targetSigned - clearedBal);
          const ok = diff != null && Math.abs(diff) < 1;
          const owed = c => money((isLiab ? -c : c) / 100);
          const checkedIds = unrec.filter(e => reconChecked[e.id]).map(e => e.id);
          const toggle = id => setReconChecked(p => ({ ...p, [id]: !p[id] }));
          const shortD = d => { const p = (d || "").split("-"); return p.length === 3 ? `${+p[1]}/${+p[2]}` : d; };
          const renderCol = (title, rows, color) => (
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color, marginBottom: 6 }}>{title} · {rows.length}</div>
              <div style={{ border: "1px solid " + N.rule, borderRadius: 10, overflow: "hidden", maxHeight: "42vh", overflowY: "auto" }}>
                {rows.length === 0 && <div style={{ padding: 14, color: N.muted, fontSize: 13 }}>None.</div>}
                {rows.map((e, i) => (
                  <div key={e.id} onClick={() => toggle(e.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderTop: i === 0 ? "none" : "1px solid " + N.rule, cursor: "pointer", background: reconChecked[e.id] ? "#eafaf0" : "transparent" }}>
                    <span style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: reconChecked[e.id] ? N.pinkDark : "transparent", border: reconChecked[e.id] ? "none" : "1.5px solid " + N.rule, color: "#fff", fontSize: 11, fontWeight: 700 }}>{reconChecked[e.id] ? "R" : ""}</span>
                    <span style={{ width: 42, fontSize: 12, color: N.muted }}>{shortD(e.entry_date)}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.description}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color }}>{money((e.amount_cents || 0) / 100)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
          return (
            <div onClick={() => setReconOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "36px 16px", zIndex: 220, overflowY: "auto" }}>
              <div onClick={ev => ev.stopPropagation()} style={{ background: N.white, borderRadius: 14, width: "100%", maxWidth: 880, boxShadow: "0 24px 70px rgba(10,10,20,0.35)", padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 21, color: N.ink }}>Reconcile {acctFilter}</div>
                    <div style={{ fontSize: 12, color: N.muted, marginTop: 2 }}>
                      {lastRec
                        ? <>Last reconciled: <b style={{ color: N.ink }}>{owed(lastRec.statement_ending_balance_cents)}{isLiab ? " owed" : ""}</b> · statement {fmtStmtDate(lastRec.statement_ending_date)}</>
                        : "No prior reconciliation on this account yet."}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: N.muted, flexWrap: "wrap" }}>
                    {acctId && <button onClick={() => openImport(acctId)} title="Import the transaction lines from a bank/card CSV export" style={btnPaper(N.blueDark)}>⬆ Upload transactions</button>}
                    <span>Statement date</span>
                    <input type="date" value={reconDate} onChange={e => setReconDate(e.target.value)} title="Only lines on or before this date can be checked" style={{ ...inputSt, width: 150 }} />
                    <span>{isLiab ? "New balance owed" : "Ending balance"}</span>
                    <input value={reconTarget} onChange={e => setReconTarget(e.target.value)} placeholder={isLiab ? "$ owed on statement" : "$ from statement"} inputMode="decimal" style={{ ...inputSt, width: 140 }} />
                    {reconStmtDoc
                      ? <span style={{ fontSize: 12, fontWeight: 600, color: N.pinkDark, background: "#eafaf0", border: "1px solid #bff0d3", borderRadius: 100, padding: "5px 10px" }}>📎 {reconStmtDoc.name} <button onClick={() => setReconStmtDoc(null)} title="Remove" style={{ border: "none", background: "none", color: N.muted, cursor: "pointer", fontWeight: 700 }}>×</button></span>
                      : <label style={{ ...btnPaper(N.green), cursor: reconStmtBusy ? "default" : "pointer", opacity: reconStmtBusy ? 0.6 : 1 }}>{reconStmtBusy ? "Uploading…" : "📎 Upload statement"}<input type="file" accept=".pdf,.csv,application/pdf,text/csv" disabled={reconStmtBusy} onChange={e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; attachReconStatement(f); }} style={{ display: "none" }} /></label>}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: N.muted, marginBottom: 10 }}>Click each line that's on this statement — it gets an <b style={{ color: N.pinkDark }}>R</b>. When the difference hits <b>$0.00</b>, you're reconciled.</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <button onClick={() => setReconChecked(Object.fromEntries(unrec.map(e => [e.id, true])))} style={btnPaper(N.pinkDark)}>✓ Check all {unrec.length}</button>
                  <button onClick={() => setReconChecked({})} style={btnPaper(N.muted)}>Uncheck all</button>
                  <span style={{ fontSize: 12, color: N.mutedLite }}>{reconDate ? "Set a statement date, then Check all — everything shown is on/before it." : "Tip: set the statement date above and lines after it drop off the list."}</span>
                  {hiddenAfter > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: N.blueDark, background: "#eef6ff", border: "1px solid #cfe4ff", padding: "3px 10px", borderRadius: 100 }}>{hiddenAfter} line{hiddenAfter === 1 ? "" : "s"} after {fmtStmtDate(reconDate)} hidden</span>}
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                  {renderCol("Money in — deposits", moneyIn, "#3a7d4a")}
                  {renderCol("Money out — checks & payments", moneyOut, N.red)}
                </div>
                {ok && (() => {
                  const leftovers = unrec.filter(e => !reconChecked[e.id]);
                  if (!leftovers.length) return null;
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                      <span style={{ fontSize: 13, color: "#9a3412" }}><b>{leftovers.length}</b> line{leftovers.length === 1 ? "" : "s"} on/before this statement {leftovers.length === 1 ? "is" : "are"} still unchecked. If they're strays or duplicates not on the statement, clear them out:</span>
                      <button onClick={() => deleteStrays(leftovers.map(e => e.id))} style={btnPaper(N.pinkDark)}>🗑 Delete {leftovers.length} stray{leftovers.length === 1 ? "" : "s"}</button>
                    </div>
                  );
                })()}
                {(() => {
                  const clearedList = all.filter(e => e.match_status === "reconciled").sort((a, b) => (b.entry_date || "").localeCompare(a.entry_date || ""));
                  if (!clearedList.length) return null;
                  return (
                    <div style={{ marginBottom: 16 }}>
                      <button onClick={() => setReconSeeCleared(v => !v)} style={{ ...btnPaper(N.muted), fontSize: 12 }}>{reconSeeCleared ? "Hide" : "See"} {clearedList.length} already-reconciled item{clearedList.length === 1 ? "" : "s"} (locked)</button>
                      {reconSeeCleared && (
                        <div style={{ border: "1px solid " + N.rule, borderRadius: 10, overflow: "hidden", marginTop: 8, maxHeight: "34vh", overflowY: "auto" }}>
                          {clearedList.map((e, i) => (
                            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderTop: i === 0 ? "none" : "1px solid " + N.rule, background: "#fafbfc" }}>
                              <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: N.pinkDark, color: "#fff", fontSize: 10, fontWeight: 700 }}>R</span>
                              <span style={{ width: 42, fontSize: 12, color: N.muted }}>{shortD(e.entry_date)}</span>
                              <span style={{ flex: 1, minWidth: 0, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.description}</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: e.direction === "in" ? "#3a7d4a" : N.red }}>{e.direction === "in" ? "+" : "−"}{money((e.amount_cents || 0) / 100)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {(() => {
                  const presets = isLiab
                    ? [["Payment", { dir: "in", category: "", memo: "Payment" }], ["Charge", { dir: "out", category: "", memo: "" }], ["Interest charged", { dir: "out", category: "CC Interest", memo: "Interest charged" }], ["Fee", { dir: "out", category: "Banking costs", memo: "Fee" }]]
                    : [["Deposit", { dir: "in", category: "", memo: "" }], ["Check / payment", { dir: "out", category: "", memo: "" }], ["Bank fee", { dir: "out", category: "Banking costs", memo: "Bank service charge" }], ["Interest earned", { dir: "in", category: "Interest income", memo: "Interest earned" }]];
                  const activeIdx = presets.findIndex(([, p]) => p.dir === reconAdd.dir && (p.category || "") === (reconAdd.category || ""));
                  return (
                  <div style={{ border: "1px solid " + N.rule, borderRadius: 10, padding: "12px 14px", marginBottom: 16, background: "#fbfdff" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: N.muted, marginBottom: 8 }}>On the statement but not in your books? Add it here — it gets an R automatically.</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      {presets.map(([lbl, p], k) => (
                        <button key={lbl} onClick={() => setReconAdd(d => ({ ...d, ...p }))} style={{ fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 100, cursor: "pointer", fontFamily: "'Figtree', sans-serif", border: "1px solid " + (activeIdx === k ? N.blue : N.rule), background: activeIdx === k ? N.blue : N.white, color: activeIdx === k ? "#fff" : N.text }}>{lbl}</button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <input value={reconAdd.amount} onChange={e => setReconAdd(d => ({ ...d, amount: e.target.value }))} placeholder="$ amount" inputMode="decimal" style={{ ...inputSt, width: 120 }} />
                      <input value={reconAdd.memo} onChange={e => setReconAdd(d => ({ ...d, memo: e.target.value }))} placeholder="Description (e.g. check #, who)" style={{ ...inputSt, flex: 1, minWidth: 180 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: reconAdd.dir === "in" ? "#3a7d4a" : N.red }}>{reconAdd.dir === "in" ? "+ money in" : "− money out"}</span>
                      <button onClick={() => addReconLine(acctId)} disabled={!(parseFloat(reconAdd.amount) > 0)} style={{ ...btnBlue, background: (parseFloat(reconAdd.amount) > 0) ? N.blue : N.mutedLite }}>Add</button>
                    </div>
                  </div>
                  );
                })()}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, background: ok ? "#eafaf0" : "#f7fafd", border: "1px solid " + (ok ? "#bff0d3" : N.rule), borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ fontSize: 13, color: N.muted }}>Beginning <b style={{ color: N.ink }}>{owed(beginning)}{isLiab ? " owed" : ""}</b> + {checkedIds.length} checked = <b style={{ color: N.ink }}>{owed(clearedBal)}{isLiab ? " owed" : ""}</b>{diff != null && (ok ? <b style={{ color: N.pinkDark, marginLeft: 10 }}>✓ Reconciled — difference $0.00</b> : <span style={{ marginLeft: 10, color: "#8a5a00" }}>Difference <b>{money((isLiab ? -diff : diff) / 100)}</b></span>)}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setReconOpen(false)} style={btnPaper(N.muted)}>Close</button>
                    <button onClick={() => attemptReconcile(checkedIds, { acctId, statementDate: reconDate, beginningCents: beginning }, diff, targetSigned)} disabled={checkedIds.length === 0 || diff == null} title={diff == null ? "Enter the statement ending balance first." : (!ok ? "Off — you'll be asked to post the difference to Suspense." : "")} style={{ ...btnBlue, background: (checkedIds.length && diff != null) ? (ok ? N.blue : "#b45309") : N.mutedLite, cursor: (checkedIds.length && diff != null) ? "pointer" : "not-allowed" }}>{diff == null ? "Enter a balance" : ok ? `Reconcile ${checkedIds.length} & lock` : `Post ${money(Math.abs(diff) / 100)} to suspense & lock`}</button>
                  </div>
                </div>
                {acctRecs.length > 0 && (
                  <div style={{ marginTop: 16, borderTop: "1px solid " + N.rule, paddingTop: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: N.muted }}>Reconciliation history — {acctFilter}</div>
                      <button onClick={() => printReconHistory(acctFilter, acctRecs, isLiab)} style={btnPaper(N.blueDark)}>🖨 Print report</button>
                    </div>
                    <div style={{ border: "1px solid " + N.rule, borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 70px 110px 80px", gap: 8, padding: "8px 12px", background: "#f7fafd", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", color: N.muted }}>
                        <span>STATEMENT DATE</span><span style={{ textAlign: "right" }}>ENDING BALANCE</span><span style={{ textAlign: "right" }}>ITEMS</span><span style={{ textAlign: "center" }}>STATEMENT</span><span style={{ textAlign: "right" }}>DONE</span>
                      </div>
                      {acctRecs.map((r, i) => {
                        const doc = r.document_id ? (entity.documents || []).find(d => d.id === r.document_id) : null;
                        return (
                        <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 70px 110px 80px", gap: 8, padding: "8px 12px", borderTop: "1px solid " + N.rule, fontSize: 13, alignItems: "center" }}>
                          <span style={{ fontWeight: 600, color: N.ink }}>{fmtStmtDate(r.statement_ending_date)}</span>
                          <span style={{ textAlign: "right" }}>{owed(r.statement_ending_balance_cents)}{isLiab ? " owed" : ""}</span>
                          <span style={{ textAlign: "right", color: N.muted }}>{r.item_count || 0}</span>
                          <span style={{ textAlign: "center" }}>{doc
                            ? <button onClick={() => downloadDoc(doc)} title={doc.name} style={{ ...btnPaper(N.blueDark), padding: "3px 8px", fontSize: 11 }}>📎 Open</button>
                            : <span style={{ color: N.mutedLite, fontSize: 11 }}>—</span>}</span>
                          <span style={{ textAlign: "right", color: N.mutedLite, fontSize: 11 }}>{r.reconciled_at || r.created_at ? new Date(r.reconciled_at || r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  function Invoices() {
    const setLine = (i, patch) => setInvDraft(d => ({ ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
    const sub = invDraft.lines.reduce((s, l) => s + (parseFloat(l.price) || 0) * (parseInt(l.qty) || 1), 0);
    const tax = invDraft.taxStatus === "Taxable" ? sub * MN_TAX_RATE : 0;
    const TAX_LABEL = { Exempt: "Tax-exempt (reseller)", Taxable: "Taxable", Shipped: "Shipped — no tax" };
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Invoices</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: N.muted }}>Sort</span>
            <select value={invSort} onChange={e => setInvSort(e.target.value)} style={{ ...inputSt, width: 170 }}>
              <option value="status">Open first</option>
              <option value="customer">Customer (A–Z)</option>
              <option value="date">Newest first</option>
              <option value="amount">Amount (high–low)</option>
            </select>
            <button onClick={() => setShowInvForm(s => !s)} style={{ ...btnBlue, fontSize: 14, padding: "10px 18px", background: N.blue, boxShadow: "0 4px 14px rgba(0,128,255,0.4)" }}>{showInvForm ? "Close" : "+ New invoice"}</button>
          </div>
        </div>

        {showInvForm && (
          <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <datalist id="pg-customers">
              {(entity.customers || []).map(c => <option key={c.id} value={c.name} />)}
            </datalist>
            <datalist id="pg-items">
              {(entity.products || []).filter(p => !p.archived).map(p => <option key={p.id} value={p.name} />)}
            </datalist>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div style={{ position: "relative" }}>
                <input placeholder="Customer — pick from QuickBooks or type new" list="pg-customers" value={invDraft.customer}
                  onChange={e => { const val = e.target.value; const c = (entity.customers || []).find(x => x.name === val); setInvDraft(d => ({ ...d, customer: val, email: c && c.email ? c.email : d.email })); }} style={{ ...inputSt, paddingRight: 26 }} />
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: N.muted, fontSize: 10 }}>▼</span>
              </div>
              <input placeholder="Customer email (optional)" value={invDraft.email} onChange={e => setInvDraft(d => ({ ...d, email: e.target.value }))} style={inputSt} />
            </div>
            <textarea placeholder="Ship to (only if different from the customer's address)" value={invDraft.ship} onChange={e => setInvDraft(d => ({ ...d, ship: e.target.value }))} rows={2} style={{ ...inputSt, resize: "vertical", marginBottom: 12 }} />
            {invDraft.lines.map((l, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 56px 96px 26px", gap: 8, marginBottom: 8 }}>
                <div style={{ position: "relative" }}>
                  <input placeholder="What they ordered" list="pg-items" value={l.desc} onChange={e => setLine(i, { desc: e.target.value })} style={{ ...inputSt, paddingRight: 22 }} />
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: N.muted, fontSize: 9 }}>▼</span>
                </div>
                <input placeholder="Qty" value={l.qty} onChange={e => setLine(i, { qty: e.target.value })} style={{ ...inputSt, textAlign: "center" }} />
                <input placeholder="$ each" value={l.price} onChange={e => setLine(i, { price: e.target.value })} style={{ ...inputSt, textAlign: "right" }} />
                <button onClick={() => setInvDraft(d => ({ ...d, lines: d.lines.filter((_, j) => j !== i) }))} style={{ border: "none", background: "none", color: N.muted, cursor: "pointer", fontSize: 18 }} aria-label="Remove line">×</button>
              </div>
            ))}
            <button onClick={() => setInvDraft(d => ({ ...d, lines: [...d.lines, { desc: "", qty: "1", price: "" }] }))} style={{ ...btnPaper(N.blue), marginBottom: 14 }}>+ Add line</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: N.muted, marginRight: 2 }}>Sales tax:</span>
              {["Exempt", "Taxable", "Shipped"].map(t => (
                <button key={t} onClick={() => setInvDraft(d => ({ ...d, taxStatus: t }))} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 100, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontWeight: 500, border: "1px solid " + (invDraft.taxStatus === t ? N.blue : N.rule), background: invDraft.taxStatus === t ? N.blue : N.white, color: invDraft.taxStatus === t ? N.white : N.text }}>{TAX_LABEL[t]}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid " + N.rule, paddingTop: 12, gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, color: N.muted }}>
                Subtotal {money(sub)}{invDraft.taxStatus === "Taxable" ? ` · MN tax (${(MN_TAX_RATE * 100).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}%) ${money(tax)}` : ""} · <b style={{ color: N.ink }}>Total {money(sub + tax)}</b>
              </div>
              <button onClick={createInvoice} style={{ ...btnBlue, background: N.blue, fontSize: 14, padding: "10px 18px" }}>Save invoice</button>
            </div>
          </div>
        )}

        {invoices.filter(v => v.docType !== "order" && recentIds.includes(v.id)).length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", background: "#fff7e0", border: "1px solid #f0d89a", borderRadius: 8, padding: "8px 14px", marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, color: "#8a5a00", fontWeight: 600 }}>⬆ Your just-entered invoices are pinned up top so you can check them before they sort in.</span>
            <button onClick={() => setRecentIds([])} style={{ ...btnPaper("#8a5a00"), padding: "5px 12px" }}>Clear</button>
          </div>
        )}
        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
          {invoices.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: N.muted, fontSize: 14 }}>No invoices yet. Click “New invoice” to make the first one.</div>
          ) : invoices.filter(v => v.docType !== "order").sort((a, b) => {
            const ra = recentRank(a.id), rb = recentRank(b.id); // just-created pinned to the top
            if (ra !== rb) return ra - rb;
            if (invSort === "customer") return (a.customer || "").localeCompare(b.customer || "") || (b.issueDate || "").localeCompare(a.issueDate || "");
            if (invSort === "date") return (b.issueDate || "").localeCompare(a.issueDate || "");
            if (invSort === "amount") return (b.amount || 0) - (a.amount || 0);
            // "status" (default): open first, then paid, then void — then by customer
            return ((a.status === "Void" ? 2 : a.status === "Paid" ? 1 : 0) - (b.status === "Void" ? 2 : b.status === "Paid" ? 1 : 0)) || (a.customer || "").localeCompare(b.customer || "");
          }).map((v, i) => {
            const voided = v.status === "Void";
            const justAdded = recentIds.includes(v.id);
            const evs = (entity.docEvents || {})[v.id] || [];
            const ls = evs.filter(e => e.event_type === "sent").reduce((m, e) => e.created_at > m ? e.created_at : m, v.sentAt || "");
            const rev = !!(ls && evs.filter(e => e.event_type === "revised").reduce((m, e) => e.created_at > m ? e.created_at : m, "") > ls);
            return (
            <div key={v.id} onClick={() => setOpenInv(v)} title="Open invoice"
              style={{ padding: "12px 16px", borderBottom: i === invoices.length - 1 ? "none" : "1px solid " + N.rule, cursor: "pointer", opacity: voided ? 0.55 : 1, background: justAdded ? "#fff7e0" : "transparent", borderLeft: justAdded ? "3px solid #eab308" : "3px solid transparent" }}
              onMouseEnter={e => (e.currentTarget.style.background = justAdded ? "#fdf0cf" : "#f7fafd")}
              onMouseLeave={e => (e.currentTarget.style.background = justAdded ? "#fff7e0" : "transparent")}>
              {/* Customer name across the top */}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontSize: 16, color: N.ink, fontWeight: 700, textDecoration: voided ? "line-through" : "none", minWidth: 0 }}>
                  {v.number ? <span style={{ color: N.blue, fontFamily: "'DM Mono', monospace", fontSize: 13, marginRight: 8 }}>#{v.number}</span> : null}{v.customer}{rev && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: "#8a5a00", background: "#fdf5e3", border: "1px solid #f0d89a", borderRadius: 5, padding: "1px 6px", marginLeft: 8 }}>REVISED</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: STATUS_COLOR[v.status] || N.muted, background: (STATUS_COLOR[v.status] || N.muted) + "18", padding: "4px 10px", borderRadius: 100 }}>{v.status}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: voided ? N.mutedLite : N.ink, textDecoration: voided ? "line-through" : "none" }}>{money(v.amount)}</span>
                </div>
              </div>
              {/* date + item + partial */}
              <div style={{ fontSize: 12, color: N.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.date} · {v.item}{v.paidCents > 0 && v.balanceCents > 0 ? <span style={{ color: "#a16207" }}> · paid {money(v.paid)}, balance {money(v.balance)}</span> : ""}</div>
              {/* action buttons underneath */}
              {!voided && (
                <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                  <button onClick={e => { e.stopPropagation(); openOnline(v); }} title="Open the invoice online — no copying links" style={btnPaper(N.blueDark)}>👁 Open</button>
                  {v.status !== "Paid" && <button onClick={e => { e.stopPropagation(); sendInvoice(v); }} style={btnPaper(N.blue)}>{v.status === "Draft" ? "Send" : "Resend"}</button>}
                  {v.status !== "Paid" && <button onClick={e => { e.stopPropagation(); openPayment(v); }} title="Full, partial, or over — type the amount received" style={btnPaper(N.pinkDark)}>💵 Payment</button>}
                  <button onClick={e => { e.stopPropagation(); editOrder(v); }} style={btnPaper(N.muted)}>Edit</button>
                </div>
              )}
            </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: N.muted, marginTop: 10 }}>Click any invoice to open it. Paid by check? Just hit <b style={{ color: N.pinkDark }}>Mark paid</b>. Sent invoices show <b style={{ color: N.blue }}>Viewed</b> when the customer opens them — the status QuickBooks took away.</div>


        {sentLink && (
          <div onClick={() => setSentLink(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 16px", zIndex: 210 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: N.white, borderRadius: 12, width: "100%", maxWidth: 520, boxShadow: "0 24px 70px rgba(10,10,20,0.35)", padding: 22 }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 4 }}>Ready to send</div>
              <div style={{ fontSize: 13, color: N.muted, marginBottom: 14 }}>When {sentLink.customer} opens it, this invoice flips to <b style={{ color: N.blue }}>Viewed</b>.</div>

              <div style={{ background: "#eef6ff", border: "1px solid #cfe4ff", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: N.blueDark, marginBottom: 8 }}>Email it from CARES Works</div>
                {emailState && emailState.ok ? (
                  <div style={{ fontSize: 13, color: N.pinkDark, fontWeight: 600 }}>✓ Sent to {emailState.ok}</div>
                ) : (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button onClick={emailInvoiceNow} disabled={emailState === "sending"} style={{ ...btnBlue, background: N.blue }}>
                      {emailState === "sending" ? "Sending…" : sentLink.email ? `Send email to ${sentLink.email}` : "Send email"}
                    </button>
                    {emailState && emailState.err && <span style={{ fontSize: 12, color: N.red }}>{emailState.err}</span>}
                  </div>
                )}
                {!sentLink.email && <div style={{ fontSize: 12, color: N.muted, marginTop: 6 }}>We'll use the email on the customer's record if the invoice doesn't have one.</div>}
              </div>

              <div style={{ fontSize: 11, color: N.muted, marginBottom: 6 }}>Or copy the link to text/share it:</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input readOnly value={sentLink.url} onFocus={e => e.target.select()} style={{ ...inputSt, fontSize: 13 }} />
                <button onClick={() => { try { navigator.clipboard.writeText(sentLink.url); } catch (e) {} }} style={{ ...btnBlue, background: N.blue }}>Copy</button>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setSentLink(null)} style={btnPaper(N.muted)}>Done</button>
              </div>
            </div>
          </div>
        )}

        {payFor && (() => {
          const lbl = { display: "block", fontSize: 11, color: N.muted, marginBottom: 4, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" };
          return (
          <div onClick={() => setPayFor(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "56px 16px", zIndex: 220 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: N.white, borderRadius: 12, width: "100%", maxWidth: 460, boxShadow: "0 24px 70px rgba(10,10,20,0.35)", padding: 22 }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 2 }}>Record a payment</div>
              <div style={{ fontSize: 13, color: N.muted, marginBottom: 16 }}>{payFor.customer}{payFor.number ? ` · No. ${payFor.number}` : ""} — total {money(payFor.amount)}{payFor.paidCents > 0 ? `, ${money(payFor.balance)} still due` : ""}.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={lbl}>AMOUNT RECEIVED</label>
                  <input inputMode="decimal" value={invPay.amount} onChange={e => setInvPay(d => ({ ...d, amount: e.target.value }))} style={inputSt} />
                </div>
                <div>
                  <label style={lbl}>DATE RECEIVED</label>
                  <input type="date" value={invPay.paid_on} onChange={e => setInvPay(d => ({ ...d, paid_on: e.target.value }))} style={inputSt} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: N.muted }}>Paid by:</span>
                {[["check", "Check"], ["ach", "ACH / bank"], ["cash", "Cash"], ["card", "Card"]].map(([m, label]) => (
                  <button key={m} onClick={() => setInvPay(d => ({ ...d, method: m }))} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 100, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontWeight: 500, border: "1px solid " + (invPay.method === m ? N.blue : N.rule), background: invPay.method === m ? N.blue : N.white, color: invPay.method === m ? N.white : N.text }}>{label}</button>
                ))}
              </div>
              {invPay.method === "check" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={lbl}>CHECK NUMBER</label>
                  <input value={invPay.check_number} onChange={e => setInvPay(d => ({ ...d, check_number: e.target.value }))} placeholder="e.g. 4021" style={inputSt} />
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>DEPOSITED TO (SHOWS IN THE NOTEBOOK)</label>
                <select value={invPay.accountId} onChange={e => setInvPay(d => ({ ...d, accountId: e.target.value }))} style={inputSt}>
                  <option value="">Which bank account?…</option>
                  {accountList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>MEMO (OPTIONAL)</label>
                <input value={invPay.memo} onChange={e => setInvPay(d => ({ ...d, memo: e.target.value }))} style={inputSt} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setPayFor(null)} style={btnPaper(N.muted)}>Cancel</button>
                <button onClick={recordPayment} style={{ ...btnBlue, background: N.pinkDark }}>Record {money(parseFloat(invPay.amount) || 0)}</button>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    );
  }

  function Orders() {
    // New Orders = every in-progress job (the pending customer bill), EXCEPT an in-house PO
    // (no customer) that's already been sent — that one lives only on Purchase Orders.
    const orderList = invoices.filter(v => v.docType === "order" && v.status !== "Invoiced" && !(v.status === "PO sent" && (!v.customer || v.customer === "—")));
    const setLine = (i, patch) => setOrderDraft(d => ({ ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
    const poMode = orderDraft.mode === "po";
    const sub = orderDraft.lines.reduce((s, l) => s + (parseFloat(l.price) || 0) * (parseInt(l.qty) || 1), 0);
    const costSub = orderDraft.lines.reduce((s, l) => s + (parseFloat(l.cost) || 0) * (parseInt(l.qty) || 1), 0);
    const tax = orderDraft.taxStatus === "Taxable" ? sub * MN_TAX_RATE : 0;
    const cols = poMode ? "120px 1fr 40px 86px 86px 22px" : "140px 1fr 46px 82px 22px";
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>New Orders</div>
            <div style={{ fontSize: 13, color: N.muted }}>Every job in progress. Start it here; add a PO if a vendor makes it; hit <b style={{ color: N.blue }}>Convert to invoice</b> to bill the customer when it's done.</div>
          </div>
          <button onClick={() => { if (showOrderForm) { setShowOrderForm(false); setEditingOrder(null); setOrderDraft(blankOrder); } else { setShowOrderForm(true); } }} style={{ ...btnBlue, background: N.blue, fontSize: 14, padding: "10px 18px" }}>{showOrderForm ? "Close" : "+ New order"}</button>
        </div>

        {showOrderForm && (
          <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <datalist id="po-customers">{(entity.customers || []).map(c => <option key={c.id} value={c.name} />)}</datalist>
            <datalist id="po-vendors">{(entity.vendors || []).map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="po-items">{(entity.products || []).filter(p => !p.archived).map(p => <option key={p.id} value={p.name} />)}</datalist>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {[["invoice", "No PO — just the job"], ["po", "Add a PO to a vendor"]].map(([m, label]) => (
                <button key={m} onClick={() => setOrderDraft(d => ({ ...d, mode: m }))} style={{ fontSize: 12.5, padding: "7px 14px", borderRadius: 100, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontWeight: 500, border: "1px solid " + (orderDraft.mode === m ? N.blue : N.rule), background: orderDraft.mode === m ? N.blue : N.white, color: orderDraft.mode === m ? N.white : N.text }}>{label}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: N.muted }}>{poMode ? "PO date" : "Invoice date"}</span>
              <input type="date" value={orderDraft.date || ""} onChange={e => setOrderDraft(d => ({ ...d, date: e.target.value }))} style={{ ...inputSt, width: 170 }} />
              <span style={{ fontSize: 11, color: N.mutedLite }}>{editingOrder ? "leave to keep the original date" : "blank = today"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: orderDraft.mode === "po" ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 12 }}>
              <div style={{ position: "relative" }}>
                <input placeholder={poMode ? "Customer (leave blank if it's for you)" : "Customer"} list="po-customers" value={orderDraft.customer} onChange={e => { const val = e.target.value; const c = (entity.customers || []).find(x => x.name === val); setOrderDraft(d => ({ ...d, customer: val, email: c && c.email ? c.email : d.email })); }} style={{ ...inputSt, paddingRight: 26 }} />
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: N.muted, fontSize: 10 }}>▼</span>
              </div>
              {orderDraft.mode === "po" && (
              <div style={{ position: "relative" }}>
                <input placeholder="Vendor who makes it" list="po-vendors" value={orderDraft.vendor} onChange={e => setOrderDraft(d => ({ ...d, vendor: e.target.value }))} style={{ ...inputSt, paddingRight: 26 }} />
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: N.muted, fontSize: 10 }}>▼</span>
              </div>
              )}
            </div>
            <textarea placeholder="Ship to (only if different from the customer's address)" value={orderDraft.ship} onChange={e => setOrderDraft(d => ({ ...d, ship: e.target.value }))} rows={2} style={{ ...inputSt, resize: "vertical", marginBottom: 12 }} />
            <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8, marginBottom: 4, fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", color: N.muted }}>
              <span>ITEM</span><span>DESCRIPTION (for reorders)</span><span style={{ textAlign: "center" }}>QTY</span>
              {poMode && <span style={{ textAlign: "right", color: N.blueDark }}>COST → PO</span>}
              <span style={{ textAlign: "right", color: poMode ? "#5a7a63" : N.muted }}>{poMode ? "PRICE → INVOICE" : "PRICE EACH"}</span>
              <span></span>
            </div>
            {orderDraft.lines.map((l, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: cols, gap: 8, marginBottom: 8, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <input placeholder="Item" list="po-items" value={l.item || ""} onChange={e => { const val = e.target.value; setLine(i, (!l.desc || l.desc === l.item) ? { item: val, desc: val } : { item: val }); }} style={{ ...inputSt, paddingRight: 18 }} />
                  <span style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: N.muted, fontSize: 9 }}>▼</span>
                </div>
                <input placeholder="Full spec — size, color, text, so it can be reordered" value={l.desc} onChange={e => setLine(i, { desc: e.target.value })} style={inputSt} />
                <input placeholder="Qty" inputMode="numeric" value={l.qty} onChange={e => setLine(i, { qty: e.target.value })} style={{ ...inputSt, textAlign: "center" }} />
                {poMode && <input placeholder="cost" inputMode="decimal" value={l.cost || ""} onChange={e => setLine(i, { cost: e.target.value })} style={{ ...inputSt, textAlign: "right", borderColor: "#cfe4ff" }} />}
                <input placeholder="price" inputMode="decimal" value={l.price} onChange={e => setLine(i, { price: e.target.value })} style={{ ...inputSt, textAlign: "right", borderColor: poMode ? "#cfe9d6" : N.rule }} />
                <button onClick={() => setOrderDraft(d => ({ ...d, lines: d.lines.filter((_, j) => j !== i) }))} style={{ border: "none", background: "none", color: N.muted, cursor: "pointer", fontSize: 18 }}>×</button>
              </div>
            ))}
            <button onClick={() => setOrderDraft(d => ({ ...d, lines: [...d.lines, { item: "", desc: "", qty: "1", cost: "", price: "" }] }))} style={{ ...btnPaper(N.blue), marginBottom: 14 }}>+ Add line</button>
            {poMode && <div style={{ fontSize: 12, color: N.muted, marginTop: -6, marginBottom: 12 }}><b style={{ color: N.blueDark }}>Cost</b> is what you pay the vendor — it prints on the PO. <b style={{ color: "#5a7a63" }}>Price</b> is what you charge the customer — it becomes the invoice.</div>}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: N.muted }}>Sales tax:</span>
              {["Exempt", "Taxable", "Shipped"].map(t => (
                <button key={t} onClick={() => setOrderDraft(d => ({ ...d, taxStatus: t }))} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 100, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontWeight: 500, border: "1px solid " + (orderDraft.taxStatus === t ? N.blue : N.rule), background: orderDraft.taxStatus === t ? N.blue : N.white, color: orderDraft.taxStatus === t ? N.white : N.text }}>{t}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid " + N.rule, paddingTop: 12, gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, color: N.muted }}>
                {poMode && <span style={{ color: N.blueDark }}>PO #{(editingOrder && editingOrder.poNumber) || entity.nextPoNumber} to vendor: <b>{money(costSub)}</b> &nbsp;·&nbsp; </span>}
                <span style={{ color: poMode ? "#5a7a63" : N.muted }}>{poMode ? "Invoice to customer: " : "Subtotal "}{money(sub)}{orderDraft.taxStatus === "Taxable" ? ` + MN tax ${money(tax)}` : ""} · <b style={{ color: N.ink }}>{money(sub + tax)}</b></span>
              </div>
              <button onClick={createOrder} style={{ ...btnBlue, background: N.blue, fontSize: 14, padding: "10px 18px" }}>{editingOrder ? "Update" : (poMode ? "Save job + PO →" : "Save job →")}</button>
            </div>
          </div>
        )}

        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
          {orderList.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: N.muted, fontSize: 14 }}>No open orders. Click “New order” to start one.</div>
          ) : orderList.map((v, i) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: i === orderList.length - 1 ? "none" : "1px solid " + N.rule, flexWrap: "wrap" }}>
              <div style={{ width: 64, fontSize: 12, color: N.muted }}>{v.poNumber ? `PO #${v.poNumber}` : "Order"}</div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontSize: 15, color: N.ink, fontWeight: 600 }}>{v.customer && v.customer !== "—" ? v.customer : (v.vendor ? "In-house · " + v.vendor : "Order")}</div>
                <div style={{ fontSize: 12, color: N.muted }}>{v.item}{v.vendor && v.customer && v.customer !== "—" ? ` · vendor: ${v.vendor}` : ""}</div>
              </div>
              {(() => {
                const costTot = (v.lines || []).reduce((s, l) => s + (l.cost || 0) * (l.qty || 1), 0);
                const priceTot = (v.lines || []).reduce((s, l) => s + (l.price || 0) * (l.qty || 1), 0);
                return (
                  <div style={{ textAlign: "right", width: 150, fontSize: 12, lineHeight: 1.4 }}>
                    {v.poNumber ? <div style={{ color: N.blueDark }}>PO cost <b>{money(costTot)}</b></div> : null}
                    <div style={{ color: "#5a7a63" }}>Invoice <b>{money(priceTot)}</b></div>
                  </div>
                );
              })()}
              {v.poNumber && v.status === "PO sent" && <span style={{ fontSize: 10, fontWeight: 700, color: N.blueDark, background: "#eef6ff", border: "1px solid #cfe4ff", borderRadius: 100, padding: "3px 9px", letterSpacing: "0.04em" }}>PO SENT</span>}
              <button onClick={() => editOrder(v)} style={btnPaper(N.muted)}>Edit</button>
              {v.poNumber && <button onClick={() => openPoSend(v)} style={btnPaper(N.blue)}>{v.status === "PO sent" ? "✉ Resend PO" : "✉ Email PO"}</button>}
              <button onClick={() => setOpenInv(v)} style={btnPaper(N.text)}>View / print</button>
              {v.customer && v.customer !== "—" && <button onClick={() => convertToInvoice(v)} style={{ ...btnBlue, background: N.blue }}>Convert to invoice →</button>}
              <button onClick={() => deleteOrder(v.id)} title="Delete order" style={{ border: "1px solid " + N.rule, background: "none", color: N.muted, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, borderRadius: 100, padding: "6px 12px" }}>Delete</button>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: N.muted, marginTop: 10 }}>An order holds the full spec so it can be reordered. Send the PO to your vendor; when it's made, hit <b style={{ color: N.blue }}>Convert to invoice</b> to bill the customer.</div>
      </div>
    );
  }

  // Dave's purchase orders — the ones out to vendors. Its own screen so he can find them.
  function PurchaseOrders() {
    const newPO = () => { setEditingOrder(null); setOrderDraft({ ...blankOrder, mode: "po" }); setShowOrderForm(true); setSection("orders"); };
    const pos = invoices.filter(v => v.docType === "order" && (v.status === "PO sent" || v.status === "Invoiced")).slice().sort((a, b) => {
      if (poSort === "po") return (a.poNumber || "").localeCompare(b.poNumber || "", undefined, { numeric: true });
      if (poSort === "date") return (b.issueDate || "").localeCompare(a.issueDate || "");
      return (a.vendor || "~").localeCompare(b.vendor || "~") || (a.poNumber || "").localeCompare(b.poNumber || "", undefined, { numeric: true });
    });
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Purchase Orders</div>
            <div style={{ fontSize: 13, color: N.muted }}>Orders out to your vendors — mostly Dave's. Email or print one, then convert it to an invoice when the job's made.</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: N.muted }}>Sort</span>
            <select value={poSort} onChange={e => setPoSort(e.target.value)} style={{ ...inputSt, width: 150 }}>
              <option value="vendor">Vendor (A–Z)</option>
              <option value="po">PO number</option>
              <option value="date">Newest first</option>
            </select>
            <button onClick={newPO} style={{ ...btnBlue, background: N.blue, fontSize: 14, padding: "10px 18px" }}>+ New purchase order</button>
          </div>
        </div>
        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
          {pos.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: N.muted, fontSize: 14 }}>No purchase orders yet. Click “New purchase order” to send one to a vendor.</div>
          ) : pos.map((v, i) => {
            const costTot = (v.lines || []).reduce((s, l) => s + (l.cost || 0) * (l.qty || 1), 0);
            return (
              <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: i === pos.length - 1 ? "none" : "1px solid " + N.rule, flexWrap: "wrap" }}>
                <div style={{ width: 74, fontSize: 13, color: N.blueDark, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>PO #{v.poNumber || "—"}</div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontSize: 15, color: N.ink, fontWeight: 600 }}>{v.vendor || "— no vendor —"}</div>
                  <div style={{ fontSize: 12, color: N.muted }}>{v.item}{v.customer && v.customer !== "—" ? ` · for ${v.customer}` : ""}</div>
                </div>
                <div style={{ textAlign: "right", width: 110, fontSize: 13, color: N.blueDark }}>cost <b>{money(costTot)}</b></div>
                {v.status === "Invoiced" && <span style={{ fontSize: 10, fontWeight: 700, color: "#5a7a63", background: "#eef7f0", border: "1px solid #cfe9d6", borderRadius: 100, padding: "3px 9px", letterSpacing: "0.04em" }}>INVOICED</span>}
                <button onClick={() => openPoSend(v)} style={btnPaper(N.blue)}>✉ Email</button>
                <button onClick={() => setOpenInv(v)} style={btnPaper(N.text)}>View / print</button>
                <button onClick={() => editOrder(v)} style={btnPaper(N.muted)}>Edit</button>
                {v.status !== "Invoiced" && <button onClick={() => convertToInvoice(v)} style={{ ...btnBlue, background: N.blue }}>Convert to invoice →</button>}
                <button onClick={() => deleteOrder(v.id)} title="Delete PO" style={{ border: "1px solid " + N.rule, background: "none", color: N.muted, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, borderRadius: 100, padding: "6px 12px" }}>Delete</button>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: N.muted, marginTop: 10 }}>Open a PO to email it to the vendor or print it. When the work comes in, <b style={{ color: N.blue }}>Convert to invoice</b> to bill the customer.</div>
      </div>
    );
  }

  function Bills() {
    const bills = entity.bills || [];
    const unpaid = bills.filter(b => b.status !== "paid");
    const paidBills = bills.filter(b => b.status === "paid");
    const openCredits = (entity.credits || []).filter(c => c.status === "open");
    const owed = unpaid.reduce((s, b) => s + (b.amount_cents || 0), 0);
    const refundsDue = openCredits.reduce((s, c) => s + (c.amount_cents || 0), 0);
    const selBills = unpaid.filter(b => selectedBills[b.id]);
    const selTotal = selBills.reduce((s, b) => s + (b.amount_cents || 0), 0);
    const toggleBill = id => setSelectedBills(p => ({ ...p, [id]: !p[id] }));
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Bills</div>
            <div style={{ fontSize: 13, color: N.muted }}>What you owe vendors. {unpaid.length} unpaid · {money(owed / 100)} outstanding{refundsDue > 0 ? ` · ${openCredits.length} refund${openCredits.length === 1 ? "" : "s"} due (${money(refundsDue / 100)})` : ""}.</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {selBills.length > 0 && <button onClick={() => payBillsByCheck(selBills)} style={{ ...btnBlue, background: N.pinkDark, fontSize: 14, padding: "10px 16px" }}>Pay {selBills.length} by check · {money(selTotal / 100)}</button>}
            <button onClick={() => setShowBillForm(s => !s)} style={{ ...btnBlue, background: N.blue, fontSize: 14, padding: "10px 18px" }}>{showBillForm ? "Close" : "+ Record a bill"}</button>
          </div>
        </div>
        <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 10, padding: "11px 14px", marginBottom: 14, fontSize: 13, color: "#8a5a00", lineHeight: 1.55, textAlign: "left" }}>
          <b>⚠ Only enter a bill if you're paying by check.</b> If it's going on a credit card or is already in the bank account, it gets entered in the <b>Notebook</b> section, not Bills. If you enter it here too, it will be a duplicate.
        </div>
        {showBillForm && (
          <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <datalist id="bill-vendors">{(entity.vendors || []).map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="bill-cats">{(entity.categories || []).map(c => <option key={c} value={c} />)}</datalist>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 150px", gap: 10, marginBottom: 10 }}>
              <div style={{ position: "relative" }}>
                <input placeholder="Vendor — pick or type new" list="bill-vendors" value={billDraft.vendor} onChange={e => setBillDraft(d => ({ ...d, vendor: e.target.value }))} style={{ ...inputSt, paddingRight: 26 }} />
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: N.muted, fontSize: 10 }}>▼</span>
              </div>
              <input placeholder="$ amount" value={billDraft.amount} onChange={e => setBillDraft(d => ({ ...d, amount: e.target.value }))} style={{ ...inputSt, textAlign: "right" }} />
              <input type="date" value={billDraft.due} onChange={e => setBillDraft(d => ({ ...d, due: e.target.value }))} style={inputSt} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div style={{ position: "relative" }}>
                <input placeholder="Which account? (category)" list="bill-cats" value={billDraft.category} onChange={e => setBillDraft(d => ({ ...d, category: e.target.value }))} style={{ ...inputSt, paddingRight: 26 }} />
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: N.muted, fontSize: 10 }}>▼</span>
              </div>
              <input placeholder="Memo (optional)" value={billDraft.memo} onChange={e => setBillDraft(d => ({ ...d, memo: e.target.value }))} style={inputSt} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}><button onClick={recordBill} style={{ ...btnBlue, background: N.blue, fontSize: 14, padding: "10px 18px" }}>Save bill</button></div>
          </div>
        )}
        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
          {unpaid.length === 0 && openCredits.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: N.muted, fontSize: 14 }}>Nothing to pay right now.{paidBills.length > 0 ? " Paid bills are tucked below." : " Record what you owe a vendor, then pay it by check."}</div>
          ) : (<>
            {/* Refunds owed to customers (open overpayment credits) — pay one by check */}
            {openCredits.map((cr, i) => (
              <div key={cr.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: "1px solid " + N.rule, background: "#fff7ed" }}>
                <span style={{ width: 16 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: N.ink }}>↩ Refund — {cr.customer_name}</div>
                  <div style={{ fontSize: 12, color: N.muted }}>Customer overpayment{cr.memo ? ` · ${cr.memo}` : ""}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#9a3412", background: "#fed7aa", padding: "4px 10px", borderRadius: 100 }}>Refund due</span>
                <button onClick={() => refundCredit(cr)} style={btnPaper(N.pinkDark)}>Refund by check</button>
                <div style={{ fontSize: 16, fontWeight: 600, color: N.ink, width: 90, textAlign: "right" }}>{money((cr.amount_cents || 0) / 100)}</div>
              </div>
            ))}
            {unpaid.length === 0 && openCredits.length > 0 && <div style={{ padding: "14px 16px", color: N.muted, fontSize: 13 }}>No vendor bills to pay.</div>}
            {unpaid.map((b, i) => (
              <div key={b.id} onClick={() => { setOpenBill(b); setBillEdit(null); }} title="Open bill"
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: i === unpaid.length - 1 ? "none" : "1px solid " + N.rule, cursor: "pointer", background: selectedBills[b.id] ? "#eef6ff" : "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = selectedBills[b.id] ? "#e3eefc" : "#f7fafd")}
                onMouseLeave={e => (e.currentTarget.style.background = selectedBills[b.id] ? "#eef6ff" : "transparent")}>
                <input type="checkbox" checked={!!selectedBills[b.id]} onClick={e => e.stopPropagation()} onChange={() => toggleBill(b.id)} title="Select to pay with one check" style={{ width: 16, height: 16, cursor: "pointer", accentColor: N.blue }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: N.ink }}>{b.vendor_name || "—"}</div>
                  <div style={{ fontSize: 12, color: N.muted }}>{b.category || "Uncategorized"}{b.due_date ? ` · due ${b.due_date}` : ""}{b.memo ? ` · ${b.memo}` : ""}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: N.red, background: N.red + "18", padding: "4px 10px", borderRadius: 100 }}>Unpaid</span>
                <button onClick={e => { e.stopPropagation(); payBillByCheck(b); }} style={btnPaper(N.text)}>Pay by check</button>
                <button onClick={e => { e.stopPropagation(); markBillPaid(b.id, true); }} style={btnPaper(N.pinkDark)}>Mark paid</button>
                <div style={{ fontSize: 16, fontWeight: 600, color: N.ink, width: 90, textAlign: "right" }}>{money((b.amount_cents || 0) / 100)}</div>
              </div>
            ))}
          </>)}
        </div>

        {paidBills.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <button onClick={() => setShowPaidBills(s => !s)} style={{ background: "none", border: "none", color: N.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Figtree', sans-serif", padding: 0 }}>{showPaidBills ? "▲ Hide" : "▾ Show"} paid bills ({paidBills.length})</button>
            {showPaidBills && (
              <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden", marginTop: 8 }}>
                {paidBills.map((b, i) => (
                  <div key={b.id} onClick={() => { setOpenBill(b); setBillEdit(null); }} title="Open bill"
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i === paidBills.length - 1 ? "none" : "1px solid " + N.rule, opacity: 0.7, cursor: "pointer" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: N.ink }}>{b.vendor_name || "—"}</div>
                      <div style={{ fontSize: 12, color: N.muted }}>{b.category || "Uncategorized"}{b.paid_at ? ` · paid ${new Date(b.paid_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}{b.memo ? ` · ${b.memo}` : ""}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: N.green, background: N.green + "18", padding: "4px 10px", borderRadius: 100 }}>Paid</span>
                    <button onClick={e => { e.stopPropagation(); reprintCheck(b); }} style={btnPaper(N.blue)}>Reprint / edit check</button>
                    <div style={{ fontSize: 15, fontWeight: 600, color: N.muted, width: 90, textAlign: "right" }}>{money((b.amount_cents || 0) / 100)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {openBill && (() => {
          const b = openBill; const paid = b.status === "paid"; const editing = billEdit && billEdit.id === b.id;
          return (
          <div onClick={() => { setOpenBill(null); setBillEdit(null); }} style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 16px", zIndex: 210 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: N.white, borderRadius: 12, width: "100%", maxWidth: 480, boxShadow: "0 24px 70px rgba(10,10,20,0.35)", padding: 22 }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 12 }}>{editing ? "Edit bill" : "Bill"}</div>
              {editing ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <input placeholder="Vendor" list="bill-vendors" value={billEdit.vendor} onChange={e => setBillEdit(d => ({ ...d, vendor: e.target.value }))} style={{ ...inputSt, paddingRight: 26 }} />
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: N.muted, fontSize: 10 }}>▼</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 10 }}>
                    <input placeholder="$ amount" value={billEdit.amount} onChange={e => setBillEdit(d => ({ ...d, amount: e.target.value }))} style={{ ...inputSt, textAlign: "right" }} />
                    <input type="date" value={billEdit.due} onChange={e => setBillEdit(d => ({ ...d, due: e.target.value }))} style={inputSt} />
                  </div>
                  <div style={{ position: "relative" }}>
                    <input placeholder="Which account? (category)" list="bill-cats" value={billEdit.category} onChange={e => setBillEdit(d => ({ ...d, category: e.target.value }))} style={{ ...inputSt, paddingRight: 26 }} />
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: N.muted, fontSize: 10 }}>▼</span>
                  </div>
                  <input placeholder="Memo (optional)" value={billEdit.memo} onChange={e => setBillEdit(d => ({ ...d, memo: e.target.value }))} style={inputSt} />
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                    <button onClick={() => setBillEdit(null)} style={btnPaper(N.muted)}>Cancel</button>
                    <button onClick={updateBill} style={{ ...btnBlue, background: N.blue }}>Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 22, fontWeight: 700, color: N.ink, marginBottom: 2 }}>{money((b.amount_cents || 0) / 100)}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: N.ink }}>{b.vendor_name || "—"}</div>
                  <div style={{ fontSize: 13, color: N.muted, marginBottom: 14 }}>{b.category || "Uncategorized"}{b.due_date ? ` · due ${b.due_date}` : ""}{b.memo ? ` · ${b.memo}` : ""} · <b style={{ color: paid ? N.green : N.red }}>{paid ? "Paid" : "Unpaid"}</b></div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <button onClick={() => setBillEdit({ id: b.id, vendor: b.vendor_name || "", amount: String((b.amount_cents || 0) / 100), due: b.due_date || "", category: b.category || "", memo: b.memo || "" })} style={btnPaper(N.muted)}>Edit</button>
                    {!paid && <button onClick={() => payBillByCheck(b)} style={{ ...btnBlue, background: N.blue }}>Pay by check</button>}
                    <button onClick={() => { markBillPaid(b.id, !paid); setOpenBill(null); }} style={btnPaper(N.pinkDark)}>{paid ? "Mark unpaid" : "Mark paid (no check)"}</button>
                    <button onClick={() => deleteBill(b.id)} style={btnPaper(N.pinkDark)}>Delete</button>
                    <button onClick={() => setOpenBill(null)} style={btnPaper(N.muted)}>Close</button>
                  </div>
                </>
              )}
            </div>
          </div>
          );
        })()}

        {checkFor && (() => {
          const checks = checkFor.checks || [checkFor];
          const start = parseInt(checkStartNum, 10) || entity.nextCheckNumber || 1001;
          const today = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
          const banks = accountList.filter(a => a.type === "bank");
          const OX = checkOffX, OY = checkOffY;
          // Only the fill-in fields print — the stock is pre-printed. Positions are the
          // standard QuickBooks "voucher" layout (check on top 3.5in of an 8.5x11 page).
          const at = (top, left) => ({ position: "absolute", top: `calc(${top}in + ${OY}in)`, left: `calc(${left}in + ${OX}in)`, fontFamily: "'Figtree', sans-serif", fontSize: "11pt", color: "#000", whiteSpace: "nowrap" });

          const CheckSheet = ({ ck, num }) => {
            const amt = (ck.amount_cents || 0) / 100;
            const vd = (entity.vendorList || []).find(v => (v.name || "").toLowerCase() === (ck.vendor_name || "").toLowerCase()) || {};
            const detail = `${ck.category || ""}${ck.memo ? (ck.category ? " · " : "") + ck.memo : ""}${ck.due_date ? ` · due ${ck.due_date}` : ""}` || "Payment";
            const Stub = ({ label, push, h }) => (
              <div style={{ height: h || "3.0in", marginTop: push || 0, padding: "0.3in 0.7in", boxSizing: "border-box", borderTop: "1px dashed #999", fontFamily: "'Figtree', sans-serif", color: "#000" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", letterSpacing: "0.06em", color: "#666", textTransform: "uppercase", marginBottom: "0.16in" }}><span>{label}</span><span>Check #{num} · {today}</span></div>
                <div style={{ fontSize: "12pt", fontWeight: 700 }}>{ck.vendor_name}</div>
                {ck._bills && ck._bills.length > 1 ? (
                  <div style={{ marginTop: "0.12in", paddingTop: "0.08in", borderTop: "1px solid #ccc", fontSize: "10pt" }}>
                    {ck._bills.map((bl, k) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}>
                        <span>{bl.category || bl.vendor_name}{bl.memo ? ` · ${bl.memo}` : ""}{bl.due_date ? ` · due ${bl.due_date}` : ""}</span>
                        <span>{money((bl.amount_cents || 0) / 100)}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.06in", paddingTop: "0.06in", borderTop: "1px solid #999", fontWeight: 700, fontSize: "11pt" }}><span>Total</span><span>{money(amt)}</span></div>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.14in", paddingTop: "0.1in", borderTop: "1px solid #ccc", fontSize: "11pt" }}>
                    <span>{detail}</span><span style={{ fontWeight: 700 }}>{money(amt)}</span>
                  </div>
                )}
              </div>
            );
            return (
              <div className="check-page" style={{ width: "8.5in", height: "9.7in", background: N.white, position: "relative", margin: "0 auto 18px", boxShadow: "0 12px 34px rgba(10,10,20,0.3)", boxSizing: "border-box", overflow: "hidden" }}>
                {/* on-screen guide only — the check area of the pre-printed stock */}
                <div className="no-print" style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3.5in", borderBottom: "1px dashed #cbd5e1", background: "#fbfdff" }}>
                  <div style={{ position: "absolute", top: 4, left: 6, fontSize: 9, color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>PRE-PRINTED CHECK #{num} — only these fields print</div>
                </div>
                {/* fill-in fields (these print) */}
                <div style={at(0.95, 6.35)}>{today}</div>
                <div style={{ ...at(1.42, 6.8), fontWeight: 700 }}>{amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div style={{ ...at(1.30, 0.95), fontSize: "12pt", fontWeight: 600 }}>{ck.vendor_name}</div>
                {/* written amount: words, then a run of ***** filling the line, ending in DOLLARS under/right of the numeric box */}
                <div style={{ ...at(1.58, 0.18), width: `calc(6.95in - ${OX}in)`, display: "flex", alignItems: "baseline", gap: "6px", overflow: "hidden", whiteSpace: "nowrap" }}>
                  <span style={{ flexShrink: 0 }}>{amountToWords(amt)}</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", letterSpacing: "1.5px" }}>{"*".repeat(80)}</span>
                  <span style={{ flexShrink: 0, fontWeight: 700 }}>DOLLARS</span>
                </div>
                {vd.billing_address ? <div style={{ ...at(1.92, 0.95), whiteSpace: "pre-line", fontSize: "10pt", lineHeight: 1.3, maxWidth: "3.4in" }}>{vd.billing_address}</div> : null}
                <div style={at(2.80, 0.6)}>{ck.memo || ck.category || ""}</div>
                {/* flow spacer for the check third, then the two tear-off stubs. File-copy stub:
                    same total height (no overprint) but its content is pushed down ~3 lines. */}
                <div style={{ height: "3.5in" }} />
                <Stub label="Remittance — send with payment" />
                <Stub label="Your file copy" push="0.45in" h="2.55in" />
              </div>
            );
          };

          return createPortal(
          <div onClick={() => setCheckFor(null)} className="check-overlay check-portal" style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", zIndex: 220, overflowY: "auto" }}>
            {/* Portaled to <body> so print can hide the (tall) app entirely — that tall body was paginating into blank "extra copies". */}
            <style>{`@media print { @page { size: letter portrait; margin: 0; } html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; } body > *:not(.check-overlay) { display: none !important; } .check-overlay, .check-overlay * { visibility: visible !important; } .no-print, .no-print * { visibility: hidden !important; } .check-overlay { position: static !important; background: #fff !important; padding: 0 !important; overflow: visible !important; display: block !important; } .check-print-root { max-width: none !important; width: 100% !important; margin: 0 !important; } .check-page { box-shadow: none !important; margin: 0 !important; page-break-after: always; break-after: page; break-inside: avoid; } .check-page:last-child { page-break-after: avoid !important; break-after: avoid !important; } .no-print { display: none !important; } }`}</style>
            <div onClick={e => e.stopPropagation()} className="check-print-root" style={{ width: "100%", maxWidth: 780 }}>
              <div className="no-print" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: N.white, borderRadius: 10, padding: "12px 16px", marginBottom: 12, boxShadow: "0 12px 34px rgba(10,10,20,0.3)" }}>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: N.ink }}>{checks.length > 1 ? `${checks.length} checks` : "Check"}</span>
                <label style={{ fontSize: 12, color: N.ink, fontWeight: 600 }}>{checks.length > 1 ? "Start check #" : "Check #"}</label>
                <input value={checkStartNum} onChange={e => setCheckStartNum(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="####" title="Type the number printed on the check in your printer" style={{ ...inputSt, width: 80, fontWeight: 700, fontSize: 15, border: "1px solid " + N.blue }} />
                {checks.length > 1 && <span style={{ fontSize: 11, color: N.muted }}>→ #{start + checks.length - 1}</span>}
                {banks.length > 0 && (<>
                  <span style={{ fontSize: 12, color: N.muted }}>From</span>
                  <select value={checkAcctId} onChange={e => setCheckAcctId(e.target.value)} style={{ ...inputSt, width: 150 }}>{banks.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                </>)}
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 6 }}>
                  <span style={{ fontSize: 12, color: N.muted }}>Align:</span>
                  <button onClick={() => setCheckOffY(y => +(y - 0.05).toFixed(2))} style={btnPaper(N.muted)} title="Move fields up">↑</button>
                  <button onClick={() => setCheckOffY(y => +(y + 0.05).toFixed(2))} style={btnPaper(N.muted)} title="Move fields down">↓</button>
                  <button onClick={() => setCheckOffX(x => +(x - 0.05).toFixed(2))} style={btnPaper(N.muted)} title="Move fields left">←</button>
                  <button onClick={() => setCheckOffX(x => +(x + 0.05).toFixed(2))} style={btnPaper(N.muted)} title="Move fields right">→</button>
                  <button onClick={() => { setCheckOffX(0); setCheckOffY(0); }} style={btnPaper(N.muted)}>Reset</button>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 11, color: N.muted, maxWidth: 190 }}>Pre-printed stock, check on top. Nudge to line up, then print.</span>
                <button onClick={() => confirmCheck(false)} style={btnPaper(N.muted)} title="Record it as paid without printing — e.g. someone already hand-wrote the check">Just mark paid — no print</button>
                <button onClick={() => confirmCheck(true)} style={{ ...btnBlue, background: N.blue }}>Print{checks.length > 1 ? ` ${checks.length}` : ""} &amp; mark paid</button>
                <button onClick={() => setCheckFor(null)} style={btnPaper(N.muted)}>Cancel</button>
              </div>

              {checks.map((ck, i) => <CheckSheet key={i} ck={ck} num={start + i} />)}
            </div>
          </div>,
          document.body
          );
        })()}
      </div>
    );
  }

  // MN sales tax is filed on CALENDAR periods (month/quarter/year) — separate from the
  // 4/1–3/31 fiscal year. We tally straight from the invoices dated inside the period.
  function stData() {
    const today = new Date();
    const isoD = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const qStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    const qEnd = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 0);
    const from = stFrom || isoD(qStart);
    const to = stTo || isoD(qEnd);
    const billed = invoices.filter(v => v.docType !== "order" && v.status !== "Void" && v.issueDate && v.issueDate >= from && v.issueDate <= to)
      .slice().sort((a, b) => (a.issueDate || "").localeCompare(b.issueDate || ""));
    const taxableSales = billed.filter(v => v.tax === "Taxable").reduce((s, v) => s + (v.amount - v.taxAmt), 0);
    const exemptSales = billed.filter(v => v.tax !== "Taxable").reduce((s, v) => s + v.amount, 0);
    const collected = billed.reduce((s, v) => s + v.taxAmt, 0);
    return { from, to, billed, taxableSales, exemptSales, collected, gross: taxableSales + exemptSales };
  }

  // Per-period sales-tax filing record (filed?/paid?/confirmation/attached return) — stored in
  // ledger_statements (kind='sales_tax'), NEVER touches balances. Keyed by period label.
  function stFiling(label) { return (entity.statements || []).find(s => s.kind === "sales_tax" && s.period_label === label); }
  async function saveTaxFiling(label, periodEnd, patch) {
    if (!live || !liveOrgId) return;
    const existing = stFiling(label);
    const data = { ...((existing && existing.data) || {}), ...patch };
    if (existing) await supabase.from("ledger_statements").update({ data }).eq("id", existing.id);
    else await supabase.from("ledger_statements").insert({ org_id: liveOrgId, user_id: session.user.id, kind: "sales_tax", period_label: label, period_end: periodEnd || null, source: "manual", data });
    setReloadTick(t => t + 1);
  }
  async function uploadTaxReturn(file, label, periodEnd) {
    if (!file || !liveOrgId) return;
    if (file.size > 25 * 1024 * 1024) { window.alert("Please keep the file under 25 MB."); return; }
    setTaxDocBusy(label);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${liveOrgId}/sales-tax/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from("org-docs").upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (upErr) throw upErr;
      const { data, error } = await supabase.from("ledger_documents").insert({ org_id: liveOrgId, user_id: session.user.id, name: file.name, path, size_bytes: file.size, mime: file.type || null, category: "Sales tax return" }).select("id, name").single();
      if (error) throw error;
      await saveTaxFiling(label, periodEnd, { returnDocId: data.id, returnDocName: data.name });
    } catch (e) { window.alert("Couldn't attach that file: " + (e.message || e)); }
    setTaxDocBusy("");
  }

  function printSalesTax() {
    const d = stData();
    const fmt = s => { const [y, m, dd] = s.split("-"); return `${m}/${dd}/${y}`; };
    const rows = d.billed.map(v => `<tr><td>${fmt(v.issueDate)}</td><td>${(v.customer || "").replace(/</g, "")}</td><td>${v.tax === "Taxable" ? "Taxable" : "Exempt"}</td><td class=r>${money(v.tax === "Taxable" ? v.amount - v.taxAmt : v.amount)}</td><td class=r>${money(v.taxAmt)}</td></tr>`).join("");
    const jl = MN_TAX_LINES.map(([lbl, rate]) => `<div class="ln"><span>${lbl} · ${(rate * 100).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}%</span><b>${money(Math.round(d.taxableSales * rate * 100) / 100)}</b></div>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Sales tax worksheet — ${entity.name || ""}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:32px;max-width:720px;margin:0 auto}
      h1{font-size:20px;margin:0 0 2px}h2{font-size:14px;color:#64748b;font-weight:600;margin:0 0 16px}
      .box{border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:18px}
      .ln{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:14px}
      .ln:last-child{border-bottom:none}.ln b{font-variant-numeric:tabular-nums}.big{font-size:16px;font-weight:700}
      table{border-collapse:collapse;width:100%;font-size:12px}th,td{padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:left}
      th{font-size:10px;letter-spacing:.06em;color:#64748b;text-transform:uppercase}.r{text-align:right;font-variant-numeric:tabular-nums}
      .foot{margin-top:16px;font-size:11px;color:#94a3b8}</style></head>
      <body><h1>${entity.name || ""}</h1><h2>Minnesota sales &amp; use tax worksheet · ${fmt(d.from)} – ${fmt(d.to)}</h2>
      <div class="box">
        <div class="ln"><span>Total sales (gross receipts)</span><b>${money(d.gross)}</b></div>
        <div class="ln"><span>Less: nontaxable / exempt sales</span><b>${money(d.exemptSales)}</b></div>
        <div class="ln"><span>Taxable sales</span><b>${money(d.taxableSales)}</b></div>
        <div class="ln big"><span>Sales tax to remit</span><b>${money(d.collected)}</b></div>
      </div>
      <h2 style="font-size:12px">MN e-Services lines — enter each on the filing</h2>
      <div class="box">${jl}<div class="ln big"><span>Total tax</span><b>${money(MN_TAX_LINES.reduce((s, [, r]) => s + Math.round(d.taxableSales * r * 100) / 100, 0))}</b></div></div>
      <h2 style="font-size:12px">Backup — ${d.billed.length} invoice${d.billed.length === 1 ? "" : "s"} in period</h2>
      <table><thead><tr><th>Date</th><th>Customer</th><th>Type</th><th class=r>Sale</th><th class=r>Tax</th></tr></thead>
      <tbody>${rows || '<tr><td colspan=5>No invoices in this period.</td></tr>'}</tbody></table>
      <div class="foot">Figures tallied from invoices dated in the period. Enter into MN e-Services. Printed ${new Date().toLocaleDateString("en-US")} · CARES Works.</div></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { window.alert("Allow pop-ups to print the report."); return; }
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => { try { w.print(); } catch (e) { /* manual */ } }, 350);
  }

  function SalesTax() {
    const d = stData();
    const today = new Date();
    const isoD = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    const y = today.getFullYear();
    const qStart = new Date(y, Math.floor(today.getMonth() / 3) * 3, 1);
    const qEnd = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 0);
    const presets = [
      ["This quarter", isoD(qStart), isoD(qEnd)],
      ["Q1 Jan–Mar", `${y}-01-01`, `${y}-03-31`],
      ["Q2 Apr–Jun", `${y}-04-01`, `${y}-06-30`],
      ["Q3 Jul–Sep", `${y}-07-01`, `${y}-09-30`],
      ["Q4 Oct–Dec", `${y}-10-01`, `${y}-12-31`],
      [`Full year ${y}`, `${y}-01-01`, `${y}-12-31`],
    ];
    const active = (f, t) => d.from === f && d.to === t;
    const fmt = s => { const [yy, m, dd] = s.split("-"); return `${m}/${dd}/${yy}`; };
    const cards = [["Total sales", money(d.gross), N.ink], ["Taxable sales", money(d.taxableSales), N.ink], ["Tax-exempt sales", money(d.exemptSales), N.muted], ["Tax to remit", money(d.collected), N.pinkDark]];
    // Period label for the filing record (quarter or full year), and the breakdown into MN e-Services lines.
    const yFrom = d.from.slice(0, 4);
    const q = Math.floor((+d.from.slice(5, 7) - 1) / 3) + 1;
    const isFullYear = d.from.endsWith("-01-01") && d.to.endsWith("-12-31");
    const isQuarter = [["01-01", "03-31"], ["04-01", "06-30"], ["07-01", "09-30"], ["10-01", "12-31"]].some(([a, b]) => d.from.endsWith(a) && d.to.endsWith(b));
    const periodLabel = isFullYear ? `${yFrom} full year` : isQuarter ? `${yFrom} Q${q}` : `${d.from} – ${d.to}`;
    const jLines = MN_TAX_LINES.map(([lbl, rate]) => [lbl, rate, Math.round(d.taxableSales * rate * 100) / 100]);
    const jTotal = jLines.reduce((s, l) => s + l[2], 0);
    const filing = stFiling(periodLabel);
    const fdata = (filing && filing.data) || {};
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Sales tax</div>
          <button onClick={printSalesTax} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px", boxShadow: "0 4px 14px rgba(0,128,255,0.35)" }}>🖨 Print filing worksheet →</button>
        </div>
        <div style={{ fontSize: 13, color: N.muted, marginBottom: 14 }}>Minnesota · filed on calendar periods. Pick your period — the figures are tallied straight from your invoices, and the worksheet matches MN e-Services line-for-line.</div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {presets.map(([lbl, f, t]) => (
            <button key={lbl} onClick={() => { setStFrom(f); setStTo(t); }} style={active(f, t) ? { ...btnBlue, background: N.blue, fontSize: 12.5, padding: "7px 13px" } : { ...btnPaper(N.blueDark), fontSize: 12.5, padding: "7px 13px" }}>{lbl}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 16, fontSize: 13, color: N.muted }}>
          <span>Or custom:</span>
          <input type="date" value={d.from} onChange={e => setStFrom(e.target.value)} style={{ ...inputSt, width: 160 }} />
          <span>→</span>
          <input type="date" value={d.to} onChange={e => setStTo(e.target.value)} style={{ ...inputSt, width: 160 }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
          {cards.map(([l, v, c]) => (
            <div key={l} style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: N.muted, letterSpacing: "0.04em", marginBottom: 6 }}>{l.toUpperCase()}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: c }}>{v}</div>
            </div>
          ))}
        </div>

        {/* MN e-Services jurisdiction lines — Betty copies each into the DOR filing */}
        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: N.ink }}>MN e-Services lines · {periodLabel}</div>
            <div style={{ fontSize: 12, color: N.muted }}>on {money(d.taxableSales)} taxable</div>
          </div>
          <div style={{ fontSize: 12, color: N.muted, marginBottom: 8 }}>Enter each line into MN e-Services. The rate splits into these jurisdictions.</div>
          {jLines.map(([lbl, rate, amt]) => (
            <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid " + N.rule, fontSize: 13 }}>
              <span style={{ color: N.text }}>{lbl} <span style={{ color: N.mutedLite, fontSize: 11 }}>{(rate * 100).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}%</span></span>
              <span style={{ fontFamily: "'DM Mono', monospace", color: N.ink }}>{money(amt)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0 0", fontWeight: 700, fontSize: 15, color: N.ink }}>
            <span>Total tax to remit</span><span style={{ fontFamily: "'DM Mono', monospace" }}>{money(jTotal)}</span>
          </div>
        </div>

        {/* Filing status — filed?/paid?/confirmation/attached return, stored separately from balances */}
        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: N.ink, marginBottom: 10 }}>Filing status · {periodLabel}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: N.ink, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={!!fdata.filed} onChange={e => saveTaxFiling(periodLabel, d.to, { filed: e.target.checked })} style={{ width: 16, height: 16 }} /> Filed to MN
              </label>
              <label style={{ fontSize: 12, color: N.muted, display: "flex", alignItems: "center", gap: 6 }}>on <input type="date" defaultValue={fdata.filedOn || ""} key={periodLabel + "-fd"} onChange={e => saveTaxFiling(periodLabel, d.to, { filedOn: e.target.value })} style={{ ...inputSt, width: 150 }} /></label>
              <input placeholder="Confirmation #" defaultValue={fdata.confirmation || ""} key={periodLabel + "-cf"} onBlur={e => saveTaxFiling(periodLabel, d.to, { confirmation: e.target.value.trim() })} style={{ ...inputSt }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: N.ink, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={!!fdata.paid} onChange={e => saveTaxFiling(periodLabel, d.to, { paid: e.target.checked })} style={{ width: 16, height: 16 }} /> Paid
              </label>
              <label style={{ fontSize: 12, color: N.muted, display: "flex", alignItems: "center", gap: 6 }}>on <input type="date" defaultValue={fdata.paidOn || ""} key={periodLabel + "-pd"} onChange={e => saveTaxFiling(periodLabel, d.to, { paidOn: e.target.value })} style={{ ...inputSt, width: 150 }} /></label>
              <input inputMode="decimal" placeholder="Amount paid" defaultValue={fdata.paidCents ? (fdata.paidCents / 100).toFixed(2) : ""} key={periodLabel + "-pa"} onBlur={e => saveTaxFiling(periodLabel, d.to, { paidCents: Math.round((parseFloat(e.target.value) || 0) * 100) })} style={{ ...inputSt }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <label style={{ ...btnPaper(N.blue), cursor: "pointer" }}>
              {taxDocBusy === periodLabel ? "Uploading…" : "📎 Attach filed return"}
              <input type="file" style={{ display: "none" }} onChange={e => { const f = e.target.files && e.target.files[0]; if (f) uploadTaxReturn(f, periodLabel, d.to); e.target.value = ""; }} />
            </label>
            {fdata.returnDocName ? <span style={{ fontSize: 12, color: "#5a7a63", fontWeight: 600 }}>✓ {fdata.returnDocName}</span> : <span style={{ fontSize: 12, color: N.mutedLite }}>no return attached yet</span>}
          </div>
          <input placeholder="Note (optional)" defaultValue={fdata.note || ""} key={periodLabel + "-nt"} onBlur={e => saveTaxFiling(periodLabel, d.to, { note: e.target.value.trim() })} style={{ ...inputSt, marginTop: 10 }} />
        </div>

        {/* Open questions / flags for this workflow */}
        <div style={{ background: "#fbf7ee", border: "1px solid #f0e2c0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8a5a00", letterSpacing: "0.03em", marginBottom: 8 }}>QUESTIONS &amp; NOTES</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: N.text, lineHeight: 1.7 }}>
            <li>These totals tally <b>by invoice date (accrual)</b>. MN files <b>cash basis</b> (tax owed when the customer pays) — reconcile the period figure against what QuickBooks / DOR shows was received.</li>
            <li>Confirm the <b>filing frequency</b> with MN DOR (monthly / quarterly / annual) — set up quarterly for now.</li>
            <li>Shipping is billed as a <b>pass-through</b> and is not taxed.</li>
            <li>What was actually <b>filed &amp; paid to DOR</b> is unknown until the DOR account is checked — record it in Filing status above once confirmed.</li>
          </ul>
        </div>

        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 80px 110px 90px", gap: 8, padding: "8px 16px", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.06em", color: N.muted }}>
            <span>DATE</span><span>CUSTOMER</span><span>TYPE</span><span style={{ textAlign: "right" }}>SALE</span><span style={{ textAlign: "right" }}>TAX</span>
          </div>
          {d.billed.length === 0
            ? <div style={{ padding: "18px 16px", fontSize: 13, color: N.muted, borderTop: "1px solid " + N.rule }}>No invoices dated in this period. {invoices.length === 0 ? "No invoices in the system yet." : "Pick a different period above."}</div>
            : d.billed.map(v => (
              <div key={v.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr 80px 110px 90px", gap: 8, padding: "9px 16px", borderTop: "1px solid " + N.rule, fontSize: 13, alignItems: "center" }}>
                <span style={{ color: N.muted }}>{fmt(v.issueDate)}</span>
                <span style={{ color: N.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.customer}</span>
                <span style={{ fontSize: 11, color: v.tax === "Taxable" ? N.pinkDark : N.muted }}>{v.tax === "Taxable" ? "Taxable" : "Exempt"}</span>
                <span style={{ textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{money(v.tax === "Taxable" ? v.amount - v.taxAmt : v.amount)}</span>
                <span style={{ textAlign: "right", fontFamily: "'DM Mono', monospace", color: N.pinkDark }}>{money(v.taxAmt)}</span>
              </div>
            ))}
        </div>
        <div style={{ fontSize: 12, color: N.muted, marginTop: 10 }}>Every taxable / exempt line is tallied automatically. For periods before you started in the app, the old invoices need to come in first — say the word and I'll pull them from QuickBooks.</div>
      </div>
    );
  }

  async function uploadLogo(file) {
    if (!file || !liveOrgId) return;
    if (file.size > 5 * 1024 * 1024) { window.alert("That image is over 5 MB — please use a smaller one."); return; }
    setLogoBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${liveOrgId}/logo.${ext || "png"}`;
      const { error: upErr } = await supabase.storage.from("org-assets").upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type || undefined });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("org-assets").getPublicUrl(path);
      const url = pub.publicUrl + "?v=" + Date.now();
      await supabase.from("ledger_orgs").update({ logo_url: url }).eq("id", liveOrgId);
      setReloadTick(t => t + 1);
    } catch (e) { window.alert("Couldn't upload that image: " + (e.message || e)); }
    setLogoBusy(false);
  }
  async function removeLogo() {
    if (!liveOrgId) return;
    await supabase.from("ledger_orgs").update({ logo_url: null }).eq("id", liveOrgId);
    setReloadTick(t => t + 1);
  }
  // ---- Documents (private per-org storage) ------------------------------------
  async function uploadDoc(file) {
    if (!file || !liveOrgId) return;
    if (file.size > 25 * 1024 * 1024) { window.alert("Please keep files under 25 MB."); return; }
    setDocBusy(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${liveOrgId}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from("org-docs").upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (upErr) throw upErr;
      await supabase.from("ledger_documents").insert({ org_id: liveOrgId, user_id: session.user.id, name: file.name, path, size_bytes: file.size, mime: file.type || null, category: docCategory || null });
      setReloadTick(t => t + 1);
    } catch (e) { window.alert("Couldn't upload that file: " + (e.message || e)); }
    setDocBusy(false);
  }
  // Attach the actual statement (PDF or CSV) to a reconciliation — filed in Documents and linked to the rec.
  async function attachReconStatement(file) {
    if (!file || !liveOrgId) return;
    const isOk = /\.(pdf|csv)$/i.test(file.name) || file.type === "application/pdf" || file.type === "text/csv";
    if (!isOk) { window.alert("The statement needs to be a PDF or a CSV."); return; }
    if (file.size > 25 * 1024 * 1024) { window.alert("Please keep files under 25 MB."); return; }
    setReconStmtBusy(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${liveOrgId}/statements/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from("org-docs").upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (upErr) throw upErr;
      const { data, error } = await supabase.from("ledger_documents").insert({ org_id: liveOrgId, user_id: session.user.id, name: file.name, path, size_bytes: file.size, mime: file.type || null, category: "Bank statement" }).select("id, name").single();
      if (error) throw error;
      setReconStmtDoc({ id: data.id, name: data.name });
      setReloadTick(t => t + 1);
    } catch (e) { window.alert("Couldn't attach that file: " + (e.message || e)); }
    setReconStmtBusy(false);
  }
  // Attach a statement PDF/CSV to an existing (past) reconciliation from the history.
  async function attachStatementToRec(recId, file) {
    if (!file || !liveOrgId || !recId) return;
    const isOk = /\.(pdf|csv)$/i.test(file.name) || file.type === "application/pdf" || file.type === "text/csv";
    if (!isOk) { window.alert("The statement needs to be a PDF or a CSV."); return; }
    if (file.size > 25 * 1024 * 1024) { window.alert("Please keep files under 25 MB."); return; }
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${liveOrgId}/statements/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from("org-docs").upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (upErr) throw upErr;
      const { data, error } = await supabase.from("ledger_documents").insert({ org_id: liveOrgId, user_id: session.user.id, name: file.name, path, size_bytes: file.size, mime: file.type || null, category: "Bank statement" }).select("id").single();
      if (error) throw error;
      await supabase.from("ledger_reconciliations").update({ document_id: data.id }).eq("id", recId);
      setReloadTick(t => t + 1);
    } catch (e) { window.alert("Couldn't attach that file: " + (e.message || e)); }
  }
  // Remove the statement attached to a reconciliation (unlinks it so a new one can go on).
  async function detachStatementFromRec(recId) {
    if (!liveOrgId || !recId) return;
    if (!window.confirm("Remove this statement from the reconciliation? You can upload the right one after.")) return;
    await supabase.from("ledger_reconciliations").update({ document_id: null }).eq("id", recId);
    setReloadTick(t => t + 1);
  }
  async function downloadDoc(doc) {
    const { data, error } = await supabase.storage.from("org-docs").createSignedUrl(doc.path, 300);
    if (error || !data) { window.alert("Couldn't open that file."); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }
  async function deleteDoc(doc) {
    if (!liveOrgId) return;
    if (!window.confirm(`Remove "${doc.name}"? This deletes the file for good.`)) return;
    await supabase.storage.from("org-docs").remove([doc.path]);
    await supabase.from("ledger_documents").delete().eq("id", doc.id);
    setReloadTick(t => t + 1);
  }
  // ---- Statement import (upload a bank/card CSV → transactions) ----------------
  function openImport(acctId) { setImportData(null); setImportAcctId(acctId); }
  function onImportFile(file) {
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      const all = parseCSV(String(rd.result || ""));
      // pick the header row = the first row whose cells mostly look like labels (has "date" or "amount"/"description")
      let hi = 0;
      for (let i = 0; i < Math.min(all.length, 15); i++) {
        const low = all[i].map(c => (c || "").toLowerCase());
        if (low.some(h => /date/.test(h)) && low.some(h => /amount|debit|credit|withdraw|deposit|balance|description|payee/.test(h))) { hi = i; break; }
      }
      const headers = (all[hi] || []).map(h => (h || "").trim());
      const rows = all.slice(hi + 1);
      if (!headers.length || !rows.length) { window.alert("Couldn't read that file — is it a CSV export from the bank?"); return; }
      const low = headers.map(h => h.toLowerCase());
      const find = (...keys) => { for (const k of keys) { const i = low.findIndex(h => h.includes(k)); if (i >= 0) return i; } return -1; };
      const map = {
        date: find("post date", "posted date", "transaction date", "date"),
        desc: find("description", "payee", "memo", "name", "details", "merchant"),
        amount: find("amount"),
        debit: find("debit", "withdrawal", "payment", "charges"),
        credit: find("credit", "deposit", "payments"),
        // for a single signed Amount column: does a POSITIVE number mean money OUT? (true for many card exports)
        posIsOut: false,
      };
      setImportData({ fileName: file.name, headers, rows, map });
    };
    rd.readAsText(file);
  }
  function importRowsPreview() {
    if (!importData) return { entries: [], skipped: 0 };
    const m = importData.map, out = [];
    let skipped = 0;
    for (const r of importData.rows) {
      const date = parseStmtDate(r[m.date]);
      const desc = (r[m.desc] != null ? String(r[m.desc]) : "").trim() || "Transaction";
      let cents = null, direction = null;
      if (m.amount >= 0 && (m.debit < 0 || m.credit < 0)) {
        const amt = parseMoney(r[m.amount]);
        if (amt == null || amt === 0) { skipped++; continue; }
        const isOut = m.posIsOut ? amt > 0 : amt < 0;
        cents = Math.round(Math.abs(amt) * 100); direction = isOut ? "out" : "in";
      } else {
        const deb = m.debit >= 0 ? parseMoney(r[m.debit]) : null;
        const cred = m.credit >= 0 ? parseMoney(r[m.credit]) : null;
        if (deb && Math.abs(deb) > 0) { cents = Math.round(Math.abs(deb) * 100); direction = "out"; }
        else if (cred && Math.abs(cred) > 0) { cents = Math.round(Math.abs(cred) * 100); direction = "in"; }
        else { skipped++; continue; }
      }
      if (!date || !cents) { skipped++; continue; }
      out.push({ entry_date: date, amount_cents: cents, direction, description: desc });
    }
    return { entries: out, skipped };
  }
  async function runImport() {
    const acct = accountList.find(a => a.id === importAcctId);
    if (!importData || !acct || !liveOrgId) return;
    if (testMode) { window.alert("Test mode — importing is off. Exit test mode to load real transactions."); return; }
    const { entries } = importRowsPreview();
    if (!entries.length) { window.alert("No transactions read — check that the Date and Amount columns are picked right."); return; }
    setImportBusy(true);
    try {
      const withHash = entries.map(e => ({ ...e, source_hash: `csv|${acct.id}|${e.entry_date}|${e.direction}|${e.amount_cents}|${e.description}`.slice(0, 240) }));
      const { data: existing } = await supabase.from("ledger_entries").select("source_hash").eq("org_id", liveOrgId).eq("account_id", acct.id).not("source_hash", "is", null);
      const seen = new Set((existing || []).map(e => e.source_hash));
      const uniq = []; const local = new Set();
      for (const e of withHash) { if (!seen.has(e.source_hash) && !local.has(e.source_hash)) { local.add(e.source_hash); uniq.push(e); } }
      if (uniq.length) {
        await supabase.from("ledger_entries").insert(uniq.map(e => ({ org_id: liveOrgId, user_id: session.user.id, entry_date: e.entry_date, direction: e.direction, amount_cents: e.amount_cents, description: e.description, account_id: acct.id, source_hash: e.source_hash, match_status: null })));
      }
      const dup = withHash.length - uniq.length;
      window.alert(`Imported ${uniq.length} transaction${uniq.length === 1 ? "" : "s"} into ${acct.name}.${dup > 0 ? ` (${dup} were already there and skipped.)` : ""}`);
      setImportAcctId(null); setImportData(null); setReloadTick(t => t + 1);
    } catch (e) { window.alert("Import failed: " + (e.message || e)); }
    setImportBusy(false);
  }
  async function saveBrandColor(color) {
    if (!liveOrgId) return;
    await supabase.from("ledger_orgs").update({ brand_color: color }).eq("id", liveOrgId);
    setReloadTick(t => t + 1);
  }
  function Settings() {
    return (
      <div style={{ maxWidth: 580 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 2 }}>Your logo &amp; color</div>
        <div style={{ fontSize: 13, color: N.muted, marginBottom: 16, lineHeight: 1.6 }}>Your logo shows at the top of every <b>invoice</b>, <b>purchase order</b>, and the copy your customers open online. Use a <b>PNG or JPG</b> — a wide, horizontal logo looks best. If there's no logo, your business name is shown instead.</div>
        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: N.muted, marginBottom: 10 }}>CURRENT LOGO</div>
          <div style={{ minHeight: 70, display: "flex", alignItems: "center", justifyContent: "center", background: "#f7fafd", border: "1px dashed " + N.rule, borderRadius: 10, padding: 14, marginBottom: 14 }}>
            {entity.logoUrl ? <img src={entity.logoUrl} alt={entity.name} style={{ maxHeight: 70, maxWidth: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: 13, color: N.mutedLite }}>No logo yet — “{entity.short || entity.name}” shows instead.</span>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ ...btnBlue, background: logoBusy ? N.mutedLite : N.blue, cursor: logoBusy ? "default" : "pointer" }}>
              {logoBusy ? "Uploading…" : (entity.logoUrl ? "Replace logo" : "Upload a logo")}
              <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" disabled={logoBusy} onChange={e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; uploadLogo(f); }} style={{ display: "none" }} />
            </label>
            {entity.logoUrl && <button onClick={removeLogo} style={btnPaper(N.pinkDark)}>Remove</button>}
          </div>
        </div>
        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: N.muted, marginBottom: 10 }}>BRAND COLOR</div>
          <div style={{ fontSize: 13, color: N.muted, marginBottom: 12 }}>Used for the “INVOICE / PURCHASE ORDER” heading on your documents.</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input type="color" value={entity.brandColor || "#0080ff"} onChange={e => saveBrandColor(e.target.value)} style={{ width: 46, height: 34, border: "1px solid " + N.rule, borderRadius: 8, cursor: "pointer", background: "none", padding: 2 }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: N.ink }}>{(entity.brandColor || "#0080ff").toUpperCase()}</span>
            {["#0080ff", "#0a0a14", "#22a06b", "#c0392b", "#7c3aed"].map(c => (
              <button key={c} onClick={() => saveBrandColor(c)} title={c} style={{ width: 26, height: 26, borderRadius: 100, border: "2px solid " + (((entity.brandColor || "#0080ff").toLowerCase() === c) ? N.ink : "#fff"), background: c, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  function Reports() {
    const balOf = v => (v.balanceCents != null ? v.balanceCents : Math.round((v.amount || 0) * 100));
    const ar = invoices.filter(v => v.docType !== "order" && v.status !== "Void" && v.status !== "Paid" && balOf(v) > 0)
      .sort((a, b) => (a.customer || "").localeCompare(b.customer || "") || (a.issueDate || "").localeCompare(b.issueDate || ""));
    const arTotal = ar.reduce((s, v) => s + balOf(v), 0);
    const credits = (entity.credits || []);
    const credTotal = credits.reduce((s, c) => s + (c.amount_cents || 0), 0);
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Who owes you (A/R)</div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: N.muted, letterSpacing: "0.04em" }}>OPEN RECEIVABLES</div><div style={{ fontSize: 22, fontWeight: 700, color: N.red }}>{money(arTotal / 100)}</div></div>
            {credTotal > 0 && <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: N.muted, letterSpacing: "0.04em" }}>CUSTOMER CREDITS</div><div style={{ fontSize: 22, fontWeight: 700, color: N.pinkDark }}>{money(credTotal / 100)}</div></div>}
          </div>
        </div>
        <div style={{ fontSize: 13, color: N.muted, marginBottom: 12 }}>Every unpaid invoice with a balance, oldest per customer first. Click one to open it.</div>
        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 96px 96px 96px", gap: 8, padding: "9px 16px", background: "#f7fafd", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", color: N.muted }}>
            <span>CUSTOMER · INVOICE</span><span style={{ textAlign: "center" }}>DATE</span><span style={{ textAlign: "right" }}>TOTAL</span><span style={{ textAlign: "right" }}>PAID</span><span style={{ textAlign: "right" }}>BALANCE</span>
          </div>
          {ar.length === 0 ? (
            <div style={{ padding: "26px 16px", textAlign: "center", color: N.muted, fontSize: 14 }}>Nothing outstanding — every invoice is paid. 🎉</div>
          ) : ar.map((v, i) => (
            <div key={v.id} onClick={() => setOpenInv(v)} title="Open invoice" style={{ display: "grid", gridTemplateColumns: "1fr 80px 96px 96px 96px", gap: 8, padding: "11px 16px", borderTop: "1px solid " + N.rule, fontSize: 13, cursor: "pointer", alignItems: "center" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f7fafd")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><b style={{ color: N.ink }}>{v.customer}</b>{v.number ? <span style={{ color: N.blue, fontFamily: "'DM Mono', monospace", fontSize: 12 }}> · #{v.number}</span> : ""}<span style={{ fontSize: 11, color: N.muted }}> · {v.status}</span></span>
              <span style={{ textAlign: "center", color: N.muted }}>{v.date}</span>
              <span style={{ textAlign: "right", color: N.muted }}>{money(v.amount)}</span>
              <span style={{ textAlign: "right", color: "#a16207" }}>{v.paid > 0 ? money(v.paid) : "—"}</span>
              <span style={{ textAlign: "right", fontWeight: 700, color: N.red }}>{money(balOf(v) / 100)}</span>
            </div>
          ))}
        </div>
        {credits.length > 0 && (
          <div style={{ background: "#f6fdf9", border: "1px solid #bff0d3", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: "10px 16px", fontSize: 12, fontWeight: 700, color: N.pinkDark, borderBottom: "1px solid #bff0d3" }}>Money you owe back — customer credits from overpayments</div>
            {credits.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "9px 16px", fontSize: 13, borderTop: "1px solid #dff3e6" }}>
                <span style={{ flex: 1, minWidth: 160 }}><b style={{ color: N.ink }}>{c.customer_name}</b>{c.memo ? <span style={{ color: N.muted }}> · {c.memo}</span> : ""}</span>
                <span style={{ fontWeight: 700, color: N.red }}>−{money((c.amount_cents || 0) / 100)}</span>
                <button onClick={() => refundCredit(c)} style={{ ...btnBlue, background: N.pinkDark }}>Write refund check →</button>
              </div>
            ))}
            <div style={{ padding: "8px 16px", fontSize: 11, color: N.muted, borderTop: "1px solid #dff3e6" }}>This sits on the customer's account, not on an invoice. <b>Write refund check</b> cuts them a check here, or apply it to their next invoice from that invoice.</div>
          </div>
        )}

        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 4 }}>Year-end reports</div>
        <div style={{ fontSize: 13, color: N.muted, marginBottom: 16 }}>Fiscal year ends {entity.fiscalYearEnd}. One click for the tax-ready package.</div>
        <div style={{ display: "grid", gap: 10 }}>
          {entity.reports.map(r => (
            <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 14, background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: N.ink }}>{r.name}</div>
                <div style={{ fontSize: 12, color: N.muted }}>{r.sub}</div>
              </div>
              <button style={btnPaper(N.text)}>View · PDF · CSV</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function Documents() {
    const docs = entity.documents || [];
    const cats = ["QuickBooks close-out", "Bank / card statement", "Exemption certificate", "Tax / year-end", "Other"];
    const fmtSize = b => (!b ? "" : b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
    const fmtDate = d => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
    return (
      <div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 4 }}>Documents</div>
        <div style={{ fontSize: 13, color: N.muted, marginBottom: 16 }}>A safe home for your QuickBooks close-out reports, bank &amp; card statements, exemption certificates — anything you want on file. Only your team can see these.</div>
        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: N.muted }}>File type</span>
          <select value={docCategory} onChange={e => setDocCategory(e.target.value)} style={{ ...inputSt, width: 210 }}>{cats.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <label style={{ ...btnBlue, background: docBusy ? N.mutedLite : N.blue, cursor: docBusy ? "default" : "pointer" }}>
            {docBusy ? "Uploading…" : "⬆ Upload a file"}
            <input type="file" disabled={docBusy} onChange={e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; uploadDoc(f); }} style={{ display: "none" }} />
          </label>
          <span style={{ fontSize: 11, color: N.mutedLite }}>PDF, Excel, images — up to 25 MB each.</span>
        </div>
        {(() => {
          const groups = [
            { key: "statements", label: "Bank & card statements", icon: "🏦", match: c => /statement|bank|card/i.test(c || "") },
            { key: "quickbooks", label: "QuickBooks", icon: "📗", match: c => /quickbook/i.test(c || "") },
            { key: "tax", label: "Tax / year-end", icon: "🧾", match: c => /tax|year/i.test(c || "") },
            { key: "exemption", label: "Exemption certificates", icon: "📄", match: c => /exempt/i.test(c || "") },
            { key: "other", label: "Other", icon: "📁", match: () => true },
          ];
          const groupOf = d => (groups.find(g => g.match(d.category)) || groups[groups.length - 1]).key;
          if (docs.length === 0) {
            return <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: "30px 20px", textAlign: "center", color: N.muted, fontSize: 14 }}>Nothing here yet — upload your first document above.</div>;
          }
          if (!docFilter) {
            // Dashboard: category tiles, so a full drawer of files isn't dumped on screen.
            return (
              <>
                <div style={{ fontSize: 12, color: N.muted, marginBottom: 10 }}>Pick what you want to see:</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  {groups.map(g => {
                    const n = docs.filter(d => groupOf(d) === g.key).length;
                    if (!n) return null;
                    return (
                      <button key={g.key} onClick={() => setDocFilter(g.key)} style={{ textAlign: "left", background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: "16px 18px", cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
                        <div style={{ fontSize: 24 }}>{g.icon}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: N.ink, marginTop: 6 }}>{g.label}</div>
                        <div style={{ fontSize: 12, color: N.muted, marginTop: 2 }}>{n} file{n === 1 ? "" : "s"} →</div>
                      </button>
                    );
                  })}
                </div>
              </>
            );
          }
          const g = groups.find(x => x.key === docFilter) || groups[groups.length - 1];
          const shown = docs.filter(d => groupOf(d) === g.key).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
          return (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <button onClick={() => setDocFilter(null)} style={btnPaper(N.muted)}>← All categories</button>
                <span style={{ fontSize: 15, fontWeight: 700, color: N.ink }}>{g.icon} {g.label}</span>
                <span style={{ fontSize: 12, color: N.muted }}>{shown.length} file{shown.length === 1 ? "" : "s"}</span>
              </div>
              <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
                {shown.map((d, i) => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: i === 0 ? "none" : "1px solid " + N.rule, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: N.ink, wordBreak: "break-word" }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: N.muted }}>{d.category ? d.category + " · " : ""}{fmtDate(d.created_at)}{d.size_bytes ? " · " + fmtSize(d.size_bytes) : ""}</div>
                    </div>
                    <button onClick={() => downloadDoc(d)} style={btnPaper(N.blueDark)}>Open</button>
                    <button onClick={() => deleteDoc(d)} style={{ border: "1px solid " + N.rule, background: "none", color: N.pinkDark, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, borderRadius: 100, padding: "6px 12px" }}>Remove</button>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </div>
    );
  }

  function Stub({ title, note }) {
    return (
      <div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 6 }}>{title}</div>
        <div style={{ background: N.white, border: "1px dashed " + N.rule, borderRadius: 12, padding: "40px 20px", textAlign: "center", color: N.muted, fontSize: 14 }}>{note}</div>
      </div>
    );
  }

  function Accounts() {
    const rows = entity.rawAccounts || [];
    const typeLabel = t => (ACCOUNT_TYPES.find(x => x.value === t)?.label || t);
    const grouped = ACCOUNT_TYPES.map(t => ({ ...t, rows: rows.filter(r => r.account_type === t.value).slice().sort((a, b) => (a.name || "").localeCompare(b.name || "")) })).filter(g => g.rows.length);
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Accounts</div>
            <div style={{ fontSize: 13, color: N.muted }}>Your banks, cards, and loans. You set these — add the last four when you have it, and real opening balances from each statement.</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={connectPlaid} disabled={!!plaidBusy} style={{ ...btnBlue, background: plaidBusy ? N.mutedLite : N.green, fontSize: 13, padding: "9px 16px" }}>{plaidBusy ? (plaidBusy === "connecting" ? "Opening…" : plaidBusy === "linking" ? "Linking…" : "Syncing…") : "🔗 Connect a bank / card"}</button>
            <button onClick={syncPlaid} disabled={!!plaidBusy} title="Pull new transactions from connected accounts" style={{ ...btnPaper(N.blue), fontSize: 13, padding: "9px 16px" }}>Sync now</button>
            <button onClick={() => { setShowAddAcct(s => !s); setNewAcct(blankAcct); }} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>{showAddAcct ? "Close" : "+ Add account"}</button>
          </div>
        </div>

        {showAddAcct && (
          <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 14, marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input placeholder="Account name (e.g. Citibank 4)" value={newAcct.name} onChange={e => setNewAcct(d => ({ ...d, name: e.target.value }))} style={{ ...inputSt, flex: 1, minWidth: 200 }} />
            <select value={newAcct.account_type} onChange={e => setNewAcct(d => ({ ...d, account_type: e.target.value }))} style={{ ...inputSt, width: 190 }}>
              {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input placeholder="Last 4" maxLength={4} value={newAcct.last_four} onChange={e => setNewAcct(d => ({ ...d, last_four: e.target.value.replace(/\D/g, "") }))} style={{ ...inputSt, width: 90 }} />
            <input placeholder="Opening balance $" value={newAcct.opening} onChange={e => setNewAcct(d => ({ ...d, opening: e.target.value }))} style={{ ...inputSt, width: 150 }} />
            <button onClick={addAccount} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>Save</button>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: N.muted, cursor: "pointer", width: "100%" }}>
              <input type="checkbox" checked={!!newAcct.needs_info} onChange={e => setNewAcct(d => ({ ...d, needs_info: e.target.checked }))} />
              ⚠ Opening balance is an estimate — flag it "needs info"
            </label>
            {newAcct.needs_info && <input placeholder="What's still needed? (e.g. lender name + 3/31 balance)" value={newAcct.info_note} onChange={e => setNewAcct(d => ({ ...d, info_note: e.target.value }))} style={{ ...inputSt, width: "100%" }} />}
          </div>
        )}

        {grouped.length === 0 && <div style={{ background: N.white, border: "1px dashed " + N.rule, borderRadius: 12, padding: "40px 20px", textAlign: "center", color: N.muted, fontSize: 14 }}>No accounts yet — add your first above.</div>}

        {grouped.map(g => (
          <div key={g.value} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: N.muted, marginBottom: 6 }}>{g.label}</div>
            <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
              {g.rows.map((a, i) => {
                const editing = acctEditId === a.id;
                return (
                  <div key={a.id} style={{ padding: "12px 16px", borderTop: i === 0 ? "none" : "1px solid " + N.rule }}>
                    {editing ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <input value={acctDraft.name} onChange={e => setAcctDraft(d => ({ ...d, name: e.target.value }))} style={{ ...inputSt, flex: 1, minWidth: 180 }} />
                        <select value={acctDraft.account_type} onChange={e => setAcctDraft(d => ({ ...d, account_type: e.target.value }))} style={{ ...inputSt, width: 190 }}>
                          {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <input placeholder="Last 4" maxLength={4} value={acctDraft.last_four} onChange={e => setAcctDraft(d => ({ ...d, last_four: e.target.value.replace(/\D/g, "") }))} style={{ ...inputSt, width: 90 }} />
                        <input placeholder="Opening $" value={acctDraft.opening} onChange={e => setAcctDraft(d => ({ ...d, opening: e.target.value }))} style={{ ...inputSt, width: 140 }} />
                        <button onClick={saveAccount} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 14px" }}>Save</button>
                        <button onClick={() => setAcctEditId(null)} style={btnPaper(N.muted)}>Cancel</button>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: N.muted, cursor: "pointer", width: "100%" }}>
                          <input type="checkbox" checked={!!acctDraft.needs_info} onChange={e => setAcctDraft(d => ({ ...d, needs_info: e.target.checked }))} />
                          ⚠ Opening balance is an estimate — flag it "needs info"
                        </label>
                        {acctDraft.needs_info && <input placeholder="What's still needed?" value={acctDraft.info_note} onChange={e => setAcctDraft(d => ({ ...d, info_note: e.target.value }))} style={{ ...inputSt, width: "100%" }} />}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: N.ink }}>{a.name}{a.last_four && <span style={{ color: N.muted, fontWeight: 400 }}> ••{a.last_four}</span>}{a.needs_info && <span title="Opening balance is an estimate — needs info" style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: "#b45309", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 100, padding: "1px 9px" }}>⚠ NEEDS INFO</span>}</div>
                          <div style={{ fontSize: 12, color: N.muted }}>{typeLabel(a.account_type)} · opening {money((a.opening_balance_cents || 0) / 100)}</div>
                          {a.needs_info && a.info_note && <div style={{ fontSize: 12, color: "#b45309", marginTop: 3, fontStyle: "italic" }}>{a.info_note}</div>}
                        </div>
                        <button onClick={() => openImport(a.id)} title="Import transaction lines from a bank/card CSV export" style={{ ...btnPaper(N.blueDark), padding: "6px 12px" }}>⬆ Upload transactions</button>
                        <button onClick={() => { setAcctEditId(a.id); setAcctDraft({ name: a.name, account_type: a.account_type, last_four: a.last_four || "", opening: String((a.opening_balance_cents || 0) / 100), needs_info: !!a.needs_info, info_note: a.info_note || "" }); }} style={{ ...btnPaper(N.muted), padding: "6px 12px" }}>Edit</button>
                        <button onClick={() => archiveAccount(a.id)} title="Archive" style={{ background: "none", border: "1px solid " + N.rule, borderRadius: 100, cursor: "pointer", color: N.muted, fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, padding: "6px 12px" }}>Archive</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function Items() {
    const rows = (entity.products || []).slice().sort((a, b) => (a.archived ? 1 : 0) - (b.archived ? 1 : 0) || (a.name || "").localeCompare(b.name || ""));
    const activeCount = rows.filter(p => !p.archived).length;
    const cell = { ...inputSt };
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Items &amp; services</div>
            <div style={{ fontSize: 13, color: N.muted }}>{activeCount} active item{activeCount === 1 ? "" : "s"} — the list Dave picks from on orders and invoices. Edit any of them, make one inactive to hide it from the pickers, or delete if it was never used.</div>
          </div>
          <button onClick={() => { setShowAddItem(s => !s); setNewItem(blankItem); }} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>{showAddItem ? "Close" : "+ Add item"}</button>
        </div>

        {showAddItem && (
          <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 14, marginBottom: 14, display: "grid", gridTemplateColumns: "1.2fr 1.6fr 90px 1fr auto", gap: 8, alignItems: "center" }}>
            <input placeholder="Item name" value={newItem.name} onChange={e => setNewItem(d => ({ ...d, name: e.target.value }))} style={cell} />
            <input placeholder="Description (size, color — for reorders)" value={newItem.description} onChange={e => setNewItem(d => ({ ...d, description: e.target.value }))} style={cell} />
            <input placeholder="$ price" inputMode="decimal" value={newItem.price} onChange={e => setNewItem(d => ({ ...d, price: e.target.value }))} style={{ ...cell, textAlign: "right" }} />
            <input placeholder="Income account" list="item-income" value={newItem.income_account} onChange={e => setNewItem(d => ({ ...d, income_account: e.target.value }))} style={cell} />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: N.muted, whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={newItem.taxable} onChange={e => setNewItem(d => ({ ...d, taxable: e.target.checked }))} style={{ accentColor: AMBER }} /> Taxable
            </label>
            <button onClick={addItem} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px", gridColumn: "1 / -1", justifySelf: "start" }}>Save item</button>
          </div>
        )}

        <datalist id="item-income">{[...new Set((entity.products || []).map(p => p.income_account).filter(Boolean))].map(a => <option key={a} value={a} />)}</datalist>

        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.6fr 90px 1fr 140px", gap: 8, padding: "10px 16px", background: "#f7fafd", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", color: N.muted }}>
            <span>ITEM</span><span>DESCRIPTION</span><span style={{ textAlign: "right" }}>PRICE</span><span>INCOME ACCOUNT</span><span></span>
          </div>
          {rows.length === 0 && <div style={{ padding: "30px 16px", textAlign: "center", color: N.muted, fontSize: 14 }}>No items yet — add your first above.</div>}
          {rows.map((p, i) => {
            const editing = itemEditId === p.id;
            return (
              <div key={p.id} style={{ padding: "10px 16px", borderTop: i === 0 ? "none" : "1px solid " + N.rule }}>
                {editing ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.6fr 90px 1fr auto", gap: 8, alignItems: "center" }}>
                    <input value={itemDraft.name} onChange={e => setItemDraft(d => ({ ...d, name: e.target.value }))} style={cell} />
                    <input placeholder="Description" value={itemDraft.description} onChange={e => setItemDraft(d => ({ ...d, description: e.target.value }))} style={cell} />
                    <input placeholder="$" inputMode="decimal" value={itemDraft.price} onChange={e => setItemDraft(d => ({ ...d, price: e.target.value }))} style={{ ...cell, textAlign: "right" }} />
                    <input placeholder="Income account" list="item-income" value={itemDraft.income_account} onChange={e => setItemDraft(d => ({ ...d, income_account: e.target.value }))} style={cell} />
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: N.muted, whiteSpace: "nowrap" }}>
                        <input type="checkbox" checked={itemDraft.taxable} onChange={e => setItemDraft(d => ({ ...d, taxable: e.target.checked }))} style={{ accentColor: AMBER }} /> Tax
                      </label>
                      <button onClick={saveItem} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "8px 12px" }}>Save</button>
                      <button onClick={() => setItemEditId(null)} style={btnPaper(N.muted)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.6fr 90px 1fr 210px", gap: 8, alignItems: "center", opacity: p.archived ? 0.5 : 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: N.ink }}>{p.name}{p.archived && <span style={{ fontSize: 10, fontWeight: 700, color: AMBER, marginLeft: 6, letterSpacing: "0.04em" }}>INACTIVE</span>}{!p.taxable && <span style={{ fontSize: 10, fontWeight: 700, color: N.muted, marginLeft: 6, letterSpacing: "0.04em" }}>EXEMPT</span>}</div>
                    <div style={{ fontSize: 13, color: p.description ? N.text : N.mutedLite, fontStyle: p.description ? "normal" : "italic" }}>{p.description || "no description"}</div>
                    <div style={{ fontSize: 13, color: (p.price_cents || 0) > 0 ? N.ink : N.mutedLite, textAlign: "right" }}>{(p.price_cents || 0) > 0 ? money(p.price_cents / 100) : "per job"}</div>
                    <div style={{ fontSize: 13, color: N.muted }}>{p.income_account || "—"}</div>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button onClick={() => { setItemEditId(p.id); setItemDraft({ name: p.name || "", description: p.description || "", price: (p.price_cents || 0) > 0 ? String(p.price_cents / 100) : "", taxable: p.taxable !== false, income_account: p.income_account || "" }); }} style={{ ...btnPaper(N.muted), padding: "6px 12px" }}>Edit</button>
                      <button onClick={() => archiveItem(p.id, !p.archived)} title={p.archived ? "Reactivate" : "Make inactive"} style={{ background: "none", border: "1px solid " + N.rule, borderRadius: 100, cursor: "pointer", color: N.muted, fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, padding: "6px 12px" }}>{p.archived ? "Reactivate" : "Make inactive"}</button>
                      <button onClick={() => deleteItem(p.id)} title="Delete permanently" style={{ background: "none", border: "1px solid " + N.rule, borderRadius: 100, cursor: "pointer", color: N.pinkDark, fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, padding: "6px 12px" }}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: N.muted, marginTop: 10 }}>Most items came over from QuickBooks without a description — that's why the description column is mostly blank. Add specs here (size, color, stock) and they'll be right there when Dave reorders.</div>
      </div>
    );
  }

  // Open (fetch on demand) the QuickBooks history for a customer/vendor from ledger_history.
  async function loadHist(id, ptype, name) {
    if (histOpen === id) { setHistOpen(null); return; }
    setHistOpen(id);
    if (histData[id] !== undefined) return;
    if (!live || !liveOrgId) { setHistData(d => ({ ...d, [id]: null })); return; }
    setHistBusy(true);
    const { data } = await supabase.from("ledger_history").select("txns,txn_count,total_cents").eq("org_id", liveOrgId).eq("party_type", ptype).ilike("party_name", name).maybeSingle();
    setHistData(d => ({ ...d, [id]: data || null }));
    setHistBusy(false);
  }

  function ContactList(kind) {
    const isCust = kind === "customer";
    const table = isCust ? "ledger_customers" : "ledger_vendors";
    const rows = ((isCust ? entity.customers : entity.vendorList) || []).slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const title = isCust ? "Customers" : "Vendors";
    // All money-out lines whose description mentions this vendor (loose name match).
    const vendorTx = name => {
      const nm = (name || "").toLowerCase().trim();
      if (!nm || nm.length < 3) return { total: 0, list: [] };
      const list = (entity.rawEntries || []).filter(e => e.direction === "out" && (e.description || "").toLowerCase().includes(nm)).sort((a, b) => (b.entry_date || "").localeCompare(a.entry_date || ""));
      return { total: list.reduce((s, e) => s + (e.amount_cents || 0), 0), list };
    };
    const acctById = {}; (entity.rawAccounts || []).forEach(a => { acctById[a.id] = a.name; });
    const shortD = d => { const p = (d || "").split("-"); return p.length === 3 ? `${+p[1]}/${+p[2]}` : d; };
    const cell = { ...inputSt };
    const startEdit = c => { setContactErr(""); setContactEditId(c.id); setContactDraft({ name: c.name || "", company: c.company || "", email: c.email || "", phone: c.phone || "", billing_address: c.billing_address || "", tax_status: c.tax_status || "Taxable", notes: c.notes || "", exempt_reason: c.exempt_reason || "", exempt_cert_number: c.exempt_cert_number || "", exempt_cert_on_file: !!c.exempt_cert_on_file, exempt_cert_date: c.exempt_cert_date || "" }); };
    const Editor = (src, set, onSave, onCancel, saveLabel) => (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input placeholder="Name" value={src.name} onChange={e => set(d => ({ ...d, name: e.target.value }))} style={cell} />
        {isCust ? <input placeholder="Business name (optional)" value={src.company} onChange={e => set(d => ({ ...d, company: e.target.value }))} style={cell} /> : <div />}
        <input placeholder="Email (required)" value={src.email} onChange={e => set(d => ({ ...d, email: e.target.value }))} style={cell} />
        <input placeholder="Phone (required)" value={src.phone} onChange={e => set(d => ({ ...d, phone: e.target.value }))} style={cell} />
        <textarea placeholder="Billing address" value={src.billing_address} onChange={e => set(d => ({ ...d, billing_address: e.target.value }))} rows={2} style={{ ...cell, gridColumn: "1 / -1", resize: "vertical" }} />
        {isCust && (
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: N.muted }}>Default tax:</span>
            {["Taxable", "Exempt", "Shipped"].map(t => (
              <button key={t} onClick={() => set(d => ({ ...d, tax_status: t }))} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 100, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontWeight: 500, border: "1px solid " + (src.tax_status === t ? N.blue : N.rule), background: src.tax_status === t ? N.blue : N.white, color: src.tax_status === t ? N.white : N.text }}>{t}</button>
            ))}
            <input placeholder="Notes (optional)" value={src.notes} onChange={e => set(d => ({ ...d, notes: e.target.value }))} style={{ ...cell, flex: 1, minWidth: 160 }} />
          </div>
        )}
        {isCust && src.tax_status === "Exempt" && (
          <div style={{ gridColumn: "1 / -1", background: "#fbf7ee", border: "1px solid #f0e2c0", borderRadius: 10, padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ gridColumn: "1 / -1", fontSize: 12, fontWeight: 700, color: "#8a5a00", letterSpacing: "0.03em" }}>MN EXEMPTION CERTIFICATE (ST3)</div>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: N.muted }}>Reason:</span>
              {["Resale", "Government", "Nonprofit", "Out-of-state", "Other"].map(r => (
                <button key={r} onClick={() => set(d => ({ ...d, exempt_reason: r }))} style={{ fontSize: 11.5, padding: "5px 10px", borderRadius: 100, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontWeight: 500, border: "1px solid " + (src.exempt_reason === r ? N.blue : N.rule), background: src.exempt_reason === r ? N.blue : N.white, color: src.exempt_reason === r ? N.white : N.text }}>{r}</button>
              ))}
            </div>
            <input placeholder="Certificate # (optional)" value={src.exempt_cert_number} onChange={e => set(d => ({ ...d, exempt_cert_number: e.target.value }))} style={cell} />
            <label style={{ fontSize: 12, color: N.muted, display: "flex", alignItems: "center", gap: 6 }}>On file since <input type="date" value={src.exempt_cert_date || ""} onChange={e => set(d => ({ ...d, exempt_cert_date: e.target.value }))} style={{ ...cell, width: 150 }} /></label>
            <label style={{ gridColumn: "1 / -1", fontSize: 13, color: N.ink, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600 }}>
              <input type="checkbox" checked={!!src.exempt_cert_on_file} onChange={e => set(d => ({ ...d, exempt_cert_on_file: e.target.checked }))} style={{ width: 16, height: 16 }} />
              ✓ Signed exemption certificate is on file
            </label>
            <div style={{ gridColumn: "1 / -1", fontSize: 11, color: N.muted }}>MN requires a signed ST3 on file for every exempt sale, or the tax falls back on ProGraphics in an audit.</div>
          </div>
        )}
        {contactErr && <div style={{ gridColumn: "1 / -1", fontSize: 12, color: N.red, fontWeight: 600 }}>{contactErr}</div>}
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
          <button onClick={onSave} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>{saveLabel}</button>
          {onCancel && <button onClick={() => { setContactErr(""); onCancel(); }} style={btnPaper(N.muted)}>Cancel</button>}
        </div>
      </div>
    );
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{title}</div>
            <div style={{ fontSize: 13, color: N.muted }}>{rows.length} {isCust ? "customers" : "vendors"} — {isCust ? "who you bill" : "who you buy from and send POs to"}. Click Edit to add an address, phone, or email.</div>
          </div>
          <button onClick={() => { setShowAddContact(s => !s); setNewContact(blankContact); setContactErr(""); }} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>{showAddContact ? "Close" : "+ Add " + (isCust ? "customer" : "vendor")}</button>
        </div>

        {showAddContact && (
          <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            {Editor(newContact, setNewContact, () => saveContact(table, true), null, "Save " + (isCust ? "customer" : "vendor"))}
          </div>
        )}

        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
          {rows.length === 0 && <div style={{ padding: "30px 16px", textAlign: "center", color: N.muted, fontSize: 14 }}>None yet — add your first above.</div>}
          {rows.map((c, i) => (
            <div key={c.id} style={{ padding: "12px 16px", borderTop: i === 0 ? "none" : "1px solid " + N.rule }}>
              {contactEditId === c.id ? Editor(contactDraft, setContactDraft, () => saveContact(table, false), () => setContactEditId(null), "Save") : (
                <>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: N.ink }}>{c.name}{c.company ? <span style={{ color: N.muted, fontWeight: 400 }}> · {c.company}</span> : ""}{isCust && c.tax_status === "Exempt" && (c.exempt_cert_on_file
  ? <span title={[c.exempt_reason, c.exempt_cert_number].filter(Boolean).join(" · ")} style={{ fontSize: 10, fontWeight: 700, color: "#5a7a63", background: "#eef7f0", border: "1px solid #cfe9d6", borderRadius: 100, padding: "2px 8px", marginLeft: 6, letterSpacing: "0.03em" }}>EXEMPT · CERT ✓{c.exempt_reason ? " · " + c.exempt_reason : ""}</span>
  : <span style={{ fontSize: 10, fontWeight: 700, color: "#8a5a00", background: "#fdf5e3", border: "1px solid #f0d89a", borderRadius: 100, padding: "2px 8px", marginLeft: 6, letterSpacing: "0.03em" }}>⚠ EXEMPT · NO CERT</span>)}
{isCust && c.tax_status === "Shipped" && <span style={{ fontSize: 10, fontWeight: 700, color: N.muted, marginLeft: 6, letterSpacing: "0.04em" }}>SHIPPED</span>}{isCust && (() => { const cc = (entity.credits || []).filter(cr => cr.status === "open" && (cr.customer_name || "").toLowerCase() === (c.name || "").toLowerCase()).reduce((s, cr) => s + (cr.amount_cents || 0), 0); return cc > 0 ? <span style={{ fontSize: 10, fontWeight: 700, color: N.pinkDark, background: "#eafaf0", border: "1px solid #bff0d3", borderRadius: 100, padding: "2px 8px", marginLeft: 8 }}>{money(cc / 100)} CREDIT</span> : null; })()}</div>
                    <div style={{ fontSize: 12, color: N.muted }}>{[c.email, c.phone].filter(Boolean).join(" · ") || <span style={{ color: N.mutedLite, fontStyle: "italic" }}>no email or phone yet</span>}</div>
                    {c.billing_address ? <div style={{ fontSize: 12, color: N.muted, whiteSpace: "pre-line", marginTop: 2 }}>{c.billing_address}</div> : null}
                    {isCust && (() => { const list = (entity.invoices || []).filter(v => v.docType !== "order" && (v.customer || "").toLowerCase().trim() === (c.name || "").toLowerCase().trim()).sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || "")); const last = list[0]; return (
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        {last
                          ? <button onClick={() => setCustHistOpen(custHistOpen === c.id ? null : c.id)} style={{ background: "none", border: "none", color: N.blue, cursor: "pointer", fontWeight: 600, fontFamily: "'Figtree', sans-serif", fontSize: 12, padding: 0 }}>🧾 {list.length} invoice{list.length === 1 ? "" : "s"} · last {money(last.amount)} · {shortD(last.issueDate)} {custHistOpen === c.id ? "▲ hide" : "▾ see history"}</button>
                          : <span style={{ color: N.mutedLite }}>no invoices yet</span>}
                      </div>
                    ); })()}
                    {!isCust && (() => { const { list } = vendorTx(c.name); const last = list[0]; return (
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        {last
                          ? <button onClick={() => setVendorTxOpen(vendorTxOpen === c.id ? null : c.id)} style={{ background: "none", border: "none", color: N.blue, cursor: "pointer", fontWeight: 600, fontFamily: "'Figtree', sans-serif", fontSize: 12, padding: 0 }}>🧾 Last: {money((last.amount_cents || 0) / 100)} · {shortD(last.entry_date)}{list.length > 1 ? ` · ${list.length} total` : ""} {vendorTxOpen === c.id ? "▲ hide history" : "▾ see history"}</button>
                          : <span style={{ color: N.mutedLite }}>no payments recorded yet</span>}
                      </div>
                    ); })()}
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      <button onClick={() => loadHist(c.id, isCust ? "customer" : "vendor", c.name)} style={{ background: "none", border: "none", color: N.blueDark, cursor: "pointer", fontWeight: 600, fontFamily: "'Figtree', sans-serif", fontSize: 12, padding: 0 }}>📜 QuickBooks history {histOpen === c.id ? "▲ hide" : "▾ show"}</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => startEdit(c)} style={{ ...btnPaper(N.muted), padding: "6px 12px" }}>Edit</button>
                    {!isCust && <button onClick={() => { setMergeVendorId(mergeVendorId === c.id ? null : c.id); setMergeInto(""); }} style={{ ...btnPaper(N.blueDark), padding: "6px 12px" }}>Merge</button>}
                    <button onClick={() => deleteContact(table, c.id, c.name)} style={{ background: "none", border: "1px solid " + N.rule, borderRadius: 100, cursor: "pointer", color: N.pinkDark, fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, padding: "6px 12px" }}>Remove</button>
                  </div>
                </div>
                {histOpen === c.id && (
                  <div style={{ marginTop: 10, border: "1px solid " + N.rule, borderRadius: 10, overflow: "hidden" }}>
                    {histBusy && histData[c.id] === undefined ? <div style={{ padding: 12, fontSize: 13, color: N.muted }}>Loading history…</div>
                     : !histData[c.id] ? <div style={{ padding: 12, fontSize: 13, color: N.mutedLite }}>No QuickBooks history on file for this {isCust ? "customer" : "vendor"}.</div>
                     : (() => { const h = histData[c.id]; const t = h.txns || []; return (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f6f8fb", borderBottom: "1px solid " + N.rule, fontSize: 12, color: N.muted }}>
                            <span>From QuickBooks · {h.txn_count} line{h.txn_count === 1 ? "" : "s"} all-time</span>
                            <span>lifetime <b style={{ color: N.ink }}>{money((h.total_cents || 0) / 100)}</b></span>
                          </div>
                          <div style={{ maxHeight: "42vh", overflowY: "auto" }}>
                            {t.map((x, k) => (
                              <div key={k} style={{ display: "flex", gap: 10, padding: "6px 12px", borderTop: k === 0 ? "none" : "1px solid " + N.rule, fontSize: 12.5, alignItems: "baseline", background: "#fafbfc" }}>
                                <span style={{ width: 74, color: N.muted, whiteSpace: "nowrap" }}>{x.d}</span>
                                <span style={{ width: 50, color: N.mutedLite, fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>{x.n || ""}</span>
                                <span style={{ flex: 1, minWidth: 0, color: N.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{[x.it, x.ds].filter(Boolean).join(" — ")}</span>
                                <span style={{ width: 82, textAlign: "right", fontFamily: "'DM Mono', monospace", color: N.ink }}>{money(x.amt || 0)}</span>
                              </div>
                            ))}
                          </div>
                          {h.txn_count > t.length && <div style={{ padding: "6px 12px", fontSize: 11, color: N.mutedLite, borderTop: "1px solid " + N.rule }}>Showing the most recent {t.length} of {h.txn_count}. Full line-by-line detail is in the QuickBooks archive.</div>}
                        </div>
                     ); })()}
                  </div>
                )}
                {!isCust && mergeVendorId === c.id && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10, background: "#eef6ff", border: "1px solid #cfe4ff", borderRadius: 10, padding: "10px 12px" }}>
                    <span style={{ fontSize: 13, color: N.blueDark, fontWeight: 600 }}>Merge <b>{c.name}</b> into:</span>
                    <select value={mergeInto} onChange={e => setMergeInto(e.target.value)} style={{ ...inputSt, width: 220 }}>
                      <option value="">Pick the vendor to keep…</option>
                      {rows.filter(v => v.id !== c.id).map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                    </select>
                    <button onClick={() => mergeVendor(c.id, c.name, mergeInto)} disabled={!mergeInto} style={{ ...btnBlue, background: mergeInto ? N.blue : N.mutedLite }}>Merge &amp; remove duplicate</button>
                    <button onClick={() => { setMergeVendorId(null); setMergeInto(""); }} style={btnPaper(N.muted)}>Cancel</button>
                  </div>
                )}
                {isCust && custHistOpen === c.id && (() => { const list = (entity.invoices || []).filter(v => v.docType !== "order" && (v.customer || "").toLowerCase().trim() === (c.name || "").toLowerCase().trim()).sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || "")); return (
                  <div style={{ marginTop: 10, border: "1px solid " + N.rule, borderRadius: 10, overflow: "hidden", maxHeight: "40vh", overflowY: "auto" }}>
                    {list.map((v, k) => (
                      <button key={v.id} onClick={() => setOpenInv(v)} title="Open / print this invoice" style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderTop: k === 0 ? "none" : "1px solid " + N.rule, fontSize: 13, background: "#fafbfc", border: "none", cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
                        <span style={{ width: 44, color: N.muted, fontSize: 12 }}>{shortD(v.issueDate)}</span>
                        <span style={{ width: 54, color: N.blueDark, fontWeight: 700, fontSize: 12 }}>{v.number ? "#" + v.number : (v.poNumber ? "PO " + v.poNumber : "—")}</span>
                        <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: N.ink }}>{v.item}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: v.status === "Paid" ? "#5a7a63" : N.muted, whiteSpace: "nowrap" }}>{(v.status || "").toUpperCase()}</span>
                        <span style={{ fontWeight: 600, color: N.ink, whiteSpace: "nowrap", fontFamily: "'DM Mono', monospace" }}>{money(v.amount)}</span>
                      </button>
                    ))}
                  </div>
                ); })()}
                {!isCust && vendorTxOpen === c.id && (() => { const { list } = vendorTx(c.name); return (
                  <div style={{ marginTop: 10, border: "1px solid " + N.rule, borderRadius: 10, overflow: "hidden", maxHeight: "40vh", overflowY: "auto" }}>
                    {list.map((e, k) => (
                      <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 12px", borderTop: k === 0 ? "none" : "1px solid " + N.rule, fontSize: 13, background: "#fafbfc" }}>
                        <span style={{ width: 42, color: N.muted, fontSize: 12 }}>{shortD(e.entry_date)}</span>
                        <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.description}</span>
                        <span style={{ color: N.mutedLite, fontSize: 11, whiteSpace: "nowrap" }}>{acctById[e.account_id] || ""}{e.match_status === "reconciled" ? " · R" : ""}</span>
                        <span style={{ fontWeight: 600, color: N.red, whiteSpace: "nowrap" }}>{money((e.amount_cents || 0) / 100)}</span>
                      </div>
                    ))}
                  </div>
                ); })()}
                </>
              )}
            </div>
          ))}
        </div>
        {isCust && <div style={{ fontSize: 12, color: N.muted, marginTop: 10 }}>QuickBooks came over with names only — most addresses are blank. Fill them in here and they'll auto-fill on the invoice's Bill To.</div>}
      </div>
    );
  }

  function Chart() {
    const rows = (entity.rawCategories || []).filter(c => !c.archived);
    const byOrder = (a, b) => (a.sort_order || 0) - (b.sort_order || 0) || (a.name || "").localeCompare(b.name || "");
    const typeOf = c => c.cat_type || (c.kind === "income" ? "income" : "expense");
    const TYPE_META = { income: { label: "Sales / income", badge: "SALES", color: "#3a7d4a", bg: "#eafaf0", bd: "#bff0d3" }, cogs: { label: "Cost of goods sold", badge: "COGS", color: "#8a5a00", bg: "#fdf5e3", bd: "#f0d89a" }, expense: { label: "Expenses", badge: "EXPENSE", color: N.blueDark, bg: "#eef6ff", bd: "#cfe4ff" } };
    const income = rows.filter(c => typeOf(c) === "income").sort(byOrder);
    const cogs = rows.filter(c => typeOf(c) === "cogs").sort(byOrder);
    const expense = rows.filter(c => typeOf(c) === "expense").sort(byOrder);
    const cell = { ...inputSt };
    // Only a nonprofit needs a functional class; showing it to ProGraphics would be noise.
    const npo = entity.reportStyle === "nonprofit";
    const FUNC_OPTS = t => (t === "income"
      ? [["contributed", "Contributed support"], ["earned", "Earned revenue"]]
      : [["program", "Program services"], ["mg", "Management & general"], ["fundraising", "Fundraising"]]
    ).concat([["transfer", "Transfer — not revenue or expense"]]);
    const FUNC_LABEL = { contributed: "CONTRIBUTED", earned: "EARNED", program: "PROGRAM", mg: "MGMT & GENERAL", fundraising: "FUNDRAISING", transfer: "TRANSFER" };
    const FuncPill = ({ c }) => {
      if (!npo) return null;
      const v = c.func_class;
      return (
        <span title={v ? "Where this lands on the Statement of Activities" : "Unclassified — it will sit in its own bucket on the Statement of Activities"}
          style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.05em", whiteSpace: "nowrap", borderRadius: 100, padding: "2px 8px",
            color: v ? N.blueDark : "#8a5a00", background: v ? "#eef6ff" : "#fdf5e3", border: "1px solid " + (v ? "#cfe4ff" : "#f0d89a") }}>
          {v ? FUNC_LABEL[v] : "UNCLASSIFIED"}
        </span>
      );
    };
    const FuncSelect = ({ value, type, onChange }) => {
      if (!npo) return null;
      return (
        <select value={value || ""} onChange={e => onChange(e.target.value)} style={{ ...cell, width: 180 }}>
          <option value="">Unclassified…</option>
          {FUNC_OPTS(type).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      );
    };
    const TypePill = ({ t }) => { const m = TYPE_META[t] || TYPE_META.expense; return <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.05em", color: m.color, background: m.bg, border: "1px solid " + m.bd, borderRadius: 100, padding: "2px 8px", whiteSpace: "nowrap" }}>{m.badge}</span>; };
    const group = (t, list) => { const m = TYPE_META[t]; return (
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: m.color, marginBottom: 6 }}>{m.label} · {list.length}</div>
        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
          {list.length === 0 && <div style={{ padding: "16px", color: N.muted, fontSize: 13 }}>None yet.</div>}
          {list.map((c, i) => (
            <div key={c.id} style={{ padding: "9px 14px", borderTop: i === 0 ? "none" : "1px solid " + N.rule, display: "flex", alignItems: "center", gap: 8 }}>
              {catEditId === c.id ? (
                <>
                  <input value={catDraft.name} onChange={e => setCatDraft(d => ({ ...d, name: e.target.value }))} style={{ ...cell, flex: 1 }} />
                  <select value={catDraft.cat_type} onChange={e => setCatDraft(d => ({ ...d, cat_type: e.target.value }))} style={{ ...cell, width: 150 }}>
                    <option value="income">Sales / income</option><option value="cogs">Cost of goods sold</option><option value="expense">Expense</option>
                  </select>
                  <FuncSelect value={catDraft.func_class} type={catDraft.cat_type} onChange={v => setCatDraft(d => ({ ...d, func_class: v }))} />
                  <button onClick={saveChartCat} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "8px 12px" }}>Save</button>
                  <button onClick={() => setCatEditId(null)} style={btnPaper(N.muted)}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 14, color: N.ink }}>{c.name}</span>
                  <FuncPill c={c} />
                  <TypePill t={typeOf(c)} />
                  <button onClick={() => { setCatEditId(c.id); setCatDraft({ name: c.name, kind: c.kind || "expense", cat_type: typeOf(c), func_class: c.func_class || "" }); }} style={{ ...btnPaper(N.muted), padding: "6px 12px" }}>Edit</button>
                  <button onClick={() => archiveChartCat(c.id)} style={{ background: "none", border: "1px solid " + N.rule, borderRadius: 100, cursor: "pointer", color: N.muted, fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, padding: "6px 12px" }}>Remove</button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    ); };
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Chart of accounts</div>
            <div style={{ fontSize: 13, color: N.muted }}>
              {rows.length} accounts — the income &amp; expense accounts everything categorizes into (pulled from QuickBooks). Add, rename, or remove.
              {npo && <> Each one also carries where it lands on the <b>Statement of Activities</b>: income as contributed support or earned revenue, expense as program, management &amp; general, or fundraising.</>}
            </div>
          </div>
          <button onClick={() => { setShowAddCat(s => !s); setNewCat(blankCat); }} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>{showAddCat ? "Close" : "+ Add account"}</button>
        </div>
        {showAddCat && (
          <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 14, marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input placeholder="Account name" value={newCat.name} onChange={e => setNewCat(d => ({ ...d, name: e.target.value }))} style={{ ...cell, flex: 1, minWidth: 200 }} />
            <select value={newCat.cat_type} onChange={e => setNewCat(d => ({ ...d, cat_type: e.target.value }))} style={{ ...cell, width: 170 }}>
              <option value="expense">Expense</option><option value="cogs">Cost of goods sold</option><option value="income">Sales / income</option>
            </select>
            <FuncSelect value={newCat.func_class} type={newCat.cat_type} onChange={v => setNewCat(d => ({ ...d, func_class: v }))} />
            <button onClick={addChartCat} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>Save</button>
          </div>
        )}
        {group("income", income)}
        {group("cogs", cogs)}
        {group("expense", expense)}
      </div>
    );
  }

  function Admin() {
    // Every panel names the feature it belongs to. A tenant profile can switch one off
    // (config.features) and it disappears here — it is NOT deleted, so the tenants who
    // use it keep it. Anything unlisted in `features` stays on.
    const choices = [
      { key: "customers", label: "Customers", desc: "Who you bill — names, emails, addresses", count: (entity.customers || []).length },
      { key: "vendors", label: "Vendors", desc: "Who you pay — for bills and checks", count: (entity.vendorList || []).length },
      { key: "items", feature: "items", label: "Items & services", desc: "Your product/service list for invoices", count: (entity.products || []).filter(p => !p.archived).length },
      { key: "chart", label: "Chart of accounts", desc: "Every account — banks, cards, income, expenses", count: (entity.rawCategories || []).filter(c => !c.archived).length + (entity.rawAccounts || []).length },
      { key: "recons", label: "Bank reconciliations", desc: "Statement history by account — balances, dates, attached statements", count: reconHist.length },
      { key: "opening", label: "Opening balances", desc: "Your starting trial balance — the CPA-ready anchor. Flags anything still needing info." },
      { key: "priorpl", label: "Prior-year P&L (filed)", desc: "Profit & loss from the filed tax return — fiscal years ending 3/31", count: (entity.statements || []).filter(s => s.kind === "pl").length || null },
      { key: "qbo", feature: "qboImport", label: "Import from QuickBooks", desc: "Bring the history across with its coding — Transaction List, General Ledger, or Journal Entries" },
      { key: "cardpayoff", feature: "cardPayoff", label: "Card payoff plan", desc: "Smartest order to pay down the credit cards" },
      { key: "campaigns", feature: "campaigns", label: "Email campaigns", desc: "Newsletters & blasts to your customers (Constant Contact replacement)" },
      { key: "settings", label: "Settings", desc: "Branding, users, remit, sales-tax rate" },
    ].filter(c => !c.feature || featureOn(c.feature));
    if (!listsTab) {
      return (
        <div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 2 }}>Admin</div>
          <div style={{ fontSize: 13, color: N.muted, marginBottom: 18 }}>Your lists and setup. Pick one to open it.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {choices.map(c => (
              <button key={c.key} onClick={() => setListsTab(c.key)} style={{ textAlign: "left", background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: "16px 18px", cursor: "pointer", fontFamily: "'Figtree', sans-serif", display: "flex", flexDirection: "column", gap: 4 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = N.blue; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,128,255,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = N.rule; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: N.ink }}>{c.label}</span>
                  {c.count != null && <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: N.blue, background: "#eef6ff", borderRadius: 100, padding: "2px 9px" }}>{c.count}</span>}
                </div>
                <span style={{ fontSize: 12.5, color: N.muted }}>{c.desc}</span>
                <span style={{ fontSize: 12, color: N.blue, fontWeight: 600, marginTop: 4 }}>Open →</span>
              </button>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div>
        <button onClick={() => setListsTab("")} style={{ ...btnPaper(N.muted), marginBottom: 14 }}>← Back to Admin</button>
        {listsTab === "customers" && ContactList("customer")}
        {listsTab === "vendors" && ContactList("vendor")}
        {listsTab === "items" && Items()}
        {listsTab === "cardpayoff" && featureOn("cardPayoff") && CardPayoff()}
        {listsTab === "campaigns" && Campaigns()}
        {listsTab === "qbo" && featureOn("qboImport") && (
          <QboImport
            orgId={liveOrgId}
            session={session}
            accounts={entity.rawAccounts || []}
            categories={entity.rawCategories || []}
            onImported={() => setReloadTick(t => t + 1)}
          />
        )}
        {listsTab === "chart" && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: N.blueDark, marginBottom: 10 }}>Balance-sheet accounts — banks, cards, loans</div>
            {Accounts()}
            <div style={{ height: 22 }} />
            {Chart()}
          </div>
        )}
        {listsTab === "recons" && Reconciliations()}
        {listsTab === "opening" && OpeningBalances()}
        {listsTab === "priorpl" && PriorPL()}
        {listsTab === "settings" && Settings()}
      </div>
    );
  }

  // Bank reconciliation history — every reconciliation, by account, with its statement.
  function Reconciliations() {
    const accts = (entity.rawAccounts || []).filter(a => ["bank", "credit_card", "loan"].includes(a.account_type))
      .slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const isLiabT = t => t === "credit_card" || t === "loan";
    return (
      <div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 2 }}>Bank reconciliations</div>
        <div style={{ fontSize: 13, color: N.muted, marginBottom: 16 }}>Every reconciliation you've locked, newest first — with the statement it tied out to. Attach a PDF/CSV where one's missing.</div>
        {accts.map(a => {
          const recs = reconHist.filter(r => r.account_id === a.id);
          const isLiab = isLiabT(a.account_type);
          const owedT = c => money((isLiab ? -c : c) / 100);
          return (
            <div key={a.id} style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f7fafd", borderBottom: recs.length ? "1px solid " + N.rule : "none" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: N.ink }}>{a.name}{a.last_four ? <span style={{ color: N.muted, fontWeight: 400 }}> ••{a.last_four}</span> : null}</div>
                {recs.length > 0 && <button onClick={() => printReconHistory(a.name, recs, isLiab)} style={btnPaper(N.blueDark)}>🖨 Print report</button>}
              </div>
              {recs.length === 0 ? (
                <div style={{ padding: "16px", fontSize: 13, color: N.muted }}>No reconciliations yet. Reconcile this account from the notebook.</div>
              ) : (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 70px 130px 90px", gap: 8, padding: "8px 16px", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", color: N.muted }}>
                    <span>STATEMENT DATE</span><span style={{ textAlign: "right" }}>ENDING BALANCE</span><span style={{ textAlign: "right" }}>ITEMS</span><span style={{ textAlign: "center" }}>STATEMENT</span><span style={{ textAlign: "right" }}>DONE</span>
                  </div>
                  {recs.map(r => {
                    const doc = r.document_id ? (entity.documents || []).find(d => d.id === r.document_id) : null;
                    return (
                      <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 70px 130px 90px", gap: 8, padding: "9px 16px", borderTop: "1px solid " + N.rule, fontSize: 13, alignItems: "center" }}>
                        <span style={{ fontWeight: 600, color: N.ink }}>{fmtStmtDate(r.statement_ending_date)}</span>
                        <span style={{ textAlign: "right" }}>{owedT(r.statement_ending_balance_cents)}{isLiab ? " owed" : ""}</span>
                        <span style={{ textAlign: "right", color: N.muted }}>{r.item_count || 0}</span>
                        <span style={{ textAlign: "center", display: "inline-flex", gap: 4, justifyContent: "center", alignItems: "center" }}>{doc
                          ? <><button onClick={() => downloadDoc(doc)} title={doc.name} style={{ ...btnPaper(N.blueDark), padding: "3px 8px", fontSize: 11 }}>📎 Open</button><button onClick={() => detachStatementFromRec(r.id)} title="Remove this statement" style={{ border: "1px solid " + N.rule, background: "none", color: N.muted, cursor: "pointer", borderRadius: 6, fontSize: 12, fontWeight: 700, padding: "2px 7px" }}>✕</button></>
                          : <label style={{ ...btnPaper(N.muted), padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>＋ Attach PDF<input type="file" accept=".pdf,.csv,application/pdf,text/csv" onChange={e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; attachStatementToRec(r.id, f); }} style={{ display: "none" }} /></label>}</span>
                        <span style={{ textAlign: "right", color: N.mutedLite, fontSize: 11 }}>{r.reconciled_at || r.created_at ? new Date(r.reconciled_at || r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // The starting trial balance — the CPA-ready anchor. Built from real account
  // openings (banks/cards/loans) + A/R from open invoices; equity is the plug.
  function openingBalanceData() {
    const accts = (entity.rawAccounts || []);
    const sortNm = (a, b) => (a.name || "").localeCompare(b.name || "");
    const assetAccts = accts.filter(a => ["bank", "cash", "other"].includes(a.account_type)).slice().sort(sortNm);
    const liabAccts = accts.filter(a => ["credit_card", "loan", "liability"].includes(a.account_type)).slice().sort(sortNm);
    const balOf = v => (v.balanceCents != null ? v.balanceCents : Math.round((v.amount || 0) * 100));
    const arTotal = invoices.filter(v => v.docType !== "order" && v.status !== "Void" && v.status !== "Paid" && balOf(v) > 0).reduce((s, v) => s + balOf(v), 0);
    const nm = a => a.name + (a.last_four ? " ••" + a.last_four : "");
    const assetRows = assetAccts.map(a => ({ id: a.id, label: nm(a), cents: a.opening_balance_cents || 0, needs: a.needs_info, note: a.info_note }));
    assetRows.push({ id: "ar", label: "Accounts receivable", cents: arTotal, needs: true, note: "Confirm cash vs. accrual with the CPA. If cash basis (likely for this size), A/R stays $0 and old invoices are customer history only. If accrual, we carry the real 3/31 open invoices here." });
    const assetsTotal = assetRows.reduce((s, r) => s + r.cents, 0);
    const liabRows = liabAccts.map(a => ({ id: a.id, label: nm(a), cents: -(a.opening_balance_cents || 0), needs: a.needs_info, note: a.info_note }));
    const liabsTotal = liabRows.reduce((s, r) => s + r.cents, 0);
    const equity = assetsTotal - liabsTotal;
    const flags = [...assetRows, ...liabRows].filter(r => r.needs);
    return { assetRows, assetsTotal, liabRows, liabsTotal, equity, flags };
  }

  function printOpeningBalances() {
    const d = openingBalanceData();
    const m = c => money(c / 100);
    const line = r => `<tr><td>${r.label}${r.needs ? ' <b style="color:#b45309">⚠ needs info</b>' : ""}</td><td class=r>${m(r.cents)}</td></tr>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Opening balances — ${entity.name || ""}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:32px;max-width:720px;margin:0 auto}
      h1{font-size:20px;margin:0 0 2px}h2{font-size:14px;color:#64748b;font-weight:600;margin:0 0 18px}
      table{border-collapse:collapse;width:100%;font-size:13px;margin-bottom:18px}td{padding:7px 10px;border-bottom:1px solid #e2e8f0;text-align:left}
      .r{text-align:right;font-variant-numeric:tabular-nums}.sec{font-size:10px;letter-spacing:.08em;color:#64748b;text-transform:uppercase;padding-top:12px}
      .tot td{border-top:2px solid #0f172a;font-weight:700}.flag{font-size:11px;color:#b45309;margin:2px 0}
      .foot{margin-top:16px;font-size:11px;color:#94a3b8}</style></head>
      <body><h1>${entity.name || ""}</h1><h2>Opening balances — starting trial balance (prepared for CPA review)</h2>
      <table>
      <tr><td class=sec colspan=2>Assets</td></tr>${d.assetRows.map(line).join("")}
      <tr class=tot><td>Total assets</td><td class=r>${m(d.assetsTotal)}</td></tr>
      <tr><td class=sec colspan=2>Liabilities</td></tr>${d.liabRows.map(line).join("")}
      <tr class=tot><td>Total liabilities</td><td class=r>${m(d.liabsTotal)}</td></tr>
      <tr><td class=sec colspan=2>Equity</td></tr>
      <tr><td>Owner's equity / retained earnings (balancing figure)</td><td class=r>${m(d.equity)}</td></tr>
      <tr class=tot><td>Total liabilities &amp; equity</td><td class=r>${m(d.liabsTotal + d.equity)}</td></tr>
      </table>
      ${d.flags.length ? `<div class="sec">Still needs information</div>${d.flags.map(f => `<div class="flag">⚠ ${f.label}${f.note ? " — " + f.note : ""}</div>`).join("")}` : ""}
      <div class="foot">Fiscal year 4/1–3/31. Equipment carried at $0 (fully depreciated per the FY2026 return). Prepared ${new Date().toLocaleDateString("en-US")} · CARES Works · unaudited — for CPA review.</div></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { window.alert("Allow pop-ups to print the report."); return; }
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => { try { w.print(); } catch (e) { /* user can print manually */ } }, 350);
  }

  function OpeningBalances() {
    const d = openingBalanceData();
    const secLbl = { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: N.muted, padding: "14px 16px 4px" };
    const row = (r, color) => (
      <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, padding: "9px 16px", borderTop: "1px solid " + N.rule, alignItems: "baseline" }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: 14, color: N.ink }}>{r.label}</span>
          {r.needs && <span title="Needs info" style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "#b45309", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 100, padding: "1px 8px" }}>⚠ NEEDS INFO</span>}
          {r.needs && r.note && <div style={{ fontSize: 12, color: "#b45309", marginTop: 2, fontStyle: "italic" }}>{r.note}</div>}
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: color || N.ink }}>{money(r.cents / 100)}</div>
      </div>
    );
    const totRow = (label, cents, strong) => (
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, padding: "10px 16px", borderTop: "2px solid " + N.ink, alignItems: "baseline", background: "#f7fafd" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: N.ink }}>{label}</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: N.ink }}>{money(cents / 100)}</div>
      </div>
    );
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Opening balances</div>
          <button onClick={printOpeningBalances} style={btnPaper(N.blueDark)}>🖨 Print for CPA</button>
        </div>
        <div style={{ fontSize: 13, color: N.muted, marginBottom: 16 }}>Your starting trial balance — the anchor the whole ledger sits on. Cash and cards come from the reconciled statements; equity is the balancing figure. Anything still uncertain is flagged <b style={{ color: "#b45309" }}>⚠ needs info</b>. This is the page your CPA approves.</div>

        {d.flags.length > 0 && (
          <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309", marginBottom: 4 }}>⚠ {d.flags.length} item{d.flags.length === 1 ? "" : "s"} still need{d.flags.length === 1 ? "s" : ""} info before this is final</div>
            {d.flags.map(f => <div key={f.id} style={{ fontSize: 12.5, color: "#92400e" }}>• <b>{f.label}</b>{f.note ? " — " + f.note : ""}</div>)}
          </div>
        )}

        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
          <div style={secLbl}>Assets — what they own</div>
          {d.assetRows.map(r => row(r, N.ink))}
          {totRow("Total assets", d.assetsTotal)}

          <div style={secLbl}>Liabilities — what they owe</div>
          {d.liabRows.map(r => row(r, N.red))}
          {totRow("Total liabilities", d.liabsTotal)}

          <div style={secLbl}>Equity</div>
          {row({ id: "eq", label: "Owner's equity / retained earnings (balancing figure)", cents: d.equity, needs: false, note: null }, d.equity < 0 ? N.red : N.ink)}
          {totRow("Total liabilities & equity", d.liabsTotal + d.equity)}
        </div>
        <div style={{ fontSize: 12, color: N.muted, marginTop: 12 }}>Fiscal year runs <b>4/1–3/31</b>. Equipment is carried at <b>$0</b> — the FY2026 return shows zero depreciation for three years running, so it's fully written off. Total liabilities &amp; equity always equals total assets because equity is the plug; the CPA confirms the pieces are right.</div>
      </div>
    );
  }

  // Prior-year P&L filed on the tax return — read-only history, per fiscal year (3/31 end).
  function printPriorPL(s) {
    const m = c => money(c / 100);
    const d = s.data || {};
    const rowHtml = ln => {
      const strong = ["grossprofit", "totalexp", "net"].includes(ln.role);
      const border = ln.role === "grossprofit" || ln.role === "totalexp" ? "border-top:1px solid #cbd5e1;" : ln.role === "net" ? "border-top:2px solid #0f172a;" : "";
      const ind = ln.role === "expense" || ln.role === "cogs" ? "padding-left:24px;" : "";
      const lbl = ln.role === "cogs" ? "Less: " + ln.label : ln.label;
      return `<tr style="${border}"><td style="${ind}${strong ? "font-weight:700;" : ""}">${lbl}</td><td class=r style="${strong ? "font-weight:700;" : ""}${ln.cents < 0 ? "color:#b91c1c;" : ""}">${m(ln.cents)}</td></tr>`;
    };
    const cmp = d.comparison;
    const cmpHtml = cmp ? `<h3 style="font-size:13px;margin:22px 0 6px">Three-year comparison</h3>
      <table><thead><tr><th></th>${cmp.columns.map(c => `<th class=r>${c}</th>`).join("")}</tr></thead>
      <tbody>${cmp.rows.map(r => `<tr><td>${r.label}</td>${r.vals.map(v => `<td class=r style="${v < 0 ? "color:#b91c1c;" : ""}">${m(v)}</td>`).join("")}</tr>`).join("")}</tbody></table>` : "";
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>P&L — ${s.period_label} — ${entity.name || ""}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:32px;max-width:640px;margin:0 auto}
      h1{font-size:20px;margin:0 0 2px}h2{font-size:14px;color:#64748b;font-weight:600;margin:0 0 4px}
      table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:6px 10px;text-align:left}th{font-size:10px;letter-spacing:.06em;color:#64748b;text-transform:uppercase}
      .r{text-align:right;font-variant-numeric:tabular-nums}.src{font-size:11px;color:#94a3b8;margin:10px 0 16px}
      .foot{margin-top:18px;font-size:11px;color:#94a3b8}</style></head>
      <body><h1>${entity.name || ""}</h1><h2>Profit &amp; Loss — ${s.period_label}</h2>
      <div class="src">${s.source || ""}</div>
      <table><tbody>${(d.lines || []).map(rowHtml).join("")}</tbody></table>
      ${cmpHtml}
      <div class="foot">${s.note || ""} · Printed ${new Date().toLocaleDateString("en-US")} · CARES Works</div></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { window.alert("Allow pop-ups to print the report."); return; }
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => { try { w.print(); } catch (e) { /* manual */ } }, 350);
  }

  function PriorPL() {
    const stmts = (entity.statements || []).filter(s => s.kind === "pl").slice().sort((a, b) => (b.period_end || "").localeCompare(a.period_end || ""));
    const roleColor = r => r === "net" ? N.red : N.ink;
    return (
      <div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 2 }}>Prior-year P&amp;L (filed)</div>
        <div style={{ fontSize: 13, color: N.muted, marginBottom: 16 }}>Profit &amp; loss straight from the filed tax return — the prior history, by fiscal year (4/1–3/31). Read-only. This year's live P&amp;L builds in <b>Reports</b> as you go.</div>
        {stmts.length === 0 && <div style={{ background: N.white, border: "1px dashed " + N.rule, borderRadius: 12, padding: "40px 20px", textAlign: "center", color: N.muted, fontSize: 14 }}>No filed statements yet.</div>}
        {stmts.map(s => {
          const d = s.data || {};
          const cmp = d.comparison;
          return (
            <div key={s.id} style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f7fafd", borderBottom: "1px solid " + N.rule, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: N.ink }}>Profit &amp; Loss — {s.period_label}</div>
                  <div style={{ fontSize: 12, color: N.muted }}>{s.source}</div>
                </div>
                <button onClick={() => printPriorPL(s)} style={btnPaper(N.blueDark)}>🖨 Print for CPA</button>
              </div>
              <div>
                {(d.lines || []).map((ln, i) => {
                  const strong = ["grossprofit", "totalexp", "net"].includes(ln.role);
                  const indented = ln.role === "expense" || ln.role === "cogs";
                  const topBorder = ln.role === "grossprofit" || ln.role === "totalexp" ? "1px solid " + N.rule : ln.role === "net" ? "2px solid " + N.ink : "none";
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, padding: "8px 16px", borderTop: topBorder, background: ln.role === "net" ? "#f7fafd" : "transparent" }}>
                      <span style={{ fontSize: 14, color: strong ? N.ink : N.text, fontWeight: strong ? 700 : 400, paddingLeft: indented ? 18 : 0 }}>{ln.role === "cogs" ? "Less: " + ln.label : ln.label}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: strong ? 700 : 500, color: ln.cents < 0 ? N.red : roleColor(ln.role) }}>{money(ln.cents / 100)}</span>
                    </div>
                  );
                })}
              </div>
              {cmp && (
                <div style={{ padding: "14px 16px", borderTop: "1px solid " + N.rule }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: N.muted, marginBottom: 8 }}>Three-year comparison</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "4px 8px", fontSize: 10, letterSpacing: "0.06em", color: N.muted, textTransform: "uppercase" }}></th>
                          {cmp.columns.map(c => <th key={c} style={{ textAlign: "right", padding: "4px 8px", fontSize: 10, letterSpacing: "0.06em", color: N.muted, textTransform: "uppercase" }}>{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {cmp.rows.map((r, ri) => (
                          <tr key={ri} style={{ borderTop: "1px solid " + N.rule }}>
                            <td style={{ padding: "6px 8px", color: N.ink }}>{r.label}</td>
                            {r.vals.map((v, vi) => <td key={vi} style={{ padding: "6px 8px", textAlign: "right", fontFamily: "'DM Mono', monospace", color: v < 0 ? N.red : N.ink }}>{money(v / 100)}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {s.note && <div style={{ padding: "10px 16px", borderTop: "1px solid " + N.rule, fontSize: 12, color: N.muted, fontStyle: "italic" }}>{s.note}</div>}
            </div>
          );
        })}
      </div>
    );
  }

  function Campaigns() {
    const withEmail = (entity.customers || []).filter(c => c.email && String(c.email).trim());
    const lbl = { display: "block", fontSize: 11, color: N.muted, marginBottom: 4, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" };
    return (
      <div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 2 }}>Email campaigns</div>
        <div style={{ fontSize: 13, color: N.muted, marginBottom: 16 }}>Send a newsletter or announcement to your customers — through CARES Works, no Constant Contact needed.</div>
        <div style={{ background: "#eef6ff", border: "1px solid #cfe4ff", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: N.blueDark }}><b>{withEmail.length}</b> customers have an email on file and will receive this.</div>
        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 16 }}>
          <label style={lbl}>SUBJECT</label>
          <input value={campaign.subject} onChange={e => setCampaign(d => ({ ...d, subject: e.target.value }))} placeholder="e.g. Spring specials from ProGraphics" style={{ ...inputSt, marginBottom: 12 }} />
          <label style={lbl}>MESSAGE</label>
          <textarea value={campaign.body} onChange={e => setCampaign(d => ({ ...d, body: e.target.value }))} rows={9} placeholder="Write your message…" style={{ ...inputSt, resize: "vertical", lineHeight: 1.5, marginBottom: 12, fontFamily: "'Figtree', sans-serif" }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={sendCampaign} disabled={campaignBusy || !campaign.subject.trim() || !campaign.body.trim()} style={{ ...btnBlue, background: (campaignBusy || !campaign.subject.trim() || !campaign.body.trim()) ? N.mutedLite : N.blue }}>{campaignBusy ? "Sending…" : `Send to ${withEmail.length} customers`}</button>
            {campaignResult && campaignResult.ok != null && <span style={{ fontSize: 13, color: N.pinkDark, fontWeight: 600 }}>✓ Sent to {campaignResult.ok}{campaignResult.failed ? ` · ${campaignResult.failed} failed` : ""}</span>}
            {campaignResult && campaignResult.err && <span style={{ fontSize: 13, color: N.red }}>{campaignResult.err}</span>}
          </div>
        </div>
        <div style={{ fontSize: 12, color: N.muted, marginTop: 10 }}>Sends from your CARES Works address with your business name, and appends your name + a reply-to-opt-out line to each message. Uses the same email pipe as your invoices.</div>
      </div>
    );
  }

  function CardPayoff() {
    const cards = (entity.accounts?.cards || []).map(c => ({ name: c.name, owed: Math.max(0, -(c.balance || 0)) })).filter(c => c.owed > 0);
    const total = cards.reduce((s, c) => s + c.owed, 0);
    const rows = cards.map(c => { const p = cardPlan[c.name] || {}; return { ...c, apr: (p.apr !== undefined && p.apr !== "") ? parseFloat(p.apr) : null, min: parseFloat(p.min) || 0, limit: parseFloat(p.limit) || 0 }; });
    const totalLimit = rows.reduce((s, r) => s + (r.limit || 0), 0);
    const anyApr = rows.some(r => r.apr != null);
    const ranked = [...rows].sort((a, b) => anyApr ? ((b.apr || 0) - (a.apr || 0)) : (a.owed - b.owed));
    const method = anyApr ? "highest interest first — the avalanche, saves the most money" : "smallest balance first — the snowball, quick wins that free up a minimum payment";
    const budget = parseFloat(payoffBudget) || 0;
    // A card's minimum: what you entered, or an estimate (2% of the balance, floor $25) so
    // every card shows a real number before exact minimums are typed in.
    const effMin = r => (r.min && r.min > 0) ? r.min : Math.max(25, Math.round(r.owed * 0.02));
    const anyEstimated = rows.some(r => !(r.min && r.min > 0));
    const totalMin = rows.reduce((s, r) => s + effMin(r), 0);
    const extra = Math.max(0, budget - totalMin);
    const target = ranked[0];
    const setP = (name, k, v) => {
      setCardPlan(prev => ({ ...prev, [name]: { ...(prev[name] || {}), [k]: v } }));
      if (live && liveOrgId) {
        const acct = (entity.rawAccounts || []).find(a => a.name === name);
        if (acct) {
          const patch = k === "apr" ? { apr: v === "" ? null : (parseFloat(v) || 0) }
            : k === "promo" ? { promo_end: v || null }
            : k === "limit" ? { credit_limit_cents: v === "" ? null : Math.round((parseFloat(v) || 0) * 100) }
            : { min_payment_cents: v === "" ? null : Math.round((parseFloat(v) || 0) * 100) };
          supabase.from("ledger_accounts").update(patch).eq("id", acct.id).then(() => {});
        }
      }
    };
    // How many whole months from today to a promo end date.
    const monthsUntil = d => {
      if (!d) return null;
      const p = String(d).split("-"); if (p.length !== 3) return null;
      const t = new Date(+p[0], +p[1] - 1, +p[2]); const now = new Date();
      let mo = (t.getFullYear() - now.getFullYear()) * 12 + (t.getMonth() - now.getMonth());
      if (t.getDate() < now.getDate()) mo -= 1;
      return mo;
    };
    // Waterfall the extra budget down the ranked list: fill the first card to payoff, then
    // roll whatever's left to the next, and so on — so a big budget isn't stranded on one card.
    const extraAlloc = {};
    let pool = extra;
    for (const r of ranked) {
      const room = Math.max(0, r.owed - effMin(r));
      const give = Math.max(0, Math.min(pool, room));
      extraAlloc[r.name] = give;
      pool -= give;
      if (pool <= 0.005) break;
    }
    const payNow = r => Math.min(r.owed, effMin(r) + (extraAlloc[r.name] || 0));
    const cols = "1.4fr 92px 62px 78px 92px 62px";
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 2 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Credit-card payoff plan</div>
          <button onClick={() => { setSection("admin"); setListsTab("recons"); }} style={btnPaper(N.blueDark)}>📄 Statements & reconciliations →</button>
        </div>
        <div style={{ fontSize: 13, color: N.muted, marginBottom: 16 }}>Live from your card balances. Add each card's interest rate for the smartest payoff order.</div>
        {cards.length === 0 ? (
          <div style={{ background: N.white, border: "1px dashed " + N.rule, borderRadius: 12, padding: "34px 20px", textAlign: "center", color: N.muted, fontSize: 14 }}>No card balances owed — nothing to pay down. 🎉</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, marginBottom: 14 }}>
              <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: N.muted, letterSpacing: "0.04em" }}>TOTAL CARD DEBT</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: N.red }}>{money(total)}</div>
                {totalLimit > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: N.muted, lineHeight: 1.5 }}>
                    of <b style={{ color: N.ink }}>{money(totalLimit)}</b> credit line<br />
                    <b style={{ color: total / totalLimit > 0.5 ? "#b45309" : "#3a7d4a" }}>{money(totalLimit - total)} available</b> · {Math.round((total / totalLimit) * 100)}% used
                  </div>
                )}
              </div>
              <div style={{ background: "#eef6ff", border: "1px solid #cfe4ff", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: N.blueDark, fontWeight: 700, letterSpacing: "0.06em" }}>THE PLAN</div>
                <div style={{ fontSize: 14, color: N.text, marginTop: 4, lineHeight: 1.5 }}>Pay at least the minimum on every card, then put every extra dollar on <b>{target.name}</b> ({method}). When it's cleared, roll that whole payment onto the next card down the list — and keep going.</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap", fontSize: 13, color: N.muted }}>
              <span>If you can put</span>
              <input value={payoffBudget} onChange={e => setPayoffBudget(e.target.value)} placeholder="$ / month" inputMode="decimal" style={{ ...inputSt, width: 120 }} />
              <span>toward cards this month{totalMin > 0 ? ` (minimums total ${money(totalMin)})` : ""}{extra > 0 ? <> — that's <b style={{ color: N.blueDark }}>{money(extra)} extra</b>, starting with {target.name} and rolling down as each clears.</> : "."}</span>
            </div>

            <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8, padding: "10px 16px", background: "#f7fafd", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", color: N.muted }}>
                <span>CARD</span><span style={{ textAlign: "right" }}>OWED</span><span style={{ textAlign: "right" }}>APR %</span><span style={{ textAlign: "right" }}>MIN PMT</span><span style={{ textAlign: "right" }}>PAY NOW</span><span style={{ textAlign: "right" }}>ORDER</span>
              </div>
              {ranked.map((r, i) => {
                const promo = (cardPlan[r.name] || {}).promo || "";
                const mo = monthsUntil(promo);
                const toClear = (mo && mo > 0) ? r.owed / mo : null;
                return (
                <div key={r.name} style={{ display: "grid", gridTemplateColumns: cols, gap: 8, padding: "9px 16px", borderTop: "1px solid " + N.rule, alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: N.ink }}>{r.name}{r.limit > 0 ? <span style={{ fontSize: 11, fontWeight: 600, color: (r.owed / r.limit) > 0.5 ? "#b45309" : N.mutedLite, marginLeft: 8 }}>{Math.round((r.owed / r.limit) * 100)}% used</span> : null}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, color: N.muted }}>credit line $</span>
                      <input value={(cardPlan[r.name] || {}).limit || ""} onChange={e => setP(r.name, "limit", e.target.value)} placeholder="—" inputMode="decimal" style={{ ...inputSt, width: 90, padding: "4px 6px", fontSize: 11 }} />
                      <span style={{ fontSize: 10, color: N.muted }}>· 0% until</span>
                      <input type="date" value={promo} onChange={e => setP(r.name, "promo", e.target.value)} style={{ ...inputSt, width: 138, padding: "4px 6px", fontSize: 11 }} />
                    </div>
                    {promo && (mo != null) && (
                      <div style={{ fontSize: 11, marginTop: 3, color: mo <= 0 ? N.red : "#8a5a00" }}>
                        {mo <= 0 ? "⚠ 0% has ended — interest applies now" : <>To clear before 0% ends: <b>{money(toClear)}/mo</b> for {mo} mo</>}
                      </div>
                    )}
                  </div>
                  <span style={{ textAlign: "right", fontSize: 14, color: N.red }}>{money(r.owed)}</span>
                  <input value={(cardPlan[r.name] || {}).apr || ""} onChange={e => setP(r.name, "apr", e.target.value)} placeholder="—" inputMode="decimal" style={{ ...inputSt, textAlign: "right", padding: "6px 8px" }} />
                  <input value={(cardPlan[r.name] || {}).min || ""} onChange={e => setP(r.name, "min", e.target.value)} placeholder="$" inputMode="decimal" style={{ ...inputSt, textAlign: "right", padding: "6px 8px" }} />
                  <span style={{ textAlign: "right", fontSize: 14, fontWeight: 700, color: (extraAlloc[r.name] || 0) > 0 ? N.pinkDark : N.ink }}>{money(payNow(r))}</span>
                  <span style={{ textAlign: "right" }}>{i === 0 ? <span style={{ fontSize: 9.5, fontWeight: 700, color: "#fff", background: N.pinkDark, padding: "3px 8px", borderRadius: 100 }}>PAY FIRST</span> : <span style={{ fontSize: 12, color: N.mutedLite }}>#{i + 1}</span>}</span>
                </div>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: N.muted, marginTop: 10 }}>{anyEstimated ? <><b style={{ color: "#8a5a00" }}>PAY NOW uses an estimated minimum (~2% of the balance) for any card without a MIN PMT entered</b> — type the real minimum from the statement to make it exact. </> : ""}Balances come straight from your accounts. Enter APRs to switch from "smallest balance first" to "highest interest first". When you pay a card, record it in the notebook as <b>Pay a card</b> — it books a transfer, not an expense.</div>
          </>
        )}
      </div>
    );
  }


  // ---- Register — the checkbook view ------------------------------------------
  // Same ledger_entries as the notebook, read the way a paper register reads: one
  // account, oldest line first, running balance down the right edge. There is no
  // "inbox to clear" here — every line that ever hit the account stays on the page,
  // cleared or not, because that's what a register is for.
  function Register() {
    const acctId = regAcct || (accountList[0] ? accountList[0].id : "");
    const acct = (entity.rawAccounts || []).find(a => a.id === acctId);
    const opening = acct ? (acct.opening_balance_cents || 0) : 0;

    // Running balance is computed over EVERY line on the account, then the search
    // filters what's shown — filter first and the balances would all be wrong.
    let run = opening;
    const all = (entity.rawEntries || [])
      .filter(e => e.account_id === acctId)
      .slice()
      .sort((a, b) => (a.entry_date || "").localeCompare(b.entry_date || "") || (a.created_at || "").localeCompare(b.created_at || ""))
      .map(e => {
        run += (e.direction === "in" ? 1 : -1) * (e.amount_cents || 0);
        return { ...e, balanceCents: run };
      });
    const bookCents = run;
    const rows = q
      ? all.filter(e => ((e.description || "") + " " + ((e.amount_cents || 0) / 100) + " " + (e.entry_date || "") + " " + (e.category || "")).toLowerCase().includes(q))
      : all;
    const shown = [...rows].reverse(); // newest at the top of the screen, balances already fixed

    const contributedCats = new Set((entity.rawCategories || [])
      .filter(c => c.func_class === "contributed").map(c => c.name));

    const tgt = reconTarget === "" ? null : (parseFloat(reconTarget) || 0);
    const diff = tgt == null ? null : (tgt - bookCents / 100);
    const reconciled = diff != null && Math.abs(diff) < 0.005;

    const head = { fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: "0.1em", color: N.muted, textTransform: "uppercase", padding: "0 8px 7px", textAlign: "left", fontWeight: 500 };
    const cellSt = { padding: "8px", fontSize: 13, color: N.text, verticalAlign: "middle" };

    return (
      <div>
        {/* Title + search */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Register</div>
            <div style={{ fontSize: 13, color: N.muted }}>Every line on the account, oldest to newest — Today, {entity.today}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: N.white, border: "1px solid " + N.rule, borderRadius: 100, padding: "7px 12px" }}>
            <span style={{ color: N.muted, display: "flex" }}><Ico name="search" size={15} /></span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a payee, amount, or date"
              style={{ border: "none", outline: "none", fontSize: 13, fontFamily: "'Figtree', sans-serif", width: 210, color: N.text }} />
          </div>
        </div>

        {/* Which book am I in */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {accountList.map(a => {
            const on = a.id === acctId;
            return (
              <button key={a.id} onClick={() => { setRegAcct(a.id); setReconTarget(""); }} style={{
                border: "1px solid " + (on ? N.blue : N.rule), background: on ? "#eef6ff" : N.white,
                color: on ? N.blueDark : N.muted, fontWeight: on ? 700 : 500, fontSize: 13,
                padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontFamily: "'Figtree', sans-serif",
              }}>{a.name}</button>
            );
          })}
        </div>

        {/* Controls + the number that matters */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <button onClick={() => { setShowAddLine(v => !v); setLineDraft(d => ({ ...d, accountId: acctId })); setAddedCount(0); setTimeout(() => payeeRef.current && payeeRef.current.focus(), 40); }}
            style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>{showAddLine ? "Close" : "+ Write a line"}</button>
          <span style={{ fontSize: 12.5, color: N.muted }}>Statement ending balance:</span>
          <input value={reconTarget} onChange={e => setReconTarget(e.target.value)} placeholder="$ from statement" inputMode="decimal" style={{ ...inputSt, width: 150 }} />
          {diff != null && (reconciled
            ? <span style={{ fontSize: 13, fontWeight: 700, color: N.pinkDark }}>✓ Matches to the penny</span>
            : <span style={{ fontSize: 13, color: "#8a5a00" }}>Off by <b>{money(Math.abs(diff))}</b> — {diff > 0 ? "the bank shows more" : "your book shows more"}</span>)}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: N.muted }}>{all.length} line{all.length === 1 ? "" : "s"}</span>
            <div style={{ background: bookCents < 0 ? N.red : N.blueDark, color: "#fff", borderRadius: 10, padding: "6px 14px", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.06em", opacity: 0.9 }}>BOOK BALANCE</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{money(bookCents / 100)}</div>
            </div>
          </div>
        </div>

        {showAddLine && (
          <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: N.ink, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span>Write a line into {acct ? acct.name : "this account"} — a check, cash, or a deposit the bank feed won't catch.</span>
              {addedCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#a16207", background: "#fef9c3", border: "1px solid #fde68a", padding: "3px 10px", borderRadius: 100 }}>✓ {addedCount} added</span>}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", border: "1px solid " + N.rule, borderRadius: 100, overflow: "hidden" }}>
                <button onClick={() => setLineDraft(d => ({ ...d, direction: "out" }))} style={{ border: "none", cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 13, fontWeight: 600, padding: "8px 14px", background: lineDraft.direction === "out" ? N.pinkDark : N.white, color: lineDraft.direction === "out" ? N.white : N.muted }}>Payment</button>
                <button onClick={() => setLineDraft(d => ({ ...d, direction: "in" }))} style={{ border: "none", cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 13, fontWeight: 600, padding: "8px 14px", background: lineDraft.direction === "in" ? N.green : N.white, color: lineDraft.direction === "in" ? N.white : N.muted }}>Deposit</button>
              </div>
              <input type="date" value={lineDraft.date} onChange={e => setLineDraft(d => ({ ...d, date: e.target.value }))} style={{ ...inputSt, width: 150 }} />
              <input ref={payeeRef} list="pg-vendor-list" placeholder={lineDraft.direction === "in" ? "From whom?" : "Payee"} value={lineDraft.payee} onChange={e => setLineDraft(d => ({ ...d, payee: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); amountRef.current && amountRef.current.focus(); } }} style={{ ...inputSt, flex: 1, minWidth: 200 }} />
              <datalist id="pg-vendor-list">
                {payeeOptions.map(v => <option key={v} value={v} />)}
              </datalist>
              <input ref={amountRef} placeholder="$ amount" value={lineDraft.amount} onChange={e => setLineDraft(d => ({ ...d, amount: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); createLine(); } }} style={{ ...inputSt, width: 120 }} />
              <button onClick={createLine} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>Add &amp; next ↵</button>
              <button onClick={() => setShowAddLine(false)} style={btnPaper(N.muted)}>Done</button>
            </div>
            <div style={{ fontSize: 11, color: N.muted, marginTop: 8 }}>Payee → <b>Enter</b> → amount → <b>Enter</b> saves and jumps to the next line.</div>
          </div>
        )}

        {/* The register itself */}
        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid " + N.rule }}>
                <th style={{ ...head, width: 92, paddingTop: 12 }}>Date</th>
                <th style={{ ...head, paddingTop: 12 }}>Payee / description</th>
                <th style={{ ...head, width: 210, paddingTop: 12 }}>Category</th>
                <th style={{ ...head, width: 108, textAlign: "right", paddingTop: 12 }}>Payment</th>
                <th style={{ ...head, width: 108, textAlign: "right", paddingTop: 12 }}>Deposit</th>
                <th style={{ ...head, width: 120, textAlign: "right", paddingTop: 12 }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "34px 12px", textAlign: "center", fontSize: 14, color: N.muted }}>
                  {q ? "Nothing matches that." : acctId ? "Nothing in this register yet — connect the bank feed or write a line." : "Add an account in Admin to start a register."}
                </td></tr>
              )}
              {shown.map(e => {
                const out = e.direction !== "in";
                const uncoded = !e.category;
                return (
                  <tr key={e.id} style={{ borderBottom: "1px solid " + N.rule, background: uncoded ? "#fffdf5" : "transparent" }}>
                    <td style={{ ...cellSt, color: N.muted, whiteSpace: "nowrap" }}>{e.entry_date}</td>
                    <td style={{ ...cellSt, fontWeight: 600, color: N.ink }}>
                      {e.description}
                      {/* Money in, coded to contributed support → it needs a donor, or nobody gets a letter. */}
                      {!out && featureOn("donations") && contributedCats.has(e.category) && (
                        <select value={e.donor_id || ""} onChange={ev => setDonor(e.id, ev.target.value)}
                          title="Who gave this? Drives the year-end acknowledgment letter."
                          style={{ display: "block", marginTop: 4, maxWidth: 260, fontSize: 11.5, fontWeight: 600, padding: "3px 6px", borderRadius: 6, cursor: "pointer", fontFamily: "'Figtree', sans-serif",
                            border: "1px solid " + (e.donor_id ? N.rule : "#f0d89a"), background: e.donor_id ? "#f0f7f1" : "#fdf5e3", color: e.donor_id ? "#5a7a63" : "#8a5a00" }}>
                          <option value="">Which donor?</option>
                          {(entity.donors || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      )}
                    </td>
                    <td style={cellSt}>
                      <select value={e.category || ""} onChange={ev => setCategory(e.id, ev.target.value)}
                        style={{ width: "100%", fontSize: 12, fontWeight: 600, padding: "5px 7px", borderRadius: 7, cursor: "pointer", fontFamily: "'Figtree', sans-serif",
                          border: "1px solid " + (uncoded ? "#f0d89a" : N.rule), background: uncoded ? "#fdf5e3" : N.white, color: uncoded ? "#8a5a00" : N.text }}>
                        <option value="">Needs a category…</option>
                        {(entity.categories || []).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td style={{ ...cellSt, textAlign: "right", fontFamily: "'DM Mono', monospace", color: out ? N.text : N.mutedLite }}>{out ? money((e.amount_cents || 0) / 100).replace("$", "") : "—"}</td>
                    <td style={{ ...cellSt, textAlign: "right", fontFamily: "'DM Mono', monospace", color: out ? N.mutedLite : N.green, fontWeight: out ? 400 : 700 }}>{out ? "—" : money((e.amount_cents || 0) / 100).replace("$", "")}</td>
                    <td style={{ ...cellSt, textAlign: "right", fontFamily: "'DM Mono', monospace", fontWeight: 700, color: e.balanceCents < 0 ? N.red : N.ink }}>{money(e.balanceCents / 100)}</td>
                  </tr>
                );
              })}
              {shown.length > 0 && (
                <tr style={{ background: "#f8fafc" }}>
                  <td style={{ ...cellSt, color: N.muted }}>—</td>
                  <td style={{ ...cellSt, color: N.muted, fontStyle: "italic" }}>Opening balance{acct && acct.last_four ? ` · ${acct.name}` : ""}</td>
                  <td style={cellSt} />
                  <td style={cellSt} /><td style={cellSt} />
                  <td style={{ ...cellSt, textAlign: "right", fontFamily: "'DM Mono', monospace", fontWeight: 700, color: N.muted }}>{money(opening / 100)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11.5, color: N.muted, marginTop: 10 }}>
          Lines highlighted in cream still need a category. The opening balance sits at the bottom because the newest line is on top — read it upward like a bank statement.
        </div>
      </div>
    );
  }


  // ---- Fiscal-year helpers (nonprofit reporting) --------------------------------
  // A fiscal year is labelled by the calendar year it ENDS in, which is how a 990 and
  // every auditor refer to it. With a Dec 31 year end this collapses to the calendar year.
  function fyBounds(label) {
    const m = entity.fyEndMonth || 12, d = entity.fyEndDay || 31;
    const end = new Date(Date.UTC(label, m - 1, d));
    const start = new Date(Date.UTC(label, m - 1, d));
    start.setUTCDate(start.getUTCDate() + 1);
    start.setUTCFullYear(start.getUTCFullYear() - 1);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }
  function fyOf(dateISO) {
    if (!dateISO) return null;
    const m = entity.fyEndMonth || 12, d = entity.fyEndDay || 31;
    const y = +dateISO.slice(0, 4);
    const endThisYear = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return dateISO <= endThisYear ? y : y + 1;
  }
  // Every fiscal year that actually has activity, newest first.
  function fyOptions() {
    const set = new Set((entity.rawEntries || []).map(e => fyOf(e.entry_date)).filter(Boolean));
    if (!set.size) set.add(fyOf(new Date().toISOString().slice(0, 10)));
    return [...set].sort((a, b) => b - a);
  }

  // How much of a fiscal year the loaded data actually covers, per account. A
  // Statement of Activities built on three months of one account still renders a
  // full-looking year — which is worse than showing nothing, because it invites a
  // conclusion the data can't support. So the gaps get named on the page.
  function coverage(start, end) {
    const counts = {};
    (entity.rawEntries || []).forEach(e => {
      if (!e.entry_date || e.entry_date < start || e.entry_date > end) return;
      counts[e.account_id || "none"] = (counts[e.account_id || "none"] || 0) + 1;
    });
    const today = new Date().toISOString().slice(0, 10);
    const wantEnd = end < today ? end : today;   // an open year only needs to reach today
    return (entity.rawAccounts || []).map(a => {
      // data_through is the recorded fact — how far this account's records were loaded.
      // Inferring it from the last transaction would mark a dormant account as missing.
      const through = a.data_through || null;
      return {
        name: a.name,
        n: counts[a.id] || 0,
        through,
        short: !through || through < wantEnd,
        none: !through,
      };
    });
  }

  // ---- Statement of Activities -------------------------------------------------
  // The nonprofit answer to a P&L. Two things a business P&L never has to do: split
  // revenue into contributed (gifts, grants) vs earned (fee-for-service — for this org,
  // Medicaid peer support billing), and split expense by FUNCTION rather than only by
  // kind. Both come from ledger_categories.func_class; anything unclassified lands in
  // its own bucket instead of being quietly folded into a total.
  function StatementOfActivities() {
    const years = fyOptions();
    const year = soaYear || years[0];
    const { start, end } = fyBounds(year);
    // A statement with one column can't answer "is that good?". The prior year sits
    // beside it — same shape as every audited Statement of Activities — and the
    // change column is what actually gets read.
    const prior = year - 1;
    const pb = fyBounds(prior);
    const hasPrior = years.includes(prior);

    const cur = summarizeActivities(entity.rawEntries, entity.rawCategories, start, end);
    const pre = summarizeActivities(entity.rawEntries, entity.rawCategories, pb.start, pb.end);
    const { revenue, expense, uncoded, revTotal, expTotal, change } = cur;
    const sum = o => Object.values(o).reduce((a, b) => a + b, 0);

    const COLS = hasPrior ? 4 : 2;
    const pct = (now, was) => {
      if (!was) return now ? null : null;      // no base to compare against
      return Math.round(((now - was) / Math.abs(was)) * 100);
    };
    const Delta = ({ now, was, invert }) => {
      if (!hasPrior) return null;
      const d = now - was;
      const p = pct(now, was);
      if (d === 0) return <span style={{ color: N.mutedLite }}>—</span>;
      // On expenses, up is not good news; invert the colour so the page reads right.
      const good = invert ? d < 0 : d > 0;
      return (
        <span style={{ color: good ? N.pinkDark : N.red, fontWeight: 600, whiteSpace: "nowrap" }}>
          {d > 0 ? "+" : "−"}{money(Math.abs(d) / 100).replace(/^[−]/, "")}
          {p !== null && <span style={{ fontWeight: 400, fontSize: 11.5, opacity: .85 }}> ({d > 0 ? "+" : "−"}{Math.abs(p)}%)</span>}
        </span>
      );
    };

    // Categories are unioned across both years so a line that existed last year but
    // not this one still shows, at zero, instead of silently vanishing.
    const nameSet = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
      .sort((x, y) => (b[y] || 0) + (a[y] || 0) - ((b[x] || 0) + (a[x] || 0)));

    const numTd = { padding: "5px 12px", fontSize: 13.5, textAlign: "right", fontFamily: "'DM Mono', monospace", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };
    const Section = ({ title, note, data, was, accent, invert }) => {
      const list = nameSet(data, was || {});
      if (!list.length) return null;
      return (
        <>
          <tr><td colSpan={COLS} style={{ padding: "16px 12px 5px", fontSize: 12.5, fontWeight: 700, color: accent || N.ink }}>
            {title}{note && <span style={{ fontWeight: 400, color: N.muted }}> · {note}</span>}
          </td></tr>
          {list.map(name => (
            <tr key={name}>
              <td style={{ padding: "5px 12px 5px 28px", fontSize: 13.5, color: N.text }}>{name}</td>
              <td style={numTd}>{money((data[name] || 0) / 100)}</td>
              {hasPrior && <td style={{ ...numTd, color: N.muted }}>{money(((was || {})[name] || 0) / 100)}</td>}
              {hasPrior && <td style={numTd}><Delta now={data[name] || 0} was={(was || {})[name] || 0} invert={invert} /></td>}
            </tr>
          ))}
          <tr>
            <td style={{ padding: "5px 12px 8px 28px", fontSize: 12.5, fontWeight: 700, color: N.muted, borderBottom: "1px solid " + N.rule }}>Total {title.toLowerCase()}</td>
            <td style={{ ...numTd, fontWeight: 700, paddingBottom: 8, borderBottom: "1px solid " + N.rule }}>{money(sum(data) / 100)}</td>
            {hasPrior && <td style={{ ...numTd, fontWeight: 700, color: N.muted, paddingBottom: 8, borderBottom: "1px solid " + N.rule }}>{money(sum(was || {}) / 100)}</td>}
            {hasPrior && <td style={{ ...numTd, paddingBottom: 8, borderBottom: "1px solid " + N.rule }}><Delta now={sum(data)} was={sum(was || {})} invert={invert} /></td>}
          </tr>
        </>
      );
    };
    const TotalRow = ({ label, now, was, big, invert }) => (
      <tr>
        <td style={{ padding: big ? "14px 12px" : "9px 12px", fontSize: big ? 15 : 14, fontWeight: 700, color: N.ink, borderTop: big ? "2px solid " + N.ink : "none" }}>{label}</td>
        <td style={{ ...numTd, padding: big ? "14px 12px" : "9px 12px", fontSize: big ? 17 : 15, fontWeight: 700, color: big ? (now < 0 ? N.red : N.pinkDark) : N.ink, borderTop: big ? "2px solid " + N.ink : "none" }}>{money(now / 100)}</td>
        {hasPrior && <td style={{ ...numTd, padding: big ? "14px 12px" : "9px 12px", fontSize: big ? 15 : 14, fontWeight: 700, color: N.muted, borderTop: big ? "2px solid " + N.ink : "none" }}>{money(was / 100)}</td>}
        {hasPrior && <td style={{ ...numTd, padding: big ? "14px 12px" : "9px 12px", borderTop: big ? "2px solid " + N.ink : "none" }}><Delta now={now} was={was} invert={invert} /></td>}
      </tr>
    );

    return (
      <div>
        <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Statement of Activities</div>
            <div style={{ fontSize: 13, color: N.muted }}>Revenue, expense by function, and the change in net assets{hasPrior ? " — against last year." : "."}</div>
          </div>
          <select value={year} onChange={e => setSoaYear(+e.target.value)} style={{ ...inputSt, width: 190 }}>
            {years.map(y => <option key={y} value={y}>FY {y} · {fyBounds(y).start} → {fyBounds(y).end}</option>)}
          </select>
          <button onClick={() => window.print()} style={btnPaper(N.blueDark)}>Print</button>
        </div>

        {uncoded > 0 && (
          <div className="no-print" style={{ background: "#fff7e0", border: "1px solid #f0d89a", borderRadius: 10, padding: "9px 14px", marginBottom: 12, fontSize: 12.5, color: "#8a5a00" }}>
            ⚠ {money(uncoded / 100)} of activity in FY {year} has no category yet, so it is <b>not</b> in the totals below. Code it in the Register and this statement will tie to the books.
          </div>
        )}
        {(() => {
          const cov = coverage(start, end);
          const gaps = cov.filter(c => c.short);
          if (!gaps.length) return null;
          return (
            <div className="no-print" style={{ background: "#fdecea", border: "1px solid #f5b8b2", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12.5, color: "#a32f24" }}>
              <b>This statement covers only part of FY {year}.</b> The figures below are real, but they are not a full year — don't read them as one.
              <div style={{ marginTop: 7, display: "grid", gap: 3 }}>
                {cov.map(c => (
                  <div key={c.name} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ minWidth: 220, fontWeight: c.short ? 700 : 400 }}>{c.name}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace" }}>
                      {c.none
                        ? "no records loaded"
                        : `records through ${c.through}` + (c.n ? ` · ${c.n} line${c.n === 1 ? "" : "s"} this year` : " · no activity this year")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        {!hasPrior && (
          <div className="no-print" style={{ background: "#eef6ff", border: "1px solid #cfe4ff", borderRadius: 10, padding: "9px 14px", marginBottom: 12, fontSize: 12.5, color: N.blueDark }}>
            No FY {prior} data loaded yet, so there's nothing to compare against. Load the prior year and a comparison column appears here automatically.
          </div>
        )}

        <div className="print-doc" style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: "18px 8px 12px", overflowX: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink }}>{entity.name}</div>
            <div style={{ fontSize: 13, color: N.ink, fontWeight: 600 }}>Statement of Activities</div>
            <div style={{ fontSize: 12, color: N.muted }}>
              For the year ended {fyBounds(year).end}{hasPrior && <> — with comparative totals for the year ended {pb.end}</>}
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: hasPrior ? 640 : 380 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }} />
                <th style={{ textAlign: "right", padding: "0 12px 6px", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: ".08em", color: N.muted, fontWeight: 500 }}>FY {year}</th>
                {hasPrior && <th style={{ textAlign: "right", padding: "0 12px 6px", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: ".08em", color: N.muted, fontWeight: 500 }}>FY {prior}</th>}
                {hasPrior && <th style={{ textAlign: "right", padding: "0 12px 6px", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: ".08em", color: N.muted, fontWeight: 500 }}>CHANGE</th>}
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={COLS} style={{ padding: "6px 12px 0", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted }}>REVENUE &amp; SUPPORT</td></tr>
              <Section title="Contributed support" note="gifts, grants, in-kind" data={revenue.contributed} was={pre.revenue.contributed} accent={N.pinkDark} />
              <Section title="Earned revenue" note="fee-for-service, incl. peer-support billing" data={revenue.earned} was={pre.revenue.earned} accent={N.blueDark} />
              <Section title="Unclassified revenue" note="set contributed vs earned in the chart of accounts" data={revenue.unclassified} was={pre.revenue.unclassified} accent="#8a5a00" />
              <TotalRow label="Total revenue &amp; support" now={revTotal} was={pre.revTotal} />

              <tr><td colSpan={COLS} style={{ padding: "18px 12px 0", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted }}>EXPENSES BY FUNCTION</td></tr>
              <Section title="Program services" data={expense.program} was={pre.expense.program} accent={N.pinkDark} invert />
              <Section title="Management &amp; general" data={expense.mg} was={pre.expense.mg} accent={N.blueDark} invert />
              <Section title="Fundraising" data={expense.fundraising} was={pre.expense.fundraising} accent={N.blue} invert />
              <Section title="Unclassified expenses" note="assign a function in the chart of accounts" data={expense.unclassified} was={pre.expense.unclassified} accent="#8a5a00" invert />
              <TotalRow label="Total expenses" now={expTotal} was={pre.expTotal} invert />

              <TotalRow label="Change in net assets" now={change} was={pre.change} big />
            </tbody>
          </table>
          {expTotal > 0 && (
            <div style={{ fontSize: 11.5, color: N.muted, padding: "10px 12px 0" }}>
              Program services are {Math.round((sum(expense.program) / expTotal) * 100)}% of total expenses
              {hasPrior && pre.expTotal > 0 && <> (FY {prior}: {Math.round((sum(pre.expense.program) / pre.expTotal) * 100)}%)</>}.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Donations & year-end acknowledgments ------------------------------------
  // Money in, coded to a contributed-support category, and tagged to a donor. The
  // year-end letter is the IRS "contemporaneous written acknowledgment" a donor needs
  // to deduct a gift of $250 or more — so it has to state the amount and whether
  // anything was given in return. Gifts with no donor attached are listed separately
  // rather than dropped, because an untagged gift is a missing letter.
  function Giving() {
    const years = fyOptions();
    const year = soaYear || years[0];
    const { start, end } = fyBounds(year);
    const donors = entity.donors || [];
    const byId = {}; donors.forEach(d => { byId[d.id] = d; });

    const contributed = new Set((entity.rawCategories || [])
      .filter(c => c.func_class === "contributed").map(c => c.name));

    const gifts = (entity.rawEntries || []).filter(e =>
      e.direction === "in" && e.entry_date >= start && e.entry_date <= end && e.category && contributed.has(e.category));

    const grouped = {};
    let untagged = [];
    gifts.forEach(g => {
      if (!g.donor_id || !byId[g.donor_id]) { untagged.push(g); return; }
      (grouped[g.donor_id] = grouped[g.donor_id] || []).push(g);
    });
    const letters = Object.entries(grouped)
      .map(([id, list]) => ({ donor: byId[id], list, total: list.reduce((s, g) => s + (g.amount_cents || 0), 0) }))
      .sort((a, b) => b.total - a.total);
    const grand = letters.reduce((s, l) => s + l.total, 0);

    return (
      <div>
        <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Donations</div>
            <div style={{ fontSize: 13, color: N.muted }}>Contributed support by donor, and the year-end letters that go with it.</div>
          </div>
          <select value={year} onChange={e => setSoaYear(+e.target.value)} style={{ ...inputSt, width: 190 }}>
            {years.map(y => <option key={y} value={y}>FY {y}</option>)}
          </select>
          <button onClick={() => setShowDonorForm(v => !v)} style={btnPaper(N.blue)}>{showDonorForm ? "Close" : "+ Add a donor"}</button>
          <button onClick={() => window.print()} disabled={!letters.length} style={{ ...btnBlue, background: letters.length ? N.blue : N.mutedLite, fontSize: 13, padding: "9px 16px" }}>Print all {letters.length || ""} letters</button>
        </div>

        {showDonorForm && (
          <div className="no-print" style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 14, marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input placeholder="Donor name" value={donorDraft.name} onChange={e => setDonorDraft(d => ({ ...d, name: e.target.value }))} style={{ ...inputSt, flex: 1, minWidth: 180 }} />
            <input placeholder="Email" value={donorDraft.email} onChange={e => setDonorDraft(d => ({ ...d, email: e.target.value }))} style={{ ...inputSt, width: 220 }} />
            <input placeholder="Mailing address (for the letter)" value={donorDraft.address} onChange={e => setDonorDraft(d => ({ ...d, address: e.target.value }))} style={{ ...inputSt, flex: 1, minWidth: 220 }} />
            <button onClick={saveDonor} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>Save donor</button>
          </div>
        )}

        <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {[["DONORS", letters.length], ["GIFTS", gifts.length], ["TOTAL GIVEN", money(grand / 100)]].map(([l, v]) => (
            <div key={l} style={{ background: "#f4f7fb", border: "1px solid " + N.rule, borderRadius: 10, padding: "8px 14px" }}>
              <div style={{ fontSize: 10, color: N.muted, letterSpacing: "0.06em" }}>{l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: N.ink }}>{v}</div>
            </div>
          ))}
        </div>

        {untagged.length > 0 && (
          <div className="no-print" style={{ background: "#fff7e0", border: "1px solid #f0d89a", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12.5, color: "#8a5a00" }}>
            ⚠ {untagged.length} gift{untagged.length === 1 ? "" : "s"} totalling {money(untagged.reduce((s, g) => s + (g.amount_cents || 0), 0) / 100)} {untagged.length === 1 ? "has" : "have"} no donor attached, so no letter will print for {untagged.length === 1 ? "it" : "them"}. Attach a donor on the money-in line in the Register.
          </div>
        )}

        {letters.length === 0 && (
          <div className="no-print" style={{ padding: "30px 16px", textAlign: "center", color: N.muted, fontSize: 14, background: N.white, border: "1px solid " + N.rule, borderRadius: 12 }}>
            No donor-tagged gifts in FY {year} yet. Gifts show up here once a money-in line is coded to a contributed-support category and attached to a donor.
          </div>
        )}

        <div className="print-doc">
          {letters.map(({ donor, list, total }) => (
            <div key={donor.id} style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: "26px 30px", marginBottom: 14, pageBreakAfter: "always" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div>
                  {entity.logoUrl
                    ? <img src={entity.logoUrl} alt={entity.name} style={{ height: 40, maxWidth: 220, objectFit: "contain", marginBottom: 6 }} />
                    : <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: N.ink }}>{entity.name}</div>}
                  {entity.remitAddress && <div style={{ fontSize: 12, color: N.muted, whiteSpace: "pre-line" }}>{entity.remitAddress}</div>}
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: N.muted }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em" }}>FY {year} GIVING STATEMENT</div>
                  <div>Issued {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                </div>
              </div>

              <div style={{ marginTop: 22, fontSize: 13.5, color: N.text }}>
                <div style={{ fontWeight: 700, color: N.ink }}>{donor.name}</div>
                {donor.address && <div style={{ color: N.muted, whiteSpace: "pre-line" }}>{donor.address}</div>}
              </div>

              <p style={{ fontSize: 13.5, color: N.text, lineHeight: 1.65, marginTop: 18 }}>
                Thank you for your support of {entity.name}. This letter acknowledges the contributions
                below, received between {fyBounds(year).start} and {fyBounds(year).end}.
              </p>

              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid " + N.rule }}>
                    <th style={{ textAlign: "left", padding: "6px 0", fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: "0.1em", color: N.muted, fontWeight: 500 }}>DATE</th>
                    <th style={{ textAlign: "left", padding: "6px 0", fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: "0.1em", color: N.muted, fontWeight: 500 }}>DESCRIPTION</th>
                    <th style={{ textAlign: "right", padding: "6px 0", fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: "0.1em", color: N.muted, fontWeight: 500 }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {list.slice().sort((a, b) => (a.entry_date || "").localeCompare(b.entry_date || "")).map(g => (
                    <tr key={g.id} style={{ borderBottom: "1px solid " + N.rule }}>
                      <td style={{ padding: "7px 0", fontSize: 13, color: N.muted, whiteSpace: "nowrap" }}>{g.entry_date}</td>
                      <td style={{ padding: "7px 0", fontSize: 13, color: N.text }}>{g.description}{g.category ? <span style={{ color: N.muted }}> · {g.category}</span> : ""}</td>
                      <td style={{ padding: "7px 0", fontSize: 13, textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{money((g.amount_cents || 0) / 100)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2} style={{ padding: "10px 0", fontSize: 14, fontWeight: 700, color: N.ink }}>Total contributions, FY {year}</td>
                    <td style={{ padding: "10px 0", fontSize: 16, fontWeight: 700, textAlign: "right", fontFamily: "'DM Mono', monospace", color: N.ink }}>{money(total / 100)}</td>
                  </tr>
                </tbody>
              </table>

              <p style={{ fontSize: 12, color: N.muted, lineHeight: 1.6, marginTop: 16, borderTop: "1px solid " + N.rule, paddingTop: 12 }}>
                {entity.name} is a tax-exempt organization under section 501(c)(3) of the Internal Revenue Code.
                No goods or services were provided in exchange for these contributions, except intangible religious
                benefits where applicable. Please retain this statement for your tax records.
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function Connect() {
    return (
      <div style={{ maxWidth: 560, margin: "40px auto 0", textAlign: "center" }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink, marginBottom: 8 }}>{entity.name}</div>
        <div style={{ fontSize: 15, color: N.muted, lineHeight: 1.6, marginBottom: 22 }}>
          This workspace is ready — the exact same machine as ProGraphics, just {entity.short}'s name on the door. Connect the bank feed and QuickBooks and the notebook, invoices, and reports fill themselves.
        </div>
        <button style={{ ...btnBlue, background: N.blue, fontSize: 15, padding: "12px 20px", margin: "0 auto", boxShadow: "0 4px 14px rgba(0,128,255,0.4)" }}>Connect {entity.short}'s accounts</button>
      </div>
    );
  }

  // Render sections by CALLING the function (inline JSX), never as <Notebook/>.
  // These functions close over parent state and use no hooks of their own; mounting
  // them as elements makes React remount the subtree on every keystroke, which stole
  // focus from the inputs (the "one letter at a time" bug). Inlining keeps focus.
  let body;
  if (entity.needsConnect) body = Connect();
  else if (activeSection === "notebook") body = entity.ledgerStyle === "register" ? Register() : Notebook();
  else if (activeSection === "invoices") body = Invoices();
  else if (activeSection === "orders") body = Orders();
  else if (activeSection === "purchaseorders") body = PurchaseOrders();
  else if (activeSection === "salestax") body = SalesTax();
  else if (activeSection === "giving") body = Giving();
  else if (activeSection === "reports") body = entity.reportStyle === "nonprofit" ? StatementOfActivities() : Reports();
  else if (activeSection === "admin") body = Admin();
  else if (activeSection === "bills") body = Bills();
  else if (activeSection === "documents") body = Documents();

  return (
    <div style={{ minHeight: "100vh", background: N.white, fontFamily: "'Figtree', sans-serif", color: N.text }}>
      <link href={FONTS} rel="stylesheet" />
      <style>{`
        input[type="checkbox"] { accent-color: ${AMBER}; }
        /* datalist inputs draw a native dropdown arrow in Chrome/Edge — hide it so only our custom ▼ shows (no double arrow) */
        input[list]::-webkit-calendar-picker-indicator { display: none !important; opacity: 0; }
        @keyframes msgPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(234,88,12,0); border-color: #fed7aa; }
          50% { box-shadow: 0 0 0 5px rgba(234,88,12,0.30); border-color: #fb923c; }
        }
        @media print {
          body * { visibility: hidden !important; }
          .print-doc, .print-doc * { visibility: visible !important; }
          .print-doc { position: absolute !important; left: 0; top: 0; width: 100% !important; max-width: 100% !important; box-shadow: none !important; border-radius: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <header className="app-print-hide" style={{ position: "sticky", top: 0, zIndex: 50, background: N.white, borderBottom: "1px solid " + N.rule }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            {entity.logoUrl
              ? <img src={entity.logoUrl} alt={entity.name} style={{ height: 38, maxWidth: 260, objectFit: "contain" }} />
              : <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, whiteSpace: "nowrap" }}>{entity.short}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {dbEntity && (
            <button onClick={() => { if (testMode) { setTestMode(false); } else { if (window.confirm("Turn on Test mode? Show your real numbers but NOTHING you do will be saved — great for letting Dave & Betty poke around. Turn it off to go back to the real thing.")) setTestMode(true); } }}
              title={testMode ? "Exit test mode — back to your real, saved data" : "Play around safely — nothing saves"}
              style={{ display: "flex", alignItems: "center", gap: 6, background: testMode ? "#eab308" : "none", border: "1px solid " + (testMode ? "#eab308" : N.rule), color: testMode ? "#fff" : N.muted, borderRadius: 100, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", whiteSpace: "nowrap" }}>
              🧪 {testMode ? "Exit test mode" : "Test mode"}
            </button>
          )}
          <div style={{ position: "relative" }}>
            <button onClick={() => setWhatsNew(w => !w)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#eef6ff", border: "1px solid #cfe4ff", color: N.blueDark, borderRadius: 100, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Figtree', sans-serif", whiteSpace: "nowrap" }}>
              <Ico name="sparkle" size={14} /> Updated {latestUpdate}
              <span style={{ width: 7, height: 7, borderRadius: 100, background: N.pink, boxShadow: `0 0 8px ${N.pink}` }} />
            </button>
            {whatsNew && (
              <div style={{ position: "absolute", top: 40, right: 0, width: 320, background: N.white, border: "1px solid " + N.rule, borderRadius: 12, boxShadow: "0 12px 34px rgba(10,10,20,0.14)", padding: 14, zIndex: 60 }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: N.ink, marginBottom: 2 }}>What's new</div>
                <div style={{ fontSize: 12, color: N.muted, marginBottom: 10 }}>We tell you what changed — so nothing ever moves on you without a heads-up.</div>
                {entity.changelog.map(c => (
                  <div key={c.date} style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.blue, marginBottom: 4 }}>{c.date.toUpperCase()}</div>
                    {c.items.map((it, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: N.text, marginBottom: 4 }}>
                        <span style={{ color: N.pink }}>•</span>{it}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { setHelpWho(isBetty ? "betty" : "dave"); setHelpOpen(true); }} title="How to — a quick guide" style={{ background: "none", border: "1px solid " + N.rule, color: N.blueDark, borderRadius: 100, width: 30, height: 30, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>?</button>
          <button onClick={() => setWide(w => !w)} title={wide ? "Show the side panels" : "Hide side panels for more room"} style={{ background: wide ? N.blue : "none", border: "1px solid " + (wide ? N.blue : N.rule), color: wide ? "#fff" : N.muted, borderRadius: 100, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, padding: "6px 12px", whiteSpace: "nowrap" }}>{wide ? "◧ Panels" : "⤢ Wide"}</button>
          <div style={{ position: "relative", whiteSpace: "nowrap" }}>
            <button onClick={() => setUserMenuOpen(o => !o)} title="Account" style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "1px solid " + N.rule, borderRadius: 100, padding: "3px 10px 3px 3px", cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
              <span style={{ width: 28, height: 28, borderRadius: 100, background: "#eef6ff", color: N.blueDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                {entity.users.find(u => u.name === entity.currentUser)?.initials || (entity.currentUser?.[0] || "?").toUpperCase()}
              </span>
              <span style={{ fontSize: 13, color: N.muted }}>{entity.currentUser}</span>
              <span style={{ fontSize: 9, color: N.muted }}>▾</span>
            </button>
            {userMenuOpen && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: N.white, border: "1px solid " + N.rule, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.14)", padding: 8, minWidth: 220, zIndex: 200 }}>
                <div style={{ fontSize: 12, color: N.muted, padding: "6px 8px 10px", borderBottom: "1px solid " + N.rule, marginBottom: 6 }}>
                  Signed in as<br /><b style={{ color: N.ink, wordBreak: "break-all" }}>{session?.user?.email || entity.currentUser}</b>
                </div>
                <button onClick={logout} style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 13, fontWeight: 600, color: N.pinkDark, padding: "8px", borderRadius: 6 }}>Log out &amp; switch user →</button>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Balances — always in view */}
        <div style={{ display: "flex", gap: 8, padding: "0 22px 12px", overflowX: "auto", flexWrap: "wrap", alignItems: "stretch" }}>
          {(() => {
            const ar = invoices.filter(v => v.docType !== "order" && v.status !== "Void" && v.status !== "Paid")
              .reduce((s, v) => s + (v.balanceCents != null ? v.balanceCents : Math.round((v.amount || 0) * 100)), 0);
            const ap = (entity.bills || []).filter(b => b.status !== "paid").reduce((s, b) => s + (b.amount_cents || 0), 0);
            const pill = (label, val, bg, go) => (
              <div onClick={go} title={"Go to " + label.toLowerCase()} style={{ background: bg, borderRadius: 10, padding: "6px 13px", whiteSpace: "nowrap", cursor: "pointer", color: "#fff", boxShadow: "0 2px 10px " + bg + "55" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.06em", opacity: 0.92 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{money(val / 100)}</div>
              </div>
            );
            const has = k => sections.some(x => x.key === k);
            return (
              <>
                {has("invoices") && pill("OPEN INVOICES", ar, N.green, () => setSection("invoices"))}
                {has("bills") && pill("OPEN BILLS", ap, N.blueDark, () => setSection("bills"))}
                {(has("invoices") || has("bills")) && <div style={{ width: 1, background: N.rule, margin: "3px 5px" }} />}
              </>
            );
          })()}
          {[...entity.accounts.banks, ...entity.accounts.cards, ...entity.accounts.loans].slice().sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { numeric: true })).map(a => (
            <div key={a.name} style={{ background: "#f4f7fb", border: "1px solid " + N.rule, borderRadius: 10, padding: "6px 11px", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 10, color: N.muted, letterSpacing: "0.04em" }}>{a.name.toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: N.ink, display: "flex", alignItems: "center", gap: 5 }}>
                {money(Math.abs(a.balance))}
                {(() => {
                  const ra = (entity.rawAccounts || []).find(x => x.name === a.name);
                  const rec = ra ? reconHist.find(r => r.account_id === ra.id) : null;
                  if (!rec || !rec.statement_ending_date) return ra && ["bank", "credit_card", "loan"].includes(ra.account_type) ? <span title="Not reconciled yet" style={{ fontSize: 11, color: N.mutedLite }}>○</span> : null;
                  const days = Math.floor((Date.now() - new Date(rec.statement_ending_date + "T00:00:00").getTime()) / 86400000);
                  const fresh = days <= 40;
                  return <span title={`Reconciled through ${fmtStmtDate(rec.statement_ending_date)} — ${days} day${days === 1 ? "" : "s"} ago${fresh ? "" : " (a new statement may be due)"}`} style={{ fontSize: 13, fontWeight: 700, color: fresh ? N.green : "#b45309" }}>{fresh ? "✓" : "⚠"}</span>;
                })()}
              </div>
            </div>
          ))}
        </div>
        {messageBar()}
      </header>

      {testMode && (
        <div className="no-print" style={{ background: "#eab308", color: "#fff", textAlign: "center", fontSize: 13, fontWeight: 700, padding: "7px 16px", letterSpacing: "0.02em", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          🧪 TEST MODE — this is your real data to explore, but nothing you do here is saved.
          <button onClick={() => setTestMode(false)} style={{ background: "#fff", color: "#8a5a00", border: "none", borderRadius: 100, padding: "3px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>Exit test mode</button>
        </div>
      )}

      {/* Body: nav + work area */}
      <div className="app-print-hide" style={{ display: "flex", alignItems: "flex-start", maxWidth: 1180, margin: "0 auto" }}>
        <nav style={{ width: wide ? 58 : 210, flexShrink: 0, padding: "18px 10px", position: "sticky", top: 132 }}>
          {sections.map(s => {
            const active = activeSection === s.key;
            return (
              <button key={s.key} onClick={() => setSection(s.key)} title={s.label} style={{
                display: "flex", alignItems: "center", justifyContent: wide ? "center" : "flex-start", gap: 11, width: "100%", textAlign: "left",
                padding: "10px 12px", marginBottom: 3, borderRadius: 10, cursor: "pointer",
                border: "none", fontFamily: "'Figtree', sans-serif", fontSize: 14,
                background: active ? "#eef6ff" : "transparent",
                color: active ? N.blueDark : N.muted, fontWeight: active ? 700 : 500,
              }}>
                <span style={{ display: "flex", color: active ? N.blue : N.mutedLite }}><Ico name={s.key} /></span>
                {!wide && s.label}
              </button>
            );
          })}
        </nav>

        <main style={{ flex: 1, minWidth: 0, padding: "18px 24px 80px" }}>{body}</main>

        {!wide && (
        <aside style={{ width: 238, flexShrink: 0, padding: "18px 12px", position: "sticky", top: 132 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: "0.12em", color: N.muted, marginBottom: 8, paddingLeft: 4 }}>BUILD PROGRESS</div>
            {(() => {
              const box = (st, sz) => (
                <span style={{ width: sz, height: sz, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: st === "done" ? N.green : "transparent",
                  border: st === "done" ? "none" : "1.5px solid " + (st === "wip" ? AMBER : N.rule),
                  color: st === "done" ? "#fff" : N.ink, fontSize: sz - 5, fontWeight: 700 }}>{st === "done" ? "✓" : st === "wip" ? "•" : ""}</span>
              );
              return buildProgress.map(g => {
                const st = progStatus(g.items);
                const done = g.items.filter(i => i[1] === "done").length;
                const open = progOpen[g.label] !== undefined ? progOpen[g.label] : (st === "wip");
                return (
                  <div key={g.label} style={{ marginBottom: 2 }}>
                    <div onClick={() => setProgOpen(p => ({ ...p, [g.label]: !open }))}
                      style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, color: st === "todo" ? N.mutedLite : N.ink, padding: "4px 4px", cursor: "pointer", borderRadius: 6 }}>
                      {box(st, 15)}
                      <span style={{ flex: 1, minWidth: 0 }}>{g.label}</span>
                      <span style={{ fontSize: 10, color: N.mutedLite, fontFamily: "'DM Mono', monospace" }}>{done}/{g.items.length}</span>
                      <span style={{ fontSize: 9, color: N.mutedLite, transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}>▸</span>
                    </div>
                    {open && (
                      <div style={{ marginLeft: 10, paddingLeft: 12, borderLeft: "1px solid " + N.rule, marginBottom: 6 }}>
                        {g.items.map(([sl, ss]) => (
                          <div key={sl} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: ss === "done" ? N.text : ss === "wip" ? "#8a5a00" : N.mutedLite, padding: "3px 2px" }}>
                            {box(ss, 13)}<span>{sl}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
        </aside>
        )}
      </div>

      {/* invoice / PO document modal — mounted once here so View / print works from any screen */}
      {docModal()}
      {overpayModal()}
      {helpModal()}
      {importModal()}
      {poSendModal()}
    </div>
  );
}

const btnBlue = {
  display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600,
  padding: "6px 11px", border: "1px solid " + N.blue, background: N.blue, color: N.white,
  borderRadius: 8, cursor: "pointer", fontFamily: "'Figtree', sans-serif", whiteSpace: "nowrap",
};
function btnPaper(color) {
  return {
    display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600,
    padding: "6px 11px", border: "1px solid " + N.rule, background: N.white, color,
    borderRadius: 8, cursor: "pointer", fontFamily: "'Figtree', sans-serif", whiteSpace: "nowrap",
  };
}
const inputSt = {
  width: "100%", padding: "9px 11px", fontSize: 14, fontFamily: "'Figtree', sans-serif",
  border: "1px solid " + N.rule, borderRadius: 8, outline: "none", color: N.text,
  boxSizing: "border-box", background: N.white,
};
