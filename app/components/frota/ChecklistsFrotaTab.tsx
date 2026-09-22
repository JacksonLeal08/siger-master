'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChecklistVeicular, ChecklistItemAvaliacao } from '@/lib/types/frota';
import { listChecklistsAction, getChecklistByIdAction } from '@/app/actions/frotaActions';
import { emitirLaudoChecklistPdf } from '@/lib/pdfLaudoChecklistGenerator';
import { LaudoPericialVeicular } from './LaudoPericialVeicular';
import { 
  ClipboardCheck, 
  Search, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  X, 
  Eye, 
  Calendar, 
  User, 
  Gauge, 
  RefreshCw,
  ExternalLink,
  Camera
} from 'lucide-react';

interface ChecklistsFrotaTabProps {
  contratoId: string;
}

export const ChecklistsFrotaTab: React.FC<ChecklistsFrotaTabProps> = ({ contratoId }) => {
  const [checklists, setChecklists] = useState<ChecklistVeicular[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistVeicular | null>(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);

  const carregarChecklists = async () => {
    setLoading(true);
    try {
      const res = await listChecklistsAction(undefined, contratoId);
      if (res.success && res.data) {
        setChecklists(res.data);
      }
    } catch (err) {
      console.error('[ChecklistsFrotaTab] Erro ao carregar checklists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarChecklists();
  }, [contratoId]);

  const checklistsFiltrados = useMemo(() => {
    return checklists.filter(chk => {
      const v = chk.viatura;
      const matchTexto = 
        (v?.prefixo_frota || '').toLowerCase().includes(termoBusca.toLowerCase()) ||
        (v?.placa || '').toLowerCase().includes(termoBusca.toLowerCase()) ||
        (chk.tecnico_nome || '').toLowerCase().includes(termoBusca.toLowerCase());

      const matchStatus = 
        filtroStatus === 'TODOS' || 
        chk.status_aprovacao === filtroStatus;

      return matchTexto && matchStatus;
    });
  }, [checklists, termoBusca, filtroStatus]);

  const handleOpenDetalhes = async (chk: ChecklistVeicular) => {
    if (chk.id) {
      setLoadingDetalhes(true);
      try {
        const res = await getChecklistByIdAction(chk.id);
        if (res.success && res.data) {
          setSelectedChecklist(res.data);
        } else {
          setSelectedChecklist(chk);
        }
      } catch {
        setSelectedChecklist(chk);
      } finally {
        setLoadingDetalhes(false);
      }
    } else {
      setSelectedChecklist(chk);
    }
  };

  const handleImprimirLaudo = async (chk: ChecklistVeicular) => {
    if (chk.id && (!chk.itens || chk.itens.length === 0)) {
      const res = await getChecklistByIdAction(chk.id);
      if (res.success && res.data) {
        emitirLaudoChecklistPdf(res.data);
        return;
      }
    }
    emitirLaudoChecklistPdf(chk);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Ações */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar por prefixo, placa ou vistoriador..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-1">
            {['TODOS', 'APROVADO', 'ATENCAO', 'INTERDITADO'].map((st) => (
              <button
                key={st}
                onClick={() => setFiltroStatus(st)}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                  filtroStatus === st
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st === 'TODOS' ? 'Todos' : st === 'ATENCAO' ? 'Atenção' : st === 'INTERDITADO' ? 'Interditados' : 'Aprovados'}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={carregarChecklists}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-bold"
          title="Atualizar lista"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-500' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Tabela de Vistorias */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase font-mono text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Viatura</th>
                <th className="py-3 px-4">Tipo & Odômetro</th>
                <th className="py-3 px-4">Técnico / Condutor</th>
                <th className="py-3 px-4 text-center">Conformidade</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-mono text-xs">
                    Carregando vistorias técnicas veiculares...
                  </td>
                </tr>
              ) : checklistsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-mono text-xs">
                    Nenhum checklist veicular localizado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                checklistsFiltrados.map((chk) => {
                  const v = chk.viatura;
                  const dataFormatada = new Date(chk.created_at || '').toLocaleString('pt-BR');

                  return (
                    <tr key={chk.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {dataFormatada}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                            {v?.prefixo_frota || 'N/A'} • {v?.placa || 'N/A'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {v?.marca} {v?.modelo}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                        <div>{chk.tipo_checklist || 'DIARIO_PREVENTIVO'}</div>
                        <div className="text-[10px] text-slate-500">
                          {Number(chk.odometro_km || 0).toLocaleString('pt-BR')} km
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {chk.tecnico_nome}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-slate-100">
                          {chk.percentual_conformidade}%
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          {chk.total_conformes}/{chk.total_itens} itens
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase border ${
                          chk.status_aprovacao === 'INTERDITADO'
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
                            : chk.status_aprovacao === 'ATENCAO'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                        }`}>
                          {chk.status_aprovacao === 'INTERDITADO' ? 'Interditado' : chk.status_aprovacao === 'ATENCAO' ? 'Atenção' : 'Aprovado'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetalhes(chk)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                            title="Ver Detalhes e Fotos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleImprimirLaudo(chk)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs"
                            title="Emitir Laudo em PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Laudo PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes da Vistoria com Galeria de Fotos */}
      {selectedChecklist && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-red-600 dark:text-red-400 block">
                  DETALHAMENTO DA VISTORIA PERICIAL
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {selectedChecklist.viatura?.prefixo_frota} • {selectedChecklist.viatura?.placa}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleImprimirLaudo(selectedChecklist)}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Emitir PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChecklist(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Cards de Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">VISTORIADOR</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedChecklist.tecnico_nome}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">ODÔMETRO</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{Number(selectedChecklist.odometro_km || 0).toLocaleString('pt-BR')} km</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">CONFORMIDADE</span>
                  <span className="font-black text-slate-900 dark:text-slate-100">{selectedChecklist.percentual_conformidade}%</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">STATUS</span>
                  <span className="font-bold uppercase text-red-600 dark:text-red-400">{selectedChecklist.status_aprovacao}</span>
                </div>
              </div>

              {/* Tabela do Laudo Pericial Hierarquizado pelos 8 Sistemas */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                  Auditoria Técnica dos 8 Sistemas Mestre
                </h4>
                <LaudoPericialVeicular checklist={selectedChecklist} />
              </div>

              {/* Itens com Não Conformidade e Fotos */}
              {selectedChecklist.itens && selectedChecklist.itens.some(i => i.parecer === 'NAO_CONFORME') && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Não Conformidades com Dual-Photo Evidence</span>
                  </h4>

                  <div className="space-y-3">
                    {selectedChecklist.itens
                      .filter(i => i.parecer === 'NAO_CONFORME')
                      .map((item, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-red-900 dark:text-red-300">
                              {item.sistema_grupo}: {item.item_nome}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-600 text-white uppercase">
                              {item.gravidade_anomalia || 'NC'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300">
                            <strong>Relato:</strong> {item.observacao_anomalia || 'Sem detalhes informados.'}
                          </p>

                          {/* Fotos Lado a Lado */}
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                Foto 1: Visão Geral / Contexto
                              </span>
                              <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 h-36 bg-black flex items-center justify-center">
                                {item.foto_evidencia_1_url ? (
                                  <img src={item.foto_evidencia_1_url} alt="Foto 1" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-slate-500 text-[10px]">Sem foto</span>
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                Foto 2: Detalhe / Macro da Avaria
                              </span>
                              <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 h-36 bg-black flex items-center justify-center">
                                {item.foto_evidencia_2_url ? (
                                  <img src={item.foto_evidencia_2_url} alt="Foto 2" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-slate-500 text-[10px]">Sem foto</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
