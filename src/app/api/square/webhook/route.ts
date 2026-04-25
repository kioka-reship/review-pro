import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";
import { createHmac } from "crypto";
import { sendEmail, emailTemplates } from "../../../../lib/sendEmail";
import { sendAdminNotification } from "../../../../lib/sendAdminNotification";

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN!;
const SQUARE_API_BASE = process.env.SQUARE_ENV === "sandbox"
  ? "https://connect.squareupsandbox.com/v2"
  : "https://connect.squareup.com/v2";
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID!;

const PLAN_LABELS: Record<string, string> = {
  light:    "ライト ¥4,980/月",
  standard: "スタンダード ¥9,800/月",
  premium:  "プレミアム ¥19,800/月",
};

const PLAN_MONTHLY: Record<string, number> = {
  light: 4980, standard: 9800, premium: 19800,
};

function verifySquareSignature(req: NextRequest, body: string): boolean {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signatureKey) return false;
  const signature = req.headers.get("x-square-hmacsha256-signature");
  if (!signature) return false;
  const url = `https://review-pro-ay7x.vercel.app/api/square/webhook`;
  const hmac = createHmac("sha256", signatureKey);
  hmac.update(url + body);
  const expected = hmac.digest("base64");
  return signature === expected;
}

type SupabaseClient = ReturnType<typeof getAdminClient>;

async function isAlreadyProcessed(supabase: SupabaseClient, eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .single();
  return !!data;
}

async function markAsProcessed(supabase: SupabaseClient, eventId: string, eventType: string, payload: any) {
  await supabase.from("webhook_events").insert({
    event_id: eventId,
    event_type: eventType,
    payload,
  });
}

async function updateStoreStatus(supabase: SupabaseClient, storeId: string, nextStatus: string) {
  if (!storeId) return false;
  const { error } = await supabase
    .from("stores")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", storeId);
  if (error) { console.error("[Webhook] updateStoreStatus error:", error); return false; }
  return true;
}

async function findStoreByCustomerId(supabase: SupabaseClient, customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from("stores")
    .select("id")
    .eq("square_customer_id", customerId);
  if (!data || data.length !== 1) return null;
  return data[0].id;
}

async function findPendingStoreByEmail(supabase: SupabaseClient, email: string): Promise<string | null> {
  const { data } = await supabase
    .from("stores")
    .select("id")
    .eq("email", email)
    .eq("status", "pending_payment")
    .order("created_at", { ascending: false })
    .limit(1);
  if (!data || data.length === 0) return null;
  return data[0].id;
}

async function findStoreByOrderId(supabase: SupabaseClient, orderId: string): Promise<string | null> {
  const { data } = await supabase
    .from("stores")
    .select("id")
    .eq("square_order_id", orderId)
    .limit(1);
  if (!data || data.length === 0) return null;
  return data[0].id;
}

async function writeAuditLog(supabase: SupabaseClient, storeId: string, action: string, detail: any) {
  await supabase.from("audit_logs").insert({
    store_id: storeId,
    actor: "system",
    action,
    detail,
  });
}

async function createSquareSubscription(
  customerId: string,
  storeId: string,
  plan: string,
  billingCycle: string,
  monthlyAmount: number
): Promise<string | null> {
  try {
    const cardRes = await fetch(`${SQUARE_API_BASE}/cards?customer_id=${customerId}`, {
      headers: {
        "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Square-Version": "2024-01-18",
      },
    });
    const cardData = await cardRes.json();
    const cardId = cardData?.cards?.[0]?.id;
    if (!cardId) {
      console.error("[Webhook] カードが見つかりません:", customerId);
      return null;
    }

    const now = new Date();
    const nextBilling = new Date(now.getFullYear(), now.getMonth() + 1, 5);
    const startDate = nextBilling.toISOString().split("T")[0];

    const subRes = await fetch(`${SQUARE_API_BASE}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        idempotency_key: `sub-${storeId}-${Date.now()}`,
        location_id: SQUARE_LOCATION_ID,
        customer_id: customerId,
        card_id: cardId,
        start_date: startDate,
        phases: [{
          ordinal: 0,
          order_template: {
            location_id: SQUARE_LOCATION_ID,
            line_items: [{
              name: `${PLAN_LABELS[plan] || plan}（${billingCycle === "yearly" ? "年契約" : "月契約"}）`,
              quantity: "1",
              base_price_money: { amount: monthlyAmount, currency: "JPY" },
            }],
          },
        }],
      }),
    });

    const subData = await subRes.json();
    if (!subRes.ok) {
      console.error("[Webhook] サブスク作成失敗:", subData);
      return null;
    }

    return subData?.subscription?.id || null;
  } catch (err) {
    console.error("[Webhook] createSquareSubscription error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  const body = await req.text();

  if (!verifySquareSignature(req, body)) {
    console.error("[Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const eventType = payload?.type;
  const eventId = payload?.event_id;
  const data = payload?.data?.object;

  console.log("[Webhook] received:", eventType, eventId);

  if (!eventId) {
    return NextResponse.json({ error: "event_id missing" }, { status: 400 });
  }

  const alreadyProcessed = await isAlreadyProcessed(supabase, eventId);
  if (alreadyProcessed) {
    console.log("[Webhook] already processed, skip:", eventId);
    return NextResponse.json({ received: true, skipped: true });
  }

  try {
    switch (eventType) {

      case "payment.updated": {
        const payment = data?.payment;
        if (!payment) break;

        const customerId = payment?.customer_id;
        const buyerEmail = payment?.buyer_email_address;
        const paymentId = payment?.id;
        const orderId = payment?.order_id;

        if (payment?.status === "COMPLETED") {
          let storeId = customerId ? await findStoreByCustomerId(supabase, customerId) : null;
          if (!storeId && buyerEmail) storeId = await findPendingStoreByEmail(supabase, buyerEmail);
          if (!storeId && orderId) storeId = await findStoreByOrderId(supabase, orderId);
          if (!storeId) { console.log("[Webhook] store not found:", paymentId); break; }

          const { data: store } = await supabase
            .from("stores")
            .select("*")
            .eq("id", storeId)
            .single();
          if (!store) break;

          if (customerId) {
            await supabase.from("stores")
              .update({ square_customer_id: customerId })
              .eq("id", storeId);
          }

          await supabase.from("invoices")
            .update({ status: "paid", paid_at: new Date().toISOString(), square_payment_id: paymentId })
            .eq("store_id", storeId)
            .eq("status", "pending");

          const { data: planHistory } = await supabase
            .from("plan_histories")
            .select("*")
            .eq("store_id", storeId)
            .eq("change_type", "upgrade")
            .is("square_payment_id", null)
            .order("created_at", { ascending: false })
            .limit(1);

          if (planHistory && planHistory.length > 0) {
            const history = planHistory[0];
            await supabase.from("stores")
              .update({ plan: history.to_plan, updated_at: new Date().toISOString() })
              .eq("id", storeId);
            await supabase.from("plan_histories")
              .update({ square_payment_id: paymentId })
              .eq("id", history.id);
            await writeAuditLog(supabase, storeId, "plan_upgraded", { from: history.from_plan, to: history.to_plan, payment_id: paymentId });
            const tmpl = emailTemplates.upgraded(store.name, PLAN_LABELS[history.from_plan] || history.from_plan, PLAN_LABELS[history.to_plan] || history.to_plan, history.amount_charged || 0);
            await sendEmail({ to: store.email, ...tmpl, storeId });
            console.log("[Webhook] → アップグレード完了:", storeId);

          } else if (store.status === "pending_payment") {
            const now = new Date().toISOString();

            await supabase.from("stores").update({
              setup_fee_paid_at: now,
            }).eq("id", storeId);

            await updateStoreStatus(supabase, storeId, "契約中");
            await writeAuditLog(supabase, storeId, "payment_completed", { payment_id: paymentId });

            if (customerId) {
              const billingCycle = store.billing_cycle || "monthly";
              const monthlyAmount = store.monthly_price || PLAN_MONTHLY[store.plan] || 4980;
              const subscriptionId = await createSquareSubscription(
                customerId, storeId, store.plan, billingCycle, monthlyAmount
              );
              if (subscriptionId) {
                await supabase.from("stores").update({
                  subscription_id: subscriptionId,
                }).eq("id", storeId);
                console.log("[Webhook] → サブスク登録完了:", subscriptionId);
              }
            }

            const tmpl = emailTemplates.welcome(store.name, store.email, PLAN_LABELS[store.plan] || store.plan, storeId);
            await sendEmail({ to: store.email, ...tmpl, storeId });
            console.log("[Webhook] → 契約中（新規）:", storeId);

            await sendAdminNotification({
              subject: "【REVIEW PRO】新規申込がありました",
              htmlContent: `
                <h2>新規申込通知</h2>
                <p><strong>店舗名：</strong>${store.name}</p>
                <p><strong>メール：</strong>${store.email}</p>
                <p><strong>プラン：</strong>${PLAN_LABELS[store.plan] || store.plan}</p>
                <p><strong>契約タイプ：</strong>${store.billing_cycle === "yearly" ? "年契約" : "月契約"}</p>
                <p><strong>申込日時：</strong>${new Date().toLocaleString("ja-JP")}</p>
              `,
            });

          } else {
            const { data: pendingOption } = await supabase
              .from("option_subscriptions")
              .select("*")
              .eq("store_id", storeId)
              .eq("status", "active")
              .is("square_payment_id", null)
              .order("created_at", { ascending: false })
              .limit(1);

            if (pendingOption && pendingOption.length > 0) {
              const opt = pendingOption[0];
              await supabase.from("option_subscriptions")
                .update({ square_payment_id: paymentId })
                .eq("id", opt.id);
              const tmpl = emailTemplates.optionAdded(store.name, opt.option_name, opt.amount);
              await sendEmail({ to: store.email, ...tmpl, storeId });
              console.log("[Webhook] → OP追加完了:", opt.option_name);
            }

            await updateStoreStatus(supabase, storeId, "契約中");
            await writeAuditLog(supabase, storeId, "payment_completed", { payment_id: paymentId });
          }

        } else if (payment?.status === "FAILED") {
          let storeId = customerId ? await findStoreByCustomerId(supabase, customerId) : null;
          if (!storeId && buyerEmail) storeId = await findPendingStoreByEmail(supabase, buyerEmail);
          if (!storeId && orderId) storeId = await findStoreByOrderId(supabase, orderId);
          if (!storeId) break;
          await updateStoreStatus(supabase, storeId, "停止中");
          await writeAuditLog(supabase, storeId, "payment_failed", { payment_id: paymentId });
          console.log("[Webhook] → 停止中:", storeId);
        }
        break;
      }

      case "invoice.payment_made": {
        const invoice = data?.invoice;
        const subscriptionId = invoice?.subscription_id;
        if (!subscriptionId) break;
        const { data: stores } = await supabase
          .from("stores")
          .select("id")
          .eq("subscription_id", subscriptionId);
        if (!stores || stores.length !== 1) break;
        const storeId = stores[0].id;
        await updateStoreStatus(supabase, storeId, "契約中");
        await writeAuditLog(supabase, storeId, "invoice_paid", { subscription_id: subscriptionId });
        console.log("[Webhook] → 契約中（請求書）:", storeId);
        break;
      }

      case "invoice.scheduled_charge_failed": {
        const invoice = data?.invoice;
        const subscriptionId = invoice?.subscription_id;
        if (!subscriptionId) break;
        const { data: stores } = await supabase
          .from("stores")
          .select("id")
          .eq("subscription_id", subscriptionId);
        if (!stores || stores.length !== 1) break;
        const storeId = stores[0].id;
        await updateStoreStatus(supabase, storeId, "停止中");
        await writeAuditLog(supabase, storeId, "charge_failed", { subscription_id: subscriptionId });
        console.log("[Webhook] → 停止中（課金失敗）:", storeId);
        break;
      }

      default:
        console.log("[Webhook] unhandled event:", eventType);
    }

    await markAsProcessed(supabase, eventId, eventType, payload);
    return NextResponse.json({ received: true });

  } catch (err: any) {
    console.error("[Webhook] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
