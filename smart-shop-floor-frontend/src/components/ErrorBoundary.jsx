import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center p-6 text-[var(--text-primary)] font-sans">
          <div className="max-w-md w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8 text-center shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Something went wrong</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed font-mono">
                An unexpected interface exception occurred. The system state has been preserved.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-[var(--bg-page)] rounded-xl border border-[var(--border-subtle)] text-[11px] font-mono text-rose-300 text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white font-mono text-xs font-bold rounded-xl shadow-lg shadow-[var(--brand-glow)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <a
                href="/"
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
