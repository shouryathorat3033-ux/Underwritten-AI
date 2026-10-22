"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { StatCardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { FadeUp } from "@/components/motion/StaggerReveal";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerReveal";

/* ═══════ ORDIVALABS PALETTES ═══════ */
const POLICY_PALETTE = {
  health: { color: "#3B82F6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)", code: "HLTH" },
  auto: { color: "#06B6D4", bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.25)", code: "AUTO" },
  life: { color: "#818CF8", bg: "rgba(129,140,248,0.1)", border: "rgba(129,140,248,0.25)", code: "LIFE" },
  property: { color: "#38BDF8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.25)", code: "PROP" },
};

const FRAUD_LEVEL_CONFIGS = {
  clean: { color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", label: "Clean Docket" },
  low: { color: "#3B82F6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)", label: "Low Variance" },
  medium: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", label: "Moderate Risk" },
  high: { color: "#FB7185", bg: "rgba(251,113,133,0.1)", border: "rgba(251,113,133,0.25)", label: "High Anomaly" },
  critical: { color: "#F43F5E", bg: "rgba(244,63,94,0.15)", border: "rgba(244,63,94,0.3)", label: "Critical Forensic Flag" },
};

const SEVERITY_CONFIGS = {
  info: { color: "#38BDF8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.25)" },
  warning: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  critical: { color: "#F43F5E", bg: "rgba(244,63,94,0.15)", border: "rgba(244,63,94,0.3)" },
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
  if (score < 25) return "#10B981";
  if (score < 50) return "#F59E0B";
  if (score < 75) return "#FB7185";
  return "#F43F5E";
}

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
      .catch(() => { setError("Failed to synchronize fraud telemetry"); setLoading(false); });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
      // silently handle
    } finally {
      setActionLoading(null);
    }
  }, [fetchData]);

  const totalAnalyzed = claims.length;
  const flaggedCount = useMemo(() => claims.filter((c) => c.fraud?.flags?.length > 0).length, [claims]);
  const investigationQueue = useMemo(() => claims.filter((c) => c.fraud?.investigationRequired), [claims]);
  const cleanCount = useMemo(() => claims.filter((c) => (c.fraud?.score || 0) < 20).length, [claims]);
  const cleanRate = totalAnalyzed > 0 ? Math.round((cleanCount / totalAnalyzed) * 100) : 0;

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

  const recentFlaggedClaims = useMemo(() => {
    return claims
      .filter((c) => c.fraud?.flags?.length > 0)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
  }, [claims]);

  const patterns = useMemo(() => {
    const duplicateClaimUsers = new Set();
    const claimFrequency = {};
    let networkLinkCount = 0;

    claims.forEach((c) => {
      if (c.fraud?.duplicateClaimIds?.length > 0) {
        duplicateClaimUsers.add(c.userId || c._id);
      }
      const uid = c.userId || c.claimant?.email || c._id;
      claimFrequency[uid] = (claimFrequency[uid] || 0) + 1;
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
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <FadeUp>
        <div className="blueprint-card p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="absolute top-0 right-0 w-80 h-40 bg-rose-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px] tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                [FRAUD.FORENSIC_RADAR]
              </span>
              <span className="font-mono text-[10px] text-zinc-500">SYNTHETIC ANOMALY DETECTORS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Fraud Intelligence & Anomaly Radar
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Real-time heuristic fraud scores, cross-claim collision graphs, and forensic investigation dispatchers.
            </p>
          </div>

          <div className="relative z-10">
            <Link
              href="/admin/dashboard/claims"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-800 bg-[#0A0F1D] text-zinc-300 hover:text-white text-xs font-mono transition no-underline"
            >
              &larr; Loss Claims Register
            </Link>
          </div>
        </div>
      </FadeUp>

      {/* Telemetry Stat Cards */}
      <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4" delay={0.08}>
        {loading ? (
          <>{[1, 2, 3, 4].map((i) => <StaggerItem key={i}><StatCardSkeleton /></StaggerItem>)}</>
        ) : (
          <>
            {[
              {
                label: "Claims Analyzed", code: "[VOL.INGESTED]", value: totalAnalyzed, color: "#3B82F6",
                icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6",
              },
              {
                label: "Active Fraud Flags", code: "[ALERT.ANOMALY]", value: flaggedCount, color: "#F43F5E",
                icon: "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
              },
              {
                label: "Investigation Queue", code: "[QUEUE.FORENSIC]", value: investigationQueue.length, color: "#F59E0B",
                icon: "M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4.35-4.35",
              },
              {
                label: "Clean Docket Ratio", code: "[RATE.CLEAN]", value: `${cleanRate}%`, color: "#10B981",
                icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
              },
            ].map((s) => (
              <StaggerItem key={s.label}>
                <div className="blueprint-card p-5 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">{s.code}</span>
                      <p className="text-xs font-medium text-zinc-400 mb-2">{s.label}</p>
                      <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-white">{s.value}</p>
                    </div>
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center border"
                      style={{ background: `${s.color}10`, borderColor: `${s.color}30` }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d={s.icon} />
                      </svg>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </>
        )}
      </StaggerGrid>

      {error ? (
        <div className="blueprint-card p-8">
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      ) : loading ? (
        <div className="space-y-4">
          <div className="blueprint-card p-6"><Skeleton height={60} /></div>
          <div className="blueprint-card p-6"><Skeleton height={200} /></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Fraud Distribution Spectrum */}
          <FadeUp delay={0.16}>
            <div className="blueprint-card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] text-zinc-500 uppercase">[SPECTRUM.ANOMALY_LEVELS]</span>
                <span className="font-mono text-[10px] text-blue-400">HEURISTIC CLASSIFICATION</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-4 tracking-wide">Claims Fraud Severity Allocation</h3>

              {/* Stacked bar */}
              <div className="flex rounded-lg overflow-hidden h-7 bg-zinc-900 border border-zinc-800">
                {Object.entries(distribution).map(([level, count]) => {
                  if (count === 0) return null;
                  const pct = (count / distributionTotal) * 100;
                  const lc = FRAUD_LEVEL_CONFIGS[level] || FRAUD_LEVEL_CONFIGS.clean;
                  return (
                    <div
                      key={level}
                      title={`${lc.label}: ${count} (${Math.round(pct)}%)`}
                      style={{
                        width: `${pct}%`,
                        background: lc.color,
                        minWidth: count > 0 ? 3 : 0,
                      }}
                    />
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 font-mono text-xs">
                {Object.entries(distribution).map(([level, count]) => {
                  const lc = FRAUD_LEVEL_CONFIGS[level] || FRAUD_LEVEL_CONFIGS.clean;
                  return (
                    <div key={level} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: lc.color }} />
                      <span className="text-zinc-400">
                        {lc.label}: <span className="font-bold text-white">{count}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeUp>

          {/* Investigation Queue */}
          <FadeUp delay={0.24}>
            <div className="blueprint-card p-6 border-rose-500/25">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                    [QUEUE.MANDATORY_AUDIT]
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Forensic Investigation Dossiers
                  </h3>
                </div>
                <span className="font-mono text-xs font-bold text-rose-400">
                  {investigationQueue.length} DOCKETS FLAGGED
                </span>
              </div>

              {investigationQueue.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3 text-emerald-400">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="font-mono text-xs text-zinc-500">ZERO CLAIMS CURRENTLY REQUIRE FORENSIC INTERVENTION</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {investigationQueue.map((claim) => {
                    const theme = POLICY_PALETTE[claim.policyType] || { color: "#3B82F6", bg: "rgba(59,130,246,0.1)", code: "POL" };
                    const scoreColor = fraudScoreColor(claim.fraud?.score || 0);
                    const isActing = actionLoading === claim._id;

                    return (
                      <div
                        key={claim._id}
                        className="p-4 rounded-xl bg-[#070A13] border border-rose-500/20 flex flex-col sm:flex-row sm:items-start gap-4"
                      >
                        {/* Fraud Score Box */}
                        <div className="shrink-0 flex flex-col items-center">
                          <div
                            className="w-16 h-16 rounded-xl flex items-center justify-center border font-mono"
                            style={{ background: `${scoreColor}15`, borderColor: `${scoreColor}30` }}
                          >
                            <span className="text-2xl font-bold" style={{ color: scoreColor }}>
                              {claim.fraud?.score ?? 0}
                            </span>
                          </div>
                          <span className="font-mono text-[9px] uppercase tracking-wider mt-1 text-zinc-500">
                            ANOMALY SCORE
                          </span>
                        </div>

                        {/* Metadata & Actions */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2 font-mono">
                            <span className="text-sm font-bold text-white font-sans">{claim.claimant?.name || "--"}</span>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded border"
                              style={{ background: theme.bg, color: theme.color, borderColor: `${theme.color}30` }}
                            >
                              {theme.code}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {formatCurrency(claim.claimDetails?.estimatedAmount)}
                            </span>
                            <span className="text-[11px] text-zinc-500 ml-auto">{timeAgo(claim.createdAt)}</span>
                          </div>

                          {/* Specific Fraud Flags */}
                          {claim.fraud?.flags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3 font-mono">
                              {claim.fraud.flags.map((flag, i) => {
                                const sev = SEVERITY_CONFIGS[flag.severity] || SEVERITY_CONFIGS.info;
                                return (
                                  <span
                                    key={i}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded border"
                                    style={{ background: sev.bg, color: sev.color, borderColor: sev.border }}
                                    title={flag.description}
                                  >
                                    {flag.type?.replace(/_/g, " ").toUpperCase()} ({flag.severity?.toUpperCase()})
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-1 font-mono text-xs">
                            <button
                              onClick={() => handleAction(claim._id, "approve")}
                              disabled={isActing}
                              className="px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 transition font-bold cursor-pointer"
                            >
                              Clear & Approve
                            </button>
                            <button
                              onClick={() => handleAction(claim._id, "reject")}
                              disabled={isActing}
                              className="px-3 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 transition font-bold cursor-pointer"
                            >
                              Decline Claim
                            </button>
                            <button
                              onClick={() => handleAction(claim._id, "escalate")}
                              disabled={isActing}
                              className="px-3 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 transition font-bold cursor-pointer"
                            >
                              Escalate to Legal
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </FadeUp>

          {/* Recent Flags + Pattern Detection Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline of Flags */}
            <div className="lg:col-span-2 blueprint-card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] text-zinc-500 uppercase">[STREAM.ANOMALY_LOG]</span>
                <span className="font-mono text-[10px] text-rose-400">{recentFlaggedClaims.length} RECENT INCIDENTS</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-4 tracking-wide">Heuristic Anomaly Stream</h3>

              {recentFlaggedClaims.length === 0 ? (
                <div className="text-center py-8">
                  <p className="font-mono text-xs text-zinc-500">NO ANOMALY FLAGS LOGGED</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/60 font-mono text-xs">
                  {recentFlaggedClaims.map((claim) => (
                    <div key={claim._id} className="py-3">
                      {claim.fraud.flags.map((flag, fi) => {
                        const sev = SEVERITY_CONFIGS[flag.severity] || SEVERITY_CONFIGS.info;
                        return (
                          <div key={`${claim._id}-${fi}`} className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: sev.color }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase"
                                  style={{ background: sev.bg, color: sev.color, borderColor: sev.border }}
                                >
                                  {flag.severity}
                                </span>
                                <span className="font-sans font-bold text-white text-xs">{flag.type?.replace(/_/g, " ")}</span>
                                <span className="text-zinc-500 text-[10px] ml-auto">{timeAgo(claim.createdAt)}</span>
                              </div>
                              <p className="text-zinc-400 font-sans text-xs leading-relaxed">{flag.description}</p>
                              <p className="text-[10px] text-zinc-500 mt-1">Claimant: {claim.claimant?.name || "--"} &middot; Score Impact: +{flag.score || 0}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cross-Claim Pattern Detection */}
            <div className="blueprint-card p-6">
              <span className="font-mono text-[10px] text-zinc-500 uppercase block mb-1">[GRAPH.COLLISION_ANALYSIS]</span>
              <h3 className="text-sm font-bold text-white mb-4 tracking-wide">Pattern Detection</h3>

              <div className="space-y-3 font-mono text-xs">
                {[
                  { label: "Duplicate Loss Filings", value: patterns.duplicates, color: "#F43F5E", desc: "Claims matching amounts within rolling 30d window" },
                  { label: "High-Velocity Claimants", value: patterns.highFrequency, color: "#F59E0B", desc: "Entities with >3 filings within 6 months" },
                  { label: "Entity Network Links", value: patterns.networkLinks, color: "#3B82F6", desc: "Cross-policy collusion graph intersections" },
                ].map((p) => (
                  <div key={p.label} className="bg-[#070A13] p-3.5 rounded-lg border border-zinc-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-zinc-300 font-semibold">{p.label}</span>
                      <span className="text-lg font-bold" style={{ color: p.color }}>{p.value}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
