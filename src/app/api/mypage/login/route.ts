import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "メールアドレスとパスワードを入力してください" }, { status: 400 });
  }

  // Supabase Authで認証
  const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData?.user) {
    return NextResponse.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
  }

  // storesテーブルからstore情報を取得
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, name, plan, billing_cycle, status, next_billing_date, email, setup_fee_paid_amount, pending_plan, pending_billing_cycle")
    .eq("id", authData.user.id)
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

  return NextResponse.json({ store });
}
