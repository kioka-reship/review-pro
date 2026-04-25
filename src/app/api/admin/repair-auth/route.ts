import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { sendEmail, emailTemplates } from "../../../../lib/sendEmail";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = "https://review-pro-ay7x.vercel.app";

type LogEntry = {
  level: "info" | "ok" | "warn" | "error";
  message: string;
  time: string;
};

function makeLogger() {
  const logs: LogEntry[] = [];
  const now = () => new Date().toISOString().slice(11, 19);
  return {
    logs,
    info:  (msg: string) => logs.push({ level: "info",  message: msg, time: now() }),
    ok:    (msg: string) => logs.push({ level: "ok",    message: msg, time: now() }),
    warn:  (msg: string) => logs.push({ level: "warn",  message: msg, time: now() }),
    error: (msg: string) => logs.push({ level: "error", message: msg, time: now() }),
  };
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const log = makeLogger();

  if (!email) {
    return NextResponse.json({ success: false, logs: log.logs, error: "emailが必要です" }, { status: 400 });
  }

  // ① storesテーブルから店舗を取得
  log.info(`店舗情報を取得中... (${email})`);
  const { data: store, error: storeErr } = await supabase
    .from("stores")
    .select("id, name, email, status")
    .eq("email", email)
    .single();

  if (storeErr || !store) {
    log.error(`店舗が見つかりません → ${storeErr?.message ?? "not found"}`);
    return NextResponse.json({ success: false, logs: log.logs }, { status: 404 });
  }
  log.ok(`店舗を確認: ${store.name}  status=${store.status}`);

  // ② Supabase Auth ユーザーをメールアドレスで検索
  log.info("Supabase Auth ユーザーを確認中...");
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingAuthUser = listData?.users?.find(
    u => u.email?.toLowerCase() === email.toLowerCase(),
  );

  let authUserId: string;

  if (existingAuthUser) {
    // Auth ユーザーが既に存在する場合 → 仮パスワードで上書きしてからリセットメールを送る
    log.warn(`Auth ユーザーが既に存在します (UUID: ${existingAuthUser.id})`);
    log.info("仮パスワードを生成して上書き中...");

    const tempPassword = randomBytes(16).toString("base64url");
    const { error: updateErr } = await supabase.auth.admin.updateUserById(
      existingAuthUser.id,
      { password: tempPassword },
    );
    if (updateErr) {
      log.error(`仮パスワード設定失敗 → ${updateErr.message}`);
      return NextResponse.json({ success: false, logs: log.logs }, { status: 500 });
    }
    authUserId = existingAuthUser.id;
    log.ok("仮パスワードを設定しました");
  } else {
    // Auth ユーザーが存在しない場合 → 新規作成
    log.info("Auth 未登録を確認 → 新規ユーザーを作成します");
    const tempPassword = randomBytes(16).toString("base64url");
    log.info("仮パスワードを生成しました");

    const { data: newUserData, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (createErr || !newUserData?.user) {
      log.error(`Auth ユーザー作成失敗 → ${createErr?.message ?? "不明なエラー"}`);
      return NextResponse.json({ success: false, logs: log.logs }, { status: 500 });
    }
    authUserId = newUserData.user.id;
    log.ok(`Auth ユーザーを作成しました (UUID: ${authUserId})`);
  }

  // ③ password_resets テーブルにトークンを保存（有効期限24時間）
  log.info("パスワード再設定トークンを生成中...");
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const { error: tokenErr } = await supabase.from("password_resets").insert({
    email,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (tokenErr) {
    log.warn(`トークン保存に失敗しました → ${tokenErr.message}`);
    log.warn("メール送信をスキップします。Supabase の password_resets テーブルを確認してください。");
    return NextResponse.json({ success: false, logs: log.logs }, { status: 500 });
  }
  log.ok("トークンを保存しました（有効期限: 24時間）");

  // ④ パスワード再設定メールを送信
  log.info(`パスワード再設定メールを送信中... → ${email}`);
  const resetUrl = `${APP_URL}/mypage/reset-password/confirm?token=${token}`;
  const tmpl = emailTemplates.passwordReset(resetUrl);
  const sent = await sendEmail({ to: email, ...tmpl, storeId: store.id });

  if (!sent) {
    log.error("メール送信に失敗しました。BREVO_API_KEY と FROM_EMAIL を確認してください。");
    return NextResponse.json({ success: false, logs: log.logs }, { status: 500 });
  }
  log.ok(`パスワード再設定メールを送信しました → ${email}`);

  log.ok(`━━ 修復完了: ${store.name} のパスワード再設定メールを送信しました ━━`);
  log.info("店舗オーナーにメールが届いたことを確認してください。");

  return NextResponse.json({
    success: true,
    logs: log.logs,
    store_name: store.name,
    auth_user_id: authUserId,
  });
}
