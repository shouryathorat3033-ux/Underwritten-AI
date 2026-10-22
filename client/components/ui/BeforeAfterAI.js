"use client";
import { useState, useEffect } from "react";

const comparisons = [
  {
    label: "Underwriting Latency",
    before: "3–5 Days",
    after: null,
    afterFallback: "< 3.0 sec",
    icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    improvement: null,
  },
  {
    label: "Decision Consistency",
    before: "Erratic (Human variance)",
    after: "100% Deterministic",
    icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></>,
    improvement: "Zero subjective leakage",
  },
  {
    label: "Cost Per Case",
    before: "~2,000",
    after: "~0.40",
    icon: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></>,
    improvement: "99.98% cost reduction",
    prefix: "₹",
  },
  {
    label: "Data Inputs",
    before: "3 static forms",
    after: "16 vectors, 6 sources",
    icon: <><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></>,
    improvement: "Telemetry + Wearables + OCR",
  },
];

export default function BeforeAfterAI({ avgTime }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);

  const items = comparisons.map(c => ({
    ...c,
    after: c.after || (avgTime ? `${(avgTime / 1000).toFixed(1)} sec` : c.afterFallback),
    improvement: c.improvement || (avgTime ? `${Math.round((3 * 86400000) / Math.max(avgTime, 1))}x faster` : "~50,000x faster"),
  }));

  return (
    <div className="blueprint-card p-6 overflow-hidden relative border-blue-500/25 bg-gradient-to-b from-[#0e1526]/90 to-[#070a13]">
      <div className="flex items-center justify-between mb-5 relative">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
            BENCHMARK: LEGACY VS. UNDERWRITEAI
          </h3>
        </div>
        <span className="tech-badge-cyan text-[9px] py-0 px-2">
          [ACTUARIAL PROOFS]
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {items.map((item, i) => (
          <div
            key={item.label}
            className="rounded-xl p-4 relative overflow-hidden bg-[#070a13]/80 border border-blue-500/15"
            style={{
              opacity: animated ? 1 : 0,
              transform: animated ? "translateY(0)" : "translateY(12px)",
              transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms`,
            }}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-950/40 border border-blue-500/30 text-blue-400">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon}
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">{item.label}</p>
                {item.improvement && (
                  <span className="font-mono text-[9px] font-bold text-blue-400 px-1.5 py-0.5 rounded bg-blue-950/50 border border-blue-500/25 mt-0.5 inline-block">
                    {item.improvement}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="rounded-lg p-2.5 bg-rose-950/15 border border-rose-500/20">
                <p className="text-[8px] uppercase font-bold tracking-wider mb-1 text-slate-500">Legacy Manual</p>
                <p className="text-xs sm:text-sm font-bold text-rose-300">{item.prefix || ""}{item.before}</p>
              </div>
              <div className="rounded-lg p-2.5 bg-blue-950/30 border border-blue-500/30">
                <p className="text-[8px] uppercase font-bold tracking-wider mb-1 text-blue-400">UnderwriteAI</p>
                <p className="text-xs sm:text-sm font-bold text-cyan-300">{item.prefix || ""}{item.after}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
