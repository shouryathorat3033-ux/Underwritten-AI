"use client";
import { useChat } from "@/components/chat/ChatContext";

export default function AskAI({ question, label }) {
  const { openChat } = useChat();

  const handleClick = () => {
    openChat();
    // Dispatch event after chat panel has fully opened and mounted
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("app:chat-prefill", { detail: question }));
    }, 600);
  };

  return (
    <button onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-xs font-medium transition-all duration-200"
      style={{
        padding: "5px 12px", borderRadius: 999,
        background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)",
        color: "#10b981", cursor: "pointer", fontFamily: "inherit",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.12)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.06)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.15)"; }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z" /><path d="M10 22v-4M14 22v-4M10 18h4" />
      </svg>
      {label || "Ask AI"}
    </button>
  );
}
