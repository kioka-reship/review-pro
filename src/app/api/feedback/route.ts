import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
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
