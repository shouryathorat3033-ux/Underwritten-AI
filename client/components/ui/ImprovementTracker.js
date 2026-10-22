"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const COLORS = {
  improve: "#10b981",
  decline: "#ef4444",
  yellow: "#f59e0b",
  text: "#fafafa",
  muted: "#a1a1aa",
  dim: "#52525b",
  bg: "#09090b",
  glassBorder: "rgba(255,255,255,0.08)",
  glassBg: "rgba(255,255,255,0.03)",
};

function dotColor(score) {
  if (score <= 35) return COLORS.improve;
  if (score <= 55) return COLORS.yellow;
  return COLORS.decline;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── animation variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 22, stiffness: 120, mass: 0.6 },
  },
};

export default function ImprovementTracker({ assessments = [] }) {
  const svgRef = useRef(null);
  const [lineLength, setLineLength] = useState(0);
  const [mounted, setMounted] = useState(false);

  /* ── filter to assessments with valid riskScores, sorted chronologically ── */
  const sorted = useMemo(() => {
    return assessments
      .filter((a) => a.result?.riskScore != null)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [assessments]);

  /* ── derived stats ── */
  const stats = useMemo(() => {
    if (sorted.length < 2) return null;

    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    const change = latest.result.riskScore - first.result.riskScore;
    const improved = change < 0;

    // Best (lowest) score
    let bestIdx = 0;
    sorted.forEach((a, i) => {
      if (a.result.riskScore < sorted[bestIdx].result.riskScore) bestIdx = i;
    });
    const best = sorted[bestIdx];

    // Top negative factor from latest assessment for decline advice
    const negFactor = latest.result?.factors
      ?.filter((f) => f.impact === "negative")
      .sort((a, b) => (b.weight || 0) - (a.weight || 0))[0];

    return {
      first,
      latest,
      change,
      absChange: Math.abs(change),
      improved,
      best,
      count: sorted.length,
      negFactor,
    };
  }, [sorted]);

  /* ── SVG chart geometry ── */
  const CHART_H = 200;
  const PAD = { top: 24, right: 20, bottom: 32, left: 36 };

  const chartData = useMemo(() => {
    if (sorted.length < 2) return null;

    const scores = sorted.map((a) => a.result.riskScore);
    const dates = sorted.map((a) => new Date(a.createdAt).getTime());
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];
    const dateRange = maxDate - minDate || 1;

    // Map data to chart coordinates
    // viewBox will be set to use percentage-based width, so we use a fixed internal width
    const W = 600;
    const plotW = W - PAD.left - PAD.right;
    const plotH = CHART_H - PAD.top - PAD.bottom;

    const points = sorted.map((a, i) => {
      const x = PAD.left + ((dates[i] - minDate) / dateRange) * plotW;
      const y = PAD.top + (a.result.riskScore / 100) * plotH;
      return { x, y, score: a.result.riskScore, date: a.createdAt, id: a._id };
    });

    // Build polyline path string
    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    // X-axis labels: show dates at each data point (deduplicate month/year)
    const seenLabels = new Set();
    const xLabels = points
      .map((p, i) => {
        const label = formatDate(sorted[i].createdAt);
        if (seenLabels.has(label)) return null;
        seenLabels.add(label);
        return { x: p.x, label };
      })
      .filter(Boolean);

    // Y-axis labels
    const yLabels = [0, 25, 50, 75, 100].map((v) => ({
      y: PAD.top + (v / 100) * plotH,
      label: v,
    }));

    // Threshold lines
    const thresholds = [
      { score: 35, label: "Approve", y: PAD.top + (35 / 100) * plotH, color: COLORS.improve },
      { score: 55, label: "Refer", y: PAD.top + (55 / 100) * plotH, color: COLORS.yellow },
    ];

    return { points, linePath, xLabels, yLabels, thresholds, W };
  }, [sorted]);

  /* ── measure path length for stroke animation ── */
  useEffect(() => {
    if (!svgRef.current) return;
    const path = svgRef.current.querySelector("[data-chart-line]");
    if (path) {
      const len = path.getTotalLength();
      setLineLength(len);
      // Trigger mount animation on next frame
      requestAnimationFrame(() => setMounted(true));
    }
  }, [chartData]);

  /* ── single assessment message ── */
  if (sorted.length === 1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          padding: "20px 24px",
          borderRadius: 16,
          background: COLORS.glassBg,
          border: `1px solid ${COLORS.glassBorder}`,
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: COLORS.dim, lineHeight: 1.6 }}>
          Complete more assessments to track your improvement over time.
        </p>
      </motion.div>
    );
  }

  /* ── not enough data ── */
  if (!stats || !chartData) return null;

  const trendColor = stats.improved ? COLORS.improve : COLORS.decline;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ width: "100%" }}
    >
      {/* ── Header ── */}
      <motion.div variants={cardVariants} style={{ marginBottom: 16 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.text,
            letterSpacing: 0.2,
          }}
        >
          Risk Score Trend
        </h3>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 11,
            color: trendColor,
            fontWeight: 600,
          }}
        >
          {stats.improved
            ? `Improved by ${stats.absChange.toFixed(1)} points`
            : `Increased by ${stats.absChange.toFixed(1)} points`}
          {" since "}
          {formatShortDate(stats.first.createdAt)}
        </p>
      </motion.div>

      {/* ── SVG Chart ── */}
      <motion.div
        variants={cardVariants}
        style={{
          width: "100%",
          borderRadius: 16,
          background: COLORS.glassBg,
          border: `1px solid ${COLORS.glassBorder}`,
          padding: "16px 8px 8px",
          overflow: "hidden",
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartData.W} ${CHART_H}`}
          style={{ width: "100%", height: CHART_H, display: "block" }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Y-axis grid lines */}
          {chartData.yLabels.map((yl) => (
            <g key={yl.label}>
              <line
                x1={PAD.left}
                y1={yl.y}
                x2={chartData.W - PAD.right}
                y2={yl.y}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={0.5}
              />
              <text
                x={PAD.left - 8}
                y={yl.y + 1}
                textAnchor="end"
                dominantBaseline="middle"
                fill={COLORS.dim}
                fontSize={9}
                fontFamily="monospace"
              >
                {yl.label}
              </text>
            </g>
          ))}

          {/* Threshold lines */}
          {chartData.thresholds.map((th) => (
            <g key={th.score}>
              <line
                x1={PAD.left}
                y1={th.y}
                x2={chartData.W - PAD.right}
                y2={th.y}
                stroke={th.color}
                strokeWidth={0.8}
                strokeDasharray="4 4"
                opacity={0.35}
              />
              {/* Decline zone label at score 55 right side */}
              <text
                x={chartData.W - PAD.right + 2}
                y={th.y - 5}
                textAnchor="end"
                fill={th.color}
                fontSize={8}
                fontWeight={600}
                opacity={0.6}
              >
                {th.label}
              </text>
            </g>
          ))}
          {/* Decline label above 55 */}
          <text
            x={chartData.W - PAD.right + 2}
            y={chartData.thresholds[1].y + 12}
            textAnchor="end"
            fill={COLORS.decline}
            fontSize={8}
            fontWeight={600}
            opacity={0.5}
          >
            Decline
          </text>

          {/* X-axis labels */}
          {chartData.xLabels.map((xl, i) => (
            <text
              key={i}
              x={xl.x}
              y={CHART_H - 6}
              textAnchor="middle"
              fill={COLORS.dim}
              fontSize={9}
              fontFamily="monospace"
            >
              {xl.label}
            </text>
          ))}

          {/* Animated line */}
          <path
            data-chart-line
            d={chartData.linePath}
            fill="none"
            stroke={trendColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: `drop-shadow(0 0 6px ${trendColor}40)`,
              strokeDasharray: lineLength || 1000,
              strokeDashoffset: mounted ? 0 : lineLength || 1000,
              transition: "stroke-dashoffset 1.4s cubic-bezier(0.23,1,0.32,1)",
            }}
          />

          {/* Gradient fill under the line */}
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${chartData.linePath} L ${chartData.points[chartData.points.length - 1].x} ${CHART_H - PAD.bottom} L ${chartData.points[0].x} ${CHART_H - PAD.bottom} Z`}
            fill="url(#trendFill)"
            style={{
              opacity: mounted ? 0.6 : 0,
              transition: "opacity 0.8s ease-out 1s",
            }}
          />

          {/* Data points */}
          {chartData.points.map((p, i) => (
            <g key={p.id || i}>
              {/* Outer glow */}
              <circle
                cx={p.x}
                cy={p.y}
                r={mounted ? 8 : 0}
                fill={dotColor(p.score)}
                opacity={0.15}
                style={{
                  transition: `r 0.4s cubic-bezier(0.23,1,0.32,1) ${0.8 + i * 0.1}s, opacity 0.4s ease ${0.8 + i * 0.1}s`,
                }}
              />
              {/* Point */}
              <circle
                cx={p.x}
                cy={p.y}
                r={mounted ? 4.5 : 0}
                fill={dotColor(p.score)}
                stroke={COLORS.bg}
                strokeWidth={2}
                style={{
                  transition: `r 0.4s cubic-bezier(0.23,1,0.32,1) ${0.8 + i * 0.1}s`,
                  filter: `drop-shadow(0 0 4px ${dotColor(p.score)}60)`,
                }}
              />
              {/* Score label above point */}
              <text
                x={p.x}
                y={p.y - 12}
                textAnchor="middle"
                fill={dotColor(p.score)}
                fontSize={9}
                fontWeight={700}
                fontFamily="monospace"
                opacity={mounted ? 1 : 0}
                style={{
                  transition: `opacity 0.3s ease ${1.0 + i * 0.1}s`,
                }}
              >
                {p.score.toFixed(0)}
              </text>
            </g>
          ))}
        </svg>
      </motion.div>

      {/* ── Insight cards ── */}
      <motion.div
        variants={containerVariants}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginTop: 12,
        }}
      >
        {/* Score Change */}
        <motion.div variants={cardVariants} style={insightCardStyle}>
          <span style={insightLabelStyle}>Score Change</span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              fontFamily: "monospace",
              color: trendColor,
              lineHeight: 1,
            }}
          >
            {stats.improved ? "-" : "+"}
            {stats.absChange.toFixed(0)}
          </span>
          <span style={{ fontSize: 9, color: COLORS.dim, marginTop: 2 }}>
            {stats.first.result.riskScore.toFixed(0)} &rarr;{" "}
            {stats.latest.result.riskScore.toFixed(0)}
          </span>
        </motion.div>

        {/* Best Score */}
        <motion.div variants={cardVariants} style={insightCardStyle}>
          <span style={insightLabelStyle}>Best Score</span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              fontFamily: "monospace",
              color: dotColor(stats.best.result.riskScore),
              lineHeight: 1,
            }}
          >
            {stats.best.result.riskScore.toFixed(0)}
          </span>
          <span style={{ fontSize: 9, color: COLORS.dim, marginTop: 2 }}>
            {formatShortDate(stats.best.createdAt)}
          </span>
        </motion.div>

        {/* Assessments */}
        <motion.div variants={cardVariants} style={insightCardStyle}>
          <span style={insightLabelStyle}>Assessments</span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              fontFamily: "monospace",
              color: COLORS.text,
              lineHeight: 1,
            }}
          >
            {stats.count}
          </span>
          <span style={{ fontSize: 9, color: COLORS.dim, marginTop: 2 }}>
            total completed
          </span>
        </motion.div>
      </motion.div>

      {/* ── Summary message ── */}
      <motion.div
        variants={cardVariants}
        style={{
          marginTop: 12,
          padding: "14px 16px",
          borderRadius: 12,
          background: stats.improved
            ? "rgba(16,185,129,0.04)"
            : "rgba(239,68,68,0.04)",
          border: `1px solid ${stats.improved ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)"}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          {/* Icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={trendColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, marginTop: 1 }}
          >
            {stats.improved ? (
              <>
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </>
            ) : (
              <>
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </>
            )}
          </svg>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.6,
              color: COLORS.muted,
            }}
          >
            {stats.improved ? (
              <>
                Your risk profile has improved by{" "}
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: COLORS.improve,
                  }}
                >
                  {stats.absChange.toFixed(0)} points
                </span>{" "}
                since {formatShortDate(stats.first.createdAt)}.
              </>
            ) : (
              <>
                Your risk has increased by{" "}
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: COLORS.decline,
                  }}
                >
                  {stats.absChange.toFixed(0)} points
                </span>
                {stats.negFactor
                  ? <> &mdash; consider improving{" "}
                      <span style={{ fontWeight: 600, color: COLORS.text }}>
                        {stats.negFactor.source || stats.negFactor.factor}
                      </span>
                    </>
                  : null}
                .
              </>
            )}
          </p>
        </div>
      </motion.div>

    </motion.div>
  );
}

/* ── shared insight card style ── */
const insightCardStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  padding: "14px 10px",
  borderRadius: 14,
  background: COLORS.glassBg,
  border: `1px solid ${COLORS.glassBorder}`,
};

const insightLabelStyle = {
  fontSize: 9,
  fontWeight: 700,
  color: COLORS.dim,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 2,
};
