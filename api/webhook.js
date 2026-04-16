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
};

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (!email) return res.status(400).send("No email in session");

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price?.id;
    const plan = PRICE_PLANS[priceId] || "monthly";
    const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

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
      return res.status(500).send("Database error");
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
    const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    await supabase
      .from("members")
      .update({
        status: subscription.status === "active" ? "active" : subscription.status,
        current_period_end: periodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq("stripe_customer_id", subscription.customer);
  }

  res.status(200).json({ received: true });
}

export const config = {
  api: { bodyParser: false },
};
