import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";
import Workspace from "./Workspace";

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
    .dash-filter-bar { flex-direction: column !important; align-items: stretch !important; }
    .dash-filter-search { width: 100% !important; }
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
  green: "#5a9a5a",
  grad: "linear-gradient(135deg, #e8773a, #c95f22)",
};

// The tool catalog lives in Supabase (public.tools) — edited from the admin side, read here.
// Category display order + labels stay in code; the tool rows come from the database.
const CATEGORY_ORDER = ["bookkeeping", "money", "people", "clientwork", "leadership", "utilities"];

const CAT_LABELS = { bookkeeping: "Bookkeeping", money: "Money", people: "People", clientwork: "Client Work", leadership: "Leadership", utilities: "Utilities" };
const CAT_ICONS = { bookkeeping: "📒", money: "💰", people: "👥", clientwork: "🤝", leadership: "🎯", utilities: "🛠️" };

const COURT_CHAPTERS = [
  { slug: "prologue", label: "Prologue", title: "Introduction and Prologue", available: true, hasAudio: true },
  { slug: "chapter-1", label: "Chapter 1", title: "The Kingdom of Eggerton", available: false },
  { slug: "chapter-2", label: "Chapter 2", title: "Lady Delia and the Court", available: false },
  { slug: "chapter-3", label: "Chapter 3", title: "The Record Keepers", available: false },
];

export default function Dashboard({ session }) {
  const [member, setMember] = useState(null);
  const [activeTab, setActiveTab] = useState("tools");
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [debriefs, setDebriefs] = useState([]);
  const [debriefsLoading, setDebriefsLoading] = useState(true);
  const [openDebriefSlug, setOpenDebriefSlug] = useState(null);
  const [debriefCategory, setDebriefCategory] = useState("All");
  const [whatsNew, setWhatsNew] = useState(null);

  // Onboarding modals + collapsible Library helper
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showHowToModal, setShowHowToModal] = useState(false);
  const [showLibraryHelp, setShowLibraryHelp] = useState(false);

  // Filter state for Tool Library
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCats, setSelectedCats] = useState([]); // empty = all
  const [tierFilter, setTierFilter] = useState("all"); // all | free | member
  const [newOnly, setNewOnly] = useState(false);

  useEffect(() => {
    const fetchMember = async () => {
      const { data } = await supabase.from("members").select("*").eq("email", session.user.email).single();
      setMember(data);
      setLoading(false);
    };
    fetchMember();

    const fetchTools = async () => {
      const { data } = await supabase
        .from("tools")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      setTools(data || []);
      setToolsLoading(false);
    };
    fetchTools();

    const fetchDebriefs = async () => {
      const { data } = await supabase
        .from("debriefs")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      setDebriefs(data || []);
      setDebriefsLoading(false);
    };
    fetchDebriefs();

    const fetchWhatsNew = async () => {
      const { data } = await supabase
        .from("whats_new_current")
        .select("*")
        .eq("id", "current")
        .maybeSingle();
      setWhatsNew(data || null);
    };
    fetchWhatsNew();
    // Widget is loaded once at the page level via index.html — no per-component injection.
  }, [session]);

  // Click handler for What's New block links — supports /tools/* navigation and "debrief:<slug>" hops.
  const openWhatsNewLink = (link, slug) => {
    if (!link) return;
    if (link.startsWith("debrief:")) {
      const targetSlug = link.split(":")[1];
      setActiveTab("debrief");
      setOpenDebriefSlug(targetSlug);
      setDebriefCategory("All");
      setTimeout(() => {
        const el = document.querySelector("[data-debrief-slug=\"" + targetSlug + "\"]");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 250);
    } else if (link.startsWith("/tools/")) {
      navigate(link);
    } else {
      window.location.href = link;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Map database rows to the shape the grid expects (description -> desc)
  const allTools = useMemo(() => {
    return tools.map(t => ({
      icon: t.icon,
      title: t.title,
      slug: t.slug,
      href: t.href || undefined,
      desc: t.description,
      tag: t.tag || undefined,
      tier: t.tier || "member",
      category: t.category,
    }));
  }, [tools]);

  // Apply filters
  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allTools.filter(t => {
      if (selectedCats.length > 0 && !selectedCats.includes(t.category)) return false;
      if (tierFilter !== "all" && t.tier !== tierFilter) return false;
      if (newOnly && t.tag !== "NEW") return false;
      if (q) {
        const haystack = (t.title + " " + t.desc).toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allTools, searchQuery, selectedCats, tierFilter, newOnly]);

  const toggleCat = (cat) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCats([]);
    setTierFilter("all");
    setNewOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedCats.length > 0 || tierFilter !== "all" || newOnly;

  if (!loading && !member) {
    return (
      <div style={{ minHeight: "100vh", background: "#faf8f4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif", padding: 20 }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <img src="/cares-works-logo.png" alt="CARES Works" style={{ width: 140, height: "auto", display: "block", margin: "0 auto 16px" }} />
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

  const tabs = ["tools", "workspace", "debrief", "court", "shop", "account"];
  const tabLabels = { tools: "Tool Library", workspace: "My Work", debrief: "The Debrief", court: "Court of Accounts", shop: "Shop", account: "Account" };
  const categories = CATEGORY_ORDER;

  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', sans-serif", color: S.ink }}>
      <style>{MOBILE_DASH}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header className="dash-header" style={{ background: S.slate, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, boxShadow: "0 2px 12px rgba(0,0,0,0.15)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/cares-works-logo.png" alt="CARES Works" style={{ height: 36, width: "auto", display: "block" }} />
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff" }}>
              CARES <span style={{ color: S.orange }}>Works.</span>
            </span>
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

      <div className="dash-page" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* TOOLS TAB */}
        {activeTab === "tools" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 28, flexWrap: "wrap" }}>
              <img src="/cares-works-logo.png" alt="CARES Works" style={{ width: 120, height: "auto", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 260 }}>
                <h1 className="dash-h1" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: S.slate, marginBottom: 8, lineHeight: 1.15 }}>
                  {"Welcome back" + (member?.full_name ? ", " + member.full_name.split(" ")[0] : "") + "."}
                </h1>
                <p style={{ color: S.slate, fontSize: 17, lineHeight: 1.55, marginBottom: 6, maxWidth: 720 }}>
                  Tools, Debriefs, and practical business systems for people who are done letting chaos run the meeting.
                </p>
                <p style={{ color: S.muted, fontSize: 14, fontStyle: "italic" }}>
                  Start with one problem. Find one tool. Fix one thing.
                </p>
              </div>
            </div>

            {/* START HERE STRIP */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 32 }}>
              {[
                { emoji: "👋", title: "Watch the 2-Minute Welcome", desc: "What this place is, how it works, and where not to panic.", btn: "Watch Welcome", onClick: () => setShowWelcomeModal(true) },
                { emoji: "🧭", title: "Learn the Layout", desc: "Tools, Debriefs, downloads, categories, and how to find what you need fast.", btn: "How This Works", onClick: () => setShowHowToModal(true) },
                { emoji: "🔥", title: "What's New This Week", desc: "Latest tools, newest Debriefs, featured fixes, and current chaos containment.", btn: "See What's New", onClick: () => { const el = document.getElementById("whats-new"); if (el) el.scrollIntoView({ behavior: "smooth" }); else setShowHowToModal(true); } },
              ].map(card => (
                <div key={card.title} style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 26, lineHeight: 1 }}>{card.emoji}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: S.slate, lineHeight: 1.25 }}>{card.title}</div>
                  <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.5, flex: 1 }}>{card.desc}</div>
                  <button onClick={card.onClick}
                    style={{ marginTop: 6, padding: "9px 14px", background: S.grad, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", textAlign: "left" }}>
                    {card.btn} →
                  </button>
                </div>
              ))}
            </div>

            {/* WHAT'S NEW THIS WEEK */}
            {whatsNew && (
              <div id="whats-new" style={{ marginBottom: 36, padding: "28px 30px", background: "linear-gradient(135deg, #fff8f1, #fff)", border: "1px solid " + S.rule, borderRadius: 14 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: S.slate, margin: 0 }}>
                    🔥 What's New This Week
                  </h2>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.muted, letterSpacing: "0.06em" }}>
                    Updated {whatsNew.updated_at ? new Date(whatsNew.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                  {[
                    { tag: "NEW TOOL", icon: "🛠️", data: whatsNew.new_tool, accent: S.orange },
                    { tag: "NEW DEBRIEF", icon: "☕", data: whatsNew.new_debrief, accent: S.slate },
                    { tag: "FEATURED FIX", icon: "🎯", data: whatsNew.featured_fix, accent: S.gold },
                  ].map(block => block.data && (
                    <div key={block.tag} style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 10, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 16 }}>{block.icon}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: block.accent, fontWeight: 700 }}>{block.tag}</span>
                      </div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: S.slate, lineHeight: 1.3 }}>{block.data.title}</div>
                      <div style={{ fontSize: 12.5, color: S.muted, lineHeight: 1.5, flex: 1 }}>{block.data.desc}</div>
                      {block.data.button && block.data.link && (
                        <button onClick={() => openWhatsNewLink(block.data.link)}
                          style={{ marginTop: 8, padding: "8px 12px", background: S.grad, border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", textAlign: "left" }}>
                          {block.data.button} →
                        </button>
                      )}
                    </div>
                  ))}
                  {whatsNew.workshop_note && (
                    <div style={{ background: S.slate, color: "#fff", borderRadius: 10, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: S.orange, fontWeight: 700 }}>
                        ✨ KARI'S WORKSHOP NOTE
                      </div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, lineHeight: 1.3 }}>{whatsNew.workshop_note.title}</div>
                      <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.78)", lineHeight: 1.55, fontStyle: "italic" }}>{whatsNew.workshop_note.body}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SEARCH BAR */}
            <div style={{ marginBottom: 16, position: "relative" }} className="dash-filter-search">
              <input
                type="text"
                placeholder="Search tools…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "12px 40px 12px 44px", fontSize: 14, fontFamily: "'Figtree', sans-serif", background: "#fff", border: "1.5px solid " + S.rule, borderRadius: 10, outline: "none", color: S.ink, boxSizing: "border-box" }}
                onFocus={e => { e.target.style.borderColor = S.orange; }}
                onBlur={e => { e.target.style.borderColor = S.rule; }}
              />
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: S.muted, pointerEvents: "none" }}>🔍</span>
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: S.muted, fontSize: 18, cursor: "pointer", padding: 4 }}>×</button>
              )}
            </div>

            {/* COLLAPSIBLE: How to Use the Tool Library */}
            <div style={{ marginBottom: 14 }}>
              <button onClick={() => setShowLibraryHelp(v => !v)}
                style={{ background: "transparent", border: "none", color: S.orange, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 0" }}>
                {showLibraryHelp ? "− Hide" : "+ How"} to use the Tool Library
              </button>
              {showLibraryHelp && (
                <div style={{ background: S.cream, border: "1px solid " + S.rule, borderRadius: 10, padding: "18px 22px", marginTop: 8, color: S.ink, fontSize: 14, lineHeight: 1.6 }}>
                  <p style={{ margin: "0 0 12px" }}>
                    Use the <strong>search bar</strong> when you know what you need. Use the <strong>category buttons</strong> when you only know what kind of problem you have. Use <strong>Free / Member / New</strong> to narrow the list.
                  </p>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: S.muted, marginBottom: 6 }}>CATEGORIES</div>
                  <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontSize: 13 }}>
                    <li><strong>Bookkeeping</strong> — numbers, cleanup, QuickBooks, charts of accounts, ledgers, year-end triage.</li>
                    <li><strong>Money</strong> — pricing, budgeting, cash flow, financial decisions, owner clarity.</li>
                    <li><strong>People</strong> — hiring, onboarding, HR, payroll, team, accountability.</li>
                    <li><strong>Client Work</strong> — intake, scope, proposals, client communication, project tracking.</li>
                    <li><strong>Leadership</strong> — management systems, decision-making, meetings, follow-through.</li>
                    <li><strong>Utilities</strong> — miscellaneous helpers, trackers, checklists, small-but-mighty fixes.</li>
                  </ul>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: S.muted, marginBottom: 6 }}>FILTERS</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                    <li><strong>All</strong> shows everything.</li>
                    <li><strong>Free</strong> shows tools anyone can access.</li>
                    <li><strong>Member</strong> shows tools included with membership.</li>
                    <li><strong>New Only</strong> shows the newest additions.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* CATEGORY CHIPS */}
            <div className="dash-cat-tabs" style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <button onClick={() => setSelectedCats([])}
                style={{ padding: "7px 16px", borderRadius: 100, border: "1.5px solid " + (selectedCats.length === 0 ? S.slate : S.rule), background: selectedCats.length === 0 ? S.slate : "#fff", color: selectedCats.length === 0 ? "#fff" : S.muted, fontSize: 12, fontWeight: selectedCats.length === 0 ? 700 : 500, cursor: "pointer", fontFamily: "'Figtree', sans-serif", transition: "all 0.15s" }}>
                All
              </button>
              {categories.map(c => {
                const isActive = selectedCats.includes(c);
                return (
                  <button key={c} onClick={() => toggleCat(c)}
                    style={{ padding: "7px 16px", borderRadius: 100, border: "1.5px solid " + (isActive ? S.orange : S.rule), background: isActive ? S.orange : "#fff", color: isActive ? "#fff" : S.muted, fontSize: 12, fontWeight: isActive ? 700 : 500, cursor: "pointer", fontFamily: "'Figtree', sans-serif", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{CAT_ICONS[c]}</span>{CAT_LABELS[c]}
                  </button>
                );
              })}
            </div>

            {/* TIER + NEW FILTER ROW */}
            <div className="dash-filter-bar" style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 4, background: "#fff", border: "1px solid " + S.rule, borderRadius: 100, padding: 3 }}>
                {[{ k: "all", l: "All" }, { k: "free", l: "Free" }, { k: "member", l: "Member" }].map(opt => (
                  <button key={opt.k} onClick={() => setTierFilter(opt.k)}
                    style={{ padding: "5px 14px", borderRadius: 100, border: "none", background: tierFilter === opt.k ? S.cream : "transparent", color: tierFilter === opt.k ? S.ink : S.muted, fontSize: 11, fontWeight: tierFilter === opt.k ? 700 : 500, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {opt.l}
                  </button>
                ))}
              </div>
              <button onClick={() => setNewOnly(!newOnly)}
                style={{ padding: "6px 14px", borderRadius: 100, border: "1.5px solid " + (newOnly ? S.gold : S.rule), background: newOnly ? "linear-gradient(135deg,#C9A84C,#e0c060)" : "#fff", color: newOnly ? S.ink : S.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                ✨ New only
              </button>
              {hasActiveFilters && (
                <button onClick={clearFilters}
                  style={{ background: "transparent", border: "none", color: S.orange, fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", padding: "6px 8px" }}>
                  Clear filters
                </button>
              )}
              <div style={{ marginLeft: "auto", fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.muted, letterSpacing: "0.06em" }}>
                Showing {filteredTools.length} of {allTools.length} tools
              </div>
            </div>

            {/* TOOLS GRID */}
            {toolsLoading ? (
              <div style={{ background: S.cream, border: "1px dashed " + S.rule, borderRadius: 12, padding: "48px 24px", textAlign: "center", color: S.muted, fontFamily: "'DM Mono', monospace", fontSize: 13, letterSpacing: "0.06em" }}>
                Loading your tool library…
              </div>
            ) : filteredTools.length === 0 ? (
              <div style={{ background: S.cream, border: "1px dashed " + S.rule, borderRadius: 12, padding: "48px 24px", textAlign: "center", color: S.muted }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: S.slate, marginBottom: 8 }}>No tools match your filters.</div>
                <p style={{ fontSize: 14, marginBottom: 16 }}>Try clearing the filters or searching for something else.</p>
                <button onClick={clearFilters}
                  style={{ padding: "8px 18px", background: S.orange, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="dash-tools-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                {filteredTools.map(t => {
                  const buttonText = t.href ? "Open tool →" : "Get this tool →";
                  return (
                    <div key={t.title} style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
                      {t.tag && <div style={{ position: "absolute", top: 14, right: 14, background: t.tag === "FREE" ? S.green : S.orange, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", padding: "3px 8px", borderRadius: 100 }}>{t.tag}</div>}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: S.orangeLight }}>{t.icon}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: S.muted }}>{CAT_LABELS[t.category]}</div>
                      </div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, lineHeight: 1.3, color: S.slate }}>{t.title}</div>
                      <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.55, flex: 1 }}>{t.desc}</div>
                      {t.href ? (
                        <a href={t.href} target="_blank" rel="noopener noreferrer"
                          style={{ marginTop: 8, padding: "10px 16px", background: S.grad, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", textAlign: "left", textDecoration: "none", display: "block" }}>
                          {buttonText}
                        </a>
                      ) : (
                        <button
                          onClick={() => { navigate("/tools/" + t.slug); }}
                          style={{ marginTop: 8, padding: "10px 16px", background: S.grad, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", textAlign: "left" }}>
                          {buttonText}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* MY WORK — member workspace */}
        {activeTab === "workspace" && <Workspace session={session} />}

        {/* THE DEBRIEF */}
        {activeTab === "debrief" && (
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: S.slate, marginBottom: 6 }}>The Debrief</h1>
            <p style={{ color: S.muted, fontSize: 15, marginBottom: 28, maxWidth: 700 }}>
              Short business breakdowns. Why your vendor list is telling on you. Why cash flow is not a vibe. Honest answers to the questions you got tired of asking.
            </p>

            {/* CATEGORY FILTER CHIPS */}
            {!debriefsLoading && debriefs.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                {["All", "Invisible Leaks", "The Drawer of Doom", "Nobody Told Owners This", "Fixed It Friday", "Live From My Business Feelings"].map(cat => {
                  const active = debriefCategory === cat;
                  return (
                    <button key={cat} onClick={() => setDebriefCategory(cat)}
                      style={{ padding: "7px 16px", borderRadius: 100, border: "1.5px solid " + (active ? S.orange : S.rule), background: active ? S.orange : "#fff", color: active ? "#fff" : S.muted, fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            {/* DEBRIEF LIST */}
            {debriefsLoading ? (
              <div style={{ background: S.cream, border: "1px dashed " + S.rule, borderRadius: 12, padding: "48px 24px", textAlign: "center", color: S.muted, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
                Loading the Debriefs…
              </div>
            ) : debriefs.length === 0 ? (
              <div style={{ background: S.cream, border: "1px dashed " + S.rule, borderRadius: 12, padding: "48px 24px", textAlign: "center", color: S.muted }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>☕</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: S.slate, marginBottom: 8 }}>No Debriefs yet.</div>
                <p style={{ fontSize: 14 }}>Check back soon — first issues are brewing.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {debriefs.filter(d => debriefCategory === "All" || d.category === debriefCategory).map(d => {
                  const isOpen = openDebriefSlug === d.slug;
                  return (
                    <div key={d.slug} data-debrief-slug={d.slug} style={{ background: "#fff", border: "1px solid " + (isOpen ? S.orange : S.rule), borderRadius: 12, overflow: "hidden", transition: "border-color 0.15s" }}>
                      <div onClick={() => setOpenDebriefSlug(isOpen ? null : d.slug)}
                        style={{ padding: "20px 26px", cursor: "pointer" }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: S.orange, marginBottom: 6 }}>
                          {d.category}
                        </div>
                        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: S.slate, marginBottom: 8, lineHeight: 1.3 }}>{d.title}</h3>
                        <p style={{ color: S.muted, fontSize: 14, lineHeight: 1.55, margin: 0 }}>{d.summary}</p>
                        {!isOpen && (
                          <div style={{ marginTop: 12, fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.orange, fontWeight: 700, letterSpacing: "0.08em" }}>
                            READ →
                          </div>
                        )}
                      </div>
                      {isOpen && (
                        <div style={{ borderTop: "1px solid " + S.rule, padding: "24px 26px", background: S.cream }}>
                          {d.body && d.body.split("\n\n").map((para, i) => (
                            <p key={i} style={{ fontSize: 15, color: S.ink, lineHeight: 1.7, marginBottom: 14, whiteSpace: "pre-wrap" }}>{para}</p>
                          ))}
                          {d.cta_text && d.cta_link && (
                            <a href={d.cta_link} onClick={e => { if (d.cta_link.startsWith("/tools/")) { e.preventDefault(); navigate(d.cta_link); } }}
                              style={{ display: "inline-block", marginTop: 8, padding: "11px 22px", background: S.grad, color: "#fff", textDecoration: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "'Figtree', sans-serif" }}>
                              {d.cta_text} →
                            </a>
                          )}
                          <button onClick={() => setOpenDebriefSlug(null)}
                            style={{ marginTop: 16, marginLeft: 12, background: "transparent", border: "none", color: S.muted, fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: "pointer", letterSpacing: "0.08em" }}>
                            ↑ Close
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

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

            {/* SHARE WITH A FRIEND */}
            <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "28px", marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.muted, marginBottom: 12 }}>Share With a Friend</div>
              <p style={{ fontSize: 14, color: S.muted, marginBottom: 18, lineHeight: 1.55 }}>
                Know someone who needs CARES Works? Send them <strong style={{ color: S.ink, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>tools.caresmn.com</strong> — when they visit without a login, they'll see the public landing page. Want to peek at what they'll see?
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a href="/?public=1" target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-block", padding: "10px 18px", background: "transparent", border: "1.5px solid " + S.orange, borderRadius: 8, color: S.orange, fontSize: 13, fontWeight: 700, fontFamily: "'Figtree', sans-serif", textDecoration: "none" }}>
                  Preview public site →
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText("https://tools.caresmn.com");
                    alert("Copied! tools.caresmn.com is on your clipboard.");
                  }}
                  style={{ padding: "10px 18px", background: "transparent", border: "1.5px solid " + S.rule, borderRadius: 8, color: S.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
                  Copy link to share
                </button>
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

      {/* MODAL: Welcome video placeholder */}
      {showWelcomeModal && (
        <div onClick={() => setShowWelcomeModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(30,30,42,0.62)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: S.paper, maxWidth: 560, width: "100%", borderRadius: 14, padding: "32px 36px", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <button onClick={() => setShowWelcomeModal(false)}
              style={{ position: "absolute", top: 12, right: 14, background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: S.muted }}>×</button>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: S.orange, marginBottom: 8 }}>WELCOME VIDEO</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: S.slate, marginBottom: 16, lineHeight: 1.2 }}>Welcome to the workshop.</h2>
            <div style={{ position: "relative", paddingBottom: "62.5%", height: 0, marginBottom: 18, borderRadius: 10, overflow: "hidden", background: "#000" }}>
              <iframe
                src="https://www.loom.com/embed/c3d53986bd4b4594995d1b0187c8678c"
                frameBorder="0"
                allow="autoplay; fullscreen"
                allowFullScreen
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              />
            </div>
            <p style={{ fontSize: 14, color: S.ink, lineHeight: 1.6, marginBottom: 4 }}>
              When you're done watching — pick one pain point. Open one tool. Use it before you collect more.
            </p>
            <p style={{ fontSize: 14, color: S.muted, fontStyle: "italic" }}>
              That's the whole magic trick.
            </p>
          </div>
        </div>
      )}

      {/* MODAL: How CARES Works… Works */}
      {showHowToModal && (
        <div onClick={() => setShowHowToModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(30,30,42,0.62)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: S.paper, maxWidth: 680, width: "100%", borderRadius: 14, padding: "32px 40px", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <button onClick={() => setShowHowToModal(false)}
              style={{ position: "absolute", top: 12, right: 14, background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: S.muted }}>×</button>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: S.orange, marginBottom: 8 }}>HOW THIS WORKS</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: S.slate, marginBottom: 14, lineHeight: 1.2 }}>How CARES Works… works.</h2>
            <p style={{ fontSize: 15, color: S.ink, lineHeight: 1.65, marginBottom: 22 }}>
              CARES Works is built like a practical business workshop. You do not have to use everything at once. In fact, please do not. That way lies the spreadsheet bog.
            </p>
            <p style={{ fontSize: 15, color: S.ink, lineHeight: 1.65, marginBottom: 24 }}>
              Start with the problem you have today. Then grab the tool, watch the Debrief, or ask for help when the situation needs human eyes.
            </p>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: S.muted, marginBottom: 10 }}>MAIN AREAS</div>
            {[
              { icon: "🛠️", title: "Tool Library", body: "Downloadable systems, templates, trackers, checklists, and operational shortcuts. Use the search bar or category filters to find the thing that matches your current business problem." },
              { icon: "📂", title: "My Work", body: 'Your saved tools, active downloads, and resources you are currently using. This is the "where did I put that thing?" room.' },
              { icon: "☕", title: "The Debrief", body: "Short business lessons and practical breakdowns about operational leaks, money messes, management problems, workflow fixes, and the weird human behavior that makes business harder than it needs to be." },
              { icon: "⚖️", title: "Court of Accounts", body: "Financial education with a little kingdom drama and a lot less accountant fog. Use this when you want to understand what your numbers are trying to tell you." },
              { icon: "🛒", title: "Shop", body: "Standalone products, bundles, kits, and other useful business tools." },
              { icon: "👤", title: "Account", body: "Your membership, subscription, login details, and account settings." },
            ].map(area => (
              <div key={area.title} style={{ marginBottom: 16, padding: "14px 18px", background: "#fff", border: "1px solid " + S.rule, borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{area.icon}</span>
                  <strong style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: S.slate }}>{area.title}</strong>
                </div>
                <div style={{ fontSize: 13.5, color: S.ink, lineHeight: 1.55 }}>{area.body}</div>
              </div>
            ))}
            <div style={{ marginTop: 24, padding: "18px 22px", background: S.slate, borderRadius: 10, color: "#fff" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: S.orange, marginBottom: 8 }}>YOUR FIRST 15 MINUTES</div>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
                <li>Pick one pain point. Not twelve. One.</li>
                <li>Search for one tool that matches the words you'd use to describe it.</li>
                <li>Open or download that one tool. Use it before you collect more.</li>
                <li>Watch one Debrief. It explains the thinking behind the tool.</li>
                <li>If you hit a wall, hit Ask Kari. Some messes need a real person.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
