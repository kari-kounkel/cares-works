// RentalModal — Laurie adds or edits a rental.
// Handles renter info, dates + recurrence, space multi-select, rate, deposit + insurance status.
// Writes to org_rentals + org_rental_spaces link table.

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { N } from "../design/neon";

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function RentalModal({ orgId, spaces, rental, accent, onClose, onSaved }) {
  const isEdit = !!rental;

  const [values, setValues] = useState(() => ({
    renter_name: rental?.renter_name || "",
    renter_org: rental?.renter_org || "",
    renter_email: rental?.renter_email || "",
    renter_phone: rental?.renter_phone || "",
    is_member: rental?.is_member || false,
    purpose: rental?.purpose || "",
    starts_at: rental?.starts_at ? isoLocal(rental.starts_at) : "",
    ends_at: rental?.ends_at ? isoLocal(rental.ends_at) : "",
    released_at: rental?.released_at ? isoLocal(rental.released_at) : "",
    is_recurring: !!(rental?.recurs_weekdays?.length),
    recurs_weekdays: rental?.recurs_weekdays || [],
    recurs_until: rental?.recurs_until ? String(rental.recurs_until).slice(0,10) : "",
    rate_charged: rental?.rate_charged ?? "",
    deposit_status: rental?.deposit_status || "pending",
    insurance_status: rental?.insurance_status || "not_required",
    status: rental?.status || "confirmed",
    notes: rental?.notes || "",
    space_ids: rental?.space_ids || [],
  }));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && !saving) onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const setField = (k, v) => setValues(prev => ({ ...prev, [k]: v }));

  const toggleSpace = (id) => setValues(prev => ({
    ...prev, space_ids: prev.space_ids.includes(id) ? prev.space_ids.filter(x => x !== id) : [...prev.space_ids, id]
  }));

  const toggleWeekday = (d) => setValues(prev => ({
    ...prev, recurs_weekdays: prev.recurs_weekdays.includes(d) ? prev.recurs_weekdays.filter(x => x !== d) : [...prev.recurs_weekdays, d]
  }));

  async function handleSave() {
    setErr("");
    if (!values.renter_name.trim()) { setErr("Renter name is required."); return; }
    if (!values.starts_at || !values.ends_at) { setErr("Start and end times are required."); return; }
    if (values.space_ids.length === 0) { setErr("Pick at least one space."); return; }
    if (values.is_recurring && values.recurs_weekdays.length === 0) { setErr("Pick at least one weekday for the recurrence."); return; }

    setSaving(true);
    const payload = {
      org_id: orgId,
      renter_name:  values.renter_name.trim(),
      renter_org:   values.renter_org.trim()   || null,
      renter_email: values.renter_email.trim() || null,
      renter_phone: values.renter_phone.trim() || null,
      is_member:    values.is_member,
      starts_at:    new Date(values.starts_at).toISOString(),
      ends_at:      new Date(values.ends_at).toISOString(),
      released_at:  values.released_at ? new Date(values.released_at).toISOString() : new Date(values.ends_at).toISOString(),
      recurs_weekdays: values.is_recurring ? values.recurs_weekdays : null,
      recurs_until:    values.is_recurring && values.recurs_until ? values.recurs_until : null,
      rate_charged:    values.rate_charged === "" ? null : Number(values.rate_charged),
      deposit_status:  values.deposit_status,
      insurance_status: values.insurance_status,
      status:  values.status,
      purpose: values.purpose.trim() || null,
      notes:   values.notes.trim() || null,
    };

    let rentalId = rental?.id;
    if (isEdit) {
      const { error: e1 } = await supabase.from("org_rentals").update(payload).eq("id", rentalId);
      if (e1) { setSaving(false); setErr(e1.message); return; }
      // Replace space links
      await supabase.from("org_rental_spaces").delete().eq("rental_id", rentalId);
    } else {
      const { data, error: e1 } = await supabase.from("org_rentals").insert(payload).select().single();
      if (e1 || !data) { setSaving(false); setErr(e1?.message || "Save failed."); return; }
      rentalId = data.id;
    }

    if (values.space_ids.length) {
      const links = values.space_ids.map(sid => ({ rental_id: rentalId, space_id: sid }));
      const { error: e2 } = await supabase.from("org_rental_spaces").insert(links);
      if (e2) { setSaving(false); setErr("Rental saved but couldn't link spaces: " + e2.message); return; }
    }
    setSaving(false);
    onSaved && onSaved();
  }

  return (
    <div style={overlay}>
      <div style={modal(accent)}>
        <div style={header}>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, margin: 0 }}>{isEdit ? "Edit rental" : "+ Add rental"}</h3>
          <button onClick={onClose} disabled={saving} style={xBtn}>×</button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>

          <SectionLabel>WHO</SectionLabel>
          <div style={grid2}>
            <Field label="Renter name *"><input value={values.renter_name} onChange={e => setField("renter_name", e.target.value)} style={inputSty(accent)} autoFocus /></Field>
            <Field label="Organization"><input value={values.renter_org} onChange={e => setField("renter_org", e.target.value)} style={inputSty(accent)} placeholder="ETH Elementary, Smith Family..." /></Field>
            <Field label="Email"><input type="email" value={values.renter_email} onChange={e => setField("renter_email", e.target.value)} style={inputSty(accent)} /></Field>
            <Field label="Phone"><input value={values.renter_phone} onChange={e => setField("renter_phone", e.target.value)} style={inputSty(accent)} /></Field>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: N.ink, cursor: "pointer" }}>
            <input type="checkbox" checked={values.is_member} onChange={e => setField("is_member", e.target.checked)} />
            Member/Staff (eligible for member-tier rate)
          </label>

          <SectionLabel>WHEN</SectionLabel>
          <div style={grid2}>
            <Field label="Starts *"><input type="datetime-local" value={values.starts_at} onChange={e => setField("starts_at", e.target.value)} style={inputSty(accent)} /></Field>
            <Field label="Ends *"><input type="datetime-local" value={values.ends_at} onChange={e => setField("ends_at", e.target.value)} style={inputSty(accent)} /></Field>
          </div>
          <Field label="Room releases (when the space actually becomes free again — Laurie's call; defaults to Ends)">
            <input type="datetime-local" value={values.released_at} onChange={e => setField("released_at", e.target.value)} style={inputSty(accent)} />
          </Field>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: N.ink, cursor: "pointer" }}>
            <input type="checkbox" checked={values.is_recurring} onChange={e => setField("is_recurring", e.target.checked)} />
            Repeats weekly
          </label>
          {values.is_recurring && (
            <div style={{ paddingLeft: 8 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                {WEEKDAYS.map(d => {
                  const on = values.recurs_weekdays.includes(d);
                  return (
                    <button key={d} type="button" onClick={() => toggleWeekday(d)}
                      style={{ padding: "6px 12px", background: on ? accent.color : N.white, color: on ? N.white : N.muted, border: on ? "none" : `1.5px solid ${N.rule}`, borderRadius: 6, fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em" }}>{d}</button>
                  );
                })}
              </div>
              <Field label="Repeats until (leave blank for ongoing)">
                <input type="date" value={values.recurs_until} onChange={e => setField("recurs_until", e.target.value)} style={inputSty(accent)} />
              </Field>
            </div>
          )}

          <SectionLabel>WHERE</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 6 }}>
            {spaces.filter(s => s.rentable).map(s => {
              const selected = values.space_ids.includes(s.id);
              return (
                <button key={s.id} type="button" onClick={() => toggleSpace(s.id)}
                  style={{ padding: "8px 10px", background: selected ? `rgba(${accent.rgb},0.14)` : N.white, border: `1.5px solid ${selected ? accent.color : N.rule}`, borderRadius: 6, cursor: "pointer", fontSize: 12, color: N.ink, fontFamily: "'Figtree', sans-serif", textAlign: "left", position: "relative" }}>
                  {selected && <span style={{ position: "absolute", top: 4, right: 6, color: accent.color, fontWeight: 700 }}>✓</span>}
                  {s.name}
                </button>
              );
            })}
          </div>

          <SectionLabel>DETAILS</SectionLabel>
          <Field label="Purpose / event"><input value={values.purpose} onChange={e => setField("purpose", e.target.value)} style={inputSty(accent)} placeholder="Wedding reception, homeschool co-op, funeral..." /></Field>
          <div style={grid2}>
            <Field label="Rate charged ($)"><input type="number" step="0.01" value={values.rate_charged} onChange={e => setField("rate_charged", e.target.value)} style={inputSty(accent)} /></Field>
            <Field label="Status">
              <select value={values.status} onChange={e => setField("status", e.target.value)} style={inputSty(accent)}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </Field>
            <Field label="Deposit">
              <select value={values.deposit_status} onChange={e => setField("deposit_status", e.target.value)} style={inputSty(accent)}>
                <option value="pending">Pending</option>
                <option value="received">Received</option>
                <option value="waived">Waived</option>
                <option value="refunded">Refunded</option>
              </select>
            </Field>
            <Field label="Insurance">
              <select value={values.insurance_status} onChange={e => setField("insurance_status", e.target.value)} style={inputSty(accent)}>
                <option value="not_required">Not required</option>
                <option value="required_pending">Required — pending</option>
                <option value="required_received">Required — received</option>
              </select>
            </Field>
          </div>
          <Field label="Notes (setup needs, tech, cleaning, contacts, anything else)"><textarea rows={4} value={values.notes} onChange={e => setField("notes", e.target.value)} style={{ ...inputSty(accent), resize: "vertical", lineHeight: 1.55 }} /></Field>

          {err && <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.08)", border: `1px solid ${N.red}`, borderLeft: `4px solid ${N.red}`, borderRadius: 6, color: N.red, fontSize: 12, fontWeight: 600 }}>{err}</div>}
        </div>

        <div style={footer}>
          <button type="button" onClick={onClose} disabled={saving} style={cancelBtn}>Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} style={saveBtn(accent, saving)}>{saving ? "Saving…" : isEdit ? "Save changes" : "Add rental"}</button>
        </div>
      </div>
    </div>
  );
}

function isoLocal(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2,"0");
  return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

function SectionLabel({ children }) {
  return <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.muted, fontWeight: 700, marginTop: 6, borderTop: `1px dashed ${N.rule}`, paddingTop: 12 }}>{children}</div>;
}
function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: N.muted, fontWeight: 700 }}>{label}</span>
      {children}
    </label>
  );
}

const overlay = { position: "fixed", inset: 0, background: "rgba(10,10,20,0.6)", zIndex: 1100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" };
const modal = (accent) => ({ width: "100%", maxWidth: 720, background: N.white, border: `2px solid ${accent.color}`, borderRadius: 14, boxShadow: `0 12px 40px rgba(0,0,0,0.35), 0 0 40px ${accent.color}44`, fontFamily: "'Figtree', sans-serif", color: N.ink });
const header = { padding: "16px 22px", borderBottom: `1px solid ${N.rule}`, display: "flex", alignItems: "center", justifyContent: "space-between" };
const footer = { padding: "14px 22px", borderTop: `1px solid ${N.rule}`, display: "flex", justifyContent: "flex-end", gap: 10 };
const xBtn = { background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: N.muted, lineHeight: 1 };
const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const inputSty = (accent) => ({ width: "100%", padding: "9px 12px", background: N.white, border: `1.5px solid ${N.rule}`, borderRadius: 8, fontFamily: "'Figtree', sans-serif", fontSize: 13, color: N.ink, outline: "none", boxSizing: "border-box" });
const cancelBtn = { background: "transparent", border: `1px solid ${N.rule}`, borderRadius: 8, padding: "9px 16px", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", fontWeight: 700, color: N.muted, cursor: "pointer", textTransform: "uppercase" };
const saveBtn = (accent, saving) => ({ background: accent.color, color: N.white, border: "none", borderRadius: 8, padding: "9px 18px", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1, textTransform: "uppercase", boxShadow: saving ? "none" : `0 3px 12px ${accent.color}66` });
