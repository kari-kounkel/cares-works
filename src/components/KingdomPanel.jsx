import { N, N_RGB } from "../design/neon";
import { Panel, Quiet } from "./boardChrome";

// The Kingdom — where every property is at against the house baseline.
//
// The columns are split into two halves and labelled as such, because a green
// square has to mean one of two different things and never a blend:
//
//   MEASURED — the server fetched the site and saw this. Cannot be clicked.
//   DECLARED — no fetch can answer it, so Kari says. Click to cycle.
//
// A number that mixes "we checked" with "she said so" is worse than no number.

const MEASURED = [
  { key: "ok",        label: "Up",    hint: "Answers on https" },
  { key: "analytics", label: "Stats", hint: "A working analytics tag (a placeholder id does not count)" },
  { key: "ask",       label: "ASK",   hint: "The Ask Kari widget is loaded" },
  { key: "favicon",   label: "Icon",  hint: "Declares a favicon" },
];

const DECLARED = [
  { key: "auth",  label: "Login", hint: "Someone can log in" },
  { key: "reset", label: "Reset", hint: "Password reset actually works" },
  { key: "email", label: "Mail",  hint: "Transactional mail wired to the hub" },
  { key: "pay",   label: "Pay",   hint: "Can take money (or n/a)" },
];

// Declared checks cycle: unknown → yes → no → not applicable → unknown.
const NEXT = { undefined: true, null: true, true: false, false: "na", na: null };

function Cell({ state, onClick, title }) {
  const look =
    state === true ? { bg: "#f0fdf4", fg: N.green, mark: "✓", bd: "#bbf7d0" }
    : state === false ? { bg: "#fef2f2", fg: N.red, mark: "✕", bd: "#fecaca" }
    : state === "na" ? { bg: N.wall, fg: N.mutedLite, mark: "–", bd: N.rule }
    : { bg: N.white, fg: "#cbd5e1", mark: "?", bd: N.rule };

  return (
    <div title={title} onClick={onClick}
      style={{
        width: 30, height: 22, borderRadius: 5, background: look.bg,
        border: `1px solid ${look.bd}`, color: look.fg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700,
        cursor: onClick ? "pointer" : "default", flexShrink: 0,
      }}>
      {look.mark}
    </div>
  );
}

export default function KingdomPanel({ data, scanning, onScan, onSetCheck }) {
  if (!data) {
    return (
      <Panel color={N.blueHot} rgb={N_RGB.orange} title="The Kingdom" subtitle="Every property against the baseline" onRefresh={onScan}>
        <Quiet>Loading…</Quiet>
      </Panel>
    );
  }
  if (!data.ok) {
    return (
      <Panel color={N.blueHot} rgb={N_RGB.orange} title="The Kingdom" subtitle="Every property against the baseline" onRefresh={onScan}>
        <Quiet>Couldn't read the property list{data.error ? ` — ${data.error}` : ""}.</Quiet>
      </Panel>
    );
  }

  const props = data.properties || [];
  const probedAt = props.map((p) => p.probed_at).filter(Boolean).sort().pop();

  // Two separate scores, never added together.
  let mOk = 0, mTotal = 0, dOk = 0, dTotal = 0;
  for (const p of props) {
    for (const c of MEASURED) {
      if (p.probed_at) { mTotal++; if (p.probe?.[c.key]) mOk++; }
    }
    for (const c of DECLARED) {
      const v = p.checks?.[c.key];
      if (v === "na") continue;
      dTotal++;
      if (v === true) dOk++;
    }
  }

  const head = (label, hint) => (
    <div key={label} title={hint} style={{ width: 30, flexShrink: 0, fontFamily: "'DM Mono', monospace", fontSize: 8.5, letterSpacing: "0.02em", color: N.muted, textAlign: "center", lineHeight: 1.1, whiteSpace: "nowrap" }}>
      {label}
    </div>
  );

  return (
    <Panel color={N.blueHot} rgb={N_RGB.orange} title="The Kingdom"
      subtitle={`${props.length} properties against the baseline`}
      asOf={probedAt} onRefresh={onScan}>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <div style={{ background: N.white, border: `1px solid ${N.rule}`, borderRadius: 10, padding: "9px 13px", flex: "1 1 150px" }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: mTotal && mOk === mTotal ? N.green : N.blue, lineHeight: 1.1 }}>
            {probedAt ? `${mOk}/${mTotal}` : "—"}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: N.muted, marginTop: 3 }}>
            Measured green
          </div>
        </div>
        <div style={{ background: N.white, border: `1px solid ${N.rule}`, borderRadius: 10, padding: "9px 13px", flex: "1 1 150px" }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: dOk ? N.green : N.mutedLite, lineHeight: 1.1 }}>{dOk}/{dTotal}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: N.muted, marginTop: 3 }}>
            Declared green
          </div>
        </div>
        <button onClick={onScan} disabled={scanning}
          style={{ fontFamily: "'Figtree', sans-serif", fontSize: 12.5, fontWeight: 700, background: scanning ? N.white : N.blue, color: scanning ? N.muted : N.white, border: `1px solid ${scanning ? N.rule : N.blue}`, borderRadius: 8, padding: "8px 15px", cursor: scanning ? "wait" : "pointer" }}>
          {scanning ? "Scanning…" : probedAt ? "Re-scan" : "Scan all"}
        </button>
      </div>

      {!probedAt && (
        <div style={{ fontSize: 12.5, color: N.muted, background: N.white, border: `1px solid ${N.rule}`, borderLeft: `3px solid ${N.blueHot}`, borderRadius: 6, padding: "8px 11px", marginBottom: 12, lineHeight: 1.5 }}>
          Nothing measured yet. A scan fetches all {props.length} sites and fills the left-hand columns; the right-hand ones are yours to set.
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 640 }}>
          {/* column headings, in their two halves */}
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", paddingBottom: 6, borderBottom: `1px solid ${N.rule}` }}>
            <div style={{ flex: 1, minWidth: 170, fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: N.mutedLite }}>Property</div>
            <div style={{ display: "flex", gap: 4, paddingRight: 8, borderRight: `1px solid ${N.rule}` }}>
              {MEASURED.map((c) => head(c.label, c.hint))}
            </div>
            <div style={{ display: "flex", gap: 4, paddingLeft: 4 }}>
              {DECLARED.map((c) => head(c.label, c.hint))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, padding: "3px 0 7px" }}>
            <div style={{ flex: 1, minWidth: 170 }} />
            <div style={{ width: MEASURED.length * 34, fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", color: N.blue, textAlign: "center" }}>measured</div>
            <div style={{ width: DECLARED.length * 34, fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", color: N.pinkDark, textAlign: "center" }}>you say</div>
          </div>

          {props.map((p) => {
            const probed = Boolean(p.probed_at);
            const down = probed && !p.probe?.ok;
            return (
              <div key={p.id} style={{ display: "flex", gap: 4, alignItems: "center", padding: "6px 0", borderTop: `1px solid ${N.rule}` }}>
                <div style={{ flex: 1, minWidth: 170, paddingRight: 10 }}>
                  <a href={`https://${p.host}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, fontWeight: 600, color: down ? N.red : N.ink, textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {down ? "▲ " : ""}{p.host}
                  </a>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, color: N.mutedLite, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {[p.status, p.backend].filter(Boolean).join(" · ")}
                    {probed && p.probe?.error ? ` · ${p.probe.error}` : ""}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 4, paddingRight: 8, borderRight: `1px solid ${N.rule}` }}>
                  {MEASURED.map((c) => {
                    let why = probed ? (p.probe?.[c.key] ? "yes" : "no") : null;
                    // A pasted-in tag nobody filled out reads as "no", and the
                    // tooltip has to say which kind of no it is.
                    if (c.key === "analytics" && probed) {
                      if (p.probe?.analyticsPlaceholder) why = `placeholder id ${p.probe.analyticsId} — records nothing`;
                      else if (p.probe?.analyticsId) why = p.probe.analyticsId;
                    }
                    return (
                      <Cell key={c.key}
                        state={probed ? Boolean(p.probe?.[c.key]) : null}
                        title={probed ? `${c.hint} — ${why}` : "Not scanned yet"} />
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: 4, paddingLeft: 4 }}>
                  {DECLARED.map((c) => {
                    const v = p.checks?.[c.key];
                    return (
                      <Cell key={c.key} state={v === undefined ? null : v}
                        title={`${c.hint} — click to change`}
                        onClick={() => onSetCheck(p, c.key, NEXT[String(v)])} />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.mutedLite, marginTop: 12, lineHeight: 1.6 }}>
        ✓ yes · ✕ no · – not applicable · ? nobody has said.
        Left of the line was measured by fetching the site; right of it is what you've declared.
      </div>
    </Panel>
  );
}
