import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import MfaChallenge from "./pages/MfaChallenge";
import MfaSetup from "./pages/MfaSetup";
import { getMfaState, isTrustedDevice } from "./lib/mfa";
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
import ExemptionTracker from "./pages/ExemptionTracker";
import ExemptSubmit from "./pages/ExemptSubmit";
import PalettePreview from "./pages/PalettePreview";
import PalettePreviewDark from "./pages/PalettePreviewDark";
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
import MemeMaker from "./pages/MemeMaker";
import KariCockpits from "./pages/KariCockpits";
import KariOneList from "./pages/KariOneList";
import KariCockpitFrame from "./pages/KariCockpitFrame";
import BudgetBuilder from "./pages/BudgetBuilder";
import Pricing from "./pages/Pricing";
import NonprofitSeries from "./pages/NonprofitSeries";
import OrgHome from "./pages/OrgHome";
import PublicRent from "./pages/PublicRent";
import ProposalsIndex from "./pages/ProposalsIndex";
import ProposalView from "./pages/ProposalView";
import ProposalPublic from "./pages/ProposalPublic";
import COALibrary from "./pages/COALibrary";
import ToolsIndex from "./pages/ToolsIndex";
import CourtOfAccountsHome from "./pages/CourtOfAccountsHome";
import LedgerWorkspace from "./pages/LedgerWorkspace";
import EmersonWorkspace from "./pages/EmersonWorkspace";
import InvoicePublic from "./pages/InvoicePublic";
import { FRAME_COCKPITS, CLOUD_COCKPITS } from "./cockpits/registry";

export function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// Orgs whose workspace is a ledger door rather than an /org/:slug shell. Matt Emerson
// runs a for-profit AND a nonprofit; membership in either lands on the one shared door.
// Keyed by the first word of the org name — the same thing primaryOrg is derived from.
const ORG_HOME = { emerson: "/emerson", social: "/emerson" };

const COURT_SLUGS = ["prologue","chapter-1","chapter-2","chapter-3","chapter-4","chapter-5","chapter-6","chapter-7","chapter-8","chapter-9","chapter-10","chapter-11","chapter-12","chapter-13","epilogue"];
const MEMBER_SLUGS = ["founders-series-1"];

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [path, setPath] = useState(window.location.pathname);
  const [memberStatus, setMemberStatus] = useState(null);
  const [primaryOrg, setPrimaryOrg] = useState(undefined); // undefined = not yet checked, null = no org, string = slug
  const [mfa, setMfa] = useState(undefined); // undefined = not yet checked; { enrolled, verified, needsChallenge }

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setIsPasswordReset(true);
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => { subscription.unsubscribe(); window.removeEventListener("popstate", onPop); };
  }, []);

  useEffect(() => {
    if (!session?.user?.email) { setMemberStatus(null); setPrimaryOrg(undefined); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("members")
        .select("email")
        .eq("email", session.user.email)
        .maybeSingle();
      if (!cancelled) setMemberStatus(data ? "member" : "none");

      // Check for a client-workspace membership — routes those users straight to their
      // workspace (e.g. ProGraphics) instead of the paid member dashboard or the paywall.
      const { data: mem } = await supabase
        .from("ledger_org_members")
        .select("ledger_orgs(name)")
        .ilike("member_email", session.user.email)
        .limit(1)
        .maybeSingle();
      const orgName = mem?.ledger_orgs?.name || "";
      if (!cancelled) setPrimaryOrg(orgName ? orgName.toLowerCase().split(" ")[0] : null);
    })();
    return () => { cancelled = true; };
  }, [session?.user?.email]);

  // MFA (Access Control Policy §6): anyone with an authenticator enrolled must pass the
  // second step every session before any protected route renders.
  useEffect(() => {
    if (!session) { setMfa(undefined); return; }
    let cancelled = false;
    getMfaState().then(st => { if (!cancelled) setMfa(st); }).catch(() => { if (!cancelled) setMfa({ enrolled: false, verified: false, needsChallenge: false }); });
    return () => { cancelled = true; };
  }, [session?.user?.id, session?.access_token]);

  // Public, no-login customer invoice view: /i/<token>. Must be reachable before any auth gate.
  if (path.startsWith("/i/")) return <InvoicePublic token={path.slice(3).replace(/\/$/, "")} />;

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", fontFamily: "'Figtree', sans-serif", color: "#64748b", fontSize: 15 }}>Loading...</div>
  );

  if (isPasswordReset) return <Login session={session} forceReset={true} />;

  if (window.location.hash.includes("error=access_denied") || window.location.hash.includes("error_code=otp_expired")) {
    window.location.href = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";
    return null;
  }

  if (path === "/login") return <Login session={session} />;

  // Second-factor gate. Public routes above this line stay public.
  if (session && mfa === undefined) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", fontFamily: "'Figtree', sans-serif", color: "#64748b", fontSize: 15 }}>Loading...</div>;
  }
  if (session && mfa?.needsChallenge && !isTrustedDevice()) {
    return <MfaChallenge onVerified={() => getMfaState().then(setMfa)} />;
  }
  if (path === "/account/security") {
    if (!session) { navigate("/login"); return null; }
    return <MfaSetup session={session} />;
  }

  if (path === "/dashboard") {
    if (!session) { navigate("/login"); return null; }
    if (memberStatus === null || primaryOrg === undefined) {
      return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", fontFamily: "'Figtree', sans-serif", color: "#64748b", fontSize: 15 }}>Loading...</div>;
    }
    // Client-workspace users (not paid members) never see the tool library or paywall —
    // send them to their workspace instead.
    if (memberStatus !== "member" && primaryOrg) { navigate(ORG_HOME[primaryOrg] || "/" + primaryOrg); return null; }
    return <Dashboard session={session} />;
  }

  // Org workspace routes — every /org/:slug hits OrgHome. RLS decides whether the user can see it.
  if (path.startsWith("/org/")) {
    if (!session) { navigate("/login"); return null; }
    const slug = path.replace("/org/", "").replace(/\/$/, "");
    return <OrgHome slug={slug} session={session} />;
  }

  // Public rent page — anyone can visit, no login required
  if (path.startsWith("/rent/")) {
    return <PublicRent />;
  }

  // Public proposal view for clients — no login. /p/:token
  if (path.startsWith("/p/")) {
    const token = path.replace("/p/", "").replace(/\/$/, "");
    return <ProposalPublic token={token} />;
  }

  // Kari's proposals hub (owner-only)
  if (path === "/proposals" || path === "/proposals/") {
    if (!session) { navigate("/login"); return null; }
    return <ProposalsIndex session={session} />;
  }
  if (path.startsWith("/proposals/")) {
    if (!session) { navigate("/login"); return null; }
    const slug = path.replace("/proposals/", "").replace(/\/$/, "");
    return <ProposalView slug={slug} session={session} />;
  }

  // If a member has a primary org set, root URL takes them straight to their org workspace.
  // (They can still click "CARES Works →" in the header to reach the generic library.)
  if (path === "/" && session && primaryOrg) {
    navigate(ORG_HOME[primaryOrg] || "/org/" + primaryOrg);
    return null;
  }

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

  // Each published book gets its own subdomain — ladybug.karikounkel.com is the
  // pattern. Court of Accounts lives at accounts.karikounkel.com. It shares this
  // app rather than getting its own repo, because unlike Ladybug (whose kit is a
  // PDF) this book's companion material IS the tool library below, in Supabase.
  // So on that host the root is the book, not the CARES Works landing page.
  const isCourtHost = typeof window !== "undefined" && window.location.hostname.startsWith("accounts.");
  if (path === "/court-of-accounts" || path === "/court-of-accounts/" || (isCourtHost && path === "/")) {
    return <CourtOfAccountsHome session={session} />;
  }

  // Public index of every published tool. The barcode printed in Court of
  // Accounts points here (accounts.karikounkel.com/tools), so this route must
  // never require a login — a reader with the book in hand has no account.
  if (path === "/tools" || path === "/tools/") return <ToolsIndex session={session} />;
  if (path === "/tools/coa-library") return <COALibrary session={session} />;
  if (path === "/tools/payroll-checklist") return <PayrollChecklist session={session} />;
  if (path === "/tools/client-visit-summary") return <ClientVisitSummary />;
  if (path === "/tools/communication-templates") return <CommunicationTemplates />;
  if (path === "/tools/email-attachments") return <EmailAttachmentTutorial />;
  if (path === "/tools/email-attachments-advanced") return <EmailAttachmentsAdvanced session={session} />;
  if (path === "/tools/bookkeeper-scope") return <BookkeeperScope session={session} />;
  if (path === "/tools/fractional-cfo-scope") return <FractionalCFOScope session={session} />;
  if (path === "/tools/qbo-discovery") return <QBODiscovery />;
  if (path === "/tools/vendor-decoder") return <VendorDecoder />;
  if (path === "/tools/budget-builder") return <BudgetBuilder />;
  if (path === "/tools/checklist-builder") return <ChecklistBuilder session={session} />;
  if (path === "/tools/exemption-tracker") {
    if (!session) { navigate("/login"); return null; }
    return <ExemptionTracker session={session} />;
  }
  // Public customer-facing certificate submission (no auth — token in URL is the auth).
  if (path.startsWith("/exempt/")) return <ExemptSubmit />;
  // Public palette preview (no auth) — Kari's vibe-check before we rebrand.
  if (path === "/preview/neon") return <PalettePreview />;
  if (path === "/preview/neon-dark") return <PalettePreviewDark />;
  // ProGraphics ledger preview — public (no login) so it renders on sample data.
  // Component is entity-driven; this route just seeds it with SAMPLE_ENTITY.
  if (path === "/prographics" || path === "/preview/prographics") {
    if (!session) { navigate("/login"); return null; }
    return <LedgerWorkspace entityKey="prographics" session={session} />;
  }
  // Matt Emerson — one door, two sets of books (for-profit + 501(c)(3)).
  // The shell picks the org; LedgerWorkspace is the same machine underneath.
  if (path === "/emerson" || path === "/emerson/") {
    if (!session) { navigate("/login"); return null; }
    return <EmersonWorkspace session={session} />;
  }
  // Multi-tenant: /ledger/:key resolves to an entity in the registry (prographics, amy, matt, …). Login required.
  if (path.startsWith("/ledger/")) {
    if (!session) { navigate("/login"); return null; }
    return <LedgerWorkspace entityKey={path.replace("/ledger/", "").replace(/\/$/, "")} session={session} />;
  }
  if (path === "/pricing") return <Pricing />;
  if (path === "/series/nonprofit" || path === "/series/nonprofits") return <NonprofitSeries />;
  if (path === "/tools/net-profit-ratios") return <NetProfitRatios session={session} />;
  if (path === "/tools/quickbooks-triage") return <QuickbooksTriage session={session} />;
  if (path === "/tools/pricing-metrics") return <PricingMetrics session={session} />;
  if (path === "/tools/finding-a-cpa") return <FindingACPA session={session} />;
  if (path === "/tools/chart-of-accounts") return <ChartOfAccounts session={session} />;
  if (path === "/tools/iif-import") return <IIFImport session={session} />;
  if (path === "/tools/new-hire-30-days") return <NewHire30Days session={session} />;
  if (path === "/tools/separation-script") return <SeparationScript session={session} />;
  if (path === "/tools/buying-time-scripts") return <BuyingTimeScripts session={session} />;
  if (path === "/tools/post-meeting-debrief") return <PostMeetingDebrief session={session} />;
  if (path === "/tools/advisory-team") return <AdvisoryTeam session={session} />;
  if (path === "/tools/inhouse-vs-contract") return <InHouseVsContract session={session} />;
  if (path === "/tools/meeting-planning") return <MeetingPlanning session={session} />;
  if (path === "/tools/busyness-audit") return <BusynessAudit session={session} />;
  if (path === "/tools/ach-form") return <AchForm />;
  if (path === "/tools/payroll-calculator") return <PayrollCalculator session={session} />;
  if (path === "/tools/america-250-meme-maker") return <MemeMaker session={session} />;
  if (path === "/tools/ledger") {
    if (!session) { navigate("/login"); return null; }
    return <Ledger session={session} />;
  }
  // Marbleverse Pro — same jar as the free public tool, but cloud-synced to the
  // member's account via KariCockpitFrame (kari_tool_data, tool_key "marbleverse").
  if (path === "/tools/marbleverse") {
    if (!session) { navigate("/login"); return null; }
    return <KariCockpitFrame session={session} {...FRAME_COCKPITS["marbleverse"]} />;
  }

  if (path.startsWith("/tools/")) {
    const slug = path.replace("/tools/", "");
    if (MEMBER_SLUGS.includes(slug)) {
      if (!session) { navigate("/login"); return null; }
      return (
        <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif", padding: 24 }}>
          <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#0080ff", marginBottom: 12 }}>Coming Soon</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#0a0a14", marginBottom: 12 }}>This tool is being built.</div>
            <p style={{ fontSize: 15, color: "#7a7585", marginBottom: 28, lineHeight: 1.6 }}>It will be in your library when it drops. Check back soon.</p>
            <button onClick={() => navigate("/dashboard")} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#0080ff", letterSpacing: "0.1em", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Back to dashboard</button>
          </div>
        </div>
      );
    }
  }

  const params = new URLSearchParams(window.location.search);
  const isPublicView = params.get("public") === "1";

  if (session && !isPublicView) {
    if (memberStatus === null || primaryOrg === undefined) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", fontFamily: "'Figtree', sans-serif", color: "#64748b", fontSize: 15 }}>Loading...</div>
      );
    }
    if (memberStatus === "member") {
      navigate("/dashboard");
      return null;
    }
    // Non-member who belongs to a client workspace → drop them into it, not the marketing page.
    if (primaryOrg) {
      navigate(ORG_HOME[primaryOrg] || "/" + primaryOrg);
      return null;
    }
  }

  return <Landing session={session} />;
}
