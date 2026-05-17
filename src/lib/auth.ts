import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "./supabase-admin";

/** 管理者Cookie検証。OKならnull、NGなら401レスポンス */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const token = req.cookies.get("admin_auth")?.value;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || token !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** ユーザーCookie検証 + 店舗所有確認。OKならnull、NGなら401/403レスポンス */
export async function requireStoreOwner(
  req: NextRequest,
  storeId: string,
): Promise<NextResponse | null> {
  const supabase = getAdminClient();
  const token = req.cookies.get("store_auth")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // UUID一致（サインアップ経由の通常店舗）
  if (user.id === storeId) return null;

  // メール一致（管理画面追加の店舗：store.idが非UUID）
  const { data: store } = await supabase
    .from("stores")
    .select("email")
    .eq("id", storeId)
    .single();

  if (!store || store.email?.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/**
 * 管理者または自店舗ユーザーを許可。
 * 戻り値: "admin" | "user" | NextResponse（401/403）
 */
export async function requireAdminOrStoreOwner(
  req: NextRequest,
  storeId?: string,
): Promise<"admin" | "user" | NextResponse> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminToken = req.cookies.get("admin_auth")?.value;

  if (adminPassword && adminToken === adminPassword) return "admin";

  if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = await requireStoreOwner(req, storeId);
  if (guard) return guard;
  return "user";
}
