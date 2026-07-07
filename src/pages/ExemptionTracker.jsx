import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";

const S = {
  slate: "#3d4560", orange: "#e8773a", orangeDark: "#c95f22", orangeLight: "#fdf0e8",
  paper: "#faf8f4", cream: "#f2ede3", ink: "#1e1e2a", rule: "#ddd8cc",
  muted: "#7a7585", gold: "#C9A84C", green: "#5a9a5a", red: "#c95050",
  grad: "linear-gradient(135deg, #e8773a, #c95f22)",
};

const MOBILE = `
  @media (max-width: 640px) {
    .ex-header { padding: 0 16px !important; }
    .ex-page { padding: 32px 16px 60px !important; }
    .ex-h1 { font-size: 26px !important; }
    .ex-form-grid { grid-template-columns: 1fr !important; }
  }
`;

const fieldStyle = {
  width: "100%", padding: "10px 13px", fontSize: 14, fontFamily: "'Figtree', sans-serif",
  background: "#fff", border: "1px solid " + S.rule, borderRadius: 8, outline: "none",
  color: S.ink, boxSizing: "border-box",
};
const labelStyle = { fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: S.muted, marginBottom: 5, display: "block" };

const BLANK_CUSTOMER = {
  business_name: "", contact_name: "", email: "", phone: "",
  billing_address: "", shipping_address: "",
  mn_tax_id: "", fein: "",
  business_type: "", exemption_reason: "",
  notes: "",
};

export default function ExemptionTracker({ session }) {
  const email = session?.user?.email;
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK_CUSTOMER);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase
      .from("exempt_customers")
      .select("*")
      .order("business_name", { ascending: true });
    setCustomers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const addCustomer = async () => {
    if (!form.business_name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("exempt_customers").insert({
      owner_email: email,
      business_name: form.business_name.trim(),
      contact_name: form.contact_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      billing_address: form.billing_address.trim() || null,
      shipping_address: form.shipping_address.trim() || null,
      mn_tax_id: form.mn_tax_id.trim() || null,
      fein: form.fein.trim() || null,
      business_type: form.business_type.trim() || null,
      exemption_reason: form.exemption_reason.trim() || null,
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (!error) {
      setForm(BLANK_CUSTOMER);
      setShowAdd(false);
      fetchCustomers();
    } else {
      alert("Could not save customer — " + error.message);
    }
  };

  const toggleActive = async (c) => {
    await supabase.from("exempt_customers").update({ active: !c.active }).eq("id", c.id);
    fetchCustomers();
  };

  const shown = customers.filter(c => showInactive || c.active);

  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', sans-serif", color: S.ink }}>
      <style>{MOBILE}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header className="ex-header" style={{ background: S.slate, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, boxShadow: "0 2px 12px rgba(0,0,0,0.15)", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/cares-works-logo.png" alt="CARES Works" style={{ height: 32, width: "auto", display: "block" }} />
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff" }}>CARES <span style={{ color: S.orange }}>Works.</span></span>
        </a>
        <a onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} href="/dashboard" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textDecoration: "none" }}>{"<- Dashboard"}</a>
      </header>

      <div className="ex-page" style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 10 }}>Member Tool · Money</div>
          <h1 className="ex-h1" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: S.slate, marginBottom: 12, lineHeight: 1.15 }}>Exemption Certificate Tracker</h1>
          <p style={{ fontSize: 15, color: S.muted, lineHeight: 1.65, maxWidth: 640 }}>
            Minnesota Form ST3 exemption certificates. The state does not require them to expire, but the Department of Revenue asks you to refresh them every 3 years. Miss that and the audit finds it before you do. Add your exempt customers here, request their certificates, store the file, and the tool reminds you when it's time to ask for a fresh one.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: S.slate, margin: 0 }}>Your Exempt Customers</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: S.muted, cursor: "pointer" }}>
              <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
              Show archived
            </label>
            <button onClick={() => setShowAdd(v => !v)}
              style={{ padding: "9px 18px", background: showAdd ? "transparent" : S.grad, border: showAdd ? "1px solid " + S.rule : "none", color: showAdd ? S.muted : "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
              {showAdd ? "Cancel" : "+ Add customer"}
            </button>
          </div>
        </div>

        {showAdd && (
          <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "24px 26px", marginBottom: 24 }}>
            <div className="ex-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Business name *</label>
                <input style={fieldStyle} value={form.business_name} onChange={set("business_name")} autoFocus placeholder="ABC Printing" />
              </div>
              <div>
                <label style={labelStyle}>Contact name</label>
                <input style={fieldStyle} value={form.contact_name} onChange={set("contact_name")} placeholder="Jane Doe" />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={fieldStyle} type="email" value={form.email} onChange={set("email")} placeholder="jane@abc.com" />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={fieldStyle} value={form.phone} onChange={set("phone")} placeholder="(612) 555-0100" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Billing address</label>
                <input style={fieldStyle} value={form.billing_address} onChange={set("billing_address")} placeholder="Street, City, State ZIP" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Shipping address (if different)</label>
                <input style={fieldStyle} value={form.shipping_address} onChange={set("shipping_address")} placeholder="Same as billing if blank" />
              </div>
              <div>
                <label style={labelStyle}>MN Tax ID</label>
                <input style={fieldStyle} value={form.mn_tax_id} onChange={set("mn_tax_id")} placeholder="7 digits" />
              </div>
              <div>
                <label style={labelStyle}>FEIN</label>
                <input style={fieldStyle} value={form.fein} onChange={set("fein")} placeholder="XX-XXXXXXX" />
              </div>
              <div>
                <label style={labelStyle}>Business type</label>
                <input style={fieldStyle} value={form.business_type} onChange={set("business_type")} placeholder="Nonprofit / Reseller / etc." />
              </div>
              <div>
                <label style={labelStyle}>Exemption reason</label>
                <input style={fieldStyle} value={form.exemption_reason} onChange={set("exemption_reason")} placeholder="e.g. Resale, 501(c)(3), Federal government" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Notes</label>
                <textarea rows={2} style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.5 }} value={form.notes} onChange={set("notes")} placeholder="Anything you want to remember about this customer's setup." />
              </div>
            </div>
            <button onClick={addCustomer} disabled={saving || !form.business_name.trim()}
              style={{ padding: "10px 22px", background: S.grad, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", opacity: saving || !form.business_name.trim() ? 0.5 : 1 }}>
              {saving ? "Saving…" : "Save customer"}
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ color: S.muted, fontSize: 13, fontFamily: "'DM Mono', monospace", padding: "24px 4px" }}>Loading…</div>
        ) : shown.length === 0 ? (
          <div style={{ background: S.cream, border: "1px dashed " + S.rule, borderRadius: 12, padding: "48px 24px", textAlign: "center", color: S.muted }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>🗂️</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: S.slate, marginBottom: 6 }}>No customers yet.</div>
            <p style={{ fontSize: 14 }}>Add your first exempt customer to start tracking their ST3.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shown.map(c => (
              <div key={c.id} style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: "18px 22px", opacity: c.active ? 1 : 0.55 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: S.slate }}>{c.business_name}</div>
                    <div style={{ fontSize: 13, color: S.muted, marginTop: 2, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {c.contact_name && <span>{c.contact_name}</span>}
                      {c.email && <span>· {c.email}</span>}
                      {c.phone && <span>· {c.phone}</span>}
                    </div>
                    {(c.exemption_reason || c.business_type) && (
                      <div style={{ fontSize: 12, color: S.muted, marginTop: 6, fontStyle: "italic" }}>
                        {[c.business_type, c.exemption_reason].filter(Boolean).join(" — ")}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", background: S.cream, color: S.muted, padding: "4px 10px", borderRadius: 100 }}>
                      NO CERTIFICATE YET
                    </div>
                    <button onClick={() => toggleActive(c)}
                      style={{ background: "transparent", border: "1px solid " + S.rule, color: S.muted, fontSize: 11, padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
                      {c.active ? "Archive" : "Unarchive"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 40, padding: "18px 22px", background: S.cream, border: "1px dashed " + S.rule, borderRadius: 10, fontSize: 13, color: S.muted, lineHeight: 1.6 }}>
          <strong style={{ color: S.slate }}>Coming in the next phase:</strong> secure request links, customer upload page, approval flow, renewal reminders. This first pass just lets you get all your exempt customers into the system so the request round is fast when it's ready.
        </div>

      </div>
    </div>
  );
}
