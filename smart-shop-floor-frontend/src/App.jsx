import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Shared Layout Shell
import Layout from './components/Layout';

// All Application Feature Pages
import LandingPage from './pages/LandingPage';
import TermsPrivacy from './pages/TermsPrivacy';
import Dashboard from './pages/Dashboard';
import Telemetry from './pages/Telemetry';
import PredictiveMaintenance from './pages/PredictiveMaintenance';
import Defects from './pages/Defects';
import Insights from './pages/Insights';
import Alerts from './pages/Alerts';
import Logs from './pages/Logs';
import Workers from './pages/Workers';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

function AppRoutes() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
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
