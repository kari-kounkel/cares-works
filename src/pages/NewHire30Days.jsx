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

const SECTIONS = [
  {
    title: "Before Day 1",
    icon: "📋",
    items: [
      "Send offer letter and collect signed copy",
      "Complete I-9 verification (must be done by end of day 3)",
      "Collect W-4 and any state withholding forms",
      "Add to payroll system before first pay period",
      "Set up email, software access, and any logins they will need",
      "Assign a workspace, equipment, or remote setup",
      "Send a welcome message with first-day logistics — start time, parking, who to ask for",
      "Notify the team they are coming",
    ],
  },
  {
    title: "Day 1",
    icon: "🚀",
    items: [
      "Walk through the physical or virtual workspace",
      "Introduce to team members they will work with regularly",
      "Review the org chart and who does what",
      "Go over your communication norms — how you use email vs. text vs. meetings",
      "Review confidentiality expectations and any NDAs if applicable",
      "Confirm their equipment and access is working",
      "Sit down together for at least 30 minutes — ask what they need to feel set up for success",
      "End the day with a brief check-in — how did it go?",
    ],
  },
  {
    title: "Week 1",
    icon: "📅",
    items: [
      "Review their job description together — clarify anything unclear",
      "Walk through your key processes relevant to their role",
      "Introduce them to any clients or external contacts they will work with",
      "Set a 30-day goal together — one specific, measurable thing to accomplish",
      "Schedule weekly check-ins for the first 30 days",
      "Show them where to find policies, procedures, and key documents",
      "Give them one meaningful task to complete this week",
    ],
  },
  {
    title: "Week 2–3",
    icon: "🔁",
    items: [
      "Check in on the 30-day goal — any blockers?",
      "Ask what's working and what's confusing",
      "Confirm they understand how their work connects to the bigger picture",
      "Introduce any training, certifications, or required reading",
      "Review any performance expectations and how you give feedback",
      "Make sure they know your preferred style for questions and updates",
    ],
  },
  {
    title: "Day 30 — Check-In",
    icon: "✅",
    items: [
      "Review the 30-day goal — did they hit it? What got in the way?",
      "Give specific, honest feedback on what you've observed",
      "Ask them: what do you need more of? Less of? What's unclear?",
      "Confirm compensation, schedule, and any open HR paperwork is complete",
      "Discuss the next 60 days — what does success look like?",
      "Document the conversation — what you covered, what you agreed to",
    ],
  },
];

const NEVER = [
  "Leave them to figure it out alone on day one",
  "Skip the I-9 — federal law gives you three business days, not thirty",
  "Forget to add them to payroll before their first check",
  "Assume they know your expectations without stating them explicitly",
  "Wait until 90 days to give any feedback — that is too long",
];

export default function NewHire30Days({ session }) {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({});
  const [name, setName] = useState("");

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

  const toggle = (sIdx, iIdx) => {
    const key = sIdx + "-" + iIdx;
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const total = SECTIONS.reduce((a, s) => a + s.items.length, 0);
  const done = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((done / total) * 100);

  if (loading) return <div style={{ padding: "60px", textAlign: "center", color: S.muted }}>Loading...</div>;

  if (!isMember) return (
    <div style={{ minHeight: "100vh", background: S.slateLight, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "480px", width: "100%", background: S.white, borderRadius: "16px", padding: "40px 36px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>🔒</div>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: S.slate, marginBottom: "12px" }}>Members Only Tool</h2>
        <p style={{ color: S.muted, marginBottom: "28px", lineHeight: "1.65", fontSize: "15px" }}>New Hire First 30 Days is a CARES Works member tool. Give every new hire the start they deserve — and protect yourself legally while you do it.</p>
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
      <h1 style={{ fontSize: "30px", fontWeight: "800", color: S.slate, marginBottom: "10px" }}>New Hire First 30 Days</h1>
      <p style={{ color: S.muted, fontSize: "15px", lineHeight: "1.7", marginBottom: "24px", maxWidth: "640px" }}>
        The first 30 days tell a new employee everything they need to know about whether they made the right decision. This checklist makes sure you tell them the right things.
      </p>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", padding: "20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: S.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Employee Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="New hire name..."
            style={{ width: "100%", padding: "10px 12px", border: "1px solid " + S.border, borderRadius: "8px", fontSize: "16px", color: S.slate, boxSizing: "border-box", outline: "none" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "36px", fontWeight: "800", color: pct === 100 ? S.green : S.orange }}>{pct}%</div>
          <div style={{ fontSize: "12px", color: S.muted }}>{done} of {total} complete</div>
        </div>
      </div>

      {SECTIONS.map((section, sIdx) => {
        const secDone = section.items.filter((_, iIdx) => checked[sIdx + "-" + iIdx]).length;
        return (
          <div key={sIdx} style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ background: S.slate, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "18px" }}>{section.icon}</span>
                <h2 style={{ color: S.white, fontSize: "14px", fontWeight: "700", margin: 0 }}>{section.title}</h2>
              </div>
              <span style={{ fontSize: "12px", color: secDone === section.items.length ? "#86efac" : "rgba(255,255,255,0.5)", fontWeight: "700" }}>{secDone}/{section.items.length}</span>
            </div>
            {section.items.map((item, iIdx) => {
              const key = sIdx + "-" + iIdx;
              const isDone = !!checked[key];
              return (
                <div key={iIdx} onClick={() => toggle(sIdx, iIdx)}
                  style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "13px 20px", borderBottom: iIdx < section.items.length - 1 ? "1px solid " + S.border : "none", cursor: "pointer", background: isDone ? S.greenLight : (iIdx % 2 === 0 ? S.white : S.slateLight) }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid " + (isDone ? S.green : S.border), background: isDone ? S.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                    {isDone && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize: "14px", color: isDone ? S.green : S.slate, lineHeight: "1.55", textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.7 : 1 }}>{item}</span>
                </div>
              );
            })}
          </div>
        );
      })}

      <div style={{ background: "#fff1f1", border: "2px solid #fecaca", borderRadius: "12px", padding: "20px 24px", marginBottom: "24px" }}>
        <h2 style={{ color: S.red, fontSize: "16px", fontWeight: "800", margin: "0 0 14px" }}>🚨 Never Skip These</h2>
        {NEVER.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", marginBottom: i < NEVER.length - 1 ? "8px" : 0 }}>
            <span style={{ color: S.red, fontWeight: "700", flexShrink: 0 }}>✗</span>
            <span style={{ fontSize: "14px", color: S.slate, lineHeight: "1.5" }}>{item}</span>
          </div>
        ))}
      </div>

      <div style={{ background: S.orangeLight, border: "1px solid #cce6ff", borderRadius: "12px", padding: "18px 22px" }}>
        <p style={{ margin: 0, color: S.orange, fontSize: "14px", fontWeight: "600", lineHeight: "1.6" }}>
          Onboarding someone into a complicated role or not sure what paperwork applies in your state? Hit Ask Kari.
        </p>
      </div>
    </div>
  );
}
