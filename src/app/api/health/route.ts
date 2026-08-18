import { NextResponse } from "next/server";
import { getAdminClient } from "../../../lib/supabase-admin";

// キャッシュされた古い成功結果を返し続けないよう、必ず毎回ライブでSupabaseへ問い合わせる。
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const result: Record<string, string> = { status: "ok" };

  try {
    const supabase = getAdminClient();
    // storesテーブルへの疎通確認（1件だけ取得）
    const { error } = await supabase.from("stores").select("id").limit(1);
    if (error) {
      console.error("[health] Supabase DB check failed:", error.message);
      result.supabase = "error";
      result.supabase_error = error.message;
      result.status = "degraded";
    } else {
      result.supabase = "ok";
    }
  } catch (err: any) {
    console.error("[health] Supabase unreachable:", err.message);
    result.supabase = "unreachable";
    result.status = "degraded";
  }

  const statusCode = result.status === "ok" ? 200 : 503;
  return new NextResponse(JSON.stringify(result), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
