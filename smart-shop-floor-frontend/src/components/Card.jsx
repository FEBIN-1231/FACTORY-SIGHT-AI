import React from 'react';
import { motion } from 'framer-motion';
import { cardEntrance, cardHoverLift } from './motion';

export const Card = ({
  title,
  subtitle,
  value,
  trend,
  badge,
  action,
  children,
  className = '',
  variant = 'default', // 'default' | 'accent' | 'contrast'
  animate = false,
  enableHoverLift = false,
}) => {
  const bgStyles =
    variant === 'accent'
      ? 'bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border-[var(--brand-border)]'
      : variant === 'contrast'
      ? 'bg-slate-950 border-slate-800'
      : 'bg-slate-850/90 border-slate-750/80';

  const CardWrapper = animate || enableHoverLift ? motion.div : 'div';
  const wrapperProps = {};
  if (animate) wrapperProps.variants = cardEntrance;
  if (enableHoverLift) {
    wrapperProps.whileHover = cardHoverLift;
    wrapperProps.className = `${className} hover:shadow-lg hover:shadow-[var(--brand-glow)] hover:border-[var(--brand-border)] transition-colors`;
  }

  return (
    <CardWrapper
      {...wrapperProps}
      className={`rounded-xl border p-5 shadow-sm text-slate-100 transition-colors ${bgStyles} ${className}`}
    >
      {(title || subtitle || badge || action || value !== undefined) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && (
              <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono text-[11px] text-[var(--brand-accent)]">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            {value !== undefined && (
              <div className="text-2xl font-extrabold text-white mt-1.5 flex items-baseline gap-2 font-mono">
                <span>{value}</span>
                {trend && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      trend.startsWith('+')
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)]'
                    }`}
                  >
                    {trend}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {badge && (
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)]">
                {badge}
              </span>
            )}
            {action}
          </div>
        </div>
      )}
      {children}
    </CardWrapper>
  );
};

export default Card;
