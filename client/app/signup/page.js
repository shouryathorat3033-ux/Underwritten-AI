"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
    if (!data.name || data.name.length < 2) e.name = "Name must be at least 2 characters";
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Valid email is required";
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
      if (!res.ok) { toast.error(json.error || "Signup failed"); setLoading(false); return; }
      toast.success("Account created!");
      const signInRes = await signIn("credentials", { email: data.email, password: data.password, redirect: false });
      if (signInRes?.ok) router.push("/dashboard");
    } catch { toast.error("Something went wrong"); }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#09090b" }}>
      {/* Left panel — aurora */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col" style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="absolute inset-0 aurora-bg" style={{ opacity: 0.6 }} />
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #10b981, #34d399, transparent)", opacity: 0.5 }} />

        <div className="absolute w-[90px] h-[90px] top-[12%] left-[18%] rounded-2xl" style={{ border: "1px solid rgba(16,185,129,0.12)", background: "rgba(16,185,129,0.03)", backdropFilter: "blur(4px)", animation: "shape-drift-1 22s ease-in-out infinite" }} />
        <div className="absolute w-[70px] h-[70px] rounded-full top-[32%] right-[22%]" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.1), transparent 70%)", boxShadow: "0 0 30px rgba(16,185,129,0.08)", animation: "shape-drift-2 26s ease-in-out infinite" }} />
        <div className="absolute w-[55px] h-[55px] bottom-[28%] left-[32%] rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(4px)", animation: "shape-drift-3 20s ease-in-out infinite" }} />
        <div className="absolute w-[80px] h-[80px] rounded-full bottom-[18%] right-[12%]" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.06), transparent 70%)", boxShadow: "0 0 25px rgba(245,158,11,0.06)", animation: "shape-drift-4 28s ease-in-out infinite" }} />
        <div className="absolute w-[45px] h-[45px] top-[58%] left-[58%] rounded-lg" style={{ border: "1px solid rgba(16,185,129,0.1)", background: "rgba(16,185,129,0.02)", transform: "rotate(45deg)", animation: "shape-drift-5 24s ease-in-out infinite" }} />

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

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center min-h-screen px-6">
        <div className="max-w-sm w-full" style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "all 0.6s cubic-bezier(0.23,1,0.32,1) 0.1s" }}>
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>U</div>
            <span className="font-bold text-[#fafafa]">Underwrite<span style={{ color: "#10b981" }}>AI</span></span>
          </div>

          <h2 className="text-2xl font-bold" style={{ color: "#fafafa" }}>Create your account</h2>
          <p className="text-xs mt-1 mb-6" style={{ color: "#71717a" }}>Enter your details to get started</p>

          <form onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#a1a1aa" }}>Full Name</label>
                <input className="input-field" placeholder="Rajesh Kumar" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
                {errors.name && <p className="text-xs mt-1 animate-scale-in" style={{ color: "#f87171" }}>{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#a1a1aa" }}>Email</label>
                <input className="input-field" type="email" placeholder="rajesh@example.in" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value.toLowerCase() })} />
                {errors.email && <p className="text-xs mt-1 animate-scale-in" style={{ color: "#f87171" }}>{errors.email}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#a1a1aa" }}>Password</label>
                  <input className="input-field" type="password" placeholder="Min 6 characters" value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} />
                  {data.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map(i => {
                          const strength = (data.password.length >= 6 ? 1 : 0) + (data.password.length >= 8 ? 1 : 0) + (/[A-Z]/.test(data.password) && /[a-z]/.test(data.password) ? 1 : 0) + (/\d/.test(data.password) || /[^A-Za-z0-9]/.test(data.password) ? 1 : 0);
                          const color = strength <= 1 ? "#ef4444" : strength === 2 ? "#f59e0b" : strength === 3 ? "#10b981" : "#10b981";
                          return <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ background: i <= strength ? color : "rgba(255,255,255,0.06)" }} />;
                        })}
                      </div>
                      <p className="text-[10px]" style={{ color: (() => { const s = (data.password.length >= 6 ? 1 : 0) + (data.password.length >= 8 ? 1 : 0) + (/[A-Z]/.test(data.password) && /[a-z]/.test(data.password) ? 1 : 0) + (/\d/.test(data.password) || /[^A-Za-z0-9]/.test(data.password) ? 1 : 0); return s <= 1 ? "#ef4444" : s === 2 ? "#f59e0b" : "#10b981"; })() }}>
                        {(() => { const s = (data.password.length >= 6 ? 1 : 0) + (data.password.length >= 8 ? 1 : 0) + (/[A-Z]/.test(data.password) && /[a-z]/.test(data.password) ? 1 : 0) + (/\d/.test(data.password) || /[^A-Za-z0-9]/.test(data.password) ? 1 : 0); return s <= 1 ? "Weak" : s === 2 ? "Fair" : s === 3 ? "Strong" : "Very Strong"; })()}
                      </p>
                    </div>
                  )}
                  {errors.password && <p className="text-xs mt-1 animate-scale-in" style={{ color: "#f87171" }}>{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#a1a1aa" }}>Confirm Password</label>
                  <input className="input-field" type="password" placeholder="Repeat password" value={data.confirmPassword} onChange={(e) => setData({ ...data, confirmPassword: e.target.value })} />
                  {errors.confirmPassword && <p className="text-xs mt-1 animate-scale-in" style={{ color: "#f87171" }}>{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-5 py-2.5">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white inline-block" style={{ animation: "spin-anim 1s linear infinite" }} />
                  Creating...
                </span>
              ) : "Create Account"}
            </button>
          </form>

          <p className="text-xs text-center mt-4" style={{ color: "#71717a" }}>
            Already have an account? <a href="/login" className="no-underline font-medium" style={{ color: "#10b981" }}>Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
