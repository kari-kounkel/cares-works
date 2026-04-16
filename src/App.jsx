import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const path = window.location.pathname;

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsPasswordReset(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#faf8f4", fontFamily: "'Figtree', sans-serif", color: "#a07060", fontSize: 15 }}>
      Loading...
    </div>
  );

  if (isPasswordReset) return <Login session={session} forceReset={true} />;
  if (path === "/login") return <Login session={session} />;
  if (path === "/dashboard") {
    if (!session) { window.location.href = "/login"; return null; }
    return <Dashboard session={session} />;
  }
  if (window.location.hash.includes("error=access_denied") || window.location.hash.includes("error_code=otp_expired")) {
    window.location.href = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";
    return null;
  }
  return <Landing session={session} />;
}
