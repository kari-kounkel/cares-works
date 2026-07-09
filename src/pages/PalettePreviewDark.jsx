// PalettePreviewDark.jsx — "cards ARE the neon" version.
// White page. White nav. Cards themselves become the electric blue, hot pink,
// neon orange from the logo. Each glows in its own color.
// Routed at /preview/neon-dark.

const N = {
  blue:      "#0080ff",
  blueHot:   "#00b7ff",   // matches the logo's "Works." cursive
  blueDark:  "#0052cc",
  pink:      "#ff2d8a",
  pinkDark:  "#d91d6d",
  orange:    "#ff8a2a",
  orangeDark:"#f06d0a",
  white:     "#ffffff",
  wall:      "#ffffff",
  ink:       "#0a0a14",
  text:      "#0f172a",
  muted:     "#64748b",
  mutedLite: "#94a3b8",
  rule:      "#e2e8f0",
  green:     "#22c55e",
};

// NeonBox — white interior, neon-color outline + glow. The one card pattern.
function NeonBox({ color, rgb, scale = 1, style = {}, children }) {
  return (
    <div style={{
      background: N.white,
      borderRadius: 14,
      border: `2px solid ${color}`,
      boxShadow: `0 0 ${24*scale}px rgba(${rgb},0.5), 0 0 ${60*scale}px rgba(${rgb},0.25), inset 0 0 22px rgba(${rgb},0.06)`,
      color: N.ink,
      position: "relative",
      ...style,
    }}>
      {children}
    </div>
  );
}

// Solid neon CTA button.
function NeonBtn({ color, children }) {
  return (
    <button style={{ marginTop: 6, padding: "10px 18px", background: color, border: "none", borderRadius: 8, color: N.white, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", boxShadow: `0 4px 14px ${color}88` }}>
      {children}
    </button>
  );
}

export default function PalettePreviewDark() {
  return (
    <div style={{ minHeight: "100vh", background: N.wall, color: N.text, fontFamily: "'Figtree', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* HERO — logo on the left, live "This Week" callout on the right */}
      <div style={{ background: N.white, padding: "36px 0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>

          <img src="/cares-works-neon-logo.png" alt="CARES Works — Tools, Training, Confidence, Results. Built for Business. Backed by CARES."
            style={{ maxHeight: 200, width: "auto", maxWidth: "100%", display: "block", borderRadius: 20, boxShadow: "0 8px 32px rgba(0,128,255,0.28)" }} />

          <div style={{ maxWidth: 380, flex: "1 1 300px" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: N.pink, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 100, background: N.pink, boxShadow: `0 0 10px ${N.pink}`, animation: "none" }} />
              THIS WEEK'S SPOTLIGHT
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink, lineHeight: 1.2, marginBottom: 8 }}>
              New drop: <span style={{ color: N.blueHot }}>The Vendor Decoder</span>
            </h2>
            <p style={{ fontSize: 14, color: N.muted, lineHeight: 1.55, marginBottom: 14 }}>
              Turn your vendor list into a posting playbook. Every account lands where it belongs — no more asking "wait, where does Amazon go this time?"
            </p>
            <button style={{ padding: "9px 18px", background: N.blue, color: N.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,128,255,0.4)" }}>
              Open the Vendor Decoder →
            </button>
          </div>
        </div>

        {/* STAT PILL ROW — the site's pulse */}
        <div style={{ maxWidth: 1100, margin: "24px auto 0", padding: "0 24px", display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { n: "22", label: "tools live", color: N.blue },
            { n: "6", label: "Debriefs", color: N.pink },
            { n: "3", label: "new this week", color: N.orange },
            { n: "Weekly", label: "drops", color: N.ink },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "8px 16px", background: N.white, border: "1px solid " + N.rule, borderRadius: 100 }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: s.color, fontWeight: 400 }}>{s.n}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: N.muted, textTransform: "uppercase", fontWeight: 700 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* NAV BAR — left-grouped (wordmark + pill), right group (badge + email) */}
      <header style={{ background: N.white, borderBottom: "1px solid " + N.rule, padding: 0, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>
                CARES <span style={{ color: N.blueHot, fontStyle: "italic" }}>Works.</span>
              </span>
            </a>
            <div style={{ display: "flex", gap: 4, background: N.wall, borderRadius: 10, padding: 4, border: "1px solid " + N.rule }}>
              {["Tool Library", "My Work", "The Debrief", "Court of Accounts", "Shop", "Account"].map((t, i) => (
                <div key={t} style={{ padding: "6px 14px", borderRadius: 7, background: i === 0 ? N.blue : "transparent", color: i === 0 ? N.white : N.muted, fontSize: 12, fontWeight: i === 0 ? 700 : 500, cursor: "pointer", boxShadow: i === 0 ? "0 4px 14px rgba(0,128,255,0.4)" : "none" }}>{t}</div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", background: N.blue, color: N.white, padding: "5px 12px", borderRadius: 100, fontWeight: 700, boxShadow: "0 3px 10px rgba(0,128,255,0.4)" }}>ANNUAL</div>
            <div style={{ fontSize: 12, color: N.muted, fontFamily: "'DM Mono', monospace" }}>kari@caresmn.com</div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 100px" }}>

        {/* WELCOME */}
        <div style={{ marginBottom: 44 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, color: N.ink, marginBottom: 12, lineHeight: 1.05 }}>
            Welcome back, Kari.
          </h1>
          <p style={{ color: N.ink, fontSize: 17, lineHeight: 1.55, marginBottom: 6, maxWidth: 720 }}>
            Tools, Debriefs, and practical business systems for people who are done letting chaos run the meeting.
          </p>
          <p style={{ color: N.muted, fontSize: 14, fontStyle: "italic" }}>
            Start with one problem. Find one tool. Fix one thing.
          </p>
        </div>

        {/* START HERE — outlined tri-color boxes echoing the logo ribbon */}
        <div style={{ marginBottom: 14, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: N.muted, fontWeight: 700 }}>START HERE</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginBottom: 52 }}>
          {[
            { emoji: "👋", title: "Watch the 2-Minute Welcome", desc: "What this place is, how it works, and where not to panic.", color: N.orange, rgb: "255,138,42" },
            { emoji: "🧭", title: "Learn the Layout", desc: "Tools, Debriefs, downloads, categories, how to find what you need fast.", color: N.pink, rgb: "255,45,138" },
            { emoji: "🔥", title: "What's New This Week", desc: "Latest tools, newest Debriefs, featured fixes.", color: N.blue, rgb: "0,128,255" },
          ].map(c => (
            <NeonBox key={c.title} color={c.color} rgb={c.rgb} style={{ padding: "26px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 28, lineHeight: 1 }}>{c.emoji}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: N.ink, lineHeight: 1.25 }}>{c.title}</div>
              <div style={{ fontSize: 13, color: N.muted, lineHeight: 1.5, flex: 1 }}>{c.desc}</div>
              <NeonBtn color={c.color}>{c.title.split(" ").slice(0, 2).join(" ")} →</NeonBtn>
            </NeonBox>
          ))}
        </div>

        {/* WHAT'S NEW — black frame, white-neon-outlined tiles inside */}
        <div style={{ background: N.ink, borderRadius: 14, padding: "30px 32px", marginBottom: 52, boxShadow: `0 0 30px rgba(0,128,255,0.35), 0 0 70px rgba(0,128,255,0.18)` }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.white, margin: 0 }}>🔥 What's New This Week</h2>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em" }}>Updated Jul 9</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { tag: "NEW TOOL", icon: "🛠️", title: "Vendor Decoder", desc: "Turn your vendor list into a posting playbook." },
              { tag: "NEW DEBRIEF", icon: "☕", title: "Cash Flow Is Not a Vibe", desc: "Bank balance is not the business model." },
              { tag: "FEATURED FIX", icon: "🎯", title: "Open Your Vendor List", desc: "Count the duplicates. That number is telling on you." },
              { tag: "KARI'S NOTE", icon: "✨", title: "This Week", desc: "Clarity. Not perfection. One less pile. One place where the truth can take its coat off.", pinned: true },
            ].map(b => (
              <div key={b.tag} style={{ background: N.white, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6, border: `2px solid ${N.blue}`, boxShadow: `0 0 20px rgba(0,128,255,0.55), 0 0 45px rgba(0,128,255,0.25)${b.pinned ? ", 0 0 0 2px " + N.white : ""}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15 }}>{b.icon}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: N.blue, fontWeight: 700 }}>{b.tag}</span>
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: N.ink, lineHeight: 1.3 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: N.muted, lineHeight: 1.55, flex: 1, fontStyle: b.pinned ? "italic" : "normal" }}>{b.desc}</div>
                {!b.pinned && (
                  <button style={{ marginTop: 6, padding: "6px 10px", background: N.blue, border: "none", borderRadius: 5, color: N.white, fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left", boxShadow: `0 3px 10px rgba(0,128,255,0.4)` }}>
                    Open →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SEARCH */}
        <div style={{ marginBottom: 14, position: "relative" }}>
          <input type="text" placeholder="Search tools…"
            style={{ width: "100%", padding: "14px 18px 14px 44px", fontSize: 14, background: N.white, border: "2px solid " + N.rule, borderRadius: 10, outline: "none", color: N.ink, boxSizing: "border-box" }} />
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: N.muted, pointerEvents: "none" }}>🔍</span>
        </div>

        {/* CATEGORY CHIPS — active states pick up the tri-color */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {[
            { label: "All", active: true, color: N.blue },
            { label: "📒 Bookkeeping", active: false, color: N.blue },
            { label: "💰 Money", active: true, color: N.orange },
            { label: "👥 People", active: false, color: N.pink },
            { label: "🤝 Client Work", active: false, color: N.blue },
            { label: "🎯 Leadership", active: false, color: N.orange },
          ].map(c => (
            <button key={c.label}
              style={{ padding: "8px 16px", borderRadius: 100, border: c.active ? "none" : "1.5px solid " + N.rule, background: c.active ? c.color : N.white, color: c.active ? N.white : N.muted, fontSize: 12, fontWeight: c.active ? 700 : 500, cursor: "pointer", boxShadow: c.active ? `0 4px 14px ${c.color}66` : "none" }}>
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 3, background: N.white, border: "1.5px solid " + N.rule, borderRadius: 100, padding: 3 }}>
            {["ALL", "FREE", "MEMBER"].map((l, i) => (
              <div key={l} style={{ padding: "6px 16px", borderRadius: 100, background: i === 0 ? N.blue : "transparent", color: i === 0 ? N.white : N.muted, fontSize: 11, fontWeight: i === 0 ? 700 : 500, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", cursor: "pointer", boxShadow: i === 0 ? "0 3px 10px rgba(0,128,255,0.4)" : "none" }}>{l}</div>
            ))}
          </div>
          <button style={{ padding: "6px 16px", borderRadius: 100, border: "1.5px solid " + N.rule, background: N.white, color: N.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>
            ✨ NEW ONLY
          </button>
        </div>

        {/* TOOL CARDS — white cards, neon outline + glow */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 52 }}>
          {[
            { icon: "🗂️", cat: "BOOKKEEPING", title: "Vendor Decoder", desc: "Turn your vendor list into a posting playbook. Every account lands where it belongs.", tag: "NEW", color: N.blue, rgb: "0,128,255" },
            { icon: "📊", cat: "MONEY", title: "Monthly Numbers Scorecard", desc: "Seven numbers. Fifteen minutes. The difference between knowing your business and guessing.", tag: "NEW", color: N.orange, rgb: "255,138,42" },
            { icon: "☕", cat: "MONEY", title: "The Collections Playbook", desc: "Most of us send the same friendly nudge seven times and call it collections. It's begging with a smile.", color: N.pink, rgb: "255,45,138" },
          ].map(t => (
            <NeonBox key={t.title} color={t.color} rgb={t.rgb} style={{ padding: "26px 28px", display: "flex", flexDirection: "column", gap: 11 }}>
              {t.tag && <div style={{ position: "absolute", top: 14, right: 14, background: t.color, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", padding: "4px 10px", borderRadius: 100, boxShadow: `0 0 14px ${t.color}` }}>{t.tag}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: `rgba(${t.rgb},0.1)`, border: `1.5px solid ${t.color}` }}>{t.icon}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: t.color, fontWeight: 700 }}>{t.cat}</div>
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, lineHeight: 1.3, color: N.ink }}>{t.title}</div>
              <div style={{ fontSize: 13, color: N.muted, lineHeight: 1.55, flex: 1 }}>{t.desc}</div>
              <NeonBtn color={t.color}>Get this tool →</NeonBtn>
            </NeonBox>
          ))}
        </div>

        {/* THE DEBRIEF — pink neon-outlined editorial card */}
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink, marginBottom: 20 }}>The Debrief</h2>
        <NeonBox color={N.pink} rgb="255,45,138" scale={1.3} style={{ padding: "34px 36px", marginBottom: 52 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.pink, fontWeight: 700, marginBottom: 10 }}>NOBODY TOLD OWNERS THIS</div>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: N.ink, marginBottom: 12, lineHeight: 1.2 }}>Cash Flow Is Not a Vibe</h3>
          <p style={{ color: N.muted, fontSize: 15, lineHeight: 1.65, margin: 0, maxWidth: 620 }}>
            Your bank balance is not your business model. Cash flow needs timing, visibility, and fewer surprises wearing tap shoes.
          </p>
          <div style={{ marginTop: 18 }}>
            <NeonBtn color={N.pink}>READ →</NeonBtn>
          </div>
        </NeonBox>

        {/* HERO CTA — blue neon-outlined block */}
        <NeonBox color={N.blue} rgb="0,128,255" scale={1.5} style={{ padding: "48px 50px", marginBottom: 44 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: N.blue, fontWeight: 700, marginBottom: 12 }}>THERE'S MORE WHERE THIS CAME FROM</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, marginBottom: 12, lineHeight: 1.15, color: N.ink }}>Tools for running the business, not just the books.</h2>
          <p style={{ fontSize: 15, color: N.muted, marginBottom: 26, maxWidth: 480, lineHeight: 1.6 }}>
            Checklists, scripts, scope matrices, and calculators built for bookkeepers, advisors, and small-business owners.
          </p>
          <button style={{ padding: "14px 32px", background: N.blue, border: "none", borderRadius: 8, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", boxShadow: `0 6px 20px rgba(0,128,255,0.5)` }}>
            Join Monthly — $27/mo
          </button>
        </NeonBox>

        {/* SIGNATURE STRIP */}
        <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
          <div style={{ display: "inline-block", padding: "10px 26px", background: `linear-gradient(135deg, ${N.orange}, ${N.pink}, ${N.blue})`, borderRadius: 100, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.2em", color: N.white, fontWeight: 700, boxShadow: "0 6px 20px rgba(255,45,138,0.35)" }}>
            BUILT FOR BUSINESS &nbsp;·&nbsp; BACKED BY CARES
          </div>
        </div>

        <div style={{ marginTop: 32, padding: "14px 18px", background: N.white, border: "1px dashed " + N.rule, borderRadius: 10, fontSize: 12, color: N.muted, textAlign: "center", fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em" }}>
          COMPARE: <a href="/preview/neon" style={{ color: N.blue, textDecoration: "underline" }}>the black-signs-on-white version →</a>
        </div>

      </div>
    </div>
  );
}
