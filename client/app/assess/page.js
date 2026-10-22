"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AssessRedirect() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signup");
    else if (status === "authenticated") router.replace("/applicant/dashboard/assess");
  }, [status, router]);

  return (
    <div className="min-h-screen bg-[#070A13] flex flex-col items-center justify-center p-4">
      <div className="blueprint-card p-6 bg-[#0A0F1D] border-blue-500/20 max-w-sm w-full text-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mx-auto mb-3" />
        <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest block mb-1">
          [SYS.INTAKE_ROUTER_INITIALIZING]
        </span>
        <p className="text-xs font-mono text-slate-400">
          Routing to risk intake telemetry wizard...
        </p>
      </div>
    </div>
  );
}
