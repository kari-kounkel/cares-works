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

const SCRIPTS = [
  {
    situation: "Someone asks for an answer you don't have yet",
    icon: "🤔",
    wrong: "\"I don't know.\" (full stop, no follow-up)",
    right: [
      "\"That's a good question. Let me make sure I give you the right answer — I'll get back to you by [specific time].\"",
      "\"I want to think about that before I respond. Can I come back to you this afternoon?\"",
    ],
    note: "The key is a commitment with a deadline. Vague \"I'll think about it\" creates anxiety. Specific \"by Thursday at noon\" creates trust.",
  },
  {
    situation: "A client asks for something outside scope",
    icon: "📋",
    wrong: "\"Sure, I can do that.\" (then resenting it silently)",
    right: [
      "\"That's outside what we scoped, and I want to be upfront about that. I can get you a quote for it, or we can talk about whether it fits our current agreement. What would be most helpful?\"",
      "\"Happy to help with that — let me put together what that would look like to add on.\"",
    ],
    note: "Yes without boundaries trains clients to keep asking. A gentle redirect with options is more professional — and more profitable.",
  },
  {
    situation: "Someone is upset and you need to de-escalate",
    icon: "🔥",
    wrong: "\"I understand you're frustrated, but...\" (the \"but\" erases everything before it)",
    right: [
      "\"I hear you. That's not the experience I want you to have. Let me understand what happened, and let's fix it.\"",
      "\"You're right to be frustrated. Here's what I can do right now.\"",
    ],
    note: "Skip the \"but.\" Skip the explanation. Start with acknowledgment. Solutions come after feelings are heard, not before.",
  },
  {
    situation: "You need more time on a deadline",
    icon: "⏱️",
    wrong: "\"I've been really busy and haven't had a chance to get to it.\"",
    right: [
      "\"I want to give this the attention it deserves. I need [X days] more — I'll have it to you by [date]. Does that work?\"",
      "\"I ran into a complication I need to work through. I can deliver a partial draft by [date] or the full version by [later date] — which is more useful?\"",
    ],
    note: "Never cite busyness. Everyone is busy. Cite the quality commitment. Offer options when you can.",
  },
  {
    situation: "Someone asks you to do something you can't or won't do",
    icon: "🚫",
    wrong: "\"I can't do that.\"",
    right: [
      "\"That's not something I'm able to take on right now, but here's what I can do...\"",
      "\"That's outside what I do, but [person/resource] might be a great fit for that.\"",
    ],
    note: "\"Can't\" sounds like a limitation. \"Won't\" sounds like a choice. Neither serves the relationship. Redirect with something useful whenever possible.",
  },
  {
    situation: "You made a mistake",
    icon: "😬",
    wrong: "\"I'm so sorry, I'm the worst, this never happens...\" (over-apologizing undermines confidence)",
    right: [
      "\"I made an error. Here's what happened, here's what I'm doing to fix it, and here's how I'll prevent it going forward.\"",
      "\"That was my mistake. I own it. Here's the correction.\"",
    ],
    note: "Own it cleanly. Explain once. Fix it. Excessive apology signals panic — not accountability.",
  },
  {
    situation: "Someone asks for a discount",
    icon: "💰",
    wrong: "\"Let me see what I can do.\" (then discounting without a reason)",
    right: [
      "\"My pricing is based on the value and scope of what I deliver. I'm not able to discount that, but I can adjust the scope if budget is the issue — here's what a smaller engagement looks like.\"",
      "\"I don't discount my standard rates, but I do offer [payment plans / early pay discount / a starter package]. Would any of those help?\"",
    ],
    note: "Discounting without a reason trains clients that your price is negotiable. Offer scope reduction or alternative structures instead.",
  },
];

export default function BuyingTimeScripts({ session }) {
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
        <p style={{ color: S.muted, marginBottom: "28px", lineHeight: "1.65", fontSize: "15px" }}>Buying Time Scripts is a CARES Works member tool. Know exactly what to say in the moments that count.</p>
        <a href={MONTHLY_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.orange, color: S.white, padding: "14px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", marginBottom: "12px", fontSize: "16px" }}>Join for $27/month</a>
        <a href={ANNUAL_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.white, color: S.orange, padding: "12px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", border: "2px solid " + S.orange, fontSize: "15px" }}>$270/year — save 2 months</a>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px 60px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "8px" }}>
        <span style={{ background: S.orangeLight, color: S.orange, fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", border: "1px solid #FED7AA", textTransform: "uppercase", letterSpacing: "0.06em" }}>Communication Tools</span>
      </div>
      <h1 style={{ fontSize: "30px", fontWeight: "800", color: S.slate, marginBottom: "10px" }}>Buying Time Scripts</h1>
      <p style={{ color: S.muted, fontSize: "15px", lineHeight: "1.7", marginBottom: "32px", maxWidth: "640px" }}>
        Seven situations. The wrong way to handle each one. And what to say instead — so you come out of the conversation with your credibility intact.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {SCRIPTS.map((s, i) => (
          <div key={i} style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div onClick={() => setOpen(open === i ? null : i)}
              style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: open === i ? S.slateLight : S.white }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "22px" }}>{s.icon}</span>
                <span style={{ fontSize: "15px", fontWeight: "700", color: S.slate, lineHeight: "1.3" }}>{s.situation}</span>
              </div>
              <span style={{ color: S.orange, fontSize: "20px", fontWeight: "700", flexShrink: 0, marginLeft: "12px" }}>{open === i ? "−" : "+"}</span>
            </div>
            {open === i && (
              <div style={{ padding: "0 20px 20px", borderTop: "1px solid " + S.border }}>
                <div style={{ background: "#FFF1F1", border: "1px solid #FECACA", borderRadius: "8px", padding: "12px 16px", marginTop: "16px", marginBottom: "14px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "700", color: S.red, textTransform: "uppercase", letterSpacing: "0.05em" }}>Don't say this</p>
                  <p style={{ margin: 0, fontSize: "14px", color: S.slate, fontStyle: "italic", lineHeight: "1.5" }}>{s.wrong}</p>
                </div>
                <div style={{ background: S.greenLight, border: "1px solid #BBF7D0", borderRadius: "8px", padding: "12px 16px", marginBottom: "14px" }}>
                  <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: "700", color: S.green, textTransform: "uppercase", letterSpacing: "0.05em" }}>Say this instead</p>
                  {s.right.map((r, j) => (
                    <p key={j} style={{ margin: j < s.right.length - 1 ? "0 0 8px" : 0, fontSize: "14px", color: S.slate, fontStyle: "italic", lineHeight: "1.5", borderLeft: "3px solid " + S.green, paddingLeft: "12px" }}>{r}</p>
                  ))}
                </div>
                <div style={{ background: S.orangeLight, borderRadius: "8px", padding: "12px 16px" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: S.orange, fontWeight: "600", lineHeight: "1.6" }}>💡 {s.note}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: S.orangeLight, border: "1px solid #FED7AA", borderRadius: "12px", padding: "18px 22px", marginTop: "24px" }}>
        <p style={{ margin: 0, color: S.orange, fontSize: "14px", fontWeight: "600", lineHeight: "1.6" }}>
          Facing a conversation you're not sure how to navigate? Hit Ask Kari. Describe the situation and I'll help you find the right words.
        </p>
      </div>
    </div>
  );
}
