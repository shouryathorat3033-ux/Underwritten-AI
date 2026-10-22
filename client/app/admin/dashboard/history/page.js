"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { TableSkeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { FadeUp } from "@/components/motion/StaggerReveal";
import BatchUpload from "@/components/ui/BatchUpload";

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
      .catch(() => { setError("Failed to load assessments ledger from database"); setLoading(false); });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    let result = [...assessments];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        (a.applicant?.name || "").toLowerCase().includes(q) ||
        (a.result?.decision || "").toLowerCase().includes(q) ||
        (a._id || "").toLowerCase().includes(q)
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
  }, [assessments, search, statusFilter, decisionFilter, policyFilter, sortBy]);

  const hasFilters = search || statusFilter !== "all" || decisionFilter !== "all" || policyFilter !== "all";

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Blueprint Header */}
      <FadeUp>
        <div className="blueprint-card p-6 bg-[#070A13] border-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-[10px] font-mono text-blue-400/40 tracking-wider">
            [SYS.DOCKET_REGISTER_V3.8]
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono uppercase tracking-widest mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Underwriting Historical Repository
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                Assessment Archive & Ledger
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl font-mono">
                Systematic query log of historical risk evaluations, policy classifications, algorithmic decisions, and actuarial parameters.
                {!loading && !error && (
                  <span className="text-blue-400 ml-2">
                    &bull; {assessments.length} dossiers indexed
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/dashboard/assess"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider font-semibold shadow-lg shadow-blue-500/20 transition-all border border-blue-400/30"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Assessment Intake
              </Link>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* Batch Upload Section */}
      <div className="blueprint-card p-5 bg-[#0A0F1D]/80 border-slate-800">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-mono text-xs font-bold">[BATCH.INGESTION]</span>
            <span className="text-xs text-slate-300 font-medium">Asynchronous CSV / JSON Dossier Ingestion Engine</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">FORMAT: RFC-4180 COMPLIANT</span>
        </div>
        <BatchUpload />
      </div>

      {/* Filter and Search Console */}
      {!loading && !error && (
        <div className="blueprint-card p-4 bg-[#0A0F1D]/90 border-blue-500/20">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748B"
                strokeWidth="2"
                strokeLinecap="round"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="w-full bg-[#070A13] border border-slate-800 focus:border-blue-500 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 font-mono transition-colors outline-none"
                placeholder="Query dossier by applicant name, ID, or decision..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              {/* Policy Type */}
              <select
                value={policyFilter}
                onChange={(e) => setPolicyFilter(e.target.value)}
                className="bg-[#070A13] border border-slate-800 hover:border-blue-500/50 focus:border-blue-500 text-slate-200 rounded-lg px-3 py-2 text-xs font-mono outline-none cursor-pointer transition-colors"
              >
                <option value="all">ALL POLICIES</option>
                <option value="health">HEALTH</option>
                <option value="auto">AUTO</option>
                <option value="life">LIFE</option>
                <option value="property">PROPERTY</option>
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#070A13] border border-slate-800 hover:border-blue-500/50 focus:border-blue-500 text-slate-200 rounded-lg px-3 py-2 text-xs font-mono outline-none cursor-pointer transition-colors"
              >
                <option value="all">ALL STATUS</option>
                <option value="completed">COMPLETED</option>
                <option value="processing">PROCESSING</option>
                <option value="draft">DRAFT</option>
                <option value="error">ERROR</option>
              </select>

              {/* Decision */}
              <select
                value={decisionFilter}
                onChange={(e) => setDecisionFilter(e.target.value)}
                className="bg-[#070A13] border border-slate-800 hover:border-blue-500/50 focus:border-blue-500 text-slate-200 rounded-lg px-3 py-2 text-xs font-mono outline-none cursor-pointer transition-colors"
              >
                <option value="all">ALL DECISIONS</option>
                <option value="approve">APPROVED</option>
                <option value="refer">REFERRED</option>
                <option value="decline">DECLINED</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#070A13] border border-slate-800 hover:border-blue-500/50 focus:border-blue-500 text-slate-200 rounded-lg px-3 py-2 text-xs font-mono outline-none cursor-pointer transition-colors"
              >
                <option value="date-desc">TIMESTAMP: NEWEST</option>
                <option value="date-asc">TIMESTAMP: OLDEST</option>
                <option value="risk-desc">RISK SCORE: HIGHEST</option>
                <option value="risk-asc">RISK SCORE: LOWEST</option>
              </select>
            </div>
          </div>

          {/* Active filter counter and clear button */}
          {hasFilters && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
              <span className="text-[11px] font-mono text-slate-400">
                ACTIVE FILTER: Displaying {filtered.length} of {assessments.length} records
              </span>
              <button
                onClick={() => {
                  setSearch("");
                  setPolicyFilter("all");
                  setStatusFilter("all");
                  setDecisionFilter("all");
                }}
                className="ml-auto text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
              >
                Clear Filters [RESET]
              </button>
            </div>
          )}
        </div>
      )}

      {/* Primary Data Grid */}
      <div className="blueprint-card p-5 bg-[#0A0F1D]/90 border-slate-800 overflow-hidden">
        {error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : assessments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Zero Archives Present</h3>
            <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto font-mono">
              No historical underwritten assessments have been recorded in the database registry yet.
            </p>
            <Link
              href="/admin/dashboard/assess"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase font-semibold transition-all"
            >
              Initialize Assessment Intake
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xs font-mono text-slate-400 mb-2">No dossiers match current filter parameters</p>
            <button
              onClick={() => {
                setSearch("");
                setPolicyFilter("all");
                setStatusFilter("all");
                setDecisionFilter("all");
              }}
              className="text-xs font-mono text-blue-400 underline hover:text-blue-300"
            >
              Reset active filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Applicant / Ref</th>
                  <th className="py-3 px-3">Policy Class</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3 text-center">Risk Vector</th>
                  <th className="py-3 px-3">Decision</th>
                  <th className="py-3 px-3">Actuarial Premium Band</th>
                  <th className="py-3 px-3 text-right">Telemetry Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {filtered.map((a) => {
                  const risk = a.result?.riskScore;
                  const decision = a.result?.decision?.toLowerCase();
                  return (
                    <tr
                      key={a._id}
                      className="hover:bg-blue-950/20 transition-colors group cursor-pointer"
                      onClick={() => {
                        window.location.href = `/admin/dashboard/assessment/${a._id}`;
                      }}
                    >
                      {/* Applicant */}
                      <td className="py-3.5 px-3">
                        <Link
                          href={`/admin/dashboard/assessment/${a._id}`}
                          className="font-medium text-slate-200 group-hover:text-blue-400 transition-colors block text-sm font-sans"
                        >
                          {a.applicant?.name || "Anonymous Applicant"}
                        </Link>
                        <span className="text-[10px] text-slate-500 tracking-wider">
                          REF #{a._id?.slice(-8).toUpperCase()}
                        </span>
                      </td>

                      {/* Policy Class */}
                      <td className="py-3.5 px-3">
                        {a.policyType ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              a.policyType === "health"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : a.policyType === "auto"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : a.policyType === "life"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {a.policyType}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                        {new Date(a.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Risk Score */}
                      <td className="py-3.5 px-3 text-center">
                        {risk != null ? (
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                              risk <= 35
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : risk <= 65
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {risk} / 100
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Decision */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            decision === "approve"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : decision === "decline"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full ${
                              decision === "approve"
                                ? "bg-emerald-400"
                                : decision === "decline"
                                ? "bg-rose-400"
                                : "bg-amber-400"
                            }`}
                          />
                          {decision || "PENDING"}
                        </span>
                      </td>

                      {/* Recommended Premium */}
                      <td className="py-3.5 px-3 text-slate-300 text-xs">
                        {a.result?.recommendedPremium?.min != null ? (
                          <span>
                            ₹{a.result.recommendedPremium.min.toLocaleString("en-IN")} – ₹
                            {a.result.recommendedPremium.max.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                            a.status === "completed"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : a.status === "processing"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {a.status}
                        </span>
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
