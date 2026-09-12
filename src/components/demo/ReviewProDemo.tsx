"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { JA_ISSUES, LANGUAGE_LIST, LangCode, getT } from "@/lib/i18n";

type Question = {
  id: number;
  order_num: number;
  type: string;
  labels: Record<LangCode, string>;
  options: { value: string; labels: Record<LangCode, string> }[] | null;
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
  language: LangCode;
};

const STORAGE_KEY = "review-pro-public-demo:v1";
const STORE = {
  name: "REVIEW PRO デモサロン",
  type: "美容脱毛",
};
const STYLE_KEYS: StyleKey[] = ["casual", "honest", "formal"];
const LOW_REVIEW_PRO_ACTIVE = true;

const L = (ja: string, en: string, zh: string, ko: string): Record<LangCode, string> => ({ ja, en, zh, ko });

const O = (value: string, en: string, zh: string, ko: string) => ({
  value,
  labels: L(value, en, zh, ko),
});

const demoQuestions: Question[] = [
  {
    id: 1,
    order_num: 1,
    type: "stars",
    labels: L("今日の施術はいかがでしたか？", "How was your treatment today?", "今天的服务体验如何？", "오늘 시술은 어떠셨나요?"),
    options: null,
  },
  {
    id: 2,
    order_num: 2,
    type: "select",
    labels: L("ご利用のメニューは？", "Which menu did you use?", "您体验了哪个项目？", "이용하신 메뉴는 무엇인가요?"),
    options: [
      O("全身脱毛", "Full-body hair removal", "全身脱毛", "전신 제모"),
      O("顔脱毛", "Facial hair removal", "面部脱毛", "얼굴 제모"),
      O("VIO脱毛", "VIO hair removal", "VIO脱毛", "VIO 제모"),
      O("脚脱毛", "Leg hair removal", "腿部脱毛", "다리 제모"),
      O("ワキ脱毛", "Underarm hair removal", "腋下脱毛", "겨드랑이 제모"),
      O("その他", "Other", "其他", "기타"),
    ],
  },
  {
    id: 3,
    order_num: 3,
    type: "select",
    labels: L("何人でご来店でしたか？", "How many people visited?", "几位一起到店？", "몇 분이 방문하셨나요?"),
    options: [
      O("1人", "Just me", "1人", "1명"),
      O("2人", "2 people", "2人", "2명"),
      O("3〜4人", "3-4 people", "3-4人", "3-4명"),
      O("5人以上", "5 or more", "5人以上", "5명 이상"),
      O("家族", "Family", "家人", "가족"),
      O("カップル", "Couple", "情侣", "커플"),
    ],
  },
  {
    id: 4,
    order_num: 4,
    type: "multi",
    labels: L("特に良かった点は？", "What stood out most?", "哪些方面特别好？", "특히 좋았던 점은 무엇인가요?"),
    options: [
      O("施術の効果", "Treatment results", "施术效果", "시술 효과"),
      O("スタッフの対応", "Staff support", "员工服务", "직원 응대"),
      O("サロンの清潔感", "Cleanliness", "店内清洁感", "살롱의 청결함"),
      O("価格・コスパ", "Price / Value", "价格/性价比", "가격/가성비"),
      O("予約のしやすさ", "Easy booking", "预约方便", "예약 편의성"),
    ],
  },
  {
    id: 5,
    order_num: 5,
    type: "select",
    labels: L("一言でいうと？", "In one phrase?", "用一句话来说？", "한마디로 표현하면?"),
    options: [
      O("また来たい！", "I want to come again!", "还想再来！", "또 오고 싶어요!"),
      O("友人に勧めたい", "I would recommend it", "想推荐给朋友", "친구에게 추천하고 싶어요"),
      O("期待以上だった", "Better than expected", "超出期待", "기대 이상이었어요"),
      O("安心して通える", "A place I can trust", "可以安心常来的地方", "안심하고 다닐 수 있어요"),
    ],
  },
  {
    id: 6,
    order_num: 6,
    type: "select",
    labels: L("性別を教えてください", "Gender", "性别", "성별"),
    options: [
      O("男性", "Male", "男性", "남성"),
      O("女性", "Female", "女性", "여성"),
      O("回答しない", "Prefer not to say", "不回答", "답변하지 않음"),
    ],
  },
  {
    id: 7,
    order_num: 7,
    type: "select",
    labels: L("年代を教えてください", "Age group", "年龄段", "연령대"),
    options: [
      O("10代", "Teens", "10多岁", "10대"),
      O("20代", "20s", "20多岁", "20대"),
      O("30代", "30s", "30多岁", "30대"),
      O("40代", "40s", "40多岁", "40대"),
      O("50代以上", "50+", "50岁以上", "50대 이상"),
    ],
  },
];

const baseQuestions = demoQuestions.filter(
  (q) => q.id !== 6 && q.id !== 7,
);
const genderQuestion = demoQuestions.find((q) => q.id === 6)!;
const ageQuestion = demoQuestions.find((q) => q.id === 7)!;
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
  language: "ja",
};

const demoCopy: Record<LangCode, {
  aboutYou: string;
  copied: string;
  copyReview: string;
  demoFootnote: string;
  goToForm: string;
  googleDemoDisclaimer: string;
  googleMockStarts: string;
  googleReviewExperience: string;
  pointAnswer: string;
  pointPhoto: string;
  pointRating: string;
  pointReview: string;
  points: string;
  pointsLead: string;
  postReview: string;
  publicOnGoogle: string;
  ratingLabel: string;
  reviewBody: string;
  reviewProDemo: string;
  selected: string;
  startFromSurvey: string;
  submitPost: string;
  useReview: string;
  viewPublicProfile: string;
}> = {
  ja: {
    aboutYou: "あなたについて教えてください",
    copied: "コピーしました",
    copyReview: "選択中の口コミをコピー",
    demoFootnote: "※これはデモ環境です",
    goToForm: "フォームへ進む",
    googleDemoDisclaimer: "Google口コミ投稿のデモです",
    googleMockStarts: "ここからGoogle投稿画面モック",
    googleReviewExperience: "Google口コミ投稿体験",
    pointAnswer: "回答",
    pointPhoto: "写真",
    pointRating: "評価",
    pointReview: "クチコミ",
    points: "+39 ポイント",
    pointsLead: "投稿によってポイントを獲得しました。",
    postReview: "口コミを投稿",
    publicOnGoogle: "Google全体で投稿を公開します",
    ratingLabel: "星{n}の評価",
    reviewBody: "口コミ本文",
    reviewProDemo: "REVIEW PRO デモ",
    selected: "選択中",
    startFromSurvey: "アンケート回答から始めてください",
    submitPost: "投稿",
    useReview: "この口コミを使う",
    viewPublicProfile: "公開プロフィールでの投稿を表示 ＞",
  },
  en: {
    aboutYou: "Tell us about yourself",
    copied: "Review copied",
    copyReview: "Copy selected review",
    demoFootnote: "Demo environment",
    goToForm: "Go to form",
    googleDemoDisclaimer: "Google review posting demo",
    googleMockStarts: "Google posting mock starts here",
    googleReviewExperience: "Google Review Posting Experience",
    pointAnswer: "Answer",
    pointPhoto: "Photo",
    pointRating: "Rating",
    pointReview: "Review",
    points: "+39 points",
    pointsLead: "You earned points for your post.",
    postReview: "Post a review",
    publicOnGoogle: "Your post will be public across Google",
    ratingLabel: "{n}-star rating",
    reviewBody: "Review text",
    reviewProDemo: "REVIEW PRO Demo",
    selected: "Selected",
    startFromSurvey: "Please start with the survey",
    submitPost: "Post",
    useReview: "Use this review",
    viewPublicProfile: "View post on public profile >",
  },
  zh: {
    aboutYou: "请告诉我们您的情况",
    copied: "评价已复制",
    copyReview: "复制选中的评价",
    demoFootnote: "※这是演示环境",
    goToForm: "前往表单",
    googleDemoDisclaimer: "Google评价发布演示",
    googleMockStarts: "这里开始是Google发布界面模拟",
    googleReviewExperience: "Google评价发布体验",
    pointAnswer: "回答",
    pointPhoto: "照片",
    pointRating: "评分",
    pointReview: "评价",
    points: "+39 积分",
    pointsLead: "您通过发布评价获得了积分。",
    postReview: "发布评价",
    publicOnGoogle: "您的投稿将在整个Google公开显示",
    ratingLabel: "{n}星评分",
    reviewBody: "评价内容",
    reviewProDemo: "REVIEW PRO 演示",
    selected: "已选择",
    startFromSurvey: "请先回答问卷",
    submitPost: "发布",
    useReview: "使用这条评价",
    viewPublicProfile: "在公开个人资料中查看投稿 ＞",
  },
  ko: {
    aboutYou: "본인에 대해 알려주세요",
    copied: "리뷰 문장이 복사되었습니다",
    copyReview: "선택한 리뷰 복사",
    demoFootnote: "※데모 환경입니다",
    goToForm: "폼으로 이동",
    googleDemoDisclaimer: "Google 리뷰 작성 데모입니다",
    googleMockStarts: "여기부터 Google 작성 화면 모의 화면",
    googleReviewExperience: "Google 리뷰 작성 체험",
    pointAnswer: "답변",
    pointPhoto: "사진",
    pointRating: "평가",
    pointReview: "리뷰",
    points: "+39 포인트",
    pointsLead: "게시를 통해 포인트를 획득했습니다.",
    postReview: "리뷰 작성",
    publicOnGoogle: "Google 전체에 공개 게시됩니다",
    ratingLabel: "별 {n}개 평가",
    reviewBody: "리뷰 내용",
    reviewProDemo: "REVIEW PRO 데모",
    selected: "선택 중",
    startFromSurvey: "설문 응답부터 시작해 주세요",
    submitPost: "게시",
    useReview: "이 리뷰 사용",
    viewPublicProfile: "공개 프로필에서 게시물 보기 ＞",
  },
};

export function DemoTopPage() {
  const { state, setState, resetDemo } = useDemoState();
  const t = getT(state.language);
  const setLanguage = (language: LangCode) => {
    setState((current) => ({ ...current, language }));
  };

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
          <LanguageButtons language={state.language} onChange={setLanguage} />
          <div style={{ fontSize: "46px", marginTop: "18px" }}>🙏</div>
          <h1 style={welcomeTitleStyle}>{renderLines(t.welcome.title)}</h1>
        </div>
        <div style={welcomeMessageStyle}>
          {renderLines(t.welcome.subtitle.replace("{n}", String(totalPages)))}
        </div>
        <div style={{ display: "grid", gap: "10px" }}>
          {t.welcome.features.map((text) => (
            <div key={text} style={featureRowStyle}>{text}</div>
          ))}
        </div>
        <Link href="/demo/review" style={{ ...primaryButtonStyle, marginTop: "22px" }}>
          {t.buttons.start}
        </Link>
        <button type="button" onClick={resetDemo} style={subtleResetStyle}>
          {t.done.restart.replace("← ", "")}
        </button>
        <PoweredBy language={state.language} />
      </section>
    </DemoShell>
  );
}

export function DemoReviewPage() {
  const router = useRouter();
  const { state, setState, resetDemo, hydrated } = useDemoState();
  const [currentQ, setCurrentQ] = useState(0);
  const t = getT(state.language);
  const setLanguage = (language: LangCode) => {
    setState((current) => ({ ...current, language }));
  };

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
      const built = buildReviews(buildAnswersForGenerate(state), state.language);
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
        <DemoHeader progress={progress} language={state.language} onLanguageChange={setLanguage} />
        <div style={{ padding: "28px 20px 32px", minHeight: "640px", display: "flex", flexDirection: "column" }}>
          {!isGenderAgePage && currentQuestion && (
            <div style={{ animation: "fadeUp 0.35s ease", flex: 1 }}>
              <button type="button" onClick={handleBack} style={backButtonStyle}>
                {t.questions.back}
              </button>
              <p style={questionCountStyle}>Q{currentQ + 1} / {totalPages}</p>
              <h1 style={questionTitleStyle}>{currentQuestion.labels[state.language]}</h1>
              {currentQuestion.type === "stars" && (
                <StarRating
                  value={Number(state.answers[currentQuestion.id] || 0)}
                  onChange={(value) => updateAnswer(currentQuestion.id, value)}
                  labels={t.ratings}
                />
              )}
              {currentQuestion.type === "multi" && currentQuestion.options && (
                <MultiSelectQuestion
                  question={currentQuestion}
                  selected={Array.isArray(state.answers[currentQuestion.id]) ? state.answers[currentQuestion.id] as string[] : []}
                  onChange={(next) => updateAnswer(currentQuestion.id, next)}
                  language={state.language}
                  multiHint={t.questions.multiHint}
                />
              )}
              {currentQuestion.type === "select" && currentQuestion.options && (
                <SelectQuestion
                  options={currentQuestion.options}
                  value={typeof state.answers[currentQuestion.id] === "string" ? String(state.answers[currentQuestion.id]) : ""}
                  onChange={(next) => updateAnswer(currentQuestion.id, next)}
                  language={state.language}
                />
              )}
            </div>
          )}

          {isGenderAgePage && (
            <div style={{ animation: "fadeUp 0.35s ease", flex: 1 }}>
              <button type="button" onClick={handleBack} style={backButtonStyle}>
                {t.questions.back}
              </button>
              <p style={questionCountStyle}>Q{totalPages} / {totalPages}</p>
              <h1 style={questionTitleStyle}>{demoCopy[state.language].aboutYou}</h1>
              <div style={{ marginBottom: "28px" }}>
                <p style={sectionLabelStyle}>{genderQuestion.labels[state.language]}</p>
                <SelectQuestion
                  columns={3}
                  options={genderQuestion.options ?? []}
                  value={state.gender}
                  onChange={(gender) => setState((current) => ({ ...current, gender }))}
                  language={state.language}
                />
              </div>
              <div>
                <p style={sectionLabelStyle}>{ageQuestion.labels[state.language]}</p>
                <SelectQuestion
                  options={ageQuestion.options ?? []}
                  value={state.age}
                  onChange={(age) => setState((current) => ({ ...current, age }))}
                  language={state.language}
                />
              </div>
            </div>
          )}

          <button type="button" onClick={handleNext} disabled={!canNext()} style={canNext() ? primaryButtonStyle : disabledButtonStyle}>
            {isGenderAgePage ? t.buttons.create : t.buttons.next}
          </button>
          <button type="button" onClick={resetDemo} style={subtleResetStyle}>
            {t.done.restart.replace("← ", "")}
          </button>
          <PoweredBy language={state.language} />
        </div>
      </section>
    </DemoShell>
  );
}

export function DemoGeneratePage() {
  const { state, setState, resetDemo, hydrated } = useDemoState();
  const router = useRouter();
  const t = getT(state.language);
  const styles = buildStyles(t, state.language);
  const selectedReview = state.reviews[state.selectedStyle];
  const setLanguage = (language: LangCode) => {
    setState((current) => ({
      ...current,
      language,
      reviews: buildReviews(buildAnswersForGenerate(current), language),
      copied: false,
    }));
  };

  const regenerate = () => {
    const built = buildReviews(buildAnswersForGenerate(state), state.language, Date.now());
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
  if (state.rating > 0 && state.rating <= 2 && LOW_REVIEW_PRO_ACTIVE) {
    return (
      <DemoShell>
        <EmptyCard title={t.lowReview.title} href="/demo/feedback" label={t.lowReview.submit} />
      </DemoShell>
    );
  }
  if (!selectedReview) {
    return (
      <DemoShell>
        <EmptyCard title={demoCopy[state.language].startFromSurvey} href="/demo/review" label={demoCopy[state.language].goToForm} />
      </DemoShell>
    );
  }

  return (
    <DemoShell>
      <section style={phoneCardStyle}>
        <DemoHeader language={state.language} onLanguageChange={setLanguage} />
        <div style={{ padding: "24px 20px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "44px" }}>🎉</div>
            <h1 style={{ fontSize: "18px", fontWeight: 900, color: "#1a2533", margin: "6px 0 4px" }}>
              {t.done.title}
            </h1>
            <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>{t.done.subtitle}</p>
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
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#8A6500", margin: "0 0 8px" }}>{t.done.hint.title}</p>
            {t.done.hint.steps.map((step, index) => (
              <div key={step} style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: index === 0 ? 0 : "5px" }}>
                <span style={hintNumberStyle}>{index + 1}</span>
                <span style={{ fontSize: "12px", color: "#5A4A00" }}>{step}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gap: "10px" }}>
            <button type="button" onClick={copySelected} style={secondaryActionStyle}>
              {state.copied ? demoCopy[state.language].copied : demoCopy[state.language].copyReview}
            </button>
            <button type="button" onClick={goGoogle} style={primaryButtonStyle}>
              {t.done.postButton}
            </button>
            <button type="button" onClick={regenerate} style={ghostBoxButtonStyle}>
              {t.done.regen}
            </button>
            <button type="button" onClick={resetDemo} style={subtleResetStyle}>
              {t.done.restart}
            </button>
          </div>
          <PoweredBy language={state.language} />
        </div>
      </section>
    </DemoShell>
  );
}

export function DemoFeedbackPage() {
  const { state, setState, resetDemo, hydrated } = useDemoState();
  const t = getT(state.language);
  const setLanguage = (language: LangCode) => {
    setState((current) => ({ ...current, language }));
  };

  const submit = () => {
    setState((current) => ({ ...current, feedbackSubmittedAt: new Date().toISOString() }));
  };

  if (!hydrated) return <DemoShell><LoadingCard /></DemoShell>;

  if (state.feedbackSubmittedAt) {
    return (
      <DemoShell>
        <section style={phoneCardStyle}>
          <LowReviewHeader language={state.language} onLanguageChange={setLanguage} />
          <div style={{ padding: "44px 20px 36px", textAlign: "center" }}>
            <div style={{ fontSize: "60px", marginBottom: "16px" }}>💚</div>
            <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#1a2533", margin: "0 0 12px" }}>
              {t.lowReviewDone.title}
            </h1>
            <p style={{ color: "#555", fontSize: "14px", lineHeight: 1.9, margin: "0 0 24px" }}>
              {renderLines(t.lowReviewDone.message)}
            </p>
            <button type="button" onClick={resetDemo} style={subtleResetStyle}>
              {t.done.restart.replace("← ", "")}
            </button>
            <PoweredBy language={state.language} />
          </div>
        </section>
      </DemoShell>
    );
  }

  return (
    <DemoShell>
      <section style={phoneCardStyle}>
        <LowReviewHeader language={state.language} onLanguageChange={setLanguage} />
        <div style={{ padding: "28px 20px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🙏</div>
            <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#1a2533", margin: "0 0 8px" }}>
              {t.lowReview.title}
            </h1>
            <p style={{ color: "#888", fontSize: "13px", lineHeight: 1.8, margin: 0 }}>
              {renderLines(t.lowReview.subtitle)}
            </p>
          </div>
          <p style={sectionLabelStyle}>{t.lowReview.improve}</p>
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
                  {t.issues[issue] ?? issue}
                </button>
              );
            })}
          </div>
          <p style={sectionLabelStyle}>{t.lowReview.comment}</p>
          <textarea
            value={state.lowReviewComment}
            onChange={(event) => setState((current) => ({ ...current, lowReviewComment: event.target.value.slice(0, 300) }))}
            rows={4}
            placeholder={t.lowReview.placeholder}
            style={textareaStyle}
          />
          <button type="button" onClick={submit} style={{ ...primaryButtonStyle, marginTop: "20px" }}>
            {t.lowReview.submit}
          </button>
          <button type="button" onClick={resetDemo} style={subtleResetStyle}>
            {t.done.restart.replace("← ", "")}
          </button>
          <PoweredBy language={state.language} />
        </div>
      </section>
    </DemoShell>
  );
}

export function DemoGooglePage({ googleReviewUrl }: { googleReviewUrl: string | null }) {
  const router = useRouter();
  const { state, setState, resetDemo, hydrated } = useDemoState();
  const t = getT(state.language);
  const copy = demoCopy[state.language];
  const selectedReview = state.reviews[state.selectedStyle];
  const [reviewText, setReviewText] = useState("");
  const [completedReview, setCompletedReview] = useState<{ rating: number; reviewText: string; storeName: string } | null>(null);
  const setLanguage = (language: LangCode) => {
    setState((current) => ({
      ...current,
      language,
      reviews: buildReviews(buildAnswersForGenerate(current), language),
      copied: false,
    }));
  };

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
  if (state.rating > 0 && state.rating <= 2 && LOW_REVIEW_PRO_ACTIVE) {
    return (
      <DemoShell>
        <EmptyCard title={t.lowReview.title} href="/demo/feedback" label={t.lowReview.submit} />
      </DemoShell>
    );
  }
  if (!selectedReview) {
    return (
      <DemoShell>
        <EmptyCard title={copy.startFromSurvey} href="/demo/review" label={copy.goToForm} />
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
            <div style={profileLinkMockStyle}>{copy.viewPublicProfile}</div>
            <div style={pointsHeroStyle}>{copy.points}</div>
            <p style={pointsLeadStyle}>{copy.pointsLead}</p>
            <div style={pointsBreakdownStyle}>
              {[
                { label: copy.pointRating, value: "+1", color: "#FABB05" },
                { label: copy.pointReview, value: "+10", color: "#EA4335" },
                { label: copy.pointAnswer, value: "+3", color: "#1A73E8" },
                { label: copy.pointPhoto, value: "+25", color: "#25A55F" },
              ].map((item) => (
                <div key={item.label} style={pointRowStyle}>
                  <span style={{ ...pointIconStyle, background: item.color }} />
                  <span style={pointLabelStyle}>{item.label}</span>
                  <span style={pointValueStyle}>{item.value}</span>
                </div>
              ))}
            </div>
            <div aria-hidden="true" style={{ display: "none" }}>
              {completedReview.storeName} {completedReview.rating} {completedReview.reviewText}
            </div>
            <button type="button" onClick={resetDemo} style={subtleResetStyle}>
              {t.done.restart.replace("← ", "")}
            </button>
            <div style={completeFooterStyle}>
              <div>{copy.googleDemoDisclaimer}</div>
              <div>Powered by <strong>REVIEW PRO</strong></div>
              <div>{copy.demoFootnote}</div>
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
          <div style={reviewProDemoBadgeStyle}>{copy.reviewProDemo}</div>
          <div style={reviewProDemoTitleStyle}>{copy.googleReviewExperience}</div>
          <LanguageSelect language={state.language} onChange={setLanguage} tone="dark" />
        </div>
        <div style={googleMockIntroStyle}>
          <span style={googleMockLineStyle} />
          <span>{copy.googleMockStarts}</span>
          <span style={googleMockLineStyle} />
        </div>
        <div style={googleMockCardStyle}>
          <div style={googleTopBarStyle}>
            <div style={googleHandleStyle}>G</div>
            <div style={googleTopTitleStyle}>{copy.postReview}</div>
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
                <div style={googlePublicNoteStyle}>{copy.publicOnGoogle}</div>
              </div>
            </div>
            <GoogleReviewStars rating={state.rating} language={state.language} />
            <label style={googleTextareaLabelStyle} htmlFor="demo-google-review">
              {copy.reviewBody}
            </label>
            <textarea
              id="demo-google-review"
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              rows={8}
              style={googleReviewTextareaStyle}
            />
            {state.copied && (
              <p style={googleCopiedNoteStyle}>{copy.copied}</p>
            )}
            <button type="button" onClick={submitReview} style={googlePostButtonStyle}>
              {copy.submitPost}
            </button>
            <button type="button" onClick={resetDemo} style={subtleResetStyle}>
              {t.done.restart.replace("← ", "")}
            </button>
          </div>
        </div>
        <div style={googleFrameFooterStyle}>
          <div>{copy.googleDemoDisclaimer}</div>
          <div>Powered by <strong>REVIEW PRO</strong></div>
          <div>{copy.demoFootnote}</div>
        </div>
      </section>
    </DemoShell>
  );
}

function GoogleReviewStars({ rating, language }: { rating: number; language: LangCode }) {
  const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));
  return (
    <div style={googleStarsWrapStyle} aria-label={demoCopy[language].ratingLabel.replace("{n}", String(safeRating))}>
      {[1, 2, 3, 4, 5].map((score) => (
        <span key={score} style={score <= safeRating ? googleStarActiveStyle : googleStarMutedStyle}>
          ★
        </span>
      ))}
    </div>
  );
}

function renderLines(text: string) {
  return text.split("\n").map((line, index) => (
    <span key={`${line}-${index}`}>
      {line}
      {index < text.split("\n").length - 1 && <br />}
    </span>
  ));
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

function DemoHeader({ progress, language = "ja", onLanguageChange }: { progress?: number; language?: LangCode; onLanguageChange?: (language: LangCode) => void }) {
  const t = getT(language);
  return (
    <div style={{ background: "#fff", padding: "22px 20px 18px", position: "relative", overflow: "hidden", borderBottom: "1px solid #F1F3F5" }}>
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#aaa", letterSpacing: "0.08em", marginBottom: "4px" }}>
            {t.header.label}
          </div>
          <div style={{ fontSize: "18px", fontWeight: 900, color: "#1a2533" }}>{STORE.name}</div>
        </div>
        {onLanguageChange && <LanguageSelect language={language} onChange={onLanguageChange} />}
      </div>
      {typeof progress === "number" && (
        <div style={{ marginTop: "14px", height: "4px", background: "#F1F3F5", borderRadius: "4px" }}>
          <div style={{ height: "100%", background: "#5BBF8A", borderRadius: "4px", width: `${progress}%`, transition: "width 0.5s ease" }} />
        </div>
      )}
    </div>
  );
}

function LowReviewHeader({ language, onLanguageChange }: { language: LangCode; onLanguageChange: (language: LangCode) => void }) {
  const t = getT(language);
  return (
    <div style={lowReviewHeaderStyle}>
      <div>
        <div style={lowReviewHeaderLabelStyle}>{t.header.label}</div>
        <div style={lowReviewHeaderStoreStyle}>{STORE.name}</div>
      </div>
      <LanguageSelect language={language} onChange={onLanguageChange} tone="dark" />
    </div>
  );
}

function PoweredBy({ language = "ja" }: { language?: LangCode }) {
  return (
    <div style={poweredByStyle}>
      Powered by <strong>REVIEW PRO</strong>
      <div style={demoFootnoteStyle}>{demoCopy[language].demoFootnote}</div>
    </div>
  );
}

function LanguageButtons({ language, onChange }: { language: LangCode; onChange: (language: LangCode) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginTop: "16px" }}>
      {LANGUAGE_LIST.map((item) => (
        <button
          key={item.code}
          type="button"
          onClick={() => onChange(item.code)}
          style={language === item.code ? languageButtonActiveStyle : languageButtonStyle}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function LanguageSelect({ language, onChange, tone = "light" }: { language: LangCode; onChange: (language: LangCode) => void; tone?: "light" | "dark" }) {
  return (
    <select
      value={language}
      onChange={(event) => onChange(event.target.value as LangCode)}
      aria-label="Language"
      style={tone === "dark" ? languageSelectDarkStyle : languageSelectStyle}
    >
      {LANGUAGE_LIST.map((item) => (
        <option key={item.code} value={item.code}>{item.label}</option>
      ))}
    </select>
  );
}

function StarRating({ value, onChange, labels }: { value: number; onChange: (value: number) => void; labels: [string, string, string, string, string, string] }) {
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
          <p style={{ margin: "4px 0 0", fontWeight: 700, color: "#1a2533", fontSize: "16px" }}>{labels[value]}</p>
        </div>
      )}
    </div>
  );
}

function MultiSelectQuestion({ question, selected, onChange, language, multiHint }: { question: Question; selected: string[]; onChange: (value: string[]) => void; language: LangCode; multiHint: string }) {
  return (
    <>
      <p style={{ textAlign: "center", color: "#aaa", fontSize: "12px", margin: "-12px 0 20px" }}>{multiHint}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {question.options?.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(isSelected ? selected.filter((item) => item !== option.value) : [...selected, option.value])}
              style={isSelected ? multiSelectedStyle : multiButtonStyle}
            >
              {option.labels[language]}{isSelected && <span style={{ color: "#2C7A4B", fontSize: "16px" }}>✓</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}

function SelectQuestion({ options, value, onChange, language, columns = 2 }: { options: { value: string; labels: Record<LangCode, string> }[]; value: string; onChange: (value: string) => void; language: LangCode; columns?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "10px" }}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={selected ? selectSelectedStyle : selectButtonStyle}
          >
            {option.labels[language]}
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({ style, text, selected, onSelect }: { style: { key: StyleKey; label: string; emoji: string; selected: string; use: string }; text: string; selected: boolean; onSelect: () => void }) {
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
        {selected ? style.selected : style.use}
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

function buildStyles(t: ReturnType<typeof getT>, language: LangCode) {
  return STYLE_KEYS.map((key) => ({
    key,
    label: t.styles[key].label,
    emoji: t.styles[key].emoji,
    selected: demoCopy[language].selected,
    use: demoCopy[language].useReview,
  }));
}

function buildAnswersForGenerate(state: DemoState) {
  const result = { rating: state.rating, menu: "", party: "", highlight: [] as string[], feel: "", gender: state.gender, age: state.age };
  baseQuestions.forEach((question) => {
    const answer = state.answers[question.id];
    if (question.type === "stars") result.rating = Number(answer || 0);
    else if (question.type === "multi" && Array.isArray(answer)) result.highlight = answer;
    else if (typeof answer === "string") {
      if (question.id === 2) result.menu = answer;
      else if (question.id === 3) result.party = answer;
      else if (question.id === 5) result.feel = answer;
      else if (!result.feel) result.feel = answer;
    }
  });
  return result;
}

function localizeAnswer(value: string, language: LangCode) {
  for (const question of demoQuestions) {
    const option = question.options?.find((item) => item.value === value);
    if (option) return option.labels[language];
  }
  return value;
}

function localizeList(values: string[], language: LangCode) {
  const localized = values.map((value) => localizeAnswer(value, language));
  if (language === "en") return localized.join(", ");
  if (language === "ko") return localized.join(", ");
  return localized.join("、");
}

function buildReviews(answers: ReturnType<typeof buildAnswersForGenerate>, language: LangCode, seed = 0): Record<StyleKey, string> {
  const highlights = answers.highlight.length ? localizeList(answers.highlight, language) : localizeAnswer("スタッフの対応", language);
  const menu = answers.menu ? localizeAnswer(answers.menu, language) : localizeAnswer("全身脱毛", language);
  const party = answers.party ? localizeAnswer(answers.party, language) : localizeAnswer("1人", language);
  const feel = answers.feel ? localizeAnswer(answers.feel, language) : localizeAnswer("安心して通える", language);
  const age = answers.age ? localizeAnswer(answers.age, language) : "";
  const suffixJa = seed % 2 === 0 ? "またお願いしたいと思います。" : "次回も利用したいです。";

  if (language === "en") {
    const ageHint = age ? `It felt natural and comfortable for someone in their ${age}, ` : "";
    const feelText = answers.feel === "安心して通える"
      ? "trustworthy and reassuring"
      : feel.charAt(0).toLowerCase() + feel.slice(1);
    const genderHint = answers.gender === "男性"
      ? "and it was easy to ask questions as a male customer. "
      : answers.gender === "女性"
        ? "and I appreciated the thoughtful details from a female perspective. "
        : "";
    const formalGenderHint = answers.gender === "男性"
      ? " and it was easy to ask questions as a male customer"
      : answers.gender === "女性"
        ? " and I appreciated the thoughtful details from a female perspective"
        : "";
    return {
      casual: `I visited as ${party} and had ${menu}. The ${highlights} stood out in a really positive way. ${ageHint}${genderHint}It felt like ${feelText}, and I could relax even on my first visit. ${seed % 2 === 0 ? "I would definitely come back." : "I would like to visit again."}`,
      honest: `There was no pushy guidance, and everything from the explanation to the treatment felt calm. For ${menu}, the ${highlights} left a good impression. It was easy to visit as ${party}, and overall it felt like ${feelText}.`,
      formal: `I visited for ${menu}. The staff were polite${formalGenderHint}, and I was satisfied with the ${highlights}. The atmosphere was comfortable even for ${party}, and I felt this is a salon where customers can feel ${feelText}.`,
    };
  }

  if (language === "zh") {
    const ageHint = age ? `对${age}的我来说氛围也很自然，` : "";
    const genderHint = answers.gender === "男性"
      ? "男性顾客也很容易咨询，"
      : answers.gender === "女性"
        ? "从女性角度也能感受到细致的照顾，"
        : "";
    return {
      casual: `我和${party}一起到店，体验了${menu}。特别满意的是${highlights}。${ageHint}${genderHint}整体感觉${feel}，第一次来也能放松。${seed % 2 === 0 ? "还想再来。" : "下次也想继续使用。"}`,
      honest: `没有强硬推销，从说明到施术都能安心接受。${menu}中让我印象深刻的是${highlights}。${party}也很方便到店，整体感受是${feel}。`,
      formal: `此次体验了${menu}。${genderHint}工作人员的服务也很细致。对${highlights}很满意，${party}到店也能舒适度过，是一家让人觉得${feel}的沙龙。`,
    };
  }

  if (language === "ko") {
    const ageHint = age ? `${age}인 저에게도 자연스럽게 맞는 분위기였고, ` : "";
    const genderHint = answers.gender === "男性"
      ? "남성도 상담하기 편했고, "
      : answers.gender === "女性"
        ? "여성 입장에서도 세심한 배려가 느껴졌고, "
        : "";
    return {
      casual: `${party}으로 방문해서 ${menu}을 이용했습니다. 특히 ${highlights}가 좋았습니다. ${ageHint}${genderHint}${feel}라고 느껴져서 처음이어도 편하게 받을 수 있었습니다. ${seed % 2 === 0 ? "다시 이용하고 싶습니다." : "다음에도 방문하고 싶습니다."}`,
      honest: `무리한 안내가 없고 설명부터 시술까지 차분하게 받을 수 있었습니다. ${menu}에서는 ${highlights}가 인상적이었습니다. ${party}으로도 이용하기 편했고 전체적으로 ${feel}라는 느낌이었습니다.`,
      formal: `${menu}로 방문했습니다. ${genderHint}직원분들의 응대도 정중했습니다. ${highlights}에 만족했고, ${party} 방문에도 편안한 분위기였습니다. ${feel} 살롱이라고 생각합니다.`,
    };
  }

  const ageHint = answers.age ? `${age}の自分にも自然に合う雰囲気で、` : "";
  const genderHint = answers.gender === "男性"
    ? "男性でも相談しやすく、"
    : answers.gender === "女性"
      ? "女性目線でも細かな配慮を感じ、"
      : "";

  return {
    casual: `${party}で利用しました。${menu}をお願いしましたが、${highlights}が特に良かったです。${ageHint}${genderHint}${feel}と感じられて、初めてでもリラックスできました。${suffixJa}`,
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
const languageButtonActiveStyle: React.CSSProperties = { ...languageButtonStyle, border: "1.5px solid #2C7A4B", background: "#2C7A4B", color: "#fff" };
const languageSelectStyle: React.CSSProperties = { minWidth: "92px", height: "32px", borderRadius: "999px", border: "1px solid #E5E7EB", background: "#fff", color: "#555", fontFamily: "inherit", fontSize: "11px", fontWeight: 800, padding: "0 8px", outline: "none" };
const languageSelectDarkStyle: React.CSSProperties = { ...languageSelectStyle, border: "1px solid rgba(255,255,255,0.24)", background: "rgba(255,255,255,0.12)", color: "#fff" };
const poweredByStyle: React.CSSProperties = { marginTop: "auto", paddingTop: "18px", textAlign: "center", color: "#B0B7C0", fontSize: "11px", lineHeight: 1.8 };
const demoFootnoteStyle: React.CSSProperties = { color: "#C2C7CF", fontSize: "10px", fontWeight: 400 };
const lowReviewHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", background: "#123225", color: "#fff", padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.08)" };
const lowReviewHeaderLabelStyle: React.CSSProperties = { color: "#BFE8D0", fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", marginBottom: "5px" };
const lowReviewHeaderStoreStyle: React.CSSProperties = { color: "#fff", fontSize: "18px", fontWeight: 900, lineHeight: 1.35 };
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
