"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { StaggerGrid, StaggerItem, FadeUp } from "@/components/motion/StaggerReveal";
import MiniDonutChart from "@/components/ui/MiniDonutChart";
import ActivitySparkline from "@/components/ui/ActivitySparkline";
import UnderwritingComparison from "@/components/ui/UnderwritingComparison";

function AnimatedNumber({ value, color }) {
  const [display, setDisplay] = useState(0);
  const parsed = parseInt(value);
  const isNumber = !isNaN(parsed);
  useEffect(() => {
    if (!isNumber) { setDisplay(value); return; }
    let current = 0; const end = parsed; const step = Math.max(1, Math.floor(end / 50));
    const timer = setInterval(() => { current += step; if (current >= end) { current = end; clearInterval(timer); } setDisplay(current); }, 16);
    return () => clearInterval(timer);
  }, [value, parsed, isNumber]);
  return (
    <motion.span
      className="font-mono text-2xl font-bold tabular-nums"
      style={{ color: color || "#3B82F6", display: "inline-block" }}
      key={value}
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", damping: 20, stiffness: 120 }}
    >
      {isNumber ? display : value}
    </motion.span>
  );
}

const POLICY_PALETTE = {
  health: { color: "#3B82F6", label: "Health", code: "HLTH" },
  auto: { color: "#06B6D4", label: "Auto", code: "AUTO" },
  life: { color: "#818CF8", label: "Life", code: "LIFE" },
  property: { color: "#38BDF8", label: "Property", code: "PROP" },
};

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isUW = role === "underwriter" || role === "admin";
  const [stats, setStats] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/analytics").then(r => r.json()),
      fetch("/api/assessments").then(r => r.json()),
    ]).then(([s, a]) => { setStats(s); setAssessments(a.assessments || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = session?.user?.name?.split(" ")[0] || "Underwriter";

  /* ── Derived data ── */
  const pending = assessments.filter(a => a.status === "completed" && !a.underwriterAction?.action);
  const referred = assessments.filter(a => a.status === "referred");
  const acted = assessments.filter(a => a.underwriterAction?.action);
  const highRisk = pending.filter(a => a.result?.riskScore > 75);
  const thisWeek = assessments.filter(a => (Date.now() - new Date(a.createdAt).getTime()) < 7 * 86400000).length;

  /* ═══════ UNDERWRITER COCKPIT VIEW ═══════ */
  if (isUW) {
    const queueItems = [...pending, ...referred].sort((a, b) => {
      const aScore = a.result?.riskScore || 0;
      const bScore = b.result?.riskScore || 0;
      return bScore - aScore;
    }).slice(0, 8);

    return (
      <div className="space-y-6">
        {/* Cockpit Banner */}
        <FadeUp>
          <div className="blueprint-card p-6 relative overflow-hidden flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div className="absolute top-0 right-0 w-80 h-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                  [UW.COCKPIT_V3]
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  ACTUARIAL_TELEMETRY_ONLINE
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {greeting}, {firstName}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                Underwriting command dashboard &middot; {pending.length} files awaiting risk clearance
                {!loading && <span className="text-zinc-500"> &middot; {thisWeek} new intakes this week</span>}
              </p>
            </div>

            <div className="relative z-10 flex gap-2">
              <Link
                href="/admin/dashboard/history"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide transition shadow-lg shadow-blue-500/20 no-underline"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 104 0M9 5a2 2 0 004 0" />
                </svg>
                Inspection Queue
              </Link>
            </div>
          </div>
        </FadeUp>

        {/* Queue Stats — 4 Blueprint Cards */}
        <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4" delay={0.08}>
          {[
            { label: "Pending Adjudication", code: "[QUEUE.01]", value: pending.length, color: "#3B82F6", icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></> },
            { label: "High Risk Threshold", code: "[ALERT.HIGH]", value: highRisk.length, color: "#F43F5E", icon: <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
            { label: "Referred for Investigation", code: "[AUDIT.REF]", value: referred.length, color: "#F59E0B", icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></> },
            { label: "Decisions Adjudicated", code: "[ACT.COMPL]", value: acted.length, color: "#10B981", icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></> },
          ].map(s => (
            <StaggerItem key={s.label}>
              <div className="blueprint-card p-5 relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
                      {s.code}
                    </span>
                    <p className="text-xs font-medium text-zinc-400 mb-2">{s.label}</p>
                    {loading ? (
                      <div className="h-7 w-12 rounded bg-zinc-800 animate-pulse" />
                    ) : (
                      <AnimatedNumber value={s.value} color={s.color} />
                    )}
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
        </StaggerGrid>

        {/* Middle row: Performance telemetry + Decision Breakdown */}
        <FadeUp delay={0.16}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Actuarial Performance Metrics */}
            <div className="lg:col-span-1 blueprint-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">[SYS.METRICS]</span>
                  <span className="font-mono text-[10px] text-blue-400">BENCHMARK: 99.4%</span>
                </div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-4">Portfolio Telemetry</h3>
                <div className="space-y-4">
                  {[
                    { label: "Portfolio Mean Risk", value: stats?.avgRisk ? Math.round(stats.avgRisk) : 0, max: 100, color: (stats?.avgRisk || 0) > 60 ? "#F43F5E" : (stats?.avgRisk || 0) > 30 ? "#F59E0B" : "#3B82F6" },
                    { label: "Automated Approval Ratio", value: stats?.approvalRate ? Math.round(stats.approvalRate) : 0, max: 100, color: "#10B981" },
                    { label: "Neural Decision Latency", value: stats?.avgTime ? `${(stats.avgTime / 1000).toFixed(1)}s` : "0.8s", bar: false, color: "#38BDF8" },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[11px] font-mono text-zinc-400">{m.label}</span>
                        <span className="text-xs font-mono font-bold" style={{ color: m.color || "#a1a1aa" }}>
                          {m.bar === false ? m.value : `${m.value}%`}
                        </span>
                      </div>
                      {m.bar !== false && (
                        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: loading ? "0%" : `${Math.min(m.value, 100)}%`, background: m.color }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80">
                <span className="font-mono text-[9px] text-zinc-500 uppercase block mb-1">AUDIT VERIFICATION</span>
                <p className="text-[11px] text-zinc-400 font-mono">IRDAI Fair Underwriting Guidelines: COMPLIANT</p>
              </div>
            </div>

            {/* Decision breakdown + donut + sparkline */}
            <div className="lg:col-span-2 blueprint-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">[DISTRIBUTION.VECTOR]</span>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Decision Allocation</h3>
                </div>
                <Link href="/admin/dashboard/analytics" className="font-mono text-[10px] text-blue-400 hover:underline">
                  Deep Analytics &rarr;
                </Link>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 items-center">
                {/* Donut chart */}
                {!loading && (stats?.approved || stats?.referred || stats?.declined) ? (
                  <div className="shrink-0">
                    <MiniDonutChart approved={stats?.approved || 0} referred={stats?.referred || 0} declined={stats?.declined || 0} size={130} />
                  </div>
                ) : null}

                {/* Stats + sparkline */}
                <div className="flex-1 w-full">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Approved", count: stats?.approved || 0, total: stats?.total || 1, color: "#10B981" },
                      { label: "Referred", count: stats?.referred || 0, total: stats?.total || 1, color: "#F59E0B" },
                      { label: "Declined", count: stats?.declined || 0, total: stats?.total || 1, color: "#F43F5E" },
                    ].map(d => {
                      const pct = d.total > 0 ? Math.round((d.count / d.total) * 100) : 0;
                      return (
                        <div key={d.label} className="bg-[#070A13] border border-zinc-800 p-3 rounded-lg text-center">
                          <span className="font-mono text-xl font-bold" style={{ color: d.color }}>{loading ? "—" : d.count}</span>
                          <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 mt-0.5">{d.label}</p>
                          <p className="font-mono text-[10px] text-zinc-500">{pct}%</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Activity sparkline */}
                  {!loading && assessments.length > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#070A13] border border-zinc-800">
                      <span className="font-mono text-[10px] text-zinc-500 uppercase">Temporal 7-Day Velocity</span>
                      <ActivitySparkline assessments={assessments} width={130} height={28} />
                    </div>
                  )}
                </div>
              </div>

              {/* Policy type mini-breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-zinc-800/80">
                {["health", "auto", "life", "property"].map(pt => {
                  const count = assessments.filter(a => a.policyType === pt).length;
                  const item = POLICY_PALETTE[pt] || { color: "#3B82F6", label: pt, code: pt };
                  return (
                    <div key={pt} className="bg-[#070A13] border border-zinc-800/80 rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold" style={{ color: item.color }}>{item.code}</span>
                      <span className="font-mono text-xs font-bold text-zinc-300">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Review Queue Docket */}
        <FadeUp delay={0.24}>
          <div className="blueprint-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                  [DOCKET.INTAKE_STREAM]
                </span>
                <h2 className="text-sm font-bold text-white tracking-wide">Pending Review Queue</h2>
                {!loading && pending.length > 0 && (
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {pending.length} UNCLEARED
                  </span>
                )}
              </div>
              <Link href="/admin/dashboard/history" className="font-mono text-xs text-blue-400 hover:underline flex items-center gap-1">
                Full Register <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-lg bg-zinc-900 animate-pulse" />
                ))}
              </div>
            ) : queueItems.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3 text-blue-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="font-mono text-[10px] text-zinc-500 block mb-1">[QUEUE.ZERO_PENDING]</span>
                <p className="text-sm font-semibold text-white">Underwriting Queue Cleared</p>
                <p className="text-xs text-zinc-500 mt-0.5">All active risk dossiers have been evaluated by the neural pipeline.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {queueItems.map((a) => {
                  const theme = POLICY_PALETTE[a.policyType] || { color: "#3B82F6", label: a.policyType, code: "POL" };
                  const riskScore = a.result?.riskScore;
                  const isHighRisk = riskScore > 75;
                  const isReferred = a.status === "referred";

                  return (
                    <Link
                      key={a._id}
                      href={`/admin/dashboard/assessment/${a._id}`}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-blue-600/[0.03] transition-colors no-underline group"
                    >
                      {/* Priority indicator bar */}
                      <div
                        className="w-1 h-9 rounded-full shrink-0"
                        style={{ background: isHighRisk ? "#F43F5E" : isReferred ? "#F59E0B" : "#3B82F6" }}
                      />

                      {/* Policy Badge */}
                      <span
                        className="font-mono text-[10px] font-bold px-2 py-1 rounded border tracking-wider shrink-0"
                        style={{ background: `${theme.color}10`, color: theme.color, borderColor: `${theme.color}30` }}
                      >
                        {theme.code}
                      </span>

                      {/* Applicant Metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                            {a.applicant?.name || "Anonymous Applicant"}
                          </p>
                          {isHighRisk && (
                            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/25">
                              HIGH_RISK
                            </span>
                          )}
                          {isReferred && (
                            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">
                              MANUAL_REFERRAL
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[10px] text-zinc-500 flex items-center gap-2 mt-0.5">
                          <span>Ref #{a._id?.slice(-6).toUpperCase()}</span>
                          <span>&middot;</span>
                          <span className="truncate">{a.applicant?.email || "--"}</span>
                          <span>&middot;</span>
                          <span>{timeAgo(a.createdAt)}</span>
                        </p>
                      </div>

                      {/* Risk Score */}
                      <div className="text-right shrink-0">
                        <span className="font-mono text-[9px] text-zinc-500 uppercase block">Score</span>
                        {riskScore != null ? (
                          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                            riskScore <= 35
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : riskScore <= 55
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}>
                            {riskScore}/100
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-zinc-500">PENDING</span>
                        )}
                      </div>

                      {/* Decision Badge */}
                      <div className="w-24 text-right shrink-0 hidden sm:block">
                        <span className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                          a.result?.decision === "approve"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                            : a.result?.decision === "decline"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                        }`}>
                          {a.result?.decision || "pending"}
                        </span>
                      </div>

                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2" strokeLinecap="round" className="shrink-0 group-hover:stroke-blue-400 transition-colors">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </FadeUp>

        {/* Quick Launchpad */}
        <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-3" delay={0.32}>
          {[
            { label: "Review Queue", desc: `${pending.length} pending files`, href: "/admin/dashboard/history", color: "#3B82F6", icon: <><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><path d="M9 5a2 2 0 104 0M9 5a2 2 0 004 0" /></> },
            { label: "Portfolio Analytics", desc: "Actuarial trends & yield", href: "/admin/dashboard/analytics", color: "#06B6D4", icon: <path d="M18 20V10M12 20V4M6 20v-6" /> },
            { label: "Fairness & Bias", desc: "Demographic parity audit", href: "/admin/dashboard/fairness", color: "#818CF8", icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
            { label: "Weight Matrix", desc: "Neural factor tuning", href: "/admin/dashboard/weights", color: "#38BDF8", icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /> },
          ].map(a => (
            <StaggerItem key={a.label}>
              <Link href={a.href} className="group blueprint-card p-4 no-underline flex items-center gap-3 hover:border-blue-500/40 transition">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                  style={{ background: `${a.color}10`, borderColor: `${a.color}30` }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    {a.icon}
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{a.label}</p>
                  <p className="font-mono text-[10px] text-zinc-500">{a.desc}</p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    );
  }

  /* ═══════ APPLICANT / STANDARD OVERVIEW VIEW ═══════ */
  const recentList = assessments.slice(0, 6);
  const quickActions = [
    { label: "New Assessment", desc: "Initiate risk assessment", href: "/admin/dashboard/assess", color: "#3B82F6", icon: <path d="M12 5v14M5 12h14" /> },
    { label: "Portfolio Policies", desc: "View issued dockets", href: "/admin/dashboard/policies", color: "#06B6D4", icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
    { label: "Audit History", desc: "Past underwriting records", href: "/admin/dashboard/history", color: "#818CF8", icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></> },
    { label: "Intelligence", desc: "Predictive loss ratios", href: "/admin/dashboard/analytics", color: "#38BDF8", icon: <path d="M18 20V10M12 20V4M6 20v-6" /> },
  ];

  return (
    <div className="space-y-6">
      <FadeUp>
        <div className="blueprint-card p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="absolute top-0 right-0 w-80 h-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px] tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                [ACT.OVERVIEW]
              </span>
              <span className="font-mono text-[10px] text-zinc-500">LIVE COCKPIT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {greeting}, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Actuarial underwriting overview {!loading && <span className="text-zinc-500">&middot; {thisWeek} assessments in rolling 7 days</span>}
            </p>
          </div>

          <div className="relative z-10">
            <Link
              href="/admin/dashboard/assess"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide transition shadow-lg shadow-blue-500/20 no-underline"
            >
              + Create Assessment
            </Link>
          </div>
        </div>
      </FadeUp>

      <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4" delay={0.08}>
        {[
          { label: "Total Risk Dossiers", code: "[VOL.TOTAL]", value: stats?.total || 0, color: "#3B82F6", icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></> },
          { label: "Mean Portfolio Risk", code: "[MEAN.RISK]", value: stats?.avgRisk ? Math.round(stats.avgRisk) : 0, color: "#06B6D4", icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /> },
          { label: "Autonomous Clearance", code: "[AUTO.APP]", value: stats?.approvalRate ? `${Math.round(stats.approvalRate)}%` : "0%", color: "#10B981", icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></> },
          { label: "Inference Latency", code: "[TIME.LAT]", value: stats?.avgTime ? `${(stats.avgTime / 1000).toFixed(1)}s` : "0.7s", color: "#38BDF8", icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></> },
        ].map(s => (
          <StaggerItem key={s.label}>
            <div className="blueprint-card p-5 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
                    {s.code}
                  </span>
                  <p className="text-xs font-medium text-zinc-400 mb-2">{s.label}</p>
                  {loading ? (
                    <div className="h-7 w-16 rounded bg-zinc-800 animate-pulse" />
                  ) : (
                    <AnimatedNumber value={s.value} color={s.color} />
                  )}
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center border"
                  style={{ background: `${s.color}10`, borderColor: `${s.color}30` }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                </div>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerGrid>

      <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-3" delay={0.16}>
        {quickActions.map(a => (
          <StaggerItem key={a.label}>
            <Link href={a.href} className="group blueprint-card p-4 no-underline flex items-center gap-3 hover:border-blue-500/40 transition">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border" style={{ background: `${a.color}10`, borderColor: `${a.color}30` }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{a.label}</p>
                <p className="font-mono text-[10px] text-zinc-500">{a.desc}</p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGrid>

      <FadeUp delay={0.24}>
        <div className="blueprint-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                [REGISTER.RECENT]
              </span>
              <h2 className="text-sm font-bold text-white">Recent Underwritten Dockets</h2>
            </div>
            <Link href="/admin/dashboard/history" className="font-mono text-xs text-blue-400 hover:underline flex items-center gap-1">
              View All <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 rounded-lg bg-zinc-900 animate-pulse" />
              ))}
            </div>
          ) : recentList.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3 text-blue-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="text-sm font-bold text-white mb-1">No Underwriting Dockets Registered</p>
              <p className="text-xs text-zinc-500 mb-4">Initialize your first actuarial risk evaluation.</p>
              <Link href="/admin/dashboard/assess" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs no-underline transition">
                Create Assessment
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {recentList.map((a) => {
                const theme = POLICY_PALETTE[a.policyType] || { color: "#3B82F6", label: a.policyType, code: "POL" };
                return (
                  <Link
                    key={a._id}
                    href={`/admin/dashboard/assessment/${a._id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-blue-600/[0.03] transition-colors no-underline group"
                  >
                    <span
                      className="font-mono text-[10px] font-bold px-2 py-1 rounded border tracking-wider shrink-0"
                      style={{ background: `${theme.color}10`, color: theme.color, borderColor: `${theme.color}30` }}
                    >
                      {theme.code}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                        {a.applicant?.name || "Anonymous Applicant"}
                      </p>
                      <p className="font-mono text-[10px] text-zinc-500">
                        {theme.label} &middot; Ref #{a._id?.slice(-6).toUpperCase()} &middot; {timeAgo(a.createdAt)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {a.result?.riskScore != null ? (
                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                          a.result.riskScore <= 35
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : a.result.riskScore <= 55
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}>
                          {a.result.riskScore}/100
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-zinc-500">PENDING</span>
                      )}
                    </div>

                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2" strokeLinecap="round" className="shrink-0 group-hover:stroke-blue-400 transition-colors">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </FadeUp>

      {/* AI vs Manual Comparison */}
      {stats && (
        <FadeUp>
          <div className="mt-8">
            <UnderwritingComparison stats={stats} />
          </div>
        </FadeUp>
      )}
    </div>
  );
}
