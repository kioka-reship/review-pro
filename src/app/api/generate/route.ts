import { getAdminClient } from "../../../lib/supabase-admin";
import {
  computePermittedCategories,
  validatePattern,
  buildSafeFallbackText,
  buildUltimateSafeText,
  type StyleKey,
  type FactCheckAnswers,
  type FactCheckStore,
} from "../../../lib/reviewFactCheck";

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

// 年代による違いは文体・語彙・落ち着き方のみに限定する。年代から同行者・利用目的・
// 「仕事帰り」「家族」「友人」「同僚」「外食」等の状況を推測・創作する指示は入れない。
const ageStyleMap: Record<string, string> = {
  "10代": "10代らしいカジュアルで短めの文体。絵文字は使わない。「〜だった」「〜よかった」など。",
  "20代": "親しみやすく自然な文体。明るく軽やかだが、砕けすぎない。",
  "30代": "自然で落ち着いた文体。具体的で読みやすく、過度に若者言葉を使わない。",
  "40代": "丁寧で親しみやすい文体。落ち着きと信頼感のある表現にする。",
  "50代以上": "簡潔で丁寧な文体。誇張を避け、分かりやすく自然にまとめる。",
};

// 人数のみの回答（1人・2人・3〜4人・5人以上）では「友人」「知人」等の具体的な関係性を創作しない。
// 「家族」「カップル」は回答自体に関係性が含まれるためそのまま使用する。
const partyStyleMap: Record<string, string[]> = {
  "1人": ["一人で利用しました", "一人で訪問しました"],
  "2人": ["2人で利用しました", "2人で訪問しました"],
  "3〜4人": ["数人で利用しました", "数人で訪問しました"],
  "5人以上": ["大人数で利用しました", "グループで訪問しました"],
  "家族": ["家族で訪問しました", "家族と一緒に利用しました"],
  "カップル": ["パートナーと利用しました", "カップルで訪問しました"],
};

// partySizeの回答区分: 数値系（人数のみ・関係性情報を含まない）か、関係性系（家族・カップル）か。
const COUNT_ONLY_PARTY_VALUES = new Set(["1人", "2人", "3〜4人", "5人以上"]);
type PartyCategory = "count" | "relationship" | "none";
function getPartyCategory(partySize: string | undefined): PartyCategory {
  if (!partySize) return "none";
  if (COUNT_ONLY_PARTY_VALUES.has(partySize)) return "count";
  if (partyStyleMap[partySize]) return "relationship";
  return "none";
}

// MEO: 3パターンの書き出し・構成を変え、コピペ調（似た構造の使い回し）を防ぐ。
// 事実の根拠（回答内容）は3パターンとも同じものを使う。
const structureHintMap: Record<LangCode, Record<string, string>> = {
  ja: {
    casual: "書き出しは来店のきっかけや第一印象から自然に入る",
    honest: "書き出しは具体的な体験内容から入る（結論を先に言わない）",
    formal: "書き出しは全体的な感想・評価から落ち着いて入る",
  },
  en: {
    casual: "Start with your first impression or what brought you there",
    honest: "Start with a specific detail from the experience, not the conclusion",
    formal: "Start with an overall calm assessment",
  },
  zh: {
    casual: "开头从第一印象或到访契机自然写起",
    honest: "开头从具体的体验细节写起，不要先下结论",
    formal: "开头从整体感受平和地写起",
  },
  ko: {
    casual: "첫인상이나 방문 계기로 자연스럽게 시작",
    honest: "결론을 먼저 말하지 않고 구체적인 경험부터 시작",
    formal: "전체적인 감상으로 차분하게 시작",
  },
};

interface PromptContext {
  lang: LangCode;
  store: any;
  answers: any;
  details: { label: string; answer: string }[];
  highlight: string;
  hasSpecificType: boolean;
  hasPartyInfo: boolean;
  partyIntro: string;
  partyCategory: PartyCategory;
  genderText: string;
  ageStyle: string;
}

function buildContext(lang: LangCode, store: any, answers: any): PromptContext {
  const highlight = Array.isArray(answers?.highlight) ? answers.highlight.join("、") : "";
  const details: { label: string; answer: string }[] = Array.isArray(answers?.details) ? answers.details : [];
  const hasSpecificType = !!store?.type && store.type !== "その他";
  const hasPartyInfo = !!answers?.partySize && !!partyStyleMap[answers.partySize];
  const partyOptions = partyStyleMap[answers?.partySize] || [""];
  const partyIntro = partyOptions[Math.floor(Math.random() * partyOptions.length)];
  const partyCategory = getPartyCategory(answers?.partySize);
  const genderText = answers?.gender && answers.gender !== "回答しない" ? `性別: ${answers.gender}` : "";
  const ageStyle = ageStyleMap[answers?.age] || "自然な日常会話的な文体で";

  return { lang, store, answers, details, highlight, hasSpecificType, hasPartyInfo, partyIntro, partyCategory, genderText, ageStyle };
}

function buildSharedJaBlock(ctx: PromptContext): string {
  const { store, answers, details, highlight, hasSpecificType, hasPartyInfo, genderText, ageStyle, partyCategory } = ctx;
  const detailsText = details.map((d) => `${d.label}: ${d.answer}`).join("\n");

  // 「2人」「3〜4人」「5人以上」は人数情報のみで関係性情報を含まない。「家族」「カップル」は
  // 回答自体に関係性が含まれる場合のみ、その語を使ってよい。未回答時は人数・同行者に一切触れない。
  const partyRuleStrong =
    partyCategory === "count"
      ? `・人数の回答（${ctx.partyIntro}）は人数情報のみであり、関係性情報ではない。「友人」「家族」「同僚」「恋人」「パートナー」「カップル」等の関係性を表す語や、「一緒に」「連れと」等の曖昧な同行者表現を一切使わない。使ってよいのは「${ctx.partyIntro}」のような人数の言い方までで、それ以上の関係性を推測して補わない`
      : partyCategory === "relationship"
      ? `・「${ctx.partyIntro}」という、回答に明記された関係性を自然に織り込んでよい（無理に入れなくてもよい）`
      : "・来店人数の回答がないため、「友人と」「家族と」「パートナーと」「一人で」等、同行者や人数を示す表現を一切使わない（未来の予定「また友人と来たい」等も含めて使わない）";

  const partyRuleReminder =
    partyCategory === "count"
      ? `・「${ctx.partyIntro}」という人数の表現までは使ってよいが、無理に入れなくてもよく、不自然な場合は省略する。人数から関係性（友人・家族・同僚等）を絶対に創作しない`
      : partyCategory === "relationship"
      ? `「${ctx.partyIntro}」という状況を自然に織り込む（無理に入れなくてもよい）`
      : "来店人数の回答がないため、同行者や人数（一人・友人と・家族となど）について一切言及しない";

  return `【お店の情報】
店舗: ${store?.name || ""}
業種: ${store?.type || ""}
評価: ${answers?.rating || 0}点/5点
${detailsText}
良かった点: ${highlight}
一言: ${answers?.summary || ""}

【書き手の情報】
${genderText}
年代: ${answers?.age || "不明"}
${hasPartyInfo ? `来店人数のヒント: ${ctx.partyIntro}` : ""}

【文体の指示】
${ageStyle}

【最重要ルール（最優先で守ること）】
・体験の具体的な感想（料理の味、施術の効果、商品の質、接客対応の詳細、清潔感、価格、待ち時間など）は、上の【お店の情報】に明記されている項目についてのみ書いてよい
・明記されていない体験カテゴリについては、業種（${store?.type || ""}）から連想される一般的な内容（例：飲食店だから「料理が美味しかった」、美容系だから「効果を感じた」等）を絶対に補って書かない。書けるのは「雰囲気が良かった」「また利用したい」等の一般的な感想のみにとどめる
${partyRuleStrong}
・上記に反する場合、その口コミは無効とみなす

【必須ルール】
・店名を文章の最初に入れない（不自然なため）
・宣伝文・広告っぽい表現は絶対に使わない
・「〜させていただきます」などの過剰敬語は使わない
・実際に体験した人が書いたようなリアルな文章にする
・${partyRuleReminder}
・感嘆符（！）や疑問符（？）の使用は年代に合わせて自然に
${hasSpecificType ? `・業種（${store.type}）を連想させる自然な言葉を文中に1回程度含めてよい（無理に入れなくてもよく、同じ語を繰り返さない）` : "・業種が「その他」または未設定のため、特定業種を連想させる表現（料理・施術・接客スタイル等の業種固有ワード）は使わない"}
・地域名・サービス名・スタッフ名・商品名・価格・駐車場・駅近・予約の取りやすさ・待ち時間・利用目的など、回答や店舗情報に明記されていない情報は一切創作しない
・キーワードを詰め込んだ不自然なSEO文にしない。同じ語（地域名・業種名など）を何度も繰り返さない
・回答にない同行者（友人・家族・カップルなど）を創作しない
・回答にない料理・味・メニュー・注文内容・施術内容を創作しない
・店舗情報や回答に含まれていない内容は一切書かない
・ユーザーの回答に含まれる事実のみを使用する
・店舗の業種（${store?.type || ""}）に合わない表現は使わない
・来店人数が「1人」「2人」「3〜4人」「5人以上」等の数値のみの場合、「友人と」「家族と」「同僚と」「恋人と」「パートナーと」「カップルで」等へ勝手に変換しない。関係性を表す語は、回答が「家族」「カップル」など明示的な関係性そのものである場合にのみ使ってよい
・回答に含まれていない体験の具体的内容（特に料理・味・施術効果など）を書いていないか、出力前にもう一度確認すること
・「〜には触れません」「〜は不明です」等の言い訳・説明文は書かない。不明な情報は単純に触れずに省略する
・文章を出力する前に「友人」「家族」「同僚」「恋人」「パートナー」「カップル」という語を使っていないか再確認し、使っている場合は回答の人数・関係性の区分（上記参照）に本当に合致するかを必ず確認すること`;
}

function buildSharedOtherLangBlock(ctx: PromptContext): string {
  const { lang, store, answers, details, highlight, hasSpecificType } = ctx;
  const detailsText = details.map((d) => `${d.label}: ${d.answer}`).join("\n");
  const langName = lang === "en" ? "English" : lang === "zh" ? "Simplified Chinese" : "Korean";

  return `Store: ${store?.name || ""}
Type: ${store?.type || ""}
Rating: ${answers?.rating || 0}/5 stars
${detailsText}
Highlights: ${highlight || "general experience"}
Comment: ${answers?.summary || ""}

Output ONLY in ${langName}.

Rules:
- Do not start the review with the store name
- Never use advertising or promotional language
- Write as a genuine visitor who actually experienced this place
- ${hasSpecificType ? `You may naturally reference the business type (${store.type}) once, if it fits naturally — do not force it, and do not repeat the same word` : `The business type is "other" or unset, so do not use wording that implies a specific business type (e.g. food, treatment, or service-specific terms)`}
- Do not invent region names, service names, staff names, product names, prices, parking, station proximity, ease of booking, wait times, or purpose of visit that are not stated in the answers or store info
- Do not stuff keywords or write unnatural SEO-style text; do not repeat the same word (region, business type, etc.) multiple times
- Do not invent companions (friends, family, partner, etc.) that are not stated in the answers
- Do not invent food, taste, menu items, orders, or treatment details that are not stated in the answers
- Only describe specific experience details that are explicitly stated in the store info above. Do not fill in generic assumptions based on the business type (e.g. "the food was great" just because it's a restaurant, or "I felt the results" just because it's a beauty salon) unless the answers actually state it
- Do not write about anything not present in the store info or answers
- Use only facts contained in the user's answers
- Do not use wording that doesn't fit the store's business type (${store?.type || ""})
- If the party size answer is "alone" (1 person), do not turn it into "with a friend" / "with family"
- Do not write hedge/disclaimer sentences like "I won't mention the food" or "companions are unknown" — simply omit anything not stated`;
}

function buildSinglePrompt(ctx: PromptContext, styleKey: StyleKey): string {
  const { lang } = ctx;
  const langCfg = LANG_CONFIGS[lang] ?? LANG_CONFIGS.ja;
  const stylePrompt = langCfg.stylePrompts[styleKey] || langCfg.stylePrompts.casual;
  const structureHint = structureHintMap[lang]?.[styleKey] || structureHintMap.ja.casual;
  const minChars = Math.floor(Math.random() * 3) === 0 ? 80 : Math.floor(Math.random() * 2) === 0 ? 120 : 180;
  const maxChars = minChars + 60;

  if (lang === "ja") {
    return `あなたはGoogleの口コミを書く一般のお客さんです。以下の条件で口コミ文を書いてください。

${buildSharedJaBlock(ctx)}
・文字数は${minChars}〜${maxChars}文字程度
・${structureHint}
・文体スタイル: ${stylePrompt}
・${langCfg.outputInstruction}`;
  }

  return `Write a Google review for the following store.

${buildSharedOtherLangBlock(ctx)}
- ${structureHint}
- Writing style: ${stylePrompt}
- Length: approximately ${langCfg.charRange}
- ${langCfg.outputInstruction}`;
}

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<{ ok: boolean; content: string; error?: string }> {
  // 呼び出し回数の実測用ログ（本文は含まない）。1リクエストにつき必ず1回だけ呼ばれる。
  console.log("[generate] openai_call");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.95,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    // OpenAI呼び出し自体の失敗（認証・レート制限等）。ユーザーには決定的フォールバック文を
    // 返すため気づきにくくなる分、サーバーログには必ず残す。追加のAPI呼び出しは行わない。
    console.error("[generate] OpenAI API error", data?.error?.message || data);
    return { ok: false, content: "", error: data?.error?.message || "不明なエラー" };
  }
  return { ok: true, content: data?.choices?.[0]?.message?.content || "" };
}

// NGワード・文字数の基本チェック。不合格ならnullを返す（呼び出し側でフォールバックへ進む）。
function basicSanitize(text: string, lang: LangCode): string | null {
  if (!text) return null;
  const t = text.trim();
  if (lang === "ja" && containsNgWord(t)) return null;
  if (t.length < 5 || t.length > 800) return null;
  return t;
}

// 生成文を検証し、不合格ならフォールバック→さらに不合格なら最終安全文まで落とす。
// AI再生成は一切行わない（追加のAPI呼び出しは発生しない）。
function finalizePattern(
  rawText: string | null | undefined,
  lang: LangCode,
  styleKey: StyleKey,
  permitted: ReturnType<typeof computePermittedCategories>,
  answers: FactCheckAnswers,
  store: FactCheckStore
): string {
  const sanitized = rawText ? basicSanitize(rawText, lang) : null;
  if (sanitized) {
    const result = validatePattern(sanitized, permitted, store);
    if (result.ok) return sanitized;
  }

  const fallback = buildSafeFallbackText(answers, store, styleKey);
  const fallbackResult = validatePattern(fallback, permitted, store);
  if (fallbackResult.ok) return fallback;

  return buildUltimateSafeText(answers, store, styleKey);
}

export async function POST(req: Request) {
  try {
    const { store, answers, style, session_id, language } = await req.json();
    const lang: LangCode = (language as LangCode) || "ja";
    const storeId = store?.id;

    if (storeId) {
      const supabase = getAdminClient();
      const { data: storeData } = await supabase
        .from("stores")
        .select("plan, status")
        .eq("id", storeId)
        .single();

      if (!storeData || storeData.status !== "契約中") {
        return Response.json({ error: "契約が有効ではありません" }, { status: 403 });
      }

      // セッション内3回まで（初回3パターン生成は3回のAPI呼び出し=3行としてカウントされる）
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

    // F: 最終的にAIへ渡す回答内容をログ出力（選択式のみのため個人情報は含まれない。gender/ageは念のため除外）
    console.log("[generate] answers_debug", {
      store_id: storeId,
      store_type: store?.type,
      rating: answers?.rating,
      highlight: answers?.highlight,
      partySize: answers?.partySize,
      summary: answers?.summary,
      details: answers?.details,
    });

    const ctx = buildContext(lang, store, answers);
    const langCfg = LANG_CONFIGS[lang] ?? LANG_CONFIGS.ja;
    const permitted = computePermittedCategories(answers as FactCheckAnswers, store as FactCheckStore);

    const styleKey = (style?.key as StyleKey) || "casual";
    const prompt = buildSinglePrompt(ctx, styleKey);
    const result = await callOpenAI(langCfg.systemPrompt, prompt);
    const text = finalizePattern(result.ok ? result.content : null, lang, styleKey, permitted, answers, store);

    return Response.json({ text });

  } catch (error: any) {
    return Response.json({ text: `サーバーエラー: ${error?.message || "不明なエラー"}` });
  }
}
