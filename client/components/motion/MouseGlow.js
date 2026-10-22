"use client";
import { useEffect, useRef } from "react";

/**
 * Mouse-following radial gradient glow that softly highlights
 * the nearest container. Renders a fixed-position overlay.
 */
export default function MouseGlow() {
  const glowRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef(null);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!raf.current) {
        raf.current = requestAnimationFrame(() => {
          el.style.background = `radial-gradient(600px circle at ${pos.current.x}px ${pos.current.y}px, rgba(16,185,129,0.04), transparent 60%)`;
          raf.current = null;
        });
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        transition: "background 0.3s ease",
      }}
    />
  );
}
