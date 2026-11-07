import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/axios.js';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.data.user);
      toast.success(`Welcome back, ${res.data.data.user.name}!`);
      return res.data.data.user;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login failed';
      toast.error(msg);
      throw err;
    }
  };

  const register = async (payload) => {
    try {
      const res = await api.post('/auth/register', payload);
      setUser(res.data.data.user);
      toast.success(`Account created! Welcome, ${res.data.data.user.name}.`);
      return res.data.data.user;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed';
      toast.error(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue even if network error
    } finally {
      setUser(null);
      toast.success('Logged out successfully.');
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isCrew: user?.role === 'crew',
    isCitizen: user?.role === 'citizen',
    login,
    register,
    logout,
    refreshUser: fetchCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

