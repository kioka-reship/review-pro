import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// 冪等チェック（同じevent_idは処理しない）
async function isAlreadyProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .single();
  return !!data;
}

// 処理済みとして保存
async function markAsProcessed(eventId: string, eventType: string, payload: any) {
  await supabase.from("webhook_events").insert({
    event_id: eventId,
    event_type: eventType,
    payload,
  });
}

// ステータス更新
async function updateStoreStatus(storeId: string, nextStatus: string) {
  if (!storeId) return false;
  const { error } = await supabase
    .from("stores")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", storeId);
  if (error) { console.error("[Webhook] updateStoreStatus error:", error); return false; }
  return true;
}

// square_customer_id で店舗を1件特定
async function findStoreByCustomerId(customerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("id")
    .eq("square_customer_id", customerId);
  if (error || !data || data.length !== 1) return null;
  return data[0].id;
}

// pending_payment の店舗をメールで特定（新規申込時）
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

// 監査ログ記録
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

  // 冪等チェック
  const alreadyProcessed = await isAlreadyProcessed(eventId);
  if (alreadyProcessed) {
    console.log("[Webhook] already processed, skip:", eventId);
    return NextResponse.json({ received: true, skipped: true });
  }

  try {
    switch (eventType) {

      // 決済成功
      case "payment.updated": {
        const payment = data?.payment;
        if (!payment) break;

        const customerId = payment?.customer_id;
        const buyerEmail = payment?.buyer_email_address;
        const paymentId = payment?.id;

        if (payment?.status === "COMPLETED") {
          // square_customer_id で店舗を特定
          let storeId = customerId
            ? await findStoreByCustomerId(customerId)
            : null;

          // 見つからない場合はemailで仮申込店舗を特定（新規申込）
          if (!storeId && buyerEmail) {
            storeId = await findPendingStoreByEmail(buyerEmail);
          }

          if (!storeId) {
            console.log("[Webhook] store not found for payment:", paymentId);
            break;
          }

          // square_customer_id を保存
          if (customerId) {
            await supabase.from("stores")
              .update({ square_customer_id: customerId })
              .eq("id", storeId);
          }

          // invoicesを更新
          await supabase.from("invoices")
            .update({ status: "paid", paid_at: new Date().toISOString(), square_payment_id: paymentId })
            .eq("store_id", storeId)
            .eq("status", "pending");

          // ステータスをactiveに
          await updateStoreStatus(storeId, "契約中");

          // 監査ログ
          await writeAuditLog(storeId, "payment_completed", { payment_id: paymentId });

          console.log("[Webhook] → 契約中:", storeId);

        } else if (payment?.status === "FAILED") {
          let storeId = customerId
            ? await findStoreByCustomerId(customerId)
            : null;
          if (!storeId && buyerEmail) {
            storeId = await findPendingStoreByEmail(buyerEmail);
          }
          if (!storeId) break;

          await updateStoreStatus(storeId, "停止中");
          await writeAuditLog(storeId, "payment_failed", { payment_id: paymentId });
          console.log("[Webhook] → 停止中:", storeId);
        }
        break;
      }

      // 請求書支払い完了
      case "invoice.payment_made": {
        const invoice = data?.invoice;
        const subscriptionId = invoice?.subscription_id;
        if (!subscriptionId) break;

        const { data: stores } = await supabase
          .from("stores")
          .select("id")
          .eq("square_subscription_id", subscriptionId);
        if (!stores || stores.length !== 1) break;

        const storeId = stores[0].id;
        await updateStoreStatus(storeId, "契約中");
        await writeAuditLog(storeId, "invoice_paid", { subscription_id: subscriptionId });
        console.log("[Webhook] → 契約中（請求書）:", storeId);
        break;
      }

      // 自動課金失敗
      case "invoice.scheduled_charge_failed": {
        const invoice = data?.invoice;
        const subscriptionId = invoice?.subscription_id;
        if (!subscriptionId) break;

        const { data: stores } = await supabase
          .from("stores")
          .select("id")
          .eq("square_subscription_id", subscriptionId);
        if (!stores || stores.length !== 1) break;

        const storeId = stores[0].id;
        await updateStoreStatus(storeId, "停止中");
        await writeAuditLog(storeId, "charge_failed", { subscription_id: subscriptionId });
        console.log("[Webhook] → 停止中（課金失敗）:", storeId);
        break;
      }

      default:
        console.log("[Webhook] unhandled event:", eventType);
    }

    // 処理済みとして保存
    await markAsProcessed(eventId, eventType, payload);
    return NextResponse.json({ received: true });

  } catch (err: any) {
    console.error("[Webhook] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
