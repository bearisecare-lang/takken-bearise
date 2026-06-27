import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let event;
  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook署名検証に失敗:", err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id || (session.metadata && session.metadata.userId);

    if (userId) {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const { error } = await supabase
          .from("profiles")
          .update({ is_paid: true })
          .eq("id", userId);
        if (error) {
          console.error("is_paid更新エラー:", error);
          res.status(500).json({ error: "DB update failed" });
          return;
        }
      } catch (err) {
        console.error("Supabase更新で例外:", err);
        res.status(500).json({ error: "DB update exception" });
        return;
      }
    }
  }

  res.status(200).json({ received: true });
}
