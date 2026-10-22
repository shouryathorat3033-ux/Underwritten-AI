"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";

/**
 * Effect #8: Magnetic button
 * The button subtly follows the cursor when hovering,
 * then snaps back when the cursor leaves.
 */
export default function MagneticButton({ children, className, style, strength = 0.35, ...props }) {
  const btnRef = useRef(null);
  const xTo = useRef(null);
  const yTo = useRef(null);

  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;

    xTo.current = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
    yTo.current = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      xTo.current(dx);
      yTo.current(dy);
    };

    const handleLeave = () => {
      xTo.current(0);
      yTo.current(0);
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [strength]);

  return (
    <div ref={btnRef} className={className} style={{ display: "inline-block", willChange: "transform", ...style }} {...props}>
      {children}
    </div>
  );
}
