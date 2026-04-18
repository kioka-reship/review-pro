import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "メールアドレスとパスワードを入力してください" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("stores")
    .select("id, name, plan, status, next_billing_date, email")
    .eq("email", email)
    .eq("password", password)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
  }

  if (data.status === "pending_payment") {
    return NextResponse.json({ error: "決済が完了していません。お支払いをお願いします。" }, { status: 403 });
  }

  if (data.status === "停止中" || data.status === "canceled") {
    return NextResponse.json({ error: "このアカウントは停止されています。" }, { status: 403 });
  }

  return NextResponse.json({ store: data });
}
