"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const RISK_COLOR = (s) => s <= 35 ? "#3b82f6" : s <= 55 ? "#f59e0b" : s <= 75 ? "#f43f5e" : "#e11d48";
const RISK_LABEL = (s) => s <= 35 ? "Optimal / Low Risk" : s <= 55 ? "Moderate Calibration" : s <= 75 ? "Elevated Variance" : "Critical Divergence";

const POLICY_META = {
  health: { label: "Health Insurance", color: "#3b82f6", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  auto: { label: "Auto Insurance", color: "#f59e0b", icon: "M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2" },
  life: { label: "Life Insurance", color: "#f43f5e", icon: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" },
  property: { label: "Property Insurance", color: "#8b5cf6", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
};

function AnimatedBar({ width, color, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(width), 100 + delay); return () => clearTimeout(t); }, [width, delay]);
  return (
    <div className="h-2 rounded-full overflow-hidden bg-slate-900 border border-slate-800">
      <div className="h-full rounded-full" style={{ width: `${w}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, boxShadow: `0 0 10px ${color}40`, transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
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
        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="10" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="10" strokeDasharray="3 9" style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />
        <circle cx="100" cy="100" r="80" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          style={{
            strokeDasharray: circ, strokeDashoffset: animated ? offset : circ,
            transition: "stroke-dashoffset 1.8s cubic-bezier(0.16,1,0.3,1)",
            transform: "rotate(-90deg)", transformOrigin: "center",
            filter: `drop-shadow(0 0 8px ${color}80)`,
          }} />
        <defs>
          <radialGradient id="scoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="60" fill="url(#scoreGlow)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-5xl font-extrabold tabular-nums tracking-tight" style={{ color, textShadow: `0 0 25px ${color}50` }}>{animated ? score : 0}</span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-1">/ 100 INDEX</span>
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
          fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="1" strokeDasharray="3 3" />
      ))}
      {/* Axis lines */}
      {factors.map((_, i) => {
        const p = getPoint(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(59,130,246,0.2)" strokeWidth="1" />;
      })}
      {/* Data polygon */}
      <polygon points={polygon} fill="rgba(37,99,235,0.15)" stroke="#3b82f6" strokeWidth="2" style={{ filter: "drop-shadow(0 0 10px rgba(59,130,246,0.4))" }} />
      {/* Data dots + labels */}
      {factors.map((f, i) => {
        const p = dataPoints[i];
        const lp = getPoint(i, maxR + 18);
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" stroke="#070a13" strokeWidth="2" />
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">{f.source.toUpperCase()}</text>
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
        <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">[CALCULATING_ACTUARIAL_VECTORS...]</p>
      </div>
    </div>
  );

  if (!assessment) return (
    <div className="text-center py-20">
      <p className="text-sm font-mono text-rose-400">ASSESSMENT DOCKET NOT RESOLVED</p>
      <Link href="/applicant/dashboard/history" className="btn-primary no-underline text-xs font-mono uppercase tracking-wider mt-4 inline-block">RETURN_TO_HISTORY</Link>
    </div>
  );

  const r = assessment.result;
  const pm = POLICY_META[assessment.policyType] || POLICY_META.health;
  const factors = r?.factors || [];
  const positiveFactors = factors.filter(f => f.impact === "positive");
  const negativeFactors = factors.filter(f => f.impact === "negative");
  const neutralFactors = factors.filter(f => f.impact === "neutral");

  const decisionReasons = {
    approve: "Applicant profile matches standard actuarial parameters. Positive baseline metrics offset secondary variance indicators.",
    refer: "Multi-modal signals present borderline variance. Forwarded to credentialed underwriter queue for manual verification.",
    decline: "Multiple critical risk vectors breached automatic tolerance limits. Combined actuarial score exceeds underwriting parameters.",
  };

  const traditionalScore = r?.traditionalScore ?? r?.riskScore ?? 50;
  const aiEnhancedScore = r?.riskScore || 50;
  const scoreDiff = traditionalScore - aiEnhancedScore;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Link href={`/applicant/dashboard/assessment/${id}`} className="no-underline inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-blue-400 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        RETURN_TO_ASSESSMENT_DOCKET
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center border" style={{ background: `${pm.color}15`, borderColor: `${pm.color}35` }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={pm.color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={pm.icon}/></svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Actuarial Deep Neural Analysis</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/20 text-blue-400 bg-blue-500/5">[DIAGNOSTIC_VECTORS]</span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-0.5">{assessment.applicant?.name} &middot; {pm.label} &middot; UUID #{id.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      {!r ? (
        <div className="blueprint-card p-12 text-center">
          <p className="text-xs font-mono text-slate-400">[NO_NEURAL_TELEMETRY_RECORDED_FOR_DOCKET]</p>
        </div>
      ) : (
        <>
          {/* ═══ Section 1: Score Overview ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gauge */}
            <div className="blueprint-card p-6 flex flex-col items-center justify-center relative overflow-hidden text-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider mb-4 text-slate-400">[COMPOSITE_RISK_INDEX]</span>
              <GaugeRing score={r.riskScore} />
              <span className="mt-4 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">
                {RISK_LABEL(r.riskScore)}
              </span>
            </div>

            {/* Decision card */}
            <div className="blueprint-card p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">[ACTUARIAL_CLASSIFICATION]</span>
                <span className="text-[9px] font-mono text-blue-400">CONF: {r.confidence}%</span>
              </div>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border" style={{ background: r.decision === "approve" ? "rgba(37,99,235,0.15)" : r.decision === "decline" ? "rgba(244,63,94,0.15)" : "rgba(245,158,11,0.15)", borderColor: r.decision === "approve" ? "rgba(59,130,246,0.35)" : r.decision === "decline" ? "rgba(244,63,94,0.35)" : "rgba(245,158,11,0.35)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={r.decision === "approve" ? "#3b82f6" : r.decision === "decline" ? "#f43f5e" : "#f59e0b"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {r.decision === "approve" && <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}
                    {r.decision === "decline" && <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>}
                    {r.decision === "refer" && <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-mono font-bold uppercase tracking-tight" style={{ color: r.decision === "approve" ? "#38bdf8" : r.decision === "decline" ? "#f43f5e" : "#fbbf24" }}>{r.decision}ed</p>
                  <p className="text-xs text-slate-400 font-mono">Statistical Confidence: <span className="text-white font-bold">{r.confidence}%</span></p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{decisionReasons[r.decision] || ""}</p>
              {r.recommendedPremium && (
                <div className="mt-4 p-3 rounded-xl border border-slate-800/80 bg-slate-950/60">
                  <p className="text-[9px] font-mono font-bold uppercase tracking-wider mb-1 text-slate-400">[ESTIMATED_BASE_PREMIUM]</p>
                  <p className="font-mono text-base font-bold text-blue-400">
                    ₹{r.recommendedPremium.min?.toLocaleString("en-IN")} — ₹{r.recommendedPremium.max?.toLocaleString("en-IN")}<span className="text-xs font-normal text-slate-500"> / year</span>
                  </p>
                </div>
              )}
            </div>

            {/* Traditional vs AI comparison */}
            <div className="blueprint-card p-6">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider mb-4 block text-slate-400">[CONVENTIONAL_VS_AI_CALIBRATION]</span>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1.5 text-xs font-mono">
                    <span className="text-slate-400">Traditional Actuarial Score</span>
                    <span className="font-bold" style={{ color: RISK_COLOR(traditionalScore) }}>{traditionalScore}</span>
                  </div>
                  <AnimatedBar width={traditionalScore} color={RISK_COLOR(traditionalScore)} delay={0} />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5 text-xs font-mono">
                    <span className="text-slate-400">AI-Enriched Score</span>
                    <span className="font-bold" style={{ color: RISK_COLOR(aiEnhancedScore) }}>{aiEnhancedScore}</span>
                  </div>
                  <AnimatedBar width={aiEnhancedScore} color={RISK_COLOR(aiEnhancedScore)} delay={200} />
                </div>
                <div className="p-3 rounded-xl text-center border border-slate-800/80 bg-slate-950/60">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">Alternative Telemetry Impact</p>
                  <p className="font-mono text-2xl font-bold mt-0.5" style={{ color: scoreDiff > 0 ? "#3b82f6" : scoreDiff < 0 ? "#f43f5e" : "#94a3b8" }}>
                    {scoreDiff > 0 ? "−" : scoreDiff < 0 ? "+" : ""}{Math.abs(scoreDiff)} PTS
                  </p>
                  <span className="text-[9px] font-mono text-slate-500">{scoreDiff > 0 ? "FAVORABLE BIOMETRICS DISCOUNT" : scoreDiff < 0 ? "ELEVATED RISK SURCHARGE" : "NEUTRAL IMPACT"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ Section 2: Factor Analysis ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar chart */}
            <div className="blueprint-card p-6">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider mb-4 block text-slate-400">[MULTI_DIMENSIONAL_RISK_RADAR]</span>
              <div className="flex justify-center py-2">
                <RadarChart factors={factors} />
              </div>
            </div>

            {/* Factor bars */}
            <div className="blueprint-card p-6">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider mb-4 block text-slate-400">[FACTOR_WEIGHT_BREAKDOWN]</span>
              <div className="space-y-3.5">
                {factors.map((f, i) => {
                  const barColor = f.impact === "positive" ? "#3b82f6" : f.impact === "negative" ? "#f43f5e" : "#f59e0b";
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-1 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: barColor }} />
                          <span className="text-slate-300 font-medium">{f.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold" style={{ color: barColor }}>{f.impact}</span>
                          <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>{f.score}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Positive Mitigators", items: positiveFactors, color: "#3b82f6", bg: "rgba(37,99,235,0.1)", icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" },
              { title: "Risk Drivers", items: negativeFactors, color: "#f43f5e", bg: "rgba(244,63,94,0.1)", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" },
              { title: "Neutral Baseline", items: neutralFactors, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 16v-4M12 8h.01" },
            ].map(section => (
              <div key={section.title} className="blueprint-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={section.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={section.icon}/></svg>
                  <p className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: section.color }}>{section.title}</p>
                  <span className="ml-auto font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ background: section.bg, color: section.color, borderColor: `${section.color}30` }}>{section.items.length}</span>
                </div>
                {section.items.length === 0 ? (
                  <p className="text-xs font-mono text-slate-500">NO VECTORS DETECTED</p>
                ) : (
                  <div className="space-y-2">
                    {section.items.map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg border border-slate-800/60 bg-slate-950/40 font-mono text-xs">
                        <span className="text-slate-300">{f.source}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold tabular-nums" style={{ color: section.color }}>{f.score}</span>
                          <span className="text-[9px] text-slate-500">W:{f.weight}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ═══ Section 4: AI Narrative ═══ */}
          <div className="blueprint-card p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z"/><path d="M10 22v-4M14 22v-4M10 18h4"/>
              </svg>
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-white">[ACTUARIAL_SYNTHESIS_REPORT]</p>
            </div>
            <p className="text-sm leading-[1.8] text-slate-300 font-sans">{r.explanation || "No detailed explanation available."}</p>
            {r.processingTime && (
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                <span>LATENCY: {r.processingTime}MS</span>
                <span>ARCHITECTURE: ENSEMBLE_V3</span>
                <span>CONFIDENCE: {r.confidence}%</span>
              </div>
            )}
          </div>

          {/* ═══ Section 5: Data Sources Used ═══ */}
          <div className="blueprint-card p-6">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider mb-4 block text-slate-400">[INGESTED_DATA_VECTORS]</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Demographic Profile", available: true },
                { label: "Fiscal Solvency", available: !!(assessment.traditionalData?.income) },
                { label: "Credit Bureau", available: !!(assessment.traditionalData?.creditScore) },
                { label: "Clinical Records", available: assessment.traditionalData?.medicalHistory?.length > 0 },
                { label: "Kinematic Telematics", available: !!(assessment.alternativeData?.telematicsScore) },
                { label: "Transaction Regularity", available: !!(assessment.alternativeData?.behavioralScore) },
                { label: "Biometric Telemetry", available: !!(assessment.alternativeData?.lifestyleScore) },
                { label: "Geospatial Satellite", available: !!(assessment.policySpecificData && Object.keys(assessment.policySpecificData).length > 0) },
              ].map(ds => (
                <div key={ds.label} className="flex items-center gap-2 p-2.5 rounded-lg border font-mono text-xs" style={{ background: ds.available ? "rgba(37,99,235,0.06)" : "rgba(10,15,29,0.3)", borderColor: ds.available ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.08)" }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 border" style={{ background: ds.available ? "rgba(37,99,235,0.15)" : "rgba(148,163,184,0.05)", borderColor: ds.available ? "rgba(59,130,246,0.3)" : "rgba(148,163,184,0.1)" }}>
                    {ds.available ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/></svg>
                    )}
                  </div>
                  <span className="truncate" style={{ color: ds.available ? "#e2e8f0" : "#64748b" }}>{ds.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
