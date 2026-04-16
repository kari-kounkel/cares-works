import { useState } from "react";

const S = {
  slate: "#3d4560", orange: "#e8773a", orangeLight: "#fdf0e8",
  paper: "#faf8f4", cream: "#f2ede3", ink: "#1e1e2a",
  rule: "#ddd8cc", muted: "#7a7585", gold: "#C9A84C",
  grad: "linear-gradient(135deg, #e8773a, #c95f22)",
};

const TEMPLATES = [
  {
    id: 1, tag: "Late Invoice", title: "The Gentle First Notice",
    when: "Invoice is 7-14 days past due. First outreach. Assume good faith.",
    body: "Hi [Client Name],\n\nI wanted to follow up on invoice #[NUMBER] for $[AMOUNT], which was due on [DATE]. I know things get busy — just wanted to make sure it did not get lost.\n\nIf you have any questions about the invoice or need to discuss payment timing, I am happy to talk. Otherwise, you can pay online at [LINK] or by check made out to [YOUR BUSINESS NAME].\n\nThank you — I appreciate you and our work together.\n\n[Your Name]",
  },
  {
    id: 2, tag: "Late Invoice", title: "The Firm Second Notice",
    when: "Invoice is 30+ days past due. Friendly is over. Professional is non-negotiable.",
    body: "Hi [Client Name],\n\nThis is a follow-up regarding invoice #[NUMBER] for $[AMOUNT], now [X] days past due. I have reached out once already and have not received payment or a response.\n\nI would like to resolve this quickly. Please send payment by [DATE] or contact me by [DATE] to discuss your situation. After that date, I will need to pause our work together until the balance is cleared.\n\nI value our working relationship and hope we can handle this simply.\n\n[Your Name]",
  },
  {
    id: 3, tag: "Scope Creep", title: "The Scope Conversation",
    when: "Client keeps adding work outside what you agreed to. Time to name it.",
    body: "Hi [Client Name],\n\nI want to make sure we stay on the same page as the project evolves. What you have asked about — [DESCRIBE THE ADD-ON] — is outside the scope of our current agreement, which covers [ORIGINAL SCOPE].\n\nI am happy to take this on. I will put together a short proposal for the additional work so we are both clear on cost and timeline before I begin. That way there are no surprises on either side.\n\nDoes that work for you?\n\n[Your Name]",
  },
  {
    id: 4, tag: "Bad News", title: "Delivering a Hard Truth",
    when: "You found a problem. The numbers are bad. Something went wrong. Say it directly.",
    body: "Hi [Client Name],\n\nI want to talk with you about something I found while working on [PROJECT/AREA]. [STATE THE ISSUE PLAINLY — one or two sentences. No softening, no burying it in good news first.]\n\nHere is what I think we should do: [YOUR RECOMMENDATION].\n\nI would like to schedule a call to walk through this together. Are you available [DAY/TIME OPTIONS]?\n\n[Your Name]",
  },
  {
    id: 5, tag: "Boundaries", title: "The After-Hours Texter",
    when: "Client texts at 10pm expecting answers. This ends now — kindly.",
    body: "Hi [Client Name],\n\nI wanted to reach out about something small but important. I keep my phone available for emergencies, but for general questions and updates, I work [YOUR HOURS] on [YOUR DAYS]. Texts or calls outside those hours may not get a response until the next business day.\n\nThis is not about you specifically — it is how I protect the quality of my work for all my clients, including you.\n\nGoing forward, the best way to reach me is [EMAIL/PHONE DURING HOURS]. I will always respond within [YOUR TIMEFRAME].\n\nThank you for understanding.\n\n[Your Name]",
  },
  {
    id: 6, tag: "Boundaries", title: "The One More Question Client",
    when: "Calls and emails outside your engagement keep piling up. Name the boundary without burning the relationship.",
    body: "Hi [Client Name],\n\nI love that you trust me with your questions — that is exactly what I am here for. I want to make sure you are getting the best of my attention when we connect.\n\nRight now our agreement covers [SCOPE]. Questions that go beyond that are pulling us into territory that probably warrants its own conversation. I would love to set up a quick call to assess what you need and make sure you are getting the right level of support.\n\nWould [DATE/TIME] work to connect?\n\n[Your Name]",
  },
  {
    id: 7, tag: "Firing a Client", title: "The Professional Exit",
    when: "This relationship is not working. End it clean, end it kind, end it final.",
    body: "Hi [Client Name],\n\nAfter careful consideration, I have decided to conclude our working relationship, effective [DATE — give at least 2 weeks].\n\nBetween now and [DATE], I will [WHAT YOU WILL COMPLETE OR HAND OFF]. I will make sure you have everything you need to transition smoothly.\n\nI wish you well in your business and appreciate the time we worked together.\n\n[Your Name]",
  },
  {
    id: 8, tag: "Following Up", title: "Buying Time",
    when: "Client asked something you cannot answer yet. Sound confident while you go figure it out.",
    body: "Hi [Client Name],\n\nGreat question — I want to make sure I give you accurate information rather than a quick guess. Let me look into this and get back to you by [SPECIFIC DATE/TIME].\n\n[Your Name]",
  },
  {
    id: 9, tag: "Following Up", title: "No Response — The Nudge",
    when: "You sent something and heard nothing. One clean follow-up.",
    body: "Hi [Client Name],\n\nJust circling back on my message from [DATE]. I want to make sure it did not get buried. [ONE SENTENCE on what you need from them or what you sent.]\n\nLet me know if you have questions or need anything from me.\n\n[Your Name]",
  },
  {
    id: 10, tag: "Onboarding", title: "Setting Expectations at the Start",
    when: "New client. New engagement. Set the tone before any confusion starts.",
    body: "Hi [Client Name],\n\nI am looking forward to working with you. Before we get started, I want to make sure we are set up for a great experience.\n\nHere is how I work:\n— My hours are [HOURS], [DAYS]. I respond to messages within [TIMEFRAME].\n— The best way to reach me is [METHOD].\n— For [TYPE OF REQUEST], please give me [LEAD TIME] whenever possible.\n— If something urgent comes up, [HOW TO FLAG IT].\n\nYou will hear from me [WHEN — e.g., weekly on Fridays with a status update]. If something changes on your end that affects our work, I just ask that you let me know as soon as you can.\n\nI am glad you are here. Let us do good work together.\n\n[Your Name]",
  },
];

const TAG_COLORS = {
  "Late Invoice": { bg: "#fff0e0", color: "#c95f22" },
  "Scope Creep": { bg: "#e8f0ff", color: "#3d4560" },
  "Bad News": { bg: "#ffeaea", color: "#a03030" },
  "Boundaries": { bg: "#f0faf0", color: "#2d7a2d" },
  "Firing a Client": { bg: "#f5e8ff", color: "#6a30a0" },
  "Following Up": { bg: "#fdf0e8", color: "#e8773a" },
  "Onboarding": { bg: "#e8f8f5", color: "#1a7a60" },
};

export default function CommunicationTemplates() {
  const [open, setOpen] = useState(null);
  const [copied, setCopied] = useState(null);

  const copy = (id, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', sans-serif", color: S.ink }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header style={{ background: S.slate, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, boxShadow: "0 2px 12px rgba(0,0,0,0.15)", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff", textDecoration: "none" }}>
          CARES <span style={{ color: S.orange }}>Works.</span>
        </a>
        <a href="/dashboard" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textDecoration: "none" }}>{"<- Dashboard"}</a>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 10 }}>Free Tool — Communication</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: S.slate, lineHeight: 1.15, marginBottom: 16 }}>What to Actually Say</h1>
          <p style={{ fontSize: 16, color: S.muted, lineHeight: 1.7, maxWidth: 580, marginBottom: 24 }}>
            10 templates for the situations nobody teaches you. Late invoices, scope creep, bad news, after-hours texters, and the client you need to fire. Click any one to open it. Copy and use.
          </p>
          <div style={{ width: 48, height: 3, background: S.grad, borderRadius: 100 }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {TEMPLATES.map(t => {
            const isOpen = open === t.id;
            const tagStyle = TAG_COLORS[t.tag] || { bg: S.orangeLight, color: S.orange };
            return (
              <div key={t.id} style={{ background: "#fff", border: "1px solid " + (isOpen ? S.orange : S.rule), borderRadius: 12, overflow: "hidden", transition: "border-color 0.15s" }}>
                <div onClick={() => setOpen(isOpen ? null : t.id)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 24px", cursor: "pointer" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: S.orangeLight, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.orange, fontWeight: 700, flexShrink: 0 }}>
                    {t.id}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 3 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", background: tagStyle.bg, color: tagStyle.color, padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>{t.tag}</span>
                    </div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: S.slate, lineHeight: 1.3 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>{t.when}</div>
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: S.muted, flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</div>
                </div>
                {isOpen && (
                  <div style={{ borderTop: "1px solid " + S.rule, padding: "24px", background: S.cream }}>
                    <pre style={{ fontFamily: "'Figtree', sans-serif", fontSize: 14, color: S.ink, lineHeight: 1.8, whiteSpace: "pre-wrap", margin: "0 0 20px" }}>{t.body}</pre>
                    <button onClick={() => copy(t.id, t.body)} style={{ padding: "9px 20px", background: copied === t.id ? "#5a9a5a" : S.grad, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", transition: "background 0.2s" }}>
                      {copied === t.id ? "Copied!" : "Copy Template"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 48, background: S.slate, borderRadius: 14, padding: "36px 40px", color: "#fff", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(232,119,58,0.15) 0%, transparent 60%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 10 }}>CARES Works Membership</div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, marginBottom: 10, lineHeight: 1.2 }}>There are 15 more tools like this one.</h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 24, maxWidth: 460 }}>New tool every week. Monthly Debrief with real answers. Court of Accounts — a business parable that actually teaches something. $27/month.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <a href="https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06" style={{ display: "inline-block", background: S.grad, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", padding: "12px 28px", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>Join Monthly — $27/mo</a>
              <a href="https://buy.stripe.com/5kQ8wPd7F3Lk6eT3Yg18c07" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.gold, textDecoration: "none", letterSpacing: "0.08em", fontWeight: 700 }}>Or annual — $197/year</a>
            </div>
          </div>
        </div>

      </div>
      <script src="https://chat.karikounkel.com/widget.js" defer></script>
    </div>
  );
}
