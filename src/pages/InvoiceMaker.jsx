// InvoiceMaker.jsx — /invoices
//
// Make an invoice: pick who it's from, click what it's for, the look follows.
// Left is the form, right is the actual customer page rendered live — the same
// InvoiceSheet component that serves /inv/<token>, so the preview cannot lie.
//
// A "brand" is a row, not a case in a switch. Colors, logo, header image,
// remit address, bank details, which payment lanes are on, and the list of
// things it's usually FOR all live in invoice_brands and are edited here. A new
// business is a new row, not a code change.
//
// Three ways to be paid, per invoice: online (card or bank debit via Stripe),
// ACH straight to the bank, and check. Whichever are switched on print on the
// invoice; the online one is the only one that touches an API.

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { N, FONT_LINK, WASH_BG_LITE } from "../design/neon";
import InvoiceSheet, { money, totalsOf, brandRamp, pageWash } from "../components/InvoiceSheet";

const MOBILE = `
  @media (max-width: 1000px) {
    .im-split { grid-template-columns: 1fr !important; }
    .im-preview { position: static !important; max-height: none !important; }
  }
`;

const FONTS = ["DM Serif Display", "Playfair Display", "Figtree", "Inter", "DM Mono"];
const today = () => new Date().toISOString().slice(0, 10);

const blankDoc = (brand) => ({
  brand_id: brand?.id || null,
  number: null,
  preset_key: null,
  purpose: "",
  issue_date: today(),
  due_date: "",
  terms_label: "Due on receipt",
  bill_to_name: "",
  bill_to_email: "",
  bill_to_address: "",
  bill_to_phone: "",
  line_items: [{ desc: "", qty: 1, price: 0 }],
  images: [],
  header_image_url: null,
  discount_cents: 0,
  tax_rate: 0,
  amount_paid_cents: 0,
  status: "draft",
  pay_card: true,
  pay_ach: true,
  pay_check: true,
  note: "",
  internal_note: "",
});

export default function InvoiceMaker({ session }) {
  const [brands, setBrands] = useState([]);
  const [docs, setDocs] = useState([]);
  const [view, setView] = useState("list");      // list | edit | brand
  const [doc, setDoc] = useState(null);          // the invoice being edited
  const [brandDraft, setBrandDraft] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [{ data: b }, { data: d }] = await Promise.all([
      supabase.from("invoice_brands").select("*").eq("archived", false).order("sort").order("name"),
      supabase.from("invoice_docs").select("*").order("created_at", { ascending: false }),
    ]);
    setBrands(b || []);
    setDocs(d || []);
    setLoaded(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const brandOf = useCallback((id) => brands.find((b) => b.id === id) || null, [brands]);

  function flash(text) { setMsg(text); setTimeout(() => setMsg((m) => (m === text ? "" : m)), 4000); }

  // ---- the invoice being edited ------------------------------------------
  const set = (patch) => setDoc((d) => ({ ...d, ...patch }));

  function startNew(brand) {
    setDoc(blankDoc(brand));
    setView("edit");
  }

  // Clicking what it's FOR: lines, note and picture follow the preset.
  //
  // Every preset is offered under every brand — Kari, 9/8: "you won't let me
  // select consulting hours under cares CONSULTING ding dong." The work does not
  // sort itself by which business she happens to be billing from.
  //
  // The one thing that does NOT travel is the picture. A preset borrowed from
  // another brand would otherwise drag that brand's image onto this invoice,
  // which is exactly what the K Co brand architecture says not to do.
  function applyPreset(preset) {
    if (!preset) { set({ preset_key: null }); return; }
    const borrowed = preset.brand_id !== doc?.brand_id;
    set({
      preset_key: preset.uid,
      purpose: preset.label || "",
      line_items: (preset.lines || []).map((l) => ({ desc: l.desc || "", qty: Number(l.qty) || 1, price: Number(l.price) || 0 })),
      note: preset.note || "",
      header_image_url: borrowed ? null : (preset.header_image_url || null),
    });
  }

  async function save({ send = false } = {}) {
    if (!doc?.brand_id) { flash("Pick who it's from first."); return null; }
    setBusy(true);
    try {
      const t = totalsOf(doc);
      let number = doc.number;
      if (send && !number) {
        // Numbers are date-based by default (LB-20260908), so the invoice's own
        // date decides it — not the day she happened to press the button.
        const { data, error } = await supabase.rpc("next_invoice_doc_number", {
          p_brand: doc.brand_id,
          p_date: doc.issue_date || today(),
        });
        if (error) throw error;
        number = data;
      }
      const row = {
        brand_id: doc.brand_id,
        number,
        preset_key: doc.preset_key,
        purpose: doc.purpose || null,
        issue_date: doc.issue_date || today(),
        due_date: doc.due_date || null,
        terms_label: doc.terms_label || null,
        bill_to_name: doc.bill_to_name || null,
        bill_to_email: doc.bill_to_email || null,
        bill_to_address: doc.bill_to_address || null,
        bill_to_phone: doc.bill_to_phone || null,
        line_items: doc.line_items || [],
        images: doc.images || [],
        header_image_url: doc.header_image_url || null,
        discount_cents: t.discount_cents,
        tax_rate: Number(doc.tax_rate) || 0,
        subtotal_cents: t.subtotal_cents,
        tax_cents: t.tax_cents,
        total_cents: t.total_cents,
        note: doc.note || null,
        internal_note: doc.internal_note || null,
        pay_card: !!doc.pay_card,
        pay_ach: !!doc.pay_ach,
        pay_check: !!doc.pay_check,
        updated_at: new Date().toISOString(),
      };
      if (send) {
        row.status = doc.status === "draft" ? "sent" : doc.status;
        row.sent_at = doc.sent_at || new Date().toISOString();
      }

      let saved;
      if (doc.id) {
        const { data, error } = await supabase.from("invoice_docs").update(row).eq("id", doc.id).select().single();
        if (error) throw error;
        saved = data;
      } else {
        const { data, error } = await supabase.from("invoice_docs").insert(row).select().single();
        if (error) throw error;
        saved = data;
      }
      setDoc(saved);
      await load();
      flash(send ? "Ready to send — link copied below." : "Saved.");
      return saved;
    } catch (err) {
      flash(err.message || "Could not save.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(d, method) {
    const ref = window.prompt(method === "check" ? "Check number (optional)" : "Reference (optional)") ?? "";
    setBusy(true);
    const { error } = await supabase.from("invoice_docs").update({
      status: "paid",
      amount_paid_cents: d.total_cents,
      paid_at: new Date().toISOString(),
      paid_method: method,
      paid_reference: ref || null,
      updated_at: new Date().toISOString(),
    }).eq("id", d.id);
    setBusy(false);
    if (error) { flash(error.message); return; }
    await load();
    if (doc?.id === d.id) setDoc({ ...doc, status: "paid", amount_paid_cents: d.total_cents, paid_method: method });
    flash("Marked paid.");
  }

  async function removeDoc(d) {
    if (!window.confirm(`Delete ${d.number || "this draft"}? This cannot be undone.`)) return;
    const { error } = await supabase.from("invoice_docs").delete().eq("id", d.id);
    if (error) { flash(error.message); return; }
    await load();
    setView("list"); setDoc(null);
    flash("Deleted.");
  }

  function duplicate(d) {
    const copy = { ...d };
    delete copy.id; delete copy.public_token; delete copy.created_at; delete copy.updated_at;
    setDoc({ ...copy, number: null, status: "draft", sent_at: null, viewed_at: null, paid_at: null, paid_method: null, paid_reference: null, amount_paid_cents: 0, issue_date: today() });
    setView("edit");
  }

  async function upload(file, kind) {
    if (!file) return null;
    const clean = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `invoice-maker/${session?.user?.id || "kari"}/${kind}-${Date.now()}-${clean}`;
    const { error } = await supabase.storage.from("org-assets").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined });
    if (error) { flash(error.message); return null; }
    const { data } = supabase.storage.from("org-assets").getPublicUrl(path);
    return data.publicUrl;
  }

  // ---- brands -------------------------------------------------------------
  async function saveBrand() {
    const b = brandDraft;
    if (!b.name?.trim()) { flash("The brand needs a name."); return; }
    setBusy(true);
    const row = { ...b };
    delete row.created_at; delete row.updated_at;
    row.slug = (b.slug || b.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    row.updated_at = new Date().toISOString();
    let error;
    if (b.id) ({ error } = await supabase.from("invoice_brands").update(row).eq("id", b.id));
    else ({ error } = await supabase.from("invoice_brands").insert(row));
    setBusy(false);
    if (error) { flash(error.message); return; }
    await load();
    setView("list"); setBrandDraft(null);
    flash("Brand saved.");
  }

  const link = doc?.public_token ? `${window.location.origin}/inv/${doc.public_token}` : "";

  const preview = useMemo(() => {
    if (!doc) return null;
    const b = brandOf(doc.brand_id) || {};
    const t = totalsOf(doc);
    return {
      ...doc, ...t,
      header_image_url: doc.header_image_url || b.header_image_url || null,
      brand: {
        name: b.name, slug: b.slug, tagline: b.tagline, from_block: b.from_block,
        reply_to_email: b.reply_to_email, logo_url: b.logo_url, logo_max_height: b.logo_max_height,
        accent_color: b.accent_color, flare_color: b.flare_color, flare2_color: b.flare2_color, flare3_color: b.flare3_color,
        ink_color: b.ink_color, paper_color: b.paper_color, page_color: b.page_color,
        heading_font: b.heading_font, body_font: b.body_font, doc_label: b.doc_label,
        ach_bank: b.ach_bank, ach_routing: b.ach_routing, ach_account: b.ach_account, ach_notify: b.ach_notify,
        check_payable_to: b.check_payable_to, remit_address: b.remit_address,
        terms: b.terms, footer_note: b.footer_note,
      },
      pay_card: doc.pay_card && b.stripe_enabled !== false,
      pay_ach: doc.pay_ach && b.ach_enabled !== false,
      pay_check: doc.pay_check && b.check_enabled !== false,
    };
  }, [doc, brandOf]);

  return (
    <div style={{ minHeight: "100vh", background: WASH_BG_LITE, fontFamily: "'Figtree', sans-serif", color: N.text }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{MOBILE}</style>

      <header style={{ background: N.white, borderBottom: "1px solid " + N.rule, position: "sticky", top: 0, zIndex: 60 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 22px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="/dashboard" style={{ textDecoration: "none", fontFamily: "'DM Serif Display', serif", fontSize: 21, color: N.ink }}>
              CARES <span style={{ color: N.blueHot, fontStyle: "italic" }}>Works.</span>
            </a>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.16em", color: N.muted }}>INVOICES</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {msg ? <span style={{ fontSize: 12.5, color: N.blue }}>{msg}</span> : null}
            {view !== "list" ? <Btn ghost onClick={() => { setView("list"); setDoc(null); setBrandDraft(null); }}>All invoices</Btn> : null}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 22px 70px" }}>
        {!loaded ? <div style={{ color: N.muted, padding: 40 }}>Loading…</div> : null}

        {loaded && view === "list" ? (
          <ListView
            brands={brands} docs={docs} brandOf={brandOf}
            onNew={startNew}
            onOpen={(d) => { setDoc(d); setView("edit"); }}
            onDuplicate={duplicate}
            onEditBrand={(b) => { setBrandDraft(b ? { ...b } : newBrand()); setView("brand"); }}
          />
        ) : null}

        {loaded && view === "edit" && doc ? (
          <div className="im-split" style={{ display: "grid", gridTemplateColumns: "minmax(0,440px) minmax(0,1fr)", gap: 24, alignItems: "start" }}>
            <EditPane
              doc={doc} set={set} brands={brands} brandOf={brandOf}
              onPickBrand={(b) => set({ brand_id: b.id, header_image_url: null, preset_key: null })}
              onPreset={applyPreset}
              onSave={save} busy={busy} link={link}
              onMarkPaid={markPaid} onDelete={removeDoc} upload={upload}
              onEditBrand={(b) => { setBrandDraft({ ...b }); setView("brand"); }}
              flash={flash}
            />
            <div className="im-preview" style={{ position: "sticky", top: 78, maxHeight: "calc(100vh - 100px)", overflow: "auto", borderRadius: 16, border: "1px solid " + N.rule, background: preview?.brand ? pageWash(preview.brand) : N.white }}>
              {preview?.brand?.name
                ? <InvoiceSheet inv={preview} onPay={null} />
                : <div style={{ padding: 40, color: N.muted }}>Pick who it's from to see it.</div>}
            </div>
          </div>
        ) : null}

        {loaded && view === "brand" && brandDraft ? (
          <BrandPane b={brandDraft} setB={setBrandDraft} onSave={saveBrand} busy={busy} upload={upload} />
        ) : null}
      </div>
    </div>
  );
}

function newBrand() {
  return {
    slug: "", name: "", tagline: "", from_block: "", reply_to_email: "",
    logo_url: "", header_image_url: "", logo_max_height: 72,
    accent_color: "#0080ff", flare_color: "#22c55e", flare2_color: "", flare3_color: "",
    ink_color: "#0a0a14", paper_color: "#ffffff", page_color: "#f4f7fb",
    heading_font: "DM Serif Display", body_font: "Figtree", doc_label: "INVOICE",
    presets: [], stripe_enabled: true, ach_enabled: true, check_enabled: true,
    ach_bank: "", ach_routing: "", ach_account: "", ach_notify: "",
    check_payable_to: "", remit_address: "", terms: "", footer_note: "",
    number_prefix: "", number_format: "date", next_number: 1001, sort: 99, archived: false,
  };
}

// ============================================================================
// The list — open invoices up top, a divider, then the settled ones.
// ============================================================================
function ListView({ brands, docs, brandOf, onNew, onOpen, onDuplicate, onEditBrand }) {
  const open = docs.filter((d) => d.status !== "paid");
  const closed = docs.filter((d) => d.status === "paid");
  const owed = open.reduce((s, d) => s + Math.max((d.total_cents || 0) - (d.amount_paid_cents || 0), 0), 0);

  return (
    <>
      <div style={{ marginBottom: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.14em", color: N.muted }}>WHO IS IT FROM</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 30 }}>
        {brands.map((b) => (
          <BrandTile key={b.id} b={b} onClick={() => onNew(b)} onEdit={() => onEditBrand(b)} />
        ))}
        <button onClick={() => onEditBrand(null)} style={{ border: "1.5px dashed " + N.rule, background: "transparent", borderRadius: 14, padding: "18px 20px", minWidth: 150, cursor: "pointer", color: N.muted, fontSize: 13, fontFamily: "inherit" }}>
          + Another brand
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24 }}>Open</div>
        <div style={{ fontSize: 13, color: N.muted }}>{open.length} open · {money(owed)} outstanding</div>
      </div>
      {open.length === 0 ? <Empty>Nothing open. Pick a brand above to start one.</Empty> : null}
      {open.map((d) => <DocRow key={d.id} d={d} b={brandOf(d.brand_id)} onOpen={onOpen} onDuplicate={onDuplicate} />)}

      {closed.length ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "34px 0 14px" }}>
            <div style={{ height: 1, background: N.rule, flex: 1 }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.14em", color: N.mutedLite }}>PAID</span>
            <div style={{ height: 1, background: N.rule, flex: 1 }} />
          </div>
          {closed.map((d) => <DocRow key={d.id} d={d} b={brandOf(d.brand_id)} onOpen={onOpen} onDuplicate={onDuplicate} />)}
        </>
      ) : null}
    </>
  );
}

function BrandTile({ b, onClick, onEdit }) {
  const ramp = brandRamp(b);
  return (
    <div style={{ position: "relative", borderRadius: 14, border: "1px solid " + N.rule, background: N.white, minWidth: 168, overflow: "hidden", boxShadow: "0 2px 10px rgba(10,10,20,0.04)" }}>
      <div style={{ height: 6, background: ramp.length > 1 ? `linear-gradient(90deg, ${ramp.join(", ")})` : b.accent_color }} />
      <button onClick={onClick} style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "14px 16px 12px", cursor: "pointer", fontFamily: "inherit" }}>
        {b.logo_url
          ? <img src={b.logo_url} alt={b.name} style={{ maxHeight: 26, maxWidth: 140, display: "block", marginBottom: 6 }} />
          : <div style={{ fontFamily: `'${b.heading_font || "DM Serif Display"}', serif`, fontSize: 17, color: N.ink, marginBottom: 4 }}>{b.name}</div>}
        <div style={{ fontSize: 11.5, color: N.muted }}>{(b.presets || []).length} things it's for</div>
      </button>
      <button onClick={onEdit} title="Edit this brand" style={{ position: "absolute", top: 12, right: 10, background: "transparent", border: "none", color: N.mutedLite, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>edit</button>
    </div>
  );
}

const STATUS_TONE = {
  draft: { bg: "#f1f5f9", fg: "#64748b", label: "Draft" },
  sent: { bg: "#eff6ff", fg: "#1d4ed8", label: "Sent" },
  viewed: { bg: "#fefce8", fg: "#a16207", label: "Opened" },
  paid: { bg: "#f0fdf4", fg: "#15803d", label: "Paid" },
};

function DocRow({ d, b, onOpen, onDuplicate }) {
  const tone = STATUS_TONE[d.status] || STATUS_TONE.draft;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", border: "1px solid " + N.rule, borderRadius: 12, background: N.white, marginBottom: 8, flexWrap: "wrap" }}>
      <div style={{ width: 5, alignSelf: "stretch", borderRadius: 3, background: b?.accent_color || N.rule }} />
      <div style={{ minWidth: 148, flex: "1 1 200px" }}>
        <div style={{ fontWeight: 600, fontSize: 14.5 }}>{d.bill_to_name || "(no customer yet)"}</div>
        <div style={{ fontSize: 12, color: N.muted }}>{b?.name}{d.purpose ? " · " + d.purpose : ""}</div>
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: N.muted, minWidth: 78 }}>{d.number || "—"}</div>
      <div style={{ fontSize: 12, color: N.muted, minWidth: 92 }}>{d.issue_date}</div>
      <div style={{ fontWeight: 600, fontSize: 14, minWidth: 90, textAlign: "right" }}>{money(d.total_cents)}</div>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: tone.fg, background: tone.bg, borderRadius: 6, padding: "3px 9px" }}>{tone.label}</span>
      <Btn onClick={() => onOpen(d)}>Open</Btn>
      <Btn ghost onClick={() => onDuplicate(d)}>Copy</Btn>
    </div>
  );
}

// ============================================================================
// The form
// ============================================================================
function EditPane({ doc, set, brands, brandOf, onPickBrand, onPreset, onSave, busy, link, onMarkPaid, onDelete, upload, onEditBrand, flash }) {
  const b = brandOf(doc.brand_id);
  const presets = brands.flatMap((x) =>
    (x.presets || []).map((p) => ({
      ...p,
      brand_id: x.id,
      brand_name: x.name,
      uid: x.id + ":" + p.key,
    }))
  ).sort((m, n) => (m.brand_id === doc.brand_id ? -1 : 0) - (n.brand_id === doc.brand_id ? -1 : 0));
  const t = totalsOf(doc);
  const [copied, setCopied] = useState(false);

  const lines = doc.line_items || [];
  const setLine = (i, patch) => set({ line_items: lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  const addLine = () => set({ line_items: [...lines, { desc: "", qty: 1, price: 0 }] });
  const delLine = (i) => set({ line_items: lines.filter((_, j) => j !== i) });

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  }

  function mailDraft() {
    const subject = encodeURIComponent(`${b?.name || "Invoice"} — invoice ${doc.number || ""}`.trim());
    const body = encodeURIComponent(
      `${doc.bill_to_name ? "Hi " + doc.bill_to_name.split(" ")[0] + "," : "Hi,"}\n\n` +
      `Your invoice${doc.number ? " (" + doc.number + ")" : ""} for ${money(t.total_cents)} is here:\n${link}\n\n` +
      `You can pay it online from that page${doc.pay_check ? ", or send a check" : ""}${doc.pay_ach ? ", or transfer it to the bank" : ""}.\n\n` +
      `Thank you,\n${b?.name || ""}`
    );
    window.location.href = `mailto:${doc.bill_to_email || ""}?subject=${subject}&body=${body}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      <Card title="Who it's from">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {brands.map((x) => {
            const on = x.id === doc.brand_id;
            return (
              <button key={x.id} onClick={() => onPickBrand(x)}
                style={{
                  border: on ? `2px solid ${x.accent_color}` : "1px solid " + N.rule,
                  background: on ? `${x.accent_color}0f` : N.white,
                  borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontSize: 13,
                  fontWeight: on ? 700 : 500, color: on ? N.ink : N.muted, fontFamily: "inherit",
                }}>
                {x.name}
              </button>
            );
          })}
        </div>
        {b ? (
          <div style={{ marginTop: 10, fontSize: 12, color: N.muted }}>
            {b.tagline || b.slug} · <button onClick={() => onEditBrand(b)} style={linkBtn}>edit this look</button>
          </div>
        ) : null}
      </Card>

      {b ? (
        <Card title="What it's for">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {presets.map((p) => {
              const on = p.uid === doc.preset_key;
              const own = p.brand_id === doc.brand_id;
              return (
                <button key={p.uid} onClick={() => onPreset(p)}
                  title={own ? p.label : `${p.label} — kept under ${p.brand_name}`}
                  style={{
                    border: on ? `2px solid ${b.accent_color}` : "1px solid " + N.rule,
                    background: on ? `${b.accent_color}0f` : N.white,
                    borderRadius: 999, padding: "7px 14px", cursor: "pointer", fontSize: 12.5,
                    fontWeight: on ? 700 : 500, color: on ? N.ink : own ? N.muted : N.mutedLite,
                    fontFamily: "inherit",
                  }}>
                  {p.label}
                  {own ? null : <span style={{ fontSize: 10.5, opacity: 0.75 }}> · {p.brand_name}</span>}
                </button>
              );
            })}
            {presets.length === 0 ? <span style={{ fontSize: 12.5, color: N.muted }}>Nothing saved yet — <button onClick={() => onEditBrand(b)} style={linkBtn}>add some</button>.</span> : null}
          </div>
          <Field label="Or say it in your own words" style={{ marginTop: 12 }}>
            <input value={doc.purpose || ""} onChange={(e) => set({ purpose: e.target.value })} style={inp} placeholder="Website build, March" />
          </Field>
          <Field label="Picture across the top (optional)">
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input value={doc.header_image_url || ""} onChange={(e) => set({ header_image_url: e.target.value })} style={{ ...inp, flex: 1, minWidth: 180 }} placeholder={b.header_image_url || "the brand's own image"} />
              <FilePick label="Upload" onFile={async (f) => { const url = await upload(f, "header"); if (url) set({ header_image_url: url }); }} />
              {doc.header_image_url ? <button onClick={() => set({ header_image_url: null })} style={linkBtn}>clear</button> : null}
            </div>
          </Field>
        </Card>
      ) : null}

      <Card title="Bill to">
        <Field label="Name"><input value={doc.bill_to_name || ""} onChange={(e) => set({ bill_to_name: e.target.value })} style={inp} /></Field>
        <Field label="Email"><input value={doc.bill_to_email || ""} onChange={(e) => set({ bill_to_email: e.target.value })} style={inp} /></Field>
        <Field label="Address"><textarea value={doc.bill_to_address || ""} onChange={(e) => set({ bill_to_address: e.target.value })} style={{ ...inp, minHeight: 60, resize: "vertical" }} /></Field>
        <Field label="Phone"><input value={doc.bill_to_phone || ""} onChange={(e) => set({ bill_to_phone: e.target.value })} style={inp} /></Field>
        <Row2>
          <Field label="Date"><input type="date" value={doc.issue_date || ""} onChange={(e) => set({ issue_date: e.target.value })} style={inp} /></Field>
          <Field label="Due"><input type="date" value={doc.due_date || ""} onChange={(e) => set({ due_date: e.target.value })} style={inp} /></Field>
        </Row2>
        <Field label="Terms line (when there's no due date)"><input value={doc.terms_label || ""} onChange={(e) => set({ terms_label: e.target.value })} style={inp} /></Field>
      </Card>

      <Card title="Lines">
        {lines.map((l, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 54px 84px 24px", gap: 6, marginBottom: 6, alignItems: "start" }}>
            <textarea value={l.desc} onChange={(e) => setLine(i, { desc: e.target.value })} placeholder="What it is" rows={1} style={{ ...inp, resize: "vertical", minHeight: 34 }} />
            <input type="number" step="any" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value === "" ? "" : Number(e.target.value) })} style={{ ...inp, textAlign: "center" }} />
            <input type="number" step="0.01" value={l.price} onChange={(e) => setLine(i, { price: e.target.value === "" ? "" : Number(e.target.value) })} style={{ ...inp, textAlign: "right" }} />
            <button onClick={() => delLine(i)} title="Remove" style={{ background: "transparent", border: "none", color: N.mutedLite, cursor: "pointer", fontSize: 16, lineHeight: "34px" }}>×</button>
          </div>
        ))}
        <button onClick={addLine} style={{ ...linkBtn, marginTop: 4 }}>+ line</button>
        <Row2 style={{ marginTop: 12 }}>
          <Field label="Discount ($)">
            <input type="number" step="0.01" value={(doc.discount_cents || 0) / 100}
              onChange={(e) => set({ discount_cents: Math.round((Number(e.target.value) || 0) * 100) })} style={inp} />
          </Field>
          <Field label="Sales tax (%)">
            <input type="number" step="0.001" value={((Number(doc.tax_rate) || 0) * 100).toFixed(3).replace(/\.?0+$/, "")}
              onChange={(e) => set({ tax_rate: (Number(e.target.value) || 0) / 100 })} style={inp} />
          </Field>
        </Row2>
        <div style={{ marginTop: 10, textAlign: "right", fontSize: 15, fontWeight: 700 }}>{money(t.total_cents)}</div>
      </Card>

      <Card title="Note & pictures">
        <Field label="Note to them"><textarea value={doc.note || ""} onChange={(e) => set({ note: e.target.value })} style={{ ...inp, minHeight: 62, resize: "vertical" }} /></Field>
        <Field label="Pictures on the invoice">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {(doc.images || []).map((src, i) => (
              <span key={i} style={{ position: "relative", display: "inline-block" }}>
                <img src={src} alt="" style={{ height: 46, borderRadius: 6, border: "1px solid " + N.rule }} />
                <button onClick={() => set({ images: doc.images.filter((_, j) => j !== i) })}
                  style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 9, border: "none", background: N.ink, color: "#fff", fontSize: 11, cursor: "pointer", lineHeight: "18px", padding: 0 }}>×</button>
              </span>
            ))}
            <FilePick label="Add picture" onFile={async (f) => { const url = await upload(f, "image"); if (url) set({ images: [...(doc.images || []), url] }); }} />
          </div>
        </Field>
        <Field label="Note to yourself (never printed)"><input value={doc.internal_note || ""} onChange={(e) => set({ internal_note: e.target.value })} style={inp} /></Field>
      </Card>

      <Card title="How they can pay">
        <Check on={doc.pay_card} set={(v) => set({ pay_card: v })} label="Online — card or bank debit (Stripe)" note={b && b.stripe_enabled === false ? "off for this brand" : ""} />
        <Check on={doc.pay_ach} set={(v) => set({ pay_ach: v })} label="ACH straight to the bank" note={b && !b.ach_bank && !b.ach_routing ? "no bank details on this brand yet" : ""} />
        <Check on={doc.pay_check} set={(v) => set({ pay_check: v })} label="Check in the mail" note={b && !b.remit_address ? "no remit address on this brand yet" : ""} />
      </Card>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", position: "sticky", bottom: 0, background: "rgba(255,255,255,0.94)", padding: "12px 0", borderTop: "1px solid " + N.rule }}>
        <Btn onClick={() => onSave({ send: false })} disabled={busy}>Save draft</Btn>
        <Btn primary onClick={() => onSave({ send: true })} disabled={busy}>
          {doc.status === "draft" ? "Number it & make the link" : "Save"}
        </Btn>
        {doc.id && doc.status !== "paid" ? <Btn ghost onClick={() => onMarkPaid(doc, "check")} disabled={busy}>Check came in</Btn> : null}
        {doc.id && doc.status !== "paid" ? <Btn ghost onClick={() => onMarkPaid(doc, "ach")} disabled={busy}>ACH landed</Btn> : null}
        {doc.id ? <Btn ghost onClick={() => onDelete(doc)} disabled={busy}>Delete</Btn> : null}
      </div>

      {doc.public_token && doc.status !== "draft" ? (
        <Card title="Their link">
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input readOnly value={link} onFocus={(e) => e.target.select()} style={{ ...inp, flex: 1, minWidth: 200, fontFamily: "'DM Mono', monospace", fontSize: 12 }} />
            <Btn onClick={copyLink}>{copied ? "Copied" : "Copy"}</Btn>
            <Btn ghost onClick={mailDraft}>Email draft</Btn>
            <a href={link} target="_blank" rel="noreferrer" style={{ ...linkBtn, textDecoration: "none" }}>open</a>
          </div>
          <div style={{ fontSize: 12, color: N.muted, marginTop: 8 }}>
            {doc.viewed_at ? `They opened it ${new Date(doc.viewed_at).toLocaleString()}.` : "Not opened yet."}
            {doc.paid_at ? ` Paid ${new Date(doc.paid_at).toLocaleDateString()}${doc.paid_method ? " by " + doc.paid_method : ""}.` : ""}
          </div>
        </Card>
      ) : doc.id ? (
        <div style={{ fontSize: 12.5, color: N.muted }}>A draft has no live link — number it and the link starts working.</div>
      ) : null}
    </div>
  );
}

// ============================================================================
// The brand editor — the look, the money details, and what it's usually for.
// ============================================================================
function BrandPane({ b, setB, onSave, busy, upload }) {
  const set = (patch) => setB({ ...b, ...patch });
  const presets = b.presets || [];
  const setPreset = (i, patch) => set({ presets: presets.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  function addPreset() {
    set({ presets: [...presets, { key: "p" + Date.now().toString(36), label: "", lines: [{ desc: "", qty: 1, price: 0 }], note: "", header_image_url: "" }] });
  }

  return (
    <div style={{ maxWidth: 780 }}>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 27, margin: "0 0 4px" }}>{b.id ? b.name : "A new brand"}</h1>
      <p style={{ color: N.muted, fontSize: 13.5, marginTop: 0, marginBottom: 22 }}>
        Everything here is what an invoice from this brand looks like and how it gets paid.
      </p>

      <Card title="Name & identity">
        <Row2>
          <Field label="Name"><input value={b.name || ""} onChange={(e) => set({ name: e.target.value })} style={inp} /></Field>
          <Field label="Tagline"><input value={b.tagline || ""} onChange={(e) => set({ tagline: e.target.value })} style={inp} /></Field>
        </Row2>
        <Field label="Address block under the logo"><textarea value={b.from_block || ""} onChange={(e) => set({ from_block: e.target.value })} style={{ ...inp, minHeight: 58, resize: "vertical" }} /></Field>
        <Row2>
          <Field label="Reply-to email"><input value={b.reply_to_email || ""} onChange={(e) => set({ reply_to_email: e.target.value })} style={inp} /></Field>
          <Field label="Word at the top right"><input value={b.doc_label || ""} onChange={(e) => set({ doc_label: e.target.value })} style={inp} placeholder="INVOICE" /></Field>
        </Row2>
        <Field label="Logo">
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {b.logo_url ? <img src={b.logo_url} alt="" style={{ height: 34 }} /> : null}
            <input value={b.logo_url || ""} onChange={(e) => set({ logo_url: e.target.value })} style={{ ...inp, flex: 1, minWidth: 180 }} placeholder="/cares-works-neon-logo.png" />
            <FilePick label="Upload" onFile={async (f) => { const url = await upload(f, "logo"); if (url) set({ logo_url: url }); }} />
          </div>
        </Field>
        <Field label="How tall the logo prints (px) — a square lockup wants 150–220, a wordmark 60–80">
          <input type="number" value={b.logo_max_height ?? 72} onChange={(e) => set({ logo_max_height: Number(e.target.value) })} style={{ ...inp, width: 120 }} />
        </Field>
        <Field label="Picture across the top of every invoice">
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {b.header_image_url ? <img src={b.header_image_url} alt="" style={{ height: 34, borderRadius: 4 }} /> : null}
            <input value={b.header_image_url || ""} onChange={(e) => set({ header_image_url: e.target.value })} style={{ ...inp, flex: 1, minWidth: 180 }} />
            <FilePick label="Upload" onFile={async (f) => { const url = await upload(f, "header"); if (url) set({ header_image_url: url }); }} />
          </div>
        </Field>
      </Card>

      <Card title="The look">
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Color label="Accent" value={b.accent_color} onChange={(v) => set({ accent_color: v })} />
          <Color label="Flare" value={b.flare_color} onChange={(v) => set({ flare_color: v })} />
          <Color label="Flare 2" value={b.flare2_color} onChange={(v) => set({ flare2_color: v })} />
          <Color label="Flare 3" value={b.flare3_color} onChange={(v) => set({ flare3_color: v })} />
          <Color label="Ink" value={b.ink_color} onChange={(v) => set({ ink_color: v })} />
          <Color label="Paper" value={b.paper_color} onChange={(v) => set({ paper_color: v })} />
          <Color label="Page" value={b.page_color} onChange={(v) => set({ page_color: v })} />
        </div>
        <div style={{ height: 10, borderRadius: 5, marginTop: 14, background: brandRamp(b).length > 1 ? `linear-gradient(90deg, ${brandRamp(b).join(", ")})` : b.accent_color }} />
        <Row2 style={{ marginTop: 12 }}>
          <Field label="Heading font">
            <select value={b.heading_font || "DM Serif Display"} onChange={(e) => set({ heading_font: e.target.value })} style={inp}>
              {FONTS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Body font">
            <select value={b.body_font || "Figtree"} onChange={(e) => set({ body_font: e.target.value })} style={inp}>
              {FONTS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </Field>
        </Row2>
      </Card>

      <Card title="Getting paid">
        <Check on={b.stripe_enabled !== false} set={(v) => set({ stripe_enabled: v })} label="Online — card or bank debit (Stripe)" />
        <div style={{ fontSize: 12, color: N.muted, margin: "-4px 0 12px 26px" }}>Deposits into the one CARES Stripe account.</div>

        <Check on={b.ach_enabled !== false} set={(v) => set({ ach_enabled: v })} label="ACH straight to the bank" />
        <Row2>
          <Field label="Bank"><input value={b.ach_bank || ""} onChange={(e) => set({ ach_bank: e.target.value })} style={inp} /></Field>
          <Field label="Tell-me email"><input value={b.ach_notify || ""} onChange={(e) => set({ ach_notify: e.target.value })} style={inp} /></Field>
        </Row2>
        <Row2>
          <Field label="Routing"><input value={b.ach_routing || ""} onChange={(e) => set({ ach_routing: e.target.value })} style={inp} /></Field>
          <Field label="Account"><input value={b.ach_account || ""} onChange={(e) => set({ ach_account: e.target.value })} style={inp} /></Field>
        </Row2>

        <Check on={b.check_enabled !== false} set={(v) => set({ check_enabled: v })} label="Check in the mail" />
        <Row2>
          <Field label="Checks payable to"><input value={b.check_payable_to || ""} onChange={(e) => set({ check_payable_to: e.target.value })} style={inp} /></Field>
          <Field label="Mail them to"><textarea value={b.remit_address || ""} onChange={(e) => set({ remit_address: e.target.value })} style={{ ...inp, minHeight: 58, resize: "vertical" }} /></Field>
        </Row2>
      </Card>

      <Card title="What invoices from here are usually for">
        {presets.map((p, i) => (
          <div key={p.key || i} style={{ border: "1px solid " + N.rule, borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <Row2>
              <Field label="Button label"><input value={p.label || ""} onChange={(e) => setPreset(i, { label: e.target.value })} style={inp} /></Field>
              <Field label="Picture for this one"><input value={p.header_image_url || ""} onChange={(e) => setPreset(i, { header_image_url: e.target.value })} style={inp} placeholder="optional" /></Field>
            </Row2>
            {(p.lines || []).map((l, li) => (
              <div key={li} style={{ display: "grid", gridTemplateColumns: "1fr 52px 80px 22px", gap: 6, marginBottom: 5 }}>
                <input value={l.desc || ""} placeholder="Line" onChange={(e) => setPreset(i, { lines: p.lines.map((x, j) => (j === li ? { ...x, desc: e.target.value } : x)) })} style={inp} />
                <input type="number" step="any" value={l.qty ?? 1} onChange={(e) => setPreset(i, { lines: p.lines.map((x, j) => (j === li ? { ...x, qty: Number(e.target.value) } : x)) })} style={{ ...inp, textAlign: "center" }} />
                <input type="number" step="0.01" value={l.price ?? 0} onChange={(e) => setPreset(i, { lines: p.lines.map((x, j) => (j === li ? { ...x, price: Number(e.target.value) } : x)) })} style={{ ...inp, textAlign: "right" }} />
                <button onClick={() => setPreset(i, { lines: p.lines.filter((_, j) => j !== li) })} style={{ background: "transparent", border: "none", color: N.mutedLite, cursor: "pointer" }}>×</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button onClick={() => setPreset(i, { lines: [...(p.lines || []), { desc: "", qty: 1, price: 0 }] })} style={linkBtn}>+ line</button>
              <button onClick={() => set({ presets: presets.filter((_, j) => j !== i) })} style={linkBtn}>remove</button>
            </div>
            <Field label="Note that comes with it" style={{ marginTop: 8 }}>
              <input value={p.note || ""} onChange={(e) => setPreset(i, { note: e.target.value })} style={inp} />
            </Field>
          </div>
        ))}
        <button onClick={addPreset} style={linkBtn}>+ another</button>
      </Card>

      <Card title="Small print & numbering">
        <Field label="Terms (bottom of the invoice)"><textarea value={b.terms || ""} onChange={(e) => set({ terms: e.target.value })} style={{ ...inp, minHeight: 54, resize: "vertical" }} /></Field>
        <Field label="Footer line (under the paper)"><input value={b.footer_note || ""} onChange={(e) => set({ footer_note: e.target.value })} style={inp} /></Field>
        <Row2>
          <Field label="Number prefix"><input value={b.number_prefix || ""} onChange={(e) => set({ number_prefix: e.target.value })} style={inp} placeholder="LB-" /></Field>
          <Field label="Numbering">
            <select value={b.number_format || "date"} onChange={(e) => set({ number_format: e.target.value })} style={inp}>
              <option value="date">By date — {(b.number_prefix || "")}{new Date().toISOString().slice(0, 10).replace(/-/g, "")}</option>
              <option value="sequence">Running number — {(b.number_prefix || "")}{b.next_number ?? 1001}</option>
            </select>
          </Field>
        </Row2>
        {(b.number_format || "date") === "sequence" ? (
          <Field label="Next number"><input type="number" value={b.next_number ?? 1001} onChange={(e) => set({ next_number: Number(e.target.value) })} style={{ ...inp, width: 140 }} /></Field>
        ) : (
          <div style={{ fontSize: 12, color: N.muted, marginTop: -4 }}>A second invoice for this brand on the same day gets -2, then -3.</div>
        )}
      </Card>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Btn primary onClick={onSave} disabled={busy}>Save brand</Btn>
      </div>
    </div>
  );
}

// ---- small pieces -----------------------------------------------------------

const inp = {
  width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid " + N.rule,
  fontSize: 13.5, fontFamily: "inherit", color: N.text, background: N.white, boxSizing: "border-box",
};

const linkBtn = {
  background: "transparent", border: "none", color: N.blue, cursor: "pointer",
  fontSize: 12.5, padding: 0, fontFamily: "inherit", textDecoration: "underline",
};

function Card({ title, children }) {
  return (
    <section style={{ background: N.white, border: "1px solid " + N.rule, borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10.5, letterSpacing: "0.14em", color: N.muted, marginBottom: 12 }}>{title.toUpperCase()}</div>
      {children}
    </section>
  );
}

function Field({ label, children, style = {} }) {
  return (
    <label style={{ display: "block", marginBottom: 10, ...style }}>
      <span style={{ display: "block", fontSize: 11.5, color: N.muted, marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}

function Row2({ children, style = {} }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, ...style }}>{children}</div>;
}

function Check({ on, set, label, note }) {
  return (
    <label style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 10, fontSize: 13.5, cursor: "pointer" }}>
      <input type="checkbox" checked={!!on} onChange={(e) => set(e.target.checked)} style={{ width: 16, height: 16, accentColor: N.blue }} />
      <span>{label}</span>
      {note ? <span style={{ fontSize: 11.5, color: "#b45309" }}>({note})</span> : null}
    </label>
  );
}

function Color({ label, value, onChange }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 11.5, color: N.muted, marginBottom: 4 }}>{label}</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input type="color" value={value || "#ffffff"} onChange={(e) => onChange(e.target.value)}
          style={{ width: 34, height: 30, padding: 0, border: "1px solid " + N.rule, borderRadius: 6, background: "none", cursor: "pointer" }} />
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="none"
          style={{ ...inp, width: 88, fontFamily: "'DM Mono', monospace", fontSize: 11.5 }} />
      </div>
    </label>
  );
}

function FilePick({ label, onFile }) {
  const [busy, setBusy] = useState(false);
  return (
    <label style={{ ...linkBtn, cursor: busy ? "wait" : "pointer", textDecoration: "underline" }}>
      {busy ? "uploading…" : label}
      <input type="file" accept="image/*" style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true); await onFile(f); setBusy(false);
        }} />
    </label>
  );
}

function Btn({ children, onClick, primary, ghost, disabled }) {
  const base = {
    borderRadius: 9, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", opacity: disabled ? 0.55 : 1,
  };
  const style = primary
    ? { ...base, background: N.blue, color: "#fff", border: "none", boxShadow: "0 3px 12px rgba(0,128,255,0.32)" }
    : ghost
      ? { ...base, background: "transparent", color: N.muted, border: "1px solid " + N.rule }
      : { ...base, background: N.white, color: N.ink, border: "1px solid " + N.rule };
  return <button onClick={onClick} disabled={disabled} style={style}>{children}</button>;
}

function Empty({ children }) {
  return <div style={{ padding: "22px 16px", border: "1px dashed " + N.rule, borderRadius: 12, color: N.muted, fontSize: 13.5 }}>{children}</div>;
}
