import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";
import { N, N_RGB, FONT_LINK, SignatureFooter, WASH_BG_LITE, HERO_TEXT_GRAD_BLUE } from "../design/neon";
import { Panel, Tiles, Quiet, ConnectState, fmtTime } from "../components/boardChrome";
import WorkPanel from "../components/WorkPanel";
import { oneListGroups, oneListProgress, oneListCounts, ONE_LIST_TOOL_KEY, ONE_LIST_HREF } from "../lib/oneList";

// Command Board — tools.caresmn.com/board
//
// Kari's week, her unread mail, who owes her, and the countdowns, on one page
// that refreshes itself. Behind the same login gate as /kari.
//
// The rule that shapes this file: every panel fails alone. Calendar can be
// disconnected, Gmail can 500 and QuickBooks can be mid-reauth, and the other
// three still render their real data. Nothing here throws upward.

const REFRESH = {
  calendar: 5 * 60 * 1000,
  mail: 5 * 60 * 1000,
  ar: 15 * 60 * 1000,
};

const MOBILE = `
  @media (max-width: 900px) {
    .board-grid { grid-template-columns: 1fr !important; }
    .board-page { padding: 24px 16px 48px !important; }
    .board-h1 { font-size: 27px !important; }
    .onelist-cols { column-count: 1 !important; }
    .work-cols { flex-direction: column !important; }
  }
`;

// --- small helpers -----------------------------------------------------------

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const usd = (n) =>
  (n < 0 ? "-" : "") +
  "$" +
  Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Whole calendar days between local-today and a bare YYYY-MM-DD, counted as
// days on a calendar rather than as elapsed milliseconds. Measuring ms and
// rounding is what reports "8 days left" on a 7-day window; Math.round over
// local midnights also survives the two DST days that aren't 24 hours long.
function daysUntil(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return null;
  const due = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due - today) / 86400000);
}

function countdownLabel(days) {
  if (days === null) return "";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `${days} days`;
}

// Relative age for the mail list — "3h", "2d", "3w".
function ago(iso) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - Date.parse(iso)) / 60000);
  if (mins < 60) return `${Math.max(mins, 0)}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

// --- page --------------------------------------------------------------------

export default function CommandBoard({ session }) {
  const uid = session?.user?.id;

  const [cal, setCal] = useState({ loading: true });
  const [mail, setMail] = useState({ loading: true });
  const [ar, setAr] = useState({ loading: true });
  const [connecting, setConnecting] = useState(null);
  const [notice, setNotice] = useState(null);

  const [stones, setStones] = useState([]);
  const [stonesLoading, setStonesLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [oneTicks, setOneTicks] = useState(null); // null = still loading
  const [showParked, setShowParked] = useState(false);

  const [work, setWork] = useState(null); // null = still loading

  // Re-render once a minute so the "now" marker and the countdowns stay honest
  // on a page that's been open since 5am.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  // ASK widget — same one the cockpit hub loads.
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://chat.karikounkel.com/widget.js";
    s.defer = true;
    document.body.appendChild(s);
    return () => { if (document.body.contains(s)) document.body.removeChild(s); };
  }, []);

  // Landing back from a consent screen.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ok = p.get("connected");
    const err = p.get("board_error");
    if (ok) setNotice({ tone: "good", text: `${ok === "google" ? "Google" : "QuickBooks"} connected.` });
    else if (err) setNotice({ tone: "bad", text: `Connection didn't finish — ${err.replace(/_/g, " ")}.` });
    if (ok || err) window.history.replaceState({}, "", "/board");
  }, []);

  const authed = useCallback(async (path) => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) throw new Error("signed out");
    const r = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
    return r.json();
  }, []);

  // One loader shape for all three feeds. A thrown fetch lands in the panel's
  // own error state — it never propagates and takes the page with it.
  const load = useCallback(
    async (setter, path) => {
      setter((s) => ({ ...s, refreshing: true }));
      try {
        const body = await authed(path);
        setter({ ...body, loading: false, refreshing: false });
      } catch (err) {
        setter((s) => ({ ...s, ok: false, loading: false, refreshing: false, error: err.message || "unreachable" }));
      }
    },
    [authed]
  );

  const loadCal = useCallback(() => load(setCal, "/api/board/data?panel=calendar"), [load]);
  const loadMail = useCallback(() => load(setMail, `/api/board/data?panel=mail&today=${ymd(new Date())}`), [load]);
  const loadAr = useCallback(() => load(setAr, "/api/board/data?panel=ar"), [load]);

  useEffect(() => {
    if (!uid) return;
    loadCal(); loadMail(); loadAr();
    const a = setInterval(loadCal, REFRESH.calendar);
    const b = setInterval(loadMail, REFRESH.mail);
    const c = setInterval(loadAr, REFRESH.ar);
    return () => { clearInterval(a); clearInterval(b); clearInterval(c); };
  }, [uid, loadCal, loadMail, loadAr]);

  async function connect(provider) {
    setConnecting(provider);
    try {
      const { data } = await supabase.auth.getSession();
      const r = await fetch(`/api/board/auth?provider=${provider}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${data?.session?.access_token}` },
      });
      const body = await r.json();
      if (body.url) window.location.href = body.url;
      else {
        setNotice({ tone: "bad", text: body.error === `${provider}_not_configured` ? `${provider === "google" ? "Google" : "QuickBooks"} keys aren't set on the server yet.` : `Couldn't start the connection — ${body.error || "unknown"}.` });
        setConnecting(null);
      }
    } catch {
      setNotice({ tone: "bad", text: "Couldn't reach the server." });
      setConnecting(null);
    }
  }

  // --- milestones ------------------------------------------------------------

  const loadStones = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase
      .from("board_milestones")
      .select("*")
      .eq("user_id", uid)
      .order("sort", { ascending: true });
    setStones(data || []);
    setStonesLoading(false);
  }, [uid]);

  useEffect(() => { loadStones(); }, [loadStones]);

  // --- The One List ----------------------------------------------------------
  // Items come from the cockpit's own HTML; ticks come from the same
  // kari_tool_data row the cockpit writes, so the two stay one list.

  const loadOne = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase
      .from("kari_tool_data")
      .select("data")
      .eq("user_id", uid)
      .eq("tool_key", ONE_LIST_TOOL_KEY)
      .maybeSingle();
    setOneTicks(data?.data || {});
  }, [uid]);

  useEffect(() => { loadOne(); }, [loadOne]);

  // --- The Work --------------------------------------------------------------
  // Everything Board cards + Monday 7AM Rollout items, both moved into
  // public.board_work. RLS scopes the select, so no user filter is needed here.

  const loadWork = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase
      .from("board_work")
      .select("*")
      .order("source_moved_at", { ascending: false, nullsFirst: false });
    setWork(data || []);
  }, [uid]);

  useEffect(() => { loadWork(); }, [loadWork]);

  async function toggleWork(rowId, next) {
    const at = next ? new Date().toISOString() : null;
    setWork((rows) => rows.map((r) => (r.id === rowId ? { ...r, done: next, done_at: at } : r)));
    await supabase.from("board_work").update({ done: next, done_at: at }).eq("id", rowId);
  }

  // Checklist items are {id, done, text} — 465 of them across the cards, and
  // the smallest real unit of work in here. They tick in place.
  async function toggleCheck(row, idx) {
    const next = (row.checklist || []).map((c, i) => (i === idx ? { ...c, done: !c.done } : c));
    setWork((rows) => rows.map((r) => (r.id === row.id ? { ...r, checklist: next } : r)));
    await supabase.from("board_work").update({ checklist: next }).eq("id", row.id);
  }

  async function toggleOne(id) {
    const next = { ...(oneTicks || {}) };
    if (next[id]) delete next[id]; else next[id] = 1;
    setOneTicks(next);
    await supabase.from("kari_tool_data").upsert(
      { user_id: uid, tool_key: ONE_LIST_TOOL_KEY, data: next, updated_at: new Date().toISOString() },
      { onConflict: "user_id,tool_key" }
    );
  }

  async function patchStone(id, patch) {
    setStones((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    await supabase.from("board_milestones").update(patch).eq("id", id);
  }

  async function addStone() {
    const sort = (stones[stones.length - 1]?.sort || 0) + 1;
    const due = new Date();
    due.setDate(due.getDate() + 30);
    const { data } = await supabase
      .from("board_milestones")
      .insert({ user_id: uid, label: "New milestone", due_date: ymd(due), sort })
      .select()
      .maybeSingle();
    if (data) setStones((rows) => [...rows, data]);
    setEditing(true);
  }

  async function removeStone(id) {
    setStones((rows) => rows.filter((r) => r.id !== id));
    await supabase.from("board_milestones").delete().eq("id", id);
  }

  // --- derived ---------------------------------------------------------------

  // Group events into local calendar days. The server deliberately doesn't do
  // this: it doesn't know the viewer's zone, and this page might be open on a
  // laptop in a different one.
  const days = (() => {
    if (!cal.ok || !cal.events) return [];
    const map = new Map();
    for (const e of cal.events) {
      const key = e.allDay ? e.start : ymd(new Date(e.start));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, list]) => ({
        key,
        list: list.sort((x, y) => (x.allDay ? -1 : y.allDay ? 1 : Date.parse(x.start) - Date.parse(y.start))),
      }));
  })();

  const todayKey = ymd(new Date());
  const sortedStones = [...stones].sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));

  const input = {
    fontFamily: "inherit", fontSize: 13.5, padding: "7px 9px",
    border: `1px solid ${N.rule}`, borderRadius: 7, background: N.white, color: N.ink,
  };

  return (
    <div style={{ minHeight: "100vh", background: WASH_BG_LITE, fontFamily: "'Figtree', sans-serif", color: N.ink }}>
      <style>{MOBILE}</style>
      <link href={FONT_LINK} rel="stylesheet" />

      <header style={{ background: N.white, borderBottom: `1px solid ${N.rule}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink }}>
              CARES <span style={{ color: N.blueHot, fontStyle: "italic" }}>Works.</span>
            </span>
          </a>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <button onClick={() => { loadCal(); loadMail(); loadAr(); }} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: N.blue, background: "none", border: "none", cursor: "pointer" }}>Refresh all</button>
            <button onClick={() => navigate("/kari")} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Cockpits</button>
          </div>
        </div>
      </header>

      <div className="board-page" style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 24px 48px" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: N.blue, marginBottom: 6 }}>Private · CARES Consulting</div>
          <h1 className="board-h1" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, lineHeight: 1.15, margin: 0 }}>
            <span style={HERO_TEXT_GRAD_BLUE}>Command Board</span>
          </h1>
          <p style={{ color: N.muted, fontSize: 14.5, marginTop: 7, maxWidth: 640, lineHeight: 1.55 }}>
            The week, the inbox, the money, and the clock — refreshing on their own.
          </p>
        </div>

        {notice && (
          <div style={{ marginBottom: 18, padding: "10px 14px", borderRadius: 10, fontSize: 13.5, background: N.white, border: `1.5px solid ${notice.tone === "good" ? N.green : N.red}`, color: N.ink, display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)} style={{ background: "none", border: "none", color: N.muted, cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* THE WORK — the Everything Board's 108 cards and the Monday 7AM
            Rollout's 36 items, moved into board_work and shown together. */}
        <div style={{ marginBottom: 18 }}>
          <WorkPanel rows={work} onRefresh={loadWork}
            onToggleDone={toggleWork} onToggleCheck={toggleCheck} />
        </div>

        {/* THE ONE LIST — the actual work. Full width and first, because a board
            that shows a calendar and no to-do list reads as "nothing to do". */}
        <div style={{ marginBottom: 18 }}>
          <Panel color={N.green} rgb={N_RGB.pink} title="The One List"
            subtitle="FlowSuite Pro — what's standing, and what's left"
            asOf={null} onRefresh={loadOne}>
            {oneTicks === null ? <Quiet>Loading the list…</Quiet> : (() => {
              const groups = oneListGroups();
              const counts = oneListCounts(oneTicks);
              const prog = oneListProgress();
              // Built features never appear as rows — the file only itemises what
              // is left — so progress is the authored built count plus her ticks.
              const doneTotal = (prog.built || 0) + counts.done;
              const total = prog.total || doneTotal + counts.open;
              const pct = total ? Math.round((doneTotal / total) * 100) : 0;
              const live = groups.filter((g) => !g.parked);
              const parkedGroups = groups.filter((g) => g.parked);

              const row = (it) => {
                const done = Boolean(oneTicks[it.id]);
                return (
                  <label key={it.id} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "6px 0", borderTop: `1px solid ${N.rule}`, cursor: "pointer" }}>
                    <input type="checkbox" checked={done} onChange={() => toggleOne(it.id)}
                      style={{ marginTop: 3, accentColor: N.green, cursor: "pointer", flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13.5, fontWeight: done ? 400 : 600, color: done ? N.mutedLite : N.ink, textDecoration: done ? "line-through" : "none", display: "block" }}>
                        {it.name}
                      </span>
                      {it.note && !done && (
                        <span style={{ fontSize: 11.5, color: N.mutedLite, display: "block", lineHeight: 1.45, marginTop: 1 }}>{it.note}</span>
                      )}
                      {it.views.length > 0 && !done && (
                        <span style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 3 }}>
                          {it.views.map((v) => (
                            <span key={v} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.06em", color: N.blue, border: `1px solid ${N.rule}`, borderRadius: 4, padding: "1px 5px" }}>{v}</span>
                          ))}
                        </span>
                      )}
                    </span>
                  </label>
                );
              };

              const groupBlock = (g) => {
                const open = g.items.filter((it) => !oneTicks[it.id]).length;
                return (
                  <div key={g.key} style={{ marginBottom: 18, breakInside: "avoid" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15.5, color: N.ink }}>
                        {g.emoji} {g.title}
                      </span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: open ? N.blue : N.green, whiteSpace: "nowrap" }}>
                        {open ? `${open} left` : "all done"}
                      </span>
                    </div>
                    {g.detail && <div style={{ fontSize: 11.5, color: N.mutedLite, margin: "2px 0 4px", lineHeight: 1.45 }}>{g.detail}</div>}
                    {g.items.map(row)}
                  </div>
                );
              };

              return (
                <>
                  <Tiles items={[
                    { label: "Already built", value: prog.built ?? "—", color: N.green },
                    { label: "Ticked by you", value: counts.done, color: N.green },
                    { label: "Left to do", value: counts.open, color: N.blue },
                    { label: "Parked", value: counts.parked, color: N.mutedLite },
                  ]} />

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ height: 10, borderRadius: 100, background: N.wall, border: `1px solid ${N.rule}`, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${N.blue}, ${N.green})`, boxShadow: `0 0 12px rgba(34,197,94,0.5)` }} />
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10.5, color: N.muted, marginTop: 6 }}>
                      {doneTotal} of {total} done — {pct}% of what you designed is standing.
                    </div>
                  </div>

                  <div className="onelist-cols" style={{ columnCount: 2, columnGap: 26 }}>
                    {live.map(groupBlock)}
                  </div>

                  <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                    <button onClick={() => setShowParked((v) => !v)}
                      style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: N.muted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                      {showParked ? "Hide parked" : `Show parked (${counts.parked})`}
                    </button>
                    <a href={ONE_LIST_HREF} onClick={(e) => { e.preventDefault(); navigate(ONE_LIST_HREF); }}
                      style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: N.blue, textDecoration: "underline" }}>
                      Open the full list →
                    </a>
                  </div>

                  {showParked && (
                    <div className="onelist-cols" style={{ columnCount: 2, columnGap: 26, marginTop: 14, opacity: 0.72 }}>
                      {parkedGroups.map(groupBlock)}
                    </div>
                  )}
                </>
              );
            })()}
          </Panel>
        </div>

        <div className="board-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>

          {/* WEEK AHEAD */}
          <Panel color={N.blue} rgb={N_RGB.blue} title="Week Ahead" subtitle="Next 7 days" asOf={cal.asOf} onRefresh={loadCal}>
            {cal.loading ? <Quiet>Loading your week…</Quiet>
              : cal.needsConnect ? <ConnectState provider="google" reason={cal.reason} busy={connecting === "google"} onConnect={() => connect("google")} />
              : !cal.ok ? <Quiet>Calendar didn't answer{cal.error ? ` — ${cal.error}` : ""}. It'll try again in five minutes.</Quiet>
              : days.length === 0 ? <Quiet>Nothing on the calendar for the next seven days.</Quiet>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 460, overflowY: "auto" }}>
                  {days.map(({ key, list }) => {
                    const [y, m, d] = key.split("-").map(Number);
                    const dayDate = new Date(y, m - 1, d);
                    const isToday = key === todayKey;
                    let nowDrawn = false;
                    return (
                      <div key={key}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: isToday ? N.blue : N.mutedLite, fontWeight: 700, marginBottom: 6 }}>
                          {isToday ? "Today · " : ""}{dayDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                        </div>
                        {list.map((e) => {
                          // The "now" line drops in ahead of the first event still
                          // to come today — so the eye lands on what's next.
                          const showNow = isToday && !nowDrawn && !e.allDay && Date.parse(e.start) > Date.now();
                          if (showNow) nowDrawn = true;
                          return (
                            <div key={e.id + e.start}>
                              {showNow && (
                                <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "6px 0" }}>
                                  <span style={{ width: 7, height: 7, borderRadius: 100, background: N.green, boxShadow: `0 0 8px ${N.green}` }} />
                                  <span style={{ flex: 1, height: 1, background: N.green, opacity: 0.5 }} />
                                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: N.green, letterSpacing: "0.1em" }}>NOW</span>
                                </div>
                              )}
                              <a href={e.link || "#"} target="_blank" rel="noopener noreferrer"
                                style={{ display: "flex", gap: 10, padding: "6px 0", textDecoration: "none", color: "inherit", borderTop: `1px solid ${N.rule}` }}>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted, minWidth: 62, paddingTop: 2 }}>
                                  {e.allDay ? "all day" : fmtTime(e.start)}
                                </span>
                                <span style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{ fontSize: 13.5, fontWeight: 600, display: "block" }}>{e.title}</span>
                                  {(e.location || e.calendar) && (
                                    <span style={{ fontSize: 11.5, color: N.mutedLite, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {[e.location, e.calendar].filter(Boolean).join(" · ")}
                                    </span>
                                  )}
                                </span>
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
          </Panel>

          {/* STILL UNREAD */}
          <Panel color={N.blueHot} rgb={N_RGB.orange} title="Still Unread" subtitle="Inbox, unread only" asOf={mail.asOf} onRefresh={loadMail}>
            {mail.loading ? <Quiet>Loading your inbox…</Quiet>
              : mail.needsConnect ? <ConnectState provider="google" reason={mail.reason} busy={connecting === "google"} onConnect={() => connect("google")} />
              : !mail.ok ? <Quiet>Gmail didn't answer{mail.error ? ` — ${mail.error}` : ""}. It'll try again in five minutes.</Quiet>
              : (
                <>
                  <Tiles items={[
                    { label: "Unread", value: mail.unread ?? "—", color: N.blue },
                    { label: "Over a week", value: mail.overAWeek ?? "—", color: mail.overAWeek ? N.red : N.ink },
                    { label: "Today", value: mail.today ?? "—", color: N.green },
                  ]} />
                  {(mail.messages || []).length === 0 ? <Quiet>Inbox zero. Genuinely.</Quiet> : (
                    <div style={{ maxHeight: 380, overflowY: "auto" }}>
                      {mail.messages.map((m) => {
                        const old = m.receivedAt && Date.now() - Date.parse(m.receivedAt) > 7 * 86400000;
                        return (
                          <a key={m.id} href={m.link} target="_blank" rel="noopener noreferrer"
                            style={{ display: "block", padding: "8px 0", borderTop: `1px solid ${N.rule}`, textDecoration: "none", color: "inherit" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.from}</span>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10.5, color: old ? N.red : N.mutedLite, whiteSpace: "nowrap" }}>
                                {old ? "▲ " : ""}{ago(m.receivedAt)}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subject}</div>
                            <div style={{ fontSize: 11.5, color: N.mutedLite, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.snippet}</div>
                          </a>
                        );
                      })}
                      {mail.unread > mail.showing && (
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10.5, color: N.mutedLite, paddingTop: 10 }}>
                          Showing {mail.showing} of {mail.unread}.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
          </Panel>

          {/* WHO OWES YOU */}
          <Panel color={N.green} rgb={N_RGB.pink} title="Who Owes You" subtitle="A/R aging, QuickBooks Online" asOf={ar.asOf} onRefresh={loadAr}>
            {ar.loading ? <Quiet>Loading receivables…</Quiet>
              : ar.needsConnect ? <ConnectState provider="qbo" reason={ar.reason} busy={connecting === "qbo"} onConnect={() => connect("qbo")} />
              : !ar.ok ? <Quiet>QuickBooks didn't answer{ar.error ? ` — ${ar.error}` : ""}. It'll try again in fifteen minutes.</Quiet>
              : (
                <>
                  <Tiles items={[
                    { label: "Open A/R", value: usd(ar.openAR), color: N.blue },
                    { label: "Current", value: usd(ar.current), color: N.ink },
                    { label: "Past due", value: usd(ar.pastDue), color: ar.pastDue > 0 ? N.red : N.green },
                  ]} />

                  {/* Aging buckets, as one proportional bar. */}
                  {(() => {
                    const pos = (ar.buckets || []).filter((b) => b.amount > 0);
                    const sum = pos.reduce((s, b) => s + b.amount, 0);
                    if (!sum) return null;
                    const shades = [N.green, N.blueHot, N.blue, N.blueDark, N.red];
                    return (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", height: 9, borderRadius: 100, overflow: "hidden", border: `1px solid ${N.rule}` }}>
                          {pos.map((b, i) => (
                            <div key={b.label} title={`${b.label}: ${usd(b.amount)}`} style={{ width: `${(b.amount / sum) * 100}%`, background: shades[Math.min(i, shades.length - 1)] }} />
                          ))}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 12px", marginTop: 7 }}>
                          {(ar.buckets || []).map((b, i) => (
                            <span key={b.label} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ width: 7, height: 7, borderRadius: 2, background: b.amount < 0 ? N.mutedLite : shades[Math.min(pos.findIndex((p) => p.label === b.label), shades.length - 1)] || N.rule }} />
                              {b.label} {usd(b.amount)}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {ar.unappliedCredits && (
                    <div style={{ fontSize: 12, color: N.muted, background: N.white, border: `1px solid ${N.rule}`, borderLeft: `3px solid ${N.blueHot}`, borderRadius: 6, padding: "7px 10px", marginBottom: 12, lineHeight: 1.5 }}>
                      A negative bucket is showing — that's payment received and not applied to an invoice, not money owed.
                    </div>
                  )}

                  {(ar.customers || []).length === 0 ? <Quiet>Nothing outstanding.</Quiet> : (
                    <div>
                      {ar.customers.map((c) => (
                        <div key={c.name} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 0", borderTop: `1px solid ${N.rule}` }}>
                          <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                          <span style={{ display: "flex", gap: 10, whiteSpace: "nowrap" }}>
                            {c.pastDue > 0 && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.red }}>{usd(c.pastDue)} late</span>}
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500 }}>{usd(c.total)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
          </Panel>

          {/* MILESTONES */}
          <Panel color={N.blue} rgb={N_RGB.blue} title="Milestones" subtitle="Whole days, counted on the calendar" asOf={null}
            onRefresh={() => setEditing((v) => !v)}>
            {stonesLoading ? <Quiet>Loading…</Quiet> : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {sortedStones.map((s) => {
                    const d = daysUntil(s.due_date);
                    const past = d !== null && d < 0;
                    const close = d !== null && d >= 0 && d <= 14;
                    return (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: `1px solid ${N.rule}` }}>
                        {editing ? (
                          <>
                            <input style={{ ...input, flex: 1, minWidth: 0 }} value={s.label}
                              onChange={(e) => setStones((rows) => rows.map((r) => (r.id === s.id ? { ...r, label: e.target.value } : r)))}
                              onBlur={(e) => patchStone(s.id, { label: e.target.value })} />
                            <input type="date" style={{ ...input, width: 148 }} value={s.due_date || ""}
                              onChange={(e) => e.target.value && patchStone(s.id, { due_date: e.target.value })} />
                            <button onClick={() => removeStone(s.id)} title="Remove"
                              style={{ background: "none", border: "none", color: N.mutedLite, cursor: "pointer", fontSize: 14, padding: 4 }}>✕</button>
                          </>
                        ) : (
                          <>
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, display: "block" }}>{s.label}</span>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10.5, color: N.mutedLite }}>
                                {(() => { const [y, m, dd] = String(s.due_date).split("-").map(Number); return new Date(y, m - 1, dd).toLocaleDateString([], { weekday: "short", month: "long", day: "numeric", year: "numeric" }); })()}
                              </span>
                            </span>
                            <span style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: past ? N.mutedLite : close ? N.green : N.blue, lineHeight: 1 }}>
                                {d === null ? "—" : d === 0 || d === 1 || d === -1 ? countdownLabel(d) : Math.abs(d)}
                              </span>
                              {d !== null && Math.abs(d) > 1 && (
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: N.muted, display: "block", marginTop: 2 }}>
                                  {past ? "days ago" : "days"}
                                </span>
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 14, marginTop: 14, alignItems: "center" }}>
                  <button onClick={addStone} style={{ fontFamily: "'Figtree', sans-serif", fontSize: 13, fontWeight: 700, background: N.blue, color: N.white, border: "none", borderRadius: 8, padding: "8px 15px", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,128,255,0.35)" }}>+ Add</button>
                  <button onClick={() => setEditing((v) => !v)} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: N.muted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                    {editing ? "Done" : "Edit"}
                  </button>
                </div>
              </>
            )}
          </Panel>
        </div>

        <div style={{ marginTop: 26, fontFamily: "'DM Mono', monospace", fontSize: 10.5, color: N.mutedLite, lineHeight: 1.7 }}>
          Signed in as {session?.user?.email}. Calendar and mail refresh every 5 minutes, receivables every 15.
          Tokens are encrypted server-side and never reach this page.
        </div>
      </div>

      <SignatureFooter />
    </div>
  );
}
