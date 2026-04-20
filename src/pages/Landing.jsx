import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";

const MONTHLY_URL = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";
const ANNUAL_URL = "https://buy.stripe.com/14A5kD4B981AgTxcuM18c09";

const S = {
  slate: "#3d4560", orange: "#e8773a", orangeDark: "#c95f22",
  orangeLight: "#fdf0e8", paper: "#faf8f4", cream: "#f2ede3",
  ink: "#1e1e2a", rule: "#ddd8cc", muted: "#7a7585", gold: "#C9A84C",
};

const freeTools = [
  { icon: "✅", title: "The Payroll Checklist Nobody Gave You", desc: "Pay period, quarterly, annual, and 1099 — three checklists in one. Each tracks independently.", cta: "Get the Checklist", href: "/tools/payroll-checklist" },
  { icon: "📥", title: "Stop Drowning in Email Attachments", desc: "The Python script that pulls every invoice and vendor doc out of your inbox — sorted, named, waiting for you every morning.", cta: "Get the Guide + Script", href: "/tools/email-attachments" },
  { icon: "📋", title: "Client Visit Summary", desc: "A fillable, printable leave-behind for every client visit. What got done, what's still needed, what happens next.", cta: "Get the Template", href: "/tools/client-visit-summary" },
  { icon: "✉️", title: "What to Actually Say", desc: "10 client communication templates — late invoices, scope creep, bad news, after-hours texters, and the client you need to fire.", cta: "Get the Templates", href: "/tools/communication-templates" },
];

const memberTools = [
  { icon: "📊", title: "Net Profit Ratios + What's Your Number", desc: "The worksheet that shows you what revenue actually needs to be — starting from what you need to take home.", tag: "NEW" },
  { icon: "📗", title: "Year-End QuickBooks Triage", desc: "8 diagnostic zones. Find the fires, name the fires, put out the ones that matter. Full version." },
  { icon: "📈", title: "Chart of Accounts Cheat Sheet", desc: "The categories you actually need, the ones you don't, and why your P&L is lying to you." },
  { icon: "💰", title: "Pricing Metrics Framework", desc: "Cost of goods, labor burden, overhead allocation, margin vs markup. The math people are too embarrassed to ask about." },
  { icon: "🗂️", title: "New Hire First 30 Days", desc: "The sequence that makes you look like you have a whole HR team behind you when it's just you." },
  { icon: "📝", title: "Separation Script + Resignation Templates", desc: "Word for word. Walk in, say this, walk out. No drama, no liability." },
  { icon: "🤝", title: "Building Your Advisory Team", desc: "Who you actually need in your corner. CPA, attorney, banker, insurance, mentor." },
  { icon: "📅", title: "Planning Meetings That Actually Work", desc: "The agenda, the time blocks, and the follow-up protocol. One page. Laminate it." },
  { icon: "🔍", title: "Busy vs. Profitable — The Busyness Audit", desc: "Revenue is vanity. Net profit is sanity. This shows you whether your busyness is profitable or just exhausting." },
  { icon: "📖", title: "Court of Accounts — Serialized", desc: "A business parable set in the Kingdom of Eggerton. One chapter per month. Annual members get the full book on day one." },
  { icon: "🧾", title: "Finding a CPA — The Right Questions", desc: "What to ask before you hire one. What red flags to run from." },
  { icon: "🏗️", title: "In-House vs. Contract Decision Matrix", desc: "HR, bookkeeping, marketing, IT, legal. When you're big enough to bring it in, when you're not." },
];

const MOBILE = `
  @media (max-width: 640px) {
    .lp-hero { padding: 44px 20px 48px !important; }
    .lp-hero h1 { font-size: 28px !important; }
    .lp-hero p { font-size: 15px !important; }
    .lp-pills { flex-wrap: wrap !important; justify-content: center !important; }
    .lp-header { padding: 14px 20px !important; }
    .lp-header-nav { display: none !important; }
    .lp-main { padding: 36px 16px 60px !important; }
    .lp-grid { grid-template-columns: 1fr !important; }
    .lp-membership { flex-direction: column !important; padding: 28px 20px !important; }
    .lp-membership-price { text-align: left !important; min-width: unset !important; width: 100% !important; }
    .lp-cta-strip { flex-direction: column !important; padding: 28px 20px !important; }
    .lp-bottom-cta { flex-direction: column !important; padding: 24px 20px !important; }
    .lp-footer { padding: 20px 16px !important; flex-direction: column !important; gap: 8px !important; }
    .lp-vanity { padding: 18px 20px !important; }
    .lp-vanity p { font-size: 16px !important; }
  }
`;

export default function Landing({ session }) {
  const [newTools, setNewTools] = useState([]);

  useEffect(() => {
    supabase.from("tools").select("title, category, is_free, published_at")
      .eq("is_published", true).order("published_at", { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setNewTools(data); });

    const script = document.createElement("script");
    script.src = "https://chat.karikounkel.com/widget.js";
    script.defer = true;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  return (
    <div style={{ fontFamily: "'Figtree', sans-serif", background: S.paper, color: S.ink, lineHeight: 1.65 }}>
      <style>{MOBILE}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header className="lp-header" style={{ padding: "20px 40px", borderBottom: "1px solid " + S.rule, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, background: "#fff" }}>
        <a href="/" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: S.ink, textDecoration: "none" }}>
          CARES <span style={{ color: S.orange }}>Works.</span>
        </a>
        <nav className="lp-header-nav" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <a href="https://caresmn.com" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: S.muted, textDecoration: "none" }}>Home</a>
          <a href="https://caresmn.com/#services" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: S.muted, textDecoration: "none" }}>Services</a>
          {session ? (
            <button onClick={() => navigate("/dashboard")} style={{ background: S.orange, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", padding: "9px 18px", borderRadius: 4, border: "none", cursor: "pointer" }}>My Dashboard</button>
          ) : (
            <a href={MONTHLY_URL} style={{ background: S.orange, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", padding: "9px 18px", borderRadius: 4, textDecoration: "none" }}>Join — $27/mo</a>
          )}
        </nav>
        {/* Mobile join button */}
        {!session && (
          <a href={MONTHLY_URL} className="lp-header-mobile-join" style={{ display: "none", background: S.orange, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 16px", borderRadius: 4, textDecoration: "none" }}>Join — $27/mo</a>
        )}
      </header>

      {/* HERO */}
      <div className="lp-hero" style={{ background: S.slate, color: "#fff", padding: "64px 24px 68px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 25% 60%, rgba(232,119,58,0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(196,86,106,0.1) 0%, transparent 50%)" }} />
        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: S.orange, marginBottom: 16 }}>CARES Works · Tools that do the actual work.</p>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 5vw, 50px)", lineHeight: 1.15, marginBottom: 16 }}>
            Built from real work.<br /><em style={{ fontStyle: "italic", color: S.orange }}>Not a course. Not a coach.</em>
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", maxWidth: 500, margin: "0 auto 32px" }}>
            Plain-English tools for the business problems nobody taught you how to solve. New tools added monthly.
          </p>
          <div className="lp-pills" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
            {["New tools monthly", "No fluff", "Ask Kari — real answers"].map(p => (
              <div key={p} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 100, padding: "7px 16px", fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>{p}</div>
            ))}
          </div>
          <a href={MONTHLY_URL} style={{ display: "inline-block", background: S.orange, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 32px", borderRadius: 6, textDecoration: "none", marginBottom: 12 }}>
            Join CARES Works — $27/month
          </a>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>or <a href={ANNUAL_URL} style={{ color: S.gold, textDecoration: "none", fontWeight: 700 }}>$270/year</a> · cancel anytime</div>
        </div>
      </div>
      <div style={{ height: 4, background: S.orange }} />

      {/* LIBRARY SCROLLER — framed left, items scroll out */}
      {newTools.length > 0 && (
        <div style={{ background: S.slate, overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "stretch" }}>
          <style>{"@keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .lib-track { display: flex; width: max-content; animation: scroll-left 80s linear infinite; align-items: center; } .lib-track:hover { animation-play-state: paused; } @media (max-width: 640px) { .lib-banner { padding: 0 14px !important; } .lib-banner-label { font-size: 10px !important; letter-spacing: 0.1em !important; } .lib-banner-icon { font-size: 16px !important; } }"}</style>
          {/* LEFT BANNER — the cute "Library" frame */}
          <div className="lib-banner" style={{ background: "linear-gradient(135deg, #e8773a, #c95f22)", padding: "0 24px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, height: 48, boxShadow: "4px 0 12px rgba(0,0,0,0.15)", zIndex: 2, position: "relative" }}>
            <span className="lib-banner-icon" style={{ fontSize: 20 }}>📚</span>
            <span className="lib-banner-label" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#fff", fontWeight: 700, whiteSpace: "nowrap" }}>The Library</span>
          </div>
          {/* SCROLLING TRACK — items flow out of the banner */}
          <div style={{ overflow: "hidden", height: 48, flex: 1, position: "relative" }}>
            <div className="lib-track">
              {[...newTools, ...newTools].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", height: 48, flexShrink: 0, padding: "0 22px", borderRight: "1px solid " + S.orange }}>
                  <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap", fontWeight: 500 }}>{t.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <div className="lp-main" style={{ maxWidth: 1000, margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* VANITY */}
        <div className="lp-vanity" style={{ background: S.cream, border: "1px solid " + S.rule, borderLeft: "4px solid " + S.orange, borderRadius: 10, padding: "24px 32px", marginBottom: 48, display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>📊</span>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(16px, 2.5vw, 22px)", color: S.slate, fontStyle: "italic" }}>
            "Revenue is vanity. Net profit is sanity." — The framework nobody taught you is inside.
          </p>
        </div>

        {/* FREE TOOLS */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#5a6481" }}>Free Tools</p>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, background: "#eef0f6", color: S.slate, padding: "3px 10px", borderRadius: 100, letterSpacing: "0.08em" }}>No account needed</span>
        </div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 3vw, 30px)", marginBottom: 12, color: S.slate }}>Start here. Take what you need.</h2>
        <p style={{ fontSize: 14, color: S.muted, marginBottom: 32, lineHeight: 1.6 }}>These are completely free. No login, no credit card, no catch. Just tools.</p>

        <div className="lp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20, marginBottom: 64 }}>
          {freeTools.map(t => (
            <a key={t.title} href={t.href} style={{ background: "#fff", border: "2px solid #eef0f6", borderRadius: 10, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 10, textDecoration: "none", color: "inherit", transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.09)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = S.orange; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "#eef0f6"; }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: "#fdf0e8" }}>{t.icon}</div>
              <span style={{ display: "inline-block", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, background: "#fdf0e8", color: S.orange, fontWeight: 700 }}>Free — no login needed</span>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, lineHeight: 1.25, color: S.slate }}>{t.title}</div>
              <div style={{ fontSize: 14, color: S.muted, flex: 1, lineHeight: 1.55 }}>{t.desc}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em", color: S.orange, fontWeight: 500, marginTop: 8 }}>{t.cta} →</div>
            </a>
          ))}
        </div>

        {/* MEMBERSHIP BLOCK */}
        <div id="join" style={{ background: S.slate, borderRadius: 14, padding: "48px", color: "#fff", marginBottom: 64, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 90% 50%, rgba(232,119,58,0.15) 0%, transparent 60%)" }} />
          <div className="lp-membership" style={{ position: "relative", display: "flex", gap: 48, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 12 }}>CARES Works Membership</div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, lineHeight: 1.15 }}>
                Everything you need.<br /><em style={{ fontStyle: "italic" }}>One tool at a time.</em>
              </h2>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 20, lineHeight: 1.65 }}>
                New tools drop monthly. The Debrief — Kari's monthly video — answers real member questions. Court of Accounts serialized chapter by chapter.
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {["Full tool library — Money, People, Communication, Leadership", "New tools added monthly — sometimes more", "The Debrief — monthly video: teaching + your questions answered", "Court of Accounts — one chapter per month (annual = full book day one)", "Ask Kari — real answers from someone who's seen your exact situation"].map(p => (
                  <li key={p} style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ color: S.orange, fontWeight: 700, flexShrink: 0 }}>→</span> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-membership-price" style={{ textAlign: "center", flexShrink: 0, minWidth: 200 }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 52, color: "#fff", lineHeight: 1, marginBottom: 4 }}>$27<span style={{ fontFamily: "'Figtree', sans-serif", fontSize: 16, color: "rgba(255,255,255,0.5)", fontWeight: 400 }}>/mo</span></div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 20, letterSpacing: "0.05em" }}>or <strong style={{ color: S.gold }}>$270/year</strong> — 2 months free</div>
              <a href={MONTHLY_URL} style={{ display: "block", background: S.orange, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 28px", borderRadius: 6, textDecoration: "none", marginBottom: 8, textAlign: "center" }}>Join Monthly — $27/mo</a>
              <a href={ANNUAL_URL} style={{ display: "block", background: "linear-gradient(135deg,#C9A84C,#e0c060)", color: "#1e1e2a", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 28px", borderRadius: 6, textDecoration: "none", marginBottom: 10, textAlign: "center", fontWeight: 700 }}>Join Annual — $270/yr</a>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>Full tool library. New monthly drops.<br />Monthly Debrief. Cancel anytime.</div>
            </div>
          </div>
        </div>

        {/* MEMBER TOOLS */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#5a6481" }}>Member Tools</p>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", background: "#fdf0e8", color: "#c95f22", padding: "3px 10px", borderRadius: 100 }}>New tools added monthly</span>
        </div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 3vw, 30px)", marginBottom: 8, color: S.slate }}>What's waiting inside.</h2>
        <p style={{ fontSize: 14, color: S.muted, marginBottom: 32, lineHeight: 1.6 }}>These are member-only. Join to unlock the full library.</p>

        <div className="lp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20, marginBottom: 64 }}>
          {memberTools.map(t => (
            <a key={t.title} href={MONTHLY_URL} style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 10, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 10, textDecoration: "none", color: "inherit", position: "relative", cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(232,119,58,0.15)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              {t.tag && <div style={{ position: "absolute", top: 14, right: 14, background: S.orange, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", padding: "2px 8px", borderRadius: 100 }}>{t.tag}</div>}
              <div style={{ position: "absolute", top: t.tag ? 40 : 14, right: 14, width: 24, height: 24, background: "#fdf0e8", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>🔒</div>
              <div style={{ width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: "#eef0f6", marginBottom: 4 }}>{t.icon}</div>
              <span style={{ display: "inline-block", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, background: "#fdf0e8", color: "#c95f22" }}>Members Only</span>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, lineHeight: 1.25, color: S.slate }}>{t.title}</div>
              <div style={{ fontSize: 14, color: S.muted, flex: 1, lineHeight: 1.55 }}>{t.desc}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em", color: S.orange, fontWeight: 500, marginTop: 8 }}>Join to access →</div>
            </a>
          ))}
        </div>

        {/* ASK KARI STRIP */}
        <div className="lp-cta-strip" style={{ background: S.slate, color: "#fff", borderRadius: 12, padding: "40px 44px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 48, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 10% 50%, rgba(232,119,58,0.2) 0%, transparent 60%)" }} />
          <div style={{ position: "relative" }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, marginBottom: 8 }}>Got a question? <em style={{ fontStyle: "italic", color: S.orange }}>Ask Kari.</em></h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", maxWidth: 480 }}>Not a contact form. Not a chatbot. An actual human who has seen your exact situation before and knows what to do about it.</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 100, padding: "8px 20px", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", flexShrink: 0, position: "relative" }}>
            Chat open — Ask Kari ↓
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid " + S.rule, margin: "48px 0" }} />

        <div className="lp-bottom-cta" style={{ background: S.cream, border: "1px solid " + S.rule, borderRadius: 10, padding: "36px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, marginBottom: 6, color: S.slate }}>Need this done for you instead of by you?</h3>
            <p style={{ fontSize: 15, color: S.muted }}>CARES Consulting does bookkeeping, HR systems, and operations setup for small businesses who are done improvising.</p>
          </div>
          <a href="https://caresmn.com" style={{ background: S.slate, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", padding: "13px 26px", borderRadius: 4, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>Learn How We Work</a>
        </div>
      </div>

      <footer className="lp-footer" style={{ borderTop: "1px solid " + S.rule, padding: "28px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.rule, letterSpacing: "0.08em" }}>© 2026 CARES Consulting Inc. · <a href="https://caresmn.com" style={{ color: S.muted, textDecoration: "underline", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em" }}>caresmn.com</a></div>
        <a href="https://karikounkel.store" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.muted, textDecoration: "none", letterSpacing: "0.08em" }}>Full Store at karikounkel.store →</a>
      </footer>
    </div>
  );
}
