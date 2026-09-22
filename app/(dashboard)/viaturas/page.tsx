'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import { useSpci } from '@/app/context/SpciContext';
import { 
  Viatura, 
  Abastecimento, 
  InspecaoPneu, 
  OrdemServicoFrota, 
  OficinaPrestador,
  FrotaKpisSummary, 
  TipoVeiculo, 
  StatusOperacionalViatura 
} from '@/lib/types/frota';
import { 
  listViaturasAction, 
  getFrotaKpisAction, 
  listInspecoesPneusAction,
  listAbastecimentosAction,
  listOficinasAction,
  listOrdensServicoAction
} from '@/app/actions/frotaActions';
import { MaintenancePlanEngine } from '@/lib/maintenancePlanEngine';
import { TwiEducationalCard } from '@/app/components/frota/TwiEducationalCard';
import { TireMapInspection } from '@/app/components/frota/TireMapInspection';
import { MapeamentoPneusModal } from '@/app/components/frota/MapeamentoPneusModal';
import { ViaturaCard } from '@/app/components/frota/ViaturaCard';
import { ViaturaModal } from '@/app/components/frota/ViaturaModal';
import { AbastecimentoModal } from '@/app/components/frota/AbastecimentoModal';
import { OrdemServicoModal } from '@/app/components/frota/OrdemServicoModal';
import { OficinaModal } from '@/app/components/frota/OficinaModal';
import { TerminalMobileShareModal } from '@/app/components/frota/TerminalMobileShareModal';
import { ChecklistsFrotaTab } from '@/app/components/frota/ChecklistsFrotaTab';
import { OrdensServicoFrotaTab } from '@/app/components/frota/OrdensServicoFrotaTab';
import { FrotaDockBar, MinimizedWindow } from '@/app/components/frota/FrotaDockBar';
import { 
  Truck, 
  Plus, 
  Search, 
  Fuel, 
  Wrench, 
  Disc, 
  ClipboardCheck,
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  FileText, 
  RotateCcw, 
  Sparkles,
  MapPin,
  Radio,
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Camera,
  ExternalLink,
  Phone,
  Gauge
} from 'lucide-react';

// Import dinâmico do mapa Leaflet para evitar SSR issues
const FrotaTrackingMap = dynamic(
  () => import('@/app/components/frota/FrotaTrackingMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[620px] rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 font-mono text-xs">
        <Radio className="w-5 h-5 text-emerald-400 animate-pulse mr-2" />
        Carregando Módulo de Telemetria GIS (Leaflet)...
      </div>
    )
  }
);

export default function ViaturasPage() {
  const router = useRouter();
  const { activeSite, userProfile, triggerSuccessNotification } = useSpci();

  // Contrato operacional efetivo
  const currentContratoId = useMemo(() => {
    if (activeSite && !activeSite.startsWith('TODOS') && activeSite !== 'GLOBAL') {
      return activeSite;
    }
    return userProfile?.site && !userProfile.site.startsWith('TODOS') ? userProfile.site : 'ONÇA PUMA';
  }, [activeSite, userProfile]);

  // Aba Ativa Principal
  const [activeTab, setActiveTab] = useState<'painel' | 'mapa' | 'abastecimentos' | 'ordens_servico' | 'oficinas' | 'checklists' | 'pneus'>('painel');

  // Estados de Dados
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [kpis, setKpis] = useState<FrotaKpisSummary | null>(null);
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [oficinas, setOficinas] = useState<OficinaPrestador[]>([]);
  const [ordensServico, setOrdensServico] = useState<OrdemServicoFrota[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [showTwiGuide, setShowTwiGuide] = useState(false);

  // Modais e Janelas Ativas
  const [isViaturaModalOpen, setIsViaturaModalOpen] = useState(false);
  const [selectedViaturaForEdit, setSelectedViaturaForEdit] = useState<Viatura | null>(null);

  const [isAbastecimentoModalOpen, setIsAbastecimentoModalOpen] = useState(false);
  const [selectedViaturaForFuel, setSelectedViaturaForFuel] = useState<Viatura | null>(null);

  const [isOsModalOpen, setIsOsModalOpen] = useState(false);
  const [selectedViaturaForOs, setSelectedViaturaForOs] = useState<Viatura | null>(null);
  const [selectedOsForEdit, setSelectedOsForEdit] = useState<OrdemServicoFrota | null>(null);

  const [isOficinaModalOpen, setIsOficinaModalOpen] = useState(false);
  const [selectedOficinaForEdit, setSelectedOficinaForEdit] = useState<OficinaPrestador | null>(null);

  const [isTireModalOpen, setIsTireModalOpen] = useState(false);
  const [selectedViaturaForTire, setSelectedViaturaForTire] = useState<Viatura | null>(null);
  const [inspecoesPneusAtuais, setInspecoesPneusAtuais] = useState<InspecaoPneu[]>([]);

  // Modal Terminal Mobile (QR Code Share)
  const [isTerminalShareOpen, setIsTerminalShareOpen] = useState(false);

  // Dock Bar (Janelas Minimizadas)
  const [minimizedWindows, setMinimizedWindows] = useState<MinimizedWindow[]>([]);

  // Carga dos Dados
  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, kRes, aRes, oRes, osRes] = await Promise.all([
        listViaturasAction(currentContratoId),
        getFrotaKpisAction(currentContratoId),
        listAbastecimentosAction(undefined, currentContratoId),
        listOficinasAction(currentContratoId),
        listOrdensServicoAction(currentContratoId)
      ]);

      if (vRes.success && vRes.data) setViaturas(vRes.data);
      if (kRes.success && kRes.data) setKpis(kRes.data);
      if (aRes.success && aRes.data) setAbastecimentos(aRes.data);
      if (oRes.success && oRes.data) setOficinas(oRes.data);
      if (osRes.success && osRes.data) setOrdensServico(osRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados da frota:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentContratoId]);

  // Carregar medições de pneus ao selecionar viatura
  useEffect(() => {
    if (selectedViaturaForTire) {
      listInspecoesPneusAction(selectedViaturaForTire.id, currentContratoId).then((res) => {
        if (res.success && res.data) {
          setInspecoesPneusAtuais(res.data);
        }
      });
    }
  }, [selectedViaturaForTire, currentContratoId]);

  // Filtro em memória
  const filteredViaturas = useMemo(() => {
    return viaturas.filter((v) => {
      const matchesSearch =
        (v.prefixo_frota || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.placa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.modelo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.marca || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTipo = tipoFilter === 'TODOS' || v.tipo_veiculo === tipoFilter;
      const matchesStatus = statusFilter === 'TODOS' || v.status_operacional === statusFilter;

      return matchesSearch && matchesTipo && matchesStatus;
    });
  }, [viaturas, searchTerm, tipoFilter, statusFilter]);

  // Funções de Minimização / Restauração do Dock
  const handleMinimizeWindow = (type: MinimizedWindow['type'], title: string, id: string) => {
    if (!minimizedWindows.some((w) => w.id === id)) {
      setMinimizedWindows((prev) => [...prev, { id, title, type }]);
    }
    if (type === 'viatura') setIsViaturaModalOpen(false);
    if (type === 'abastecimento') setIsAbastecimentoModalOpen(false);
    if (type === 'ordem_servico') setIsOsModalOpen(false);
    if (type === 'pneus') setIsTireModalOpen(false);
  };

  const handleRestoreWindow = (id: string) => {
    const win = minimizedWindows.find((w) => w.id === id);
    if (!win) return;

    if (win.type === 'viatura') setIsViaturaModalOpen(true);
    if (win.type === 'abastecimento') setIsAbastecimentoModalOpen(true);
    if (win.type === 'ordem_servico') setIsOsModalOpen(true);
    if (win.type === 'pneus') setIsTireModalOpen(true);

    setMinimizedWindows((prev) => prev.filter((w) => w.id !== id));
  };

  const handleCloseMinimizedWindow = (id: string) => {
    setMinimizedWindows((prev) => prev.filter((w) => w.id !== id));
  };

  const getStatusBadge = (status: StatusOperacionalViatura) => {
    switch (status) {
      case 'DISPONIVEL':
        return {
          label: 'Disponível na Base',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
        };
      case 'EM_DESLOCAMENTO':
        return {
          label: 'Em Ronda / Campo',
          bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
        };
      case 'EM_MANUTENCAO_INTERNA':
        return {
          label: 'Manutenção Interna',
          bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
        };
      case 'EM_OFICINA_EXTERNA':
        return {
          label: 'Oficina Credenciada',
          bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800'
        };
      case 'BAIXADO':
        return {
          label: 'Baixado / Inoperante',
          bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
        };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 select-none font-sans pb-16"
    >
      {/* Header Executivo Cockpit */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-red-600/10 text-red-600 border border-red-600/20 px-2.5 py-0.5 rounded-full font-mono font-black uppercase tracking-wider">
              SPCI FROTA V2.0
            </span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
              Site: {currentContratoId}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Truck className="w-6 h-6 text-red-600" />
            Gestão de Viaturas & Frota Operacional
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Controle integrado de telemetria em tempo real, auditoria de abastecimento, postos econômicos e oficinas homologadas
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => router.push('/frota/pneus')}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            title="Acessar Gestão e Laudos de Rodagem de Pneus"
          >
            <Disc className="w-4 h-4 text-emerald-600" />
            Metrologia de Rodagem
          </button>

          <button
            type="button"
            onClick={() => setShowTwiGuide(!showTwiGuide)}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            {showTwiGuide ? 'Ocultar Guia TWI' : 'Diretriz TWI'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setSelectedOficinaForEdit(null);
              setIsOficinaModalOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            + Credenciar Oficina
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedViaturaForEdit(null);
              setIsViaturaModalOpen(true);
            }}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" /> Nova Viatura
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO PRINCIPAL POR ABAS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('painel')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'painel'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          Painel Geral ({viaturas.length})
        </button>

        <button
          onClick={() => setActiveTab('mapa')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'mapa'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          Mapa GIS & Telemetria
        </button>

        <button
          onClick={() => setActiveTab('abastecimentos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'abastecimentos'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Fuel className="w-4 h-4 text-amber-500" />
          Abastecimentos & Postos ({abastecimentos.length})
        </button>

        <button
          onClick={() => setActiveTab('ordens_servico')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'ordens_servico'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4 text-orange-500" />
          Ordens de Serviço ({ordensServico.length})
        </button>

        <button
          onClick={() => setActiveTab('oficinas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'oficinas'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-500" />
          Oficinas Credenciadas ({oficinas.length})
        </button>

        <button
          onClick={() => setActiveTab('checklists')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'checklists'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 text-emerald-500" />
          Checklists & Vistorias Técnicas
        </button>

        <button
          onClick={() => setActiveTab('pneus')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'pneus'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Disc className="w-4 h-4 text-amber-500" />
          Metrologia de Pneus
        </button>
      </div>

      {/* Card Didático TWI (Retrátil) */}
      <AnimatePresence>
        {showTwiGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <TwiEducationalCard />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ABA 1: PAINEL GERAL DE VIATURAS */}
      {activeTab === 'painel' && (
        <div className="space-y-6">
          {/* Barra de Filtros e Busca */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar por placa, prefixo ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-bold outline-none focus:border-red-600"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="TODOS">Todos os Veículos</option>
                <option value="CAMINHONETE">Caminhonetes</option>
                <option value="AMBULANCIA">Ambulâncias</option>
                <option value="CAMINHAO_INCENDIO">Caminhões de Incêndio</option>
                <option value="UTILITARIO">Utilitários</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="DISPONIVEL">Disponível</option>
                <option value="EM_DESLOCAMENTO">Em Deslocamento</option>
                <option value="EM_MANUTENCAO_INTERNA">Manutenção Interna</option>
                <option value="EM_OFICINA_EXTERNA">Oficina Externa</option>
                <option value="BAIXADO">Baixado</option>
              </select>

              <button
                type="button"
                onClick={loadData}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer"
                title="Atualizar lista"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid Bento de Viaturas */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">
              Carregando dados da frota operacional...
            </div>
          ) : filteredViaturas.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
              <Truck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma viatura localizada</p>
              <p className="text-xs text-slate-400 mt-1">Tente ajustar seus termos de busca ou filtros aplicados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredViaturas.map((v) => (
                <ViaturaCard
                  key={v.id}
                  viatura={v}
                  onOpenTires={(viatura) => {
                    setSelectedViaturaForTire(viatura);
                    setIsTireModalOpen(true);
                  }}
                  onOpenFuel={(viatura) => {
                    setSelectedViaturaForFuel(viatura);
                    setIsAbastecimentoModalOpen(true);
                  }}
                  onOpenOs={(viatura) => {
                    setSelectedViaturaForOs(viatura);
                    setIsOsModalOpen(true);
                  }}
                  onOpenEdit={(viatura) => {
                    setSelectedViaturaForEdit(viatura);
                    setIsViaturaModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: MAPA GIS & TELEMETRIA EM TEMPO REAL */}
      {activeTab === 'mapa' && (
        <div className="space-y-4">
          <FrotaTrackingMap
            contratoId={currentContratoId}
            viaturasCadastradas={viaturas}
            onOpenAbastecimento={(v) => {
              setSelectedViaturaForFuel(v);
              setIsAbastecimentoModalOpen(true);
            }}
            onOpenInspecaoPneus={(v) => {
              setSelectedViaturaForTire(v);
              setIsTireModalOpen(true);
            }}
            onOpenOs={(v) => {
              setSelectedViaturaForOs(v);
              setIsOsModalOpen(true);
            }}
          />
        </div>
      )}

      {/* ABA 3: TELEMETRIA DE ABASTECIMENTOS & POSTOS */}
      {activeTab === 'abastecimentos' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase">
                Histórico de Telemetria de Abastecimento
              </h3>
              <p className="text-xs text-slate-500">
                Acompanhamento metrológico de preços, auditoria antifraude de consumo e comprovação de calibração
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsTerminalShareOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Abrir Terminal Mobile
            </button>
          </div>

          {abastecimentos.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhum abastecimento registrado no contrato {currentContratoId}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-3 px-3">Data / Hora</th>
                    <th className="py-3 px-3">Viatura / Condutor</th>
                    <th className="py-3 px-3">Posto</th>
                    <th className="py-3 px-3">Combustível</th>
                    <th className="py-3 px-3 text-right">Litros</th>
                    <th className="py-3 px-3 text-right">R$ / Litro</th>
                    <th className="py-3 px-3 text-right">Total</th>
                    <th className="py-3 px-3 text-center">Δ Preço</th>
                    <th className="py-3 px-3 text-center">Auditoria</th>
                    <th className="py-3 px-3 text-center">Calibração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {abastecimentos.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all">
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(a.data_hora).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center font-mono font-black text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 px-2.5 py-0.5 rounded-lg text-slate-900 dark:text-slate-100 shadow-2xs">
                            {a.viatura?.prefixo_frota || 'VTR'} • {a.viatura?.placa || 'PLACA'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                          Condutor: <strong className="text-slate-700 dark:text-slate-200 font-bold">{a.motorista_nome || a.condutor_nome || 'Não informado'}</strong>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {a.nome_posto || a.posto}
                      </td>
                      <td className="py-3 px-3 font-bold uppercase text-[10px] text-amber-600">
                        {String(a.tipo_combustivel).replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">{a.litros} L</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">R$ {Number(a.valor_litro).toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                        R$ {Number(a.valor_total).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[10px]">
                        {a.variacao_preco_litro !== undefined && a.variacao_preco_litro !== null ? (
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded ${
                              a.variacao_preco_litro > 0
                                ? 'bg-rose-100 text-rose-800'
                                : a.variacao_preco_litro < 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {a.variacao_preco_litro > 0 ? `+${a.variacao_preco_litro.toFixed(2)}` : a.variacao_preco_litro.toFixed(2)}
                          </span>
                        ) : (
                          '--'
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {a.is_discrepante ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Suspeito
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Regular
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {a.houve_calibracao_pneus ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            Calibrado ✓
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Não</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA: ORDENS DE SERVIÇO & RATEIO DE CUSTOS */}
      {activeTab === 'ordens_servico' && (
        <OrdensServicoFrotaTab
          ordensServico={ordensServico}
          viaturas={viaturas}
          oficinas={oficinas}
          onOpenNovaOs={() => {
            setSelectedOsForEdit(null);
            setSelectedViaturaForOs(null);
            setIsOsModalOpen(true);
          }}
          onEditOs={(os) => {
            setSelectedOsForEdit(os);
            const v = viaturas.find(x => x.id === os.viatura_id) || null;
            setSelectedViaturaForOs(v);
            setIsOsModalOpen(true);
          }}
          onRefresh={loadData}
        />
      )}

      {/* ABA 4: OFICINAS CREDENCIADAS */}
      {activeTab === 'oficinas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase">
                Rede de Oficinas Credenciadas & Homologadas
              </h3>
              <p className="text-xs text-slate-500">
                Prestadores credenciados para execução de manutenção corretiva e preventiva externa com emissão de OS
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedOficinaForEdit(null);
                setIsOficinaModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Nova Oficina
            </button>
          </div>

          {oficinas.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
              Nenhuma oficina cadastrada para este contrato. Clique em "+ Nova Oficina" para credenciar.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {oficinas.map((oficina) => (
                <div
                  key={oficina.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          {oficina.cnpj || 'CNPJ NÃO INFORMADO'}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase mt-1">
                          {oficina.razao_social}
                        </h4>
                        {oficina.nome_fantasia && (
                          <p className="text-xs font-bold text-slate-500">{oficina.nome_fantasia}</p>
                        )}
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        oficina.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {oficina.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>

                    {/* Especialidades */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {oficina.especialidades?.map((esp, i) => (
                        <span
                          key={i}
                          className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded"
                        >
                          {esp}
                        </span>
                      ))}
                    </div>

                    {/* Contatos */}
                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {oficina.telefone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-blue-500" />
                          <span>Comercial: {oficina.telefone}</span>
                        </div>
                      )}
                      {oficina.telefone_plantao && (
                        <div className="flex items-center gap-1.5 text-red-600 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Plantão 24h: {oficina.telefone_plantao}</span>
                        </div>
                      )}
                      {oficina.endereco && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{oficina.endereco}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOficinaForEdit(oficina);
                        setIsOficinaModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-all"
                    >
                      Editar Ficha
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 5: CHECKLISTS & VISTORIAS TÉCNICAS */}
      {activeTab === 'checklists' && (
        <ChecklistsFrotaTab contratoId={currentContratoId} />
      )}

      {/* ABA 6: METROLOGIA DE PNEUS & RODAGEM */}
      {activeTab === 'pneus' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Disc className="w-5 h-5 text-red-600" />
                Mapeamento e Metrologia de Rodagem da Frota
              </h3>
              <p className="text-xs text-slate-500">
                Aferição de profundidade de sulcos, desgaste de borracha, projeção de troca e laudos periciais (CONTRAN nº 558/80)
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push('/frota/pneus')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 shadow-sm"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Painel Completo & Laudos PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredViaturas.map((v) => (
              <div
                key={v.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-black text-base text-slate-900 dark:text-slate-100">
                      {v.prefixo_frota}
                    </span>
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                      {v.placa}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {v.marca_modelo_crlv || `${v.marca} ${v.modelo}`}
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-500">
                    <Gauge className="w-3.5 h-3.5 text-red-500" />
                    <span>{(v.odometro_atual_km || 0).toLocaleString('pt-BR')} km</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedViaturaForTire(v);
                    setIsTireModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border-none shadow-md shadow-red-600/20"
                >
                  <Disc className="w-4 h-4" />
                  <span>Aferir Pneus no Chassi 3D</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Cadastro & Edição de Viatura */}
      <ViaturaModal
        isOpen={isViaturaModalOpen}
        viaturaToEdit={selectedViaturaForEdit}
        contratoId={currentContratoId}
        onClose={() => setIsViaturaModalOpen(false)}
        onMinimize={() => {
          const title = selectedViaturaForEdit ? selectedViaturaForEdit.prefixo_frota : 'Nova Viatura';
          handleMinimizeWindow('viatura', title, 'modal_viatura');
        }}
        onSuccess={(saved) => {
          loadData();
          triggerSuccessNotification('Viatura Salva!', `Prefixo ${saved.prefixo_frota} atualizado com sucesso.`);
        }}
        onEditOs={(os) => {
          setSelectedOsForEdit(os);
          const v = viaturas.find(x => x.id === os.viatura_id) || selectedViaturaForEdit;
          setSelectedViaturaForOs(v);
          setIsOsModalOpen(true);
        }}
        onNewOs={(v) => {
          setSelectedOsForEdit(null);
          setSelectedViaturaForOs(v);
          setIsOsModalOpen(true);
        }}
      />

      {/* Modal: Abastecimento Padronizado com ModalBaseCorporativo */}
      {selectedViaturaForFuel && (
        <AbastecimentoModal
          isOpen={isAbastecimentoModalOpen}
          viatura={selectedViaturaForFuel}
          contratoId={currentContratoId}
          onClose={() => setIsAbastecimentoModalOpen(false)}
          onMinimize={() => {
            handleMinimizeWindow('abastecimento', `Abastecer ${selectedViaturaForFuel.prefixo_frota}`, 'modal_fuel');
          }}
          onSuccess={() => {
            loadData();
            triggerSuccessNotification('Abastecimento Gravado!', 'Consumo apurado e telemetria registrada com sucesso.');
          }}
        />
      )}

      {/* Modal: Ordem de Serviço */}
      <OrdemServicoModal
        isOpen={isOsModalOpen}
        viatura={selectedViaturaForOs}
        viaturas={viaturas}
        contratoId={currentContratoId}
        osToEdit={selectedOsForEdit}
        onClose={() => {
          setIsOsModalOpen(false);
          setSelectedOsForEdit(null);
          setSelectedViaturaForOs(null);
        }}
        onMinimize={() => {
          handleMinimizeWindow('ordem_servico', `OS ${selectedViaturaForOs?.prefixo_frota || selectedOsForEdit?.numero_os || 'Frota'}`, 'modal_os');
        }}
        onSuccess={() => {
          loadData();
          triggerSuccessNotification('Ordem de Serviço Salva!', 'Encaminhamento e rateio de custos registrados.');
        }}
      />

      {/* Modal: Oficina Credenciada */}
      <OficinaModal
        isOpen={isOficinaModalOpen}
        oficinaToEdit={selectedOficinaForEdit}
        contratoId={currentContratoId}
        onClose={() => setIsOficinaModalOpen(false)}
        onSuccess={() => {
          loadData();
          triggerSuccessNotification('Oficina Homologada!', 'Dados da oficina credenciada salvos com sucesso.');
        }}
      />

      {/* Modal Executivo: Mapeamento Interativo de Pneus & Calibragem */}
      {isTireModalOpen && selectedViaturaForTire && (
        <MapeamentoPneusModal
          isOpen={isTireModalOpen}
          viatura={selectedViaturaForTire}
          contratoId={currentContratoId}
          onClose={() => setIsTireModalOpen(false)}
          onMinimize={() => {
            handleMinimizeWindow(
              'pneus',
              `Pneus ${selectedViaturaForTire.prefixo_frota}`,
              'modal_pneus'
            );
          }}
          onSuccess={() => {
            loadData();
            triggerSuccessNotification(
              'Inspeção de Pneus Gravada!',
              `Medições metrológicas da viatura ${selectedViaturaForTire.prefixo_frota} salvas com sucesso.`
            );
          }}
          tecnicoPadrao={userProfile?.nome || 'Inspetor SPCI'}
          theme="dark"
        />
      )}

      {/* Modal: Compartilhamento do Terminal Mobile via QR Code */}
      <TerminalMobileShareModal
        isOpen={isTerminalShareOpen}
        onClose={() => setIsTerminalShareOpen(false)}
        contratoId={currentContratoId}
      />

      {/* Dock Bar de Janelas Minimizadas */}
      <FrotaDockBar
        minimizedWindows={minimizedWindows}
        onRestore={handleRestoreWindow}
        onClose={handleCloseMinimizedWindow}
      />
    </motion.div>
  );
}
