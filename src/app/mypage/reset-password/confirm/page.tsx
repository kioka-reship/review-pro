"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [step, setStep] = useState<"input" | "done" | "error">("input");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setStep("error");
  }, [token]);

  const handleSubmit = async () => {
    if (!password || password.length < 8) { setError("パスワードは8文字以上で入力してください"); return; }
    if (password !== confirm) { setError("パスワードが一致しません"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/mypage/reset-password/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
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
    <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "380px" }}>
      {step === "input" && (
        <>
          <h3 style={{ margin: "0 0 8px", color: "#1a2533", textAlign: "center" }}>新しいパスワード設定</h3>
          <p style={{ fontSize: "13px", color: "#888", textAlign: "center", marginBottom: "24px" }}>新しいパスワードを入力してください</p>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>新しいパスワード（8文字以上）</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>確認用パスワード</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
          </div>
          {error && <p style={{ color: "#E53E3E", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#2C7A4B,#3DA66A)", color: "#fff", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
            {loading ? "設定中..." : "パスワードを設定する"}
          </button>
        </>
      )}
      {step === "done" && (
        <>
          <div style={{ textAlign: "center", fontSize: "48px", marginBottom: "16px" }}>✅</div>
          <h3 style={{ textAlign: "center", color: "#1a2533", marginBottom: "8px" }}>設定完了！</h3>
          <p style={{ fontSize: "13px", color: "#888", textAlign: "center", marginBottom: "24px" }}>新しいパスワードでログインできます。</p>
          <a href="/mypage" style={{ display: "block", padding: "14px", borderRadius: "10px", background: "linear-gradient(135deg,#2C7A4B,#3DA66A)", color: "#fff", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", textAlign: "center", textDecoration: "none" }}>
            ログインする
          </a>
        </>
      )}
      {step === "error" && (
        <>
          <div style={{ textAlign: "center", fontSize: "48px", marginBottom: "16px" }}>❌</div>
          <h3 style={{ textAlign: "center", color: "#1a2533", marginBottom: "8px" }}>リンクが無効です</h3>
          <p style={{ fontSize: "13px", color: "#888", textAlign: "center", marginBottom: "24px" }}>リンクの有効期限が切れているか、無効なURLです。</p>
          <a href="/mypage/reset-password" style={{ display: "block", padding: "14px", borderRadius: "10px", background: "#F4F6F9", color: "#555", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", textAlign: "center", textDecoration: "none" }}>
            再度申請する
          </a>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0F1923,#1a3a2a)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Sans JP',sans-serif", padding: "16px" }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "26px", fontWeight: "800", color: "#fff" }}>REVIEW PRO</div>
          </div>
          <Suspense fallback={<div style={{ color: "#fff", textAlign: "center" }}>読み込み中...</div>}>
            <ConfirmContent />
          </Suspense>
        </div>
      </div>
    </>
  );
}
