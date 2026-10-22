"use client";
import useScrollReveal from "./useScrollReveal";

const sources = [
  { label: "Clinical & Diagnostic OCR", code: "MED.V1", color: "#3b82f6", desc: "Aadhaar, PAN, blood work & pathology reports" },
  { label: "Financial & Credit Bureau", code: "FIN.V2", color: "#60a5fa", desc: "CIBIL rating, GST returns, income verification" },
  { label: "Vehicle IoT Telematics", code: "IOT.V3", color: "#06b6d4", desc: "Braking velocity, route risk & mileage telemetry" },
  { label: "Behavioral Digital Signals", code: "BEH.V4", color: "#f43f5e", desc: "App engagement frequency, lifestyle stability" },
  { label: "Biometric Wearable Health", code: "BIO.V5", color: "#a855f7", desc: "Continuous VO2 max, resting HR & sleep stages" },
  { label: "Actuarial Loss History", code: "CLM.V6", color: "#10b981", desc: "Historical cohort morbidity & mortality tables" },
];

export default function DataSources() {
  const ref = useScrollReveal();
  return (
    <section id="data-sources" className="py-24 sm:py-32 relative">
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <div ref={ref} className="reveal-container">
          <div className="flex items-center gap-2 mb-4">
            <span className="tech-badge-cyan">
              TELEMETRY FUSION
            </span>
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
              [MULTIMODAL RISK VECTORS]
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
            <div>
              <h2 className="text-3xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight mb-6 text-white">
                Beyond Static Self-Disclosures
              </h2>
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed font-normal mb-4">
                UnderwriteAI eliminates applicant dishonesty and underwriting blindspots by cross-verifying <strong className="text-blue-400 font-semibold">six independent telemetry vectors</strong> in real time.
              </p>
              <p className="text-xs sm:text-sm text-slate-500 font-mono">
                [DATA COMPLIANCE: ZERO RAW RETENTION · ENCRYPTED IN-TRANSIT WITH SHA-256 PROOFS]
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sources.map((s) => (
                <div key={s.label} className="blueprint-card p-4 group cursor-default border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[9px] font-bold text-blue-300 px-2 py-0.5 rounded bg-blue-950/40 border border-blue-500/30">
                      [{s.code}]
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                    {s.label}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
