'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Minus, Maximize2, Minimize2, X, LucideIcon } from 'lucide-react';
import { useWindowModal } from '@/app/context/WindowModalContext';

export interface ModalBaseCorporativoProps {
  isOpen: boolean;
  onClose: () => void;
  modalId: string;
  badgeSistema?: string;
  badgeContrato?: string;
  titulo: string;
  subtitulo?: string;
  icon?: LucideIcon;
  iconName?: string;
  children: React.ReactNode;
  maxWidthClass?: string; // padrão: 'max-w-4xl'
  footer?: React.ReactNode;
}

export default function ModalBaseCorporativo({
  isOpen,
  onClose,
  modalId,
  badgeSistema = 'SPCI GESTÃO DE FROTA',
  badgeContrato = 'ONÇA PUMA',
  titulo,
  subtitulo,
  icon: IconComponent,
  iconName = 'car',
  children,
  maxWidthClass = 'max-w-4xl',
  footer
}: ModalBaseCorporativoProps) {
  const [mounted, setMounted] = useState(false);
  const [internalMaximized, setInternalMaximized] = useState(false);

  const windowModalCtx = useWindowModal();
  const registerWindow = windowModalCtx?.registerWindow;
  const unregisterWindow = windowModalCtx?.unregisterWindow;
  const setWindowState = windowModalCtx?.setWindowState;
  const getWindowState = windowModalCtx?.getWindowState;
  const bringToFront = windowModalCtx?.bringToFront;
  const updateWindowMetadata = windowModalCtx?.updateWindowMetadata;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!registerWindow || !unregisterWindow) return;
    if (isOpen) {
      registerWindow(modalId, {
        title: titulo,
        subtitle: subtitulo || 'Painel Operacional SPCI',
        iconName: iconName,
        badgeStatus: badgeContrato,
        onClose,
      });
    } else {
      unregisterWindow(modalId);
    }
    return () => {
      unregisterWindow(modalId);
    };
  }, [isOpen, modalId, titulo, subtitulo, iconName, badgeContrato, registerWindow, unregisterWindow, onClose]);

  useEffect(() => {
    if (isOpen && updateWindowMetadata) {
      updateWindowMetadata(modalId, {
        badgeStatus: badgeContrato,
      });
    }
  }, [isOpen, badgeContrato, modalId, updateWindowMetadata]);

  const currentState = getWindowState ? getWindowState(modalId) : null;
  const isMinimized = currentState === 'minimized';
  const isMaximized = currentState === 'maximized' || internalMaximized;

  const handleMinimize = () => {
    if (setWindowState) {
      setWindowState(modalId, 'minimized');
    }
  };

  const toggleMaximize = () => {
    if (setWindowState) {
      setWindowState(modalId, isMaximized ? 'restored' : 'maximized');
    } else {
      setInternalMaximized(!internalMaximized);
    }
  };

  // Tecla ESC para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isMinimized) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      style={{ display: isMinimized ? 'none' : 'flex' }}
      className={`fixed inset-0 z-[9999] items-center justify-center bg-slate-900/60 backdrop-blur-md select-none ${
        isMaximized ? 'p-0' : 'p-3 sm:p-4'
      }`}
      onClick={(e) => {
        if (bringToFront) bringToFront(modalId);
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `,
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white border border-slate-200 shadow-2xl relative overflow-hidden flex flex-col text-slate-800 cursor-default transition-all duration-300 ${
          isMaximized
            ? 'w-screen h-screen rounded-none max-h-screen'
            : `w-full ${maxWidthClass} rounded-2xl max-h-[92vh] mx-3`
        }`}
      >
        {/* Linha vermelha gradiente superior SPCI */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-600 shrink-0" />

        {/* Header Corporativo com Cockpit Controls */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                {IconComponent && <IconComponent className="w-4 h-4 animate-pulse" />}
                {badgeSistema}
              </span>
              {badgeContrato && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                  {badgeContrato}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide mt-0.5">
              {titulo}
            </h2>
            {subtitulo && (
              <p className="text-[10px] sm:text-xs text-slate-500 font-sans font-medium">
                {subtitulo}
              </p>
            )}
          </div>

          {/* Controles de Janela */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleMinimize}
              className="text-slate-400 hover:text-slate-700 border border-slate-200 bg-white p-2 transition-all rounded-xl cursor-pointer hover:shadow-xs"
              title="Minimizar para a barra inferior"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={toggleMaximize}
              className="text-slate-400 hover:text-slate-700 border border-slate-200 bg-white p-2 transition-all rounded-xl cursor-pointer hover:shadow-xs"
              title={isMaximized ? 'Restaurar tamanho' : 'Maximizar tela cheia'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-red-600 border border-slate-200 bg-white p-2 transition-all rounded-xl cursor-pointer hover:shadow-xs"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body com rolagem suave */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto no-scrollbar flex-grow bg-slate-50/40">
          {children}
        </div>

        {/* Rodapé opcional sticky */}
        {footer && (
          <div className="p-4 sm:px-6 py-3 border-t border-slate-200 bg-white flex justify-end items-center gap-3 shrink-0">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
