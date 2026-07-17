const steps = [
  {
    phase: "Day 1",
    phaseColor: "#6E8BFF",
    title: "QRコードを設置",
    desc: "マイページからQRを印刷し、レジや卓上に置くだけ。設定作業は5分で完了します。",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="1" stroke="#6E8BFF" strokeWidth="1.8"/>
        <rect x="13" y="3" width="8" height="8" rx="1" stroke="#6E8BFF" strokeWidth="1.8"/>
        <rect x="3" y="13" width="8" height="8" rx="1" stroke="#6E8BFF" strokeWidth="1.8"/>
        <rect x="15" y="15" width="4" height="4" fill="#6E8BFF" opacity="0.5"/>
      </svg>
    ),
  },
  {
    phase: "Week 1",
    phaseColor: "#8BA3FF",
    title: "最初の口コミが届く",
    desc: "来店したお客様がQRを読み取り、AIが口コミ文を自動生成。最初の投稿が管理画面に届きます。",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          stroke="#8BA3FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    phase: "Month 1",
    phaseColor: "#D6B25E",
    title: "月10〜30件を達成",
    desc: "口コミが積み重なりGoogleマップでの評価件数が増加。検索への露出が広がり始めます。",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="12" width="4" height="9" rx="1" stroke="#D6B25E" strokeWidth="1.8"/>
        <rect x="10" y="7" width="4" height="14" rx="1" stroke="#D6B25E" strokeWidth="1.8"/>
        <rect x="17" y="3" width="4" height="18" rx="1" stroke="#D6B25E" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    phase: "Month 3+",
    phaseColor: "#D6B25E",
    title: "Googleマップ上位へ",
    desc: "口コミ数と評価スコアの継続的な向上により、エリア内でのGoogleマップ上位表示を実現します。",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#D6B25E" strokeWidth="1.8"/>
        <path d="M12 8v4l3 3" stroke="#D6B25E" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function LPTimeline() {
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
              background: "rgba(214,178,94,0.08)",
              border: "1px solid rgba(214,178,94,0.2)",
              borderRadius: "100px",
              padding: "6px 18px",
              fontSize: "12px",
              color: "#D6B25E",
              fontWeight: "600",
              marginBottom: "24px",
              letterSpacing: "0.04em",
            }}
          >
            導入後の流れ
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
            導入後、最短30日で
            <br />
            店舗に変化が起きる
          </h2>
          <p style={{ fontSize: "16px", color: "#6B7280", lineHeight: 1.8 }}>
            QR導線とAIサポートにより、口コミ投稿につながりやすい環境が整っていきます。
          </p>
        </div>

        {/* Timeline */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0",
            position: "relative",
          }}
          className="timeline-grid"
        >
          {/* Connector line */}
          <div
            style={{
              position: "absolute",
              top: "40px",
              left: "calc(12.5% + 12px)",
              right: "calc(12.5% + 12px)",
              height: "2px",
              background: "linear-gradient(90deg, #6E8BFF, #D6B25E)",
              zIndex: 0,
            }}
            className="timeline-line"
          />

          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "0 16px",
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Dot + Icon */}
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "#FFFFFF",
                  border: `2px solid ${step.phaseColor}`,
                  boxShadow: `0 0 0 6px #F7F9FC`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                  flexShrink: 0,
                }}
              >
                {step.icon}
              </div>

              {/* Phase label */}
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: step.phaseColor,
                  marginBottom: "8px",
                  letterSpacing: "0.04em",
                  textAlign: "center",
                }}
              >
                {step.phase}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  color: "#1A2333",
                  marginBottom: "10px",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                {step.title}
              </h3>

              {/* Desc */}
              <p
                style={{
                  fontSize: "13px",
                  color: "#6B7280",
                  lineHeight: 1.7,
                  textAlign: "center",
                  margin: 0,
                }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div
          style={{
            marginTop: "56px",
            background: "#FFFFFF",
            border: "1px solid #E4E8F0",
            borderRadius: "16px",
            padding: "24px 32px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          }}
          className="timeline-note"
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(110,139,255,0.08)",
              border: "1px solid rgba(110,139,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                stroke="#6E8BFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1A2333", marginBottom: "4px" }}>
              店舗側の負担を最小限に
            </div>
            <div style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6 }}>
              QRコードを設置することで、お客様が自分のスマホから口コミ投稿まで進めやすくなります。AIが口コミ文の作成をサポートするため、スタッフが毎回文章を考える必要はありません。
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
