import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";
import { N, N_RGB, FONT_LINK, NeonBox, NeonBtn, SignatureFooter } from "../design/neon";

const MONTHLY_URL = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";
const ANNUAL_URL = "https://buy.stripe.com/14A5kD4B981AgTxcuM18c09";

const freeTools = [
  { icon: "✅", title: "The Payroll Checklist Nobody Gave You", desc: "Pay period, quarterly, annual, and 1099 — three checklists in one. Each tracks independently.", cta: "Get the Checklist", href: "/tools/payroll-checklist", color: N.blue, rgb: N_RGB.blue },
  { icon: "📥", title: "Stop Drowning in Email Attachments", desc: "The Python script that pulls every invoice and vendor doc out of your inbox — sorted, named, waiting for you every morning.", cta: "Get the Guide + Script", href: "/tools/email-attachments", color: N.orange, rgb: N_RGB.orange },
  { icon: "📋", title: "Client Visit Summary", desc: "A fillable, printable leave-behind for every client visit. What got done, what's still needed, what happens next.", cta: "Get the Template", href: "/tools/client-visit-summary", color: N.pink, rgb: N_RGB.pink },
  { icon: "✉️", title: "What to Actually Say", desc: "10 client communication templates — late invoices, scope creep, bad news, after-hours texters, and the client you need to fire.", cta: "Get the Templates", href: "/tools/communication-templates", color: N.blue, rgb: N_RGB.blue },
  { icon: "🏦", title: "ACH Banking Form", desc: "Collect banking details from a vendor or employee — or package your own to share. Printable, fillable, no data stored.", cta: "Use the Form", href: "/tools/ach-form", color: N.orange, rgb: N_RGB.orange },
  { icon: "💵", title: "Payroll Stub Calculator", desc: "Gross pay, federal and state withholding, FICA, deductions, printable stub. All 50 states. You look up your state table — the tool does the math.", cta: "Calculate a Stub", href: "/tools/payroll-calculator", color: N.pink, rgb: N_RGB.pink },
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
    .lp-hero-flex { flex-direction: column !important; }
    .lp-hero-copy h1 { font-size: 28px !important; }
    .lp-main { padding: 36px 16px 60px !important; }
    .lp-grid { grid-template-columns: 1fr !important; }
    .lp-membership { flex-direction: column !important; padding: 32px 24px !important; }
    .lp-membership-price { text-align: left !important; min-width: unset !important; width: 100% !important; }
    .lp-bottom-cta { flex-direction: column !important; align-items: flex-start !important; }
  }
`;

export default function Landing({ session }) {
  const [newTools, setNewTools] = useState([]);

  useEffect(() => {
    supabase.from("tools").select("title, category, is_free, published_at")
      .eq("is_published", true).order("published_at", { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setNewTools(data); });
  }, []);

  return (
    <div style={{ fontFamily: "'Figtree', sans-serif", background: N.white, color: N.ink, lineHeight: 1.65 }}>
      <style>{MOBILE}</style>
      <link href={FONT_LINK} rel="stylesheet" />

      {/* HERO — logo left, pitch right */}
      <div style={{ background: N.white, padding: "48px 0 24px" }}>
        <div className="lp-hero-flex" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
          <a href="/" style={{ display: "block", textDecoration: "none" }}>
            <img src="/cares-works-neon-logo.png" alt="CARES Works" style={{ maxHeight: 220, width: "auto", maxWidth: "100%", display: "block", borderRadius: 20, boxShadow: "0 8px 32px rgba(0,128,255,0.28)" }} />
          </a>
          <div className="lp-hero-copy" style={{ maxWidth: 460, flex: "1 1 320px" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: N.orange, marginBottom: 14, fontWeight: 700, textShadow: "0 0 10px rgba(255,138,42,0.5)" }}>
              CARES Works · Tools that do the actual work.
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4.5vw, 44px)", lineHeight: 1.1, marginBottom: 16, color: N.ink }}>
              Built from real work.<br /><em style={{ fontStyle: "italic", color: N.blueHot }}>Not a course. Not a coach.</em>
            </h1>
            <p style={{ fontSize: 16, color: N.muted, marginBottom: 24, lineHeight: 1.6 }}>
              Plain-English tools for the business problems nobody taught you how to solve. New tools added monthly.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
              {[{ p: "New tools monthly", c: N.blue }, { p: "No fluff", c: N.pink }, { p: "Ask Kari — real answers", c: N.orange }].map(chip => (
                <div key={chip.p} style={{ background: N.white, border: `1.5px solid ${chip.c}`, borderRadius: 100, padding: "6px 14px", fontSize: 12, color: chip.c, fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em", fontWeight: 700, boxShadow: `0 0 12px ${chip.c}33` }}>{chip.p}</div>
              ))}
            </div>
            {session ? (
              <NeonBtn color={N.blue} onClick={() => navigate("/dashboard")} mono>My Dashboard →</NeonBtn>
            ) : (
              <>
                <a href={MONTHLY_URL} style={{ display: "inline-block", background: N.blue, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 32px", borderRadius: 8, textDecoration: "none", marginBottom: 10, fontWeight: 700, boxShadow: `0 6px 20px rgba(0,128,255,0.5)` }}>
                  Join CARES Works — $27/month
                </a>
                <div style={{ fontSize: 12, color: N.muted, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>or <a href={ANNUAL_URL} style={{ color: N.orange, textDecoration: "none", fontWeight: 700 }}>$270/year</a> · cancel anytime</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* LIBRARY SCROLLER — neon-outlined "The Library" label, scrolling titles */}
      {newTools.length > 0 && (
        <div style={{ background: N.ink, overflow: "hidden", display: "flex", alignItems: "stretch", boxShadow: `0 0 30px rgba(0,128,255,0.35)` }}>
          <style>{"@keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .lib-track { display: flex; width: max-content; animation: scroll-left 80s linear infinite; align-items: center; } .lib-track:hover { animation-play-state: paused; }"}</style>
          <div style={{ background: `linear-gradient(135deg, ${N.blue}, ${N.blueDark})`, padding: "0 24px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, height: 48, boxShadow: `4px 0 20px rgba(0,128,255,0.6)`, zIndex: 2, position: "relative" }}>
            <span style={{ fontSize: 20 }}>📚</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: N.white, fontWeight: 700, whiteSpace: "nowrap" }}>The Library</span>
          </div>
          <div style={{ overflow: "hidden", height: 48, flex: 1, position: "relative" }}>
            <div className="lib-track">
              {[...newTools, ...newTools].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", height: 48, flexShrink: 0, padding: "0 22px", borderRight: `1px solid ${N.rule}` }}>
                  <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.9)", whiteSpace: "nowrap", fontWeight: 500 }}>{t.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <div className="lp-main" style={{ maxWidth: 1000, margin: "0 auto", padding: "56px 24px 40px" }}>

        {/* VANITY QUOTE — pink neon */}
        <NeonBox color={N.pink} rgb={N_RGB.pink} style={{ padding: "24px 32px", marginBottom: 48, display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>📊</span>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(16px, 2.5vw, 22px)", color: N.ink, fontStyle: "italic", margin: 0 }}>
            "Revenue is vanity. Net profit is sanity." — The framework nobody taught you is inside.
          </p>
        </NeonBox>

        {/* FREE TOOLS */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: N.muted, fontWeight: 700 }}>Free Tools</p>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, background: `rgba(${N_RGB.blue},0.1)`, color: N.blue, padding: "3px 10px", borderRadius: 100, letterSpacing: "0.08em", border: `1px solid ${N.blue}`, fontWeight: 700 }}>No account needed</span>
        </div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 3vw, 30px)", marginBottom: 12, color: N.ink }}>Start here. Take what you need.</h2>
        <p style={{ fontSize: 14, color: N.muted, marginBottom: 32, lineHeight: 1.6 }}>These are completely free. No login, no credit card, no catch. Just tools.</p>

        <div className="lp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 22, marginBottom: 64 }}>
          {freeTools.map(t => (
            <a key={t.title} href={t.href} style={{ textDecoration: "none", color: "inherit" }}>
              <NeonBox color={t.color} rgb={t.rgb} style={{ padding: "24px 24px", display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: `rgba(${t.rgb},0.1)`, border: `1.5px solid ${t.color}` }}>{t.icon}</div>
                <span style={{ display: "inline-block", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, background: `rgba(${N_RGB.blue},0.1)`, color: N.blue, fontWeight: 700, alignSelf: "flex-start", border: `1px solid ${N.blue}` }}>Free — no login needed</span>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, lineHeight: 1.25, color: N.ink }}>{t.title}</div>
                <div style={{ fontSize: 14, color: N.muted, flex: 1, lineHeight: 1.55 }}>{t.desc}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em", color: t.color, fontWeight: 700, marginTop: 8 }}>{t.cta} →</div>
              </NeonBox>
            </a>
          ))}
        </div>

        {/* MEMBERSHIP — big neon-outlined block */}
        <NeonBox id="join" color={N.blue} rgb={N_RGB.blue} scale={1.6} style={{ padding: "48px", marginBottom: 64 }}>
          <div className="lp-membership" style={{ display: "flex", gap: 48, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: N.blue, marginBottom: 12, fontWeight: 700 }}>CARES Works Membership</div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, lineHeight: 1.15, color: N.ink }}>
                Everything you need.<br /><em style={{ fontStyle: "italic", color: N.blueHot }}>One tool at a time.</em>
              </h2>
              <p style={{ fontSize: 15, color: N.muted, marginBottom: 20, lineHeight: 1.65 }}>
                New tools drop monthly. The Debrief — Kari's monthly video — answers real member questions. Court of Accounts serialized chapter by chapter.
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8, padding: 0, margin: 0 }}>
                {["Full tool library — Money, People, Communication, Leadership", "New tools added monthly — sometimes more", "The Debrief — monthly video: teaching + your questions answered", "Court of Accounts — one chapter per month (annual = full book day one)", "Ask Kari — real answers from someone who's seen your exact situation"].map(p => (
                  <li key={p} style={{ fontSize: 14, color: N.ink, display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ color: N.blue, fontWeight: 700, flexShrink: 0 }}>→</span> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-membership-price" style={{ textAlign: "center", flexShrink: 0, minWidth: 220 }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 52, color: N.ink, lineHeight: 1, marginBottom: 4 }}>$27<span style={{ fontFamily: "'Figtree', sans-serif", fontSize: 16, color: N.muted, fontWeight: 400 }}>/mo</span></div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, marginBottom: 20, letterSpacing: "0.05em" }}>or <strong style={{ color: N.orange }}>$270/year</strong> — 2 months free</div>
              <a href={MONTHLY_URL} style={{ display: "block", background: N.blue, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 28px", borderRadius: 8, textDecoration: "none", marginBottom: 10, textAlign: "center", fontWeight: 700, boxShadow: `0 6px 20px rgba(0,128,255,0.5)` }}>Join Monthly — $27/mo</a>
              <a href={ANNUAL_URL} style={{ display: "block", background: N.orange, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 28px", borderRadius: 8, textDecoration: "none", marginBottom: 10, textAlign: "center", fontWeight: 700, boxShadow: `0 6px 20px rgba(255,138,42,0.5)` }}>Join Annual — $270/yr</a>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, letterSpacing: "0.05em" }}>Full tool library. New monthly drops.<br />Monthly Debrief. Cancel anytime.</div>
            </div>
          </div>
        </NeonBox>

        {/* MEMBER TOOLS */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: N.muted, fontWeight: 700 }}>Member Tools</p>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", background: `rgba(${N_RGB.orange},0.1)`, color: N.orange, padding: "3px 10px", borderRadius: 100, border: `1px solid ${N.orange}`, fontWeight: 700 }}>New tools added monthly</span>
        </div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 3vw, 30px)", marginBottom: 8, color: N.ink }}>What's waiting inside.</h2>
        <p style={{ fontSize: 14, color: N.muted, marginBottom: 32, lineHeight: 1.6 }}>These are member-only. Join to unlock the full library.</p>

        <div className="lp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 22, marginBottom: 64 }}>
          {memberTools.map((t, i) => {
            const colors = [N.blue, N.pink, N.orange];
            const rgbs = [N_RGB.blue, N_RGB.pink, N_RGB.orange];
            const color = colors[i % 3];
            const rgb = rgbs[i % 3];
            return (
              <a key={t.title} href={MONTHLY_URL} style={{ textDecoration: "none", color: "inherit" }}>
                <NeonBox color={color} rgb={rgb} style={{ padding: "24px 24px", display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
                  {t.tag && <div style={{ position: "absolute", top: 14, right: 14, background: color, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", padding: "3px 8px", borderRadius: 100, boxShadow: `0 0 14px ${color}` }}>{t.tag}</div>}
                  <div style={{ width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: `rgba(${rgb},0.1)`, border: `1.5px solid ${color}`, marginBottom: 4 }}>{t.icon}</div>
                  <span style={{ display: "inline-block", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, background: `rgba(${rgb},0.1)`, color: color, alignSelf: "flex-start", border: `1px solid ${color}`, fontWeight: 700 }}>🔒 Members Only</span>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, lineHeight: 1.25, color: N.ink }}>{t.title}</div>
                  <div style={{ fontSize: 14, color: N.muted, flex: 1, lineHeight: 1.55 }}>{t.desc}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em", color: color, fontWeight: 700, marginTop: 8 }}>Join to access →</div>
                </NeonBox>
              </a>
            );
          })}
        </div>

        {/* ASK KARI STRIP — pink neon */}
        <NeonBox color={N.pink} rgb={N_RGB.pink} scale={1.2} style={{ padding: "36px 42px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 48 }}>
          <div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, marginBottom: 8, color: N.ink }}>Got a question? <em style={{ fontStyle: "italic", color: N.pink }}>Ask Kari.</em></h3>
            <p style={{ fontSize: 15, color: N.muted, maxWidth: 480, margin: 0 }}>Not a contact form. Not a chatbot. An actual human who has seen your exact situation before and knows what to do about it.</p>
          </div>
          <div style={{ background: N.pink, color: N.white, borderRadius: 100, padding: "8px 20px", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0, fontWeight: 700, boxShadow: `0 4px 14px ${N.pink}88` }}>
            Chat open — Ask Kari ↓
          </div>
        </NeonBox>

        {/* BOTTOM CTA — orange neon */}
        <NeonBox color={N.orange} rgb={N_RGB.orange} className="lp-bottom-cta" style={{ padding: "32px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, marginBottom: 6, color: N.ink }}>Need this done for you instead of by you?</h3>
            <p style={{ fontSize: 15, color: N.muted, margin: 0 }}>CARES Consulting does bookkeeping, HR systems, and operations setup for small businesses who are done improvising.</p>
          </div>
          <a href="https://caresmn.com" style={{ background: N.orange, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", padding: "13px 26px", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0, fontWeight: 700, boxShadow: `0 4px 14px ${N.orange}88` }}>Learn How We Work</a>
        </NeonBox>
      </div>

      <SignatureFooter />

      <footer style={{ borderTop: "1px solid " + N.rule, padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, letterSpacing: "0.08em" }}>© 2026 CARES Consulting Inc. · <a href="https://caresmn.com" style={{ color: N.muted, textDecoration: "underline" }}>caresmn.com</a></div>
        <a href="https://karikounkel.store" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, textDecoration: "none", letterSpacing: "0.08em" }}>Full Store at karikounkel.store →</a>
      </footer>
    </div>
  );
}
