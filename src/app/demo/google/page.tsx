import { DemoGooglePage } from "@/components/demo/ReviewProDemo";

export default function Page() {
  return <DemoGooglePage googleReviewUrl={process.env.DEMO_GOOGLE_REVIEW_URL ?? null} />;
}
