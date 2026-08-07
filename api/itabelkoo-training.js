import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ITA BEL KOO DAC — Office Skills & Workplace Systems Training
// Flat series rate $179 · Invoice #2026080713
export default async function handler(req, res) {
  const base = "https://" + (req.headers.host || "tools.caresmn.com");

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Office Skills & Workplace Systems Training — 3-session series (Invoice #2026080713)",
              description: "ITA BEL KOO DAC · Fridays Aug 7, 14 & 21, 2026 · CARES Consulting Inc",
            },
            unit_amount: 17900,
          },
          quantity: 1,
        },
      ],
      metadata: { kind: "itabelkoo-training", invoice: "2026080713" },
      success_url: base + "/proposals/itabelkoo/?paid=1",
      cancel_url: base + "/proposals/itabelkoo/invoice.html",
    });

    // Visiting the link directly sends you straight into Stripe Checkout.
    if (req.method === "GET") {
      res.writeHead(302, { Location: session.url });
      return res.end();
    }
    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
