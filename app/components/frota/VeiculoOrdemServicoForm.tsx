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
  Car
} from 'lucide-react';
import { compressImageToCanvas } from './DualPhotoCapture';

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

  const [tipoOs, setTipoOs] = useState<'INTERNA' | 'EXTERNA'>('INTERNA');
  const [natureza, setNatureza] = useState<'PREVENTIVA' | 'CORRETIVA'>('CORRETIVA');
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
        odometro_km: parseFloat(odometro) || 0,
        descricao_servico: `[Abertura Mobile via Terminal] Solicitante: ${solicitanteNome.trim() || 'Motorista Operacional'}\nRelato: ${descricao.trim()}`,
        status: 'ABERTA',
        oficina_id: tipoOs === 'EXTERNA' ? oficinaId : null,
        data_abertura: new Date().toISOString()
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
