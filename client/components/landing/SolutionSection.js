"use client";
import useScrollReveal from "./useScrollReveal";

const solutions = [
  {
    code: "SYS.01",
    tag: "ENSEMBLE ENGINE",
    title: "Stacked Machine Learning Stack",
    desc: "300-tree GBR + 200-tree Random Forest meta-learned via Ridge Regression for an industry-leading R² of 0.978 across multi-line risk tiers.",
    vectors: ["5-Fold Cross Validation", "4 Specialized Actuarial Models", "38ms Sub-Second Inference", "Dynamic Loss Calibration"],
    accent: "#3b82f6",
    badgeClass: "tech-badge",
  },
  {
    code: "SYS.02",
    tag: "TELEMETRY FUSION",
    title: "Multimodal Alternative Telemetry",
    desc: "Ingests and normalizes live IoT driving telemetry, biometric wearable indicators, and OCR document verification for 360° applicant grounding.",
    vectors: ["Aadhaar & PAN Document OCR", "Live Telematics Score Fusion", "Wearable Health Activity Logs", "Financial CIBIL & Income Ingestion"],
    accent: "#06b6d4",
    badgeClass: "tech-badge-cyan",
  },
  {
    code: "SYS.03",
    tag: "EVIDENCE REASONING",
    title: "Gemma 4 E4B Evidence Reasoning",
    desc: "Local Gemma 4 E4B model provides evidence-based underwriting explanations, cross-factor interaction audits, and actionable verification checklists.",
    vectors: ["Zero-Hallucination Grounding", "Underwriter Action Checklist", "Fact vs. Calculation Distinction", "IRDAI Circular 2020 Citing"],
    accent: "#f43f5e",
    badgeClass: "tech-badge-pink",
  },
];

export default function SolutionSection() {
  const ref = useScrollReveal();
  return (
    <section id="features" className="py-24 sm:py-32 relative">
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <div ref={ref} className="reveal-container">
          <div className="flex items-center gap-2 mb-4">
            <span className="tech-badge">
              INTELLIGENT ARCHITECTURE
            </span>
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
              [TRIPLE-VECTOR RISK ENGINE]
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4 text-white">
            High-Precision Underwriting Intelligence
          </h2>
          <p className="text-base sm:text-lg mb-12 max-w-2xl text-slate-400 leading-relaxed font-normal">
            Three interconnected intelligence layers deliver rapid mathematical scoring, multimodal data verification, and human-auditable reasoning.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {solutions.map((s) => (
              <div
                key={s.title}
                className="blueprint-card p-7 relative overflow-hidden group border-blue-500/20 bg-gradient-to-b from-[#0e1526]/90 to-[#070a13]"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={s.badgeClass}>
                    [{s.code}] {s.tag}
                  </span>
                  <span className="w-2 h-2 rounded-full" style={{ background: s.accent, boxShadow: `0 0 10px ${s.accent}` }} />
                </div>

                <h3 className="text-xl font-bold mb-3 text-white tracking-tight">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                  {s.desc}
                </p>

                <div className="space-y-2.5 pt-4 border-t border-blue-500/15">
                  <p className="font-mono text-[10px] text-blue-400 uppercase tracking-wider mb-2">Capabilities</p>
                  {s.vectors.map((v) => (
                    <div key={v} className="flex items-center gap-2.5 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.accent }} />
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="h-[2px] w-full mt-6 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
