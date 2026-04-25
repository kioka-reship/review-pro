import { createClient } from "@supabase/supabase-js";

// モジュールスコープでは初期化しない（Next.jsビルド時にenv未設定でクラッシュするため）
// 各ハンドラ内でこの関数を呼び出すこと
export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
