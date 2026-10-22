"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { FadeUp } from "@/components/motion/StaggerReveal";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerReveal";

/* ═══════ HELPERS ═══════ */
const POLICY_COLORS = { health: "#10b981", auto: "#f59e0b", life: "#a78bfa", property: "#60a5fa" };
const POLICY_BG = { health: "rgba(16,185,129,0.1)", auto: "rgba(245,158,11,0.1)", life: "rgba(167,139,250,0.1)", property: "rgba(96,165,250,0.1)" };

const STATUS_STYLES = {
  submitted: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  under_review: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  stp_approved: { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  approved: { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  stp_rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  investigation: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  settled: { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  paid: { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  manual_review: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  disputed: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
};

const STATUS_LABELS = {
  submitted: "Submitted",
  under_review: "Under Review",
  stp_approved: "STP Approved",
  stp_rejected: "STP Rejected",
  approved: "Approved",
  rejected: "Rejected",
  investigation: "Investigation",
  settled: "Settled",
  paid: "Paid",
  manual_review: "Manual Review",
  disputed: "Disputed",
};

const CLAIM_TYPE_LABELS = {
  accident: "Accident",
  theft: "Theft",
  natural_disaster: "Natural Disaster",
  medical: "Medical",
  death: "Death",
  disability: "Disability",
  property_damage: "Property Damage",
  liability: "Liability",
  other: "Other",
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
  if (score < 20) return { color: "#10b981", bg: "rgba(16,185,129,0.1)" };
  if (score < 40) return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
  if (score < 60) return { color: "#f97316", bg: "rgba(249,115,22,0.1)" };
  return { color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
}

/* ═══════ FILTER TABS ═══════ */
const FILTERS = [
  { key: "all", label: "All" },
  { key: "stp", label: "STP Approved" },
  { key: "manual", label: "Manual Review" },
  { key: "investigation", label: "Investigation" },
  { key: "settled", label: "Settled" },
];

/* ═══════ COMPONENT ═══════ */
export default function AdminClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // claimId being acted on

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
      .catch(() => { setError("Failed to load claims"); setLoading(false); });
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
      if (res.ok) {
        fetchData();
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }, [fetchData]);

  // Computed stats
  const stpCount = useMemo(() => claims.filter((c) => c.stp?.autoApproved).length, [claims]);
  const stpPct = claims.length > 0 ? Math.round((stpCount / claims.length) * 100) : 0;

  const filtered = useMemo(() => {
    let result = [...claims];

    // Tab filter
    if (filter === "stp") result = result.filter((c) => c.stp?.autoApproved);
    else if (filter === "manual") result = result.filter((c) => ["manual_review", "under_review", "submitted"].includes(c.status) && !c.stp?.autoApproved);
    else if (filter === "investigation") result = result.filter((c) => c.status === "investigation" || c.fraud?.investigationRequired);
    else if (filter === "settled") result = result.filter((c) => ["settled", "paid"].includes(c.status));

    // Search
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
    <div>
      <Breadcrumbs />

      {/* Header */}
      <FadeUp>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#fafafa" }}>Claims Management</h1>
            <p className="text-sm mt-1" style={{ color: "#71717a" }}>
              Review, settle, and investigate insurance claims
              {!loading && !error && <span style={{ color: "#52525b" }}> &middot; {claims.length} total</span>}
            </p>
          </div>
          <Link
            href="/admin/dashboard/fraud"
            className="btn-primary no-underline text-sm hidden sm:inline-flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Fraud Dashboard
          </Link>
        </div>
      </FadeUp>

      {/* Stat Cards */}
      <StaggerGrid className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6" delay={0.1}>
        {loading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => <StaggerItem key={i}><StatCardSkeleton /></StaggerItem>)}
          </>
        ) : (
          <>
            {[
              {
                label: "Total Claims", value: stats?.total || 0, color: "#60a5fa",
                icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></>,
              },
              {
                label: "STP Auto-Approved", value: `${stpCount}`, sub: `${stpPct}%`, color: "#10b981",
                icon: <><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></>,
              },
              {
                label: "Under Review", value: stats?.pending || 0, color: "#f59e0b",
                icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
              },
              {
                label: "Fraud Flagged", value: stats?.flagged || 0, color: "#ef4444",
                icon: <><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></>,
              },
              {
                label: "Settled", value: stats?.settled || 0, color: "#10b981",
                icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></>,
              },
            ].map((s) => (
              <StaggerItem key={s.label}>
                <div className="glass-card p-5 relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none" style={{ background: `${s.color}08`, filter: "blur(20px)" }} />
                  <div className="flex justify-between items-start relative">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: "#52525b" }}>{s.label}</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
                        {s.sub && <span className="text-xs font-mono" style={{ color: "#52525b" }}>{s.sub}</span>}
                      </div>
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

      {/* Filter Tabs + Search */}
      {!loading && !error && claims.length > 0 && (
        <FadeUp delay={0.2}>
          <div className="glass-card p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div style={{ position: "relative", flex: 1 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round"
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  className="input-field"
                  placeholder="Search by claimant name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: 36, fontSize: 13 }}
                />
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 flex-wrap">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      border: filter === f.key ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      background: filter === f.key ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                      color: filter === f.key ? "#10b981" : "#71717a",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {(search || filter !== "all") && (
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#71717a" }}>Showing {filtered.length} of {claims.length}</span>
                <button
                  onClick={() => { setSearch(""); setFilter("all"); }}
                  style={{
                    fontSize: 11, color: "#f87171", background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)", borderRadius: 999,
                    padding: "2px 10px", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </FadeUp>
      )}

      {/* Table */}
      <FadeUp delay={0.25}>
        <div className="glass-card p-6">
          {error ? (
            <ErrorState message={error} onRetry={fetchData} />
          ) : loading ? (
            <TableSkeleton rows={6} cols={9} />
          ) : claims.length === 0 ? (
            <div className="text-center py-12">
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "rgba(16,185,129,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" />
                </svg>
              </div>
              <p className="text-sm mb-3" style={{ color: "#71717a" }}>No claims found</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "#71717a" }}>No claims match your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 900 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Claimant", "Policy", "Type", "Amount", "STP", "Fraud Score", "Status", "Date", "Actions"].map((h) => (
                      <th key={h} className="text-xs font-medium py-3 px-2" style={{ color: "#71717a" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((claim) => {
                    const st = STATUS_STYLES[claim.status] || { color: "#71717a", bg: "rgba(255,255,255,0.05)" };
                    const pColor = POLICY_COLORS[claim.policyType] || "#71717a";
                    const pBg = POLICY_BG[claim.policyType] || "rgba(255,255,255,0.05)";
                    const fsc = fraudScoreColor(claim.fraud?.score || 0);
                    const canSettle = ["submitted", "under_review", "manual_review", "stp_approved", "approved"].includes(claim.status);
                    const canReject = ["submitted", "under_review", "manual_review"].includes(claim.status);
                    const canInvestigate = (claim.fraud?.flags?.length > 0 || claim.fraud?.score >= 40) && claim.status !== "investigation";
                    const isActing = actionLoading === claim._id;

                    return (
                      <tr
                        key={claim._id}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <td className="py-3 px-2 text-sm" style={{ color: "#fafafa" }}>
                          {claim.claimant?.name || "--"}
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: pBg, color: pColor }}>
                            {claim.policyType}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-sm capitalize" style={{ color: "#a1a1aa" }}>
                          {CLAIM_TYPE_LABELS[claim.claimDetails?.type] || claim.claimDetails?.type || "--"}
                        </td>
                        <td className="py-3 px-2 text-sm font-mono font-semibold" style={{ color: "#fafafa" }}>
                          {formatCurrency(claim.claimDetails?.estimatedAmount)}
                        </td>
                        <td className="py-3 px-2">
                          {claim.stp?.eligible ? (
                            <span style={{ color: "#10b981" }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </span>
                          ) : (
                            <span style={{ color: "#52525b" }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: fsc.bg, color: fsc.color }}>
                            {claim.fraud?.score ?? 0}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>
                            {STATUS_LABELS[claim.status] || claim.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs" style={{ color: "#52525b" }}>
                          {timeAgo(claim.createdAt)}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1.5">
                            {canSettle && (
                              <button
                                onClick={() => handleAction(claim._id, "approve")}
                                disabled={isActing}
                                style={{
                                  fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                                  padding: "4px 10px", borderRadius: 6, cursor: isActing ? "wait" : "pointer",
                                  background: "rgba(16,185,129,0.1)", color: "#10b981",
                                  border: "1px solid rgba(16,185,129,0.2)",
                                  opacity: isActing ? 0.5 : 1,
                                }}
                              >
                                Settle
                              </button>
                            )}
                            {canReject && (
                              <button
                                onClick={() => handleAction(claim._id, "reject")}
                                disabled={isActing}
                                style={{
                                  fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                                  padding: "4px 10px", borderRadius: 6, cursor: isActing ? "wait" : "pointer",
                                  background: "rgba(239,68,68,0.08)", color: "#f87171",
                                  border: "1px solid rgba(239,68,68,0.2)",
                                  opacity: isActing ? 0.5 : 1,
                                }}
                              >
                                Reject
                              </button>
                            )}
                            {canInvestigate && (
                              <button
                                onClick={() => handleAction(claim._id, "investigate")}
                                disabled={isActing}
                                style={{
                                  fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                                  padding: "4px 10px", borderRadius: 6, cursor: isActing ? "wait" : "pointer",
                                  background: "rgba(245,158,11,0.08)", color: "#f59e0b",
                                  border: "1px solid rgba(245,158,11,0.2)",
                                  opacity: isActing ? 0.5 : 1,
                                }}
                              >
                                Investigate
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
      </FadeUp>
    </div>
  );
}
