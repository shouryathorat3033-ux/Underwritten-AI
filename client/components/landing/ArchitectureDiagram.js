"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Accurate System Architecture Diagram
 * Reflects the REAL pipeline: Next.js → FastAPI → Stacked Ensemble ML → Groq LLM (explanation only)
 */

/* ── Layer configs ── */
const dataInputs = [
  { label: "Applicant Form", color: "#10b981", sub: "7-step wizard" },
  { label: "Document OCR", color: "#f59e0b", sub: "8 doc types" },
  { label: "IoT / Telematics", color: "#60a5fa", sub: "Live feeds" },
];

const featureGroups = [
  { label: "Traditional", items: ["Age", "Income", "CIBIL", "Medical"], color: "#10b981" },
  { label: "Alternative", items: ["Telematics", "Behavioral", "Lifestyle", "Social"], color: "#f59e0b" },
  { label: "Policy-Specific", items: ["Health", "Auto", "Life", "Property"], color: "#a78bfa" },
];

const mlStack = [
  { label: "GBR", sub: "300 trees", color: "#10b981" },
  { label: "RF", sub: "200 trees", color: "#34d399" },
  { label: "Ridge", sub: "Meta-learner", color: "#f59e0b" },
];

const outputs = [
  { label: "Risk Score", sub: "0-100", color: "#10b981" },
  { label: "Decision", sub: "Approve / Refer / Decline", color: "#f59e0b" },
  { label: "Premium", sub: "₹ range", color: "#34d399" },
  { label: "Explanation", sub: "AI narrative", color: "#60a5fa" },
];

/* ── Small animated connector ── */
function Arrow({ lineRef, arrowRef, horizontal = false }) {
  if (horizontal) {
    return (
      <div ref={lineRef} className="flex items-center mx-1" style={{ opacity: 0 }}>
        <div style={{ width: 16, height: 1, background: "rgba(16,185,129,0.3)" }} />
        <svg width="6" height="8" viewBox="0 0 6 8" fill="none">
          <path d="M1 1l4 3-4 3" stroke="#10b981" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex justify-center" style={{ height: 16 }}>
      <div className="flex flex-col items-center">
        <div ref={lineRef} style={{ width: 1, height: 10, background: "rgba(16,185,129,0.3)", transformOrigin: "top", transform: "scaleY(0)" }} />
        <svg ref={arrowRef} width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ opacity: 0 }}>
          <path d="M1 1l3 3 3-3" stroke="#10b981" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

/* ── Section header ── */
function SectionHead({ num, label }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <div className="w-4 h-4 rounded flex items-center justify-center text-[7px] font-mono font-bold" style={{ background: "rgba(16,185,129,0.12)", color: "#34d399" }}>{num}</div>
      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#71717a" }}>{label}</span>
      <div className="flex-1 h-px ml-1" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.04), transparent)" }} />
    </div>
  );
}

export default function ArchitectureDiagram() {
  const containerRef = useRef(null);
  const lineRefs = useRef([]);
  const arrowRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial hidden states
      gsap.set(".ad-input, .ad-feat-group, .ad-ml-box, .ad-llm, .ad-fair, .ad-output, .ad-footer, .ad-harrow", { opacity: 0, y: 6 });
      gsap.set(".ad-ml-box", { scale: 0.92 });

      const tl = gsap.timeline({ delay: 0.7 });

      // 1. Inputs
      tl.to(".ad-input", { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: "power2.out" });

      // Connector 1
      if (lineRefs.current[0]) tl.to(lineRefs.current[0], { scaleY: 1, duration: 0.25, ease: "power2.inOut" }, "+=0.05");
      if (arrowRefs.current[0]) tl.to(arrowRefs.current[0], { opacity: 0.6, duration: 0.15 }, "-=0.08");

      // 2. Feature engineering
      tl.to(".ad-feat-group", { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: "power2.out" });

      // Connector 2
      if (lineRefs.current[1]) tl.to(lineRefs.current[1], { scaleY: 1, duration: 0.25, ease: "power2.inOut" }, "+=0.05");
      if (arrowRefs.current[1]) tl.to(arrowRefs.current[1], { opacity: 0.6, duration: 0.15 }, "-=0.08");

      // 3. ML Ensemble + horizontal arrows
      tl.to(".ad-ml-box", { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.08, ease: "back.out(1.4)" });
      tl.to(".ad-harrow", { opacity: 1, y: 0, duration: 0.2, stagger: 0.05 }, "-=0.2");

      // Connector 3 (splits to LLM + Fairness)
      if (lineRefs.current[2]) tl.to(lineRefs.current[2], { scaleY: 1, duration: 0.25, ease: "power2.inOut" }, "+=0.05");
      if (arrowRefs.current[2]) tl.to(arrowRefs.current[2], { opacity: 0.6, duration: 0.15 }, "-=0.08");

      // 4. LLM + Fairness side by side
      tl.to(".ad-llm", { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.3)" });
      tl.to(".ad-fair", { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.3)" }, "-=0.3");

      // Connector 4
      if (lineRefs.current[3]) tl.to(lineRefs.current[3], { scaleY: 1, duration: 0.25, ease: "power2.inOut" }, "+=0.05");
      if (arrowRefs.current[3]) tl.to(arrowRefs.current[3], { opacity: 0.6, duration: 0.15 }, "-=0.08");

      // 5. Outputs
      tl.to(".ad-output", { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: "back.out(1.5)" });

      // 6. Footer
      tl.to(".ad-footer", { opacity: 1, y: 0, duration: 0.25, stagger: 0.04 }, "-=0.15");

      // Flowing particles
      const dots = containerRef.current?.querySelectorAll(".ad-dot");
      dots?.forEach((dot, i) => {
        gsap.to(dot, { y: containerRef.current?.offsetHeight || 400, opacity: 0, duration: 3 + i * 0.5, ease: "none", repeat: -1, delay: 1.5 + i * 1 });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="glass-card p-4 lg:p-5 relative overflow-hidden" style={{ borderColor: "rgba(16,185,129,0.10)" }}>
      {/* Flowing particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div key={i} className="ad-dot absolute rounded-full" style={{ width: 2, height: 2, background: "#10b981", boxShadow: "0 0 4px rgba(16,185,129,0.5)", left: `${20 + i * 30}%`, top: 0, opacity: 0.4 }} />
        ))}
      </div>

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none" style={{ background: "rgba(16,185,129,0.03)", filter: "blur(40px)" }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#34d399" }}>System Architecture</p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.6)", animation: "breathe 2s ease-in-out infinite" }} />
          <span className="text-[8px] font-mono font-medium" style={{ color: "#10b981" }}>LIVE</span>
        </div>
      </div>

      {/* ── 1. Data Ingestion ── */}
      <SectionHead num="1" label="Data Ingestion" />
      <div className="grid grid-cols-3 gap-1.5 mb-0.5">
        {dataInputs.map((d) => (
          <div key={d.label} className="ad-input rounded-md px-2 py-1.5 text-center" style={{ background: `${d.color}08`, border: `1px solid ${d.color}15` }}>
            <p className="text-[8px] font-semibold" style={{ color: d.color }}>{d.label}</p>
            <p className="text-[7px]" style={{ color: "#52525b" }}>{d.sub}</p>
          </div>
        ))}
      </div>

      <Arrow lineRef={(el) => (lineRefs.current[0] = el)} arrowRef={(el) => (arrowRefs.current[0] = el)} />

      {/* ── 2. Feature Engineering ── */}
      <SectionHead num="2" label="Feature Engineering  ·  16 features / type" />
      <div className="grid grid-cols-3 gap-1.5 mb-0.5">
        {featureGroups.map((fg) => (
          <div key={fg.label} className="ad-feat-group rounded-md px-2 py-1.5" style={{ background: `${fg.color}06`, border: `1px solid ${fg.color}12` }}>
            <p className="text-[8px] font-semibold mb-0.5" style={{ color: fg.color }}>{fg.label}</p>
            <div className="flex flex-wrap gap-x-1">
              {fg.items.map((it) => (
                <span key={it} className="text-[7px]" style={{ color: "#52525b" }}>{it}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Arrow lineRef={(el) => (lineRefs.current[1] = el)} arrowRef={(el) => (arrowRefs.current[1] = el)} />

      {/* ── 3. Stacked Ensemble ML ── */}
      <SectionHead num="3" label="Stacked Ensemble  ·  scikit-learn" />
      <div className="rounded-lg px-2.5 py-2 mb-0.5 relative" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(52,211,153,0.02))", border: "1px solid rgba(16,185,129,0.10)" }}>
        <div className="flex items-center gap-0.5">
          {/* Base learners */}
          <div className="flex-1 flex flex-col gap-1">
            <p className="text-[7px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#52525b" }}>Base Learners</p>
            <div className="flex gap-1">
              {mlStack.slice(0, 2).map((m) => (
                <div key={m.label} className="ad-ml-box flex-1 rounded-md px-1.5 py-1 text-center" style={{ background: `${m.color}10`, border: `1px solid ${m.color}18` }}>
                  <p className="text-[8px] font-bold font-mono" style={{ color: m.color }}>{m.label}</p>
                  <p className="text-[6px]" style={{ color: "#52525b" }}>{m.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow → */}
          <div className="ad-harrow flex items-center mx-1 shrink-0" style={{ opacity: 0 }}>
            <div style={{ width: 10, height: 1, background: "rgba(16,185,129,0.3)" }} />
            <svg width="5" height="7" viewBox="0 0 5 7" fill="none"><path d="M1 1l3 2.5L1 6" stroke="#10b981" strokeWidth="0.8" strokeLinecap="round" /></svg>
          </div>

          {/* 5-fold CV */}
          <div className="ad-ml-box shrink-0 rounded-md px-1.5 py-1 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[7px] font-bold" style={{ color: "#a1a1aa" }}>5-Fold</p>
            <p className="text-[6px]" style={{ color: "#52525b" }}>CV</p>
          </div>

          {/* Arrow → */}
          <div className="ad-harrow flex items-center mx-1 shrink-0" style={{ opacity: 0 }}>
            <div style={{ width: 10, height: 1, background: "rgba(245,158,11,0.3)" }} />
            <svg width="5" height="7" viewBox="0 0 5 7" fill="none"><path d="M1 1l3 2.5L1 6" stroke="#f59e0b" strokeWidth="0.8" strokeLinecap="round" /></svg>
          </div>

          {/* Meta-learner */}
          <div className="flex-none">
            <p className="text-[7px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#52525b" }}>Meta</p>
            <div className="ad-ml-box rounded-md px-2 py-1 text-center" style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.18)" }}>
              <p className="text-[8px] font-bold font-mono" style={{ color: "#f59e0b" }}>Ridge</p>
              <p className="text-[6px]" style={{ color: "#52525b" }}>α=1.0</p>
            </div>
          </div>
        </div>

        {/* Model metrics bar */}
        <div className="flex items-center gap-2 mt-1.5 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
          {[
            { k: "R²", v: "0.97" },
            { k: "MAE", v: "2.7" },
            { k: "Latency", v: "~50ms" },
            { k: "Models", v: "4 types" },
          ].map((m) => (
            <span key={m.k} className="text-[6px]" style={{ color: "#3f3f46" }}>
              <span style={{ color: "#52525b" }}>{m.k}:</span> <span className="font-mono" style={{ color: "#10b981" }}>{m.v}</span>
            </span>
          ))}
        </div>
      </div>

      <Arrow lineRef={(el) => (lineRefs.current[2] = el)} arrowRef={(el) => (arrowRefs.current[2] = el)} />

      {/* ── 4. LLM Explanation + Fairness (side by side) ── */}
      <SectionHead num="4" label="Explanation & Compliance" />
      <div className="grid grid-cols-2 gap-1.5 mb-0.5">
        {/* LLM */}
        <div className="ad-llm rounded-md px-2 py-1.5" style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.12)" }}>
          <div className="flex items-center gap-1 mb-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
            <span className="text-[8px] font-bold" style={{ color: "#60a5fa" }}>LLM Explanation</span>
          </div>
          <p className="text-[7px] leading-relaxed" style={{ color: "#52525b" }}>Groq · Llama 3.3 70B</p>
          <p className="text-[6px] mt-0.5" style={{ color: "#3f3f46" }}>Anchored to ML score ±5pts</p>
          <p className="text-[6px]" style={{ color: "#3f3f46" }}>Narrative only, not scoring</p>
        </div>

        {/* Fairness */}
        <div className="ad-fair rounded-md px-2 py-1.5" style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.12)" }}>
          <div className="flex items-center gap-1 mb-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <span className="text-[8px] font-bold" style={{ color: "#a78bfa" }}>Fairness Audit</span>
          </div>
          <div className="space-y-0.5">
            {["Gender < 5pt diff", "Age smoothness", "Income < 20pt"].map((t) => (
              <div key={t} className="flex items-center gap-1">
                <span className="text-[7px]" style={{ color: "#10b981" }}>&#10003;</span>
                <span className="text-[6px]" style={{ color: "#52525b" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Arrow lineRef={(el) => (lineRefs.current[3] = el)} arrowRef={(el) => (arrowRefs.current[3] = el)} />

      {/* ── 5. Outputs ── */}
      <SectionHead num="5" label="Output" />
      <div className="grid grid-cols-4 gap-1 mb-0.5">
        {outputs.map((o) => (
          <div key={o.label} className="ad-output rounded-md py-1.5 px-1 text-center" style={{ background: `${o.color}06`, border: `1px solid ${o.color}10` }}>
            <p className="text-[7px] font-bold" style={{ color: o.color }}>{o.label}</p>
            <p className="text-[6px]" style={{ color: "#3f3f46" }}>{o.sub}</p>
          </div>
        ))}
      </div>

      {/* Footer: tech stack */}
      <div className="flex items-center justify-between mt-2.5 pt-2 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
        <div className="flex items-center gap-2">
          {["Next.js", "FastAPI", "MongoDB", "Cloudinary", "Groq"].map((t) => (
            <span key={t} className="ad-footer text-[7px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.03)", color: "#3f3f46", border: "1px solid rgba(255,255,255,0.04)" }}>{t}</span>
          ))}
        </div>
        <span className="ad-footer text-[7px] font-mono" style={{ color: "#3f3f46" }}>v1.0</span>
      </div>
    </div>
  );
}
