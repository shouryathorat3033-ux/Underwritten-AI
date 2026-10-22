"use client";
import { useState, useEffect } from "react";
import { useDashboardBase } from "@/lib/routes";

export default function ActionConfirmation({ overlay, onClose, onNavigate }) {
  const base = useDashboardBase();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (overlay) {
      requestAnimationFrame(() => setVisible(true));
    }
  }, [overlay]);

  if (!overlay) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const handleView = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
      if (overlay.id) onNavigate(`${base}/assessment/${overlay.id}`);
    }, 200);
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "20vh",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 440, width: "90%",
          background: "#0f0f13",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: 24,
          boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
          transform: visible ? "scale(1)" : "scale(0.95)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s",
        }}
      >
        {/* Success icon */}
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "rgba(16,185,129,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
          </svg>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fafafa", marginTop: 16, marginBottom: 4 }}>
          {overlay.entity ? `${overlay.entity.charAt(0).toUpperCase() + overlay.entity.slice(1)} Created` : "Created Successfully"}
        </h3>
        <p style={{ fontSize: 13, color: "var(--chat-text-muted)", margin: 0 }}>
          Your {overlay.entity || "item"} has been created successfully.
        </p>

        {/* Data table */}
        {overlay.data && (
          <div style={{
            marginTop: 20, borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}>
            {Object.entries(overlay.data).map(([key, val], i, arr) => (
              <div key={key} style={{
                display: "flex", justifyContent: "space-between",
                padding: "10px 14px",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}>
                <span style={{ fontSize: 11, color: "var(--chat-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {key}
                </span>
                <span style={{ fontSize: 13, color: "#fafafa" }}>
                  {String(val)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button onClick={handleClose} className="btn-secondary" style={{ flex: 1, padding: "10px 0", fontSize: 13 }}>
            Continue Chatting
          </button>
          {overlay.id && (
            <button onClick={handleView} className="btn-primary" style={{ flex: 1, padding: "10px 0", fontSize: 13 }}>
              View in Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
