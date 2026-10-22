"use client";
import { useState } from "react";

/**
 * Shows document authenticity verification status.
 * Displays inline after upload with animated check results.
 */
export default function DocumentVerificationBadge({ verification, compact = false }) {
  const [expanded, setExpanded] = useState(false);

  if (!verification) return null;

  const { authentic, confidence, verdict, reasons, checks } = verification;

  const color = verdict === "authentic" ? "#3B82F6" : verdict === "suspicious" ? "#F59E0B" : "#F43F5E";
  const bg = verdict === "authentic" ? "rgba(37,99,235," : verdict === "suspicious" ? "rgba(245,158,11," : "rgba(244,63,94,";
  const icon = verdict === "authentic"
    ? <path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" />
    : verdict === "suspicious"
    ? <><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>
    : <><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></>;
  const label = verdict === "authentic" ? "Verified Authentic" : verdict === "suspicious" ? "Review Required" : "Anomaly Flagged";

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded" style={{ background: `${bg}0.15)`, color, border: `1px solid ${color}35` }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">{icon}</svg>
        {label}
      </span>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden transition-all duration-300" style={{ background: `${bg}0.04)`, border: `1px solid ${bg}0.15)` }}>
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}
        onMouseEnter={e => e.currentTarget.style.background = `${bg}0.06)`}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${bg}0.12)` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color }}>{label}</p>
            <p className="text-[10px]" style={{ color: "#52525b" }}>{confidence}% confidence{verification.method === "forensic_analysis" ? " · Forensic" : ""}</p>
          </div>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round"
          style={{ transition: "transform 0.3s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {expanded && (
        <div className="px-3 pb-3" style={{ animation: "fade-up 0.2s cubic-bezier(0.23,1,0.32,1) both" }}>
          {/* Individual checks */}
          {checks && (
            <div className="space-y-1.5 mb-3">
              {[
                { key: "metadataCheck", label: "EXIF Metadata" },
                { key: "formatCheck", label: "Document Format" },
                { key: "contentCheck", label: "Content Validity" },
                { key: "tamperCheck", label: "Tamper Detection (ELA)" },
                { key: "noiseCheck", label: "Noise Consistency" },
                { key: "statisticalCheck", label: "Statistical Analysis" },
                { key: "aiGenerationCheck", label: "AI Generation Check" },
              ].filter(({ key }) => checks[key]).map(({ key, label }) => {
                const check = checks[key];
                if (!check) return null;
                const passed = check.passed;
                const cColor = passed === true ? "#10b981" : passed === false ? "#ef4444" : "#71717a";
                return (
                  <div key={key} className="flex items-start gap-2 px-2.5 py-2 rounded-lg" style={{ background: "rgba(0,0,0,0.15)" }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${cColor}20` }}>
                      {passed === true ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={cColor} strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                        : passed === false ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={cColor} strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={cColor} strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold" style={{ color: cColor }}>{label}</p>
                      <p className="text-[10px] leading-relaxed" style={{ color: "#71717a" }}>{check.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reasons */}
          {reasons?.length > 0 && (
            <div className="px-2.5">
              {reasons.map((r, i) => (
                <p key={i} className="text-[10px] leading-relaxed mb-1" style={{ color: "#71717a" }}>• {r}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
