"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Effect #4: Scroll-linked progress bar
 * A thin gradient bar at the very top of the viewport that fills
 * as the user scrolls down the page.
 */
export default function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.to(barRef.current, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={barRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: 3,
        transformOrigin: "left center",
        transform: "scaleX(0)",
        background: "linear-gradient(90deg, #10b981, #34d399, #f59e0b, #10b981)",
        backgroundSize: "200% 100%",
        animation: "gradient-text-shift 4s linear infinite",
        zIndex: 9999,
        pointerEvents: "none",
        borderRadius: "0 2px 2px 0",
        boxShadow: "0 0 12px rgba(16,185,129,0.5), 0 0 24px rgba(16,185,129,0.2)",
      }}
    />
  );
}
