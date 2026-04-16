import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 全店舗取得
export async function GET() {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stores: data });
}

// 店舗追加
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, owner_name, email, password, plan, place_id } = body;

  if (!name || !email || !place_id) {
    return NextResponse.json({ error: "name, email, place_id は必須です" }, { status: 400 });
  }

  const id = type.slice(0, 3).toLowerCase().replace(/[^a-z]/g, "") + "-" + Date.now().toString().slice(-6);

  const { data, error } = await supabase
    .from("stores")
    .insert({ id, name, type, owner_name, email, password, plan, place_id, status: "active" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ store: data });
}

// 店舗更新（停止・再開・プラン変更）
export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json();

  const { error } = await supabase
    .from("stores")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
