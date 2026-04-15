export async function POST(req: Request) {
  try {
    const { store, answers, style } = await req.json();

    const highlight = Array.isArray(answers?.highlight)
      ? answers.highlight.join("、")
      : "";

    const prompt = `あなたはGoogleの口コミ文章を自然に書くアシスタントです。
以下の情報をもとに、実際のお客様が書いたような自然な口コミ文（150〜200文字）を日本語で生成してください。

店舗: ${store?.name || ""}
業種: ${store?.type || ""}
評価: ${answers?.rating || 0}点/5点
良かった点: ${highlight}
一言: ${answers?.feel || ""}
文体の指定: ${style?.prompt || ""}

宣伝文にならず、リアルで温かみのある口コミ文のみを出力してください。前置き・説明は不要です。`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "あなたは自然な口コミを書くプロです。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json({
        text: `OpenAIエラー: ${data?.error?.message || "不明なエラー"}`,
      });
    }

    const text = data?.choices?.[0]?.message?.content || "";

    return Response.json({ text });
  } catch (error: any) {
    return Response.json({
      text: `サーバーエラー: ${error?.message || "不明なエラー"}`,
    });
  }
}
