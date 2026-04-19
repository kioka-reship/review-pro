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

export async function POST(req: NextRequest) {
  const { store_id, option_key, option_name, price } = await req.json();

  if (!store_id || !option_key || !price) {
    return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 });
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, email, plan")
    .eq("id", store_id)
    .single();

  if (!store) return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
  if (store.plan !== "standard") return NextResponse.json({ error: "オプションはスタンダードプランのみ追加可能です" }, { status: 403 });

  // 既に契約中か確認
  const { data: existing } = await supabase
    .from("option_subscriptions")
    .select("id")
    .eq("store_id", store_id)
    .eq("option_key", option_key)
    .neq("status", "canceled")
    .single();

  if (existing) return NextResponse.json({ error: "既にこのオプションは契約中です" }, { status: 400 });

  // Square決済リンク生成
  const res = await fetch(`${SQUARE_API_BASE}/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
      "Square-Version": "2024-01-18",
    },
    body: JSON.stringify({
      idempotency_key: `option-${store_id}-${option_key}-${Date.now()}`,
      order: {
        location_id: SQUARE_LOCATION_ID,
        line_items: [{
          name: option_name,
          quantity: "1",
          base_price_money: { amount: price, currency: "JPY" },
        }],
      },
      checkout_options: {
        redirect_url: `${APP_URL}/mypage?option_added=1`,
        ask_for_shipping_address: false,
      },
      pre_populated_data: { buyer_email: store.email },
    }),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data?.errors?.[0]?.detail || "決済リンク生成失敗" }, { status: 500 });

  // option_subscriptionsに仮登録
  await supabase.from("option_subscriptions").insert({
    store_id,
    option_key,
    option_name,
    amount: price,
    status: "active",
  });

  await supabase.from("audit_logs").insert({
    store_id,
    actor: "customer",
    action: "option_added",
    detail: { option_key, option_name, price },
  });

  return NextResponse.json({ url: data?.payment_link?.url });
}
