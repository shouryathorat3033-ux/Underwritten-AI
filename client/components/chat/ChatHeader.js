"use client";
import { usePathname } from "next/navigation";
import { getPageLabel } from "./utils";

export default function ChatHeader({ onNewChat, onClose }) {
  const pathname = usePathname();
  const pageLabel = getPageLabel(pathname);

  return (
    <div style={{
      height: 56, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 16px",
      background: "rgba(10,15,29,0.95)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(59,130,246,0.15)",
      position: "sticky", top: 0, zIndex: 2,
    }}>
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 900, fontSize: 13,
            border: "1px solid rgba(59,130,246,0.3)",
            boxShadow: "0 0 15px rgba(37,99,235,0.3)",
          }}>
            AI
          </div>
          <div style={{
            position: "absolute", bottom: -2, right: -2,
            width: 10, height: 10, borderRadius: "50%",
            background: "#3B82F6",
            border: "2px solid #070A13",
          }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", fontFamily: "var(--font-sans, inherit)" }}>
            UnderwriteAI Co-Pilot
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontFamily: "monospace", color: "#60A5FA" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#3B82F6", boxShadow: "0 0 6px #3B82F6" }} />
            [{pageLabel.toUpperCase()}]
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", gap: 4 }}>
        <HeaderBtn title="New Session" onClick={onNewChat}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </HeaderBtn>
        <HeaderBtn title="Dismiss" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </HeaderBtn>
      </div>
    </div>
  );
}

function HeaderBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 30, height: 30, borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        color: "#94A3B8", cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(59,130,246,0.15)";
        e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
        e.currentTarget.style.color = "#FFFFFF";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.color = "#94A3B8";
      }}
    >
      {children}
    </button>
  );
}
