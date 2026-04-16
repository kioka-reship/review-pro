
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// 共通: status更新関数（1店舗のみ更新）
// ============================================================
async function updateStoreStatus(storeId: string, nextStatus: string): Promise<{ ok: boolean; error?: string }> {
  if (!storeId) return { ok: false, error: "storeId is required" };

  const { error } = await supabase
    .from("stores")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", storeId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ============================================================
// 店舗を1件だけ特定する（安全設計）
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
  if (data.length !== 1) return null; // 0件・複数件は更新しない（安全設計）
  return data[0].id;
}

// ============================================================
// Square Webhook受信
// ============================================================
export async function POST(req: NextRequest) {
  const body = await req.json();

  const eventType = body?.type;
  const data = body?.data?.object;

  console.log("[Webhook] received:", eventType);

  // 冪等性: event_idで重複チェック（将来的にはDBに記録）
  const eventId = body?.event_id;
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
        if (!storeId) {
          console.log("[Webhook] store not found for customer_id:", customerId);
          break;
        }

        if (payment?.status === "COMPLETED") {
          await updateStoreStatus(storeId, "契約中");
          console.log("[Webhook] 契約中 →", storeId);
        }
        break;
      }

      // 請求書支払い完了 → 契約中
      case "invoice.payment_made": {
        const invoice = data?.invoice;
        const subscriptionId = invoice?.subscription_id;
        if (!subscriptionId) break;

        const storeId = await findStoreBySquareId("square_subscription_id", subscriptionId);
        if (!storeId) {
          console.log("[Webhook] store not found for subscription_id:", subscriptionId);
          break;
        }

        await updateStoreStatus(storeId, "契約中");
        console.log("[Webhook] 契約中（請求書支払い）→", storeId);
        break;
      }

      // 自動課金失敗 → 停止中（最重要）
      case "invoice.scheduled_charge_failed": {
        const invoice = data?.invoice;
        const subscriptionId = invoice?.subscription_id;
        if (!subscriptionId) break;

        const storeId = await findStoreBySquareId("square_subscription_id", subscriptionId);
        if (!storeId) {
          console.log("[Webhook] store not found for subscription_id:", subscriptionId);
          break;
        }

        await updateStoreStatus(storeId, "停止中");
        console.log("[Webhook] 停止中（課金失敗）→", storeId);
        break;
      }

      // 未対応イベント
      default:
        console.log("[Webhook] unhandled event:", eventType);
    }

    return NextResponse.json({ received: true });

  } catch (err: any) {
    console.error("[Webhook] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
