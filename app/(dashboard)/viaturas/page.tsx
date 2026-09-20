'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSpci } from '@/app/context/SpciContext';
import { 
  Viatura, 
  Abastecimento, 
  InspecaoPneu, 
  OrdemServicoFrota, 
  FrotaKpisSummary,
  TipoVeiculo,
  StatusOperacionalViatura
} from '@/lib/types/frota';
import { 
  listViaturasAction, 
  getFrotaKpisAction, 
  listInspecoesPneusAction 
} from '@/app/actions/frotaActions';
import { MaintenancePlanEngine } from '@/lib/maintenancePlanEngine';
import { TwiEducationalCard } from '@/app/components/frota/TwiEducationalCard';
import { TireMapInspection } from '@/app/components/frota/TireMapInspection';
import { ViaturaModal } from '@/app/components/frota/ViaturaModal';
import { AbastecimentoModal } from '@/app/components/frota/AbastecimentoModal';
import { OrdemServicoModal } from '@/app/components/frota/OrdemServicoModal';
import { FrotaDockBar, MinimizedWindow } from '@/app/components/frota/FrotaDockBar';
import { 
  Truck, 
  Plus, 
  Search, 
  Fuel, 
  Wrench, 
  Disc, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  FileText,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function ViaturasPage() {
  const { activeSite, userProfile, triggerSuccessNotification } = useSpci();

  // Contrato operacional efetivo
  const currentContratoId = useMemo(() => {
    if (activeSite && !activeSite.startsWith('TODOS') && activeSite !== 'GLOBAL') {
      return activeSite;
    }
    return userProfile?.site && !userProfile.site.startsWith('TODOS') ? userProfile.site : 'SALOBO';
  }, [activeSite, userProfile]);

  // Estados de Dados
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [kpis, setKpis] = useState<FrotaKpisSummary | null>(null);
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

  const [isTireModalOpen, setIsTireModalOpen] = useState(false);
  const [selectedViaturaForTire, setSelectedViaturaForTire] = useState<Viatura | null>(null);
  const [inspecoesPneusAtuais, setInspecoesPneusAtuais] = useState<InspecaoPneu[]>([]);

  // Dock Bar (Janelas Minimizadas)
  const [minimizedWindows, setMinimizedWindows] = useState<MinimizedWindow[]>([]);

  // Carga inicial
  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, kRes] = await Promise.all([
        listViaturasAction(currentContratoId),
        getFrotaKpisAction(currentContratoId)
      ]);

      if (vRes.success && vRes.data) {
        setViaturas(vRes.data);
      }
      if (kRes.success && kRes.data) {
        setKpis(kRes.data);
      }
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
      listInspecoesPneusAction(selectedViaturaForTire.id, currentContratoId).then(res => {
        if (res.success && res.data) {
          setInspecoesPneusAtuais(res.data);
        }
      });
    }
  }, [selectedViaturaForTire, currentContratoId]);

  // Filtro em memória
  const filteredViaturas = useMemo(() => {
    return viaturas.filter(v => {
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
    if (!minimizedWindows.some(w => w.id === id)) {
      setMinimizedWindows(prev => [...prev, { id, title, type }]);
    }
    if (type === 'viatura') setIsViaturaModalOpen(false);
    if (type === 'abastecimento') setIsAbastecimentoModalOpen(false);
    if (type === 'ordem_servico') setIsOsModalOpen(false);
    if (type === 'pneus') setIsTireModalOpen(false);
  };

  const handleRestoreWindow = (id: string) => {
    const win = minimizedWindows.find(w => w.id === id);
    if (!win) return;

    if (win.type === 'viatura') setIsViaturaModalOpen(true);
    if (win.type === 'abastecimento') setIsAbastecimentoModalOpen(true);
    if (win.type === 'ordem_servico') setIsOsModalOpen(true);
    if (win.type === 'pneus') setIsTireModalOpen(true);

    setMinimizedWindows(prev => prev.filter(w => w.id !== id));
  };

  const handleCloseMinimizedWindow = (id: string) => {
    setMinimizedWindows(prev => prev.filter(w => w.id !== id));
  };

  const getStatusBadge = (status: StatusOperacionalViatura) => {
    switch (status) {
      case 'DISPONIVEL':
        return { label: 'Disponível na Base', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' };
      case 'EM_DESLOCAMENTO':
        return { label: 'Em Ronda / Campo', bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800' };
      case 'EM_MANUTENCAO_INTERNA':
        return { label: 'Manutenção Interna', bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' };
      case 'EM_OFICINA_EXTERNA':
        return { label: 'Oficina Credenciada', bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800' };
      case 'BAIXADO':
        return { label: 'Baixado / Inoperante', bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 select-none font-sans pb-16">
      
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
            Controle integrado de telemetria, consumo antifraude, ciclo de preventivas e pneus TWI (CONTRAN 558/80)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
              setSelectedViaturaForEdit(null);
              setIsViaturaModalOpen(true);
            }}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" /> Nova Viatura
          </button>
        </div>
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

      {/* Bento Grid de KPIs Superiores */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Frota */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Frota Total</span>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1 font-mono">
            {kpis?.totalViaturas ?? viaturas.length}
          </p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5 block">Viaturas ativas</span>
        </div>

        {/* Disponíveis */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-emerald-500" />
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider block">Disponíveis</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {kpis?.disponiveis ?? viaturas.filter(v => v.status_operacional === 'DISPONIVEL').length}
          </p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5 block">Prontas para saída</span>
        </div>

        {/* Em Manutenção / Oficina */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-blue-500" />
          <span className="text-[9px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider block">Em Manutenção</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
            {kpis?.emManutencao ?? viaturas.filter(v => v.status_operacional.includes('MANUTENCAO') || v.status_operacional.includes('OFICINA')).length}
          </p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5 block">Interna / Credenciada</span>
        </div>

        {/* CRLV / Seguro a Vencer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-amber-500" />
          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider block">Docs / Seguro (30d)</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {kpis?.crlvAVencerOuVencido ?? 0}
          </p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5 block">Vencimentos próximos</span>
        </div>

        {/* Pneus Críticos TWI */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-red-600 animate-pulse" />
          <span className="text-[9px] text-red-600 dark:text-red-400 font-extrabold uppercase tracking-wider block">Pneus Críticos TWI</span>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 font-mono flex items-center gap-1.5">
            {kpis?.pneusCriticosTwi ?? 0}
            {(kpis?.pneusCriticosTwi || 0) > 0 && <span className="text-xs">⚠️</span>}
          </p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5 block">≤ 1.6 mm (CONTRAN)</span>
        </div>

        {/* Abastecimentos Suspeitos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-red-500" />
          <span className="text-[9px] text-red-600 dark:text-red-400 font-extrabold uppercase tracking-wider block">Consumo Anômalo</span>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 font-mono">
            {kpis?.abastecimentosSuspeitos ?? 0}
          </p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5 block">Desvios &gt; 20%</span>
        </div>
      </div>

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
          {filteredViaturas.map((v) => {
            const badge = getStatusBadge(v.status_operacional);
            const preventivas = MaintenancePlanEngine.evaluateVehicle(v.odometro_atual_km);
            const proximaPreventiva = preventivas.find(p => p.status !== 'CONFORME') || preventivas[0];

            return (
              <div
                key={v.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600 shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-base text-slate-900 dark:text-slate-100">
                            {v.prefixo_frota}
                          </span>
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                            {v.placa}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                          {v.marca} {v.modelo} {v.ano_fabricacao ? `(${v.ano_fabricacao})` : ''}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-full border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Informações de Telemetria e Preventiva */}
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[10px]">ODÔMETRO:</span>
                      <strong className="text-slate-800 dark:text-slate-100">{v.odometro_atual_km} km</strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[10px]">COMBUSTÍVEL:</span>
                      <span className="font-bold text-[10px] uppercase text-amber-600 dark:text-amber-400">
                        {v.tipo_combustivel.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Previsão da Próxima Revisão Preventiva */}
                    {proximaPreventiva && (
                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800 text-[10px] flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-blue-500" /> Preventiva:
                        </span>
                        <span className={`font-bold ${
                          proximaPreventiva.status === 'VENCIDO' 
                            ? 'text-red-500 animate-pulse' 
                            : proximaPreventiva.status === 'ALERTA_PROXIMO' 
                            ? 'text-amber-500' 
                            : 'text-emerald-500'
                        }`}>
                          {proximaPreventiva.restanteKm} km restantes
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botões de Ação Rápida */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-1.5">
                  {/* Pneus TWI */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedViaturaForTire(v);
                      setIsTireModalOpen(true);
                    }}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border-none shadow-2xs"
                    title="Mapeamento de Pneus & TWI"
                  >
                    <Disc className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pneus</span>
                  </button>

                  {/* Abastecer */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedViaturaForFuel(v);
                      setIsAbastecimentoModalOpen(true);
                    }}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border-none shadow-2xs"
                    title="Registrar Abastecimento"
                  >
                    <Fuel className="w-3.5 h-3.5 text-amber-500" />
                    <span>Abastecer</span>
                  </button>

                  {/* Ordem de Serviço */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedViaturaForOs(v);
                      setIsOsModalOpen(true);
                    }}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border-none shadow-2xs"
                    title="Abrir Ordem de Serviço (OS)"
                  >
                    <Wrench className="w-3.5 h-3.5 text-blue-500" />
                    <span>OS</span>
                  </button>

                  {/* Editar Ficha */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedViaturaForEdit(v);
                      setIsViaturaModalOpen(true);
                    }}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border-none shadow-2xs"
                    title="Editar Cadastro da Viatura"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ficha</span>
                  </button>
                </div>
              </div>
            );
          })}
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
      />

      {/* Modal: Abastecimento */}
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
      {selectedViaturaForOs && (
        <OrdemServicoModal
          isOpen={isOsModalOpen}
          viatura={selectedViaturaForOs}
          contratoId={currentContratoId}
          onClose={() => setIsOsModalOpen(false)}
          onMinimize={() => {
            handleMinimizeWindow('ordem_servico', `OS ${selectedViaturaForOs.prefixo_frota}`, 'modal_os');
          }}
          onSuccess={() => {
            loadData();
            triggerSuccessNotification('Ordem de Serviço Salva!', 'Encaminhamento e histórico operacional atualizados.');
          }}
        />
      )}

      {/* Modal: Mapeamento de Pneus & TWI */}
      {isTireModalOpen && selectedViaturaForTire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-5 select-none">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setIsTireModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer"
            >
              ✕
            </button>
            <TireMapInspection
              viatura={selectedViaturaForTire}
              inspecoesAtuais={inspecoesPneusAtuais}
              onInspecaoSalva={(nova) => {
                setInspecoesPneusAtuais(prev => [nova, ...prev]);
                loadData();
                triggerSuccessNotification('Medição de Pneu Gravada!', `Posição ${nova.posicao_pneu} registrada.`);
              }}
            />
          </div>
        </div>
      )}

      {/* Dock Bar de Janelas Minimizadas */}
      <FrotaDockBar
        minimizedWindows={minimizedWindows}
        onRestore={handleRestoreWindow}
        onClose={handleCloseMinimizedWindow}
      />
    </motion.div>
  );
}
