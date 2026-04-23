import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAdminNotification } from "../../../lib/sendAdminNotification";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN!;
const SQUARE_API_BASE = "https://connect.squareup.com/v2";
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID!;
const APP_URL = "https://review-pro-ay7x.vercel.app";

const PLAN_PRICES: Record<string, {
  price: number;
  setupFeeMonthly: number;
  setupFeeYearly: number;
  name: string;
}> = {
  light:    { price: 2980,  setupFeeMonthly: 3000,  setupFeeYearly: 0,     name: "REVIEW PRO ライト" },
  standard: { price: 5980,  setupFeeMonthly: 14800, setupFeeYearly: 9800,  name: "REVIEW PRO スタンダード" },
  premium:  { price: 9800,  setupFeeMonthly: 24800, setupFeeYearly: 19800, name: "REVIEW PRO プレミアム" },
};

const OPTION_PRICES: Record<string, { price: number; name: string }> = {
  low_review_pro: { price: 2980, name: "低評価対策PRO" },
  qr_analytics:   { price: 1980, name: "QRアクセス分析PRO" },
  feedback_list:  { price: 1480, name: "フィードバック一覧" },
  monthly_report: { price: 980,  name: "月次自動レポート" },
};

const REFERRAL_CODES = ["BNI-MEMBER", "0CP"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    company_name, store_name, owner_name, contact_name,
    email, password, type, place_id,
    plan, billing_cycle = "monthly", options = [],
    referral_code, setup_fee, monthly_price, total,
  } = body;

  if (!store_name || !email || !password || !place_id || !plan) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const planInfo = PLAN_PRICES[plan];
  if (!planInfo) {
    return NextResponse.json({ error: "無効なプランです" }, { status: 400 });
  }

  const referralValid = REFERRAL_CODES.includes(referral_code?.toUpperCase());
  const rawSetupFee = billing_cycle === "yearly" ? planInfo.setupFeeYearly : planInfo.setupFeeMonthly;
  const actualSetupFee = referralValid ? 0 : rawSetupFee;

  const optionTotal = options.reduce((sum: number, key: string) => {
    return sum + (OPTION_PRICES[key]?.price || 0);
  }, 0);
  const totalAmount = actualSetupFee + planInfo.price + optionTotal;

  const storeId = type.slice(0, 3).toLowerCase().replace(/[^a-z]/g, "") + "-" + Date.now().toString().slice(-6);

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
      billing_cycle,
      status: "pending_payment",
      setup_fee_paid: 0,
      setup_fee_paid_amount: actualSetupFee,
      setup_fee_paid_plan: plan,
      referral_code: referral_code?.toUpperCase() || null,
      next_billing_date: nextBilling.toISOString().split("T")[0],
      created_at: new Date().toISOString(),
    });

    if (storeError) {
      console.error("[Signup] store insert error:", storeError);
      return NextResponse.json({ error: storeError.message }, { status: 500 });
    }

    await supabase.from("invoices").insert({
      store_id: storeId,
      type: "setup_fee",
      description: `${planInfo.name} 初期費用（${billing_cycle === "yearly" ? "年契約" : "月契約"}）`,
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
        name: `${planInfo.name} 初期費用（${billing_cycle === "yearly" ? "年契約" : "月契約"}）`,
        quantity: "1",
        base_price_money: { amount: actualSetupFee, currency: "JPY" },
      });
    }

    lineItems.push({
      name: `${planInfo.name} 月額（${billing_cycle === "yearly" ? "年契約" : "月契約"}）`,
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

    await supabase.from("stores").update({
      square_payment_link_id: paymentLinkId,
    }).eq("id", storeId);

    await sendAdminNotification({
      subject: "【REVIEW PRO】新規申込がありました（決済前）",
      htmlContent: `
        <h2>新規申込通知</h2>
        <p><strong>店舗名：</strong>${store_name}</p>
        <p><strong>会社名：</strong>${company_name || "未入力"}</p>
        <p><strong>メール：</strong>${email}</p>
        <p><strong>プラン：</strong>${planInfo.name}</p>
        <p><strong>契約タイプ：</strong>${billing_cycle === "yearly" ? "年契約" : "月契約"}</p>
        <p><strong>オプション：</strong>${options.length > 0 ? options.map((o: string) => OPTION_PRICES[o]?.name || o).join("、") : "なし"}</p>
        <p><strong>初期費用：</strong>¥${actualSetupFee.toLocaleString()}</p>
        <p><strong>月額：</strong>¥${(planInfo.price + optionTotal).toLocaleString()}</p>
        <p><strong>初回合計：</strong>¥${totalAmount.toLocaleString()}</p>
        <p><strong>紹介コード：</strong>${referral_code || "なし"}</p>
        <p><strong>申込日時：</strong>${new Date().toLocaleString("ja-JP")}</p>
      `,
    });

    return NextResponse.json({ url: paymentLinkUrl });

  } catch (err: any) {
    console.error("[Signup] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
