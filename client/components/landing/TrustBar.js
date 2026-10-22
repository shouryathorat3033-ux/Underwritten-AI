"use client";

const highlights = [
  "AI-Powered Analysis",
  "Real-Time Risk Scoring",
  "Multi-Source Data Fusion",
  "Automated Decisions",
  "Audit-Ready Reports",
  "Instant Processing",
  "Predictive Modeling",
  "Compliance Built-In",
  "Sponsored by Persistent Systems",
];

export default function TrustBar() {
  const items = [...highlights, ...highlights];
  return (
    <div className="py-5 overflow-hidden relative" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      {/* Fade edges for seamless scroll feel */}
      <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, #09090b, transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, #09090b, transparent)" }} />
      <div className="flex items-center whitespace-nowrap" style={{ animation: "marquee-scroll 50s linear infinite", width: "max-content" }}>
        {items.map((h, i) => (
          <div key={i} className="flex items-center gap-6 px-8">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#3f3f46" }}>{h}</span>
            <span className="w-1 h-1 rounded-full" style={{ background: "rgba(16,185,129,0.5)", boxShadow: "0 0 4px rgba(16,185,129,0.3)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
