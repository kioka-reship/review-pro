import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "メールアドレスとパスワードを入力してください" }, { status: 400 });
  }

  // Supabase Authで認証（サーバーサイドではservice role keyを使用）
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData?.user) {
    console.error("[mypage/login] signInWithPassword failed:", {
      code: authError?.code,
      status: authError?.status,
      message: authError?.message,
    });
    // 認証情報の不一致はそのまま返す。それ以外（Supabase障害等）はシステムエラーとして返す
    const isCredentialError = authError?.status === 400 || authError?.code === "invalid_credentials";
    if (isCredentialError || !authError) {
      return NextResponse.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "システムエラーが発生しました。しばらく経ってからお試しください" },
      { status: 503 }
    );
  }

  // storesテーブルからstore情報を取得（emailで検索することで管理画面追加店舗にも対応）
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, name, plan, billing_cycle, status, next_billing_date, email, setup_fee_paid_amount, pending_plan, pending_billing_cycle, created_at, monthly_price")
    .eq("email", authData.user.email!)
    .single();

  if (storeError || !store) {
    return NextResponse.json({ error: "店舗情報が見つかりません" }, { status: 404 });
  }

  if (store.status === "pending_payment") {
    return NextResponse.json({ error: "決済が完了していません。お支払いをお願いします。" }, { status: 403 });
  }

  if (store.status === "停止中" || store.status === "canceled") {
    return NextResponse.json({ error: "このアカウントは停止されています。" }, { status: 403 });
  }

  const res = NextResponse.json({ store });
  res.cookies.set("store_auth", authData.session?.access_token ?? "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1時間（Supabase JWTのデフォルト有効期限に合わせる）
    path: "/",
  });
  return res;
}
