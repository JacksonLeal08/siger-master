'use client';

import { useState, useEffect, useCallback } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'siger_theme';

export function useThemePreference(defaultPref: ThemePreference = 'system') {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    if (typeof window !== 'undefined') {
      const saved = (
        localStorage.getItem(STORAGE_KEY) || 
        localStorage.getItem('spci_theme') || 
        localStorage.getItem('siger_theme_pref')
      ) as ThemePreference | null;
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        return saved;
      }
    }
    return defaultPref;
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false; // Light-first fallback
  });

  // Escuta alterações na preferência do sistema operacional
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Tema Efetivo Resolvido
  const resolvedTheme: ResolvedTheme = 
    themePreference === 'system'
      ? (systemIsDark ? 'dark' : 'light')
      : themePreference;

  // Aplicação Síncrona no Elemento Raiz <html> para Evitar FOUC
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
  }, [resolvedTheme]);

  const setThemePreference = useCallback((newPref: ThemePreference) => {
    setThemePreferenceState(newPref);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newPref);
      localStorage.setItem('spci_theme', newPref);
      localStorage.setItem('siger_theme_pref', newPref);
    }
  }, []);

  return {
    themePreference,
    resolvedTheme,
    setThemePreference,
    isDark: resolvedTheme === 'dark'
  };
}
