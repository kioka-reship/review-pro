import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";
import { requireAdmin } from "../../../../lib/auth";
import { appendStoreToSheet } from "../../../../lib/google-sheets";

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const { store_id } = await req.json();
  if (!store_id) return NextResponse.json({ error: "store_id is required" }, { status: 400 });

  const supabase = getAdminClient();
  const { data: store, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", store_id)
    .single();

  if (error || !store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  let commissionEnabled: boolean | null = null;
  let commissionRate: number | null = null;
  if (store.referral_id) {
    const { data: rc } = await supabase
      .from("referral_codes")
      .select("commission_enabled, commission_rate")
      .eq("id", store.referral_id)
      .single();
    if (rc) {
      commissionEnabled = rc.commission_enabled;
      commissionRate = rc.commission_rate ?? null;
    }
  }

  try {
    await appendStoreToSheet({ ...store, commission_enabled: commissionEnabled, commission_rate: commissionRate });
    await supabase.from("stores").update({
      sheet_synced_at: new Date().toISOString(),
      sheet_sync_status: "synced",
    }).eq("id", store_id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[SheetSync] error:", err);
    await supabase.from("stores").update({
      sheet_sync_status: "failed",
    }).eq("id", store_id);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
