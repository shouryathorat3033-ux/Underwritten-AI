"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="pt-16 pb-8 relative bg-[#070a13] border-t border-blue-500/15">
      {/* Top telemetry glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent shadow-[0_0_20px_rgba(37,99,235,0.3)]" />

      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-[11px] bg-gradient-to-br from-blue-600 to-indigo-600 shadow-[0_0_12px_rgba(37,99,235,0.4)] border border-blue-400/30">
                U
              </div>
              <span className="font-bold text-sm text-[#f8fafc]">
                Underwrite<span className="text-blue-500">AI</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed mb-4 text-slate-400">
              Scientific insurance underwriting that fuses traditional telemetry, wearable metrics, and actuarial models for auditable, real-time risk decisions.
            </p>
            <div className="flex items-center gap-2">
              <span className="tech-badge text-[9px] py-0.5 px-2">
                [ACTUARIAL.V4]
              </span>
              <span className="tech-badge-cyan text-[9px] py-0.5 px-2">
                [GEMMA4:E4B]
              </span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider mb-4 text-blue-400/80">Platform</h4>
            <div className="space-y-2.5">
              {[
                { label: "Predictive Features", href: "/#features" },
                { label: "Actuarial Pipeline", href: "/#how-it-works" },
                { label: "Multi-Source Telemetry", href: "/#data-sources" },
              ].map((l) => (
                <Link key={l.label} href={l.href} className="block text-xs text-slate-400 hover:text-blue-300 no-underline transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Operations */}
          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider mb-4 text-blue-400/80">Workbench</h4>
            <div className="space-y-2.5">
              {[
                { label: "Triage Dashboard", href: "/dashboard" },
                { label: "Risk Intake Wizard", href: "/assess" },
                { label: "Portfolio Analytics", href: "/dashboard" },
              ].map((l) => (
                <Link key={l.label} href={l.href} className="block text-xs text-slate-400 hover:text-blue-300 no-underline transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Security & Regulatory */}
          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider mb-4 text-blue-400/80">Compliance</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>IRDAI Sandbox Circular 2020</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>ISO 27001 & SOC 2 Type II</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Zero-Retention Evidence Vault</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tech-divider" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <p className="font-mono text-xs text-slate-500">
            &copy; {new Date().getFullYear()} UnderwriteAI Intelligence Systems. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="tech-badge-pink text-[10px] py-0.5 px-2.5">
              PRECISION UNDERWRITING
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
