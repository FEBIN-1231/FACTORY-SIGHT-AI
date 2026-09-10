import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Activity,
  Cpu,
  ScanEye,
  Sparkles,
  AlertTriangle,
  Database,
  Users,
  LogOut,
  X,
} from 'lucide-react';
import { tabPillTransition, iconHover, buttonTap } from './motion';
import Logo from './Logo';

export const Sidebar = ({ user, onLogout, onClose }) => {
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Telemetry', path: '/telemetry', icon: Activity },
    { label: 'Predictions', path: '/predictive-maintenance', icon: Cpu },
    { label: 'Defects', path: '/defects', icon: ScanEye },
    { label: 'Insights', path: '/insights', icon: Sparkles },
    { label: 'Alerts', path: '/alerts', icon: AlertTriangle, badge: '3' },
    { label: 'Logs', path: '/logs', icon: Database },
    ...(isAdmin ? [{ label: 'Workers', path: '/workers', icon: Users }] : []),
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/90 flex flex-col h-full min-h-screen shrink-0 select-none shadow-2xl z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/95 shrink-0">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 350, damping: 15 }}
            className="w-9 h-9 rounded-xl bg-[var(--bg-card)] flex items-center justify-center p-1 shadow-lg border border-[var(--brand-border)] cursor-pointer shrink-0"
          >
            <Logo variant="mark" className="w-7 h-auto" />
          </motion.div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wider font-mono uppercase">
              Factory Sight <span className="text-[var(--brand-accent)]">AI</span>
            </h1>
            <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">
              Predictive Maintenance
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
            title="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links - Flat, clean, focused core navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={({ isActive }) =>
                `relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 group ${
                  isActive ? 'text-[var(--brand-accent)] font-bold' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      transition={tabPillTransition}
                      className="absolute inset-0 bg-[var(--brand-subtle)] border border-[var(--brand-border)] rounded-xl shadow-sm z-0"
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-3">
                    <motion.div
                      whileHover={iconHover}
                      className="shrink-0 flex items-center justify-center"
                    >
                      <Icon className="w-4 h-4" />
                    </motion.div>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="relative z-10 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 shrink-0">
        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-[var(--brand-border)] shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-[var(--brand-accent)] flex items-center justify-center font-bold text-xs ring-1 ring-slate-700 shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-100 truncate">{user?.name || 'Operator'}</div>
              <div className="text-[9px] text-[var(--brand-accent)] font-mono font-semibold uppercase">
                {user?.role || 'OPERATOR'}
              </div>
            </div>
          </div>

          <motion.button
            whileTap={buttonTap}
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
