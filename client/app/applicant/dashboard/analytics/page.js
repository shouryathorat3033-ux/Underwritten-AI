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
    { label: "Total Assessments", value: stats?.total || 0, color: "#10b981", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6" },
    { label: "Avg Risk Score", value: stats?.avgRisk ? Math.round(stats.avgRisk) : 0, color: "#f59e0b", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
    { label: "Approval Rate", value: stats?.approvalRate ? `${Math.round(stats.approvalRate)}%` : "0%", color: "#10b981", icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" },
    { label: "Avg Processing", value: stats?.avgTime ? `${(stats.avgTime / 1000).toFixed(1)}s` : "0s", color: "#f59e0b", icon: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" },
  ];

  const decisions = [
    { label: "Approved", count: stats?.approved || 0, color: "#10b981" },
    { label: "Referred", count: stats?.referred || 0, color: "#f59e0b" },
    { label: "Declined", count: stats?.declined || 0, color: "#ef4444" },
  ];
  const totalDecisions = decisions.reduce((a, d) => a + d.count, 0) || 1;

  // Build risk distribution bar chart from real assessments
  const riskBuckets = buildRiskBuckets(assessments);

  // Build monthly trend from real assessments
  const monthlyData = buildMonthlyTrend(assessments);

  return (
    <div>
      <Breadcrumbs />

      <FadeUp>
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#fafafa" }}>Analytics</h1>
        <p className="text-sm mb-6" style={{ color: "#71717a" }}>Underwriting performance metrics</p>
      </FadeUp>

      {error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              cards.map((c) => (
                <div key={c.label} className="glass-card p-5">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: "#71717a" }}>{c.label}</p>
                      <p className="font-mono text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
                    </div>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${c.color}12`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={c.icon} />
                      </svg>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Decision donut chart */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-5" style={{ color: "#fafafa" }}>Decision Breakdown</h2>
              {loading ? (
                <ChartSkeleton height={180} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                  {/* Donut */}
                  <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
                    <svg viewBox="0 0 36 36" style={{ width: 140, height: 140, transform: "rotate(-90deg)" }}>
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
                              strokeWidth="3"
                              strokeDasharray={`${pct} ${100 - pct}`}
                              strokeDashoffset={-offset}
                              strokeLinecap="round"
                              style={{ transition: "stroke-dasharray 0.8s ease" }}
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <span className="font-mono text-xl font-bold" style={{ color: "#fafafa" }}>{totalDecisions === 1 && !stats?.total ? 0 : totalDecisions}</span>
                      <span style={{ fontSize: 10, color: "#71717a" }}>Total</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                    {decisions.map((d) => (
                      <div key={d.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
                          <span style={{ fontSize: 13, color: "#a1a1aa" }}>{d.label}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: d.color }}>{d.count}</span>
                          <span style={{ fontSize: 11, color: "#52525b" }}>
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
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-5" style={{ color: "#fafafa" }}>Risk Distribution</h2>
              {loading ? (
                <ChartSkeleton height={180} />
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160, padding: "0 4px" }}>
                    {riskBuckets.map((b) => {
                      const maxCount = Math.max(...riskBuckets.map(x => x.count), 1);
                      const heightPct = (b.count / maxCount) * 100;
                      return (
                        <div key={b.label} style={{
                          flex: 1, display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "flex-end", height: "100%",
                        }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, color: b.color,
                            marginBottom: 4, opacity: b.count > 0 ? 1 : 0,
                          }}>
                            {b.count}
                          </span>
                          <div style={{
                            width: "100%", maxWidth: 32,
                            height: `${Math.max(heightPct, 4)}%`,
                            background: `linear-gradient(to top, ${b.color}, ${b.color}88)`,
                            borderRadius: "4px 4px 0 0",
                            transition: "height 0.8s cubic-bezier(0.16,1,0.3,1)",
                          }} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 6, padding: "8px 4px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {riskBuckets.map((b) => (
                      <div key={b.label} style={{ flex: 1, textAlign: "center" }}>
                        <span style={{ fontSize: 9, color: "#52525b" }}>{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Policy Type Breakdown */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-lg font-semibold mb-5" style={{ color: "#fafafa" }}>By Policy Type</h2>
            {loading ? (
              <ChartSkeleton height={120} />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: "health", label: "Health", color: "#10b981", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
                  { id: "auto", label: "Auto", color: "#f59e0b", icon: "M12 2L2 7l10 5 10-5-10-5z" },
                  { id: "life", label: "Life", color: "#a78bfa", icon: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" },
                  { id: "property", label: "Property", color: "#60a5fa", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
                ].map((pt) => {
                  const d = stats?.byPolicyType?.[pt.id] || { total: 0, avgRisk: 0, approved: 0, referred: 0, declined: 0 };
                  return (
                    <div key={pt.id} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${pt.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pt.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={pt.icon}/></svg>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: "#fafafa" }}>{pt.label}</span>
                      </div>
                      <div className="font-mono text-xl font-bold mb-1" style={{ color: pt.color }}>{d.total}</div>
                      <div className="text-[11px]" style={{ color: "#52525b" }}>assessments</div>
                      {d.total > 0 && (
                        <div style={{ marginTop: 10, display: "flex", gap: 4 }}>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399" }}>{d.approved}A</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24" }}>{d.referred}R</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>{d.declined}D</span>
                          <span className="text-[10px] font-mono ml-auto" style={{ color: "#71717a" }}>avg {d.avgRisk}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Monthly Trend */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-5" style={{ color: "#fafafa" }}>Monthly Trend</h2>
            {loading ? (
              <ChartSkeleton height={200} />
            ) : monthlyData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: "#71717a" }}>No trend data available yet</p>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 200, padding: "0 4px" }}>
                  {monthlyData.map((m) => {
                    const maxCount = Math.max(...monthlyData.map(x => x.count), 1);
                    const heightPct = (m.count / maxCount) * 100;
                    return (
                      <div key={m.label} style={{
                        flex: 1, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "flex-end", height: "100%",
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#10b981", marginBottom: 4 }}>
                          {m.count > 0 ? m.count : ""}
                        </span>
                        <div style={{
                          width: "100%", maxWidth: 40,
                          height: `${Math.max(heightPct, 2)}%`,
                          background: "linear-gradient(to top, #10b981, #10b98166)",
                          borderRadius: "4px 4px 0 0",
                          transition: "height 0.8s cubic-bezier(0.16,1,0.3,1)",
                        }} />
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 8, padding: "8px 4px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  {monthlyData.map((m) => (
                    <div key={m.label} style={{ flex: 1, textAlign: "center" }}>
                      <span style={{ fontSize: 10, color: "#52525b" }}>{m.label}</span>
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
    { label: "0-10", min: 0, max: 10, count: 0, color: "#10b981" },
    { label: "11-20", min: 11, max: 20, count: 0, color: "#10b981" },
    { label: "21-30", min: 21, max: 30, count: 0, color: "#34d399" },
    { label: "31-40", min: 31, max: 40, count: 0, color: "#fbbf24" },
    { label: "41-50", min: 41, max: 50, count: 0, color: "#f59e0b" },
    { label: "51-60", min: 51, max: 60, count: 0, color: "#f59e0b" },
    { label: "61-70", min: 61, max: 70, count: 0, color: "#ef4444" },
    { label: "71-80", min: 71, max: 80, count: 0, color: "#ef4444" },
    { label: "81-90", min: 81, max: 90, count: 0, color: "#dc2626" },
    { label: "91+", min: 91, max: 100, count: 0, color: "#dc2626" },
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
