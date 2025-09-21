"use client";

import { QueryClient } from "@tanstack/react-query";
import { unifiedQueryKeys, unifiedInvalidation } from "../react-query/unified-query-client";
import { logComponents } from "../logger";

/**
 * MIDDLEWARE DE SINCRONIZAÇÃO GLOBAL
 * 
 * Este middleware garante que todos os dados sejam sincronizados
 * automaticamente após qualquer operação crítica.
 */

export interface SyncEvent {
  type: 'transaction' | 'account' | 'transfer' | 'bulk_operation';
  action: 'create' | 'update' | 'delete';
  entityId?: string;
  metadata?: Record<string, any>;
}

export class SyncMiddleware {
  private queryClient: QueryClient;
  private syncQueue: SyncEvent[] = [];
  private isProcessing = false;
  private syncListeners: ((event: SyncEvent) => void)[] = [];

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.setupGlobalListeners();
  }

  /**
   * Adiciona um evento de sincronização à fila
   */
  addSyncEvent(event: SyncEvent) {
    this.syncQueue.push(event);
    logComponents.info("Evento de sincronização adicionado:", event);
    
    // Notificar listeners
    this.syncListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logComponents.error("Erro em listener de sincronização:", error);
      }
    });

    // Processar fila se não estiver processando
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Adiciona um listener para eventos de sincronização
   */
  addSyncListener(listener: (event: SyncEvent) => void) {
    this.syncListeners.push(listener);
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  /**
   * Processa a fila de sincronização
   */
  private async processQueue() {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    logComponents.info("Iniciando processamento da fila de sincronização");

    try {
      // Agrupar eventos similares para otimizar
      const groupedEvents = this.groupEvents(this.syncQueue);
      this.syncQueue = [];

      // Processar cada grupo
      for (const group of groupedEvents) {
        await this.processEventGroup(group);
      }

      logComponents.info("Fila de sincronização processada com sucesso");
    } catch (error) {
      logComponents.error("Erro ao processar fila de sincronização:", error);
    } finally {
      this.isProcessing = false;

      // Se há novos eventos na fila, processar novamente
      if (this.syncQueue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  /**
   * Agrupa eventos similares para otimizar a sincronização
   */
  private groupEvents(events: SyncEvent[]): SyncEvent[][] {
    const groups: SyncEvent[][] = [];
    const processed = new Set<number>();

    events.forEach((event, index) => {
      if (processed.has(index)) return;

      const group = [event];
      processed.add(index);

      // Procurar eventos similares
      events.forEach((otherEvent, otherIndex) => {
        if (
          otherIndex > index &&
          !processed.has(otherIndex) &&
          this.areEventsSimilar(event, otherEvent)
        ) {
          group.push(otherEvent);
          processed.add(otherIndex);
        }
      });

      groups.push(group);
    });

    return groups;
  }

  /**
   * Verifica se dois eventos são similares e podem ser agrupados
   */
  private areEventsSimilar(event1: SyncEvent, event2: SyncEvent): boolean {
    return event1.type === event2.type && event1.action === event2.action;
  }

  /**
   * Processa um grupo de eventos
   */
  private async processEventGroup(events: SyncEvent[]) {
    if (events.length === 0) return;

    const firstEvent = events[0];
    logComponents.info(`Processando grupo de ${events.length} eventos:`, firstEvent.type, firstEvent.action);

    try {
      switch (firstEvent.type) {
        case 'transaction':
          await this.syncTransactionEvents(events);
          break;
        case 'account':
          await this.syncAccountEvents(events);
          break;
        case 'transfer':
          await this.syncTransferEvents(events);
          break;
        case 'bulk_operation':
          await this.syncBulkOperationEvents(events);
          break;
        default:
          logComponents.warn("Tipo de evento desconhecido:", firstEvent.type);
      }
    } catch (error) {
      logComponents.error("Erro ao processar grupo de eventos:", error);
      throw error;
    }
  }

  /**
   * Sincroniza eventos de transação
   */
  private async syncTransactionEvents(events: SyncEvent[]) {
    // Invalidar queries relacionadas a transações
    await Promise.all([
      unifiedInvalidation.transactions(),
      unifiedInvalidation.dashboard(),
      this.queryClient.refetchQueries({ queryKey: unifiedQueryKeys.transactions.recent() }),
      this.queryClient.refetchQueries({ queryKey: unifiedQueryKeys.accounts.summary() }),
    ]);

    // Se há muitas transações, invalidar tudo
    if (events.length > 5) {
      await unifiedInvalidation.allFinancialData();
    }
  }

  /**
   * Sincroniza eventos de conta
   */
  private async syncAccountEvents(events: SyncEvent[]) {
    // Invalidar queries relacionadas a contas
    await Promise.all([
      unifiedInvalidation.accounts(),
      unifiedInvalidation.dashboard(),
      this.queryClient.refetchQueries({ queryKey: unifiedQueryKeys.accounts.totalBalance() }),
      this.queryClient.refetchQueries({ queryKey: unifiedQueryKeys.reports.dashboard() }),
    ]);
  }

  /**
   * Sincroniza eventos de transferência
   */
  private async syncTransferEvents(events: SyncEvent[]) {
    // Transferências afetam tanto contas quanto transações
    await Promise.all([
      unifiedInvalidation.accounts(),
      unifiedInvalidation.transactions(),
      unifiedInvalidation.dashboard(),
    ]);
  }

  /**
   * Sincroniza eventos de operação em lote
   */
  private async syncBulkOperationEvents(events: SyncEvent[]) {
    // Operações em lote requerem invalidação completa
    await unifiedInvalidation.allFinancialData();
    
    // Refetch forçado de dados críticos
    await Promise.all([
      this.queryClient.refetchQueries({ queryKey: unifiedQueryKeys.accounts.summary() }),
      this.queryClient.refetchQueries({ queryKey: unifiedQueryKeys.transactions.recent() }),
      this.queryClient.refetchQueries({ queryKey: unifiedQueryKeys.reports.dashboard() }),
    ]);
  }

  /**
   * Força sincronização completa
   */
  async forceSyncAll() {
    logComponents.info("Forçando sincronização completa");
    
    try {
      await unifiedInvalidation.allFinancialData();
      
      // Refetch de todas as queries críticas
      await Promise.all([
        this.queryClient.refetchQueries({ queryKey: unifiedQueryKeys.accounts.all() }),
        this.queryClient.refetchQueries({ queryKey: unifiedQueryKeys.transactions.all() }),
        this.queryClient.refetchQueries({ queryKey: unifiedQueryKeys.reports.all() }),
      ]);

      logComponents.info("Sincronização completa finalizada");
    } catch (error) {
      logComponents.error("Erro na sincronização completa:", error);
      throw error;
    }
  }

  /**
   * Configura listeners globais
   */
  private setupGlobalListeners() {
    // Listener para mudanças de foco da janela
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        logComponents.info("Janela ganhou foco - verificando sincronização");
        this.addSyncEvent({
          type: 'bulk_operation',
          action: 'update',
          metadata: { reason: 'window_focus' }
        });
      });

      // Listener para antes de sair da página
      window.addEventListener('beforeunload', () => {
        // Processar fila pendente imediatamente
        if (this.syncQueue.length > 0) {
          logComponents.info("Processando fila pendente antes de sair da página");
          // Nota: Em beforeunload, operações assíncronas podem não completar
          // mas tentamos processar o que for possível
        }
      });

      // Listener para mudanças de conectividade
      window.addEventListener('online', () => {
        logComponents.info("Conexão restaurada - sincronizando dados");
        this.addSyncEvent({
          type: 'bulk_operation',
          action: 'update',
          metadata: { reason: 'connection_restored' }
        });
      });
    }
  }

  /**
   * Obtém estatísticas da fila de sincronização
   */
  getQueueStats() {
    return {
      queueLength: this.syncQueue.length,
      isProcessing: this.isProcessing,
      listenersCount: this.syncListeners.length,
    };
  }

  /**
   * Limpa a fila de sincronização
   */
  clearQueue() {
    this.syncQueue = [];
    logComponents.info("Fila de sincronização limpa");
  }
}

// Instância global do middleware
let globalSyncMiddleware: SyncMiddleware | null = null;

/**
 * Obtém ou cria a instância global do middleware de sincronização
 */
export function getSyncMiddleware(queryClient?: QueryClient): SyncMiddleware {
  if (!globalSyncMiddleware && queryClient) {
    globalSyncMiddleware = new SyncMiddleware(queryClient);
    logComponents.info("Middleware de sincronização global criado");
  }
  
  if (!globalSyncMiddleware) {
    throw new Error("SyncMiddleware não foi inicializado. Forneça um QueryClient.");
  }
  
  return globalSyncMiddleware;
}

/**
 * Hook para usar o middleware de sincronização
 */
export function useSyncMiddleware() {
  return getSyncMiddleware();
}