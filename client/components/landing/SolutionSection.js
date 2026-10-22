"use client";
import useScrollReveal from "./useScrollReveal";

const solutions = [
  { title: "AI-Powered Analysis", features: ["Deep learning risk models", "Natural language processing", "Pattern recognition", "Continuous model training"], icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z"/><path d="M10 22v-4M14 22v-4M10 18h4M9 9H4a1 1 0 00-1 1v2a1 1 0 001 1h1M15 9h5a1 1 0 011 1v2a1 1 0 01-1 1h-1"/></svg>
  ), color: "#10b981" },
  { title: "Multi-Source Data Fusion", features: ["Medical & health records", "Financial & credit data", "IoT & telematics streams", "Behavioral analytics"], icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
  ), color: "#f59e0b" },
  { title: "Instant Decisions", features: ["Lightning-fast processing", "Confidence-scored outputs", "Transparent explanations", "Audit-ready reports"], icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
  ), color: "#34d399" },
];

export default function SolutionSection() {
  const ref = useScrollReveal();
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <div ref={ref} className="reveal-container">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", backdropFilter: "blur(8px)" }}>The Solution</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold leading-[1.1] mb-12" style={{ color: "#fafafa" }}>Intelligent Risk Assessment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {solutions.map((s) => (
              <div key={s.title} className="glass-card p-6 relative overflow-hidden group">
                {/* Hover glow */}
                <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `${s.color}12`, filter: "blur(40px)" }} />
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110" style={{ background: "rgba(16,185,129,0.1)" }}>
                  {s.icon}
                </div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: "#fafafa" }}>{s.title}</h3>
                <ul className="space-y-2 mb-4">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#a1a1aa" }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}40` }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="h-[2px] rounded-full mt-2 transition-all duration-700 group-hover:opacity-100 opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
