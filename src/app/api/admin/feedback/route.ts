import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";
import { requireAdminOrStoreOwner } from "../../../../lib/auth";
import { getFeatureAccess } from "../../../../lib/planFeatures";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const store_id = searchParams.get("store_id") ?? undefined;

  // 管理者：store_id 任意。ユーザー：自店舗の store_id 必須
  const result = await requireAdminOrStoreOwner(req, store_id);
  if (result instanceof NextResponse) return result;

  const supabase = getAdminClient();

  // オーナー（result === "user"）の場合: feedback_list 契約日以降のみ返す
  let feedbackListCreatedAt: string | null = null;
  if (result === "user" && store_id) {
    const feedbackList = await getFeatureAccess(supabase, store_id, "feedback_list");
    if (!feedbackList.enabled) {
      // feedback_list 未契約または非アクティブ → 空を返す
      return NextResponse.json({ feedback: [] });
    }
    feedbackListCreatedAt = feedbackList.optionCreatedAt;
  }

  let query = supabase
    .from("feedback")
    .select("*, stores(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (store_id) query = query.eq("store_id", store_id);
  // 契約日フィルター（オーナーアクセス時のみ適用）
  if (feedbackListCreatedAt) query = query.gte("created_at", feedbackListCreatedAt);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data });
}
