"use client";
import useScrollReveal from "./useScrollReveal";

const problems = [
  {
    num: "01",
    code: "ERR.LATENCY",
    title: "Weeks of Manual Document Bottlenecks",
    desc: "Legacy underwriting demands manual reviews of clinical histories and tax forms, creating expensive 2-to-3 week turnaround times that bleed customer conversion.",
    tag: "High Cost & Drop-off",
  },
  {
    num: "02",
    code: "ERR.FRAGMENTATION",
    title: "Siloed & Incomplete Risk Profiles",
    desc: "Underwriters toggle between fragmented databases, missing dynamic wearable signals, telematics behavioral data, and real-time medical diagnostic indicators.",
    tag: "Blindspot Exposure",
  },
  {
    num: "03",
    code: "ERR.VARIABILITY",
    title: "Subjective & Inconsistent Decisions",
    desc: "Human cognitive fatigue and varying risk tolerances lead to erratic premium loadings across branches, exposing carriers to loss-ratio volatility and regulatory non-compliance.",
    tag: "Actuarial Leakage",
  },
];

export default function ProblemSection() {
  const ref = useScrollReveal();
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <div ref={ref} className="reveal-container">
          <div className="flex items-center gap-2 mb-4">
            <span className="tech-badge-pink">
              DIAGNOSTIC MATRIX
            </span>
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
              [LEGACY SHORTFALLS]
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4 text-white">
            Why Legacy Underwriting Fails Modern Portfolios
          </h2>
          <p className="text-base sm:text-lg mb-12 max-w-2xl text-slate-400 leading-relaxed font-normal">
            Traditional underwriting models were built for a paper-first era, resulting in slow turnaround, uncalibrated risk premiums, and zero audit explainability.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {problems.map((p) => (
              <div key={p.num} className="blueprint-card p-7 relative overflow-hidden group border-rose-500/20 bg-gradient-to-b from-[#0e1526]/90 to-[#070a13]">
                {/* Background Large Number */}
                <span className="absolute top-2 right-4 font-mono text-6xl font-black text-rose-500/5 pointer-events-none select-none">
                  {p.num}
                </span>

                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-[10px] font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-950/40 border border-rose-500/30">
                    [{p.code}]
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    CRITICALITY: HIGH
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-3 text-white tracking-tight">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-400 mb-6 font-normal">
                  {p.desc}
                </p>

                <div className="pt-4 border-t border-rose-500/10 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-rose-400/90 font-medium">
                    IMPACT: {p.tag}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
