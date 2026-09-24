'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type WindowState = 'restored' | 'maximized' | 'minimized' | 'closed';

export interface WindowItem {
  id: string;
  title: string;
  subtitle?: string;
  iconName?: string;
  badgeStatus?: string;
  state: WindowState;
  lastActiveAt: number;
  onRestore?: () => void;
  onClose?: () => void;
}

interface WindowModalContextType {
  windows: Record<string, WindowItem>;
  activeWindowId: string | null;
  registerWindow: (
    id: string,
    data: {
      title: string;
      subtitle?: string;
      iconName?: string;
      badgeStatus?: string;
      onRestore?: () => void;
      onClose?: () => void;
    }
  ) => void;
  updateWindowMetadata: (
    id: string,
    data: {
      title?: string;
      subtitle?: string;
      iconName?: string;
      badgeStatus?: string;
    }
  ) => void;
  unregisterWindow: (id: string) => void;
  setWindowState: (id: string, state: WindowState) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  getWindowState: (id: string) => WindowState;
  minimizedWindows: WindowItem[];
}

const WindowModalContext = createContext<WindowModalContextType | undefined>(undefined);

export function WindowModalProvider({ children }: { children: React.ReactNode }) {
  const STORAGE_WINDOWS = 'siger_window_dock_windows';
  const STORAGE_STATES = 'siger_window_persisted_states';

  // Carrega janelas minimizadas salvas do localStorage para persistir após F5
  const [windows, setWindows] = useState<Record<string, WindowItem>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_WINDOWS);
        if (saved) {
          const parsed = JSON.parse(saved) as Record<string, WindowItem>;
          // Manter apenas as que estavam minimizadas para o dock
          const minimizedOnly: Record<string, WindowItem> = {};
          for (const [k, v] of Object.entries(parsed)) {
            if (v.state === 'minimized') {
              minimizedOnly[k] = v;
            }
          }
          return minimizedOnly;
        }
      } catch (e) {
        console.warn('[WindowModalContext] Erro ao carregar janelas do cache:', e);
      }
    }
    return {};
  });

  const [persistedStates, setPersistedStates] = useState<Record<string, WindowState>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_STATES);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {}
    }
    return {};
  });

  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);

  // Sincroniza janelas minimizadas no localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const toSave: Record<string, any> = {};
      for (const [k, v] of Object.entries(windows)) {
        if (v.state === 'minimized') {
          toSave[k] = {
            id: v.id,
            title: v.title,
            subtitle: v.subtitle,
            iconName: v.iconName,
            badgeStatus: v.badgeStatus,
            state: v.state,
            lastActiveAt: v.lastActiveAt,
          };
        }
      }
      localStorage.setItem(STORAGE_WINDOWS, JSON.stringify(toSave));
    } catch (e) {}
  }, [windows]);

  // Sincroniza persistedStates no localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_STATES, JSON.stringify(persistedStates));
    } catch (e) {}
  }, [persistedStates]);

  const registerWindow = useCallback(
    (
      id: string,
      data: {
        title: string;
        subtitle?: string;
        iconName?: string;
        badgeStatus?: string;
        onRestore?: () => void;
        onClose?: () => void;
      }
    ) => {
      setWindows((prev) => {
        const existing = prev[id];
        // Preserva o estado ativo anterior (inclusive maximized e minimized)
        const resolvedState = existing
          ? existing.state
          : (persistedStates[id] && persistedStates[id] !== 'closed' ? persistedStates[id] : 'restored');

        return {
          ...prev,
          [id]: {
            id,
            title: data.title,
            subtitle: data.subtitle,
            iconName: data.iconName,
            badgeStatus: data.badgeStatus,
            state: resolvedState,
            lastActiveAt: Date.now(),
            onRestore: data.onRestore || existing?.onRestore,
            onClose: data.onClose || existing?.onClose,
          },
        };
      });
      setActiveWindowId(id);
    },
    [persistedStates]
  );

  const updateWindowMetadata = useCallback(
    (
      id: string,
      data: {
        title?: string;
        subtitle?: string;
        iconName?: string;
        badgeStatus?: string;
      }
    ) => {
      setWindows((prev) => {
        const item = prev[id];
        if (!item) return prev;
        return {
          ...prev,
          [id]: {
            ...item,
            ...(data.title !== undefined ? { title: data.title } : {}),
            ...(data.subtitle !== undefined ? { subtitle: data.subtitle } : {}),
            ...(data.iconName !== undefined ? { iconName: data.iconName } : {}),
            ...(data.badgeStatus !== undefined ? { badgeStatus: data.badgeStatus } : {}),
          },
        };
      });
    },
    []
  );

  const unregisterWindow = useCallback((id: string) => {
    setWindows((prev) => {
      // Se a janela estiver minimizada, PRESERVA na bandeja mesmo que o componente desmonte temporariamente
      if (prev[id]?.state === 'minimized') {
        return prev;
      }
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setActiveWindowId((prev) => (prev === id ? null : prev));
  }, []);

  const setWindowState = useCallback((id: string, state: WindowState) => {
    setWindows((prev) => {
      const item = prev[id];
      if (!item) return prev;
      return {
        ...prev,
        [id]: {
          ...item,
          state,
          lastActiveAt: Date.now(),
        },
      };
    });
    setPersistedStates((prev) => ({
      ...prev,
      [id]: state,
    }));
    if (state !== 'minimized' && state !== 'closed') {
      setActiveWindowId(id);
    }
  }, []);

  const minimizeWindow = useCallback(
    (id: string) => {
      setWindowState(id, 'minimized');
    },
    [setWindowState]
  );

  const maximizeWindow = useCallback(
    (id: string) => {
      setWindowState(id, 'maximized');
    },
    [setWindowState]
  );

  const restoreWindow = useCallback(
    (id: string) => {
      setWindowState(id, 'restored');
      const item = windows[id];
      if (item?.onRestore) {
        item.onRestore();
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('siger:restore_window', { detail: { id, item } }));
      }
    },
    [setWindowState, windows]
  );

  const closeWindow = useCallback(
    (id: string) => {
      const item = windows[id];
      if (item?.onClose) {
        item.onClose();
      }
      setWindowState(id, 'closed');
      setPersistedStates((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setWindows((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('siger:close_window', { detail: { id } }));
      }
      setActiveWindowId((prev) => (prev === id ? null : prev));
    },
    [setWindowState, windows]
  );

  const bringToFront = useCallback((id: string) => {
    setActiveWindowId(id);
    setWindows((prev) => {
      const item = prev[id];
      if (!item) return prev;
      return {
        ...prev,
        [id]: { ...item, lastActiveAt: Date.now() },
      };
    });
  }, []);

  const getWindowState = useCallback(
    (id: string): WindowState => {
      return windows[id]?.state || persistedStates[id] || 'closed';
    },
    [windows, persistedStates]
  );

  const minimizedWindows = useMemo(() => {
    return Object.values(windows).filter((w) => w.state === 'minimized');
  }, [windows]);

  return (
    <WindowModalContext.Provider
      value={{
        windows,
        activeWindowId,
        registerWindow,
        updateWindowMetadata,
        unregisterWindow,
        setWindowState,
        minimizeWindow,
        maximizeWindow,
        restoreWindow,
        closeWindow,
        bringToFront,
        getWindowState,
        minimizedWindows,
      }}
    >
      {children}
    </WindowModalContext.Provider>
  );
}

export function useWindowModal() {
  const context = useContext(WindowModalContext);
  if (!context) {
    throw new Error('useWindowModal deve ser usado dentro de um WindowModalProvider');
  }
  return context;
}
