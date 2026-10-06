import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../services/storage';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  isDark: boolean;
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryDark: string;
  primaryMuted: string;
  secondary: string;
  accent: string;
  purple: string;
  cardShadow: any;
  inputBg: string;
  buttonOAuth: string;
  buttonOAuthBorder: string;
  buttonOAuthText: string;
}

export const lightColors: ThemeColors = {
  isDark: false,
  background: '#F8FAFD',
  backgroundSecondary: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  primary: '#00D1B2',
  primaryDark: '#00A88D',
  primaryMuted: 'rgba(0, 209, 178, 0.12)',
  secondary: '#7C3AED',
  accent: '#E11D48',
  purple: '#8B5CF6',
  cardShadow: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  inputBg: '#F8FAFD',
  buttonOAuth: '#FFFFFF',
  buttonOAuthBorder: '#E2E8F0',
  buttonOAuthText: '#0F172A',
};

export const darkColors: ThemeColors = {
  isDark: true,
  background: '#0B0F14',
  backgroundSecondary: '#0A111F',
  surface: '#141922',
  surfaceElevated: '#1E293B',
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.15)',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B0F14',
  primary: '#00D1B2',
  primaryDark: '#00A88D',
  primaryMuted: 'rgba(0, 209, 178, 0.12)',
  secondary: '#7C3AED',
  accent: '#E11D48',
  purple: '#8B5CF6',
  cardShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  inputBg: '#0A111F',
  buttonOAuth: '#111A26',
  buttonOAuthBorder: 'rgba(255, 255, 255, 0.1)',
  buttonOAuthText: '#FFFFFF',
};

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark', 
  isDark: true,
  colors: darkColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const THEME_STORAGE_KEY = '@expensio_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    async function loadSavedTheme() {
      setMode('dark'); // Force dark mode for high-end fintech theme
    }
    loadSavedTheme();
  }, []);

  const toggleTheme = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    storage.set(THEME_STORAGE_KEY, next).catch(() => {});
  };

  const setTheme = (nextMode: ThemeMode) => {
    setMode(nextMode);
    storage.set(THEME_STORAGE_KEY, nextMode).catch(() => {});
  };

  const currentColors = mode === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider
      value={{
        mode,
        isDark: mode === 'dark',
        colors: currentColors,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
