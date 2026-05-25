import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

const getStoredEmployee = () => {
  const raw = localStorage.getItem('employee');
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem('employee');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(getStoredEmployee());
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

  const setSession = useCallback(({ employee: nextEmployee, token: nextToken, refreshToken: nextRefresh }) => {
    setEmployee(nextEmployee);
    setToken(nextToken);
    setRefreshToken(nextRefresh || null);

    localStorage.setItem('employee', JSON.stringify(nextEmployee));
    localStorage.setItem('token', nextToken);
    if (nextRefresh) localStorage.setItem('refreshToken', nextRefresh);
    else localStorage.removeItem('refreshToken');
  }, []);

  const login = useCallback(async (payload) => {
    const response = await client.post('/auth/login', payload);
    console.log('[AuthContext] login response:', response.data);
    setSession({ employee: response.data.employee, token: response.data.token, refreshToken: response.data.refreshToken });
    return response.data;
  }, [setSession]);

  const quickLogin = useCallback(async (role) => {
    const response = await client.get(`/auth/quick-login/${role}`);
    console.log('[AuthContext] quickLogin response:', response.data);
    setSession({ employee: response.data.employee, token: response.data.token, refreshToken: response.data.refreshToken });
    return response.data;
  }, [setSession]);

  const logout = useCallback(() => {
    try {
      const rt = localStorage.getItem('refreshToken');
      if (rt) {
        client.post('/auth/logout', { refreshToken: rt }).catch(() => {});
      } else {
        client.post('/auth/logout').catch(() => {});
      }
    } catch (e) {}

    setEmployee(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('employee');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }, []);

  const value = useMemo(() => ({
    employee,
    token,
    refreshToken,
    isAuthenticated: Boolean(token),
    login,
    quickLogin,
    logout,
  }), [employee, token, refreshToken, login, quickLogin, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
