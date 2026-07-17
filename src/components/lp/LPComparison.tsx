export default function LPComparison() {
  return (
    <section
      style={{
        background: "#171A21",
        padding: "100px 0",
        borderBottom: "1px solid #252A34",
      }}
    >
      <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 24px" }}>
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
              marginBottom: "28px",
              letterSpacing: "0.04em",
            }}
          >
            口コミ数の差が、選ばれる差になる
          </div>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(26px, 3.5vw, 40px)",
              fontWeight: "900",
              color: "#fff",
              marginBottom: "16px",
              lineHeight: 1.25,
            }}
          >
            評価ではなく、
            <br />
            信頼で選ばれる時代へ
          </h2>
          <p style={{ fontSize: "16px", color: "#A5ACB8", lineHeight: 1.8 }}>
            どちらも星4.8。でも、お客様が選ぶのはどちらか？
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: "32px",
            alignItems: "center",
          }}
          className="comparison-grid"
        >
          {/* Store A */}
          <div
            style={{
              background: "rgba(23, 26, 33, 0.6)",
              border: "1px solid #252A34",
              borderRadius: "20px",
              padding: "36px",
              textAlign: "center",
              opacity: 0.7,
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#5A6478",
                fontWeight: "600",
                marginBottom: "20px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Before
            </div>
            <div
              style={{
                background: "#0F1115",
                border: "1px solid #252A34",
                borderRadius: "14px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#5A6478",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ color: "#4285F4", fontSize: "14px", fontWeight: "900" }}>G</span>
                oogle マップ
              </div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "40px",
                  fontWeight: "900",
                  color: "#A5ACB8",
                  lineHeight: 1,
                  marginBottom: "6px",
                }}
              >
                4.8
              </div>
              <div style={{ fontSize: "18px", color: "#D6B25E", marginBottom: "12px" }}>
                ★★★★★
              </div>
              <div style={{ fontSize: "14px", color: "#5A6478" }}>
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "28px",
                    fontWeight: "900",
                    color: "#A5ACB8",
                  }}
                >
                  18
                </span>{" "}
                件のレビュー
              </div>
            </div>
            <p style={{ fontSize: "14px", color: "#5A6478", lineHeight: 1.7 }}>
              評価は高い。<br />でも信頼には届かない。
            </p>
          </div>

          {/* VS */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "20px",
                fontWeight: "900",
                color: "#252A34",
                marginBottom: "12px",
              }}
            >
              VS
            </div>
            <div
              style={{
                width: "1px",
                height: "80px",
                background: "linear-gradient(180deg, transparent, #252A34, transparent)",
                margin: "0 auto",
              }}
            />
          </div>

          {/* Store B */}
          <div
            style={{
              background: "#171A21",
              border: "1px solid #D6B25E",
              borderRadius: "20px",
              padding: "36px",
              textAlign: "center",
              boxShadow: "0 0 40px rgba(214,178,94,0.06)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-13px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "#D6B25E",
                color: "#0F1115",
                borderRadius: "100px",
                padding: "4px 20px",
                fontSize: "11px",
                fontWeight: "700",
                whiteSpace: "nowrap",
                letterSpacing: "0.04em",
              }}
            >
              選ばれる店舗
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#D6B25E",
                fontWeight: "600",
                marginBottom: "20px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              After
            </div>
            <div
              style={{
                background: "#0F1115",
                border: "1px solid rgba(214,178,94,0.2)",
                borderRadius: "14px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#5A6478",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ color: "#4285F4", fontSize: "14px", fontWeight: "900" }}>G</span>
                oogle マップ
              </div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "40px",
                  fontWeight: "900",
                  color: "#D6B25E",
                  lineHeight: 1,
                  marginBottom: "6px",
                }}
              >
                4.8
              </div>
              <div style={{ fontSize: "18px", color: "#D6B25E", marginBottom: "12px" }}>
                ★★★★★
              </div>
              <div style={{ fontSize: "14px", color: "#A5ACB8" }}>
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "28px",
                    fontWeight: "900",
                    color: "#D6B25E",
                  }}
                >
                  260
                </span>{" "}
                件のレビュー
              </div>
            </div>
            <p style={{ fontSize: "14px", color: "#A5ACB8", lineHeight: 1.7 }}>
              評価も高い。<br />そして、信頼も積み重なっている。
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "56px" }}>
          <p
            style={{
              fontSize: "15px",
              color: "#A5ACB8",
              lineHeight: 1.9,
              maxWidth: "560px",
              margin: "0 auto",
            }}
          >
            星の数が同じでも、口コミ件数が多い店舗の方が
            <br />
            <span style={{ color: "#fff", fontWeight: "600" }}>
              3〜4倍 クリックされやすい
            </span>
            というデータがあります。
          </p>
        </div>
      </div>
    </section>
  );
}
