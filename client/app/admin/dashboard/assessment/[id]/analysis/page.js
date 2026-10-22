"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

const RISK_COLOR = (s) => s <= 35 ? "#3B82F6" : s <= 55 ? "#06B6D4" : s <= 75 ? "#F59E0B" : "#F43F5E";
const RISK_LABEL = (s) => s <= 35 ? "Low Risk" : s <= 55 ? "Moderate Risk" : s <= 75 ? "Elevated Risk" : "Critical Risk";

const POLICY_META = {
  health: { label: "Health Insurance", code: "HLTH", color: "#3B82F6", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  auto: { label: "Auto Insurance", code: "AUTO", color: "#06B6D4", icon: "M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2" },
  life: { label: "Life Insurance", code: "LIFE", color: "#818CF8", icon: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" },
  property: { label: "Property Insurance", code: "PROP", color: "#38BDF8", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
};

function AnimatedBar({ width, color, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(width), 100 + delay); return () => clearTimeout(t); }, [width, delay]);
  return (
    <div className="h-2 rounded-full overflow-hidden bg-zinc-800">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${w}%`, background: color }}
      />
    </div>
  );
}

function GaugeRing({ score, size = 200 }) {
  const [animated, setAnimated] = useState(false);
  const circ = 2 * Math.PI * 80;
  const offset = circ - (score / 100) * circ;
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);
  const color = RISK_COLOR(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="10" strokeDasharray="3 8" style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />
        <circle
          cx="100" cy="100" r="80" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          style={{
            strokeDasharray: circ,
            strokeDashoffset: animated ? offset : circ,
            transition: "stroke-dashoffset 1.8s cubic-bezier(0.16,1,0.3,1)",
            transform: "rotate(-90deg)", transformOrigin: "center",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight" style={{ color }}>
          {animated ? score : 0}
        </span>
        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">/ 100 INDEX</span>
      </div>
    </div>
  );
}

function RadarChart({ factors }) {
  if (!factors?.length) return null;
  const n = factors.length;
  const cx = 120, cy = 120, maxR = 85;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (i, r) => ({
    x: cx + r * Math.sin(i * angleStep),
    y: cy - r * Math.cos(i * angleStep),
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = factors.map((f, i) => getPoint(i, (Math.min(f.score, 100) / 100) * maxR));
  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-xs mx-auto">
      {gridLevels.map(l => (
        <polygon
          key={l}
          points={Array.from({ length: n }, (_, i) => getPoint(i, maxR * l)).map(p => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      {factors.map((_, i) => {
        const p = getPoint(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      <polygon points={polygon} fill="rgba(59,130,246,0.15)" stroke="#3B82F6" strokeWidth="2" />
      {factors.map((f, i) => {
        const p = dataPoints[i];
        const lp = getPoint(i, maxR + 16);
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#3B82F6" stroke="#070A13" strokeWidth="1.5" />
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fill="#94A3B8" fontSize="7.5" fontFamily="monospace">
              {f.source?.slice(0, 10)}
            </text>
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
    fetch(`/api/assessments/${id}`)
      .then(r => r.json())
      .then(d => { setAssessment(d.assessment); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="blueprint-card p-16 text-center">
        <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="font-mono text-xs text-zinc-400">ANALYZING MULTI-DIMENSIONAL RISK MATRIX...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="blueprint-card p-12 text-center">
        <p className="font-mono text-xs text-rose-400">ERR.404: DOSSIER VECTOR NOT FOUND</p>
        <Link href="/admin/dashboard/history" className="inline-block mt-3 text-xs font-mono text-blue-400 hover:underline">
          &larr; Back to History
        </Link>
      </div>
    );
  }

  const r = assessment.result;
  const pm = POLICY_META[assessment.policyType] || POLICY_META.health;
  const factors = r?.factors || [];
  const positiveFactors = factors.filter(f => f.impact === "positive");
  const negativeFactors = factors.filter(f => f.impact === "negative");
  const neutralFactors = factors.filter(f => f.impact === "neutral");

  const decisionReasons = {
    approve: "The applicant's multidimensional risk profile is well within statutory boundaries. Low hazard exposure and verified alternative data confirm standard policy approval.",
    refer: "Elevated variance detected in behavioral or secondary underwriting vectors. Manual underwriter clearance required prior to binding.",
    decline: "Multiple adverse actuarial flags detected. Combined hazard score exceeds permissible risk envelope.",
  };

  const traditionalScore = r?.traditionalScore ?? r?.riskScore ?? 50;
  const aiEnhancedScore = r?.riskScore || 50;
  const scoreDiff = traditionalScore - aiEnhancedScore;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Dossier Detail", href: `/admin/dashboard/assessment/${id}` },
        { label: "Neural Deep Analysis", href: "#" },
      ]} />

      {/* Header */}
      <div className="blueprint-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
              [DEEP_ANALYSIS.TELEMETRY]
            </span>
            <span
              className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border"
              style={{ background: `${pm.color}15`, color: pm.color, borderColor: `${pm.color}30` }}
            >
              {pm.code}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Actuarial Neural Deep Analysis</h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Applicant: {assessment.applicant?.name} &middot; Dossier #{id?.slice(-8).toUpperCase()}
          </p>
        </div>

        <Link
          href={`/admin/dashboard/assessment/${id}`}
          className="px-3.5 py-2 rounded-lg border border-zinc-800 bg-[#0A0F1D] text-zinc-400 hover:text-white font-mono text-xs transition inline-flex items-center gap-1.5 no-underline shrink-0"
        >
          &larr; Back to Dossier
        </Link>
      </div>

      {!r ? (
        <div className="blueprint-card p-12 text-center">
          <p className="text-xs font-mono text-zinc-500">NO STATISTICAL RESULTS AVAILABLE</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Top 3 Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Gauge */}
            <div className="blueprint-card p-6 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-[10px] text-zinc-500 uppercase block mb-3">[SYNTHESIS.COMPOSITE_RISK]</span>
              <GaugeRing score={r.riskScore} />
              <div className="mt-4">
                <span className={`font-mono text-xs font-bold px-3 py-1 rounded border ${
                  r.riskScore <= 35
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : r.riskScore <= 55
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}>
                  {RISK_LABEL(r.riskScore)}
                </span>
              </div>
            </div>

            {/* Neural Decision Card */}
            <div className="blueprint-card p-6 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] text-zinc-500 uppercase block mb-3">[DECISION.CLASSIFICATION]</span>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border font-mono font-bold text-sm ${
                    r.decision === "approve"
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                      : r.decision === "decline"
                      ? "bg-rose-500/10 border-rose-500/25 text-rose-400"
                      : "bg-amber-500/10 border-amber-500/25 text-amber-400"
                  }`}>
                    {r.decision === "approve" ? "✓" : r.decision === "decline" ? "✕" : "!"}
                  </div>
                  <div>
                    <span className="text-base font-bold text-white uppercase block">
                      {r.decision}ed
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      Confidence: {r.confidence}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  {decisionReasons[r.decision] || ""}
                </p>
              </div>

              {r.recommendedPremium && (
                <div className="bg-[#070A13] p-3 rounded-lg border border-zinc-800 mt-4">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase block">Calculated Premium Envelope</span>
                  <span className="font-mono text-sm font-bold text-blue-400 mt-0.5 block">
                    ₹{r.recommendedPremium.min?.toLocaleString("en-IN")} &ndash; ₹{r.recommendedPremium.max?.toLocaleString("en-IN")} /yr
                  </span>
                </div>
              )}
            </div>

            {/* Traditional vs AI Differential */}
            <div className="blueprint-card p-6 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] text-zinc-500 uppercase block mb-3">[MODEL.DELTA_SCORE]</span>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between font-mono text-xs mb-1">
                      <span className="text-zinc-400">Traditional Actuarial Index</span>
                      <span className="font-bold text-white">{traditionalScore}</span>
                    </div>
                    <AnimatedBar width={traditionalScore} color="#94A3B8" delay={0} />
                  </div>
                  <div>
                    <div className="flex justify-between font-mono text-xs mb-1">
                      <span className="text-blue-400 font-semibold">AI-Enhanced Underwritten</span>
                      <span className="font-bold text-blue-400">{aiEnhancedScore}</span>
                    </div>
                    <AnimatedBar width={aiEnhancedScore} color="#3B82F6" delay={200} />
                  </div>
                </div>
              </div>

              <div className="bg-[#070A13] p-3 rounded-lg border border-zinc-800 text-center mt-4">
                <span className="font-mono text-[9px] text-zinc-500 uppercase block">Underwriting Efficiency Delta</span>
                <span className={`font-mono text-xl font-bold block mt-0.5 ${scoreDiff > 0 ? "text-emerald-400" : scoreDiff < 0 ? "text-rose-400" : "text-zinc-400"}`}>
                  {scoreDiff > 0 ? "−" : scoreDiff < 0 ? "+" : ""}{Math.abs(scoreDiff)} pts
                </span>
                <span className="font-mono text-[9px] text-zinc-500 block mt-0.5">
                  Alternative data {scoreDiff > 0 ? "reduced risk profile" : scoreDiff < 0 ? "detected hidden risk" : "matched traditional model"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Radar + Factor Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="blueprint-card p-6">
              <span className="font-mono text-[10px] text-zinc-500 uppercase block mb-3">[RADAR.MULTIDIMENSIONAL_VECTORS]</span>
              <RadarChart factors={factors} />
            </div>

            <div className="blueprint-card p-6">
              <span className="font-mono text-[10px] text-zinc-500 uppercase block mb-3">[FACTORS.DECOMPOSITION]</span>
              <div className="space-y-3">
                {factors.map((f, i) => {
                  const isPos = f.impact === "positive";
                  const color = isPos ? "#3B82F6" : "#F43F5E";
                  return (
                    <div key={i} className="bg-[#070A13] p-2.5 rounded-lg border border-zinc-800/80">
                      <div className="flex justify-between items-center mb-1 font-mono text-xs">
                        <span className="text-zinc-300 font-semibold">{f.source}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold" style={{ color }}>{f.impact}</span>
                          <span className="font-bold text-white">{f.score}/100</span>
                        </div>
                      </div>
                      <AnimatedBar width={f.score} color={color} delay={i * 60} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Impact Summary Tri-Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Favorable Factors", code: "[VECTOR.POSITIVE]", items: positiveFactors, color: "#10B981" },
              { title: "Adverse Indicators", code: "[VECTOR.NEGATIVE]", items: negativeFactors, color: "#F43F5E" },
              { title: "Neutral Modifiers", code: "[VECTOR.NEUTRAL]", items: neutralFactors, color: "#F59E0B" },
            ].map(section => (
              <div key={section.title} className="blueprint-card p-5">
                <div className="flex items-center justify-between mb-3 font-mono">
                  <span className="text-[9px] text-zinc-500 uppercase">{section.code}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border" style={{ color: section.color, borderColor: `${section.color}30` }}>
                    {section.items.length} ACTIVE
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mb-3">{section.title}</h4>
                {section.items.length === 0 ? (
                  <p className="font-mono text-xs text-zinc-600">ZERO INDICATORS DETECTED</p>
                ) : (
                  <div className="space-y-1.5 font-mono text-xs">
                    {section.items.map((f, i) => (
                      <div key={i} className="bg-[#070A13] p-2 rounded border border-zinc-800/60 flex justify-between items-center">
                        <span className="text-zinc-300">{f.source}</span>
                        <span className="font-bold" style={{ color: section.color }}>{f.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Section 4: Narrative Synthesis */}
          <div className="blueprint-card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                [SYNTHESIS.REASONING_LOG]
              </span>
              <span className="font-mono text-[10px] text-zinc-500">ENGINE: GEMMA_4_E4B</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
              {r.explanation || "No automated explanation available."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
