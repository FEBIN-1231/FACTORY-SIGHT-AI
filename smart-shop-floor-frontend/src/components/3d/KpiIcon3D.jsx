import React from 'react';
import { motion } from 'framer-motion';

/**
 * High-performance 3D-styled isometric animated KPI icon.
 * Employs hardware-accelerated CSS 3D transforms and radial glowing halos
 * to deliver rich visual depth without exhausting browser WebGL context limits.
 */
export default function KpiIcon3D({ type = 'gear', color = '#FE4B4A', size = 'w-10 h-10' }) {
  return (
    <div className={`relative ${size} flex-shrink-0 select-none pointer-events-none flex items-center justify-center`}>
      {/* Ambient Radial Glow */}
      <div
        className="absolute inset-1 rounded-full blur-md opacity-30 animate-pulse"
        style={{ backgroundColor: color }}
      />

      {/* Render 3D-styled animated geometry based on type */}
      {type === 'gear' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="relative w-8 h-8 flex items-center justify-center"
        >
          <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            <defs>
              <linearGradient id={`grad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="1" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {/* Outer cog teeth */}
            <path
              d="M18 2 L20 2 L20.5 5.5 L23.5 6.7 L26.5 4.5 L28 5.8 L26.8 9 L29 11.5 L32.5 11 L33 13 L30 15 L30.5 18 L33 20 L32.5 22 L29 21.5 L26.8 24 L28 27.2 L26.5 28.5 L23.5 26.3 L20.5 27.5 L20 31 L18 31 L17.5 27.5 L14.5 26.3 L11.5 28.5 L10 27.2 L11.2 24 L9 21.5 L5.5 22 L5 20 L7.5 18 L7 15 L4 13 L4.5 11 L8 11.5 L10.2 9 L9 5.8 L10.5 4.5 L13.5 6.7 L16.5 5.5 Z"
              fill={`url(#grad-${type})`}
              stroke={color}
              strokeWidth="0.8"
            />
            {/* Inner axle rim */}
            <circle cx="18" cy="18" r="6.5" fill="#0b0f19" stroke={color} strokeWidth="1.2" />
            <circle cx="18" cy="18" r="3" fill={color} fillOpacity="0.9" />
          </svg>
        </motion.div>
      )}

      {type === 'shield' && (
        <motion.div
          animate={{
            y: [-1.5, 1.5, -1.5],
            rotateY: [-15, 15, -15],
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-8 h-8 flex items-center justify-center [perspective:600px]"
        >
          <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            <defs>
              <linearGradient id={`grad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="1" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path
              d="M18 4 L29 8.5 V18 C29 25 24 30.5 18 33 C12 30.5 7 25 7 18 V8.5 Z"
              fill={`url(#grad-${type})`}
              stroke={color}
              strokeWidth="1.2"
            />
            {/* Inner emblem facet */}
            <path
              d="M18 7 L26 10.5 V17.5 C26 23 22 27.5 18 29.5 C14 27.5 10 23 10 17.5 V10.5 Z"
              fill="#06121e"
              fillOpacity="0.75"
              stroke={color}
              strokeWidth="0.6"
            />
            <circle cx="18" cy="18" r="3" fill={color} />
          </svg>
        </motion.div>
      )}

      {type === 'alert' && (
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            rotate: [-2, 2, -2],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-8 h-8 flex items-center justify-center"
        >
          <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            <defs>
              <linearGradient id={`grad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="1" />
                <stop offset="100%" stopColor="#7c2d12" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <polygon
              points="18,4 32,29 4,29"
              fill={`url(#grad-${type})`}
              stroke={color}
              strokeWidth="1.2"
            />
            <polygon
              points="18,8 28,26 8,26"
              fill="#1a0b06"
              fillOpacity="0.8"
            />
            {/* Exclamation point */}
            <rect x="16.75" y="13" width="2.5" height="7" rx="1.2" fill={color} />
            <circle cx="18" cy="23" r="1.5" fill={color} />
          </svg>
        </motion.div>
      )}

      {!['gear', 'shield', 'alert'].includes(type) && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="w-6 h-6 rounded-lg border border-[var(--brand-accent)] bg-[var(--brand-subtle)]"
        />
      )}
    </div>
  );
}
