'use client';

import React, { useState, useEffect } from 'react';
import { Viatura, OrdemServicoFrota, OficinaPrestador } from '@/lib/types/frota';
import { listOficinasAction, saveOrdemServicoAction } from '@/app/actions/frotaActions';
import { 
  Wrench, 
  ArrowLeft, 
  Send, 
  Camera, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Gauge, 
  FileText,
  Clock,
  Car,
  Calendar
} from 'lucide-react';
import { compressImageToCanvas } from './DualPhotoCapture';
import { VehicleAnatomySelector } from './VehicleAnatomySelector';
import { SubcomponenteSelecionado, formatarResumoAnatomico } from '@/lib/types/vehicleAnatomy';
import { CriticidadeOS } from '@/lib/types/osWorkflow';

interface VeiculoOrdemServicoFormProps {
  viatura: Viatura;
  contratoId: string;
  theme?: 'light' | 'dark';
  onBack: () => void;
  onSuccess: (os: OrdemServicoFrota) => void;
}

export const VeiculoOrdemServicoForm: React.FC<VeiculoOrdemServicoFormProps> = ({
  viatura,
  contratoId,
  theme = 'dark',
  onBack,
  onSuccess
}) => {
  const isDark = theme === 'dark';

  const [dataAbertura, setDataAbertura] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [tipoOs, setTipoOs] = useState<'INTERNA' | 'EXTERNA'>('INTERNA');
  const [natureza, setNatureza] = useState<'PREVENTIVA' | 'CORRETIVA'>('CORRETIVA');
  const [prioridade, setPrioridade] = useState<CriticidadeOS>('NORMAL');
  const [subcomponentes, setSubcomponentes] = useState<SubcomponenteSelecionado[]>([]);
  const [resumoAnatomico, setResumoAnatomico] = useState('');
  const [valorEstimado, setValorEstimado] = useState(0);
  const [odometro, setOdometro] = useState(String(viatura.odometro_atual_km || 0));
  const [descricao, setDescricao] = useState('');
  const [solicitanteNome, setSolicitanteNome] = useState('');
  const [oficinaId, setOficinaId] = useState('');
  const [oficinas, setOficinas] = useState<OficinaPrestador[]>([]);
  const [loadingOficinas, setLoadingOficinas] = useState(false);
  const [fotoEvidencia, setFotoEvidencia] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  // Carregar oficinas cadastradas
  useEffect(() => {
    async function loadOficinas() {
      setLoadingOficinas(true);
      try {
        const res = await listOficinasAction(contratoId);
        if (res.success && res.data) {
          setOficinas(res.data);
          if (res.data.length > 0) {
            setOficinaId(res.data[0].id);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar oficinas:', err);
      } finally {
        setLoadingOficinas(false);
      }
    }
    loadOficinas();
  }, [contratoId]);

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageToCanvas(file);
        setFotoEvidencia(compressed);
      } catch (err) {
        console.error('Erro ao comprimir foto de avaria:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg(null);

    if (!descricao.trim()) {
      setErroMsg('Informe o relato da falha ou sintomas observados.');
      return;
    }

    if (tipoOs === 'EXTERNA' && !oficinaId) {
      setErroMsg('Selecione uma oficina credenciada homologada.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Partial<OrdemServicoFrota> = {
        contrato_id: contratoId,
        viatura_id: viatura.id,
        tipo_os: tipoOs,
        natureza_manutencao: natureza,
        tipo_manutencao: natureza,
        prioridade: prioridade,
        resumo_anatomico: resumoAnatomico,
        itens_componentes_json: subcomponentes as any,
        valor_estimado: valorEstimado,
        custo_pecas: valorEstimado,
        custo_total: valorEstimado,
        odometro_km: parseFloat(odometro) || 0,
        descricao_servico: `[Abertura Mobile via Terminal] Solicitante: ${solicitanteNome.trim() || 'Motorista Operacional'}\nRelato: ${descricao.trim()}`,
        responsavel_abertura: solicitanteNome.trim() || 'Motorista Operacional',
        status: 'ABERTA',
        status_os: 'ABERTA',
        oficina_id: tipoOs === 'EXTERNA' ? oficinaId : null,
        comprovantes_urls: fotoEvidencia ? [fotoEvidencia] : [],
        data_abertura: dataAbertura ? new Date(dataAbertura).toISOString() : new Date().toISOString()
      };

      const res = await saveOrdemServicoAction(payload);
      if (res.success && res.data) {
        onSuccess(res.data);
      } else {
        setErroMsg(res.error || 'Falha ao registrar Ordem de Serviço.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErroMsg(err?.message || 'Erro inesperado ao abrir OS.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen pb-24 select-none ${
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-slate-900'
    }`} translate="no">
      {/* Header Fixo */}
      <div className={`sticky top-0 z-30 px-4 py-3 border-b backdrop-blur-md flex items-center justify-between shadow-xs ${
        isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/95 border-slate-300'
      }`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`p-2 rounded-xl border transition-colors ${
              isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider uppercase text-amber-500">
                {viatura.prefixo_frota} • {viatura.placa}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                NOVA OS
              </span>
            </div>
            <h1 className="text-xs font-bold font-mono text-zinc-400">ABERTURA DE ORDEM DE SERVIÇO</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 space-y-4">
        {erroMsg && (
          <div className="p-3 rounded-xl bg-red-600/20 border border-red-500 text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{erroMsg}</span>
          </div>
        )}

        {/* ==================================================================== */}
        {/* PAINEL EXPLÍCITO NO TOPO: DATA DE ABERTURA & TIPO DA ORDEM */}
        {/* ==================================================================== */}
        <div className={`p-4 rounded-2xl border space-y-3.5 ${
          isDark ? 'bg-zinc-900 border-zinc-800 shadow-md' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div className="flex items-center justify-between border-b pb-2 border-zinc-800 dark:border-zinc-800">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 font-mono flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Identificação & Governança da O.S.
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              Viatura: {viatura.prefixo_frota}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Campo 1: Data e Hora de Abertura */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${
                isDark ? 'text-zinc-300' : 'text-slate-700'
              }`}>
                <Clock className="w-3 h-3 text-zinc-400" />
                Data e Hora de Abertura *
              </label>
              <input
                type="datetime-local"
                value={dataAbertura}
                onChange={(e) => setDataAbertura(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold outline-none transition ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-zinc-100 focus:border-amber-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-600'
                }`}
                required
              />
              <span className="text-[9px] text-zinc-500 mt-1 block">
                Permite registro retroativo ou horário oficial da triagem.
              </span>
            </div>

            {/* Campo 2: Classificação de Criticidade / Tipo da Ordem */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between ${
                isDark ? 'text-zinc-300' : 'text-slate-700'
              }`}>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Tipo da Ordem / Criticidade *
                </span>
                <span className="text-[9px] font-mono text-zinc-500">
                  {subcomponentes.some(s => s.criticidade === 'EMERGENCIA') ? '⚡ Emergência' : 'Manual'}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPrioridade('NORMAL')}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase font-mono border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    prioridade === 'NORMAL'
                      ? 'bg-[#1C4E26] text-[#B7F365] border-[#68D346] shadow-xs'
                      : isDark
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        : 'bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="text-[10px]">🟢 NORMAL</span>
                  <span className="text-[7px] opacity-80">Rotina</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrioridade('URGENTE')}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase font-mono border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    prioridade === 'URGENTE'
                      ? 'bg-amber-500 text-zinc-950 border-amber-600 shadow-xs font-black'
                      : isDark
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        : 'bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="text-[10px]">🟠 URGENTE</span>
                  <span className="text-[7px] opacity-90">SLA 2h</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrioridade('EMERGENCIA')}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase font-mono border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    prioridade === 'EMERGENCIA'
                      ? 'bg-red-600 text-white border-red-700 shadow-md font-black animate-pulse'
                      : isDark
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        : 'bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="text-[10px]">🔴 EMERGÊNCIA</span>
                  <span className="text-[7px] opacity-90">Interdição</span>
                </button>
              </div>
              <span className="text-[9px] text-zinc-500 mt-1 block">
                Define a alçada de aprovação e aciona a Matriz de Notificações.
              </span>
            </div>
          </div>
        </div>

        {/* Natureza da Manutenção */}
        <div className={`p-4 rounded-2xl border space-y-3 ${
          isDark ? 'bg-zinc-900 border-zinc-800 shadow-md' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
            Natureza da Manutenção *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setNatureza('CORRETIVA')}
              className={`py-3 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center justify-center gap-2 transition-all ${
                natureza === 'CORRETIVA'
                  ? 'bg-amber-500 text-zinc-950 border-amber-500 font-black shadow-sm'
                  : isDark
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    : 'bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Corretiva (Falha/Avaria)</span>
            </button>

            <button
              type="button"
              onClick={() => setNatureza('PREVENTIVA')}
              className={`py-3 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center justify-center gap-2 transition-all ${
                natureza === 'PREVENTIVA'
                  ? 'bg-emerald-600 text-white border-emerald-600 font-black shadow-sm'
                  : isDark
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    : 'bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Preventiva Programada</span>
            </button>
          </div>
        </div>

        {/* Local de Execução da Manutenção */}
        <div className={`p-4 rounded-2xl border space-y-3 ${
          isDark ? 'bg-zinc-900 border-zinc-800 shadow-md' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
            Local de Execução dos Serviços *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipoOs('INTERNA')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase border flex items-center justify-center gap-2 transition-all ${
                tipoOs === 'INTERNA'
                  ? isDark ? 'bg-zinc-100 text-zinc-900 border-white' : 'bg-slate-900 text-white border-slate-900'
                  : isDark
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    : 'bg-slate-50 border-slate-300 text-slate-600'
              }`}
            >
              <span>Oficina da Brigada</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoOs('EXTERNA')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase border flex items-center justify-center gap-2 transition-all ${
                tipoOs === 'EXTERNA'
                  ? isDark ? 'bg-zinc-100 text-zinc-900 border-white' : 'bg-slate-900 text-white border-slate-900'
                  : isDark
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    : 'bg-slate-50 border-slate-300 text-slate-600'
              }`}
            >
              <span>Oficina Credenciada</span>
            </button>
          </div>

          {tipoOs === 'EXTERNA' && (
            <div className="pt-2 animate-in fade-in">
              <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Selecione a Oficina Homologada *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <select
                  value={oficinaId}
                  onChange={(e) => setOficinaId(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-amber-500 font-semibold ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {oficinas.map(ofi => (
                    <option key={ofi.id} value={ofi.id}>
                      {ofi.nome_fantasia || ofi.razao_social} ({ofi.endereco || 'Base'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Dados do Solicitante e Odômetro */}
        <div className={`p-4 rounded-2xl border space-y-3 ${
          isDark ? 'bg-zinc-900 border-zinc-800 shadow-md' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Nome do Condutor / Solicitante *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="Nome de quem solicita"
                  value={solicitanteNome}
                  onChange={(e) => setSolicitanteNome(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-amber-500 font-semibold ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Odômetro Atual (Km) *
              </label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="number"
                  required
                  value={odometro}
                  onChange={(e) => setOdometro(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-amber-500 font-mono font-bold ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Árvore Anatômica do Veículo */}
          <div className="pt-2">
            <VehicleAnatomySelector
              natureza={natureza}
              onNaturezaChange={(novaNat) => setNatureza(novaNat)}
              selectedItems={subcomponentes}
              onItemsChange={(newItems, valorTotal, prioridadeSugerida) => {
                setSubcomponentes(newItems);
                setValorEstimado(valorTotal);
                setPrioridade(prioridadeSugerida);
                const resumo = formatarResumoAnatomico(newItems);
                setResumoAnatomico(resumo);
                if (!descricao.trim() && newItems.length > 0) {
                  setDescricao(`Manutenção: ${newItems.map(i => i.nome_subcomponente).join(', ')}`);
                }
              }}
            />
          </div>

          <div>
            <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              Relato do Condutor / Sintomas Observados *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Descreva detalhadamente o sintoma, barulho, perda de potência, vazamento ou necessidade de revisão..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className={`w-full p-2.5 text-xs rounded-xl border focus:outline-none focus:border-amber-500 ${
                isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>

          {/* Anexo de Foto da Avaria */}
          <div>
            <label className={`block text-[11px] font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              Foto da Falha / Avaria (Opcional)
            </label>
            {fotoEvidencia ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 h-36 bg-black flex items-center justify-center">
                <img src={fotoEvidencia} alt="Evidência" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFotoEvidencia(null)}
                  className="absolute top-2 right-2 px-2 py-1 rounded-md bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-bold transition-colors"
                >
                  Remover
                </button>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                isDark ? 'border-zinc-800 hover:border-amber-500 bg-zinc-950/40 text-zinc-400' : 'border-slate-300 hover:border-amber-500 bg-slate-50 text-slate-600'
              }`}>
                <Camera className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-bold">Fotografar Falha / Evidência</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFotoUpload}
                />
              </label>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] transition-all text-zinc-950 font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              <span>Registrando Ordem de Serviço...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Abrir Ordem de Serviço ({natureza})</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
