import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../../lib/supabase-admin";

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "token and password are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "パスワードは8文字以上で入力してください" }, { status: 400 });
  }

  // トークンを確認
  const { data: reset, error } = await supabase
    .from("password_resets")
    .select("*")
    .eq("token", token)
    .is("used_at", null)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (error || !reset) {
    return NextResponse.json({ error: "リンクが無効または期限切れです" }, { status: 400 });
  }

  // storesテーブルからstore_id（= Supabase Auth user id）を取得
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id")
    .eq("email", reset.email)
    .single();

  if (storeError || !store) {
    return NextResponse.json({ error: "店舗情報が見つかりません" }, { status: 400 });
  }

  // Supabase Auth のパスワードを更新
  const { error: updateError } = await supabase.auth.admin.updateUserById(store.id, {
    password,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // トークンを使用済みにする
  await supabase
    .from("password_resets")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token);

  return NextResponse.json({ success: true });
}
