import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const S = {
  orange: "#E8500A", orangeLight: "#FFF4EE", slate: "#1E293B",
  slateLight: "#F8FAFC", muted: "#64748B", border: "#E2E8F0",
  green: "#15803D", greenLight: "#F0FDF4", red: "#DC2626",
  white: "#FFFFFF",
};

const MONTHLY_URL = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";
const ANNUAL_URL = "https://buy.stripe.com/14A5kD4B981AgTxcuM18c09";

const RATIOS = [
  {
    name: "Net Profit Margin",
    formula: "Net Profit ÷ Revenue × 100",
    what: "The percentage of revenue left after every expense — including taxes.",
    example: "You bring in $200,000. After all expenses you keep $30,000. Net margin = 15%.",
    good: "Service businesses: 15–30%. Retail: 2–6%. Restaurants: 3–9%. If you're above your industry average, you're doing something right.",
    flag: "Below 5% with no clear reason (growth phase, one-time cost) is a warning sign.",
  },
  {
    name: "Gross Profit Margin",
    formula: "(Revenue − Cost of Goods Sold) ÷ Revenue × 100",
    what: "What's left after direct costs — before overhead, taxes, and owner pay.",
    example: "Revenue: $200,000. COGS: $80,000. Gross margin = 60%.",
    good: "This is your operating headroom. Below 30% makes covering overhead very hard.",
    flag: "If gross margin is healthy but net is not, overhead is the problem — not pricing.",
  },
  {
    name: "Operating Profit Margin",
    formula: "Operating Income ÷ Revenue × 100",
    what: "Profit from core operations — excludes interest, taxes, one-time items.",
    example: "Operating income: $40,000. Revenue: $200,000. Operating margin = 20%.",
    good: "Useful for comparing yourself to industry peers. Strips out financing decisions.",
    flag: "If operating margin is fine but net is not — look at debt service and tax strategy.",
  },
];

const BENCHMARKS = [
  { industry: "Consulting / Professional Services", gross: "60–75%", net: "15–30%" },
  { industry: "Nonprofit / Human Services", gross: "50–70%", net: "3–10%" },
  { industry: "Retail", gross: "20–50%", net: "2–6%" },
  { industry: "Restaurant / Food Service", gross: "60–70%", net: "3–9%" },
  { industry: "Construction", gross: "20–35%", net: "2–8%" },
  { industry: "Healthcare / Home Health", gross: "30–50%", net: "5–15%" },
  { industry: "SaaS / Software", gross: "70–90%", net: "10–25%" },
];

const GATE = (
  <div style={{ minHeight: "100vh", background: S.slateLight, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
    <div style={{ maxWidth: "480px", width: "100%", background: S.white, borderRadius: "16px", padding: "40px 36px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: "52px", marginBottom: "16px" }}>🔒</div>
      <h2 style={{ fontSize: "22px", fontWeight: "800", color: S.slate, marginBottom: "12px" }}>Members Only Tool</h2>
      <p style={{ color: S.muted, marginBottom: "28px", lineHeight: "1.65", fontSize: "15px" }}>Net Profit Ratios is a CARES Works member tool. Know what your numbers actually mean — and what to do when they don't look right.</p>
      <a href={MONTHLY_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.orange, color: S.white, padding: "14px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", marginBottom: "12px", fontSize: "16px" }}>Join for $27/month</a>
      <a href={ANNUAL_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.white, color: S.orange, padding: "12px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", border: "2px solid " + S.orange, fontSize: "15px" }}>$270/year — save 2 months</a>
    </div>
  </div>
);

export default function NetProfitRatios({ session }) {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState("");
  const [cogs, setCogs] = useState("");
  const [expenses, setExpenses] = useState("");

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
  if (!isMember) return GATE;

  const rev = parseFloat(revenue) || 0;
  const cogsVal = parseFloat(cogs) || 0;
  const expVal = parseFloat(expenses) || 0;
  const grossProfit = rev - cogsVal;
  const netProfit = grossProfit - expVal;
  const grossMargin = rev ? ((grossProfit / rev) * 100).toFixed(1) : null;
  const netMargin = rev ? ((netProfit / rev) * 100).toFixed(1) : null;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px 60px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "8px" }}>
        <span style={{ background: S.orangeLight, color: S.orange, fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", border: "1px solid #FED7AA", textTransform: "uppercase", letterSpacing: "0.06em" }}>Money Tools</span>
      </div>
      <h1 style={{ fontSize: "30px", fontWeight: "800", color: S.slate, marginBottom: "10px" }}>Net Profit Ratios</h1>
      <p style={{ color: S.muted, fontSize: "15px", lineHeight: "1.7", marginBottom: "32px", maxWidth: "640px" }}>
        Three ratios. Three different views of the same business. Know how to read each one — and what it's actually telling you to do.
      </p>

      {RATIOS.map((r, i) => (
        <div key={i} style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", padding: "24px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "800", color: S.slate, margin: 0 }}>{r.name}</h2>
            <code style={{ background: S.slateLight, border: "1px solid " + S.border, padding: "4px 12px", borderRadius: "6px", fontSize: "13px", color: S.orange, fontWeight: "700", fontFamily: "monospace", whiteSpace: "nowrap" }}>{r.formula}</code>
          </div>
          <p style={{ color: S.slate, fontSize: "14px", lineHeight: "1.6", marginBottom: "10px" }}>{r.what}</p>
          <div style={{ background: S.slateLight, borderRadius: "8px", padding: "12px 16px", marginBottom: "10px" }}>
            <p style={{ margin: 0, color: S.muted, fontSize: "13px", lineHeight: "1.6" }}><strong style={{ color: S.slate }}>Example: </strong>{r.example}</p>
          </div>
          <p style={{ color: S.green, fontSize: "13px", lineHeight: "1.6", margin: "0 0 6px" }}>✅ {r.good}</p>
          <p style={{ color: S.red, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>⚠️ {r.flag}</p>
        </div>
      ))}

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ background: S.slate, padding: "14px 20px" }}>
          <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>Quick Margin Calculator</h2>
        </div>
        <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
          {[["Revenue", revenue, setRevenue], ["Cost of Goods Sold", cogs, setCogs], ["Operating Expenses", expenses, setExpenses]].map(([label, val, setter]) => (
            <div key={label}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: S.muted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
              <input
                type="number"
                value={val}
                onChange={(e) => setter(e.target.value)}
                placeholder="0"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid " + S.border, borderRadius: "8px", fontSize: "16px", color: S.slate, background: S.slateLight, boxSizing: "border-box", outline: "none" }}
              />
            </div>
          ))}
        </div>
        {rev > 0 && (
          <div style={{ padding: "0 20px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: S.greenLight, border: "1px solid #BBF7D0", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: S.green, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Gross Margin</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: S.green }}>{grossMargin}%</div>
            </div>
            <div style={{ background: parseFloat(netMargin) >= 10 ? S.greenLight : "#FFF1F1", border: "1px solid " + (parseFloat(netMargin) >= 10 ? "#BBF7D0" : "#FECACA"), borderRadius: "10px", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: parseFloat(netMargin) >= 10 ? S.green : S.red, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Net Margin</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: parseFloat(netMargin) >= 10 ? S.green : S.red }}>{netMargin}%</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ background: S.slate, padding: "14px 20px" }}>
          <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>Industry Benchmarks (Rough Guide)</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: S.slateLight }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: S.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Industry</th>
                <th style={{ padding: "10px 16px", textAlign: "center", fontSize: "12px", fontWeight: "700", color: S.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gross Margin</th>
                <th style={{ padding: "10px 16px", textAlign: "center", fontSize: "12px", fontWeight: "700", color: S.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Net Margin</th>
              </tr>
            </thead>
            <tbody>
              {BENCHMARKS.map((b, i) => (
                <tr key={i} style={{ borderTop: "1px solid " + S.border, background: i % 2 === 0 ? S.white : S.slateLight }}>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: S.slate }}>{b.industry}</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: S.green, fontWeight: "700", textAlign: "center" }}>{b.gross}</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: S.orange, fontWeight: "700", textAlign: "center" }}>{b.net}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: S.orangeLight, border: "1px solid #FED7AA", borderRadius: "12px", padding: "18px 22px" }}>
        <p style={{ margin: 0, color: S.orange, fontSize: "14px", fontWeight: "600", lineHeight: "1.6" }}>
          Your margins look off and you're not sure why? Hit Ask Kari. Bring your revenue, COGS, and total expenses and we'll figure out where the leak is.
        </p>
      </div>
    </div>
  );
}
