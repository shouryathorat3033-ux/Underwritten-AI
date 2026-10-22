"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { StaggerGrid, StaggerItem, FadeUp } from "@/components/motion/StaggerReveal";
import MiniDonutChart from "@/components/ui/MiniDonutChart";
import ActivitySparkline from "@/components/ui/ActivitySparkline";
import UnderwritingComparison from "@/components/ui/UnderwritingComparison";

function AnimatedNumber({ value, color }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
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
      style={{ color, display: "inline-block" }}
      key={value}
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", damping: 20, stiffness: 120 }}
    >
      {isNumber ? display : value}
    </motion.span>
  );
}

const PC = { health: "#10b981", auto: "#f59e0b", life: "#a78bfa", property: "#60a5fa" };
const PL = { health: "Health", auto: "Auto", life: "Life", property: "Property" };

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
  const firstName = session?.user?.name?.split(" ")[0] || "User";

  /* ── Derived data ── */
  const pending = assessments.filter(a => a.status === "completed" && !a.underwriterAction?.action);
  const referred = assessments.filter(a => a.status === "referred");
  const acted = assessments.filter(a => a.underwriterAction?.action);
  const highRisk = pending.filter(a => a.result?.riskScore > 75);
  const thisWeek = assessments.filter(a => (Date.now() - new Date(a.createdAt).getTime()) < 7 * 86400000).length;

  /* ═══════ UNDERWRITER DASHBOARD ═══════ */
  if (isUW) {
    const queueItems = [...pending, ...referred].sort((a, b) => {
      const aScore = a.result?.riskScore || 0;
      const bScore = b.result?.riskScore || 0;
      return bScore - aScore; // highest risk first
    }).slice(0, 8);

    return (
      <div>
        {/* Header */}
        <FadeUp>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-sm mb-1" style={{ color: "#52525b" }}>{greeting}</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: "#fafafa" }}>{firstName}<span style={{ color: "#10b981" }}>.</span></h1>
              <p className="text-sm mt-1" style={{ color: "#71717a" }}>
                Underwriter Dashboard
                {!loading && <span style={{ color: "#52525b" }}> &middot; {thisWeek} new this week</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/dashboard/history" className="btn-primary no-underline text-xs py-2 px-4 inline-flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 104 0M9 5a2 2 0 004 0"/></svg>
                Full Review Queue
              </Link>
            </div>
          </div>
        </FadeUp>

        {/* Queue Stats — 4 cards */}
        <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" delay={0.1}>
          {[
            { label: "Pending Review", value: pending.length, color: "#f59e0b", icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></> },
            { label: "High Risk", value: highRisk.length, color: "#ef4444", icon: <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
            { label: "Referred", value: referred.length, color: "#a78bfa", icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></> },
            { label: "Decisions Made", value: acted.length, color: "#10b981", icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></> },
          ].map(s => (
            <StaggerItem key={s.label}>
              <div className="glass-card p-5 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none" style={{ background: `${s.color}08`, filter: "blur(20px)" }} />
                <div className="flex justify-between items-start relative">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: "#52525b" }}>{s.label}</p>
                    {loading ? <div className="h-7 w-12 rounded" style={{ background: "rgba(255,255,255,0.04)" }} /> : <AnimatedNumber value={s.value} color={s.color} />}
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}10` }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>

        {/* Middle row: Performance + Decision Breakdown */}
        <FadeUp delay={0.25}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Performance metrics */}
          <div className="lg:col-span-1 glass-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#52525b" }}>Performance</h3>
            <div className="space-y-4">
              {[
                { label: "Avg Risk Score", value: stats?.avgRisk ? Math.round(stats.avgRisk) : 0, max: 100, color: (stats?.avgRisk || 0) > 60 ? "#ef4444" : (stats?.avgRisk || 0) > 30 ? "#f59e0b" : "#10b981" },
                { label: "Approval Rate", value: stats?.approvalRate ? Math.round(stats.approvalRate) : 0, max: 100, color: "#10b981" },
                { label: "Avg Processing", value: stats?.avgTime ? `${(stats.avgTime / 1000).toFixed(1)}s` : "—", bar: false },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[11px] font-medium" style={{ color: "#71717a" }}>{m.label}</span>
                    <span className="text-xs font-mono font-semibold" style={{ color: m.color || "#a1a1aa" }}>{m.bar === false ? m.value : `${m.value}%`}</span>
                  </div>
                  {m.bar !== false && (
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: loading ? "0%" : `${Math.min(m.value, 100)}%`, background: m.color }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Decision breakdown + donut + sparkline */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#52525b" }}>Decision Breakdown</h3>
              <Link href="/admin/dashboard/analytics" className="text-[10px] no-underline font-medium" style={{ color: "#10b981" }}>Full Analytics &rarr;</Link>
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
                    { label: "Approved", count: stats?.approved || 0, total: stats?.total || 1, color: "#10b981" },
                    { label: "Referred", count: stats?.referred || 0, total: stats?.total || 1, color: "#f59e0b" },
                    { label: "Declined", count: stats?.declined || 0, total: stats?.total || 1, color: "#ef4444" },
                  ].map(d => {
                    const pct = d.total > 0 ? Math.round((d.count / d.total) * 100) : 0;
                    return (
                      <div key={d.label} className="rounded-xl p-3 text-center" style={{ background: `${d.color}06`, border: `1px solid ${d.color}12` }}>
                        <span className="font-mono text-xl font-bold" style={{ color: d.color }}>{loading ? "—" : d.count}</span>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#71717a" }}>{d.label}</p>
                        <p className="text-[9px] font-mono" style={{ color: "#52525b" }}>{pct}%</p>
                      </div>
                    );
                  })}
                </div>

                {/* Activity sparkline */}
                {!loading && assessments.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-[10px] font-medium shrink-0" style={{ color: "#52525b" }}>7-day activity</span>
                    <ActivitySparkline assessments={assessments} width={120} height={32} />
                  </div>
                )}
              </div>
            </div>

            {/* Policy type mini-breakdown */}
            <div className="flex gap-2 mt-4">
              {["health", "auto", "life", "property"].map(pt => {
                const count = assessments.filter(a => a.policyType === pt).length;
                return (
                  <div key={pt} className="flex-1 rounded-lg px-3 py-2 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-[10px] font-semibold uppercase" style={{ color: PC[pt] }}>{PL[pt]}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: "#a1a1aa" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </FadeUp>

        {/* Review Queue */}
        <FadeUp delay={0.35}>
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold" style={{ color: "#fafafa" }}>Review Queue</h2>
              {!loading && pending.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "#fbbf24" }}>{pending.length} pending</span>
              )}
            </div>
            <Link href="/admin/dashboard/history" className="text-xs no-underline font-medium inline-flex items-center gap-1" style={{ color: "#10b981" }}>
              View All <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {loading ? (
            <div className="p-6">{[1, 2, 3, 4].map(i => (<div key={i} className="flex gap-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}><div className="w-10 h-10 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }} /><div className="flex-1 space-y-2"><div className="h-3 w-32 rounded" style={{ background: "rgba(255,255,255,0.04)" }} /><div className="h-2 w-48 rounded" style={{ background: "rgba(255,255,255,0.02)" }} /></div></div>))}</div>
          ) : queueItems.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(16,185,129,0.06)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "#a1a1aa" }}>All caught up!</p>
              <p className="text-xs" style={{ color: "#52525b" }}>No pending cases to review right now</p>
            </div>
          ) : (
            <div>
              {queueItems.map((a, i) => {
                const color = PC[a.policyType] || "#10b981";
                const riskScore = a.result?.riskScore;
                const isHighRisk = riskScore > 75;
                const isReferred = a.status === "referred";
                return (
                  <Link key={a._id} href={`/admin/dashboard/assessment/${a._id}`} className="flex items-center gap-4 px-6 py-4 no-underline transition-all duration-200"
                    style={{ borderBottom: i < queueItems.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", display: "flex" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>

                    {/* Priority indicator */}
                    <div className="w-1 h-10 rounded-full shrink-0" style={{ background: isHighRisk ? "#ef4444" : isReferred ? "#a78bfa" : "rgba(255,255,255,0.06)" }} />

                    {/* Policy icon */}
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}12` }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        {a.policyType === "health" && <path d="M22 12h-4l-3 9L9 3l-3 9H2" />}
                        {a.policyType === "auto" && <><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h2a2 2 0 012 2v6" /></>}
                        {a.policyType === "life" && <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />}
                        {a.policyType === "property" && <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>}
                      </svg>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate" style={{ color: "#fafafa" }}>{a.applicant?.name || "—"}</p>
                        {isHighRisk && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>HIGH RISK</span>}
                        {isReferred && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>REFERRED</span>}
                      </div>
                      <p className="text-[11px] flex items-center gap-2" style={{ color: "#52525b" }}>
                        <span style={{ color: color }}>{PL[a.policyType] || "—"}</span>
                        <span>&middot;</span>
                        <span>{a.applicant?.email || "—"}</span>
                        <span>&middot;</span>
                        <span>{timeAgo(a.createdAt)}</span>
                      </p>
                    </div>

                    {/* Risk score */}
                    <div className="text-right shrink-0">
                      {riskScore != null ? (
                        <span className={`font-mono text-sm font-bold px-2.5 py-1 rounded-lg ${riskScore <= 35 ? "risk-low" : riskScore <= 55 ? "risk-medium" : "risk-high"}`}>{riskScore}</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", color: "#52525b" }}>—</span>
                      )}
                    </div>

                    {/* Decision badge */}
                    <div className="w-20 text-right shrink-0 hidden sm:block">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full" style={{
                        background: a.result?.decision === "approve" ? "rgba(16,185,129,0.1)" : a.result?.decision === "decline" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                        color: a.result?.decision === "approve" ? "#34d399" : a.result?.decision === "decline" ? "#f87171" : "#fbbf24",
                      }}>{a.result?.decision || "pending"}</span>
                    </div>

                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="M9 18l6-6-6-6" /></svg>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        </FadeUp>

        {/* Quick links */}
        <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6" delay={0.55}>
          {[
            { label: "Review Queue", desc: `${pending.length} pending`, href: "/admin/dashboard/history", color: "#10b981", icon: <><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><path d="M9 5a2 2 0 104 0M9 5a2 2 0 004 0" /></> },
            { label: "Analytics", desc: "Performance data", href: "/admin/dashboard/analytics", color: "#f59e0b", icon: <path d="M18 20V10M12 20V4M6 20v-6" /> },
            { label: "ML Fairness", desc: "Bias monitoring", href: "/admin/dashboard/fairness", color: "#a78bfa", icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
            { label: "Policies", desc: "Issued policies", href: "/admin/dashboard/policies", color: "#60a5fa", icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></> },
          ].map(a => (
            <StaggerItem key={a.label}>
              <Link href={a.href} className="group glass-card p-4 no-underline flex items-center gap-3 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: `${a.color}12` }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#fafafa" }}>{a.label}</p>
                  <p className="text-[11px]" style={{ color: "#52525b" }}>{a.desc}</p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    );
  }

  /* ═══════ APPLICANT DASHBOARD ═══════ */
  const recentList = assessments.slice(0, 6);
  const quickActions = [
    { label: "New Assessment", desc: "Start a new application", href: "/admin/dashboard/assess", color: "#10b981", icon: <path d="M12 5v14M5 12h14" /> },
    { label: "My Policies", desc: "View issued policies", href: "/admin/dashboard/policies", color: "#f59e0b", icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
    { label: "History", desc: "Past assessments", href: "/admin/dashboard/history", color: "#34d399", icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></> },
    { label: "Analytics", desc: "View metrics", href: "/admin/dashboard/analytics", color: "#a78bfa", icon: <path d="M18 20V10M12 20V4M6 20v-6" /> },
  ];

  return (
    <div>
      <FadeUp>
        <div className="mb-8">
          <p className="text-sm mb-1" style={{ color: "#52525b" }}>{greeting}</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: "#fafafa" }}>{firstName}<span style={{ color: "#10b981" }}>.</span></h1>
          <p className="text-sm mt-1" style={{ color: "#71717a" }}>
            Here&apos;s your underwriting overview
            {!loading && <span style={{ color: "#52525b" }}> &middot; {thisWeek} assessments this week</span>}
          </p>
        </div>
      </FadeUp>

      <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" delay={0.1}>
        {[
          { label: "Total Assessments", value: stats?.total || 0, color: "#10b981", icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></> },
          { label: "Avg Risk Score", value: stats?.avgRisk ? Math.round(stats.avgRisk) : 0, color: "#f59e0b", icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /> },
          { label: "Approval Rate", value: stats?.approvalRate ? `${Math.round(stats.approvalRate)}%` : "0%", color: "#10b981", icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></> },
          { label: "Avg Processing", value: stats?.avgTime ? `${(stats.avgTime / 1000).toFixed(1)}s` : "0s", color: "#f59e0b", icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></> },
        ].map(s => (
          <StaggerItem key={s.label}>
            <div className="glass-card p-5 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none" style={{ background: `${s.color}08`, filter: "blur(20px)" }} />
              <div className="flex justify-between items-start relative">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: "#52525b" }}>{s.label}</p>
                  {loading ? <div className="h-7 w-16 rounded" style={{ background: "rgba(255,255,255,0.04)" }} /> : <AnimatedNumber value={s.value} color={s.color} />}
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}10` }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                </div>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerGrid>

      <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6" delay={0.25}>
        {quickActions.map(a => (
          <StaggerItem key={a.label}>
            <Link href={a.href} className="group glass-card p-4 no-underline flex items-center gap-3 transition-all duration-300" style={{ display: "flex" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: `${a.color}12` }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#fafafa" }}>{a.label}</p>
                <p className="text-[11px]" style={{ color: "#52525b" }}>{a.desc}</p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGrid>

      <FadeUp delay={0.35}>
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <h2 className="text-base font-semibold" style={{ color: "#fafafa" }}>Recent Assessments</h2>
          <Link href="/admin/dashboard/history" className="text-xs no-underline font-medium inline-flex items-center gap-1" style={{ color: "#10b981" }}>View All <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></Link>
        </div>
        {loading ? (
          <div className="p-6">{[1, 2, 3, 4].map(i => (<div key={i} className="flex gap-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}><div className="w-8 h-8 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }} /><div className="flex-1 space-y-2"><div className="h-3 w-32 rounded" style={{ background: "rgba(255,255,255,0.04)" }} /><div className="h-2 w-48 rounded" style={{ background: "rgba(255,255,255,0.02)" }} /></div></div>))}</div>
        ) : recentList.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(16,185,129,0.06)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            </div>
            <p className="text-sm mb-1" style={{ color: "#a1a1aa" }}>No assessments yet</p>
            <p className="text-xs mb-4" style={{ color: "#52525b" }}>Get started by creating your first risk assessment</p>
            <Link href="/admin/dashboard/assess" className="btn-primary no-underline text-sm">Create Assessment</Link>
          </div>
        ) : (
          <div>
            {recentList.map((a, i) => {
              const color = PC[a.policyType] || "#10b981";
              return (
                <Link key={a._id} href={`/admin/dashboard/assessment/${a._id}`} className="flex items-center gap-4 px-6 py-3.5 no-underline transition-all duration-200"
                  style={{ borderBottom: i < recentList.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", display: "flex" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(16,185,129,0.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}12` }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      {a.policyType === "health" && <path d="M22 12h-4l-3 9L9 3l-3 9H2" />}
                      {a.policyType === "auto" && <><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h2a2 2 0 012 2v6" /></>}
                      {a.policyType === "life" && <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />}
                      {a.policyType === "property" && <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#fafafa" }}>{a.applicant?.name || "—"}</p>
                    <p className="text-[11px]" style={{ color: "#52525b" }}>{PL[a.policyType] || "—"} &middot; {timeAgo(a.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {a.result?.riskScore != null ? (
                      <span className={`font-mono text-sm font-bold px-2.5 py-1 rounded-lg ${a.result.riskScore <= 35 ? "risk-low" : a.result.riskScore <= 55 ? "risk-medium" : "risk-high"}`}>{a.result.riskScore}</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", color: "#52525b" }}>pending</span>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="M9 18l6-6-6-6" /></svg>
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
