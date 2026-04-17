import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// Signature検証（セキュリティ）
// ============================================================
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

// ============================================================
// 共通: status更新関数（1店舗のみ更新）
// ============================================================
async function updateStoreStatus(storeId: string, nextStatus: string): Promise<boolean> {
  if (!storeId) return false;
  const { error } = await supabase
    .from("stores")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", storeId);
  if (error) { console.error("[Webhook] updateStoreStatus error:", error); return false; }
  return true;
}

// ============================================================
// 店舗を1件だけ特定（安全設計）
// ============================================================
async function findStoreBySquareId(
  field: "square_customer_id" | "square_subscription_id",
  value: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("id")
    .eq(field, value);

  if (error || !data) return null;
  if (data.length !== 1) return null; // 0件・複数件は更新しない
  return data[0].id;
}

// ============================================================
// Square Webhook受信
// ============================================================
export async function POST(req: NextRequest) {
  const body = await req.text();

  // Signature検証
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

  try {
    switch (eventType) {

      // 決済成功 → 契約中
      case "payment.updated": {
        const payment = data?.payment;
        const customerId = payment?.customer_id;
        if (!customerId) break;

        const storeId = await findStoreBySquareId("square_customer_id", customerId);
        if (!storeId) { console.log("[Webhook] store not found:", customerId); break; }

        if (payment?.status === "COMPLETED") {
          await updateStoreStatus(storeId, "契約中");
          console.log("[Webhook] → 契約中:", storeId);
        }
        break;
      }

      // 請求書支払い完了 → 契約中
      case "invoice.payment_made": {
        const invoice = data?.invoice;
        const subscriptionId = invoice?.subscription_id;
        if (!subscriptionId) break;

        const storeId = await findStoreBySquareId("square_subscription_id", subscriptionId);
        if (!storeId) { console.log("[Webhook] store not found:", subscriptionId); break; }

        await updateStoreStatus(storeId, "契約中");
        console.log("[Webhook] → 契約中（請求書）:", storeId);
        break;
      }

      // 自動課金失敗 → 停止中
      case "invoice.scheduled_charge_failed": {
        const invoice = data?.invoice;
        const subscriptionId = invoice?.subscription_id;
        if (!subscriptionId) break;

        const storeId = await findStoreBySquareId("square_subscription_id", subscriptionId);
        if (!storeId) { console.log("[Webhook] store not found:", subscriptionId); break; }

        await updateStoreStatus(storeId, "停止中");
        console.log("[Webhook] → 停止中（課金失敗）:", storeId);
        break;
      }

      default:
        console.log("[Webhook] unhandled event:", eventType);
    }

    return NextResponse.json({ received: true });

  } catch (err: any) {
    console.error("[Webhook] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
