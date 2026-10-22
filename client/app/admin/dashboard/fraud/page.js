"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { StatCardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { FadeUp } from "@/components/motion/StaggerReveal";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerReveal";

/* ═══════ HELPERS ═══════ */
const POLICY_COLORS = { health: "#10b981", auto: "#f59e0b", life: "#a78bfa", property: "#60a5fa" };
const POLICY_BG = { health: "rgba(16,185,129,0.1)", auto: "rgba(245,158,11,0.1)", life: "rgba(167,139,250,0.1)", property: "rgba(96,165,250,0.1)" };

const FRAUD_LEVEL_COLORS = {
  clean: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "Clean" },
  low: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Low" },
  medium: { color: "#f97316", bg: "rgba(249,115,22,0.1)", label: "Medium" },
  high: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "High" },
  critical: { color: "#dc2626", bg: "rgba(220,38,38,0.15)", label: "Critical" },
};

const SEVERITY_COLORS = {
  info: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  warning: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "--";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function fraudScoreColor(score) {
  if (score < 20) return "#10b981";
  if (score < 40) return "#f59e0b";
  if (score < 60) return "#f97316";
  return "#ef4444";
}

/* ═══════ COMPONENT ═══════ */
export default function FraudDashboardPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/claims")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setClaims(d.claims || []); setLoading(false); })
      .catch(() => { setError("Failed to load claims data"); setLoading(false); });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Action handlers
  const handleAction = useCallback(async (claimId, action) => {
    setActionLoading(claimId);
    try {
      const res = await fetch(`/api/claims/${claimId}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) fetchData();
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }, [fetchData]);

  /* ═══════ DERIVED DATA ═══════ */
  const totalAnalyzed = claims.length;
  const flaggedCount = useMemo(() => claims.filter((c) => c.fraud?.flags?.length > 0).length, [claims]);
  const investigationQueue = useMemo(() => claims.filter((c) => c.fraud?.investigationRequired), [claims]);
  const cleanCount = useMemo(() => claims.filter((c) => (c.fraud?.score || 0) < 20).length, [claims]);
  const cleanRate = totalAnalyzed > 0 ? Math.round((cleanCount / totalAnalyzed) * 100) : 0;

  // Distribution counts
  const distribution = useMemo(() => {
    const d = { clean: 0, low: 0, medium: 0, high: 0, critical: 0 };
    claims.forEach((c) => {
      const level = c.fraud?.level || "clean";
      if (d[level] !== undefined) d[level]++;
      else d.clean++;
    });
    return d;
  }, [claims]);

  const distributionTotal = Object.values(distribution).reduce((s, v) => s + v, 0) || 1;

  // Recent fraud flags timeline
  const recentFlaggedClaims = useMemo(() => {
    return claims
      .filter((c) => c.fraud?.flags?.length > 0)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
  }, [claims]);

  // Pattern detection
  const patterns = useMemo(() => {
    const duplicateClaimUsers = new Set();
    const claimFrequency = {};
    let networkLinkCount = 0;

    claims.forEach((c) => {
      // Duplicates
      if (c.fraud?.duplicateClaimIds?.length > 0) {
        duplicateClaimUsers.add(c.userId || c._id);
      }
      // Frequency
      const uid = c.userId || c.claimant?.email || c._id;
      claimFrequency[uid] = (claimFrequency[uid] || 0) + 1;
      // Network
      networkLinkCount += (c.fraud?.networkLinks?.length || 0);
    });

    const highFrequencyCount = Object.values(claimFrequency).filter((v) => v > 3).length;

    return {
      duplicates: duplicateClaimUsers.size,
      highFrequency: highFrequencyCount,
      networkLinks: networkLinkCount,
    };
  }, [claims]);

  return (
    <div>
      <Breadcrumbs />

      {/* Header */}
      <FadeUp>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#fafafa" }}>Fraud Detection</h1>
            <p className="text-sm mt-1" style={{ color: "#71717a" }}>
              Monitor fraud patterns and investigate flagged claims
              {!loading && !error && <span style={{ color: "#52525b" }}> &middot; {totalAnalyzed} claims analyzed</span>}
            </p>
          </div>
          <Link
            href="/admin/dashboard/claims"
            className="btn-secondary no-underline text-sm hidden sm:inline-flex items-center gap-2"
            style={{ fontSize: 13, padding: "8px 16px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            All Claims
          </Link>
        </div>
      </FadeUp>

      {/* Stat Cards */}
      <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" delay={0.1}>
        {loading ? (
          <>{[1, 2, 3, 4].map((i) => <StaggerItem key={i}><StatCardSkeleton /></StaggerItem>)}</>
        ) : (
          <>
            {[
              {
                label: "Claims Analyzed", value: totalAnalyzed, color: "#60a5fa",
                icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></>,
              },
              {
                label: "Fraud Flags", value: flaggedCount, color: "#ef4444",
                icon: <><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></>,
              },
              {
                label: "Investigation Queue", value: investigationQueue.length, color: "#f59e0b",
                icon: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>,
              },
              {
                label: "Clean Rate", value: `${cleanRate}%`, color: "#10b981",
                icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
              },
            ].map((s) => (
              <StaggerItem key={s.label}>
                <div className="glass-card p-5 relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none" style={{ background: `${s.color}08`, filter: "blur(20px)" }} />
                  <div className="flex justify-between items-start relative">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: "#52525b" }}>{s.label}</p>
                      <span className="font-mono text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}10` }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </>
        )}
      </StaggerGrid>

      {error ? (
        <div className="glass-card p-6">
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      ) : loading ? (
        <div className="space-y-4">
          <div className="glass-card p-6"><Skeleton height={60} /></div>
          <div className="glass-card p-6"><Skeleton height={200} /></div>
        </div>
      ) : (
        <>
          {/* Fraud Distribution Bar */}
          <FadeUp delay={0.2}>
            <div className="glass-card p-6 mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#52525b" }}>Fraud Level Distribution</h3>

              {/* Stacked bar */}
              <div className="flex rounded-lg overflow-hidden" style={{ height: 32, background: "rgba(255,255,255,0.03)" }}>
                {Object.entries(distribution).map(([level, count]) => {
                  if (count === 0) return null;
                  const pct = (count / distributionTotal) * 100;
                  const lc = FRAUD_LEVEL_COLORS[level] || FRAUD_LEVEL_COLORS.clean;
                  return (
                    <div
                      key={level}
                      title={`${lc.label}: ${count} (${Math.round(pct)}%)`}
                      style={{
                        width: `${pct}%`,
                        background: lc.color,
                        opacity: 0.8,
                        transition: "width 0.5s ease",
                        minWidth: count > 0 ? 2 : 0,
                      }}
                    />
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-3">
                {Object.entries(distribution).map(([level, count]) => {
                  const lc = FRAUD_LEVEL_COLORS[level] || FRAUD_LEVEL_COLORS.clean;
                  return (
                    <div key={level} className="flex items-center gap-2">
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: lc.color, opacity: 0.8 }} />
                      <span className="text-[11px]" style={{ color: "#71717a" }}>
                        {lc.label}: <span className="font-mono font-semibold" style={{ color: lc.color }}>{count}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeUp>

          {/* Investigation Queue */}
          <FadeUp delay={0.25}>
            <div className="glass-card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#52525b" }}>
                  Investigation Queue
                  <span className="ml-2 font-mono" style={{ color: "#f59e0b" }}>{investigationQueue.length}</span>
                </h3>
              </div>

              {investigationQueue.length === 0 ? (
                <div className="text-center py-8">
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "rgba(16,185,129,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 10px",
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: "#71717a" }}>No claims require investigation</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {investigationQueue.map((claim) => {
                    const pColor = POLICY_COLORS[claim.policyType] || "#71717a";
                    const pBg = POLICY_BG[claim.policyType] || "rgba(255,255,255,0.05)";
                    const scoreColor = fraudScoreColor(claim.fraud?.score || 0);
                    const isActing = actionLoading === claim._id;

                    return (
                      <div
                        key={claim._id}
                        className="p-4 rounded-xl"
                        style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.1)" }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          {/* Fraud score - large */}
                          <div className="shrink-0 flex flex-col items-center">
                            <div
                              className="w-16 h-16 rounded-xl flex items-center justify-center"
                              style={{ background: `${scoreColor}12`, border: `2px solid ${scoreColor}30` }}
                            >
                              <span className="font-mono text-2xl font-bold" style={{ color: scoreColor }}>{claim.fraud?.score ?? 0}</span>
                            </div>
                            <span className="text-[9px] font-semibold uppercase tracking-wider mt-1" style={{ color: scoreColor }}>
                              {claim.fraud?.level || "unknown"}
                            </span>
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-sm font-semibold" style={{ color: "#fafafa" }}>{claim.claimant?.name || "--"}</span>
                              <span
                                className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ background: pBg, color: pColor }}
                              >
                                {claim.policyType}
                              </span>
                              <span className="font-mono text-sm font-bold" style={{ color: "#fafafa" }}>
                                {formatCurrency(claim.claimDetails?.estimatedAmount)}
                              </span>
                              <span className="text-[11px]" style={{ color: "#52525b" }}>{timeAgo(claim.createdAt)}</span>
                            </div>

                            {/* Fraud flags */}
                            {claim.fraud?.flags?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {claim.fraud.flags.map((flag, i) => {
                                  const sev = SEVERITY_COLORS[flag.severity] || SEVERITY_COLORS.info;
                                  return (
                                    <span
                                      key={i}
                                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                      style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.color}20` }}
                                      title={flag.description}
                                    >
                                      {flag.type?.replace(/_/g, " ")} ({flag.severity})
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAction(claim._id, "approve")}
                                disabled={isActing}
                                style={{
                                  fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                                  padding: "5px 14px", borderRadius: 6, cursor: isActing ? "wait" : "pointer",
                                  background: "rgba(16,185,129,0.1)", color: "#10b981",
                                  border: "1px solid rgba(16,185,129,0.2)",
                                  opacity: isActing ? 0.5 : 1,
                                }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(claim._id, "reject")}
                                disabled={isActing}
                                style={{
                                  fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                                  padding: "5px 14px", borderRadius: 6, cursor: isActing ? "wait" : "pointer",
                                  background: "rgba(239,68,68,0.08)", color: "#f87171",
                                  border: "1px solid rgba(239,68,68,0.2)",
                                  opacity: isActing ? 0.5 : 1,
                                }}
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleAction(claim._id, "escalate")}
                                disabled={isActing}
                                style={{
                                  fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                                  padding: "5px 14px", borderRadius: 6, cursor: isActing ? "wait" : "pointer",
                                  background: "rgba(245,158,11,0.08)", color: "#f59e0b",
                                  border: "1px solid rgba(245,158,11,0.2)",
                                  opacity: isActing ? 0.5 : 1,
                                }}
                              >
                                Escalate
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </FadeUp>

          {/* Two columns: Recent Fraud Flags + Pattern Detection */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Recent Fraud Flags Timeline */}
            <FadeUp delay={0.3}>
              <div className="lg:col-span-2 glass-card p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#52525b" }}>
                  Recent Fraud Flags
                  <span className="ml-2 font-mono" style={{ color: "#ef4444" }}>{recentFlaggedClaims.length}</span>
                </h3>

                {recentFlaggedClaims.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: "#71717a" }}>No fraud flags detected</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {recentFlaggedClaims.map((claim, idx) => (
                      <div key={claim._id}>
                        {claim.fraud.flags.map((flag, fi) => {
                          const sev = SEVERITY_COLORS[flag.severity] || SEVERITY_COLORS.info;
                          return (
                            <div
                              key={`${claim._id}-${fi}`}
                              className="flex items-start gap-3 py-3"
                              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                            >
                              {/* Timeline dot */}
                              <div className="shrink-0 flex flex-col items-center" style={{ width: 20 }}>
                                <div style={{
                                  width: 8, height: 8, borderRadius: "50%",
                                  background: sev.color,
                                  marginTop: 4,
                                }} />
                                {(fi < claim.fraud.flags.length - 1 || idx < recentFlaggedClaims.length - 1) && (
                                  <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.06)", minHeight: 16 }} />
                                )}
                              </div>

                              {/* Content */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                  <span
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
                                    style={{ background: sev.bg, color: sev.color }}
                                  >
                                    {flag.severity}
                                  </span>
                                  <span className="text-xs font-medium" style={{ color: "#fafafa" }}>
                                    {flag.type?.replace(/_/g, " ")}
                                  </span>
                                </div>
                                <p className="text-[11px]" style={{ color: "#71717a", lineHeight: 1.4 }}>
                                  {flag.description}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px]" style={{ color: "#52525b" }}>{claim.claimant?.name || "--"}</span>
                                  <span className="text-[10px]" style={{ color: "#3f3f46" }}>&middot;</span>
                                  <span className="text-[10px] font-mono" style={{ color: "#52525b" }}>Score: {flag.score || 0}</span>
                                  <span className="text-[10px]" style={{ color: "#3f3f46" }}>&middot;</span>
                                  <span className="text-[10px]" style={{ color: "#52525b" }}>{timeAgo(claim.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FadeUp>

            {/* Pattern Detection */}
            <FadeUp delay={0.35}>
              <div className="glass-card p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#52525b" }}>Pattern Detection</h3>

                <div className="space-y-4">
                  {[
                    {
                      label: "Duplicate Claims",
                      value: patterns.duplicates,
                      color: "#ef4444",
                      desc: "Claims with similar amounts within 30 days",
                      icon: <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /></>,
                    },
                    {
                      label: "High Frequency Claimants",
                      value: patterns.highFrequency,
                      color: "#f59e0b",
                      desc: "Users with >3 claims in 6 months",
                      icon: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>,
                    },
                    {
                      label: "Network Links",
                      value: patterns.networkLinks,
                      color: "#a78bfa",
                      desc: "Connected claims across different users",
                      icon: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" /></>,
                    },
                  ].map((p) => (
                    <div key={p.label} className="p-4 rounded-xl" style={{ background: `${p.color}05`, border: `1px solid ${p.color}12` }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${p.color}10` }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{p.icon}</svg>
                          </div>
                          <span className="text-xs font-semibold" style={{ color: "#fafafa" }}>{p.label}</span>
                        </div>
                        <span className="font-mono text-xl font-bold" style={{ color: p.color }}>{p.value}</span>
                      </div>
                      <p className="text-[10px]" style={{ color: "#52525b", lineHeight: 1.4 }}>{p.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium" style={{ color: "#71717a" }}>Total Patterns</span>
                    <span className="font-mono text-sm font-bold" style={{ color: patterns.duplicates + patterns.highFrequency + patterns.networkLinks > 0 ? "#ef4444" : "#10b981" }}>
                      {patterns.duplicates + patterns.highFrequency + patterns.networkLinks}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full mt-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, ((patterns.duplicates + patterns.highFrequency + patterns.networkLinks) / Math.max(totalAnalyzed, 1)) * 100)}%`,
                        background: patterns.duplicates + patterns.highFrequency + patterns.networkLinks > 0
                          ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                          : "#10b981",
                      }}
                    />
                  </div>
                  <p className="text-[9px] font-mono mt-1" style={{ color: "#52525b" }}>
                    {totalAnalyzed > 0
                      ? `${((patterns.duplicates + patterns.highFrequency + patterns.networkLinks) / totalAnalyzed * 100).toFixed(1)}% of total claims`
                      : "No data"}
                  </p>
                </div>
              </div>
            </FadeUp>
          </div>
        </>
      )}
    </div>
  );
}
