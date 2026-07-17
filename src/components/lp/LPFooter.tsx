import Link from "next/link";

export default function LPFooter() {
  return (
    <footer
      style={{
        background: "#0A0D12",
        borderTop: "1px solid #252A34",
        padding: "56px 24px 32px",
      }}
    >
      <div
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "40px",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "18px",
              fontWeight: "900",
              color: "#fff",
              marginBottom: "8px",
              letterSpacing: "0.04em",
            }}
          >
            REVIEW PRO
          </div>
          <p style={{ color: "#5A6478", fontSize: "13px" }}>合同会社Relationship</p>
        </div>

        <div style={{ display: "flex", gap: "56px", flexWrap: "wrap" }}>
          <div>
            <div
              style={{
                color: "#A5ACB8",
                fontSize: "11px",
                fontWeight: "700",
                marginBottom: "14px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              サービス
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a
                href="#features"
                style={{ color: "#5A6478", textDecoration: "none", fontSize: "14px" }}
              >
                機能
              </a>
              <a
                href="#pricing"
                style={{ color: "#5A6478", textDecoration: "none", fontSize: "14px" }}
              >
                料金
              </a>
              <Link
                href="/signup"
                style={{ color: "#5A6478", textDecoration: "none", fontSize: "14px" }}
              >
                お申し込み
              </Link>
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#A5ACB8",
                fontSize: "11px",
                fontWeight: "700",
                marginBottom: "14px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              サポート
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                href="/mypage"
                style={{ color: "#5A6478", textDecoration: "none", fontSize: "14px" }}
              >
                マイページ
              </Link>
              <a
                href="mailto:info@re-ship.co.jp"
                style={{ color: "#5A6478", textDecoration: "none", fontSize: "14px" }}
              >
                お問い合わせ
              </a>
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#A5ACB8",
                fontSize: "11px",
                fontWeight: "700",
                marginBottom: "14px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              法的情報
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                href="/terms"
                style={{ color: "#5A6478", textDecoration: "none", fontSize: "14px" }}
              >
                利用規約
              </Link>
              <Link
                href="/privacy"
                style={{ color: "#5A6478", textDecoration: "none", fontSize: "14px" }}
              >
                プライバシーポリシー
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          borderTop: "1px solid #252A34",
          marginTop: "48px",
          paddingTop: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#5A6478", fontSize: "13px" }}>
          © 2024 合同会社Relationship. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
