"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FadeUp } from "@/components/motion/StaggerReveal";

const policyColors = {
  health: { bg: "rgba(37,99,235,0.12)", color: "#38bdf8", border: "rgba(59,130,246,0.25)", label: "Health" },
  auto: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.25)", label: "Auto" },
  life: { bg: "rgba(244,63,94,0.12)", color: "#f43f5e", border: "rgba(244,63,94,0.25)", label: "Life" },
  property: { bg: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "rgba(139,92,246,0.25)", label: "Property" },
};

const statusStyles = {
  accepted: { bg: "rgba(37,99,235,0.1)", color: "#38bdf8", border: "rgba(59,130,246,0.3)", label: "Active" },
  completed: { bg: "rgba(37,99,235,0.08)", color: "#3b82f6", border: "rgba(59,130,246,0.25)", label: "Approved" },
  referred: { bg: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "rgba(245,158,11,0.25)", label: "Under Review" },
  rejected: { bg: "rgba(244,63,94,0.1)", color: "#f43f5e", border: "rgba(244,63,94,0.25)", label: "Declined" },
  processing: { bg: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "rgba(56,189,248,0.25)", label: "Processing" },
  draft: { bg: "rgba(148,163,184,0.05)", color: "#64748b", border: "rgba(148,163,184,0.15)", label: "Draft" },
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
    <div className="space-y-6">
      <FadeUp>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/20 text-blue-400 bg-blue-500/5">[CONTRACT.VAULT // COVERAGE]</span>
            <span className="text-[10px] font-mono text-slate-400">POLICY_REGISTER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Active Underwritten Policies</h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Real-time coverage schedule, risk rating certificates, and active premium terms
          </p>
        </div>
        <Link href="/applicant/dashboard/assess" className="btn-primary no-underline text-xs font-mono uppercase tracking-wider inline-flex items-center gap-2 self-start sm:self-auto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          INTAKE_NEW_POLICY
        </Link>
      </div>
      </FadeUp>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Bound Policies", value: activePolicies, color: "#3b82f6", tag: "[ACTIVE.BOUND]", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
          { label: "Queued in Review", value: pendingReview, color: "#f59e0b", tag: "[QUEUE.AUDIT]", icon: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" },
          { label: "Declined Dockets", value: declined, color: "#f43f5e", tag: "[EXCEEDED]", icon: "M18 6L6 18M6 6l12 12" },
          { label: "Calculated Annual Premium", value: `₹${Math.round(totalPremium).toLocaleString("en-IN")}`, color: "#38bdf8", tag: "[PREMIUM.SUM]", icon: "M12 1v2M12 21v2M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
        ].map(s => (
          <div key={s.label} className="blueprint-card p-5 relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[9px] font-mono text-slate-400">{s.tag}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ background: `${s.color}15`, borderColor: `${s.color}35` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon}/></svg>
              </div>
            </div>
            <p className="font-mono text-2xl font-bold tracking-tight" style={{ color: s.color }}>{loading ? "—" : s.value}</p>
            <p className="text-[10px] font-mono uppercase text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "ALL POLICIES" },
          { id: "health", label: "HEALTH" },
          { id: "auto", label: "AUTO" },
          { id: "life", label: "LIFE" },
          { id: "property", label: "PROPERTY" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all border cursor-pointer"
            style={{
              background: filter === f.id ? "rgba(37,99,235,0.15)" : "rgba(10,15,29,0.7)",
              color: filter === f.id ? "#38bdf8" : "#94a3b8",
              borderColor: filter === f.id ? "rgba(59,130,246,0.35)" : "rgba(59,130,246,0.15)",
            }}>
            {f.label}
            {f.id !== "all" && (
              <span className="ml-1.5 text-[10px] text-blue-400">
                ({policies.filter(a => a.policyType === f.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Policy cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="blueprint-card p-6 animate-pulse" style={{ height: 180 }}>
              <div className="h-4 rounded bg-slate-800 w-2/5" />
              <div className="h-3 rounded mt-3 bg-slate-800/60 w-3/5" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="blueprint-card p-12 text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.75" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <p className="text-sm font-mono font-bold text-white mb-1">[NO_ACTIVE_POLICIES_IN_DOMAIN]</p>
          <p className="text-xs font-mono text-slate-400 mb-5">Initiate an actuarial calibration to bind your first policy</p>
          <Link href="/applicant/dashboard/assess" className="btn-primary no-underline text-xs font-mono uppercase tracking-wider inline-flex items-center gap-2">
            DISPATCH_APPLICATION
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(a => {
            const pt = policyColors[a.policyType] || policyColors.health;
            const st = statusStyles[a.status] || statusStyles.draft;
            const premium = a.result?.recommendedPremium;
            const premiumDisplay = premium ? `₹${premium.min?.toLocaleString("en-IN")} - ₹${premium.max?.toLocaleString("en-IN")}` : "—";

            return (
              <Link key={a._id} href={`/applicant/dashboard/assessment/${a._id}`} className="blueprint-card-interactive p-5 no-underline block"
                style={{ cursor: "pointer" }}>
                {/* Header row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border" style={{ background: pt.bg, borderColor: pt.border }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={pt.color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        {a.policyType === "health" && <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>}
                        {a.policyType === "auto" && <><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2"/></>}
                        {a.policyType === "life" && <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>}
                        {a.policyType === "property" && <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{pt.label} Insurance Docket</h3>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{a.applicant?.name || "ANONYMOUS_APPLICANT"}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border" style={{ background: st.bg, color: st.color, borderColor: st.border }}>
                    [{st.label.toUpperCase()}]
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 mb-3 font-mono">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Risk Score</span>
                    <span className="text-sm font-bold" style={{
                      color: (a.result?.riskScore || 0) <= 30 ? "#38bdf8" : (a.result?.riskScore || 0) <= 60 ? "#fbbf24" : "#f43f5e"
                    }}>{a.result?.riskScore ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Premium / Yr</span>
                    <span className="text-xs font-bold text-slate-300 truncate block">{premiumDisplay}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Confidence</span>
                    <span className="text-xs font-bold text-blue-400">{a.result?.confidence ? `${a.result.confidence}%` : "—"}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 font-mono text-[10px]">
                  <span className="text-slate-400">
                    SEALED: {new Date(a.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="text-blue-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    OPEN_DOSSIER
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
