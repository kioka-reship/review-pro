import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../lib/supabase-admin";

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  const { store_id, rating, issues, comment } = await req.json();

  if (!store_id || !rating) {
    return NextResponse.json({ error: "store_id and rating are required" }, { status: 400 });
  }

  const { error } = await supabase.from("feedback").insert({
    store_id,
    rating,
    issues: issues || [],
    comment: comment || "",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
