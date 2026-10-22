"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
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

const STATUS_CONFIGS = {
  submitted: { label: "Submitted", color: "#38BDF8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.25)" },
  under_review: { label: "In Review", color: "#60A5FA", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.25)" },
  stp_approved: { label: "STP Approved", color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
  approved: { label: "Approved", color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
  rejected: { label: "Declined", color: "#F43F5E", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.25)" },
  stp_rejected: { label: "STP Declined", color: "#F43F5E", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.25)" },
  investigation: { label: "Forensic Audit", color: "#F43F5E", bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.3)" },
  settled: { label: "Settled", color: "#3B82F6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
  paid: { label: "Disbursed", color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
  manual_review: { label: "Manual Review", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  disputed: { label: "Disputed", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
};

const CLAIM_TYPE_LABELS = {
  accident: "Accident / Collision",
  theft: "Total / Partial Theft",
  natural_disaster: "Catastrophic Weather",
  medical: "Hospitalization Care",
  death: "Life Term Benefit",
  disability: "Permanent Disability",
  property_damage: "Structural Damage",
  liability: "Third-Party Liability",
  other: "Standard Casualty",
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

function fraudScoreStyle(score) {
  if (score < 25) return { color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" };
  if (score < 50) return { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" };
  return { color: "#F43F5E", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.25)" };
}

const FILTERS = [
  { key: "all", label: "All Claims" },
  { key: "stp", label: "STP Approved" },
  { key: "manual", label: "Manual Review" },
  { key: "investigation", label: "Investigation Flagged" },
  { key: "settled", label: "Settled / Disbursed" },
];

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/claims")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        setClaims(d.claims || []);
        setStats(d.stats || null);
        setLoading(false);
      })
      .catch(() => { setError("Failed to synchronize claims queue"); setLoading(false); });
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
      if (res.ok) {
        fetchData();
      }
    } catch {
      // silently handle
    } finally {
      setActionLoading(null);
    }
  }, [fetchData]);

  const stpCount = useMemo(() => claims.filter((c) => c.stp?.autoApproved).length, [claims]);
  const stpPct = claims.length > 0 ? Math.round((stpCount / claims.length) * 100) : 0;

  const filtered = useMemo(() => {
    let result = [...claims];
    if (filter === "stp") result = result.filter((c) => c.stp?.autoApproved);
    else if (filter === "manual") result = result.filter((c) => ["manual_review", "under_review", "submitted"].includes(c.status) && !c.stp?.autoApproved);
    else if (filter === "investigation") result = result.filter((c) => c.status === "investigation" || c.fraud?.investigationRequired);
    else if (filter === "settled") result = result.filter((c) => ["settled", "paid"].includes(c.status));

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        (c.claimant?.name || "").toLowerCase().includes(q) ||
        (c.claimant?.email || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [claims, filter, search]);

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
                [CLAIMS.COMMAND_CENTER]
              </span>
              <span className="font-mono text-[10px] text-zinc-500">AUTONOMOUS & MANUAL ADJUDICATION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Loss Adjudication & Settlement Queue
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Inspect straight-through claims, calibrate financial disbursements, and trigger forensic fraud investigations.
            </p>
          </div>

          <div className="relative z-10">
            <Link
              href="/admin/dashboard/fraud"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide transition shadow-lg shadow-blue-500/20 no-underline"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Fraud Intelligence Radar
            </Link>
          </div>
        </div>
      </FadeUp>

      {/* 5 Telemetry Stat Cards */}
      <StaggerGrid className="grid grid-cols-2 lg:grid-cols-5 gap-4" delay={0.08}>
        {loading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => <StaggerItem key={i}><StatCardSkeleton /></StaggerItem>)}
          </>
        ) : (
          <>
            {[
              {
                label: "Registered Claims", code: "[VOL.CLAIMS]", value: stats?.total || 0, color: "#3B82F6",
                icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6",
              },
              {
                label: "STP Auto-Approved", code: "[RATE.STP]", value: `${stpCount}`, sub: `${stpPct}% STP`, color: "#10B981",
                icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
              },
              {
                label: "Under Active Review", code: "[QUEUE.MANUAL]", value: stats?.pending || 0, color: "#F59E0B",
                icon: "M12 6v6l4 2",
              },
              {
                label: "Fraud Flagged", code: "[ALERT.FRAUD]", value: stats?.flagged || 0, color: "#F43F5E",
                icon: "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
              },
              {
                label: "Settled / Disbursed", code: "[SETTLED.TOTAL]", value: stats?.settled || 0, color: "#3B82F6",
                icon: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
              },
            ].map((s) => (
              <StaggerItem key={s.label}>
                <div className="blueprint-card p-5 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">{s.code}</span>
                      <p className="text-xs font-medium text-zinc-400 mb-1.5">{s.label}</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-2xl font-bold tracking-tight text-white">{s.value}</span>
                        {s.sub && <span className="font-mono text-[10px] text-zinc-500">{s.sub}</span>}
                      </div>
                    </div>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center border shrink-0"
                      style={{ background: `${s.color}10`, borderColor: `${s.color}30` }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Filter and Search Bar */}
      <div className="blueprint-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2" strokeLinecap="round"
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
            >
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by claimant name or email vector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#070A13] border border-zinc-800 focus:border-blue-500 text-white text-xs rounded-lg pl-9 p-2.5 outline-none font-mono"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                    active
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold"
                      : "bg-[#070A13] text-zinc-400 border border-zinc-800 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {(search || filter !== "all") && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/80 font-mono text-[10px]">
            <span className="text-zinc-500">Showing {filtered.length} of {claims.length} claims</span>
            <button
              onClick={() => { setSearch(""); setFilter("all"); }}
              className="text-rose-400 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Claims Adjudication Table */}
      <div className="blueprint-card overflow-hidden">
        {error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={fetchData} />
          </div>
        ) : loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={9} />
          </div>
        ) : claims.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3 text-blue-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" />
              </svg>
            </div>
            <p className="font-mono text-xs text-zinc-500">ZERO ACTIVE CLAIMS IN ADJUDICATION QUEUE</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-6">
            <p className="font-mono text-xs text-zinc-500">NO CLAIMS MATCH CURRENT FILTER CRITERIA</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs" style={{ minWidth: 920 }}>
              <thead>
                <tr className="border-b border-zinc-800 bg-[#070A13]/60 text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Claimant Legal Vector</th>
                  <th className="py-3 px-4">Line</th>
                  <th className="py-3 px-4">Casualty Type</th>
                  <th className="py-3 px-4">Estimated Loss</th>
                  <th className="py-3 px-4">STP Auto</th>
                  <th className="py-3 px-4">Anomaly Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Cadence</th>
                  <th className="py-3 px-4 text-right">Adjudicate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtered.map((claim) => {
                  const st = STATUS_CONFIGS[claim.status] || { label: claim.status, color: "#94A3B8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" };
                  const theme = POLICY_PALETTE[claim.policyType] || { code: "GEN", color: "#94A3B8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" };
                  const fsc = fraudScoreStyle(claim.fraud?.score || 0);
                  const canSettle = ["submitted", "under_review", "manual_review", "stp_approved", "approved"].includes(claim.status);
                  const canReject = ["submitted", "under_review", "manual_review"].includes(claim.status);
                  const canInvestigate = (claim.fraud?.flags?.length > 0 || claim.fraud?.score >= 40) && claim.status !== "investigation";
                  const isActing = actionLoading === claim._id;

                  return (
                    <tr
                      key={claim._id}
                      className="hover:bg-blue-600/[0.03] transition-colors"
                    >
                      <td className="py-3 px-4 text-white font-sans font-semibold">
                        {claim.claimant?.name || "--"}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border"
                          style={{ background: theme.bg, color: theme.color, borderColor: theme.border }}
                        >
                          {theme.code}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-zinc-300 font-sans text-xs">
                        {CLAIM_TYPE_LABELS[claim.claimDetails?.type] || claim.claimDetails?.type || "--"}
                      </td>

                      <td className="py-3 px-4 text-white font-bold">
                        {formatCurrency(claim.claimDetails?.estimatedAmount)}
                      </td>

                      <td className="py-3 px-4">
                        {claim.stp?.eligible ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-bold">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            YES
                          </span>
                        ) : (
                          <span className="text-zinc-600 font-bold">NO</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className="font-bold text-[10px] px-2 py-0.5 rounded border"
                          style={{ background: fsc.bg, color: fsc.color, borderColor: fsc.border }}
                        >
                          {claim.fraud?.score ?? 0}/100
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className="font-bold text-[10px] px-2 py-0.5 rounded border"
                          style={{ background: st.bg, color: st.color, borderColor: st.border }}
                        >
                          {st.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-zinc-500 text-[10px] whitespace-nowrap">
                        {timeAgo(claim.createdAt)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canSettle && (
                            <button
                              onClick={() => handleAction(claim._id, "approve")}
                              disabled={isActing}
                              className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white font-mono text-[10px] font-bold transition cursor-pointer"
                            >
                              Settle
                            </button>
                          )}
                          {canReject && (
                            <button
                              onClick={() => handleAction(claim._id, "reject")}
                              disabled={isActing}
                              className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 text-rose-300 hover:text-white font-mono text-[10px] font-bold transition cursor-pointer"
                            >
                              Decline
                            </button>
                          )}
                          {canInvestigate && (
                            <button
                              onClick={() => handleAction(claim._id, "investigate")}
                              disabled={isActing}
                              className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 text-amber-300 hover:text-white font-mono text-[10px] font-bold transition cursor-pointer"
                            >
                              Audit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
