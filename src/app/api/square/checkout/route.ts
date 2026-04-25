import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN!;
const SQUARE_API_BASE = process.env.SQUARE_ENV === "sandbox"
  ? "https://connect.squareupsandbox.com/v2"
  : "https://connect.squareup.com/v2";

// 月額（billing_cycle別）
const MONTHLY_PRICES: Record<string, Record<string, number>> = {
  monthly: { light: 4980,  standard: 9800,  premium: 19800 },
  yearly:  { light: 3980,  standard: 7980,  premium: 15800 },
};

// 初期費用（月額1ヶ月分と同額）
const SETUP_FEES: Record<string, Record<string, number>> = {
  monthly: { light: 4980,  standard: 9800,  premium: 19800 },
  yearly:  { light: 3980,  standard: 7980,  premium: 15800 },
};

const PLAN_NAMES: Record<string, string> = {
  light:    "REVIEW PRO ライト",
  standard: "REVIEW PRO スタンダード",
  premium:  "REVIEW PRO プレミアム",
};

const BILLING_CYCLE_LABELS: Record<string, string> = {
  monthly: "月契約",
  yearly:  "年契約",
};

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  const { storeId, plan, billing_cycle = "monthly" } = await req.json();

  if (!storeId || !plan) {
    return NextResponse.json({ error: "storeId and plan are required" }, { status: 400 });
  }

  const monthlyPrice = MONTHLY_PRICES[billing_cycle]?.[plan];
  const setupFee = SETUP_FEES[billing_cycle]?.[plan];

  if (!monthlyPrice) {
    return NextResponse.json({ error: "Invalid plan or billing_cycle" }, { status: 400 });
  }

  // 店舗情報を取得
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, name, email")
    .eq("id", storeId)
    .single();

  if (storeError || !store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const planLabel = `${PLAN_NAMES[plan]}（${BILLING_CYCLE_LABELS[billing_cycle]}）`;

  try {
    // 初月 = 月額 + 初期費用（line_itemsを分けて明細表示）
    const lineItems = [
      {
        name: `${planLabel} 月額`,
        quantity: "1",
        base_price_money: { amount: monthlyPrice, currency: "JPY" },
      },
      {
        name: `${planLabel} 導入設定費`,
        quantity: "1",
        base_price_money: { amount: setupFee, currency: "JPY" },
      },
    ];

    const res = await fetch(`${SQUARE_API_BASE}/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        idempotency_key: `${storeId}-${plan}-${billing_cycle}-${Date.now()}`,
        order: {
          location_id: process.env.SQUARE_LOCATION_ID,
          line_items: lineItems,
        },
        checkout_options: {
          redirect_url: `https://review-pro-ay7x.vercel.app/admin`,
          ask_for_shipping_address: false,
        },
        pre_populated_data: {
          buyer_email: store.email,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Checkout] Square error:", data);
      return NextResponse.json({ error: data?.errors?.[0]?.detail || "Square API error" }, { status: 500 });
    }

    const paymentLink = data?.payment_link?.url;
    const paymentLinkId = data?.payment_link?.id;

    await supabase
      .from("stores")
      .update({
        billing_cycle,
        monthly_price: monthlyPrice,
        setup_fee_paid_amount: setupFee,
        setup_fee_paid_plan: plan,
        setup_fee_paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);

    return NextResponse.json({
      url: paymentLink,
      id: paymentLinkId,
      monthly_price: monthlyPrice,
      setup_fee: setupFee,
      total_first_month: monthlyPrice + setupFee,
    });

  } catch (err: any) {
    console.error("[Checkout] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
