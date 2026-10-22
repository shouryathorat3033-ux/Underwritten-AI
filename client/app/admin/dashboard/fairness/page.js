"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { StaggerGrid, StaggerItem, FadeUp } from "@/components/motion/StaggerReveal";

/* ── Animated SVG ring that fills to a percentage ── */
function AnimatedRing({ value, max, color, size = 56, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      const pct = Math.min(value / max, 1);
      setOffset(circumference * (1 - pct));
    }, 300);
    return () => clearTimeout(timer);
  }, [value, max, circumference]);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.23,1,0.32,1)" }} />
    </svg>
  );
}

/* ── Animated horizontal bar ── */
function AnimatedBar({ value, max, color, label, threshold, thresholdLabel }) {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const thresholdPct = threshold != null && max > 0 ? Math.min((threshold / max) * 100, 100) : null;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[11px] font-medium" style={{ color: "#a1a1aa" }}>{label}</span>
        <span className="text-[11px] font-mono font-semibold" style={{ color }}>{typeof value === "number" ? value.toFixed(value % 1 === 0 ? 0 : 2) : value}</span>
      </div>
      <div className="h-2 rounded-full relative overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)`, transition: "width 1s cubic-bezier(0.23,1,0.32,1)", boxShadow: `0 0 12px ${color}30` }} />
        {thresholdPct != null && (
          <div className="absolute top-0 bottom-0 w-px" style={{ left: `${thresholdPct}%`, background: "rgba(255,255,255,0.3)" }}>
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono whitespace-nowrap" style={{ color: "#52525b" }}>{thresholdLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Pulsing status orb ── */
function StatusOrb({ passed }) {
  const color = passed ? "#10b981" : "#ef4444";
  return (
    <span className="relative flex items-center justify-center w-3 h-3">
      <span className="absolute inset-0 rounded-full" style={{ background: color, opacity: 0.3, animation: "soft-pulse 2s ease-in-out infinite" }} />
      <span className="w-2 h-2 rounded-full relative" style={{ background: color, boxShadow: `0 0 8px ${color}80` }} />
    </span>
  );
}

/* ── Reasoning card (replaces ExplainAI) ── */
function Reasoning({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ type: "spring", damping: 25, stiffness: 120 }}
      className="mt-3 p-3 rounded-xl text-[11px] leading-relaxed"
      style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)", borderLeft: "2px solid #10b981", color: "#a1a1aa" }}
    >
      <div className="flex gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5">
          <path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z"/><path d="M10 22v-4M14 22v-4M10 18h4"/>
        </svg>
        <span>{children}</span>
      </div>
    </motion.div>
  );
}

const policyColors = { health: "#10b981", auto: "#f59e0b", life: "#a78bfa", property: "#60a5fa" };

export default function FairnessPage() {
  const [audit, setAudit] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReasoning, setShowReasoning] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pyUrl = process.env.NEXT_PUBLIC_PYTHON_URL || "http://127.0.0.1:8000";
      const [fairnessRes, metricsRes, modelsRes] = await Promise.all([
        fetch(`${pyUrl}/api/ml/score/fairness`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${pyUrl}/api/ml/score/metrics`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${pyUrl}/api/ml/score/models`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      setAudit(fairnessRes);
      setMetrics({ ...(metricsRes || {}), models: modelsRes });
      setLoading(false);
    } catch {
      setError("Failed to connect to ML service. Make sure Python backend is running.");
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allPassed = audit && Object.values(audit).every(a => a.overall_passed);
  const totalTests = audit ? Object.values(audit).reduce((acc, a) => acc + (a.tests?.length || 0), 0) : 0;
  const passedTests = audit ? Object.values(audit).reduce((acc, a) => acc + (a.tests?.filter(t => t.passed)?.length || 0), 0) : 0;

  const toggle = (key) => setShowReasoning(p => ({ ...p, [key]: !p[key] }));

  return (
    <div>
      <Breadcrumbs />

      {/* Header */}
      <FadeUp>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#fafafa" }}>ML Fairness Audit</h1>
            <p className="text-sm mt-1" style={{ color: "#71717a" }}>Bias testing, model metrics, and compliance dashboard</p>
          </div>
          <motion.button onClick={fetchData} className="btn-secondary text-xs group" style={{ padding: "8px 16px" }}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="transition-transform duration-500 group-hover:rotate-180"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              Re-run Audit
            </span>
          </motion.button>
        </div>
      </FadeUp>

      {error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : loading ? (
        <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <StaggerItem key={i}><StatCardSkeleton /></StaggerItem>)}
        </StaggerGrid>
      ) : (
        <>
          {/* ═══ Overall Status — hero card ═══ */}
          <FadeUp delay={0.05}>
            <div className="glass-card p-6 mb-6 relative overflow-hidden" style={{ borderColor: allPassed ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)" }}>
              {/* Ambient glow */}
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${allPassed ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)"}, transparent 70%)`, filter: "blur(40px)", animation: "glow-drift 15s infinite" }} />

              <div className="flex items-center gap-5 relative">
                {/* Animated ring showing pass ratio */}
                <div className="relative">
                  <AnimatedRing value={passedTests} max={totalTests} color={allPassed ? "#10b981" : "#ef4444"} size={64} strokeWidth={5} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span className="font-mono text-sm font-bold"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", damping: 15 }}
                      style={{ color: allPassed ? "#10b981" : "#ef4444" }}>
                      {passedTests}/{totalTests}
                    </motion.span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusOrb passed={allPassed} />
                    <h2 className="text-lg font-bold" style={{ color: allPassed ? "#10b981" : "#ef4444" }}>
                      {allPassed ? "All Fairness Tests Passed" : "Fairness Violations Detected"}
                    </h2>
                  </div>
                  <p className="text-sm" style={{ color: "#71717a" }}>
                    {allPassed ? "No demographic bias detected across all 4 policy models" : "Some models show potential bias — review details below"}
                  </p>
                </div>
              </div>

              <Reasoning>
                We test 3 types of bias per model: <strong style={{ color: "#fafafa" }}>Gender Disparity</strong> (score difference &lt;5pt, disparate impact ratio &gt;0.8 per ECOA 80% rule), <strong style={{ color: "#fafafa" }}>Age Fairness</strong> (no single age jump &gt;25pt), and <strong style={{ color: "#fafafa" }}>Income Disparity</strong> (income-only impact &lt;20pt). These thresholds follow ECOA and FCRA guidelines for insurance underwriting. {passedTests}/{totalTests} tests passed.
              </Reasoning>
            </div>
          </FadeUp>

          {/* ═══ Model Fairness Cards — staggered grid ═══ */}
          <StaggerGrid className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" delay={0.15}>
            {audit && Object.entries(audit).map(([policyType, data]) => {
              const color = policyColors[policyType] || "#10b981";
              const testsPassed = data.tests?.filter(t => t.passed).length || 0;
              const testsTotal = data.tests?.length || 0;
              return (
                <StaggerItem key={policyType}>
                  <div className="glass-card p-6 relative overflow-hidden group">
                    {/* Policy color accent line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.5 }} />
                    {/* Hover glow */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `${color}08`, filter: "blur(40px)" }} />

                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                          <AnimatedRing value={testsPassed} max={testsTotal} color={color} size={32} strokeWidth={3} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#fafafa" }}>{policyType} Insurance</h3>
                          <span className="text-[10px] font-mono" style={{ color: "#52525b" }}>{testsPassed}/{testsTotal} tests passed</span>
                        </div>
                      </div>
                      <motion.span className="text-xs font-semibold px-3 py-1 rounded-full"
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", damping: 12 }}
                        style={{
                          background: data.overall_passed ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          color: data.overall_passed ? "#34d399" : "#f87171",
                          boxShadow: data.overall_passed ? "0 0 12px rgba(16,185,129,0.1)" : "0 0 12px rgba(239,68,68,0.1)",
                        }}>
                        {data.overall_passed ? "PASS" : "FAIL"}
                      </motion.span>
                    </div>

                    <div className="space-y-3">
                      {data.tests?.map((test) => {
                        const testName = test.test.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                        const key = `${policyType}-${test.test}`;
                        return (
                          <div key={test.test} className="p-3 rounded-xl transition-all duration-300" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                            <div className="flex items-center justify-between mb-2.5">
                              <div className="flex items-center gap-2">
                                <StatusOrb passed={test.passed} />
                                <span className="text-xs font-medium" style={{ color: "#a1a1aa" }}>{testName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{
                                  background: test.passed ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                                  color: test.passed ? "#34d399" : "#f87171",
                                }}>{test.passed ? "PASS" : "FAIL"}</span>
                                <button onClick={() => toggle(key)} className="text-[9px] font-medium px-2 py-0.5 rounded transition-all duration-200" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#71717a", cursor: "pointer" }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.2)"; e.currentTarget.style.color = "#a1a1aa"; }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#71717a"; }}>
                                  {showReasoning[key] ? "Hide" : "Why?"}
                                </button>
                              </div>
                            </div>

                            {/* Animated metric bars */}
                            <div className="space-y-2">
                              {test.score_difference != null && (
                                <AnimatedBar value={test.score_difference} max={10} color={test.score_difference < 5 ? "#10b981" : "#ef4444"} label="Gender Score Difference" threshold={5} thresholdLabel="5pt limit" />
                              )}
                              {test.disparate_impact_ratio != null && (
                                <AnimatedBar value={test.disparate_impact_ratio} max={1.2} color={test.disparate_impact_ratio > 0.8 ? "#10b981" : "#ef4444"} label="Disparate Impact Ratio" threshold={0.8} thresholdLabel="0.8 min" />
                              )}
                              {test.income_impact != null && (
                                <AnimatedBar value={test.income_impact} max={40} color={test.income_impact < 20 ? "#10b981" : "#ef4444"} label="Income-Only Impact" threshold={20} thresholdLabel="20pt limit" />
                              )}
                              {test.max_jump != null && (
                                <AnimatedBar value={test.max_jump} max={50} color={test.max_jump < 25 ? "#10b981" : "#ef4444"} label="Max Age Score Jump" threshold={25} thresholdLabel="25pt limit" />
                              )}
                            </div>

                            {/* Inline reasoning */}
                            <AnimatePresence>
                              {showReasoning[key] && (
                                <Reasoning>
                                  {test.test === "gender_disparity" && <>
                                    Generated identical profiles differing only in gender. Male avg: <strong style={{ color: "#fafafa" }}>{test.male_mean_score}</strong>, Female avg: <strong style={{ color: "#fafafa" }}>{test.female_mean_score}</strong>. The {test.score_difference}pt difference is {test.score_difference < 5 ? "within" : "above"} the 5pt threshold. Disparate impact ratio of {test.disparate_impact_ratio} {test.disparate_impact_ratio > 0.8 ? "exceeds" : "falls below"} the ECOA 80% rule minimum of 0.8.
                                  </>}
                                  {test.test === "age_fairness" && <>
                                    Tested ages 25-75 with identical profiles. The largest score jump between consecutive age groups was <strong style={{ color: "#fafafa" }}>{test.max_jump}pt</strong> ({test.max_jump < 25 ? "within" : "above"} the 25pt threshold). Score range across all ages: {test.score_range}pt. A smooth age-risk curve prevents age discrimination in pricing.
                                  </>}
                                  {test.test === "income_disparity" && <>
                                    Low income score: <strong style={{ color: "#fafafa" }}>{test.low_income_score}</strong>, High income score: <strong style={{ color: "#fafafa" }}>{test.high_income_score}</strong>. Income-only impact is {test.income_impact}pt ({test.income_impact < 20 ? "within" : "above"} the 20pt threshold). This ensures income doesn&apos;t disproportionately determine risk independently of actual risk factors.
                                  </>}
                                </Reasoning>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGrid>

          {/* ═══ Live Metrics — animated counters ═══ */}
          {metrics && (
            <FadeUp delay={0.3}>
              <div className="glass-card p-6 mb-6 relative overflow-hidden">
                <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.05), transparent 70%)", filter: "blur(40px)", animation: "glow-drift 20s infinite" }} />
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 relative" style={{ color: "#fafafa" }}>Live Prediction Metrics</h3>
                <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4" delay={0.1}>
                  {[
                    { label: "Total Predictions", value: metrics.total_predictions || 0, color: "#10b981", suffix: "", reasoning: "Each prediction runs a stacked ensemble model (GradientBoosting + RandomForest) to generate a risk score." },
                    { label: "Error Rate", value: metrics.error_rate || 0, color: (metrics.error_rate || 0) > 5 ? "#ef4444" : "#10b981", suffix: "%", reasoning: "Percentage of predictions that failed to return a score. Industry SLA target is <1%." },
                    { label: "P50 Latency", value: metrics.latency?.p50 || 0, color: "#f59e0b", suffix: "ms", reasoning: "Median inference time — half of all predictions are faster. Sub-500ms is excellent for real-time underwriting." },
                    { label: "P99 Latency", value: metrics.latency?.p99 || 0, color: "#f59e0b", suffix: "ms", reasoning: "Worst-case latency. A large P50-P99 gap often indicates model cold-loading on first request." },
                  ].map(m => {
                    const key = `metric-${m.label}`;
                    return (
                      <StaggerItem key={m.label}>
                        <div className="p-4 rounded-xl relative group" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                          <p className="text-xs mb-1.5" style={{ color: "#71717a" }}>{m.label}</p>
                          <motion.p className="font-mono text-xl font-bold"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, type: "spring", damping: 20 }}
                            style={{ color: m.color }}>
                            {m.value}{m.suffix}
                          </motion.p>
                          <p className="text-[10px] mt-2 leading-relaxed" style={{ color: "#52525b" }}>{m.reasoning}</p>
                        </div>
                      </StaggerItem>
                    );
                  })}
                </StaggerGrid>
              </div>
            </FadeUp>
          )}

          {/* ═══ Trained Models — with animated R² rings ═══ */}
          {metrics?.models && (
            <FadeUp delay={0.4}>
              <div className="glass-card p-6 relative overflow-hidden">
                <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.04), transparent 70%)", filter: "blur(40px)", animation: "glow-drift 18s infinite reverse" }} />
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 relative" style={{ color: "#fafafa" }}>Trained Models</h3>
                <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" delay={0.1}>
                  {Object.entries(metrics.models).map(([pt, info]) => {
                    const color = policyColors[pt] || "#10b981";
                    return (
                      <StaggerItem key={pt}>
                        <div className="p-4 rounded-xl relative overflow-hidden group" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                          <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative">
                              <AnimatedRing value={info.test_r2 || 0} max={1} color={color} size={40} strokeWidth={3} />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[8px] font-mono font-bold" style={{ color }}>{info.test_r2 ? `${(info.test_r2 * 100).toFixed(0)}%` : "—"}</span>
                              </div>
                            </div>
                            <p className="text-xs font-bold uppercase" style={{ color: "#fafafa" }}>{pt}</p>
                          </div>
                          {info.test_r2 ? (
                            <div className="space-y-2">
                              <AnimatedBar value={info.test_r2} max={1} color="#10b981" label="R² Score" />
                              <AnimatedBar value={info.test_mae || 0} max={15} color="#f59e0b" label="MAE" />
                              <AnimatedBar value={info.cv_r2_mean || 0} max={1} color="#10b981" label="CV R² Mean" />
                              <div className="flex justify-between text-[10px] font-mono mt-2" style={{ color: "#52525b" }}>
                                <span>Type: Stacked Ensemble</span>
                              </div>
                              <p className="text-[10px] mt-1 leading-relaxed" style={{ color: "#52525b" }}>
                                Explains {(info.test_r2 * 100).toFixed(1)}% of risk score variance. Average prediction error: {info.test_mae} points on 0-100 scale. {Math.abs((info.test_r2 || 0) - (info.cv_r2_mean || 0)) < 0.02 ? "Minimal overfitting detected." : "Some train-test gap detected."}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs" style={{ color: "#52525b" }}>{info.status || "Not loaded"}</p>
                          )}
                        </div>
                      </StaggerItem>
                    );
                  })}
                </StaggerGrid>
              </div>
            </FadeUp>
          )}
        </>
      )}
    </div>
  );
}
