import { useState } from "react";
import { supabase } from "../supabaseClient";

const S = {
  slate: "#3d4560",
  orange: "#e8773a",
  orangeDark: "#c95f22",
  orangeLight: "#fdf0e8",
  paper: "#faf8f4",
  ink: "#1e1e2a",
  rule: "#ddd8cc",
  muted: "#7a7585",
  border: "#e8cfc0",
};

export default function Login({ session }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");

  if (session) { window.location.href = "/dashboard"; return null; }

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (mode === "login") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
      else window.location.href = "/dashboard";
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) setError(err.message);
      else setError("Check your email to confirm your account.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: S.paper, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif", padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <a href="/" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: S.ink, textDecoration: "none" }}>
            CARES <span style={{ color: S.orange }}>Works.</span>
          </a>
          <div style={{ fontSize: 13, color: S.muted, marginTop: 6, fontStyle: "italic", fontFamily: "'DM Serif Display', serif" }}>Member access</div>
        </div>

        <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 16, padding: "36px 32px", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", gap: 4, background: S.paper, borderRadius: 8, padding: 4, marginBottom: 28 }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "8px 16px", borderRadius: 6, border: "none", background: mode === m ? "#fff" : "transparent", color: mode === m ? S.ink : S.muted, fontSize: 13, fontWeight: mode === m ? 700 : 400, cursor: "pointer", fontFamily: "'Figtree', sans-serif", boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background: "#fff8f0", border: "1px solid " + S.border, borderRadius: 8, padding: "10px 14px", color: S.orange, fontSize: 13, marginBottom: 20 }}>{error}</div>
          )}

          <form onSubmit={handle}>
            <label style={{ display: "block", color: S.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
              style={{ width: "100%", padding: "12px 16px", background: S.paper, border: "1px solid " + S.rule, borderRadius: 8, color: S.ink, fontSize: 15, fontFamily: "'Figtree', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: 16 }}
              placeholder="you@email.com" />
            <label style={{ display: "block", color: S.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === "login" ? "current-password" : "new-password"}
              style={{ width: "100%", padding: "12px 16px", background: S.paper, border: "1px solid " + S.rule, borderRadius: 8, color: S.ink, fontSize: 15, fontFamily: "'Figtree', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: 28 }}
              placeholder="••••••••" />
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: 14, background: loading ? S.rule : S.orange, border: "none", borderRadius: 8, color: loading ? S.muted : "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "'Figtree', sans-serif", transition: "all 0.2s" }}>
              {loading ? "One moment..." : mode === "login" ? "Log In →" : "Create Account →"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <a href="/" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.muted, textDecoration: "none", letterSpacing: "0.08em" }}>← Back to CARES Works</a>
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: S.muted, fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
          Not a member yet? <a href="https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06" style={{ color: S.orange, textDecoration: "none", fontWeight: 700 }}>Join for $27/mo →</a>
        </div>
      </div>
    </div>
  );
}
