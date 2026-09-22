'use client';

import React from 'react';
import { ShieldAlert, BookOpen, AlertTriangle, Scale, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface TwiEducationalCardProps {
  isDark?: boolean;
}

export const TwiEducationalCard: React.FC<TwiEducationalCardProps> = ({ isDark: isDarkProp }) => {
  const { theme } = useTheme();
  const isDark = isDarkProp !== undefined ? isDarkProp : theme === 'dark';

  return (
    <div className={`rounded-2xl p-5 border shadow-xl relative overflow-hidden font-sans transition-colors duration-200 ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
    }`}>
      {/* Dynamic industrial accent header */}
      <div className={`flex items-center justify-between border-b pb-3 mb-4 ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            isDark ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' : 'bg-amber-50 border border-amber-200 text-amber-600'
          }`}>
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}>
              Padrão Técnico Normativo TWI
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                isDark ? 'bg-red-950/80 text-red-400 border-red-800' : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                CONTRAN 558/80
              </span>
            </h4>
            <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Segurança Operacional e Limites Legais de Rodagem para Viaturas
            </p>
          </div>
        </div>
        <span className={`text-[9px] font-mono border px-2 py-0.5 rounded uppercase hidden sm:inline-block ${
          isDark ? 'text-slate-400 border-slate-700' : 'text-slate-600 border-slate-300'
        }`}>
          Art. 230 CTB
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Coluna 1: O que é TWI */}
        <div className={`border rounded-xl p-3.5 space-y-2 ${
          isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`flex items-center gap-2 text-[11px] font-bold ${
            isDark ? 'text-amber-400' : 'text-amber-600'
          }`}>
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>O que é TWI?</span>
          </div>
          <p className={`text-[10.5px] leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            <strong>TWI</strong> significa <em>Tread Wear Indicator</em> (Indicador de Desgaste da Banda de Rodagem). Trata-se de pequenos ressaltos de borracha posicionados no fundo dos sulcos principais do pneu.
          </p>
          <p className={`text-[10px] font-mono ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Quando a banda de rodagem atinge o mesmo nível do ressalto, o pneu alcançou seu limite máximo de desgaste.
          </p>
        </div>

        {/* Coluna 2: Amparo Legal */}
        <div className={`border rounded-xl p-3.5 space-y-2 ${
          isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`flex items-center gap-2 text-[11px] font-bold ${
            isDark ? 'text-red-400' : 'text-red-600'
          }`}>
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Resolução CONTRAN nº 558/80</span>
          </div>
          <p className={`text-[10.5px] leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            É <strong>expressamente proibida</strong> a circulação de veículos automotores com profundidade de sulco inferior a <strong>1,6 mm</strong> em qualquer ponto da banda de rodagem.
          </p>
          <div className={`text-[9.5px] px-2 py-1 rounded font-mono border ${
            isDark ? 'bg-red-950/40 border-red-900/60 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            ⚠️ Infração Grave: Multa, 5 pontos na CNH e retenção do veículo para regularização.
          </div>
        </div>

        {/* Coluna 3: Riscos de Segurança Operacional */}
        <div className={`border rounded-xl p-3.5 space-y-2 ${
          isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`flex items-center gap-2 text-[11px] font-bold ${
            isDark ? 'text-emerald-400' : 'text-emerald-600'
          }`}>
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Risco em Viaturas de Emergência</span>
          </div>
          <ul className={`text-[10px] space-y-1.5 list-disc list-inside ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
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
      <div className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
            <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>≥ 3.0 mm: Conforme</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs"></span>
            <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>1.7 a 2.9 mm: Atenção / Troca Próxima</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-xs"></span>
            <span className={`font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>≤ 1.6 mm: Crítico TWI (Proibido Rodar)</span>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-[9.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Diretriz de Frota SPCI Master
        </span>
      </div>
    </div>
  );
};

