import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code || typeof code !== "string" || code.trim() === "") {
    return NextResponse.json({ valid: false });
  }
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("referral_codes")
    .select("id, code, sales_person_name, channel_name, is_active")
    .eq("code", code.toUpperCase().trim())
    .single();

  if (!data || !data.is_active) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    id: data.id,
    code: data.code,
    sales_person_name: data.sales_person_name,
    channel_name: data.channel_name,
  });
}
