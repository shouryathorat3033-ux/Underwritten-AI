"use client";
export default function ActivitySparkline({ data = [], color = "#10b981", height = 32 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 120;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - (v / max) * height}`).join(" ");
  return (
    <svg width={w} height={height} className="inline-block">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  );
}
