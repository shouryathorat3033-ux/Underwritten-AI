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
      {/* Header with technical badge */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono text-blue-300 border border-blue-500/25 bg-blue-500/10 mb-3">
          <span>[INTAKE.DISPATCHER]</span>
          <span>·</span>
          <span>SELECT UNDERWRITING DOMAIN</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Risk Assessment Initialization
        </h1>
        <p className="text-xs sm:text-sm font-mono text-slate-400 mt-2 max-w-2xl leading-relaxed">
          Welcome, {firstName}. Select an actuarial risk model below. Our multi-vector engine ingests medical, behavioral, and telemetry records to synthesize calibrated risk bands.
        </p>
      </div>

      {/* Policy cards — Ordivalabs blueprint style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl">
        {policyTypes.map((p, i) => (
          <button
            key={p.id}
            onClick={() => onSelectPolicy(p.id)}
            className="blueprint-card-interactive text-left p-6 sm:p-7 relative overflow-hidden group cursor-pointer"
          >
            {/* Top coordinate */}
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(29,78,216,0.1))",
                  border: "1px solid rgba(96,165,250,0.4)",
                  boxShadow: "0 0 16px rgba(37,99,235,0.25)"
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  {p.icon}
                </svg>
              </div>

              <span className="font-mono text-[10px] px-2 py-0.5 rounded text-blue-300 bg-blue-500/10 border border-blue-500/20">
                [ACTUARIAL.0{i + 1}]
              </span>
            </div>

            <h3 className="text-base font-bold text-white mb-1.5 tracking-tight group-hover:text-blue-300 transition-colors">
              {p.full}
            </h3>
            <p className="text-xs font-mono text-slate-400 leading-relaxed mb-5">
              {p.desc}
            </p>

            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-blue-400 group-hover:text-blue-300 group-hover:gap-3 transition-all">
              <span>INITIALIZE DOCKET</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Demo Scenarios — Technical Calibrated Pre-sets */}
      <div className="max-w-4xl mt-10 p-5 rounded-xl" style={{ background: "rgba(14,21,38,0.6)", border: "1px solid rgba(37,99,235,0.18)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            [PRE-CALIBRATED BENCHMARK SCENARIOS]
          </p>
          <span className="text-[10px] font-mono text-slate-500">// ONE-CLICK TELEMETRY INJECTION</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {[
            { label: "Low Risk Profile (Health)", policy: "health", data: { applicantName: session?.user?.name || "Dr. Aditi Sen", applicantEmail: session?.user?.email || "aditi@enterprise.in", age: "28", gender: "female", occupation: "Software Engineer", income: "1200000", creditScore: "780", existingPolicies: "1", bmi: "22", smokingStatus: "never", exerciseFrequency: "5", medicalHistory: "", familyHealthHistory: "", currentMedications: "" }, color: "#3B82F6", tag: "LOW_RISK" },
            { label: "High Risk Profile (Health)", policy: "health", data: { applicantName: session?.user?.name || "Vijay Verma", applicantEmail: session?.user?.email || "vijay@enterprise.in", age: "62", gender: "male", occupation: "Retired", income: "0", creditScore: "0", existingPolicies: "0", bmi: "36", smokingStatus: "current", exerciseFrequency: "0", medicalHistory: "diabetes, hypertension, heart disease", familyHealthHistory: "cancer, stroke", currentMedications: "Insulin" }, color: "#F43F5E", tag: "HIGH_RISK" },
            { label: "Young Driver (Auto)", policy: "auto", data: { applicantName: session?.user?.name || "Arjun Rao", applicantEmail: session?.user?.email || "arjun@enterprise.in", age: "19", gender: "male", occupation: "Student", income: "0", creditScore: "0", existingPolicies: "0", vehicleMake: "Honda Activa", vehicleYear: "2025", vehicleType: "motorcycle", drivingYears: "1", accidentsLast5: "2", trafficViolations: "3", dailyCommute: "40" }, color: "#F59E0B", tag: "ELEVATED" },
            { label: "Safe Driver (Auto)", policy: "auto", data: { applicantName: session?.user?.name || "Pooja Hegde", applicantEmail: session?.user?.email || "pooja@enterprise.in", age: "38", gender: "female", occupation: "Teacher", income: "700000", creditScore: "750", existingPolicies: "2", vehicleMake: "Maruti Swift", vehicleYear: "2022", vehicleType: "sedan", drivingYears: "15", accidentsLast5: "0", trafficViolations: "0", dailyCommute: "12" }, color: "#3B82F6", tag: "OPTIMAL" },
          ].map((scenario) => (
            <button
              key={scenario.label}
              onClick={() => onDemoScenario(scenario.policy, scenario.data)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 cursor-pointer"
              style={{
                background: "rgba(10,15,29,0.8)",
                border: `1px solid ${scenario.color}35`,
                color: "#E2E8F0"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = scenario.color;
                e.currentTarget.style.boxShadow = `0 0 12px ${scenario.color}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${scenario.color}35`;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: scenario.color }} />
              <span>{scenario.label}</span>
              <span className="text-[9px] px-1 py-0.2 rounded font-mono" style={{ background: `${scenario.color}20`, color: scenario.color }}>
                {scenario.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Trust & telemetry signals */}
      <div className="flex flex-wrap items-center gap-6 mt-8 font-mono text-[11px] text-slate-500">
        {["GEMMA 4 REASONING", "12+ TELEMETRY STREAMS", "ALGORITHMIC AUDIT TRAIL"].map(t => (
          <div key={t} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
