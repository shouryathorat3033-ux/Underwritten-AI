"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  if (status === "loading" || status === "authenticated") return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", { email: email.toLowerCase(), password, redirect: false });
      if (res?.error) setError(res.error);
      else router.push("/dashboard");
    } catch { setError("Something went wrong"); }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#09090b" }}>
      {/* Left panel — immersive aurora */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col" style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}>
        {/* Aurora layers */}
        <div className="absolute inset-0 aurora-bg" style={{ opacity: 0.6 }} />
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #10b981, #34d399, transparent)", opacity: 0.5 }} />

        {/* Floating shapes with glow */}
        <div className="absolute w-[90px] h-[90px] top-[12%] left-[18%] rounded-2xl" style={{ border: "1px solid rgba(16,185,129,0.12)", background: "rgba(16,185,129,0.03)", backdropFilter: "blur(4px)", animation: "shape-drift-1 22s ease-in-out infinite" }} />
        <div className="absolute w-[70px] h-[70px] rounded-full top-[32%] right-[22%]" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.1), transparent 70%)", boxShadow: "0 0 30px rgba(16,185,129,0.08)", animation: "shape-drift-2 26s ease-in-out infinite" }} />
        <div className="absolute w-[55px] h-[55px] bottom-[28%] left-[32%] rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(4px)", animation: "shape-drift-3 20s ease-in-out infinite" }} />
        <div className="absolute w-[80px] h-[80px] rounded-full bottom-[18%] right-[12%]" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.06), transparent 70%)", boxShadow: "0 0 25px rgba(245,158,11,0.06)", animation: "shape-drift-4 28s ease-in-out infinite" }} />
        <div className="absolute w-[45px] h-[45px] top-[58%] left-[58%] rounded-lg" style={{ border: "1px solid rgba(16,185,129,0.1)", background: "rgba(16,185,129,0.02)", transform: "rotate(45deg)", animation: "shape-drift-5 24s ease-in-out infinite" }} />

        {/* Content */}
        <div className="p-8 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 2px 12px rgba(16,185,129,0.4)" }}>U</div>
            <span className="font-bold text-[#fafafa]">Underwrite<span style={{ color: "#10b981" }}>AI</span></span>
          </div>
          <p className="text-sm mt-2" style={{ color: "#a1a1aa" }}>Intelligent risk assessment platform</p>
        </div>

        <div className="px-8 mt-12 space-y-3 relative z-10">
          {["AI Risk Scoring", "Multi-Source Analysis", "Instant Decisions"].map((label, i) => (
            <div key={label} className="inline-flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-500" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(8px)", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)", transitionDelay: `${300 + i * 100}ms` }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
              <span className="text-xs font-medium" style={{ color: "#fafafa" }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 p-8 z-10">
          <p className="text-xs" style={{ color: "#52525b" }}>Secure. Intelligent. Automated.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center min-h-screen px-6">
        <div className="max-w-sm w-full" style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "all 0.6s cubic-bezier(0.23,1,0.32,1) 0.1s" }}>
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>U</div>
            <span className="font-bold text-[#fafafa]">Underwrite<span style={{ color: "#10b981" }}>AI</span></span>
          </div>

          <h2 className="text-2xl font-bold" style={{ color: "#fafafa" }}>Welcome back</h2>
          <p className="text-xs mt-1 mb-6" style={{ color: "#71717a" }}>Sign in to your account</p>

          {/* Google OAuth */}
          <button onClick={() => { setGoogleLoading(true); signIn("google", { callbackUrl: "/dashboard" }); }} disabled={googleLoading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300"
            style={{ background: "#fff", border: "1px solid #dadce0", color: "#3c4043", cursor: googleLoading ? "wait" : "pointer", opacity: googleLoading ? 0.7 : 1 }}
            onMouseEnter={(e) => { if (!googleLoading) { e.currentTarget.style.background = "#f8f8f8"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
            {googleLoading ? (
              <span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-600 inline-block" style={{ animation: "spin-anim 1s linear infinite" }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            )}
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <hr className="flex-1" style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)" }} />
            <span className="text-xs" style={{ color: "#71717a" }}>or</span>
            <hr className="flex-1" style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)" }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#a1a1aa" }}>Email</label>
              <input className="input-field" type="email" placeholder="you@example.in" value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())} required />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#a1a1aa" }}>Password</label>
              <div className="relative">
                <input className="input-field" type={showPw ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ paddingRight: "40px" }} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ background: "none", border: "none", cursor: "pointer", color: "#52525b", transition: "color 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#a1a1aa"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#52525b"}>
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl text-[13px] animate-scale-in" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-4 py-2.5">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white inline-block" style={{ animation: "spin-anim 1s linear infinite" }} />
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p className="text-xs text-center mt-4" style={{ color: "#71717a" }}>
            Don&apos;t have an account? <Link href="/signup" className="no-underline font-medium" style={{ color: "#10b981" }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
