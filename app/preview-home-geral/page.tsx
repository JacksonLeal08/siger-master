'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useSpci } from '@/app/context/SpciContext';
import { 
  Flame, 
  Truck, 
  Radio, 
  HeartPulse, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Search, 
  ArrowRight, 
  ExternalLink, 
  RefreshCw, 
  Activity, 
  Sparkles, 
  Building2, 
  ChevronRight, 
  BarChart3, 
  TrendingUp, 
  Layers, 
  Eye, 
  Smartphone, 
  Droplet, 
  Sliders, 
  Lightbulb, 
  User, 
  Settings, 
  Disc, 
  Fuel, 
  AlertCircle, 
  Compass,
  ArrowUpRight,
  ShieldAlert,
  Boxes,
  Zap,
  CheckCheck,
  LayoutDashboard
} from 'lucide-react';
import ThemeToggle from '@/app/components/ThemeToggle';

export default function PreviewHomeGeralPage() {
  const router = useRouter();
  const {
    currentUser,
    userProfile,
    extintores,
    hidrantes,
    sinalizacoes,
    iluminacoes,
    bombas,
    complianceLogs,
    activeSite,
    setActiveSite,
    isGlobalScope,
    contractAssetCounts
  } = useSpci();

  // Filtro de site/planta local para testes na prévia
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>(activeSite || 'TODOS OS SITES (Acesso Global)');
  const [activeTab, setActiveTab] = useState<'geral' | 'spci' | 'frotas' | 'cecom' | 'epcr'>('geral');

  // Cálculos dinâmicos com base nos ativos reais do contexto
  const totalAssets = (extintores?.length || 0) + (hidrantes?.length || 0) + (bombas?.length || 0) + (sinalizacoes?.length || 0) + (iluminacoes?.length || 0);
  
  const totalVencidos = 
    (extintores?.filter(x => x.status === 'Vencido').length || 0) + 
    (hidrantes?.filter(x => x.status === 'Vencido').length || 0) + 
    (bombas?.filter(x => x.status === 'Manutenção Req.').length || 0) + 
    (sinalizacoes?.filter(x => x.status === 'Faltante').length || 0) + 
    (iluminacoes?.filter(x => x.status === 'Falha Carga').length || 0);

  const totalAtencao = 
    (extintores?.filter(x => x.status === 'Em Manutenção').length || 0) + 
    (hidrantes?.filter(x => x.status === 'Em Manutenção').length || 0) + 
    (bombas?.filter(x => x.status === 'Standby' || x.status === 'Atenção').length || 0) + 
    (sinalizacoes?.filter(x => x.status === 'Não Conforme').length || 0) + 
    (iluminacoes?.filter(x => x.status === 'Atenção').length || 0);

  const totalConformes = Math.max(0, totalAssets - totalVencidos - totalAtencao);
  const compliancePercentage = totalAssets > 0 ? Math.round(((totalAssets - totalVencidos) / totalAssets) * 100) : 98;

  // Métricas de Frotas (Simulação contextual elegante)
  const frotaStats = {
    totalViaturas: 9,
    operacionais: 8,
    emManutencao: 1,
    prontidaoPercent: 89,
    combustivelMedio: 82,
    pneusCriticos: 0,
    pneusAtencao: 2,
    viaturaDestaque: 'ABS-04 (Auto Bomba Salvamento)'
  };

  // Métricas CAD / CECOM
  const cadStats = {
    ocorrenciasAtivas: 1,
    ocorrenciasFinalizadas: 14,
    tempoMedioResposta: '04m 12s',
    statusLinha193: 'ONLINE & MONITORADO',
    rondaVolante: 'Ronda Setor Usina - Vtr 02 em patrulha'
  };

  // Métricas ePCR Clínico
  const epcrStats = {
    atendimentosHoje: 4,
    estabilidadeGeral: '100% ESTÁVEIS',
    manchester: {
      vermelho: 0,  // Emergência imediata
      laranja: 1,   // Muito urgente (10 min)
      amarelo: 1,   // Urgente (60 min)
      verde: 2,     // Pouco urgente (120 min)
      azul: 0       // Não urgente (240 min)
    },
    ultimoAtendimento: 'Trauma leve membro inferior - Liberado no local'
  };

  // Índice Global Ponderado do Cockpit 360°
  const indiceGlobalProntidao = Math.round((compliancePercentage * 0.4) + (frotaStats.prontidaoPercent * 0.3) + (100 * 0.15) + (95 * 0.15));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* ========================================================================= */}
      {/* 1. SELETOR DE PRÉVIA FIXO NO TOPO (STICKY CONTROLLER)                     */}
      {/* ========================================================================= */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/80 px-4 py-2.5 shadow-md">
        <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-[#1C4E26] text-[#B7F365] border border-[#68D346]/40 text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#68D346] animate-pulse" />
              <span>PRÉVIA INTERATIVA</span>
            </span>
            <div className="hidden sm:block">
              <h2 className="text-xs sm:text-sm font-extrabold text-white font-['Hanken_Grotesk'] tracking-wide">
                Home Geral Unificada • Cockpit Executivo SIGER 360°
              </h2>
            </div>
          </div>

          {/* Filtro Dinâmico de Planta / Contrato */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
              <Building2 className="w-3.5 h-3.5 text-[#68D346]" />
              <span className="text-[10px] text-slate-400 font-mono font-bold hidden md:inline">Planta:</span>
              <select
                value={selectedSiteFilter}
                onChange={(e) => setSelectedSiteFilter(e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="TODOS OS SITES (Acesso Global)" className="bg-slate-900 text-white">🌐 Todos os Sites (Global)</option>
                <option value="SALOBO" className="bg-slate-900 text-white">🏢 Salobo</option>
                <option value="ONÇA PUMA" className="bg-slate-900 text-white">🏭 Onça Puma</option>
                <option value="UNIDADE INDUSTRIAL CARAJÁS - PAR" className="bg-slate-900 text-white">🏭 Carajás - PAR</option>
              </select>
            </div>

            <ThemeToggle />

            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1"
            >
              <span>Voltar</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTEÚDO PRINCIPAL DO COCKPIT UNIFICADO                                */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-[1750px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* BANNER MESTRE DE PRONTIDÃO GLOBAL */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#121820] to-[#1C4E26]/40 text-white border border-slate-800 p-6 sm:p-8 shadow-2xl">
          {/* Brilho ambiental verde */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#68D346]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/3 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#68D346] animate-pulse shadow-[0_0_10px_#68D346]" />
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#B7F365] font-black">
                  STATUS GERAL DE COMANDO & CONTROLE
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-['Hanken_Grotesk'] tracking-tight">
                Cockpit Operacional Integrado • SIGER Master
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Visão unificada em tempo real para a planta <strong>{selectedSiteFilter}</strong>. Monitoramento simultâneo de engenharia contra incêndio, prontidão da frota 4x4, despacho CAD e regulação médica APH.
              </p>
            </div>

            {/* KPI Gigante de Prontidão Global */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shrink-0">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/10"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#68D346]"
                    strokeDasharray={`${indiceGlobalProntidao}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono text-sm sm:text-base font-black text-white">
                  {indiceGlobalProntidao}%
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Índice de Prontidão
                </span>
                <span className="text-sm sm:text-base font-extrabold text-[#B7F365] font-['Hanken_Grotesk']">
                  Complexo Homologado
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  Conformidade Global Ativa
                </span>
              </div>
            </div>
          </div>

          {/* Mini Tiras dos 4 Pilares */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">SPCI Legal</span>
                <span className="text-xs sm:text-sm font-black text-white">{compliancePercentage}% Conforme</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-[#68D346]" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Frotas 4x4</span>
                <span className="text-xs sm:text-sm font-black text-white">{frotaStats.operacionais}/{frotaStats.totalViaturas} Prontas</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">CAD / CECOM</span>
                <span className="text-xs sm:text-sm font-black text-white">{cadStats.tempoMedioResposta} TMR</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                <HeartPulse className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">ePCR Clínico</span>
                <span className="text-xs sm:text-sm font-black text-white">{epcrStats.atendimentosHoje} Atendimentos</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. BENTO GRID DOS 4 PILARES MESTRES                                       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ----------------------------------------------------------------------- */}
          {/* PILAR 1: SPCI ATIVOS & ENGENHARIA (Col 7 / 12)                          */}
          {/* ----------------------------------------------------------------------- */}
          <section className="lg:col-span-7 bg-white dark:bg-[#121418] rounded-3xl border border-slate-200/90 dark:border-white/10 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-red-600 dark:text-red-400 tracking-wider">
                      PILAR 01 • ENGENHARIA CONTRA INCÊNDIO
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-['Hanken_Grotesk']">
                      SPCI Ativos & Conformidade Legal
                    </h3>
                  </div>
                </div>

                <Link
                  href="/extintores"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5"
                >
                  <span>Módulo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Estatísticas Chave em Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-100 dark:border-zinc-800">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Total Ativos</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                    {totalAssets}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">5 categorias</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50">
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 uppercase block">Conformes</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                    {totalConformes}
                  </span>
                  <span className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80 font-mono">100% aptos</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50">
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase block">Em Atenção</span>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">
                    {totalAtencao}
                  </span>
                  <span className="text-[9px] text-amber-600/80 dark:text-amber-400/80 font-mono">Manutenção</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50">
                  <span className="text-[10px] font-mono text-red-700 dark:text-red-400 uppercase block">Vencidos</span>
                  <span className="text-xl font-black text-red-600 dark:text-red-400 font-mono mt-0.5 block">
                    {totalVencidos}
                  </span>
                  <span className="text-[9px] text-red-600/80 dark:text-red-400/80 font-mono">Prazo Crítico</span>
                </div>
              </div>

              {/* Barra de Progresso por Categoria */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-500 dark:text-zinc-400">Extintores ({extintores?.length || 0})</span>
                  <span className="text-slate-500 dark:text-zinc-400">Hidrantes ({hidrantes?.length || 0})</span>
                  <span className="text-slate-500 dark:text-zinc-400">Bombas ({bombas?.length || 0})</span>
                  <span className="text-slate-500 dark:text-zinc-400">Sinalização ({sinalizacoes?.length || 0})</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden flex">
                  <div style={{ width: '45%' }} className="bg-red-500" title="Extintores" />
                  <div style={{ width: '25%' }} className="bg-sky-500" title="Hidrantes" />
                  <div style={{ width: '15%' }} className="bg-emerald-500" title="Bombas" />
                  <div style={{ width: '15%' }} className="bg-amber-500" title="Sinalização & Iluminação" />
                </div>
              </div>

              {/* Módulos Integrantes Relocados no Pilar SPCI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <Link
                  href="/dashboard"
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase text-slate-800 dark:text-zinc-200 font-['Hanken_Grotesk'] block">
                        Dashboard & Setores
                      </span>
                      <span className="text-[9px] text-slate-500 dark:text-zinc-400 font-mono">
                        Mapa de calor e conformidade
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/gestao-ativo"
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase text-slate-800 dark:text-zinc-200 font-['Hanken_Grotesk'] block">
                        Gestão de Ativos & Planta
                      </span>
                      <span className="text-[9px] text-slate-500 dark:text-zinc-400 font-mono">
                        Setores, almoxarifado & estoque
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Rodapé de Ação Rápida */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4 text-emerald-500" />
                <span>Normas NBR 12962 / 13434 / 13714</span>
              </span>
              <Link
                href="/inspecao/novo"
                className="text-xs font-extrabold text-[#1C4E26] dark:text-[#68D346] hover:underline flex items-center gap-1"
              >
                <span>Iniciar Vistoria Rápida</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* PILAR 2: FROTAS 4x4 & RESGATE (Col 5 / 12)                              */}
          {/* ----------------------------------------------------------------------- */}
          <section className="lg:col-span-5 bg-white dark:bg-[#121418] rounded-3xl border border-slate-200/90 dark:border-white/10 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                      PILAR 02 • PRONTIDÃO DE RESGATE
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-['Hanken_Grotesk']">
                      Frotas 4x4 & Telemetria
                    </h3>
                  </div>
                </div>

                <Link
                  href="/viaturas"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5"
                >
                  <span>Frota</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Destaque de Prontidão da Frota */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-700 dark:text-emerald-400 font-bold block">
                    Prontidão Tática
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                      {frotaStats.operacionais} de {frotaStats.totalViaturas}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      Viaturas Aptas
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-mono text-xs font-black">
                  {frotaStats.prontidaoPercent}%
                </span>
              </div>

              {/* Sub-métricas: Pneus TWI e Combustível */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/frota/pneus"
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/70 hover:bg-slate-100 dark:hover:bg-zinc-900 border border-slate-100 dark:border-zinc-800 transition-colors block"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                      <Disc className="w-3.5 h-3.5 text-amber-500" />
                      Pneus TWI
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400" />
                  </div>
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono mt-1 block">
                    {frotaStats.pneusAtencao} em Atenção
                  </span>
                  <span className="text-[9px] text-emerald-600 font-mono">0 proibidos (&lt;1.6mm)</span>
                </Link>

                <Link
                  href="/frota/abastecer"
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/70 hover:bg-slate-100 dark:hover:bg-zinc-900 border border-slate-100 dark:border-zinc-800 transition-colors block"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-[#68D346]" />
                      Autonomia
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400" />
                  </div>
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono mt-1 block">
                    {frotaStats.combustivelMedio}% Média
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Diesel S10 / Arla</span>
                </Link>
              </div>
            </div>

            {/* Rodapé do Pilar */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-500 dark:text-zinc-400 truncate max-w-[200px]">
                {frotaStats.viaturaDestaque}
              </span>
              <Link
                href="/ronda"
                className="font-extrabold text-[#1C4E26] dark:text-[#68D346] hover:underline flex items-center gap-1"
              >
                <span>Despacho & Ronda</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* PILAR 3: CAD / CECOM DESPACHO & MAPA TÁTICO (Col 6 / 12)                */}
          {/* ----------------------------------------------------------------------- */}
          <section className="lg:col-span-6 bg-white dark:bg-[#121418] rounded-3xl border border-slate-200/90 dark:border-white/10 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-900/60 flex items-center justify-center text-cyan-600">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-cyan-600 dark:text-cyan-400 tracking-wider">
                      PILAR 03 • CENTRAL TÁTICA & DESPACHO
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-['Hanken_Grotesk']">
                      CAD / CECOM Operacional
                    </h3>
                  </div>
                </div>

                <Link
                  href="/mapa"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5"
                >
                  <span>Mapa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Informações de Chamadas 193 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Chamados Ativos</span>
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
                    {cadStats.ocorrenciasAtivas} Ocorrência
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">14 finalizadas no turno</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-100 dark:border-zinc-800">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Tempo de Resposta</span>
                  <span className="text-xl font-black text-cyan-600 dark:text-cyan-400 font-mono mt-1 block">
                    {cadStats.tempoMedioResposta}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Padrão Ouro (&lt; 05 min)</span>
                </div>
              </div>

              {/* Mini Radar / Mapa Tático Visual */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white relative overflow-hidden border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-[#68D346] font-bold flex items-center gap-1.5">
                    <Compass className="w-4 h-4 animate-spin text-[#68D346]" style={{ animationDuration: '10s' }} />
                    Radar de Recursos em Campo
                  </span>
                  <span className="text-[10px] text-slate-400">{cadStats.statusLinha193}</span>
                </div>

                <div className="h-24 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
                  {/* Grid de Coordenadas */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />
                  
                  {/* Pulsos simulados no mapa */}
                  <div className="absolute top-1/2 left-1/3 flex items-center gap-1 z-10">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#68D346] animate-ping" />
                    <span className="text-[9px] font-mono font-bold bg-slate-900 px-1 py-0.5 rounded border border-slate-700">Vtr 02</span>
                  </div>

                  <div className="absolute top-1/3 right-1/4 flex items-center gap-1 z-10">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[9px] font-mono font-bold bg-slate-900 px-1 py-0.5 rounded border border-slate-700">Brigada B</span>
                  </div>

                  <span className="relative z-10 text-[11px] font-mono text-slate-400">
                    Geolocalização Ativa de Viaturas & Ativos
                  </span>
                </div>
              </div>
            </div>

            {/* Rodapé do Pilar */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-500 dark:text-zinc-400 truncate">
                {cadStats.rondaVolante}
              </span>
              <Link
                href="/alertas-criticos"
                className="font-extrabold text-[#1C4E26] dark:text-[#68D346] hover:underline flex items-center gap-1"
              >
                <span>Alertas Críticos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* PILAR 4: ePCR CLÍNICO RESGATE APH (Col 6 / 12)                          */}
          {/* ----------------------------------------------------------------------- */}
          <section className="lg:col-span-6 bg-white dark:bg-[#121418] rounded-3xl border border-slate-200/90 dark:border-white/10 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-600">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                      PILAR 04 • CLÍNICO & REGULAÇÃO APH
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-['Hanken_Grotesk']">
                      ePCR Prontuário Vivo 24h
                    </h3>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-mono font-black">
                  {epcrStats.estabilidadeGeral}
                </span>
              </div>

              {/* Protocolo de Manchester (Distribuição de Risco) */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-zinc-400 font-bold block">
                  Classificação de Risco Manchester (Hoje)
                </span>
                
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30">
                    <span className="w-2 h-2 rounded-full bg-red-600 mx-auto block mb-1" />
                    <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 block">
                      {epcrStats.manchester.vermelho}
                    </span>
                    <span className="text-[8px] font-mono uppercase text-slate-500">Imediato</span>
                  </div>

                  <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30">
                    <span className="w-2 h-2 rounded-full bg-orange-500 mx-auto block mb-1" />
                    <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 block">
                      {epcrStats.manchester.laranja}
                    </span>
                    <span className="text-[8px] font-mono uppercase text-slate-500">10 min</span>
                  </div>

                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mx-auto block mb-1" />
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 block">
                      {epcrStats.manchester.amarelo}
                    </span>
                    <span className="text-[8px] font-mono uppercase text-slate-500">60 min</span>
                  </div>

                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mx-auto block mb-1" />
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                      {epcrStats.manchester.verde}
                    </span>
                    <span className="text-[8px] font-mono uppercase text-slate-500">120 min</span>
                  </div>

                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mx-auto block mb-1" />
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 block">
                      {epcrStats.manchester.azul}
                    </span>
                    <span className="text-[8px] font-mono uppercase text-slate-500">240 min</span>
                  </div>
                </div>
              </div>

              {/* Último Atendimento Registrado */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-100 dark:border-zinc-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Última Ocorrência Clínica</span>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5">
                  {epcrStats.ultimoAtendimento}
                </p>
                <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Sinais vitais normotensos • Triagem digital validada</span>
                </div>
              </div>
            </div>

            {/* Rodapé do Pilar */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-500 dark:text-zinc-400">
                Total de Atendimentos: <strong>{epcrStats.atendimentosHoje}</strong>
              </span>
              <button
                type="button"
                onClick={() => alert('Abrindo Prontuário APH Vivo')}
                className="font-extrabold text-[#1C4E26] dark:text-[#68D346] hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent"
              >
                <span>Novo Prontuário APH</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 4. FEED DE ATIVIDADES E AUDITORIA EM TEMPO REAL                           */}
        {/* ========================================================================= */}
        <section className="bg-white dark:bg-[#121418] rounded-3xl border border-slate-200/90 dark:border-white/10 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1C4E26] dark:text-[#68D346]" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk'] tracking-wider">
                Linha do Tempo de Atividades • Telemetria do Complexo
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
              Atualização Automática Contínua
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase block">Hoje, 21:40</span>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Inspeção Conforme: EXT-014</p>
                <p className="text-[10px] text-slate-500">Manganês - Subestação Elétrica</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase block">Hoje, 20:15</span>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Checklist de Viatura: VTR-02</p>
                <p className="text-[10px] text-slate-500">Prontidão operacional 100% aprovada</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <Fuel className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase block">Hoje, 18:30</span>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Abastecimento Registrado</p>
                <p className="text-[10px] text-slate-500">65 Litros Diesel S10 • Tanque Cheio</p>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
