import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";

const MOBILE_DASH = `
  @media (max-width: 640px) {
    .dash-header { padding: 0 16px !important; height: auto !important; min-height: 58px; flex-wrap: wrap; gap: 8px; padding-top: 10px !important; padding-bottom: 10px !important; }
    .dash-header-tabs { gap: 1px !important; }
    .dash-header-tabs button { padding: 5px 8px !important; font-size: 10px !important; }
    .dash-header-right { gap: 8px !important; }
    .dash-page { padding: 24px 16px 60px !important; }
    .dash-h1 { font-size: 24px !important; }
    .dash-cat-tabs { gap: 6px !important; }
    .dash-cat-tabs button { padding: 6px 14px !important; font-size: 12px !important; }
    .dash-tools-grid { grid-template-columns: 1fr !important; }
    .dash-account-row { flex-direction: column !important; gap: 16px !important; }
    .dash-upgrade { flex-direction: column !important; }
    .dash-membership-block { padding: 28px 20px !important; }
  }
`;

const S = {
  slate: "#3d4560",
  orange: "#e8773a",
  orangeDark: "#c95f22",
  orangeLight: "#fdf0e8",
  paper: "#faf8f4",
  cream: "#f2ede3",
  ink: "#1e1e2a",
  rule: "#ddd8cc",
  muted: "#7a7585",
  gold: "#C9A84C",
  grad: "linear-gradient(135deg, #e8773a, #c95f22)",
};

const TOOLS = {
  money: [
    { icon: "📊", title: "Net Profit Ratios + What's Your Number", slug: "net-profit-ratios", desc: "The worksheet that shows you what revenue actually needs to be — starting from what you need to take home.", tag: "NEW" },
    { icon: "✅", title: "The Payroll Checklist Nobody Gave You", slug: "payroll-checklist", desc: "Pay period, quarterly, annual, and 1099 — three checklists in one. Each tracks independently.", tag: "FREE" },
    { icon: "📥", title: "Stop Drowning in Email Attachments", slug: "email-attachments", desc: "The Python script that pulls every invoice and vendor doc out of your inbox — sorted, named, waiting for you every morning.", tag: "FREE" },
    { icon: "📗", title: "Year-End QuickBooks Triage", slug: "quickbooks-triage", desc: "8 diagnostic zones. Find the fires, name the fires, put out the ones that matter. Full version." },
    { icon: "📈", title: "Chart of Accounts Cheat Sheet", slug: "chart-of-accounts", desc: "The categories you actually need, the ones you don't, and why your P&L is lying to you." },
    { icon: "📥", title: "QuickBooks IIF Import — The Right Way", slug: "iif-import", desc: "Stop manually entering transactions. Build and import IIF files without losing your mind." },
    { icon: "💰", title: "Pricing Metrics Framework", slug: "pricing-metrics", desc: "Cost of goods, labor burden, overhead allocation, margin vs markup. The math people are too embarrassed to ask about." },
    { icon: "🧾", title: "Finding a CPA — The Right Questions", slug: "finding-a-cpa", desc: "What to ask before you hire one. What red flags to run from. Most people pick whoever answers the phone." },
    { icon: "📧", title: "Advanced Email Attachments", slug: "email-attachments-advanced", desc: "The enhanced Python script that writes a full email-detail.csv with auto-categorization. Six workflows: Monday rhythm, QuickBooks bridge, monthly recon, year-end 1099 prep, and more.", tag: "NEW" },
    { icon: "📋", title: "Bookkeeper Scope Matrix", slug: "bookkeeper-scope", desc: "30 bookkeeping tasks. Three answers: your bookkeeper owns it, it stays out of their lane, or it needs a specialist. Stop giving away access you will regret.", tag: "NEW" },
    { icon: "📊", title: "Fractional CFO Scope Matrix", slug: "fractional-cfo-scope", desc: "Three columns: what a fractional CFO does, what they do not touch, and where your authority stays yours. Know the scope before you sign the contract.", tag: "NEW" },
    { icon: "🔍", title: "QBO Discovery Assessment", slug: "qbo-discovery", desc: "Thirteen sections for scoping a new QBO client. Chart of accounts, payroll, reconciliation, pain points. Walk in knowing nothing. Walk out with scope, price, and a verdict.", tag: "NEW" },
  ],
  people: [
    { icon: "🗂️", title: "New Hire First 30 Days", slug: "new-hire-30-days", desc: "The sequence that makes you look like you have a whole HR team behind you when it's just you." },
    { icon: "📝", title: "Separation Script + Resignation Templates", slug: "separation-script", desc: "Word for word. Walk in, say this, walk out. No drama, no liability." },
    { icon: "🤝", title: "Building Your Advisory Team", slug: "advisory-team", desc: "Who you actually need in your corner. CPA, attorney, banker, insurance, mentor. What to ask each one." },
  ],
  communication: [
    { icon: "✉️", title: "What to Actually Say", slug: "communication-templates", desc: "10 templates for late invoices, scope creep, bad news, after-hours texters, and the client you need to fire.", tag: "FREE" },
    { icon: "📋", title: "Client Visit Summary", slug: "client-visit-summary", desc: "Fill it out in the parking lot. Leave it behind. Your client knows what happened and what is next.", tag: "FREE" },
    { icon: "⏱️", title: "Buying Time Scripts", slug: "buying-time-scripts", desc: "Exactly what to say when a client asks something you don't know the answer to. Sound confident while you go figure it out." },
    { icon: "📋", title: "Post-Meeting Debrief One-Pager", slug: "post-meeting-debrief", desc: "Fill it out in the parking lot, send it before you get home. Never forget what you committed to again." },
  ],
  leadership: [
    { icon: "📅", title: "Planning Meetings That Actually Work", slug: "meeting-planning", desc: "The agenda, the time blocks, and the follow-up protocol. One page. Laminate it." },
    { icon: "🔍", title: "Busy vs. Profitable — The Busyness Audit", slug: "busyness-audit", desc: "Revenue is vanity. Net profit is sanity. This shows you whether your busyness is profitable or just exhausting." },
    { icon: "🏗️", title: "In-House vs. Contract Decision Matrix", slug: "inhouse-vs-contract", desc: "HR, bookkeeping, marketing, IT, legal. When you're big enough to bring it in, when you're not." },
    { icon: "📚", title: "Founders Series — Module 1", slug: "founders-series-1", desc: "The business foundation framework. Where it all starts." },
  ],
  utilities: [
    { icon: "✅", title: "Build Your Own Checklist", slug: "checklist-builder", desc: "Multi-section checklist with status circles and notes. Drag rows to rearrange. Save as many as you want. For audits, project tracking, decision matrices, anything.", tag: "FREE" },
  ],
};

const DEBRIEF_PLACEHOLDER = {
  title: "The Debrief — April 2026",
  desc: "This month: Net profit ratios, what your numbers are actually telling you, and member questions answered.",
  available: false,
};

const COURT_CHAPTERS = [
  { slug: "prologue", label: "Prologue", title: "Introduction and Prologue", available: true, hasAudio: true },
  { slug: "chapter-1", label: "Chapter 1", title: "The Kingdom of Eggerton", available: false },
  { slug: "chapter-2", label: "Chapter 2", title: "Lady Delia and the Court", available: false },
  { slug: "chapter-3", label: "Chapter 3", title: "The Record Keepers", available: false },
];

export default function Dashboard({ session }) {
  const [member, setMember] = useState(null);
  const [activeTab, setActiveTab] = useState("tools");
  const [activeCategory, setActiveCategory] = useState("money");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      const { data } = await supabase.from("members").select("*").eq("email", session.user.email).single();
      setMember(data);
      setLoading(false);
    };
    fetchMember();
    const script = document.createElement("script");
    script.src = "https://chat.karikounkel.com/widget.js";
    script.defer = true;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!loading && !member) {
    return (
      <div style={{ minHeight: "100vh", background: "#faf8f4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif", padding: 20 }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#3d4560", marginBottom: 12 }}>
            CARES <span style={{ color: "#e8773a" }}>Works.</span>
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#3d4560", marginBottom: 12, lineHeight: 1.2 }}>
            You don't have a membership yet.
          </h2>
          <p style={{ fontSize: 15, color: "#7a7585", marginBottom: 32, lineHeight: 1.6 }}>
            CARES Works is a membership — new tools added monthly, real answers when you need them. Join to get access to the full library.
          </p>
          <a href="https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06" style={{ display: "inline-block", background: "#e8773a", color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 32px", borderRadius: 6, textDecoration: "none", marginBottom: 12 }}>
            Join Monthly — $27/mo
          </a>
          <div style={{ marginBottom: 24 }}>
            <a href="https://buy.stripe.com/14A5kD4B981AgTxcuM18c09" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#C9A84C", textDecoration: "none", letterSpacing: "0.08em", fontWeight: 700 }}>
              Or join annual — $270/year
            </a>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#7a7585", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.08em", textDecoration: "underline" }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const plan = member?.plan || "monthly";
  const isAnnual = plan === "annual";

  const tabs = ["tools", "debrief", "court", "shop", "account"];
  const tabLabels = { tools: "Tool Library", debrief: "The Debrief", court: "Court of Accounts", shop: "Shop", account: "Account" };
  const categories = Object.keys(TOOLS);
  const catLabels = { money: "Money", people: "People", communication: "Communication", leadership: "Leadership", utilities: "Utilities" };

  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', sans-serif", color: S.ink }}>
      <style>{MOBILE_DASH}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header className="dash-header" style={{ background: S.slate, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, boxShadow: "0 2px 12px rgba(0,0,0,0.15)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="/" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff", textDecoration: "none" }}>
            CARES <span style={{ color: S.orange }}>Works.</span>
          </a>
          <div className="dash-header-tabs" style={{ display: "flex", gap: 2, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 3 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: activeTab === t ? "#fff" : "transparent", color: activeTab === t ? S.slate : "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: activeTab === t ? 700 : 400, cursor: "pointer", fontFamily: "'Figtree', sans-serif", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                {tabLabels[t]}
              </button>
            ))}
          </div>
        </div>
        <div className="dash-header-right" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", background: isAnnual ? "linear-gradient(135deg,#C9A84C,#e0c060)" : S.orange, color: isAnnual ? S.ink : "#fff", padding: "4px 10px", borderRadius: 100, fontWeight: 700 }}>
            {isAnnual ? "Annual" : "Monthly"}
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "'DM Mono', monospace" }}>{session.user.email}</span>
          <button onClick={handleLogout} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.25)", background: "transparent", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>Log out</button>
        </div>
      </header>

      <div className="dash-page" style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* TOOLS TAB */}
        {activeTab === "tools" && (
          <>
            <div style={{ marginBottom: 36 }}>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: S.slate, marginBottom: 6 }}>
                {"Welcome back" + (member?.full_name ? ", " + member.full_name.split(" ")[0] : "") + "."}
              </h1>
              <p style={{ color: S.muted, fontSize: 15 }}>Your full tool library. New tools added monthly.</p>
            </div>

            {/* CATEGORY TABS */}
            <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
              {categories.map(c => (
                <button key={c} onClick={() => setActiveCategory(c)}
                  style={{ padding: "8px 20px", borderRadius: 100, border: "1.5px solid " + (activeCategory === c ? S.orange : S.rule), background: activeCategory === c ? S.orange : "#fff", color: activeCategory === c ? "#fff" : S.muted, fontSize: 13, fontWeight: activeCategory === c ? 700 : 400, cursor: "pointer", fontFamily: "'Figtree', sans-serif", transition: "all 0.15s" }}>
                  {catLabels[c]}
                </button>
              ))}
            </div>

            {/* TOOLS GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {TOOLS[activeCategory].map(t => (
                <div key={t.title} style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "24px", display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
                  {t.tag && <div style={{ position: "absolute", top: 16, right: 16, background: S.orange, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", padding: "3px 8px", borderRadius: 100 }}>{t.tag}</div>}
                  <div style={{ width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: S.orangeLight }}>{t.icon}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, lineHeight: 1.3, color: S.slate }}>{t.title}</div>
                  <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.55, flex: 1 }}>{t.desc}</div>
                  <button
                    onClick={() => { navigate("/tools/" + t.slug); }}
                    style={{ marginTop: 8, padding: "10px 16px", background: S.grad, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", textAlign: "left" }}>
                    Get this tool →
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* THE DEBRIEF */}
        {activeTab === "debrief" && (
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: S.slate, marginBottom: 6 }}>The Debrief</h1>
            <p style={{ color: S.muted, fontSize: 15, marginBottom: 40 }}>Monthly teaching + real member questions answered by Kari.</p>

            <div style={{ background: S.slate, borderRadius: 14, padding: "40px", color: "#fff", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(232,119,58,0.15) 0%, transparent 60%)" }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 12 }}>Latest Episode</div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 12 }}>{DEBRIEF_PLACEHOLDER.title}</h2>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 28, maxWidth: 500 }}>{DEBRIEF_PLACEHOLDER.desc}</p>
                <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "16px 20px", display: "inline-block", fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em" }}>
                  Dropping soon — check back April 30
                </div>
              </div>
            </div>

            <div style={{ marginTop: 32, background: S.cream, border: "1px solid " + S.rule, borderRadius: 12, padding: "24px 28px" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: S.slate, marginBottom: 8 }}>Submit a question for next month</h3>
              <p style={{ color: S.muted, fontSize: 14, marginBottom: 16 }}>Kari answers real member questions every month. What are you stuck on?</p>
              <textarea placeholder="What's your question for Kari?" rows={4}
                style={{ width: "100%", padding: "12px 16px", background: "#fff", border: "1px solid " + S.rule, borderRadius: 8, color: S.ink, fontSize: 14, fontFamily: "'Figtree', sans-serif", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.5 }} />
              <button style={{ marginTop: 12, padding: "10px 24px", background: S.orange, border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
                Submit Question →
              </button>
            </div>
          </div>
        )}

        {/* COURT OF ACCOUNTS */}
        {activeTab === "court" && (
          <div>
            {/* HERO with cover image + title */}
            <div style={{ display: "flex", gap: 32, alignItems: "flex-start", marginBottom: 36, flexWrap: "wrap" }}>
              <img
                src="/court-of-accounts-cover.jpg"
                alt="Court of Accounts — A Tale of Ledgers, Loyalty, and Fancy Chickens"
                style={{ width: 180, height: "auto", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 10 }}>The Serialized Parable</div>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, color: S.slate, marginBottom: 12, lineHeight: 1.15 }}>Court of Accounts</h1>
                <p style={{ color: S.slate, fontSize: 15, marginBottom: 16, fontStyle: "italic", fontFamily: "'DM Serif Display', serif" }}>A Tale of Ledgers, Loyalty, and Fancy Chickens.</p>
                <p style={{ color: S.muted, fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
                  A business parable set in the Kingdom of Eggerton. One chapter drops per month — a tiny kingdom learns the difference between busy and profitable, the cost of loyalty, and what to do when the chickens get fancy.
                </p>
                {isAnnual ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ display: "inline-block", background: "linear-gradient(135deg,#C9A84C,#e0c060)", color: S.ink, fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 100, letterSpacing: "0.08em" }}>Annual member — full book unlocked</div>
                    <a href="/court-of-accounts.pdf" download style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'DM Mono', monospace", fontSize: 12, color: S.orange, textDecoration: "none", letterSpacing: "0.08em", fontWeight: 700 }}>
                      📖 Download full book PDF ↓
                    </a>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: S.muted, fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>Monthly members read one chapter at a time. Annual members get the full book on day one.</div>
                )}
              </div>
            </div>

            {/* WHIMSY WARNING BANNER */}
            <div style={{ background: S.cream, border: "1px dashed " + S.orange, borderRadius: 10, padding: "16px 22px", marginBottom: 36, display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: S.slate, fontStyle: "italic", lineHeight: 1.5 }}>
                Enter only if you have a whimsical sense of humor. Numbered accounts, fancy chickens, and a court that takes itself only mostly seriously. Hats encouraged. Hardhats not required.
              </div>
            </div>

            {/* CHAPTER LIST */}
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: S.slate, marginBottom: 16 }}>Chapters</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {COURT_CHAPTERS.map(ch => (
                <div key={ch.slug} style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: S.muted }}>{ch.label}</div>
                      {ch.hasAudio && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", background: S.orangeLight, color: S.orange, padding: "2px 7px", borderRadius: 100, fontWeight: 700 }}>🎧 Audio</div>}
                    </div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: S.slate }}>{ch.title}</div>
                  </div>
                  {ch.available || isAnnual ? (
                    <button
                      onClick={() => { navigate("/court/" + ch.slug); }}
                      style={{ padding: "10px 20px", background: S.orange, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", whiteSpace: "nowrap" }}>
                      Read →
                    </button>
                  ) : (
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.muted, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>Unlocks next month</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHOP */}
        {activeTab === "shop" && (
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: S.slate, marginBottom: 6 }}>Shop</h1>
            <p style={{ color: S.muted, fontSize: 15, marginBottom: 8 }}>Bundles — the tools grouped the way you actually need them. One-time purchase, yours forever.</p>
            {isAnnual && <div style={{ display: "inline-block", background: "linear-gradient(135deg,#C9A84C,#e0c060)", color: S.ink, fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 100, marginBottom: 32, letterSpacing: "0.08em" }}>🏷️ Annual members save $20 on every bundle</div>}
            {!isAnnual && <p style={{ fontSize: 13, color: S.muted, fontFamily: "'DM Mono', monospace", marginBottom: 32, letterSpacing: "0.05em" }}>Annual members get $20 off every bundle.</p>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "24px", display: "flex", flexDirection: "column", gap: 10, opacity: 0.9 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: S.orangeLight }}>💼</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, lineHeight: 1.25, color: S.slate }}>The Bookkeeping Starter Kit</div>
                <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.55, flex: 1 }}>Chart of Accounts template. IIF import files. Monthly close checklist. QuickBooks setup guide. Everything you need to start keeping books that make sense.</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9a7820", marginTop: 8, fontWeight: 700 }}>🔨 Coming soon</div>
              </div>

              <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "24px", display: "flex", flexDirection: "column", gap: 10, opacity: 0.9 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: S.orangeLight }}>👥</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, lineHeight: 1.25, color: S.slate }}>The HR Starter Kit</div>
                <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.55, flex: 1 }}>Offer letter templates. Employee handbook starter. New hire 30-day sequence. Separation scripts. Progressive discipline docs. HR without the HR team.</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9a7820", marginTop: 8, fontWeight: 700 }}>🔨 Coming soon</div>
              </div>

              <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "24px", display: "flex", flexDirection: "column", gap: 10, opacity: 0.9 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: S.orangeLight }}>📊</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, lineHeight: 1.25, color: S.slate }}>The Founder's Operating System</div>
                <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.55, flex: 1 }}>Busyness audit. Net profit ratios. Pricing framework. Advisory team builder. Meeting planner. The thinking tools that separate busy from profitable.</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9a7820", marginTop: 8, fontWeight: 700 }}>🔨 Coming soon</div>
              </div>

              <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "24px", display: "flex", flexDirection: "column", gap: 10, opacity: 0.9 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: S.orangeLight }}>💰</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, lineHeight: 1.25, color: S.slate }}>The Year-End Panic Button</div>
                <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.55, flex: 1 }}>Everything you need in December: 1099 prep, W-2 checklist, QuickBooks cleanup protocol, CPA handoff packet. For when it's suddenly January.</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9a7820", marginTop: 8, fontWeight: 700 }}>🔨 Coming soon</div>
              </div>
            </div>

            <div style={{ marginTop: 40, background: S.cream, border: "1px solid " + S.rule, borderRadius: 10, padding: "20px 24px", fontSize: 13, color: S.muted, lineHeight: 1.6, fontFamily: "'DM Serif Display', serif", fontStyle: "italic" }}>
              Bundles are coming. Each one is the curated answer to a specific question — "what do I actually need to start bookkeeping," "how do I hire someone without getting sued," "how do I survive year-end." Built once, yours forever.
            </div>
          </div>
        )}

        {/* ACCOUNT */}
        {activeTab === "account" && (
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: S.slate, marginBottom: 6 }}>Your Account</h1>
            <p style={{ color: S.muted, fontSize: 15, marginBottom: 40 }}>Membership details and billing.</p>

            <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "28px", marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.muted, marginBottom: 16 }}>Membership</div>
              <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 12, color: S.muted, marginBottom: 4 }}>Email</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: S.ink }}>{session.user.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: S.muted, marginBottom: 4 }}>Plan</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: S.ink, textTransform: "capitalize" }}>{plan}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: S.muted, marginBottom: 4 }}>Status</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#5a9a5a" }}>{member?.status || "Active"}</div>
                </div>
              </div>
            </div>

            {isAnnual && (
              <div style={{ background: "linear-gradient(135deg, #fff8e0, #fff)", border: "1.5px solid #e8d080", borderRadius: 14, padding: "28px 32px", marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#9a7820", marginBottom: 12, fontWeight: 700 }}>✨ Annual Member Perks</div>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: S.slate, marginBottom: 6, lineHeight: 1.2 }}>The Vault</h3>
                <p style={{ fontSize: 14, color: S.muted, marginBottom: 20, lineHeight: 1.5 }}>Everything you get for being here early.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                  <a href="/court-of-accounts.pdf" download
                    style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 10, padding: "18px 20px", textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: 8, transition: "transform 0.15s, box-shadow 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(201,168,76,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ fontSize: 22 }}>📖</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: S.slate, lineHeight: 1.3 }}>Court of Accounts — Full Book</div>
                    <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.5 }}>Download the complete PDF. Yours to keep.</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.orange, letterSpacing: "0.08em", fontWeight: 700, marginTop: 4 }}>Download PDF ↓</div>
                  </a>
                  <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 10, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 22 }}>🚪</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: S.slate, lineHeight: 1.3 }}>Early Access</div>
                    <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.5 }}>New tools land for you 7 days before monthly members.</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.muted, letterSpacing: "0.08em", marginTop: 4 }}>Always on</div>
                  </div>
                  <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 10, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8, opacity: 0.85 }}>
                    <div style={{ fontSize: 22 }}>🎧</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: S.slate, lineHeight: 1.3 }}>Court of Accounts Audiobook</div>
                    <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.5 }}>Every chapter, read aloud. Download or stream.</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9a7820", marginTop: 4, fontWeight: 700 }}>🔨 Coming soon</div>
                  </div>
                  <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 10, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8, opacity: 0.85 }}>
                    <div style={{ fontSize: 22 }}>📋</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: S.slate, lineHeight: 1.3 }}>Printable One-Pagers</div>
                    <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.5 }}>Every checklist as a PDF. Print, laminate, tape to the wall.</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9a7820", marginTop: 4, fontWeight: 700 }}>🔨 Coming soon</div>
                  </div>
                  <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 10, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8, opacity: 0.85 }}>
                    <div style={{ fontSize: 22 }}>🎟️</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: S.slate, lineHeight: 1.3 }}>Quarterly Office Hours</div>
                    <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.5 }}>Live Q&A with Kari. One hour. Annual members only.</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9a7820", marginTop: 4, fontWeight: 700 }}>🔨 Coming soon</div>
                  </div>
                  <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 10, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8, opacity: 0.85 }}>
                    <div style={{ fontSize: 22 }}>🏷️</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: S.slate, lineHeight: 1.3 }}>$20 Off Every Bundle</div>
                    <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.5 }}>Your annual discount code for any Shop bundle.</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9a7820", marginTop: 4, fontWeight: 700 }}>🔨 Coming soon</div>
                  </div>
                </div>
              </div>
            )}

            {!isAnnual && (
              <div style={{ background: "linear-gradient(135deg, #fff8e0, #fff)", border: "1.5px solid #e8d080", borderRadius: 12, padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: S.slate, marginBottom: 4 }}>Upgrade to Annual</div>
                  <p style={{ fontSize: 14, color: S.muted }}>$270/year — save two months. Get the full Court of Accounts book on day one.</p>
                </div>
                <a href="https://buy.stripe.com/14A5kD4B981AgTxcuM18c09" style={{ padding: "12px 24px", background: "linear-gradient(135deg,#C9A84C,#e0c060)", border: "none", borderRadius: 8, color: S.ink, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", textDecoration: "none", whiteSpace: "nowrap" }}>
                  Upgrade →
                </a>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
