"use client";
import { useState, useEffect, useCallback } from "react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { StatCardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { FadeUp } from "@/components/motion/StaggerReveal";

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/analytics").then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch("/api/assessments").then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    ]).then(([s, a]) => {
      setStats(s);
      setAssessments(a.assessments || []);
      setLoading(false);
    }).catch(() => {
      setError("Failed to load analytics data");
      setLoading(false);
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const cards = [
    { label: "Total Ingested Dockets", value: stats?.total || 0, color: "#3b82f6", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6", tag: "[DOCKET.AGG]" },
    { label: "Mean Composite Risk", value: stats?.avgRisk ? Math.round(stats.avgRisk) : 0, color: "#f59e0b", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", tag: "[ACT.MEAN]" },
    { label: "Pipeline Clearance Rate", value: stats?.approvalRate ? `${Math.round(stats.approvalRate)}%` : "0%", color: "#38bdf8", icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3", tag: "[PASS.RATE]" },
    { label: "Mean Reasoning Latency", value: stats?.avgTime ? `${(stats.avgTime / 1000).toFixed(1)}s` : "0s", color: "#8b5cf6", icon: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83", tag: "[LATENCY]" },
  ];

  const decisions = [
    { label: "Approved", count: stats?.approved || 0, color: "#3b82f6" },
    { label: "Referred", count: stats?.referred || 0, color: "#f59e0b" },
    { label: "Declined", count: stats?.declined || 0, color: "#f43f5e" },
  ];
  const totalDecisions = decisions.reduce((a, d) => a + d.count, 0) || 1;

  const riskBuckets = buildRiskBuckets(assessments);
  const monthlyData = buildMonthlyTrend(assessments);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <FadeUp>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/20 text-blue-400 bg-blue-500/5">[SYS.METRICS // COCKPIT]</span>
              <span className="text-[10px] font-mono text-slate-400">TELEMETRY_PIPELINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Actuarial Intelligence Analytics</h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">High-precision portfolio underwriting telemetry & risk vector distribution</p>
          </div>
          <button onClick={fetchData} className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-mono border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 cursor-pointer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            RE_CALIBRATE
          </button>
        </div>
      </FadeUp>

      {error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              cards.map((c) => (
                <div key={c.label} className="blueprint-card p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-mono text-slate-400">{c.tag}</span>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ background: `${c.color}15`, borderColor: `${c.color}35` }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={c.icon} />
                      </svg>
                    </div>
                  </div>
                  <p className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: c.color }}>{c.value}</p>
                  <p className="text-[11px] font-mono uppercase text-slate-400 mt-1">{c.label}</p>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Decision donut chart */}
            <div className="blueprint-card p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">[DECISION_ALLOCATION_MATRIX]</span>
                <span className="text-[9px] font-mono text-blue-400">STATUS_DIST</span>
              </div>
              {loading ? (
                <ChartSkeleton height={180} />
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-8 py-2">
                  {/* Donut */}
                  <div className="relative w-36 h-36 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90">
                      {(() => {
                        let cumulative = 0;
                        return decisions.map((d) => {
                          const pct = (d.count / totalDecisions) * 100;
                          const offset = cumulative;
                          cumulative += pct;
                          return (
                            <circle
                              key={d.label}
                              cx="18" cy="18" r="15.91"
                              fill="none"
                              stroke={d.color}
                              strokeWidth="3.2"
                              strokeDasharray={`${pct} ${100 - pct}`}
                              strokeDashoffset={-offset}
                              strokeLinecap="round"
                              style={{ transition: "stroke-dasharray 0.8s ease" }}
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono text-2xl font-extrabold text-white">{totalDecisions === 1 && !stats?.total ? 0 : totalDecisions}</span>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">DOCKETS</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-col gap-3 flex-1 w-full">
                    {decisions.map((d) => (
                      <div key={d.label} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800/60 bg-slate-950/40 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                          <span className="text-slate-300 uppercase">{d.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white tabular-nums">{d.count}</span>
                          <span className="text-[10px] text-slate-500">
                            ({totalDecisions > 0 ? Math.round((d.count / totalDecisions) * 100) : 0}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Risk Distribution Bar Chart */}
            <div className="blueprint-card p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">[PORTFOLIO_RISK_HISTOGRAM]</span>
                <span className="text-[9px] font-mono text-blue-400">10-PT BUCKETS</span>
              </div>
              {loading ? (
                <ChartSkeleton height={180} />
              ) : (
                <div>
                  <div className="flex items-end gap-1.5 h-40 px-1">
                    {riskBuckets.map((b) => {
                      const maxCount = Math.max(...riskBuckets.map(x => x.count), 1);
                      const heightPct = (b.count / maxCount) * 100;
                      return (
                        <div key={b.label} className="flex-1 flex flex-col items-center justify-end h-full">
                          <span className="text-[9px] font-mono font-bold mb-1" style={{ color: b.color, opacity: b.count > 0 ? 1 : 0 }}>
                            {b.count}
                          </span>
                          <div
                            className="w-full max-w-[28px] rounded-t transition-all duration-700"
                            style={{
                              height: `${Math.max(heightPct, 4)}%`,
                              background: `linear-gradient(to top, ${b.color}, ${b.color}88)`,
                              boxShadow: b.count > 0 ? `0 0 8px ${b.color}30` : "none",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-1.5 pt-2 mt-1 border-t border-slate-800/80">
                    {riskBuckets.map((b) => (
                      <div key={b.label} className="flex-1 text-center">
                        <span className="text-[8px] font-mono text-slate-400 block">{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Policy Type Breakdown */}
          <div className="blueprint-card p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">[CATEGORICAL_POLICY_VECTOR]</span>
              <span className="text-[9px] font-mono text-blue-400">4 ACTIVE DOMAINS</span>
            </div>
            {loading ? (
              <ChartSkeleton height={120} />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: "health", label: "Health", color: "#3b82f6", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
                  { id: "auto", label: "Auto", color: "#f59e0b", icon: "M12 2L2 7l10 5 10-5-10-5z" },
                  { id: "life", label: "Life", color: "#f43f5e", icon: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" },
                  { id: "property", label: "Property", color: "#8b5cf6", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
                ].map((pt) => {
                  const d = stats?.byPolicyType?.[pt.id] || { total: 0, avgRisk: 0, approved: 0, referred: 0, declined: 0 };
                  return (
                    <div key={pt.id} className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ background: `${pt.color}15`, borderColor: `${pt.color}35` }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={pt.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={pt.icon}/></svg>
                          </div>
                          <span className="text-xs font-mono font-bold uppercase text-white">{pt.label}</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500">AVG: {d.avgRisk}</span>
                      </div>
                      <div className="font-mono text-2xl font-bold tracking-tight mb-0.5" style={{ color: pt.color }}>{d.total}</div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase">ACTIVE DOCKETS</div>
                      {d.total > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between font-mono text-[9px]">
                          <span className="px-1.5 py-0.5 rounded border border-blue-500/20 text-blue-400 bg-blue-500/10">{d.approved}A</span>
                          <span className="px-1.5 py-0.5 rounded border border-amber-500/20 text-amber-400 bg-amber-500/10">{d.referred}R</span>
                          <span className="px-1.5 py-0.5 rounded border border-rose-500/20 text-rose-400 bg-rose-500/10">{d.declined}D</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Monthly Trend */}
          <div className="blueprint-card p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">[TEMPORAL_UNDERWRITING_CADENCE]</span>
              <span className="text-[9px] font-mono text-blue-400">TRAILING 6 MONTHS</span>
            </div>
            {loading ? (
              <ChartSkeleton height={200} />
            ) : monthlyData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs font-mono text-slate-400">[NO_TEMPORAL_DATA_RECORDED]</p>
              </div>
            ) : (
              <div>
                <div className="flex items-end gap-2 h-44 px-2">
                  {monthlyData.map((m) => {
                    const maxCount = Math.max(...monthlyData.map(x => x.count), 1);
                    const heightPct = (m.count / maxCount) * 100;
                    return (
                      <div key={m.label} className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-[10px] font-mono font-bold mb-1 text-blue-400">
                          {m.count > 0 ? m.count : ""}
                        </span>
                        <div
                          className="w-full max-w-[44px] rounded-t transition-all duration-700"
                          style={{
                            height: `${Math.max(heightPct, 3)}%`,
                            background: "linear-gradient(to top, #2563eb, #38bdf8)",
                            boxShadow: m.count > 0 ? "0 0 12px rgba(37,99,235,0.3)" : "none",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-2 mt-1 border-t border-slate-800/80">
                  {monthlyData.map((m) => (
                    <div key={m.label} className="flex-1 text-center">
                      <span className="text-[10px] font-mono uppercase text-slate-400">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function buildRiskBuckets(assessments) {
  const buckets = [
    { label: "0-10", min: 0, max: 10, count: 0, color: "#3b82f6" },
    { label: "11-20", min: 11, max: 20, count: 0, color: "#3b82f6" },
    { label: "21-30", min: 21, max: 30, count: 0, color: "#38bdf8" },
    { label: "31-40", min: 31, max: 40, count: 0, color: "#06b6d4" },
    { label: "41-50", min: 41, max: 50, count: 0, color: "#f59e0b" },
    { label: "51-60", min: 51, max: 60, count: 0, color: "#f59e0b" },
    { label: "61-70", min: 61, max: 70, count: 0, color: "#f43f5e" },
    { label: "71-80", min: 71, max: 80, count: 0, color: "#f43f5e" },
    { label: "81-90", min: 81, max: 90, count: 0, color: "#e11d48" },
    { label: "91+", min: 91, max: 100, count: 0, color: "#be123c" },
  ];
  for (const a of assessments) {
    const score = a.result?.riskScore;
    if (score == null) continue;
    const bucket = buckets.find(b => score >= b.min && score <= b.max);
    if (bucket) bucket.count++;
  }
  return buckets;
}

function buildMonthlyTrend(assessments) {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString("default", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      count: 0,
    });
  }
  for (const a of assessments) {
    const d = new Date(a.createdAt);
    const m = months.find(x => x.year === d.getFullYear() && x.month === d.getMonth());
    if (m) m.count++;
  }
  return months;
}
