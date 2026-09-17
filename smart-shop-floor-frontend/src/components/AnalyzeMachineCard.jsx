import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Cpu,
  Flame,
  Gauge,
  Volume2,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  Layers,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Info,
  Sliders,
  FileText,
  Send,
  Zap,
} from 'lucide-react';
import { analyzeMachine } from '../services/api';

const DEFAULT_MACHINE_PRESETS = {
  'M-01': {
    machine_id: 'M-01',
    name: 'Milling Station Alpha',
    temperature: 87.5,
    vibration: 8.2,
    current: 7.8,
    rpm: 1320,
    load_percentage: 88,
  },
  'M-02': {
    machine_id: 'M-02',
    name: 'Turning Cell Beta',
    temperature: 68.2,
    vibration: 2.8,
    current: 5.4,
    rpm: 1750,
    load_percentage: 64,
  },
  'M-03': {
    machine_id: 'M-03',
    name: 'Laser Scribing Unit C',
    temperature: 82.6,
    vibration: 3.9,
    current: 9.1,
    rpm: 2180,
    load_percentage: 85,
  },
  'M-04': {
    machine_id: 'M-04',
    name: 'Hydraulic Press Gamma',
    temperature: 64.0,
    vibration: 1.7,
    current: 4.2,
    rpm: 1400,
    load_percentage: 52,
  },
};

const PIPELINE_STAGES = [
  { id: 1, name: 'Sensor Analysis', desc: 'Validating multi-channel telemetry streams & signal quality' },
  { id: 2, name: 'XGBoost', desc: 'Predicting failure probability & Remaining Useful Life (RUL)' },
  { id: 3, name: 'Agent 2 (Prediction Analysis)', desc: 'Classifying operational degradation regimes & harmonic drift' },
  { id: 4, name: 'Agent 4 (Predictive Maintenance)', desc: 'Assessing maintenance urgency & failure horizon' },
  { id: 5, name: 'Agent 5 (Root Cause Analysis)', desc: 'Isolating root cause component failures & acoustic harmonics' },
  { id: 6, name: 'Agent 6 (Maintenance Planning)', desc: 'Formulating work order procedures & spare part logistics' },
  { id: 7, name: 'Agent 7 (Decision Supervisor)', desc: 'Evaluating safety boundaries & dispatching recommended action' },
];

export const AnalyzeMachineCard = ({ selectedMachine = 'M-01', onAnalysisComplete }) => {
  const [selectedUnit, setSelectedUnit] = useState(selectedMachine);
  const [sensorValues, setSensorValues] = useState(DEFAULT_MACHINE_PRESETS[selectedMachine] || DEFAULT_MACHINE_PRESETS['M-01']);
  const [loading, setLoading] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showManualTuning, setShowManualTuning] = useState(false);

  // Sync preset when parent selectedMachine changes
  useEffect(() => {
    if (DEFAULT_MACHINE_PRESETS[selectedMachine]) {
      setSelectedUnit(selectedMachine);
      setSensorValues(DEFAULT_MACHINE_PRESETS[selectedMachine]);
    }
  }, [selectedMachine]);

  const handleMachineSelect = (mId) => {
    setSelectedUnit(mId);
    if (DEFAULT_MACHINE_PRESETS[mId]) {
      setSensorValues(DEFAULT_MACHINE_PRESETS[mId]);
    }
    setError(null);
  };

  const handleInputChange = (field, val) => {
    setSensorValues((prev) => ({
      ...prev,
      [field]: parseFloat(val) || 0,
    }));
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentStageIndex(0);
    setElapsedSeconds(0);

    // Elapsed seconds ticker
    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Progressive stage animation over ~28-30 seconds (each stage ~4s)
    const stageInterval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < PIPELINE_STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 4200);

    try {
      const data = await analyzeMachine({
        machine_id: selectedUnit,
        temperature: Number(sensorValues.temperature),
        vibration: Number(sensorValues.vibration),
        current: Number(sensorValues.current),
        rpm: Number(sensorValues.rpm),
        load_percentage: Number(sensorValues.load_percentage),
      });

      clearInterval(timerInterval);
      clearInterval(stageInterval);
      setCurrentStageIndex(PIPELINE_STAGES.length);
      setResult(data);

      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
    } catch (err) {
      clearInterval(timerInterval);
      clearInterval(stageInterval);
      console.error('Machine analysis failed:', err);
      setError('Unable to retrieve machine analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetToPreset = () => {
    if (DEFAULT_MACHINE_PRESETS[selectedUnit]) {
      setSensorValues(DEFAULT_MACHINE_PRESETS[selectedUnit]);
    }
  };

  const getRiskTheme = (risk = 0, status = 'NORMAL') => {
    if (risk >= 70 || status === 'CRITICAL') {
      return {
        badge: 'bg-red-500/15 text-red-400 border-red-500/30',
        ring: 'text-red-500',
        glow: 'from-red-500/10 to-transparent',
        accent: 'text-red-400',
        bar: 'bg-gradient-to-r from-amber-500 to-red-500',
      };
    }
    if (risk >= 40 || status === 'HIGH') {
      return {
        badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        ring: 'text-amber-500',
        glow: 'from-amber-500/10 to-transparent',
        accent: 'text-amber-400',
        bar: 'bg-gradient-to-r from-yellow-500 to-amber-500',
      };
    }
    if (risk >= 20 || status === 'MODERATE') {
      return {
        badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
        ring: 'text-yellow-400',
        glow: 'from-yellow-500/10 to-transparent',
        accent: 'text-yellow-300',
        bar: 'bg-yellow-400',
      };
    }
    return {
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      ring: 'text-emerald-500',
      glow: 'from-emerald-500/10 to-transparent',
      accent: 'text-emerald-400',
      bar: 'bg-emerald-500',
    };
  };

  const theme = result ? getRiskTheme(result.failureRisk, result.status) : getRiskTheme(0);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 transition-all duration-300">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                SNS Agent Workbench Diagnostic Engine
              </h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                <Layers className="h-3 w-3" /> 7 Agent Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sensor Analysis ➔ XGBoost ➔ State Classifier ➔ Root Cause ➔ Planner ➔ Supervisor ➔ Final Report
            </p>
          </div>
        </div>

        {/* Status Mode Badge */}
        <div className="flex items-center gap-2">
          {result?.isLive ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live SNS Webhook
            </span>
          ) : (
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
              title="Routing securely through server-side /api/analyze gateway"
            >
              <Zap className="h-3 w-3 text-cyan-400" />
              SNS Gateway Active
            </span>
          )}
        </div>
      </div>

      {/* Machine Selector Pills */}
      <div className="mt-5 space-y-4">
        <div>
          <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Select Asset for In-Depth Analysis
          </label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.keys(DEFAULT_MACHINE_PRESETS).map((mId) => {
              const info = DEFAULT_MACHINE_PRESETS[mId];
              const isSelected = selectedUnit === mId;
              return (
                <button
                  key={mId}
                  type="button"
                  onClick={() => handleMachineSelect(mId)}
                  disabled={loading}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                      : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-white">{mId}</span>
                  <span className="text-[11px] truncate text-slate-300 mt-0.5">{info.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Telemetry Sensor Inputs */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-semibold text-white">Sensor Readings (Payload to Pipeline)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowManualTuning(!showManualTuning)}
                className="flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <Sliders className="h-3 w-3" />
                {showManualTuning ? 'Hide Sliders' : 'Fine-Tune Values'}
              </button>
              <button
                type="button"
                onClick={resetToPreset}
                title="Reset to selected machine default readings"
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors p-1"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* Temperature */}
            <div className="rounded-lg bg-slate-900/80 border border-slate-800/80 p-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-amber-400" /> Temp
                </span>
                <span className="font-mono font-bold text-white">{sensorValues.temperature}°C</span>
              </div>
              {showManualTuning && (
                <input
                  type="range"
                  min="20"
                  max="120"
                  step="0.5"
                  value={sensorValues.temperature}
                  onChange={(e) => handleInputChange('temperature', e.target.value)}
                  disabled={loading}
                  className="mt-2 w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              )}
            </div>

            {/* Vibration */}
            <div className="rounded-lg bg-slate-900/80 border border-slate-800/80 p-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Volume2 className="h-3.5 w-3.5 text-blue-400" /> Vibration
                </span>
                <span className="font-mono font-bold text-white">{sensorValues.vibration} mm/s</span>
              </div>
              {showManualTuning && (
                <input
                  type="range"
                  min="0.2"
                  max="12.0"
                  step="0.1"
                  value={sensorValues.vibration}
                  onChange={(e) => handleInputChange('vibration', e.target.value)}
                  disabled={loading}
                  className="mt-2 w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
              )}
            </div>

            {/* Current */}
            <div className="rounded-lg bg-slate-900/80 border border-slate-800/80 p-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-yellow-400" /> Current
                </span>
                <span className="font-mono font-bold text-white">{sensorValues.current} A</span>
              </div>
              {showManualTuning && (
                <input
                  type="range"
                  min="1.0"
                  max="25.0"
                  step="0.2"
                  value={sensorValues.current}
                  onChange={(e) => handleInputChange('current', e.target.value)}
                  disabled={loading}
                  className="mt-2 w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />
              )}
            </div>

            {/* RPM */}
            <div className="rounded-lg bg-slate-900/80 border border-slate-800/80 p-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" /> Velocity
                </span>
                <span className="font-mono font-bold text-white">{sensorValues.rpm} RPM</span>
              </div>
              {showManualTuning && (
                <input
                  type="range"
                  min="400"
                  max="4000"
                  step="20"
                  value={sensorValues.rpm}
                  onChange={(e) => handleInputChange('rpm', e.target.value)}
                  disabled={loading}
                  className="mt-2 w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              )}
            </div>

            {/* Load Percentage */}
            <div className="rounded-lg bg-slate-900/80 border border-slate-800/80 p-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5 text-purple-400" /> Load
                </span>
                <span className="font-mono font-bold text-white">{sensorValues.load_percentage}%</span>
              </div>
              {showManualTuning && (
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={sensorValues.load_percentage}
                  onChange={(e) => handleInputChange('load_percentage', e.target.value)}
                  disabled={loading}
                  className="mt-2 w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-cyan-400" />
            <span>Target: <code className="text-cyan-300 font-mono text-[11px]">POST https://api.agents.snsihub.ai/webhook/inspectsight</code></span>
          </div>

          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all cursor-pointer ${
              loading
                ? 'bg-slate-700 cursor-not-allowed opacity-80'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/25 active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Running 7-Stage Pipeline ({elapsedSeconds}s)...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Execute SNS 7-Agent Workflow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading Progress State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-xl border border-cyan-500/30 bg-slate-950/70 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              Executing 7-Agent Pipeline ({elapsedSeconds}s / ~30s)
            </span>
            <span className="text-xs font-mono text-slate-400">
              Stage {Math.min(currentStageIndex + 1, 7)} of 7
            </span>
          </div>

          <div className="space-y-2">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isDone = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div
                  key={stage.id}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                    isCurrent
                      ? 'bg-cyan-500/15 border border-cyan-500/40 text-white'
                      : isDone
                      ? 'bg-slate-900/60 text-slate-300'
                      : 'text-slate-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <div className="h-4 w-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px]">
                        {stage.id}
                      </div>
                    )}
                    <span className="font-semibold">{stage.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">{stage.desc}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 rounded-xl border border-red-500/30 bg-red-950/20 p-4 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-red-300">Analysis Temporarily Unavailable</h4>
            <p className="text-xs text-red-400/90">{error}</p>
            <button
              type="button"
              onClick={runAnalysis}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Retry Analysis
            </button>
          </div>
        </motion.div>
      )}

      {/* Success Result Panel */}
      {result && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-5 space-y-5"
        >
          {/* Header Summary */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Final Maintenance Report: {result.machine_id}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Completed in {result.executionTimeMs}ms via 7-Stage SNS Agent Workflow
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${theme.badge}`}>
                STATUS: {result.status}
              </span>
            </div>
          </div>

          {/* 3 Core Output Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metric 1: Failure Risk (%) */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium">1. XGBoost Failure Risk</span>
                <span className="font-mono text-xs font-semibold text-slate-300">Probability</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black font-mono tracking-tight ${theme.accent}`}>
                  {result.failureRisk}%
                </span>
                <span className="text-xs text-slate-400">risk index</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${theme.bar}`}
                  style={{ width: `${result.failureRisk}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Failure Mode */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium">2. Failure Mode (Agent 2 & 4)</span>
                <ShieldAlert className="h-4 w-4 text-amber-400" />
              </div>
              <h4 className="text-sm font-bold text-white leading-snug">
                {result.failureType}
              </h4>
              <p className="text-[11px] text-slate-400">
                Operational State: <span className="text-slate-200 font-semibold">{result.status}</span>
              </p>
            </div>

            {/* Metric 3: Urgency & Downtime */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium">3. Action & Downtime (Agent 5 & 6)</span>
                <Clock className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs">
                  <Wrench className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-white truncate">{result.maintenanceUrgency}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>Est. Downtime: <strong className="text-slate-200">{result.estimatedDowntime}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Root Cause Analysis (Agent 4) */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <Sparkles className="h-4 w-4" />
              <span>Root Cause Analysis & Diagnostic Details (Agent 4)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {result.rootCause}
            </p>
          </div>

          {/* Final Maintenance Report Summary (Agent 7) */}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                <FileText className="h-4 w-4 text-cyan-400" />
                <span>Executive Maintenance Report Summary (Agent 7)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Report Dispatched
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {result.reportSummary || `Final Maintenance Report generated for asset ${result.machine_id}. Protocol: ${result.maintenanceUrgency}. Estimated downtime window: ${result.estimatedDowntime}.`}
            </p>
          </div>

          {/* 7 Pipeline Stages Execution Audit */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Workflow Execution Trace (7 Stages Completed)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {result.pipelineStages.map((stage) => (
                <div
                  key={stage.stage}
                  className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-[11px] truncate">{stage.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{stage.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AnalyzeMachineCard;
