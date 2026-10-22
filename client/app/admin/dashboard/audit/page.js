"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { FadeUp } from "@/components/motion/StaggerReveal";

const TYPE_CONFIG = {
  assessment_created: { label: "Created", color: "#60a5fa", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)" },
  analysis_completed: { label: "Analyzed", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" },
  underwriter_decision: { label: "Decision", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" },
};

const FILTERS = [
  { key: "all", label: "All Events" },
  { key: "assessment_created", label: "Created" },
  { key: "analysis_completed", label: "Analyzed" },
  { key: "underwriter_decision", label: "Decisions" },
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

function StatCard({ label, value, icon, color }) {
  return (
    <div className="glass-card p-5" style={{ flex: 1, minWidth: 180 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#71717a" }}>{label}</span>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        </div>
      </div>
      <span className="font-mono text-2xl font-bold" style={{ color: "#fafafa" }}>{value}</span>
    </div>
  );
}

function SkeletonBlock({ width, height, style }) {
  return (
    <div style={{
      width, height, borderRadius: 8,
      background: "rgba(255,255,255,0.04)",
      animation: "pulse-anim 1.5s ease-in-out infinite",
      ...style,
    }} />
  );
}

function LoadingSkeleton() {
  return (
    <div>
      {/* Stat cards skeleton */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card p-5" style={{ flex: 1 }}>
            <SkeletonBlock width="60%" height={12} style={{ marginBottom: 16 }} />
            <SkeletonBlock width="40%" height={28} />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="glass-card p-6">
        <SkeletonBlock width="30%" height={14} style={{ marginBottom: 20 }} />
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <SkeletonBlock width="15%" height={14} />
            <SkeletonBlock width="10%" height={14} />
            <SkeletonBlock width="15%" height={14} />
            <SkeletonBlock width="35%" height={14} />
            <SkeletonBlock width="10%" height={14} />
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes pulse-anim {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
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
        setError(err.message || "Failed to load audit data");
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

  if (loading) {
    return (
      <div>
        <Breadcrumbs />
        <FadeUp>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#fafafa" }}>Audit Trail</h1>
          <p className="text-sm mb-6" style={{ color: "#71717a" }}>Loading audit events...</p>
        </FadeUp>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Breadcrumbs />
        <FadeUp>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#fafafa" }}>Audit Trail</h1>
          <p className="text-sm mb-6" style={{ color: "#71717a" }}>System activity log</p>
        </FadeUp>
        <div className="glass-card p-12 text-center">
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(239,68,68,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <p className="text-sm mb-3" style={{ color: "#a1a1aa" }}>{error}</p>
          <button onClick={fetchData} style={{
            background: "rgba(16,185,129,0.1)", color: "#10b981",
            border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10,
            padding: "8px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
          }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs />

      <FadeUp>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#fafafa" }}>Audit Trail</h1>
            <p className="text-sm mt-1" style={{ color: "#71717a" }}>
              System activity log
              <span style={{ color: "#52525b" }}> &middot; {events.length} events tracked</span>
            </p>
          </div>
          <button onClick={fetchData} style={{
            background: "rgba(255,255,255,0.04)", color: "#a1a1aa",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
            padding: "8px 16px", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
        </div>
      </FadeUp>

      {/* Stats Cards */}
      <FadeUp>
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard
            label="Total Events"
            value={stats.totalEvents}
            color="#10b981"
            icon="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6"
          />
          <StatCard
            label="Today's Events"
            value={stats.todayEvents}
            color="#60a5fa"
            icon="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
          />
          <StatCard
            label="Decisions Today"
            value={stats.decisionsToday}
            color="#f59e0b"
            icon="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3"
          />
        </div>
      </FadeUp>

      {/* Filters & Search */}
      <FadeUp>
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
                style={{ paddingLeft: 36, fontSize: 13, width: "100%" }}
              />
            </div>

            {/* Filter buttons */}
            <div style={{ display: "flex", gap: 6 }}>
              {FILTERS.map(f => {
                const active = filter === f.key;
                const typeConf = f.key !== "all" ? TYPE_CONFIG[f.key] : null;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{
                      background: active
                        ? (typeConf ? typeConf.bg : "rgba(16,185,129,0.1)")
                        : "rgba(255,255,255,0.03)",
                      color: active
                        ? (typeConf ? typeConf.color : "#10b981")
                        : "#71717a",
                      border: `1px solid ${active
                        ? (typeConf ? typeConf.border : "rgba(16,185,129,0.2)")
                        : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 10,
                      padding: "7px 14px",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result count */}
          {(filter !== "all" || search.trim()) && (
            <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#71717a" }}>
                Showing {filtered.length} of {events.length} events
              </span>
              <button
                onClick={() => { setFilter("all"); setSearch(""); }}
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
      </FadeUp>

      {/* Events Table */}
      <FadeUp>
        <div className="glass-card p-6">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "rgba(16,185,129,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6M12 18v-6M9 15h6" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: "#71717a" }}>
                {search || filter !== "all" ? "No events match your filters" : "No audit events recorded yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Time", "Event", "User", "Policy", "Details", ""].map(h => (
                      <th key={h} className="text-xs font-medium py-3 px-2" style={{ color: "#71717a" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => {
                    const tc = TYPE_CONFIG[event.type] || TYPE_CONFIG.assessment_created;
                    return (
                      <tr
                        key={event.id}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        {/* Timestamp */}
                        <td className="py-3 px-2" style={{ whiteSpace: "nowrap" }}>
                          <span className="text-xs font-mono" style={{ color: "#a1a1aa" }}>
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </td>

                        {/* Event type badge */}
                        <td className="py-3 px-2">
                          <span style={{
                            display: "inline-block",
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 10px",
                            borderRadius: 999,
                            background: tc.bg,
                            color: tc.color,
                            border: `1px solid ${tc.border}`,
                            letterSpacing: "0.02em",
                          }}>
                            {tc.label}
                          </span>
                        </td>

                        {/* User */}
                        <td className="py-3 px-2">
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: "50%",
                              background: event.user?.role === "system"
                                ? "rgba(16,185,129,0.12)"
                                : event.user?.role === "underwriter" || event.user?.role === "admin"
                                  ? "rgba(245,158,11,0.12)"
                                  : "rgba(59,130,246,0.12)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                stroke={
                                  event.user?.role === "system" ? "#10b981"
                                    : event.user?.role === "underwriter" || event.user?.role === "admin" ? "#f59e0b"
                                      : "#60a5fa"
                                }
                                strokeWidth="2" strokeLinecap="round">
                                {event.user?.role === "system"
                                  ? <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                  : <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>
                                }
                              </svg>
                            </div>
                            <div>
                              <div className="text-xs font-medium" style={{ color: "#fafafa" }}>{event.user?.name || "Unknown"}</div>
                              <div className="text-[10px]" style={{ color: "#52525b", textTransform: "capitalize" }}>{event.user?.role || ""}</div>
                            </div>
                          </div>
                        </td>

                        {/* Policy type */}
                        <td className="py-3 px-2">
                          {event.details?.policyType ? (
                            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{
                              background: event.details.policyType === "health" ? "rgba(16,185,129,0.1)"
                                : event.details.policyType === "auto" ? "rgba(245,158,11,0.1)"
                                  : event.details.policyType === "life" ? "rgba(139,92,246,0.1)"
                                    : "rgba(59,130,246,0.1)",
                              color: event.details.policyType === "health" ? "#34d399"
                                : event.details.policyType === "auto" ? "#fbbf24"
                                  : event.details.policyType === "life" ? "#a78bfa"
                                    : "#60a5fa",
                            }}>
                              {event.details.policyType}
                            </span>
                          ) : <span style={{ color: "#52525b" }}>--</span>}
                        </td>

                        {/* Details */}
                        <td className="py-3 px-2" style={{ maxWidth: 320 }}>
                          <div className="text-xs" style={{ color: "#a1a1aa" }}>
                            <span style={{ color: "#fafafa", fontWeight: 500 }}>{event.details?.applicantName}</span>
                            {event.details?.riskScore != null && (
                              <span className="font-mono" style={{
                                marginLeft: 8,
                                padding: "1px 6px",
                                borderRadius: 4,
                                fontSize: 10,
                                background: event.details.riskScore <= 35 ? "rgba(16,185,129,0.1)"
                                  : event.details.riskScore <= 55 ? "rgba(245,158,11,0.1)"
                                    : "rgba(239,68,68,0.1)",
                                color: event.details.riskScore <= 35 ? "#34d399"
                                  : event.details.riskScore <= 55 ? "#fbbf24"
                                    : "#f87171",
                              }}>
                                Risk: {event.details.riskScore}
                              </span>
                            )}
                            {event.details?.decision && (
                              <span style={{
                                marginLeft: 6,
                                fontSize: 10,
                                textTransform: "capitalize",
                                color: event.details.decision === "approve" || event.details.decision === "accepted"
                                  ? "#34d399"
                                  : event.details.decision === "decline" || event.details.decision === "rejected"
                                    ? "#f87171"
                                    : "#fbbf24",
                              }}>
                                {event.details.decision}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Link to assessment */}
                        <td className="py-3 px-2">
                          <Link
                            href={`/admin/dashboard/assessment/${event.assessmentId}`}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              color: "#71717a", fontSize: 11, textDecoration: "none",
                              padding: "4px 8px", borderRadius: 6,
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#10b981"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.2)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                          >
                            View
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
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
      </FadeUp>
    </div>
  );
}
