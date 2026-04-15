// src/app/api/generate/route.ts
// AIで口コミ文を生成するAPIエンドポイント
// APIキーはサーバー側のみで使用（クライアントに漏れない）

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STYLE_PROMPTS: Record<string, string> = {
  casual: "フレンドリーで話し言葉っぽい、親しみやすい文体で",
  honest: "本音っぽく、飾らないリアルな体験談として",
  formal: "丁寧で落ち着いた、信頼感のある文体で",
};

const RATING_LABELS: Record<number, string> = {
  1: "残念でした", 2: "もう少し", 3: "普通", 4: "良かった！", 5: "最高でした！",
};

export async function POST(req: NextRequest) {
  try {
    const { storeId, storeName, storeType, answers, style } = await req.json();

    // 利用数チェック（Supabaseと連携する場合はここで確認）
    // const usage = await checkUsage(storeId);
    // if (usage.exceeded) return NextResponse.json({ error: "上限超過" }, { status: 429 });

    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.casual;

    const prompt = `あなたはGoogleの口コミ文章を自然に書くアシスタントです。
以下の情報をもとに、実際のお客様が書いたような自然な口コミ文（150〜200文字）を日本語で生成してください。

店舗: ${storeName}（${storeType}）
評価: ${answers.rating}点/5点（${RATING_LABELS[answers.rating]}）
良かった点: ${answers.highlight.join("、")}
一言: ${answers.feel}
文体の指定: ${stylePrompt}

宣伝文にならず、リアルで温かみのある口コミ文のみを出力してください。前置き・説明は不要です。`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // 利用数を+1（Supabaseと連携する場合）
    // await incrementUsage(storeId);

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: "生成に失敗しました" }, { status: 500 });
  }
}
