'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Disc, 
  ChevronDown, 
  CheckCircle2, 
  Layers,
  Sparkles
} from 'lucide-react';
import { TipoTerrenoPneu } from '@/lib/types/frota';
import { TIRE_PROFILES_DATA, TireProfileDetail } from '@/lib/data/tireProfilesData';
import { TireTypeCard3D } from './TireTypeCard3D';
import { TireTypeDetailModal } from './TireTypeDetailModal';
import { DockMinimizados, MinimizedWindow } from './DockMinimizados';

interface TireTypesGuideCardProps {
  isDark?: boolean;
  highlightedType?: TipoTerrenoPneu | null;
  isOpenControlled?: boolean;
  onToggleOpen?: (isOpen: boolean) => void;
  onMinimizeToParentDock?: (win: MinimizedWindow) => void;
  hasActiveToast?: boolean;
}

const TIRE_ORDER: TipoTerrenoPneu[] = ['HT', 'AT', 'RT', 'MT'];

export const TireTypesGuideCard: React.FC<TireTypesGuideCardProps> = ({
  isDark = true,
  highlightedType = null,
  isOpenControlled,
  onToggleOpen,
  onMinimizeToParentDock,
  hasActiveToast = false
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Estado do Pop-up Executivo da Ficha Técnica (Aberto / Selecionado)
  const [selectedDetailType, setSelectedDetailType] = useState<TipoTerrenoPneu | null>(null);

  // Lista de fichas técnicas minimizadas no Dock inferior
  const [minimizedProfiles, setMinimizedProfiles] = useState<TipoTerrenoPneu[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Inicializa a persistência do localStorage do accordion
  useEffect(() => {
    try {
      const saved = localStorage.getItem('siger_tire_guide_collapsed');
      if (saved !== null) {
        setInternalOpen(saved === 'false');
      }
    } catch {
      // Ignora erro em ambientes restritos de storage
    }
  }, []);

  // Se controlado pelo componente pai (ex: clique na tag de terreno), expande
  useEffect(() => {
    if (isOpenControlled !== undefined) {
      setInternalOpen(isOpenControlled);
    }
  }, [isOpenControlled]);

  const toggleOpen = () => {
    const nextState = !internalOpen;
    setInternalOpen(nextState);
    if (onToggleOpen) {
      onToggleOpen(nextState);
    }
    try {
      localStorage.setItem('siger_tire_guide_collapsed', String(!nextState));
    } catch {
      // Ignora erro
    }
  };

  const isCurrentHighlighted = (tipo: TipoTerrenoPneu) => highlightedType === tipo;

  // Minimizar ficha técnica para o Dock
  const handleMinimizeDetail = (profile: TireProfileDetail) => {
    setSelectedDetailType(null);
    if (!minimizedProfiles.includes(profile.tipo)) {
      setMinimizedProfiles((prev) => [...prev, profile.tipo]);
    }

    if (onMinimizeToParentDock) {
      onMinimizeToParentDock({
        id: `ficha_tecnica_${profile.tipo}`,
        title: `Ficha: Pneu ${profile.sigla}`,
        type: 'ficha_tecnica_pneu'
      });
    }
  };

  // Restaurar ficha técnica do Dock
  const handleRestoreFromDock = (id: string) => {
    const matchedType = TIRE_ORDER.find((t) => id.includes(t));
    if (matchedType) {
      setSelectedDetailType(matchedType);
      setMinimizedProfiles((prev) => prev.filter((t) => t !== matchedType));
    }
  };

  // Fechar ficha técnica minimizada do Dock
  const handleCloseFromDock = (id: string) => {
    const matchedType = TIRE_ORDER.find((t) => id.includes(t));
    if (matchedType) {
      setMinimizedProfiles((prev) => prev.filter((t) => t !== matchedType));
    }
  };

  // Mapeamento dos itens minimizados para o componente DockMinimizados
  const dockItems: MinimizedWindow[] = minimizedProfiles.map((tipo) => ({
    id: `ficha_tecnica_${tipo}`,
    title: `Ficha: Pneu ${TIRE_PROFILES_DATA[tipo].sigla}`,
    type: 'ficha_tecnica_pneu'
  }));

  return (
    <div 
      id="tire-types-guide-container"
      className={`border rounded-3xl p-4 sm:p-5 relative overflow-hidden font-sans transition-all duration-300 ${
        isDark 
          ? 'bg-zinc-950/80 border-zinc-800 text-slate-100 shadow-xl' 
          : 'bg-slate-50/90 border-slate-300 text-slate-800 shadow-sm'
      }`}
    >
      {/* ==================================================================== */}
      {/* CABEÇALHO INTERATIVO ACCORDION */}
      {/* ==================================================================== */}
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center justify-between text-left cursor-pointer group bg-transparent border-none p-0 focus:outline-none"
        aria-expanded={internalOpen}
        aria-controls="tire-types-bento-grid"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-105 ${
            isDark 
              ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' 
              : 'bg-blue-50 border border-blue-200 text-blue-600'
          }`}>
            <Disc className="w-5 h-5 animate-spin-slow" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-xs sm:text-[13px] font-black uppercase tracking-wider font-mono ${
                isDark ? 'text-slate-100 group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
              } transition-colors`}>
                GUIA DE APLICAÇÃO: TIPOS DE PNEUS PARA CAMINHONETES & VIATURAS
              </h4>
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isDark 
                  ? 'bg-blue-950/70 text-blue-400 border-blue-800' 
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                H/T • A/T • R/T • M/T (3D)
              </span>
            </div>
            <p className={`text-[10.5px] font-mono mt-0.5 truncate ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Classificação por severidade de terreno • Toque em qualquer card para abrir a Ficha Técnica Executiva
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`text-[9.5px] font-mono font-bold hidden sm:inline-block ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {internalOpen ? 'Ocultar Perfis' : 'Explorar em 3D'}
          </span>
          <div className={`p-1.5 rounded-xl border transition-transform duration-200 ${
            internalOpen 
              ? 'rotate-180 bg-blue-600 text-white border-blue-500' 
              : isDark ? 'border-zinc-800 text-slate-400 bg-zinc-900/60' : 'border-slate-300 text-slate-600 bg-white'
          }`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* ==================================================================== */}
      {/* CONTEÚDO EXPANSÍVEL: GRADE 3D DOS 4 PERFIS DE PNEUS */}
      {/* ==================================================================== */}
      {internalOpen && (
        <div id="tire-types-bento-grid" className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-zinc-800/80 space-y-4 animate-in fade-in-50 duration-200">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TIRE_ORDER.map((tipo) => (
              <TireTypeCard3D
                key={tipo}
                profile={TIRE_PROFILES_DATA[tipo]}
                isDark={isDark}
                isHighlighted={isCurrentHighlighted(tipo)}
                onOpenDetail={(selected) => setSelectedDetailType(selected)}
              />
            ))}
          </div>

          {/* ==================================================================== */}
          {/* BARRA INFORMATIVA CORPORATIVA DE RODAGEM */}
          {/* ==================================================================== */}
          <div className={`pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono ${
            isDark ? 'border-zinc-800 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Equipamento correto para a rota evita desgaste prematuro e previne perda de tração
            </span>
            <span className="font-bold text-red-600">
              Auditoria Operacional SIGER Frota
            </span>
          </div>

        </div>
      )}

      {/* ==================================================================== */}
      {/* POP-UP EXECUTIVO CENTRALIZADO (FICHA TÉCNICA VIA PORTAL) */}
      {/* ==================================================================== */}
      <TireTypeDetailModal
        isOpen={selectedDetailType !== null}
        profileType={selectedDetailType}
        isDark={isDark}
        onClose={() => setSelectedDetailType(null)}
        onMinimize={handleMinimizeDetail}
      />

      {/* ==================================================================== */}
      {/* BARRA FLUTUANTE DOCK PARA FICHAS MINIMIZADAS (VIA PORTAL) */}
      {/* ==================================================================== */}
      {mounted && dockItems.length > 0 && createPortal(
        <DockMinimizados
          minimizedWindows={dockItems}
          onRestore={handleRestoreFromDock}
          onClose={handleCloseFromDock}
          hasActiveToast={hasActiveToast}
        />,
        document.body
      )}
    </div>
  );
};

export default TireTypesGuideCard;
