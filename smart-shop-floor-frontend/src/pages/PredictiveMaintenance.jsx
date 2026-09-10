import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import MetricCard from '../components/MetricCard';
import Table from '../components/Table';
import LineChart from '../components/LineChart';
import AnimatedCheckmark from '../components/AnimatedCheckmark';
import { SkeletonGrid } from '../components/SkeletonLoader';
import { getPredictions } from '../services/api';
import {
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Clock,
  TrendingUp,
  Activity,
  Zap,
  Flame,
  Gauge,
  Volume2,
} from 'lucide-react';
import {
  buttonTap,
  listItemVariant,
  sequenceHeader,
  sequenceSection,
  staggerContainer,
} from '../components/motion';

export const PredictiveMaintenance = () => {
  const [predictions, setPredictions] = useState([]);
  const [dispatchedMap, setDispatchedMap] = useState({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState('M-03');

  useEffect(() => {
    const fetchPreds = async () => {
      try {
        const data = await getPredictions();
        setPredictions(data);
      } catch (e) {
        console.error('Failed to load predictions:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPreds();
  }, []);

  const handleDispatch = (predId, machine) => {
    setDispatchedMap((prev) => ({ ...prev, [predId]: true }));
    setFeedback(`Preventive work order created & dispatched to maintenance team for ${machine}.`);
    setTimeout(() => {
      setFeedback('');
    }, 4500);
    setTimeout(() => {
      setDispatchedMap((prev) => ({ ...prev, [predId]: false }));
    }, 6000);
  };

  const activePred = predictions.find((p) => p.machine === selectedMachine) || predictions[0] || {
    machine: 'M-03',
    name: 'Laser Scribing Unit C',
    riskLevel: 'HIGH',
    riskScore: 88,
    rulDays: 4,
    rulHours: 96,
    confidence: '94.2%',
    component: 'Spindle Intake Bearing',
    recommendation: 'Inspect bearing lubrication and replace seal kit during scheduled changeover.',
  };

  const isHighRisk = (activePred.riskScore || 0) >= 70;
  const isModRisk = (activePred.riskScore || 0) >= 35;
  const riskStatus = isHighRisk ? 'CRITICAL' : isModRisk ? 'WARNING' : 'NORMAL';

  // Degradation trajectory over past hours + forecast
  const degradationHistory = [
    { time: 'T-12h', probability: Math.max(5, (activePred.riskScore || 50) - 38) },
    { time: 'T-10h', probability: Math.max(8, (activePred.riskScore || 50) - 30) },
    { time: 'T-08h', probability: Math.max(12, (activePred.riskScore || 50) - 24) },
    { time: 'T-06h', probability: Math.max(18, (activePred.riskScore || 50) - 18) },
    { time: 'T-04h', probability: Math.max(25, (activePred.riskScore || 50) - 10) },
    { time: 'T-02h', probability: Math.max(30, (activePred.riskScore || 50) - 4) },
    { time: 'Now', probability: activePred.riskScore || 50 },
    { time: '+4h (Proj)', probability: Math.min(99, (activePred.riskScore || 50) + 6) },
    { time: '+8h (Proj)', probability: Math.min(100, (activePred.riskScore || 50) + 11) },
  ];

  // Specific risk drivers for the focused unit
  const riskDrivers = [
    {
      label: 'Thermal Excursion Index',
      impact: selectedMachine === 'M-03' ? 88 : selectedMachine === 'M-01' ? 42 : 22,
      limit: '85°C Max',
      icon: Flame,
      color: 'text-amber-400',
      bg: 'bg-amber-500',
    },
    {
      label: 'Harmonic Spindle Vibration',
      impact: selectedMachine === 'M-03' ? 76 : selectedMachine === 'M-02' ? 58 : 18,
      limit: '4.5 mm/s',
      icon: Activity,
      color: 'text-[var(--brand-accent)]',
      bg: 'bg-[var(--brand-accent)]',
    },
    {
      label: 'Hydraulic Pressure Delta',
      impact: selectedMachine === 'M-04' ? 65 : selectedMachine === 'M-03' ? 54 : 15,
      limit: '120 bar',
      icon: Gauge,
      color: 'text-blue-400',
      bg: 'bg-blue-500',
    },
    {
      label: 'Acoustic Friction Spectrum',
      impact: selectedMachine === 'M-03' ? 48 : 20,
      limit: '75 dB',
      icon: Volume2,
      color: 'text-purple-400',
      bg: 'bg-purple-500',
    },
  ];

  const columns = [
    {
      header: 'Machine Unit',
      key: 'machine',
      render: (r) => (
        <div
          onClick={() => setSelectedMachine(r.machine)}
          className="cursor-pointer group"
        >
          <div className="font-mono font-bold text-white text-xs group-hover:text-[var(--brand-accent)] transition-colors flex items-center gap-1.5">
            {r.machine}
            {selectedMachine === r.machine && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)]" />
            )}
          </div>
          <div className="text-[11px] text-slate-400">{r.name}</div>
        </div>
      ),
    },
    { header: 'Monitored Component', key: 'component', render: (r) => <span className="font-semibold text-slate-200">{r.component}</span> },
    {
      header: 'Estimated RUL',
      key: 'rulDays',
      render: (r) => {
        const isCritical = r.rulDays <= 7;
        return (
          <div className="font-mono">
            <span className={`font-bold text-xs ${isCritical ? 'text-red-400' : 'text-slate-100'}`}>
              {r.rulDays} Days
            </span>
            <span className="text-[10px] text-slate-500 block">({r.rulHours} operating hrs)</span>
          </div>
        );
      },
    },
    {
      header: 'Failure Risk Score',
      key: 'riskScore',
      render: (r) => {
        const isHigh = r.riskScore >= 70;
        const isMod = r.riskScore >= 35;
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={`font-bold ${isHigh ? 'text-red-400' : isMod ? 'text-amber-400' : 'text-emerald-400'}`}>
                {r.riskScore}%
              </span>
              <span className="text-[10px] text-slate-400">({r.riskLevel})</span>
            </div>
            <div className="w-24 bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${r.riskScore}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                className={`h-full rounded-full transition-colors duration-400 ${isHigh ? 'bg-red-500' : isMod ? 'bg-amber-500' : 'bg-emerald-400'}`}
              />
            </div>
          </div>
        );
      },
    },
    { header: 'Model Confidence', key: 'confidence', className: 'font-mono text-[var(--brand-accent)] text-xs' },
    {
      header: 'Recommended Intervention',
      key: 'recommendation',
      render: (r) => <span className="text-xs text-slate-300 leading-relaxed block max-w-xs">{r.recommendation}</span>,
    },
    {
      header: 'Action',
      key: 'action',
      className: 'text-right',
      render: (r) => {
        const isDispatched = dispatchedMap[r.id];
        return (
          <motion.button
            whileTap={buttonTap}
            onClick={() => handleDispatch(r.id, r.machine)}
            className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all shadow-sm cursor-pointer flex items-center gap-1.5 justify-end ml-auto ${
              isDispatched
                ? 'bg-emerald-600/90 text-white border border-emerald-400 shadow-emerald-500/20 shadow-md'
                : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white'
            }`}
          >
            {isDispatched ? (
              <>
                <AnimatedCheckmark size={14} className="text-white" />
                <span>Dispatched</span>
              </>
            ) : (
              'Dispatch Work Order'
            )}
          </motion.button>
        );
      },
    },
  ];

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
              LSTM & Random Forest Prognostics
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">ISO 13374 Condition Monitoring</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Predictive Maintenance & Remaining Useful Life (RUL)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Continuous degradation modeling to eliminate unplanned machine breakdowns
          </p>
        </div>

        {/* Machine Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Focus Unit:</span>
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold font-mono text-[var(--brand-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] cursor-pointer shadow-sm transition-colors"
          >
            <option value="M-01">M-01 (Milling Alpha)</option>
            <option value="M-02">M-02 (Turning Beta)</option>
            <option value="M-03">M-03 (Laser Scribing)</option>
            <option value="M-04">M-04 (Hydraulic Press)</option>
          </select>
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

      {/* 2D Failure Probability & Risk Health Panel */}
      <motion.div
        variants={sequenceSection(0.1)}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Left: Failure Probability & Risk Badge Card */}
        <div className="lg:col-span-4 bg-slate-850 border border-slate-750 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                Target Machine Diagnostic
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                  isHighRisk
                    ? 'bg-red-500/15 text-red-400 border-red-500/30'
                    : isModRisk
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {riskStatus} RISK ({activePred.riskLevel || 'NOMINAL'})
              </span>
            </div>

            <div className="text-lg font-bold text-white tracking-tight flex items-baseline gap-2">
              <span>{activePred.machine}</span>
              <span className="text-xs text-slate-400 font-normal">({activePred.component})</span>
            </div>
          </div>

          {/* Large Failure Probability Meter */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Failure Probability</span>
              <span
                className={`text-2xl font-extrabold font-mono ${
                  isHighRisk ? 'text-red-400' : isModRisk ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {activePred.riskScore}%
              </span>
            </div>

            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activePred.riskScore}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                className={`h-full rounded-full ${
                  isHighRisk ? 'bg-gradient-to-r from-amber-500 to-red-500' : isModRisk ? 'bg-amber-500' : 'bg-emerald-400'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
              <div>
                <span className="text-slate-500 block">Estimated RUL</span>
                <span className={`font-bold ${isHighRisk ? 'text-red-400' : 'text-slate-200'}`}>
                  {activePred.rulDays} Days ({activePred.rulHours}h)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Prognostic Confidence</span>
                <span className="font-bold text-[var(--brand-accent)]">{activePred.confidence || '94.2%'}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
            <span className="text-[var(--brand-accent)] font-semibold">AI Recommendation: </span>
            {activePred.recommendation}
          </div>
        </div>

        {/* Middle: Failure Probability Over Time Trend Chart */}
        <div className="lg:col-span-5 bg-slate-850 border border-slate-750 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Failure Probability Trajectory</h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Historical degradation tracking & forward multi-sensor forecast
              </p>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--brand-accent)] bg-[var(--brand-subtle)] px-2 py-0.5 rounded border border-[var(--brand-border)]">
              <TrendingUp className="w-3.5 h-3.5" /> Trend
            </span>
          </div>

          <div className="pt-2">
            <LineChart
              data={degradationHistory}
              xKey="time"
              yKey="probability"
              color={isHighRisk ? '#f87171' : isModRisk ? '#fbbf24' : '#FE4B4A'}
              unit="%"
              height={210}
              showArea={true}
            />
          </div>
        </div>

        {/* Right: Top Risk Factors & Degradation Drivers */}
        <div className="lg:col-span-3 bg-slate-850 border border-slate-750 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Top Risk Drivers</h2>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Impact</span>
          </div>

          <div className="space-y-3">
            {riskDrivers.map((driver) => {
              const Icon = driver.icon;
              return (
                <div key={driver.label} className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5 truncate">
                      <Icon className={`w-3.5 h-3.5 ${driver.color} shrink-0`} />
                      <span className="truncate">{driver.label}</span>
                    </span>
                    <span className="font-mono font-bold text-white text-xs">{driver.impact}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${driver.impact}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${driver.bg}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-1 text-[10px] font-mono text-slate-500 text-center">
            Weighted sensor feature importance (LSTM Attention Layer)
          </div>
        </div>
      </motion.div>

      {/* RUL Quick Metrics */}
      <motion.div
        variants={staggerContainer(0.05, 0.15)}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <MetricCard
          title="Average Fleet RUL"
          value="35.7 Days"
          subtitle="Across 4 active machining cells"
          trend="Stable"
          icon={Clock}
          status="healthy"
        />
        <MetricCard
          title="Critical Unit Flag"
          value="Unit M-03 (4d)"
          subtitle="Intake seal degradation"
          trend="High Priority"
          icon={AlertCircle}
          status="critical"
        />
        <MetricCard
          title="Prevented Downtime"
          value="~42.5 Hours"
          subtitle="Estimated $186,000 saved this quarter"
          trend="+18% YoY"
          icon={ShieldCheck}
          status="healthy"
        />
      </motion.div>

      {/* Main RUL Prognostics Table */}
      <motion.div
        variants={sequenceSection(0.25)}
        initial="initial"
        animate="animate"
      >
        <Card
          title="Asset Degradation & Prognostics Register"
          subtitle="Real-time multi-sensor degradation curve fitting with confidence intervals"
          variant="accent"
          enableHoverLift={true}
        >
          <Table columns={columns} rows={predictions} />
        </Card>
      </motion.div>
    </div>
  );
};

export default PredictiveMaintenance;
