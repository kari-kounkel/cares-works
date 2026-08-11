// Public proposal view — client sees this at /p/:token. No login needed.

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { N, N_RGB, FONT_LINK, WASH_BG_LITE } from "../design/neon";

function money(cents) {
  if (cents == null) return "";
  return "$" + (Math.round(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProposalPublic({ token }) {
  const [p, setP] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("proposals").select("*").eq("public_token", token).limit(1).maybeSingle();
      if (!data) { setNotFound(true); setLoading(false); return; }
      setP(data);
      if (data.pdf_storage_path) {
        const { data: signed } = await supabase.storage.from("proposals-pdfs").createSignedUrl(data.pdf_storage_path, 3600);
        setPdfUrl(signed?.signedUrl || null);
      }
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <div style={{ minHeight: "100vh", background: WASH_BG_LITE, display: "flex", alignItems: "center", justifyContent: "center", color: N.muted, fontFamily: "'Figtree', sans-serif" }}>Loading…</div>;
  if (notFound) return (
    <div style={{ minHeight: "100vh", background: WASH_BG_LITE, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Figtree', sans-serif", textAlign: "center" }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <div>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>Link not found or expired.</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: WASH_BG_LITE, fontFamily: "'Figtree', sans-serif", color: N.ink }}>
      <link href={FONT_LINK} rel="stylesheet" />

      <header style={{ background: N.white, borderBottom: `1px solid ${N.rule}`, padding: "16px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: N.blue, fontWeight: 700 }}>PROPOSAL FROM CARES CONSULTING</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: N.ink, margin: "6px 0 0" }}>{p.title || "Proposal"}</h1>
          <div style={{ color: N.muted, fontSize: 14, marginTop: 4 }}>Prepared for {p.client_name}{p.client_contact ? " — " + p.client_contact : ""}</div>
          {p.value_cents != null && (
            <div style={{ marginTop: 14, padding: "10px 16px", background: `rgba(${N_RGB.blue},0.08)`, borderRadius: 8, display: "inline-block" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, letterSpacing: "0.14em" }}>INVESTMENT</span>{" "}
              <strong style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: N.ink, marginLeft: 8 }}>{money(p.value_cents)}</strong>
              {p.payment_schedule && <span style={{ marginLeft: 12, color: N.muted, fontSize: 13 }}>· {p.payment_schedule}</span>}
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        {pdfUrl ? (
          <div style={{ background: N.white, border: `1.5px solid ${N.rule}`, borderRadius: 12, overflow: "hidden", boxShadow: `0 4px 24px rgba(0,0,0,0.06)` }}>
            <iframe src={pdfUrl} title="Proposal PDF" style={{ width: "100%", height: "90vh", border: "none", display: "block" }} />
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: "center", background: N.white, borderRadius: 12, color: N.muted }}>The PDF isn't ready yet. Please check back shortly.</div>
        )}
      </main>

      <footer style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 24px", textAlign: "center", color: N.muted, fontSize: 12 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: N.ink }}>CARES Consulting, Inc.</div>
        <div>Revenue is vanity. Net profit is sanity.™</div>
      </footer>
    </div>
  );
}
