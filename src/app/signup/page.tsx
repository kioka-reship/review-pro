"use client";
import { useState, useEffect } from "react";

const PLANS = [
  {
    key: "light",
    name: "ライト",
    price: 2980,
    setupFee: 0,
    limit: "月10回",
    features: ["口コミ生成 月10回", "QR口コミ導線", "管理画面", "1店舗のみ"],
    recommended: false,
  },
  {
    key: "standard",
    name: "スタンダード",
    price: 5980,
    setupFee: 9800,
    limit: "月20回",
    features: ["口コミ生成 月20回", "QR口コミ導線", "管理画面", "オプション追加可能", "質問テンプレ変更可能"],
    recommended: false,
  },
  {
    key: "premium",
    name: "プレミアム",
    price: 9800,
    setupFee: 19800,
    limit: "無制限",
    features: ["口コミ生成 無制限", "QR口コミ導線", "管理画面", "低評価対策PRO", "AI口コミ自動返信", "フィードバック一覧", "成果ダッシュボード", "月次自動レポート", "優先サポート", "質問自由編集"],
    recommended: true,
  },
];

const OPTIONS = [
  { key: "low_review_pro", name: "低評価対策PRO", price: 2980, description: "★2以下の低評価が付いた際に、Googleへの投稿前に店舗へ直接フィードバックを誘導。悪い口コミを未然に防ぎます。" },
 // { key: "ai_reply", name: "AI口コミ自動返信", price: 1980, description: "Googleに届いた口コミにAIが自動で返信。オーナー返信率を高め、Googleの評価アップにつながります。" },
  { key: "qr_analytics", name: "QRアクセス分析PRO", price: 1980, description: "QRコードの読取数を日別・月別で可視化。アクセス推移をグラフで確認できます。" },
  { key: "feedback_list", name: "フィードバック一覧", price: 1480, description: "低評価ユーザーからのフィードバックをマイページで一覧表示。改善ポイントの把握に役立ちます。" },
  { key: "monthly_report", name: "月次自動レポート", price: 980, description: "口コミ数・評価推移などを毎月自動でレポートメール送信。データで改善サイクルを回せます。" },
];

const REFERRAL_CODES = ["BNI-MEMBER", "0CP"];

const INDUSTRY_OPTIONS = [
  "飲食店", "ラーメン店", "寿司・和食", "焼肉・肉料理", "カフェ・喫茶店", "居酒屋・バー", "パン・ベーカリー",
  "美容脱毛", "美容室・ヘアサロン", "エステ・フェイシャル", "ネイルサロン", "マッサージ・整体", "接骨院・鍼灸院", "パーソナルジム・ジム",
  "小売・物販", "アパレル・ファッション", "自動車販売・整備", "不動産・賃貸", "その他",
];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    company_name: "", store_name: "", owner_name: "", contact_name: "",
    email: "", password: "", type: "飲食店", place_id: "",
  });
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setReferralValid(REFERRAL_CODES.includes(referralCode.toUpperCase()));
  }, [referralCode]);

  const plan = PLANS.find(p => p.key === selectedPlan)!;
  const setupFee = referralValid ? 0 : plan.setupFee;
  const optionTotal = selectedOptions.reduce((sum, key) => {
    const opt = OPTIONS.find(o => o.key === key);
    return sum + (opt?.price || 0);
  }, 0);
  const total = setupFee + plan.price + optionTotal;

  const upsellSuggestion = selectedPlan === "standard" &&
    (plan.price + optionTotal) >= 9800;

  const toggleOption = (key: string) => {
    setSelectedOptions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    if (!agreed) { setError("利用規約への同意が必要です"); return; }
    if (!form.store_name || !form.email || !form.password || !form.place_id) {
      setError("必須項目を入力してください"); return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        plan: selectedPlan,
        options: selectedOptions,
        referral_code: referralCode.toUpperCase(),
        setup_fee: setupFee,
        total,
      }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error || "エラーが発生しました");
      setLoading(false);
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0F1923,#1a3a2a)", fontFamily: "'Noto Sans JP',sans-serif", padding: "32px 16px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "28px", fontWeight: "800", color: "#fff" }}>REVIEW PRO</div>
            <div style={{ fontSize: "14px", color: "#7a9ab5", marginTop: "4px" }}>お申し込みフォーム</div>
          </div>

          {/* プラン選択 */}
          <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", marginBottom: "16px" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: "16px", color: "#1a2533" }}>① プランを選択</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {PLANS.map(p => (
                <div key={p.key} onClick={() => { setSelectedPlan(p.key); setSelectedOptions([]); }}
                  style={{ border: `2px solid ${selectedPlan === p.key ? "#2C7A4B" : "#E5E7EB"}`, borderRadius: "12px", padding: "16px", cursor: "pointer", position: "relative", background: selectedPlan === p.key ? "#F0FAF4" : "#fff" }}>
                  {p.recommended && <span style={{ position: "absolute", top: "-10px", right: "16px", background: "#2C7A4B", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "2px 10px", borderRadius: "20px" }}>⭐ おすすめ</span>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ fontWeight: "700", fontSize: "15px", color: "#1a2533" }}>{p.name}</div>
                    <div style={{ fontWeight: "800", color: "#2C7A4B" }}>¥{p.price.toLocaleString()}<span style={{ fontSize: "12px", fontWeight: "400", color: "#888" }}>/月</span></div>
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>
                    導入設定費：{p.setupFee === 0 ? "無料" : `¥${p.setupFee.toLocaleString()}`}　|　{p.limit}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {p.features.map(f => (
                      <span key={f} style={{ background: "#F4F6F9", color: "#555", fontSize: "11px", padding: "2px 8px", borderRadius: "20px" }}>{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* オプション */}
            {selectedPlan === "standard" && (
              <div style={{ marginTop: "20px" }}>
                <h3 style={{ fontSize: "14px", color: "#1a2533", marginBottom: "12px" }}>オプション追加（任意）</h3>
                {upsellSuggestion && (
                  <div style={{ background: "#FFFBEB", border: "1px solid #F59E0B", borderRadius: "10px", padding: "12px", marginBottom: "12px", fontSize: "13px", color: "#92400E" }}>
                    💡 プレミアムの方がお得です！現在の合計 ¥{(plan.price + optionTotal).toLocaleString()} ≥ プレミアム ¥9,800
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {OPTIONS.map(opt => (
                    <label key={opt.key} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px", border: "1.5px solid #E5E7EB", borderRadius: "10px", cursor: "pointer" }}>
  <input type="checkbox" checked={selectedOptions.includes(opt.key)} onChange={() => toggleOption(opt.key)} style={{ marginTop: "3px" }} />
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: "13px", fontWeight: "600" }}>{opt.name}</div>
    <div style={{ fontSize: "11px", color: "#888", marginTop: "3px", lineHeight: "1.6" }}>{opt.description}</div>
  </div>
  <span style={{ fontWeight: "700", color: "#2C7A4B", whiteSpace: "nowrap" }}>¥{opt.price.toLocaleString()}/月</span>
</label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 入力フォーム */}
          <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", marginBottom: "16px" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: "16px", color: "#1a2533" }}>② 基本情報を入力</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
             { label: "会社名", key: "company_name", placeholder: "個人事業主の場合は屋号または氏名", required: false },
{ label: "店舗名 *", key: "store_name", placeholder: "対象となる店舗名", required: true },
{ label: "オーナー名 *", key: "owner_name", placeholder: "田中 太郎", required: true },
{ label: "担当者名", key: "contact_name", placeholder: "田中 花子", required: false },
{ label: "メールアドレス *", key: "email", placeholder: "受信できるもの。ログインIDになります", required: true },
                { label: "メールアドレス *", key: "email", placeholder: "owner@example.com", required: true },
                { label: "パスワード *", key: "password", placeholder: "8文字以上", required: true },
                { label: "GoogleマップURL *", key: "place_id", placeholder: "https://g.page/r/xxxx/review", required: true },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>{f.label}</label>
                  <input
                    type={f.key === "password" ? "password" : "text"}
                    value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", outline: "none" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>業種</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", outline: "none", background: "#fff" }}>
                  {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 紹介コード */}
          <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", marginBottom: "16px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "16px", color: "#1a2533" }}>③ 紹介コード（任意）</h2>
            <input value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="紹介コードをお持ちの方は入力"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: `1.5px solid ${referralValid ? "#2C7A4B" : "#E5E7EB"}`, fontFamily: "inherit", fontSize: "14px", outline: "none" }} />
            {referralValid && <p style={{ color: "#2C7A4B", fontSize: "13px", marginTop: "8px", fontWeight: "600" }}>✅ 紹介コード適用！導入設定費が無料になります</p>}
          </div>

          {/* 合計・規約 */}
          <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", marginBottom: "16px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "16px", color: "#1a2533" }}>④ お申し込み内容確認</h2>
            <div style={{ background: "#F4F6F9", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                <span>プラン（{plan.name}）</span><span>¥{plan.price.toLocaleString()}/月</span>
              </div>
              {selectedOptions.map(key => {
                const opt = OPTIONS.find(o => o.key === key)!;
                return (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                    <span>{opt.name}</span><span>¥{opt.price.toLocaleString()}/月</span>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                <span>導入設定費{referralValid ? "（紹介コード適用）" : ""}</span>
                <span>{setupFee === 0 ? "無料" : `¥${setupFee.toLocaleString()}`}</span>
              </div>
              <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "12px", display: "flex", justifyContent: "space-between", fontWeight: "700", fontSize: "16px" }}>
                <span>初回合計</span><span style={{ color: "#2C7A4B" }}>¥{total.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>翌月以降：¥{(plan.price + optionTotal).toLocaleString()}/月</div>
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: "2px" }} />
              <span style={{ fontSize: "13px", color: "#555" }}>
                <a href="/terms" target="_blank" style={{ color: "#2C7A4B" }}>利用規約</a>および<a href="/privacy" target="_blank" style={{ color: "#2C7A4B" }}>プライバシーポリシー</a>に同意します
              </span>
            </label>
            {error && <p style={{ color: "#E53E3E", fontSize: "13px", marginTop: "12px" }}>{error}</p>}
            <button onClick={handleSubmit} disabled={loading || !agreed}
              style={{ width: "100%", marginTop: "20px", padding: "16px", borderRadius: "12px", border: "none", background: agreed ? "linear-gradient(135deg,#2C7A4B,#3DA66A)" : "#ccc", color: "#fff", fontFamily: "inherit", fontSize: "16px", fontWeight: "700", cursor: agreed ? "pointer" : "not-allowed" }}>
              {loading ? "処理中..." : `💳 決済へ進む（¥${total.toLocaleString()}）`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
