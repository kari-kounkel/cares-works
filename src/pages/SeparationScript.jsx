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

const BEFORE = [
  "Confirm the legal basis for the separation — termination for cause, performance, layoff, or resignation acceptance",
  "Review your employee handbook for any termination procedures you are required to follow",
  "Consult an employment attorney if there is any possibility of a discrimination or retaliation claim",
  "Prepare final paycheck — most states require same-day or next-day payment on termination (check your state law)",
  "Prepare COBRA or benefits continuation information if applicable",
  "Prepare any severance agreement if you are offering one — have it reviewed by an attorney before presenting it",
  "Identify all access to revoke: email, software, building, keys, company accounts",
  "Have HR documentation ready — separation letter, final pay stub, benefits information",
  "Choose the time and location — private, end of day or week, in person when possible",
  "Have a witness present — another manager or HR person, not a peer of the employee",
];

const SCRIPT_LINES = [
  {
    line: "\"[Name], thank you for coming in. I need to let you know that today is your last day with [Company].\"",
    note: "Say it in the first sentence. Do not build up to it. Delay is cruel and creates false hope.",
  },
  {
    line: "\"This decision is final.\"",
    note: "Say this early. It prevents a negotiation that will not go anywhere and is painful for everyone.",
  },
  {
    line: "\"[For cause]: The reason for this decision is [specific behavior or incident]. We have addressed this previously on [dates] and the issue has continued.\"",
    note: "Be specific. Vague reasons invite legal challenge. If you've documented the performance issues, this is easy. If you haven't, that's the lesson for next time.",
  },
  {
    line: "\"[For layoff]: This is a business decision. Your position is being eliminated. This is not a reflection of your performance.\"",
    note: "Only say this if it is true. If it's a performance issue dressed up as a layoff, that creates legal exposure.",
  },
  {
    line: "\"Your final paycheck includes [dates covered and any accrued PTO per your policy]. Here is the information for your benefits continuation.\"",
    note: "Have it in writing and hand it to them.",
  },
  {
    line: "\"We need to collect [list of company property: laptop, keys, badge, etc.] before you leave today.\"",
    note: "Have a list. Do it now.",
  },
  {
    line: "\"We will [have IT disable your access today / have already disabled your access]. Please do not access company systems after today.\"",
    note: "Access revocation should happen the moment they leave the room, not the next morning.",
  },
  {
    line: "\"Do you have any questions about your final pay, benefits, or next steps?\"",
    note: "Answer what you can. Refer the rest to HR in writing.",
  },
  {
    line: "\"I wish you well.\"",
    note: "Say it and mean it. Or just say it. Either way, end with dignity.",
  },
];

const AFTER = [
  "Notify the team promptly — before rumor fills the vacuum. Keep it simple: \"[Name] is no longer with the company as of today. We'll share more about next steps for the role when we have them.\"",
  "Revoke all digital access immediately — email, software, internal tools, cloud storage",
  "Change any shared passwords the employee had access to",
  "Collect and document all company property returned",
  "File all separation documentation — letter, final pay confirmation, signed acknowledgments",
  "Update payroll, benefits, and insurance records",
  "If a severance agreement was signed, calendar the revocation period (usually 7–21 days depending on the agreement)",
  "Document what was said in the meeting — date, time, who was present, key points covered",
];

const NEVER = [
  { item: "Apologize for the decision", note: "Express care for the person. Do not apologize for the decision itself — it undermines the legitimacy of the separation." },
  { item: "Leave the room while they are still processing", note: "Stay for the whole conversation. Leaving early is not mercy — it is avoidance." },
  { item: "Let them leave without collecting access credentials and property", note: null },
  { item: "Tell other employees before you tell the person being separated", note: null },
  { item: "Make promises you cannot keep — references, re-hire eligibility, severance you haven't confirmed", note: null },
  { item: "Do this over email or text unless there is a genuine safety concern", note: "In-person (or video if remote) is always the right call." },
  { item: "Wait more than one business day to process final pay in states that require immediate payment", note: "Check your state. The fine is not worth the delay." },
];

export default function SeparationScript({ session }) {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("before");

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
        <p style={{ color: S.muted, marginBottom: "28px", lineHeight: "1.65", fontSize: "15px" }}>The Separation Script is a CARES Works member tool. Know exactly what to say, when to say it, and what never to skip.</p>
        <a href={MONTHLY_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.orange, color: S.white, padding: "14px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", marginBottom: "12px", fontSize: "16px" }}>Join for $27/month</a>
        <a href={ANNUAL_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.white, color: S.orange, padding: "12px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", border: "2px solid " + S.orange, fontSize: "15px" }}>$270/year — save 2 months</a>
      </div>
    </div>
  );

  const TABS = [
    { key: "before", label: "Before the Meeting" },
    { key: "script", label: "The Script" },
    { key: "after", label: "After the Meeting" },
    { key: "never", label: "Never Do This" },
  ];

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px 60px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "8px" }}>
        <span style={{ background: S.orangeLight, color: S.orange, fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", border: "1px solid #cce6ff", textTransform: "uppercase", letterSpacing: "0.06em" }}>People Tools</span>
      </div>
      <h1 style={{ fontSize: "30px", fontWeight: "800", color: S.slate, marginBottom: "10px" }}>Separation Script</h1>
      <p style={{ color: S.muted, fontSize: "15px", lineHeight: "1.7", marginBottom: "28px", maxWidth: "640px" }}>
        Letting someone go is one of the hardest things you do as a business owner. This tool doesn't make it easy. It makes it right.
      </p>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "2px solid " + (tab === t.key ? S.orange : S.border), background: tab === t.key ? S.orange : S.white, color: tab === t.key ? S.white : S.muted, fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "before" && (
        <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ background: S.slate, padding: "14px 20px" }}>
            <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>10 Things to Do Before You Say a Word</h2>
          </div>
          {BEFORE.map((item, i) => (
            <div key={i} style={{ padding: "14px 20px", borderBottom: i < BEFORE.length - 1 ? "1px solid " + S.border : "none", background: i % 2 === 0 ? S.white : S.slateLight, display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: S.orange, color: S.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800", flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: "14px", color: S.slate, lineHeight: "1.55" }}>{item}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "script" && (
        <div>
          <div style={{ background: S.orangeLight, border: "1px solid #cce6ff", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px" }}>
            <p style={{ margin: 0, color: S.orange, fontSize: "13px", fontWeight: "600", lineHeight: "1.6" }}>
              These are word-for-word starting points, not a transcript. Adjust for your situation. Never memorize a script — know the key points and speak from them.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {SCRIPT_LINES.map((s, i) => (
              <div key={i} style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <p style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: "700", color: S.slate, fontStyle: "italic", lineHeight: "1.5", borderLeft: "3px solid " + S.orange, paddingLeft: "14px" }}>{s.line}</p>
                <p style={{ margin: 0, fontSize: "13px", color: S.muted, lineHeight: "1.6" }}>💡 {s.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "after" && (
        <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ background: S.slate, padding: "14px 20px" }}>
            <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>What to Do the Moment They Leave</h2>
          </div>
          {AFTER.map((item, i) => (
            <div key={i} style={{ padding: "14px 20px", borderBottom: i < AFTER.length - 1 ? "1px solid " + S.border : "none", background: i % 2 === 0 ? S.white : S.slateLight, display: "flex", gap: "12px" }}>
              <span style={{ color: S.orange, fontWeight: "800", flexShrink: 0 }}>→</span>
              <span style={{ fontSize: "14px", color: S.slate, lineHeight: "1.55" }}>{item}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "never" && (
        <div style={{ background: "#fff1f1", border: "2px solid #fecaca", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ color: S.red, fontSize: "17px", fontWeight: "800", margin: "0 0 18px" }}>🚨 Never Do These Things</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {NEVER.map((entry, i) => (
              <div key={i} style={{ background: S.white, borderRadius: "8px", padding: "14px 16px", border: "1px solid #fecaca" }}>
                <p style={{ margin: 0, color: S.slate, fontSize: "14px", fontWeight: "700", lineHeight: "1.5" }}>{entry.item}</p>
                {entry.note && <p style={{ margin: "6px 0 0", color: S.muted, fontSize: "13px", fontStyle: "italic", lineHeight: "1.5" }}>{entry.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: S.orangeLight, border: "1px solid #cce6ff", borderRadius: "12px", padding: "18px 22px", marginTop: "24px" }}>
        <p style={{ margin: 0, color: S.orange, fontSize: "14px", fontWeight: "600", lineHeight: "1.6" }}>
          Navigating a complicated separation or worried about legal exposure? Ask Kari. Bring what happened and what you've documented.
        </p>
      </div>
    </div>
  );
}
