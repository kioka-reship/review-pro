import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../lib/supabase-admin";

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  const { store_id, rating, issues, comment } = await req.json();

  if (!store_id || !rating) {
    return NextResponse.json({ error: "store_id and rating are required" }, { status: 400 });
  }

  // feedback_list オプションが active の場合のみ保存
  const { data: opt } = await supabase
    .from("option_subscriptions")
    .select("status")
    .eq("store_id", store_id)
    .eq("option_key", "feedback_list")
    .maybeSingle();

  if (opt?.status !== "active") {
    // オプション未契約の場合は保存しないが 200 を返す（フォーム側にエラーを表示しない）
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.from("feedback").insert({
    store_id,
    rating,
    issues: issues || [],
    comment: comment || "",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
