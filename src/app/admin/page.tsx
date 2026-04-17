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
  const [activeTab, setActiveTab] = useState<"stores" | "add" | "questions">("stores");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editStore, setEditStore] = useState<Store | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState("");
  const [newStore, setNewStore] = useState({ name: "", type: "飲食店", owner_name: "", email: "", password: "", plan: "standard", place_id: "" });
  const [addMsg, setAddMsg] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [qrStore, setQrStore] = useState<Store | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<Store | null>(null);
const [deleteLoading, setDeleteLoading] = useState(false);

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
    const prices: Record<string, number> = { light: 2980, standard: 5980, premium: 9800 };
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
            {[{ key: "stores", label: "🏪 店舗一覧" }, { key: "add", label: "➕ 店舗追加" }].map(t => (
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
                <button onClick={fetchStores} style={{ background: "#F4F6F9", border: "none", color: "#555", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>🔄 更新</button>
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
                      {stores.map(s => {
                        const sc = STATUS_COLORS[s.status] || STATUS_COLORS["停止中"];
                        return (
                          <tr key={s.id} style={{ borderBottom: "1px solid #F8F8F8" }}>
                            <td style={{ padding: "14px 12px", fontWeight: "600", color: "#1a2533" }}>
                              <div>{s.name}</div>
                              <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>{APP_URL}/review/{s.id}</div><div>{s.name}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                                <span style={{ fontSize: "11px", color: "#888", fontFamily: "monospace", background: "#F4F6F9", padding: "2px 6px", borderRadius: "4px" }}>{s.id}</span>
                                <button onClick={() => navigator.clipboard.writeText(s.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "#aaa", padding: "0" }} title="IDをコピー">📋</button>
                              </div>
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
                                <button onClick={() => handleEditQuestions(s)} style={{ background: "#EFF6FF", border: "none", color: "#2563EB", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>質問</button><button onClick={() => handleGeneratePaymentLink(s)} style={{ background: "#F0F9FF", border: "none", color: "#0369A1", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>💳 支払い</button>
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
