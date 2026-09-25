'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWindowModal } from '@/app/context/WindowModalContext';
import { 
  Flame, 
  Truck, 
  ArrowLeftRight, 
  ClipboardList, 
  Maximize2, 
  X, 
  Layers,
  ShieldCheck
} from 'lucide-react';

export interface DockMinimizadosProps {
  className?: string;
}

export default function DockMinimizados({ className = '' }: DockMinimizadosProps) {
  const { minimizedWindows, restoreWindow, closeWindow } = useWindowModal();

  if (minimizedWindows.length === 0) return null;

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'flame':
        return <Flame className="w-3.5 h-3.5 text-amber-500" />;
      case 'truck':
        return <Truck className="w-3.5 h-3.5 text-sky-400" />;
      case 'swap':
      case 'ArrowLeftRight':
        return <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />;
      case 'clipboard':
        return <ClipboardList className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-[#68D346]" />;
    }
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 max-w-[95vw] sm:max-w-2xl overflow-x-auto p-2 bg-slate-900/95 dark:bg-zinc-950/95 backdrop-blur-md border border-slate-700/80 dark:border-zinc-800 rounded-2xl shadow-2xl font-mono select-none transition-all duration-300 ${className}`}
      aria-label="Janelas de Pilares Minimizadas"
    >
      <div className="flex items-center gap-1.5 px-2 border-r border-slate-700/80 dark:border-zinc-800 shrink-0">
        <span className="w-2 h-2 rounded-full bg-[#68D346] shadow-[0_0_8px_#68D346] animate-pulse" />
        <span className="text-[10px] uppercase tracking-wider text-slate-300 dark:text-zinc-300 font-bold hidden sm:inline">
          DOCK ({minimizedWindows.length})
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
        <AnimatePresence>
          {minimizedWindows.map((win) => (
            <motion.div
              key={win.id}
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2 bg-slate-800/90 dark:bg-zinc-900/90 hover:bg-slate-700/80 dark:hover:bg-zinc-800 border border-slate-600/70 dark:border-zinc-700 hover:border-[#68D346] rounded-xl px-2.5 py-1.5 transition-all text-white text-xs shadow-md group shrink-0"
            >
              <button
                type="button"
                onClick={() => restoreWindow(win.id)}
                className="flex items-center gap-2 cursor-pointer bg-transparent border-none text-left truncate max-w-[150px] sm:max-w-[200px]"
                title={`Restaurar: ${win.title}`}
              >
                <div className="p-1 rounded-md bg-slate-900/80 dark:bg-zinc-950 border border-slate-700/60 dark:border-zinc-800 shrink-0">
                  {renderIcon(win.iconName)}
                </div>
                <div className="flex flex-col truncate">
                  <span className="truncate text-[11px] font-bold text-slate-100 group-hover:text-[#B7F365] transition-colors">
                    {win.title}
                  </span>
                  <span className="text-[9px] text-[#68D346] truncate">
                    {win.badgeStatus || 'Em segundo plano'}
                  </span>
                </div>
                <Maximize2 className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors ml-1 shrink-0" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeWindow(win.id);
                }}
                className="text-slate-400 hover:text-red-400 hover:bg-red-950/40 p-1 rounded-md cursor-pointer border-none bg-transparent transition-colors shrink-0"
                title="Fechar e descartar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
