import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { easeSmooth } from '../components/motion';
import Logo from '../components/Logo';

export default function TermsPrivacy({ defaultTab = 'terms' }) {
  const [activeTab, setActiveTab] = React.useState(defaultTab);
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[var(--brand-primary)] selection:text-white">
      {/* Shared Lightweight Legal Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] flex items-center justify-center p-1 shadow-md shadow-[var(--brand-glow)]/20 border border-[var(--brand-border)]">
              <Logo variant="mark" className="w-6 h-auto" />
            </div>
            <span className="font-mono font-bold tracking-wider text-sm text-white">
              Factory Sight <span className="text-[var(--brand-accent)]">AI</span>
            </span>
          </Link>

          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[var(--brand-accent)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Application
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Tab Toggle */}
        <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Privacy Policy & Data Security
          </button>
        </div>

        {/* Content Body */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeSmooth }}
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 space-y-6 leading-relaxed text-slate-300 text-sm"
        >
          {activeTab === 'terms' ? (
            <>
              <div>
                <h1 className="text-2xl font-bold text-white mb-2 font-mono">Enterprise Terms of Service</h1>
                <p className="text-xs text-slate-400 font-mono">Last Updated: September 2026 • Version 2.4-Production</p>
              </div>

              <div className="space-y-4">
                <h2 className="text-base font-semibold text-white">1. Industrial SaaS Operations</h2>
                <p>
                  Factory Sight AI delivers predictive maintenance telemetry ingestion, machine vision defect classification, and failure forecasting software. By deploying edge gateways or accessing the cloud workspace, plant operators and administrators agree to these Terms.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-base font-semibold text-white">2. Machine Safety & Fail-Safe Responsibilities</h2>
                <p>
                  While FactorySight AI provides calibrated XGBoost failure prediction and computer vision anomaly alerts with high precision, machine emergency stops and physical interlocks must always comply with applicable ISO 13849 / IEC 62061 functional safety machinery directives.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-base font-semibold text-white">3. Telemetry Ownership & IP</h2>
                <p>
                  Customers retain 100% ownership of all proprietary factory telemetry, sensor feeds, production line video streams, and historical maintenance logs ingested into the platform.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-base font-semibold text-white">4. Service Level Commitments</h2>
                <p>
                  Enterprise installations include a 99.98% platform ingestion uptime commitment, redundant edge buffering during WAN disconnects, and prioritized 24/7 industrial engineering support.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-bold text-white mb-2 font-mono">Privacy Policy & Industrial Security</h1>
                <p className="text-xs text-slate-400 font-mono">Last Updated: September 2026 • SOC-2 & ISO 27001 Aligned</p>
              </div>

              <div className="space-y-4">
                <h2 className="text-base font-semibold text-white">1. Factory Telemetry Protection</h2>
                <p>
                  All sensor signals (vibration, thermography, acoustic, pressure) and vision inspection frames are encrypted in transit via TLS 1.3 and at rest via AES-256 with tenant-isolated key management.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-base font-semibold text-white">2. On-Premises & Edge Scrubbing</h2>
                <p>
                  Computer vision frames are processed locally at the edge gateway. Video feeds containing human operators can be automatically configured for localized facial and badge blurring before diagnostic indexing.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-base font-semibold text-white">3. Non-Disclosure of Manufacturing Yields</h2>
                <p>
                  We never monetize, cross-share, or use proprietary customer defect distributions or manufacturing yield rates to train public third-party foundation models without explicit private consortium authorization.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-base font-semibold text-white">4. Enterprise Audit Logs</h2>
                <p>
                  All operator logins, threshold adjustments, AI playbook dispatches, and maintenance confirmations are immutably logged for regulatory and safety audit compliance.
                </p>
              </div>
            </>
          )}

          <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="w-4 h-4" /> Certified Industrial Compliance Standard
            </span>
            <button
              onClick={handleGoBack}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Return to Previous Screen
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
