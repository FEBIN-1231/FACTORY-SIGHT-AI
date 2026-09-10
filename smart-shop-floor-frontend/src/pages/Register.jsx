import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, UserCheck, Wrench, ArrowRight, Lock, Mail, User, AlertCircle, Loader2, CheckCircle2, Shield } from 'lucide-react';
import { isFirstUserRegistration } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { buttonTap, listItemVariant } from '../components/motion';
import Logo from '../components/Logo';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const REGISTER_ROLE_DETAILS = {
  OPERATOR: {
    label: 'Operator',
    title: 'Senior Machine Operator',
    badgeColor: 'text-[var(--brand-accent)] bg-[var(--brand-subtle)] border-[var(--brand-border)]',
    description: 'Real-time telemetry, defect verification, machine status & operational shift logs.',
  },
  ENGINEER: {
    label: 'Engineer',
    title: 'Lead Maintenance Engineer',
    badgeColor: 'text-[var(--brand-accent)] bg-[var(--brand-subtle)] border-[var(--brand-border)]',
    description: 'Vibration FFT analysis, LSTM RUL models, camera feeds & equipment diagnostics.',
  },
  ADMIN: {
    label: 'Admin',
    title: 'Plant Director (Administrator)',
    badgeColor: 'text-[var(--brand-accent)] bg-[var(--brand-subtle)] border-[var(--brand-border)]',
    description: 'Plant command center, full worker roster, RBAC assignment & system logs.',
  },
};

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loginWithGoogle, loading: authLoading } = useAuth();
  const [isFirstAccount, setIsFirstAccount] = useState(() => isFirstUserRegistration());

  const queryRole = searchParams.get('role')?.toUpperCase();
  const validQueryRole = queryRole && ['OPERATOR', 'ENGINEER'].includes(queryRole) ? queryRole : null;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: isFirstAccount ? 'ADMIN' : (validQueryRole || 'OPERATOR'),
    organization: '',
    agreeTerms: true,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    const isFirst = isFirstUserRegistration();
    setIsFirstAccount(isFirst);
    if (isFirst) {
      setFormData((prev) => ({ ...prev, role: 'ADMIN' }));
    } else if (validQueryRole) {
      setFormData((prev) => ({ ...prev, role: validQueryRole }));
    }
  }, [validQueryRole]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handleRoleSelect = (role) => {
    if (isFirstAccount) return; // Locked to ADMIN for first account
    setFormData({ ...formData, role });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full legal name is required.';
    }

    const email = formData.email.trim();
    if (!email) {
      errors.email = 'Plant work email is required.';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Please enter a valid work email address (e.g. name@factory.com).';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirmation password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.agreeTerms) {
      errors.agreeTerms = 'You must accept the terms of service to proceed.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: isFirstAccount ? 'ADMIN' : formData.role,
        organization: formData.organization.trim(),
      });
      navigate('/dashboard');
    } catch (err) {
      setServerError(err?.message || 'Account registration could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsGoogleSubmitting(true);
    setServerError('');

    try {
      await loginWithGoogle(isFirstAccount ? 'ADMIN' : formData.role);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err?.message || 'Google account registration could not be completed.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isGoogleSubmitting || authLoading;
  const activeRoleKey = isFirstAccount ? 'ADMIN' : formData.role;
  const currentRoleInfo = REGISTER_ROLE_DETAILS[activeRoleKey] || REGISTER_ROLE_DETAILS.OPERATOR;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-[var(--brand-primary)] selection:text-white">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--brand-glow)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--brand-glow)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 group mb-2">
            <div className="w-11 h-11 rounded-xl bg-[var(--bg-card)] flex items-center justify-center p-1.5 shadow-lg shadow-[var(--brand-glow)]/20 border border-[var(--brand-border)] group-hover:border-[var(--brand-accent)] transition-colors">
              <Logo variant="mark" className="w-8 h-auto" />
            </div>
            <span className="font-mono font-bold tracking-wider text-xl text-white">
              Factory Sight <span className="text-[var(--brand-accent)]">AI</span>
            </span>
          </Link>
          <p className="text-xs text-[var(--text-muted)] font-mono">Industrial Reliability Command System</p>
        </div>

        {/* Form Card */}
        <div className="bg-[var(--bg-card)]/90 backdrop-blur-xl border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">Create Workstation Account</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Provision authorized access to telemetry, defect vision, and predictive models
            </p>
          </div>

          {/* Bootstrap Admin Notification Banner */}
          {isFirstAccount ? (
            <div className="mb-5 p-3.5 rounded-xl bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-xs font-mono text-[var(--brand-accent)] flex items-start gap-2.5 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[var(--brand-accent)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Bootstrap Role Assignment: Plant Director (ADMIN)</strong>
                This is the initial system account. It is automatically assigned <strong className="text-[var(--brand-accent)]">Administrator</strong> privileges.
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Role Assignment Selection
                </label>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${currentRoleInfo.badgeColor}`}>
                  Selected: {currentRoleInfo.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-[var(--bg-page)] p-1 rounded-xl border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('OPERATOR')}
                  className={`relative py-2.5 px-3 rounded-lg text-xs font-semibold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    formData.role === 'OPERATOR'
                      ? 'text-white bg-[var(--brand-primary)] border border-[var(--brand-border)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Operator
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('ENGINEER')}
                  className={`relative py-2.5 px-3 rounded-lg text-xs font-semibold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    formData.role === 'ENGINEER'
                      ? 'text-white bg-[var(--brand-primary)] border border-[var(--brand-border)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  Engineer
                </button>
              </div>
            </div>
          )}

          {/* Role Capability Description Notice */}
          <div className="mb-5 p-2.5 rounded-lg bg-[var(--bg-page)]/60 border border-[var(--border-subtle)]/80 text-[11px] font-mono text-[var(--text-muted)] flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--brand-accent)] shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="text-[var(--text-primary)] font-semibold">{currentRoleInfo.title}:</span>{' '}
              {currentRoleInfo.description}
            </div>
          </div>

          {/* Social Auth - Continue with Google */}
          <motion.button
            whileTap={buttonTap}
            type="button"
            disabled={isLoading}
            onClick={handleGoogleRegister}
            className="w-full py-2.5 px-4 bg-[var(--bg-page)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] hover:border-[var(--brand-border)] rounded-xl text-xs font-mono font-semibold text-[var(--text-primary)] flex items-center justify-center gap-3 transition-all shadow-sm cursor-pointer disabled:opacity-50 mb-5"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleSubmitting ? 'Registering via Google...' : `Register as ${currentRoleInfo.label} with Google`}</span>
          </motion.button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-subtle)]" />
            </div>
            <div className="relative flex justify-center text-[10px] font-mono uppercase text-[var(--text-muted)] bg-[var(--bg-card)] px-2">
              Or register with work email
            </div>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {serverError && (
              <motion.div
                variants={listItemVariant}
                initial="initial"
                animate="animate"
                exit="exit"
                className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-between font-mono"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{serverError}</span>
                </div>
                <button onClick={() => setServerError('')} className="text-slate-400 hover:text-white ml-2">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Full Legal Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Sarah Jenkins"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-[var(--bg-page)] border rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none font-mono transition-colors ${
                    fieldErrors.name ? 'border-rose-500/80 focus:border-rose-500' : 'border-[var(--border-subtle)] focus:border-[var(--brand-accent)]'
                  }`}
                />
              </div>
              {fieldErrors.name && (
                <p className="text-[11px] text-rose-400 font-mono mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Plant Work Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="s.jenkins@factory.com"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-[var(--bg-page)] border rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none font-mono transition-colors ${
                    fieldErrors.email ? 'border-rose-500/80 focus:border-rose-500' : 'border-[var(--border-subtle)] focus:border-[var(--brand-accent)]'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-400 font-mono mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Security Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-[var(--bg-page)] border rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none font-mono transition-colors ${
                      fieldErrors.password ? 'border-rose-500/80 focus:border-rose-500' : 'border-[var(--border-subtle)] focus:border-[var(--brand-accent)]'
                    }`}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-rose-400 font-mono mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-[var(--bg-page)] border rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none font-mono transition-colors ${
                      fieldErrors.confirmPassword ? 'border-rose-500/80 focus:border-rose-500' : 'border-[var(--border-subtle)] focus:border-[var(--brand-accent)]'
                    }`}
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-[11px] text-rose-400 font-mono mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Facility / Plant Unit (Optional)</label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="e.g. Apex Industrial Dynamics - Plant 2"
                className="w-full px-3.5 py-2.5 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-accent)] font-mono"
              />
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="mt-0.5 rounded bg-[var(--bg-page)] border-[var(--border-subtle)] text-[var(--brand-accent)] focus:ring-0 accent-[var(--brand-primary)]"
                />
                <span className="text-[11px] text-[var(--text-muted)] leading-snug">
                  I acknowledge adherence to the{' '}
                  <Link to="/terms" className="text-[var(--brand-accent)] hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-[var(--brand-accent)] hover:underline">
                    Industrial Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {fieldErrors.agreeTerms && (
                <p className="text-[11px] text-rose-400 font-mono mt-1">{fieldErrors.agreeTerms}</p>
              )}
            </div>

            <motion.button
              whileTap={buttonTap}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white font-mono text-xs font-bold rounded-xl shadow-lg shadow-[var(--brand-glow)] hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>{isFirstAccount ? 'Initialize Administrator Account' : `Create ${currentRoleInfo.label} Account`}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 pt-5 border-t border-[var(--border-subtle)]/80 text-center text-xs text-[var(--text-muted)] font-mono">
            Already have an active credential?{' '}
            <Link to="/login" className="text-[var(--brand-accent)] hover:text-white font-bold transition-colors">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
