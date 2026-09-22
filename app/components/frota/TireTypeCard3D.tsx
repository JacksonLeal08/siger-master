'use client';

import React, { useState, useRef, MouseEvent } from 'react';
import { 
  Maximize2, 
  Volume2, 
  Compass, 
  ShieldCheck, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { TipoTerrenoPneu } from '@/lib/types/frota';
import { TireProfileDetail } from '@/lib/data/tireProfilesData';

interface TireTypeCard3DProps {
  profile: TireProfileDetail;
  isDark?: boolean;
  isHighlighted?: boolean;
  onOpenDetail: (tipo: TipoTerrenoPneu) => void;
}

export const TireTypeCard3D: React.FC<TireTypeCard3DProps> = ({
  profile,
  isDark = true,
  isHighlighted = false,
  onOpenDetail
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Microinteração 3D com rastreamento suave do cursor (máx ±1.5° para ergonomia visual)
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -1.5;
    const rotY = ((x - centerX) / centerX) * 1.5;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  // Cores dinâmicas e semáforos cromáticos por perfil (Blue, Emerald, Amber, Red)
  const getThemeStyles = () => {
    switch (profile.corTema) {
      case 'blue':
        return {
          pillBadge: isDark
            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
            : 'bg-blue-50 text-blue-700 border-blue-200',
          asphaltBar: 'bg-blue-600',
          offroadBar: 'bg-amber-400',
          highlightRing: 'ring-2 ring-blue-500 shadow-blue-500/20 border-blue-500',
          hoverShadow: isDark ? 'hover:shadow-blue-950/40' : 'hover:shadow-blue-200/50',
          iconColor: 'text-blue-400'
        };
      case 'emerald':
        return {
          pillBadge: isDark
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200',
          asphaltBar: 'bg-emerald-600',
          offroadBar: 'bg-emerald-400',
          highlightRing: 'ring-2 ring-emerald-500 shadow-emerald-500/20 border-emerald-500',
          hoverShadow: isDark ? 'hover:shadow-emerald-950/40' : 'hover:shadow-emerald-200/50',
          iconColor: 'text-emerald-400'
        };
      case 'amber':
        return {
          pillBadge: isDark
            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            : 'bg-amber-50 text-amber-700 border-amber-200',
          asphaltBar: 'bg-amber-600',
          offroadBar: 'bg-amber-400',
          highlightRing: 'ring-2 ring-amber-500 shadow-amber-500/20 border-amber-500',
          hoverShadow: isDark ? 'hover:shadow-amber-950/40' : 'hover:shadow-amber-200/50',
          iconColor: 'text-amber-500'
        };
      case 'red':
      default:
        return {
          pillBadge: isDark
            ? 'bg-red-500/15 text-red-400 border-red-500/30'
            : 'bg-red-50 text-red-700 border-red-200',
          asphaltBar: 'bg-red-800',
          offroadBar: 'bg-red-500',
          highlightRing: 'ring-2 ring-red-500 shadow-red-500/20 border-red-500',
          hoverShadow: isDark ? 'hover:shadow-red-950/40' : 'hover:shadow-red-200/50',
          iconColor: 'text-red-500'
        };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <div
      style={{ perspective: '1000px' }}
      className="w-full flex"
    >
      <div
        id={`tire-profile-${profile.tipo}`}
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => onOpenDetail(profile.tipo)}
        style={{
          transform: isHovered
            ? `translateY(-6px) scale(1.015) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
            : 'translateY(0) scale(1) rotateX(0deg) rotateY(0deg)',
          transition: isHovered 
            ? 'transform 0.1s ease-out, box-shadow 0.3s ease-out' 
            : 'transform 0.4s ease-out, box-shadow 0.4s ease-out'
        }}
        className={`group w-full rounded-3xl p-5 sm:p-6 backdrop-blur-md border cursor-pointer select-none relative flex flex-col justify-between active:scale-[0.98] transition-all duration-300 ease-out ${
          isDark 
            ? 'bg-zinc-900/95 border-zinc-800 border-t-white/15 text-slate-100 shadow-md shadow-black/50 hover:shadow-2xl' 
            : 'bg-white/95 border-slate-200 border-t-white/80 text-slate-800 shadow-md hover:shadow-2xl hover:shadow-slate-300/60'
        } ${themeStyles.hoverShadow} ${
          isHighlighted ? `${themeStyles.highlightRing} scale-[1.02] animate-pulse` : ''
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenDetail(profile.tipo);
          }
        }}
        aria-label={`Expandir ficha técnica do pneu ${profile.sigla} ${profile.nomeCompleto}`}
      >
        {/* ==================================================================== */}
        {/* TOPO: INDICADOR DE EXPANSÃO TÁTIL & BADGES */}
        {/* ==================================================================== */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            {/* Tag do Perfil com Sigla */}
            <span className={`text-[10.5px] font-mono font-black px-3 py-1 rounded-full border flex items-center gap-1.5 ${themeStyles.pillBadge}`}>
              <span>{profile.sigla} • {profile.nomeCompleto}</span>
            </span>

            {/* Badge Tátil de Expansão */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9.5px] font-mono font-bold transition-colors ${
              isDark 
                ? 'bg-zinc-800/80 border-zinc-700/80 text-slate-300 group-hover:text-white group-hover:border-slate-500' 
                : 'bg-slate-100 border-slate-300 text-slate-600 group-hover:text-slate-900 group-hover:border-slate-400'
            }`}>
              <Maximize2 className="w-3 h-3 text-red-500 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Toque para expandir</span>
            </div>
          </div>

          {/* Subtítulo Operacional & Status Auxiliar */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h5 className={`font-mono font-black text-xs sm:text-[13px] uppercase tracking-wide leading-snug ${
              isDark ? 'text-slate-100' : 'text-slate-950'
            }`}>
              {profile.subtitulo}
            </h5>
            
            {profile.destaqueBadge && (
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 border uppercase ${
                profile.tipo === 'AT' 
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-2xs' 
                  : profile.tipo === 'MT' 
                    ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                    : isDark ? 'bg-zinc-800 text-slate-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {profile.destaqueBadge}
              </span>
            )}
          </div>

          {/* ================================================================== */}
          {/* BARRA GRÁFICA DE PROPORÇÃO DE TERRENO */}
          {/* ================================================================== */}
          <div className="my-3">
            <div className="flex justify-between text-[10px] font-mono font-bold mb-1.5">
              <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>
                {profile.porcentagemAsfalto}% Asfalto
              </span>
              <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>
                {profile.porcentagemOffroad}% {profile.labelOffroad}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-200 dark:bg-zinc-800 shadow-inner">
              <div
                className={`${themeStyles.asphaltBar} h-full transition-all duration-700`}
                style={{ width: `${profile.porcentagemAsfalto}%` }}
              />
              <div
                className={`${themeStyles.offroadBar} h-full transition-all duration-700`}
                style={{ width: `${profile.porcentagemOffroad}%` }}
              />
            </div>
          </div>

          {/* Resumo Técnico Textual */}
          <p className={`text-[11.5px] leading-relaxed mb-2.5 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            {profile.resumoTecnico}
          </p>

          {/* Advertência Técnica (caso exista, ex: M/T) */}
          {profile.advertencia && (
            <div className={`p-2 rounded-xl border text-[10px] font-mono flex items-start gap-1.5 mb-2 ${
              isDark 
                ? 'bg-red-950/30 border-red-800/60 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <span>{profile.advertencia}</span>
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* RODAPÉ: DIRETRIZ FORMAL DE APLICAÇÃO SIGER */}
        {/* ==================================================================== */}
        <div className={`mt-3 pt-3 border-t text-[10.5px] font-mono flex items-start gap-2 ${
          isDark ? 'border-zinc-800/90 text-slate-400' : 'border-slate-200 text-slate-600'
        }`}>
          <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${themeStyles.iconColor}`} />
          <span className="leading-snug">
            <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>Aplicação SIGER:</strong> {profile.aplicacaoSiger}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TireTypeCard3D;
