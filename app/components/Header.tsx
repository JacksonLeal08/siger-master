'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSpci } from '../context/SpciContext';
import { 
  Search, 
  Menu, 
  Bell, 
  Trash2, 
  CheckCheck, 
  Plus, 
  ClipboardCheck, 
  Boxes, 
  Building2, 
  ChevronDown, 
  Flame, 
  Truck, 
  Radio, 
  HeartPulse, 
  ArrowRight, 
  Sparkles, 
  User, 
  QrCode, 
  ShieldCheck, 
  Activity,
  Layers,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationItem } from '@/lib/types';
import ThemeToggle from './ThemeToggle';
import NetworkSyncIndicator from './NetworkSyncIndicator';

interface HeaderProps {
  onScanClick: () => void;
  onProfileClick: () => void;
  onMenuClick?: () => void;
  onGestaoAtivosClick?: () => void;
}

export const Header = ({ onScanClick, onProfileClick, onMenuClick, onGestaoAtivosClick }: HeaderProps) => {
  const { 
    currentUser, 
    userProfile, 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    deleteNotification, 
    clearAllNotifications, 
    activeSite, 
    setActiveSite, 
    isGlobalScope, 
    contractAssetCounts 
  } = useSpci();

  const [showNotifs, setShowNotifs] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  // Fechar flyout ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setActivePillar(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dados dos 4 Pilares Centrais do SIGER Master
  const pillarsConfig = {
    spci: {
      id: 'spci',
      title: 'SPCI Ativos',
      badge: 'Prevenção & Combate',
      icon: Flame,
      metric: 'Conformidade Metrológica',
      items: [
        { label: 'Gestão de Extintores NBR 12962', desc: 'Rastreabilidade e vistorias offline-first', action: 'extintores' },
        { label: 'Rede de Hidrantes & Mangueiras', desc: 'Inspeção de testes hidrostáticos e vazão', action: 'hidrantes' },
        { label: 'Casa de Bombas & Automação', desc: 'Telemetria de pressão, diesel e recalque', action: 'bombas' },
        { label: 'Checklists Operacionais de Campo', desc: 'Formulários digitais com fotos e GPS', action: 'checklists' },
      ]
    },
    frotas: {
      id: 'frotas',
      title: 'Frotas 4x4',
      badge: 'Prontidão Tática',
      icon: Truck,
      metric: 'Prontidão Operacional',
      items: [
        { label: 'Viaturas de Resgate 4x4', desc: 'Telemetria automotiva, diesel e hodômetro', action: 'viaturas' },
        { label: 'Ambulâncias Tipo B / UTI Móvel', desc: 'Desinfecção e checagem de suprimentos', action: 'ambulancias' },
        { label: 'Controle de Pneus & TWI', desc: 'Medição milimétrica de sulcos e segurança', action: 'pneus' },
        { label: 'Terminal de Abastecimento', desc: 'Registro de consumo e passagens de turno', action: 'abastecimento' },
      ]
    },
    cad: {
      id: 'cad',
      title: 'CAD / CECOM',
      badge: 'Comando & Despacho',
      icon: Radio,
      metric: 'Tempo de Resposta em Tempo Real',
      items: [
        { label: 'Mesa de Despacho Tático', desc: 'Triagem de ocorrências e acionamento de equipes', action: 'despacho' },
        { label: 'Mapa Operacional Parauapebas', desc: 'Localização geoespacial e rotas de emergência', action: 'mapa' },
        { label: 'Comunicação VHF & Telemetria', desc: 'Canais de rádio dedicados e status QAP', action: 'radio' },
        { label: 'Histórico de Atendimentos', desc: 'Relatórios de tempos e desfecho das missões', action: 'historico' },
      ]
    },
    epcr: {
      id: 'epcr',
      title: 'ePCR Clínico',
      badge: 'Prontuário APH Vivo',
      icon: HeartPulse,
      metric: 'Regulação & Assistência',
      items: [
        { label: 'Prontuário de Atendimento APH', desc: 'Registro clínico à beira-leito e dados vitais', action: 'prontuario' },
        { label: 'Triagem e Escala de Manchester', desc: 'Classificação por gravidade e tempo clínico', action: 'triagem' },
        { label: 'Sinais Vitais & Curvas ECG', desc: 'Pressão, oximetria e temperatura monitorados', action: 'sinais' },
        { label: 'Passagem de Plantão Integrada', desc: 'Transmissão segura de prontuários com regulação', action: 'passagem' },
      ]
    }
  };

  const handlePillarItemClick = (action: string) => {
    setActivePillar(null);
    if (action === 'extintores' || action === 'checklists') {
      onScanClick();
    } else if (action === 'viaturas' || action === 'pneus' || action === 'abastecimento') {
      window.location.href = '/terminal/abastecer';
    } else {
      onScanClick();
    }
  };

  return (
    <header className="hidden md:flex w-full items-center justify-between px-5 sm:px-6 lg:px-8 h-20 shrink-0 select-none font-sans relative z-40 bg-white/85 dark:bg-[#121418]/85 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.45)] transition-colors">
      
      {/* ========================================================================= */}
      {/* ZONA 1: IDENTIDADE INSTITUCIONAL & SELETOR DE CONTRATO (ESQUERDA)         */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-4 sm:gap-5">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer border-none bg-transparent text-slate-600 dark:text-zinc-300"
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Logotipo Oficial JIMMP Info + Identificação SIGER Master */}
        <Link href="/" className="flex items-center gap-3.5 group cursor-pointer" title="Ir para a Home do SIGER Master">
          <Image 
            src="/assets/branding/logo-jimmp-info.png" 
            alt="Logo JIMMP Info" 
            width={135} 
            height={38} 
            priority
            className="h-10 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_2px_10px_rgba(104,211,70,0.3)]" 
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

        {/* Cápsula Executiva do Contrato / Planta Operacional Ativa */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200/90 dark:border-zinc-800 text-xs shadow-xs transition-all">
          <span className="w-2 h-2 rounded-full bg-[#68D346] animate-pulse shadow-[0_0_8px_#68D346]" />
          <Building2 className="w-3.5 h-3.5 text-[#1C4E26] dark:text-[#68D346] shrink-0" />
          <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 font-mono font-bold hidden xl:inline">
            Planta:
          </span>

          {!isGlobalScope ? (
            <span className="font-mono text-[11px] font-black text-slate-800 dark:text-zinc-200 tracking-wide truncate max-w-[170px]">
              {userProfile?.site || activeSite || 'CARREGANDO...'}
            </span>
          ) : (
            <select
              value={activeSite}
              onChange={(e) => setActiveSite(e.target.value)}
              className="bg-transparent border-none text-[11px] font-mono font-bold text-slate-800 dark:text-zinc-200 focus:outline-none cursor-pointer py-0.5 pr-1 max-w-[200px] truncate"
              aria-label="Selecionar Contrato Ativo"
            >
              <option value="TODOS OS SITES (Acesso Global)" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 font-medium">
                🌐 TODOS OS SITES ({contractAssetCounts?.total ?? 0} Ativos)
              </option>
              <option value="SALOBO" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 font-medium">
                🏢 SALOBO ({contractAssetCounts?.salobo ?? 0} Ativos)
              </option>
              <option value="ONÇA PUMA" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 font-medium">
                🏭 ONÇA PUMA ({contractAssetCounts?.oncaPuma ?? 0} Ativos)
              </option>
            </select>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONA 2: A ILHA FLUTUANTE DOS 4 PILARES (CENTRO DA BARRA)                   */}
      {/* ========================================================================= */}
      <div ref={flyoutRef} className="relative hidden md:flex items-center">
        <nav className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200/90 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          {Object.values(pillarsConfig).map((pilar) => {
            const Icon = pilar.icon;
            const isOpened = activePillar === pilar.id;
            return (
              <div key={pilar.id} className="relative">
                <button
                  type="button"
                  onClick={() => setActivePillar(isOpened ? null : pilar.id)}
                  className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-xs font-black uppercase font-['Hanken_Grotesk'] tracking-wider transition-all duration-200 cursor-pointer ${
                    isOpened
                      ? 'bg-gradient-to-r from-[#1C4E26] via-[#246831] to-[#1C4E26] text-[#B7F365] shadow-[0_0_15px_rgba(104,211,70,0.35)] border border-[#68D346]/50'
                      : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-colors ${isOpened ? 'text-[#B7F365]' : 'text-[#1C4E26] dark:text-[#68D346]'}`} />
                  <span className="hidden lg:inline">{pilar.title}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpened ? 'rotate-180 text-[#B7F365]' : 'text-slate-400 dark:text-zinc-500'}`} />
                </button>

                {/* Flyout Dropdown de Ações Rápidas do Pilar */}
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
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handlePillarItemClick(item.action)}
                            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors group cursor-pointer border-none bg-transparent"
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
                          </button>
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

      {/* ========================================================================= */}
      {/* ZONA 3: SUÍTE DE CONTROLES RÁPIDOS & PERFIL EXECUTIVO (DIREITA)            */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        
        {/* Botão de Estoque de Ativos */}
        {onGestaoAtivosClick && (
          <button 
            type="button"
            onClick={onGestaoAtivosClick}
            className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-[#1C4E26] dark:hover:text-[#68D346] text-xs font-mono font-bold uppercase transition-all cursor-pointer shadow-xs active:scale-95"
            title="Abrir Gestão de Ativos e Estoque"
          >
            <Boxes className="w-3.5 h-3.5 text-[#1C4E26] dark:text-[#68D346]" />
            <span>Estoque</span>
          </button>
        )}

        {/* Botão de Busca Spotlight com Atalho Ctrl+K */}
        <button 
          type="button"
          onClick={onScanClick}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-[#1C4E26] dark:hover:text-[#68D346] text-xs font-mono font-bold uppercase transition-all cursor-pointer shadow-xs active:scale-95"
          title="Buscar Ativo ou Escanear QR Code (Ctrl + K)"
        >
          <Search className="w-3.5 h-3.5 text-[#1C4E26] dark:text-[#68D346]" />
          <span className="hidden sm:inline">Buscar...</span>
          <kbd className="hidden lg:inline text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 font-mono">
            Ctrl+K
          </kbd>
        </button>

        {/* Indicador de Rede / Sincronização */}
        <NetworkSyncIndicator />

        {/* Alternador de Tema Claro / Escuro */}
        <ThemeToggle />

        {/* Sino de Notificações com Badge Neon */}
        {currentUser && (
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-[#1C4E26] dark:hover:text-[#68D346] transition-all cursor-pointer relative shadow-xs active:scale-95"
              aria-label="Abrir central de notificações"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#1C4E26] text-[#B7F365] border border-[#68D346]/60 text-[9px] font-mono font-black shadow-[0_0_8px_#68D346] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            
            <AnimatePresence>
              {showNotifs && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="absolute right-0 mt-3 w-84 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] rounded-2xl p-4 z-50 text-slate-800 dark:text-zinc-100 text-left font-sans"
                >
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-zinc-800 mb-2">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 font-['Hanken_Grotesk']">
                      <span>🔔</span> Notificações Operacionais
                    </h4>
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllNotificationsAsRead}
                          className="text-[9px] font-bold font-mono text-slate-500 hover:text-[#68D346] flex items-center gap-1 border-none bg-transparent cursor-pointer"
                          title="Marcar todas como lidas"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {notifications && notifications.length > 0 && (
                        <button 
                          onClick={clearAllNotifications}
                          className="text-[9px] font-bold font-mono text-slate-500 hover:text-red-500 flex items-center gap-1 border-none bg-transparent cursor-pointer"
                          title="Limpar tudo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {!notifications || notifications.length === 0 ? (
                      <div className="py-8 text-center text-[11px] text-slate-400 font-sans">
                        Nenhuma notificação pendente
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            markNotificationAsRead(notif.id);
                            setSelectedNotif(notif);
                          }}
                          className={`p-2.5 rounded-xl border transition-all duration-200 flex items-start gap-2.5 relative cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900 group ${
                            notif.read ? 'bg-transparent border-slate-200 dark:border-zinc-800' : 'bg-[#1C4E26]/10 border-[#68D346]/40'
                          }`}
                        >
                          {!notif.read && (
                            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#68D346] shadow-[0_0_6px_#68D346]" />
                          )}
                          
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            notif.type === 'cadastro' ? 'bg-[#1C4E26]/20 text-[#68D346]' :
                            notif.type === 'inspecao' ? 'bg-cyan-950/40 text-cyan-400' : 'bg-amber-950/40 text-amber-400'
                          }`}>
                            {notif.type === 'cadastro' ? <Plus className="w-3.5 h-3.5" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
                          </div>
                          
                          <div className="min-w-0 flex-1 leading-normal pr-3">
                            <p className="text-[11px] font-bold text-slate-900 dark:text-zinc-100 truncate">{notif.title}</p>
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">{notif.message}</p>
                            <p className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-mono mt-1">
                              {new Date(notif.created_at).toLocaleTimeString('pt-BR')}
                            </p>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 border-none bg-transparent cursor-pointer p-0.5 self-center transition-opacity"
                            title="Excluir"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Cápsula Executiva de Perfil do Operador */}
        {currentUser ? (
          <div 
            onClick={onProfileClick}
            className="flex items-center gap-2.5 border-l border-slate-200 dark:border-zinc-800 pl-3.5 cursor-pointer p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all hover:scale-[1.02]"
            title={`Editar Perfil: ${currentUser.email}`}
            id="header-user-profile-active"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onProfileClick(); }}
          >
            {userProfile?.logoUrl ? (
              <div className="w-8 h-8 rounded-xl border border-[#68D346]/40 bg-white p-0.5 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                <img 
                  alt={`Logo de ${userProfile?.name || 'técnico'}`} 
                  className="w-full h-full object-contain rounded-lg" 
                  src={userProfile.logoUrl}
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : currentUser.photoURL ? (
              <div className="w-8 h-8 rounded-xl border border-[#68D346]/40 bg-white p-0.5 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                <img 
                  alt={`Foto de ${userProfile?.name || 'técnico'}`} 
                  className="w-full h-full object-cover rounded-lg" 
                  src={currentUser.photoURL}
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div 
                className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1C4E26] to-[#68D346] text-white font-mono font-bold flex items-center justify-center text-xs uppercase shadow-xs shrink-0 border border-[#68D346]/40"
                aria-hidden="true"
              >
                {currentUser.email?.charAt(0)}
              </div>
            )}
            
            <div className="hidden sm:block text-left leading-tight">
              <span className="sr-only">Conectado como:</span>
              <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wide truncate max-w-[130px] font-['Hanken_Grotesk']">
                {userProfile?.name || currentUser.displayName || 'Operador SIGER'}
              </p>
              <p className="text-[9px] font-mono text-[#1C4E26] dark:text-[#68D346] uppercase tracking-wider font-bold">
                {userProfile?.role === 'Desenvolvedor'
                  ? '💻 Desenvolvedor'
                  : userProfile?.role === 'Administrador'
                    ? '🛡️ Administrador'
                    : '👷 Técnico de Campo'}
              </p>
            </div>
          </div>
        ) : null}

      </div>

      {/* Modal de Detalhes da Notificação */}
      <AnimatePresence>
        {selectedNotif && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 font-mono select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl p-6 relative text-slate-800 dark:text-zinc-100"
            >
              <button 
                onClick={() => setSelectedNotif(null)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2 py-0.5 text-xs font-bold cursor-pointer rounded-lg"
              >
                ✕
              </button>

              <div className="flex gap-3 items-start mb-4">
                <div className={`p-2 rounded-xl shrink-0 ${
                  selectedNotif.type === 'cadastro' ? 'bg-[#1C4E26]/20 text-[#68D346]' :
                  selectedNotif.type === 'inspecao' ? 'bg-cyan-950/40 text-cyan-400' : 'bg-amber-950/40 text-amber-400'
                }`}>
                  {selectedNotif.type === 'cadastro' ? <Plus className="w-5 h-5" /> : <ClipboardCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-['Hanken_Grotesk']">{selectedNotif.title}</h3>
                  <p className="text-[9.5px] text-slate-400 font-mono mt-0.5">{new Date(selectedNotif.created_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-zinc-800 text-xs font-sans text-slate-600 dark:text-zinc-300 leading-relaxed text-left">
                <p>{selectedNotif.message}</p>
                
                {selectedNotif.patrimonio && (
                  <div className="bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl font-mono text-[9.5px] flex justify-between items-center">
                    <span className="font-extrabold text-slate-500 dark:text-zinc-400 uppercase">Patrimônio Identificado:</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded">{selectedNotif.patrimonio}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-200 dark:border-zinc-800 mt-6 font-mono">
                <button 
                  onClick={() => {
                    deleteNotification(selectedNotif.id);
                    setSelectedNotif(null);
                  }}
                  className="flex-1 py-2 text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer rounded-xl transition-all"
                >
                  Excluir Notificação
                </button>
                <button 
                  onClick={() => setSelectedNotif(null)}
                  className="flex-1 py-2 text-[10px] uppercase font-bold text-[#B7F365] bg-gradient-to-r from-[#1C4E26] to-[#246831] border border-[#68D346]/50 shadow-md transition-all cursor-pointer rounded-xl"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};
