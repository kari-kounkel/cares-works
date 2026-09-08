// InvoiceSheet.jsx — the invoice itself.
//
// ONE component renders both the live preview inside the maker and the page the
// customer opens at /inv/<token>. If they ever drift, the preview is lying, so
// they don't get to drift: both are handed the same shape the get_invoice_doc
// RPC returns — a doc with a `brand` object hanging off it.
//
// Everything visual comes off `brand`. Nothing about any business is written
// into this file: no colors, no logo paths, no addresses. Change the brand row,
// the invoice changes.

export const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&family=Playfair+Display:wght@500;700&family=Inter:wght@400;500;600;700&display=swap";

export function money(cents) {
  const n = (cents || 0) / 100;
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDate(d) {
  if (!d) return "";
  const p = String(d).slice(0, 10).split("-");
  if (p.length !== 3) return String(d);
  return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// Line prices are dollars (the convention the ledger already uses); everything
// stored is cents. One place does the arithmetic so the preview, the saved row
// and the Stripe charge can never disagree.
export function totalsOf({ line_items = [], discount_cents = 0, tax_rate = 0 }) {
  const lines = Array.isArray(line_items) ? line_items : [];
  const subtotal = lines.reduce(
    (sum, l) => sum + Math.round((Number(l.price) || 0) * 100) * (Number(l.qty) || 0),
    0
  );
  const discount = Math.min(Math.max(Number(discount_cents) || 0, 0), subtotal);
  const tax = Math.round((subtotal - discount) * (Number(tax_rate) || 0));
  return { subtotal_cents: subtotal, discount_cents: discount, tax_cents: tax, total_cents: subtotal - discount + tax };
}

// The accent plus whichever flares the brand carries. The INVOICE itself only
// ever uses the first of these — see the note on the sheet below. The ramp is
// for the maker's own brand tiles, where telling four brands apart at a glance
// is the whole job.
export function brandRamp(b = {}) {
  return [b.accent_color, b.flare_color, b.flare2_color, b.flare3_color].filter(Boolean);
}

// Quiet grey shading behind the paper. Kari, 9/8: "i don't want these to look
// like rainbows.. i want a little shading, the great logo, and black otherwise
// for the vendor info." So: no brand color in the background at all.
export function pageWash(b = {}) {
  return `radial-gradient(ellipse at 50% -10%, rgba(10,10,20,0.05), transparent 60%),
          ${b.page_color || "#f5f6f8"}`;
}

export default function InvoiceSheet({ inv, onPay = null, paying = "", showPayment = true }) {
  const b = inv.brand || {};
  // The invoice is black on white with soft grey shading. The logo is what
  // carries the color, and the brand's ONE accent gets three restrained jobs —
  // the word INVOICE, the hairline under the head, and the balance figure.
  // The flare colors are not printed on an invoice at all.
  const ink = b.ink_color || "#0a0a14";
  const paper = b.paper_color || "#ffffff";
  const accent = b.accent_color || ink;
  const body = `'${b.body_font || "Figtree"}', system-ui, sans-serif`;
  const head = `'${b.heading_font || "DM Serif Display"}', Georgia, serif`;
  const muted = "#6b7280";
  const rule = "#e5e7eb";
  const logoH = Number(b.logo_max_height) || 72;
  const hero = Boolean(b.logo_url) && logoH >= 140;

  const lines = Array.isArray(inv.line_items) ? inv.line_items : [];
  const images = Array.isArray(inv.images) ? inv.images.filter(Boolean) : [];
  const t = totalsOf(inv);
  const paid = Number(inv.amount_paid_cents) || 0;
  const due = Math.max(t.total_cents - paid, 0);
  const settled = inv.status === "paid" || due === 0;
  const taxPct = Number(inv.tax_rate) ? (Number(inv.tax_rate) * 100).toFixed(3).replace(/\.?0+$/, "") + "%" : "";

  const payable = b.check_payable_to || b.name;

  return (
    // The wash is painted by whoever frames the sheet (the public page, the
    // maker's preview pane) so it covers their whole surface, not just this box.
    <div style={{ minHeight: "100%", fontFamily: body, color: ink, padding: "28px 16px 56px" }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{`
        @media print {
          body { background: #fff !important; }
          .noprint { display: none !important; }
          .inv-paper { box-shadow: none !important; border: 1px solid ${rule} !important; }
        }
        @media (max-width: 640px) {
          .inv-cols { flex-direction: column !important; gap: 18px !important; }
          .inv-pad { padding: 24px 20px !important; }
          .inv-row { grid-template-columns: 1fr 40px 74px 84px !important; font-size: 13px !important; }
        }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="inv-paper" style={{ background: paper, borderRadius: 16, boxShadow: "0 14px 50px rgba(10,10,20,0.10)", overflow: "hidden" }}>

          {/* A picture across the top only if the brand or the invoice has one.
              No color band — the logo below is the color on this page. */}
          {inv.header_image_url ? (
            <div style={{ height: 150, background: `url(${inv.header_image_url}) center/cover no-repeat`, borderBottom: "1px solid " + rule }} />
          ) : null}

          <div className="inv-pad" style={{ padding: "36px 42px 30px" }}>
            {/* A big logo gets the top of the page to itself — Kari, 9/8: "i want
                that logo big, man.. i want it to shine on that page." Anything
                under 140px tall keeps the ordinary logo-left/meta-right head. */}
            {hero ? (
              <div style={{ textAlign: "center", marginBottom: 26 }}>
                <img src={b.logo_url} alt={b.name} style={{ maxHeight: logoH, maxWidth: "88%", width: "auto", display: "inline-block" }} />
                {b.tagline ? <div style={{ fontSize: 12.5, color: muted, marginTop: 10, letterSpacing: "0.02em" }}>{b.tagline}</div> : null}
              </div>
            ) : null}

            <div className="inv-cols" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 26, marginBottom: 24 }}>
              <div style={{ minWidth: 0 }}>
                {hero ? null : b.logo_url
                  ? <img src={b.logo_url} alt={b.name} style={{ maxHeight: logoH, maxWidth: 340, width: "auto", display: "block", marginBottom: 8 }} />
                  : <div style={{ fontFamily: head, fontSize: 30, lineHeight: 1.15 }}>{b.name}</div>}
                {!hero && b.tagline ? <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{b.tagline}</div> : null}
                {b.from_block ? <div style={{ fontSize: 12, color: muted, marginTop: hero ? 0 : 6, whiteSpace: "pre-line", lineHeight: 1.5 }}>{b.from_block}</div> : null}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, letterSpacing: "0.16em", color: accent, fontWeight: 500 }}>
                  {b.doc_label || "INVOICE"}
                </div>
                {inv.number ? <div style={{ fontSize: 13, marginTop: 5 }}>No. {inv.number}</div> : null}
                <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{fmtDate(inv.issue_date)}</div>
                {inv.due_date
                  ? <div style={{ fontSize: 12, color: muted }}>Due {fmtDate(inv.due_date)}</div>
                  : inv.terms_label ? <div style={{ fontSize: 12, color: muted }}>{inv.terms_label}</div> : null}
                {settled ? (
                  <div style={{ display: "inline-block", marginTop: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.14em", color: ink, border: "1px solid " + rule, background: "#f4f4f5", borderRadius: 6, padding: "3px 9px" }}>PAID</div>
                ) : null}
              </div>
            </div>

            <div style={{ height: 1, background: accent, opacity: 0.5, marginBottom: 22 }} />

            <div className="inv-cols" style={{ display: "flex", gap: 44, flexWrap: "wrap", marginBottom: 22 }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: muted, marginBottom: 4 }}>BILL TO</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{inv.bill_to_name || "—"}</div>
                {inv.bill_to_address ? <div style={{ fontSize: 13, color: muted, whiteSpace: "pre-line" }}>{inv.bill_to_address}</div> : null}
                {inv.bill_to_email ? <div style={{ fontSize: 13, color: muted }}>{inv.bill_to_email}</div> : null}
                {inv.bill_to_phone ? <div style={{ fontSize: 13, color: muted }}>{inv.bill_to_phone}</div> : null}
              </div>
              {inv.purpose ? (
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: muted, marginBottom: 4 }}>FOR</div>
                  <div style={{ fontSize: 14, whiteSpace: "pre-line" }}>{inv.purpose}</div>
                </div>
              ) : null}
            </div>

            <div style={{ border: "1px solid " + rule, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
              <div className="inv-row" style={{ display: "grid", gridTemplateColumns: "1fr 50px 92px 100px", gap: 8, padding: "10px 15px", background: "#f7f7f8", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: muted }}>
                <span>DESCRIPTION</span><span style={{ textAlign: "center" }}>QTY</span><span style={{ textAlign: "right" }}>RATE</span><span style={{ textAlign: "right" }}>AMOUNT</span>
              </div>
              {lines.length === 0 ? (
                <div style={{ padding: "16px 15px", fontSize: 13, color: muted, borderTop: "1px solid " + rule }}>No lines yet.</div>
              ) : lines.map((l, i) => (
                <div key={i} className="inv-row" style={{ display: "grid", gridTemplateColumns: "1fr 50px 92px 100px", gap: 8, padding: "12px 15px", borderTop: "1px solid " + rule, fontSize: 14 }}>
                  <span style={{ whiteSpace: "pre-line" }}>{l.desc}</span>
                  <span style={{ textAlign: "center", color: muted }}>{Number(l.qty) || 0}</span>
                  <span style={{ textAlign: "right", color: muted }}>{money(Math.round((Number(l.price) || 0) * 100))}</span>
                  <span style={{ textAlign: "right", fontWeight: 500 }}>{money(Math.round((Number(l.price) || 0) * 100) * (Number(l.qty) || 0))}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: 268 }}>
                <Row label="Subtotal" value={money(t.subtotal_cents)} muted={muted} />
                {t.discount_cents ? <Row label="Discount" value={"−" + money(t.discount_cents)} muted={muted} /> : null}
                {t.tax_cents || taxPct ? <Row label={"Sales tax" + (taxPct ? ` (${taxPct})` : "")} value={money(t.tax_cents)} muted={muted} /> : null}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, fontWeight: 700, padding: "9px 0 0", marginTop: 6, borderTop: "2px solid " + ink }}>
                  <span>Total</span><span>{money(t.total_cents)}</span>
                </div>
                {paid ? <Row label="Paid" value={"−" + money(paid)} muted={muted} /> : null}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginTop: 8, fontWeight: 600, color: settled ? "#15803d" : accent }}>
                  <span>{settled ? "Paid — thank you" : "Balance due"}</span><span>{money(due)}</span>
                </div>
              </div>
            </div>

            {images.length ? (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
                {images.map((src, i) => (
                  <img key={i} src={src} alt="" style={{ maxHeight: 150, maxWidth: "100%", borderRadius: 10, border: "1px solid " + rule }} />
                ))}
              </div>
            ) : null}

            {inv.note ? (
              <div style={{ marginTop: 22, padding: "14px 16px", borderRadius: 10, background: "#fafafa", borderLeft: `3px solid ${rule}`, fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {inv.note}
              </div>
            ) : null}

            {showPayment && !settled ? (
              <PaymentBlock inv={inv} b={b} accent={accent} ink={ink} muted={muted} rule={rule} due={due} payable={payable} onPay={onPay} paying={paying} />
            ) : null}

            {b.terms ? <div style={{ marginTop: 18, fontSize: 11.5, color: muted, lineHeight: 1.6, whiteSpace: "pre-line" }}>{b.terms}</div> : null}
          </div>

        </div>

        {b.footer_note ? (
          <div style={{ textAlign: "center", fontSize: 11.5, color: "#64748b", marginTop: 14, whiteSpace: "pre-line" }}>{b.footer_note}</div>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value, muted }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: muted, padding: "3px 0" }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

// The three ways to pay, each one a card that only appears if it is switched on
// for this invoice AND the brand has what it needs to honour it.
function PaymentBlock({ inv, b, accent, ink, muted, rule, due, payable, onPay, paying }) {
  const card = inv.pay_card;
  const ach = inv.pay_ach && (b.ach_bank || b.ach_routing);
  const check = inv.pay_check && (b.remit_address || payable);
  if (!card && !ach && !check) return null;

  const box = { border: "1px solid " + rule, borderRadius: 12, padding: "14px 16px", fontSize: 13, lineHeight: 1.6, flex: "1 1 210px", minWidth: 0 };
  const label = { fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.13em", color: muted, marginBottom: 6 };

  return (
    <div style={{ marginTop: 26, paddingTop: 18, borderTop: "1px solid " + rule }}>
      <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>How to pay</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>

        {card ? (
          <div style={{ ...box, borderColor: ink }}>
            <div style={label}>ONLINE</div>
            <div style={{ marginBottom: 10 }}>Card or bank debit, paid now.</div>
            {onPay ? (
              <button
                onClick={() => onPay()}
                disabled={!!paying}
                className="noprint"
                style={{ background: ink, color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: paying ? "wait" : "pointer", width: "100%", fontFamily: "inherit" }}
              >
                {paying === "loading" ? "Opening…" : `Pay ${money(due)}`}
              </button>
            ) : (
              <div style={{ color: muted, fontSize: 12 }}>The Pay button appears on the sent invoice.</div>
            )}
            {paying && paying !== "loading" ? <div style={{ color: "#dc2626", fontSize: 12, marginTop: 8 }}>{paying}</div> : null}
          </div>
        ) : null}

        {ach ? (
          <div style={box}>
            <div style={label}>ACH / BANK TRANSFER</div>
            {b.ach_bank ? <div>{b.ach_bank}</div> : null}
            {b.ach_routing ? <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5 }}>Routing {b.ach_routing}</div> : null}
            {b.ach_account ? <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5 }}>Account {b.ach_account}</div> : null}
            {b.ach_notify ? <div style={{ color: muted, fontSize: 12, marginTop: 6 }}>Send a note to {b.ach_notify} so it gets recorded.</div> : null}
          </div>
        ) : null}

        {check ? (
          <div style={box}>
            <div style={label}>CHECK</div>
            <div>Payable to <span style={{ fontWeight: 600 }}>{payable}</span></div>
            {b.remit_address ? <div style={{ whiteSpace: "pre-line", color: muted, marginTop: 4 }}>{b.remit_address}</div> : null}
            {inv.number ? <div style={{ color: muted, fontSize: 12, marginTop: 6 }}>Note {inv.number} on the memo line.</div> : null}
          </div>
        ) : null}

      </div>
    </div>
  );
}
