"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  AnalyticsDashboardData,
  AnalyticsPeriod,
  Comparison,
  KpiValue,
  LockedAnalyticsDashboardData,
  QuestionAnalysis,
} from "../../lib/analyticsDashboard";
import { formatCollectionStartedAt } from "../../lib/analyticsDashboard";

type DashboardResponse = AnalyticsDashboardData | LockedAnalyticsDashboardData;

const PERIOD_OPTIONS: { key: AnalyticsPeriod; label: string }[] = [
  { key: "this_month", label: "今月" },
  { key: "last_month", label: "先月" },
  { key: "last_30_days", label: "過去30日" },
  { key: "last_3_months", label: "過去3ヶ月" },
];

function formatNumber(value: number | null) {
  if (value == null || Number.isNaN(value)) return "-";
  return Math.round(value).toLocaleString("ja-JP");
}

function formatRate(value: number | null) {
  if (value == null || Number.isNaN(value)) return "-";
  return `${Math.round(value * 100)}%`;
}

function formatAverage(value: number | null) {
  if (value == null || Number.isNaN(value)) return "-";
  return value.toFixed(1);
}

function formatComparison(comparison: Comparison, mode: "count" | "point" = "count") {
  if (comparison.kind === "new") return "新規";
  if (comparison.kind === "none" || comparison.value == null || Number.isNaN(comparison.value)) return "-";
  if (mode === "point") {
    const value = comparison.value * 100;
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(0)}pt`;
  }
  if (comparison.kind === "delta") {
    const sign = comparison.value > 0 ? "+" : "";
    return `${sign}${comparison.value.toFixed(1)}`;
  }
  const percent = comparison.value * 100;
  const sign = percent > 0 ? "+" : "";
  return `${sign}${Math.round(percent)}%`;
}

function formatAverageComparison(comparison: Comparison) {
  if (comparison.kind === "none" || comparison.value == null || Number.isNaN(comparison.value)) return "-";
  const sign = comparison.value > 0 ? "+" : "";
  return `${sign}${comparison.value.toFixed(1)}`;
}

function KpiCard({
  label,
  value,
  sub,
  mode = "count",
  accent = "#2C7A4B",
  variant = "primary",
}: {
  label: string;
  value: KpiValue;
  sub?: string;
  mode?: "count" | "rate" | "average";
  accent?: string;
  variant?: "primary" | "secondary";
}) {
  const display =
    mode === "rate" ? formatRate(value.value) :
    mode === "average" ? formatAverage(value.value) :
    formatNumber(value.value);
  const comparison =
    mode === "average" ? formatAverageComparison(value.comparison) :
    mode === "rate" ? formatComparison(value.comparison, "point") :
    formatComparison(value.comparison);
  const positive = comparison.startsWith("+") || comparison === "新規";
  const negative = comparison.startsWith("-");

  return (
    <div style={{
      background: "#fff",
      borderRadius: variant === "primary" ? "16px" : "12px",
      padding: variant === "primary" ? "18px" : "14px",
      boxShadow: variant === "primary" ? "0 8px 22px rgba(15,25,35,0.08)" : "0 1px 3px rgba(0,0,0,0.05)",
      border: variant === "primary" ? "1px solid rgba(44,122,75,0.14)" : "1px solid #EEF2F7",
      minHeight: variant === "primary" ? "142px" : "112px",
    }}>
      <div style={{ fontSize: "11px", fontWeight: 800, color: "#6B7280", lineHeight: 1.5 }}>{label}</div>
      <div style={{ fontSize: variant === "primary" ? "31px" : "23px", fontWeight: 900, color: accent, marginTop: "8px", letterSpacing: 0 }}>{display}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
        <span style={{
          fontSize: "11px",
          fontWeight: 800,
          color: comparison === "-" ? "#9CA3AF" : positive ? "#047857" : negative ? "#B91C1C" : "#6B7280",
          background: comparison === "-" ? "#F3F4F6" : positive ? "#ECFDF5" : negative ? "#FEF2F2" : "#F3F4F6",
          borderRadius: "999px",
          padding: "3px 8px",
        }}>
          {comparison}
        </span>
        <span style={{ fontSize: "11px", color: "#9CA3AF" }}>前期間比</span>
      </div>
      {sub && <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "8px", lineHeight: 1.55 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", color: "#1a2533" }}>{title}</h3>
        {note && <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#888", lineHeight: 1.7 }}>{note}</p>}
      </div>
      {children}
    </section>
  );
}

function ProgressBar({ rate, color = "#2C7A4B" }: { rate: number; color?: string }) {
  return (
    <div style={{ height: "9px", background: "#EEF2F7", borderRadius: "999px", overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${Math.max(0, Math.min(rate, 1)) * 100}%`, background: color, borderRadius: "999px" }} />
    </div>
  );
}

function LockedView({ message }: { message: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: "18px", padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", textAlign: "center" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#ECFDF5", color: "#047857", borderRadius: "999px", padding: "6px 12px", fontSize: "11px", fontWeight: 800, marginBottom: "16px" }}>
        PREMIUM限定
      </div>
      <h2 style={{ margin: "0 0 10px", color: "#1a2533", fontSize: "20px" }}>成果レポート</h2>
      <p style={{ margin: "0 auto 18px", maxWidth: "420px", color: "#666", fontSize: "14px", lineHeight: 1.8 }}>{message}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px", textAlign: "left" }}>
        {["QRからGoogle口コミページまでの流れ", "お客様の評価分布", "よく選ばれている回答", "改善ポイント"].map((item) => (
          <div key={item} style={{ background: "#F4F6F9", borderRadius: "12px", padding: "12px", fontSize: "12px", color: "#555", fontWeight: 700 }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function Funnel({ data }: { data: AnalyticsDashboardData }) {
  return (
    <Section
      title="口コミ獲得ファネル"
      note="Google口コミページ遷移は、低評価保護により意図的に遷移しない場合があります。"
    >
      <div className="analytics-funnel">
        {data.funnel.map((step, index) => (
          <div key={step.key} style={{ background: "#F4F6F9", borderRadius: "12px", padding: "14px", position: "relative" }}>
            <div style={{ fontSize: "11px", color: "#888", fontWeight: 700 }}>{index + 1}. {step.label}</div>
            <div style={{ fontSize: "24px", color: "#1a2533", fontWeight: 900, marginTop: "6px" }}>{formatNumber(step.count)}</div>
            <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
              {index === 0 ? "起点" : `前段階から ${formatRate(step.rateFromPrevious)}`}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function RatingDistribution({ data }: { data: AnalyticsDashboardData }) {
  const total = data.ratingDistribution.reduce((sum, item) => sum + item.count, 0);
  return (
    <Section title="評価分布">
      {total === 0 ? (
        <p style={{ color: "#aaa", textAlign: "center", padding: "22px 0", fontSize: "13px" }}>この期間の評価データはまだありません。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {data.ratingDistribution.map((item) => (
            <div key={item.rating} style={{ display: "grid", gridTemplateColumns: "42px 1fr 72px", gap: "10px", alignItems: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a2533" }}>★{item.rating}</div>
              <ProgressBar rate={item.rate} color={item.rating >= 4 ? "#2C7A4B" : item.rating <= 2 ? "#DC2626" : "#F59E0B"} />
              <div style={{ fontSize: "12px", color: "#555", textAlign: "right", fontWeight: 700 }}>
                {item.count}件 / {formatRate(item.rate)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function AnswerTrends({ data }: { data: AnalyticsDashboardData }) {
  return (
    <Section title="回答傾向" note="select/multi回答から、よく選ばれている項目を事実ベースで表示しています。">
      {data.answerTrends.length === 0 ? (
        <p style={{ color: "#aaa", textAlign: "center", padding: "20px 0", fontSize: "13px" }}>この期間の回答傾向はまだありません。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {data.answerTrends.map((trend, index) => (
            <div key={`${trend.questionLabel}-${trend.label}`} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "10px", alignItems: "start" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: index < 3 ? "#2C7A4B" : "#E5E7EB", color: index < 3 ? "#fff" : "#555", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>{index + 1}</div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "5px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a2533" }}>{trend.label}</div>
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{trend.questionLabel}</div>
                  </div>
                  <div style={{ fontSize: "12px", color: "#555", fontWeight: 800, whiteSpace: "nowrap" }}>{trend.count}件</div>
                </div>
                <ProgressBar rate={trend.rate} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function QuestionBlock({ question, defaultOpen = false }: { question: QuestionAnalysis; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} style={{ border: "1px solid #EEF2F7", borderRadius: "12px", padding: "14px", background: "#fff" }}>
      <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 800, color: "#1a2533" }}>
        Q{question.questionOrder}. {question.questionLabel}
        <span style={{ marginLeft: "8px", color: "#888", fontSize: "11px" }}>{question.responseCount}件</span>
      </summary>
      <div style={{ marginTop: "14px" }}>
        {question.questionType === "stars" && (
          <>
            <div style={{ fontSize: "13px", color: "#555", fontWeight: 700, marginBottom: "10px" }}>平均 {formatAverage(question.average)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {question.distribution.map((item) => (
                <div key={item.rating} style={{ display: "grid", gridTemplateColumns: "36px 1fr 66px", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700 }}>★{item.rating}</span>
                  <ProgressBar rate={item.rate} />
                  <span style={{ fontSize: "11px", color: "#555", textAlign: "right" }}>{item.count}件</span>
                </div>
              ))}
            </div>
          </>
        )}
        {(question.questionType === "select" || question.questionType === "multi") && (
          <>
            {question.note && <p style={{ margin: "0 0 10px", fontSize: "11px", color: "#888", lineHeight: 1.6 }}>{question.note}</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {question.options.map((option) => (
                <div key={option.label} style={{ display: "grid", gridTemplateColumns: "1fr 70px", gap: "10px", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a2533" }}>{option.label}</span>
                      <span style={{ fontSize: "11px", color: "#888" }}>{formatRate(option.rate)}</span>
                    </div>
                    <ProgressBar rate={option.rate} />
                  </div>
                  <span style={{ fontSize: "12px", color: "#555", fontWeight: 800, textAlign: "right" }}>{option.count}件</span>
                </div>
              ))}
            </div>
          </>
        )}
        {question.questionType === "text" && (
          <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>テキスト回答は件数のみ表示しています。</p>
        )}
      </div>
    </details>
  );
}

function QuestionAnalysisSection({ data }: { data: AnalyticsDashboardData }) {
  return (
    <Section title="質問別分析">
      {data.questions.length === 0 ? (
        <p style={{ color: "#aaa", textAlign: "center", padding: "20px 0", fontSize: "13px" }}>この期間の質問回答はまだありません。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {data.questions.map((question, index) => (
            <QuestionBlock key={question.key} question={question} defaultOpen={index === 0} />
          ))}
        </div>
      )}
    </Section>
  );
}

function FeedbackSection({ data }: { data: AnalyticsDashboardData }) {
  return (
    <Section title="お客様の声から見える改善候補" note="低評価フィードバックに入力された内容のみを表示します。コメントは個人情報が含まれる可能性があるため、直近分だけ控えめに表示します。">
      <details open style={{ border: "1px solid #FDE68A", borderRadius: "12px", padding: "14px", background: "#FFFBEB" }}>
        <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 800, color: "#8A6500" }}>
          低評価フィードバックから確認できた声 {data.feedback.count}件
        </summary>
        <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#1a2533", marginBottom: "8px" }}>理由ランキング</div>
            {data.feedback.issueRanking.length === 0 ? (
              <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>理由データはありません。</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.feedback.issueRanking.map((issue) => (
                  <div key={issue.label} style={{ display: "grid", gridTemplateColumns: "1fr 60px", gap: "10px", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700 }}>{issue.label}</span>
                        <span style={{ fontSize: "11px", color: "#888" }}>{formatRate(issue.rate)}</span>
                      </div>
                      <ProgressBar rate={issue.rate} color="#D97706" />
                    </div>
                    <span style={{ textAlign: "right", fontSize: "12px", fontWeight: 800 }}>{issue.count}件</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#1a2533", marginBottom: "8px" }}>直近コメント</div>
            {data.feedback.recentComments.length === 0 ? (
              <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>コメントはありません。</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.feedback.recentComments.map((comment, index) => (
                  <div key={`${comment.createdAt}-${index}`} style={{ background: "#fff", borderRadius: "10px", padding: "12px", border: "1px solid #FDE68A" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", color: "#8A6500", fontWeight: 800 }}>★{comment.rating}</span>
                      <span style={{ fontSize: "10px", color: "#aaa" }}>{new Date(comment.createdAt).toLocaleDateString("ja-JP")}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#555", lineHeight: 1.7 }}>{comment.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </details>
    </Section>
  );
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("this_month");
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/mypage/analytics?period=${period}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "成果データを取得できませんでした");
        return body as DashboardResponse;
      })
      .then((body) => {
        if (!cancelled) setData(body);
      })
      .catch(() => {
        if (!cancelled) setError("成果データを取得できませんでした");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [period]);

  const collectionStartedAt = useMemo(() => {
    if (!data || data.locked) return null;
    return formatCollectionStartedAt(data.collectionStartedAt);
  }, [data]);

  if (error) {
    return (
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "18px", color: "#1a2533" }}>📈 成果レポート</h2>
        <p style={{ color: "#E53E3E", fontSize: "13px" }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .analytics-primary-kpi-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .analytics-secondary-kpi-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .analytics-funnel { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (min-width: 760px) {
          .analytics-primary-kpi-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .analytics-secondary-kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .analytics-funnel { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ background: "linear-gradient(135deg,#0F1923,#1a3a2a)", borderRadius: "18px", padding: "22px", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: 900 }}>📈 成果レポート</h2>
              <p style={{ margin: 0, fontSize: "12px", color: "#BFD7CB", lineHeight: 1.7 }}>
                QRからGoogle口コミページ遷移までの流れと、お客様の評価傾向を確認できます。
              </p>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setPeriod(option.key)}
                  style={{
                    border: "1px solid rgba(255,255,255,0.24)",
                    background: period === option.key ? "#fff" : "rgba(255,255,255,0.08)",
                    color: period === option.key ? "#1a2533" : "#fff",
                    borderRadius: "999px",
                    padding: "7px 11px",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", textAlign: "center", color: "#888", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            成果データを読み込み中...
          </div>
        )}

        {!loading && data?.locked && <LockedView message={data.message} />}

        {!loading && data && !data.locked && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="analytics-primary-kpi-grid">
                <KpiCard label="QRアクセス" value={data.kpis.qrAccess} sub="レビュー体験の入口になったセッション数" />
                <KpiCard label="アンケート完了" value={data.kpis.surveyCompleted} sub="最後まで回答されたセッション数" />
                <KpiCard label="平均評価" value={data.kpis.averageRating} mode="average" accent="#F59E0B" sub="アンケートで回答された★評価の平均" />
                <KpiCard
                  label="口コミ投稿チャンス"
                  value={data.kpis.googleReviewClicked}
                  sub="Google口コミ投稿画面を開いたセッション数"
                />
              </div>
              <div className="analytics-secondary-kpi-grid">
                <KpiCard label="アンケート開始" value={data.kpis.surveyStarted} variant="secondary" />
                <KpiCard label="アンケート完了率" value={data.kpis.completionRate} mode="rate" variant="secondary" />
                <KpiCard label="高評価率" value={data.kpis.highRatingRate} mode="rate" variant="secondary" />
                <KpiCard label="低評価率" value={data.kpis.lowRatingRate} mode="rate" accent="#DC2626" variant="secondary" />
                <KpiCard label="Google口コミ遷移率" value={data.kpis.googleReviewClickRate} mode="rate" sub="Google口コミ投稿画面を開いた割合" variant="secondary" />
                <KpiCard label="AI生成到達" value={data.kpis.aiGeneratedSessions} sub="AI口コミ文が生成されたセッション数" variant="secondary" />
                <KpiCard label="AI生成回数" value={data.kpis.aiGeneratedEvents} sub="3スタイル生成や再生成を含む総数" variant="secondary" />
              </div>
            </div>

            <Funnel data={data} />
            <AnswerTrends data={data} />
            <QuestionAnalysisSection data={data} />
            <FeedbackSection data={data} />
            <RatingDistribution data={data} />

            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "14px", padding: "14px", color: "#8A6500", fontSize: "12px", lineHeight: 1.7 }}>
              {collectionStartedAt && <div style={{ fontWeight: 800, marginBottom: "4px" }}>データ収集開始：{collectionStartedAt}</div>}
              <div>データ収集開始以降の結果を表示しています。それ以前のデータは含まれません。</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
