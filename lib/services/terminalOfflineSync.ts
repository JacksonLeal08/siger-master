/**
 * terminalOfflineSync.ts
 * Mecanismo Offline-First via IndexedDB para o Terminal Mobile de Abastecimento do SIGER Master.
 * 
 * Stores:
 * - viaturas_cache: Armazena a lista de viaturas para consulta offline.
 * - postos_cache: Armazena os nomes e dados dos postos frequentes.
 * - abastecimentos_queue: Fila de abastecimentos gravados offline para sincronização posterior.
 */

import { Viatura, Abastecimento } from '@/lib/types/frota';
import { registrarAbastecimentoAction } from '@/app/actions/frotaActions';

const DB_NAME = 'spci_terminal_db';
const DB_VERSION = 1;

export interface QueuedAbastecimento {
  id?: number;
  uuid: string;
  data_hora: string;
  status: 'PENDENTE_SYNC' | 'SINCRONIZANDO' | 'ERRO';
  tentativas: number;
  erro_msg?: string;
  payload: Partial<Abastecimento> & {
    tipoVeiculo?: string;
    foto_calibracao_url?: string | null;
    foto_cupom_url?: string | null;
  };
}

class TerminalOfflineSyncService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isSyncing = false;

  private openDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('IndexedDB não está disponível no servidor'));
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('viaturas_cache')) {
          db.createObjectStore('viaturas_cache', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('postos_cache')) {
          db.createObjectStore('postos_cache', { keyPath: 'nome' });
        }

        if (!db.objectStoreNames.contains('abastecimentos_queue')) {
          const store = db.createObjectStore('abastecimentos_queue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('uuid', 'uuid', { unique: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // ==========================================
  // 1. CACHE DE VIATURAS
  // ==========================================

  async cacheViaturas(viaturas: Viatura[]): Promise<void> {
    if (typeof window === 'undefined' || !viaturas || viaturas.length === 0) return;
    try {
      const db = await this.openDB();
      const tx = db.transaction('viaturas_cache', 'readwrite');
      const store = tx.objectStore('viaturas_cache');

      for (const v of viaturas) {
        store.put(v);
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('[terminalOfflineSync] Falha ao gravar cache de viaturas:', err);
    }
  }

  async getCachedViaturas(contratoId?: string): Promise<Viatura[]> {
    if (typeof window === 'undefined') return [];
    try {
      const db = await this.openDB();
      const tx = db.transaction('viaturas_cache', 'readonly');
      const store = tx.objectStore('viaturas_cache');
      const request = store.getAll();

      const items = await new Promise<Viatura[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as Viatura[]);
        request.onerror = () => reject(request.error);
      });

      if (!contratoId || contratoId === 'TODOS' || contratoId === 'GLOBAL') {
        return items;
      }

      return items.filter(
        (v) => (v.contrato_id || '').toUpperCase() === contratoId.toUpperCase()
      );
    } catch (err) {
      console.warn('[terminalOfflineSync] Falha ao recuperar cache de viaturas:', err);
      return [];
    }
  }

  // ==========================================
  // 2. CACHE DE POSTOS
  // ==========================================

  async cachePostos(postos: string[]): Promise<void> {
    if (typeof window === 'undefined' || !postos) return;
    try {
      const db = await this.openDB();
      const tx = db.transaction('postos_cache', 'readwrite');
      const store = tx.objectStore('postos_cache');

      for (const p of postos) {
        if (p && p.trim()) {
          store.put({ nome: p.trim() });
        }
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('[terminalOfflineSync] Falha ao gravar cache de postos:', err);
    }
  }

  async getCachedPostos(): Promise<string[]> {
    if (typeof window === 'undefined') return [];
    try {
      const db = await this.openDB();
      const tx = db.transaction('postos_cache', 'readonly');
      const store = tx.objectStore('postos_cache');
      const request = store.getAll();

      const items = await new Promise<{ nome: string }[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return items.map((i) => i.nome);
    } catch (err) {
      console.warn('[terminalOfflineSync] Falha ao recuperar cache de postos:', err);
      return [];
    }
  }

  // ==========================================
  // 3. FILA DE ABASTECIMENTOS OFFLINE (QUEUE)
  // ==========================================

  async enqueueAbastecimento(
    payload: QueuedAbastecimento['payload']
  ): Promise<number> {
    const db = await this.openDB();
    const item: Omit<QueuedAbastecimento, 'id'> = {
      uuid: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data_hora: new Date().toISOString(),
      status: 'PENDENTE_SYNC',
      tentativas: 0,
      payload,
    };

    return new Promise<number>((resolve, reject) => {
      const tx = db.transaction('abastecimentos_queue', 'readwrite');
      const store = tx.objectStore('abastecimentos_queue');
      const req = store.add(item);

      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  }

  async getPendingQueue(): Promise<QueuedAbastecimento[]> {
    if (typeof window === 'undefined') return [];
    try {
      const db = await this.openDB();
      const tx = db.transaction('abastecimentos_queue', 'readonly');
      const store = tx.objectStore('abastecimentos_queue');
      const req = store.getAll();

      return new Promise<QueuedAbastecimento[]>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result as QueuedAbastecimento[]);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[terminalOfflineSync] Erro ao ler fila de abastecimentos:', err);
      return [];
    }
  }

  async removeQueuedItem(id: number): Promise<void> {
    const db = await this.openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('abastecimentos_queue', 'readwrite');
      const store = tx.objectStore('abastecimentos_queue');
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async updateItemStatus(
    id: number,
    status: QueuedAbastecimento['status'],
    errorMsg?: string
  ): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction('abastecimentos_queue', 'readwrite');
    const store = tx.objectStore('abastecimentos_queue');
    const req = store.get(id);

    req.onsuccess = () => {
      const record = req.result as QueuedAbastecimento | undefined;
      if (record) {
        record.status = status;
        record.tentativas = (record.tentativas || 0) + 1;
        if (errorMsg) record.erro_msg = errorMsg;
        store.put(record);
      }
    };
  }

  // ==========================================
  // 4. SINCRONIZAÇÃO EM SEGUNDO PLANO
  // ==========================================

  async syncPendingAbastecimentos(
    onProgress?: (total: number, remaining: number) => void
  ): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) {
      return { synced: 0, failed: 0 };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const queue = await this.getPendingQueue();
      const pending = queue.filter((item) => item.status !== 'SINCRONIZANDO');

      if (pending.length === 0) {
        return { synced: 0, failed: 0 };
      }

      for (let i = 0; i < pending.length; i++) {
        const item = pending[i];
        if (!item.id) continue;

        try {
          await this.updateItemStatus(item.id, 'SINCRONIZANDO');

          const res = await registrarAbastecimentoAction(
            item.payload,
            item.payload.tipoVeiculo || 'CAMINHONETE'
          );

          if (res.success) {
            await this.removeQueuedItem(item.id);
            synced++;
          } else {
            await this.updateItemStatus(
              item.id,
              'ERRO',
              res.error || 'Falha ao sincronizar'
            );
            failed++;
          }
        } catch (err: any) {
          await this.updateItemStatus(
            item.id,
            'ERRO',
            err?.message || 'Erro de rede ou servidor'
          );
          failed++;
        }

        onProgress?.(pending.length, pending.length - (synced + failed));
      }
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed };
  }

  // ==========================================
  // 5. REGISTRO DE EVENTOS ONLINE
  // ==========================================

  initOfflineSyncListeners(onSyncSuccess?: (count: number) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = async () => {
      console.log('📡 [terminalOfflineSync] Conexão restabelecida! Iniciando sincronização...');
      const result = await this.syncPendingAbastecimentos();
      if (result.synced > 0) {
        onSyncSuccess?.(result.synced);
      }
    };

    window.addEventListener('online', handleOnline);

    // Tentativa inicial se já estiver online
    if (navigator.onLine) {
      this.syncPendingAbastecimentos().then((res) => {
        if (res.synced > 0) onSyncSuccess?.(res.synced);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }
}

export const terminalOfflineSync = new TerminalOfflineSyncService();
