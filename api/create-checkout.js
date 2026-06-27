import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { userId, email } = req.body || {};
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const appUrl = process.env.APP_URL || "";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      metadata: { userId },
      customer_email: email || undefined,
      success_url: `${appUrl}/?paid=success`,
      cancel_url: `${appUrl}/?paid=cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-checkout error:", err);
    res.status(500).json({ error: "決済ページの作成に失敗しました。" });
  }
}
