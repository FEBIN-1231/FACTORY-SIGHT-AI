import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, LogOut, Settings, User, Mail, ChevronDown, Menu, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sequenceHeader, buttonTap, listItemVariant } from './motion';
import UserAvatar from './UserAvatar';

export const Header = ({ user, onLogout, onToggleSidebar, isSidebarOpen }) => {
  const [time, setTime] = useState(new Date());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.header
      variants={sequenceHeader}
      initial="initial"
      animate="animate"
      className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 select-none"
    >
      {/* Left: Hamburger Toggle & Plant Live Status */}
      <div className="flex items-center gap-4 sm:gap-6">
        {onToggleSidebar && (
          <motion.button
            whileTap={buttonTap}
            onClick={onToggleSidebar}
            className="p-2 -ml-1.5 text-slate-300 hover:text-[var(--brand-accent)] hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-center justify-center shadow-sm"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </motion.button>
        )}

        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="beacon-glow absolute inline-flex h-full w-full rounded-full bg-[var(--brand-accent)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--brand-accent)]"></span>
          </span>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <span className="font-mono text-[var(--brand-accent)] uppercase tracking-wider text-[11px]">
              Live Telemetry Active
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-400 font-normal hidden sm:inline">24/24 Units Monitored</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
          <Clock className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
          <span>{time.toLocaleTimeString('en-US', { hour12: false })} UTC</span>
        </div>
      </div>

      {/* Right: Notification & Profile Dropdown */}
      <div className="flex items-center gap-3 sm:gap-4">
        <motion.div whileTap={buttonTap}>
          <Link
            to="/alerts"
            className="relative p-2 text-slate-400 hover:text-[var(--brand-accent)] hover:bg-slate-800 rounded-xl transition-colors block"
            title="Active Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--brand-accent)] rounded-full ring-2 ring-slate-900"></span>
          </Link>
        </motion.div>

        <div className="h-5 w-px bg-slate-800" />

        {/* Profile Capsule Menu */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            whileTap={buttonTap}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1.5 -mr-1.5 rounded-xl hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700 text-left cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-100 leading-tight">
                {user?.name || 'Operator'}
              </div>
              <div className="text-[10px] text-[var(--brand-accent)] font-mono uppercase">
                {user?.role || 'OPERATOR'}
              </div>
            </div>

            <UserAvatar user={user} size="md" />

            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                variants={listItemVariant}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 origin-top-right"
              >
                <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/40">
                  <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">{user?.email}</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)] px-2 py-0.5 rounded uppercase">
                      {user?.role || 'OPERATOR'}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Active Session
                    </span>
                  </div>
                </div>

                <div className="py-1 text-xs">
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <User className="w-4 h-4 text-[var(--brand-accent)]" />
                    <span>User Profile</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[var(--brand-accent)]" />
                      <span>System Settings & RBAC</span>
                    </Link>
                  )}

                  <Link
                    to="/contact"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[var(--brand-accent)]" />
                    <span>Reach Support Desk</span>
                  </Link>
                </div>

                <div className="border-t border-slate-800 pt-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
