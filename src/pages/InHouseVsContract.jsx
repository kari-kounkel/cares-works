import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const S = {
  orange: "#0080ff", orangeLight: "#e6f0ff", slate: "#0a0a14",
  slateLight: "#f7f9fc", muted: "#64748b", border: "#e2e8f0",
  green: "#22c55e", greenLight: "#f0fdf4", red: "#ef4444",
  blue: "#0052cc", blueLight: "#e6f0ff",
  white: "#ffffff",
};

const MONTHLY_URL = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";
const ANNUAL_URL = "https://buy.stripe.com/14A5kD4B981AgTxcuM18c09";

const FACTORS = [
  {
    factor: "How often do you need this work done?",
    inhouse: "Daily or multiple times per week — volume justifies a dedicated person",
    contract: "Episodic, project-based, or fewer than 10 hours per week consistently",
  },
  {
    factor: "How much control do you need over how the work is done?",
    inhouse: "High — you need to set the schedule, process, and method",
    contract: "Low to medium — you care about the output, not the method",
  },
  {
    factor: "Does this role require your tools, equipment, or systems?",
    inhouse: "Yes — the work requires your specific platforms, locations, or proprietary systems",
    contract: "No — the contractor can use their own tools to deliver the result",
  },
  {
    factor: "Is this a core function of your business?",
    inhouse: "Yes — it's integral to your product or service delivery",
    contract: "No — it's support work that enables the core but isn't the core itself",
  },
  {
    factor: "Do you need this person to be exclusively available to you?",
    inhouse: "Yes — you need first call on their time and full-time availability",
    contract: "No — they can serve other clients as long as your work gets done",
  },
  {
    factor: "What's your budget including true employer cost?",
    inhouse: "You can cover salary plus 25–35% in employer taxes, benefits, and overhead",
    contract: "You can pay the market contractor rate without the overhead — and the work is sporadic enough to justify it",
  },
];

const TRUE_COST = [
  { item: "Gross salary", example: "$50,000" },
  { item: "Payroll taxes (FICA, FUTA, SUTA — approx. 10–12%)", example: "$5,500" },
  { item: "Health insurance contribution (varies widely)", example: "$4,800" },
  { item: "Workers' compensation insurance", example: "$600" },
  { item: "Paid time off (10 days = approx. 3.8% of salary)", example: "$1,900" },
  { item: "Equipment, software, workspace", example: "$2,400" },
  { item: "Recruiting and onboarding cost (one-time)", example: "$3,000" },
  { item: "Training time and ramp-up productivity loss", example: "$2,000" },
  { item: "Total true first-year cost", example: "~$70,200" },
];

const MISCLASS_RISK = [
  "You control how and when the work is done, not just what the outcome is",
  "The contractor works exclusively for you and no other clients",
  "You provide the tools, software, or equipment they use to do the work",
  "The relationship is ongoing and indefinite with no defined project end date",
  "You call them an employee internally but pay them as a contractor",
  "They are doing the same work as your W-2 employees, just without benefits",
];

const QUESTIONS = [
  "Is this a one-time project or an ongoing need?",
  "How many hours per week does this work actually require?",
  "Am I prepared to manage an employee — or do I just need the output?",
  "What is the true cost of the wrong decision here — legally and operationally?",
  "Am I calling this contract work because it's easier, or because it's actually the right structure?",
];

export default function InHouseVsContract({ session }) {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

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
        <p style={{ color: S.muted, marginBottom: "28px", lineHeight: "1.65", fontSize: "15px" }}>In-House vs. Contract Decision is a CARES Works member tool. Make this call with a framework, not a gut feeling — misclassification is expensive.</p>
        <a href={MONTHLY_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.orange, color: S.white, padding: "14px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", marginBottom: "12px", fontSize: "16px" }}>Join for $27/month</a>
        <a href={ANNUAL_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.white, color: S.orange, padding: "12px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", border: "2px solid " + S.orange, fontSize: "15px" }}>$270/year — save 2 months</a>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px 60px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "8px" }}>
        <span style={{ background: S.orangeLight, color: S.orange, fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", border: "1px solid #cce6ff", textTransform: "uppercase", letterSpacing: "0.06em" }}>People Tools</span>
      </div>
      <h1 style={{ fontSize: "30px", fontWeight: "800", color: S.slate, marginBottom: "10px" }}>In-House vs. Contract Decision</h1>
      <p style={{ color: S.muted, fontSize: "15px", lineHeight: "1.7", marginBottom: "32px", maxWidth: "640px" }}>
        This decision has legal consequences and a real price tag. Here's how to make it like someone who knows what they're doing — because now you will.
      </p>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ background: S.slate, padding: "14px 20px" }}>
          <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>The Decision Framework</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
            <thead>
              <tr style={{ background: S.slateLight }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: S.muted, textTransform: "uppercase", letterSpacing: "0.05em", width: "35%" }}>Factor</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: S.green, textTransform: "uppercase", letterSpacing: "0.05em" }}>→ In-House</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: S.blue, textTransform: "uppercase", letterSpacing: "0.05em" }}>→ Contract</th>
              </tr>
            </thead>
            <tbody>
              {FACTORS.map((f, i) => (
                <tr key={i} style={{ borderTop: "1px solid " + S.border, background: i % 2 === 0 ? S.white : S.slateLight }}>
                  <td style={{ padding: "13px 16px", fontSize: "13px", fontWeight: "700", color: S.slate, verticalAlign: "top" }}>{f.factor}</td>
                  <td style={{ padding: "13px 16px", fontSize: "13px", color: S.green, lineHeight: "1.5", verticalAlign: "top" }}>{f.inhouse}</td>
                  <td style={{ padding: "13px 16px", fontSize: "13px", color: S.blue, lineHeight: "1.5", verticalAlign: "top" }}>{f.contract}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ background: S.slate, padding: "14px 20px" }}>
          <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>The True Cost of an Employee</h2>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <p style={{ color: S.muted, fontSize: "13px", lineHeight: "1.6", marginBottom: "14px" }}>Most owners think about salary. Here is everything salary doesn't include, using a $50K example:</p>
          {TRUE_COST.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < TRUE_COST.length - 1 ? "1px solid " + S.border : "none", borderTop: i === TRUE_COST.length - 1 ? "2px solid " + S.slate : "none" }}>
              <span style={{ fontSize: "14px", color: i === TRUE_COST.length - 1 ? S.slate : S.muted, fontWeight: i === TRUE_COST.length - 1 ? "800" : "400", lineHeight: "1.4" }}>{item.item}</span>
              <span style={{ fontSize: "14px", color: i === TRUE_COST.length - 1 ? S.orange : S.slate, fontWeight: "700", whiteSpace: "nowrap", marginLeft: "12px" }}>{item.example}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff1f1", border: "2px solid #fecaca", borderRadius: "12px", padding: "22px 24px", marginBottom: "24px" }}>
        <h2 style={{ color: S.red, fontSize: "16px", fontWeight: "800", margin: "0 0 14px" }}>🚨 Misclassification Red Flags</h2>
        <p style={{ color: "#991b1b", fontSize: "13px", margin: "0 0 14px", lineHeight: "1.6" }}>If any of these describe your current contractor relationship, you may have a misclassification problem. The IRS and state agencies can reclassify workers retroactively — with penalties and back taxes.</p>
        {MISCLASS_RISK.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", marginBottom: i < MISCLASS_RISK.length - 1 ? "8px" : 0 }}>
            <span style={{ color: S.red, fontWeight: "700", flexShrink: 0 }}>⚠</span>
            <span style={{ fontSize: "14px", color: S.slate, lineHeight: "1.5" }}>{item}</span>
          </div>
        ))}
      </div>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "800", color: S.slate, margin: "0 0 14px" }}>Ask Yourself These Before You Decide</h2>
        {QUESTIONS.map((q, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", marginBottom: i < QUESTIONS.length - 1 ? "10px" : 0 }}>
            <span style={{ color: S.orange, fontWeight: "800", flexShrink: 0 }}>→</span>
            <span style={{ fontSize: "14px", color: S.slate, lineHeight: "1.5", fontStyle: "italic" }}>{q}</span>
          </div>
        ))}
      </div>

      <div style={{ background: S.orangeLight, border: "1px solid #cce6ff", borderRadius: "12px", padding: "18px 22px" }}>
        <p style={{ margin: 0, color: S.orange, fontSize: "14px", fontWeight: "600", lineHeight: "1.6" }}>
          Not sure which structure fits your situation — or worried you've already made the wrong call? Hit Ask Kari. Bring the role description and how you've been paying them.
        </p>
      </div>
    </div>
  );
}
