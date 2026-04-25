import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = getAdminClient();
  const { searchParams } = new URL(req.url);
  const store_id = searchParams.get("store_id");

  let query = supabase
    .from("feedback")
    .select("*, stores(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (store_id) query = query.eq("store_id", store_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data });
}
