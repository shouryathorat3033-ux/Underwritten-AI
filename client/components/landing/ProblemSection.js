"use client";
import useScrollReveal from "./useScrollReveal";

const problems = [
  { num: "01", title: "Manual & Slow Process", desc: "Traditional underwriting relies on weeks of manual document review and human analysis, creating costly delays and bottlenecks across the entire pipeline.", icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
  )},
  { num: "02", title: "Fragmented Data Sources", desc: "Underwriters juggle between multiple disconnected systems and databases, leading to incomplete risk profiles and critical insights slipping through the cracks.", icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
  )},
  { num: "03", title: "Inconsistent Evaluation", desc: "Human bias and varying expertise levels result in inconsistent risk scoring and unpredictable decision-making quality across different underwriters and regions.", icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  )},
];

export default function ProblemSection() {
  const ref = useScrollReveal();
  return (
    <section className="py-24 sm:py-32">
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <div ref={ref} className="reveal-container">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", backdropFilter: "blur(8px)" }}>The Challenge</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold leading-[1.1] mb-4" style={{ color: "#fafafa" }}>Why Traditional Underwriting Falls Short</h2>
          <p className="text-base mb-12 max-w-2xl" style={{ color: "#71717a", lineHeight: 1.7 }}>
            The insurance industry faces fundamental challenges that slow down decisions, increase costs, and reduce accuracy.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {problems.map((p) => (
              <div key={p.num} className="glass-card p-7 relative overflow-hidden group">
                <span className="absolute top-4 right-4 text-7xl font-bold pointer-events-none transition-all duration-700" style={{ color: "rgba(255,255,255,0.03)" }}>{p.num}</span>
                {/* Hover glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: "rgba(239,68,68,0.06)", filter: "blur(40px)" }} />
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110" style={{ background: "rgba(239,68,68,0.1)" }}>
                  {p.icon}
                </div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: "#fafafa" }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
