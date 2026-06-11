import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 60% deposit amounts (in cents) per package.
const DEPOSITS = {
  full:     { name: "MARCO RCO Tool — full build deposit (60%)",         amount: 210000 },
  cert:     { name: "MARCO RCO Tool — certification deposit (60%)",       amount: 120000 },
  reviewer: { name: "MARCO RCO Tool — reviewer onboarding deposit (60%)", amount: 72000 },
  conf:     { name: "MARCO RCO Tool — conferences deposit (60%)",         amount: 60000 },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const body = req.body || {};
  const pkg = body.package;
  const origin = body.origin;
  const dep = DEPOSITS[pkg];
  if (!dep) return res.status(400).json({ error: "unknown package" });

  const base = origin || ("https://" + (req.headers.host || "tools.caresmn.com"));

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      allow_promotion_codes: true, // shows an "Add promotion code" field at checkout
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: dep.name },
            unit_amount: dep.amount,
          },
          quantity: 1,
        },
      ],
      metadata: { kind: "marco-deposit", package: pkg },
      success_url: base + "/proposals/marco/?paid=1",
      cancel_url: base + "/proposals/marco/",
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
