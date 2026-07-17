/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

function DashboardMock() {
  const bars = [
    { label: "1月", value: 50, pct: 10 },
    { label: "2月", value: 150, pct: 30 },
    { label: "3月", value: 300, pct: 60 },
    { label: "4月", value: 500, pct: 100 },
  ];

  return (
    <div
      style={{
        background: "#171A21",
        border: "1px solid #252A34",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.55)",
        maxWidth: "460px",
        width: "100%",
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          background: "#0F1115",
          borderBottom: "1px solid #252A34",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "6px" }}>
          {["#3A3F4B", "#3A3F4B", "#3A3F4B"].map((c, i) => (
            <span
              key={i}
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: c,
                display: "block",
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontSize: "11px",
            color: "#5A6478",
            background: "#171A21",
            border: "1px solid #252A34",
            borderRadius: "6px",
            padding: "3px 12px",
            flex: 1,
            textAlign: "center",
          }}
        >
          review-pro.jp/dashboard
        </span>
      </div>

      {/* Dashboard header */}
      <div
        style={{
          background: "#0F1115",
          borderBottom: "1px solid #252A34",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "14px",
            fontWeight: "800",
            color: "#fff",
          }}
        >
          REVIEW PRO
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "#A5ACB8",
          }}
        >
          ダッシュボード
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: "20px" }}>
        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          {[
            { label: "今月の口コミ", val: "47", unit: "件", sub: "+23%↑", subColor: "#6E8BFF" },
            { label: "平均評価", val: "4.8", unit: "★", sub: "★★★★★", subColor: "#D6B25E" },
            { label: "累計件数", val: "312", unit: "件", sub: "6ヶ月", subColor: "#A5ACB8" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: "#0F1115",
                border: "1px solid #252A34",
                borderRadius: "10px",
                padding: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  color: "#5A6478",
                  marginBottom: "6px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "22px",
                  fontWeight: "900",
                  color: "#D6B25E",
                  lineHeight: 1,
                }}
              >
                {s.val}
              </div>
              <div
                style={{
                  fontSize: "9px",
                  color: s.subColor,
                  marginTop: "4px",
                  fontWeight: "600",
                }}
              >
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div
          style={{
            background: "#0F1115",
            border: "1px solid #252A34",
            borderRadius: "10px",
            padding: "14px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#A5ACB8",
              marginBottom: "14px",
              fontWeight: "600",
            }}
          >
            口コミ数の推移
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "8px",
              height: "64px",
            }}
          >
            {bars.map((b, i) => (
              <div
                key={i}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}
              >
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                  <div
                    style={{
                      width: "100%",
                      height: `${b.pct}%`,
                      minHeight: "6px",
                      background:
                        i === bars.length - 1
                          ? "linear-gradient(180deg, #6E8BFF 0%, rgba(110,139,255,0.5) 100%)"
                          : `rgba(110, 139, 255, ${0.1 + i * 0.07})`,
                      borderRadius: "3px 3px 0 0",
                      transition: "height 0.3s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            {bars.map((b, i) => (
              <div
                key={i}
                style={{ flex: 1, textAlign: "center", fontSize: "9px", color: "#5A6478" }}
              >
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* AI Generated Review Sample */}
        <div
          style={{
            background: "#0F1115",
            border: "1px solid #252A34",
            borderRadius: "10px",
            padding: "14px",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ fontSize: "10px", color: "#A5ACB8", fontWeight: "600" }}>
              AI生成レビュー（最新）
            </div>
            <span
              style={{
                fontSize: "9px",
                background: "rgba(110,139,255,0.12)",
                color: "#6E8BFF",
                border: "1px solid rgba(110,139,255,0.2)",
                borderRadius: "4px",
                padding: "2px 7px",
                fontWeight: "700",
              }}
            >
              ★★★★★ 5.0
            </span>
          </div>
          <p
            style={{
              fontSize: "11px",
              color: "#A5ACB8",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            「スタッフの方がとても丁寧で、施術後の仕上がりも大満足でした。また絶対に来ます！」
          </p>
          <div style={{ marginTop: "8px", fontSize: "9px", color: "#5A6478" }}>
            AIが生成 → お客様が選択 → Google投稿 ✓
          </div>
        </div>

        {/* Business tags */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["飲食", "美容", "整体", "クリニック", "ジム", "車屋"].map((t, i) => (
            <span
              key={i}
              style={{
                padding: "3px 10px",
                background: "rgba(110,139,255,0.08)",
                border: "1px solid rgba(110,139,255,0.15)",
                borderRadius: "100px",
                fontSize: "10px",
                color: "#6E8BFF",
                fontWeight: "500",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LPHero() {
  return (
    <section
      style={{
        background: "#0F1115",
        padding: "120px 24px 100px",
        borderBottom: "1px solid #252A34",
      }}
    >
      <div
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "72px",
          alignItems: "center",
        }}
        className="hero-grid"
      >
        {/* Left: Text */}
        <div>
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
              marginBottom: "32px",
              letterSpacing: "0.04em",
            }}
          >
            Google口コミ支援プラットフォーム
          </div>

          <h1
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(30px, 4vw, 52px)",
              fontWeight: "900",
              color: "#fff",
              lineHeight: 1.2,
              marginBottom: "24px",
            }}
          >
            お客様は来店前に、
            <br />
            もうお店を選んでいます。
          </h1>

          <p
            style={{
              fontSize: "16px",
              color: "#A5ACB8",
              lineHeight: 1.9,
              marginBottom: "16px",
            }}
          >
            Google検索。Googleマップ。口コミ。比較。
          </p>
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.9,
              marginBottom: "48px",
            }}
          >
            <span style={{ color: "#fff", fontWeight: "600" }}>
              その先で選ばれる店舗へ。
            </span>
          </p>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <a
              href="#pricing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "14px 32px",
                background: "#6E8BFF",
                color: "#fff",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "15px",
                textDecoration: "none",
                letterSpacing: "0.01em",
              }}
            >
              料金を見る →
            </a>
            <a
              href="#how-it-works"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "13px 28px",
                background: "transparent",
                color: "#A5ACB8",
                border: "1px solid #252A34",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "15px",
                textDecoration: "none",
              }}
            >
              仕組みを見る
            </a>
          </div>

          <p
            style={{
              color: "#5A6478",
              fontSize: "12px",
              marginTop: "20px",
              letterSpacing: "0.02em",
            }}
          >
            いつでも解約可能 ・ 最短即日スタート
          </p>
        </div>

        {/* Right: Dashboard mock + floating photo cards */}
        <div style={{ display: "flex", justifyContent: "flex-end", position: "relative" }}>
          {/* Floating photo card — top left */}
          <div
            style={{
              position: "absolute",
              top: "-28px",
              left: "-48px",
              width: "148px",
              borderRadius: "14px",
              overflow: "hidden",
              background: "#171A21",
              border: "1px solid #252A34",
              boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
              zIndex: 2,
              opacity: 0.92,
            }}
            className="hero-float-card"
          >
            <div style={{ height: "88px", background: "#252A34", overflow: "hidden" }}>
              <img
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&h=180&q=75"
                alt="美容室カット風景"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                loading="lazy"
              />
            </div>
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: "10px", color: "#D6B25E", marginBottom: "2px" }}>★★★★★</div>
              <div style={{ fontSize: "9px", color: "#fff", fontWeight: "600" }}>○○美容室 渋谷店</div>
              <div style={{ fontSize: "8px", color: "#5A6478", marginTop: "1px" }}>口コミ 94件</div>
            </div>
          </div>

          {/* Floating photo card — bottom right */}
          <div
            style={{
              position: "absolute",
              bottom: "-24px",
              right: "-36px",
              width: "136px",
              borderRadius: "14px",
              overflow: "hidden",
              background: "#171A21",
              border: "1px solid #252A34",
              boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
              zIndex: 2,
              opacity: 0.92,
            }}
            className="hero-float-card"
          >
            <div style={{ height: "80px", background: "#252A34", overflow: "hidden" }}>
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=280&h=160&q=75"
                alt="飲食店レビュー"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                loading="lazy"
              />
            </div>
            <div style={{ padding: "8px 10px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "rgba(110,139,255,0.12)",
                  border: "1px solid rgba(110,139,255,0.2)",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  marginBottom: "3px",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#6E8BFF",
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: "8px", color: "#6E8BFF", fontWeight: "700" }}>投稿完了</span>
              </div>
              <div style={{ fontSize: "9px", color: "#A5ACB8" }}>+1件 口コミ追加</div>
            </div>
          </div>

          <DashboardMock />
        </div>
      </div>
    </section>
  );
}
