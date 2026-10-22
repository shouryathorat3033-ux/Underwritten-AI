"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useDashboardBase } from "@/lib/routes";

export default function PolicySelector({ policyTypes, onSelectPolicy, onDemoScenario }) {
  const { data: session } = useSession();
  const base = useDashboardBase();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div>
      {/* Header — fits inside the dashboard layout */}
      <div className="mb-10">
        <p className="text-sm mb-1" style={{ color: "#52525b" }}>New Assessment</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: "#fafafa" }}>
          What would you like to insure, {firstName}?
        </h1>
        <p className="text-sm mt-2 max-w-xl" style={{ color: "#71717a" }}>
          Select a policy type below. Our AI will analyze your data across 12+ sources and generate a risk score in seconds.
        </p>
      </div>

      {/* Policy cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl">
        {policyTypes.map((p, i) => (
          <button key={p.id} onClick={() => onSelectPolicy(p.id)}
            className="relative text-left cursor-pointer rounded-2xl p-7 transition-all duration-300 group overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", animation: `fade-up 0.5s cubic-bezier(0.23,1,0.32,1) ${100 + i * 80}ms both`, fontFamily: "inherit" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${p.color}30`; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 20px 60px ${p.color}08`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            {/* Hover glow */}
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `${p.color}06`, filter: "blur(40px)" }} />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110" style={{ background: p.gradient, boxShadow: `0 4px 20px ${p.color}25` }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{p.icon}</svg>
              </div>
              <h3 className="text-base font-bold mb-1.5" style={{ color: "#fafafa" }}>{p.full}</h3>
              <p className="text-xs leading-relaxed mb-4" style={{ color: "#71717a" }}>{p.desc}</p>
              <div className="flex items-center gap-2 text-xs font-semibold transition-all duration-300 group-hover:gap-3" style={{ color: p.color }}>
                Start Assessment <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Demo Scenarios */}
      <div className="max-w-4xl mt-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "#3f3f46" }}>Quick Demo Scenarios</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Low Risk (Health)", policy: "health", data: { applicantName: session?.user?.name || "", applicantEmail: session?.user?.email || "", age: "28", gender: "female", occupation: "Software Engineer", income: "1200000", creditScore: "780", existingPolicies: "1", bmi: "22", smokingStatus: "never", exerciseFrequency: "5", medicalHistory: "", familyHealthHistory: "", currentMedications: "" }, color: "#10b981" },
            { label: "High Risk (Health)", policy: "health", data: { applicantName: session?.user?.name || "", applicantEmail: session?.user?.email || "", age: "62", gender: "male", occupation: "Retired", income: "0", creditScore: "0", existingPolicies: "0", bmi: "36", smokingStatus: "current", exerciseFrequency: "0", medicalHistory: "diabetes, hypertension, heart disease", familyHealthHistory: "cancer, stroke", currentMedications: "Insulin" }, color: "#ef4444" },
            { label: "Young Driver (Auto)", policy: "auto", data: { applicantName: session?.user?.name || "", applicantEmail: session?.user?.email || "", age: "19", gender: "male", occupation: "Student", income: "0", creditScore: "0", existingPolicies: "0", vehicleMake: "Honda Activa", vehicleYear: "2025", vehicleType: "motorcycle", drivingYears: "1", accidentsLast5: "2", trafficViolations: "3", dailyCommute: "40" }, color: "#f59e0b" },
            { label: "Safe Driver (Auto)", policy: "auto", data: { applicantName: session?.user?.name || "", applicantEmail: session?.user?.email || "", age: "38", gender: "female", occupation: "Teacher", income: "700000", creditScore: "750", existingPolicies: "2", vehicleMake: "Maruti Swift", vehicleYear: "2022", vehicleType: "sedan", drivingYears: "15", accidentsLast5: "0", trafficViolations: "0", dailyCommute: "12" }, color: "#10b981" },
          ].map((scenario) => (
            <button key={scenario.label} onClick={() => onDemoScenario(scenario.policy, scenario.data)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 cursor-pointer"
              style={{ background: `${scenario.color}08`, border: `1px solid ${scenario.color}20`, color: scenario.color, fontFamily: "inherit" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${scenario.color}15`; e.currentTarget.style.borderColor = `${scenario.color}40`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${scenario.color}08`; e.currentTarget.style.borderColor = `${scenario.color}20`; }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: scenario.color }} />
              {scenario.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trust signals — contextual for logged-in users */}
      <div className="flex items-center gap-6 mt-10">
        {["AI-Powered Scoring", "12+ Data Sources", "Results in Seconds"].map(t => (
          <div key={t} className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
            <span className="text-[11px] font-medium" style={{ color: "#52525b" }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
