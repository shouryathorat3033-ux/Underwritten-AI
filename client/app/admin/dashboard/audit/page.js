"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { FadeUp } from "@/components/motion/StaggerReveal";

const TYPE_CONFIG = {
  assessment_created: { label: "Intake Created", color: "#38BDF8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.25)" },
  analysis_completed: { label: "Neural Evaluated", color: "#3B82F6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
  underwriter_decision: { label: "Underwriter Action", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
};

const POLICY_PALETTE = {
  health: { bg: "rgba(59,130,246,0.1)", text: "#3B82F6", border: "rgba(59,130,246,0.25)", code: "HLTH" },
  auto: { bg: "rgba(6,182,212,0.1)", text: "#06B6D4", border: "rgba(6,182,212,0.25)", code: "AUTO" },
  life: { bg: "rgba(129,140,248,0.1)", text: "#818CF8", border: "rgba(129,140,248,0.25)", code: "LIFE" },
  property: { bg: "rgba(56,189,248,0.1)", text: "#38BDF8", border: "rgba(56,189,248,0.25)", code: "PROP" },
};

const FILTERS = [
  { key: "all", label: "All Audit Vectors" },
  { key: "assessment_created", label: "Intakes" },
  { key: "analysis_completed", label: "Neural Analyses" },
  { key: "underwriter_decision", label: "Adjudications" },
];

function formatTimestamp(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function AuditPage() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, todayEvents: 0, decisionsToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/audit")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => {
        setEvents(data.events || []);
        setStats(data.stats || { totalEvents: 0, todayEvents: 0, decisionsToday: 0 });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "Failed to synchronize audit stream");
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    let result = [...events];
    if (filter !== "all") {
      result = result.filter(e => e.type === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        (e.details?.applicantName || "").toLowerCase().includes(q) ||
        (e.user?.name || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [events, filter, search]);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <FadeUp>
        <div className="blueprint-card p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="absolute top-0 right-0 w-80 h-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px] tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                [AUDIT.IMMUTABLE_LOG]
              </span>
              <span className="font-mono text-[10px] text-zinc-500">IRDAI STATUTORY COMPLIANCE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Actuarial Audit Ledger
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Cryptographically timestamped telemetry log of all risk dossier creations, neural inferences, and underwriter determinations.
            </p>
          </div>

          <div className="relative z-10">
            <button
              onClick={fetchData}
              className="px-3.5 py-2 rounded-lg border border-zinc-800 bg-[#0A0F1D] text-zinc-300 hover:text-white text-xs font-mono transition flex items-center gap-2"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Sync Ledger
            </button>
          </div>
        </div>
      </FadeUp>

      {/* Telemetry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Logged Events", code: "[STAT.LIFETIME_EVENTS]", value: stats.totalEvents, color: "#3B82F6", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6" },
          { label: "Telemetry Logged Today", code: "[STAT.EVENTS_TODAY]", value: stats.todayEvents, color: "#06B6D4", icon: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" },
          { label: "Decisions Adjudicated Today", code: "[STAT.ACTIONS_TODAY]", value: stats.decisionsToday, color: "#10B981", icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" },
        ].map((s) => (
          <div key={s.label} className="blueprint-card p-5 group">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
                  {s.code}
                </span>
                <p className="text-xs font-medium text-zinc-400 mb-2">{s.label}</p>
                <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-white">{s.value}</p>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center border"
                style={{ background: `${s.color}10`, borderColor: `${s.color}30` }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="blueprint-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2" strokeLinecap="round"
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
            >
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by applicant name or underwriter identifier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#070A13] border border-zinc-800 focus:border-blue-500 text-white text-xs rounded-lg pl-9 p-2.5 outline-none font-mono"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                    active
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold"
                      : "bg-[#070A13] text-zinc-400 border border-zinc-800 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {(filter !== "all" || search.trim()) && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/80 font-mono text-[10px]">
            <span className="text-zinc-500">Showing {filtered.length} of {events.length} archived events</span>
            <button
              onClick={() => { setFilter("all"); setSearch(""); }}
              className="text-rose-400 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Events Table Docket */}
      <div className="blueprint-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 rounded bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3 text-blue-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="font-mono text-xs text-zinc-500">NO AUDIT RECORDS MATCH CURRENT FILTER PARAMETERS</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#070A13]/60 text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event Classification</th>
                  <th className="py-3 px-4">Principal Identity</th>
                  <th className="py-3 px-4">Line of Business</th>
                  <th className="py-3 px-4">Actuarial Payload</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtered.map((event) => {
                  const tc = TYPE_CONFIG[event.type] || TYPE_CONFIG.assessment_created;
                  const theme = POLICY_PALETTE[event.details?.policyType] || { code: "GEN", text: "#94A3B8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" };

                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-blue-600/[0.03] transition-colors"
                    >
                      <td className="py-3 px-4 text-zinc-400 whitespace-nowrap text-[11px]">
                        {formatTimestamp(event.timestamp)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className="font-bold text-[10px] px-2 py-0.5 rounded border inline-block"
                          style={{ background: tc.bg, color: tc.color, borderColor: tc.border }}
                        >
                          {tc.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-300 font-bold shrink-0">
                            {event.user?.name?.slice(0, 1) || "U"}
                          </div>
                          <div>
                            <div className="text-white text-xs font-semibold font-sans">{event.user?.name || "System Pipeline"}</div>
                            <div className="text-[10px] text-zinc-500 uppercase">{event.user?.role || "AUTONOMOUS"}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {event.details?.policyType ? (
                          <span
                            className="font-bold text-[10px] px-2 py-0.5 rounded border"
                            style={{ background: theme.bg, color: theme.text, borderColor: theme.border }}
                          >
                            {theme.code}
                          </span>
                        ) : (
                          <span className="text-zinc-600">--</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="truncate">
                          <span className="text-white font-sans font-medium">{event.details?.applicantName || "Anonymous"}</span>
                          {event.details?.riskScore != null && (
                            <span className={`ml-2 px-1.5 py-0.2 rounded text-[10px] border ${
                              event.details.riskScore <= 35
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : event.details.riskScore <= 55
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}>
                              Score: {event.details.riskScore}
                            </span>
                          )}
                          {event.details?.decision && (
                            <span className="ml-1.5 text-[10px] uppercase font-bold text-zinc-400">
                              [{event.details.decision}]
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/dashboard/assessment/${event.assessmentId}`}
                          className="px-2.5 py-1 rounded bg-[#0A0F1D] border border-zinc-800 hover:border-blue-500/40 text-blue-400 hover:text-white text-[10px] transition no-underline inline-flex items-center gap-1"
                        >
                          View &rarr;
                        </Link>
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
