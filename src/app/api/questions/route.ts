import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const supabase = getAdminClient();
  const { searchParams } = new URL(req.url);
  const store_id = searchParams.get("store_id");

  if (!store_id) {
    return NextResponse.json({ error: "store_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("store_id", store_id)
    .order("order_num");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(JSON.stringify({ questions: data }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
