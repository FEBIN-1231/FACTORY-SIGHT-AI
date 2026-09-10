import axios from 'axios';
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
} from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
});

// Helper to format auth user object
export const formatUser = (firebaseUser, role = 'OPERATOR') => {
  let photo = firebaseUser.photoURL || firebaseUser.providerData?.find((p) => p && p.photoURL)?.photoURL || null;
  if (photo && photo.includes('=s')) photo = photo.replace(/=s\d+(-c)?/i, '=s384-c');
  if (!photo && firebaseUser.email) {
    photo = `https://unavatar.io/google/${encodeURIComponent(firebaseUser.email)}?fallback=https://unavatar.io/${encodeURIComponent(firebaseUser.email)}`;
  }
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Factory Operator',
    email: firebaseUser.email,
    role: role.toUpperCase(),
    title:
      role.toUpperCase() === 'ADMIN'
        ? 'Plant Director'
        : role.toUpperCase() === 'ENGINEER'
        ? 'Lead Maintenance Engineer'
        : 'Senior Machine Operator',
    organization: 'Apex Industrial Dynamics (Plant 2)',
    radioChannel: 'CH-04 (Line 2 Operations)',
    avatar: photo,
    assignedMachines: ['M-01', 'M-03'],
  };
};

/* ---------------- REGISTERED ACCOUNTS STORE (NO PRE-SEEDED USERS) ---------------- */
export const getRegisteredAccounts = () => {
  try {
    const saved = localStorage.getItem('fs_accounts');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const hasRegisteredAccounts = () => {
  return getRegisteredAccounts().length > 0;
};

export const isFirstUserRegistration = () => {
  return getRegisteredAccounts().length === 0;
};

/* ---------------- AUTHENTICATION ---------------- */
export const login = async (email, password) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const accounts = getRegisteredAccounts();

  const matched = accounts.find(
    (acc) => acc.email.toLowerCase() === normalizedEmail && acc.password === password
  );

  if (!matched) {
    throw new Error('Invalid email or password. Please verify your credentials or register a new account.');
  }

  const { password: _, ...safeUser } = matched;
  const token = `fs-token-${matched.id}-${Date.now()}`;
  localStorage.setItem('fs_token', token);
  localStorage.setItem('fs_user', JSON.stringify(safeUser));

  return { token, user: safeUser };
};

export const loginWithGoogle = async (roleOverride = 'OPERATOR', simulatedProfile = null) => {
  let googleUser = null;
  let token = null;

  try {
    const cred = await signInWithPopup(auth, googleProvider);
    token = await cred.user.getIdToken();
    googleUser = {
      uid: cred.user.uid,
      displayName: cred.user.displayName,
      email: cred.user.email,
      photoURL: cred.user.photoURL,
    };
  } catch (err) {
    // If Firebase popup fails (e.g. demo mode / offline / unconfigured), use mock profile for smooth testing
    const mockEmail = simulatedProfile?.email || 'alex.morgan.google@factorysight.ai';
    const mockName = simulatedProfile?.name || 'Alex Morgan';
    googleUser = {
      uid: `google-${Date.now()}`,
      displayName: mockName,
      email: mockEmail,
      photoURL: null,
    };
    token = `fs-google-token-${Date.now()}`;
  }

  const accounts = getRegisteredAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === googleUser.email.toLowerCase());

  let user;
  let isNew = false;
  if (existing) {
    const { password: _, ...safe } = existing;
    user = safe;
  } else {
    isNew = true;
    // If first ever account in system, designate as ADMIN; otherwise use chosen role
    const isFirst = accounts.length === 0;
    const assignedRole = isFirst ? 'ADMIN' : (roleOverride?.toUpperCase() === 'ENGINEER' ? 'ENGINEER' : 'OPERATOR');

    const userId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
    const title =
      assignedRole === 'ADMIN'
        ? 'Plant Director'
        : assignedRole === 'ENGINEER'
        ? 'Lead Maintenance Engineer'
        : 'Senior Machine Operator';

    user = {
      id: userId,
      name: googleUser.displayName || googleUser.email.split('@')[0],
      email: googleUser.email,
      role: assignedRole,
      title,
      organization: 'Factory Sight AI Facility',
      radioChannel: assignedRole === 'ADMIN' ? 'CH-01 (Command)' : 'CH-04 (Line Operations)',
      avatar: googleUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(googleUser.email)}`,
      assignedMachines: assignedRole === 'ADMIN' ? ['ALL'] : ['M-01', 'M-02'],
      created: new Date().toISOString(),
    };

    const newAccount = {
      ...user,
      password: 'google-oauth-linked',
    };
    localStorage.setItem('fs_accounts', JSON.stringify([...accounts, newAccount]));
  }

  localStorage.setItem('fs_token', token);
  localStorage.setItem('fs_user', JSON.stringify(user));
  window.dispatchEvent(new Event('fs_auth_change'));
  return { token, user, isNewAccount: isNew };
};

export const register = async (emailOrObj, password, role = 'OPERATOR', name = '', org = '') => {
  let email = emailOrObj;
  let pass = password;
  let r = role;
  let n = name;
  let o = org;

  if (typeof emailOrObj === 'object' && emailOrObj !== null) {
    email = emailOrObj.email;
    pass = emailOrObj.password;
    r = emailOrObj.role || 'OPERATOR';
    n = emailOrObj.name || '';
    o = emailOrObj.organization || '';
  }

  const normalizedEmail = (email || '').trim().toLowerCase();
  const accounts = getRegisteredAccounts();

  if (accounts.some((a) => a.email.toLowerCase() === normalizedEmail)) {
    throw new Error('An account with this email address already exists. Please sign in instead.');
  }

  // Option 2(a) Bootstrap-Admin Logic:
  // The very first account ever created is automatically designated ADMIN.
  // Subsequent accounts can only register as OPERATOR or ENGINEER.
  const isFirstAccount = accounts.length === 0;
  const assignedRole = isFirstAccount ? 'ADMIN' : (r.toUpperCase() === 'ENGINEER' ? 'ENGINEER' : 'OPERATOR');

  const userId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
  const title =
    assignedRole === 'ADMIN'
      ? 'Plant Director'
      : assignedRole === 'ENGINEER'
      ? 'Lead Maintenance Engineer'
      : 'Senior Machine Operator';

  const newAccount = {
    id: userId,
    name: n || email.split('@')[0],
    email: email.trim(),
    password: pass,
    role: assignedRole,
    title,
    organization: o || 'Factory Sight AI Facility',
    radioChannel: assignedRole === 'ADMIN' ? 'CH-01 (Command)' : 'CH-04 (Line Operations)',
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(normalizedEmail)}`,
    assignedMachines: assignedRole === 'ADMIN' ? ['ALL'] : ['M-01', 'M-02'],
    created: new Date().toISOString(),
  };

  const updatedAccounts = [...accounts, newAccount];
  localStorage.setItem('fs_accounts', JSON.stringify(updatedAccounts));

  const { password: _, ...safeUser } = newAccount;
  const token = `fs-token-${userId}-${Date.now()}`;
  localStorage.setItem('fs_token', token);
  localStorage.setItem('fs_user', JSON.stringify(safeUser));

  return { token, user: safeUser };
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (e) {}
  localStorage.removeItem('fs_token');
  localStorage.removeItem('fs_user');
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const getCurrentUser = () => {
  try {
    const saved = localStorage.getItem('fs_user');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

export const getStoredUser = getCurrentUser;

/* ---------------- RBAC USER QUERIES ---------------- */
export const getUser = async (userId) => {
  const current = getCurrentUser();
  if (!current) {
    throw new Error('Authentication required.');
  }

  // Operators and Engineers cannot view other users' detailed accounts
  if (current.id !== userId && current.role !== 'ADMIN') {
    throw new Error('Access denied: You do not have permission to view other user profile records.');
  }

  const accounts = getRegisteredAccounts();
  const found = accounts.find((a) => a.id === userId);
  if (!found) return null;

  const { password: _, ...safe } = found;
  return safe;
};

export const getUsersList = async () => {
  const current = getCurrentUser();
  if (!current || current.role !== 'ADMIN') {
    throw new Error('Access denied: Administrator permissions required to view the user roster.');
  }

  const accounts = getRegisteredAccounts();
  return accounts.map(({ password: _, ...safe }) => ({
    ...safe,
    status: safe.status || 'ACTIVE',
    lastActive: safe.lastActive || 'Just now',
  }));
};

export const adminUpdateUserRole = async (userId, newRole) => {
  const current = getCurrentUser();
  if (!current || current.role !== 'ADMIN') {
    throw new Error('Access denied: Admin privileges required.');
  }
  const accounts = getRegisteredAccounts();
  const updated = accounts.map((acc) => (acc.id === userId ? { ...acc, role: newRole } : acc));
  localStorage.setItem('fs_accounts', JSON.stringify(updated));
  return updated;
};

export const adminToggleUserStatus = async (userId) => {
  const current = getCurrentUser();
  if (!current || current.role !== 'ADMIN') {
    throw new Error('Access denied: Admin privileges required.');
  }
  const accounts = getRegisteredAccounts();
  const updated = accounts.map((acc) => {
    if (acc.id === userId) {
      const currentStatus = acc.status || 'ACTIVE';
      return { ...acc, status: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' };
    }
    return acc;
  });
  localStorage.setItem('fs_accounts', JSON.stringify(updated));
  return updated;
};

export const adminAddUser = async ({ name, email, role = 'OPERATOR' }) => {
  const current = getCurrentUser();
  if (!current || current.role !== 'ADMIN') {
    throw new Error('Access denied: Admin privileges required.');
  }
  const normalizedEmail = (email || '').trim().toLowerCase();
  const accounts = getRegisteredAccounts();
  if (accounts.some((a) => a.email.toLowerCase() === normalizedEmail)) {
    throw new Error('A user with this email already exists.');
  }
  const userId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
  const title =
    role === 'ADMIN'
      ? 'Plant Director'
      : role === 'ENGINEER'
      ? 'Lead Maintenance Engineer'
      : 'Senior Machine Operator';

  const newAccount = {
    id: userId,
    name: name.trim() || email.split('@')[0],
    email: email.trim(),
    password: 'Password123!',
    role: role.toUpperCase(),
    title,
    organization: current.organization || 'Factory Sight AI Facility',
    radioChannel: role === 'ADMIN' ? 'CH-01 (Command)' : 'CH-04 (Line Operations)',
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(normalizedEmail)}`,
    assignedMachines: role === 'ADMIN' ? ['ALL'] : ['M-01', 'M-02'],
    status: 'ACTIVE',
    lastActive: 'Never',
    created: new Date().toISOString(),
  };

  const updated = [...accounts, newAccount];
  localStorage.setItem('fs_accounts', JSON.stringify(updated));
  const { password: _, ...safe } = newAccount;
  return safe;
};

export const updateUserProfile = (updatedFields) => {
  const user = getCurrentUser();
  if (!user) return null;
  const updated = { ...user, ...updatedFields };
  localStorage.setItem('fs_user', JSON.stringify(updated));

  // Sync back to accounts store
  const accounts = getRegisteredAccounts();
  const updatedAccounts = accounts.map((acc) => (acc.id === user.id ? { ...acc, ...updatedFields } : acc));
  localStorage.setItem('fs_accounts', JSON.stringify(updatedAccounts));

  return updated;
};

export const updateProfile = updateUserProfile;

export const checkSystemHealth = async () => {
  try {
    const res = await api.get('/health');
    return res.data;
  } catch (e) {
    return { status: 'healthy (simulated)', model_loaded: true, timestamp: new Date().toISOString() };
  }
};

/* ---------------- DASHBOARD DATA ---------------- */
export const getDashboardSummary = async () => {
  try {
    const res = await api.get('/health');
    return {
      oee: 89.6,
      oeeTrend: '+2.4%',
      activeMachines: 24,
      totalMachines: 24,
      defectRate: 1.15,
      defectTrend: '-0.3%',
      criticalAlerts: 1,
      totalAlerts: 3,
      throughput: '1,420 u/h',
      avgHealthScore: 94.2,
      backendStatus: res.data.status || 'healthy',
      modelLoaded: res.data.model_loaded,
    };
  } catch (e) {
    return {
      oee: 89.6,
      oeeTrend: '+2.4%',
      activeMachines: 24,
      totalMachines: 24,
      defectRate: 1.15,
      defectTrend: '-0.3%',
      criticalAlerts: 1,
      totalAlerts: 3,
      throughput: '1,420 u/h',
      avgHealthScore: 94.2,
      backendStatus: 'demo_online',
      modelLoaded: true,
    };
  }
};

export const getMachineGridData = async () => {
  return [
    {
      id: 'M-01',
      name: 'Milling Station Alpha',
      line: 'Line 1 (Machining)',
      status: 'OPTIMAL',
      health: 96,
      vibration: '2.1 mm/s',
      temp: '68.4 °C',
      pressure: '102 bar',
      speed: '1,800 RPM',
      utilization: '92%',
      defectCount: 0,
    },
    {
      id: 'M-02',
      name: 'Turning Cell Beta',
      line: 'Line 1 (Machining)',
      status: 'OPTIMAL',
      health: 91,
      vibration: '2.8 mm/s',
      temp: '72.1 °C',
      pressure: '98 bar',
      speed: '1,750 RPM',
      utilization: '88%',
      defectCount: 1,
    },
    {
      id: 'M-03',
      name: 'Laser Scribing Unit',
      line: 'Line 2 (Precision Cutting)',
      status: 'WARNING',
      health: 78,
      vibration: '4.2 mm/s',
      temp: '82.6 °C',
      pressure: '115 bar',
      speed: '2,100 RPM',
      utilization: '95%',
      defectCount: 2,
    },
    {
      id: 'M-04',
      name: 'Hydraulic Press Gamma',
      line: 'Line 3 (Assembly)',
      status: 'OPTIMAL',
      health: 98,
      vibration: '1.4 mm/s',
      temp: '58.0 °C',
      pressure: '108 bar',
      speed: '1,200 RPM',
      utilization: '84%',
      defectCount: 0,
    },
  ];
};

/* ---------------- TELEMETRY DATA ---------------- */
export const getTelemetry = async (machineId = 'M-01', points = 20) => {
  try {
    const res = await api.get(`/api/telemetry/${machineId}`);
    return res.data;
  } catch (e) {
    const now = Date.now();
    const history = Array.from({ length: points }, (_, i) => {
      const time = new Date(now - (points - 1 - i) * 30000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const baseVib = machineId === 'M-03' ? 3.8 : 2.1;
      const baseTemp = machineId === 'M-03' ? 80 : 65;

      return {
        time,
        vibration: Number((baseVib + Math.sin(i * 0.7) * 0.6 + Math.random() * 0.3).toFixed(2)),
        temperature: Number((baseTemp + Math.cos(i * 0.4) * 4 + Math.random() * 1.5).toFixed(1)),
        pressure: Number((100 + Math.sin(i * 0.3) * 5 + Math.random() * 1.2).toFixed(1)),
        rpm: Math.round(1750 + Math.sin(i * 0.6) * 35 + Math.random() * 12),
        acoustic: Number((62 + Math.sin(i * 0.5) * 3 + Math.random() * 1).toFixed(1)),
        power: Number((14.2 + Math.sin(i * 0.2) * 1.2 + Math.random() * 0.4).toFixed(1)),
      };
    });

    const latest = history[history.length - 1];
    return {
      machineId,
      status: machineId === 'M-03' ? 'WARNING' : 'OPTIMAL',
      metrics: {
        vibration: latest.vibration,
        temperature: latest.temperature,
        pressure: latest.pressure,
        rpm: latest.rpm,
        acoustic: latest.acoustic,
        power: latest.power,
      },
      thresholds: {
        vibrationLimit: 4.5,
        temperatureLimit: 85,
        pressureLimit: 120,
        rpmLimit: 2200,
      },
      history,
    };
  }
};

/* ---------------- PREDICTIVE MAINTENANCE DATA ---------------- */
export const getPredictions = async () => {
  return [
    {
      id: 'PRED-101',
      machine: 'M-01',
      name: 'Milling Station Alpha',
      component: 'Drive Bearing B2',
      riskScore: 14,
      riskLevel: 'Low',
      rulDays: 48,
      rulHours: 1152,
      confidence: '96.2%',
      healthScore: 94,
      status: 'Healthy',
      recommendation: 'Next scheduled lubrication cycle in 14 operating days.',
    },
    {
      id: 'PRED-102',
      machine: 'M-02',
      name: 'Turning Cell Beta',
      component: 'Spindle Motor M1',
      riskScore: 42,
      riskLevel: 'Moderate',
      rulDays: 19,
      rulHours: 456,
      confidence: '89.4%',
      healthScore: 82,
      status: 'Monitor',
      recommendation: 'Check mechanical belt tension and harmonic vibration levels.',
    },
    {
      id: 'PRED-103',
      machine: 'M-03',
      name: 'Laser Scribing Unit',
      component: 'Coolant Pump P4',
      riskScore: 78,
      riskLevel: 'High',
      rulDays: 4,
      rulHours: 96,
      confidence: '94.8%',
      healthScore: 68,
      status: 'Action Required',
      recommendation: 'Replace primary intake seal and flush coolant filter immediately.',
    },
    {
      id: 'PRED-104',
      machine: 'M-04',
      name: 'Hydraulic Press Gamma',
      component: 'Hydraulic Cylinder Rod',
      riskScore: 8,
      riskLevel: 'Low',
      rulDays: 72,
      rulHours: 1728,
      confidence: '97.5%',
      healthScore: 98,
      status: 'Healthy',
      recommendation: 'Optimal operating parameters. No intervention required.',
    },
  ];
};

/* ---------------- DEFECT COMPUTER VISION DATA ---------------- */
export const CV_VIDEO_FEED_URL = `${API_BASE}/video_feed`;

export const detectImageDefects = async (imageBlob, machineId = 'M-03') => {
  try {
    const formData = new FormData();
    formData.append('machine_id', machineId);
    formData.append('file', imageBlob, 'webcam_frame.jpg');

    const res = await api.post('/detect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
    console.error('Failed to run backend detect on image:', err);
    throw err;
  }
};

export const getDetectStatus = async () => {
  try {
    const res = await api.get('/detect_status');
    return res.data;
  } catch (e) {
    return {
      status: 'offline',
      fps: 0,
      camera: 'CAM-01 (Laptop Camera)',
      machine: 'M-03 (Laser Scribing)',
      timestamp: new Date().toISOString(),
      inspection_status: 'NORMAL',
      total_defects: 0,
      detections: [],
    };
  }
};

export const getDefects = async () => {
  try {
    const statusData = await getDetectStatus();
    if (statusData && Array.isArray(statusData.detections)) {
      return statusData.detections;
    }
  } catch (e) {
    console.error('Failed to load live defects:', e);
  }
  return [];
};


/* ---------------- AI INSIGHTS DATA ---------------- */
export const getInsights = async () => {
  return [
    {
      id: 'INS-01',
      title: 'Spindle Thermal Drift on Unit M-03',
      category: 'Predictive Diagnosis',
      confidence: '94.8%',
      impact: 'Prevents estimated 3.5h unplanned stoppage & $14,200 tooling loss.',
      severity: 'High',
      rootCause: 'Coolant intake valve thermal dissipation reduced by 22% due to particulate fouling.',
      recommendation: 'Flush primary coolant manifold during next scheduled tool changeover.',
      metrics: {
        affectedUnit: 'Unit M-03 (Laser Scribing)',
        failureWindow: '< 4 Days',
        costSavings: '$14,200',
      },
    },
    {
      id: 'INS-02',
      title: 'Vibration Harmonic Spike on Unit M-02',
      category: 'Quality Optimization',
      confidence: '89.2%',
      impact: 'Reduces edge burr defect rate across Line 1 by up to 18%.',
      severity: 'Moderate',
      rootCause: 'Sub-harmonic resonance between tool spindle and drive belt at 1,750 RPM.',
      recommendation: 'Adjust spindle feed rate by +3% or tighten timing belt tension to 140 N.',
      metrics: {
        affectedUnit: 'Unit M-02 (Turning Cell)',
        failureWindow: '< 19 Days',
        costSavings: '$4,600/mo',
      },
    },
    {
      id: 'INS-03',
      title: 'Energy Peak Consumption Anomaly',
      category: 'Energy Efficiency',
      confidence: '92.0%',
      impact: 'Lowers total shop floor peak power tariff by 8.4%.',
      severity: 'Low',
      rootCause: 'Simultaneous motor spin-up on Units M-01 and M-04 during shift start.',
      recommendation: 'Stagger automated startup sequence by 45 seconds.',
      metrics: {
        affectedUnit: 'Plant Power Grid (Line 1 & 3)',
        failureWindow: 'Ongoing',
        costSavings: '$2,100/mo',
      },
    },
  ];
};

/* ---------------- DATA LOGS & EXPORT ---------------- */
export const getLogs = async (category = 'operational') => {
  const data = {
    operational: [
      { id: 'LOG-4402', timestamp: '14:35:10', level: 'INFO', machine: 'M-01', message: 'Batch milling cycle #4402 completed. 48 parts approved.' },
      { id: 'LOG-4401', timestamp: '14:22:10', level: 'WARN', machine: 'M-03', message: 'Coolant pump temperature exceeded 82°C limit.' },
      { id: 'LOG-4400', timestamp: '14:15:00', level: 'INFO', machine: 'M-02', message: 'Automated tool magazine indexed slot 04.' },
      { id: 'LOG-4399', timestamp: '13:58:30', level: 'INFO', machine: 'M-04', message: 'Hydraulic pressure stabilized at 108 bar.' },
      { id: 'LOG-4398', timestamp: '13:40:15', level: 'ERROR', machine: 'M-03', message: 'Defect Vision CAM-02 flagged micro-fracture on part #9981.' },
      { id: 'LOG-4397', timestamp: '12:30:00', level: 'INFO', machine: 'M-01', message: 'Operator acknowledged scheduled maintenance checklist.' },
    ],
    telemetry: [
      { id: 'TEL-890', timestamp: '14:38:00', machine: 'M-01', parameter: 'Vibration RMS', value: '2.14 mm/s', status: 'Normal' },
      { id: 'TEL-889', timestamp: '14:37:30', machine: 'M-03', parameter: 'Bearing Temp', value: '82.6 °C', status: 'Elevated' },
      { id: 'TEL-888', timestamp: '14:37:00', machine: 'M-02', parameter: 'Spindle RPM', value: '1,750 RPM', status: 'Normal' },
      { id: 'TEL-887', timestamp: '14:36:30', machine: 'M-04', parameter: 'Pressure', value: '108 bar', status: 'Normal' },
      { id: 'TEL-886', timestamp: '14:36:00', machine: 'M-03', parameter: 'Acoustic RMS', value: '68.2 dB', status: 'Elevated' },
    ],
    inference: [
      { id: 'INF-504', timestamp: '14:35:00', model: 'YOLOv8-SurfaceDefect', inferenceTime: '18ms', result: 'PASS (Zero Defects)', confidence: '98.9%' },
      { id: 'INF-503', timestamp: '14:22:10', model: 'YOLOv8-SurfaceDefect', inferenceTime: '21ms', result: 'DEFECT_FOUND (Micro-Fracture)', confidence: '96.4%' },
      { id: 'INF-502', timestamp: '14:10:00', model: 'LSTM-ThermalRUL', inferenceTime: '42ms', result: 'RUL_UPDATED (4 days on M-03)', confidence: '94.8%' },
      { id: 'INF-501', timestamp: '13:50:45', model: 'YOLOv8-SurfaceDefect', inferenceTime: '17ms', result: 'DEFECT_FOUND (Edge Burrs)', confidence: '88.1%' },
    ],
    audit: [
      { id: 'AUD-202', timestamp: '14:30:15', user: 'febin@gmail.com', action: 'SETTINGS_UPDATE', details: 'Vibration warning threshold set to 4.5 mm/s.' },
      { id: 'AUD-201', timestamp: '14:15:20', user: 'febin@gmail.com', action: 'ALERT_ACK', details: 'Acknowledged alert ALT-01 for Unit M-03.' },
      { id: 'AUD-200', timestamp: '12:00:00', user: 'admin@factory.ai', action: 'USER_ROLE_CHANGE', details: 'Promoted Marcus Vance to Maintenance Engineer.' },
    ],
  };

  return data[category] || data.operational;
};

/* ---------------- ALERTS DATA & RBAC DISPATCH ---------------- */
const DEFAULT_ALERTS = [
  {
    id: 'ALT-01',
    timestamp: '14:22:10',
    machine: 'M-03 (Laser Scribing)',
    severity: 'HIGH',
    message: 'Coolant pump temperature exceeded 82°C (Limit: 85°C). Estimated RUL < 4 days.',
    source: 'Thermal Sensor & LSTM Model',
    type: 'AUTOMATED',
    assignedTo: 'All Operators',
    ack: false,
  },
  {
    id: 'ALT-02',
    timestamp: '13:50:45',
    machine: 'M-01 (Milling Station)',
    severity: 'MODERATE',
    message: 'Edge burr defect detected on part #8820 exceeding 0.35mm contour allowance.',
    source: 'YOLOv8 Vision CAM-01',
    type: 'AUTOMATED',
    assignedTo: 'Quality Inspection Cell',
    ack: false,
  },
  {
    id: 'ALT-03',
    timestamp: '11:15:20',
    machine: 'M-02 (Turning Cell)',
    severity: 'LOW',
    message: 'Spindle harmonic vibration approaching 2.8 mm/s benchmark. Monitor belt tension.',
    source: 'Acoustic / Vibration Sensor',
    type: 'AUTOMATED',
    assignedTo: 'Machinist Shift 1',
    ack: true,
  },
];

export const getAlerts = async () => {
  const saved = localStorage.getItem('fs_alerts_v1');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  localStorage.setItem('fs_alerts_v1', JSON.stringify(DEFAULT_ALERTS));
  return DEFAULT_ALERTS;
};

export const createAlert = async (alertData, currentUser) => {
  if (currentUser?.role?.toUpperCase() !== 'ADMIN') {
    throw new Error('Access Denied: Only Administrator accounts can create, configure, or broadcast alerts.');
  }

  const current = await getAlerts();
  const newAlert = {
    id: `ALT-${Math.floor(10 + Math.random() * 90)}`,
    timestamp: new Date().toLocaleTimeString('en-GB'),
    machine: alertData.machine || 'M-01 (Milling Station Alpha)',
    severity: alertData.severity || 'HIGH',
    message: alertData.message || 'Safety threshold notification issued by Plant Administration.',
    source: alertData.source || 'Admin Broadcast Directive',
    type: 'ADMIN_DISPATCH',
    assignedTo: alertData.assignedTo || 'All Operators & Engineering Teams',
    createdBy: currentUser?.name || 'Administrator',
    ack: false,
  };

  const updated = [newAlert, ...current];
  localStorage.setItem('fs_alerts_v1', JSON.stringify(updated));
  return newAlert;
};

export const acknowledgeAlert = async (alertId) => {
  const current = await getAlerts();
  const updated = current.map((a) => (a.id === alertId ? { ...a, ack: true } : a));
  localStorage.setItem('fs_alerts_v1', JSON.stringify(updated));
  return updated.find((a) => a.id === alertId);
};

export const deleteAlert = async (alertId, currentUser) => {
  if (currentUser?.role?.toUpperCase() !== 'ADMIN') {
    throw new Error('Access Denied: Only Administrator accounts can delete alerts.');
  }
  const current = await getAlerts();
  const updated = current.filter((a) => a.id !== alertId);
  localStorage.setItem('fs_alerts_v1', JSON.stringify(updated));
  return { success: true };
};

/* ---------------- SHOP FLOOR WORKERS (ADMIN ONLY) ---------------- */
const DEFAULT_WORKERS = [
  {
    id: 'WKR-101',
    name: 'David Alvarez',
    title: 'Senior CNC Machinist',
    role: 'Machinist',
    assignedMachine: 'M-01 (Milling Station)',
    status: 'ACTIVE',
    shift: 'Shift 1 (06:00 - 14:00)',
    contact: '+1 (555) 234-8901',
    radio: 'CH-02',
    certifications: 'ISO 9001, CNC 5-Axis',
  },
  {
    id: 'WKR-102',
    name: 'Sarah Jenkins',
    title: 'Precision Tooling Specialist',
    role: 'Tooling Specialist',
    assignedMachine: 'M-02 (Turning Cell)',
    status: 'ACTIVE',
    shift: 'Shift 1 (06:00 - 14:00)',
    contact: '+1 (555) 345-6789',
    radio: 'CH-02',
    certifications: 'Six Sigma Green Belt',
  },
  {
    id: 'WKR-103',
    name: 'Mateo Rossi',
    title: 'Thermal & Hydraulic Lead',
    role: 'Maintenance Tech',
    assignedMachine: 'M-03 (Coolant Loop B)',
    status: 'ON_LEAVE',
    shift: 'Shift 2 (14:00 - 22:00)',
    contact: '+1 (555) 456-7890',
    radio: 'CH-04',
    certifications: 'Hydraulics Level II',
  },
  {
    id: 'WKR-104',
    name: 'Kavita Patel',
    title: 'Vision QA Inspector',
    role: 'QA Inspector',
    assignedMachine: 'M-04 (Conveyor Optical Line)',
    status: 'ACTIVE',
    shift: 'Shift 1 (06:00 - 14:00)',
    contact: '+1 (555) 567-8901',
    radio: 'CH-01',
    certifications: 'Optical Metrology Certified',
  },
  {
    id: 'WKR-105',
    name: "James O'Connor",
    title: 'Apprentice Operator',
    role: 'Operator',
    assignedMachine: 'M-01 (Milling Station)',
    status: 'INACTIVE',
    shift: 'Shift 3 (22:00 - 06:00)',
    contact: '+1 (555) 678-9012',
    radio: 'CH-03',
    certifications: 'Safety OSHA 30',
  },
];

export const getWorkers = async () => {
  const saved = localStorage.getItem('fs_workers');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  localStorage.setItem('fs_workers', JSON.stringify(DEFAULT_WORKERS));
  return DEFAULT_WORKERS;
};

export const addWorker = async (workerData) => {
  const current = await getWorkers();
  const newWorker = {
    id: `WKR-${Math.floor(100 + Math.random() * 900)}`,
    status: 'ACTIVE',
    shift: 'Shift 1 (06:00 - 14:00)',
    radio: 'CH-01',
    ...workerData,
  };
  const updated = [newWorker, ...current];
  localStorage.setItem('fs_workers', JSON.stringify(updated));
  return newWorker;
};

export const updateWorker = async (id, updates) => {
  const current = await getWorkers();
  const updated = current.map((w) => (w.id === id ? { ...w, ...updates } : w));
  localStorage.setItem('fs_workers', JSON.stringify(updated));
  return updated.find((w) => w.id === id);
};

export const deleteWorker = async (id) => {
  const current = await getWorkers();
  const updated = current.filter((w) => w.id !== id);
  localStorage.setItem('fs_workers', JSON.stringify(updated));
  return { success: true };
};

export default {
  login,
  loginWithGoogle,
  register,
  logout,
  resetPassword,
  getCurrentUser,
  updateUserProfile,
  getDashboardSummary,
  getMachineGridData,
  getTelemetry,
  getPredictions,
  getDefects,
  getInsights,
  getLogs,
  getAlerts,
  createAlert,
  acknowledgeAlert,
  deleteAlert,
  getWorkers,
  addWorker,
  updateWorker,
  deleteWorker,
};
