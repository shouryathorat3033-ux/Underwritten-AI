"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FadeUp } from "@/components/motion/StaggerReveal";

const policyColors = {
  health: { bg: "rgba(16,185,129,0.1)", color: "#34d399", label: "Health" },
  auto: { bg: "rgba(245,158,11,0.1)", color: "#fbbf24", label: "Auto" },
  life: { bg: "rgba(139,92,246,0.1)", color: "#a78bfa", label: "Life" },
  property: { bg: "rgba(59,130,246,0.1)", color: "#60a5fa", label: "Property" },
};

const statusStyles = {
  accepted: { bg: "rgba(16,185,129,0.1)", color: "#34d399", label: "Active" },
  completed: { bg: "rgba(16,185,129,0.08)", color: "#10b981", label: "Approved" },
  referred: { bg: "rgba(245,158,11,0.1)", color: "#fbbf24", label: "Under Review" },
  rejected: { bg: "rgba(239,68,68,0.1)", color: "#f87171", label: "Declined" },
  processing: { bg: "rgba(59,130,246,0.1)", color: "#60a5fa", label: "Processing" },
  draft: { bg: "rgba(255,255,255,0.05)", color: "#71717a", label: "Draft" },
};

export default function PoliciesPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/assessments")
      .then(r => r.json())
      .then(d => { setAssessments(d.assessments || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Only show assessments that have results (completed/accepted/referred)
  const policies = assessments.filter(a =>
    ["completed", "accepted", "rejected", "referred"].includes(a.status) && a.result
  );

  const filtered = filter === "all" ? policies : policies.filter(a => a.policyType === filter);

  const activePolicies = policies.filter(a => a.status === "accepted" || a.status === "completed").length;
  const pendingReview = policies.filter(a => a.status === "referred").length;
  const declined = policies.filter(a => a.status === "rejected").length;
  const totalPremium = policies
    .filter(a => (a.status === "accepted" || a.status === "completed") && a.result?.recommendedPremium)
    .reduce((sum, a) => {
      const avg = ((a.result.recommendedPremium.min || 0) + (a.result.recommendedPremium.max || 0)) / 2;
      return sum + avg;
    }, 0);

  return (
    <div>
      <FadeUp>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#fafafa" }}>My Policies</h1>
          <p className="text-sm mt-1" style={{ color: "#71717a" }}>
            Track your insurance applications and active policies
          </p>
        </div>
        <Link href="/applicant/dashboard/assess" className="btn-primary no-underline text-sm inline-flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          New Policy
        </Link>
      </div>
      </FadeUp>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Policies", value: activePolicies, color: "#10b981", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
          { label: "Pending Review", value: pendingReview, color: "#f59e0b", icon: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" },
          { label: "Declined", value: declined, color: "#ef4444", icon: "M18 6L6 18M6 6l12 12" },
          { label: "Est. Annual Premium", value: `₹${Math.round(totalPremium).toLocaleString("en-IN")}`, color: "#10b981", icon: "M12 1v2M12 21v2M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
        ].map(s => (
          <div key={s.label} className="glass-card p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "#71717a" }}>{s.label}</p>
                <p className="font-mono text-2xl font-bold" style={{ color: s.color }}>{loading ? "—" : s.value}</p>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon}/></svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { id: "all", label: "All Policies" },
          { id: "health", label: "Health" },
          { id: "auto", label: "Auto" },
          { id: "life", label: "Life" },
          { id: "property", label: "Property" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-all"
            style={{
              background: filter === f.id ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
              color: filter === f.id ? "#34d399" : "#71717a",
              border: `1px solid ${filter === f.id ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
              cursor: "pointer", fontFamily: "inherit",
            }}>
            {f.label}
            {f.id !== "all" && (
              <span className="ml-1.5 font-mono" style={{ color: "#52525b" }}>
                {policies.filter(a => a.policyType === f.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Policy cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-card p-6 animate-pulse" style={{ height: 180 }}>
              <div className="h-4 rounded" style={{ background: "rgba(255,255,255,0.04)", width: "40%" }} />
              <div className="h-3 rounded mt-3" style={{ background: "rgba(255,255,255,0.03)", width: "60%" }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16,185,129,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <p className="text-sm mb-1" style={{ color: "#a1a1aa" }}>No policies yet</p>
          <p className="text-xs mb-4" style={{ color: "#52525b" }}>Start an assessment to get your first policy</p>
          <Link href="/applicant/dashboard/assess" className="btn-primary no-underline text-sm">Start Assessment</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(a => {
            const pt = policyColors[a.policyType] || policyColors.health;
            const st = statusStyles[a.status] || statusStyles.draft;
            const premium = a.result?.recommendedPremium;
            const premiumDisplay = premium ? `₹${premium.min?.toLocaleString("en-IN")} - ₹${premium.max?.toLocaleString("en-IN")}/yr` : "—";

            return (
              <Link key={a._id} href={`/applicant/dashboard/assessment/${a._id}`} className="glass-card p-5 no-underline block transition-all duration-200 group"
                style={{ cursor: "pointer" }}>
                {/* Header row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: pt.bg }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={pt.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        {a.policyType === "health" && <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>}
                        {a.policyType === "auto" && <><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2"/></>}
                        {a.policyType === "life" && <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>}
                        {a.policyType === "property" && <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: "#fafafa" }}>{pt.label} Insurance</h3>
                      <p className="text-xs" style={{ color: "#71717a" }}>{a.applicant?.name || "—"}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "#52525b" }}>Risk Score</p>
                    <p className="font-mono text-sm font-bold" style={{
                      color: (a.result?.riskScore || 0) <= 30 ? "#34d399" : (a.result?.riskScore || 0) <= 60 ? "#fbbf24" : "#f87171"
                    }}>{a.result?.riskScore ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "#52525b" }}>Premium</p>
                    <p className="font-mono text-sm font-semibold" style={{ color: "#a1a1aa" }}>{premiumDisplay}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "#52525b" }}>Confidence</p>
                    <p className="font-mono text-sm font-semibold" style={{ color: "#a1a1aa" }}>{a.result?.confidence ? `${a.result.confidence}%` : "—"}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-[11px]" style={{ color: "#52525b" }}>
                    {new Date(a.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="text-[11px] font-medium flex items-center gap-1 transition-colors duration-200" style={{ color: "#52525b" }}>
                    View Details
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
