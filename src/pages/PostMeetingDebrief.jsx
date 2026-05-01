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

export default function PostMeetingDebrief({ session }) {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    meetingName: "", date: "", attendees: "", duration: "",
    purpose: "", decisions: "", actions: "", open: "", nextMeeting: "", rating: "",
  });

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

  const update = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const print = () => window.print();

  const FIELD = (label, field, placeholder, big) => (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: S.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{label}</label>
      {big ? (
        <textarea value={form[field]} onChange={(e) => update(field, e.target.value)} placeholder={placeholder} rows={4}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid " + S.border, borderRadius: "8px", fontSize: "14px", color: S.slate, background: S.slateLight, boxSizing: "border-box", outline: "none", resize: "vertical", fontFamily: "system-ui, sans-serif", lineHeight: "1.5" }} />
      ) : (
        <input type="text" value={form[field]} onChange={(e) => update(field, e.target.value)} placeholder={placeholder}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid " + S.border, borderRadius: "8px", fontSize: "16px", color: S.slate, background: S.slateLight, boxSizing: "border-box", outline: "none" }} />
      )}
    </div>
  );

  if (loading) return <div style={{ padding: "60px", textAlign: "center", color: S.muted }}>Loading...</div>;

  if (!isMember) return (
    <div style={{ minHeight: "100vh", background: S.slateLight, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "480px", width: "100%", background: S.white, borderRadius: "16px", padding: "40px 36px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>🔒</div>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: S.slate, marginBottom: "12px" }}>Members Only Tool</h2>
        <p style={{ color: S.muted, marginBottom: "28px", lineHeight: "1.65", fontSize: "15px" }}>Post-Meeting Debrief One-Pager is a CARES Works member tool. Never leave a meeting without knowing what was decided and who is doing what.</p>
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
      <h1 style={{ fontSize: "30px", fontWeight: "800", color: S.slate, marginBottom: "10px" }}>Post-Meeting Debrief</h1>
      <p style={{ color: S.muted, fontSize: "15px", lineHeight: "1.7", marginBottom: "28px", maxWidth: "640px" }}>
        Fill this out within 30 minutes of the meeting. Print or save it. Send it to attendees. You'll be the most organized person in every room you enter.
      </p>

      <div style={{ background: S.white, border: "1px solid " + S.border, borderRadius: "12px", padding: "28px", marginBottom: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ borderBottom: "3px solid " + S.orange, paddingBottom: "16px", marginBottom: "24px" }}>
          <div style={{ fontSize: "10px", fontWeight: "700", color: S.orange, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>CARES Works — Post-Meeting Debrief</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {FIELD("Meeting Name", "meetingName", "e.g. Q2 Budget Review")}
            {FIELD("Date", "date", "MM/DD/YYYY")}
            {FIELD("Attendees", "attendees", "Names or roles")}
            {FIELD("Duration", "duration", "e.g. 45 minutes")}
          </div>
        </div>

        {FIELD("What was the purpose of this meeting?", "purpose", "One sentence. Why did we meet?", true)}
        {FIELD("What was decided?", "decisions", "List key decisions made — be specific. Vague decisions create rework.", true)}
        {FIELD("Action items — who is doing what by when?", "actions", "Name | Task | Due Date — one per line", true)}
        {FIELD("What is still open or unresolved?", "open", "Topics tabled, questions unanswered, decisions deferred", true)}
        {FIELD("Next meeting (if applicable)", "nextMeeting", "Date, time, and agenda focus")}

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: S.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Was this meeting worth the time? (1–5)</label>
          <div style={{ display: "flex", gap: "8px" }}>
            {["1", "2", "3", "4", "5"].map((n) => (
              <button key={n} onClick={() => update("rating", n)}
                style={{ width: "44px", height: "44px", borderRadius: "8px", border: "2px solid " + (form.rating === n ? S.orange : S.border), background: form.rating === n ? S.orange : S.white, color: form.rating === n ? S.white : S.muted, fontSize: "16px", fontWeight: "800", cursor: "pointer" }}>
                {n}
              </button>
            ))}
            <span style={{ alignSelf: "center", fontSize: "12px", color: S.muted, marginLeft: "8px" }}>
              {form.rating === "1" ? "Complete waste" : form.rating === "2" ? "Mostly unnecessary" : form.rating === "3" ? "Mixed" : form.rating === "4" ? "Worth it" : form.rating === "5" ? "Excellent use of time" : ""}
            </span>
          </div>
        </div>

        {form.rating && parseInt(form.rating) <= 2 && (
          <div style={{ background: "#FFF1F1", border: "1px solid #FECACA", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px" }}>
            <p style={{ margin: 0, color: S.red, fontSize: "13px", fontWeight: "600", lineHeight: "1.6" }}>
              ⚠️ If this meeting rated a 1 or 2 — ask whether it needs to exist at all. Could this have been an email? A Slack message? A 5-minute call? Recurring low-value meetings are a tax on your whole team.
            </p>
          </div>
        )}

        <button onClick={print}
          style={{ background: S.orange, color: S.white, padding: "12px 24px", borderRadius: "8px", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "14px" }}>
          Print / Save as PDF
        </button>
      </div>

      <div style={{ background: S.orangeLight, border: "1px solid #FED7AA", borderRadius: "12px", padding: "18px 22px" }}>
        <p style={{ margin: 0, color: S.orange, fontSize: "14px", fontWeight: "600", lineHeight: "1.6" }}>
          Your meetings consistently feel unproductive and you're not sure why? Hit Ask Kari. Bring your typical meeting format and I'll help you find the leak.
        </p>
      </div>
    </div>
  );
}
