import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN!;
const SQUARE_API_BASE = process.env.SQUARE_ENV === "sandbox"
  ? "https://connect.squareupsandbox.com/v2"
  : "https://connect.squareup.com/v2";
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID!;
const APP_URL = "https://review-pro-ay7x.vercel.app";

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
  const {
    store_name, company_name, owner_name, contact_name,
    email, password, type, place_id,
    plan, billing_cycle = "monthly",
    options = [], referral_code,
    setup_fee, monthly_price, total,
  } = await req.json();

  // 必須チェック
  if (!store_name || !email || !password || !place_id || !plan || !billing_cycle) {
    return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 });
  }

  // メール重複チェック
  const { data: existing } = await supabase
    .from("stores")
    .select("id")
    .eq("email", email)
    .limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "このメールアドレスはすでに登録されています" }, { status: 400 });
  }

  // Supabase Auth ユーザー作成
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !authData?.user) {
    return NextResponse.json({ error: authError?.message || "ユーザー作成失敗" }, { status: 500 });
  }

  const userId = authData.user.id;

  // stores テーブルに登録
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .insert({
      id: userId,
      name: store_name,
      company_name: company_name || null,
      owner_name: owner_name || null,
      contact_name: contact_name || null,
      email,
      type: type || null,
      place_id,
      plan,
      billing_cycle,
      monthly_price,
      setup_fee_paid_amount: setup_fee,
      status: "pending_payment",
            referral_code: referral_code || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (storeError || !store) {
    // Auth ユーザーをロールバック
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: storeError?.message || "店舗登録失敗" }, { status: 500 });
  }

  // Square 決済リンク生成
  const planLabel = `${PLAN_NAMES[plan]}（${BILLING_CYCLE_LABELS[billing_cycle]}）`;
  const lineItems = [];

  // 月額
  lineItems.push({
    name: `${planLabel} 月額`,
    quantity: "1",
    base_price_money: { amount: monthly_price, currency: "JPY" },
  });

  // 初期費用（紹介コードなしの場合）
  if (setup_fee > 0) {
    lineItems.push({
      name: `${planLabel} 導入設定費`,
      quantity: "1",
      base_price_money: { amount: setup_fee, currency: "JPY" },
    });
  }

  try {
    const res = await fetch(`${SQUARE_API_BASE}/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        idempotency_key: `signup-${userId}-${Date.now()}`,
        order: {
          location_id: SQUARE_LOCATION_ID,
          line_items: lineItems,
        },
        checkout_options: {
          redirect_url: `${APP_URL}/admin`,
          ask_for_shipping_address: false,
        },
        pre_populated_data: {
          buyer_email: email,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[Signup] Square error:", data);
      return NextResponse.json({ error: data?.errors?.[0]?.detail || "Square決済リンク生成失敗" }, { status: 500 });
    }

// order_idをSupabaseに保存
const orderId = data?.payment_link?.order_id;
if (orderId) {
  await supabase.from("stores").update({
    square_order_id: orderId,
  }).eq("id", userId);
}

// order_idをSupabaseに保存
    const orderId = data?.payment_link?.order_id;
    if (orderId) {
      await supabase.from("stores").update({
        square_order_id: orderId,
      }).eq("id", userId);
    }
    
    return NextResponse.json({ url: data?.payment_link?.url });

  } catch (err: any) {
    console.error("[Signup] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
