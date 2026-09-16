import type { SupabaseClient } from "@supabase/supabase-js";

export type StandardFeatureKey = "low_review_pro" | "feedback_list" | "qr_analytics";

export type FeatureAccess = {
  enabled: boolean;
  source: "premium" | "option" | "none";
  optionCreatedAt: string | null;
};

export const STANDARD_OPTION_FEATURES: StandardFeatureKey[] = [
  "low_review_pro",
  "feedback_list",
  "qr_analytics",
];

export function isStandardFeatureKey(value: string): value is StandardFeatureKey {
  return (STANDARD_OPTION_FEATURES as string[]).includes(value);
}

export async function getFeatureAccess(
  supabase: SupabaseClient,
  storeId: string,
  featureKey: StandardFeatureKey,
): Promise<FeatureAccess> {
  const { data: store } = await supabase
    .from("stores")
    .select("plan, status")
    .eq("id", storeId)
    .maybeSingle();

  if (!store || store.status !== "契約中") {
    return { enabled: false, source: "none", optionCreatedAt: null };
  }

  if (store.plan === "premium") {
    return { enabled: true, source: "premium", optionCreatedAt: null };
  }

  if (store.plan !== "standard") {
    return { enabled: false, source: "none", optionCreatedAt: null };
  }

  const { data: opt } = await supabase
    .from("option_subscriptions")
    .select("status, created_at")
    .eq("store_id", storeId)
    .eq("option_key", featureKey)
    .eq("status", "active")
    .maybeSingle();

  if (!opt) {
    return { enabled: false, source: "none", optionCreatedAt: null };
  }

  return { enabled: true, source: "option", optionCreatedAt: opt.created_at ?? null };
}

export async function listEffectiveOptions(supabase: SupabaseClient, storeId: string) {
  const { data: store } = await supabase
    .from("stores")
    .select("plan, status")
    .eq("id", storeId)
    .maybeSingle();

  if (!store || store.status !== "契約中") return [];

  const { data: options, error } = await supabase
    .from("option_subscriptions")
    .select("option_key, status")
    .eq("store_id", storeId)
    .eq("status", "active");

  if (error) throw error;

  if (store.plan !== "premium") return options ?? [];

  const existingKeys = new Set((options ?? []).map((option: any) => option.option_key));
  const premiumOptions = STANDARD_OPTION_FEATURES
    .filter((featureKey) => !existingKeys.has(featureKey))
    .map((featureKey) => ({
      option_key: featureKey,
      status: "active",
      source: "premium",
    }));

  return [...(options ?? []), ...premiumOptions];
}
