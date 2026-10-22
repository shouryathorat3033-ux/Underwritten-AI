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

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "--";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

/* ═══════ FILTER TABS ═══════ */
const FILTERS = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "approved", label: "Approved" },
  { key: "settled", label: "Settled" },
];

/* ═══════ COMPONENT ═══════ */
export default function ApplicantClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

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

  const filtered = useMemo(() => {
    if (filter === "all") return claims;
    if (filter === "approved") return claims.filter((c) => ["stp_approved", "approved"].includes(c.status));
    if (filter === "settled") return claims.filter((c) => ["settled", "paid"].includes(c.status));
    return claims.filter((c) => c.status === filter);
  }, [claims, filter]);

  const approvedSettled = (stats?.approved || 0) + (stats?.settled || 0);

  return (
    <div>
      <Breadcrumbs />

      {/* Header */}
      <FadeUp>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#fafafa" }}>My Claims</h1>
            <p className="text-sm mt-1" style={{ color: "#71717a" }}>
              Track and manage your insurance claims
              {!loading && !error && <span style={{ color: "#52525b" }}> &middot; {claims.length} total</span>}
            </p>
          </div>
          <Link
            href="/applicant/dashboard/claims/new"
            className="btn-primary no-underline text-sm inline-flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            File New Claim
          </Link>
        </div>
      </FadeUp>

      {/* Stat Cards */}
      <StaggerGrid className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" delay={0.1}>
        {loading ? (
          <>
            <StaggerItem><StatCardSkeleton /></StaggerItem>
            <StaggerItem><StatCardSkeleton /></StaggerItem>
            <StaggerItem><StatCardSkeleton /></StaggerItem>
          </>
        ) : (
          <>
            {[
              {
                label: "Total Claims", value: stats?.total || 0, color: "#60a5fa",
                icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></>,
              },
              {
                label: "Approved / Settled", value: approvedSettled, color: "#10b981",
                icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></>,
              },
              {
                label: "Pending", value: stats?.pending || 0, color: "#f59e0b",
                icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
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

      {/* Filter Tabs */}
      {!loading && !error && claims.length > 0 && (
        <FadeUp delay={0.2}>
          <div className="flex gap-2 mb-4 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  border: filter === f.key ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  background: filter === f.key ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                  color: filter === f.key ? "#10b981" : "#71717a",
                  transition: "all 0.15s ease",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </FadeUp>
      )}

      {/* Claims List */}
      <div>
        {error ? (
          <div className="glass-card p-6">
            <ErrorState message={error} onRetry={fetchData} />
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-5">
                <div className="flex gap-4">
                  <Skeleton width={60} height={24} rounded="full" />
                  <div style={{ flex: 1 }}>
                    <Skeleton width={180} height={16} style={{ marginBottom: 8 }} />
                    <Skeleton width={120} height={14} style={{ marginBottom: 6 }} />
                    <Skeleton width={100} height={14} />
                  </div>
                  <Skeleton width={80} height={24} rounded="full" />
                </div>
              </div>
            ))}
          </div>
        ) : claims.length === 0 ? (
          <div className="glass-card p-6">
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
              <p className="text-sm mb-1" style={{ color: "#fafafa", fontWeight: 500 }}>No claims yet</p>
              <p className="text-sm mb-4" style={{ color: "#71717a" }}>File your first insurance claim to get started</p>
              <Link href="/applicant/dashboard/claims/new" className="btn-primary no-underline text-sm">
                File New Claim
              </Link>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-6">
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "#71717a" }}>No claims match this filter</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((claim) => {
              const st = STATUS_STYLES[claim.status] || { color: "#71717a", bg: "rgba(255,255,255,0.05)" };
              const pColor = POLICY_COLORS[claim.policyType] || "#71717a";
              const pBg = POLICY_BG[claim.policyType] || "rgba(255,255,255,0.05)";
              const fraudCount = claim.fraud?.flags?.length || 0;
              const isExpanded = expandedId === claim._id;

              return (
                <FadeUp key={claim._id}>
                  <div
                    className="glass-card p-5 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : claim._id)}
                    style={{ transition: "border-color 0.15s ease" }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = ""}
                  >
                    {/* Top row */}
                    <div className="flex flex-wrap items-start gap-3">
                      {/* Policy badge */}
                      <span
                        className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: pBg, color: pColor }}
                      >
                        {claim.policyType}
                      </span>

                      {/* Main content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-semibold" style={{ color: "#fafafa" }}>
                            {CLAIM_TYPE_LABELS[claim.claimDetails?.type] || claim.claimDetails?.type || "Claim"}
                          </span>
                          <span className="font-mono text-sm font-bold" style={{ color: "#fafafa" }}>
                            {formatCurrency(claim.claimDetails?.estimatedAmount)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Status badge */}
                          <span
                            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: st.bg, color: st.color }}
                          >
                            {STATUS_LABELS[claim.status] || claim.status}
                          </span>

                          {/* STP badge */}
                          {claim.stp?.autoApproved && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
                            >
                              STP Auto-Approved
                            </span>
                          )}

                          {/* Fraud flags */}
                          {fraudCount > 0 && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {fraudCount} fraud flag{fraudCount > 1 ? "s" : ""}
                            </span>
                          )}

                          {/* Date */}
                          <span className="text-[11px]" style={{ color: "#52525b" }}>
                            {timeAgo(claim.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Expand indicator */}
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round"
                        style={{ transition: "transform 0.2s ease", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", marginTop: 4 }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#52525b" }}>Claimant</p>
                            <p className="text-sm" style={{ color: "#fafafa" }}>{claim.claimant?.name || "--"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#52525b" }}>Incident Date</p>
                            <p className="text-sm" style={{ color: "#a1a1aa" }}>
                              {claim.claimDetails?.incidentDate ? new Date(claim.claimDetails.incidentDate).toLocaleDateString("en-IN") : "--"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#52525b" }}>Location</p>
                            <p className="text-sm" style={{ color: "#a1a1aa" }}>{claim.claimDetails?.location || "--"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#52525b" }}>Approved Amount</p>
                            <p className="text-sm font-mono font-semibold" style={{ color: claim.claimDetails?.approvedAmount ? "#10b981" : "#52525b" }}>
                              {claim.claimDetails?.approvedAmount ? formatCurrency(claim.claimDetails.approvedAmount) : "--"}
                            </p>
                          </div>
                        </div>

                        {claim.claimDetails?.description && (
                          <div style={{ marginTop: 12 }}>
                            <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#52525b" }}>Description</p>
                            <p className="text-sm" style={{ color: "#a1a1aa", lineHeight: 1.5 }}>{claim.claimDetails.description}</p>
                          </div>
                        )}

                        {claim.stp && (
                          <div style={{ marginTop: 12 }}>
                            <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#52525b" }}>STP Analysis</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                background: claim.stp.eligible ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)",
                                color: claim.stp.eligible ? "#10b981" : "#71717a",
                              }}>
                                {claim.stp.eligible ? "STP Eligible" : "Not STP Eligible"}
                              </span>
                              <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{
                                background: "rgba(255,255,255,0.05)", color: "#a1a1aa",
                              }}>
                                Complexity: {claim.stp.complexity || "--"}
                              </span>
                              {claim.stp.processingTime != null && (
                                <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{
                                  background: "rgba(255,255,255,0.05)", color: "#a1a1aa",
                                }}>
                                  {claim.stp.processingTime}ms
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {claim.documents?.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#52525b" }}>Documents ({claim.documents.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {claim.documents.map((doc, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{
                                  background: "rgba(255,255,255,0.05)", color: "#a1a1aa",
                                }}>
                                  {doc.name || doc.docType || `Doc ${i + 1}`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </FadeUp>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
