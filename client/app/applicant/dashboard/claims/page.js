"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { StatCardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { FadeUp } from "@/components/motion/StaggerReveal";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerReveal";

/* ═══════ ORDIVALABS DESIGN SYSTEM PALETTES ═══════ */
const POLICY_THEMES = {
  health: { color: "#3B82F6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)", code: "HLTH" },
  auto: { color: "#06B6D4", bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.25)", code: "AUTO" },
  life: { color: "#818CF8", bg: "rgba(129,140,248,0.1)", border: "rgba(129,140,248,0.25)", code: "LIFE" },
  property: { color: "#38BDF8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.25)", code: "PROP" },
};

const STATUS_CONFIGS = {
  submitted: { label: "Submitted", color: "#38BDF8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.25)" },
  under_review: { label: "Under Review", color: "#60A5FA", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.25)" },
  stp_approved: { label: "STP Approved", color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
  approved: { label: "Approved", color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
  rejected: { label: "Rejected", color: "#F43F5E", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.25)" },
  stp_rejected: { label: "STP Rejected", color: "#F43F5E", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.25)" },
  investigation: { label: "Investigation", color: "#F43F5E", bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.3)" },
  settled: { label: "Settled", color: "#3B82F6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
  paid: { label: "Disbursed / Paid", color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
  manual_review: { label: "Manual Review", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  disputed: { label: "Disputed", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
};

const CLAIM_TYPE_LABELS = {
  accident: "Accident / Collision",
  theft: "Total / Partial Theft",
  natural_disaster: "Catastrophic Weather / Inundation",
  medical: "Hospitalization / In-Patient Care",
  death: "Life Term Benefit",
  disability: "Accidental Disability",
  property_damage: "Structural Damage",
  liability: "Third-Party Liability",
  other: "Standard Casualty",
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

const FILTERS = [
  { key: "all", label: "All Dockets" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "In Review" },
  { key: "approved", label: "Approved" },
  { key: "settled", label: "Settled / Disbursed" },
];

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
      .catch(() => { setError("Failed to synchronize claims registry"); setLoading(false); });
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
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <FadeUp>
        <div className="blueprint-card p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="absolute top-0 right-0 w-80 h-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px] tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                [ACT.DISPATCH_REGISTRY]
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                STP_ADJUDICATION_ACTIVE
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Claims & Loss Adjudication
            </h1>
            <p className="text-xs lg:text-sm text-zinc-400 mt-1 max-w-xl">
              Track straight-through processing (STP), forensic verification signals, and settlement disbursements across all active policies.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <Link
              href="/applicant/dashboard/claims/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide transition shadow-lg shadow-blue-500/20 no-underline"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              File New Claim
            </Link>
          </div>
        </div>
      </FadeUp>

      {/* Telemetry Stat Cards */}
      <StaggerGrid className="grid grid-cols-1 sm:grid-cols-3 gap-4" delay={0.08}>
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
                label: "Total Registered Claims",
                code: "[STAT.01_VOLUME]",
                value: stats?.total || claims.length || 0,
                color: "#3B82F6",
                icon: (
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" />
                ),
              },
              {
                label: "Adjudicated & Settled",
                code: "[STAT.02_SETTLED]",
                value: approvedSettled,
                color: "#10B981",
                icon: (
                  <>
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <path d="M22 4L12 14.01l-3-3" />
                  </>
                ),
              },
              {
                label: "Under Active Review",
                code: "[STAT.03_PENDING]",
                value: stats?.pending || claims.filter(c => ["submitted", "under_review", "investigation"].includes(c.status)).length,
                color: "#F59E0B",
                icon: (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </>
                ),
              },
            ].map((s) => (
              <StaggerItem key={s.label}>
                <div className="blueprint-card p-5 relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
                        {s.code}
                      </span>
                      <p className="text-xs font-medium text-zinc-400 mb-2">{s.label}</p>
                      <span className="font-mono text-3xl font-bold tracking-tight text-white">
                        {s.value}
                      </span>
                    </div>
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center border"
                      style={{ background: `${s.color}10`, borderColor: `${s.color}30` }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        {s.icon}
                      </svg>
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
        <FadeUp delay={0.12}>
          <div className="flex gap-2 flex-wrap items-center">
            <span className="font-mono text-[10px] text-zinc-500 uppercase mr-1">[FILTER.STATUS]:</span>
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition flex items-center gap-1.5 ${
                    active
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
                      : "bg-[#0A0F1D]/60 hover:bg-[#0E1526] text-zinc-400 border border-zinc-800"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </FadeUp>
      )}

      {/* Claims List */}
      <div>
        {error ? (
          <div className="blueprint-card p-6">
            <ErrorState message={error} onRetry={fetchData} />
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="blueprint-card p-5">
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
          <div className="blueprint-card p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 text-blue-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" />
              </svg>
            </div>
            <span className="font-mono text-[10px] text-zinc-500 block mb-1">[DOCKET.EMPTY]</span>
            <p className="text-base font-bold text-white mb-1">No Loss Claims Filed</p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-5">
              Submit your first incident docket to trigger our straight-through processing neural engine.
            </p>
            <Link href="/applicant/dashboard/claims/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs no-underline transition">
              File First Claim
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="blueprint-card p-8 text-center">
            <p className="text-xs font-mono text-zinc-500">NO DOCKETS MATCHING ACTIVE FILTER VECTOR</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((claim) => {
              const st = STATUS_CONFIGS[claim.status] || { label: claim.status, color: "#94A3B8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" };
              const theme = POLICY_THEMES[claim.policyType] || { color: "#3B82F6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)", code: "POL" };
              const fraudCount = claim.fraud?.flags?.length || 0;
              const isExpanded = expandedId === claim._id;

              return (
                <FadeUp key={claim._id}>
                  <div
                    className={`blueprint-card-interactive p-5 cursor-pointer transition ${isExpanded ? "border-blue-500/40 bg-[#0A0F1D]" : ""}`}
                    onClick={() => setExpandedId(isExpanded ? null : claim._id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3">
                        <span
                          className="font-mono text-[10px] font-bold px-2 py-1 rounded border tracking-wider shrink-0"
                          style={{ background: theme.bg, color: theme.color, borderColor: theme.border }}
                        >
                          {theme.code}
                        </span>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {CLAIM_TYPE_LABELS[claim.claimDetails?.type] || claim.claimDetails?.type || "Casualty Claim"}
                            </span>
                            <span className="font-mono text-xs text-zinc-500">
                              #{claim._id?.slice(-8).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span
                              className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded border"
                              style={{ background: st.bg, color: st.color, borderColor: st.border }}
                            >
                              {st.label}
                            </span>

                            {claim.stp?.autoApproved && (
                              <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                STP APPROVED
                              </span>
                            )}

                            {fraudCount > 0 && (
                              <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/25 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                                {fraudCount} ANOMALY FLAG{fraudCount > 1 ? "S" : ""}
                              </span>
                            )}

                            <span className="text-[11px] font-mono text-zinc-500">
                              {timeAgo(claim.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5">
                        <div className="text-right">
                          <span className="font-mono text-[9px] text-zinc-500 uppercase block">Estimated Loss</span>
                          <span className="font-mono text-sm font-bold text-white">
                            {formatCurrency(claim.claimDetails?.estimatedAmount)}
                          </span>
                        </div>

                        <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                          <svg
                            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                            style={{ transition: "transform 0.2s ease", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Technical Dossier */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-[#070A13] p-3 rounded-lg border border-zinc-800/60">
                            <span className="font-mono text-[9px] text-zinc-500 block uppercase">[CLAIMANT.LEGAL_NAME]</span>
                            <span className="text-xs font-semibold text-white truncate block mt-0.5">
                              {claim.claimant?.name || "--"}
                            </span>
                          </div>
                          <div className="bg-[#070A13] p-3 rounded-lg border border-zinc-800/60">
                            <span className="font-mono text-[9px] text-zinc-500 block uppercase">[INCIDENT.DATE]</span>
                            <span className="text-xs font-mono text-zinc-300 block mt-0.5">
                              {claim.claimDetails?.incidentDate ? new Date(claim.claimDetails.incidentDate).toLocaleDateString("en-IN") : "--"}
                            </span>
                          </div>
                          <div className="bg-[#070A13] p-3 rounded-lg border border-zinc-800/60">
                            <span className="font-mono text-[9px] text-zinc-500 block uppercase">[GEOLOCATION.VECTOR]</span>
                            <span className="text-xs text-zinc-300 truncate block mt-0.5">
                              {claim.claimDetails?.location || "--"}
                            </span>
                          </div>
                          <div className="bg-[#070A13] p-3 rounded-lg border border-zinc-800/60">
                            <span className="font-mono text-[9px] text-zinc-500 block uppercase">[DISBURSED.SETTLEMENT]</span>
                            <span className={`text-xs font-mono font-bold block mt-0.5 ${claim.claimDetails?.approvedAmount ? "text-emerald-400" : "text-zinc-500"}`}>
                              {claim.claimDetails?.approvedAmount ? formatCurrency(claim.claimDetails.approvedAmount) : "Pending Review"}
                            </span>
                          </div>
                        </div>

                        {claim.claimDetails?.description && (
                          <div className="bg-[#070A13] p-3.5 rounded-lg border border-zinc-800/60">
                            <span className="font-mono text-[9px] text-zinc-500 block uppercase mb-1">[INCIDENT.NARRATIVE]</span>
                            <p className="text-xs text-zinc-300 leading-relaxed">{claim.claimDetails.description}</p>
                          </div>
                        )}

                        {claim.stp && (
                          <div className="bg-[#070A13] p-3.5 rounded-lg border border-zinc-800/60">
                            <span className="font-mono text-[9px] text-zinc-500 block uppercase mb-1.5">[NEURAL_ENGINE.STP_TELEMETRY]</span>
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                                claim.stp.eligible
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
                                  : "bg-zinc-800/40 text-zinc-400 border-zinc-700/50"
                              }`}>
                                {claim.stp.eligible ? "STP Protocol Eligible" : "Manual Adjudication Required"}
                              </span>
                              {claim.stp.complexity && (
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                  Complexity: {claim.stp.complexity}
                                </span>
                              )}
                              {claim.stp.processingTime != null && (
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                  Latency: {claim.stp.processingTime}ms
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {claim.documents?.length > 0 && (
                          <div className="bg-[#070A13] p-3.5 rounded-lg border border-zinc-800/60">
                            <span className="font-mono text-[9px] text-zinc-500 block uppercase mb-1.5">
                              [EVIDENCE.VERIFIED_DOCS] ({claim.documents.length})
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {claim.documents.map((doc, i) => (
                                <span key={i} className="text-xs font-mono px-2.5 py-1 rounded bg-blue-950/20 text-blue-300 border border-blue-500/20 flex items-center gap-1.5">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" />
                                  </svg>
                                  {doc.name || doc.docType || `Doc_${i + 1}`}
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
