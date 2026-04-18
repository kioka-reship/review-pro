import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { store_id, reason } = await req.json();
  if (!store_id) {
    return NextResponse.json({ error: "store_id required" }, { status: 400 });
  }

  // 翌月末を解約反映日に設定
  const now = new Date();
  const effectiveDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  // 解約申請を保存
  const { error } = await supabase.from("cancellation_requests").insert({
    store_id,
    request_type: "store",
    reason,
    requested_at: now.toISOString(),
    effective_date: effectiveDate.toISOString().split("T")[0],
    status: "pending",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ステータスを解約予約に更新
  await supabase.from("stores").update({
    status: "解約予約",
    updated_at: now.toISOString(),
  }).eq("id", store_id);

  // 監査ログ
  await supabase.from("audit_logs").insert({
    store_id,
    actor: "customer",
    action: "cancellation_requested",
    detail: { reason, effective_date: effectiveDate.toISOString().split("T")[0] },
  });

  return NextResponse.json({ success: true });
}
