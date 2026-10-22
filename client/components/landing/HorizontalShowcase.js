"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BeforeAfterAI from "@/components/ui/BeforeAfterAI";
import DataSourceFlow from "@/components/ui/DataSourceFlow";

/**
 * Effect #7: Horizontal scroll section
 * The "Why AI Underwriting" section pins in place and scrolls
 * horizontally through BeforeAfter and DataSourceFlow panels
 * using ScrollTrigger pin + scrub.
 */
export default function HorizontalShowcase() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Only enable horizontal scroll on desktop (lg+)
    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const track = trackRef.current;
      const section = sectionRef.current;
      if (!track || !section) return;

      const totalScroll = track.scrollWidth - window.innerWidth;

      gsap.to(track, {
        x: -totalScroll,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${totalScroll}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Parallax on heading text while scrolling
      if (headingRef.current) {
        gsap.to(headingRef.current, {
          x: -80,
          opacity: 0.3,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${totalScroll * 0.5}`,
            scrub: 0.5,
          },
        });
      }
    });

    // Mobile: just stagger-reveal the panels
    mm.add("(max-width: 1023px)", () => {
      gsap.from(".hscroll-panel", {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.2,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          once: true,
        },
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      {/* Track: all panels side-by-side on desktop */}
      <div
        ref={trackRef}
        className="flex flex-col lg:flex-row lg:flex-nowrap items-stretch gap-8 lg:gap-0 py-24 sm:py-32 px-6 sm:px-12 lg:px-0"
      >
        {/* Panel 1: Heading */}
        <div
          ref={headingRef}
          className="lg:w-screen lg:shrink-0 flex items-center justify-center lg:px-20"
        >
          <div className="max-w-xl text-center lg:text-left">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full mb-6" style={{ background: "rgba(16,185,129,0.08)", color: "#34d399", border: "1px solid rgba(16,185,129,0.15)", backdropFilter: "blur(8px)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981", animation: "soft-pulse 2s ease-in-out infinite" }} />
              Why AI Underwriting
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight" style={{ color: "#fafafa" }}>
              The Impact of{" "}
              <span className="gradient-text-animated">Intelligent Automation</span>
            </h2>
            <p className="text-base lg:text-lg max-w-lg" style={{ color: "#71717a" }}>
              See how AI-powered underwriting transforms every aspect of risk assessment compared to traditional manual processes.
            </p>
            {/* Scroll hint (desktop only) */}
            <div className="hidden lg:flex items-center gap-2 mt-8" style={{ color: "#3f3f46" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              <span className="text-xs font-medium uppercase tracking-wider">Scroll to explore</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Before vs After */}
        <div className="hscroll-panel lg:w-[600px] lg:shrink-0 lg:flex lg:items-center lg:px-10">
          <BeforeAfterAI />
        </div>

        {/* Panel 3: Data Source Fusion */}
        <div className="hscroll-panel lg:w-[600px] lg:shrink-0 lg:flex lg:items-center lg:px-10">
          <DataSourceFlow />
        </div>

        {/* Panel 4: Summary stat */}
        <div className="hscroll-panel lg:w-[500px] lg:shrink-0 lg:flex lg:items-center lg:px-10">
          <div className="glass-card p-8 w-full text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(16,185,129,0.1)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
              </svg>
            </div>
            <h3 className="text-2xl font-extrabold mb-2" style={{ color: "#fafafa" }}>
              <span style={{ color: "#10b981" }}>50,000x</span> Faster
            </h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#71717a" }}>
              From 3-5 days of manual review to under 5 seconds of AI-powered analysis with higher accuracy and consistency.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: "99.97%", label: "Cost Reduction" },
                { val: "100%", label: "Consistency" },
                { val: "15+", label: "Data Sources" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="text-sm font-bold font-mono" style={{ color: "#10b981" }}>{m.val}</div>
                  <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "#52525b" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
