'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  ShieldCheck, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Activity,
  ChevronDown,
  HelpCircle,
  Calendar,
  Radio,
  Truck,
  HeartPulse,
  Compass,
  Layers,
  Zap,
  Lock
} from 'lucide-react';
import Footer from './common/Footer';
import ThemeToggle from './ThemeToggle';
import PillarCard3D from './home/PillarCard3D';
import PillarDetailModal from './home/PillarDetailModal';
import { PILLARS_DATA, PillarData } from '@/app/data/pillarsData';
import { SYSTEM_VERSION, COMPANY_NAME } from '@/config/version';

export default function QuietLuxuryHome() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedPillar, setSelectedPillar] = useState<PillarData | null>(null);
  const [isPillarModalOpen, setIsPillarModalOpen] = useState(false);

  // Listener para restaurar a ficha técnica do pilar a partir do Dock
  useEffect(() => {
    const handleRestorePillar = (e: Event) => {
      const customEvent = e as CustomEvent<{ pillar?: PillarData; id?: string }>;
      if (customEvent.detail?.pillar) {
        setSelectedPillar(customEvent.detail.pillar);
        setIsPillarModalOpen(true);
      } else if (customEvent.detail?.id && customEvent.detail.id.startsWith('pillar-')) {
        const pId = customEvent.detail.id.replace('pillar-', '');
        if (PILLARS_DATA[pId]) {
          setSelectedPillar(PILLARS_DATA[pId]);
          setIsPillarModalOpen(true);
        }
      }
    };

    window.addEventListener('siger:restore_pillar_detail', handleRestorePillar);
    window.addEventListener('siger:restore_window', handleRestorePillar);

    return () => {
      window.removeEventListener('siger:restore_pillar_detail', handleRestorePillar);
      window.removeEventListener('siger:restore_window', handleRestorePillar);
    };
  }, []);

  const faqItems = [
    {
      q: 'Como o SIGER Master unifica combate a incêndio, frota e atendimento pré-hospitalar?',
      a: 'A plataforma opera com arquitetura modular integrada: enquanto a engenharia monitora ativos fixos (extintores, hidrantes e bombas), o módulo de frota acompanha a prontidão metrológica de ambulâncias e 4x4, conectando-se ao CAD/CECOM para despacho georreferenciado e ao Prontuário APH Vivo para registro clínico simultâneo.'
    },
    {
      q: 'Como funciona a auditoria de frotas e telemetria metrológica de pneus (TWI)?',
      a: 'O sistema realiza o mapeamento digital dos sulcos dos pneus em milímetros com base no catálogo de fábrica de cada chassi homologado. Alertas visuais e sonoros indicam limites de desgaste e necessidade de rodízio ou substituição, garantindo total conformidade com a resolução CONTRAN 558/80.'
    },
    {
      q: 'A operação de campo e vistorias funciona sem conexão com a internet (Offline-First)?',
      a: 'Sim. Os brigadistas, vistoriadores e condutores realizam checklists normativos, laudos fotográficos e prontuários clínicos diretamente em smartphones ou tablets mesmo em áreas de sombra ou subsolo. Os dados são salvos em banco local criptografado (IndexedDB) e sincronizados atomicamente com a nuvem assim que houver rede.'
    },
    {
      q: 'Qual é o padrão de segurança e conformidade de dados (LGPD) adotado?',
      a: 'Todos os registros de campo, telemetria veicular, dados sensíveis de pacientes (APH) e laudos de engenharia contam com criptografia TLS 1.3 em trânsito e AES-256 em repouso, com políticas RLS (Row Level Security) e trilhas de auditoria auditáveis imutáveis.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1115] text-slate-900 dark:text-zinc-100 font-mono relative overflow-x-hidden select-none transition-colors duration-300">
      
      {/* 1. AMBIENT BACKGROUND GLOW & GEOMETRIC GRID */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1b1e24_1px,transparent_1px),linear-gradient(to_bottom,#1b1e24_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[#68D346]/5 dark:bg-[#68D346]/10 blur-[130px] rounded-full pointer-events-none" />

      {/* 2. NAVIGATION BAR (CYBER-METALLIC TOP HEADER) */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-[#121418]/85 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo & Brand Mark */}
          <div className="flex items-center gap-4 sm:gap-5">
            <Link 
              href="/"
              className="flex items-center justify-center p-0 bg-transparent border-none outline-none group cursor-pointer"
              title="SIGER Master - JIMMP Info"
            >
              <Image 
                src="/assets/branding/logo-jimmp-info.png" 
                alt="Logo JIMMP Info" 
                width={260}
                height={75}
                priority
                className="h-13 sm:h-15 md:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_2px_12px_rgba(104,211,70,0.3)]" 
              />
            </Link>
            <div className="border-l border-slate-300 dark:border-zinc-800 pl-4 py-1.5 hidden sm:block text-left">
              <span className="text-[10px] font-black text-[#1C4E26] dark:text-[#68D346] tracking-[0.25em] block uppercase leading-none">ECOSSISTEMA OFICIAL</span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100 tracking-wider leading-none mt-1 font-['Hanken_Grotesk'] block">SIGER MASTER</span>
            </div>
          </div>

          {/* Quick Actions & Navigation Links */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
              <a href="#pilares" className="hover:text-[#68D346] dark:hover:text-[#B7F365] transition-colors">Os 4 Pilares</a>
              <a href="#metricas" className="hover:text-[#68D346] dark:hover:text-[#B7F365] transition-colors">Governança</a>
              <a href="#normas" className="hover:text-[#68D346] dark:hover:text-[#B7F365] transition-colors">Normas Técnicas</a>
              <a href="#faq" className="hover:text-[#68D346] dark:hover:text-[#B7F365] transition-colors">FAQ</a>
            </div>

            <ThemeToggle />

            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 dark:from-[#282A2F] dark:to-[#1E2024] text-white font-black text-xs uppercase tracking-wider rounded-xl border border-transparent dark:border-[#3C3F45] hover:border-[#68D346] shadow-[0_0_12px_rgba(104,211,70,0.25)] hover:shadow-[0_0_20px_rgba(104,211,70,0.45)] transition-all duration-300 active:scale-95 flex items-center gap-2"
            >
              <span>Acessar Cockpit</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#68D346]" />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (REESTRUTURAÇÃO NARRATIVA & COMANDO UNIFICADO) */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-8 max-w-5xl mx-auto">
          
          {/* Badge Superior Mandatório */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-900/90 border border-slate-300 dark:border-[#3C3F45] text-slate-800 dark:text-zinc-200 text-[11px] font-mono font-bold tracking-widest backdrop-blur-md shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[#68D346] animate-pulse shadow-[0_0_8px_#68D346]" />
            <span>[ 🛡️ ECOSSISTEMA OPERACIONAL INTEGRADO // VERSÃO 2.11 ]</span>
          </motion.div>

          {/* Título Principal de Impacto */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-[1.08] font-['Hanken_Grotesk']"
          >
            COMANDO UNIFICADO DE EMERGÊNCIA, RESGATE E{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#68D346] via-[#85e865] to-[#B7F365] drop-shadow-[0_0_20px_rgba(104,211,70,0.3)]">
              PRONTIDÃO OPERACIONAL
            </span>
          </motion.h1>

          {/* Subtítulo Institucional de Missão Crítica */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-base text-slate-600 dark:text-zinc-300 font-sans max-w-3xl mx-auto leading-relaxed font-normal"
          >
            Do gerenciamento preventivo de ativos críticos ao despacho tático de ambulâncias e viaturas 4x4. Uma plataforma integrada com telemetria metrológica, comando CECOM em tempo real e prontuário pré-hospitalar vivo.
          </motion.p>

          {/* Botões de Ação Principais com Brilho Neon */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-gradient-to-r from-[#1C4E26] via-[#246831] to-[#1C4E26] hover:from-[#246831] hover:to-[#2e7d3d] text-white font-black text-xs uppercase tracking-widest rounded-xl border border-[#68D346]/60 shadow-[0_0_25px_rgba(104,211,70,0.45)] hover:shadow-[0_0_35px_rgba(183,243,101,0.55)] transition-all duration-300 active:scale-95 flex items-center gap-3 cursor-pointer"
            >
              <span>ACESSAR COCKPIT OPERACIONAL</span>
              <ArrowRight className="w-4 h-4 text-[#B7F365]" />
            </Link>

            <Link
              href="/ronda"
              className="px-8 py-4 bg-white dark:bg-[#1E2024] hover:bg-slate-100 dark:hover:bg-[#282A2F] text-slate-800 dark:text-zinc-200 font-bold text-xs uppercase tracking-widest rounded-xl border border-slate-300 dark:border-[#3C3F45] hover:border-[#68D346] shadow-sm transition-all duration-300 active:scale-95 flex items-center gap-2.5 cursor-pointer"
            >
              <span>TERMINAL MOBILE DE CONDUTORES 📱</span>
            </Link>
          </motion.div>

          {/* Ticker de Telemetria Operacional */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#68D346]" />
              <span>SPCI 100% Auditado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#68D346]" />
              <span>Frotas 4x4 em Prontidão</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#68D346]" />
              <span>Despacho CAD em Tempo Real</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#68D346]" />
              <span>ePCR Prontuário Clínico</span>
            </div>
          </div>

        </div>
      </section>

      {/* 4. OS 4 PILARES DO ECOSSISTEMA INTEGRADO (BENTO GRID 4 CARDS) */}
      <section id="pilares" className="py-16 md:py-24 px-6 max-w-7xl mx-auto relative z-10">
        
        {/* Cabeçalho de Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-slate-200 dark:border-zinc-800 pb-6 text-left">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-[#68D346] tracking-widest">
              ARQUITETURA DE MISSÃO CRÍTICA // 4 PILARES
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-['Hanken_Grotesk']">
              Pilares do Ecossistema Integrado SIGER Master
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans max-w-md mt-2 md:mt-0">
            Superando a gestão pontual de extintores para entregar governança total de combate, frotas de resgate, despacho tático e suporte médico pré-hospitalar.
          </p>
        </div>

        {/* BENTO GRID 4 CARDS INTERATIVOS (3D TILT + SMART TOOLTIP) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {Object.values(PILLARS_DATA).map((pillar) => (
            <PillarCard3D
              key={pillar.id}
              pillar={pillar}
              onOpenDetail={(p) => {
                setSelectedPillar(p);
                setIsPillarModalOpen(true);
              }}
            />
          ))}
        </div>
      </section>

      {/* 5. SEÇÃO DE MÉTRICAS & GOVERNANÇA (METÁLICO / CYBER INDUSTRIAL) */}
      <section id="metricas" className="py-16 bg-white dark:bg-[#14161a] border-y border-slate-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-2">
            <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight">100%</p>
            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400 tracking-wider block">
              Conformidade ABNT & CONTRAN
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-3xl md:text-4xl font-black text-[#68D346] font-mono tracking-tight">Zero-Lag</p>
            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400 tracking-wider block">
              Telemetria & Despacho em Campo
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight">&lt; 2s</p>
            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400 tracking-wider block">
              Emissão de Laudos & ePCR
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-3xl md:text-4xl font-black text-[#B7F365] font-mono tracking-tight">256-Bit</p>
            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400 tracking-wider block">
              Criptografia RLS / Governança LGPD
            </span>
          </div>
        </div>
      </section>

      {/* 6. TABELA NORMATIVA & CONFORMIDADE REGULATÓRIA */}
      <section id="normas" className="py-16 md:py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-slate-200 dark:border-zinc-800 pb-6 text-left">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-[#68D346] tracking-widest flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> DIRETRIZES TÉCNICAS E LEGISLAÇÃO
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-['Hanken_Grotesk']">
              Padrões Técnicos Unificados do SIGER Master
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans max-w-md mt-2 md:mt-0">
            Governança rigorosa alinhada às normativas nacionais de combate a incêndio, trânsito e socorro de emergência.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <div className="p-6 bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
            <div className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 font-mono">
              Mensal // Nível 1
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white font-['Hanken_Grotesk'] uppercase">
              Inspeção Visual NBR 12962
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
              Exame visual e operacional do extintor: verificação de lacre, trava, manômetro na faixa verde, desobstrução e integridade do selo Inmetro.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
            <div className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900/60 font-mono">
              Semanal // Frota
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white font-['Hanken_Grotesk'] uppercase">
              Telemetria TWI CONTRAN 558
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
              Medição micrométrica de profundidade de sulco de pneus, calibração dinâmica e auditoria de checklist veicular obrigatório.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
            <div className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 font-mono">
              Anual // Nível 2
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white font-['Hanken_Grotesk'] uppercase">
              Recarga & Hidrantes NBR 13714
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
              Desmontagem e recarga de cilindros, auditoria de mangueiras tipo 1 a 5, esguichos reguláveis e ensaios hidrostáticos periódicos.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
            <div className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-[#1C4E26]/40 text-[#B7F365] border border-[#68D346]/40 font-mono">
              Contínuo // Tempo Real
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white font-['Hanken_Grotesk'] uppercase">
              Prontuário APH & CAD CECOM
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
              Monitoramento ininterrupto de despachos táticos, registro digital de sinais vitais e prontuário de atendimento de emergência na cena.
            </p>
          </div>
        </div>
      </section>

      {/* 7. PERGUNTAS FREQUENTES (FAQ TÉCNICO) */}
      <section id="faq" className="py-16 md:py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] uppercase font-bold tracking-widest rounded-full">
            <HelpCircle className="w-3.5 h-3.5 text-[#68D346]" />
            <span>BASE DE CONHECIMENTO // FAQ OPERACIONAL</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-['Hanken_Grotesk']">
            Perguntas Frequentes sobre o SIGER Master
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans max-w-md mx-auto">
            Respostas diretas sobre governança operacional, frotas de emergência e laudos normativos.
          </p>
        </div>

        <div className="space-y-4 text-left">
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={idx}
                className="bg-white dark:bg-[#181A1F] border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer bg-transparent border-none text-slate-900 dark:text-white"
                >
                  <span className="font-bold text-sm md:text-base font-['Hanken_Grotesk'] leading-snug">
                    {item.q}
                  </span>
                  <div className={`p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#68D346]' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-1 border-t border-slate-100 dark:border-zinc-800/80 text-xs md:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. CHAMADA DE FECHAMENTO (BANNER PRÉ-FOOTER MANDATÓRIO) */}
      <section className="py-20 md:py-28 px-6 max-w-5xl mx-auto text-center space-y-8">
        <div className="w-16 h-16 rounded-3xl bg-[#1C4E26]/30 border border-[#68D346]/50 flex items-center justify-center text-[#68D346] mx-auto shadow-[0_0_25px_rgba(104,211,70,0.3)]">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-['Hanken_Grotesk'] max-w-3xl mx-auto">
          PRONTO PARA ELEVAR O PADRÃO DE RESPOSTA A EMERGÊNCIAS DA SUA PLANTA?
        </h2>
        <p className="text-xs md:text-sm text-slate-600 dark:text-zinc-300 font-sans max-w-2xl mx-auto leading-relaxed">
          Acesse o Cockpit SIGER Master com suas credenciais corporativas e gerencie todo o ecossistema de segurança, frota tática e atendimento pré-hospitalar com governança absoluta.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-[#1C4E26] via-[#246831] to-[#1C4E26] hover:from-[#246831] hover:to-[#2e7d3d] text-white border border-[#68D346]/60 font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_25px_rgba(104,211,70,0.4)] hover:shadow-[0_0_35px_rgba(183,243,101,0.6)] transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <span className="text-[#B7F365]">ENTRAR NO COCKPIT SIGER MASTER</span>
            <ArrowRight className="w-4 h-4 text-[#B7F365]" />
          </Link>
        </div>
      </section>

      {/* 9. MODAL EXECUTIVO DE FICHA TÉCNICA DO PILAR (REACT PORTAL + DOCK) */}
      <PillarDetailModal
        pillar={selectedPillar}
        isOpen={isPillarModalOpen}
        onClose={() => setIsPillarModalOpen(false)}
        onMinimize={() => setIsPillarModalOpen(false)}
      />

      {/* 10. RODAPÉ BENTO CORPORATIVO EXECUTIVO (COM REACT PORTAL LEGAL MODALS) */}
      <Footer variant="full" />

    </div>
  );
}
