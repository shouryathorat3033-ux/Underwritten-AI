"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getDashboardBase } from "@/lib/routes";

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated") {
      const base = getDashboardBase(session?.user?.role);
      router.replace(base);
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen bg-[#070A13] flex flex-col items-center justify-center p-4">
      <div className="blueprint-card p-6 bg-[#0A0F1D] border-blue-500/20 max-w-sm w-full text-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mx-auto mb-3" />
        <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest block mb-1">
          [SYS.ROUTER_RESOLVING_PRINCIPAL]
        </span>
        <p className="text-xs font-mono text-slate-400">
          Routing to authorized role cockpit...
        </p>
      </div>
    </div>
  );
}
