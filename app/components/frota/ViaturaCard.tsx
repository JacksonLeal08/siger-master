'use client';

import React, { useMemo } from 'react';
import { Viatura } from '@/lib/types/frota';
import { 
  Truck, 
  Disc, 
  Fuel, 
  Wrench, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Calendar,
  Gauge
} from 'lucide-react';

interface ViaturaCardProps {
  viatura: Viatura;
  onOpenTires: (v: Viatura) => void;
  onOpenFuel: (v: Viatura) => void;
  onOpenOs: (v: Viatura) => void;
  onOpenEdit: (v: Viatura) => void;
}

export const ViaturaCard: React.FC<ViaturaCardProps> = ({
  viatura: v,
  onOpenTires,
  onOpenFuel,
  onOpenOs,
  onOpenEdit
}) => {
  // 1. Cálculos Dinâmicos de Preventiva
  const manutencao = useMemo(() => {
    const odoAtual = Number(v.odometro_atual_km) || 0;
    const kmUltima = v.km_ultima_preventiva !== undefined && v.km_ultima_preventiva !== null
      ? Number(v.km_ultima_preventiva)
      : (v.odometro_ultima_preventiva_km !== undefined && v.odometro_ultima_preventiva_km !== null
          ? Number(v.odometro_ultima_preventiva_km)
          : 0);

    const intervalo = Number(v.intervalo_revisao_km) > 0 ? Number(v.intervalo_revisao_km) : 10000;
    
    // Fórmulas matemáticas
    const kmDecorridos = Math.max(0, odoAtual - kmUltima);
    const kmAlvo = kmUltima + intervalo;
    const kmRestantes = kmAlvo - odoAtual;

    // Progresso percentual de 0% a 100% da vida útil do ciclo
    const percentualCiclo = Math.min(100, Math.max(0, Math.round((kmDecorridos / intervalo) * 100)));

    // Classificação por Cores & Severidade
    // Verde: > 1000 km | Âmbar pulsante: 0 a 1000 km | Vermelho: < 0 km (Vencida)
    let statusClass = 'bg-emerald-500';
    let textClass = 'text-emerald-600 dark:text-emerald-400';
    let bgBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
    let statusLabel = 'Em dia';
    let statusIcon = CheckCircle2;

    if (kmRestantes < 0) {
      statusClass = 'bg-red-600';
      textClass = 'text-red-600 dark:text-red-400';
      bgBadge = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800';
      statusLabel = `⚠️ REVISÃO VENCIDA (Passou ${Math.abs(kmRestantes)} km)`;
      statusIcon = AlertCircle;
    } else if (kmRestantes <= 1000) {
      statusClass = 'bg-amber-500 animate-pulse';
      textClass = 'text-amber-600 dark:text-amber-400';
      bgBadge = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
      statusLabel = 'Atenção: Revisão Próxima';
      statusIcon = AlertTriangle;
    }

    // Data formatada da última preventiva
    const dataFormatada = v.data_ultima_preventiva
      ? new Date(v.data_ultima_preventiva).toLocaleDateString('pt-BR')
      : 'Não informada';

    return {
      kmUltima,
      intervalo,
      kmDecorridos,
      kmAlvo,
      kmRestantes,
      percentualCiclo,
      statusClass,
      textClass,
      bgBadge,
      statusLabel,
      statusIcon,
      dataFormatada
    };
  }, [v.odometro_atual_km, v.km_ultima_preventiva, v.odometro_ultima_preventiva_km, v.intervalo_revisao_km, v.data_ultima_preventiva]);

  // Badge Operacional
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DISPONIVEL':
        return {
          label: 'Disponível / Base',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
        };
      case 'EM_DESLOCAMENTO':
        return {
          label: 'Em Ronda / Campo',
          bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
        };
      case 'EM_MANUTENCAO_INTERNA':
        return {
          label: 'Manutenção Interna',
          bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
        };
      case 'EM_OFICINA_EXTERNA':
        return {
          label: 'Oficina Credenciada',
          bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800'
        };
      case 'BAIXADO':
        return {
          label: 'Baixado / Inoperante',
          bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
        };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const badge = getStatusBadge(v.status_operacional);
  const StatusIcon = manutencao.statusIcon;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Topo do Card */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            {v.foto_veiculo_url ? (
              <img
                src={v.foto_veiculo_url}
                alt={v.prefixo_frota}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-base text-slate-900 dark:text-slate-100">
                  {v.prefixo_frota}
                </span>
                <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                  {v.placa}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                {v.marca} {v.modelo} {v.ano_fabricacao ? `(${v.ano_fabricacao})` : ''}
              </p>
            </div>
          </div>

          <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-full border ${badge.bg}`}>
            {badge.label}
          </span>
        </div>

        {/* Informações de Telemetria e Instrumentação de Preventiva */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs font-mono">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span className="text-slate-400 text-[10px]">ODÔMETRO ATUAL:</span>
            <strong className="text-slate-900 dark:text-slate-100 text-xs font-black">
              {Number(v.odometro_atual_km).toLocaleString('pt-BR')} km
            </strong>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[10px]">COMBUSTÍVEL:</span>
            <span className="font-bold text-[10px] uppercase text-amber-600 dark:text-amber-400">
              {v.tipo_combustivel.replace('_', ' ')}
            </span>
          </div>

          {/* Instrumentação Visual de Manutenção Preventiva */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase">
                <Wrench className="w-3.5 h-3.5 text-blue-500" />
                Ciclo de Preventiva ({manutencao.percentualCiclo}%)
              </span>
              <span className={`text-[10px] font-bold flex items-center gap-1 ${manutencao.textClass}`}>
                <StatusIcon className="w-3 h-3" />
                {manutencao.kmRestantes < 0
                  ? `Vencida (-${Math.abs(manutencao.kmRestantes)} km)`
                  : `Faltam ${manutencao.kmRestantes.toLocaleString('pt-BR')} km`}
              </span>
            </div>

            {/* Barra de Progresso Visual (0% a 100%) */}
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${manutencao.statusClass}`}
                style={{ width: `${manutencao.percentualCiclo}%` }}
              />
            </div>

            {/* Labels Nítidos */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-0.5">
              <div>
                <span className="block text-slate-400">Última:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {manutencao.kmUltima.toLocaleString('pt-BR')} km
                </span>
                <span className="block text-[9px] text-slate-400">({manutencao.dataFormatada})</span>
              </div>
              <div className="text-right">
                <span className="block text-slate-400">Próxima Alvo:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {manutencao.kmAlvo.toLocaleString('pt-BR')} km
                </span>
                <span className="block text-[9px] text-slate-400">(Intervalo: {manutencao.intervalo / 1000}k km)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Ação Rápida */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-1.5">
        <button
          type="button"
          onClick={() => onOpenTires(v)}
          className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border-none shadow-2xs"
          title="Mapeamento de Pneus & TWI"
        >
          <Disc className="w-3.5 h-3.5 text-amber-500" />
          <span>Pneus</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenFuel(v)}
          className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border-none shadow-2xs"
          title="Registrar Abastecimento"
        >
          <Fuel className="w-3.5 h-3.5 text-amber-500" />
          <span>Abastecer</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenOs(v)}
          className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border-none shadow-2xs"
          title="Abrir Ordem de Serviço (OS)"
        >
          <Wrench className="w-3.5 h-3.5 text-blue-500" />
          <span>OS</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenEdit(v)}
          className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border-none shadow-2xs"
          title="Editar Cadastro da Viatura"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>Ficha</span>
        </button>
      </div>
    </div>
  );
};
