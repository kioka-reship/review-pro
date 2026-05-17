import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";
import { requireStoreOwner } from "../../../../lib/auth";

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN!;
const SQUARE_API_BASE = process.env.SQUARE_ENV === "sandbox"
  ? "https://connect.squareupsandbox.com/v2"
  : "https://connect.squareup.com/v2";
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID!;
const APP_URL = "https://review-pro-ay7x.vercel.app";

// 年契約プランの月額（monthly_price が未設定の場合のフォールバック）
const YEARLY_PLAN_PRICES: Record<string, number> = {
  light: 3980,
  standard: 7980,
  premium: 15800,
};

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  const body = await req.json();
  const { store_id, reason } = body;
  if (!store_id) {
    return NextResponse.json({ error: "store_id required" }, { status: 400 });
  }
  const guard = await requireStoreOwner(req, store_id);
  if (guard) return guard;

  // 店舗情報を取得
  const { data: store, error: storeErr } = await supabase
    .from("stores")
    .select("id, name, email, billing_cycle, monthly_price, plan, created_at")
    .eq("id", store_id)
    .single();

  if (storeErr || !store) {
    return NextResponse.json({ error: "店舗情報が見つかりません" }, { status: 404 });
  }

  // 翌月末を解約反映日に設定
  const now = new Date();
  const effectiveDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  // 解約金計算（年契約のみ）
  let cancellationFee = 0;
  let remainingMonths = 0;

  if (store.billing_cycle === "yearly") {
    const createdAt = new Date(store.created_at);
    // 契約開始月から12ヶ月後の末日（年契約終了予定日）
    const contractEndDate = new Date(createdAt.getFullYear(), createdAt.getMonth() + 12, 0);
    // 残月数 = 年契約終了予定日の月 - 解約反映月
    remainingMonths = Math.max(0,
      (contractEndDate.getFullYear() - effectiveDate.getFullYear()) * 12 +
      (contractEndDate.getMonth() - effectiveDate.getMonth())
    );
    const monthlyPrice = store.monthly_price || YEARLY_PLAN_PRICES[store.plan] || 0;
    cancellationFee = remainingMonths * monthlyPrice;
  }

  // 解約申請を保存
  const { error } = await supabase.from("cancellation_requests").insert({
    store_id,
    request_type: "store",
    reason,
    requested_at: now.toISOString(),
    effective_date: effectiveDate.toISOString().split("T")[0],
    status: "pending",
    cancellation_fee: cancellationFee,
    remaining_months: remainingMonths,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ステータスを解約予約に更新
  await supabase.from("stores").update({
    status: "解約予約",
    updated_at: now.toISOString(),
  }).eq("id", store_id);

  // 監査ログ
  await supabase.from("audit_logs").insert({
    store_id,
    actor: "customer",
    action: "cancellation_requested",
    detail: {
      reason,
      effective_date: effectiveDate.toISOString().split("T")[0],
      billing_cycle: store.billing_cycle,
      cancellation_fee: cancellationFee,
      remaining_months: remainingMonths,
    },
  });

  // 年契約かつ解約金が発生する場合はSquare決済リンクを生成
  if (store.billing_cycle === "yearly" && cancellationFee > 0) {
    try {
      const res = await fetch(`${SQUARE_API_BASE}/online-checkout/payment-links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
          "Square-Version": "2024-01-18",
        },
        body: JSON.stringify({
          idempotency_key: `cancel-fee-${store_id}-${Date.now()}`,
          order: {
            location_id: SQUARE_LOCATION_ID,
            line_items: [{
              name: `REVIEW PRO 年契約解約金（残${remainingMonths}ヶ月分）`,
              quantity: "1",
              base_price_money: { amount: cancellationFee, currency: "JPY" },
            }],
          },
          checkout_options: {
            redirect_url: `${APP_URL}/mypage`,
            ask_for_shipping_address: false,
          },
          pre_populated_data: {
            buyer_email: store.email,
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        return NextResponse.json({
          url: data?.payment_link?.url,
          cancellation_fee: cancellationFee,
          remaining_months: remainingMonths,
        });
      }
      console.error("[cancel] Square payment link error:", data);
    } catch (err: any) {
      console.error("[cancel] Square error:", err);
    }
  }

  return NextResponse.json({ success: true });
}
