"use client";
import Link from "next/link";

export default function StepSidebar({ policy, steps, currentStep, onStepChange, onChangePolicy }) {
  return (
    <div className="hidden lg:flex lg:w-[380px] xl:w-[420px] shrink-0 flex-col sticky top-0 h-screen overflow-hidden" style={{ background: "#0c0c0f", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[20%] w-[250px] h-[250px] rounded-full" style={{ background: `${policy.color}06`, filter: "blur(80px)", animation: "glow-drift 20s infinite" }} />
        <div className="absolute bottom-[20%] right-[10%] w-[200px] h-[200px] rounded-full" style={{ background: `${policy.color}04`, filter: "blur(60px)", animation: "glow-drift 25s infinite reverse" }} />
      </div>

      <div className="relative z-10 flex flex-col h-full p-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline mb-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>U</div>
          <span className="font-bold" style={{ color: "#fafafa" }}>Underwrite<span style={{ color: "#10b981" }}>AI</span></span>
        </Link>

        {/* Policy badge */}
        <div className="rounded-2xl p-5 mb-8" style={{ background: `${policy.color}08`, border: `1px solid ${policy.color}15` }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: policy.gradient, boxShadow: `0 4px 16px ${policy.color}30` }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{policy.icon}</svg>
          </div>
          <h3 className="text-base font-bold mb-1" style={{ color: "#fafafa" }}>{policy.full}</h3>
          <p className="text-xs leading-relaxed" style={{ color: "#71717a" }}>{policy.desc}</p>
        </div>

        {/* Vertical stepper */}
        <div className="flex-1">
          {steps.map((s, i) => {
            const done = i < currentStep, active = i === currentStep;
            return (
              <button key={s.label} onClick={() => onStepChange(i)} className="flex items-start gap-4 w-full text-left mb-1 transition-all duration-300 group" style={{ cursor: "pointer", background: "none", border: "none", padding: "10px 0" }}>
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0" style={{
                    background: done ? policy.gradient : active ? `${policy.color}18` : "rgba(255,255,255,0.03)",
                    border: active ? `1px solid ${policy.color}30` : "1px solid transparent",
                    boxShadow: active ? `0 0 16px ${policy.color}15` : "none",
                  }}>
                    {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? policy.color : "#3f3f46"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>}
                  </div>
                  {i < 4 && <div className="w-px flex-1 min-h-[16px] mt-1 transition-all duration-300" style={{ background: done ? `${policy.color}30` : "rgba(255,255,255,0.04)" }} />}
                </div>
                <div className="pt-1.5">
                  <p className="text-xs font-semibold transition-colors duration-200" style={{ color: active ? "#fafafa" : done ? "#a1a1aa" : "#3f3f46" }}>{s.label}</p>
                  {active && <p className="text-[10px] mt-0.5" style={{ color: "#52525b" }}>Step {i + 1} of 5</p>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Back link */}
        <button onClick={onChangePolicy} className="flex items-center gap-2 text-xs transition-colors duration-200 mt-4" style={{ color: "#3f3f46", background: "none", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#a1a1aa"} onMouseLeave={(e) => e.currentTarget.style.color = "#3f3f46"}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Change Policy Type
        </button>
      </div>
    </div>
  );
}
