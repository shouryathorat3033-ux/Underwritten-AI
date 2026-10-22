"use client";
import FormattedText from "./FormattedText";

export default function ChatMessage({ message, isLatest, onRetry }) {
  if (message.role === "system") {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
        <div style={{
          padding: "4px 12px", borderRadius: 999,
          fontSize: 11, color: "var(--chat-text-muted)",
          background: "var(--chat-system-bg)",
          border: "1px solid var(--chat-border)",
        }}>
          {message.content}
        </div>
      </div>
    );
  }

  const isUser = message.role === "user";
  const animStyle = isLatest ? { animation: "chat-msg-in 0.3s cubic-bezier(0.16,1,0.3,1)" } : {};

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 16px", marginBottom: 12, ...animStyle }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: "row-reverse", maxWidth: "85%" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "var(--chat-user-avatar-bg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", flexShrink: 0,
          }}>
            Y
          </div>
          <div style={{
            padding: "10px 16px",
            borderRadius: "18px 18px 4px 18px",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#fff", fontSize: 13.5, lineHeight: 1.55,
            boxShadow: "0 2px 8px rgba(16,185,129,0.2)",
            wordBreak: "break-word",
          }}>
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // Assistant
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", padding: "0 16px", marginBottom: 12, ...animStyle }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, maxWidth: "90%" }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, #10b981, #059669)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 10, fontWeight: 900,
        }}>
          U
        </div>
        <div style={{
          position: "relative", paddingLeft: 16, paddingRight: 8,
          ...(message.error ? {
            border: "1px solid rgba(239,68,68,0.2)",
            background: "rgba(239,68,68,0.04)",
            borderRadius: 12, padding: "10px 14px",
          } : {}),
        }}>
          {!message.error && (
            <div style={{
              position: "absolute", left: 0, top: 8, bottom: 8,
              width: 2, borderRadius: 1,
              background: "linear-gradient(to bottom, #10b981, transparent)",
            }} />
          )}
          <FormattedText text={message.content} />
          {message.error && onRetry && (
            <button
              onClick={onRetry}
              style={{
                marginTop: 8, fontSize: 12, color: "#10b981",
                background: "none", border: "none", cursor: "pointer",
                padding: 0, fontFamily: "inherit",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "0 16px", marginBottom: 12 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: "linear-gradient(135deg, #10b981, #059669)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 10, fontWeight: 900,
      }}>
        U
      </div>
      <div style={{ display: "flex", gap: 6, padding: "12px 16px" }}>
        {[0, 160, 320].map((delay) => (
          <div key={delay} style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--chat-text-muted)",
            animation: `thinking-pulse 1.4s ease-in-out infinite`,
            animationDelay: `${delay}ms`,
          }} />
        ))}
      </div>
    </div>
  );
}
