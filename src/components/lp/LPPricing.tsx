"use client";
import { useState } from "react";
import Link from "next/link";

const plans = [
  {
    key: "light",
    name: "ライト",
    monthlyPrice: { monthly: 4980, yearly: 3980 },
    setupFee: { monthly: 4980, yearly: 3980 },
    limit: "月10回",
    features: ["口コミ生成 月10回", "QR口コミ導線", "管理画面", "1店舗"],
    recommended: false,
  },
  {
    key: "standard",
    name: "スタンダード",
    monthlyPrice: { monthly: 9800, yearly: 7980 },
    setupFee: { monthly: 9800, yearly: 7980 },
    limit: "月20回",
    features: [
      "口コミ生成 月20回",
      "QR口コミ導線",
      "管理画面",
      "1店舗",
      "オプション追加可",
      "質問テンプレ変更可",
    ],
    recommended: false,
  },
  {
    key: "premium",
    name: "プレミアム",
    monthlyPrice: { monthly: 19800, yearly: 15800 },
    setupFee: { monthly: 19800, yearly: 15800 },
    limit: "無制限",
    features: [
      "口コミ生成 無制限",
      "QR口コミ導線",
      "管理画面",
      "1店舗",
      "🌐 インバウンド対応口コミ生成（英・中・韓）",
      "低評価対策PRO",
      "フィードバック一覧",
      "月次レポート（オプション対応）",
      "成果ダッシュボード",
      "優先サポート",
      "質問自由編集",
    ],
    recommended: true,
  },
];

const options = [
  { name: "低評価対策PRO", price: 3980, desc: "★2以下の低評価をGoogleへの投稿前に店舗へ回収" },
  { name: "QRアクセス分析PRO", price: 2980, desc: "QRコードの読取数を日別・月別でグラフ表示" },
  { name: "フィードバック一覧", price: 1980, desc: "低評価フィードバックをマイページで一覧確認" },
  { name: "月次レポート", price: 1480, desc: "口コミ数・評価推移をまとめたレポートを毎月メールでお届け" },
];

export default function LPPricing() {
  const [billing, setBilling] = useState<"yearly" | "monthly">("yearly");

  return (
    <section
      id="pricing"
      style={{
        background: "#0F1115",
        padding: "100px 0",
        borderBottom: "1px solid #252A34",
      }}
    >
      <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
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
            シンプルな料金プラン
          </h2>
          <p style={{ fontSize: "16px", color: "#A5ACB8", marginBottom: "40px" }}>
            年契約なら毎月お得。いつでも解約可能。
          </p>

          {/* Billing toggle */}
          <div
            style={{
              display: "inline-flex",
              background: "#171A21",
              border: "1px solid #252A34",
              borderRadius: "12px",
              padding: "4px",
            }}
          >
            <button
              onClick={() => setBilling("yearly")}
              style={{
                padding: "9px 28px",
                borderRadius: "9px",
                border: "none",
                background: billing === "yearly" ? "#6E8BFF" : "transparent",
                color: billing === "yearly" ? "#fff" : "#A5ACB8",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              年契約
              <span
                style={{
                  background: billing === "yearly" ? "rgba(255,255,255,0.2)" : "rgba(214,178,94,0.15)",
                  color: billing === "yearly" ? "#fff" : "#D6B25E",
                  borderRadius: "6px",
                  padding: "2px 8px",
                  fontSize: "10px",
                  fontWeight: "700",
                }}
              >
                おすすめ
              </span>
            </button>
            <button
              onClick={() => setBilling("monthly")}
              style={{
                padding: "9px 28px",
                borderRadius: "9px",
                border: "none",
                background: billing === "monthly" ? "#252A34" : "transparent",
                color: billing === "monthly" ? "#fff" : "#A5ACB8",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              月契約
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
            alignItems: "start",
            marginBottom: "48px",
          }}
          className="plan-grid"
        >
          {plans.map((plan) => {
            const price = plan.monthlyPrice[billing];
            const setup = plan.setupFee[billing];
            const firstMonth = price + setup;
            const isPremium = plan.recommended;

            return (
              <div
                key={plan.key}
                style={{
                  background: "#171A21",
                  borderRadius: "20px",
                  padding: "32px 28px",
                  border: isPremium ? "1px solid #D6B25E" : "1px solid #252A34",
                  position: "relative",
                  boxShadow: isPremium ? "0 0 48px rgba(214,178,94,0.07)" : "none",
                }}
              >
                {isPremium && (
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
                    最上位プラン
                  </div>
                )}

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: isPremium ? "#D6B25E" : "#A5ACB8",
                    marginBottom: "16px",
                    letterSpacing: "0.02em",
                  }}
                >
                  {plan.name}
                </div>

                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "42px",
                    fontWeight: "900",
                    color: "#fff",
                    lineHeight: 1,
                    marginBottom: "4px",
                  }}
                >
                  ¥{price.toLocaleString()}
                </div>
                <div style={{ fontSize: "13px", color: "#5A6478", marginBottom: "4px" }}>
                  /月（税別）
                </div>
                <div style={{ fontSize: "12px", color: "#5A6478", marginBottom: "12px" }}>
                  導入設定費 ¥{setup.toLocaleString()}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    background: "rgba(214,178,94,0.08)",
                    color: "#D6B25E",
                    borderRadius: "8px",
                    padding: "5px 12px",
                    marginBottom: "8px",
                    fontWeight: "600",
                    display: "inline-block",
                    border: "1px solid rgba(214,178,94,0.15)",
                  }}
                >
                  初月合計 ¥{firstMonth.toLocaleString()}
                </div>

                <div style={{ marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#6E8BFF",
                      background: "rgba(110,139,255,0.08)",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      border: "1px solid rgba(110,139,255,0.15)",
                    }}
                  >
                    {plan.limit}
                  </span>
                </div>

                <div
                  style={{
                    height: "1px",
                    background: "#252A34",
                    margin: "20px 0",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginBottom: "28px",
                  }}
                >
                  {plan.features.map((f, j) => (
                    <div
                      key={j}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                        fontSize: "14px",
                        color: "#A5ACB8",
                      }}
                    >
                      <span
                        style={{
                          color: isPremium ? "#D6B25E" : "#6E8BFF",
                          flexShrink: 0,
                          marginTop: "2px",
                          fontSize: "12px",
                        }}
                      >
                        ✓
                      </span>
                      {f}
                    </div>
                  ))}
                </div>

                <Link
                  href="/signup"
                  style={{
                    display: "block",
                    padding: "15px",
                    borderRadius: "12px",
                    background: isPremium ? "#6E8BFF" : "#252A34",
                    color: isPremium ? "#fff" : "#A5ACB8",
                    fontWeight: "700",
                    fontSize: "15px",
                    textDecoration: "none",
                    textAlign: "center",
                    transition: "all 0.2s",
                    letterSpacing: "0.01em",
                  }}
                >
                  始める →
                </Link>
              </div>
            );
          })}
        </div>

        {/* Options */}
        <div>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#fff",
                marginBottom: "8px",
              }}
            >
              オプション料金
            </h3>
            <p style={{ fontSize: "14px", color: "#A5ACB8" }}>
              スタンダードプランに追加可能。プレミアムには全て含まれています。
            </p>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}
            className="option-grid"
          >
            {options.map((opt, i) => (
              <div
                key={i}
                style={{
                  background: "#171A21",
                  border: "1px solid #252A34",
                  borderRadius: "14px",
                  padding: "20px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: "700",
                      fontSize: "14px",
                      color: "#fff",
                      marginBottom: "5px",
                    }}
                  >
                    {opt.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#5A6478" }}>{opt.desc}</div>
                </div>
                <div style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: "800",
                      fontSize: "18px",
                      color: "#D6B25E",
                    }}
                  >
                    ¥{opt.price.toLocaleString()}
                  </span>
                  <span style={{ fontSize: "11px", color: "#5A6478" }}>/月</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: "#5A6478", fontSize: "13px", marginTop: "28px", textAlign: "center" }}>
          ※ 初月は月額＋導入設定費のお支払いとなります。2ヶ月目以降は月額のみ。
        </p>
      </div>
    </section>
  );
}
