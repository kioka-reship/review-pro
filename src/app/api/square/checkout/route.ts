import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN!;
const SQUARE_API_BASE = "https://connect.squareup.com/v2";

const PLAN_PRICES: Record<string, { amount: number; name: string; catalogId?: string }> = {
  light:    { amount: 298000, name: "REVIEW PRO ライト（月10件）" },
  standard: { amount: 598000, name: "REVIEW PRO スタンダード（月30件）" },
  premium:  { amount: 980000, name: "REVIEW PRO プレミアム（無制限）" },
};

export async function POST(req: NextRequest) {
  const { storeId, plan } = await req.json();

  if (!storeId || !plan) {
    return NextResponse.json({ error: "storeId and plan are required" }, { status: 400 });
  }

  const planInfo = PLAN_PRICES[plan];
  if (!planInfo) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
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

  try {
    // Square Payment Linkを生成
    const res = await fetch(`${SQUARE_API_BASE}/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        idempotency_key: `${storeId}-${plan}-${Date.now()}`,
        order: {
          location_id: process.env.SQUARE_LOCATION_ID,
          line_items: [
            {
              name: planInfo.name,
              quantity: "1",
              base_price_money: {
                amount: planInfo.amount,
                currency: "JPY",
              },
            },
          ],
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

    // 支払いリンクをSupabaseに保存（任意）
    await supabase
      .from("stores")
      .update({ 
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);

    return NextResponse.json({ 
      url: paymentLink,
      id: paymentLinkId,
    });

  } catch (err: any) {
    console.error("[Checkout] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
