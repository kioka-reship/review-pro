import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";
import { isSubscriptionRequired, reconcileStoreSubscription } from "../../../../lib/squareBilling";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const results = {
    checked: 0,
    updated: 0,
    unchanged: 0,
    missingSubscriptionId: 0,
    squareNotFound: 0,
    checkFailed: 0,
    skipped: 0,
    details: [] as Array<{
      store_id: string;
      subscription_id: string | null;
      old_status: string | null;
      new_status: string | null;
      square_status: string | null;
      action: string;
      reason?: string;
    }>,
  };

  const { data: stores, error } = await supabase
    .from("stores")
    .select("id, status, billing_cycle, subscription_id, setup_fee_paid_at")
    .in("status", ["契約中", "停止中", "解約予約"])
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  for (const store of stores || []) {
    if (store.status !== "契約中" && !store.subscription_id) {
      results.skipped++;
      continue;
    }
    if (!isSubscriptionRequired(store)) {
      results.skipped++;
      continue;
    }

    results.checked++;
    const result = await reconcileStoreSubscription(supabase, store, "sync");
    if (result.action === "updated") results.updated++;
    if (result.action === "unchanged") results.unchanged++;
    if (result.action === "missing_subscription_id") results.missingSubscriptionId++;
    if (result.action === "square_not_found") results.squareNotFound++;
    if (result.action === "check_failed") results.checkFailed++;
    if (result.action === "skipped") results.skipped++;

    results.details.push({
      store_id: result.storeId,
      subscription_id: result.subscriptionId,
      old_status: result.oldStatus,
      new_status: result.newStatus,
      square_status: result.squareStatus,
      action: result.action,
      reason: result.reason,
    });
  }

  return NextResponse.json({ success: true, ...results });
}
