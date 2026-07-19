import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";

const S = {
  slate: "#0a0a14", orange: "#0080ff", orangeDark: "#0052cc", orangeLight: "#e6f0ff",
  paper: "#ffffff", cream: "#f7f9fc", ink: "#0a0a14", rule: "#e2e8f0",
  muted: "#64748b", gold: "#ff8a2a", green: "#5a9a5a", red: "#c95050",
  grad: "linear-gradient(135deg, #0080ff, #0052cc)",
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
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [generating, setGenerating] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState(null); // null | array
  const [copied, setCopied] = useState(null); // token being copied

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

  const toggleSelected = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    const visibleIds = shown.map(c => c.id);
    const allSelected = visibleIds.every(id => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(visibleIds));
  };

  // Generate a secure request link for each selected customer.
  // Inserts an exempt_requests row + a placeholder exempt_certificates row per customer.
  const generateRequestLinks = async () => {
    if (selectedIds.size === 0) return;
    setGenerating(true);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const results = [];
    for (const id of Array.from(selectedIds)) {
      const cust = customers.find(c => c.id === id);
      if (!cust) continue;
      const token = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2) + String(Date.now());
      // Create placeholder certificate first so the request can link to it
      const { data: cert } = await supabase.from("exempt_certificates").insert({
        owner_email: email, customer_id: id, certificate_type: "MN ST3", status: "requested",
      }).select().single();
      const { error: reqErr } = await supabase.from("exempt_requests").insert({
        owner_email: email,
        customer_id: id,
        certificate_id: cert ? cert.id : null,
        secure_token: token,
        token_expires_at: expiresAt,
        request_sent_at: new Date().toISOString(),
        status: "pending",
      });
      if (!reqErr) {
        results.push({
          customer: cust,
          token,
          url: window.location.origin + "/exempt/" + token,
        });
      }
    }
    setGenerating(false);
    setGeneratedLinks(results);
    setSelectedIds(new Set());
    fetchCustomers();
  };

  const copyText = (text, tag) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(tag);
        setTimeout(() => setCopied(null), 1800);
      });
    }
  };

  const copyAllLinks = () => {
    if (!generatedLinks) return;
    const text = generatedLinks.map(r => (r.customer.email || "").padEnd(32) + " " + r.url).join("\n");
    copyText(text, "all-plain");
  };

  const copyAsCSV = () => {
    if (!generatedLinks) return;
    const header = "Business Name,Contact,Email,Link\n";
    const rows = generatedLinks.map(r => {
      const esc = (s) => '"' + String(s == null ? "" : s).replace(/"/g, '""') + '"';
      return [esc(r.customer.business_name), esc(r.customer.contact_name), esc(r.customer.email), esc(r.url)].join(",");
    }).join("\n");
    copyText(header + rows, "all-csv");
  };

  const anySelected = selectedIds.size > 0;
  const allVisibleSelected = shown.length > 0 && shown.every(c => selectedIds.has(c.id));

  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', sans-serif", color: S.ink }}>
      <style>{MOBILE}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header className="ex-header" style={{ background: S.slate, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, boxShadow: "0 2px 12px rgba(0,0,0,0.15)", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/cares-works-neon-logo.png" alt="CARES Works" style={{ height: 32, width: "auto", display: "block" }} />
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff" }}>CARES <span style={{ color: S.orange }}>Works.</span></span>
        </a>
        <a onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} href="/dashboard" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textDecoration: "none" }}>{"<- Dashboard"}</a>
      </header>

      <div className="ex-page" style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 10 }}>Member Tool · Money</div>
          <h1 className="ex-h1" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: S.slate, marginBottom: 12, lineHeight: 1.15 }}>Exemption Certificate Tracker</h1>
          <p style={{ fontSize: 15, color: S.muted, lineHeight: 1.65, maxWidth: 640, marginBottom: 18 }}>
            Minnesota Form ST3 exemption certificates. The state does not require them to expire, but the Department of Revenue asks you to refresh them every 3 years. Miss that and the audit finds it before you do. Add your exempt customers here, request their certificates, store the file, and the tool reminds you when it's time to ask for a fresh one.
          </p>
          <a href="/mn-form-st3.pdf" target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 18px", background: "#fff", border: "1.5px solid " + S.orange, color: S.orange, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif", textDecoration: "none" }}>
            📄 Download blank MN Form ST3
          </a>
          <span style={{ fontSize: 12, color: S.muted, marginLeft: 12, fontStyle: "italic" }}>
            The current 2026 version, straight from MN Dept of Revenue.
          </span>
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
          <>
            {/* BULK ACTION BAR */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 16px", background: anySelected ? S.orangeLight : "#fff", border: "1px solid " + (anySelected ? S.orange : S.rule), borderRadius: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: S.slate, fontWeight: 600 }}>
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} style={{ width: 16, height: 16, cursor: "pointer" }} />
                {anySelected ? selectedIds.size + " selected" : "Select all"}
              </label>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                {anySelected && (
                  <button onClick={() => setSelectedIds(new Set())}
                    style={{ background: "transparent", border: "1px solid " + S.rule, color: S.muted, fontSize: 12, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
                    Clear
                  </button>
                )}
                <button onClick={generateRequestLinks} disabled={!anySelected || generating}
                  style={{ padding: "8px 18px", background: !anySelected || generating ? S.rule : S.grad, border: "none", borderRadius: 8, color: !anySelected || generating ? S.muted : "#fff", fontSize: 13, fontWeight: 700, cursor: !anySelected || generating ? "default" : "pointer", fontFamily: "'Figtree', sans-serif" }}>
                  {generating ? "Generating…" : "Generate request links → " + (anySelected ? "for " + selectedIds.size : "")}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {shown.map(c => {
                const isSelected = selectedIds.has(c.id);
                return (
                  <div key={c.id} style={{ background: isSelected ? S.orangeLight : "#fff", border: "1px solid " + (isSelected ? S.orange : S.rule), borderRadius: 12, padding: "18px 22px", opacity: c.active ? 1 : 0.55, transition: "background 0.12s, border-color 0.12s" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelected(c.id)}
                        style={{ width: 16, height: 16, cursor: "pointer", marginTop: 4, flexShrink: 0 }} />
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
                );
              })}
            </div>
          </>
        )}

        <div style={{ marginTop: 40, padding: "18px 22px", background: S.cream, border: "1px dashed " + S.rule, borderRadius: 10, fontSize: 13, color: S.muted, lineHeight: 1.6 }}>
          <strong style={{ color: S.slate }}>Coming in the next phase:</strong> the actual customer upload page (they'll click the link, download the ST3, fill it out, upload it back). Admin approve/reject, renewal reminders, and automated email sends come after that. Everything before that is live — you can add customers, generate links, and send them by email tonight.
        </div>

      </div>

      {/* MODAL: Generated request links */}
      {generatedLinks && (
        <div onClick={() => setGeneratedLinks(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(30,30,42,0.62)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: S.paper, maxWidth: 780, width: "100%", borderRadius: 14, padding: "28px 32px", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <button onClick={() => setGeneratedLinks(null)}
              style={{ position: "absolute", top: 12, right: 14, background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: S.muted }}>×</button>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: S.orange, marginBottom: 6 }}>REQUEST LINKS GENERATED</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: S.slate, marginBottom: 8, lineHeight: 1.2 }}>{generatedLinks.length} link{generatedLinks.length === 1 ? "" : "s"} ready to send.</h2>
            <p style={{ fontSize: 14, color: S.muted, marginBottom: 20, lineHeight: 1.55 }}>
              Each link is unique to that customer and expires in 30 days. Copy them individually, all at once, or as CSV for mail merge.
            </p>
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
              <button onClick={copyAllLinks}
                style={{ padding: "9px 16px", background: S.slate, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
                {copied === "all-plain" ? "✓ Copied" : "📋 Copy all (email + link)"}
              </button>
              <button onClick={copyAsCSV}
                style={{ padding: "9px 16px", background: "#fff", border: "1.5px solid " + S.slate, borderRadius: 8, color: S.slate, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
                {copied === "all-csv" ? "✓ Copied" : "📊 Copy as CSV (for mail merge)"}
              </button>
            </div>
            <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 10, overflow: "hidden" }}>
              {generatedLinks.map((r, i) => (
                <div key={r.token} style={{ padding: "14px 18px", borderBottom: i < generatedLinks.length - 1 ? "1px solid " + S.rule : "none", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: S.slate }}>{r.customer.business_name}</div>
                    <div style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>
                      {r.customer.email || <em>(no email on file)</em>}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.orange, marginTop: 4, wordBreak: "break-all" }}>{r.url}</div>
                  </div>
                  <button onClick={() => copyText(r.url, r.token)}
                    style={{ padding: "7px 14px", background: copied === r.token ? "#5a9a5a" : S.grad, border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em", flexShrink: 0 }}>
                    {copied === r.token ? "✓ COPIED" : "COPY LINK"}
                  </button>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: "14px 18px", background: S.cream, border: "1px dashed " + S.rule, borderRadius: 8, fontSize: 12, color: S.muted, lineHeight: 1.55 }}>
              <strong style={{ color: S.slate }}>Sample email you can paste:</strong> <em>Hi [Contact], we're updating our sales tax exemption records and need a fresh MN Form ST3 from your business. Use this secure link to submit: [PASTE LINK]. Thanks — [You]</em>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
