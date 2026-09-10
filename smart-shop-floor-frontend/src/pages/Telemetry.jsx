import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/Card';
import LineChart from '../components/LineChart';
import { getTelemetry } from '../services/api';
import { Activity, Gauge, Flame, Radio, Zap, Volume2, Play, Pause, Box, BarChart2 } from 'lucide-react';
import { buttonTap, tabPillTransition } from '../components/motion';

const MachineViewer3D = lazy(() => import('../components/3d/MachineViewer3D'));

export const Telemetry = () => {
  const [machineId, setMachineId] = useState('M-01');
  const [telemetry, setTelemetry] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('vibration');
  const [isStreaming, setIsStreaming] = useState(true);
  const [viewMode, setViewMode] = useState('both'); // 'chart' | '3d' | 'both'

  useEffect(() => {
    let isMounted = true;
    const fetchStream = async () => {
      try {
        const data = await getTelemetry(machineId, 25);
        if (isMounted) setTelemetry(data);
      } catch (e) {
        console.error('Telemetry fetch error:', e);
      }
    };

    fetchStream();
    let interval = null;
    if (isStreaming) {
      interval = setInterval(fetchStream, 2500);
    }
    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [machineId, isStreaming]);

  const metricConfigs = [
    { key: 'vibration', label: 'Vibration RMS', unit: 'mm/s', value: telemetry?.metrics?.vibration, limit: 4.5, icon: Activity, color: '#FE4B4A' },
    { key: 'temperature', label: 'Bearing Temp', unit: '°C', value: telemetry?.metrics?.temperature, limit: 85, icon: Flame, color: '#f59e0b' },
    { key: 'pressure', label: 'Hydr. Pressure', unit: 'bar', value: telemetry?.metrics?.pressure, limit: 120, icon: Gauge, color: '#3b82f6' },
    { key: 'rpm', label: 'Spindle RPM', unit: 'RPM', value: telemetry?.metrics?.rpm, limit: 2200, icon: Zap, color: '#10b981' },
    { key: 'acoustic', label: 'Acoustic RMS', unit: 'dB', value: telemetry?.metrics?.acoustic, limit: 75, icon: Volume2, color: '#8b5cf6' },
    { key: 'power', label: 'Power Draw', unit: 'kW', value: telemetry?.metrics?.power, limit: 20, icon: Radio, color: '#ec4899' },
  ];

  const activeMetricObj = metricConfigs.find((m) => m.key === selectedMetric) || metricConfigs[0];
  const isHighRisk = (telemetry?.metrics?.vibration || 0) > 4.2 || (telemetry?.metrics?.temperature || 0) > 82;
  const currentStatus = isHighRisk ? 'WARNING' : 'NORMAL';

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-850 p-5 rounded-2xl border border-slate-750 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[var(--brand-accent)] beacon-glow" />
            <span className="text-[11px] font-mono text-[var(--brand-accent)] uppercase font-bold tracking-wider">
              Waveform & Digital Twin Engine
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            High-Frequency Machine Telemetry & 3D Spatial Telemetry
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Machine Selector */}
          <select
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] font-mono cursor-pointer transition-colors"
          >
            <option value="M-01">Unit M-01 (Milling Station Alpha)</option>
            <option value="M-02">Unit M-02 (Turning Cell Beta)</option>
            <option value="M-03">Unit M-03 (Laser Scribing Unit)</option>
            <option value="M-04">Unit M-04 (Hydraulic Press Gamma)</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('both')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'both' ? 'bg-[var(--brand-subtle)] text-[var(--brand-accent)] font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === '3d' ? 'bg-[var(--brand-subtle)] text-[var(--brand-accent)] font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              3D Twin
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'chart' ? 'bg-[var(--brand-subtle)] text-[var(--brand-accent)] font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Chart Only
            </button>
          </div>

          {/* Streaming Toggle */}
          <motion.button
            whileTap={buttonTap}
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer font-mono ${
              isStreaming
                ? 'bg-[var(--brand-subtle)] text-[var(--brand-accent)] border-[var(--brand-border)] hover:bg-[var(--brand-subtle)]'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Live Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Paused</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Six Metric Cards with Sliding Active Ring */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metricConfigs.map((m) => {
          const isSelected = selectedMetric === m.key;
          const isExceeded = m.value && m.value >= m.limit;

          return (
            <motion.div
              key={m.key}
              whileTap={buttonTap}
              onClick={() => setSelectedMetric(m.key)}
              className={`relative p-4 rounded-xl border transition-colors cursor-pointer select-none ${
                isSelected
                  ? 'bg-slate-800 border-[var(--brand-accent)] shadow-md'
                  : 'bg-slate-850/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeMetricPill"
                  transition={tabPillTransition}
                  className="absolute inset-0 rounded-xl ring-2 ring-[var(--brand-border)] pointer-events-none"
                />
              )}

              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span className="text-[10px] font-mono uppercase font-semibold truncate">
                  {m.label}
                </span>
                <m.icon className="w-3.5 h-3.5 text-[var(--brand-accent)] shrink-0" />
              </div>

              <div className="text-lg font-bold font-mono text-white flex items-baseline gap-1">
                <span>{m.value !== undefined ? m.value : '...'}</span>
                <span className="text-[10px] font-normal text-slate-400">{m.unit}</span>
              </div>

              <div className="mt-2 text-[10px] font-mono flex items-center justify-between text-slate-400">
                <span>Limit: &lt;{m.limit}</span>
                {isExceeded ? (
                  <span className="text-red-400 font-bold">WARN</span>
                ) : (
                  <span className="text-emerald-400 font-semibold">OK</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Grid: 3D Twin + Waveform Chart */}
      <div className={`grid gap-6 ${viewMode === 'both' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        {(viewMode === 'both' || viewMode === '3d') && (
          <div className={viewMode === 'both' ? 'lg:col-span-5' : 'w-full'}>
            <Suspense fallback={<div className="h-[360px] rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />}>
              <MachineViewer3D
                machineId={machineId}
                status={currentStatus}
                telemetry={telemetry?.metrics || {}}
                className="h-[360px]"
              />
            </Suspense>
          </div>
        )}

        {(viewMode === 'both' || viewMode === 'chart') && (
          <div className={viewMode === 'both' ? 'lg:col-span-7' : 'w-full'}>
            <Card
              title={`Live Sensor Waveform: ${activeMetricObj.label} (${machineId})`}
              subtitle="Real-time sliding window of telemetry buffer points with gradient interpolation"
              badge={`${activeMetricObj.value || '...'} ${activeMetricObj.unit}`}
              variant="accent"
            >
              <div className="pt-2">
                <LineChart
                  data={telemetry?.history || []}
                  xKey="time"
                  yKey={selectedMetric}
                  color={activeMetricObj.color}
                  unit={activeMetricObj.unit}
                  height={280}
                  showArea={true}
                />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Telemetry;
