"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SubmittedContent() {
  const params = useSearchParams();
  const id = params.get("id");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#09090b" }}>
      {/* Minimal nav */}
      <nav className="h-14 flex items-center px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>U</div>
          <span className="font-bold text-sm" style={{ color: "#fafafa" }}>Underwrite<span style={{ color: "#10b981" }}>AI</span></span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: "#fafafa" }}>Assessment Submitted!</h1>
          <p className="text-base mb-6" style={{ color: "#71717a", lineHeight: 1.7 }}>
            Your application has been received and is being processed by our AI engine. An underwriter will review it shortly.
          </p>

          {id && (
            <div className="glass-card p-4 mb-6 text-left">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium" style={{ color: "#71717a" }}>Reference ID</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.08)", color: "#34d399" }}>{id}</span>
              </div>
              <p className="text-[11px] mt-2" style={{ color: "#52525b" }}>
                Save this ID for your records. The underwriter team will contact you via the email you provided.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/applicant/dashboard/assess" className="btn-primary no-underline inline-flex items-center justify-center gap-2 px-6 py-3">
              Submit Another
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </Link>
            <Link href="/" className="btn-secondary no-underline inline-flex items-center justify-center gap-2 px-6 py-3">
              Back to Home
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
