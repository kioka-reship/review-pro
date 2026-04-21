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

type Question = {
  id: number;
  store_id: string;
  order_num: number;
  label: string;
  type: string;
  options: string[] | null;
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
  const [activeTab, setActiveTab] = useState<"home" | "billing" | "qr" | "plan" | "options" | "questions" | "feedback" | "cancel">("home");
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [feedbackMonth, setFeedbackMonth] = useState("");
  const [qrLogs, setQrLogs] = useState<any[]>([]);

const fetchQrLogs = async (storeId: string) => {
  const res = await fetch(`/api/mypage/qr-analytics?store_id=${storeId}`);
  const data = await res.json();
  setQrLogs(data.logs || []);
};

  const fetchFeedback = async (storeId: string) => {
    const res = await fetch(`/api/admin/feedback?store_id=${storeId}`);
    const data = await res.json();
    setFeedbackList(data.feedback || []);
  };
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsSaved, setQuestionsSaved] = useState(false);

  const fetchQuestions = async (storeId: string) => {
    const res = await fetch(`/api/admin/questions?store_id=${storeId}`);
    const data = await res.json();
    setQuestions(data.questions || []);
  };

  const handleSaveQuestions = async () => {
    if (!store) return;
    setQuestionsLoading(true);
    await fetch("/api/admin/questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: store.id, questions }),
    });
    setQuestionsLoading(false);
    setQuestionsSaved(true);
    setTimeout(() => setQuestionsSaved(false), 2000);
  };

  const updateQuestionLabel = (idx: number, value: string) => {
    const next = [...questions];
    next[idx].label = value.slice(0, 50);
    setQuestions(next);
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const next = [...questions];
    if (next[qIdx].options) {
      next[qIdx].options![oIdx] = value.slice(0, 30);
      setQuestions(next);
    }
  };

  const addOption = (qIdx: number) => {
    const next = [...questions];
    if (next[qIdx].options && next[qIdx].options!.length < 8) {
      next[qIdx].options!.push("新しい選択肢");
      setQuestions(next);
    }
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    const next = [...questions];
    if (next[qIdx].options && next[qIdx].options!.length > 2) {
      next[qIdx].options!.splice(oIdx, 1);
      setQuestions(next);
    }
  };
  const [planMsg, setPlanMsg] = useState("");
  const [optionMsg, setOptionMsg] = useState("");

  const OPTION_LIST = [
  { key: "low_review_pro", name: "低評価対策PRO", price: 2980, description: "★3以下の低評価が付いた際に、Googleへの投稿前に店舗へ直接フィードバックを誘導。悪い口コミを未然に防ぎます。" },
  { key: "ai_reply", name: "AI口コミ自動返信", price: 1980, description: "Googleに届いた口コミにAIが自動で返信。オーナー返信率を高め、Googleの評価アップにつながります。" },
  { key: "feedback_list", name: "フィードバック一覧", price: 1480, description: "低評価ユーザーからのフィードバックをマイページで一覧表示。改善ポイントの把握に役立ちます。" },
  { key: "monthly_report", name: "月次自動レポート", price: 980, description: "口コミ数・評価推移などを毎月自動でレポートメール送信。データで改善サイクルを回せます。" },
];

  const PLAN_PRICES: Record<string, { price: number; setupFee: number; name: string }> = {
    light:    { price: 2980,  setupFee: 0,     name: "ライト" },
    standard: { price: 5980,  setupFee: 9800,  name: "スタンダード" },
    premium:  { price: 9800,  setupFee: 19800, name: "プレミアム" },
  };

  const handlePlanChange = async (newPlan: string) => {
    if (!store) return;
    const currentPlan = store.plan;
    if (currentPlan === newPlan) return;

    const isUpgrade = (
      (currentPlan === "light" && (newPlan === "standard" || newPlan === "premium")) ||
      (currentPlan === "standard" && newPlan === "premium")
    );

    const confirmMsg = isUpgrade
      ? `${PLAN_PRICES[newPlan].name}にアップグレードします。差額が即時決済されます。よろしいですか？`
      : `${PLAN_PRICES[newPlan].name}にダウングレードします。次回請求日から反映されます。よろしいですか？`;

    if (!confirm(confirmMsg)) return;

    const res = await fetch("/api/mypage/plan-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: store.id, current_plan: currentPlan, new_plan: newPlan }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else if (res.ok) {
      setPlanMsg("✅ ダウングレードを受け付けました。次回請求日から反映されます。");
      setStore({ ...store, plan: newPlan });
    } else {
      setPlanMsg("❌ エラーが発生しました: " + (data.error || "不明なエラー"));
    }
  };

  const handleOptionAdd = async (optionKey: string, optionName: string, price: number) => {
    if (!store) return;
    if (!confirm(`${optionName}（¥${price.toLocaleString()}/月）を追加します。即時決済されます。よろしいですか？`)) return;

    const res = await fetch("/api/mypage/option-add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: store.id, option_key: optionKey, option_name: optionName, price }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setOptionMsg("❌ エラーが発生しました: " + (data.error || "不明なエラー"));
    }
  };
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
              { key: "plan", label: "📋 プラン変更" },
              ...(store?.plan === "standard" || store?.plan === "premium" ? [{ key: "options", label: "➕ オプション" }] : []),
              ...(store?.plan !== "light" ? [{ key: "questions", label: "❓ 質問設定" }] : []),
              ...(store?.plan === "premium" ? [{ key: "feedback", label: "⭐ 低評価FB" }] : []),
              { key: "billing", label: "💳 請求履歴" },
      ...(store?.plan === "standard" || store?.plan === "premium" ? [{ key: "qr_analytics", label: "📊 QR分析" }] : []),
              { key: "qr", label: "📱 QRコード" },
              { key: "cancel", label: "🚪 解約" },
            ].map(t => (
              <button key={t.key} onClick={() => {
                setActiveTab(t.key as any);
                if (t.key === "questions" && store) fetchQuestions(store.id);
                if (t.key === "feedback" && store) fetchFeedback(store.id);
                if (t.key === "qr_analytics" && store) fetchQrLogs(store.id);
              }}
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

          {/* プラン変更 */}
          {activeTab === "plan" && store && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: "16px", color: "#1a2533" }}>プラン変更</h2>
              <p style={{ color: "#888", fontSize: "13px", margin: "0 0 20px" }}>
                アップグレードは即時反映・即時差額決済。ダウングレードは次回請求日から反映。
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { key: "light", name: "ライト", price: 2980, features: ["月10回", "QR口コミ導線", "管理画面"] },
                  { key: "standard", name: "スタンダード", price: 5980, features: ["月20回", "QR口コミ導線", "オプション追加可"] },
                  { key: "premium", name: "プレミアム", price: 9800, features: ["無制限", "全機能込み", "優先サポート"], recommended: true },
                ].map(p => (
                  <div key={p.key} style={{ border: `2px solid ${store.plan === p.key ? "#2C7A4B" : "#E5E7EB"}`, borderRadius: "12px", padding: "16px", background: store.plan === p.key ? "#F0FAF4" : "#fff", position: "relative" }}>
                    {p.recommended && <span style={{ position: "absolute", top: "-10px", right: "16px", background: "#2C7A4B", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "2px 10px", borderRadius: "20px" }}>⭐ おすすめ</span>}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ fontWeight: "700", fontSize: "15px" }}>{p.name}</div>
                      <div style={{ fontWeight: "800", color: "#2C7A4B" }}>¥{p.price.toLocaleString()}/月</div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                      {p.features.map(f => <span key={f} style={{ background: "#F4F6F9", color: "#555", fontSize: "11px", padding: "2px 8px", borderRadius: "20px" }}>{f}</span>)}
                    </div>
                    {store.plan === p.key ? (
                      <div style={{ textAlign: "center", padding: "8px", background: "#ECFDF5", borderRadius: "8px", color: "#065F46", fontSize: "13px", fontWeight: "600" }}>現在のプラン</div>
                    ) : (
                      <button onClick={() => handlePlanChange(p.key)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg,#2C7A4B,#3DA66A)", color: "#fff", fontFamily: "inherit", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                        {["light", "standard", "premium"].indexOf(p.key) > ["light", "standard", "premium"].indexOf(store.plan) ? "アップグレード" : "ダウングレード"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {planMsg && <p style={{ color: planMsg.startsWith("✅") ? "#2C7A4B" : "#E53E3E", fontSize: "13px", fontWeight: "600", marginTop: "16px" }}>{planMsg}</p>}
            </div>
          )}

          {/* オプション */}
          {activeTab === "options" && store && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* OP追加（スタンダードのみ） */}
              {store.plan === "standard" && (
                <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <h2 style={{ margin: "0 0 8px", fontSize: "16px", color: "#1a2533" }}>オプション追加</h2>
                  <p style={{ color: "#888", fontSize: "13px", margin: "0 0 16px" }}>追加時点で即時決済。以降は毎月自動課金されます。</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {OPTION_LIST.map(opt => {
                      const alreadyAdded = options.some(o => o.option_key === opt.key && o.status !== "canceled");
                      return (
                        <div key={opt.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "#F4F6F9", borderRadius: "10px" }}>
                          <div>
                           <div style={{ fontWeight: "600", fontSize: "13px" }}>{opt.name}</div>
<div style={{ fontSize: "11px", color: "#888", marginTop: "3px", lineHeight: "1.6", maxWidth: "380px" }}>{opt.description}</div>
<div style={{ fontSize: "12px", color: "#2C7A4B", fontWeight: "700", marginTop: "4px" }}>¥{opt.price.toLocaleString()}/月</div>
                          </div>
                          {alreadyAdded ? (
                            <span style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "20px", background: "#ECFDF5", color: "#065F46", fontWeight: "600" }}>契約中</span>
                          ) : (
                            <button onClick={() => handleOptionAdd(opt.key, opt.name, opt.price)}
                              style={{ background: "linear-gradient(135deg,#2C7A4B,#3DA66A)", border: "none", color: "#fff", borderRadius: "8px", padding: "6px 16px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>
                              追加する
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {optionMsg && <p style={{ color: optionMsg.startsWith("✅") ? "#2C7A4B" : "#E53E3E", fontSize: "13px", fontWeight: "600", marginTop: "12px" }}>{optionMsg}</p>}
                </div>
              )}

              {/* 契約中OP一覧・解約申請 */}
              <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <h2 style={{ margin: "0 0 16px", fontSize: "16px", color: "#1a2533" }}>契約中のオプション</h2>
                {options.length === 0 ? (
                  <p style={{ color: "#aaa", textAlign: "center", padding: "20px" }}>契約中のオプションはありません</p>
                ) : (
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
                          {opt.status === "cancel_scheduled" && (
                            <span style={{ fontSize: "11px", color: "#E53E3E", fontWeight: "600" }}>解約予約済</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

{/* 質問設定 */}
          {activeTab === "questions" && store && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: "16px", color: "#1a2533" }}>質問設定</h2>
              <p style={{ color: "#888", fontSize: "13px", margin: "0 0 20px" }}>
                {store.plan === "standard" ? "質問の選択肢を変更できます。" : "質問の文章・選択肢を自由に編集できます。並び替えも可能です。"}
              </p>

              {questions.length === 0 ? (
                <p style={{ color: "#aaa", textAlign: "center", padding: "20px" }}>質問が設定されていません</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {questions.map((q, qi) => (
                    <div key={q.id} style={{ border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "16px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#2C7A4B", marginBottom: "8px" }}>
                        Q{qi + 1} {q.type === "stars" ? "⭐ 星評価（固定）" : q.type === "multi" ? "☑️ 複数選択" : "🔘 一択"}
                      </div>

                      {q.type === "stars" ? (
                        <p style={{ margin: 0, color: "#aaa", fontSize: "13px" }}>{q.label}（変更不可）</p>
                      ) : (
                        <>
                          {/* プレミアムは質問文も編集可 */}
                          {(store.plan === "premium" || store.plan === "standard") ? (
                            <input
                              value={q.label}
                              onChange={e => updateQuestionLabel(qi, e.target.value)}
                              maxLength={50}
                              style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontFamily: "inherit", fontSize: "13px", marginBottom: "10px", boxSizing: "border-box", outline: "none" }}
                            />
                          ) : (
                            <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#555", fontWeight: "600" }}>{q.label}</p>
                          )}

                          {/* 選択肢 */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {q.options?.map((opt, oi) => (
                              <div key={oi} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <input
                                  value={opt}
                                  onChange={e => updateOption(qi, oi, e.target.value)}
                                  maxLength={30}
                                  style={{ flex: 1, padding: "7px 10px", borderRadius: "8px", border: "1px solid #E5E7EB", fontFamily: "inherit", fontSize: "13px", outline: "none" }}
                                />
                                {store.plan === "premium" && (
                                  <button onClick={() => removeOption(qi, oi)}
                                    style={{ background: "#FEF2F2", border: "none", color: "#991B1B", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", cursor: "pointer" }}>✕</button>
                                )}
                              </div>
                            ))}
                            {store.plan === "premium" && (q.options?.length || 0) < 8 && (
                              <button onClick={() => addOption(qi)}
                                style={{ padding: "7px", borderRadius: "8px", border: "1.5px dashed #E5E7EB", background: "none", color: "#888", fontFamily: "inherit", fontSize: "12px", cursor: "pointer" }}>
                                ＋ 選択肢を追加
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {questions.length > 0 && (
                <button onClick={handleSaveQuestions} disabled={questionsLoading}
                  style={{ width: "100%", marginTop: "20px", padding: "14px", borderRadius: "12px", border: "none", background: questionsSaved ? "#1A5C38" : "linear-gradient(135deg,#2C7A4B,#3DA66A)", color: "#fff", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
                  {questionsLoading ? "保存中..." : questionsSaved ? "✅ 保存しました！" : "💾 保存する"}
                </button>
              )}
            </div>
          )}

{/* 低評価フィードバック */}
          {activeTab === "feedback" && store && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", color: "#1a2533" }}>低評価フィードバック一覧</h2>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input type="month" value={feedbackMonth} onChange={e => setFeedbackMonth(e.target.value)}
                    style={{ padding: "6px 12px", borderRadius: "8px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "13px", outline: "none" }} />
                  {feedbackMonth && (
                    <button onClick={() => setFeedbackMonth("")}
                      style={{ background: "#F4F6F9", border: "none", color: "#555", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
                      クリア
                    </button>
                  )}
                  <span style={{ fontSize: "12px", color: "#888" }}>
                    {feedbackList.filter(fb => !feedbackMonth || fb.created_at.startsWith(feedbackMonth)).length}件
                  </span>
                </div>
              </div>
              {feedbackList.filter(fb => !feedbackMonth || fb.created_at.startsWith(feedbackMonth)).length === 0 ? (
                <p style={{ color: "#aaa", textAlign: "center", padding: "32px" }}>フィードバックはありません</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                 {feedbackList.filter(fb => !feedbackMonth || fb.created_at.startsWith(feedbackMonth)).map((fb: any) => (
                    <div key={fb.id} style={{ border: "1.5px solid #FEE2E2", borderRadius: "12px", padding: "16px", background: "#FFF5F5" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#991B1B", background: "#FEE2E2", padding: "2px 8px", borderRadius: "6px" }}>★{fb.rating}</span>
                        <span style={{ fontSize: "11px", color: "#aaa" }}>{new Date(fb.created_at).toLocaleString("ja-JP")}</span>
                      </div>
                      {fb.issues && fb.issues.length > 0 && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                          {fb.issues.map((issue: string) => (
                            <span key={issue} style={{ background: "#FEE2E2", color: "#991B1B", fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>{issue}</span>
                          ))}
                        </div>
                      )}
                      {fb.comment && <p style={{ margin: 0, fontSize: "13px", color: "#555", lineHeight: 1.7 }}>{fb.comment}</p>}
                    </div>
                  ))}
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

{/* QR分析 */}
{activeTab === "qr_analytics" && store && (
  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
    <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <h2 style={{ margin: "0 0 20px", fontSize: "16px", color: "#1a2533" }}>📊 QRコードアクセス分析</h2>

      {/* サマリー */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "今月", value: qrLogs.filter(l => l.accessed_at?.startsWith(new Date().toISOString().slice(0, 7))).length },
          { label: "今日", value: qrLogs.filter(l => l.accessed_at?.startsWith(new Date().toISOString().slice(0, 10))).length },
          { label: "累計", value: qrLogs.length },
        ].map((item, i) => (
          <div key={i} style={{ background: "#F4F6F9", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px" }}>{item.label}</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#2C7A4B" }}>{item.value}</div>
            <div style={{ fontSize: "11px", color: "#aaa" }}>回</div>
          </div>
        ))}
      </div>

      {/* 日別グラフ（直近7日） */}
      <h3 style={{ margin: "0 0 12px", fontSize: "13px", color: "#1a2533" }}>直近7日間</h3>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "80px", marginBottom: "4px" }}>
        {Array.from({ length: 7 }).map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const dateStr = date.toISOString().slice(0, 10);
          const count = qrLogs.filter(l => l.accessed_at?.startsWith(dateStr)).length;
          const max = Math.max(...Array.from({ length: 7 }).map((_, j) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - j));
            return qrLogs.filter(l => l.accessed_at?.startsWith(d.toISOString().slice(0, 10))).length;
          }), 1);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#2C7A4B" }}>{count > 0 ? count : ""}</div>
              <div style={{ width: "100%", background: count > 0 ? "#2C7A4B" : "#E5E7EB", borderRadius: "4px 4px 0 0", height: `${(count / max) * 60}px`, minHeight: "4px", transition: "height 0.3s" }} />
              <div style={{ fontSize: "10px", color: "#aaa" }}>{date.getMonth() + 1}/{date.getDate()}</div>
            </div>
          );
        })}
      </div>

      {qrLogs.length === 0 && (
        <p style={{ color: "#aaa", textAlign: "center", padding: "20px", fontSize: "13px" }}>
          まだアクセスデータがありません
        </p>
      )}
    </div>
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
