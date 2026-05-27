import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";

const S = {
  paper: "#faf8f4",
  cream: "#f2ede3",
  ink: "#1e1e2a",
  slate: "#3d4560",
  orange: "#e8773a",
  orangeDark: "#c95f22",
  orangeLight: "#fdf0e8",
  rule: "#ddd8cc",
  muted: "#7a7585",
  green: "#5a9a5a",
  greenLight: "#eef6ee",
  red: "#c44a3a",
  redLight: "#fbeeec",
  gold: "#C9A84C",
};

const FUND_COLORS = ["#2F5233", "#C9A84C", "#3d4560", "#e8773a", "#7a5b8a", "#3a7d8a", "#c44a3a", "#5a9a5a"];
const TABS = [
  { key: "ledger", label: "Ledger" },
  { key: "accounts", label: "Accounts" },
  { key: "funds", label: "Funds" },
  { key: "donors", label: "Donors" },
  { key: "campaigns", label: "Fundraising" },
];

function fmt(cents) {
  const n = (cents || 0) / 100;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
function parseDollars(str) {
  const n = parseFloat(String(str).replace(/[^0-9.\-]/g, ""));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function computeDateRange(kind, customStart, customEnd) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const monthName = (yr, mo) => new Date(yr, mo, 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  if (kind === "all") return { rangeStart: null, rangeEnd: null, rangeLabel: "All time" };
  if (kind === "this-month") {
    return { rangeStart: iso(new Date(y, m, 1)), rangeEnd: iso(new Date(y, m + 1, 0)), rangeLabel: monthName(y, m) };
  }
  if (kind === "last-month") {
    return { rangeStart: iso(new Date(y, m - 1, 1)), rangeEnd: iso(new Date(y, m, 0)), rangeLabel: monthName(y, m - 1) };
  }
  if (kind === "last-3-months") {
    return { rangeStart: iso(new Date(y, m - 2, 1)), rangeEnd: iso(new Date(y, m + 1, 0)), rangeLabel: `${monthName(y, m - 2)} – ${monthName(y, m)}` };
  }
  if (kind === "this-year") {
    return { rangeStart: iso(new Date(y, 0, 1)), rangeEnd: iso(new Date(y, 11, 31)), rangeLabel: `${y}` };
  }
  if (kind === "custom") {
    if (!customStart && !customEnd) return { rangeStart: null, rangeEnd: null, rangeLabel: "Custom (pick dates)" };
    return { rangeStart: customStart || null, rangeEnd: customEnd || null, rangeLabel: `${customStart || "…"} – ${customEnd || "…"}` };
  }
  return { rangeStart: null, rangeEnd: null, rangeLabel: "All time" };
}

export default function Ledger({ session }) {
  const [orgs, setOrgs] = useState([]);
  const [orgId, setOrgId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("ledger");

  const [entries, setEntries] = useState([]);
  const [funds, setFunds] = useState([]);
  const [donors, setDonors] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [reconcileAccountId, setReconcileAccountId] = useState(null);

  const userId = session?.user?.id;
  const org = orgs.find(o => o.id === orgId);

  // Bootstrap: load orgs, auto-create one if none.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      let { data: existing } = await supabase
        .from("ledger_orgs")
        .select("*")
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (!existing || existing.length === 0) {
        const { data: created } = await supabase
          .from("ledger_orgs")
          .insert({ user_id: userId, name: "My Organization", org_type: "business" })
          .select()
          .single();
        existing = created ? [created] : [];
      }
      setOrgs(existing);
      setOrgId(existing[0]?.id || null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Load org data when org changes.
  const reload = useCallback(async () => {
    if (!orgId) return;
    const [e, f, d, c, a, r] = await Promise.all([
      supabase.from("ledger_entries").select("*").eq("org_id", orgId).order("entry_date", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("ledger_funds").select("*").eq("org_id", orgId).eq("archived", false).order("created_at", { ascending: true }),
      supabase.from("ledger_donors").select("*").eq("org_id", orgId).order("name", { ascending: true }),
      supabase.from("ledger_campaigns").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
      supabase.from("ledger_accounts").select("*").eq("org_id", orgId).eq("archived", false).order("created_at", { ascending: true }),
      supabase.from("ledger_reconciliations").select("*").eq("org_id", orgId).order("statement_ending_date", { ascending: false }),
    ]);
    setEntries(e.data || []);
    setFunds(f.data || []);
    setDonors(d.data || []);
    setCampaigns(c.data || []);
    setAccounts(a.data || []);
    setReconciliations(r.data || []);
  }, [orgId]);

  useEffect(() => { reload(); }, [reload]);

  // Totals
  const totals = useMemo(() => {
    const inCents = entries.filter(e => e.direction === "in").reduce((s, e) => s + (e.amount_cents || 0), 0);
    const outCents = entries.filter(e => e.direction === "out").reduce((s, e) => s + (e.amount_cents || 0), 0);
    return { in: inCents, out: outCents, net: inCents - outCents };
  }, [entries]);

  const monthTotals = useMemo(() => {
    const ym = todayISO().slice(0, 7);
    const monthly = entries.filter(e => (e.entry_date || "").startsWith(ym));
    const inCents = monthly.filter(e => e.direction === "in").reduce((s, e) => s + (e.amount_cents || 0), 0);
    const outCents = monthly.filter(e => e.direction === "out").reduce((s, e) => s + (e.amount_cents || 0), 0);
    return { in: inCents, out: outCents, net: inCents - outCents };
  }, [entries]);

  if (loading) {
    return <Shell><div style={{ padding: 60, textAlign: "center", color: S.muted }}>Loading your ledger…</div></Shell>;
  }

  return (
    <Shell>
      <Header
        org={org}
        orgs={orgs}
        onSwitch={setOrgId}
        onUpdate={async (patch) => {
          await supabase.from("ledger_orgs").update(patch).eq("id", org.id);
          const { data } = await supabase.from("ledger_orgs").select("*").order("created_at", { ascending: true });
          setOrgs(data || []);
        }}
        onCreate={async (name) => {
          const { data } = await supabase.from("ledger_orgs").insert({ user_id: userId, name, org_type: "business" }).select().single();
          if (data) {
            setOrgs(prev => [...prev, data]);
            setOrgId(data.id);
          }
        }}
      />

      <Summary monthTotals={monthTotals} totals={totals} />

      <Tabs tab={tab} onTab={setTab} />

      {tab === "ledger" && (
        <LedgerTab
          entries={entries}
          funds={funds}
          donors={donors}
          campaigns={campaigns}
          accounts={accounts}
          onAdd={async (row) => {
            await supabase.from("ledger_entries").insert({ ...row, user_id: userId, org_id: orgId });
            reload();
          }}
          onDelete={async (id) => {
            await supabase.from("ledger_entries").delete().eq("id", id);
            reload();
          }}
        />
      )}

      {tab === "accounts" && (
        reconcileAccountId ? (
          <ReconcileView
            account={accounts.find(a => a.id === reconcileAccountId)}
            entries={entries.filter(e => e.account_id === reconcileAccountId)}
            reconciliations={reconciliations.filter(r => r.account_id === reconcileAccountId)}
            onClose={() => setReconcileAccountId(null)}
            onCommit={async ({ statementEndingDate, statementEndingBalanceCents, entryIds, notes }) => {
              const { data: rec } = await supabase.from("ledger_reconciliations").insert({
                account_id: reconcileAccountId,
                org_id: orgId,
                user_id: userId,
                statement_ending_date: statementEndingDate,
                statement_ending_balance_cents: statementEndingBalanceCents,
                notes: notes || null,
              }).select().single();
              if (rec && entryIds.length > 0) {
                await supabase.from("ledger_entries").update({ reconciliation_id: rec.id }).in("id", entryIds);
              }
              await reload();
              setReconcileAccountId(null);
            }}
          />
        ) : (
          <AccountsTab
            accounts={accounts}
            entries={entries}
            reconciliations={reconciliations}
            onAdd={async (row) => {
              await supabase.from("ledger_accounts").insert({ ...row, user_id: userId, org_id: orgId });
              reload();
            }}
            onUpdate={async (id, patch) => {
              await supabase.from("ledger_accounts").update(patch).eq("id", id);
              reload();
            }}
            onArchive={async (id) => {
              await supabase.from("ledger_accounts").update({ archived: true }).eq("id", id);
              reload();
            }}
            onReconcile={(id) => setReconcileAccountId(id)}
          />
        )
      )}

      {tab === "funds" && (
        <FundsTab
          funds={funds}
          entries={entries}
          onAdd={async (row) => {
            await supabase.from("ledger_funds").insert({ ...row, user_id: userId, org_id: orgId });
            reload();
          }}
          onUpdate={async (id, patch) => {
            await supabase.from("ledger_funds").update(patch).eq("id", id);
            reload();
          }}
          onArchive={async (id) => {
            await supabase.from("ledger_funds").update({ archived: true }).eq("id", id);
            reload();
          }}
        />
      )}

      {tab === "donors" && (
        <DonorsTab
          donors={donors}
          entries={entries}
          onAdd={async (row) => {
            await supabase.from("ledger_donors").insert({ ...row, user_id: userId, org_id: orgId });
            reload();
          }}
          onDelete={async (id) => {
            await supabase.from("ledger_donors").delete().eq("id", id);
            reload();
          }}
        />
      )}

      {tab === "campaigns" && (
        <CampaignsTab
          campaigns={campaigns}
          entries={entries}
          funds={funds}
          onAdd={async (row) => {
            await supabase.from("ledger_campaigns").insert({ ...row, user_id: userId, org_id: orgId });
            reload();
          }}
          onUpdate={async (id, patch) => {
            await supabase.from("ledger_campaigns").update(patch).eq("id", id);
            reload();
          }}
        />
      )}
    </Shell>
  );
}

/* ---------- Shell ---------- */
function Shell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', sans-serif", color: S.ink }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @media print {
          body { background: #fff !important; }
          .ledger-shell-header,
          .ledger-org-header,
          .ledger-summary,
          .ledger-tabs,
          .ledger-add-card,
          .ledger-toolbar,
          .ledger-row-delete { display: none !important; }
          .print-only-header { display: block !important; }
          .ledger-entry-row { page-break-inside: avoid; }
          @page { margin: 0.6in 0.5in; }
        }
      `}</style>
      <div className="ledger-shell-header" style={{ background: "#fff", borderBottom: `1px solid ${S.rule}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", color: S.slate, cursor: "pointer", fontSize: 14, fontFamily: "inherit", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>← Dashboard</button>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: S.slate }}>CARES <span style={{ color: S.orange }}>Ledger</span></div>
        <div style={{ width: 90 }} />
      </div>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "28px 24px 80px" }}>{children}</div>
    </div>
  );
}

/* ---------- Header ---------- */
function Header({ org, orgs, onSwitch, onUpdate, onCreate }) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(org?.name || "");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => { setName(org?.name || ""); }, [org?.id]);

  return (
    <div className="ledger-org-header" style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: S.muted, marginBottom: 8 }}>Bookkeeping for</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        {editingName ? (
          <input
            value={name}
            autoFocus
            onChange={e => setName(e.target.value)}
            onBlur={() => { onUpdate({ name: name.trim() || org.name }); setEditingName(false); }}
            onKeyDown={e => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") { setName(org.name); setEditingName(false); } }}
            style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: S.slate, border: `2px solid ${S.orange}`, borderRadius: 6, padding: "2px 10px", outline: "none", background: "#fff", minWidth: 280 }}
          />
        ) : (
          <h1 onClick={() => setEditingName(true)} style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: S.slate, margin: 0, cursor: "pointer", borderBottom: `1px dashed transparent`, padding: "2px 0" }} title="Click to rename">{org?.name}</h1>
        )}
        <select
          value={org?.org_type || "business"}
          onChange={e => onUpdate({ org_type: e.target.value })}
          style={{ background: S.cream, border: `1px solid ${S.rule}`, color: S.slate, borderRadius: 999, padding: "6px 12px", fontFamily: "inherit", fontSize: 13, fontWeight: 500 }}
        >
          <option value="business">Business</option>
          <option value="nonprofit">Nonprofit / Ministry</option>
        </select>
        {orgs.length > 1 && (
          <select value={org.id} onChange={e => onSwitch(e.target.value)} style={{ background: "#fff", border: `1px solid ${S.rule}`, color: S.slate, borderRadius: 999, padding: "6px 12px", fontFamily: "inherit", fontSize: 13 }}>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
        {showNew ? (
          <span style={{ display: "inline-flex", gap: 6 }}>
            <input value={newName} autoFocus onChange={e => setNewName(e.target.value)} onKeyDown={e => {
              if (e.key === "Enter" && newName.trim()) { onCreate(newName.trim()); setNewName(""); setShowNew(false); }
              if (e.key === "Escape") { setNewName(""); setShowNew(false); }
            }} placeholder="Organization name" style={{ border: `1px solid ${S.rule}`, borderRadius: 999, padding: "6px 12px", fontFamily: "inherit", fontSize: 13 }} />
            <button onClick={() => { if (newName.trim()) { onCreate(newName.trim()); setNewName(""); setShowNew(false); } }} style={btnPrimary}>Add</button>
          </span>
        ) : (
          <button onClick={() => setShowNew(true)} style={{ background: "transparent", border: `1px dashed ${S.rule}`, color: S.muted, borderRadius: 999, padding: "6px 12px", fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>+ Add organization</button>
        )}
      </div>
    </div>
  );
}

/* ---------- Summary ---------- */
function Summary({ monthTotals, totals }) {
  return (
    <div className="ledger-summary" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
      <Stat label="This month — in" value={fmt(monthTotals.in)} accent={S.green} />
      <Stat label="This month — out" value={fmt(monthTotals.out)} accent={S.red} />
      <Stat label="This month — net" value={fmt(monthTotals.net)} accent={monthTotals.net >= 0 ? S.green : S.red} />
      <Stat label="All-time net" value={fmt(totals.net)} accent={S.slate} />
    </div>
  );
}
function Stat({ label, value, accent }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${S.rule}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: S.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: accent }}>{value}</div>
    </div>
  );
}

/* ---------- Tabs ---------- */
function Tabs({ tab, onTab }) {
  return (
    <div className="ledger-tabs" style={{ display: "flex", gap: 4, borderBottom: `1px solid ${S.rule}`, marginBottom: 22, flexWrap: "wrap" }}>
      {TABS.map(t => (
        <button key={t.key} onClick={() => onTab(t.key)} style={{
          background: "transparent", border: "none", padding: "12px 16px",
          fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer",
          color: tab === t.key ? S.orange : S.muted,
          borderBottom: `3px solid ${tab === t.key ? S.orange : "transparent"}`,
          marginBottom: -1,
        }}>{t.label}</button>
      ))}
    </div>
  );
}

/* ---------- Ledger Tab ---------- */
function LedgerTab({ entries, funds, donors, campaigns, accounts, onAdd, onDelete }) {
  const [showAdd, setShowAdd] = useState(entries.length === 0);
  const [direction, setDirection] = useState("in");
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [fundId, setFundId] = useState("");
  const [donorId, setDonorId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [filterDir, setFilterDir] = useState("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [dateRange, setDateRange] = useState("this-month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const reset = () => { setAmount(""); setDescription(""); setCategory(""); setFundId(""); setDonorId(""); setCampaignId(""); };

  const submit = async (e) => {
    e?.preventDefault?.();
    const cents = parseDollars(amount);
    if (!cents || !description.trim()) return;
    await onAdd({
      direction,
      entry_date: date,
      amount_cents: cents,
      description: description.trim(),
      category: category.trim() || null,
      fund_id: fundId || null,
      donor_id: donorId || null,
      campaign_id: campaignId || null,
      account_id: accountId || null,
    });
    reset();
  };

  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => computeDateRange(dateRange, customStart, customEnd), [dateRange, customStart, customEnd]);

  const filtered = entries.filter(e => {
    if (filterDir !== "all" && e.direction !== filterDir) return false;
    if (filterAccount === "none" && e.account_id) return false;
    if (filterAccount !== "all" && filterAccount !== "none" && e.account_id !== filterAccount) return false;
    if (rangeStart && (e.entry_date || "") < rangeStart) return false;
    if (rangeEnd && (e.entry_date || "") > rangeEnd) return false;
    return true;
  });

  const filteredTotals = useMemo(() => {
    const inCents = filtered.filter(e => e.direction === "in").reduce((s, e) => s + (e.amount_cents || 0), 0);
    const outCents = filtered.filter(e => e.direction === "out").reduce((s, e) => s + (e.amount_cents || 0), 0);
    return { in: inCents, out: outCents, net: inCents - outCents };
  }, [filtered]);

  const donorById = Object.fromEntries(donors.map(d => [d.id, d]));
  const fundById = Object.fromEntries(funds.map(f => [f.id, f]));
  const accountById = Object.fromEntries(accounts.map(a => [a.id, a]));

  return (
    <div>
      <div className="ledger-add-card" style={{ background: "#fff", border: `1px solid ${S.rule}`, borderRadius: 14, padding: showAdd ? "20px 22px" : "14px 22px", marginBottom: 20 }}>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)} style={{ ...btnPrimary, width: "100%", justifyContent: "center", padding: "12px 16px", fontSize: 14 }}>+ Add entry</button>
        )}
        {showAdd && (
          <form onSubmit={submit}>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button type="button" onClick={() => setDirection("in")} style={pill(direction === "in", S.green, S.greenLight)}>Money in</button>
              <button type="button" onClick={() => setDirection("out")} style={pill(direction === "out", S.red, S.redLight)}>Money out</button>
              <span style={{ flex: 1 }} />
              <button type="button" onClick={() => setShowAdd(false)} style={{ background: "transparent", border: "none", color: S.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Close</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 140px", gap: 10, marginBottom: 10 }}>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
              <input placeholder={direction === "in" ? "What was this for? (e.g. April donations, invoice #1042)" : "What was this for? (e.g. paper supplies, electric bill)"} value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} required />
              <input placeholder="$0.00" value={amount} onChange={e => setAmount(e.target.value)} style={{ ...inputStyle, textAlign: "right" }} required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} style={inputStyle}>
                <option value="">— No account —</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select value={fundId} onChange={e => setFundId(e.target.value)} style={inputStyle}>
                <option value="">— No fund —</option>
                {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              {direction === "in" ? (
                <select value={donorId} onChange={e => setDonorId(e.target.value)} style={inputStyle}>
                  <option value="">— No donor —</option>
                  {donors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              ) : (
                <input placeholder="Category (optional)" value={category} onChange={e => setCategory(e.target.value)} style={inputStyle} />
              )}
              {direction === "in" ? (
                <select value={campaignId} onChange={e => setCampaignId(e.target.value)} style={inputStyle}>
                  <option value="">— No campaign —</option>
                  {campaigns.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ) : (
                <input placeholder="Reference (check #, etc.)" value={category === description ? "" : ""} onChange={() => {}} style={{ ...inputStyle, opacity: 0.5 }} disabled />
              )}
            </div>
            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="submit" style={btnPrimary}>Save entry</button>
            </div>
          </form>
        )}
      </div>

      <div className="ledger-toolbar" style={{ background: "#fff", border: `1px solid ${S.rule}`, borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: S.muted, marginRight: 4 }}>When</span>
          {[
            { key: "this-month", label: "This month" },
            { key: "last-month", label: "Last month" },
            { key: "last-3-months", label: "Last 3 months" },
            { key: "this-year", label: "This year" },
            { key: "all", label: "All time" },
            { key: "custom", label: "Custom" },
          ].map(opt => (
            <button key={opt.key} onClick={() => setDateRange(opt.key)} style={smallPill(dateRange === opt.key)}>{opt.label}</button>
          ))}
          {dateRange === "custom" && (
            <>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ ...inputStyle, padding: "5px 8px", fontSize: 12 }} />
              <span style={{ color: S.muted, fontSize: 12 }}>to</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ ...inputStyle, padding: "5px 8px", fontSize: 12 }} />
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: S.muted, marginRight: 4 }}>Type</span>
          {["all", "in", "out"].map(k => (
            <button key={k} onClick={() => setFilterDir(k)} style={smallPill(filterDir === k)}>
              {k === "all" ? "All" : k === "in" ? "Money in" : "Money out"}
            </button>
          ))}
          {accounts.length > 0 && (
            <>
              <span style={{ width: 1, height: 18, background: S.rule, margin: "0 8px" }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: S.muted, marginRight: 4 }}>Account</span>
              <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)} style={{ ...inputStyle, padding: "5px 10px", fontSize: 12 }}>
                <option value="all">All accounts</option>
                <option value="none">Untagged</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </>
          )}
          <span style={{ flex: 1 }} />
          <button onClick={() => window.print()} style={{ ...btnGhost, padding: "6px 14px", fontSize: 12 }} title="Print or save as PDF">🖨 Print</button>
        </div>
      </div>

      <div className="print-only-header" style={{ display: "none", marginBottom: 14 }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", margin: 0, color: S.slate }}>Ledger — {rangeLabel}</h2>
        <div style={{ fontSize: 12, color: S.muted, marginTop: 4 }}>
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"} ·
          In {fmt(filteredTotals.in)} · Out {fmt(filteredTotals.out)} · Net {fmt(filteredTotals.net)}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, color: S.muted }}>
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"} · <strong style={{ color: S.slate }}>{rangeLabel}</strong>
        </div>
        <div style={{ fontSize: 13, color: S.muted, display: "flex", gap: 14, flexWrap: "wrap" }}>
          <span>In <strong style={{ color: S.green }}>{fmt(filteredTotals.in)}</strong></span>
          <span>Out <strong style={{ color: S.red }}>{fmt(filteredTotals.out)}</strong></span>
          <span>Net <strong style={{ color: filteredTotals.net >= 0 ? S.green : S.red }}>{fmt(filteredTotals.net)}</strong></span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty msg="No entries yet. Add your first one above." />
      ) : (
        <div style={{ background: "#fff", border: `1px solid ${S.rule}`, borderRadius: 14, overflow: "hidden" }}>
          {filtered.map((e, i) => (
            <div key={e.id} className="ledger-entry-row" style={{ display: "grid", gridTemplateColumns: "90px 1fr 220px 130px 30px", gap: 14, padding: "12px 18px", alignItems: "center", borderTop: i === 0 ? "none" : `1px solid ${S.rule}`, opacity: e.reconciliation_id ? 0.7 : 1 }}>
              <div style={{ fontSize: 13, color: S.muted, fontVariantNumeric: "tabular-nums" }}>
                {e.entry_date}
                {e.reconciliation_id && <span title="Reconciled" style={{ color: S.green, marginLeft: 4 }}>✓</span>}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{e.description}</div>
                {e.category && <div style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>{e.category}</div>}
              </div>
              <div style={{ fontSize: 12, color: S.muted, display: "flex", flexWrap: "wrap", gap: 2 }}>
                {e.account_id && accountById[e.account_id] && <span style={tag(S.slate)}>{accountById[e.account_id].name}</span>}
                {e.donor_id && donorById[e.donor_id] && <span style={tag(S.gold)}>{donorById[e.donor_id].name}</span>}
                {e.fund_id && fundById[e.fund_id] && <span style={tag(fundById[e.fund_id].color || S.slate)}>{fundById[e.fund_id].name}</span>}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, textAlign: "right", color: e.direction === "in" ? S.green : S.red, fontVariantNumeric: "tabular-nums" }}>
                {e.direction === "in" ? "+" : "−"}{fmt(e.amount_cents)}
              </div>
              <button className="ledger-row-delete" onClick={() => { if (confirm("Delete this entry?")) onDelete(e.id); }} style={iconBtn} title="Delete">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Funds Tab ---------- */
function FundsTab({ funds, entries, onAdd, onUpdate, onArchive }) {
  const [showAdd, setShowAdd] = useState(funds.length === 0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isRestricted, setIsRestricted] = useState(false);
  const [targetAmount, setTargetAmount] = useState("");
  const [color, setColor] = useState(FUND_COLORS[0]);

  const balances = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!e.fund_id) continue;
      if (!map[e.fund_id]) map[e.fund_id] = 0;
      map[e.fund_id] += (e.direction === "in" ? 1 : -1) * (e.amount_cents || 0);
    }
    return map;
  }, [entries]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd({
      name: name.trim(),
      description: description.trim() || null,
      is_restricted: isRestricted,
      target_amount_cents: targetAmount ? parseDollars(targetAmount) : null,
      color,
    });
    setName(""); setDescription(""); setIsRestricted(false); setTargetAmount(""); setColor(FUND_COLORS[funds.length % FUND_COLORS.length]);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ color: S.muted, fontSize: 14, margin: 0, maxWidth: 540 }}>
          Funds are dedicated buckets — General, Building, Jail Ministry, Vehicle Replacement.
          Tag entries to a fund and see the balance roll up automatically.
        </p>
        {!showAdd && <button onClick={() => setShowAdd(true)} style={btnPrimary}>+ New fund</button>}
      </div>

      {showAdd && (
        <form onSubmit={submit} style={{ background: "#fff", border: `1px solid ${S.rule}`, borderRadius: 14, padding: 20, marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input placeholder="Fund name (e.g. General, Building, Jail Ministry)" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
            <input placeholder="Goal $ (optional)" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} style={inputStyle} />
            <select value={color} onChange={e => setColor(e.target.value)} style={{ ...inputStyle, color }}>
              {FUND_COLORS.map(c => <option key={c} value={c} style={{ color: c }}>● {c}</option>)}
            </select>
          </div>
          <input placeholder="What is this fund for? (optional)" value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, width: "100%", marginBottom: 10 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: S.slate, cursor: "pointer" }}>
              <input type="checkbox" checked={isRestricted} onChange={e => setIsRestricted(e.target.checked)} />
              Restricted (donor specified this purpose)
            </label>
            <span style={{ flex: 1 }} />
            <button type="button" onClick={() => setShowAdd(false)} style={btnGhost}>Cancel</button>
            <button type="submit" style={btnPrimary}>Save fund</button>
          </div>
        </form>
      )}

      {funds.length === 0 && !showAdd ? (
        <Empty msg="No funds yet. Create one to start tracking dedicated balances." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {funds.map(f => {
            const bal = balances[f.id] || 0;
            const goal = f.target_amount_cents || 0;
            const pct = goal ? Math.min(100, Math.max(0, (bal / goal) * 100)) : 0;
            return (
              <div key={f.id} style={{ background: "#fff", border: `1px solid ${S.rule}`, borderTop: `4px solid ${f.color}`, borderRadius: 14, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: S.slate }}>{f.name}</div>
                  {f.is_restricted && <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: S.gold, background: "#faf3da", padding: "3px 8px", borderRadius: 999 }}>Restricted</span>}
                </div>
                {f.description && <div style={{ fontSize: 13, color: S.muted, marginBottom: 12 }}>{f.description}</div>}
                <div style={{ fontSize: 26, fontWeight: 600, color: bal >= 0 ? S.slate : S.red, fontVariantNumeric: "tabular-nums" }}>{fmt(bal)}</div>
                {goal > 0 && (
                  <>
                    <div style={{ fontSize: 12, color: S.muted, marginTop: 4 }}>Goal {fmt(goal)} · {pct.toFixed(0)}%</div>
                    <div style={{ height: 6, background: S.cream, borderRadius: 999, marginTop: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: f.color, borderRadius: 999 }} />
                    </div>
                  </>
                )}
                <div style={{ marginTop: 14, display: "flex", gap: 6 }}>
                  <button onClick={() => { const n = prompt("Rename fund:", f.name); if (n && n.trim()) onUpdate(f.id, { name: n.trim() }); }} style={iconBtnSubtle}>Rename</button>
                  <button onClick={() => { if (confirm("Archive this fund? Entries keep their fund tag but the fund leaves the list.")) onArchive(f.id); }} style={iconBtnSubtle}>Archive</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Donors Tab ---------- */
function DonorsTab({ donors, entries, onAdd, onDelete }) {
  const [showAdd, setShowAdd] = useState(donors.length === 0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const totalsByDonor = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!e.donor_id || e.direction !== "in") continue;
      if (!map[e.donor_id]) map[e.donor_id] = { total: 0, last: null, count: 0 };
      map[e.donor_id].total += (e.amount_cents || 0);
      map[e.donor_id].count += 1;
      if (!map[e.donor_id].last || e.entry_date > map[e.donor_id].last) map[e.donor_id].last = e.entry_date;
    }
    return map;
  }, [entries]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, notes: notes.trim() || null });
    setName(""); setEmail(""); setPhone(""); setNotes("");
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ color: S.muted, fontSize: 14, margin: 0, maxWidth: 540 }}>
          Track donors (or customers — same idea). Tag entries with a donor and totals roll up here.
        </p>
        {!showAdd && <button onClick={() => setShowAdd(true)} style={btnPrimary}>+ New donor</button>}
      </div>

      {showAdd && (
        <form onSubmit={submit} style={{ background: "#fff", border: `1px solid ${S.rule}`, borderRadius: 14, padding: 20, marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
            <input placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
          </div>
          <input placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, width: "100%", marginBottom: 12 }} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={() => setShowAdd(false)} style={btnGhost}>Cancel</button>
            <button type="submit" style={btnPrimary}>Save donor</button>
          </div>
        </form>
      )}

      {donors.length === 0 && !showAdd ? (
        <Empty msg="No donors yet. Add one to start tracking gifts by person." />
      ) : (
        <div style={{ background: "#fff", border: `1px solid ${S.rule}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 100px 120px 110px 30px", gap: 12, padding: "10px 18px", fontSize: 11, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: S.muted, background: S.paper, borderBottom: `1px solid ${S.rule}` }}>
            <div>Name</div><div>Contact</div><div style={{ textAlign: "right" }}>Gifts</div><div style={{ textAlign: "right" }}>Total</div><div style={{ textAlign: "right" }}>Last</div><div />
          </div>
          {donors.map(d => {
            const t = totalsByDonor[d.id] || { total: 0, last: null, count: 0 };
            return (
              <div key={d.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 100px 120px 110px 30px", gap: 12, padding: "14px 18px", alignItems: "center", borderTop: `1px solid ${S.rule}` }}>
                <div style={{ fontWeight: 500 }}>{d.name}{d.notes && <div style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>{d.notes}</div>}</div>
                <div style={{ fontSize: 13, color: S.muted }}>{d.email}{d.email && d.phone ? " · " : ""}{d.phone}</div>
                <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{t.count}</div>
                <div style={{ textAlign: "right", fontWeight: 600, color: S.green, fontVariantNumeric: "tabular-nums" }}>{fmt(t.total)}</div>
                <div style={{ textAlign: "right", fontSize: 13, color: S.muted, fontVariantNumeric: "tabular-nums" }}>{t.last || "—"}</div>
                <button onClick={() => { if (confirm(`Delete ${d.name}? Their gift entries stay but lose the donor tag.`)) onDelete(d.id); }} style={iconBtn}>×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Campaigns Tab ---------- */
function CampaignsTab({ campaigns, entries, funds, onAdd, onUpdate }) {
  const [showAdd, setShowAdd] = useState(campaigns.length === 0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [fundId, setFundId] = useState("");

  const raisedByCampaign = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!e.campaign_id || e.direction !== "in") continue;
      map[e.campaign_id] = (map[e.campaign_id] || 0) + (e.amount_cents || 0);
    }
    return map;
  }, [entries]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd({
      name: name.trim(),
      description: description.trim() || null,
      goal_cents: goal ? parseDollars(goal) : null,
      ends_on: endsOn || null,
      fund_id: fundId || null,
      starts_on: todayISO(),
    });
    setName(""); setDescription(""); setGoal(""); setEndsOn(""); setFundId("");
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ color: S.muted, fontSize: 14, margin: 0, maxWidth: 540 }}>
          Fundraising campaigns — set a goal, tag incoming gifts to the campaign, watch progress.
          Each campaign can optionally feed a specific fund.
        </p>
        {!showAdd && <button onClick={() => setShowAdd(true)} style={btnPrimary}>+ New campaign</button>}
      </div>

      {showAdd && (
        <form onSubmit={submit} style={{ background: "#fff", border: `1px solid ${S.rule}`, borderRadius: 14, padding: 20, marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input placeholder="Campaign name (e.g. Spring Appeal, New Van)" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
            <input placeholder="Goal $" value={goal} onChange={e => setGoal(e.target.value)} style={inputStyle} />
            <input type="date" placeholder="Ends" value={endsOn} onChange={e => setEndsOn(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 12 }}>
            <input placeholder="What's this campaign for? (optional)" value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} />
            <select value={fundId} onChange={e => setFundId(e.target.value)} style={inputStyle}>
              <option value="">— Not tied to a fund —</option>
              {funds.map(f => <option key={f.id} value={f.id}>Feeds: {f.name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={() => setShowAdd(false)} style={btnGhost}>Cancel</button>
            <button type="submit" style={btnPrimary}>Save campaign</button>
          </div>
        </form>
      )}

      {campaigns.length === 0 && !showAdd ? (
        <Empty msg="No campaigns yet. Start one to set a goal and track progress." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {campaigns.map(c => {
            const raised = raisedByCampaign[c.id] || 0;
            const goal = c.goal_cents || 0;
            const pct = goal ? Math.min(100, Math.max(0, (raised / goal) * 100)) : 0;
            return (
              <div key={c.id} style={{ background: "#fff", border: `1px solid ${S.rule}`, borderRadius: 14, padding: 20, opacity: c.is_active ? 1 : 0.6 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 17, color: S.slate }}>{c.name}</div>
                  {!c.is_active && <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: S.muted }}>Closed</span>}
                </div>
                {c.description && <div style={{ fontSize: 13, color: S.muted, marginBottom: 12 }}>{c.description}</div>}
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
                  <div style={{ fontSize: 26, fontWeight: 600, color: S.green, fontVariantNumeric: "tabular-nums" }}>{fmt(raised)}</div>
                  {goal > 0 && <div style={{ fontSize: 13, color: S.muted }}>of {fmt(goal)}</div>}
                </div>
                {goal > 0 && (
                  <>
                    <div style={{ height: 8, background: S.cream, borderRadius: 999, marginTop: 10, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: S.green, borderRadius: 999 }} />
                    </div>
                    <div style={{ fontSize: 12, color: S.muted, marginTop: 6 }}>{pct.toFixed(0)}% of goal {c.ends_on && `· ends ${c.ends_on}`}</div>
                  </>
                )}
                <div style={{ marginTop: 14, display: "flex", gap: 6 }}>
                  <button onClick={() => onUpdate(c.id, { is_active: !c.is_active })} style={iconBtnSubtle}>{c.is_active ? "Close" : "Reopen"}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Accounts Tab ---------- */
function AccountsTab({ accounts, entries, reconciliations, onAdd, onUpdate, onArchive, onReconcile }) {
  const [showAdd, setShowAdd] = useState(accounts.length === 0);
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("bank");
  const [institution, setInstitution] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [opening, setOpening] = useState("");

  const balanceByAccount = useMemo(() => {
    const map = {};
    for (const a of accounts) map[a.id] = a.opening_balance_cents || 0;
    for (const e of entries) {
      if (!e.account_id || !(e.account_id in map)) continue;
      map[e.account_id] += (e.direction === "in" ? 1 : -1) * (e.amount_cents || 0);
    }
    return map;
  }, [accounts, entries]);

  const unreconciledCountByAccount = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!e.account_id || e.reconciliation_id) continue;
      map[e.account_id] = (map[e.account_id] || 0) + 1;
    }
    return map;
  }, [entries]);

  const lastReconciledByAccount = useMemo(() => {
    const map = {};
    for (const r of reconciliations) {
      if (!map[r.account_id] || r.statement_ending_date > map[r.account_id]) {
        map[r.account_id] = r.statement_ending_date;
      }
    }
    return map;
  }, [reconciliations]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd({
      name: name.trim(),
      account_type: accountType,
      institution: institution.trim() || null,
      last_four: lastFour.trim() || null,
      opening_balance_cents: opening ? parseDollars(opening) : 0,
    });
    setName(""); setInstitution(""); setLastFour(""); setOpening(""); setAccountType("bank");
  };

  const typeLabel = (t) => ({ bank: "Bank account", credit_card: "Credit card", cash: "Cash", other: "Other" }[t] || t);

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ color: S.muted, fontSize: 14, margin: 0, maxWidth: 540 }}>
          Bank accounts and credit cards. Tag each entry to an account so balances stay accurate,
          then reconcile against monthly statements.
        </p>
        {!showAdd && <button onClick={() => setShowAdd(true)} style={btnPrimary}>+ New account</button>}
      </div>

      {showAdd && (
        <form onSubmit={submit} style={{ background: "#fff", border: `1px solid ${S.rule}`, borderRadius: 14, padding: 20, marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input placeholder="Account name (e.g. Wells Fargo Checking, Business Visa)" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
            <select value={accountType} onChange={e => setAccountType(e.target.value)} style={inputStyle}>
              <option value="bank">Bank account</option>
              <option value="credit_card">Credit card</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
            <input placeholder="Institution (optional)" value={institution} onChange={e => setInstitution(e.target.value)} style={inputStyle} />
            <input placeholder="Last 4 (optional)" maxLength={4} value={lastFour} onChange={e => setLastFour(e.target.value.replace(/\D/g, ""))} style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input placeholder="Opening balance $ (optional)" value={opening} onChange={e => setOpening(e.target.value)} style={{ ...inputStyle, maxWidth: 220 }} />
            <span style={{ fontSize: 12, color: S.muted }}>Use the balance the day before your first entry, or leave at $0.</span>
            <span style={{ flex: 1 }} />
            <button type="button" onClick={() => setShowAdd(false)} style={btnGhost}>Cancel</button>
            <button type="submit" style={btnPrimary}>Save account</button>
          </div>
        </form>
      )}

      {accounts.length === 0 && !showAdd ? (
        <Empty msg="No accounts yet. Add one to start tracking balances and reconciling statements." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {accounts.map(a => {
            const bal = balanceByAccount[a.id] || 0;
            const unrec = unreconciledCountByAccount[a.id] || 0;
            const lastRec = lastReconciledByAccount[a.id];
            const accent = a.account_type === "credit_card" ? S.red : a.account_type === "cash" ? S.gold : S.green;
            return (
              <div key={a.id} style={{ background: "#fff", border: `1px solid ${S.rule}`, borderTop: `4px solid ${accent}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: S.muted, marginBottom: 4 }}>{typeLabel(a.account_type)}</div>
                <div style={{ fontWeight: 600, fontSize: 17, color: S.slate, marginBottom: 2 }}>{a.name}</div>
                {(a.institution || a.last_four) && (
                  <div style={{ fontSize: 12, color: S.muted, marginBottom: 12 }}>
                    {a.institution}{a.institution && a.last_four ? " · " : ""}{a.last_four && `••${a.last_four}`}
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: S.muted, marginTop: 12 }}>
                  {a.account_type === "credit_card" ? "Balance owed" : "Current balance"}
                </div>
                <div style={{ fontSize: 28, fontWeight: 600, color: bal >= 0 ? S.slate : S.red, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{fmt(bal)}</div>
                <div style={{ display: "flex", gap: 14, fontSize: 12, color: S.muted, marginTop: 10 }}>
                  <span><strong style={{ color: unrec > 0 ? S.orange : S.muted }}>{unrec}</strong> unreconciled</span>
                  <span>Last rec: {lastRec || "never"}</span>
                </div>
                <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => onReconcile(a.id)} style={{ ...btnPrimary, padding: "7px 14px", fontSize: 12 }}>Reconcile →</button>
                  <button onClick={() => { const n = prompt("Rename account:", a.name); if (n && n.trim()) onUpdate(a.id, { name: n.trim() }); }} style={iconBtnSubtle}>Rename</button>
                  <button onClick={() => { if (confirm("Archive this account? Entries tagged to it stay.")) onArchive(a.id); }} style={iconBtnSubtle}>Archive</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Reconcile View ---------- */
function ReconcileView({ account, entries, reconciliations, onClose, onCommit }) {
  const [statementDate, setStatementDate] = useState(todayISO());
  const [statementBalance, setStatementBalance] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  // Previously reconciled balance = opening + net of already-reconciled entries
  const previouslyReconciledNet = useMemo(() => {
    return entries
      .filter(e => e.reconciliation_id)
      .reduce((s, e) => s + (e.direction === "in" ? 1 : -1) * (e.amount_cents || 0), 0);
  }, [entries]);
  const previousBalance = (account?.opening_balance_cents || 0) + previouslyReconciledNet;

  const unreconciled = useMemo(() => {
    return entries
      .filter(e => !e.reconciliation_id)
      .sort((a, b) => (a.entry_date || "").localeCompare(b.entry_date || ""));
  }, [entries]);

  const selectedNet = useMemo(() => {
    let s = 0;
    for (const e of unreconciled) {
      if (selected.has(e.id)) s += (e.direction === "in" ? 1 : -1) * (e.amount_cents || 0);
    }
    return s;
  }, [selected, unreconciled]);

  const computedEnding = previousBalance + selectedNet;
  const statementCents = parseDollars(statementBalance);
  const difference = statementCents - computedEnding;
  const matched = statementBalance !== "" && difference === 0 && selected.size > 0;

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(unreconciled.map(e => e.id)));
  const selectNone = () => setSelected(new Set());

  const handleCommit = async () => {
    if (!matched || busy) return;
    setBusy(true);
    await onCommit({
      statementEndingDate: statementDate,
      statementEndingBalanceCents: statementCents,
      entryIds: Array.from(selected),
      notes,
    });
  };

  if (!account) return null;
  const lastRec = reconciliations[0];

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={btnGhost}>← Back to accounts</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: S.muted }}>Reconciling</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: S.slate }}>{account.name}</div>
        </div>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${S.rule}`, borderRadius: 14, padding: 22, marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 14, alignItems: "end" }}>
          <div>
            <label style={labelStyle}>Statement ending date</label>
            <input type="date" value={statementDate} onChange={e => setStatementDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </div>
          <div>
            <label style={labelStyle}>Statement ending balance</label>
            <input placeholder="$0.00" value={statementBalance} onChange={e => setStatementBalance(e.target.value)} style={{ ...inputStyle, width: "100%", textAlign: "right" }} />
          </div>
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <input placeholder="e.g. Jan 2026 Wells Fargo statement" value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </div>
        </div>

        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          <RecStat label="Previously reconciled" value={fmt(previousBalance)} hint={lastRec ? `as of ${lastRec.statement_ending_date}` : "starting balance"} />
          <RecStat label={`Selected (${selected.size})`} value={`${selectedNet >= 0 ? "+" : "−"}${fmt(Math.abs(selectedNet))}`} accent={selectedNet >= 0 ? S.green : S.red} />
          <RecStat label="Will bring balance to" value={fmt(computedEnding)} accent={S.slate} />
          <RecStat
            label="Difference vs. statement"
            value={statementBalance === "" ? "—" : fmt(Math.abs(difference))}
            accent={statementBalance === "" ? S.muted : difference === 0 ? S.green : S.red}
            hint={statementBalance === "" ? "" : difference === 0 ? "Matched ✓" : difference > 0 ? "Short — pick more" : "Over — uncheck some"}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, color: S.muted }}>{unreconciled.length} unreconciled {unreconciled.length === 1 ? "entry" : "entries"} for this account</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={selectAll} style={iconBtnSubtle}>Select all</button>
          <button onClick={selectNone} style={iconBtnSubtle}>Select none</button>
        </div>
      </div>

      {unreconciled.length === 0 ? (
        <Empty msg="Nothing unreconciled here. Tag some ledger entries to this account first." />
      ) : (
        <div style={{ background: "#fff", border: `1px solid ${S.rule}`, borderRadius: 14, overflow: "hidden", marginBottom: 18 }}>
          {unreconciled.map((e, i) => {
            const isSelected = selected.has(e.id);
            return (
              <label key={e.id} style={{ display: "grid", gridTemplateColumns: "30px 90px 1fr 130px", gap: 14, padding: "12px 18px", alignItems: "center", borderTop: i === 0 ? "none" : `1px solid ${S.rule}`, cursor: "pointer", background: isSelected ? S.orangeLight : "transparent" }}>
                <input type="checkbox" checked={isSelected} onChange={() => toggle(e.id)} />
                <div style={{ fontSize: 13, color: S.muted, fontVariantNumeric: "tabular-nums" }}>{e.entry_date}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{e.description}{e.category && <span style={{ color: S.muted, fontWeight: 400 }}> · {e.category}</span>}</div>
                <div style={{ fontSize: 14, fontWeight: 600, textAlign: "right", color: e.direction === "in" ? S.green : S.red, fontVariantNumeric: "tabular-nums" }}>
                  {e.direction === "in" ? "+" : "−"}{fmt(e.amount_cents)}
                </div>
              </label>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={btnGhost}>Cancel</button>
        <button
          onClick={handleCommit}
          disabled={!matched || busy}
          style={{
            ...btnPrimary,
            background: matched ? S.green : S.rule,
            cursor: matched ? "pointer" : "not-allowed",
            padding: "11px 22px",
          }}
        >
          {busy ? "Saving..." : matched ? `Mark ${selected.size} entries reconciled` : "Match the statement first"}
        </button>
      </div>
    </div>
  );
}

function RecStat({ label, value, accent, hint }) {
  return (
    <div style={{ background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: S.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: accent || S.slate, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "#7a7585",
  marginBottom: 6,
};

/* ---------- Helpers ---------- */
function Empty({ msg }) {
  return <div style={{ padding: 48, textAlign: "center", color: S.muted, fontSize: 14, background: "#fff", border: `1px dashed ${S.rule}`, borderRadius: 14 }}>{msg}</div>;
}

const inputStyle = {
  fontFamily: "inherit", fontSize: 14,
  padding: "10px 12px",
  border: `1px solid ${S.rule}`,
  borderRadius: 8,
  background: "#fff",
  color: S.ink,
  outline: "none",
};

const btnPrimary = {
  background: S.orange, color: "#fff", border: "none",
  padding: "9px 18px", borderRadius: 999, fontFamily: "inherit",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
};

const btnGhost = {
  background: "transparent", color: S.slate, border: `1px solid ${S.rule}`,
  padding: "9px 18px", borderRadius: 999, fontFamily: "inherit",
  fontSize: 13, fontWeight: 500, cursor: "pointer",
};

const iconBtn = {
  background: "transparent", border: "none", color: S.muted,
  fontSize: 20, cursor: "pointer", padding: 0, lineHeight: 1,
};
const iconBtnSubtle = {
  background: "transparent", border: `1px solid ${S.rule}`, color: S.muted,
  padding: "5px 10px", borderRadius: 999, fontFamily: "inherit",
  fontSize: 11, fontWeight: 500, cursor: "pointer",
  textTransform: "uppercase", letterSpacing: ".08em",
};

function pill(active, color, lightColor) {
  return {
    padding: "7px 14px", borderRadius: 999, border: `1.5px solid ${active ? color : S.rule}`,
    background: active ? lightColor : "#fff", color: active ? color : S.muted,
    cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
  };
}
function smallPill(active) {
  return {
    padding: "5px 12px", borderRadius: 999, border: `1px solid ${active ? S.orange : S.rule}`,
    background: active ? S.orangeLight : "#fff", color: active ? S.orangeDark : S.muted,
    cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 500,
  };
}
function tag(color) {
  return {
    display: "inline-block", padding: "2px 8px", fontSize: 11, fontWeight: 600,
    borderRadius: 999, color, background: `${color}15`, marginRight: 4,
  };
}
