// InvoiceDocPublic.jsx — the invoice the customer opens, at /inv/<token>.
//
// No login. get_invoice_doc returns the doc wearing its brand and stamps
// "viewed" the first time it is opened for real; ?preview=1 (used by the maker)
// never stamps it. A draft has no page at all — the RPC returns null until it
// is marked sent, so a link pasted early resolves to nothing rather than to a
// half-written invoice.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import InvoiceSheet, { money, pageWash } from "../components/InvoiceSheet";

export default function InvoiceDocPublic({ token }) {
  const [inv, setInv] = useState(null);
  const [state, setState] = useState("loading"); // loading | ok | notfound
  const [paying, setPaying] = useState("");

  const search = typeof window !== "undefined" ? window.location.search : "";
  const preview = /[?&]preview=1/.test(search);
  const justPaid = /[?&]paid=1/.test(search);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_invoice_doc", { p_token: token, p_preview: preview });
    if (error || !data) { setState("notfound"); return null; }
    setInv(data); setState("ok");
    return data;
  }, [token, preview]);

  useEffect(() => { load(); }, [load]);

  // Stripe redirects back before the webhook has always landed. Look again a
  // few times rather than telling someone who just paid that they still owe.
  useEffect(() => {
    if (!justPaid || state !== "ok") return;
    if (inv && (inv.status === "paid" || Number(inv.amount_paid_cents) >= Number(inv.total_cents))) return;
    let tries = 0;
    const t = setInterval(async () => {
      tries += 1;
      const fresh = await load();
      if (tries >= 6 || (fresh && fresh.status === "paid")) clearInterval(t);
    }, 2500);
    return () => clearInterval(t);
  }, [justPaid, state, inv, load]);

  async function pay() {
    setPaying("loading");
    try {
      const r = await fetch("/api/invoice-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, origin: window.location.origin }),
      });
      const j = await r.json();
      if (j.url) { window.location.href = j.url; return; }
      setPaying(j.error || "Could not open the payment page.");
    } catch (err) {
      setPaying(err.message || "Could not open the payment page.");
    }
  }

  if (state === "loading") return <Center>Loading your invoice…</Center>;
  if (state === "notfound") return <Center>This invoice link isn’t valid. Please check with the sender.</Center>;

  const settled = inv.status === "paid" || Number(inv.amount_paid_cents) >= Number(inv.total_cents);

  return (
    <div style={{ minHeight: "100vh", background: pageWash(inv.brand || {}) }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "18px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, fontFamily: "'Figtree', system-ui, sans-serif" }} className="noprint">
        <div style={{ fontSize: 13, color: settled ? "#16a34a" : "#64748b", fontWeight: settled ? 600 : 400 }}>
          {justPaid && !settled ? "Payment received — confirming…" : settled ? "Paid. Thank you." : ""}
        </div>
        <button
          onClick={() => window.print()}
          style={{ background: inv.brand?.accent_color || "#0080ff", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          Print / Save PDF
        </button>
      </div>

      <InvoiceSheet inv={inv} onPay={preview ? null : pay} paying={paying} />

      <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", padding: "0 16px 28px", fontFamily: "'Figtree', system-ui, sans-serif" }} className="noprint">
        {inv.brand?.reply_to_email ? <>Questions? {inv.brand.reply_to_email} · </> : null}
        Balance {money(Math.max((inv.total_cents || 0) - (inv.amount_paid_cents || 0), 0))}
      </div>
    </div>
  );
}

function Center({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f4f7fb", fontFamily: "'Figtree', system-ui, sans-serif", color: "#64748b", padding: 24, textAlign: "center" }}>
      {children}
    </div>
  );
}
