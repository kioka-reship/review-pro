export default function PrivacyPage() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "#F4F6F9", fontFamily: "'Noto Sans JP',sans-serif" }}>
        <div style={{ background: "#0F1923", padding: "0 24px", height: "56px", display: "flex", alignItems: "center" }}>
          <a href="/" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "18px", fontWeight: "800", color: "#fff", textDecoration: "none" }}>REVIEW PRO</a>
        </div>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "40px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <h1 style={{ fontSize: "24px", color: "#1a2533", marginBottom: "8px" }}>プライバシーポリシー</h1>
            <p style={{ color: "#888", fontSize: "13px", marginBottom: "32px" }}>最終更新日：2024年1月1日</p>

            {[
              {
                title: "1. 収集する情報",
                content: "当社は以下の情報を収集します。①会社名・店舗名・氏名などの基本情報、②メールアドレス・パスワードなどのアカウント情報、③決済情報（Square社を通じて処理され、当社はカード番号を保持しません）、④サービス利用履歴・口コミ生成履歴、⑤IPアドレス・アクセスログ。"
              },
              {
                title: "2. 情報の利用目的",
                content: "収集した情報は以下の目的で利用します。①本サービスの提供・運営、②お問い合わせへの対応、③利用料金の請求・決済、④サービス改善のための分析、⑤法令に基づく対応。"
              },
              {
                title: "3. 情報の第三者提供",
                content: "当社は、以下の場合を除き、お客様の個人情報を第三者に提供しません。①お客様の同意がある場合、②法令に基づく場合、③決済処理のためにSquare社に提供する場合、④メール送信のためにBrevo社に提供する場合。"
              },
              {
                title: "4. 情報の管理",
                content: "当社は個人情報の漏洩・紛失・改ざんを防ぐため、適切なセキュリティ対策を講じます。データはSupabase社のサーバー（適切なセキュリティ基準に準拠）で管理されます。"
              },
              {
                title: "5. データの保持期間",
                content: "契約中は継続してデータを保持します。解約後90日間はデータを保持し、その後削除します。ただし、法令上保存が義務付けられているデータはこの限りではありません。"
              },
              {
                title: "6. Cookie・アクセス解析",
                content: "本サービスではサービス改善のためにアクセス解析ツールを使用する場合があります。これらのツールはCookieを使用することがありますが、個人を特定する情報は収集しません。"
              },
              {
                title: "7. お客様の権利",
                content: "お客様は自身の個人情報について、開示・訂正・削除を請求することができます。請求はinfo@re-ship.co.jpまでご連絡ください。"
              },
              {
                title: "8. プライバシーポリシーの変更",
                content: "当社は必要に応じて本ポリシーを変更することがあります。重要な変更がある場合は、サービス内またはメールにてお知らせします。"
              },
              {
                title: "9. お問い合わせ",
                content: "個人情報の取り扱いに関するお問い合わせは、info@re-ship.co.jpまでご連絡ください。"
              },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: "28px" }}>
                <h2 style={{ fontSize: "16px", color: "#1a2533", marginBottom: "10px" }}>{item.title}</h2>
                <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.8" }}>{item.content}</p>
              </div>
            ))}

            <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "24px", marginTop: "8px" }}>
              <p style={{ fontSize: "13px", color: "#888" }}>合同会社Relationship<br />お問い合わせ：info@re-ship.co.jp</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
