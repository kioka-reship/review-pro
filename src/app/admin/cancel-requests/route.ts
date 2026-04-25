import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../lib/supabase-admin";

export async function GET() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("cancellation_requests")
    .select("*")
    .order("requested_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = getAdminClient();
  const { id, status } = await req.json();
  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("cancellation_requests")
    .update({ status, handled_at: new Date().toISOString(), handled_by: "admin" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
