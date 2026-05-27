const stats = [
  {
    num: "3.1倍",
    label: "口コミ投稿率の向上",
    detail: "QR設置前との比較",
  },
  {
    num: "58秒",
    label: "平均投稿所要時間",
    detail: "お客様の操作時間",
  },
  {
    num: "30+",
    label: "対応業種数",
    detail: "テンプレート標準搭載",
  },
  {
    num: "5分",
    label: "QR設置〜利用開始",
    detail: "申込後すぐに使える",
  },
];

export default function LPStats() {
  return (
    <div
      style={{
        background: "#F7F9FC",
        borderTop: "1px solid #E4E8F0",
        borderBottom: "1px solid #E4E8F0",
      }}
    >
      <div
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "0 24px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
        }}
        className="stats-grid"
      >
        {stats.map((s, i) => (
          <div
            key={i}
            style={{
              padding: "52px 24px",
              textAlign: "center",
              borderRight: i < stats.length - 1 ? "1px solid #E4E8F0" : "none",
            }}
          >
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "clamp(32px, 3vw, 46px)",
                fontWeight: "900",
                color: "#D6B25E",
                lineHeight: 1,
                marginBottom: "10px",
              }}
            >
              {s.num}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#1A2333",
                fontWeight: "700",
                marginBottom: "4px",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#8A96A8",
                letterSpacing: "0.02em",
              }}
            >
              {s.detail}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
