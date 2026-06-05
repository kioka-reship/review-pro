const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          stroke="#6E8BFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "AI口コミ自動生成",
    desc: "お客様の回答をもとに、年代・性別・文体を考慮した自然な口コミ文を3パターン自動生成します。",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="12" width="4" height="9" rx="1" stroke="#6E8BFF" strokeWidth="1.8"/>
        <rect x="10" y="7" width="4" height="14" rx="1" stroke="#6E8BFF" strokeWidth="1.8"/>
        <rect x="17" y="3" width="4" height="18" rx="1" stroke="#6E8BFF" strokeWidth="1.8"/>
      </svg>
    ),
    title: "業種別テンプレート",
    desc: "飲食・美容・医療・整体など30業種以上に対応。業種に最適化された質問を自動設定します。",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="1" stroke="#6E8BFF" strokeWidth="1.8"/>
        <rect x="13" y="3" width="8" height="8" rx="1" stroke="#6E8BFF" strokeWidth="1.8"/>
        <rect x="3" y="13" width="8" height="8" rx="1" stroke="#6E8BFF" strokeWidth="1.8"/>
        <rect x="15" y="15" width="4" height="4" rx="0.5" fill="#6E8BFF" opacity="0.5"/>
      </svg>
    ),
    title: "QRコード即納品",
    desc: "マイページからPNG・PDF・A4印刷用POPをいつでもダウンロード可能。設置まで5分。",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 12H7L10 5L14 19L17 12H21" stroke="#6E8BFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "リアルタイム管理",
    desc: "口コミ投稿数・平均評価・低評価アラートを管理画面でリアルタイム確認できます。",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#6E8BFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "低評価対策PRO",
    desc: "低評価の口コミには自動で対応案を提案。評価が下がる前に手を打てます。（オプション）",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#6E8BFF" strokeWidth="1.8"/>
        <path d="M22 6l-10 7L2 6" stroke="#6E8BFF" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    title: "月次レポート機能（オプション）",
    desc: "口コミ数・評価推移・改善提案をまとめたレポートを毎月メールでお届け。オプション追加時に利用可能です。",
  },
];

const premiumFeature = {
  icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#D6B25E" strokeWidth="1.8"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#D6B25E" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  title: "多言語口コミ対応",
  desc: "プレミアムプランでは英語・中国語・韓国語での口コミ生成に対応。外国人観光客や海外のお客様の口コミ獲得をサポートします。",
  langs: ["🇯🇵 日本語", "🇺🇸 English", "🇨🇳 中文", "🇰🇷 한국어"],
};

export default function LPFeatures() {
  return (
    <section
      id="features"
      style={{
        background: "#0F1115",
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
            口コミを増やすための
            <br />
            全機能が揃っています
          </h2>
          <p style={{ fontSize: "16px", color: "#A5ACB8", lineHeight: 1.8 }}>
            飲食・美容・医療・サービス業など、あらゆる業種に対応
          </p>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}
          className="feature-grid"
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                background: "rgba(23, 26, 33, 0.8)",
                border: "1px solid #252A34",
                borderRadius: "20px",
                padding: "28px 24px",
                transition: "transform 0.2s ease, border-color 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(110,139,255,0.08)",
                  border: "1px solid rgba(110,139,255,0.15)",
                  marginBottom: "18px",
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#fff",
                  marginBottom: "10px",
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: "14px", color: "#A5ACB8", lineHeight: 1.8 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Premium限定: 多言語口コミ対応 */}
        <div
          style={{
            marginTop: "24px",
            background: "linear-gradient(135deg, rgba(214,178,94,0.06) 0%, rgba(23,26,33,0.9) 100%)",
            border: "1px solid rgba(214,178,94,0.3)",
            borderRadius: "20px",
            padding: "36px 40px",
            display: "flex",
            alignItems: "center",
            gap: "40px",
            boxShadow: "0 0 48px rgba(214,178,94,0.05)",
          }}
          className="premium-feature-card"
        >
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "rgba(214,178,94,0.1)",
                border: "1px solid rgba(214,178,94,0.25)",
              }}
            >
              {premiumFeature.icon}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#fff", margin: 0 }}>
                {premiumFeature.title}
              </h3>
              <span
                style={{
                  background: "linear-gradient(135deg, #D6B25E, #B8942A)",
                  color: "#0F1115",
                  fontSize: "10px",
                  fontWeight: "800",
                  padding: "3px 10px",
                  borderRadius: "100px",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                }}
              >
                PREMIUM限定
              </span>
            </div>
            <p style={{ fontSize: "14px", color: "#A5ACB8", lineHeight: 1.8, margin: "0 0 16px" }}>
              {premiumFeature.desc}
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {premiumFeature.langs.map((lang, i) => (
                <span
                  key={i}
                  style={{
                    background: "rgba(214,178,94,0.08)",
                    border: "1px solid rgba(214,178,94,0.2)",
                    color: "#D6B25E",
                    fontSize: "12px",
                    fontWeight: "600",
                    padding: "4px 12px",
                    borderRadius: "100px",
                  }}
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: "center" }}>
            <div style={{ fontSize: "13px", color: "#D6B25E", fontWeight: "700", marginBottom: "4px" }}>インバウンド対応</div>
            <div style={{ fontSize: "12px", color: "#5A6478", lineHeight: 1.6 }}>
              外国人のお客様も<br />自然な口コミ投稿が可能
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
