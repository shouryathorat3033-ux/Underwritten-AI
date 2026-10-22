"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SubmittedContent() {
  const params = useSearchParams();
  const id = params.get("id");

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: "var(--bg-primary, #070A13)" }}>
      <div className="absolute inset-0 tech-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #2563EB, #60A5FA, transparent)" }} />

      {/* Minimal nav */}
      <nav className="h-16 flex items-center justify-between px-6 sm:px-10 md:px-16 lg:px-24 relative z-10" style={{ borderBottom: "1px solid rgba(37,99,235,0.15)" }}>
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}>U</div>
          <span className="font-bold text-sm text-white">Underwrite<span style={{ color: "#60A5FA" }}>AI</span></span>
        </Link>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full text-blue-300 border border-blue-500/20 bg-blue-500/10">
          [INTAKE.DISPATCHED]
        </span>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-16 relative z-10">
        <div className="max-w-lg w-full blueprint-card p-8 sm:p-10 text-center">
          {/* Scientific success badge */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 relative overflow-hidden"
            style={{ background: "rgba(37,99,235,0.12)", border: "1px solid rgba(96,165,250,0.4)", boxShadow: "0 0 24px rgba(37,99,235,0.25)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono text-blue-300 mb-3"
            style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)" }}>
            <span>TELEMETRY_INGESTION_COMPLETE</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
            Assessment Docket Dispatched
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed max-w-sm mx-auto">
            Your risk profile is routed through the algorithmic verification queue and scheduled for local Gemma 4 E4B synthesis.
          </p>

          {id && (
            <div className="p-4 mb-6 text-left rounded-lg"
              style={{ background: "rgba(14,21,38,0.8)", border: "1px solid rgba(37,99,235,0.25)" }}>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono text-slate-400">TELEMETRY_REF_ID</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded text-blue-300" style={{ background: "rgba(37,99,235,0.2)", border: "1px solid rgba(96,165,250,0.3)" }}>
                  {id}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-2">
                // System notification dispatched. You can track automated underwriting status directly within your console.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/applicant/dashboard/assess" className="btn-primary no-underline inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-mono">
              <span>SUBMIT ANOTHER DOCKET</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </Link>
            <Link href="/" className="btn-secondary no-underline inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-mono">
              RETURN TO OVERVIEW
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubmittedPage() {
  return (
    <Suspense fallback={null}>
      <SubmittedContent />
    </Suspense>
  );
}
