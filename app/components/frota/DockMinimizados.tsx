'use client';

import React from 'react';
import { Truck, Fuel, Wrench, Disc, X, Maximize2, BookOpen } from 'lucide-react';

export interface MinimizedWindow {
  id: string;
  title: string;
  type: 'viatura' | 'abastecimento' | 'ordem_servico' | 'pneus' | 'ficha_tecnica_pneu';
}

export interface DockMinimizadosProps {
  minimizedWindows: MinimizedWindow[];
  onRestore: (id: string) => void;
  onClose: (id: string) => void;
  hasActiveToast?: boolean;
}

export const DockMinimizados: React.FC<DockMinimizadosProps> = ({
  minimizedWindows,
  onRestore,
  onClose,
  hasActiveToast = false
}) => {
  if (!minimizedWindows || minimizedWindows.length === 0) return null;

  const getIcon = (type: MinimizedWindow['type']) => {
    switch (type) {
      case 'viatura':
        return <Truck className="w-3.5 h-3.5 text-red-500 shrink-0" />;
      case 'abastecimento':
        return <Fuel className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'ordem_servico':
        return <Wrench className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
      case 'pneus':
        return <Disc className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case 'ficha_tecnica_pneu':
        return <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      default:
        return <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  return (
    <aside 
      aria-label="Janelas Minimizadas"
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[9000] flex items-center gap-2 max-w-[95vw] sm:max-w-2xl overflow-x-auto p-2 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl font-mono select-none transition-all duration-300 ease-out ${
        hasActiveToast ? '-translate-y-20' : 'translate-y-0'
      }`}
    >
      <div className="flex items-center gap-1.5 px-2 border-r border-slate-700/60 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold hidden sm:inline">
          Minimizadas ({minimizedWindows.length})
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
        {minimizedWindows.map((win) => (
          <div
            key={win.id}
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-750 border border-slate-700/90 rounded-xl px-2.5 py-1.5 transition-all text-slate-200 text-xs shadow-xs group shrink-0"
          >
            <button
              type="button"
              onClick={() => onRestore(win.id)}
              className="flex items-center gap-2 cursor-pointer bg-transparent border-none text-left truncate max-w-[140px] sm:max-w-[180px]"
              title={`Restaurar ${win.title}`}
            >
              {getIcon(win.type)}
              <span className="truncate text-[11px] font-bold text-slate-100">{win.title}</span>
              <Maximize2 className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors ml-1 shrink-0" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose(win.id);
              }}
              className="text-slate-400 hover:text-red-400 hover:bg-slate-700/60 p-1 rounded-md cursor-pointer border-none bg-transparent transition-colors shrink-0"
              title="Fechar janela"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default DockMinimizados;
