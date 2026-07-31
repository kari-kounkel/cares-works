import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";
import { N, N_RGB, FONT_LINK, NeonBox, NeonBtn, SignatureFooter, WASH_BG_LITE, HERO_TEXT_GRAD_BLUE } from "../design/neon";

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
  { key: "meetings",     emoji: "📝", label: "Meetings & Minutes" },
  { key: "newsletter",   emoji: "📮", label: "Newsletter" },
  { key: "fundraisers",  emoji: "🎯", label: "Fundraisers" },
  { key: "documents",    emoji: "📁", label: "Documents" },
];

const SIDEBAR_JUMP = [
  { key: "library",  emoji: "🛠️", label: "Tool Library", href: "/dashboard" },
  { key: "debrief",  emoji: "☕", label: "The Debrief",   href: "/dashboard" },
  { key: "account",  emoji: "👤", label: "Account",       href: "/dashboard" },
];

function money(n) {
  if (n === null || n === undefined) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function OrgHome({ slug }) {
  const [session, setSession] = useState(null);
  const [org, setOrg] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [section, setSection] = useState("home");

  const [meetings, setMeetings] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [fundraisers, setFundraisers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [board, setBoard] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data: o, error: oe } = await supabase.from("organizations").select("*").eq("slug", slug).maybeSingle();
      if (oe || !o) { setError("You don't have access to this workspace."); setLoading(false); return; }
      setOrg(o);

      const [{ data: mem }, m, nl, fr, docs, bd] = await Promise.all([
        supabase.from("organization_members").select("*").eq("org_id", o.id).eq("user_email", session.user.email).maybeSingle(),
        supabase.from("org_meetings").select("*").eq("org_id", o.id).order("meeting_date", { ascending: false }),
        supabase.from("org_newsletters").select("*").eq("org_id", o.id).order("issue_date", { ascending: false }),
        supabase.from("org_fundraisers").select("*").eq("org_id", o.id).order("ends_on", { ascending: true }),
        supabase.from("org_documents").select("*").eq("org_id", o.id).order("created_at", { ascending: false }),
        o.primary_steward_board_id ? supabase.from("steward_boards").select("*").eq("id", o.primary_steward_board_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setMe(mem);
      setMeetings(m.data || []);
      setNewsletters(nl.data || []);
      setFundraisers(fr.data || []);
      setDocuments(docs.data || []);
      setBoard(bd.data || null);
      setLoading(false);
    })();
  }, [session, slug]);

  if (!session) { navigate("/login"); return null; }

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
  const boardFunds = board?.data?.funds || [];
  const totalOnHand = boardFunds.reduce((s, f) => s + Number(f.balance || 0), 0);
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
            <a href="/dashboard" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, textDecoration: "none", letterSpacing: "0.08em" }}>CARES Works →</a>
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
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, marginTop: 4 }}>across {boardFunds.length || 0} funds</div>
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
                <p style={{ color: N.muted, fontSize: 14 }}>Fund balances, budget-vs-actual, and reserve months — all in your Steward board.</p>
              </div>
              {board ? (
                <>
                  <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "22px 24px", marginBottom: 16 }}>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 12 }}>{board.name}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 14 }}>
                      {boardFunds.map(f => (
                        <div key={f.name} style={{ padding: "12px 14px", background: N.white, border: "1px solid " + N.rule, borderRadius: 8 }}>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, marginBottom: 4 }}>{f.name.toUpperCase()} FUND</div>
                          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>{money(f.balance)}</div>
                        </div>
                      ))}
                    </div>
                    <NeonBtn color={accent.color} onClick={() => navigate("/tools/ledger")}>Open the full Steward board →</NeonBtn>
                  </NeonBox>
                  <p style={{ color: N.muted, fontSize: 13, fontStyle: "italic" }}>The Steward board is where you edit fund balances, add transactions, and build your budget-vs-actual.</p>
                </>
              ) : (
                <NeonBox color={accent.color} rgb={accent.rgb} scale={0.7} style={{ padding: "28px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>💰</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 8 }}>No financial board linked yet.</div>
                  <p style={{ color: N.muted, fontSize: 14, marginBottom: 14 }}>Kari can link your Steward board to this workspace so it lands here.</p>
                  <NeonBtn color={accent.color} onClick={() => navigate("/tools/ledger")}>Open Steward →</NeonBtn>
                </NeonBox>
              )}
            </div>
          )}

          {section === "meetings" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: accent.color, fontWeight: 700, marginBottom: 8 }}>BOARD & TEAM</div>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 8 }}>Meetings & Minutes</h1>
                <p style={{ color: N.muted, fontSize: 14 }}>Every meeting, every decision, every next step. Nothing falls off.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {meetings.length === 0 ? (
                  <NeonBox color={accent.color} rgb={accent.rgb} scale={0.7} style={{ padding: "28px 24px", textAlign: "center" }}>
                    <div style={{ color: N.muted, fontSize: 14, marginBottom: 12 }}>No meetings logged yet.</div>
                    <NeonBtn color={accent.color}>+ Log your first meeting</NeonBtn>
                  </NeonBox>
                ) : meetings.map(m => (
                  <NeonBox key={m.id} color={accent.color} rgb={accent.rgb} style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, gap: 10 }}>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: N.ink }}>{m.title || "Board Meeting"}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", color: accent.color, fontWeight: 700 }}>{fmtDate(m.meeting_date)}</div>
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
                  </NeonBox>
                ))}
              </div>
            </div>
          )}

          {section === "newsletter" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: accent.color, fontWeight: 700, marginBottom: 8 }}>DONORS & COMMUNITY</div>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 8 }}>Newsletter</h1>
                <p style={{ color: N.muted, fontSize: 14 }}>Drafts, sent issues, and the running record of what you told your supporters.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {newsletters.length === 0 ? (
                  <NeonBox color={accent.color} rgb={accent.rgb} scale={0.7} style={{ padding: "28px 24px", textAlign: "center" }}>
                    <div style={{ color: N.muted, fontSize: 14, marginBottom: 12 }}>No newsletter drafts yet.</div>
                    <NeonBtn color={accent.color}>+ Start a draft</NeonBtn>
                  </NeonBox>
                ) : newsletters.map(n => (
                  <NeonBox key={n.id} color={accent.color} rgb={accent.rgb} style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, gap: 10 }}>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: N.ink }}>{n.title}</div>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", padding: "3px 10px", borderRadius: 100, background: n.status === "sent" ? `rgba(${N_RGB.blue},0.12)` : `rgba(${accent.rgb},0.15)`, color: n.status === "sent" ? N.blue : accent.color, fontWeight: 700 }}>{n.status.toUpperCase()}</span>
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
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.16em", color: accent.color, fontWeight: 700, marginBottom: 8 }}>CAMPAIGNS</div>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: N.ink, marginBottom: 8 }}>Fundraisers</h1>
                <p style={{ color: N.muted, fontSize: 14 }}>Active appeals, capital campaigns, matching grants. Track goal vs. raised, deadlines, and notes.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {fundraisers.length === 0 ? (
                  <NeonBox color={accent.color} rgb={accent.rgb} scale={0.7} style={{ padding: "28px 24px", textAlign: "center" }}>
                    <div style={{ color: N.muted, fontSize: 14, marginBottom: 12 }}>No fundraisers tracked yet.</div>
                    <NeonBtn color={accent.color}>+ New fundraiser</NeonBtn>
                  </NeonBox>
                ) : fundraisers.map(f => {
                  const pct = f.goal_amount ? Math.min(100, Math.round((Number(f.raised_amount || 0) / Number(f.goal_amount)) * 100)) : 0;
                  return (
                    <NeonBox key={f.id} color={accent.color} rgb={accent.rgb} style={{ padding: "20px 22px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4, gap: 10 }}>
                        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: N.ink }}>{f.name}</div>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", padding: "3px 10px", borderRadius: 100, background: f.status === "active" ? `rgba(${accent.rgb},0.15)` : "#eef0f6", color: f.status === "active" ? accent.color : N.muted, fontWeight: 700 }}>{f.status.toUpperCase()}</span>
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

      <SignatureFooter />
    </div>
  );
}
