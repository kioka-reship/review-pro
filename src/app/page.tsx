import "./globals.css";
import LPNav from "@/components/lp/LPNav";
import LPHero from "@/components/lp/LPHero";
import LPStats from "@/components/lp/LPStats";
import LPHowItWorks from "@/components/lp/LPHowItWorks";
import LPIndustries from "@/components/lp/LPIndustries";
import LPFeatures from "@/components/lp/LPFeatures";
import LPComparison from "@/components/lp/LPComparison";
import LPReviewAssets from "@/components/lp/LPReviewAssets";
import LPTimeline from "@/components/lp/LPTimeline";
import LPPricing from "@/components/lp/LPPricing";
import LPFAQ from "@/components/lp/LPFAQ";
import LPCTA from "@/components/lp/LPCTA";
import LPFooter from "@/components/lp/LPFooter";

export default function LandingPage() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&family=Outfit:wght@600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <style>{`
        body {
          margin: 0;
          padding: 0;
          background: #0F1115;
          color: #fff;
          font-family: 'Noto Sans JP', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        @media (max-width: 768px) {
          .hero-grid           { grid-template-columns: 1fr !important; }
          .hero-float-card     { display: none !important; }
          .stats-grid          { grid-template-columns: 1fr 1fr !important; }
          .step-grid           { grid-template-columns: 1fr !important; }
          .feature-grid        { grid-template-columns: 1fr !important; }
          .industry-grid       { grid-template-columns: 1fr 1fr !important; }
          .industry-bottom     { flex-direction: column !important; }
          .industry-divider    { display: none !important; }
          .comparison-grid     { grid-template-columns: 1fr !important; }
          .growth-grid         { grid-template-columns: 1fr 1fr !important; }
          .plan-grid           { grid-template-columns: 1fr !important; }
          .option-grid         { grid-template-columns: 1fr !important; }
          .faq-grid            { grid-template-columns: 1fr !important; }
          .timeline-grid       { grid-template-columns: 1fr 1fr !important; }
          .timeline-line       { display: none !important; }
          .timeline-note       { flex-direction: column !important; }
          .industry-proof-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .stats-grid    { grid-template-columns: 1fr !important; }
          .timeline-grid { grid-template-columns: 1fr !important; }
          .industry-grid { grid-template-columns: 1fr !important; }
          .growth-grid   { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <LPNav />
      <LPHero />
      <LPStats />
      <LPHowItWorks />
      <LPIndustries />
      <LPFeatures />
      <LPComparison />
      <LPReviewAssets />
      <LPTimeline />
      <LPPricing />
      <LPFAQ />
      <LPCTA />
      <LPFooter />
    </>
  );
}
