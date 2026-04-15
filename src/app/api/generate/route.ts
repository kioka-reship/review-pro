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

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return Response.json({
        text: "ANTHROPIC_API_KEY が未設定です。",
      });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json({
        text: `Claude APIエラー: ${data?.error?.message || "不明なエラー"}`,
      });
    }

    const text =
      data?.content?.find((item: any) => item?.type === "text")?.text ||
      "文章を取得できませんでした。";

    return Response.json({ text });
  } catch (error: any) {
    return Response.json({
      text: `サーバーエラー: ${error?.message || "不明なエラー"}`,
    });
  }
}
