"use client";
import { useState, useEffect } from "react";

/**
 * First-time user onboarding tour overlay.
 * Shows 4 steps highlighting key features.
 */
const TOUR_STEPS = [
  {
    title: "Welcome to UnderwriteAI",
    description: "Your AI-powered insurance underwriting platform. Let's take a quick tour of the key features.",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  {
    title: "Start an Assessment",
    description: "Create a new risk assessment by filling in applicant details. Our AI analyzes 12+ data sources to generate an instant risk score.",
    icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></>,
  },
  {
    title: "AI-Powered Insights",
    description: "Each assessment includes explainable risk factors, adverse action reasons, and a comparison of traditional vs AI-enhanced scoring.",
    icon: <><path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z" /><path d="M10 22v-4M14 22v-4M10 18h4" /></>,
  },
  {
    title: "Chat with AI Assistant",
    description: "Click the chat icon anytime to ask questions about risk scores, get explanations, or navigate the platform with natural language.",
    icon: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  },
];

export default function OnboardingTour() {
  const [step, setStep] = useState(-1); // -1 = not started/dismissed
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if user hasn't seen the tour
    const seen = localStorage.getItem("onboarding_tour_seen");
    if (!seen) {
      const t = setTimeout(() => { setStep(0); setVisible(true); }, 1000);
      return () => clearTimeout(t);
    }
  }, []);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem("onboarding_tour_seen", "true");
    setTimeout(() => setStep(-1), 300);
  };

  if (step === -1) return null;

  const current = TOUR_STEPS[step];
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease", pointerEvents: visible ? "auto" : "none" }}>
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={dismiss} />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden" style={{
        background: "rgba(15,15,19,0.98)", border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 60px rgba(16,185,129,0.05)",
        transform: visible ? "scale(1) translateY(0)" : "scale(0.95) translateY(10px)",
        transition: "transform 0.4s cubic-bezier(0.23,1,0.32,1)",
      }}>
        {/* Progress bar */}
        <div className="h-1" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="h-full rounded-full" style={{
            width: `${progress}%`, background: "linear-gradient(90deg, #10b981, #34d399)",
            transition: "width 0.5s cubic-bezier(0.23,1,0.32,1)",
            boxShadow: "0 0 8px rgba(16,185,129,0.3)",
          }} />
        </div>

        <div className="p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {current.icon}
            </svg>
          </div>

          {/* Content */}
          <h2 className="text-lg font-bold mb-2" style={{ color: "#fafafa" }}>{current.title}</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#71717a" }}>{current.description}</p>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className="rounded-full transition-all duration-300" style={{
                width: i === step ? 24 : 6, height: 6,
                background: i === step ? "#10b981" : i < step ? "#10b981" : "rgba(255,255,255,0.1)",
                boxShadow: i === step ? "0 0 8px rgba(16,185,129,0.4)" : "none",
              }} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={dismiss} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#71717a", cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.color = "#a1a1aa"}
              onMouseLeave={e => e.currentTarget.style.color = "#71717a"}>
              Skip Tour
            </button>
            <button onClick={handleNext} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}>
              {step < TOUR_STEPS.length - 1 ? "Next" : "Get Started"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
