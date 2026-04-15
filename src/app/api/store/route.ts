import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("stores")
    .select("id, name, type, place_id, plan, status")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  if (data.status !== "active") {
    return NextResponse.json({ error: "Store is inactive" }, { status: 403 });
  }

  return NextResponse.json(data);
}
