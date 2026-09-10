import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import MetricCard from '../components/MetricCard';
import Table from '../components/Table';
import AnimatedCheckmark from '../components/AnimatedCheckmark';
import { SkeletonGrid } from '../components/SkeletonLoader';
import { getAlerts, createAlert, acknowledgeAlert, deleteAlert } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Filter,
  Plus,
  Radio,
  Cpu,
  Trash2,
  X,
  Send,
  ShieldCheck,
  BellRing,
} from 'lucide-react';
import {
  buttonTap,
  listItemVariant,
  tabPillTransition,
  staggerContainer,
  sequenceHeader,
  sequenceSection,
} from '../components/motion';

export const Alerts = () => {
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const [alerts, setAlerts] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'AUTOMATED' | 'ADMIN_DISPATCH'
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);

  // Admin Alert Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    machine: 'M-01 (Milling Station Alpha)',
    severity: 'HIGH',
    message: '',
    source: 'Admin Directive Dispatch',
    assignedTo: 'All Operators',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAlertsList();
  }, []);

  const fetchAlertsList = async () => {
    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch (e) {
      console.error('Failed to load alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, ack: true } : a))
      );
      setFeedback(`Alert ${alertId} acknowledged. Logged to shift audit trail.`);
      setTimeout(() => setFeedback(''), 4000);
    } catch (e) {
      console.error('Failed to ack alert:', e);
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setFeedback('Unauthorized: Only Administrator accounts can create or broadcast alerts.');
      return;
    }

    if (!newAlert.message.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createAlert(newAlert, user);
      setAlerts((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setNewAlert({
        machine: 'M-01 (Milling Station Alpha)',
        severity: 'HIGH',
        message: '',
        source: 'Admin Directive Dispatch',
        assignedTo: 'All Operators',
      });
      setFeedback(`Incident Directive ${created.id} broadcasted to ${created.assignedTo}.`);
      setTimeout(() => setFeedback(''), 4500);
    } catch (err) {
      setFeedback(`Failed to create alert: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (!isAdmin) return;
    try {
      await deleteAlert(alertId, user);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setFeedback(`Alert ${alertId} removed by administrator.`);
      setTimeout(() => setFeedback(''), 3500);
    } catch (err) {
      setFeedback(`Error: ${err.message}`);
    }
  };

  // Unified filtering across severity and origin
  const filteredAlerts = alerts.filter((a) => {
    const matchesSev = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesType =
      typeFilter === 'ALL' ||
      (typeFilter === 'AUTOMATED' && (a.type === 'AUTOMATED' || !a.type)) ||
      (typeFilter === 'ADMIN_DISPATCH' && a.type === 'ADMIN_DISPATCH');
    return matchesSev && matchesType;
  });

  const columns = [
    {
      header: 'Alert ID & Channel',
      key: 'id',
      render: (r) => (
        <div>
          <div className="flex items-center gap-1.5 font-mono font-bold text-[var(--brand-accent)] text-xs">
            {r.id}
            {r.type === 'ADMIN_DISPATCH' ? (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Admin Directive
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)]">
                System Auto
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.source}</div>
        </div>
      ),
    },
    { header: 'Timestamp', key: 'timestamp', className: 'font-mono text-slate-400 text-[11px]' },
    {
      header: 'Equipment Source',
      key: 'machine',
      render: (r) => (
        <div>
          <span className="font-semibold text-white text-xs">{r.machine}</span>
          {r.assignedTo && (
            <div className="text-[10px] text-slate-400 font-mono">
              Assigned: <span className="text-[var(--brand-accent)]">{r.assignedTo}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Severity Level',
      key: 'severity',
      render: (r) => (
        <span
          className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border transition-all duration-400 ${
            r.severity === 'HIGH'
              ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
              : r.severity === 'MODERATE'
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              : 'bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)]'
          }`}
        >
          {r.severity}
        </span>
      ),
    },
    {
      header: 'Incident Details & Directives',
      key: 'message',
      render: (r) => (
        <div className="max-w-md">
          <span className="text-xs text-slate-200 leading-relaxed block">{r.message}</span>
          {r.createdBy && (
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Issued by: {r.createdBy}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status & Action',
      key: 'ack',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          {r.ack ? (
            <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center justify-end gap-1">
              <AnimatedCheckmark size={14} className="text-emerald-400" /> Acknowledged
            </span>
          ) : (
            <motion.button
              whileTap={buttonTap}
              onClick={() => handleAcknowledge(r.id)}
              className="px-3 py-1.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              Acknowledge
            </motion.button>
          )}

          {isAdmin && (
            <button
              onClick={() => handleDeleteAlert(r.id)}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              title="Delete Alert (Admin only)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
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
              Incident Management & Safety Halts
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              {isAdmin ? 'Administrator Central Dispatch' : 'Operator Incident Feed'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Active Shop Floor Anomaly & Safety Alerts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Unified stream of automated multi-sensor threshold triggers and plant administrator safety directives
          </p>
        </div>

        {/* Admin Broadcast Button */}
        {isAdmin && (
          <div className="flex items-center gap-2.5 shrink-0">
            <motion.button
              whileTap={buttonTap}
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white text-xs font-bold font-mono rounded-xl shadow-lg shadow-[var(--brand-glow)] flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Broadcast Safety Alert</span>
            </motion.button>
          </div>
        )}
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

      {/* Alert KPIs */}
      <motion.div
        variants={staggerContainer(0.05, 0.1)}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <MetricCard
          title="Pending Sign-Off"
          value={alerts.filter((a) => !a.ack).length}
          subtitle="Requires operator acknowledgment"
          trend="Action Required"
          icon={AlertTriangle}
          status="warning"
        />
        <MetricCard
          title="Critical Incidents (Level 3)"
          value={alerts.filter((a) => a.severity === 'HIGH').length}
          subtitle="Coolant, bearing & safety stops"
          trend="High Priority"
          icon={ShieldAlert}
          status="critical"
        />
        <MetricCard
          title="Directives Issued"
          value={alerts.filter((a) => a.type === 'ADMIN_DISPATCH').length}
          subtitle="Admin safety broadcasts active"
          trend="Supervised"
          icon={BellRing}
          status="healthy"
        />
      </motion.div>

      {/* Filter Tabs + Unified Alerts Register */}
      <motion.div
        variants={sequenceSection(0.25)}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-850 p-4 rounded-2xl border border-slate-750">
          {/* Severity Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Severity:
            </span>
            {['ALL', 'HIGH', 'MODERATE', 'LOW'].map((sev) => {
              const isSelected = severityFilter === sev;
              return (
                <motion.button
                  key={sev}
                  whileTap={buttonTap}
                  onClick={() => setSeverityFilter(sev)}
                  className={`relative px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-[var(--brand-accent)] border border-[var(--brand-border)]'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="alertSeverityTab"
                      transition={tabPillTransition}
                      className="absolute inset-0 rounded-lg bg-[var(--brand-subtle)] -z-0"
                    />
                  )}
                  <span className="relative z-10">{sev}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Channel / Origin Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-mono mr-1">Channel:</span>
            {[
              { id: 'ALL', label: 'All Alerts' },
              { id: 'AUTOMATED', label: 'System Automated' },
              { id: 'ADMIN_DISPATCH', label: 'Admin Directives' },
            ].map((type) => {
              const isSelected = typeFilter === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setTypeFilter(type.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)]'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        <Card
          title={`Unified Shop Floor Alerts Feed (${filteredAlerts.length} total)`}
          subtitle="Showing all automated machine threshold breaches and administrator directives in one unified roster"
          enableHoverLift={true}
        >
          <Table columns={columns} rows={filteredAlerts} />
        </Card>
      </motion.div>

      {/* Admin Alert Creation Modal */}
      <AnimatePresence>
        {isModalOpen && isAdmin && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-750 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)]">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Broadcast Safety Alert</h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Issue manual alert directive to shop floor operators
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAlert} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Equipment / Station
                  </label>
                  <select
                    value={newAlert.machine}
                    onChange={(e) => setNewAlert({ ...newAlert, machine: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] focus:border-[var(--brand-accent)]"
                  >
                    <option value="M-01 (Milling Station Alpha)">M-01 (Milling Station Alpha)</option>
                    <option value="M-02 (Turning Cell Beta)">M-02 (Turning Cell Beta)</option>
                    <option value="M-03 (Laser Scribing Unit)">M-03 (Laser Scribing Unit)</option>
                    <option value="M-04 (Hydraulic Press Gamma)">M-04 (Hydraulic Press Gamma)</option>
                    <option value="All Machining Cells">All Active Shop Floor Cells</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Severity Level
                    </label>
                    <select
                      value={newAlert.severity}
                      onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] focus:border-[var(--brand-accent)]"
                    >
                      <option value="HIGH">HIGH (Urgent)</option>
                      <option value="MODERATE">MODERATE (Warning)</option>
                      <option value="LOW">LOW (Advisory)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Assignee Target
                    </label>
                    <select
                      value={newAlert.assignedTo}
                      onChange={(e) => setNewAlert({ ...newAlert, assignedTo: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] focus:border-[var(--brand-accent)]"
                    >
                      <option value="All Operators">All Operators</option>
                      <option value="Machinist Shift 1">Machinist Shift 1</option>
                      <option value="Maintenance Engineering">Maintenance Engineering</option>
                      <option value="Quality Inspection Cell">Quality Inspection Cell</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Directive / Anomaly Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Mandatory thermal inspection required on spindle coolant line prior to 15:00 run."
                    value={newAlert.message}
                    onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] focus:border-[var(--brand-accent)] resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={buttonTap}
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white text-xs font-bold font-mono rounded-xl shadow-md shadow-[var(--brand-glow)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Broadcasting...' : 'Issue Directive'}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Alerts;
