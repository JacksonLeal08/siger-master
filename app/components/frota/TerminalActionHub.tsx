'use client';

import React, { useMemo } from 'react';
import { Viatura, Abastecimento, OrdemServicoFrota, ChecklistVeicular } from '@/lib/types/frota';
import { FuelPricingService } from '@/lib/services/FuelPricingService';
import { 
  Fuel, 
  Wrench, 
  ClipboardCheck, 
  Sun, 
  Moon, 
  ArrowLeft, 
  ChevronRight, 
  Clock, 
  Gauge, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Disc,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';

interface TerminalActionHubProps {
  viatura: Viatura;
  contratoId: string;
  theme: 'light' | 'dark';
  onToggleTheme?: () => void;
  onSelectAction: (action: 'ABASTECER' | 'ORDEM_SERVICO' | 'CHECKLIST') => void;
  onChangeViatura: () => void;
  ultimoAbastecimento?: Abastecimento | null;
  osAberta?: OrdemServicoFrota | null;
  ultimoChecklist?: ChecklistVeicular | null;
  ultimasOs?: OrdemServicoFrota[];
}

export const TerminalActionHub: React.FC<TerminalActionHubProps> = ({
  viatura,
  contratoId,
  theme,
  onToggleTheme,
  onSelectAction,
  onChangeViatura,
  ultimoAbastecimento,
  osAberta,
  ultimoChecklist,
  ultimasOs
}) => {
  const isDark = theme === 'dark';

  // 1. Status de Calibração de Pneus (Trava 15 Dias)
  const statusCalibracao = useMemo(() => {
    return FuelPricingService.validarCalibracaoPneus(viatura.data_ultima_calibracao, 15);
  }, [viatura.data_ultima_calibracao]);

  // 2. Métricas de Preventiva
  const manutencao = useMemo(() => {
    const odoAtual = Number(viatura.odometro_atual_km) || 0;
    const kmUltima = viatura.km_ultima_preventiva !== undefined && viatura.km_ultima_preventiva !== null
      ? Number(viatura.km_ultima_preventiva)
      : (viatura.odometro_ultima_preventiva_km || 0);
    const intervalo = Number(viatura.intervalo_revisao_km) > 0 ? Number(viatura.intervalo_revisao_km) : 10000;
    const kmAlvo = kmUltima + intervalo;
    const kmRestantes = kmAlvo - odoAtual;
    const percentual = Math.min(100, Math.max(0, Math.round(((odoAtual - kmUltima) / intervalo) * 100)));

    return { odoAtual, kmUltima, intervalo, kmAlvo, kmRestantes, percentual };
  }, [viatura]);

  const categoriaNome = viatura.tipo_veiculo || 'Viatura Leve 4x4';

  return (
    <div className={`min-h-screen pb-12 select-none flex flex-col justify-between transition-colors duration-200 ${
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-slate-900'
    }`} translate="no">
      
      {/* ==================================================================== */}
      {/* A. BARRA SUPERIOR DE CONTEXTO */}
      {/* ==================================================================== */}
      <header className={`px-4 py-3 border-b backdrop-blur-md sticky top-0 z-30 transition-colors ${
        isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/95 border-slate-300 shadow-2xs'
      }`}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onChangeViatura}
              title="Trocar Viatura"
              className={`p-2 rounded-xl border transition-all active:scale-95 ${
                isDark 
                  ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-800' 
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-black tracking-wider uppercase text-red-600 dark:text-red-500">
                  {viatura.prefixo_frota} • {viatura.placa}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-200 text-slate-800 border-slate-300'
                }`}>
                  {categoriaNome}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-red-500" />
                  SITE: {contratoId}
                </span>
                <span>•</span>
                <span>{viatura.marca} {viatura.modelo}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* B. CORPO DO HUB TÁTICO: OS 3 BENTO CARDS */}
      {/* ==================================================================== */}
      <main className="max-w-xl mx-auto w-full p-4 flex-1 space-y-4">
        
        {/* Banner de Boas-Vindas Tático */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isDark 
            ? 'bg-gradient-to-r from-zinc-900 to-zinc-950 border-zinc-800' 
            : 'bg-gradient-to-r from-white to-slate-50 border-slate-300 shadow-xs'
        }`}>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-500">
              TERMINAL OPERACIONAL DE CAMPO
            </span>
            <h2 className={`text-sm font-black ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              Selecione a Operação Desejada
            </h2>
          </div>
          <div className="text-right font-mono text-[11px]">
            <span className="text-zinc-500 block">ODÔMETRO BASE</span>
            <span className={`font-black text-sm ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
              {(viatura.odometro_atual_km || 0).toLocaleString('pt-BR')} km
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CARD 1: ⛽ ABASTECIMENTO & COMBUSTÍVEL */}
        {/* ------------------------------------------------------------- */}
        <button
          type="button"
          onClick={() => onSelectAction('ABASTECER')}
          className={`w-full text-left p-5 rounded-3xl border transition-all duration-150 active:scale-[0.98] cursor-pointer group relative overflow-hidden shadow-sm hover:shadow-md ${
            isDark
              ? 'bg-gradient-to-br from-cyan-950/40 via-zinc-900 to-zinc-900 border-cyan-500/30 hover:border-cyan-500/60'
              : 'bg-gradient-to-br from-cyan-50 via-white to-white border-cyan-300 hover:border-cyan-400'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-cyan-100 text-cyan-700 border border-cyan-300'
              }`}>
                <Fuel className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-600 dark:text-cyan-400">
                  COMBUSTÍVEL & TELEMETRIA
                </span>
                <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  Registrar Abastecimento
                </h3>
              </div>
            </div>

            <div className={`p-2 rounded-full transition-transform group-hover:translate-x-1 ${
              isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
            }`}>
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>

          {/* Métricas Visíveis no Card 1 */}
          <div className="mt-4 pt-3.5 border-t border-cyan-500/20 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Último Abastecimento</span>
              <span className={`font-bold flex items-center gap-1 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                {ultimoAbastecimento ? (
                  <>
                    <span>{ultimoAbastecimento.litros} L</span>
                    <span className="text-zinc-500 font-normal">• R$ {ultimoAbastecimento.valor_litro}/L</span>
                  </>
                ) : (
                  <span>Em dia</span>
                )}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Calibração de Pneus</span>
              <span className={`font-bold text-[11px] inline-flex items-center gap-1 ${
                statusCalibracao.bloqueioObrigatorio
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {statusCalibracao.bloqueioObrigatorio ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    <span>Requer Calibragem</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Calibrado (≤ 15 dias)</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </button>

        {/* ------------------------------------------------------------- */}
        {/* CARD 2: 🛠️ REGISTRAR PREVENTIVA / CORRETIVA (ABERTURA DE OS) */}
        {/* ------------------------------------------------------------- */}
        <button
          type="button"
          onClick={() => onSelectAction('ORDEM_SERVICO')}
          className={`w-full text-left p-5 rounded-3xl border transition-all duration-150 active:scale-[0.98] cursor-pointer group relative overflow-hidden shadow-sm hover:shadow-md ${
            isDark
              ? 'bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-900 border-amber-500/30 hover:border-amber-500/60'
              : 'bg-gradient-to-br from-amber-50 via-white to-white border-amber-300 hover:border-amber-400'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-amber-100 text-amber-700 border border-amber-300'
              }`}>
                <Wrench className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400">
                  MANUTENÇÃO & OFICINAS
                </span>
                <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  Abrir Ordem de Serviço (OS)
                </h3>
              </div>
            </div>

            <div className={`p-2 rounded-full transition-transform group-hover:translate-x-1 ${
              isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
            }`}>
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>

          {/* Métricas Visíveis no Card 2 */}
          <div className="mt-4 pt-3.5 border-t border-amber-500/20 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Próxima Preventiva</span>
              <span className={`font-bold block ${
                manutencao.kmRestantes < 0 
                  ? 'text-red-500' 
                  : manutencao.kmRestantes <= 1000 
                    ? 'text-amber-500' 
                    : isDark ? 'text-zinc-200' : 'text-slate-800'
              }`}>
                {manutencao.kmRestantes < 0 ? (
                  `Vencida há ${Math.abs(manutencao.kmRestantes).toLocaleString('pt-BR')} km`
                ) : (
                  `Faltam ${manutencao.kmRestantes.toLocaleString('pt-BR')} km`
                )}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Status da Oficina</span>
              <span className="font-bold flex items-center gap-1 text-zinc-300">
                {osAberta ? (
                  <span className="text-amber-500 dark:text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> OS #{osAberta.numero_os} em aberto
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Nenhuma OS pendente
                  </span>
                )}
              </span>
            </div>
          </div>
        </button>

        {/* ------------------------------------------------------------- */}
        {/* CARD 3: 📋 CHECKLIST TÉCNICO VEICULAR (MÓDULO DO ZERO) */}
        {/* ------------------------------------------------------------- */}
        <button
          type="button"
          onClick={() => onSelectAction('CHECKLIST')}
          className={`w-full text-left p-5 rounded-3xl border transition-all duration-150 active:scale-[0.98] cursor-pointer group relative overflow-hidden shadow-sm hover:shadow-md ${
            isDark
              ? 'bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border-emerald-500/30 hover:border-emerald-500/60'
              : 'bg-gradient-to-br from-emerald-50 via-white to-white border-emerald-300 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
              }`}>
                <ClipboardCheck className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                  INSPEÇÃO & DUAL-PHOTO EVIDENCE
                </span>
                <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  Checklist Técnico Veicular
                </h3>
              </div>
            </div>

            <div className={`p-2 rounded-full transition-transform group-hover:translate-x-1 ${
              isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
            }`}>
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>

          {/* Métricas Visíveis no Card 3 */}
          <div className="mt-4 pt-3.5 border-t border-emerald-500/20 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Última Vistoria</span>
              <span className={`font-bold block ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                {ultimoChecklist ? (
                  new Date(ultimoChecklist.created_at || '').toLocaleDateString('pt-BR')
                ) : (
                  'Não realizada hoje'
                )}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Conformidade Anterior</span>
              <span className="font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{ultimoChecklist?.percentual_conformidade || 100}% Conforme</span>
              </span>
            </div>
          </div>
        </button>

        {/* ------------------------------------------------------------- */}
        {/* SEÇÃO 4: HISTÓRICO RÁPIDO DAS ÚLTIMAS MANUTENÇÕES */}
        {/* ------------------------------------------------------------- */}
        <div className={`p-4 rounded-3xl border transition-all ${
          isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                <Wrench className="w-3.5 h-3.5" />
              </div>
              <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                Últimas Manutenções da Viatura
              </h4>
            </div>
            <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Histórico Recente
            </span>
          </div>

          {ultimasOs && ultimasOs.length > 0 ? (
            <div className="space-y-2">
              {ultimasOs.slice(0, 3).map((os) => {
                const isPrev = (os.tipo_manutencao || os.natureza_manutencao) === 'PREVENTIVA';
                const dataFmt = new Date(os.data_abertura).toLocaleDateString('pt-BR');
                return (
                  <div
                    key={os.id}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs transition-colors ${
                      isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-0.5 max-w-[70%]">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${
                          isPrev
                            ? isDark ? 'bg-blue-950/80 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200'
                            : isDark ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {isPrev ? 'PREVENTIVA' : 'CORRETIVA'}
                        </span>
                        <span className={`font-mono font-bold text-[11px] ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>
                          {os.numero_os}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        {os.descricao_motivo || os.descricao_servico || 'Intervenção técnica realizada.'}
                      </p>
                    </div>

                    <div className="text-right font-mono text-[10px] text-zinc-500 shrink-0">
                      <div>{dataFmt}</div>
                      <div className={`font-bold ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>{Number(os.odometro_km).toLocaleString('pt-BR')} km</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={`text-xs italic text-center py-2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Nenhum histórico de manutenção recente para esta viatura.
            </p>
          )}
        </div>
      </main>

      {/* Rodapé Institucional */}
      <footer className="text-center text-[10px] font-mono text-zinc-500 dark:text-zinc-600 px-4 pt-4">
        SIGER MASTER • PLATAFORMA DE GESTÃO DE FROTAS & SPCI • DIRETRIZ ISO 39001
      </footer>
    </div>
  );
};
