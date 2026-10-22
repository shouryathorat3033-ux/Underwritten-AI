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
      setError("Failed to synchronize portfolio analytics stream");
      setLoading(false);
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const cards = [
    { label: "Total Risk Dossiers", code: "[VOL.TOTAL]", value: stats?.total || 0, color: "#3B82F6", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6" },
    { label: "Mean Portfolio Hazard", code: "[SCORE.MEAN]", value: stats?.avgRisk ? Math.round(stats.avgRisk) : 0, color: "#06B6D4", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
    { label: "Autonomous Clearance", code: "[RATIO.AUTO]", value: stats?.approvalRate ? `${Math.round(stats.approvalRate)}%` : "0%", color: "#10B981", icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" },
    { label: "Inference Latency", code: "[PERF.TIME]", value: stats?.avgTime ? `${(stats.avgTime / 1000).toFixed(1)}s` : "0.7s", color: "#38BDF8", icon: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" },
  ];

  const decisions = [
    { label: "Approved", count: stats?.approved || 0, color: "#10B981" },
    { label: "Referred", count: stats?.referred || 0, color: "#F59E0B" },
    { label: "Declined", count: stats?.declined || 0, color: "#F43F5E" },
  ];
  const totalDecisions = decisions.reduce((a, d) => a + d.count, 0) || 1;

  const riskBuckets = buildRiskBuckets(assessments);
  const monthlyData = buildMonthlyTrend(assessments);

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
                [ACTUARIAL.PORTFOLIO_ANALYTICS]
              </span>
              <span className="font-mono text-[10px] text-zinc-500">REAL-TIME RISK ENGINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Portfolio Intelligence & Risk Analytics
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Real-time portfolio loss distribution, demographic variance, and straight-through processing telemetry.
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
              Refresh Telemetry
            </button>
          </div>
        </div>
      </FadeUp>

      {error ? (
        <div className="blueprint-card p-8">
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              cards.map((c) => (
                <div key={c.label} className="blueprint-card p-5 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
                        {c.code}
                      </span>
                      <p className="text-xs font-medium text-zinc-400 mb-2">{c.label}</p>
                      <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-white">{c.value}</p>
                    </div>
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center border"
                      style={{ background: `${c.color}10`, borderColor: `${c.color}30` }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d={c.icon} />
                      </svg>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Decision breakdown donut */}
            <div className="blueprint-card p-6">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[10px] text-zinc-500 uppercase">[DISTRIBUTION.DECISIONS]</span>
                <span className="font-mono text-[10px] text-blue-400">{totalDecisions === 1 && !stats?.total ? 0 : totalDecisions} PROCESSED</span>
              </div>
              <h2 className="text-sm font-bold text-white mb-6 tracking-wide">Underwriting Determination Ratio</h2>

              {loading ? (
                <ChartSkeleton height={180} />
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  {/* Donut SVG */}
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
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="font-mono text-xl font-bold text-white">
                        {totalDecisions === 1 && !stats?.total ? 0 : totalDecisions}
                      </span>
                      <span className="font-mono text-[9px] text-zinc-500 uppercase">Dockets</span>
                    </div>
                  </div>

                  {/* Legend list */}
                  <div className="space-y-3 flex-1 w-full font-mono text-xs">
                    {decisions.map((d) => (
                      <div key={d.label} className="bg-[#070A13] p-2.5 rounded-lg border border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                          <span className="text-zinc-300 font-semibold">{d.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{d.count}</span>
                          <span className="text-zinc-500 text-[10px]">
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
            <div className="blueprint-card p-6">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[10px] text-zinc-500 uppercase">[SPECTRUM.PORTFOLIO_HISTOGRAM]</span>
                <span className="font-mono text-[10px] text-blue-400">10 BUCKETS</span>
              </div>
              <h2 className="text-sm font-bold text-white mb-6 tracking-wide">Risk Score Distribution (0-100)</h2>

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
                          <span className={`font-mono text-[9px] mb-1 font-semibold ${b.count > 0 ? "opacity-100" : "opacity-0"}`} style={{ color: b.color }}>
                            {b.count}
                          </span>
                          <div
                            className="w-full max-w-[28px] rounded-t transition-all duration-700"
                            style={{
                              height: `${Math.max(heightPct, 4)}%`,
                              background: b.color,
                              opacity: b.count > 0 ? 0.9 : 0.2,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-1.5 pt-2 border-t border-zinc-800 px-1">
                    {riskBuckets.map((b) => (
                      <div key={b.label} className="flex-1 text-center">
                        <span className="font-mono text-[8px] text-zinc-500 block truncate">{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Categorical Policy Type Vector Grid */}
          <div className="blueprint-card p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="font-mono text-[10px] text-zinc-500 uppercase">[SEGMENTS.POLICY_VECTORS]</span>
              <span className="font-mono text-[10px] text-blue-400">4 LINES OF BUSINESS</span>
            </div>
            <h2 className="text-sm font-bold text-white mb-5 tracking-wide">Performance by Line of Business</h2>

            {loading ? (
              <ChartSkeleton height={120} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: "health", label: "Health", code: "HLTH", color: "#3B82F6", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
                  { id: "auto", label: "Auto", code: "AUTO", color: "#06B6D4", icon: "M12 2L2 7l10 5 10-5-10-5z" },
                  { id: "life", label: "Life", code: "LIFE", color: "#818CF8", icon: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" },
                  { id: "property", label: "Property", code: "PROP", color: "#38BDF8", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
                ].map((pt) => {
                  const d = stats?.byPolicyType?.[pt.id] || { total: 0, avgRisk: 0, approved: 0, referred: 0, declined: 0 };
                  return (
                    <div key={pt.id} className="bg-[#070A13] border border-zinc-800 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border"
                          style={{ background: `${pt.color}15`, color: pt.color, borderColor: `${pt.color}30` }}
                        >
                          {pt.code}
                        </span>
                        <span className="font-mono text-xs text-zinc-500">Mean: {d.avgRisk}/100</span>
                      </div>
                      <div className="font-mono text-2xl font-bold text-white mb-0.5">{d.total}</div>
                      <p className="font-mono text-[10px] text-zinc-500 mb-3">Total Underwritten</p>

                      <div className="flex gap-1.5 font-mono text-[9px] pt-3 border-t border-zinc-800/80">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{d.approved} App</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">{d.referred} Ref</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">{d.declined} Dec</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Temporal Monthly Velocity */}
          <div className="blueprint-card p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="font-mono text-[10px] text-zinc-500 uppercase">[TEMPORAL.MONTHLY_CADENCE]</span>
              <span className="font-mono text-[10px] text-blue-400">ROLLING 6 MONTHS</span>
            </div>
            <h2 className="text-sm font-bold text-white mb-5 tracking-wide">Dossier Intake & Clearance Trend</h2>

            {loading ? (
              <ChartSkeleton height={200} />
            ) : monthlyData.length === 0 ? (
              <div className="text-center py-8">
                <p className="font-mono text-xs text-zinc-500">NO TEMPORAL RECORDS ACCUMULATED</p>
              </div>
            ) : (
              <div>
                <div className="flex items-end gap-3 h-44 px-2">
                  {monthlyData.map((m) => {
                    const maxCount = Math.max(...monthlyData.map(x => x.count), 1);
                    const heightPct = (m.count / maxCount) * 100;
                    return (
                      <div key={m.label} className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="font-mono text-xs font-bold text-blue-400 mb-1">
                          {m.count > 0 ? m.count : ""}
                        </span>
                        <div
                          className="w-full max-w-[42px] rounded-t bg-blue-600 transition-all duration-700"
                          style={{
                            height: `${Math.max(heightPct, 3)}%`,
                            opacity: m.count > 0 ? 1 : 0.2,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3 pt-2.5 border-t border-zinc-800 px-2 font-mono text-[10px] text-zinc-500">
                  {monthlyData.map((m) => (
                    <div key={m.label} className="flex-1 text-center">
                      <span>{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function buildRiskBuckets(assessments) {
  const buckets = [
    { label: "0-10", min: 0, max: 10, count: 0, color: "#3B82F6" },
    { label: "11-20", min: 11, max: 20, count: 0, color: "#3B82F6" },
    { label: "21-30", min: 21, max: 30, count: 0, color: "#06B6D4" },
    { label: "31-40", min: 31, max: 40, count: 0, color: "#06B6D4" },
    { label: "41-50", min: 41, max: 50, count: 0, color: "#F59E0B" },
    { label: "51-60", min: 51, max: 60, count: 0, color: "#F59E0B" },
    { label: "61-70", min: 61, max: 70, count: 0, color: "#FB7185" },
    { label: "71-80", min: 71, max: 80, count: 0, color: "#F43F5E" },
    { label: "81-90", min: 81, max: 90, count: 0, color: "#E11D48" },
    { label: "91+", min: 91, max: 100, count: 0, color: "#9F1239" },
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
