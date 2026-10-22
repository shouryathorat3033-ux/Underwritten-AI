"use client";

export function Skeleton({ width, height, rounded, className = "", style = {} }) {
  return (
    <div
      className={className}
      style={{
        width: width || "100%",
        height: height || 16,
        borderRadius: rounded === "full" ? 999 : rounded || 8,
        background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(16,185,129,0.06) 50%, rgba(255,255,255,0.03) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 2s cubic-bezier(0.23,1,0.32,1) infinite",
        ...style,
      }}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card p-5">
      <Skeleton width={100} height={12} style={{ marginBottom: 12 }} />
      <Skeleton width={80} height={28} />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-2">
          <Skeleton width={i === 0 ? 120 : i === 2 ? 40 : 70} height={14} rounded={i === 2 ? "full" : 6} />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 4, cols = 5 }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="py-3 px-2">
              <Skeleton width={60 + i * 10} height={10} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  );
}

export function ChartSkeleton({ height = 200 }) {
  return (
    <div style={{ height, display: "flex", alignItems: "flex-end", gap: 8, padding: "0 8px" }}>
      {[65, 45, 80, 35, 60, 90, 50, 70, 40, 75, 55, 85].map((h, i) => (
        <div key={i} style={{ flex: 1 }}>
          <Skeleton height={`${h}%`} rounded={4} />
        </div>
      ))}
    </div>
  );
}
