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
  { q: "What is the single outcome this meeting needs to produce?", detail: "If you can't answer this in one sentence, you're not ready to schedule it. 'Catch up' is not an outcome." },
  { q: "Who actually needs to be there — and who is just being invited to be polite?", detail: "Every person in a meeting is a decision: their time spent here is time not spent somewhere else. Invite only the people who are either deciding or directly affected." },
  { q: "Could this be an email, a shared doc, or a 5-minute call instead?", detail: "If the answer is yes, cancel the meeting. Status updates, one-way information sharing, and FYIs are not meetings." },
  { q: "How much time do we actually need?", detail: "Meetings expand to fill the time allotted. Start with half of what you think you need. You can always use less time. You rarely get more." },
  { q: "What does everyone need to read or prepare before they arrive?", detail: "Meetings where context-setting happens out loud in the room are using the most expensive venue for the cheapest work. Pre-read materials and start with decisions." },
];

const AGENDA = [
  { time: "0–2 min", what: "State the purpose and the outcome you're leaving with", why: "Grounds everyone in why you're there before anyone opens their mouth." },
  { time: "2–5 min", what: "Quick context (only what's needed that wasn't in pre-read)", why: "Don't repeat what people already know. Only fill gaps." },
  { time: "5–[X] min", what: "Discussion — with a facilitator keeping it on topic", why: "Someone has to own the agenda. If no one does, the loudest voice does." },
  { time: "Last 5 min", what: "Decisions, action items, owners, and due dates", why: "This is the reason you met. Don't run out of time before you get here." },
  { time: "30 min after", what: "Send the debrief to all attendees", why: "Memory fades. Shared documentation lasts." },
];

const TYPES = [
  { type: "Decision Meeting", when: "You need a choice made by specific people who have authority to make it", format: "Small group. Clear options prepared in advance. Ends with a recorded decision." },
  { type: "Problem-Solving Meeting", when: "Something is broken and you need collective thinking to fix it", format: "Define the problem before you meet. Use the first 5 minutes to align on the problem, not the solution." },
  { type: "Planning Meeting", when: "Setting direction, priorities, or timelines", format: "Comes with a pre-read that includes current state. Ends with a plan in writing." },
  { type: "One-on-One", when: "Regular check-ins with a direct report or manager", format: "Employee's agenda first, then yours. 30 minutes, weekly or bi-weekly. Relationship-building and performance in one." },
  { type: "All-Hands / Team Meeting", when: "Company-wide updates, culture moments, recognition", format: "Keep them short and specific. No more than monthly unless something major is happening." },
];

const NEVER = [
  "Schedule a meeting without an agenda",
  "Invite people who don't need to be there — 'just in case'",
  "Let the meeting run long without an explicit group decision to extend",
  "End without clear action items, owners, and due dates",
  "Hold a recurring meeting that no one would miss if it were cancelled",
  "Open with 'So, as everyone knows...' and then explain what everyone already knows",
];

export default function MeetingPlanning({ session }) {
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
        <p style={{ color: S.muted, marginBottom: "28px", lineHeight: "1.65", fontSize: "15px" }}>Planning Meetings that Actually Work is a CARES Works member tool. Stop holding meetings that waste everyone's time including yours.</p>
        <a href={MONTHLY_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.orange, color: S.white, padding: "14px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", marginBottom: "12px", fontSize: "16px" }}>Join for $27/month</a>
        <a href={ANNUAL_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.white, color: S.orange, padding: "12px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", border: "2px solid " + S.orange, fontSize: "15px" }}>$270/year — save 2 months</a>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px 60px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "8px" }}>
        <span style={{ background: S.orangeLight, color: S.orange, fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", border: "1px solid #cce6ff", textTransform: "uppercase", letterSpacing: "0.06em" }}>Communication Tools</span>
      </div>
      <h1 style={{ fontSize: "30px", fontWeight: "800", color: S.slate, marginBottom: "10px" }}>Planning Meetings that Actually Work</h1>
      <p style={{ color: S.muted, fontSize: "15px", lineHeight: "1.7", marginBottom: "32px", maxWidth: "640px" }}>
        Most meetings fail before they start. The problem isn't the people in the room — it's the absence of a clear reason to be there. Here's how to fix that.
      </p>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ background: S.slate, padding: "14px 20px" }}>
          <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>Before You Schedule — 5 Questions</h2>
        </div>
        {QUESTIONS.map((item, i) => (
          <div key={i} style={{ padding: "16px 20px", borderBottom: i < QUESTIONS.length - 1 ? "1px solid " + S.border : "none", background: i % 2 === 0 ? S.white : S.slateLight }}>
            <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: "700", color: S.slate, lineHeight: "1.4" }}>{item.q}</p>
            <p style={{ margin: 0, fontSize: "13px", color: S.muted, lineHeight: "1.6" }}>{item.detail}</p>
          </div>
        ))}
      </div>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ background: S.slate, padding: "14px 20px" }}>
          <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>The Agenda That Works Every Time</h2>
        </div>
        {AGENDA.map((item, i) => (
          <div key={i} style={{ padding: "14px 20px", borderBottom: i < AGENDA.length - 1 ? "1px solid " + S.border : "none", background: i % 2 === 0 ? S.white : S.slateLight, display: "flex", gap: "16px", alignItems: "flex-start" }}>
            <span style={{ fontFamily: "monospace", fontSize: "12px", color: S.orange, fontWeight: "700", minWidth: "70px", flexShrink: 0, paddingTop: "1px" }}>{item.time}</span>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: S.slate }}>{item.what}</p>
              <p style={{ margin: 0, fontSize: "13px", color: S.muted, lineHeight: "1.5" }}>{item.why}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ background: S.slate, padding: "14px 20px" }}>
          <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>Meeting Types and When to Use Each</h2>
        </div>
        {TYPES.map((t, i) => (
          <div key={i} style={{ padding: "16px 20px", borderBottom: i < TYPES.length - 1 ? "1px solid " + S.border : "none", background: i % 2 === 0 ? S.white : S.slateLight }}>
            <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "800", color: S.orange }}>{t.type}</p>
            <p style={{ margin: "0 0 4px", fontSize: "13px", color: S.slate, lineHeight: "1.5" }}><strong>When: </strong>{t.when}</p>
            <p style={{ margin: 0, fontSize: "13px", color: S.muted, lineHeight: "1.5" }}><strong>Format: </strong>{t.format}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff1f1", border: "2px solid #fecaca", borderRadius: "12px", padding: "20px 24px", marginBottom: "24px" }}>
        <h2 style={{ color: S.red, fontSize: "16px", fontWeight: "800", margin: "0 0 14px" }}>🚨 Never Do These Things in a Meeting</h2>
        {NEVER.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", marginBottom: i < NEVER.length - 1 ? "8px" : 0 }}>
            <span style={{ color: S.red, fontWeight: "700", flexShrink: 0 }}>✗</span>
            <span style={{ fontSize: "14px", color: S.slate, lineHeight: "1.5" }}>{item}</span>
          </div>
        ))}
      </div>

      <div style={{ background: S.orangeLight, border: "1px solid #cce6ff", borderRadius: "12px", padding: "18px 22px" }}>
        <p style={{ margin: 0, color: S.orange, fontSize: "14px", fontWeight: "600", lineHeight: "1.6" }}>
          Running a recurring meeting that's lost its purpose, or not sure how to restructure your team's weekly cadence? Hit Ask Kari.
        </p>
      </div>
    </div>
  );
}
