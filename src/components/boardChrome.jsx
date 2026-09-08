// Shared chrome for the Command Board's panels.
//
// Pulled out of CommandBoard.jsx so the panels themselves can be rendered (and
// looked at) on their own, without the page's data fetching around them.

import { N, NeonBox } from "../design/neon";

export const fmtTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
};

// One panel: title, an "as of" stamp that doubles as the manual refresh, body.
export function Panel({ color, rgb, title, subtitle, asOf, stale, onRefresh, children }) {
  return (
    <NeonBox color={color} rgb={rgb} style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "16px 18px 12px", borderBottom: `1px solid ${N.rule}`, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, lineHeight: 1.2 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12.5, color: N.muted, marginTop: 3 }}>{subtitle}</div>}
        </div>
        <button onClick={onRefresh} title="Refresh now"
          style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: stale ? N.mutedLite : N.muted, background: "none", border: "none", cursor: "pointer", padding: 0, whiteSpace: "nowrap" }}>
          {asOf ? `as of ${fmtTime(asOf)}` : "—"} ↻
        </button>
      </div>
      <div style={{ padding: "14px 18px 18px", flex: 1 }}>{children}</div>
    </NeonBox>
  );
}

export function Tiles({ items }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
      {items.map((t) => (
        <div key={t.label} style={{ flex: "1 1 92px", background: N.white, border: `1px solid ${N.rule}`, borderRadius: 10, padding: "9px 12px" }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 21, color: t.color || N.ink, lineHeight: 1.1 }}>{t.value}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: N.muted, marginTop: 3 }}>{t.label}</div>
        </div>
      ))}
    </div>
  );
}

export const Quiet = ({ children }) => (
  <div style={{ fontSize: 13.5, color: N.muted, padding: "10px 0", lineHeight: 1.55 }}>{children}</div>
);

// A panel that can't reach its provider says so, and offers the one button that
// fixes it. It never renders as an empty panel or a blank page.
export function ConnectState({ provider, reason, onConnect, busy }) {
  const isGoogle = provider === "google";
  const name = isGoogle ? "Google" : "QuickBooks";
  const expired = reason === "expired" || reason === "unauthorized";
  return (
    <div style={{ padding: "6px 0 4px" }}>
      <div style={{ fontSize: 13.5, color: N.muted, lineHeight: 1.55, marginBottom: 12 }}>
        {reason === "not_connected"
          ? `Not connected to ${name} yet.`
          : expired
          ? `The ${name} connection expired.`
          : `${name} didn't answer${reason ? ` — ${reason}` : ""}.`}
      </div>
      <button onClick={onConnect} disabled={busy}
        style={{ fontFamily: "'Figtree', sans-serif", fontSize: 13, fontWeight: 700, background: isGoogle ? N.blue : N.green, color: N.white, border: "none", borderRadius: 8, padding: "9px 16px", cursor: busy ? "wait" : "pointer", boxShadow: `0 4px 14px ${isGoogle ? "rgba(0,128,255,0.4)" : "rgba(34,197,94,0.4)"}` }}>
        {busy ? "Opening…" : `${reason === "not_connected" ? "Connect" : "Reconnect"} ${name}`}
      </button>
    </div>
  );
}
