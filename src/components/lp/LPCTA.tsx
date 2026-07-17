import Link from "next/link";

export default function LPCTA() {
  return (
    <section
      style={{
        background: "#0F1115",
        padding: "100px 24px",
        textAlign: "center",
        borderBottom: "1px solid #252A34",
      }}
    >
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "clamp(26px, 3.5vw, 44px)",
            fontWeight: "900",
            color: "#fff",
            marginBottom: "20px",
            lineHeight: 1.2,
          }}
        >
          今すぐ、選ばれる店舗へ。
        </h2>
        <p
          style={{
            color: "#A5ACB8",
            fontSize: "16px",
            marginBottom: "48px",
            lineHeight: 1.9,
          }}
        >
          年契約なら月々¥3,980から。
          <br />
          設定は最短5分で完了します。
        </p>

        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "16px 48px",
              background: "#6E8BFF",
              color: "#fff",
              borderRadius: "12px",
              fontWeight: "700",
              fontSize: "16px",
              textDecoration: "none",
              letterSpacing: "0.01em",
            }}
          >
            お申し込みはこちら →
          </Link>
          <a
            href="#pricing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "15px 32px",
              background: "transparent",
              color: "#A5ACB8",
              border: "1px solid #252A34",
              borderRadius: "12px",
              fontWeight: "600",
              fontSize: "16px",
              textDecoration: "none",
            }}
          >
            料金を確認する
          </a>
        </div>

        <p
          style={{
            color: "#5A6478",
            fontSize: "12px",
            marginTop: "24px",
            letterSpacing: "0.02em",
          }}
        >
          いつでも解約可能 ・ サポートあり
        </p>
      </div>
    </section>
  );
}
