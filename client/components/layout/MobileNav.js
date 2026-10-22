"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChat } from "@/components/chat/ChatContext";
import { useDashboardBase } from "@/lib/routes";

export default function MobileNav() {
  const pathname = usePathname();
  const { toggleChat, isOpen: chatOpen } = useChat();
  const base = useDashboardBase();

  const navItems = [
    {
      href: base, label: "Home",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      href: `${base}/assess`, label: "Assess",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
    },
    {
      href: `${base}/history`, label: "History",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
        </svg>
      ),
    },
    {
      href: `${base}/analytics`, label: "Analytics",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      ),
    },
    {
      href: `${base}/fairness`, label: "Fairness",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(15,15,19,0.97)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: 60 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== base && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="no-underline"
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                padding: "6px 12px", borderRadius: 10,
                color: isActive ? "#10b981" : "#71717a",
                transition: "color 0.2s",
                textDecoration: "none",
              }}
            >
              {item.icon}
              <span style={{ fontSize: 10, fontWeight: 500 }}>{item.label}</span>
            </Link>
          );
        })}

        {/* Chat button */}
        <button
          onClick={toggleChat}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            padding: "6px 12px", borderRadius: 10,
            color: chatOpen ? "#10b981" : "#71717a",
            background: "none", border: "none", cursor: "pointer",
            transition: "color 0.2s", fontFamily: "inherit",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 500 }}>AI Chat</span>
        </button>
      </div>
    </nav>
  );
}
