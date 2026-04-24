import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { sendEmail, emailTemplates } from "../../../lib/sendEmail";

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

  // Brevoでメール送信
  await sendEmail({
    to: email,
    subject: "【REVIEW PRO】パスワード再設定",
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2C7A4B;">パスワード再設定</h2>
        <p>${store.name} 様</p>
        <p>パスワード再設定のリクエストを受け付けました。<br>以下のボタンから新しいパスワードを設定してください。</p>
        <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #2C7A4B; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">
          パスワードを再設定する
        </a>
        <p style="color: #888; font-size: 12px;">このリンクは1時間有効です。心当たりがない場合は無視してください。</p>
      </div>
    `,
    storeId: store.id,
  });

  return NextResponse.json({ success: true });
}
