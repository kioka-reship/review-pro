import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { sendEmail, emailTemplates } from "../../../../lib/sendEmail";
import { getAdminClient } from "../../../../lib/supabase-admin";

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

// メール不要でSupabase Authパスワードを直接設定
export async function PATCH(req: NextRequest) {
  const log = makeLogger();
  try {
  const supabase = getAdminClient();
  const { store_name, new_password } = await req.json();

  if (!store_name || !new_password) {
    log.error("store_name と new_password が必要です");
    return NextResponse.json({ success: false, logs: log.logs }, { status: 400 });
  }
  if (new_password.length < 8) {
    log.error("パスワードは8文字以上で入力してください");
    return NextResponse.json({ success: false, logs: log.logs }, { status: 400 });
  }

  log.info(`店舗を名前で検索中... "${store_name}"`);
  const { data: storeList } = await supabase
    .from("stores")
    .select("id, name, email, status")
    .ilike("name", `%${store_name}%`);

  if (!storeList || storeList.length === 0) {
    log.error(`店舗が見つかりません: "${store_name}"`);
    return NextResponse.json({ success: false, logs: log.logs }, { status: 404 });
  }
  if (storeList.length > 1) {
    log.error(`複数該当: ${storeList.map(s => s.name).join(", ")} — 店舗名を絞り込んでください`);
    return NextResponse.json({ success: false, logs: log.logs }, { status: 400 });
  }
  const store = storeList[0];
  log.ok(`店舗を確認: ${store.name}  email=${store.email}`);

  log.info("Supabase Auth ユーザーを確認中...");
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const authUser = listData?.users?.find(
    u => u.email?.toLowerCase() === store.email?.toLowerCase(),
  );

  if (authUser) {
    log.info(`Auth ユーザーが存在します (UUID: ${authUser.id}) → パスワードを更新`);
    const { error: updateErr } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: new_password,
    });
    if (updateErr) {
      log.error(`パスワード更新失敗 → ${updateErr.message}`);
      return NextResponse.json({ success: false, logs: log.logs }, { status: 500 });
    }
    log.ok("パスワードを更新しました");
  } else {
    log.info("Auth 未登録 → 指定パスワードで新規 Auth ユーザーを作成します");
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: store.email,
      password: new_password,
      email_confirm: true,
    });
    if (createErr || !newUser?.user) {
      log.error(`Auth ユーザー作成失敗 → ${createErr?.message ?? "不明なエラー"}`);
      return NextResponse.json({ success: false, logs: log.logs }, { status: 500 });
    }
    log.ok(`Auth ユーザーを作成しました (UUID: ${newUser.user.id})`);
  }

  log.ok(`━━ 完了: ${store.name} のパスワードを設定しました ━━`);
  log.info(`ログインURL: ${APP_URL}/mypage`);
  log.info(`メール: ${store.email}`);
  log.info("設定したパスワードでログインできます（メール不要）");

  return NextResponse.json({ success: true, logs: log.logs, store_name: store.name, login_email: store.email });
  } catch (err: any) {
    log.error(`予期しないエラー: ${err?.message ?? "不明"}`);
    return NextResponse.json({ success: false, logs: log.logs }, { status: 500 });
  }
}

// stores.email 変更 + Supabase Auth 同期 + パスワード再設定メール送信
export async function PUT(req: NextRequest) {
  const log = makeLogger();
  try {
  const supabase = getAdminClient();
  const { store_name, new_email } = await req.json();

  if (!store_name || !new_email) {
    log.error("store_name と new_email が必要です");
    return NextResponse.json({ success: false, logs: log.logs }, { status: 400 });
  }

  log.info(`店舗を名前で検索中... "${store_name}"`);
  const { data: storeList } = await supabase
    .from("stores")
    .select("id, name, email, status")
    .ilike("name", `%${store_name}%`);

  if (!storeList || storeList.length === 0) {
    log.error(`店舗が見つかりません: "${store_name}"`);
    return NextResponse.json({ success: false, logs: log.logs }, { status: 404 });
  }
  if (storeList.length > 1) {
    log.warn(`複数の店舗が該当しました: ${storeList.map(s => s.name).join(", ")}`);
    log.error("店舗名をより具体的に指定してください");
    return NextResponse.json({ success: false, logs: log.logs }, { status: 400 });
  }
  const store = storeList[0];
  const oldEmail = store.email;
  log.ok(`店舗を確認: ${store.name}  旧email=${oldEmail}  status=${store.status}`);

  log.info(`新しいメールアドレス "${new_email}" の重複確認中...`);
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const authByOldEmail = listData?.users?.find(u => u.email?.toLowerCase() === oldEmail?.toLowerCase());
  const authByNewEmail = listData?.users?.find(u => u.email?.toLowerCase() === new_email.toLowerCase());

  if (authByNewEmail && authByNewEmail.id !== authByOldEmail?.id) {
    log.error(`"${new_email}" は別のアカウントで既に使用されています`);
    return NextResponse.json({ success: false, logs: log.logs }, { status: 409 });
  }
  log.ok("メールアドレスの重複なし");

  log.info(`stores.email を更新中: ${oldEmail} → ${new_email}`);
  const { error: emailUpdateErr } = await supabase
    .from("stores")
    .update({ email: new_email, updated_at: new Date().toISOString() })
    .eq("id", store.id);

  if (emailUpdateErr) {
    log.error(`stores.email 更新失敗 → ${emailUpdateErr.message}`);
    return NextResponse.json({ success: false, logs: log.logs }, { status: 500 });
  }
  log.ok(`stores.email を更新しました → ${new_email}`);

  const tempPassword = randomBytes(16).toString("base64url");
  let authUserId: string;

  if (authByOldEmail) {
    log.info(`Auth ユーザー (UUID: ${authByOldEmail.id}) のメールアドレスを更新中...`);
    const { error: authEmailErr } = await supabase.auth.admin.updateUserById(
      authByOldEmail.id,
      { email: new_email, password: tempPassword },
    );
    if (authEmailErr) {
      log.error(`Auth email 更新失敗 → ${authEmailErr.message}`);
      return NextResponse.json({ success: false, logs: log.logs }, { status: 500 });
    }
    authUserId = authByOldEmail.id;
    log.ok(`Auth email を更新しました → ${new_email}`);
  } else {
    log.info("Auth 未登録を確認 → 新しいメールで Auth ユーザーを作成します");
    const { data: newUserData, error: createErr } = await supabase.auth.admin.createUser({
      email: new_email,
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

  log.info("パスワード再設定トークンを生成中...");
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const { error: tokenErr } = await supabase.from("password_resets").insert({
    email: new_email,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (tokenErr) {
    log.error(`トークン保存失敗 → ${tokenErr.message}`);
    return NextResponse.json({ success: false, logs: log.logs }, { status: 500 });
  }
  log.ok("トークンを保存しました（有効期限: 24時間）");

  log.info(`パスワード再設定メールを送信中... → ${new_email}`);
  const resetUrl = `${APP_URL}/mypage/reset-password/confirm?token=${token}`;
  const tmpl = emailTemplates.passwordReset(resetUrl);
  const sent = await sendEmail({ to: new_email, ...tmpl, storeId: store.id });

  if (!sent) {
    log.error("メール送信に失敗しました。BREVO_API_KEY と FROM_EMAIL を確認してください。");
    return NextResponse.json({ success: false, logs: log.logs }, { status: 500 });
  }
  log.ok(`パスワード再設定メールを送信しました → ${new_email}`);
  log.ok(`━━ 完了: ${store.name} のメールアドレスを更新し、パスワード再設定メールを送信しました ━━`);
  log.info(`新メールアドレス: ${new_email}`);
  log.info("リンクの有効期限は24時間です。早めにパスワードを設定してください。");

  return NextResponse.json({ success: true, logs: log.logs, store_name: store.name, old_email: oldEmail, new_email, auth_user_id: authUserId });
  } catch (err: any) {
    log.error(`予期しないエラー: ${err?.message ?? "不明"}`);
    return NextResponse.json({ success: false, logs: log.logs }, { status: 500 });
  }
}

// Auth未登録店舗にユーザー作成 + パスワード再設定メール送信
export async function POST(req: NextRequest) {
  const log = makeLogger();
  try {
  const supabase = getAdminClient();
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ success: false, logs: log.logs, error: "emailが必要です" }, { status: 400 });
  }

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

  log.info("Supabase Auth ユーザーを確認中...");
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingAuthUser = listData?.users?.find(
    u => u.email?.toLowerCase() === email.toLowerCase(),
  );

  let authUserId: string;

  if (existingAuthUser) {
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

  return NextResponse.json({ success: true, logs: log.logs, store_name: store.name, auth_user_id: authUserId });
  } catch (err: any) {
    log.error(`予期しないエラー: ${err?.message ?? "不明"}`);
    return NextResponse.json({ success: false, logs: log.logs }, { status: 500 });
  }
}
