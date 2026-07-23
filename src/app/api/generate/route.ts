import { getAdminClient } from "../../../lib/supabase-admin";

const NG_WORDS = [
  "殺", "死ね", "バカ", "アホ", "クソ", "最悪", "詐欺", "偽物",
  "ゴミ", "うざい", "きもい", "差別", "ヘイト",
];

function containsNgWord(text: string): boolean {
  return NG_WORDS.some(word => text.includes(word));
}

const PLAN_LIMITS: Record<string, number> = {
  light: 10,
  standard: 20,
  premium: 99999,
};

async function getMonthlySessionCount(supabase: ReturnType<typeof getAdminClient>, storeId: string): Promise<number> {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { data } = await supabase
    .from("qr_access_logs")
    .select("session_id")
    .eq("store_id", storeId)
    .not("session_id", "is", null)
    .gte("created_at", firstDay)
    .lte("created_at", lastDay);

  if (!data) return 0;
  const uniqueSessions = new Set(data.map((row: any) => row.session_id));
  return uniqueSessions.size;
}

async function getSessionGenerationCount(supabase: ReturnType<typeof getAdminClient>, sessionId: string): Promise<number> {
  const { count } = await supabase
    .from("usage")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);
  return count || 0;
}

type LangCode = "ja" | "en" | "zh" | "ko";

interface LangConfig {
  systemPrompt: string;
  stylePrompts: Record<string, string>;
  charRange: string;
  outputInstruction: string;
}

const LANG_CONFIGS: Record<LangCode, LangConfig> = {
  ja: {
    systemPrompt: "あなたは年代・性別・状況に応じて自然な口コミを書く一般人です。広告や宣伝文は絶対に書きません。",
    stylePrompts: {
      casual: "フレンドリーで話し言葉っぽい、親しみやすい文体で",
      honest: "本音っぽく、飾らないリアルな体験談として",
      formal: "丁寧で落ち着いた、信頼感のある文体で",
    },
    charRange: "",
    outputInstruction: "口コミ文のみ出力。前置き・説明・かぎかっこは不要",
  },
  en: {
    systemPrompt: "You are a genuine customer writing a natural Google review. Never write advertising or promotional text.",
    stylePrompts: {
      casual: "friendly and conversational, like talking to a friend",
      honest: "genuine and straightforward, authentic real experience",
      formal: "polite and professional, trustworthy tone",
    },
    charRange: "50–130 words",
    outputInstruction: "Output the review text only. No preamble, explanation, or quotation marks.",
  },
  zh: {
    systemPrompt: "你是一位普通顾客，正在撰写真实的Google评价。绝对不写广告或宣传文字。",
    stylePrompts: {
      casual: "亲切友好，口语化表达，像和朋友聊天一样",
      honest: "真实直白，分享真实体验，不加修饰",
      formal: "礼貌正式，措辞得体，值得信赖的语气",
    },
    charRange: "80～200字",
    outputInstruction: "只输出评价正文，不需要前言、解释或引号。",
  },
  ko: {
    systemPrompt: "당신은 진솔한 Google 리뷰를 작성하는 일반 고객입니다. 광고나 홍보 문구는 절대 쓰지 마세요.",
    stylePrompts: {
      casual: "친근하고 대화체로, 친구에게 말하듯 자연스럽게",
      honest: "솔직하고 담담하게, 실제 경험담처럼",
      formal: "정중하고 차분하게, 신뢰감 있는 문체로",
    },
    charRange: "80～200자",
    outputInstruction: "리뷰 본문만 출력하세요. 서문, 설명, 따옴표 불필요.",
  },
};

export async function POST(req: Request) {
  const supabase = getAdminClient();
  try {
    const { store, answers, style, session_id, language } = await req.json();
    const lang: LangCode = (language as LangCode) || "ja";
    const storeId = store?.id;

    if (storeId) {
      const { data: storeData } = await supabase
        .from("stores")
        .select("plan, status")
        .eq("id", storeId)
        .single();

      if (!storeData || storeData.status !== "契約中") {
        return Response.json({ error: "契約が有効ではありません" }, { status: 403 });
      }

      // セッション内3回まで
      if (session_id) {
        const sessionCount = await getSessionGenerationCount(supabase, session_id);
        if (sessionCount >= 3) {
          return Response.json({
            error: "1回のQR読み取りで生成できるのは最大3回までです。QRコードを再度読み取ってください。"
          }, { status: 429 });
        }
      }

      // 月間QRスキャン数チェック
      const limit = PLAN_LIMITS[storeData.plan] || 10;
      const monthlyScans = await getMonthlySessionCount(supabase, storeId);

      if (session_id && monthlyScans >= limit) {
        const { data: existingLog } = await supabase
          .from("qr_access_logs")
          .select("id")
          .eq("store_id", storeId)
          .eq("session_id", session_id)
          .maybeSingle();

        if (!existingLog) {
          return Response.json({
            error: `今月のQR読み取り上限（${limit}回）に達しました。プランのアップグレードをご検討ください。`
          }, { status: 429 });
        }
      }

      // 使用記録
      await supabase.from("usage").insert({
        store_id: storeId,
        session_id: session_id || null,
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

    // 人数のみの回答（2人・3〜4人・5人以上）では「友人」「知人」等の具体的な関係性を創作しない。
    // 「家族」「カップル」は回答自体に関係性が含まれるためそのまま使用する。
    const partyStyleMap: Record<string, string[]> = {
      "1人": ["一人で利用しました", "一人で訪問しました"],
      "2人": ["2人で利用しました", "2人で訪問しました"],
      "3〜4人": ["数人で利用しました", "数人で訪問しました"],
      "5人以上": ["大人数で利用しました", "グループで訪問しました"],
      "家族": ["家族で訪問しました", "家族と一緒に利用しました"],
      "カップル": ["パートナーと利用しました", "カップルで訪問しました"],
    };

    const langCfg = LANG_CONFIGS[lang] ?? LANG_CONFIGS.ja;
    const styleKey = (style?.key as string) || "casual";
    const stylePrompt = langCfg.stylePrompts[styleKey] || langCfg.stylePrompts.casual;

    const details: { label: string; answer: string }[] = Array.isArray(answers?.details) ? answers.details : [];

    // F: 最終的にAIへ渡す回答内容をログ出力（選択式のみのため個人情報は含まれない。gender/ageは念のため除外）
    console.log("[generate] answers_debug", {
      store_id: storeId,
      store_type: store?.type,
      rating: answers?.rating,
      highlight: answers?.highlight,
      partySize: answers?.partySize,
      summary: answers?.summary,
      details,
    });

    let prompt: string;

    if (lang === "ja") {
      const ageStyle = ageStyleMap[answers?.age] || "自然な日常会話的な文体で";
      const partyOptions = partyStyleMap[answers?.partySize] || [""];
      const partyIntro = partyOptions[Math.floor(Math.random() * partyOptions.length)];
      const minChars = Math.floor(Math.random() * 3) === 0 ? 80 : Math.floor(Math.random() * 2) === 0 ? 120 : 180;
      const maxChars = minChars + 60;
      const detailsText = details.map((d) => `${d.label}: ${d.answer}`).join("\n");
      const genderText = answers?.gender && answers.gender !== "回答しない" ? `性別: ${answers.gender}` : "";

      prompt = `あなたはGoogleの口コミを書く一般のお客さんです。以下の条件で口コミ文を書いてください。

【お店の情報】
店舗: ${store?.name || ""}
業種: ${store?.type || ""}
評価: ${answers?.rating || 0}点/5点
${detailsText}
良かった点: ${highlight}
一言: ${answers?.summary || ""}

【書き手の情報】
${genderText}
年代: ${answers?.age || "不明"}
来店人数のヒント: ${partyIntro}

【文体の指示】
${ageStyle}
文体スタイル: ${stylePrompt}

【必須ルール】
・文字数は${minChars}〜${maxChars}文字程度
・店名を文章の最初に入れない（不自然なため）
・宣伝文・広告っぽい表現は絶対に使わない
・「〜させていただきます」などの過剰敬語は使わない
・実際に体験した人が書いたようなリアルな文章にする
・「${partyIntro}」という状況を自然に織り込む（無理に入れなくてもよい）
・感嘆符（！）や疑問符（？）の使用は年代に合わせて自然に
・回答にない同行者（友人・家族・カップルなど）を創作しない
・回答にない料理・味・メニュー・注文内容・施術内容を創作しない
・店舗情報や回答に含まれていない内容は一切書かない
・ユーザーの回答に含まれる事実のみを使用する
・店舗の業種（${store?.type || ""}）に合わない表現は使わない
・来店人数が「1人」の場合、「友人と」「家族と」等へ勝手に変換しない
・${langCfg.outputInstruction}`;
    } else {
      const detailsText = details.map((d) => `${d.label}: ${d.answer}`).join("\n");
      prompt = `Write a Google review for the following store. Output ONLY in ${lang === "en" ? "English" : lang === "zh" ? "Simplified Chinese" : "Korean"}.

Store: ${store?.name || ""}
Type: ${store?.type || ""}
Rating: ${answers?.rating || 0}/5 stars
${detailsText}
Highlights: ${highlight || "general experience"}
Comment: ${answers?.summary || ""}

Writing style: ${stylePrompt}
Length: approximately ${langCfg.charRange}

Rules:
- Do not start the review with the store name
- Never use advertising or promotional language
- Write as a genuine visitor who actually experienced this place
- Do not invent companions (friends, family, partner, etc.) that are not stated in the answers
- Do not invent food, taste, menu items, orders, or treatment details that are not stated in the answers
- Do not write about anything not present in the store info or answers
- Use only facts contained in the user's answers
- Do not use wording that doesn't fit the store's business type (${store?.type || ""})
- If the party size answer is "alone" (1 person), do not turn it into "with a friend" / "with family"
- ${langCfg.outputInstruction}`;
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: langCfg.systemPrompt },
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

    if (lang === "ja" && containsNgWord(text)) {
      text = "申し訳ありません。生成された文章に不適切な表現が含まれていたため、再生成してください。";
    }

    if (text.length < 10 || text.length > 800) {
      text = lang === "ja"
        ? "文章の生成に問題が発生しました。もう一度お試しください。"
        : "Failed to generate review text. Please try again.";
    }

    return Response.json({ text });

  } catch (error: any) {
    return Response.json({ text: `サーバーエラー: ${error?.message || "不明なエラー"}` });
  }
}
