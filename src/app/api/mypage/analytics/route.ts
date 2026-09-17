import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";
import {
  buildAnalyticsDashboard,
  normalizeAnalyticsPeriod,
  type LockedAnalyticsDashboardData,
} from "../../../../lib/analyticsDashboard";

export const dynamic = "force-dynamic";

async function getAuthenticatedStore(req: NextRequest) {
  const supabase = getAdminClient();
  const token = req.cookies.get("store_auth")?.value;
  if (!token) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user?.email) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, plan, status, email")
    .eq("email", user.email)
    .maybeSingle();

  if (storeError) throw storeError;
  if (!store) return { response: NextResponse.json({ error: "Store not found" }, { status: 404 }) };
  if (store.status !== "契約中") {
    return { response: NextResponse.json({ error: "Store inactive" }, { status: 403 }) };
  }

  return { store };
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(req.url);
    const period = normalizeAnalyticsPeriod(searchParams.get("period"));
    const auth = await getAuthenticatedStore(req);
    if ("response" in auth) return auth.response;

    const store = auth.store;
    if (store.plan !== "premium") {
      const locked: LockedAnalyticsDashboardData = {
        locked: true,
        plan: store.plan,
        message: "PREMIUMなら、口コミ獲得の成果やお客様の評価傾向を確認できます。",
      };
      return NextResponse.json(locked);
    }

    const data = await buildAnalyticsDashboard(supabase, store.id, period);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[mypage/analytics] failed:", error);
    return NextResponse.json({ error: error?.message || "analytics failed" }, { status: 500 });
  }
}
