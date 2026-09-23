'use client';

import React, { useState } from 'react';
import { 
  PosicaoPneu, 
  InspecaoPneu, 
  StatusTwi, 
  classificarSulcoTwi, 
  Viatura 
} from '@/lib/types/frota';
import { saveInspecaoPneuAction } from '@/app/actions/frotaActions';
import { soundNotificationService } from '@/lib/soundNotificationService';
import { ShieldAlert, AlertTriangle, CheckCircle2, RotateCw, Gauge, Disc } from 'lucide-react';

interface TireMapInspectionProps {
  viatura: Viatura;
  inspecoesAtuais: InspecaoPneu[];
  onInspecaoSalva: (novaInspecao: InspecaoPneu) => void;
  inspetorPadrao?: string;
}

interface TireSlotConfig {
  posicao: PosicaoPneu;
  label: string;
  codigo: string;
  eixo: 'DIANTEIRO' | 'TRASEIRO' | 'ESTEPE';
}

const TIRE_SLOTS: TireSlotConfig[] = [
  { posicao: 'DIANTEIRO_ESQUERDO', label: 'Dianteiro Esquerdo', codigo: 'DE', eixo: 'DIANTEIRO' },
  { posicao: 'DIANTEIRO_DIREITO', label: 'Dianteiro Direito', codigo: 'DD', eixo: 'DIANTEIRO' },
  { posicao: 'TRASEIRO_ESQUERDO', label: 'Traseiro Esquerdo', codigo: 'TE', eixo: 'TRASEIRO' },
  { posicao: 'TRASEIRO_DIREITO', label: 'Traseiro Direito', codigo: 'TD', eixo: 'TRASEIRO' },
  { posicao: 'ESTEPE', label: 'Estepe Operacional', codigo: 'EST', eixo: 'ESTEPE' }
];

export const TireMapInspection: React.FC<TireMapInspectionProps> = ({
  viatura,
  inspecoesAtuais,
  onInspecaoSalva,
  inspetorPadrao = 'Inspetor Frota SIGER'
}) => {
  const [selectedSlot, setSelectedSlot] = useState<TireSlotConfig | null>(null);
  const [sulcoInput, setSulcoInput] = useState<string>('4.5');
  const [pressaoInput, setPressaoInput] = useState<string>('34');
  const [marcaInput, setMarcaInput] = useState<string>('');
  const [dotInput, setDotInput] = useState<string>('');
  const [precisaRodizio, setPrecisaRodizio] = useState<boolean>(false);
  const [obsInput, setObsInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Mapeia última medição por posição
  const getLatestMeasurement = (posicao: PosicaoPneu): InspecaoPneu | undefined => {
    return inspecoesAtuais
      .filter(i => i.posicao_pneu === posicao)
      .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime())[0];
  };

  const handleOpenSlotForm = (slot: TireSlotConfig) => {
    setSelectedSlot(slot);
    const existing = getLatestMeasurement(slot.posicao);
    if (existing) {
      setSulcoInput(String(existing.sulco_mm));
      setPressaoInput(String(existing.pressao_psi));
      setMarcaInput(existing.marca_pneu || '');
      setDotInput(existing.dot_pneu || '');
      setPrecisaRodizio(existing.precisa_rodizio || false);
      setObsInput(existing.observacoes || '');
    } else {
      setSulcoInput('4.5');
      setPressaoInput('34');
      setMarcaInput('');
      setDotInput('');
      setPrecisaRodizio(false);
      setObsInput('');
    }
  };

  const handleSaveMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const sulcoNum = parseFloat(sulcoInput);
    const pressaoNum = parseFloat(pressaoInput);

    if (isNaN(sulcoNum) || sulcoNum < 0) {
      alert('Por favor, informe uma profundidade de sulco válida.');
      return;
    }

    if (isNaN(pressaoNum) || pressaoNum < 0) {
      alert('Por favor, informe uma pressão válida em PSI.');
      return;
    }

    const statusTwi = classificarSulcoTwi(sulcoNum);

    // Se estiver no limite crítico CONTRAN, aciona alerta sonoro
    if (statusTwi === 'CRITICO_PROIBIDO') {
      soundNotificationService.playTwiCriticalAlert();
    } else {
      soundNotificationService.playSuccessSound();
    }

    setIsSaving(true);
    try {
      const res = await saveInspecaoPneuAction({
        contrato_id: viatura.contrato_id || 'ONÇA PUMA',
        viatura_id: viatura.id,
        posicao_pneu: selectedSlot.posicao,
        sulco_mm: sulcoNum,
        pressao_psi: pressaoNum,
        status_twi: statusTwi,
        precisa_rodizio: precisaRodizio,
        marca_pneu: marcaInput || undefined,
        dot_pneu: dotInput || undefined,
        observacoes: obsInput || undefined,
        inspetor_nome: inspetorPadrao
      });

      if (res.success && res.data) {
        onInspecaoSalva(res.data);
        setSelectedSlot(null);
      } else {
        alert(res.error || 'Erro ao gravar medição de pneu.');
      }
    } catch (err) {
      console.error('Falha ao salvar medição:', err);
      alert('Erro inesperado ao salvar medição.');
    } finally {
      setIsSaving(false);
    }
  };

  const getTwiBadgeProps = (status?: StatusTwi) => {
    switch (status) {
      case 'CRITICO_PROIBIDO':
        return {
          bg: 'bg-red-500/20 text-red-400 border-red-500 animate-pulse',
          dot: 'bg-red-500',
          label: 'CRÍTICO (≤ 1.6 mm) - PROIBIDO RODAR'
        };
      case 'ATENCAO':
        return {
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500',
          dot: 'bg-amber-500',
          label: 'ATENÇÃO (1.7 a 2.9 mm)'
        };
      case 'CONFORME':
        return {
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500',
          dot: 'bg-emerald-500',
          label: 'CONFORME (≥ 3.0 mm)'
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-400 border-slate-700',
          dot: 'bg-slate-500',
          label: 'NÃO INSPECIONADO'
        };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Disc className="w-4 h-4 text-red-600" />
            Mapeamento Interativo de Pneus & Calibragem
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            Viatura: <strong>{viatura.prefixo_frota}</strong> ({viatura.placa}) — Toque na roda para lançar medição
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
            Total Inspecionados: {inspecoesAtuais.length}
          </span>
        </div>
      </div>

      {/* Chassi Visual do Veículo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Representação Física do Veículo */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 relative">
          
          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span>FRENTE DA VIATURA</span>
            <span className="text-red-500 font-black">▲</span>
          </div>

          <div className="w-full max-w-sm space-y-6 relative py-4">
            
            {/* EIXO DIANTEIRO */}
            <div className="flex justify-between items-center gap-6">
              {TIRE_SLOTS.filter(s => s.eixo === 'DIANTEIRO').map((slot) => {
                const latest = getLatestMeasurement(slot.posicao);
                const badge = getTwiBadgeProps(latest?.status_twi);

                return (
                  <button
                    key={slot.posicao}
                    type="button"
                    onClick={() => handleOpenSlotForm(slot)}
                    className={`flex-1 p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left relative overflow-hidden group hover:scale-[1.02] shadow-xs ${
                      selectedSlot?.posicao === slot.posicao
                        ? 'border-red-600 ring-2 ring-red-500/20 bg-red-50/50 dark:bg-red-950/30'
                        : latest?.status_twi === 'CRITICO_PROIBIDO'
                        ? 'border-red-500 bg-red-500/10'
                        : latest?.status_twi === 'ATENCAO'
                        ? 'border-amber-500 bg-amber-500/10'
                        : latest?.status_twi === 'CONFORME'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-100">{slot.codigo}</span>
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-1 truncate">
                      {slot.label}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center text-[10px] font-mono">
                      <span>{latest ? `${latest.sulco_mm} mm` : '-- mm'}</span>
                      <span className="text-slate-400">{latest ? `${latest.pressao_psi} PSI` : '-- PSI'}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* BARRA DE TRANSMISSÃO ESTRUTURAL */}
            <div className="h-12 w-1.5 bg-slate-300 dark:bg-slate-700 mx-auto rounded-full"></div>

            {/* EIXO TRASEIRO */}
            <div className="flex justify-between items-center gap-6">
              {TIRE_SLOTS.filter(s => s.eixo === 'TRASEIRO').map((slot) => {
                const latest = getLatestMeasurement(slot.posicao);
                const badge = getTwiBadgeProps(latest?.status_twi);

                return (
                  <button
                    key={slot.posicao}
                    type="button"
                    onClick={() => handleOpenSlotForm(slot)}
                    className={`flex-1 p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left relative overflow-hidden group hover:scale-[1.02] shadow-xs ${
                      selectedSlot?.posicao === slot.posicao
                        ? 'border-red-600 ring-2 ring-red-500/20 bg-red-50/50 dark:bg-red-950/30'
                        : latest?.status_twi === 'CRITICO_PROIBIDO'
                        ? 'border-red-500 bg-red-500/10'
                        : latest?.status_twi === 'ATENCAO'
                        ? 'border-amber-500 bg-amber-500/10'
                        : latest?.status_twi === 'CONFORME'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-100">{slot.codigo}</span>
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-1 truncate">
                      {slot.label}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center text-[10px] font-mono">
                      <span>{latest ? `${latest.sulco_mm} mm` : '-- mm'}</span>
                      <span className="text-slate-400">{latest ? `${latest.pressao_psi} PSI` : '-- PSI'}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ESTEPE */}
            <div className="pt-3 border-t border-dashed border-slate-300 dark:border-slate-800 flex justify-center">
              {TIRE_SLOTS.filter(s => s.eixo === 'ESTEPE').map((slot) => {
                const latest = getLatestMeasurement(slot.posicao);
                const badge = getTwiBadgeProps(latest?.status_twi);

                return (
                  <button
                    key={slot.posicao}
                    type="button"
                    onClick={() => handleOpenSlotForm(slot)}
                    className={`w-48 p-2.5 rounded-xl border-2 transition-all cursor-pointer text-center relative overflow-hidden group hover:scale-[1.02] shadow-xs ${
                      selectedSlot?.posicao === slot.posicao
                        ? 'border-red-600 ring-2 ring-red-500/20 bg-red-50/50 dark:bg-red-950/30'
                        : latest?.status_twi === 'CRITICO_PROIBIDO'
                        ? 'border-red-500 bg-red-500/10'
                        : latest?.status_twi === 'ATENCAO'
                        ? 'border-amber-500 bg-amber-500/10'
                        : latest?.status_twi === 'CONFORME'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-black font-mono">
                      <span>ESTEPE</span>
                      <span>{latest ? `${latest.sulco_mm} mm` : '--'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Formulário de Medição Rápida da Roda Selecionada */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          {selectedSlot ? (
            <form onSubmit={handleSaveMeasurement} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <div>
                  <span className="text-[9px] font-mono text-red-600 font-black uppercase">MEDINDO POSIÇÃO</span>
                  <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">
                    {selectedSlot.label} ({selectedSlot.codigo})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕ Cancelar
                </button>
              </div>

              {/* Sulco mm com feedback visual imediato */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Profundidade do Sulco (mm) *</span>
                  <span className="text-[9px] font-mono text-slate-400">Min. Legal: 1.6 mm</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={sulcoInput}
                    onChange={(e) => setSulcoInput(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-bold outline-none focus:border-red-600"
                    required
                  />
                  <div className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">mm</div>
                </div>
              </div>

              {/* Status TWI Projetado */}
              {sulcoInput && !isNaN(parseFloat(sulcoInput)) && (
                <div className={`p-2.5 rounded-xl border text-[10px] font-mono flex items-center gap-2 ${
                  getTwiBadgeProps(classificarSulcoTwi(parseFloat(sulcoInput))).bg
                }`}>
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{getTwiBadgeProps(classificarSulcoTwi(parseFloat(sulcoInput))).label}</span>
                </div>
              )}

              {/* Pressão PSI */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                  Pressão / Calibragem (PSI) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="150"
                    value={pressaoInput}
                    onChange={(e) => setPressaoInput(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-bold outline-none focus:border-red-600"
                    required
                  />
                  <div className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">PSI</div>
                </div>
              </div>

              {/* Marca e DOT */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Marca / Modelo</label>
                  <input
                    type="text"
                    placeholder="Ex: Pirelli Scorpion"
                    value={marcaInput}
                    onChange={(e) => setMarcaInput(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">DOT (Semana/Ano)</label>
                  <input
                    type="text"
                    placeholder="Ex: 2423"
                    value={dotInput}
                    onChange={(e) => setDotInput(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-medium outline-none uppercase"
                  />
                </div>
              </div>

              {/* Checkbox Rodízio */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={precisaRodizio}
                  onChange={(e) => setPrecisaRodizio(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <RotateCw className="w-3 h-3 text-amber-500" /> Recomendar rodízio de pneus nesta viatura
                </span>
              </label>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Gravando Medição...' : 'Salvar Medição de Pneu'}
              </button>
            </form>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 p-4">
              <Disc className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2 animate-spin-slow" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Nenhuma roda selecionada</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                Clique sobre o pneu correspondente no diagrama do veículo à esquerda para registrar profundidade e pressão.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
