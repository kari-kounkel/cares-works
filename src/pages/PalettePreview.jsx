// PalettePreview.jsx — a standalone mockup screen so Kari can vibe-check
// the electric-blue + white palette before we rebrand the whole site.
// Routed at /preview/neon (public, no auth needed).

// ELECTRIC PALETTE
const N = {
  blue:      "#0066ff",   // primary
  blueDark:  "#0052cc",   // hover
  blueTint:  "#e6f0ff",   // very light backgrounds
  blueGlow:  "rgba(0,102,255,0.35)",
  white:     "#ffffff",
  surface:   "#f7f9fc",   // soft off-white for panels
  ink:       "#0f172a",   // near-black body text
  muted:     "#64748b",   // cool slate for secondary text
  rule:      "#e2e8f0",   // borders
  green:     "#22c55e",   // status success
  amber:     "#f59e0b",   // warning
  grad:      "linear-gradient(135deg, #0066ff, #0052cc)",
};

const GLOW = "0 0 0 4px rgba(0,102,255,0.16), 0 8px 20px rgba(0,102,255,0.24)";

export default function PalettePreview() {
  return (
    <div style={{ minHeight: "100vh", background: N.white, color: N.ink, fontFamily: "'Figtree', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAV BAR */}
      <header style={{ background: N.white, borderBottom: "1px solid " + N.rule, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68, position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <img src="/cares-works-logo.png" alt="CARES Works" style={{ height: 34, width: "auto", display: "block" }} />
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink }}>
            CARES <span style={{ color: N.blue }}>Works.</span>
          </span>
        </a>
        <div style={{ display: "flex", gap: 4, background: N.surface, borderRadius: 10, padding: 4, border: "1px solid " + N.rule }}>
          {["Tool Library", "My Work", "The Debrief", "Court of Accounts", "Shop", "Account"].map((t, i) => (
            <div key={t} style={{ padding: "6px 14px", borderRadius: 7, background: i === 0 ? N.blue : "transparent", color: i === 0 ? N.white : N.muted, fontSize: 12, fontWeight: i === 0 ? 700 : 500, cursor: "pointer", boxShadow: i === 0 ? "0 2px 6px " + N.blueGlow : "none" }}>{t}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", background: N.blueTint, color: N.blueDark, padding: "5px 10px", borderRadius: 100, fontWeight: 700 }}>ANNUAL</div>
          <div style={{ fontSize: 12, color: N.muted, fontFamily: "'DM Mono', monospace" }}>kari@caresmn.com</div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 100px" }}>

        <div style={{ marginBottom: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.16em", color: N.blue, fontWeight: 700 }}>PREVIEW — ELECTRIC BLUE & WHITE</div>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: N.ink, marginBottom: 8, lineHeight: 1.1 }}>
            Welcome back, Kari.
          </h1>
          <p style={{ color: N.ink, fontSize: 17, lineHeight: 1.55, marginBottom: 4, maxWidth: 720 }}>
            Tools, Debriefs, and practical business systems for people who are done letting chaos run the meeting.
          </p>
          <p style={{ color: N.muted, fontSize: 14, fontStyle: "italic" }}>
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
            <div key={c.title} style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 26, lineHeight: 1 }}>{c.emoji}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: N.ink, lineHeight: 1.25 }}>{c.title}</div>
              <div style={{ fontSize: 13, color: N.muted, lineHeight: 1.5, flex: 1 }}>{c.desc}</div>
              <button style={{ marginTop: 6, padding: "9px 14px", background: N.blue, border: "none", borderRadius: 8, color: N.white, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", boxShadow: "0 4px 12px " + N.blueGlow }}>
                {c.title.split(" ").slice(0, 2).join(" ")} →
              </button>
            </div>
          ))}
        </div>

        {/* WHAT'S NEW */}
        <div style={{ marginBottom: 40, padding: "26px 28px", background: N.surface, border: "1px solid " + N.rule, borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: N.ink, margin: 0 }}>🔥 What's New This Week</h2>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, letterSpacing: "0.06em" }}>Updated Jul 8</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { tag: "NEW TOOL", icon: "🛠️", title: "Vendor Decoder", desc: "Turn your vendor list into a posting playbook." },
              { tag: "NEW DEBRIEF", icon: "☕", title: "Cash Flow Is Not a Vibe", desc: "Bank balance is not the business model." },
              { tag: "FEATURED FIX", icon: "🎯", title: "Open Your Vendor List", desc: "Count the duplicates. That number is telling on you." },
            ].map(b => (
              <div key={b.tag} style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15 }}>{b.icon}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: N.blue, fontWeight: 700 }}>{b.tag}</span>
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: N.ink, lineHeight: 1.3 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: N.muted, lineHeight: 1.5, flex: 1 }}>{b.desc}</div>
                <button style={{ marginTop: 6, padding: "6px 10px", background: N.blue, border: "none", borderRadius: 5, color: N.white, fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
                  Open →
                </button>
              </div>
            ))}
            <div style={{ background: N.ink, borderRadius: 10, padding: "14px 16px", color: N.white, display: "flex", flexDirection: "column", gap: 5, boxShadow: "0 0 0 1px " + N.blue }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: N.blue, fontWeight: 700 }}>✨ KARI'S NOTE</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, lineHeight: 1.3 }}>This Week</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, fontStyle: "italic" }}>
                Clarity. Not perfection. One less pile. One place where the truth can take its coat off.
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH + FILTERS */}
        <div style={{ marginBottom: 14, position: "relative" }}>
          <input type="text" placeholder="Search tools…"
            style={{ width: "100%", padding: "12px 16px 12px 44px", fontSize: 14, background: N.white, border: "1.5px solid " + N.rule, borderRadius: 10, outline: "none", color: N.ink, boxSizing: "border-box" }} />
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: N.muted, pointerEvents: "none" }}>🔍</span>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {[
            { label: "All", active: true, dark: true },
            { label: "📒 Bookkeeping", active: false },
            { label: "💰 Money", active: true },
            { label: "👥 People", active: false },
            { label: "🤝 Client Work", active: false },
            { label: "🎯 Leadership", active: false },
          ].map(c => (
            <button key={c.label}
              style={{ padding: "7px 16px", borderRadius: 100, border: "1.5px solid " + (c.active ? N.blue : N.rule), background: c.active ? (c.dark ? N.ink : N.blue) : N.white, color: c.active ? N.white : N.muted, fontSize: 12, fontWeight: c.active ? 700 : 500, cursor: "pointer", boxShadow: c.active && !c.dark ? "0 3px 10px " + N.blueGlow : "none" }}>
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 26 }}>
          <div style={{ display: "flex", gap: 3, background: N.white, border: "1px solid " + N.rule, borderRadius: 100, padding: 3 }}>
            {["ALL", "FREE", "MEMBER"].map((l, i) => (
              <div key={l} style={{ padding: "5px 14px", borderRadius: 100, background: i === 0 ? N.blueTint : "transparent", color: i === 0 ? N.blueDark : N.muted, fontSize: 11, fontWeight: i === 0 ? 700 : 500, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", cursor: "pointer" }}>{l}</div>
            ))}
          </div>
          <button style={{ padding: "6px 14px", borderRadius: 100, border: "1.5px solid " + N.rule, background: N.white, color: N.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>
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
            <div key={t.title} style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 10, position: "relative", transition: "border-color .15s, box-shadow .15s" }}>
              {t.tag && <div style={{ position: "absolute", top: 14, right: 14, background: N.blue, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", padding: "3px 8px", borderRadius: 100 }}>{t.tag}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: N.blueTint }}>{t.icon}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: N.muted }}>{t.cat}</div>
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, lineHeight: 1.3, color: N.ink }}>{t.title}</div>
              <div style={{ fontSize: 13, color: N.muted, lineHeight: 1.55, flex: 1 }}>{t.desc}</div>
              <button style={{ marginTop: 6, padding: "10px 16px", background: N.blue, border: "none", borderRadius: 8, color: N.white, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", boxShadow: "0 4px 14px " + N.blueGlow }}>
                Get this tool →
              </button>
            </div>
          ))}
        </div>

        {/* THE DEBRIEF PREVIEW */}
        <div style={{ marginBottom: 44 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: N.ink, marginBottom: 20 }}>The Debrief</h2>
          <div style={{ background: N.white, border: "1px solid " + N.blue, borderRadius: 12, padding: "24px 26px", boxShadow: "0 0 0 4px rgba(0,102,255,0.08)" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: N.blue, fontWeight: 700, marginBottom: 6 }}>NOBODY TOLD OWNERS THIS</div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 8, lineHeight: 1.25 }}>Cash Flow Is Not a Vibe</h3>
            <p style={{ color: N.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Your bank balance is not your business model. Cash flow needs timing, visibility, and fewer surprises wearing tap shoes.
            </p>
            <div style={{ marginTop: 12, fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.blue, fontWeight: 700, letterSpacing: "0.08em" }}>READ →</div>
          </div>
        </div>

        {/* MODAL PREVIEW */}
        <div style={{ background: N.ink, borderRadius: 14, padding: "40px 44px", color: N.white, position: "relative", overflow: "hidden", marginBottom: 44 }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 85% 50%, rgba(0,102,255,0.28), transparent 65%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: N.blue, fontWeight: 700, marginBottom: 12 }}>THERE'S MORE WHERE THIS CAME FROM</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, marginBottom: 12, lineHeight: 1.15 }}>Tools for running the business, not just the books.</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginBottom: 24, maxWidth: 460, lineHeight: 1.6 }}>
              Checklists, scripts, scope matrices, and calculators built for bookkeepers, advisors, and small-business owners.
            </p>
            <button style={{ padding: "13px 30px", background: N.blue, border: "none", borderRadius: 8, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 22px " + N.blueGlow }}>
              Join Monthly — $27/mo
            </button>
          </div>
        </div>

        {/* BUTTON ZOO */}
        <div style={{ padding: "24px 28px", background: N.surface, border: "1px solid " + N.rule, borderRadius: 12 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: N.muted, marginBottom: 14 }}>COMPONENT SAMPLES</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button style={{ padding: "10px 20px", background: N.blue, border: "none", borderRadius: 8, color: N.white, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px " + N.blueGlow }}>Primary button</button>
            <button style={{ padding: "10px 20px", background: N.white, border: "1.5px solid " + N.blue, borderRadius: 8, color: N.blue, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Secondary button</button>
            <button style={{ padding: "10px 20px", background: "transparent", border: "1px solid " + N.rule, borderRadius: 8, color: N.muted, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Ghost button</button>
            <div style={{ padding: "5px 12px", background: N.blue, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", borderRadius: 100 }}>NEW BADGE</div>
            <div style={{ padding: "5px 12px", background: N.green, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", borderRadius: 100 }}>FREE BADGE</div>
            <div style={{ padding: "5px 12px", background: N.blueTint, color: N.blueDark, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", borderRadius: 100 }}>SUBTLE CHIP</div>
          </div>
        </div>

      </div>
    </div>
  );
}
