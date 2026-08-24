// COA Library — 13 industry chart-of-accounts templates. Free CSV download.
// Route: /tools/coa-library (public — no login)

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { N, N_RGB, FONT_LINK, NeonBox, SignatureFooter, WASH_BG_LITE } from "../design/neon";

const TYPE_LABEL = {
  asset: "Asset", liability: "Liability", equity: "Equity",
  income: "Income", cogs: "COGS", expense: "Expense", other: "Other",
};
const TYPE_COLOR = {
  asset:     { c: "#0080ff", bg: "rgba(0,128,255,0.10)" },
  liability: { c: "#ef4444", bg: "rgba(239,68,68,0.10)" },
  equity:    { c: "#a855f7", bg: "rgba(168,85,247,0.10)" },
  income:    { c: "#16a34a", bg: "rgba(34,197,94,0.12)" },
  cogs:      { c: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  expense:   { c: "#64748b", bg: "rgba(100,116,139,0.10)" },
  other:     { c: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
};

function makeCSV(coa) {
  const header = "Account Number,Account Name,Account Type\n";
  const rows = coa.accounts.map(a => {
    const num = String(a.number).replace(/,/g, "");
    const name = String(a.name).replace(/"/g, '""');
    const type = TYPE_LABEL[a.type] || a.type;
    return `${num},"${name}",${type}`;
  }).join("\n");
  return header + rows + "\n";
}

function downloadFile(name, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function COALibrary({ session }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSlug, setOpenSlug] = useState(null);
  const [showEmailGate, setShowEmailGate] = useState(null); // {slug, format}
  const [emailInput, setEmailInput] = useState(session?.user?.email || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("coa_templates").select("*").order("sort_order", { ascending: true });
      setTemplates(data || []);
      setLoading(false);
      // Deep link ?coa=slug
      const params = new URLSearchParams(window.location.search);
      const s = params.get("coa");
      if (s) setOpenSlug(s);
    })();
  }, []);

  async function trackDownload(slug, format, email) {
    try {
      await supabase.from("coa_downloads").insert({
        coa_slug: slug, email: email || null, format, is_member: !!session,
      });
    } catch (e) { /* non-fatal */ }
  }

  async function handleDownload(coa, format = "csv") {
    // Session user? Straight download. Anonymous? Email gate first.
    if (!session && !emailInput) {
      setShowEmailGate({ slug: coa.slug, format });
      return;
    }
    setSaving(true);
    const email = session?.user?.email || emailInput || null;
    await trackDownload(coa.slug, format, email);
    if (format === "csv") {
      downloadFile(`${coa.slug}-chart-of-accounts.csv`, "text/csv", makeCSV(coa));
    }
    setSaving(false);
    setShowEmailGate(null);
  }

  async function handleEmailGateSubmit() {
    if (!emailInput || !emailInput.includes("@")) return;
    const coa = templates.find(t => t.slug === showEmailGate.slug);
    if (coa) await handleDownload(coa, showEmailGate.format);
  }

  const openTpl = openSlug ? templates.find(t => t.slug === openSlug) : null;

  return (
    <div style={{ minHeight: "100vh", background: WASH_BG_LITE, fontFamily: "'Figtree', sans-serif", color: N.ink }}>
      <link href={FONT_LINK} rel="stylesheet" />

      {/* HERO */}
      <header style={{ background: N.white, borderBottom: `1px solid ${N.rule}`, padding: "22px 24px 26px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <a href="/" style={{ color: N.muted, textDecoration: "none", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em" }}>← CARES WORKS</a>
            <span style={{ color: N.rule }}>·</span>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: N.blue, fontWeight: 700 }}>FREE TOOL</div>
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: N.ink, margin: 0, lineHeight: 1.1 }}>
            Chart of Accounts Library
          </h1>
          <p style={{ color: N.muted, fontSize: 15.5, marginTop: 8, maxWidth: 720, lineHeight: 1.5 }}>
            {templates.length || 13} industry-specific charts of accounts, built by a real bookkeeper who's seen the wrong ones a thousand times. Pick your industry, download the CSV, import into anything.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: N.muted, fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em" }}>
            <span>✓ FREE FOREVER</span>
            <span>✓ IMPORTS INTO QUICKBOOKS, XERO, WAVE, CARES LEDGER</span>
            <span>✓ TAX-PREPARER APPROVED</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 40px" }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: N.muted }}>Loading library…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {templates.map(t => (
              <button key={t.slug} onClick={() => setOpenSlug(t.slug)}
                style={{ textAlign: "left", padding: "20px 22px", background: N.white, border: `1.5px solid ${N.rule}`, borderRadius: 14, cursor: "pointer", transition: "border-color .15s, box-shadow .15s, transform .1s", fontFamily: "'Figtree', sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = N.blue; e.currentTarget.style.boxShadow = `0 8px 24px rgba(${N_RGB.blue},0.18)`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = N.rule; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{t.emoji || "📊"}</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: N.ink, lineHeight: 1.15 }}>{t.industry_name}</div>
                <div style={{ fontSize: 13, color: N.muted, marginTop: 6, lineHeight: 1.45 }}>{t.tagline}</div>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.06em" }}>
                  <span style={{ color: N.blue, fontWeight: 700 }}>{t.account_count} ACCOUNTS</span>
                  <span style={{ color: N.muted }}>PREVIEW →</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: 32, padding: "24px 24px", background: `linear-gradient(135deg, rgba(${N_RGB.blue},0.06), rgba(34,197,94,0.05))`, borderRadius: 14, border: `1.5px solid ${N.rule}` }}>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.blue, fontWeight: 700 }}>WANT MORE?</div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, margin: "6px 0 8px" }}>Import straight into QuickBooks or CARES Ledger.</h2>
              <p style={{ color: N.muted, fontSize: 14, lineHeight: 1.5, margin: 0 }}>
                Free tier gets you the CSV. Members ($27/mo) get one-click QuickBooks Online IIF export + editable saved copies + one-click seed into CARES Ledger. Skip the retyping.
              </p>
            </div>
            <a href="/pricing" style={{ padding: "10px 20px", background: N.blue, color: N.white, borderRadius: 10, textDecoration: "none", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em", fontWeight: 700, boxShadow: `0 4px 16px rgba(${N_RGB.blue},0.35)`, whiteSpace: "nowrap" }}>
              SEE PLANS →
            </a>
          </div>
        </div>
      </main>

      {/* PREVIEW PANEL */}
      {openTpl && (
        <div onClick={() => setOpenSlug(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.55)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: N.white, maxWidth: 820, width: "100%", borderRadius: 14, boxShadow: `0 20px 60px rgba(0,0,0,0.35)`, border: `2px solid ${N.blue}`, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${N.rule}`, background: `linear-gradient(135deg, rgba(${N_RGB.blue},0.06), transparent)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 34, marginBottom: 6 }}>{openTpl.emoji}</div>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink, margin: 0 }}>{openTpl.industry_name}</h2>
                  <p style={{ color: N.muted, fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>{openTpl.description}</p>
                </div>
                <button onClick={() => setOpenSlug(null)}
                  style={{ background: "transparent", border: "none", fontSize: 26, cursor: "pointer", color: N.muted, lineHeight: 1 }}>×</button>
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => handleDownload(openTpl, "csv")}
                  disabled={saving}
                  style={{ padding: "10px 20px", background: N.blue, color: N.white, border: "none", borderRadius: 10, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em", fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 14px rgba(${N_RGB.blue},0.4)` }}>
                  {saving ? "PREPARING…" : "⬇ DOWNLOAD CSV — FREE"}
                </button>
                <button
                  onClick={() => { const url = window.location.origin + "/tools/coa-library?coa=" + openTpl.slug; navigator.clipboard?.writeText(url); alert("Link copied: " + url); }}
                  style={{ padding: "10px 16px", background: N.white, color: N.blue, border: `1.5px solid ${N.blue}`, borderRadius: 10, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em", fontWeight: 700, cursor: "pointer" }}>
                  🔗 COPY SHARE LINK
                </button>
                <a href="/pricing" style={{ padding: "10px 16px", background: N.white, color: N.muted, border: `1px solid ${N.rule}`, borderRadius: 10, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em", fontWeight: 700, textDecoration: "none" }}>
                  QBO / IIF EXPORT (MEMBERS)
                </a>
              </div>
            </div>

            {/* Table preview */}
            <div style={{ padding: "0", maxHeight: 500, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead style={{ background: "#f8fafc", position: "sticky", top: 0 }}>
                  <tr>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, fontWeight: 700, borderBottom: `1px solid ${N.rule}`, width: 90 }}>NUMBER</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, fontWeight: 700, borderBottom: `1px solid ${N.rule}` }}>ACCOUNT</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, fontWeight: 700, borderBottom: `1px solid ${N.rule}`, width: 100 }}>TYPE</th>
                  </tr>
                </thead>
                <tbody>
                  {openTpl.accounts.map((a, i) => {
                    const c = TYPE_COLOR[a.type] || TYPE_COLOR.other;
                    const isHeader = String(a.name) === String(a.name).toUpperCase() && a.name.length > 3;
                    return (
                      <tr key={i} style={{ background: isHeader ? "#f8fafc" : "transparent" }}>
                        <td style={{ padding: "6px 14px", fontFamily: "'DM Mono', monospace", fontSize: 12, color: N.ink, borderBottom: `1px solid #f1f5f9` }}>{a.number}</td>
                        <td style={{ padding: "6px 14px", fontSize: 13, color: N.ink, fontWeight: isHeader ? 700 : 400, borderBottom: `1px solid #f1f5f9` }}>{a.name}</td>
                        <td style={{ padding: "6px 14px", borderBottom: `1px solid #f1f5f9` }}>
                          <span style={{ padding: "2px 8px", borderRadius: 100, background: c.bg, color: c.c, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.06em", fontWeight: 700 }}>
                            {TYPE_LABEL[a.type] || a.type}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px", background: "#f8fafc", borderTop: `1px solid ${N.rule}`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, letterSpacing: "0.06em" }}>
              <span>{openTpl.account_count} accounts · CSV imports into QuickBooks, Xero, Wave, CARES Ledger</span>
              <span>Kari Hoglund Kounkel · CARES Consulting</span>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL GATE (anonymous downloads only) */}
      {showEmailGate && (
        <div onClick={() => !saving && setShowEmailGate(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.75)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: N.white, maxWidth: 440, width: "100%", borderRadius: 14, padding: "26px 28px", border: `2px solid ${N.blue}`, boxShadow: `0 12px 40px rgba(0,0,0,0.4), 0 0 40px rgba(${N_RGB.blue},0.3)` }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📩</div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, margin: 0 }}>One thing before I send it.</h3>
            <p style={{ color: N.muted, fontSize: 14, lineHeight: 1.5, marginTop: 8, marginBottom: 16 }}>
              Drop your email and I'll deliver it — plus the occasional Debrief (my monthly note for people running the money side of a business). No spam, unsubscribe with one click.
            </p>
            <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleEmailGateSubmit()}
              placeholder="you@yourbiz.com" autoFocus
              style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${N.rule}`, borderRadius: 8, fontSize: 15, fontFamily: "'Figtree', sans-serif", boxSizing: "border-box", outline: "none" }} />
            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowEmailGate(null)} disabled={saving}
                style={{ padding: "9px 14px", background: "transparent", border: `1px solid ${N.rule}`, borderRadius: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", fontWeight: 700, color: N.muted, cursor: "pointer" }}>NO THANKS</button>
              <button onClick={handleEmailGateSubmit} disabled={saving || !emailInput.includes("@")}
                style={{ padding: "9px 18px", background: N.blue, color: N.white, border: "none", borderRadius: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving || !emailInput.includes("@") ? 0.6 : 1 }}>
                {saving ? "SENDING…" : "SEND IT →"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SignatureFooter />
    </div>
  );
}
