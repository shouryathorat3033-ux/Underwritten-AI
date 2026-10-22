"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import DashboardNav from "@/components/layout/DashboardNav";
import { useChat } from "@/components/chat/ChatContext";
import MotionProvider from "@/components/motion/MotionProvider";
import MouseGlow from "@/components/motion/MouseGlow";

export default function AdminDashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isOpen: chatOpen } = useChat();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated") {
      const role = session?.user?.role;
      if (role !== "underwriter" && role !== "admin") {
        router.replace("/applicant/dashboard");
      }
    }
  }, [status, session, router]);

  if (status === "loading" || status === "unauthenticated") return null;
  const role = session?.user?.role;
  if (role !== "underwriter" && role !== "admin") return null;

  return (
    <MotionProvider>
      <div className="min-h-screen relative" style={{ background: "#09090b" }}>
        <MouseGlow />
        <Sidebar />
        <div
          className="lg:ml-[260px] flex flex-col min-h-screen relative"
          style={{
            marginRight: chatOpen ? 480 : 0,
            transition: "margin-right 0.45s cubic-bezier(0.23, 1, 0.32, 1)",
            zIndex: 1,
          }}
        >
          <DashboardNav />
          <main
            style={{
              flex: 1,
              padding: "24px",
              paddingBottom: 80,
              overflowX: "hidden",
            }}
          >
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </MotionProvider>
  );
}
