import { NextResponse } from "next/server";
import { getAdminClient } from "../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data });
}
