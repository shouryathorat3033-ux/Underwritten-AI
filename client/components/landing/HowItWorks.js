"use client";
import useScrollReveal from "./useScrollReveal";

const steps = [
  { num: "01", title: "Data Collection", desc: "Gather applicant information from traditional forms and connect alternative data sources automatically.", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
  ), color: "#10b981" },
  { num: "02", title: "AI Analysis", desc: "Our AI engine processes all data through advanced risk models, cross-referencing multiple sources.", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
  ), color: "#34d399" },
  { num: "03", title: "Risk Scoring", desc: "Generate a comprehensive risk score with individual factor breakdowns and confidence intervals.", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
  ), color: "#f59e0b" },
  { num: "04", title: "Decision Output", desc: "Receive approve, refer, or decline recommendations with full AI-generated explanations.", icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
  ), color: "#10b981" },
];

export default function HowItWorks() {
  const ref = useScrollReveal();
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <div ref={ref} className="reveal-container">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", backdropFilter: "blur(8px)" }}>How It Works</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold leading-[1.1] mb-12" style={{ color: "#fafafa" }}>From Application to Decision in Seconds</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className="glass-card p-6 relative overflow-hidden group">
                {/* Step glow on hover */}
                <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `${s.color}10`, filter: "blur(30px)" }} />
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold mb-4 transition-all duration-500 group-hover:scale-110" style={{ background: `${s.color}25`, color: s.color, boxShadow: `0 0 0 0 ${s.color}00`, transition: "transform 0.5s cubic-bezier(0.23,1,0.32,1), box-shadow 0.5s cubic-bezier(0.23,1,0.32,1)" }}>
                  {s.num}
                </div>
                <div className="mb-3 transition-transform duration-500 group-hover:scale-105">{s.icon}</div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "#fafafa" }}>{s.title}</h3>
                <p className="text-sm" style={{ color: "#a1a1aa", lineHeight: "1.6" }}>{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-[18px] -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full z-10" style={{ background: "#15151a", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 0 12px rgba(0,0,0,0.3)" }}>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 4l6 6-6 6"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
