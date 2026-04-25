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
  company_name?: string;
  referral_code?: string;
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
  light: "ライト ¥4,980",
  standard: "スタンダード ¥9,800",
  premium: "プレミアム ¥19,800",
};

const STATUS_OPTIONS = ["契約中", "入金待ち", "停止中", "仮申込", "解約予約", "解約済"];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  "契約中":  { bg: "#ECFDF5", color: "#065F46" },
  "入金待ち": { bg: "#FFFBEB", color: "#92400E" },
  "停止中":  { bg: "#FEF2F2", color: "#991B1B" },
  "仮申込":  { bg: "#EFF6FF", color: "#1D4ED8" },
  "解約予約": { bg: "#FFF7ED", color: "#9A3412" },
  "解約済":  { bg: "#F3F4F6", color: "#6B7280" },
};

const INDUSTRY_OPTIONS = [
  "飲食店", "ラーメン店", "寿司・和食", "焼肉・肉料理", "カフェ・喫茶店", "居酒屋・バー", "パン・ベーカリー",
  "美容脱毛", "美容室・ヘアサロン", "エステ・フェイシャル", "ネイルサロン", "マッサージ・整体", "接骨院・鍼灸院", "パーソナルジム・ジム",
  "小売・物販", "アパレル・ファッション", "家電・電気店", "ドラッグストア・薬局", "書店・文具店",
  "クリーニング店", "リフォーム・工務店", "不動産・賃貸", "自動車販売・整備", "旅行・観光",
  "塾・学習教室", "スポーツスクール・教室", "音楽・楽器教室",
  "ホテル・旅館", "動物病院・ペットサロン", "写真館・フォトスタジオ", "その他",
];

const APP_URL = "https://review-pro-ay7x.vercel.app";

const DEFAULT_QUESTIONS_MAP: Record<string, { label: string; type: string; options: string[] | null }[]> = {
  "飲食店": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご注文のメニューは？", type: "select", options: ["ランチ", "ディナー", "コース料理", "単品", "ドリンクのみ", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["料理・味", "スタッフの接客", "お店の雰囲気", "価格・コスパ", "立地・アクセス"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "友人に勧めたい", "期待以上だった", "コスパ最高！"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "ラーメン店": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご注文のメニューは？", type: "select", options: ["醤油ラーメン", "塩ラーメン", "味噌ラーメン", "豚骨ラーメン", "つけ麺", "餃子・サイド", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["スープの味", "麺の食感", "チャーシュー", "コスパ", "接客・対応"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "スープが絶品", "ボリューム満点", "クセになる味"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "寿司・和食": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のスタイルは？", type: "select", options: ["カウンター", "テーブル席", "個室", "テイクアウト", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["ネタの新鮮さ", "職人の技術", "お店の雰囲気", "価格・コスパ", "接客対応"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "ネタが最高", "特別な日に最適", "職人技に感動"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "焼肉・肉料理": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご注文のメインは？", type: "select", options: ["焼肉食べ放題", "単品注文", "コース料理", "ランチセット", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["肉の質・味", "コスパ", "お店の雰囲気", "サービス", "メニューの豊富さ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "肉が絶品", "コスパ最高", "記念日に最適"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "カフェ・喫茶店": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご注文のメニューは？", type: "select", options: ["コーヒー", "紅茶・ハーブティー", "スイーツ・ケーキ", "フード", "ドリンク各種", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["コーヒー・ドリンクの味", "スイーツの美味しさ", "居心地・雰囲気", "スタッフの対応", "価格・コスパ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "居心地最高", "コーヒーが絶品", "ゆっくりできた"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "居酒屋・バー": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のスタイルは？", type: "select", options: ["飲み放題コース", "単品注文", "食事メイン", "ちょい飲み", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "グループ"] },
    { label: "特に良かった点は？", type: "multi", options: ["料理の美味しさ", "お酒の種類", "コスパ", "スタッフの対応", "お店の雰囲気"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "お酒が充実", "料理が美味しい", "雰囲気最高"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "パン・ベーカリー": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご購入されたのは？", type: "select", options: ["食パン・ロールパン", "惣菜パン", "菓子パン・スイーツ", "バゲット・ハード系", "ケーキ・洋菓子", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族"] },
    { label: "特に良かった点は？", type: "multi", options: ["パンの美味しさ", "品揃えの豊富さ", "焼きたての香り", "価格・コスパ", "スタッフの対応"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "焼きたてが最高", "種類が豊富", "毎日通いたい"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "美容脱毛": [
    { label: "今日の施術はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のメニューは？", type: "select", options: ["全身脱毛", "顔脱毛", "VIO脱毛", "脚脱毛", "ワキ脱毛", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["施術の効果", "スタッフの対応", "サロンの清潔感", "価格・コスパ", "予約のしやすさ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "友人に勧めたい", "期待以上だった", "安心して通える"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "美容室・ヘアサロン": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のメニューは？", type: "select", options: ["カット", "カラー", "パーマ", "縮毛矯正", "トリートメント", "ヘッドスパ", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["仕上がり・技術", "スタイリストの提案力", "お店の清潔感", "価格・コスパ", "予約のしやすさ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "指名したい！", "イメージ通り！", "リラックスできた"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "エステ・フェイシャル": [
    { label: "今日の施術はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のメニューは？", type: "select", options: ["フェイシャルエステ", "ボディエステ", "痩身コース", "アロマトリートメント", "小顔矯正", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "家族"] },
    { label: "特に良かった点は？", type: "multi", options: ["施術の効果", "セラピストの技術", "サロンの雰囲気", "価格・コスパ", "リラックス感"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "効果を実感できた", "癒されました", "友人に勧めたい"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "ネイルサロン": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のメニューは？", type: "select", options: ["ジェルネイル", "スカルプ", "ネイルケア", "フットネイル", "アート・デザイン", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人"] },
    { label: "特に良かった点は？", type: "multi", options: ["デザインの仕上がり", "ネイリストの技術", "デザインの提案力", "サロンの清潔感", "価格・コスパ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "デザインが最高", "丁寧な仕上がり", "リラックスできた"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "マッサージ・整体": [
    { label: "今日の施術はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のメニューは？", type: "select", options: ["全身マッサージ", "肩・首集中", "腰・背中集中", "足裏・リフレクソロジー", "整体・骨盤矯正", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "家族"] },
    { label: "特に良かった点は？", type: "multi", options: ["施術の効果", "セラピストの技術", "院内の清潔感", "予約のしやすさ", "価格・コスパ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "体が楽になった", "丁寧に施術してもらえた", "リラックスできた"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "接骨院・鍼灸院": [
    { label: "今日の施術はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のメニューは？", type: "select", options: ["整体・矯正", "鍼灸", "マッサージ", "骨盤矯正", "スポーツ障害", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "家族"] },
    { label: "特に良かった点は？", type: "multi", options: ["施術の効果", "先生の説明のわかりやすさ", "院内の清潔感", "予約のしやすさ", "アクセスの良さ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "症状が改善した", "丁寧に診てもらえた", "友人に勧めたい"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "パーソナルジム・ジム": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のメニューは？", type: "select", options: ["パーソナルトレーニング", "マシントレーニング", "グループレッスン", "ヨガ・ピラティス", "水泳・プール", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "家族"] },
    { label: "特に良かった点は？", type: "multi", options: ["トレーナーの指導力", "設備の充実度", "清潔感", "プログラムの内容", "価格・コスパ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "効果を実感できた", "モチベーションが上がった", "継続できそう"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "小売・物販": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご購入された商品は？", type: "select", options: ["衣類・ファッション", "食品・飲料", "日用品・雑貨", "電化製品", "コスメ・美容品", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["商品のクオリティ", "スタッフの接客", "品揃えの豊富さ", "価格・コスパ", "店内の雰囲気"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "良い買い物ができた", "品揃えが最高", "スタッフが親切"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "アパレル・ファッション": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご購入されたアイテムは？", type: "select", options: ["トップス", "ボトムス", "アウター", "シューズ", "バッグ・小物", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["デザイン・センス", "スタッフの提案力", "品揃えの豊富さ", "価格・コスパ", "試着しやすさ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "センスが好み", "スタッフが親切", "掘り出し物が見つかった"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "家電・電気店": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご購入された商品は？", type: "select", options: ["スマートフォン・タブレット", "パソコン・周辺機器", "家電製品", "カメラ・AV機器", "ゲーム", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "家族"] },
    { label: "特に良かった点は？", type: "multi", options: ["スタッフの知識・説明", "品揃えの豊富さ", "価格・コスパ", "アフターサービス", "店内の見やすさ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "スタッフが詳しい", "価格が安い", "良い商品が見つかった"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "ドラッグストア・薬局": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご購入された商品は？", type: "select", options: ["医薬品", "サプリメント・健康食品", "コスメ・スキンケア", "日用品・雑貨", "食品・飲料", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "家族"] },
    { label: "特に良かった点は？", type: "multi", options: ["スタッフの対応・説明", "品揃えの豊富さ", "価格・コスパ", "立地・アクセス", "営業時間の長さ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "薬剤師が親切", "品揃えが充実", "便利でよく使う"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "書店・文具店": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご購入されたのは？", type: "select", options: ["小説・文芸", "ビジネス書", "実用書・参考書", "マンガ・雑誌", "文具・画材", "その他"] },
    { label: "何人でご来店でしたか？", type: "select", options: ["1人", "2人", "家族"] },
    { label: "特に良かった点は？", type: "multi", options: ["品揃えの豊富さ", "探しやすい陳列", "スタッフの対応", "価格・コスパ", "居心地の良さ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "品揃えが充実", "ゆっくり選べた", "スタッフが丁寧"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "クリーニング店": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご依頼された内容は？", type: "select", options: ["衣類クリーニング", "スーツ・礼服", "毛布・布団", "カーテン", "特殊品・シミ抜き", "その他"] },
    { label: "ご利用の頻度は？", type: "select", options: ["初めて", "たまに使う", "定期的に使う"] },
    { label: "特に良かった点は？", type: "multi", options: ["仕上がりの品質", "スタッフの対応", "価格・コスパ", "スピード・納期", "立地・アクセス"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "仕上がりが綺麗", "対応が丁寧", "リーズナブル"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "リフォーム・工務店": [
    { label: "今回のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご依頼の工事は？", type: "select", options: ["キッチン・浴室リフォーム", "外壁・屋根", "内装工事", "増改築", "修繕・修理", "その他"] },
    { label: "ご利用のきっかけは？", type: "select", options: ["紹介", "ネット検索", "チラシ", "過去に利用", "その他"] },
    { label: "特に良かった点は？", type: "multi", options: ["担当者の対応・説明", "施工のクオリティ", "工期・スピード", "価格・コスパ", "アフターサービス"] },
    { label: "一言でいうと？", type: "select", options: ["また依頼したい！", "仕上がりに大満足", "対応が丁寧", "友人に勧めたい"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["20代", "30代", "40代", "50代", "60代以上"] },
  ],
  "不動産・賃貸": [
    { label: "今回のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用の目的は？", type: "select", options: ["賃貸物件探し", "売買・購入", "売却相談", "投資物件", "その他"] },
    { label: "担当者の対応はいかがでしたか？", type: "select", options: ["とても良かった", "良かった", "普通", "もう少し"] },
    { label: "特に良かった点は？", type: "multi", options: ["物件の提案力", "担当者の知識", "説明のわかりやすさ", "スピード対応", "アフターフォロー"] },
    { label: "一言でいうと？", type: "select", options: ["また利用したい！", "理想の物件が見つかった", "担当者が親切", "安心して任せられた"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["20代", "30代", "40代", "50代", "60代以上"] },
  ],
  "自動車販売・整備": [
    { label: "今回のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用の内容は？", type: "select", options: ["新車購入", "中古車購入", "車検・整備", "点検・修理", "パーツ取付", "その他"] },
    { label: "ご来店人数は？", type: "select", options: ["1人", "2人", "家族"] },
    { label: "特に良かった点は？", type: "multi", options: ["スタッフの知識・説明", "価格・コスパ", "対応のスピード", "アフターサービス", "店内の雰囲気"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "親切に対応してもらえた", "良い車が見つかった", "安心して任せられた"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["20代", "30代", "40代", "50代", "60代以上"] },
  ],
  "旅行・観光": [
    { label: "今回のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のサービスは？", type: "select", options: ["国内旅行手配", "海外旅行手配", "ツアー参加", "ホテル・宿泊手配", "交通手配", "その他"] },
    { label: "何名でご利用でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["プランの提案力", "価格・コスパ", "手続きのスムーズさ", "スタッフの対応", "旅行中のサポート"] },
    { label: "一言でいうと？", type: "select", options: ["また利用したい！", "最高の旅になった", "コスパが良かった", "丁寧に相談に乗ってもらえた"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["20代", "30代", "40代", "50代", "60代以上"] },
  ],
  "塾・学習教室": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のコースは？", type: "select", options: ["個別指導", "集団授業", "映像授業", "オンライン", "英会話", "その他"] },
    { label: "どなたがご利用ですか？", type: "select", options: ["小学生", "中学生", "高校生", "大学生・社会人"] },
    { label: "特に良かった点は？", type: "multi", options: ["講師の指導力", "カリキュラムの内容", "成績の向上", "通いやすさ", "価格・コスパ"] },
    { label: "一言でいうと？", type: "select", options: ["また通いたい！", "成績が上がった", "子供がやる気になった", "先生が親切"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代", "20代", "30代", "40代", "50代以上"] },
  ],
  "スポーツスクール・教室": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のクラスは？", type: "select", options: ["水泳・スイミング", "サッカー・フットサル", "野球・ソフト", "テニス", "ゴルフ", "バスケ・バレー", "格闘技・武道", "ダンス", "その他"] },
    { label: "どなたがご利用ですか？", type: "select", options: ["子供（小学生以下）", "中学・高校生", "大人"] },
    { label: "特に良かった点は？", type: "multi", options: ["コーチの指導力", "施設・設備の充実度", "子供の成長を感じられる", "価格・コスパ", "スタッフの対応"] },
    { label: "一言でいうと？", type: "select", options: ["また通いたい！", "子供が楽しんでいる", "上達を感じられる", "友人に勧めたい"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代以下", "20代", "30代", "40代", "50代以上"] },
  ],
  "音楽・楽器教室": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご受講のコースは？", type: "select", options: ["ピアノ", "ギター", "ボーカル・歌", "ドラム", "バイオリン", "管楽器", "DTM・作曲", "その他"] },
    { label: "どなたがご利用ですか？", type: "select", options: ["子供（小学生以下）", "中学・高校生", "大人・社会人"] },
    { label: "特に良かった点は？", type: "multi", options: ["講師の指導力", "レッスン内容", "上達スピード", "スタジオ・設備", "価格・コスパ"] },
    { label: "一言でいうと？", type: "select", options: ["また通いたい！", "上達を実感できた", "楽しく続けられる", "先生が親切"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["10代以下", "20代", "30代", "40代", "50代以上"] },
  ],
  "ホテル・旅館": [
    { label: "今回のご滞在はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用のプランは？", type: "select", options: ["素泊まり", "朝食付き", "2食付き", "記念日プラン", "温泉プラン", "その他"] },
    { label: "何名でご宿泊でしたか？", type: "select", options: ["1人", "2人", "3〜4人", "5人以上", "家族", "カップル"] },
    { label: "特に良かった点は？", type: "multi", options: ["部屋の快適さ", "料理の美味しさ", "スタッフの対応", "施設・温泉", "価格・コスパ"] },
    { label: "一言でいうと？", type: "select", options: ["また泊まりたい！", "料理が絶品だった", "スタッフが最高", "リフレッシュできた"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["20代", "30代", "40代", "50代", "60代以上"] },
  ],
  "動物病院・ペットサロン": [
    { label: "今日のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用の内容は？", type: "select", options: ["診察・治療", "ワクチン接種", "トリミング", "ペットホテル", "歯科・健診", "その他"] },
    { label: "ペットの種類は？", type: "select", options: ["犬", "猫", "小動物", "鳥", "爬虫類", "その他"] },
    { label: "特に良かった点は？", type: "multi", options: ["獣医・スタッフの対応", "ペットへの接し方", "説明のわかりやすさ", "清潔感", "価格・コスパ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "ペットを安心して任せられた", "丁寧に診てもらえた", "友人に勧めたい"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["20代", "30代", "40代", "50代", "60代以上"] },
  ],
  "写真館・フォトスタジオ": [
    { label: "今回のご体験はいかがでしたか？", type: "stars", options: null },
    { label: "ご利用の撮影は？", type: "select", options: ["七五三・お宮参り", "成人式", "結婚式・前撮り", "家族写真", "証明写真", "その他"] },
    { label: "何名でご来店でしたか？", type: "select", options: ["1人", "2人", "家族（3人以上）", "グループ"] },
    { label: "特に良かった点は？", type: "multi", options: ["写真の仕上がり", "カメラマンの技術・演出", "衣装・小道具の充実", "スタッフの対応", "価格・コスパ"] },
    { label: "一言でいうと？", type: "select", options: ["また来たい！", "素敵な写真が撮れた", "スタッフが親切", "思い出になった"] },
    { label: "性別を教えてください", type: "select", options: ["男性", "女性", "回答しない"] },
    { label: "年代を教えてください", type: "select", options: ["20代", "30代", "40代", "50代", "60代以上"] },
  ],
};

const getDefaultQuestionsForType = (type: string) => {
  return DEFAULT_QUESTIONS_MAP[type] || DEFAULT_QUESTIONS_MAP["飲食店"];
};

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
  const [activeTab, setActiveTab] = useState<"stores" | "add" | "questions" | "cancels" | "logs" | "auth-check">("stores");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editStore, setEditStore] = useState<Store | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState("");
  const [newStore, setNewStore] = useState({ name: "", type: "飲食店", owner_name: "", email: "", password: "", plan: "standard", place_id: "" });
  const [addMsg, setAddMsg] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [qrStore, setQrStore] = useState<Store | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [cancelRequests, setCancelRequests] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [feedbackStore, setFeedbackStore] = useState<Store | null>(null);
  const [feedbackMonth, setFeedbackMonth] = useState("");

  const fetchFeedback = async (storeId: string) => {
    const res = await fetch(`/api/admin/feedback?store_id=${storeId}`);
    const data = await res.json();
    setFeedbackList(data.feedback || []);
  };

  const handleOpenFeedback = async (store: Store) => {
    setFeedbackStore(store);
    setFeedbackMonth("");
    await fetchFeedback(store.id);
  };

  const fetchAuditLogs = async () => {
    const res = await fetch("/api/admin/audit-logs");
    const data = await res.json();
    setAuditLogs(data.logs || []);
  };

  const fetchCancelRequests = async () => {
    const res = await fetch("/api/admin/cancel-requests");
    const data = await res.json();
    setCancelRequests(data.requests || []);
  };

  const filteredStores = stores.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [deleteConfirm, setDeleteConfirm] = useState<Store | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [authCheckResults, setAuthCheckResults] = useState<any[]>([]);
  const [authCheckSummary, setAuthCheckSummary] = useState<{ total: number; ok: number; warn: number; error: number; no_auth: number; id_mismatch_only: number; email_mismatch_only: number } | null>(null);
  const [authCheckLoading, setAuthCheckLoading] = useState(false);
  const [repairingEmail, setRepairingEmail] = useState<string | null>(null);
  const [repairLogs, setRepairLogs] = useState<{ level: string; message: string; time: string }[]>([]);
  const [repairStoreName, setRepairStoreName] = useState<string>("");
  const [emailFixForm, setEmailFixForm] = useState({ store_name: "", new_email: "" });
  const [emailFixLoading, setEmailFixLoading] = useState(false);
  const [brevoCheckEmail, setBrevoCheckEmail] = useState("");
  const [brevoCheckResult, setBrevoCheckResult] = useState<any>(null);
  const [brevoCheckLoading, setBrevoCheckLoading] = useState(false);
  const [directPwForm, setDirectPwForm] = useState({ store_name: "", new_password: "" });
  const [directPwLoading, setDirectPwLoading] = useState(false);

  const handleDeleteStore = async (store: Store) => {
    setDeleteLoading(true);
    const res = await fetch("/api/admin/stores", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: store.id }),
    });
    if (res.ok) {
      setDeleteConfirm(null);
      await fetchStores();
    } else {
      alert("❌ 削除に失敗しました");
    }
    setDeleteLoading(false);
  };

  const handleBrevoCheck = async () => {
    if (!brevoCheckEmail) { alert("メールアドレスを入力してください"); return; }
    setBrevoCheckLoading(true);
    setBrevoCheckResult(null);
    const res = await fetch(`/api/admin/brevo-check?email=${encodeURIComponent(brevoCheckEmail)}`);
    const data = await res.json();
    setBrevoCheckResult(data);
    setBrevoCheckLoading(false);
  };

  const handleDirectPw = async () => {
    const { store_name, new_password } = directPwForm;
    if (!store_name || !new_password) { alert("店舗名とパスワードを入力してください"); return; }
    if (new_password.length < 8) { alert("パスワードは8文字以上で入力してください"); return; }
    if (!window.confirm(`【確認】\n\n店舗名: ${store_name}\n\nSupabase Auth のパスワードを直接設定します。\n設定後すぐにマイページにログインできます（メール不要）。\n\nよろしいですか？`)) return;
    setDirectPwLoading(true);
    setRepairLogs([]);
    setRepairStoreName("");
    try {
      const res = await fetch("/api/admin/repair-auth", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_name, new_password }),
      });
      const data = await res.json().catch(() => ({ success: false, logs: [{ level: "error", message: `サーバーエラー HTTP ${res.status} — JSONなし`, time: new Date().toISOString().slice(11,19) }] }));
      setRepairLogs(data.logs || [{ level: "error", message: `HTTP ${res.status}`, time: new Date().toISOString().slice(11,19) }]);
      setRepairStoreName(data.store_name || store_name);
      if (data.success) {
        setDirectPwForm({ store_name: "", new_password: "" });
        await handleCheckAuthSync();
      }
    } catch (err: any) {
      setRepairLogs([{ level: "error", message: `通信エラー: ${err?.message ?? "不明"}`, time: new Date().toISOString().slice(11,19) }]);
      setRepairStoreName(store_name);
    } finally {
      setDirectPwLoading(false);
    }
  };

  const handleEmailFix = async () => {
    const { store_name, new_email } = emailFixForm;
    if (!store_name || !new_email) { alert("店舗名と新しいメールアドレスを入力してください"); return; }
    if (!window.confirm(`【確認】\n\n店舗名: ${store_name}\n新メール: ${new_email}\n\nstores.email と Supabase Auth email を更新し、\nパスワード再設定メールを送信します。\n\nよろしいですか？`)) return;
    setEmailFixLoading(true);
    setRepairLogs([]);
    setRepairStoreName("");
    try {
      const res = await fetch("/api/admin/repair-auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_name, new_email }),
      });
      const data = await res.json().catch(() => ({ success: false, logs: [{ level: "error", message: `サーバーエラー HTTP ${res.status} — JSONなし`, time: new Date().toISOString().slice(11,19) }] }));
      setRepairLogs(data.logs || [{ level: "error", message: `HTTP ${res.status}`, time: new Date().toISOString().slice(11,19) }]);
      setRepairStoreName(data.store_name || store_name);
      if (data.success) {
        setEmailFixForm({ store_name: "", new_email: "" });
        await handleCheckAuthSync();
      }
    } catch (err: any) {
      setRepairLogs([{ level: "error", message: `通信エラー: ${err?.message ?? "不明"}`, time: new Date().toISOString().slice(11,19) }]);
      setRepairStoreName(store_name);
    } finally {
      setEmailFixLoading(false);
    }
  };

  const handleRepairAuth = async (storeEmail: string) => {
    if (!window.confirm(`【確認】\n\n${storeEmail}\n\nこの店舗のSupabase Authユーザーを作成し、パスワード再設定メールを送信します。\n\nよろしいですか？`)) return;
    setRepairingEmail(storeEmail);
    setRepairLogs([]);
    setRepairStoreName("");
    try {
      const res = await fetch("/api/admin/repair-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storeEmail }),
      });
      const data = await res.json().catch(() => ({ success: false, logs: [{ level: "error", message: `サーバーエラー HTTP ${res.status} — JSONなし`, time: new Date().toISOString().slice(11,19) }] }));
      setRepairLogs(data.logs || [{ level: "error", message: `HTTP ${res.status}`, time: new Date().toISOString().slice(11,19) }]);
      setRepairStoreName(data.store_name || storeEmail);
      if (data.success) {
        await handleCheckAuthSync();
      }
    } catch (err: any) {
      setRepairLogs([{ level: "error", message: `通信エラー: ${err?.message ?? "不明"}`, time: new Date().toISOString().slice(11,19) }]);
      setRepairStoreName(storeEmail);
    } finally {
      setRepairingEmail(null);
    }
  };

  const handleCheckAuthSync = async () => {
    setAuthCheckLoading(true);
    setAuthCheckResults([]);
    setAuthCheckSummary(null);
    const res = await fetch("/api/admin/check-auth-sync");
    const data = await res.json();
    setAuthCheckResults(data.results || []);
    setAuthCheckSummary(data.summary || null);
    setAuthCheckLoading(false);
  };

  const handleLogin = async () => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      setAuthed(true);
      fetchStores();
    } else {
      const data = await res.json();
      setLoginError(data.error || "ログインに失敗しました");
    }
  };

  const fetchStores = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/stores");
    const data = await res.json();
    setStores(data.stores || []);
    setLoading(false);
  };

  const handleStatusChange = async (store: Store, next: string) => {
    const ok = await updateStoreStatus(store.id, next);
    if (ok) await fetchStores();
  };

  const handleEditStore = (store: Store) => { setEditStore({ ...store }); setEditMsg(""); };

  const handleGeneratePaymentLink = async (store: Store) => {
    const res = await fetch("/api/square/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: store.id, plan: store.plan }),
    });
    const data = await res.json();
    if (data.url) {
      await navigator.clipboard.writeText(data.url);
      alert(`✅ 支払いリンクをコピーしました！\n\n${data.url}\n\nオーナーに送ってください。`);
    } else {
      alert("❌ エラー: " + (data.error || "不明なエラー"));
    }
  };

  const handleSaveEdit = async () => {
    if (!editStore) return;
    setEditLoading(true);
    setEditMsg("");
    const res = await fetch("/api/admin/stores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editStore.id, name: editStore.name, type: editStore.type, owner_name: editStore.owner_name, email: editStore.email, plan: editStore.plan, status: editStore.status }),
    });
    if (res.ok) {
      setEditMsg("✅ 保存しました");
      await fetchStores();
      setTimeout(() => { setEditStore(null); setEditMsg(""); }, 800);
    } else {
      setEditMsg("❌ 保存に失敗しました");
    }
    setEditLoading(false);
  };

  const handleAddStore = async () => {
    if (!newStore.name || !newStore.email || !newStore.place_id) { setAddMsg("店舗名・メール・口コミURLは必須です"); return; }
    setAddLoading(true);
    setAddMsg("");
    const res = await fetch("/api/admin/stores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newStore) });
    const data = await res.json();
    if (data.error) {
      setAddMsg("エラー: " + data.error);
    } else {
      setAddMsg("✅ 店舗を追加しました！ID: " + data.store.id);
      setNewStore({ name: "", type: "飲食店", owner_name: "", email: "", password: "", plan: "standard", place_id: "" });
      await fetchStores();
    }
    setAddLoading(false);
  };

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
    if (questionsToSave.length === 0) {
      const defaults = getDefaultQuestionsForType(selectedStore.type);
      questionsToSave = defaults.map((q, i) => ({ id: i, store_id: selectedStore.id, order_num: i + 1, label: q.label, type: q.type, options: q.options }));
      setQuestions(questionsToSave);
    }
    await fetch("/api/admin/questions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store_id: selectedStore.id, questions: questionsToSave }) });
    await fetchStores();
    alert("✅ 質問を保存しました！");
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => { const next = [...questions]; if (next[qIdx].options) { next[qIdx].options![oIdx] = value; setQuestions(next); } };
  const updateLabel = (qIdx: number, value: string) => { const next = [...questions]; next[qIdx].label = value; setQuestions(next); };
  const addOption = (qIdx: number) => { const next = [...questions]; if (next[qIdx].options) { next[qIdx].options!.push("新しい選択肢"); setQuestions(next); } };
  const removeOption = (qIdx: number, oIdx: number) => { const next = [...questions]; if (next[qIdx].options && next[qIdx].options!.length > 2) { next[qIdx].options!.splice(oIdx, 1); setQuestions(next); } };

  const totalRevenue = stores.filter(s => s.status === "契約中").reduce((sum, s) => {
    const prices: Record<string, number> = { light: 4980, standard: 9800, premium: 19800 };
    return sum + (prices[s.plan] || 0);
  }, 0);

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
              <input value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>パスワード</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", boxSizing: "border-box", outline: "none" }} />
            </div>
            {loginError && <p style={{ color: "#E53E3E", fontSize: "13px", textAlign: "center", marginBottom: "16px" }}>{loginError}</p>}
            <button onClick={handleLogin} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#2C7A4B,#3DA66A)", color: "#fff", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>ログイン</button>
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
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "18px", fontWeight: "800", color: "#fff" }}>REVIEW PRO 管理画面</div>
          <button onClick={() => setAuthed(false)} style={{ background: "none", border: "1px solid #2a3f5a", color: "#7a9ab5", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>ログアウト</button>
        </div>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 20px" }}>
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
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {[
              { key: "stores", label: "🏪 店舗一覧" },
              { key: "add", label: "➕ 店舗追加" },
              { key: "cancels", label: "🚪 解約申請" },
              { key: "logs", label: "📋 監査ログ" },
              { key: "auth-check", label: "🔍 Auth診断" },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: activeTab === t.key ? "#2C7A4B" : "#fff", color: activeTab === t.key ? "#fff" : "#555", fontFamily: "inherit", fontSize: "14px", fontWeight: "600", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "stores" && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", color: "#1a2533" }}>契約店舗一覧</h2>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="店舗名・メール・IDで検索"
                    style={{ padding: "6px 12px", borderRadius: "8px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "12px", outline: "none", width: "200px" }} />
                  <button onClick={fetchStores} style={{ background: "#F4F6F9", border: "none", color: "#555", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>🔄 更新</button>
                </div>
              </div>
              {loading ? <p style={{ color: "#888" }}>読み込み中...</p> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #F0F0F0" }}>
                        {["店舗名", "店舗ID", "業種", "プラン", "契約状態", "QR", "操作"].map(h => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#888", fontWeight: "600", fontSize: "12px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStores.map(s => {
                        const sc = STATUS_COLORS[s.status] || STATUS_COLORS["停止中"];
                        return (
                          <tr key={s.id} style={{ borderBottom: "1px solid #F8F8F8" }}>
                            <td style={{ padding: "14px 12px", fontWeight: "600", color: "#1a2533" }}>
                              <div>{s.name}</div>
                              <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>{APP_URL}/review/{s.id}</div>
                            </td>
                            <td style={{ padding: "14px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "11px", color: "#888", fontFamily: "monospace", background: "#F4F6F9", padding: "2px 6px", borderRadius: "4px" }}>{s.id}</span>
                                <button onClick={() => navigator.clipboard.writeText(s.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#aaa", padding: "0" }} title="IDをコピー">📋</button>
                              </div>
                            </td>
                            <td style={{ padding: "14px 12px", color: "#888" }}>{s.type}</td>
                            <td style={{ padding: "14px 12px" }}>
                              <span style={{ background: "#F0FAF4", color: "#2C7A4B", borderRadius: "6px", padding: "2px 8px", fontSize: "12px", fontWeight: "600" }}>{PLAN_LABELS[s.plan] || s.plan}</span>
                            </td>
                            <td style={{ padding: "14px 12px" }}>
                              <select value={s.status} onChange={e => handleStatusChange(s, e.target.value)}
                                style={{ background: sc.bg, color: sc.color, border: "none", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
                                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: "14px 12px" }}>
                              <button onClick={() => setQrStore(s)} style={{ background: "#F0FAF4", border: "none", color: "#2C7A4B", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>QR</button>
                            </td>
                            <td style={{ padding: "14px 12px" }}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button onClick={() => handleEditStore(s)} style={{ background: "#F4F6F9", border: "none", color: "#555", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>編集</button>
                                <button onClick={() => handleEditQuestions(s)} style={{ background: "#EFF6FF", border: "none", color: "#2563EB", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>質問</button>
                                <button onClick={() => handleGeneratePaymentLink(s)} style={{ background: "#F0F9FF", border: "none", color: "#0369A1", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>💳 支払い</button>
                                <button onClick={() => handleOpenFeedback(s)} style={{ background: "#FFF5F5", border: "none", color: "#991B1B", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>⭐ FB</button>
                                <button onClick={() => setDeleteConfirm(s)} style={{ background: "#FEF2F2", border: "none", color: "#991B1B", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>🗑️ 削除</button>
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
                    <input value={(newStore as any)[field.key]} onChange={e => setNewStore({ ...newStore, [field.key]: e.target.value })} placeholder={field.placeholder}
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
                    <option value="light">ライト ¥4,980/月（月契約）/ ¥3,980/月（年契約）</option>
                    <option value="standard">スタンダード ¥9,800/月（月契約）/ ¥7,980/月（年契約）</option>
                    <option value="premium">プレミアム ¥19,800/月（月契約）/ ¥15,800/月（年契約）</option>
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

          {activeTab === "cancels" && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", color: "#1a2533" }}>解約申請一覧</h2>
                <button onClick={fetchCancelRequests} style={{ background: "#F4F6F9", border: "none", color: "#555", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>🔄 更新</button>
              </div>
              {cancelRequests.length === 0 ? (
                <p style={{ color: "#aaa", textAlign: "center", padding: "32px" }}>解約申請はありません</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {cancelRequests.map((r: any) => (
                    <div key={r.id} style={{ padding: "16px", background: "#F4F6F9", borderRadius: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontWeight: "600", fontSize: "13px" }}>{r.store_id}</span>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: r.status === "pending" ? "#FFFBEB" : "#ECFDF5", color: r.status === "pending" ? "#92400E" : "#065F46", fontWeight: "600" }}>
                          {r.status === "pending" ? "対応待ち" : "対応済"}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#888" }}>申請日：{new Date(r.requested_at).toLocaleDateString("ja-JP")}</div>
                      <div style={{ fontSize: "12px", color: "#888" }}>解約予定日：{r.effective_date}</div>
                      {r.reason && <div style={{ fontSize: "12px", color: "#555", marginTop: "8px" }}>理由：{r.reason}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "logs" && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", color: "#1a2533" }}>監査ログ</h2>
                <button onClick={fetchAuditLogs} style={{ background: "#F4F6F9", border: "none", color: "#555", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>🔄 更新</button>
              </div>
              {auditLogs.length === 0 ? (
                <p style={{ color: "#aaa", textAlign: "center", padding: "32px" }}>ログがありません</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {auditLogs.map((log: any) => (
                    <div key={log.id} style={{ padding: "12px 16px", background: "#F4F6F9", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontWeight: "600", fontSize: "12px", color: "#1a2533" }}>{log.action}</span>
                        <span style={{ fontSize: "11px", color: "#888", marginLeft: "8px" }}>{log.store_id}</span>
                        {log.actor && <span style={{ fontSize: "11px", color: "#aaa", marginLeft: "8px" }}>by {log.actor}</span>}
                      </div>
                      <div style={{ fontSize: "11px", color: "#aaa" }}>{new Date(log.created_at).toLocaleString("ja-JP")}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "auth-check" && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: "16px", color: "#1a2533" }}>Auth整合性チェック</h2>
                  <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>読み取り専用 — データは一切変更しません</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleCheckAuthSync}
                    disabled={authCheckLoading}
                    style={{ background: "#2C7A4B", border: "none", color: "#fff", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: authCheckLoading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: authCheckLoading ? 0.7 : 1 }}
                  >
                    {authCheckLoading ? "診断中..." : "🔍 全店舗を診断する"}
                  </button>
                  {authCheckResults.length > 0 && (
                    <a
                      href="/api/admin/check-auth-sync?format=csv"
                      download
                      style={{ background: "#1a2533", color: "#fff", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", textDecoration: "none", display: "flex", alignItems: "center" }}
                    >
                      📥 CSVダウンロード
                    </a>
                  )}
                </div>
              </div>

              {/* Brevo 送信診断 */}
              <div style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: "12px", padding: "16px 20px", marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#C2410C", marginBottom: "10px" }}>📊 Brevo 送信ログ確認</div>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                  <div style={{ flex: "1" }}>
                    <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px", fontWeight: "600" }}>確認するメールアドレス</div>
                    <input
                      value={brevoCheckEmail}
                      onChange={e => setBrevoCheckEmail(e.target.value)}
                      placeholder="例: yck.kioka@gmail.com"
                      type="email"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #FED7AA", fontFamily: "inherit", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <button onClick={handleBrevoCheck} disabled={brevoCheckLoading}
                    style={{ background: "#C2410C", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: brevoCheckLoading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: brevoCheckLoading ? 0.7 : 1, whiteSpace: "nowrap" }}>
                    {brevoCheckLoading ? "確認中..." : "🔎 Brevo確認"}
                  </button>
                </div>
                {brevoCheckResult && (
                  <div style={{ marginTop: "12px", fontSize: "12px" }}>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "8px" }}>
                      <span style={{ color: "#555" }}>送信元: <strong>{brevoCheckResult.from_email}</strong></span>
                      <span style={{ color: "#555" }}>件名: <strong>{brevoCheckResult.subject}</strong></span>
                      <span style={{ color: "#555" }}>送信ログ件数: <strong>{brevoCheckResult.smtp_events_count ?? 0}件</strong></span>
                      {brevoCheckResult.contact_email_blacklisted === true && (
                        <span style={{ color: "#DC2626", fontWeight: "700" }}>❌ Suppression登録済み</span>
                      )}
                      {brevoCheckResult.contact_email_blacklisted === false && (
                        <span style={{ color: "#16a34a" }}>✓ Suppressionなし</span>
                      )}
                    </div>
                    {brevoCheckResult.latest_event && (
                      <div style={{ background: "#FEF3C7", borderRadius: "6px", padding: "8px 10px", marginBottom: "8px" }}>
                        最新イベント: <strong>{brevoCheckResult.latest_event.event}</strong> — {brevoCheckResult.latest_event.date}
                        {brevoCheckResult.latest_event.reason && <span style={{ color: "#DC2626" }}> ({brevoCheckResult.latest_event.reason})</span>}
                      </div>
                    )}
                    {(brevoCheckResult.analysis ?? []).map((a: string, i: number) => (
                      <div key={i} style={{ color: a.startsWith("❌") ? "#DC2626" : a.startsWith("⚠️") ? "#B45309" : "#16a34a", marginBottom: "3px" }}>{a}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* 手動パスワード設定（メール不要） */}
              <div style={{ background: "#FFF1F2", border: "1.5px solid #FECDD3", borderRadius: "12px", padding: "16px 20px", marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#BE123C", marginBottom: "4px" }}>🔑 手動パスワード設定（メール不要・即時ログイン可）</div>
                <div style={{ fontSize: "11px", color: "#888", marginBottom: "10px" }}>メールが届かない場合の一時対応。パスワードを直接設定してすぐにログインできます。</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div style={{ flex: "1", minWidth: "140px" }}>
                    <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px", fontWeight: "600" }}>店舗名</div>
                    <input value={directPwForm.store_name} onChange={e => setDirectPwForm(f => ({ ...f, store_name: e.target.value }))}
                      placeholder="例: PlusBelle"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #FECDD3", fontFamily: "inherit", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: "2", minWidth: "180px" }}>
                    <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px", fontWeight: "600" }}>新しいパスワード（8文字以上）</div>
                    <input value={directPwForm.new_password} onChange={e => setDirectPwForm(f => ({ ...f, new_password: e.target.value }))}
                      placeholder="8文字以上" type="password"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #FECDD3", fontFamily: "inherit", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <button onClick={handleDirectPw} disabled={directPwLoading}
                    style={{ background: "#BE123C", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: directPwLoading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: directPwLoading ? 0.7 : 1, whiteSpace: "nowrap" }}>
                    {directPwLoading ? "設定中..." : "🔑 パスワード設定"}
                  </button>
                </div>
              </div>

              {/* メールアドレス変更 + Auth同期フォーム */}
              <div style={{ background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0369A1", marginBottom: "10px" }}>📧 メールアドレス変更 + Auth同期 + 再設定メール送信</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div style={{ flex: "1", minWidth: "150px" }}>
                    <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px", fontWeight: "600" }}>店舗名</div>
                    <input
                      value={emailFixForm.store_name}
                      onChange={e => setEmailFixForm(f => ({ ...f, store_name: e.target.value }))}
                      placeholder="例: PlusBelle"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #BAE6FD", fontFamily: "inherit", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ flex: "2", minWidth: "200px" }}>
                    <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px", fontWeight: "600" }}>新しいメールアドレス</div>
                    <input
                      value={emailFixForm.new_email}
                      onChange={e => setEmailFixForm(f => ({ ...f, new_email: e.target.value }))}
                      placeholder="例: owner@example.com"
                      type="email"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #BAE6FD", fontFamily: "inherit", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <button
                    onClick={handleEmailFix}
                    disabled={emailFixLoading}
                    style={{ background: "#0369A1", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: emailFixLoading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: emailFixLoading ? 0.7 : 1, whiteSpace: "nowrap" }}
                  >
                    {emailFixLoading ? "処理中..." : "✉️ 更新して修復する"}
                  </button>
                </div>
              </div>

              {authCheckSummary && (
                <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                  {[
                    { label: "総店舗数", value: authCheckSummary.total, bg: "#F4F6F9", color: "#1a2533" },
                    { label: "正常", value: authCheckSummary.ok, bg: "#ECFDF5", color: "#065F46" },
                    { label: "要確認", value: authCheckSummary.warn, bg: "#FFFBEB", color: "#92400E" },
                    { label: "要修復", value: authCheckSummary.error, bg: "#FEF2F2", color: "#991B1B" },
                    { label: "Auth未登録", value: authCheckSummary.no_auth, bg: "#FEF2F2", color: "#991B1B" },
                    { label: "ID不一致", value: authCheckSummary.id_mismatch_only, bg: "#FFFBEB", color: "#92400E" },
                    { label: "email不一致", value: authCheckSummary.email_mismatch_only, bg: "#FFFBEB", color: "#92400E" },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: "10px", padding: "12px 16px", minWidth: "90px", textAlign: "center" }}>
                      <div style={{ fontSize: "22px", fontWeight: "700", color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: "11px", color: s.color, marginTop: "2px" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {authCheckResults.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #F0F0F0", background: "#F8FAFC" }}>
                        {["重要度", "店舗名", "stores.email", "stores.id", "Auth登録", "ID一致", "email一致", "修復推奨", "操作"].map(h => (
                          <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#888", fontWeight: "600", fontSize: "11px", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {authCheckResults.map((r: any, i: number) => {
                        const bg = r.severity === "error" ? "#FFF5F5" : r.severity === "warn" ? "#FFFDF0" : "#fff";
                        const badge = r.severity === "error"
                          ? { label: "要修復", bg: "#FEE2E2", color: "#991B1B" }
                          : r.severity === "warn"
                          ? { label: "要確認", bg: "#FEF9C3", color: "#854D0E" }
                          : { label: "正常", bg: "#DCFCE7", color: "#166534" };
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid #F0F0F0", background: bg }}>
                            <td style={{ padding: "8px 10px" }}>
                              <span style={{ background: badge.bg, color: badge.color, borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: "600" }}>{badge.label}</span>
                            </td>
                            <td style={{ padding: "8px 10px", fontWeight: "600", color: "#1a2533" }}>{r.store_name}</td>
                            <td style={{ padding: "8px 10px", color: "#555" }}>{r.store_email}</td>
                            <td style={{ padding: "8px 10px", color: "#888", fontFamily: "monospace", fontSize: "11px" }}>{r.store_id}</td>
                            <td style={{ padding: "8px 10px", textAlign: "center" }}>
                              <span style={{ color: r.auth_user_exists ? "#16a34a" : "#dc2626", fontSize: "16px" }}>{r.auth_user_exists ? "✓" : "✗"}</span>
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "center" }}>
                              <span style={{ color: r.id_matches_auth_uuid ? "#16a34a" : "#dc2626", fontSize: "16px" }}>{r.id_matches_auth_uuid ? "✓" : "✗"}</span>
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "center" }}>
                              <span style={{ color: r.email_matches_auth ? "#16a34a" : "#dc2626", fontSize: "16px" }}>{r.email_matches_auth ? "✓" : "✗"}</span>
                            </td>
                            <td style={{ padding: "8px 10px", color: "#555", maxWidth: "260px" }}>{r.recommendation}</td>
                            <td style={{ padding: "8px 10px" }}>
                              {r.severity !== "ok" && (
                                <button
                                  onClick={() => handleRepairAuth(r.store_email)}
                                  disabled={repairingEmail === r.store_email}
                                  style={{
                                    background: r.severity === "error" ? "#DC2626" : "#D97706",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "4px 10px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    cursor: repairingEmail === r.store_email ? "not-allowed" : "pointer",
                                    fontFamily: "inherit",
                                    whiteSpace: "nowrap",
                                    opacity: repairingEmail === r.store_email ? 0.6 : 1,
                                  }}
                                >
                                  {repairingEmail === r.store_email ? "修復中..." : r.severity === "error" ? "🔧 修復する" : "📧 メール送信"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {repairLogs.length > 0 && (
                <div style={{ marginTop: "24px", background: "#0F1923", borderRadius: "12px", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ color: "#7a9ab5", fontSize: "12px", fontWeight: "600" }}>実行ログ — {repairStoreName}</span>
                    <button
                      onClick={() => setRepairLogs([])}
                      style={{ background: "none", border: "1px solid #2a3f5a", color: "#7a9ab5", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      閉じる
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {repairLogs.map((entry, i) => {
                      const colors: Record<string, string> = {
                        ok: "#34D399",
                        info: "#93C5FD",
                        warn: "#FCD34D",
                        error: "#F87171",
                      };
                      const prefixes: Record<string, string> = {
                        ok: "✓",
                        info: "›",
                        warn: "⚠",
                        error: "✗",
                      };
                      return (
                        <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <span style={{ color: "#4a6a8a", fontSize: "11px", fontFamily: "monospace", flexShrink: 0 }}>{entry.time}</span>
                          <span style={{ color: colors[entry.level] ?? "#fff", fontSize: "11px", fontFamily: "monospace", flexShrink: 0 }}>{prefixes[entry.level] ?? "·"}</span>
                          <span style={{ color: entry.level === "ok" ? "#D1FAE5" : entry.level === "error" ? "#FEE2E2" : "#E2E8F0", fontSize: "12px", lineHeight: "1.5" }}>{entry.message}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!authCheckLoading && authCheckResults.length === 0 && (
                <p style={{ color: "#aaa", textAlign: "center", padding: "48px" }}>「全店舗を診断する」ボタンを押すと結果が表示されます</p>
              )}
            </div>
          )}

          {activeTab === "questions" && selectedStore && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", maxWidth: "600px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", color: "#1a2533" }}>質問編集：{selectedStore.name}</h2>
                <button onClick={() => setActiveTab("stores")} style={{ background: "none", border: "1px solid #E5E7EB", color: "#888", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>← 戻る</button>
              </div>
              {questions.length === 0 && (
                <p style={{ color: "#aaa", fontSize: "13px", textAlign: "center", padding: "20px" }}>
                  質問がまだ登録されていません。<br />「保存する」を押すと業種に合わせたデフォルト質問が登録されます。
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
                          <button onClick={() => addOption(qi)} style={{ padding: "7px", borderRadius: "8px", border: "1.5px dashed #E5E7EB", background: "none", color: "#888", fontFamily: "inherit", fontSize: "12px", cursor: "pointer" }}>
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

      {editStore && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", maxWidth: "480px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#1a2533" }}>店舗情報編集</h3>
              <button onClick={() => setEditStore(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#888" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[{ label: "店舗名", key: "name" }, { label: "オーナー名", key: "owner_name" }, { label: "メールアドレス", key: "email" }].map(f => (
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
                  <option value="light">ライト ¥4,980/月（月契約）/ ¥3,980/月（年契約）</option>
                  <option value="standard">スタンダード ¥9,800/月（月契約）/ ¥7,980/月（年契約）</option>
                  <option value="premium">プレミアム ¥19,800/月（月契約）/ ¥15,800/月（年契約）</option>
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

      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", maxWidth: "380px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px", color: "#1a2533" }}>店舗を削除しますか？</h3>
            <p style={{ color: "#888", fontSize: "14px", margin: "0 0 8px" }}>
              <strong style={{ color: "#1a2533" }}>{deleteConfirm.name}</strong>
            </p>
            <p style={{ color: "#DC2626", fontSize: "13px", margin: "0 0 24px" }}>
              この操作は取り消せません。店舗データと質問データがすべて削除されます。
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1.5px solid #E5E7EB", background: "#fff", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}>
                キャンセル
              </button>
              <button onClick={() => handleDeleteStore(deleteConfirm)} disabled={deleteLoading}
                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#DC2626", color: "#fff", fontFamily: "inherit", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
                {deleteLoading ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {feedbackStore && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", maxWidth: "600px", width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#1a2533" }}>⭐ 低評価FB：{feedbackStore.name}</h3>
              <button onClick={() => setFeedbackStore(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#888" }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "20px" }}>
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
            {feedbackList.filter(fb => !feedbackMonth || fb.created_at.startsWith(feedbackMonth)).length === 0 ? (
              <p style={{ color: "#aaa", textAlign: "center", padding: "32px" }}>フィードバックがありません</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {feedbackList
                  .filter(fb => !feedbackMonth || fb.created_at.startsWith(feedbackMonth))
                  .map((fb: any) => (
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
        </div>
      )}

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
            <button onClick={() => setQrStore(null)} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #E5E7EB", background: "#fff", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}>閉じる</button>
          </div>
        </div>
      )}
    </>
  );
}
