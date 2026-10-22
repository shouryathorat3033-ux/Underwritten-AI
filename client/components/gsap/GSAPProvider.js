"use client";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Registers GSAP plugins once and handles cleanup on unmount.
 * Place this at the top of any page that uses GSAP ScrollTrigger.
 */
export default function GSAPProvider({ children }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Refresh triggers after all images/fonts load
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return children;
}
