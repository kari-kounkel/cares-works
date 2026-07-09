import { navigate } from "../App";
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { N, N_RGB, FONT_LINK, NeonBox } from "../design/neon";

const MOBILE_LOGIN = `
  @media (max-width: 640px) {
    .login-wrap { padding: 16px !important; }
  }
`;

const inputStyle = { width: "100%", padding: "12px 16px", background: N.white, border: "1.5px solid " + N.rule, borderRadius: 8, color: N.ink, fontSize: 15, fontFamily: "'Figtree', sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s, box-shadow 0.15s" };
const focusIn = (color) => (e) => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 3px ${color}22`; };
const focusOut = (e) => { e.target.style.borderColor = N.rule; e.target.style.boxShadow = "none"; };
const labelStyle = { display: "block", color: N.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontFamily: "'DM Mono', monospace", fontWeight: 700 };
const submitBtn = (loading, color) => ({
  width: "100%", padding: 14, background: loading ? N.rule : color, border: "none", borderRadius: 8,
  color: loading ? N.muted : N.white, fontSize: 14, fontWeight: 700,
  cursor: loading ? "default" : "pointer", fontFamily: "'Figtree', sans-serif",
  boxShadow: loading ? "none" : `0 4px 14px ${color}88`,
});

function LoginShell({ children }) {
  return (
    <div className="login-wrap" style={{ minHeight: "100vh", background: N.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif", padding: 20 }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{MOBILE_LOGIN}</style>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <a href="/" style={{ display: "inline-block", textDecoration: "none" }}>
            <img src="/cares-works-neon-logo.png" alt="CARES Works" style={{ maxHeight: 160, width: "auto", maxWidth: "100%", display: "block", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,128,255,0.28)", margin: "0 auto" }} />
          </a>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Login({ session, forceReset = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");
  const [resetSent, setResetSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const handleNewPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    if (err) setError(err.message); else setPasswordUpdated(true);
    setLoading(false);
  };

  if (forceReset) {
    return (
      <LoginShell>
        <NeonBox color={N.blue} rgb={N_RGB.blue} style={{ padding: "36px 32px" }}>
          {passwordUpdated ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 12 }}>Password updated.</div>
              <p style={{ fontSize: 14, color: N.muted, marginBottom: 24 }}>You can now log in with your new password.</p>
              <a href="/login" style={{ display: "inline-block", background: N.blue, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", padding: "12px 28px", borderRadius: 8, textDecoration: "none", fontWeight: 700, boxShadow: `0 4px 14px ${N.blue}88` }}>Go to Login →</a>
            </div>
          ) : (
            <form onSubmit={handleNewPassword}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 6 }}>Set a new password</div>
              <p style={{ fontSize: 13, color: N.muted, marginBottom: 24 }}>Choose something you'll remember.</p>
              {error && <div style={{ background: `rgba(${N_RGB.pink},0.08)`, border: `1px solid ${N.pink}`, borderRadius: 8, padding: "10px 14px", color: N.pink, fontSize: 13, marginBottom: 20, fontWeight: 600 }}>{error}</div>}
              <label style={labelStyle}>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8}
                style={{ ...inputStyle, marginBottom: 24 }} onFocus={focusIn(N.blue)} onBlur={focusOut}
                placeholder="Minimum 8 characters" />
              <button type="submit" disabled={loading} style={submitBtn(loading, N.blue)}>
                {loading ? "Updating..." : "Update Password →"}
              </button>
            </form>
          )}
        </NeonBox>
      </LoginShell>
    );
  }

  if (session) { navigate("/dashboard"); return null; }

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://tools.caresmn.com/login?mode=reset",
    });
    if (err) setError(err.message); else setResetSent(true);
    setLoading(false);
  };

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    if (mode === "login") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message); else navigate("/dashboard");
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) setError(err.message); else setError("Check your email to confirm your account.");
    }
    setLoading(false);
  };

  return (
    <LoginShell>
      <NeonBox color={N.blue} rgb={N_RGB.blue} scale={1.1} style={{ padding: "36px 32px" }}>
        <div style={{ display: "flex", gap: 4, background: N.wall, borderRadius: 8, padding: 4, marginBottom: 28, border: "1px solid " + N.rule }}>
          {["login", "signup", "reset"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "8px 16px", borderRadius: 6, border: "none", background: mode === m ? N.blue : "transparent", color: mode === m ? N.white : N.muted, fontSize: 13, fontWeight: mode === m ? 700 : 500, cursor: "pointer", fontFamily: "'Figtree', sans-serif", boxShadow: mode === m ? `0 3px 10px rgba(0,128,255,0.4)` : "none" }}>
              {m === "login" ? "Log In" : m === "signup" ? "Sign Up" : "Reset"}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: `rgba(${N_RGB.pink},0.08)`, border: `1px solid ${N.pink}`, borderRadius: 8, padding: "10px 14px", color: N.pink, fontSize: 13, marginBottom: 20, fontWeight: 600 }}>{error}</div>
        )}

        {mode === "reset" && resetSent && (
          <div style={{ background: `rgba(${N_RGB.blue},0.08)`, border: `1px solid ${N.blue}`, borderRadius: 8, padding: "14px 16px", color: N.blue, fontSize: 14, marginBottom: 20, lineHeight: 1.5, fontWeight: 600 }}>
            Check your email — a password reset link is on its way.
          </div>
        )}

        {mode === "reset" && !resetSent && (
          <form onSubmit={handleReset}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ ...inputStyle, marginBottom: 20 }} onFocus={focusIn(N.blue)} onBlur={focusOut}
              placeholder="you@email.com" />
            <button type="submit" disabled={loading} style={submitBtn(loading, N.blue)}>
              {loading ? "Sending..." : "Send Reset Link →"}
            </button>
          </form>
        )}

        {mode !== "reset" && (
          <form onSubmit={handle}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
              style={{ ...inputStyle, marginBottom: 16 }} onFocus={focusIn(N.blue)} onBlur={focusOut}
              placeholder="you@email.com" />
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === "login" ? "current-password" : "new-password"}
              style={{ ...inputStyle, marginBottom: 28 }} onFocus={focusIn(N.blue)} onBlur={focusOut}
              placeholder="••••••••" />
            <button type="submit" disabled={loading} style={submitBtn(loading, N.blue)}>
              {loading ? "One moment..." : mode === "login" ? "Log In →" : "Create Account →"}
            </button>
          </form>
        )}
      </NeonBox>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <a href="/" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, textDecoration: "none", letterSpacing: "0.08em" }}>← Back to CARES Works</a>
      </div>

      <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: N.muted, fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
        Not a member yet? <a href="https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06" style={{ color: N.orange, textDecoration: "none", fontWeight: 700 }}>Join for $27/mo →</a>
      </div>
    </LoginShell>
  );
}
