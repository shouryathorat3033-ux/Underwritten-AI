"use client";
import { useState, useEffect } from "react";

/**
 * Interactive radar/spider chart for risk factor visualization.
 * Each axis represents a risk category with hover tooltips.
 */
export default function RadarChart({ factors = [], size = 280 }) {
  const [animated, setAnimated] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  if (!factors.length) return null;

  // Normalize to max 6 factors for readability
  const data = factors.slice(0, 6).map(f => ({
    label: f.source || f.name || "Unknown",
    value: Math.min(100, Math.max(0, f.score || 0)),
    weight: f.weight || 0,
    impact: f.impact || "neutral",
  }));

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 40;
  const levels = 4;
  const n = data.length;
  const angleStep = (2 * Math.PI) / n;

  const pointAt = (i, r) => ({
    x: cx + r * Math.sin(i * angleStep),
    y: cy - r * Math.cos(i * angleStep),
  });

  // Grid rings
  const rings = Array.from({ length: levels }, (_, i) => {
    const r = maxR * ((i + 1) / levels);
    const points = data.map((_, j) => pointAt(j, r));
    return points.map(p => `${p.x},${p.y}`).join(" ");
  });

  // Data polygon
  const dataPoints = data.map((d, i) => {
    const r = animated ? (d.value / 100) * maxR : 0;
    return pointAt(i, r);
  });
  const dataPath = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

  const impactColor = (impact) =>
    impact === "positive" ? "#10b981" : impact === "negative" ? "#ef4444" : "#f59e0b";

  return (
    <div className="relative">
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {/* Grid rings */}
        {rings.map((poly, i) => (
          <polygon key={i} points={poly} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
        ))}

        {/* Axis lines */}
        {data.map((_, i) => {
          const end = pointAt(i, maxR);
          return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />;
        })}

        {/* Data polygon fill */}
        <polygon points={dataPath} fill="rgba(16,185,129,0.12)" stroke="#10b981" strokeWidth={2}
          style={{ transition: "all 1.2s cubic-bezier(0.23,1,0.32,1)", filter: "drop-shadow(0 0 8px rgba(16,185,129,0.2))" }} />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <g key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer" }}>
            <circle cx={p.x} cy={p.y} r={hovered === i ? 7 : 5}
              fill={impactColor(data[i].impact)} stroke="#09090b" strokeWidth={2}
              style={{ transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)", filter: hovered === i ? `drop-shadow(0 0 8px ${impactColor(data[i].impact)}60)` : "none" }} />
          </g>
        ))}

        {/* Labels */}
        {data.map((d, i) => {
          const labelR = maxR + 24;
          const p = pointAt(i, labelR);
          const isLeft = p.x < cx - 10;
          const isRight = p.x > cx + 10;
          return (
            <text key={i} x={p.x} y={p.y} textAnchor={isLeft ? "end" : isRight ? "start" : "middle"} dominantBaseline="middle"
              fill={hovered === i ? "#fafafa" : "#71717a"} fontSize={10} fontWeight={hovered === i ? 600 : 400}
              style={{ transition: "all 0.2s" }}>
              {d.label}
            </text>
          );
        })}

        {/* Level labels */}
        {[25, 50, 75, 100].map((v, i) => (
          <text key={v} x={cx + 4} y={cy - maxR * ((i + 1) / levels) + 3}
            fill="#3f3f46" fontSize={8} fontFamily="monospace">{v}</text>
        ))}
      </svg>

      {/* Tooltip */}
      {hovered !== null && (
        <div className="absolute z-10 px-3 py-2 rounded-xl text-xs pointer-events-none animate-scale-in"
          style={{
            top: dataPoints[hovered].y - 50,
            left: Math.min(size - 140, Math.max(0, dataPoints[hovered].x - 70)),
            background: "rgba(15,15,19,0.95)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)",
            minWidth: 130,
          }}>
          <p className="font-semibold mb-1" style={{ color: "#fafafa" }}>{data[hovered].label}</p>
          <div className="flex justify-between gap-4">
            <span style={{ color: "#71717a" }}>Score</span>
            <span className="font-mono font-bold" style={{ color: impactColor(data[hovered].impact) }}>{data[hovered].value}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span style={{ color: "#71717a" }}>Weight</span>
            <span className="font-mono" style={{ color: "#a1a1aa" }}>{(data[hovered].weight * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span style={{ color: "#71717a" }}>Impact</span>
            <span className="font-semibold capitalize" style={{ color: impactColor(data[hovered].impact) }}>{data[hovered].impact}</span>
          </div>
        </div>
      )}
    </div>
  );
}
