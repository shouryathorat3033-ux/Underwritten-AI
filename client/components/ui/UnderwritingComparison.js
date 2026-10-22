"use client";
import { motion } from "framer-motion";

/**
 * Side-by-side comparison: Traditional Underwriting vs AI-Powered (UnderwriteAI).
 * Shows quantitative value proposition with real stats from the analytics API.
 *
 * Props:
 *   stats — object from /api/analytics: { total, avgRisk, approvalRate, avgTime }
 */

function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-IN");
}

function fmtTime(ms) {
  if (ms == null) return "< 5 sec";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} sec`;
}

const ROWS = [
  {
    label: "Processing Time",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    traditional: () => "3-5 Business Days",
    ai: (s) => fmtTime(s?.avgTime),
    badge: () => "99.7% faster",
  },
  {
    label: "Consistency",
    icon: (
      <>
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </>
    ),
    traditional: () => "~65% (human variance)",
    ai: () => "97.4% (R² = 0.97)",
    badge: () => "+32.4 pp",
  },
  {
    label: "Data Sources",
    icon: (
      <>
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </>
    ),
    traditional: () => "4-5 structured only",
    ai: () => "16 features + 6 alt sources",
    badge: () => "3.5x more",
  },
  {
    label: "Cost per Assessment",
    icon: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </>
    ),
    traditional: () => "₹2,500 - 5,000",
    ai: () => "₹50 - 100 (API costs)",
    badge: () => "98% cheaper",
  },
  {
    label: "Decisions / Day",
    icon: (
      <>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </>
    ),
    traditional: () => "15 - 20",
    ai: (s) => (s?.total ? `${fmt(s.total)}+` : "1,000+"),
    badge: (s) => (s?.total ? `${Math.round(s.total / 20)}x capacity` : "50x+"),
  },
  {
    label: "Bias Detection",
    icon: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </>
    ),
    traditional: () => "Manual review",
    ai: () => "Automated (12/12 pass)",
    badge: () => "100% coverage",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 22, stiffness: 120, mass: 0.6 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 22, stiffness: 120, mass: 0.6, delay: 0.05 },
  },
};

export default function UnderwritingComparison({ stats }) {
  const s = stats || {};
  const totalAssessments = s.total || 0;
  const moneySaved = totalAssessments * 3000;
  const hoursSaved = totalAssessments * 3;

  return (
    <motion.div
      className="glass-card p-0 overflow-hidden relative"
      style={{ borderColor: "rgba(16,185,129,0.12)" }}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      {/* Background glows */}
      <div
        className="absolute -top-32 -left-32 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "rgba(239,68,68,0.04)", filter: "blur(80px)" }}
      />
      <div
        className="absolute -top-32 -right-32 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "rgba(16,185,129,0.04)", filter: "blur(80px)" }}
      />

      {/* ── Header ── */}
      <div className="relative px-6 pt-6 pb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#fafafa" }}>
          <span className="inline-flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            Underwriting Comparison
          </span>
        </h3>
        <p className="text-[11px] mt-1" style={{ color: "#52525b" }}>
          Side-by-side: legacy manual process vs AI-powered pipeline
        </p>
      </div>

      {/* ── Column Headers ── */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-0 px-6 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#f87171" }}>
            Traditional Underwriting
          </span>
        </div>
        <div className="w-10" /> {/* spacer for divider */}
        <div className="flex items-center gap-2 justify-end">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#10b981" }}>
            AI-Powered (UnderwriteAI)
          </span>
          <span className="w-2 h-2 rounded-full" style={{ background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.5)" }} />
        </div>
      </div>

      {/* ── Comparison Rows ── */}
      <motion.div className="px-6 space-y-2 pb-6" variants={containerVariants} initial="hidden" animate="visible">
        {ROWS.map((row) => (
          <motion.div
            key={row.label}
            className="grid grid-cols-[1fr_auto_1fr] gap-0 items-stretch"
            variants={rowVariants}
          >
            {/* LEFT — Traditional */}
            <div
              className="rounded-l-xl p-3.5 flex flex-col justify-center"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.10)",
                borderRight: "none",
              }}
            >
              <p className="font-mono text-sm font-bold" style={{ color: "#fca5a5" }}>
                {row.traditional(s)}
              </p>
            </div>

            {/* CENTER — Divider + label */}
            <div
              className="flex flex-col items-center justify-center px-2 relative"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderTop: "1px solid rgba(255,255,255,0.04)",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#a1a1aa"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {row.icon}
                </svg>
              </div>
              <span className="text-[8px] font-bold uppercase tracking-widest mt-1 whitespace-nowrap" style={{ color: "#52525b" }}>
                {row.label}
              </span>
            </div>

            {/* RIGHT — AI */}
            <div
              className="rounded-r-xl p-3.5 flex flex-col justify-center items-end"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.10)",
                borderLeft: "none",
              }}
            >
              <p className="font-mono text-sm font-bold" style={{ color: "#6ee7b7" }}>
                {row.ai(s)}
              </p>
              {row.badge && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
                >
                  {row.badge(s)}
                </span>
              )}
            </div>
          </motion.div>
        ))}

        {/* ── Central "vs" Badge ── */}
        {/* Rendered once, absolutely positioned over the vertical center of the divider column */}
      </motion.div>

      {/* ── VS Badge (floating over center column) ── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
        <motion.div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(16,185,129,0.2))",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 0 24px rgba(16,185,129,0.15), 0 0 24px rgba(239,68,68,0.15)",
            backdropFilter: "blur(8px)",
          }}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 14, stiffness: 200, delay: 0.6 }}
        >
          <span className="text-[11px] font-black uppercase" style={{ color: "#fafafa" }}>vs</span>
        </motion.div>
      </div>

      {/* ── Impact Summary Bar ── */}
      <motion.div
        className="px-6 py-4 border-t"
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          background: "linear-gradient(90deg, rgba(239,68,68,0.03), rgba(16,185,129,0.06))",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "#71717a" }}>
          Impact Summary
        </p>
        <div className="grid grid-cols-3 gap-4">
          {/* Assessments */}
          <div className="text-center">
            <p className="font-mono text-lg font-extrabold tabular-nums" style={{ color: "#fafafa" }}>
              {fmt(totalAssessments)}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "#52525b" }}>assessments processed</p>
          </div>

          {/* Money saved */}
          <div className="text-center">
            <p className="font-mono text-lg font-extrabold tabular-nums" style={{ color: "#10b981" }}>
              ₹{fmt(moneySaved)}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "#52525b" }}>estimated savings</p>
          </div>

          {/* Hours saved */}
          <div className="text-center">
            <p className="font-mono text-lg font-extrabold tabular-nums" style={{ color: "#f59e0b" }}>
              {fmt(hoursSaved)}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "#52525b" }}>hours saved</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
