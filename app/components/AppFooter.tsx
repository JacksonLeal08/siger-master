'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import LegalPolicyModal, { PolicyModalType } from './legal/LegalPolicyModal';
import { SYSTEM_VERSION, COMPANY_NAME, COPYRIGHT_YEAR } from '../config/version';

interface AppFooterProps {
  variant?: 'fixed' | 'flow';
  className?: string;
  showLinks?: boolean;
}

export default function AppFooter({ variant = 'flow', className = '', showLinks = false }: AppFooterProps) {
  const [modalPolicy, setModalPolicy] = useState<PolicyModalType>(null);

  return (
    <>
      <footer 
        className={`w-full text-[11px] font-mono select-none shrink-0 transition-colors ${
          variant === 'fixed' 
            ? 'px-4 sm:px-6 py-3 bg-white/80 dark:bg-[#121316]/90 backdrop-blur-md border-t border-slate-200/80 dark:border-zinc-800/80' 
            : 'py-3 px-4 sm:px-6 mt-auto bg-transparent'
        } ${className}`}
      >
        {showLinks && (
          <div className="mb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-sans">
            <Link href="/consulta" className="text-slate-500 hover:text-[#68D346] dark:hover:text-[#B7F365] transition-colors">
              Consulta Rápida
            </Link>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            <Link href="/public/ativos" className="text-slate-500 hover:text-[#68D346] dark:hover:text-[#B7F365] transition-colors">
              Catálogo de Equipamentos
            </Link>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            <Link href="/login" className="text-slate-500 hover:text-[#68D346] dark:hover:text-[#B7F365] transition-colors">
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
              onClick={() => setModalPolicy('privacy')}
              className="text-slate-500 dark:text-zinc-400 hover:text-[#68D346] dark:hover:text-[#B7F365] transition-colors cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            >
              Privacidade
            </button>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            <button
              type="button"
              onClick={() => setModalPolicy('terms')}
              className="text-slate-500 dark:text-zinc-400 hover:text-[#68D346] dark:hover:text-[#B7F365] transition-colors cursor-pointer bg-transparent border-none p-0 focus:outline-none"
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

      {/* Modal Desacoplado via React Portal (Eliminação Total de Estouro) */}
      <LegalPolicyModal
        isOpen={!!modalPolicy}
        type={modalPolicy}
        onClose={() => setModalPolicy(null)}
      />
    </>
  );
}
