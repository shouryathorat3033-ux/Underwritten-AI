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
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider transition-all duration-200 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 cursor-pointer"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z" />
        <path d="M10 22v-4M14 22v-4M10 18h4" />
      </svg>
      <span>[{label || "QUERY_AI"}]</span>
    </button>
  );
}
