"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const RISK_COLOR = (s) => s <= 35 ? "#10b981" : s <= 55 ? "#f59e0b" : s <= 75 ? "#ef4444" : "#dc2626";
const RISK_LABEL = (s) => s <= 35 ? "Low Risk" : s <= 55 ? "Moderate Risk" : s <= 75 ? "High Risk" : "Critical Risk";

const POLICY_META = {
  health: { label: "Health Insurance", color: "#10b981", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  auto: { label: "Auto Insurance", color: "#f59e0b", icon: "M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2" },
  life: { label: "Life Insurance", color: "#a78bfa", icon: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" },
  property: { label: "Property Insurance", color: "#60a5fa", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
};

function AnimatedBar({ width, color, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(width), 100 + delay); return () => clearTimeout(t); }, [width, delay]);
  return (
    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
      <div className="h-full rounded-full" style={{ width: `${w}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)`, boxShadow: `0 0 12px ${color}30`, transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
  );
}

function GaugeRing({ score, size = 200 }) {
  const [animated, setAnimated] = useState(false);
  const circ = 2 * Math.PI * 80;
  const offset = circ - (score / 100) * circ;
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);
  const color = RISK_COLOR(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="12" strokeDasharray="4 12" style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />
        <circle cx="100" cy="100" r="80" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          style={{
            strokeDasharray: circ, strokeDashoffset: animated ? offset : circ,
            transition: "stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1)",
            transform: "rotate(-90deg)", transformOrigin: "center",
            filter: `drop-shadow(0 0 10px ${color}60)`,
          }} />
        <defs>
          <radialGradient id="scoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.08" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="60" fill="url(#scoreGlow)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-5xl font-bold tabular-nums" style={{ color, textShadow: `0 0 30px ${color}40` }}>{animated ? score : 0}</span>
        <span className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>out of 100</span>
      </div>
    </div>
  );
}

function RadarChart({ factors }) {
  if (!factors?.length) return null;
  const n = factors.length;
  const cx = 120, cy = 120, maxR = 90;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (i, r) => ({
    x: cx + r * Math.sin(i * angleStep),
    y: cy - r * Math.cos(i * angleStep),
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = factors.map((f, i) => getPoint(i, (f.score / 100) * maxR));
  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 240 240" className="w-full" style={{ maxWidth: 320 }}>
      {/* Grid rings */}
      {gridLevels.map(l => (
        <polygon key={l} points={Array.from({ length: n }, (_, i) => getPoint(i, maxR * l)).map(p => `${p.x},${p.y}`).join(" ")}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {/* Axis lines */}
      {factors.map((_, i) => {
        const p = getPoint(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
      })}
      {/* Data polygon */}
      <polygon points={polygon} fill="rgba(16,185,129,0.12)" stroke="#10b981" strokeWidth="2" style={{ filter: "drop-shadow(0 0 8px rgba(16,185,129,0.3))" }} />
      {/* Data dots + labels */}
      {factors.map((f, i) => {
        const p = dataPoints[i];
        const lp = getPoint(i, maxR + 18);
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#10b981" stroke="#09090b" strokeWidth="2" />
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fill="#71717a" fontSize="8" fontFamily="var(--font-sans)">{f.source}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AnalysisPage() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/assessments/${id}`).then(r => r.json()).then(d => { setAssessment(d.assessment); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
      <div className="flex flex-col items-center gap-4">
        <div style={{ width: 48, height: 48, border: "3px solid rgba(16,185,129,0.15)", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin-anim 0.8s linear infinite" }} />
        <p className="text-sm" style={{ color: "#71717a" }}>Analyzing assessment data...</p>
      </div>
    </div>
  );

  if (!assessment) return (
    <div className="text-center py-20">
      <p className="text-sm" style={{ color: "#f87171" }}>Assessment not found</p>
      <Link href="/applicant/dashboard/history" className="btn-primary no-underline text-sm mt-4 inline-block">Back to History</Link>
    </div>
  );

  const r = assessment.result;
  const pm = POLICY_META[assessment.policyType] || POLICY_META.health;
  const factors = r?.factors || [];
  const positiveFactors = factors.filter(f => f.impact === "positive");
  const negativeFactors = factors.filter(f => f.impact === "negative");
  const neutralFactors = factors.filter(f => f.impact === "neutral");

  const decisionReasons = {
    approve: "The applicant's overall risk profile is within acceptable thresholds. Key positive indicators outweigh risk factors, and the AI model has high confidence in a favorable outcome.",
    refer: "The assessment contains mixed signals requiring human underwriter review. Some risk factors are elevated but not conclusive enough for an automated decision.",
    decline: "Multiple high-risk indicators were detected. The combined risk score exceeds the automatic approval threshold, and negative factors significantly outweigh positive ones.",
  };

  // Traditional score comes from ML model (scored without alternative data)
  const traditionalScore = r?.traditionalScore ?? r?.riskScore ?? 50;
  const aiEnhancedScore = r?.riskScore || 50;
  const scoreDiff = traditionalScore - aiEnhancedScore;

  return (
    <div>
      {/* Header */}
      <Link href={`/applicant/dashboard/assessment/${id}`} className="no-underline inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: "#52525b" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Assessment
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${pm.color}15` }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={pm.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={pm.icon}/></svg>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold" style={{ color: "#fafafa" }}>AI Deep Analysis</h1>
          <p className="text-xs" style={{ color: "#52525b" }}>{assessment.applicant?.name} &middot; {pm.label}</p>
        </div>
      </div>

      {!r ? (
        <div className="glass-card p-12 text-center mt-6">
          <p className="text-sm" style={{ color: "#71717a" }}>No AI analysis results available for this assessment.</p>
        </div>
      ) : (
        <>
          {/* ═══ Section 1: Score Overview ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Gauge */}
            <div className="glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 50%, ${RISK_COLOR(r.riskScore)}08, transparent 70%)` }} />
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: "#52525b" }}>Overall Risk Score</p>
              <GaugeRing score={r.riskScore} />
              <span className={`mt-4 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${r.riskScore <= 35 ? "risk-low" : r.riskScore <= 55 ? "risk-medium" : "risk-high"}`}>
                {RISK_LABEL(r.riskScore)}
              </span>
            </div>

            {/* Decision card */}
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none" style={{ background: `${r.decision === "approve" ? "#10b981" : r.decision === "decline" ? "#ef4444" : "#f59e0b"}06`, filter: "blur(30px)" }} />
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: "#52525b" }}>AI Decision</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: r.decision === "approve" ? "rgba(16,185,129,0.12)" : r.decision === "decline" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={r.decision === "approve" ? "#10b981" : r.decision === "decline" ? "#ef4444" : "#f59e0b"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {r.decision === "approve" && <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}
                    {r.decision === "decline" && <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>}
                    {r.decision === "refer" && <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-bold capitalize" style={{ color: r.decision === "approve" ? "#34d399" : r.decision === "decline" ? "#f87171" : "#fbbf24" }}>{r.decision}ed</p>
                  <p className="text-xs" style={{ color: "#52525b" }}>Confidence: <span className="font-mono font-semibold" style={{ color: "#a1a1aa" }}>{r.confidence}%</span></p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#71717a" }}>{decisionReasons[r.decision] || ""}</p>
              {r.recommendedPremium && (
                <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#52525b" }}>Recommended Premium</p>
                  <p className="font-mono text-lg font-bold" style={{ color: "#10b981" }}>
                    ₹{r.recommendedPremium.min?.toLocaleString("en-IN")} — ₹{r.recommendedPremium.max?.toLocaleString("en-IN")}<span className="text-xs font-normal" style={{ color: "#52525b" }}>/year</span>
                  </p>
                </div>
              )}
            </div>

            {/* Traditional vs AI comparison */}
            <div className="glass-card p-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: "#52525b" }}>Traditional vs AI-Enhanced</p>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-medium" style={{ color: "#71717a" }}>Traditional Score</span>
                    <span className="text-xs font-mono font-bold" style={{ color: RISK_COLOR(traditionalScore) }}>{traditionalScore}</span>
                  </div>
                  <AnimatedBar width={traditionalScore} color={RISK_COLOR(traditionalScore)} delay={0} />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-medium" style={{ color: "#71717a" }}>AI-Enhanced Score</span>
                    <span className="text-xs font-mono font-bold" style={{ color: RISK_COLOR(aiEnhancedScore) }}>{aiEnhancedScore}</span>
                  </div>
                  <AnimatedBar width={aiEnhancedScore} color={RISK_COLOR(aiEnhancedScore)} delay={200} />
                </div>
                <div className="p-3 rounded-lg text-center" style={{ background: scoreDiff > 0 ? "rgba(16,185,129,0.06)" : scoreDiff < 0 ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <p className="text-xs" style={{ color: "#71717a" }}>Alternative data {scoreDiff > 0 ? "reduced" : scoreDiff < 0 ? "increased" : "maintained"} risk by</p>
                  <p className="font-mono text-2xl font-bold" style={{ color: scoreDiff > 0 ? "#10b981" : scoreDiff < 0 ? "#ef4444" : "#71717a" }}>
                    {scoreDiff > 0 ? "−" : scoreDiff < 0 ? "+" : ""}{Math.abs(scoreDiff)} pts
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ Section 2: Factor Analysis ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Radar chart */}
            <div className="glass-card p-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: "#52525b" }}>Risk Factor Radar</p>
              <div className="flex justify-center">
                <RadarChart factors={factors} />
              </div>
            </div>

            {/* Factor bars with positive/negative split */}
            <div className="glass-card p-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: "#52525b" }}>Factor Breakdown</p>
              <div className="space-y-3">
                {factors.map((f, i) => {
                  const barColor = f.impact === "positive" ? "#10b981" : f.impact === "negative" ? "#ef4444" : "#f59e0b";
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: barColor }} />
                          <span className="text-xs font-medium" style={{ color: "#a1a1aa" }}>{f.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-semibold" style={{ color: barColor }}>{f.impact}</span>
                          <span className="text-xs font-mono font-bold tabular-nums" style={{ color: barColor }}>{f.score}</span>
                        </div>
                      </div>
                      <AnimatedBar width={f.score} color={barColor} delay={i * 80} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ═══ Section 3: Impact Summary ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              { title: "Positive Factors", items: positiveFactors, color: "#10b981", bg: "rgba(16,185,129,0.06)", icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" },
              { title: "Risk Factors", items: negativeFactors, color: "#ef4444", bg: "rgba(239,68,68,0.06)", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" },
              { title: "Neutral Factors", items: neutralFactors, color: "#f59e0b", bg: "rgba(245,158,11,0.06)", icon: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 16v-4M12 8h.01" },
            ].map(section => (
              <div key={section.title} className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={section.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={section.icon}/></svg>
                  <p className="text-sm font-semibold" style={{ color: section.color }}>{section.title}</p>
                  <span className="ml-auto font-mono text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: section.bg, color: section.color }}>{section.items.length}</span>
                </div>
                {section.items.length === 0 ? (
                  <p className="text-xs" style={{ color: "#3f3f46" }}>None detected</p>
                ) : (
                  <div className="space-y-2">
                    {section.items.map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <span className="text-xs" style={{ color: "#a1a1aa" }}>{f.source}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold tabular-nums" style={{ color: section.color }}>{f.score}</span>
                          <span className="text-[9px]" style={{ color: "#52525b" }}>w:{f.weight}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ═══ Section 4: AI Narrative ═══ */}
          <div className="glass-card p-6 mt-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)" }} />
            <div className="flex items-center gap-2 mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z"/><path d="M10 22v-4M14 22v-4M10 18h4"/>
              </svg>
              <p className="text-sm font-semibold" style={{ color: "#fafafa" }}>AI Explanation</p>
            </div>
            <p className="text-sm leading-[1.8]" style={{ color: "#a1a1aa" }}>{r.explanation || "No detailed explanation available."}</p>
            {r.processingTime && (
              <div className="flex items-center gap-3 mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <span className="text-[10px] font-mono" style={{ color: "#3f3f46" }}>Processed in {r.processingTime}ms</span>
                <span className="text-[10px] font-mono" style={{ color: "#3f3f46" }}>Model: llama-3.3-70b</span>
                <span className="text-[10px] font-mono" style={{ color: "#3f3f46" }}>Confidence: {r.confidence}%</span>
              </div>
            )}
          </div>

          {/* ═══ Section 5: Data Sources Used ═══ */}
          <div className="glass-card p-6 mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: "#52525b" }}>Data Sources Analyzed</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { label: "Applicant Profile", available: true },
                { label: "Financial Data", available: !!(assessment.traditionalData?.income) },
                { label: "Credit Score", available: !!(assessment.traditionalData?.creditScore) },
                { label: "Medical History", available: assessment.traditionalData?.medicalHistory?.length > 0 },
                { label: "Telematics", available: !!(assessment.alternativeData?.telematicsScore) },
                { label: "Behavioral Data", available: !!(assessment.alternativeData?.behavioralScore) },
                { label: "Lifestyle Score", available: !!(assessment.alternativeData?.lifestyleScore) },
                { label: "Policy-Specific", available: !!(assessment.policySpecificData && Object.keys(assessment.policySpecificData).length > 0) },
              ].map(ds => (
                <div key={ds.label} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: ds.available ? "rgba(16,185,129,0.04)" : "rgba(255,255,255,0.01)", border: `1px solid ${ds.available ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)"}` }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: ds.available ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)" }}>
                    {ds.available ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/></svg>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: ds.available ? "#a1a1aa" : "#3f3f46" }}>{ds.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
