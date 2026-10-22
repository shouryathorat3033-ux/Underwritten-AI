"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useDashboardBase } from "@/lib/routes";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const base = useDashboardBase();

  const baseItems = [
    { href: base, label: "Overview", code: "MOD.01", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    )},
  ];

  const applicantItems = [
    { href: `${base}/profile`, label: "My Profile", code: "MOD.02", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    )},
    { href: `${base}/assess`, label: "New Assessment", code: "ACT.AI", highlight: true, icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8"/>
      </svg>
    )},
    { href: `${base}/history`, label: "Assessments", code: "LOG.03", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
      </svg>
    )},
    { href: `${base}/policies`, label: "My Policies", code: "POL.04", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    )},
    { href: `${base}/claims`, label: "My Claims", code: "CLM.05", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><path d="M9 5a2 2 0 104 0M9 5a2 2 0 004 0"/><path d="M9 14l2 2 4-4"/>
      </svg>
    )},
  ];

  const underwriterItems = [
    { href: `${base}/history`, label: "Assessment Queue", code: "QUE.02", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
      </svg>
    )},
    { href: `${base}/analytics`, label: "Portfolio Analytics", code: "ANL.03", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6"/>
      </svg>
    )},
    { href: `${base}/compliance`, label: "IRDAI Compliance", code: "CMP.04", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
      </svg>
    )},
    { href: `${base}/audit`, label: "Audit Ledger", code: "AUD.05", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/>
      </svg>
    )},
    { href: `${base}/weights`, label: "Risk Weights", code: "WGT.06", highlight: true, icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    )},
  ];

  const navItems = [
    ...baseItems,
    ...(role === "underwriter" || role === "admin" ? underwriterItems : applicantItems),
  ];

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-[265px] z-40 bg-[#0a0f1d] border-r border-blue-500/20 shadow-2xl">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-blue-500/15">
        <Link href="/" className="flex items-center gap-2.5 no-underline group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 shadow-[0_0_16px_rgba(37,99,235,0.45)] border border-blue-400/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" opacity="0.3" />
              <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-[#f8fafc] text-sm tracking-tight block">
              Underwrite<span className="text-blue-500">AI</span>
            </span>
            <span className="font-mono text-[9px] text-blue-400/70 uppercase tracking-widest block">
              {role === "admin" ? "ADMIN COCKPIT" : role === "underwriter" ? "UNDERWRITER WORKBENCH" : "APPLICANT PORTAL"}
            </span>
          </div>
        </Link>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Active" />
      </div>

      {/* Navigation Subhead */}
      <div className="px-5 pt-5 pb-2">
        <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
          [NAV.WORKSPACE]
        </p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== base && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium no-underline transition-all duration-200 group ${
                isActive
                  ? "bg-gradient-to-r from-blue-600/20 via-blue-600/10 to-transparent text-white border-l-2 border-blue-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-blue-600/8 border-l-2 border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-colors ${isActive ? "text-blue-400" : "text-slate-400 group-hover:text-blue-400"}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                item.highlight
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : isActive
                  ? "bg-blue-500/20 text-blue-300"
                  : "text-slate-600 group-hover:text-slate-400"
              }`}>
                {item.code}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Telemetry Status Card & Sign out */}
      <div className="p-3 border-t border-blue-500/15 space-y-2 bg-[#070a13]/60">
        <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-950/20">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] text-blue-300 uppercase tracking-wider">MODEL STATUS</span>
            <span className="font-mono text-[9px] text-emerald-400 font-semibold">[LIVE]</span>
          </div>
          <p className="text-[11px] text-slate-300 font-medium">Gemma 4 E4B + Ensemble</p>
          <p className="font-mono text-[9px] text-slate-500 mt-0.5">LATENCY: ~2.8s | PRECISION: 99.4%</p>
        </div>

        <button
          onClick={() => { if (window.confirm("Disconnect your session?")) signOut({ callbackUrl: "/" }); }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 w-full transition-colors text-left"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          <span>Disconnect Session</span>
        </button>
      </div>
    </aside>
  );
}
