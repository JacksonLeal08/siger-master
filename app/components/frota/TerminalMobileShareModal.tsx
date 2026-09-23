'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Smartphone,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  X,
  Share2,
  ShieldCheck,
  Send,
  Sparkles,
  Layers
} from 'lucide-react';

interface TerminalMobileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  contratoId?: string;
}

export const TerminalMobileShareModal: React.FC<TerminalMobileShareModalProps> = ({
  isOpen,
  onClose,
  contratoId = 'SALOBO',
}) => {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  // Normalização do slug do contrato para URL
  const contratoSlug = encodeURIComponent(
    (contratoId || 'salobo').trim().toLowerCase().replace(/\s+/g, '-')
  );

  // URL pública de acesso para os condutores
  const baseUrl =
    typeof window !== 'undefined' && window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://spci-master.vercel.app';

  const terminalUrl = `${baseUrl}/terminal/abastecer?contrato=${contratoSlug}`;

  // QR Code URL de alta resolução com margem
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(
    terminalUrl
  )}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(terminalUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = terminalUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar link:', err);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🚒 *SIGER Master - TERMINAL DE ABASTECIMENTO*\n\n` +
      `Olá condutor/socorrista! Acesse o terminal de campo pelo link abaixo para registrar os abastecimentos da frota:\n\n` +
      `🔗 ${terminalUrl}\n\n` +
      `_Contrato Ativo: ${contratoId.toUpperCase()} | Operação Offline-First_`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 font-sans animate-in fade-in duration-200">
      {/* Backdrop com desfoque profundo */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Janela Executiva */}
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10">
        {/* Linha vermelha gradiente SPCI */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shrink-0" />

        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
              <Smartphone className="w-5 h-5 animate-pulse" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-zinc-100">
                  Terminal Mobile de Abastecimento
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 font-bold text-zinc-300">
                  {contratoId.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Compartilhamento instantâneo via QR Code para condutores
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Card Central com o QR Code */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 border border-zinc-800/80 relative group">
            <div className="relative p-3.5 bg-white rounded-2xl shadow-xl transition-transform duration-200 group-hover:scale-[1.02]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeImageUrl}
                alt="QR Code Terminal Mobile"
                className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                loading="eager"
              />
              <div className="absolute inset-0 border-2 border-red-500/20 rounded-2xl pointer-events-none" />
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aponte a câmera do smartphone para abrir</span>
            </div>
          </div>

          {/* Campo de Leitura com Cópia Rápida */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase font-bold text-zinc-400 tracking-wider flex items-center justify-between">
              <span>Link Público de Acesso Direto</span>
              <span className="text-zinc-500 text-[10px]">Autenticação simplificada por site</span>
            </label>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono text-zinc-300 truncate select-all focus-within:border-red-500/50">
                {terminalUrl}
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all duration-200 shrink-0 ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 active:scale-95'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>✓ Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-300" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Botões de Ação Direta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={terminalUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              <span>Abrir em Nova Aba</span>
            </a>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/30 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Enviar via WhatsApp</span>
            </button>
          </div>

          {/* Dica Operacional */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs text-zinc-400 leading-relaxed">
              <p className="font-bold text-zinc-200">Dica Operacional de Despacho:</p>
              <p className="mt-0.5">
                Envie este link no grupo de WhatsApp dos motoristas e socorristas da base. O terminal funciona como um PWA offline-first: ele salva os dados no aparelho e envia automaticamente assim que houver sinal de celular no posto.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-5 py-3 border-t border-zinc-900 bg-zinc-950 text-center text-[11px] font-mono text-zinc-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            PWA OFFLINE COMPATÍVEL
          </span>
          <span>SIGER Master // FROTA</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TerminalMobileShareModal;

