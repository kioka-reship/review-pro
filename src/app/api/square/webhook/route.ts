import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { sendEmail, emailTemplates } from "@/lib/sendEmail";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_LABELS: Record<string, string> = {
  light: "ライト ¥2,980/月",
  standard: "スタンダード ¥5,980/月",
  premium: "プレミアム ¥9,800/月",
};

function verifySquareSignature(req: NextRequest, body: string): boolean {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signatureKey) return false;
  const signature = req.headers.get("x-square-hmacsha256-signature");
  if (!signature) return false;
  const url = `https://review-pro-ay7x.vercel.app/api/square/webhook`;
  const hmac = createHmac("sha256", signatureKey);
  hmac.update(url + body);
  const expected = hmac.digest("base64");
  return signature === expected;
}

async function isAlreadyProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .single();
  return !!data;
}

async function markAsProcessed(eventId: string, eventType: string, payload: any) {
  await supabase.from("webhook_events").insert({
    event_id: eventId,
    event_type: eventType,
    payload,
  });
}

async function updateStoreStatus(storeId: string, nextStatus: string) {
  if (!storeId) return false;
  const { error } = await supabase
    .from("stores")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", storeId);
  if (error) { console.error("[Webhook] updateStoreStatus error:", error); return false; }
  return true;
}

async function findStoreByCustomerId(customerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("id")
    .eq("square_customer_id", customerId);
  if (error || !data || data.length !== 1) return null;
  return data[0].id;
}

async function findPendingStoreByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("id")
    .eq("email", email)
    .eq("status", "pending_payment")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return data[0].id;
}

async function writeAuditLog(storeId: string, action: string, detail: any) {
  await supabase.from("audit_logs").insert({
    store_id: storeId,
    actor: "system",
    action,
    detail,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  if (!verifySquareSignature(req, body)) {
    console.error("[Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const eventType = payload?.type;
  const eventId = payload?.event_id;
  const data = payload?.data?.object;

  console.log("[Webhook] received:", eventType, eventId);

  if (!eventId) {
    return NextResponse.json({ error: "event_id missing" }, { status: 400 });
  }

  const alreadyProcessed = await isAlreadyProcessed(eventId);
  if (alreadyProcessed) {
    console.log("[Webhook] already processed, skip:", eventId);
    return NextResponse.json({ received: true, skipped: true });
  }

  try {
    switch (eventType) {

      case "payment.updated": {
        const payment = data?.payment;
        if (!payment) break;

        const customerId = payment?.customer_id;
        const buyerEmail = payment?.buyer_email_address;
        const paymentId = payment?.id;
        const orderId = payment?.order_id;

        if (payment?.status === "COMPLETED") {
          let storeId = customerId ? await findStoreByCustomerId(customerId) : null;
          if (!storeId && buyerEmail) storeId = await findPendingStoreByEmail(buyerEmail);
          if (!storeId) { console.log("[Webhook] store not found:", paymentId); break; }

          // 店舗情報取得
          const { data: store } = await supabase
            .from("stores")
            .select("*")
            .eq("id", storeId)
            .single();

          if (!store) break;

          if (customerId) {
            await supabase.from("stores")
              .update({ square_customer_id: customerId })
              .eq("id", storeId);
          }

          // invoices更新
          await supabase.from("invoices")
            .update({ status: "paid", paid_at: new Date().toISOString(), square_payment_id: paymentId })
            .eq("store_id", storeId)
            .eq("status", "pending");

          // アップグレード決済かどうかチェック
          const { data: planHistory } = await supabase
            .from("plan_histories")
            .select("*")
            .eq("store_id", storeId)
            .eq("change_type", "upgrade")
            .is("square_payment_id", null)
            .order("created_at", { ascending: false })
            .limit(1);

          if (planHistory && planHistory.length > 0) {
            // アップグレード決済成功 → プランを更新
            const history = planHistory[0];
            await supabase.from("stores")
              .update({ plan: history.to_plan, updated_at: new Date().toISOString() })
              .eq("id", storeId);

            await supabase.from("plan_histories")
              .update({ square_payment_id: paymentId })
              .eq("id", history.id);

            await writeAuditLog(storeId, "plan_upgraded", {
              from: history.from_plan,
              to: history.to_plan,
              payment_id: paymentId,
            });

            // アップグレードメール送信
            const tmpl = emailTemplates.upgraded(
              store.name,
              PLAN_LABELS[history.from_plan] || history.from_plan,
              PLAN_LABELS[history.to_plan] || history.to_plan,
              history.amount_charged || 0,
            );
            await sendEmail({ to: store.email, ...tmpl, storeId });
            console.log("[Webhook] → アップグレード完了:", storeId);

          } else if (store.status === "pending_payment") {
            // 新規契約決済成功 → 契約中に
            await updateStoreStatus(storeId, "契約中");
            await writeAuditLog(storeId, "payment_completed", { payment_id: paymentId });

            // ウェルカムメール送信
            const tmpl = emailTemplates.welcome(
              store.name,
              store.email,
              PLAN_LABELS[store.plan] || store.plan,
            );
            await sendEmail({ to: store.email, ...tmpl, storeId });
            console.log("[Webhook] → 契約中（新規）:", storeId);

          } else {
            // OP追加決済成功
            const { data: pendingOption } = await supabase
              .from("option_subscriptions")
              .select("*")
              .eq("store_id", storeId)
              .eq("status", "active")
              .is("square_payment_id", null)
              .order("created_at", { ascending: false })
              .limit(1);

            if (pendingOption && pendingOption.length > 0) {
              const opt = pendingOption[0];
              await supabase.from("option_subscriptions")
                .update({ square_payment_id: paymentId })
                .eq("id", opt.id);

              // OP追加メール送信
              const tmpl = emailTemplates.optionAdded(store.name, opt.option_name, opt.amount);
              await sendEmail({ to: store.email, ...tmpl, storeId });
              console.log("[Webhook] → OP追加完了:", opt.option_name);
            }

            await updateStoreStatus(storeId, "契約中");
            await writeAuditLog(storeId, "payment_completed", { payment_id: paymentId });
          }

        } else if (payment?.status === "FAILED") {
          let storeId = customerId ? await findStoreByCustomerId(customerId) : null;
          if (!storeId && buyerEmail) storeId = await findPendingStoreByEmail(buyerEmail);
          if (!storeId) break;

          await updateStoreStatus(storeId, "停止中");
          await writeAuditLog(storeId, "payment_failed", { payment_id: paymentId });
          console.log("[Webhook] → 停止中:", storeId);
        }
        break;
      }

      case "invoice.payment_made": {
        const invoice = data?.invoice;
        const subscriptionId = invoice?.subscription_id;
        if (!subscriptionId) break;

        const { data: stores } = await supabase
          .from("stores")
          .select("id")
          .eq("square_subscription_id", subscriptionId);
        if (!stores || stores.length !== 1) break;
