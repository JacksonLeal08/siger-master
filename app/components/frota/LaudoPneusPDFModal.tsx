'use client';

import React from 'react';
import { InspecaoRodagemPneus, Viatura } from '@/lib/types/frota';
import { generateLaudoPneusPDF } from '@/lib/pdfLaudoPneusGenerator';
import { FileText, Printer, X, Disc, ShieldCheck, AlertTriangle } from 'lucide-react';

interface LaudoPneusPDFModalProps {
  isOpen: boolean;
  inspecao: InspecaoRodagemPneus;
  viatura: Viatura;
  onClose: () => void;
  responsavelNome?: string;
}

export const LaudoPneusPDFModal: React.FC<LaudoPneusPDFModalProps> = ({
  isOpen,
  inspecao,
  viatura,
  onClose,
  responsavelNome = 'Jackson Leal - Engenheiro Responsável'
}) => {
  const [orientacao, setOrientacao] = React.useState<'portrait' | 'landscape'>('portrait');

  if (!isOpen) return null;

  const handlePrint = () => {
    generateLaudoPneusPDF(inspecao, viatura, responsavelNome, orientacao);
  };

  const isCritico = inspecao.status_geral_twi === 'CRITICO_PROIBIDO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md font-sans select-none animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Cabeçalho */}
        <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1C4E26]/20 border border-[#68D346]/40 flex items-center justify-center text-[#68D346]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-black text-sm uppercase text-slate-100">
                LAUDO PERICIAL DE RODAGEM (PDF)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {viatura.prefixo_frota} • {viatura.placa} • {new Date(inspecao.data_hora).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Corpo do Resumo */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Viatura Inspecionada:</span>
              <strong className="text-slate-200">{viatura.marca_modelo_crlv || `${viatura.marca} ${viatura.modelo}`}</strong>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Status Geral TWI:</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                isCritico
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {inspecao.status_geral_twi}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Pneus Aferidos:</span>
              <span className="text-slate-200 font-bold">{inspecao.itens?.length || 5} rodas com memória de cálculo</span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Norma Regulamentadora:</span>
              <span className="text-slate-300">Resolução CONTRAN nº 558/80 (1.6 mm TWI)</span>
            </div>
          </div>

          {/* Seletor de Orientação para Impressão */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center justify-between">
              <span>Orientação do Laudo (Impressão / PDF):</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {orientacao === 'portrait' ? 'A4 Retrato (Padrão Executivo)' : 'A4 Paisagem (Horizontal)'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrientacao('portrait')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  orientacao === 'portrait'
                    ? 'bg-[#1C4E26]/30 border-[#68D346] text-white shadow-lg shadow-[rgba(104,211,70,0.2)] ring-1 ring-[#68D346]/50'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base ${
                  orientacao === 'portrait' ? 'bg-[#68D346] text-zinc-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  📄
                </div>
                <div>
                  <div className="text-xs font-bold font-mono">Retrato (Padrão)</div>
                  <div className="text-[10px] text-slate-400">Layout Vertical Executivo</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOrientacao('landscape')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  orientacao === 'landscape'
                    ? 'bg-[#1C4E26]/30 border-[#68D346] text-white shadow-lg shadow-[rgba(104,211,70,0.2)] ring-1 ring-[#68D346]/50'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base ${
                  orientacao === 'landscape' ? 'bg-[#68D346] text-zinc-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  🖼️
                </div>
                <div>
                  <div className="text-xs font-bold font-mono">Paisagem</div>
                  <div className="text-[10px] text-slate-400">Layout Horizontal Expandido</div>
                </div>
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1C4E26]/15 border border-[#68D346]/30 text-zinc-300 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#68D346] mt-0.5" />
            <span>
              O laudo gerado segue a diagramação executiva da plataforma <strong>SIGER Master</strong> com suporte a <strong>Retrato ou Paisagem</strong>, incluindo matriz comparativa metrológica de fábrica vs campo, memória de cálculo formal, glossário normativo e campos de assinatura técnica.
            </span>
          </div>
        </div>

        {/* Rodapé */}
        <footer className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold cursor-pointer border border-slate-700 transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 bg-[#1C4E26] hover:bg-[#68D346] text-[#B7F365] hover:text-[#0f172a] rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer border border-[#68D346] shadow-lg shadow-[rgba(104,211,70,0.3)] transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Abrir / Imprimir Laudo em PDF</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default LaudoPneusPDFModal;
