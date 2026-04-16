"use client";

import { useState } from "react";

type Store = {
  id: string;
  name: string;
  type: string;
  owner_name: string;
  email: string;
  plan: string;
  place_id: string;
  status: string;
  created_at: string;
  square_customer_id?: string;
  square_subscription_id?: string;
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
  light: "ライト ¥2,980",
  standard: "スタンダード ¥5,980",
  premium: "プレミアム ¥9,800",
};

const STATUS_OPTIONS = ["契約中", "入金待ち", "停止中"];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  "契約中":  { bg: "#ECFDF5", color: "#065F46" },
  "入金待ち": { bg: "#FFFBEB", color: "#92400E" },
  "停止中":  { bg: "#FEF2F2", color: "#991B1B" },
};

const INDUSTRY_OPTIONS = ["飲食店", "美容脱毛", "美容室", "整体・接骨院", "小売・物販", "その他"];
const APP_URL = "https://review-pro-ay7x.vercel.app";

// ============================================================
// 共通: status更新関数
// ============================================================
async function updateStoreStatus(storeId: string, nextStatus: string): Promise<boolean> {
  if (!storeId) return false;
  const res = await fetch("/api/admin/stores", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: storeId, status: nextStatus }),
  });
  return res.ok;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"stores" | "add" | "questions">("stores");

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // 店舗編集モーダル
  const [editStore, setEditStore] = useState<Store | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  // 新規店舗フォーム
  const [newStore, setNewStore] = useState({
    name: "", type: "飲食店", owner_name: "", email: "", password: "",
    plan: "standard", place_id: "",
  });
  const [addMsg, setAddMsg] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // QRコード
  const [qrStore, setQrStore] = useState<Store | null>(null);

  // ============================================================
  // 認証
  // ============================================================
  const handleLogin = () => {
    if (email === "kioka.reship@gmail.com" && password === "Katsu0815!?") {
      setAuthed(true);
      fetchStores();
    } else {
      setLoginError("メールアドレスまたはパスワードが違います");
    }
  };

  // ============================================================
  // DB再取得（即時反映の基本）
  // ============================================================
  const fetchStores = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/stores");
    const data = await res.json();
    setStores(data.stores || []);
    setLoading(false);
  };

  // ============================================================
  // A. status更新（共通関数を使用）
  // ============================================================
  const handleToggleStatus = async (store: Store) => {
    const next = store.status === "契約中" ? "停止中" : "契約中";
    const ok = await updateStoreStatus(store.id, next);
    if (ok) await fetchStores(); // 即時反映
  };

  const handleStatusChange = async (store: Store, next: string) => {
    const ok = await updateStoreStatus(store.id, next);
    if (ok) await fetchStores();
  };

  // ============================================================
  // B. 店舗情報編集
  // ============================================================
  const handleEditStore = (store: Store) => {
    setEditStore({ ...store });
    setEditMsg("");
  };

  const handleSaveEdit = async () => {
    if (!editStore) return;
    setEditLoading(true);
    setEditMsg("");
    const res = await fetch("/api/admin/stores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editStore.id,
        name: editStore.name,
        type: editStore.type,
        owner_name: editStore.owner_name,
        email: editStore.email,
        plan: editStore.plan,
        status: editStore.status,
      }),
    });
    if (res.ok) {
      setEditMsg("✅ 保存しました");
      await fetchStores(); // 即時反映
      setTimeout(() => { setEditStore(null); setEditMsg(""); }, 800);
    } else {
      setEditMsg("❌ 保存に失敗しました");
    }
    setEditLoading(false);
  };

  // ============================================================
  // 店舗追加
  // ============================================================
  const handleAddStore = async () => {
    if (!newStore.name || !newStore.email || !newStore.place_id) {
      setAddMsg("店舗名・メール・口コミURLは必須です");
      return;
    }
    setAddLoading(true);
    setAddMsg("");
    const res = await fetch("/api/admin/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStore),
    });
    const data = await res.json();
    if (data.error) {
      setAddMsg("エラー: " + data.error);
    } else {
      setAddMsg("✅ 店舗を追加しました！ID: " + data.store.id);
      setNewStore({ name: "", type: "飲食店", owner_name: "", email: "", password: "", plan: "standard", place_id: "" });
      await fetchStores(); // 即時反映
    }
    setAddLoading(false);
  };

  // ============================================================
  // 質問編集
  // ============================================================
  const handleEditQuestions = async (store: Store) => {
    setSelectedStore(store);
    const res = await fetch(`/api/admin/questions?store_id=${store.id}`);
    const data = await res.json();
    setQuestions(data.questions || []);
    setActiveTab("questions");
  };

const handleSaveQuestions = async () => {
  if (!selectedStore) return;

  let questionsToSave = questions;

  // 質問が0件の場合はAPIにデフォルト質問を生成させる
  if (questionsToSave.length === 0) {
    const res = await fetch(`/api/admin/stores`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedStore.id, resetQuestions: true, type: selectedStore.type }),
    });
    if (res.ok) {
      await fetchStores();
      const qRes = await fetch(`/api/admin/questions?store_id=${selectedStore.id}`);
      const qData = await qRes.json();
      setQuestions(qData.questions || []);
      alert("✅ デフォルト質問を登録しました！");
      return;
    }
  }

  await fetch("/api/admin/questions", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ store_id: selectedStore.id, questions: questionsToSave }),
  });
  await fetchStores();
  alert("✅ 質問を保存しました！");
};

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const next = [...questions];
    if (next[qIdx].options) { next[qIdx].options![oIdx] = value; setQuestions(next); }
  };
  const updateLabel = (qIdx: number, value: string) => {
    const next = [...questions]; next[qIdx].label = value; setQuestions(next);
  };
  const addOption = (qIdx: number) => {
    const next = [...questions];
    if (next[qIdx].options) { next[qIdx].options!.push("新しい選択肢"); setQuestions(next); }
  };
  const removeOption = (qIdx: number, oIdx: number) => {
    const next = [...questions];
    if (next[qIdx].options && next[qIdx].options!.length > 2) {
      next[qIdx].options!.splice(oIdx, 1); setQuestions(next);
    }
  };

  const totalRevenue = stores.filter(s => s.status === "契約中").reduce((sum, s) => {
    const prices: Record<string, number> = { light: 2980, standard: 5980, premium: 9800 };
    return sum + (prices[s.plan] || 0);
  }, 0);

  // ============================================================
  // ログイン画面
  // ============================================================
  if (!authed) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0F1923,#1a3a2a)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Sans JP',sans-serif", padding: "16px" }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "26px", fontWeight: "800", color: "#fff" }}>REVIEW PRO</div>
            <div style={{ fontSize: "13px", color: "#7a9ab5", marginTop: "4px" }}>管理者ログイン</div>
          </div>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "32px" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>メールアドレス</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>パスワード</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
            </div>
            {loginError && <p style={{ color: "#E53E3E", fontSize: "13px", textAlign: "center", marginBottom: "16px" }}>{loginError}</p>}
            <button onClick={handleLogin} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#2C7A4B,#3DA66A)", color: "#fff", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
              ログイン
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // ============================================================
  // メイン管理画面
  // ============================================================
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>

      <div style={{ minHeight: "100vh", background: "#F4F6F9", fontFamily: "'Noto Sans JP',sans-serif" }}>
        <div style={{ background: "#0F1923", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "18px", fontWeight: "800", color: "#fff" }}>REVIEW PRO 管理画面</div>
          <button onClick={() => setAuthed(false)} style={{ background: "none", border: "1px solid #2a3f5a", color: "#7a9ab5", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>ログアウト</button>
        </div>

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 20px" }}>

          {/* KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "月次収益（契約中のみ）", value: `¥${totalRevenue.toLocaleString()}`, color: "#2C7A4B" },
              { label: "契約中", value: `${stores.filter(s => s.status === "契約中").length}店舗`, color: "#2563EB" },
              { label: "入金待ち / 停止中", value: `${stores.filter(s => s.status !== "契約中").length}店舗`, color: "#DC2626" },
            ].map((item, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>{item.label}</div>
                <div style={{ fontSize: "24px", fontFamily: "'Outfit',sans-serif", fontWeight: "800", color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* タブ */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {[{ key: "stores", label: "🏪 店舗一覧" }, { key: "add", label: "➕ 店舗追加" }].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: activeTab === t.key ? "#2C7A4B" : "#fff", color: activeTab === t.key ? "#fff" : "#555", fontFamily: "inherit", fontSize: "14px", fontWeight: "600", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* 店舗一覧 */}
          {activeTab === "stores" && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", color: "#1a2533" }}>契約店舗一覧</h2>
                <button onClick={fetchStores} style={{ background: "#F4F6F9", border: "none", color: "#555", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>🔄 更新</button>
              </div>
              {loading ? <p style={{ color: "#888" }}>読み込み中...</p> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #F0F0F0" }}>
                        {["店舗名", "業種", "プラン", "契約状態", "QR", "操作"].map(h => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#888", fontWeight: "600", fontSize: "12px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stores.map(s => {
                        const sc = STATUS_COLORS[s.status] || STATUS_COLORS["停止中"];
                        return (
                          <tr key={s.id} style={{ borderBottom: "1px solid #F8F8F8" }}>
                            <td style={{ padding: "14px 12px", fontWeight: "600", color: "#1a2533" }}>
                              <div>{s.name}</div>
                              <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>{APP_URL}/review/{s.id}</div>
                            </td>
                            <td style={{ padding: "14px 12px", color: "#888" }}>{s.type}</td>
                            <td style={{ padding: "14px 12px" }}>
                              <span style={{ background: "#F0FAF4", color: "#2C7A4B", borderRadius: "6px", padding: "2px 8px", fontSize: "12px", fontWeight: "600" }}>
                                {PLAN_LABELS[s.plan] || s.plan}
                              </span>
                            </td>
                            <td style={{ padding: "14px 12px" }}>
                              <select value={s.status}
                                onChange={e => handleStatusChange(s, e.target.value)}
                                style={{ background: sc.bg, color: sc.color, border: "none", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
                                {STATUS_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: "14px 12px" }}>
                              <button onClick={() => setQrStore(s)}
                                style={{ background: "#F0FAF4", border: "none", color: "#2C7A4B", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>
                                QR
                              </button>
                            </td>
                            <td style={{ padding: "14px 12px" }}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button onClick={() => handleEditStore(s)}
                                  style={{ background: "#F4F6F9", border: "none", color: "#555", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>
                                  編集
                                </button>
                                <button onClick={() => handleEditQuestions(s)}
                                  style={{ background: "#EFF6FF", border: "none", color: "#2563EB", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>
                                  質問
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {stores.length === 0 && <p style={{ color: "#aaa", textAlign: "center", padding: "32px" }}>店舗がまだありません</p>}
                </div>
              )}
            </div>
          )}

          {/* 店舗追加 */}
          {activeTab === "add" && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", maxWidth: "560px" }}>
              <h2 style={{ margin: "0 0 20px", fontSize: "16px", color: "#1a2533" }}>新規店舗追加</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  { label: "店舗名 *", key: "name", placeholder: "Plus Belle" },
                  { label: "オーナー名", key: "owner_name", placeholder: "田中 太郎" },
                  { label: "メールアドレス *", key: "email", placeholder: "owner@example.com" },
                  { label: "パスワード", key: "password", placeholder: "ログイン用パスワード" },
                  { label: "口コミURL *", key: "place_id", placeholder: "https://g.page/r/xxxx/review" },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>{field.label}</label>
                    <input value={(newStore as any)[field.key]} onChange={e => setNewStore({ ...newStore, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", outline: "none" }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>業種</label>
                  <select value={newStore.type} onChange={e => setNewStore({ ...newStore, type: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", outline: "none", background: "#fff" }}>
                    {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>プラン</label>
                  <select value={newStore.plan} onChange={e => setNewStore({ ...newStore, plan: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", outline: "none", background: "#fff" }}>
                    <option value="light">ライト ¥2,980/月</option>
                    <option value="standard">スタンダード ¥5,980/月</option>
                    <option value="premium">プレミアム ¥9,800/月</option>
                  </select>
                </div>
                {addMsg && <p style={{ color: addMsg.startsWith("✅") ? "#2C7A4B" : "#E53E3E", fontSize: "13px", fontWeight: "600" }}>{addMsg}</p>}
                <button onClick={handleAddStore} disabled={addLoading}
                  style={{ padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#2C7A4B,#3DA66A)", color: "#fff", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
                  {addLoading ? "追加中..." : "➕ 店舗を追加する"}
                </button>
              </div>
            </div>
          )}

          {/* 質問編集 */}
          {activeTab === "questions" && selectedStore && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", maxWidth: "600px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", color: "#1a2533" }}>質問編集：{selectedStore.name}</h2>
                <button onClick={() => setActiveTab("stores")} style={{ background: "none", border: "1px solid #E5E7EB", color: "#888", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>← 戻る</button>
              </div>
              {questions.length === 0 && (
                <p style={{ color: "#aaa", fontSize: "13px", textAlign: "center", padding: "20px" }}>
                  質問がまだ登録されていません。<br />保存ボタンを押すと業種に合わせたデフォルト質問が登録されます。
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {questions.map((q, qi) => (
                  <div key={q.id} style={{ border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "16px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#2C7A4B", marginBottom: "8px" }}>
                      Q{qi + 1} {q.type === "stars" ? "⭐ 星評価（固定）" : q.type === "multi" ? "☑️ 複数選択" : "🔘 一択"}
                    </div>
                    {q.type !== "stars" ? (
                      <>
                        <input value={q.label} onChange={e => updateLabel(qi, e.target.value)}
                          style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontFamily: "inherit", fontSize: "13px", marginBottom: "10px", boxSizing: "border-box", outline: "none" }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {q.options?.map((opt, oi) => (
                            <div key={oi} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)}
                                style={{ flex: 1, padding: "7px 10px", borderRadius: "8px", border: "1px solid #E5E7EB", fontFamily: "inherit", fontSize: "13px", outline: "none" }} />
                              <button onClick={() => removeOption(qi, oi)} style={{ background: "#FEF2F2", border: "none", color: "#991B1B", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", cursor: "pointer" }}>✕</button>
                            </div>
                          ))}
                          <button onClick={() => addOption(qi)}
                            style={{ padding: "7px", borderRadius: "8px", border: "1.5px dashed #E5E7EB", background: "none", color: "#888", fontFamily: "inherit", fontSize: "12px", cursor: "pointer" }}>
                            ＋ 選択肢を追加
                          </button>
                        </div>
                      </>
                    ) : (
                      <p style={{ margin: 0, color: "#aaa", fontSize: "13px" }}>{q.label}</p>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={handleSaveQuestions}
                style={{ width: "100%", marginTop: "20px", padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#2C7A4B,#3DA66A)", color: "#fff", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
                💾 保存する
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 店舗編集モーダル */}
      {editStore && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", maxWidth: "480px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#1a2533" }}>店舗情報編集</h3>
              <button onClick={() => setEditStore(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#888" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "店舗名", key: "name" },
                { label: "オーナー名", key: "owner_name" },
                { label: "メールアドレス", key: "email" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>{f.label}</label>
                  <input value={(editStore as any)[f.key] || ""} onChange={e => setEditStore({ ...editStore, [f.key]: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", outline: "none" }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>業種</label>
                <select value={editStore.type} onChange={e => setEditStore({ ...editStore, type: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", outline: "none", background: "#fff" }}>
                  {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>プラン</label>
                <select value={editStore.plan} onChange={e => setEditStore({ ...editStore, plan: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", outline: "none", background: "#fff" }}>
                  <option value="light">ライト ¥2,980/月</option>
                  <option value="standard">スタンダード ¥5,980/月</option>
                  <option value="premium">プレミアム ¥9,800/月</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>契約状態</label>
                <select value={editStore.status} onChange={e => setEditStore({ ...editStore, status: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", outline: "none", background: "#fff" }}>
                  {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {editMsg && <p style={{ color: editMsg.startsWith("✅") ? "#2C7A4B" : "#E53E3E", fontSize: "13px", fontWeight: "600", margin: 0 }}>{editMsg}</p>}
              <button onClick={handleSaveEdit} disabled={editLoading}
                style={{ padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#2C7A4B,#3DA66A)", color: "#fff", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
                {editLoading ? "保存中..." : "💾 保存する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QRモーダル */}
      {qrStore && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", maxWidth: "360px", width: "100%", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 8px", color: "#1a2533" }}>{qrStore.name}</h3>
            <p style={{ color: "#888", fontSize: "13px", margin: "0 0 20px" }}>口コミ投稿URL</p>
            <div style={{ background: "#F4F6F9", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <code style={{ fontSize: "12px", color: "#555", wordBreak: "break-all" }}>{APP_URL}/review/{qrStore.id}</code>
            </div>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${APP_URL}/review/${qrStore.id}`)}`}
              alt="QRコード" style={{ width: "200px", height: "200px", borderRadius: "8px" }} />
            <p style={{ fontSize: "12px", color: "#aaa", margin: "12px 0 20px" }}>スクリーンショットで保存してください</p>
            <button onClick={() => setQrStore(null)}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #E5E7EB", background: "#fff", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
