"use client";
import useScrollReveal from "./useScrollReveal";

const sources = [
  { label: "Medical Records", color: "#10b981", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { label: "Financial History", color: "#f59e0b", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
  { label: "Telematics", color: "#10b981", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3l-4 4-4-4"/></svg> },
  { label: "Behavioral Patterns", color: "#f59e0b", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
  { label: "Lifestyle Indicators", color: "#34d399", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></svg> },
  { label: "Claims History", color: "#fbbf24", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg> },
];

export default function DataSources() {
  const ref = useScrollReveal();
  return (
    <section id="data-sources" className="py-24 sm:py-32">
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <div ref={ref} className="reveal-container">
          <h2 className="text-2xl sm:text-4xl font-extrabold leading-[1.1] mb-12" style={{ color: "#fafafa" }}>Beyond Traditional Data</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-base leading-relaxed mb-4" style={{ color: "#a1a1aa" }}>
                Our platform goes far beyond conventional underwriting by integrating
                <span className="font-medium" style={{ color: "#10b981" }}> alternative data sources </span>
                that paint a complete picture of applicant risk.
              </p>
              <p className="text-base leading-relaxed" style={{ color: "#a1a1aa" }}>
                From <span className="font-medium" style={{ color: "#f59e0b" }}>IoT telematics</span> and
                <span className="font-medium" style={{ color: "#10b981" }}> wearable health data</span> to
                <span className="font-medium" style={{ color: "#f59e0b" }}> behavioral analytics</span>, we combine
                multiple data streams for the most accurate risk assessment possible.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {sources.map((s) => (
                <div key={s.label} className="glass-card p-4 flex items-center gap-3 cursor-default group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110" style={{ background: `${s.color}15`, color: s.color }}>
                    {s.icon}
                  </div>
                  <span className="text-sm font-medium transition-colors duration-300" style={{ color: "#fafafa" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
