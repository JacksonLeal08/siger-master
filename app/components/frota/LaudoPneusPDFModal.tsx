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
  if (!isOpen) return null;

  const handlePrint = () => {
    generateLaudoPneusPDF(inspecao, viatura, responsavelNome);
  };

  const isCritico = inspecao.status_geral_twi === 'CRITICO_PROIBIDO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md font-sans select-none animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Cabeçalho */}
        <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500">
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

          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
            <span>
              O laudo gerado segue a diagramação executiva da plataforma SIGER Master no formato <strong>A4 Paisagem (Página Única)</strong>, incluindo matriz comparativa metrológica de fábrica vs campo, memória de cálculo formal, glossário normativo e campos de assinatura técnica.
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
            className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer border-none shadow-lg shadow-red-600/30 transition-all active:scale-95"
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
