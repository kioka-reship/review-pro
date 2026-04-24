import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_LABELS: Record<string, string> = {
  light: "ライト ¥4,980/月（月契約）/ ¥3,980/月（年契約）",
  standard: "スタンダード ¥9,800/月（月契約）/ ¥7,980/月（年契約）",
  premium: "プレミアム ¥19,800/月（月契約）/ ¥15,800/月（年契約）",
};

export async function GET(req: NextRequest) {
  // Cronシークレットで保護
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  const results = { downgraded: 0, optionsCanceled: 0, errors: [] as string[] };

  try {
    // ① ダウングレード反映
    const { data: downgrades } = await supabase
      .from("stores")
      .select("*")
      .not("downgrade_scheduled_plan", "is", null)
      .lte("downgrade_effective_date", today);

    for (const store of downgrades || []) {
      const { error } = await supabase
        .from("stores")
        .update({
          plan: store.downgrade_scheduled_plan,
          downgrade_scheduled_plan: null,
          downgrade_effective_date: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", store.id);

      if (error) {
        results.errors.push(`downgrade failed: ${store.id}`);
        continue;
      }

      await supabase.from("plan_histories").insert({
        store_id: store.id,
        changed_by: "system",
        from_plan: store.plan,
        to_plan: store.downgrade_scheduled_plan,
        change_type: "downgrade_applied",
        effective_date: today,
      });

      await supabase.from("audit_logs").insert({
        store_id: store.id,
        actor: "system",
        action: "plan_downgraded",
        detail: { from: store.plan, to: store.downgrade_scheduled_plan },
      });

      results.downgraded++;
      console.log("[Cron] ダウングレード反映:", store.id, store.downgrade_scheduled_plan);
    }

    // ② OP解約反映
    const { data: canceledOptions } = await supabase
      .from("option_subscriptions")
      .select("*, stores(name, email)")
      .eq("status", "cancel_scheduled")
      .lte("cancel_effective_date", today);

    for (const opt of canceledOptions || []) {
      const { error } = await supabase
        .from("option_subscriptions")
        .update({
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", opt.id);

      if (error) {
        results.errors.push(`option cancel failed: ${opt.id}`);
        continue;
      }

      await supabase.from("audit_logs").insert({
        store_id: opt.store_id,
        actor: "system",
        action: "option_canceled",
        detail: { option_key: opt.option_key, option_name: opt.option_name },
      });

      results.optionsCanceled++;
      console.log("[Cron] OP解約反映:", opt.option_name);
    }

    console.log("[Cron] 完了:", results);
    return NextResponse.json({ success: true, ...results });

  } catch (err: any) {
    console.error("[Cron] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
