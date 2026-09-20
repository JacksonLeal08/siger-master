'use client';

import React from 'react';
import { Truck, Fuel, Wrench, X, Maximize2 } from 'lucide-react';

export interface MinimizedWindow {
  id: string;
  title: string;
  type: 'viatura' | 'abastecimento' | 'ordem_servico' | 'pneus';
}

interface FrotaDockBarProps {
  minimizedWindows: MinimizedWindow[];
  onRestore: (id: string) => void;
  onClose: (id: string) => void;
}

export const FrotaDockBar: React.FC<FrotaDockBarProps> = ({
  minimizedWindows,
  onRestore,
  onClose
}) => {
  if (!minimizedWindows || minimizedWindows.length === 0) return null;

  const getIcon = (type: MinimizedWindow['type']) => {
    switch (type) {
      case 'viatura':
        return <Truck className="w-3.5 h-3.5 text-red-500" />;
      case 'abastecimento':
        return <Fuel className="w-3.5 h-3.5 text-amber-500" />;
      case 'ordem_servico':
        return <Wrench className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return <Truck className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="fixed bottom-3 right-4 z-50 flex items-center gap-2 max-w-full overflow-x-auto p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl font-mono select-none">
      <span className="text-[9px] uppercase tracking-widest text-slate-400 px-2 font-bold hidden sm:inline">
        Janelas Minimizadas ({minimizedWindows.length})
      </span>

      {minimizedWindows.map((win) => (
        <div
          key={win.id}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl px-3 py-1.5 transition-all text-slate-200 text-xs shadow-xs group"
        >
          <button
            type="button"
            onClick={() => onRestore(win.id)}
            className="flex items-center gap-2 cursor-pointer bg-transparent border-none text-left truncate max-w-[160px]"
            title={`Restaurar ${win.title}`}
          >
            {getIcon(win.type)}
            <span className="truncate text-[11px] font-bold text-slate-100">{win.title}</span>
            <Maximize2 className="w-3 h-3 text-slate-400 group-hover:text-white" />
          </button>
          <button
            type="button"
            onClick={() => onClose(win.id)}
            className="text-slate-400 hover:text-red-400 p-0.5 rounded cursor-pointer border-none bg-transparent transition-colors"
            title="Fechar janela"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
