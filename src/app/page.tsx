"use client";
import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"yearly" | "monthly">("yearly");
  const [activeTab, setActiveTab] = useState<"user" | "admin">("user");

  const plans = [
    {
      key: "light",
      name: "ライト",
      monthlyPrice: { monthly: 4980, yearly: 3980 },
      setupFee: { monthly: 4980, yearly: 3980 },
      limit: "月10回",
      features: ["口コミ生成 月10回", "QR口コミ導線", "管理画面", "1店舗"],
      cta: "始める",
      recommended: false,
    },
    {
      key: "standard",
      name: "スタンダード",
      monthlyPrice: { monthly: 9800, yearly: 7980 },
      setupFee: { monthly: 9800, yearly: 7980 },
      limit: "月20回",
      features: ["口コミ生成 月20回", "QR口コミ導線", "管理画面", "1店舗", "オプション追加可", "質問テンプレ変更可"],
      cta: "始める",
      recommended: false,
    },
    {
      key: "premium",
      name: "プレミアム",
      monthlyPrice: { monthly: 19800, yearly: 15800 },
      setupFee: { monthly: 19800, yearly: 15800 },
      limit: "無制限",
      features: ["口コミ生成 無制限", "QR口コミ導線", "管理画面", "1店舗", "低評価対策PRO", "AI口コミ自動返信", "フィードバック一覧", "月次自動レポート", "成果ダッシュボード", "優先サポート", "質問自由編集"],
      cta: "始める",
      recommended: true,
    },
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&family=Outfit:wght@700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Noto Sans JP', sans-serif; background: #fff; color: #1a2533; }
        .container { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
        .btn-primary { display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #2C7A4B, #3DA66A); color: #fff; border-radius: 14px; font-weight: 700; font-size: 16px; text-decoration: none; transition: all 0.2s; box-shadow: 0 8px 24px rgba(44,122,75,0.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(44,122,75,0.4); }
        .btn-secondary { display: inline-block; padding: 14px 32px; background: rgba(255,255,255,0.08); color: #fff; border: 1.5px solid rgba(255,255,255,0.2); border-radius: 14px; font-weight: 600; font-size: 15px; text-decoration: none; transition: all 0.2s; }
        .btn-secondary:hover { background: rgba(255,255,255,0.15); }
        section { padding: 96px 0; }
        h2.section-title { font-family: 'Outfit', sans-serif; font-size: clamp(28px, 4vw, 42px); font-weight: 900; color: #1a2533; margin-bottom: 16px; line-height: 1.2; }
        .section-sub { font-size: 17px; color: #888; line-height: 1.8; margin-bottom: 56px; }
        @media (max-width: 768px) {
          section { padding: 64px 0; }
          .hero-btns { flex-direction: column; align-items: center; }
          .plan-grid { grid-template-columns: 1fr !important; }
          .feature-grid { grid-template-columns: 1fr !important; }
          .step-grid { grid-template-columns: 1fr !important; }
          .faq-grid { grid-template-columns: 1fr !important; }
          .stat-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* ナビゲーション */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(15,25,35,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "20px", fontWeight: "900", color: "#fff" }}>REVIEW PRO</div>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <a href="#pricing" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px" }}>料金</a>
            <a href="#faq" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px" }}>FAQ</a>
            <Link href="/signup" className="btn-primary" style={{ padding: "10px 24px", fontSize: "14px" }}>お申し込み</Link>
          </div>
        </div>
      </nav>

      {/* ヒーロー */}
      <div style={{ background: "linear-gradient(160deg, #0F1923 0%, #0d2818 50%, #0F1923 100%)", padding: "120px 24px 100px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "5%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(44,122,75,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(44,122,75,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="container" style={{ position: "relative" }}>
          <div style={{ display: "inline-block", background: "rgba(44,122,75,0.15)", border: "1px solid rgba(44,122,75,0.3)", borderRadius: "100px", padding: "6px 20px", fontSize: "13px", color: "#5BBF8A", fontWeight: "600", marginBottom: "28px" }}>
            AIで口コミ投稿数を3倍に
          </div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(36px, 6vw, 68px)", fontWeight: "900", color: "#fff", lineHeight: 1.15, marginBottom: "24px" }}>
            お客様がその場で<br />
            <span style={{ color: "#5BBF8A" }}>Googleに口コミ</span>を<br />
            書いてくれる仕組み
          </h1>
          <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.8, marginBottom: "48px", maxWidth: "560px", margin: "0 auto 48px" }}>
            QRコードを設置するだけ。<br />AIが3パターンの口コミ文を自動生成し、<br />お客様がそのままGoogleに投稿できます。
          </p>
          <div className="hero-btns" style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" className="btn-primary" style={{ fontSize: "18px", padding: "18px 48px" }}>今すぐ申し込む</Link>
            <a href="#how-it-works" className="btn-secondary">仕組みを見る →</a>
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", marginTop: "20px" }}>いつでも解約可能</p>
        </div>
      </div>

      {/* 数字で見る */}
      <div style={{ background: "#F8FAF8", borderTop: "1px solid #E8EDE8", borderBottom: "1px solid #E8EDE8" }}>
        <div className="container stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0", textAlign: "center" }}>
          {[
            { num: "3倍", label: "口コミ投稿数の増加" },
            { num: "1分", label: "お客様の所要時間" },
            { num: "24時間", label: "自動で口コミ収集" },
            { num: "全業種", label: "対応テンプレート" },
          ].map((item, i) => (
            <div key={i} style={{ padding: "40px 24px", borderRight: i < 3 ? "1px solid #E8EDE8" : "none" }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "40px", fontWeight: "900", color: "#2C7A4B", lineHeight: 1 }}>{item.num}</div>
              <div style={{ fontSize: "14px", color: "#888", marginTop: "8px" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 使い方 */}
      <section id="how-it-works">
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="section-title">たった3ステップで<br />口コミが集まる仕組み</h2>
          <p className="section-sub">難しい設定は一切不要。今日から始められます。</p>
          <div className="step-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px" }}>

            {/* STEP 1 */}
            <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 24px", border: "1.5px solid #E8EDE8", textAlign: "left" }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", background: "#2C7A4B", color: "#fff", fontWeight: "700", fontSize: "15px", marginBottom: "20px", fontFamily: "'Outfit', sans-serif" }}>1</div>
              <div style={{ background: "#F8FAF8", borderRadius: "16px", padding: "16px", marginBottom: "20px", textAlign: "center" }}>
                <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "130px" }}>
                  {/* QR Code border */}
                  <rect x="14" y="8" width="88" height="88" rx="8" fill="white" stroke="#E8EDE8" strokeWidth="1.5"/>
                  {/* Corner squares */}
                  <rect x="24" y="18" width="24" height="24" rx="3" fill="#2C7A4B"/>
                  <rect x="68" y="18" width="24" height="24" rx="3" fill="#2C7A4B"/>
                  <rect x="24" y="62" width="24" height="24" rx="3" fill="#2C7A4B"/>
                  {/* Inner whites */}
                  <rect x="28" y="22" width="16" height="16" rx="1" fill="white"/>
                  <rect x="72" y="22" width="16" height="16" rx="1" fill="#2C7A4B" opacity="0.15"/>
                  <rect x="28" y="66" width="16" height="16" rx="1" fill="white"/>
                  {/* QR data dots */}
                  <rect x="54" y="18" width="7" height="7" rx="1" fill="#2C7A4B"/>
                  <rect x="54" y="32" width="7" height="7" rx="1" fill="#2C7A4B"/>
                  <rect x="63" y="25" width="7" height="7" rx="1" fill="#2C7A4B"/>
                  <rect x="54" y="46" width="7" height="7" rx="1" fill="#2C7A4B"/>
                  <rect x="63" y="53" width="7" height="7" rx="1" fill="#2C7A4B"/>
                  <rect x="54" y="62" width="20" height="7" rx="1" fill="#2C7A4B"/>
                  <rect x="78" y="46" width="8" height="22" rx="1" fill="#2C7A4B"/>
                  {/* Arrow */}
                  <line x1="106" y1="52" x2="116" y2="52" stroke="#2C7A4B" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M113 46 L119 52 L113 58" fill="none" stroke="#2C7A4B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Printer body */}
                  <rect x="118" y="38" width="66" height="46" rx="7" fill="#F0FAF4" stroke="#2C7A4B" strokeWidth="1.5"/>
                  {/* Paper tray top */}
                  <rect x="128" y="27" width="46" height="14" rx="3" fill="white" stroke="#E8EDE8" strokeWidth="1.5"/>
                  {/* Paper output */}
                  <rect x="128" y="82" width="46" height="26" rx="3" fill="white" stroke="#E8EDE8" strokeWidth="1.5"/>
                  <rect x="134" y="91" width="30" height="3" rx="1.5" fill="#E8EDE8"/>
                  <rect x="134" y="98" width="22" height="3" rx="1.5" fill="#E8EDE8"/>
                  {/* Printer lights */}
                  <circle cx="132" cy="61" r="4" fill="#2C7A4B" opacity="0.7"/>
                  <circle cx="146" cy="61" r="4" fill="#3DA66A" opacity="0.5"/>
                </svg>
              </div>
              <h3 style={{ fontSize: "19px", fontWeight: "700", color: "#1a2533", marginBottom: "10px" }}>QRコードを設置</h3>
              <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.8 }}>マイページからQRコードを印刷して、レジや卓上に設置するだけ。数分で完了します。</p>
            </div>

            {/* STEP 2 */}
            <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 24px", border: "1.5px solid #E8EDE8", textAlign: "left" }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", background: "#2C7A4B", color: "#fff", fontWeight: "700", fontSize: "15px", marginBottom: "20px", fontFamily: "'Outfit', sans-serif" }}>2</div>
              <div style={{ background: "#F8FAF8", borderRadius: "16px", padding: "16px", marginBottom: "20px", textAlign: "center" }}>
                <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "130px" }}>
                  {/* Phone outer */}
                  <rect x="60" y="4" width="80" height="122" rx="14" fill="#1a2533"/>
                  {/* Screen */}
                  <rect x="65" y="16" width="70" height="102" rx="4" fill="white"/>
                  {/* Notch */}
                  <rect x="85" y="8" width="30" height="7" rx="3.5" fill="#0A1219"/>
                  {/* App header */}
                  <rect x="65" y="16" width="70" height="18" rx="0" fill="#2C7A4B"/>
                  <text x="100" y="28" textAnchor="middle" fill="white" fontSize="7" fontWeight="700" fontFamily="sans-serif">口コミ投稿</text>
                  {/* Title text */}
                  <text x="69" y="46" fill="#1a2533" fontSize="6.5" fontWeight="700" fontFamily="sans-serif">ご来店ありがとうございます！</text>
                  {/* Stars row */}
                  <text x="69" y="60" fill="#F5A623" fontSize="11" fontFamily="sans-serif">★★★★</text>
                  <text x="113" y="60" fill="#E8EDE8" fontSize="11" fontFamily="sans-serif">★</text>
                  {/* Choice chips */}
                  <rect x="69" y="65" width="30" height="9" rx="4.5" fill="#E8F5EE" stroke="#2C7A4B" strokeWidth="0.8"/>
                  <text x="84" y="72" textAnchor="middle" fill="#2C7A4B" fontSize="5" fontFamily="sans-serif">スタッフの対応</text>
                  <rect x="102" y="65" width="30" height="9" rx="4.5" fill="#E8F5EE" stroke="#2C7A4B" strokeWidth="0.8"/>
                  <text x="117" y="72" textAnchor="middle" fill="#2C7A4B" fontSize="5" fontFamily="sans-serif">施術の仕上がり</text>
                  <rect x="69" y="78" width="22" height="9" rx="4.5" fill="#F4F6F9"/>
                  <text x="80" y="85" textAnchor="middle" fill="#888" fontSize="5" fontFamily="sans-serif">清潔感</text>
                  <rect x="94" y="78" width="16" height="9" rx="4.5" fill="#F4F6F9"/>
                  <text x="102" y="85" textAnchor="middle" fill="#888" fontSize="5" fontFamily="sans-serif">価格</text>
                  {/* Button */}
                  <rect x="69" y="93" width="62" height="14" rx="7" fill="#2C7A4B"/>
                  <text x="100" y="103" textAnchor="middle" fill="white" fontSize="6" fontWeight="700" fontFamily="sans-serif">Googleで口コミを書く</text>
                  {/* Home indicator */}
                  <rect x="87" y="113" width="26" height="3" rx="1.5" fill="#E8EDE8"/>
                </svg>
              </div>
              <h3 style={{ fontSize: "19px", fontWeight: "700", color: "#1a2533", marginBottom: "10px" }}>お客様がQRを読み取る</h3>
              <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.8 }}>7つの質問に答えるだけでAIが口コミ文を3パターン自動生成。選ぶだけでOK。</p>
            </div>

            {/* STEP 3 */}
            <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 24px", border: "1.5px solid #E8EDE8", textAlign: "left" }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", background: "#2C7A4B", color: "#fff", fontWeight: "700", fontSize: "15px", marginBottom: "20px", fontFamily: "'Outfit', sans-serif" }}>3</div>
              <div style={{ background: "#F8FAF8", borderRadius: "16px", padding: "16px", marginBottom: "20px", textAlign: "center" }}>
                <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "130px" }}>
                  {/* Card background */}
                  <rect x="20" y="14" width="160" height="102" rx="12" fill="white" stroke="#E8EDE8" strokeWidth="1.5"/>
                  {/* Google logo G */}
                  <circle cx="50" cy="42" r="16" fill="white" stroke="#E8EDE8" strokeWidth="1"/>
                  <text x="50" y="48" textAnchor="middle" fill="#4285F4" fontSize="18" fontWeight="900" fontFamily="sans-serif">G</text>
                  {/* Google text */}
                  <text x="75" y="40" fill="#1a2533" fontSize="13" fontWeight="700" fontFamily="sans-serif">oogle</text>
                  <text x="75" y="52" fill="#888" fontSize="7" fontFamily="sans-serif">マップに投稿されました</text>
                  {/* Divider */}
                  <line x1="30" y1="64" x2="170" y2="64" stroke="#F0F0F0" strokeWidth="1"/>
                  {/* Stars */}
                  <text x="30" y="82" fill="#F5A623" fontSize="16" fontFamily="sans-serif">★★★★★</text>
                  <text x="145" y="82" fill="#888" fontSize="10" fontWeight="700" fontFamily="sans-serif">5.0</text>
                  {/* Review lines */}
                  <rect x="30" y="88" width="110" height="5" rx="2.5" fill="#E8EDE8"/>
                  <rect x="30" y="97" width="80" height="5" rx="2.5" fill="#E8EDE8"/>
                  {/* Checkmark badge */}
                  <circle cx="162" cy="28" r="20" fill="#2C7A4B"/>
                  <path d="M153 28 L159 35 L172 21" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ fontSize: "19px", fontWeight: "700", color: "#1a2533", marginBottom: "10px" }}>Googleに自動投稿</h3>
              <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.8 }}>生成された文章をコピーしてGoogleマップに投稿。お客様の負担を最小限に。</p>
            </div>

          </div>
        </div>
      </section>

      {/* 機能 */}
      <section id="features" style={{ background: "#0F1923" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="section-title" style={{ color: "#fff" }}>口コミを増やすための<br />全機能が揃っています</h2>
          <p className="section-sub" style={{ color: "rgba(255,255,255,0.5)" }}>飲食・美容・医療・サービス業など、あらゆる業種に対応</p>
          <div className="feature-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", textAlign: "left" }}>
            {[
              { icon: "🤖", title: "AI口コミ自動生成", desc: "お客様の回答をもとに、年代・性別・文体を考慮した自然な口コミ文を3パターン生成。" },
              { icon: "📊", title: "業種別テンプレート", desc: "飲食・美容・医療・整体など30業種以上に対応。業種に最適化された質問を自動設定。" },
              { icon: "📱", title: "QRコード即納品", desc: "マイページからPNG・PDF・A4印刷用POPをいつでもダウンロード可能。" },
              { icon: "⚡", title: "リアルタイム管理", desc: "口コミ投稿数・平均評価・低評価アラートを管理画面でリアルタイム確認。" },
              { icon: "🔒", title: "低評価対策PRO", desc: "低評価の口コミには自動で対応案を提案。評価が下がる前に手を打てます。（オプション）" },
              { icon: "📧", title: "月次レポート自動送信", desc: "口コミ数・評価推移・改善提案をまとめたレポートを毎月自動でメール配信。（オプション）" },
            ].map((f, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "28px 24px" }}>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>{f.icon}</div>
                <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#fff", marginBottom: "10px" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 実際の画面 */}
      <section id="cases" style={{ background: "#F8FAF8" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="section-title">実際の画面をご覧ください</h2>
          <p className="section-sub">シンプルで使いやすい画面設計で、お客様もオーナーも迷わず使えます</p>

          {/* Tab switcher */}
          <div style={{ display: "inline-flex", background: "#E8EDE8", borderRadius: "100px", padding: "4px", marginBottom: "48px" }}>
            <button
              onClick={() => setActiveTab("user")}
              style={{ padding: "10px 28px", borderRadius: "100px", border: "none", background: activeTab === "user" ? "#2C7A4B" : "transparent", color: activeTab === "user" ? "#fff" : "#888", fontWeight: "700", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
              エンドユーザー画面
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              style={{ padding: "10px 28px", borderRadius: "100px", border: "none", background: activeTab === "admin" ? "#2C7A4B" : "transparent", color: activeTab === "admin" ? "#fff" : "#888", fontWeight: "700", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
              管理画面
            </button>
          </div>

          {/* Phone mockup */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            {activeTab === "user" ? (
              <div style={{ width: "280px", background: "#fff", borderRadius: "40px", border: "8px solid #1a2533", boxShadow: "0 32px 80px rgba(0,0,0,0.18)", overflow: "hidden" }}>
                <div style={{ background: "#1a2533", height: "28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "64px", height: "10px", background: "#0A1219", borderRadius: "6px" }} />
                </div>
                <div style={{ background: "#2C7A4B", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: "900", color: "#fff", fontSize: "15px" }}>REVIEW PRO</span>
                  <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "3px 10px", borderRadius: "100px" }}>口コミ投稿</span>
                </div>
                <div style={{ padding: "20px 16px 8px", background: "#fff" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1a2533", marginBottom: "4px", textAlign: "left" }}>ご来店ありがとうございます！</h3>
                  <p style={{ fontSize: "12px", color: "#888", marginBottom: "16px", textAlign: "left" }}>○○サロン 渋谷店</p>
                  <div style={{ marginBottom: "14px", textAlign: "left" }}>
                    <p style={{ fontSize: "11px", color: "#555", fontWeight: "600", marginBottom: "6px" }}>総合評価</p>
                    <div style={{ display: "flex", gap: "2px" }}>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{ fontSize: "24px", color: s <= 4 ? "#F5A623" : "#E8EDE8" }}>★</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: "16px", textAlign: "left" }}>
                    <p style={{ fontSize: "11px", color: "#555", fontWeight: "600", marginBottom: "8px" }}>特に良かった点は？</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {[
                        { label: "スタッフの対応", selected: true },
                        { label: "施術の仕上がり", selected: true },
                        { label: "清潔感", selected: false },
                        { label: "価格", selected: false },
                      ].map((item, idx) => (
                        <span key={idx} style={{ background: item.selected ? "#E8F5EE" : "#F4F6F9", color: item.selected ? "#2C7A4B" : "#888", fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "100px", border: `1px solid ${item.selected ? "#2C7A4B" : "#E8EDE8"}` }}>{item.label}</span>
                      ))}
                    </div>
                  </div>
                  <button style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #2C7A4B, #3DA66A)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "700", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", marginBottom: "12px" }}>
                    Googleで口コミを書く
                  </button>
                </div>
                <div style={{ background: "#fff", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "52px", height: "4px", background: "#E8EDE8", borderRadius: "2px" }} />
                </div>
              </div>
            ) : (
              <div style={{ width: "280px", background: "#fff", borderRadius: "40px", border: "8px solid #1a2533", boxShadow: "0 32px 80px rgba(0,0,0,0.18)", overflow: "hidden" }}>
                <div style={{ background: "#1a2533", height: "28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "64px", height: "10px", background: "#0A1219", borderRadius: "6px" }} />
                </div>
                <div style={{ background: "#2C7A4B", padding: "12px 16px" }}>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px", marginBottom: "2px" }}>マイページ</p>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: "900", color: "#fff", fontSize: "15px" }}>ダッシュボード</span>
                </div>
                <div style={{ padding: "14px", background: "#F8FAF8" }}>
                  <div style={{ background: "#fff", borderRadius: "12px", padding: "12px 14px", marginBottom: "10px", border: "1px solid #E8EDE8", textAlign: "left" }}>
                    <p style={{ fontSize: "10px", color: "#888", marginBottom: "4px" }}>今月の口コミ件数</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "28px", fontWeight: "900", color: "#1a2533", lineHeight: 1 }}>12</span>
                      <span style={{ fontSize: "11px", color: "#888" }}>件</span>
                      <span style={{ fontSize: "11px", color: "#2C7A4B", fontWeight: "700", background: "#E8F5EE", padding: "2px 8px", borderRadius: "100px" }}>+12件</span>
                    </div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: "12px", padding: "12px 14px", marginBottom: "10px", border: "1px solid #E8EDE8", textAlign: "left" }}>
                    <p style={{ fontSize: "10px", color: "#888", marginBottom: "4px" }}>平均評価</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "28px", fontWeight: "900", color: "#F5A623", lineHeight: 1 }}>4.8</span>
                      <span style={{ color: "#F5A623", fontSize: "16px" }}>★</span>
                    </div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: "12px", padding: "12px 14px", marginBottom: "10px", border: "1px solid #E8EDE8", textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <p style={{ fontSize: "10px", color: "#888" }}>今月の利用状況</p>
                      <span style={{ fontSize: "10px", color: "#2C7A4B", fontWeight: "700" }}>14/20回</span>
                    </div>
                    <div style={{ background: "#F0F4F0", borderRadius: "100px", height: "6px", overflow: "hidden" }}>
                      <div style={{ width: "70%", height: "100%", background: "linear-gradient(90deg, #2C7A4B, #3DA66A)", borderRadius: "100px" }} />
                    </div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: "12px", padding: "12px 14px", border: "1px solid #E8EDE8", textAlign: "left" }}>
                    <p style={{ fontSize: "10px", color: "#888", marginBottom: "8px" }}>契約情報</p>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                      <span style={{ color: "#555" }}>プラン</span>
                      <span style={{ color: "#1a2533", fontWeight: "700" }}>スタンダード</span>
                    </div>
                    <div style={{ height: "1px", background: "#F0F0F0", margin: "6px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                      <span style={{ color: "#555" }}>次回請求日</span>
                      <span style={{ color: "#1a2533", fontWeight: "700" }}>2025/05/01</span>
                    </div>
                  </div>
                </div>
                <div style={{ background: "#F8FAF8", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "52px", height: "4px", background: "#E8EDE8", borderRadius: "2px" }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 料金 */}
      <section id="pricing" style={{ background: "#fff" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="section-title">シンプルな料金プラン</h2>
          <p className="section-sub">年契約なら毎月お得。いつでも解約可能。</p>

          {/* 契約タイプ切り替えトグル */}
          <div style={{ display: "inline-flex", background: "#E8EDE8", borderRadius: "100px", padding: "4px", marginBottom: "48px", position: "relative" }}>
            <button
              onClick={() => setBillingCycle("yearly")}
              style={{ padding: "10px 28px", borderRadius: "100px", border: "none", background: billingCycle === "yearly" ? "#2C7A4B" : "transparent", color: billingCycle === "yearly" ? "#fff" : "#888", fontWeight: "700", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", position: "relative" }}>
              年契約
              <span style={{ marginLeft: "8px", background: billingCycle === "yearly" ? "rgba(255,255,255,0.25)" : "#2C7A4B", color: "#fff", borderRadius: "100px", padding: "2px 8px", fontSize: "11px", fontWeight: "700" }}>おすすめ</span>
            </button>
            <button
              onClick={() => setBillingCycle("monthly")}
              style={{ padding: "10px 28px", borderRadius: "100px", border: "none", background: billingCycle === "monthly" ? "#fff" : "transparent", color: billingCycle === "monthly" ? "#1a2533" : "#888", fontWeight: "700", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", boxShadow: billingCycle === "monthly" ? "0 2px 8px rgba(0,0,0,0.1)" : "none" }}>
              月契約
              <span style={{ marginLeft: "8px", fontSize: "11px", color: billingCycle === "monthly" ? "#888" : "#aaa" }}>縛りなし</span>
            </button>
          </div>

          <div className="plan-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", alignItems: "start" }}>
            {plans.map((plan, i) => {
              const price = plan.monthlyPrice[billingCycle];
              const setup = plan.setupFee[billingCycle];
              const firstMonth = price + setup;
              return (
                <div key={i} style={{ background: "#fff", borderRadius: "20px", padding: "32px 28px", border: plan.recommended ? "2px solid #2C7A4B" : "1.5px solid #E8EDE8", position: "relative", boxShadow: plan.recommended ? "0 8px 40px rgba(44,122,75,0.15)" : "none" }}>
                  {plan.recommended && (
                    <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "#2C7A4B", color: "#fff", borderRadius: "100px", padding: "4px 20px", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" }}>
                      ⭐ 一番人気・おすすめ
                    </div>
                  )}
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#1a2533", marginBottom: "8px" }}>{plan.name}</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "40px", fontWeight: "900", color: plan.recommended ? "#2C7A4B" : "#1a2533", lineHeight: 1 }}>
                    ¥{price.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888", marginBottom: "4px" }}>/月（税別）</div>
                  <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "8px" }}>導入設定費 ¥{setup.toLocaleString()}</div>
                  <div style={{ fontSize: "12px", background: "#FFF9E6", color: "#B7791F", borderRadius: "8px", padding: "6px 12px", marginBottom: "20px", fontWeight: "600", display: "inline-block" }}>
                    初月合計 ¥{firstMonth.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#2C7A4B", background: "#F0FAF4", borderRadius: "8px", padding: "6px 12px", marginBottom: "24px", display: "inline-block", marginLeft: "8px" }}>
                    {plan.limit}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px", textAlign: "left" }}>
                    {plan.features.map((f, j) => (
                      <div key={j} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14px", color: "#555" }}>
                        <span style={{ color: "#2C7A4B", flexShrink: 0, marginTop: "1px" }}>✓</span>
                        {f}
                      </div>
                    ))}
                  </div>
                  <Link href="/signup" style={{ display: "block", padding: "14px", borderRadius: "12px", background: plan.recommended ? "linear-gradient(135deg, #2C7A4B, #3DA66A)" : "#F4F6F9", color: plan.recommended ? "#fff" : "#555", fontWeight: "700", fontSize: "15px", textDecoration: "none", textAlign: "center", transition: "all 0.2s" }}>
                    {plan.cta} →
                  </Link>
                </div>
              );
            })}
          </div>
          <p style={{ color: "#aaa", fontSize: "14px", marginTop: "32px" }}>
            ※ 初月は月額＋導入設定費のお支払いとなります。2ヶ月目以降は月額のみ。
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ background: "#F8FAF8" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="section-title">よくある質問</h2>
          <p className="section-sub">ご不明な点はお気軽にお問い合わせください</p>
          <div className="faq-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", textAlign: "left" }}>
            {[
              { q: "導入にどのくらい時間がかかりますか？", a: "申込後、最短即日でご利用開始できます。QRコードはマイページからすぐにダウンロードできます。" },
              { q: "どんな業種でも使えますか？", a: "飲食・美容・医療・整体・整骨院・不動産・小売など、Googleマップに登録されているあらゆる業種でご利用いただけます。" },
              { q: "お客様のスマートフォンで操作は難しくないですか？", a: "QRコードを読み取るだけで、選ぶだけの簡単な操作で口コミ文が完成します。入力不要のため、高齢の方にも使っていただけます。" },
              { q: "口コミの内容をコントロールできますか？", a: "業種に合わせた質問テンプレートを設定することで、お店の魅力が伝わる口コミが生成されやすくなります。プランによって質問の編集も可能です。" },
              { q: "解約はいつでもできますか？", a: "はい、いつでもマイページから解約申請できます。解約後も翌月末まではサービスをご利用いただけます。" },
              { q: "複数店舗で使えますか？", a: "現在は1プランにつき1店舗です。複数店舗の場合はプランを複数ご契約いただくか、オプションで店舗追加（¥3,980/月）が可能です。" },
            ].map((faq, i) => (
              <div key={i} style={{ background: "#fff", border: "1.5px solid #E8EDE8", borderRadius: "16px", padding: "24px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1a2533", marginBottom: "10px" }}>Q. {faq.q}</h3>
                <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.8 }}>A. {faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div style={{ background: "linear-gradient(160deg, #0F1923, #0d2818)", padding: "96px 24px", textAlign: "center" }}>
        <div className="container">
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "900", color: "#fff", marginBottom: "20px", lineHeight: 1.2 }}>
            今すぐ口コミを<br />増やし始めましょう
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "17px", marginBottom: "40px", lineHeight: 1.8 }}>
            年契約なら月々¥3,980から。<br />設定は5分で完了します。
          </p>
          <Link href="/signup" className="btn-primary" style={{ fontSize: "18px", padding: "20px 56px" }}>
            今すぐ申し込む →
          </Link>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px", marginTop: "20px" }}>
            いつでも解約可能 / サポートあり
          </p>
        </div>
      </div>

      {/* フッター */}
      <footer style={{ background: "#0A1219", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 24px 32px" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "32px" }}>
          <div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "20px", fontWeight: "900", color: "#fff", marginBottom: "8px" }}>REVIEW PRO</div>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>合同会社Relationship</p>
          </div>
          <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: "700", marginBottom: "12px", letterSpacing: "0.1em" }}>サービス</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <a href="#features" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "14px" }}>機能</a>
                <a href="#pricing" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "14px" }}>料金</a>
                <Link href="/signup" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "14px" }}>お申し込み</Link>
              </div>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: "700", marginBottom: "12px", letterSpacing: "0.1em" }}>サポート</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link href="/mypage" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "14px" }}>マイページ</Link>
                <a href="mailto:info@re-ship.co.jp" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "14px" }}>お問い合わせ</a>
              </div>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: "700", marginBottom: "12px", letterSpacing: "0.1em" }}>法的情報</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link href="/terms" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "14px" }}>利用規約</Link>
                <Link href="/privacy" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "14px" }}>プライバシーポリシー</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="container" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "40px", paddingTop: "24px", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>© 2024 合同会社Relationship. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
