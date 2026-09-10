import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { buttonTap, listItemVariant } from '../components/motion';

import UserAvatar from '../components/UserAvatar';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'OPERATOR',
    department: user?.department || 'Operations & Maintenance',
    shift: user?.shift || 'First Shift (07:00 - 15:30)',
    phone: user?.phone || '',
    plantLocation: user?.plantLocation || 'Facility Main Sector',
    machineryScope: user?.machineryScope || 'M-01, M-02',
  });

  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'OPERATOR',
        department: user.department || 'Operations & Maintenance',
        shift: user.shift || 'First Shift (07:00 - 15:30)',
        phone: user.phone || '',
        plantLocation: user.plantLocation || 'Facility Main Sector',
        machineryScope: user.machineryScope || 'M-01, M-02',
      });
      if (user.avatar) {
        setAvatarUrl(user.avatar);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocalImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please select a valid image file (PNG, JPG, WebP).' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Image size exceeds 2MB limit.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Image = event.target.result;
      setAvatarUrl(base64Image);
      updateProfile({ avatar: base64Image });
      setStatusMessage({ type: 'success', text: 'Profile photo updated from local storage.' });
    };
    reader.readAsDataURL(file);
  };

  const handleSyncGmailAvatar = () => {
    const email = formData.email?.trim().toLowerCase();
    if (!email) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid Gmail address to fetch profile picture.' });
      return;
    }

    const dicebearSeed = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`;
    setAvatarUrl(dicebearSeed);
    updateProfile({ avatar: dicebearSeed });
    setStatusMessage({ type: 'success', text: `Profile photo synced with ${email}.` });
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    updateProfile({ avatar: '' });
    setStatusMessage({ type: 'info', text: 'Profile photo removed. Initials avatar activated.' });
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    setTimeout(() => {
      updateUser({
        name: formData.name,
        role: formData.role,
        department: formData.department,
        shift: formData.shift,
        phone: formData.phone,
        plantLocation: formData.plantLocation,
        machineryScope: formData.machineryScope,
        avatar: avatarUrl,
      });
      setIsSaving(false);
      setStatusMessage({ type: 'success', text: 'Personnel profile settings successfully saved.' });
    }, 400);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--brand-glow)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <UserAvatar
                name={formData.name}
                email={formData.email}
                avatar={avatarUrl}
                size="xl"
                rounded="rounded-2xl"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-900 rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{formData.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)]">
                  {formData.role}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">{formData.email}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                <span>🏭 {formData.plantLocation}</span>
                <span>⏱️ {formData.shift}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <motion.label
              whileTap={buttonTap}
              className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4 text-[var(--brand-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Local Image
              <input type="file" accept="image/*" className="hidden" onChange={handleLocalImageUpload} />
            </motion.label>

            <motion.button
              whileTap={buttonTap}
              onClick={handleSyncGmailAvatar}
              className="px-4 py-2 bg-[var(--brand-subtle)] hover:bg-[var(--brand-subtle)] text-[var(--brand-accent)] text-xs font-semibold rounded-lg border border-[var(--brand-border)] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              title="Sync profile picture from Google/Gmail address"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync Gmail Photo
            </motion.button>

            {avatarUrl && (
              <motion.button
                whileTap={buttonTap}
                onClick={handleRemovePhoto}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg border border-rose-500/30 transition-colors cursor-pointer"
              >
                Remove
              </motion.button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {statusMessage && (
            <motion.div
              variants={listItemVariant}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`mt-5 p-3 rounded-lg text-xs font-medium border flex items-center justify-between ${
                statusMessage.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-[var(--brand-subtle)] border-[var(--brand-border)] text-[var(--brand-accent)]'
              }`}
            >
              <span>{statusMessage.text}</span>
              <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">✕</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Form Details */}
      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Personnel Details" subtitle="Manage identification, credentials and facility assignment">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Operational Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)] transition-colors"
                >
                  <option value="OPERATOR">OPERATOR - Line Monitoring</option>
                  <option value="ENGINEER">ENGINEER - Diagnostics & Calibration</option>
                  <option value="ADMIN">ADMIN - Plant Controller</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Phone / Emergency Contact</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Current Shift</label>
                <input
                  type="text"
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)] transition-colors"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Machinery Scope Responsibility</label>
              <input
                type="text"
                name="machineryScope"
                value={formData.machineryScope}
                onChange={handleChange}
                placeholder="e.g. M-01 (CNC Milling), M-02 (Robotic Arm)"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)] transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">Defines telemetry authorization and direct alert notification routing.</p>
            </div>

            <div className="mt-6 flex justify-end">
              <motion.button
                whileTap={buttonTap}
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white font-bold rounded-lg transition-colors shadow-lg shadow-[var(--brand-glow)] disabled:opacity-50 text-sm flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? 'Updating Profile...' : 'Save Profile Changes'}
              </motion.button>
            </div>
          </Card>

          <Card title="Security & Credentials" subtitle="Access token keys and authentication methods">
            <div className="space-y-4 text-xs text-slate-400">
              <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <div>
                  <div className="font-semibold text-slate-200">OAuth Authentication</div>
                  <div>Connected via Google Workspace SSO</div>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <div>
                  <div className="font-semibold text-slate-200">JWT Token Expiration</div>
                  <div>Issued for active session (8 Hours remaining)</div>
                </div>
                <span className="px-2 py-1 rounded bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)] font-mono">VALID</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Info Column */}
        <div className="space-y-6">
          <Card title="Access Privileges" badge="RBAC Policy">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-xs">
                <span className="text-slate-300">Live Telemetry Ingestion</span>
                <span className="text-emerald-400 font-bold">GRANTED</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-xs">
                <span className="text-slate-300">Defect Camera Feed</span>
                <span className="text-emerald-400 font-bold">GRANTED</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-xs">
                <span className="text-slate-300">Predictive Work Order Dispatch</span>
                <span className="text-emerald-400 font-bold">GRANTED</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-xs">
                <span className="text-slate-300">Audit Log Purge / Export</span>
                <span className="text-[var(--brand-accent)] font-bold">ADMIN ONLY</span>
              </div>
            </div>
          </Card>

          <Card title="Station Quick Stats" variant="accent">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Shift Completed</span>
                  <span className="text-[var(--brand-accent)] font-mono font-bold">65%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-[var(--brand-accent)] rounded-full"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-3 text-center">
                <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                  <div className="text-xl font-bold font-mono text-[var(--brand-accent)]">14</div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider mt-0.5">Alerts Acked</div>
                </div>
                <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                  <div className="text-xl font-bold font-mono text-emerald-400">99.8%</div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider mt-0.5">Line Uptime</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
