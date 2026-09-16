import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../lib/supabase-admin";
import { getFeatureAccess } from "../../../lib/planFeatures";

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  const { store_id, rating, issues, comment } = await req.json();

  if (!store_id || !rating) {
    return NextResponse.json({ error: "store_id and rating are required" }, { status: 400 });
  }

  // low_review_pro が使える場合のみ保存（feedback_list の契約状態は不問）
  const lowReviewPro = await getFeatureAccess(supabase, store_id, "low_review_pro");
  if (!lowReviewPro.enabled) {
    // low_review_pro 未契約の場合は保存しないが 200 を返す（フォーム側にエラーを表示しない）
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
