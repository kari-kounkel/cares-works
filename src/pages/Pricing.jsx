import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";
import { N, N_RGB, FONT_LINK, NeonBox, SignatureFooter } from "../design/neon";

// KARI: adjust these anytime — the tier data drives the whole grid.
// Stripe URLs are placeholders where products haven't been created yet.
// nonprofit/firm/whitelabel start as mailto until you spin up their Stripe products.
const TIERS = [
  {
    key: "community",
    name: "Community",
    price: "Free",
    priceSub: "forever",
    tagline: "Kick the tires. Grab a free tool. See if the voice fits.",
    color: N.blueHot,
    rgb: N_RGB.blue,
    features: [
      "The 6 always-free tools (payroll checklist, email attachments, ACH form, and more)",
      "Read The Debrief previews",
      "Ask Kari widget on public pages",
      "No login required",
    ],
    cta: "Browse Free Tools",
    ctaHref: "/",
    highlight: false,
  },
  {
    key: "nonprofit",
    name: "Nonprofit",
    price: "$13",
    priceSub: "/month",
    tagline: "Full library at half. Because you're already stretched.",
    color: N.orange,
    rgb: N_RGB.orange,
    features: [
      "Everything in Community",
      "Full tool library — Money, People, Client Work, Leadership",
      "The Debrief — full monthly issue",
      "Court of Accounts — one chapter/month",
      "Verified 501(c)(3) required",
    ],
    cta: "Apply for Nonprofit",
    ctaHref: "mailto:kari@caresmn.com?subject=CARES%20Works%20Nonprofit%20Application&body=Hi%20Kari%20%E2%80%94%20we%27re%20a%20501(c)(3)%20interested%20in%20the%20Nonprofit%20tier.%20Our%20org%20is%20%5BNAME%5D%20and%20our%20EIN%20is%20%5BEIN%5D.%20Send%20us%20a%20checkout%20link%3F",
    highlight: false,
  },
  {
    key: "owner",
    name: "Owner",
    price: "$27",
    priceSub: "/month",
    priceAlt: "or $270/year — 2 months free",
    tagline: "The one for the person running the business AND the books.",
    color: N.blue,
    rgb: N_RGB.blue,
    features: [
      "Everything in Nonprofit",
      "New tools added monthly",
      "Ask Kari — real answers, not a bot",
      "Save your work — projects, drafts, uploads",
      "Annual members get the full Court of Accounts book on day one",
    ],
    cta: "Start Owner — $27/mo",
    ctaHref: "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06",
    ctaAlt: { label: "or Annual — $270/yr", href: "https://buy.stripe.com/14A5kD4B981AgTxcuM18c09" },
    highlight: true,
    badge: "MOST POPULAR",
  },
  {
    key: "firm",
    name: "Firm",
    price: "$97",
    priceSub: "/month",
    tagline: "For bookkeepers, CPAs, and fractional CFOs serving clients.",
    color: N.pink,
    rgb: N_RGB.pink,
    features: [
      "Everything in Owner",
      "Up to 5 team seats",
      "Priority Ask Kari — first in the queue",
      "Client-facing summaries (rename outputs with your firm's name)",
      "Bulk exports for client hand-offs",
    ],
    cta: "Start Firm Plan",
    ctaHref: "mailto:kari@caresmn.com?subject=CARES%20Works%20Firm%20Plan&body=Hi%20Kari%20%E2%80%94%20I%27d%20like%20to%20start%20the%20Firm%20plan%20($97%2Fmo).%20My%20firm%20is%20%5BFIRM%20NAME%5D%20and%20we%27re%20%5BTEAM%20SIZE%5D%20people.%20Send%20me%20the%20checkout%20link%3F",
    highlight: false,
  },
  {
    key: "whitelabel",
    name: "White-Label",
    price: "Custom",
    priceSub: "let's talk",
    tagline: "Your logo, your domain, your voice. Powered by CARES Works.",
    color: N.orange,
    rgb: N_RGB.orange,
    features: [
      "Everything in Firm",
      "Your logo + colors on every tool output",
      "Your domain (tools.yourfirm.com)",
      "Rebrand PDFs, checklists, and templates",
      "Priority engineering — feature requests get seen",
    ],
    cta: "Talk to Kari",
    ctaHref: "mailto:kari@caresmn.com?subject=CARES%20Works%20White-Label&body=Hi%20Kari%20%E2%80%94%20we%27re%20interested%20in%20white-labeling%20CARES%20Works%20for%20our%20firm.%20Here%27s%20a%20bit%20about%20us%3A%20%5BFIRM%20INFO%5D.%20When%27s%20a%20good%20time%20to%20talk%3F",
    highlight: false,
  },
];

const MOBILE = `
  @media (max-width: 900px) {
    .pr-grid { grid-template-columns: 1fr !important; }
    .pr-hero h1 { font-size: 36px !important; }
    .pr-page { padding: 40px 20px 40px !important; }
  }
`;

// Subtle multi-color radial wash on white — the "pizzazz without going dark" trick.
const WASH_BG = `
  radial-gradient(ellipse at 15% 0%, rgba(0,128,255,0.10), transparent 55%),
  radial-gradient(ellipse at 85% 0%, rgba(255,45,138,0.08), transparent 55%),
  radial-gradient(ellipse at 50% 100%, rgba(255,138,42,0.06), transparent 60%),
  #ffffff
`;

// Gradient text for hero headlines.
const HERO_TEXT_GRAD = {
  background: `linear-gradient(90deg, ${N.blue} 0%, ${N.pink} 55%, ${N.orange} 100%)`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

export default function Pricing() {
  const [session, setSession] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: WASH_BG, fontFamily: "'Figtree', sans-serif", color: N.ink }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{MOBILE}</style>

      {/* NAV */}
      <header style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", borderBottom: "1px solid " + N.rule, padding: 0, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>
              CARES <span style={{ color: N.blueHot, fontStyle: "italic" }}>Works.</span>
            </span>
          </a>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <a href="/" style={{ fontSize: 13, color: N.muted, textDecoration: "none", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>Home</a>
            {session ? (
              <a href="/dashboard" style={{ fontSize: 13, color: N.blue, textDecoration: "none", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", fontWeight: 700 }}>Dashboard →</a>
            ) : (
              <a href="/login" style={{ fontSize: 13, color: N.blue, textDecoration: "none", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", fontWeight: 700 }}>Log In →</a>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <div className="pr-page" style={{ maxWidth: 1120, margin: "0 auto", padding: "68px 24px 40px", textAlign: "center" }}>
        <div className="pr-hero">
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.2em", color: N.blue, fontWeight: 700, marginBottom: 14 }}>
            CARES WORKS · PRICING
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(38px, 6vw, 62px)", lineHeight: 1.05, marginBottom: 16, color: N.ink }}>
            Pricing that <span style={HERO_TEXT_GRAD}>respects the work.</span>
          </h1>
          <p style={{ fontSize: 17, color: N.muted, maxWidth: 620, margin: "0 auto 12px", lineHeight: 1.6 }}>
            No per-tool nickel-and-diming. No credit-card-hostage trials. Pick a lane, join, use every tool.
            Cancel anytime.
          </p>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.08em", color: N.muted, marginBottom: 40 }}>
            Nonprofit? Verified 501(c)(3)s get half off. Firm? Team seats included. White-label? Let's talk.
          </p>
        </div>

        {/* TIER GRID */}
        <div className="pr-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 18, alignItems: "stretch", marginBottom: 56 }}>
          {TIERS.map(t => (
            <div key={t.key} style={{ position: "relative", paddingTop: t.highlight ? 16 : 0 }}>
              {t.badge && (
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translate(-50%, -50%)", padding: "6px 14px", background: `linear-gradient(135deg, ${N.blue}, ${N.pink})`, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", borderRadius: 100, boxShadow: `0 4px 18px rgba(0,128,255,0.5)`, zIndex: 2, whiteSpace: "nowrap" }}>
                  {t.badge}
                </div>
              )}
              <NeonBox
                color={t.color}
                rgb={t.rgb}
                scale={t.highlight ? 1.7 : 1.0}
                style={{
                  padding: t.highlight ? "34px 26px 28px" : "28px 22px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  height: "100%",
                  transform: t.highlight ? "translateY(-6px)" : "none",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: t.color, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>
                    {t.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: t.highlight ? 44 : 36, color: N.ink, lineHeight: 1 }}>
                      {t.price}
                    </span>
                    <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: 14, color: N.muted, fontWeight: 500 }}>
                      {t.priceSub}
                    </span>
                  </div>
                  {t.priceAlt && (
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, letterSpacing: "0.06em", marginBottom: 8 }}>
                      {t.priceAlt}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 13, color: N.muted, textAlign: "center", lineHeight: 1.5, minHeight: 42, fontStyle: "italic" }}>
                  {t.tagline}
                </div>
                <a href={t.ctaHref} target={t.ctaHref.startsWith("http") ? "_blank" : "_self"} rel={t.ctaHref.startsWith("http") ? "noopener noreferrer" : undefined}
                  style={{ display: "block", padding: "12px 16px", background: t.color, border: "none", borderRadius: 8, color: N.white, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "center", textDecoration: "none", fontFamily: "'Figtree', sans-serif", boxShadow: `0 4px 18px ${t.color}88` }}>
                  {t.cta} →
                </a>
                {t.ctaAlt && (
                  <a href={t.ctaAlt.href} target="_blank" rel="noopener noreferrer"
                    style={{ display: "block", textAlign: "center", fontFamily: "'DM Mono', monospace", fontSize: 11, color: t.color, textDecoration: "none", letterSpacing: "0.05em", fontWeight: 700, marginTop: -4 }}>
                    {t.ctaAlt.label}
                  </a>
                )}
                <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  {t.features.map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: N.ink, lineHeight: 1.5 }}>
                      <span style={{ color: t.color, flexShrink: 0, fontWeight: 700 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </NeonBox>
            </div>
          ))}
        </div>

        {/* CALLOUT: What every plan includes */}
        <NeonBox color={N.blue} rgb={N_RGB.blue} scale={1.2} style={{ padding: "28px 32px", marginBottom: 44, textAlign: "left" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.blue, fontWeight: 700, marginBottom: 8 }}>ALWAYS INCLUDED</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, lineHeight: 1.25 }}>Cancel anytime</div>
              <p style={{ fontSize: 13, color: N.muted, lineHeight: 1.55, marginTop: 4 }}>Month-to-month. Nothing to argue about. Log in, click cancel, done.</p>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.pink, fontWeight: 700, marginBottom: 8 }}>ALWAYS INCLUDED</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, lineHeight: 1.25 }}>No per-tool charges</div>
              <p style={{ fontSize: 13, color: N.muted, lineHeight: 1.55, marginTop: 4 }}>Every tool at your tier is available immediately. New drops land free.</p>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.orange, fontWeight: 700, marginBottom: 8 }}>ALWAYS INCLUDED</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, lineHeight: 1.25 }}>A real human</div>
              <p style={{ fontSize: 13, color: N.muted, lineHeight: 1.55, marginTop: 4 }}>Ask Kari answers real questions. Not a bot, not a form.</p>
            </div>
          </div>
        </NeonBox>

        {/* FAQ / softer copy */}
        <div style={{ textAlign: "left", maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: N.ink, marginBottom: 20 }}>Common questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { q: "How does the free tier actually work?", a: "The 6 always-free tools live at the top of the tool library and stay free forever. No login required — just use them. When you're ready for the full library, upgrade to any paid tier and everything unlocks." },
              { q: "What's included in the Debrief?", a: "One issue a month: a short business breakdown, a featured fix, and honest answers to real member questions. Owner, Nonprofit, Firm, and White-label tiers get every issue." },
              { q: "Who qualifies as a Nonprofit?", a: "Verified 501(c)(3)s in the US. Email us your EIN and we'll set up your discounted checkout." },
              { q: "How does the Firm tier work?", a: "You get 5 team seats and priority queue on Ask Kari. Great for bookkeeping practices, CPA firms, and fractional CFOs who use CARES Works tools with their own clients." },
              { q: "White-label — what does that mean?", a: "Your firm's logo, your colors, your domain. Tools generate outputs branded as YOUR firm's, powered by CARES Works underneath. Ideal for firms who want to package a client-facing offering without building the software." },
              { q: "Can I switch tiers later?", a: "Yes. Upgrade or downgrade anytime from your Account tab. Prorated automatically." },
            ].map((f, i) => (
              <details key={i} style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 10, padding: "14px 18px" }}>
                <summary style={{ cursor: "pointer", fontFamily: "'DM Serif Display', serif", fontSize: 16, color: N.ink, listStyle: "none", position: "relative", paddingRight: 24 }}>
                  {f.q}
                  <span style={{ position: "absolute", right: 4, top: 2, color: N.blue, fontFamily: "'DM Mono', monospace", fontSize: 14 }}>+</span>
                </summary>
                <div style={{ marginTop: 10, fontSize: 14, color: N.muted, lineHeight: 1.6 }}>{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </div>

      <SignatureFooter />
    </div>
  );
}
