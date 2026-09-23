'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, X } from 'lucide-react';
import { SYSTEM_VERSION, COMPANY_NAME, COPYRIGHT_YEAR } from '../config/version';

interface AppFooterProps {
  variant?: 'fixed' | 'flow';
  className?: string;
  showLinks?: boolean;
}

export default function AppFooter({ variant = 'flow', className = '', showLinks = false }: AppFooterProps) {
  const [modalType, setModalType] = useState<'privacidade' | 'termos' | null>(null);

  return (
    <>
      <footer 
        className={`w-full text-[11px] font-mono select-none shrink-0 transition-colors ${
          variant === 'fixed' 
            ? 'px-4 sm:px-6 py-3 bg-white/70 dark:bg-[#1E2024]/85 backdrop-blur-md border-t border-slate-200/80 dark:border-zinc-800/80' 
            : 'py-3 px-4 sm:px-6 mt-auto bg-transparent'
        } ${className}`}
      >
        {showLinks && (
          <div className="mb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-sans">
            <Link href="/consulta" className="text-slate-500 hover:text-emerald-600 dark:hover:text-[#68D346] transition-colors">
              Consulta Rápida
            </Link>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            <Link href="/public/ativos" className="text-slate-500 hover:text-emerald-600 dark:hover:text-[#68D346] transition-colors">
              Catálogo de Equipamentos
            </Link>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            <Link href="/login" className="text-slate-500 hover:text-emerald-600 dark:hover:text-[#68D346] transition-colors">
              Acesso Restrito
            </Link>
          </div>
        )}

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 dark:text-zinc-400">
          {/* Direitos Autorais Oficiais */}
          <div className="text-center sm:text-left">
            <p className="tracking-wide">
              © {COPYRIGHT_YEAR} - Todos os direitos reservados <span className="mx-1 text-[#68D346] font-bold">|</span>{' '}
              <span className="font-bold text-slate-700 dark:text-zinc-200">{COMPANY_NAME}</span>
            </p>
          </div>

          {/* Canto Inferior Direito: Informações sobre Privacidade e Termos */}
          <div className="flex items-center gap-3 text-[10.5px]">
            <button
              type="button"
              onClick={() => setModalType('privacidade')}
              className="text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-[#B7F365] transition-colors cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            >
              Privacidade
            </button>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            <button
              type="button"
              onClick={() => setModalType('termos')}
              className="text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-[#B7F365] transition-colors cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            >
              Termos
            </button>
            <span className="text-slate-300 dark:text-zinc-700 hidden sm:inline">•</span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 hidden sm:inline font-mono">
              {SYSTEM_VERSION}
            </span>
          </div>
        </div>
      </footer>

      {/* Modal Institucional de Privacidade & Termos */}
      {modalType && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setModalType(null)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-[#282A2F] border border-slate-200 dark:border-[#3C3F45] rounded-2xl shadow-2xl p-6 font-sans select-none relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors bg-transparent border-none cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#1C4E26]/20 border border-[#68D346]/40 flex items-center justify-center text-[#68D346]">
                {modalType === 'privacidade' ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-mono font-black text-sm uppercase text-slate-900 dark:text-white">
                  {modalType === 'privacidade' ? 'Diretrizes de Privacidade' : 'Termos de Uso Operacional'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                  JIMMP Info • SIGER Master
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-zinc-300 space-y-3 leading-relaxed max-h-72 overflow-y-auto pr-1">
              {modalType === 'privacidade' ? (
                <>
                  <p>
                    O ecossistema <strong>SIGER Master</strong>, gerido pela <strong>JIMMP Info</strong>, adota rígidos padrões de segurança cibernética e confidencialidade no tratamento de telemetria, dados de frotas e cadastros operacionais.
                  </p>
                  <p>
                    • <strong>Tratamento de Dados:</strong> As informações de abastecimento, rondas, pneus e laudos veiculares são criptografadas e restritas aos perfis homologados pelo contrato operacional.
                  </p>
                  <p>
                    • <strong>Logs e Auditoria:</strong> Toda alteração técnica, retificação pericial ou lançamento em campo gera rastro auditável imutável com carimbo de data, hora e credencial do operador.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    O acesso ao <strong>SIGER Master</strong> é concedido exclusivamente a operadores, socorristas, engenheiros e condutores autorizados pela <strong>JIMMP Info</strong> e clientes contratantes.
                  </p>
                  <p>
                    • <strong>Responsabilidade Operacional:</strong> Os laudos emitidos cumprem normativas regulamentadoras (CONTRAN/ABNT NBR). O usuário é responsável pela fidedignidade dos apontamentos metrológicos realizados.
                  </p>
                  <p>
                    • <strong>Integridade do Sistema:</strong> É vedada qualquer tentativa de engenharia reversa, uso indevido de credenciais ou extração não autorizada de relatórios proprietários.
                  </p>
                </>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-zinc-700/60 flex justify-end">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-slate-900 dark:bg-[#1E2024] text-white hover:bg-slate-800 dark:hover:border-[#68D346] border border-transparent dark:border-[#3C3F45] transition-all cursor-pointer"
              >
                Compreendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
