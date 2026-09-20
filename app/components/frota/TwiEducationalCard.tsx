'use client';

import React from 'react';
import { ShieldAlert, BookOpen, AlertTriangle, Scale, CheckCircle2 } from 'lucide-react';

export const TwiEducationalCard: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 shadow-xl relative overflow-hidden font-sans">
      {/* Dynamic industrial accent header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              Padrão Técnico Normativo TWI
              <span className="text-[9px] bg-red-950/80 text-red-400 border border-red-800 px-2 py-0.5 rounded-full font-mono font-bold">
                CONTRAN 558/80
              </span>
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              Segurança Operacional e Limites Legais de Rodagem para Viaturas
            </p>
          </div>
        </div>
        <span className="text-[9px] font-mono text-slate-400 border border-slate-700 px-2 py-0.5 rounded uppercase hidden sm:inline-block">
          Art. 230 CTB
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Coluna 1: O que é TWI */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-[11px] font-bold">
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>O que é TWI?</span>
          </div>
          <p className="text-[10.5px] text-slate-300 leading-relaxed">
            <strong>TWI</strong> significa <em>Tread Wear Indicator</em> (Indicador de Desgaste da Banda de Rodagem). Trata-se de pequenos ressaltos de borracha posicionados no fundo dos sulcos principais do pneu.
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            Quando a banda de rodagem atinge o mesmo nível do ressalto, o pneu alcançou seu limite máximo de desgaste.
          </p>
        </div>

        {/* Coluna 2: Amparo Legal */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-red-400 text-[11px] font-bold">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Resolução CONTRAN nº 558/80</span>
          </div>
          <p className="text-[10.5px] text-slate-300 leading-relaxed">
            É <strong>expressamente proibida</strong> a circulação de veículos automotores com profundidade de sulco inferior a <strong>1,6 mm</strong> em qualquer ponto da banda de rodagem.
          </p>
          <div className="text-[9.5px] bg-red-950/40 border border-red-900/60 text-red-300 px-2 py-1 rounded font-mono">
            ⚠️ Infração Grave: Multa, 5 pontos na CNH e retenção do veículo para regularização.
          </div>
        </div>

        {/* Coluna 3: Riscos de Segurança Operacional */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-bold">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Risco em Viaturas de Emergência</span>
          </div>
          <ul className="text-[10px] text-slate-300 space-y-1.5 list-disc list-inside">
            <li>
              <strong>Aquaplanagem Imediata:</strong> Sulcos desgastados não drenam água, gerando perda instantânea de contato com a pista.
            </li>
            <li>
              <strong>Distância de Frenagem 40% Maior:</strong> Ambulâncias e viaturas pesadas exigem maior aderência em paradas bruscas.
            </li>
            <li>
              <strong>Perda de Tração:</strong> Riscos severos de tombamento em curvas e vias de mina não pavimentadas.
            </li>
          </ul>
        </div>
      </div>

      {/* Tabela de Referência Rápida dos Sulcos */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
            <span className="text-emerald-400 font-bold">≥ 3.0 mm: Conforme</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs"></span>
            <span className="text-amber-400 font-bold">1.7 a 2.9 mm: Atenção / Troca Próxima</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-xs"></span>
            <span className="text-red-400 font-bold">≤ 1.6 mm: Crítico TWI (Proibido Rodar)</span>
          </div>
        </div>
        <span className="text-slate-400 flex items-center gap-1 text-[9.5px]">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Diretriz de Frota SPCI Master
        </span>
      </div>
    </div>
  );
};
