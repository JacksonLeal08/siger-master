'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ConfigAprovadorOS 
} from '@/lib/types/osWorkflow';
import { 
  listAprovadoresAction, 
  saveAprovadorAction, 
  deleteAprovadorAction 
} from '@/app/actions/osWorkflowActions';
import { useSpci } from '@/app/context/SpciContext';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  DollarSign, 
  Check, 
  X, 
  AlertTriangle, 
  Bell, 
  Mail, 
  Phone, 
  Zap, 
  Building2, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Send,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface ConfigAprovadoresOSTabProps {
  theme?: 'dark' | 'light';
  sitesList?: string[];
}

export const ConfigAprovadoresOSTab: React.FC<ConfigAprovadoresOSTabProps> = ({
  theme = 'dark',
  sitesList = ['GLOBAL', 'PARAUAPEBAS', 'SALOBO', 'ONÇA PUMA', 'UNIDADE INDUSTRIAL CARAJÁS - PAR']
}) => {
  const { triggerSuccessNotification } = useSpci();

  const [aprovadores, setAprovadores] = useState<ConfigAprovadorOS[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterContrato, setFilterContrato] = useState<string>('TODOS');
  const [filterNivel, setFilterNivel] = useState<string>('TODOS');

  // Testar envio de notificação
  const handleTestAlert = (ap: ConfigAprovadorOS) => {
    triggerSuccessNotification(
      'Teste de Alerta Homologado!',
      `Simulação enviada para ${ap.nome_aprovador} (${ap.whatsapp} / ${ap.email}).`
    );
    if (ap.notificar_whatsapp && ap.whatsapp) {
      const num = ap.whatsapp.replace(/\D/g, '').replace(/^55/, '');
      const msg = encodeURIComponent(`🚨 *SIGER MASTER • TESTE DE ALERTA DE ALÇADA*\n\nOlá *${ap.nome_aprovador}*, este é um teste de homologação do motor de notificações da sua alçada de OS (Faixa: R$ ${ap.valor_minimo} até R$ ${ap.valor_maximo}).\n\n✅ Canal de Notificação Operacional.`);
      window.open(`https://api.whatsapp.com/send?phone=55${num}&text=${msg}`, '_blank');
    }
  };

  // Modal de edição / criação
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAprovador, setEditingAprovador] = useState<Partial<ConfigAprovadorOS> | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Carrega lista inicial
  const loadAprovadores = async () => {
    setLoading(true);
    try {
      const res = await listAprovadoresAction();
      if (res.success && res.data) {
        setAprovadores(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAprovadores();
  }, []);

  // Filtros combinados
  const filteredList = aprovadores.filter(ap => {
    const matchSearch = ap.nome_aprovador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ap.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ap.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchContrato = filterContrato === 'TODOS' || 
      ap.contrato_id === filterContrato || 
      ap.contrato_id === 'GLOBAL';

    const matchNivel = filterNivel === 'TODOS' || String(ap.nivel_alcada) === filterNivel;

    return matchSearch && matchContrato && matchNivel;
  });

  const handleOpenNovo = () => {
    setEditingAprovador({
      contrato_id: 'GLOBAL',
      nome_aprovador: '',
      cargo: '',
      email: '',
      whatsapp: '+55 (94) 9',
      nivel_alcada: 1,
      valor_minimo: 0,
      valor_maximo: 5000,
      is_aprovador_imediato: false,
      receber_emergencia_24h: true,
      notificar_in_app: true,
      notificar_email: true,
      notificar_whatsapp: true,
      ativo: true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ap: ConfigAprovadorOS) => {
    setEditingAprovador({ ...ap });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente remover o aprovador ${nome}?`)) return;
    try {
      const res = await deleteAprovadorAction(id);
      if (res.success) {
        setAprovadores(prev => prev.filter(x => x.id !== id));
        triggerSuccessNotification('Aprovador Removido', `O cadastro de ${nome} foi excluído da matriz.`);
      }
    } catch (e: any) {
      alert('Erro ao excluir: ' + (e?.message || 'Erro inesperado'));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAprovador) return;

    if (!editingAprovador.nome_aprovador?.trim()) {
      setFormError('Por favor informe o Nome Completo.');
      return;
    }
    if (!editingAprovador.email?.trim() || !editingAprovador.email.includes('@')) {
      setFormError('Por favor informe um E-mail corporativo válido.');
      return;
    }
    if (!editingAprovador.whatsapp?.trim() || editingAprovador.whatsapp.length < 10) {
      setFormError('Por favor informe um WhatsApp válido com DDD.');
      return;
    }

    const min = Number(editingAprovador.valor_minimo || 0);
    const max = Number(editingAprovador.valor_maximo || 0);
    if (min >= max) {
      setFormError('O Valor Mínimo deve ser estritamente menor que o Valor Máximo da alçada.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const res = await saveAprovadorAction(editingAprovador);
      if (res.success && res.data) {
        await loadAprovadores();
        setIsModalOpen(false);
        triggerSuccessNotification(
          'Alçada Atualizada!',
          `O aprovador ${editingAprovador.nome_aprovador} foi cadastrado/atualizado na matriz de alçadas.`
        );
      } else {
        setFormError(res.error || 'Erro ao salvar aprovador.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Falha na comunicação com o servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickToggleImediato = async (ap: ConfigAprovadorOS) => {
    const updated = { ...ap, is_aprovador_imediato: !ap.is_aprovador_imediato };
    setAprovadores(prev => prev.map(x => x.id === ap.id ? updated : x));
    await saveAprovadorAction(updated);
    triggerSuccessNotification(
      'Flag de Aprovador Imediato',
      `${ap.nome_aprovador} agora ${updated.is_aprovador_imediato ? 'é' : 'não é'} o aprovador imediato para esta alçada.`
    );
  };

  // KPIs da Matriz
  const totalAtivos = aprovadores.filter(x => x.ativo).length;
  const countNivel1 = aprovadores.filter(x => x.nivel_alcada === 1 && x.ativo).length;
  const countNivel2 = aprovadores.filter(x => x.nivel_alcada === 2 && x.ativo).length;
  const countNivel3 = aprovadores.filter(x => x.nivel_alcada === 3 && x.ativo).length;
  const countImediatos = aprovadores.filter(x => x.is_aprovador_imediato && x.ativo).length;

  return (
    <div className="space-y-6 font-sans">

      {/* 1. CARDS KPI EXECUTIVOS DA MATRIZ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E2024] border border-slate-200 dark:border-[#3C3F45] shadow-xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Total Aprovadores</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{totalAtivos}</span>
            <span className="text-[10px] text-emerald-500 font-mono font-bold">Ativos</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-[#1C4E26]/20 border border-emerald-200 dark:border-[#68D346]/30 shadow-xs">
          <span className="text-[10px] font-mono text-emerald-700 dark:text-[#B7F365] uppercase block font-bold">Nível 1 (Até R$ 5k)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono text-emerald-800 dark:text-[#68D346]">{countNivel1}</span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">Operacional</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 shadow-xs">
          <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase block font-bold">Nível 2 (R$ 5k a 20k)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400">{countNivel2}</span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">Gerencial</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 shadow-xs">
          <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 uppercase block font-bold">Nível 3 (&gt; R$ 20k)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono text-cyan-700 dark:text-cyan-400">{countNivel3}</span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">Diretoria</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-xs col-span-2 md:col-span-1">
          <span className="text-[10px] font-mono text-rose-700 dark:text-rose-400 uppercase block font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 text-rose-500" />
            Aprov. Imediatos
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono text-rose-700 dark:text-rose-400">{countImediatos}</span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">1º Gatilho</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE CONTROLE & AÇÕES */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#1E2024] border border-slate-200 dark:border-[#3C3F45]">
        
        {/* Campo de Busca e Filtros */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, cargo ou e-mail..."
              className="w-full bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-[#68D346]"
            />
          </div>

          {/* Filtro Contrato */}
          <select
            value={filterContrato}
            onChange={(e) => setFilterContrato(e.target.value)}
            className="bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
          >
            <option value="TODOS">🌐 Todos os Contratos</option>
            {sitesList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Filtro Nível */}
          <select
            value={filterNivel}
            onChange={(e) => setFilterNivel(e.target.value)}
            className="bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
          >
            <option value="TODOS">Todos os Níveis</option>
            <option value="1">Nível 1 (Operacional)</option>
            <option value="2">Nível 2 (Gerencial)</option>
            <option value="3">Nível 3 (Diretoria)</option>
          </select>
        </div>

        {/* Botão Novo Aprovador */}
        <button
          type="button"
          onClick={handleOpenNovo}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1C4E26] to-[#68D346] hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Aprovador</span>
        </button>
      </div>

      {/* 3. LISTA / TABELA DE APROVADORES */}
      <div className="bg-white dark:bg-[#1E2024] rounded-2xl border border-slate-200 dark:border-[#3C3F45] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-[#282A2F] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1C4E26] dark:text-[#68D346]" />
            <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white font-['Hanken_Grotesk'] tracking-wider">
              Aprovadores Cadastrados por Alçada Financeira
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {filteredList.length} registro(s) encontrado(s)
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-400 animate-pulse">
            Carregando matriz de aprovadores...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-slate-400 space-y-2">
            <p>Nenhum aprovador encontrado com os filtros selecionados.</p>
            <button
              onClick={handleOpenNovo}
              className="text-xs font-bold text-[#68D346] underline cursor-pointer border-none bg-transparent"
            >
              Clique aqui para cadastrar o primeiro aprovador.
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 dark:bg-[#121418] text-slate-500 dark:text-zinc-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-[#282A2F]">
                <tr>
                  <th className="p-3.5 pl-5">Aprovador & Cargo</th>
                  <th className="p-3.5">Contrato</th>
                  <th className="p-3.5">Nível Alçada</th>
                  <th className="p-3.5">Faixa Financeira (R$)</th>
                  <th className="p-3.5 text-center">Aprovador Imediato</th>
                  <th className="p-3.5 text-center">Alertas 24/7</th>
                  <th className="p-3.5">Canais Ativos</th>
                  <th className="p-3.5 pr-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#282A2F]">
                {filteredList.map((ap) => {
                  const min = Number(ap.valor_minimo || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                  const max = Number(ap.valor_maximo || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                  return (
                    <tr 
                      key={ap.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#282A2F]/60 transition-colors"
                    >
                      {/* Nome e Cargo */}
                      <td className="p-3.5 pl-5">
                        <div className="font-bold text-slate-900 dark:text-zinc-100">
                          {ap.nome_aprovador}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {ap.cargo}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>{ap.email}</span>
                          <span>•</span>
                          <span>{ap.whatsapp}</span>
                        </div>
                      </td>

                      {/* Contrato */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono text-[10px] font-bold">
                          {ap.contrato_id}
                        </span>
                      </td>

                      {/* Nível de Alçada */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-black uppercase inline-flex items-center gap-1 ${
                          ap.nivel_alcada === 1 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#B7F365] border border-emerald-500/30'
                            : ap.nivel_alcada === 2
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                        }`}>
                          Nível {ap.nivel_alcada}
                        </span>
                      </td>

                      {/* Faixa Financeira */}
                      <td className="p-3.5 font-mono text-xs">
                        <span className="font-bold text-slate-800 dark:text-zinc-200">{min}</span>
                        <span className="text-slate-400 mx-1">até</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">{max}</span>
                      </td>

                      {/* Toggle Aprovador Imediato */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleQuickToggleImediato(ap)}
                          title="Alternar se este usuário é o aprovador imediato para esta faixa"
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-extrabold uppercase transition-all cursor-pointer border ${
                            ap.is_aprovador_imediato 
                              ? 'bg-[#1C4E26] text-[#B7F365] border-[#68D346] shadow-[0_0_10px_rgba(104,211,70,0.35)]' 
                              : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-400 border-transparent hover:border-slate-300'
                          }`}
                        >
                          {ap.is_aprovador_imediato ? '⚡ Imediato (Sim)' : 'Não'}
                        </button>
                      </td>

                      {/* Emergência 24/7 */}
                      <td className="p-3.5 text-center">
                        {ap.receber_emergencia_24h ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-red-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            24h Ativo
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">Comercial</span>
                        )}
                      </td>

                      {/* Canais Ativos */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span 
                            title={ap.notificar_in_app ? 'Sino In-App Ativo' : 'Sino Inativo'}
                            className={`p-1.5 rounded-lg text-xs ${ap.notificar_in_app ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-300 dark:bg-zinc-800 dark:text-zinc-600'}`}
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </span>

                          <span 
                            title={ap.notificar_email ? 'E-mail Ativo' : 'E-mail Inativo'}
                            className={`p-1.5 rounded-lg text-xs ${ap.notificar_email ? 'bg-cyan-500/10 text-cyan-500' : 'bg-slate-100 text-slate-300 dark:bg-zinc-800 dark:text-zinc-600'}`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </span>

                          <span 
                            title={ap.notificar_whatsapp ? 'WhatsApp Ativo' : 'WhatsApp Inativo'}
                            className={`p-1.5 rounded-lg text-xs ${ap.notificar_whatsapp ? 'bg-[#68D346]/20 text-[#68D346]' : 'bg-slate-100 text-slate-300 dark:bg-zinc-800 dark:text-zinc-600'}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTestAlert(ap)}
                            className="px-2 py-1.5 rounded-lg text-emerald-700 dark:text-[#B7F365] bg-emerald-50 dark:bg-[#1C4E26]/40 hover:brightness-110 transition-all cursor-pointer border border-emerald-500/30 text-[10px] font-mono font-bold uppercase flex items-center gap-1"
                            title="Simular e testar envio de notificação para este aprovador"
                          >
                            <Send className="w-3 h-3 text-[#68D346]" />
                            <span className="hidden sm:inline">Testar Alerta</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(ap)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border-none bg-transparent"
                            title="Editar aprovador"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(ap.id, ap.nome_aprovador)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer border-none bg-transparent"
                            title="Excluir aprovador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL DE CADASTRO / EDIÇÃO DE APROVADOR */}
      <AnimatePresence>
        {isModalOpen && editingAprovador && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-xl bg-white dark:bg-[#1E2024] border border-slate-200 dark:border-[#3C3F45] rounded-3xl shadow-2xl p-6 relative overflow-hidden text-slate-900 dark:text-zinc-100 font-sans"
            >
              {/* Top Banner Accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1C4E26] via-[#68D346] to-[#B7F365]" />

              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#282A2F] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#68D346] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold uppercase font-['Hanken_Grotesk'] text-slate-900 dark:text-white">
                      {editingAprovador.id ? 'Editar Aprovador de OS' : 'Novo Aprovador na Matriz'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Configure a alçada financeira e as preferências de alerta omnichannel.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white border-none bg-transparent cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                {/* Linha 1: Nome e Cargo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingAprovador.nome_aprovador || ''}
                      onChange={(e) => setEditingAprovador({ ...editingAprovador, nome_aprovador: e.target.value })}
                      placeholder="Ex: Eng. Carlos Mendes"
                      className="w-full bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-xl p-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#68D346]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                      Cargo / Função *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingAprovador.cargo || ''}
                      onChange={(e) => setEditingAprovador({ ...editingAprovador, cargo: e.target.value })}
                      placeholder="Ex: Coord. de Frotas & Emergência"
                      className="w-full bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-xl p-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#68D346]"
                    />
                  </div>
                </div>

                {/* Linha 2: E-mail e WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                      E-mail Corporativo *
                    </label>
                    <input
                      type="email"
                      required
                      value={editingAprovador.email || ''}
                      onChange={(e) => setEditingAprovador({ ...editingAprovador, email: e.target.value })}
                      placeholder="exemplo@siger.com.br"
                      className="w-full bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-xl p-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#68D346]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                      WhatsApp (com DDD) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingAprovador.whatsapp || ''}
                      onChange={(e) => setEditingAprovador({ ...editingAprovador, whatsapp: e.target.value })}
                      placeholder="+55 (94) 99123-4567"
                      className="w-full bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-xl p-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#68D346]"
                    />
                  </div>
                </div>

                {/* Linha 3: Contrato e Nível de Alçada */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                      Unidade / Contrato Operacional
                    </label>
                    <select
                      value={editingAprovador.contrato_id || 'GLOBAL'}
                      onChange={(e) => setEditingAprovador({ ...editingAprovador, contrato_id: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-xl p-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
                    >
                      <option value="GLOBAL">🌐 GLOBAL (Todos os Sites)</option>
                      {sitesList.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                      Nível de Alçada Financeira
                    </label>
                    <select
                      value={editingAprovador.nivel_alcada || 1}
                      onChange={(e) => setEditingAprovador({ ...editingAprovador, nivel_alcada: Number(e.target.value) as any })}
                      className="w-full bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-xl p-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
                    >
                      <option value={1}>Nível 1 - Operacional (Até R$ 5.000)</option>
                      <option value={2}>Nível 2 - Gerencial (R$ 5.000,01 a R$ 20.000)</option>
                      <option value={3}>Nível 3 - Diretoria (Acima de R$ 20.000)</option>
                    </select>
                  </div>
                </div>

                {/* Linha 4: Limites de Valor Mínimo e Máximo */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[#68D346] font-bold block">
                    Faixa de Aprovação Financeira (Critério de Alçada)
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase">Valor Mínimo (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingAprovador.valor_minimo ?? 0}
                        onChange={(e) => setEditingAprovador({ ...editingAprovador, valor_minimo: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-[#1E2024] border border-slate-200 dark:border-[#3C3F45] rounded-xl p-2 text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase">Valor Máximo (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingAprovador.valor_maximo ?? 5000}
                        onChange={(e) => setEditingAprovador({ ...editingAprovador, valor_maximo: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-[#1E2024] border border-slate-200 dark:border-[#3C3F45] rounded-xl p-2 text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Linha 5: Toggles de Governança e Alertas */}
                <div className="space-y-2.5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAprovador.is_aprovador_imediato || false}
                      onChange={(e) => setEditingAprovador({ ...editingAprovador, is_aprovador_imediato: e.target.checked })}
                      className="w-4 h-4 rounded text-[#1C4E26] focus:ring-[#68D346] cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      ⚡ Aprovador Imediato (Padrão para esta alçada)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAprovador.receber_emergencia_24h || false}
                      onChange={(e) => setEditingAprovador({ ...editingAprovador, receber_emergencia_24h: e.target.checked })}
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      🚨 Receber Alertas de Urgência / Emergência 24/7
                    </span>
                  </label>
                </div>

                {/* Canais Ativos */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45]">
                  <span className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-2">
                    Canais de Notificação Ativos:
                  </span>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingAprovador.notificar_in_app ?? true}
                        onChange={(e) => setEditingAprovador({ ...editingAprovador, notificar_in_app: e.target.checked })}
                        className="rounded text-[#68D346]"
                      />
                      <span className="text-xs">Sino In-App</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingAprovador.notificar_email ?? true}
                        onChange={(e) => setEditingAprovador({ ...editingAprovador, notificar_email: e.target.checked })}
                        className="rounded text-cyan-500"
                      />
                      <span className="text-xs">E-mail Corporativo</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingAprovador.notificar_whatsapp ?? true}
                        onChange={(e) => setEditingAprovador({ ...editingAprovador, notificar_whatsapp: e.target.checked })}
                        className="rounded text-[#68D346]"
                      />
                      <span className="text-xs">WhatsApp Estruturado</span>
                    </label>
                  </div>
                </div>

                {/* Botões do Rodapé */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#282A2F]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#3C3F45] text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#1C4E26] to-[#68D346] hover:brightness-110 active:scale-95 text-white font-mono font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer border-none disabled:opacity-50"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Aprovador'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ConfigAprovadoresOSTab;
