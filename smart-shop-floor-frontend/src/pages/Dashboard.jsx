import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MetricCard from '../components/MetricCard';
import Card from '../components/Card';
import { SkeletonGrid, SkeletonTable } from '../components/SkeletonLoader';
import { getDashboardSummary, getMachineGridData, getAlerts, getDefects } from '../services/api';
import { Activity, Cpu, AlertTriangle, ScanEye, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  sequenceHeader,
  sequenceSection,
  staggerContainer,
  cardEntrance,
  cardHoverLift,
  buttonTap,
  iconHover,
} from '../components/motion';

export const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [machines, setMachines] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sum, mach, alt, def] = await Promise.all([
          getDashboardSummary(),
          getMachineGridData(),
          getAlerts(),
          getDefects(),
        ]);
        setSummary(sum);
        setMachines(mach);
        setAlerts(alt);
        setDefects(def);
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-7 animate-fadeIn">
        <div className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
        <SkeletonGrid count={4} />
        <SkeletonGrid count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* 1. Header Banner Reveal */}
      <motion.div
        variants={sequenceHeader}
        initial="initial"
        animate="animate"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-subtle)] shadow-md"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)] uppercase">
              Plant Intelligence Hub
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">SCADA Protocol Active</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Shop Floor Real-Time Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live telemetry ingestion, predictive failure risk, and CV defect classification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.div whileTap={buttonTap}>
            <Link
              to="/telemetry"
              className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white font-semibold text-xs rounded-xl shadow-lg shadow-[var(--brand-glow)] transition-colors flex items-center gap-1.5"
            >
              <span>Live Stream</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* 2. KPI Metrics Row (Sequence Offset 0.1s) */}
      <motion.div
        variants={sequenceSection(0.1)}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MetricCard
          title="Overall OEE"
          value={summary?.oee || 89.6}
          unit="%"
          subtitle="Target: > 85.0%"
          trend={summary?.oeeTrend || '+2.4%'}
          icon={Activity}
          icon3D="shield"
          progress={89.6}
          status="healthy"
        />
        <MetricCard
          title="Monitored Units"
          value={summary?.activeMachines || 24}
          unit={`/ ${summary?.totalMachines || 24}`}
          subtitle="100% Ingestion Up-time"
          trend="All Online"
          icon={Cpu}
          icon3D="gear"
          status="normal"
        />
        <MetricCard
          title="Defect Rate"
          value={summary?.defectRate || 1.15}
          unit="%"
          subtitle="Tolerance: < 2.0%"
          trend={summary?.defectTrend || '-0.3%'}
          icon={ScanEye}
          status="healthy"
        />
        <MetricCard
          title="Active Alerts"
          value={alerts.filter((a) => !a.ack).length}
          subtitle="1 High, 1 Moderate"
          trend="Action Req."
          icon={AlertTriangle}
          icon3D="alert"
          status={alerts.some((a) => !a.ack && a.severity === 'HIGH') ? 'critical' : 'normal'}
        />
      </motion.div>

      {/* 3. Live Machine Grid (Sequence Offset 0.25s) */}
      <motion.div
        variants={sequenceSection(0.25)}
        initial="initial"
        animate="animate"
      >
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[var(--brand-accent)]" />
            <span>Industrial Equipment Units ({machines.length})</span>
          </h2>
          <Link to="/telemetry" className="text-xs text-[var(--brand-accent)] hover:underline font-mono">
            View Sensor Waveforms →
          </Link>
        </div>

        <motion.div
          variants={staggerContainer(0.05, 0.05)}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {machines.map((m) => {
            const isWarning = m.status === 'WARNING';
            return (
              <motion.div
                key={m.id}
                variants={cardEntrance}
                whileHover={cardHoverLift}
                className={`p-5 rounded-xl border bg-slate-850/90 transition-all duration-400 hover:shadow-lg hover:shadow-[var(--brand-glow)] hover:border-[var(--brand-border)] group cursor-default ${
                  isWarning ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-white group-hover:text-[var(--brand-accent)] transition-colors">
                      {m.id}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-200 mt-0.5">{m.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{m.line}</p>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border transition-colors duration-400 ${
                      isWarning
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-750 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Vibration</span>
                    <span className="text-slate-200 font-bold">{m.vibration}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Bearing Temp</span>
                    <span className="text-slate-200 font-bold">{m.temp}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Hydr. Pressure</span>
                    <span className="text-slate-200 font-bold">{m.pressure}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Health Score</span>
                    <span className={`font-bold transition-colors duration-400 ${m.health >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {m.health}%
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* 4. Two Column Section: Recent Defects + Live Alerts (Sequence Offset 0.4s) */}
      <motion.div
        variants={sequenceSection(0.4)}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Recent Defect Vision Inspection */}
        <Card
          title="Live Optical Vision & Defect Flags"
          subtitle="Real-time YOLOv8 edge inference stream from CAM-02"
          badge="● LIVE CV STREAM"
          enableHoverLift={true}
          action={
            <Link to="/defects" className="text-xs text-[var(--brand-accent)] hover:underline font-mono">
              Open Full Stream →
            </Link>
          }
        >
          <div className="space-y-3 pt-1">
            {defects.slice(0, 3).map((def) => (
              <motion.div
                key={def.id}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15 }}
                className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-950">
                    <img src={def.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{def.defectType}</span>
                      <span className="text-[10px] font-mono text-[var(--brand-accent)] bg-[var(--brand-subtle)] px-1.5 rounded">
                        {def.confidence}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      <span>{def.machine}</span> • <span>{def.camera}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                    def.severity === 'High'
                      ? 'bg-red-500/15 text-red-400 border-red-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {def.severity}
                </span>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Recent Alerts Feed */}
        <Card
          title="Priority Anomaly Feed"
          subtitle="Telemetry threshold breaches & AI alert dispatches"
          enableHoverLift={true}
          action={
            <Link to="/alerts" className="text-xs text-[var(--brand-accent)] hover:underline font-mono">
              All Alerts →
            </Link>
          }
        >
          <div className="space-y-3 pt-1">
            {alerts.map((alt) => (
              <motion.div
                key={alt.id}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15 }}
                className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3 hover:border-slate-700 transition-colors cursor-default"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-100">{alt.machine}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{alt.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alt.message}</p>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 uppercase border ${
                    alt.severity === 'HIGH'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {alt.severity}
                </span>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
