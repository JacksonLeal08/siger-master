'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X, 
  UserCheck, 
  Clock 
} from 'lucide-react';

export type ActionToastType = 'success' | 'warning' | 'critical' | 'info';

export interface ActionToastNotificationProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: ActionToastType;
  operadorNome?: string | null;
  operadorEmail?: string | null;
  timestamp?: string | null;
  durationMs?: number;
  onClose: () => void;
}

export const ActionToastNotification: React.FC<ActionToastNotificationProps> = ({
  isOpen,
  title,
  message,
  type = 'success',
  operadorNome,
  operadorEmail,
  timestamp,
  durationMs = 4500,
  onClose
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(durationMs);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const dataHoraFormal = timestamp || new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const nomeExibicao = operadorNome || 'Jackson Leal';
  const emailExibicao = operadorEmail || 'jackson602@gmail.com';

  // Configuração de temporizador e contagem regressiva linear
  useEffect(() => {
    if (!isOpen) {
      setProgress(100);
      remainingTimeRef.current = durationMs;
      return;
    }

    remainingTimeRef.current = durationMs;
    startTimeRef.current = Date.now();
    setProgress(100);

    const stepMs = 30;

    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, remainingTimeRef.current - elapsed);
        const nextPct = Math.max(0, (remaining / durationMs) * 100);
        setProgress(nextPct);

        if (remaining <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onClose();
        }
      }
    }, stepMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, durationMs, onClose]);

  // Pausa ao passar o mouse
  const handleMouseEnter = () => {
    setIsPaused(true);
    const elapsedSinceStart = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsedSinceStart);
  };

  const handleMouseLeave = () => {
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  // Configurações visuais por tipo
  const getTheme = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle2,
          iconClass: 'text-emerald-400',
          pillBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          badgeText: 'CONCLUÍDO COM SUCESSO',
          shimmerGradient: 'from-emerald-500 via-teal-400 to-emerald-600'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconClass: 'text-amber-400',
          pillBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          badgeText: 'ATENÇÃO OPERACIONAL',
          shimmerGradient: 'from-amber-500 via-yellow-400 to-orange-500'
        };
      case 'critical':
        return {
          icon: AlertCircle,
          iconClass: 'text-red-400',
          pillBg: 'bg-red-500/10 border-red-500/30 text-red-400',
          badgeText: 'REGISTRO CRÍTICO / ALERTA',
          shimmerGradient: 'from-red-600 via-rose-500 to-amber-500'
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconClass: 'text-blue-400',
          pillBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          badgeText: 'SISTEMA // NOTIFICAÇÃO',
          shimmerGradient: 'from-blue-600 via-indigo-400 to-cyan-500'
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[9999] max-w-md w-auto sm:w-full pointer-events-none"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="pointer-events-auto relative overflow-hidden rounded-2xl bg-zinc-950/95 border border-zinc-800 text-zinc-100 shadow-2xl backdrop-blur-xl p-4 sm:p-4.5 select-none"
          >
            {/* Cabeçalho do Toast */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${theme.pillBg} shadow-inner`}
                >
                  <IconComponent className={`w-5 h-5 ${theme.iconClass}`} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                      {theme.badgeText}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-white tracking-wide mt-0.5 font-sans">
                    {title}
                  </h4>
                </div>
              </div>

              {/* Botão de Fechar Rápido */}
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800/80 transition-colors cursor-pointer"
                title="Fechar notificação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mensagem Descritiva da Operação */}
            <div className="mt-2 text-xs text-zinc-300 font-sans leading-relaxed pl-12 pr-2">
              {message}
            </div>

            {/* Selo de Formalização e Auditoria */}
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] font-mono text-zinc-400 pl-1">
              <div className="flex items-center gap-1.5 truncate">
                <UserCheck className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="truncate">
                  Operador: <strong className="text-zinc-200 font-bold">{nomeExibicao}</strong> ({emailExibicao})
                </span>
              </div>
              <div className="flex items-center gap-1 text-zinc-500 shrink-0">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>{dataHoraFormal}</span>
              </div>
            </div>

            {/* Barra de Progresso Regressiva com Efeito Ondulado (Wave Progress) */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 w-full bg-zinc-900 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${theme.shimmerGradient} animate-[shimmer_2s_infinite] transition-all duration-75`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ActionToastNotification;
