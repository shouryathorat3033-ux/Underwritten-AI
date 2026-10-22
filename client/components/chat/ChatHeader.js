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
      background: "var(--chat-header-bg)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--chat-border)",
      position: "sticky", top: 0, zIndex: 2,
    }}>
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 900, fontSize: 13,
          }}>U</div>
          <div style={{
            position: "absolute", bottom: -1, right: -1,
            width: 10, height: 10, borderRadius: "50%",
            background: "#22c55e",
            border: "2px solid var(--chat-bg)",
          }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--chat-text-primary)" }}>
            UnderwriteAI
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--chat-text-muted)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
            {pageLabel}
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", gap: 4 }}>
        <HeaderBtn title="New chat" onClick={onNewChat}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </HeaderBtn>
        <HeaderBtn title="Close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
        width: 32, height: 32, borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "transparent", border: "none",
        color: "var(--chat-btn-color)", cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--chat-btn-hover-bg)";
        e.currentTarget.style.color = "var(--chat-btn-hover-color)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--chat-btn-color)";
      }}
    >
      {children}
    </button>
  );
}
