"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Ordivalabs Scientific Architecture Diagram
 * Pipeline: Intake Telemetry → Feature Vectors → Stacked Ensemble ML → Gemma 4 E4B Reasoning → Actuarial Outputs
 */

const dataInputs = [
  { label: "Applicant Form", color: "#3b82f6", sub: "7-step intake" },
  { label: "Document OCR", color: "#06b6d4", sub: "8 doc schemas" },
  { label: "IoT / Telematics", color: "#60a5fa", sub: "Live sensor feeds" },
];

const featureGroups = [
  { label: "Traditional", items: ["Age", "Income", "CIBIL", "Medical"], color: "#3b82f6" },
  { label: "Alternative", items: ["Telematics", "Behavior", "Lifestyle", "Social"], color: "#06b6d4" },
  { label: "Policy Context", items: ["Health", "Auto", "Life", "Property"], color: "#a855f7" },
];

const mlStack = [
  { label: "GBR", sub: "300 trees", color: "#3b82f6" },
  { label: "RF", sub: "200 trees", color: "#60a5fa" },
  { label: "Ridge", sub: "Meta α=1.0", color: "#f43f5e" },
];

const outputs = [
  { label: "Risk Score", sub: "0-100", color: "#3b82f6" },
  { label: "Decision", sub: "Approve / Refer", color: "#10b981" },
  { label: "GLM Premium", sub: "Actuarial INR", color: "#f59e0b" },
  { label: "Gemma Reasoning", sub: "8-Vector Audit", color: "#f43f5e" },
];

function Arrow({ lineRef, arrowRef, horizontal = false }) {
  if (horizontal) {
    return (
      <div ref={lineRef} className="flex items-center mx-1" style={{ opacity: 0 }}>
        <div style={{ width: 14, height: 1, background: "rgba(59,130,246,0.4)" }} />
        <svg width="6" height="8" viewBox="0 0 6 8" fill="none">
          <path d="M1 1l4 3-4 3" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex justify-center" style={{ height: 16 }}>
      <div className="flex flex-col items-center">
        <div ref={lineRef} style={{ width: 1, height: 10, background: "rgba(59,130,246,0.35)", transformOrigin: "top", transform: "scaleY(0)" }} />
        <svg ref={arrowRef} width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ opacity: 0 }}>
          <path d="M1 1l3 3 3-3" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function SectionHead({ num, label }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <div className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-mono font-bold bg-blue-950/60 text-blue-400 border border-blue-500/30">
        {num}
      </div>
      <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="flex-1 h-px ml-1 bg-gradient-to-r from-blue-500/20 to-transparent" />
    </div>
  );
}

export default function ArchitectureDiagram() {
  const containerRef = useRef(null);
  const lineRefs = useRef([]);
  const arrowRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".ad-input, .ad-feat-group, .ad-ml-box, .ad-llm, .ad-fair, .ad-output, .ad-footer, .ad-harrow", { opacity: 0, y: 6 });
      gsap.set(".ad-ml-box", { scale: 0.92 });

      const tl = gsap.timeline({ delay: 0.5 });

      tl.to(".ad-input", { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: "power2.out" });

      if (lineRefs.current[0]) tl.to(lineRefs.current[0], { scaleY: 1, duration: 0.25, ease: "power2.inOut" }, "+=0.05");
      if (arrowRefs.current[0]) tl.to(arrowRefs.current[0], { opacity: 0.7, duration: 0.15 }, "-=0.08");

      tl.to(".ad-feat-group", { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: "power2.out" });

      if (lineRefs.current[1]) tl.to(lineRefs.current[1], { scaleY: 1, duration: 0.25, ease: "power2.inOut" }, "+=0.05");
      if (arrowRefs.current[1]) tl.to(arrowRefs.current[1], { opacity: 0.7, duration: 0.15 }, "-=0.08");

      tl.to(".ad-ml-box", { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.08, ease: "back.out(1.4)" });
      tl.to(".ad-harrow", { opacity: 1, y: 0, duration: 0.2, stagger: 0.05 }, "-=0.2");

      if (lineRefs.current[2]) tl.to(lineRefs.current[2], { scaleY: 1, duration: 0.25, ease: "power2.inOut" }, "+=0.05");
      if (arrowRefs.current[2]) tl.to(arrowRefs.current[2], { opacity: 0.7, duration: 0.15 }, "-=0.08");

      tl.to(".ad-llm", { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.3)" });
      tl.to(".ad-fair", { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.3)" }, "-=0.3");

      if (lineRefs.current[3]) tl.to(lineRefs.current[3], { scaleY: 1, duration: 0.25, ease: "power2.inOut" }, "+=0.05");
      if (arrowRefs.current[3]) tl.to(arrowRefs.current[3], { opacity: 0.7, duration: 0.15 }, "-=0.08");

      tl.to(".ad-output", { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: "back.out(1.5)" });
      tl.to(".ad-footer", { opacity: 1, y: 0, duration: 0.25, stagger: 0.04 }, "-=0.15");
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="blueprint-card p-4 lg:p-5 relative overflow-hidden shadow-2xl border-blue-500/25">
      {/* Blueprint Calibration Crosshairs */}
      <div className="absolute top-2 left-2 font-mono text-[9px] text-blue-400/40">+ [SYS.01]</div>
      <div className="absolute top-2 right-2 font-mono text-[9px] text-blue-400/40">[FREQ: 120Hz] +</div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3.5 pt-2 relative">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-300">
            SYSTEM ARCHITECTURE · PIPELINE RUNNER
          </p>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30">
          <span>●</span> LIVE TELEMETRY
        </div>
      </div>

      {/* ── 1. Data Ingestion ── */}
      <SectionHead num="1" label="Multimodal Data Ingestion" />
      <div className="grid grid-cols-3 gap-1.5 mb-0.5">
        {dataInputs.map((d) => (
          <div key={d.label} className="ad-input rounded-lg p-2 text-center bg-[#070a13]/80 border border-blue-500/20">
            <p className="text-[9px] font-semibold text-blue-300">{d.label}</p>
            <p className="font-mono text-[7px] text-slate-500">{d.sub}</p>
          </div>
        ))}
      </div>

      <Arrow lineRef={(el) => (lineRefs.current[0] = el)} arrowRef={(el) => (arrowRefs.current[0] = el)} />

      {/* ── 2. Feature Engineering ── */}
      <SectionHead num="2" label="Calibrated Feature Engineering (16 Vectors)" />
      <div className="grid grid-cols-3 gap-1.5 mb-0.5">
        {featureGroups.map((fg) => (
          <div key={fg.label} className="ad-feat-group rounded-lg p-2 bg-[#070a13]/80 border border-blue-500/15">
            <p className="text-[9px] font-semibold mb-0.5 text-slate-200">{fg.label}</p>
            <div className="flex flex-wrap gap-x-1 font-mono text-[7px] text-slate-400">
              {fg.items.map((it) => (
                <span key={it}>• {it}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Arrow lineRef={(el) => (lineRefs.current[1] = el)} arrowRef={(el) => (arrowRefs.current[1] = el)} />

      {/* ── 3. Stacked Ensemble ML ── */}
      <SectionHead num="3" label="Stacked Ensemble ML · Scikit-Learn V1.8" />
      <div className="rounded-lg p-2.5 mb-0.5 relative bg-[#070a13]/90 border border-blue-500/25">
        <div className="flex items-center gap-1">
          {/* Base learners */}
          <div className="flex-1 flex flex-col gap-1">
            <p className="font-mono text-[7px] font-bold uppercase tracking-wider text-slate-400">Base Estimators</p>
            <div className="flex gap-1">
              {mlStack.slice(0, 2).map((m) => (
                <div key={m.label} className="ad-ml-box flex-1 rounded p-1.5 text-center bg-blue-950/40 border border-blue-500/25">
                  <p className="font-mono text-[8px] font-bold text-blue-300">{m.label}</p>
                  <p className="font-mono text-[6px] text-slate-500">{m.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="ad-harrow flex items-center mx-1 shrink-0" style={{ opacity: 0 }}>
            <div style={{ width: 10, height: 1, background: "rgba(59,130,246,0.5)" }} />
            <svg width="5" height="7" viewBox="0 0 5 7" fill="none"><path d="M1 1l3 2.5L1 6" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" /></svg>
          </div>

          {/* 5-fold CV */}
          <div className="ad-ml-box shrink-0 rounded p-1.5 text-center bg-blue-950/20 border border-blue-500/20">
            <p className="font-mono text-[7px] font-bold text-slate-300">5-Fold</p>
            <p className="font-mono text-[6px] text-slate-500">CV Stack</p>
          </div>

          {/* Arrow */}
          <div className="ad-harrow flex items-center mx-1 shrink-0" style={{ opacity: 0 }}>
            <div style={{ width: 10, height: 1, background: "rgba(244,63,94,0.5)" }} />
            <svg width="5" height="7" viewBox="0 0 5 7" fill="none"><path d="M1 1l3 2.5L1 6" stroke="#f43f5e" strokeWidth="1" strokeLinecap="round" /></svg>
          </div>

          {/* Meta-learner */}
          <div className="flex-none">
            <p className="font-mono text-[7px] font-bold uppercase tracking-wider text-rose-400">Meta-Learner</p>
            <div className="ad-ml-box rounded p-1.5 text-center bg-rose-950/30 border border-rose-500/30">
              <p className="font-mono text-[8px] font-bold text-rose-300">Ridge</p>
              <p className="font-mono text-[6px] text-slate-400">Actuarial Loss</p>
            </div>
          </div>
        </div>

        {/* Model metrics */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-blue-500/10 font-mono text-[7px]">
          <span className="text-slate-400">R² ACCURACY: <strong className="text-blue-400">0.978</strong></span>
          <span className="text-slate-400">MAE: <strong className="text-blue-400">2.4 pts</strong></span>
          <span className="text-slate-400">INFERENCE: <strong className="text-emerald-400">38ms</strong></span>
          <span className="text-slate-400">BIAS AUDIT: <strong className="text-cyan-400">PASS (0.91)</strong></span>
        </div>
      </div>

      <Arrow lineRef={(el) => (lineRefs.current[2] = el)} arrowRef={(el) => (arrowRefs.current[2] = el)} />

      {/* ── 4. Gemma 4 E4B Reasoning & Compliance ── */}
      <SectionHead num="4" label="Gemma 4 E4B Reasoning & Compliance" />
      <div className="grid grid-cols-2 gap-1.5 mb-0.5">
        <div className="ad-llm rounded-lg p-2 bg-gradient-to-br from-blue-950/40 to-[#070a13] border border-blue-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[8px] font-bold text-blue-300">Gemma 4 E4B (Ollama)</span>
            <span className="font-mono text-[7px] text-emerald-400">[LOCAL LLM]</span>
          </div>
          <p className="text-[7.5px] text-slate-400 leading-tight">Evidence-grounded explanation, underwriter checklists & factor attribution.</p>
        </div>

        <div className="ad-fair rounded-lg p-2 bg-gradient-to-br from-rose-950/20 to-[#070a13] border border-rose-500/25">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[8px] font-bold text-rose-300">IRDAI Compliance & RAG</span>
            <span className="font-mono text-[7px] text-rose-400">[AUDITABLE]</span>
          </div>
          <p className="text-[7.5px] text-slate-400 leading-tight">Regulatory citation match (Circular 2020) & actuarial GLM loading validation.</p>
        </div>
      </div>

      <Arrow lineRef={(el) => (lineRefs.current[3] = el)} arrowRef={(el) => (arrowRefs.current[3] = el)} />

      {/* ── 5. Outputs ── */}
      <SectionHead num="5" label="Validated Decision Outputs" />
      <div className="grid grid-cols-4 gap-1.5">
        {outputs.map((o) => (
          <div key={o.label} className="ad-output rounded-lg p-1.5 text-center bg-[#070a13] border border-blue-500/20">
            <p className="font-mono text-[8px] font-bold" style={{ color: o.color }}>{o.label}</p>
            <p className="font-mono text-[6.5px] text-slate-400">{o.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
