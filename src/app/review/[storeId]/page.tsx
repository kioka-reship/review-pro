"use client";
import { useState, useEffect, useCallback } from "react";
import { LangCode, LANGUAGE_LIST, JA_ISSUES, getT } from "../../../lib/i18n";

type Store = {
  id: string;
  name: string;
  type: string;
  place_id: string;
  plan: string;
  status: string;
  low_review_pro?: boolean;
  multilingual_enabled?: boolean;
};

type Question = {
  id: number;
  store_id: string;
  order_num: number;
  label: string;
  type: string;
  options: string[] | null;
};

type StyleKey = "casual" | "honest" | "formal";
type StyleType = { key: StyleKey; label: string; emoji: string };
type LoadingStates = { casual: boolean; honest: boolean; formal: boolean };
type Reviews = { casual: string; honest: string; formal: string };

const STYLE_KEYS: StyleKey[] = ["casual", "honest", "formal"];

function StarRating({
  value,
  onChange,
  ratingLabels,
}: {
  value: number;
  onChange: (v: number) => void;
  ratingLabels: string[];
}) {
  const [hover, setHover] = useState(0);
  const RATING_EMOJI = ["", "😞", "😐", "🙂", "😊", "🤩"];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "12px" }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              fontSize: "44px", lineHeight: 1,
              filter: s <= (hover || value) ? "none" : "grayscale(1) opacity(0.25)",
              transform: s <= (hover || value) ? "scale(1.18)" : "scale(1)",
              transition: "all 0.15s",
            }}
          >⭐</button>
        ))}
      </div>
      {value > 0 && (
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "26px" }}>{RATING_EMOJI[value]}</span>
          <p style={{ margin: "4px 0 0", fontWeight: "700", color: "#1a2533", fontSize: "16px" }}>
            {ratingLabels[value]}
          </p>
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  text, style, selected, onSelect, loading, generatingLabel,
}: {
  text: string; style: StyleType; selected: boolean; onSelect: () => void;
  loading: boolean; generatingLabel: string;
}) {
  return (
    <div
      onClick={!loading ? onSelect : undefined}
      style={{
        borderRadius: "14px", border: `2px solid ${selected ? "#2C7A4B" : "#E5E7EB"}`,
        background: selected ? "#F0FAF4" : "#fff", padding: "16px",
        cursor: loading ? "default" : "pointer", transition: "all 0.2s",
        boxShadow: selected ? "0 0 0 3px rgba(44,122,75,0.12)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "16px" }}>{style.emoji}</span>
          <span style={{ fontSize: "12px", fontWeight: "700", color: selected ? "#2C7A4B" : "#888" }}>
            {style.label}
          </span>
        </div>
        {selected && (
          <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#2C7A4B", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: "13px" }}>✓</span>
          </div>
        )}
      </div>
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0" }}>
          <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid #E5E7EB", borderTop: "2px solid #2C7A4B", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
          <span style={{ fontSize: "13px", color: "#aaa" }}>{generatingLabel}</span>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.85", color: selected ? "#1a3a2a" : "#555" }}>{text}</p>
      )}
    </div>
  );
}

function LanguageSelector({
  current, onChange, disabled,
}: {
  current: LangCode; onChange: (lang: LangCode) => void; disabled: boolean;
}) {
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(44,122,75,0.08), rgba(92,170,130,0.05))",
      border: "1px solid rgba(44,122,75,0.2)",
      borderRadius: "14px", padding: "12px 14px", marginBottom: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
        <span style={{
          background: "linear-gradient(135deg, #1a3a2a, #2C7A4B)",
          color: "#fff", fontSize: "9px", fontWeight: "800", padding: "2px 7px",
          borderRadius: "20px", letterSpacing: "0.08em",
        }}>PREMIUM</span>
        <span style={{ fontSize: "11px", color: "#2C7A4B", fontWeight: "700" }}>インバウンド対応</span>
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {LANGUAGE_LIST.map((lang) => (
          <button
            key={lang.code}
            onClick={() => !disabled && onChange(lang.code)}
            disabled={disabled}
            style={{
              padding: "8px 14px", borderRadius: "10px",
              border: `2px solid ${current === lang.code ? "#2C7A4B" : "#E5E7EB"}`,
              background: current === lang.code ? "#2C7A4B" : "#fff",
              color: current === lang.code ? "#fff" : "#555",
              fontFamily: "inherit", fontSize: "13px", fontWeight: "700",
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.18s",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewPage({ params }: { params: { storeId: string } }) {
  const [store, setStore] = useState<Store | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [step, setStep] = useState<"welcome" | "questions" | "generating" | "done" | "low_review" | "low_review_done">("welcome");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [reviews, setReviews] = useState<Reviews>({ casual: "", honest: "", formal: "" });
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({ casual: false, honest: false, formal: false });
  const [selectedStyle, setSelectedStyle] = useState<StyleKey>("casual");
  const [copied, setCopied] = useState(false);
  const [regenCount, setRegenCount] = useState(0);
  const [hasLowReviewPro, setHasLowReviewPro] = useState(false);
  const [lowReviewIssues, setLowReviewIssues] = useState<string[]>([]);
  const [lowReviewComment, setLowReviewComment] = useState("");
  const [lowReviewSubmitting, setLowReviewSubmitting] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const [sessionId, setSessionId] = useState<string>("");
  const [lang, setLang] = useState<LangCode>("ja");
  const [translating, setTranslating] = useState(false);
  const [baseQuestions, setBaseQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storeRes = await fetch(`/api/store?id=${params.storeId}`);
        const storeData = await storeRes.json();
        if (storeData.error) { setNotFound(true); setLoading(false); return; }
        setStore(storeData);

        const sid = crypto.randomUUID();
        setSessionId(sid);
        fetch("/api/qr-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store_id: params.storeId, session_id: sid }),
        });

        try {
          const optRes = await fetch(`/api/store-options?store_id=${params.storeId}`);
          if (optRes.ok) {
            const optData = await optRes.json();
            const hasOpt = (optData.options || []).some(
              (o: any) => o.option_key === "low_review_pro" && o.status === "active"
            );
            setHasLowReviewPro(hasOpt);
          }
        } catch { /* ignore */ }

        const qRes = await fetch(`/api/questions?store_id=${params.storeId}`);
        const qData = await qRes.json();
        const qs = qData.questions || [];
        setBaseQuestions(qs);
        setQuestions(qs);
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    };
    fetchData();
  }, [params.storeId]);

  const handleLanguageChange = useCallback(async (newLang: LangCode) => {
    setLang(newLang);
    if (newLang === "ja") {
      setQuestions(baseQuestions);
      return;
    }
    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: baseQuestions, targetLang: newLang }),
      });
      const data = await res.json();
      if (data.questions?.length) setQuestions(data.questions);
    } catch { /* fall back to Japanese */ }
    setTranslating(false);
  }, [baseQuestions]);

  const T = getT(lang);
  const STYLES: StyleType[] = STYLE_KEYS.map(key => ({
    key,
    label: T.styles[key].label,
    emoji: T.styles[key].emoji,
  }));

  const isMultilingual = store?.plan === "premium" && store?.multilingual_enabled;

  const totalQ = questions.length;
  const progress = step === "questions" ? ((currentQ) / totalQ) * 100 : 0;
  const currentQuestion = questions[currentQ];

  const canNext = () => {
    if (step !== "questions" || !currentQuestion) return true;
    const ans = answers[currentQuestion.id];
    if (currentQuestion.type === "stars") return (ans || 0) > 0;
    if (currentQuestion.type === "multi") return Array.isArray(ans) && ans.length > 0;
    if (currentQuestion.type === "select") return !!ans;
    return true;
  };

  const buildAnswersForGenerate = () => {
    const result: any = { rating: 0, menu: "", party: "", highlight: [], feel: "", gender: "", age: "" };
    baseQuestions.forEach((q, idx) => {
      const translatedQ = questions[idx];
      const ans = answers[q.id];
      if (q.type === "stars") result.rating = ans || 0;
      else if (q.type === "multi") result.highlight = ans || [];
      else {
        if (q.label.includes("メニュー") || q.label.includes("ご注文")) result.menu = ans || "";
        else if (q.label.includes("人数")) result.party = ans || "";
        else if (q.label.includes("一言")) result.feel = ans || "";
        else if (q.label.includes("性別")) result.gender = ans || "";
        else if (q.label.includes("年代")) result.age = ans || "";
        else if (!result.feel) result.feel = ans || "";
      }
    });
    return result;
  };

  const generateAll = async () => {
    if (!store) return;
    setStep("generating");
    const builtAnswers = buildAnswersForGenerate();
    const results = await Promise.all(
      STYLE_KEYS.map((key) =>
        fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store: { id: store.id, name: store.name, type: store.type, placeId: store.place_id },
            answers: builtAnswers,
            style: { key },
            session_id: sessionId,
            language: lang,
          }),
        }).then((r) => r.json()).then((d) => d.text || "").catch(() => "")
      )
    );
    setReviews({ casual: results[0], honest: results[1], formal: results[2] });
    setStep("done");
  };

  const handleNext = async () => {
    if (step === "welcome") { setStep("questions"); return; }
    if (step === "questions") {
      if (currentQuestion?.type === "stars") {
        const rating = answers[currentQuestion.id] || 0;
        setCurrentRating(rating);
        if (rating <= 2 && hasLowReviewPro) {
          setStep("low_review");
          return;
        }
      }
      if (currentQ < totalQ - 1) {
        setCurrentQ(c => c + 1);
      } else {
        await generateAll();
      }
    }
  };

  const handleBack = () => {
    if (currentQ > 0) setCurrentQ(c => c - 1);
    else setStep("welcome");
  };

  const handleLowReviewSubmit = async () => {
    if (!store) return;
    setLowReviewSubmitting(true);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store_id: store.id,
        rating: currentRating,
        issues: lowReviewIssues,
        comment: lowReviewComment,
      }),
    });
    setLowReviewSubmitting(false);
    setStep("low_review_done");
  };

  const handleRegen = async () => {
    if (!store) return;
    setLoadingStates((prev) => ({ ...prev, [selectedStyle]: true }));
    setRegenCount((c) => c + 1);
    try {
      const builtAnswers = buildAnswersForGenerate();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: { id: store.id, name: store.name, type: store.type, placeId: store.place_id },
          answers: builtAnswers,
          style: { key: selectedStyle },
          session_id: sessionId,
          language: lang,
        }),
      });
      const data = await res.json();
      setReviews((prev) => ({ ...prev, [selectedStyle]: data.text || "" }));
    } catch { /* noop */ }
    setLoadingStates((prev) => ({ ...prev, [selectedStyle]: false }));
    setCopied(false);
  };

  const handlePost = () => {
    if (!store) return;
    const text = reviews[selectedStyle];
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => { window.location.href = store.place_id; }, 500);
    });
  };

  const handleRestart = () => {
    setStep("welcome");
    setCurrentQ(0);
    setAnswers({});
    setReviews({ casual: "", honest: "", formal: "" });
    setCopied(false);
    setRegenCount(0);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "4px solid #E8F5ED", borderTop: "4px solid #2C7A4B", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#888", fontSize: "14px" }}>{T.loading}</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
        <h2 style={{ color: "#1a2533", margin: "0 0 8px" }}>{T.notFound.title}</h2>
        <p style={{ color: "#888", fontSize: "14px" }}>{T.notFound.message}</p>
      </div>
    </div>
  );

  const welcomeFeatures = T.welcome.features;
  const welcomeSubtitle = T.welcome.subtitle.replace("{n}", String(totalQ));

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: #F4F6F9; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pop { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      <div style={{ minHeight: "100vh", maxWidth: "480px", margin: "0 auto", background: "#fff", display: "flex", flexDirection: "column", fontFamily: "'Noto Sans JP', sans-serif" }}>

        {/* ヘッダー */}
        <div style={{ background: "linear-gradient(135deg, #0F1923 0%, #1a3a2a 100%)", padding: "20px 20px 22px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-30px", right: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(44,122,75,0.15)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: "4px" }}>{T.header.label}</div>
            <div style={{ fontSize: "17px", fontWeight: "900", color: "#fff" }}>{store?.name}</div>
          </div>
          {step === "questions" && (
            <div style={{ marginTop: "14px", height: "4px", background: "rgba(255,255,255,0.12)", borderRadius: "4px" }}>
              <div style={{ height: "100%", background: "#5BBF8A", borderRadius: "4px", width: `${progress}%`, transition: "width 0.5s ease" }} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, padding: "28px 20px 32px", display: "flex", flexDirection: "column" }}>

          {/* 言語選択（プレミアム・多言語有効時のみ・ウェルカム画面のみ） */}
          {step === "welcome" && isMultilingual && (
            <LanguageSelector current={lang} onChange={handleLanguageChange} disabled={translating} />
          )}

          {/* 翻訳中インジケーター */}
          {translating && (
            <div style={{ textAlign: "center", padding: "12px", fontSize: "13px", color: "#2C7A4B" }}>
              <span style={{ display: "inline-block", marginRight: "8px", animation: "spin 0.7s linear infinite" }}>⟳</span>
              Translating...
            </div>
          )}

          {/* ウェルカム */}
          {step === "welcome" && (
            <div style={{ animation: "fadeUp 0.4s ease", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div style={{ fontSize: "60px", marginBottom: "16px" }}>🙏</div>
              <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#1a2533", margin: "0 0 12px", lineHeight: 1.3 }}>
                {T.welcome.title.split("\n").map((line, i) => (
                  <span key={i}>{line}{i < T.welcome.title.split("\n").length - 1 && <br />}</span>
                ))}
              </h2>
              <p style={{ color: "#888", fontSize: "14px", lineHeight: 1.8, margin: "0 0 32px" }}>
                {welcomeSubtitle.split("\n").map((line, i) => (
                  <span key={i}>{line}{i < welcomeSubtitle.split("\n").length - 1 && <br />}</span>
                ))}
              </p>
              <div style={{ width: "100%", maxWidth: "280px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {welcomeFeatures.map((t, i) => (
                  <div key={i} style={{ background: "#F4F9F6", borderRadius: "10px", padding: "11px 16px", fontSize: "13px", fontWeight: "600", color: "#2C7A4B", textAlign: "left" }}>{t}</div>
                ))}
              </div>
            </div>
          )}

          {/* 質問 */}
          {step === "questions" && currentQuestion && (
            <div style={{ animation: "fadeUp 0.35s ease", flex: 1 }}>
              <button onClick={handleBack}
                style={{ background: "none", border: "none", color: "#aaa", fontFamily: "inherit", fontSize: "13px", cursor: "pointer", padding: "0 0 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                {T.questions.back}
              </button>
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#2C7A4B", letterSpacing: "0.1em", margin: "0 0 8px", textAlign: "center" }}>
                Q{currentQ + 1} / {totalQ}
              </p>
              <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#1a2533", margin: "0 0 24px", textAlign: "center", lineHeight: 1.4 }}>
                {currentQuestion.label}
              </h2>

              {currentQuestion.type === "stars" && (
                <StarRating
                  value={answers[currentQuestion.id] || 0}
                  onChange={(v) => setAnswers({ ...answers, [currentQuestion.id]: v })}
                  ratingLabels={T.ratings}
                />
              )}

              {currentQuestion.type === "multi" && currentQuestion.options && (
                <>
                  <p style={{ textAlign: "center", color: "#aaa", fontSize: "12px", margin: "-12px 0 20px" }}>{T.questions.multiHint}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {currentQuestion.options.map((opt) => {
                      const sel = (answers[currentQuestion.id] || []).includes(opt);
                      return (
                        <button key={opt} onClick={() => {
                          const prev = answers[currentQuestion.id] || [];
                          setAnswers({ ...answers, [currentQuestion.id]: sel ? prev.filter((v: string) => v !== opt) : [...prev, opt] });
                        }}
                          style={{ padding: "15px 18px", borderRadius: "12px", border: `2px solid ${sel ? "#2C7A4B" : "#E5E7EB"}`,
                            background: sel ? "#F0FAF4" : "#fff", color: sel ? "#1a3a2a" : "#555",
                            fontFamily: "inherit", fontSize: "15px", fontWeight: sel ? "700" : "400",
                            cursor: "pointer", transition: "all 0.18s", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {opt}{sel && <span style={{ color: "#2C7A4B", fontSize: "16px" }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {currentQuestion.type === "select" && currentQuestion.options && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {currentQuestion.options.map((opt) => {
                    const sel = answers[currentQuestion.id] === opt;
                    return (
                      <button key={opt} onClick={() => setAnswers({ ...answers, [currentQuestion.id]: opt })}
                        style={{ padding: "18px 10px", borderRadius: "14px", border: `2px solid ${sel ? "#2C7A4B" : "#E5E7EB"}`,
                          background: sel ? "#2C7A4B" : "#fff", color: sel ? "#fff" : "#555",
                          fontFamily: "inherit", fontSize: "14px", fontWeight: "700", cursor: "pointer", transition: "all 0.18s", textAlign: "center" }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 低評価フォーム */}
          {step === "low_review" && (
            <div style={{ animation: "fadeUp 0.4s ease", flex: 1 }}>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🙏</div>
                <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#1a2533", margin: "0 0 8px" }}>
                  {T.lowReview.title}
                </h2>
                <p style={{ color: "#888", fontSize: "13px", lineHeight: 1.8 }}>
                  {T.lowReview.subtitle.split("\n").map((line, i) => (
                    <span key={i}>{line}{i < T.lowReview.subtitle.split("\n").length - 1 && <br />}</span>
                  ))}
                </p>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "#1a2533", marginBottom: "12px" }}>
                  {T.lowReview.improve}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {JA_ISSUES.map(issue => {
                    const displayLabel = T.issues[issue] || issue;
                    const sel = lowReviewIssues.includes(issue);
                    return (
                      <button key={issue} onClick={() => setLowReviewIssues(prev => sel ? prev.filter(i => i !== issue) : [...prev, issue])}
                        style={{ padding: "12px 8px", borderRadius: "10px", border: `2px solid ${sel ? "#E53E3E" : "#E5E7EB"}`,
                          background: sel ? "#FEF2F2" : "#fff", color: sel ? "#991B1B" : "#555",
                          fontFamily: "inherit", fontSize: "13px", fontWeight: sel ? "700" : "400",
                          cursor: "pointer", transition: "all 0.18s", textAlign: "center" }}>
                        {displayLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "#1a2533", marginBottom: "8px" }}>
                  {T.lowReview.comment}
                </p>
                <textarea value={lowReviewComment} onChange={e => setLowReviewComment(e.target.value)}
                  rows={4} placeholder={T.lowReview.placeholder}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "14px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <button onClick={handleLowReviewSubmit} disabled={lowReviewSubmitting}
                style={{ width: "100%", padding: "16px", borderRadius: "14px", border: "none",
                  background: "linear-gradient(135deg, #2C7A4B, #3DA66A)", color: "#fff",
                  fontFamily: "inherit", fontSize: "16px", fontWeight: "700", cursor: "pointer" }}>
                {lowReviewSubmitting ? T.lowReview.submitting : T.lowReview.submit}
              </button>
            </div>
          )}

          {/* 低評価送信完了 */}
          {step === "low_review_done" && (
            <div style={{ animation: "fadeUp 0.4s ease", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div style={{ fontSize: "60px", marginBottom: "16px" }}>💚</div>
              <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#1a2533", margin: "0 0 12px" }}>
                {T.lowReviewDone.title}
              </h2>
              <p style={{ color: "#888", fontSize: "14px", lineHeight: 1.8, margin: "0 0 32px" }}>
                {T.lowReviewDone.message.split("\n").map((line, i) => (
                  <span key={i}>{line}{i < T.lowReviewDone.message.split("\n").length - 1 && <br />}</span>
                ))}
              </p>
            </div>
          )}

          {/* 生成中 */}
          {step === "generating" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div style={{ position: "relative", width: "72px", height: "72px", marginBottom: "20px" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", border: "5px solid #E8F5ED", borderTop: "5px solid #2C7A4B", animation: "spin 0.8s linear infinite" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>✨</div>
              </div>
              <h3 style={{ color: "#2C7A4B", fontWeight: "700", fontSize: "18px", margin: "0 0 8px" }}>{T.generating.title}</h3>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "12px" }}>
                {STYLES.map((s) => (
                  <div key={s.key} style={{ background: "#F0FAF4", borderRadius: "8px", padding: "5px 12px", fontSize: "12px", color: "#2C7A4B", fontWeight: "600", animation: "pulse 1.5s ease infinite" }}>
                    {s.emoji} {s.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 完成 */}
          {step === "done" && (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ fontSize: "44px", animation: "pop 0.5s ease", display: "inline-block" }}>🎉</div>
                <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#1a2533", margin: "6px 0 4px" }}>{T.done.title}</h2>
                <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>{T.done.subtitle}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {STYLES.map((s) => (
                  <ReviewCard key={s.key} style={s} text={reviews[s.key]} selected={selectedStyle === s.key}
                    loading={loadingStates[s.key]}
                    generatingLabel={T.generating.title}
                    onSelect={() => { setSelectedStyle(s.key); setCopied(false); }} />
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
                <button onClick={handleRegen} disabled={Object.values(loadingStates).some(Boolean)}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "10px",
                    border: "1.5px solid #E5E7EB", background: "#fff", color: "#555",
                    fontFamily: "inherit", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                  <span style={{ fontSize: "16px", animation: loadingStates[selectedStyle] ? "spin 0.7s linear infinite" : "none", display: "inline-block" }}>🔄</span>
                  {T.done.regen}
                </button>
                {regenCount > 0 && (
                  <span style={{ fontSize: "11px", color: "#aaa" }}>
                    {T.done.regenCount.replace("{n}", String(regenCount))}
                  </span>
                )}
              </div>
              <div style={{ background: "#FFFBF0", border: "1px solid #FADDAA", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: "700", color: "#8A6500", margin: "0 0 8px" }}>{T.done.hint.title}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {T.done.hint.steps.map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#F5A623", color: "#fff", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                      <span style={{ fontSize: "12px", color: "#5A4A00" }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handlePost} disabled={Object.values(loadingStates).some(Boolean)}
                style={{ width: "100%", padding: "18px", borderRadius: "16px", border: "none",
                  background: copied ? "#1A5C38" : "linear-gradient(135deg, #2C7A4B, #3DA66A)",
                  color: "#fff", fontFamily: "inherit", fontSize: "16px", fontWeight: "700", cursor: "pointer",
                  boxShadow: "0 6px 24px rgba(44,122,75,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.3s" }}>
                {copied ? T.done.copiedButton : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {T.done.postButton}
                  </>
                )}
              </button>
              <button onClick={handleRestart}
                style={{ width: "100%", marginTop: "10px", padding: "12px", borderRadius: "12px", border: "1.5px solid #E5E7EB", background: "transparent", color: "#888", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}>
                {T.done.restart}
              </button>
            </div>
          )}

          {/* 次へボタン */}
          {(step === "welcome" || step === "questions") && (
            <button onClick={handleNext} disabled={!canNext() || translating}
              style={{ width: "100%", padding: "18px", marginTop: "24px", borderRadius: "16px", border: "none",
                background: canNext() && !translating ? "linear-gradient(135deg, #2C7A4B, #3DA66A)" : "#E5E7EB",
                color: canNext() && !translating ? "#fff" : "#aaa", fontFamily: "inherit", fontSize: "16px", fontWeight: "700",
                cursor: canNext() && !translating ? "pointer" : "not-allowed",
                boxShadow: canNext() && !translating ? "0 4px 16px rgba(44,122,75,0.3)" : "none", transition: "all 0.2s" }}>
              {translating
                ? "..."
                : step === "welcome"
                  ? T.buttons.start
                  : currentQ === totalQ - 1
                    ? T.buttons.create
                    : T.buttons.next}
            </button>
          )}
        </div>

        <div style={{ padding: "12px 20px", textAlign: "center", borderTop: "1px solid #F0F0F0" }}>
          <p style={{ margin: 0, fontSize: "11px", color: "#ddd" }}>{T.footer}</p>
        </div>
      </div>
    </>
  );
}
