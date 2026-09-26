'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CATALOGO_10_SISTEMAS, 
  SistemaMacro, 
  SubcomponenteSelecionado, 
  AcaoSubcomponente, 
  PosicaoSubcomponente,
  avaliarCriticidadeAutomatica
} from '@/lib/types/vehicleAnatomy';
import { 
  Search, 
  Wrench, 
  Cog, 
  Disc, 
  OctagonAlert, 
  Compass, 
  Zap, 
  Thermometer, 
  Shield, 
  CircleDot, 
  Siren, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Minus, 
  Check, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles,
  DollarSign,
  Layers,
  X
} from 'lucide-react';

interface VehicleAnatomySelectorProps {
  natureza: 'PREVENTIVA' | 'CORRETIVA';
  onNaturezaChange?: (natureza: 'PREVENTIVA' | 'CORRETIVA') => void;
  selectedItems: SubcomponenteSelecionado[];
  onItemsChange: (items: SubcomponenteSelecionado[], valorTotal: number, prioridadeSugerida: 'NORMAL' | 'URGENTE' | 'EMERGENCIA') => void;
  readOnly?: boolean;
}

const ICON_MAP: Record<string, any> = {
  Wrench,
  Cog,
  Disc,
  OctagonAlert,
  Compass,
  Zap,
  Thermometer,
  Shield,
  CircleDot,
  Siren
};

export const VehicleAnatomySelector: React.FC<VehicleAnatomySelectorProps> = ({
  natureza,
  onNaturezaChange,
  selectedItems,
  onItemsChange,
  readOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSistemas, setExpandedSistemas] = useState<Record<string, boolean>>({
    '01_MOTOR': false,
    '02_TRANSMISSAO': false,
    '03_SUSPENSAO': false,
    '04_FREIOS': true, // Freios expandido por padrão para atenção
    '05_DIRECAO': false,
    '06_ELETRICA': false,
    '07_ARREFECIMENTO': false,
    '08_CARROCERIA': false,
    '09_PNEUS': false,
    '10_IMPLEMENTOS': false
  });

  // Toggle expansão do sistema
  const toggleSistema = (sistemaId: string) => {
    setExpandedSistemas(prev => ({
      ...prev,
      [sistemaId]: !prev[sistemaId]
    }));
  };

  // Expandir todos ou recolher todos
  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    CATALOGO_10_SISTEMAS.forEach(s => { allExpanded[s.id] = true; });
    setExpandedSistemas(allExpanded);
  };

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    CATALOGO_10_SISTEMAS.forEach(s => { allCollapsed[s.id] = false; });
    setExpandedSistemas(allCollapsed);
  };

  // Mapeamento rápido de itens selecionados por chave única (sistema + subcomponente)
  const selectedMap = useMemo(() => {
    const map = new Map<string, SubcomponenteSelecionado>();
    selectedItems.forEach(item => {
      map.set(`${item.codigo_sistema}__${item.nome_subcomponente}`, item);
    });
    return map;
  }, [selectedItems]);

  // Filtro de busca instantânea
  const filteredSistemas = useMemo(() => {
    if (!searchTerm.trim()) return CATALOGO_10_SISTEMAS;
    const term = searchTerm.toLowerCase();

    return CATALOGO_10_SISTEMAS.map(sistema => {
      const matchSistema = sistema.nome.toLowerCase().includes(term);
      const matchingSubs = sistema.subcomponentes.filter(sub => 
        sub.nome.toLowerCase().includes(term)
      );

      if (matchSistema || matchingSubs.length > 0) {
        return {
          ...sistema,
          subcomponentes: matchSistema ? sistema.subcomponentes : matchingSubs
        };
      }
      return null;
    }).filter(Boolean) as SistemaMacro[];
  }, [searchTerm]);

  // Se o usuário estiver pesquisando, auto-expande os sistemas que deram match
  React.useEffect(() => {
    if (searchTerm.trim()) {
      const autoExpanded: Record<string, boolean> = {};
      filteredSistemas.forEach(s => { autoExpanded[s.id] = true; });
      setExpandedSistemas(prev => ({ ...prev, ...autoExpanded }));
    }
  }, [searchTerm, filteredSistemas]);

  // Recalcular totais e severidade sempre que a lista mudar
  const triggerUpdate = (newItems: SubcomponenteSelecionado[]) => {
    const valorTotal = newItems.reduce((acc, curr) => acc + (curr.valor_total_item || 0), 0);
    const avaliacao = avaliarCriticidadeAutomatica(natureza, newItems);
    onItemsChange(newItems, valorTotal, avaliacao.prioridade);
  };

  // Toggle de seleção de subcomponente
  const handleToggleSubcomponente = (sistema: SistemaMacro, subNome: string) => {
    if (readOnly) return;
    const key = `${sistema.id}__${subNome}`;
    const subDef = sistema.subcomponentes.find(s => s.nome === subNome);
    const exists = selectedMap.get(key);

    if (exists) {
      // Remove da seleção
      const newItems = selectedItems.filter(i => !(i.codigo_sistema === sistema.id && i.nome_subcomponente === subNome));
      triggerUpdate(newItems);
    } else {
      // Adiciona novo subcomponente selecionado
      const newItem: SubcomponenteSelecionado = {
        id: crypto.randomUUID(),
        codigo_sistema: sistema.id,
        nome_componente_macro: sistema.nome,
        nome_subcomponente: subNome,
        acao: 'SUBSTITUICAO',
        posicao: 'COMPLETO',
        quantidade: 1,
        valor_unitario_estimado: 0,
        valor_total_item: 0,
        criticidade: subDef?.criticidadePadrao || 'NORMAL',
        twi_critico: false
      };
      const newItems = [...selectedItems, newItem];
      triggerUpdate(newItems);
    }
  };

  // Alteração de campos de um subcomponente flegado
  const handleUpdateItem = (
    sistemaId: string, 
    subNome: string, 
    updates: Partial<SubcomponenteSelecionado>
  ) => {
    if (readOnly) return;
    const newItems = selectedItems.map(item => {
      if (item.codigo_sistema === sistemaId && item.nome_subcomponente === subNome) {
        const updated = { ...item, ...updates };
        // Recalcula valor total do item
        if ('quantidade' in updates || 'valor_unitario_estimado' in updates) {
          const qtd = Number(updated.quantidade || 0);
          const val = Number(updated.valor_unitario_estimado || 0);
          updated.valor_total_item = parseFloat((qtd * val).toFixed(2));
        }
        return updated;
      }
      return item;
    });
    triggerUpdate(newItems);
  };

  // Análise da severidade atual
  const avaliacaoAtual = useMemo(() => {
    return avaliarCriticidadeAutomatica(natureza, selectedItems);
  }, [natureza, selectedItems]);

  const valorTotalEstimado = useMemo(() => {
    return selectedItems.reduce((acc, curr) => acc + (curr.valor_total_item || 0), 0);
  }, [selectedItems]);

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-zinc-100">
      
      {/* ========================================================================= */}
      {/* 1. SELEÇÃO DA NATUREZA DA MANUTENÇÃO (PREVENTIVA vs CORRETIVA)           */}
      {/* ========================================================================= */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E2024] border border-slate-200 dark:border-[#3C3F45] shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#68D346]" />
            Natureza da Manutenção Veicular
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {natureza === 'PREVENTIVA' ? 'Revisão periódica / Programada' : 'Avaria / Falha Operacional / Reprovação'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Botão Preventiva */}
          <button
            type="button"
            disabled={readOnly}
            onClick={() => onNaturezaChange && onNaturezaChange('PREVENTIVA')}
            className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
              natureza === 'PREVENTIVA'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-[#B7F365] ring-2 ring-emerald-500/30 font-black shadow-xs'
                : 'bg-slate-50 dark:bg-[#121418] border-slate-200 dark:border-[#282A2F] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${natureza === 'PREVENTIVA' ? 'bg-[#1C4E26] text-[#B7F365]' : 'bg-slate-200 dark:bg-[#282A2F]'}`}>
              <Wrench className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-mono font-black uppercase tracking-wider block">
                🛠️ MANUTENÇÃO PREVENTIVA
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate block">
                Revisão periódica, troca por tempo/KM ou CRLV
              </span>
            </div>
          </button>

          {/* Botão Corretiva */}
          <button
            type="button"
            disabled={readOnly}
            onClick={() => onNaturezaChange && onNaturezaChange('CORRETIVA')}
            className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
              natureza === 'CORRETIVA'
                ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-400 ring-2 ring-amber-500/30 font-black shadow-xs'
                : 'bg-slate-50 dark:bg-[#121418] border-slate-200 dark:border-[#282A2F] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${natureza === 'CORRETIVA' ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-[#282A2F]'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-mono font-black uppercase tracking-wider block">
                🔧 MANUTENÇÃO CORRETIVA
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate block">
                Falha mecânica/elétrica, desgaste ou TWI crítico
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE BUSCA INSTANTÂNEA E CONTROLES DE EXPANSÃO                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white dark:bg-[#1E2024] border border-slate-200 dark:border-[#3C3F45]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por componente (ex: pastilha, amortecedor, radiador, bicos)..."
            className="w-full bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-[#68D346]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white border-none bg-transparent cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={expandAll}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#282A2F] hover:bg-slate-200 dark:hover:bg-[#3C3F45] text-slate-600 dark:text-zinc-300 font-mono text-[10px] font-bold uppercase transition-all cursor-pointer border-none"
          >
            Expandir Tudo
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#282A2F] hover:bg-slate-200 dark:hover:bg-[#3C3F45] text-slate-600 dark:text-zinc-300 font-mono text-[10px] font-bold uppercase transition-all cursor-pointer border-none"
          >
            Recolher
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LISTA DOS 10 SISTEMAS MACRO & SUBCOMPONENTES (ACCORDION FLUIDO)       */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {filteredSistemas.map((sistema) => {
          const isExpanded = expandedSistemas[sistema.id] || false;
          const Icon = ICON_MAP[sistema.icone] || Wrench;

          // Conta quantos subcomponentes deste sistema estão selecionados
          const countSelecionados = sistema.subcomponentes.filter(sub => 
            selectedMap.has(`${sistema.id}__${sub.nome}`)
          ).length;

          const hasSelected = countSelecionados > 0;

          return (
            <div
              key={sistema.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                hasSelected
                  ? 'bg-white dark:bg-[#1E2024] border-emerald-500/60 dark:border-[#68D346]/40 shadow-sm'
                  : 'bg-white dark:bg-[#1E2024] border-slate-200 dark:border-[#3C3F45]'
              }`}
            >
              {/* Cabeçalho do Card do Sistema Macro */}
              <div
                onClick={() => toggleSistema(sistema.id)}
                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-[#282A2F]/50 transition-colors select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 transition-all ${
                    hasSelected
                      ? 'bg-gradient-to-tr from-[#1C4E26] to-[#68D346] text-white shadow-[0_0_10px_rgba(104,211,70,0.3)]'
                      : sistema.isCriticoGeral
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                        : 'bg-slate-100 dark:bg-[#121418] text-slate-500 dark:text-zinc-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-400">
                        {sistema.numero}.
                      </span>
                      <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white font-['Hanken_Grotesk'] truncate">
                        {sistema.nome}
                      </h4>
                      {sistema.isCriticoGeral && (
                        <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-red-500/10 text-red-500 border border-red-500/30 text-[9px] font-mono font-bold uppercase">
                          Segurança Crítica
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {sistema.subcomponentes.length} subcomponentes catalogados
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {hasSelected && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-[#B7F365] font-mono text-[10px] font-black">
                      {countSelecionados} flegado(s)
                    </span>
                  )}

                  <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-[#121418] flex items-center justify-center text-slate-400">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              {/* Accordion com Subcomponentes */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-150 dark:border-[#282A2F] bg-slate-50/60 dark:bg-[#15171B] p-3 space-y-2.5"
                  >
                    {sistema.subcomponentes.map((sub) => {
                      const itemKey = `${sistema.id}__${sub.nome}`;
                      const isChecked = selectedMap.has(itemKey);
                      const currentItem = selectedMap.get(itemKey);

                      return (
                        <div
                          key={sub.nome}
                          className={`p-3 rounded-xl border transition-all ${
                            isChecked
                              ? 'bg-white dark:bg-[#1E2024] border-emerald-500/40 dark:border-[#68D346]/40 shadow-xs'
                              : 'bg-white/70 dark:bg-[#181A1E] border-slate-200 dark:border-[#282A2F] hover:border-slate-300'
                          }`}
                        >
                          {/* Linha 1: Checkbox e Nome do Subcomponente */}
                          <div className="flex items-start sm:items-center justify-between gap-2">
                            <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                disabled={readOnly}
                                checked={isChecked}
                                onChange={() => handleToggleSubcomponente(sistema, sub.nome)}
                                className="w-4 h-4 rounded text-[#1C4E26] focus:ring-[#68D346] cursor-pointer"
                              />
                              <span className={`text-xs font-bold ${
                                isChecked ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-zinc-300'
                              }`}>
                                {sub.nome}
                              </span>
                            </label>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {sub.criticidadePadrao === 'EMERGENCIA' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-red-600/10 text-red-500 border border-red-500/30">
                                  Emergencial
                                </span>
                              )}
                              {sub.criticidadePadrao === 'URGENTE' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                  Urgente
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Linha 2 (Expandida se Flegado): Controles de Ação, Posição, Qtd e Valor */}
                          {isChecked && currentItem && (
                            <div className="mt-3 pt-3 border-t border-slate-150 dark:border-[#282A2F] space-y-2.5">
                              
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                                
                                {/* 1. Ação Requerida */}
                                <div>
                                  <label className="block text-[9px] font-mono uppercase text-slate-400 font-bold mb-1">
                                    Ação Técnica
                                  </label>
                                  <select
                                    disabled={readOnly}
                                    value={currentItem.acao}
                                    onChange={(e) => handleUpdateItem(sistema.id, sub.nome, { acao: e.target.value as AcaoSubcomponente })}
                                    className="w-full bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-lg p-1.5 text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 focus:outline-none"
                                  >
                                    <option value="SUBSTITUICAO">Substituição (Troca)</option>
                                    <option value="REPARO">Reparo / Recuperação</option>
                                    <option value="REGULAGEM">Regulagem / Calibração</option>
                                    <option value="REVISAO">Revisão / Inspeção</option>
                                  </select>
                                </div>

                                {/* 2. Posição / Eixo */}
                                <div>
                                  <label className="block text-[9px] font-mono uppercase text-slate-400 font-bold mb-1">
                                    Posição / Lado
                                  </label>
                                  <select
                                    disabled={readOnly}
                                    value={currentItem.posicao}
                                    onChange={(e) => handleUpdateItem(sistema.id, sub.nome, { posicao: e.target.value as PosicaoSubcomponente })}
                                    className="w-full bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-lg p-1.5 text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 focus:outline-none"
                                  >
                                    <option value="COMPLETO">Conjunto Completo</option>
                                    <option value="DIANTEIRO">Dianteiro (Par/Eixo)</option>
                                    <option value="TRASEIRO">Traseiro (Par/Eixo)</option>
                                    <option value="ESQUERDO">Lado Esquerdo</option>
                                    <option value="DIREITO">Lado Direito</option>
                                  </select>
                                </div>

                                {/* 3. Quantidade */}
                                <div>
                                  <label className="block text-[9px] font-mono uppercase text-slate-400 font-bold mb-1">
                                    Quantidade
                                  </label>
                                  <div className="flex items-center">
                                    <input
                                      type="number"
                                      min="1"
                                      step="1"
                                      disabled={readOnly}
                                      value={currentItem.quantidade}
                                      onChange={(e) => handleUpdateItem(sistema.id, sub.nome, { quantidade: Math.max(1, parseInt(e.target.value) || 1) })}
                                      className="w-full bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-lg p-1.5 text-xs font-mono font-bold text-center text-slate-800 dark:text-zinc-200 focus:outline-none"
                                    />
                                  </div>
                                </div>

                                {/* 4. Valor Unitário Estimado (R$) */}
                                <div>
                                  <label className="block text-[9px] font-mono uppercase text-slate-400 font-bold mb-1">
                                    Unitário Estimado (R$)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    disabled={readOnly}
                                    placeholder="0,00"
                                    value={currentItem.valor_unitario_estimado || ''}
                                    onChange={(e) => handleUpdateItem(sistema.id, sub.nome, { valor_unitario_estimado: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-lg p-1.5 text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 focus:outline-none"
                                  />
                                </div>

                              </div>

                              {/* Flag Especial de TWI Crítico para Pneus */}
                              {sub.permiteTwiCritico && (
                                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between">
                                  <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-red-600 dark:text-red-400">
                                    <input
                                      type="checkbox"
                                      disabled={readOnly}
                                      checked={currentItem.twi_critico || false}
                                      onChange={(e) => handleUpdateItem(sistema.id, sub.nome, { twi_critico: e.target.checked })}
                                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                                    />
                                    <span>⚠️ Reprovação no TWI (Profundidade do sulco &le; 1,60 mm ou corte estrutural)</span>
                                  </label>
                                  <span className="text-[9px] font-mono font-black text-red-500 uppercase">
                                    Gera Emergência Automática
                                  </span>
                                </div>
                              )}

                              {/* Subtotal do Item */}
                              <div className="flex justify-end items-center gap-2 text-[11px] font-mono pt-1">
                                <span className="text-slate-400">Subtotal do item:</span>
                                <span className="font-black text-[#1C4E26] dark:text-[#68D346]">
                                  {Number(currentItem.valor_total_item || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>

                            </div>
                          )}

                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. COCKPIT HUD INFERIOR: RESUMO ANATÔMICO, SEVERIDADE E ORÇAMENTO TOTAL   */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-[#181A1E] border border-slate-700 dark:border-[#3C3F45] text-white shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Contagem de Itens e Severidade */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-[#68D346]">
                Cockpit de Diagnóstico & Alçada
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-mono text-slate-300">
                {selectedItems.length} subcomponente(s) flegado(s)
              </span>
            </div>

            {/* Badge de Severidade Calculada */}
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black uppercase flex items-center gap-1.5 ${
                avaliacaoAtual.prioridade === 'EMERGENCIA'
                  ? 'bg-red-600 text-white shadow-[0_0_12px_#ef4444] animate-pulse'
                  : avaliacaoAtual.prioridade === 'URGENTE'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_10px_#f59e0b]'
                    : 'bg-[#1C4E26] text-[#B7F365] border border-[#68D346]'
              }`}>
                {avaliacaoAtual.prioridade === 'EMERGENCIA' ? '🔴 EMERGÊNCIA' : avaliacaoAtual.prioridade === 'URGENTE' ? '🟠 URGENTE' : '🟢 NORMAL'}
              </span>

              <span className="text-[11px] text-slate-300 font-mono">
                {avaliacaoAtual.motivo}
              </span>
            </div>
          </div>

          {/* Orçamento Total Estimado */}
          <div className="sm:text-right shrink-0">
            <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
              Valor Total Estimado da OS
            </span>
            <span className="text-2xl font-black font-mono text-[#68D346] tracking-tight block">
              {valorTotalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
};

export default VehicleAnatomySelector;
