export type LangCode = "ja" | "en" | "zh" | "ko";

export interface LangDef {
  code: LangCode;
  label: string;
}

// 言語追加時: LANGUAGE_LIST にエントリを追加し、translations に翻訳を追加する
export const LANGUAGE_LIST: LangDef[] = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
  // { code: "th", label: "ภาษาไทย" },
  // { code: "vi", label: "Tiếng Việt" },
  // { code: "es", label: "Español" },
  // { code: "pt", label: "Português" },
];

export interface Translations {
  loading: string;
  notFound: { title: string; message: string };
  header: { label: string };
  welcome: { title: string; subtitle: string; features: [string, string, string] };
  questions: { back: string; multiHint: string };
  generating: { title: string };
  styles: {
    casual: { label: string; emoji: string };
    honest: { label: string; emoji: string };
    formal: { label: string; emoji: string };
  };
  done: {
    title: string;
    subtitle: string;
    regen: string;
    regenCount: string;
    hint: { title: string; steps: [string, string, string] };
    postButton: string;
    copiedButton: string;
    restart: string;
  };
  lowReview: {
    title: string;
    subtitle: string;
    improve: string;
    comment: string;
    placeholder: string;
    submit: string;
    submitting: string;
  };
  lowReviewDone: { title: string; message: string };
  buttons: { next: string; start: string; create: string };
  footer: string;
  ratings: [string, string, string, string, string, string];
  issues: Record<string, string>;
}

export const JA_ISSUES = [
  "スタッフの対応",
  "待ち時間",
  "施術の効果",
  "清潔感",
  "価格・コスパ",
  "予約のしにくさ",
  "設備・環境",
  "説明不足",
];

const translations: Record<LangCode, Translations> = {
  ja: {
    loading: "読み込み中...",
    notFound: { title: "ページが見つかりません", message: "URLをご確認ください" },
    header: { label: "口コミ投稿フォーム" },
    welcome: {
      title: "ご来店ありがとう\nございました！",
      subtitle: "{n}つの質問に答えるだけで\nAIが口コミ文を自動で作ります",
      features: ["⚡ 約1分で完了", "📱 選ぶだけ・入力不要", "✨ AIが3パターン生成"],
    },
    questions: { back: "← 前の質問に戻る", multiHint: "複数選択OK" },
    generating: { title: "3パターン同時生成中..." },
    styles: {
      casual: { label: "フレンドリー", emoji: "😊" },
      honest: { label: "リアル", emoji: "🎯" },
      formal: { label: "丁寧", emoji: "✨" },
    },
    done: {
      title: "3パターン生成完了！",
      subtitle: "気に入った文章を選んで投稿してください",
      regen: "選択中の文章を再生成",
      regenCount: "（{n}回再生成済み）",
      hint: {
        title: "📋 あと1ステップで完了！",
        steps: [
          "下のボタンを押す（テキスト自動コピー）",
          "Googleの投稿画面が自動で開く",
          "長押しで貼り付け → 送信！",
        ],
      },
      postButton: "この文章でGoogleに投稿する",
      copiedButton: "✅ コピー完了！Googleを開いています...",
      restart: "← 最初からやり直す",
    },
    lowReview: {
      title: "貴重なご意見をお聞かせください",
      subtitle: "ご不満な点を教えていただくことで\nサービス改善に活かします",
      improve: "改善してほしい点は？（複数選択可）",
      comment: "詳しく教えてください（任意）",
      placeholder: "ご不満な点や改善してほしいことをご自由にお書きください",
      submit: "ご意見を送る",
      submitting: "送信中...",
    },
    lowReviewDone: {
      title: "ご意見ありがとうございます",
      message: "いただいたご意見はサービス改善に\n活かしてまいります。\nまたのご来店をお待ちしております。",
    },
    buttons: { next: "次へ →", start: "はじめる →", create: "✨ 口コミ文を3パターン作成する" },
    footer: "Powered by REVIEW PRO",
    ratings: ["", "残念でした", "もう少し", "普通", "良かった！", "最高でした！"],
    issues: Object.fromEntries(JA_ISSUES.map(k => [k, k])),
  },

  en: {
    loading: "Loading...",
    notFound: { title: "Page not found", message: "Please check the URL" },
    header: { label: "Review Submission Form" },
    welcome: {
      title: "Thank you for\nvisiting us!",
      subtitle: "Answer {n} questions and\nAI will write your review",
      features: ["⚡ Takes about 1 minute", "📱 Just tap – no typing needed", "✨ AI creates 3 review styles"],
    },
    questions: { back: "← Back to previous question", multiHint: "Multiple selection OK" },
    generating: { title: "Generating 3 styles simultaneously..." },
    styles: {
      casual: { label: "Friendly", emoji: "😊" },
      honest: { label: "Real", emoji: "🎯" },
      formal: { label: "Polite", emoji: "✨" },
    },
    done: {
      title: "3 styles generated!",
      subtitle: "Choose your favorite and post it",
      regen: "Regenerate selected text",
      regenCount: "(regenerated {n} time(s))",
      hint: {
        title: "📋 One more step!",
        steps: [
          "Press the button below (text is auto-copied)",
          "Google review page opens automatically",
          "Long press to paste → Submit!",
        ],
      },
      postButton: "Post this review to Google",
      copiedButton: "✅ Copied! Opening Google...",
      restart: "← Start over",
    },
    lowReview: {
      title: "Please share your feedback",
      subtitle: "Your feedback helps us\nimprove our service",
      improve: "What needs improvement? (Multiple OK)",
      comment: "More details (optional)",
      placeholder: "Please share any concerns or suggestions freely",
      submit: "Submit Feedback",
      submitting: "Submitting...",
    },
    lowReviewDone: {
      title: "Thank you for your feedback",
      message: "Your feedback will be used to improve our service.\nWe look forward to seeing you again.",
    },
    buttons: { next: "Next →", start: "Get Started →", create: "✨ Create 3 Review Styles" },
    footer: "Powered by REVIEW PRO",
    ratings: ["", "Disappointing", "Could be better", "Average", "Good!", "Outstanding!"],
    issues: {
      "スタッフの対応": "Staff attitude",
      "待ち時間": "Wait time",
      "施術の効果": "Treatment results",
      "清潔感": "Cleanliness",
      "価格・コスパ": "Price / Value",
      "予約のしにくさ": "Booking difficulty",
      "設備・環境": "Facilities",
      "説明不足": "Lack of explanation",
    },
  },

  zh: {
    loading: "加载中...",
    notFound: { title: "页面未找到", message: "请检查URL" },
    header: { label: "评价提交表单" },
    welcome: {
      title: "感谢您的光临！",
      subtitle: "回答{n}个问题，\nAI将自动生成评价",
      features: ["⚡ 约1分钟完成", "📱 只需选择，无需输入", "✨ AI生成3种风格"],
    },
    questions: { back: "← 返回上一问题", multiHint: "可多选" },
    generating: { title: "正在同时生成3种风格..." },
    styles: {
      casual: { label: "亲切", emoji: "😊" },
      honest: { label: "真实", emoji: "🎯" },
      formal: { label: "正式", emoji: "✨" },
    },
    done: {
      title: "3种风格生成完成！",
      subtitle: "选择您喜欢的文章并提交",
      regen: "重新生成选中的文章",
      regenCount: "（已重新生成{n}次）",
      hint: {
        title: "📋 最后一步！",
        steps: [
          "点击下方按钮（文字自动复制）",
          "自动打开Google评价页面",
          "长按粘贴 → 提交！",
        ],
      },
      postButton: "在Google上发布此评价",
      copiedButton: "✅ 已复制！正在打开Google...",
      restart: "← 重新开始",
    },
    lowReview: {
      title: "请分享您的宝贵意见",
      subtitle: "请告知我们不满之处，\n我们将努力改善服务",
      improve: "哪些方面需要改进？（可多选）",
      comment: "详细说明（选填）",
      placeholder: "请随意填写您的不满或建议",
      submit: "提交反馈",
      submitting: "提交中...",
    },
    lowReviewDone: {
      title: "感谢您的反馈",
      message: "我们将根据您的意见改善服务。\n期待您的再次光临。",
    },
    buttons: { next: "下一步 →", start: "开始 →", create: "✨ 生成3种评价风格" },
    footer: "Powered by REVIEW PRO",
    ratings: ["", "很遗憾", "还需改进", "一般", "不错！", "非常棒！"],
    issues: {
      "スタッフの対応": "员工服务态度",
      "待ち時間": "等待时间",
      "施術の効果": "施术效果",
      "清潔感": "清洁度",
      "価格・コスパ": "价格/性价比",
      "予約のしにくさ": "预约困难",
      "設備・環境": "设施/环境",
      "説明不足": "说明不足",
    },
  },

  ko: {
    loading: "로딩 중...",
    notFound: { title: "페이지를 찾을 수 없습니다", message: "URL을 확인해 주세요" },
    header: { label: "리뷰 작성 폼" },
    welcome: {
      title: "방문해 주셔서\n감사합니다!",
      subtitle: "{n}가지 질문에 답하면\nAI가 자동으로 리뷰를 작성합니다",
      features: ["⚡ 약 1분 소요", "📱 선택만 하면 OK", "✨ AI가 3가지 패턴 생성"],
    },
    questions: { back: "← 이전 질문으로 돌아가기", multiHint: "복수 선택 가능" },
    generating: { title: "3가지 패턴 동시 생성 중..." },
    styles: {
      casual: { label: "친근하게", emoji: "😊" },
      honest: { label: "솔직하게", emoji: "🎯" },
      formal: { label: "정중하게", emoji: "✨" },
    },
    done: {
      title: "3가지 패턴 생성 완료!",
      subtitle: "마음에 드는 문장을 선택하여 제출하세요",
      regen: "선택한 문장 재생성",
      regenCount: "({n}회 재생성됨)",
      hint: {
        title: "📋 마지막 단계!",
        steps: [
          "아래 버튼을 누르세요 (텍스트 자동 복사)",
          "Google 리뷰 페이지가 자동으로 열립니다",
          "길게 눌러 붙여넣기 → 제출!",
        ],
      },
      postButton: "이 문장으로 Google에 리뷰 올리기",
      copiedButton: "✅ 복사 완료! Google을 열고 있습니다...",
      restart: "← 처음부터 다시 시작",
    },
    lowReview: {
      title: "소중한 의견을 들려주세요",
      subtitle: "불편하신 점을 알려주시면\n서비스 개선에 반영하겠습니다",
      improve: "개선이 필요한 점은? (복수 선택 가능)",
      comment: "자세한 내용 (선택 사항)",
      placeholder: "불만족스러운 점이나 개선 사항을 자유롭게 작성해 주세요",
      submit: "의견 제출",
      submitting: "제출 중...",
    },
    lowReviewDone: {
      title: "의견 감사합니다",
      message: "소중한 의견은 서비스 개선에\n활용하겠습니다.\n다음에 또 방문해 주세요.",
    },
    buttons: { next: "다음 →", start: "시작하기 →", create: "✨ 리뷰 3가지 패턴 만들기" },
    footer: "Powered by REVIEW PRO",
    ratings: ["", "아쉬웠어요", "조금 부족해요", "보통이에요", "좋았어요!", "최고였어요!"],
    issues: {
      "スタッフの対応": "직원 응대",
      "待ち時間": "대기 시간",
      "施術の効果": "시술 효과",
      "清潔感": "청결도",
      "価格・コスパ": "가격/가성비",
      "予約のしにくさ": "예약 어려움",
      "設備・環境": "시설/환경",
      "説明不足": "설명 부족",
    },
  },
};

export function getT(lang: LangCode): Translations {
  return translations[lang] ?? translations.ja;
}
