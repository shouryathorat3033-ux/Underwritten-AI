"use client";
import { useState, useEffect } from "react";

/**
 * Traditional vs AI-Enhanced scoring comparison with animated bars.
 */
export default function ComparisonView({ traditionalScore, aiScore }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);

  if (traditionalScore == null || aiScore == null) return null;

  const diff = traditionalScore - aiScore;
  const improved = diff > 0;
  const diffColor = improved ? "#10b981" : diff < 0 ? "#ef4444" : "#71717a";

  const riskColor = (s) => s <= 35 ? "#10b981" : s <= 55 ? "#f59e0b" : s <= 75 ? "#ef4444" : "#dc2626";

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold" style={{ color: "#fafafa" }}>Traditional vs AI Scoring</h3>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: `${diffColor}12`, border: `1px solid ${diffColor}20` }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={diffColor} strokeWidth="2.5" strokeLinecap="round">
            {improved ? <path d="M12 19V5M5 12l7-7 7 7" /> : diff < 0 ? <path d="M12 5v14M5 12l7 7 7-7" /> : <path d="M5 12h14" />}
          </svg>
          <span className="text-[11px] font-bold font-mono" style={{ color: diffColor }}>{Math.abs(diff)} pts {improved ? "better" : diff < 0 ? "worse" : ""}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Traditional */}
        <div>
          <div className="flex justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: "#71717a" }} />
              <span className="text-xs font-medium" style={{ color: "#a1a1aa" }}>Traditional (no alternative data)</span>
            </div>
            <span className="font-mono text-sm font-bold" style={{ color: riskColor(traditionalScore) }}>{traditionalScore}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="h-full rounded-full" style={{
              width: animated ? `${traditionalScore}%` : "0%",
              background: `linear-gradient(90deg, ${riskColor(traditionalScore)}40, ${riskColor(traditionalScore)})`,
              transition: "width 1.2s cubic-bezier(0.23,1,0.32,1)",
            }} />
          </div>
        </div>

        {/* AI Enhanced */}
        <div>
          <div className="flex justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.5)" }} />
              <span className="text-xs font-medium" style={{ color: "#fafafa" }}>AI-Enhanced (with alternative data)</span>
            </div>
            <span className="font-mono text-sm font-bold" style={{ color: riskColor(aiScore) }}>{aiScore}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="h-full rounded-full" style={{
              width: animated ? `${aiScore}%` : "0%",
              background: `linear-gradient(90deg, ${riskColor(aiScore)}40, ${riskColor(aiScore)})`,
              transition: "width 1.4s cubic-bezier(0.23,1,0.32,1) 0.2s",
              boxShadow: `0 0 12px ${riskColor(aiScore)}30`,
            }} />
          </div>
        </div>
      </div>

      {/* Impact explanation */}
      <div className="mt-4 p-3 rounded-xl text-[11px] leading-relaxed" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}>
        <span style={{ color: "#71717a" }}>
          {improved
            ? `Alternative data (telematics, behavioral, lifestyle) reduced the risk score by ${diff} points, which could lower the premium significantly.`
            : diff < 0
            ? `Alternative data increased the risk score by ${Math.abs(diff)} points. Some behavioral signals indicate elevated risk.`
            : "Alternative data had no significant impact on the risk score."
          }
        </span>
      </div>
    </div>
  );
}
