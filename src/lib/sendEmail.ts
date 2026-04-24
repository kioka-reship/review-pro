import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { sendEmail, emailTemplates } from "../../../../lib/sendEmail";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = "https://review-pro-ay7x.vercel.app";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "メールアドレスが必要です" }, { status: 400 });
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("email", email)
    .single();

  if (!store) {
    return NextResponse.json({ success: true });
  }

  // トークン生成（1時間有効）
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await supabase.from("password_resets").insert({
    email,
    token,
    expires_at: expiresAt.toISOString(),
  });

  const resetUrl = `${APP_URL}/mypage/reset-password/confirm?token=${token}`;

  const tmpl = emailTemplates.passwordReset(resetUrl);
  await sendEmail({ to: email, ...tmpl, storeId: store.id });

  return NextResponse.json({ success: true });
}
