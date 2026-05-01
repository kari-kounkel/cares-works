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

const ROLES = [
  {
    role: "CPA / Tax Strategist",
    icon: "📊",
    what: "Prepares your returns and keeps you legal. A good one also does tax planning — not just compliance.",
    when: "Before your first year of revenue. If you're already operating without one, get one now.",
    cost: "$500–$3,000/year for small business returns. More for complex entities or multi-state.",
    questions: ["Do you specialize in my industry?", "Do you do proactive tax planning or just file what I bring you?", "Who will actually work on my account?"],
    flag: "A CPA who only contacts you in March is a filer, not a strategist.",
  },
  {
    role: "Business Attorney",
    icon: "⚖️",
    what: "Handles contracts, entity formation, employment matters, and disputes. You want one before you need one.",
    when: "Before you sign a significant contract. Before you hire your first employee. Before a dispute escalates.",
    cost: "$150–$500/hour. Some offer flat-fee packages for formation, employment policies, or contract review.",
    questions: ["Do you work with small businesses regularly?", "Do you have experience with my industry?", "What's your typical response time?"],
    flag: "A generalist attorney is better than no attorney. A specialist in your area is better than a generalist.",
  },
  {
    role: "Bookkeeper",
    icon: "📒",
    what: "Keeps the day-to-day records clean. Reconciles accounts, categorizes transactions, runs routine reports.",
    when: "When you're spending more than 5 hours a month on bookkeeping yourself — or when your books are consistently months behind.",
    cost: "$300–$1,500/month depending on transaction volume and complexity.",
    questions: ["What accounting software do you work in?", "How do you handle errors you find from prior periods?", "Will I always have access to my own books?"],
    flag: "A bookkeeper who is the only one who understands your books is a liability, not an asset.",
  },
  {
    role: "Insurance Broker",
    icon: "🛡️",
    what: "Finds and manages business insurance — general liability, professional liability (E&O), workers' comp, property, and more.",
    when: "Before you open. Before you sign any contract that requires proof of insurance.",
    cost: "They are typically paid by commission from the insurer. A good broker costs you nothing extra and saves you from buying the wrong coverage.",
    questions: ["Do you work with businesses my size?", "What coverage do businesses like mine typically carry?", "How do you handle claims?"],
    flag: "If your broker has never proactively suggested a coverage review, find another broker.",
  },
  {
    role: "Fractional CFO",
    icon: "📈",
    what: "Financial strategy — cash flow forecasting, budget modeling, pricing analysis, board reporting. Not bookkeeping.",
    when: "When you're past startup mode, revenue is over $500K, and financial decisions are complex enough that you need someone thinking ahead, not just reporting backward.",
    cost: "$2,000–$8,000/month depending on scope and hours.",
    questions: ["What does your typical engagement look like?", "How do you differentiate from a bookkeeper?", "Can you show me a sample deliverable?"],
    flag: "See the Fractional CFO Scope Matrix in your tool library for the full breakdown.",
  },
  {
    role: "Mentor / Peer Advisor",
    icon: "🤝",
    what: "Someone who has built what you're building — or something close. Not a consultant. A person who will tell you the truth.",
    when: "Now. Yesterday. This is the one most people delay the longest and need the most.",
    cost: "Often free if the relationship is reciprocal. Paid advisors or advisory board members may take equity or cash.",
    questions: ["Have you built something at the scale I'm trying to reach?", "Will you tell me when I'm wrong?", "How do you want to structure our time together?"],
    flag: "An advisor who only affirms you is a mirror. You need a window.",
  },
];

const GAPS = [
  "You've never had a contract reviewed by an attorney",
  "You don't know your gross margin off the top of your head",
  "Your books are more than one month behind",
  "You don't know exactly what insurance you carry — or why",
  "You haven't talked to your CPA since last April",
  "You make major financial decisions alone",
  "Nobody in your life will tell you when you're wrong",
];

export default function AdvisoryTeam({ session }) {
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
        <p style={{ color: S.muted, marginBottom: "28px", lineHeight: "1.65", fontSize: "15px" }}>Building Your Advisory Team is a CARES Works member tool. Stop making every decision alone.</p>
        <a href={MONTHLY_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.orange, color: S.white, padding: "14px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", marginBottom: "12px", fontSize: "16px" }}>Join for $27/month</a>
        <a href={ANNUAL_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.white, color: S.orange, padding: "12px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", border: "2px solid " + S.orange, fontSize: "15px" }}>$270/year — save 2 months</a>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px 60px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "8px" }}>
        <span style={{ background: S.orangeLight, color: S.orange, fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", border: "1px solid #FED7AA", textTransform: "uppercase", letterSpacing: "0.06em" }}>People Tools</span>
      </div>
      <h1 style={{ fontSize: "30px", fontWeight: "800", color: S.slate, marginBottom: "10px" }}>Building Your Advisory Team</h1>
      <p style={{ color: S.muted, fontSize: "15px", lineHeight: "1.7", marginBottom: "32px", maxWidth: "640px" }}>
        Every strong business runs on a small team of people the owner actually calls. Here is who belongs on that team, when to bring them in, and what to ask before you do.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
        {ROLES.map((r, i) => (
          <div key={i} style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div
              onClick={() => setOpen(open === i ? null : i)}
              style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: open === i ? S.slateLight : S.white }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "24px" }}>{r.icon}</span>
                <span style={{ fontSize: "16px", fontWeight: "800", color: S.slate }}>{r.role}</span>
              </div>
              <span style={{ color: S.orange, fontSize: "18px", fontWeight: "700" }}>{open === i ? "−" : "+"}</span>
            </div>
            {open === i && (
              <div style={{ padding: "0 20px 20px", borderTop: "1px solid " + S.border }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginTop: "16px", marginBottom: "16px" }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "700", color: S.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>What They Do</p>
                    <p style={{ margin: 0, fontSize: "14px", color: S.slate, lineHeight: "1.6" }}>{r.what}</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "700", color: S.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>When to Hire</p>
                    <p style={{ margin: 0, fontSize: "14px", color: S.slate, lineHeight: "1.6" }}>{r.when}</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "700", color: S.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Typical Cost</p>
                    <p style={{ margin: 0, fontSize: "14px", color: S.slate, lineHeight: "1.6" }}>{r.cost}</p>
                  </div>
                </div>
                <div style={{ background: S.slateLight, borderRadius: "8px", padding: "14px 16px", marginBottom: "12px" }}>
                  <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: "700", color: S.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Questions to Ask</p>
                  {r.questions.map((q, j) => (
                    <p key={j} style={{ margin: j < r.questions.length - 1 ? "0 0 4px" : 0, fontSize: "13px", color: S.slate, lineHeight: "1.5" }}>{"\"" + q + "\""}</p>
                  ))}
                </div>
                <div style={{ background: S.orangeLight, borderRadius: "8px", padding: "12px 16px" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: S.orange, fontWeight: "600", lineHeight: "1.5" }}>⚑ {r.flag}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: "#FFF1F1", border: "2px solid #FECACA", borderRadius: "12px", padding: "22px 24px", marginBottom: "24px" }}>
        <h2 style={{ color: S.red, fontSize: "16px", fontWeight: "800", margin: "0 0 14px" }}>🚨 Signs Your Advisory Team Has Gaps</h2>
        {GAPS.map((g, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", marginBottom: i < GAPS.length - 1 ? "8px" : 0 }}>
            <span style={{ color: S.red, flexShrink: 0, fontWeight: "700" }}>✗</span>
            <span style={{ fontSize: "14px", color: S.slate, lineHeight: "1.5" }}>{g}</span>
          </div>
        ))}
      </div>

      <div style={{ background: S.orangeLight, border: "1px solid #FED7AA", borderRadius: "12px", padding: "18px 22px" }}>
        <p style={{ margin: 0, color: S.orange, fontSize: "14px", fontWeight: "600", lineHeight: "1.6" }}>
          Not sure which role to fill first given where your business is right now? Hit Ask Kari. The answer depends on your revenue, your risk exposure, and what's keeping you up at night.
        </p>
      </div>
    </div>
  );
}
