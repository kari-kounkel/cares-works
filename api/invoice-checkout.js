import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// invoice-checkout — the "Pay online" button on /inv/<token>.
//
// The browser sends a token and nothing else. The amount, the description and
// the brand all come from the row, read here with the service key: a page that
// could name its own price would be a page anyone could pay $1 on.
//
// Card and bank debit (ACH through Stripe) are both offered. The customer's
// other two lanes — a transfer straight to the bank, or a check — are printed
// on the invoice itself and never touch this endpoint.
//
// GET is a health check, the floridagirl pattern: booleans only, never the key.

const supabase = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method === "GET") {
    const key = process.env.STRIPE_SECRET_KEY || "";
    const out = {
      ok: true,
      endpoint: "invoice-checkout",
      stripe_configured: Boolean(key),
      supabase_configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY),
      mode: key.startsWith("sk_live_") ? "live" : key ? "test" : null,
    };
    if (!key) return res.status(200).json(out);
    try {
      const acct = await new Stripe(key).accounts.retrieve();
      out.key_valid = true;
      out.charges_enabled = acct.charges_enabled === true;
    } catch (err) {
      out.key_valid = false;
      out.key_error = err.type || "auth_failed";
    }
    return res.status(200).json(out);
  }

  if (req.method !== "POST") return res.status(405).end();

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Online payment isn’t switched on yet — please use the bank or check details on the invoice." });
  }

  const token = (req.body || {}).token;
  if (!token) return res.status(400).json({ error: "missing token" });

  const db = supabase();
  const { data: doc, error } = await db
    .from("invoice_docs")
    .select("id, number, purpose, status, total_cents, amount_paid_cents, pay_card, public_token, brand_id")
    .eq("public_token", token)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!doc) return res.status(404).json({ error: "invoice not found" });
  if (doc.status === "draft") return res.status(404).json({ error: "invoice not found" });

  const { data: brand } = await db
    .from("invoice_brands")
    .select("name, stripe_enabled, slug")
    .eq("id", doc.brand_id)
    .maybeSingle();

  if (!doc.pay_card || !brand?.stripe_enabled) {
    return res.status(400).json({ error: "This invoice is set to bank transfer or check." });
  }

  const due = Math.max((doc.total_cents || 0) - (doc.amount_paid_cents || 0), 0);
  if (due <= 0) return res.status(400).json({ error: "This invoice is already paid." });
  if (due < 50) return res.status(400).json({ error: "Amount is below the card minimum." });

  const base = (req.body || {}).origin || ("https://" + (req.headers.host || "tools.caresmn.com"));
  const label = [brand?.name, doc.number ? "Invoice " + doc.number : null].filter(Boolean).join(" — ");

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "us_bank_account"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: label || "Invoice",
            ...(doc.purpose ? { description: String(doc.purpose).slice(0, 500) } : {}),
          },
          unit_amount: due,
        },
        quantity: 1,
      }],
      // The webhook reads these back to mark the right invoice paid, and the
      // Stripe dashboard shows which brand a payment came in under.
      metadata: {
        kind: "invoice-doc",
        invoice_id: doc.id,
        invoice_number: doc.number || "",
        brand: brand?.slug || "",
      },
      success_url: `${base}/inv/${doc.public_token}?paid=1`,
      cancel_url: `${base}/inv/${doc.public_token}`,
    });

    await db.from("invoice_docs").update({ stripe_session_id: session.id, updated_at: new Date().toISOString() }).eq("id", doc.id);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
