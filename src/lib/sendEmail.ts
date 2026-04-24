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

  welcome: (storeName: string, email: string, plan: string, storeId: string) => ({
    subject: "【REVIEW PRO】サービス開始のご案内",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#2C7A4B;font-size:24px;margin:0;">REVIEW PRO</h1>
          <p style="color:#888;font-size:13px;margin:4px 0 0;">口コミ集客の自動化サービス</p>
        </div>

        <h2 style="color:#1a2533;font-size:18px;">ご契約ありがとうございます！</h2>
        <p style="color:#555;line-height:1.8;">${storeName} 様、REVIEW PRO へようこそ！<br>決済が完了し、サービスが開始されました。</p>

        <div style="background:#F0FAF4;border-left:4px solid #2C7A4B;padding:16px;border-radius:0 8px 8px 0;margin:24px 0;">
          <p style="margin:0 0 8px;font-weight:700;color:#1a2533;">ご契約内容</p>
          <p style="margin:0;color:#555;">プラン：<strong>${plan}</strong></p>
          <p style="margin:4px 0 0;color:#555;">メールアドレス：<strong>${email}</strong></p>
        </div>

        <h3 style="color:#1a2533;font-size:15px;margin:28px 0 12px;">📱 まずはここから始めましょう</h3>

        <div style="display:flex;flex-direction:column;gap:12px;">
          <a href="https://review-pro-ay7x.vercel.app/mypage" style="display:block;background:#2C7A4B;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:700;text-align:center;font-size:15px;">
            🏠 マイページにログイン
          </a>
          <a href="https://review-pro-ay7x.vercel.app/mypage" style="display:block;background:#1a2533;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:700;text-align:center;font-size:15px;">
            📱 QRコードを確認・印刷する
          </a>
        </div>

        <div style="background:#F4F6F9;border-radius:10px;padding:20px;margin:28px 0;">
          <p style="margin:0 0 12px;font-weight:700;color:#1a2533;">📋 ログイン情報</p>
          <p style="margin:0;color:#555;">URL：<a href="https://review-pro-ay7x.vercel.app/mypage" style="color:#2C7A4B;">https://review-pro-ay7x.vercel.app/mypage</a></p>
          <p style="margin:8px 0 0;color:#555;">メールアドレス：<strong>${email}</strong></p>
          <p style="margin:8px 0 0;color:#555;">パスワード：ご登録時に設定されたパスワード</p>
        </div>

        <h3 style="color:#1a2533;font-size:15px;margin:28px 0 12px;">🚀 サービスの使い方</h3>
        <ol style="color:#555;line-height:2;padding-left:20px;">
          <li>マイページにログインする</li>
          <li>QRコードをダウンロード・印刷する</li>
          <li>お店のレジ横やテーブルにQRコードを設置する</li>
          <li>お客様がQRコードを読み取り、口コミを投稿してくれます</li>
        </ol>

        <div style="border-top:1px solid #E5E7EB;margin-top:32px;padding-top:20px;text-align:center;">
          <p style="color:#888;font-size:12px;margin:0;">ご不明な点はお気軽にお問い合わせください。</p>
          <p style="color:#888;font-size:12px;margin:8px 0 0;">REVIEW PRO サポートチーム</p>
        </div>
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
        <a href="https://review-pro-ay7x.vercel.app/mypage" style="display:inline-block;background:#2C7A4B;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;margin-top:16px;">マイページを確認する</a>
        <p style="color:#888;font-size:12px;margin-top:24px;">REVIEW PRO サポート</p>
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
        <a href="https://review-pro-ay7x.vercel.app/mypage" style="display:inline-block;background:#2C7A4B;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;margin-top:16px;">マイページを確認する</a>
        <p style="color:#888;font-size:12px;margin-top:24px;">REVIEW PRO サポート</p>
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
