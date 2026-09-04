// Second-factor prompt shown after password login for any user with MFA enrolled.
// App.jsx renders this in place of every protected route until the code verifies.
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { N, N_RGB, FONT_LINK, NeonBox } from "../design/neon";

const inputStyle = { width: "100%", padding: "14px 16px", background: N.white, border: "1.5px solid " + N.rule, borderRadius: 8, color: N.ink, fontSize: 26, letterSpacing: "0.35em", textAlign: "center", fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box" };

export default function MfaChallenge({ onVerified }) {
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const f = (data?.totp || []).find(x => x.status === "verified");
      setFactorId(f?.id || null);
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!factorId || code.length < 6) return;
    setLoading(true); setError(null);
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr) { setError(chErr.message); setLoading(false); return; }
    const { error: vErr } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code: code.trim() });
    if (vErr) { setError("That code didn't match. Codes change every 30 seconds — try the current one."); setCode(""); setLoading(false); return; }
    setLoading(false);
    if (onVerified) onVerified();
  };

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = "/login"; };

  return (
    <div style={{ minHeight: "100vh", background: N.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif", padding: 20 }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src="/cares-works-neon-logo.png" alt="CARES Works" style={{ maxHeight: 120, width: "auto", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,128,255,0.28)" }} />
        </div>
        <NeonBox color={N.blue} rgb={N_RGB.blue} style={{ padding: "32px 28px" }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 6 }}>Two-step check</div>
          <p style={{ fontSize: 14, color: N.muted, marginBottom: 22, lineHeight: 1.5 }}>Open your authenticator app and enter the 6-digit code for CARES Works.</p>
          {error && <div style={{ background: `rgba(${N_RGB.pink},0.08)`, border: `1px solid ${N.red}`, borderRadius: 8, padding: "10px 14px", color: N.red, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{error}</div>}
          <form onSubmit={submit}>
            <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus
              placeholder="000000" style={{ ...inputStyle, marginBottom: 20 }} />
            <button type="submit" disabled={loading || code.length < 6 || !factorId}
              style={{ width: "100%", padding: 14, background: loading || code.length < 6 ? N.rule : N.blue, border: "none", borderRadius: 8, color: loading || code.length < 6 ? N.muted : N.white, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
              {loading ? "Checking..." : "Verify →"}
            </button>
          </form>
        </NeonBox>
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button onClick={signOut} style={{ background: "none", border: "none", fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, cursor: "pointer", letterSpacing: "0.08em" }}>Sign out instead</button>
        </div>
      </div>
    </div>
  );
}
