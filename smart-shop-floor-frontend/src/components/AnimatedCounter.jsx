import React, { useEffect, useState, useRef } from 'react';

/**
 * AnimatedCounter component
 * Counts up smoothly from 0 to numeric value on mount or when value changes.
 * Supports suffix/prefix (e.g., '%', '°C', ' mm/s', ' PSI', ' u/h').
 */
export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 750,
  className = '',
}) {
  const numericTarget = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;
  const [displayValue, setDisplayValue] = useState(0);
  const prevTargetRef = useRef(0);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(numericTarget);
      prevTargetRef.current = numericTarget;
      return;
    }

    const startValue = prevTargetRef.current;
    const endValue = numericTarget;
    const startTime = performance.now();

    let animationFrame;
    const updateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic [0.22, 1, 0.36, 1]
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      } else {
        setDisplayValue(endValue);
        prevTargetRef.current = endValue;
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [numericTarget, duration]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toLocaleString();

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
