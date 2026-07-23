import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computePermittedCategories,
  validatePattern,
  buildSafeFallbackText,
  buildUltimateSafeText,
} from "./reviewFactCheck.ts";

// --- computePermittedCategories ---

test("permits food when highlight mentions it", () => {
  const permitted = computePermittedCategories(
    { highlight: ["料理・味"], partySize: "2人" },
    { name: "花月", type: "ラーメン店" }
  );
  assert.equal(permitted.food, true);
});

test("does not permit food when nothing mentions it", () => {
  const permitted = computePermittedCategories(
    { highlight: ["スタッフの接客"], partySize: "2人" },
    { name: "花月", type: "飲食店" }
  );
  assert.equal(permitted.food, false);
});

test("does not permit companion words for count-only partySize", () => {
  const permitted = computePermittedCategories({ partySize: "2人" }, {});
  assert.deepEqual(permitted.companionWords, []);
});

test("permits family words when partySize is 家族", () => {
  const permitted = computePermittedCategories({ partySize: "家族" }, {});
  assert.deepEqual(permitted.companionWords, ["家族"]);
});

test("permits partner/couple words when partySize is カップル", () => {
  const permitted = computePermittedCategories({ partySize: "カップル" }, {});
  assert.deepEqual(permitted.companionWords.sort(), ["カップル", "パートナー"].sort());
});

test("partySize category requires any non-empty answer", () => {
  assert.equal(computePermittedCategories({ partySize: "" }, {}).partySize, false);
  assert.equal(computePermittedCategories({ partySize: "1人" }, {}).partySize, true);
});

test("companion words found in custom detail answers are permitted", () => {
  const permitted = computePermittedCategories(
    { partySize: "2人", details: [{ label: "誰と来店？", answer: "同僚と一緒に" }] },
    {}
  );
  assert.ok(permitted.companionWords.includes("同僚"));
});

// --- validatePattern: violations ---

test("flags fabricated food mention when not permitted", () => {
  const permitted = computePermittedCategories({ highlight: ["スタッフの接客"] }, {});
  const result = validatePattern("料理がとても美味しかったです。", permitted, { name: "花月", type: "飲食店" });
  assert.equal(result.ok, false);
  assert.ok(result.violations.some((v) => v.includes("料理")));
});

test("flags fabricated companion when partySize is count-only", () => {
  const permitted = computePermittedCategories({ partySize: "2人" }, {});
  const result = validatePattern("友人と楽しい時間を過ごせました。", permitted, {});
  assert.equal(result.ok, false);
  assert.ok(result.violations.some((v) => v.includes("同行者")));
});

test("flags fabricated party count when partySize unanswered", () => {
  const permitted = computePermittedCategories({ partySize: "" }, {});
  const result = validatePattern("2人で伺いました。", permitted, {});
  assert.equal(result.ok, false);
  assert.ok(result.violations.some((v) => v === "人数"));
});

test("flags fabricated price mention when not permitted", () => {
  const permitted = computePermittedCategories({ highlight: ["雰囲気"] }, {});
  const result = validatePattern("価格がとても安くて驚きました。", permitted, {});
  assert.equal(result.ok, false);
});

test("flags fabricated parking mention", () => {
  const permitted = computePermittedCategories({ highlight: ["雰囲気"] }, {});
  const result = validatePattern("駐車場が広くて停めやすかったです。", permitted, {});
  assert.equal(result.ok, false);
});

test("flags fabricated region mention not in store name", () => {
  const permitted = computePermittedCategories({ highlight: ["雰囲気"] }, {});
  const result = validatePattern("渋谷駅から近くて便利でした。", permitted, { name: "花月", type: "飲食店" });
  assert.equal(result.ok, false);
  assert.ok(result.violations.some((v) => v.includes("地域名") || v.includes("アクセス")));
});

// --- validatePattern: no false positives ---

test("does not flag business type self-reference", () => {
  const permitted = computePermittedCategories({ highlight: ["雰囲気"] }, {});
  const result = validatePattern("初めてこのラーメン店に伺いました。雰囲気が良かったです。", permitted, {
    name: "花月",
    type: "ラーメン店",
  });
  assert.equal(result.ok, true);
});

test("does not flag store name containing region-like or food-like substrings", () => {
  const permitted = computePermittedCategories({ highlight: ["雰囲気"] }, {});
  const result = validatePattern("新宿らーめん花月に伺いました。雰囲気が良かったです。", permitted, {
    name: "新宿らーめん花月",
    type: "ラーメン店",
  });
  assert.equal(result.ok, true);
});

test("does not flag unrelated words containing 味 substring (趣味/興味)", () => {
  const permitted = computePermittedCategories({ highlight: ["雰囲気"] }, {});
  const result = validatePattern("スタッフの方が趣味の話にも興味を持ってくれました。", permitted, {});
  assert.equal(result.ok, true);
});

test("does not flag region when it matches the store name", () => {
  const permitted = computePermittedCategories({ highlight: ["雰囲気"] }, {});
  const result = validatePattern("新宿区にあるこのお店は雰囲気が良かったです。", permitted, {
    name: "新宿区のカフェ",
    type: "カフェ・喫茶店",
  });
  assert.equal(result.ok, true);
});

test("permitted categories pass through without violation", () => {
  const permitted = computePermittedCategories(
    { highlight: ["料理・味", "価格・コスパ"], partySize: "家族", details: [{ label: "メニュー", answer: "ランチ" }] },
    {}
  );
  const result = validatePattern(
    "料理の味がとても良く、価格も手頃でした。家族で利用しました。",
    permitted,
    { name: "花月", type: "飲食店" }
  );
  assert.equal(result.ok, true);
});

// --- buildSafeFallbackText ---

test("fallback omits summary clause when summary is empty", () => {
  const text = buildSafeFallbackText({ rating: 5, highlight: ["接客"], partySize: "2人", summary: "" }, { name: "花月" }, "casual");
  assert.ok(!text.includes("また"));
});

test("fallback includes summary verbatim when present", () => {
  const text = buildSafeFallbackText(
    { rating: 5, highlight: ["接客"], partySize: "2人", summary: "コスパ最高！" },
    { name: "花月" },
    "casual"
  );
  assert.ok(text.includes("コスパ最高！"));
});

test("fallback omits party clause when partySize unanswered", () => {
  const text = buildSafeFallbackText({ rating: 4, highlight: ["接客"], partySize: "", summary: "" }, { name: "花月" }, "honest");
  assert.ok(!text.includes("人で"));
  assert.ok(!text.includes("パートナー"));
});

test("fallback never invents companion words beyond partySize/answers", () => {
  const text = buildSafeFallbackText({ rating: 5, highlight: ["接客"], partySize: "2人", summary: "" }, { name: "花月" }, "formal");
  assert.ok(!text.includes("友人"));
  assert.ok(!text.includes("家族"));
});

test("fallback text passes its own validator", () => {
  const answers = { rating: 4, highlight: ["接客"], partySize: "2人", summary: "また来たい！" };
  const store = { name: "花月", type: "飲食店" };
  const permitted = computePermittedCategories(answers, store);
  for (const styleKey of ["casual", "honest", "formal"] as const) {
    const text = buildSafeFallbackText(answers, store, styleKey);
    const result = validatePattern(text, permitted, store);
    assert.equal(result.ok, true, `${styleKey} fallback should pass: ${text} (violations: ${result.violations.join(",")})`);
  }
});

test("fallback text passes validator when only rating is answered (worst case)", () => {
  const answers = { rating: 4, highlight: [], partySize: "", summary: "" };
  const store = { name: "花月", type: "飲食店" };
  const permitted = computePermittedCategories(answers, store);
  for (const styleKey of ["casual", "honest", "formal"] as const) {
    const text = buildSafeFallbackText(answers, store, styleKey);
    const result = validatePattern(text, permitted, store);
    assert.equal(result.ok, true, `${styleKey}: ${text}`);
  }
});

test("3 fallback style variants are not identical for the same input", () => {
  const answers = { rating: 5, highlight: ["接客", "雰囲気"], partySize: "家族", summary: "また来たい！" };
  const store = { name: "花月", type: "飲食店" };
  const casual = buildSafeFallbackText(answers, store, "casual");
  const honest = buildSafeFallbackText(answers, store, "honest");
  const formal = buildSafeFallbackText(answers, store, "formal");
  assert.notEqual(casual, honest);
  assert.notEqual(honest, formal);
  assert.notEqual(casual, formal);
});

test("3 fallback style variants are not identical even with minimal input", () => {
  const answers = { rating: 3, highlight: [], partySize: "", summary: "" };
  const store = { name: "サービスX" };
  const casual = buildSafeFallbackText(answers, store, "casual");
  const honest = buildSafeFallbackText(answers, store, "honest");
  const formal = buildSafeFallbackText(answers, store, "formal");
  assert.notEqual(casual, honest);
  assert.notEqual(honest, formal);
  assert.notEqual(casual, formal);
});

// --- buildUltimateSafeText ---

test("ultimate safe text passes validator even with rich answers", () => {
  const answers = { rating: 5, highlight: ["料理・味", "価格・コスパ"], partySize: "カップル", summary: "また来たい！" };
  const store = { name: "花月", type: "飲食店" };
  const permitted = computePermittedCategories(answers, store);
  for (const styleKey of ["casual", "honest", "formal"] as const) {
    const text = buildUltimateSafeText(answers, store, styleKey);
    const result = validatePattern(text, permitted, store);
    assert.equal(result.ok, true, `${styleKey}: ${text}`);
  }
});

test("ultimate safe text is short and contains no highlight/party/summary content", () => {
  const answers = { rating: 5, highlight: ["料理・味"], partySize: "家族", summary: "また来たい！" };
  const store = { name: "花月" };
  const text = buildUltimateSafeText(answers, store, "casual");
  assert.ok(!text.includes("また来たい"));
  assert.ok(!text.includes("家族"));
  assert.ok(text.length < 40);
});

test("ultimate safe text variants differ across styles", () => {
  const answers = { rating: 4 };
  const store = { name: "花月" };
  const casual = buildUltimateSafeText(answers, store, "casual");
  const honest = buildUltimateSafeText(answers, store, "honest");
  const formal = buildUltimateSafeText(answers, store, "formal");
  assert.notEqual(casual, honest);
  assert.notEqual(honest, formal);
});
