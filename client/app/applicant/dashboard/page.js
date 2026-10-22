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

const PC = { health: "#3B82F6", auto: "#06B6D4", life: "#8B5CF6", property: "#EC4899" };
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
        {/* Header with technical badge */}
        <FadeUp>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-blue-300 border border-blue-500/20 bg-blue-500/10 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>[ACTUARIAL_COCKPIT · ACTIVE]</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {greeting}, {firstName}<span style={{ color: "#60A5FA" }}>.</span>
              </h1>
              <p className="text-xs font-mono mt-1 text-slate-400">
                Risk Engine Calibration &middot; Local Gemma 4 E4B
                {!loading && <span className="text-blue-400"> &middot; {thisWeek} intakes this cycle</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/applicant/dashboard/history" className="btn-primary no-underline text-xs font-mono py-2 px-4 inline-flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 104 0M9 5a2 2 0 004 0"/></svg>
                <span>OPEN REVIEW QUEUE</span>
              </Link>
            </div>
          </div>
        </FadeUp>

        {/* Queue Stats — 4 Ordivalabs Blueprint Cards */}
        <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" delay={0.1}>
          {[
            { label: "Pending Adjudication", value: pending.length, color: "#F59E0B", icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>, tag: "IN_QUEUE" },
            { label: "Elevated Risk", value: highRisk.length, color: "#F43F5E", icon: <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, tag: "CRITICAL" },
            { label: "Referred Cases", value: referred.length, color: "#8B5CF6", icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></>, tag: "ESCALATED" },
            { label: "Decisions Settled", value: acted.length, color: "#3B82F6", icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></>, tag: "EXECUTED" },
          ].map(s => (
            <StaggerItem key={s.label}>
              <div className="blueprint-card p-5 relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">{s.label}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${s.color}18`, color: s.color }}>{s.tag}</span>
                </div>
                <div className="flex justify-between items-end">
                  {loading ? <div className="h-7 w-12 rounded bg-white/5 animate-pulse" /> : <AnimatedNumber value={s.value} color={s.color} />}
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
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
          <div className="lg:col-span-1 blueprint-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">[ACTUARIAL_PRECISION]</h3>
              <span className="text-[10px] font-mono text-blue-400">BENCHMARK</span>
            </div>
            <div className="space-y-4 font-mono">
              {[
                { label: "Mean Risk Index", value: stats?.avgRisk ? Math.round(stats.avgRisk) : 0, max: 100, color: (stats?.avgRisk || 0) > 60 ? "#F43F5E" : (stats?.avgRisk || 0) > 30 ? "#F59E0B" : "#3B82F6" },
                { label: "Approval Ratio", value: stats?.approvalRate ? Math.round(stats.approvalRate) : 0, max: 100, color: "#3B82F6" },
                { label: "Inference Latency", value: stats?.avgTime ? `${(stats.avgTime / 1000).toFixed(1)}s` : "—", bar: false },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between mb-1.5 text-xs">
                    <span className="text-slate-400">{m.label}</span>
                    <span className="font-bold text-white">{m.bar === false ? m.value : `${m.value}%`}</span>
                  </div>
                  {m.bar !== false && (
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(37,99,235,0.15)" }}>
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: loading ? "0%" : `${Math.min(m.value, 100)}%`, background: m.color }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Decision breakdown + donut + sparkline */}
          <div className="lg:col-span-2 blueprint-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">[DECISION_VECTOR_DISTRIBUTION]</h3>
              <Link href="/admin/dashboard/analytics" className="text-xs font-mono no-underline text-blue-400 hover:text-blue-300">Detailed Telemetry &rarr;</Link>
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
                <div className="grid grid-cols-3 gap-3 mb-4 font-mono">
                  {[
                    { label: "Approved", count: stats?.approved || 0, total: stats?.total || 1, color: "#3B82F6" },
                    { label: "Referred", count: stats?.referred || 0, total: stats?.total || 1, color: "#F59E0B" },
                    { label: "Declined", count: stats?.declined || 0, total: stats?.total || 1, color: "#F43F5E" },
                  ].map(d => {
                    const pct = d.total > 0 ? Math.round((d.count / d.total) * 100) : 0;
                    return (
                      <div key={d.label} className="rounded-lg p-3 text-center" style={{ background: "rgba(10,15,29,0.7)", border: `1px solid ${d.color}25` }}>
                        <span className="text-xl font-bold font-mono" style={{ color: d.color }}>{loading ? "—" : d.count}</span>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 text-slate-400">{d.label}</p>
                        <p className="text-[9px] text-slate-500">{pct}%</p>
                      </div>
                    );
                  })}
                </div>

                {/* Activity sparkline */}
                {!loading && assessments.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(10,15,29,0.6)", border: "1px solid rgba(37,99,235,0.18)" }}>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">7-DAY INGESTION:</span>
                    <ActivitySparkline assessments={assessments} width={120} height={32} />
                  </div>
                )}
              </div>
            </div>

            {/* Policy type mini-breakdown */}
            <div className="flex gap-2 mt-4 font-mono">
              {["health", "auto", "life", "property"].map(pt => {
                const count = assessments.filter(a => a.policyType === pt).length;
                return (
                  <div key={pt} className="flex-1 rounded-lg px-3 py-2 flex items-center justify-between" style={{ background: "rgba(10,15,29,0.5)", border: "1px solid rgba(37,99,235,0.18)" }}>
                    <span className="text-[10px] font-semibold uppercase" style={{ color: PC[pt] }}>{PL[pt]}</span>
                    <span className="text-xs font-bold text-slate-300">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </FadeUp>

        {/* Review Queue */}
        <FadeUp delay={0.35}>
        <div className="blueprint-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(37,99,235,0.15)" }}>
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold font-mono text-white">[ACTUARIAL_REVIEW_QUEUE]</h2>
              {!loading && pending.length > 0 && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "#FBBF24", border: "1px solid rgba(245,158,11,0.3)" }}>
                  {pending.length} PENDING
                </span>
              )}
            </div>
            <Link href="/applicant/dashboard/history" className="text-xs font-mono no-underline text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
              <span>VIEW FULL QUEUE</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3, 4].map(i => (<div key={i} className="h-12 rounded bg-white/5 animate-pulse" />))}</div>
          ) : queueItems.length === 0 ? (
            <div className="text-center py-16 px-6 font-mono">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(96,165,250,0.3)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
              </div>
              <p className="text-xs text-slate-300 mb-1">Queue Synchronized</p>
              <p className="text-[11px] text-slate-500">Zero outstanding pending adjudications in current docket.</p>
            </div>
          ) : (
            <div>
              {queueItems.map((a, i) => {
                const color = PC[a.policyType] || "#3B82F6";
                const riskScore = a.result?.riskScore;
                const isHighRisk = riskScore > 75;
                const isReferred = a.status === "referred";
                return (
                  <Link key={a._id} href={`/applicant/dashboard/assessment/${a._id}`} className="flex items-center gap-4 px-6 py-4 no-underline transition-all duration-200"
                    style={{ borderBottom: i < queueItems.length - 1 ? "1px solid rgba(37,99,235,0.1)" : "none", display: "flex" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(37,99,235,0.06)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>

                    {/* Priority indicator */}
                    <div className="w-1 h-10 rounded-full shrink-0" style={{ background: isHighRisk ? "#F43F5E" : isReferred ? "#8B5CF6" : "rgba(37,99,235,0.3)" }} />

                    {/* Policy icon */}
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        {a.policyType === "health" && <path d="M22 12h-4l-3 9L9 3l-3 9H2" />}
                        {a.policyType === "auto" && <><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h2a2 2 0 012 2v6" /></>}
                        {a.policyType === "life" && <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />}
                        {a.policyType === "property" && <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>}
                      </svg>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 font-mono">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold truncate text-white">{a.applicant?.name || "—"}</p>
                        {isHighRisk && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">CRITICAL_RISK</span>}
                        {isReferred && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">REFERRED</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        <span style={{ color: color }}>{PL[a.policyType] || "—"}</span> &middot; {a.applicant?.email || "—"} &middot; {timeAgo(a.createdAt)}
                      </p>
                    </div>

                    {/* Risk score */}
                    <div className="text-right shrink-0 font-mono">
                      {riskScore != null ? (
                        <span className={`text-xs font-bold px-2 py-1 rounded ${riskScore <= 35 ? "text-blue-300 bg-blue-500/10 border border-blue-500/20" : riskScore <= 55 ? "text-amber-300 bg-amber-500/10 border border-amber-500/20" : "text-rose-400 bg-rose-500/10 border border-rose-500/20"}`}>
                          SCORE: {riskScore}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </div>

                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="M9 18l6-6-6-6" /></svg>
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
            { label: "Review Queue", desc: `${pending.length} pending`, href: "/applicant/dashboard/history", color: "#3B82F6", icon: <><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><path d="M9 5a2 2 0 104 0M9 5a2 2 0 004 0" /></> },
            { label: "Analytics", desc: "Telemetry data", href: "/applicant/dashboard/analytics", color: "#06B6D4", icon: <path d="M18 20V10M12 20V4M6 20v-6" /> },
            { label: "Fairness Core", desc: "Bias monitoring", href: "/applicant/dashboard/fairness", color: "#8B5CF6", icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
            { label: "Policies", desc: "Issued policies", href: "/applicant/dashboard/policies", color: "#EC4899", icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></> },
          ].map(a => (
            <StaggerItem key={a.label}>
              <Link href={a.href} className="blueprint-card-interactive p-4 no-underline flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${a.color}15`, border: `1px solid ${a.color}30` }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-white">{a.label}</p>
                  <p className="text-[10px] font-mono text-slate-400">{a.desc}</p>
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
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch("/api/profile").then(r => r.ok ? r.json() : null).then(d => { if (d) setProfile(d.profile); }).catch(() => {});
  }, []);

  const profileComplete = profile?.completeness || 0;
  const approved = assessments.filter(a => a.result?.decision === "approve").length;
  const pendingCount = assessments.filter(a => a.status === "completed" && !a.underwriterAction?.action).length;

  return (
    <div>
      <FadeUp>
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-blue-300 border border-blue-500/20 bg-blue-500/10 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>[PORTAL.APPLICANT_TELEMETRY]</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {greeting}, {firstName}<span style={{ color: "#60A5FA" }}>.</span>
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Continuous risk telemetry & automated actuarial underwriting dockets
          </p>
        </div>
      </FadeUp>

      {/* Profile completion warning */}
      {profile && profileComplete < 80 && (
        <FadeUp delay={0.05}>
          <Link href="/applicant/dashboard/profile" className="no-underline flex items-center gap-4 p-5 rounded-xl mb-6 transition-all duration-300 group blueprint-card"
            style={{
              borderColor: profileComplete < 40 ? "rgba(244,63,94,0.3)" : "rgba(245,158,11,0.3)",
            }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: profileComplete < 40 ? "rgba(244,63,94,0.15)" : "rgba(245,158,11,0.15)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={profileComplete < 40 ? "#FB7185" : "#FBBF24"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono font-bold text-white mb-0.5">
                TELEMETRY CALIBRATION: {profileComplete}% COMPLETE
              </p>
              <p className="text-[11px] font-mono text-slate-400">
                {profileComplete < 40
                  ? "Upload identity and financial verification documents to unlock algorithmic risk tier discounts."
                  : "Finalize secondary disclosures to calibrate lowest policy deductible."}
              </p>
              <div className="h-1.5 rounded-full mt-2.5 overflow-hidden" style={{ background: "rgba(37,99,235,0.15)", maxWidth: 300 }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{
                  width: `${profileComplete}%`,
                  background: profileComplete < 40 ? "#F43F5E" : profileComplete < 70 ? "#F59E0B" : "#3B82F6",
                }} />
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"><path d="M9 18l6-6-6-6" /></svg>
          </Link>
        </FadeUp>
      )}

      {/* Summary cards — Ordivalabs Blueprint Cards */}
      <StaggerGrid className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" delay={0.1}>
        <StaggerItem>
          <div className="blueprint-card p-5 relative overflow-hidden">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider mb-2 text-slate-400">[TOTAL_DOCKETS]</p>
            {loading ? <div className="h-7 w-12 rounded bg-white/5 animate-pulse" /> : <AnimatedNumber value={assessments.length} color="#3B82F6" />}
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="blueprint-card p-5 relative overflow-hidden">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider mb-2 text-slate-400">[ISSUED_POLICIES]</p>
            {loading ? <div className="h-7 w-12 rounded bg-white/5 animate-pulse" /> : <AnimatedNumber value={approved} color="#06B6D4" />}
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="blueprint-card p-5 relative overflow-hidden">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider mb-2 text-slate-400">[IN_VERIFICATION]</p>
            {loading ? <div className="h-7 w-12 rounded bg-white/5 animate-pulse" /> : <AnimatedNumber value={pendingCount} color="#F59E0B" />}
          </div>
        </StaggerItem>
      </StaggerGrid>

      {/* Quick actions */}
      <StaggerGrid className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6" delay={0.2}>
        {[
          { label: "New Assessment", desc: "Submit underwriting docket", href: "/applicant/dashboard/assess", color: "#3B82F6", icon: <path d="M12 5v14M5 12h14" /> },
          { label: "Verified Profile", desc: "Upload docs & proof of income", href: "/applicant/dashboard/profile", color: "#06B6D4", icon: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
          { label: "Active Coverage", desc: "Inspect current policy contracts", href: "/applicant/dashboard/policies", color: "#8B5CF6", icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
        ].map(a => (
          <StaggerItem key={a.label}>
            <Link href={a.href} className="blueprint-card-interactive p-5 no-underline flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${a.color}15`, border: `1px solid ${a.color}30` }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-white">{a.label}</p>
                <p className="text-[10px] font-mono text-slate-400">{a.desc}</p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGrid>

      {/* Recent assessments */}
      <FadeUp delay={0.3}>
      <div className="blueprint-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(37,99,235,0.15)" }}>
          <h2 className="text-xs font-mono font-bold text-white uppercase">[RECENT_UNDERWRITING_DOCKETS]</h2>
          <Link href="/applicant/dashboard/history" className="text-xs font-mono no-underline text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
            <span>VIEW ALL</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[1, 2, 3].map(i => (<div key={i} className="h-10 rounded bg-white/5 animate-pulse" />))}</div>
        ) : recentList.length === 0 ? (
          <div className="text-center py-16 px-6 font-mono">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(96,165,250,0.3)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            </div>
            <p className="text-xs text-slate-300 mb-1">No Underwriting Dockets Found</p>
            <p className="text-[11px] text-slate-500 mb-4">Initialize your first algorithmic assessment docket.</p>
            <Link href="/applicant/dashboard/assess" className="btn-primary no-underline text-xs font-mono px-4 py-2">INITIALIZE NOW</Link>
          </div>
        ) : (
          <div>
            {recentList.map((a, i) => {
              const color = PC[a.policyType] || "#3B82F6";
              return (
                <Link key={a._id} href={`/applicant/dashboard/assessment/${a._id}`} className="flex items-center gap-4 px-6 py-3.5 no-underline transition-all duration-200"
                  style={{ borderBottom: i < recentList.length - 1 ? "1px solid rgba(37,99,235,0.1)" : "none", display: "flex" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(37,99,235,0.06)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      {a.policyType === "health" && <path d="M22 12h-4l-3 9L9 3l-3 9H2" />}
                      {a.policyType === "auto" && <><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h2a2 2 0 012 2v6" /></>}
                      {a.policyType === "life" && <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />}
                      {a.policyType === "property" && <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 font-mono">
                    <p className="text-xs font-bold truncate text-white">{a.applicant?.name || "—"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{PL[a.policyType] || "—"} &middot; {timeAgo(a.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    {a.result?.riskScore != null ? (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded ${a.result.riskScore <= 35 ? "text-blue-300 bg-blue-500/10 border border-blue-500/20" : a.result.riskScore <= 55 ? "text-amber-300 bg-amber-500/10 border border-amber-500/20" : "text-rose-400 bg-rose-500/10 border border-rose-500/20"}`}>
                        SCORE: {a.result.riskScore}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">PENDING</span>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="M9 18l6-6-6-6" /></svg>
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
