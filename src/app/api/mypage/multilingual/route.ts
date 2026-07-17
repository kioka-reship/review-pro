import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  try {
    const { store_id, enabled } = await req.json();

    if (!store_id || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "store_id and enabled are required" }, { status: 400 });
    }

    const { data: store } = await supabase
      .from("stores")
      .select("plan")
      .eq("id", store_id)
      .single();

    if (!store || store.plan !== "premium") {
      return NextResponse.json({ error: "多言語機能はプレミアムプランのみ利用可能です" }, { status: 403 });
    }

    const { error } = await supabase
      .from("stores")
      .update({ multilingual_enabled: enabled })
      .eq("id", store_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, multilingual_enabled: enabled });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
