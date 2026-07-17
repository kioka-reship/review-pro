import { LangCode } from "../../../lib/i18n";

const LANG_NAMES: Record<LangCode, string> = {
  ja: "Japanese",
  en: "English",
  zh: "Simplified Chinese",
  ko: "Korean",
};

export async function POST(req: Request) {
  try {
    const { questions, targetLang } = await req.json() as {
      questions: { id: number; label: string; type: string; options: string[] | null }[];
      targetLang: LangCode;
    };

    if (!questions?.length || !targetLang || targetLang === "ja") {
      return Response.json({ questions });
    }

    const langName = LANG_NAMES[targetLang] ?? "English";

    const itemsJson = JSON.stringify(
      questions.map(q => ({
        id: q.id,
        label: q.label,
        options: q.options ?? [],
      }))
    );

    const prompt = `Translate the following Japanese survey questions and their answer options to ${langName}.
Return ONLY valid JSON in exactly this format, no explanation:
[{"id": <number>, "label": "<translated label>", "options": ["<translated option>", ...]}]

Keep the same array order and the same number of elements. Translate naturally for a customer satisfaction survey context.

Japanese input:
${itemsJson}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a professional translator. Return only valid JSON, nothing else." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() ?? "";

    let translated: { id: number; label: string; options: string[] }[] = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) translated = parsed;
    } catch {
      return Response.json({ questions });
    }

    const translatedMap = new Map(translated.map(t => [t.id, t]));
    const result = questions.map(q => {
      const t = translatedMap.get(q.id);
      if (!t) return q;
      return { ...q, label: t.label || q.label, options: q.options ? t.options ?? q.options : null };
    });

    return Response.json({ questions: result });
  } catch {
    return Response.json({ questions: [] }, { status: 500 });
  }
}
