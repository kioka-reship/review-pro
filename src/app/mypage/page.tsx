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
                <h2 style={{ margin: "0 0 16px", fontSize: "16px", color: "#1a2533" }}>契約情報</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {[
                    { label: "店舗名", value: store.name },
                    { label: "プラン", value: PLAN_LABELS[store.plan] || store.plan },
                    { label: "契約状態", value: store.status },
                    { label: "次回請求日", value: store.next_billing_date || "未設定" },
                  ].map((item, i) => (
                    <div key={i} style={{ background: "#F4F6F9", borderRadius: "10px", padding: "14px" }}>
                      <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>{item.label}</div>
                      <div style={{ fontWeight: "700", color: "#1a2533" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {usage && (
                <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <h2 style={{ margin: "0 0 16px", fontSize: "16px", color: "#1a2533" }}>今月の利用状況</h2>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", color: "#888" }}>利用回数</span>
                    <span style={{ fontWeight: "700", color: "#1a2533" }}>{usage.used} / {usage.limit >= 99999 ? "無制限" : `${usage.limit}回`}</span>
                  </div>
                  {usage.limit < 99999 && (
                    <div style={{ background: "#F4F6F9", borderRadius: "8px", height: "12px", overflow: "hidden" }}>
                      <div style={{ background: "#2C7A4B", height: "100%", width: `${Math.min((usage.used / usage.limit) * 100, 100)}%`, borderRadius: "8px", transition: "width 0.3s" }} />
                    </div>
                  )}
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
                    残り {usage.limit >= 99999 ? "無制限" : `${Math.max(usage.limit - usage.used, 0)}回`}
                  </div>
                </div>
              )}

              {options.length > 0 && (
                <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <h2 style={{ margin: "0 0 16px", fontSize: "16px", color: "#1a2533" }}>契約中のオプション</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {options.map(opt => (
                      <div key={opt.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#F4F6F9", borderRadius: "10px" }}>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "13px" }}>{opt.option_name}</div>
                          {opt.cancel_effective_date && (
                            <div style={{ fontSize: "11px", color: "#E53E3E", marginTop: "2px" }}>{opt.cancel_effective_date} 停止予定</div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontWeight: "700", color: "#2C7A4B" }}>¥{opt.amount.toLocaleString()}/月</span>
                          {opt.status === "active" && (
                            <button onClick={() => handleOptionCancel(opt.id)}
                              style={{ background: "#FEF2F2", border: "none", color: "#991B1B", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
                              解約申請
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 請求履歴 */}
          {activeTab === "billing" && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <h2 style={{ margin: "0 0 20px", fontSize: "16px", color: "#1a2533" }}>請求履歴</h2>
              {invoices.length === 0 ? (
                <p style={{ color: "#aaa", textAlign: "center", padding: "32px" }}>請求履歴がありません</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {invoices.map(inv => (
                    <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "#F4F6F9", borderRadius: "10px" }}>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "13px" }}>{inv.description}</div>
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("ja-JP") : new Date(inv.created_at).toLocaleDateString("ja-JP")}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontWeight: "700" }}>¥{inv.amount.toLocaleString()}</span>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: inv.status === "paid" ? "#ECFDF5" : "#FEF2F2", color: inv.status === "paid" ? "#065F46" : "#991B1B", fontWeight: "600" }}>
                          {inv.status === "paid" ? "支払済" : inv.status === "pending" ? "未払い" : "失敗"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* QRコード */}
          {activeTab === "qr" && store && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", textAlign: "center" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: "16px", color: "#1a2533" }}>口コミ投稿QRコード</h2>
              <p style={{ color: "#888", fontSize: "13px", margin: "0 0 24px" }}>このQRコードをお店に設置してください</p>
              <div style={{ background: "#F4F6F9", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <code style={{ fontSize: "12px", color: "#555", wordBreak: "break-all" }}>{APP_URL}/review/{store.id}</code>
              </div>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`${APP_URL}/review/${store.id}`)}`}
                alt="QRコード" style={{ width: "240px", height: "240px", borderRadius: "8px", marginBottom: "20px" }} />
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <a href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`${APP_URL}/review/${store.id}`)}&format=png`}
                  download="qrcode.png"
                  style={{ padding: "10px 20px", borderRadius: "10px", background: "#2C7A4B", color: "#fff", fontWeight: "600", fontSize: "13px", textDecoration: "none" }}>
                  📥 PNG保存
                </a>
                <a href={`/api/mypage/qr-pdf?store_id=${store.id}`}
                  style={{ padding: "10px 20px", borderRadius: "10px", background: "#1a2533", color: "#fff", fontWeight: "600", fontSize: "13px", textDecoration: "none" }}>
                  📄 A4 POP印刷用
                </a>
              </div>
            </div>
          )}

          {/* 解約申請 */}
          {activeTab === "cancel" && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "16px", color: "#1a2533" }}>解約申請</h2>
              <div style={{ background: "#FFFBEB", border: "1px solid #F59E0B", borderRadius: "10px", padding: "16px", marginBottom: "20px", fontSize: "13px", color: "#92400E" }}>
                ⚠️ 解約申請後、翌月末をもってサービスを停止します。<br />
                データは解約後90日間保持されます。
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>解約理由（任意）</label>
                <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={4} placeholder="解約理由をお聞かせください（任意）"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", outline: "none", resize: "vertical" }} />
              </div>
              {cancelMsg && <p style={{ color: cancelMsg.startsWith("✅") ? "#2C7A4B" : "#E53E3E", fontSize: "13px", fontWeight: "600", marginBottom: "16px" }}>{cancelMsg}</p>}
              <button onClick={handleCancelRequest}
                style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "#DC2626", color: "#fff", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
                解約申請を送信する
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
