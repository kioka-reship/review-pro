import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";
import { createHmac } from "crypto";
import { sendEmail, emailTemplates } from "../../../../lib/sendEmail";
import { sendAdminNotification } from "../../../../lib/sendAdminNotification";
import { appendStoreToSheet } from "../../../../lib/google-sheets";
import { getDefaultQuestionsForType } from "../../../../lib/defaultQuestions";
import {
  BILLING_PROVIDER,
  SQUARE_API_BASE,
  SQUARE_API_VERSION,
  isSquareBillingManaged,
  isSubscriptionRequired,
  logBillingEvent,
  reconcileStoreSubscription,
  updateStoreStatusStrict,
} from "../../../../lib/squareBilling";

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN!;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID!;

const PLAN_LABELS: Record<string, string> = {
  light: "ライト ¥4,980/月",
  standard: "スタンダード ¥9,800/月",
  premium: "プレミアム ¥19,800/月",
};

const PLAN_MONTHLY: Record<string, number> = {
  light: 4980,
  standard: 9800,
  premium: 19800,
};

type SupabaseClient = ReturnType<typeof getAdminClient>;
type WebhookEventStatus = "received" | "processing" | "processed" | "failed";
const PROCESSING_STALE_MS = 10 * 60 * 1000;

function verifySquareSignature(req: NextRequest, body: string): boolean {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim();
  if (!signatureKey) return false;
  const signature = req.headers.get("x-square-hmacsha256-signature")?.trim();
  if (!signature) return false;
  const url = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL?.trim()
    || "https://review-pro-ay7x.vercel.app/api/square/webhook";
  const hmac = createHmac("sha256", signatureKey);
  hmac.update(url + body);
  const expected = hmac.digest("base64");
  const isValid = signature === expected;
  if (!isValid) {
    console.error("[Webhook] Signature mismatch", {
      url,
      receivedLength: signature.length,
      expectedLength: expected.length,
    });
  }
  return isValid;
}

async function getWebhookEvent(supabase: SupabaseClient, eventId: string) {
  const { data, error } = await supabase
    .from("webhook_events")
    .select("event_id, status, attempts, updated_at")
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) throw error;
  return data as { event_id: string; status: WebhookEventStatus; attempts: number | null; updated_at?: string | null } | null;
}

async function markWebhookProcessing(supabase: SupabaseClient, eventId: string, eventType: string, payload: any) {
  const existing = await getWebhookEvent(supabase, eventId);
  if (existing?.status === "processed") return "processed" as const;
  if (existing?.status === "processing") {
    const updatedAt = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
    if (updatedAt && Date.now() - updatedAt < PROCESSING_STALE_MS) return "processing" as const;
  }

  if (existing) {
    const { error } = await supabase
      .from("webhook_events")
      .update({
        event_type: eventType,
        payload,
        status: "processing",
        attempts: (existing.attempts || 0) + 1,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", eventId);
    if (error) throw error;
    return "started" as const;
  }

  const { error } = await supabase.from("webhook_events").insert({
    event_id: eventId,
    event_type: eventType,
    payload,
    status: "processing",
    attempts: 1,
    received_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error?.code === "23505") return "processing" as const;
  if (error) throw error;
  return "started" as const;
}

async function markWebhookProcessed(supabase: SupabaseClient, eventId: string) {
  const { error } = await supabase
    .from("webhook_events")
    .update({
      status: "processed",
      processed_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("event_id", eventId);
  if (error) throw error;
}

async function markWebhookFailed(supabase: SupabaseClient, eventId: string, errorMessage: string) {
  await supabase
    .from("webhook_events")
    .update({
      status: "failed",
      last_error: errorMessage.slice(0, 2000),
      updated_at: new Date().toISOString(),
    })
    .eq("event_id", eventId);
}

async function findStoreByCustomerId(supabase: SupabaseClient, customerId: string): Promise<string | null> {
  const { data, error } = await supabase.from("stores").select("id").eq("square_customer_id", customerId);
  if (error) throw error;
  if (!data || data.length !== 1) return null;
  return data[0].id;
}

async function findPendingStoreByEmail(supabase: SupabaseClient, email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("id")
    .eq("email", email)
    .eq("status", "入金待ち")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  return data[0].id;
}

async function findStoreByOrderId(supabase: SupabaseClient, orderId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("id")
    .eq("square_order_id", orderId)
    .limit(1);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  return data[0].id;
}

async function findStoreBySubscriptionId(supabase: SupabaseClient, subscriptionId: string) {
  const { data, error } = await supabase
    .from("stores")
    .select("id, status, billing_cycle, billing_provider, subscription_id, setup_fee_paid_at")
    .eq("subscription_id", subscriptionId);
  if (error) throw error;
  if (!data || data.length !== 1) return null;
  return data[0] as {
    id: string;
    status: string;
    billing_cycle?: string | null;
    billing_provider?: string | null;
    subscription_id?: string | null;
    setup_fee_paid_at?: string | null;
  };
}

async function updateStoreFieldsStrict(supabase: SupabaseClient, storeId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from("stores")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", storeId);
  if (error) throw new Error(`store update failed: ${error.message}`);
}

async function createSquareSubscription(
  customerId: string,
  storeId: string,
  plan: string,
  billingCycle: string,
  monthlyAmount: number,
): Promise<string> {
  const cardRes = await fetch(`${SQUARE_API_BASE}/cards?customer_id=${customerId}`, {
    headers: {
      "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
      "Square-Version": SQUARE_API_VERSION,
    },
  });
  const cardData = await cardRes.json().catch(() => ({}));
  const cardId = cardData?.cards?.[0]?.id;
  if (!cardRes.ok || !cardId) {
    throw new Error(cardData?.errors?.[0]?.detail || "Square card on file not found");
  }

  const now = new Date();
  const nextBilling = new Date(now.getFullYear(), now.getMonth() + 1, 5);
  const startDate = nextBilling.toISOString().split("T")[0];

  const subRes = await fetch(`${SQUARE_API_BASE}/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
      "Square-Version": SQUARE_API_VERSION,
    },
    body: JSON.stringify({
      // Keep this stable so Square webhook retries after a DB save failure do not create
      // duplicate subscriptions. A future re-contract flow must use a new key namespace.
      idempotency_key: `sub-${storeId}`,
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

  const subData = await subRes.json().catch(() => ({}));
  if (!subRes.ok || !subData?.subscription?.id) {
    throw new Error(subData?.errors?.[0]?.detail || "Square subscription creation failed");
  }

  return subData.subscription.id;
}

async function ensureDefaultQuestions(supabase: SupabaseClient, store: any) {
  try {
    const { data: existingQs } = await supabase
      .from("questions")
      .select("id")
      .eq("store_id", store.id)
      .limit(1);
    if (!existingQs || existingQs.length === 0) {
      const defaultQs = getDefaultQuestionsForType(store.type || "その他");
      await supabase.from("questions").insert(
        defaultQs.map((q, i) => ({
          store_id: store.id,
          order_num: i + 1,
          label: q.label,
          type: q.type,
          options: q.options,
        })),
      );
    }
  } catch (err: any) {
    console.error("[Webhook] default questions failed:", err?.message);
  }
}

async function sendNonCriticalSignupNotifications(supabase: SupabaseClient, store: any, paymentId: string) {
  try {
    const tmpl = emailTemplates.welcome(store.name, store.email, PLAN_LABELS[store.plan] || store.plan, store.id);
    await sendEmail({ to: store.email, ...tmpl, storeId: store.id });
  } catch (err: any) {
    console.error("[Webhook] welcome mail failed:", err?.message);
  }

  try {
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
  } catch (err: any) {
    console.error("[Webhook] admin notification failed:", err?.message);
  }

  try {
    let commissionEnabled: boolean | null = null;
    let commissionRate: number | null = null;
    if (store.referral_id) {
      const { data: rc } = await supabase
        .from("referral_codes")
        .select("commission_enabled, commission_rate")
        .eq("id", store.referral_id)
        .single();
      if (rc) {
        commissionEnabled = rc.commission_enabled;
        commissionRate = rc.commission_rate ?? null;
      }
    }
    await appendStoreToSheet({
      ...store,
      square_payment_id: paymentId,
      commission_enabled: commissionEnabled,
      commission_rate: commissionRate,
    });
    await supabase.from("stores").update({
      sheet_synced_at: new Date().toISOString(),
      sheet_sync_status: "synced",
    }).eq("id", store.id);
  } catch (err: any) {
    console.error("[Webhook] Sheets sync failed:", err?.message);
    await supabase.from("stores").update({ sheet_sync_status: "failed" }).eq("id", store.id);
  }
}

async function handleInitialPaymentCompleted(
  supabase: SupabaseClient,
  store: any,
  customerId: string | undefined,
  paymentId: string,
  eventId: string,
) {
  if (customerId) {
    await updateStoreFieldsStrict(supabase, store.id, {
      billing_provider: BILLING_PROVIDER.SQUARE,
      square_customer_id: customerId,
    });
  }

  const squareManagedStore = { ...store, billing_provider: BILLING_PROVIDER.SQUARE };
  if (isSubscriptionRequired(squareManagedStore)) {
    if (!customerId) {
      await logBillingEvent(supabase, {
        storeId: store.id,
        squareEventId: eventId,
        oldStatus: store.status,
        newStatus: "停止中",
        eventType: "subscription_creation_failed",
        source: "webhook",
        success: false,
        reason: "missing_square_customer_id",
      });
      throw new Error("initial payment completed without square customer id");
    }

    const billingCycle = store.billing_cycle || "monthly";
    const monthlyAmount = store.monthly_price || PLAN_MONTHLY[store.plan] || 4980;
    const subscriptionId = await createSquareSubscription(customerId, store.id, store.plan, billingCycle, monthlyAmount);
    await updateStoreFieldsStrict(supabase, store.id, {
      billing_provider: BILLING_PROVIDER.SQUARE,
      subscription_id: subscriptionId,
      setup_fee_paid_at: new Date().toISOString(),
    });

    await updateStoreStatusStrict(supabase, store.id, "契約中", {
      squareEventId: eventId,
      subscriptionId,
      eventType: "initial_payment_completed",
      source: "webhook",
      details: { payment_id: paymentId },
    });
  } else {
    await updateStoreFieldsStrict(supabase, store.id, { setup_fee_paid_at: new Date().toISOString() });
    await updateStoreStatusStrict(supabase, store.id, "契約中", {
      squareEventId: eventId,
      eventType: "initial_payment_completed",
      source: "webhook",
      details: { payment_id: paymentId, subscription_required: false },
    });
  }

  await supabase.from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString(), square_payment_id: paymentId })
    .eq("store_id", store.id)
    .eq("status", "pending");

  await ensureDefaultQuestions(supabase, store);
  await sendNonCriticalSignupNotifications(supabase, store, paymentId);
}

async function handlePaymentUpdated(supabase: SupabaseClient, data: any, eventId: string) {
  const payment = data?.payment;
  if (!payment) return;

  const customerId = payment?.customer_id;
  const buyerEmail = payment?.buyer_email_address;
  const paymentId = payment?.id;
  const orderId = payment?.order_id;

  let storeId = customerId ? await findStoreByCustomerId(supabase, customerId) : null;
  if (!storeId && buyerEmail) storeId = await findPendingStoreByEmail(supabase, buyerEmail);
  if (!storeId && orderId) storeId = await findStoreByOrderId(supabase, orderId);
  if (!storeId) {
    console.log("[Webhook] store not found:", paymentId);
    return;
  }

  const { data: store, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .single();
  if (error || !store) throw new Error(error?.message || "store not found");

  if (payment?.status === "COMPLETED") {
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
      await updateStoreFieldsStrict(supabase, storeId, { plan: history.to_plan });
      await supabase.from("plan_histories").update({ square_payment_id: paymentId }).eq("id", history.id);
      await logBillingEvent(supabase, {
        storeId,
        squareEventId: eventId,
        subscriptionId: store.subscription_id,
        oldStatus: store.status,
        newStatus: store.status,
        eventType: "plan_upgraded",
        source: "webhook",
        success: true,
        details: { from: history.from_plan, to: history.to_plan, payment_id: paymentId },
      });
      try {
        const tmpl = emailTemplates.upgraded(store.name, PLAN_LABELS[history.from_plan] || history.from_plan, PLAN_LABELS[history.to_plan] || history.to_plan, history.amount_charged || 0);
        await sendEmail({ to: store.email, ...tmpl, storeId });
      } catch (err: any) {
        console.error("[Webhook] upgrade mail failed:", err?.message);
      }
      return;
    }

    if (store.status === "入金待ち") {
      await handleInitialPaymentCompleted(supabase, store, customerId, paymentId, eventId);
      return;
    }

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
      await supabase.from("option_subscriptions").update({ square_payment_id: paymentId }).eq("id", opt.id);
      await logBillingEvent(supabase, {
        storeId,
        squareEventId: eventId,
        subscriptionId: store.subscription_id,
        oldStatus: store.status,
        newStatus: store.status,
        eventType: "option_payment_completed",
        source: "webhook",
        success: true,
        details: { option_key: opt.option_key, payment_id: paymentId },
      });
      try {
        const tmpl = emailTemplates.optionAdded(store.name, opt.option_name, opt.amount);
        await sendEmail({ to: store.email, ...tmpl, storeId });
      } catch (err: any) {
        console.error("[Webhook] option mail failed:", err?.message);
      }
    }
    return;
  }

  if (payment?.status === "FAILED") {
    const isInitialPayment = store.status === "入金待ち" && orderId && store.square_order_id === orderId;
    const failedPaymentType = isInitialPayment ? "initial_payment_failed" : "one_time_or_unknown_payment_failed";
    await logBillingEvent(supabase, {
      storeId,
      squareEventId: eventId,
      subscriptionId: store.subscription_id,
      oldStatus: store.status,
      newStatus: store.status,
      eventType: failedPaymentType,
      source: "webhook",
      success: true,
      reason: isInitialPayment
        ? "initial_checkout_failed_status_unchanged"
        : "payment_updated_failed_does_not_stop_subscription",
      details: { payment_id: paymentId, order_id: orderId || null },
    });
  }
}

async function handleInvoicePaymentMade(supabase: SupabaseClient, data: any, eventId: string) {
  const invoice = data?.invoice;
  const subscriptionId = invoice?.subscription_id;
  if (!subscriptionId) return;

  const store = await findStoreBySubscriptionId(supabase, subscriptionId);
  if (!store) return;
  if (!isSquareBillingManaged(store)) {
    await logBillingEvent(supabase, {
      storeId: store.id,
      squareEventId: eventId,
      subscriptionId,
      oldStatus: store.status,
      newStatus: store.status,
      eventType: "invoice_paid_skipped",
      source: "webhook",
      success: true,
      reason: "billing_provider_not_square",
      details: { billing_provider: store.billing_provider || null },
    });
    return;
  }
  await updateStoreStatusStrict(supabase, store.id, "契約中", {
    squareEventId: eventId,
    subscriptionId,
    eventType: "invoice_paid",
    source: "webhook",
  });
}

async function handleInvoiceScheduledChargeFailed(supabase: SupabaseClient, data: any, eventId: string) {
  const invoice = data?.invoice;
  const subscriptionId = invoice?.subscription_id;
  if (!subscriptionId) return;

  const store = await findStoreBySubscriptionId(supabase, subscriptionId);
  if (!store) return;
  if (!isSquareBillingManaged(store)) {
    await logBillingEvent(supabase, {
      storeId: store.id,
      squareEventId: eventId,
      subscriptionId,
      oldStatus: store.status,
      newStatus: store.status,
      eventType: "charge_failed_skipped",
      source: "webhook",
      success: true,
      reason: "billing_provider_not_square",
      details: { billing_provider: store.billing_provider || null },
    });
    return;
  }
  await updateStoreStatusStrict(supabase, store.id, "停止中", {
    squareEventId: eventId,
    subscriptionId,
    eventType: "charge_failed",
    source: "webhook",
  });
}

async function handleSubscriptionUpdated(supabase: SupabaseClient, data: any, eventId: string, eventType: string) {
  const subscription = data?.subscription;
  const subscriptionId = subscription?.id;
  if (!subscriptionId) return;

  const store = await findStoreBySubscriptionId(supabase, subscriptionId);
  if (!store) return;
  if (!isSquareBillingManaged(store)) {
    await logBillingEvent(supabase, {
      storeId: store.id,
      squareEventId: eventId,
      subscriptionId,
      oldStatus: store.status,
      newStatus: store.status,
      eventType: `${eventType}_skipped`,
      source: "webhook",
      success: true,
      reason: "billing_provider_not_square",
      details: { billing_provider: store.billing_provider || null },
    });
    return;
  }

  const result = await reconcileStoreSubscription(supabase, store, "webhook", eventId);
  if (result.action === "check_failed" && result.reason !== "pending_without_verified_initial_paid_period") {
    throw new Error(`subscription latest status check failed: ${result.reason || "unknown"}`);
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

  if (!eventId) {
    return NextResponse.json({ error: "event_id missing" }, { status: 400 });
  }

  console.log("[Webhook] received:", eventType, eventId);

  try {
    const processingState = await markWebhookProcessing(supabase, eventId, eventType, payload);
    if (processingState === "processed") {
      return NextResponse.json({ received: true, skipped: true });
    }
    if (processingState === "processing") {
      return NextResponse.json({ received: true, skipped: true, reason: "already_processing" });
    }

    switch (eventType) {
      case "payment.updated":
        await handlePaymentUpdated(supabase, data, eventId);
        break;
      case "invoice.payment_made":
        await handleInvoicePaymentMade(supabase, data, eventId);
        break;
      case "invoice.scheduled_charge_failed":
        await handleInvoiceScheduledChargeFailed(supabase, data, eventId);
        break;
      case "subscription.created":
      case "subscription.updated":
        await handleSubscriptionUpdated(supabase, data, eventId, eventType);
        break;
      default:
        console.log("[Webhook] unhandled event:", eventType);
    }

    await markWebhookProcessed(supabase, eventId);
    return NextResponse.json({ received: true });
  } catch (err: any) {
    const message = err?.message || "webhook processing failed";
    console.error("[Webhook] error:", err);
    await markWebhookFailed(supabase, eventId, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
