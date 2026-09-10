import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Shared Layout Shell
import Layout from './components/Layout';

// Lazy-Loaded Feature Pages for optimal code-splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const TermsPrivacy = lazy(() => import('./pages/TermsPrivacy'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Telemetry = lazy(() => import('./pages/Telemetry'));
const PredictiveMaintenance = lazy(() => import('./pages/PredictiveMaintenance'));
const Defects = lazy(() => import('./pages/Defects'));
const Insights = lazy(() => import('./pages/Insights'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Logs = lazy(() => import('./pages/Logs'));
const Workers = lazy(() => import('./pages/Workers'));
const Profile = lazy(() => import('./pages/Profile'));
const Contact = lazy(() => import('./pages/Contact'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

const PageFallback = () => (
  <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-[var(--brand-accent)] border-t-transparent animate-spin" />
  </div>
);

function AppRoutes() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public Marketing & Compliance Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/terms" element={<TermsPrivacy defaultTab="terms" />} />
        <Route path="/privacy" element={<TermsPrivacy defaultTab="privacy" />} />

        {/* Public Authentication Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authenticated Workspace Shell */}
        <Route element={<Layout user={user} onLogout={handleLogout} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/telemetry" element={<Telemetry />} />
          <Route path="/predictive-maintenance" element={<PredictiveMaintenance />} />
          <Route path="/machine-health" element={<Navigate to="/predictive-maintenance" replace />} />
          <Route path="/defects" element={<Defects />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/settings" element={<Settings user={user} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
