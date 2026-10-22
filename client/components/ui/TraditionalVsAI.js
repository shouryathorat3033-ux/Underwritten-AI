"use client";
import { motion } from "framer-motion";

/**
 * TraditionalVsAI — side-by-side comparison of traditional-only risk score
 * versus AI-enhanced score that includes alternative data sources.
 *
 * Props:
 *   traditionalScore — number|null (null when ML service unavailable)
 *   aiScore          — number (AI-enhanced risk score 0-100)
 *   factors          — [{ factor, impact, value, source, ... }]
 *   policyType       — "health" | "auto" | "life" | "property"
 *   premium          — { min: number, max: number }
 */

function getDecision(score) {
  if (score <= 55) return "approve";
  if (score <= 75) return "refer";
  return "decline";
}

function getDecisionLabel(decision) {
  if (decision === "approve") return "Approve";
  if (decision === "refer") return "Refer for Review";
  return "Decline";
}

function getDecisionStyle(decision) {
  if (decision === "approve")
    return { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", color: "#10b981" };
  if (decision === "refer")
    return { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", color: "#f59e0b" };
  return { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)", color: "#ef4444" };
}

function getScoreColor(score) {
  if (score <= 35) return "#10b981";
  if (score <= 55) return "#f59e0b";
  if (score <= 75) return "#ef4444";
  return "#dc2626";
}

function fmt(n) {
  if (n == null) return "0";
  return Number(n).toLocaleString("en-IN");
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", damping: 22, stiffness: 120, mass: 0.6 },
  },
};

const dividerVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", damping: 16, stiffness: 180, delay: 0.3 },
  },
};

const barVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 22, stiffness: 120, delay: 0.55 },
  },
};

export default function TraditionalVsAI({
  traditionalScore = null,
  aiScore,
  factors = [],
  policyType = "health",
  premium = { min: 0, max: 0 },
}) {
  const tradAvailable = traditionalScore != null;
  const tradDecision = tradAvailable ? getDecision(traditionalScore) : null;
  const aiDecision = getDecision(aiScore);
  const tradDecisionStyle = tradAvailable ? getDecisionStyle(tradDecision) : null;
  const aiDecisionStyle = getDecisionStyle(aiDecision);

  const delta = tradAvailable ? traditionalScore - aiScore : null;
  const improved = delta != null && delta > 0;
  const worsened = delta != null && delta < 0;

  // Count alternative data factors that contributed positively (lowered risk)
  const altDataSources = ["telematics", "behavioral", "lifestyle", "digital_footprint", "social", "wearable", "iot", "geolocation"];
  const altFactors = factors.filter((f) => {
    const src = (f.source || f.category || "").toLowerCase();
    return altDataSources.some((s) => src.includes(s));
  });
  const positiveAltFactors = altFactors.filter((f) => {
    const impact = typeof f.impact === "number" ? f.impact : parseFloat(f.impact);
    return !isNaN(impact) && impact < 0; // negative impact = reduces risk = positive
  });

  // Estimated savings from premium difference
  const estimatedSavings =
    tradAvailable && improved
      ? Math.round(((premium.max - premium.min) / 100) * delta * 12)
      : 0;

  return (
    <motion.div
      className="glass-card p-0 overflow-hidden relative"
      style={{ maxWidth: 700, margin: "0 auto", borderColor: "rgba(16,185,129,0.12)" }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Background glows */}
      <div
        className="absolute -top-24 -left-24 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: "rgba(239,68,68,0.05)", filter: "blur(70px)" }}
      />
      <div
        className="absolute -top-24 -right-24 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: "rgba(16,185,129,0.05)", filter: "blur(70px)" }}
      />

      {/* Header */}
      <div className="relative px-6 pt-6 pb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#fafafa" }}>
          <span className="inline-flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            Score Comparison
          </span>
        </h3>
        <p className="text-[11px] mt-1" style={{ color: "#52525b" }}>
          Traditional underwriting vs AI-enhanced with alternative data
        </p>
      </div>

      {/* Main comparison area */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-0 items-stretch">
          {/* LEFT — Traditional Only */}
          <motion.div
            className="rounded-l-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.12)",
              borderRight: "none",
            }}
            variants={cardVariants}
          >
            <p
              className="text-[9px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "#f87171" }}
            >
              Traditional Only
            </p>

            {tradAvailable ? (
              <>
                <p
                  className="font-mono text-4xl font-extrabold tabular-nums leading-none"
                  style={{ color: getScoreColor(traditionalScore) }}
                >
                  {traditionalScore}
                </p>
                <p className="text-[10px] font-mono mt-1 mb-3" style={{ color: "#71717a" }}>
                  / 100 risk
                </p>

                {/* Decision badge */}
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{
                    background: tradDecisionStyle.bg,
                    border: `1px solid ${tradDecisionStyle.border}`,
                    color: tradDecisionStyle.color,
                  }}
                >
                  {getDecisionLabel(tradDecision)}
                </span>
              </>
            ) : (
              <>
                <p
                  className="font-mono text-2xl font-extrabold tabular-nums leading-none"
                  style={{ color: "#52525b" }}
                >
                  N/A
                </p>
                <p className="text-[10px] mt-2 text-center leading-relaxed" style={{ color: "#71717a" }}>
                  ML service unavailable
                </p>
              </>
            )}

            <p
              className="text-[9px] mt-4 text-center leading-relaxed px-2"
              style={{ color: "#52525b" }}
            >
              Based on age, income, credit, medical history only
            </p>
          </motion.div>

          {/* CENTER — Divider with delta */}
          <motion.div
            className="flex flex-col items-center justify-center px-3 relative"
            style={{
              background: "rgba(255,255,255,0.02)",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              minWidth: 80,
            }}
            variants={dividerVariants}
          >
            {/* Vertical dashed line */}
            <div
              className="absolute top-3 bottom-3 left-1/2 -translate-x-1/2"
              style={{
                width: 1,
                background:
                  "repeating-linear-gradient(to bottom, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 4px, transparent 4px, transparent 8px)",
              }}
            />

            {delta != null ? (
              <div className="relative z-10 flex flex-col items-center">
                {/* Arrow */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                  style={{
                    background: improved
                      ? "rgba(16,185,129,0.15)"
                      : worsened
                      ? "rgba(239,68,68,0.15)"
                      : "rgba(255,255,255,0.06)",
                    border: `1px solid ${
                      improved
                        ? "rgba(16,185,129,0.3)"
                        : worsened
                        ? "rgba(239,68,68,0.3)"
                        : "rgba(255,255,255,0.1)"
                    }`,
                    boxShadow: improved
                      ? "0 0 16px rgba(16,185,129,0.2)"
                      : worsened
                      ? "0 0 16px rgba(239,68,68,0.2)"
                      : "none",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={improved ? "#10b981" : worsened ? "#ef4444" : "#71717a"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Delta value */}
                <p
                  className="font-mono text-sm font-extrabold tabular-nums"
                  style={{
                    color: improved ? "#10b981" : worsened ? "#ef4444" : "#71717a",
                  }}
                >
                  {improved ? `\u2212${delta}` : `+${Math.abs(delta)}`}
                </p>
                <p
                  className="text-[8px] font-bold uppercase tracking-wider"
                  style={{ color: improved ? "#10b981" : worsened ? "#ef4444" : "#71717a" }}
                >
                  points
                </p>

                <p
                  className="text-[7px] font-bold uppercase tracking-widest mt-2 text-center"
                  style={{ color: "#52525b" }}
                >
                  Alternative
                  <br />
                  data impact
                </p>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#71717a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                <p
                  className="text-[8px] font-bold uppercase tracking-wider text-center"
                  style={{ color: "#52525b" }}
                >
                  Alternative
                  <br />
                  data impact
                </p>
              </div>
            )}
          </motion.div>

          {/* RIGHT — AI-Enhanced */}
          <motion.div
            className="rounded-r-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              background: "rgba(16,185,129,0.06)",
              border: "1px solid rgba(16,185,129,0.12)",
              borderLeft: "none",
            }}
            variants={cardVariants}
          >
            {/* AI badge */}
            <span
              className="text-[7px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2"
              style={{
                background: "rgba(16,185,129,0.15)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.25)",
              }}
            >
              AI-Enhanced
            </span>

            <p
              className="font-mono text-4xl font-extrabold tabular-nums leading-none"
              style={{
                color: getScoreColor(aiScore),
                filter: `drop-shadow(0 0 12px ${getScoreColor(aiScore)}40)`,
              }}
            >
              {aiScore}
            </p>
            <p className="text-[10px] font-mono mt-1 mb-3" style={{ color: "#71717a" }}>
              / 100 risk
            </p>

            {/* Decision badge */}
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{
                background: aiDecisionStyle.bg,
                border: `1px solid ${aiDecisionStyle.border}`,
                color: aiDecisionStyle.color,
              }}
            >
              {getDecisionLabel(aiDecision)}
            </span>

            <p
              className="text-[9px] mt-4 text-center leading-relaxed px-2"
              style={{ color: "#52525b" }}
            >
              Includes telematics, behavioral, lifestyle, digital footprint
            </p>

            {/* Premium range */}
            {(premium.min > 0 || premium.max > 0) && (
              <div
                className="mt-3 px-3 py-1.5 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-[8px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#52525b" }}>
                  Est. Premium
                </p>
                <p className="font-mono text-xs font-bold" style={{ color: "#fafafa" }}>
                  {"\u20B9"}{fmt(premium.min)} - {"\u20B9"}{fmt(premium.max)}/yr
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Bottom insight bar */}
      <motion.div
        className="px-6 py-4 border-t"
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          background: "linear-gradient(90deg, rgba(239,68,68,0.03), rgba(16,185,129,0.06))",
        }}
        variants={barVariants}
      >
        {tradAvailable && improved && tradDecision !== aiDecision ? (
          <div className="flex items-start gap-2 mb-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "rgba(16,185,129,0.15)" }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: "#a1a1aa" }}>
              Alternative data{" "}
              <span className="font-bold" style={{ color: "#10b981" }}>
                SAVED
              </span>{" "}
              this applicant from{" "}
              <span
                className="font-bold uppercase text-[10px]"
                style={{ color: getDecisionStyle(tradDecision).color }}
              >
                {getDecisionLabel(tradDecision)}
              </span>{" "}
              to{" "}
              <span
                className="font-bold uppercase text-[10px]"
                style={{ color: getDecisionStyle(aiDecision).color }}
              >
                {getDecisionLabel(aiDecision)}
              </span>
              {estimatedSavings > 0 && (
                <span style={{ color: "#71717a" }}>
                  . Estimated savings:{" "}
                  <span className="font-mono font-bold" style={{ color: "#10b981" }}>
                    {"\u20B9"}{fmt(estimatedSavings)}/year
                  </span>
                </span>
              )}
            </p>
          </div>
        ) : tradAvailable && improved ? (
          <div className="flex items-start gap-2 mb-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "rgba(16,185,129,0.15)" }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: "#a1a1aa" }}>
              Alternative data reduced the risk score by{" "}
              <span className="font-mono font-bold" style={{ color: "#10b981" }}>
                {delta} points
              </span>
              , resulting in better premium rates.
            </p>
          </div>
        ) : null}

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#10b981", animation: "soft-pulse 2s ease-in-out infinite" }}
            />
            <span className="text-[9px] font-mono" style={{ color: "#52525b" }}>
              {positiveAltFactors.length} of {altFactors.length > 0 ? altFactors.length : factors.length}{" "}
              alternative data sources used
            </span>
          </div>
          <span className="text-[9px]" style={{ color: "#3f3f46" }}>
            |
          </span>
          <span className="text-[9px] font-mono" style={{ color: "#52525b" }}>
            {policyType.charAt(0).toUpperCase() + policyType.slice(1)} insurance
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
