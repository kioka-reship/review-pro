/* eslint-disable @next/next/no-img-element */

const industryCards = [
  {
    name: "飲食店・カフェ",
    sub: "居酒屋・ラーメン・カフェ・バー",
    photo:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&h=260&q=75",
    alt: "飲食店内",
  },
  {
    name: "美容室・サロン",
    sub: "カット・パーマ・カラーリング",
    photo:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&h=260&q=75",
    alt: "美容室カット風景",
  },
  {
    name: "エステ・脱毛",
    sub: "フェイシャル・全身脱毛・痩身",
    photo:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&h=260&q=75",
    alt: "エステ施術",
  },
  {
    name: "整体院・整骨院",
    sub: "骨盤矯正・腰痛・肩こり",
    photo:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&h=260&q=75",
    alt: "整体施術",
  },
  {
    name: "クリニック・歯科",
    sub: "内科・皮膚科・美容・歯科",
    photo:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&h=260&q=75",
    alt: "クリニック受付",
  },
  {
    name: "ジム・フィットネス",
    sub: "パーソナルトレーニング・ヨガ",
    photo:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&h=260&q=75",
    alt: "ジムトレーニング",
  },
  {
    name: "カーショップ",
    sub: "中古車・新車販売・板金",
    photo:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&h=260&q=75",
    alt: "カーショップ展示",
  },
  {
    name: "不動産",
    sub: "売買・賃貸・投資・管理",
    photo:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&h=260&q=75",
    alt: "不動産商談",
  },
  {
    name: "塾・学習スクール",
    sub: "個別指導・英会話・習い事",
    photo:
      "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=400&h=260&q=75",
    alt: "学習塾",
  },
];

export default function LPIndustries() {
  return (
    <section
      style={{
        background: "#F7F9FC",
        padding: "100px 0",
        borderTop: "1px solid #E4E8F0",
        borderBottom: "1px solid #E4E8F0",
      }}
    >
      <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(110,139,255,0.08)",
              border: "1px solid rgba(110,139,255,0.2)",
              borderRadius: "100px",
              padding: "6px 18px",
              fontSize: "12px",
              color: "#6E8BFF",
              fontWeight: "600",
              marginBottom: "24px",
              letterSpacing: "0.04em",
            }}
          >
            業種別テンプレート対応
          </div>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(26px, 3.5vw, 40px)",
              fontWeight: "900",
              color: "#1A2333",
              marginBottom: "16px",
              lineHeight: 1.2,
            }}
          >
            あらゆる店舗業種に対応
          </h2>
          <p style={{ fontSize: "16px", color: "#6B7280", lineHeight: 1.8 }}>
            飲食から医療まで、30業種以上のテンプレートを標準装備。
            <br />
            業種に最適化された質問が自動でセットされます。
          </p>
        </div>

        {/* Photo card grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
            marginBottom: "56px",
          }}
          className="industry-grid"
        >
          {industryCards.map((card, i) => (
            <div
              key={i}
              style={{
                background: "#FFFFFF",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid #E4E8F0",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              {/* Photo */}
              <div
                style={{
                  position: "relative",
                  height: "160px",
                  overflow: "hidden",
                  background: "#E8ECF0",
                }}
              >
                <img
                  src={card.photo}
                  alt={card.alt}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    transition: "transform 0.3s ease",
                  }}
                  loading="lazy"
                />
                {/* Subtle gradient at bottom */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "48px",
                    background:
                      "linear-gradient(0deg, rgba(255,255,255,0.4) 0%, transparent 100%)",
                  }}
                />
              </div>
              {/* Card text */}
              <div style={{ padding: "16px 18px 18px" }}>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: "700",
                    color: "#1A2333",
                    marginBottom: "5px",
                  }}
                >
                  {card.name}
                </div>
                <div style={{ fontSize: "12px", color: "#8A96A8" }}>{card.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E4E8F0",
            borderRadius: "16px",
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "24px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          }}
          className="industry-bottom"
        >
          <div>
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "36px",
                fontWeight: "900",
                color: "#D6B25E",
                lineHeight: 1,
              }}
            >
              30+
            </div>
            <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>対応業種数</div>
          </div>
          <div
            style={{
              width: "1px",
              height: "48px",
              background: "#E4E8F0",
              flexShrink: 0,
            }}
            className="industry-divider"
          />
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div
              style={{ fontSize: "15px", fontWeight: "700", color: "#1A2333", marginBottom: "6px" }}
            >
              業種が変わっても、設定は自動
            </div>
            <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.7, margin: 0 }}>
              飲食・美容・医療・サービス業など、業種を選ぶだけでその業種に最適な質問テンプレートが自動でセットされます。独自カスタマイズも可能です。
            </p>
          </div>
          <div>
            <a
              href="#pricing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "12px 24px",
                background: "#6E8BFF",
                color: "#fff",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "14px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              料金を見る →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
