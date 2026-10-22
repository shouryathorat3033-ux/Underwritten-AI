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
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#data-sources", label: "Data Sources" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        height: scrolled ? 56 : 64,
        background: scrolled ? "rgba(9,9,11,0.92)" : "rgba(9,9,11,0.6)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid rgba(255,255,255,${scrolled ? "0.06" : "0.03"})`,
        boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.3)" : "none",
      }}
    >
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm transition-transform duration-200 group-hover:scale-110"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 2px 10px rgba(16,185,129,0.3)" }}
          >
            U
          </div>
          <span className="font-bold text-[#fafafa] text-base">
            Underwrite<span style={{ color: "#10b981" }}>AI</span>
          </span>
        </Link>

        {/* Center nav */}
        <div className="hidden md:flex items-center gap-1 rounded-full px-1 py-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
          {navLinks.map((link) => {
            const isActive = pathname === "/" && typeof window !== "undefined" && window.location.hash === link.href.replace("/", "");
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-sm no-underline px-4 py-1.5 rounded-full transition-all duration-200"
                style={{
                  color: isActive ? "#fafafa" : "#a1a1aa",
                  background: isActive ? "rgba(16,185,129,0.1)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#fafafa";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#a1a1aa";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {status === "authenticated" && session ? (
            <div className="flex items-center gap-3">
              <Link
                href={dashBase}
                className="btn-primary text-xs py-2 px-5 no-underline hidden sm:inline-flex items-center gap-2"
              >
                Dashboard
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
                    background: profileOpen ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                  onMouseLeave={(e) => {
                    if (!profileOpen) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}
                  >
                    {session.user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-xs font-medium hidden sm:inline" style={{ color: "#e4e4e7" }}>
                    {session.user?.name?.split(" ")[0] || "User"}
                  </span>
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round"
                    style={{ transition: "transform 0.2s", transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 top-[calc(100%+8px)] w-56 rounded-xl overflow-hidden"
                    style={{
                      background: "rgba(15,15,19,0.98)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                      animation: "scale-in 0.15s ease-out",
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-sm font-medium" style={{ color: "#fafafa" }}>{session.user?.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#71717a" }}>{session.user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href={dashBase}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm no-underline transition-colors duration-150"
                        style={{ color: "#a1a1aa" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                          e.currentTarget.style.color = "#fafafa";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#a1a1aa";
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        Dashboard
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm w-full transition-colors duration-150"
                        style={{ color: "#a1a1aa", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(239,68,68,0.06)";
                          e.currentTarget.style.color = "#f87171";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#a1a1aa";
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : status === "unauthenticated" ? (
            <>
              <Link href="/login" className="text-sm no-underline px-4 py-2 rounded-lg transition-all duration-200 hidden sm:inline-block" style={{ color: "#a1a1aa" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#fafafa"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.background = "transparent"; }}
              >
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary text-xs py-2 px-5 no-underline inline-flex items-center gap-2">
                Get Started
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </>
          ) : null}

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors duration-200"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: mobileOpen ? "rgba(255,255,255,0.06)" : "transparent", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round">
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
      <div
        className="md:hidden overflow-hidden transition-all duration-300"
        style={{
          maxHeight: mobileOpen ? 300 : 0,
          opacity: mobileOpen ? 1 : 0,
          background: "rgba(9,9,11,0.98)",
          backdropFilter: "blur(16px)",
          borderBottom: mobileOpen ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}
      >
        <div className="px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm no-underline transition-colors duration-150"
              style={{ color: "#a1a1aa" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#fafafa"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a1a1aa"; }}
            >
              {link.label}
            </Link>
          ))}
          {status !== "authenticated" && (
            <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <Link href="/login" className="btn-secondary text-xs py-2.5 px-4 no-underline flex-1 text-center">Sign In</Link>
              <Link href="/signup" className="btn-primary text-xs py-2.5 px-4 no-underline flex-1 text-center">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
