import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../lib/supabase-admin";
import { listEffectiveOptions } from "../../../lib/planFeatures";

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

  try {
    const options = await listEffectiveOptions(supabase, store_id);
    return NextResponse.json({ options });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
