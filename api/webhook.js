import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const PRICE_PLANS = {
  "price_1TJwPREOQJdY217bI1nakAtl": "monthly",
  "price_1TJwROEOQJdY217bxCXVJ6Z6": "annual",
  "price_1TO6PhEOQJdY217bG0GVh53U": "annual",
};

function safeDate(timestamp) {
  if (!timestamp) return null;
  try {
    const d = new Date(timestamp * 1000);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const sig = req.headers["stripe-signature"];
  let event;
  let rawBody = "";

  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => { rawBody += chunk.toString(); });
    req.on("end", resolve);
    req.on("error", reject);
  });

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send("Webhook signature failed: " + err.message);
  }

  // An invoice from the invoice maker, paid by card or bank debit. Bank debits
  // complete asynchronously — the session can come back "completed" while the
  // money is still in flight — so only a paid session marks the invoice paid,
  // and async_payment_succeeded catches the rest days later.
  if (
    (event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded") &&
    event.data.object?.metadata?.kind === "invoice-doc"
  ) {
    const session = event.data.object;
    const invoiceId = session.metadata.invoice_id;
    if (!invoiceId) return res.status(200).json({ received: true, skipped: "no invoice id" });

    if (session.payment_status !== "paid") {
      return res.status(200).json({ received: true, pending: session.payment_status });
    }

    const paid = session.amount_total || 0;

    // What they ACTUALLY paid with, off the charge — not off
    // session.payment_method_types, which lists everything the session offered
    // and so called every card payment a bank debit.
    let method = "online";
    try {
      const intent = await stripe.paymentIntents.retrieve(session.payment_intent, {
        expand: ["latest_charge"],
      });
      const type = intent?.latest_charge?.payment_method_details?.type;
      if (type === "card") method = "card";
      else if (type === "us_bank_account") method = "bank";
      else if (type) method = type;
    } catch (methodErr) {
      console.error("Could not read the payment method:", methodErr.message);
    }
    const { error } = await supabase
      .from("invoice_docs")
      .update({
        status: "paid",
        amount_paid_cents: paid,
        paid_at: new Date().toISOString(),
        paid_method: "stripe-" + method,
        paid_reference: session.payment_intent || session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (error) {
      console.error("Invoice paid update failed:", error);
      return res.status(500).send("Database error: " + error.message);
    }

    // Tell Kari. Stripe's own notification emails don't reach her, so the money
    // landing has to announce itself. Never fatal: the payment is recorded
    // whether or not the note goes out.
    try {
      await fetch(process.env.SUPABASE_URL + "/functions/v1/invoice-paid-notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + process.env.SUPABASE_SERVICE_KEY,
        },
        body: JSON.stringify({
          doc_id: invoiceId,
          method: "stripe-" + method,
          reference: session.payment_intent || session.id,
        }),
      });
    } catch (notifyErr) {
      console.error("Paid notification failed:", notifyErr.message);
    }

    return res.status(200).json({ received: true, invoice: invoiceId });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    // Skip one-time payments (e.g. MARCO proposal deposits); memberships only.
    if (session.mode !== "subscription" && !session.subscription) {
      return res.status(200).json({ received: true, skipped: "non-subscription" });
    }
    const email = session.customer_details?.email;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (!email) return res.status(400).send("No email in session");

    let plan = "monthly";
    let periodEnd = null;

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price?.id;
      plan = PRICE_PLANS[priceId] || "monthly";
      periodEnd = safeDate(subscription.current_period_end);
    } catch (err) {
      console.error("Subscription retrieve error:", err.message);
    }

    const { error } = await supabase.from("members").upsert(
      {
        email,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        plan,
        status: "active",
        started_at: new Date().toISOString(),
        current_period_end: periodEnd,
        cancel_at_period_end: false,
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).send("Database error: " + error.message);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    await supabase
      .from("members")
      .update({ status: "cancelled" })
      .eq("stripe_customer_id", subscription.customer);
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const periodEnd = safeDate(subscription.current_period_end);
    const priceId = subscription.items.data[0]?.price?.id;
    const plan = PRICE_PLANS[priceId] || null;

    const updateData = {
      status: subscription.status === "active" ? "active" : subscription.status,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
    };

    if (plan) updateData.plan = plan;

    const { error } = await supabase
      .from("members")
      .update(updateData)
      .eq("stripe_customer_id", subscription.customer);

    if (error) {
      console.error("Supabase update error:", error);
      return res.status(500).send("Database error: " + error.message);
    }
  }

  res.status(200).json({ received: true });
}

export const config = {
  api: { bodyParser: false },
};
