'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useWindowModal } from '@/app/context/WindowModalContext';
import {
  Minus,
  Maximize2,
  Minimize2,
  X,
  ShieldCheck,
  Flame,
  Truck,
  Radio,
  HeartPulse,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Lock,
  Compass,
  CheckCircle2,
  Clock,
  RadioTower,
  Eye,
  GitMerge,
  Activity,
  FileCheck2
} from 'lucide-react';

interface SystemOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
}

export default function SystemOverviewModal({
  isOpen,
  onClose,
  onMinimize
}: SystemOverviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const { registerWindow, minimizeWindow, closeWindow } = useWindowModal();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloqueio de rolagem do body e listener para ESC
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Minimizar para a barra executiva do Dock
  const handleMinimize = useCallback(() => {
    const windowId = 'system-overview-siger';

    registerWindow(windowId, {
      title: '🏛️ Institucional: SIGER Master',
      subtitle: 'Sistema Integrado de Gestão de Emergência e Resposta',
      iconName: 'shield',
      badgeStatus: 'Visão Geral',
      onRestore: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('siger:restore_system_overview'));
        }
      },
      onClose: () => {
        onClose();
      }
    });

    minimizeWindow(windowId);
    if (onMinimize) {
      onMinimize();
    }
    onClose();
  }, [registerWindow, minimizeWindow, onMinimize, onClose]);

  // Fechamento definitivo
  const handleClose = useCallback(() => {
    closeWindow('system-overview-siger');
    onClose();
  }, [closeWindow, onClose]);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto font-mono select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      aria-modal="true"
      role="dialog"
      aria-label="Apresentação Institucional do Sistema SIGER Master"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col transition-all duration-300 relative overflow-hidden ${
          isMaximized
            ? 'w-screen h-screen inset-0 rounded-none max-h-screen p-4 sm:p-8'
            : 'max-w-4xl w-full max-h-[88vh] rounded-3xl p-5 sm:p-8'
        }`}
      >
        {/* Glow de Iluminação Superior Temático (Verde Neon Cyber) */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[110px] pointer-events-none bg-[#68D346] opacity-15 dark:opacity-20" />

        {/* 1. CABEÇALHO EXECUTIVO COM CONTROLES DE JANELA */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-zinc-800/90 relative z-10 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1C4E26] to-[#246831] border border-[#68D346]/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(104,211,70,0.25)] text-[#B7F365]">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-[#1C4E26] dark:text-[#68D346] tracking-widest font-mono">
                  ARQUITETURA OFICIAL // JIMMP INFO
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#68D346] animate-pulse" />
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-mono hidden sm:inline">
                  VISÃO GERAL DO ECOSSISTEMA
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight font-['Hanken_Grotesk'] leading-tight mt-0.5">
                SIGER • Sistema Integrado de Gestão de Emergência e Resposta
              </h2>
            </div>
          </div>

          {/* CONTROLES DE JANELA (MINIMIZAR, MAXIMIZAR, FECHAR) */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800/90 rounded-2xl p-1 shadow-inner">
            <button
              type="button"
              onClick={handleMinimize}
              className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 transition cursor-pointer border-none bg-transparent"
              title="Minimizar para o Dock [ _ ]"
              aria-label="Minimizar para o Dock"
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 transition cursor-pointer border-none bg-transparent"
              title={isMaximized ? "Restaurar tamanho padrão" : "Maximizar em tela cheia"}
              aria-label={isMaximized ? "Restaurar" : "Maximizar"}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer border-none bg-transparent"
              title="Fechar Janela [ Esc ]"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. CORPO SCROLLÁVEL COM FICHA COMPLETA DO SISTEMA */}
        <div className="overflow-y-auto pr-1 sm:pr-2 space-y-6 pt-5 text-left text-slate-700 dark:text-zinc-300 font-sans text-xs sm:text-sm">
          
          {/* BANNER 1: NOME, SIGNIFICADO & SLOGAN */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-zinc-900/80 dark:to-zinc-900/40 border border-slate-200 dark:border-zinc-800 space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1C4E26]/20 dark:bg-[#1C4E26]/40 text-[#1C4E26] dark:text-[#68D346] border border-[#68D346]/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                IDENTIDADE DO ECOSSISTEMA
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                // PLATAFORMA DE MISSÃO CRÍTICA
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk'] tracking-wide">
                SIGER: Sistema Integrado de Gestão de Emergência e Resposta
              </h3>
              <p className="text-xs sm:text-sm font-mono font-bold text-[#1C4E26] dark:text-[#B7F365]">
                Slogan: "Comando Unificado de Prevenção, Frotas Táticas, Central CAD e Prontuário APH Vivo."
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-sans">
              O <strong>SIGER Master</strong> foi concebido para superar a gestão fragmentada de combate a incêndio e socorro médico. Integrando engenharia preventiva de ativos, telemetria metrológica de frotas 4x4, linha do tempo operacional georreferenciada e prontuário pré-hospitalar em tempo real em uma única plataforma unificada.
            </p>
          </div>

          {/* PAINEL 2: PRINCIPAIS ATRIBUIÇÕES & CONTROLES EM OPERAÇÃO */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white tracking-wider border-b border-slate-200 dark:border-zinc-800/80 pb-2">
              <Layers className="w-4 h-4 text-[#1C4E26] dark:text-[#68D346]" />
              <span>Principais Atribuições & Controles Operacionais Ativos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Atribuição 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Flame className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk']">
                    1. Engenharia de Prevenção & Ativos (SPCI)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
                  Gestão contínua de extintores, hidrantes, bombas de incêndio e abrigos com QR Code híbrido, rotinas NBR 12962/13714 e laudos periciais duplos.
                </p>
              </div>

              {/* Atribuição 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20">
                    <Truck className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk']">
                    2. Gestão de Frotas & Metrologia (Fleet OS)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
                  Prontidão de viaturas de resgate e caminhonetes 4x4. Auditoria de desgaste de pneus TWI em milímetros (CONTRAN 558/80) e telemetria antifraude.
                </p>
              </div>

              {/* Atribuição 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    <Radio className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk']">
                    3. Central de Despacho & Comando (CAD / CECOM)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
                  Mapa GIS em tempo real, acionamento tático em 1 clique com SLA &lt; 60s, cercas eletrônicas (geofencing) e cronologia imutável de eventos.
                </p>
              </div>

              {/* Atribuição 4 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk']">
                    4. Prontuário APH Clínico Vivo (ePCR)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
                  Ficha médica digital na cena da ocorrência com registro seriadode sinais vitais, protocolos PHTLS/ACLS, baixa de medicamentos e transição hospitalar.
                </p>
              </div>
            </div>
          </div>

          {/* PAINEL 3: PROPOSTAS DE MELHORIAS FUTURAS & ROADMAP EM ESTUDO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white tracking-wider">
                <Sparkles className="w-4 h-4 text-[#1C4E26] dark:text-[#68D346]" />
                <span>Roadmap Estratégico // Módulos em Estudo & Homologação</span>
              </div>
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold hidden sm:inline">
                ESTUDO & VALIDAÇÃO RIGOROSA
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans">
              Para assegurar eficiência extrema e segurança irrefutável em missões críticas, os recursos abaixo passam por baterias de ensaios laboratoriais e de campo antes da liberação em produção:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Estudo 1: IoT LoRaWAN */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RadioTower className="w-4 h-4 text-emerald-600 dark:text-[#68D346]" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk']">
                      Telemetria IoT LoRaWAN & Satelital
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[9px] font-mono font-bold">
                    Em Pesquisa
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
                  Sensores de pressão de motobombas e rastreamento de viaturas em rotas fora de cobertura celular, operando via rádio frequência privada ou satélites LEO.
                </p>
              </div>

              {/* Estudo 2: Visão Computacional de Borda */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-600 dark:text-[#68D346]" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk']">
                      Visão Computacional & IA de Borda
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/30 text-[9px] font-mono font-bold">
                    Prototipagem
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
                  Leitura automática por câmera do ponteiro de manômetros de extintores, detecção de trincas em mangueiras e classificação de corrosão em cascos sem digitação manual.
                </p>
              </div>

              {/* Estudo 3: Interoperabilidade Hospitalar HL7/FHIR */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitMerge className="w-4 h-4 text-emerald-600 dark:text-[#68D346]" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk']">
                      Interoperabilidade Hospitalar HL7/FHIR
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30 text-[9px] font-mono font-bold">
                    Homologação
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
                  Sincronização imediata da ficha ePCR da ambulância com o prontuário interno do hospital recebedor, preparando leito de UTI e equipe cirúrgica antes da chegada.
                </p>
              </div>

              {/* Estudo 4: Despacho Preditivo com Mapa de Calor */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600 dark:text-[#68D346]" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk']">
                      Despacho Preditivo por Heatmap
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[9px] font-mono font-bold">
                    Em Pesquisa
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
                  Modelos estatísticos que cruzam clima, turnos industriais e manutenções a quente para pré-posicionar viaturas nos pontos de maior vulnerabilidade térmica.
                </p>
              </div>
            </div>
          </div>

          {/* PAINEL 4: SEGURANÇA OPERACIONAL & GOVERNANÇA JURÍDICA */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800/80 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">
              <Lock className="w-4 h-4 text-[#1C4E26] dark:text-[#68D346]" />
              <span>Garantia de Segurança em Funcionamento & Integridade Pericial</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
              Cada alteração, vistoria ou intervenção gera carimbo temporal criptográfico com hash imutável e geolocalização. O sistema opera em conformidade estrita com a LGPD (Lei 13.709/18), normas ABNT NBR 12962, Resoluções CONTRAN e diretrizes do Ministério da Saúde.
            </p>
          </div>

        </div>

        {/* 3. RODAPÉ DE AÇÕES COM BOTÃO AO COCKPIT */}
        <div className="pt-5 mt-4 border-t border-slate-200 dark:border-zinc-800/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 relative z-10">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#68D346]" />
            <span>JIMMP Info • Excelência & Governança de Emergência</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Fechar
            </button>

            <Link
              href="/dashboard"
              onClick={handleClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#1C4E26] via-[#246831] to-[#1C4E26] hover:from-[#246831] hover:to-[#2e7d3d] text-white font-black text-xs uppercase tracking-wider rounded-xl border border-[#68D346]/60 shadow-[0_0_20px_rgba(104,211,70,0.35)] hover:shadow-[0_0_28px_rgba(183,243,101,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>ACESSAR COCKPIT SIGER</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#B7F365]" />
            </Link>
          </div>
        </div>

      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
