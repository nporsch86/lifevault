import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (email: string, password: string, name: string) => Promise<string | null>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on page load
  useEffect(() => {
    const savedToken = localStorage.getItem('lifevault_token');
    const savedUser = localStorage.getItem('lifevault_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then(res => {
          if (!res.ok) {
            localStorage.removeItem('lifevault_token');
            localStorage.removeItem('lifevault_user');
            setToken(null);
            setUser(null);
          }
        })
        .catch(() => { /* offline, use cached session */ })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || 'Login failed';
      localStorage.setItem('lifevault_token', data.token);
      localStorage.setItem('lifevault_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return null;
    } catch {
      return 'Could not connect to server';
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || 'Signup failed';
      localStorage.setItem('lifevault_token', data.token);
      localStorage.setItem('lifevault_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return null;
    } catch {
      return 'Could not connect to server';
    }
  };

  const logout = () => {
    localStorage.removeItem('lifevault_token');
    localStorage.removeItem('lifevault_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};