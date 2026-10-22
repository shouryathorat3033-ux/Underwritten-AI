"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SignupPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "applicant" });
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  if (status === "loading" || status === "authenticated") return null;

  const validate = () => {
    const e = {};
    if (!data.name || data.name.length < 2) e.name = "Full name must be at least 2 characters";
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Valid corporate or personal email required";
    if (!data.password || data.password.length < 6) e.password = "Password must be at least 6 characters";
    if (data.password !== data.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password, role: data.role }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Registration rejected"); setLoading(false); return; }
      toast.success("Account provisioned successfully");
      const signInRes = await signIn("credentials", { email: data.email, password: data.password, redirect: false });
      if (signInRes?.ok) router.push("/dashboard");
    } catch { toast.error("Provisioning failure occurred"); }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary, #070A13)" }}>
      {/* Left panel — Ordivalabs Blueprint */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12" style={{ borderRight: "1px solid rgba(37,99,235,0.18)" }}>
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
            SYS.PROVISIONING: READY
          </div>
        </div>

        {/* Center Technical Blueprint Card */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono mb-6"
            style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", color: "#93C5FD" }}>
            <span className="text-blue-400">[ONBOARDING.V4]</span>
            <span>·</span>
            <span>ZERO-BIAS RISK SCORING ENGINES</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-snug">
            Automate Actuarial Workflows & <br />
            <span style={{ background: "linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #F43F5E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Instant Evidence Extraction
            </span>
          </h1>

          <p className="mt-4 text-sm text-slate-400 max-w-md leading-relaxed">
            Join enterprise insurance carriers, underwriters, and policyholders leveraging high-precision multi-dimensional risk assessment.
          </p>

          {/* Workflow steps */}
          <div className="space-y-3 mt-8 max-w-md">
            {[
              { step: "01", title: "Continuous Risk Ingestion", desc: "Digital health records, banking statements, and credit telemetry." },
              { step: "02", title: "Explainable Actuarial Reasoning", desc: "Local Gemma 4 E4B synthesizes citations and confidence scores." },
              { step: "03", title: "Automated Policy Issuance", desc: "Instant premium calibration backed by algorithmic audit trails." },
            ].map((item, i) => (
              <div key={item.step} className="p-3 rounded-lg flex items-start gap-3.5"
                style={{
                  background: "rgba(14,21,38,0.6)",
                  border: "1px solid rgba(37,99,235,0.15)",
                  backdropFilter: "blur(6px)",
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(8px)",
                  transition: `all 0.5s ease ${300 + i * 80}ms`
                }}>
                <span className="font-mono text-xs font-bold px-2 py-1 rounded text-blue-400" style={{ background: "rgba(37,99,235,0.12)" }}>
                  {item.step}
                </span>
                <div>
                  <div className="text-xs font-semibold text-white tracking-tight">{item.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom disclaimer */}
        <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-500 pt-6"
          style={{ borderTop: "1px solid rgba(37,99,235,0.12)" }}>
          <span>// END-TO-END 256-BIT ENCRYPTION</span>
          <span>ENTERPRISE_TIER</span>
        </div>
      </div>

      {/* Right panel — Form */}
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
              PROVISIONING
            </span>
          </div>

          {/* Form Card */}
          <div className="blueprint-card p-7 sm:p-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded text-blue-300" style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)" }}>
                [REG.V4]
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-6 font-mono">
              Provision a verified risk assessment profile.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono font-medium mb-1.5 text-slate-300">
                  FULL NAME <span className="text-blue-400">*</span>
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                />
                {errors.name && <p className="text-xs mt-1 font-mono text-rose-400">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-mono font-medium mb-1.5 text-slate-300">
                  EMAIL ADDRESS <span className="text-blue-400">*</span>
                </label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="rajesh@enterprise.in"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value.toLowerCase() })}
                />
                {errors.email && <p className="text-xs mt-1 font-mono text-rose-400">{errors.email}</p>}
              </div>

              {/* Role selection */}
              <div>
                <label className="block text-xs font-mono font-medium mb-1.5 text-slate-300">
                  WORKSPACE ROLE <span className="text-blue-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "applicant", label: "Applicant", tag: "CONSUMER" },
                    { id: "underwriter", label: "Underwriter", tag: "ANALYST" },
                  ].map((r) => {
                    const active = data.role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setData({ ...data, role: r.id })}
                        className="p-2.5 rounded-lg text-left transition-all font-mono"
                        style={{
                          background: active ? "rgba(37,99,235,0.2)" : "rgba(14,21,38,0.7)",
                          border: active ? "1px solid rgba(96,165,250,0.6)" : "1px solid rgba(37,99,235,0.2)",
                          boxShadow: active ? "0 0 14px rgba(37,99,235,0.25)" : "none",
                        }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{r.label}</span>
                          <span className="text-[9px] px-1 rounded text-blue-300" style={{ background: "rgba(37,99,235,0.2)" }}>{r.tag}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Password row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-mono font-medium mb-1.5 text-slate-300">
                    PASSWORD <span className="text-blue-400">*</span>
                  </label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="Min 6 characters"
                    value={data.password}
                    onChange={(e) => setData({ ...data, password: e.target.value })}
                  />
                  {data.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map(i => {
                          const strength = (data.password.length >= 6 ? 1 : 0) + (data.password.length >= 8 ? 1 : 0) + (/[A-Z]/.test(data.password) && /[a-z]/.test(data.password) ? 1 : 0) + (/\d/.test(data.password) || /[^A-Za-z0-9]/.test(data.password) ? 1 : 0);
                          const color = strength <= 1 ? "#F43F5E" : strength === 2 ? "#F59E0B" : "#2563EB";
                          return <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ background: i <= strength ? color : "rgba(255,255,255,0.08)" }} />;
                        })}
                      </div>
                      <p className="text-[10px] font-mono text-slate-400">
                        {(() => {
                          const s = (data.password.length >= 6 ? 1 : 0) + (data.password.length >= 8 ? 1 : 0) + (/[A-Z]/.test(data.password) && /[a-z]/.test(data.password) ? 1 : 0) + (/\d/.test(data.password) || /[^A-Za-z0-9]/.test(data.password) ? 1 : 0);
                          return s <= 1 ? "CALIBRATION: WEAK" : s === 2 ? "CALIBRATION: FAIR" : s === 3 ? "CALIBRATION: STRONG" : "CALIBRATION: MAXIMUM";
                        })()}
                      </p>
                    </div>
                  )}
                  {errors.password && <p className="text-xs mt-1 font-mono text-rose-400">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium mb-1.5 text-slate-300">
                    REPEAT <span className="text-blue-400">*</span>
                  </label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="Confirm password"
                    value={data.confirmPassword}
                    onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
                  />
                  {errors.confirmPassword && <p className="text-xs mt-1 font-mono text-rose-400">{errors.confirmPassword}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-4">
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white inline-block animate-spin" />
                    <span>PROVISIONING ACCOUNT...</span>
                  </>
                ) : (
                  <>
                    <span>INITIALIZE & REGISTER</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 flex items-center justify-between text-xs font-mono" style={{ borderTop: "1px solid rgba(37,99,235,0.12)" }}>
              <span className="text-slate-400">Existing credential holder?</span>
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold no-underline flex items-center gap-1">
                Access Portal
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
