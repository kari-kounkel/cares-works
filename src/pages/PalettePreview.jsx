// PalettePreview.jsx — the "commit to it" version.
// White page = the wall. Every card is a glowing black neon sign.
// Routed at /preview/neon (public, no auth needed).

const N = {
  blue:      "#0080ff",
  blueHot:   "#3ba0ff",
  blueDark:  "#0052cc",
  blueTint:  "rgba(0,128,255,0.14)",
  blueGlow:  "rgba(0,128,255,0.55)",
  blueGlowStrong: "rgba(0,128,255,0.85)",
  white:     "#ffffff",
  wall:      "#f4f6fa",   // very slight cool tint so black+glow reads
  ink:       "#08080f",   // deep black for the sign background
  ink2:      "#12141f",   // slightly lifted for cards inside cards
  text:      "#f8fafc",   // near-white body text
  muted:     "#94a3b8",
  rule:      "#1e293b",   // subtle inner borders on dark
  green:     "#22c55e",
};

const HALO   = "0 0 24px rgba(0,128,255,0.35), 0 0 60px rgba(0,128,255,0.18)";
const HALO_L = "0 0 40px rgba(0,128,255,0.45), 0 0 100px rgba(0,128,255,0.22)";
const BTN_GLOW = "0 0 22px rgba(0,128,255,0.65), 0 6px 20px rgba(0,128,255,0.4)";
const RIM = "inset 0 0 0 1px rgba(0,128,255,0.2)";

// Reusable dark card wrapper — the "neon sign" pattern.
function Sign({ children, glow = HALO, style = {}, gradientCorner = "100% 0%" }) {
  return (
    <div style={{
      background: `radial-gradient(circle at ${gradientCorner}, rgba(0,128,255,0.18), transparent 60%), ${N.ink}`,
      borderRadius: 14,
      boxShadow: glow + ", " + RIM,
      color: N.text,
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

export default function PalettePreview() {
  return (
    <div style={{ minHeight: "100vh", background: N.wall, color: N.ink, fontFamily: "'Figtree', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAV — white, so the neon signs below have a clean gallery wall */}
      <header style={{ background: N.white, borderBottom: "1px solid #e2e8f0", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68, position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <img src="/cares-works-neon-logo.png" alt="CARES Works" style={{ height: 34, width: "auto", display: "block" }} />
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink }}>
            CARES <span style={{ color: N.blue }}>Works.</span>
          </span>
        </a>
        <div style={{ display: "flex", gap: 4, background: N.ink, borderRadius: 10, padding: 4, boxShadow: HALO }}>
          {["Tool Library", "My Work", "The Debrief", "Court of Accounts", "Shop", "Account"].map((t, i) => (
            <div key={t} style={{ padding: "6px 14px", borderRadius: 7, background: i === 0 ? N.blue : "transparent", color: i === 0 ? N.white : N.muted, fontSize: 12, fontWeight: i === 0 ? 700 : 500, cursor: "pointer", boxShadow: i === 0 ? "0 0 18px " + N.blueGlow : "none" }}>{t}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", background: N.ink, color: N.blueHot, padding: "5px 12px", borderRadius: 100, fontWeight: 700, boxShadow: "0 0 12px " + N.blueGlow }}>ANNUAL</div>
          <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Mono', monospace" }}>kari@caresmn.com</div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 100px" }}>

        {/* WELCOME — text lives on the white wall */}
        <div style={{ marginBottom: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.16em", color: N.blue, fontWeight: 700 }}>PREVIEW — FULL NEON</div>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 44, color: N.ink, marginBottom: 8, lineHeight: 1.05 }}>
            Welcome back, Kari.
          </h1>
          <p style={{ color: N.ink, fontSize: 17, lineHeight: 1.55, marginBottom: 4, maxWidth: 720 }}>
            Tools, Debriefs, and practical business systems for people who are done letting chaos run the meeting.
          </p>
          <p style={{ color: "#64748b", fontSize: 14, fontStyle: "italic" }}>
            Start with one problem. Find one tool. Fix one thing.
          </p>
        </div>

        {/* START HERE */}
        <div style={{ marginBottom: 12, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: "#64748b", fontWeight: 700 }}>START HERE</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 44 }}>
          {[
            { emoji: "👋", title: "Watch the 2-Minute Welcome", desc: "What this place is, how it works, and where not to panic." },
            { emoji: "🧭", title: "Learn the Layout", desc: "Tools, Debriefs, downloads, categories, how to find what you need fast." },
            { emoji: "🔥", title: "What's New This Week", desc: "Latest tools, newest Debriefs, featured fixes." },
          ].map(c => (
            <Sign key={c.title} style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ fontSize: 26, lineHeight: 1 }}>{c.emoji}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: N.white, lineHeight: 1.25 }}>{c.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, flex: 1 }}>{c.desc}</div>
              <button style={{ marginTop: 6, padding: "10px 16px", background: N.blue, border: "none", borderRadius: 8, color: N.white, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", boxShadow: BTN_GLOW }}>
                {c.title.split(" ").slice(0, 2).join(" ")} →
              </button>
            </Sign>
          ))}
        </div>

        {/* WHAT'S NEW — one big neon sign */}
        <Sign style={{ padding: "28px 30px", marginBottom: 44 }} glow={HALO_L} gradientCorner="0% 100%">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.white, margin: 0 }}>🔥 What's New This Week</h2>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, letterSpacing: "0.06em" }}>Updated Jul 9</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { tag: "NEW TOOL", icon: "🛠️", title: "Vendor Decoder", desc: "Turn your vendor list into a posting playbook." },
              { tag: "NEW DEBRIEF", icon: "☕", title: "Cash Flow Is Not a Vibe", desc: "Bank balance is not the business model." },
              { tag: "FEATURED FIX", icon: "🎯", title: "Open Your Vendor List", desc: "Count the duplicates. That number is telling on you." },
              { tag: "KARI'S NOTE", icon: "✨", title: "This Week", desc: "Clarity. Not perfection. One less pile. One place where the truth can take its coat off.", pinned: true },
            ].map(b => (
              <div key={b.tag} style={{ background: b.pinned ? "linear-gradient(135deg, rgba(0,128,255,0.18), rgba(0,128,255,0.04))" : N.ink2, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 5, boxShadow: b.pinned ? "0 0 16px rgba(0,128,255,0.35), inset 0 0 0 1px " + N.blue : "inset 0 0 0 1px " + N.rule }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15 }}>{b.icon}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: b.pinned ? N.blueHot : N.blueHot, fontWeight: 700 }}>{b.tag}</span>
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: N.white, lineHeight: 1.3 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.5, flex: 1, fontStyle: b.pinned ? "italic" : "normal" }}>{b.desc}</div>
                {!b.pinned && (
                  <button style={{ marginTop: 6, padding: "6px 10px", background: N.blue, border: "none", borderRadius: 5, color: N.white, fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left", boxShadow: "0 0 12px " + N.blueGlow }}>
                    Open →
                  </button>
                )}
              </div>
            ))}
          </div>
        </Sign>

        {/* SEARCH — black form, blue focus glow */}
        <div style={{ marginBottom: 14, position: "relative" }}>
          <input type="text" placeholder="Search tools…"
            style={{ width: "100%", padding: "14px 18px 14px 44px", fontSize: 14, background: N.ink, border: "none", borderRadius: 10, outline: "none", color: N.text, boxSizing: "border-box", boxShadow: HALO }} />
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: N.blueHot, pointerEvents: "none" }}>🔍</span>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {[
            { label: "All", active: true },
            { label: "📒 Bookkeeping", active: false },
            { label: "💰 Money", active: true },
            { label: "👥 People", active: false },
            { label: "🤝 Client Work", active: false },
            { label: "🎯 Leadership", active: false },
          ].map(c => (
            <button key={c.label}
              style={{ padding: "8px 16px", borderRadius: 100, border: "none", background: c.active ? N.blue : N.ink, color: c.active ? N.white : N.muted, fontSize: 12, fontWeight: c.active ? 700 : 500, cursor: "pointer", boxShadow: c.active ? BTN_GLOW : "0 0 12px rgba(0,128,255,0.15)" }}>
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 3, background: N.ink, borderRadius: 100, padding: 3, boxShadow: "0 0 14px rgba(0,128,255,0.2)" }}>
            {["ALL", "FREE", "MEMBER"].map((l, i) => (
              <div key={l} style={{ padding: "6px 16px", borderRadius: 100, background: i === 0 ? N.blue : "transparent", color: i === 0 ? N.white : N.muted, fontSize: 11, fontWeight: i === 0 ? 700 : 500, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", cursor: "pointer", boxShadow: i === 0 ? "0 0 14px " + N.blueGlow : "none" }}>{l}</div>
            ))}
          </div>
          <button style={{ padding: "6px 16px", borderRadius: 100, border: "none", background: N.ink, color: N.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", boxShadow: "0 0 12px rgba(0,128,255,0.15)" }}>
            ✨ NEW ONLY
          </button>
        </div>

        {/* TOOL CARDS — every one a neon sign */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginBottom: 48 }}>
          {[
            { icon: "🗂️", cat: "BOOKKEEPING", title: "Vendor Decoder", desc: "Turn your vendor list into a posting playbook. Every account lands where it belongs.", tag: "NEW" },
            { icon: "📊", cat: "MONEY", title: "Monthly Numbers Scorecard", desc: "Seven numbers. Fifteen minutes. The difference between knowing your business and guessing.", tag: "NEW" },
            { icon: "☕", cat: "MONEY", title: "The Collections Playbook", desc: "Most of us send the same friendly nudge seven times and call it collections. It's begging with a smile." },
          ].map(t => (
            <Sign key={t.title} style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 11 }}>
              {t.tag && <div style={{ position: "absolute", top: 16, right: 16, background: N.blue, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", padding: "4px 10px", borderRadius: 100, boxShadow: "0 0 16px " + N.blueGlowStrong }}>{t.tag}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: N.blueTint, boxShadow: "inset 0 0 0 1px " + N.blue }}>{t.icon}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: N.muted }}>{t.cat}</div>
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, lineHeight: 1.3, color: N.white }}>{t.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.68)", lineHeight: 1.55, flex: 1 }}>{t.desc}</div>
              <button style={{ marginTop: 6, padding: "11px 18px", background: N.blue, border: "none", borderRadius: 8, color: N.white, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", boxShadow: BTN_GLOW }}>
                Get this tool →
              </button>
            </Sign>
          ))}
        </div>

        {/* THE DEBRIEF */}
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink, marginBottom: 20 }}>The Debrief</h2>
        <Sign style={{ padding: "32px 34px", marginBottom: 48 }} glow={HALO_L} gradientCorner="90% 10%">
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: N.blue, boxShadow: "0 0 22px " + N.blueGlowStrong }} />
          <div style={{ paddingLeft: 4 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.blueHot, fontWeight: 700, marginBottom: 10, textShadow: "0 0 10px " + N.blueGlow }}>NOBODY TOLD OWNERS THIS</div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.white, marginBottom: 12, lineHeight: 1.2 }}>Cash Flow Is Not a Vibe</h3>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.65, margin: 0, maxWidth: 620 }}>
              Your bank balance is not your business model. Cash flow needs timing, visibility, and fewer surprises wearing tap shoes.
            </p>
            <div style={{ marginTop: 16, fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.blueHot, fontWeight: 700, letterSpacing: "0.08em", textShadow: "0 0 10px " + N.blueGlow }}>READ →</div>
          </div>
        </Sign>

        {/* HERO CTA */}
        <Sign style={{ padding: "44px 46px", marginBottom: 48 }} glow={HALO_L} gradientCorner="85% 50%">
          <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, " + N.blueHot + ", transparent)", boxShadow: "0 0 12px " + N.blueGlowStrong }} />
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: N.blueHot, fontWeight: 700, marginBottom: 12, textShadow: "0 0 10px " + N.blueGlow }}>THERE'S MORE WHERE THIS CAME FROM</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, marginBottom: 12, lineHeight: 1.15, color: N.white }}>Tools for running the business, not just the books.</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginBottom: 26, maxWidth: 460, lineHeight: 1.6 }}>
            Checklists, scripts, scope matrices, and calculators built for bookkeepers, advisors, and small-business owners.
          </p>
          <button style={{ padding: "14px 32px", background: N.blue, border: "none", borderRadius: 8, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", boxShadow: BTN_GLOW }}>
            Join Monthly — $27/mo
          </button>
        </Sign>

        {/* COMPONENT SAMPLES */}
        <Sign style={{ padding: "26px 30px" }} gradientCorner="0% 0%">
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: N.muted, marginBottom: 14 }}>COMPONENT SAMPLES</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button style={{ padding: "10px 20px", background: N.blue, border: "none", borderRadius: 8, color: N.white, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: BTN_GLOW }}>Primary</button>
            <button style={{ padding: "10px 20px", background: "transparent", border: "1.5px solid " + N.blue, borderRadius: 8, color: N.blueHot, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "inset 0 0 14px rgba(0,128,255,0.2), 0 0 12px " + N.blueGlow }}>Secondary</button>
            <button style={{ padding: "10px 20px", background: "transparent", border: "1px solid " + N.rule, borderRadius: 8, color: N.muted, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Ghost</button>
            <div style={{ padding: "5px 12px", background: N.blue, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", borderRadius: 100, boxShadow: "0 0 14px " + N.blueGlowStrong }}>NEW</div>
            <div style={{ padding: "5px 12px", background: N.green, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", borderRadius: 100 }}>FREE</div>
            <div style={{ padding: "5px 12px", background: N.blueTint, color: N.blueHot, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", borderRadius: 100, boxShadow: "inset 0 0 0 1px " + N.blue }}>CHIP</div>
          </div>
        </Sign>

        <div style={{ marginTop: 26, padding: "14px 18px", background: N.white, border: "1px dashed #e2e8f0", borderRadius: 10, fontSize: 12, color: "#64748b", textAlign: "center", fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em" }}>
          COMPARE: <a href="/preview/neon-dark" style={{ color: N.blue, textDecoration: "underline" }}>the all-black version →</a>
        </div>

      </div>
    </div>
  );
}
