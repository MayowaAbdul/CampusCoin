import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDarkMode: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  toggleDarkMode: () => void;
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  adminLogin: (credentials: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('campuscoin_theme') === 'dark';
  });
  const [fontSize, setFontSizeState] = useState<'sm' | 'md' | 'lg'>(() => {
    return (localStorage.getItem('campuscoin_fontsize') as 'sm' | 'md' | 'lg') || 'md';
  });

  useEffect(() => {
    // Apply Dark mode
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('campuscoin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('campuscoin_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Apply Font Size Accessibility
    document.documentElement.classList.remove('font-sm', 'font-md', 'font-lg');
    document.documentElement.classList.add(`font-${fontSize}`);
    localStorage.setItem('campuscoin_fontsize', fontSize);
  }, [fontSize]);

  const refreshUser = async () => {
    const token = localStorage.getItem('campuscoin_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await api.getProfile();
      setUser(u);
    } catch (err) {
      console.error('Session restoration failed:', err);
      localStorage.removeItem('campuscoin_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);
  const setFontSize = (size: 'sm' | 'md' | 'lg') => setFontSizeState(size);

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    localStorage.setItem('campuscoin_token', res.token);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    localStorage.setItem('campuscoin_token', res.token);
    setUser(res.user);
  };

  const adminLogin = async (credentials: any) => {
    const res = await api.adminLogin(credentials);
    localStorage.setItem('campuscoin_token', res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('campuscoin_token');
    setUser(null);
  };

  const updateProfile = async (data: any) => {
    const updated = await api.updateProfile(data);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDarkMode,
        fontSize,
        toggleDarkMode,
        setFontSize,
        login,
        register,
        adminLogin,
        logout,
        updateProfile,
        refreshUser
      }}
    >
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
