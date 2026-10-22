"use client";
import useScrollReveal from "./useScrollReveal";

const steps = [
  {
    num: "01",
    code: "INTAKE.01",
    title: "Multimodal Ingestion",
    desc: "Ingests applicant disclosures, extracts Aadhaar/PAN/clinical data via OCR, and establishes real-time telemetry pipelines.",
    color: "#3b82f6",
  },
  {
    num: "02",
    code: "VECTOR.02",
    title: "Feature Engineering",
    desc: "16 domain-calibrated feature vectors are normalized across clinical, financial, telematics, and policy-specific dimensions.",
    color: "#06b6d4",
  },
  {
    num: "03",
    code: "MODEL.03",
    title: "Ensemble Scoring",
    desc: "Stacked GBR + Random Forest models compute the 0–100 risk score and calculate GLM actuarial loading in under 50ms.",
    color: "#6366f1",
  },
  {
    num: "04",
    code: "AUDIT.04",
    title: "Gemma Reasoning",
    desc: "Local Gemma 4 E4B generates auditable underwriter explanations, flags uncertainties, and verifies regulatory adherence.",
    color: "#f43f5e",
  },
];

export default function HowItWorks() {
  const ref = useScrollReveal();
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative">
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <div ref={ref} className="reveal-container">
          <div className="flex items-center gap-2 mb-4">
            <span className="tech-badge">
              ACTUARIAL PIPELINE
            </span>
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
              [4-STAGE RISK PIPELINE]
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4 text-white">
            From Application to Decision in Seconds
          </h2>
          <p className="text-base sm:text-lg mb-12 max-w-2xl text-slate-400 leading-relaxed font-normal">
            Automating the end-to-end underwriting journey with deterministic mathematics and transparent AI explanation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {steps.map((s, i) => (
              <div
                key={s.num}
                className="blueprint-card p-6 relative overflow-hidden group border-blue-500/20 bg-gradient-to-b from-[#0e1526]/90 to-[#070a13]"
              >
                {/* Step indicator */}
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/30 text-blue-300">
                    [{s.code}]
                  </span>
                  <span className="font-mono text-xl font-black text-slate-700">
                    {s.num}
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-2 text-white tracking-tight">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                  {s.desc}
                </p>

                {/* Bottom calibrated line */}
                <div className="h-[2px] w-full rounded-full mt-4" style={{ background: `linear-gradient(90deg, ${s.color}, transparent)` }} />

                {/* Connector Arrow */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3.5 -translate-y-1/2 w-7 h-7 items-center justify-center rounded-full z-20 bg-[#070a13] border border-blue-500/30 text-blue-400 shadow-md">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 4l6 6-6 6"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
