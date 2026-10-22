"use client";
import { useState, useEffect } from "react";

const comparisons = [
  {
    label: "Decision Speed",
    before: "3-5 Days",
    after: null, // computed from real data
    afterFallback: "< 5 sec",
    icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    improvement: null,
  },
  {
    label: "Consistency",
    before: "Varies by underwriter",
    after: "100% consistent",
    icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></>,
    improvement: "Same input = same output",
  },
  {
    label: "Cost Per Case",
    before: "~2,000",
    after: "~0.50",
    icon: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></>,
    improvement: "99.97% reduction",
    prefix: "₹",
  },
  {
    label: "Data Sources",
    before: "3-4 traditional",
    after: "15 features, 6 sources",
    icon: <><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></>,
    improvement: "Traditional + Alternative",
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
    <div className="glass-card p-6 overflow-hidden relative" style={{ borderColor: "rgba(16,185,129,0.12)" }}>
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full pointer-events-none" style={{ background: "rgba(16,185,129,0.04)", filter: "blur(50px)" }} />

      <div className="flex items-center justify-between mb-5 relative">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#fafafa" }}>
          <span className="inline-flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            Traditional vs AI-Powered Underwriting
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, i) => (
          <div key={item.label} className="rounded-xl p-4 relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              opacity: animated ? 1 : 0,
              transform: animated ? "translateY(0)" : "translateY(12px)",
              transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms`,
            }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(16,185,129,0.08)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: "#a1a1aa" }}>{item.label}</p>
                {item.improvement && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981" }}>
                    {item.improvement}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg p-2.5" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.08)" }}>
                <p className="text-[9px] uppercase font-bold tracking-wider mb-1" style={{ color: "#71717a" }}>Before</p>
                <p className="text-sm font-semibold" style={{ color: "#f87171" }}>{item.prefix || ""}{item.before}</p>
              </div>
              <div className="rounded-lg p-2.5" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.08)" }}>
                <p className="text-[9px] uppercase font-bold tracking-wider mb-1" style={{ color: "#71717a" }}>After AI</p>
                <p className="text-sm font-semibold" style={{ color: "#10b981" }}>{item.prefix || ""}{item.after}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
