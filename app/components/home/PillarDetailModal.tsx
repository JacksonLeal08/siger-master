'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion } from 'motion/react';
import { PillarData } from '@/app/data/pillarsData';
import { useWindowModal } from '@/app/context/WindowModalContext';
import {
  Minus,
  Maximize2,
  Minimize2,
  X,
  Flame,
  Truck,
  Radio,
  HeartPulse,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Database,
  FileCheck,
  Layers,
  ArrowRight,
  Lock,
  WifiOff
} from 'lucide-react';

interface PillarDetailModalProps {
  pillar: PillarData | null;
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: (pillar: PillarData) => void;
}

export default function PillarDetailModal({
  pillar,
  isOpen,
  onClose,
  onMinimize
}: PillarDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const { registerWindow, minimizeWindow, closeWindow } = useWindowModal();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloqueio do scroll do body e listener para ESC
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

  // Ação de minimizar para o dock executivo
  const handleMinimize = useCallback(() => {
    if (!pillar) return;
    const windowId = `pillar-${pillar.id}`;

    registerWindow(windowId, {
      title: `🏛️ Pilar: ${pillar.badgeTitle}`,
      subtitle: pillar.subtitle,
      iconName: pillar.iconName,
      badgeStatus: 'Normativo Ativo',
      onRestore: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('siger:restore_pillar_detail', { detail: { pillar } })
          );
        }
      },
      onClose: () => {
        onClose();
      }
    });

    minimizeWindow(windowId);
    if (onMinimize) {
      onMinimize(pillar);
    }
    onClose();
  }, [pillar, registerWindow, minimizeWindow, onMinimize, onClose]);

  // Ação de fechar definitiva
  const handleClose = useCallback(() => {
    if (pillar) {
      closeWindow(`pillar-${pillar.id}`);
    }
    onClose();
  }, [pillar, closeWindow, onClose]);

  if (!mounted || !isOpen || !pillar) return null;

  const renderIcon = () => {
    switch (pillar.id) {
      case 'spci':
        return <Flame className="w-6 h-6 text-amber-500 dark:text-amber-400" />;
      case 'frota':
        return <Truck className="w-6 h-6 text-sky-500 dark:text-sky-400" />;
      case 'cecom':
        return <Radio className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />;
      case 'aph':
        return <HeartPulse className="w-6 h-6 text-rose-500 dark:text-rose-400" />;
      default:
        return <ShieldCheck className="w-6 h-6 text-[#1C4E26] dark:text-[#68D346]" />;
    }
  };

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
      aria-label={`Ficha Técnica Completa: ${pillar.title}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col transition-all duration-300 relative overflow-hidden ${
          isMaximized
            ? 'w-screen h-screen inset-0 rounded-none max-h-screen p-4 sm:p-8'
            : 'max-w-4xl w-full max-h-[88vh] rounded-3xl p-5 sm:p-8'
        }`}
      >
        {/* Glow de Fundo Temático */}
        <div 
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[110px] pointer-events-none opacity-15 dark:opacity-20"
          style={{ backgroundColor: pillar.accentColor }}
        />

        {/* 1. CABEÇALHO EXECUTIVO COM CONTROLES DE JANELA (SIGER MASTER) */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-zinc-800/90 relative z-10 shrink-0">
          {/* Identificação do Pilar */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
              {renderIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-[#1C4E26] dark:text-[#68D346] tracking-widest font-mono">
                  {pillar.pillarNumber}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#68D346] animate-pulse" />
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-mono hidden sm:inline">
                  FICHA TÉCNICA OPERACIONAL
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight font-['Hanken_Grotesk'] leading-tight mt-0.5">
                {pillar.badgeTitle}
              </h2>
            </div>
          </div>

          {/* BARRA DE CONTROLES DE JANELA EXEC (MINIMIZAR, MAXIMIZAR, FECHAR) */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800/90 rounded-2xl p-1 shadow-inner">
            {/* Minimizar para o Dock */}
            <button
              type="button"
              onClick={handleMinimize}
              className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 transition cursor-pointer border-none bg-transparent"
              title="Minimizar para o Dock [ _ ]"
              aria-label="Minimizar para o Dock"
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* Maximizar / Restaurar Janela */}
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 transition cursor-pointer border-none bg-transparent"
              title={isMaximized ? "Restaurar tamanho padrão" : "Maximizar em tela cheia"}
              aria-label={isMaximized ? "Restaurar" : "Maximizar"}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Fechar Janela */}
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer border-none bg-transparent"
              title="Fechar Ficha Técnica [ Esc ]"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. CORPO DO MODAL SCROLLÁVEL COM ESPECIFICAÇÃO TÉCNICA RICA */}
        <div className="overflow-y-auto pr-1 sm:pr-2 space-y-6 pt-5 text-left text-slate-700 dark:text-zinc-300 font-sans text-xs sm:text-sm">
          
          {/* Subtítulo & Resumo de Destaque */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-zinc-900/60 border border-emerald-500/20 dark:border-zinc-800/80 space-y-2">
            <span className="text-[10px] font-mono uppercase text-[#1C4E26] dark:text-[#68D346] font-bold block">
              DIRETRIZ ESTRATÉGICA // ESCOPO OPERACIONAL
            </span>
            <p className="text-slate-800 dark:text-zinc-200 leading-relaxed font-normal">
              {pillar.missaoEscopo.resumo}
            </p>
          </div>

          {/* PAINEL 1: DESAFIOS EM AMBIENTE INDUSTRIAL DE ALTA COMPLEXIDADE */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white tracking-wider border-b border-slate-200 dark:border-zinc-800/80 pb-2">
              <Layers className="w-4 h-4 text-[#1C4E26] dark:text-[#68D346]" />
              <span>Desafios em Ambientes de Alta Complexidade</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pillar.missaoEscopo.desafiosIndustriais.map((desafio, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/60"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#1C4E26] dark:text-[#68D346] shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700 dark:text-zinc-300 leading-snug">
                    {desafio}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* PAINEL 2: MATRIZ DE FUNCIONALIDADES NATIVAS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white tracking-wider border-b border-slate-200 dark:border-zinc-800/80 pb-2">
              <Cpu className="w-4 h-4 text-[#1C4E26] dark:text-[#68D346]" />
              <span>Matriz de Recursos & Funcionalidades Nativas</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pillar.funcionalidadesNativas.map((func, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-['Hanken_Grotesk'] uppercase">
                      {func.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-zinc-800 text-[#1C4E26] dark:text-[#68D346] text-[9px] font-mono font-bold">
                      {func.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
                    {func.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* PAINEL 3: MARCO REGULATÓRIO & NORMAS TÉCNICAS ATENDIDAS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white tracking-wider border-b border-slate-200 dark:border-zinc-800/80 pb-2">
              <FileCheck className="w-4 h-4 text-[#1C4E26] dark:text-[#68D346]" />
              <span>Marco Regulatório, Legislação & Impacto Pericial</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800/80 space-y-3">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-zinc-400 font-bold block">
                  NORMAS TÉCNICAS VINCULADAS:
                </span>
                <ul className="space-y-1">
                  {pillar.marcoRegulatorio.normas.map((norma, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-800 dark:text-zinc-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1C4E26] dark:bg-[#68D346]" />
                      <span>{norma}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/60 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-600 dark:text-zinc-400">
                <span className="text-slate-900 dark:text-white font-bold">Órgãos de Fiscalização:</span>
                {pillar.marcoRegulatorio.orgaos.map((org, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-zinc-800/90 text-slate-700 dark:text-zinc-300">
                    {org}
                  </span>
                ))}
              </div>

              <p className="pt-2 text-[11px] text-emerald-800 dark:text-[#B7F365] font-sans leading-relaxed border-t border-slate-200 dark:border-zinc-800/60">
                ⚖️ <strong>Impacto Pericial:</strong> {pillar.marcoRegulatorio.impactoJuridico}
              </p>
            </div>
          </div>

          {/* PAINEL 4: ARQUITETURA DE DADOS & RASTREABILIDADE (PWA OFFLINE-FIRST) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white tracking-wider border-b border-slate-200 dark:border-zinc-800/80 pb-2">
              <Database className="w-4 h-4 text-[#1C4E26] dark:text-[#68D346]" />
              <span>Arquitetura de Dados & Sincronização em Campo (Offline-First)</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/60 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-900 dark:text-white">
                <WifiOff className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="font-bold">{pillar.arquiteturaDados.tipoSync}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                {pillar.arquiteturaDados.resiliencia}
              </p>
              <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                {pillar.arquiteturaDados.tecnologias.map((tech, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border border-slate-300/60 dark:border-zinc-700/60">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* 3. RODAPÉ DE AÇÃO COM BOTÃO DIRETO AO COCKPIT */}
        <div className="pt-5 mt-4 border-t border-slate-200 dark:border-zinc-800/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 relative z-10">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
            <Lock className="w-3.5 h-3.5 text-[#1C4E26] dark:text-[#68D346]" />
            <span>Ambiente Seguro • TLS 1.3 / RLS Ativo</span>
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
              href={pillar.cockpitUrl}
              onClick={handleClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#1C4E26] via-[#246831] to-[#1C4E26] hover:from-[#246831] hover:to-[#2e7d3d] text-white font-black text-xs uppercase tracking-wider rounded-xl border border-[#68D346]/60 shadow-[0_0_20px_rgba(104,211,70,0.35)] hover:shadow-[0_0_28px_rgba(183,243,101,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>ACESSAR MÓDULO NO COCKPIT</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#B7F365]" />
            </Link>
          </div>
        </div>

      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
