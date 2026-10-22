"use client";
import { MotionConfig } from "framer-motion";

/**
 * Global motion configuration — "Zeroin AI" calm-motion aesthetic.
 * Change transition feel here and every animated child picks it up.
 */
const premiumTransition = {
  type: "spring",
  damping: 20,
  stiffness: 100,
  mass: 0.8,
};

export default function MotionProvider({ children }) {
  return (
    <MotionConfig transition={premiumTransition} reducedMotion="user">
      {children}
    </MotionConfig>
  );
}

export { premiumTransition };
