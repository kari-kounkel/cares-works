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
    // Caller's JWT flows through, so RLS decides what this user may read.
    const supa = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });

    // Copy the logged-in user (Dave / Betty) on the send, derived from their session.
    const { data: authUser } = await supa.auth.getUser();
    const senderEmail = String(authUser?.user?.email || "").trim();

    const { invoice_id, origin } = await req.json();
    if (!invoice_id) return json({ error: "invoice_id required" }, 400);

    const { data: inv, error } = await supa.from("invoices").select("*").eq("id", invoice_id).single();
    if (error || !inv) return json({ error: "Invoice not found or you don't have access." }, 403);
    if (inv.doc_type === "order") return json({ error: "That's a purchase order, not an invoice." }, 400);

    let to = (inv.customer_email || "").trim();
    if (!to) {
      // Fall back to the customer record's email if the invoice's copy is blank.
      const { data: cust } = await supa.from("ledger_customers").select("email").eq("org_id", inv.org_id).ilike("name", inv.customer_name || "").limit(1).maybeSingle();
      to = (cust?.email || "").trim();
    }
    if (!to) return json({ error: "This customer has no email on file. Add one on the invoice or the Customers screen." }, 400);

    const { data: org } = await supa.from("ledger_orgs").select("name, reply_to_email, from_email").eq("id", inv.org_id).single();
    const orgName = (org?.name || "Your vendor").trim();
    const replyTo = (org?.reply_to_email || "").trim();
    // Send as the org's own address once it's a verified sender; otherwise the hub default.
    const fromEmail = (org?.from_email || "").trim();

    const base = (origin || Deno.env.get("APP_URL") || "").replace(/\/$/, "");
    const link = base + "/i/" + inv.public_token;

    const num = inv.invoice_number ? " No. " + inv.invoice_number : "";
    const subject = "Invoice" + (inv.invoice_number ? " #" + inv.invoice_number : "") + " from " + orgName + " — " + money(inv.total_cents);

    const html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0f172a;line-height:1.6">' +
      "<p>Hi " + esc(inv.customer_name || "there") + ",</p>" +
      "<p>Here’s your invoice from <b>" + esc(orgName) + "</b>" + esc(num) + " for <b>" + money(inv.total_cents) + "</b>.</p>" +
      '<p style="margin:22px 0"><a href="' + link + '" style="display:inline-block;background:#0080ff;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600">View your invoice</a></p>' +
      '<p style="color:#64748b;font-size:13px">Or paste this link into your browser:<br>' + link + "</p>" +
      "<p>Thank you for your business.</p>" +
      '<p style="color:#94a3b8;font-size:12px">Sent securely via CARES Works.</p>' +
      "</div>";

    // Plain-text alternative (also the fallback the hub always sends).
    const text =
      "Hi " + (inv.customer_name || "there") + ",\n\n" +
      "Here's your invoice from " + orgName + num + " for " + money(inv.total_cents) + ".\n\n" +
      "View your invoice: " + link + "\n\n" +
      "Thank you for your business.\n\nSent securely via CARES Works.";

    // Send through the centralized kcocares notification hub (SendGrid lives there).
    const hubUrl = Deno.env.get("HUB_URL");
    const hubSecret = Deno.env.get("HUB_WEBHOOK_SECRET");
    if (!hubUrl || !hubSecret) {
      return json({ error: "Email isn't configured yet (missing HUB_URL / HUB_WEBHOOK_SECRET)." }, 503);
    }

    const hubRes = await fetch(hubUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-hub-secret": hubSecret },
      body: JSON.stringify({
        action: "notify",
        channel: "email",
        type: "invoice",
        source: "cares-works",
        to,
        subject,
        body: text,
        html,
        from_name: orgName,
        ...(fromEmail ? { from_email: fromEmail } : {}),
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(senderEmail ? { bcc: senderEmail } : {}),
      }),
    });
    const out = await hubRes.json().catch(() => ({}));
    if (!hubRes.ok || out?.status === "failed") {
      // Leave the invoice's status alone — nothing went out, so nothing may say it did.
      return json({ error: sendFailMessage(out, fromEmail), detail: out }, 502);
    }

    // Only now is it truly sent. Stamp it (best-effort; ignore if RLS/columns disallow).
    try { await supa.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", invoice_id); } catch (_) { /* noop */ }

    return json({ ok: true, id: out?.id, to, bcc: senderEmail || null });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
