"use client";
import { useState, useEffect } from "react";

const sources = [
  { label: "Personal Data", items: ["Age", "Gender", "Occupation"], color: "#10b981", icon: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
  { label: "Financial Data", items: ["Income", "Credit Score", "Policies"], color: "#f59e0b", icon: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></> },
  { label: "Medical Records", items: ["History", "BMI", "Medications"], color: "#ef4444", icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2" /> },
  { label: "IoT & Telematics", items: ["Driving Score", "Wearables", "GPS"], color: "#60a5fa", icon: <><path d="M12 2a10 10 0 0110 10" /><path d="M12 2a14 14 0 0114 14" /><circle cx="12" cy="12" r="2" /></> },
  { label: "Behavioral", items: ["Spending", "Digital Footprint", "Habits"], color: "#a78bfa", icon: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></> },
  { label: "Lifestyle", items: ["Exercise", "Sleep", "Nutrition"], color: "#34d399", icon: <path d="M18 20V10M12 20V4M6 20v-6" /> },
];

export default function DataSourceFlow() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);

  return (
    <div className="glass-card p-6 relative overflow-hidden" style={{ borderColor: "rgba(16,185,129,0.1)" }}>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full pointer-events-none" style={{ background: "rgba(16,185,129,0.04)", filter: "blur(50px)" }} />

      <h3 className="text-xs font-bold uppercase tracking-wider mb-5 relative" style={{ color: "#fafafa" }}>
        <span className="inline-flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
          Multi-Source Data Fusion
        </span>
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {sources.map((src, i) => (
          <div key={src.label} className="rounded-xl p-3 relative" style={{
            background: `${src.color}04`,
            border: `1px solid ${src.color}15`,
            opacity: animated ? 1 : 0,
            transform: animated ? "translateY(0) scale(1)" : "translateY(16px) scale(0.95)",
            transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
          }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${src.color}12` }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={src.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{src.icon}</svg>
              </div>
              <span className="text-[11px] font-semibold" style={{ color: src.color }}>{src.label}</span>
            </div>
            <div className="space-y-0.5">
              {src.items.map(item => (
                <p key={item} className="text-[10px]" style={{ color: "#52525b" }}>{item}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Arrow flow */}
      <div className="flex items-center justify-center gap-3 py-3">
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.3))" }} />
        <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round"><path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z" /><path d="M10 22v-4M14 22v-4M10 18h4" /></svg>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#10b981" }}>ML + AI Engine</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </div>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(16,185,129,0.3), transparent)" }} />
      </div>

      <div className="flex justify-center gap-4 mt-2">
        {["Risk Score", "Decision", "Premium", "Explanation"].map(label => (
          <span key={label} className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.06)", color: "#10b981", border: "1px solid rgba(16,185,129,0.1)" }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
