"use client";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useChat } from "@/components/chat/ChatContext";
import { useDashboardBase } from "@/lib/routes";

const roleConfigs = {
  underwriter: { label: "UNDERWRITER", color: "#60a5fa", border: "rgba(59,130,246,0.3)", bg: "rgba(37,99,235,0.12)" },
  admin: { label: "SYS.ADMIN", color: "#fb7185", border: "rgba(244,63,94,0.3)", bg: "rgba(244,63,94,0.12)" },
  applicant: { label: "APPLICANT", color: "#38bdf8", border: "rgba(56,189,248,0.3)", bg: "rgba(14,165,233,0.12)" },
  user: { label: "PORTAL.USER", color: "#94a3b8", border: "rgba(148,163,184,0.3)", bg: "rgba(148,163,184,0.12)" },
};

export default function DashboardNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { toggleChat, isOpen: chatOpen } = useChat();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef(null);
  const role = session?.user?.role || "user";
  const isUW = role === "underwriter" || role === "admin";
  const base = useDashboardBase();

  const routeTitles = {
    [base]: "Overview & Cockpit",
    [`${base}/history`]: "Assessment Queue",
    [`${base}/analytics`]: "Actuarial Analytics",
    [`${base}/policies`]: "Active Policies",
    [`${base}/fairness`]: "Algorithmic Fairness",
    [`${base}/weights`]: "Risk Weight Calibration",
    [`${base}/profile`]: "Identity & Profile",
    [`${base}/assess`]: "Intake & Assessment",
    [`${base}/claims`]: "Claims Adjudication",
    [`${base}/compliance`]: "Regulatory Compliance",
    [`${base}/audit`]: "Audit Ledger",
    [`${base}/fraud`]: "Fraud Diagnostics",
  };

  useEffect(() => {
    const onClick = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const pageTitle = routeTitles[pathname] || (pathname?.includes("/assessment/") ? "Assessment Intelligence Report" : "Workbench");
  const rCfg = roleConfigs[role] || roleConfigs.user;

  return (
    <>
      <nav
        className="sticky top-0 z-30 transition-all duration-300"
        style={{
          height: 58,
          background: "rgba(10, 15, 29, 0.88)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(59, 130, 246, 0.16)",
        }}
      >
        <div className="h-full flex items-center justify-between px-4 sm:px-6">
          {/* Left: Mobile hamburger & Page Title */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-blue-500/25 bg-[#070a13] text-slate-300"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                {mobileOpen ? <><line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" /></> : <><line x1="3" y1="6" x2="17" y2="6" /><line x1="5" y1="10" x2="17" y2="10" /><line x1="3" y1="14" x2="17" y2="14" /></>}
              </svg>
            </button>

            <div className="hidden lg:flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
              <h1 className="text-sm font-semibold tracking-tight text-[#f8fafc]">{pageTitle}</h1>
              {pathname?.includes("/assessment/") && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/20 bg-blue-950/40 text-blue-300">
                  REF:{pathname.split("/").pop()?.slice(0, 8)}
                </span>
              )}
            </div>

            {/* Mobile: Brand Logo */}
            <Link href={base} className="lg:hidden flex items-center gap-2 no-underline">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs bg-gradient-to-br from-blue-600 to-indigo-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]">
                U
              </div>
              <span className="font-bold text-sm text-[#f8fafc]">
                Underwrite<span className="text-blue-500">AI</span>
              </span>
            </Link>
          </div>

          {/* Right: Actions, Role Tag, Profile */}
          <div className="flex items-center gap-2.5">
            {/* AI Assistant Toggle */}
            <button
              onClick={toggleChat}
              title="AI Underwriting Assistant (Ctrl+/)"
              className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 border ${
                chatOpen
                  ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.3)]"
                  : "bg-blue-950/20 border-blue-500/20 text-slate-400 hover:text-slate-100 hover:border-blue-500/40"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </button>

            {/* Action Button */}
            <Link
              href={isUW ? `${base}/history` : `${base}/assess`}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium no-underline px-3 py-1.5 rounded-lg transition-all duration-200 bg-blue-600/15 text-blue-300 border border-blue-500/25 hover:bg-blue-600/25 hover:border-blue-500/50"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {isUW ? <><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><path d="M9 5a2 2 0 104 0M9 5a2 2 0 004 0" /></> : <path d="M12 5v14M5 12h14" />}
              </svg>
              {isUW ? "Triage Queue" : "New Assessment"}
            </Link>

            {/* Role Badge */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[10px] font-semibold tracking-wider"
              style={{ background: rCfg.bg, border: `1px solid ${rCfg.border}`, color: rCfg.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: rCfg.color }} />
              {rCfg.label}
            </div>

            {/* Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-all duration-200 bg-[#0e1526] border border-blue-500/20 hover:border-blue-500/40"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm border border-blue-400/30">
                  {session?.user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="text-xs font-medium text-slate-200 hidden sm:inline">
                  {session?.user?.name?.split(" ")[0] || "User"}
                </span>
                <svg
                  width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"
                  style={{ transition: "transform 0.2s", transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-56 rounded-xl overflow-hidden blueprint-card shadow-2xl p-1 z-50">
                  <div className="px-3.5 py-3 border-b border-blue-500/15">
                    <p className="text-sm font-semibold text-slate-100">{session?.user?.name}</p>
                    <p className="font-mono text-xs text-blue-400/80 mt-0.5 truncate">{session?.user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href={base}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-blue-600/15 rounded-lg no-underline transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                      Workbench
                    </Link>
                    <Link
                      href="/"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-blue-600/15 rounded-lg no-underline transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      Public Site
                    </Link>
                    <button
                      onClick={() => { if (window.confirm("Disconnect your session?")) signOut({ callbackUrl: "/" }); }}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg w-full transition-colors text-left"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                      </svg>
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden blueprint-card mx-4 my-2 p-3 space-y-1 z-30">
          {(isUW
            ? [{ href: base, label: "Overview" }, { href: `${base}/history`, label: "Triage Queue" }, { href: `${base}/analytics`, label: "Analytics" }, { href: `${base}/fairness`, label: "ML Fairness" }, { href: `${base}/compliance`, label: "Compliance" }]
            : [{ href: base, label: "Overview" }, { href: `${base}/history`, label: "Assessments" }, { href: `${base}/policies`, label: "Policies" }, { href: `${base}/claims`, label: "Claims" }]
          ).map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between py-2 px-3 rounded-lg text-xs font-medium no-underline ${
                  isActive ? "bg-blue-600/20 text-blue-300 border-l-2 border-blue-500" : "text-slate-300 hover:text-white"
                }`}
              >
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
