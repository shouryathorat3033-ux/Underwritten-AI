"use client";

const capabilities = [
  { icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  ), label: "Risk Analysis" },
  { icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ), label: "Ask Questions" },
  { icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ), label: "Create Assessments" },
  { icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
    </svg>
  ), label: "Navigate & Search" },
];

export default function ChatEmptyState({ suggestions, suggestionsLoading, onSuggestionClick }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 24px",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: "linear-gradient(135deg, #10b981, #059669)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 24, fontWeight: 900,
        boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
      }}>
        U
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fafafa", marginTop: 16, marginBottom: 4 }}>
        How can I help?
      </h3>
      <p style={{ fontSize: 13, color: "var(--chat-text-muted)", margin: 0 }}>
        Your AI underwriting assistant
      </p>

      {/* Capabilities */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
        marginTop: 28, width: "100%", maxWidth: 340,
      }}>
        {capabilities.map((cap) => (
          <div key={cap.label} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: 12, borderRadius: 12,
            background: "rgba(16,185,129,0.05)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            {cap.icon}
            <span style={{ fontSize: 12, fontWeight: 500, color: "#fafafa" }}>{cap.label}</span>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24, width: "100%", maxWidth: 340 }}>
        {suggestionsLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              border: "2px solid rgba(16,185,129,0.2)",
              borderTopColor: "#10b981",
              animation: "spin-anim 1s linear infinite",
            }} />
          </div>
        ) : (
          suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick(s)}
              style={{
                width: "100%", textAlign: "left",
                padding: "12px 16px", borderRadius: 12,
                background: "var(--chat-chip-bg)",
                border: "1px solid var(--chat-chip-border)",
                color: "var(--chat-text)", fontSize: 13,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)";
                e.currentTarget.style.background = "rgba(16,185,129,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--chat-chip-border)";
                e.currentTarget.style.background = "var(--chat-chip-bg)";
              }}
            >
              <span>{s}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--chat-text-muted)" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
