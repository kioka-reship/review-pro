import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * 公開エンドポイント: 認証不要
 * /review/[storeId] の低評価対策PRO判定に使用
 * option_key と status のみ返却（機密情報を含まない）
 */
export async function GET(req: NextRequest) {
  const supabase = getAdminClient();
  const { searchParams } = new URL(req.url);
  const store_id = searchParams.get("store_id");

  if (!store_id) {
    return NextResponse.json({ error: "store_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("option_subscriptions")
    .select("option_key, status")
    .eq("store_id", store_id)
    .eq("status", "active");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ options: data ?? [] });
}
