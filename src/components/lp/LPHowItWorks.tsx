/* eslint-disable @next/next/no-img-element */

export default function LPHowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{ background: "#0F1115", padding: "100px 0", borderBottom: "1px solid #252A34" }}
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
            たった3ステップで
            <br />
            口コミが集まる仕組み
          </h2>
          <p style={{ fontSize: "16px", color: "#A5ACB8", lineHeight: 1.8 }}>
            難しい設定は一切不要。今日から始められます。
          </p>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}
          className="step-grid"
        >
          {/* ─── STEP 1 ─── */}
          <div
            style={{
              background: "rgba(23,26,33,0.8)",
              border: "1px solid #252A34",
              borderRadius: "20px",
              overflow: "hidden",
            }}
          >
            {/* Photo area */}
            <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
              <img
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&h=440&q=75"
                alt="美容室受付にQRコードを設置"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                loading="lazy"
              />
              {/* Photo overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(15,17,21,0.1) 30%, rgba(15,17,21,0.7) 100%)",
                }}
              />
              {/* Step badge */}
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "14px",
                  background: "rgba(15,17,21,0.75)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(110,139,255,0.3)",
                  borderRadius: "8px",
                  padding: "4px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "11px",
                    fontWeight: "800",
                    color: "#6E8BFF",
                  }}
                >
                  STEP 01
                </span>
              </div>
              {/* UI overlay badge */}
              <div
                style={{
                  position: "absolute",
                  bottom: "14px",
                  left: "14px",
                  right: "14px",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(15,17,21,0.85)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    border: "1px solid rgba(110,139,255,0.25)",
                    borderRadius: "10px",
                    padding: "8px 14px",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#6E8BFF",
                      display: "inline-block",
                      flexShrink: 0,
                      boxShadow: "0 0 6px rgba(110,139,255,0.8)",
                    }}
                  />
                  <span style={{ fontSize: "12px", color: "#fff", fontWeight: "700" }}>
                    QR設置済み
                  </span>
                  <span
                    style={{
                      width: 1,
                      height: 12,
                      background: "#252A34",
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "#A5ACB8" }}>レビュー導線開始</span>
                </div>
              </div>
            </div>
            {/* Text */}
            <div style={{ padding: "20px 22px 24px" }}>
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: "700",
                  color: "#fff",
                  marginBottom: "10px",
                }}
              >
                QRコードを設置
              </h3>
              <p style={{ fontSize: "14px", color: "#A5ACB8", lineHeight: 1.8, margin: 0 }}>
                マイページからQRコードを印刷して、レジや卓上に設置するだけ。数分で完了します。
              </p>
            </div>
          </div>

          {/* ─── STEP 2 ─── */}
          <div
            style={{
              background: "rgba(23,26,33,0.8)",
              border: "1px solid #252A34",
              borderRadius: "20px",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
              <img
                src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&h=440&q=75"
                alt="お客様がスマートフォンでQRを読み取る"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                loading="lazy"
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(160deg, rgba(15,17,21,0.2) 0%, rgba(15,17,21,0.65) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "14px",
                  background: "rgba(15,17,21,0.75)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(110,139,255,0.3)",
                  borderRadius: "8px",
                  padding: "4px 12px",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "11px",
                    fontWeight: "800",
                    color: "#6E8BFF",
                  }}
                >
                  STEP 02
                </span>
              </div>
              {/* Floating phone UI */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "16px",
                  transform: "translateY(-50%)",
                  width: "76px",
                  background: "rgba(15,17,21,0.92)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "14px",
                  padding: "8px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  style={{
                    background: "#6E8BFF",
                    borderRadius: "5px",
                    padding: "3px 0",
                    textAlign: "center",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ fontSize: "6.5px", color: "#fff", fontWeight: "700" }}>
                    口コミ投稿
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#D6B25E",
                    textAlign: "center",
                    marginBottom: "5px",
                    lineHeight: 1,
                  }}
                >
                  ★★★★
                </div>
                <div style={{ display: "flex", gap: "2px", flexWrap: "wrap", marginBottom: "5px" }}>
                  {["対応◎", "仕上り◎"].map((t, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "5px",
                        background: "rgba(110,139,255,0.2)",
                        color: "#6E8BFF",
                        borderRadius: "3px",
                        padding: "2px 4px",
                        fontWeight: "600",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    background: "rgba(110,139,255,0.15)",
                    borderRadius: "4px",
                    padding: "4px",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "6px", color: "#6E8BFF", fontWeight: "700" }}>
                    AI生成中...
                  </span>
                </div>
              </div>
              {/* Bottom badge */}
              <div
                style={{ position: "absolute", bottom: "14px", left: "14px", right: "14px" }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(15,17,21,0.85)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    border: "1px solid rgba(110,139,255,0.25)",
                    borderRadius: "10px",
                    padding: "8px 14px",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "#A5ACB8" }}>満足度入力</span>
                  <span style={{ fontSize: "11px", color: "#6E8BFF" }}>→</span>
                  <span style={{ fontSize: "12px", color: "#fff", fontWeight: "700" }}>
                    AIレビュー生成
                  </span>
                </div>
              </div>
            </div>
            <div style={{ padding: "20px 22px 24px" }}>
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: "700",
                  color: "#fff",
                  marginBottom: "10px",
                }}
              >
                お客様がQRを読み取る
              </h3>
              <p style={{ fontSize: "14px", color: "#A5ACB8", lineHeight: 1.8, margin: 0 }}>
                7つの質問に答えるだけでAIが口コミ文を3パターン自動生成。選ぶだけでOKです。
              </p>
            </div>
          </div>

          {/* ─── STEP 3 ─── */}
          <div
            style={{
              background: "rgba(23,26,33,0.8)",
              border: "1px solid #252A34",
              borderRadius: "20px",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&h=440&q=75"
                alt="Googleマップで店舗を検索"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                loading="lazy"
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(15,17,21,0.1) 20%, rgba(15,17,21,0.72) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "14px",
                  background: "rgba(15,17,21,0.75)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(214,178,94,0.3)",
                  borderRadius: "8px",
                  padding: "4px 12px",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "11px",
                    fontWeight: "800",
                    color: "#D6B25E",
                  }}
                >
                  STEP 03
                </span>
              </div>
              {/* Google Maps card overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: "14px",
                  left: "14px",
                  right: "14px",
                  background: "rgba(255,255,255,0.95)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#fff",
                      border: "1px solid #E4E8F0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        color: "#4285F4",
                        fontWeight: "900",
                        fontSize: "14px",
                        lineHeight: 1,
                      }}
                    >
                      G
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#1A2333",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      ○○サロン 渋谷店
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "2px" }}
                    >
                      <span style={{ fontSize: "10px", color: "#D6B25E", lineHeight: 1 }}>
                        ★★★★★
                      </span>
                      <span style={{ fontSize: "10px", color: "#333", fontWeight: "700" }}>
                        4.8
                      </span>
                      <span style={{ fontSize: "10px", color: "#888" }}>（260件）</span>
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#6E8BFF",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "9px",
                      color: "#fff",
                      fontWeight: "700",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    投稿完了 ✓
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: "20px 22px 24px" }}>
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: "700",
                  color: "#fff",
                  marginBottom: "10px",
                }}
              >
                Googleマップに投稿
              </h3>
              <p style={{ fontSize: "14px", color: "#A5ACB8", lineHeight: 1.8, margin: 0 }}>
                生成された文章をコピーしてGoogleマップに投稿。お客様の負担を最小限に抑えます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
