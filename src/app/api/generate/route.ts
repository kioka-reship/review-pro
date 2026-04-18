import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// NGワードリスト
const NG_WORDS = [
  "殺", "死ね", "バカ", "アホ", "クソ", "最悪", "詐欺", "偽物",
  "ゴミ", "うざい", "きもい", "差別", "ヘイト",
];

function containsNgWord(text: string): boolean {
  return NG_WORDS.some(word => text.includes(word));
}

// プラン別上限
const PLAN_LIMITS: Record<string, number> = {
  light: 10,
  standard: 20,
  premium: 99999,
};

// 今月の使用回数を取得
async function getMonthlyUsage(storeId: string): Promise<number> {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { count } = await supabase
    .from("usage")
    .select("*", { count: "exact", head: true })
    .eq("store_id", storeId)
    .gte("created_at", firstDay)
    .lte("created_at", lastDay);

  return count || 0;
}

export a
