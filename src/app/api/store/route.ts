import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  let data: any = null;
  let error: any = null;

  try {
    const supabase = getAdminClient();
    const result = await supabase
      .from("stores")
      .select("id, name, type, place_id, google_review_url, plan, status, multilingual_enabled")
      .eq("id", id)
      .single();
    data = result.data;
    error = result.error;
  } catch (err: any) {
    // Supabaseへの接続自体が失敗した場合（fetch failed等）。秘密情報は含めずログのみ出力する。
    console.error("[store] Supabase unreachable:", err?.message);
    return NextResponse.json({ error: "Database unreachable", reason: "database_error" }, { status: 500 });
  }

  if (error) {
    // PGRST116 = .single()で0件（＝本当にstoreIdが存在しない）。それ以外はDB/接続エラー。
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Store not found", reason: "not_found" }, { status: 404 });
    }
    console.error("[store] Supabase query failed:", error.message);
    return NextResponse.json({ error: "Database error", reason: "database_error" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Store not found", reason: "not_found" }, { status: 404 });
  }

  if (data.status !== "契約中") {
    return NextResponse.json({ error: "Store is inactive", reason: "inactive" }, { status: 403 });
  }

  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
