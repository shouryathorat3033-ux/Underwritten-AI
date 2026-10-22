"use client";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useDashboardBase } from "@/lib/routes";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const dashBase = useDashboardBase();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const isDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/applicant/") || pathname?.startsWith("/admin/");
  if (isDashboard) return null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#how-it-works", label: "Architecture" },
    { href: "/#data-sources", label: "Telemetry & Data" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        height: scrolled ? 58 : 66,
        background: scrolled ? "rgba(7, 10, 19, 0.94)" : "rgba(7, 10, 19, 0.65)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid rgba(59, 130, 246, ${scrolled ? "0.22" : "0.12"})`,
        boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(37,99,235,0.08)" : "none",
      }}
    >
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 h-full flex items-center justify-between">
        {/* Ordivalabs Scientific Brand Mark */}
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <div className="relative w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 shadow-[0_0_20px_rgba(37,99,235,0.45)] border border-blue-400/30 transition-transform duration-300 group-hover:scale-105">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" opacity="0.3" />
              <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#f8fafc] text-[15px] tracking-tight">
                Underwrite<span className="text-blue-500">AI</span>
              </span>
              <span className="tech-badge-cyan text-[9px] py-0 px-1.5 hidden sm:inline-flex">
                SYS.V4
              </span>
            </div>
            <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest hidden sm:block">
              Actuarial Intelligence
            </span>
          </div>
        </Link>

        {/* Center Nav — Precision Pill */}
        <div className="hidden md:flex items-center gap-1 rounded-full p-1 bg-[#0a0f1d]/80 border border-blue-500/20 shadow-inner backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = pathname === "/" && typeof window !== "undefined" && window.location.hash === link.href.replace("/", "");
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-xs font-medium no-underline px-4 py-1.5 rounded-full transition-all duration-200"
                style={{
                  color: isActive ? "#ffffff" : "#94a3b8",
                  background: isActive ? "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(59,130,246,0.15))" : "transparent",
                  border: isActive ? "1px solid rgba(59,130,246,0.4)" : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#f8fafc";
                    e.currentTarget.style.background = "rgba(59,130,246,0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#94a3b8";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {status === "authenticated" && session ? (
            <div className="flex items-center gap-3">
              <Link
                href={dashBase}
                className="btn-primary text-xs py-2 px-5 no-underline hidden sm:inline-flex"
              >
                Workbench
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Profile dropdown */}
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-all duration-200"
                  style={{
                    background: profileOpen ? "rgba(37,99,235,0.15)" : "rgba(14,21,38,0.8)",
                    border: `1px solid rgba(59,130,246,${profileOpen ? "0.45" : "0.2"})`,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm border border-blue-400/30">
                    {session.user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-xs font-medium text-slate-200 hidden sm:inline">
                    {session.user?.name?.split(" ")[0] || "User"}
                  </span>
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"
                    style={{ transition: "transform 0.2s", transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-60 rounded-xl overflow-hidden blueprint-card shadow-2xl p-1 z-50">
                    <div className="px-3.5 py-3 border-b border-blue-500/15">
                      <p className="text-sm font-semibold text-slate-100">{session.user?.name}</p>
                      <p className="font-mono text-xs text-blue-400/80 mt-0.5 truncate">{session.user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href={dashBase}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-blue-600/15 rounded-lg no-underline transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        Underwriting Dashboard
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg w-full transition-colors text-left"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                        </svg>
                        Disconnect Session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : status === "unauthenticated" ? (
            <>
              <Link
                href="/login"
                className="text-xs font-medium text-slate-300 hover:text-white px-3.5 py-2 rounded-lg transition-colors hidden sm:inline-block border border-transparent hover:border-blue-500/20"
              >
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary text-xs py-2 px-5 no-underline">
                Launch Portal
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </>
          ) : null}

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-blue-500/25 bg-[#0a0f1d] text-slate-300"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              {mobileOpen ? (
                <><line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" /></>
              ) : (
                <><line x1="3" y1="6" x2="17" y2="6" /><line x1="5" y1="10" x2="17" y2="10" /><line x1="3" y1="14" x2="17" y2="14" /></>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden blueprint-card mx-4 mt-2 p-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2 px-3 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-blue-600/10 no-underline"
            >
              {link.label}
            </Link>
          ))}
          {status !== "authenticated" && (
            <div className="flex gap-2 pt-3 border-t border-blue-500/20">
              <Link href="/login" className="btn-secondary text-xs py-2 flex-1 text-center">Sign In</Link>
              <Link href="/signup" className="btn-primary text-xs py-2 flex-1 text-center">Launch Portal</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
