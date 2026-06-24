import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Checkout items for the Maddie proposal (amounts in cents).
const ITEMS = {
  // Retainer to begin the recovery work, billed against hours at $150/hr.
  deposit: {
    name: "Tax Recovery Plan — retainer to begin (billed against your hours at $150/hr)",
    amount: 30000, // $300
    paid: "1",
  },
  // Fiancé's W-2 return, done-for-you (Keepstead report fee is separate).
  fiance: {
    name: "Fiancé's W-2 return — completed for you (Keepstead report fee separate)",
    amount: 30000, // $300
    paid: "fiance",
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const body = req.body || {};
  const item = ITEMS[body.item] || ITEMS.deposit;
  const origin = body.origin || ("https://" + (req.headers.host || "tools.caresmn.com"));

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      allow_promotion_codes: true, // shows an "Add promotion code" field at checkout
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: item.name },
            unit_amount: item.amount,
          },
          quantity: 1,
        },
      ],
      metadata: { kind: "maddie-" + (body.item === "fiance" ? "fiance" : "deposit") },
      success_url: origin + "/proposals/maddie/?paid=" + item.paid,
      cancel_url: origin + "/proposals/maddie/",
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
