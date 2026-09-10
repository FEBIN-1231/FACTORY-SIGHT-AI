import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import Table from '../components/Table';
import AnimatedCheckmark from '../components/AnimatedCheckmark';
import { SkeletonTable } from '../components/SkeletonLoader';
import { getLogs } from '../services/api';
import { Download, CheckCircle2 } from 'lucide-react';
import { buttonTap, listItemVariant, sequenceHeader, sequenceSection } from '../components/motion';

export const Logs = () => {
  const [category, setCategory] = useState('operational');
  const [logs, setLogs] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [isExported, setIsExported] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchL = async () => {
      setLoading(true);
      try {
        const data = await getLogs(category);
        setLogs(data);
      } catch (e) {
        console.error('Failed to load logs:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchL();
  }, [category]);

  const handleExportCSV = () => {
    if (!logs.length) return;
    setIsExported(true);
    const headers = Object.keys(logs[0]).join(',');
    const rows = logs.map((row) => Object.values(row).map((val) => `"${val}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `factorysight_${category}_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setFeedback(`Exported ${logs.length} ${category} log records to CSV.`);
    setTimeout(() => {
      setFeedback('');
    }, 4000);
    setTimeout(() => {
      setIsExported(false);
    }, 3000);
  };

  const getColumns = () => {
    switch (category) {
      case 'telemetry':
        return [
          { header: 'Log ID', key: 'id', render: (r) => <span className="font-mono font-bold text-[var(--brand-accent)]">{r.id}</span> },
          { header: 'Timestamp', key: 'timestamp', className: 'font-mono text-slate-400 text-[11px]' },
          { header: 'Machine', key: 'machine', render: (r) => <span className="font-semibold text-white">{r.machine}</span> },
          { header: 'Parameter', key: 'parameter', render: (r) => <span className="text-slate-300">{r.parameter}</span> },
          { header: 'Recorded Value', key: 'value', className: 'font-mono font-bold text-[var(--brand-accent)]' },
          {
            header: 'Status',
            key: 'status',
            render: (r) => (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  r.status === 'Elevated'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {r.status}
              </span>
            ),
          },
        ];
      case 'inference':
        return [
          { header: 'Log ID', key: 'id', render: (r) => <span className="font-mono font-bold text-[var(--brand-accent)]">{r.id}</span> },
          { header: 'Timestamp', key: 'timestamp', className: 'font-mono text-slate-400 text-[11px]' },
          { header: 'Model Architecture', key: 'model', render: (r) => <span className="font-semibold text-white font-mono">{r.model}</span> },
          { header: 'Inference Latency', key: 'inferenceTime', className: 'font-mono text-[var(--brand-accent)] font-semibold' },
          { header: 'Detection Result', key: 'result', render: (r) => <span className="text-slate-200">{r.result}</span> },
          { header: 'Confidence', key: 'confidence', className: 'font-mono font-bold text-[var(--brand-accent)]' },
        ];
      case 'audit':
        return [
          { header: 'Log ID', key: 'id', render: (r) => <span className="font-mono font-bold text-[var(--brand-accent)]">{r.id}</span> },
          { header: 'Timestamp', key: 'timestamp', className: 'font-mono text-slate-400 text-[11px]' },
          { header: 'Operator Email', key: 'user', className: 'font-mono text-slate-300' },
          {
            header: 'Action Type',
            key: 'action',
            render: (r) => (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)]">
                {r.action}
              </span>
            ),
          },
          { header: 'Audit Detail', key: 'details', render: (r) => <span className="text-slate-300 leading-relaxed">{r.details}</span> },
        ];
      case 'operational':
      default:
        return [
          { header: 'Log ID', key: 'id', render: (r) => <span className="font-mono font-bold text-[var(--brand-accent)]">{r.id}</span> },
          { header: 'Timestamp', key: 'timestamp', className: 'font-mono text-slate-400 text-[11px]' },
          {
            header: 'Level',
            key: 'level',
            render: (r) => (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                  r.level === 'ERROR'
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : r.level === 'WARN'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {r.level}
              </span>
            ),
          },
          { header: 'Machine', key: 'machine', render: (r) => <span className="font-semibold text-white">{r.machine}</span> },
          { header: 'Event Payload', key: 'message', render: (r) => <span className="text-slate-200 leading-relaxed">{r.message}</span> },
        ];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner + Controls */}
      <motion.div
        variants={sequenceHeader}
        initial="initial"
        animate="animate"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-850 p-6 rounded-2xl border border-slate-750 shadow-md"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)] uppercase">
              Immutable SCADA & Audit Ledger
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">Real-time Write-Through</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Plant Operational & Telemetry Data Logs
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Category Switcher */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] focus:border-[var(--brand-accent)] font-mono cursor-pointer transition-colors"
          >
            <option value="operational">Operational & Machine Events</option>
            <option value="telemetry">High-Frequency Telemetry Stream</option>
            <option value="inference">CV Model Inference Results</option>
            <option value="audit">Security & Operator Audit Trail</option>
          </select>

          {/* Export CSV Button */}
          <motion.button
            whileTap={buttonTap}
            onClick={handleExportCSV}
            className={`px-3.5 py-2 font-semibold text-xs rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer font-mono ${
              isExported
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-[var(--brand-accent)] border-slate-700 hover:border-[var(--brand-border)]'
            }`}
          >
            {isExported ? (
              <>
                <AnimatedCheckmark size={14} className="text-emerald-400" />
                <span>Exported</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </>
            )}
          </motion.button>
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

      {/* Main Table or Skeleton */}
      <motion.div
        variants={sequenceSection(0.15)}
        initial="initial"
        animate="animate"
      >
        <Card
          title={`Showing Ledger: ${category.toUpperCase()}`}
          subtitle="Search and filter through historical event logs"
          variant="accent"
          enableHoverLift={true}
        >
          {loading ? (
            <SkeletonTable rows={6} />
          ) : (
            <Table
              columns={getColumns()}
              rows={logs}
              searchable={true}
              searchPlaceholder={`Search ${category} logs...`}
            />
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default Logs;
