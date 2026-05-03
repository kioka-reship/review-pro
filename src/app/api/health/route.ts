import { NextResponse } from "next/server";
import { getAdminClient } from "../../../lib/supabase-admin";

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
  return NextResponse.json(result, { status: statusCode });
}
