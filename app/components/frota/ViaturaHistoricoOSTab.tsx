'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Viatura, OrdemServicoFrota } from '@/lib/types/frota';
import { listOrdensServicoAction } from '@/app/actions/frotaActions';
import { 
  Wrench, 
  Calendar, 
  Gauge, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  DollarSign, 
  Search, 
  Filter, 
  ExternalLink,
  Package,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ViaturaHistoricoOSTabProps {
  viatura: Viatura;
  contratoId: string;
}

export const ViaturaHistoricoOSTab: React.FC<ViaturaHistoricoOSTabProps> = ({
  viatura,
  contratoId
}) => {
  const [ordens, setOrdens] = useState<OrdemServicoFrota[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'PREVENTIVA' | 'CORRETIVA'>('TODOS');
  const [termoBusca, setTermoBusca] = useState('');
  const [osExpandida, setOsExpandida] = useState<string | null>(null);

  // Carregar histórico da viatura
  useEffect(() => {
    let isMounted = true;
    async function carregarHistorico() {
      setLoading(true);
      try {
        const res = await listOrdensServicoAction(contratoId, viatura.id);
        if (isMounted && res.success && res.data) {
          setOrdens(res.data);
        }
      } catch (err) {
        console.error('Erro ao carregar histórico de OS:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (viatura?.id) {
      carregarHistorico();
    }

    return () => {
      isMounted = false;
    };
  }, [viatura.id, contratoId]);

  // Filtros aplicados
  const ordensFiltradas = useMemo(() => {
    return ordens.filter(os => {
      const tipo = os.tipo_manutencao || os.natureza_manutencao || 'PREVENTIVA';
      const matchTipo = filtroTipo === 'TODOS' || tipo === filtroTipo;

      const termo = termoBusca.trim().toLowerCase();
      const matchBusca = !termo ||
        os.numero_os.toLowerCase().includes(termo) ||
        (os.descricao_motivo && os.descricao_motivo.toLowerCase().includes(termo)) ||
        (os.descricao_servico && os.descricao_servico.toLowerCase().includes(termo)) ||
        (os.oficina?.razao_social && os.oficina.razao_social.toLowerCase().includes(termo));

      return matchTipo && matchBusca;
    });
  }, [ordens, filtroTipo, termoBusca]);

  // Estatísticas Rápidas da Viatura
  const stats = useMemo(() => {
    const total = ordens.length;
    let totalGasto = 0;
    let preventivas = 0;
    let corretivas = 0;

    ordens.forEach(os => {
      const custo = Number(os.custo_total || (Number(os.custo_pecas || 0) + Number(os.custo_mao_de_obra || 0)));
      totalGasto += custo;
      const tipo = os.tipo_manutencao || os.natureza_manutencao;
      if (tipo === 'PREVENTIVA') preventivas++;
      if (tipo === 'CORRETIVA') corretivas++;
    });

    return { total, totalGasto, preventivas, corretivas };
  }, [ordens]);

  return (
    <div className="space-y-4 font-sans text-slate-900 select-none">
      {/* 1. CARDS DE RESUMO EXECUTIVO (BENTO KPIS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Total de OS</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-slate-900 font-mono">{stats.total}</span>
            <Wrench className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200">
          <span className="text-[10px] font-mono font-bold text-blue-700 uppercase block">Preventivas</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-blue-800 font-mono">{stats.preventivas}</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
          <span className="text-[10px] font-mono font-bold text-amber-700 uppercase block">Corretivas</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-amber-800 font-mono">{stats.corretivas}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
          <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase block">Investimento Total</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-black text-emerald-800 font-mono">
              R$ {stats.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* 2. BARRA DE FILTROS & BUSCA */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between pt-1">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por OS, peça ou oficina..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">Tipo:</span>
          {(['TODOS', 'PREVENTIVA', 'CORRETIVA'] as const).map(tipo => (
            <button
              key={tipo}
              type="button"
              onClick={() => setFiltroTipo(tipo)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filtroTipo === tipo
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tipo === 'TODOS' ? 'Todas' : tipo}
            </button>
          ))}
        </div>
      </div>

      {/* 3. LISTA / TIMELINE CRONOLÓGICA DAS ORDENS DE SERVIÇO */}
      {loading ? (
        <div className="py-12 text-center text-xs font-mono text-slate-400">
          <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
          Carregando histórico de manutenções...
        </div>
      ) : ordensFiltradas.length === 0 ? (
        <div className="py-10 border border-dashed border-slate-200 rounded-2xl text-center">
          <Wrench className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600">Nenhuma Ordem de Serviço encontrada</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {termoBusca ? 'Tente ajustar os termos da pesquisa.' : 'Esta viatura ainda não possui registros de manutenção cadastrados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ordensFiltradas.map((os) => {
            const isPreventiva = (os.tipo_manutencao || os.natureza_manutencao) === 'PREVENTIVA';
            const isInterna = (os.origem_execucao || (os.tipo_os === 'EXTERNA' ? 'EXTERNA_CREDENCIADA' : 'INTERNA_BRIGADA')) === 'INTERNA_BRIGADA';
            const oficinaNome = isInterna ? 'Oficina Interna da Brigada' : (os.oficina?.razao_social || 'Oficina Credenciada Externa');
            const dataFmt = new Date(os.data_abertura).toLocaleDateString('pt-BR');
            const custoTotal = Number(os.custo_total || (Number(os.custo_pecas || 0) + Number(os.custo_mao_de_obra || 0)));
            const isExpandida = osExpandida === os.id;
            const pecasLista = os.pecas_substituidas_json || [];

            const statusCor = 
              os.status === 'CONCLUIDA' || os.status_os === 'CONCLUIDA'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : os.status === 'AGUARDANDO_PECAS'
                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300';

            return (
              <div 
                key={os.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-3"
              >
                {/* Cabeçalho da OS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-black text-slate-900">
                      {os.numero_os}
                    </span>
                    
                    {/* Badge Tipo */}
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isPreventiva
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {isPreventiva ? 'PREVENTIVA' : 'CORRETIVA'}
                    </span>

                    {/* Badge Status */}
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${statusCor}`}>
                      {os.status || os.status_os}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {dataFmt}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-bold text-slate-700">
                      <Gauge className="w-3.5 h-3.5 text-slate-400" />
                      {Number(os.odometro_km).toLocaleString('pt-BR')} km
                    </span>
                  </div>
                </div>

                {/* Corpo: Local / Oficina e Descrição */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                      Origem & Local:
                    </span>
                    <p className="font-bold text-slate-800 flex items-center gap-1 truncate">
                      <Building2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="truncate">{oficinaNome}</span>
                    </p>
                  </div>

                  <div className="sm:col-span-2 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                      Motivo / Serviços Executados:
                    </span>
                    <p className="text-slate-700 line-clamp-2">
                      {os.descricao_motivo || os.descricao_servico || 'Sem descrição detalhada.'}
                    </p>
                  </div>
                </div>

                {/* Rodapé do Card: Custos e Ação de Expandir */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-500">
                      Custo Total: <strong className="text-emerald-700 font-mono">R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </span>
                    {pecasLista.length > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                        {pecasLista.length} peça(s)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {os.romaneio_pdf_url && (
                      <a
                        href={os.romaneio_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Romaneio</span>
                      </a>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => setOsExpandida(isExpandida ? null : os.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 p-1 cursor-pointer"
                    >
                      <span>{isExpandida ? 'Menos Detalhes' : 'Ver Peças & Detalhes'}</span>
                      {isExpandida ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Área Expandida: Lista de Peças e Comprovantes */}
                {isExpandida && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 mt-2">
                    <h5 className="text-[11px] font-bold font-mono uppercase text-slate-700 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-blue-600" />
                      <span>Peças e Componentes Aplicados</span>
                    </h5>

                    {pecasLista.length > 0 ? (
                      <div className="space-y-1">
                        {pecasLista.map((p, idx) => (
                          <div key={idx} className="flex justify-between text-[11px] font-mono bg-white p-1.5 rounded border border-slate-200">
                            <span className="font-semibold text-slate-800">{p.peca} (Qtd: {p.quantidade})</span>
                            {p.valor_unitario && (
                              <span className="text-slate-600">
                                R$ {Number(p.valor_unitario).toFixed(2)} un
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Nenhuma peça discriminada para esta intervenção.</p>
                    )}

                    {os.comprovantes_urls && os.comprovantes_urls.length > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1">
                          Comprovantes & Anexos:
                        </span>
                        <div className="flex gap-2 flex-wrap">
                          {os.comprovantes_urls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:text-red-600"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Anexo {idx + 1}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
