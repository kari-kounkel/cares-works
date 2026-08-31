import { useEffect } from "react";
import { navigate } from "../App";

// Court of Accounts — the book's own home, the way ladybug.karikounkel.com is
// Ladybug's. Served at accounts.karikounkel.com (see the host check in App.jsx)
// and reachable at /court-of-accounts on any domain.
//
// Deliberately NOT the CARES neon design system. A book gets its own look —
// parchment, court blue, and gold here — the same way Ladybug got red and gold.

const C = {
  parchment: "#FBF7EF",
  parchmentDeep: "#F3EADA",
  ink: "#17150F",
  inkSoft: "#5C5343",
  inkDim: "#8B806C",
  gold: "#C9A84C",
  goldDeep: "#9A7E2C",
  royal: "#1B3A6B",
  royalDeep: "#122748",
  rule: "#E3D8C2",
  white: "#ffffff",
};

const FONTS = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap";

const CHAPTERS = [
  { label: "Prologue", title: "Introduction and Prologue", live: true, audio: true },
  { label: "Chapter 1", title: "The Kingdom of Eggerton" },
  { label: "Chapter 2", title: "Lady Delia and the Court" },
  { label: "Chapter 3", title: "The Record Keepers" },
];

const MONTHLY_URL = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";
const ANNUAL_URL = "https://buy.stripe.com/14A5kD4B981AgTxcuM18c09";

const CSS = `
  .coa-hero { display: flex; gap: 48px; align-items: center; flex-wrap: wrap; }
  .coa-cover { width: 260px; flex-shrink: 0; }
  .coa-chapters { display: flex; flex-direction: column; gap: 12px; }
  @media (max-width: 720px) {
    .coa-hero { gap: 28px; }
    .coa-cover { width: 180px; margin: 0 auto; }
    .coa-wrap { padding: 32px 18px 56px !important; }
    .coa-hero h1 { font-size: 38px !important; }
    .coa-band { flex-direction: column !important; align-items: flex-start !important; }
  }
`;

function Rule() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, margin: "0 auto", color: C.goldDeep }}>
      <div style={{ height: 1, width: "clamp(40px,18vw,160px)", background: `linear-gradient(90deg,transparent,${C.gold})` }} />
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.gold, boxShadow: `0 0 0 3px rgba(201,168,76,0.18)` }} />
      <div style={{ height: 1, width: "clamp(40px,18vw,160px)", background: `linear-gradient(90deg,${C.gold},transparent)` }} />
    </div>
  );
}

function GoldBtn({ href, onClick, children, solid = true }) {
  const base = {
    display: "inline-block", fontFamily: "'DM Mono', monospace", fontSize: 12,
    letterSpacing: "0.14em", textTransform: "uppercase", padding: "14px 30px",
    borderRadius: 4, textDecoration: "none", fontWeight: 700, cursor: "pointer",
    border: `1.5px solid ${solid ? C.royal : C.goldDeep}`,
    background: solid ? C.royal : "transparent",
    color: solid ? C.white : C.goldDeep,
  };
  if (onClick) return <button onClick={onClick} style={{ ...base, cursor: "pointer" }}>{children}</button>;
  return <a href={href} style={base}>{children}</a>;
}

export default function CourtOfAccountsHome({ session }) {
  useEffect(() => {
    const prev = document.title;
    document.title = "Court of Accounts — A Tale of Ledgers, Loyalty, and Fancy Chickens";
    return () => { document.title = prev; };
  }, []);

  return (
    <div style={{ fontFamily: "'Figtree', sans-serif", color: C.ink, background: C.parchment, lineHeight: 1.65, minHeight: "100vh" }}>
      <style>{CSS}</style>
      <link href={FONTS} rel="stylesheet" />

      {/* HERO */}
      <div style={{ background: `linear-gradient(180deg, ${C.white} 0%, ${C.parchment} 100%)`, borderBottom: `1px solid ${C.rule}`, padding: "56px 0 48px" }}>
        <div className="coa-wrap" style={{ maxWidth: 940, margin: "0 auto", padding: "0 24px" }}>
          <div className="coa-hero">
            <img className="coa-cover" src="/court-of-accounts-cover.jpg"
              alt="Court of Accounts — A Tale of Ledgers, Loyalty, and Fancy Chickens"
              style={{ height: "auto", borderRadius: 4, display: "block", boxShadow: "0 26px 38px rgba(27,58,107,0.18), 0 8px 14px rgba(0,0,0,0.10)" }} />
            <div style={{ flex: "1 1 320px" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: C.goldDeep, fontWeight: 700, marginBottom: 18 }}>
                A Business Parable
              </div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(34px, 6vw, 56px)", lineHeight: 1.08, marginBottom: 14, color: C.ink }}>
                Court of Accounts
              </h1>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: "clamp(16px, 2.4vw, 21px)", color: C.inkSoft, marginBottom: 20 }}>
                A Tale of Ledgers, Loyalty, and Fancy Chickens.
              </p>
              <p style={{ fontSize: 16, color: C.inkSoft, marginBottom: 28, maxWidth: 460 }}>
                A tiny kingdom learns the difference between busy and profitable, the cost of
                loyalty, and what to do when the chickens get fancy.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <GoldBtn onClick={() => navigate("/tools")}>The Tools →</GoldBtn>
                <GoldBtn solid={false} onClick={() => navigate(session ? "/dashboard?tab=court" : "/login")}>Read the Prologue</GoldBtn>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="coa-wrap" style={{ maxWidth: 940, margin: "0 auto", padding: "48px 24px 72px" }}>

        {/* THE TOOLS — the barcode in the printed book points at /tools, so this
            is the first thing a reader arriving here needs to find. */}
        <div className="coa-band" style={{ background: C.royal, color: C.white, borderRadius: 10, padding: "36px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 28, flexWrap: "wrap", marginBottom: 56, boxShadow: "0 18px 40px rgba(27,58,107,0.22)" }}>
          <div style={{ flex: "1 1 320px" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 10 }}>
              Scanned the code in the book?
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 3.4vw, 30px)", marginBottom: 10, lineHeight: 1.2 }}>
              The tools live here.
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.72)", margin: 0, maxWidth: 460 }}>
              Every ledger, checklist, script, and worksheet Eggerton would have needed —
              the working versions, not the parable. Many are free, no account required.
            </p>
          </div>
          <a href="/tools" onClick={e => { e.preventDefault(); navigate("/tools"); }}
            style={{ display: "inline-block", background: C.gold, color: C.ink, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", padding: "15px 32px", borderRadius: 4, textDecoration: "none", fontWeight: 700, flexShrink: 0 }}>
            Open the Tools →
          </a>
        </div>

        {/* WHIMSY WARNING */}
        <div style={{ background: C.parchmentDeep, border: `1px solid ${C.rule}`, borderLeft: `4px solid ${C.gold}`, borderRadius: 8, padding: "24px 30px", display: "flex", alignItems: "center", gap: 18, marginBottom: 56 }}>
          <span style={{ fontSize: 30, flexShrink: 0 }}>🐔</span>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: "clamp(15px, 2.2vw, 19px)", color: C.ink, margin: 0, lineHeight: 1.5 }}>
            Enter only if you have a whimsical sense of humor. Numbered accounts, fancy
            chickens, and a court that takes itself only mostly seriously. Hats encouraged.
            Hardhats not required.
          </p>
        </div>

        {/* CHAPTERS */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Rule />
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(24px, 3.6vw, 32px)", color: C.ink, margin: "20px 0 8px" }}>The Chapters</h2>
          <p style={{ fontSize: 15, color: C.inkSoft, margin: 0 }}>
            One chapter drops per month. Annual members get the whole book on day one.
          </p>
        </div>

        <div className="coa-chapters" style={{ marginBottom: 56 }}>
          {CHAPTERS.map(ch => (
            <div key={ch.label} style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 8, padding: "20px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.inkDim, fontWeight: 700 }}>{ch.label}</span>
                  {ch.audio && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: C.goldDeep, border: `1px solid ${C.gold}`, borderRadius: 100, padding: "2px 8px", fontWeight: 700 }}>🎧 Audio</span>}
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: C.ink }}>{ch.title}</div>
              </div>
              {ch.live ? (
                <button onClick={() => navigate(session ? "/dashboard?tab=court" : "/login")}
                  style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.royal, background: "transparent", border: `1.5px solid ${C.royal}`, borderRadius: 4, padding: "9px 20px", cursor: "pointer", fontWeight: 700 }}>
                  Read →
                </button>
              ) : (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.inkDim, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>Unlocks next month</span>
              )}
            </div>
          ))}
        </div>

        {/* HOW TO READ IT */}
        <div style={{ background: C.white, border: `1px solid ${C.rule}`, borderRadius: 10, padding: "36px 40px", marginBottom: 40 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: C.goldDeep, fontWeight: 700, marginBottom: 12 }}>
            How to read it
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 3.2vw, 28px)", color: C.ink, marginBottom: 20, lineHeight: 1.2 }}>
            Serialized, or all at once.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 28 }}>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: C.ink, marginBottom: 8 }}>Monthly</div>
              <p style={{ fontSize: 14, color: C.inkSoft, marginBottom: 16 }}>One chapter a month, the way a serial should be read. Plus the full CARES Works tool library.</p>
              <a href={MONTHLY_URL} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.royal, fontWeight: 700, textDecoration: "none", borderBottom: `1.5px solid ${C.gold}` }}>$27/month →</a>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: C.ink, marginBottom: 8 }}>
                Annual <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", background: `linear-gradient(135deg,${C.gold},#e0c060)`, color: C.ink, padding: "3px 10px", borderRadius: 100, fontWeight: 700, verticalAlign: "middle", marginLeft: 6 }}>Full book</span>
              </div>
              <p style={{ fontSize: 14, color: C.inkSoft, marginBottom: 16 }}>The entire book on day one, as a PDF you keep. Plus everything the monthly gets.</p>
              <a href={ANNUAL_URL} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.royal, fontWeight: 700, textDecoration: "none", borderBottom: `1.5px solid ${C.gold}` }}>$270/year →</a>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ borderTop: `1px solid ${C.rule}`, paddingTop: 28, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.inkDim, letterSpacing: "0.08em" }}>
            © {new Date().getFullYear()} Kari Hoglund Kounkel
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <a href="/tools" onClick={e => { e.preventDefault(); navigate("/tools"); }} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.royal, letterSpacing: "0.08em", textDecoration: "none", fontWeight: 700 }}>The Tools</a>
            <a href="https://tools.caresmn.com" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.inkDim, letterSpacing: "0.08em", textDecoration: "none" }}>CARES Works ↗</a>
            <a href="https://caresmn.com" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.inkDim, letterSpacing: "0.08em", textDecoration: "none" }}>caresmn.com ↗</a>
          </div>
        </div>
      </div>
    </div>
  );
}
