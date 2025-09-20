"use client";

import { useCallback, useRef, useState } from "react";
import { useDebounce } from "../hooks/use-debounce";

interface UseOptimizedDeletionOptions {
  debounceMs?: number;
  throttleMs?: number;
  maxBatchSize?: number;
  onDelete?: (ids: string[]) => Promise<void>;
  onOptimisticDelete?: (ids: string[]) => void;
  onError?: (error: Error, ids: string[]) => void;
}

interface DeletionState {
  isDeleting: boolean;
  pendingDeletions: Set<string>;
  failedDeletions: Set<string>;
  lastDeletionTime: number;
}

export function useOptimizedDeletion(
  options: UseOptimizedDeletionOptions = {},
) {
  const {
    debounceMs = 300,
    throttleMs = 1000,
    maxBatchSize = 10,
    onDelete,
    onOptimisticDelete,
    onError,
  } = options;

  const [state, setState] = useState<DeletionState>({
    isDeleting: false,
    pendingDeletions: new Set(),
    failedDeletions: new Set(),
    lastDeletionTime: 0,
  });

  const batchTimerRef = useRef<NodeJS.Timeout>();
  const throttleTimerRef = useRef<NodeJS.Timeout>();
  const pendingBatchRef = useRef<Set<string>>(new Set());

  // Debounced batch processing
  const debouncedBatchProcess = useDebounce(
    useCallback(async () => {
      const idsToDelete = Array.from(pendingBatchRef.current);
      if (idsToDelete.length === 0) return;

      // Limpar o batch atual
      pendingBatchRef.current.clear();

      // Atualizar estado para indicar que está deletando
      setState((prev) => ({
        ...prev,
        isDeleting: true,
        pendingDeletions: new Set([...prev.pendingDeletions, ...idsToDelete]),
      }));

      try {
        // Executar exclusão otimista primeiro
        if (onOptimisticDelete) {
          onOptimisticDelete(idsToDelete);
        }

        // Executar exclusão real
        if (onDelete) {
          await onDelete(idsToDelete);
        }

        // Sucesso - remover dos pendentes
        setState((prev) => {
          const newPending = new Set(prev.pendingDeletions);
          idsToDelete.forEach((id) => newPending.delete(id));

          return {
            ...prev,
            pendingDeletions: newPending,
            isDeleting: newPending.size > 0,
            lastDeletionTime: Date.now(),
          };
        });
      } catch (error) {
        // Erro - mover para falhas e remover dos pendentes
        setState((prev) => {
          const newPending = new Set(prev.pendingDeletions);
          const newFailed = new Set(prev.failedDeletions);

          idsToDelete.forEach((id) => {
            newPending.delete(id);
            newFailed.add(id);
          });

          return {
            ...prev,
            pendingDeletions: newPending,
            failedDeletions: newFailed,
            isDeleting: newPending.size > 0,
          };
        });

        if (onError) {
          onError(error as Error, idsToDelete);
        }
      }
    }, [onDelete, onOptimisticDelete, onError]),
    debounceMs,
  );

  // Throttled deletion to prevent overwhelming the server
  const throttledDelete = useCallback(
    (id: string) => {
      const now = Date.now();
      const timeSinceLastDeletion = now - state.lastDeletionTime;

      // Adicionar ao batch
      pendingBatchRef.current.add(id);

      // Se o batch está cheio, processar imediatamente
      if (pendingBatchRef.current.size >= maxBatchSize) {
        debouncedBatchProcess();
        return;
      }

      // Se passou tempo suficiente desde a última exclusão, processar
      if (timeSinceLastDeletion >= throttleMs) {
        debouncedBatchProcess();
      } else {
        // Caso contrário, agendar para depois do throttle
        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
        }

        throttleTimerRef.current = setTimeout(() => {
          debouncedBatchProcess();
        }, throttleMs - timeSinceLastDeletion);
      }
    },
    [state.lastDeletionTime, throttleMs, maxBatchSize, debouncedBatchProcess],
  );

  // Exclusão em lote
  const batchDelete = useCallback(
    (ids: string[]) => {
      ids.forEach((id) => pendingBatchRef.current.add(id));
      debouncedBatchProcess();
    },
    [debouncedBatchProcess],
  );

  // Retry failed deletions
  const retryFailedDeletions = useCallback(() => {
    const failedIds = Array.from(state.failedDeletions);
    if (failedIds.length === 0) return;

    setState((prev) => ({
      ...prev,
      failedDeletions: new Set(),
    }));

    batchDelete(failedIds);
  }, [state.failedDeletions, batchDelete]);

  // Cancel pending deletions
  const cancelPendingDeletions = useCallback(() => {
    pendingBatchRef.current.clear();

    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
    }

    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
    }

    setState((prev) => ({
      ...prev,
      pendingDeletions: new Set(),
      isDeleting: false,
    }));
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
    }
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
    }
  }, []);

  return {
    // State
    isDeleting: state.isDeleting,
    pendingCount: state.pendingDeletions.size,
    failedCount: state.failedDeletions.size,
    batchSize: pendingBatchRef.current.size,

    // Actions
    deleteItem: throttledDelete,
    batchDelete,
    retryFailedDeletions,
    cancelPendingDeletions,
    cleanup,

    // Utilities
    isPending: (id: string) => state.pendingDeletions.has(id),
    isFailed: (id: string) => state.failedDeletions.has(id),
    isInBatch: (id: string) => pendingBatchRef.current.has(id),
  };
}

export default useOptimizedDeletion;
