const faqs = [
  {
    q: "導入にどのくらい時間がかかりますか？",
    a: "申込後、最短即日でご利用開始できます。QRコードはマイページからすぐにダウンロードできます。",
  },
  {
    q: "どんな業種でも使えますか？",
    a: "飲食・美容・医療・整体・整骨院・不動産・小売など、Googleマップに登録されているあらゆる業種でご利用いただけます。",
  },
  {
    q: "お客様のスマートフォンで操作は難しくないですか？",
    a: "QRコードを読み取るだけで、選ぶだけの簡単な操作で口コミ文が完成します。入力不要のため、高齢の方にも使っていただけます。",
  },
  {
    q: "口コミの内容をコントロールできますか？",
    a: "業種に合わせた質問テンプレートを設定することで、お店の魅力が伝わる口コミが生成されやすくなります。プランによって質問の編集も可能です。",
  },
  {
    q: "解約はいつでもできますか？",
    a: "はい、いつでもマイページから解約申請できます。解約後も翌月末まではサービスをご利用いただけます。",
  },
  {
    q: "複数店舗で使えますか？",
    a: "現在は1プランにつき1店舗です。複数店舗の場合は、店舗数分のプランをそれぞれご契約いただく形となります。",
  },
  {
    q: "外国語の口コミにも対応していますか？",
    a: "プレミアムプランでは英語・中国語・韓国語での口コミ生成に対応しています。訪日外国人のお客様がQRコードを読み取った際に、言語を選択することで選んだ言語で口コミ文が生成されます。インバウンド対応が必要な飲食・観光・宿泊業の店舗様に特におすすめです。",
  },
];

export default function LPFAQ() {
  return (
    <section
      id="faq"
      style={{
        background: "#171A21",
        padding: "100px 0",
        borderBottom: "1px solid #252A34",
      }}
    >
      <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(26px, 3.5vw, 40px)",
              fontWeight: "900",
              color: "#fff",
              marginBottom: "16px",
              lineHeight: 1.2,
            }}
          >
            よくある質問
          </h2>
          <p style={{ fontSize: "16px", color: "#A5ACB8" }}>
            ご不明な点はお気軽にお問い合わせください
          </p>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
          className="faq-grid"
        >
          {faqs.map((faq, i) => (
            <div
              key={i}
              style={{
                background: "rgba(23, 26, 33, 0.8)",
                border: "1px solid #252A34",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#fff",
                  marginBottom: "10px",
                  lineHeight: 1.5,
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    color: "#6E8BFF",
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: "800",
                    fontSize: "13px",
                  }}
                >
                  Q.
                </span>
                {faq.q}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#A5ACB8",
                  lineHeight: 1.8,
                  paddingLeft: "22px",
                }}
              >
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
