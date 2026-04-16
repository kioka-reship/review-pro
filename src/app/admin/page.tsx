import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 業種別デフォルト質問
const DEFAULT_QUESTIONS: Record<string, { label: string; type: string; options: string[] | null }[]> = {
  "飲食店": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご注文のメニューは？", type: "select", options: ["ラーメン", "餃子", "チャーハン", "定食", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["料理・味", "スタッフの接客", "お店の雰囲気", "価格・コスパ", "立地・アクセス"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "友人に勧めたい", "期待以上だった", "コスパ最高！"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "美容脱毛": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のメニューは？", type: "select", options: ["全身脱毛", "顔脱毛", "VIO脱毛", "脚脱毛", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["施術の効果", "スタッフの対応", "サロンの清潔感", "価格・コスパ", "予約のしやすさ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "友人に勧めたい", "期待以上だった", "安心して通える"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "美容室": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のメニューは？", type: "select", options: ["カット", "カラー", "パーマ", "トリートメント", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["仕上がり・技術", "スタッフの対応", "お店の清潔感", "価格・コスパ", "予約のしやすさ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "指名したい！", "イメージ通り！", "リラックスできた"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "整体・接骨院": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のメニューは？", type: "select", options: ["整体", "鍼灸", "マッサージ", "骨盤矯正", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["施術の効果", "先生の説明", "院内の清潔感", "予約のしやすさ", "アクセスの良さ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "体が楽になった", "丁寧に診てもらえた", "友人に勧めたい"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "小売・物販": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "どのような商品をご購入されましたか？", type: "select", options: ["衣類・ファッション", "食品・飲料", "日用品", "電化製品", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["商品のクオリティ", "スタッフの接客", "商品の豊富さ", "価格・コスパ", "店内の雰囲気"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "良い買い物ができた", "品揃えが最高", "スタッフが親切"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
};

const getDefaultQuestions = (type: string) => {
  return DEFAULT_QUESTIONS[type] || DEFAULT_QUESTIONS["飲食店"];
};

// 全店舗取得
export async function GET() {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stores: data });
}

// 店舗追加
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, owner_name, email, password, plan, place_id } = body;

  if (!name || !email || !place_id) {
    return NextResponse.json({ error: "name, email, place_id は必須です" }, { status: 400 });
  }

  const id = type.slice(0, 3).toLowerCase().replace(/[^a-z]/g, "") + "-" + Date.now().toString().slice(-6);

  const { data, error } = await supabase
    .from("stores")
    .insert({ id, name, type, owner_name, email, password, plan, place_id, status: "active" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 業種に合わせたデフォルト質問を自動登録
  const defaultQs = getDefaultQuestions(type);
  const questionRows = defaultQs.map((q, i) => ({
    store_id: id,
    order_num: i + 1,
    label: q.label,
    type: q.type,
    options: q.options,
  }));

  await supabase.from("questions").insert(questionRows);

  return NextResponse.json({ store: data });
}

// 店舗更新（停止・再開・プラン変更）
export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json();

  const { error } = await supabase
    .from("stores")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
