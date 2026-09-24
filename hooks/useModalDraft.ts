'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseModalDraftOptions<T> {
  draftKey: string;
  isOpen?: boolean;
  currentData?: Partial<T>;
  debounceMs?: number;
  enabled?: boolean;
}

export function useModalDraft<T extends Record<string, any>>({
  draftKey,
  isOpen = true,
  currentData,
  debounceMs = 500,
  enabled = true,
}: UseModalDraftOptions<T>) {
  const storageKey = `siger_draft_${draftKey}`;

  // Leitura síncrona/inicial do rascunho
  const getSavedDraft = useCallback((): Partial<T> | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed as Partial<T>;
        }
      }
    } catch (err) {
      console.warn(`[useModalDraft] Erro ao carregar rascunho de ${draftKey}:`, err);
    }
    return null;
  }, [storageKey, draftKey]);

  const [hasDraft, setHasDraft] = useState<boolean>(() => {
    return Boolean(getSavedDraft());
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Função para salvar rascunho
  const saveDraft = useCallback(
    (dataToSave?: Partial<T>) => {
      if (typeof window === 'undefined' || !enabled) return;
      const data = dataToSave || currentData;
      if (!data || Object.keys(data).length === 0) return;

      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        setHasDraft(true);
      } catch (err) {
        console.warn(`[useModalDraft] Falha ao persistir rascunho ${draftKey}:`, err);
      }
    },
    [storageKey, enabled, currentData, draftKey]
  );

  // Limpeza do rascunho (chamado no submit bem-sucedido ou descarte)
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
    } catch (err) {
      console.warn(`[useModalDraft] Falha ao remover rascunho ${draftKey}:`, err);
    }
  }, [storageKey, draftKey]);

  // Auto-save com debounce sempre que currentData mudar e modal estiver aberto
  useEffect(() => {
    if (!isOpen || !enabled || !currentData) return;

    // Não salva se todos os valores forem vazios
    const hasValues = Object.values(currentData).some(
      (val) => val !== '' && val !== null && val !== undefined && !(Array.isArray(val) && val.length === 0)
    );

    if (!hasValues) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(currentData));
        setHasDraft(true);
      } catch (err) {
        console.warn(`[useModalDraft] Falha no auto-save do rascunho ${draftKey}:`, err);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentData, isOpen, enabled, storageKey, debounceMs, draftKey]);

  return {
    getSavedDraft,
    hasDraft,
    saveDraft,
    clearDraft,
  };
}

export default useModalDraft;
