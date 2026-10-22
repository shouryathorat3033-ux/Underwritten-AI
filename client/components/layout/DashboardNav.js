"use client";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useChat } from "@/components/chat/ChatContext";
import { useDashboardBase } from "@/lib/routes";

const roleLabels = { underwriter: "Underwriter", admin: "Admin", applicant: "Applicant", user: "User" };
const roleColors = { underwriter: "#f59e0b", admin: "#ef4444", applicant: "#10b981", user: "#10b981" };

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
    [base]: "Overview",
    [`${base}/history`]: "Assessments",
    [`${base}/analytics`]: "Analytics",
    [`${base}/policies`]: "Policies",
    [`${base}/fairness`]: "ML Fairness",
    [`${base}/weights`]: "Risk Weights",
    [`${base}/profile`]: "My Profile",
    [`${base}/assess`]: "New Assessment",
  };

  useEffect(() => {
    const onClick = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const pageTitle = routeTitles[pathname] || (pathname?.includes("/assessment/") ? "Assessment Detail" : "Dashboard");

  const initial = session?.user?.name?.[0]?.toUpperCase() || "U";
  const rColor = roleColors[role] || "#10b981";

  return (
    <>
      <nav
        className="sticky top-0 z-30 transition-all duration-300"
        style={{
          height: 56,
          background: "rgba(9,9,11,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="h-full flex items-center justify-between px-4 sm:px-6">
          {/* Left — Mobile logo + page title */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ background: mobileOpen ? "rgba(255,255,255,0.06)" : "transparent", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round">
                {mobileOpen ? <><line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" /></> : <><line x1="3" y1="6" x2="17" y2="6" /><line x1="5" y1="10" x2="17" y2="10" /><line x1="3" y1="14" x2="17" y2="14" /></>}
              </svg>
            </button>

            <div className="hidden lg:flex items-center gap-2">
              <h1 className="text-sm font-semibold" style={{ color: "#fafafa" }}>{pageTitle}</h1>
              {pathname?.includes("/assessment/") && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "#52525b" }}>
                  {pathname.split("/").pop()?.slice(0, 8)}...
                </span>
              )}
            </div>

            {/* Mobile: Logo */}
            <Link href={base} className="lg:hidden flex items-center gap-2 no-underline">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>U</div>
              <span className="font-bold text-sm" style={{ color: "#fafafa" }}>Underwrite<span style={{ color: "#10b981" }}>AI</span></span>
            </Link>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-2">
            {/* AI Chat button */}
            <button onClick={toggleChat} title="AI Chat (Ctrl+/)"
              className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
              style={{ background: chatOpen ? "rgba(16,185,129,0.12)" : "transparent", border: `1px solid ${chatOpen ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.06)"}`, color: chatOpen ? "#10b981" : "#71717a", cursor: "pointer" }}
              onMouseEnter={(e) => { if (!chatOpen) { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}
              onMouseLeave={(e) => { if (!chatOpen) { e.currentTarget.style.color = "#71717a"; e.currentTarget.style.background = "transparent"; } }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
              {/* Ping dot */}
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.5)", animation: "breathe 2s ease-in-out infinite" }} />
            </button>

            {/* CTA — New Assessment (applicant) or Review Queue (underwriter) */}
            <Link href={isUW ? `${base}/history` : `${base}/assess`}
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold no-underline px-3 py-1.5 rounded-lg transition-all duration-200 relative"
              style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.15)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.15)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.1)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.15)"; }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {isUW ? <><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><path d="M9 5a2 2 0 104 0M9 5a2 2 0 004 0" /></> : <path d="M12 5v14M5 12h14" />}
              </svg>
              {isUW ? "Review" : "New Assessment"}
            </Link>

            {/* Role badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: `${rColor}08`, border: `1px solid ${rColor}12` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: rColor }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: rColor }}>{roleLabels[role]}</span>
            </div>

            {/* Profile dropdown */}
            <div ref={profileRef} className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-all duration-200"
                style={{ background: profileOpen ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                onMouseLeave={(e) => { if (!profileOpen) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}>{initial}</div>
                <span className="text-xs font-medium hidden sm:inline" style={{ color: "#e4e4e7" }}>{session?.user?.name?.split(" ")[0] || "User"}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round"
                  style={{ transition: "transform 0.2s", transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-52 rounded-xl overflow-hidden" style={{ background: "rgba(15,15,19,0.98)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "scale-in 0.12s ease-out" }}>
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-sm font-medium" style={{ color: "#fafafa" }}>{session?.user?.name}</p>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: "#52525b" }}>{session?.user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link href={base} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm no-underline transition-colors duration-150" style={{ color: "#a1a1aa" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#fafafa"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a1a1aa"; }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                      Dashboard
                    </Link>
                    <Link href="/" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm no-underline transition-colors duration-150" style={{ color: "#a1a1aa" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#fafafa"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a1a1aa"; }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                      Home
                    </Link>
                    <button onClick={() => { if (window.confirm("Are you sure you want to sign out?")) signOut({ callbackUrl: "/" }); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm w-full transition-colors duration-150"
                      style={{ color: "#a1a1aa", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; e.currentTarget.style.color = "#f87171"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a1a1aa"; }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      <div
        className="lg:hidden overflow-hidden transition-all duration-300 sticky top-14 z-20"
        style={{
          maxHeight: mobileOpen ? 400 : 0,
          opacity: mobileOpen ? 1 : 0,
          background: "rgba(9,9,11,0.98)",
          backdropFilter: "blur(16px)",
          borderBottom: mobileOpen ? "1px solid rgba(255,255,255,0.04)" : "none",
        }}
      >
        <div className="px-4 py-3 space-y-0.5">
          {(isUW
            ? [{ href: base, label: "Overview" }, { href: `${base}/history`, label: "Review Queue" }, { href: `${base}/analytics`, label: "Analytics" }, { href: `${base}/fairness`, label: "ML Fairness" }]
            : [{ href: base, label: "Overview" }, { href: `${base}/history`, label: "Assessments" }, { href: `${base}/policies`, label: "Policies" }, { href: `${base}/analytics`, label: "Analytics" }]
          ).map(link => {
            const isActive = pathname === link.href || (link.href !== base && pathname?.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm no-underline transition-colors duration-150"
                style={{ color: isActive ? "#34d399" : "#a1a1aa", background: isActive ? "rgba(16,185,129,0.06)" : "transparent" }}>
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <Link href={isUW ? `${base}/history` : `${base}/assess`} onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium no-underline" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399" }}>
              {isUW ? "Review Queue" : "New Assessment"}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
