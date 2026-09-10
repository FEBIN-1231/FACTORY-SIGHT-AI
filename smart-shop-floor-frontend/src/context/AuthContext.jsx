import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getStoredUser,
  login as apiLogin,
  register as apiRegister,
  loginWithGoogle as apiLoginWithGoogle,
  logout as apiLogout,
  updateProfile as apiUpdateProfile,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Synchronize user state when storage changes (cross-tab or internal dispatch)
    const syncUser = () => {
      setUser(getStoredUser());
    };

    window.addEventListener('storage', syncUser);
    window.addEventListener('fs_auth_change', syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('fs_auth_change', syncUser);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await apiLogin(email, password);
      setUser(result.user);
      window.dispatchEvent(new Event('fs_auth_change'));
      return result;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (roleOverride, simulatedProfile) => {
    setLoading(true);
    try {
      const result = await apiLoginWithGoogle(roleOverride, simulatedProfile);
      setUser(result.user);
      window.dispatchEvent(new Event('fs_auth_change'));
      return result;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const result = await apiRegister(data);
      setUser(result.user);
      window.dispatchEvent(new Event('fs_auth_change'));
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    window.dispatchEvent(new Event('fs_auth_change'));
  };

  const updateUser = (updates) => {
    const updated = apiUpdateProfile(updates);
    if (updated) {
      setUser(updated);
      window.dispatchEvent(new Event('fs_auth_change'));
    }
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
