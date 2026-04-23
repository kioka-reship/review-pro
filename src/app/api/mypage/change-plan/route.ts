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

// 初期費用テーブル
const SETUP_FEES: Record<string, Record<string, number>> = {
  monthly: { light: 3000, standard: 14800, premium: 24800 },
  yearly:  { light: 0,    standard: 9800,  premium: 19800 },
};

// 月額テーブル
const MONTHLY_PRICES: Record<string, number> = {
  light: 2980, standard: 5980, premium: 9800,
};

const PLAN_RANK: Record<string, number> = {
  light: 1, standard: 2, premium: 3,
};

const PLAN_LABELS: Record<string, string> = {
  light: "ライト", standard: "スタンダード", premium: "プレミアム",
};

export async function POST(req: NextRequest) {
  try {
    const { store_id, to_plan, to_billing_cycle } = await req.json();

    if (!store_id || !to_plan || !to_billing_cycle) {
      return NextResponse.json({ error: "パラメータが不足しています" }, { status: 400 });
    }

    // 現在の契約情報を取得
    const { data: store } = await supabase
      .from("stores")
      .select("*")
      .eq("id", store_id)
      .single();

    if (!store) {
      return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
    }

    const fromPlan = store.plan;
    const fromBillingCycle = store.billing_cycle || "monthly";
    const fromRank = PLAN_RANK[fromPlan] || 1;
    const toRank = PLAN_RANK[to_plan] || 1;

    // 同じプラン・同じ契約タイプなら変更なし
    if (fromPlan === to_plan && fromBillingCycle === to_billing_cycle) {
      return NextResponse.json({ error: "現在と同じプランです" }, { status: 400 });
    }

    // 下位プランへの変更（次回請求日から反映）
    if (toRank < fromRank) {
      await supabase.from("stores").update({
        pending_plan: to_plan,
        pending_billing_cycle: to_billing_cycle,
        updated_at: new Date().toISOString(),
      }).eq("id", store_id);

      await supabase.from("plan_histories").insert({
        store_id,
        from_plan: fromPlan,
        to_plan,
        change_type: "downgrade",
        amount_charged: 0,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        type: "downgrade",
        message: `次回請求日より${PLAN_LABELS[to_plan]}プランに変更されます。`,
      });
    }

    // 上位プランへの変更（差額即時決済）
    const newSetupFee = SETUP_FEES[to_billing_cycle]?.[to_plan] || 0;
    const paidSetupFee = store.setup_fee_paid_amount || 0;
    const diffAmount = Math.max(0, newSetupFee - paidSetupFee);

    // plan_historiesに記録
    await supabase.from("plan_histories").insert({
      store_id,
      from_plan: fromPlan,
      to_plan,
      from_billing_cycle: fromBillingCycle,
      to_billing_cycle,
      change_type: "upgrade",
      amount_charged: diffAmount,
      created_at: new Date().toISOString(),
    });

    // 差額が0円の場合は即時プラン変更
    if (diffAmount === 0) {
      await supabase.from("stores").update({
        plan: to_plan,
        billing_cycle: to_billing_cycle,
        monthly_price: MONTHLY_PRICES[to_plan],
        updated_at: new Date().toISOString(),
      }).eq("id", store_id);

      return NextResponse.json({
        type: "free_upgrade",
        message: `${PLAN_LABELS[to_plan]}プランに変更しました。`,
      });
    }

    // 差額決済リンク作成
    const customerId = store.square_customer_id;
    if (!customerId) {
      return NextResponse.json({ error: "決済情報が見つかりません" }, { status: 400 });
    }

    const res = await fetch(`${SQUARE_API_BASE}/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        idempotency_key: `upgrade-${store_id}-${Date.now()}`,
        order: {
          location_id: SQUARE_LOCATION_ID,
          line_items: [{
            name: `プランアップグレード差額（${PLAN_LABELS[fromPlan]} → ${PLAN_LABELS[to_plan]}）`,
            quantity: "1",
            base_price_money: { amount: diffAmount, currency: "JPY" },
          }],
        },
        checkout_options: {
          redirect_url: `${APP_URL}/mypage?upgrade=success`,
          ask_for_shipping_address: false,
        },
        pre_populated_data: {
          buyer_email: store.email,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[ChangePlan] Square error:", data);
      return NextResponse.json({ error: "決済リンク生成に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({
      type: "upgrade",
      url: data?.payment_link?.url,
      diff_amount: diffAmount,
    });

  } catch (err: any) {
    console.error("[ChangePlan] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
