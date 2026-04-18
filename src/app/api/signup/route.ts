import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN!;
const SQUARE_API_BASE = "https://connect.squareup.com/v2";
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID!;
const APP_URL = "https://review-pro-ay7x.vercel.app";

const PLAN_PRICES: Record<string, { price: number; setupFee: number; name: string }> = {
  light:    { price: 2980,  setupFee: 0,     name: "REVIEW PRO ライト" },
  standard: { price: 5980,  setupFee: 9800,  name: "REVIEW PRO スタンダード" },
  premium:  { price: 9800,  setupFee: 19800, name: "REVIEW PRO プレミアム" },
};

const OPTION_PRICES: Record<string, { price: number; name: string }> = {
  low_review_pro: { price: 2980, name: "低評価対策PRO" },
  ai_reply:       { price: 1980, name: "AI口コミ自動返信" },
  feedback_list:  { price: 1480, name: "フィードバック一覧" },
  monthly_report: { price: 980,  name: "月次自動レポート" },
};

const REFERRAL_CODES = ["BNI-MEMBER", "0CP"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    company_name, store_name, owner_name, contact_name,
    email, password, type, place_id,
    plan, options = [], referral_code, setup_fee, total,
  } = body;

  // 必須チェック
  if (!store_name || !email || !password || !place_id || !plan) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const planInfo = PLAN_PRICES[plan];
  if (!planInfo) {
    return NextResponse.json({ error: "無効なプランです" }, { status: 400 });
  }

  // 紹介コード判定
  const referralValid = REFERRAL_CODES.includes(referral_code?.toUpperCase());
  const actualSetupFee = referralValid ? 0 : planInfo.setupFee;

  // 合計金額計算
  const optionTotal = options.reduce((sum: number, key: string) => {
    return sum + (OPTION_PRICES[key]?.price || 0);
  }, 0);
  const totalAmount = actualSetupFee + planInfo.price + optionTotal;

  // 店舗IDを生成
  const storeId = type.slice(0, 3).toLowerCase().replace(/[^a-z]/g, "") + "-" + Date.now().toString().slice(-6);

  // 請求日計算
  const now = new Date();
  const day = now.getDate();
  const nextBilling = new Date();
  if (day <= 20) {
    nextBilling.setMonth(nextBilling.getMonth() + 1);
  } else {
    nextBilling.setMonth(nextBilling.getMonth() + 2);
  }
  nextBilling.setDate(5);

  try {
    // storesテーブルに仮申込で保存
    const { error: storeError } = await supabase.from("stores").insert({
      id: storeId,
      name: store_name,
      company_name,
      owner_name,
      contact_name,
      email,
      password,
      type,
      place_id,
      plan,
      status: "pending_payment",
      setup_fee_paid: 0,
      referral_code: referral_code?.toUpperCase() || null,
      next_billing_date: nextBilling.toISOString().split("T")[0],
      created_at: new Date().toISOString(),
    });

    if (storeError) {
      console.error("[Signup] store insert error:", storeError);
      return NextResponse.json({ error: storeError.message }, { status: 500 });
    }

    // invoicesテーブルに記録
    await supabase.from("invoices").insert({
      store_id: storeId,
      type: "setup_fee",
      description: `${planInfo.name} 導入設定費`,
      amount: actualSetupFee,
      status: "pending",
    });

    await supabase.from("invoices").insert({
      store_id: storeId,
      type: "monthly",
      description: `${planInfo.name} 初月月額`,
      amount: planInfo.price + optionTotal,
      status: "pending",
    });

    // consent_logsに同意記録
    await supabase.from("consent_logs").insert({
      store_id: storeId,
      name: owner_name,
      email,
      ip_address: req.headers.get("x-forwarded-for") || "",
      plan,
      options,
      referral_code: referral_code?.toUpperCase() || null,
      terms_version: "1.0",
    });

    // Square決済リンク作成
    const lineItems = [];

    if (actualSetupFee > 0) {
      lineItems.push({
        name: `${planInfo.name} 導入設定費`,
        quantity: "1",
        base_price_money: { amount: actualSetupFee, currency: "JPY" },
      });
    }

    lineItems.push({
      name: `${planInfo.name} 月額`,
      quantity: "1",
      base_price_money: { amount: planInfo.price, currency: "JPY" },
    });

    options.forEach((key: string) => {
      const opt = OPTION_PRICES[key];
      if (opt) {
        lineItems.push({
          name: opt.name,
          quantity: "1",
          base_price_money: { amount: opt.price, currency: "JPY" },
        });
      }
    });

    const res = await fetch(`${SQUARE_API_BASE}/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        idempotency_key: `signup-${storeId}-${Date.now()}`,
        order: {
          location_id: SQUARE_LOCATION_ID,
          line_items: lineItems,
        },
        checkout_options: {
          redirect_url: `${APP_URL}/signup/complete?store_id=${storeId}`,
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
      return NextResponse.json({ error: data?.errors?.[0]?.detail || "決済リンク生成に失敗しました" }, { status: 500 });
    }

    const paymentLinkUrl = data?.payment_link?.url;
    const paymentLinkId = data?.payment_link?.id;

    // 決済リンクIDをstoresに保存
    await supabase.from("stores").update({
      square_payment_link_id: paymentLinkId,
    }).eq("id", storeId);

    return NextResponse.json({ url: paymentLinkUrl });

  } catch (err: any) {
    console.error("[Signup] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
