// neon.jsx — shared CARES Works "neon-outlined boxes on white" design system.
// One import → same palette, components, shell across every page.

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// PALETTE — dial-back to TWO-color system (blue + green only).
// Kari's call: 'too many colors.. what happened to just two ..primarily blue
// and some green neonish stuff? this is obscene'.
// Semantic slot names kept (pink, orange) so no component code changes; the
// VALUES now carry green + blue variants. Blue-heavy overall, green as accent.
export const N = {
  blue:      "#0080ff",
  blueHot:   "#00b7ff",
  blueDark:  "#0052cc",
  pink:      "#22c55e",   // was hot pink → NEON GREEN (accent slot)
  pinkDark:  "#16a34a",   // was pink-dark → deep green
  orange:    "#00b7ff",   // was neon orange → BLUE-HOT (variant of blue)
  orangeDark:"#0052cc",   // was orange-dark → blue-dark
  white:     "#ffffff",
  wall:      "#ffffff",
  ink:       "#0a0a14",
  text:      "#0f172a",
  muted:     "#64748b",
  mutedLite: "#94a3b8",
  rule:      "#e2e8f0",
  green:     "#22c55e",
  red:       "#ef4444",
};

export const N_RGB = {
  blue:   "0,128,255",
  pink:   "34,197,94",     // green (was 34,197,94 — pink)
  orange: "0,183,255",     // blue-hot (was 34,197,94 — orange)
  ink:    "10,10,20",
};

export const FONT_LINK = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap";

// --- Pizzazz helpers (no black — subtle color energy on white) ---------------

// Two-color radial wash for the page background. Blue top-left, green top-right.
// No pink, no orange. Low opacity so text stays black-on-white readable.
export const WASH_BG = `
  radial-gradient(ellipse at 15% 0%, rgba(0,128,255,0.10), transparent 55%),
  radial-gradient(ellipse at 85% 5%, rgba(34,197,94,0.07), transparent 55%),
  #ffffff
`;

// Subtler version — used for interior pages (Dashboard/tools). Less color, more air.
export const WASH_BG_LITE = `
  radial-gradient(ellipse at 10% 0%, rgba(0,128,255,0.06), transparent 45%),
  radial-gradient(ellipse at 90% 20%, rgba(34,197,94,0.04), transparent 50%),
  #ffffff
`;

// Gradient-fill text — inline style for hero <h1> highlights.
// Blue → green (was tri-color blue/pink/orange).
export const HERO_TEXT_GRAD = {
  background: `linear-gradient(90deg, ${N.blue} 0%, #16a34a 100%)`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

// Blue-to-blue subtler gradient — for less-loud accents.
export const HERO_TEXT_GRAD_BLUE = {
  background: `linear-gradient(90deg, ${N.blue} 0%, ${N.blueHot} 100%)`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

// Bigger, more energetic glow for primary hero CTAs — used on Join/Start/Upgrade
// buttons where you want the eye to land immediately.
export const HERO_BTN_GLOW = `0 4px 18px rgba(0,128,255,0.55), 0 0 40px rgba(0,128,255,0.25)`;
export const HERO_BTN_GLOW_PINK = `0 4px 18px rgba(34,197,94,0.55), 0 0 40px rgba(34,197,94,0.25)`;
export const HERO_BTN_GLOW_ORANGE = `0 4px 18px rgba(34,197,94,0.55), 0 0 40px rgba(34,197,94,0.25)`;

// --- Building blocks ---------------------------------------------------------

// NeonBox — white interior, neon-color outline + layered glow. THE card.
export function NeonBox({ color, rgb, scale = 1, style = {}, children }) {
  return (
    <div style={{
      background: N.white,
      borderRadius: 14,
      border: `2px solid ${color}`,
      boxShadow: `0 0 ${20*scale}px rgba(${rgb},0.28), 0 0 ${44*scale}px rgba(${rgb},0.12), inset 0 0 18px rgba(${rgb},0.03)`,
      color: N.ink,
      position: "relative",
      ...style,
    }}>
      {children}
    </div>
  );
}

// NeonBtn — solid neon-color CTA with matching glow.
export function NeonBtn({ color, onClick, children, style = {}, mono = false, block = false }) {
  return (
    <button onClick={onClick} style={{
      padding: mono ? "12px 26px" : "10px 18px",
      background: color,
      border: "none",
      borderRadius: 8,
      color: N.white,
      fontSize: mono ? 12 : 13,
      fontWeight: 700,
      cursor: "pointer",
      textAlign: block ? "center" : "left",
      width: block ? "100%" : "auto",
      fontFamily: mono ? "'DM Mono', monospace" : "'Figtree', sans-serif",
      letterSpacing: mono ? "0.12em" : "normal",
      textTransform: mono ? "uppercase" : "none",
      boxShadow: `0 4px 14px ${color}88`,
      ...style,
    }}>
      {children}
    </button>
  );
}

// GhostBtn — outlined ghost for secondary actions.
export function GhostBtn({ color = N.ink, onClick, children, style = {} }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 18px",
      background: "transparent",
      border: `1.5px solid ${N.rule}`,
      borderRadius: 8,
      color: color,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      ...style,
    }}>
      {children}
    </button>
  );
}

// --- Page chrome -------------------------------------------------------------

// LogoHero — full-width rounded-corner logo banner, left-aligned. Optional right-side child.
export function LogoHero({ right = null, hrefHome = "/dashboard" }) {
  return (
    <div style={{ background: N.white, padding: "36px 0 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
        <a href={hrefHome} style={{ display: "block" }}>
          <img src="/cares-works-neon-logo.png" alt="CARES Works — Tools, Training, Confidence, Results. Built for Business. Backed by CARES."
            style={{ maxHeight: 200, width: "auto", maxWidth: "100%", display: "block", borderRadius: 20, boxShadow: "0 8px 32px rgba(0,128,255,0.28)" }} />
        </a>
        {right && <div style={{ maxWidth: 380, flex: "1 1 300px" }}>{right}</div>}
      </div>
    </div>
  );
}

// FeaturedTool — the hero's right-hand callout.
//
// It used to be a hand-edited "NEW DROP" row in `spotlight_current`, which meant
// it stopped being new the moment nobody remembered to edit it. Now it rotates
// itself: one published tool per week, deterministic, so every member sees the
// same feature and it changes on its own. Set `is_pinned = true` on the
// spotlight_current row to override the rotation with a hand-picked feature.
function weeklyIndex(n) {
  if (!n) return 0;
  const EPOCH = Date.UTC(2026, 0, 5); // a Monday — rotation turns over Mondays
  const weeks = Math.floor((Date.now() - EPOCH) / 604800000);
  return ((weeks % n) + n) % n;
}

export function SpotlightCallout() {
  const [pick, setPick] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: row } = await supabase.from("spotlight_current").select("*").limit(1).maybeSingle();

      if (row && row.is_pinned) {
        setPick({
          eyebrow: row.eyebrow || "FEATURED TOOL",
          name: row.item_name,
          pitch: row.item_pitch,
          ctaLabel: row.cta_label || "Open it",
          href: row.cta_href,
          accent: row.accent === "pink" ? N.pink : row.accent === "orange" ? N.orange : N.blueHot,
          note: null,
        });
        setLoaded(true);
        return;
      }

      const { data: tools } = await supabase.from("tools")
        .select("title, slug, href, description, why_use, tag, tier")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      if (tools && tools.length) {
        const i = weeklyIndex(tools.length);
        const t = tools[i];
        const isFree = t.tier === "free";
        setPick({
          eyebrow: t.tag === "NEW" ? "NEW THIS WEEK" : "FEATURED TOOL",
          name: t.title,
          pitch: t.why_use || t.description,
          ctaLabel: "Open " + t.title,
          href: t.href || "/tools/" + t.slug,
          accent: isFree ? N.pink : N.blueHot,
          note: "A different tool every week · " + (i + 1) + " of " + tools.length,
        });
      } else if (row) {
        setPick({
          eyebrow: row.eyebrow || "FEATURED TOOL",
          name: row.item_name,
          pitch: row.item_pitch,
          ctaLabel: row.cta_label || "Open it",
          href: row.cta_href,
          accent: N.blueHot,
          note: null,
        });
      }
      setLoaded(true);
    })();
  }, []);

  if (!loaded || !pick) return null;

  return (
    <div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: N.pink, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 100, background: N.pink, boxShadow: `0 0 10px ${N.pink}` }} />
        {pick.eyebrow}
      </div>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink, lineHeight: 1.2, marginBottom: 8 }}>
        <span style={{ color: pick.accent }}>{pick.name}</span>
      </h2>
      <p style={{ fontSize: 14, color: N.muted, lineHeight: 1.55, marginBottom: 14 }}>{pick.pitch}</p>
      <a href={pick.href} style={{ display: "inline-block", padding: "9px 18px", background: N.blue, color: N.white, borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 14px rgba(0,128,255,0.4)" }}>
        {pick.ctaLabel} →
      </a>
      {pick.note && (
        <div style={{ marginTop: 10, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", color: N.mutedLite }}>{pick.note}</div>
      )}
    </div>
  );
}

// StatPills — reads live counts from Supabase for the site pulse.
export function StatPills({ pills }) {
  if (!pills || pills.length === 0) return null;
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", gap: 10, flexWrap: "wrap" }}>
      {pills.map(s => {
        const c = s.color === "pink" ? N.pink : s.color === "orange" ? N.orange : s.color === "ink" ? N.ink : N.blue;
        return (
          <div key={s.label} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "8px 16px", background: N.white, border: "1px solid " + N.rule, borderRadius: 100 }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: c, fontWeight: 400 }}>{s.n}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: N.muted, textTransform: "uppercase", fontWeight: 700 }}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// NeonNav — sticky white nav bar. Wordmark + pills on left, actions on right.
// tabs: array of {label, href, active}. right: React node.
export function NeonNav({ tabs = [], right = null, hrefHome = "/dashboard" }) {
  return (
    <header style={{ background: N.white, borderBottom: "1px solid " + N.rule, padding: 0, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href={hrefHome} style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>
              CARES <span style={{ color: N.blueHot, fontStyle: "italic" }}>Works.</span>
            </span>
          </a>
          {tabs.length > 0 && (
            <div style={{ display: "flex", gap: 4, background: N.wall, borderRadius: 10, padding: 4, border: "1px solid " + N.rule }}>
              {tabs.map(t => (
                <a key={t.label} href={t.href} style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  background: t.active ? N.blue : "transparent",
                  color: t.active ? N.white : N.muted,
                  fontSize: 12,
                  fontWeight: t.active ? 700 : 500,
                  cursor: "pointer",
                  boxShadow: t.active ? "0 4px 14px rgba(0,128,255,0.4)" : "none",
                  textDecoration: "none",
                }}>{t.label}</a>
              ))}
            </div>
          )}
        </div>
        {right && <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{right}</div>}
      </div>
    </header>
  );
}

// SignatureFooter — tri-color pill + proprietary IP notice.
// Same pattern as FlowSuite Pro's footer so all Kari-built products share IP boilerplate.
export function SignatureFooter() {
  return (
    <div style={{ textAlign: "center", padding: "40px 24px 32px" }}>
      <div style={{ display: "inline-block", padding: "10px 26px", background: `linear-gradient(135deg, ${N.blue}, #16a34a)`, borderRadius: 100, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.2em", color: N.white, fontWeight: 700, boxShadow: "0 6px 20px rgba(0,128,255,0.35)", marginBottom: 26 }}>
        BUILT FOR BUSINESS &nbsp;·&nbsp; BACKED BY CARES
      </div>
      <div style={{ maxWidth: 640, margin: "0 auto", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.06em", color: N.muted, lineHeight: 1.7 }}>
        CARES Works &mdash; proprietary software of Kari Hoglund Kounkel LLC &amp; CARES Consulting, Inc.<br />
        &copy; 2026. All rights reserved.
      </div>
    </div>
  );
}

// PageShell — <PageShell tabs={...} right={...} spotlight statPills={...}> children </PageShell>
// One-liner to wrap any authenticated page in the standard chrome.
export function PageShell({ tabs, right, spotlight = false, statPills, children, hrefHome = "/dashboard" }) {
  return (
    <div style={{ minHeight: "100vh", background: N.white, color: N.text, fontFamily: "'Figtree', sans-serif" }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <LogoHero right={spotlight ? <SpotlightCallout /> : null} hrefHome={hrefHome} />
      {statPills && (
        <div style={{ background: N.white, padding: "0 0 16px" }}>
          <StatPills pills={statPills} />
        </div>
      )}
      <NeonNav tabs={tabs} right={right} hrefHome={hrefHome} />
      {children}
      <SignatureFooter />
    </div>
  );
}
