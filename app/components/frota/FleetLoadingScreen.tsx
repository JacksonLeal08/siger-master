'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Cpu,
  Radio,
  Fuel,
  ShieldCheck,
  Disc,
  Volume2,
  VolumeX,
  FastForward,
  Satellite,
  BatteryCharging,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { engineAudioEngine } from '@/src/utils/engineAudioEngine';

export interface FleetLoadingScreenProps {
  contratoNome?: string;
  onComplete?: () => void;
  autoStart?: boolean;
  minDurationMs?: number;
  skipable?: boolean;
  theme?: 'light' | 'dark';
}

interface StepMessage {
  pctRange: [number, number];
  tag: string;
  mensagem: string;
  subtexto: string;
  icone: React.ComponentType<{ className?: string }>;
  statusColor: string;
}

const ETAPAS_IGNICAO: StepMessage[] = [
  {
    pctRange: [0, 24],
    tag: 'IGNIÇÃO',
    mensagem: 'Inicializando barramento CAN e telemetria de bordo...',
    subtexto: 'Varredura de atuadores, módulo ECM e sensores de injeção',
    icone: Cpu,
    statusColor: 'text-amber-500 border-amber-500/40 bg-amber-500/10',
  },
  {
    pctRange: [25, 49],
    tag: 'CONEXÃO',
    mensagem: 'Sincronizando frota ativa e viaturas de emergência...',
    subtexto: 'Verificação de licenças, seguros e prefixos operacionais',
    icone: Radio,
    statusColor: 'text-cyan-500 border-cyan-500/40 bg-cyan-500/10',
  },
  {
    pctRange: [50, 74],
    tag: 'METROLOGIA',
    mensagem: 'Buscando postos homologados e preços em tempo real...',
    subtexto: 'Cálculo de variação econômica e ranking regional de Diesel S10',
    icone: Fuel,
    statusColor: 'text-blue-500 border-blue-500/40 bg-blue-500/10',
  },
  {
    pctRange: [75, 94],
    tag: 'SEGURANÇA',
    mensagem: 'Auditando ciclos de calibração de pneus e índice TWI...',
    subtexto: 'Conferência da janela de 15 dias e sulcos mínimos legais NBR/CONTRAN',
    icone: Disc,
    statusColor: 'text-rose-500 border-rose-500/40 bg-rose-500/10',
  },
  {
    pctRange: [95, 100],
    tag: 'PRONTO',
    mensagem: 'Terminal operacional de abastecimento liberado com sucesso!',
    subtexto: 'Sessão segura autorizada para condutores e socorristas',
    icone: ShieldCheck,
    statusColor: 'text-emerald-500 border-emerald-500/40 bg-emerald-500/10',
  },
];

export const FleetLoadingScreen: React.FC<FleetLoadingScreenProps> = ({
  contratoNome = 'SALOBO',
  onComplete,
  autoStart = true,
  minDurationMs = 2800,
  skipable = true,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [progress, setProgress] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => engineAudioEngine.isMuted());
  const [isCompleted, setIsCompleted] = useState(false);

  const toggleMute = () => {
    const nextMute = !isAudioMuted;
    setIsAudioMuted(nextMute);
    engineAudioEngine.setMuted(nextMute);
  };

  useEffect(() => {
    if (!autoStart) return;

    // Inicia o motor sonoro de aceleração
    engineAudioEngine.start();

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const linearPct = Math.min(elapsed / minDurationMs, 1);

      // Curva suave de aceleração veicular (ease-in-out)
      const easedPct =
        linearPct < 0.5
          ? 2 * linearPct * linearPct
          : 1 - Math.pow(-2 * linearPct + 2, 2) / 2;

      const currentVal = Math.floor(easedPct * 100);
      setProgress(currentVal);

      // Atualiza o motor sonoro Web Audio API modulando a rotação de RPM
      engineAudioEngine.updateProgress(currentVal);

      if (linearPct < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setProgress(100);
        setIsCompleted(true);
        // Desaceleração suave ao atingir 100%
        engineAudioEngine.stop(0.35);
        setTimeout(() => {
          onComplete?.();
        }, 600);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animationFrameId);
      engineAudioEngine.stop(0.1);
    };
  }, [autoStart, minDurationMs, onComplete]);

  const currentStep = useMemo(() => {
    return (
      ETAPAS_IGNICAO.find(
        (etapa) => progress >= etapa.pctRange[0] && progress <= etapa.pctRange[1]
      ) || ETAPAS_IGNICAO[0]
    );
  }, [progress]);

  const radius = 100;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (240 / 360);
  const progressOffset = arcLength - (progress / 100) * arcLength;

  const ticks = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => {
      const angle = -120 + i * 10;
      const isMajor = i % 4 === 0;
      return { angle, isMajor, index: i };
    });
  }, []);

  const handleSkip = () => {
    setProgress(100);
    setIsCompleted(true);
    engineAudioEngine.stop(0.2);
    setTimeout(() => onComplete?.(), 200);
  };

  const IconeEtapa = currentStep.icone;

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col justify-between font-sans select-none overflow-hidden pb-safe pt-safe transition-colors duration-300 ${
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Background Bitemático */}
      {isDark ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/30 via-zinc-950 to-black pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200 via-slate-100 to-slate-200 pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
        </>
      )}

      {/* Header do Cluster */}
      <header className={`relative z-10 flex items-center justify-between px-6 py-4 border-b backdrop-blur-md transition-colors ${
        isDark ? 'border-zinc-900/80 bg-zinc-950/70' : 'border-slate-200 bg-white/80'
      }`}>
        <div className="flex items-center gap-3">
          <img 
            src="/assets/branding/logo-jimmp-info.png" 
            alt="JIMMP Info" 
            className="h-8 sm:h-9 w-auto object-contain drop-shadow-[0_0_8px_rgba(104,211,70,0.4)]" 
          />
          <div className="h-6 w-[1.5px] bg-zinc-700/60 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-widest uppercase text-[#B7F365]">
                SIGER // FLEET CLUSTER
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold border ${
                isDark ? 'bg-[#282A2F] border-[#3C3F45] text-zinc-300' : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}>
                SITE: {contratoNome}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#1C4E26]/40 text-[#B7F365] border border-[#68D346]/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#68D346] animate-pulse" />
                CAN ONLINE
              </span>
            </div>
            <p className={`text-[10px] tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              TERMINAL ELETRÔNICO DE CAMPO • JIMMP INFO
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Som Realista do Motor */}
          <button
            type="button"
            onClick={toggleMute}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark 
                ? 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200' 
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900 shadow-xs'
            }`}
            title={isAudioMuted ? 'Ativar Som Realista do Motor (Web Audio API)' : 'Silenciar Motor'}
          >
            {isAudioMuted ? (
              <VolumeX className="w-4 h-4 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#68D346] animate-pulse" />
            )}
          </button>

          {skipable && !isCompleted && (
            <button
              type="button"
              onClick={handleSkip}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-950 shadow-xs'
              }`}
            >
              <span>Pular</span>
              <FastForward className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Mostrador Central (Velocímetro / Can Gauge) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
          {/* Marca d'água técnica do símbolo JIMMP centralizada */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
            <img 
              src="/assets/branding/logo-jimmp-info.png" 
              alt="Marca d'água JIMMP" 
              className="w-36 h-36 object-contain filter grayscale contrast-125"
            />
          </div>

          {/* Ticks Perimetrais */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {ticks.map(({ angle, isMajor, index }) => (
              <div
                key={index}
                className="absolute w-full h-full flex justify-center items-start"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <div
                  className={`rounded-full transition-colors duration-300 ${
                    progress >= (index / 24) * 100
                      ? 'bg-[#68D346] shadow-[0_0_8px_rgba(104,211,70,0.85)]'
                      : isDark ? 'bg-zinc-800' : 'bg-slate-300'
                  } ${isMajor ? 'h-3.5 w-1' : 'h-2 w-0.5'}`}
                />
              </div>
            ))}
          </div>

          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7E8289" />
                <stop offset="60%" stopColor="#68D346" />
                <stop offset="100%" stopColor="#B7F365" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Trilha do Mostrador */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke={isDark ? '#27272a' : '#cbd5e1'}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              className="origin-center transform rotate-[150deg]"
            />

            {/* Arco Ativo com Brilho em Gradiente Metálico-Neon */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              filter="url(#glow)"
              className="origin-center transform rotate-[150deg] transition-all duration-100 ease-out"
            />
          </svg>

          {/* Dados Centrais */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-[11px] font-mono tracking-widest uppercase ${
              isDark ? 'text-zinc-500' : 'text-slate-400'
            }`}>
              RPM / TELEMETRIA
            </span>

            <div className="flex items-baseline justify-center">
              <span className={`text-6xl sm:text-7xl font-black font-mono tracking-tighter drop-shadow-md ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {progress}
              </span>
              <span className="text-2xl font-black text-[#68D346] font-mono ml-1">%</span>
            </div>

            <div className="flex items-center gap-1 mt-1">
              <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>0</span>
              <div className={`w-20 h-1.5 rounded-full overflow-hidden border p-0.5 ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-200 border-slate-300'
              }`}>
                <div
                  className="h-full bg-gradient-to-r from-[#7E8289] via-[#68D346] to-[#B7F365] rounded-full transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>MAX</span>
            </div>
          </div>
        </div>

        {/* Caixas de Telemetria de Bordo */}
        <div className={`flex items-center gap-5 sm:gap-7 mt-4 px-5 py-2.5 rounded-2xl border backdrop-blur-md shadow-lg ${
          isDark ? 'bg-zinc-900/60 border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-300 text-slate-900 shadow-slate-200/60'
        }`}>
          <div className="flex flex-col items-center gap-1" title="Injeção Eletrônica / ECM">
            <Cpu className={`w-4 h-4 transition-all duration-300 ${progress < 30 ? 'text-zinc-400' : 'text-[#68D346] animate-pulse drop-shadow-[0_0_8px_rgba(104,211,70,0.8)]'}`} />
            <span className="text-[9px] font-mono font-bold opacity-75">ECM</span>
          </div>

          <div className="flex flex-col items-center gap-1" title="Tensão de Carga 14.2V">
            <BatteryCharging className={`w-4 h-4 transition-all duration-300 ${progress < 50 ? 'text-zinc-400' : 'text-[#68D346] drop-shadow-[0_0_8px_rgba(104,211,70,0.8)]'}`} />
            <span className="text-[9px] font-mono font-bold opacity-75">14.2V</span>
          </div>

          <div className="flex flex-col items-center gap-1" title="Sistema TPMS / TWI">
            <Disc className={`w-4 h-4 transition-all duration-300 ${progress < 80 ? 'text-zinc-400' : 'text-[#68D346] animate-bounce drop-shadow-[0_0_8px_rgba(104,211,70,0.8)]'}`} />
            <span className="text-[9px] font-mono font-bold opacity-75">TPMS</span>
          </div>

          <div className="flex flex-col items-center gap-1" title="Telemetria de Posicionamento">
            <Satellite className={`w-4 h-4 transition-all duration-300 ${progress < 70 ? 'text-zinc-400' : 'text-[#B7F365] drop-shadow-[0_0_8px_rgba(183,243,101,0.8)]'}`} />
            <span className="text-[9px] font-mono font-bold opacity-75">GPS</span>
          </div>

          <div className="flex flex-col items-center gap-1" title="Estado Operacional">
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-[#B7F365] animate-pulse" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            <span className="text-[9px] font-mono font-bold opacity-75">READY</span>
          </div>
        </div>
      </main>

      {/* Rodapé com Card Informativo de Status */}
      <footer className={`relative z-10 px-6 py-6 border-t backdrop-blur-xl transition-colors ${
        isDark ? 'border-zinc-900/80 bg-zinc-950/80' : 'border-slate-200 bg-white/90'
      }`}>
        <div className="max-w-md mx-auto space-y-3">
          <div className={`p-4 rounded-2xl border shadow-xl transition-all duration-300 ${
            isDark ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${currentStep.statusColor}`}
                >
                  <IconeEtapa className="w-3 h-3" />
                  {currentStep.tag}
                </span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  PASSO {ETAPAS_IGNICAO.findIndex((e) => e.tag === currentStep.tag) + 1} DE 5
                </span>
              </div>
              <span className={`text-xs font-mono font-bold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                {progress}%
              </span>
            </div>

            <p className={`text-sm font-semibold tracking-tight leading-snug ${
              isDark ? 'text-zinc-100' : 'text-slate-900'
            }`}>
              {currentStep.mensagem}
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-red-500 animate-pulse" />
            </p>

            <p className={`text-xs mt-1 font-mono leading-relaxed truncate ${
              isDark ? 'text-zinc-500' : 'text-slate-500'
            }`}>
              {currentStep.subtexto}
            </p>
          </div>

          <div className={`flex items-center justify-between text-[11px] font-mono px-1 ${
            isDark ? 'text-zinc-600' : 'text-slate-500'
          }`}>
            <span>&copy; SPCI FROTA MASTER 2026</span>
            <span>STATUS: {isCompleted ? 'ONLINE' : 'BOOTING...'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
