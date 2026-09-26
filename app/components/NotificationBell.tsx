'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Truck, 
  Wrench, 
  ExternalLink, 
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useSpci } from '@/app/context/SpciContext';
import { OrdemServicoFrota } from '@/lib/types/frota';
import { 
  listPendingOSForApprovalAction, 
  quickApproveOSAction 
} from '@/app/actions/osWorkflowActions';

interface NotificationBellProps {
  onInspectOS?: (osId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onInspectOS }) => {
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
    triggerSuccessNotification 
  } = useSpci();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'os' | 'geral'>('os');
  const [pendingOS, setPendingOS] = useState<OrdemServicoFrota[]>([]);
  const [loadingOS, setLoadingOS] = useState<boolean>(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Carrega OSs pendentes de aprovação
  const fetchPendingOS = async () => {
    setLoadingOS(true);
    try {
      const res = await listPendingOSForApprovalAction(activeSite);
      if (res.success && res.data) {
        setPendingOS(res.data);
      }
    } catch (e) {
      console.warn('Erro ao carregar OS pendentes:', e);
    } finally {
      setLoadingOS(false);
    }
  };

  useEffect(() => {
    fetchPendingOS();
    // Polling a cada 30 segundos para novas aprovações
    const interval = setInterval(fetchPendingOS, 30000);
    return () => clearInterval(interval);
  }, [activeSite]);

  // Determina severidade máxima entre as pendências para cor do anel pulsante
  const hasEmergencia = pendingOS.some(os => (os.prioridade || '').toUpperCase() === 'EMERGENCIA');
  const hasUrgente = pendingOS.some(os => (os.prioridade || '').toUpperCase() === 'URGENTE');

  const unreadGeneralCount = (notifications || []).filter(n => !n.read).length;
  const totalPendingOSCount = pendingOS.length;
  const totalAlerts = totalPendingOSCount + unreadGeneralCount;

  // Cor do anel pulsante
  const ringColorClass = hasEmergencia 
    ? 'border-red-500 shadow-[0_0_14px_#ef4444] animate-ping'
    : hasUrgente
      ? 'border-amber-500 shadow-[0_0_10px_#f59e0b] animate-pulse'
      : 'border-[#68D346] shadow-[0_0_8px_#68D346]';

  const badgeBgClass = hasEmergencia 
    ? 'bg-red-600'
    : hasUrgente 
      ? 'bg-amber-500' 
      : 'bg-[#1C4E26] text-[#B7F365] border border-[#68D346]/40';

  // Aprovação rápida em 1 clique
  const handleQuickApprove = async (os: OrdemServicoFrota) => {
    setApprovingId(os.id);
    const aprovadorNome = userProfile?.name || currentUser?.displayName || 'Aprovador Autorizado';
    try {
      const res = await quickApproveOSAction(os.id, aprovadorNome, undefined, 'Aprovado via Sino do Header');
      if (res.success) {
        setPendingOS(prev => prev.filter(x => x.id !== os.id));
        triggerSuccessNotification(
          'OS Aprovada com Sucesso!',
          `A OS #${os.numero_os} da viatura ${os.viatura?.prefixo_frota || ''} foi enviada para execução na oficina.`
        );
      } else {
        alert('Erro ao aprovar: ' + (res.error || 'Erro inesperado'));
      }
    } catch (e: any) {
      alert('Erro: ' + e?.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleInspect = (osId: string) => {
    setIsOpen(false);
    if (onInspectOS) {
      onInspectOS(osId);
    } else {
      router.push(`/frota/os?id=${osId}`);
    }
  };

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Recente';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Agora mesmo';
    if (diff < 60) return `Há ${diff} min`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `Há ${hours}h`;
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="relative font-sans" ref={containerRef}>
      {/* Botão do Sino no Header */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchPendingOS();
        }}
        aria-label="Central de Notificações e Aprovações de OS"
        title="Central de Notificações e Aprovações de OS"
        className="p-2 bg-slate-100/90 dark:bg-zinc-900/90 hover:bg-slate-200/80 dark:hover:bg-zinc-800/80 active:scale-95 transition-all rounded-xl border border-slate-200/90 dark:border-zinc-800 flex items-center justify-center relative cursor-pointer text-slate-700 dark:text-zinc-300 shadow-xs"
      >
        <Bell className={`w-4 h-4 ${hasEmergencia ? 'text-red-500 animate-bounce' : hasUrgente ? 'text-amber-500' : ''}`} />

        {/* Anel Pulsante Dinâmico de Severidade */}
        {totalAlerts > 0 && (
          <>
            <span className={`absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full border ${ringColorClass}`} />
            <span className={`absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full text-[8.5px] font-black text-white shadow-md ${badgeBgClass}`}>
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          </>
        )}
      </button>

      {/* Drawer / Dropdown Flutuante */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2.5 w-[380px] sm:w-[420px] max-w-[95vw] bg-white dark:bg-[#1E2024] border border-slate-200 dark:border-[#3C3F45] shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-2xl z-50 text-left overflow-hidden"
          >
            {/* Topo do Painel */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#181A1E] border-b border-slate-150 dark:border-[#282A2F] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#68D346] animate-pulse" />
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white font-['Hanken_Grotesk']">
                  Central de Alertas & Governança
                </h4>
              </div>

              {hasEmergencia && (
                <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-mono text-[9px] font-black uppercase animate-pulse">
                  🚨 Emergência Ativa
                </span>
              )}
            </div>

            {/* Alternador de Abas */}
            <div className="flex border-b border-slate-100 dark:border-[#282A2F] bg-slate-50/50 dark:bg-[#121418] text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('os')}
                className={`flex-1 py-2.5 px-3 font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'os'
                    ? 'border-[#68D346] text-[#1C4E26] dark:text-[#B7F365] bg-white dark:bg-[#1E2024]'
                    : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>OS Pendentes</span>
                {totalPendingOSCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                    {totalPendingOSCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('geral')}
                className={`flex-1 py-2.5 px-3 font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'geral'
                    ? 'border-[#68D346] text-[#1C4E26] dark:text-[#B7F365] bg-white dark:bg-[#1E2024]'
                    : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Avisos Sistema</span>
                {unreadGeneralCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-600 text-white text-[9px] font-black">
                    {unreadGeneralCount}
                  </span>
                )}
              </button>
            </div>

            {/* CONTEÚDO DA ABA 1: ORDENS DE SERVIÇO PENDENTES */}
            {activeTab === 'os' && (
              <div className="max-h-[380px] overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
                {loadingOS ? (
                  <div className="py-10 text-center text-xs font-mono text-slate-400 animate-pulse">
                    Verificando ordens de serviço pendentes...
                  </div>
                ) : pendingOS.length === 0 ? (
                  <div className="py-10 text-center text-xs font-sans text-slate-400 space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70 mb-2" />
                    <p className="font-bold text-slate-700 dark:text-zinc-300">Nenhuma OS aguardando aprovação</p>
                    <p className="text-[10px] text-slate-400">Todas as viaturas estão operacionais ou já aprovadas.</p>
                  </div>
                ) : (
                  pendingOS.map(os => {
                    const prioridade = (os.prioridade || 'NORMAL').toUpperCase();
                    const isEmergencia = prioridade === 'EMERGENCIA';
                    const isUrgente = prioridade === 'URGENTE';
                    const valorEst = Number(os.valor_estimado || os.custo_total || 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    });

                    return (
                      <div
                        key={os.id}
                        className={`p-3 rounded-2xl border transition-all text-left space-y-2 relative overflow-hidden ${
                          isEmergencia 
                            ? 'bg-red-50/50 dark:bg-red-950/20 border-red-500/50 shadow-xs' 
                            : isUrgente 
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/50' 
                              : 'bg-slate-50/80 dark:bg-[#121418] border-slate-200 dark:border-[#3C3F45]'
                        }`}
                      >
                        {/* Linha 1: OS #, Relativo e Badge */}
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="font-black text-slate-800 dark:text-zinc-200">
                            #{os.numero_os || 'OS-SEM-NUM'}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">
                              {formatRelativeTime(os.data_abertura)}
                            </span>

                            <span className={`px-2 py-0.5 rounded-md font-bold uppercase ${
                              isEmergencia 
                                ? 'bg-red-600 text-white' 
                                : isUrgente 
                                  ? 'bg-amber-500 text-white' 
                                  : 'bg-emerald-600 text-white'
                            }`}>
                              {prioridade}
                            </span>
                          </div>
                        </div>

                        {/* Linha 2: Viatura e Defeito */}
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                            <span>{os.viatura?.prefixo_frota || 'VTR'}</span>
                            <span className="text-[10px] font-mono text-slate-500">
                              • {os.viatura?.placa || 'PLACA'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-1 line-clamp-2 leading-relaxed">
                            {os.descricao_motivo || os.descricao_servico || 'Manutenção corretiva necessária.'}
                          </p>
                        </div>

                        {/* Linha 3: Valor e Etapa Atual */}
                        <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-200/50 dark:border-white/5">
                          <span className="text-slate-500 dark:text-zinc-400">
                            Etapa 3/6: Aguardando Aprovação
                          </span>
                          <span className="font-bold text-[#1C4E26] dark:text-[#68D346]">
                            {valorEst}
                          </span>
                        </div>

                        {/* Linha 4: Botões de Ação Rápida */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={approvingId === os.id}
                            onClick={() => handleQuickApprove(os)}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#1C4E26] to-[#68D346] hover:brightness-110 active:scale-95 text-white font-mono font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer border-none disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
                            <span>{approvingId === os.id ? 'Aprovando...' : 'Aprovar Agora'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleInspect(os.id)}
                            className="py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-[#282A2F] hover:bg-slate-300 dark:hover:bg-[#3C3F45] text-slate-700 dark:text-zinc-200 font-mono font-bold text-[10px] uppercase flex items-center gap-1 transition-all cursor-pointer border-none"
                            title="Abrir detalhes completos da OS"
                          >
                            <span>Inspecionar</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* CONTEÚDO DA ABA 2: NOTIFICAÇÕES GERAIS DO SISTEMA */}
            {activeTab === 'geral' && (
              <div>
                <div className="p-2.5 bg-slate-50 dark:bg-[#121418] border-b border-slate-100 dark:border-[#282A2F] flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 dark:text-zinc-400">Alertas Gerais SPCI</span>
                  <div className="flex gap-2">
                    {unreadGeneralCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 border-none bg-transparent cursor-pointer font-bold"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Marcar Lidas</span>
                      </button>
                    )}
                    {notifications && notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-slate-400 hover:text-red-500 flex items-center gap-1 border-none bg-transparent cursor-pointer font-bold"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Limpar</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[340px] overflow-y-auto p-3 space-y-2 scrollbar-thin">
                  {!notifications || notifications.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400">
                      Nenhuma notificação do sistema
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationAsRead(notif.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                          notif.read 
                            ? 'bg-white dark:bg-[#121418] border-slate-100 dark:border-[#282A2F]' 
                            : 'bg-emerald-50/50 dark:bg-[#1C4E26]/20 border-emerald-300 dark:border-[#68D346]/40'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 dark:text-zinc-200 text-xs truncate">{notif.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">{notif.message}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-1">
                            {new Date(notif.created_at).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="text-slate-400 hover:text-red-500 border-none bg-transparent cursor-pointer p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Rodapé do Painel com Link para o Painel Completo de OS */}
            <div className="p-3 bg-slate-50 dark:bg-[#181A1E] border-t border-slate-150 dark:border-[#282A2F] text-center">
              <Link
                href="/frota/os"
                onClick={() => setIsOpen(false)}
                className="text-xs font-black text-[#1C4E26] dark:text-[#68D346] hover:underline inline-flex items-center gap-1.5 uppercase font-mono"
              >
                <span>Acessar Painel de Ordens de Serviço (Workflow 360°)</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
