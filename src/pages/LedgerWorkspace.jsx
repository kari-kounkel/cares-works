// LedgerWorkspace.jsx — the entity-driven bookkeeping workspace.
// NOTHING about the entity is hardcoded: name, users, accounts, and data all
// come from the `entity` object (in production, the entity's data record).
// ProGraphics is just the first tenant — SAMPLE_ENTITY seeds a clickable preview.
//
// Layout mirrors the NLIC org shell: left nav + big work area, blue-dominant neon.
// Betty lands on her stenographer Notebook; Dave lands on Invoices.

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";
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
  // Plain-language buckets the humans see. Each maps to Gary's chart of accounts behind the scenes —
  // they pick "Materials & supplies," never "Account 5010 · COGS."
  categories: ["Materials & supplies", "Shipping & postage", "Software & subscriptions", "Vehicle & fuel", "Equipment", "Office supplies", "Bank & card fees", "Advertising", "Meals", "Owner draw"],
  reports: [
    { name: "Profit & Loss", sub: "Gross income and net profit for Gary" },
    { name: "Expense detail by category", sub: "Matched to Gary's chart of accounts" },
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
  matt: connectStub("Social MN", "Social MN", "Matt", "M"),
};

const SECTIONS = [
  { key: "orders", label: "New Orders" },
  { key: "invoices", label: "Invoices" },
  { key: "salestax", label: "Sales tax" },
  { key: "notebook", label: "Notebook" },
  { key: "bills", label: "Bills" },
  { key: "reports", label: "Reports" },
  { key: "documents", label: "Documents" },
  { key: "admin", label: "Admin" },
];

const BUILD_PROGRESS = [
  { label: "Purchase Orders", items: [
    ["Take an order — customer + items", "done"],
    ["Optional PO to a vendor", "done"],
    ["Vendor cost vs. customer price", "done"],
    ["Print the PO", "done"],
    ["Convert PO → invoice", "done"],
    ["Edit or delete an order", "done"],
  ] },
  { label: "Invoicing", items: [
    ["Branded invoice — logo, remit, ACH, tax", "done"],
    ["Customer + item pickers from your lists", "done"],
    ["Send link + “Viewed” tracking", "done"],
    ["Email it from CARES Works", "done"],
    ["Partial payments + record checks", "done"],
    ["Void or delete", "done"],
  ] },
  { label: "Bank & card setup", items: [
    ["Bank + credit-card accounts", "done"],
    ["Real transactions imported", "done"],
    ["Add / edit accounts", "done"],
    ["Card balances tied to statements", "wip"],
  ] },
  { label: "Notebook", items: [
    ["Bank / card lines to reconcile", "done"],
    ["Real chart-of-accounts picker", "done"],
    ["Which bank / card each hit", "done"],
    ["Customer payments link to invoices", "done"],
    ["Pay a card — transfer, not expense", "done"],
    ["Hand-enter a check / cash / deposit", "done"],
  ] },
  { label: "Bills", items: [
    ["Record a vendor bill", "done"],
    ["Mark a bill paid", "done"],
    ["Pay a bill by printed check (voucher)", "done"],
    ["Credit-card balances as bills to pay", "todo"],
  ] },
  { label: "Sales tax", items: [
    ["Auto-tally taxable / exempt / collected", "done"],
    ["Printable filing report", "todo"],
  ] },
  { label: "Lists — customers, vendors, items", items: [
    ["Customers — add / edit full info", "done"],
    ["Vendors — add / edit full info", "done"],
    ["Items & services — edit, price, inactive", "done"],
  ] },
  { label: "Reports", items: [
    ["Profit & Loss — from April 1", "todo"],
    ["Trial balance — begin + end", "todo"],
    ["Balance sheet", "todo"],
    ["Expense detail by category", "todo"],
  ] },
  { label: "Documents", items: [
    ["Store statements & certificates", "todo"],
  ] },
  { label: "Year-end for Gary", items: [
    ["April-1 opening balances", "wip"],
    ["Tax-ready package", "todo"],
  ] },
  { label: "Admin panel", items: [
    ["Users & roles", "todo"],
    ["Branding / logo", "todo"],
    ["Sales-tax rate", "todo"],
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
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

const STATUS_COLOR = {
  Paid: N.green, Partial: "#eab308", Viewed: N.blue, Sent: N.blueHot, Draft: N.muted, Void: N.mutedLite,
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
    case "notebook": return <svg {...p}><path d="M6 4h11a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2V4Z" /><path d="M6 4a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2" /><path d="M10 8h6M10 12h6" /></svg>;
    case "invoices": return <svg {...p}><path d="M6 3h9l3 3v15H6Z" /><path d="M15 3v3h3" /><path d="M9 12h6M9 16h4" /></svg>;
    case "bills": return <svg {...p}><path d="M5 3l1.5 1.5L8 3l1.5 1.5L11 3l1.5 1.5L14 3v18l-1.5-1.5L11 21l-1.5-1.5L8 21l-1.5-1.5L5 21Z" /><path d="M8 8h4M8 12h3" /></svg>;
    case "salestax": return <svg {...p}><circle cx="8" cy="8" r="1.6" /><circle cx="16" cy="16" r="1.6" /><path d="M6 18 18 6" /></svg>;
    case "reports": return <svg {...p}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></svg>;
    case "documents": return <svg {...p}><path d="M4 5a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /></svg>;
    case "orders": return <svg {...p}><path d="M6 3h9l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>;
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
  const userName = session?.user?.user_metadata?.name || (email ? email.split("@")[0] : "You");

  const bal = {};
  accounts.forEach(a => { bal[a.id] = a.opening_balance_cents || 0; });
  entries.forEach(e => {
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
    status: cap(v.status),
    date: d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
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
  if (m.status !== "Void" && m.docType !== "order") {
    if (totalCents > 0 && paidCents >= totalCents) status = "Paid";
    else if (paidCents > 0) status = "Partial";
  }
  return { ...m, payments, paidCents, balanceCents, paid: paidCents / 100, balance: balanceCents / 100, status };
}

function fmtPay(p) {
  const label = p.method === "check" ? (p.check_number ? `Check #${p.check_number}` : "Check")
    : p.method === "ach" ? "ACH" : p.method === "cash" ? "Cash" : p.method === "card" ? "Card" : "Payment";
  const d = p.paid_on ? String(p.paid_on).split("-") : null;
  const date = d && d.length === 3 ? `${+d[1]}/${+d[2]}/${d[0].slice(2)}` : "";
  return `${label}${date ? " · " + date : ""}`;
}

export default function LedgerWorkspace({ entity: propEntity, entityKey, orgId, session }) {
  const [dbEntity, setDbEntity] = useState(null);
  const entity = dbEntity || propEntity || ENTITIES[entityKey] || SAMPLE_ENTITY;
  const live = !!dbEntity;
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
  const blankLine = { date: new Date().toISOString().slice(0, 10), payee: "", amount: "", direction: "out", accountId: "" };
  const [lineDraft, setLineDraft] = useState(blankLine);
  const [editLineId, setEditLineId] = useState(null);
  const [editDraft, setEditDraft] = useState({ date: "", payee: "", amount: "", direction: "out" });
  const [addedCount, setAddedCount] = useState(0);
  const [sortBy, setSortBy] = useState("account");
  const [acctFilter, setAcctFilter] = useState("");
  const [reconTarget, setReconTarget] = useState("");
  const [reconOpen, setReconOpen] = useState(false);
  const [reconChecked, setReconChecked] = useState({});
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const payeeRef = useRef(null);
  const amountRef = useRef(null);
  const blankAcct = { name: "", account_type: "bank", last_four: "", opening: "" };
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
  const blankCat = { name: "", kind: "expense" };
  const [catEditId, setCatEditId] = useState(null);
  const [catDraft, setCatDraft] = useState(blankCat);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState(blankCat);
  const [listsTab, setListsTab] = useState("");
  const blankContact = { name: "", company: "", email: "", phone: "", billing_address: "", tax_status: "Taxable", notes: "" };
  const [contactEditId, setContactEditId] = useState(null);
  const [contactDraft, setContactDraft] = useState(blankContact);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState(blankContact);
  const [invoices, setInvoices] = useState(entity.invoices || []);
  const [liveOrgId, setLiveOrgId] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [showInvForm, setShowInvForm] = useState(false);
  const [openInv, setOpenInv] = useState(null);
  const [sentLink, setSentLink] = useState(null);
  const [emailState, setEmailState] = useState(null);
  const [progOpen, setProgOpen] = useState({});
  const blankInvPay = { amount: "", method: "check", check_number: "", paid_on: "", memo: "", accountId: "" };
  const [payFor, setPayFor] = useState(null);
  const [invPay, setInvPay] = useState(blankInvPay);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const blankOrder = { mode: "invoice", customer: "", vendor: "", email: "", taxStatus: "Exempt", lines: [{ item: "", desc: "", qty: "1", cost: "", price: "" }] };
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
  const [checkOffX, setCheckOffX] = useState(() => { try { return parseFloat(localStorage.getItem("cw_checkAlignX")) || 0; } catch (e) { return 0; } }); // inches, printer alignment nudge (remembered)
  const [checkOffY, setCheckOffY] = useState(() => { try { return parseFloat(localStorage.getItem("cw_checkAlignY")) || 0; } catch (e) { return 0; } });
  useEffect(() => { try { localStorage.setItem("cw_checkAlignX", String(checkOffX)); localStorage.setItem("cw_checkAlignY", String(checkOffY)); } catch (e) { /* storage may be blocked */ } }, [checkOffX, checkOffY]);
  const blankInvoice = { customer: "", email: "", taxStatus: "Exempt", lines: [{ desc: "", qty: "1", price: "" }] };
  const [invDraft, setInvDraft] = useState(blankInvoice);

  const latestUpdate = entity.changelog?.[0]?.date || "";
  const MN_TAX_RATE = 0.0925;

  // Go live when someone's logged in: load their ProGraphics ledger org from Supabase.
  useEffect(() => {
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
      const [a, c, e, inv, ven, cust, prod, bil, pay] = await Promise.all([
        supabase.from("ledger_accounts").select("*").eq("org_id", org.id).eq("archived", false).order("created_at", { ascending: true }),
        supabase.from("ledger_categories").select("*").eq("org_id", org.id).eq("archived", false).order("sort_order", { ascending: true }),
        supabase.from("ledger_entries").select("*").eq("org_id", org.id).order("entry_date", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").eq("org_id", org.id).order("issue_date", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("ledger_vendors").select("*").eq("org_id", org.id).eq("archived", false).order("name", { ascending: true }),
        supabase.from("ledger_customers").select("*").eq("org_id", org.id).eq("archived", false).order("name", { ascending: true }),
        supabase.from("ledger_products").select("*").eq("org_id", org.id).order("name", { ascending: true }),
        supabase.from("ledger_bills").select("*").eq("org_id", org.id).order("due_date", { ascending: true }).order("created_at", { ascending: false }),
        supabase.from("ledger_payments").select("*").eq("org_id", org.id).order("paid_on", { ascending: true }),
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
      setDbEntity(built);
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id, entityKey, orgId, reloadTick]);

  // Keep the notebook + invoices in sync when the data source changes (sample → live, or after a write).
  useEffect(() => { setItems(entity.notebook); setCleared([]); setInvoices(entity.invoices || []); }, [entity]);

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
  async function finishReconcile(ids) {
    if (!ids || ids.length === 0) { setReconOpen(false); return; }
    setReconOpen(false); setReconChecked({});
    const idset = new Set(ids);
    setItems(prev => prev.filter(x => !idset.has(x.id)));
    if (live) { await supabase.from("ledger_entries").update({ match_status: "reconciled", cleared_confirmed: true }).in("id", ids); setReloadTick(t => t + 1); }
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

  // Chart-of-accounts management (income / expense accounts = ledger_categories).
  async function addChartCat() {
    if (!newCat.name.trim() || !liveOrgId) return;
    await supabase.from("ledger_categories").insert({ org_id: liveOrgId, user_id: session.user.id, name: newCat.name.trim(), kind: newCat.kind, sort_order: 999, archived: false });
    setShowAddCat(false); setNewCat(blankCat); setReloadTick(t => t + 1);
  }
  async function saveChartCat() {
    if (!catEditId || !catDraft.name.trim()) return;
    await supabase.from("ledger_categories").update({ name: catDraft.name.trim(), kind: catDraft.kind }).eq("id", catEditId);
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
  async function unlinkEntryInvoice(x) {
    if (!live) return;
    if (!window.confirm("Unlink this deposit from its invoice? The invoice payment is removed.")) return;
    if (x.paymentId) await supabase.from("ledger_payments").delete().eq("id", x.paymentId);
    await supabase.from("ledger_entries").update({ invoice_id: null, payment_id: null }).eq("id", x.id);
    setReloadTick(t => t + 1);
  }

  // Card payment = a TRANSFER (checking down, card down), NOT an expense.
  // Records two entries tagged "Card payment" so reports exclude them from income/expense.
  async function recordCardPayment() {
    const cents = Math.round((parseFloat(payDraft.amount) || 0) * 100);
    if (!cents || !payDraft.fromId || !payDraft.toId) return;
    const fromName = accountList.find(a => a.id === payDraft.fromId)?.name || "checking";
    const toName = accountList.find(a => a.id === payDraft.toId)?.name || "card";
    const date = payDraft.date;
    setShowPayCard(false);
    setPayDraft(blankPay);
    if (live && liveOrgId) {
      const base = { org_id: liveOrgId, user_id: session.user.id, entry_date: date, amount_cents: cents, category: "Card payment", match_status: "noted" };
      await supabase.from("ledger_entries").insert([
        { ...base, direction: "out", account_id: payDraft.fromId, description: `Payment to ${toName}` },
        { ...base, direction: "in", account_id: payDraft.toId, description: `Payment from ${fromName}` },
      ]);
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
      await supabase.from("ledger_entries").insert({
        org_id: liveOrgId, user_id: session.user.id,
        entry_date: draft.date, amount_cents: cents, direction: draft.direction,
        description: draft.payee.trim(), account_id: draft.accountId || null,
        match_status: null,
      });
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
    if (!window.confirm("Delete this line? It's removed from the notebook for good.")) return;
    setItems(prev => prev.filter(it => it.id !== id));
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
    if (!src.name.trim() || !liveOrgId) return;
    const row = table === "ledger_customers"
      ? { name: src.name.trim(), company: (src.company || "").trim() || null, email: (src.email || "").trim() || null, phone: (src.phone || "").trim() || null, billing_address: (src.billing_address || "").trim() || null, tax_status: src.tax_status || null, notes: (src.notes || "").trim() || null }
      : { name: src.name.trim(), email: (src.email || "").trim() || null, phone: (src.phone || "").trim() || null, billing_address: (src.billing_address || "").trim() || null };
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
      await supabase.from("invoices").insert({
        org_id: liveOrgId, user_id: session.user.id, invoice_number: String(num),
        customer_name: draft.customer.trim(), customer_email: draft.email.trim() || null,
        line_items: lines.map(l => ({ desc: l.desc.trim(), qty: parseInt(l.qty) || 1, price: parseFloat(l.price) || 0 })),
        tax_status: draft.taxStatus, subtotal_cents: subtotal, tax_cents: tax, total_cents: total, status: "draft",
      });
      await supabase.from("ledger_orgs").update({ next_invoice_number: num + 1 }).eq("id", liveOrgId);
      setReloadTick(t => t + 1);
    } else {
      setInvoices(prev => [{ id: "inv-" + prev.length, customer: draft.customer, item: lines.map(l => l.desc).join(", "), amount: total / 100, tax: draft.taxStatus, taxAmt: tax / 100, status: "Draft", date: "today" }, ...prev]);
    }
  }

  async function invoiceStatus(id, status) {
    setInvoices(prev => prev.map(v => (v.id === id ? { ...v, status: status.charAt(0).toUpperCase() + status.slice(1) } : v)));
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
    const newPaid = (inv.paidCents || 0) + cents;
    const totalCents = Math.round((inv.amount || 0) * 100);
    if (totalCents > 0 && newPaid >= totalCents) {
      await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", inv.id);
    }
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

  // One-click send via the send-invoice-email Edge Function (Resend behind it).
  async function emailInvoiceNow() {
    if (!sentLink || !sentLink.invoiceId) return;
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
        setEmailState({ ok: data && data.to ? data.to : sentLink.email });
        setReloadTick(t => t + 1);
      }
    } catch (e) {
      setEmailState({ err: String(e) });
    }
  }

  async function sendCampaign() {
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

  async function createOrder() {
    const lines = orderDraft.lines.filter(l => (l.desc || "").trim() || (l.item || "").trim());
    if (!orderDraft.customer.trim() || lines.length === 0) return;
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
      const known = (entity.customers || []).some(c => (c.name || "").toLowerCase() === draft.customer.trim().toLowerCase());
      if (!known && draft.customer.trim()) {
        await supabase.from("ledger_customers").insert({ org_id: liveOrgId, user_id: session.user.id, name: draft.customer.trim(), email: draft.email.trim() || null });
      }
      const row = {
        doc_type: asPo ? "order" : "invoice", status: asPo ? "order" : "draft",
        customer_name: draft.customer.trim(), customer_email: draft.email.trim() || null,
        vendor_name: asPo ? (draft.vendor.trim() || null) : null, po_number: asPo ? String(po) : null,
        line_items: lines.map(l => ({ item: (l.item || "").trim(), desc: (l.desc || "").trim(), qty: parseInt(l.qty) || 1, cost: parseFloat(l.cost) || 0, price: parseFloat(l.price) || 0 })),
        tax_status: draft.taxStatus, subtotal_cents: subtotal, tax_cents: tax, total_cents: total,
      };
      if (editing) {
        await supabase.from("invoices").update(row).eq("id", editing.id);
      } else {
        const insertRow = { org_id: liveOrgId, user_id: session.user.id, ...row };
        if (!asPo) insertRow.invoice_number = String(entity.nextInvoiceNumber || 1001);
        await supabase.from("invoices").insert(insertRow);
        if (asPo) await supabase.from("ledger_orgs").update({ next_po_number: po + 1 }).eq("id", liveOrgId);
        else await supabase.from("ledger_orgs").update({ next_invoice_number: (entity.nextInvoiceNumber || 1001) + 1 }).eq("id", liveOrgId);
      }
      setReloadTick(t => t + 1);
    }
    if (!asPo) setSection("invoices");
  }

  function editOrder(v) {
    setEditingOrder(v);
    setOrderDraft({
      mode: v.poNumber ? "po" : "invoice",
      customer: v.customer === "—" ? "" : v.customer, vendor: v.vendor || "", email: v.email || "",
      taxStatus: v.tax || "Exempt",
      lines: (v.lines && v.lines.length ? v.lines : [{}]).map(l => ({
        item: l.item || "", desc: l.desc || "", qty: String(l.qty || 1),
        cost: l.cost ? String(l.cost) : "", price: l.price ? String(l.price) : "",
      })),
    });
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
      const patch = { doc_type: "invoice", status: "draft" };
      if (!v.number) {
        const num = entity.nextInvoiceNumber || 1001;
        patch.invoice_number = String(num);
        await supabase.from("ledger_orgs").update({ next_invoice_number: num + 1 }).eq("id", liveOrgId);
      }
      await supabase.from("invoices").update(patch).eq("id", v.id);
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
  async function confirmCheck() {
    const cf = checkFor;
    if (!cf) return;
    const checks = cf.checks || [cf._bills ? { ...cf } : cf];
    const start = parseInt(checkStartNum, 10) || entity.nextCheckNumber || 1001;
    const acct = accountList.find(a => a.id === checkAcctId);
    window.print();
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
          reference: "Check #" + num, match_status: "noted",
        });
      }
      await supabase.from("ledger_orgs").update({ next_check_number: start + checks.length }).eq("id", liveOrgId);
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
  const visibleItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "date-asc") return (a.dateISO || "").localeCompare(b.dateISO || "");
    if (sortBy === "vendor") return (a.payee || "").localeCompare(b.payee || "");
    if (sortBy === "account") return (a.source || "~").localeCompare(b.source || "~") || (b.dateISO || "").localeCompare(a.dateISO || "");
    return (b.dateISO || "").localeCompare(a.dateISO || ""); // date-desc (default)
  });

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
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{entity.currentUser ? `${entity.currentUser}'s notebook` : "Notebook"}</div>
              <div style={{ fontSize: 13, color: N.muted }}>Today — {entity.today}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: N.white, border: "1px solid " + N.rule, borderRadius: 100, padding: "7px 12px" }}>
              <span style={{ color: N.muted, display: "flex" }}><Ico name="search" size={15} /></span>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Look up any day, payee, amount"
                style={{ border: "none", outline: "none", fontSize: 13, fontFamily: "'Figtree', sans-serif", width: 200, color: N.text }} />
            </div>
          </div>
          {/* Row 2 — controls */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
            <button onClick={() => { setShowAddLine(s => !s); setShowPayCard(false); setAddedCount(0); setTimeout(() => payeeRef.current && payeeRef.current.focus(), 40); }} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>{showAddLine ? "Close" : "+ Add a line"}</button>
            <button onClick={() => { setShowPayCard(s => !s); setShowAddLine(false); }} style={btnPaper(N.blue)}>{showPayCard ? "Close" : "Pay a card"}</button>
            <select value={acctFilter} onChange={e => setAcctFilter(e.target.value)} title="Show only one account" style={{ ...inputSt, padding: "8px 10px", fontSize: 12, fontWeight: acctFilter ? 700 : 400, color: acctFilter ? N.blueDark : N.text, borderColor: acctFilter ? N.blue : N.rule }}>
              <option value="">All accounts</option>
              {accountList.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
            <button onClick={() => { if (!acctFilter) { window.alert("Pick one account in the dropdown to the left, then Reconcile."); return; } setReconChecked({}); setReconOpen(true); }} title="Reconcile the selected account against its statement" style={{ ...btnBlue, background: acctFilter ? N.green : N.mutedLite, fontSize: 13, padding: "9px 16px", cursor: acctFilter ? "pointer" : "not-allowed" }}>Reconcile{acctFilter ? " " + acctFilter : "…"}</button>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} title="Sort the notebook" style={{ ...inputSt, padding: "8px 10px", fontSize: 12 }}>
              <option value="date-desc">Sort: Date (newest)</option>
              <option value="date-asc">Sort: Date (oldest)</option>
              <option value="vendor">Sort: Vendor (A–Z)</option>
              <option value="account">Sort: Pymt by</option>
            </select>
            {visibleItems.length > 0 && <button onClick={clearAllVisible} title="Mark everything showing as documented" style={btnPaper(N.pinkDark)}><Ico name="check" size={14} /> Got all {visibleItems.length}{acctFilter ? " here" : ""}</button>}
            <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: N.pinkDark, background: "#eafaf0", border: "1px solid #bff0d3", padding: "7px 12px", borderRadius: 100, whiteSpace: "nowrap" }}>
              {items.length} left to match
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
              <select value={lineDraft.accountId} onChange={e => setLineDraft(d => ({ ...d, accountId: e.target.value }))} style={{ ...inputSt, width: 168 }}>
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
            <div style={{ fontSize: 13, color: N.ink, fontWeight: 600, marginBottom: 8 }}>Record a card payment — this is a transfer, not an expense.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input placeholder="$ amount" value={payDraft.amount} onChange={e => setPayDraft(d => ({ ...d, amount: e.target.value }))} style={{ ...inputSt, width: 110 }} />
              <span style={{ fontSize: 13, color: N.muted }}>from</span>
              <select value={payDraft.fromId} onChange={e => setPayDraft(d => ({ ...d, fromId: e.target.value }))} style={{ ...inputSt, width: 168 }}>
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

          {visibleItems.length === 0 && (
            <div style={{ padding: "26px 0", textAlign: "center", fontFamily: "'Figtree', sans-serif", fontSize: 22, color: "#5a6b52" }}>
              {q ? "Nothing matches that." : "All caught up — every line matched. 🎉"}
            </div>
          )}

          {visibleItems.map((x, i) => {
            const proposed = !!x.cleared;
            const last = i === visibleItems.length - 1;
            const prevSrc = i > 0 ? visibleItems[i - 1].source : null;
            const showHead = sortBy === "account" && x.source !== prevSrc;
            return [
              showHead && <div key={x.id + "-hdr"} style={{ margin: "18px 0 2px", padding: "5px 2px", borderBottom: "2px solid #b8c7ab", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em", color: "#4a6a9a", fontWeight: 700 }}>{(x.source && x.source !== "—" ? x.source : "— not assigned to an account —").toUpperCase()}</div>,
              <div key={x.id} style={{ borderBottom: last ? "none" : "1px solid #cfdcc4", background: proposed ? "#e2edf7" : "transparent", marginLeft: proposed ? -8 : 0, paddingLeft: proposed ? 8 : 0, borderRadius: proposed ? 6 : 0 }}>
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
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100, border: "1px solid #bff0d3", background: "#eafaf0", color: N.pinkDark }}>
                                ✓ {linkedInv ? `Inv #${linkedInv.number || "?"} · ${linkedInv.customer}` : "Applied"}
                                <button onClick={() => unlinkEntryInvoice(x)} title="Unlink" style={{ border: "none", background: "none", cursor: "pointer", color: N.mutedLite, fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
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
                  {/* ACTIONS — clear + edit/delete stacked */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {proposed ? (
                      <button onClick={() => clearOne(x.id, "confirmed cleared")} style={{ ...btnBlue, fontSize: 12, padding: "6px 10px" }}><Ico name="check" size={13} /> Cleared</button>
                    ) : x.direction === "in" ? (
                      <button onClick={() => clearOne(x.id, "deposit cleared")} style={{ ...btnPaper(N.muted), fontSize: 12, padding: "6px 10px" }}><Ico name="check" size={13} /> Cleared</button>
                    ) : (
                      <button onClick={() => clearOne(x.id, "has it")} title="Have a bill/receipt, or none needed" style={{ ...btnPaper(N.muted), fontSize: 12, padding: "6px 10px" }}><Ico name="check" size={13} /> Got it</button>
                    )}
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
          <div style={{ fontSize: 12, color: N.muted }}>Matched lines move to Cleared — nothing is ever lost.</div>
          <button onClick={() => setShowCleared(s => !s)} style={{ background: "none", border: "none", color: N.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
            {showCleared ? "Hide" : "See"} cleared items ({cleared.length}) →
          </button>
        </div>

        {showCleared && (
          <div style={{ marginTop: 10, background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: "8px 14px" }}>
            {cleared.length === 0 && <div style={{ fontSize: 13, color: N.muted, padding: "10px 0" }}>Nothing cleared yet — match a line above and it lands here.</div>}
            {cleared.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid " + N.rule }}>
                <span style={{ color: AMBER, display: "flex" }}><Ico name="check" size={16} /></span>
                <div style={{ flex: 1, fontSize: 14, color: N.text }}>{c.payee}</div>
                <div style={{ fontSize: 12, color: N.muted }}>{c.how}</div>
                <div style={{ fontSize: 14, color: c.direction === "in" ? N.green : N.text, fontWeight: 600 }}>{c.direction === "in" ? "+" + money(c.amount) : money(-c.amount)}</div>
              </div>
            ))}
          </div>
        )}

        {reconOpen && acctFilter && (() => {
          const acct = accountList.find(a => a.name === acctFilter);
          const acctId = acct ? acct.id : null;
          const rawA = (entity.rawAccounts || []).find(a => a.id === acctId);
          const opening = rawA ? (rawA.opening_balance_cents || 0) : 0;
          const all = (entity.rawEntries || []).filter(e => e.account_id === acctId);
          const reconciledSum = all.filter(e => e.match_status === "reconciled").reduce((s, e) => s + (e.direction === "in" ? e.amount_cents : -e.amount_cents), 0);
          const beginning = opening + reconciledSum;
          const unrec = all.filter(e => e.match_status !== "reconciled").sort((a, b) => (a.entry_date || "").localeCompare(b.entry_date || ""));
          const moneyIn = unrec.filter(e => e.direction === "in");
          const moneyOut = unrec.filter(e => e.direction !== "in");
          const checkedSum = unrec.filter(e => reconChecked[e.id]).reduce((s, e) => s + (e.direction === "in" ? e.amount_cents : -e.amount_cents), 0);
          const clearedBal = beginning + checkedSum;
          const stmt = reconTarget === "" ? null : Math.round((parseFloat(reconTarget) || 0) * 100);
          const diff = stmt == null ? null : (stmt - clearedBal);
          const ok = diff != null && Math.abs(diff) < 1;
          const checkedIds = unrec.filter(e => reconChecked[e.id]).map(e => e.id);
          const toggle = id => setReconChecked(p => ({ ...p, [id]: !p[id] }));
          const shortD = d => { const p = (d || "").split("-"); return p.length === 3 ? `${+p[1]}/${+p[2]}` : d; };
          const Col = ({ title, rows, color }) => (
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
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 21, color: N.ink }}>Reconcile {acctFilter}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: N.muted, flexWrap: "wrap" }}>
                    <span>Statement ending balance</span>
                    <input value={reconTarget} onChange={e => setReconTarget(e.target.value)} placeholder="$ from statement" inputMode="decimal" style={{ ...inputSt, width: 150 }} />
                  </div>
                </div>
                <div style={{ fontSize: 13, color: N.muted, marginBottom: 14 }}>Click each line that's on this statement — it gets an <b style={{ color: N.pinkDark }}>R</b>. When the difference hits <b>$0.00</b>, you're reconciled.</div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                  <Col title="Money in — deposits" rows={moneyIn} color="#3a7d4a" />
                  <Col title="Money out — checks & payments" rows={moneyOut} color={N.red} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, background: ok ? "#eafaf0" : "#f7fafd", border: "1px solid " + (ok ? "#bff0d3" : N.rule), borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ fontSize: 13, color: N.muted }}>Beginning <b style={{ color: N.ink }}>{money(beginning / 100)}</b> + {checkedIds.length} checked = <b style={{ color: N.ink }}>{money(clearedBal / 100)}</b>{diff != null && (ok ? <b style={{ color: N.pinkDark, marginLeft: 10 }}>✓ Reconciled — difference $0.00</b> : <span style={{ marginLeft: 10, color: "#8a5a00" }}>Difference <b>{money(diff / 100)}</b></span>)}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setReconOpen(false)} style={btnPaper(N.muted)}>Close</button>
                    <button onClick={() => finishReconcile(checkedIds)} disabled={checkedIds.length === 0} style={{ ...btnBlue, background: checkedIds.length ? N.blue : N.mutedLite }}>Reconcile {checkedIds.length} &amp; lock</button>
                  </div>
                </div>
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
          <button onClick={() => setShowInvForm(s => !s)} style={{ ...btnBlue, fontSize: 14, padding: "10px 18px", background: N.blue, boxShadow: "0 4px 14px rgba(0,128,255,0.4)" }}>{showInvForm ? "Close" : "+ New invoice"}</button>
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
                Subtotal {money(sub)}{invDraft.taxStatus === "Taxable" ? ` · MN tax (9.25%) ${money(tax)}` : ""} · <b style={{ color: N.ink }}>Total {money(sub + tax)}</b>
              </div>
              <button onClick={createInvoice} style={{ ...btnBlue, background: N.blue, fontSize: 14, padding: "10px 18px" }}>Save invoice</button>
            </div>
          </div>
        )}

        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
          {invoices.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: N.muted, fontSize: 14 }}>No invoices yet. Click “New invoice” to make the first one.</div>
          ) : invoices.filter(v => v.docType !== "order").sort((a, b) => ((a.status === "Void" ? 2 : a.status === "Paid" ? 1 : 0) - (b.status === "Void" ? 2 : b.status === "Paid" ? 1 : 0)) || (a.customer || "").localeCompare(b.customer || "")).map((v, i) => {
            const voided = v.status === "Void";
            return (
            <div key={v.id} onClick={() => setOpenInv(v)} title="Open invoice"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i === invoices.length - 1 ? "none" : "1px solid " + N.rule, cursor: "pointer", opacity: voided ? 0.55 : 1 }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f7fafd")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div style={{ width: 50, fontSize: 12, color: N.muted }}>{v.date}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, color: N.ink, fontWeight: 600, textDecoration: voided ? "line-through" : "none" }}>{v.number ? <span style={{ color: N.blue, fontFamily: "'DM Mono', monospace", fontSize: 13, marginRight: 7 }}>#{v.number}</span> : null}{v.customer}</div>
                <div style={{ fontSize: 12, color: N.muted }}>{v.item} · {v.tax}{v.taxAmt ? ` · MN tax ${money(v.taxAmt)}` : ""}{v.paidCents > 0 && v.balanceCents > 0 ? <span style={{ color: "#a16207" }}> · paid {money(v.paid)}, balance {money(v.balance)}</span> : ""}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: STATUS_COLOR[v.status] || N.muted, background: (STATUS_COLOR[v.status] || N.muted) + "18", padding: "4px 10px", borderRadius: 100 }}>{v.status}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {v.status === "Draft" && <button onClick={e => { e.stopPropagation(); invoiceStatus(v.id, "sent"); }} style={btnPaper(N.blue)}>Send</button>}
                {(v.status === "Sent" || v.status === "Viewed") && <button onClick={e => { e.stopPropagation(); invoiceStatus(v.id, "draft"); }} style={btnPaper(N.muted)}>← Draft</button>}
                {v.status !== "Paid" && !voided && <button onClick={e => { e.stopPropagation(); quickMarkPaid(v); }} style={btnPaper(N.pinkDark)}>Mark paid</button>}
                {v.status !== "Paid" && !voided && <button onClick={e => { e.stopPropagation(); openPayment(v); }} style={btnPaper(N.muted)}>Payment…</button>}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: voided ? N.mutedLite : N.ink, width: 90, textAlign: "right", textDecoration: voided ? "line-through" : "none" }}>{money(v.amount)}</div>
            </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: N.muted, marginTop: 10 }}>Click any invoice to open it. Paid by check? Just hit <b style={{ color: N.pinkDark }}>Mark paid</b>. Sent invoices show <b style={{ color: N.blue }}>Viewed</b> when the customer opens them — the status QuickBooks took away.</div>

        {openInv && (() => {
          const invLines = openInv.lines && openInv.lines.length ? openInv.lines : [{ desc: openInv.item, qty: 1, price: openInv.subtotal || openInv.amount }];
          const cleanDesc = d => (/^QuickBooks invoice #/.test(d || "") ? "Signs & graphics" : d);
          const taxLabel = openInv.tax === "Taxable" ? "Taxable" : openInv.tax === "Shipped" ? "Shipped out of state — no sales tax" : "Tax-exempt (reseller)";
          const bc = (entity.customers || []).find(c => (c.name || "").toLowerCase() === (openInv.customer || "").toLowerCase()) || {};
          const brand = entity.brandColor || N.blue;
          const logo = entity.logoUrl;
          const isPo = openInv.docType === "order";
          const rateOf = l => (isPo ? (l.cost || 0) : (l.price || 0));
          const docSub = invLines.reduce((s, l) => s + rateOf(l) * (l.qty || 1), 0);
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
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, letterSpacing: "0.16em", color: brand, fontWeight: 500 }}>{isPo ? "PURCHASE ORDER" : "INVOICE"}</div>
                    {isPo ? (openInv.poNumber && <div style={{ fontSize: 13, color: N.ink, marginTop: 5 }}>PO #{openInv.poNumber}</div>) : (openInv.number && <div style={{ fontSize: 13, color: N.ink, marginTop: 5 }}>No. {openInv.number}</div>)}
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
                      <div style={{ fontSize: 12, color: N.mutedLite, marginTop: 4 }}>For customer: {openInv.customer}</div>
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
                    <div style={{ fontSize: 15, fontWeight: 600, color: N.ink }}>{openInv.customer}</div>
                    {bc.billing_address ? <div style={{ fontSize: 13, color: N.muted, whiteSpace: "pre-line" }}>{bc.billing_address}</div> : <div style={{ fontSize: 12, color: N.mutedLite, fontStyle: "italic" }}>Same as billing</div>}
                  </div>
                </div>
                )}

                <div style={{ border: "1px solid " + N.rule, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 46px 86px 92px", gap: 8, padding: "10px 14px", background: "#f7fafd", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted }}>
                    <span>DESCRIPTION</span><span style={{ textAlign: "center" }}>QTY</span><span style={{ textAlign: "right" }}>RATE</span><span style={{ textAlign: "right" }}>AMOUNT</span>
                  </div>
                  {invLines.map((l, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 46px 86px 92px", gap: 8, padding: "11px 14px", borderTop: "1px solid " + N.rule, fontSize: 14, color: N.text }}>
                      <span>{cleanDesc(l.desc)}{isPo && l.item ? <span style={{ color: N.mutedLite }}> · {l.item}</span> : null}</span>
                      <span style={{ textAlign: "center", color: N.muted }}>{l.qty || 1}</span>
                      <span style={{ textAlign: "right", color: N.muted }}>{money(rateOf(l))}</span>
                      <span style={{ textAlign: "right", fontWeight: 500, color: N.ink }}>{money(rateOf(l) * (l.qty || 1))}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
                </div>

                {isPo ? (
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
                )}
              </div>

              <div className="no-print" style={{ padding: "14px 22px", borderTop: "1px solid " + N.rule, background: "#f7fafd", display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ marginRight: "auto", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: STATUS_COLOR[openInv.status] || N.muted }}>{openInv.status}</span>
                <button onClick={() => window.print()} style={btnPaper(N.text)}>Print</button>
                {isPo ? (
                  <>
                    <button onClick={() => { const v = openInv; setOpenInv(null); editOrder(v); }} style={btnPaper(N.muted)}>Edit</button>
                    <button onClick={() => { const v = openInv; setOpenInv(null); convertToInvoice(v); }} style={{ ...btnBlue, background: N.blue }}>Convert to invoice →</button>
                    <button onClick={() => { const id = openInv.id; setOpenInv(null); deleteOrder(id); }} style={btnPaper(N.pinkDark)}>Delete</button>
                  </>
                ) : (
                  <>
                    {openInv.status !== "Void" && <button onClick={() => sendInvoice(openInv)} style={{ ...btnBlue, background: N.blue }}>{openInv.status === "Draft" ? "Send · get link" : "Copy / resend link"}</button>}
                    {openInv.status !== "Paid" && openInv.status !== "Void" && <button onClick={() => quickMarkPaid(openInv)} style={{ ...btnBlue, background: N.pinkDark }}>Mark paid</button>}
                    {openInv.status !== "Paid" && openInv.status !== "Void" && <button onClick={() => openPayment(openInv)} style={btnPaper(N.pinkDark)}>Partial / check…</button>}
                    {openInv.status === "Paid" && (openInv.payments || []).length === 0 && <button onClick={() => { invoiceStatus(openInv.id, "sent"); setOpenInv(null); }} style={btnPaper(N.muted)}>Unmark paid</button>}
                    {(openInv.status === "Sent" || openInv.status === "Viewed") && <button onClick={() => { invoiceStatus(openInv.id, "draft"); setOpenInv(null); }} style={btnPaper(N.muted)}>← Back to draft</button>}
                    {openInv.status !== "Void" && <button onClick={() => voidInvoice(openInv)} style={btnPaper(N.muted)}>Void</button>}
                    <button onClick={() => deleteInvoice(openInv)} style={btnPaper(N.pinkDark)}>Delete</button>
                  </>
                )}
                <button onClick={() => setOpenInv(null)} style={btnPaper(N.muted)}>Close</button>
              </div>
            </div>
          </div>
          );
        })()}

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

              <div style={{ fontSize: 12, color: N.muted, marginBottom: 8 }}>…or copy the link and send it yourself:</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, marginBottom: 3 }}>INVOICE LINK</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input readOnly value={sentLink.url} onFocus={e => e.target.select()} style={{ ...inputSt, fontSize: 13 }} />
                <button onClick={() => { try { navigator.clipboard.writeText(sentLink.url); } catch (e) {} }} style={{ ...btnBlue, background: N.blue }}>Copy</button>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, marginBottom: 3 }}>READY-TO-PASTE EMAIL</div>
              <textarea readOnly value={sentLink.emailText} rows={6} onFocus={e => e.target.select()} style={{ ...inputSt, fontSize: 13, lineHeight: 1.5, resize: "vertical", marginBottom: 14 }} />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => { try { navigator.clipboard.writeText(sentLink.emailText); } catch (e) {} }} style={btnPaper(N.blue)}>Copy email</button>
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
    const orderList = invoices.filter(v => v.docType === "order");
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
            <div style={{ fontSize: 13, color: N.muted }}>Take an order and invoice it directly — or, if a vendor makes it, send a PO first and convert it later.</div>
          </div>
          <button onClick={() => { if (showOrderForm) { setShowOrderForm(false); setEditingOrder(null); setOrderDraft(blankOrder); } else { setShowOrderForm(true); } }} style={{ ...btnBlue, background: N.blue, fontSize: 14, padding: "10px 18px" }}>{showOrderForm ? "Close" : "+ New order"}</button>
        </div>

        {showOrderForm && (
          <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <datalist id="po-customers">{(entity.customers || []).map(c => <option key={c.id} value={c.name} />)}</datalist>
            <datalist id="po-vendors">{(entity.vendors || []).map(v => <option key={v} value={v} />)}</datalist>
            <datalist id="po-items">{(entity.products || []).filter(p => !p.archived).map(p => <option key={p.id} value={p.name} />)}</datalist>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {[["invoice", "Invoice only"], ["po", "Send a PO to a vendor first"]].map(([m, label]) => (
                <button key={m} onClick={() => setOrderDraft(d => ({ ...d, mode: m }))} style={{ fontSize: 12.5, padding: "7px 14px", borderRadius: 100, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontWeight: 500, border: "1px solid " + (orderDraft.mode === m ? N.blue : N.rule), background: orderDraft.mode === m ? N.blue : N.white, color: orderDraft.mode === m ? N.white : N.text }}>{label}</button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: orderDraft.mode === "po" ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 12 }}>
              <div style={{ position: "relative" }}>
                <input placeholder="Customer" list="po-customers" value={orderDraft.customer} onChange={e => { const val = e.target.value; const c = (entity.customers || []).find(x => x.name === val); setOrderDraft(d => ({ ...d, customer: val, email: c && c.email ? c.email : d.email })); }} style={{ ...inputSt, paddingRight: 26 }} />
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: N.muted, fontSize: 10 }}>▼</span>
              </div>
              {orderDraft.mode === "po" && (
              <div style={{ position: "relative" }}>
                <input placeholder="Vendor who makes it" list="po-vendors" value={orderDraft.vendor} onChange={e => setOrderDraft(d => ({ ...d, vendor: e.target.value }))} style={{ ...inputSt, paddingRight: 26 }} />
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: N.muted, fontSize: 10 }}>▼</span>
              </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8, marginBottom: 4, fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", color: N.muted }}>
              <span>ITEM</span><span>DESCRIPTION (for reorders)</span><span style={{ textAlign: "center" }}>QTY</span>
              {poMode && <span style={{ textAlign: "right", color: N.blueDark }}>COST → PO</span>}
              <span style={{ textAlign: "right", color: poMode ? "#5a7a63" : N.muted }}>{poMode ? "PRICE → INVOICE" : "PRICE EACH"}</span>
              <span></span>
            </div>
            {orderDraft.lines.map((l, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: cols, gap: 8, marginBottom: 8, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <input placeholder="Item" list="po-items" value={l.item || ""} onChange={e => setLine(i, { item: e.target.value })} style={{ ...inputSt, paddingRight: 18 }} />
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
              <button onClick={createOrder} style={{ ...btnBlue, background: N.blue, fontSize: 14, padding: "10px 18px" }}>{editingOrder ? "Update order" : (poMode ? "Save order · send PO" : "Save as invoice →")}</button>
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
                <div style={{ fontSize: 15, color: N.ink, fontWeight: 600 }}>{v.customer}</div>
                <div style={{ fontSize: 12, color: N.muted }}>{v.item}{v.vendor ? ` · vendor: ${v.vendor}` : ""}</div>
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
              <button onClick={() => editOrder(v)} style={btnPaper(N.muted)}>Edit</button>
              <button onClick={() => setOpenInv(v)} style={btnPaper(N.text)}>View / print</button>
              <button onClick={() => convertToInvoice(v)} style={{ ...btnBlue, background: N.blue }}>Convert to invoice →</button>
              <button onClick={() => deleteOrder(v.id)} title="Delete order" style={{ border: "1px solid " + N.rule, background: "none", color: N.muted, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, borderRadius: 100, padding: "6px 12px" }}>Delete</button>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: N.muted, marginTop: 10 }}>An order holds the full spec so it can be reordered. Send the PO to your vendor; when it's made, hit <b style={{ color: N.blue }}>Convert to invoice</b> to bill the customer.</div>
      </div>
    );
  }

  function Bills() {
    const bills = entity.bills || [];
    const unpaid = bills.filter(b => b.status !== "paid");
    const owed = unpaid.reduce((s, b) => s + (b.amount_cents || 0), 0);
    const selBills = unpaid.filter(b => selectedBills[b.id]);
    const selTotal = selBills.reduce((s, b) => s + (b.amount_cents || 0), 0);
    const toggleBill = id => setSelectedBills(p => ({ ...p, [id]: !p[id] }));
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Bills</div>
            <div style={{ fontSize: 13, color: N.muted }}>What you owe vendors. {unpaid.length} unpaid · {money(owed / 100)} outstanding.</div>
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
          {bills.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: N.muted, fontSize: 14 }}>No bills yet. Record what you owe a vendor, then mark it paid (or pay it by check).</div>
          ) : bills.map((b, i) => {
            const paid = b.status === "paid";
            return (
              <div key={b.id} onClick={() => { setOpenBill(b); setBillEdit(null); }} title="Open bill"
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: i === bills.length - 1 ? "none" : "1px solid " + N.rule, opacity: paid ? 0.6 : 1, cursor: "pointer", background: selectedBills[b.id] ? "#eef6ff" : "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = selectedBills[b.id] ? "#e3eefc" : "#f7fafd")}
                onMouseLeave={e => (e.currentTarget.style.background = selectedBills[b.id] ? "#eef6ff" : "transparent")}>
                {!paid ? <input type="checkbox" checked={!!selectedBills[b.id]} onClick={e => e.stopPropagation()} onChange={() => toggleBill(b.id)} title="Select to pay with one check" style={{ width: 16, height: 16, cursor: "pointer", accentColor: N.blue }} /> : <span style={{ width: 16 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: N.ink }}>{b.vendor_name || "—"}</div>
                  <div style={{ fontSize: 12, color: N.muted }}>{b.category || "Uncategorized"}{b.due_date ? ` · due ${b.due_date}` : ""}{b.memo ? ` · ${b.memo}` : ""}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: paid ? N.green : N.red, background: (paid ? N.green : N.red) + "18", padding: "4px 10px", borderRadius: 100 }}>{paid ? "Paid" : "Unpaid"}</span>
                {!paid && <button onClick={e => { e.stopPropagation(); payBillByCheck(b); }} style={btnPaper(N.text)}>Pay by check</button>}
                <button onClick={e => { e.stopPropagation(); markBillPaid(b.id, !paid); }} style={btnPaper(paid ? N.muted : N.pinkDark)}>{paid ? "Unmark" : "Mark paid"}</button>
                <div style={{ fontSize: 16, fontWeight: 600, color: N.ink, width: 90, textAlign: "right" }}>{money((b.amount_cents || 0) / 100)}</div>
              </div>
            );
          })}
        </div>

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
            const Stub = ({ label }) => (
              <div style={{ height: "3.2in", padding: "0.3in 0.7in", boxSizing: "border-box", borderTop: "1px dashed #999", fontFamily: "'Figtree', sans-serif", color: "#000" }}>
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
              <div className="check-page" style={{ width: "8.5in", height: "10in", background: N.white, position: "relative", margin: "0 auto 18px", boxShadow: "0 12px 34px rgba(10,10,20,0.3)", boxSizing: "border-box", overflow: "hidden" }}>
                {/* on-screen guide only — the check area of the pre-printed stock */}
                <div className="no-print" style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3.5in", borderBottom: "1px dashed #cbd5e1", background: "#fbfdff" }}>
                  <div style={{ position: "absolute", top: 4, left: 6, fontSize: 9, color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>PRE-PRINTED CHECK #{num} — only these fields print</div>
                </div>
                {/* fill-in fields (these print) */}
                <div style={at(0.95, 6.35)}>{today}</div>
                <div style={{ ...at(1.42, 6.8), fontWeight: 700 }}>{amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div style={{ ...at(1.30, 0.95), fontSize: "12pt", fontWeight: 600 }}>{ck.vendor_name}</div>
                {/* written amount: words, then a run of ***** filling the line, ending in DOLLARS under/right of the numeric box */}
                <div style={{ ...at(1.58, 0.18), width: `calc(6.95in - ${OX}in)`, display: "flex", alignItems: "baseline", gap: "6px", overflow: "hidden" }}>
                  <span>{amountToWords(amt)}</span>
                  <span style={{ flex: 1, overflow: "hidden", letterSpacing: "1.5px", whiteSpace: "nowrap" }}>{"*".repeat(200)}</span>
                  <span style={{ fontWeight: 700 }}>DOLLARS</span>
                </div>
                {vd.billing_address ? <div style={{ ...at(1.92, 0.95), whiteSpace: "pre-line", fontSize: "10pt", lineHeight: 1.3, maxWidth: "3.4in" }}>{vd.billing_address}</div> : null}
                <div style={at(2.98, 0.6)}>{ck.memo || ck.category || ""}</div>
                {/* flow spacer for the check third, then the two tear-off stubs */}
                <div style={{ height: "3.5in" }} />
                <Stub label="Remittance — send with payment" />
                <Stub label="Your file copy" />
              </div>
            );
          };

          return createPortal(
          <div onClick={() => setCheckFor(null)} className="check-overlay check-portal" style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", zIndex: 220, overflowY: "auto" }}>
            {/* Portaled to <body> so print can hide the (tall) app entirely — that tall body was paginating into blank "extra copies". */}
            <style>{`@media print { @page { size: letter portrait; margin: 0; } html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; } body > *:not(.check-portal) { display: none !important; } .check-overlay { position: static !important; background: #fff !important; padding: 0 !important; overflow: visible !important; } .check-print-root { max-width: none !important; width: 100% !important; margin: 0 !important; } .check-page { box-shadow: none !important; margin: 0 !important; page-break-after: always; break-after: page; } .check-page:last-child { page-break-after: auto; break-after: auto; } .no-print { display: none !important; } }`}</style>
            <div onClick={e => e.stopPropagation()} className="check-print-root" style={{ width: "100%", maxWidth: 780 }}>
              <div className="no-print" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: N.white, borderRadius: 10, padding: "12px 16px", marginBottom: 12, boxShadow: "0 12px 34px rgba(10,10,20,0.3)" }}>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: N.ink }}>{checks.length > 1 ? `${checks.length} checks` : "Check"}</span>
                <span style={{ fontSize: 12, color: N.muted }}>Start&nbsp;#</span>
                <input value={checkStartNum} onChange={e => setCheckStartNum(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" style={{ ...inputSt, width: 74, fontWeight: 700 }} />
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
                <button onClick={confirmCheck} style={{ ...btnBlue, background: N.blue }}>Print{checks.length > 1 ? ` ${checks.length}` : ""} &amp; mark paid</button>
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

  function SalesTax() {
    // Tallied live from invoices: taxable = pre-tax subtotal of taxable invoices;
    // exempt = reseller-exempt + shipped-no-tax sales; collected = MN tax billed.
    const billed = invoices.filter(v => v.docType !== "order" && v.status !== "Void");
    const taxable = billed.filter(v => v.tax === "Taxable").reduce((s, v) => s + (v.amount - v.taxAmt), 0);
    const exempt = billed.filter(v => v.tax !== "Taxable").reduce((s, v) => s + v.amount, 0);
    const collected = billed.reduce((s, v) => s + v.taxAmt, 0);
    const quarter = entity.salesTax?.quarter || "From your invoices";
    return (
      <div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 4 }}>Sales tax</div>
        <div style={{ fontSize: 13, color: N.muted, marginBottom: 16 }}>Minnesota · quarterly · {quarter}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
          {[["Taxable sales", money(taxable), N.ink], ["Tax-exempt sales", money(exempt), N.ink], ["Tax collected", money(collected), N.pinkDark]].map(([l, v, c]) => (
            <div key={l} style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: N.muted, letterSpacing: "0.04em", marginBottom: 6 }}>{l.toUpperCase()}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: c }}>{v}</div>
            </div>
          ))}
        </div>
        <button style={{ ...btnBlue, background: N.blue, fontSize: 14, padding: "11px 18px", boxShadow: "0 4px 14px rgba(0,128,255,0.4)" }}>Print Betty's filing report →</button>
        <div style={{ fontSize: 12, color: N.muted, marginTop: 10 }}>Every taxable / shipped / exempt line is tallied automatically. The printout will match your MN return line-for-line.</div>
      </div>
    );
  }

  function Reports() {
    return (
      <div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 4 }}>Year-end for Gary</div>
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
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: N.ink }}>{a.name}{a.last_four && <span style={{ color: N.muted, fontWeight: 400 }}> ••{a.last_four}</span>}</div>
                          <div style={{ fontSize: 12, color: N.muted }}>{typeLabel(a.account_type)} · opening {money((a.opening_balance_cents || 0) / 100)}</div>
                        </div>
                        <button onClick={() => { setAcctEditId(a.id); setAcctDraft({ name: a.name, account_type: a.account_type, last_four: a.last_four || "", opening: String((a.opening_balance_cents || 0) / 100) }); }} style={{ ...btnPaper(N.muted), padding: "6px 12px" }}>Edit</button>
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

  function ContactList(kind) {
    const isCust = kind === "customer";
    const table = isCust ? "ledger_customers" : "ledger_vendors";
    const rows = ((isCust ? entity.customers : entity.vendorList) || []).slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const title = isCust ? "Customers" : "Vendors";
    const cell = { ...inputSt };
    const startEdit = c => { setContactEditId(c.id); setContactDraft({ name: c.name || "", company: c.company || "", email: c.email || "", phone: c.phone || "", billing_address: c.billing_address || "", tax_status: c.tax_status || "Taxable", notes: c.notes || "" }); };
    const Editor = (src, set, onSave, onCancel, saveLabel) => (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input placeholder="Name" value={src.name} onChange={e => set(d => ({ ...d, name: e.target.value }))} style={cell} />
        {isCust ? <input placeholder="Business name (optional)" value={src.company} onChange={e => set(d => ({ ...d, company: e.target.value }))} style={cell} /> : <div />}
        <input placeholder="Email" value={src.email} onChange={e => set(d => ({ ...d, email: e.target.value }))} style={cell} />
        <input placeholder="Phone" value={src.phone} onChange={e => set(d => ({ ...d, phone: e.target.value }))} style={cell} />
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
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
          <button onClick={onSave} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>{saveLabel}</button>
          {onCancel && <button onClick={onCancel} style={btnPaper(N.muted)}>Cancel</button>}
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
          <button onClick={() => { setShowAddContact(s => !s); setNewContact(blankContact); }} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>{showAddContact ? "Close" : "+ Add " + (isCust ? "customer" : "vendor")}</button>
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
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: N.ink }}>{c.name}{c.company ? <span style={{ color: N.muted, fontWeight: 400 }}> · {c.company}</span> : ""}{isCust && c.tax_status && c.tax_status !== "Taxable" && <span style={{ fontSize: 10, fontWeight: 700, color: N.muted, marginLeft: 6, letterSpacing: "0.04em" }}>{(c.tax_status || "").toUpperCase()}</span>}</div>
                    <div style={{ fontSize: 12, color: N.muted }}>{[c.email, c.phone].filter(Boolean).join(" · ") || <span style={{ color: N.mutedLite, fontStyle: "italic" }}>no email or phone yet</span>}</div>
                    {c.billing_address ? <div style={{ fontSize: 12, color: N.muted, whiteSpace: "pre-line", marginTop: 2 }}>{c.billing_address}</div> : null}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => startEdit(c)} style={{ ...btnPaper(N.muted), padding: "6px 12px" }}>Edit</button>
                    <button onClick={() => deleteContact(table, c.id, c.name)} style={{ background: "none", border: "1px solid " + N.rule, borderRadius: 100, cursor: "pointer", color: N.pinkDark, fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, padding: "6px 12px" }}>Remove</button>
                  </div>
                </div>
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
    const income = rows.filter(c => c.kind === "income").sort(byOrder);
    const expense = rows.filter(c => c.kind !== "income").sort(byOrder);
    const cell = { ...inputSt };
    const group = (title, list, color) => (
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color, marginBottom: 6 }}>{title} · {list.length}</div>
        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
          {list.length === 0 && <div style={{ padding: "16px", color: N.muted, fontSize: 13 }}>None yet.</div>}
          {list.map((c, i) => (
            <div key={c.id} style={{ padding: "9px 14px", borderTop: i === 0 ? "none" : "1px solid " + N.rule, display: "flex", alignItems: "center", gap: 8 }}>
              {catEditId === c.id ? (
                <>
                  <input value={catDraft.name} onChange={e => setCatDraft(d => ({ ...d, name: e.target.value }))} style={{ ...cell, flex: 1 }} />
                  <select value={catDraft.kind} onChange={e => setCatDraft(d => ({ ...d, kind: e.target.value }))} style={{ ...cell, width: 130 }}>
                    <option value="income">Income</option><option value="expense">Expense</option>
                  </select>
                  <button onClick={saveChartCat} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "8px 12px" }}>Save</button>
                  <button onClick={() => setCatEditId(null)} style={btnPaper(N.muted)}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 14, color: N.ink }}>{c.name}</span>
                  <button onClick={() => { setCatEditId(c.id); setCatDraft({ name: c.name, kind: c.kind || "expense" }); }} style={{ ...btnPaper(N.muted), padding: "6px 12px" }}>Edit</button>
                  <button onClick={() => archiveChartCat(c.id)} style={{ background: "none", border: "1px solid " + N.rule, borderRadius: 100, cursor: "pointer", color: N.muted, fontFamily: "'Figtree', sans-serif", fontSize: 12, fontWeight: 600, padding: "6px 12px" }}>Remove</button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Chart of accounts</div>
            <div style={{ fontSize: 13, color: N.muted }}>{rows.length} accounts — the income &amp; expense accounts everything categorizes into (pulled from QuickBooks). Add, rename, or remove.</div>
          </div>
          <button onClick={() => { setShowAddCat(s => !s); setNewCat(blankCat); }} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>{showAddCat ? "Close" : "+ Add account"}</button>
        </div>
        {showAddCat && (
          <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 14, marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input placeholder="Account name" value={newCat.name} onChange={e => setNewCat(d => ({ ...d, name: e.target.value }))} style={{ ...cell, flex: 1, minWidth: 200 }} />
            <select value={newCat.kind} onChange={e => setNewCat(d => ({ ...d, kind: e.target.value }))} style={{ ...cell, width: 150 }}>
              <option value="expense">Expense</option><option value="income">Income</option>
            </select>
            <button onClick={addChartCat} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>Save</button>
          </div>
        )}
        {group("Income accounts", income, "#5a7a63")}
        {group("Expense accounts", expense, N.blueDark)}
      </div>
    );
  }

  function Admin() {
    const choices = [
      { key: "customers", label: "Customers", desc: "Who you bill — names, emails, addresses", count: (entity.customers || []).length },
      { key: "vendors", label: "Vendors", desc: "Who you pay — for bills and checks", count: (entity.vendorList || []).length },
      { key: "items", label: "Items & services", desc: "Your product/service list for invoices", count: (entity.products || []).filter(p => !p.archived).length },
      { key: "chart", label: "Chart of accounts", desc: "Every account — banks, cards, income, expenses", count: (entity.rawCategories || []).filter(c => !c.archived).length + (entity.rawAccounts || []).length },
      { key: "cardpayoff", label: "Card payoff plan", desc: "Smartest order to pay down the credit cards" },
      { key: "campaigns", label: "Email campaigns", desc: "Newsletters & blasts to your customers (Constant Contact replacement)" },
      { key: "settings", label: "Settings", desc: "Branding, users, remit, sales-tax rate" },
    ];
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
        {listsTab === "cardpayoff" && CardPayoff()}
        {listsTab === "campaigns" && Campaigns()}
        {listsTab === "chart" && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: N.blueDark, marginBottom: 10 }}>Balance-sheet accounts — banks, cards, loans</div>
            {Accounts()}
            <div style={{ height: 22 }} />
            {Chart()}
          </div>
        )}
        {listsTab === "settings" && <div style={{ background: N.white, border: "1px dashed " + N.rule, borderRadius: 12, padding: "34px 20px", textAlign: "center", color: N.muted, fontSize: 14 }}>Users &amp; roles, logo &amp; branding, remit info, and sales-tax rate — coming here.</div>}
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
    const rows = cards.map(c => { const p = cardPlan[c.name] || {}; return { ...c, apr: (p.apr !== undefined && p.apr !== "") ? parseFloat(p.apr) : null, min: parseFloat(p.min) || 0 }; });
    const anyApr = rows.some(r => r.apr != null);
    const ranked = [...rows].sort((a, b) => anyApr ? ((b.apr || 0) - (a.apr || 0)) : (a.owed - b.owed));
    const method = anyApr ? "highest interest first — the avalanche, saves the most money" : "smallest balance first — the snowball, quick wins that free up a minimum payment";
    const budget = parseFloat(payoffBudget) || 0;
    const totalMin = rows.reduce((s, r) => s + r.min, 0);
    const extra = Math.max(0, budget - totalMin);
    const target = ranked[0];
    const setP = (name, k, v) => setCardPlan(prev => ({ ...prev, [name]: { ...(prev[name] || {}), [k]: v } }));
    const cols = "1fr 110px 84px 96px 96px";
    return (
      <div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 2 }}>Credit-card payoff plan</div>
        <div style={{ fontSize: 13, color: N.muted, marginBottom: 16 }}>Live from your card balances. Add each card's interest rate for the smartest payoff order.</div>
        {cards.length === 0 ? (
          <div style={{ background: N.white, border: "1px dashed " + N.rule, borderRadius: 12, padding: "34px 20px", textAlign: "center", color: N.muted, fontSize: 14 }}>No card balances owed — nothing to pay down. 🎉</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, marginBottom: 14 }}>
              <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: N.muted, letterSpacing: "0.04em" }}>TOTAL CARD DEBT</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: N.red }}>{money(total)}</div>
              </div>
              <div style={{ background: "#eef6ff", border: "1px solid #cfe4ff", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: N.blueDark, fontWeight: 700, letterSpacing: "0.06em" }}>THE PLAN</div>
                <div style={{ fontSize: 14, color: N.text, marginTop: 4, lineHeight: 1.5 }}>Pay at least the minimum on every card, then put every extra dollar on <b>{target.name}</b> ({method}). When it's cleared, roll that whole payment onto the next card down the list — and keep going.</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap", fontSize: 13, color: N.muted }}>
              <span>If you can put</span>
              <input value={payoffBudget} onChange={e => setPayoffBudget(e.target.value)} placeholder="$ / month" inputMode="decimal" style={{ ...inputSt, width: 120 }} />
              <span>toward cards this month{totalMin > 0 ? ` (minimums total ${money(totalMin)})` : ""}{extra > 0 ? <> — that's <b style={{ color: N.blueDark }}>{money(extra)} extra</b>, all to {target.name}.</> : "."}</span>
            </div>

            <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8, padding: "10px 16px", background: "#f7fafd", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", color: N.muted }}>
                <span>CARD</span><span style={{ textAlign: "right" }}>OWED</span><span style={{ textAlign: "right" }}>APR %</span><span style={{ textAlign: "right" }}>MIN PMT</span><span style={{ textAlign: "right" }}>ORDER</span>
              </div>
              {ranked.map((r, i) => (
                <div key={r.name} style={{ display: "grid", gridTemplateColumns: cols, gap: 8, padding: "9px 16px", borderTop: "1px solid " + N.rule, alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: N.ink }}>{r.name}</span>
                  <span style={{ textAlign: "right", fontSize: 14, color: N.red }}>{money(r.owed)}</span>
                  <input value={(cardPlan[r.name] || {}).apr || ""} onChange={e => setP(r.name, "apr", e.target.value)} placeholder="—" inputMode="decimal" style={{ ...inputSt, textAlign: "right", padding: "6px 8px" }} />
                  <input value={(cardPlan[r.name] || {}).min || ""} onChange={e => setP(r.name, "min", e.target.value)} placeholder="$" inputMode="decimal" style={{ ...inputSt, textAlign: "right", padding: "6px 8px" }} />
                  <span style={{ textAlign: "right" }}>{i === 0 ? <span style={{ fontSize: 9.5, fontWeight: 700, color: "#fff", background: N.pinkDark, padding: "3px 8px", borderRadius: 100 }}>PAY FIRST</span> : <span style={{ fontSize: 12, color: N.mutedLite }}>#{i + 1}</span>}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: N.muted, marginTop: 10 }}>Balances come straight from your accounts. Enter APRs to switch from "smallest balance first" to "highest interest first" (saves more money over time). When you pay a card, record it in the notebook as <b>Pay a card</b> — it books a transfer, not an expense.</div>
          </>
        )}
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
  else if (section === "notebook") body = Notebook();
  else if (section === "invoices") body = Invoices();
  else if (section === "orders") body = Orders();
  else if (section === "salestax") body = SalesTax();
  else if (section === "reports") body = Reports();
  else if (section === "admin") body = Admin();
  else if (section === "bills") body = Bills();
  else if (section === "documents") body = <Stub title="Documents" note="Statements, exemption certificates, and anything you attach lives here." />;

  return (
    <div style={{ minHeight: "100vh", background: N.white, fontFamily: "'Figtree', sans-serif", color: N.text }}>
      <link href={FONTS} rel="stylesheet" />
      <style>{`
        input[type="checkbox"] { accent-color: ${AMBER}; }
        @media print {
          body * { visibility: hidden !important; }
          .print-doc, .print-doc * { visibility: visible !important; }
          .print-doc { position: absolute !important; left: 0; top: 0; width: 100% !important; max-width: 100% !important; box-shadow: none !important; border-radius: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: N.white, borderBottom: "1px solid " + N.rule }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            {entity.logoUrl
              ? <img src={entity.logoUrl} alt={entity.name} style={{ height: 38, maxWidth: 260, objectFit: "contain" }} />
              : <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, whiteSpace: "nowrap" }}>{entity.short}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            return (
              <>
                {pill("OPEN INVOICES", ar, N.green, () => setSection("invoices"))}
                {pill("OPEN BILLS", ap, N.blueDark, () => setSection("bills"))}
                <div style={{ width: 1, background: N.rule, margin: "3px 5px" }} />
              </>
            );
          })()}
          {[...entity.accounts.banks, ...entity.accounts.cards, ...entity.accounts.loans].map(a => (
            <div key={a.name} style={{ background: "#f4f7fb", border: "1px solid " + N.rule, borderRadius: 10, padding: "6px 11px", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 10, color: N.muted, letterSpacing: "0.04em" }}>{a.name.toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: N.ink }}>{money(Math.abs(a.balance))}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Body: nav + work area */}
      <div style={{ display: "flex", alignItems: "flex-start", maxWidth: 1180, margin: "0 auto" }}>
        <nav style={{ width: wide ? 58 : 210, flexShrink: 0, padding: "18px 10px", position: "sticky", top: 132 }}>
          {SECTIONS.map(s => {
            const active = section === s.key;
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
              return BUILD_PROGRESS.map(g => {
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
