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

const QUESTIONS = [
  {
    q: "Have you worked with businesses like mine before?",
    why: "Industry experience matters. A CPA who works with restaurants will know things about food cost and tip reporting that a CPA who works with tech startups won't. Ask for specifics.",
  },
  {
    q: "Who exactly will be working on my account — you, or someone on your staff?",
    why: "You may be sold by the partner and serviced by a first-year associate. Know who's in the room before you sign anything.",
  },
  {
    q: "How do you charge — hourly, flat fee, or retainer?",
    why: "Hourly billing creates an incentive to spend time. Flat fees create an incentive to be efficient. Neither is inherently better, but you need to know what you're buying.",
  },
  {
    q: "What do you need from me and when?",
    why: "A CPA who can't tell you exactly what they need and by when will chase you for documents until April 14th every year. Get the process in writing.",
  },
  {
    q: "What tax software and accounting platforms do you work with?",
    why: "If you're in QBO and they only support QB Desktop, that's friction you'll feel forever. Compatibility matters.",
  },
  {
    q: "How do you handle estimated quarterly taxes?",
    why: "This one question separates proactive CPAs from reactive ones. A good one will calculate estimates and set a reminder. A bad one will send you a bill in April.",
  },
  {
    q: "What's the best way to reach you between April 16 and March 31?",
    why: "Tax season is the wrong time to find out your CPA doesn't answer email until June. Know their off-season availability upfront.",
  },
  {
    q: "Have you ever had a client audited? What happened?",
    why: "The answer tells you whether they know what an audit actually looks like — and whether they'll show up for you if it happens.",
  },
];

const GREEN_FLAGS = [
  "Proactively tells you what they need and when — no chasing required",
  "Asks about your goals, not just your income",
  "Has a defined onboarding process",
  "Can explain their fees clearly in writing before you engage",
  "Has worked with your industry or business model before",
  "Talks about tax strategy, not just tax compliance",
  "Will tell you things you don't want to hear before they cost you money",
];

const RED_FLAGS = [
  "Promises a big refund before seeing any of your numbers",
  "Can't tell you who will actually be doing your work",
  "Charges hourly with no estimate of total fees",
  "Has no clear process for document collection",
  "Can't explain what they're doing in plain language",
  "Only contacts you once a year around tax time",
  "Pushes back on every question instead of answering it",
  "Won't put fees in writing",
];

const BRING = [
  "Last 2 years of tax returns (business and personal if you're a sole prop or S-corp)",
  "Current P&L and Balance Sheet",
  "Entity formation documents (articles of incorporation, operating agreement)",
  "List of open questions you want answered",
  "A sense of your revenue and expense ballpark for this year",
  "Any IRS or state notices you've received (don't hide these)",
];

export default function FindingACPA({ session }) {
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
        <p style={{ color: S.muted, marginBottom: "28px", lineHeight: "1.65", fontSize: "15px" }}>Finding a CPA is a CARES Works member tool. Know what to ask before you hand someone your books.</p>
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
      <h1 style={{ fontSize: "30px", fontWeight: "800", color: S.slate, marginBottom: "10px" }}>Finding a CPA — The Right Questions</h1>
      <p style={{ color: S.muted, fontSize: "15px", lineHeight: "1.7", marginBottom: "32px", maxWidth: "640px" }}>
        Most people pick whoever answers the phone and seems nice. That's how you end up with a CPA you're afraid to call. Here's how to hire one like you know what you're doing.
      </p>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ background: S.slate, padding: "14px 20px" }}>
          <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>8 Questions to Ask Before You Hire</h2>
        </div>
        {QUESTIONS.map((item, i) => (
          <div key={i} style={{ padding: "18px 20px", borderBottom: i < QUESTIONS.length - 1 ? "1px solid " + S.border : "none", background: i % 2 === 0 ? S.white : S.slateLight }}>
            <p style={{ margin: "0 0 8px", color: S.slate, fontSize: "15px", fontWeight: "700", lineHeight: "1.4" }}>{"\"" + item.q + "\""}</p>
            <p style={{ margin: 0, color: S.muted, fontSize: "13px", lineHeight: "1.6" }}><strong style={{ color: S.orange }}>Why it matters: </strong>{item.why}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: S.greenLight, border: "1px solid #bbf7d0", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #bbf7d0" }}>
            <h2 style={{ color: S.green, fontSize: "15px", fontWeight: "800", margin: 0 }}>✅ Green Flags</h2>
          </div>
          {GREEN_FLAGS.map((flag, i) => (
            <div key={i} style={{ padding: "11px 18px", borderBottom: i < GREEN_FLAGS.length - 1 ? "1px solid #bbf7d0" : "none", display: "flex", gap: "10px" }}>
              <span style={{ color: S.green, fontWeight: "700", flexShrink: 0 }}>✓</span>
              <span style={{ color: S.slate, fontSize: "13px", lineHeight: "1.5" }}>{flag}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff1f1", border: "1px solid #fecaca", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #fecaca" }}>
            <h2 style={{ color: S.red, fontSize: "15px", fontWeight: "800", margin: 0 }}>🚩 Red Flags — Run</h2>
          </div>
          {RED_FLAGS.map((flag, i) => (
            <div key={i} style={{ padding: "11px 18px", borderBottom: i < RED_FLAGS.length - 1 ? "1px solid #fecaca" : "none", display: "flex", gap: "10px" }}>
              <span style={{ color: S.red, fontWeight: "700", flexShrink: 0 }}>✗</span>
              <span style={{ color: S.slate, fontSize: "13px", lineHeight: "1.5" }}>{flag}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ background: S.slate, padding: "14px 20px" }}>
          <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>What to Bring to the First Meeting</h2>
        </div>
        {BRING.map((item, i) => (
          <div key={i} style={{ padding: "12px 20px", borderBottom: i < BRING.length - 1 ? "1px solid " + S.border : "none", background: i % 2 === 0 ? S.white : S.slateLight, display: "flex", gap: "12px" }}>
            <span style={{ color: S.orange, fontWeight: "800", flexShrink: 0 }}>→</span>
            <span style={{ color: S.slate, fontSize: "14px", lineHeight: "1.5" }}>{item}</span>
          </div>
        ))}
      </div>

      <div style={{ background: S.orangeLight, border: "1px solid #cce6ff", borderRadius: "12px", padding: "18px 22px" }}>
        <p style={{ margin: 0, color: S.orange, fontSize: "14px", fontWeight: "600", lineHeight: "1.6" }}>
          Not sure whether you need a CPA, a bookkeeper, or both? Hit Ask Kari. The answer depends on where your business is right now.
        </p>
      </div>
    </div>
  );
}
