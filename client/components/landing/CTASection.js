"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import useScrollReveal from "./useScrollReveal";

export default function CTASection() {
  const { status } = useSession();
  const ref = useScrollReveal();

  return (
    <section className="py-28 sm:py-36 relative overflow-hidden">
      {/* Large ambient orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08), transparent 60%)", filter: "blur(140px)" }} />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.06), transparent 60%)", filter: "blur(100px)", animation: "glow-drift 20s infinite" }} />
      <div className="absolute bottom-1/4 left-1/4 w-[250px] h-[250px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.05), transparent 60%)", filter: "blur(80px)", animation: "glow-drift 18s infinite reverse" }} />

      <div ref={ref} className="reveal-container w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 relative z-10 text-center">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full mb-6" style={{ background: "rgba(16,185,129,0.08)", color: "#34d399", border: "1px solid rgba(16,185,129,0.15)", backdropFilter: "blur(8px)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981", animation: "soft-pulse 2s ease-in-out infinite" }} />
          Get Started Today
        </span>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.1] mb-5" style={{ color: "#fafafa" }}>
          Ready to Transform Your{" "}
          <span className="gradient-text-animated">
            Underwriting?
          </span>
        </h2>
        <p className="text-base sm:text-lg mb-10 max-w-xl mx-auto" style={{ color: "#71717a", lineHeight: 1.7 }}>
          Join forward-thinking insurers using AI to make faster, smarter, and more consistent risk decisions.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={status === "authenticated" ? "/dashboard" : "/assess"}
            className="btn-primary inline-flex items-center gap-2 px-10 py-4 text-base no-underline group"
          >
            {status === "authenticated" ? "Go to Dashboard" : "Get Started Free"}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <a href="#how-it-works" className="btn-secondary inline-flex items-center gap-2 px-8 py-4 text-base no-underline group">
            Learn More
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-y-0.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
