import type { SupabaseClient } from "@supabase/supabase-js";

export type AnalyticsPeriod = "this_month" | "last_month" | "last_30_days" | "last_3_months";

export type Comparison = {
  kind: "percent" | "point" | "delta" | "new" | "none";
  value: number | null;
};

export type KpiValue = {
  value: number | null;
  previous: number | null;
  comparison: Comparison;
};

export type FunnelStep = {
  key: string;
  label: string;
  count: number;
  rateFromPrevious: number | null;
};

export type RatingDistributionItem = {
  rating: number;
  count: number;
  rate: number;
};

export type QuestionOptionMetric = {
  label: string;
  count: number;
  rate: number;
};

export type QuestionAnalysis = {
  key: string;
  questionOrder: number;
  questionLabel: string;
  questionType: string;
  responseCount: number;
  average: number | null;
  distribution: RatingDistributionItem[];
  options: QuestionOptionMetric[];
  note?: string;
};

export type AnswerTrend = {
  label: string;
  questionLabel: string;
  questionType: string;
  count: number;
  rate: number;
};

export type FeedbackSummary = {
  count: number;
  issueRanking: QuestionOptionMetric[];
  ratingDistribution: RatingDistributionItem[];
  recentComments: {
    rating: number;
    comment: string;
    createdAt: string;
  }[];
};

export type AnalyticsDashboardData = {
  locked: false;
  period: AnalyticsPeriod;
  range: { start: string; end: string; label: string };
  previousRange: { start: string; end: string; label: string };
  collectionStartedAt: string | null;
  kpis: {
    qrAccess: KpiValue;
    surveyStarted: KpiValue;
    surveyCompleted: KpiValue;
    completionRate: KpiValue;
    averageRating: KpiValue;
    highRatingRate: KpiValue;
    lowRatingRate: KpiValue;
    googleReviewClicked: KpiValue;
    googleReviewClickRate: KpiValue;
    aiGeneratedSessions: KpiValue;
    aiGeneratedEvents: KpiValue;
  };
  funnel: FunnelStep[];
  ratingDistribution: RatingDistributionItem[];
  answerTrends: AnswerTrend[];
  questions: QuestionAnalysis[];
  feedback: FeedbackSummary;
};

export type LockedAnalyticsDashboardData = {
  locked: true;
  plan: string;
  message: string;
};

type EventRow = {
  session_id: string | null;
  event_type: string;
};

type SessionRow = {
  session_id: string;
  rating: number | null;
};

type AnswerRow = {
  session_id: string;
  question_id: number | null;
  question_order: number;
  question_label: string;
  question_type: string;
  answer_value: unknown;
};

type FeedbackRow = {
  rating: number | null;
  issues: unknown;
  comment: string | null;
  created_at: string;
};

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function jstNowParts(now: Date) {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  return {
    year: jst.getUTCFullYear(),
    month: jst.getUTCMonth(),
    date: jst.getUTCDate(),
    hours: jst.getUTCHours(),
    minutes: jst.getUTCMinutes(),
    seconds: jst.getUTCSeconds(),
    ms: jst.getUTCMilliseconds(),
  };
}

function fromJstParts(
  year: number,
  month: number,
  date: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0,
) {
  return new Date(Date.UTC(year, month, date, hours - 9, minutes, seconds, ms));
}

function addMonths(date: Date, months: number) {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return fromJstParts(
    jst.getUTCFullYear(),
    jst.getUTCMonth() + months,
    jst.getUTCDate(),
    jst.getUTCHours(),
    jst.getUTCMinutes(),
    jst.getUTCSeconds(),
    jst.getUTCMilliseconds(),
  );
}

function formatJstDate(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function normalizeAnalyticsPeriod(value: string | null): AnalyticsPeriod {
  if (value === "last_month" || value === "last_30_days" || value === "last_3_months") return value;
  return "this_month";
}

export function getAnalyticsPeriodRange(period: AnalyticsPeriod, now = new Date()) {
  const parts = jstNowParts(now);
  let start: Date;
  let end: Date;
  let previousStart: Date;
  let previousEnd: Date;
  let label: string;
  let previousLabel: string;

  if (period === "this_month") {
    start = fromJstParts(parts.year, parts.month, 1);
    end = fromJstParts(parts.year, parts.month + 1, 1);
    previousStart = fromJstParts(parts.year, parts.month - 1, 1);
    previousEnd = start;
    label = "今月";
    previousLabel = "先月";
  } else if (period === "last_month") {
    start = fromJstParts(parts.year, parts.month - 1, 1);
    end = fromJstParts(parts.year, parts.month, 1);
    previousStart = fromJstParts(parts.year, parts.month - 2, 1);
    previousEnd = start;
    label = "先月";
    previousLabel = "前々月";
  } else if (period === "last_30_days") {
    end = now;
    start = new Date(end.getTime() - 30 * DAY_MS);
    previousEnd = start;
    previousStart = new Date(previousEnd.getTime() - 30 * DAY_MS);
    label = "過去30日";
    previousLabel = "直前30日";
  } else {
    end = now;
    start = addMonths(end, -3);
    previousEnd = start;
    previousStart = addMonths(previousEnd, -3);
    label = "過去3ヶ月";
    previousLabel = "直前3ヶ月";
  }

  return {
    start,
    end,
    previousStart,
    previousEnd,
    label,
    previousLabel,
  };
}

function sessionSet(rows: EventRow[], eventType: string) {
  return new Set(rows.filter((row) => row.event_type === eventType && row.session_id).map((row) => row.session_id as string));
}

function eventCount(rows: EventRow[], eventType: string) {
  return rows.filter((row) => row.event_type === eventType).length;
}

function safeRate(numerator: number, denominator: number) {
  if (!denominator) return null;
  return numerator / denominator;
}

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function compareCount(current: number, previous: number): Comparison {
  if (previous > 0) return { kind: "percent", value: (current - previous) / previous };
  if (current > 0) return { kind: "new", value: null };
  return { kind: "none", value: null };
}

function comparePoint(current: number | null, previous: number | null): Comparison {
  if (current == null || previous == null) return { kind: "none", value: null };
  return { kind: "point", value: current - previous };
}

function kpi(current: number | null, previous: number | null, mode: "count" | "point" = "count"): KpiValue {
  return {
    value: current,
    previous,
    comparison: mode === "point" ? comparePoint(current, previous) : compareCount(current ?? 0, previous ?? 0),
  };
}

function ratingDistribution(ratings: number[]): RatingDistributionItem[] {
  const total = ratings.length;
  return [5, 4, 3, 2, 1].map((rating) => {
    const count = ratings.filter((value) => value === rating).length;
    return { rating, count, rate: safeRate(count, total) ?? 0 };
  });
}

function uniqueSessionCount(rows: AnswerRow[]) {
  return new Set(rows.map((row) => row.session_id)).size;
}

function answerValueToItems(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (value == null || value === "") return [];
  return [String(value)];
}

function questionKey(row: AnswerRow) {
  return `${row.question_order}::${row.question_label}::${row.question_type}`;
}

function buildQuestionAnalysis(rows: AnswerRow[]): QuestionAnalysis[] {
  const groups = new Map<string, AnswerRow[]>();
  rows.forEach((row) => {
    const key = questionKey(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });

  return Array.from(groups.entries())
    .sort((a, b) => {
      const aRow = a[1][0];
      const bRow = b[1][0];
      return aRow.question_order - bRow.question_order || aRow.question_label.localeCompare(bRow.question_label, "ja");
    })
    .map(([key, group]) => {
      const first = group[0];
      const responseCount = uniqueSessionCount(group);
      const base = {
        key,
        questionOrder: first.question_order,
        questionLabel: first.question_label,
        questionType: first.question_type,
        responseCount,
      };

      if (first.question_type === "stars") {
        const ratings = group
          .map((row) => Number(row.answer_value))
          .filter((value) => Number.isInteger(value) && value >= 1 && value <= 5);
        return {
          ...base,
          average: average(ratings),
          distribution: ratingDistribution(ratings),
          options: [],
        };
      }

      if (first.question_type === "select" || first.question_type === "multi") {
        const counts = new Map<string, number>();
        group.forEach((row) => {
          const selected = answerValueToItems(row.answer_value);
          const uniqueSelected = first.question_type === "multi" ? Array.from(new Set(selected)) : selected.slice(0, 1);
          uniqueSelected.forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));
        });
        const options = Array.from(counts.entries())
          .map(([label, count]) => ({ label, count, rate: safeRate(count, responseCount) ?? 0 }))
          .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja"));
        return {
          ...base,
          average: null,
          distribution: [],
          options,
          note: first.question_type === "multi" ? "複数選択のため、割合の合計が100%を超える場合があります。" : undefined,
        };
      }

      return {
        ...base,
        average: null,
        distribution: [],
        options: [],
        note: "テキスト回答は件数のみ表示しています。",
      };
    });
}

function buildAnswerTrends(questions: QuestionAnalysis[]): AnswerTrend[] {
  return questions
    .filter((question) => question.questionType === "select" || question.questionType === "multi")
    .flatMap((question) =>
      question.options.map((option) => ({
        label: option.label,
        questionLabel: question.questionLabel,
        questionType: question.questionType,
        count: option.count,
        rate: option.rate,
      })),
    )
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja"))
    .slice(0, 8);
}

function buildFeedbackSummary(rows: FeedbackRow[]): FeedbackSummary {
  const issueCounts = new Map<string, number>();
  const ratings = rows
    .map((row) => Number(row.rating))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 5);

  rows.forEach((row) => {
    if (!Array.isArray(row.issues)) return;
    Array.from(new Set(row.issues.map((issue) => String(issue)).filter(Boolean))).forEach((issue) => {
      issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
    });
  });

  const issueRanking = Array.from(issueCounts.entries())
    .map(([label, count]) => ({ label, count, rate: safeRate(count, rows.length) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja"))
    .slice(0, 8);

  const recentComments = rows
    .filter((row) => row.comment?.trim())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((row) => ({
      rating: Number(row.rating) || 0,
      comment: String(row.comment).slice(0, 300),
      createdAt: row.created_at,
    }));

  return {
    count: rows.length,
    issueRanking,
    ratingDistribution: ratingDistribution(ratings),
    recentComments,
  };
}

async function fetchEvents(supabase: SupabaseClient, storeId: string, start: Date, end: Date) {
  const { data, error } = await supabase
    .from("survey_events")
    .select("session_id,event_type")
    .eq("store_id", storeId)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .limit(10000);
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

async function fetchSessions(supabase: SupabaseClient, storeId: string, start: Date, end: Date) {
  const { data, error } = await supabase
    .from("survey_sessions")
    .select("session_id,rating")
    .eq("store_id", storeId)
    .not("rating", "is", null)
    .gte("completed_at", start.toISOString())
    .lt("completed_at", end.toISOString())
    .limit(10000);
  if (error) throw error;
  return (data ?? []) as SessionRow[];
}

async function fetchAnswers(supabase: SupabaseClient, storeId: string, start: Date, end: Date) {
  const { data, error } = await supabase
    .from("survey_answers")
    .select("session_id,question_id,question_order,question_label,question_type,answer_value")
    .eq("store_id", storeId)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .limit(10000);
  if (error) throw error;
  return (data ?? []) as AnswerRow[];
}

async function fetchFeedback(supabase: SupabaseClient, storeId: string, start: Date, end: Date) {
  const { data, error } = await supabase
    .from("feedback")
    .select("rating,issues,comment,created_at")
    .eq("store_id", storeId)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as FeedbackRow[];
}

async function fetchCollectionStartedAt(supabase: SupabaseClient, storeId: string) {
  const { data, error } = await supabase
    .from("survey_events")
    .select("created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.created_at ?? null;
}

function eventSummary(events: EventRow[], sessions: SessionRow[]) {
  const qrAccess = sessionSet(events, "qr_access").size;
  const surveyStarted = sessionSet(events, "survey_started").size;
  const surveyCompleted = sessionSet(events, "survey_completed").size;
  const googleReviewClicked = sessionSet(events, "google_review_clicked").size;
  const aiGeneratedSessionCount = sessionSet(events, "ai_generated").size;
  const aiGeneratedEventCount = eventCount(events, "ai_generated");
  const ratings = sessions
    .map((session) => Number(session.rating))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 5);
  const highRatings = ratings.filter((rating) => rating >= 4).length;
  const lowRatings = ratings.filter((rating) => rating <= 2).length;

  return {
    qrAccess,
    surveyStarted,
    surveyCompleted,
    completionRate: safeRate(surveyCompleted, surveyStarted),
    averageRating: average(ratings),
    highRatingRate: safeRate(highRatings, ratings.length),
    lowRatingRate: safeRate(lowRatings, ratings.length),
    googleReviewClicked,
    googleReviewClickRate: safeRate(googleReviewClicked, surveyCompleted),
    aiGeneratedSessionCount,
    aiGeneratedEventCount,
    ratings,
  };
}

export async function buildAnalyticsDashboard(
  supabase: SupabaseClient,
  storeId: string,
  period: AnalyticsPeriod,
): Promise<AnalyticsDashboardData> {
  const range = getAnalyticsPeriodRange(period);
  const [events, previousEvents, sessions, previousSessions, answers, feedback, collectionStartedAt] = await Promise.all([
    fetchEvents(supabase, storeId, range.start, range.end),
    fetchEvents(supabase, storeId, range.previousStart, range.previousEnd),
    fetchSessions(supabase, storeId, range.start, range.end),
    fetchSessions(supabase, storeId, range.previousStart, range.previousEnd),
    fetchAnswers(supabase, storeId, range.start, range.end),
    fetchFeedback(supabase, storeId, range.start, range.end),
    fetchCollectionStartedAt(supabase, storeId),
  ]);

  const current = eventSummary(events, sessions);
  const previous = eventSummary(previousEvents, previousSessions);
  const questions = buildQuestionAnalysis(answers);

  return {
    locked: false,
    period,
    range: {
      start: range.start.toISOString(),
      end: range.end.toISOString(),
      label: range.label,
    },
    previousRange: {
      start: range.previousStart.toISOString(),
      end: range.previousEnd.toISOString(),
      label: range.previousLabel,
    },
    collectionStartedAt,
    kpis: {
      qrAccess: kpi(current.qrAccess, previous.qrAccess),
      surveyStarted: kpi(current.surveyStarted, previous.surveyStarted),
      surveyCompleted: kpi(current.surveyCompleted, previous.surveyCompleted),
      completionRate: kpi(current.completionRate, previous.completionRate, "point"),
      averageRating: kpi(current.averageRating, previous.averageRating, "point"),
      highRatingRate: kpi(current.highRatingRate, previous.highRatingRate, "point"),
      lowRatingRate: kpi(current.lowRatingRate, previous.lowRatingRate, "point"),
      googleReviewClicked: kpi(current.googleReviewClicked, previous.googleReviewClicked),
      googleReviewClickRate: kpi(current.googleReviewClickRate, previous.googleReviewClickRate, "point"),
      aiGeneratedSessions: kpi(current.aiGeneratedSessionCount, previous.aiGeneratedSessionCount),
      aiGeneratedEvents: kpi(current.aiGeneratedEventCount, previous.aiGeneratedEventCount),
    },
    funnel: [
      { key: "qr_access", label: "QRアクセス", count: current.qrAccess, rateFromPrevious: null },
      {
        key: "survey_started",
        label: "アンケート開始",
        count: current.surveyStarted,
        rateFromPrevious: safeRate(current.surveyStarted, current.qrAccess),
      },
      {
        key: "survey_completed",
        label: "アンケート完了",
        count: current.surveyCompleted,
        rateFromPrevious: safeRate(current.surveyCompleted, current.surveyStarted),
      },
      {
        key: "ai_generated",
        label: "AI生成到達",
        count: current.aiGeneratedSessionCount,
        rateFromPrevious: safeRate(current.aiGeneratedSessionCount, current.surveyCompleted),
      },
      {
        key: "google_review_clicked",
        label: "Google口コミページ遷移",
        count: current.googleReviewClicked,
        rateFromPrevious: safeRate(current.googleReviewClicked, current.aiGeneratedSessionCount),
      },
    ],
    ratingDistribution: ratingDistribution(current.ratings),
    answerTrends: buildAnswerTrends(questions),
    questions,
    feedback: buildFeedbackSummary(feedback),
  };
}

export function formatCollectionStartedAt(value: string | null) {
  return value ? formatJstDate(new Date(value)) : null;
}
