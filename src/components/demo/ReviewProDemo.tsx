"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getDefaultQuestionsForType } from "@/lib/defaultQuestions";
import { JA_ISSUES, getT } from "@/lib/i18n";

type Question = {
  id: number;
  order_num: number;
  label: string;
  type: string;
  options: string[] | null;
};

type StyleKey = "casual" | "honest" | "formal";

type DemoState = {
  answers: Record<number, string | string[] | number>;
  gender: string;
  age: string;
  rating: number;
  reviews: Record<StyleKey, string>;
  selectedStyle: StyleKey;
  copied: boolean;
  lowReviewIssues: string[];
  lowReviewComment: string;
  feedbackSubmittedAt: string;
};

const STORAGE_KEY = "review-pro-public-demo:v1";
const STORE = {
  name: "REVIEW PRO デモサロン",
  type: "美容脱毛",
};
const STYLE_KEYS: StyleKey[] = ["casual", "honest", "formal"];
const T = getT("ja");
const LOW_REVIEW_PRO_ACTIVE = true;

const demoQuestions: Question[] = getDefaultQuestionsForType(STORE.type).map((q, index) => ({
  id: index + 1,
  order_num: index + 1,
  label: q.label,
  type: q.type,
  options: q.options,
}));

const baseQuestions = demoQuestions.filter(
  (q) => !q.label.includes("性別") && !q.label.includes("年代"),
);
const totalPages = baseQuestions.length + 1;

const initialState: DemoState = {
  answers: {},
  gender: "",
  age: "",
  rating: 0,
  reviews: { casual: "", honest: "", formal: "" },
  selectedStyle: "casual",
  copied: false,
  lowReviewIssues: [],
  lowReviewComment: "",
  feedbackSubmittedAt: "",
};

export function DemoTopPage() {
  const { resetDemo } = useDemoState();

  return (
    <DemoShell>
      <section style={welcomeCardStyle}>
        <div style={welcomeHeaderStyle}>
          <div>
            <div style={{ fontSize: "11px", color: "#aaa", letterSpacing: "0.08em", marginBottom: "4px" }}>
              口コミ投稿フォーム
            </div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#1a2533" }}>{STORE.name}</div>
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "10px 0 8px" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "10px" }}>
            <span style={pillStyle}>PREMIUM</span>
            <span style={pillStyle}>インバウンド対応</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginTop: "16px" }}>
            {["日本語", "English", "中文", "한국어"].map((language) => (
              <button key={language} type="button" style={languageButtonStyle}>{language}</button>
            ))}
          </div>
          <div style={{ fontSize: "46px", marginTop: "18px" }}>🙏</div>
          <h1 style={welcomeTitleStyle}>ご来店ありがとう<br />ございました！</h1>
        </div>
        <div style={welcomeMessageStyle}>
          <span>6つの質問に答えるだけで</span>
          <span>AIが口コミ文を自動で作ります</span>
        </div>
        <div style={{ display: "grid", gap: "10px" }}>
          {T.welcome.features.map((text) => (
            <div key={text} style={featureRowStyle}>{text}</div>
          ))}
        </div>
        <Link href="/demo/review" style={{ ...primaryButtonStyle, marginTop: "22px" }}>
          はじめる →
        </Link>
        <button type="button" onClick={resetDemo} style={subtleResetStyle}>
          最初からやり直す
        </button>
        <PoweredBy />
      </section>
    </DemoShell>
  );
}

export function DemoReviewPage() {
  const router = useRouter();
  const { state, setState, resetDemo, hydrated } = useDemoState();
  const [currentQ, setCurrentQ] = useState(0);

  const isGenderAgePage = currentQ === baseQuestions.length;
  const currentQuestion = isGenderAgePage ? undefined : baseQuestions[currentQ];
  const progress = (currentQ / totalPages) * 100;

  const updateAnswer = (questionId: number, value: string | string[] | number) => {
    setState((current) => {
      const rating = questionId === 1 && typeof value === "number" ? value : current.rating;
      return {
        ...current,
        answers: { ...current.answers, [questionId]: value },
        rating,
        copied: false,
        reviews: { casual: "", honest: "", formal: "" },
      };
    });
  };

  const canNext = () => {
    if (isGenderAgePage) return state.gender !== "" && state.age !== "";
    if (!currentQuestion) return true;
    const ans = state.answers[currentQuestion.id];
    if (currentQuestion.type === "stars") return Number(ans || 0) > 0;
    if (currentQuestion.type === "multi") return Array.isArray(ans) && ans.length > 0;
    if (currentQuestion.type === "select") return typeof ans === "string" && ans.length > 0;
    return true;
  };

  const handleNext = () => {
    if (!currentQuestion && !isGenderAgePage) return;
    if (!isGenderAgePage && currentQuestion?.type === "stars") {
      const rating = Number(state.answers[currentQuestion.id] || 0);
      if (rating <= 2 && LOW_REVIEW_PRO_ACTIVE) {
        router.push("/demo/feedback");
        return;
      }
    }
    if (isGenderAgePage) {
      const built = buildReviews(buildAnswersForGenerate(state));
      setState((current) => ({ ...current, reviews: built, selectedStyle: "casual", copied: false }));
      router.push("/demo/generate");
      return;
    }
    setCurrentQ((value) => value + 1);
  };

  const handleBack = () => {
    if (currentQ > 0) setCurrentQ((value) => value - 1);
    else router.push("/demo");
  };

  if (!hydrated) return <DemoShell><LoadingCard /></DemoShell>;

  return (
    <DemoShell>
      <section style={phoneCardStyle}>
        <DemoHeader progress={progress} />
        <div style={{ padding: "28px 20px 32px", minHeight: "640px", display: "flex", flexDirection: "column" }}>
          {!isGenderAgePage && currentQuestion && (
            <div style={{ animation: "fadeUp 0.35s ease", flex: 1 }}>
              <button type="button" onClick={handleBack} style={backButtonStyle}>
                {T.questions.back}
              </button>
              <p style={questionCountStyle}>Q{currentQ + 1} / {totalPages}</p>
              <h1 style={questionTitleStyle}>{currentQuestion.label}</h1>
              {currentQuestion.type === "stars" && (
                <StarRating
                  value={Number(state.answers[currentQuestion.id] || 0)}
                  onChange={(value) => updateAnswer(currentQuestion.id, value)}
                />
              )}
              {currentQuestion.type === "multi" && currentQuestion.options && (
                <MultiSelectQuestion
                  question={currentQuestion}
                  selected={Array.isArray(state.answers[currentQuestion.id]) ? state.answers[currentQuestion.id] as string[] : []}
                  onChange={(next) => updateAnswer(currentQuestion.id, next)}
                />
              )}
              {currentQuestion.type === "select" && currentQuestion.options && (
                <SelectQuestion
                  options={currentQuestion.options}
                  value={typeof state.answers[currentQuestion.id] === "string" ? String(state.answers[currentQuestion.id]) : ""}
                  onChange={(next) => updateAnswer(currentQuestion.id, next)}
                />
              )}
            </div>
          )}

          {isGenderAgePage && (
            <div style={{ animation: "fadeUp 0.35s ease", flex: 1 }}>
              <button type="button" onClick={handleBack} style={backButtonStyle}>
                {T.questions.back}
              </button>
              <p style={questionCountStyle}>Q{totalPages} / {totalPages}</p>
              <h1 style={questionTitleStyle}>あなたについて教えてください</h1>
              <div style={{ marginBottom: "28px" }}>
                <p style={sectionLabelStyle}>性別</p>
                <SelectQuestion
                  columns={3}
                  options={["男性", "女性", "回答しない"]}
                  value={state.gender}
                  onChange={(gender) => setState((current) => ({ ...current, gender }))}
                />
              </div>
              <div>
                <p style={sectionLabelStyle}>年代</p>
                <SelectQuestion
                  options={["10代", "20代", "30代", "40代", "50代以上"]}
                  value={state.age}
                  onChange={(age) => setState((current) => ({ ...current, age }))}
                />
              </div>
            </div>
          )}

          <button type="button" onClick={handleNext} disabled={!canNext()} style={canNext() ? primaryButtonStyle : disabledButtonStyle}>
            {isGenderAgePage ? T.buttons.create : T.buttons.next}
          </button>
          <button type="button" onClick={resetDemo} style={subtleResetStyle}>
            最初からやり直す
          </button>
          <PoweredBy />
        </div>
      </section>
    </DemoShell>
  );
}

export function DemoGeneratePage() {
  const { state, setState, resetDemo, hydrated } = useDemoState();
  const router = useRouter();
  const styles = buildStyles();
  const selectedReview = state.reviews[state.selectedStyle];

  const regenerate = () => {
    const built = buildReviews(buildAnswersForGenerate(state), Date.now());
    setState((current) => ({ ...current, reviews: built, copied: false }));
  };

  const copySelected = async () => {
    await navigator.clipboard.writeText(selectedReview);
    setState((current) => ({ ...current, copied: true }));
  };

  const goGoogle = async () => {
    try {
      if (selectedReview) await navigator.clipboard.writeText(selectedReview);
    } catch {
      // Clipboard access can be blocked in preview browsers; the demo flow should still continue.
    }
    setState((current) => ({ ...current, copied: true }));
    router.push("/demo/google");
  };

  if (!hydrated) return <DemoShell><LoadingCard /></DemoShell>;
  if (!selectedReview) {
    return (
      <DemoShell>
        <EmptyCard title="アンケート回答から始めてください" href="/demo/review" label="フォームへ進む" />
      </DemoShell>
    );
  }

  return (
    <DemoShell>
      <section style={phoneCardStyle}>
        <DemoHeader />
        <div style={{ padding: "24px 20px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "44px" }}>🎉</div>
            <h1 style={{ fontSize: "18px", fontWeight: 900, color: "#1a2533", margin: "6px 0 4px" }}>
              {T.done.title}
            </h1>
            <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>{T.done.subtitle}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
            {styles.map((style) => (
              <ReviewCard
                key={style.key}
                style={style}
                text={state.reviews[style.key]}
                selected={state.selectedStyle === style.key}
                onSelect={() => setState((current) => ({ ...current, selectedStyle: style.key, copied: false }))}
              />
            ))}
          </div>
          <div style={hintStyle}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#8A6500", margin: "0 0 8px" }}>{T.done.hint.title}</p>
            {T.done.hint.steps.map((step, index) => (
              <div key={step} style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: index === 0 ? 0 : "5px" }}>
                <span style={hintNumberStyle}>{index + 1}</span>
                <span style={{ fontSize: "12px", color: "#5A4A00" }}>{step}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gap: "10px" }}>
            <button type="button" onClick={copySelected} style={secondaryActionStyle}>
              {state.copied ? "コピーしました" : "選択中の口コミをコピー"}
            </button>
            <button type="button" onClick={goGoogle} style={primaryButtonStyle}>
              この文章でGoogleに投稿する
            </button>
            <button type="button" onClick={regenerate} style={ghostBoxButtonStyle}>
              選択中の文章を再生成
            </button>
            <button type="button" onClick={resetDemo} style={subtleResetStyle}>
              ← 最初からやり直す
            </button>
          </div>
          <PoweredBy />
        </div>
      </section>
    </DemoShell>
  );
}

export function DemoFeedbackPage() {
  const { state, setState, resetDemo, hydrated } = useDemoState();

  const submit = () => {
    setState((current) => ({ ...current, feedbackSubmittedAt: new Date().toISOString() }));
  };

  if (!hydrated) return <DemoShell><LoadingCard /></DemoShell>;

  if (state.feedbackSubmittedAt) {
    return (
      <DemoShell>
        <section style={phoneCardStyle}>
          <DemoHeader />
          <div style={{ padding: "44px 20px 36px", textAlign: "center" }}>
            <div style={{ fontSize: "60px", marginBottom: "16px" }}>💚</div>
            <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#1a2533", margin: "0 0 12px" }}>
              ご意見ありがとうございます
            </h1>
            <p style={{ color: "#555", fontSize: "14px", lineHeight: 1.9, margin: "0 0 24px" }}>
              この内容は実際の導入時には店舗だけに届き、Google口コミへの投稿には誘導されません。
            </p>
            <button type="button" onClick={resetDemo} style={subtleResetStyle}>
              最初からやり直す
            </button>
            <PoweredBy />
          </div>
        </section>
      </DemoShell>
    );
  }

  return (
    <DemoShell>
      <section style={phoneCardStyle}>
        <DemoHeader />
        <div style={{ padding: "28px 20px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🙏</div>
            <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#1a2533", margin: "0 0 8px" }}>
              {T.lowReview.title}
            </h1>
            <p style={{ color: "#888", fontSize: "13px", lineHeight: 1.8, margin: 0 }}>
              {T.lowReview.subtitle}
            </p>
          </div>
          <p style={sectionLabelStyle}>{T.lowReview.improve}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
            {JA_ISSUES.map((issue) => {
              const selected = state.lowReviewIssues.includes(issue);
              return (
                <button
                  key={issue}
                  type="button"
                  onClick={() => setState((current) => ({
                    ...current,
                    lowReviewIssues: selected
                      ? current.lowReviewIssues.filter((item) => item !== issue)
                      : [...current.lowReviewIssues, issue],
                  }))}
                  style={selected ? issueSelectedStyle : issueButtonStyle}
                >
                  {issue}
                </button>
              );
            })}
          </div>
          <p style={sectionLabelStyle}>{T.lowReview.comment}</p>
          <textarea
            value={state.lowReviewComment}
            onChange={(event) => setState((current) => ({ ...current, lowReviewComment: event.target.value.slice(0, 300) }))}
            rows={4}
            placeholder={T.lowReview.placeholder}
            style={textareaStyle}
          />
          <button type="button" onClick={submit} style={{ ...primaryButtonStyle, marginTop: "20px" }}>
            {T.lowReview.submit}
          </button>
          <button type="button" onClick={resetDemo} style={subtleResetStyle}>
            最初からやり直す
          </button>
          <PoweredBy />
        </div>
      </section>
    </DemoShell>
  );
}

export function DemoGooglePage({ googleReviewUrl }: { googleReviewUrl: string | null }) {
  const { state, resetDemo, hydrated } = useDemoState();
  const selectedReview = state.reviews[state.selectedStyle];
  const [reviewText, setReviewText] = useState("");
  const [completedReview, setCompletedReview] = useState<{ rating: number; reviewText: string; storeName: string } | null>(null);

  useEffect(() => {
    setReviewText(selectedReview);
  }, [selectedReview]);

  const submitReview = () => {
    if (googleReviewUrl) {
      window.location.href = googleReviewUrl;
      return;
    }
    setCompletedReview({
      rating: state.rating,
      reviewText,
      storeName: STORE.name,
    });
  };

  if (!hydrated) return <DemoShell><LoadingCard /></DemoShell>;
  if (!selectedReview) {
    return (
      <DemoShell>
        <EmptyCard title="アンケート回答から始めてください" href="/demo/review" label="フォームへ進む" />
      </DemoShell>
    );
  }
  if (completedReview) {
    return (
      <DemoShell>
        <section style={googleCompleteCardStyle}>
          <div style={celebrationAreaStyle}>
            <span style={{ ...sparkleStyle, left: "14%", top: "16%", color: "#25A55F" }}>✦</span>
            <span style={{ ...sparkleStyle, left: "30%", top: "8%", color: "#1A73E8" }}>▰</span>
            <span style={{ ...sparkleStyle, left: "52%", top: "18%", color: "#FABB05" }}>✦</span>
            <span style={{ ...sparkleStyle, right: "18%", top: "9%", color: "#EA4335" }}>▰</span>
            <span style={{ ...sparkleStyle, right: "8%", top: "24%", color: "#1A73E8" }}>✦</span>
            <div style={completeProfileIconStyle}>山</div>
          </div>
          <div style={completeContentStyle}>
            <div style={profileLinkMockStyle}>公開プロフィールでの投稿を表示 ＞</div>
            <div style={pointsHeroStyle}>+39 ポイント</div>
            <p style={pointsLeadStyle}>投稿によってポイントを獲得しました。</p>
            <div style={pointsBreakdownStyle}>
              {[
                { label: "評価", value: "+1", color: "#FABB05" },
                { label: "クチコミ", value: "+10", color: "#EA4335" },
                { label: "回答", value: "+3", color: "#1A73E8" },
                { label: "写真", value: "+25", color: "#25A55F" },
              ].map((item) => (
                <div key={item.label} style={pointRowStyle}>
                  <span style={{ ...pointIconStyle, background: item.color }} />
                  <span style={pointLabelStyle}>{item.label}</span>
                  <span style={pointValueStyle}>{item.value}</span>
                </div>
              ))}
            </div>
            <button type="button" onClick={resetDemo} style={subtleResetStyle}>
              最初からやり直す
            </button>
            <div style={completeFooterStyle}>
              <div>Google口コミ投稿のデモです</div>
              <div>Powered by <strong>REVIEW PRO</strong></div>
              <div>※これはデモ環境です</div>
            </div>
          </div>
        </section>
      </DemoShell>
    );
  }

  return (
    <DemoShell>
      <section style={googleDemoFrameStyle}>
        <div style={reviewProDemoHeaderStyle}>
          <div style={reviewProDemoBadgeStyle}>REVIEW PRO デモ</div>
          <div style={reviewProDemoTitleStyle}>Google口コミ投稿体験</div>
        </div>
        <div style={googleMockIntroStyle}>
          <span style={googleMockLineStyle} />
          <span>ここからGoogle投稿画面モック</span>
          <span style={googleMockLineStyle} />
        </div>
        <div style={googleMockCardStyle}>
          <div style={googleTopBarStyle}>
            <div style={googleHandleStyle}>G</div>
            <div style={googleTopTitleStyle}>口コミを投稿</div>
          </div>
          <div style={googleContentStyle}>
            <div style={googleStoreBlockStyle}>
              <div style={googleStoreAvatarStyle}>R</div>
              <div>
                <h1 style={googleStoreNameStyle}>{STORE.name}</h1>
                <p style={googleStoreMetaStyle}>美容脱毛サロン</p>
              </div>
            </div>
            <div style={googleAccountRowStyle}>
              <div style={googleAccountAvatarStyle}>山</div>
              <div>
                <div style={googleAccountNameStyle}>山田 花子</div>
                <div style={googlePublicNoteStyle}>Google全体で投稿を公開します</div>
              </div>
            </div>
            <GoogleReviewStars rating={state.rating} />
            <label style={googleTextareaLabelStyle} htmlFor="demo-google-review">
              口コミ本文
            </label>
            <textarea
              id="demo-google-review"
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              rows={8}
              style={googleReviewTextareaStyle}
            />
            {state.copied && (
              <p style={googleCopiedNoteStyle}>口コミ文をコピーしました</p>
            )}
            <button type="button" onClick={submitReview} style={googlePostButtonStyle}>
              投稿
            </button>
            <button type="button" onClick={resetDemo} style={subtleResetStyle}>
              最初からやり直す
            </button>
          </div>
        </div>
        <div style={googleFrameFooterStyle}>
          <div>Google口コミ投稿のデモです</div>
          <div>Powered by <strong>REVIEW PRO</strong></div>
          <div>※これはデモ環境です</div>
        </div>
      </section>
    </DemoShell>
  );
}

function GoogleReviewStars({ rating }: { rating: number }) {
  const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));
  return (
    <div style={googleStarsWrapStyle} aria-label={`星${safeRating}の評価`}>
      {[1, 2, 3, 4, 5].map((score) => (
        <span key={score} style={score <= safeRating ? googleStarActiveStyle : googleStarMutedStyle}>
          ★
        </span>
      ))}
    </div>
  );
}

function DemoShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&family=Outfit:wght@700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: #F4F6F9; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <main style={{ minHeight: "100vh", background: "#F4F6F9", padding: "12px", fontFamily: "'Noto Sans JP', sans-serif" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </>
  );
}

function DemoHeader({ progress }: { progress?: number }) {
  return (
    <div style={{ background: "#fff", padding: "22px 20px 18px", position: "relative", overflow: "hidden", borderBottom: "1px solid #F1F3F5" }}>
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: "11px", color: "#aaa", letterSpacing: "0.08em", marginBottom: "4px" }}>
          口コミ投稿フォーム
        </div>
        <div style={{ fontSize: "18px", fontWeight: 900, color: "#1a2533" }}>{STORE.name}</div>
      </div>
      {typeof progress === "number" && (
        <div style={{ marginTop: "14px", height: "4px", background: "#F1F3F5", borderRadius: "4px" }}>
          <div style={{ height: "100%", background: "#5BBF8A", borderRadius: "4px", width: `${progress}%`, transition: "width 0.5s ease" }} />
        </div>
      )}
    </div>
  );
}

function PoweredBy() {
  return (
    <div style={poweredByStyle}>
      Powered by <strong>REVIEW PRO</strong>
      <div style={demoFootnoteStyle}>※これはデモ環境です</div>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hover, setHover] = useState(0);
  const ratingEmoji = ["", "😞", "😐", "🙂", "😊", "🤩"];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "12px" }}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            aria-label={`星${score}`}
            onClick={() => onChange(score)}
            onMouseEnter={() => setHover(score)}
            onMouseLeave={() => setHover(0)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: "44px",
              lineHeight: 1,
              filter: score <= (hover || value) ? "none" : "grayscale(1) opacity(0.25)",
              transform: score <= (hover || value) ? "scale(1.18)" : "scale(1)",
              transition: "all 0.15s",
            }}
          >
            ⭐
          </button>
        ))}
      </div>
      {value > 0 && (
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "26px" }}>{ratingEmoji[value]}</span>
          <p style={{ margin: "4px 0 0", fontWeight: 700, color: "#1a2533", fontSize: "16px" }}>{T.ratings[value]}</p>
        </div>
      )}
    </div>
  );
}

function MultiSelectQuestion({ question, selected, onChange }: { question: Question; selected: string[]; onChange: (value: string[]) => void }) {
  return (
    <>
      <p style={{ textAlign: "center", color: "#aaa", fontSize: "12px", margin: "-12px 0 20px" }}>{T.questions.multiHint}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {question.options?.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(isSelected ? selected.filter((item) => item !== option) : [...selected, option])}
              style={isSelected ? multiSelectedStyle : multiButtonStyle}
            >
              {option}{isSelected && <span style={{ color: "#2C7A4B", fontSize: "16px" }}>✓</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}

function SelectQuestion({ options, value, onChange, columns = 2 }: { options: string[]; value: string; onChange: (value: string) => void; columns?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "10px" }}>
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            style={selected ? selectSelectedStyle : selectButtonStyle}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({ style, text, selected, onSelect }: { style: { key: StyleKey; label: string; emoji: string }; text: string; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} style={selected ? reviewCardSelectedStyle : reviewCardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "16px" }}>{style.emoji}</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: selected ? "#2C7A4B" : "#888" }}>{style.label}</span>
        </div>
        {selected && <span style={checkMarkStyle}>✓</span>}
      </div>
      <p style={{ margin: 0, textAlign: "left", fontSize: "14px", lineHeight: 1.85, color: selected ? "#1a3a2a" : "#555" }}>{text}</p>
      <span style={{ display: "block", marginTop: "10px", textAlign: "right", fontSize: "12px", fontWeight: 700, color: selected ? "#2C7A4B" : "#aaa" }}>
        {selected ? "選択中" : "この口コミを使う"}
      </span>
    </button>
  );
}

function EmptyCard({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <section style={cardStyle}>
      <h1 style={{ margin: "0 0 16px", fontSize: "20px", color: "#1a2533" }}>{title}</h1>
      <Link href={href} style={primaryButtonStyle}>{label}</Link>
    </section>
  );
}

function LoadingCard() {
  return <section style={cardStyle}>読み込み中...</section>;
}

function useDemoState() {
  const router = useRouter();
  const [state, setStateBase] = useState<DemoState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setHydrated(true);
      return;
    }
    try {
      setStateBase({ ...initialState, ...JSON.parse(raw) });
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  const setState = useCallback((updater: (current: DemoState) => DemoState) => {
    setStateBase((current) => {
      const next = updater(current);
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetDemo = useCallback(() => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setStateBase(initialState);
    router.push("/demo");
  }, [router]);

  return { state, setState, resetDemo, hydrated };
}

function buildStyles() {
  return STYLE_KEYS.map((key) => ({ key, label: T.styles[key].label, emoji: T.styles[key].emoji }));
}

function buildAnswersForGenerate(state: DemoState) {
  const result = { rating: state.rating, menu: "", party: "", highlight: [] as string[], feel: "", gender: state.gender, age: state.age };
  baseQuestions.forEach((question) => {
    const answer = state.answers[question.id];
    if (question.type === "stars") result.rating = Number(answer || 0);
    else if (question.type === "multi" && Array.isArray(answer)) result.highlight = answer;
    else if (typeof answer === "string") {
      if (question.label.includes("メニュー") || question.label.includes("ご利用")) result.menu = answer;
      else if (question.label.includes("人数")) result.party = answer;
      else if (question.label.includes("一言")) result.feel = answer;
      else if (!result.feel) result.feel = answer;
    }
  });
  return result;
}

function buildReviews(answers: ReturnType<typeof buildAnswersForGenerate>, seed = 0): Record<StyleKey, string> {
  const highlights = answers.highlight.length ? answers.highlight.join("、") : "スタッフの対応";
  const menu = answers.menu || "施術";
  const party = answers.party || "1人";
  const feel = answers.feel || "安心して通える";
  const ageHint = answers.age ? `${answers.age}の自分にも自然に合う雰囲気で、` : "";
  const genderHint = answers.gender === "男性"
    ? "男性でも相談しやすく、"
    : answers.gender === "女性"
      ? "女性目線でも細かな配慮を感じ、"
      : "";
  const suffix = seed % 2 === 0 ? "またお願いしたいと思います。" : "次回も利用したいです。";

  return {
    casual: `${party}で利用しました。${menu}をお願いしましたが、${highlights}が特に良かったです。${ageHint}${genderHint}${feel}と感じられて、初めてでもリラックスできました。${suffix}`,
    honest: `無理な案内がなく、説明から施術まで落ち着いて受けられました。${menu}では${highlights}が印象に残っています。${party}でも利用しやすく、${ageHint}${feel}という感想です。全体的に安心感がありました。`,
    formal: `${menu}で伺いました。${genderHint}スタッフの方の対応も丁寧でした。${highlights}に満足していて、${party}での来店でも過ごしやすい雰囲気です。${feel}サロンだと思います。`,
  };
}

const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: "20px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" };
const welcomeCardStyle: React.CSSProperties = { ...cardStyle, minHeight: "calc(100vh - 24px)", display: "flex", flexDirection: "column" };
const welcomeHeaderStyle: React.CSSProperties = { paddingBottom: "10px", borderBottom: "1px solid #F1F3F5" };
const welcomeTitleStyle: React.CSSProperties = { margin: "12px 0 18px", color: "#1a2533", fontSize: "28px", fontWeight: 900, lineHeight: 1.35, letterSpacing: 0 };
const welcomeMessageStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "4px", background: "#F4F9F6", borderRadius: "14px", padding: "16px", margin: "8px 0 16px", textAlign: "center", color: "#1a2533", fontSize: "14px", fontWeight: 700, lineHeight: 1.7 };
const phoneCardStyle: React.CSSProperties = { minHeight: "calc(100vh - 36px)", background: "#fff", borderRadius: "18px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" };
const primaryButtonStyle: React.CSSProperties = { display: "block", width: "100%", padding: "18px", borderRadius: "16px", border: "none", background: "linear-gradient(135deg, #2C7A4B, #3DA66A)", color: "#fff", fontFamily: "inherit", fontSize: "16px", fontWeight: 700, cursor: "pointer", textAlign: "center", textDecoration: "none", boxShadow: "0 4px 16px rgba(44,122,75,0.3)" };
const disabledButtonStyle: React.CSSProperties = { ...primaryButtonStyle, background: "#E5E7EB", color: "#aaa", boxShadow: "none", cursor: "not-allowed" };
const secondaryActionStyle: React.CSSProperties = { ...primaryButtonStyle, background: "#fff", color: "#2C7A4B", border: "1.5px solid #2C7A4B", boxShadow: "none" };
const ghostButtonStyle: React.CSSProperties = { width: "100%", marginTop: "10px", padding: "12px", borderRadius: "12px", border: "none", background: "transparent", color: "#888", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" };
const ghostBoxButtonStyle: React.CSSProperties = { ...ghostButtonStyle, marginTop: 0, border: "1.5px solid #E5E7EB", background: "#fff", color: "#555", fontWeight: 700 };
const subtleResetStyle: React.CSSProperties = { display: "block", width: "100%", margin: "10px 0 0", padding: "8px", border: "none", background: "transparent", color: "#B0B7C0", fontFamily: "inherit", fontSize: "11px", cursor: "pointer", textAlign: "center" };
const featureRowStyle: React.CSSProperties = { background: "#F4F9F6", borderRadius: "10px", padding: "11px 16px", fontSize: "13px", fontWeight: 700, color: "#2C7A4B", textAlign: "left" };
const backButtonStyle: React.CSSProperties = { background: "none", border: "none", color: "#aaa", fontFamily: "inherit", fontSize: "13px", cursor: "pointer", padding: "0 0 8px" };
const questionCountStyle: React.CSSProperties = { fontSize: "11px", fontWeight: 700, color: "#2C7A4B", letterSpacing: "0.1em", margin: "0 0 8px", textAlign: "center" };
const questionTitleStyle: React.CSSProperties = { fontSize: "20px", fontWeight: 900, color: "#1a2533", margin: "0 0 24px", textAlign: "center", lineHeight: 1.4 };
const sectionLabelStyle: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#1a2533", margin: "0 0 12px" };
const multiButtonStyle: React.CSSProperties = { padding: "15px 18px", borderRadius: "12px", border: "2px solid #E5E7EB", background: "#fff", color: "#555", fontFamily: "inherit", fontSize: "15px", fontWeight: 400, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" };
const multiSelectedStyle: React.CSSProperties = { ...multiButtonStyle, border: "2px solid #2C7A4B", background: "#F0FAF4", color: "#1a3a2a", fontWeight: 700 };
const selectButtonStyle: React.CSSProperties = { padding: "18px 10px", borderRadius: "14px", border: "2px solid #E5E7EB", background: "#fff", color: "#555", fontFamily: "inherit", fontSize: "14px", fontWeight: 700, cursor: "pointer", textAlign: "center" };
const selectSelectedStyle: React.CSSProperties = { ...selectButtonStyle, border: "2px solid #2C7A4B", background: "#2C7A4B", color: "#fff" };
const reviewCardStyle: React.CSSProperties = { borderRadius: "14px", border: "2px solid #E5E7EB", background: "#fff", padding: "16px", cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" };
const reviewCardSelectedStyle: React.CSSProperties = { ...reviewCardStyle, border: "2px solid #2C7A4B", background: "#F0FAF4", boxShadow: "0 0 0 3px rgba(44,122,75,0.12)" };
const checkMarkStyle: React.CSSProperties = { width: "22px", height: "22px", borderRadius: "50%", background: "#2C7A4B", color: "#fff", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" };
const hintStyle: React.CSSProperties = { background: "#FFFBF0", border: "1px solid #FADDAA", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px" };
const hintNumberStyle: React.CSSProperties = { width: "20px", height: "20px", borderRadius: "50%", background: "#F5A623", color: "#fff", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const issueButtonStyle: React.CSSProperties = { padding: "12px 8px", borderRadius: "10px", border: "2px solid #E5E7EB", background: "#fff", color: "#555", fontFamily: "inherit", fontSize: "13px", fontWeight: 400, cursor: "pointer", textAlign: "center" };
const issueSelectedStyle: React.CSSProperties = { ...issueButtonStyle, border: "2px solid #E53E3E", background: "#FEF2F2", color: "#991B1B", fontWeight: 700 };
const textareaStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", outline: "none", resize: "vertical" };
const reviewPreviewStyle: React.CSSProperties = { background: "#F0FAF4", border: "1px solid rgba(44,122,75,0.2)", borderRadius: "14px", padding: "16px", marginBottom: "18px" };
const pillStyle: React.CSSProperties = { background: "#F0FAF4", color: "#2C7A4B", fontSize: "11px", fontWeight: 800, borderRadius: "999px", padding: "4px 10px" };
const languageButtonStyle: React.CSSProperties = { border: "1px solid #E5E7EB", borderRadius: "10px", background: "#fff", color: "#555", padding: "8px 4px", fontFamily: "inherit", fontSize: "11px", fontWeight: 700 };
const poweredByStyle: React.CSSProperties = { marginTop: "auto", paddingTop: "18px", textAlign: "center", color: "#B0B7C0", fontSize: "11px", lineHeight: 1.8 };
const demoFootnoteStyle: React.CSSProperties = { color: "#C2C7CF", fontSize: "10px", fontWeight: 400 };
const googleDemoFrameStyle: React.CSSProperties = { minHeight: "calc(100vh - 24px)", background: "#EEF2F6", borderRadius: "18px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column" };
const reviewProDemoHeaderStyle: React.CSSProperties = { padding: "18px 18px 14px", background: "#123225", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.08)" };
const reviewProDemoBadgeStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", minHeight: "22px", padding: "3px 9px", borderRadius: "999px", background: "rgba(255,255,255,0.13)", color: "#DDF5E8", fontSize: "10px", fontWeight: 800, letterSpacing: "0.06em" };
const reviewProDemoTitleStyle: React.CSSProperties = { marginTop: "8px", fontSize: "20px", fontWeight: 900, lineHeight: 1.3, letterSpacing: 0 };
const googleMockIntroStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px", color: "#7A8088", fontSize: "11px", fontWeight: 700 };
const googleMockLineStyle: React.CSSProperties = { height: "1px", background: "#D9DEE5", flex: 1 };
const googleMockCardStyle: React.CSSProperties = { margin: "0 12px", background: "#fff", borderRadius: "16px", overflow: "hidden", border: "1px solid #E3E7ED", boxShadow: "0 1px 6px rgba(15,23,42,0.05)" };
const googleTopBarStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "12px", padding: "18px 18px 14px", borderBottom: "1px solid #EEF0F3", background: "#fff" };
const googleHandleStyle: React.CSSProperties = { width: "34px", height: "34px", borderRadius: "50%", background: "#F1F3F4", color: "#3C4043", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit, sans-serif", fontSize: "18px", fontWeight: 800 };
const googleTopTitleStyle: React.CSSProperties = { marginTop: "2px", fontSize: "18px", color: "#202124", fontWeight: 800 };
const googleContentStyle: React.CSSProperties = { padding: "20px 18px 26px", display: "flex", flexDirection: "column", flex: 1 };
const googleStoreBlockStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" };
const googleStoreAvatarStyle: React.CSSProperties = { width: "44px", height: "44px", borderRadius: "10px", background: "#EAF4EF", color: "#2C7A4B", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit, sans-serif", fontSize: "20px", fontWeight: 900, flexShrink: 0 };
const googleStoreNameStyle: React.CSSProperties = { margin: 0, color: "#202124", fontSize: "19px", fontWeight: 800, lineHeight: 1.35 };
const googleStoreMetaStyle: React.CSSProperties = { margin: "3px 0 0", color: "#7A8088", fontSize: "12px" };
const googleAccountRowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: "1px solid #EEF0F3", borderRadius: "12px", background: "#FAFBFC", marginBottom: "20px" };
const googleAccountAvatarStyle: React.CSSProperties = { width: "34px", height: "34px", borderRadius: "50%", background: "#DDE8FF", color: "#2B4A7F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, flexShrink: 0 };
const googleAccountNameStyle: React.CSSProperties = { color: "#202124", fontSize: "13px", fontWeight: 800 };
const googlePublicNoteStyle: React.CSSProperties = { marginTop: "2px", color: "#7A8088", fontSize: "11px" };
const googleStarsWrapStyle: React.CSSProperties = { display: "flex", justifyContent: "center", gap: "7px", margin: "4px 0 18px", lineHeight: 1 };
const googleStarActiveStyle: React.CSSProperties = { color: "#FABB05", fontSize: "38px", textShadow: "0 1px 0 rgba(0,0,0,0.04)" };
const googleStarMutedStyle: React.CSSProperties = { color: "#DADCE0", fontSize: "38px" };
const googleTextareaLabelStyle: React.CSSProperties = { color: "#3C4043", fontSize: "12px", fontWeight: 800, marginBottom: "8px" };
const googleReviewTextareaStyle: React.CSSProperties = { width: "100%", minHeight: "190px", padding: "14px", border: "1.5px solid #DADCE0", borderRadius: "12px", color: "#202124", fontFamily: "inherit", fontSize: "15px", lineHeight: 1.75, outline: "none", resize: "vertical", marginBottom: "10px" };
const googleCopiedNoteStyle: React.CSSProperties = { margin: "0 0 10px", color: "#7A8088", fontSize: "11px", textAlign: "right" };
const googlePostButtonStyle: React.CSSProperties = { ...primaryButtonStyle, marginTop: "4px", background: "#1A73E8", boxShadow: "0 4px 14px rgba(26,115,232,0.24)", borderRadius: "999px", padding: "15px" };
const googleFrameFooterStyle: React.CSSProperties = { marginTop: "auto", padding: "14px 18px 18px", color: "#AAB1BB", fontSize: "10px", lineHeight: 1.8, textAlign: "center" };
const googleCompleteCardStyle: React.CSSProperties = { minHeight: "calc(100vh - 24px)", background: "#fff", borderRadius: "18px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column" };
const celebrationAreaStyle: React.CSSProperties = { position: "relative", minHeight: "142px", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "8px", background: "linear-gradient(180deg, #FFFFFF 0%, #F8FBFF 100%)" };
const sparkleStyle: React.CSSProperties = { position: "absolute", fontSize: "20px", fontWeight: 900, transform: "rotate(-12deg)" };
const completeProfileIconStyle: React.CSSProperties = { width: "70px", height: "70px", borderRadius: "50%", background: "linear-gradient(135deg, #DDE8FF, #F2F6FF)", color: "#2B4A7F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 900, boxShadow: "0 8px 20px rgba(43,74,127,0.12)" };
const completeContentStyle: React.CSSProperties = { padding: "4px 34px 26px", textAlign: "center", display: "flex", flexDirection: "column", flex: 1 };
const profileLinkMockStyle: React.CSSProperties = { color: "#1A73E8", fontSize: "12px", fontWeight: 800, marginBottom: "18px" };
const pointsHeroStyle: React.CSSProperties = { color: "#F2994A", fontSize: "30px", fontWeight: 500, lineHeight: 1.25, marginBottom: "10px" };
const pointsLeadStyle: React.CSSProperties = { margin: "0 auto 22px", color: "#3C4043", fontSize: "15px", lineHeight: 1.55, maxWidth: "230px" };
const pointsBreakdownStyle: React.CSSProperties = { display: "grid", gap: "15px", margin: "0 auto 20px", width: "100%", maxWidth: "260px", textAlign: "left" };
const pointRowStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "22px 1fr auto", alignItems: "center", gap: "10px", color: "#6B7280", fontSize: "13px", fontWeight: 800 };
const pointIconStyle: React.CSSProperties = { width: "18px", height: "18px", borderRadius: "50%", display: "inline-block", boxShadow: "inset 0 0 0 4px rgba(255,255,255,0.35)" };
const pointLabelStyle: React.CSSProperties = { color: "#6B7280" };
const pointValueStyle: React.CSSProperties = { color: "#F2994A", fontWeight: 900 };
const completeFooterStyle: React.CSSProperties = { marginTop: "auto", paddingTop: "14px", color: "#B5BBC4", fontSize: "10px", lineHeight: 1.9, textAlign: "center" };
