import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AuthCheckResult = {
  store_name: string;
  store_id: string;
  store_email: string;
  store_status: string;
  id_is_uuid: boolean;
  auth_user_exists: boolean;
  id_matches_auth_uuid: boolean;
  email_matches_auth: boolean;
  auth_uuid: string | null;
  auth_email: string | null;
  recommendation: string;
  severity: "ok" | "warn" | "error";
};

// ページネーションで全Authユーザーを取得（読み取り専用）
async function getAllAuthUsers() {
  const allUsers: { id: string; email?: string }[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;
    allUsers.push(...data.users.map(u => ({ id: u.id, email: u.email })));
    if (data.users.length < perPage) break;
    page++;
  }

  return allUsers;
}

function classify(
  authExists: boolean,
  idMatch: boolean,
  emailMatch: boolean,
): { recommendation: string; severity: "ok" | "warn" | "error" } {
  if (!authExists) {
    return {
      recommendation: "Auth未登録：repair-auth APIで修復 + パスワードリセット送信を推奨",
      severity: "error",
    };
  }
  if (idMatch && emailMatch) {
    return { recommendation: "正常", severity: "ok" };
  }
  if (!idMatch && emailMatch) {
    return {
      recommendation: "ID不一致（管理画面追加）：ログイン修正(email検索)適用で自動解消",
      severity: "warn",
    };
  }
  if (idMatch && !emailMatch) {
    return {
      recommendation: "email不一致：Auth emailをstores.emailに同期を推奨",
      severity: "warn",
    };
  }
  return {
    recommendation: "IDもemailも不一致：手動確認が必要",
    severity: "error",
  };
}

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");

  // 全店舗取得（読み取り専用）
  const { data: storeList, error: storeError } = await supabase
    .from("stores")
    .select("id, name, email, status")
    .order("created_at", { ascending: false });

  if (storeError || !storeList) {
    return NextResponse.json(
      { error: storeError?.message || "stores取得失敗" },
      { status: 500 },
    );
  }

  // 全Authユーザー取得（読み取り専用）
  const authUsers = await getAllAuthUsers();

  // 検索用インデックスを構築（メモリ内、DB変更なし）
  const authById = new Map(authUsers.map(u => [u.id, u]));
  const authByEmail = new Map(
    authUsers
      .filter(u => u.email)
      .map(u => [u.email!.toLowerCase(), u]),
  );

  // 突き合わせ（読み取りのみ）
  const results: AuthCheckResult[] = storeList.map(store => {
    const idIsUuid = UUID_REGEX.test(store.id);
    const foundById = authById.get(store.id);
    const foundByEmail = authByEmail.get(store.email?.toLowerCase() ?? "");

    const authUserExists = !!(foundById ?? foundByEmail);
    const idMatchesAuth = !!foundById;
    const emailMatchesAuth = !!foundByEmail;

    const authUser = foundById ?? foundByEmail ?? null;
    const { recommendation, severity } = classify(authUserExists, idMatchesAuth, emailMatchesAuth);

    return {
      store_name: store.name,
      store_id: store.id,
      store_email: store.email ?? "",
      store_status: store.status ?? "",
      id_is_uuid: idIsUuid,
      auth_user_exists: authUserExists,
      id_matches_auth_uuid: idMatchesAuth,
      email_matches_auth: emailMatchesAuth,
      auth_uuid: authUser?.id ?? null,
      auth_email: authUser?.email ?? null,
      recommendation,
      severity,
    };
  });

  // サマリー
  const summary = {
    total: results.length,
    ok: results.filter(r => r.severity === "ok").length,
    warn: results.filter(r => r.severity === "warn").length,
    error: results.filter(r => r.severity === "error").length,
    no_auth: results.filter(r => !r.auth_user_exists).length,
    id_mismatch_only: results.filter(r => r.auth_user_exists && !r.id_matches_auth_uuid && r.email_matches_auth).length,
    email_mismatch_only: results.filter(r => r.auth_user_exists && r.id_matches_auth_uuid && !r.email_matches_auth).length,
  };

  if (format === "csv") {
    const BOM = "﻿"; // Excel日本語対応
    const headers = [
      "店舗名",
      "stores.id",
      "stores.email",
      "契約状態",
      "IDはUUID",
      "Auth登録有無",
      "ID一致",
      "email一致",
      "Auth UUID",
      "Auth email",
      "修復推奨",
      "重要度",
    ];

    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    const rows = results.map(r =>
      [
        r.store_name,
        r.store_id,
        r.store_email,
        r.store_status,
        r.id_is_uuid ? "○" : "×",
        r.auth_user_exists ? "○" : "×",
        r.id_matches_auth_uuid ? "○" : "×",
        r.email_matches_auth ? "○" : "×",
        r.auth_uuid ?? "",
        r.auth_email ?? "",
        r.recommendation,
        r.severity === "ok" ? "正常" : r.severity === "warn" ? "要確認" : "要修復",
      ]
        .map(escape)
        .join(","),
    );

    const csv = BOM + [headers.map(escape).join(","), ...rows].join("\r\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="auth-check-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ summary, results });
}
