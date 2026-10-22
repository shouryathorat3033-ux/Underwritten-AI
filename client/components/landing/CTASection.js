"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import useScrollReveal from "./useScrollReveal";

export default function CTASection() {
  const { status } = useSession();
  const ref = useScrollReveal();

  return (
    <section className="py-28 sm:py-36 relative overflow-hidden bg-[#070a13]">
      {/* Ordivalabs Ambient Blue & Rose Radial Ambiance */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(37,99,235,0.15), transparent 60%)", filter: "blur(130px)" }} />
      <div className="absolute top-1/3 right-1/4 w-[320px] h-[320px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(244,63,94,0.08), transparent 60%)", filter: "blur(90px)" }} />

      <div ref={ref} className="reveal-container w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 relative z-10 text-center">
        <span className="tech-badge mb-6 inline-flex">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          SYSTEM ACCESS · ACTIVE INTAKE
        </span>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight mb-5 text-white max-w-4xl mx-auto">
          Ready to Automate Your{" "}
          <span className="gradient-text-animated">Underwriting Decisions?</span>
        </h2>
        
        <p className="text-base sm:text-lg mb-10 max-w-xl mx-auto text-slate-400 font-normal leading-relaxed">
          Deploy mathematically grounded, evidence-backed risk intelligence in minutes. Fusing stacked machine learning with local Gemma 4 reasoning.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={status === "authenticated" ? "/dashboard" : "/assess"}
            className="btn-primary no-underline px-10 py-4 text-sm font-semibold shadow-[0_0_32px_rgba(37,99,235,0.45)] group"
          >
            {status === "authenticated" ? "Access Workbench" : "Start Risk Assessment"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <a
            href="#how-it-works"
            className="btn-secondary no-underline px-8 py-4 text-sm font-semibold group"
          >
            Review Technical Specs
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-y-0.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
