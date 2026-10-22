"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Stage definitions                                                  */
/* ------------------------------------------------------------------ */
const STAGES = [
  {
    key: "uploading",
    label: "Document Upload",
    icon: (
      <>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <polyline points="9 15 12 12 15 15" />
      </>
    ),
  },
  {
    key: "extracting",
    label: "AI Extraction",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="7" y1="8" x2="17" y2="8" />
        <line x1="7" y1="12" x2="13" y2="12" />
        <line x1="7" y1="16" x2="10" y2="16" />
        <circle cx="17" cy="15" r="2.5" />
        <line x1="19" y1="17" x2="21" y2="19" />
      </>
    ),
  },
  {
    key: "engineering",
    label: "Feature Engineering",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </>
    ),
  },
  {
    key: "predicting",
    label: "ML Prediction",
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
        <line x1="9" y1="2" x2="9" y2="4" />
        <line x1="15" y1="2" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="22" />
        <line x1="15" y1="20" x2="15" y2="22" />
        <line x1="2" y1="9" x2="4" y2="9" />
        <line x1="2" y1="15" x2="4" y2="15" />
        <line x1="20" y1="9" x2="22" y2="9" />
        <line x1="20" y1="15" x2="22" y2="15" />
      </>
    ),
  },
  {
    key: "explaining",
    label: "LLM Explanation",
    icon: (
      <>
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <line x1="8" y1="9" x2="16" y2="9" />
        <line x1="8" y1="13" x2="13" y2="13" />
      </>
    ),
  },
  {
    key: "complete",
    label: "Decision Ready",
    icon: (
      <>
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </>
    ),
  },
];

const STAGE_ORDER = STAGES.map((s) => s.key);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function stageStatus(stageKey, currentStage) {
  if (currentStage === "idle") return "future";
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const thisIdx = STAGE_ORDER.indexOf(stageKey);
  if (thisIdx < currentIdx) return "completed";
  if (thisIdx === currentIdx) return "active";
  return "future";
}

function scoreColor(score) {
  if (score <= 35) return "#10b981";
  if (score <= 55) return "#f59e0b";
  return "#ef4444";
}

/* ------------------------------------------------------------------ */
/*  Inline keyframes (injected once)                                   */
/* ------------------------------------------------------------------ */
const KEYFRAMES = `
@keyframes pipeline-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.45); }
  50% { box-shadow: 0 0 20px 6px rgba(16,185,129,0.25); }
}
@keyframes pipeline-spin {
  to { transform: rotate(360deg); }
}
@keyframes pipeline-particle {
  0% { offset-distance: 0%; opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0; }
}
@keyframes pipeline-flow {
  to { stroke-dashoffset: -12; }
}
`;

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Spinner shown while a stage is active */
function Spinner() {
  return (
    <div
      style={{
        width: 16,
        height: 16,
        border: "2px solid rgba(16,185,129,0.25)",
        borderTopColor: "#10b981",
        borderRadius: "50%",
        animation: "pipeline-spin 0.8s linear infinite",
      }}
    />
  );
}

/** Checkmark shown when a stage is completed */
function CheckMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/** Connector line between stages (desktop: horizontal, mobile: omitted because grid) */
function Connector({ status }) {
  const isActive = status === "active";
  const isCompleted = status === "completed";
  const lineColor = isCompleted ? "rgba(16,185,129,0.5)" : isActive ? "rgba(16,185,129,0.35)" : "rgba(63,63,70,0.4)";

  return (
    <div
      className="hidden lg:flex"
      style={{
        width: 48,
        minWidth: 32,
        height: 2,
        position: "relative",
        alignSelf: "center",
        flexShrink: 1,
      }}
    >
      {/* Base line */}
      <svg width="100%" height="8" style={{ position: "absolute", top: -3, left: 0 }}>
        <line x1="0" y1="4" x2="100%" y2="4" stroke={lineColor} strokeWidth="2" strokeDasharray={isActive || isCompleted ? "none" : "4 4"} />
        {(isActive || isCompleted) && (
          <line
            x1="0"
            y1="4"
            x2="100%"
            y2="4"
            stroke="rgba(16,185,129,0.6)"
            strokeWidth="2"
            strokeDasharray="6 6"
            style={{ animation: isActive ? "pipeline-flow 0.6s linear infinite" : "none" }}
          />
        )}
      </svg>

      {/* Flowing particles */}
      {isActive && (
        <>
          {[0, 0.33, 0.66].map((delay) => (
            <div
              key={delay}
              style={{
                position: "absolute",
                top: -2,
                left: 0,
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 6px #10b981",
                offsetPath: `path("M 0 3 L 48 3")`,
                animation: `pipeline-particle 1.2s ${delay}s linear infinite`,
              }}
            />
          ))}
        </>
      )}

      {/* Arrow head */}
      <svg width="8" height="8" viewBox="0 0 8 8" style={{ position: "absolute", right: -3, top: -3 }}>
        <path d="M0 0 L8 4 L0 8" fill={isCompleted ? "rgba(16,185,129,0.5)" : isActive ? "rgba(16,185,129,0.35)" : "rgba(63,63,70,0.3)"} />
      </svg>
    </div>
  );
}

/** Single pipeline stage card */
function StageCard({ stage, status, index }) {
  const isFuture = status === "future";
  const isActive = status === "active";
  const isCompleted = status === "completed";

  const borderColor = isActive
    ? "rgba(16,185,129,0.5)"
    : isCompleted
      ? "rgba(16,185,129,0.25)"
      : "rgba(63,63,70,0.3)";

  const bgColor = isActive
    ? "rgba(16,185,129,0.06)"
    : isCompleted
      ? "rgba(16,185,129,0.03)"
      : "rgba(24,24,27,0.6)";

  const iconStroke = isActive
    ? "#10b981"
    : isCompleted
      ? "#10b981"
      : "#52525b";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "16px 12px",
        borderRadius: 14,
        border: `1px solid ${borderColor}`,
        background: bgColor,
        backdropFilter: "blur(12px)",
        minWidth: 110,
        flex: "1 1 0",
        opacity: isFuture ? 0.4 : 1,
        transition: "border-color 0.4s, background 0.4s, opacity 0.4s",
        animation: isActive ? "pipeline-pulse 2s ease-in-out infinite" : "none",
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isActive
            ? "rgba(16,185,129,0.12)"
            : isCompleted
              ? "rgba(16,185,129,0.08)"
              : "rgba(39,39,42,0.5)",
          transition: "background 0.4s",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconStroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "stroke 0.4s" }}
        >
          {stage.icon}
        </svg>
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: isActive ? "#10b981" : isCompleted ? "#a7f3d0" : "#71717a",
          textAlign: "center",
          lineHeight: 1.3,
          letterSpacing: "0.02em",
          transition: "color 0.4s",
        }}
      >
        {stage.label}
      </span>

      {/* Status indicator */}
      <div style={{ height: 16, display: "flex", alignItems: "center" }}>
        {isActive && <Spinner />}
        {isCompleted && <CheckMark />}
        {isFuture && (
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "rgba(63,63,70,0.5)",
            }}
          />
        )}
      </div>

      {/* Step number badge */}
      <div
        style={{
          position: "absolute",
          top: -8,
          right: -8,
          width: 20,
          height: 20,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          fontWeight: 700,
          color: isActive || isCompleted ? "#10b981" : "#52525b",
          background: isActive
            ? "rgba(16,185,129,0.15)"
            : isCompleted
              ? "rgba(16,185,129,0.1)"
              : "rgba(39,39,42,0.7)",
          border: `1px solid ${isActive ? "rgba(16,185,129,0.3)" : isCompleted ? "rgba(16,185,129,0.2)" : "rgba(63,63,70,0.3)"}`,
        }}
      >
        {index + 1}
      </div>
    </motion.div>
  );
}

/** Result badges shown when pipeline completes */
function ResultPanel({ result }) {
  if (!result) return null;

  const sc = scoreColor(result.riskScore ?? 50);
  const decision = result.decision ?? "Pending";
  const time = result.processingTime ?? "—";
  const factors = result.factors ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginTop: 16,
        padding: "12px 0",
      }}
    >
      {/* Processing time */}
      <Badge color="#60a5fa">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Assessed in {time}ms
      </Badge>

      {/* Risk score */}
      <Badge color={sc}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={sc} strokeWidth="2" strokeLinecap="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Risk: {result.riskScore ?? "—"}/100
      </Badge>

      {/* Decision */}
      <Badge color={decision === "Approved" ? "#10b981" : decision === "Denied" ? "#ef4444" : "#f59e0b"}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {decision === "Approved" ? (
            <polyline points="20 6 9 17 4 12" />
          ) : decision === "Denied" ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </>
          )}
        </svg>
        {decision}
      </Badge>

      {/* Top factors */}
      {factors.slice(0, 3).map((factor, i) => (
        <Badge key={i} color="#a78bfa">
          {typeof factor === "string" ? factor : factor.name ?? factor.label ?? JSON.stringify(factor)}
        </Badge>
      ))}
    </motion.div>
  );
}

function Badge({ color, children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 12px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color: color,
        background: `${color}12`,
        border: `1px solid ${color}25`,
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function PipelineVisualization({ stage = "idle", result = null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute connector statuses (connector i sits between stage i and i+1)
  const connectorStatuses = useMemo(() => {
    return STAGES.slice(0, -1).map((_, i) => {
      const leftStatus = stageStatus(STAGES[i].key, stage);
      const rightStatus = stageStatus(STAGES[i + 1].key, stage);
      if (leftStatus === "completed" && (rightStatus === "completed" || rightStatus === "active"))
        return "completed";
      if (leftStatus === "active" || (leftStatus === "completed" && rightStatus === "active"))
        return "active";
      return "future";
    });
  }, [stage]);

  if (!mounted) return null;

  return (
    <>
      {/* Inject keyframes once */}
      <style>{KEYFRAMES}</style>

      <div
        style={{
          position: "relative",
          width: "100%",
          padding: 24,
          borderRadius: 16,
          background: "#09090b",
          border: "1px solid rgba(63,63,70,0.25)",
          backdropFilter: "blur(16px)",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow */}
        {stage !== "idle" && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "60%",
              height: "60%",
              borderRadius: "50%",
              background: "rgba(16,185,129,0.04)",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#fafafa",
            }}
          >
            Assessment Pipeline
          </span>
          {stage !== "idle" && stage !== "complete" && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#10b981",
                marginLeft: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10b981",
                  animation: "pipeline-pulse 1.5s ease-in-out infinite",
                }}
              />
              Processing
            </span>
          )}
          {stage === "complete" && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#10b981",
                marginLeft: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <CheckMark />
              Complete
            </span>
          )}
        </div>

        {/* Pipeline stages — desktop: horizontal row with connectors, mobile: 2x3 grid */}
        {/* Desktop view */}
        <div
          className="hidden lg:flex"
          style={{
            alignItems: "stretch",
            justifyContent: "center",
            gap: 0,
          }}
        >
          {STAGES.map((s, i) => {
            const status = stageStatus(s.key, stage);
            return (
              <div key={s.key} style={{ display: "flex", alignItems: "center" }}>
                <StageCard stage={s} status={status} index={i} />
                {i < STAGES.length - 1 && <Connector status={connectorStatuses[i]} />}
              </div>
            );
          })}
        </div>

        {/* Mobile / tablet view — 2x3 grid */}
        <div
          className="grid lg:hidden"
          style={{
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 10,
          }}
        >
          {STAGES.map((s, i) => {
            const status = stageStatus(s.key, stage);
            return <StageCard key={s.key} stage={s} status={status} index={i} />;
          })}
        </div>

        {/* Progress bar */}
        {stage !== "idle" && (
          <div
            style={{
              marginTop: 16,
              height: 3,
              borderRadius: 2,
              background: "rgba(39,39,42,0.5)",
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{
                width:
                  stage === "complete"
                    ? "100%"
                    : `${((STAGE_ORDER.indexOf(stage) + 0.5) / STAGES.length) * 100}%`,
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: "100%",
                borderRadius: 2,
                background: "linear-gradient(90deg, #10b981, #34d399)",
              }}
            />
          </div>
        )}

        {/* Result badges */}
        <AnimatePresence>
          {stage === "complete" && result && <ResultPanel result={result} />}
        </AnimatePresence>
      </div>
    </>
  );
}
