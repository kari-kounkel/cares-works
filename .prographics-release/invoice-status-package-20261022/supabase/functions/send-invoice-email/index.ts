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

    const { invoice_id, origin, to: toOverride, request_key } = await req.json();
    if (!invoice_id) return json({ error: "invoice_id required" }, 400);

    let { data: inv, error } = await supa.from("invoices").select("*").eq("id", invoice_id).single();
    if (error || !inv) return json({ error: "Invoice not found or you don't have access." }, 403);
    if (inv.doc_type === "order") return json({ error: "That's a purchase order, not an invoice." }, 400);

    // Recipients: whatever the sender typed in the box wins (one or two addresses, comma or
    // semicolon separated). Only if they left it blank do we fall back to the invoice / the
    // customer record's email.
    const overrideList = String(toOverride || "").split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
    let to = "";
    if (overrideList.length) {
      const bad = overrideList.find((e: string) => !/.+@.+\..+/.test(e));
      if (bad) return json({ error: '"' + bad + '" isn’t a valid email address.' }, 400);
      to = overrideList.join(",");
    } else {
      to = (inv.customer_email || "").trim();
      if (!to) {
        // Fall back to the customer record's email if the invoice's copy is blank.
        const { data: cust } = await supa.from("ledger_customers").select("email").eq("org_id", inv.org_id).ilike("name", inv.customer_name || "").limit(1).maybeSingle();
        to = (cust?.email || "").trim();
      }
      if (!to) return json({ error: "This customer has no email on file. Type one in the send box, or add it on the Customers screen." }, 400);
    }

    const { data: org } = await supa.from("ledger_orgs").select("name, reply_to_email, from_email").eq("id", inv.org_id).single();
    const orgName = (org?.name || "Your vendor").trim();
    const replyTo = (org?.reply_to_email || "").trim();
    // Send as the org's own address once it's a verified sender; otherwise the hub default.
    const fromEmail = (org?.from_email || "").trim();

    const isPG = inv.org_id === "51c83c73-b406-4cfa-9626-b600b3c30236";
    const hubUrl = Deno.env.get("HUB_URL");
    const hubSecret = Deno.env.get("HUB_WEBHOOK_SECRET");
    if (!hubUrl || !hubSecret) return json({ error: "Email isn't configured yet (missing HUB_URL / HUB_WEBHOOK_SECRET).", state: "failed" }, 503);
    const serviceKey = isPG ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") : null;
    if (isPG && !serviceKey) return json({ error: "Invoice delivery acknowledgment is not configured; nothing was sent.", state: "failed" }, 503);
    const requestKey = request_key || crypto.randomUUID();
    let delivery: ((state: string, providerId?: string, message?: string) => Promise<unknown>) | null = null;
    if (isPG) {
      if (!authUser?.user) return json({ error: "Authorized staff sign-in required." }, 401);
      const claimed = await supa.rpc("prographics_invoice_workflow", { operation: "send_claim", invoice_id, payload: { request_key: requestKey, to } });
      if (claimed.error) return json({ error: claimed.error.message }, 409);
      if (claimed.data.state !== "sending") return json({ ...claimed.data, ok: claimed.data.state === "sent", id: claimed.data.provider_id, to, bcc: senderEmail || null }, claimed.data.state === "sent" ? 200 : 409);
      inv = claimed.data.invoice;
      // Claims retain a stable snapshot; a replay must never call the provider twice.
      if (!inv) return json({ error: "Email outcome is still being verified. Do not send again.", state: "unknown" }, 409);
      const server = createClient(supabaseUrl, serviceKey!, { auth: { persistSession: false, autoRefreshToken: false } });
      delivery = async (state, providerId, message) => {
        const ack = await server.rpc("prographics_invoice_delivery_result", { request_key: requestKey, invoice_id, outcome: { state, provider_id: providerId, message } });
        if (ack.error) throw new Error("Provider outcome needs verification; do not resend: " + ack.error.message);
        return ack.data;
      };
    }
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

    const text =
      "Hi " + (inv.customer_name || "there") + ",\n\n" +
      "Here's your invoice from " + orgName + num + " for " + money(inv.total_cents) + ".\n\n" +
      "View your invoice: " + link + "\n\n" +
      "Thank you for your business.\n\nSent securely via CARES Works.";

    let hubRes: Response;
    try { hubRes = await fetch(hubUrl, {
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
    } catch (failure) {
      if (delivery) await delivery("unknown", undefined, "Provider connection ended without a definitive receipt.");
      return json({ error: "Delivery outcome is unknown. It needs verification before another send.", state: "unknown" }, 502);
    }
    const out = await hubRes.json().catch(() => ({}));
    if (!hubRes.ok || out?.status === "failed") {
      // A server failure can occur after acceptance. Only explicit rejection is safe to retry.
      const definitive = out?.status === "failed" || (hubRes.status >= 400 && hubRes.status < 500);
      const state = definitive ? "failed" : "unknown";
      if (delivery) await delivery(state, undefined, JSON.stringify(out));
      return json({ error: definitive ? sendFailMessage(out, fromEmail) : "Email outcome needs verification before another send.", detail: out, state }, 502);
    }

    if (delivery) {
      if (!out?.id) { await delivery("unknown", undefined, "Provider response has no receipt identity."); return json({ error: "Provider response has no receipt. Verify delivery before resending.", state: "unknown" }, 502); }
      await delivery("sent", String(out.id));
      return json({ ok: true, state: "sent", id: out.id, to, bcc: senderEmail || null });
    }
    try { await supa.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", invoice_id); } catch (_) { /* noop */ }

    return json({ ok: true, id: out?.id, to, bcc: senderEmail || null });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

