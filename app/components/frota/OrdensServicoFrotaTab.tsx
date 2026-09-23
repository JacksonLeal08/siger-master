'use client';

import React, { useState, useMemo } from 'react';
import { 
  OrdemServicoFrota, 
  Viatura, 
  OficinaPrestador,
  StatusOrdemServico,
  NaturezaManutencao
} from '@/lib/types/frota';
import { 
  Wrench, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  DollarSign, 
  Truck, 
  Building2, 
  FileText, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  Printer,
  Sparkles,
  Paperclip
} from 'lucide-react';

interface OrdensServicoFrotaTabProps {
  ordensServico: OrdemServicoFrota[];
  viaturas: Viatura[];
  oficinas: OficinaPrestador[];
  onOpenNovaOs: () => void;
  onEditOs: (os: OrdemServicoFrota) => void;
  onRefresh?: () => void;
}

export const OrdensServicoFrotaTab: React.FC<OrdensServicoFrotaTabProps> = ({
  ordensServico,
  viaturas,
  oficinas,
  onOpenNovaOs,
  onEditOs,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedViaturaId, setSelectedViaturaId] = useState<string>('TODAS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [selectedNatureza, setSelectedNatureza] = useState<string>('TODAS');

  // Mapa de Viaturas para lookup rápido
  const viaturasMap = useMemo(() => {
    const map = new Map<string, Viatura>();
    viaturas.forEach(v => map.set(v.id, v));
    return map;
  }, [viaturas]);

  // Mapa de Oficinas para lookup rápido
  const oficinasMap = useMemo(() => {
    const map = new Map<string, OficinaPrestador>();
    oficinas.forEach(o => map.set(o.id, o));
    return map;
  }, [oficinas]);

  // KPIs Estratégicos
  const kpis = useMemo(() => {
    let total = ordensServico.length;
    let emAbertoOuOrcamento = 0;
    let emExecucao = 0;
    let concluidas = 0;
    let custoTotalAcumulado = 0;
    let custoPecasAcumulado = 0;
    let custoServicosAcumulado = 0;
    let custoPneusAcumulado = 0;

    ordensServico.forEach(os => {
      const s = os.status_os || os.status || 'ABERTA';
      if (s === 'ABERTA' || s === 'EM_ORCAMENTO' || s === 'APROVADA') emAbertoOuOrcamento++;
      else if (s === 'EM_EXECUCAO' || s === 'EM_ANDAMENTO' || s === 'AGUARDANDO_PECAS') emExecucao++;
      else if (s === 'CONCLUIDA') concluidas++;

      const cPecas = Number(os.custo_pecas || 0);
      const cMao = Number(os.custo_mao_de_obra || 0);
      const cPneus = Number(os.custo_pneus || 0);
      const cTotal = Number(os.custo_total || (cPecas + cMao + cPneus));

      custoTotalAcumulado += cTotal;
      custoPecasAcumulado += cPecas;
      custoServicosAcumulado += cMao;
      custoPneusAcumulado += cPneus;
    });

    return {
      total,
      emAbertoOuOrcamento,
      emExecucao,
      concluidas,
      custoTotalAcumulado,
      custoPecasAcumulado,
      custoServicosAcumulado,
      custoPneusAcumulado
    };
  }, [ordensServico]);

  // Filtragem Dinâmica
  const ordensFiltradas = useMemo(() => {
    return ordensServico.filter(os => {
      // Filtro Viatura
      if (selectedViaturaId !== 'TODAS' && os.viatura_id !== selectedViaturaId) return false;

      // Filtro Status
      const st = os.status_os || os.status || 'ABERTA';
      if (selectedStatus !== 'TODOS') {
        if (selectedStatus === 'EM_EXECUCAO') {
          if (st !== 'EM_EXECUCAO' && st !== 'EM_ANDAMENTO') return false;
        } else if (selectedStatus === 'EM_ORCAMENTO') {
          if (st !== 'EM_ORCAMENTO') return false;
        } else if (st !== selectedStatus) {
          return false;
        }
      }

      // Filtro Natureza
      const nat = os.natureza_manutencao || os.tipo_manutencao || 'PREVENTIVA';
      if (selectedNatureza !== 'TODAS' && nat !== selectedNatureza) return false;

      // Filtro Busca Textual
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const num = (os.numero_os || '').toLowerCase();
        const desc = (os.descricao_servico || os.descricao_motivo || '').toLowerCase();
        const v = viaturasMap.get(os.viatura_id);
        const prefixo = (v?.prefixo_frota || '').toLowerCase();
        const placa = (v?.placa || '').toLowerCase();
        const modelo = (v?.modelo || '').toLowerCase();

        return num.includes(term) || desc.includes(term) || prefixo.includes(term) || placa.includes(term) || modelo.includes(term);
      }

      return true;
    });
  }, [ordensServico, selectedViaturaId, selectedStatus, selectedNatureza, searchTerm, viaturasMap]);

  const getStatusBadge = (status?: string) => {
    const s = status || 'ABERTA';
    switch (s) {
      case 'ABERTA':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Aberta / Triagem
          </span>
        );
      case 'EM_ORCAMENTO':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3" /> Em Orçamento
          </span>
        );
      case 'APROVADA':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Aprovada
          </span>
        );
      case 'EM_EXECUCAO':
      case 'EM_ANDAMENTO':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            Em Execução
          </span>
        );
      case 'CONCLUIDA':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Concluída & Faturada
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-500 border border-slate-500/30">
            Cancelada
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            {s}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* KPIS DE GESTÃO DE ORDENS DE SERVIÇO */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total de O.S.</span>
            <Wrench className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
            {kpis.total}
          </p>
          <span className="text-[10px] text-slate-500">Histórico operacional</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 shadow-xs">
          <div className="flex items-center justify-between text-blue-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Em Aberto / Cotação</span>
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono">
            {kpis.emAbertoOuOrcamento}
          </p>
          <span className="text-[10px] text-blue-600/80 dark:text-blue-400">Aguardando cotação/aprovação</span>
        </div>

        <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40 shadow-xs">
          <div className="flex items-center justify-between text-orange-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Em Execução</span>
            <Wrench className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-orange-700 dark:text-orange-400 font-mono">
            {kpis.emExecucao}
          </p>
          <span className="text-[10px] text-orange-600/80 dark:text-orange-400">Veículos em manutenção</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs">
          <div className="flex items-center justify-between text-emerald-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Concluídas</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
            {kpis.concluidas}
          </p>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400">Prontas e faturadas</span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Investido</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-xl font-black text-white font-mono">
            R$ {kpis.custoTotalAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between mt-1 pt-1 border-t border-slate-800">
            <span>Peças: R$ {kpis.custoPecasAcumulado.toFixed(0)}</span>
            <span>Mão: R$ {kpis.custoServicosAcumulado.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BARRA DE FILTROS & AÇÕES */}
      {/* ==================================================================== */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 w-full flex-wrap">
          {/* Busca Textual */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nº OS, placa, prefixo ou serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-red-600"
            />
          </div>

          {/* Filtro Viatura */}
          <select
            value={selectedViaturaId}
            onChange={(e) => setSelectedViaturaId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="TODAS">Todas as Viaturas ({viaturas.length})</option>
            {viaturas.map(v => (
              <option key={v.id} value={v.id}>
                {v.prefixo_frota} • {v.placa} ({v.modelo})
              </option>
            ))}
          </select>

          {/* Filtro Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="ABERTA">Aberta / Triagem</option>
            <option value="EM_ORCAMENTO">Em Orçamento</option>
            <option value="APROVADA">Aprovada</option>
            <option value="EM_EXECUCAO">Em Execução</option>
            <option value="CONCLUIDA">Concluída & Faturada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>

          {/* Filtro Natureza */}
          <select
            value={selectedNatureza}
            onChange={(e) => setSelectedNatureza(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="TODAS">Todas as Naturezas</option>
            <option value="PREVENTIVA">Preventivas</option>
            <option value="CORRETIVA">Corretivas</option>
            <option value="EMERGENCIAL">Emergenciais</option>
          </select>
        </div>

        {/* Botão Ação Principal */}
        <button
          type="button"
          onClick={onOpenNovaOs}
          className="w-full md:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer border-none shrink-0"
        >
          <Plus className="w-4 h-4" /> Nova Ordem de Serviço
        </button>
      </div>

      {/* ==================================================================== */}
      {/* LISTAGEM DAS ORDENS DE SERVIÇO */}
      {/* ==================================================================== */}
      {ordensFiltradas.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <Wrench className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Nenhuma Ordem de Serviço encontrada
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tente ajustar os filtros acima ou clique em <strong>Nova Ordem de Serviço</strong> para iniciar um registro.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ordensFiltradas.map((os) => {
            const viat = viaturasMap.get(os.viatura_id);
            const ofc = os.oficina_id ? oficinasMap.get(os.oficina_id) : null;
            const statusStr = os.status_os || os.status || 'ABERTA';
            const orcsCount = os.orcamentos_json?.length || 0;
            const nfsCount = os.notas_fiscais_json?.length || 0;

            const cPecas = Number(os.custo_pecas || 0);
            const cMao = Number(os.custo_mao_de_obra || 0);
            const cPneus = Number(os.custo_pneus || 0);
            const cTotal = Number(os.custo_total || (cPecas + cMao + cPneus));

            return (
              <div
                key={os.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Coluna 1: Dados da OS e Viatura */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">
                      {os.numero_os}
                    </span>
                    {getStatusBadge(statusStr)}
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                      {os.natureza_manutencao || os.tipo_manutencao || 'PREVENTIVA'}
                    </span>
                  </div>

                  {/* Viatura e Odômetro */}
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-bold">
                    <Truck className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>
                      {viat ? `${viat.prefixo_frota} • ${viat.modelo}` : 'Viatura SIGER'}
                    </span>
                    {viat?.placa && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                        {viat.placa}
                      </span>
                    )}
                    <span className="text-slate-400 font-normal">|</span>
                    <span className="font-mono text-[11px] text-slate-500 font-normal">
                      KM: {os.odometro_km?.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {/* Escopo do Serviço */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                    {os.descricao_servico || os.descricao_motivo || 'Revisão técnica veicular'}
                  </p>

                  {/* Local de Execução e Documentos Anexados */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap pt-0.5">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {os.tipo_os === 'EXTERNA' 
                        ? (ofc ? ofc.razao_social : 'Oficina Externa Credenciada')
                        : 'Oficina Interna da Brigada SIGER'
                      }
                    </span>

                    <span className="text-slate-300 dark:text-slate-700">•</span>

                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(os.data_abertura).toLocaleDateString('pt-BR')}
                    </span>

                    {(orcsCount > 0 || nfsCount > 0) && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          {orcsCount > 0 && <span>📎 {orcsCount} orç.</span>}
                          {nfsCount > 0 && <span>🧾 {nfsCount} NF(s)</span>}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Coluna 2: Rateio Financeiro & Ações */}
                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                  {/* Custo Consolidado */}
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Custo Total
                    </p>
                    <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                      R$ {cTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono">
                      Pç: {cPecas.toFixed(0)} | Mão: {cMao.toFixed(0)} {cPneus > 0 ? `| Pn: ${cPneus.toFixed(0)}` : ''}
                    </p>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditOs(os)}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Gerenciar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
