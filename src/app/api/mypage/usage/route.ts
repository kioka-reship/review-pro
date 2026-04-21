import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_LIMITS: Record<string, number> = {
  light: 10,
  standard: 20,
  premium: 99999,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("store_id");
  if (!storeId) return NextResponse.json({ error: "store_id required" }, { status: 400 });

const { data: store, error: storeError } = await supabase
  .from("stores")
  .select("plan")
  .eq("id", storeId)
  .single();

console.log("[usage] storeId:", storeId, "plan:", store?.plan, "error:", storeError);

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const { count } = await supabase
    .from("usage")
    .select("*", { count: "exact", head: true })
    .eq("store_id", storeId)
    .gte("created_at", firstDay)
    .lte("created_at", lastDay);

 const limit = PLAN_LIMITS[store?.plan ?? "light"] ?? 10;

return NextResponse.json({ used: count || 0, limit });
}
