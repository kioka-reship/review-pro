export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const store_id = searchParams.get("store_id");

  if (!store_id) {
    return NextResponse.json({ error: "store_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("option_subscriptions")
    .select("*")
    .eq("store_id", store_id)
    .neq("status", "canceled");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ options: data });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { store_id, option_id } = await req.json();
  if (!store_id || !option_id) {
    return NextResponse.json({ error: "store_id and option_id required" }, { status: 400 });
  }

  // 翌月5日を解約反映日に設定
  const now = new Date();
  const effectiveDate = new Date(now.getFullYear(), now.getMonth() + 1, 5);

  const { error } = await supabase
    .from("option_subscriptions")
    .update({
      status: "cancel_scheduled",
      cancel_requested_at: now.toISOString(),
      cancel_effective_date: effectiveDate.toISOString().split("T")[0],
      updated_at: now.toISOString(),
    })
    .eq("id", option_id)
    .eq("store_id", store_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 監査ログ
  await supabase.from("audit_logs").insert({
    store_id,
    actor: "customer",
    action: "option_cancel_requested",
    detail: { option_id, cancel_effective_date: effectiveDate.toISOString().split("T")[0] },
  });

  return NextResponse.json({ success: true });
}
