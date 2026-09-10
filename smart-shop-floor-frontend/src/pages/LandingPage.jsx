import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  ScanEye,
  Cpu,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Gauge,
  CheckCircle2,
  ChevronRight,
  TrendingDown,
  Clock,
  Database,
  BarChart3,
  Server,
  Lock,
  Radio,
  Sliders,
  Maximize2,
  Flame,
  Check,
  Star,
  Menu,
  X,
} from 'lucide-react';
import { getStoredUser } from '../services/api';
import {
  easeSmooth,
  springCard,
  cardHoverLift,
  buttonTap,
  staggerContainer,
} from '../components/motion';
import AnimatedCounter from '../components/AnimatedCounter';
import Logo from '../components/Logo';

export default function LandingPage() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [user, setUser] = useState(() => getStoredUser());
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState('telemetry');
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });

  const handleHeroMouseMove = (e) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setHeroTilt({ x, y });
  };

  const handleHeroMouseLeave = () => {
    setHeroTilt({ x: 0, y: 0 });
  };

  // Track window scroll and user auth state changes
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    const handleStorageChange = () => {
      setUser(getStoredUser());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300 overflow-x-hidden transition-colors duration-200">
      {/* ========================================================================= */}
      {/* 1. NAVBAR */}
      {/* ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl py-3.5'
            : 'bg-transparent border-b border-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <motion.div
              whileHover={{ rotate: 8, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 350, damping: 15 }}
              className="w-10 h-10 rounded-xl bg-[var(--bg-card)] flex items-center justify-center p-1.5 shadow-lg border border-[var(--brand-border)] shrink-0"
            >
              <Logo variant="mark" className="w-8 h-auto" />
            </motion.div>
            <div className="flex flex-col justify-center">
              <span className="font-mono font-bold tracking-wider text-base text-white flex items-center gap-1.5 leading-tight">
                Factory Sight <span className="text-[var(--brand-accent)]">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase flex items-center gap-1.5 leading-tight mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)] animate-pulse" />
                Factory Sight Predictive System
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs lg:text-sm font-medium text-slate-300 whitespace-nowrap">
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Capabilities
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('preview')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Platform Preview
            </button>
            <button
              onClick={() => scrollToSection('trust')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Architecture
            </button>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 font-mono whitespace-nowrap"
              >
                Open Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-mono font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  Sign In
                </Link>
                <motion.button
                  whileTap={buttonTap}
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 font-mono cursor-pointer whitespace-nowrap"
                >
                  Request Demo
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ml-0.5 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md flex flex-col gap-3 text-xs font-mono font-semibold text-slate-300"
          >
            <button
              onClick={() => { scrollToSection('features'); setMobileMenuOpen(false); }}
              className="text-left py-1 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              • Capabilities
            </button>
            <button
              onClick={() => { scrollToSection('how-it-works'); setMobileMenuOpen(false); }}
              className="text-left py-1 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              • How It Works
            </button>
            <button
              onClick={() => { scrollToSection('preview'); setMobileMenuOpen(false); }}
              className="text-left py-1 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              • Platform Preview
            </button>
            <button
              onClick={() => { scrollToSection('trust'); setMobileMenuOpen(false); }}
              className="text-left py-1 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              • Architecture
            </button>
          </motion.div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Copy */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeSmooth }}
              className="lg:col-span-6 flex flex-col space-y-6"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-750 text-slate-300 text-xs font-mono w-fit backdrop-blur-md shadow-md">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Next-Gen Industrial Reliability Platform
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] drop-shadow-sm">
                Predict machine failure{' '}
                <span className="text-cyan-400">
                  before it causes costly downtime.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl">
                Factory Sight AI unifies real-time sensor telemetry, sub-millimeter computer vision defect inspection, calibrated XGBoost failure prediction, and automated diagnostic insights into a single operational command center.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <motion.button
                  whileTap={buttonTap}
                  onClick={() => navigate('/register')}
                  className="px-6 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-all shadow-xl flex items-center justify-center gap-2 font-mono cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-white" />
                  Request a Plant Pilot
                  <ChevronRight className="w-4 h-4" />
                </motion.button>

                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 font-mono cursor-pointer backdrop-blur-md shadow-md"
                >
                  See How It Works
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Key Assurance Badges */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-300 font-mono font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> OPC-UA & MQTT Ingestion
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> XGBoost RUL Models
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Edge Sub-150ms Latency
                </span>
              </div>
            </motion.div>

            {/* Right Hero Visual: Interactive 2.5D Dashboard Cockpit Mockup */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                rotateX: heroTilt.y,
                rotateY: heroTilt.x,
              }}
              onMouseMove={handleHeroMouseMove}
              onMouseLeave={handleHeroMouseLeave}
              transition={{ duration: 0.5, delay: 0.1, ease: easeSmooth }}
              style={{ transformStyle: 'preserve-3d' }}
              className="lg:col-span-6 relative select-none"
            >
              {/* Outer workstation frame */}
              <div className="relative rounded-2xl bg-slate-900/95 border border-slate-800 p-4 shadow-2xl backdrop-blur-xl">
                {/* Cockpit Window Top Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 mr-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-white font-bold tracking-wide">STATION 04: CNC MILLING CENTER</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    LIVE COCKPIT
                  </span>
                </div>

                {/* Main Visual Telemetry Grid */}
                <div className="space-y-3">
                  {/* Top Row: Waveform Stream + Live Heat Gauge */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Live Waveform Telemetry */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                          Vibration Spectrum
                        </span>
                        <span className="text-emerald-400 font-bold">0.42 mm/s</span>
                      </div>
                      {/* Continuous Waveform SVG */}
                      <div className="h-16 w-full bg-slate-900 rounded-lg border border-slate-800 flex items-center px-2 relative overflow-hidden">
                        <svg viewBox="0 0 200 40" className="w-full h-10 stroke-cyan-400 fill-none" strokeWidth="1.8">
                          <path
                            d="M 0 20 Q 15 5, 30 20 T 60 20 T 90 20 T 120 10 T 150 30 T 180 20 T 200 20"
                            className="stroke-cyan-400"
                          />
                        </svg>
                        <div className="absolute top-1.5 right-2 text-[9px] font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          8,450 RPM
                        </div>
                      </div>
                    </div>

                    {/* Bearing Thermal & Hydraulic Metrics */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          Spindle Temp
                        </span>
                        <span className="text-white font-bold">62.4 °C</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 my-1.5">
                        <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-500 h-full w-[68%]" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 text-slate-400 border-t border-slate-800">
                        <div>
                          <span>Pressure: </span>
                          <strong className="text-white">124 PSI</strong>
                        </div>
                        <div className="text-right">
                          <span>Inverter: </span>
                          <strong className="text-white">18.2 A</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: XGBoost Degradation Bar */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-white font-bold">XGBoost Remaining Useful Life (RUL)</span>
                      </div>
                      <span className="text-emerald-400 font-bold font-mono">99.2% Health</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono mb-2">
                      Est. <strong className="text-white">480 operating hours</strong> until scheduled bearing maintenance. No critical wear flags.
                    </p>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-600 h-full w-[92%]" />
                    </div>
                  </div>

                  {/* Bottom Row: YOLO Defect Vision + AI Diagnostics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                          <ScanEye className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-white font-mono">YOLOv8 Vision</div>
                          <div className="text-[10px] text-emerald-400 font-mono">0 Defect Parts (1.4k cycles)</div>
                        </div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-850 border border-slate-750 text-slate-300 flex items-center justify-center">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-white font-mono">AI Diagnostics</div>
                          <div className="text-[10px] text-slate-300 font-mono">Normal harmonic baseline</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-slate-300 bg-slate-850 px-1.5 py-0.5 rounded border border-slate-750">
                        READY
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Real-Time Telemetry Bar */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">SAMPLING RATE</span>
                    <span className="text-slate-200 font-bold text-xs">500 Hz (OPC-UA)</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">INFERENCE SPEED</span>
                    <span className="text-emerald-400 font-bold text-xs">42 ms</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">SYSTEM UPTIME</span>
                    <span className="text-white font-bold text-xs">99.98%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROBLEM / VALUE FRAMING */}
      {/* ========================================================================= */}
      <section id="problem" className="py-20 bg-slate-900 border-y border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30 shadow-sm">
              The Cost of Industrial Inaction
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mt-4 tracking-tight">
              Unplanned Stoppages Cost Millions in Lost Throughput
            </h2>
            <p className="text-slate-300 mt-3 text-sm sm:text-base leading-relaxed font-medium">
              Reactive repairs result in secondary tooling damage, missed delivery SLAs, and excessive scrap. Factory Sight AI transforms raw machine signals into proactive interventions.
            </p>
          </div>

          {/* Metric Stat Cards with Count-Up Animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, ease: easeSmooth }}
              whileHover={cardHoverLift}
              className="bg-slate-850 border border-slate-750 rounded-2xl p-6 relative overflow-hidden shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-slate-400">UNPLANNED DOWNTIME</span>
                <TrendingDown className="w-5 h-5 text-rose-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight flex items-baseline">
                $<AnimatedCounter value={260000} duration={850} />
                <span className="text-lg text-slate-400 font-sans ml-1">/hr</span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-normal font-medium">
                Average industrial plant cost for unexpected manufacturing line stoppages and idle operator shifts.
              </p>
            </motion.div>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.08, ease: easeSmooth }}
              whileHover={cardHoverLift}
              className="bg-slate-850 border border-slate-750 rounded-2xl p-6 relative overflow-hidden shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-slate-400">BREAKDOWN REDUCTION</span>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tracking-tight">
                <AnimatedCounter value={73} duration={850} suffix="%" />
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-normal font-medium">
                Drop in catastrophic mechanical failures through early vibration spectrum and thermal deviation detection.
              </p>
            </motion.div>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.16, ease: easeSmooth }}
              whileHover={cardHoverLift}
              className="bg-slate-850 border border-slate-750 rounded-2xl p-6 relative overflow-hidden shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-slate-400">VISION DEFECT CAPTURE</span>
                <ScanEye className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400 font-mono tracking-tight">
                <AnimatedCounter value={99.4} decimals={1} duration={850} suffix="%" />
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-normal font-medium">
                Sub-millimeter surface fracture and edge defect identification rate on high-speed conveyor lines.
              </p>
            </motion.div>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.24, ease: easeSmooth }}
              whileHover={cardHoverLift}
              className="bg-slate-850 border border-slate-750 rounded-2xl p-6 relative overflow-hidden shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-slate-400">INFERENCE LATENCY</span>
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight flex items-baseline">
                &lt; <AnimatedCounter value={150} duration={850} suffix=" ms" />
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-normal font-medium">
                Edge gateway dual-inference cycle enabling automated safety interlock and rapid spindle throttling.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FEATURES (4 CORE PILLARS) */}
      {/* ========================================================================= */}
      <section id="features" className="py-24 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mt-4 tracking-tight">
              An Integrated Quad-Pillar Maintenance Intelligence Stack
            </h2>
            <p className="text-slate-300 mt-3 text-sm sm:text-base leading-relaxed">
              Eliminate siloed monitoring. We fuse sensory streams with machine vision and machine learning models for holistic asset health.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature Card 1: Telemetry */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, ease: easeSmooth }}
              whileHover={cardHoverLift}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-8 relative group shadow-xl transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-6 shadow-md">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-mono mb-2 group-hover:text-cyan-400 transition-colors">
                Real-Time Telemetry & Sensor Streaming
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Continuous high-frequency ingestion of multi-axis vibration, thermography, hydraulic pressure, and rotational velocity. Configurable dynamic thresholds instantly highlight localized signal anomalies.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">OPC-UA / MQTT</span>
                <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">Sub-Second Waveforms</span>
                <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">Spectral Peak Tracking</span>
              </div>
            </motion.div>

            {/* Feature Card 2: Defect Vision */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: 0.08, ease: easeSmooth }}
              whileHover={cardHoverLift}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-8 relative group shadow-xl transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-6 shadow-md">
                <ScanEye className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-mono mb-2 group-hover:text-cyan-400 transition-colors">
                Computer Vision Defect Inspection
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Deep-learning optical inspection models analyze conveyor feeds and surface imagery in real-time. Detects micro-cracks, surface pitting, tool scoring, and assembly misalignments with bounding-box precision.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">YOLOv8 Edge Models</span>
                <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">Sub-Millimeter Resolution</span>
                <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">Automated Scrap Classification</span>
              </div>
            </motion.div>

            {/* Feature Card 3: Predictive XGBoost */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: 0.16, ease: easeSmooth }}
              whileHover={cardHoverLift}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-8 relative group shadow-xl transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-6 shadow-md">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-mono mb-2 group-hover:text-cyan-400 transition-colors">
                Predictive XGBoost Failure Modeling
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Trained on extensive machine degradation datasets, our calibrated gradient-boosted models predict Remaining Useful Life (RUL) and calculate failure probabilities across varying load cycles.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">RUL Hours Estimation</span>
                <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">Multi-Feature Regression</span>
                <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">Confidence Interval Curves</span>
              </div>
            </motion.div>

            {/* Feature Card 4: AI Insights */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: 0.24, ease: easeSmooth }}
              whileHover={cardHoverLift}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-8 relative group shadow-xl transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-6 shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-mono mb-2 group-hover:text-cyan-400 transition-colors">
                AI Diagnostic & Root-Cause Playbooks
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Generative diagnostic engine synthesizes correlated sensor spikes into plain-language root-cause assessments. Automatically generates step-by-step remediation procedures for floor technicians.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">Root-Cause Synthesis</span>
                <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">Prescriptive Playbooks</span>
                <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">Automated Work-Orders</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. HOW IT WORKS */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-24 bg-slate-900 border-y border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30 shadow-sm">
              End-to-End Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mt-4 tracking-tight">
              From Raw Shop-Floor Signal to Resolved Maintenance Order
            </h2>
            <p className="text-slate-300 mt-3 text-sm sm:text-base leading-relaxed font-medium">
              A 4-step autonomous loop ensuring that mechanical wear is captured, classified, and corrected before causing a line halt.
            </p>
          </div>

          {/* 4-Step Horizontal Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: easeSmooth }}
              className="bg-slate-850 border border-slate-750 rounded-2xl p-6 relative flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="text-xs font-mono text-cyan-400 font-bold mb-3 flex items-center justify-between">
                  <span>STEP 01</span>
                  <Database className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="text-base font-bold text-white font-mono mb-2">Connect & Ingest</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Edge gateways connect directly to PLCs via OPC-UA/MQTT and ingest high-speed optical camera streams with zero production interruption.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-cyan-400 font-bold">
                • 500Hz sampling rate
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08, ease: easeSmooth }}
              className="bg-slate-850 border border-slate-750 rounded-2xl p-6 relative flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="text-xs font-mono text-cyan-400 font-bold mb-3 flex items-center justify-between">
                  <span>STEP 02</span>
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="text-base font-bold text-white font-mono mb-2">Detect & Predict</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Dual inference engines evaluate vibration harmonics against baseline degradation patterns and segment surface defect clusters.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-cyan-400 font-bold">
                • XGBoost + YOLOv8 pipeline
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.16, ease: easeSmooth }}
              className="bg-slate-850 border border-slate-750 rounded-2xl p-6 relative flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="text-xs font-mono text-cyan-400 font-bold mb-3 flex items-center justify-between">
                  <span>STEP 03</span>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="text-base font-bold text-white font-mono mb-2">Synthesize Insights</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  AI diagnostic agent maps anomalous telemetry to mechanical root causes and constructs an exact technician dispatch guide.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-cyan-400 font-bold">
                • Contextual remediation
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.24, ease: easeSmooth }}
              className="bg-slate-850 border border-slate-750 rounded-2xl p-6 relative flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="text-xs font-mono text-cyan-400 font-bold mb-3 flex items-center justify-between">
                  <span>STEP 04</span>
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="text-base font-bold text-white font-mono mb-2">Act Before Failure</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Automated dispatch triggers plant CMMS work orders, sends mobile alerts to maintenance leads, and applies safe spindle speed de-rating.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-cyan-400 font-bold">
                • Zero emergency downtime
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. INTERACTIVE DASHBOARD PREVIEW */}
      {/* ========================================================================= */}
      <section id="preview" className="py-24 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
              Interactive Workspace Preview
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mt-4 tracking-tight">
              Designed for High-Velocity Industrial Operations
            </h2>
            <p className="text-slate-300 mt-3 text-sm sm:text-base leading-relaxed">
              Explore how plant supervisors and maintenance technicians interact with live machinery metrics, defect maps, and predictive models.
            </p>
          </div>

          {/* Interactive Preview Container */}
          <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Top Workspace Tab Switcher */}
            <div className="border-b border-slate-800 bg-slate-850 p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setActivePreviewTab('telemetry')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewTab === 'telemetry'
                      ? 'bg-cyan-600 text-white border border-cyan-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Live Spindle Telemetry
                </button>
                <button
                  onClick={() => setActivePreviewTab('defects')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewTab === 'defects'
                      ? 'bg-cyan-600 text-white border border-cyan-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ScanEye className="w-3.5 h-3.5" />
                  Defect Inspection Feed
                </button>
                <button
                  onClick={() => setActivePreviewTab('prediction')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewTab === 'prediction'
                      ? 'bg-cyan-600 text-white border border-cyan-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  XGBoost RUL Health
                </button>
                <button
                  onClick={() => setActivePreviewTab('insights')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewTab === 'insights'
                      ? 'bg-cyan-600 text-white border border-cyan-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Diagnostic Playbook
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Station: Line-03 • Live Stream</span>
              </div>
            </div>

            {/* Tab Content Display Area */}
            <div className="p-6 bg-slate-900/90 min-h-[340px] flex items-center justify-center">
              {activePreviewTab === 'telemetry' && (
                <motion.div
                  key="telemetry"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: easeSmooth }}
                  className="w-full grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-4">
                    <div className="flex justify-between items-center text-xs font-mono text-slate-300 mb-1">
                      <span>VIBRATION RMS</span>
                      <span className="text-emerald-400">NORMAL</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white mb-2">0.42 mm/s</div>
                    <div className="h-12 flex items-end gap-1">
                      {[30, 45, 38, 52, 40, 48, 44, 39, 41, 46, 42, 40, 43, 41].map((h, i) => (
                        <div key={i} className="flex-1 bg-cyan-500/40 rounded-t" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-4">
                    <div className="flex justify-between items-center text-xs font-mono text-slate-300 mb-1">
                      <span>BEARING TEMP</span>
                      <span className="text-slate-300">STABLE</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white mb-2">62.4 °C</div>
                    <div className="h-12 flex items-end gap-1">
                      {[60, 61, 62, 62, 63, 62, 64, 63, 62, 62, 63, 62, 62, 62].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-500/40 rounded-t" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-4">
                    <div className="flex justify-between items-center text-xs font-mono text-slate-300 mb-1">
                      <span>SPINDLE LOAD</span>
                      <span className="text-emerald-400">OPTIMAL</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white mb-2">8,450 RPM</div>
                    <div className="h-12 flex items-end gap-1">
                      {[70, 72, 71, 75, 74, 73, 76, 74, 75, 73, 74, 75, 74, 75].map((h, i) => (
                        <div key={i} className="flex-1 bg-emerald-500/40 rounded-t" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activePreviewTab === 'defects' && (
                <motion.div
                  key="defects"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: easeSmooth }}
                  className="w-full grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center text-xs font-mono mb-2">
                        <span className="text-white font-bold">FRAME #82941 • CAMERA 02</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          DEFECT DETECTED
                        </span>
                      </div>
                      <div className="h-44 bg-slate-950 rounded-lg border border-slate-800 relative flex items-center justify-center p-4">
                        <div className="w-48 h-32 border-2 border-dashed border-rose-400/80 rounded relative flex items-center justify-center bg-rose-500/5">
                          <span className="text-[11px] font-mono text-rose-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-rose-500/40">
                            Micro-Crack (0.14mm) • Conf: 98.6%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-mono text-slate-300 block mb-2">CLASSIFICATION MATRIX</span>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                          <span className="text-slate-300">Surface Pitting</span>
                          <span className="text-emerald-400">0.02% (Low)</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                          <span className="text-slate-300">Bevel Fracture</span>
                          <span className="text-rose-400">0.14mm (Critical)</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                          <span className="text-slate-300">Tool Wear Index</span>
                          <span className="text-amber-400">Stage 2 (Warning)</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-800">
                      Auto-flagged to inspection queue for manual laser validation.
                    </div>
                  </div>
                </motion.div>
              )}

              {activePreviewTab === 'prediction' && (
                <motion.div
                  key="prediction"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: easeSmooth }}
                  className="w-full grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-mono text-slate-300 block mb-1">XGBOOST DEGRADATION REGRESSION</span>
                      <div className="text-3xl font-extrabold text-white font-mono mb-2">480 Hours</div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Predicted Remaining Useful Life (RUL) until spindle bearing tolerance exceeds ISO vibration severity class III thresholds.
                      </p>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 mt-4">
                      <div className="bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-600 h-full w-[84%]" />
                    </div>
                  </div>

                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-mono text-slate-300 block mb-2">FEATURE IMPORTANCE CONTRIBUTION</span>
                      <div className="space-y-2 text-xs font-mono">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-300">Bearing Harmonic RMS</span>
                            <span className="text-white">42% weight</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-cyan-500 h-full w-[42%]" />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-300">Thermal Delta (ΔT)</span>
                            <span className="text-slate-300">31% weight</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full w-[31%]" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400 pt-2 border-t border-slate-800">
                      Confidence Interval: 94.2% across 1,200 simulated run cycles.
                    </div>
                  </div>
                </motion.div>
              )}

              {activePreviewTab === 'insights' && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: easeSmooth }}
                  className="w-full bg-slate-850 border border-slate-750 rounded-xl p-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold text-white uppercase">AI Diagnostic Synthesis</span>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 ml-auto">
                      AUTONOMOUS TICKET #4819
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans mb-4">
                    <strong className="text-white font-mono">Root Cause Assessment:</strong> Correlation between elevated 2.4kHz spectral peaks and +4.2°C thermal rise in the secondary drive axis indicates early inner raceway fatigue. No critical immediate halt required.
                  </p>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 space-y-1.5">
                    <div className="text-cyan-400 font-bold">RECOMMENDED REMEDIATION:</div>
                    <div>1. Schedule bearing re-lubrication (ISO VG 68 synthetic) at next shift turnover.</div>
                    <div>2. Re-inspect axial play with dial indicator during scheduled 18:00 downtime.</div>
                    <div>3. Maintain feed rate below 4,200 mm/min until lubrication confirmation.</div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Workspace Action Bar */}
            <div className="border-t border-slate-800 bg-slate-850 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
              <span className="text-slate-300">
                Want to test your plant's sensor telemetry against our machine learning models?
              </span>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                Access Live Sandbox <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CUSTOMER REVIEWS & OPERATIONAL CASE EVIDENCE */}
      {/* ========================================================================= */}
      <section id="reviews" className="py-24 bg-slate-900 border-y border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30 shadow-sm">
              Operational Case Evidence
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mt-4 tracking-tight">
              Validated by Industrial Plant & Reliability Directors
            </h2>
            <p className="text-slate-300 mt-3 text-sm sm:text-base leading-relaxed font-medium">
              How high-precision machining facilities and discrete manufacturing plants eliminate unpredicted mechanical stoppages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Review 1 */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, ease: easeSmooth }}
              whileHover={cardHoverLift}
              className="bg-slate-850 border border-slate-750 rounded-2xl p-6 flex flex-col justify-between relative shadow-lg"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 italic font-medium">
                  "FactorySight's XGBoost failure model caught spindle harmonic degradation on our primary CNC milling line 9 days before scheduled inspection, preventing an estimated $340,000 catastrophic tooling halt."
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs font-mono">
                  HM
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Henrik Møller</div>
                  <div className="text-[11px] text-slate-400 font-mono font-semibold">VP of Plant Reliability • Nordic Precision Tooling</div>
                </div>
              </div>
            </motion.div>

            {/* Review 2 */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: 0.08, ease: easeSmooth }}
              whileHover={cardHoverLift}
              className="bg-slate-850 border border-slate-750 rounded-2xl p-6 flex flex-col justify-between relative shadow-lg"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 italic font-medium">
                  "The YOLO defect vision module detected sub-millimeter casting micro-cracks at conveyor line speeds over 40 m/min. Scrap rate dropped by 64% in the first quarter of deployment."
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs font-mono">
                  AR
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Angela Reyes</div>
                  <div className="text-[11px] text-slate-400 font-mono font-semibold">Director of Quality Systems • Apex Powertrain</div>
                </div>
              </div>
            </motion.div>

            {/* Review 3 */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: 0.16, ease: easeSmooth }}
              whileHover={cardHoverLift}
              className="bg-slate-850 border border-slate-750 rounded-2xl p-6 flex flex-col justify-between relative shadow-lg"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 italic font-medium">
                  "The autonomous diagnostic playbooks save our shift technicians hours of guesswork. Correlating vibration spikes directly to specific bearing raceway wear changed our entire maintenance culture."
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs font-mono">
                  TK
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Thomas Kowalski</div>
                  <div className="text-[11px] text-slate-400 font-mono font-semibold">Lead Maintenance Engineer • Silesia Heavy Machining</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. TECHNICAL ARCHITECTURE & TRUST STANDARDS */}
      {/* ========================================================================= */}
      <section id="trust" className="py-20 bg-slate-950 border-y border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
              Enterprise Interoperability
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
              Engineered for Critical Factory Environments
            </h2>
            <p className="text-slate-300 mt-2 text-xs sm:text-sm">
              Standardized protocols, edge security, and hardware-agnostic connectivity built for modern Industry 4.0.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center shadow-lg">
              <Server className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="font-mono text-sm font-bold text-white">OPC-UA & MQTT</div>
              <div className="text-[11px] text-slate-400 mt-1">Direct PLC / SCADA link</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center shadow-lg">
              <Lock className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <div className="font-mono text-sm font-bold text-white">ISO 27001 & SOC 2</div>
              <div className="text-[11px] text-slate-400 mt-1">Tenant-isolated encryption</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center shadow-lg">
              <Radio className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="font-mono text-sm font-bold text-white">Edge Fail-Safe</div>
              <div className="text-[11px] text-slate-400 mt-1">Offline buffer & local alerts</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center shadow-lg">
              <Sliders className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <div className="font-mono text-sm font-bold text-white">Hardware Agnostic</div>
              <div className="text-[11px] text-slate-400 mt-1">Siemens, Fanuc, ABB & custom</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FINAL CTA */}
      {/* ========================================================================= */}
      <section className="py-24 relative overflow-hidden bg-slate-950">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeSmooth }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden"
          >
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
              Zero Emergency Stoppages
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
              Ready to modernize your shop-floor reliability?
            </h2>

            <p className="text-slate-300 mt-3 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Deploy our predictive telemetry and computer vision models on your assembly lines in less than 48 hours. Experience zero unpredicted mechanical downtime.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileTap={buttonTap}
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-all shadow-xl flex items-center justify-center gap-2 font-mono cursor-pointer"
              >
                <Zap className="w-4 h-4 text-white" />
                Request Custom Plant Pilot
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-4 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 font-mono"
              >
                Operator Login
              </Link>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-cyan-400" /> 14-day risk-free pilot</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-cyan-400" /> No hardware lock-in</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-cyan-400" /> Dedicated onboarding engineer</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 text-slate-400 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand & About Us column */}
            <div className="md:col-span-2 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] flex items-center justify-center p-1 shadow-md border border-[var(--brand-border)]">
                  <Logo variant="mark" className="w-6 h-auto" />
                </div>
                <span className="font-mono font-bold tracking-wider text-sm text-white">
                  Factory Sight <span className="text-[var(--brand-accent)]">AI</span>
                </span>
              </div>
              <div>
                <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-1.5 font-mono">
                  About Us
                </h5>
                <p className="text-slate-400 text-xs leading-relaxed max-w-md font-sans">
                  Factory Sight AI is an industrial intelligence company dedicated to eliminating unpredicted shop-floor downtime. We build edge-native AI systems that fuse high-frequency sensor telemetry, sub-millimeter computer vision defect inspection, and calibrated XGBoost degradation modeling — empowering modern discrete manufacturing teams to operate with total reliability and zero emergency halts.
                </p>
              </div>
              <div className="flex items-center gap-2 text-cyan-400 text-[11px] pt-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-slate-300 font-mono">All Global Edge Ingestion Nodes Operational (99.98%)</span>
              </div>
            </div>

            {/* Platform links */}
            <div>
              <h5 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Platform</h5>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-cyan-400 transition-colors cursor-pointer">
                    Sensor Telemetry
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-cyan-400 transition-colors cursor-pointer">
                    Defect Vision AI
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-cyan-400 transition-colors cursor-pointer">
                    XGBoost RUL Predictor
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-cyan-400 transition-colors cursor-pointer">
                    Autonomous Insights
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal & Auth */}
            <div>
              <h5 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Access & Legal</h5>
              <ul className="space-y-2">
                <li>
                  <Link to="/login" className="hover:text-cyan-400 transition-colors">
                    Operator Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-cyan-400 transition-colors">
                    Request Plant Demo
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-cyan-400 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-cyan-400 transition-colors">
                    Privacy & Industrial Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © {new Date().getFullYear()} Factory Sight AI. All rights reserved.
            </div>
            <div>
              Production Industrial Firmware Standard v2.4
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
