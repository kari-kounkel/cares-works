// LedgerWorkspace.jsx — the entity-driven bookkeeping workspace.
// NOTHING about the entity is hardcoded: name, users, accounts, and data all
// come from the `entity` object (in production, the entity's data record).
// ProGraphics is just the first tenant — SAMPLE_ENTITY seeds a clickable preview.
//
// Layout mirrors the NLIC org shell: left nav + big work area, blue-dominant neon.
// Betty lands on her stenographer Notebook; Dave lands on Invoices.

import { useState, useEffect } from "react";
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
    .filter(e => e.direction === "out" && !e.match_status)
    .map(e => ({
      id: e.id,
      date: shortDate(e.entry_date),
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
    categories: categories.map(c => c.name),
    changelog: [{ date: "Aug 2, 2026", items: ["Your ProGraphics workspace is live on your real ledger data.", "Balances, notebook, and categories all load from your account."] }],
  };
}

// Map an invoices row into the shape the Invoices tab renders.
function mapInvoice(v) {
  const items = Array.isArray(v.line_items) ? v.line_items : [];
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "Draft");
  const d = v.issue_date ? new Date(v.issue_date + "T00:00:00") : null;
  return {
    id: v.id,
    customer: v.customer_name || "—",
    item: items.map(l => l.desc).filter(Boolean).join(", ") || "—",
    amount: (v.total_cents || 0) / 100,
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

  const [section, setSection] = useState(entity.users?.find(u => u.name === entity.currentUser)?.lands || "notebook");
  const [items, setItems] = useState(entity.notebook);
  const [cleared, setCleared] = useState([]);
  const [showCleared, setShowCleared] = useState(false);
  const [whatsNew, setWhatsNew] = useState(false);
  const [query, setQuery] = useState("");
  const [catOpen, setCatOpen] = useState(null);
  const [invoices, setInvoices] = useState(entity.invoices || []);
  const [liveOrgId, setLiveOrgId] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [showInvForm, setShowInvForm] = useState(false);
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
      const [a, c, e, inv] = await Promise.all([
        supabase.from("ledger_accounts").select("*").eq("org_id", org.id).eq("archived", false).order("created_at", { ascending: true }),
        supabase.from("ledger_categories").select("*").eq("org_id", org.id).eq("archived", false).order("sort_order", { ascending: true }),
        supabase.from("ledger_entries").select("*").eq("org_id", org.id).order("entry_date", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").eq("org_id", org.id).order("issue_date", { ascending: false }).order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setLiveOrgId(org.id);
      const built = buildLiveEntity(org, a.data || [], c.data || [], e.data || [], session);
      built.invoices = (inv.data || []).map(mapInvoice);
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
  const visibleItems = q
    ? items.filter(x => (x.payee + " " + x.amount + " " + x.date).toLowerCase().includes(q))
    : items;

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
            <div style={{ fontSize: 12, fontWeight: 700, color: N.pinkDark, background: "#eafaf0", border: "1px solid #bff0d3", padding: "7px 12px", borderRadius: 100, whiteSpace: "nowrap" }}>
              {items.length} left to match
            </div>
          </div>
        </div>

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
                      <span style={{ fontSize: 11, color: proposed ? N.blue : "#8aa07f", display: "flex", alignItems: "center", gap: 4 }}>
                        {proposed ? <><Ico name="bank" size={13} />Bank says cleared · {x.cleared.bank} · {x.cleared.date}</> : x.source}
                      </span>
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
                  <div style={{ fontFamily: "'Caveat', cursive", fontSize: 21, color: "#26303f", whiteSpace: "nowrap" }}>{money(-x.amount)}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {proposed ? (
                      <button onClick={() => clearOne(x.id, "confirmed cleared")} style={btnBlue}><Ico name="check" size={14} /> Confirm cleared</button>
                    ) : (
                      <>
                        <button onClick={() => clearOne(x.id, "bill attached")} style={btnPaper(N.pinkDark)}><Ico name="clip" size={14} /> Attach bill</button>
                        <button onClick={() => clearOne(x.id, "has it")} style={btnPaper(N.muted)}><Ico name="check" size={14} /> I've got it</button>
                      </>
                    )}
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
                <div style={{ fontSize: 14, color: N.text, fontWeight: 600 }}>{money(-c.amount)}</div>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <input placeholder="Customer name" value={invDraft.customer} onChange={e => setInvDraft(d => ({ ...d, customer: e.target.value }))} style={inputSt} />
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
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i === invoices.length - 1 ? "none" : "1px solid " + N.rule }}>
              <div style={{ width: 50, fontSize: 12, color: N.muted }}>{v.date}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, color: N.ink, fontWeight: 600 }}>{v.customer}</div>
                <div style={{ fontSize: 12, color: N.muted }}>{v.item} · {v.tax}{v.taxAmt ? ` · MN tax ${money(v.taxAmt)}` : ""}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: STATUS_COLOR[v.status] || N.muted, background: (STATUS_COLOR[v.status] || N.muted) + "18", padding: "4px 10px", borderRadius: 100 }}>{v.status}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {v.status === "Draft" && <button onClick={() => invoiceStatus(v.id, "sent")} style={btnPaper(N.blue)}>Send</button>}
                {v.status !== "Paid" && <button onClick={() => invoiceStatus(v.id, "paid")} style={btnPaper(N.pinkDark)}>Mark paid</button>}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: N.ink, width: 90, textAlign: "right" }}>{money(v.amount)}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: N.muted, marginTop: 10 }}>Paid by check? Just hit <b style={{ color: N.pinkDark }}>Mark paid</b>. Sent invoices will show <b style={{ color: N.blue }}>Viewed</b> when the customer opens them — the status QuickBooks took away.</div>
      </div>
    );
  }

  function SalesTax() {
    const s = entity.salesTax;
    return (
      <div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 4 }}>Sales tax</div>
        <div style={{ fontSize: 13, color: N.muted, marginBottom: 16 }}>Minnesota · quarterly · {s.quarter}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
          {[["Taxable sales", money(s.taxable), N.ink], ["Tax-exempt sales", money(s.exempt), N.ink], ["Tax collected", money(s.collected), N.pinkDark]].map(([l, v, c]) => (
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

  const body = entity.needsConnect ? <Connect /> : {
    notebook: <Notebook />,
    invoices: <Invoices />,
    salestax: <SalesTax />,
    reports: <Reports />,
    bills: <Stub title="Bills" note="Bills you owe — the real, verified list. Rebuilt from statements at the April 1 line." />,
    documents: <Stub title="Documents" note="Statements, exemption certificates, and anything you attach lives here." />,
  }[section];

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
