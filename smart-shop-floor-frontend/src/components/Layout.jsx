import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { pageVariants, easeSmooth } from './motion';
import Logo from './Logo';

export const Layout = ({ user, onLogout }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Automatically close sidebar overlay when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans antialiased selection:bg-[var(--brand-primary)] selection:text-white">
      {/* Slide-out Overlay Sidebar & Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: easeSmooth }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-40"
              aria-hidden="true"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: easeSmooth }}
              className="fixed top-0 left-0 bottom-0 z-50 shadow-2xl"
            >
              <Sidebar
                user={user}
                onLogout={onLogout}
                onClose={() => setIsSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          onLogout={onLogout}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Option A: Persistent Dashboard Footer Strip */}
        <footer className="border-t border-slate-800/80 bg-slate-950/90 py-3 px-6 text-slate-400 text-xs font-mono select-none">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-slate-400">
              <Logo variant="mark" className="w-3.5 h-auto opacity-70" />
              <span>© {new Date().getFullYear()} Factory Sight AI</span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] text-slate-400">Factory Sight OS v2.4</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <Link
                to="/terms"
                className="hover:text-[var(--brand-accent)] transition-colors"
              >
                Terms of Service
              </Link>
              <span className="text-slate-700">•</span>
              <Link
                to="/privacy"
                className="hover:text-[var(--brand-accent)] transition-colors"
              >
                Privacy & Security
              </Link>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
