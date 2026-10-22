import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative" style={{ background: "var(--bg-primary, #070A13)" }}>
      <div className="absolute inset-0 tech-grid-pattern opacity-40 pointer-events-none" />
      <div className="blueprint-card max-w-md w-full p-8 text-center relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono text-rose-300 border border-rose-500/30 bg-rose-500/10 mb-4">
          [ERR.404: VECTOR_NOT_RESOLVED]
        </div>
        <h1 className="font-mono text-7xl font-extrabold mb-2 tracking-tighter" style={{ color: "#60A5FA" }}>
          404
        </h1>
        <div className="text-base font-semibold text-white mb-2">Diagnostic Exception: Route Unreachable</div>
        <p className="text-xs font-mono text-slate-400 mb-6 leading-relaxed">
          The requested actuarial endpoint or document artifact could not be located in the current workspace cluster.
        </p>
        <Link href="/" className="btn-primary no-underline inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-mono">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          <span>RETURN TO DASHBOARD</span>
        </Link>
      </div>
    </div>
  );
}
