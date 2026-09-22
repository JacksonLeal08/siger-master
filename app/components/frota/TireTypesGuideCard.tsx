'use client';

import React, { useState, useEffect } from 'react';
import { 
  Disc, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Layers, 
  AlertTriangle, 
  ShieldCheck, 
  Fuel, 
  Volume2, 
  Compass, 
  Sparkles 
} from 'lucide-react';
import { TipoTerrenoPneu } from '@/lib/types/frota';

interface TireTypesGuideCardProps {
  isDark?: boolean;
  highlightedType?: TipoTerrenoPneu | null;
  isOpenControlled?: boolean;
  onToggleOpen?: (isOpen: boolean) => void;
}

export const TireTypesGuideCard: React.FC<TireTypesGuideCardProps> = ({
  isDark = true,
  highlightedType = null,
  isOpenControlled,
  onToggleOpen
}) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // Inicializa a persistência do localStorage
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

  return (
    <div 
      id="tire-types-guide-container"
      className={`border rounded-2xl p-4 sm:p-5 relative overflow-hidden font-sans transition-all duration-300 ${
        isDark 
          ? 'bg-zinc-950/75 border-zinc-800 text-slate-100 shadow-xl' 
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
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-105 ${
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
                H/T • A/T • R/T • M/T
              </span>
            </div>
            <p className={`text-[10.5px] font-mono mt-0.5 truncate ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Classificação por severidade de terreno e diretriz operacional da frota SIGER
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`text-[9.5px] font-mono font-bold hidden sm:inline-block ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {internalOpen ? 'Ocultar Detalhes' : 'Ver Perfis de Terreno'}
          </span>
          <div className={`p-1.5 rounded-lg border transition-transform duration-200 ${
            internalOpen 
              ? 'rotate-180 bg-blue-600 text-white border-blue-500' 
              : isDark ? 'border-slate-800 text-slate-400 bg-slate-900/60' : 'border-slate-300 text-slate-600 bg-white'
          }`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* ==================================================================== */}
      {/* CONTEÚDO EXPANSÍVEL: BENTO GRID DOS 4 PERFIS */}
      {/* ==================================================================== */}
      {internalOpen && (
        <div id="tire-types-bento-grid" className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-zinc-800/80 space-y-4 animate-in fade-in-50 duration-200">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* ---------------------------------------------------------------- */}
            {/* PERFIL A: H/T (HIGHWAY TERRAIN) */}
            {/* ---------------------------------------------------------------- */}
            <div 
              id="tire-profile-HT"
              className={`p-4 rounded-xl border transition-all duration-300 relative flex flex-col justify-between ${
                isCurrentHighlighted('HT')
                  ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20 scale-[1.01] animate-pulse border-blue-500'
                  : isDark ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                    H/T • HIGHWAY TERRAIN
                  </span>
                  <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <Volume2 className="w-3 h-3 text-blue-400" /> Baixo Ruído
                  </span>
                </div>

                <h5 className={`font-mono font-bold text-xs uppercase ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  Foco em Asfalto, Silêncio & Baixo Consumo
                </h5>

                {/* Barra Gráfica de Proporção de Terreno */}
                <div className="my-2.5">
                  <div className="flex justify-between text-[9.5px] font-mono font-bold mb-1">
                    <span className="text-blue-500">80% Asfalto / Pavimento</span>
                    <span className="text-amber-500">20% Terra Leve</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-zinc-800 shadow-inner">
                    <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: '80%' }} />
                    <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: '20%' }} />
                  </div>
                </div>

                <p className={`text-[11px] leading-relaxed mb-2.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Projetados prioritariamente para rodovias pavimentadas e malha urbana. Oferecem menor resistência ao rolamento, maior economia de combustível, excelente frenagem em piso molhado e conforto de marcha sem zumbidos na cabine.
                </p>
              </div>

              <div className={`mt-2 pt-2 border-t text-[10px] font-mono flex items-start gap-1.5 ${
                isDark ? 'border-zinc-800 text-slate-400' : 'border-slate-100 text-slate-600'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Aplicação SIGER:</strong> Viaturas administrativas, transporte de pessoal e ambulâncias de rodovia.
                </span>
              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* PERFIL B: A/T (ALL-TERRAIN) */}
            {/* ---------------------------------------------------------------- */}
            <div 
              id="tire-profile-AT"
              className={`p-4 rounded-xl border transition-all duration-300 relative flex flex-col justify-between ${
                isCurrentHighlighted('AT')
                  ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.01] animate-pulse border-emerald-500'
                  : isDark ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    A/T • ALL-TERRAIN
                  </span>
                  <span className="text-[9.5px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-2xs">
                    PADRÃO RECOMENDADO
                  </span>
                </div>

                <h5 className={`font-mono font-bold text-xs uppercase ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  O Modelo Coringa para Uso Misto Operacional
                </h5>

                {/* Barra Gráfica de Proporção de Terreno */}
                <div className="my-2.5">
                  <div className="flex justify-between text-[9.5px] font-mono font-bold mb-1">
                    <span className="text-emerald-500">50% Asfalto</span>
                    <span className="text-emerald-600">50% Terra / Misto</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-zinc-800 shadow-inner">
                    <div className="bg-emerald-600 h-full transition-all duration-500" style={{ width: '50%' }} />
                    <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: '50%' }} />
                  </div>
                </div>

                <p className={`text-[11px] leading-relaxed mb-2.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Banda reforçada com blocos espaçados e sulcos profundos. Resistente a lacerações, cortes por pedras e furos. Mantém dirigibilidade segura no asfalto com tração eficiente em terra batida, cascalho e lama leve.
                </p>
              </div>

              <div className={`mt-2 pt-2 border-t text-[10px] font-mono flex items-start gap-1.5 ${
                isDark ? 'border-zinc-800 text-slate-400' : 'border-slate-100 text-slate-600'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Aplicação SIGER:</strong> Caminhonetes 4x4 de ronda perimetral, patrulha de mina e ambulâncias industriais.
                </span>
              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* PERFIL C: R/T (RUGGED TERRAIN) */}
            {/* ---------------------------------------------------------------- */}
            <div 
              id="tire-profile-RT"
              className={`p-4 rounded-xl border transition-all duration-300 relative flex flex-col justify-between ${
                isCurrentHighlighted('RT')
                  ? 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/20 scale-[1.01] animate-pulse border-amber-500'
                  : isDark ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                    R/T • RUGGED TERRAIN
                  </span>
                  <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <Compass className="w-3 h-3 text-amber-500" /> Trilha Severa
                  </span>
                </div>

                <h5 className={`font-mono font-bold text-xs uppercase ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  Robustez de M/T com Dirigibilidade de A/T
                </h5>

                {/* Barra Gráfica de Proporção de Terreno */}
                <div className="my-2.5">
                  <div className="flex justify-between text-[9.5px] font-mono font-bold mb-1">
                    <span className="text-amber-600">35% Asfalto</span>
                    <span className="text-amber-500">65% Terreno Severo / Pedregoso</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-zinc-800 shadow-inner">
                    <div className="bg-amber-600 h-full transition-all duration-500" style={{ width: '35%' }} />
                    <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: '65%' }} />
                  </div>
                </div>

                <p className={`text-[11px] leading-relaxed mb-2.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Combina a carcaça de 3 lonas reforçadas dos pneus de lama com sulcos angulados que minimizam a ressonância no pavimento. Desenho agressivo nas laterais para autolimpeza de pedras e prevenção de rasgos.
                </p>
              </div>

              <div className={`mt-2 pt-2 border-t text-[10px] font-mono flex items-start gap-1.5 ${
                isDark ? 'border-zinc-800 text-slate-400' : 'border-slate-100 text-slate-600'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Aplicação SIGER:</strong> Viaturas de intervenção rápida que operam em frentes de lavra e acessos rochosos.
                </span>
              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* PERFIL D: M/T (MUD-TERRAIN) */}
            {/* ---------------------------------------------------------------- */}
            <div 
              id="tire-profile-MT"
              className={`p-4 rounded-xl border transition-all duration-300 relative flex flex-col justify-between ${
                isCurrentHighlighted('MT')
                  ? 'ring-2 ring-red-500 shadow-lg shadow-red-500/20 scale-[1.01] animate-pulse border-red-500'
                  : isDark ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full border bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30">
                    M/T • MUD-TERRAIN
                  </span>
                  <span className="text-[9.5px] font-mono font-black px-2 py-0.5 rounded-full bg-red-600/20 text-red-500 border border-red-500/40">
                    OFF-ROAD EXTREMO
                  </span>
                </div>

                <h5 className={`font-mono font-bold text-xs uppercase ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  Tração Máxima em Lama, Areia & Pântano
                </h5>

                {/* Barra Gráfica de Proporção de Terreno */}
                <div className="my-2.5">
                  <div className="flex justify-between text-[9.5px] font-mono font-bold mb-1">
                    <span className="text-red-600">20% Asfalto</span>
                    <span className="text-red-500">80% Lama Pesada / Solo Fofo</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-zinc-800 shadow-inner">
                    <div className="bg-red-800 h-full transition-all duration-500" style={{ width: '20%' }} />
                    <div className="bg-red-500 h-full transition-all duration-500" style={{ width: '80%' }} />
                  </div>
                </div>

                <p className={`text-[11px] leading-relaxed mb-2.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Blocos massivos e espaçados para ejeção instantânea de barro espesso. Não acumula terra.
                  <span className="block mt-1 text-[10px] text-red-400 font-mono font-bold">
                    ⚠️ Advertência: Gera alto ruído em asfalto, vibração e desgaste rápido se rodar contínuo no pavimento.
                  </span>
                </p>
              </div>

              <div className={`mt-2 pt-2 border-t text-[10px] font-mono flex items-start gap-1.5 ${
                isDark ? 'border-zinc-800 text-slate-400' : 'border-slate-100 text-slate-600'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Aplicação SIGER:</strong> Viaturas de combate florestal, resgate em mata fechada e atoleiros sazonais.
                </span>
              </div>
            </div>

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
    </div>
  );
};

export default TireTypesGuideCard;
