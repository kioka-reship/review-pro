import Link from "next/link";

export default function LandingPage() {
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
          <div className="step-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px", position: "relative" }}>
            {[
              { num: "01", icon: "📱", title: "QRコードを設置", desc: "マイページからQRコードを印刷して、レジや卓上に設置するだけ。数分で完了します。" },
              { num: "02", icon: "✨", title: "お客様がQRを読み取る", desc: "7つの質問に答えるだけでAIが口コミ文を3パターン自動生成。選ぶだけでOK。" },
              { num: "03", icon: "🎯", title: "Googleに自動投稿", desc: "生成された文章をコピーしてGoogleマップに投稿。お客様の負担を最小限に。" },
            ].map((step, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: "20px", padding: "36px 28px", border: "1.5px solid #E8EDE8", position: "relative", textAlign: "left" }}>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "64px", fontWeight: "900", color: "#F0FAF4", position: "absolute", top: "16px", right: "20px", lineHeight: 1 }}>{step.num}</div>
                <div style={{ fontSize: "40px", marginBottom: "20px" }}>{step.icon}</div>
                <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1a2533", marginBottom: "12px" }}>{step.title}</h3>
                <p style={{ fontSize: "15px", color: "#888", lineHeight: 1.8 }}>{step.desc}</p>
              </div>
            ))}
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

      {/* 導入事例 */}
      <section id="cases">
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="section-title">導入事例</h2>
          <p className="section-sub">様々な業種で口コミ増加の実績があります</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "28px", textAlign: "left" }}>
            {[
              { type: "美容脱毛サロン", name: "Plus Belle", result: "導入3ヶ月で口コミ47件増加", stars: 5, comment: "QRコードを置いただけで、毎週コンスタントに口コミが入るようになりました。スタッフがお願いしなくてもお客様が自然に投稿してくれます。", owner: "オーナー" },
              { type: "飲食店", name: "博多ラーメン 一風堂風", result: "Googleマップの評価が3.8→4.4に向上", stars: 5, comment: "AIが自然な文章を作ってくれるので、お客様が気軽に投稿できるようになりました。星5の口コミが増えて集客にも繋がっています。", owner: "店主" },
              { type: "整体・接骨院", name: "コーネリアス整体院", result: "月間口コミ投稿数が0件→12件に", stars: 5, comment: "今まで口コミ0件でしたが、導入後すぐに投稿が増えました。患者さんから「簡単に書けた」と言われて嬉しかったです。", owner: "院長" },
            ].map((c, i) => (
              <div key={i} style={{ background: "#fff", border: "1.5px solid #E8EDE8", borderRadius: "20px", padding: "28px", position: "relative" }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                  {[...Array(c.stars)].map((_, j) => <span key={j} style={{ color: "#F5A623", fontSize: "18px" }}>★</span>)}
                </div>
                <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.8, marginBottom: "20px" }}>"{c.comment}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid #F0F0F0", paddingTop: "16px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#F0FAF4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>👤</div>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "14px", color: "#1a2533" }}>{c.name}</div>
                    <div style={{ fontSize: "12px", color: "#2C7A4B", fontWeight: "600" }}>{c.type} / {c.owner}</div>
                  </div>
                </div>
                <div style={{ position: "absolute", top: "20px", right: "20px", background: "#F0FAF4", borderRadius: "8px", padding: "4px 12px", fontSize: "12px", color: "#2C7A4B", fontWeight: "700" }}>
                  {c.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金 */}
      <section id="pricing" style={{ background: "#F8FAF8" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="section-title">シンプルな料金プラン</h2>
          <p className="section-sub">ライトプランは導入設定費無料。いつでも解約可能。</p>
          <div className="plan-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", alignItems: "start" }}>
            {[
              {
                name: "ライト",
                price: "¥2,980",
                setup: "導入設定費 無料",
                limit: "月10回",
                features: ["口コミ生成 月10回", "QR口コミ導線", "管理画面", "1店舗"],
                cta: "始める",
                recommended: false,
              },
              {
                name: "スタンダード",
                price: "¥5,980",
                setup: "導入設定費 ¥9,800",
                limit: "月20回",
                features: ["口コミ生成 月20回", "QR口コミ導線", "管理画面", "1店舗", "オプション追加可", "質問テンプレ変更可"],
                cta: "始める",
                recommended: false,
              },
              {
                name: "プレミアム",
                price: "¥9,800",
                setup: "導入設定費 ¥19,800",
                limit: "無制限",
                features: ["口コミ生成 無制限", "QR口コミ導線", "管理画面", "1店舗", "低評価対策PRO", "AI口コミ自動返信", "フィードバック一覧", "月次自動レポート", "成果ダッシュボード", "優先サポート", "質問自由編集"],
                cta: "始める",
                recommended: true,
              },
            ].map((plan, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: "20px", padding: "32px 28px", border: plan.recommended ? "2px solid #2C7A4B" : "1.5px solid #E8EDE8", position: "relative", boxShadow: plan.recommended ? "0 8px 40px rgba(44,122,75,0.15)" : "none" }}>
                {plan.recommended && (
                  <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "#2C7A4B", color: "#fff", borderRadius: "100px", padding: "4px 20px", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" }}>
                    ⭐ 一番人気・おすすめ
                  </div>
                )}
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#1a2533", marginBottom: "8px" }}>{plan.name}</div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "40px", fontWeight: "900", color: plan.recommended ? "#2C7A4B" : "#1a2533", lineHeight: 1 }}>{plan.price}</div>
                <div style={{ fontSize: "13px", color: "#888", marginBottom: "4px" }}>/月（税別）</div>
                <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "24px" }}>{plan.setup}</div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#2C7A4B", background: "#F0FAF4", borderRadius: "8px", padding: "6px 12px", marginBottom: "24px", display: "inline-block" }}>
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
            ))}
          </div>
          <p style={{ color: "#aaa", fontSize: "14px", marginTop: "32px" }}>※ 料金は月額＋初回導入設定費です。ライトプランは導入設定費無料。</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
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
            ライトプランは導入設定費無料。<br />設定は5分で完了します。
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
