'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChecklistVeicular, 
  ChecklistItemAvaliacao, 
  SistemaGrupoChecklist 
} from '@/lib/types/frota';
import { 
  CheckCircle2, 
  AlertTriangle, 
  MinusCircle, 
  Camera, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

interface LaudoPericialVeicularProps {
  checklist: ChecklistVeicular;
  theme?: 'light' | 'dark';
}

const SISTEMAS_CONFIG: Record<SistemaGrupoChecklist, { titulo: string; icone: string; ordem: number }> = {
  FREIOS: { titulo: '1. SISTEMA DE FREIOS & CIRCUITO HIDRÁULICO', icone: '🛑', ordem: 1 },
  SUSPENSAO: { titulo: '2. SISTEMA DE SUSPENSÃO & DIREÇÃO OPERACIONAL', icone: '🔩', ordem: 2 },
  MOTOR_CAMBIO: { titulo: '3. MOTOR, TRANSMISSÃO & ARREFECIMENTO', icone: '⚙️', ordem: 3 },
  ELETRICA: { titulo: '4. SISTEMA ELÉTRICO & GERENCIAMENTO ELETRÔNICO', icone: '⚡', ordem: 4 },
  ILUMINACAO: { titulo: '5. ILUMINAÇÃO & SINALIZAÇÃO DE EMERGÊNCIA TÁTICA', icone: '💡', ordem: 5 },
  PNEUS: { titulo: '6. PNEUS, CONJUNTO DE RODAS & DESGASTE TWI', icone: '🛞', ordem: 6 },
  EQUIPAMENTOS: { titulo: '7. EQUIPAMENTOS DE BORDO & SEGURANÇA OBRIGATÓRIA', icone: '🦺', ordem: 7 },
  IMPLEMENTOS_ESPECIFICOS: { titulo: '8. IMPLEMENTOS ESPECÍFICOS DE RESGATE / COMBATE A INCÊNDIO', icone: '🚒', ordem: 8 }
};

export const LaudoPericialVeicular: React.FC<LaudoPericialVeicularProps> = ({
  checklist,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const [fotoPreview, setFotoPreview] = useState<{ url: string; titulo: string } | null>(null);
  const [sistemasRecolhidos, setSistemasRecolhidos] = useState<Record<string, boolean>>({});

  const toggleSistema = (chave: string) => {
    setSistemasRecolhidos(prev => ({ ...prev, [chave]: !prev[chave] }));
  };

  // Agrupamento dos Itens por Sistema Mestre
  const itensAgrupados = useMemo(() => {
    const grupos: Partial<Record<SistemaGrupoChecklist, ChecklistItemAvaliacao[]>> = {};

    (checklist.itens || []).forEach(item => {
      const grupo = item.sistema_grupo || 'EQUIPAMENTOS';
      if (!grupos[grupo]) {
        grupos[grupo] = [];
      }
      grupos[grupo]!.push(item);
    });

    return Object.entries(grupos).sort(([a], [b]) => {
      const ordemA = SISTEMAS_CONFIG[a as SistemaGrupoChecklist]?.ordem || 99;
      const ordemB = SISTEMAS_CONFIG[b as SistemaGrupoChecklist]?.ordem || 99;
      return ordemA - ordemB;
    }) as [SistemaGrupoChecklist, ChecklistItemAvaliacao[]][];
  }, [checklist.itens]);

  return (
    <div className="space-y-4 font-sans select-none">
      {/* Tabela Hierárquica sem coluna lateral redundante */}
      <div className={`overflow-hidden rounded-2xl border shadow-sm ${
        isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[10px] font-black uppercase tracking-wider font-mono ${
                isDark ? 'bg-zinc-950/80 text-zinc-400 border-zinc-800' : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                <th className="py-3 px-4 w-[60%]">Item / Componente Verificado</th>
                <th className="py-3 px-4 w-[22%] text-center">Parecer Técnico</th>
                <th className="py-3 px-4 w-[18%] text-center">Gravidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {itensAgrupados.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-xs text-slate-400">
                    Nenhum item discriminado para este laudo pericial.
                  </td>
                </tr>
              ) : (
                itensAgrupados.map(([grupoChave, itens]) => {
                  const conf = SISTEMAS_CONFIG[grupoChave] || {
                    titulo: grupoChave,
                    icone: '📋',
                    ordem: 99
                  };
                  const isRecolhido = !!sistemasRecolhidos[grupoChave];
                  const qtdNaoConforme = itens.filter(i => i.parecer === 'NAO_CONFORME').length;

                  return (
                    <React.Fragment key={grupoChave}>
                      {/* ========================================================== */}
                      {/* LINHA MESTRA / TÓPICO PRINCIPAL (SECTION HEADER TOTAL SPAN) */}
                      {/* ========================================================== */}
                      <tr 
                        onClick={() => toggleSistema(grupoChave)}
                        className={`cursor-pointer transition-colors border-y ${
                          isDark 
                            ? 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-100 border-zinc-700/80' 
                            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-900 border-slate-300'
                        }`}
                      >
                        <td colSpan={3} className="py-2.5 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{conf.icone}</span>
                              <span className="text-xs font-black uppercase tracking-wider">
                                {conf.titulo}
                              </span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-white text-slate-700 border border-slate-200'
                              }`}>
                                {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                              </span>
                              {qtdNaoConforme > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                                  {qtdNaoConforme} NÃO CONFORME{qtdNaoConforme > 1 ? 'S' : ''}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                            >
                              {isRecolhido ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ========================================================== */}
                      {/* SUBTÓPICOS / ITENS DE AUDITORIA COM RECUO PL-6 */}
                      {/* ========================================================== */}
                      {!isRecolhido && itens.map((item, idx) => {
                        const isNaoConforme = item.parecer === 'NAO_CONFORME';
                        const isConforme = item.parecer === 'CONFORME';
                        const temFotos = !!(item.foto_evidencia_1_url || item.foto_evidencia_2_url);

                        return (
                          <tr 
                            key={item.id || idx}
                            className={`transition-colors text-xs ${
                              isNaoConforme
                                ? isDark ? 'bg-red-950/25 hover:bg-red-950/40' : 'bg-red-50/70 hover:bg-red-100/60'
                                : isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-slate-50'
                            }`}
                          >
                            {/* 1. Item / Componente com Recuo */}
                            <td className="py-2.5 pl-7 pr-4">
                              <div className="flex items-start gap-2">
                                <span className="text-slate-400 font-mono text-[10px] pt-0.5">
                                  {String(idx + 1).padStart(2, '0')}.
                                </span>
                                <div className="space-y-1">
                                  <p className={`font-semibold ${
                                    isNaoConforme 
                                      ? 'text-red-950 dark:text-red-200 font-bold' 
                                      : isDark ? 'text-zinc-200' : 'text-slate-800'
                                  }`}>
                                    {item.item_nome}
                                  </p>

                                  {isNaoConforme && item.observacao_anomalia && (
                                    <p className="text-[11px] text-red-800 dark:text-red-300 italic font-medium">
                                      Relato: {item.observacao_anomalia}
                                    </p>
                                  )}

                                  {/* Botões para visualizar as fotos anexadas do laudo */}
                                  {temFotos && (
                                    <div className="flex items-center gap-2 pt-1">
                                      {item.foto_evidencia_1_url && (
                                        <button
                                          type="button"
                                          onClick={() => setFotoPreview({
                                            url: item.foto_evidencia_1_url!,
                                            titulo: `${item.item_nome} - Foto 1 (Visão Geral)`
                                          })}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white dark:bg-zinc-800 hover:bg-red-600 transition-colors cursor-pointer"
                                        >
                                          <Camera className="w-3 h-3" />
                                          <span>Foto 1 (Contexto)</span>
                                        </button>
                                      )}
                                      {item.foto_evidencia_2_url && (
                                        <button
                                          type="button"
                                          onClick={() => setFotoPreview({
                                            url: item.foto_evidencia_2_url!,
                                            titulo: `${item.item_nome} - Foto 2 (Macro / Dano)`
                                          })}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white dark:bg-zinc-800 hover:bg-red-600 transition-colors cursor-pointer"
                                        >
                                          <Camera className="w-3 h-3" />
                                          <span>Foto 2 (Detalhe)</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 2. Parecer Técnico */}
                            <td className="py-2.5 px-4 text-center">
                              {isConforme ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  CONFORME
                                </span>
                              ) : isNaoConforme ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/40">
                                  <AlertTriangle className="w-3 h-3" />
                                  NÃO CONFORME
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-slate-100 dark:bg-zinc-800 text-slate-500">
                                  <MinusCircle className="w-3 h-3" />
                                  N/A
                                </span>
                              )}
                            </td>

                            {/* 3. Gravidade da Não Conformidade */}
                            <td className="py-2.5 px-4 text-center font-mono">
                              {item.gravidade_anomalia ? (
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  item.gravidade_anomalia === 'CRITICA'
                                    ? 'bg-rose-600 text-white'
                                    : item.gravidade_anomalia === 'MEDIA'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-blue-600 text-white'
                                }`}>
                                  {item.gravidade_anomalia}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-bold">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualizador Modal Flutuante de Foto de Evidência */}
      {fotoPreview && (
        <div 
          onClick={() => setFotoPreview(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl"
          >
            <div className="p-3 bg-zinc-900 flex items-center justify-between border-b border-zinc-800">
              <span className="text-xs font-bold text-white truncate">
                {fotoPreview.titulo}
              </span>
              <button
                type="button"
                onClick={() => setFotoPreview(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black">
              <img 
                src={fotoPreview.url} 
                alt="Evidência" 
                className="max-h-[75vh] w-auto object-contain rounded-lg" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
