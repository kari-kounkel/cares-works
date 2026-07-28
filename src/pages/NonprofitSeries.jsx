import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { N, N_RGB, FONT_LINK, NeonBox, SignatureFooter, WASH_BG, HERO_TEXT_GRAD, HERO_BTN_GLOW } from "../design/neon";

// Tier 1: existing tools that already work for nonprofits with a bit of re-framing.
// Each carries a nonprofit-specific pitch — same tool, right lens.
const READY_NOW = [
  {
    slug: "ledger",
    icon: "📒",
    title: "Fund Accounting — Steward",
    pitch: "Restricted vs. unrestricted. Fund balances. Board-ready surplus/deficit. Built for the way nonprofits actually count money.",
    color: N.orange,
    rgb: N_RGB.orange,
    tag: "CORE",
  },
  {
    slug: "vendor-decoder",
    icon: "🗂️",
    title: "Vendor Decoder",
    pitch: "Turn your vendor list into a posting playbook. Program vs. admin gets clearer when every vendor has a home.",
    color: N.blue,
    rgb: N_RGB.blue,
  },
  {
    slug: "net-profit-ratios",
    icon: "📊",
    title: "Reserves & Surplus Math",
    pitch: "Reserves aren't greedy — they're grown-up. This tells you how many months of operating cash you actually have.",
    color: N.blue,
    rgb: N_RGB.blue,
  },
  {
    slug: "meeting-planning",
    icon: "📅",
    title: "Board Meeting Planning",
    pitch: "Agenda, time blocks, follow-up protocol. The board meeting where things actually get decided instead of narrated.",
    color: N.pink,
    rgb: N_RGB.pink,
  },
  {
    slug: "post-meeting-debrief",
    icon: "📝",
    title: "Post-Meeting Debrief",
    pitch: "What actually got decided, what got dropped, and who's on the hook. Send it within 24 hours.",
    color: N.pink,
    rgb: N_RGB.pink,
  },
  {
    slug: "new-hire-30-days",
    icon: "🗂️",
    title: "New Hire — First 30 Days",
    pitch: "New volunteers and new hires both fizzle in the first month. This is the sequence that prevents that.",
    color: N.blue,
    rgb: N_RGB.blue,
  },
  {
    slug: "communication-templates",
    icon: "✉️",
    title: "Communication Templates",
    pitch: "Donor asks, thank-yous, grant reports, the awkward-conversation scripts. Nonprofit-flavored templates included.",
    color: N.orange,
    rgb: N_RGB.orange,
  },
  {
    slug: "payroll-checklist",
    icon: "✅",
    title: "Payroll Checklist",
    pitch: "Pay period → quarterly → annual. Housing allowance and clergy comp handled where it applies.",
    color: N.blue,
    rgb: N_RGB.blue,
    tier: "free",
  },
];

// Tier 1 (the nonprofit-specific tools we build next — this list IS the roadmap).
const COMING_SOON = [
  {
    title: "Chart of Accounts — Nonprofit Edition",
    pitch: "Fund segments, net asset classes, the account structure your CPA will actually recognize.",
  },
  {
    title: "Board Financial Dashboard",
    pitch: "One-page treasurer's report generator. Budget vs. actual, fund balances, months of reserves. Readable by trustees who don't speak accounting.",
  },
  {
    title: "Donor Acknowledgment Letter Generator",
    pitch: "IRS-compliant tax receipts with the exact language 501(c)(3) rules require. Auto-generates per gift or per year-end batch.",
  },
];

// Debrief entries we'll seed for the "Nonprofit Corner" category.
const NONPROFIT_DEBRIEF_PLANNED = [
  { title: "Restricted funds aren't yours.", tag: "Nonprofit Corner" },
  { title: "What your board actually reads on the treasurer's report.", tag: "Nonprofit Corner" },
  { title: "The housing allowance loophole for church employees.", tag: "Nonprofit Corner" },
  { title: "Reserves: it's not greedy, it's grown-up.", tag: "Nonprofit Corner" },
  { title: "How to know if you're a 990 or 990-EZ.", tag: "Nonprofit Corner" },
];

const MOBILE = `
  @media (max-width: 800px) {
    .np-hero h1 { font-size: 34px !important; }
    .np-page { padding: 40px 20px 60px !important; }
    .np-tools-grid { grid-template-columns: 1fr !important; }
    .np-soon-grid { grid-template-columns: 1fr !important; }
  }
`;

export default function NonprofitSeries() {
  const [session, setSession] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: WASH_BG, fontFamily: "'Figtree', sans-serif", color: N.ink }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{MOBILE}</style>

      {/* NAV */}
      <header style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", borderBottom: "1px solid " + N.rule, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>
              CARES <span style={{ color: N.blueHot, fontStyle: "italic" }}>Works.</span>
            </span>
          </a>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <a href="/pricing" style={{ fontSize: 13, color: N.muted, textDecoration: "none", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>Pricing</a>
            {session ? (
              <a href="/dashboard" style={{ fontSize: 13, color: N.blue, textDecoration: "none", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", fontWeight: 700 }}>Dashboard →</a>
            ) : (
              <a href="/login" style={{ fontSize: 13, color: N.blue, textDecoration: "none", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", fontWeight: 700 }}>Log In →</a>
            )}
          </div>
        </div>
      </header>

      <div className="np-page" style={{ maxWidth: 1120, margin: "0 auto", padding: "60px 24px 40px" }}>

        {/* HERO */}
        <div className="np-hero" style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.2em", color: N.orange, fontWeight: 700, marginBottom: 14, textShadow: "0 0 10px rgba(255,138,42,0.5)" }}>
            THE NONPROFIT SERIES
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(34px, 5.5vw, 56px)", lineHeight: 1.05, marginBottom: 16, color: N.ink }}>
            Built for the people <span style={HERO_TEXT_GRAD}>counting other people's money.</span>
          </h1>
          <p style={{ fontSize: 17, color: N.muted, maxWidth: 640, margin: "0 auto 12px", lineHeight: 1.6 }}>
            Fund accounting, board reporting, donor letters, grant tracking — CARES Works tools tuned for how nonprofits actually operate.
            Half-off membership because you're already stretched.
          </p>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em", color: N.muted, marginBottom: 26 }}>
            Verified 501(c)(3)? You're in for $13/mo.
          </p>
          <a href="mailto:kari@caresmn.com?subject=CARES%20Works%20Nonprofit%20Series&body=Hi%20Kari%20%E2%80%94%20we%27re%20a%20501(c)(3)%20interested%20in%20the%20Nonprofit%20Series%20at%20%2413%2Fmo.%20Our%20org%20is%20%5BNAME%5D%20and%20our%20EIN%20is%20%5BEIN%5D.%20Send%20us%20a%20checkout%20link%3F"
            style={{ display: "inline-block", padding: "14px 32px", background: N.orange, border: "none", borderRadius: 8, color: N.white, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", boxShadow: `0 4px 18px rgba(255,138,42,0.55), 0 0 40px rgba(255,138,42,0.25)` }}>
            Apply for Nonprofit — $13/mo →
          </a>
        </div>

        {/* WHAT YOU GET RIGHT NOW */}
        <div style={{ marginBottom: 12, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: N.muted, fontWeight: 700, textAlign: "center" }}>WHAT YOU GET RIGHT NOW</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 8, textAlign: "center" }}>Tools already tuned for nonprofits</h2>
        <p style={{ color: N.muted, fontSize: 15, marginBottom: 32, textAlign: "center", maxWidth: 620, margin: "0 auto 32px", lineHeight: 1.6 }}>
          These live in the library today. Same tools, framed for how nonprofits use them.
        </p>

        <div className="np-tools-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 22, marginBottom: 56 }}>
          {READY_NOW.map(t => (
            <NeonBox key={t.slug} color={t.color} rgb={t.rgb} style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
              {t.tag && <div style={{ position: "absolute", top: 14, right: 14, background: t.color, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", padding: "3px 10px", borderRadius: 100, boxShadow: `0 0 14px ${t.color}` }}>{t.tag}</div>}
              {t.tier === "free" && !t.tag && <div style={{ position: "absolute", top: 14, right: 14, background: N.green, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", padding: "3px 10px", borderRadius: 100 }}>FREE</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: `rgba(${t.rgb},0.1)`, border: `1.5px solid ${t.color}` }}>{t.icon}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: t.color, fontWeight: 700 }}>NONPROFIT LENS</div>
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, lineHeight: 1.25, color: N.ink }}>{t.title}</div>
              <div style={{ fontSize: 13.5, color: N.muted, lineHeight: 1.55, flex: 1 }}>{t.pitch}</div>
              <a href={"/tools/" + t.slug}
                style={{ marginTop: 6, padding: "10px 16px", background: t.color, border: "none", borderRadius: 8, color: N.white, fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "block", fontFamily: "'Figtree', sans-serif", textAlign: "left", boxShadow: `0 4px 14px ${t.color}88` }}>
                Open the tool →
              </a>
            </NeonBox>
          ))}
        </div>

        {/* COMING TO THIS SERIES */}
        <NeonBox color={N.orange} rgb={N_RGB.orange} scale={1.3} style={{ padding: "32px 34px", marginBottom: 44 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: N.orange, fontWeight: 700, marginBottom: 8 }}>COMING TO THIS SERIES</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: N.ink, marginBottom: 8 }}>The nonprofit-specific builds</h2>
          <p style={{ color: N.muted, fontSize: 14, marginBottom: 22, lineHeight: 1.6, maxWidth: 640 }}>
            Three tools built from scratch for how nonprofits actually run. Members get them the day they drop — no upsell, no bundle math.
          </p>
          <div className="np-soon-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {COMING_SOON.map(t => (
              <div key={t.title} style={{ background: `rgba(${N_RGB.orange},0.06)`, border: `1.5px dashed ${N.orange}`, borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: N.orange, fontWeight: 700, marginBottom: 6 }}>🔨 IN THE BUILD QUEUE</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: N.ink, lineHeight: 1.3, marginBottom: 6 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: N.muted, lineHeight: 1.55 }}>{t.pitch}</div>
              </div>
            ))}
          </div>
        </NeonBox>

        {/* NONPROFIT CORNER — Debrief category preview */}
        <NeonBox color={N.pink} rgb={N_RGB.pink} scale={1.1} style={{ padding: "28px 32px", marginBottom: 44 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.pink, fontWeight: 700, marginBottom: 8 }}>NEW DEBRIEF CATEGORY</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink, marginBottom: 8 }}>The Nonprofit Corner</h2>
          <p style={{ fontSize: 14, color: N.muted, lineHeight: 1.6, marginBottom: 20, maxWidth: 620 }}>
            Short business breakdowns aimed at nonprofit boards, treasurers, and EDs. Real answers, not fund-development platitudes.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {NONPROFIT_DEBRIEF_PLANNED.map(d => (
              <li key={d.title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: N.white, border: "1px solid " + N.rule, borderRadius: 8 }}>
                <span style={{ fontSize: 16 }}>☕</span>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: N.ink, flex: 1 }}>{d.title}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: N.pink, fontWeight: 700 }}>SOON</span>
              </li>
            ))}
          </ul>
        </NeonBox>

        {/* CLOSER */}
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 12, lineHeight: 1.15 }}>
            You're already stretched. <span style={HERO_TEXT_GRAD}>Don't stretch alone.</span>
          </h2>
          <p style={{ color: N.muted, fontSize: 15, maxWidth: 540, margin: "0 auto 26px", lineHeight: 1.6 }}>
            $13/mo for verified 501(c)(3)s. Cancel anytime. Ask Kari answers real questions from real EDs and treasurers.
          </p>
          <a href="mailto:kari@caresmn.com?subject=CARES%20Works%20Nonprofit%20Series&body=Hi%20Kari%20%E2%80%94%20we%27re%20a%20501(c)(3)%20interested%20in%20the%20Nonprofit%20Series%20at%20%2413%2Fmo.%20Our%20org%20is%20%5BNAME%5D%20and%20our%20EIN%20is%20%5BEIN%5D.%20Send%20us%20a%20checkout%20link%3F"
            style={{ display: "inline-block", padding: "14px 32px", background: N.orange, border: "none", borderRadius: 8, color: N.white, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", boxShadow: `0 4px 18px rgba(255,138,42,0.55), 0 0 40px rgba(255,138,42,0.25)` }}>
            Apply for Nonprofit — $13/mo →
          </a>
        </div>
      </div>

      <SignatureFooter />
    </div>
  );
}
