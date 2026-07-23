// レビュー生成の事実検証・決定的フォールバック。
// 目的: 回答・店舗情報にない事実（料理・同行者・価格など）が生成文に含まれていないかを
// キーワードベースで判定し、違反時はAI再生成ではなく決定的なテンプレート文へ置き換える。
// このファイルはDB・Next.jsに依存しない純粋関数のみで構成し、単体テストしやすくする。

export type StyleKey = "casual" | "honest" | "formal";

export interface FactCheckAnswers {
  rating?: number;
  highlight?: string[];
  partySize?: string;
  summary?: string;
  details?: { label: string; answer: string }[];
}

export interface FactCheckStore {
  name?: string;
  type?: string;
}

export interface PermittedCategories {
  food: boolean;
  price: boolean;
  parking: boolean;
  access: boolean;
  reservation: boolean;
  waitTime: boolean;
  service: boolean;
  partySize: boolean;
  companionWords: string[];
}

export interface ValidationResult {
  ok: boolean;
  violations: string[];
}

// 「味」単体は「趣味」「興味」等に誤爆するため使わず、複合語のみを使う。
const FOOD_WORDS = [
  "料理", "メニュー", "注文", "ランチ", "ディナー", "ドリンク", "コーヒー", "紅茶",
  "スープ", "麺", "ラーメン", "ご飯", "食事", "デザート", "ケーキ",
  "味わい", "風味", "後味", "味付け", "美味し", "おいし", "まずい", "不味い",
];

const PRICE_WORDS = ["価格", "値段", "料金", "コスパ", "円", "割引", "お得", "激安", "高額"];
const PARKING_WORDS = ["駐車場", "パーキング"];
const ACCESS_WORDS = ["駅", "徒歩", "アクセスの良さ", "アクセスが良い", "アクセス良好"];
const RESERVATION_WORDS = ["予約"];
const WAIT_WORDS = ["待ち時間", "待たされ", "待った", "行列", "並んで"];
const SERVICE_WORDS = [
  "施術", "効果", "トリートメント", "カット", "カラー", "パーマ", "マッサージ",
  "整体", "縮毛矯正", "ネイル", "脱毛", "診察", "治療", "仕上がり",
];

const COMPANION_WORDS = [
  "友人", "友達", "家族", "パートナー", "カップル", "恋人", "夫", "妻", "彼氏", "彼女", "同僚",
];

// партySizeの値そのものが持つ関係性（人数のみの回答では関係性を許可しない）
const PARTY_SIZE_RELATIONSHIP: Record<string, string[]> = {
  "家族": ["家族"],
  "カップル": ["パートナー", "カップル"],
};

// 「2人で」「一人で」等の人数表現。数字+人 or 定型句。
const PARTY_COUNT_RE = /([0-9一二三四五六七八九十]{1,2}人|ひとりで|一人で|数人で|大人数で|グループで)/;

// 地名らしきトークン（住所接尾辞つき）。店舗名に含まれない場合のみ違反とする。
const REGION_SUFFIX_RE = /[一-龥ぁ-んァ-ヶー]{1,8}(駅前|駅|市|区|町|村|県|都|府|道)/g;

function blobFromAnswers(answers?: FactCheckAnswers): string {
  const parts: string[] = [];
  if (Array.isArray(answers?.highlight)) parts.push(answers!.highlight!.join(" "));
  if (Array.isArray(answers?.details)) {
    parts.push(answers!.details!.map((d) => `${d.label} ${d.answer}`).join(" "));
  }
  if (answers?.summary) parts.push(answers.summary);
  return parts.join(" ");
}

function hasAny(blob: string, words: string[]): boolean {
  return words.some((w) => blob.includes(w));
}

export function computePermittedCategories(
  answers: FactCheckAnswers | undefined,
  _store: FactCheckStore | undefined
): PermittedCategories {
  const blob = blobFromAnswers(answers);
  const partySize = answers?.partySize || "";

  const companionFromPartySize = PARTY_SIZE_RELATIONSHIP[partySize] || [];
  const companionFromBlob = COMPANION_WORDS.filter((w) => blob.includes(w));
  const companionWords = Array.from(new Set([...companionFromPartySize, ...companionFromBlob]));

  return {
    food: hasAny(blob, FOOD_WORDS),
    price: hasAny(blob, PRICE_WORDS),
    parking: hasAny(blob, PARKING_WORDS),
    access: hasAny(blob, ACCESS_WORDS),
    reservation: hasAny(blob, RESERVATION_WORDS),
    waitTime: hasAny(blob, WAIT_WORDS),
    service: hasAny(blob, SERVICE_WORDS),
    partySize: !!partySize,
    companionWords,
  };
}

// 店舗名・業種名は「回答にない事実」ではなく既知の自己言及のため、
// カテゴリ判定前にテキストから取り除く（誤検出防止）。
function maskKnownSelfReferences(text: string, store?: FactCheckStore): string {
  let out = text;
  if (store?.name) out = out.split(store.name).join("");
  if (store?.type) out = out.split(store.type).join("");
  return out;
}

function findKeywordViolation(text: string, words: string[]): string | null {
  return words.find((w) => text.includes(w)) || null;
}

function findCompanionViolation(text: string, allowedWords: string[]): string | null {
  for (const w of COMPANION_WORDS) {
    if (text.includes(w) && !allowedWords.includes(w)) return w;
  }
  return null;
}

function findRegionViolation(text: string, store?: FactCheckStore): string | null {
  const matches = text.match(REGION_SUFFIX_RE) || [];
  for (const m of matches) {
    if (!store?.name || !store.name.includes(m)) return m;
  }
  return null;
}

export function validatePattern(
  text: string,
  permitted: PermittedCategories,
  store?: FactCheckStore
): ValidationResult {
  const violations: string[] = [];
  const masked = maskKnownSelfReferences(text, store);

  if (!permitted.food) {
    const v = findKeywordViolation(masked, FOOD_WORDS);
    if (v) violations.push(`料理・味・メニュー(${v})`);
  }
  if (!permitted.price) {
    const v = findKeywordViolation(masked, PRICE_WORDS);
    if (v) violations.push(`価格(${v})`);
  }
  if (!permitted.parking) {
    const v = findKeywordViolation(masked, PARKING_WORDS);
    if (v) violations.push(`駐車場(${v})`);
  }
  if (!permitted.access) {
    const v = findKeywordViolation(masked, ACCESS_WORDS);
    if (v) violations.push(`駅・アクセス(${v})`);
  }
  if (!permitted.reservation) {
    const v = findKeywordViolation(masked, RESERVATION_WORDS);
    if (v) violations.push(`予約(${v})`);
  }
  if (!permitted.waitTime) {
    const v = findKeywordViolation(masked, WAIT_WORDS);
    if (v) violations.push(`待ち時間(${v})`);
  }
  if (!permitted.service) {
    const v = findKeywordViolation(masked, SERVICE_WORDS);
    if (v) violations.push(`サービス・商品・施術(${v})`);
  }

  const companionViolation = findCompanionViolation(masked, permitted.companionWords);
  if (companionViolation) violations.push(`同行者・関係性(${companionViolation})`);

  if (!permitted.partySize && PARTY_COUNT_RE.test(masked)) {
    violations.push("人数");
  }

  const regionViolation = findRegionViolation(masked, store);
  if (regionViolation) violations.push(`地域名(${regionViolation})`);

  return { ok: violations.length === 0, violations };
}

// --- 決定的フォールバック（LLM不使用。回答・店舗名・評価のみで構成） ---

type RatingTier = "high" | "mid" | "low" | "none";

function ratingTier(rating?: number): RatingTier {
  const r = Number(rating) || 0;
  if (r >= 5) return "high";
  if (r === 4) return "mid";
  if (r >= 1) return "low";
  return "none";
}

const RATING_PHRASE: Record<StyleKey, Record<RatingTier, string>> = {
  casual: { high: "とても良かったです。", mid: "良かったです。", low: "普通でした。", none: "" },
  honest: { high: "非常に満足できました。", mid: "満足できました。", low: "まずまずでした。", none: "" },
  formal: { high: "大変満足いたしました。", mid: "満足いたしました。", low: "概ね満足いたしました。", none: "" },
};

const OPENER: Record<StyleKey, (storeName: string) => string> = {
  casual: (name) => `${name}に行ってきました。`,
  honest: (name) => `${name}を利用しました。`,
  formal: (name) => `${name}を利用させていただきました。`,
};

const HIGHLIGHT_CLAUSE: Record<StyleKey, (text: string) => string> = {
  casual: (t) => `${t}が良かったです。`,
  honest: (t) => `${t}が印象に残りました。`,
  formal: (t) => `${t}という点が良かったです。`,
};

const PARTY_FALLBACK_PHRASE: Record<string, Record<StyleKey, string>> = {
  "1人": { casual: "一人で利用しました。", honest: "一人で利用しました。", formal: "一人で利用いたしました。" },
  "2人": { casual: "2人で利用しました。", honest: "2人で利用しました。", formal: "2人で利用いたしました。" },
  "3〜4人": { casual: "数人で利用しました。", honest: "数人で利用しました。", formal: "数名で利用いたしました。" },
  "5人以上": { casual: "大人数で利用しました。", honest: "大人数で利用しました。", formal: "大人数で利用いたしました。" },
  "家族": { casual: "家族で利用しました。", honest: "家族で利用しました。", formal: "家族で利用いたしました。" },
  "カップル": { casual: "パートナーと利用しました。", honest: "パートナーと利用しました。", formal: "パートナーと利用いたしました。" },
};

function safeHighlightText(answers?: FactCheckAnswers): string {
  const list = Array.isArray(answers?.highlight) ? answers!.highlight!.filter(Boolean) : [];
  return list.join("、");
}

// フォールバック文（回答・店舗名・評価のみで構成。summaryは店舗が用意した定型文をそのまま使う）
export function buildSafeFallbackText(
  answers: FactCheckAnswers | undefined,
  store: FactCheckStore | undefined,
  styleKey: StyleKey
): string {
  const storeName = store?.name || "このお店";
  const tier = ratingTier(answers?.rating);
  const ratingPhrase = RATING_PHRASE[styleKey][tier];
  const highlightText = safeHighlightText(answers);
  const highlightClause = highlightText ? HIGHLIGHT_CLAUSE[styleKey](highlightText) : "";
  const partySize = answers?.partySize || "";
  const partyClause = PARTY_FALLBACK_PHRASE[partySize]?.[styleKey] || "";
  const summary = (answers?.summary || "").trim();

  const opener = OPENER[styleKey](storeName);

  // スタイルごとに要素の並び順を変え、同一入力でも同一文にならないようにする。
  const parts: Record<StyleKey, string[]> = {
    casual: [opener, ratingPhrase, highlightClause, partyClause, summary],
    honest: [opener, highlightClause, ratingPhrase, partyClause, summary],
    formal: [opener, partyClause, ratingPhrase, highlightClause, summary],
  };

  return parts[styleKey].filter(Boolean).join("");
}

// フォールバックすら不合格だった場合の最終安全文。店舗名・評価のみで構成し、
// highlight/party/summaryを含まないため最も安全（validatorに通しても事実上ヒットしない）。
export function buildUltimateSafeText(
  answers: FactCheckAnswers | undefined,
  store: FactCheckStore | undefined,
  styleKey: StyleKey
): string {
  const storeName = store?.name || "このお店";
  const tier = ratingTier(answers?.rating);
  const ratingPhrase = RATING_PHRASE[styleKey][tier] || { casual: "利用しました。", honest: "利用しました。", formal: "利用いたしました。" }[styleKey];
  return `${OPENER[styleKey](storeName)}${ratingPhrase}`;
}
