import { NextRequest, NextResponse } from "next/server";

const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@review-pro.jp";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email パラメーターが必要です" }, { status: 400 });
  }

  if (!BREVO_API_KEY) {
    return NextResponse.json({
      error: "BREVO_API_KEY が未設定です",
      from_email: FROM_EMAIL,
    }, { status: 500 });
  }

  const headers = {
    "api-key": BREVO_API_KEY,
    "Content-Type": "application/json",
  };

  const results: Record<string, unknown> = {
    checked_email: email,
    from_email: FROM_EMAIL,
    from_name: "REVIEW PRO",
    subject: "【REVIEW PRO】パスワード再設定",
  };

  // ① 直近の送信イベントログを取得
  try {
    const eventsRes = await fetch(
      `https://api.brevo.com/v3/smtp/statistics/events?email=${encodeURIComponent(email)}&limit=20&sort=desc`,
      { headers },
    );
    if (eventsRes.ok) {
      const eventsData = await eventsRes.json();
      results.smtp_events = eventsData?.events ?? [];
      results.smtp_events_count = (eventsData?.events ?? []).length;

      // イベントの種類を集計
      const summary: Record<string, number> = {};
      for (const ev of (eventsData?.events ?? [])) {
        summary[ev.event] = (summary[ev.event] ?? 0) + 1;
      }
      results.event_summary = summary;

      // 最新イベント
      const latest = eventsData?.events?.[0];
      if (latest) {
        results.latest_event = {
          event: latest.event,
          date: latest.date,
          subject: latest.subject,
          messageId: latest.messageId,
          reason: latest.reason ?? null,
        };
      }
    } else {
      const errBody = await eventsRes.json().catch(() => ({}));
      results.smtp_events_error = errBody;
    }
  } catch (e: any) {
    results.smtp_events_error = e?.message;
  }

  // ② Suppression（送信拒否リスト）確認
  try {
    const suppressRes = await fetch(
      `https://api.brevo.com/v3/contacts/blocklists`,
      { headers },
    );
    if (suppressRes.ok) {
      const suppressData = await suppressRes.json();
      results.blocklists = suppressData?.lists ?? [];
    }
  } catch (e: any) {
    results.blocklists_error = e?.message;
  }

  // ③ コンタクト情報確認（Brevo側にメールアドレスが登録されているか）
  try {
    const contactRes = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      { headers },
    );
    if (contactRes.ok) {
      const contactData = await contactRes.json();
      results.contact_exists = true;
      results.contact_email_blacklisted = contactData?.emailBlacklisted ?? null;
      results.contact_sms_blacklisted = contactData?.smsBlacklisted ?? null;
    } else if (contactRes.status === 404) {
      results.contact_exists = false;
      results.contact_note = "Brevo連絡先未登録（送信には影響なし）";
    } else {
      const errBody = await contactRes.json().catch(() => ({}));
      results.contact_error = errBody;
    }
  } catch (e: any) {
    results.contact_error = e?.message;
  }

  // ④ 原因分析
  const analysis: string[] = [];
  const events: any[] = (results.smtp_events as any[]) ?? [];
  const evSummary = (results.event_summary as Record<string, number>) ?? {};

  if (events.length === 0) {
    analysis.push("❌ Brevo に送信記録がない → BREVO_API_KEY が無効か、送信自体が失敗している可能性");
  }
  if (evSummary["blocked"]) {
    analysis.push(`❌ ${evSummary["blocked"]} 件 blocked → Brevo側でブロック（送信元ドメイン未認証の可能性）`);
  }
  if (evSummary["bounced"] || evSummary["hardBounce"] || evSummary["softBounce"]) {
    analysis.push("❌ bounce あり → 宛先メールアドレスが存在しないか受信拒否");
  }
  if (evSummary["spam"]) {
    analysis.push("⚠️ spam 報告あり → Gmail 迷惑メールフォルダに入っている可能性");
  }
  if (evSummary["delivered"]) {
    analysis.push(`✓ ${evSummary["delivered"]} 件 delivered → Brevo からは配信済み（Gmail側で迷惑メール判定の可能性）`);
  }
  if (evSummary["request"] && !evSummary["delivered"] && !evSummary["blocked"]) {
    analysis.push("⏳ request のみ → 配信処理中または遅延");
  }
  if (results.contact_email_blacklisted === true) {
    analysis.push("❌ Brevo の Suppression List に登録されている → 送信されない");
  }
  if (FROM_EMAIL === "noreply@review-pro.jp") {
    analysis.push("⚠️ FROM_EMAIL が環境変数未設定のデフォルト値 (noreply@review-pro.jp) → SPF/DKIM 未設定ならGmail迷惑メール行き");
  }
  if (analysis.length === 0) {
    analysis.push("情報不足 → 送信ログが取得できませんでした");
  }

  results.analysis = analysis;

  return NextResponse.json(results);
}
