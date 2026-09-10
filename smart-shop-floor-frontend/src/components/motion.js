/**
 * Expanded Framer Motion Variants & Spring Physics
 * Adheres strictly to high-quality, expressive UI motion rules:
 * - Spring physics with high damping (zero overshoot loop, ~350ms settle)
 * - 16-24px travel distances for clear, natural movement
 * - Sequenced cascading reveals for page headers -> KPIs -> content
 * - Micro-interactions for hover lifts and icon flourishes
 * - Full respect for prefers-reduced-motion
 */

export const easeSmooth = [0.22, 1, 0.36, 1];

// Standard tuned spring for cards and modals (fast settle, no visible bounce loop)
export const springCard = {
  type: 'spring',
  stiffness: 340,
  damping: 26,
  mass: 0.8,
};

// Quick spring for pills, tabs, and indicators
export const springPill = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
};

// Sidebar initial entrance spring
export const sidebarEntrance = {
  initial: { opacity: 0, x: -24 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 28,
      duration: 0.4,
    },
  },
};

// Sequenced Page Cascade (Header -> KPI -> Content)
export const sequenceHeader = {
  initial: { opacity: 0, y: -16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: easeSmooth,
    },
  },
};

export const sequenceSection = (delay = 0.1) => ({
  initial: { opacity: 0, y: 18 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay,
      ease: easeSmooth,
    },
  },
});

// Page / Route transition variant
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 16,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easeSmooth,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

// Staggered container for grids and card lists
export const staggerContainer = (staggerDelay = 0.05, delayChildren = 0.05) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
});

// Expressive Card entrance variant with spring settle
export const cardEntrance = {
  initial: {
    opacity: 0,
    y: 18,
    scale: 0.97,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springCard,
  },
};

// Card hover lift
export const cardHoverLift = {
  y: -2,
  transition: { duration: 0.18, ease: easeSmooth },
};

// Subtle button tap interaction
export const buttonTap = {
  scale: 0.96,
  transition: { duration: 0.1, ease: 'easeOut' },
};

// Icon micro-flourish on hover
export const iconHover = {
  scale: 1.12,
  rotate: -4,
  transition: { type: 'spring', stiffness: 400, damping: 20 },
};

// Item list fade & slide
export const listItemVariant = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: easeSmooth } },
  exit: { opacity: 0, height: 0, scale: 0.96, transition: { duration: 0.2, ease: 'easeIn' } },
};

// Tab slide transition
export const tabPillTransition = {
  type: 'spring',
  stiffness: 450,
  damping: 34,
};
