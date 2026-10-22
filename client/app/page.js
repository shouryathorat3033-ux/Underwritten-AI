import AnimatedBackground from "@/components/layout/AnimatedBackground";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/landing/Hero";
import TrustBar from "@/components/landing/TrustBar";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import HowItWorks from "@/components/landing/HowItWorks";
import DataSources from "@/components/landing/DataSources";
import CTASection from "@/components/landing/CTASection";
import EnterpriseSection from "@/components/landing/EnterpriseSection";
import BeforeAfterAI from "@/components/ui/BeforeAfterAI";
import DataSourceFlow from "@/components/ui/DataSourceFlow";


export default function HomePage() {
  return (
    <>
      <AnimatedBackground />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <TrustBar />

        {/* Divider */}
        <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
          <div className="divider-glow" />
        </div>

        <ProblemSection />

        {/* Animated connector: Problem → Solution */}
        <div className="h-32 flex flex-col items-center justify-center relative">
          <div className="w-px h-full" style={{ background: "linear-gradient(to bottom, rgba(239,68,68,0.2), rgba(16,185,129,0.4))" }} />
          <div className="w-5 h-5 rounded-full absolute top-1/2 -translate-y-1/2" style={{ background: "radial-gradient(circle, #34d399, #10b981)", boxShadow: "0 0 16px rgba(16,185,129,0.6), 0 0 40px rgba(16,185,129,0.2)", animation: "pulse-glow 3s ease-in-out infinite" }} />
        </div>

        <SolutionSection />

        <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
          <div className="divider-glow" />
        </div>

        <HowItWorks />

        <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
          <div className="divider-glow" />
        </div>

        <DataSources />

        <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
          <div className="divider-glow" />
        </div>

        {/* Before vs After + Data Source Fusion */}
        <section className="py-24 sm:py-32">
          <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full mb-6" style={{ background: "rgba(16,185,129,0.08)", color: "#34d399", border: "1px solid rgba(16,185,129,0.15)", backdropFilter: "blur(8px)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981", animation: "soft-pulse 2s ease-in-out infinite" }} />
                Why AI Underwriting
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: "#fafafa" }}>
                The Impact of{" "}
                <span className="gradient-text-animated">Intelligent Automation</span>
              </h2>
              <p className="text-base max-w-2xl mx-auto" style={{ color: "#71717a" }}>
                See how AI-powered underwriting transforms every aspect of risk assessment compared to traditional manual processes.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <BeforeAfterAI />
              <DataSourceFlow />
            </div>
          </div>
        </section>

        <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
          <div className="divider-glow" />
        </div>

        <EnterpriseSection />

        <CTASection />
      </main>
      <Footer />
    </>
  );
}
