import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const store_id = searchParams.get("store_id");

  if (!store_id) {
    return NextResponse.json({ error: "store_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("store_id", store_id)
    .order("order_num");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(JSON.stringify({ questions: data }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

export async function PUT(req: NextRequest) {
  const { store_id, questions } = await req.json();

  if (!store_id || !questions) {
    return NextResponse.json({ error: "store_id and questions are required" }, { status: 400 });
  }

  await supabase.from("questions").delete().eq("store_id", store_id);

  const rows = questions.map((q: any, i: number) => ({
    store_id,
    order_num: i + 1,
    label: q.label,
    type: q.type,
    options: q.options,
  }));

  const { error } = await supabase.from("questions").insert(rows);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
