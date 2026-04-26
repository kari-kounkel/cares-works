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
import EmailAttachmentsAdvanced from "./pages/EmailAttachmentsAdvanced";
import BookkeeperScope from "./pages/BookkeeperScope";
import FractionalCFOScope from "./pages/FractionalCFOScope";
import QBODiscovery from "./pages/QBODiscovery";
import ChecklistBuilder from "./pages/ChecklistBuilder";

export function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

const COURT_SLUGS = ["prologue","chapter-1","chapter-2","chapter-3","chapter-4","chapter-5","chapter-6","chapter-7","chapter-8","chapter-9","chapter-10","chapter-11","chapter-12","chapter-13","epilogue"];
const MEMBER_SLUGS = ["net-profit-ratios","quickbooks-triage","chart-of-accounts","iif-import","pricing-metrics","finding-a-cpa","new-hire-30-days","separation-script","advisory-team","buying-time-scripts","post-meeting-debrief","meeting-planning","busyness-audit","inhouse-vs-contract","founders-series-1"];

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setIsPasswordReset(true);
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => { subscription.unsubscribe(); window.removeEventListener("popstate", onPop); };
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#faf8f4", fontFamily: "'Figtree', sans-serif", color: "#a07060", fontSize: 15 }}>Loading...</div>
  );

  if (isPasswordReset) return <Login session={session} forceReset={true} />;

  if (window.location.hash.includes("error=access_denied") || window.location.hash.includes("error_code=otp_expired")) {
    window.location.href = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";
    return null;
  }

  if (path === "/login") return <Login session={session} />;

  if (path === "/dashboard") {
    if (!session) { navigate("/login"); return null; }
    return <Dashboard session={session} />;
  }

  if (path.startsWith("/court/")) {
    if (!session) { navigate("/login"); return null; }
    const slug = path.replace("/court/", "");
    if (COURT_SLUGS.includes(slug)) return <CourtChapter slug={slug} />;
  }

  if (path === "/tools/payroll-checklist") return <PayrollChecklist session={session} />;
  if (path === "/tools/client-visit-summary") return <ClientVisitSummary />;
  if (path === "/tools/communication-templates") return <CommunicationTemplates />;
  if (path === "/tools/email-attachments") return <EmailAttachmentTutorial />;
  if (path === "/tools/email-attachments-advanced") return <EmailAttachmentsAdvanced session={session} />;
  if (path === "/tools/bookkeeper-scope") return <BookkeeperScope session={session} />;
  if (path === "/tools/fractional-cfo-scope") return <FractionalCFOScope session={session} />;
  if (path === "/tools/qbo-discovery") return <QBODiscovery />;
  if (path === "/tools/checklist-builder") return <ChecklistBuilder />;

  if (path.startsWith("/tools/")) {
    const slug = path.replace("/tools/", "");
    if (MEMBER_SLUGS.includes(slug)) {
      if (!session) { navigate("/login"); return null; }
      return (
        <div style={{ minHeight: "100vh", background: "#faf8f4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif", padding: 24 }}>
          <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#e8773a", marginBottom: 12 }}>Coming Soon</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#3d4560", marginBottom: 12 }}>This tool is being built.</div>
            <p style={{ fontSize: 15, color: "#7a7585", marginBottom: 28, lineHeight: 1.6 }}>It will be in your library when it drops. Check back soon.</p>
            <button onClick={() => navigate("/dashboard")} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#e8773a", letterSpacing: "0.1em", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Back to dashboard</button>
          </div>
        </div>
      );
    }
  }

  return <Landing session={session} />;
}
