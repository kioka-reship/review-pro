"use client";
import { useState, useEffect } from "react";

type Store = {
  id: string;
  name: string;
  plan: string;
  status: string;
  next_billing_date: string;
  email: string;
};

type Usage = {
  used: number;
  limit: number;
};

type Invoice = {
  id: string;
  description: string;
  amount: number;
  status: string;
  paid_at: string;
  created_at: string;
};

type OptionSub = {
  id: string;
  option_key: string;
  option_name: string;
  amount: number;
  status: string;
  cancel_effective_date: string | null;
};

const PLAN_LABELS: Record<string, string> = {
  light: "ライト",
  standard: "スタンダード",
  premium: "プレミアム",
};

const APP_URL = "https://review-pro-ay7x.vercel.app";

export default function MyPage() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [store, setStore] = useState<Store | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [options, setOptions] = useState<OptionSub[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "billing" | "qr" | "cancel">("home");
  const [loading, setLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelMsg, setCancelMsg] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    const res = await fetch("/api/mypage/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setStore(data.store);
      setAuthed(true);
      fetchData(data.store.id);
    } else {
      setLoginError(data.error || "ログインに失敗しました");
    }
    setLoading(false);
  };

  const fetchData = async (storeId: string) => {
    const [usageRes, invoiceRes, optionRes] = await Promise.all([
      fetch(`/api/mypage/usage?store_id=${storeId}`),
      fetch(`/api/mypage/invoices?store_id=${storeId}`),
      fetch(`/api/mypage/options?store_id=${storeId}`),
    ]);
    const usageData = await usageRes.json();
    const invoiceData = await invoiceRes.json();
    const optionData = await optionRes.json();
    setUsage(usageData);
    setInvoices(invoiceData.invoices || []);
    setOptions(optionData.options || []);
  };

  const handleCancelRequest = async () => {
    if (!store) return;
    const res = await fetch("/api/mypage/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: store.id, reason: cancelReason }),
    });
    if (res.ok) {
      setCancelMsg("✅ 解約申請を受け付けました。確認メールをお送りしました。");
    } else {
      setCancelMsg("❌ エラーが発生しました。お問い合わせください。");
    }
  };

  const handleOptionCancel = async (optionId: string) => {
    if (!store) return;
    if (!confirm("このオプションの解約を申請しますか？翌月から停止されます。")) return;
    const res = await fetch("/api/mypage/options/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: store.id, option_id: optionId }),
    });
    if (res.ok) {
      alert("✅ 解約申請を受け付けました。翌月から停止されます。");
      fetchData(store.id);
    } else {
      alert("❌ エラーが発生しました。");
    }
  };

  if (!authed) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0F1923,#1a3a2a)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Sans JP',sans-serif", padding: "16px" }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "26px", fontWeight: "800", color: "#fff" }}>REVIEW PRO</div>
            <div style={{ fontSize: "13px", color: "#7a9ab5", marginTop: "4px" }}>マイページログイン</div>
          </div>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "32px" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>メールアドレス</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>パスワード</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
            </div>
            {loginError && <p style={{ color: "#E53E3E", fontSize: "13px", textAlign: "center", marginBottom: "16px" }}>{loginError}</p>}
            <button onClick={handleLogin} disabled={loading}
              style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#2C7A4B,#3DA66A)", color: "#fff", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
              {loading ? "ログイン中..." : "ログイン"}
            </button>
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <a href="/mypage/reset-password" style={{ fontSize: "13px", color: "#2C7A4B" }}>パスワードを忘れた方はこちら</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>
      <div style={{ minHeight: "100vh", background: "#F4F6F9", fontFamily: "'Noto Sans JP',sans-serif" }}>
        <div style={{ background: "#0F1923", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "18px", fontWeight: "800", color: "#fff" }}>REVIEW PRO</div>
          <button onClick={() => setAuthed(false)} style={{ background: "none", border: "1px solid #2a3f5a", color: "#7a9ab5", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>ログアウト</button>
        </div>

        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "28px 20px" }}>
          {/* タブ */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
            {[
              { key: "home", label: "🏠 ホーム" },
              { key: "billing", label: "💳 請求履歴" },
              { key: "qr", label: "📱 QRコード" },
              { key: "cancel", label: "🚪 解約" },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: activeTab === t.key ? "#2C7A4B" : "#fff", color: activeTab === t.key ? "#fff" : "#555", fontFamily: "inherit", fontSize: "14px", fontWeight: "600", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ホーム */}
          {activeTab === "home" && store && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <h2 style={{ margin: "0 0 16px", fontSize: "16px", color: "#1a25
