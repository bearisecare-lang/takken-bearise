// ===================================================================
// 決済完了Webhook（Vercel Serverless Function）
// Stripeから「決済が完了した」通知を受け取り、Supabaseのis_paidをtrueにする。
// あわせて、購入者のメールアドレス・購入日時・StripeのセッションIDも記録する。
// 必要な環境変数:
//   STRIPE_SECRET_KEY          … Stripeの秘密鍵
//   STRIPE_WEBHOOK_SECRET      … Stripe Webhookの署名シークレット（whsec_...）
//   SUPABASE_URL               … SupabaseのProject URL
//   SUPABASE_SERVICE_ROLE_KEY  … Supabaseのservice_roleキー（秘密。サーバー専用）
// ===================================================================
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Webhookでは生のリクエストボディが必要なので、Vercelの自動JSON解析を無効化
export const config = {
  api: {
    bodyParser: false,
  },
};

// 生のリクエストボディを読み取るヘルパー
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
    // 署名を検証して、本当にStripeからの通知か確認
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

  // 決済が完了したイベントだけを処理
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id || (session.metadata && session.metadata.userId);

    if (userId) {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 購入者のメールアドレスを、取得できる範囲で拾う
        const email =
          session.customer_details?.email ||
          session.customer_email ||
          null;

        // 該当ユーザーのis_paidをtrueにし、購入情報も記録する
        const { error } = await supabase
          .from("profiles")
          .update({
            is_paid: true,
            email: email,
            paid_at: new Date().toISOString(),
            stripe_session_id: session.id,
          })
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

  // Stripeに「受け取りました」と返す
  res.status(200).json({ received: true });
}
