"use client";

/**
 * ProductRecommendations — displays personalized insurance product suggestions
 * returned by the ML scoring engine.
 *
 * Props:
 *   recommendations — [{ product, type, suitability, description, reason }]
 *   policyType — health, auto, life, property (for theming)
 */

const typeIcons = {
  "Individual Health": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
  ),
  "Family Health": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
  ),
  "Top-Up Health": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
  ),
  "Rider / Standalone": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  "Rider on Term Plan": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  Rider: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /></svg>
  ),
  "OD + TP": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3l-4 4-4-4" /></svg>
  ),
  "TP Liability": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
  ),
  "Usage-Based Insurance": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
  ),
  "Term Plan": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" /></svg>
  ),
  TROP: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
  ),
  "Insurance + Investment": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
  ),
  "Basic Property": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
  ),
  "Structure + Contents": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
  ),
  "Add-On": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
  ),
};

const defaultIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
);

const suitColors = {
  high: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.18)", text: "#10b981", label: "Recommended" },
  medium: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.18)", text: "#f59e0b", label: "Consider" },
  low: { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)", text: "#71717a", label: "Optional" },
};

export default function ProductRecommendations({ recommendations = [], policyType }) {
  if (!recommendations.length) return null;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.1)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: "#fafafa" }}>Recommended Products</h3>
          <p className="text-[10px]" style={{ color: "#52525b" }}>Personalized suggestions based on your risk profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recommendations.map((rec, i) => {
          const suit = suitColors[rec.suitability] || suitColors.medium;
          const icon = typeIcons[rec.type] || defaultIcon;

          return (
            <div
              key={i}
              className="rounded-xl p-4 transition-all duration-300 group"
              style={{
                background: suit.bg,
                border: `1px solid ${suit.border}`,
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${suit.text}15`, color: suit.text }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="text-[12px] font-bold leading-tight" style={{ color: "#fafafa" }}>{rec.product}</p>
                    <p className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "#52525b" }}>{rec.type}</p>
                  </div>
                </div>
                <span
                  className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: `${suit.text}15`, color: suit.text, border: `1px solid ${suit.text}25` }}
                >
                  {suit.label}
                </span>
              </div>

              {/* Description */}
              <p className="text-[11px] leading-relaxed mb-2" style={{ color: "#a1a1aa" }}>{rec.description}</p>

              {/* Reason */}
              <div className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <p className="text-[10px] leading-relaxed" style={{ color: "#71717a" }}>
                  <span className="font-semibold" style={{ color: suit.text }}>Why: </span>
                  {rec.reason}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981", animation: "soft-pulse 2s ease-in-out infinite" }} />
        <span className="text-[9px]" style={{ color: "#3f3f46" }}>Generated by ML scoring engine based on risk profile, age, income, and policy-specific factors</span>
      </div>
    </div>
  );
}
