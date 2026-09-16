import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "../../../lib/supabase-admin";
import { getFeatureAccess } from "../../../lib/planFeatures";
import { isValidUuid, recordSurveyEvent } from "../../../lib/surveyAnalytics";

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  const { store_id, session_id } = await req.json();
  if (!store_id) return NextResponse.json({ error: "store_id required" }, { status: 400 });
  if (session_id && !isValidUuid(session_id)) {
    return NextResponse.json({ error: "invalid session_id" }, { status: 400 });
  }

  const userAgent = req.headers.get("user-agent") || "";
  const ipAddress = req.headers.get("x-forwarded-for") || "";

  // Analytics data is collected for all active plans. Viewing permissions stay separate.
  if (session_id) {
    try {
      await recordSurveyEvent(supabase, {
        storeId: store_id,
        sessionId: session_id,
        eventType: "qr_access",
        metadata: { user_agent: userAgent.slice(0, 300), has_ip: !!ipAddress },
      });
    } catch (error) {
      console.error("[qr-log] survey analytics failed:", error);
    }
  }

  const qrAnalytics = await getFeatureAccess(supabase, store_id, "qr_analytics");
  if (qrAnalytics.enabled) {
    let shouldInsertLegacyLog = true;
    if (session_id) {
      const { data: existingLog } = await supabase
        .from("qr_access_logs")
        .select("id")
        .eq("store_id", store_id)
        .eq("session_id", session_id)
        .maybeSingle();
      shouldInsertLegacyLog = !existingLog;
    }

    if (shouldInsertLegacyLog) {
      await supabase.from("qr_access_logs").insert({
        store_id,
        session_id: session_id || null,
        user_agent: userAgent,
        ip_address: ipAddress,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
