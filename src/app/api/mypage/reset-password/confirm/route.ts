import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
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

  // パスワードを更新
  const { error: updateError } = await supabase
    .from("stores")
    .update({ password, updated_at: new Date().toISOString() })
    .eq("email", reset.email);

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
