'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Truck, 
  Radio, 
  HeartPulse, 
  Search, 
  Bell, 
  QrCode, 
  Sun, 
  Moon, 
  ChevronDown, 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Compass, 
  Layers, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Sliders,
  Settings,
  User,
  LogOut,
  Maximize2
} from 'lucide-react';
import ThemeToggle from '@/app/components/ThemeToggle';
import { COMPANY_NAME, SYSTEM_VERSION } from '@/config/version';

type ToolbarOption = 'hibrido' | 'opcao1' | 'opcao2' | 'opcao3';

export default function PreviewToolbarsPage() {
  const [selectedOption, setSelectedOption] = useState<ToolbarOption>('hibrido');
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const [activeSite, setActiveSite] = useState('UNIDADE INDUSTRIAL CARAJÁS - PARAUAPEBAS');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Mock de dados dos 4 pilares
  const pillarsInfo = {
    spci: {
      id: 'spci',
      title: 'SPCI Ativos',
      badge: 'Prevenção & Combate',
      icon: Flame,
      color: '#68D346',
      metric: '99.2% Conforme',
      items: [
        { label: 'Gestão de Extintores', desc: 'Rastreabilidade e metrologia NBR 12962', href: '#' },
        { label: 'Rede de Hidrantes & Válvulas', desc: 'Testes hidrostáticos e vazão', href: '#' },
        { label: 'Casa de Bombas & Reservatórios', desc: 'Telemetria de pressão e nível', href: '#' },
        { label: 'Checklists de Inspeção', desc: 'Vistorias offline-first com fotos', href: '#' },
      ]
    },
    frotas: {
      id: 'frotas',
      title: 'Frotas 4x4',
      badge: 'Prontidão Tática',
      icon: Truck,
      color: '#B7F365',
      metric: '5/5 Prontas',
      items: [
        { label: 'Viaturas de Resgate 4x4', desc: 'Telemetria, combustível e hodômetro', href: '#' },
        { label: 'Ambulâncias Tipo B / UTI Móvel', desc: 'Desinfecção e checagem de bordo', href: '#' },
        { label: 'Gestão de Pneus & TWI', desc: 'Medição de profundidade de sulco', href: '#' },
        { label: 'Plano de Manutenção Preventiva', desc: 'Ordens de serviço e calibração', href: '#' },
      ]
    },
    cad: {
      id: 'cad',
      title: 'CAD / CECOM',
      badge: 'Comando & Despacho',
      icon: Radio,
      color: '#68D346',
      metric: '0 Fila de Espera',
      items: [
        { label: 'Central de Despacho em Tempo Real', desc: 'Distribuição de chamados táticos', href: '#' },
        { label: 'Mapa Operacional Parauapebas', desc: 'Geolocalização e raio de atendimento', href: '#' },
        { label: 'Comunicação VHF & Telemetria', desc: 'Canais de rádio e despacho de viaturas', href: '#' },
        { label: 'Gestão de Crise & Incidentes', desc: 'Registro de tempos-resposta e logs', href: '#' },
      ]
    },
    epcr: {
      id: 'epcr',
      title: 'ePCR Clínico',
      badge: 'Prontuário APH Vivo',
      icon: HeartPulse,
      color: '#B7F365',
      metric: '2 Atendimentos Hoje',
      items: [
        { label: 'Prontuário de Atendimento APH', desc: 'Preenchimento digital à beira-leito', href: '#' },
        { label: 'Triagem e Escala de Manchester', desc: 'Classificação por risco de gravidade', href: '#' },
        { label: 'Sinais Vitais & ECG Móvel', desc: 'Registro dinâmico de curvas vitais', href: '#' },
        { label: 'Passagem de Plantão Integrada', desc: 'Relatório médico para regulação hospitalar', href: '#' },
      ]
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* ========================================================================= */}
      {/* BARRA SUPERIOR DE CONTROLE DA PRÉVIA (STICKY NO TOPO PARA ALTERNAR)     */}
      {/* ========================================================================= */}
      <div className="sticky top-0 z-[100] w-full bg-slate-900/95 dark:bg-zinc-900/95 border-b border-slate-800 dark:border-white/10 text-white backdrop-blur-md px-4 py-3 shadow-lg select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#68D346] shadow-[0_0_8px_#68D346] animate-pulse" />
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#B7F365] font-black block">
                LABORATÓRIO DE INTERFACE // SIGER MASTER
              </span>
              <p className="text-[11px] text-slate-300 font-sans">
                Selecione abaixo o modelo de barra de ferramentas para testar a experiência real de navegação:
              </p>
            </div>
          </div>

          {/* Seletor dos Modelos */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/90 dark:bg-zinc-950/80 border border-slate-700 dark:border-white/10 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => { setSelectedOption('hibrido'); setActivePillar(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                selectedOption === 'hibrido'
                  ? 'bg-gradient-to-r from-[#1C4E26] via-[#246831] to-[#1C4E26] text-[#B7F365] shadow-[0_0_12px_rgba(104,211,70,0.45)] border border-[#68D346]/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              🌟👑 Híbrido Premium (Opção 1 + 2)
            </button>
            <button
              type="button"
              onClick={() => { setSelectedOption('opcao1'); setActivePillar(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                selectedOption === 'opcao1'
                  ? 'bg-gradient-to-r from-[#1C4E26] to-[#246831] text-[#B7F365] shadow-[0_0_12px_rgba(104,211,70,0.35)] border border-[#68D346]/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Opção 1: Ilha Flutuante
            </button>
            <button
              type="button"
              onClick={() => { setSelectedOption('opcao2'); setActivePillar(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                selectedOption === 'opcao2'
                  ? 'bg-gradient-to-r from-[#1C4E26] to-[#246831] text-[#B7F365] shadow-[0_0_12px_rgba(104,211,70,0.35)] border border-[#68D346]/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Opção 2: Barra Contínua
            </button>
            <button
              type="button"
              onClick={() => { setSelectedOption('opcao3'); setActivePillar(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                selectedOption === 'opcao3'
                  ? 'bg-gradient-to-r from-[#1C4E26] to-[#246831] text-[#B7F365] shadow-[0_0_12px_rgba(104,211,70,0.35)] border border-[#68D346]/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Opção 3: Tática HUD
            </button>
          </div>

          {/* Atalhos Rápidos */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="text-[11px] font-mono uppercase text-slate-300 hover:text-[#68D346] flex items-center gap-1 transition-colors"
            >
              Voltar à Home <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ÁREA DA BARRA DE FERRAMENTAS SELECIONADA                                  */}
      {/* ========================================================================= */}
      <div className="relative z-50">
        {selectedOption === 'hibrido' && (
          /* MODELO HÍBRIDO PREMIUM: BARRA SUPERIOR CONTÍNUA COM DOCK FLUTUANTE CENTRAL DOS 4 PILARES */
          <header className="w-full bg-white/85 dark:bg-[#121418]/85 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.45)] px-5 sm:px-6 lg:px-8 py-3.5 transition-all">
            <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
              
              {/* Zona 1: Logo Oficial JIMMP Info + Planta Ativa */}
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-3.5 group cursor-pointer">
                  <Image 
                    src="/assets/branding/logo-jimmp-info.png" 
                    alt="Logo JIMMP Info" 
                    width={130} 
                    height={38} 
                    priority
                    className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_2px_10px_rgba(104,211,70,0.3)]" 
                  />
                  <div className="border-l border-slate-300 dark:border-zinc-800 pl-3.5 hidden 2xl:block text-left">
                    <span className="text-[9.5px] font-mono font-black text-[#1C4E26] dark:text-[#68D346] tracking-[0.25em] block uppercase leading-none">
                      ECOSSISTEMA OFICIAL
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white font-['Hanken_Grotesk'] tracking-wider leading-none mt-1 block">
                      SIGER MASTER
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200/90 dark:border-zinc-800 text-xs shadow-xs transition-all">
                  <span className="w-2 h-2 rounded-full bg-[#68D346] animate-pulse shadow-[0_0_8px_#68D346]" />
                  <Building2 className="w-3.5 h-3.5 text-[#1C4E26] dark:text-[#68D346] shrink-0" />
                  <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 font-mono font-bold hidden xl:inline">
                    Planta:
                  </span>
                  <span className="font-mono text-[11px] font-black text-slate-800 dark:text-zinc-200 tracking-wide truncate max-w-[190px]">
                    {activeSite}
                  </span>
                </div>
              </div>

              {/* Zona 2: A Ilha Flutuante dos 4 Pilares (Dock Central Segmented) */}
              <div className="hidden md:flex items-center">
                <nav className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200/90 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-xl">
                  {Object.values(pillarsInfo).map((pilar) => {
                    const Icon = pilar.icon;
                    const isOpened = activePillar === pilar.id;
                    return (
                      <div key={pilar.id} className="relative">
                        <button
                          type="button"
                          onClick={() => setActivePillar(isOpened ? null : pilar.id)}
                          className={`flex items-center gap-2 px-3.5 lg:px-4 py-2 rounded-xl text-xs font-black uppercase font-['Hanken_Grotesk'] tracking-wider transition-all duration-200 cursor-pointer ${
                            isOpened
                              ? 'bg-gradient-to-r from-[#1C4E26] via-[#246831] to-[#1C4E26] text-[#B7F365] shadow-[0_0_15px_rgba(104,211,70,0.35)] border border-[#68D346]/50'
                              : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800/60'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 transition-colors ${isOpened ? 'text-[#B7F365]' : 'text-[#1C4E26] dark:text-[#68D346]'}`} />
                          <span className="hidden lg:inline">{pilar.title}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpened ? 'rotate-180 text-[#B7F365]' : 'text-slate-400 dark:text-zinc-500'}`} />
                        </button>

                        <AnimatePresence>
                          {isOpened && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.96 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-1/2 -translate-x-1/2 mt-3 w-84 rounded-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] p-4 space-y-3 z-50 text-left"
                            >
                              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-zinc-800">
                                <div>
                                  <span className="text-[10px] font-mono font-black text-[#1C4E26] dark:text-[#68D346] tracking-widest block uppercase leading-none">
                                    {pilar.badge}
                                  </span>
                                  <h4 className="text-sm font-black text-slate-900 dark:text-white font-['Hanken_Grotesk'] mt-1">
                                    {pilar.title}
                                  </h4>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#1C4E26]/10 dark:bg-[#68D346]/15 text-[#1C4E26] dark:text-[#68D346] border border-[#1C4E26]/20 dark:border-[#68D346]/30 font-bold">
                                  {pilar.metric}
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                {pilar.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => setActivePillar(null)}
                                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors group cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-[#1C4E26] dark:group-hover:text-[#68D346] transition-colors">
                                        {item.label}
                                      </span>
                                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#68D346] group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                                      {item.desc}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </nav>
              </div>

              {/* Zona 3: Ações Rápidas, Busca Spotlight & Perfil */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowSearchModal(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-[#1C4E26] dark:hover:text-[#68D346] text-xs font-mono font-bold uppercase transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Busca Spotlight (Ctrl + K)"
                >
                  <Search className="w-3.5 h-3.5 text-[#1C4E26] dark:text-[#68D346]" />
                  <span className="hidden sm:inline">Buscar...</span>
                  <kbd className="hidden lg:inline text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 font-mono">
                    Ctrl+K
                  </kbd>
                </button>

                <ThemeToggle />

                <button
                  type="button"
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-[#1C4E26] dark:hover:text-[#68D346] transition-all cursor-pointer relative shadow-xs active:scale-95"
                  title="Notificações Operacionais"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#68D346] shadow-[0_0_6px_#68D346] animate-pulse" />
                </button>

                <div className="flex items-center gap-2.5 border-l border-slate-200 dark:border-zinc-800 pl-3.5 cursor-pointer p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all hover:scale-[1.02]">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1C4E26] to-[#68D346] text-white font-mono font-bold flex items-center justify-center text-xs uppercase shadow-xs shrink-0 border border-[#68D346]/40">
                    JL
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wide truncate max-w-[130px] font-['Hanken_Grotesk']">
                      Jackson Leal
                    </p>
                    <p className="text-[9px] font-mono text-[#1C4E26] dark:text-[#68D346] uppercase tracking-wider font-bold">
                      🛡️ Administrador
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </header>
        )}

        {selectedOption === 'opcao1' && (
          /* OPÇÃO 1: ILHA FLUTUANTE EXECUTIVA (FLOATING COMMAND DOCK) */
          <div className="w-full px-4 sm:px-6 pt-5 pb-2">
            <header className="max-w-7xl mx-auto rounded-2xl bg-white/85 dark:bg-zinc-950/75 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)] px-4 sm:px-6 py-2.5 transition-all">
              <div className="flex items-center justify-between gap-4">
                
                {/* Esquerda: Identidade & Planta */}
                <div className="flex items-center gap-4">
                  <Link href="/" className="flex items-center gap-3 group">
                    <Image 
                      src="/assets/branding/logo-jimmp-info.png" 
                      alt="Logo JIMMP Info" 
                      width={120} 
                      height={36} 
                      className="h-9 w-auto object-contain transition-transform group-hover:scale-105 filter drop-shadow-[0_2px_8px_rgba(104,211,70,0.3)]" 
                    />
                    <div className="border-l border-slate-300 dark:border-zinc-800 pl-3 hidden xl:block">
                      <span className="text-[9px] font-mono font-black text-[#1C4E26] dark:text-[#68D346] tracking-[0.2em] block uppercase leading-none">
                        SIGER MASTER
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-white font-['Hanken_Grotesk'] tracking-wide">
                        COCKPIT
                      </span>
                    </div>
                  </Link>

                  {/* Seletor de Contrato Ativo estilo Cápsula */}
                  <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-[11px] font-bold">
                    <Building2 className="w-3.5 h-3.5 text-[#1C4E26] dark:text-[#68D346] shrink-0" />
                    <span className="truncate max-w-[190px] font-mono text-slate-700 dark:text-zinc-300">
                      {activeSite}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                {/* Centro: Os 4 Pilares Operacionais (Segmented Controls) */}
                <nav className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80">
                  {Object.values(pillarsInfo).map((pilar) => {
                    const Icon = pilar.icon;
                    const isActive = activePillar === pilar.id;
                    return (
                      <div key={pilar.id} className="relative">
                        <button
                          type="button"
                          onClick={() => setActivePillar(isActive ? null : pilar.id)}
                          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold font-['Hanken_Grotesk'] uppercase tracking-wider transition-all cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-[#1C4E26] to-[#246831] text-[#B7F365] shadow-[0_0_15px_rgba(104,211,70,0.35)] border border-[#68D346]/40'
                              : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800/60'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#B7F365]' : 'text-[#1C4E26] dark:text-[#68D346]'}`} />
                          <span className="hidden md:inline">{pilar.title}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${isActive ? 'rotate-180 text-[#B7F365]' : 'text-slate-400'}`} />
                        </button>

                        {/* Flyout Gaveta Suspensa ao Clicar no Pilar */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.96 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-0 mt-3 w-80 rounded-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-4 space-y-3 z-50 text-left"
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
                                <div>
                                  <span className="text-[10px] font-mono font-black text-[#1C4E26] dark:text-[#68D346] tracking-widest block uppercase">
                                    {pilar.badge}
                                  </span>
                                  <h4 className="text-sm font-black text-slate-900 dark:text-white font-['Hanken_Grotesk']">
                                    {pilar.title}
                                  </h4>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#1C4E26]/10 dark:bg-[#68D346]/15 text-[#1C4E26] dark:text-[#68D346] border border-[#1C4E26]/20 dark:border-[#68D346]/30 font-bold">
                                  {pilar.metric}
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                {pilar.items.map((item, idx) => (
                                  <a
                                    key={idx}
                                    href="#modulos"
                                    onClick={(e) => { e.preventDefault(); setActivePillar(null); }}
                                    className="block p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors group cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-[#1C4E26] dark:group-hover:text-[#68D346] transition-colors">
                                        {item.label}
                                      </span>
                                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#68D346] group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                                      {item.desc}
                                    </p>
                                  </a>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </nav>

                {/* Direita: Ações Rápidas & Perfil */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Botão de Busca Global Spotlight */}
                  <button
                    type="button"
                    onClick={() => setShowSearchModal(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer text-xs font-mono"
                    title="Buscar Ativo, Viatura ou Ocorrência (Ctrl + K)"
                  >
                    <Search className="w-3.5 h-3.5 text-[#1C4E26] dark:text-[#68D346]" />
                    <span className="hidden md:inline">Buscar...</span>
                    <kbd className="hidden lg:inline text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-500 dark:text-zinc-400">
                      Ctrl+K
                    </kbd>
                  </button>

                  {/* Scanner QR Rápido */}
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-[#1C4E26] dark:hover:text-[#68D346] transition-all cursor-pointer"
                    title="Abrir Scanner QR de Campo"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  {/* Notificações com badge neon */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowNotifMenu(!showNotifMenu)}
                      className="p-2 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-[#1C4E26] dark:hover:text-[#68D346] transition-all cursor-pointer relative"
                    >
                      <Bell className="w-4 h-4" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#68D346] shadow-[0_0_6px_#68D346] animate-pulse" />
                    </button>
                  </div>

                  {/* Avatar do Operador */}
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 hover:border-[#68D346]/50 transition-all cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#1C4E26] to-[#68D346] text-white flex items-center justify-center font-bold text-xs font-mono shadow-xs">
                      JL
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                  </button>
                </div>

              </div>
            </header>
          </div>
        )}

        {selectedOption === 'opcao2' && (
          /* OPÇÃO 2: BARRA SUPERIOR CONTÍNUA INTEGRADA (FULL-WIDTH GLASS HEADER) */
          <header className="w-full bg-white/90 dark:bg-zinc-950/85 backdrop-blur-2xl border-b border-slate-200 dark:border-white/10 px-6 py-3 transition-all shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
              
              {/* Zona Esquerda: Marca + Contrato */}
              <div className="flex items-center gap-5">
                <Link href="/" className="flex items-center gap-3">
                  <Image 
                    src="/assets/branding/logo-jimmp-info.png" 
                    alt="Logo JIMMP Info" 
                    width={130} 
                    height={38} 
                    className="h-10 w-auto object-contain drop-shadow-[0_2px_10px_rgba(104,211,70,0.3)]" 
                  />
                  <div className="border-l border-slate-300 dark:border-zinc-800 pl-3">
                    <span className="text-[10px] font-mono font-black text-[#1C4E26] dark:text-[#68D346] tracking-[0.25em] block uppercase leading-none">
                      COCKPIT
                    </span>
                    <span className="text-base font-black text-slate-900 dark:text-white font-['Hanken_Grotesk'] block leading-tight">
                      SIGER MASTER
                    </span>
                  </div>
                </Link>

                <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#68D346] animate-pulse" />
                  <span className="font-mono text-slate-500 dark:text-zinc-400 uppercase text-[10px]">Contrato:</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[200px]">
                    {activeSite}
                  </span>
                </div>
              </div>

              {/* Zona Central: Abas Mestras dos 4 Pilares com Indicador Superior */}
              <div className="flex items-center gap-2">
                {Object.values(pillarsInfo).map((pilar) => {
                  const Icon = pilar.icon;
                  const isActive = activePillar === pilar.id;
                  return (
                    <div key={pilar.id} className="relative">
                      <button
                        type="button"
                        onClick={() => setActivePillar(isActive ? null : pilar.id)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase font-['Hanken_Grotesk'] tracking-wider transition-all cursor-pointer ${
                          isActive
                            ? 'bg-slate-100 dark:bg-zinc-900 text-[#1C4E26] dark:text-[#68D346] border border-[#1C4E26]/30 dark:border-[#68D346]/40 shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className={`p-1 rounded-md ${isActive ? 'bg-[#1C4E26] text-white' : 'bg-slate-200/70 dark:bg-zinc-800 text-[#1C4E26] dark:text-[#68D346]'}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span>{pilar.title}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown / Mega-Menu da Barra Contínua */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="absolute left-0 mt-2 w-80 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 shadow-xl z-50 text-left"
                          >
                            <div className="text-[10px] font-mono text-[#1C4E26] dark:text-[#68D346] font-bold uppercase tracking-wider mb-2">
                              {pilar.badge} • {pilar.metric}
                            </div>
                            <div className="space-y-1">
                              {pilar.items.map((item, idx) => (
                                <div key={idx} className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                                  <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">{item.label}</div>
                                  <div className="text-[10.5px] text-slate-500 dark:text-zinc-400">{item.desc}</div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Zona Direita: Ferramentas & Status */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSearchModal(true)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:text-[#1C4E26] dark:hover:text-[#68D346] cursor-pointer"
                  title="Busca Global"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:text-[#1C4E26] dark:hover:text-[#68D346] cursor-pointer"
                  title="Notificações"
                >
                  <Bell className="w-4 h-4" />
                </button>
                <div className="h-6 w-px bg-slate-300 dark:bg-zinc-800" />
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-zinc-800 text-[#68D346] border border-[#68D346]/40 flex items-center justify-center font-mono font-bold text-xs">
                    OP
                  </div>
                  <div className="hidden sm:block text-left text-xs leading-none">
                    <span className="font-bold text-slate-900 dark:text-white block">Jackson Leal</span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">Gestor Master</span>
                  </div>
                </div>
              </div>

            </div>
          </header>
        )}

        {selectedOption === 'opcao3' && (
          /* OPÇÃO 3: BARRA TÁTICA HUD COM INDICADORES VIVOS (TACTICAL STATUS BAR) */
          <div className="w-full px-4 sm:px-6 pt-4 pb-2">
            <header className="max-w-7xl mx-auto rounded-2xl bg-zinc-950/90 text-white border border-[#3C3F45] shadow-[0_15px_40px_rgba(0,0,0,0.7)] px-5 py-3 backdrop-blur-xl">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                
                {/* Cabeçalho Tático de Status */}
                <div className="flex items-center gap-4">
                  <Image 
                    src="/assets/branding/logo-jimmp-info.png" 
                    alt="Logo JIMMP Info" 
                    width={110} 
                    height={32} 
                    className="h-8 w-auto object-contain" 
                  />
                  <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#1C4E26]/40 border border-[#68D346]/50 text-[#B7F365] text-[10px] font-mono font-black uppercase">
                    <span className="w-2 h-2 rounded-full bg-[#68D346] animate-pulse" />
                    HUD COCKPIT TÁTICO
                  </div>
                </div>

                {/* 4 Cards de Métricas em Tempo Real dos Pilares */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
                  {Object.values(pillarsInfo).map((pilar) => {
                    const Icon = pilar.icon;
                    return (
                      <button
                        key={pilar.id}
                        type="button"
                        onClick={() => setActivePillar(activePillar === pilar.id ? null : pilar.id)}
                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-[#68D346]/60 transition-all text-left cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#1C4E26]/50 border border-[#68D346]/40 flex items-center justify-center text-[#68D346] group-hover:scale-105 transition-transform shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] font-mono uppercase text-zinc-400 leading-none">
                            {pilar.title}
                          </div>
                          <div className="text-xs font-black text-white font-mono mt-0.5">
                            {pilar.metric}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Ações Globais */}
                <div className="flex items-center gap-3">
                  <div className="text-right text-[10px] font-mono text-zinc-400 hidden xl:block">
                    <div>PARAUAPEBAS // PA</div>
                    <div className="text-[#68D346]">SISTEMA ONLINE (100%)</div>
                  </div>
                  <button
                    type="button"
                    className="px-3.5 py-1.5 bg-[#1C4E26] hover:bg-[#246831] text-[#B7F365] border border-[#68D346]/60 rounded-xl text-xs font-mono font-black uppercase tracking-wider shadow-sm transition-all"
                  >
                    DESPACHO RÁPIDO ⚡
                  </button>
                </div>

              </div>
            </header>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CENÁRIO REALISTA DE COCKPIT ABAIXO DA BARRA (PARA TESTE DE TRANSLUCIDEZ)  */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-5 sm:px-8 py-8 space-y-8">
        
        {/* Banner Informativo do Modelo Atual */}
        <div className="p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#1C4E26] dark:text-[#68D346]">
              MODELO EM EXIBIÇÃO: {selectedOption === 'hibrido' ? '🌟👑 Híbrido Premium (Opção 1 + 2)' : selectedOption === 'opcao1' ? 'Opção 1 (Ilha Flutuante)' : selectedOption === 'opcao2' ? 'Opção 2 (Barra Contínua)' : 'Opção 3 (Barra Tática HUD)'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk']">
              {selectedOption === 'hibrido' && 'Híbrido Premium: Vidro Contínuo com Dock Central dos 4 Pilares'}
              {selectedOption === 'opcao1' && 'Ilha Flutuante de Luxo Silencioso (Floating Dock)'}
              {selectedOption === 'opcao2' && 'Barra Superior Contínua Corporativa (Executive Full Glass)'}
              {selectedOption === 'opcao3' && 'Cockpit de Prontidão Operacional Tática (HUD Status Bar)'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans max-w-3xl">
              {selectedOption === 'hibrido' && 'A fusão perfeita: base de vidro translúcido de ponta a ponta com desfoque 2xl, abrigando no centro um Dock Flutuante esculpido com os 4 Pilares Operacionais, flyouts de alta precisão e suíte lateral de ferramentas.'}
              {selectedOption === 'opcao1' && 'Focada em leveza, visual moderno e flutuação. Deixa a página mais arejada e agrupa os 4 pilares em botões táteis elegantes com menus suspensos integrados.'}
              {selectedOption === 'opcao2' && 'Focada em estabilidade corporativa e máxima densidade de controle. Ideal para gestores que preferem a barra clássica de topo com menus detalhados.'}
              {selectedOption === 'opcao3' && 'Focada em comando e monitoramento ao vivo. Traz indicadores de saúde de cada pilar (conformidade, viaturas e ocorrências) à vista direta do operador.'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => alert(`Modelo ${selectedOption === 'hibrido' ? 'Híbrido Premium' : selectedOption} ativado com sucesso!`)}
              className="px-6 py-3 bg-gradient-to-r from-[#1C4E26] via-[#246831] to-[#1C4E26] hover:from-[#246831] hover:to-[#2e7d3d] text-white border border-[#68D346]/60 font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(104,211,70,0.3)] transition-all cursor-pointer"
            >
              <span className="text-[#B7F365]">Aprovar Este Modelo ✅</span>
            </button>
          </div>
        </div>

        {/* 4 Cards de Métricas do Cockpit (Simulação de Dashboard) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-sm text-left space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-[11px] font-mono font-bold uppercase">Ativos SPCI Auditados</span>
              <Flame className="w-5 h-5 text-[#68D346]" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-['Hanken_Grotesk']">
              1.428
            </div>
            <div className="text-[11px] font-mono text-[#1C4E26] dark:text-[#68D346] font-bold">
              ✓ 99.2% em conformidade legal
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-sm text-left space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-[11px] font-mono font-bold uppercase">Viaturas 4x4 em QAP</span>
              <Truck className="w-5 h-5 text-[#68D346]" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-['Hanken_Grotesk']">
              5 / 5
            </div>
            <div className="text-[11px] font-mono text-[#1C4E26] dark:text-[#68D346] font-bold">
              ✓ 100% dos pneus com TWI seguro
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-sm text-left space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-[11px] font-mono font-bold uppercase">Chamados CECOM / CAD</span>
              <Radio className="w-5 h-5 text-[#68D346]" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-['Hanken_Grotesk']">
              12
            </div>
            <div className="text-[11px] font-mono text-[#1C4E26] dark:text-[#68D346] font-bold">
              ✓ Tempo médio resposta: 4.2 min
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-sm text-left space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-[11px] font-mono font-bold uppercase">Atendimentos APH (ePCR)</span>
              <HeartPulse className="w-5 h-5 text-[#68D346]" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-['Hanken_Grotesk']">
              8
            </div>
            <div className="text-[11px] font-mono text-[#1C4E26] dark:text-[#68D346] font-bold">
              ✓ Prontuários 100% sincronizados
            </div>
          </div>
        </div>

        {/* Tabela de Amostra de Atividades Recentes */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-sm text-left space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk']">
              Monitoramento em Tempo Real dos 4 Pilares
            </h3>
            <span className="text-xs font-mono text-[#1C4E26] dark:text-[#68D346] font-bold">
              Sincronizado via Supabase Realtime
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-slate-500 dark:text-zinc-400 uppercase">
                  <th className="py-3 px-4">Pilar</th>
                  <th className="py-3 px-4">Identificador / Registro</th>
                  <th className="py-3 px-4">Local / Setor</th>
                  <th className="py-3 px-4">Status Operacional</th>
                  <th className="py-3 px-4">Horário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-[#1C4E26] dark:text-[#68D346] flex items-center gap-2">
                    <Flame className="w-4 h-4" /> SPCI
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-zinc-100">EXT-PQS-0421</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-zinc-300">Oficina Mecânica Mina Norte</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold">
                      CONFORME
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-zinc-400">19:42:10</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-[#1C4E26] dark:text-[#68D346] flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Frotas
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-zinc-100">VTR-RESGATE-02 (Hilux 4x4)</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-zinc-300">Base Central de Prontidão</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold">
                      QAP PRONTA
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-zinc-400">19:35:00</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-[#1C4E26] dark:text-[#68D346] flex items-center gap-2">
                    <Radio className="w-4 h-4" /> CAD / CECOM
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-zinc-100">OC-2026-089 (Princípio Fogo)</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-zinc-300">Galpão de Armazenamento B</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-mono text-[10px] font-bold">
                      FINALIZADO COM SUCESSO
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-zinc-400">19:15:22</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-[#1C4E26] dark:text-[#68D346] flex items-center gap-2">
                    <HeartPulse className="w-4 h-4" /> ePCR APH
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-zinc-100">PRONT-APH-055</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-zinc-300">Ambulatório Industrial Sul</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold">
                      REGULAÇÃO CONCLUÍDA
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-zinc-400">18:50:11</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Modal de Busca Spotlight Simulado */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 bg-zinc-950/70 backdrop-blur-md p-4"
            onClick={() => setShowSearchModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-5 shadow-2xl text-left space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
                <Search className="w-5 h-5 text-[#68D346]" />
                <input 
                  type="text" 
                  placeholder="Pesquise por patrimônio, viatura, pneu, chamado ou socorrista..."
                  autoFocus
                  className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none font-bold"
                />
                <kbd className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 font-mono text-slate-500">ESC</kbd>
              </div>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Sugestões Rápidas:</div>
              <div className="space-y-1.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center justify-between">
                  <span>🛡️ Extintor PQS 6kg - Ref. EXT-0421</span>
                  <span className="font-mono text-[#68D346] text-[10px]">SPCI</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center justify-between">
                  <span>🚒 Ambulância UTI Móvel - Placa QEY-8821</span>
                  <span className="font-mono text-[#68D346] text-[10px]">Frotas</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center justify-between">
                  <span>🩺 Prontuário APH - Paciente Estável (PA 120x80)</span>
                  <span className="font-mono text-[#68D346] text-[10px]">ePCR</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
