'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Truck, Maximize2 } from 'lucide-react';

interface VehiclePhotoLightboxModalProps {
  isOpen: boolean;
  photoUrl?: string | null;
  prefixo: string;
  placa: string;
  modelo?: string;
  onClose: () => void;
}

export const VehiclePhotoLightboxModal: React.FC<VehiclePhotoLightboxModalProps> = ({
  isOpen,
  photoUrl,
  prefixo,
  placa,
  modelo,
  onClose
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fechamento ergonômico por tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !photoUrl) return null;

  return createPortal(
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md transition-all duration-300 select-none font-sans"
      >
        {/* Botão Fechar Flutuante e Minimalista no Topo */}
        <button
          type="button"
          onClick={onClose}
          className="fixed top-4 right-4 z-[100000] p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 shadow-lg cursor-pointer transition-all hover:scale-110 active:scale-95"
          title="Fechar visualizador (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Container da Imagem sem Bordas (Borderless Lightbox) */}
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center justify-center"
        >
          {/* Imagem Pura com Cantos rounded-3xl e Sombra Difusa Profunda */}
          <div className="relative w-full max-h-[80vh] flex items-center justify-center overflow-hidden rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
            <img
              src={photoUrl}
              alt={`Viatura ${prefixo} - ${placa}`}
              className="w-auto h-auto max-w-full max-h-[80vh] object-contain rounded-3xl"
            />

            {/* Legenda Flutuante Translúcida na Parte Inferior */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 text-white shadow-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-red-600/90 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      {prefixo}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/20 text-zinc-200 font-bold">
                      {placa}
                    </span>
                  </div>
                  {modelo && (
                    <p className="text-[11px] text-zinc-300 truncate">
                      {modelo}
                    </p>
                  )}
                </div>
              </div>

              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 hidden sm:inline-block">
                Ficha Oficial da Frota
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
