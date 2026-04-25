import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN!;
const SQUARE_API_BASE = "https://connect.squareup.com/v2";
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID!;
const APP_URL = "https://review-pro-ay7x.vercel.app";

const PLAN_PRICES: Record<string, { price: number; setupFee: number; name: string }> = {
  light:    { price: 2980,  setupFee: 0,     name: "REVIEW PRO ライト" },
  standard: { price: 5980,  setupFee: 9800,  name: "REVIEW PRO スタンダード" },
  premium:  { price: 9800,  setupFee: 19800, name: "REVIEW PRO プレミアム" },
};

const PLAN_ORDER: Record<string, number> = { light: 0, standard: 1, premium: 2 };

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  const { store_id, current_plan, new_plan } = await req.json();

  if (!store_id || !current_plan || !new_plan) {
    return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 });
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, email, setup_fee_paid")
    .eq("id", store_id)
    .single();

  if (!store) return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });

  const isUpgrade = PLAN_ORDER[new_plan] > PLAN_ORDER[current_plan];
  const newPlanInfo = PLAN_PRICES[new_plan];
  const currentPlanInfo = PLAN_PRICES[current_plan];

  if (isUpgrade) {
    // アップグレード：差額を即時決済
    const priceDiff = newPlanInfo.price - currentPlanInfo.price;
    const setupFeeDiff = Math.max(newPlanInfo.setupFee - (store.setup_fee_paid || 0), 0);
    const totalDiff = priceDiff + setupFeeDiff;

    const lineItems = [];
    if (priceDiff > 0) {
      lineItems.push({
        name: `${newPlanInfo.name} アップグレード差額（月額）`,
        quantity: "1",
        base_price_money: { amount: priceDiff, currency: "JPY" },
      });
    }
    if (setupFeeDiff > 0) {
      lineItems.push({
        name: `${newPlanInfo.name} 導入設定費差額`,
        quantity: "1",
        base_price_money: { amount: setupFeeDiff, currency: "JPY" },
      });
    }

    if (lineItems.length === 0) {
      // 差額なしの場合は即時反映
      await supabase.from("stores").update({ plan: new_plan, updated_at: new Date().toISOString() }).eq("id", store_id);
      await supabase.from("audit_logs").insert({ store_id, actor: "customer", action: "plan_upgraded", detail: { from: current_plan, to: new_plan } });
      return NextResponse.json({ success: true });
    }

    // Square決済リンク生成
    const res = await fetch(`${SQUARE_API_BASE}/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        idempotency_key: `upgrade-${store_id}-${new_plan}-${Date.now()}`,
        order: { location_id: SQUARE_LOCATION_ID, line_items: lineItems },
        checkout_options: {
          redirect_url: `${APP_URL}/mypage?upgraded=1`,
          ask_for_shipping_address: false,
        },
        pre_populated_data: { buyer_email: store.email },
      }),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data?.errors?.[0]?.detail || "決済リンク生成失敗" }, { status: 500 });

    // plan_historiesに記録
    await supabase.from("plan_histories").insert({
      store_id,
      changed_by: "customer",
      from_plan: current_plan,
      to_plan: new_plan,
      change_type: "upgrade",
      amount_charged: totalDiff,
      effective_date: new Date().toISOString().split("T")[0],
    });

    return NextResponse.json({ url: data?.payment_link?.url });

  } else {
    // ダウングレード：翌月請求日から反映
    const { data: storeData } = await supabase
      .from("stores")
      .select("next_billing_date")
      .eq("id", store_id)
      .single();

    await supabase.from("stores").update({
      downgrade_scheduled_plan: new_plan,
      downgrade_effective_date: storeData?.next_billing_date,
      updated_at: new Date().toISOString(),
    }).eq("id", store_id);

    await supabase.from("plan_histories").insert({
      store_id,
      changed_by: "customer",
      from_plan: current_plan,
      to_plan: new_plan,
      change_type: "downgrade_scheduled",
      effective_date: storeData?.next_billing_date,
    });

    await supabase.from("audit_logs").insert({
      store_id,
      actor: "customer",
      action: "plan_downgrade_scheduled",
      detail: { from: current_plan, to: new_plan, effective_date: storeData?.next_billing_date },
    });

    return NextResponse.json({ success: true });
  }
}
