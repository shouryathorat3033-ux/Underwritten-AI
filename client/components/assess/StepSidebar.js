"use client";
import Link from "next/link";

export default function StepSidebar({ policy, steps, currentStep, onStepChange, onChangePolicy }) {
  const accentColor = policy?.color || "#3B82F6";

  return (
    <div className="hidden lg:flex lg:w-[380px] xl:w-[420px] shrink-0 flex-col sticky top-0 h-screen overflow-hidden relative"
      style={{ background: "var(--bg-secondary, #0A0F1D)", borderRight: "1px solid rgba(37,99,235,0.18)" }}>
      {/* Technical Blueprint Grid Pattern */}
      <div className="absolute inset-0 tech-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%)", filter: "blur(60px)" }} />

      <div className="relative z-10 flex flex-col h-full p-8 justify-between">
        <div>
          {/* Logo with technical tag */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-2.5 no-underline group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)", boxShadow: "0 0 16px rgba(37,99,235,0.4)" }}>
                <span>U</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-white tracking-tight leading-none">
                  Underwrite<span style={{ color: "#60A5FA" }}>AI</span>
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-blue-300/60 mt-0.5">
                  [INTAKE_ORCHESTRATOR]
                </span>
              </div>
            </Link>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded text-blue-300 border border-blue-500/20 bg-blue-500/10">
              V4.2
            </span>
          </div>

          {/* Policy blueprint card */}
          <div className="blueprint-card p-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold"
                style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)", boxShadow: "0 0 16px rgba(37,99,235,0.3)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {policy.icon}
                </svg>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded text-blue-300 bg-blue-500/10 border border-blue-500/20">
                ACTIVE_PROGRAM
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1 tracking-tight">{policy.full}</h3>
            <p className="text-xs font-mono text-slate-400 leading-relaxed">{policy.desc}</p>
          </div>

          {/* Vertical technical stepper */}
          <div className="space-y-1">
            {steps.map((s, i) => {
              const done = i < currentStep, active = i === currentStep;
              return (
                <button
                  key={s.label}
                  onClick={() => onStepChange(i)}
                  className="flex items-start gap-4 w-full text-left transition-all duration-300 group py-2"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 shrink-0 font-mono text-xs"
                      style={{
                        background: done
                          ? "linear-gradient(135deg, #2563EB, #1D4ED8)"
                          : active
                            ? "rgba(37,99,235,0.2)"
                            : "rgba(14,21,38,0.7)",
                        border: active
                          ? "1px solid rgba(96,165,250,0.6)"
                          : done
                            ? "1px solid rgba(37,99,235,0.6)"
                            : "1px solid rgba(37,99,235,0.15)",
                        boxShadow: active ? "0 0 14px rgba(37,99,235,0.3)" : "none",
                      }}
                    >
                      {done ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <span className={active ? "text-blue-300 font-bold" : "text-slate-500"}>
                          0{i + 1}
                        </span>
                      )}
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className="w-px h-5 mt-1 transition-all duration-300"
                        style={{ background: done ? "rgba(37,99,235,0.5)" : "rgba(37,99,235,0.15)" }}
                      />
                    )}
                  </div>
                  <div className="pt-1">
                    <p
                      className="text-xs font-mono font-semibold transition-colors duration-200"
                      style={{ color: active ? "#FFFFFF" : done ? "#94A3B8" : "#475569" }}
                    >
                      {s.label}
                    </p>
                    {active && (
                      <p className="text-[10px] font-mono text-blue-400 mt-0.5">
                        STAGE 0{i + 1} OF 0{steps.length} [IN_PROGRESS]
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Change Policy action */}
        <button
          onClick={onChangePolicy}
          className="btn-secondary flex items-center justify-center gap-2 text-xs font-mono py-2 w-full mt-6"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>CHANGE POLICY TYPE</span>
        </button>
      </div>
    </div>
  );
}
