import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { store_id } = await req.json();
  if (!store_id) return NextResponse.json({ error: "store_id required" }, { status: 400 });

  await supabase.from("qr_access_logs").insert({
    store_id,
    user_agent: req.headers.get("user-agent") || "",
    ip_address: req.headers.get("x-forwarded-for") || "",
  });

  return NextResponse.json({ ok: true });
}
