const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@review-pro.jp";
const FROM_NAME = "REVIEW PRO";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  storeId?: string;
};

export async function sendEmail({ to, subject, html, storeId }: EmailPayload): Promise<boolean> {
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("[sendEmail] Brevo error:", err);
      return false;
    }

    if (storeId) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase.from("email_logs").insert({
        store_id: storeId,
        to_email: to,
        subject,
        type: "system",
        status: "sent",
      });
    }

    return true;
  } catch (err) {
    console.error("[sendEmail] error:", err);
    return false;
  }
}

export const emailTemplates = {

  welcome: (storeName: string, email: string, plan: string) => ({
    subject: "【REVIEW PRO】ご契約ありがとうございます",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
        <h2 style="color:#2C7A4B;">REVIEW PRO へようこそ！</h2>
        <p>${storeName} 様、ご契約ありがとうございます。</p>
        <p>以下の情報でマイページにログインできます。</p>
        <div style="background:#F4F6F9;padding:16px;border-radius:8px;margin:20px 0;">
          <p><strong>ログインURL：</strong><a href="https://review-pro-ay7x.vercel.app/mypage">https://review-pro-ay7x.vercel.app/mypage</a></p>
          <p><strong>メールアドレス：</strong>${email}</p>
          <p><strong>プラン：</strong>${plan}</p>
        </div>
        <p>ご不明な点はお気軽にお問い合わせください。</p>
        <p style="color:#888;font-size:12px;">REVIEW PRO サポート</p>
      </div>
    `,
  }),

  upgraded: (storeName: string, fromPlan: string, toPlan: string, amount: number) => ({
    subject: "【REVIEW PRO】プランアップグレード完了",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
        <h2 style="color:#2C7A4B;">プランアップグレード完了</h2>
        <p>${storeName} 様、プランのアップグレードが完了しました。</p>
        <div style="background:#F4F6F9;padding:16px;border-radius:8px;margin:20px 0;">
          <p><strong>変更前：</strong>${fromPlan}</p>
          <p><strong>変更後：</strong>${toPlan}</p>
          <p><strong>今回のご請求：</strong>¥${amount.toLocaleString()}</p>
        </div>
        <p>新しいプランは即時反映されています。</p>
        <p style="color:#888;font-size:12px;">REVIEW PRO サポート</p>
      </div>
    `,
  }),

  downgradeScheduled: (storeName: string, fromPlan: string, toPlan: string, effectiveDate: string) => ({
    subject: "【REVIEW PRO】プランダウングレード予約完了",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
        <h2 style="color:#2C7A4B;">プランダウングレード予約</h2>
        <p>${storeName} 様、プランのダウングレード予約を受け付けました。</p>
        <div style="background:#F4F6F9;padding:16px;border-radius:8px;margin:20px 0;">
          <p><strong>変更前：</strong>${fromPlan}</p>
          <p><strong>変更後：</strong>${toPlan}</p>
          <p><strong>反映日：</strong>${effectiveDate}</p>
        </div>
        <p>反映日まで現在のプランでご利用いただけます。</p>
        <p style="color:#888;font-size:12px;">REVIEW PRO サポート</p>
      </div>
    `,
  }),

  optionAdded: (storeName: string, optionName: string, price: number) => ({
    subject: "【REVIEW PRO】オプション追加完了",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
        <h2 style="color:#2C7A4B;">オプション追加完了</h2>
        <p>${storeName} 様、オプションの追加が完了しました。</p>
        <div style="background:#F4F6F9;padding:16px;border-radius:8px;margin:20px 0;">
          <p><strong>追加オプション：</strong>${optionName}</p>
          <p><strong>月額：</strong>¥${price.toLocaleString()}</p>
        </div>
        <p>次回以降の請求に自動的に追加されます。</p>
        <p style="color:#888;font-size:12px;">REVIEW PRO サポート</p>
      </div>
    `,
  }),

  optionCancelScheduled: (storeName: string, optionName: string, effectiveDate: string) => ({
    subject: "【REVIEW PRO】オプション解約予約完了",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
        <h2 style="color:#2C7A4B;">オプション解約予約</h2>
        <p>${storeName} 様、オプションの解約予約を受け付けました。</p>
        <div style="background:#F4F6F9;padding:16px;border-radius:8px;margin:20px 0;">
          <p><strong>解約オプション：</strong>${optionName}</p>
          <p><strong>停止日：</strong>${effectiveDate}</p>
        </div>
        <p>停止日まで引き続きご利用いただけます。</p>
        <p style="color:#888;font-size:12px;">REVIEW PRO サポート</p>
      </div>
    `,
  }),

  cancelRequested: (storeName: string, effectiveDate: string) => ({
    subject: "【REVIEW PRO】解約申請受付完了",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
        <h2 style="color:#DC2626;">解約申請を受け付けました</h2>
        <p>${storeName} 様、解約申請を受け付けました。</p>
        <div style="background:#FEF2F2;padding:16px;border-radius:8px;margin:20px 0;">
          <p><strong>サービス停止日：</strong>${effectiveDate}</p>
        </div>
        <p>停止日まで引き続きご利用いただけます。<br>データは解約後90日間保持されます。</p>
        <p>解約を取り消したい場合はお問い合わせください。</p>
        <p style="color:#888;font-size:12px;">REVIEW PRO サポート</p>
      </div>
    `,
  }),

  passwordReset: (resetUrl: string) => ({
    subject: "【REVIEW PRO】パスワード再設定",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
        <h2 style="color:#2C7A4B;">パスワード再設定</h2>
        <p>以下のボタンからパスワードを再設定してください。</p>
        <p>※このURLは1時間で無効になります。</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resetUrl}" style="background:#2C7A4B;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;">パスワードを再設定する</a>
        </div>
        <p>このメールに心当たりがない場合は無視してください。</p>
        <p style="color:#888;font-size:12px;">REVIEW PRO サポート</p>
      </div>
    `,
  }),
};
