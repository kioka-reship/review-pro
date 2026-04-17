import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PLAN_LIMITS: Record<string, number> = {
  light: 10,
  standard: 30,
  premium: 99999,
};

export async function POST(req: NextRequest) {
  const { storeId, plan } = await req.json();

  if (!storeId) {
    return NextResponse.json({ error: "storeId is required" }, { status: 400 });
  }

  const yearMonth = new Date().toISOString().slice(0, 7);
  const limit = PLAN_LIMITS[plan] ?? 10;

  // 今月の利用数を取得
  const { data: usage } = await supabase
    .from("monthly_usage")
    .select("count")
    .eq("store_id", storeId)
    .eq("year_month", yearMonth)
    .single();

  const currentCount = usage?.count ?? 0;

  // 上限チェック
  if (currentCount >= limit) {
    return NextResponse.json({
      allowed: false,
      count: currentCount,
      limit,
    });
  }

  // 利用数を+1
  await supabase.from("monthly_usage").upsert(
    { store_id: storeId, year_month: yearMonth, count: currentCount + 1 },
    { onConflict: "store_id,year_month" }
  );

  return NextResponse.json({
    allowed: true,
    count: currentCount + 1,
    limit,
  });
}
