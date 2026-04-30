import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setToken, getToken } from '../api/client';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

const USER_KEY = 'wakibi.user';

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (getToken() ? loadStoredUser() : null));

  const persist = useCallback((u) => {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    setToken(res.token);
    const u = { userId: res.userId, username: res.username, email: res.email };
    setUser(u); persist(u);
    return res;
  }, [persist]);

  const register = useCallback(async (email, username, password) => {
    const res = await authApi.register({ email, username, password });
    setToken(res.token);
    const u = { userId: res.userId, username: res.username, email: res.email };
    setUser(u); persist(u);
    return res;
  }, [persist]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    persist(null);
  }, [persist]);

  // React to token expiry triggered by axios interceptor
  useEffect(() => {
    const handler = () => { setUser(null); persist(null); };
    window.addEventListener('wakibi:auth-expired', handler);
    return () => window.removeEventListener('wakibi:auth-expired', handler);
  }, [persist]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
