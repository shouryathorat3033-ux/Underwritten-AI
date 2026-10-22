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

  // Ordivalabs technical gradient segments
  const segments = [
    { from: 0, to: 35, color: "#3B82F6" },   // Electric cobalt low risk
    { from: 35, to: 55, color: "#06B6D4" },  // Cyan moderate-low
    { from: 55, to: 75, color: "#F59E0B" },  // Amber elevated
    { from: 75, to: 100, color: "#F43F5E" }, // Rose critical
  ];

  const needleTip = arcPoint(scoreAngle, radius - 8);
  const needleBase1 = arcPoint(scoreAngle + 90, 4);
  const needleBase2 = arcPoint(scoreAngle - 90, 4);

  const riskColor = animatedScore <= 35 ? "#3B82F6" : animatedScore <= 55 ? "#06B6D4" : animatedScore <= 75 ? "#F59E0B" : "#F43F5E";
  const riskLabel = animatedScore <= 35 ? "Low Risk" : animatedScore <= 55 ? "Moderate" : animatedScore <= 75 ? "Elevated Risk" : "Critical Risk";

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
              fill="none" stroke={`${seg.color}25`} strokeWidth={10} strokeLinecap="round" />
          );
        })}

        {/* Filled arc up to score */}
        {animatedScore > 0 && (() => {
          const p1 = arcPoint(startAngle, radius);
          const p2 = arcPoint(scoreAngle, radius);
          const largeArc = scoreAngle - startAngle > 180 ? 1 : 0;
          return (
            <path d={`M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArc} 1 ${p2.x} ${p2.y}`}
              fill="none" stroke={riskColor} strokeWidth={10} strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 10px ${riskColor}80)` }} />
          );
        })()}

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((val) => {
          const angle = startAngle + (val / 100) * totalAngle;
          const outer = arcPoint(angle, radius + 12);
          const inner = arcPoint(angle, radius + 6);
          return (
            <g key={val}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(37,99,235,0.3)" strokeWidth={1.5} />
              <text x={arcPoint(angle, radius + 22).x} y={arcPoint(angle, radius + 22).y} textAnchor="middle" dominantBaseline="middle"
                fill="#64748B" fontSize={8} fontFamily="monospace">{val}</text>
            </g>
          );
        })}

        {/* Needle */}
        <polygon points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill={riskColor} style={{ filter: `drop-shadow(0 2px 6px ${riskColor}60)` }} />
        <circle cx={cx} cy={cy} r={6} fill="#0A0F1D" stroke={riskColor} strokeWidth={2} />

        {/* Center score */}
        <text x={cx} y={cy - 24} textAnchor="middle" fill="#FFFFFF" fontSize={32} fontWeight={800} fontFamily="monospace"
          style={{ filter: `drop-shadow(0 0 8px ${riskColor}40)` }}>
          {animatedScore}
        </text>
        <text x={cx} y={cy - 8} textAnchor="middle" fill={riskColor} fontSize={9} fontWeight={700} letterSpacing={1.2} fontFamily="monospace">
          {riskLabel.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
