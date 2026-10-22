"use client";
import { useRef, useEffect } from "react";
import VoiceInput from "@/components/ui/VoiceInput";

export default function ChatInput({ value, onChange, onSend, loading, suggestions, onSuggestionClick }) {
  const textareaRef = useRef(null);
  const hasText = value.trim().length > 0;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (hasText && !loading) onSend();
    }
  };

  return (
    <div style={{ borderTop: "1px solid rgba(59,130,246,0.15)", padding: 12, flexShrink: 0, background: "#070A13" }}>
      {/* Quick chips */}
      {suggestions && suggestions.length > 0 && (
        <div style={{
          display: "flex", gap: 6, marginBottom: 8,
          overflowX: "auto", scrollbarWidth: "none",
        }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick(s)}
              className="px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap transition-all"
              style={{
                background: "rgba(59,130,246,0.08)",
                border: "1px solid rgba(59,130,246,0.2)",
                color: "#60A5FA",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)";
                e.currentTarget.style.background = "rgba(59,130,246,0.15)";
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(59,130,246,0.2)";
                e.currentTarget.style.background = "rgba(59,130,246,0.08)";
                e.currentTarget.style.color = "#60A5FA";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div style={{
        position: "relative", display: "flex", alignItems: "flex-end",
        borderRadius: 12,
        border: `1px solid ${hasText ? "#3B82F6" : "rgba(255,255,255,0.08)"}`,
        background: "rgba(10,15,29,0.9)",
        transition: "border-color 0.2s",
      }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= 500) onChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={loading ? "Analyzing telemetry stream..." : "Query underwriting intelligence..."}
          disabled={loading}
          style={{
            flex: 1, resize: "none", border: "none", outline: "none",
            background: "transparent", fontSize: 13, lineHeight: 1.5,
            color: "#F8FAFC",
            padding: "10px 80px 10px 14px",
            minHeight: 40, maxHeight: 120,
            fontFamily: "inherit",
          }}
        />
        <div style={{ position: "absolute", right: 44, bottom: 7 }}>
          <VoiceInput onTranscript={(text) => { onChange(text); }} disabled={loading} />
        </div>
        <button
          onClick={() => { if (hasText && !loading) onSend(); }}
          disabled={!hasText || loading}
          style={{
            position: "absolute", right: 7, bottom: 7,
            width: 30, height: 30, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", cursor: hasText && !loading ? "pointer" : "default",
            background: hasText && !loading ? "#2563EB" : "rgba(255,255,255,0.05)",
            color: hasText && !loading ? "#fff" : "#64748B",
            opacity: hasText && !loading ? 1 : 0.4,
            boxShadow: hasText && !loading ? "0 2px 10px rgba(37,99,235,0.4)" : "none",
            transition: "all 0.2s",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* Character count */}
      {value.length > 400 && (
        <div className="text-right text-[10px] font-mono mt-1 text-slate-500">
          {value.length}/500
        </div>
      )}
    </div>
  );
}
