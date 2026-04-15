export async function POST(req: Request) {
  try {
    const { store, answers, style } = await req.json();

    const prompt = `あなたはGoogleの口コミ文章を自然に書くアシスタントです。
以下の情報をもとに、実際のお客様が書いたような自然な口コミ文（150〜200文字）を日本語で生成してください。

店舗: ${store.name}（${store.type}）
評価: ${answers.rating}点/5点
良かった点: ${answers.highlight.join("、")}
一言: ${answers.feel}
文体の指定: ${style.prompt}

宣伝文にならず、リアルで温かみのある口コミ文のみを出力してください。前置き・説明は不要です。`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await res.json();
    const text = data?.content?.[0]?.text || "";

    return Response.json({ text });
  } catch (error) {
    return Response.json(
      { text: "口コミ文の生成に失敗しました。" },
      { status: 500 }
    );
  }
}
