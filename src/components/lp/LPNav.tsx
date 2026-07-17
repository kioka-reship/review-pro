import Link from "next/link";

export default function LPNav() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(15, 17, 21, 0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #252A34",
      }}
    >
      <div
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        <div
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "18px",
            fontWeight: "900",
            color: "#fff",
            letterSpacing: "0.04em",
          }}
        >
          REVIEW PRO
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <a
            href="#pricing"
            style={{
              color: "#A5ACB8",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
              transition: "color 0.15s",
            }}
          >
            料金
          </a>
          <a
            href="#faq"
            style={{
              color: "#A5ACB8",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            FAQ
          </a>
          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "9px 22px",
              background: "#6E8BFF",
              color: "#fff",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "13px",
              textDecoration: "none",
              transition: "background 0.15s",
            }}
          >
            お申し込み
          </Link>
        </div>
      </div>
    </nav>
  );
}
