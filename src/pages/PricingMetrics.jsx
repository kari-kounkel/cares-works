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

const METRICS = [
  {
    name: "Gross Margin",
    formula: "(Price − Cost) ÷ Price × 100",
    what: "The percentage of the selling price left after covering direct costs. This is your room to breathe.",
    example: "You charge $500 for a service. Your direct cost to deliver it is $150. Gross margin = 70%.",
    note: "Gross margin is NOT markup. Confusing the two is one of the most common pricing mistakes.",
  },
  {
    name: "Markup",
    formula: "(Price − Cost) ÷ Cost × 100",
    what: "How much you've added on top of cost to arrive at your price. A useful way to set prices — not to report profitability.",
    example: "Cost: $150. Price: $500. Markup = 233%. Sounds huge. Margin is 70%. Both are correct. They measure different things.",
    note: "High markup does not mean high margin. You can have a 500% markup and still lose money if overhead is high enough.",
  },
  {
    name: "Break-Even Point",
    formula: "Fixed Costs ÷ Gross Margin %",
    what: "The revenue you need to cover all fixed costs before you make a single dollar of profit.",
    example: "Fixed costs: $8,000/month. Gross margin: 60%. Break-even = $13,333/month in revenue.",
    note: "Every dollar above break-even drops to the bottom line at your gross margin rate. Know this number.",
  },
  {
    name: "Price Per Unit / Hourly Rate Floor",
    formula: "(Fixed Costs + Desired Profit) ÷ Units or Hours",
    what: "The minimum you need to charge per unit or hour to hit your profit goal. This is your floor — not your ceiling.",
    example: "Fixed costs: $8,000. Profit goal: $4,000. Expected hours billable: 80/month. Floor rate = $150/hour.",
    note: "Most people set rates based on what the market charges. Start with what you need, then check the market.",
  },
  {
    name: "Customer Lifetime Value (LTV)",
    formula: "Average Purchase Value × Purchase Frequency × Customer Lifespan",
    what: "The total revenue one customer generates over their entire relationship with you. Changes how you think about acquisition cost.",
    example: "Client pays $500/month, stays 24 months. LTV = $12,000. Spending $300 to acquire them is a 40:1 return.",
    note: "If you don't know your LTV, you're guessing at what you can spend to get a customer. That's how you overspend or underinvest.",
  },
];

export default function PricingMetrics({ session }) {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [fixed, setFixed] = useState("");
  const [profitGoal, setProfitGoal] = useState("");
  const [units, setUnits] = useState("");

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
        <p style={{ color: S.muted, marginBottom: "28px", lineHeight: "1.65", fontSize: "15px" }}>Pricing Metrics is a CARES Works member tool. Stop guessing at your prices. Start calculating them.</p>
        <a href={MONTHLY_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.orange, color: S.white, padding: "14px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", marginBottom: "12px", fontSize: "16px" }}>Join for $27/month</a>
        <a href={ANNUAL_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.white, color: S.orange, padding: "12px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", border: "2px solid " + S.orange, fontSize: "15px" }}>$270/year — save 2 months</a>
      </div>
    </div>
  );

  const p = parseFloat(price) || 0;
  const c = parseFloat(cost) || 0;
  const f = parseFloat(fixed) || 0;
  const pg = parseFloat(profitGoal) || 0;
  const u = parseFloat(units) || 0;

  const grossMargin = p && c ? (((p - c) / p) * 100).toFixed(1) : null;
  const markup = p && c ? (((p - c) / c) * 100).toFixed(1) : null;
  const breakEven = f && grossMargin ? (f / (parseFloat(grossMargin) / 100)).toFixed(0) : null;
  const floor = f && u ? ((f + pg) / u).toFixed(2) : null;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px 60px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "8px" }}>
        <span style={{ background: S.orangeLight, color: S.orange, fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", border: "1px solid #cce6ff", textTransform: "uppercase", letterSpacing: "0.06em" }}>Money Tools</span>
      </div>
      <h1 style={{ fontSize: "30px", fontWeight: "800", color: S.slate, marginBottom: "10px" }}>Pricing Metrics</h1>
      <p style={{ color: S.muted, fontSize: "15px", lineHeight: "1.7", marginBottom: "32px", maxWidth: "640px" }}>
        Five metrics that tell you whether your prices are a guess or a decision. Formulas, examples, and a calculator to run your own numbers.
      </p>

      {METRICS.map((m, i) => (
        <div key={i} style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", padding: "22px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: "800", color: S.slate, margin: 0 }}>{m.name}</h2>
            <code style={{ background: S.slateLight, border: "1px solid " + S.border, padding: "4px 12px", borderRadius: "6px", fontSize: "12px", color: S.orange, fontWeight: "700", fontFamily: "monospace", whiteSpace: "nowrap" }}>{m.formula}</code>
          </div>
          <p style={{ color: S.slate, fontSize: "14px", lineHeight: "1.6", marginBottom: "10px" }}>{m.what}</p>
          <div style={{ background: S.slateLight, borderRadius: "8px", padding: "10px 14px", marginBottom: "10px" }}>
            <p style={{ margin: 0, color: S.muted, fontSize: "13px", lineHeight: "1.6" }}><strong style={{ color: S.slate }}>Example: </strong>{m.example}</p>
          </div>
          <p style={{ margin: 0, color: S.orange, fontSize: "13px", lineHeight: "1.6", fontStyle: "italic" }}>💡 {m.note}</p>
        </div>
      ))}

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ background: S.slate, padding: "14px 20px" }}>
          <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>Run Your Numbers</h2>
        </div>
        <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
          {[
            ["Selling Price", price, setPrice, "e.g. 500"],
            ["Direct Cost", cost, setCost, "e.g. 150"],
            ["Monthly Fixed Costs", fixed, setFixed, "e.g. 8000"],
            ["Profit Goal / Mo", profitGoal, setProfitGoal, "e.g. 4000"],
            ["Units or Hours / Mo", units, setUnits, "e.g. 80"],
          ].map(([label, val, setter, ph]) => (
            <div key={label}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: S.muted, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
              <input type="number" value={val} onChange={(e) => setter(e.target.value)} placeholder={ph}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid " + S.border, borderRadius: "8px", fontSize: "16px", color: S.slate, background: S.slateLight, boxSizing: "border-box", outline: "none" }} />
            </div>
          ))}
        </div>
        {(grossMargin || breakEven || floor) && (
          <div style={{ padding: "0 20px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
            {grossMargin && (
              <div style={{ background: S.greenLight, border: "1px solid #bbf7d0", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: S.green, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Gross Margin</div>
                <div style={{ fontSize: "26px", fontWeight: "800", color: S.green }}>{grossMargin}%</div>
              </div>
            )}
            {markup && (
              <div style={{ background: S.orangeLight, border: "1px solid #cce6ff", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: S.orange, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Markup</div>
                <div style={{ fontSize: "26px", fontWeight: "800", color: S.orange }}>{markup}%</div>
              </div>
            )}
            {breakEven && (
              <div style={{ background: S.slateLight, border: "1px solid " + S.border, borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: S.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Break-Even / Mo</div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: S.slate }}>{"$" + parseInt(breakEven).toLocaleString()}</div>
              </div>
            )}
            {floor && (
              <div style={{ background: "#fff1f1", border: "1px solid #fecaca", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: S.red, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Price Floor</div>
                <div style={{ fontSize: "26px", fontWeight: "800", color: S.red }}>{"$" + parseFloat(floor).toFixed(2)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ background: S.orangeLight, border: "1px solid #cce6ff", borderRadius: "12px", padding: "18px 22px" }}>
        <p style={{ margin: 0, color: S.orange, fontSize: "14px", fontWeight: "600", lineHeight: "1.6" }}>
          Not sure if your prices are actually covering your costs? Hit Ask Kari. Bring your revenue, what you pay to deliver the service, and your monthly overhead.
        </p>
      </div>
    </div>
  );
}
