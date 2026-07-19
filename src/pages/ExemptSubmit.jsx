import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const S = {
  slate: "#0a0a14", orange: "#0080ff", orangeDark: "#0052cc", orangeLight: "#e6f0ff",
  paper: "#ffffff", cream: "#f7f9fc", ink: "#0a0a14", rule: "#e2e8f0",
  muted: "#64748b", green: "#5a9a5a", red: "#c95050",
  grad: "linear-gradient(135deg, #0080ff, #0052cc)",
};

const MOBILE = `
  @media (max-width: 640px) {
    .es-page { padding: 32px 16px 60px !important; }
    .es-h1 { font-size: 26px !important; }
  }
`;

export default function ExemptSubmit() {
  // Token comes from the URL: /exempt/<token>
  const token = window.location.pathname.replace(/^\/exempt\//, "").replace(/\/$/, "");
  const [state, setState] = useState({ loading: true, request: null, error: null });

  useEffect(() => {
    (async () => {
      if (!token || token.length < 8) {
        setState({ loading: false, request: null, error: "This link doesn't look right." });
        return;
      }
      const { data, error } = await supabase.rpc("get_exempt_request_by_token", { p_token: token });
      if (error) {
        setState({ loading: false, request: null, error: "We couldn't look up this link. Please contact the business that sent it to you." });
        return;
      }
      const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (!row) {
        setState({ loading: false, request: null, error: "This link has expired or has already been used. Please ask the sender for a new one." });
        return;
      }
      setState({ loading: false, request: row, error: null });
    })();
  }, [token]);

  const { loading, request, error } = state;

  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', sans-serif", color: S.ink }}>
      <style>{MOBILE}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header style={{ background: S.slate, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "center", height: 68, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/cares-works-neon-logo.png" alt="CARES Works" style={{ height: 38, width: "auto", display: "block" }} />
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#fff" }}>CARES <span style={{ color: S.orange }}>Works.</span></span>
        </div>
      </header>

      <div className="es-page" style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px 80px" }}>

        {loading && (
          <div style={{ color: S.muted, fontSize: 14, fontFamily: "'DM Mono', monospace", textAlign: "center", padding: 40 }}>
            Looking up your request…
          </div>
        )}

        {!loading && error && (
          <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 14, padding: "36px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
            <h1 className="es-h1" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: S.slate, marginBottom: 12, lineHeight: 1.25 }}>Link not available</h1>
            <p style={{ fontSize: 15, color: S.muted, lineHeight: 1.65 }}>{error}</p>
          </div>
        )}

        {!loading && request && (
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: S.orange, marginBottom: 10 }}>Sales Tax Exemption Certificate</div>
              <h1 className="es-h1" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: S.slate, marginBottom: 12, lineHeight: 1.2 }}>
                Hi{request.customer_contact_name ? " " + request.customer_contact_name.split(" ")[0] : ""} — we need your ST3.
              </h1>
              <p style={{ fontSize: 15, color: S.ink, lineHeight: 1.65 }}>
                We're updating our sales tax records for <strong>{request.customer_business_name}</strong> and need a current Minnesota Form ST3 Certificate of Exemption on file. It takes about five minutes.
              </p>
            </div>

            {/* STEP 1 */}
            <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "22px 26px", marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", color: S.orange, marginBottom: 6 }}>STEP 1</div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: S.slate, marginBottom: 8 }}>Download the blank form.</h2>
              <p style={{ fontSize: 14, color: S.muted, marginBottom: 16, lineHeight: 1.55 }}>
                Straight from the Minnesota Department of Revenue. Current 2026 version.
              </p>
              <a href="/mn-form-st3.pdf" target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 22px", background: S.grad, color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: "'Figtree', sans-serif" }}>
                📄 Download Blank MN Form ST3
              </a>
            </div>

            {/* STEP 2 */}
            <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "22px 26px", marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", color: S.orange, marginBottom: 6 }}>STEP 2</div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: S.slate, marginBottom: 8 }}>Fill it out and sign it.</h2>
              <p style={{ fontSize: 14, color: S.muted, lineHeight: 1.55 }}>
                Complete all the required fields on the form — your business info, tax ID, and the reason for exemption. Sign and date it. Incomplete certificates can't be accepted.
              </p>
            </div>

            {/* STEP 3 */}
            <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "22px 26px", marginBottom: 24 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", color: S.orange, marginBottom: 6 }}>STEP 3</div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: S.slate, marginBottom: 8 }}>Send the completed form back.</h2>
              <p style={{ fontSize: 14, color: S.muted, marginBottom: 14, lineHeight: 1.55 }}>
                Email your signed ST3 to the address below. A direct upload option is coming soon; for now email is the quickest way.
              </p>
              <a href={"mailto:" + request.owner_email + "?subject=Completed%20MN%20Form%20ST3%20-%20" + encodeURIComponent(request.customer_business_name)}
                style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "11px 20px", background: S.slate, color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: "'Figtree', sans-serif" }}>
                ✉ Email to {request.owner_email}
              </a>
            </div>

            <div style={{ padding: "14px 18px", background: S.cream, border: "1px dashed " + S.rule, borderRadius: 10, fontSize: 12, color: S.muted, lineHeight: 1.6, textAlign: "center" }}>
              This link is unique to <strong>{request.customer_business_name}</strong> and expires 30 days from when it was sent. Questions? Reply to the person who sent it.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
