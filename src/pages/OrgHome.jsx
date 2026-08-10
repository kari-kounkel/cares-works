import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";
import { N, N_RGB, FONT_LINK, NeonBox, NeonBtn, SignatureFooter, WASH_BG_LITE, HERO_TEXT_GRAD_BLUE } from "../design/neon";
import FacilitiesMap from "../components/FacilitiesMap";

const MOBILE = `
  @media (max-width: 900px) {
    .oh-frame { flex-direction: column !important; }
    .oh-sidebar { width: 100% !important; position: static !important; padding-bottom: 20px !important; }
    .oh-sidebar-nav { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
    .oh-main { padding: 20px !important; }
    .oh-stat-row { grid-template-columns: 1fr 1fr !important; }
  }
`;

const ACCENTS = {
  blue:   { color: N.blue,   rgb: N_RGB.blue },
  orange: { color: N.orange, rgb: N_RGB.orange },
  pink:   { color: N.pink,   rgb: N_RGB.pink },
  green:  { color: N.green,  rgb: "34,197,94" },
};

const SIDEBAR_SECTIONS = [
  { key: "home",         emoji: "🏠", label: "Home" },
  { key: "financials",   emoji: "💰", label: "Financials" },
  { key: "facilities",   emoji: "🏛", label: "Facilities" },
  { key: "meetings",     emoji: "📝", label: "Meetings & Minutes" },
  { key: "newsletter",   emoji: "📮", label: "Newsletter" },
  { key: "fundraisers",  emoji: "🎯", label: "Fundraisers" },
  { key: "documents",    emoji: "📁", label: "Documents" },
];

const SIDEBAR_JUMP = [
  { key: "library",   emoji: "🛠️", label: "Tool Library",     href: "/dashboard?tab=tools" },
  { key: "workspace", emoji: "📂", label: "My Work",           href: "/dashboard?tab=workspace" },
  { key: "debrief",   emoji: "☕", label: "The Debrief",       href: "/dashboard?tab=debrief" },
  { key: "court",     emoji: "⚖️", label: "Court of Accounts", href: "/dashboard?tab=court" },
  { key: "shop",      emoji: "🛒", label: "Shop",              href: "/dashboard?tab=shop" },
  { key: "account",   emoji: "👤", label: "Account",           href: "/dashboard?tab=account" },
];

function money(n) {
  if (n === null || n === undefined) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function OrgHome({ slug, session }) {
  const [org, setOrg] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [section, setSection] = useState("home");

  const [meetings, setMeetings] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [fundraisers, setFundraisers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [ledger, setLedger] = useState(null);     // { funds:[], income_ytd, expenses_ytd, entry_count }
  const [rawEntries, setRawEntries] = useState([]);  // full ledger_entries so we can snapshot balances as of ANY date
  const [rawFunds,   setRawFunds]   = useState([]);
  const [invites, setInvites] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [rentalRequests, setRentalRequests] = useState([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState(null);

  // Compose modal — one form used for meetings, newsletters, fundraisers
  const [composeType, setComposeType] = useState(null); // 'meeting' | 'newsletter' | 'fundraiser' | null
  const [composeRow, setComposeRow]   = useState(null); // null = new; row = edit

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteTitle, setInviteTitle] = useState("Board Member");
  const [inviteSaving, setInviteSaving] = useState(false);
  const [invitedLink, setInvitedLink] = useState("");

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data: o, error: oe } = await supabase.from("organizations").select("*").eq("slug", slug).maybeSingle();
      if (oe || !o) { setError("You don't have access to this workspace."); setLoading(false); return; }
      setOrg(o);

      const ledgerOrgId = o.primary_ledger_org_id;
      const [{ data: mem }, m, nl, fr, docs, inv, funds, entries, sp, rt, rspLinks, rq] = await Promise.all([
        supabase.from("organization_members").select("*").eq("org_id", o.id).eq("user_email", session.user.email).maybeSingle(),
        supabase.from("org_meetings").select("*").eq("org_id", o.id).order("meeting_date", { ascending: false }),
        supabase.from("org_newsletters").select("*").eq("org_id", o.id).order("issue_date", { ascending: false }),
        supabase.from("org_fundraisers").select("*").eq("org_id", o.id).order("ends_on", { ascending: true }),
        supabase.from("org_documents").select("*").eq("org_id", o.id).order("created_at", { ascending: false }),
        supabase.from("org_invites").select("*").eq("org_id", o.id).order("created_at", { ascending: false }),
        ledgerOrgId ? supabase.from("ledger_funds").select("id,name,is_restricted,archived").eq("org_id", ledgerOrgId).eq("archived", false).order("name") : Promise.resolve({ data: [] }),
        ledgerOrgId ? supabase.from("ledger_entries").select("fund_id,direction,amount_cents,entry_date").eq("org_id", ledgerOrgId) : Promise.resolve({ data: [] }),
        supabase.from("org_spaces").select("*").eq("org_id", o.id).order("sort_order", { ascending: true }),
        supabase.from("org_rentals").select("*").eq("org_id", o.id).order("starts_at", { ascending: true }),
        supabase.from("org_rental_spaces").select("rental_id, space_id"),
        supabase.from("org_rental_requests").select("*").eq("org_id", o.id).order("created_at", { ascending: false }),
      ]);
      setMe(mem);
      setMeetings(m.data || []);
      setNewsletters(nl.data || []);
      setFundraisers(fr.data || []);
      setDocuments(docs.data || []);
      setInvites(inv.data || []);
      setSpaces(sp.data || []);
      // Attach space_ids array to each rental via the link table
      const linksByRental = new Map();
      (rspLinks.data || []).forEach(l => {
        if (!linksByRental.has(l.rental_id)) linksByRental.set(l.rental_id, []);
        linksByRental.get(l.rental_id).push(l.space_id);
      });
      setRentals((rt.data || []).map(r => ({ ...r, space_ids: linksByRental.get(r.id) || [] })));
      setRentalRequests(rq.data || []);

      if (ledgerOrgId) {
        const entryRows = entries.data || [];
        const fundList  = funds.data || [];
        setRawEntries(entryRows);
        setRawFunds(fundList);
        const income  = entryRows.filter(e => e.direction === "in").reduce((s, e) => s + Number(e.amount_cents || 0), 0) / 100;
        const outflow = entryRows.filter(e => e.direction === "out").reduce((s, e) => s + Number(e.amount_cents || 0), 0) / 100;
        const fundBalances = fundList.map(f => {
          const bal = entryRows
            .filter(e => e.fund_id === f.id)
            .reduce((s, e) => s + (e.direction === "in" ? Number(e.amount_cents || 0) : -Number(e.amount_cents || 0)), 0) / 100;
          return { ...f, balance: bal };
        });
        setLedger({ funds: fundBalances, income_ytd: income, expenses_ytd: outflow, entry_count: entryRows.length });
      }
      setLoading(false);
    })();
  }, [session, slug]);

  const inviteSubmit = async () => {
    if (!org) return;
    setInviteSaving(true);
    setInvitedLink("");
    const { data, error: err } = await supabase.from("org_invites").insert({
      org_id: org.id,
      invited_email: inviteEmail.trim() || null,
      invited_name: inviteName.trim() || null,
      invited_title: inviteTitle.trim() || null,
      invited_role: "viewer",
      invited_by: session.user.email,
    }).select().single();
    setInviteSaving(false);
    if (err) { alert("Could not create invite: " + err.message); return; }
    const url = window.location.origin + "/view/" + data.token;
    setInvitedLink(url);
    setInvites(prev => [data, ...prev]);
    setInviteEmail(""); setInviteName(""); setInviteTitle("Board Member");
    try { await navigator.clipboard.writeText(url); } catch (e) {}
  };

  // --- COMPOSE (add / edit) ---------------------------------------
  const TABLE_FOR = { meeting: "org_meetings", newsletter: "org_newsletters", fundraiser: "org_fundraisers" };
  const openCompose = (type, row = null) => { setComposeType(type); setComposeRow(row); };
  const closeCompose = () => { setComposeType(null); setComposeRow(null); };

  const composeSave = async (fields) => {
    if (!composeType || !org) return null;
    const table = TABLE_FOR[composeType];
    const payload = { ...fields, org_id: org.id, created_by: composeRow?.created_by || session.user.email };
    let result;
    if (composeRow) {
      result = await supabase.from(table).update(payload).eq("id", composeRow.id).select().single();
    } else {
      result = await supabase.from(table).insert(payload).select().single();
    }
    if (result.error) { alert("Save failed: " + result.error.message); return null; }
    // Refresh local state
    const row = result.data;
    if (composeType === "meeting")    setMeetings   (prev => composeRow ? prev.map(x => x.id === row.id ? row : x) : [row, ...prev].sort((a,b) => (b.meeting_date > a.meeting_date ? 1 : -1)));
    if (composeType === "newsletter") setNewsletters(prev => composeRow ? prev.map(x => x.id === row.id ? row : x) : [row, ...prev]);
    if (composeType === "fundraiser") setFundraisers(prev => composeRow ? prev.map(x => x.id === row.id ? row : x) : [row, ...prev]);
    closeCompose();
    return row;
  };

  // Share ONE link to the whole workspace. Use the existing invite (Invite button
  // in the header) — this doesn't need per-document links. The board bookmarks the
  // /view/:token URL once and sees everything, always.

  // FROZEN financial snapshot as of a specific date. Sums all ledger entries
  // where entry_date <= asOfDate, grouped by fund. Used inside each meeting
  // card so the numbers a board member sees NEVER drift after the meeting.
  const snapshotAsOf = (asOfDate) => {
    if (!asOfDate || rawEntries.length === 0) return null;
    const asOf = asOfDate.slice ? asOfDate.slice(0, 10) : asOfDate;
    const filtered = rawEntries.filter(e => (e.entry_date || "") <= asOf);
    const income  = filtered.filter(e => e.direction === "in" ).reduce((s, e) => s + Number(e.amount_cents || 0), 0) / 100;
    const outflow = filtered.filter(e => e.direction === "out").reduce((s, e) => s + Number(e.amount_cents || 0), 0) / 100;
    const funds = rawFunds.map(f => {
      const bal = filtered
        .filter(e => e.fund_id === f.id)
        .reduce((s, e) => s + (e.direction === "in" ? Number(e.amount_cents || 0) : -Number(e.amount_cents || 0)), 0) / 100;
      return { id: f.id, name: f.name, is_restricted: f.is_restricted, balance: bal };
    });
    const totalOnHand = funds.reduce((s, f) => s + f.balance, 0);
    return { funds, income_ytd: income, expenses_ytd: outflow, on_hand: totalOnHand, entry_count: filtered.length, as_of: asOf };
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: WASH_BG_LITE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif", color: N.muted }}>
        <link href={FONT_LINK} rel="stylesheet" />
        Loading your workspace…
      </div>
    );
  }

  if (error || !org) {
    return (
      <div style={{ minHeight: "100vh", background: WASH_BG_LITE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif", padding: 24 }}>
        <link href={FONT_LINK} rel="stylesheet" />
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: N.ink, marginBottom: 12 }}>{error || "Workspace not found."}</h1>
          <p style={{ color: N.muted, fontSize: 14, marginBottom: 20 }}>You may not be a member of this organization yet.</p>
          <a href="/dashboard" style={{ display: "inline-block", padding: "10px 20px", background: N.blue, color: N.white, borderRadius: 8, textDecoration: "none", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em", fontWeight: 700 }}>Back to CARES Works →</a>
        </div>
      </div>
    );
  }

  const accent = ACCENTS[org.accent] || ACCENTS.blue;

  // Derive quick stats
  const totalGoal = fundraisers.filter(f => f.status === "active").reduce((s, f) => s + Number(f.goal_amount || 0), 0);
  const totalRaised = fundraisers.filter(f => f.status === "active").reduce((s, f) => s + Number(f.raised_amount || 0), 0);
  const ledgerFunds = ledger?.funds || [];
  const totalOnHand = ledgerFunds.reduce((s, f) => s + Number(f.balance || 0), 0);
  const nextMeeting = meetings[0];
  const draftLetter = newsletters.find(n => n.status === "draft");
  const activeFundraisers = fundraisers.filter(f => f.status === "active");

  return (
    <div style={{ minHeight: "100vh", background: WASH_BG_LITE, fontFamily: "'Figtree', sans-serif", color: N.ink }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{MOBILE}</style>

      {/* ORG HEADER */}
      <header style={{ background: N.white, borderBottom: "1px solid " + N.rule, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: accent.color, color: N.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 700, boxShadow: `0 4px 14px ${accent.color}88` }}>
              {org.short_name || org.name[0]}
            </div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, lineHeight: 1.15 }}>{org.name}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, textTransform: "uppercase", marginTop: 2 }}>
                {org.location} · {org.org_type} {me?.title ? "· " + me.title : ""}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => { setShowInvite(true); setInvitedLink(""); }}
              style={{ padding: "6px 14px", background: accent.color, color: N.white, border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", fontWeight: 700, boxShadow: `0 3px 10px ${accent.color}66` }}>
              + Invite
            </button>
            <a href="/dashboard?tab=tools" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, textDecoration: "none", letterSpacing: "0.08em" }}>CARES Works →</a>
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
              style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid " + N.rule, background: "transparent", color: N.muted, fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>Log out</button>
          </div>
        </div>
      </header>

      {/* FRAME: sidebar + main */}
      <div className="oh-frame" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 24, padding: "24px 24px 40px", alignItems: "flex-start" }}>

        {/* SIDEBAR */}
        <aside className="oh-sidebar" style={{ width: 240, flexShrink: 0, position: "sticky", top: 84 }}>
          <div className="oh-sidebar-nav" style={{ display: "flex", flexDirection: "column", gap: 4, background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 8 }}>
            {SIDEBAR_SECTIONS.map(s => {
              const active = section === s.key;
              return (
                <button key={s.key} onClick={() => setSection(s.key)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "none", background: active ? accent.color : "transparent", color: active ? N.white : N.ink, fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "'Figtree', sans-serif", textAlign: "left", boxShadow: active ? `0 3px 10px ${accent.color}66` : "none" }}>
                  <span style={{ fontSize: 16 }}>{s.emoji}</span>{s.label}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 14, padding: "10px 12px 6px", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: N.muted, fontWeight: 700 }}>OR JUMP TO</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 8 }}>
            {SIDEBAR_JUMP.map(j => (
              <a key={j.key} href={j.href}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, color: N.muted, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Figtree', sans-serif", textDecoration: "none" }}>
                <span style={{ fontSize: 16 }}>{j.emoji}</span>{j.label}
              </a>
            ))}
          </div>
        </aside>

        {/* MAIN */}
        <main className="oh-main" style={{ flex: 1, minWidth: 0 }}>

          {section === "home" && (
            <>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: accent.color, fontWeight: 700, marginBottom: 8 }}>YOUR ORG WORKSPACE</div>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, color: N.ink, marginBottom: 8, lineHeight: 1.1 }}>
                  Welcome back to <span style={HERO_TEXT_GRAD_BLUE}>{org.short_name || org.name}</span>.
                </h1>
                <p style={{ color: N.muted, fontSize: 15, lineHeight: 1.55, maxWidth: 640, fontStyle: "italic" }}>{org.tagline}</p>
              </div>

              {/* SNAPSHOT ROW */}
              <div className="oh-stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 26 }}>
                <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "18px 20px" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: accent.color, fontWeight: 700, marginBottom: 6 }}>ON HAND</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink }}>{money(totalOnHand)}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, marginTop: 4 }}>across {ledgerFunds.length || 0} funds</div>
                </NeonBox>
                <NeonBox color={N.pink} rgb={N_RGB.pink} style={{ padding: "18px 20px" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: N.pink, fontWeight: 700, marginBottom: 6 }}>RAISED (ACTIVE)</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink }}>{money(totalRaised)}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, marginTop: 4 }}>of {money(totalGoal)} goal</div>
                </NeonBox>
                <NeonBox color={N.blue} rgb={N_RGB.blue} style={{ padding: "18px 20px" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: N.blue, fontWeight: 700, marginBottom: 6 }}>ACTIVE FUNDRAISERS</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink }}>{activeFundraisers.length}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, marginTop: 4 }}>currently running</div>
                </NeonBox>
                <NeonBox color={N.orange} rgb={N_RGB.orange} style={{ padding: "18px 20px" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: N.orange, fontWeight: 700, marginBottom: 6 }}>LAST MEETING</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, lineHeight: 1.2 }}>{nextMeeting ? fmtDate(nextMeeting.meeting_date) : "None"}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, marginTop: 4 }}>{nextMeeting?.title || "log your first"}</div>
                </NeonBox>
              </div>

              {/* WHAT NEEDS YOU */}
              <NeonBox color={accent.color} rgb={accent.rgb} scale={1.3} style={{ padding: "24px 28px", marginBottom: 22 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: accent.color, fontWeight: 700, marginBottom: 10 }}>WHAT NEEDS YOU TODAY</div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {draftLetter && (
                    <li style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: N.white, border: "1px solid " + N.rule, borderRadius: 8 }}>
                      <span style={{ fontSize: 18 }}>📮</span>
                      <span style={{ flex: 1, fontSize: 14, color: N.ink }}>Newsletter draft: <strong>{draftLetter.title}</strong></span>
                      <button onClick={() => setSection("newsletter")} style={{ background: "transparent", border: "none", color: accent.color, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.06em" }}>Finish →</button>
                    </li>
                  )}
                  {activeFundraisers.map(f => (
                    <li key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: N.white, border: "1px solid " + N.rule, borderRadius: 8 }}>
                      <span style={{ fontSize: 18 }}>🎯</span>
                      <span style={{ flex: 1, fontSize: 14, color: N.ink }}>{f.name} · <span style={{ color: N.muted }}>{money(f.raised_amount)} of {money(f.goal_amount)}{f.ends_on ? " · ends " + fmtDate(f.ends_on) : ""}</span></span>
                      <button onClick={() => setSection("fundraisers")} style={{ background: "transparent", border: "none", color: accent.color, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.06em" }}>Open →</button>
                    </li>
                  ))}
                  {nextMeeting && nextMeeting.next_steps && (
                    <li style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: N.white, border: "1px solid " + N.rule, borderRadius: 8 }}>
                      <span style={{ fontSize: 18 }}>📝</span>
                      <div style={{ flex: 1, fontSize: 13.5, color: N.ink, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: N.muted, marginBottom: 4 }}>NEXT STEPS FROM {fmtDate(nextMeeting.meeting_date).toUpperCase()}</div>
                        {nextMeeting.next_steps}
                      </div>
                    </li>
                  )}
                </ul>
              </NeonBox>
            </>
          )}

          {section === "financials" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: accent.color, fontWeight: 700, marginBottom: 8 }}>YOUR MONEY</div>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 8 }}>Financials</h1>
                <p style={{ color: N.muted, fontSize: 14 }}>Fund balances and year-to-date activity from your ledger.</p>
              </div>
              {ledger && ledger.funds.length > 0 ? (
                <>
                  {/* YTD income / expenses / net */}
                  <div className="oh-stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                    <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "18px 20px" }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: accent.color, fontWeight: 700, marginBottom: 6 }}>INCOME (YTD)</div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink }}>{money(ledger.income_ytd)}</div>
                    </NeonBox>
                    <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "18px 20px" }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: accent.color, fontWeight: 700, marginBottom: 6 }}>EXPENSES (YTD)</div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink }}>{money(ledger.expenses_ytd)}</div>
                    </NeonBox>
                    <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "18px 20px" }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: accent.color, fontWeight: 700, marginBottom: 6 }}>NET (YTD)</div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: (ledger.income_ytd - ledger.expenses_ytd) >= 0 ? N.green : N.red }}>{money(ledger.income_ytd - ledger.expenses_ytd)}</div>
                    </NeonBox>
                  </div>

                  <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "22px 24px", marginBottom: 16 }}>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 4 }}>Fund balances</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, marginBottom: 14 }}>{ledger.entry_count} entries · {ledger.funds.length} funds</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 14 }}>
                      {ledger.funds.map(f => (
                        <div key={f.id} style={{ padding: "12px 14px", background: N.white, border: `1px solid ${N.rule}`, borderRadius: 8, position: "relative" }}>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, marginBottom: 4 }}>
                            {f.name.toUpperCase()}{f.is_restricted ? " · RESTRICTED" : ""}
                          </div>
                          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{money(f.balance)}</div>
                        </div>
                      ))}
                    </div>
                    <NeonBtn color={accent.color} onClick={() => navigate("/tools/ledger?org=" + org.primary_ledger_org_id)}>Open the full Ledger →</NeonBtn>
                  </NeonBox>
                  <p style={{ color: N.muted, fontSize: 13, fontStyle: "italic" }}>Live from CARES Ledger — the numbers here update whenever you add entries in the Ledger tool.</p>
                </>
              ) : (
                <NeonBox color={accent.color} rgb={accent.rgb} scale={0.7} style={{ padding: "28px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>💰</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 8 }}>No ledger linked yet.</div>
                  <p style={{ color: N.muted, fontSize: 14, marginBottom: 14 }}>Kari can link this workspace to your CARES Ledger org so balances land here.</p>
                  <NeonBtn color={accent.color} onClick={() => navigate("/tools/ledger")}>Open Ledger →</NeonBtn>
                </NeonBox>
              )}
            </div>
          )}

          {section === "facilities" && (
            <div>
              <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: accent.color, fontWeight: 700, marginBottom: 8 }}>SPACES & RENTALS</div>
                  <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 8 }}>Facilities</h1>
                  <p style={{ color: N.muted, fontSize: 14 }}>The map shows what's in use at the moment you pick. Rentable rooms are white; internal-only are grey.</p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a href={"/rent/" + org.slug} target="_blank" rel="noopener noreferrer"
                    style={{ padding: "8px 14px", background: N.white, border: `1.5px solid ${accent.color}`, borderRadius: 8, color: accent.color, fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", textDecoration: "none" }}>
                    👁 PUBLIC RENT PAGE
                  </a>
                </div>
              </div>

              {spaces.length === 0 ? (
                <NeonBox color={accent.color} rgb={accent.rgb} scale={0.7} style={{ padding: "28px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🏛</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 8 }}>No spaces set up yet.</div>
                  <p style={{ color: N.muted, fontSize: 14 }}>Add spaces via SQL or the admin console for now.</p>
                </NeonBox>
              ) : (
                <FacilitiesMap spaces={spaces} rentals={rentals} accent={accent} onSpaceClick={s => setSelectedSpaceId(prev => prev === s.id ? null : s.id)} />
              )}

              {/* CLICK-A-ROOM PANEL */}
              {selectedSpaceId && (() => {
                const s = spaces.find(x => x.id === selectedSpaceId);
                if (!s) return null;
                const roomRentals = rentals
                  .filter(r => (r.space_ids || []).includes(s.id))
                  .filter(r => {
                    const endTs = new Date(r.ends_at).getTime();
                    const untilTs = r.recurs_until ? new Date(r.recurs_until + "T23:59:59").getTime() : Infinity;
                    return endTs >= Date.now() || untilTs >= Date.now();
                  })
                  .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
                return (
                  <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "20px 24px", marginTop: 20 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: accent.color, fontWeight: 700 }}>SELECTED ROOM</div>
                        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{s.name}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.category}{s.capacity ? ` · ${s.capacity} capacity` : ""}{!s.rentable ? " · INTERNAL ONLY" : ""}</div>
                      </div>
                      <button onClick={() => setSelectedSpaceId(null)}
                        style={{ background: "transparent", border: `1px solid ${N.rule}`, color: N.muted, padding: "6px 14px", borderRadius: 6, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer", fontWeight: 700 }}>CLOSE ×</button>
                    </div>
                    {(s.hourly_rate || s.daily_rate || s.member_rate) && (
                      <div style={{ padding: "10px 14px", background: `rgba(${accent.rgb},0.05)`, borderRadius: 8, marginBottom: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
                        {s.hourly_rate && <div><span style={{ fontSize: 11, color: N.muted, fontFamily: "'DM Mono', monospace" }}>HOURLY </span><strong>${Number(s.hourly_rate).toFixed(2)}</strong></div>}
                        {s.member_rate && <div><span style={{ fontSize: 11, color: N.muted, fontFamily: "'DM Mono', monospace" }}>MEMBER </span><strong>${Number(s.member_rate).toFixed(2)}</strong></div>}
                        {s.daily_rate && <div><span style={{ fontSize: 11, color: N.muted, fontFamily: "'DM Mono', monospace" }}>DAILY </span><strong>${Number(s.daily_rate).toFixed(2)}</strong></div>}
                      </div>
                    )}
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: N.muted, fontWeight: 700, marginBottom: 10 }}>UPCOMING RENTALS IN THIS ROOM · {roomRentals.length}</div>
                    {roomRentals.length === 0 ? (
                      <div style={{ padding: "16px", background: N.white, border: `1px dashed ${N.rule}`, borderRadius: 8, textAlign: "center", color: N.muted, fontSize: 13 }}>No upcoming rentals for this room.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {roomRentals.map(r => (
                          <div key={r.id} style={{ padding: "10px 14px", background: N.white, border: `1px solid ${N.rule}`, borderRadius: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                              <div>
                                <div style={{ fontSize: 14, color: N.ink, fontWeight: 700 }}>{r.renter_name}{r.renter_org ? " · " + r.renter_org : ""}</div>
                                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted }}>
                                  {r.recurs_weekdays?.length ? r.recurs_weekdays.join(",") + " · " : ""}
                                  {new Date(r.starts_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} → {new Date(r.ends_at).toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })}
                                  {r.recurs_until ? " · until " + fmtDate(r.recurs_until) : ""}
                                </div>
                                {r.purpose && <div style={{ fontSize: 12, color: N.muted, marginTop: 4, fontStyle: "italic" }}>{r.purpose}</div>}
                              </div>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", padding: "3px 10px", borderRadius: 100, background: r.status === "confirmed" ? `rgba(${accent.rgb},0.15)` : "#eef0f6", color: r.status === "confirmed" ? accent.color : N.muted, fontWeight: 700, height: "fit-content" }}>{r.status.toUpperCase()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </NeonBox>
                );
              })()}

              {/* Requests inbox */}
              {rentalRequests.filter(r => r.status === "pending").length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: accent.color, fontWeight: 700, marginBottom: 10 }}>PENDING REQUESTS · {rentalRequests.filter(r => r.status === "pending").length}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {rentalRequests.filter(r => r.status === "pending").map(r => (
                      <NeonBox key={r.id} color={accent.color} rgb={accent.rgb} style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: N.ink }}>{r.requester_name}{r.requester_org ? " · " + r.requester_org : ""}</div>
                            <div style={{ fontSize: 12, color: N.muted, marginTop: 2 }}>{r.requester_email}{r.requester_phone ? " · " + r.requester_phone : ""}</div>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.ink, marginTop: 6 }}>{fmtDate(r.requested_starts_at)} → {fmtDate(r.requested_ends_at)}</div>
                            {r.purpose && <div style={{ fontSize: 13, color: N.muted, marginTop: 6, fontStyle: "italic" }}>{r.purpose}</div>}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", padding: "3px 10px", borderRadius: 100, background: N.pink, color: N.white, fontWeight: 700, textAlign: "center" }}>PENDING</span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, textAlign: "center" }}>{fmtDate(r.created_at)}</span>
                          </div>
                        </div>
                      </NeonBox>
                    ))}
                  </div>
                </div>
              )}

              {/* UPCOMING RENTALS — chronological, future + still-active recurring */}
              {(() => {
                const upcoming = rentals
                  .filter(r => r.status !== "cancelled")
                  .filter(r => {
                    const endTs = new Date(r.ends_at).getTime();
                    const untilTs = r.recurs_until ? new Date(r.recurs_until + "T23:59:59").getTime() : Infinity;
                    return endTs >= Date.now() || untilTs >= Date.now();
                  })
                  .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
                if (upcoming.length === 0) {
                  return (
                    <div style={{ marginTop: 24 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.muted, fontWeight: 700, marginBottom: 10 }}>UPCOMING RENTALS</div>
                      <div style={{ padding: 20, textAlign: "center", color: N.muted, fontSize: 13, background: N.white, border: `1px dashed ${N.rule}`, borderRadius: 8 }}>Nothing on the schedule yet. Standing rentals + one-offs will show here.</div>
                    </div>
                  );
                }
                return (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.muted, fontWeight: 700, marginBottom: 10 }}>UPCOMING RENTALS · {upcoming.length}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {upcoming.map(r => {
                        const roomNames = (r.space_ids || []).map(id => spaces.find(s => s.id === id)?.name).filter(Boolean);
                        return (
                          <div key={r.id} style={{ padding: "10px 14px", background: N.white, border: `1px solid ${N.rule}`, borderRadius: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", cursor: "pointer" }}
                               onClick={() => { if (r.space_ids?.[0]) setSelectedSpaceId(r.space_ids[0]); }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <div style={{ fontSize: 14, color: N.ink, fontWeight: 700 }}>{r.renter_name}{r.renter_org ? " · " + r.renter_org : ""}</div>
                              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted }}>
                                {r.recurs_weekdays?.length ? r.recurs_weekdays.join(",") + " · " : ""}
                                {new Date(r.starts_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} → {new Date(r.ends_at).toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })}
                                {r.recurs_until ? " · until " + fmtDate(r.recurs_until) : ""}
                              </div>
                              {roomNames.length > 0 && (
                                <div style={{ fontSize: 11, color: accent.color, fontFamily: "'DM Mono', monospace", marginTop: 2, letterSpacing: "0.04em" }}>
                                  🏛 {roomNames.join(" · ")}
                                </div>
                              )}
                            </div>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", padding: "3px 10px", borderRadius: 100, background: r.status === "confirmed" ? `rgba(${accent.rgb},0.15)` : "#eef0f6", color: r.status === "confirmed" ? accent.color : N.muted, fontWeight: 700 }}>{r.status.toUpperCase()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {section === "meetings" && (
            <div>
              <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: accent.color, fontWeight: 700, marginBottom: 8 }}>BOARD & TEAM</div>
                  <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 8 }}>Meetings & Minutes</h1>
                  <p style={{ color: N.muted, fontSize: 14 }}>Every meeting, every decision, every next step. Nothing falls off.</p>
                </div>
                <NeonBtn color={accent.color} onClick={() => openCompose("meeting")}>+ Add meeting</NeonBtn>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {meetings.length === 0 ? (
                  <NeonBox color={accent.color} rgb={accent.rgb} scale={0.7} style={{ padding: "28px 24px", textAlign: "center" }}>
                    <div style={{ color: N.muted, fontSize: 14, marginBottom: 12 }}>No meetings logged yet.</div>
                    <NeonBtn color={accent.color} onClick={() => openCompose("meeting")}>+ Log your first meeting</NeonBtn>
                  </NeonBox>
                ) : meetings.map(m => (
                  <NeonBox key={m.id} color={accent.color} rgb={accent.rgb} style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, gap: 10 }}>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: N.ink }}>{m.title || "Board Meeting"}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", color: accent.color, fontWeight: 700 }}>{fmtDate(m.meeting_date)}</div>
                        <button onClick={() => openCompose("meeting", m)} style={{ background: "transparent", border: "none", color: N.muted, fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", fontWeight: 700 }}>EDIT</button>
                      </div>
                    </div>
                    {m.attendees && <div style={{ fontSize: 12, color: N.muted, marginBottom: 8 }}>👥 {m.attendees}</div>}
                    {m.agenda && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: N.muted, marginBottom: 4 }}>AGENDA</div>
                        <div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, color: N.ink, lineHeight: 1.55 }}>{m.agenda}</div>
                      </div>
                    )}
                    {m.minutes && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: N.muted, marginBottom: 4 }}>MINUTES</div>
                        <div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, color: N.ink, lineHeight: 1.55 }}>{m.minutes}</div>
                      </div>
                    )}
                    {m.next_steps && (
                      <div style={{ padding: "10px 12px", background: `rgba(${accent.rgb},0.08)`, borderRadius: 8, borderLeft: `3px solid ${accent.color}` }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: accent.color, marginBottom: 4, fontWeight: 700 }}>NEXT STEPS</div>
                        <div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, color: N.ink, lineHeight: 1.55 }}>{m.next_steps}</div>
                      </div>
                    )}
                    {(() => {
                      const snap = snapshotAsOf(m.meeting_date);
                      if (!snap || snap.funds.length === 0) return null;
                      return (
                        <div style={{ marginTop: 12, padding: "14px 16px", background: N.white, border: `1.5px solid ${accent.color}`, borderRadius: 10 }}>
                          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, gap: 10 }}>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: accent.color, fontWeight: 700 }}>💰 FINANCIAL SNAPSHOT — FROZEN AS OF {fmtDate(m.meeting_date).toUpperCase()}</div>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted }}>{snap.entry_count} entries</div>
                          </div>
                          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 12 }}>
                            <div>
                              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: N.muted }}>ON HAND</div>
                              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{money(snap.on_hand)}</div>
                            </div>
                            <div>
                              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: N.muted }}>INCOME (TO-DATE)</div>
                              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{money(snap.income_ytd)}</div>
                            </div>
                            <div>
                              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: N.muted }}>EXPENSES (TO-DATE)</div>
                              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{money(snap.expenses_ytd)}</div>
                            </div>
                            <div>
                              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: N.muted }}>NET</div>
                              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: (snap.income_ytd - snap.expenses_ytd) >= 0 ? N.green : N.red }}>{money(snap.income_ytd - snap.expenses_ytd)}</div>
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                            {snap.funds.map(f => (
                              <div key={f.id} style={{ padding: "8px 10px", background: `rgba(${accent.rgb},0.04)`, borderRadius: 6, border: `1px solid ${N.rule}` }}>
                                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", color: N.muted, textTransform: "uppercase" }}>{f.name}{f.is_restricted ? " · restricted" : ""}</div>
                                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: N.ink }}>{money(f.balance)}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: 10, fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, fontStyle: "italic" }}>
                            These numbers are computed from the ledger at meeting time. They won't change even if new entries are added later.
                          </div>
                        </div>
                      );
                    })()}
                  </NeonBox>
                ))}
              </div>
            </div>
          )}

          {section === "newsletter" && (
            <div>
              <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: accent.color, fontWeight: 700, marginBottom: 8 }}>DONORS & COMMUNITY</div>
                  <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 8 }}>Newsletter</h1>
                  <p style={{ color: N.muted, fontSize: 14 }}>Drafts, sent issues, and the running record of what you told your supporters.</p>
                </div>
                <NeonBtn color={accent.color} onClick={() => openCompose("newsletter")}>+ New newsletter</NeonBtn>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {newsletters.length === 0 ? (
                  <NeonBox color={accent.color} rgb={accent.rgb} scale={0.7} style={{ padding: "28px 24px", textAlign: "center" }}>
                    <div style={{ color: N.muted, fontSize: 14, marginBottom: 12 }}>No newsletter drafts yet.</div>
                    <NeonBtn color={accent.color} onClick={() => openCompose("newsletter")}>+ Start a draft</NeonBtn>
                  </NeonBox>
                ) : newsletters.map(n => (
                  <NeonBox key={n.id} color={accent.color} rgb={accent.rgb} style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, gap: 10 }}>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: N.ink }}>{n.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", padding: "3px 10px", borderRadius: 100, background: n.status === "sent" ? `rgba(${N_RGB.blue},0.12)` : `rgba(${accent.rgb},0.15)`, color: n.status === "sent" ? N.blue : accent.color, fontWeight: 700 }}>{n.status.toUpperCase()}</span>
                        <button onClick={() => openCompose("newsletter", n)} style={{ background: "transparent", border: "none", color: N.muted, fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", fontWeight: 700 }}>EDIT</button>
                      </div>
                    </div>
                    {n.issue_date && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, marginBottom: 10 }}>{fmtDate(n.issue_date)}</div>}
                    {n.body && <div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, color: N.ink, lineHeight: 1.65 }}>{n.body}</div>}
                  </NeonBox>
                ))}
              </div>
            </div>
          )}

          {section === "fundraisers" && (
            <div>
              <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: accent.color, fontWeight: 700, marginBottom: 8 }}>CAMPAIGNS</div>
                  <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 8 }}>Fundraisers</h1>
                  <p style={{ color: N.muted, fontSize: 14 }}>Active appeals, capital campaigns, matching grants. Track goal vs. raised, deadlines, and notes.</p>
                </div>
                <NeonBtn color={accent.color} onClick={() => openCompose("fundraiser")}>+ New fundraiser</NeonBtn>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {fundraisers.length === 0 ? (
                  <NeonBox color={accent.color} rgb={accent.rgb} scale={0.7} style={{ padding: "28px 24px", textAlign: "center" }}>
                    <div style={{ color: N.muted, fontSize: 14, marginBottom: 12 }}>No fundraisers tracked yet.</div>
                    <NeonBtn color={accent.color} onClick={() => openCompose("fundraiser")}>+ New fundraiser</NeonBtn>
                  </NeonBox>
                ) : fundraisers.map(f => {
                  const pct = f.goal_amount ? Math.min(100, Math.round((Number(f.raised_amount || 0) / Number(f.goal_amount)) * 100)) : 0;
                  return (
                    <NeonBox key={f.id} color={accent.color} rgb={accent.rgb} style={{ padding: "20px 22px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4, gap: 10 }}>
                        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: N.ink }}>{f.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", padding: "3px 10px", borderRadius: 100, background: f.status === "active" ? `rgba(${accent.rgb},0.15)` : "#eef0f6", color: f.status === "active" ? accent.color : N.muted, fontWeight: 700 }}>{f.status.toUpperCase()}</span>
                          <button onClick={() => openCompose("fundraiser", f)} style={{ background: "transparent", border: "none", color: N.muted, fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", fontWeight: 700 }}>EDIT</button>
                        </div>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, marginBottom: 12 }}>
                        {f.campaign_type.replace(/_/g, " ").toUpperCase()}{f.ends_on ? " · ends " + fmtDate(f.ends_on) : ""}
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: N.ink }}>{money(f.raised_amount)}</span>
                        <span style={{ fontSize: 13, color: N.muted }}>of {money(f.goal_amount)} goal · {pct}%</span>
                      </div>
                      <div style={{ height: 8, background: N.rule, borderRadius: 100, overflow: "hidden", marginBottom: f.notes ? 12 : 0 }}>
                        <div style={{ width: pct + "%", height: "100%", background: accent.color, boxShadow: `0 0 12px ${accent.color}` }} />
                      </div>
                      {f.notes && <div style={{ fontSize: 13, color: N.muted, lineHeight: 1.55, fontStyle: "italic" }}>{f.notes}</div>}
                    </NeonBox>
                  );
                })}
              </div>
            </div>
          )}

          {section === "documents" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: accent.color, fontWeight: 700, marginBottom: 8 }}>FILING CABINET</div>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 8 }}>Documents</h1>
                <p style={{ color: N.muted, fontSize: 14 }}>Bylaws, 501(c)(3) letter, insurance, policies. The stuff a board member asks for once a year.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                {documents.length === 0 ? (
                  <NeonBox color={accent.color} rgb={accent.rgb} scale={0.7} style={{ padding: "28px 24px", textAlign: "center", gridColumn: "1 / -1" }}>
                    <div style={{ color: N.muted, fontSize: 14, marginBottom: 12 }}>No documents uploaded yet.</div>
                    <NeonBtn color={accent.color}>+ Upload a document</NeonBtn>
                  </NeonBox>
                ) : documents.map(d => (
                  <NeonBox key={d.id} color={accent.color} rgb={accent.rgb} style={{ padding: "16px 18px" }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: accent.color, fontWeight: 700, marginBottom: 6 }}>{d.category.toUpperCase()}</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: N.ink, lineHeight: 1.3, marginBottom: 6 }}>{d.name}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted }}>uploaded {fmtDate(d.created_at)}</div>
                  </NeonBox>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* COMPOSE MODAL — same shape as FlowSuite's AddDeliveryModal, neon-styled */}
      {composeType && (
        <ComposeModal
          type={composeType}
          row={composeRow}
          accent={accent}
          onClose={closeCompose}
          onSave={composeSave}
        />
      )}

      {/* INVITE MODAL */}
      {showInvite && (
        <div onClick={() => setShowInvite(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: N.white, maxWidth: 520, width: "100%", borderRadius: 14, padding: "28px 32px", border: `2px solid ${accent.color}`, boxShadow: `0 0 40px ${accent.color}66`, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: accent.color, fontWeight: 700, marginBottom: 6 }}>INVITE TO {org.short_name || org.name}</div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, margin: 0 }}>Add a board member</h2>
              </div>
              <button onClick={() => setShowInvite(false)} style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: N.muted, lineHeight: 1 }}>×</button>
            </div>
            <p style={{ color: N.muted, fontSize: 13.5, marginBottom: 18, lineHeight: 1.55 }}>
              Generate a private link. They can view financials, minutes, fundraisers, and documents — no login needed. They only sign up if they want to make changes.
            </p>

            <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: N.muted, marginBottom: 4, fontWeight: 700 }}>Their name (optional)</label>
            <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Sarah Chen"
              style={{ width: "100%", padding: "10px 14px", background: N.white, border: "1.5px solid " + N.rule, borderRadius: 8, fontSize: 14, marginBottom: 12, boxSizing: "border-box", fontFamily: "'Figtree', sans-serif" }} />

            <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: N.muted, marginBottom: 4, fontWeight: 700 }}>Email (optional — for your records)</label>
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="sarah@boardchair.org"
              style={{ width: "100%", padding: "10px 14px", background: N.white, border: "1.5px solid " + N.rule, borderRadius: 8, fontSize: 14, marginBottom: 12, boxSizing: "border-box", fontFamily: "'Figtree', sans-serif" }} />

            <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: N.muted, marginBottom: 4, fontWeight: 700 }}>Their role on the board</label>
            <input value={inviteTitle} onChange={e => setInviteTitle(e.target.value)} placeholder="Board Chair"
              style={{ width: "100%", padding: "10px 14px", background: N.white, border: "1.5px solid " + N.rule, borderRadius: 8, fontSize: 14, marginBottom: 18, boxSizing: "border-box", fontFamily: "'Figtree', sans-serif" }} />

            <button onClick={inviteSubmit} disabled={inviteSaving}
              style={{ width: "100%", padding: 12, background: inviteSaving ? N.rule : accent.color, border: "none", borderRadius: 8, color: N.white, fontSize: 14, fontWeight: 700, cursor: inviteSaving ? "default" : "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", boxShadow: inviteSaving ? "none" : `0 4px 14px ${accent.color}66` }}>
              {inviteSaving ? "Creating link…" : "Generate invite link →"}
            </button>

            {invitedLink && (
              <div style={{ marginTop: 20, padding: "14px 16px", background: `rgba(${accent.rgb},0.08)`, border: `1.5px solid ${accent.color}`, borderRadius: 10 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: accent.color, fontWeight: 700, marginBottom: 6 }}>✓ LINK COPIED TO CLIPBOARD</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: N.ink, wordBreak: "break-all", marginBottom: 10, lineHeight: 1.5 }}>{invitedLink}</div>
                <div style={{ fontSize: 12, color: N.muted, lineHeight: 1.5 }}>
                  Paste this in a text, email, or DM. Anyone with the link can view — no login required. Valid for 1 year.
                </div>
              </div>
            )}

            {invites.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.muted, fontWeight: 700, marginBottom: 10 }}>ACTIVE INVITES · {invites.length}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                  {invites.slice(0, 20).map(i => (
                    <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: N.white, border: `1px solid ${N.rule}`, borderRadius: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: N.ink, fontWeight: 600 }}>{i.invited_name || i.invited_email || "Unnamed viewer"}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted }}>
                          {i.invited_title || "Viewer"} · {i.view_count || 0} view{(i.view_count || 0) === 1 ? "" : "s"}{i.last_viewed_at ? " · last " + fmtDate(i.last_viewed_at) : ""}
                        </div>
                      </div>
                      <button onClick={() => { const u = window.location.origin + "/view/" + i.token; navigator.clipboard?.writeText(u); alert("Copied: " + u); }}
                        style={{ background: "transparent", border: "none", color: accent.color, fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace", fontWeight: 700, letterSpacing: "0.06em" }}>
                        COPY LINK
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <SignatureFooter />
    </div>
  );
}

// -----------------------------------------------------------------------------
// ComposeModal — one modal that handles add/edit for meetings, newsletters,
// fundraisers. Mirrors FlowSuite's AddDeliveryModal shape (overlay → modal →
// header → body → footer). Type-specific fields via SCHEMAS below.
// -----------------------------------------------------------------------------

const SCHEMAS = {
  meeting: {
    labelAdd: "+ Add meeting",
    labelEdit: "Edit meeting",
    fields: [
      { key: "meeting_date", label: "Meeting date *", type: "date", required: true },
      { key: "title",        label: "Title",          type: "text", placeholder: "May Board Meeting" },
      { key: "attendees",    label: "Attendees",      type: "textarea", rows: 3, placeholder: "Present: …\nAbsent: …\nOpened in prayer by…" },
      { key: "agenda",       label: "Agenda",         type: "textarea", rows: 6 },
      { key: "minutes",      label: "Minutes",        type: "textarea", rows: 10 },
      { key: "next_steps",   label: "Next steps",     type: "textarea", rows: 4 },
    ],
  },
  newsletter: {
    labelAdd: "+ New newsletter",
    labelEdit: "Edit newsletter",
    fields: [
      { key: "title",      label: "Title *",     type: "text", required: true, placeholder: "June Update — Doors Open, Beds Full" },
      { key: "issue_date", label: "Issue date",  type: "date" },
      { key: "status",     label: "Status",      type: "select", options: [["draft","Draft"],["scheduled","Scheduled"],["sent","Sent"]], default: "draft" },
      { key: "body",       label: "Body",        type: "textarea", rows: 14, placeholder: "Dear friends,\n\n…" },
    ],
  },
  fundraiser: {
    labelAdd: "+ New fundraiser",
    labelEdit: "Edit fundraiser",
    fields: [
      { key: "name",          label: "Name *",         type: "text", required: true, placeholder: "Q4 Year-End Appeal" },
      { key: "campaign_type", label: "Type",           type: "select", options: [["year_end","Year-end"],["capital","Capital"],["matching","Matching"],["general","General"]], default: "general" },
      { key: "goal_amount",   label: "Goal ($)",       type: "number" },
      { key: "raised_amount", label: "Raised so far ($)", type: "number", default: 0 },
      { key: "starts_on",     label: "Starts",         type: "date" },
      { key: "ends_on",       label: "Ends",           type: "date" },
      { key: "status",        label: "Status",         type: "select", options: [["planning","Planning"],["active","Active"],["closed","Closed"]], default: "active" },
      { key: "notes",         label: "Notes",          type: "textarea", rows: 4 },
    ],
  },
};

function ComposeModal({ type, row, accent, onClose, onSave }) {
  const schema = SCHEMAS[type];
  const isEdit = !!row;
  const [values, setValues] = useState(() => {
    const v = {};
    schema.fields.forEach(f => {
      v[f.key] = row?.[f.key] ?? f.default ?? "";
    });
    return v;
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && !saving) onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const setField = (k, v) => setValues(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    setErr("");
    for (const f of schema.fields) {
      if (f.required && !String(values[f.key] ?? "").trim()) {
        setErr(f.label.replace(" *", "") + " is required.");
        return;
      }
    }
    setSaving(true);
    // Coerce empty strings to null so numeric/date columns don't choke
    const payload = {};
    schema.fields.forEach(f => {
      let v = values[f.key];
      if (v === "" || v === undefined) v = null;
      if (f.type === "number" && v !== null) v = Number(v);
      payload[f.key] = v;
    });
    await onSave(payload);
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.6)", zIndex: 1100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 620, background: N.white, border: `2px solid ${accent.color}`, borderRadius: 14, boxShadow: `0 12px 40px rgba(0,0,0,0.35), 0 0 40px ${accent.color}44`, fontFamily: "'Figtree', sans-serif", color: N.ink }}>
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${N.rule}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink }}>{isEdit ? schema.labelEdit : schema.labelAdd}</h3>
          <button type="button" onClick={onClose} disabled={saving}
            style={{ background: "transparent", border: "none", fontSize: 24, cursor: saving ? "default" : "pointer", color: N.muted, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {schema.fields.map(f => (
            <ComposeField key={f.key} field={f} value={values[f.key]} onChange={v => setField(f.key, v)} accent={accent} />
          ))}
          {err && (
            <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.08)", border: `1px solid ${N.red}`, borderLeft: `4px solid ${N.red}`, borderRadius: 6, color: N.red, fontSize: 12, fontWeight: 600 }}>{err}</div>
          )}
        </div>

        <div style={{ padding: "14px 22px", borderTop: `1px solid ${N.rule}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" onClick={onClose} disabled={saving}
            style={{ background: "transparent", border: `1px solid ${N.rule}`, borderRadius: 8, padding: "9px 16px", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", fontWeight: 700, color: N.muted, cursor: saving ? "default" : "pointer", textTransform: "uppercase" }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            style={{ background: accent.color, color: N.white, border: "none", borderRadius: 8, padding: "9px 18px", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1, textTransform: "uppercase", boxShadow: saving ? "none" : `0 3px 12px ${accent.color}66` }}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ComposeField({ field, value, onChange, accent }) {
  const inputBase = { width: "100%", padding: "10px 12px", background: N.white, border: `1.5px solid ${N.rule}`, borderRadius: 8, fontFamily: "'Figtree', sans-serif", fontSize: 14, color: N.ink, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s, box-shadow 0.15s" };
  const focus = e => { e.target.style.borderColor = accent.color; e.target.style.boxShadow = `0 0 0 3px ${accent.color}22`; };
  const blur  = e => { e.target.style.borderColor = N.rule; e.target.style.boxShadow = "none"; };

  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: N.muted, fontFamily: "'DM Mono', monospace" }}>{field.label}</span>
      {field.type === "textarea" ? (
        <textarea rows={field.rows || 4} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || ""}
          style={{ ...inputBase, resize: "vertical", lineHeight: 1.55 }} onFocus={focus} onBlur={blur} />
      ) : field.type === "select" ? (
        <select value={value || field.default || ""} onChange={e => onChange(e.target.value)}
          style={inputBase} onFocus={focus} onBlur={blur}>
          {field.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : (
        <input type={field.type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || ""}
          style={inputBase} onFocus={focus} onBlur={blur} />
      )}
    </label>
  );
}
