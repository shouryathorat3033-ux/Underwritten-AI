"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { TableSkeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { FadeUp } from "@/components/motion/StaggerReveal";

export default function HistoryPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [decisionFilter, setDecisionFilter] = useState("all");
  const [policyFilter, setPolicyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/assessments")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setAssessments(d.assessments || []); setLoading(false); })
      .catch(() => { setError("Failed to load assessments"); setLoading(false); });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    let result = [...assessments];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        (a.applicant?.name || "").toLowerCase().includes(q) ||
        (a.result?.decision || "").toLowerCase().includes(q)
      );
    }

    // Policy type filter
    if (policyFilter !== "all") {
      result = result.filter(a => a.policyType === policyFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(a => a.status === statusFilter);
    }

    // Decision filter
    if (decisionFilter !== "all") {
      result = result.filter(a => a.result?.decision === decisionFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "date-asc") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "risk-desc") return (b.result?.riskScore || 0) - (a.result?.riskScore || 0);
      if (sortBy === "risk-asc") return (a.result?.riskScore || 0) - (b.result?.riskScore || 0);
      return 0;
    });

    return result;
  }, [assessments, search, statusFilter, decisionFilter, sortBy]);

  const hasFilters = search || statusFilter !== "all" || decisionFilter !== "all" || policyFilter !== "all";

  return (
    <div>
      <Breadcrumbs />

      <FadeUp>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/20 text-blue-400 bg-blue-500/5">[DOCKET.REGISTRY // AUDIT]</span>
            <span className="text-[10px] font-mono text-slate-400">ARCHIVE_INDEX</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Actuarial Assessment History</h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Cryptographically sealed risk assessment dockets & historical underwriting outcomes
            {!loading && !error && <span className="text-blue-400 font-bold"> &middot; {assessments.length} RECORDED</span>}
          </p>
        </div>
        <Link href="/applicant/dashboard/assess" className="btn-primary no-underline text-xs font-mono uppercase tracking-wider hidden sm:inline-flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          DISPATCH_NEW_INTAKE
        </Link>
      </div>
      </FadeUp>

      {/* Search & Filter Bar */}
      {!loading && !error && assessments.length > 0 && (
        <div className="blueprint-card p-4 mb-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"
                className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-mono outline-none transition-all"
                placeholder="Search by applicant name or UUID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: "rgba(10,15,29,0.7)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  color: "#f8fafc",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(59,130,246,0.2)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <select value={policyFilter} onChange={(e) => setPolicyFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-mono outline-none cursor-pointer border"
                style={{
                  background: "rgba(10,15,29,0.9)",
                  borderColor: "rgba(59,130,246,0.2)",
                  color: "#f8fafc",
                }}>
                <option value="all">ALL POLICIES</option>
                <option value="health">HEALTH</option>
                <option value="auto">AUTO</option>
                <option value="life">LIFE</option>
                <option value="property">PROPERTY</option>
              </select>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-mono outline-none cursor-pointer border"
                style={{
                  background: "rgba(10,15,29,0.9)",
                  borderColor: "rgba(59,130,246,0.2)",
                  color: "#f8fafc",
                }}>
                <option value="all">ALL STATUS</option>
                <option value="completed">COMPLETED</option>
                <option value="processing">PROCESSING</option>
                <option value="draft">DRAFT</option>
                <option value="error">ERROR</option>
              </select>

              <select value={decisionFilter} onChange={(e) => setDecisionFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-mono outline-none cursor-pointer border"
                style={{
                  background: "rgba(10,15,29,0.9)",
                  borderColor: "rgba(59,130,246,0.2)",
                  color: "#f8fafc",
                }}>
                <option value="all">ALL DECISIONS</option>
                <option value="approve">APPROVED</option>
                <option value="refer">REFERRED</option>
                <option value="decline">DECLINED</option>
              </select>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-mono outline-none cursor-pointer border"
                style={{
                  background: "rgba(10,15,29,0.9)",
                  borderColor: "rgba(59,130,246,0.2)",
                  color: "#f8fafc",
                }}>
                <option value="date-desc">NEWEST</option>
                <option value="date-asc">OLDEST</option>
                <option value="risk-desc">HIGH RISK</option>
                <option value="risk-asc">LOW RISK</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/80 font-mono text-[10px]">
              <span className="text-slate-400">FILTERED: {filtered.length} OF {assessments.length} DOCKETS</span>
              <button
                onClick={() => { setSearch(""); setPolicyFilter("all"); setStatusFilter("all"); setDecisionFilter("all"); }}
                className="px-2.5 py-0.5 rounded border border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors uppercase cursor-pointer"
              >
                RESET_FILTERS
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="blueprint-card p-6 relative overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : assessments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.75" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
              </svg>
            </div>
            <p className="text-xs font-mono text-slate-400 mb-4">[NO_HISTORICAL_DOCKETS_DETECTED]</p>
            <Link href="/applicant/dashboard/assess" className="btn-primary no-underline text-xs font-mono uppercase tracking-wider inline-flex items-center gap-2">
              DISPATCH_FIRST_ASSESSMENT
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xs font-mono text-slate-400">[NO_DOCKETS_MATCH_ACTIVE_FILTER_MATRIX]</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono">
              <thead>
                <tr className="border-b border-slate-800/80 text-[10px] uppercase text-slate-400">
                  {["APPLICANT // IDENTITY", "POLICY_CLASS", "TIMESTAMP", "ACTUARIAL_DECISION", "ANNUAL_PREMIUM", "STATUS"].map(h => (
                    <th key={h} className="py-3 px-3 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((a) => {
                  const uw = a.underwriterAction?.action;
                  const displayDecision = uw === "accepted" ? "Approved"
                    : uw === "rejected" ? "Not Approved"
                    : uw === "modified" ? "Approved"
                    : uw === "info_requested" ? "Info Requested"
                    : "Under Review";
                  const decColor = uw === "accepted" || uw === "modified" ? "#3b82f6"
                    : uw === "rejected" ? "#f43f5e"
                    : "#f59e0b";
                  const showPremium = uw === "accepted" || uw === "modified";
                  const premium = showPremium && (a.underwriterAction?.modifiedPremium || a.result?.recommendedPremium);

                  const policyColors = {
                    health: { text: "#38bdf8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.25)" },
                    auto: { text: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)" },
                    life: { text: "#f43f5e", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.25)" },
                    property: { text: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)" },
                  };
                  const pCol = policyColors[a.policyType] || policyColors.health;

                  return (
                    <tr key={a._id} className="cursor-pointer hover:bg-slate-900/40 transition-colors text-xs"
                      onClick={() => document.querySelector(`[data-aid="${a._id}"]`)?.click()}>
                      <td className="py-3 px-3">
                        <Link href={`/applicant/dashboard/assessment/${a._id}`} data-aid={a._id} className="no-underline text-white font-bold hover:text-blue-400 transition-colors flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {a.applicant?.name || "ANONYMOUS_APPLICANT"}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        {a.policyType ? (
                          <span className="text-[9px] uppercase px-2 py-0.5 rounded border" style={{
                            background: pCol.bg,
                            color: pCol.text,
                            borderColor: pCol.border,
                          }}>[{a.policyType}]</span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] px-2.5 py-1 rounded border" style={{ background: `${decColor}15`, color: decColor, borderColor: `${decColor}35` }}>
                          [{displayDecision.toUpperCase()}]
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-bold">
                        {premium ? `₹${premium.min?.toLocaleString("en-IN")}–₹${premium.max?.toLocaleString("en-IN")}` : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] px-2 py-0.5 rounded border capitalize" style={{
                          background: (uw === "accepted" || uw === "modified") ? "rgba(37,99,235,0.1)" : a.status === "processing" ? "rgba(56,189,248,0.1)" : "rgba(245,158,11,0.1)",
                          color: (uw === "accepted" || uw === "modified") ? "#38bdf8" : a.status === "processing" ? "#38bdf8" : "#fbbf24",
                          borderColor: (uw === "accepted" || uw === "modified") ? "rgba(59,130,246,0.3)" : a.status === "processing" ? "rgba(56,189,248,0.3)" : "rgba(245,158,11,0.3)",
                        }}>{uw ? (uw === "accepted" ? "CLOSED_BOUND" : uw === "rejected" ? "DECLINED" : "PENDING_AUDIT") : "QUEUED"}</span>
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
