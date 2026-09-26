'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSpci } from '../context/SpciContext';
import { 
  Search, 
  User as UserIcon, 
  Menu, 
  Bell, 
  Trash2, 
  CheckCheck, 
  Plus, 
  ClipboardCheck,
  Building2,
  Flame,
  Truck,
  Radio,
  HeartPulse,
  ChevronDown,
  ChevronRight,
  Clock,
  Settings,
  LogOut,
  Boxes,
  MapPin,
  Smartphone,
  Disc,
  Fuel,
  Droplet,
  Sliders,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Activity,
  ShieldAlert
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
  onLogoutClick?: () => void;
}

interface PillarModule {
  label: string;
  path: string;
  icon: any;
  desc: string;
  isRelocated?: boolean;
  action?: () => void;
}

interface PillarConfigItem {
  id: string;
  title: string;
  badge: string;
  icon: any;
  metric: string;
  modules: PillarModule[];
}

export const Header = ({ 
  onScanClick, 
  onProfileClick, 
  onMenuClick, 
  onGestaoAtivosClick,
  onLogoutClick 
}: HeaderProps) => {
  const router = useRouter();
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
    contractAssetCounts,
    extintores,
    hidrantes,
    bombas,
    sinalizacoes,
    iluminacoes
  } = useSpci();

  // Estados dos menus suspensos
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  const headerRef = useRef<HTMLDivElement>(null);

  const unreadCount = (notifications || []).filter(n => !n.read).length;
  const totalAssetsCount = (extintores?.length || 0) + (hidrantes?.length || 0) + (bombas?.length || 0) + (sinalizacoes?.length || 0) + (iluminacoes?.length || 0);

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveFlyout(null);
        setShowUserDropdown(false);
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fechar dropdowns com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveFlyout(null);
        setShowUserDropdown(false);
        setShowNotifs(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Configuração dos 4 Pilares Mestres do SIGER
  const pillarsConfig: Record<string, PillarConfigItem> = {
    spci: {
      id: 'spci',
      title: 'SPCI Ativos',
      badge: 'ENGENHARIA CONTRA INCÊNDIO',
      icon: Flame,
      metric: `${totalAssetsCount} Ativos`,
      modules: [
        { label: 'Extintores & Vistorias NBR 12962', path: '/extintores', icon: Flame, desc: 'Inspeções mensais, recargas e selos Inmetro' },
        { label: 'Hidrantes, Abrigos & Mangueiras', path: '/hidrantes', icon: Droplet, desc: 'Lances, esguichos e testes de estanqueidade' },
        { label: 'Casa de Bombas & Automação', path: '/bombas', icon: Sliders, desc: 'Bombas Jockey/Diesel e pressostatos' },
        { label: 'Sinalização Fotoluminescente', path: '/sinalizacao', icon: AlertTriangle, desc: 'Rotas de fuga e conformidade NBR 13434' },
        { label: 'Iluminação de Emergência', path: '/iluminacao', icon: Lightbulb, desc: 'Blocos autônomos e autonomia de baterias' },
        { 
          label: 'Gestão de Ativo & Estoque', 
          path: '/gestao-ativo', 
          icon: Boxes, 
          desc: 'Almoxarifado, movimentações e substituições', 
          isRelocated: true,
          action: onGestaoAtivosClick 
        },
      ]
    },
    frotas: {
      id: 'frotas',
      title: 'Frotas 4x4',
      badge: 'PRONTIDÃO & RESGATE',
      icon: Truck,
      metric: 'Prontidão Operacional',
      modules: [
        { label: 'Catálogo & Gestão de Frota', path: '/viaturas', icon: Truck, desc: 'Status de prontidão, viaturas operacionais e reserva' },
        { label: 'Despacho & Ronda Campo', path: '/ronda', icon: Smartphone, desc: 'Checklists embarcados e vistorias volantes', isRelocated: true },
        { label: 'Metrologia de Pneus (TWI)', path: '/frota/pneus', icon: Disc, desc: 'Mapeamento digital de sulcos e segurança CONTRAN' },
        { label: 'Registro de Abastecimento', path: '/frota/abastecer', icon: Fuel, desc: 'Controle de autonomia e consumo de combustível' },
      ]
    },
    cad: {
      id: 'cad',
      title: 'CAD / CECOM',
      badge: 'DESPACHO & CENTRAL TÁTICA',
      icon: Radio,
      metric: 'Canal 193 Ativo',
      modules: [
        { label: 'Central de Despacho & Monitoramento', path: '/dashboard', icon: Radio, desc: 'Distribuição em tempo real de ocorrências e equipes' },
        { label: 'Mapa Operacional Tático', path: '/mapa', icon: MapPin, desc: 'Geolocalização de ativos, viaturas e rotas', isRelocated: true },
        { label: 'Alertas Críticos de Prontidão', path: '/alertas-criticos', icon: ShieldAlert, desc: 'Intercorrências imediatas e bloqueios operacionais' },
      ]
    },
    epcr: {
      id: 'epcr',
      title: 'ePCR Clínico',
      badge: 'RESGATE & PRONTUÁRIO APH',
      icon: HeartPulse,
      metric: 'APH Vivo 24h',
      modules: [
        { label: 'Prontuário de Atendimento APH', path: '/dashboard', icon: HeartPulse, desc: 'Preenchimento digital à beira-leito com biometria' },
        { label: 'Triagem Manchester & Gravidade', path: '/dashboard', icon: AlertTriangle, desc: 'Classificação por cores de risco e tempo de resposta' },
        { label: 'Curvas Vitais & Telemetria', path: '/dashboard', icon: Activity, desc: 'Monitoramento dinâmico de sinais vitais' },
      ]
    }
  };

  return (
    <header 
      ref={headerRef}
      className="w-full bg-white/95 dark:bg-[#121418]/95 backdrop-blur-2xl border-b border-slate-200/90 dark:border-white/10 px-4 sm:px-6 lg:px-8 h-17 shrink-0 shadow-xs z-40 select-none font-sans sticky top-0 transition-colors duration-200 flex items-center justify-between"
    >
      {/* ========================================================================= */}
      {/* 1. LADO ESQUERDO: HAMBURGER MOBILE + LOGO OFICIAL JIMMP INFO             */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-3.5">
        {onMenuClick && (
          <button 
            type="button"
            onClick={onMenuClick}
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
            aria-label="Abrir menu de navegação"
            title="Menu Rápido de Módulos"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link href="/dashboard" className="flex items-center gap-3 group">
          <Image 
            src="/assets/branding/logo-jimmp-info.png" 
            alt="Logo JIMMP Info" 
            width={118} 
            height={36} 
            priority
            className="h-9 w-auto object-contain transition-transform group-hover:scale-105 filter drop-shadow-[0_2px_8px_rgba(104,211,70,0.25)]" 
          />
          <div className="border-l border-slate-300 dark:border-zinc-800 pl-3.5 hidden xl:block text-left">
            <span className="text-[9.5px] font-mono font-black text-[#1C4E26] dark:text-[#68D346] tracking-[0.25em] block uppercase leading-none">
              COCKPIT
            </span>
            <span className="text-xs font-black text-slate-900 dark:text-white font-['Hanken_Grotesk'] tracking-wider leading-none mt-1 block">
              SIGER MASTER
            </span>
          </div>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTRO: DOCK FLUTUANTE DOS 4 PILARES COM MENUS SUSPENSOS (ESTILO A)    */}
      {/* ========================================================================= */}
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
                      className="absolute left-1/2 -translate-x-1/2 mt-3 w-88 rounded-2xl bg-white/98 dark:bg-zinc-950/98 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-4 space-y-3 z-50 text-left"
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
                              onClick={() => {
                                setActiveFlyout(null);
                                if (mod.action) {
                                  mod.action();
                                } else {
                                  router.push(mod.path);
                                }
                              }}
                              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <ModIcon className="w-3.5 h-3.5 text-[#1C4E26] dark:text-[#68D346]" />
                                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-[#1C4E26] dark:group-hover:text-[#68D346] transition-colors">
                                    {mod.label}
                                  </span>
                                </div>
                                {mod.isRelocated && (
                                  <span className="text-[8.5px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                    MÓDULO
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

      {/* ========================================================================= */}
      {/* 3. LADO DIREITO: BUSCA + TEMA + REDE + SINO + MENU DO OPERADOR           */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        
        {/* Botão de Busca Rápida / QR Scan */}
        <button 
          type="button"
          onClick={onScanClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 hover:bg-slate-200/80 dark:hover:bg-zinc-800/80 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer shadow-xs active:scale-95"
          aria-label="Buscar ou Escanear Ativo"
          title="Buscar ou Escanear Ativo (Scan QR)"
        >
          <Search className="w-3.5 h-3.5 text-[#1C4E26] dark:text-[#68D346]" />
          <span className="hidden sm:inline">Scan / Buscar</span>
        </button>

        {/* Alternador de Tema Claro/Escuro */}
        <ThemeToggle />

        {/* Indicador Elegante de Rede / Sincronização SPCI */}
        <NetworkSyncIndicator />

        {/* Sino de Notificações */}
        {currentUser && (
          <div className="relative">
            <button 
              type="button"
              onClick={() => {
                setShowNotifs(!showNotifs);
                setShowUserDropdown(false);
                setActiveFlyout(null);
              }}
              className="p-2 bg-slate-100/90 dark:bg-zinc-900/90 hover:bg-slate-200/80 dark:hover:bg-zinc-800/80 active:scale-95 transition-all rounded-xl border border-slate-200/90 dark:border-zinc-800 flex items-center justify-center relative cursor-pointer text-slate-600 dark:text-zinc-300 shadow-xs"
              aria-label="Abrir notificações"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[8px] font-black text-white shadow-md animate-pulse">
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
                  className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-4 z-50 text-slate-800 dark:text-zinc-100 text-left font-sans"
                >
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-150 dark:border-zinc-800 mb-2">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>🔔</span> Notificações
                    </h4>
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllNotificationsAsRead}
                          className="text-[9px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 border-none bg-transparent cursor-pointer"
                          title="Marcar todas como lidas"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {notifications && notifications.length > 0 && (
                        <button 
                          onClick={clearAllNotifications}
                          className="text-[9px] font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 border-none bg-transparent cursor-pointer"
                          title="Limpar tudo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {!notifications || notifications.length === 0 ? (
                      <div className="py-8 text-center text-[10px] text-slate-400 font-sans">
                        Nenhuma notificação recebida
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
                            notif.read ? 'bg-white dark:bg-zinc-900/60 border-slate-100 dark:border-zinc-800' : 'bg-slate-50/60 dark:bg-zinc-900 border-red-200 dark:border-red-900/60'
                          }`}
                        >
                          {!notif.read && (
                            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-red-600" />
                          )}
                          
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            notif.type === 'cadastro' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600' :
                            notif.type === 'inspecao' ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                          }`}>
                            {notif.type === 'cadastro' ? <Plus className="w-3.5 h-3.5" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
                          </div>
                          
                          <div className="min-w-0 flex-1 leading-normal pr-3">
                            <p className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 truncate">{notif.title}</p>
                            <p className="text-[9px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">{notif.message}</p>
                            <p className="text-[8px] text-slate-400 font-mono mt-1">
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

        {/* ===================================================================== */}
        {/* 4. MENU DO OPERADOR (ONDE PLANTA, LOGS, CONFIG E SAIR FORAM REALOCADOS)*/}
        {/* ===================================================================== */}
        {currentUser && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowNotifs(false);
                setActiveFlyout(null);
              }}
              className="flex items-center gap-2.5 border-l border-slate-200 dark:border-zinc-800 pl-3 cursor-pointer p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-all"
              id="header-user-profile-active"
              aria-label="Abrir menu do operador"
            >
              {userProfile?.logoUrl ? (
                <div className="w-8 h-8 rounded-xl border border-red-500/40 bg-white p-0.5 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                  <img 
                    alt={`Logo corporativo de ${userProfile?.name || 'técnico'}`} 
                    className="w-full h-full object-contain rounded-lg" 
                    src={userProfile.logoUrl}
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : currentUser.photoURL ? (
                <div className="w-8 h-8 rounded-xl border border-[#68D346]/40 bg-white p-0.5 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                  <img 
                    alt={`Foto de perfil de ${userProfile?.name || 'técnico'}`} 
                    className="w-full h-full object-cover rounded-lg" 
                    src={currentUser.photoURL}
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div 
                  className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1C4E26] to-[#68D346] text-[#B7F365] font-black flex items-center justify-center text-xs uppercase border border-[#68D346]/40 shrink-0 shadow-xs"
                  aria-hidden="true"
                >
                  {currentUser.email?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wide truncate max-w-[125px] font-['Hanken_Grotesk']">
                  {userProfile?.name || currentUser.displayName || 'Técnico SIGER'}
                </p>
                <p className="text-[9px] font-mono text-[#1C4E26] dark:text-[#68D346] uppercase tracking-wider font-bold">
                  {userProfile?.role === 'Desenvolvedor'
                    ? '💻 Desenvolvedor'
                    : userProfile?.role === 'Administrador'
                      ? '🛡️ Administrador'
                      : '👷 Técnico de Campo'}
                </p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu Suspenso do Usuário com Planta, Logs, Configurações e Logout */}
            <AnimatePresence>
              {showUserDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-76 rounded-2xl bg-white/98 dark:bg-zinc-950/98 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-2.5 z-50 text-left space-y-2 font-sans"
                >
                  {/* Identificação do Operador */}
                  <div className="p-2.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk']">
                      {userProfile?.name || currentUser.displayName || 'Operador SIGER'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono truncate mt-0.5">
                      {currentUser.email}
                    </p>
                  </div>

                  {/* ================================================================= */}
                  {/* REALOCAÇÃO 1: ELEMENTO "PLANTA / UNIDADE INDUSTRIAL"              */}
                  {/* ================================================================= */}
                  <div className="p-3 bg-slate-50/90 dark:bg-zinc-900/90 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] uppercase text-slate-500 dark:text-zinc-400 font-mono font-bold flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#1C4E26] dark:text-[#68D346]" />
                        Planta Operacional
                      </span>
                      <span className="flex items-center gap-1 text-[9px] font-mono text-[#1C4E26] dark:text-[#68D346] font-bold">
                        <span className="w-2 h-2 rounded-full bg-[#68D346] animate-pulse" />
                        ATIVO
                      </span>
                    </div>

                    {!isGlobalScope ? (
                      <div className="font-mono text-xs font-black text-slate-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 leading-tight">
                        {userProfile?.site || activeSite || 'UNIDADE INDUSTRIAL CARAJÁS - PAR'}
                      </div>
                    ) : (
                      <select
                        value={activeSite}
                        onChange={(e) => setActiveSite(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-zinc-100 rounded-lg p-2 focus:outline-none cursor-pointer"
                        aria-label="Selecionar Contrato Ativo"
                      >
                        <option value="TODOS OS SITES (Acesso Global)">🌐 TODOS OS SITES ({contractAssetCounts?.total ?? 0})</option>
                        <option value="SALOBO">🏢 SALOBO ({contractAssetCounts?.salobo ?? 0})</option>
                        <option value="ONÇA PUMA">🏭 ONÇA PUMA ({contractAssetCounts?.oncaPuma ?? 0})</option>
                        <option value="UNIDADE INDUSTRIAL CARAJÁS - PAR">🏭 UNIDADE INDUSTRIAL CARAJÁS - PAR</option>
                      </select>
                    )}
                  </div>

                  {/* ================================================================= */}
                  {/* REALOCAÇÃO 2: LOGS DO SISTEMA E CONFIGURAÇÕES                     */}
                  {/* ================================================================= */}
                  <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                    <Link
                      href="/logs"
                      onClick={() => setShowUserDropdown(false)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 text-xs font-bold text-slate-800 dark:text-zinc-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-[#1C4E26] dark:text-[#68D346]" />
                        <span>Logs do Sistema & Auditoria</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>

                    <Link
                      href="/configuracoes"
                      onClick={() => setShowUserDropdown(false)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 text-xs font-bold text-slate-800 dark:text-zinc-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                        <span>Configurações Gerais</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onProfileClick();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 text-xs font-bold text-slate-800 dark:text-zinc-200 cursor-pointer border-none bg-transparent transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserIcon className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                        <span>Perfil Técnico</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>

                  {/* ================================================================= */}
                  {/* REALOCAÇÃO 3: SAIR DO COCKPIT                                     */}
                  {/* ================================================================= */}
                  <div className="pt-1.5 border-t border-slate-100 dark:border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        if (onLogoutClick) {
                          onLogoutClick();
                        }
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold text-red-600 dark:text-red-400 cursor-pointer border-none bg-transparent transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="font-['Hanken_Grotesk'] uppercase tracking-wider">Sair do Cockpit</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                        ESC
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Notificação */}
      <AnimatePresence>
        {selectedNotif && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 font-mono select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              className="w-full max-w-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-6 relative text-slate-800 dark:text-zinc-100"
            >
              <button 
                onClick={() => setSelectedNotif(null)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-2 py-0.5 text-xs font-bold cursor-pointer rounded-lg"
              >
                ✕
              </button>

              <div className="flex gap-3 items-start mb-4">
                <div className={`p-2 rounded-xl shrink-0 ${
                  selectedNotif.type === 'cadastro' ? 'bg-emerald-50 text-emerald-600' :
                  selectedNotif.type === 'inspecao' ? 'bg-cyan-50 text-cyan-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {selectedNotif.type === 'cadastro' ? <Plus className="w-5 h-5" /> : <ClipboardCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">{selectedNotif.title}</h3>
                  <p className="text-[9px] text-slate-450 mt-0.5 font-mono">{new Date(selectedNotif.created_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs font-sans text-slate-650 dark:text-zinc-300 leading-relaxed">
                <p>{selectedNotif.message}</p>
                
                {selectedNotif.patrimonio && (
                  <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 p-2.5 rounded-xl font-mono text-[9px] flex justify-between items-center">
                    <span className="font-extrabold text-slate-500 uppercase">Patrimônio Identificado:</span>
                    <span className="font-bold text-slate-800 dark:text-white bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded">{selectedNotif.patrimonio}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-6 font-mono">
                <button 
                  onClick={() => {
                    deleteNotification(selectedNotif.id);
                    setSelectedNotif(null);
                  }}
                  className="flex-1 py-2 text-[10px] uppercase font-bold text-slate-550 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900 bg-white dark:bg-zinc-800 cursor-pointer rounded-xl transition-all"
                >
                  Excluir Notificação
                </button>
                <button 
                  onClick={() => setSelectedNotif(null)}
                  className="flex-1 py-2 text-[10px] uppercase font-bold text-white bg-slate-800 hover:bg-slate-700 shadow-md transition-all cursor-pointer rounded-xl border-none"
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
