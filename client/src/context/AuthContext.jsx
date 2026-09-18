import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { showToast } = useToast();
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.getAdminMe();
        if (res?.user) {
          setAdminUser(res.user);
        }
      } catch (err) {
        // Session not active, clear stored token
        localStorage.removeItem('tl_admin_token');
        setAdminUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.adminLogin(email, password);
      setAdminUser(res.user);
      showToast(`Welcome back, ${res.user.name || 'Admin'}!`, 'success');
      return res;
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.adminLogout();
    } catch (e) {
      // Ignore network errors on logout
    }
    setAdminUser(null);
    showToast('Logged out successfully', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        isAuthenticated: !!adminUser,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
