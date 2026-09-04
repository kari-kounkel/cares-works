import Stripe from "stripe";

// The Look — Andrea Meythaler's diagnostic engagement.
// Amount in cents. Keep this in step with LOOK_FEE in public/floridagirl/index.html.
const LOOK = {
  name: "The Look — fixed-fee diagnostic (includes your written Findings & Plan)",
  description:
    "One flat fee, no hourly meter. Half is credited against your first month if you " +
    "engage ongoing support within 30 days of delivery. The Findings & Plan is yours to keep either way.",
  amount: 75000, // $750
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Fail loudly and specifically rather than as an opaque 500 in front of a client.
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({
      error: "Checkout isn't configured yet — please text Kari at 651.334.1300.",
    });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = req.body || {};
  const base = body.origin || ("https://" + (req.headers.host || "tools.caresmn.com"));

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      allow_promotion_codes: true, // lets Kari honour the price after the 7-day window
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: LOOK.name, description: LOOK.description },
            unit_amount: LOOK.amount,
          },
          quantity: 1,
        },
      ],
      metadata: { kind: "floridagirl-look", client: "Andrea Meythaler" },
      success_url: base + "/floridagirl/?paid=1",
      cancel_url: base + "/floridagirl/",
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
