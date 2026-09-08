import { useState } from "react";
import { N, N_RGB } from "../design/neon";
import { Panel, Tiles, Quiet } from "./boardChrome";

// The Work — everything that was living somewhere else.
//
// Rows come from public.board_work: the Everything Board's 108 cards
// (everything.karikounkel.com, its own Supabase) and the Monday 7AM Rollout
// Tracker's 36 items, which had been a JavaScript array inside cockpit HTML.
//
// Presentational on purpose: it takes rows and two callbacks. The page owns the
// fetching, which is what lets this be rendered against a fixture and looked at.

// Buckets in the order they deserve attention. The first three plus brainstorm
// and complete are the Everything Board's own list names; the days are the
// Rollout Tracker's.
const BUCKETS = [
  { key: "urgent",     label: "Urgent",        color: N.red },
  { key: "focus",      label: "Focus",         color: N.blue },
  { key: "inprogress", label: "In progress",   color: N.blueHot },
  { key: "Thu",        label: "Rollout · Thu", color: N.blueDark },
  { key: "Fri",        label: "Rollout · Fri", color: N.blueDark },
  { key: "Sat",        label: "Rollout · Sat", color: N.blueDark },
  { key: "Sun",        label: "Rollout · Sun", color: N.blueDark },
  { key: "Mon",        label: "Rollout · Mon", color: N.blueDark },
  { key: "brainstorm", label: "Brainstorm",    color: N.mutedLite },
  { key: "complete",   label: "Complete",      color: N.green },
];

// Whole calendar days between local midnights — never elapsed milliseconds.
function daysUntil(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return null;
  const now = new Date();
  return Math.round(
    (new Date(y, m - 1, d) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000
  );
}

function dueLabel(days) {
  if (days === null) return "";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "1 day late";
  if (days < 0) return `${Math.abs(days)} days late`;
  return `${days} days`;
}

// Buckets Kari can file something into by hand. The rollout days aren't here —
// those describe a weekend that already happened.
const FILEABLE = ["urgent", "focus", "inprogress", "brainstorm", "complete"];

export default function WorkPanel({ rows, onToggleDone, onToggleCheck, onRefresh, onAdd, onMove, onDelete }) {
  const [source, setSource] = useState("all");
  const [project, setProject] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", bucket: "focus" });

  if (rows === null) {
    return (
      <Panel color={N.blue} rgb={N_RGB.blue} title="The Work" subtitle="Everything Board + Monday 7AM Rollout" onRefresh={onRefresh}>
        <Quiet>Loading the work…</Quiet>
      </Panel>
    );
  }

  const bySource = source === "all" ? rows : rows.filter((r) => r.source === source);
  const filtered = project ? bySource.filter((r) => (r.projects || []).includes(project)) : bySource;

  const open = filtered.filter((r) => !r.done);
  const doneRows = filtered.filter((r) => r.done);
  const urgent = open.filter((r) => r.bucket === "urgent").length;
  const dated = open.filter((r) => r.due_date).length;
  // Checklist items under still-open cards — the work below the work.
  const subOpen = open.reduce((n, r) => n + (r.checklist || []).filter((c) => c && !c.done).length, 0);

  // Only offer a project filter that will actually match something.
  const projects = [...new Set(rows.flatMap((r) => r.projects || []))].sort();

  const shown = showDone ? [...open, ...doneRows] : open;
  const groups = BUCKETS
    .map((b) => ({ ...b, items: shown.filter((r) => r.bucket === b.key) }))
    .filter((g) => g.items.length);
  const other = shown.filter((r) => !BUCKETS.some((b) => b.key === r.bucket));
  if (other.length) groups.push({ key: "_other", label: "Unfiled", color: N.mutedLite, items: other });

  // Pack the groups into two balanced columns by hand. CSS `column-count`
  // strands a one-item group beside a twenty-item one and leaves half a screen
  // of white space, because a group must not break across a column.
  const cols = [[], []];
  const weight = [0, 0];
  for (const g of groups) {
    const i = weight[0] <= weight[1] ? 0 : 1;
    cols[i].push(g);
    weight[i] += g.items.length + 2; // +2 for the heading's own height
  }

  const chip = (text, bg, fg, key) => (
    <span key={key || text} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.05em", color: fg, background: bg, border: `1px solid ${N.rule}`, borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap" }}>{text}</span>
  );

  const item = (r) => {
    const cl = r.checklist || [];
    const clDone = cl.filter((c) => c && c.done).length;
    const isOpen = expanded.has(r.id);
    const days = r.due_date ? daysUntil(r.due_date) : null;
    const overdue = days !== null && days < 0 && !r.done;

    return (
      <div key={r.id} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "7px 0", borderTop: `1px solid ${N.rule}` }}>
        <input type="checkbox" checked={r.done} onChange={() => onToggleDone(r.id, !r.done)}
          style={{ marginTop: 3, accentColor: N.green, cursor: "pointer", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: r.done ? 400 : 600, color: r.done ? N.mutedLite : N.ink, textDecoration: r.done ? "line-through" : "none", lineHeight: 1.35 }}>
            {r.title}
          </div>

          {r.detail && !r.done && (
            <div style={{ fontSize: 11.5, color: N.mutedLite, lineHeight: 1.45, marginTop: 2 }}>
              {r.detail.length > 150 ? r.detail.slice(0, 150) + "…" : r.detail}
            </div>
          )}

          {!r.done && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4, alignItems: "center" }}>
              {days !== null && chip(`${overdue ? "▲ " : ""}${dueLabel(days)}`, overdue ? "#fef2f2" : N.white, overdue ? N.red : N.muted, "due")}
              {cl.length > 0 && (
                <button onClick={() => setExpanded((s) => {
                  const n = new Set(s);
                  if (n.has(r.id)) n.delete(r.id); else n.add(r.id);
                  return n;
                })}
                  style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.05em", color: clDone === cl.length ? N.green : N.blue, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 4, padding: "1px 5px", cursor: "pointer" }}>
                  {isOpen ? "▾" : "▸"} {clDone}/{cl.length}
                </button>
              )}
              {r.owner && chip(r.owner, N.white, N.blueDark, "owner")}
              {(r.projects || []).slice(0, 2).map((p) => chip(p, N.white, N.muted, "p" + p))}
              {(r.tags || []).map((t) => chip(t, "#f0fdf4", N.pinkDark, "t" + t))}

              {/* Refiling and removing live on the row, so a card can move out
                  of Brainstorm the moment it stops being a someday. */}
              <select value={FILEABLE.includes(r.bucket) ? r.bucket : ""} onChange={(e) => onMove(r.id, e.target.value)}
                title="Move to"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: N.mutedLite, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 4, padding: "1px 3px", cursor: "pointer" }}>
                {!FILEABLE.includes(r.bucket) && <option value="">{r.bucket || "—"}</option>}
                {FILEABLE.map((b) => (
                  <option key={b} value={b}>{BUCKETS.find((x) => x.key === b)?.label || b}</option>
                ))}
              </select>
              <button onClick={() => onDelete(r)} title="Remove from the board"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.mutedLite, background: "none", border: "none", cursor: "pointer", padding: "0 3px" }}>✕</button>
            </div>
          )}

          {isOpen && !r.done && cl.length > 0 && (
            <div style={{ marginTop: 6, borderLeft: `2px solid ${N.rule}` }}>
              {cl.map((c, i) => (
                <label key={c.id || i} style={{ display: "flex", gap: 7, alignItems: "flex-start", padding: "3px 0 3px 8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={Boolean(c.done)} onChange={() => onToggleCheck(r, i)}
                    style={{ marginTop: 2, accentColor: N.green, cursor: "pointer", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: c.done ? N.mutedLite : N.text, textDecoration: c.done ? "line-through" : "none", lineHeight: 1.4 }}>{c.text}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const tab = (k, label) => (
    <button key={k} onClick={() => setSource(k)}
      style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 11px", borderRadius: 7, cursor: "pointer", border: `1px solid ${source === k ? N.blue : N.rule}`, background: source === k ? N.blue : N.white, color: source === k ? N.white : N.muted }}>
      {label}
    </button>
  );

  return (
    <Panel color={N.blue} rgb={N_RGB.blue} title="The Work"
      subtitle="Everything Board + Monday 7AM Rollout" onRefresh={onRefresh}>
      {rows.length === 0 ? <Quiet>Nothing here yet.</Quiet> : (
        <>
          <Tiles items={[
            { label: "Open", value: open.length, color: N.blue },
            { label: "Urgent", value: urgent, color: urgent ? N.red : N.ink },
            { label: "With a date", value: dated, color: N.ink },
            { label: "Sub-tasks left", value: subOpen, color: N.ink },
            { label: "Done", value: doneRows.length, color: N.green },
          ]} />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            {tab("all", "Everything")}
            {tab("everything", "Board cards")}
            {tab("rollout", "Rollout")}
            <select value={project} onChange={(e) => setProject(e.target.value)}
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 10.5, padding: "5px 8px", borderRadius: 7, border: `1px solid ${N.rule}`, background: N.white, color: N.muted, maxWidth: 230 }}>
              <option value="">All projects</option>
              {projects.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={() => setShowDone((v) => !v)}
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: N.muted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              {showDone ? "Hide done" : `Show done (${doneRows.length})`}
            </button>
            <button onClick={() => setAdding((v) => !v)}
              style={{ fontFamily: "'Figtree', sans-serif", fontSize: 12.5, fontWeight: 700, background: adding ? N.white : N.blue, color: adding ? N.muted : N.white, border: `1px solid ${adding ? N.rule : N.blue}`, borderRadius: 7, padding: "5px 13px", cursor: "pointer", marginLeft: "auto" }}>
              {adding ? "Cancel" : "+ Add work"}
            </button>
          </div>

          {adding && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const title = draft.title.trim();
              if (!title) return;
              onAdd(title, draft.bucket);
              setDraft({ title: "", bucket: draft.bucket });
              setAdding(false);
            }}
              style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, padding: 12, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 10 }}>
              <input autoFocus value={draft.title} placeholder="What needs doing?"
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                style={{ flex: "1 1 260px", minWidth: 0, fontFamily: "inherit", fontSize: 13.5, padding: "8px 10px", border: `1px solid ${N.rule}`, borderRadius: 7, color: N.ink }} />
              <select value={draft.bucket} onChange={(e) => setDraft({ ...draft, bucket: e.target.value })}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, padding: "8px 9px", border: `1px solid ${N.rule}`, borderRadius: 7, background: N.white, color: N.muted }}>
                {FILEABLE.map((b) => (
                  <option key={b} value={b}>{BUCKETS.find((x) => x.key === b)?.label || b}</option>
                ))}
              </select>
              <button type="submit"
                style={{ fontFamily: "'Figtree', sans-serif", fontSize: 13, fontWeight: 700, background: N.blue, color: N.white, border: "none", borderRadius: 7, padding: "8px 16px", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,128,255,0.35)" }}>
                Add
              </button>
            </form>
          )}

          {groups.length === 0 ? <Quiet>Nothing open under that filter.</Quiet> : (
            <div className="work-cols" style={{ display: "flex", gap: 26, alignItems: "flex-start", maxHeight: 620, overflowY: "auto" }}>
              {cols.map((col, ci) => (
                <div key={ci} style={{ flex: "1 1 0", minWidth: 0 }}>
                  {col.map((g) => (
                    <div key={g.key} style={{ marginBottom: 18 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15.5, color: g.color }}>{g.label}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.mutedLite }}>{g.items.length}</span>
                      </div>
                      {g.items.map(item)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
