import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

// Supabase Freeプランの低アクティビティ自動Pause対策。読み取り専用の軽量SELECTのみ行い、
// INSERT/UPDATE/DELETEは一切行わない。同時に本番DBへの実接続確認（keepalive兼ヘルスチェック）を兼ねる。
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from("stores").select("id").limit(1);

    if (error) {
      // 秘密情報を含まない範囲でのみログ出力
      console.error("[keepalive] Supabase query failed:", error.message);
      return NextResponse.json({ ok: false, reason: "supabase_unreachable" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[keepalive] Supabase unreachable:", err?.message);
    return NextResponse.json({ ok: false, reason: "supabase_unreachable" }, { status: 500 });
  }
}
