import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../lib/supabase-admin";

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  const { store_id, session_id } = await req.json();
  if (!store_id) return NextResponse.json({ error: "store_id required" }, { status: 400 });

 await supabase.from("qr_access_logs").insert({
    store_id,
    session_id: session_id || null,
    user_agent: req.headers.get("user-agent") || "",
    ip_address: req.headers.get("x-forwarded-for") || "",
  });

  return NextResponse.json({ ok: true });
}
