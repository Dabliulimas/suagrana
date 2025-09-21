import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { logComponents } from "../../lib/logger";
import { unifiedQueryKeys } from "../../lib/react-query/unified-query-client";
import { getSyncMiddleware } from "../../lib/middleware/sync-middleware";

/**
 * Hook para forçar sincronização global de dados
 * Útil para garantir que todos os dados estejam atualizados
 */
export function useGlobalSync() {
  const queryClient = useQueryClient();

  const forceGlobalSync = useCallback(async () => {
    try {
      logComponents.info("Iniciando sincronização global de dados...");
      
      // 1. Invalidar todas as queries principais
      await Promise.all([
        // Transações
        queryClient.invalidateQueries({ queryKey: unifiedQueryKeys.transactions.all() }),
        queryClient.invalidateQueries({ queryKey: unifiedQueryKeys.transactions.recent() }),
        
        // Contas
        queryClient.invalidateQueries({ queryKey: unifiedQueryKeys.accounts.all() }),
        queryClient.invalidateQueries({ queryKey: unifiedQueryKeys.accounts.summary() }),
        queryClient.invalidateQueries({ queryKey: unifiedQueryKeys.accounts.totalBalance() }),
        
        // Relatórios e Dashboard
        queryClient.invalidateQueries({ queryKey: unifiedQueryKeys.reports.dashboard() }),
        queryClient.invalidateQueries({ queryKey: unifiedQueryKeys.reports.monthly() }),
        queryClient.invalidateQueries({ queryKey: unifiedQueryKeys.reports.categoryBreakdown() }),
      ]);

      // 2. Refetch dados críticos
      await Promise.all([
        queryClient.refetchQueries({ queryKey: unifiedQueryKeys.transactions.recent() }),
        queryClient.refetchQueries({ queryKey: unifiedQueryKeys.accounts.summary() }),
        queryClient.refetchQueries({ queryKey: unifiedQueryKeys.reports.dashboard() }),
      ]);

      // 3. Notificar middleware para sincronização adicional
      const syncMiddleware = getSyncMiddleware();
      syncMiddleware.addSyncEvent({
        type: 'global',
        action: 'sync',
        entityId: 'all',
        metadata: { timestamp: Date.now() }
      });

      logComponents.info("Sincronização global concluída com sucesso");
      toast.success("Dados sincronizados com sucesso!");
      
    } catch (error) {
      logComponents.error("Erro na sincronização global:", error);
      toast.error("Erro ao sincronizar dados. Tente novamente.");
    }
  }, [queryClient]);

  const refreshCurrentPage = useCallback(async () => {
    try {
      // Invalidar apenas queries ativas (que estão sendo usadas na página atual)
      await queryClient.invalidateQueries({ 
        type: 'active',
        refetchType: 'active'
      });
      
      logComponents.info("Página atual atualizada");
      toast.success("Página atualizada!");
      
    } catch (error) {
      logComponents.error("Erro ao atualizar página:", error);
      toast.error("Erro ao atualizar página");
    }
  }, [queryClient]);

  const clearAllCache = useCallback(async () => {
    try {
      // Limpar todo o cache e refazer todas as queries
      queryClient.clear();
      
      logComponents.info("Cache limpo completamente");
      toast.success("Cache limpo! Recarregando dados...");
      
    } catch (error) {
      logComponents.error("Erro ao limpar cache:", error);
      toast.error("Erro ao limpar cache");
    }
  }, [queryClient]);

  return {
    forceGlobalSync,
    refreshCurrentPage,
    clearAllCache,
  };
}

/**
 * Hook para verificar status de sincronização
 */
export function useSyncStatus() {
  const queryClient = useQueryClient();

  const getSyncStatus = useCallback(() => {
    const queries = queryClient.getQueryCache().getAll();
    
    const status = {
      total: queries.length,
      fetching: queries.filter(q => q.state.isFetching).length,
      stale: queries.filter(q => q.state.isStale).length,
      error: queries.filter(q => q.state.isError).length,
      success: queries.filter(q => q.state.isSuccess).length,
    };

    return status;
  }, [queryClient]);

  const isSyncing = useCallback(() => {
    const queries = queryClient.getQueryCache().getAll();
    return queries.some(q => q.state.isFetching);
  }, [queryClient]);

  return {
    getSyncStatus,
    isSyncing,
  };
}