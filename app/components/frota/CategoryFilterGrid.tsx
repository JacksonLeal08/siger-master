'use client';

import React from 'react';
import { 
  Layers, 
  Ambulance, 
  Truck, 
  Flame, 
  Wrench,
  CheckCircle2
} from 'lucide-react';
import { Viatura } from '@/lib/types/frota';

export type CategoriaVeiculoId = 
  | 'TODOS' 
  | 'AMBULANCIA' 
  | 'CAMINHONETE' 
  | 'CAMINHAO_INCENDIO' 
  | 'UTILITARIO';

interface CategoryFilterGridProps {
  filtroAtual: string;
  onSelectCategoria: (categoriaId: string) => void;
  viaturas: Viatura[];
  theme?: 'light' | 'dark';
}

interface CategoriaCardDef {
  id: CategoriaVeiculoId;
  label: string;
  subtitulo: string;
  icone: React.ElementType;
  corDestaque: string;
  badgeLabel?: string;
}

const CATEGORIAS_DEFINICAO: CategoriaCardDef[] = [
  {
    id: 'TODOS',
    label: 'Todos os Veículos',
    subtitulo: 'Frota Completa',
    icone: Layers,
    corDestaque: 'text-zinc-300',
    badgeLabel: 'Frota Geral'
  },
  {
    id: 'AMBULANCIA',
    label: 'Ambulâncias',
    subtitulo: 'Resgate e APH',
    icone: Ambulance,
    corDestaque: 'text-emerald-500',
    badgeLabel: 'Emergência Médica'
  },
  {
    id: 'CAMINHONETE',
    label: 'Caminhonetes 4x4',
    subtitulo: 'Patrulha e Apoio',
    icone: Truck,
    corDestaque: 'text-blue-400',
    badgeLabel: 'Tração 4x4'
  },
  {
    id: 'CAMINHAO_INCENDIO',
    label: 'Combate / Resgate',
    subtitulo: 'Intervenção Rápida',
    icone: Flame,
    corDestaque: 'text-red-500',
    badgeLabel: 'Incêndio / Salvamento'
  },
  {
    id: 'UTILITARIO',
    label: 'Apoio Operacional',
    subtitulo: 'Logística e Transporte',
    icone: Wrench,
    corDestaque: 'text-amber-400',
    badgeLabel: 'Serviços'
  }
];

export const CategoryFilterGrid: React.FC<CategoryFilterGridProps> = ({
  filtroAtual,
  onSelectCategoria,
  viaturas,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  // Contagem dinâmica por categoria
  const contagens = React.useMemo(() => {
    const map: Record<string, number> = {
      TODOS: viaturas.length,
      AMBULANCIA: 0,
      CAMINHONETE: 0,
      CAMINHAO_INCENDIO: 0,
      UTILITARIO: 0
    };

    viaturas.forEach((v) => {
      if (v.tipo_veiculo && map[v.tipo_veiculo] !== undefined) {
        map[v.tipo_veiculo] = (map[v.tipo_veiculo] || 0) + 1;
      }
    });

    return map;
  }, [viaturas]);

  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between px-1">
        <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
          isDark ? 'text-zinc-400' : 'text-slate-500'
        }`}>
          Categorias da Frota
        </span>
        <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
          Toque para filtrar
        </span>
      </div>

      {/* Grid Bento: 2 colunas em mobile e 3/5 em desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {CATEGORIAS_DEFINICAO.map((cat) => {
          const isSelected = filtroAtual === cat.id;
          const qtd = contagens[cat.id] || 0;
          const Icone = cat.icone;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategoria(cat.id)}
              className={`relative p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer active:scale-[0.98] flex flex-col justify-between overflow-hidden ${
                isSelected
                  ? isDark
                    ? 'border-red-600 bg-red-950/30 text-white shadow-lg shadow-red-950/40 ring-1 ring-red-500/50'
                    : 'border-red-600 bg-red-50 text-slate-900 shadow-md shadow-red-500/10 ring-1 ring-red-500/40'
                  : isDark
                    ? 'border-zinc-800/90 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-850 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
              }`}
            >
              {/* Efeito Glow / Linha Superior para Selecionado */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />
              )}

              {/* Topo do Card: Ícone e Totalizador */}
              <div className="flex items-start justify-between w-full mb-2">
                <div className={`p-2 rounded-xl border flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-red-600/20 border-red-500/40 text-red-400'
                    : isDark
                      ? 'bg-zinc-950/80 border-zinc-800 text-zinc-400'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  <Icone className={`w-4 h-4 ${isSelected ? 'text-red-500 animate-pulse' : cat.corDestaque}`} />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-base font-black font-mono tracking-tight ${
                    isSelected ? 'text-red-500' : isDark ? 'text-zinc-200' : 'text-slate-800'
                  }`}>
                    {qtd}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-red-500" />
                  )}
                </div>
              </div>

              {/* Base do Card: Títulos e Subtítulos */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-black tracking-tight leading-tight line-clamp-1 ${
                    isSelected ? 'text-white' : isDark ? 'text-zinc-200' : 'text-slate-900'
                  }`}>
                    {cat.label}
                  </h4>
                </div>
                <p className={`text-[10px] leading-tight line-clamp-1 ${
                  isSelected
                    ? isDark ? 'text-red-300/80' : 'text-red-700'
                    : isDark ? 'text-zinc-500' : 'text-slate-400'
                }`}>
                  {cat.subtitulo}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
