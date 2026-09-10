import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { cardEntrance, cardHoverLift, iconHover } from './motion';
import AnimatedCounter from './AnimatedCounter';

const KpiIcon3D = lazy(() => import('./3d/KpiIcon3D'));

export const MetricCard = ({
  title,
  value,
  unit = '',
  subtitle,
  trend,
  icon: Icon,
  icon3D, // 'gear' | 'shield' | 'alert'
  status = 'normal', // 'normal' | 'healthy' | 'warning' | 'critical'
  progress,
}) => {
  const isCritical = status === 'critical';

  const statusBorder =
    isCritical
      ? 'border-red-500/50 bg-red-950/20'
      : status === 'warning'
      ? 'border-amber-500/40 bg-amber-950/20'
      : status === 'healthy'
      ? 'border-emerald-500/40 bg-emerald-950/20'
      : 'border-slate-750/80 bg-slate-850/90 hover:border-[var(--brand-border)]';

  const accentColor =
    isCritical
      ? 'text-red-400'
      : status === 'warning'
      ? 'text-amber-400'
      : status === 'healthy'
      ? 'text-emerald-400'
      : 'text-[var(--brand-accent)]';

  const hexColor =
    isCritical
      ? '#ef4444'
      : status === 'warning'
      ? '#f59e0b'
      : status === 'healthy'
      ? '#10b981'
      : '#FE4B4A';

  // Check if value is numeric
  const isNumeric = typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value));
  const numericVal = typeof value === 'number' ? value : parseFloat(value);
  const decimals = typeof value === 'string' && value.includes('.') ? value.split('.')[1].length : 0;

  return (
    <motion.div
      variants={cardEntrance}
      whileHover={cardHoverLift}
      className={`rounded-xl border p-5 shadow-sm relative overflow-hidden group cursor-default transition-all duration-400 ease-out hover:shadow-lg hover:shadow-[var(--brand-glow)] ${statusBorder} ${
        isCritical ? 'animate-pulse' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className="text-2xl font-extrabold text-white mt-1.5 flex items-baseline gap-1.5 font-mono">
            {isNumeric && !isNaN(numericVal) ? (
              <AnimatedCounter value={numericVal} decimals={decimals} duration={750} />
            ) : (
              <span>{value}</span>
            )}
            {unit && <span className="text-sm font-normal text-slate-400">{unit}</span>}
          </div>
        </div>

        {icon3D ? (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-900/80 border border-slate-700/60 shadow-inner overflow-hidden">
            <Suspense fallback={Icon ? <Icon className={`w-5 h-5 ${accentColor}`} /> : null}>
              <KpiIcon3D type={icon3D} color={hexColor} size="w-10 h-10" />
            </Suspense>
          </div>
        ) : Icon ? (
          <motion.div
            whileHover={iconHover}
            className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-900/80 border border-slate-700/60 ${accentColor} shadow-inner transition-colors duration-400`}
          >
            <Icon className="w-5 h-5" />
          </motion.div>
        ) : null}
      </div>

      {(subtitle || trend || progress !== undefined) && (
        <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`font-mono font-semibold px-2 py-0.5 rounded text-[10px] transition-colors duration-400 ${
                trend.startsWith('+')
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)]'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      )}

      {progress !== undefined && (
        <div className="w-full bg-slate-700/50 h-1.5 rounded-full mt-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full transition-colors duration-400 ${
              isCritical
                ? 'bg-red-500'
                : status === 'warning'
                ? 'bg-amber-500'
                : 'bg-[var(--brand-accent)]'
            }`}
          />
        </div>
      )}
    </motion.div>
  );
};

export default MetricCard;
