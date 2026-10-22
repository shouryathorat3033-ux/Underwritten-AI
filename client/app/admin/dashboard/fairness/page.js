"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { StaggerGrid, StaggerItem, FadeUp } from "@/components/motion/StaggerReveal";
import { getClientPythonUrl } from "@/lib/api-config";

/* ── Animated SVG ring that fills to a percentage ── */
function AnimatedRing({ value, max, color, size = 56, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      const pct = max > 0 ? Math.min(value / max, 1) : 0;
      setOffset(circumference * (1 - pct));
    }, 200);
    return () => clearTimeout(timer);
  }, [value, max, circumference]);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.23,1,0.32,1)" }}
      />
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
      <div className="flex justify-between font-mono text-[11px] mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="font-bold" style={{ color }}>
          {typeof value === "number" ? value.toFixed(value % 1 === 0 ? 0 : 2) : value}
        </span>
      </div>
      <div className="h-1.5 rounded-full relative overflow-hidden bg-zinc-800">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, background: color }}
        />
        {thresholdPct != null && (
          <div className="absolute top-0 bottom-0 w-px bg-zinc-500" style={{ left: `${thresholdPct}%` }}>
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] font-mono whitespace-nowrap text-zinc-500">
              {thresholdLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Pulsing status indicator ── */
function StatusOrb({ passed }) {
  const color = passed ? "#10B981" : "#F43F5E";
  return (
    <span className="relative flex items-center justify-center w-2.5 h-2.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

/* ── Reasoning Card ── */
function Reasoning({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 120 }}
      className="mt-3 p-3 rounded-lg text-xs font-mono leading-relaxed bg-[#070A13] border border-blue-500/20 text-zinc-300"
    >
      {children}
    </motion.div>
  );
}

const POLICY_PALETTE = {
  health: { color: "#3B82F6", code: "HLTH", label: "Health" },
  auto: { color: "#06B6D4", code: "AUTO", label: "Auto" },
  life: { color: "#818CF8", code: "LIFE", label: "Life" },
  property: { color: "#38BDF8", code: "PROP", label: "Property" },
};

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
      const pyUrl = getClientPythonUrl();
      const [fairnessRes, metricsRes, modelsRes] = await Promise.all([
        fetch(`${pyUrl}/api/ml/score/fairness`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${pyUrl}/api/ml/score/metrics`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${pyUrl}/api/ml/score/models`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      setAudit(fairnessRes);
      setMetrics({ ...(metricsRes || {}), models: modelsRes });
      setLoading(false);
    } catch {
      setError("Failed to connect to ML telemetry stream. Verify Python service availability.");
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allPassed = audit && Object.values(audit).every(a => a.overall_passed);
  const totalTests = audit ? Object.values(audit).reduce((acc, a) => acc + (a.tests?.length || 0), 0) : 0;
  const passedTests = audit ? Object.values(audit).reduce((acc, a) => acc + (a.tests?.filter(t => t.passed)?.length || 0), 0) : 0;

  const toggle = (key) => setShowReasoning(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <FadeUp>
        <div className="blueprint-card p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="absolute top-0 right-0 w-80 h-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px] tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                [ML.FAIRNESS_AUDIT]
              </span>
              <span className="font-mono text-[10px] text-zinc-500">ECOA & IRDAI DEMOGRAPHIC PARITY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Model Fairness & Algorithmic Bias Audit
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Continuous disparate impact testing, protected class variance analysis, and inference latency telemetry across all deployed actuarial models.
            </p>
          </div>

          <div className="relative z-10">
            <button
              onClick={fetchData}
              className="px-3.5 py-2 rounded-lg border border-zinc-800 bg-[#0A0F1D] text-zinc-300 hover:text-white text-xs font-mono transition flex items-center gap-2"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Execute Audit Run
            </button>
          </div>
        </div>
      </FadeUp>

      {error ? (
        <div className="blueprint-card p-8">
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      ) : loading ? (
        <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StaggerItem key={i}><StatCardSkeleton /></StaggerItem>)}
        </StaggerGrid>
      ) : (
        <div className="space-y-6">
          {/* Overall Status Hero Card */}
          <FadeUp delay={0.05}>
            <div className="blueprint-card p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <AnimatedRing value={passedTests} max={totalTests} color={allPassed ? "#10B981" : "#F43F5E"} size={72} strokeWidth={5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-xs font-bold text-white">
                    {passedTests}/{totalTests}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <StatusOrb passed={allPassed} />
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    {allPassed ? "All Statutory Fairness Tests Satisfied" : "Disparate Impact Threshold Exceeded"}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {allPassed
                    ? "Continuous testing confirms zero demographic bias across gender, age curves, and socioeconomic vectors in all 4 underwriting lines."
                    : "Statistical variance exceeds allowable threshold bounds on one or more models. Detailed factor metrics provided below."}
                </p>
                <p className="font-mono text-[10px] text-zinc-500 mt-2">
                  Test battery: ECOA 80% Rule &middot; Age Contiguity Derivative &middot; Socioeconomic Isolation
                </p>
              </div>
            </div>
          </FadeUp>

          {/* Model Fairness Grids */}
          <StaggerGrid className="grid grid-cols-1 lg:grid-cols-2 gap-6" delay={0.12}>
            {audit && Object.entries(audit).map(([policyType, data]) => {
              const theme = POLICY_PALETTE[policyType] || { color: "#3B82F6", code: "GEN", label: policyType };
              const testsPassed = data.tests?.filter(t => t.passed).length || 0;
              const testsTotal = data.tests?.length || 0;

              return (
                <StaggerItem key={policyType}>
                  <div className="blueprint-card p-6">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border"
                          style={{ background: `${theme.color}15`, color: theme.color, borderColor: `${theme.color}30` }}
                        >
                          {theme.code}
                        </span>
                        <div>
                          <h3 className="text-xs font-bold text-white uppercase tracking-wide">{policyType} Model</h3>
                          <span className="font-mono text-[10px] text-zinc-500">{testsPassed}/{testsTotal} tests passed</span>
                        </div>
                      </div>

                      <span
                        className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border"
                        style={{
                          background: data.overall_passed ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
                          color: data.overall_passed ? "#10B981" : "#F43F5E",
                          borderColor: data.overall_passed ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)",
                        }}
                      >
                        {data.overall_passed ? "PASSED" : "FAILED"}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {data.tests?.map((test) => {
                        const testName = test.test.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                        const key = `${policyType}-${test.test}`;

                        return (
                          <div key={test.test} className="bg-[#070A13] p-3 rounded-lg border border-zinc-800">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <StatusOrb passed={test.passed} />
                                <span className="font-mono text-xs font-semibold text-zinc-300">{testName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded" style={{
                                  color: test.passed ? "#10B981" : "#F43F5E",
                                }}>
                                  {test.passed ? "PASS" : "FAIL"}
                                </span>
                                <button
                                  onClick={() => toggle(key)}
                                  className="font-mono text-[10px] text-zinc-500 hover:text-blue-400 cursor-pointer"
                                >
                                  {showReasoning[key] ? "[Hide]" : "[Details]"}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2 pt-1">
                              {test.score_difference != null && (
                                <AnimatedBar value={test.score_difference} max={10} color={test.score_difference < 5 ? "#3B82F6" : "#F43F5E"} label="Gender Score Delta" threshold={5} thresholdLabel="5pt max" />
                              )}
                              {test.disparate_impact_ratio != null && (
                                <AnimatedBar value={test.disparate_impact_ratio} max={1.2} color={test.disparate_impact_ratio > 0.8 ? "#10B981" : "#F43F5E"} label="Disparate Impact Ratio" threshold={0.8} thresholdLabel="0.8 min" />
                              )}
                              {test.income_impact != null && (
                                <AnimatedBar value={test.income_impact} max={40} color={test.income_impact < 20 ? "#06B6D4" : "#F43F5E"} label="Income-Only Swing" threshold={20} thresholdLabel="20pt limit" />
                              )}
                              {test.max_jump != null && (
                                <AnimatedBar value={test.max_jump} max={50} color={test.max_jump < 25 ? "#38BDF8" : "#F43F5E"} label="Max Age Jump" threshold={25} thresholdLabel="25pt max" />
                              )}
                            </div>

                            <AnimatePresence>
                              {showReasoning[key] && (
                                <Reasoning>
                                  {test.test === "gender_disparity" && (
                                    <>Male mean: {test.male_mean_score}, Female mean: {test.female_mean_score}. Delta: {test.score_difference}pt. Ratio: {test.disparate_impact_ratio} (threshold 0.80).</>
                                  )}
                                  {test.test === "age_fairness" && (
                                    <>Age cohort test (25-75). Max step jump: {test.max_jump}pt. Full curve range: {test.score_range}pt.</>
                                  )}
                                  {test.test === "income_disparity" && (
                                    <>Low income score: {test.low_income_score}, High income: {test.high_income_score}. Impact swing: {test.income_impact}pt.</>
                                  )}
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

          {/* Live In-Flight Telemetry Metrics */}
          {metrics && (
            <FadeUp delay={0.24}>
              <div className="blueprint-card p-6">
                <span className="font-mono text-[10px] text-blue-400 block mb-1">[PERF.IN_FLIGHT_TELEMETRY]</span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Live Pipeline Latency & Inferences</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
                  {[
                    { label: "Total Inferences", value: metrics.total_predictions || 0, color: "#3B82F6", sub: "Ensemble calls" },
                    { label: "Pipeline Error Rate", value: `${metrics.error_rate || 0}%`, color: (metrics.error_rate || 0) > 5 ? "#F43F5E" : "#10B981", sub: "SLA target <1%" },
                    { label: "P50 Latency", value: `${metrics.latency?.p50 || 0}ms`, color: "#06B6D4", sub: "Median response" },
                    { label: "P99 Latency", value: `${metrics.latency?.p99 || 0}ms`, color: "#38BDF8", sub: "Tail latency" },
                  ].map(m => (
                    <div key={m.label} className="bg-[#070A13] p-4 rounded-xl border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase block">{m.label}</span>
                      <span className="text-2xl font-bold block mt-1" style={{ color: m.color }}>{m.value}</span>
                      <span className="text-[10px] text-zinc-500 mt-1 block">{m.sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          )}

          {/* Trained Models R2 Metrics */}
          {metrics?.models && (
            <FadeUp delay={0.32}>
              <div className="blueprint-card p-6">
                <span className="font-mono text-[10px] text-blue-400 block mb-1">[REGISTRY.MODEL_PERFORMANCE]</span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Trained Actuarial Ensembles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(metrics.models).map(([pt, info]) => {
                    const theme = POLICY_PALETTE[pt] || { color: "#3B82F6", code: pt };
                    return (
                      <div key={pt} className="bg-[#070A13] p-4 rounded-xl border border-zinc-800 font-mono text-xs">
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase"
                            style={{ background: `${theme.color}15`, color: theme.color, borderColor: `${theme.color}30` }}
                          >
                            {theme.code}
                          </span>
                          <span className="text-zinc-400 font-bold">{info.test_r2 ? `R² ${(info.test_r2 * 100).toFixed(0)}%` : "--"}</span>
                        </div>

                        {info.test_r2 ? (
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                                <span>R² Goodness of Fit</span>
                                <span className="font-bold text-white">{info.test_r2?.toFixed(3)}</span>
                              </div>
                              <div className="h-1 rounded-full bg-zinc-800">
                                <div className="h-full rounded-full bg-blue-500" style={{ width: `${info.test_r2 * 100}%` }} />
                              </div>
                            </div>
                            <div className="flex justify-between text-[10px] text-zinc-400 pt-1">
                              <span>MAE Prediction Error</span>
                              <span className="font-bold text-zinc-200">{info.test_mae} pts</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-zinc-600 text-[10px]">Model uninitialized</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </FadeUp>
          )}
        </div>
      )}
    </div>
  );
}
