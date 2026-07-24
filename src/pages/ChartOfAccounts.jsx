import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const S = {
  orange: "#0080ff", orangeLight: "#e6f0ff", slate: "#0a0a14",
  slateLight: "#f7f9fc", muted: "#64748b", border: "#e2e8f0",
  green: "#22c55e", greenLight: "#f0fdf4", red: "#ef4444",
  white: "#ffffff",
};

const MONTHLY_URL = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";
const ANNUAL_URL = "https://buy.stripe.com/14A5kD4B981AgTxcuM18c09";

const TYPES = [
  {
    type: "Assets",
    range: "1000–1999",
    color: "#0052cc",
    bg: "#e6f0ff",
    border: "#cce6ff",
    what: "Everything your business owns or is owed.",
    examples: [
      { num: "1000", name: "Checking Account" },
      { num: "1010", name: "Savings Account" },
      { num: "1100", name: "Accounts Receivable" },
      { num: "1200", name: "Inventory" },
      { num: "1500", name: "Equipment" },
      { num: "1510", name: "Accumulated Depreciation" },
    ],
  },
  {
    type: "Liabilities",
    range: "2000–2999",
    color: "#ef4444",
    bg: "#fff1f1",
    border: "#fecaca",
    what: "Everything your business owes to others.",
    examples: [
      { num: "2000", name: "Accounts Payable" },
      { num: "2100", name: "Credit Card Payable" },
      { num: "2200", name: "Payroll Liabilities" },
      { num: "2300", name: "Sales Tax Payable" },
      { num: "2500", name: "Loans Payable" },
      { num: "2600", name: "Deferred Revenue" },
    ],
  },
  {
    type: "Equity",
    range: "3000–3999",
    color: "#ff2d8a",
    bg: "#fff0f7",
    border: "#ffc2dd",
    what: "Owner's stake in the business — what's left after liabilities.",
    examples: [
      { num: "3000", name: "Owner's Equity / Retained Earnings" },
      { num: "3100", name: "Owner's Draw" },
      { num: "3200", name: "Owner's Contributions" },
      { num: "3900", name: "Net Income (auto-calculated in QBO)" },
    ],
  },
  {
    type: "Income",
    range: "4000–4999",
    color: "#22c55e",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    what: "All revenue your business earns.",
    examples: [
      { num: "4000", name: "Services Revenue" },
      { num: "4100", name: "Product Sales" },
      { num: "4200", name: "Consulting Income" },
      { num: "4300", name: "Grant Income" },
      { num: "4900", name: "Other Income" },
    ],
  },
  {
    type: "Expenses",
    range: "5000–9999",
    color: "#0080ff",
    bg: "#e6f0ff",
    border: "#cce6ff",
    what: "Everything it costs to run the business. COGS lives here too (5000s).",
    examples: [
      { num: "5000", name: "Cost of Goods Sold / Direct Labor" },
      { num: "6000", name: "Payroll Expense" },
      { num: "6100", name: "Rent / Occupancy" },
      { num: "6200", name: "Software & Subscriptions" },
      { num: "6300", name: "Marketing & Advertising" },
      { num: "6400", name: "Professional Fees (CPA, Legal)" },
      { num: "6500", name: "Insurance" },
      { num: "6600", name: "Office Supplies" },
      { num: "6700", name: "Meals & Entertainment" },
      { num: "6800", name: "Vehicle / Mileage" },
      { num: "7000", name: "Depreciation Expense" },
    ],
  },
];

const RULES = [
  { rule: "Number every account", detail: "Don't name accounts without numbers. Numbers make reports sortable and structured. QBO defaults to this — keep it." },
  { rule: "Leave gaps in your numbering", detail: "Don't use 6000, 6001, 6002. Use 6000, 6100, 6200. You'll add accounts later and you'll want room." },
  { rule: "Don't over-categorize", detail: "One account for Meals & Entertainment is enough. You don't need one per team member or per quarter. More accounts = more confusion, not more insight." },
  { rule: "Keep COGS separate from overhead", detail: "Costs that go up and down with your revenue (direct labor, materials) belong in COGS. Fixed costs (rent, software) belong in Expenses. Mixing them destroys your margins." },
  { rule: "Never use 'Miscellaneous' as a real account", detail: "It's a holding pen, not a category. If something keeps landing in Misc, it's telling you it needs its own account." },
  { rule: "Owner draws are NOT a business expense", detail: "Pulling money out of the business? That's an equity account (Owner's Draw), not an expense. Booking it as expense inflates your costs and understates profit." },
];

export default function ChartOfAccounts({ session }) {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://chat.karikounkel.com/widget.js";
    script.defer = true;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    async function checkMember() {
      if (!session) { setLoading(false); return; }
      try {
        const { data } = await supabase.from("members").select("plan").eq("email", session.user.email).single();
        setIsMember(!!data);
      } catch (_) { setIsMember(false); }
      setLoading(false);
    }
    checkMember();
  }, [session]);

  if (loading) return <div style={{ padding: "60px", textAlign: "center", color: S.muted }}>Loading...</div>;

  if (!isMember) return (
    <div style={{ minHeight: "100vh", background: S.slateLight, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "480px", width: "100%", background: S.white, borderRadius: "16px", padding: "40px 36px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>🔒</div>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: S.slate, marginBottom: "12px" }}>Members Only Tool</h2>
        <p style={{ color: S.muted, marginBottom: "28px", lineHeight: "1.65", fontSize: "15px" }}>Chart of Accounts Cheat Sheet is a CARES Works member tool. Understand the structure behind every number in your books.</p>
        <a href={MONTHLY_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.orange, color: S.white, padding: "14px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", marginBottom: "12px", fontSize: "16px" }}>Join for $27/month</a>
        <a href={ANNUAL_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.white, color: S.orange, padding: "12px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", border: "2px solid " + S.orange, fontSize: "15px" }}>$270/year — save 2 months</a>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px 60px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "8px" }}>
        <span style={{ background: S.orangeLight, color: S.orange, fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", border: "1px solid #cce6ff", textTransform: "uppercase", letterSpacing: "0.06em" }}>Money Tools</span>
      </div>
      <h1 style={{ fontSize: "30px", fontWeight: "800", color: S.slate, marginBottom: "10px" }}>Chart of Accounts Cheat Sheet</h1>
      <p style={{ color: S.muted, fontSize: "15px", lineHeight: "1.7", marginBottom: "32px", maxWidth: "640px" }}>
        Five account types. One numbering system. The structure that makes every report in your books make sense — or not.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {TYPES.map((t, i) => (
          <div key={i} style={{ background: S.white, border: "2px solid " + t.border, borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ background: t.bg, padding: "14px 18px", borderBottom: "1px solid " + t.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ color: t.color, fontSize: "16px", fontWeight: "800", margin: 0 }}>{t.type}</h2>
              <span style={{ background: t.color, color: S.white, fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "12px" }}>{t.range}</span>
            </div>
            <div style={{ padding: "14px 18px" }}>
              <p style={{ color: S.muted, fontSize: "13px", lineHeight: "1.5", marginBottom: "12px" }}>{t.what}</p>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ background: "none", border: "none", color: t.color, fontSize: "12px", fontWeight: "700", cursor: "pointer", padding: 0, marginBottom: open === i ? "12px" : 0 }}
              >
                {open === i ? "Hide examples ↑" : "Show examples ↓"}
              </button>
              {open === i && (
                <div>
                  {t.examples.map((ex, j) => (
                    <div key={j} style={{ display: "flex", gap: "12px", padding: "7px 0", borderBottom: j < t.examples.length - 1 ? "1px solid " + S.border : "none" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "12px", color: t.color, fontWeight: "700", minWidth: "36px" }}>{ex.num}</span>
                      <span style={{ fontSize: "13px", color: S.slate }}>{ex.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ background: S.slate, padding: "14px 20px" }}>
          <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>6 Rules for a Clean Chart of Accounts</h2>
        </div>
        {RULES.map((r, i) => (
          <div key={i} style={{ padding: "16px 20px", borderBottom: i < RULES.length - 1 ? "1px solid " + S.border : "none", background: i % 2 === 0 ? S.white : S.slateLight }}>
            <p style={{ margin: "0 0 5px", fontSize: "14px", fontWeight: "700", color: S.slate }}>{r.rule}</p>
            <p style={{ margin: 0, fontSize: "13px", color: S.muted, lineHeight: "1.6" }}>{r.detail}</p>
          </div>
        ))}
      </div>

      <div style={{ background: S.orangeLight, border: "1px solid #cce6ff", borderRadius: "12px", padding: "18px 22px" }}>
        <p style={{ margin: 0, color: S.orange, fontSize: "14px", fontWeight: "600", lineHeight: "1.6" }}>
          Your chart of accounts is a mess and you're not sure where to start cleaning? Hit Ask Kari. Bring a list of your current accounts and we'll sort it out.
        </p>
      </div>
    </div>
  );
}
