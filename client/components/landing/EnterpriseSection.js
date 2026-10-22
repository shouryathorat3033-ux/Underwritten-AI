"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useScrollReveal from "./useScrollReveal";

/**
 * Effect #5: ScrollTrigger.batch() for stagger-revealing capability cards
 */

const capabilities = [
  {
    title: "API-First Architecture",
    desc: "Every feature exposed via documented REST APIs for seamless integration with existing policy administration and core banking systems.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    title: "Cloud-Native Deployment",
    desc: "Built for Azure, AWS, and GCP with containerized microservices, auto-scaling, and zero-downtime deployments.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
      </svg>
    ),
  },
  {
    title: "Regulatory Compliance",
    desc: "IRDAI-ready with built-in fairness auditing, adverse action notices, and full audit trails for every underwriting decision.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Real-Time Data Pipelines",
    desc: "Live telematics feeds, wearable health data, and behavioral scoring via integrated IoT and third-party data APIs.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    title: "Model Governance",
    desc: "Version-controlled ML models with rollback support, drift detection, live performance monitoring, and bias testing.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
  {
    title: "Configurable Underwriting",
    desc: "Per-insurer weight customization, simulation sandbox, and multi-policy support for health, auto, life, and property lines.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
];

export default function EnterpriseSection() {
  const ref = useScrollReveal();
  const gridRef = useRef(null);
  const bannerRef = useRef(null);
  const metricRefs = useRef([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // ── Batch stagger: cards fly in as they enter viewport ──
      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll(".ent-card");

        ScrollTrigger.batch(cards, {
          start: "top 88%",
          onEnter: (batch) => {
            gsap.fromTo(batch,
              { y: 50, opacity: 0, scale: 0.92, rotateX: -8 },
              {
                y: 0, opacity: 1, scale: 1, rotateX: 0,
                duration: 0.7,
                ease: "back.out(1.4)",
                stagger: 0.08,
              }
            );
          },
          once: true,
        });
      }

      // ── Banner slide up ──
      if (bannerRef.current) {
        gsap.from(bannerRef.current, {
          y: 60,
          opacity: 0,
          scale: 0.96,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: bannerRef.current,
            start: "top 88%",
            once: true,
          },
        });
      }

      // ── Metric counter animation ──
      const metricValues = ["50ms", "0.97", "100%", "4"];
      const metricNums = [50, 0.97, 100, 4];
      metricRefs.current.forEach((el, i) => {
        if (!el) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: metricNums[i],
          duration: 1.8,
          ease: "power4.out",
          scrollTrigger: {
            trigger: bannerRef.current,
            start: "top 85%",
            once: true,
          },
          delay: i * 0.1,
          onUpdate: () => {
            if (i === 1) el.textContent = obj.val.toFixed(2);
            else el.textContent = Math.round(obj.val);
          },
          onComplete: () => {
            el.textContent = metricValues[i].replace(/[a-z%]/gi, "");
            // Re-add suffix
            el.textContent = metricValues[i];
          },
        });
      });
    }, gridRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06), transparent 70%)", filter: "blur(120px)" }} />
      <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.05), transparent 70%)", filter: "blur(100px)" }} />

      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <div ref={ref} className="reveal-container">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full mb-6" style={{ background: "rgba(16,185,129,0.08)", color: "#34d399", border: "1px solid rgba(16,185,129,0.15)", backdropFilter: "blur(8px)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981", animation: "soft-pulse 2s ease-in-out infinite" }} />
              Enterprise Ready
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: "#fafafa" }}>
              Built for{" "}
              <span className="gradient-text-animated">Enterprise Scale</span>
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: "#71717a" }}>
              Designed to integrate with enterprise insurance ecosystems — from legacy policy administration systems to modern cloud-native platforms.
            </p>
          </div>

          {/* Capability grid with batch stagger */}
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16" style={{ perspective: "800px" }}>
            {capabilities.map((cap) => (
              <div key={cap.title} className="ent-card glass-card p-5 group relative overflow-hidden" style={{ opacity: 0 }}>
                <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: "rgba(16,185,129,0.08)", filter: "blur(30px)" }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-500 group-hover:scale-110" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                  {cap.icon}
                </div>
                <h3 className="text-sm font-bold mb-1.5" style={{ color: "#fafafa" }}>{cap.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#71717a" }}>{cap.desc}</p>
              </div>
            ))}
          </div>

          {/* Persistent Systems partnership banner */}
          <div ref={bannerRef} className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(245,158,11,0.04))", border: "1px solid rgba(16,185,129,0.1)" }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top right, rgba(16,185,129,0.08), transparent 60%)" }} />
            <div className="relative px-8 py-8 sm:py-10 flex flex-col lg:flex-row items-center gap-8">
              {/* Left: Text */}
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center gap-3 mb-3 justify-center lg:justify-start">
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.12)", color: "#34d399" }}>
                    Powered By
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold mb-2" style={{ color: "#fafafa" }}>
                  Persistent Systems
                </h3>
                <p className="text-sm leading-relaxed max-w-lg" style={{ color: "#a1a1aa" }}>
                  Accelerating digital transformation for insurers worldwide. UnderwriteAI is built to complement Persistent&apos;s insurance digital suite — enabling intelligent, compliant, and scalable underwriting automation.
                </p>
              </div>

              {/* Right: Key metrics */}
              <div className="grid grid-cols-2 gap-4 shrink-0">
                {[
                  { value: "50ms", label: "Avg Prediction" },
                  { value: "0.97", label: "Model R\u00B2" },
                  { value: "100%", label: "Fairness Pass" },
                  { value: "4", label: "Policy Lines" },
                ].map((m, i) => (
                  <div key={m.label} className="text-center px-5 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div ref={(el) => (metricRefs.current[i] = el)} className="text-lg font-extrabold font-mono" style={{ color: "#10b981" }}>{m.value}</div>
                    <div className="text-[10px] font-medium uppercase tracking-wider mt-0.5" style={{ color: "#52525b" }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
