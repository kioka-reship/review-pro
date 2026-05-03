import { createClient } from "@supabase/supabase-js";

// モジュールスコープでは初期化しない（Next.jsビルド時にenv未設定でクラッシュするため）
// 各ハンドラ内でこの関数を呼び出すこと
//
// !! サーバーサイド (API route) での使い分けルール !!
// - DB操作・Auth操作 → 必ず getAdminClient() を使うこと
//   理由: NEXT_PUBLIC_SUPABASE_ANON_KEY はサーバー側で未設定のケースがあり、
//         getAnonClient() で signInWithPassword を呼ぶと常に401になる。
//         getAdminClient() (service role key) はパスワード検証を正しく行いつつ安定動作する。
// - getAnonClient() はクライアントサイド（ブラウザ）での読み取り専用操作にのみ使用すること
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
