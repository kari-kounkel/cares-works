// Proposal detail — PDF viewer + editable metadata + invoices + payments tabs.
// Route: /proposals/:slug (owner-only)

import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { navigate } from "../App";
import { N, N_RGB, FONT_LINK, NeonBox, SignatureFooter, WASH_BG_LITE } from "../design/neon";

const STATUS_OPTIONS = ["draft", "sent", "accepted", "paused", "lost"];

function money(cents) {
  if (cents == null) return "—";
  return "$" + (Math.round(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function todayISO() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

export default function ProposalView({ slug, session }) {
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("proposal"); // proposal | invoices | payments
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data, error: e } = await supabase.from("proposals").select("*").eq("slug", slug).maybeSingle();
      if (e || !data) { setError("Not found or no access."); setLoading(false); return; }
      setP(data);
      // Load invoices + payments in parallel
      const [inv, pay] = await Promise.all([
        supabase.from("client_invoices").select("*").eq("client_slug", slug).order("sent_on", { ascending: false, nullsFirst: false }),
        supabase.from("client_payments").select("*").eq("client_slug", slug).order("received_on", { ascending: false }),
      ]);
      setInvoices(inv.data || []);
      setPayments(pay.data || []);
      // Signed URL for the PDF if uploaded
      if (data.pdf_storage_path) {
        const { data: signed } = await supabase.storage.from("proposals-pdfs").createSignedUrl(data.pdf_storage_path, 3600);
        setPdfUrl(signed?.signedUrl || null);
      }
      setLoading(false);
    })();
  }, [slug, session]);

  async function updateField(field, value) {
    const patch = { [field]: value };
    setP(prev => ({ ...prev, ...patch }));
    const { error } = await supabase.from("proposals").update(patch).eq("id", p.id);
    if (error) alert(error.message);
  }

  async function updateValue(dollars) {
    const cents = dollars === "" ? null : Math.round(Number(dollars) * 100);
    await updateField("value_cents", cents);
  }

  async function uploadPdf(file) {
    if (!file) return;
    setSaving(true);
    const path = "u/" + session.user.email + "/" + slug + "-" + Date.now() + ".pdf";
    const { error: upErr } = await supabase.storage.from("proposals-pdfs").upload(path, file, { contentType: "application/pdf", upsert: false });
    if (upErr) { setSaving(false); alert("Upload failed: " + upErr.message); return; }
    // Delete the old file if there was one
    if (p.pdf_storage_path) {
      await supabase.storage.from("proposals-pdfs").remove([p.pdf_storage_path]);
    }
    await updateField("pdf_storage_path", path);
    const { data: signed } = await supabase.storage.from("proposals-pdfs").createSignedUrl(path, 3600);
    setPdfUrl(signed?.signedUrl || null);
    setSaving(false);
  }

  async function copyPublicLink() {
    if (!p?.public_token) return;
    const url = window.location.origin + "/p/" + p.public_token;
    try { await navigator.clipboard.writeText(url); setCopyStatus("Copied!"); setTimeout(() => setCopyStatus(""), 2000); }
    catch { alert(url); }
  }

  async function addInvoice() {
    const { data } = await supabase.from("client_invoices").insert({
      owner_email: session.user.email, client_slug: slug,
      description: "New invoice", amount_cents: 0, sent_on: todayISO(), status: "sent",
    }).select().single();
    if (data) setInvoices(prev => [data, ...prev]);
  }
  async function updateInvoice(id, patch) {
    setInvoices(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
    await supabase.from("client_invoices").update(patch).eq("id", id);
  }
  async function deleteInvoice(id) {
    if (!confirm("Delete this invoice?")) return;
    await supabase.from("client_invoices").delete().eq("id", id);
    setInvoices(prev => prev.filter(x => x.id !== id));
  }

  async function addPayment() {
    const { data } = await supabase.from("client_payments").insert({
      owner_email: session.user.email, client_slug: slug,
      payment_type: "check", amount_cents: 0, received_on: todayISO(),
    }).select().single();
    if (data) setPayments(prev => [data, ...prev]);
  }
  async function updatePayment(id, patch) {
    setPayments(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
    await supabase.from("client_payments").update(patch).eq("id", id);
  }
  async function deletePayment(id) {
    if (!confirm("Delete this payment?")) return;
    await supabase.from("client_payments").delete().eq("id", id);
    setPayments(prev => prev.filter(x => x.id !== id));
  }

  if (loading) {
    return <div style={{ minHeight: "100vh", background: WASH_BG_LITE, display: "flex", alignItems: "center", justifyContent: "center", color: N.muted, fontFamily: "'Figtree', sans-serif" }}>Loading…</div>;
  }
  if (error || !p) {
    return (
      <div style={{ minHeight: "100vh", background: WASH_BG_LITE, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Figtree', sans-serif" }}>
        <link href={FONT_LINK} rel="stylesheet" />
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: N.ink, marginBottom: 12 }}>{error || "Proposal not found"}</h1>
          <a href="/proposals" style={{ padding: "10px 20px", background: N.blue, color: N.white, borderRadius: 8, textDecoration: "none", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em", fontWeight: 700 }}>← All proposals</a>
        </div>
      </div>
    );
  }

  const totalInvoiced = invoices.reduce((s, i) => s + (i.amount_cents || 0), 0);
  const totalPaid = payments.reduce((s, i) => s + (i.amount_cents || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: WASH_BG_LITE, fontFamily: "'Figtree', sans-serif", color: N.ink }}>
      <link href={FONT_LINK} rel="stylesheet" />

      <header style={{ background: N.white, borderBottom: `1px solid ${N.rule}`, padding: "14px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <a href="/proposals" style={{ color: N.muted, textDecoration: "none", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em" }}>← PROPOSALS</a>
              <span style={{ color: N.rule }}>·</span>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.blue, fontWeight: 700 }}>/proposals/{p.slug}</div>
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: N.ink, margin: "6px 0 0" }}>{p.client_name}</h1>
            {p.title && <div style={{ color: N.muted, fontSize: 14, marginTop: 2 }}>{p.title}</div>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {p.pdf_storage_path && (
              <button onClick={copyPublicLink}
                style={{ padding: "8px 14px", background: N.white, border: `1.5px solid ${N.blue}`, color: N.blue, borderRadius: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", fontWeight: 700, cursor: "pointer" }}>
                {copyStatus || "🔗 CLIENT LINK"}
              </button>
            )}
            <select value={p.status} onChange={e => updateField("status", e.target.value)}
              style={{ padding: "8px 12px", border: `1.5px solid ${N.rule}`, borderRadius: 8, fontSize: 12, fontFamily: "'DM Mono', monospace", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: N.white, cursor: "pointer" }}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 1100, margin: "14px auto 0", display: "flex", gap: 4 }}>
          {[
            { key: "proposal", label: "PROPOSAL" },
            { key: "invoices", label: `INVOICES · ${invoices.length}` },
            { key: "payments", label: `CHECKS & PAYMENTS · ${payments.length}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: "8px 14px", background: tab === t.key ? N.blue : "transparent", color: tab === t.key ? N.white : N.muted, border: "none", borderRadius: "8px 8px 0 0", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", fontWeight: 700, cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>

        {tab === "proposal" && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 20 }}>
            {/* PDF viewer */}
            <NeonBox color={N.blue} rgb={N_RGB.blue} style={{ padding: 0, overflow: "hidden" }}>
              {pdfUrl ? (
                <iframe src={pdfUrl} title="Proposal PDF" style={{ width: "100%", height: 800, border: "none", display: "block" }} />
              ) : (
                <div style={{ padding: 40, textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: N.ink, marginBottom: 8 }}>No PDF uploaded yet.</div>
                  <p style={{ color: N.muted, fontSize: 14, marginBottom: 18 }}>Upload the signed / final proposal PDF and it renders inline here.</p>
                  <input ref={fileRef} type="file" accept="application/pdf" onChange={e => uploadPdf(e.target.files?.[0])} style={{ display: "none" }} />
                  <button onClick={() => fileRef.current?.click()} disabled={saving}
                    style={{ padding: "10px 20px", background: N.blue, color: N.white, border: "none", borderRadius: 8, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em", fontWeight: 700, cursor: "pointer", boxShadow: `0 3px 12px rgba(${N_RGB.blue},0.35)` }}>
                    {saving ? "UPLOADING…" : "📤 UPLOAD PDF"}
                  </button>
                </div>
              )}
            </NeonBox>

            {/* Sidebar: metadata */}
            <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <NeonBox color={N.blue} rgb={N_RGB.blue} style={{ padding: "18px 20px" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.blue, fontWeight: 700, marginBottom: 12 }}>THE MONEY</div>
                <Field label="Contract value ($)"><input type="number" step="0.01" value={p.value_cents != null ? (p.value_cents / 100) : ""} onChange={e => updateValue(e.target.value)} style={input()} /></Field>
                <Field label="Payment schedule"><textarea rows={2} value={p.payment_schedule || ""} onChange={e => updateField("payment_schedule", e.target.value)} style={{ ...input(), resize: "vertical" }} /></Field>
                <div style={{ padding: "10px 12px", background: "rgba(0,128,255,0.05)", borderRadius: 8, marginTop: 10 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: N.muted, letterSpacing: "0.1em" }}>INVOICED / PAID</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: N.ink, marginTop: 2 }}>{money(totalInvoiced)} / {money(totalPaid)}</div>
                </div>
              </NeonBox>

              <NeonBox color={N.blue} rgb={N_RGB.blue} style={{ padding: "18px 20px" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.blue, fontWeight: 700, marginBottom: 12 }}>THE CLIENT</div>
                <Field label="Client name"><input value={p.client_name} onChange={e => updateField("client_name", e.target.value)} style={input()} /></Field>
                <Field label="Contact"><input value={p.client_contact || ""} onChange={e => updateField("client_contact", e.target.value)} placeholder="Dave & Betty Erickson" style={input()} /></Field>
                <Field label="Title"><input value={p.title || ""} onChange={e => updateField("title", e.target.value)} style={input()} /></Field>
              </NeonBox>

              <NeonBox color={N.blue} rgb={N_RGB.blue} style={{ padding: "18px 20px" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.blue, fontWeight: 700, marginBottom: 12 }}>DATES</div>
                <Field label="Sent on"><input type="date" value={p.sent_on || ""} onChange={e => updateField("sent_on", e.target.value || null)} style={input()} /></Field>
                <Field label="Accepted on"><input type="date" value={p.accepted_on || ""} onChange={e => updateField("accepted_on", e.target.value || null)} style={input()} /></Field>
              </NeonBox>

              <NeonBox color={N.blue} rgb={N_RGB.blue} style={{ padding: "18px 20px" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.blue, fontWeight: 700, marginBottom: 12 }}>NOTES</div>
                <textarea rows={4} value={p.notes || ""} onChange={e => updateField("notes", e.target.value)} style={{ ...input(), resize: "vertical" }} />
              </NeonBox>

              {p.pdf_storage_path && (
                <button onClick={() => fileRef.current?.click()} disabled={saving}
                  style={{ padding: "9px 14px", background: N.white, border: `1px solid ${N.rule}`, borderRadius: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", fontWeight: 700, color: N.muted, cursor: "pointer" }}>
                  {saving ? "UPLOADING…" : "↻ REPLACE PDF"}
                </button>
              )}
              <input ref={fileRef} type="file" accept="application/pdf" onChange={e => uploadPdf(e.target.files?.[0])} style={{ display: "none" }} />
            </aside>
          </div>
        )}

        {tab === "invoices" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.blue, fontWeight: 700 }}>THIS YEAR · TOTAL {money(totalInvoiced)}</div>
                <p style={{ color: N.muted, fontSize: 13, marginTop: 4 }}>Every invoice you've sent to this client. Click a row to edit inline.</p>
              </div>
              <button onClick={addInvoice}
                style={{ padding: "8px 14px", background: N.blue, color: N.white, border: "none", borderRadius: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", fontWeight: 700, cursor: "pointer" }}>+ ADD INVOICE</button>
            </div>
            {invoices.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", background: N.white, border: `1px dashed ${N.rule}`, borderRadius: 8, color: N.muted, fontSize: 14 }}>No invoices yet.</div>
            ) : (
              <div style={{ background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "110px 1.5fr 100px 110px 110px 110px 40px", padding: "10px 14px", background: "#f8fafc", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, fontWeight: 700, borderBottom: `1px solid ${N.rule}` }}>
                  <div>INVOICE #</div><div>DESCRIPTION</div><div style={{ textAlign: "right" }}>AMOUNT</div><div>SENT</div><div>DUE</div><div>STATUS</div><div></div>
                </div>
                {invoices.map(i => (
                  <div key={i.id} style={{ display: "grid", gridTemplateColumns: "110px 1.5fr 100px 110px 110px 110px 40px", padding: "8px 14px", borderBottom: `1px solid ${N.rule}`, alignItems: "center", gap: 6 }}>
                    <input value={i.invoice_number || ""} onChange={e => updateInvoice(i.id, { invoice_number: e.target.value })} placeholder="—" style={inlineInput()} />
                    <input value={i.description || ""} onChange={e => updateInvoice(i.id, { description: e.target.value })} style={inlineInput()} />
                    <input type="number" step="0.01" value={i.amount_cents != null ? (i.amount_cents / 100) : ""} onChange={e => updateInvoice(i.id, { amount_cents: e.target.value === "" ? 0 : Math.round(Number(e.target.value) * 100) })} style={{ ...inlineInput(), textAlign: "right", fontFamily: "'DM Mono', monospace" }} />
                    <input type="date" value={i.sent_on || ""} onChange={e => updateInvoice(i.id, { sent_on: e.target.value || null })} style={inlineInput()} />
                    <input type="date" value={i.due_on || ""} onChange={e => updateInvoice(i.id, { due_on: e.target.value || null })} style={inlineInput()} />
                    <select value={i.status} onChange={e => updateInvoice(i.id, { status: e.target.value, paid_on: e.target.value === "paid" ? (i.paid_on || todayISO()) : i.paid_on })} style={inlineInput()}>
                      <option value="draft">draft</option>
                      <option value="sent">sent</option>
                      <option value="paid">paid</option>
                      <option value="void">void</option>
                    </select>
                    <button onClick={() => deleteInvoice(i.id)} title="Delete" style={{ background: "transparent", border: "none", color: N.muted, cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "payments" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: N.blue, fontWeight: 700 }}>THIS YEAR · TOTAL {money(totalPaid)}</div>
                <p style={{ color: N.muted, fontSize: 13, marginTop: 4 }}>Every check or payment you've received from this client.</p>
              </div>
              <button onClick={addPayment}
                style={{ padding: "8px 14px", background: N.blue, color: N.white, border: "none", borderRadius: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", fontWeight: 700, cursor: "pointer" }}>+ ADD PAYMENT</button>
            </div>
            {payments.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", background: N.white, border: `1px dashed ${N.rule}`, borderRadius: 8, color: N.muted, fontSize: 14 }}>No payments yet.</div>
            ) : (
              <div style={{ background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "110px 130px 1fr 110px 130px 40px", padding: "10px 14px", background: "#f8fafc", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: N.muted, fontWeight: 700, borderBottom: `1px solid ${N.rule}` }}>
                  <div>TYPE</div><div>REFERENCE / CHK #</div><div>NOTES</div><div style={{ textAlign: "right" }}>AMOUNT</div><div>RECEIVED</div><div></div>
                </div>
                {payments.map(pm => (
                  <div key={pm.id} style={{ display: "grid", gridTemplateColumns: "110px 130px 1fr 110px 130px 40px", padding: "8px 14px", borderBottom: `1px solid ${N.rule}`, alignItems: "center", gap: 6 }}>
                    <select value={pm.payment_type} onChange={e => updatePayment(pm.id, { payment_type: e.target.value })} style={inlineInput()}>
                      <option value="check">check</option>
                      <option value="ach">ach</option>
                      <option value="card">card</option>
                      <option value="cash">cash</option>
                      <option value="other">other</option>
                    </select>
                    <input value={pm.reference || ""} onChange={e => updatePayment(pm.id, { reference: e.target.value })} placeholder="#1234" style={inlineInput()} />
                    <input value={pm.notes || ""} onChange={e => updatePayment(pm.id, { notes: e.target.value })} placeholder="—" style={inlineInput()} />
                    <input type="number" step="0.01" value={pm.amount_cents != null ? (pm.amount_cents / 100) : ""} onChange={e => updatePayment(pm.id, { amount_cents: e.target.value === "" ? 0 : Math.round(Number(e.target.value) * 100) })} style={{ ...inlineInput(), textAlign: "right", fontFamily: "'DM Mono', monospace" }} />
                    <input type="date" value={pm.received_on || ""} onChange={e => updatePayment(pm.id, { received_on: e.target.value })} style={inlineInput()} />
                    <button onClick={() => deletePayment(pm.id)} title="Delete" style={{ background: "transparent", border: "none", color: N.muted, cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      <SignatureFooter />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: N.muted, fontWeight: 700 }}>{label}</span>
      {children}
    </label>
  );
}
const input = () => ({ width: "100%", padding: "8px 10px", background: N.white, border: `1.5px solid ${N.rule}`, borderRadius: 6, fontFamily: "'Figtree', sans-serif", fontSize: 13, color: N.ink, outline: "none", boxSizing: "border-box" });
const inlineInput = () => ({ width: "100%", padding: "6px 8px", background: "transparent", border: "1px solid transparent", borderRadius: 4, fontSize: 12, color: N.ink, outline: "none", boxSizing: "border-box", fontFamily: "'Figtree', sans-serif" });
