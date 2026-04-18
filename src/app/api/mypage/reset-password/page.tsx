"use client";
import { useState } from "react";

export default function ResetPasswordPage() {
  const [step, setStep] = useState<"request" | "done">("request");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequest = async () => {
    if (!email) { setError("メールアドレスを入力してください"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/mypage/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setStep("done");
    } else {
      const data = await res.json();
      setError(data.error || "エラーが発生しました");
    }
    setLoading(false);
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0F1923,#1a3a2a)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Sans JP',sans-serif", padding: "16px" }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "26px", fontWeight: "800", color: "#fff" }}>REVIEW PRO</div>
            <div style={{ fontSize: "13px", color: "#7a9ab5", marginTop: "4px" }}>パスワード再設定</div>
          </div>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "32px" }}>
            {step === "request" ? (
              <>
                <p style={{ fontSize: "13px", color: "#555", marginBottom: "20px" }}>
                  ご登録のメールアドレスを入力してください。パスワード再設定用のURLをお送りします。
                </p>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>メールアドレス</label>
                  <input value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleRequest()}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
                </div>
                {error && <p style={{ color: "#E53E3E", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}
                <button onClick={handleRequest} disabled={loading}
                  style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#2C7A4B,#3DA66A)", color: "#fff", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
                  {loading ? "送信中..." : "再設定メールを送る"}
                </button>
                <div style={{ textAlign: "center", marginTop: "16px" }}>
                  <a href="/mypage" style={{ fontSize: "13px", color: "#2C7A4B" }}>← ログインに戻る</a>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: "center", fontSize: "48px", marginBottom: "16px" }}>📧</div>
                <h3 style={{ textAlign: "center", color: "#1a2533", marginBottom: "8px" }}>メールを送信しました</h3>
                <p style={{ fontSize: "13px", color: "#555", textAlign: "center", marginBottom: "24px" }}>
                  {email} にパスワード再設定URLをお送りしました。メールをご確認ください。
                </p>
                <a href="/mypage" style={{ display: "block", padding: "14px", borderRadius: "10px", background: "#F4F6F9", color: "#555", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", textAlign: "center", textDecoration: "none" }}>
                  ログインに戻る
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
