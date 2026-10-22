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
    impact === "positive" ? "#3B82F6" : impact === "negative" ? "#F43F5E" : "#06B6D4";

  return (
    <div className="relative">
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {/* Grid rings */}
        {rings.map((poly, i) => (
          <polygon key={i} points={poly} fill="none" stroke="rgba(37,99,235,0.18)" strokeWidth={1} />
        ))}

        {/* Axis lines */}
        {data.map((_, i) => {
          const end = pointAt(i, maxR);
          return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(37,99,235,0.25)" strokeWidth={1} />;
        })}

        {/* Data polygon fill */}
        <polygon points={dataPath} fill="rgba(37,99,235,0.16)" stroke="#3B82F6" strokeWidth={2}
          style={{ transition: "all 1.2s cubic-bezier(0.23,1,0.32,1)", filter: "drop-shadow(0 0 12px rgba(37,99,235,0.35))" }} />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <g key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer" }}>
            <circle cx={p.x} cy={p.y} r={hovered === i ? 6 : 4.5}
              fill={impactColor(data[i].impact)} stroke="#0A0F1D" strokeWidth={2}
              style={{ transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)", filter: hovered === i ? `drop-shadow(0 0 10px ${impactColor(data[i].impact)})` : "none" }} />
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
              fill={hovered === i ? "#FFFFFF" : "#94A3B8"} fontSize={9} fontWeight={hovered === i ? 600 : 400}
              fontFamily="monospace"
              style={{ transition: "all 0.2s" }}>
              {d.label}
            </text>
          );
        })}

        {/* Level labels */}
        {[25, 50, 75, 100].map((v, i) => (
          <text key={v} x={cx + 4} y={cy - maxR * ((i + 1) / levels) + 3}
            fill="#475569" fontSize={8} fontFamily="monospace">{v}</text>
        ))}
      </svg>

      {/* Tooltip */}
      {hovered !== null && (
        <div className="absolute z-10 px-3 py-2 rounded-lg text-xs pointer-events-none animate-scale-in font-mono"
          style={{
            top: dataPoints[hovered].y - 55,
            left: Math.min(size - 140, Math.max(0, dataPoints[hovered].x - 70)),
            background: "rgba(10,15,29,0.95)", border: "1px solid rgba(37,99,235,0.4)", backdropFilter: "blur(8px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            minWidth: 140,
          }}>
          <p className="font-semibold mb-1 text-white">{data[hovered].label}</p>
          <div className="flex justify-between gap-4 text-[11px]">
            <span className="text-slate-400">Score</span>
            <span className="font-bold" style={{ color: impactColor(data[hovered].impact) }}>{data[hovered].value}</span>
          </div>
          <div className="flex justify-between gap-4 text-[11px]">
            <span className="text-slate-400">Weight</span>
            <span className="text-blue-300">{(data[hovered].weight * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between gap-4 text-[11px]">
            <span className="text-slate-400">Impact</span>
            <span className="font-semibold uppercase text-[10px]" style={{ color: impactColor(data[hovered].impact) }}>{data[hovered].impact}</span>
          </div>
        </div>
      )}
    </div>
  );
}
