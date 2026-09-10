import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MetricCard from '../components/MetricCard';
import AnimatedCheckmark from '../components/AnimatedCheckmark';
import { SkeletonGrid } from '../components/SkeletonLoader';
import { getInsights } from '../services/api';
import { Sparkles, ArrowRight, CheckCircle2, TrendingUp, Zap, DollarSign } from 'lucide-react';
import {
  buttonTap,
  cardEntrance,
  cardHoverLift,
  listItemVariant,
  sequenceHeader,
  sequenceSection,
  staggerContainer,
} from '../components/motion';

export const Insights = () => {
  const [insights, setInsights] = useState([]);
  const [appliedMap, setAppliedMap] = useState({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIns = async () => {
      try {
        const data = await getInsights();
        setInsights(data);
      } catch (e) {
        console.error('Failed to load insights:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchIns();
  }, []);

  const handleApply = (id, title) => {
    setAppliedMap((prev) => ({ ...prev, [id]: true }));
    setFeedback(`AI recommendation for "${title}" sent to shop floor PLC controller.`);
    setTimeout(() => setFeedback(''), 4500);
    setTimeout(() => {
      setAppliedMap((prev) => ({ ...prev, [id]: false }));
    }, 6000);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
        <SkeletonGrid count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div
        variants={sequenceHeader}
        initial="initial"
        animate="animate"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-850 p-6 rounded-2xl border border-slate-750 shadow-md"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)] uppercase">
              Generative Root Cause & Thermal Diagnostics
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">Neural Inference Active</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            AI Root Cause Analysis & Prescriptive Insights
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated correlation between vibration harmonics, thermal drift, and surface defect emergence
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            variants={listItemVariant}
            initial="initial"
            animate="animate"
            exit="exit"
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-mono"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Savings KPIs */}
      <motion.div
        variants={staggerContainer(0.05, 0.1)}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <MetricCard
          title="Potential Cost Avoidance"
          value="$20,900"
          subtitle="Identified across 3 active diagnostics"
          trend="Calculated"
          icon={DollarSign}
          status="healthy"
        />
        <MetricCard
          title="Thermal Correlation Index"
          value="0.91 r"
          subtitle="Strong coupling between temp & burrs"
          trend="High Accuracy"
          icon={Zap}
          status="normal"
        />
        <MetricCard
          title="Overall Health Impact"
          value="+14.2%"
          subtitle="OEE uplift upon corrective execution"
          trend="Projected"
          icon={TrendingUp}
          status="healthy"
        />
      </motion.div>

      {/* Insight Diagnostic Cards with Staggered Entrance and Hover Lifts */}
      <motion.div
        variants={sequenceSection(0.25)}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        {insights.map((item) => {
          const isApplied = appliedMap[item.id];
          return (
            <motion.div
              key={item.id}
              variants={cardEntrance}
              whileHover={cardHoverLift}
              className={`p-6 rounded-2xl bg-slate-850 border transition-all duration-300 shadow-md space-y-4 ${
                isApplied
                  ? 'border-emerald-500/60 shadow-emerald-500/10 shadow-lg'
                  : 'border-slate-750 hover:border-[var(--brand-border)] hover:shadow-[var(--brand-glow)] hover:shadow-lg'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-750">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-[var(--brand-accent)] flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{item.title}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{item.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)]">
                    {item.confidence} Confidence
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                      item.severity === 'High'
                        ? 'bg-red-500/15 text-red-400 border-red-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>
              </div>

              {/* Root Cause & Recommendation Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-red-400 block">
                    Identified Root Cause
                  </span>
                  <p className="text-slate-300 leading-relaxed">{item.rootCause}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block">
                    Prescribed Corrective Action
                  </span>
                  <p className="text-slate-300 leading-relaxed">{item.recommendation}</p>
                </div>
              </div>

              {/* Metrics & Action Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 text-xs">
                <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px] flex-wrap">
                  <span>
                    Target: <strong className="text-slate-200">{item.metrics.affectedUnit}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Failure Window: <strong className="text-amber-400">{item.metrics.failureWindow}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Savings: <strong className="text-emerald-400">{item.metrics.costSavings}</strong>
                  </span>
                </div>

                <motion.button
                  whileTap={buttonTap}
                  onClick={() => handleApply(item.id, item.title)}
                  className={`px-4 py-2 text-white font-semibold text-xs rounded-xl shadow-md shadow-[var(--brand-glow)] transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto ${
                    isApplied
                      ? 'bg-emerald-600/90 border border-emerald-400 shadow-emerald-500/20'
                      : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)]'
                  }`}
                >
                  {isApplied ? (
                    <>
                      <AnimatedCheckmark size={14} className="text-white" />
                      <span>Applied to PLC</span>
                    </>
                  ) : (
                    <>
                      <span>Apply Recommendation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Insights;
