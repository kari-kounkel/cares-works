import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { N, N_RGB, FONT_LINK, NeonBox, SignatureFooter, WASH_BG_LITE } from "../design/neon";
import FacilitiesMap from "../components/FacilitiesMap";

const MOBILE_RENT = `
  @media (max-width: 700px) {
    .pr-form-grid { grid-template-columns: 1fr !important; }
    .pr-page { padding: 20px 16px 40px !important; }
    .pr-hero h1 { font-size: 26px !important; }
    .pr-tier-row { flex-direction: column !important; }
    .pr-tier-row button { width: 100% !important; }
  }
`;

// PUBLIC rental page. No login.
// - Interactive map + calendar (FacilitiesMap)
// - Tier picker (personal / ministry outside / non-ministry outside)
// - Live invoice preview based on selected spaces × time × tier
// - Rules agreement checkbox (required)
// - Submit request → org_rental_requests, plus a confirmation showing payment link + next steps

const ACCENTS = {
  blue:   { color: N.blue,   rgb: N_RGB.blue },
  orange: { color: N.orange, rgb: N_RGB.orange },
  pink:   { color: N.pink,   rgb: N_RGB.pink },
  green:  { color: N.green,  rgb: "34,197,94" },
};

const money = n => (n === null || n === undefined) ? "—" : "$" + Number(n).toFixed(2);

const TIERS = [
  { key: "member",   label: "Personal / Staff / Church Member",   rateField: "rate_member" },
  { key: "ministry", label: "Ministry Outside Group",             rateField: "rate_ministry" },
  { key: "outside",  label: "Non-Ministry Outside Group",         rateField: "rate_outside" },
];

export default function PublicRent() {
  const slug = window.location.pathname.replace(/^\/rent\//, "").replace(/\/$/, "");
  const [state, setState] = useState({ loading: true });

  const [showForm, setShowForm] = useState(false);
  const [selectedSpaceIds, setSelectedSpaceIds] = useState([]);
  const [tier, setTier] = useState("member");
  const [formValues, setFormValues] = useState({
    requester_name: "", requester_email: "", requester_phone: "", requester_org: "",
    purpose: "", notes: "",
    requested_starts_at: "", requested_ends_at: "",
    agreed_to_rules: false,
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

      // Hash deep-link: /rent/river-of-life#CMP → auto-select that space and scroll to it.
      // Multiple codes with commas: #CMP,CR03 → both selected.
      const hash = window.location.hash.replace(/^#/, "").trim();
      if (hash && data.spaces) {
        const codes = hash.toUpperCase().split(",").map(c => c.trim()).filter(Boolean);
        const matched = (data.spaces || []).filter(s => codes.includes((s.code || "").toUpperCase()));
        if (matched.length) {
          setSelectedSpaceIds(matched.map(s => s.id));
          // Open the request form if the hash includes '=request' or ',request'
          if (codes.includes("REQUEST")) setShowForm(true);
          setTimeout(() => {
            const el = document.getElementById("space-picker");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 200);
        }
      }
    })();
  }, [slug]);

  const { loading, error, org, spaces = [], rentals = [] } = state;
  const accent = org ? (ACCENTS[org.accent] || ACCENTS.blue) : ACCENTS.blue;

  const toggleSpace = (id) => setSelectedSpaceIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Live invoice preview
  const invoice = useMemo(() => {
    if (!org || selectedSpaceIds.length === 0) return null;
    const tierRateField = TIERS.find(t => t.key === tier).rateField;
    const start = formValues.requested_starts_at ? new Date(formValues.requested_starts_at) : null;
    const end   = formValues.requested_ends_at   ? new Date(formValues.requested_ends_at)   : null;
    const durationHours = (start && end) ? Math.max(0, (end - start) / 3600000) : 4;
    const blocksOf4 = Math.max(1, Math.ceil(durationHours / 4));
    const lines = selectedSpaceIds.map(sid => {
      const s = spaces.find(x => x.id === sid);
      if (!s) return null;
      const rate = Number(s[tierRateField] || 0);
      const total = rate * blocksOf4;
      return { space: s.name, rate, unit: s.rate_unit || "4-hour block", blocks: blocksOf4, total };
    }).filter(Boolean);
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const tax = subtotal * ((Number(org.rental_tax_rate) || 0) / 100);
    const grand = subtotal + tax;
    return { lines, subtotal, tax, grand, blocksOf4, durationHours };
  }, [org, spaces, selectedSpaceIds, tier, formValues.requested_starts_at, formValues.requested_ends_at]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitErr("");
    if (selectedSpaceIds.length === 0) { setSubmitErr("Please pick at least one space."); return; }
    if (!formValues.requested_starts_at || !formValues.requested_ends_at) { setSubmitErr("Please pick a start and end date/time."); return; }
    if (!formValues.agreed_to_rules) { setSubmitErr("Please agree to the facility use rules to continue."); return; }
    setSubmitting(true);
    const { error: err } = await supabase.from("org_rental_requests").insert({
      org_id: org.id,
      requester_name: formValues.requester_name.trim(),
      requester_email: formValues.requester_email.trim(),
      requester_phone: formValues.requester_phone.trim() || null,
      requester_org: formValues.requester_org.trim() || null,
      is_member: tier === "member",
      requested_spaces: selectedSpaceIds,
      requested_starts_at: new Date(formValues.requested_starts_at).toISOString(),
      requested_ends_at:   new Date(formValues.requested_ends_at).toISOString(),
      purpose: (formValues.purpose || "") + (tier ? " [tier: " + TIERS.find(t=>t.key===tier).label + "]" : ""),
      notes: [
        formValues.notes || "",
        "─── Preview invoice (pending approval): ───",
        ...(invoice?.lines || []).map(l => `${l.space}: $${l.rate.toFixed(2)} × ${l.blocks} block(s) = $${l.total.toFixed(2)}`),
        invoice ? `Subtotal: $${invoice.subtotal.toFixed(2)}` : "",
        invoice ? `Tax (${org.rental_tax_rate}%): $${invoice.tax.toFixed(2)}` : "",
        invoice ? `Total: $${invoice.grand.toFixed(2)}` : "",
        "─── Renter agreed to facility use rules on " + new Date().toLocaleString("en-US") + " ───",
      ].filter(Boolean).join("\n"),
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

      <style>{MOBILE_RENT}</style>
      <div className="pr-page" style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px 40px" }}>

        <div className="pr-hero" style={{ marginBottom: 22 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: N.ink, marginBottom: 8, lineHeight: 1.15 }}>Rent space at {org.short_name || org.name}</h1>
          <p style={{ color: N.muted, fontSize: 15, maxWidth: 720, lineHeight: 1.55 }}>
            Pick a date, then rooms. Your invoice previews live. Agree to the rules and submit — someone from {org.short_name || org.name} will confirm and send payment info.
          </p>
        </div>

        <FacilitiesMap spaces={spaces} rentals={rentals} accent={accent} onSpaceClick={s => { if (s.rentable) toggleSpace(s.id); }} />

        {/* Tier picker */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: accent.color, fontWeight: 700, marginBottom: 10 }}>YOUR RATE TIER</div>
          <div className="pr-tier-row" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TIERS.map(t => (
              <button key={t.key} onClick={() => setTier(t.key)}
                style={{ padding: "10px 16px", background: tier === t.key ? accent.color : N.white, color: tier === t.key ? N.white : N.ink, border: tier === t.key ? "none" : `1.5px solid ${N.rule}`, borderRadius: 10, cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 13, fontWeight: tier === t.key ? 700 : 500, boxShadow: tier === t.key ? `0 4px 14px ${accent.color}66` : "none" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Room list with tier-specific rates */}
        <div id="space-picker" style={{ marginTop: 20 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 12 }}>Available Spaces</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {spaces.filter(s => s.rentable).map(s => {
              const selected = selectedSpaceIds.includes(s.id);
              const rate = s[TIERS.find(t=>t.key===tier).rateField];
              return (
                <button key={s.id} onClick={() => toggleSpace(s.id)}
                  style={{ padding: "14px 16px", background: selected ? `rgba(${accent.rgb},0.1)` : N.white, border: `2px solid ${selected ? accent.color : N.rule}`, borderRadius: 10, cursor: "pointer", fontFamily: "'Figtree', sans-serif", textAlign: "left", position: "relative", boxShadow: selected ? `0 0 20px ${accent.color}44` : "none" }}>
                  {selected && <div style={{ position: "absolute", top: 8, right: 10, color: accent.color, fontWeight: 700 }}>✓</div>}
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: N.ink }}>{s.name}</div>
                  {s.category && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: N.muted, textTransform: "uppercase", marginTop: 2 }}>{s.category}{s.capacity ? ` · ${s.capacity} cap` : ""}</div>}
                  {rate ? (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 15, color: N.ink, fontWeight: 700 }}>{money(rate)}</div>
                      <div style={{ fontSize: 10, color: N.muted, fontFamily: "'DM Mono', monospace" }}>{s.rate_unit || "per block"}</div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 6, fontSize: 11, color: N.muted, fontStyle: "italic" }}>Rate on request</div>
                  )}
                  {s.rate_notes && <div style={{ marginTop: 4, fontSize: 10, color: N.muted, fontStyle: "italic" }}>{s.rate_notes}</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live invoice preview */}
        {selectedSpaceIds.length > 0 && (
          <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "20px 24px", marginTop: 22 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: accent.color, fontWeight: 700, marginBottom: 12 }}>PREVIEW INVOICE · {TIERS.find(t=>t.key===tier).label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {invoice.lines.map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: N.ink }}>
                  <div>{l.space} · ${l.rate.toFixed(2)} × {l.blocks} block(s)</div>
                  <div style={{ fontFamily: "'DM Mono', monospace" }}>${l.total.toFixed(2)}</div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: N.muted, borderTop: `1px solid ${N.rule}`, paddingTop: 6, marginTop: 4 }}>
                <div>Subtotal</div><div style={{ fontFamily: "'DM Mono', monospace" }}>${invoice.subtotal.toFixed(2)}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: N.muted }}>
                <div>Tax ({org.rental_tax_rate}%)</div><div style={{ fontFamily: "'DM Mono', monospace" }}>${invoice.tax.toFixed(2)}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, color: N.ink, fontWeight: 700, marginTop: 4 }}>
                <div>TOTAL</div><div style={{ fontFamily: "'DM Mono', monospace" }}>${invoice.grand.toFixed(2)}</div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: N.muted, fontStyle: "italic" }}>
              Duration based on your dates. Assumes 4-hour blocks. Final invoice confirmed on approval. Additional Tech/AV fees may apply for Sanctuary sound/lighting/video.
            </div>
          </NeonBox>
        )}

        {/* Request form */}
        <div style={{ marginTop: 24 }}>
          {!showForm && !submitted && (
            <button onClick={() => setShowForm(true)}
              style={{ padding: "14px 32px", background: accent.color, color: N.white, border: "none", borderRadius: 10, fontFamily: "'DM Mono', monospace", fontSize: 13, letterSpacing: "0.12em", fontWeight: 700, textTransform: "uppercase", cursor: "pointer", boxShadow: `0 4px 18px ${accent.color}66` }}>
              Request {selectedSpaceIds.length > 0 ? `${selectedSpaceIds.length} space${selectedSpaceIds.length === 1 ? "" : "s"}` : "a space"} →
            </button>
          )}

          {showForm && !submitted && (
            <NeonBox color={accent.color} rgb={accent.rgb} style={{ padding: "24px 26px" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 6 }}>Send us your request</h3>
              <p style={{ color: N.muted, fontSize: 13, marginBottom: 18 }}>Someone from {org.name} will follow up to confirm and send payment info.</p>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <FormField label="Your name *"><input required value={formValues.requester_name} onChange={e => setFormValues({ ...formValues, requester_name: e.target.value })} style={fieldSty} /></FormField>
                  <FormField label="Email *"><input required type="email" value={formValues.requester_email} onChange={e => setFormValues({ ...formValues, requester_email: e.target.value })} style={fieldSty} /></FormField>
                  <FormField label="Phone"><input value={formValues.requester_phone} onChange={e => setFormValues({ ...formValues, requester_phone: e.target.value })} style={fieldSty} /></FormField>
                  <FormField label="Organization (optional)"><input value={formValues.requester_org} onChange={e => setFormValues({ ...formValues, requester_org: e.target.value })} style={fieldSty} /></FormField>
                  <FormField label="Start date + time *"><input required type="datetime-local" value={formValues.requested_starts_at} onChange={e => setFormValues({ ...formValues, requested_starts_at: e.target.value })} style={fieldSty} /></FormField>
                  <FormField label="End date + time *"><input required type="datetime-local" value={formValues.requested_ends_at} onChange={e => setFormValues({ ...formValues, requested_ends_at: e.target.value })} style={fieldSty} /></FormField>
                </div>
                <FormField label="What's the event / purpose?"><input value={formValues.purpose} onChange={e => setFormValues({ ...formValues, purpose: e.target.value })} style={fieldSty} placeholder="Wedding reception, weekly homeschool co-op, birthday party..." /></FormField>
                <FormField label="Anything else we should know?"><textarea rows={3} value={formValues.notes} onChange={e => setFormValues({ ...formValues, notes: e.target.value })} style={{ ...fieldSty, resize: "vertical", lineHeight: 1.5 }} placeholder="Setup needs, expected attendance..." /></FormField>

                {/* RULES */}
                {org.rental_rules && (
                  <div style={{ marginTop: 6, padding: "14px 16px", background: `rgba(${accent.rgb},0.06)`, borderRadius: 8, border: `1.5px solid ${accent.color}` }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: accent.color, fontWeight: 700, marginBottom: 8 }}>FACILITY USE RULES · READ + AGREE</div>
                    <div style={{ maxHeight: 240, overflowY: "auto", padding: "8px 10px", background: N.white, borderRadius: 6, whiteSpace: "pre-wrap", fontSize: 13, color: N.ink, lineHeight: 1.6, border: `1px solid ${N.rule}` }}>{org.rental_rules}</div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, color: N.ink, cursor: "pointer" }}>
                      <input type="checkbox" checked={formValues.agreed_to_rules} onChange={e => setFormValues({ ...formValues, agreed_to_rules: e.target.checked })} />
                      <strong>I've read and agree to the facility use rules above.</strong>
                    </label>
                  </div>
                )}

                {submitErr && <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.08)", border: `1px solid ${N.red}`, borderLeft: `4px solid ${N.red}`, borderRadius: 6, color: N.red, fontSize: 12, fontWeight: 600 }}>{submitErr}</div>}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
                  <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 18px", background: "transparent", border: `1.5px solid ${N.rule}`, borderRadius: 8, color: N.muted, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.1em", fontWeight: 700, cursor: "pointer" }}>CANCEL</button>
                  <button type="submit" disabled={submitting} style={{ padding: "10px 22px", background: accent.color, color: N.white, border: "none", borderRadius: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.1em", fontWeight: 700, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1, boxShadow: `0 4px 14px ${accent.color}66` }}>{submitting ? "SENDING…" : "SEND REQUEST →"}</button>
                </div>
              </form>
            </NeonBox>
          )}

          {submitted && (
            <NeonBox color={N.green} rgb="34,197,94" style={{ padding: "26px 30px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 8 }}>Request received</div>
              <p style={{ color: N.muted, fontSize: 14, marginBottom: 18 }}>Someone from {org.name} will follow up with you at <strong style={{ color: N.ink }}>{formValues.requester_email}</strong> to confirm.</p>
              {org.rental_payment_url && (
                <div style={{ padding: "12px 16px", background: N.white, border: `1.5px solid ${N.green}`, borderRadius: 8, textAlign: "left" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: N.green, fontWeight: 700, marginBottom: 6 }}>WHEN APPROVED — PAY HERE</div>
                  <a href={org.rental_payment_url} target="_blank" rel="noopener noreferrer" style={{ color: N.blue, fontWeight: 700, wordBreak: "break-all", fontSize: 13 }}>{org.rental_payment_url}</a>
                  {org.rental_payment_note && <div style={{ marginTop: 6, fontSize: 12, color: N.muted, fontStyle: "italic" }}>{org.rental_payment_note}</div>}
                </div>
              )}
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
