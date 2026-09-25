'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { PillarData } from '@/app/data/pillarsData';
import { 
  Flame, 
  Truck, 
  Radio, 
  HeartPulse, 
  ArrowUpRight, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface PillarCard3DProps {
  pillar: PillarData;
  onOpenDetail: (pillar: PillarData) => void;
}

export default function PillarCard3D({ pillar, onOpenDetail }: PillarCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.4s ease-out, box-shadow 0.4s ease-out',
  });

  const [showTooltip, setShowTooltip] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detecta se é dispositivo de toque para priorizar acionamento imediato
  useEffect(() => {
    if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      setIsTouchDevice(true);
    }
  }, []);

  // Cálculo matemático dinâmico de coordenadas do cursor (Micro-tilt 3D)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Fórmulas requeridas:
    // rotX = ((y - centerY) / height) * -12 deg
    // rotY = ((x - centerX) / width) * 12 deg
    const rotX = ((y - centerY) / rect.height) * -12;
    const rotY = ((x - centerX) / rect.width) * 12;

    // Sombreamento dinâmico deslocado na direção oposta ao cursor
    const shadowX = -rotY * 1.5;
    const shadowY = rotX * 1.5;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`,
      boxShadow: `${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px 30px rgba(0, 0, 0, 0.35), 0 0 25px rgba(104, 211, 70, 0.25)`,
      transition: 'transform 0.05s ease-out, box-shadow 0.05s ease-out',
      willChange: 'transform, box-shadow',
    });
  }, [isTouchDevice]);

  const handleMouseEnter = useCallback(() => {
    if (isTouchDevice) return;
    // Debounce de 300ms para disparar o tooltip inteligente sem flicker
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 300);
  }, [isTouchDevice]);

  const handleMouseLeave = useCallback(() => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setShowTooltip(false);
    // Retorno suave ao plano original em 0.4s
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.4s ease-out, box-shadow 0.4s ease-out',
    });
  }, []);

  const handleClick = () => {
    onOpenDetail(pillar);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenDetail(pillar);
    }
  };

  // Ícone característico de cada pilar
  const renderIcon = () => {
    switch (pillar.id) {
      case 'spci':
        return <Flame className="w-7 h-7 text-amber-500 dark:text-amber-400" />;
      case 'frota':
        return <Truck className="w-7 h-7 text-sky-500 dark:text-sky-400" />;
      case 'cecom':
        return <Radio className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />;
      case 'aph':
        return <HeartPulse className="w-7 h-7 text-rose-500 dark:text-rose-400" />;
      default:
        return <ShieldCheck className="w-7 h-7 text-[#68D346]" />;
    }
  };

  return (
    <div className="relative group/card select-none">
      {/* TOOLTIP FLUTUANTE RESUMO (HOVER PREVIEW) */}
      <div
        className={`absolute -top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-200 ease-out hidden sm:block ${
          showTooltip
            ? 'opacity-100 -translate-y-1 scale-100'
            : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
        }`}
        role="tooltip"
        aria-hidden={!showTooltip}
      >
        <div className="relative bg-zinc-950/95 border border-zinc-700/80 rounded-xl px-3.5 py-2 shadow-2xl backdrop-blur-md whitespace-nowrap flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-[#68D346] animate-pulse shrink-0" />
          <span className="text-[11px] font-mono text-zinc-200 font-medium">
            {pillar.tooltipText}
          </span>
          {/* Caret / Seta apontando para o centro do card */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-950 border-r border-b border-zinc-700/80 rotate-45" />
        </div>
      </div>

      {/* CARD 3D PRINCIPAL COM INCLINAÇÃO MATEMÁTICA */}
      <div
        ref={cardRef}
        style={tiltStyle}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Ver detalhes completos do pilar ${pillar.title}`}
        className="cursor-pointer bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-[#2D3036] hover:border-[#68D346]/80 rounded-3xl p-7 sm:p-8 relative overflow-hidden flex flex-col justify-between text-left h-full transition-colors duration-300 focus:outline-hidden focus:ring-2 focus:ring-[#68D346]"
      >
        {/* Ambient Glow Perimetral no Interior */}
        <div 
          className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 group-hover/card:opacity-40 transition-opacity duration-500"
          style={{ backgroundColor: pillar.accentColor }}
        />

        {/* Topo do Card */}
        <div className="space-y-5 relative z-10">
          <div className="flex items-center justify-between">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-center shadow-inner group-hover/card:scale-105 transition-transform duration-300">
              {renderIcon()}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[10px] font-bold font-mono text-[#68D346]">
                {pillar.pillarNumber}
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center text-slate-400 group-hover/card:text-[#68D346] group-hover/card:bg-[#1C4E26]/40 transition-all">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400 block font-mono">
              {pillar.subtitle}
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wide font-['Hanken_Grotesk'] leading-tight">
              {pillar.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
              {pillar.highlight}
            </p>
          </div>
        </div>

        {/* Rodapé com Badges Operacionais */}
        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono relative z-10 text-slate-500 dark:text-zinc-400">
          {pillar.badges.map((badge, idx) => (
            <span 
              key={idx} 
              className={idx === 0 ? 'font-bold text-[#68D346]' : ''}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Efeito sutil de reflexo especular na borda (Cyber Titânio) */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#D5D9DC]/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
      </div>
    </div>
  );
}
