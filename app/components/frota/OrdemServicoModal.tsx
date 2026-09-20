'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Viatura, 
  OrdemServicoFrota, 
  OficinaPrestador, 
  TipoOrdemServico, 
  NaturezaManutencao, 
  StatusOrdemServico,
  ItemChecklistOs
} from '@/lib/types/frota';
import { saveOrdemServicoAction, listOficinasAction } from '@/app/actions/frotaActions';
import { soundNotificationService } from '@/lib/soundNotificationService';
import { Wrench, Minus, Maximize2, Minimize2, X, Plus, Trash2, Printer, CheckCircle2, DollarSign } from 'lucide-react';

interface OrdemServicoModalProps {
  isOpen: boolean;
  viatura: Viatura;
  contratoId: string;
  osToEdit?: OrdemServicoFrota | null;
  onClose: () => void;
  onMinimize: () => void;
  onSuccess: (saved: OrdemServicoFrota) => void;
}

export const OrdemServicoModal: React.FC<OrdemServicoModalProps> = ({
  isOpen,
  viatura,
  contratoId,
  osToEdit,
  onClose,
  onMinimize,
  onSuccess
}) => {
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [oficinas, setOficinas] = useState<OficinaPrestador[]>([]);

  // Form states
  const [numeroOs, setNumeroOs] = useState(`OS-${Date.now().toString().slice(-6)}`);
  const [tipoOs, setTipoOs] = useState<TipoOrdemServico>('EXTERNA');
  const [oficinaId, setOficinaId] = useState<string>('');
  const [natureza, setNatureza] = useState<NaturezaManutencao>('PREVENTIVA');
  const [odometro, setOdometro] = useState<string>(String(viatura.odometro_atual_km || 0));
  const [descricao, setDescricao] = useState('');
  const [custoPecas, setCustoPecas] = useState<string>('0');
  const [custoMaoObra, setCustoMaoObra] = useState<string>('0');
  const [status, setStatus] = useState<StatusOrdemServico>('EM_ANDAMENTO');
  
  // Checklist de itens
  const [checklist, setChecklist] = useState<ItemChecklistOs[]>([
    { id: '1', descricao: 'Substituição de óleo lubrificante 5W30', concluido: true },
    { id: '2', descricao: 'Troca de filtro de óleo e combustível', concluido: true },
    { id: '3', descricao: 'Revisão das pastilhas e discos de freio', concluido: false }
  ]);
  const [novoItemDesc, setNovoItemDesc] = useState('');

  useEffect(() => {
    listOficinasAction(contratoId).then(res => {
      if (res.success && res.data) {
        setOficinas(res.data);
        if (res.data.length > 0 && !oficinaId) {
          setOficinaId(res.data[0].id);
        }
      }
    });
  }, [contratoId]);

  useEffect(() => {
    if (osToEdit) {
      setNumeroOs(osToEdit.numero_os);
      setTipoOs(osToEdit.tipo_os);
      setOficinaId(osToEdit.oficina_id || '');
      setNatureza(osToEdit.natureza_manutencao);
      setOdometro(String(osToEdit.odometro_km));
      setDescricao(osToEdit.descricao_servico);
      setCustoPecas(String(osToEdit.custo_pecas));
      setCustoMaoObra(String(osToEdit.custo_mao_de_obra));
      setStatus(osToEdit.status);
      setChecklist(osToEdit.itens_checklist || []);
    } else {
      setNumeroOs(`OS-${Date.now().toString().slice(-6)}`);
      setTipoOs('EXTERNA');
      setNatureza('PREVENTIVA');
      setOdometro(String(viatura.odometro_atual_km || 0));
      setDescricao('');
      setCustoPecas('0');
      setCustoMaoObra('0');
      setStatus('EM_ANDAMENTO');
    }
  }, [osToEdit, isOpen, viatura.odometro_atual_km]);

  const custoTotal = useMemo(() => {
    const p = parseFloat(custoPecas) || 0;
    const m = parseFloat(custoMaoObra) || 0;
    return (p + m).toFixed(2);
  }, [custoPecas, custoMaoObra]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (!novoItemDesc.trim()) return;
    setChecklist([
      ...checklist,
      { id: Date.now().toString(), descricao: novoItemDesc.trim(), concluido: false }
    ]);
    setNovoItemDesc('');
  };

  const handleToggleItem = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, concluido: !item.concluido } : item));
  };

  const handleRemoveItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const handlePrintRomaneio = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      alert('Informe a descrição do serviço a ser realizado.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveOrdemServicoAction({
        id: osToEdit?.id,
        contrato_id: contratoId || viatura.contrato_id || 'ONÇA PUMA',
        numero_os: numeroOs,
        viatura_id: viatura.id,
        oficina_id: tipoOs === 'EXTERNA' ? (oficinaId || null) : null,
        tipo_os: tipoOs,
        natureza_manutencao: natureza,
        odometro_km: parseFloat(odometro) || 0,
        descricao_servico: descricao,
        custo_pecas: parseFloat(custoPecas) || 0,
        custo_mao_de_obra: parseFloat(custoMaoObra) || 0,
        status,
        itens_checklist: checklist,
        data_abertura: osToEdit?.data_abertura || new Date().toISOString(),
        data_conclusao: status === 'CONCLUIDA' ? new Date().toISOString() : null
      });

      if (res.success && res.data) {
        soundNotificationService.playSuccessSound();
        onSuccess(res.data);
        onClose();
      } else {
        alert(res.error || 'Falha ao gravar Ordem de Serviço.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao salvar OS.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-5 select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-3xl max-h-[92vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Ordem de Serviço (OS Frota): {numeroOs}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                Viatura: <strong>{viatura.prefixo_frota}</strong> ({viatura.modelo} — {viatura.placa})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrintRomaneio}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent flex items-center gap-1 text-[10px] font-bold uppercase mr-2"
              title="Imprimir Romaneio de Encaminhamento"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Romaneio</span>
            </button>
            <button
              type="button"
              onClick={onMinimize}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent"
              title="Minimizar para Dock"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent"
              title={isMaximized ? 'Restaurar' : 'Maximizar'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer border-none bg-transparent"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Seção 1: Classificação da OS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Tipo de Manutenção *
              </label>
              <select
                value={tipoOs}
                onChange={(e) => setTipoOs(e.target.value as TipoOrdemServico)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="EXTERNA">Oficina Externa Credenciada</option>
                <option value="INTERNA">Oficina Interna da Base SPCI</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Natureza *
              </label>
              <select
                value={natureza}
                onChange={(e) => setNatureza(e.target.value as NaturezaManutencao)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="PREVENTIVA">Preventiva Programada</option>
                <option value="CORRETIVA">Corretiva</option>
                <option value="EMERGENCIAL">Emergencial / Socorro</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Status da OS *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusOrdemServico)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="ABERTA">Aberta / Triagem</option>
                <option value="EM_ANDAMENTO">Em Execução</option>
                <option value="AGUARDANDO_PECAS">Aguardando Peças</option>
                <option value="CONCLUIDA">Concluída / Liberada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Oficina Credenciada (se externa) e Odômetro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tipoOs === 'EXTERNA' ? (
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Oficina Credenciada Vinculada *
                </label>
                <select
                  value={oficinaId}
                  onChange={(e) => setOficinaId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer focus:border-red-600"
                  required
                >
                  <option value="">Selecione a Oficina...</option>
                  {oficinas.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.razao_social} {o.cnpj ? `(${o.cnpj})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Local de Execução Interno
                </label>
                <input
                  type="text"
                  value="Oficina Central da Brigada SPCI"
                  disabled
                  className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-500"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Odômetro de Entrada (KM) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={odometro}
                onChange={(e) => setOdometro(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-red-600"
                required
              />
            </div>
          </div>

          {/* Descrição dos Serviços */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
              Escopo e Descrição dos Serviços *
            </label>
            <textarea
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva detalhadamente os sintomas, serviços solicitados e peças a serem substituídas..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-red-600"
              required
            />
          </div>

          {/* Checklist de Peças e Itens de Manutenção */}
          <div className="space-y-2.5 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Checklist de Itens e Peças Realizadas
              </h4>
              <span className="text-[9px] font-mono text-slate-400">
                {checklist.filter(c => c.concluido).length} de {checklist.length} concluídos
              </span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {checklist.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.concluido}
                      onChange={() => handleToggleItem(item.id)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span className={`truncate text-[11px] ${item.concluido ? 'line-through text-slate-400' : 'font-bold text-slate-700 dark:text-slate-200'}`}>
                      {item.descricao}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-slate-400 hover:text-red-500 p-1 border-none bg-transparent cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Adicionar item ao checklist (ex: Troca de pastilhas de freio dianteiras)"
                value={novoItemDesc}
                onChange={(e) => setNovoItemDesc(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-medium outline-none"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer border-none"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
          </div>

          {/* Custos e Validação Financeira */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Custo de Peças (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={custoPecas}
                onChange={(e) => setCustoPecas(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Mão de Obra (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={custoMaoObra}
                onChange={(e) => setCustoMaoObra(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Custo Total da OS
              </label>
              <div className="w-full bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>R$ {custoTotal}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Wrench className="w-4 h-4" />
              {isSaving ? 'Gravando OS...' : 'Salvar Ordem de Serviço'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
