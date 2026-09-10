import React from 'react';
import { motion } from 'framer-motion';

/**
 * Self-Drawing SVG Checkmark for Action Confirmations
 * Draws stroke in ~300ms on mount.
 */
export default function AnimatedCheckmark({ size = 16, className = 'text-emerald-400' }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.path
        d="M20 6L9 17L4 12"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.svg>
  );
}
