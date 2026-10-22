"use client";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 22,
      stiffness: 120,
      mass: 0.6,
    },
  },
};

/**
 * Wraps a grid/flex container — children stagger in from y:20 with opacity fade.
 * Usage: <StaggerGrid className="grid grid-cols-4 gap-4"><div>...</div></StaggerGrid>
 */
export function StaggerGrid({ children, className = "", style = {}, delay = 0 }) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={{
        ...containerVariants,
        visible: {
          transition: {
            staggerChildren: 0.07,
            delayChildren: delay,
          },
        },
      }}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

/**
 * Wraps individual items inside a StaggerGrid.
 */
export function StaggerItem({ children, className = "", style = {} }) {
  return (
    <motion.div className={className} style={style} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/**
 * A single element that fades up on mount.
 */
export function FadeUp({ children, className = "", style = {}, delay = 0 }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        damping: 22,
        stiffness: 120,
        mass: 0.6,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Section that slides in from left (sidebar → content flow).
 */
export function SlideInLeft({ children, className = "", style = {}, delay = 0 }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: "spring",
        damping: 24,
        stiffness: 100,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
