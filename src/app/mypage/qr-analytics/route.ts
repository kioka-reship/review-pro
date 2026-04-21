import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const store_id = searchParams.get("store_id");

  if (!store_id) {
    return NextResponse.json({ error: "store_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("qr_access_logs")
    .select("id, accessed_at")
    .eq("store_id", store_id)
    .order("accessed_at", { ascending: false })
    .limit(1000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ logs: data || [] });
}
