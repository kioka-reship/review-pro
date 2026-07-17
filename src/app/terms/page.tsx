export default function TermsPage() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "#F4F6F9", fontFamily: "'Noto Sans JP',sans-serif" }}>
        <div style={{ background: "#0F1923", padding: "0 24px", height: "56px", display: "flex", alignItems: "center" }}>
          <a href="/" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "18px", fontWeight: "800", color: "#fff", textDecoration: "none" }}>REVIEW PRO</a>
        </div>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "40px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <h1 style={{ fontSize: "24px", color: "#1a2533", marginBottom: "8px" }}>利用規約</h1>
            <p style={{ color: "#888", fontSize: "13px", marginBottom: "32px" }}>最終更新日：2024年1月1日</p>

            {[
              {
                title: "第1条（本サービスについて）",
                content: "REVIEW PRO（以下「本サービス」）は、合同会社Relationship（以下「当社」）が提供するAIを活用した口コミ生成支援サービスです。本規約は、本サービスを利用するすべてのお客様（以下「契約者」）に適用されます。"
              },
              {
                title: "第2条（契約の成立）",
                content: "契約者が申込フォームに必要事項を入力し、本規約に同意の上、当社所定の決済を完了した時点で、当社と契約者の間に本サービスの利用契約が成立します。決済が完了するまでサービスは開通しません。"
              },
              {
                title: "第3条（料金・決済）",
                content: "本サービスの料金は申込時に選択したプランに基づきます。初回は導入設定費と初月月額を申込時に決済します。翌月以降は毎月5日に月額料金を自動課金します。なお、1日〜20日のご契約は翌月5日、21日〜月末のご契約は翌々月5日が初回継続課金日となります。"
              },
              {
                title: "第4条（プラン変更）",
                content: "アップグレードは申請時に即時反映され、差額が即時決済されます。ダウングレードは次回請求日から反映されます。オプションの追加は申請時に即時決済され、以降毎月自動課金されます。オプションの解約は申請翌月から反映されます。"
              },
              {
                title: "第5条（返金ポリシー）",
                content: "当社は原則として返金を行いません。ただし、当社の責に帰すべき事由によりサービスが提供できなかった場合は、その期間に応じた返金を行う場合があります。"
              },
              {
                title: "第6条（解約）",
                content: "契約者はマイページから解約申請を行うことができます。申請月の料金は返金しません。①月契約の場合、解約申請の翌月末をもってサービスを停止します。解約金は発生しません。②年契約の場合、解約申請の翌月末をもってサービスを停止します。解約金は残月数分の料金＋残月数分の料金の50%（途中解約違約金）を申請時に自動請求します。また年契約期間中はダウングレードはできません。解約後90日間はデータを保持しますが、その後削除します。"
              },
              {
                title: "第7条（禁止事項）",
                content: "契約者は以下の行為を行ってはなりません。①虚偽の情報を登録する行為、②本サービスを不正に利用する行為、③第三者の権利を侵害する行為、④当社のシステムに過度な負荷をかける行為、⑤法令に違反する行為。"
              },
              {
                title: "第8条（サービスの変更・停止）",
                content: "当社は、事前に通知することなく本サービスの内容を変更または停止することができます。これにより契約者に損害が生じた場合でも、当社は責任を負いません。"
              },
              {
                title: "第9条（免責事項）",
                content: "本サービスで生成される口コミ文はAIが作成するものであり、その内容の正確性・適切性について当社は保証しません。契約者は生成された文章を自己の責任において使用するものとします。"
              },
              {
                title: "第10条（準拠法・管轄）",
                content: "本規約は日本法に準拠します。本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。"
              },
              {
                title: "第11条（物件利用・法令遵守に関する責任）",
                content: "契約者が本サービスを利用する店舗・事務所等の物件について、賃貸借契約・管理規約・建物使用規則等における事業利用・店舗利用・事務所利用の可否は、契約者自身の責任において確認するものとします。本サービスの利用によって収集された口コミ・レビュー・その他情報が第三者（物件オーナー・管理会社・近隣住民等を含む）に知られたことにより生じたトラブル・損害・契約解除等について、当社は一切の責任を負いません。また、契約者は本サービスの利用にあたり、関連する法令・契約・規約等を遵守する責任を負うものとし、これらに違反したことによる損害について当社は免責されるものとします。"
              },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: "28px" }}>
                <h2 style={{ fontSize: "16px", color: "#1a2533", marginBottom: "10px" }}>{item.title}</h2>
                <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.8" }}>{item.content}</p>
              </div>
            ))}

            <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "24px", marginTop: "8px" }}>
              <p style={{ fontSize: "13px", color: "#888" }}>合同会社Relationship<br />お問い合わせ：info@re-ship.co.jp</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
