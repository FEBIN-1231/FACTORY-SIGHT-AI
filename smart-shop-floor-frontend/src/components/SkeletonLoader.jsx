import React from 'react';

/**
 * High-tech dual-tone shimmering skeleton loader components
 */
export const SkeletonCard = ({ className = 'h-32' }) => (
  <div
    className={`rounded-xl border border-slate-800 bg-slate-900/60 p-5 overflow-hidden relative ${className}`}
  >
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-700/20 to-transparent animate-shimmer" />
    <div className="space-y-3">
      <div className="h-3 w-1/3 rounded bg-slate-800" />
      <div className="h-7 w-2/3 rounded bg-slate-700/60" />
      <div className="h-2 w-1/2 rounded bg-slate-800" />
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 4, className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' }) => (
  <div className={className}>
    {Array.from({ length: count }).map((_, idx) => (
      <SkeletonCard key={idx} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 overflow-hidden relative">
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-700/20 to-transparent animate-shimmer" />
    <div className="h-4 w-1/4 rounded bg-slate-800 mb-4" />
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx} className="flex gap-4 items-center">
        <div className="h-3.5 w-1/6 rounded bg-slate-800" />
        <div className="h-3.5 w-1/4 rounded bg-slate-750" />
        <div className="h-3.5 w-1/4 rounded bg-slate-800" />
        <div className="h-3.5 w-1/5 rounded bg-slate-750 ml-auto" />
      </div>
    ))}
  </div>
);

export default SkeletonCard;
