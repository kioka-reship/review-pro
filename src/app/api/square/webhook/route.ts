import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { sendEmail, emailTemplates } from "../../../../lib/sendEmail";
import { sendAdminNotification } from "../../../../lib/sendAdminNotification";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN!;
const SQUARE_API_BASE = "https://connect.squareup.com/v2";
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID!;

const PLAN_LABELS: Record<string, string> = {
  light: "ライト ¥2,980/月",
  standard: "スタンダード ¥5,980/月",
  premium: "プレミアム ¥9,800/月",
};

// プラン別月額（オプションなし）
const PLAN_MONTHLY: Record<string, number> = {
  light: 2980,
  standard: 5980,
  premium: 9800,
};

function verifySquareSignature(req: NextRequest, body: string): boolean {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signatureKey) return false;
  const signature = req.headers.get("x-square-hmacsha256-signature");
  if (!signature) return false;
  const url = `https://review-pro-ay7x.vercel.app/api/square/webhook`;
  const hmac = createHmac("sha256", signatureKey);
  hmac.update(url + body);
  const expected = hmac.digest("base64");
  return signature === expected;
}

async function isAlreadyProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .single();
  return !!data;
}

async function markAsProcessed(eventId: string, eventType: string,
