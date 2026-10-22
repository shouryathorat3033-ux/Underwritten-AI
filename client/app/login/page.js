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
    } catch { setError("Authentication failed. Please verify credentials."); }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary, #070A13)" }}>
      {/* Left panel — Ordivalabs Technical Blueprint */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12" style={{ borderRight: "1px solid rgba(37,99,235,0.18)" }}>
        {/* Technical Blueprint Grid */}
        <div className="absolute inset-0 tech-grid-pattern opacity-60" />
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #2563EB, #60A5FA, transparent)" }} />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(37,99,235,0.18), transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(244,63,94,0.10), transparent 70%)", filter: "blur(50px)" }} />

        {/* Top telemetry bar */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)", boxShadow: "0 0 16px rgba(37,99,235,0.4)" }}>
              <span>U</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white leading-none">
                Underwrite<span style={{ color: "#60A5FA" }}>AI</span>
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-blue-300/60 mt-0.5">
                [ACTUARIAL_INTELLIGENCE]
              </span>
            </div>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono"
            style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.25)", color: "#93C5FD" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SYS.NODE: ACTIVE
          </div>
        </div>

        {/* Center Technical Blueprint Card */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono mb-6"
            style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", color: "#93C5FD" }}>
            <span className="text-blue-400">[GATEWAY.SECURE_AUTH]</span>
            <span>·</span>
            <span>HIGH-PRECISION RISK TELEMETRY</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-snug">
            Precision Underwriting & <br />
            <span style={{ background: "linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #F43F5E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Actuarial Decision Models
            </span>
          </h1>

          <p className="mt-4 text-sm text-slate-400 max-w-md leading-relaxed">
            Enterprise-grade insurance intelligence platform powered by ensemble predictive models, continuous medical-financial telemetry, and local Gemma 4 E4B reasoning.
          </p>

          {/* Scientific Telemetry Badges */}
          <div className="grid grid-cols-2 gap-3 mt-8 max-w-md">
            {[
              { label: "Predictive Precision", value: "99.4%", tag: "CALIBRATED" },
              { label: "Reasoning Core", value: "Gemma 4 E4B", tag: "LOCAL_NODE" },
              { label: "Processing Latency", value: "<1.2s", tag: "REAL_TIME" },
              { label: "IRDAI & ISO Status", value: "Compliant", tag: "AUDITED" },
            ].map((stat, i) => (
              <div key={stat.label} className="p-3 rounded-lg relative overflow-hidden"
                style={{
                  background: "rgba(14,21,38,0.7)",
                  border: "1px solid rgba(37,99,235,0.18)",
                  backdropFilter: "blur(8px)",
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(8px)",
                  transition: `all 0.5s ease ${300 + i * 80}ms`
                }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">{stat.label}</span>
                  <span className="text-[9px] font-mono px-1 rounded text-blue-400" style={{ background: "rgba(37,99,235,0.15)" }}>{stat.tag}</span>
                </div>
                <div className="text-sm font-semibold text-white font-mono">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom disclaimer */}
        <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-500 pt-6"
          style={{ borderTop: "1px solid rgba(37,99,235,0.12)" }}>
          <span>// ISO_27001 · SOC2_TYPE_II · IRDAI_READY</span>
          <span>v4.2.0-PROD</span>
        </div>
      </div>

      {/* Right panel — Ordivalabs Form */}
      <div className="flex-1 flex items-center justify-center min-h-screen px-6 py-12 relative">
        <div className="absolute inset-0 tech-grid-pattern opacity-25 lg:hidden" />
        <div className="max-w-md w-full relative z-10"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "all 0.6s cubic-bezier(0.23,1,0.32,1) 0.1s" }}>
          
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center justify-between mb-8 pb-4" style={{ borderBottom: "1px solid rgba(37,99,235,0.15)" }}>
            <Link href="/" className="flex items-center gap-2.5 no-underline">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}>U</div>
              <span className="font-bold text-white">Underwrite<span style={{ color: "#60A5FA" }}>AI</span></span>
            </Link>
            <span className="text-[10px] font-mono text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/10">
              SYS.SECURE
            </span>
          </div>

          {/* Form Card */}
          <div className="blueprint-card p-7 sm:p-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Portal Authentication</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded text-blue-300" style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)" }}>
                [AUTH.V4]
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-6 font-mono">
              Authenticate via verified actuarial or applicant credentials.
            </p>

            {/* Google OAuth button */}
            <button
              onClick={() => { setGoogleLoading(true); signIn("google", { callbackUrl: "/dashboard" }); }}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg text-xs font-semibold font-mono tracking-wider transition-all duration-300"
              style={{
                background: "rgba(14,21,38,0.9)",
                border: "1px solid rgba(37,99,235,0.25)",
                color: "#E2E8F0",
                cursor: googleLoading ? "wait" : "pointer"
              }}
              onMouseEnter={(e) => {
                if (!googleLoading) {
                  e.currentTarget.style.borderColor = "rgba(96,165,250,0.5)";
                  e.currentTarget.style.boxShadow = "0 0 16px rgba(37,99,235,0.25)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(37,99,235,0.25)";
                e.currentTarget.style.boxShadow = "none";
              }}>
              {googleLoading ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 border-t-transparent inline-block animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {googleLoading ? "INITIALIZING SESSION..." : "CONTINUE WITH GOOGLE"}
            </button>

            {/* Technical Divider */}
            <div className="flex items-center gap-3 my-5">
              <hr className="flex-1" style={{ border: "none", borderTop: "1px solid rgba(37,99,235,0.15)" }} />
              <span className="text-[10px] font-mono uppercase text-slate-500">OR CREDENTIALS</span>
              <hr className="flex-1" style={{ border: "none", borderTop: "1px solid rgba(37,99,235,0.15)" }} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-medium mb-1.5 text-slate-300">
                  WORK EMAIL <span className="text-blue-400">*</span>
                </label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="name@underwrite.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono font-medium text-slate-300">
                    PASSWORD <span className="text-blue-400">*</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    className="input-field"
                    type={showPw ? "text" : "password"}
                    placeholder="Enter security passphrase"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors"
                    style={{ background: "none", border: "none", cursor: "pointer" }}>
                    {showPw ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg text-xs font-mono animate-scale-in flex items-center gap-2"
                  style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#FB7185" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-2">
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white inline-block animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>AUTHORIZE & SIGN IN</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 flex items-center justify-between text-xs font-mono" style={{ borderTop: "1px solid rgba(37,99,235,0.12)" }}>
              <span className="text-slate-400">Need new credentials?</span>
              <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold no-underline flex items-center gap-1">
                Register account
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
