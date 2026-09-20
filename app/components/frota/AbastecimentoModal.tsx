'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Viatura, Abastecimento } from '@/lib/types/frota';
import { saveAbastecimentoAction } from '@/app/actions/frotaActions';
import { FuelAuditService } from '@/lib/fuelAuditService';
import { soundNotificationService } from '@/lib/soundNotificationService';
import { Fuel, Minus, Maximize2, Minimize2, X, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';

interface AbastecimentoModalProps {
  isOpen: boolean;
  viatura: Viatura;
  contratoId: string;
  onClose: () => void;
  onMinimize: () => void;
  onSuccess: (saved: Abastecimento) => void;
  condutorPadrao?: string;
}

export const AbastecimentoModal: React.FC<AbastecimentoModalProps> = ({
  isOpen,
  viatura,
  contratoId,
  onClose,
  onMinimize,
  onSuccess,
  condutorPadrao = ''
}) => {
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [posto, setPosto] = useState('Posto Interno Vale');
  const [tipoCombustivel, setTipoCombustivel] = useState(viatura.tipo_combustivel || 'DIESEL_S10');
  const [litros, setLitros] = useState<string>('50');
  const [valorLitro, setValorLitro] = useState<string>('6.20');
  const [novoOdometro, setNovoOdometro] = useState<string>(
    viatura.odometro_atual_km ? String(viatura.odometro_atual_km + 450) : '450'
  );
  const [condutor, setCondutor] = useState(condutorPadrao || 'Motorista Operacional SPCI');

  // Cálculo do valor total
  const valorTotal = useMemo(() => {
    const l = parseFloat(litros) || 0;
    const v = parseFloat(valorLitro) || 0;
    return (l * v).toFixed(2);
  }, [litros, valorLitro]);

  // Auditoria em Tempo Real
  const liveAudit = useMemo(() => {
    const l = parseFloat(litros) || 0;
    const odo = parseFloat(novoOdometro) || 0;

    return FuelAuditService.analyze({
      odometroAtualKm: odo,
      odometroAnteriorKm: viatura.odometro_atual_km,
      litros: l,
      tipoVeiculo: viatura.tipo_veiculo,
      tipoCombustivel
    });
  }, [litros, novoOdometro, viatura.odometro_atual_km, viatura.tipo_veiculo, tipoCombustivel]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const l = parseFloat(litros);
    const vl = parseFloat(valorLitro);
    const odo = parseFloat(novoOdometro);

    if (isNaN(l) || l <= 0) {
      setErrorMsg('Informe uma quantidade válida de litros.');
      return;
    }

    if (isNaN(odo) || odo <= 0) {
      setErrorMsg('Informe um odômetro válido.');
      return;
    }

    // Se houver anomalia, aciona alerta sonoro
    if (liveAudit.isDiscrepante) {
      soundNotificationService.playFuelAnomalyAlert();
    } else {
      soundNotificationService.playSuccessSound();
    }

    setIsSaving(true);
    try {
      const res = await saveAbastecimentoAction(
        {
          contrato_id: contratoId || viatura.contrato_id || 'ONÇA PUMA',
          viatura_id: viatura.id,
          posto,
          tipo_combustivel: tipoCombustivel,
          litros: l,
          valor_litro: vl,
          valor_total: parseFloat(valorTotal),
          odometro_km: odo,
          condutor_nome: condutor
        },
        viatura.tipo_veiculo
      );

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMsg(res.error || 'Falha ao registrar abastecimento.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro inesperado.');
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
          isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-2xl max-h-[90vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Lançamento de Abastecimento & Telemetria
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                Viatura: <strong>{viatura.prefixo_frota}</strong> ({viatura.placa}) — Odômetro anterior: {viatura.odometro_atual_km} km
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Dados do Posto e Combustível */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Posto de Abastecimento *
              </label>
              <input
                type="text"
                value={posto}
                onChange={(e) => setPosto(e.target.value)}
                placeholder="Ex: Posto Mina Salobo"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-red-600"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Tipo de Combustível *
              </label>
              <select
                value={tipoCombustivel}
                onChange={(e) => setTipoCombustivel(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="DIESEL_S10">Diesel S-10</option>
                <option value="GASOLINA">Gasolina Comum</option>
                <option value="FLEX">Flex (Etanol/Gasolina)</option>
                <option value="ETANOL">Etanol</option>
              </select>
            </div>
          </div>

          {/* Litros, Valor e Total */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Litros Abastecidos *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={litros}
                onChange={(e) => setLitros(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-red-600"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Preço por Litro (R$) *
              </label>
              <input
                type="number"
                step="0.001"
                min="0.1"
                value={valorLitro}
                onChange={(e) => setValorLitro(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-red-600"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Valor Total Calculado
              </label>
              <div className="w-full bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>R$ {valorTotal}</span>
              </div>
            </div>
          </div>

          {/* Odômetro e Condutor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Novo Odômetro (KM no ato do abastecimento) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={novoOdometro}
                onChange={(e) => setNovoOdometro(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-red-600"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Nome do Condutor *
              </label>
              <input
                type="text"
                value={condutor}
                onChange={(e) => setCondutor(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none"
                required
              />
            </div>
          </div>

          {/* Painel Live Audit de Antifraude e Consumo */}
          <div className={`p-4 rounded-2xl border transition-all ${
            liveAudit.isDiscrepante 
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200' 
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
          }`}>
            <div className="flex items-center justify-between text-xs font-black uppercase mb-2">
              <span className="flex items-center gap-2">
                {liveAudit.isDiscrepante ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>⚠️ Flag de Discrepância / Consumo Anômalo</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Consumo Homologado e em Conformidade</span>
                  </>
                )}
              </span>
              <span className="font-mono text-[10px]">
                Benchmark: {liveAudit.benchmarkKmLitro} km/L
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono">
              <div>
                <span className="text-slate-500 block">KM Rodados:</span>
                <strong className="text-xs">{liveAudit.kmRodados !== null ? `${liveAudit.kmRodados} km` : '1º abastecimento'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Consumo Médio:</span>
                <strong className="text-xs">{liveAudit.kmPorLitro !== null ? `${liveAudit.kmPorLitro} km/L` : '--'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Variação Benchmark:</span>
                <strong className="text-xs">{liveAudit.variacaoPercentual !== null ? `${liveAudit.variacaoPercentual}%` : '--'}</strong>
              </div>
            </div>

            {liveAudit.motivoDiscrepancia && (
              <p className="mt-2 text-[10px] text-amber-700 dark:text-amber-300 font-sans border-t border-amber-500/20 pt-1.5">
                <strong>Justificativa da Auditoria:</strong> {liveAudit.motivoDiscrepancia}
              </p>
            )}
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
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Fuel className="w-4 h-4" />
              {isSaving ? 'Registrando...' : 'Registrar Abastecimento'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
