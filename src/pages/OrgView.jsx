import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { N, N_RGB, FONT_LINK, NeonBox, SignatureFooter, WASH_BG_LITE, HERO_TEXT_GRAD_BLUE } from "../design/neon";

// Public read-only view of an org workspace, keyed by an invite token.
// No login required. RPC returns the whole bundle in one call so viewers see
// financials/minutes/newsletters/fundraisers/documents without hitting RLS.
// Route: /view/:token

const MOBILE = `
  @media (max-width: 900px) {
    .ov-frame { flex-direction: column !important; }
    .ov-sidebar { width: 100% !important; position: static !important; }
    .ov-sidebar-nav { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 6px !important; }
    .ov-main { padding: 20px !important; }
    .ov-stat-row { grid-template-columns: 1fr 1fr !important; }
  }
`;

const ACCENTS = {
  blue:   { color: N.blue,   rgb: N_RGB.blue },
  orange: { color: N.orange, rgb: N_RGB.orange },
  pink:   { color: N.pink,   rgb: N_RGB.pink },
  green:  { color: N.green,  rgb: "34,197,94" },
};

const SIDEBAR = [
  { key: "home",         emoji: "🏠", label: "Home" },
  { key: "financials",   emoji: "💰", label: "Financials" },
  { key: "meetings",     emoji: "📝", label: "Minutes" },
  { key: "newsletter",   emoji: "📮", label: "Newsletter" },
  { key: "fundraisers",  emoji: "🎯", label: "Fundraisers" },
  { key: "documents",    emoji: "📁", label: "Docs" },
];

const money = n => (n === null || n === undefined) ? "—" : "$" + Math.round(n).toLocaleString("en-US");
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

export default function OrgView() {
  const token = window.location.pathname.replace(/^\/view\//, "").replace(/\/$/, "");
  const [state, setState] = useState({ loading: true, org: null, bundle: null, error: null });
  const [section, setSection] = useState("home");

  useEffect(() => {
    (async () => {
      if (!token || token.length < 8) {
        setState({ loading: false, error: "This link doesn't look right." });
        return;
      }
      const [o, b] = await Promise.all([
        supabase.rpc("get_org_by_invite_token", { p_token: token }),
        supabase.rpc("get_org_bundle_by_invite_token", { p_token: token }),
      ]);
      if (o.error || !o.data || o.data.length === 0) {
        setState({ loading: false, error: "This link has expired or was revoked. Ask the person who sent it for a new one." });
        return;
      }
      setState({ loading: false, org: o.data[0], bundle: b.data || {} });
    })();
  }, [token]);

  const { loading, org, bundle, error } = state;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: WASH_BG_LITE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif", color: N.muted }}>
        <link href={FONT_LINK} rel="stylesheet" />
        Loading the workspace…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: WASH_BG_LITE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif", padding: 24 }}>
        <link href={FONT_LINK} rel="stylesheet" />
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: N.ink, marginBottom: 12 }}>Link not available</h1>
          <p style={{ color: N.muted, fontSize: 14, marginBottom: 20 }}>{error}</p>
          <a href="/" style={{ display: "inline-block", padding: "10px 20px", background: N.blue, color: N.white, borderRadius: 8, textDecoration: "none", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em", fontWeight: 700 }}>Go to CARES Works →</a>
        </div>
      </div>
    );
  }

  const accent = ACCENTS[org.accent] || ACCENTS.blue;
  const meetings    = bundle.meetings    || [];
  const newsletters = bundle.newsletters || [];
  const fundraisers = bundle.fundraisers || [];
  const documents   = bundle.documents   || [];
  const ledger      = bundle.ledger      || null;

  const nextMeeting = meetings[0];
  const draftLetter = newsletters.find(n => n.status === "draft");
  const activeFundraisers = fundraisers.filter(f => f.status === "active");
  const totalOnHand = (ledger?.funds || []).reduce((s, f) => s + Number(f.balance || 0), 0);
  const totalGoal   = activeFundraisers.reduce((s, f) => s + Number(f.goal_amount || 0), 0);
  const totalRaised = activeFundraisers.reduce((s, f) => s + Number(f.raised_amount || 0), 0);

  // Frozen-in-time snapshot as of a meeting date, computed from raw entries
  const rawEntries = ledger?.raw_entries || [];
  const rawFunds   = ledger?.raw_funds   || [];
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
    return { funds, income_ytd: income, expenses_ytd: outflow, on_hand: funds.reduce((s, f) => s + f.balance, 0), entry_count: filtered.length };
  };

  return (
    <div style={{ minHeight: "100vh", background: WASH_BG_LITE, fontFamily: "'Figtree', sans-serif", color: N.ink }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{MOBILE}</style>

      {/* HEADER + read-only banner */}
      <header style={{ background: N.white, borderBottom: "1px solid " + N.rule, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: accent.color, color: N.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 700, boxShadow: `0 4px 14px ${accent.color}88` }}>
              {org.short_name || org.name[0]}
            </div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, lineHeight: 1.15 }}>{org.name}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, textTransform: "uppercase", marginTop: 2 }}>
                {org.location} · {org.org_type} {org.invited_name ? "· viewing as " + org.invited_name : ""}{org.invited_title ? " (" + org.invited_title + ")" : ""}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", padding: "5px 12px", borderRadius: 100, background: `rgba(${accent.rgb},0.12)`, color: accent.color, fontWeight: 700 }}>👁 READ-ONLY</span>
            <a href="/login" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: accent.color, textDecoration: "none", letterSpacing: "0.08em", fontWeight: 700 }}>Sign up to edit →</a>
          </div>
        </div>
      </header>

      <div className="ov-frame" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 24, padding: "24px 24px 40px", alignItems: "flex-start" }}>
        <aside className="ov-sidebar" style={{ width: 220, flexShrink: 0, position: "sticky", top: 84 }}>
          <div className="ov-sidebar-nav" style={{ display: "flex", flexDirection: "column", gap: 4, background: N.white, border: "1px solid " + N.rule, borderRadius: 12, padding: 8 }}>
            {SIDEBAR.map(s => {
              const active = section === s.key;
              return (
                <button key={s.key} onClick={() => setSection(s.key)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "none", background: active ? accent.color : "transparent", color: active ? N.white : N.ink, fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "'Figtree', sans-serif", textAlign: "left" }}>
                  <span style={{ fontSize: 16 }}>{s.emoji}</span>{s.label}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="ov-main" style={{ flex: 1, minWidth: 0 }}>
          {section === "home" && (
            <>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: accent.color, fontWeight: 700, marginBottom: 8 }}>WORKSPACE OVERVIEW</div>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, color: N.ink, marginBottom: 8, lineHeight: 1.1 }}>
                  Welcome to <span style={HERO_TEXT_GRAD_BLUE}>{org.short_name || org.name}</span>.
                </h1>
                <p style={{ color: N.muted, fontSize: 15, lineHeight: 1.55, maxWidth: 640, fontStyle: "italic" }}>{org.tagline}</p>
              </div>

              <div className="ov-stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 26 }}>
                <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "18px 20px" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: accent.color, fontWeight: 700, marginBottom: 6 }}>ON HAND</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink }}>{money(totalOnHand)}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, marginTop: 4 }}>across {(ledger?.funds || []).length} funds</div>
                </NeonBox>
                <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "18px 20px" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: accent.color, fontWeight: 700, marginBottom: 6 }}>RAISED (ACTIVE)</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink }}>{money(totalRaised)}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, marginTop: 4 }}>of {money(totalGoal)} goal</div>
                </NeonBox>
                <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "18px 20px" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: accent.color, fontWeight: 700, marginBottom: 6 }}>ACTIVE FUNDRAISERS</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink }}>{activeFundraisers.length}</div>
                </NeonBox>
                <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "18px 20px" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: accent.color, fontWeight: 700, marginBottom: 6 }}>LAST MEETING</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, lineHeight: 1.2 }}>{nextMeeting ? fmtDate(nextMeeting.meeting_date) : "—"}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, marginTop: 4 }}>{nextMeeting?.title || ""}</div>
                </NeonBox>
              </div>

              {org.mission && (
                <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "20px 24px" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: accent.color, fontWeight: 700, marginBottom: 8 }}>OUR MISSION</div>
                  <p style={{ color: N.ink, fontSize: 15, lineHeight: 1.65, margin: 0 }}>{org.mission}</p>
                </NeonBox>
              )}
            </>
          )}

          {section === "financials" && (
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 8 }}>Financials</h1>
              <p style={{ color: N.muted, fontSize: 14, marginBottom: 20 }}>Fund balances and year-to-date activity.</p>
              {ledger && ledger.funds.length > 0 ? (
                <>
                  <div className="ov-stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
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
                  <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "22px 24px" }}>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 4 }}>Fund balances</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, marginBottom: 14 }}>{ledger.entry_count} entries · {ledger.funds.length} funds</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                      {ledger.funds.map(f => (
                        <div key={f.id} style={{ padding: "12px 14px", background: N.white, border: `1px solid ${N.rule}`, borderRadius: 8 }}>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, marginBottom: 4 }}>
                            {f.name.toUpperCase()}{f.is_restricted ? " · RESTRICTED" : ""}
                          </div>
                          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{money(f.balance)}</div>
                        </div>
                      ))}
                    </div>
                  </NeonBox>
                </>
              ) : <div style={{ color: N.muted, fontSize: 14, padding: 20 }}>No financial data yet.</div>}
            </div>
          )}

          {section === "meetings" && (
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 8 }}>Meetings & Minutes</h1>
              <p style={{ color: N.muted, fontSize: 14, marginBottom: 20 }}>Every meeting, every decision, every next step.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {meetings.length === 0 ? <div style={{ color: N.muted, fontSize: 14, padding: 20 }}>No meetings logged yet.</div> : meetings.map(m => (
                  <NeonBox key={m.id} color={accent.color} rgb={accent.rgb} style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, gap: 10 }}>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: N.ink }}>{m.title || "Board Meeting"}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", color: accent.color, fontWeight: 700 }}>{fmtDate(m.meeting_date)}</div>
                    </div>
                    {m.attendees && <div style={{ fontSize: 12, color: N.muted, marginBottom: 8 }}>👥 {m.attendees}</div>}
                    {m.agenda && <div style={{ marginBottom: 10 }}><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: N.muted, marginBottom: 4 }}>AGENDA</div><div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, color: N.ink, lineHeight: 1.55 }}>{m.agenda}</div></div>}
                    {m.minutes && <div style={{ marginBottom: 10 }}><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: N.muted, marginBottom: 4 }}>MINUTES</div><div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, color: N.ink, lineHeight: 1.55 }}>{m.minutes}</div></div>}
                    {m.next_steps && <div style={{ padding: "10px 12px", background: `rgba(${accent.rgb},0.08)`, borderRadius: 8, borderLeft: `3px solid ${accent.color}` }}><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: accent.color, marginBottom: 4, fontWeight: 700 }}>NEXT STEPS</div><div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, color: N.ink, lineHeight: 1.55 }}>{m.next_steps}</div></div>}
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
                            <div><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: N.muted }}>ON HAND</div><div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{money(snap.on_hand)}</div></div>
                            <div><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: N.muted }}>INCOME</div><div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{money(snap.income_ytd)}</div></div>
                            <div><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: N.muted }}>EXPENSES</div><div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{money(snap.expenses_ytd)}</div></div>
                            <div><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: N.muted }}>NET</div><div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: (snap.income_ytd - snap.expenses_ytd) >= 0 ? N.green : N.red }}>{money(snap.income_ytd - snap.expenses_ytd)}</div></div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                            {snap.funds.map(f => (
                              <div key={f.id} style={{ padding: "8px 10px", background: `rgba(${accent.rgb},0.04)`, borderRadius: 6, border: `1px solid ${N.rule}` }}>
                                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: N.muted, textTransform: "uppercase" }}>{f.name}{f.is_restricted ? " · restricted" : ""}</div>
                                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: N.ink }}>{money(f.balance)}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: 10, fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, fontStyle: "italic" }}>
                            These numbers are frozen at meeting time. They won't change even if entries are added later.
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
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 8 }}>Newsletter</h1>
              <p style={{ color: N.muted, fontSize: 14, marginBottom: 20 }}>Drafts and sent issues.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {newsletters.length === 0 ? <div style={{ color: N.muted, fontSize: 14, padding: 20 }}>No newsletters yet.</div> : newsletters.map(n => (
                  <NeonBox key={n.id} color={accent.color} rgb={accent.rgb} style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, gap: 10 }}>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: N.ink }}>{n.title}</div>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", padding: "3px 10px", borderRadius: 100, background: `rgba(${accent.rgb},0.15)`, color: accent.color, fontWeight: 700 }}>{n.status.toUpperCase()}</span>
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
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 8 }}>Fundraisers</h1>
              <p style={{ color: N.muted, fontSize: 14, marginBottom: 20 }}>Active appeals and capital campaigns.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {fundraisers.length === 0 ? <div style={{ color: N.muted, fontSize: 14, padding: 20 }}>No fundraisers tracked yet.</div> : fundraisers.map(f => {
                  const pct = f.goal_amount ? Math.min(100, Math.round((Number(f.raised_amount || 0) / Number(f.goal_amount)) * 100)) : 0;
                  return (
                    <NeonBox key={f.id} color={accent.color} rgb={accent.rgb} style={{ padding: "20px 22px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4, gap: 10 }}>
                        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: N.ink }}>{f.name}</div>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", padding: "3px 10px", borderRadius: 100, background: f.status === "active" ? `rgba(${accent.rgb},0.15)` : "#eef0f6", color: f.status === "active" ? accent.color : N.muted, fontWeight: 700 }}>{f.status.toUpperCase()}</span>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, marginBottom: 12 }}>{(f.campaign_type || "").replace(/_/g, " ").toUpperCase()}{f.ends_on ? " · ends " + fmtDate(f.ends_on) : ""}</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: N.ink }}>{money(f.raised_amount)}</span>
                        <span style={{ fontSize: 13, color: N.muted }}>of {money(f.goal_amount)} · {pct}%</span>
                      </div>
                      <div style={{ height: 8, background: N.rule, borderRadius: 100, overflow: "hidden", marginBottom: f.notes ? 12 : 0 }}>
                        <div style={{ width: pct + "%", height: "100%", background: accent.color }} />
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
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 8 }}>Documents</h1>
              <p style={{ color: N.muted, fontSize: 14, marginBottom: 20 }}>Bylaws, 501(c)(3), insurance, policies.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                {documents.length === 0 ? <div style={{ color: N.muted, fontSize: 14, padding: 20 }}>No documents uploaded yet.</div> : documents.map(d => (
                  <NeonBox key={d.id} color={accent.color} rgb={accent.rgb} style={{ padding: "16px 18px" }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: accent.color, fontWeight: 700, marginBottom: 6 }}>{(d.category || "OTHER").toUpperCase()}</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: N.ink, lineHeight: 1.3, marginBottom: 6 }}>{d.name}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted }}>uploaded {fmtDate(d.created_at)}</div>
                  </NeonBox>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Sign-up nudge — bottom bar */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 30px" }}>
        <NeonBox color={accent.color} rgb={accent.rgb} scale={1.1} style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: N.ink, marginBottom: 4 }}>Want to edit or add?</div>
            <p style={{ fontSize: 13, color: N.muted, margin: 0 }}>Create a free account and {org.name} can grant you editing access.</p>
          </div>
          <a href="/login" style={{ padding: "10px 22px", background: accent.color, color: N.white, borderRadius: 8, textDecoration: "none", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em", fontWeight: 700, whiteSpace: "nowrap", boxShadow: `0 4px 14px ${accent.color}66` }}>Sign up →</a>
        </NeonBox>
      </div>

      <SignatureFooter />
    </div>
  );
}
