'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Truck, 
  Radio, 
  HeartPulse, 
  Search, 
  Bell, 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  Boxes, 
  LayoutDashboard,
  MapPin, 
  Clock, 
  Settings, 
  LogOut, 
  ChevronDown, 
  ChevronRight, 
  ArrowRight, 
  ExternalLink, 
  Menu, 
  X, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb,
  Cpu,
  Bot,
  Activity
} from 'lucide-react';
import ThemeToggle from '@/app/components/ThemeToggle';

type StyleOption = 'estiloA' | 'estiloB';

export default function PreviewEstilosPage() {
  const [currentStyle, setCurrentStyle] = useState<StyleOption>('estiloA');
  const [selectedPillar, setSelectedPillar] = useState<'spci' | 'frotas' | 'cad' | 'epcr'>('spci');
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSigerIaDrawer, setShowSigerIaDrawer] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const activeSite = 'UNIDADE INDUSTRIAL CARAJÁS - PARAUAPEBAS';

  // Configuração e mapeamento dos 4 Pilares e dos 7 itens destacados pelo usuário
  const pillarsConfig = {
    spci: {
      id: 'spci',
      title: 'SPCI Ativos',
      badge: 'Prevenção & Combate',
      icon: Flame,
      color: '#68D346',
      metric: '99.2% Conforme (230 Ativos)',
      modules: [
        { label: 'Dashboard / Visão Geral SPCI', tag: 'ITEM RELOCADO', icon: LayoutDashboard, desc: 'Conformidade legal NBR, mapa de calor e setores da planta' },
        { label: 'Gestão de Ativo & Setores da Planta', tag: 'ITEM RELOCADO', icon: Boxes, desc: 'Cadastro de setores, almoxarifado, movimentações e substituições' },
        { label: 'Extintores NBR 12962', tag: 'INSPEÇÃO', icon: Flame, desc: 'Metrologia, anel e vistorias offline-first' },
        { label: 'Hidrantes & Abrigos NBR 13714', tag: 'TESTES', icon: CheckCircle2, desc: 'Válvulas, esguichos e testes de vazão' },
        { label: 'Casa de Bombas & Reservatórios', tag: 'AUTOMAÇÃO', icon: Cpu, desc: 'Telemetria de pressão, diesel e recalque' },
        { label: 'Checklists Homologados', tag: 'FORMULÁRIOS', icon: FileText, desc: 'Vistorias com registro fotográfico e laudos' },
      ]
    },
    frotas: {
      id: 'frotas',
      title: 'Frotas 4x4',
      badge: 'Prontidão Tática',
      icon: Truck,
      color: '#B7F365',
      metric: '5/5 Viaturas em QAP',
      modules: [
        { label: 'Despacho & Ronda Campo', tag: 'ITEM RELOCADO', icon: Radio, desc: 'Roteiros de ronda de segurança e inspeção perimetral' },
        { label: 'Viaturas de Resgate 4x4', tag: 'PRONTIDÃO', icon: Truck, desc: 'Hodômetro, nível de combustível e calibração' },
        { label: 'Ambulâncias Tipo B / UTI Móvel', tag: 'RESGATE', icon: HeartPulse, desc: 'Checagem de equipamentos de bordo e desinfecção' },
        { label: 'Gestão de Pneus & TWI', tag: 'SEGURANÇA', icon: ShieldCheck, desc: 'Medição a laser dos sulcos e controle de desgaste' },
      ]
    },
    cad: {
      id: 'cad',
      title: 'CAD / CECOM',
      badge: 'Comando & Despacho',
      icon: Radio,
      color: '#68D346',
      metric: '0 Ocorrências em Espera',
      modules: [
        { label: 'Mapa Operacional Parauapebas', tag: 'ITEM RELOCADO', icon: MapPin, desc: 'Geolocalização ao vivo de viaturas, hidrantes e rotas' },
        { label: 'Mesa Central de Despacho', tag: 'CECOM', icon: Radio, desc: 'Abertura, triagem e envio imediato de equipes' },
        { label: 'Comunicação VHF & Canais', tag: 'TELEMETRIA', icon: Cpu, desc: 'Status de frequência e gravação de chamados táticos' },
        { label: 'Logs de Despacho & Resposta', tag: 'GOVERNANÇA', icon: Clock, desc: 'Cronômetro de resposta e desfecho das ocorrências' },
      ]
    },
    epcr: {
      id: 'epcr',
      title: 'ePCR Clínico',
      badge: 'Prontuário APH Vivo',
      icon: HeartPulse,
      color: '#B7F365',
      metric: '2 Atendimentos Hoje',
      modules: [
        { label: 'Prontuário de Atendimento APH', tag: 'CLÍNICO', icon: HeartPulse, desc: 'Preenchimento digital à beira-leito com biometria' },
        { label: 'Triagem Manchester & Gravidade', tag: 'PROTOCOLO', icon: AlertTriangle, desc: 'Classificação por cores de risco e tempo de tolerância' },
        { label: 'Curvas Vitais & ECG Móvel', tag: 'TELEMETRIA', icon: Activity, desc: 'Monitoramento dinâmico de sinais vitais e saturação' },
        { label: 'Regulação & Passagem de Plantão', tag: 'HOSPITALAR', icon: FileText, desc: 'Transmissão segura de dados para regulação hospitalar' },
      ]
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* ========================================================================= */}
      {/* 1. SELETOR DE PRÉVIA FIXO NO TOPO (STICKY CONTROLLER)                     */}
      {/* ========================================================================= */}
      <div className="sticky top-0 z-[100] w-full bg-slate-900/95 dark:bg-zinc-900/95 border-b border-slate-800 dark:border-white/10 text-white backdrop-blur-md px-4 py-3 shadow-lg select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#68D346] shadow-[0_0_8px_#68D346] animate-pulse" />
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#B7F365] font-black block">
                PRÉVIA ARQUITETURAL // SIGER MASTER
              </span>
              <p className="text-[11px] text-slate-300 font-sans">
                Compare como os 7 itens da Sidebar são redistribuídos em cada estilo de navegação:
              </p>
            </div>
          </div>

          {/* Seletor dos 2 Estilos */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-800/90 dark:bg-zinc-950/80 border border-slate-700 dark:border-white/10">
            <button
              type="button"
              onClick={() => { setCurrentStyle('estiloA'); setActiveFlyout(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                currentStyle === 'estiloA'
                  ? 'bg-gradient-to-r from-[#1C4E26] via-[#246831] to-[#1C4E26] text-[#B7F365] shadow-[0_0_15px_rgba(104,211,70,0.45)] border border-[#68D346]/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              🌟 Estilo A: Topbar Total (Tela Ampla & Limpa)
            </button>
            <button
              type="button"
              onClick={() => { setCurrentStyle('estiloB'); setActiveFlyout(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                currentStyle === 'estiloB'
                  ? 'bg-gradient-to-r from-[#1C4E26] via-[#246831] to-[#1C4E26] text-[#B7F365] shadow-[0_0_15px_rgba(104,211,70,0.45)] border border-[#68D346]/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              🔄 Estilo B: Topbar dos Pilares + Sidebar Dinâmica
            </button>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="text-[11px] font-mono uppercase text-slate-300 hover:text-[#68D346] flex items-center gap-1 transition-colors"
            >
              Home <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DEMONSTRAÇÃO DO ESTILO SELECIONADO                                     */}
      {/* ========================================================================= */}
      {currentStyle === 'estiloA' ? (
        /* ======================================================================= */
        /* ESTILO A: BARRA SUPERIOR TOTAL (DOCK CENTRAL DOS 4 PILARES + TELA AMPLA) */
        /* ======================================================================= */
        <div className="flex-1 flex flex-col w-full">
          
          {/* BARRA SUPERIOR COMPLETA */}
          <header className="w-full bg-white/90 dark:bg-[#121418]/90 backdrop-blur-2xl border-b border-slate-200/90 dark:border-white/10 px-5 sm:px-6 lg:px-8 py-3 transition-all sticky top-[57px] z-50 shadow-sm">
            <div className="max-w-[1750px] mx-auto flex items-center justify-between gap-4">
              
              {/* Esquerda: Logo Oficial JIMMP Info + Planta */}
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-3 group">
                  <Image 
                    src="/assets/branding/logo-jimmp-info.png" 
                    alt="Logo JIMMP Info" 
                    width={130} 
                    height={38} 
                    priority
                    className="h-10 w-auto object-contain transition-transform group-hover:scale-105 filter drop-shadow-[0_2px_10px_rgba(104,211,70,0.3)]" 
                  />
                  <div className="border-l border-slate-300 dark:border-zinc-800 pl-3.5 hidden 2xl:block text-left">
                    <span className="text-[9.5px] font-mono font-black text-[#1C4E26] dark:text-[#68D346] tracking-[0.25em] block uppercase leading-none">
                      COCKPIT
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white font-['Hanken_Grotesk'] tracking-wider leading-none mt-1 block">
                      SIGER MASTER
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200/90 dark:border-zinc-800 text-xs shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#68D346] animate-pulse shadow-[0_0_8px_#68D346]" />
                  <Building2 className="w-3.5 h-3.5 text-[#1C4E26] dark:text-[#68D346] shrink-0" />
                  <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 font-mono font-bold hidden xl:inline">Planta:</span>
                  <span className="font-mono text-[11px] font-black text-slate-800 dark:text-zinc-200 truncate max-w-[190px]">
                    {activeSite}
                  </span>
                </div>
              </div>

              {/* Centro: Dock Flutuante dos 4 Pilares com Menus Suspensos */}
              <div className="hidden lg:flex items-center">
                <nav className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs backdrop-blur-xl">
                  {Object.values(pillarsConfig).map((pilar) => {
                    const Icon = pilar.icon;
                    const isOpened = activeFlyout === pilar.id;
                    return (
                      <div key={pilar.id} className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveFlyout(isOpened ? null : pilar.id)}
                          className={`flex items-center gap-2 px-3.5 xl:px-4 py-2 rounded-xl text-xs font-black uppercase font-['Hanken_Grotesk'] tracking-wider transition-all duration-200 cursor-pointer ${
                            isOpened
                              ? 'bg-gradient-to-r from-[#1C4E26] via-[#246831] to-[#1C4E26] text-[#B7F365] shadow-[0_0_15px_rgba(104,211,70,0.35)] border border-[#68D346]/50'
                              : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800/60'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isOpened ? 'text-[#B7F365]' : 'text-[#1C4E26] dark:text-[#68D346]'}`} />
                          <span>{pilar.title}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpened ? 'rotate-180 text-[#B7F365]' : 'text-slate-400'}`} />
                        </button>

                        {/* Flyout Suspenso do Pilar */}
                        <AnimatePresence>
                          {isOpened && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.96 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-1/2 -translate-x-1/2 mt-3 w-88 rounded-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-4 space-y-3 z-50 text-left"
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
                                {pilar.modules.map((mod, idx) => {
                                  const ModIcon = mod.icon;
                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => setActiveFlyout(null)}
                                      className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors group cursor-pointer"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <ModIcon className="w-3.5 h-3.5 text-[#1C4E26] dark:text-[#68D346]" />
                                          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-[#1C4E26] dark:group-hover:text-[#68D346] transition-colors">
                                            {mod.label}
                                          </span>
                                        </div>
                                        {mod.tag === 'ITEM RELOCADO' && (
                                          <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                            AQUI
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5 pl-5.5">
                                        {mod.desc}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </nav>
              </div>

              {/* Direita: Pílula SIGER IA + Busca + Usuário & Sair */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                
                {/* 1. Botão Destaque SIGER IA (Assistente 24h) */}
                <button
                  type="button"
                  onClick={() => setShowSigerIaDrawer(!showSigerIaDrawer)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#1C4E26]/20 via-[#68D346]/20 to-[#1C4E26]/20 hover:from-[#1C4E26]/30 hover:to-[#246831]/30 border border-[#68D346]/50 text-[#1C4E26] dark:text-[#B7F365] font-mono text-xs font-black uppercase shadow-[0_0_12px_rgba(104,211,70,0.25)] transition-all cursor-pointer active:scale-95"
                  title="Abrir Assistente SIGER IA 24h"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#68D346] animate-pulse" />
                  <span className="hidden sm:inline">SIGER IA</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-[#1C4E26] text-[#B7F365] font-bold">24H</span>
                </button>

                {/* 2. Busca Spotlight */}
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Search className="w-3.5 h-3.5 text-[#1C4E26] dark:text-[#68D346]" />
                  <span className="hidden xl:inline">Buscar...</span>
                  <kbd className="hidden 2xl:inline text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-500 font-mono">
                    Ctrl+K
                  </kbd>
                </button>

                {/* 3. Notificações */}
                <button
                  type="button"
                  className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer relative shadow-xs"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#68D346] shadow-[0_0_6px_#68D346] animate-pulse" />
                </button>

                {/* 4. Menu do Usuário com Configurações, Logs e SAIR DO COCKPIT */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2.5 border-l border-slate-200 dark:border-zinc-800 pl-3.5 cursor-pointer p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1C4E26] to-[#68D346] text-white font-mono font-bold flex items-center justify-center text-xs uppercase shadow-xs shrink-0 border border-[#68D346]/40">
                      JL
                    </div>
                    <div className="hidden sm:block text-left leading-tight">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wide truncate max-w-[120px] font-['Hanken_Grotesk']">
                        Jackson Leal
                      </p>
                      <p className="text-[9px] font-mono text-[#1C4E26] dark:text-[#68D346] uppercase tracking-wider font-bold">
                        🛡️ Administrador
                      </p>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* Dropdown do Usuário com os Itens da Sidebar Relocados */}
                  <AnimatePresence>
                    {showUserDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className="absolute right-0 mt-3 w-64 rounded-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-2 z-50 text-left space-y-1 font-sans"
                      >
                        <div className="p-3 border-b border-slate-200 dark:border-zinc-800">
                          <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">Jackson Leal</p>
                          <p className="text-[10px] text-slate-500 font-mono">jacksonflr@outlook.com.br</p>
                        </div>

                        {/* Itens Relocados da Sidebar aqui */}
                        <button
                          type="button"
                          onClick={() => { setShowUserDropdown(false); alert('Abrindo Logs do Sistema & Auditoria'); }}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 text-xs font-medium text-slate-800 dark:text-zinc-200 cursor-pointer border-none bg-transparent"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#68D346]" />
                            <span>Logs do Sistema & Auditoria</span>
                          </div>
                          <span className="text-[9px] font-mono text-amber-500 font-bold">RELOCADO</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setShowUserDropdown(false); alert('Abrindo Configurações do Sistema'); }}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 text-xs font-medium text-slate-800 dark:text-zinc-200 cursor-pointer border-none bg-transparent"
                        >
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-slate-400" />
                            <span>Configurações Gerais</span>
                          </div>
                          <span className="text-[9px] font-mono text-amber-500 font-bold">RELOCADO</span>
                        </button>

                        <div className="pt-1 border-t border-slate-200 dark:border-zinc-800">
                          <button
                            type="button"
                            onClick={() => { setShowUserDropdown(false); alert('Saindo com segurança do Cockpit...'); }}
                            className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold text-red-600 dark:text-red-400 cursor-pointer border-none bg-transparent"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>SAIR DO COCKPIT</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

            </div>
          </header>

          {/* ÁREA DE TRABALHO EM TELA CHEIA (SEM SIDEBAR PESADA OCUPANDO ESPAÇO) */}
          <main className="flex-1 max-w-[1750px] w-full mx-auto px-5 sm:px-8 py-8 space-y-8 text-left">
            <div className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#1C4E26] dark:text-[#68D346]">
                  ESTILO A: NAVEGAÇÃO TOTAL NO TOPO
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk']">
                  Máxima Amplitude e Limpeza Visual
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-3xl">
                  Todos os itens da barra lateral foram promovidos para a barra superior. O sistema ganha 100% de largura horizontal para tabelas, mapas de Parauapebas e dashboards analíticos, mantendo o visual limpo no padrão da Home e do Login.
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert('Estilo A escolhido! Podemos aplicá-lo.')}
                className="px-6 py-3 bg-gradient-to-r from-[#1C4E26] via-[#246831] to-[#1C4E26] hover:from-[#246831] hover:to-[#2e7d3d] text-white border border-[#68D346]/60 font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer"
              >
                <span className="text-[#B7F365]">Aprovar Estilo A ✅</span>
              </button>
            </div>

            {/* Simulação dos 4 Cards de Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Object.values(pillarsConfig).map(pilar => {
                const Icon = pilar.icon;
                return (
                  <div key={pilar.id} className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-[11px] font-mono font-bold uppercase">{pilar.title}</span>
                      <Icon className="w-5 h-5 text-[#68D346]" />
                    </div>
                    <div className="text-xs font-mono text-[#1C4E26] dark:text-[#68D346] font-bold">
                      {pilar.metric}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      ) : (
        /* ======================================================================= */
        /* ESTILO B: TOPBAR DOS PILARES + SIDEBAR DINÂMICA CONTEXTUAL               */
        /* ======================================================================= */
        <div className="flex-1 flex flex-col w-full">
          
          {/* BARRA SUPERIOR DE PILARES */}
          <header className="w-full bg-white/90 dark:bg-[#121418]/90 backdrop-blur-2xl border-b border-slate-200/90 dark:border-white/10 px-6 py-3 transition-all sticky top-[57px] z-50">
            <div className="max-w-[1750px] mx-auto flex items-center justify-between gap-4">
              
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-3">
                  <Image 
                    src="/assets/branding/logo-jimmp-info.png" 
                    alt="Logo JIMMP Info" 
                    width={120} 
                    height={36} 
                    className="h-9 w-auto object-contain" 
                  />
                  <span className="text-xs font-black font-['Hanken_Grotesk'] uppercase text-slate-800 dark:text-white border-l pl-3 border-slate-300 dark:border-zinc-800 hidden sm:inline">
                    COCKPIT 4 PILARES
                  </span>
                </Link>
              </div>

              {/* Botões dos 4 Pilares no Topo que Chaveiam a Sidebar */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10">
                {Object.values(pillarsConfig).map(p => {
                  const Icon = p.icon;
                  const isSelected = selectedPillar === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPillar(p.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase font-['Hanken_Grotesk'] tracking-wider transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#1C4E26] to-[#246831] text-[#B7F365] shadow-md border border-[#68D346]/50'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#B7F365]' : 'text-[#68D346]'}`} />
                      <span>{p.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-500 hidden md:inline">Operador: Jackson Leal</span>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1C4E26] to-[#68D346] text-white flex items-center justify-center font-bold text-xs font-mono">
                  JL
                </div>
              </div>

            </div>
          </header>

          {/* CORPO DO ESTILO B: SIDEBAR ADAPTATIVA + CONTEÚDO */}
          <div className="flex-1 flex max-w-[1750px] w-full mx-auto">
            
            {/* SIDEBAR DINÂMICA QUE SE ADAPTA AO PILAR SELECIONADO */}
            <aside className="w-72 shrink-0 border-r border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/80 p-4 space-y-6 text-left select-none">
              
              {/* Card de Identificação do Pilar Selecionado */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#1C4E26]/20 to-transparent border border-[#68D346]/40 space-y-1">
                <span className="text-[9.5px] font-mono font-bold uppercase text-[#1C4E26] dark:text-[#68D346] tracking-wider block">
                  PILAR SELECIONADO:
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk']">
                  {pillarsConfig[selectedPillar].title}
                </h3>
                <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-mono">
                  {pillarsConfig[selectedPillar].metric}
                </p>
              </div>

              {/* Módulos Dinâmicos daquele Pilar na Sidebar */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider px-2 block">
                  MÓDULOS DESTE PILAR:
                </span>
                {pillarsConfig[selectedPillar].modules.map((mod, i) => {
                  const Icon = mod.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors text-left cursor-pointer border-none bg-transparent"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-[#1C4E26] dark:text-[#68D346]" />
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{mod.label}</span>
                      </div>
                      {mod.tag === 'ITEM RELOCADO' && (
                        <span className="text-[8px] font-mono px-1 rounded bg-amber-500/20 text-amber-500 font-bold">
                          AQUI
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Itens Fixos na Base da Sidebar (conforme a imagem do usuário) */}
              <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="p-3 rounded-2xl bg-zinc-900 text-white border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#68D346]" />
                    <div>
                      <div className="text-xs font-bold font-mono">SIGER IA</div>
                      <div className="text-[9px] text-zinc-400">Assistente 24h</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-[#68D346] font-bold">QAP</span>
                </div>

                <button
                  type="button"
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer border-none bg-transparent"
                >
                  <LogOut className="w-4 h-4" />
                  <span>SAIR DO COCKPIT</span>
                </button>
              </div>

            </aside>

            {/* CONTEÚDO PRINCIPAL DO ESTILO B */}
            <main className="flex-1 p-8 space-y-6 text-left">
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#1C4E26] dark:text-[#68D346]">
                    ESTILO B: NAVEGAÇÃO EM 2 NÍVEIS
                  </span>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk']">
                    Barra Superior Filtra + Sidebar Detalha
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 max-w-2xl">
                    Clique em qualquer um dos 4 pilares no topo para ver como o menu lateral à esquerda se transforma instantaneamente, exibindo apenas as opções daquela área operacional.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Estilo B escolhido! Podemos aplicá-lo.')}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#1C4E26] to-[#246831] text-[#B7F365] border border-[#68D346]/50 font-bold text-xs uppercase rounded-xl shadow-sm cursor-pointer"
                >
                  Aprovar Estilo B ✅
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <h4 className="text-sm font-bold uppercase font-['Hanken_Grotesk'] text-slate-800 dark:text-white mb-2">
                  Área Operacional do Pilar Ativo: {pillarsConfig[selectedPillar].title}
                </h4>
                <p className="text-xs text-slate-500 font-sans">
                  Aqui são renderizados os painéis, listas de ativos, relatórios e formulários específicos do pilar que você selecionou no topo.
                </p>
              </div>
            </main>

          </div>
        </div>
      )}

      {/* GAVETA LATERAL DO ASSISTENTE SIGER IA (SIMULADA) */}
      <AnimatePresence>
        {showSigerIaDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex justify-end bg-zinc-950/60 backdrop-blur-xs"
            onClick={() => setShowSigerIaDrawer(false)}
          >
            <motion.div
              initial={{ x: 350 }}
              animate={{ x: 0 }}
              exit={{ x: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md h-full bg-white dark:bg-zinc-950 border-l border-slate-200 dark:border-white/10 shadow-2xl p-6 flex flex-col justify-between text-left"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#68D346]" />
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk']">
                      Assistente SIGER IA
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSigerIaDrawer(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300">
                  Assistente especialista em normas NBR, laudos metrológicos, triagem de frotas e prontuários APH.
                </p>
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300">
                  💡 <em>"Operador Jackson, todos os 230 extintores de Carajás estão dentro da validade metrológica NBR 12962."</em>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
                <input 
                  type="text" 
                  placeholder="Pergunte algo ao SIGER IA..." 
                  className="w-full p-3 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
