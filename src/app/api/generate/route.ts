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

export async function POST(req: Request) {
  try {
    const { store, answers, style } = await req.json();

    const storeId = store?.id;

    // 回数制限チェック
    if (storeId) {
      const { data: storeData } = await supabase
        .from("stores")
        .select("plan, status")
        .eq("id", storeId)
        .single();

      if (!storeData || storeData.status !== "契約中") {
        return Response.json({ error: "契約が有効ではありません" }, { status: 403 });
      }

      const limit = PLAN_LIMITS[storeData.plan] || 10;
      const used = await getMonthlyUsage(storeId);

      if (used >= limit) {
        return Response.json({
          error: `今月の生成回数の上限（${limit}回）に達しました。プランのアップグレードをご検討ください。`
        }, { status: 429 });
      }

      // 使用回数を記録
      await supabase.from("usage").insert({
        store_id: storeId,
        created_at: new Date().toISOString(),
      });
    }

    const highlight = Array.isArray(answers?.highlight)
      ? answers.highlight.join("、")
      : "";

    const ageStyleMap: Record<string, string> = {
      "10代": "10代らしいカジュアルで短めの文体。絵文字は使わない。「〜だった」「〜よかった」など。",
      "20代": "20代らしいフレンドリーな文体。テンション高め。「めっちゃ」「すごく」など口語的に。",
      "30代": "30代らしい落ち着いた文体。仕事帰りや友人との外食感を出す。",
      "40代": "40代らしい丁寧だが親しみやすい文体。家族や同僚との利用感を出す。",
      "50代以上": "50代以上らしい丁寧で落ち着いた文体。「〜でございました」は使わず自然に。",
    };

    const partyStyleMap: Record<string, string[]> = {
      "1人": ["一人でふらっと立ち寄りました", "仕事帰りに一人で", "一人で訪問しました"],
      "2人": ["友人と2人で", "2人で利用しました", "知人と一緒に"],
      "3〜4人": ["3人で訪れました", "友人グループで", "数人で利用しました"],
      "5人以上": ["大人数で利用しました", "グループで訪問しました"],
      "家族": ["家族で訪問しました", "子供を連れて家族で", "家族みんなで"],
      "カップル": ["パートナーと2人で", "デートで利用しました", "彼女と一緒に"],
    };

    const ageStyle = ageStyleMap[answers?.age] || "自然な日常会話的な文体で";
    const partyOptions = partyStyleMap[answers?.party] || [""];
    const partyIntro = partyOptions[Math.floor(Math.random() * partyOptions.length)];

    const minChars = Math.floor(Math.random() * 3) === 0 ? 80 : Math.floor(Math.random() * 2) === 0 ? 120 : 180;
    const maxChars = minChars + 60;

    const menuText = answers?.menu ? `注文したメニュー: ${answers.menu}` : "";
    const genderText = answers?.gender && answers.gender !== "回答しない" ? `性別: ${answers.gender}` : "";

    const prompt = `あなたはGoogleの口コミを書く一般のお客さんです。以下の条件で口コミ文を書いてください。

【お店の情報】
店舗: ${store?.name || ""}
業種: ${store?.type || ""}
評価: ${answers?.rating || 0}点/5点
${menuText}
良かった点: ${highlight}
一言: ${answers?.feel || ""}

【書き手の情報】
${genderText}
年代: ${answers?.age || "不明"}
来店人数のヒント: ${partyIntro}

【文体の指示】
${ageStyle}
文体スタイル: ${style?.prompt || "自然な文体で"}

【必須ルール】
・文字数は${minChars}〜${maxChars}文字程度
・店名を文章の最初に入れない（不自然なため）
・宣伝文・広告っぽい表現は絶対に使わない
・「〜させていただきます」などの過剰敬語は使わない
・実際に体験した人が書いたようなリアルな文章にする
・「${partyIntro}」という状況を自然に織り込む（無理に入れなくてもよい）
・感嘆符（！）や疑問符（？）の使用は年代に合わせて自然に
・口コミ文のみ出力。前置き・説明・かぎかっこは不要`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "あなたは年代・性別・状況に応じて自然な口コミを書く一般人です。広告や宣伝文は絶対に書きません。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.95,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json({ text: `OpenAIエラー: ${data?.error?.message || "不明なエラー"}` });
    }

    let text = data?.choices?.[0]?.message?.content || "";

    // NGワードチェック
    if (containsNgWord(text)) {
      text = "申し訳ありません。生成された文章に不適切な表現が含まれていたため、再生成してください。";
    }

    // 文字数チェック（極端に短い・長い場合）
    if (text.length < 20 || text.length > 500) {
      text = "文章の生成に問題が発生しました。もう一度お試しください。";
    }

    return Response.json({ text });

  } catch (error: any) {
    return Response.json({ text: `サーバーエラー: ${error?.message || "不明なエラー"}` });
  }
}
