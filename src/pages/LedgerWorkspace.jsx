// LedgerWorkspace.jsx — the entity-driven bookkeeping workspace.
// NOTHING about the entity is hardcoded: name, users, accounts, and data all
// come from the `entity` object (in production, the entity's data record).
// ProGraphics is just the first tenant — SAMPLE_ENTITY seeds a clickable preview.
//
// Layout mirrors the NLIC org shell: left nav + big work area, blue-dominant neon.
// Betty lands on her stenographer Notebook; Dave lands on Invoices.

import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
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
  { key: "notebook", label: "Notebook" },
  { key: "invoices", label: "Invoices" },
  { key: "bills", label: "Bills" },
  { key: "salestax", label: "Sales tax" },
  { key: "reports", label: "Reports" },
  { key: "documents", label: "Documents" },
  { key: "accounts", label: "Accounts" },
];

const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank / working capital" },
  { value: "credit_card", label: "Credit card" },
  { value: "loan", label: "Loan / mortgage" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

const STATUS_COLOR = {
  Paid: N.green, Viewed: N.blue, Sent: N.blueHot, Draft: N.muted,
};

function money(n) {
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? "−$" : "$") + s;
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
    }));

  const short = org.name.length > 16 ? org.name.split(" ")[0] : org.name;
  return {
    name: org.name,
    short,
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

export default function LedgerWorkspace({ entity: propEntity, entityKey, orgId, session }) {
  const [dbEntity, setDbEntity] = useState(null);
  const entity = dbEntity || propEntity || ENTITIES[entityKey] || SAMPLE_ENTITY;
  const live = !!dbEntity;
  // Accounts available for the "paid with?" picker and card payments. Live has real ids; sample uses names.
  const accountList = entity.accountList || [
    ...(entity.accounts?.banks || []).map(a => ({ id: a.name, name: a.name, type: "bank" })),
    ...(entity.accounts?.cards || []).map(a => ({ id: a.name, name: a.name, type: "credit_card" })),
    ...(entity.accounts?.loans || []).map(a => ({ id: a.name, name: a.name, type: "loan" })),
  ];

  const [section, setSection] = useState(entity.users?.find(u => u.name === entity.currentUser)?.lands || "notebook");
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
  const [sortBy, setSortBy] = useState("date-desc");
  const payeeRef = useRef(null);
  const amountRef = useRef(null);
  const blankAcct = { name: "", account_type: "bank", last_four: "", opening: "" };
  const [acctEditId, setAcctEditId] = useState(null);
  const [acctDraft, setAcctDraft] = useState(blankAcct);
  const [showAddAcct, setShowAddAcct] = useState(false);
  const [newAcct, setNewAcct] = useState(blankAcct);
  const [invoices, setInvoices] = useState(entity.invoices || []);
  const [liveOrgId, setLiveOrgId] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [showInvForm, setShowInvForm] = useState(false);
  const [openInv, setOpenInv] = useState(null);
  const blankInvoice = { customer: "", email: "", taxStatus: "Exempt", lines: [{ desc: "", qty: "1", price: "" }] };
  const [invDraft, setInvDraft] = useState(blankInvoice);

  const latestUpdate = entity.changelog?.[0]?.date || "";
  const MN_TAX_RATE = 0.06875;

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
      const [a, c, e, inv, ven] = await Promise.all([
        supabase.from("ledger_accounts").select("*").eq("org_id", org.id).eq("archived", false).order("created_at", { ascending: true }),
        supabase.from("ledger_categories").select("*").eq("org_id", org.id).eq("archived", false).order("sort_order", { ascending: true }),
        supabase.from("ledger_entries").select("*").eq("org_id", org.id).order("entry_date", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").eq("org_id", org.id).order("issue_date", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("ledger_vendors").select("name").eq("org_id", org.id).eq("archived", false).order("name", { ascending: true }),
      ]);
      if (cancelled) return;
      setLiveOrgId(org.id);
      const built = buildLiveEntity(org, a.data || [], c.data || [], e.data || [], session);
      built.invoices = (inv.data || []).map(mapInvoice);
      built.vendors = (ven.data || []).map(v => v.name);
      built.rawAccounts = a.data || [];
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

  // "Paid with which card?" — set which account a transaction hit.
  function setAccount(id, acctId, acctName) {
    setItems(prev => prev.map(x => (x.id === id ? { ...x, accountId: acctId, source: acctName } : x)));
    setAcctOpen(null);
    if (live) supabase.from("ledger_entries").update({ account_id: acctId }).eq("id", id).then(() => {});
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

  async function createInvoice() {
    const lines = invDraft.lines.filter(l => l.desc.trim());
    if (!invDraft.customer.trim() || lines.length === 0) return;
    const subtotal = lines.reduce((s, l) => s + Math.round((parseFloat(l.price) || 0) * 100) * (parseInt(l.qty) || 1), 0);
    const tax = invDraft.taxStatus === "Taxable" ? Math.round(subtotal * MN_TAX_RATE) : 0;
    const total = subtotal + tax;
    const draft = invDraft;
    setShowInvForm(false);
    setInvDraft(blankInvoice);
    if (live && liveOrgId) {
      await supabase.from("invoices").insert({
        org_id: liveOrgId, user_id: session.user.id,
        customer_name: draft.customer.trim(), customer_email: draft.email.trim() || null,
        line_items: lines.map(l => ({ desc: l.desc.trim(), qty: parseInt(l.qty) || 1, price: parseFloat(l.price) || 0 })),
        tax_status: draft.taxStatus, subtotal_cents: subtotal, tax_cents: tax, total_cents: total, status: "draft",
      });
      setReloadTick(t => t + 1);
    } else {
      setInvoices(prev => [{ id: "inv-" + prev.length, customer: draft.customer, item: lines.map(l => l.desc).join(", "), amount: total / 100, tax: draft.taxStatus, taxAmt: tax / 100, status: "Draft", date: "today" }, ...prev]);
    }
  }

  async function invoiceStatus(id, status) {
    setInvoices(prev => prev.map(v => (v.id === id ? { ...v, status: status.charAt(0).toUpperCase() + status.slice(1) } : v)));
    if (live) {
      const patch = { status };
      if (status === "sent") patch.sent_at = new Date().toISOString();
      if (status === "paid") patch.paid_at = new Date().toISOString();
      await supabase.from("invoices").update(patch).eq("id", id);
      setReloadTick(t => t + 1);
    }
  }

  const q = query.trim().toLowerCase();
  const filteredItems = q
    ? items.filter(x => (x.payee + " " + x.amount + " " + x.date).toLowerCase().includes(q))
    : items;
  const visibleItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "date-asc") return (a.dateISO || "").localeCompare(b.dateISO || "");
    if (sortBy === "vendor") return (a.payee || "").localeCompare(b.payee || "");
    if (sortBy === "account") return (a.source || "~").localeCompare(b.source || "~") || (b.dateISO || "").localeCompare(a.dateISO || "");
    return (b.dateISO || "").localeCompare(a.dateISO || ""); // date-desc (default)
  });

  const accentRail = N.blue;

  // ---- section renderers ----------------------------------------------------
  function Notebook() {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{entity.currentUser ? `${entity.currentUser}'s notebook` : "Notebook"}</div>
            <div style={{ fontSize: 13, color: N.muted }}>Today — {entity.today}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: N.white, border: "1px solid " + N.rule, borderRadius: 100, padding: "7px 12px" }}>
              <span style={{ color: N.muted, display: "flex" }}><Ico name="search" size={15} /></span>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Look up any day, payee, amount"
                style={{ border: "none", outline: "none", fontSize: 13, fontFamily: "'Figtree', sans-serif", width: 190, color: N.text }} />
            </div>
            <button onClick={() => { setShowAddLine(s => !s); setShowPayCard(false); setAddedCount(0); setTimeout(() => payeeRef.current && payeeRef.current.focus(), 40); }} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>{showAddLine ? "Close" : "+ Add a line"}</button>
            <button onClick={() => { setShowPayCard(s => !s); setShowAddLine(false); }} style={btnPaper(N.blue)}>{showPayCard ? "Close" : "Pay a card"}</button>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} title="Sort the notebook" style={{ ...inputSt, padding: "8px 10px", fontSize: 12 }}>
              <option value="date-desc">Sort: Date (newest)</option>
              <option value="date-asc">Sort: Date (oldest)</option>
              <option value="vendor">Sort: Vendor (A–Z)</option>
              <option value="account">Sort: Pymt by</option>
            </select>
            <div style={{ fontSize: 12, fontWeight: 700, color: N.pinkDark, background: "#eafaf0", border: "1px solid #bff0d3", padding: "7px 12px", borderRadius: 100, whiteSpace: "nowrap" }}>
              {items.length} left to match
            </div>
          </div>
        </div>

        {showAddLine && (
          <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: N.ink, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span>Write lines in the notebook — a check, a cash payment, a deposit the bank feed won't catch.</span>
              {addedCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: N.green, background: "#eafaf0", border: "1px solid #bff0d3", padding: "3px 10px", borderRadius: 100 }}>✓ {addedCount} added</span>}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", border: "1px solid " + N.rule, borderRadius: 100, overflow: "hidden" }}>
                <button onClick={() => setLineDraft(d => ({ ...d, direction: "out" }))} style={{ border: "none", cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 13, fontWeight: 600, padding: "8px 14px", background: lineDraft.direction === "out" ? N.pinkDark : N.white, color: lineDraft.direction === "out" ? N.white : N.muted }}>Money out</button>
                <button onClick={() => setLineDraft(d => ({ ...d, direction: "in" }))} style={{ border: "none", cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 13, fontWeight: 600, padding: "8px 14px", background: lineDraft.direction === "in" ? N.green : N.white, color: lineDraft.direction === "in" ? N.white : N.muted }}>Money in</button>
              </div>
              <input type="date" value={lineDraft.date} onChange={e => setLineDraft(d => ({ ...d, date: e.target.value }))} style={{ ...inputSt, width: 150 }} />
              <input ref={payeeRef} list="pg-vendor-list" placeholder={lineDraft.direction === "in" ? "From whom? (deposit, payment…)" : "Payee / vendor — start typing"} value={lineDraft.payee} onChange={e => setLineDraft(d => ({ ...d, payee: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); amountRef.current && amountRef.current.focus(); } }} style={{ ...inputSt, flex: 1, minWidth: 200 }} />
              <datalist id="pg-vendor-list">
                {(entity.vendors || []).map(v => <option key={v} value={v} />)}
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
            <div style={{ padding: "26px 0", textAlign: "center", fontFamily: "'Caveat', cursive", fontSize: 22, color: "#5a6b52" }}>
              {q ? "Nothing matches that." : "All caught up — every line matched. 🎉"}
            </div>
          )}

          {visibleItems.map((x, i) => {
            const proposed = !!x.cleared;
            const last = i === visibleItems.length - 1;
            return (
              <div key={x.id} style={{ borderBottom: last ? "none" : "1px solid #cfdcc4", background: proposed ? "#e2edf7" : "transparent", marginLeft: proposed ? -8 : 0, paddingLeft: proposed ? 8 : 0, borderRadius: proposed ? 6 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0" }}>
                  <div style={{ width: 34, marginLeft: -38, textAlign: "right", paddingRight: 6, fontFamily: "'Caveat', cursive", fontSize: 18, color: "#8a8f9a" }}>{x.date}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Caveat', cursive", fontSize: 21, color: "#26303f", lineHeight: 1.1 }}>{x.payee}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                      {proposed ? (
                        <span style={{ fontSize: 11, color: N.blue, display: "flex", alignItems: "center", gap: 4 }}>
                          <Ico name="bank" size={13} />Bank says cleared · {x.cleared.bank} · {x.cleared.date}
                        </span>
                      ) : (() => {
                        const hasAcct = x.source && x.source !== "—";
                        return (
                          <button onClick={() => setAcctOpen(o => (o === x.id ? null : x.id))}
                            title="Payment by which bank or card?"
                            style={{
                              display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 9px",
                              borderRadius: 100, cursor: "pointer", fontFamily: "'Figtree', sans-serif",
                              border: "1px solid " + (hasAcct ? "#cdd8c2" : "#f0d89a"),
                              background: hasAcct ? "#f0f7f1" : "#fdf5e3",
                              color: hasAcct ? "#5a7a63" : "#8a5a00",
                            }}>
                            <Ico name="bank" size={12} />{hasAcct ? x.source : "Pymt by?"}<span style={{ fontSize: 9 }}>▾</span>
                          </button>
                        );
                      })()}
                      {(() => {
                        const hasCat = !!x.category;
                        const isSug = !hasCat && !!x.suggested;
                        const bd = hasCat ? "#bff0d3" : isSug ? "#f0d89a" : "#cfe4ff";
                        const bg = hasCat ? "#eafaf0" : isSug ? "#fdf5e3" : "#eef6ff";
                        const fg = hasCat ? N.pinkDark : isSug ? "#8a5a00" : N.blueDark;
                        const label = hasCat ? x.category : isSug ? `${x.suggested} ?` : "Which account?";
                        return (
                          <button onClick={() => setCatOpen(o => (o === x.id ? null : x.id))}
                            title={isSug ? "Remembered from a past entry — tap to confirm or change" : undefined}
                            style={{
                              display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 9px",
                              borderRadius: 100, cursor: "pointer", fontFamily: "'Figtree', sans-serif",
                              border: "1px solid " + bd, background: bg, color: fg,
                            }}>
                            <Ico name="documents" size={12} />{label}<span style={{ fontSize: 9 }}>▾</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Caveat', cursive", fontSize: 21, color: x.direction === "in" ? N.green : "#26303f", whiteSpace: "nowrap" }}>{x.direction === "in" ? "+" + money(x.amount) : money(-x.amount)}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {proposed ? (
                      <button onClick={() => clearOne(x.id, "confirmed cleared")} style={btnBlue}><Ico name="check" size={14} /> Confirm cleared</button>
                    ) : (
                      <>
                        <button onClick={() => clearOne(x.id, "bill attached")} style={btnPaper(N.pinkDark)}><Ico name="clip" size={14} /> Attach bill</button>
                        <button onClick={() => clearOne(x.id, "has it")} style={btnPaper(N.muted)}><Ico name="check" size={14} /> I've got it</button>
                      </>
                    )}
                    <button onClick={() => { setEditLineId(x.id); setEditDraft({ date: x.dateISO || "", payee: x.payee, amount: String(x.amount), direction: x.direction || "out" }); setCatOpen(null); setAcctOpen(null); }} title="Edit this line" style={{ ...btnPaper(N.muted), padding: "6px 10px" }}>Edit</button>
                    <button onClick={() => deleteLine(x.id)} title="Delete this line" style={{ background: "none", border: "1px solid " + N.rule, borderRadius: 100, cursor: "pointer", color: N.pinkDark, fontFamily: "'Figtree', sans-serif", fontSize: 15, fontWeight: 700, lineHeight: 1, padding: "5px 10px" }}>✕</button>
                  </div>
                </div>
                {catOpen === x.id && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 0 12px" }}>
                    {(entity.categories || []).map(cat => (
                      <button key={cat} onClick={() => setCategory(x.id, cat)} style={{
                        fontSize: 12, padding: "6px 12px", borderRadius: 100, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontWeight: 500,
                        border: "1px solid " + (x.category === cat ? N.blue : N.rule),
                        background: x.category === cat ? N.blue : N.white,
                        color: x.category === cat ? N.white : N.text,
                      }}>{cat}</button>
                    ))}
                  </div>
                )}
                {acctOpen === x.id && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 0 12px" }}>
                    <span style={{ fontSize: 11, color: N.muted, alignSelf: "center", marginRight: 2 }}>Pymt by</span>
                    {accountList.map(a => (
                      <button key={a.id} onClick={() => setAccount(x.id, a.id, a.name)} style={{
                        fontSize: 12, padding: "6px 12px", borderRadius: 100, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontWeight: 500,
                        border: "1px solid " + (x.source === a.name ? N.blue : N.rule),
                        background: x.source === a.name ? N.blue : N.white,
                        color: x.source === a.name ? N.white : N.text,
                      }}>{a.name}</button>
                    ))}
                  </div>
                )}
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
            );
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
                <span style={{ color: N.green, display: "flex" }}><Ico name="check" size={16} /></span>
                <div style={{ flex: 1, fontSize: 14, color: N.text }}>{c.payee}</div>
                <div style={{ fontSize: 12, color: N.muted }}>{c.how}</div>
                <div style={{ fontSize: 14, color: c.direction === "in" ? N.green : N.text, fontWeight: 600 }}>{c.direction === "in" ? "+" + money(c.amount) : money(-c.amount)}</div>
              </div>
            ))}
          </div>
        )}
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
              {[...new Set(invoices.map(v => v.customer))].filter(c => c && c !== "—").sort().map(c => <option key={c} value={c} />)}
            </datalist>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <input placeholder="Customer — pick or type new" list="pg-customers" value={invDraft.customer} onChange={e => setInvDraft(d => ({ ...d, customer: e.target.value }))} style={inputSt} />
              <input placeholder="Customer email (optional)" value={invDraft.email} onChange={e => setInvDraft(d => ({ ...d, email: e.target.value }))} style={inputSt} />
            </div>
            {invDraft.lines.map((l, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 56px 96px 26px", gap: 8, marginBottom: 8 }}>
                <input placeholder="What they ordered" value={l.desc} onChange={e => setLine(i, { desc: e.target.value })} style={inputSt} />
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
                Subtotal {money(sub)}{invDraft.taxStatus === "Taxable" ? ` · MN tax (6.875%) ${money(tax)}` : ""} · <b style={{ color: N.ink }}>Total {money(sub + tax)}</b>
              </div>
              <button onClick={createInvoice} style={{ ...btnBlue, background: N.blue, fontSize: 14, padding: "10px 18px" }}>Save invoice</button>
            </div>
          </div>
        )}

        <div style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, overflow: "hidden" }}>
          {invoices.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: N.muted, fontSize: 14 }}>No invoices yet. Click “New invoice” to make the first one.</div>
          ) : invoices.map((v, i) => (
            <div key={v.id} onClick={() => setOpenInv(v)} title="Open invoice"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i === invoices.length - 1 ? "none" : "1px solid " + N.rule, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f7fafd")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div style={{ width: 50, fontSize: 12, color: N.muted }}>{v.date}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, color: N.ink, fontWeight: 600 }}>{v.customer}</div>
                <div style={{ fontSize: 12, color: N.muted }}>{v.item} · {v.tax}{v.taxAmt ? ` · MN tax ${money(v.taxAmt)}` : ""}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: STATUS_COLOR[v.status] || N.muted, background: (STATUS_COLOR[v.status] || N.muted) + "18", padding: "4px 10px", borderRadius: 100 }}>{v.status}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {v.status === "Draft" && <button onClick={e => { e.stopPropagation(); invoiceStatus(v.id, "sent"); }} style={btnPaper(N.blue)}>Send</button>}
                {v.status !== "Paid" && <button onClick={e => { e.stopPropagation(); invoiceStatus(v.id, "paid"); }} style={btnPaper(N.pinkDark)}>Mark paid</button>}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: N.ink, width: 90, textAlign: "right" }}>{money(v.amount)}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: N.muted, marginTop: 10 }}>Click any invoice to open it. Paid by check? Just hit <b style={{ color: N.pinkDark }}>Mark paid</b>. Sent invoices show <b style={{ color: N.blue }}>Viewed</b> when the customer opens them — the status QuickBooks took away.</div>

        {openInv && (() => {
          const invLines = openInv.lines && openInv.lines.length ? openInv.lines : [{ desc: openInv.item, qty: 1, price: openInv.subtotal || openInv.amount }];
          const cleanDesc = d => (/^QuickBooks invoice #/.test(d || "") ? "Signs & graphics" : d);
          const taxLabel = openInv.tax === "Taxable" ? "Taxable" : openInv.tax === "Shipped" ? "Shipped out of state — no sales tax" : "Tax-exempt (reseller)";
          return (
          <div onClick={() => setOpenInv(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "44px 16px", zIndex: 200, overflowY: "auto" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: N.white, borderRadius: 12, width: "100%", maxWidth: 640, boxShadow: "0 24px 70px rgba(10,10,20,0.35)", overflow: "hidden" }}>
              {/* The invoice document */}
              <div style={{ padding: "34px 40px 26px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 28 }}>
                  <div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{entity.name}</div>
                    <div style={{ fontSize: 12, color: N.muted, marginTop: 3 }}>Minnesota{entity.fiscalYearEnd ? ` · fiscal year ends ${entity.fiscalYearEnd}` : ""}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, letterSpacing: "0.16em", color: N.blue, fontWeight: 500 }}>INVOICE</div>
                    {openInv.number && <div style={{ fontSize: 13, color: N.ink, marginTop: 5 }}>No. {openInv.number}</div>}
                    <div style={{ fontSize: 12, color: N.muted, marginTop: 2 }}>Date: {openInv.date}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.muted, marginBottom: 4 }}>BILL TO</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: N.ink }}>{openInv.customer}</div>
                  {openInv.email && <div style={{ fontSize: 13, color: N.muted }}>{openInv.email}</div>}
                </div>

                <div style={{ border: "1px solid " + N.rule, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 46px 86px 92px", gap: 8, padding: "10px 14px", background: "#f7fafd", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted }}>
                    <span>DESCRIPTION</span><span style={{ textAlign: "center" }}>QTY</span><span style={{ textAlign: "right" }}>RATE</span><span style={{ textAlign: "right" }}>AMOUNT</span>
                  </div>
                  {invLines.map((l, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 46px 86px 92px", gap: 8, padding: "11px 14px", borderTop: "1px solid " + N.rule, fontSize: 14, color: N.text }}>
                      <span>{cleanDesc(l.desc)}</span>
                      <span style={{ textAlign: "center", color: N.muted }}>{l.qty || 1}</span>
                      <span style={{ textAlign: "right", color: N.muted }}>{money(l.price || 0)}</span>
                      <span style={{ textAlign: "right", fontWeight: 500, color: N.ink }}>{money((l.price || 0) * (l.qty || 1))}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ width: 250 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: N.muted, padding: "3px 0" }}><span>Subtotal</span><span>{money(openInv.subtotal || openInv.amount)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: N.muted, padding: "3px 0" }}><span>MN sales tax{openInv.tax === "Taxable" ? " (6.875%)" : ""}</span><span>{money(openInv.taxAmt)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, color: N.ink, padding: "9px 0 0", marginTop: 5, borderTop: "2px solid " + N.ink }}><span>Total</span><span>{money(openInv.amount)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 7, fontWeight: 600, color: openInv.status === "Paid" ? N.green : N.blueDark }}>
                      <span>{openInv.status === "Paid" ? "Paid — thank you" : "Balance due"}</span><span>{money(openInv.status === "Paid" ? 0 : openInv.amount)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid " + N.rule, fontSize: 12, color: N.muted, lineHeight: 1.6 }}>
                  {taxLabel}. Make checks payable to <b style={{ color: N.text }}>{entity.name}</b>. Thank you for your business.
                </div>
              </div>

              <div style={{ padding: "14px 22px", borderTop: "1px solid " + N.rule, background: "#f7fafd", display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ marginRight: "auto", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: STATUS_COLOR[openInv.status] || N.muted }}>{openInv.status}</span>
                {openInv.status === "Draft" && <button onClick={() => { invoiceStatus(openInv.id, "sent"); setOpenInv(null); }} style={{ ...btnBlue, background: N.blue }}>Send · View link</button>}
                {openInv.status !== "Paid" && <button onClick={() => { invoiceStatus(openInv.id, "paid"); setOpenInv(null); }} style={btnPaper(N.pinkDark)}>Mark paid</button>}
                <button onClick={() => setOpenInv(null)} style={btnPaper(N.muted)}>Close</button>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    );
  }

  function SalesTax() {
    // Tallied live from invoices: taxable = pre-tax subtotal of taxable invoices;
    // exempt = reseller-exempt + shipped-no-tax sales; collected = MN tax billed.
    const taxable = invoices.filter(v => v.tax === "Taxable").reduce((s, v) => s + (v.amount - v.taxAmt), 0);
    const exempt = invoices.filter(v => v.tax !== "Taxable").reduce((s, v) => s + v.amount, 0);
    const collected = invoices.reduce((s, v) => s + v.taxAmt, 0);
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
    const grouped = ACCOUNT_TYPES.map(t => ({ ...t, rows: rows.filter(r => r.account_type === t.value) })).filter(g => g.rows.length);
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Accounts</div>
            <div style={{ fontSize: 13, color: N.muted }}>Your banks, cards, and loans. You set these — add the last four when you have it, and real opening balances from each statement.</div>
          </div>
          <button onClick={() => { setShowAddAcct(s => !s); setNewAcct(blankAcct); }} style={{ ...btnBlue, background: N.blue, fontSize: 13, padding: "9px 16px" }}>{showAddAcct ? "Close" : "+ Add account"}</button>
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
  else if (section === "salestax") body = SalesTax();
  else if (section === "reports") body = Reports();
  else if (section === "accounts") body = Accounts();
  else if (section === "bills") body = <Stub title="Bills" note="Bills you owe — the real, verified list. Rebuilt from statements at the April 1 line." />;
  else if (section === "documents") body = <Stub title="Documents" note="Statements, exemption certificates, and anything you attach lives here." />;

  return (
    <div style={{ minHeight: "100vh", background: N.white, fontFamily: "'Figtree', sans-serif", color: N.text }}>
      <link href={FONTS} rel="stylesheet" />

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: N.white, borderBottom: "1px solid " + N.rule }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            {/* What's new pill — top left */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setWhatsNew(w => !w)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#eef6ff", border: "1px solid #cfe4ff", color: N.blueDark, borderRadius: 100, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
                <Ico name="sparkle" size={14} /> Updated {latestUpdate}
                <span style={{ width: 7, height: 7, borderRadius: 100, background: N.pink, boxShadow: `0 0 8px ${N.pink}` }} />
              </button>
              {whatsNew && (
                <div style={{ position: "absolute", top: 40, left: 0, width: 320, background: N.white, border: "1px solid " + N.rule, borderRadius: 12, boxShadow: "0 12px 34px rgba(10,10,20,0.14)", padding: 14, zIndex: 60 }}>
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
            <div style={{ width: 1, height: 26, background: N.rule }} />
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, minWidth: 0 }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entity.short}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.16em", color: N.blue }}>LEDGER</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
            <span style={{ width: 28, height: 28, borderRadius: 100, background: "#eef6ff", color: N.blueDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
              {entity.users.find(u => u.name === entity.currentUser)?.initials || "?"}
            </span>
            <span style={{ fontSize: 13, color: N.muted }}>{entity.currentUser}</span>
          </div>
        </div>

        {/* Balances — always in view */}
        <div style={{ display: "flex", gap: 8, padding: "0 22px 12px", overflowX: "auto", flexWrap: "wrap" }}>
          {[...entity.accounts.banks, ...entity.accounts.cards, ...entity.accounts.loans].map(a => (
            <div key={a.name} style={{ background: a.balance < 0 ? "#fdf0f0" : "#f0f7f1", border: "1px solid " + (a.balance < 0 ? "#f6d5d5" : "#cfe9d6"), borderRadius: 10, padding: "6px 11px", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 10, color: a.balance < 0 ? "#9a5a5a" : "#5a7a63", letterSpacing: "0.04em" }}>{a.name.toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: a.balance < 0 ? N.red : N.ink }}>{money(a.balance)}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Body: nav + work area */}
      <div style={{ display: "flex", alignItems: "flex-start", maxWidth: 1180, margin: "0 auto" }}>
        <nav style={{ width: 210, flexShrink: 0, padding: "18px 12px", position: "sticky", top: 132 }}>
          {SECTIONS.map(s => {
            const active = section === s.key;
            return (
              <button key={s.key} onClick={() => setSection(s.key)} style={{
                display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left",
                padding: "10px 12px", marginBottom: 3, borderRadius: 10, cursor: "pointer",
                border: "none", fontFamily: "'Figtree', sans-serif", fontSize: 14,
                background: active ? "#eef6ff" : "transparent",
                color: active ? N.blueDark : N.muted, fontWeight: active ? 700 : 500,
              }}>
                <span style={{ display: "flex", color: active ? N.blue : N.mutedLite }}><Ico name={s.key} /></span>
                {s.label}
              </button>
            );
          })}
        </nav>

        <main style={{ flex: 1, minWidth: 0, padding: "18px 24px 80px" }}>{body}</main>
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
