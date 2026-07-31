import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";
import Workspace from "./Workspace";
import { fetchAllSavedWork } from "../toolSessions";
import { N, N_RGB, FONT_LINK, NeonBox, NeonBtn, LogoHero, NeonNav, SignatureFooter, SpotlightCallout, StatPills, WASH_BG_LITE, HERO_TEXT_GRAD_BLUE } from "../design/neon";

const MOBILE_DASH = `
  @media (max-width: 640px) {
    .dash-page { padding: 24px 16px 60px !important; }
    .dash-h1 { font-size: 24px !important; }
    .dash-cat-tabs { gap: 6px !important; }
    .dash-cat-tabs button { padding: 6px 14px !important; font-size: 12px !important; }
    .dash-tools-grid { grid-template-columns: 1fr !important; }
    .dash-account-row { flex-direction: column !important; gap: 16px !important; }
    .dash-filter-bar { flex-direction: column !important; align-items: stretch !important; }
    .dash-filter-search { width: 100% !important; }
    .dash-featured-row > button { width: 34px !important; font-size: 20px !important; }
    .dash-featured-row > div { padding: 26px 22px !important; }
  }
`;

const CATEGORY_ORDER = ["bookkeeping", "money", "people", "clientwork", "leadership", "utilities"];
const CAT_LABELS = { bookkeeping: "Bookkeeping", money: "Money", people: "People", clientwork: "Client Work", leadership: "Leadership", utilities: "Utilities" };
const CAT_ICONS = { bookkeeping: "📒", money: "💰", people: "👥", clientwork: "🤝", leadership: "🎯", utilities: "🛠️" };
const CAT_COLOR = { bookkeeping: N.blue, money: N.orange, people: N.pink, clientwork: N.blue, leadership: N.orange, utilities: N.pink };
const CAT_RGB = { bookkeeping: N_RGB.blue, money: N_RGB.orange, people: N_RGB.pink, clientwork: N_RGB.blue, leadership: N_RGB.orange, utilities: N_RGB.pink };

const COURT_CHAPTERS = [
  { slug: "prologue", label: "Prologue", title: "Introduction and Prologue", available: true, hasAudio: true },
  { slug: "chapter-1", label: "Chapter 1", title: "The Kingdom of Eggerton", available: false },
  { slug: "chapter-2", label: "Chapter 2", title: "Lady Delia and the Court", available: false },
  { slug: "chapter-3", label: "Chapter 3", title: "The Record Keepers", available: false },
];

export default function Dashboard({ session }) {
  const [member, setMember] = useState(null);
  const VALID_TABS = ["tools", "workspace", "debrief", "court", "shop", "account"];
  const initialTab = (() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    return VALID_TABS.includes(t) ? t : "tools";
  })();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [debriefs, setDebriefs] = useState([]);
  const [debriefsLoading, setDebriefsLoading] = useState(true);
  const [openDebriefSlug, setOpenDebriefSlug] = useState(null);
  const [debriefCategory, setDebriefCategory] = useState("All");
  const [recentSessions, setRecentSessions] = useState([]);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showHowToModal, setShowHowToModal] = useState(false);
  const [showLibraryHelp, setShowLibraryHelp] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCats, setSelectedCats] = useState([]);
  const [tierFilter, setTierFilter] = useState("all");
  const [newOnly, setNewOnly] = useState(false);
  const [viewMode, setViewMode] = useState(() => { try { return localStorage.getItem("cw_view") || "featured"; } catch (e) { return "featured"; } });
  const [featIdx, setFeatIdx] = useState(0);

  useEffect(() => {
    const fetchMember = async () => {
      const { data } = await supabase.from("members").select("*").eq("email", session.user.email).single();
      setMember(data);
      setLoading(false);
    };
    fetchMember();

    const fetchTools = async () => {
      const { data } = await supabase.from("tools").select("*").eq("is_published", true).order("sort_order", { ascending: true });
      setTools(data || []);
      setToolsLoading(false);
    };
    fetchTools();

    const fetchDebriefs = async () => {
      const { data } = await supabase.from("debriefs").select("*").eq("is_published", true).order("sort_order", { ascending: true });
      setDebriefs(data || []);
      setDebriefsLoading(false);
    };
    fetchDebriefs();

    fetchAllSavedWork(session).then(d => setRecentSessions(d.slice(0, 4)));
  }, [session]);

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = "/"; };

  const allTools = useMemo(() => tools.map(t => ({
    icon: t.icon, title: t.title, slug: t.slug, href: t.href || undefined,
    desc: t.description, why: t.why_use || undefined, tag: t.tag || undefined,
    tier: t.tier || "member", category: t.category,
  })), [tools]);

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

  const toggleCat = (cat) => setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  const clearFilters = () => { setSearchQuery(""); setSelectedCats([]); setTierFilter("all"); setNewOnly(false); };
  const hasActiveFilters = searchQuery || selectedCats.length > 0 || tierFilter !== "all" || newOnly;
  const changeView = (m) => { setViewMode(m); try { localStorage.setItem("cw_view", m); } catch (e) {} };

  useEffect(() => { setFeatIdx(0); }, [searchQuery, selectedCats, tierFilter, newOnly]);

  useEffect(() => {
    if (viewMode !== "featured" || activeTab !== "tools") return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") setFeatIdx(i => i + 1);
      else if (e.key === "ArrowLeft") setFeatIdx(i => i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewMode, activeTab]);

  // NON-MEMBER SCREEN — landing prompt for signed-in-but-not-paid users
  if (!loading && !member) {
    return (
      <div style={{ minHeight: "100vh", background: N.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif", padding: 20 }}>
        <link href={FONT_LINK} rel="stylesheet" />
        <div style={{ textAlign: "center", maxWidth: 520 }}>
          <img src="/cares-works-neon-logo.png" alt="CARES Works" style={{ width: 260, height: "auto", display: "block", margin: "0 auto 24px", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,128,255,0.25)" }} />
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: N.ink, marginBottom: 12, lineHeight: 1.2 }}>You don't have a membership yet.</h2>
          <p style={{ fontSize: 15, color: N.muted, marginBottom: 32, lineHeight: 1.6 }}>
            CARES Works is a membership — new tools added monthly, real answers when you need them. Join to get access to the full library.
          </p>
          <a href="https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06" style={{ display: "inline-block", background: N.blue, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 32px", borderRadius: 8, textDecoration: "none", marginBottom: 12, fontWeight: 700, boxShadow: "0 6px 20px rgba(0,128,255,0.5)" }}>
            Join Monthly — $27/mo
          </a>
          <div style={{ marginBottom: 24 }}>
            <a href="https://buy.stripe.com/14A5kD4B981AgTxcuM18c09" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.orange, textDecoration: "none", letterSpacing: "0.08em", fontWeight: 700 }}>
              Or join annual — $270/year
            </a>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, background: "none", border: "none", cursor: "pointer", letterSpacing: "0.08em", textDecoration: "underline" }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const plan = member?.plan || "monthly";
  const isAnnual = plan === "annual";

  const tabDefs = [
    { key: "tools", label: "Tool Library" },
    { key: "workspace", label: "My Work" },
    { key: "debrief", label: "The Debrief" },
    { key: "court", label: "Court of Accounts" },
    { key: "shop", label: "Shop" },
    { key: "account", label: "Account" },
  ];
  const navTabs = tabDefs.map(t => ({ label: t.label, active: activeTab === t.key, href: "#" }));

  const statPills = [
    { n: allTools.length || "—", label: "tools live", color: "blue" },
    { n: debriefs.length || "—", label: "Debriefs", color: "pink" },
    { n: allTools.filter(t => t.tag === "NEW").length || "0", label: "new this week", color: "orange" },
    { n: "Weekly", label: "drops", color: "ink" },
  ];

  const navRight = (
    <>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", background: isAnnual ? "linear-gradient(135deg,#C9A84C,#e0c060)" : N.blue, color: isAnnual ? N.ink : N.white, padding: "5px 12px", borderRadius: 100, fontWeight: 700, boxShadow: isAnnual ? "0 3px 10px rgba(201,168,76,0.35)" : "0 3px 10px rgba(0,128,255,0.4)" }}>
        {isAnnual ? "Annual" : "Monthly"}
      </div>
      <span style={{ fontSize: 12, color: N.muted, fontFamily: "'DM Mono', monospace" }}>{session.user.email}</span>
      <button onClick={handleLogout} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid " + N.rule, background: "transparent", color: N.muted, fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>Log out</button>
    </>
  );

  // Rebind tab clicks — turn the NeonNav pills into tab switchers by overlaying onClick.
  const navTabsBound = navTabs.map((t, i) => ({
    ...t,
    href: "javascript:void(0)",
    onClick: () => setActiveTab(tabDefs[i].key),
  }));

  return (
    <div style={{ minHeight: "100vh", background: WASH_BG_LITE, fontFamily: "'Figtree', sans-serif", color: N.ink }}>
      <style>{MOBILE_DASH}</style>
      <link href={FONT_LINK} rel="stylesheet" />

      {/* HERO LOGO + SPOTLIGHT */}
      <LogoHero right={<SpotlightCallout />} hrefHome="#" />

      {/* STAT PULSE */}
      <div style={{ background: N.white, padding: "0 0 16px" }}>
        <StatPills pills={statPills} />
      </div>

      {/* STICKY NAV WITH TABS */}
      <header style={{ background: N.white, borderBottom: "1px solid " + N.rule, padding: 0, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <a href="#" onClick={e => { e.preventDefault(); setActiveTab("tools"); }} style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>
                CARES <span style={{ color: N.blueHot, fontStyle: "italic" }}>Works.</span>
              </span>
            </a>
            <div style={{ display: "flex", gap: 4, background: N.wall, borderRadius: 10, padding: 4, border: "1px solid " + N.rule }}>
              {tabDefs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: activeTab === t.key ? N.blue : "transparent", color: activeTab === t.key ? N.white : N.muted, fontSize: 12, fontWeight: activeTab === t.key ? 700 : 500, cursor: "pointer", boxShadow: activeTab === t.key ? "0 4px 14px rgba(0,128,255,0.4)" : "none", fontFamily: "'Figtree', sans-serif" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{navRight}</div>
        </div>
      </header>

      <div className="dash-page" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 60px" }}>

        {/* TOOLS TAB */}
        {activeTab === "tools" && (
          <>
            <div style={{ marginBottom: 32 }}>
              <h1 className="dash-h1" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: N.ink, marginBottom: 8, lineHeight: 1.15 }}>
                Welcome back{member?.full_name ? ", " : ""}
                {member?.full_name && <span style={HERO_TEXT_GRAD_BLUE}>{member.full_name.split(" ")[0]}</span>}
                .
              </h1>
              <p style={{ color: N.ink, fontSize: 17, lineHeight: 1.55, marginBottom: 6, maxWidth: 720 }}>
                Tools, Debriefs, and practical business systems for people who are done letting chaos run the meeting.
              </p>
              <p style={{ color: N.muted, fontSize: 14, fontStyle: "italic" }}>
                Start with one problem. Find one tool. Fix one thing.
              </p>
            </div>

            {/* PICK UP WHERE YOU LEFT OFF */}
            {recentSessions.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, margin: "0 0 4px" }}>Pick up where you left off</h2>
                <p style={{ color: N.muted, fontSize: 13.5, margin: "0 0 16px" }}>Your most recent work, ready to reopen — no hunting through tools.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                  {recentSessions.map(s => (
                    <button key={s.id} onClick={() => { const h = s.href; if (h && h.startsWith("/steward")) { window.location.href = h; } else if (h) { navigate(h); } else { navigate("/tools/" + s.tool_slug); } }}
                      style={{ textAlign: "left", background: N.white, border: `2px solid ${N.blue}`, borderRadius: 12, padding: "16px 18px", cursor: "pointer", fontFamily: "'Figtree', sans-serif", display: "flex", flexDirection: "column", gap: 6, boxShadow: `0 0 20px rgba(0,128,255,0.35), 0 0 40px rgba(0,128,255,0.15)` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span style={{ fontSize: 20 }}>{s.tool_icon || "🗂️"}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: N.blue, fontWeight: 700 }}>{s.tool_title || "Tool"}</span>
                      </div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: N.ink, lineHeight: 1.25 }}>{s.name || "Untitled work"}</div>
                      <div style={{ fontSize: 11.5, color: N.muted, fontFamily: "'DM Mono', monospace" }}>
                        Edited {s.updated_at ? new Date(s.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""} · Reopen →
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* START HERE — tri-color neon boxes */}
            <div style={{ marginBottom: 12, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: N.muted, fontWeight: 700 }}>START HERE</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginBottom: 44 }}>
              {[
                { emoji: "👋", title: "Watch the 2-Minute Welcome", desc: "What this place is, how it works, and where not to panic.", btn: "Watch Welcome", onClick: () => setShowWelcomeModal(true), color: N.orange, rgb: N_RGB.orange },
                { emoji: "🧭", title: "Learn the Layout", desc: "Tools, Debriefs, downloads, categories, and how to find what you need fast.", btn: "How This Works", onClick: () => setShowHowToModal(true), color: N.pink, rgb: N_RGB.pink },
                { emoji: "🔥", title: "What's New This Week", desc: "Latest tools, newest Debriefs, featured fixes, and current chaos containment.", btn: "See What's New", onClick: () => { const el = document.getElementById("tool-grid"); if (el) el.scrollIntoView({ behavior: "smooth" }); else setShowHowToModal(true); }, color: N.blue, rgb: N_RGB.blue },
              ].map(card => (
                <NeonBox key={card.title} color={card.color} rgb={card.rgb} style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 26, lineHeight: 1 }}>{card.emoji}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: N.ink, lineHeight: 1.25 }}>{card.title}</div>
                  <div style={{ fontSize: 13, color: N.muted, lineHeight: 1.5, flex: 1 }}>{card.desc}</div>
                  <NeonBtn color={card.color} onClick={card.onClick}>{card.btn} →</NeonBtn>
                </NeonBox>
              ))}
            </div>

            {/* SEARCH BAR */}
            <div style={{ marginBottom: 16, position: "relative" }} className="dash-filter-search">
              <input type="text" placeholder="Search tools…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "12px 40px 12px 44px", fontSize: 14, fontFamily: "'Figtree', sans-serif", background: N.white, border: "2px solid " + N.rule, borderRadius: 10, outline: "none", color: N.ink, boxSizing: "border-box", transition: "border-color 0.15s, box-shadow 0.15s" }}
                onFocus={e => { e.target.style.borderColor = N.blue; e.target.style.boxShadow = "0 0 0 4px rgba(0,128,255,0.15)"; }}
                onBlur={e => { e.target.style.borderColor = N.rule; e.target.style.boxShadow = "none"; }} />
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: N.muted, pointerEvents: "none" }}>🔍</span>
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: N.muted, fontSize: 18, cursor: "pointer", padding: 4 }}>×</button>
              )}
            </div>

            {/* LIBRARY HELPER */}
            <div style={{ marginBottom: 14 }}>
              <button onClick={() => setShowLibraryHelp(v => !v)}
                style={{ background: "transparent", border: "none", color: N.blue, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 0" }}>
                {showLibraryHelp ? "− Hide" : "+ How"} to use the Tool Library
              </button>
              {showLibraryHelp && (
                <NeonBox color={N.blue} rgb={N_RGB.blue} scale={0.7} style={{ padding: "18px 22px", marginTop: 8 }}>
                  <div style={{ color: N.ink, fontSize: 14, lineHeight: 1.6 }}>
                    <p style={{ margin: "0 0 12px" }}>
                      Use the <strong>search bar</strong> when you know what you need. Use the <strong>category buttons</strong> when you only know what kind of problem you have. Use <strong>Free / Member / New</strong> to narrow the list.
                    </p>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.blue, marginBottom: 6, fontWeight: 700 }}>CATEGORIES</div>
                    <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontSize: 13, color: N.muted }}>
                      <li><strong style={{ color: N.ink }}>Bookkeeping</strong> — numbers, cleanup, QuickBooks, charts of accounts, ledgers, year-end triage.</li>
                      <li><strong style={{ color: N.ink }}>Money</strong> — pricing, budgeting, cash flow, financial decisions, owner clarity.</li>
                      <li><strong style={{ color: N.ink }}>People</strong> — hiring, onboarding, HR, payroll, team, accountability.</li>
                      <li><strong style={{ color: N.ink }}>Client Work</strong> — intake, scope, proposals, client communication, project tracking.</li>
                      <li><strong style={{ color: N.ink }}>Leadership</strong> — management systems, decision-making, meetings, follow-through.</li>
                      <li><strong style={{ color: N.ink }}>Utilities</strong> — miscellaneous helpers, trackers, checklists, small-but-mighty fixes.</li>
                    </ul>
                  </div>
                </NeonBox>
              )}
            </div>

            {/* CATEGORY CHIPS */}
            <div className="dash-cat-tabs" style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <button onClick={() => setSelectedCats([])}
                style={{ padding: "8px 16px", borderRadius: 100, border: selectedCats.length === 0 ? "none" : "1.5px solid " + N.rule, background: selectedCats.length === 0 ? N.ink : N.white, color: selectedCats.length === 0 ? N.white : N.muted, fontSize: 12, fontWeight: selectedCats.length === 0 ? 700 : 500, cursor: "pointer", fontFamily: "'Figtree', sans-serif", boxShadow: selectedCats.length === 0 ? "0 4px 14px rgba(0,0,0,0.15)" : "none" }}>
                All
              </button>
              {CATEGORY_ORDER.map(c => {
                const isActive = selectedCats.includes(c);
                const color = CAT_COLOR[c];
                return (
                  <button key={c} onClick={() => toggleCat(c)}
                    style={{ padding: "8px 16px", borderRadius: 100, border: isActive ? "none" : "1.5px solid " + N.rule, background: isActive ? color : N.white, color: isActive ? N.white : N.muted, fontSize: 12, fontWeight: isActive ? 700 : 500, cursor: "pointer", fontFamily: "'Figtree', sans-serif", display: "flex", alignItems: "center", gap: 6, boxShadow: isActive ? `0 4px 14px ${color}66` : "none" }}>
                    <span>{CAT_ICONS[c]}</span>{CAT_LABELS[c]}
                  </button>
                );
              })}
            </div>

            {/* TIER + NEW + COUNT */}
            <div className="dash-filter-bar" style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 4, background: N.white, border: "1.5px solid " + N.rule, borderRadius: 100, padding: 3 }}>
                {[{ k: "all", l: "All" }, { k: "free", l: "Free" }, { k: "member", l: "Member" }].map(opt => (
                  <button key={opt.k} onClick={() => setTierFilter(opt.k)}
                    style={{ padding: "6px 16px", borderRadius: 100, border: "none", background: tierFilter === opt.k ? N.blue : "transparent", color: tierFilter === opt.k ? N.white : N.muted, fontSize: 11, fontWeight: tierFilter === opt.k ? 700 : 500, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", boxShadow: tierFilter === opt.k ? "0 3px 10px rgba(0,128,255,0.4)" : "none" }}>
                    {opt.l}
                  </button>
                ))}
              </div>
              <button onClick={() => setNewOnly(!newOnly)}
                style={{ padding: "6px 16px", borderRadius: 100, border: newOnly ? "none" : "1.5px solid " + N.rule, background: newOnly ? N.orange : N.white, color: newOnly ? N.white : N.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", boxShadow: newOnly ? `0 3px 10px rgba(255,138,42,0.5)` : "none" }}>
                ✨ New only
              </button>
              {hasActiveFilters && (
                <button onClick={clearFilters}
                  style={{ background: "transparent", border: "none", color: N.blue, fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", padding: "6px 8px", fontWeight: 700 }}>
                  Clear filters
                </button>
              )}
              <div style={{ marginLeft: "auto", fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, letterSpacing: "0.06em" }}>
                Showing {filteredTools.length} of {allTools.length} tools
              </div>
            </div>

            {/* VIEW TOGGLE */}
            {!toolsLoading && filteredTools.length > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 4, background: N.white, border: "1.5px solid " + N.rule, borderRadius: 100, padding: 3 }}>
                  {[{ k: "featured", l: "✨ Featured" }, { k: "grid", l: "▦ Grid" }].map(o => (
                    <button key={o.k} onClick={() => changeView(o.k)}
                      style={{ padding: "6px 16px", borderRadius: 100, border: "none", background: viewMode === o.k ? N.ink : "transparent", color: viewMode === o.k ? N.white : N.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TOOLS */}
            <div id="tool-grid" />
            {toolsLoading ? (
              <NeonBox color={N.blue} rgb={N_RGB.blue} scale={0.5} style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ color: N.muted, fontFamily: "'DM Mono', monospace", fontSize: 13, letterSpacing: "0.06em" }}>Loading your tool library…</div>
              </NeonBox>
            ) : filteredTools.length === 0 ? (
              <NeonBox color={N.blue} rgb={N_RGB.blue} scale={0.6} style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 8 }}>No tools match your filters.</div>
                <p style={{ fontSize: 14, marginBottom: 16, color: N.muted }}>Try clearing the filters or searching for something else.</p>
                <NeonBtn color={N.blue} onClick={clearFilters}>Clear filters</NeonBtn>
              </NeonBox>
            ) : viewMode === "featured" ? (
              (() => {
                const n = filteredTools.length;
                const idx = ((featIdx % n) + n) % n;
                const t = filteredTools[idx];
                const buttonText = t.href ? "Open tool →" : "Get this tool →";
                const color = CAT_COLOR[t.category] || N.blue;
                const rgb = CAT_RGB[t.category] || N_RGB.blue;
                const arrowStyle = { flexShrink: 0, width: 46, alignSelf: "stretch", border: "1.5px solid " + N.rule, background: N.white, borderRadius: 12, color: N.ink, fontSize: 26, cursor: "pointer", fontFamily: "'Figtree', sans-serif" };
                return (
                  <div>
                    <div className="dash-featured-row" style={{ display: "flex", alignItems: "stretch", gap: 12 }}>
                      <button onClick={() => setFeatIdx(i => i - 1)} aria-label="Previous tool" style={arrowStyle}>‹</button>
                      <NeonBox color={color} rgb={rgb} scale={1.4} style={{ flex: 1, padding: "38px 42px", display: "flex", flexDirection: "column", gap: 16, minHeight: 300 }}>
                        {t.tag && <div style={{ position: "absolute", top: 18, right: 18, background: t.tag === "FREE" ? N.green : color, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", padding: "4px 10px", borderRadius: 100, boxShadow: `0 0 14px ${t.tag === "FREE" ? N.green : color}` }}>{t.tag}</div>}
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ width: 64, height: 64, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, background: `rgba(${rgb},0.12)`, border: `1.5px solid ${color}`, flexShrink: 0 }}>{t.icon}</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: color, fontWeight: 700 }}>{CAT_LABELS[t.category]}</div>
                            <div style={{ alignSelf: "flex-start", fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: t.tier === "free" ? N.green : color, background: t.tier === "free" ? "rgba(34,197,94,0.12)" : `rgba(${rgb},0.1)`, padding: "3px 9px", borderRadius: 100 }}>{t.tier === "free" ? "Free" : "Member"}</div>
                          </div>
                        </div>
                        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, lineHeight: 1.2, color: N.ink }}>{t.title}</div>
                        <div style={{ fontSize: 16, color: N.muted, lineHeight: 1.6, flex: 1 }}>{t.desc}</div>
                        {t.why && (
                          <div style={{ borderTop: "1px solid " + N.rule, paddingTop: 14 }}>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: color, marginBottom: 5 }}>💡 Why you'd use this</div>
                            <div style={{ fontSize: 15, color: N.ink, lineHeight: 1.55 }}>{t.why}</div>
                          </div>
                        )}
                        {t.href ? (
                          <a href={t.href} target="_blank" rel="noopener noreferrer"
                            style={{ alignSelf: "flex-start", padding: "12px 24px", background: color, border: "none", borderRadius: 8, color: N.white, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", textDecoration: "none", boxShadow: `0 4px 14px ${color}88` }}>
                            {buttonText}
                          </a>
                        ) : (
                          <NeonBtn color={color} onClick={() => navigate("/tools/" + t.slug)} style={{ alignSelf: "flex-start", padding: "12px 24px", fontSize: 14 }}>
                            {buttonText}
                          </NeonBtn>
                        )}
                      </NeonBox>
                      <button onClick={() => setFeatIdx(i => i + 1)} aria-label="Next tool" style={arrowStyle}>›</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 18 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: N.muted, letterSpacing: "0.1em" }}>
                        {idx + 1} <span style={{ opacity: 0.5 }}>/ {n}</span> · use ← → or the arrows
                      </div>
                      {n <= 14 && (
                        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center" }}>
                          {filteredTools.map((_, i) => (
                            <button key={i} onClick={() => setFeatIdx(i)} aria-label={"Go to tool " + (i + 1)}
                              style={{ width: i === idx ? 22 : 8, height: 8, borderRadius: 100, border: "none", background: i === idx ? color : N.rule, cursor: "pointer", padding: 0, transition: "all 0.15s" }} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="dash-tools-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 22 }}>
                {filteredTools.map(t => {
                  const buttonText = t.href ? "Open tool →" : "Get this tool →";
                  const color = CAT_COLOR[t.category] || N.blue;
                  const rgb = CAT_RGB[t.category] || N_RGB.blue;
                  return (
                    <NeonBox key={t.title} color={color} rgb={rgb} style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                      {t.tag && <div style={{ position: "absolute", top: 14, right: 14, background: t.tag === "FREE" ? N.green : color, color: N.white, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", padding: "3px 8px", borderRadius: 100, boxShadow: `0 0 14px ${t.tag === "FREE" ? N.green : color}` }}>{t.tag}</div>}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: `rgba(${rgb},0.1)`, border: `1.5px solid ${color}` }}>{t.icon}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: color, fontWeight: 700 }}>{CAT_LABELS[t.category]}</div>
                      </div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, lineHeight: 1.3, color: N.ink }}>{t.title}</div>
                      <div style={{ fontSize: 13, color: N.muted, lineHeight: 1.55, flex: 1 }}>{t.desc}</div>
                      {t.why && (
                        <div style={{ borderTop: "1px solid " + N.rule, paddingTop: 11 }}>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: color, marginBottom: 4 }}>💡 Why you'd use this</div>
                          <div style={{ fontSize: 12.5, color: N.ink, lineHeight: 1.5 }}>{t.why}</div>
                        </div>
                      )}
                      {t.href ? (
                        <a href={t.href} target="_blank" rel="noopener noreferrer"
                          style={{ marginTop: 6, padding: "10px 18px", background: color, border: "none", borderRadius: 8, color: N.white, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", textDecoration: "none", display: "block", textAlign: "left", boxShadow: `0 4px 14px ${color}88` }}>
                          {buttonText}
                        </a>
                      ) : (
                        <NeonBtn color={color} onClick={() => navigate("/tools/" + t.slug)}>{buttonText}</NeonBtn>
                      )}
                    </NeonBox>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* MY WORK */}
        {activeTab === "workspace" && <Workspace session={session} />}

        {/* THE DEBRIEF */}
        {activeTab === "debrief" && (
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: N.ink, marginBottom: 6 }}>The Debrief</h1>
            <p style={{ color: N.muted, fontSize: 15, marginBottom: 28, maxWidth: 700 }}>
              Short business breakdowns. Why your vendor list is telling on you. Why cash flow is not a vibe. Honest answers to the questions you got tired of asking.
            </p>

            {!debriefsLoading && debriefs.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                {["All", "Invisible Leaks", "The Drawer of Doom", "Nobody Told Owners This", "Fixed It Friday", "Live From My Business Feelings"].map(cat => {
                  const active = debriefCategory === cat;
                  return (
                    <button key={cat} onClick={() => setDebriefCategory(cat)}
                      style={{ padding: "8px 16px", borderRadius: 100, border: active ? "none" : "1.5px solid " + N.rule, background: active ? N.pink : N.white, color: active ? N.white : N.muted, fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "'Figtree', sans-serif", boxShadow: active ? `0 4px 14px ${N.pink}66` : "none" }}>
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            {debriefsLoading ? (
              <NeonBox color={N.pink} rgb={N_RGB.pink} scale={0.5} style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ color: N.muted, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>Loading the Debriefs…</div>
              </NeonBox>
            ) : debriefs.length === 0 ? (
              <NeonBox color={N.pink} rgb={N_RGB.pink} scale={0.5} style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>☕</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 8 }}>No Debriefs yet.</div>
                <p style={{ fontSize: 14, color: N.muted }}>Check back soon — first issues are brewing.</p>
              </NeonBox>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {debriefs.filter(d => debriefCategory === "All" || d.category === debriefCategory).map(d => {
                  const isOpen = openDebriefSlug === d.slug;
                  return (
                    <NeonBox key={d.slug} color={N.pink} rgb={N_RGB.pink} scale={isOpen ? 1.2 : 0.8} style={{ padding: 0, overflow: "hidden" }}>
                      <div data-debrief-slug={d.slug} onClick={() => setOpenDebriefSlug(isOpen ? null : d.slug)}
                        style={{ padding: "20px 26px", cursor: "pointer" }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: N.pink, marginBottom: 6, fontWeight: 700 }}>
                          {d.category}
                        </div>
                        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 8, lineHeight: 1.3 }}>{d.title}</h3>
                        <p style={{ color: N.muted, fontSize: 14, lineHeight: 1.55, margin: 0 }}>{d.summary}</p>
                        {!isOpen && (
                          <div style={{ marginTop: 12, fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.pink, fontWeight: 700, letterSpacing: "0.08em" }}>
                            READ →
                          </div>
                        )}
                      </div>
                      {isOpen && (
                        <div style={{ borderTop: "1px solid " + N.rule, padding: "24px 26px", background: "rgba(255,45,138,0.04)" }}>
                          {d.body && d.body.split("\n\n").map((para, i) => (
                            <p key={i} style={{ fontSize: 15, color: N.ink, lineHeight: 1.7, marginBottom: 14, whiteSpace: "pre-wrap" }}>{para}</p>
                          ))}
                          {d.cta_text && d.cta_link && (
                            <a href={d.cta_link} onClick={e => { if (d.cta_link.startsWith("/tools/")) { e.preventDefault(); navigate(d.cta_link); } }}
                              style={{ display: "inline-block", marginTop: 8, padding: "11px 22px", background: N.pink, color: N.white, textDecoration: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "'Figtree', sans-serif", boxShadow: `0 4px 14px ${N.pink}66` }}>
                              {d.cta_text} →
                            </a>
                          )}
                          <button onClick={() => setOpenDebriefSlug(null)}
                            style={{ marginTop: 16, marginLeft: 12, background: "transparent", border: "none", color: N.muted, fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: "pointer", letterSpacing: "0.08em" }}>
                            ↑ Close
                          </button>
                        </div>
                      )}
                    </NeonBox>
                  );
                })}
              </div>
            )}

            <NeonBox color={N.blue} rgb={N_RGB.blue} scale={0.8} style={{ padding: "24px 28px", marginTop: 32 }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 8 }}>Submit a question for next month</h3>
              <p style={{ color: N.muted, fontSize: 14, marginBottom: 16 }}>Kari answers real member questions every month. What are you stuck on?</p>
              <textarea placeholder="What's your question for Kari?" rows={4}
                style={{ width: "100%", padding: "12px 16px", background: N.white, border: "1.5px solid " + N.rule, borderRadius: 8, color: N.ink, fontSize: 14, fontFamily: "'Figtree', sans-serif", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.5 }} />
              <NeonBtn color={N.blue} style={{ marginTop: 12 }}>Submit Question →</NeonBtn>
            </NeonBox>
          </div>
        )}

        {/* COURT OF ACCOUNTS */}
        {activeTab === "court" && (
          <div>
            <div style={{ display: "flex", gap: 32, alignItems: "flex-start", marginBottom: 36, flexWrap: "wrap" }}>
              <img src="/court-of-accounts-cover.jpg" alt="Court of Accounts — A Tale of Ledgers, Loyalty, and Fancy Chickens"
                style={{ width: 180, height: "auto", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,128,255,0.28)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: N.orange, marginBottom: 10, fontWeight: 700 }}>The Serialized Parable</div>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, color: N.ink, marginBottom: 12, lineHeight: 1.15 }}>Court of Accounts</h1>
                <p style={{ color: N.ink, fontSize: 15, marginBottom: 16, fontStyle: "italic", fontFamily: "'DM Serif Display', serif" }}>A Tale of Ledgers, Loyalty, and Fancy Chickens.</p>
                <p style={{ color: N.muted, fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
                  A business parable set in the Kingdom of Eggerton. One chapter drops per month — a tiny kingdom learns the difference between busy and profitable, the cost of loyalty, and what to do when the chickens get fancy.
                </p>
                {isAnnual ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ display: "inline-block", background: "linear-gradient(135deg,#C9A84C,#e0c060)", color: N.ink, fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 100, letterSpacing: "0.08em" }}>Annual member — full book unlocked</div>
                    <a href="/court-of-accounts.pdf" download style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'DM Mono', monospace", fontSize: 12, color: N.blue, textDecoration: "none", letterSpacing: "0.08em", fontWeight: 700 }}>
                      📖 Download full book PDF ↓
                    </a>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: N.muted, fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>Monthly members read one chapter at a time. Annual members get the full book on day one.</div>
                )}
              </div>
            </div>

            <NeonBox color={N.orange} rgb={N_RGB.orange} scale={0.6} style={{ padding: "16px 22px", marginBottom: 36, display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: N.ink, fontStyle: "italic", lineHeight: 1.5 }}>
                Enter only if you have a whimsical sense of humor. Numbered accounts, fancy chickens, and a court that takes itself only mostly seriously. Hats encouraged. Hardhats not required.
              </div>
            </NeonBox>

            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: N.ink, marginBottom: 16 }}>Chapters</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {COURT_CHAPTERS.map(ch => (
                <NeonBox key={ch.slug} color={N.blue} rgb={N_RGB.blue} scale={0.7} style={{ padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: N.muted, fontWeight: 700 }}>{ch.label}</div>
                      {ch.hasAudio && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", background: `rgba(${N_RGB.orange},0.12)`, color: N.orange, padding: "2px 7px", borderRadius: 100, fontWeight: 700, border: `1px solid ${N.orange}` }}>🎧 Audio</div>}
                    </div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink }}>{ch.title}</div>
                  </div>
                  {ch.available || isAnnual ? (
                    <NeonBtn color={N.blue} onClick={() => navigate("/court/" + ch.slug)}>Read →</NeonBtn>
                  ) : (
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>Unlocks next month</div>
                  )}
                </NeonBox>
              ))}
            </div>
          </div>
        )}

        {/* SHOP */}
        {activeTab === "shop" && (
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: N.ink, marginBottom: 6 }}>Shop</h1>
            <p style={{ color: N.muted, fontSize: 15, marginBottom: 8 }}>Bundles — the tools grouped the way you actually need them. One-time purchase, yours forever.</p>
            {isAnnual && <div style={{ display: "inline-block", background: "linear-gradient(135deg,#C9A84C,#e0c060)", color: N.ink, fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 100, marginBottom: 32, letterSpacing: "0.08em" }}>🏷️ Annual members save $20 on every bundle</div>}
            {!isAnnual && <p style={{ fontSize: 13, color: N.muted, fontFamily: "'DM Mono', monospace", marginBottom: 32, letterSpacing: "0.05em" }}>Annual members get $20 off every bundle.</p>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 22 }}>
              {[
                { icon: "💼", title: "The Bookkeeping Starter Kit", desc: "Chart of Accounts template. IIF import files. Monthly close checklist. QuickBooks setup guide. Everything you need to start keeping books that make sense.", color: N.blue, rgb: N_RGB.blue },
                { icon: "👥", title: "The HR Starter Kit", desc: "Offer letter templates. Employee handbook starter. New hire 30-day sequence. Separation scripts. Progressive discipline docs. HR without the HR team.", color: N.pink, rgb: N_RGB.pink },
                { icon: "📊", title: "The Founder's Operating System", desc: "Busyness audit. Net profit ratios. Pricing framework. Advisory team builder. Meeting planner. The thinking tools that separate busy from profitable.", color: N.orange, rgb: N_RGB.orange },
                { icon: "💰", title: "The Year-End Panic Button", desc: "Everything you need in December: 1099 prep, W-2 checklist, QuickBooks cleanup protocol, CPA handoff packet. For when it's suddenly January.", color: N.blue, rgb: N_RGB.blue },
              ].map(kit => (
                <NeonBox key={kit.title} color={kit.color} rgb={kit.rgb} scale={0.8} style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: `rgba(${kit.rgb},0.1)`, border: `1.5px solid ${kit.color}` }}>{kit.icon}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, lineHeight: 1.25, color: N.ink }}>{kit.title}</div>
                  <div style={{ fontSize: 13, color: N.muted, lineHeight: 1.55, flex: 1 }}>{kit.desc}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: kit.color, marginTop: 8, fontWeight: 700 }}>🔨 Coming soon</div>
                </NeonBox>
              ))}
            </div>
          </div>
        )}

        {/* ACCOUNT */}
        {activeTab === "account" && (
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: N.ink, marginBottom: 6 }}>Your Account</h1>
            <p style={{ color: N.muted, fontSize: 15, marginBottom: 40 }}>Membership details and billing.</p>

            <NeonBox color={N.blue} rgb={N_RGB.blue} scale={0.8} style={{ padding: "28px", marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: N.blue, marginBottom: 16, fontWeight: 700 }}>Membership</div>
              <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 12, color: N.muted, marginBottom: 4 }}>Email</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: N.ink }}>{session.user.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: N.muted, marginBottom: 4 }}>Plan</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: N.ink, textTransform: "capitalize" }}>{plan}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: N.muted, marginBottom: 4 }}>Status</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: N.green }}>{member?.status || "Active"}</div>
                </div>
              </div>
            </NeonBox>

            <NeonBox color={N.pink} rgb={N_RGB.pink} scale={0.6} style={{ padding: "28px", marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: N.pink, marginBottom: 12, fontWeight: 700 }}>Share With a Friend</div>
              <p style={{ fontSize: 14, color: N.muted, marginBottom: 18, lineHeight: 1.55 }}>
                Know someone who needs CARES Works? Send them <strong style={{ color: N.ink, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>tools.caresmn.com</strong> — when they visit without a login, they'll see the public landing page.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a href="/?public=1" target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-block", padding: "10px 18px", background: "transparent", border: `1.5px solid ${N.pink}`, borderRadius: 8, color: N.pink, fontSize: 13, fontWeight: 700, fontFamily: "'Figtree', sans-serif", textDecoration: "none" }}>
                  Preview public site →
                </a>
                <button onClick={() => { navigator.clipboard?.writeText("https://tools.caresmn.com"); alert("Copied! tools.caresmn.com is on your clipboard."); }}
                  style={{ padding: "10px 18px", background: "transparent", border: "1.5px solid " + N.rule, borderRadius: 8, color: N.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
                  Copy link to share
                </button>
              </div>
            </NeonBox>

            {isAnnual && (
              <NeonBox color={N.orange} rgb={N_RGB.orange} scale={1.1} style={{ padding: "28px 32px", marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: N.orange, marginBottom: 12, fontWeight: 700 }}>✨ Annual Member Perks</div>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 6, lineHeight: 1.2 }}>The Vault</h3>
                <p style={{ fontSize: 14, color: N.muted, marginBottom: 20, lineHeight: 1.5 }}>Everything you get for being here early.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                  <a href="/court-of-accounts.pdf" download
                    style={{ background: N.white, border: `1.5px solid ${N.orange}`, borderRadius: 10, padding: "18px 20px", textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 22 }}>📖</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: N.ink, lineHeight: 1.3 }}>Court of Accounts — Full Book</div>
                    <div style={{ fontSize: 13, color: N.muted, lineHeight: 1.5 }}>Download the complete PDF. Yours to keep.</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.orange, letterSpacing: "0.08em", fontWeight: 700, marginTop: 4 }}>Download PDF ↓</div>
                  </a>
                  {[
                    { icon: "🚪", title: "Early Access", desc: "New tools land for you 7 days before monthly members.", tag: "Always on" },
                    { icon: "🎧", title: "Court of Accounts Audiobook", desc: "Every chapter, read aloud. Download or stream.", tag: "🔨 Coming soon" },
                    { icon: "📋", title: "Printable One-Pagers", desc: "Every checklist as a PDF. Print, laminate, tape to the wall.", tag: "🔨 Coming soon" },
                    { icon: "🎟️", title: "Quarterly Office Hours", desc: "Live Q&A with Kari. One hour. Annual members only.", tag: "🔨 Coming soon" },
                    { icon: "🏷️", title: "$20 Off Every Bundle", desc: "Your annual discount code for any Shop bundle.", tag: "🔨 Coming soon" },
                  ].map(perk => (
                    <div key={perk.title} style={{ background: N.white, border: `1.5px solid ${N.orange}`, borderRadius: 10, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ fontSize: 22 }}>{perk.icon}</div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: N.ink, lineHeight: 1.3 }}>{perk.title}</div>
                      <div style={{ fontSize: 13, color: N.muted, lineHeight: 1.5 }}>{perk.desc}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: N.orange, marginTop: 4, fontWeight: 700 }}>{perk.tag}</div>
                    </div>
                  ))}
                </div>
              </NeonBox>
            )}

            {!isAnnual && (
              <NeonBox color={N.orange} rgb={N_RGB.orange} scale={1.0} style={{ padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 4 }}>Upgrade to Annual</div>
                  <p style={{ fontSize: 14, color: N.muted }}>$270/year — save two months. Get the full Court of Accounts book on day one.</p>
                </div>
                <a href="https://buy.stripe.com/14A5kD4B981AgTxcuM18c09" style={{ padding: "12px 24px", background: N.orange, border: "none", borderRadius: 8, color: N.white, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", textDecoration: "none", whiteSpace: "nowrap", boxShadow: `0 4px 14px ${N.orange}88` }}>
                  Upgrade →
                </a>
              </NeonBox>
            )}
          </div>
        )}
      </div>

      <SignatureFooter />

      {/* MODAL: Welcome video */}
      {showWelcomeModal && (
        <div onClick={() => setShowWelcomeModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: N.white, maxWidth: 560, width: "100%", borderRadius: 14, padding: "32px 36px", position: "relative", maxHeight: "90vh", overflowY: "auto", border: `2px solid ${N.blue}`, boxShadow: `0 0 40px rgba(0,128,255,0.4)` }}>
            <button onClick={() => setShowWelcomeModal(false)}
              style={{ position: "absolute", top: 12, right: 14, background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: N.muted }}>×</button>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: N.blue, marginBottom: 8, fontWeight: 700 }}>WELCOME VIDEO</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink, marginBottom: 16, lineHeight: 1.2 }}>Welcome to the workshop.</h2>
            <div style={{ position: "relative", paddingBottom: "62.5%", height: 0, marginBottom: 18, borderRadius: 10, overflow: "hidden", background: "#000" }}>
              <iframe src="https://www.loom.com/embed/c3d53986bd4b4594995d1b0187c8678c" frameBorder="0" allow="autoplay; fullscreen" allowFullScreen
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
            </div>
            <p style={{ fontSize: 14, color: N.ink, lineHeight: 1.6, marginBottom: 4 }}>
              When you're done watching — pick one pain point. Open one tool. Use it before you collect more.
            </p>
            <p style={{ fontSize: 14, color: N.muted, fontStyle: "italic" }}>That's the whole magic trick.</p>
          </div>
        </div>
      )}

      {/* MODAL: How this works */}
      {showHowToModal && (
        <div onClick={() => setShowHowToModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: N.white, maxWidth: 680, width: "100%", borderRadius: 14, padding: "32px 40px", position: "relative", maxHeight: "90vh", overflowY: "auto", border: `2px solid ${N.pink}`, boxShadow: `0 0 40px rgba(255,45,138,0.4)` }}>
            <button onClick={() => setShowHowToModal(false)}
              style={{ position: "absolute", top: 12, right: 14, background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: N.muted }}>×</button>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: N.pink, marginBottom: 8, fontWeight: 700 }}>HOW THIS WORKS</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: N.ink, marginBottom: 14, lineHeight: 1.2 }}>How CARES Works… works.</h2>
            <p style={{ fontSize: 15, color: N.ink, lineHeight: 1.65, marginBottom: 22 }}>
              CARES Works is built like a practical business workshop. You do not have to use everything at once. In fact, please do not. That way lies the spreadsheet bog.
            </p>
            <p style={{ fontSize: 15, color: N.ink, lineHeight: 1.65, marginBottom: 24 }}>
              Start with the problem you have today. Then grab the tool, watch the Debrief, or ask for help when the situation needs human eyes.
            </p>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: N.muted, marginBottom: 10, fontWeight: 700 }}>MAIN AREAS</div>
            {[
              { icon: "🛠️", title: "Tool Library", body: "Downloadable systems, templates, trackers, checklists, and operational shortcuts. Use the search bar or category filters to find the thing that matches your current business problem." },
              { icon: "📂", title: "My Work", body: 'Your saved tools, active downloads, and resources you are currently using. This is the "where did I put that thing?" room.' },
              { icon: "☕", title: "The Debrief", body: "Short business lessons and practical breakdowns about operational leaks, money messes, management problems, workflow fixes, and the weird human behavior that makes business harder than it needs to be." },
              { icon: "⚖️", title: "Court of Accounts", body: "Financial education with a little kingdom drama and a lot less accountant fog. Use this when you want to understand what your numbers are trying to tell you." },
              { icon: "🛒", title: "Shop", body: "Standalone products, bundles, kits, and other useful business tools." },
              { icon: "👤", title: "Account", body: "Your membership, subscription, login details, and account settings." },
            ].map(area => (
              <div key={area.title} style={{ marginBottom: 16, padding: "14px 18px", background: N.white, border: "1.5px solid " + N.rule, borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{area.icon}</span>
                  <strong style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: N.ink }}>{area.title}</strong>
                </div>
                <div style={{ fontSize: 13.5, color: N.ink, lineHeight: 1.55 }}>{area.body}</div>
              </div>
            ))}
            <div style={{ marginTop: 24, padding: "18px 22px", background: N.ink, borderRadius: 10, color: N.white, boxShadow: `0 0 20px rgba(0,128,255,0.35)` }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: N.blueHot, marginBottom: 8, fontWeight: 700, textShadow: `0 0 8px ${N.blueHot}` }}>YOUR FIRST 15 MINUTES</div>
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
