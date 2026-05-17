import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";
import { sendEmail, emailTemplates } from "../../../../lib/sendEmail";
import { requireStoreOwner } from "../../../../lib/auth";

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN!;
const SQUARE_API_BASE = process.env.SQUARE_ENV === "sandbox"
  ? "https://connect.squareupsandbox.com/v2"
  : "https://connect.squareup.com/v2";
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID!;
const APP_URL = "https://review-pro-ay7x.vercel.app";

const PLAN_PRICES: Record<string, { monthly_price: number; yearly_price: number; setupFee_monthly: number; setupFee_yearly: number; name: string }> = {
  light:    { monthly_price: 4980,  yearly_price: 3980,  setupFee_monthly: 4980,  setupFee_yearly: 3980,  name: "REVIEW PRO ライト" },
  standard: { monthly_price: 9800,  yearly_price: 7980,  setupFee_monthly: 9800,  setupFee_yearly: 7980,  name: "REVIEW PRO スタンダード" },
  premium:  { monthly_price: 19800, yearly_price: 15800, setupFee_monthly: 19800, setupFee_yearly: 15800, name: "REVIEW PRO プレミアム" },
};

const PLAN_ORDER: Record<string, number> = { light: 0, standard: 1, premium: 2 };

const PLAN_LABELS: Record<string, string> = {
  light: "ライト",
  standard: "スタンダード",
  premium: "プレミアム",
};

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  const body = await req.json();
  const { store_id, current_plan, new_plan, billing_cycle = "monthly" } = body;

  if (!store_id || !current_plan || !new_plan) {
    return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 });
  }
  const guard = await requireStoreOwner(req, store_id);
  if (guard) return guard;

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, email, setup_fee_paid")
    .eq("id", store_id)
    .single();

  if (!store) return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });

  const isUpgrade = PLAN_ORDER[new_plan] > PLAN_ORDER[current_plan];
  const newPlanInfo = PLAN_PRICES[new_plan];
  const currentPlanInfo = PLAN_PRICES[current_plan];

  const newPrice = billing_cycle === "yearly" ? newPlanInfo.yearly_price : newPlanInfo.monthly_price;
  const currentPrice = billing_cycle === "yearly" ? currentPlanInfo.yearly_price : currentPlanInfo.monthly_price;
  const newSetupFee = billing_cycle === "yearly" ? newPlanInfo.setupFee_yearly : newPlanInfo.setupFee_monthly;

  if (isUpgrade) {
    const priceDiff = newPrice - currentPrice;
    const setupFeeDiff = Math.max(newSetupFee - (store.setup_fee_paid || 0), 0);
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
      await supabase.from("stores").update({ plan: new_plan, updated_at: new Date().toISOString() }).eq("id", store_id);
      await supabase.from("audit_logs").insert({ store_id, actor: "customer", action: "plan_upgraded", detail: { from: current_plan, to: new_plan } });
      return NextResponse.json({ success: true });
    }

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

    // ダウングレード予約メール送信
    const tmpl = emailTemplates.downgradeScheduled(
      store.name,
      PLAN_LABELS[current_plan] || current_plan,
      PLAN_LABELS[new_plan] || new_plan,
      storeData?.next_billing_date || "次回請求日"
    );
    await sendEmail({ to: store.email, ...tmpl, storeId: store_id });

    return NextResponse.json({ success: true });
  }
}
