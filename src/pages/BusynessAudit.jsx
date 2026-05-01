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

const QUESTIONS = [
  { id: "q1", text: "I know my gross margin off the top of my head.", profitable: true },
  { id: "q2", text: "I regularly say yes to work that doesn't move me toward my goals because it pays something.", profitable: false },
  { id: "q3", text: "I have turned down or stopped offering a service because it wasn't profitable enough.", profitable: true },
  { id: "q4", text: "I feel behind even when I'm working full hours.", profitable: false },
  { id: "q5", text: "I know which of my clients or services generates the most net profit.", profitable: true },
  { id: "q6", text: "I track time but rarely look at whether that time is actually generating revenue.", profitable: false },
  { id: "q7", text: "I have systems that run without me being directly involved.", profitable: true },
  { id: "q8", text: "My revenue fluctuates significantly month to month and I'm not sure why.", profitable: false },
  { id: "q9", text: "I price based on what I want to earn, not just what others charge.", profitable: true },
  { id: "q10", text: "I do things myself because 'it's faster' even when I know I should delegate.", profitable: false },
  { id: "q11", text: "I regularly review my P&L and can explain what changed month to month.", profitable: true },
  { id: "q12", text: "I often feel like I'm working hard but don't know where the money went.", profitable: false },
  { id: "q13", text: "I have at least one revenue stream that generates income without my direct time.", profitable: true },
];

const SIGNS_BUSY = [
  "You're booked solid but your savings account is flat",
  "You measure success by how many hours you worked",
  "Your busiest months are not always your most profitable months",
  "You're afraid to raise prices because you don't want to lose clients",
  "You do everything yourself and call it 'staying lean'",
  "You have no idea which services are actually profitable",
];

const SIGNS_PROFITABLE = [
  "You know your numbers without having to pull a report",
  "You've fired a client because the relationship wasn't worth the revenue",
  "Your business runs for a week without you and nothing breaks",
  "You make decisions based on margin, not just top-line revenue",
  "You regularly cut things — services, tools, relationships — that aren't earning their place",
  "You set your prices and hold them",
];

const MOVES = [
  { move: "Run a profitability analysis by client or service", detail: "Pull your P&L by class or customer in QBO. Find out who is making you money and who is costing you more than they're worth." },
  { move: "Set a minimum hourly effective rate and honor it", detail: "Calculate what you actually earn per hour on your worst-paying clients. If it's below your floor, that's a pricing or scope problem." },
  { move: "Identify one thing you're doing that someone else could do", detail: "Delegation is not laziness. It's leverage. What are you doing that costs you $150/hour of your time but could be done by someone at $20–25/hour?" },
  { move: "Audit your recurring commitments", detail: "List every recurring task, service, and obligation. Rate each one: high value, medium value, or low value. Cut or delegate the low-value ones." },
  { move: "Stop measuring success by hours worked", detail: "Revenue per hour worked is a more useful metric than hours logged. Busy and productive are not the same word." },
];

export default function BusynessAudit({ session }) {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);

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

  const score = () => {
    let pts = 0;
    QUESTIONS.forEach((q) => {
      const ans = answers[q.id];
      if (ans === undefined) return;
      if (q.profitable && ans === true) pts++;
      if (!q.profitable && ans === false) pts++;
    });
    return pts;
  };

  const answered = Object.keys(answers).length;
  const total = QUESTIONS.length;
  const s = score();
  const pct = total ? Math.round((s / total) * 100) : 0;

  const result = pct >= 75 ? { label: "Running Profitable", color: S.green, bg: S.greenLight, border: "#BBF7D0", msg: "You're thinking like a business owner, not just a freelancer. The behaviors are there — keep sharpening the numbers side." }
    : pct >= 50 ? { label: "Mixed — More Busy Than Profitable", color: S.orange, bg: S.orangeLight, border: "#FED7AA", msg: "You have the instincts but the systems aren't fully there yet. Pick two moves from below and do them this month." }
    : { label: "Running Busy", color: S.red, bg: "#FFF1F1", border: "#FECACA", msg: "You are working hard. You may not be building wealth. That's fixable — but it requires looking at the numbers honestly." };

  if (loading) return <div style={{ padding: "60px", textAlign: "center", color: S.muted }}>Loading...</div>;

  if (!isMember) return (
    <div style={{ minHeight: "100vh", background: S.slateLight, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "480px", width: "100%", background: S.white, borderRadius: "16px", padding: "40px 36px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>🔒</div>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: S.slate, marginBottom: "12px" }}>Members Only Tool</h2>
        <p style={{ color: S.muted, marginBottom: "28px", lineHeight: "1.65", fontSize: "15px" }}>The Busyness Audit is a CARES Works member tool. Find out if you're building a business or just staying occupied.</p>
        <a href={MONTHLY_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.orange, color: S.white, padding: "14px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", marginBottom: "12px", fontSize: "16px" }}>Join for $27/month</a>
        <a href={ANNUAL_URL} target="_blank" rel="noreferrer" style={{ display: "block", background: S.white, color: S.orange, padding: "12px 24px", borderRadius: "8px", fontWeight: "700", textDecoration: "none", border: "2px solid " + S.orange, fontSize: "15px" }}>$270/year — save 2 months</a>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px 60px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "8px" }}>
        <span style={{ background: S.orangeLight, color: S.orange, fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", border: "1px solid #FED7AA", textTransform: "uppercase", letterSpacing: "0.06em" }}>Leadership Tools</span>
      </div>
      <h1 style={{ fontSize: "30px", fontWeight: "800", color: S.slate, marginBottom: "10px" }}>Busy vs. Profitable Audit</h1>
      <p style={{ color: S.muted, fontSize: "15px", lineHeight: "1.7", marginBottom: "8px", maxWidth: "640px" }}>
        Revenue is vanity. Net profit is sanity. This audit tells you which one you're actually chasing.
      </p>
      <p style={{ color: S.muted, fontSize: "13px", fontStyle: "italic", marginBottom: "32px" }}>Answer honestly. This isn't graded — it's a mirror.</p>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ background: S.slate, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>13 Questions</h2>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>{answered} of {total} answered</span>
        </div>
        {QUESTIONS.map((q, i) => (
          <div key={q.id} style={{ padding: "16px 20px", borderBottom: i < QUESTIONS.length - 1 ? "1px solid " + S.border : "none", background: i % 2 === 0 ? S.white : S.slateLight }}>
            <p style={{ margin: "0 0 12px", fontSize: "14px", color: S.slate, lineHeight: "1.55", fontWeight: "500" }}>{q.text}</p>
            <div style={{ display: "flex", gap: "8px" }}>
              {[{ label: "True", val: true }, { label: "False", val: false }].map(({ label, val }) => (
                <button key={label} onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                  style={{ padding: "7px 18px", borderRadius: "6px", border: "2px solid " + (answers[q.id] === val ? S.orange : S.border), background: answers[q.id] === val ? S.orange : S.white, color: answers[q.id] === val ? S.white : S.muted, fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {answered === total && !showResult && (
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <button onClick={() => setShowResult(true)}
            style={{ background: S.orange, color: S.white, padding: "14px 32px", borderRadius: "8px", fontWeight: "800", border: "none", cursor: "pointer", fontSize: "16px" }}>
            See My Results
          </button>
        </div>
      )}

      {showResult && (
        <div>
          <div style={{ background: result.bg, border: "2px solid " + result.border, borderRadius: "14px", padding: "24px", marginBottom: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "42px", fontWeight: "900", color: result.color, marginBottom: "6px" }}>{pct}%</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: result.color, marginBottom: "10px" }}>{result.label}</div>
            <p style={{ margin: 0, color: S.slate, fontSize: "14px", lineHeight: "1.7", maxWidth: "500px", display: "inline-block" }}>{result.msg}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#FFF1F1", border: "1px solid #FECACA", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #FECACA" }}>
                <h2 style={{ color: S.red, fontSize: "14px", fontWeight: "800", margin: 0 }}>Signs You're Running Busy</h2>
              </div>
              {SIGNS_BUSY.map((item, i) => (
                <div key={i} style={{ padding: "10px 18px", borderBottom: i < SIGNS_BUSY.length - 1 ? "1px solid #FECACA" : "none", display: "flex", gap: "10px" }}>
                  <span style={{ color: S.red, flexShrink: 0 }}>✗</span>
                  <span style={{ fontSize: "13px", color: S.slate, lineHeight: "1.5" }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ background: S.greenLight, border: "1px solid #BBF7D0", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #BBF7D0" }}>
                <h2 style={{ color: S.green, fontSize: "14px", fontWeight: "800", margin: 0 }}>Signs You're Running Profitable</h2>
              </div>
              {SIGNS_PROFITABLE.map((item, i) => (
                <div key={i} style={{ padding: "10px 18px", borderBottom: i < SIGNS_PROFITABLE.length - 1 ? "1px solid #BBF7D0" : "none", display: "flex", gap: "10px" }}>
                  <span style={{ color: S.green, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: "13px", color: S.slate, lineHeight: "1.5" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
            <div style={{ background: S.slate, padding: "14px 20px" }}>
              <h2 style={{ color: S.white, fontSize: "15px", fontWeight: "700", margin: 0 }}>5 Moves to Get More Profitable</h2>
            </div>
            {MOVES.map((m, i) => (
              <div key={i} style={{ padding: "16px 20px", borderBottom: i < MOVES.length - 1 ? "1px solid " + S.border : "none", background: i % 2 === 0 ? S.white : S.slateLight }}>
                <p style={{ margin: "0 0 5px", fontSize: "14px", fontWeight: "700", color: S.orange }}>{m.move}</p>
                <p style={{ margin: 0, fontSize: "13px", color: S.muted, lineHeight: "1.6" }}>{m.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: S.orangeLight, border: "1px solid #FED7AA", borderRadius: "12px", padding: "18px 22px" }}>
        <p style={{ margin: 0, color: S.orange, fontSize: "14px", fontWeight: "600", lineHeight: "1.6" }}>
          Not sure which move to make first? Hit Ask Kari. Bring your current revenue, your top three clients, and what's taking most of your time.
        </p>
      </div>
    </div>
  );
}
