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

export interface FleetLoadingScreenProps {
  contratoNome?: string;
  onComplete?: () => void;
  autoStart?: boolean;
  minDurationMs?: number;
  skipable?: boolean;
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
    statusColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  },
  {
    pctRange: [25, 49],
    tag: 'CONEXÃO',
    mensagem: 'Sincronizando frota ativa e viaturas de emergência...',
    subtexto: 'Verificação de licenças, seguros e prefixos operacionais',
    icone: Radio,
    statusColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
  },
  {
    pctRange: [50, 74],
    tag: 'METROLOGIA',
    mensagem: 'Buscando postos homologados e preços em tempo real...',
    subtexto: 'Cálculo de variação econômica e ranking regional de Diesel S10',
    icone: Fuel,
    statusColor: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
  },
  {
    pctRange: [75, 94],
    tag: 'SEGURANÇA',
    mensagem: 'Auditando ciclos de calibração de pneus e índice TWI...',
    subtexto: 'Conferência da janela de 15 dias e sulcos mínimos legais NBR/CONTRAN',
    icone: Disc,
    statusColor: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
  },
  {
    pctRange: [95, 100],
    tag: 'PRONTO',
    mensagem: 'Terminal operacional de abastecimento liberado com sucesso!',
    subtexto: 'Sessão segura autorizada para condutores e socorristas',
    icone: ShieldCheck,
    statusColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  },
];

export const FleetLoadingScreen: React.FC<FleetLoadingScreenProps> = ({
  contratoNome = 'SALOBO',
  onComplete,
  autoStart = true,
  minDurationMs = 2800,
  skipable = true,
}) => {
  const [progress, setProgress] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = (freq: number, type: OscillatorType = 'sine', duration = 0.08) => {
    if (isAudioMuted || typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio fallback
    }
  };

  useEffect(() => {
    if (!autoStart) return;

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const linearPct = Math.min(elapsed / minDurationMs, 1);

      const easedPct =
        linearPct < 0.5
          ? 2 * linearPct * linearPct
          : 1 - Math.pow(-2 * linearPct + 2, 2) / 2;

      const currentVal = Math.floor(easedPct * 100);
      setProgress(currentVal);

      if (currentVal === 25 || currentVal === 50 || currentVal === 75) {
        playBeep(440, 'triangle', 0.05);
      }

      if (linearPct < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setProgress(100);
        setIsCompleted(true);
        playBeep(880, 'sine', 0.18);
        setTimeout(() => {
          onComplete?.();
        }, 600);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
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
    playBeep(880, 'sine', 0.15);
    setTimeout(() => onComplete?.(), 200);
  };

  const IconeEtapa = currentStep.icone;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-between bg-zinc-950 text-zinc-100 font-sans select-none overflow-hidden pb-safe pt-safe">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/30 via-zinc-950 to-black pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-900/80 bg-zinc-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-widest uppercase text-red-500">
                SPCI // FLEET CLUSTER
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-300">
                SITE: {contratoNome}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 tracking-wider">
              TERMINAL ELETRÔNICO DE CAMPO V2.11
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={isAudioMuted ? 'Ativar Áudio de Telemetria' : 'Silenciar'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {skipable && !isCompleted && (
            <button
              type="button"
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-all active:scale-95"
            >
              <span>Pular</span>
              <FastForward className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
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
                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                      : 'bg-zinc-800'
                  } ${isMajor ? 'h-3.5 w-1' : 'h-2 w-0.5'}`}
                />
              </div>
            ))}
          </div>

          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="60%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="#27272a"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              className="origin-center transform rotate-[150deg]"
            />

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

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase">
              TELEMETRIA CAN
            </span>

            <div className="flex items-baseline justify-center">
              <span className="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                {progress}
              </span>
              <span className="text-2xl font-black text-red-500 font-mono ml-1">%</span>
            </div>

            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] font-mono text-zinc-400">0</span>
              <div className="w-20 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-zinc-400">MAX</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5 sm:gap-7 mt-4 px-5 py-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
          <div className="flex flex-col items-center gap-1" title="Injeção Eletrônica / ECM">
            <Cpu className={`w-4 h-4 transition-all duration-300 ${progress < 30 ? 'text-zinc-700' : 'text-amber-500 animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'}`} />
            <span className="text-[9px] font-mono text-zinc-600 font-bold">ECM</span>
          </div>

          <div className="flex flex-col items-center gap-1" title="Tensão de Carga 14.2V">
            <BatteryCharging className={`w-4 h-4 transition-all duration-300 ${progress < 50 ? 'text-red-500' : 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`} />
            <span className="text-[9px] font-mono text-zinc-600 font-bold">14.2V</span>
          </div>

          <div className="flex flex-col items-center gap-1" title="Sistema TPMS / TWI">
            <Disc className={`w-4 h-4 transition-all duration-300 ${progress < 80 ? 'text-zinc-700' : 'text-emerald-500 animate-bounce drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`} />
            <span className="text-[9px] font-mono text-zinc-600 font-bold">TPMS</span>
          </div>

          <div className="flex flex-col items-center gap-1" title="Telemetria de Posicionamento">
            <Satellite className={`w-4 h-4 transition-all duration-300 ${progress < 70 ? 'text-zinc-700' : 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'}`} />
            <span className="text-[9px] font-mono text-zinc-600 font-bold">GPS</span>
          </div>

          <div className="flex flex-col items-center gap-1" title="Estado Operacional">
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-zinc-700" />
            )}
            <span className="text-[9px] font-mono text-zinc-600 font-bold">READY</span>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 py-6 border-t border-zinc-900/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-md mx-auto space-y-3">
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${currentStep.statusColor}`}
                >
                  <IconeEtapa className="w-3 h-3" />
                  {currentStep.tag}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  PASSO {ETAPAS_IGNICAO.findIndex((e) => e.tag === currentStep.tag) + 1} DE 5
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-zinc-400">
                {progress}%
              </span>
            </div>

            <p className="text-sm font-semibold text-zinc-100 tracking-tight leading-snug">
              {currentStep.mensagem}
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-red-500 animate-pulse" />
            </p>

            <p className="text-xs text-zinc-500 mt-1 font-mono leading-relaxed truncate">
              {currentStep.subtexto}
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-600 font-mono px-1">
            <span>&copy; SPCI FROTA MASTER 2026</span>
            <span>STATUS: {isCompleted ? 'ONLINE' : 'BOOTING...'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
