import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CourtChapter from "./pages/CourtChapter";
import PayrollChecklist from "./pages/PayrollChecklist";
import ClientVisitSummary from "./pages/ClientVisitSummary";
import CommunicationTemplates from "./pages/CommunicationTemplates";
import EmailAttachmentTutorial from "./pages/EmailAttachmentTutorial";

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

  if (window.location.hash.includes("error=access_denied") || window.location.hash.includes("error_code=otp_expired")) {
    window.location.href = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";
    return null;
  }

  // ── AUTH ROUTES ────────────────────────────────────────────
  if (path === "/login") return <Login session={session} />;

  if (path === "/dashboard") {
    if (!session) { window.location.href = "/login"; return null; }
    return <Dashboard session={session} />;
  }

  // ── COURT OF ACCOUNTS ─────────────────────────────────────
  const courtSlugs = ["prologue", "chapter-1", "chapter-2", "chapter-3", "chapter-4", "chapter-5", "chapter-6", "chapter-7", "chapter-8", "chapter-9", "chapter-10", "chapter-11", "chapter-12", "chapter-13", "epilogue"];
  if (path.startsWith("/court/")) {
    if (!session) { window.location.href = "/login"; return null; }
    const slug = path.replace("/court/", "");
    if (courtSlugs.includes(slug)) return <CourtChapter slug={slug} />;
  }

  // ── PUBLIC TOOL ROUTES ────────────────────────────────────
  if (path === "/tools/payroll-checklist") return <PayrollChecklist />;
  if (path === "/tools/client-visit-summary") return <ClientVisitSummary />;
  if (path === "/tools/communication-templates") return <CommunicationTemplates />;
  if (path === "/tools/email-attachments") return <EmailAttachmentTutorial />;

  // ── MEMBER TOOL ROUTES ────────────────────────────────────
  // These require a session — redirect to login if not authed
  const memberToolSlugs = [
    "net-profit-ratios", "quickbooks-triage", "chart-of-accounts", "iif-import",
    "pricing-metrics", "finding-a-cpa", "new-hire-30-days", "separation-script",
    "advisory-team", "buying-time-scripts", "post-meeting-debrief",
    "meeting-planning", "busyness-audit", "inhouse-vs-contract", "founders-series-1",
  ];
  if (path.startsWith("/tools/")) {
    const slug = path.replace("/tools/", "");
    if (memberToolSlugs.includes(slug)) {
      if (!session) { window.location.href = "/login"; return null; }
      // Placeholder until each tool page is built
      return (
        <div style={{ minHeight: "100vh", background: "#faf8f4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif" }}>
          <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <div style={{ textAlign: "center", maxWidth: 480, padding: 24 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#e8773a", marginBottom: 12 }}>Coming Soon</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#3d4560", marginBottom: 12 }}>This tool is being built.</div>
            <p style={{ fontSize: 15, color: "#7a7585", marginBottom: 28, lineHeight: 1.6 }}>It will be in your library when it drops. Check back soon.</p>
            <a href="/dashboard" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#e8773a", letterSpacing: "0.1em", textDecoration: "none" }}>{"<- Back to dashboard"}</a>
          </div>
        </div>
      );
    }
  }

  // ── DEFAULT ───────────────────────────────────────────────
  return <Landing session={session} />;
}
