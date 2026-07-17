import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";
import { requireAdmin } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("referral_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ codes: data });
}

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  const supabase = getAdminClient();
  const { code, sales_person_name, channel_name, commission_enabled, is_active, memo } = await req.json();
  if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });
  const { data, error } = await supabase
    .from("referral_codes")
    .insert({
      code: code.toUpperCase().trim(),
      sales_person_name: sales_person_name || null,
      channel_name: channel_name || null,
      commission_enabled: !!commission_enabled,
      is_active: is_active !== false,
      memo: memo || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ code: data });
}

export async function PATCH(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  const supabase = getAdminClient();
  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (updates.code) updates.code = updates.code.toUpperCase().trim();
  const { error } = await supabase
    .from("referral_codes")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  const supabase = getAdminClient();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const { error } = await supabase.from("referral_codes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
