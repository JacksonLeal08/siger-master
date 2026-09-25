'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, FileText, X, Check } from 'lucide-react';

export type PolicyModalType = 'terms' | 'privacy' | null;

interface LegalPolicyModalProps {
  isOpen: boolean;
  type: PolicyModalType;
  onClose: () => void;
}

export default function LegalPolicyModal({ isOpen, type, onClose }: LegalPolicyModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Trava de Scroll Global (overflow: hidden no body enquanto aberto)
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Fechar ao pressionar tecla ESC
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow || 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !type) return null;

  const isTerms = type === 'terms';

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 backdrop-blur-md bg-black/80 animate-in fade-in duration-200 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden max-h-[85vh] flex flex-col font-sans text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior de acento Neon Metálico */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#68D346] to-transparent shadow-[0_0_12px_#68D346]" />

        {/* Botão Superior Fechar (✕) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-700/80 rounded-xl transition-all cursor-pointer bg-transparent"
          aria-label="Fechar Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho do Modal */}
        <div className="flex items-center gap-4 mb-6 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-[#1C4E26]/40 border border-[#68D346]/50 flex items-center justify-center text-[#68D346] shadow-[0_0_15px_-2px_rgba(104,211,70,0.35)] shrink-0">
            {isTerms ? <FileText className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono uppercase text-[#68D346] font-bold tracking-widest mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#68D346] animate-pulse" />
              {isTerms ? 'NORMATIVA OPERACIONAL' : 'GOVERNANÇA & LGPD'}
            </div>
            <h2 className="font-mono font-black text-base sm:text-lg uppercase text-white tracking-wide leading-tight">
              {isTerms ? 'Termos de Uso Operacional' : 'Diretrizes de Privacidade & Segurança'}
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              JIMMP Info • SIGER Master v2.11
            </p>
          </div>
        </div>

        {/* Corpo Scrollável Desacoplado */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans border-y border-zinc-800/80 py-4 my-2">
          {isTerms ? (
            <>
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="font-mono text-[10px] font-extrabold uppercase text-[#B7F365] tracking-wider block">
                  Cláusula 1 • Acesso Autorizado
                </span>
                <p className="text-zinc-300">
                  O acesso e utilização da plataforma <strong>SIGER Master</strong> é de caráter estritamente restrito e confidencial, reservado a operadores, socorristas, condutores de emergência, brigadistas e engenheiros devidamente credenciados pelas plantas industriais e complexos operacionais contratantes.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="font-mono text-[10px] font-extrabold uppercase text-[#B7F365] tracking-wider block">
                  Cláusula 2 • Fidedignidade Metrológica
                </span>
                <p className="text-zinc-300">
                  O operador assume integral responsabilidade técnica pela veracidade dos apontamentos metrológicos realizados na plataforma, abrangendo auditorias de pneus (TWI), telemetria de abastecimentos, calibração de manômetros e emissão de laudos veiculares perante as resoluções CONTRAN 558/80 e normas ABNT NBR aplicáveis.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="font-mono text-[10px] font-extrabold uppercase text-[#B7F365] tracking-wider block">
                  Cláusula 3 • Integridade do Sistema
                </span>
                <p className="text-zinc-300">
                  É expressamente vedada qualquer tentativa de engenharia reversa, interceptação de tráfego telemétrico, uso indevido ou compartilhamento de credenciais corporativas, bem como a extração não autorizada de dados e laudos técnicos proprietários do ecossistema.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="font-mono text-[10px] font-extrabold uppercase text-[#B7F365] tracking-wider block">
                  Diretriz 1 • Tratamento e Sigilo de Dados Críticos
                </span>
                <p className="text-zinc-300">
                  Todas as informações operacionais registradas no ecossistema — incluindo coordenadas geográficas GPS de viaturas, telemetria antifraude de frotas, dados clínicos do Prontuário APH Vivo e laudos técnicos periciais — são protegidas com criptografia de ponta a ponta (TLS 1.3 em trânsito e AES-256 em repouso), em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="font-mono text-[10px] font-extrabold uppercase text-[#B7F365] tracking-wider block">
                  Diretriz 2 • Rastreabilidade Imutável & Logs de Auditoria
                </span>
                <p className="text-zinc-300">
                  Para fins de governança corporativa e auditoria de sinistros, todo acesso, edição, substituição de ativos ou despacho operacional gera registro imutável em trilha de auditoria (audit log), vinculado à credencial autenticada, endereço IP, carimbo temporal certificado e georreferenciamento de campo.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="font-mono text-[10px] font-extrabold uppercase text-[#B7F365] tracking-wider block">
                  Diretriz 3 • Prontuário APH & Sigilo Clínico
                </span>
                <p className="text-zinc-300">
                  Os prontuários de atendimento pré-hospitalar (ePCR) contendo sinais vitais e histórico de vítimas na cena possuem isolamento de acesso por papéis (RBAC/RLS), garantindo que apenas profissionais de saúde e gestores de emergência autorizados visualizem os registros clínicos.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Rodapé do Modal (Ações) */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <span className="text-[10px] text-zinc-500 text-center sm:text-left">
            SEGURANÇA CORPORATIVA • JIMMP INFO DEFENSE
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#282A2F] to-[#1E2024] hover:from-[#3C3F45] hover:to-[#282A2F] text-[#B7F365] border border-[#68D346]/40 hover:border-[#68D346] shadow-[0_0_15px_rgba(104,211,70,0.2)] hover:shadow-[0_0_22px_rgba(104,211,70,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <Check className="w-4 h-4 text-[#68D346]" />
            <span>Compreendido</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
