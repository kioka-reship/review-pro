import type { SupabaseClient } from "@supabase/supabase-js";

export const SURVEY_EVENT_TYPES = [
  "qr_access",
  "survey_started",
  "survey_completed",
  "ai_generated",
  "ai_generation_failed",
  "google_review_clicked",
] as const;

export type SurveyEventType = (typeof SURVEY_EVENT_TYPES)[number];

export type SurveyAnswerInput = {
  question_id?: number | null;
  question_order: number;
  question_label: string;
  question_type: string;
  answer_value: unknown;
};

type RecordSurveyEventParams = {
  storeId: string;
  sessionId: string;
  eventType: SurveyEventType;
  language?: string;
  rating?: number;
  answers?: SurveyAnswerInput[];
  metadata?: Record<string, unknown>;
  eventKey?: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_QUESTION_TYPES = new Set(["stars", "select", "multi", "text"]);
const ONE_SHOT_EVENTS = new Set<SurveyEventType>([
  "qr_access",
  "survey_started",
  "survey_completed",
  "google_review_clicked",
]);
const MAX_METADATA_BYTES = 2048;
const MAX_ANSWERS = 30;
const MAX_LABEL_LENGTH = 200;
const MAX_ANSWER_BYTES = 4096;

export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function isSurveyEventType(value: unknown): value is SurveyEventType {
  return typeof value === "string" && (SURVEY_EVENT_TYPES as readonly string[]).includes(value);
}

export function normalizeRating(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 1 || value > 5) return null;
  return value;
}

export function assertSafeMetadata(metadata: unknown): Record<string, unknown> {
  if (metadata == null) return {};
  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error("invalid_metadata");
  }
  const text = JSON.stringify(metadata);
  if (Buffer.byteLength(text, "utf8") > MAX_METADATA_BYTES) {
    throw new Error("metadata_too_large");
  }
  return metadata as Record<string, unknown>;
}

export function normalizeSurveyAnswers(rawAnswers: unknown): SurveyAnswerInput[] | undefined {
  if (rawAnswers == null) return undefined;
  if (!Array.isArray(rawAnswers)) throw new Error("invalid_answers");
  if (rawAnswers.length > MAX_ANSWERS) throw new Error("too_many_answers");

  return rawAnswers.map((answer, index) => {
    if (!answer || typeof answer !== "object" || Array.isArray(answer)) {
      throw new Error("invalid_answer");
    }
    const row = answer as Record<string, unknown>;
    const questionOrder = row.question_order;
    const questionLabel = row.question_label;
    const questionType = row.question_type;

    if (typeof questionOrder !== "number" || !Number.isInteger(questionOrder) || questionOrder < 1) {
      throw new Error("invalid_question_order");
    }
    if (typeof questionLabel !== "string" || !questionLabel.trim() || questionLabel.length > MAX_LABEL_LENGTH) {
      throw new Error("invalid_question_label");
    }
    if (typeof questionType !== "string" || !ALLOWED_QUESTION_TYPES.has(questionType)) {
      throw new Error("invalid_question_type");
    }

    const answerText = JSON.stringify(row.answer_value);
    if (!answerText || Buffer.byteLength(answerText, "utf8") > MAX_ANSWER_BYTES) {
      throw new Error("answer_too_large");
    }

    const questionId = row.question_id;
    if (
      questionId != null &&
      (typeof questionId !== "number" || !Number.isInteger(questionId) || questionId < 1)
    ) {
      throw new Error("invalid_question_id");
    }

    return {
      question_id: (questionId as number | null | undefined) ?? null,
      question_order: questionOrder,
      question_label: questionLabel.trim(),
      question_type: questionType,
      answer_value: row.answer_value,
    };
  });
}

async function ensureActiveStore(supabase: SupabaseClient, storeId: string) {
  const { data: store, error } = await supabase
    .from("stores")
    .select("id, status")
    .eq("id", storeId)
    .maybeSingle();

  if (error) throw error;
  if (!store) throw new Error("store_not_found");
  if (store.status !== "契約中") throw new Error("store_inactive");
  return store;
}

function isDuplicateError(error: any): boolean {
  return error?.code === "23505";
}

function answerText(answerValue: unknown): string | null {
  if (Array.isArray(answerValue)) return answerValue.join(", ");
  if (typeof answerValue === "string") return answerValue;
  if (typeof answerValue === "number" || typeof answerValue === "boolean") return String(answerValue);
  return null;
}

export async function recordSurveyEvent(
  supabase: SupabaseClient,
  params: RecordSurveyEventParams,
): Promise<void> {
  if (!params.storeId) throw new Error("store_id_required");
  if (!isValidUuid(params.sessionId)) throw new Error("invalid_session_id");

  await ensureActiveStore(supabase, params.storeId);

  const now = new Date().toISOString();
  const sessionPatch: Record<string, unknown> = {
    session_id: params.sessionId,
    store_id: params.storeId,
    language: params.language || "ja",
    updated_at: now,
  };

  if (params.eventType === "qr_access") {
    // Leave status at its default on insert. Do not downgrade an existing completed session.
  }
  if (params.eventType === "survey_started") {
    sessionPatch.status = "started";
    sessionPatch.started_at = now;
  }
  if (params.eventType === "survey_completed") {
    const rating = normalizeRating(params.rating);
    if (!rating) throw new Error("invalid_rating");
    const { error: baseSessionError } = await supabase
      .from("survey_sessions")
      .upsert(sessionPatch, { onConflict: "session_id" });
    if (baseSessionError) throw baseSessionError;

    if (params.answers?.length) {
      const rows = params.answers.map((answer) => ({
        session_id: params.sessionId,
        store_id: params.storeId,
        question_id: answer.question_id ?? null,
        question_order: answer.question_order,
        question_label: answer.question_label,
        question_type: answer.question_type,
        answer_value: answer.answer_value,
        answer_text: answerText(answer.answer_value),
      }));
      const { error: answersError } = await supabase
        .from("survey_answers")
        .upsert(rows, { onConflict: "session_id,question_order" });
      if (answersError) throw answersError;
    }

    const { error: completedSessionError } = await supabase
      .from("survey_sessions")
      .update({
        status: "completed",
        rating,
        completed_at: now,
        updated_at: now,
      })
      .eq("session_id", params.sessionId);
    if (completedSessionError) throw completedSessionError;

    const eventKey = params.eventKey || "survey_completed";
    const { error: eventError } = await supabase.from("survey_events").insert({
      store_id: params.storeId,
      session_id: params.sessionId,
      event_type: params.eventType,
      event_key: eventKey,
      metadata: params.metadata || {},
    });

    if (eventError && !isDuplicateError(eventError)) throw eventError;
    return;
  }
  if (params.eventType === "ai_generated") {
    sessionPatch.ai_generated_at = now;
  }
  if (params.eventType === "ai_generation_failed") {
    // Failure is intentionally not counted as ai_generated.
  }
  if (params.eventType === "google_review_clicked") {
    sessionPatch.google_review_clicked_at = now;
  }

  const { error: sessionError } = await supabase
    .from("survey_sessions")
    .upsert(sessionPatch, { onConflict: "session_id" });
  if (sessionError) throw sessionError;

  const eventKey = params.eventKey || (ONE_SHOT_EVENTS.has(params.eventType) ? params.eventType : null);
  const { error: eventError } = await supabase.from("survey_events").insert({
    store_id: params.storeId,
    session_id: params.sessionId,
    event_type: params.eventType,
    event_key: eventKey,
    metadata: params.metadata || {},
  });

  if (eventError && !isDuplicateError(eventError)) throw eventError;
}
