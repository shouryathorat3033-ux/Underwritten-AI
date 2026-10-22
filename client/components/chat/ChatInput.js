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
    <div style={{ borderTop: "1px solid var(--chat-border)", padding: 12, flexShrink: 0 }}>
      {/* Quick chips */}
      {suggestions && suggestions.length > 0 && (
        <div style={{
          display: "flex", gap: 8, marginBottom: 8,
          overflowX: "auto", scrollbarWidth: "none",
        }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => onSuggestionClick(s)} style={{
              padding: "6px 12px", borderRadius: 999,
              fontSize: 12, whiteSpace: "nowrap",
              background: "var(--chat-chip-bg)",
              border: "1px solid var(--chat-chip-border)",
              color: "var(--chat-chip-text)",
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)"; e.currentTarget.style.color = "#10b981"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--chat-chip-border)"; e.currentTarget.style.color = "var(--chat-chip-text)"; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div style={{
        position: "relative", display: "flex", alignItems: "flex-end",
        borderRadius: 16,
        border: `1px solid ${hasText ? "rgba(16,185,129,0.5)" : "var(--chat-input-border)"}`,
        background: "var(--chat-input-bg)",
        transition: "border-color 0.2s",
      }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= 500) onChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={loading ? "Thinking..." : "Ask anything..."}
          disabled={loading}
          style={{
            flex: 1, resize: "none", border: "none", outline: "none",
            background: "transparent", fontSize: 14, lineHeight: 1.5,
            color: "var(--chat-input-text)",
            padding: "10px 80px 10px 14px",
            minHeight: 40, maxHeight: 120,
            fontFamily: "inherit",
          }}
        />
        <div style={{ position: "absolute", right: 44, bottom: 8 }}>
          <VoiceInput onTranscript={(text) => { onChange(text); }} disabled={loading} />
        </div>
        <button
          onClick={() => { if (hasText && !loading) onSend(); }}
          disabled={!hasText || loading}
          style={{
            position: "absolute", right: 8, bottom: 8,
            width: 32, height: 32, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", cursor: hasText && !loading ? "pointer" : "default",
            background: hasText && !loading ? "#10b981" : "var(--chat-send-bg)",
            color: hasText && !loading ? "#fff" : "var(--chat-text-muted)",
            opacity: hasText && !loading ? 1 : 0.3,
            boxShadow: hasText && !loading ? "0 2px 10px rgba(16,185,129,0.35)" : "none",
            transition: "all 0.2s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* Character count */}
      {value.length > 400 && (
        <div style={{
          textAlign: "right", fontSize: 10, marginTop: 4,
          color: value.length > 450 ? "#f87171" : "var(--chat-text-muted)",
        }}>
          {value.length}/500
        </div>
      )}
    </div>
  );
}
