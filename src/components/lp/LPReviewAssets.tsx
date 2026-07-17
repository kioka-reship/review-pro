/* eslint-disable @next/next/no-img-element */

const months = [
  {
    phase: "Month 1",
    reviews: 20,
    pct: 6,
    label: "導入1ヶ月",
    note: "QR設置後、最初の口コミが積み重なりはじめる",
    color: "#6E8BFF",
  },
  {
    phase: "Month 3",
    reviews: 75,
    pct: 21,
    label: "導入3ヶ月",
    note: "Googleマップの表示順位が改善し始める",
    color: "#8BA3FF",
  },
  {
    phase: "Month 6",
    reviews: 180,
    pct: 50,
    label: "導入6ヶ月",
    note: "エリア内での認知度が向上。指名検索も増加",
    color: "#B0C0FF",
  },
  {
    phase: "Month 12",
    reviews: 360,
    pct: 100,
    label: "導入12ヶ月",
    note: "口コミ資産が積み重なり、検索からの流入が安定してくる",
    color: "#D6B25E",
  },
];

export default function LPReviewAssets() {
  return (
    <section
      style={{
        position: "relative",
        background: "#0F1115",
        padding: "100px 0",
        overflow: "hidden",
        borderBottom: "1px solid #252A34",
      }}
    >
      {/* Background photo with overlay */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <img
          src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1400&h=700&q=60"
          alt="店舗街並み"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            opacity: 0.12,
          }}
          loading="lazy"
        />
        {/* Gradient over photo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, #0F1115 0%, rgba(15,17,21,0.7) 40%, rgba(15,17,21,0.7) 60%, #0F1115 100%)",
          }}
        />
      </div>

      <div
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "0 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "72px" }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(214,178,94,0.08)",
              border: "1px solid rgba(214,178,94,0.2)",
              borderRadius: "100px",
              padding: "6px 18px",
              fontSize: "12px",
              color: "#D6B25E",
              fontWeight: "600",
              marginBottom: "28px",
              letterSpacing: "0.04em",
            }}
          >
            口コミ資産の蓄積
          </div>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(26px, 3.5vw, 44px)",
              fontWeight: "900",
              color: "#fff",
              marginBottom: "20px",
              lineHeight: 1.25,
            }}
          >
            口コミは、店舗の信頼を
            <br />
            積み上げる資産になります。
          </h2>
          <p style={{ fontSize: "16px", color: "#A5ACB8", lineHeight: 1.9, maxWidth: "560px", margin: "0 auto" }}>
            一度投稿された口コミは消えません。
            <br />
            蓄積されるほど、比較時に選ばれやすい店舗へと変わっていきます。
          </p>
        </div>

        {/* Growth cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "48px",
          }}
          className="growth-grid"
        >
          {months.map((m, i) => (
            <div
              key={i}
              style={{
                background: "rgba(23,26,33,0.85)",
                border: `1px solid ${i === months.length - 1 ? "rgba(214,178,94,0.3)" : "#252A34"}`,
                borderRadius: "20px",
                padding: "28px 22px",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                boxShadow:
                  i === months.length - 1 ? "0 0 40px rgba(214,178,94,0.06)" : "none",
              }}
            >
              {/* Phase label */}
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: m.color,
                  marginBottom: "16px",
                  letterSpacing: "0.04em",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {m.phase}
              </div>

              {/* Review count */}
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "48px",
                  fontWeight: "900",
                  color: m.color,
                  lineHeight: 1,
                  marginBottom: "4px",
                }}
              >
                {m.reviews}
              </div>
              <div style={{ fontSize: "13px", color: "#A5ACB8", marginBottom: "20px" }}>
                件の口コミ
              </div>

              {/* Progress bar */}
              <div
                style={{
                  background: "#252A34",
                  borderRadius: "100px",
                  height: "4px",
                  overflow: "hidden",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: `${m.pct}%`,
                    height: "100%",
                    background: m.color,
                    borderRadius: "100px",
                  }}
                />
              </div>

              {/* Note */}
              <p
                style={{
                  fontSize: "12px",
                  color: "#5A6478",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {m.note}
              </p>
            </div>
          ))}
        </div>

        {/* Disclaimer + CTA */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "#5A6478", marginBottom: "32px" }}>
            ※ 数値は想定イメージです。実際の効果は業種・地域・運用状況により異なります。
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              background: "rgba(23,26,33,0.8)",
              border: "1px solid rgba(214,178,94,0.2)",
              borderRadius: "16px",
              padding: "20px 32px",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <div style={{ textAlign: "left" }}>
              <div
                style={{ fontSize: "15px", fontWeight: "700", color: "#fff", marginBottom: "4px" }}
              >
                あなたの店舗に口コミ資産を積み上げませんか？
              </div>
              <div style={{ fontSize: "13px", color: "#A5ACB8" }}>
                年契約なら月々¥3,980から。設定5分。
              </div>
            </div>
            <a
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "12px 24px",
                background: "#D6B25E",
                color: "#0F1115",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "14px",
                textDecoration: "none",
                whiteSpace: "nowrap",
                letterSpacing: "0.01em",
              }}
            >
              始める →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
