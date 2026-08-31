import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";
import { N, N_RGB, FONT_LINK, NeonBox, NeonBtn, SignatureFooter, WASH_BG, HERO_TEXT_GRAD } from "../design/neon";

// The public tool index. This is the page the barcode in Court of Accounts
// points at (accounts.karikounkel.com/tools), so it must render for a reader
// who has never logged in and never heard of CARES Works. No auth, no wall —
// member-only tools show what they are and where to get them.

const MONTHLY_URL = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";

// Ordered so the book's own subject matter (bookkeeping, money) leads.
const CATEGORIES = [
  { key: "bookkeeping", label: "Bookkeeping", blurb: "The books, the vendors, the year-end mess.", color: N.blue, rgb: N_RGB.blue },
  { key: "money", label: "Money & Pricing", blurb: "What the number needs to be, and why.", color: N.pink, rgb: N_RGB.pink },
  { key: "people", label: "People & Payroll", blurb: "Hiring, paying, and parting ways.", color: N.orange, rgb: N_RGB.orange },
  { key: "clientwork", label: "Client Work", blurb: "What to say and what to leave behind.", color: N.blue, rgb: N_RGB.blue },
  { key: "leadership", label: "Leadership", blurb: "Who's in your corner, and how you run the room.", color: N.pink, rgb: N_RGB.pink },
  { key: "marketing", label: "Marketing", blurb: "Getting the word out without an agency.", color: N.orange, rgb: N_RGB.orange },
  { key: "utilities", label: "Utilities", blurb: "Build-your-own odds and ends.", color: N.blue, rgb: N_RGB.blue },
];

const MOBILE = `
  @media (max-width: 640px) {
    .ti-hero { flex-direction: column !important; align-items: flex-start !important; }
    .ti-hero h1 { font-size: 30px !important; }
    .ti-main { padding: 32px 16px 56px !important; }
    .ti-grid { grid-template-columns: 1fr !important; }
  }
`;

function toolHref(t) {
  return t.href || "/tools/" + t.slug;
}

function ToolCard({ tool, color, rgb }) {
  const locked = !tool.is_free;
  const href = toolHref(tool);
  return (
    <NeonBox color={color} rgb={rgb} style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 22, lineHeight: 1.2, flexShrink: 0 }}>{tool.icon || (locked ? "🔒" : "🧰")}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: N.ink, lineHeight: 1.25 }}>{tool.title}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: locked ? N.muted : color, fontWeight: 700, marginTop: 6 }}>
            {locked ? "Members" : "Free"}{tool.tag ? " · " + tool.tag : ""}
          </div>
        </div>
      </div>
      {tool.description && (
        <p style={{ fontSize: 14, color: N.muted, lineHeight: 1.6, margin: 0 }}>{tool.description}</p>
      )}
      <div style={{ marginTop: 4 }}>
        {locked ? (
          <a href="/pricing" onClick={e => { e.preventDefault(); navigate("/pricing"); }}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: N.muted, textDecoration: "none", fontWeight: 700, borderBottom: `1.5px solid ${N.rule}` }}>
            Unlock with membership →
          </a>
        ) : (
          <NeonBtn color={color} onClick={() => { if (href.startsWith("/steward")) { window.location.href = href; } else { navigate(href); } }}>Open →</NeonBtn>
        )}
      </div>
    </NeonBox>
  );
}

export default function ToolsIndex({ session }) {
  const [tools, setTools] = useState(null); // null = loading, [] = loaded-empty
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    supabase.from("tools").select("*").eq("is_published", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) { setFailed(true); setTools([]); return; }
        setTools(data || []);
      })
      // A hard network failure rejects rather than returning an error, and a
      // reader off the barcode must never be left staring at "Loading…".
      .catch(() => { setFailed(true); setTools([]); });
  }, []);

  // Group by category, case-insensitively — the table mixes "Marketing" and
  // "money". Anything with an unrecognized category lands in "More tools".
  const known = new Set(CATEGORIES.map(c => c.key));
  const buckets = {};
  const extras = [];
  (tools || []).forEach(t => {
    const key = (t.category || "").trim().toLowerCase();
    if (known.has(key)) { (buckets[key] = buckets[key] || []).push(t); }
    else { extras.push(t); }
  });

  const freeCount = (tools || []).filter(t => t.is_free).length;

  return (
    <div style={{ fontFamily: "'Figtree', sans-serif", background: WASH_BG, color: N.ink, lineHeight: 1.65, minHeight: "100vh" }}>
      <style>{MOBILE}</style>
      <link href={FONT_LINK} rel="stylesheet" />

      {/* HERO */}
      <div style={{ background: N.white, padding: "40px 0 28px", borderBottom: `1px solid ${N.rule}` }}>
        <div className="ti-hero" style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
          <a href="/" onClick={e => { e.preventDefault(); navigate("/"); }} style={{ display: "block", textDecoration: "none", flexShrink: 0 }}>
            <img src="/cares-works-neon-logo.png" alt="CARES Works" style={{ maxHeight: 140, width: "auto", maxWidth: "100%", display: "block", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,128,255,0.28)" }} />
          </a>
          <div style={{ flex: "1 1 320px" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: N.orange, marginBottom: 12, fontWeight: 700 }}>
              CARES Works · The Tool Library
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4.5vw, 42px)", lineHeight: 1.1, marginBottom: 14, color: N.ink }}>
              Every tool, <em style={{ fontStyle: "italic", ...HERO_TEXT_GRAD }}>in one place.</em>
            </h1>
            <p style={{ fontSize: 16, color: N.muted, margin: 0, maxWidth: 520 }}>
              Plain-English tools for the business problems nobody taught you how to solve.
              {freeCount > 0 ? ` ${freeCount} of them are free — no account, no email.` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="ti-main" style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 56px" }}>

        {/* BOOK BAND — this is the page the barcode in the book points to. */}
        <NeonBox color={N.blue} rgb={N_RGB.blue} style={{ padding: "22px 26px", marginBottom: 40, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <img src="/court-of-accounts-cover-thumb.jpg" alt="Court of Accounts" style={{ height: 90, width: "auto", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,128,255,0.3)", flexShrink: 0 }} />
          <div style={{ flex: "1 1 280px" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: N.blue, fontWeight: 700, marginBottom: 6 }}>
              Scanned the code in the book?
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 6 }}>
              You're in the right place.
            </div>
            <p style={{ fontSize: 14, color: N.muted, margin: 0 }}>
              <em>Court of Accounts</em> is a business parable. These are the working tools behind it —
              the ledgers, checklists, and scripts Eggerton would have needed.
            </p>
          </div>
        </NeonBox>

        {tools === null && (
          <div style={{ padding: "60px 0", textAlign: "center", color: N.muted, fontSize: 15 }}>Loading the library…</div>
        )}

        {failed && (
          <NeonBox color={N.pink} rgb={N_RGB.pink} style={{ padding: "24px 28px", marginBottom: 32 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 8 }}>The library didn't load.</div>
            <p style={{ fontSize: 14, color: N.muted, marginBottom: 16 }}>Refresh the page, or head to the main site — everything is reachable from there.</p>
            <NeonBtn color={N.blue} onClick={() => navigate("/")}>Go to CARES Works →</NeonBtn>
          </NeonBox>
        )}

        {tools !== null && CATEGORIES.map(cat => {
          const list = buckets[cat.key];
          if (!list || list.length === 0) return null;
          return (
            <section key={cat.key} style={{ marginBottom: 48 }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: cat.color, fontWeight: 700, marginBottom: 6 }}>{cat.label}</div>
                <div style={{ fontSize: 14, color: N.muted }}>{cat.blurb}</div>
              </div>
              <div className="ti-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
                {list.map(t => <ToolCard key={t.id || t.slug} tool={t} color={cat.color} rgb={cat.rgb} />)}
              </div>
            </section>
          );
        })}

        {extras.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: N.blue, fontWeight: 700, marginBottom: 18 }}>More tools</div>
            <div className="ti-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
              {extras.map(t => <ToolCard key={t.id || t.slug} tool={t} color={N.blue} rgb={N_RGB.blue} />)}
            </div>
          </section>
        )}

        {/* CLOSER */}
        <NeonBox color={N.pink} rgb={N_RGB.pink} style={{ padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 6 }}>
              {session ? "Everything's in your dashboard." : "Members get all of it."}
            </div>
            <p style={{ fontSize: 14, color: N.muted, margin: 0 }}>
              {session
                ? "Your library, your saved work, and the Court of Accounts chapters."
                : "Every locked tool above, plus new ones monthly and the full Court of Accounts."}
            </p>
          </div>
          {session ? (
            <NeonBtn color={N.blue} onClick={() => navigate("/dashboard")} mono>My Dashboard →</NeonBtn>
          ) : (
            <a href={MONTHLY_URL} style={{ display: "inline-block", background: N.blue, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 28px", borderRadius: 8, textDecoration: "none", fontWeight: 700, flexShrink: 0 }}>
              Join — $27/month
            </a>
          )}
        </NeonBox>
      </div>

      <SignatureFooter />
    </div>
  );
}
