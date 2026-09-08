import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function money(cents: number) {
  return "$" + ((cents || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(s: string) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// SendGrid rejects any From address that isn't a verified Sender Identity with a 403.
// That reads as a bare "Send failed." unless we name it, so turn it into plain English.
function sendFailMessage(detail: unknown, fromEmail: string): string {
  const raw = JSON.stringify(detail || "");
  if (raw.includes("does not match a verified Sender Identity")) {
    return "The from address " + (fromEmail || "(default)") + " isn't verified in SendGrid yet, so nothing was sent.";
  }
  return "Send failed — nothing went out.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supa = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });

    // Copy the logged-in user (Dave / Betty) on the send, derived from their session.
    const { data: authUser } = await supa.auth.getUser();
    const senderEmail = String(authUser?.user?.email || "").trim();

    const { order_id, to: toOverride } = await req.json();
    if (!order_id) return json({ error: "order_id required" }, 400);

    const { data: po, error } = await supa.from("invoices").select("*").eq("id", order_id).single();
    if (error || !po) return json({ error: "Order not found or you don't have access." }, 403);
    if (po.doc_type !== "order") return json({ error: "That isn't a purchase order." }, 400);

    let to = String(toOverride || "").trim();
    if (!to && po.vendor_name) {
      const { data: ven } = await supa.from("ledger_vendors").select("email").eq("org_id", po.org_id).ilike("name", po.vendor_name).limit(1).maybeSingle();
      to = String(ven?.email || "").trim();
    }
    if (!to) return json({ error: "No email for this vendor. Type the vendor's email and try again." }, 400);

    const { data: org } = await supa.from("ledger_orgs").select("name, remit_address, reply_to_email, from_email").eq("id", po.org_id).single();
    const orgName = (org?.name || "Our company").trim();
    const remit = (org?.remit_address || orgName).trim();
    const replyTo = (org?.reply_to_email || "").trim();
    // Send as the org's own address once it's a verified sender; otherwise the hub default.
    const fromEmail = (org?.from_email || "").trim();

    const lines = Array.isArray(po.line_items) ? po.line_items : [];
    const poNo = po.po_number ? String(po.po_number) : "";
    const subject = "Purchase Order" + (poNo ? " #" + poNo : "") + " from " + orgName;

    const rowsHtml = lines.map((l: any) => {
      const qty = l.qty || 1; const cost = Number(l.cost || 0);
      const desc = esc(l.desc || "") + (l.item ? " · " + esc(l.item) : "");
      return '<tr><td style="padding:6px 10px;border-top:1px solid #e2e8f0">' + desc + '</td><td style="padding:6px 10px;border-top:1px solid #e2e8f0;text-align:center">' + qty + '</td><td style="padding:6px 10px;border-top:1px solid #e2e8f0;text-align:right">$' + cost.toFixed(2) + '</td></tr>';
    }).join("");
    const total = lines.reduce((s: number, l: any) => s + Math.round(Number(l.cost || 0) * 100) * (l.qty || 1), 0);

    const html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0f172a;line-height:1.6">' +
      "<p>Hello " + esc(po.vendor_name || "") + ",</p>" +
      "<p><b>" + esc(orgName) + "</b> would like to order the following" + (poNo ? " — Purchase Order #" + esc(poNo) : "") + ":</p>" +
      '<table style="border-collapse:collapse;width:100%;font-size:14px;margin:10px 0"><thead><tr>' +
      '<th style="text-align:left;padding:6px 10px;color:#64748b;font-size:11px;letter-spacing:.08em">DESCRIPTION</th>' +
      '<th style="text-align:center;padding:6px 10px;color:#64748b;font-size:11px">QTY</th>' +
      '<th style="text-align:right;padding:6px 10px;color:#64748b;font-size:11px">COST</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>' +
      '<p style="font-weight:700">PO total: ' + money(total) + '</p>' +
      "<p><b>Ship to:</b><br>" + esc(remit).replace(/\n/g, "<br>") + "</p>" +
      "<p>Please reference PO" + (poNo ? " #" + esc(poNo) : "") + " on your invoice. Thank you!</p>" +
      '<p style="color:#94a3b8;font-size:12px">Sent securely via CARES Works.</p>' +
      "</div>";

    const textLines = lines.map((l: any) => "  - " + (l.desc || "") + (l.item ? " (" + l.item + ")" : "") + "  x" + (l.qty || 1) + "  @ $" + Number(l.cost || 0).toFixed(2)).join("\n");
    const text =
      "Hello " + (po.vendor_name || "") + ",\n\n" +
      orgName + " would like to order" + (poNo ? " (Purchase Order #" + poNo + ")" : "") + ":\n\n" +
      textLines + "\n\nPO total: " + money(total) + "\n\n" +
      "Ship to:\n" + remit + "\n\n" +
      "Please reference PO" + (poNo ? " #" + poNo : "") + " on your invoice. Thank you!\n\nSent securely via CARES Works.";

    const hubUrl = Deno.env.get("HUB_URL");
    const hubSecret = Deno.env.get("HUB_WEBHOOK_SECRET");
    if (!hubUrl || !hubSecret) return json({ error: "Email isn't configured yet (missing HUB_URL / HUB_WEBHOOK_SECRET)." }, 503);

    const hubRes = await fetch(hubUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-hub-secret": hubSecret },
      body: JSON.stringify({ action: "notify", channel: "email", type: "purchase_order", source: "cares-works", to, subject, body: text, html, from_name: orgName, ...(fromEmail ? { from_email: fromEmail } : {}), ...(replyTo ? { reply_to: replyTo } : {}), ...(senderEmail ? { bcc: senderEmail } : {}) }),
    });
    const out = await hubRes.json().catch(() => ({}));
    if (!hubRes.ok || out?.status === "failed") return json({ error: sendFailMessage(out, fromEmail), detail: out }, 502);

    try { await supa.from("invoices").update({ sent_at: new Date().toISOString() }).eq("id", order_id); } catch (_) { /* noop */ }
    return json({ ok: true, id: out?.id, to, bcc: senderEmail || null });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
