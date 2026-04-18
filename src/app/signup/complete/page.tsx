"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CompleteContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("store_id");
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">("loading");

  useEffect(() => {
    if (!storeId) { setStatus("error"); return; }
    const check = async () => {
      const res = await fetch(`/api/signup/complete?store_id=${storeId}`);
      const data = await res.json();
      if (data.status === "active" || data.status === "契約中") {
        setStatus("success");
      } else if (data.status === "pending_payment") {
        setStatus("pending");
      } else {
        setStatus("error");
      }
    };
    check();
  }, [storeId]);

  return (
    <div style={{ background: "#fff", borderRadius: "20px", padding: "40px 32px", maxWidth: "480px", width: "100%", textAlign: "center" }}>
      {status === "loading" && (
        <>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <h2 style={{ color: "#1a2533", marginBottom: "8px" }}>決済確認中...</h2>
          <p style={{ color: "#888", fontSize: "14px" }}>しばらくお待ちください</p>
        </>
      )}
      {status === "success" && (
        <>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
          <h2 style={{ color: "#1a2533", marginBottom: "8px" }}>お申し込み完了！</h2>
          <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>
            ご登録のメールアドレスにログイン案内を送りました。<br />メールをご確認ください。
          </p>
          <a href="/mypage" style={{ display: "block", padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg,#2C7A4B,#3DA66A)", color: "#fff", fontWeight: "700", fontSize: "15px", textDecoration: "none" }}>
            マイページへ →
          </a>
        </>
      )}
      {status === "pending" && (
        <>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏰</div>
          <h2 style={{ color: "#1a2533", marginBottom: "8px" }}>決済確認中...</h2>
          <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>
            決済の確認に少し時間がかかっています。<br />しばらくしてから再読み込みしてください。
          </p>
          <button onClick={() => window.location.reload()}
            style={{ padding: "14px 32px", borderRadius: "12px", border: "none", background: "#F4F6F9", color: "#555", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
            再読み込み
          </button>
        </>
      )}
      {status === "error" && (
        <>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
          <h2 style={{ color: "#1a2533", marginBottom: "8px" }}>エラーが発生しました</h2>
          <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>お手数ですがお問い合わせください。</p>
          <a href="/signup" style={{ display: "block", padding: "14px", borderRadius: "12px", background: "#F4F6F9", color: "#555", fontWeight: "700", fontSize: "15px", textDecoration: "none" }}>
            申込フォームに戻る
          </a>
        </>
      )}
    </div>
  );
}

export default function SignupCompletePage() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0F1923,#1a3a2a)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Sans JP',sans-serif", padding: "16px" }}>
        <Suspense fallback={<div style={{ color: "#fff" }}>読み込み中...</div>}>
          <CompleteContent />
        </Suspense>
      </div>
    </>
  );
}
