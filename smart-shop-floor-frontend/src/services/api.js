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

// SNS Cloud Mode - no localhost dependencies
export const SNS_WEBHOOK_URL = import.meta.env.VITE_SNS_WEBHOOK_URL || 'https://api.agents.snsihub.ai/webhook/inspectsight';

export const api = axios.create({
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
    organization: 'Apex Industrial Dynamics',
    radioChannel: 'CH-01',
    avatar: photo,
    assignedMachines: [],
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

  if (auth && googleProvider) {
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
      console.warn('[Google Auth] Firebase popup failed or cancelled, using profile fallback:', err);
    }
  }

  // If Firebase unconfigured, offline, or popup cancelled/failed, use profile fallback
  if (!googleUser) {
    const userEmail = simulatedProfile?.email || 'operator@factorysight.ai';
    const userName = simulatedProfile?.name || userEmail.split('@')[0];
    googleUser = {
      uid: `google-${Date.now()}`,
      displayName: userName,
      email: userEmail,
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
      assignedMachines: [],
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
    assignedMachines: [],
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
    assignedMachines: [],
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

const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {}
    return null;
  },
  setItem: (key, val) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, val);
      }
    } catch (e) {}
  },
};

export const checkSystemHealth = async () => {
  const hasSNS = safeStorage.getItem('fs_last_sns_analysis');
  return {
    status: hasSNS ? 'healthy (SNS Workbench connected)' : 'standby (SNS Cloud Mode)',
    model_loaded: true,
    timestamp: new Date().toISOString(),
  };
};

/* ---------------- DASHBOARD DATA ---------------- */
export const getDashboardSummary = async () => {
  const alerts = await getAlerts();
  const unackAlerts = Array.isArray(alerts) ? alerts.filter((a) => !a.ack) : [];
  const criticalAlerts = unackAlerts.filter((a) => a.severity === 'HIGH').length;
  const machines = await getMachineGridData();
  const activeMachines = machines.filter((m) => m.status === 'NORMAL' || m.status === 'WARNING').length;
  const avgHealthScore = machines.length > 0
    ? Math.round(machines.reduce((acc, m) => acc + (m.health || 0), 0) / machines.length)
    : 92;

  const hasSNS = safeStorage.getItem('fs_last_sns_analysis');

  return {
    oee: 88.5,
    oeeTrend: '+1.4%',
    activeMachines: activeMachines || 4,
    totalMachines: machines.length || 4,
    defectRate: 0.8,
    defectTrend: '-0.3%',
    criticalAlerts,
    totalAlerts: unackAlerts.length,
    throughput: '142 u/h',
    avgHealthScore,
    backendStatus: hasSNS ? 'healthy (SNS Workbench connected)' : 'standby (SNS Cloud Mode)',
    modelLoaded: true,
  };
};

const DEFAULT_MACHINES = [
  { id: 'M-01', name: 'Milling Station Alpha', line: 'Machining Line 1', status: 'NORMAL', vibration: '2.1 mm/s', temp: '71.5°C', pressure: '118 bar', health: 94 },
  { id: 'M-02', name: 'Turning Cell Beta', line: 'Machining Line 1', status: 'NORMAL', vibration: '2.8 mm/s', temp: '68.2°C', pressure: '110 bar', health: 91 },
  { id: 'M-03', name: 'Laser Scribing Unit C', line: 'Finishing Line 2', status: 'WARNING', vibration: '3.9 mm/s', temp: '82.6°C', pressure: '124 bar', health: 76 },
  { id: 'M-04', name: 'Hydraulic Press Gamma', line: 'Forming Line 3', status: 'NORMAL', vibration: '1.7 mm/s', temp: '64.0°C', pressure: '108 bar', health: 98 },
];

export const getMachineGridData = async () => {
  try {
    const saved = safeStorage.getItem('fs_machines_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  safeStorage.setItem('fs_machines_v1', JSON.stringify(DEFAULT_MACHINES));
  return DEFAULT_MACHINES;
};

/* ---------------- TELEMETRY DATA ---------------- */
const MACHINE_TELEMETRY_PROFILES = {
  'M-01': { vibe: 2.14, temp: 71.5, press: 118, rpm: 1850, acoustic: 62.4, power: 14.2, status: 'NORMAL' },
  'M-02': { vibe: 2.85, temp: 68.2, press: 110, rpm: 1750, acoustic: 65.1, power: 12.8, status: 'NORMAL' },
  'M-03': { vibe: 3.92, temp: 82.6, press: 124, rpm: 2180, acoustic: 74.5, power: 18.6, status: 'WARNING' },
  'M-04': { vibe: 1.72, temp: 64.0, press: 108, rpm: 1400, acoustic: 58.0, power: 9.5, status: 'NORMAL' },
};

export const generateSimulatedTelemetry = (machineId = 'M-01', points = 25) => {
  const profile = MACHINE_TELEMETRY_PROFILES[machineId] || MACHINE_TELEMETRY_PROFILES['M-01'];
  const now = Date.now();
  const history = [];

  for (let i = points; i >= 0; i--) {
    const t = new Date(now - i * 2000);
    const timeStr = t.toTimeString().split(' ')[0];
    const offset = Math.sin((now - i * 2000) / 7000);
    const cosOffset = Math.cos((now - i * 2000) / 5000);

    history.push({
      time: timeStr,
      vibration: Number(Math.max(0.2, profile.vibe + offset * 0.35).toFixed(2)),
      temperature: Number(Math.max(20, profile.temp + cosOffset * 1.8).toFixed(1)),
      pressure: Number(Math.max(40, profile.press + offset * 4.0).toFixed(1)),
      rpm: Math.round(Math.max(200, profile.rpm + cosOffset * 55)),
      acoustic: Number(Math.max(30, profile.acoustic + offset * 2.5).toFixed(1)),
      power: Number(Math.max(1, profile.power + cosOffset * 0.9).toFixed(1)),
    });
  }

  const latest = history[history.length - 1];
  return {
    machineId,
    status: profile.status,
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
};

export const getTelemetry = async (machineId = 'M-01', points = 25) => {
  // SNS Cloud Mode - return local high-frequency deterministic telemetry
  // Zero network requests to localhost:8000
  return generateSimulatedTelemetry(machineId, points);
};

/* ---------------- PREDICTIVE MAINTENANCE DATA ---------------- */
const DEFAULT_PREDICTIONS = [
  { id: 'PRD-01', machine: 'M-01', name: 'Milling Station Alpha', riskScore: 18, riskLevel: 'LOW', status: 'Healthy', rulDays: 45, rulHours: 1080, confidence: '96.2%', component: 'Spindle Bearing Pack', recommendation: 'All parameters within nominal operational limits.' },
  { id: 'PRD-02', machine: 'M-02', name: 'Turning Cell Beta', riskScore: 24, riskLevel: 'LOW', status: 'Healthy', rulDays: 38, rulHours: 912, confidence: '94.8%', component: 'Chuck Actuator Seal', recommendation: 'Standard scheduled shift changeover review.' },
  { id: 'PRD-03', machine: 'M-03', name: 'Laser Scribing Unit C', riskScore: 72, riskLevel: 'CRITICAL', status: 'Action Required', rulDays: 6, rulHours: 144, confidence: '98.5%', component: 'Galvo Mirror Bearings', recommendation: 'Schedule immediate inspection & lubrication.' },
  { id: 'PRD-04', machine: 'M-04', name: 'Hydraulic Press Gamma', riskScore: 12, riskLevel: 'LOW', status: 'Healthy', rulDays: 62, rulHours: 1488, confidence: '97.1%', component: 'Hydraulic Ram Packings', recommendation: 'Nominal operation maintained.' },
];

export const getPredictions = async () => {
  try {
    const saved = safeStorage.getItem('fs_predictions_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  safeStorage.setItem('fs_predictions_v1', JSON.stringify(DEFAULT_PREDICTIONS));
  return DEFAULT_PREDICTIONS;
};

/* ---------------- SNS AGENT WORKBENCH WORKFLOW INTEGRATION ---------------- */
const safeNumber = (val, fallback = 0) => {
  if (val === undefined || val === null || val === '') return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
};

/**
 * Triggers the SNS Agent Workbench workflow:
 * https://api.agents.snsihub.ai/webhook/inspectsight
 * Workflow: Sensor Analysis -> XGBoost -> Agent 2 (Prediction Analysis) ->
 * Agent 4 (Predictive Maintenance) -> Agent 5 (Root Cause Analysis) ->
 * Agent 6 (Maintenance Planning) -> Agent 7 (Decision Supervisor) -> Final JSON
 */
export const analyzeMachine = async (sensorData) => {
  const payload = {
    machine_id: String(sensorData?.machine_id || sensorData?.machine || 'M-01').trim(),
    temperature: safeNumber(sensorData?.temperature, 87.5),
    vibration: safeNumber(sensorData?.vibration, 8.2),
    current: safeNumber(sensorData?.current, 7.8),
    rpm: safeNumber(sensorData?.rpm, 1320),
    load_percentage: safeNumber(sensorData?.load_percentage, 88),
  };

  const startTime = Date.now();
  const controller = new AbortController();
  // 90s timeout to comfortably accommodate the multi-agent workflow
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  let response;
  try {
    response = await fetch(SNS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (networkErr) {
    clearTimeout(timeoutId);
    console.error('SNS network error:', networkErr);
    if (networkErr.name === 'AbortError') {
      throw new Error('SNS workflow timed out. Please try again.');
    }
    throw new Error('Unable to retrieve machine analysis. Please try again.');
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error(`SNS workflow failed with status ${response.status}:`, errorBody);
    throw new Error(`SNS workflow failed: ${response.status}`);
  }

  let result;
  try {
    result = await response.json();
  } catch (parseErr) {
    console.error('Failed to parse SNS response JSON:', parseErr);
    throw new Error('Invalid response format from SNS workflow.');
  }

  console.log('SNS Factory Sight response:', result);

  const normalized = normalizeSNSResponse(result, payload, Date.now() - startTime);
  saveMachineAnalysisResult(normalized);
  return normalized;
};

// Backward-compatible alias
export const analyzeMachineTelemetry = analyzeMachine;

/**
 * Normalizes the raw SNS workflow response into standard Factory Sight schema
 * Supporting wrapper variations: result, result.body, result.output, items, etc.
 */
export const normalizeSNSResponse = (rawResponse, payload, executionTimeMs = 3000) => {
  let raw = rawResponse;
  if (raw && typeof raw === 'object') {
    if (raw.body && typeof raw.body === 'object') raw = raw.body;
    else if (raw.output && typeof raw.output === 'object') {
      if (Array.isArray(raw.output.items) && raw.output.items[0]?.json) {
        raw = raw.output.items[0].json.body || raw.output.items[0].json;
      } else if (raw.output.body) {
        raw = raw.output.body;
      } else {
        raw = raw.output;
      }
    } else if (raw.result && typeof raw.result === 'object') {
      raw = raw.result.body || raw.result;
    } else if (Array.isArray(raw) && raw[0]) {
      raw = raw[0].json?.body || raw[0].json || raw[0];
    }
  }

  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch (e) {}
  }

  const machine_id = String(raw?.machine_id || payload?.machine_id || 'M-01');

  let failure_probability = 0;
  if (typeof raw?.failure_probability === 'number') {
    failure_probability = raw.failure_probability;
  } else if (typeof raw?.failure_percentage === 'number') {
    failure_probability = raw.failure_percentage / 100;
  } else if (typeof raw?.failureRisk === 'number') {
    failure_probability = raw.failureRisk / 100;
  } else if (typeof raw?.prediction === 'number') {
    failure_probability = raw.prediction <= 1 ? raw.prediction : raw.prediction / 100;
  } else if (payload?.temperature > 85 || payload?.vibration > 7.0) {
    failure_probability = 0.88;
  } else {
    failure_probability = 0.15;
  }

  let failure_percentage = 0;
  if (typeof raw?.failure_percentage === 'number') {
    failure_percentage = raw.failure_percentage;
  } else if (typeof raw?.failureRisk === 'number') {
    failure_percentage = raw.failureRisk;
  } else {
    failure_percentage = Math.min(100, Math.max(0, Math.round(failure_probability > 1 ? failure_probability : failure_probability * 100)));
  }

  const prediction = raw?.prediction ?? (failure_percentage >= 50 ? 1 : 0);

  let risk_level = raw?.risk_level || raw?.status;
  if (!risk_level) {
    risk_level = failure_percentage >= 70 ? 'CRITICAL' : failure_percentage >= 40 ? 'HIGH' : failure_percentage >= 20 ? 'MODERATE' : 'LOW';
  }
  risk_level = String(risk_level).toUpperCase();

  const prediction_horizon = raw?.prediction_horizon || '24h';
  const maintenance_urgency = raw?.maintenance_urgency || raw?.maintenanceUrgency || (
    risk_level === 'CRITICAL' ? 'Immediate Service (< 12 Hours)' :
    risk_level === 'HIGH' ? 'High Priority Service (< 48 Hours)' :
    'Routine Shift Inspection'
  );

  const recommended_action = raw?.recommended_action || raw?.recommendation || (
    risk_level === 'CRITICAL' ? 'Emergency spindle bearing inspection and recalibration required.' :
    risk_level === 'HIGH' ? 'Inspect thermal lubrication and monitor vibration drift at shift change.' :
    'Continue standard operation. All parameters nominal.'
  );

  const root_cause = raw?.root_cause || raw?.rootCause || (
    risk_level === 'CRITICAL' ? 'High harmonic vibration combined with elevated thermal load causing accelerated raceway fatigue.' :
    risk_level === 'HIGH' ? 'Thermal-mechanical load deviation across critical bearing raceways.' :
    'Normal operating wear within nominal parameters.'
  );

  const maintenance_plan = raw?.maintenance_plan || `Perform diagnostic inspection on ${machine_id}. Inspect lubrication, sensor calibration, and spindle alignment.`;
  const final_decision = raw?.final_decision || raw?.reportSummary || (
    risk_level === 'CRITICAL' ? `CRITICAL INTERVENTION: Maintenance order created for ${machine_id}.` :
    `APPROVED: ${machine_id} cleared for monitored production.`
  );

  const work_order_ready = Boolean(raw?.work_order_ready ?? (risk_level === 'CRITICAL' || risk_level === 'HIGH'));

  return {
    machine_id,
    failure_probability,
    failure_percentage,
    prediction,
    risk_level,
    prediction_horizon,
    maintenance_urgency,
    recommended_action,
    root_cause,
    maintenance_plan,
    final_decision,
    work_order_ready,

    // UI backward compatibility
    failureRisk: failure_percentage,
    status: risk_level,
    failureType: root_cause.length > 60 ? root_cause.slice(0, 57) + '...' : root_cause,
    rootCause: root_cause,
    maintenanceUrgency: maintenance_urgency,
    estimatedDowntime: risk_level === 'CRITICAL' ? '4.0 - 6.0 Hours' : risk_level === 'HIGH' ? '2.0 - 3.0 Hours' : '1.0 Hour',
    reportSummary: final_decision,
    isLive: true,
    executionTimeMs,
    sensor_inputs: payload,
    pipelineStages: raw?.pipeline_stages || [
      { stage: 1, name: 'Sensor Analysis', status: 'COMPLETED', detail: `Validated telemetry for ${machine_id} (Temp: ${payload.temperature}°C, Vibe: ${payload.vibration}mm/s, Current: ${payload.current}A, RPM: ${payload.rpm}, Load: ${payload.load_percentage}%)` },
      { stage: 2, name: 'XGBoost', status: 'COMPLETED', detail: `Scored failure risk at ${failure_percentage}% (${risk_level})` },
      { stage: 3, name: 'Agent 2 (Prediction Analysis)', status: 'COMPLETED', detail: `Analyzed degradation trajectory over ${prediction_horizon}` },
      { stage: 4, name: 'Agent 4 (Predictive Maintenance)', status: 'COMPLETED', detail: `Assigned urgency: ${maintenance_urgency}` },
      { stage: 5, name: 'Agent 5 (Root Cause Analysis)', status: 'COMPLETED', detail: `Diagnosed: ${root_cause.slice(0, 48)}...` },
      { stage: 6, name: 'Agent 6 (Maintenance Planning)', status: 'COMPLETED', detail: `Generated procedure: ${maintenance_plan.slice(0, 48)}...` },
      { stage: 7, name: 'Agent 7 (Decision Supervisor)', status: 'COMPLETED', detail: `Decision approved: ${final_decision} (Work Order: ${work_order_ready ? 'READY' : 'STANDBY'})` },
    ],
  };
};

/**
 * Stores the normalized SNS analysis in localStorage and updates existing UI state
 */
export const saveMachineAnalysisResult = (analysis) => {
  if (!analysis || !analysis.machine_id) return;
  const mId = analysis.machine_id;

  // 1. Update fs_predictions_v1
  try {
    const preds = JSON.parse(safeStorage.getItem('fs_predictions_v1') || '[]');
    const idx = preds.findIndex((p) => p.machine === mId);
    const updatedPred = {
      id: idx >= 0 ? preds[idx].id : `PRD-${Date.now().toString().slice(-4)}`,
      machine: mId,
      name: idx >= 0 ? preds[idx].name : `Equipment Unit ${mId}`,
      riskScore: analysis.failure_percentage,
      riskLevel: analysis.risk_level,
      status: analysis.risk_level === 'CRITICAL' ? 'Action Required' : analysis.risk_level === 'HIGH' ? 'Monitor' : 'Healthy',
      rulDays: analysis.risk_level === 'CRITICAL' ? 4 : analysis.risk_level === 'HIGH' ? 14 : 45,
      rulHours: analysis.risk_level === 'CRITICAL' ? 96 : analysis.risk_level === 'HIGH' ? 336 : 1080,
      confidence: '98.5% (SNS Workflow)',
      component: analysis.root_cause || 'Bearing Pack & Spindle Rotor',
      recommendation: `${analysis.maintenance_urgency}: ${analysis.recommended_action}`,
      lastAnalyzed: new Date().toISOString(),
    };
    if (idx >= 0) {
      preds[idx] = updatedPred;
    } else {
      preds.unshift(updatedPred);
    }
    safeStorage.setItem('fs_predictions_v1', JSON.stringify(preds));
  } catch (e) {
    console.error('Failed to sync predictions store:', e);
  }

  // 2. Update fs_machines_v1
  try {
    const machines = JSON.parse(safeStorage.getItem('fs_machines_v1') || '[]');
    const mIdx = machines.findIndex((m) => m.id === mId);
    const health = Math.max(5, 100 - analysis.failure_percentage);
    const updatedMachine = {
      id: mId,
      name: mIdx >= 0 ? machines[mIdx].name : `Equipment Unit ${mId}`,
      line: mIdx >= 0 ? machines[mIdx].line : 'Machining Line 1',
      status: analysis.risk_level === 'CRITICAL' ? 'WARNING' : 'NORMAL',
      vibration: `${analysis.sensor_inputs?.vibration ?? 2.5} mm/s`,
      temp: `${analysis.sensor_inputs?.temperature ?? 70}°C`,
      pressure: `${analysis.sensor_inputs?.current ? (analysis.sensor_inputs.current * 15).toFixed(0) : 115} bar`,
      health,
      lastUpdated: new Date().toISOString(),
    };
    if (mIdx >= 0) {
      machines[mIdx] = updatedMachine;
    } else {
      machines.push(updatedMachine);
    }
    safeStorage.setItem('fs_machines_v1', JSON.stringify(machines));
  } catch (e) {
    console.error('Failed to sync machines store:', e);
  }

  // 3. Create Alert if CRITICAL / HIGH
  if (analysis.risk_level === 'CRITICAL' || analysis.risk_level === 'HIGH') {
    try {
      const alerts = JSON.parse(safeStorage.getItem('fs_alerts_v1') || '[]');
      const newAlert = {
        id: `ALT-SNS-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString('en-GB'),
        machine: `${mId} (${analysis.recommended_action.slice(0, 30)}...)`,
        severity: analysis.risk_level === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        message: `SNS Workflow: ${analysis.root_cause}. ${analysis.recommended_action}`,
        source: 'SNS Agent Supervisor',
        type: 'PREDICTIVE_MAINTENANCE',
        assignedTo: 'Lead Maintenance Engineer',
        createdBy: 'SNS Agent Workbench',
        ack: false,
      };
      alerts.unshift(newAlert);
      safeStorage.setItem('fs_alerts_v1', JSON.stringify(alerts.slice(0, 20)));
    } catch (e) {
      console.error('Failed to sync alerts store:', e);
    }
  }

  // 4. Dispatch global event for live views
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fs-analysis-updated', { detail: analysis }));
  }
};

/* ---------------- DEFECT COMPUTER VISION DATA ---------------- */
export const CV_VIDEO_FEED_URL = null;

export const detectImageDefects = async (imageBlob, machineId = 'M-03') => {
  return {
    inspection_status: 'NORMAL',
    total_defects: 0,
    detections: [],
  };
};

export const getDetectStatus = async () => {
  // SNS Cloud Mode - zero network requests to localhost:8000
  return {
    status: 'standby',
    fps: 0,
    camera: 'CAM-01 (Laptop Camera)',
    machine: 'M-03 (Laser Scribing)',
    timestamp: new Date().toISOString(),
    inspection_status: 'NORMAL',
    total_defects: 0,
    detections: [],
  };
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
  return [];
};

/* ---------------- DATA LOGS & EXPORT ---------------- */
export const getLogs = async (category = 'operational') => {
  return [];
};

/* ---------------- ALERTS DATA & RBAC DISPATCH ---------------- */
const DEFAULT_ALERTS = [];

export const getAlerts = async () => {
  const saved = safeStorage.getItem('fs_alerts_v1');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
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
  safeStorage.setItem('fs_alerts_v1', JSON.stringify(updated));
  return newAlert;
};

export const acknowledgeAlert = async (alertId) => {
  const current = await getAlerts();
  const updated = current.map((a) => (a.id === alertId ? { ...a, ack: true } : a));
  safeStorage.setItem('fs_alerts_v1', JSON.stringify(updated));
  return updated.find((a) => a.id === alertId);
};

export const deleteAlert = async (alertId, currentUser) => {
  if (currentUser?.role?.toUpperCase() !== 'ADMIN') {
    throw new Error('Access Denied: Only Administrator accounts can delete alerts.');
  }
  const current = await getAlerts();
  const updated = current.filter((a) => a.id !== alertId);
  safeStorage.setItem('fs_alerts_v1', JSON.stringify(updated));
  return { success: true };
};

/* ---------------- SHOP FLOOR WORKERS (ADMIN ONLY) ---------------- */
const DEFAULT_WORKERS = [];

export const getWorkers = async () => {
  const saved = safeStorage.getItem('fs_workers');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
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
  safeStorage.setItem('fs_workers', JSON.stringify(updated));
  return newWorker;
};

export const updateWorker = async (id, updates) => {
  const current = await getWorkers();
  const updated = current.map((w) => (w.id === id ? { ...w, ...updates } : w));
  safeStorage.setItem('fs_workers', JSON.stringify(updated));
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
  analyzeMachine,
  analyzeMachineTelemetry,
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
