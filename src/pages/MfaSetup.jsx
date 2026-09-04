// /account/security — enroll an authenticator app (TOTP), or remove it.
// Reached directly, or bounced here from connectPlaid() when MFA isn't set up yet.
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";
import { N, N_RGB, FONT_LINK, NeonBox } from "../design/neon";
import { getMfaState, cleanupUnverifiedFactors } from "../lib/mfa";

const mono = { fontFamily: "'DM Mono', monospace" };
const btn = (color, disabled) => ({ padding: "12px 22px", background: disabled ? N.rule : color, border: "none", borderRadius: 8, color: disabled ? N.muted : N.white, fontSize: 14, fontWeight: 700, cursor: disabled ? "default" : "pointer", fontFamily: "'Figtree', sans-serif" });
const codeInput = { width: "100%", padding: "12px 16px", border: "1.5px solid " + N.rule, borderRadius: 8, fontSize: 24, letterSpacing: "0.35em", textAlign: "center", ...mono, boxSizing: "border-box", outline: "none" };

export default function MfaSetup({ session }) {
  const next = new URLSearchParams(window.location.search).get("next") || "/dashboard";
  const [state, setState] = useState(null);       // from getMfaState
  const [enroll, setEnroll] = useState(null);     // { factorId, qr, secret }
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { if (!session) { navigate("/login"); return; } getMfaState().then(setState); }, [session]);

  const startEnroll = async () => {
    setBusy(true); setError(null);
    await cleanupUnverifiedFactors();
    const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator app", issuer: "CARES Works" });
    if (err) { setError(err.message); setBusy(false); return; }
    setEnroll({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    setBusy(false);
  };

  const confirmEnroll = async (e) => {
    e.preventDefault();
    if (!enroll || code.length < 6) return;
    setBusy(true); setError(null);
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId: enroll.factorId });
    if (chErr) { setError(chErr.message); setBusy(false); return; }
    const { error: vErr } = await supabase.auth.mfa.verify({ factorId: enroll.factorId, challengeId: ch.id, code: code.trim() });
    if (vErr) { setError("That code didn't match. Wait for a fresh code and try again."); setCode(""); setBusy(false); return; }
    setDone(true); setBusy(false);
    setState(await getMfaState());
  };

  const remove = async () => {
    if (!state?.factorId) return;
    if (!window.confirm("Remove the authenticator app from this account? You'll need to set it up again before connecting a bank.")) return;
    setBusy(true);
    const { error: err } = await supabase.auth.mfa.unenroll({ factorId: state.factorId });
    if (err) setError(err.message);
    setEnroll(null); setDone(false);
    setState(await getMfaState()); setBusy(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: N.white, fontFamily: "'Figtree', sans-serif", padding: "40px 20px" }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ marginBottom: 18 }}>
          <a href={next} style={{ ...mono, fontSize: 11, color: N.muted, textDecoration: "none", letterSpacing: "0.08em" }}>← Back</a>
        </div>
        <NeonBox color={N.blue} rgb={N_RGB.blue} style={{ padding: "32px 28px" }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: N.ink, marginBottom: 6 }}>Two-step login</div>
          <p style={{ fontSize: 14, color: N.muted, lineHeight: 1.55, marginBottom: 22 }}>
            A second check from an authenticator app (Google Authenticator, Microsoft Authenticator, Authy, 1Password…) on top of your password. Required before connecting a bank or card.
          </p>

          {error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid " + N.red, borderRadius: 8, padding: "10px 14px", color: N.red, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{error}</div>}

          {state === null && <div style={{ color: N.muted, fontSize: 14 }}>Checking…</div>}

          {state && state.enrolled && !done && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: N.green, display: "inline-block" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: N.ink }}>Authenticator app is on for {session?.user?.email}</span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => navigate(next)} style={btn(N.blue, false)}>Continue →</button>
                <button onClick={remove} disabled={busy} style={{ ...btn(N.white, false), color: N.red, border: "1.5px solid " + N.rule }}>Remove authenticator</button>
              </div>
            </div>
          )}

          {done && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: N.ink, marginBottom: 8 }}>You're set.</div>
              <p style={{ fontSize: 14, color: N.muted, marginBottom: 18 }}>From now on, logging in asks for a code from your app.</p>
              <button onClick={() => navigate(next)} style={btn(N.blue, false)}>Continue →</button>
            </div>
          )}

          {state && !state.enrolled && !enroll && !done && (
            <button onClick={startEnroll} disabled={busy} style={btn(N.blue, busy)}>{busy ? "One moment…" : "Set up authenticator app →"}</button>
          )}

          {enroll && !done && (
            <form onSubmit={confirmEnroll}>
              <ol style={{ paddingLeft: 20, fontSize: 14, color: N.text, lineHeight: 1.6, marginBottom: 16 }}>
                <li>Open your authenticator app and choose <b>Add / scan QR code</b>.</li>
                <li>Scan this code:</li>
              </ol>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <img src={enroll.qr} alt="Scan with your authenticator app" style={{ width: 200, height: 200, border: "1px solid " + N.rule, borderRadius: 8 }} />
              </div>
              <details style={{ marginBottom: 18, fontSize: 12, color: N.muted }}>
                <summary style={{ cursor: "pointer" }}>Can't scan? Enter the key by hand</summary>
                <code style={{ ...mono, display: "block", marginTop: 8, padding: 10, background: "#f8fafc", borderRadius: 6, wordBreak: "break-all", fontSize: 13, color: N.ink }}>{enroll.secret}</code>
              </details>
              <ol start="3" style={{ paddingLeft: 20, fontSize: 14, color: N.text, lineHeight: 1.6, marginBottom: 12 }}>
                <li>Type the 6-digit code the app shows:</li>
              </ol>
              <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" style={{ ...codeInput, marginBottom: 16 }} />
              <button type="submit" disabled={busy || code.length < 6} style={btn(N.blue, busy || code.length < 6)}>{busy ? "Checking…" : "Turn on two-step login →"}</button>
            </form>
          )}
        </NeonBox>
        <p style={{ ...mono, fontSize: 11, color: N.mutedLite, marginTop: 16, textAlign: "center", letterSpacing: "0.05em" }}>CARES Access Control Policy §6</p>
      </div>
    </div>
  );
}
