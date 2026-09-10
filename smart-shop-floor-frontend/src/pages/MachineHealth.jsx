import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Table from '../components/Table';
import { getPredictions, getDefects, getInsights } from '../services/api';

export const MachineHealth = () => {
  const [activeTab, setActiveTab] = useState('predictions'); // 'predictions' | 'defects' | 'insights'
  const [predictions, setPredictions] = useState([]);
  const [defects, setDefects] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [predRes, defRes, insRes] = await Promise.all([
          getPredictions(),
          getDefects(),
          getInsights(),
        ]);
        setPredictions(predRes);
        setDefects(defRes);
        setInsights(insRes);
      } catch (e) {
        console.error('Failed to load machine health data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const predictionColumns = [
    { header: 'Machine', key: 'machine', render: (row) => <span className="font-semibold text-white">{row.machine}</span> },
    { header: 'Monitored Component', key: 'component', className: 'text-[var(--text-secondary)]' },
    { header: 'Estimated RUL', key: 'rulDays', render: (row) => `${row.rulDays} days remaining` },
    { header: 'Calculated Risk', key: 'risk', className: 'font-mono' },
    {
      header: 'Recommendation',
      key: 'status',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${row.status === 'Healthy' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>
          {row.status}
        </span>
      ),
    },
  ];

  const defectColumns = [
    { header: 'Defect ID', key: 'id', render: (row) => <span className="font-mono font-semibold text-[var(--brand-accent)]">{row.id}</span> },
    { header: 'Timestamp', key: 'time', className: 'font-mono text-[11px] text-[var(--text-muted)]' },
    { header: 'Machine', key: 'machine', className: 'text-[var(--text-secondary)]' },
    { header: 'Classification', key: 'defectType', render: (row) => <span className="font-bold text-white">{row.defectType}</span> },
    { header: 'AI Confidence', key: 'confidence', className: 'font-mono font-bold text-[var(--brand-accent)]' },
    {
      header: 'Severity',
      key: 'severity',
      render: (row) => {
        const isHigh = row.severity === 'High';
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${isHigh ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
            {row.severity}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Machine Health & Diagnostics</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Unified predictive maintenance, computer vision inspection, and AI root cause</p>
      </div>

      {/* Clean Tab Switcher */}
      <div className="flex border-b border-[var(--border-subtle)] gap-6 text-xs">
        <button
          onClick={() => setActiveTab('predictions')}
          className={`pb-3 font-semibold transition-colors relative cursor-pointer ${
            activeTab === 'predictions'
              ? 'text-[var(--brand-accent)] border-b-2 border-[var(--brand-primary)]'
              : 'text-[var(--text-muted)] hover:text-white'
          }`}
        >
          1. Predictive Maintenance ({predictions.length})
        </button>
        <button
          onClick={() => setActiveTab('defects')}
          className={`pb-3 font-semibold transition-colors relative cursor-pointer ${
            activeTab === 'defects'
              ? 'text-[var(--brand-accent)] border-b-2 border-[var(--brand-primary)]'
              : 'text-[var(--text-muted)] hover:text-white'
          }`}
        >
          2. Defect Vision Inspection ({defects.length})
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`pb-3 font-semibold transition-colors relative cursor-pointer ${
            activeTab === 'insights'
              ? 'text-[var(--brand-accent)] border-b-2 border-[var(--brand-primary)]'
              : 'text-[var(--text-muted)] hover:text-white'
          }`}
        >
          3. AI Insights & Root Cause ({insights.length})
        </button>
      </div>

      {/* Tab 1: Predictive Maintenance */}
      {activeTab === 'predictions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card title="Average Asset RUL" value="35.7 Days" subtitle="Across 4 active units" />
            <Card title="Risk Threshold" value="Critical < 7d" subtitle="Unit M-03 flagged for maintenance" />
            <Card title="Model Architecture" value="LSTM / Random Forest" subtitle="Inference latency: 42ms" />
          </div>
          <Table columns={predictionColumns} rows={predictions} />
        </div>
      )}

      {/* Tab 2: Defect Vision Inspection */}
      {activeTab === 'defects' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card title="Total Defects Flagged" value={defects.length} subtitle="Past 24 hours" />
            <Card title="Inspection Pipeline" value="YOLOv8s-Defect" subtitle="96.4% avg detection confidence" />
            <Card title="Resolution Status" value="1 Critical, 3 Handled" subtitle="Operator sign-off logged" />
          </div>
          <Table columns={defectColumns} rows={defects} />
        </div>
      )}

      {/* Tab 3: AI Insights */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {insights.map((item, idx) => (
            <Card key={idx} title={item.title} badge={`${item.confidence} Confidence`}>
              <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                <div>
                  <span className="font-semibold text-white">Action Plan: </span>
                  <span>{item.recommendation}</span>
                </div>
                <div className="text-[var(--brand-accent)] font-medium">
                  <span>Impact: </span>
                  <span>{item.impact}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MachineHealth;
