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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#fafafa" }}>Assessment History</h1>
          <p className="text-sm mt-1" style={{ color: "#71717a" }}>
            View all past risk assessments
            {!loading && !error && <span style={{ color: "#52525b" }}> &middot; {assessments.length} total</span>}
          </p>
        </div>
        <Link href="/admin/dashboard/assess" className="btn-primary no-underline text-sm hidden sm:inline-flex">
          New Assessment
        </Link>
      </div>
      </FadeUp>

      {/* Batch Upload */}
      <div className="mb-6">
        <BatchUpload />
      </div>

      {/* Search & Filter Bar */}
      {!loading && !error && assessments.length > 0 && (
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
                placeholder="Search by applicant name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36, fontSize: 13 }}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select value={policyFilter} onChange={(e) => setPolicyFilter(e.target.value)}
                style={{
                  background: "rgba(15,15,19,0.9)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fafafa", borderRadius: 10, padding: "8px 12px", fontSize: 13,
                  outline: "none", cursor: "pointer", fontFamily: "inherit",
                }}>
                <option value="all">All Policies</option>
                <option value="health">Health</option>
                <option value="auto">Auto</option>
                <option value="life">Life</option>
                <option value="property">Property</option>
              </select>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: "rgba(15,15,19,0.9)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fafafa", borderRadius: 10, padding: "8px 12px", fontSize: 13,
                  outline: "none", cursor: "pointer", fontFamily: "inherit",
                }}>
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="draft">Draft</option>
                <option value="error">Error</option>
              </select>

              <select value={decisionFilter} onChange={(e) => setDecisionFilter(e.target.value)}
                style={{
                  background: "rgba(15,15,19,0.9)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fafafa", borderRadius: 10, padding: "8px 12px", fontSize: 13,
                  outline: "none", cursor: "pointer", fontFamily: "inherit",
                }}>
                <option value="all">All Decisions</option>
                <option value="approve">Approved</option>
                <option value="refer">Referred</option>
                <option value="decline">Declined</option>
              </select>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: "rgba(15,15,19,0.9)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fafafa", borderRadius: 10, padding: "8px 12px", fontSize: 13,
                  outline: "none", cursor: "pointer", fontFamily: "inherit",
                }}>
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="risk-desc">Highest Risk</option>
                <option value="risk-asc">Lowest Risk</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#71717a" }}>Showing {filtered.length} of {assessments.length}</span>
              <button
                onClick={() => { setSearch(""); setPolicyFilter("all"); setStatusFilter("all"); setDecisionFilter("all"); }}
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
      )}

      {/* Table */}
      <div className="glass-card p-6">
        {error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : assessments.length === 0 ? (
          <div className="text-center py-12">
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(16,185,129,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
              </svg>
            </div>
            <p className="text-sm mb-3" style={{ color: "#71717a" }}>No assessments found</p>
            <Link href="/admin/dashboard/assess" className="btn-primary no-underline text-sm">Create Assessment</Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "#71717a" }}>No assessments match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Applicant", "Policy", "Date", "Risk Score", "Decision", "Premium Range", "Status"].map(h => (
                    <th key={h} className="text-xs font-medium py-3 px-2" style={{ color: "#71717a" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a._id} className="cursor-pointer" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                    onClick={() => document.querySelector(`[data-aid="${a._id}"]`)?.click()}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td className="py-3 px-2 text-sm" style={{ color: "#fafafa" }}>
                      <Link href={`/admin/dashboard/assessment/${a._id}`} data-aid={a._id} className="no-underline" style={{ color: "inherit" }}>{a.applicant?.name || "—"}</Link>
                    </td>
                    <td className="py-3 px-2">
                      {a.policyType ? (
                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{
                          background: a.policyType === "health" ? "rgba(16,185,129,0.1)" : a.policyType === "auto" ? "rgba(245,158,11,0.1)" : a.policyType === "life" ? "rgba(139,92,246,0.1)" : "rgba(59,130,246,0.1)",
                          color: a.policyType === "health" ? "#34d399" : a.policyType === "auto" ? "#fbbf24" : a.policyType === "life" ? "#a78bfa" : "#60a5fa",
                        }}>{a.policyType}</span>
                      ) : <span style={{ color: "#52525b" }}>—</span>}
                    </td>
                    <td className="py-3 px-2 text-sm" style={{ color: "#a1a1aa" }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-2">
                      {a.result?.riskScore != null ? (
                        <span className={`font-mono text-sm font-semibold px-2 py-0.5 rounded-full ${a.result.riskScore <= 35 ? "risk-low" : a.result.riskScore <= 55 ? "risk-medium" : "risk-high"}`}>
                          {a.result.riskScore}
                        </span>
                      ) : <span style={{ color: "#52525b" }}>—</span>}
                    </td>
                    <td className="py-3 px-2 text-sm capitalize" style={{ color: a.result?.decision === "approve" ? "#34d399" : a.result?.decision === "decline" ? "#f87171" : "#fbbf24" }}>
                      {a.result?.decision || "—"}
                    </td>
                    <td className="py-3 px-2 text-sm font-mono" style={{ color: "#a1a1aa" }}>
                      {a.result?.recommendedPremium ? `₹${a.result.recommendedPremium.min?.toLocaleString("en-IN")}-₹${a.result.recommendedPremium.max?.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{
                        background: a.status === "completed" ? "rgba(16,185,129,0.1)" : a.status === "processing" ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.05)",
                        color: a.status === "completed" ? "#34d399" : a.status === "processing" ? "#60a5fa" : "#71717a",
                      }}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
