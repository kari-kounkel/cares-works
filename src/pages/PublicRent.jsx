import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { N, N_RGB, FONT_LINK, NeonBox, SignatureFooter, WASH_BG_LITE } from "../design/neon";
import FacilitiesMap from "../components/FacilitiesMap";

// PUBLIC rental page. No login. Anyone with the URL can:
//  1. See the interactive map + calendar (via FacilitiesMap)
//  2. See a list of rentable spaces + rates
//  3. Submit a rental request (writes to org_rental_requests via anon insert policy)
//
// Route: /rent/:slug

const ACCENTS = {
  blue:   { color: N.blue,   rgb: N_RGB.blue },
  orange: { color: N.orange, rgb: N_RGB.orange },
  pink:   { color: N.pink,   rgb: N_RGB.pink },
  green:  { color: N.green,  rgb: "34,197,94" },
};

const money = n => (n === null || n === undefined) ? null : "$" + Number(n).toFixed(2);

export default function PublicRent() {
  const slug = window.location.pathname.replace(/^\/rent\//, "").replace(/\/$/, "");
  const [state, setState] = useState({ loading: true });

  const [showForm, setShowForm] = useState(false);
  const [selectedSpaceIds, setSelectedSpaceIds] = useState([]);
  const [formValues, setFormValues] = useState({
    requester_name: "", requester_email: "", requester_phone: "", requester_org: "",
    is_member: false, purpose: "", notes: "",
    requested_starts_at: "", requested_ends_at: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitErr, setSubmitErr] = useState("");

  useEffect(() => {
    (async () => {
      if (!slug) { setState({ loading: false, error: "Missing organization." }); return; }
      const { data, error } = await supabase.rpc("get_public_rental_bundle", { p_slug: slug });
      if (error || !data || !data.org) { setState({ loading: false, error: "Rental page not found." }); return; }
      setState({ loading: false, org: data.org, spaces: data.spaces || [], rentals: data.rentals || [] });
    })();
  }, [slug]);

  const { loading, error, org, spaces = [], rentals = [] } = state;
  const accent = org ? (ACCENTS[org.accent] || ACCENTS.blue) : ACCENTS.blue;

  const toggleSpace = (id) => {
    setSelectedSpaceIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitErr("");
    if (selectedSpaceIds.length === 0) { setSubmitErr("Please pick at least one space."); return; }
    if (!formValues.requested_starts_at || !formValues.requested_ends_at) { setSubmitErr("Please pick a start and end date/time."); return; }
    setSubmitting(true);
    const { error: err } = await supabase.from("org_rental_requests").insert({
      org_id: org.id,
      requester_name: formValues.requester_name.trim(),
      requester_email: formValues.requester_email.trim(),
      requester_phone: formValues.requester_phone.trim() || null,
      requester_org: formValues.requester_org.trim() || null,
      is_member: formValues.is_member,
      requested_spaces: selectedSpaceIds,
      requested_starts_at: new Date(formValues.requested_starts_at).toISOString(),
      requested_ends_at:   new Date(formValues.requested_ends_at).toISOString(),
      purpose: formValues.purpose.trim() || null,
      notes:   formValues.notes.trim() || null,
    });
    setSubmitting(false);
    if (err) { setSubmitErr(err.message); return; }
    setSubmitted(true);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: WASH_BG_LITE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif", color: N.muted }}>
      <link href={FONT_LINK} rel="stylesheet" />Loading…
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: WASH_BG_LITE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif", padding: 24 }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: N.ink, marginBottom: 12 }}>{error}</h1>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: WASH_BG_LITE, fontFamily: "'Figtree', sans-serif", color: N.ink }}>
      <link href={FONT_LINK} rel="stylesheet" />

      <header style={{ background: N.white, borderBottom: "1px solid " + N.rule, padding: "12px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: accent.color, color: N.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 700 }}>
            {org.short_name || org.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, lineHeight: 1.15 }}>{org.name}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, textTransform: "uppercase" }}>{org.location} · Space Rentals</div>
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", padding: "5px 12px", borderRadius: 100, background: `rgba(${accent.rgb},0.12)`, color: accent.color, fontWeight: 700 }}>🏛 RENT A SPACE</span>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px 40px" }}>

        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: N.ink, marginBottom: 8, lineHeight: 1.15 }}>Rent space at {org.short_name || org.name}</h1>
          <p style={{ color: N.muted, fontSize: 15, maxWidth: 720, lineHeight: 1.55 }}>
            Pick a date and time to see what's available. Tap any room to add it to your request. Submit and we'll get back to you with rates and next steps.
          </p>
        </div>

        <FacilitiesMap
          spaces={spaces}
          rentals={rentals}
          accent={accent}
          onSpaceClick={s => { if (s.rentable) toggleSpace(s.id); }}
        />

        {/* Room list with rates + selection */}
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 12 }}>Available Spaces</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {spaces.filter(s => s.rentable).map(s => {
              const selected = selectedSpaceIds.includes(s.id);
              return (
                <button key={s.id} onClick={() => toggleSpace(s.id)}
                  style={{ padding: "14px 16px", background: selected ? `rgba(${accent.rgb},0.1)` : N.white, border: `2px solid ${selected ? accent.color : N.rule}`, borderRadius: 10, cursor: "pointer", fontFamily: "'Figtree', sans-serif", textAlign: "left", position: "relative", boxShadow: selected ? `0 0 20px ${accent.color}44` : "none" }}>
                  {selected && <div style={{ position: "absolute", top: 8, right: 10, color: accent.color, fontWeight: 700 }}>✓</div>}
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: N.ink }}>{s.name}</div>
                  {s.category && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: N.muted, textTransform: "uppercase", marginTop: 2 }}>{s.category}{s.capacity ? ` · ${s.capacity} cap` : ""}</div>}
                  {s.hourly_rate && <div style={{ fontSize: 12, color: N.ink, marginTop: 6 }}>{money(s.hourly_rate)}/hr{s.member_rate ? ` · Members ${money(s.member_rate)}` : ""}</div>}
                  {s.daily_rate && <div style={{ fontSize: 12, color: N.muted }}>Day: {money(s.daily_rate)}</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Request form */}
        <div style={{ marginTop: 30 }}>
          {!showForm && !submitted && (
            <button onClick={() => setShowForm(true)}
              style={{ padding: "14px 32px", background: accent.color, color: N.white, border: "none", borderRadius: 10, fontFamily: "'DM Mono', monospace", fontSize: 13, letterSpacing: "0.12em", fontWeight: 700, textTransform: "uppercase", cursor: "pointer", boxShadow: `0 4px 18px ${accent.color}66` }}>
              Request {selectedSpaceIds.length > 0 ? `${selectedSpaceIds.length} space${selectedSpaceIds.length === 1 ? "" : "s"}` : "a space"} →
            </button>
          )}

          {showForm && !submitted && (
            <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "24px 26px" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 6 }}>Send us your request</h3>
              <p style={{ color: N.muted, fontSize: 13, marginBottom: 18 }}>Someone from {org.name} will get back to you with rates + next steps. This isn't a booking yet — it's a request.</p>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <FormField label="Your name *"><input required value={formValues.requester_name} onChange={e => setFormValues({ ...formValues, requester_name: e.target.value })} style={fieldSty} /></FormField>
                  <FormField label="Email *"><input required type="email" value={formValues.requester_email} onChange={e => setFormValues({ ...formValues, requester_email: e.target.value })} style={fieldSty} /></FormField>
                  <FormField label="Phone"><input value={formValues.requester_phone} onChange={e => setFormValues({ ...formValues, requester_phone: e.target.value })} style={fieldSty} /></FormField>
                  <FormField label="Organization (optional)"><input value={formValues.requester_org} onChange={e => setFormValues({ ...formValues, requester_org: e.target.value })} style={fieldSty} placeholder="ETH Elementary, Jane's Wedding, etc." /></FormField>
                  <FormField label="Start date + time *"><input required type="datetime-local" value={formValues.requested_starts_at} onChange={e => setFormValues({ ...formValues, requested_starts_at: e.target.value })} style={fieldSty} /></FormField>
                  <FormField label="End date + time *"><input required type="datetime-local" value={formValues.requested_ends_at} onChange={e => setFormValues({ ...formValues, requested_ends_at: e.target.value })} style={fieldSty} /></FormField>
                </div>
                <FormField label="What's the event / purpose?"><input value={formValues.purpose} onChange={e => setFormValues({ ...formValues, purpose: e.target.value })} style={fieldSty} placeholder="Wedding reception, weekly homeschool co-op, birthday party..." /></FormField>
                <FormField label="Anything else we should know?"><textarea rows={3} value={formValues.notes} onChange={e => setFormValues({ ...formValues, notes: e.target.value })} style={{ ...fieldSty, resize: "vertical", lineHeight: 1.5 }} placeholder="Setup needs, expected attendance, any special requests..." /></FormField>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: N.ink }}>
                  <input type="checkbox" checked={formValues.is_member} onChange={e => setFormValues({ ...formValues, is_member: e.target.checked })} />
                  I'm a member of {org.short_name || org.name} (discount may apply)
                </label>
                <div style={{ fontSize: 12, color: N.muted, padding: "10px 12px", background: `rgba(${accent.rgb},0.05)`, borderRadius: 6 }}>
                  You're requesting: <strong>{selectedSpaceIds.length} space{selectedSpaceIds.length === 1 ? "" : "s"}</strong>
                  {selectedSpaceIds.length > 0 && ": " + selectedSpaceIds.map(id => spaces.find(s => s.id === id)?.name).filter(Boolean).join(", ")}
                </div>
                {submitErr && <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.08)", border: `1px solid ${N.red}`, borderLeft: `4px solid ${N.red}`, borderRadius: 6, color: N.red, fontSize: 12, fontWeight: 600 }}>{submitErr}</div>}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 18px", background: "transparent", border: `1.5px solid ${N.rule}`, borderRadius: 8, color: N.muted, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.1em", fontWeight: 700, cursor: "pointer" }}>CANCEL</button>
                  <button type="submit" disabled={submitting} style={{ padding: "10px 22px", background: accent.color, color: N.white, border: "none", borderRadius: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.1em", fontWeight: 700, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1, boxShadow: `0 4px 14px ${accent.color}66` }}>{submitting ? "SENDING…" : "SEND REQUEST →"}</button>
                </div>
              </form>
            </NeonBox>
          )}

          {submitted && (
            <NeonBox color={N.green} rgb="34,197,94" style={{ padding: "26px 30px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 8 }}>Request sent!</div>
              <p style={{ color: N.muted, fontSize: 14 }}>Someone from {org.name} will follow up with you at <strong style={{ color: N.ink }}>{formValues.requester_email}</strong>.</p>
            </NeonBox>
          )}
        </div>
      </div>

      <SignatureFooter />
    </div>
  );
}

const fieldSty = { width: "100%", padding: "9px 12px", background: N.white, border: `1.5px solid ${N.rule}`, borderRadius: 8, fontFamily: "'Figtree', sans-serif", fontSize: 13, color: N.ink, outline: "none", boxSizing: "border-box" };

function FormField({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: N.muted, fontWeight: 700 }}>{label}</span>
      {children}
    </label>
  );
}
