import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Radio,
  Cpu,
  Shield,
  X,
  Filter,
} from 'lucide-react';
import Card from '../components/Card';
import { Table } from '../components/Table';
import { getWorkers, addWorker, updateWorker, deleteWorker } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { buttonTap, easeSmooth } from '../components/motion';

export default function Workers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    role: 'Operator',
    assignedMachine: 'M-01 (Milling Station)',
    status: 'ACTIVE',
    shift: 'Shift 1 (06:00 - 14:00)',
    contact: '',
    radio: 'CH-01',
    certifications: '',
  });

  const loadWorkers = async () => {
    setIsLoading(true);
    try {
      const data = await getWorkers();
      setWorkers(data);
    } catch (err) {
      console.error('Failed to load workers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Route-level enforcement: Non-admins are immediately redirected away
    if (!user || user?.role?.toUpperCase() !== 'ADMIN') {
      navigate('/dashboard', { replace: true });
    } else {
      loadWorkers();
    }
  }, [user?.role, user?.id, navigate]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingWorker(null);
    setFormData({
      name: '',
      title: 'Machine Operator',
      role: 'Operator',
      assignedMachine: 'M-01 (Milling Station)',
      status: 'ACTIVE',
      shift: 'Shift 1 (06:00 - 14:00)',
      contact: '',
      radio: 'CH-01',
      certifications: 'Safety OSHA 10',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name || '',
      title: worker.title || '',
      role: worker.role || 'Operator',
      assignedMachine: worker.assignedMachine || 'M-01 (Milling Station)',
      status: worker.status || 'ACTIVE',
      shift: worker.shift || 'Shift 1 (06:00 - 14:00)',
      contact: worker.contact || '',
      radio: worker.radio || 'CH-01',
      certifications: worker.certifications || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('error', 'Worker full name is required.');
      return;
    }

    try {
      if (editingWorker) {
        await updateWorker(editingWorker.id, formData);
        showToast('success', `Worker ${formData.name} updated successfully.`);
      } else {
        await addWorker(formData);
        showToast('success', `Worker ${formData.name} registered successfully.`);
      }
      setIsModalOpen(false);
      loadWorkers();
    } catch (err) {
      showToast('error', 'Failed to save worker record.');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove worker record for ${name}?`)) {
      try {
        await deleteWorker(id);
        showToast('success', `Worker ${name} removed.`);
        loadWorkers();
      } catch (err) {
        showToast('error', 'Failed to delete worker.');
      }
    }
  };

  // Filtered workers list
  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      (w.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.assignedMachine || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Worker Name & ID',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-[var(--brand-accent)] flex items-center justify-center font-bold text-xs font-mono">
            {row.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-white text-xs">{row.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">{row.id} • {row.title}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Machine',
      key: 'assignedMachine',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-900 border border-slate-700/80 text-[var(--brand-accent)]">
          <Cpu className="w-3 h-3 text-[var(--brand-accent)]" />
          {row.assignedMachine}
        </span>
      ),
    },
    {
      header: 'Shift & Radio',
      key: 'shift',
      render: (row) => (
        <div className="text-[11px] font-mono">
          <div className="text-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> {row.shift}
          </div>
          <div className="text-slate-400 flex items-center gap-1 mt-0.5 text-[10px]">
            <Radio className="w-3 h-3 text-[var(--brand-accent)]" /> Radio: {row.radio}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => {
        const themes = {
          ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          ON_LEAVE: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          INACTIVE: 'bg-slate-800 text-slate-400 border-slate-700',
        };
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${themes[row.status] || themes.ACTIVE}`}>
            {row.status?.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      header: 'Qualifications',
      key: 'certifications',
      render: (row) => (
        <span className="text-[11px] text-slate-300 font-mono">
          {row.certifications || 'Standard Operator'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <motion.button
            whileTap={buttonTap}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEditModal(row);
            }}
            className="p-1.5 text-slate-400 hover:text-[var(--brand-accent)] hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Edit Worker"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            whileTap={buttonTap}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id, row.name);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            title="Remove Worker"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      ),
    },
  ];

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white font-mono">Restricted Module Access</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Shop-floor worker deployment, machinery station allocation, and technician shift records require Plant Administrator permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-20 right-8 z-50 px-4 py-2.5 rounded-xl border text-xs font-mono shadow-2xl backdrop-blur-md flex items-center gap-2 ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                : 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[var(--brand-accent)]" />
            Shop-Floor Worker Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Allocate machine stations, schedule shifts, track qualifications, and manage active plant personnel.
          </p>
        </div>

        <motion.button
          whileTap={buttonTap}
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-[var(--brand-glow)] flex items-center gap-2 font-mono cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Register New Worker
        </motion.button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Active on Floor</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
              {workers.filter((w) => w.status === 'ACTIVE').length} / {workers.length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Shift 1 Coverage</span>
            <div className="text-2xl font-bold font-mono text-[var(--brand-accent)] mt-0.5">
              {workers.filter((w) => w.shift?.includes('Shift 1')).length} Workers
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-[var(--brand-accent)] flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Stations Monitored</span>
            <div className="text-2xl font-bold font-mono text-white mt-0.5">
              4 / 4 Units
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-[var(--brand-accent)] flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card
        title="Personnel Roster"
        subtitle="Live roster of machinists, tooling specialists, and floor technicians"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, machine, or ID..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--brand-accent)] font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1 text-xs font-mono">
              {['ALL', 'ACTIVE', 'ON_LEAVE', 'INACTIVE'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${
                    statusFilter === st
                      ? 'bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)] font-bold'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          rows={filteredWorkers}
          emptyMessage="No shop floor personnel match the selected criteria."
          pageSize={8}
        />
      </Card>

      {/* Add / Edit Worker Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: easeSmooth }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white font-mono text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[var(--brand-accent)]" />
                  {editingWorker ? 'Edit Shop-Floor Worker' : 'Register New Shop-Floor Worker'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. David Alvarez"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[var(--brand-accent)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Role / Specialization</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Senior CNC Machinist"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[var(--brand-accent)]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Assigned Machine</label>
                    <select
                      value={formData.assignedMachine}
                      onChange={(e) => setFormData({ ...formData, assignedMachine: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white focus:outline-none focus:border-[var(--brand-accent)]"
                    >
                      <option value="M-01 (Milling Station)">M-01 (Milling Station)</option>
                      <option value="M-02 (Turning Cell)">M-02 (Turning Cell)</option>
                      <option value="M-03 (Coolant Loop B)">M-03 (Coolant Loop B)</option>
                      <option value="M-04 (Conveyor Optical Line)">M-04 (Conveyor Optical Line)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Shift Schedule</label>
                    <select
                      value={formData.shift}
                      onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white focus:outline-none focus:border-[var(--brand-accent)]"
                    >
                      <option value="Shift 1 (06:00 - 14:00)">Shift 1 (06:00 - 14:00)</option>
                      <option value="Shift 2 (14:00 - 22:00)">Shift 2 (14:00 - 22:00)</option>
                      <option value="Shift 3 (22:00 - 06:00)">Shift 3 (22:00 - 06:00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Operational Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white focus:outline-none focus:border-[var(--brand-accent)]"
                    >
                      <option value="ACTIVE">ACTIVE (On Shift)</option>
                      <option value="ON_LEAVE">ON LEAVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[var(--brand-accent)]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Radio Channel</label>
                    <input
                      type="text"
                      value={formData.radio}
                      onChange={(e) => setFormData({ ...formData, radio: e.target.value })}
                      placeholder="e.g. CH-02"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[var(--brand-accent)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Safety Certifications</label>
                  <input
                    type="text"
                    value={formData.certifications}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                    placeholder="e.g. ISO 9001, Six Sigma Green Belt"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[var(--brand-accent)]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={buttonTap}
                    type="submit"
                    className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white rounded-lg font-semibold transition-all shadow-md shadow-[var(--brand-glow)] cursor-pointer"
                  >
                    {editingWorker ? 'Update Worker' : 'Save Worker'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
