import type { SupabaseClient } from "@supabase/supabase-js";

export const SQUARE_API_VERSION = "2024-01-18";

export const SQUARE_API_BASE = process.env.SQUARE_ENV === "sandbox"
  ? "https://connect.squareupsandbox.com/v2"
  : "https://connect.squareup.com/v2";

export type ReviewProBillingStatus = "契約中" | "入金待ち" | "停止中" | "仮申込" | "解約予約" | "解約済";

export type SquareSubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "CANCELED"
  | "DEACTIVATED"
  | "PAUSED"
  | "COMPLETED"
  | string;

export type BillingStatusSource = "webhook" | "sync" | "signup";

export type BillingLogParams = {
  storeId?: string | null;
  squareEventId?: string | null;
  subscriptionId?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  eventType: string;
  source: BillingStatusSource;
  success: boolean;
  reason?: string | null;
  details?: Record<string, unknown>;
};

export type SquareSubscription = {
  id: string;
  status?: SquareSubscriptionStatus;
  customer_id?: string;
  start_date?: string;
  canceled_date?: string;
  charged_through_date?: string;
  paid_until_date?: string;
  invoice_ids?: string[];
};

export type SquareInvoiceStatus =
  | "DRAFT"
  | "UNPAID"
  | "SCHEDULED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "CANCELED"
  | "FAILED"
  | "PAYMENT_PENDING"
  | string;

export type SquareInvoice = {
  id: string;
  status?: SquareInvoiceStatus;
  subscription_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SyncResult = {
  storeId: string;
  subscriptionId: string | null;
  oldStatus: string | null;
  newStatus: ReviewProBillingStatus | null;
  squareStatus: SquareSubscriptionStatus | null;
  action: "updated" | "unchanged" | "missing_subscription_id" | "square_not_found" | "check_failed" | "skipped";
  reason?: string;
};

export function isSubscriptionRequired(store: { billing_cycle?: string | null }) {
  // Current checkout creates the first payment separately, then uses Square Subscriptions
  // for ongoing monthly billing for both monthly and yearly contract pricing.
  return store.billing_cycle === "monthly" || store.billing_cycle === "yearly" || !store.billing_cycle;
}

export function mapSquareSubscriptionStatus(status?: SquareSubscriptionStatus | null): ReviewProBillingStatus | null {
  switch (status) {
    case "ACTIVE":
      return "契約中";
    case "PAUSED":
    case "DEACTIVATED":
      return "停止中";
    case "CANCELED":
    case "COMPLETED":
      return "解約済";
    default:
      return null;
  }
}

function isFutureOrTodayDate(value?: string | null) {
  if (!value) return false;
  const today = new Date().toISOString().split("T")[0];
  return value >= today;
}

export function mapSquareSubscriptionToReviewProStatus(
  subscription: SquareSubscription,
  store: { status?: string | null; setup_fee_paid_at?: string | null },
  latestInvoice?: SquareInvoice | null,
): ReviewProBillingStatus | null {
  if (subscription.status === "PENDING") {
    // Square Subscriptions can stay PENDING until the future start_date. In Review Pro,
    // this is valid only after the first checkout payment has completed and the store is
    // already active. Do not use PENDING by itself to revive an inactive store.
    if (store.status === "契約中" && store.setup_fee_paid_at && isFutureOrTodayDate(subscription.start_date)) {
      return "契約中";
    }
    return null;
  }

  const subscriptionStatus = mapSquareSubscriptionStatus(subscription.status);
  if (subscriptionStatus !== "契約中") return subscriptionStatus;

  if (!latestInvoice) return null;
  switch (latestInvoice.status) {
    case "PAID":
    case "PARTIALLY_REFUNDED":
      return "契約中";
    case "UNPAID":
    case "SCHEDULED":
    case "PARTIALLY_PAID":
    case "REFUNDED":
    case "CANCELED":
    case "FAILED":
    case "PAYMENT_PENDING":
      return "停止中";
    default:
      return null;
  }
}

export async function logBillingEvent(supabase: SupabaseClient, params: BillingLogParams) {
  const detail = {
    ...(params.details || {}),
    square_event_id: params.squareEventId ?? null,
    subscription_id: params.subscriptionId ?? null,
    old_status: params.oldStatus ?? null,
    new_status: params.newStatus ?? null,
    success: params.success,
    reason: params.reason ?? null,
  };

  if (params.storeId) {
    await supabase.from("audit_logs").insert({
      store_id: params.storeId,
      actor: "system",
      action: params.eventType,
      detail,
    });
  }

  await supabase.from("billing_event_logs").insert({
    store_id: params.storeId ?? null,
    square_event_id: params.squareEventId ?? null,
    subscription_id: params.subscriptionId ?? null,
    old_status: params.oldStatus ?? null,
    new_status: params.newStatus ?? null,
    event_type: params.eventType,
    source: params.source,
    success: params.success,
    reason: params.reason ?? null,
    detail,
  });
}

export async function updateStoreStatusStrict(
  supabase: SupabaseClient,
  storeId: string,
  nextStatus: ReviewProBillingStatus,
  logParams: Omit<BillingLogParams, "storeId" | "oldStatus" | "newStatus" | "success">,
) {
  const { data: store, error: fetchError } = await supabase
    .from("stores")
    .select("id, status")
    .eq("id", storeId)
    .single();

  if (fetchError || !store) {
    const reason = fetchError?.message || "store_not_found";
    await logBillingEvent(supabase, {
      ...logParams,
      storeId,
      oldStatus: null,
      newStatus: nextStatus,
      success: false,
      reason,
    });
    throw new Error(`store status fetch failed: ${reason}`);
  }

  if (store.status === nextStatus) {
    await logBillingEvent(supabase, {
      ...logParams,
      storeId,
      oldStatus: store.status,
      newStatus: nextStatus,
      success: true,
      reason: "unchanged",
    });
    return;
  }

  const { error: updateError } = await supabase
    .from("stores")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", storeId);

  if (updateError) {
    await logBillingEvent(supabase, {
      ...logParams,
      storeId,
      oldStatus: store.status,
      newStatus: nextStatus,
      success: false,
      reason: updateError.message,
    });
    throw new Error(`store status update failed: ${updateError.message}`);
  }

  await logBillingEvent(supabase, {
    ...logParams,
    storeId,
    oldStatus: store.status,
    newStatus: nextStatus,
    success: true,
  });
}

export async function retrieveSquareSubscription(subscriptionId: string): Promise<SquareSubscription> {
  const res = await fetch(`${SQUARE_API_BASE}/subscriptions/${subscriptionId}`, {
    headers: {
      "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      "Square-Version": SQUARE_API_VERSION,
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = body?.errors?.[0]?.code || res.status;
    const message = body?.errors?.[0]?.detail || body?.errors?.[0]?.code || "Square subscription retrieve failed";
    const error = new Error(`${code}: ${message}`);
    (error as any).status = res.status;
    throw error;
  }

  if (!body?.subscription?.id) {
    throw new Error("Square subscription response missing subscription");
  }

  return body.subscription;
}

export async function retrieveSquareInvoice(invoiceId: string): Promise<SquareInvoice> {
  const res = await fetch(`${SQUARE_API_BASE}/invoices/${invoiceId}`, {
    headers: {
      "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      "Square-Version": SQUARE_API_VERSION,
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = body?.errors?.[0]?.code || res.status;
    const message = body?.errors?.[0]?.detail || body?.errors?.[0]?.code || "Square invoice retrieve failed";
    const error = new Error(`${code}: ${message}`);
    (error as any).status = res.status;
    throw error;
  }

  if (!body?.invoice?.id) {
    throw new Error("Square invoice response missing invoice");
  }

  return body.invoice;
}

async function retrieveLatestSubscriptionInvoice(subscription: SquareSubscription): Promise<SquareInvoice | null> {
  const latestInvoiceId = subscription.invoice_ids?.[0];
  if (!latestInvoiceId) return null;
  const invoice = await retrieveSquareInvoice(latestInvoiceId);
  if (invoice.subscription_id && invoice.subscription_id !== subscription.id) {
    throw new Error("latest invoice subscription_id mismatch");
  }
  return invoice;
}

export async function reconcileStoreSubscription(
  supabase: SupabaseClient,
  store: {
    id: string;
    status: string | null;
    billing_cycle?: string | null;
    subscription_id?: string | null;
    setup_fee_paid_at?: string | null;
  },
  source: BillingStatusSource,
  squareEventId?: string | null,
): Promise<SyncResult> {
  if (!isSubscriptionRequired(store)) {
    return {
      storeId: store.id,
      subscriptionId: store.subscription_id || null,
      oldStatus: store.status,
      newStatus: null,
      squareStatus: null,
      action: "skipped",
      reason: "subscription_not_required",
    };
  }

  if (!store.subscription_id) {
    if (store.status === "契約中") {
      await updateStoreStatusStrict(supabase, store.id, "停止中", {
        squareEventId,
        subscriptionId: null,
        eventType: "subscription_missing",
        source,
        details: { reason: "active_store_missing_subscription_id" },
      });
    }

    await logBillingEvent(supabase, {
      storeId: store.id,
      squareEventId,
      subscriptionId: null,
      oldStatus: store.status,
      newStatus: "停止中",
      eventType: "subscription_missing",
      source,
      success: false,
      reason: "active_store_missing_subscription_id",
    });
    return {
      storeId: store.id,
      subscriptionId: null,
      oldStatus: store.status,
      newStatus: "停止中",
      squareStatus: null,
      action: "missing_subscription_id",
      reason: "active_store_missing_subscription_id",
    };
  }

  try {
    const subscription = await retrieveSquareSubscription(store.subscription_id);
    const latestInvoice = subscription.status === "ACTIVE"
      ? await retrieveLatestSubscriptionInvoice(subscription)
      : null;
    const nextStatus = mapSquareSubscriptionToReviewProStatus(subscription, store, latestInvoice);

    if (!nextStatus) {
      const reason =
        subscription.status === "PENDING" ? "pending_without_verified_initial_paid_period" :
        subscription.status === "ACTIVE" && !latestInvoice ? "active_subscription_without_latest_invoice" :
        `unknown_square_status:${subscription.status || "missing"}`;
      await logBillingEvent(supabase, {
        storeId: store.id,
        squareEventId,
        subscriptionId: store.subscription_id,
        oldStatus: store.status,
        newStatus: null,
        eventType: "subscription_sync_unknown_status",
        source,
        success: false,
        reason,
        details: {
          square_status: subscription.status || null,
          start_date: subscription.start_date || null,
          latest_invoice_id: latestInvoice?.id || subscription.invoice_ids?.[0] || null,
          latest_invoice_status: latestInvoice?.status || null,
        },
      });
      return {
        storeId: store.id,
        subscriptionId: store.subscription_id,
        oldStatus: store.status,
        newStatus: null,
        squareStatus: subscription.status || null,
        action: "check_failed",
        reason,
      };
    }

    if (store.status === nextStatus) {
      await logBillingEvent(supabase, {
        storeId: store.id,
        squareEventId,
        subscriptionId: store.subscription_id,
        oldStatus: store.status,
        newStatus: nextStatus,
        eventType: "subscription_sync_unchanged",
        source,
        success: true,
        details: {
          square_status: subscription.status || null,
          start_date: subscription.start_date || null,
          latest_invoice_id: latestInvoice?.id || null,
          latest_invoice_status: latestInvoice?.status || null,
        },
      });
      return {
        storeId: store.id,
        subscriptionId: store.subscription_id,
        oldStatus: store.status,
        newStatus: nextStatus,
        squareStatus: subscription.status || null,
        action: "unchanged",
      };
    }

    await updateStoreStatusStrict(supabase, store.id, nextStatus, {
      squareEventId,
      subscriptionId: store.subscription_id,
      eventType: "subscription_synced",
      source,
      details: {
        square_status: subscription.status || null,
        start_date: subscription.start_date || null,
        latest_invoice_id: latestInvoice?.id || null,
        latest_invoice_status: latestInvoice?.status || null,
      },
    });

    return {
      storeId: store.id,
      subscriptionId: store.subscription_id,
      oldStatus: store.status,
      newStatus: nextStatus,
      squareStatus: subscription.status || null,
      action: "updated",
    };
  } catch (error: any) {
    const reason = error?.message || "subscription_retrieve_failed";
    if (error?.status === 404 && store.status === "契約中") {
      await updateStoreStatusStrict(supabase, store.id, "停止中", {
        squareEventId,
        subscriptionId: store.subscription_id,
        eventType: "subscription_missing_in_square",
        source,
        details: { reason },
      });
    }

    await logBillingEvent(supabase, {
      storeId: store.id,
      squareEventId,
      subscriptionId: store.subscription_id,
      oldStatus: store.status,
      newStatus: null,
      eventType: "subscription_sync_failed",
      source,
      success: false,
      reason,
    });

    return {
      storeId: store.id,
      subscriptionId: store.subscription_id,
      oldStatus: store.status,
      newStatus: error?.status === 404 ? "停止中" : null,
      squareStatus: null,
      action: error?.status === 404 ? "square_not_found" : "check_failed",
      reason,
    };
  }
}
