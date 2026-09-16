import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../../lib/supabase-admin";
import {
  assertSafeMetadata,
  isSurveyEventType,
  isValidUuid,
  normalizeRating,
  normalizeSurveyAnswers,
  recordSurveyEvent,
} from "../../../../lib/surveyAnalytics";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();

  try {
    const body = await req.json();
    const storeId = body.store_id;
    const sessionId = body.session_id;
    const eventType = body.event_type;

    if (typeof storeId !== "string" || !storeId) {
      return NextResponse.json({ error: "store_id required" }, { status: 400 });
    }
    if (!isValidUuid(sessionId)) {
      return NextResponse.json({ error: "invalid session_id" }, { status: 400 });
    }
    if (!isSurveyEventType(eventType)) {
      return NextResponse.json({ error: "invalid event_type" }, { status: 400 });
    }

    const metadata = assertSafeMetadata(body.metadata);
    const answers = normalizeSurveyAnswers(body.answers);
    const rating = body.rating == null ? undefined : normalizeRating(body.rating);

    if (eventType === "survey_completed" && !rating) {
      return NextResponse.json({ error: "invalid rating" }, { status: 400 });
    }
    if (eventType === "survey_completed" && (!answers || answers.length === 0)) {
      return NextResponse.json({ error: "answers required" }, { status: 400 });
    }

    await recordSurveyEvent(supabase, {
      storeId,
      sessionId,
      eventType,
      language: typeof body.language === "string" ? body.language : "ja",
      rating: rating ?? undefined,
      answers,
      metadata,
      eventKey: typeof body.event_key === "string" ? body.event_key : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const status =
      error?.message === "store_not_found" ? 404 :
      error?.message === "store_inactive" ? 403 :
      error?.message?.startsWith("invalid") || error?.message?.includes("too_large") ? 400 :
      500;

    if (status === 500) console.error("[survey/event] failed:", error);
    return NextResponse.json({ error: error?.message || "survey event failed" }, { status });
  }
}
