"use client";
import { useState } from "react";

export default function ExplainAI({ section, context }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);

  async function handleExplain() {
    if (explanation) {
      setOpen(!open);
      return;
    }
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, context }),
      });
      const data = await res.json();
      setExplanation(data.explanation || "Unable to generate explanation.");
    } catch {
      setExplanation("Failed to connect to AI service. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={handleExplain}
        className="inline-flex items-center gap-2 transition-all duration-200 cursor-pointer"
        style={{
          padding: "8px 16px",
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.3px",
          border: open ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(16,185,129,0.15)",
          background: open
            ? "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.06))"
            : "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))",
          color: open ? "#34d399" : "#10b981",
          boxShadow: open ? "0 0 16px rgba(16,185,129,0.1)" : "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))";
          e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)";
          e.currentTarget.style.boxShadow = "0 0 20px rgba(16,185,129,0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = open
            ? "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.06))"
            : "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))";
          e.currentTarget.style.borderColor = open ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.15)";
          e.currentTarget.style.boxShadow = open ? "0 0 16px rgba(16,185,129,0.1)" : "none";
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z" />
          <path d="M10 22v-4M14 22v-4M10 18h4" />
        </svg>
        {open ? "Hide Explanation" : "Explain with AI"}
        {!open && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        )}
      </button>

      {open && (
        <div
          style={{
            marginTop: 10,
            padding: "16px 20px",
            background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))",
            border: "1px solid rgba(16,185,129,0.12)",
            borderRadius: 12,
            borderLeft: "3px solid #10b981",
          }}
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 18,
                  height: 18,
                  border: "2px solid rgba(16,185,129,0.2)",
                  borderTopColor: "#10b981",
                  borderRadius: "50%",
                  animation: "spin-anim 0.8s linear infinite",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, color: "#71717a" }}>
                Generating explanation...
              </span>
            </div>
          ) : (
            <div className="flex gap-3">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: 2 }}
              >
                <path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z" />
                <path d="M10 22v-4M14 22v-4M10 18h4" />
              </svg>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.75,
                  color: "#d4d4d8",
                }}
              >
                {explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
