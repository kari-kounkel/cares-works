// FacilitiesMap — clickable SVG floor map with date/time slider.
// Rooms flash their renter's color for the moment the user is inspecting.
// Reused on OrgHome (member) + /rent/:slug (public).
//
// Props:
//   spaces  — array from org_spaces (needs svg_x/y/w/h or svg_path)
//   rentals — array of active rentals (each has starts_at, ends_at, all_day,
//             recurs_weekdays, recurs_until, space_ids[])
//   accent  — { color, rgb } from the parent
//   onSpaceClick(space) — optional click handler
//
import { useState, useMemo, useEffect } from "react";
import { N } from "../design/neon";

const MOBILE_CSS = `
  @media (max-width: 700px) {
    .fm-slider-row { flex-direction: column !important; align-items: stretch !important; }
    .fm-slider-row > * { width: 100%; }
    .fm-bumps { justify-content: space-between !important; flex-wrap: wrap; }
    .fm-tooltip { position: static !important; margin-top: 12px; max-width: 100% !important; }
    .fm-legend { justify-content: flex-start !important; }
    .fm-timeline { font-size: 10px !important; }
    .fm-timeline-label { width: 90px !important; font-size: 10px !important; }
  }
`;

// Day-view helpers
const DAY_START_HOUR = 6;   // 6am
const DAY_END_HOUR   = 22;  // 10pm
const DAY_HOURS = DAY_END_HOUR - DAY_START_HOUR;

// For a rental on a specific date, compute its actual time + block-boundary
// (starts_at → ends_at) AND the released_at (when room becomes free) so the day
// view can render both the block AND the inner pill for actual event time.
function rentalHoursOnDay(rental, dateStr, blockHours = 4) {
  const dayStart = new Date(dateStr + "T00:00:00");
  const dayEnd   = new Date(dateStr + "T23:59:59");
  const startTs = new Date(rental.starts_at).getTime();
  const endTs   = new Date(rental.ends_at).getTime();
  const releasedIso = rental.released_at || rental.ends_at;
  // One-off
  if (!rental.recurs_weekdays || rental.recurs_weekdays.length === 0) {
    if (new Date(releasedIso).getTime() < dayStart.getTime() || startTs > dayEnd.getTime()) return null;
    return timeSliceWithBlock(rental.starts_at, rental.ends_at, releasedIso, dateStr, blockHours);
  }
  // Recurring
  const untilOK = !rental.recurs_until || new Date(rental.recurs_until + "T23:59:59").getTime() >= dayStart.getTime();
  const startedOK = startTs <= dayEnd.getTime();
  if (!untilOK || !startedOK) return null;
  const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dow = weekdays[dayStart.getDay()];
  if (!rental.recurs_weekdays.includes(dow)) return null;
  const startDate = new Date(rental.starts_at);
  const endDate   = new Date(rental.ends_at);
  const rDate     = new Date(releasedIso);
  const s = new Date(dateStr + "T" + pad(startDate.getHours()) + ":" + pad(startDate.getMinutes()));
  const e = new Date(dateStr + "T" + pad(endDate.getHours())   + ":" + pad(endDate.getMinutes()));
  const r = new Date(dateStr + "T" + pad(rDate.getHours())     + ":" + pad(rDate.getMinutes()));
  return timeSliceWithBlock(s.toISOString(), e.toISOString(), r.toISOString(), dateStr, blockHours);
}
function pad(n) { return String(n).padStart(2,"0"); }
// Returns: { startH, endH, blockStartH, blockEndH, releasedH, actualLabel, blockLabel }
// startH/endH = actual event time (the pill)
// blockStartH/blockEndH = block boundary (rounded up to blockHours)
// releasedH = when the room actually becomes free (Laurie's per-rental override)
function timeSliceWithBlock(startIso, endIso, releasedIso, dateStr, blockHours) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const r = new Date(releasedIso);
  const dayStart = new Date(dateStr + "T00:00:00");
  const dayEnd   = new Date(dateStr + "T23:59:59");
  const sh = Math.max(DAY_START_HOUR, (s.getTime() >= dayStart.getTime() ? s.getHours() + s.getMinutes()/60 : DAY_START_HOUR));
  const eh = Math.min(DAY_END_HOUR,   (e.getTime() <= dayEnd.getTime()   ? e.getHours() + e.getMinutes()/60 : DAY_END_HOUR));
  if (eh <= sh) return null;
  const durationH = eh - sh;
  const blocksNeeded = Math.max(1, Math.ceil(durationH / blockHours));
  const blockStartH = sh;
  const blockEndH   = Math.min(DAY_END_HOUR, sh + (blocksNeeded * blockHours));
  const releasedH   = Math.min(DAY_END_HOUR, r.getTime() >= dayStart.getTime() && r.getTime() <= dayEnd.getTime() ? r.getHours() + r.getMinutes()/60 : blockEndH);
  return {
    startH: sh, endH: eh,
    blockStartH, blockEndH, releasedH,
    actualLabel: s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) + " – " + e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    blockLabel: blocksNeeded + " × " + blockHours + "hr block" + (blocksNeeded === 1 ? "" : "s"),
  };
}

// Color rotator so different renters get visually distinct colors on the map
const RENTER_COLORS = ["#0080ff", "#22c55e", "#ff8a2a", "#a855f7", "#ec4899", "#14b8a6", "#f59e0b"];

function isActiveAt(rental, moment) {
  const startTs = new Date(rental.starts_at).getTime();
  const endTs   = new Date(rental.ends_at).getTime();
  const momentTs = moment.getTime();
  // One-off case: no recurrence
  if (!rental.recurs_weekdays || rental.recurs_weekdays.length === 0) {
    return momentTs >= startTs && momentTs <= endTs;
  }
  // Recurring case: within recurs_until window AND time-of-day matches AND weekday matches
  const untilTs = rental.recurs_until ? new Date(rental.recurs_until + "T23:59:59").getTime() : Infinity;
  if (momentTs > untilTs || momentTs < startTs) return false;
  const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dow = weekdays[moment.getDay()];
  if (!rental.recurs_weekdays.includes(dow)) return false;
  // Time-of-day compare: mins-of-day between starts_at's TOD and ends_at's TOD
  const startTod = timeOfDayMin(new Date(rental.starts_at));
  const endTod   = timeOfDayMin(new Date(rental.ends_at));
  const nowTod   = timeOfDayMin(moment);
  return nowTod >= startTod && nowTod <= endTod;
}
function timeOfDayMin(d) { return d.getHours() * 60 + d.getMinutes(); }

function fmtDT(d) {
  const iso = d.toISOString();
  return iso.slice(0, 16); // YYYY-MM-DDTHH:MM for datetime-local input
}

export default function FacilitiesMap({ spaces = [], rentals = [], accent = { color: N.blue, rgb: "0,128,255" }, onSpaceClick }) {
  const [when, setWhen] = useState(() => {
    // Default to the next upcoming rental start OR now
    const upcoming = rentals
      .map(r => new Date(r.starts_at))
      .filter(d => d.getTime() > Date.now())
      .sort((a, b) => a - b)[0];
    return upcoming || new Date();
  });
  const [hoverSpace, setHoverSpace] = useState(null);

  // For a given moment, figure out which rooms are occupied by which rental
  const activeMap = useMemo(() => {
    const active = rentals.filter(r => isActiveAt(r, when));
    // Assign each active rental a color based on its position in the full rentals list (stable per renter)
    const idxByRental = new Map();
    rentals.forEach((r, i) => idxByRental.set(r.id, i));
    const map = new Map();
    active.forEach(r => {
      const color = RENTER_COLORS[idxByRental.get(r.id) % RENTER_COLORS.length];
      (r.space_ids || []).forEach(sid => {
        if (!map.has(sid)) map.set(sid, []);
        map.get(sid).push({ ...r, color });
      });
    });
    return map;
  }, [rentals, when]);

  // Compute viewBox — auto-fit to the space rects with padding
  const vb = useMemo(() => {
    if (spaces.length === 0) return "0 0 1000 1200";
    const xs = spaces.flatMap(s => [Number(s.svg_x || 0), Number(s.svg_x || 0) + Number(s.svg_w || 0)]);
    const ys = spaces.flatMap(s => [Number(s.svg_y || 0), Number(s.svg_y || 0) + Number(s.svg_h || 0)]);
    const minX = Math.min(...xs) - 20;
    const minY = Math.min(...ys) - 20;
    const maxX = Math.max(...xs) + 20;
    const maxY = Math.max(...ys) + 20;
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [spaces]);

  // Simple nudge buttons for time
  const bump = (mins) => setWhen(prev => new Date(prev.getTime() + mins * 60_000));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{MOBILE_CSS}</style>

      {/* DATE/TIME SLIDER */}
      <div className="fm-slider-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: N.white, border: `1.5px solid ${N.rule}`, borderRadius: 10, flexWrap: "wrap" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.muted, fontWeight: 700 }}>SHOWING</div>
        <input type="datetime-local" value={fmtDT(when).slice(0,16)} onChange={e => setWhen(new Date(e.target.value))}
          style={{ padding: "8px 12px", background: N.white, border: `1.5px solid ${N.rule}`, borderRadius: 8, fontFamily: "'Figtree', sans-serif", fontSize: 13, color: N.ink, outline: "none" }} />
        <div className="fm-bumps" style={{ display: "flex", gap: 4 }}>
          <button onClick={() => bump(-60)}   style={btnMini(accent)}>−1h</button>
          <button onClick={() => bump(-30)}   style={btnMini(accent)}>−30m</button>
          <button onClick={() => setWhen(new Date())} style={{ ...btnMini(accent), background: accent.color, color: N.white, borderColor: accent.color }}>Now</button>
          <button onClick={() => bump(30)}    style={btnMini(accent)}>+30m</button>
          <button onClick={() => bump(60)}    style={btnMini(accent)}>+1h</button>
          <button onClick={() => bump(60*24)} style={btnMini(accent)}>+1d</button>
        </div>
        <div style={{ marginLeft: "auto", fontFamily: "'DM Mono', monospace", fontSize: 11, color: N.muted }}>
          {activeMap.size} space{activeMap.size === 1 ? "" : "s"} in use
        </div>
      </div>

      {/* MAP */}
      <div style={{ background: N.white, border: `1.5px solid ${N.rule}`, borderRadius: 12, padding: 14, position: "relative" }}>
        <svg viewBox={vb} style={{ width: "100%", height: "auto", maxHeight: 700, display: "block", fontFamily: "'Figtree', sans-serif" }}>
          {spaces.map(s => {
            const uses = activeMap.get(s.id) || [];
            const inUse = uses.length > 0;
            const primaryUse = uses[0];
            const fillColor = inUse ? primaryUse.color : (s.rentable ? "#f7f9fc" : "#eef2f7");
            const stroke    = inUse ? primaryUse.color : (s.rentable ? N.rule : "#cbd5e1");
            const opacity   = inUse ? 0.85 : (s.rentable ? 1 : 0.5);
            const isHover   = hoverSpace === s.id;
            return (
              <g key={s.id}
                 onMouseEnter={() => setHoverSpace(s.id)}
                 onMouseLeave={() => setHoverSpace(null)}
                 onClick={() => onSpaceClick && onSpaceClick(s)}
                 style={{ cursor: (onSpaceClick && s.rentable) ? "pointer" : "default" }}>
                <rect x={s.svg_x} y={s.svg_y} width={s.svg_w} height={s.svg_h}
                  fill={fillColor} stroke={stroke} strokeWidth={isHover ? 3 : 1.5} opacity={opacity}
                  rx={6} ry={6}
                  style={inUse ? { filter: `drop-shadow(0 0 8px ${primaryUse.color})` } : {}} />
                <text x={Number(s.svg_x) + Number(s.svg_w) / 2} y={Number(s.svg_y) + Number(s.svg_h) / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={inUse ? "#fff" : N.ink} fontSize={12} fontWeight={inUse ? 700 : 500}
                  style={{ pointerEvents: "none" }}>
                  {s.name}
                </text>
                {inUse && (
                  <text x={Number(s.svg_x) + Number(s.svg_w) / 2} y={Number(s.svg_y) + Number(s.svg_h) / 2 + 16}
                    textAnchor="middle" fill="#fff" fontSize={10} opacity={0.9}
                    style={{ pointerEvents: "none" }}>
                    {primaryUse.renter_name}{uses.length > 1 ? ` +${uses.length - 1}` : ""}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover / tap tooltip — mobile-friendly (position:static via CSS on small) */}
        {hoverSpace && (() => {
          const s = spaces.find(x => x.id === hoverSpace);
          if (!s) return null;
          const uses = activeMap.get(s.id) || [];
          return (
            <div className="fm-tooltip" style={{ position: "absolute", top: 20, right: 20, background: N.white, border: `1.5px solid ${accent.color}`, borderRadius: 8, padding: "10px 14px", boxShadow: `0 4px 20px ${accent.color}44`, maxWidth: 280 }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: N.ink }}>{s.name}</div>
              {s.category && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: N.muted, textTransform: "uppercase", marginTop: 2 }}>{s.category}{s.capacity ? ` · ${s.capacity} capacity` : ""}</div>}
              {!s.rentable && <div style={{ marginTop: 6, fontSize: 11, color: N.muted, fontStyle: "italic" }}>Not rentable — internal use only</div>}
              {uses.length === 0 && s.rentable && <div style={{ marginTop: 6, fontSize: 12, color: N.green, fontWeight: 700 }}>✓ Available at this time</div>}
              {uses.map(u => (
                <div key={u.id} style={{ marginTop: 6, padding: "6px 8px", background: `${u.color}22`, borderRadius: 6, fontSize: 12, color: N.ink }}>
                  <div style={{ fontWeight: 700 }}>{u.renter_name}</div>
                  <div style={{ fontSize: 11, color: N.muted, fontFamily: "'DM Mono', monospace" }}>{u.purpose || (u.recurs_weekdays?.join(",") || "one-off")}</div>
                </div>
              ))}
              {s.hourly_rate && <div style={{ marginTop: 8, fontSize: 12, color: N.ink }}>Hourly: <strong>${Number(s.hourly_rate).toFixed(2)}</strong>{s.member_rate ? ` · Members: $${Number(s.member_rate).toFixed(2)}` : ""}</div>}
            </div>
          );
        })()}
      </div>

      {/* DAY VIEW — see the whole day at a glance */}
      {(() => {
        const dayStr = when.toISOString().slice(0, 10);
        const rentableSpaces = spaces.filter(s => s.rentable);
        // Compute renter color same way as map
        const idxByRental = new Map();
        rentals.forEach((r, i) => idxByRental.set(r.id, i));
        // Collect bars per space
        const barsBySpace = new Map();
        rentableSpaces.forEach(s => barsBySpace.set(s.id, []));
        rentals.forEach(r => {
          const slice = rentalHoursOnDay(r, dayStr, 4);
          if (!slice) return;
          const color = RENTER_COLORS[idxByRental.get(r.id) % RENTER_COLORS.length];
          (r.space_ids || []).forEach(sid => {
            if (barsBySpace.has(sid)) barsBySpace.get(sid).push({ ...slice, rental: r, color });
          });
        });
        return (
          <div style={{ background: N.white, border: `1.5px solid ${N.rule}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.muted, fontWeight: 700 }}>DAY VIEW · {when.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted }}>{DAY_START_HOUR}am — {DAY_END_HOUR === 24 ? "midnight" : (DAY_END_HOUR - 12) + "pm"}</div>
            </div>
            <div className="fm-timeline" style={{ fontSize: 11 }}>
              {/* Hour markers header */}
              <div style={{ display: "flex", marginBottom: 6, marginLeft: 130 }}>
                {Array.from({ length: DAY_HOURS + 1 }, (_, i) => {
                  const h = DAY_START_HOUR + i;
                  const label = h === 12 ? "12p" : (h > 12 ? (h - 12) + "p" : h + "a");
                  return (
                    <div key={h} style={{ flex: 1, textAlign: "left", fontFamily: "'DM Mono', monospace", fontSize: 9, color: N.muted, borderLeft: `1px solid ${N.rule}`, paddingLeft: 4 }}>{label}</div>
                  );
                })}
              </div>
              {/* Rows: one per rentable space */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 480, overflowY: "auto" }}>
                {rentableSpaces.map(s => {
                  const bars = barsBySpace.get(s.id) || [];
                  const isSelected = false;
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "stretch", minHeight: 26 }}>
                      <button
                        className="fm-timeline-label"
                        onClick={() => onSpaceClick && s.rentable && onSpaceClick(s)}
                        style={{ width: 130, padding: "3px 8px", fontFamily: "'Figtree', sans-serif", fontSize: 11, color: N.ink, background: "transparent", border: "none", textAlign: "left", cursor: onSpaceClick ? "pointer" : "default", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                        title={s.name}>{s.name}</button>
                      <div style={{ flex: 1, position: "relative", background: `repeating-linear-gradient(to right, transparent, transparent calc(${100 / DAY_HOURS}% - 1px), ${N.rule} calc(${100 / DAY_HOURS}% - 1px), ${N.rule} calc(${100 / DAY_HOURS}%))`, borderRadius: 4, minHeight: 22 }}>
                        {bars.map((b, i) => {
                          // OUTER = full reserved period (block + cleaning until released)
                          const blockLeftPct  = ((b.blockStartH - DAY_START_HOUR) / DAY_HOURS) * 100;
                          const blockWidthPct = ((b.releasedH - b.blockStartH) / DAY_HOURS) * 100;
                          // INNER pill = actual event time within the block
                          const innerLeftPct  = ((b.startH - b.blockStartH) / (b.releasedH - b.blockStartH)) * 100;
                          const innerWidthPct = ((b.endH - b.startH) / (b.releasedH - b.blockStartH)) * 100;
                          return (
                            <div key={i}
                              title={`${b.rental.renter_name}\nActual: ${b.actualLabel}\nBlock: ${b.blockLabel}${b.rental.purpose ? "\nPurpose: " + b.rental.purpose : ""}`}
                              onClick={() => onSpaceClick && onSpaceClick(s)}
                              style={{ position: "absolute", left: blockLeftPct + "%", width: blockWidthPct + "%", top: 2, bottom: 2, background: b.color + "55", border: `1.5px dashed ${b.color}`, borderRadius: 4, cursor: onSpaceClick ? "pointer" : "default", overflow: "hidden" }}>
                              {/* Inner pill = actual event time */}
                              <div style={{ position: "absolute", left: innerLeftPct + "%", width: innerWidthPct + "%", top: 2, bottom: 2, background: b.color, borderRadius: 999, boxShadow: `0 0 8px ${b.color}`, padding: "0 8px", fontSize: 10, color: "#fff", fontWeight: 700, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", lineHeight: "16px", display: "flex", alignItems: "center" }}>
                                {b.rental.renter_name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              {rentableSpaces.every(s => (barsBySpace.get(s.id) || []).length === 0) && (
                <div style={{ padding: "16px 12px", textAlign: "center", color: N.muted, fontSize: 12, fontStyle: "italic" }}>
                  Nothing booked on {when.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}. The whole day is open.
                </div>
              )}
              {/* Legend: block vs actual */}
              <div style={{ marginTop: 10, display: "flex", gap: 14, alignItems: "center", fontSize: 10, color: N.muted, fontFamily: "'DM Mono', monospace", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-block", width: 24, height: 12, background: accent.color + "55", border: `1.5px dashed ${accent.color}`, borderRadius: 3 }} />
                  <span>4-hr block reserved</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-block", width: 20, height: 10, background: accent.color, borderRadius: 999 }} />
                  <span>Actual event time</span>
                </div>
                <div style={{ opacity: 0.7 }}>Cleaning padding = the empty space between the inner pill and the block edge (Laurie sets per rental).</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* LEGEND — current rentals */}
      {activeMap.size > 0 && (
        <div className="fm-legend" style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "10px 14px", background: N.white, border: `1px solid ${N.rule}`, borderRadius: 10 }}>
          {[...new Set([...activeMap.values()].flat().map(r => r.id))].map(rid => {
            const r = [...activeMap.values()].flat().find(x => x.id === rid);
            return (
              <div key={rid} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: N.ink }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: r.color, boxShadow: `0 0 6px ${r.color}` }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{r.renter_name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function btnMini(accent) {
  return {
    padding: "5px 10px",
    fontSize: 11,
    fontFamily: "'DM Mono', monospace",
    letterSpacing: "0.05em",
    fontWeight: 700,
    background: N.white,
    color: accent.color,
    border: `1.5px solid ${accent.color}66`,
    borderRadius: 6,
    cursor: "pointer",
  };
}
