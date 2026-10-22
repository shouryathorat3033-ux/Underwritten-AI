"use client";
import { useState, useEffect } from "react";

const sources = [
  { label: "Clinical & OCR", items: ["Aadhaar/PAN", "BMI/Labs", "Pathology"], color: "#3b82f6", icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2" /> },
  { label: "Financial Data", items: ["CIBIL Score", "Tax Returns", "Income Ratio"], color: "#60a5fa", icon: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></> },
  { label: "Vehicle IoT", items: ["Braking/G-force", "Route Severity", "Speed Delta"], color: "#06b6d4", icon: <><path d="M12 2a10 10 0 0110 10" /><path d="M12 2a14 14 0 0114 14" /><circle cx="12" cy="12" r="2" /></> },
  { label: "Wearable Health", items: ["VO2 Max", "Resting HR", "Sleep Debt"], color: "#f43f5e", icon: <path d="M18 20V10M12 20V4M6 20v-6" /> },
  { label: "Behavioral", items: ["App Activity", "Job Stability", "Consistency"], color: "#a855f7", icon: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></> },
  { label: "Actuarial Historical", items: ["Mortality Table", "Morbidity Band", "Loss Ratio"], color: "#10b981", icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></> },
];

export default function DataSourceFlow() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);

  return (
    <div className="blueprint-card p-6 relative overflow-hidden border-blue-500/25 bg-gradient-to-b from-[#0e1526]/90 to-[#070a13]">
      <div className="flex items-center justify-between mb-5 relative">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
            TELEMETRY FUSION & HARMONIZATION
          </h3>
        </div>
        <span className="tech-badge text-[9px] py-0 px-2">
          [6 INTAKE STREAMS]
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {sources.map((src, i) => (
          <div
            key={src.label}
            className="rounded-xl p-3 relative bg-[#070a13]/85 border border-blue-500/20"
            style={{
              opacity: animated ? 1 : 0,
              transform: animated ? "translateY(0) scale(1)" : "translateY(16px) scale(0.95)",
              transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-950/40 border border-blue-500/30 text-blue-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{src.icon}</svg>
              </div>
              <span className="text-[11px] font-bold text-slate-200">{src.label}</span>
            </div>
            <div className="space-y-0.5 font-mono text-[9px] text-slate-400">
              {src.items.map(item => (
                <p key={item} className="leading-tight">• {item}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Fusion Arrow Flow */}
      <div className="flex items-center justify-center gap-3 py-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-blue-500/40" />
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/40 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-300">
            Ensemble ML + Gemma 4 Engine
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-blue-500/40 to-transparent" />
      </div>

      <div className="flex justify-center flex-wrap gap-2.5 mt-2 font-mono">
        {[
          { label: "Risk Score: 0-100", color: "text-blue-300 border-blue-500/30 bg-blue-950/40" },
          { label: "GLM Rate Load", color: "text-cyan-300 border-cyan-500/30 bg-cyan-950/40" },
          { label: "Gemma Explanation", color: "text-rose-300 border-rose-500/30 bg-rose-950/40" },
          { label: "Audit Ledger Hash", color: "text-emerald-300 border-emerald-500/30 bg-emerald-950/40" },
        ].map(item => (
          <span key={item.label} className={`text-[9px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${item.color}`}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
