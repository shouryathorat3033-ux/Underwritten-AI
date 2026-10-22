"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Waterfall chart showing how each risk factor contributes to the final score.
 * Starts from a base score, shows each factor's +/- contribution, and ends at
 * the final risk score.
 *
 * Props:
 *   factors   — [{ source, score, weight, impact }]
 *   riskScore — final composite risk score (0-100)
 *   baseScore — starting baseline (default 35)
 */

const COLORS = {
  increase: "#F43F5E", // Scientific rose (risk increase)
  decrease: "#3B82F6", // Electric cobalt (risk decrease/credit)
  neutral: "#64748B",  // Slate neutral
  text: "#FFFFFF",
  muted: "#94A3B8",
  dim: "#475569",
  bar_bg: "rgba(37,99,235,0.08)",
};

/* ── animation variants ── */
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.15 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", damping: 22, stiffness: 120, mass: 0.6 },
  },
};

const barVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { type: "spring", damping: 20, stiffness: 100, mass: 0.5 },
  },
};

/* ── helpers ── */
function formatContribution(val) {
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}`;
}

function contributionColor(val) {
  if (val > 0.05) return COLORS.increase;
  if (val < -0.05) return COLORS.decrease;
  return COLORS.neutral;
}

export default function RiskWaterfall({
  factors = [],
  riskScore = 50,
  baseScore = 35,
}) {
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  /* ── compute waterfall steps ── */
  const { steps, maxAbsContribution } = useMemo(() => {
    const totalDelta = riskScore - baseScore;

    // Check if ML backend provided actual per-prediction contributions
    const hasMLContribs = factors.some((f) => f.contribution != null && f.contribution !== 0);

    let rawContribs;
    if (hasMLContribs) {
      // Use actual tree-based contributions from the ML model (most accurate)
      rawContribs = factors.map((f) => f.contribution ?? 0);
    } else {
      // Fallback: estimate from impact direction + weight + deviation from neutral
      rawContribs = factors.map((f) => {
        const w = f.weight ?? 0;
        const score = f.score ?? 50;
        const deviation = Math.abs(score - 50) / 50;
        if (f.impact === "positive") return -w * Math.max(deviation, 0.15);
        if (f.impact === "negative") return w * Math.max(deviation, 0.15);
        return 0;
      });
    }

    // Scale contributions so they sum closer to the actual delta.
    // Only scale magnitudes — never flip signs.
    const rawSum = rawContribs.reduce((s, c) => s + c, 0);
    let scale = 1;
    if (Math.abs(rawSum) > 0.01 && Math.abs(totalDelta) > 0.01) {
      scale = totalDelta / rawSum;
      // If scale is negative it means the natural direction disagrees with the delta.
      // In that case, DON'T flip signs — just use magnitude scaling and let
      // the residual "Interaction Effects" row absorb the difference.
      if (scale < 0) {
        scale = Math.abs(totalDelta) / Math.abs(rawSum);
        scale = Math.min(scale, 3);
      } else {
        scale = Math.min(scale, 5);
      }
      scale = Math.max(scale, 0.1);
    }

    let running = baseScore;
    const factorSteps = factors.map((f, i) => {
      let contribution;
      if (hasMLContribs) {
        // With real ML contributions, scale to fit delta exactly
        contribution = rawContribs[i] * scale;
      } else {
        contribution = rawContribs[i] * scale;
      }
      if (Math.abs(contribution) < 0.05) contribution = 0;

      const start = running;
      running = Math.max(0, Math.min(100, running + contribution));

      return {
        label: f.source || "Unknown",
        contribution,
        start,
        end: running,
        impact: f.impact,
      };
    });

    // Residual row for unexplained gap
    const explained = running - baseScore;
    const residual = totalDelta - explained;
    if (Math.abs(residual) > 0.3) {
      const start = running;
      running = Math.max(0, Math.min(100, running + residual));
      factorSteps.push({
        label: "Interaction Effects",
        contribution: residual,
        start,
        end: running,
        impact: residual > 0 ? "negative" : "positive",
      });
    }

    const maxAbs = Math.max(1, ...factorSteps.map((s) => Math.abs(s.contribution)));

    return { steps: factorSteps, maxAbsContribution: maxAbs };
  }, [factors, riskScore, baseScore]);

  if (!factors.length) return null;

  /* ── scale: map 0-100 score range into a percentage of the bar track ── */
  const toPercent = (val) => Math.max(0, Math.min(100, val));

  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.text,
              letterSpacing: 0.2,
            }}
          >
            Risk Waterfall
          </h3>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 10,
              color: COLORS.dim,
            }}
          >
            How each factor contributes to the final score
          </p>
        </div>

        {/* legend */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <LegendDot color={COLORS.increase} label="Risk Increase" />
          <LegendDot color={COLORS.decrease} label="Risk Decrease" />
        </div>
      </div>

      {/* waterfall rows */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: "flex", flexDirection: "column", gap: 6 }}
      >
        {/* base score row */}
        <WaterfallRow
          label="Base Score"
          value={baseScore}
          contribution={null}
          barLeft={0}
          barWidth={toPercent(baseScore)}
          color={COLORS.neutral}
          isEndpoint
        />

        {/* factor rows */}
        {steps.map((step, i) => {
          const color = contributionColor(step.contribution);
          // Bar position: from the running start to the running end, mapped onto 0-100 track.
          const left = toPercent(Math.min(step.start, step.end));
          const width = Math.abs(step.end - step.start);

          return (
            <WaterfallRow
              key={`${step.label}-${i}`}
              label={step.label}
              value={step.end}
              contribution={step.contribution}
              barLeft={left}
              barWidth={Math.max(0.5, width)}
              color={color}
            />
          );
        })}

        {/* final score row */}
        <WaterfallRow
          label="Final Score"
          value={riskScore}
          contribution={null}
          barLeft={0}
          barWidth={toPercent(riskScore)}
          color={
            riskScore <= 35
              ? COLORS.decrease
              : riskScore <= 60
              ? "#f59e0b"
              : COLORS.increase
          }
          isEndpoint
        />
      </motion.div>

      {/* base -> final summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        style={{
          marginTop: 16,
          padding: "10px 14px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: 12,
          fontFamily: "monospace",
          color: COLORS.muted,
        }}
      >
        <span style={{ color: COLORS.neutral, fontWeight: 600 }}>
          {baseScore.toFixed(0)}
        </span>
        <svg
          width={20}
          height={10}
          viewBox="0 0 20 10"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <path
            d="M0 5h16M13 1l4 4-4 4"
            stroke={COLORS.dim}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            color:
              riskScore <= 35
                ? COLORS.decrease
                : riskScore <= 60
                ? "#f59e0b"
                : COLORS.increase,
            fontWeight: 700,
          }}
        >
          {riskScore.toFixed(1)}
        </span>
        <span style={{ color: COLORS.dim, fontSize: 10 }}>
          ({riskScore >= baseScore ? "+" : ""}
          {(riskScore - baseScore).toFixed(1)} net)
        </span>
      </motion.div>

      {/* Explain with AI button + response */}
      <div style={{ marginTop: 12 }}>
        {!aiExplanation && (
          <button
            onClick={async () => {
              setAiLoading(true);
              try {
                const context = `Risk Score: ${riskScore}/100 (base ${baseScore}). Factor breakdown:\n` +
                  steps.map(s => `- ${s.label}: ${s.contribution > 0 ? "+" : ""}${s.contribution.toFixed(1)} points (${s.impact} impact, running total: ${s.end.toFixed(1)})`).join("\n") +
                  `\nNet change: ${(riskScore - baseScore).toFixed(1)} points from base.`;
                const res = await fetch("/api/explain", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ section: "Risk Score Waterfall — Why This Score", context }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setAiExplanation(data.explanation);
                }
              } catch { /* ignore */ }
              setAiLoading(false);
            }}
            disabled={aiLoading}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 10, fontSize: 11, fontWeight: 600,
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)",
              color: "#10b981", cursor: aiLoading ? "wait" : "pointer", fontFamily: "inherit",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { if (!aiLoading) { e.currentTarget.style.background = "rgba(16,185,129,0.15)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.08)"; }}
          >
            {aiLoading ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 inline-block" style={{ animation: "spin-anim 1s linear infinite" }} />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z" /><path d="M10 22v-4M14 22v-4M10 18h4" />
              </svg>
            )}
            {aiLoading ? "Analyzing..." : "Explain with AI"}
          </button>
        )}
        <AnimatePresence>
          {aiExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginTop: 10, padding: "14px 16px", borderRadius: 12,
                background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z" /><path d="M10 22v-4M14 22v-4M10 18h4" />
                </svg>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Explanation</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: COLORS.muted }}>{aiExplanation}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Single waterfall row ── */
function WaterfallRow({
  label,
  value,
  contribution,
  barLeft,
  barWidth,
  color,
  isEndpoint = false,
}) {
  return (
    <motion.div
      variants={rowVariants}
      style={{
        display: "grid",
        gridTemplateColumns: "120px 52px 1fr 40px",
        alignItems: "center",
        gap: 8,
        padding: "5px 0",
        borderBottom: isEndpoint ? `1px solid rgba(255,255,255,0.06)` : "none",
      }}
    >
      {/* factor name */}
      <span
        style={{
          fontSize: 11,
          fontWeight: isEndpoint ? 700 : 500,
          color: isEndpoint ? COLORS.text : COLORS.muted,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={label}
      >
        {label}
      </span>

      {/* contribution badge */}
      <span
        style={{
          fontSize: 10,
          fontFamily: "monospace",
          fontWeight: 600,
          textAlign: "right",
          color: contribution != null ? color : "transparent",
        }}
      >
        {contribution != null ? formatContribution(contribution) : "--"}
      </span>

      {/* bar track */}
      <div
        style={{
          position: "relative",
          height: 18,
          borderRadius: 4,
          background: COLORS.bar_bg,
          overflow: "hidden",
        }}
      >
        {/* connector line showing the running cumulative position */}
        {!isEndpoint && (
          <div
            style={{
              position: "absolute",
              left: `${barLeft}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: `${COLORS.dim}50`,
              zIndex: 1,
            }}
          />
        )}

        {/* the actual bar */}
        <motion.div
          variants={barVariants}
          style={{
            position: "absolute",
            left: `${barLeft}%`,
            top: 2,
            bottom: 2,
            width: `${barWidth}%`,
            borderRadius: 3,
            background: isEndpoint
              ? `linear-gradient(90deg, ${color}40, ${color}90)`
              : `${color}cc`,
            transformOrigin: contribution != null && contribution < 0 ? "right" : "left",
            boxShadow: `0 0 8px ${color}30`,
          }}
        />
      </div>

      {/* cumulative value */}
      <span
        style={{
          fontSize: 10,
          fontFamily: "monospace",
          fontWeight: 700,
          color: isEndpoint ? color : COLORS.muted,
          textAlign: "right",
        }}
      >
        {value.toFixed(1)}
      </span>
    </motion.div>
  );
}

/* ── Legend dot ── */
function LegendDot({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: color,
          boxShadow: `0 0 6px ${color}40`,
        }}
      />
      <span style={{ fontSize: 9, color: COLORS.muted }}>{label}</span>
    </div>
  );
}
