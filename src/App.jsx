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
import VendorDecoder from "./pages/VendorDecoder";
import ChecklistBuilder from "./pages/ChecklistBuilder";
// Batch wired in — Money, People, Client Work, Leadership tools
import NetProfitRatios from "./pages/NetProfitRatios";
import QuickbooksTriage from "./pages/QuickbooksTriage";
import PricingMetrics from "./pages/PricingMetrics";
import FindingACPA from "./pages/FindingACPA";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import IIFImport from "./pages/IIFImport";
import NewHire30Days from "./pages/NewHire30Days";
import SeparationScript from "./pages/SeparationScript";
import AdvisoryTeam from "./pages/AdvisoryTeam";
import InHouseVsContract from "./pages/InHouseVsContract";
import BuyingTimeScripts from "./pages/BuyingTimeScripts";
import PostMeetingDebrief from "./pages/PostMeetingDebrief";
import MeetingPlanning from "./pages/MeetingPlanning";
import BusynessAudit from "./pages/BusynessAudit";
import AchForm from "./pages/AchForm";
import PayrollCalculator from "./pages/PayrollCalculator";
import Ledger from "./pages/Ledger";
import KariCockpits from "./pages/KariCockpits";
import KariOneList from "./pages/KariOneList";
import KariCockpitFrame from "./pages/KariCockpitFrame";
import { FRAME_COCKPITS, CLOUD_COCKPITS } from "./cockpits/registry";

export function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

const COURT_SLUGS = ["prologue","chapter-1","chapter-2","chapter-3","chapter-4","chapter-5","chapter-6","chapter-7","chapter-8","chapter-9","chapter-10","chapter-11","chapter-12","chapter-13","epilogue"];
// Tools still showing "Coming Soon" placeholder — remove from this array as each one ships
const MEMBER_SLUGS = ["founders-series-1"];

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [path, setPath] = useState(window.location.pathname);
  const [memberStatus, setMemberStatus] = useState(null); // null = checking, "member" = subscriber, "none" = no membership

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setIsPasswordReset(true);
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => { subscription.unsubscribe(); window.removeEventListener("popstate", onPop); };
  }, []);

  // Check member status whenever session changes — used to redirect subscribers from landing page to dashboard
  useEffect(() => {
    if (!session?.user?.email) { setMemberStatus(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("members")
        .select("email")
        .eq("email", session.user.email)
        .maybeSingle();
      if (!cancelled) setMemberStatus(data ? "member" : "none");
    })();
    return () => { cancelled = true; };
  }, [session?.user?.email]);

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

  // Kari's private cockpit hub
  if (path === "/kari") {
    if (!session) { navigate("/login"); return null; }
    return <KariCockpits session={session} />;
  }
  if (path === "/kari/the-one-list") {
    if (!session) { navigate("/login"); return null; }
    return <KariOneList session={session} />;
  }
  if (path.startsWith("/kari/")) {
    const slug = path.slice("/kari/".length);
    const cfg = FRAME_COCKPITS[slug];
    if (cfg) {
      if (!session) { navigate("/login"); return null; }
      return <KariCockpitFrame session={session} {...cfg} />;
    }
    const cloud = CLOUD_COCKPITS[slug];
    if (cloud) {
      if (!session) { navigate("/login"); return null; }
      return <KariCockpitFrame session={session} slug={slug} title={cloud.title} />;
    }
  }

  if (path.startsWith("/court/")) {
    if (!session) { navigate("/login"); return null; }
    const slug = path.replace("/court/", "");
    if (COURT_SLUGS.includes(slug)) return <CourtChapter slug={slug} />;
  }

  // Existing tool routes
  if (path === "/tools/payroll-checklist") return <PayrollChecklist session={session} />;
  if (path === "/tools/client-visit-summary") return <ClientVisitSummary />;
  if (path === "/tools/communication-templates") return <CommunicationTemplates />;
  if (path === "/tools/email-attachments") return <EmailAttachmentTutorial />;
  if (path === "/tools/email-attachments-advanced") return <EmailAttachmentsAdvanced session={session} />;
  if (path === "/tools/bookkeeper-scope") return <BookkeeperScope session={session} />;
  if (path === "/tools/fractional-cfo-scope") return <FractionalCFOScope session={session} />;
  if (path === "/tools/qbo-discovery") return <QBODiscovery />;
  if (path === "/tools/vendor-decoder") return <VendorDecoder />;
  if (path === "/tools/checklist-builder") return <ChecklistBuilder session={session} />;

  // Batch wired in — Money
  if (path === "/tools/net-profit-ratios") return <NetProfitRatios session={session} />;
  if (path === "/tools/quickbooks-triage") return <QuickbooksTriage session={session} />;
  if (path === "/tools/pricing-metrics") return <PricingMetrics session={session} />;
  if (path === "/tools/finding-a-cpa") return <FindingACPA session={session} />;
  if (path === "/tools/chart-of-accounts") return <ChartOfAccounts session={session} />;
  if (path === "/tools/iif-import") return <IIFImport session={session} />;

  // Batch wired in — People
  if (path === "/tools/new-hire-30-days") return <NewHire30Days session={session} />;
  if (path === "/tools/separation-script") return <SeparationScript session={session} />;

  // Batch wired in — Client Work
  if (path === "/tools/buying-time-scripts") return <BuyingTimeScripts session={session} />;
  if (path === "/tools/post-meeting-debrief") return <PostMeetingDebrief session={session} />;

  // Batch wired in — Leadership
  if (path === "/tools/advisory-team") return <AdvisoryTeam session={session} />;
  if (path === "/tools/inhouse-vs-contract") return <InHouseVsContract session={session} />;
  if (path === "/tools/meeting-planning") return <MeetingPlanning session={session} />;
  if (path === "/tools/busyness-audit") return <BusynessAudit session={session} />;
  if (path === "/tools/ach-form") return <AchForm />;
  if (path === "/tools/payroll-calculator") return <PayrollCalculator session={session} />;
  if (path === "/tools/ledger") {
    if (!session) { navigate("/login"); return null; }
    return <Ledger session={session} />;
  }

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

  // Landing fallback — auto-redirect subscribers to /dashboard.
  // Escape hatch: ?public=1 lets subscribers preview/share the public landing page.
  const params = new URLSearchParams(window.location.search);
  const isPublicView = params.get("public") === "1";

  if (session && !isPublicView) {
    if (memberStatus === null) {
      // Brief loader while we check the members table — prevents flash of landing before redirect
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#faf8f4", fontFamily: "'Figtree', sans-serif", color: "#a07060", fontSize: 15 }}>Loading...</div>
      );
    }
    if (memberStatus === "member") {
      navigate("/dashboard");
      return null;
    }
  }

  return <Landing session={session} />;
}
