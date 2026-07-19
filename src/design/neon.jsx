// neon.jsx — shared CARES Works "neon-outlined boxes on white" design system.
// One import → same palette, components, shell across every page.

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// PALETTE — sampled from the CARES Works neon logo
export const N = {
  blue:      "#0080ff",
  blueHot:   "#00b7ff",
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
  red:       "#ef4444",
};

export const N_RGB = {
  blue:   "0,128,255",
  pink:   "255,45,138",
  orange: "255,138,42",
  ink:    "10,10,20",
};

export const FONT_LINK = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap";

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

// SpotlightCallout — reads spotlight_current from Supabase and renders the hero right-side card.
// Falls back to a default when the table/row is missing so the page doesn't break.
export function SpotlightCallout() {
  const [spot, setSpot] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("spotlight_current").select("*").limit(1).maybeSingle();
      if (data) setSpot(data);
      setLoaded(true);
    })();
  }, []);

  const s = spot || {
    eyebrow: "THIS WEEK'S SPOTLIGHT",
    item_type: "NEW DROP",
    item_name: "The Vendor Decoder",
    item_pitch: "Turn your vendor list into a posting playbook. Every account lands where it belongs — no more asking \"wait, where does Amazon go this time?\"",
    cta_label: "Open the Vendor Decoder",
    cta_href: "/tools/vendor-decoder",
    accent: "blue",
  };
  if (!loaded) return null;

  const accentColor = s.accent === "pink" ? N.pink : s.accent === "orange" ? N.orange : N.blueHot;

  return (
    <div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: N.pink, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 100, background: N.pink, boxShadow: `0 0 10px ${N.pink}` }} />
        {s.eyebrow}
      </div>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink, lineHeight: 1.2, marginBottom: 8 }}>
        {s.item_type.toLowerCase().includes("drop") ? "New drop: " : ""}
        <span style={{ color: accentColor }}>{s.item_name}</span>
      </h2>
      <p style={{ fontSize: 14, color: N.muted, lineHeight: 1.55, marginBottom: 14 }}>{s.item_pitch}</p>
      <a href={s.cta_href} style={{ display: "inline-block", padding: "9px 18px", background: N.blue, color: N.white, borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 14px rgba(0,128,255,0.4)" }}>
        {s.cta_label} →
      </a>
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

// SignatureFooter — the "BUILT FOR BUSINESS · BACKED BY CARES" tri-color pill.
export function SignatureFooter() {
  return (
    <div style={{ textAlign: "center", padding: "40px 24px 60px" }}>
      <div style={{ display: "inline-block", padding: "10px 26px", background: `linear-gradient(135deg, ${N.orange}, ${N.pink}, ${N.blue})`, borderRadius: 100, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.2em", color: N.white, fontWeight: 700, boxShadow: "0 6px 20px rgba(255,45,138,0.35)" }}>
        BUILT FOR BUSINESS &nbsp;·&nbsp; BACKED BY CARES
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
