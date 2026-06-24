import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Flat reservation deposit, applied toward Maddie's total (in cents).
const DEPOSIT = {
  name: "Tax Recovery Plan — reservation deposit (applied to your total)",
  amount: 10000, // $100
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const body = req.body || {};
  const origin = body.origin || ("https://" + (req.headers.host || "tools.caresmn.com"));

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      allow_promotion_codes: true, // shows an "Add promotion code" field at checkout
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: DEPOSIT.name },
            unit_amount: DEPOSIT.amount,
          },
          quantity: 1,
        },
      ],
      metadata: { kind: "maddie-deposit" },
      success_url: origin + "/proposals/maddie/?paid=1",
      cancel_url: origin + "/proposals/maddie/",
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
