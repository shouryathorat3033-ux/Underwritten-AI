"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useScrollReveal from "./useScrollReveal";

const capabilities = [
  {
    title: "API-First Architecture",
    code: "CAP.01",
    desc: "Every feature exposed via documented REST APIs for seamless integration with Guidewire, Duck Creek, SAP, and core banking backbones.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    title: "Cloud-Native Deployment",
    code: "CAP.02",
    desc: "Deployable on AWS, Azure, GCP, or on-premises GPU nodes with isolated microservices, Kubernetes auto-scaling, and 99.99% SLA.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
      </svg>
    ),
  },
  {
    title: "Regulatory Adherence",
    code: "CAP.03",
    desc: "IRDAI Circular 2020 certified with built-in fairness auditing, algorithmic disparate impact ratios, and adverse action logs.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Real-Time Telemetry Streaming",
    code: "CAP.04",
    desc: "Direct ingestion of vehicle OBD-II telematics, connected wearable fitness metrics, and banking aggregator financial feeds.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    title: "Local LLM Evidence Audit",
    code: "CAP.05",
    desc: "Local Gemma 4 E4B reasoning provides zero-data-leakage evidence attribution, automated checklists, and actuarial narratives.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
  {
    title: "Actuarial Weight Studio",
    code: "CAP.06",
    desc: "Per-carrier actuarial weight tuning with live portfolio sensitivity simulations across health, motor, life, and commercial lines.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll(".ent-card");

        ScrollTrigger.batch(cards, {
          start: "top 88%",
          onEnter: (batch) => {
            gsap.fromTo(batch,
              { y: 40, opacity: 0, scale: 0.94 },
              {
                y: 0, opacity: 1, scale: 1,
                duration: 0.65,
                ease: "back.out(1.4)",
                stagger: 0.08,
              }
            );
          },
          once: true,
        });
      }

      const metricValues = ["38ms", "0.978", "100%", "4 Lines"];
      const metricNums = [38, 0.978, 100, 4];
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
            if (i === 1) el.textContent = obj.val.toFixed(3);
            else el.textContent = Math.round(obj.val);
          },
          onComplete: () => {
            el.textContent = metricValues[i];
          },
        });
      });
    }, gridRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <div ref={ref} className="reveal-container">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="tech-badge mb-4">
              ENTERPRISE SPECIFICATIONS
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 text-white tracking-tight">
              Engineered for Carrier Scale
            </h2>
            <p className="text-base sm:text-lg max-w-2xl mx-auto text-slate-400 font-normal">
              High-throughput underwriting infrastructure designed to integrate with global policy admin systems, microservices, and regulatory frameworks.
            </p>
          </div>

          {/* Capability Grid */}
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {capabilities.map((cap) => (
              <div key={cap.title} className="ent-card blueprint-card p-6 group border-blue-500/20 bg-gradient-to-b from-[#0e1526]/85 to-[#070a13]" style={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-950/40 border border-blue-500/30 text-blue-400">
                    {cap.icon}
                  </div>
                  <span className="font-mono text-[9px] text-blue-400/80 px-2 py-0.5 rounded bg-blue-950/40 border border-blue-500/25">
                    [{cap.code}]
                  </span>
                </div>
                <h3 className="text-base font-bold mb-2 text-white tracking-tight">{cap.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400">{cap.desc}</p>
              </div>
            ))}
          </div>

          {/* Benchmark Panel */}
          <div ref={bannerRef} className="blueprint-card p-8 sm:p-10 border-blue-500/30 bg-gradient-to-r from-[#0a0f1d] via-[#0e1526] to-[#0a0f1d] relative overflow-hidden">
            <div className="relative flex flex-col lg:flex-row items-center gap-8 justify-between">
              <div className="flex-1 text-center lg:text-left">
                <span className="tech-badge-cyan text-[10px] mb-3 inline-flex">
                  BENCHMARK VALIDATION
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
                  Actuarial Performance Certified
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
                  Every underwriting decision adheres to rigorous mathematical proofs, sub-second latency targets, and zero-disparate-impact fairness guidelines.
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0 font-mono">
                {[
                  { value: "38ms", label: "Inference Time" },
                  { value: "0.978", label: "Model R² Fit" },
                  { value: "100%", label: "Fairness Pass" },
                  { value: "4 Lines", label: "Actuarial Tariffs" },
                ].map((m, i) => (
                  <div key={m.label} className="p-4 rounded-xl text-center bg-[#070a13] border border-blue-500/25">
                    <div ref={(el) => (metricRefs.current[i] = el)} className="text-xl font-black text-cyan-300">{m.value}</div>
                    <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1">{m.label}</div>
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
