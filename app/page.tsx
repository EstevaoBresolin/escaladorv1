import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { CTASection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <HeroSection />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
          <FeaturesSection />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
          <HowItWorksSection />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
          <TestimonialsSection />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
          <PricingSection />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500">
          <CTASection />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
