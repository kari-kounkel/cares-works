// PalettePreviewDark.jsx — the winner. Neon-on-black to match the new logo.
// Pulls the three logo colors (cyan-blue, magenta, orange) as the palette.
// Routed at /preview/neon-dark.

// PALETTE — sampled from the new CARES Works neon logo
const D = {
  // three neon inks from the logo ribbon
  blue:      "#00b7ff",   // cyan-leaning electric blue (the "Works." cursive)
  bluePale:  "#7fdcff",
  pink:      "#ff2d8a",   // hot magenta (middle ribbon)
  pinkPale:  "#ff7fb8",
  orange:    "#ff8a2a",   // neon orange (outer ribbon)
  orangePale:"#ffbb80",
  // neutrals
  black:     "#000000",   // pure black — matches the logo bg
  ink:       "#0a0a12",   // near-black for layered surfaces
  ink2:      "#12141f",   // one step up
  text:      "#ffffff",
  muted:     "#94a3b8",
  rule:      "#1e293b",
  green:     "#22c55e",
};

// Glow constants — real neon.
const HALO_BLUE   = "0 0 24px rgba(0,183,255,0.45), 0 0 60px rgba(0,183,255,0.22)";
const HALO_PINK   = "0 0 22px rgba(255,45,138,0.45), 0 0 50px rgba(255,45,138,0.22)";
const HALO_ORANGE = "0 0 22px rgba(255,138,42,0.45), 0 0 50px rgba(255,138,42,0.22)";
const HALO_L      = "0 0 40px rgba(0,183,255,0.5), 0 0 100px rgba(0,183,255,0.25)";
const BTN_GLOW    = "0 0 22px rgba(0,183,255,0.7), 0 6px 20px rgba(0,183,255,0.4)";
const RIM_BLUE    = "inset 0 0 0 1px rgba(0,183,255,0.22)";

function Sign({ children, glow = HALO_BLUE, style = {}, corner = "100% 0%", tint = "rgba(0,183,255,0.15)" }) {
  return (
    <div style={{
      background: `radial-gradient(circle at ${corner}, ${tint}, transparent 60%), ${D.ink}`,
      borderRadius: 14,
      boxShadow: glow + ", " + RIM_BLUE,
      color: D.text,
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

export default function PalettePreviewDark() {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", color: "#0a0a14", fontFamily: "'Figtree', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAV BAR — white wall with black neon signage sitting on it */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 76, position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
          <img src="/cares-works-neon-logo.png" alt="CARES Works" style={{ height: 56, width: "auto", display: "block", filter: "drop-shadow(0 0 12px rgba(0,183,255,0.4))" }} />
        </a>
        <div style={{ display: "flex", gap: 4, background: D.ink, borderRadius: 10, padding: 4, boxShadow: HALO_BLUE }}>
          {["Tool Library", "My Work", "The Debrief", "Court of Accounts", "Shop", "Account"].map((t, i) => (
            <div key={t} style={{ padding: "6px 14px", borderRadius: 7, background: i === 0 ? D.blue : "transparent", color: i === 0 ? D.black : D.muted, fontSize: 12, fontWeight: i === 0 ? 700 : 500, cursor: "pointer", boxShadow: i === 0 ? "0 0 18px rgba(0,183,255,0.7)" : "none" }}>{t}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", background: D.ink, color: D.blue, padding: "5px 12px", borderRadius: 100, fontWeight: 700, boxShadow: "0 0 14px rgba(0,183,255,0.5)" }}>ANNUAL</div>
          <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Mono', monospace" }}>kari@caresmn.com</div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 100px" }}>

        {/* WELCOME + TAGLINE STRIP echoing the logo */}
        <div style={{ marginBottom: 44, textAlign: "left" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.2em", color: D.orange, fontWeight: 700, marginBottom: 14, textShadow: "0 0 10px rgba(255,138,42,0.6)" }}>
            TOOLS &nbsp;·&nbsp; TRAINING &nbsp;·&nbsp; CONFIDENCE &nbsp;·&nbsp; RESULTS
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, color: "#0a0a14", marginBottom: 12, lineHeight: 1.05 }}>
            Welcome back, Kari.
          </h1>
          <p style={{ color: "#0a0a14", fontSize: 17, lineHeight: 1.55, marginBottom: 6, maxWidth: 720 }}>
            Tools, Debriefs, and practical business systems for people who are done letting chaos run the meeting.
          </p>
          <p style={{ color: "#64748b", fontSize: 14, fontStyle: "italic" }}>
            Start with one problem. Find one tool. Fix one thing.
          </p>
        </div>

        {/* START HERE — tri-color glow across the 3 cards to echo the logo ribbon */}
        <div style={{ marginBottom: 14, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: "#64748b", fontWeight: 700 }}>START HERE</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 48 }}>
          {[
            { emoji: "👋", title: "Watch the 2-Minute Welcome", desc: "What this place is, how it works, and where not to panic.", glow: HALO_ORANGE, tint: "rgba(255,138,42,0.18)", accent: D.orange, corner: "100% 0%" },
            { emoji: "🧭", title: "Learn the Layout", desc: "Tools, Debriefs, downloads, categories, how to find what you need fast.", glow: HALO_PINK, tint: "rgba(255,45,138,0.18)", accent: D.pink, corner: "50% 0%" },
            { emoji: "🔥", title: "What's New This Week", desc: "Latest tools, newest Debriefs, featured fixes.", glow: HALO_BLUE, tint: "rgba(0,183,255,0.2)", accent: D.blue, corner: "0% 0%" },
          ].map(c => (
            <Sign key={c.title} style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 10 }} glow={c.glow} tint={c.tint} corner={c.corner}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: c.accent, boxShadow: `0 0 14px ${c.accent}` }} />
              <div style={{ fontSize: 26, lineHeight: 1 }}>{c.emoji}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: D.text, lineHeight: 1.25 }}>{c.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.68)", lineHeight: 1.5, flex: 1 }}>{c.desc}</div>
              <button style={{ marginTop: 6, padding: "10px 16px", background: c.accent, border: "none", borderRadius: 8, color: D.black, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", boxShadow: `0 0 20px ${c.accent}` }}>
                {c.title.split(" ").slice(0, 2).join(" ")} →
              </button>
            </Sign>
          ))}
        </div>

        {/* WHAT'S NEW */}
        <Sign style={{ padding: "28px 30px", marginBottom: 48 }} glow={HALO_L} corner="0% 100%">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: D.text, margin: 0 }}>🔥 What's New This Week</h2>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: D.muted, letterSpacing: "0.06em" }}>Updated Jul 9</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { tag: "NEW TOOL", icon: "🛠️", title: "Vendor Decoder", desc: "Turn your vendor list into a posting playbook.", accent: D.blue },
              { tag: "NEW DEBRIEF", icon: "☕", title: "Cash Flow Is Not a Vibe", desc: "Bank balance is not the business model.", accent: D.pink },
              { tag: "FEATURED FIX", icon: "🎯", title: "Open Your Vendor List", desc: "Count the duplicates. That number is telling on you.", accent: D.orange },
              { tag: "KARI'S NOTE", icon: "✨", title: "This Week", desc: "Clarity. Not perfection. One less pile. One place where the truth can take its coat off.", pinned: true, accent: D.blue },
            ].map(b => (
              <div key={b.tag} style={{ background: b.pinned ? "linear-gradient(135deg, rgba(0,183,255,0.18), rgba(0,183,255,0.04))" : D.ink2, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6, boxShadow: b.pinned ? `0 0 18px ${b.accent}80, inset 0 0 0 1px ${b.accent}` : `inset 0 0 0 1px ${D.rule}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15 }}>{b.icon}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: b.accent, fontWeight: 700, textShadow: `0 0 8px ${b.accent}80` }}>{b.tag}</span>
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: D.text, lineHeight: 1.3 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, flex: 1, fontStyle: b.pinned ? "italic" : "normal" }}>{b.desc}</div>
                {!b.pinned && (
                  <button style={{ marginTop: 6, padding: "6px 10px", background: b.accent, border: "none", borderRadius: 5, color: D.black, fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left", boxShadow: `0 0 12px ${b.accent}` }}>
                    Open →
                  </button>
                )}
              </div>
            ))}
          </div>
        </Sign>

        {/* SEARCH */}
        <div style={{ marginBottom: 14, position: "relative" }}>
          <input type="text" placeholder="Search tools…"
            style={{ width: "100%", padding: "14px 18px 14px 44px", fontSize: 14, background: D.ink, border: "none", borderRadius: 10, outline: "none", color: D.text, boxSizing: "border-box", boxShadow: HALO_BLUE }} />
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: D.blue, pointerEvents: "none", textShadow: `0 0 8px ${D.blue}` }}>🔍</span>
        </div>

        {/* CATEGORY CHIPS — tri-color when active */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {[
            { label: "All", active: true, accent: D.blue },
            { label: "📒 Bookkeeping", active: false, accent: D.blue },
            { label: "💰 Money", active: true, accent: D.orange },
            { label: "👥 People", active: false, accent: D.pink },
            { label: "🤝 Client Work", active: false, accent: D.blue },
            { label: "🎯 Leadership", active: false, accent: D.orange },
          ].map(c => (
            <button key={c.label}
              style={{ padding: "8px 16px", borderRadius: 100, border: "none", background: c.active ? c.accent : D.ink, color: c.active ? D.black : D.muted, fontSize: 12, fontWeight: c.active ? 700 : 500, cursor: "pointer", boxShadow: c.active ? `0 0 18px ${c.accent}` : "0 0 12px rgba(0,183,255,0.12)" }}>
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 3, background: D.ink, borderRadius: 100, padding: 3, boxShadow: "0 0 14px rgba(0,183,255,0.2)" }}>
            {["ALL", "FREE", "MEMBER"].map((l, i) => (
              <div key={l} style={{ padding: "6px 16px", borderRadius: 100, background: i === 0 ? D.blue : "transparent", color: i === 0 ? D.black : D.muted, fontSize: 11, fontWeight: i === 0 ? 700 : 500, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", cursor: "pointer", boxShadow: i === 0 ? `0 0 14px ${D.blue}` : "none" }}>{l}</div>
            ))}
          </div>
          <button style={{ padding: "6px 16px", borderRadius: 100, border: "none", background: D.ink, color: D.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", boxShadow: "0 0 12px rgba(0,183,255,0.12)" }}>
            ✨ NEW ONLY
          </button>
        </div>

        {/* TOOL CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginBottom: 48 }}>
          {[
            { icon: "🗂️", cat: "BOOKKEEPING", title: "Vendor Decoder", desc: "Turn your vendor list into a posting playbook. Every account lands where it belongs.", tag: "NEW" },
            { icon: "📊", cat: "MONEY", title: "Monthly Numbers Scorecard", desc: "Seven numbers. Fifteen minutes. The difference between knowing your business and guessing.", tag: "NEW" },
            { icon: "☕", cat: "MONEY", title: "The Collections Playbook", desc: "Most of us send the same friendly nudge seven times and call it collections. It's begging with a smile." },
          ].map(t => (
            <Sign key={t.title} style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 11 }}>
              {t.tag && <div style={{ position: "absolute", top: 16, right: 16, background: D.blue, color: D.black, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", padding: "4px 10px", borderRadius: 100, boxShadow: `0 0 16px ${D.blue}` }}>{t.tag}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: "rgba(0,183,255,0.14)", boxShadow: `inset 0 0 0 1px ${D.blue}` }}>{t.icon}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: D.muted }}>{t.cat}</div>
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, lineHeight: 1.3, color: D.text }}>{t.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.68)", lineHeight: 1.55, flex: 1 }}>{t.desc}</div>
              <button style={{ marginTop: 6, padding: "11px 18px", background: D.blue, border: "none", borderRadius: 8, color: D.black, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", boxShadow: BTN_GLOW }}>
                Get this tool →
              </button>
            </Sign>
          ))}
        </div>

        {/* THE DEBRIEF — pink accent to break the blue monotony */}
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#0a0a14", marginBottom: 20 }}>The Debrief</h2>
        <Sign style={{ padding: "32px 34px", marginBottom: 48 }} glow={HALO_PINK} corner="90% 10%" tint="rgba(255,45,138,0.2)">
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: D.pink, boxShadow: `0 0 22px ${D.pink}` }} />
          <div style={{ paddingLeft: 4 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: D.pink, fontWeight: 700, marginBottom: 10, textShadow: `0 0 10px ${D.pink}` }}>NOBODY TOLD OWNERS THIS</div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: D.text, marginBottom: 12, lineHeight: 1.2 }}>Cash Flow Is Not a Vibe</h3>
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 15, lineHeight: 1.65, margin: 0, maxWidth: 620 }}>
              Your bank balance is not your business model. Cash flow needs timing, visibility, and fewer surprises wearing tap shoes.
            </p>
            <div style={{ marginTop: 16, fontFamily: "'DM Mono', monospace", fontSize: 11, color: D.pink, fontWeight: 700, letterSpacing: "0.08em", textShadow: `0 0 10px ${D.pink}` }}>READ →</div>
          </div>
        </Sign>

        {/* HERO CTA */}
        <Sign style={{ padding: "44px 46px", marginBottom: 40 }} glow={HALO_L} corner="85% 50%">
          <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg, transparent, ${D.blue}, transparent)`, boxShadow: `0 0 14px ${D.blue}` }} />
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: D.blue, fontWeight: 700, marginBottom: 12, textShadow: `0 0 10px ${D.blue}` }}>THERE'S MORE WHERE THIS CAME FROM</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, marginBottom: 12, lineHeight: 1.15, color: D.text }}>Tools for running the business, not just the books.</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginBottom: 26, maxWidth: 460, lineHeight: 1.6 }}>
            Checklists, scripts, scope matrices, and calculators built for bookkeepers, advisors, and small-business owners.
          </p>
          <button style={{ padding: "14px 32px", background: D.blue, border: "none", borderRadius: 8, color: D.black, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", boxShadow: BTN_GLOW }}>
            Join Monthly — $27/mo
          </button>
        </Sign>

        {/* SIGNATURE STRIP — the sub-tagline, as its own lit sign on the white wall */}
        <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
          <div style={{ display: "inline-block", padding: "12px 28px", background: D.ink, borderRadius: 100, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.2em", color: D.blue, fontWeight: 700, textShadow: `0 0 12px ${D.blue}`, boxShadow: HALO_BLUE + ", " + RIM_BLUE, position: "relative" }}>
            BUILT FOR BUSINESS &nbsp;·&nbsp; BACKED BY CARES
          </div>
        </div>

        <div style={{ marginTop: 32, padding: "14px 18px", background: D.ink, border: "1px dashed " + D.rule, borderRadius: 10, fontSize: 12, color: D.muted, textAlign: "center", fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em" }}>
          COMPARE: <a href="/preview/neon" style={{ color: D.blue, textDecoration: "underline" }}>the white-wall version →</a>
        </div>

      </div>
    </div>
  );
}
