"use client";

export default function Footer() {
  return (
    <footer className="pt-16 pb-8 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)", boxShadow: "0 0 20px rgba(16,185,129,0.1)" }} />

      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-[11px]" style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 2px 8px rgba(16,185,129,0.3)" }}>U</div>
              <span className="font-bold text-sm" style={{ color: "#fafafa" }}>Underwrite<span style={{ color: "#10b981" }}>AI</span></span>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#52525b" }}>
              AI-powered insurance underwriting that fuses traditional and alternative data for faster, smarter risk decisions.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#71717a" }}>Product</h4>
            <div className="space-y-2.5">
              {[
                { label: "Features", href: "/#features" },
                { label: "How It Works", href: "/#how-it-works" },
                { label: "Data Sources", href: "/#data-sources" },
              ].map((l) => (
                <a key={l.label} href={l.href} className="block text-sm no-underline transition-all duration-300" style={{ color: "#52525b" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.paddingLeft = "4px"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#52525b"; e.currentTarget.style.paddingLeft = "0px"; }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#71717a" }}>Platform</h4>
            <div className="space-y-2.5">
              {[
                { label: "Dashboard", href: "/dashboard" },
                { label: "New Assessment", href: "/assess" },
                { label: "Analytics", href: "/dashboard" },
              ].map((l) => (
                <a key={l.label} href={l.href} className="block text-sm no-underline transition-all duration-300" style={{ color: "#52525b" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.paddingLeft = "4px"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#52525b"; e.currentTarget.style.paddingLeft = "0px"; }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#71717a" }}>Account</h4>
            <div className="space-y-2.5">
              {[
                { label: "Sign In", href: "/login" },
                { label: "Sign Up", href: "/signup" },
              ].map((l) => (
                <a key={l.label} href={l.href} className="block text-sm no-underline transition-all duration-300" style={{ color: "#52525b" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.paddingLeft = "4px"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#52525b"; e.currentTarget.style.paddingLeft = "0px"; }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="divider-glow mb-6" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs" style={{ color: "#3f3f46" }}>&copy; {new Date().getFullYear()} UnderwriteAI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs" style={{ color: "#3f3f46" }}>Intelligent Risk Assessment Platform</span>
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.06)", color: "#52525b", border: "1px solid rgba(16,185,129,0.1)" }}>
              Sponsored by Persistent Systems
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
