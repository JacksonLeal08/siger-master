'use client';

import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, ZoomIn, Check, AlertCircle } from 'lucide-react';

interface DualPhotoCaptureProps {
  fotoGeral: string | null;
  fotoDetalhe: string | null;
  onChangeFotoGeral: (dataUrl: string | null) => void;
  onChangeFotoDetalhe: (dataUrl: string | null) => void;
  required?: boolean;
  theme?: 'light' | 'dark';
}

/**
 * Utilitário de compressão de imagem em Canvas no smartphone:
 * Redimensiona para no máximo 1280px e exporta em JPEG 0.75
 */
export async function compressImageToCanvas(file: File, maxDim = 1280, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Falha ao processar arquivo de imagem'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro na leitura do arquivo'));
    reader.readAsDataURL(file);
  });
}

export const DualPhotoCapture: React.FC<DualPhotoCaptureProps> = ({
  fotoGeral,
  fotoDetalhe,
  onChangeFotoGeral,
  onChangeFotoDetalhe,
  required = true,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const fileInputGeralRef = useRef<HTMLInputElement>(null);
  const fileInputDetalheRef = useRef<HTMLInputElement>(null);

  const [modalZoomImg, setModalZoomImg] = useState<{ src: string; title: string } | null>(null);
  const [compressingSlot, setCompressingSlot] = useState<'geral' | 'detalhe' | null>(null);

  const handleProcessFile = async (file: File, slot: 'geral' | 'detalhe') => {
    setCompressingSlot(slot);
    try {
      const compressed = await compressImageToCanvas(file);
      if (slot === 'geral') {
        onChangeFotoGeral(compressed);
      } else {
        onChangeFotoDetalhe(compressed);
      }
    } catch (err) {
      console.error('[DualPhotoCapture] Erro ao comprimir imagem:', err);
      alert('Não foi possível processar a foto. Tente novamente.');
    } finally {
      setCompressingSlot(null);
    }
  };

  return (
    <div className="w-full space-y-2 select-none" translate="no">
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold tracking-wide uppercase flex items-center gap-1.5 ${
          isDark ? 'text-zinc-300' : 'text-slate-700'
        }`}>
          <Camera className="w-3.5 h-3.5 text-red-500" />
          <span>Evidências Fotográficas Obrigatórias (2 Fotos)</span>
        </span>
        {required && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
            fotoGeral && fotoDetalhe
              ? isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
              : isDark ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {fotoGeral && fotoDetalhe ? '2/2 Anexadas' : 'Obrigatório'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* ==================================================================== */}
        {/* SLOT 1: FOTO GERAL / PANORÂMICA */}
        {/* ==================================================================== */}
        <div className={`rounded-xl p-3 border transition-all ${
          fotoGeral
            ? isDark ? 'bg-zinc-900/90 border-emerald-500/40' : 'bg-white border-emerald-400 shadow-xs'
            : isDark ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50 border-slate-300 hover:border-slate-400 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-semibold flex items-center gap-1 ${
              isDark ? 'text-zinc-200' : 'text-slate-800'
            }`}>
              <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">1</span>
              <span>Visão Geral / Contexto</span>
            </span>
            {fotoGeral && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <Check className="w-3 h-3" /> OK
              </span>
            )}
          </div>

          {fotoGeral ? (
            <div className="relative group rounded-lg overflow-hidden border border-zinc-800 dark:border-zinc-700 h-32 bg-black flex items-center justify-center">
              <img
                src={fotoGeral}
                alt="Foto 1 - Visão Geral"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalZoomImg({ src: fotoGeral, title: 'Foto 1: Visão Geral / Contexto' })}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-xs transition-colors"
                  title="Ampliar foto"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChangeFotoGeral(null)}
                  className="p-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                  title="Remover foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputGeralRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleProcessFile(f, 'geral');
                }}
              />
              <button
                type="button"
                disabled={compressingSlot === 'geral'}
                onClick={() => fileInputGeralRef.current?.click()}
                className={`w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                  isDark
                    ? 'border-zinc-800 hover:border-red-500/50 bg-zinc-950/40 hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200'
                    : 'border-slate-300 hover:border-red-500/50 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs'
                }`}
              >
                {compressingSlot === 'geral' ? (
                  <div className="flex flex-col items-center gap-1 text-xs text-red-500 font-mono">
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <span>Processando foto...</span>
                  </div>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-red-500" />
                    <span className="text-xs font-bold">Capturar Foto 1</span>
                    <span className="text-[10px] opacity-70">Ângulo Amplo do Veículo / Avaria</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* SLOT 2: FOTO DE DETALHE / MACRO */}
        {/* ==================================================================== */}
        <div className={`rounded-xl p-3 border transition-all ${
          fotoDetalhe
            ? isDark ? 'bg-zinc-900/90 border-emerald-500/40' : 'bg-white border-emerald-400 shadow-xs'
            : isDark ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50 border-slate-300 hover:border-slate-400 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-semibold flex items-center gap-1 ${
              isDark ? 'text-zinc-200' : 'text-slate-800'
            }`}>
              <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">2</span>
              <span>Detalhe / Foco Específico</span>
            </span>
            {fotoDetalhe && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <Check className="w-3 h-3" /> OK
              </span>
            )}
          </div>

          {fotoDetalhe ? (
            <div className="relative group rounded-lg overflow-hidden border border-zinc-800 dark:border-zinc-700 h-32 bg-black flex items-center justify-center">
              <img
                src={fotoDetalhe}
                alt="Foto 2 - Detalhe / Macro"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalZoomImg({ src: fotoDetalhe, title: 'Foto 2: Detalhe / Foco Específico' })}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-xs transition-colors"
                  title="Ampliar foto"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChangeFotoDetalhe(null)}
                  className="p-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                  title="Remover foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputDetalheRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleProcessFile(f, 'detalhe');
                }}
              />
              <button
                type="button"
                disabled={compressingSlot === 'detalhe'}
                onClick={() => fileInputDetalheRef.current?.click()}
                className={`w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                  isDark
                    ? 'border-zinc-800 hover:border-red-500/50 bg-zinc-950/40 hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200'
                    : 'border-slate-300 hover:border-red-500/50 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs'
                }`}
              >
                {compressingSlot === 'detalhe' ? (
                  <div className="flex flex-col items-center gap-1 text-xs text-red-500 font-mono">
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <span>Processando foto...</span>
                  </div>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-red-500" />
                    <span className="text-xs font-bold">Capturar Foto 2</span>
                    <span className="text-[10px] opacity-70">Aproximação Macro do Dano</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Lightbox de Zoom */}
      {modalZoomImg && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setModalZoomImg(null)}
        >
          <div className="max-w-xl w-full flex items-center justify-between text-white pb-3">
            <span className="text-xs font-bold font-mono tracking-wide uppercase">{modalZoomImg.title}</span>
            <button 
              type="button" 
              className="text-xs font-bold text-zinc-400 hover:text-white px-2 py-1 bg-white/10 rounded-md"
              onClick={() => setModalZoomImg(null)}
            >
              Fechar [X]
            </button>
          </div>
          <div className="max-w-xl w-full max-h-[75vh] flex items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-black">
            <img 
              src={modalZoomImg.src} 
              alt={modalZoomImg.title} 
              className="max-w-full max-h-[75vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
