// InvoicePublic.jsx — the customer-facing invoice at /i/<token>.
// No login. Loads via the get_invoice_public RPC, which also stamps "Viewed"
// on the first open — that's how the workspace sees when the customer looked.
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const FONTS = "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap";
const BLUE = "#0080ff", INK = "#0a0a14", MUTED = "#64748b", RULE = "#e2e8f0";

function money(cents) {
  const n = (cents || 0) / 100;
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  if (!d) return "";
  const p = String(d).split("-");
  if (p.length !== 3) return d;
  return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function InvoicePublic({ token }) {
  const [inv, setInv] = useState(null);
  const [state, setState] = useState("loading"); // loading | ok | notfound

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const preview = typeof window !== "undefined" && /[?&]preview=1/.test(window.location.search);
      const { data, error } = await supabase.rpc("get_invoice_public", { p_token: token, p_preview: preview });
      if (cancelled) return;
      if (error || !data) { setState("notfound"); return; }
      setInv(data); setState("ok");
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (state === "loading") return <Center><span style={{ color: MUTED, fontFamily: "'Figtree',sans-serif" }}>Loading your invoice…</span></Center>;
  if (state === "notfound") return <Center><span style={{ color: MUTED, fontFamily: "'Figtree',sans-serif" }}>This invoice link isn’t valid. Please check with the sender.</span></Center>;

  const lines = Array.isArray(inv.line_items) ? inv.line_items : [];
  const taxable = inv.tax_status === "Taxable";
  const brand = inv.brand_color || BLUE;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb", fontFamily: "'Figtree', sans-serif", color: INK, padding: "32px 16px" }}>
      <link href={FONTS} rel="stylesheet" />
      <style>{`@media print { body { background:#fff; } .noprint { display:none !important; } }`}</style>

      <div style={{ maxWidth: 660, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }} className="noprint">
          <button onClick={() => window.print()} style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Figtree',sans-serif" }}>Print / Save PDF</button>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 10px 40px rgba(10,10,20,0.08)", overflow: "hidden" }}>
          <div style={{ padding: "36px 44px 30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 30 }}>
              <div>
                {inv.logo_url ? <img src={inv.logo_url} alt={inv.org_name} style={{ maxHeight: 60, maxWidth: 300, display: "block", marginBottom: 4 }} /> : <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: INK }}>{inv.org_name}</div>}
                <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>Minnesota</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, letterSpacing: "0.16em", color: brand, fontWeight: 500 }}>INVOICE</div>
                {inv.invoice_number ? <div style={{ fontSize: 13, marginTop: 5 }}>No. {inv.invoice_number}{inv.revised ? <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "#8a5a00", background: "#fdf5e3", border: "1px solid #f0d89a", borderRadius: 5, padding: "1px 6px", marginLeft: 7 }}>REVISED</span> : null}</div> : null}
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Date: {fmtDate(inv.issue_date)}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 40, flexWrap: "wrap", marginBottom: 22 }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: MUTED, marginBottom: 4 }}>BILL TO</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{inv.customer_name}</div>
                {inv.bill_address ? <div style={{ fontSize: 13, color: MUTED, whiteSpace: "pre-line" }}>{inv.bill_address}</div> : null}
                {inv.customer_email ? <div style={{ fontSize: 13, color: MUTED }}>{inv.customer_email}</div> : null}
                {inv.bill_phone ? <div style={{ fontSize: 13, color: MUTED }}>{inv.bill_phone}</div> : null}
              </div>
              {inv.ship_address ? (
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: MUTED, marginBottom: 4 }}>SHIP TO</div>
                  <div style={{ fontSize: 13, color: INK, whiteSpace: "pre-line" }}>{inv.ship_address}</div>
                </div>
              ) : null}
            </div>

            <div style={{ border: "1px solid " + RULE, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 46px 88px 94px", gap: 8, padding: "10px 14px", background: "#f7fafd", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: MUTED }}>
                <span>DESCRIPTION</span><span style={{ textAlign: "center" }}>QTY</span><span style={{ textAlign: "right" }}>RATE</span><span style={{ textAlign: "right" }}>AMOUNT</span>
              </div>
              {lines.map((l, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 46px 88px 94px", gap: 8, padding: "11px 14px", borderTop: "1px solid " + RULE, fontSize: 14 }}>
                  <span>{l.desc}</span>
                  <span style={{ textAlign: "center", color: MUTED }}>{l.qty || 1}</span>
                  <span style={{ textAlign: "right", color: MUTED }}>{money(Math.round((l.price || 0) * 100))}</span>
                  <span style={{ textAlign: "right", fontWeight: 500 }}>{money(Math.round((l.price || 0) * (l.qty || 1) * 100))}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: 250 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: MUTED, padding: "3px 0" }}><span>Subtotal</span><span>{money(inv.subtotal_cents)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: MUTED, padding: "3px 0" }}><span>MN sales tax{taxable ? " (9.25%)" : ""}</span><span>{money(inv.tax_cents)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, padding: "9px 0 0", marginTop: 5, borderTop: "2px solid " + INK }}><span>Total</span><span>{money(inv.total_cents)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 7, fontWeight: 600, color: inv.status === "paid" ? "#22c55e" : "#e0322f" }}>
                  <span>{inv.status === "paid" ? "Paid — thank you" : "Balance due"}</span><span>{money(inv.status === "paid" ? 0 : inv.total_cents)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid " + RULE, fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: INK, marginBottom: 2 }}>Payment instructions</div>
              <div>Please send checks to:</div>
              <div style={{ whiteSpace: "pre-line", color: INK }}>{inv.remit_address || inv.org_name}</div>
              {inv.ach_routing || inv.ach_bank ? (
                <div style={{ marginTop: 6 }}>Prefer to pay by bank? ACH to {inv.ach_bank || "our bank"}{inv.ach_routing ? ` · routing ${inv.ach_routing}` : ""}{inv.ach_account ? ` · account ${inv.ach_account}` : ""}. (Please cover any bank fee.){inv.ach_notify ? ` If you pay by ACH, please email ${inv.ach_notify} so we can record it.` : ""}</div>
              ) : null}
              {inv.customer_note ? <div style={{ marginTop: 10, fontStyle: "italic", color: INK }}>{inv.customer_note}</div> : null}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: MUTED, marginTop: 16 }} className="noprint">Sent securely via CARES Works</div>
      </div>
    </div>
  );
}

function Center({ children }) {
  return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f7fb" }}><link href={FONTS} rel="stylesheet" />{children}</div>;
}
