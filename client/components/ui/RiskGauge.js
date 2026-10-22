"use client";
import { useState, useEffect } from "react";

/**
 * Animated speedometer gauge for risk scores.
 * The needle sweeps from 0 to the target score with spring easing.
 */
export default function RiskGauge({ score, size = 220 }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const duration = 1500;
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // EaseOutQuart
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const cx = size / 2;
  const cy = size / 2 + 10;
  const radius = size / 2 - 24;
  const startAngle = -210;
  const endAngle = 30;
  const totalAngle = endAngle - startAngle; // 240 degrees
  const scoreAngle = startAngle + (animatedScore / 100) * totalAngle;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcPoint = (angle, r) => ({
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  });

  // Gradient color segments
  const segments = [
    { from: 0, to: 35, color: "#10b981" },
    { from: 35, to: 55, color: "#f59e0b" },
    { from: 55, to: 75, color: "#ef4444" },
    { from: 75, to: 100, color: "#dc2626" },
  ];

  const needleTip = arcPoint(scoreAngle, radius - 8);
  const needleBase1 = arcPoint(scoreAngle + 90, 4);
  const needleBase2 = arcPoint(scoreAngle - 90, 4);

  const riskColor = animatedScore <= 35 ? "#10b981" : animatedScore <= 55 ? "#f59e0b" : animatedScore <= 75 ? "#ef4444" : "#dc2626";
  const riskLabel = animatedScore <= 35 ? "Low Risk" : animatedScore <= 55 ? "Moderate" : animatedScore <= 75 ? "High Risk" : "Critical";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* Background arc segments */}
        {segments.map((seg) => {
          const a1 = startAngle + (seg.from / 100) * totalAngle;
          const a2 = startAngle + (seg.to / 100) * totalAngle;
          const p1 = arcPoint(a1, radius);
          const p2 = arcPoint(a2, radius);
          const largeArc = a2 - a1 > 180 ? 1 : 0;
          return (
            <path key={seg.from} d={`M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArc} 1 ${p2.x} ${p2.y}`}
              fill="none" stroke={`${seg.color}20`} strokeWidth={12} strokeLinecap="round" />
          );
        })}

        {/* Filled arc up to score */}
        {animatedScore > 0 && (() => {
          const p1 = arcPoint(startAngle, radius);
          const p2 = arcPoint(scoreAngle, radius);
          const largeArc = scoreAngle - startAngle > 180 ? 1 : 0;
          return (
            <path d={`M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArc} 1 ${p2.x} ${p2.y}`}
              fill="none" stroke={riskColor} strokeWidth={12} strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${riskColor}60)` }} />
          );
        })()}

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((val) => {
          const angle = startAngle + (val / 100) * totalAngle;
          const outer = arcPoint(angle, radius + 12);
          const inner = arcPoint(angle, radius + 6);
          return (
            <g key={val}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#3f3f46" strokeWidth={1.5} />
              <text x={arcPoint(angle, radius + 22).x} y={arcPoint(angle, radius + 22).y} textAnchor="middle" dominantBaseline="middle"
                fill="#52525b" fontSize={9} fontFamily="monospace">{val}</text>
            </g>
          );
        })}

        {/* Needle */}
        <polygon points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill={riskColor} style={{ filter: `drop-shadow(0 2px 4px ${riskColor}40)` }} />
        <circle cx={cx} cy={cy} r={6} fill="#1c1c24" stroke={riskColor} strokeWidth={2} />

        {/* Center score */}
        <text x={cx} y={cy - 24} textAnchor="middle" fill={riskColor} fontSize={32} fontWeight={800} fontFamily="monospace">
          {animatedScore}
        </text>
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#52525b" fontSize={10} fontWeight={600} letterSpacing={1}>
          {riskLabel.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
