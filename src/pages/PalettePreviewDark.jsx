// PalettePreviewDark.jsx — the "gulp we did a black background" variant.
// Same components as PalettePreview but on near-black with brighter neon.
// Routed at /preview/neon-dark (public, no auth needed).

// NEON ON BLACK
const D = {
  blue:      "#3b82f6",   // brighter blue for dark bg pop
  blueHot:   "#60a5fa",   // hover / highlight
  blueTint:  "rgba(59,130,246,0.14)",  // subtle backgrounds
  blueGlow:  "rgba(59,130,246,0.55)",
  black:     "#050510",   // page background
  surface:   "#0d1220",   // elevated panels
  surface2:  "#141a2b",   // cards
  text:      "#f8fafc",   // near-white body
  muted:     "#94a3b8",   // cool slate for secondary
  rule:      "#1e293b",   // borders
  ruleHot:   "#334155",   // stronger borders
  green:     "#22c55e",
  grad:      "linear-gradient(135deg, #3b82f6, #1d4ed8)",
};

export default function PalettePreviewDark() {
  return (
    <div style={{ minHeight: "100vh", background: D.black, color: D.text, fontFamily: "'Figtree', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAV BAR */}
      <header style={{ background: D.black, borderBottom: "1px solid " + D.rule, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68, position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <div style={{ padding: "4px 8px", background: "rgba(255,255,255,0.06)", borderRadius: 8 }}>
            <img src="/cares-works-logo.png" alt="CARES Works" style={{ height: 30, width: "auto", display: "block", filter: "brightness(1.05)" }} />
          </div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: D.text }}>
            CARES <span style={{ color: D.blueHot, textShadow: "0 0 12px " + D.blueGlow }}>Works.</span>
          </span>
        </a>
        <div style={{ display: "flex", gap: 4, background: D.surface, borderRadius: 10, padding: 4, border: "1px solid " + D.rule }}>
          {["Tool Library", "My Work", "The Debrief", "Court of Accounts", "Shop", "Account"].map((t, i) => (
            <div key={t} style={{ padding: "6px 14px", borderRadius: 7, background: i === 0 ? D.blue : "transparent", color: i === 0 ? D.text : D.muted, fontSize: 12, fontWeight: i === 0 ? 700 : 500, cursor: "pointer", boxShadow: i === 0 ? "0 0 20px " + D.blueGlow : "none" }}>{t}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", background: D.blueTint, color: D.blueHot, padding: "5px 10px", borderRadius: 100, fontWeight: 700, border: "1px solid " + D.blue }}>ANNUAL</div>
          <div style={{ fontSize: 12, color: D.muted, fontFamily: "'DM Mono', monospace" }}>kari@caresmn.com</div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 100px" }}>

        <div style={{ marginBottom: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.16em", color: D.blueHot, fontWeight: 700 }}>PREVIEW — NEON ON BLACK</div>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: D.text, marginBottom: 8, lineHeight: 1.1 }}>
            Welcome back, Kari.
          </h1>
          <p style={{ color: D.text, fontSize: 17, lineHeight: 1.55, marginBottom: 4, maxWidth: 720, opacity: 0.9 }}>
            Tools, Debriefs, and practical business systems for people who are done letting chaos run the meeting.
          </p>
          <p style={{ color: D.muted, fontSize: 14, fontStyle: "italic" }}>
            Start with one problem. Find one tool. Fix one thing.
          </p>
        </div>

        {/* START HERE STRIP */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 36 }}>
          {[
            { emoji: "👋", title: "Watch the 2-Minute Welcome", desc: "What this place is, how it works, and where not to panic." },
            { emoji: "🧭", title: "Learn the Layout", desc: "Tools, Debriefs, downloads, categories, how to find what you need fast." },
            { emoji: "🔥", title: "What's New This Week", desc: "Latest tools, newest Debriefs, featured fixes." },
          ].map(c => (
            <div key={c.title} style={{ background: D.surface, border: "1px solid " + D.rule, borderRadius: 12, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 26, lineHeight: 1 }}>{c.emoji}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: D.text, lineHeight: 1.25 }}>{c.title}</div>
              <div style={{ fontSize: 13, color: D.muted, lineHeight: 1.5, flex: 1 }}>{c.desc}</div>
              <button style={{ marginTop: 6, padding: "9px 14px", background: D.blue, border: "none", borderRadius: 8, color: D.text, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", boxShadow: "0 0 24px " + D.blueGlow }}>
                {c.title.split(" ").slice(0, 2).join(" ")} →
              </button>
            </div>
          ))}
        </div>

        {/* WHAT'S NEW */}
        <div style={{ marginBottom: 40, padding: "26px 28px", background: D.surface, border: "1px solid " + D.rule, borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: D.text, margin: 0 }}>🔥 What's New This Week</h2>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: D.muted, letterSpacing: "0.06em" }}>Updated Jul 8</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { tag: "NEW TOOL", icon: "🛠️", title: "Vendor Decoder", desc: "Turn your vendor list into a posting playbook." },
              { tag: "NEW DEBRIEF", icon: "☕", title: "Cash Flow Is Not a Vibe", desc: "Bank balance is not the business model." },
              { tag: "FEATURED FIX", icon: "🎯", title: "Open Your Vendor List", desc: "Count the duplicates. That number is telling on you." },
            ].map(b => (
              <div key={b.tag} style={{ background: D.surface2, border: "1px solid " + D.rule, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15 }}>{b.icon}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: D.blueHot, fontWeight: 700 }}>{b.tag}</span>
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: D.text, lineHeight: 1.3 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: D.muted, lineHeight: 1.5, flex: 1 }}>{b.desc}</div>
                <button style={{ marginTop: 6, padding: "6px 10px", background: D.blue, border: "none", borderRadius: 5, color: D.text, fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
                  Open →
                </button>
              </div>
            ))}
            <div style={{ background: "linear-gradient(135deg, #0a0f1e, #0d1a3a)", borderRadius: 10, padding: "14px 16px", color: D.text, display: "flex", flexDirection: "column", gap: 5, boxShadow: "0 0 0 1px " + D.blue + ", 0 0 24px " + D.blueGlow }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: D.blueHot, fontWeight: 700 }}>✨ KARI'S NOTE</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, lineHeight: 1.3 }}>This Week</div>
              <div style={{ fontSize: 12, color: "rgba(248,250,252,0.7)", lineHeight: 1.5, fontStyle: "italic" }}>
                Clarity. Not perfection. One less pile. One place where the truth can take its coat off.
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH + FILTERS */}
        <div style={{ marginBottom: 14, position: "relative" }}>
          <input type="text" placeholder="Search tools…"
            style={{ width: "100%", padding: "12px 16px 12px 44px", fontSize: 14, background: D.surface, border: "1.5px solid " + D.rule, borderRadius: 10, outline: "none", color: D.text, boxSizing: "border-box" }} />
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: D.muted, pointerEvents: "none" }}>🔍</span>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {[
            { label: "All", active: true },
            { label: "📒 Bookkeeping", active: false },
            { label: "💰 Money", active: true, glow: true },
            { label: "👥 People", active: false },
            { label: "🤝 Client Work", active: false },
            { label: "🎯 Leadership", active: false },
          ].map(c => (
            <button key={c.label}
              style={{ padding: "7px 16px", borderRadius: 100, border: "1.5px solid " + (c.active ? D.blue : D.rule), background: c.active ? D.blue : D.surface, color: c.active ? D.text : D.muted, fontSize: 12, fontWeight: c.active ? 700 : 500, cursor: "pointer", boxShadow: c.glow ? "0 0 16px " + D.blueGlow : "none" }}>
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 26 }}>
          <div style={{ display: "flex", gap: 3, background: D.surface, border: "1px solid " + D.rule, borderRadius: 100, padding: 3 }}>
            {["ALL", "FREE", "MEMBER"].map((l, i) => (
              <div key={l} style={{ padding: "5px 14px", borderRadius: 100, background: i === 0 ? D.blueTint : "transparent", color: i === 0 ? D.blueHot : D.muted, fontSize: 11, fontWeight: i === 0 ? 700 : 500, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", cursor: "pointer" }}>{l}</div>
            ))}
          </div>
          <button style={{ padding: "6px 14px", borderRadius: 100, border: "1.5px solid " + D.rule, background: D.surface, color: D.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>
            ✨ NEW ONLY
          </button>
        </div>

        {/* TOOL CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginBottom: 44 }}>
          {[
            { icon: "🗂️", cat: "BOOKKEEPING", title: "Vendor Decoder", desc: "Turn your vendor list into a posting playbook. Every account lands where it belongs.", tag: "NEW" },
            { icon: "📊", cat: "MONEY", title: "Monthly Numbers Scorecard", desc: "Seven numbers. Fifteen minutes. The difference between knowing your business and guessing.", tag: "NEW" },
            { icon: "☕", cat: "MONEY", title: "The Collections Playbook", desc: "Most of us send the same friendly nudge seven times and call it collections. It's begging with a smile." },
          ].map(t => (
            <div key={t.title} style={{ background: D.surface, border: "1px solid " + D.rule, borderRadius: 12, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
              {t.tag && <div style={{ position: "absolute", top: 14, right: 14, background: D.blue, color: D.text, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", padding: "3px 8px", borderRadius: 100, boxShadow: "0 0 14px " + D.blueGlow }}>{t.tag}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: D.blueTint, border: "1px solid " + D.rule }}>{t.icon}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: D.muted }}>{t.cat}</div>
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, lineHeight: 1.3, color: D.text }}>{t.title}</div>
              <div style={{ fontSize: 13, color: D.muted, lineHeight: 1.55, flex: 1 }}>{t.desc}</div>
              <button style={{ marginTop: 6, padding: "10px 16px", background: D.blue, border: "none", borderRadius: 8, color: D.text, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", boxShadow: "0 0 20px " + D.blueGlow }}>
                Get this tool →
              </button>
            </div>
          ))}
        </div>

        {/* THE DEBRIEF PREVIEW */}
        <div style={{ marginBottom: 44 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: D.text, marginBottom: 20 }}>The Debrief</h2>
          <div style={{ background: D.surface, border: "1px solid " + D.blue, borderRadius: 12, padding: "24px 26px", boxShadow: "0 0 0 4px " + D.blueTint + ", 0 0 40px rgba(59,130,246,0.18)" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: D.blueHot, fontWeight: 700, marginBottom: 6 }}>NOBODY TOLD OWNERS THIS</div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: D.text, marginBottom: 8, lineHeight: 1.25 }}>Cash Flow Is Not a Vibe</h3>
            <p style={{ color: D.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Your bank balance is not your business model. Cash flow needs timing, visibility, and fewer surprises wearing tap shoes.
            </p>
            <div style={{ marginTop: 12, fontFamily: "'DM Mono', monospace", fontSize: 11, color: D.blueHot, fontWeight: 700, letterSpacing: "0.08em" }}>READ →</div>
          </div>
        </div>

        {/* HERO CTA PANEL */}
        <div style={{ background: "linear-gradient(135deg, #050b1e 0%, #0d1a3a 60%, #050510 100%)", borderRadius: 14, padding: "40px 44px", color: D.text, position: "relative", overflow: "hidden", marginBottom: 44, border: "1px solid " + D.rule }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 85% 50%, rgba(59,130,246,0.35), transparent 60%)" }} />
          <div style={{ position: "absolute", top: -1, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, " + D.blueHot + ", transparent)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: D.blueHot, fontWeight: 700, marginBottom: 12 }}>THERE'S MORE WHERE THIS CAME FROM</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, marginBottom: 12, lineHeight: 1.15 }}>Tools for running the business, not just the books.</h2>
            <p style={{ fontSize: 15, color: "rgba(248,250,252,0.75)", marginBottom: 24, maxWidth: 460, lineHeight: 1.6 }}>
              Checklists, scripts, scope matrices, and calculators built for bookkeepers, advisors, and small-business owners.
            </p>
            <button style={{ padding: "13px 30px", background: D.blue, border: "none", borderRadius: 8, color: D.text, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", boxShadow: "0 0 30px " + D.blueGlow }}>
              Join Monthly — $27/mo
            </button>
          </div>
        </div>

        {/* BUTTON ZOO */}
        <div style={{ padding: "24px 28px", background: D.surface, border: "1px solid " + D.rule, borderRadius: 12 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: D.muted, marginBottom: 14 }}>COMPONENT SAMPLES</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button style={{ padding: "10px 20px", background: D.blue, border: "none", borderRadius: 8, color: D.text, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 24px " + D.blueGlow }}>Primary button</button>
            <button style={{ padding: "10px 20px", background: "transparent", border: "1.5px solid " + D.blue, borderRadius: 8, color: D.blueHot, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "inset 0 0 12px rgba(59,130,246,0.15)" }}>Secondary button</button>
            <button style={{ padding: "10px 20px", background: "transparent", border: "1px solid " + D.rule, borderRadius: 8, color: D.muted, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Ghost button</button>
            <div style={{ padding: "5px 12px", background: D.blue, color: D.text, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", borderRadius: 100, boxShadow: "0 0 12px " + D.blueGlow }}>NEW BADGE</div>
            <div style={{ padding: "5px 12px", background: D.green, color: D.text, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", borderRadius: 100 }}>FREE BADGE</div>
            <div style={{ padding: "5px 12px", background: D.blueTint, color: D.blueHot, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", borderRadius: 100, border: "1px solid " + D.blue }}>SUBTLE CHIP</div>
          </div>
        </div>

        {/* SIDE-BY-SIDE TIP */}
        <div style={{ marginTop: 26, padding: "14px 18px", background: D.surface, border: "1px dashed " + D.ruleHot, borderRadius: 10, fontSize: 12, color: D.muted, textAlign: "center", fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em" }}>
          COMPARE: <a href="/preview/neon" style={{ color: D.blueHot, textDecoration: "underline" }}>the white version →</a>
        </div>

      </div>
    </div>
  );
}
