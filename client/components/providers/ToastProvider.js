"use client";
import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#1c1c24",
          color: "#fafafa",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          fontSize: "14px",
        },
        success: { iconTheme: { primary: "#10b981", secondary: "#fafafa" } },
        error: { iconTheme: { primary: "#ef4444", secondary: "#fafafa" } },
      }}
    />
  );
}
